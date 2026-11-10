// The leaderboard: every player's points, mastered questions and best streak.
import { db } from '../db/client.js';
import { json, requireUser, HttpError } from '../http.js';
import { FEATURES } from '../config/course.js';
import { bank } from '../quiz/bank.js';

export const routes = {
  'GET leaderboard': async (request) => {
    const user = await requireUser(request);
    if (!FEATURES.leaderboard) throw new HttpError(404, 'not_found', 'The leaderboard is turned off for this course.');
    const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get('limit')) || 100, 1), 500);
    const sql = db();
    const { list, byId } = bank();
    const [players, latest] = await Promise.all([
      sql`
        select u.id, u.nickname, u.best_streak, coalesce(sum(a.points), 0)::int as points, count(a.id)::int as answered
        from users u left join attempts a on a.user_id = u.id group by u.id`,
      sql`
        select distinct on (user_id, question_id) user_id, question_id, correct
        from attempts order by user_id, question_id, id desc`,
    ]);
    const mastered = new Map();
    for (const row of latest) {
      if (row.correct && byId.has(row.question_id)) mastered.set(row.user_id, (mastered.get(row.user_id) || 0) + 1);
    }
    const ranked = players
      .map((p) => ({
        nickname: p.nickname,
        points: p.points,
        mastered: mastered.get(p.id) || 0,
        answered: p.answered,
        bestStreak: p.best_streak,
        me: p.id === user.id,
      }))
      .sort((a, b) => b.points - a.points || b.mastered - a.mastered || a.nickname.localeCompare(b.nickname))
      .map((p, i) => ({ rank: i + 1, ...p }));
    const top = ranked.slice(0, limit);
    const mine = ranked.find((p) => p.me);
    return json({ total: list.length, players: top, me: mine && !top.includes(mine) ? mine : null });
  },
};
