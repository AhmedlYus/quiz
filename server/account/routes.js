// Account and site routes: the public course config, the shared course list, nickname + PIN
// registration/login/logout, the signed-in player's home data (stats, runs, flag notices) and
// marking those notices as seen.
import { db } from '../db/client.js';
import { json, readBody, requireUser, HttpError } from '../http.js';
import {
  clearedCookie, createSession, deleteSession, hashPin, sessionCookie, sessionUser, verifyPin,
} from '../auth/session.js';
import { COURSE, LECTURES, publicCourse } from '../config/course.js';
import { bank } from '../quiz/bank.js';
import { questionStates, hardQuestions, loadRun } from '../quiz/scope.js';
import { flagNotices, isAdmin, openFlagCount } from '../quiz/flags.js';

// ---------- shared course list ----------
// Course sites can opt in to a shared list (a JSON file, usually courses.json in the base repo on
// GitHub). Each site fetches it, keeps it for 10 minutes and shows it in its course switcher.
// course.json "directory": { enabled, url, hide: [site urls], only: [site urls], extra: [entries] }.
const DIRECTORY_TTL_MS = 10 * 60 * 1000;
let directoryCache = { at: 0, list: [] };

function cleanEntry(e) {
  if (!e || typeof e !== 'object') return null;
  const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : '');
  let url;
  try {
    url = new URL(e.url);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return null;
  const entry = { code: text(e.code, 20), name: text(e.name, 80), university: text(e.university, 80), url: url.origin + url.pathname.replace(/\/$/, '') };
  return entry.name ? entry : null;
}

const sameSite = (a, b) => {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
};

async function fetchDirectory(url) {
  if (Date.now() - directoryCache.at < DIRECTORY_TTL_MS) return directoryCache.list;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = (Array.isArray(data) ? data : data.courses || []).map(cleanEntry).filter(Boolean).slice(0, 500);
    directoryCache = { at: Date.now(), list };
  } catch (e) {
    console.warn(`Course list unavailable (${e.message}); using the last copy.`);
    directoryCache.at = Date.now() - DIRECTORY_TTL_MS + 60 * 1000; // retry in a minute
  }
  return directoryCache.list;
}

async function directory(host) {
  const d = COURSE.directory || {};
  if (!d.enabled || !d.url) return [];
  const shared = await fetchDirectory(d.url);
  const extra = (d.extra || []).map(cleanEntry).filter(Boolean);
  const hide = d.hide || [];
  const only = Array.isArray(d.only) && d.only.length ? d.only : null;
  const seen = new Set();
  return [...shared, ...extra]
    .filter((e) => !hide.some((h) => sameSite(h, e.url)))
    .filter((e) => !only || only.some((o) => sameSite(o, e.url)))
    .filter((e) => !seen.has(e.url) && seen.add(e.url))
    .map((e) => ({ ...e, current: new URL(e.url).host === host }))
    .sort((a, b) => Number(b.current) - Number(a.current) || a.university.localeCompare(b.university) || a.code.localeCompare(b.code));
}

// Mastered counts the whole syllabus (pensum included), so 100% always means everything.
// Mistakes count only what the player currently studies, so the Study mistakes button matches its list.
async function userStats(sql, user) {
  const { list, byId } = bank();
  const [states, hard] = await Promise.all([questionStates(sql, user.id), hardQuestions(sql)]);
  let mastered = 0;
  let mistakes = 0;
  for (const [id, s] of states) {
    const q = byId.get(id);
    if (!q) continue;
    if (s.last) mastered++;
    else if (user.include_pensum || !q.pensum) mistakes++;
  }
  const [{ points }] = await sql`select coalesce(sum(points), 0)::int as points from attempts where user_id = ${user.id}`;
  const topics = new Set([...LECTURES, ...list.map((q) => q.topic)]).size;
  const pensum = list.filter((q) => q.pensum).length;
  const hardCount = hard.filter((h) => user.include_pensum || !byId.get(h.id).pensum).length;
  return {
    points, mastered, mistakes, hard: hardCount, total: list.length, pensum, topics,
    streak: user.streak, bestStreak: user.best_streak,
  };
}

