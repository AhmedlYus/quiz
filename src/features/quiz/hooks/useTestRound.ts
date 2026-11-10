// A test round kept on the server (whole bank, one lecture, or the custom round): loads or starts
// it, moves to the next question after every outcome and collects the sitting's totals.
import { useCallback, useEffect, useState } from 'react';
import { getRun, startRun, type RunView } from '../api';
import { addOutcome, emptyTally, type Outcome, type Tally } from './tally';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; error: Error }
  /** Custom rounds are started on their own page; nothing to play here. */
  | { phase: 'missing' }
  | { phase: 'playing'; run: RunView }
  | { phase: 'finished' };

export function useTestRound(scope: string, custom: boolean) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [tally, setTally] = useState<Tally>(emptyTally);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      let run = await getRun(scope);
      if (custom && (!run || run.finished)) return live && setState({ phase: 'missing' });
      if (!run || run.finished) run = await startRun(scope);
      if (live) setState(run.finished || !run.current ? { phase: 'finished' } : { phase: 'playing', run });
    })().catch((error: Error) => live && setState({ phase: 'error', error }));
    return () => {
      live = false;
    };
  }, [scope, custom, attempt]);

  const onOutcome = useCallback(
    async (outcome: Outcome) => {
      setTally((t) => addOutcome(t, outcome));
      try {
        const run = await getRun(scope);
        setState(!run || run.finished || !run.current ? { phase: 'finished' } : { phase: 'playing', run });
      } catch (error) {
        setState({ phase: 'error', error: error as Error });
      }
    },
    [scope],
  );

  /** Starts over from question 1; points and history are kept. */
  const restart = useCallback(async () => {
    setState({ phase: 'loading' });
    try {
      const run = await startRun(scope);
      setTally(emptyTally);
      setState({ phase: 'playing', run });
    } catch (error) {
      setState({ phase: 'error', error: error as Error });
    }
  }, [scope]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, tally, onOutcome, restart, retry };
}
