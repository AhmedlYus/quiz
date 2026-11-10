// Loads the key points and model answers of several questions at once (exam review).
import { useCallback, useEffect, useState } from 'react';
import { getReveal, type Reveal } from '../api';

export function useReveals(ids: string[]) {
  const key = ids.join('|');
  const [state, setState] = useState<{ reveals: Record<string, Reveal> | null; error: Error | null }>({
    reveals: null,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    setState({ reveals: null, error: null });
    Promise.all(key.split('|').filter(Boolean).map(getReveal))
      .then((list) => live && setState({ reveals: Object.fromEntries(list.map((r) => [r.id, r])), error: null }))
      .catch((error: Error) => live && setState({ reveals: null, error }));
    return () => {
      live = false;
    };
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
