// Renders the page for the current hash path. Routes for switched-off modes or features, and admin
// routes for non-admins, don't exist; unknown paths go to the first enabled mode's overview.
import { Suspense, useEffect } from 'react';
import { useSession } from '@/shared/session/SessionContext';
import { LoadingState } from '@/shared/ui/States';
import { enabledModes, MODE_HOME } from './modes';
import { ROUTES } from './routes';
import { matchPath, navigate, ParamsProvider, useLocationPath } from './router';

export function RouteOutlet() {
  const { course, me } = useSession();
  const path = useLocationPath();
  const home = MODE_HOME[enabledModes(course)[0] ?? 'quiz'];

  const allowed = ROUTES.filter(
    (r) =>
      (!r.mode || course.modes[r.mode]) &&
      (!r.feature || course.features[r.feature]) &&
      (!r.admin || me?.user.admin),
  );
  let found: { route: (typeof ROUTES)[number]; params: Record<string, string | undefined> } | null = null;
  for (const route of allowed) {
    const params = matchPath(route.path, path);
    if (params) {
      found = { route, params };
      break;
    }
  }

  const missing = !found;
  useEffect(() => {
    if (missing) navigate(home, { replace: true });
  }, [missing, home]);

  useEffect(() => {
    document.title = `${course.appName} · ${course.code}`;
  }, [course]);

  if (!found) return null;
  const { Page, props } = found.route;
  return (
    <ParamsProvider value={found.params}>
      <Suspense fallback={<LoadingState />}>
        <Page key={path} {...props} />
      </Suspense>
    </ParamsProvider>
  );
}
