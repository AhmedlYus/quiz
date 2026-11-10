// What happened to one question in a round, and the running totals for the sitting.
import type { AnswerResult } from '../api';

export type Outcome =
  | { kind: 'answered'; result: AnswerResult }
  | { kind: 'skipped' }
  /** The server says the question was already handled (e.g. answered in another tab). */
  | { kind: 'resync' };

export type Tally = {
  answered: number;
  correct: number;
  points: number;
  skipped: number;
  /** Streak after the latest answer, or null before the first one. */
  streak: number | null;
};

export const emptyTally: Tally = { answered: 0, correct: 0, points: 0, skipped: 0, streak: null };

export function addOutcome(t: Tally, o: Outcome): Tally {
  if (o.kind === 'skipped') return { ...t, skipped: t.skipped + 1 };
  if (o.kind === 'resync') return t;
  return {
    ...t,
    answered: t.answered + 1,
    correct: t.correct + (o.result.correct ? 1 : 0),
    points: t.points + o.result.points,
    streak: o.result.streak,
  };
}
