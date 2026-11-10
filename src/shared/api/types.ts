// Shapes shared by the whole app: GET /api/config and GET /api/me. Feature-specific responses
// are typed in their feature folder (features/*/api.ts).

export type SourceBook = { match: string; also?: string; unless?: string; text: string };
export type SourceDocument = { match: string; also?: string; unless?: string; name: string; doc: string };

export type QuerySettings = {
  language: string;
  /** Name of query practice in the mode switch, e.g. "Esper". */
  title: string;
  label: string;
  placeholder: string;
  grading: string;
  keywords: string[];
  operators: string[];
  views: string;
};

export type OralSettings = {
  speechLang: string;
  timerSeconds: number;
  examiner: string;
  exam: { questions: number; note: string };
  speech: { terms: string[]; fixes: [string, string][] };
  query: QuerySettings | null;
};

export type Course = {
  appName: string;
  code: string;
  name: string;
  tagline: string;
  samplesOwner: string;
  sourceInfo: {
    pages?: string;
    pagesNoLecture?: string;
    books?: SourceBook[];
    documents?: SourceDocument[];
  };
  directory: boolean;
  modes: { quiz: boolean; oral: boolean; query: boolean };
  features: { leaderboard: boolean; hints: boolean };
  oral: OralSettings | null;
};

export type Config = { joinCodeRequired: boolean; course: Course };

export type Stats = {
  points: number;
  mastered: number;
  mistakes: number;
  hard: number;
  total: number;
  pensum: number;
  topics: number;
  streak: number;
  bestStreak: number;
};

export type RunSummary = { position: number; total: number; finished: boolean };

export type Notice = { questionId: string; question: string | null; status: string; reply: string | null };

export type Me = {
  user: { nickname: string; includePensum: boolean; admin: boolean };
  stats: Stats;
  run: RunSummary | null;
  customRun: RunSummary | null;
  flagged: string[];
  notices: Notice[];
  openFlags: number | null;
};
