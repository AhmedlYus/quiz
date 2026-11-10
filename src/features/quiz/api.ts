// Quiz mode endpoints and the shapes they return (see server/quiz/routes.js).
import { api, post } from '@/shared/api/client';
import { scopeOf } from '@/shared/lib/format';

export type QuizOption = { i: number; text: string };

/** A question as the player sees it before answering: no answer, no explanation. */
export type QuizQuestion = {
  id: string;
  question: string;
  topic: string | null;
  pensum: boolean;
  code?: string;
  hints?: string[];
  options: QuizOption[];
};

export type RunView = {
  scope: string;
  position: number;
  total: number;
  finished: boolean;
  current: QuizQuestion | null;
};

export type AnswerMode = 'test' | 'mistakes' | 'hard';

export type AnswerResult = {
  correct: boolean;
  points: number;
  streak: number;
  bestStreak: number;
  /** The option's `i` (original index), not its position on screen. */
  answer: number;
  explanation: string | null;
  source: string | null;
};

export type TopicRun = { position: number; total: number; finished: boolean };

export type TopicRow = {
  topic: string;
  scope: string;
  total: number;
  mastered: number;
  mistakes: number;
  playable: number;
  unmastered: number;
  /** Has questions of its own, not only samples. */
  ready: boolean;
  run: TopicRun | null;
};

export type HardStatus = 'mistake' | 'new' | 'mastered';
export type HardQuestion = QuizQuestion & { players: number; missRate: number; status: HardStatus };

/** A question the player got right, with its answer (GET correct). */
export type CorrectQuestion = {
  id: string;
  question: string;
  topic: string | null;
  pensum: boolean;
  code?: string;
  options: string[];
  answer: number;
  explanation: string | null;
  source: string | null;
  attempts: number;
};

export type FlagReason = 'wrong_answer' | 'ambiguous' | 'unclear' | 'source' | 'other';
export const FLAG_REASONS: Record<FlagReason, string> = {
  wrong_answer: 'Wrong answer',
  ambiguous: 'Ambiguous / more than one right',
  unclear: 'Unclear wording',
  source: 'Wrong source or page',
  other: 'Other',
};
export const FLAG_NOTE_MAX = 500;

export type OwnFlag = { reason: FlagReason; note: string | null };

export type CustomStart = { topics: string[]; count: number | null; unmastered: boolean };

export const getRun = (scope: string) => api<{ run: RunView | null }>(`test?scope=${encodeURIComponent(scope)}`).then((r) => r.run);

export const startRun = (scope: string, custom?: CustomStart) =>
  post<{ run: RunView }>('test/start', { scope, ...custom }).then((r) => r.run);

export const getMistakes = (topic: string | null) =>
  api<{ questions: QuizQuestion[] }>(`mistakes?scope=${encodeURIComponent(scopeOf(topic))}`).then((r) => r.questions);

export const sendAnswer = (body: { questionId: string; chosen: number; mode: AnswerMode; scope: string }) =>
  post<AnswerResult>('answer', body);

export const skipQuestion = (questionId: string, scope: string) => post('skip', { questionId, scope });

export const setIncludePensum = (includePensum: boolean) => post('settings', { includePensum });

export const markNoticesSeen = () => post('notices/seen');

export const getFlag = (questionId: string) =>
  api<{ flag: OwnFlag | null }>(`flag?questionId=${encodeURIComponent(questionId)}`).then((r) => r.flag);

export const sendFlag = (questionId: string, reason: FlagReason, note: string) => post('flag', { questionId, reason, note });

export const withdrawFlag = (questionId: string) => post('flag/withdraw', { questionId });
