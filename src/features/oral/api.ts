// Typed calls to /api/oral/* and the shapes they return (see server/oral/routes.js).
import { api, ApiError, post } from '@/shared/api/client';
import type { OralSettings, RunSummary } from '@/shared/api/types';

export type Rating = 'missed' | 'partial' | 'solid';

/** A question as shown before answering: no key points or model answer. */
export type OralQuestion = {
  id: string;
  /** explain, compare, walkthrough, topic or query. */
  type: string;
  topic: string;
  prompt: string;
  code?: string;
  hints?: string[];
  keyPointCount: number;
  /** Suggested answer time: the question's own, else the course default. */
  seconds: number;
  pensum: boolean;
};

export type RatedQuestion = OralQuestion & { rating: Rating };

/** Everything revealed after answering. */
export type Reveal = {
  id: string;
  keyPoints: string[];
  modelAnswer: string;
  alternatives: string[];
  followUps: string[];
  source: string;
};

export type RunView = {
  scope: string;
  position: number;
  total: number;
  finished: boolean;
  current: OralQuestion | null;
};

export type OralStats = {
  total: number;
  playable: number;
  solid: number;
  partial: number;
  missed: number;
  pensum: number;
  query: number;
};

export type LectureOverview = {
  topic: string;
  scope: string;
  total: number;
  playable: number;
  solid: number;
  partial: number;
  missed: number;
  ready: boolean;
  /** Question count per type, e.g. { explain: 3, query: 1 }. */
  types: Record<string, number>;
  run: RunSummary | null;
};

export type Overview = {
  stats: OralStats;
  topics: LectureOverview[];
  runs: { all: RunSummary | null; custom: RunSummary | null; exam: RunSummary | null };
  settings: OralSettings;
};

export type RateMode = 'round' | 'practice' | 'exam';

export type RateRequest = {
  questionId: string;
  rating: Rating;
  covered: number;
  hintsUsed: number;
  mode: RateMode;
  /** Required in 'round' mode: the round's scope. */
  scope?: string;
};

export type CustomRoundRequest = {
  topics: string[];
  types: string[];
  /** null = every matching question. */
  count: number | null;
  notSolid: boolean;
};

export const overviewPath = 'oral/overview';
export const revealPath = (id: string) => `oral/reveal?id=${encodeURIComponent(id)}`;
export const listPath = (filter: 'needs-work' | 'solid', scope: string) =>
  `oral/list?filter=${filter}&scope=${encodeURIComponent(scope)}`;

export const getRun = (scope: string) => api<{ run: RunView | null }>(`oral/run?scope=${encodeURIComponent(scope)}`);
export const startRun = (scope: string) => post<{ run: RunView | null }>('oral/run/start', { scope });
export const startCustomRun = (body: CustomRoundRequest) =>
  post<{ run: RunView | null }>('oral/run/start', { scope: 'custom', ...body });
export const getReveal = (id: string) => api<Reveal>(revealPath(id));
export const rateAnswer = (body: RateRequest) => post<{ ok: true }>('oral/rate', body);

/** Errors from rateAnswer after which the question can no longer be rated: move on. */
export const isOutOfSync = (e: unknown) =>
  e instanceof ApiError && (e.code === 'out_of_sync' || e.code === 'unknown_question');
