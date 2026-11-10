// Round and scope helpers shared by quiz routes: what a round covers, which questions are in
// it, the player's per-question history, and runs kept up to date with the current bank.
import { HttpError } from '../http.js';
import { shuffle } from '../util.js';
import { FEATURES } from '../config/course.js';
import { bank } from './bank.js';

// A round covers the whole bank ('all'), one lecture/topic ('t:<topic>') or the player's
// custom selection ('custom': chosen lectures and length, fixed when the round starts).
export function cleanScope(raw) {
  const scope = raw == null || raw === '' ? 'all' : String(raw);
  if (scope.length > 300 || (scope !== 'all' && scope !== 'custom' && !scope.startsWith('t:'))) {
    throw new HttpError(400, 'bad_scope', 'Unknown lecture.');
  }
  return scope;
}

// Questions in a round's scope. With includePensum false, pensum-only questions are left out.
// A custom round's questions are fixed at start, so its scope here is the whole bank.
export function scopeQuestions(scope, includePensum = true) {
  const { list } = bank();
  const topic = scope === 'all' || scope === 'custom' ? null : scope.slice(2);
  return list.filter((q) => (topic === null || q.topic === topic) && (includePensum || !q.pensum));
}

// A question as the player sees it before answering: no answer, no explanation.
export function publicQuestion(q) {
  const order = q.shuffle ? shuffle(q.options.map((_, i) => i)) : q.options.map((_, i) => i);
  return {
    id: q.id,
    question: q.question,
    topic: q.topic,
    pensum: q.pensum,
    code: q.code || undefined,
    hints: FEATURES.hints && q.hints.length ? q.hints : undefined,
    options: order.map((i) => ({ i, text: q.options[i] })),
  };
}

// Per-question history for one player: attempts, ever correct, latest answer correct.
export async function questionStates(sql, userId) {
  const rows = await sql`
    select question_id, count(*)::int as n, bool_or(correct) as ever,
           (array_agg(correct order by id desc))[1] as last
    from attempts where user_id = ${userId} group by question_id`;
  return new Map(rows.map((r) => [r.question_id, r]));
}

// "Hard for everyone": questions that many players miss on their first try.
// Only each player's first answer to a question counts, and only if it was not given from the
// hard list itself (people answer differently once they are told a question is hard).
// A question qualifies once HARD_MIN_PLAYERS players have answered it and at least
// HARD_MIN_MISS of them missed it. Until then the feature stays hidden.
export const HARD_MIN_PLAYERS = Math.max(1, Number(process.env.HARD_MIN_PLAYERS) || 3);
const HARD_MIN_MISS = Math.min(1, Math.max(0, Number(process.env.HARD_MIN_MISS) || 0.5));

export async function hardQuestions(sql) {
  const { byId } = bank();
  const rows = await sql`
    select question_id, count(*)::int as players, count(*) filter (where not correct)::int as missed
    from (
      select distinct on (user_id, question_id) question_id, correct, mode
      from attempts order by user_id, question_id, id
    ) first_try
    where mode <> 'hard'
    group by question_id`;
  return rows
    .filter((r) => byId.has(r.question_id) && r.players >= HARD_MIN_PLAYERS && r.missed / r.players >= HARD_MIN_MISS)
    .map((r) => ({ id: r.question_id, players: r.players, missRate: r.missed / r.players }))
    .sort((a, b) => b.missRate - a.missRate || b.players - a.players);
}

// Loads the player's test round and brings it up to date with the current question bank:
// removed questions are dropped and newly added ones are appended (shuffled) to an unfinished round.
// Turning pensum off drops unanswered pensum questions from the round; turning it on adds them back.
export async function loadRun(sql, user, scope = 'all') {
  const userId = user.id;
  const [run] = await sql`
    select question_order, position, finished_at from test_runs where user_id = ${userId} and scope = ${scope}`;
  if (!run) return null;
  const allIds = new Set(scopeQuestions(scope).map((q) => q.id));
  const inScope = scopeQuestions(scope, user.include_pensum);
  const ids = new Set(inScope.map((q) => q.id));
  const old = run.question_order;
  const done = old.slice(0, run.position).filter((id) => allIds.has(id));
  let rest = old.slice(run.position).filter((id) => ids.has(id));
  let finished = Boolean(run.finished_at);
  // New questions join unfinished full and lecture rounds; a custom round keeps the questions it started with.
  if (!finished && scope !== 'custom') {
    const inRound = new Set(old);
    rest = rest.concat(shuffle(inScope.map((q) => q.id).filter((id) => !inRound.has(id))));
  }
  if (!finished && !rest.length) finished = true;
  const order = done.concat(rest);
  const changed = order.length !== old.length || order.some((id, i) => id !== old[i]);
  if (changed || finished !== Boolean(run.finished_at)) {
    await sql`
      update test_runs set question_order = ${sql.json(order)}, position = ${done.length},
        finished_at = ${finished ? run.finished_at || new Date() : null}
      where user_id = ${userId} and scope = ${scope}`;
  }
  return { order, position: done.length, finished };
}

export function runView(run, scope) {
  if (!run) return null;
  const current = run.finished ? null : publicQuestion(bank().byId.get(run.order[run.position]));
  return { scope, position: run.position, total: run.order.length, finished: run.finished, current };
}

// Custom round: random questions from the chosen lectures, up to `count` (or all of them when
// count is null). With unmastered set, questions whose latest answer was right are left out.
// The pensum switch applies as everywhere else. Asking for more than exist just gives what exists.
export async function customOrder(sql, user, body) {
  const topics = Array.isArray(body.topics) ? new Set(body.topics.map(String)) : new Set();
  if (!topics.size) throw new HttpError(400, 'no_topics', 'Pick at least one lecture.');
  const count = body.count == null ? null : Number(body.count);
  if (count !== null && !(Number.isInteger(count) && count > 0 && count <= 1000)) {
    throw new HttpError(400, 'bad_count', 'Invalid number of questions.');
  }
  const states = body.unmastered ? await questionStates(sql, user.id) : null;
  const pool = bank().list.filter(
    (q) => topics.has(q.topic) && (user.include_pensum || !q.pensum) && !(states && states.get(q.id)?.last),
  );
  const order = shuffle(pool.map((q) => q.id));
  return count === null ? order : order.slice(0, count);
}
