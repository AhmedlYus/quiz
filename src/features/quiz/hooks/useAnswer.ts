// State of one question on screen: choosing an option, sending the answer, skipping a pensum-only
// question, and handing the outcome to the round when the player moves on. Give the component using
// it a key per question so this state starts fresh.
import { useCallback, useRef, useState } from 'react';
import { useToast } from '@astryxdesign/core/Toast';
import { useAnnounce } from '@astryxdesign/core/hooks';
import { ApiError } from '@/shared/api/client';
import { sendAnswer, skipQuestion, type AnswerMode, type AnswerResult, type QuizQuestion } from '../api';
import type { Outcome } from './tally';
import { LETTERS } from './useOptionShortcuts';

type Phase = 'idle' | 'sending' | 'answered';
const RESYNC_CODES = new Set(['out_of_sync', 'not_a_mistake', 'unknown_question']);

export function useAnswer({
  question,
  mode,
  scope,
  onOutcome,
}: {
  question: QuizQuestion;
  mode: AnswerMode;
  scope: string;
  onOutcome: (outcome: Outcome) => void;
}) {
  const showToast = useToast();
  const announce = useAnnounce();
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const left = useRef(false);

  const leave = useCallback(
    (outcome: Outcome) => {
      if (left.current) return;
      left.current = true;
      onOutcome(outcome);
    },
    [onOutcome],
  );
  const fail = useCallback((e: unknown) => showToast({ body: (e as Error).message, type: 'error' }), [showToast]);

  /** `position` is the option's place on screen (options may be shuffled). */
  const choose = useCallback(
    async (position: number) => {
      if (phase !== 'idle') return;
      setPhase('sending');
      setPicked(position);
      try {
        const r = await sendAnswer({ questionId: question.id, chosen: question.options[position].i, mode, scope });
        setResult(r);
        setPhase('answered');
        const right = question.options.findIndex((o) => o.i === r.answer);
        announce(
          r.correct
            ? `Correct.${r.points ? ` ${r.points} ${r.points === 1 ? 'point' : 'points'}.` : ''}`
            : `Not quite. The answer is ${LETTERS[right]}.`,
          'assertive',
        );
      } catch (e) {
        if (e instanceof ApiError && e.code && RESYNC_CODES.has(e.code)) {
          showToast({ body: 'That question was already answered elsewhere. Moving on.' });
          return leave({ kind: 'resync' });
        }
        setPhase('idle');
        setPicked(null);
        fail(e);
      }
    },
    [phase, question, mode, scope, announce, showToast, leave, fail],
  );

  const skip = useCallback(async () => {
    if (phase !== 'idle' || !question.pensum) return;
    setPhase('sending');
    try {
      if (mode === 'test') await skipQuestion(question.id, scope);
    } catch (e) {
      if (!(e instanceof ApiError && e.code === 'out_of_sync')) {
        setPhase('idle');
        return fail(e);
      }
    }
    leave({ kind: 'skipped' });
  }, [phase, question, mode, scope, leave, fail]);

  const next = useCallback(() => {
    if (result) leave({ kind: 'answered', result });
  }, [result, leave]);

  const correctPosition = result ? question.options.findIndex((o) => o.i === result.answer) : -1;
  return { phase, picked, result, correctPosition, choose, skip, next };
}
