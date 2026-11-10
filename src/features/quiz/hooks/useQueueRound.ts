// A round over a fixed list of questions (mistakes or hard for everyone): walks the list and
// collects the sitting's totals. Answers are saved per question by the server, nothing else to keep.
import { useCallback, useState } from 'react';
import { addOutcome, emptyTally, type Outcome, type Tally } from './tally';

export function useQueueRound<Q>(questions: Q[]) {
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<Tally>(emptyTally);

  const onOutcome = useCallback((outcome: Outcome) => {
    setTally((t) => addOutcome(t, outcome));
    setIndex((i) => i + 1);
  }, []);

  const finished = index >= questions.length;
  return { index, total: questions.length, question: finished ? null : questions[index], finished, tally, onOutcome };
}
