// Every page in the app. Paths are matched in order (see matchPath in router.tsx); each page is
// loaded on first visit. `mode` hides the route when that study mode is off in course.json.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { StudyMode } from './modes';

type PageModule = { default: ComponentType<Record<string, unknown>> };
const page = (load: () => Promise<PageModule>) => lazy(load);

export type RouteDef = {
  path: string;
  Page: LazyExoticComponent<ComponentType<Record<string, unknown>>>;
  /** Extra props for the page, e.g. which tab a shared page opens on. */
  props?: Record<string, unknown>;
  mode?: StudyMode;
  feature?: 'leaderboard';
  admin?: boolean;
};

const QuizPlay = page(() => import('@/features/quiz/pages/PlayPage'));
const Practice = page(() => import('@/features/quiz/pages/PracticePage'));
const OralPlay = page(() => import('@/features/oral/pages/OralPlayPage'));

export const ROUTES: RouteDef[] = [
  // Quiz mode
  { path: '/', Page: page(() => import('@/features/quiz/pages/QuizHomePage')), mode: 'quiz' },
  { path: '/play/:topic?', Page: QuizPlay, mode: 'quiz' },
  { path: '/custom/play', Page: QuizPlay, props: { custom: true }, mode: 'quiz' },
  { path: '/custom', Page: page(() => import('@/features/quiz/pages/CustomRoundPage')), mode: 'quiz' },
  { path: '/lectures', Page: page(() => import('@/features/quiz/pages/LecturesPage')), mode: 'quiz' },
  { path: '/mistakes/:topic?', Page: Practice, props: { tab: 'mistakes' }, mode: 'quiz' },
  { path: '/hard/:topic?', Page: Practice, props: { tab: 'hard' }, mode: 'quiz' },
  { path: '/correct', Page: page(() => import('@/features/quiz/pages/CorrectPage')), mode: 'quiz' },
  { path: '/rules', Page: page(() => import('@/features/quiz/pages/RulesPage')), mode: 'quiz' },
  { path: '/leaderboard', Page: page(() => import('@/features/leaderboard/LeaderboardPage')), mode: 'quiz', feature: 'leaderboard' },
  { path: '/flags/:filter?', Page: page(() => import('@/features/admin/FlagsPage')), admin: true },

  // Oral mode
  { path: '/oral', Page: page(() => import('@/features/oral/pages/OralHomePage')), mode: 'oral' },
  { path: '/oral/lectures', Page: page(() => import('@/features/oral/pages/OralLecturesPage')), mode: 'oral' },
  { path: '/oral/play/:topic?', Page: OralPlay, mode: 'oral' },
  { path: '/oral/custom/play', Page: OralPlay, props: { custom: true }, mode: 'oral' },
  { path: '/oral/custom', Page: page(() => import('@/features/oral/pages/OralCustomPage')), mode: 'oral' },
  { path: '/oral/needs-work/:topic?', Page: page(() => import('@/features/oral/pages/NeedsWorkPage')), mode: 'oral' },
  { path: '/oral/solid', Page: page(() => import('@/features/oral/pages/SolidPage')), mode: 'oral' },
  { path: '/oral/exam', Page: page(() => import('@/features/exam/ExamPage')), mode: 'oral' },
  { path: '/oral/help', Page: page(() => import('@/features/oral/pages/OralHelpPage')), mode: 'oral' },

  // Query practice
  { path: '/query', Page: page(() => import('@/features/query/QueryPracticePage')), mode: 'query' },
];
