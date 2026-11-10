// An exam in progress, kept in this browser (keyed by the exam's start time on the server) so a
// reload carries on where it was: phase, question, answers, hints, ticked key points and ratings.
// Answers live only here; the server only ever sees the final ratings.
import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '@/shared/lib/storage';
import type { Rating } from '@/features/oral/api';

const KEY = 'qa-oral-exam';

export type ExamPhase = 'answer' | 'review';

export type ExamProgress = {
  startedAt: string;
  phase: ExamPhase;
  index: number;
  answers: Record<string, string>;
  hints: Record<string, number>;
  checked: Record<string, number[]>;
  ratings: Record<string, Rating>;
};

const fresh = (startedAt: string): ExamProgress => ({ startedAt, phase: 'answer', index: 0, answers: {}, hints: {}, checked: {}, ratings: {} });

function load(startedAt: string): ExamProgress {
  const saved = storage.get<Partial<ExamProgress> | null>(KEY, null);
  return saved && saved.startedAt === startedAt ? { ...fresh(startedAt), ...saved } : fresh(startedAt);
}

export const clearExamProgress = () => storage.remove(KEY);

export function useExamProgress(startedAt: string) {
  const [state, setState] = useState(() => load(startedAt));
  const dirty = useRef(false);

  useEffect(() => {
    if (dirty.current) {
      dirty.current = false;
      storage.set(KEY, state);
    }
  }, [state]);

  const update = useCallback((fn: (s: ExamProgress) => ExamProgress) => {
    dirty.current = true;
    setState(fn);
  }, []);

  return {
    state,
    setPhase: (phase: ExamPhase) => update((s) => ({ ...s, phase })),
    setIndex: (index: number) => update((s) => ({ ...s, index })),
    /** Typed or recognised text. Saved on every change (typed edits never reach onSettled). */
    setAnswer: (id: string, text: string) => update((s) => ({ ...s, answers: { ...s.answers, [id]: text } })),
    setHints: (id: string, used: number) => update((s) => ({ ...s, hints: { ...s.hints, [id]: used } })),
    setChecked: (id: string, checked: number[]) => update((s) => ({ ...s, checked: { ...s.checked, [id]: checked } })),
    setRating: (id: string, rating: Rating) => update((s) => ({ ...s, ratings: { ...s.ratings, [id]: rating } })),
  };
}

export type ExamProgressApi = ReturnType<typeof useExamProgress>;
