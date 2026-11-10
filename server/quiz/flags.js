// Flags: players can flag any question as bad (one flag per player per question, editable and
// withdrawable). Flags are private: other players never see them. Admins see them anonymously;
// the table keeps user_id so the flagger can be told when their question is fixed or reviewed.
// Also owns the admin checks (player ids and x-admin-key) and the resolved-flag notices.
import crypto from 'node:crypto';
import { db } from '../db/client.js';
import { json, readBody, requireUser, HttpError } from '../http.js';
import { bank } from './bank.js';

const FLAG_REASONS = {
  wrong_answer: 'Wrong answer',
  ambiguous: 'Ambiguous / more than one right',
  unclear: 'Unclear wording',
  source: 'Wrong source or page',
  other: 'Other',
};
const NOTE_MAX = 500;

// Admins: player ids in ADMIN_USER_IDS (comma-separated; no admins when unset). Scripts and agents
// can instead send an admin key in the x-admin-key header; only its SHA-256 is configured, in
// ADMIN_KEY_SHA256. Without it, key access is off.
const ADMIN_USER_IDS = new Set(String(process.env.ADMIN_USER_IDS || '').split(',').map((s) => Number(s.trim())).filter(Boolean));
const ADMIN_KEY_SHA256 = /^[0-9a-f]{64}$/i.test(process.env.ADMIN_KEY_SHA256 || '') ? process.env.ADMIN_KEY_SHA256 : null;
export const isAdmin = (user) => Boolean(user && ADMIN_USER_IDS.has(user.id));

function adminKeyOk(request) {
  const key = request.headers.get('x-admin-key');
  if (!key || !ADMIN_KEY_SHA256) return false;
  const a = crypto.createHash('sha256').update(key).digest();
  const b = Buffer.from(ADMIN_KEY_SHA256, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function requireAdmin(request) {
  if (adminKeyOk(request)) return null;
  const user = await requireUser(request);
  if (!isAdmin(user)) throw new HttpError(403, 'not_admin', 'Only admins can see flags.');
  return user;
}

function cleanFlag(body) {
  const reason = String(body.reason || '');
  if (!FLAG_REASONS[reason]) throw new HttpError(400, 'bad_reason', 'Pick a reason.');
  const note = String(body.note ?? '').trim().slice(0, NOTE_MAX) || null;
  return { reason, note };
}

export async function openFlagCount(sql) {
  const [{ n }] = await sql`select count(distinct question_id)::int as n from flags where status = 'open'`;
  return n;
}

// Flags on the player's questions that were resolved since they last looked.
export async function flagNotices(sql, userId) {
  const { byId } = bank();
  const rows = await sql`
    select question_id, status, reply from flags
    where user_id = ${userId} and status <> 'open' and not notified order by resolved_at`;
  return rows.map((r) => ({
    questionId: r.question_id,
    question: byId.get(r.question_id)?.question || null,
    status: r.status,
    reply: r.reply,
  }));
}

export const routes = {
  // The player's own flag on one question (or null).
  'GET flag': async (request) => {
    const user = await requireUser(request);
    const questionId = new URL(request.url).searchParams.get('questionId');
    const [flag] = await db()`
      select reason, note, status from flags where user_id = ${user.id} and question_id = ${questionId}`;
    return json({ flag: flag && flag.status === 'open' ? { reason: flag.reason, note: flag.note } : null, reasons: FLAG_REASONS });
  },

  // Creates or updates the player's flag. Re-flagging a resolved question opens it again.
  'POST flag': async (request) => {
    const user = await requireUser(request);
    const body = await readBody(request);
    if (!bank().byId.has(body.questionId)) throw new HttpError(404, 'unknown_question', 'That question no longer exists.');
    const { reason, note } = cleanFlag(body);
    await db()`
      insert into flags (user_id, question_id, reason, note) values (${user.id}, ${body.questionId}, ${reason}, ${note})
      on conflict (user_id, question_id) do update set reason = excluded.reason, note = excluded.note,
        status = 'open', reply = null, resolved_at = null, notified = false, updated_at = now()`;
    return json({ ok: true });
  },

  'POST flag/withdraw': async (request) => {
    const user = await requireUser(request);
    const { questionId } = await readBody(request);
    await db()`delete from flags where user_id = ${user.id} and question_id = ${String(questionId)} and status = 'open'`;
    return json({ ok: true });
  },

  // Admin: flagged questions, grouped, anonymous. ?status=open (default) or all.
  'GET admin/flags': async (request) => {
    await requireAdmin(request);
    const all = new URL(request.url).searchParams.get('status') === 'all';
    const sql = db();
    const rows = all
      ? await sql`select question_id, reason, note, status, reply, created_at, updated_at, resolved_at from flags order by updated_at desc`
      : await sql`select question_id, reason, note, status, reply, created_at, updated_at, resolved_at from flags where status = 'open' order by updated_at desc`;
    const { byId } = bank();
    const groups = new Map();
    for (const r of rows) {
      const q = byId.get(r.question_id);
      const g = groups.get(r.question_id) || {
        questionId: r.question_id,
        inBank: Boolean(q),
        topic: q?.topic ?? null,
        question: q?.question ?? null,
        code: q?.code,
        options: q?.options ?? [],
        answer: q?.answer ?? null,
        explanation: q?.explanation ?? null,
        source: q?.source ?? null,
        open: 0,
        flags: [],
      };
      if (r.status === 'open') g.open++;
      g.flags.push({
        reason: r.reason, reasonLabel: FLAG_REASONS[r.reason] || r.reason, note: r.note, status: r.status, reply: r.reply,
        at: r.updated_at, resolvedAt: r.resolved_at,
      });
      groups.set(r.question_id, g);
    }
    const questions = [...groups.values()].sort((a, b) => b.open - a.open || b.flags.length - a.flags.length);
    return json({ questions, reasons: FLAG_REASONS });
  },

  // Admin: resolves every open flag on a question as 'fixed' or 'kept', with an optional reply
  // that the flaggers see in their notice.
  'POST admin/resolve': async (request) => {
    await requireAdmin(request);
    const body = await readBody(request);
    const status = String(body.status || '');
    if (!['fixed', 'kept'].includes(status)) throw new HttpError(400, 'bad_status', 'Status must be fixed or kept.');
    const reply = String(body.reply ?? '').trim().slice(0, NOTE_MAX) || null;
    const rows = await db()`
      update flags set status = ${status}, reply = ${reply}, resolved_at = now(), notified = false
      where question_id = ${String(body.questionId)} and status = 'open' returning id`;
    return json({ resolved: rows.length });
  },
};
