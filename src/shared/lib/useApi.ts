// Loads data from the API for a page: { data, error, isLoading, reload }.
// Pass null as the path to skip loading (e.g. while a parameter is missing).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ data: T | null; error: Error | null; isLoading: boolean }>({
    data: null,
    error: null,
    isLoading: path != null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (path == null) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, error: null, isLoading: true }));
    api<T>(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: null, isLoading: false }))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, isLoading: false });
      });
    return () => ctrl.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