function cleanNickname(raw) {
  const nickname = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N} _.-]{2,20}$/u.test(nickname)) {
    throw new HttpError(400, 'bad_nickname', 'Nickname: 2-20 letters, numbers, spaces, dots, dashes or underscores.');
  }
  return { nickname, key: nickname.toLocaleLowerCase('nb') };
}

function cleanPin(raw) {
  const pin = String(raw || '');
  if (!/^\d{4,8}$/.test(pin)) throw new HttpError(400, 'bad_pin', 'PIN: 4-8 digits.');
  return pin;
}

export const routes = {
  'GET config': async () => json({ joinCodeRequired: Boolean(process.env.JOIN_CODE), course: publicCourse() }),

  // The shared course list (see courses.json in the base repo), filtered by this site's settings.
  'GET directory': async (request) => json({ courses: await directory(new URL(request.url).host) }),

  'GET me': async (request) => {
    const sql = db();
    const user = await sessionUser(sql, request);
    if (!user) return json({ user: null });
    const admin = isAdmin(user);
    const [stats, run, customRun, myFlags, notices, openFlags] = await Promise.all([
      userStats(sql, user),
      loadRun(sql, user),
      loadRun(sql, user, 'custom'),
      sql`select question_id from flags where user_id = ${user.id} and status = 'open'`,
      flagNotices(sql, user.id),
      admin ? openFlagCount(sql) : null,
    ]);
    return json({
      user: { nickname: user.nickname, includePensum: user.include_pensum, admin },
      stats,
      run: run && { position: run.position, total: run.order.length, finished: run.finished },
      customRun: customRun && { position: customRun.position, total: customRun.order.length, finished: customRun.finished },
      flagged: myFlags.map((r) => r.question_id),
      notices,
      openFlags,
    });
  },

  'POST register': async (request) => {
    const body = await readBody(request);
    const { nickname, key } = cleanNickname(body.nickname);
    const pin = cleanPin(body.pin);
    const joinCode = process.env.JOIN_CODE;
    if (joinCode && String(body.joinCode || '').trim() !== joinCode) {
      throw new HttpError(403, 'bad_join_code', 'That join code is not right. Ask whoever shared the link.');
    }
    const sql = db();
    const [user] = await sql`
      insert into users (nickname, nickname_key, pin_hash) values (${nickname}, ${key}, ${await hashPin(pin)})
      on conflict (nickname_key) do nothing returning id`;
    if (!user) throw new HttpError(409, 'nickname_taken', 'That nickname is taken.');
    const token = await createSession(sql, user.id);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, token) });
  },

  'POST login': async (request) => {
    const body = await readBody(request);
    const { key } = cleanNickname(body.nickname);
    const pin = cleanPin(body.pin);
    const sql = db();
    const [user] = await sql`select id, pin_hash, failed_logins, locked_until from users where nickname_key = ${key}`;
    if (!user) throw new HttpError(404, 'no_player', 'No player with that nickname yet.');
    if (user.locked_until && user.locked_until > new Date()) {
      throw new HttpError(429, 'locked', 'Too many wrong PINs. Try again in 15 minutes.');
    }
    if (!(await verifyPin(pin, user.pin_hash))) {
      const fails = user.failed_logins + 1;
      const lock = fails >= 5;
      await sql`
        update users set failed_logins = ${lock ? 0 : fails},
          locked_until = ${lock ? new Date(Date.now() + 15 * 60 * 1000) : null}
        where id = ${user.id}`;
      throw new HttpError(401, 'wrong_pin', lock ? 'Wrong PIN. Locked for 15 minutes.' : 'Wrong PIN.');
    }
    await sql`update users set failed_logins = 0, locked_until = null where id = ${user.id}`;
    const token = await createSession(sql, user.id);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, token) });
  },

  'POST logout': async (request) => {
    await deleteSession(db(), request);
    return json({ ok: true }, 200, { 'set-cookie': clearedCookie(request) });
  },

  // Marks the player's resolved-flag notices as seen.
  'POST notices/seen': async (request) => {
    const user = await requireUser(request);
    await db()`update flags set notified = true where user_id = ${user.id} and status <> 'open' and not notified`;
    return json({ ok: true });
  },
};
