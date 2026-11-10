// The single API dispatcher: builds the route table from the domain modules and hands a Web
// Request to the handler registered as 'METHOD route'. Errors become JSON (HttpError keeps its
// status; anything else is a 500).
//
// Oral mode lives in its own module and is loaded only when needed, so a problem there can never
// take the quiz routes down with it.
import { json, HttpError, routeOf, requireUser, readBody } from './http.js';
import { ensureSchema } from './db/client.js';
import { MODES } from './config/course.js';
import { shuffle } from './util.js';
import { routes as accountRoutes } from './account/routes.js';
import { routes as quizRoutes } from './quiz/routes.js';
import { routes as flagRoutes } from './quiz/flags.js';
import { routes as leaderboardRoutes } from './leaderboard/routes.js';

const routes = { ...accountRoutes, ...quizRoutes, ...flagRoutes, ...leaderboardRoutes };

let oralModule;
async function oralRoute(key) {
  if (!(MODES.oral || MODES.query) || !key.split(' ')[1].startsWith('oral/')) return null;
  oralModule ??= import('./oral/routes.js')
    .then((m) => m.createOralRoutes({ json, HttpError, requireUser, readBody, shuffle }))
    .catch((e) => {
      console.error('Oral mode failed to load:', e);
      oralModule = null;
      return {};
    });
  return (await oralModule)[key] || null;
}

export async function handle(request) {
  try {
    const key = `${request.method} ${routeOf(request)}`;
    const route = routes[key] || (await oralRoute(key));
    if (!route) return json({ error: 'not_found' }, 404);
    // Only JSON POSTs are accepted; plain cross-site form posts cannot send this content type.
    if (request.method === 'POST' && !(request.headers.get('content-type') || '').includes('application/json')) {
      throw new HttpError(415, 'json_required', 'Requests must be JSON.');
    }
    await ensureSchema();
    return await route(request);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status);
    console.error(e);
    return json({ error: 'server_error', message: 'Something went wrong on the server. Try again.' }, 500);
  }
}
