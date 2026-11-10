// A round of oral questions on the server ('all', one lecture 't:<topic>' or 'custom'): loads or
// starts it, follows its position as answers are rated, and collects this sitting's answers.
import { useCallback, useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { getRun, startRun, type RunView } from '../api';
import type { GradedItem } from '../lib/gradingPrompt';

export function useOralRound(scope: string, custom: boolean) {
  const [run, setRun] = useState<RunView | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [sitting, setSitting] = useState<GradedItem[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setRun(null);
    setError(null);
    (async () => {
      let { run: found } = await getRun(scope);
      // A custom round is made on the custom page; without one there is nothing to play.
      if (custom && (!found || found.finished)) {
        navigate('/oral/custom', { replace: true });
        return;
      }
      if (!found || found.finished) found = (await startRun(scope)).run;
      if (live) setRun(found);
    })().catch((e: Error) => live && setError(e));
    return () => {
      live = false;
    };
  }, [scope, custom, attempt]);

  /** After a rating (or when the round moved on elsewhere): record it and fetch the next question. */
  const advance = useCallback(
    async (item: GradedItem | null) => {
      if (item) setSitting((s) => [...s, item]);
      try {
        setRun((await getRun(scope)).run);
      } catch (e) {
        setError(e as Error);
      }
    },
    [scope],
  );

  const restart = useCallback(async () => {
    await startRun(scope);
    setSitting([]);
    setAttempt((n) => n + 1);
  }, [scope]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { run, error, sitting, advance, restart, retry };
}
