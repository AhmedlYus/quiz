// Oral mode API (/api/oral/*). Works like quiz mode, from the same course.json lectures:
// rounds over all questions, one lecture or a custom pick, pausable and resumable; plus an exam
// simulation that draws a few questions from different lectures. Instead of right/wrong, players
// rate their own answer (missed / partial / solid). Only ratings are stored; transcripts and typed
// answers stay in the browser.
//
// Loaded lazily by server/index.js, which passes in its helpers. Own tables (oral_*), own schema setup.
import { db } from '../db/client.js';
import { oralBank } from './bank.js';
import { FEATURES, LECTURES, MODES, ORAL, SAMPLES_FILE } from '../config/course.js';
import { byTopicName } from '../util.js';

const RATINGS = ['missed', 'partial', 'solid'];
const RATE_MODES = ['round', 'practice', 'exam'];

const SCHEMA = `
create table if not exists oral_attempts (
  id bigserial primary key,
  user_id int not null references users(id) on delete cascade,
  question_id text not null,
  rating text not null,
  covered int,
  key_points int,
  hints_used int not null default 0,
  mode text not null,
  created_at timestamptz not null default now()
);
create index if not exists oral_attempts_user_question on oral_attempts (user_id, question_id, id);
create table if not exists oral_runs (
  user_id int not null references users(id) on delete cascade,
  scope text not null,
  question_order jsonb not null,
  position int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (user_id, scope)
);
`;

