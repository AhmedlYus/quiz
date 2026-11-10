// HTTP plumbing shared by every route: the error type, JSON responses, body parsing, the route
// key of a request, and the signed-in user check.
import { db } from './db/client.js';
import { sessionUser } from './auth/session.js';

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function routeOf(request) {
  const url = new URL(request.url);
  const route = url.searchParams.get('route') ?? url.pathname.replace(/^\/api\/?/, '');
  return route.replace(/^\/+|\/+$/g, '');
}

export async function readBody(request) {
  try {
    return (await request.json()) || {};
  } catch {
    throw new HttpError(400, 'bad_request', 'Invalid request body.');
  }
}

export async function requireUser(request) {
  const user = await sessionUser(db(), request);
  if (!user) throw new HttpError(401, 'signed_out', 'Please log in again.');
  return user;
}
