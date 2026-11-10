// App-wide session: the course config (GET /api/config) and the signed-in player (GET /api/me).
// The app shell renders the login page while `me` is null.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, post, setSignedOutHandler } from '../api/client';
import type { Config, Course, Me } from '../api/types';

type MeResponse = Me | { user: null };

type Session = {
  config: Config;
  course: Course;
  me: Me | null;
  refreshMe: () => Promise<Me | null>;
  setMe: (me: Me | null) => void;
  signOut: () => Promise<void>;
};

type State =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; config: Config; me: Me | null };

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be used inside <SessionProvider>');
  return s;
}

export const useCourse = () => useSession().course;

const asMe = (r: MeResponse): Me | null => (r.user ? (r as Me) : null);

export function SessionProvider({
  children,
  loading,
  failed,
}: {
  children: ReactNode;
  loading: ReactNode;
  failed: (error: Error, retry: () => void) => ReactNode;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    Promise.all([api<Config>('config'), api<MeResponse>('me')])
      .then(([config, me]) => live && setState({ status: 'ready', config, me: asMe(me) }))
      .catch((error: Error) => live && setState({ status: 'error', error }));
    return () => {
      live = false;
    };
  }, [attempt]);

  const setMe = useCallback((me: Me | null) => {
    setState((s) => (s.status === 'ready' ? { ...s, me } : s));
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => setMe(null));
    return () => setSignedOutHandler(null);
  }, [setMe]);

  const refreshMe = useCallback(async () => {
    const me = asMe(await api<MeResponse>('me'));
    setMe(me);
    return me;
  }, [setMe]);

  const signOut = useCallback(async () => {
    try {
      await post('logout');
    } finally {
      setMe(null);
    }
  }, [setMe]);

  const value = useMemo<Session | null>(
    () =>
      state.status === 'ready'
        ? { config: state.config, course: state.config.course, me: state.me, refreshMe, setMe, signOut }
        : null,
    [state, refreshMe, setMe, signOut],
  );

  if (state.status === 'loading') return <>{loading}</>;
  if (state.status === 'error') return <>{failed(state.error, () => setAttempt((n) => n + 1))}</>;
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