let ready;
function ensureOralSchema() {
  if (!ready) {
    ready = db()
      .begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(727275)`;
        await tx.unsafe(SCHEMA);
      })
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}

export function createOralRoutes({ json, HttpError, requireUser, readBody, shuffle }) {
  // A round covers all oral questions ('all'), one lecture ('t:<topic>'), a custom pick ('custom'),
  // an exam simulation ('exam'), or only the write-a-query questions ('query', query practice).
  // With oral mode off, query practice is the only scope.
  function cleanScope(raw) {
    const scope = raw == null || raw === '' ? 'all' : String(raw);
    if (scope.length > 300 || !['all', 'custom', 'exam', 'query'].includes(scope) && !scope.startsWith('t:')) {
      throw new HttpError(400, 'bad_scope', 'Unknown lecture.');
    }
    if (scope === 'query' ? !MODES.query : !MODES.oral) throw new HttpError(404, 'mode_off', 'That mode is switched off for this course.');
    return scope;
  }

  // With query practice on, write-a-query questions belong to it alone: oral stays spoken.
  const isOral = (q) => !MODES.query || q.type !== 'query';

  function scopeQuestions(scope, includePensum = true) {
    const topic = scope.startsWith('t:') ? scope.slice(2) : null;
    const fits = scope === 'query' ? (q) => q.type === 'query' : isOral;
    return oralBank().list.filter((q) => (topic === null || q.topic === topic) && fits(q) && (includePensum || !q.pensum));
  }

  // The question as shown before answering: no key points or model answer.
  function publicQuestion(q) {
    return {
      id: q.id,
      type: q.type,
      topic: q.topic,
      prompt: q.prompt,
      code: q.code || undefined,
      hints: FEATURES.hints && q.hints.length ? q.hints : undefined,
      keyPointCount: q.keyPoints.length,
      seconds: q.seconds || ORAL.timerSeconds,
      pensum: q.pensum,
    };
  }

  // Everything revealed after answering.
  function revealed(q) {
    return {
      id: q.id,
      keyPoints: q.keyPoints,
      modelAnswer: q.modelAnswer,
      alternatives: q.alternatives,
      followUps: q.followUps,
      source: q.source,
    };
  }

  // Latest rating per question for one player.
  async function ratingStates(sql, userId) {
    const rows = await sql`
      select distinct on (question_id) question_id, rating
      from oral_attempts where user_id = ${userId} order by question_id, id desc`;
    return new Map(rows.map((r) => [r.question_id, r.rating]));
  }

  // Loads a round and brings it up to date with the current bank (like quiz rounds): removed
  // questions drop out; new ones join unfinished full and lecture rounds.
  async function loadRun(sql, user, scope) {
    const [run] = await sql`
      select question_order, position, started_at, finished_at from oral_runs
      where user_id = ${user.id} and scope = ${scope}`;
    if (!run) return null;
    const { byId } = oralBank();
    const old = run.question_order;
    const done = old.slice(0, run.position).filter((id) => byId.has(id));
    const fits = scope === 'query' ? () => true : (id) => isOral(byId.get(id));
    let rest = old.slice(run.position).filter((id) => byId.has(id) && fits(id) && (user.include_pensum || !byId.get(id).pensum));
    let finished = Boolean(run.finished_at);
    if (!finished && (scope === 'all' || scope === 'query' || scope.startsWith('t:'))) {
      const inRound = new Set(old);
      rest = rest.concat(shuffle(scopeQuestions(scope, user.include_pensum).map((q) => q.id).filter((id) => !inRound.has(id))));
    }
    if (!finished && !rest.length && scope !== 'exam') finished = true;
    const order = done.concat(rest);
    const changed = order.length !== old.length || order.some((id, i) => id !== old[i]);
    if (changed || finished !== Boolean(run.finished_at)) {
      await sql`
        update oral_runs set question_order = ${sql.json(order)}, position = ${done.length},
          finished_at = ${finished ? run.finished_at || new Date() : null}
        where user_id = ${user.id} and scope = ${scope}`;
    }
    return { order, position: done.length, finished, startedAt: run.started_at };
  }

  function runView(run, scope) {
    if (!run) return null;
    const { byId } = oralBank();
    const current = run.finished || scope === 'exam' ? null : publicQuestion(byId.get(run.order[run.position]));
    return { scope, position: run.position, total: run.order.length, finished: run.finished, current };
  }

  function examView(run) {
    if (!run) return null;
    const { byId } = oralBank();
    return {
      startedAt: run.startedAt,
      finished: run.finished,
      questions: run.order.map((id) => publicQuestion(byId.get(id))),
      settings: ORAL.exam,
    };
  }

  // Custom round: random questions from the chosen lectures (and types), up to count.
  async function customOrder(sql, user, body) {
    const topics = Array.isArray(body.topics) ? new Set(body.topics.map(String)) : new Set();
    if (!topics.size) throw new HttpError(400, 'no_topics', 'Pick at least one lecture.');
    const types = Array.isArray(body.types) && body.types.length ? new Set(body.types.map(String)) : null;
    const count = body.count == null ? null : Number(body.count);
    if (count !== null && !(Number.isInteger(count) && count > 0 && count <= 500)) {
      throw new HttpError(400, 'bad_count', 'Invalid number of questions.');
    }
    const states = body.notSolid ? await ratingStates(sql, user.id) : null;
    const pool = oralBank().list.filter((q) =>
      isOral(q) && topics.has(q.topic) && (!types || types.has(q.type)) && (user.include_pensum || !q.pensum) &&
      !(states && states.get(q.id) === 'solid'));
    const order = shuffle(pool.map((q) => q.id));
    return count === null ? order : order.slice(0, count);
  }

  // Exam simulation: N questions from different lectures, preferring ones not yet rated solid.
  // Query questions are left out: at the exam you talk, you don't type EPL.
  async function examOrder(sql, user) {
    const states = await ratingStates(sql, user.id);
    const pool = shuffle(oralBank().list.filter((q) => q.type !== 'query' && (user.include_pensum || !q.pensum)));
    pool.sort((a, b) => (states.get(a.id) === 'solid') - (states.get(b.id) === 'solid'));
    const picked = [];
    const usedTopics = new Set();
    for (const q of pool) {
      if (picked.length >= ORAL.exam.questions) break;
      if (!usedTopics.has(q.topic)) {
        picked.push(q.id);
        usedTopics.add(q.topic);
      }
    }
    for (const q of pool) {
      if (picked.length >= ORAL.exam.questions) break;
      if (!picked.includes(q.id)) picked.push(q.id);
    }
    return picked;
  }

  async function startRun(sql, user, scope, order) {
    if (!order.length) {
      throw new HttpError(409, 'no_questions', scope === 'custom' ? 'No oral questions match those choices.' : 'There are no oral questions here yet.');
    }
    await sql`
      insert into oral_runs (user_id, scope, question_order, position) values (${user.id}, ${scope}, ${sql.json(order)}, 0)
      on conflict (user_id, scope) do update set question_order = excluded.question_order, position = 0,
        started_at = now(), finished_at = null`;
    return loadRun(sql, user, scope);
  }

  async function setup(request, { oralOnly = false } = {}) {
    if (oralOnly && !MODES.oral) throw new HttpError(404, 'mode_off', 'Oral mode is switched off for this course.');
    const user = await requireUser(request);
    await ensureOralSchema();
    return { user, sql: db() };
  }

  return {
    // Everything the oral home page needs: totals, per-lecture progress and rounds in progress.
    'GET oral/overview': async (request) => {
      const { user, sql } = await setup(request, { oralOnly: true });
      const [states, runs] = await Promise.all([
        ratingStates(sql, user.id),
        sql`
          select scope, position, jsonb_array_length(question_order)::int as total, finished_at
          from oral_runs where user_id = ${user.id}`,
      ]);
      const runByScope = new Map(runs.map((r) => [r.scope, { position: r.position, total: r.total, finished: Boolean(r.finished_at) }]));
      const blank = (topic) => ({ topic, total: 0, playable: 0, solid: 0, partial: 0, missed: 0, ready: false, types: {} });
      const groups = new Map(LECTURES.map((t) => [t, blank(t)]));
      const stats = { total: 0, playable: 0, solid: 0, partial: 0, missed: 0, pensum: 0, query: 0 };
      for (const q of oralBank().list.filter(isOral)) {
        const g = groups.get(q.topic) || blank(q.topic);
        const counted = user.include_pensum || !q.pensum;
        g.total++;
        stats.total++;
        if (q.pensum) stats.pensum++;
        if (q.file !== SAMPLES_FILE) g.ready = true;
        if (counted) {
          g.playable++;
          stats.playable++;
          g.types[q.type] = (g.types[q.type] || 0) + 1;
          if (q.type === 'query') stats.query++;
        }
        const r = states.get(q.id);
        if (r) {
          g[r]++;
          stats[r]++;
        }
        groups.set(q.topic, g);
      }
      const topics = [...groups.values()]
        .sort((a, b) => byTopicName(a.topic, b.topic))
        .map((g) => ({ ...g, scope: `t:${g.topic}`, run: runByScope.get(`t:${g.topic}`) || null }));
      return json({
        stats,
        topics,
        runs: { all: runByScope.get('all') || null, custom: runByScope.get('custom') || null, exam: runByScope.get('exam') || null },
        settings: ORAL,
      });
    },

    'GET oral/run': async (request) => {
      const { user, sql } = await setup(request);
      const scope = cleanScope(new URL(request.url).searchParams.get('scope'));
      if (scope === 'exam') throw new HttpError(400, 'bad_scope', 'Use the exam endpoints for exams.');
      return json({ run: runView(await loadRun(sql, user, scope), scope) });
    },

    'POST oral/run/start': async (request) => {
      const { user, sql } = await setup(request);
      const body = await readBody(request);
      const scope = cleanScope(body.scope);
      if (scope === 'exam') throw new HttpError(400, 'bad_scope', 'Use the exam endpoints for exams.');
      const order = scope === 'custom'
        ? await customOrder(sql, user, body)
        : shuffle(scopeQuestions(scope, user.include_pensum).map((q) => q.id));
      return json({ run: runView(await startRun(sql, user, scope, order), scope) });
    },

    // Key points, model answer and follow-ups, shown after the player has answered.
    'GET oral/reveal': async (request) => {
      await setup(request);
      const q = oralBank().byId.get(new URL(request.url).searchParams.get('id'));
      if (!q) throw new HttpError(404, 'unknown_question', 'That question no longer exists.');
      return json(revealed(q));
    },

    // The player's own rating of an answer. In a round, it also moves the round on.
    'POST oral/rate': async (request) => {
      const { user, sql } = await setup(request);
      const body = await readBody(request);
      const q = oralBank().byId.get(body.questionId);
      if (!q) throw new HttpError(404, 'unknown_question', 'That question no longer exists.');
      if (!RATINGS.includes(body.rating)) throw new HttpError(400, 'bad_rating', 'Pick missed, partial or solid.');
      const mode = RATE_MODES.includes(body.mode) ? body.mode : 'practice';
      const covered = Number.isInteger(body.covered) && body.covered >= 0 && body.covered <= q.keyPoints.length ? body.covered : null;
      const hintsUsed = Number.isInteger(body.hintsUsed) ? Math.min(Math.max(body.hintsUsed, 0), q.hints.length) : 0;
      const scope = mode === 'round' ? cleanScope(body.scope) : null;
      await sql.begin(async (tx) => {
        if (mode === 'round') {
          const [run] = await tx`
            select question_order, position, finished_at from oral_runs
            where user_id = ${user.id} and scope = ${scope} for update`;
          if (!run || run.finished_at || run.question_order[run.position] !== q.id) {
            throw new HttpError(409, 'out_of_sync', 'That question was already answered.');
          }
          await tx`
            update oral_runs set position = position + 1,
              finished_at = case when position + 1 >= jsonb_array_length(question_order) then now() else null end
            where user_id = ${user.id} and scope = ${scope}`;
        }
        await tx`
          insert into oral_attempts (user_id, question_id, rating, covered, key_points, hints_used, mode)
          values (${user.id}, ${q.id}, ${body.rating}, ${covered}, ${q.keyPoints.length}, ${hintsUsed}, ${mode})`;
      });
      return json({ ok: true });
    },

    // Needs work (latest rating missed or partial) or solid, optionally within one lecture.
    'GET oral/list': async (request) => {
      const { user, sql } = await setup(request);
      const params = new URL(request.url).searchParams;
      const filter = params.get('filter') === 'solid' ? 'solid' : 'needs-work';
      const scope = cleanScope(params.get('scope'));
      const states = await ratingStates(sql, user.id);
      const questions = scopeQuestions(scope === 'custom' || scope === 'exam' ? 'all' : scope, user.include_pensum)
        .filter((q) => {
          const r = states.get(q.id);
          return filter === 'solid' ? r === 'solid' : r === 'missed' || r === 'partial';
        })
        .map((q) => ({ ...publicQuestion(q), rating: states.get(q.id) }));
      return json({ questions: filter === 'solid' ? questions : shuffle(questions) });
    },

    'GET oral/exam': async (request) => {
      const { user, sql } = await setup(request, { oralOnly: true });
      return json({ exam: examView(await loadRun(sql, user, 'exam')) });
    },

    'POST oral/exam/start': async (request) => {
      const { user, sql } = await setup(request, { oralOnly: true });
      return json({ exam: examView(await startRun(sql, user, 'exam', await examOrder(sql, user))) });
    },

    'POST oral/exam/finish': async (request) => {
      const { user, sql } = await setup(request, { oralOnly: true });
      await sql`
        update oral_runs set position = jsonb_array_length(question_order), finished_at = coalesce(finished_at, now())
        where user_id = ${user.id} and scope = 'exam'`;
      return json({ ok: true });
    },
  };
}
