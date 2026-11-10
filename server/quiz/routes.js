// Quiz mode routes: rounds (test), pensum settings and skips, per-lecture topics, mistakes,
// hard-for-everyone, correct answers, and answering a question.
import { db } from '../db/client.js';
import { json, readBody, requireUser, HttpError } from '../http.js';
import { shuffle, byTopicName } from '../util.js';
import { LECTURES, SAMPLES_FILE } from '../config/course.js';
import { bank } from './bank.js';
import { pointsFor } from './points.js';
import {
  cleanScope, scopeQuestions, publicQuestion, questionStates, hardQuestions, HARD_MIN_PLAYERS,
  loadRun, runView, customOrder,
} from './scope.js';

export const routes = {
  'GET test': async (request) => {
    const user = await requireUser(request);
    const scope = cleanScope(new URL(request.url).searchParams.get('scope'));
    return json({ run: runView(await loadRun(db(), user, scope), scope) });
  },

  'POST test/start': async (request) => {
    const user = await requireUser(request);
    const body = await readBody(request);
    const scope = cleanScope(body.scope);
    const sql = db();
    const order = scope === 'custom'
      ? await customOrder(sql, user, body)
      : shuffle(scopeQuestions(scope, user.include_pensum).map((q) => q.id));
    if (!order.length) {
      throw new HttpError(409, 'no_questions', scope === 'custom' ? 'No questions match those choices.' : 'There are no questions here yet.');
    }
    await sql`
      insert into test_runs (user_id, scope, question_order, position) values (${user.id}, ${scope}, ${sql.json(order)}, 0)
      on conflict (user_id, scope) do update set question_order = excluded.question_order, position = 0,
        started_at = now(), finished_at = null`;
    return json({ run: runView(await loadRun(sql, user, scope), scope) });
  },

  'POST settings': async (request) => {
    const user = await requireUser(request);
    const { includePensum } = await readBody(request);
    if (typeof includePensum !== 'boolean') throw new HttpError(400, 'bad_setting', 'Invalid setting.');
    await db()`update users set include_pensum = ${includePensum} where id = ${user.id}`;
    return json({ includePensum });
  },

  // Skips the current pensum-only question in a round: no points, no attempt, not a mistake.
  'POST skip': async (request) => {
    const user = await requireUser(request);
    const body = await readBody(request);
    const scope = cleanScope(body.scope);
    const q = bank().byId.get(body.questionId);
    if (!q) throw new HttpError(404, 'unknown_question', 'That question no longer exists.');
    if (!q.pensum) throw new HttpError(400, 'not_skippable', 'Only pensum-only questions can be skipped.');
    const sql = db();
    const [moved] = await sql`
      update test_runs set position = position + 1,
        finished_at = case when position + 1 >= jsonb_array_length(question_order) then now() else null end
      where user_id = ${user.id} and scope = ${scope} and finished_at is null
        and question_order ->> position = ${q.id}
      returning position`;
    if (!moved) throw new HttpError(409, 'out_of_sync', 'That question was already answered.');
    return json({ ok: true });
  },

  // One row per lecture/topic with the player's progress, in natural order (Lecture 2 before Lecture 10).
  'GET topics': async (request) => {
    const user = await requireUser(request);
    const sql = db();
    const [states, runs] = await Promise.all([
      questionStates(sql, user.id),
      sql`
        select scope, position, jsonb_array_length(question_order)::int as total, finished_at
        from test_runs where user_id = ${user.id} and scope like 't:%'`,
    ]);
    const runByScope = new Map(runs.map((r) => [r.scope, r]));
    const groups = new Map();
    // Every course lecture is listed, including ones without questions yet. ready = has questions
    // of its own, not only samples.
    const blank = (topic) => ({ topic, scope: `t:${topic}`, total: 0, mastered: 0, mistakes: 0, playable: 0, unmastered: 0, ready: false });
    for (const topic of LECTURES) groups.set(topic, blank(topic));
    for (const q of bank().list) {
      // playable / unmastered: what a custom round can draw from, with the pensum switch applied.
      const g = groups.get(q.topic) || blank(q.topic);
      g.total++;
      if (q.file !== SAMPLES_FILE) g.ready = true;
      const s = states.get(q.id);
      if (s?.last) g.mastered++;
      else if (s && (user.include_pensum || !q.pensum)) g.mistakes++;
      if (user.include_pensum || !q.pensum) {
        g.playable++;
        if (!s?.last) g.unmastered++;
      }
      groups.set(q.topic, g);
    }
    const topics = [...groups.values()]
      .sort((a, b) => (!a.topic) - !b.topic || byTopicName(a.topic, b.topic))
      .map((g) => {
        const r = runByScope.get(g.scope);
        return { ...g, run: r ? { position: r.position, total: r.total, finished: Boolean(r.finished_at) } : null };
      });
    return json({ topics });
  },

  'GET mistakes': async (request) => {
    const user = await requireUser(request);
    const scope = cleanScope(new URL(request.url).searchParams.get('scope'));
    const allowed = new Set(scopeQuestions(scope, user.include_pensum).map((q) => q.id));
    const { byId } = bank();
    const states = await questionStates(db(), user.id);
    const ids = [...states.values()].filter((s) => !s.last && allowed.has(s.question_id)).map((s) => s.question_id);
    return json({ questions: shuffle(ids).map((id) => publicQuestion(byId.get(id))) });
  },

  // Hard for everyone, within the scope and the player's pensum setting. Questions the player
  // has not mastered come first, then hardest first.
  'GET hard': async (request) => {
    const user = await requireUser(request);
    const scope = cleanScope(new URL(request.url).searchParams.get('scope'));
    const allowed = new Set(scopeQuestions(scope, user.include_pensum).map((q) => q.id));
    const { byId } = bank();
    const sql = db();
    const [hard, states] = await Promise.all([hardQuestions(sql), questionStates(sql, user.id)]);
    const status = (id) => {
      const s = states.get(id);
      return !s ? 'new' : s.last ? 'mastered' : 'mistake';
    };
    const rank = { mistake: 0, new: 1, mastered: 2 };
    const questions = hard
      .filter((x) => allowed.has(x.id))
      .map((x) => ({ ...publicQuestion(byId.get(x.id)), players: x.players, missRate: x.missRate, status: status(x.id) }))
      .sort((a, b) => rank[a.status] - rank[b.status] || b.missRate - a.missRate);
    return json({ questions, minPlayers: HARD_MIN_PLAYERS });
  },

  'GET correct': async (request) => {
    const user = await requireUser(request);
    const states = await questionStates(db(), user.id);
    const questions = bank()
      .list.filter((q) => states.get(q.id)?.last)
      .map(({ file, ...q }) => ({ ...q, attempts: states.get(q.id).n }));
    return json({ questions });
  },

  'POST answer': async (request) => {
    const user = await requireUser(request);
    const body = await readBody(request);
    const { questionId, chosen, mode } = body;
    const scope = cleanScope(body.scope);
    const q = bank().byId.get(questionId);
    if (!q) throw new HttpError(404, 'unknown_question', 'That question no longer exists.');
    if (!Number.isInteger(chosen) || chosen < 0 || chosen >= q.options.length) {
      throw new HttpError(400, 'bad_choice', 'Invalid choice.');
    }
    if (!['test', 'mistakes', 'hard'].includes(mode)) throw new HttpError(400, 'bad_mode', 'Invalid mode.');
    const sql = db();
    const result = await sql.begin(async (tx) => {
      // Locking the player row serialises a player's answers, so double clicks cannot double count.
      const [u] = await tx`select streak, best_streak from users where id = ${user.id} for update`;
      if (mode === 'test') {
        const [run] = await tx`
          select question_order, position, finished_at from test_runs where user_id = ${user.id} and scope = ${scope}`;
        if (!run || run.finished_at || run.question_order[run.position] !== questionId) {
          throw new HttpError(409, 'out_of_sync', 'That question was already answered.');
        }
      }
      const [prev] = await tx`
        select count(*)::int as n, coalesce(bool_or(correct), false) as ever,
               (array_agg(correct order by id desc))[1] as last
        from attempts where user_id = ${user.id} and question_id = ${questionId}`;
      if (mode === 'mistakes' && !(prev.n > 0 && prev.last === false)) {
        throw new HttpError(409, 'not_a_mistake', 'That question is no longer in your mistakes.');
      }
      const correct = chosen === q.answer;
      const points = pointsFor({ correct, previousAttempts: prev.n, everCorrect: prev.ever });
      const streak = correct ? u.streak + 1 : 0;
      const bestStreak = Math.max(u.best_streak, streak);
      await tx`
        insert into attempts (user_id, question_id, chosen, correct, points, mode)
        values (${user.id}, ${questionId}, ${chosen}, ${correct}, ${points}, ${mode})`;
      await tx`update users set streak = ${streak}, best_streak = ${bestStreak} where id = ${user.id}`;
      if (mode === 'test') {
        await tx`
          update test_runs set position = position + 1,
            finished_at = case when position + 1 >= jsonb_array_length(question_order) then now() else null end
          where user_id = ${user.id} and scope = ${scope}`;
      }
      return { correct, points, streak, bestStreak };
    });
    return json({ ...result, answer: q.answer, explanation: q.explanation, source: q.source });
  },
};
