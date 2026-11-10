// Admin endpoints (see server/quiz/flags.js): flagged questions and resolving them.
import { post } from '@/shared/api/client';

export type AdminFlag = {
  reason: string;
  reasonLabel: string;
  note: string | null;
  status: 'open' | 'fixed' | 'kept';
  reply: string | null;
  at: string;
  resolvedAt: string | null;
};

export type FlaggedQuestion = {
  questionId: string;
  inBank: boolean;
  topic: string | null;
  question: string | null;
  code?: string;
  options: string[];
  answer: number | null;
  explanation: string | null;
  source: string | null;
  open: number;
  flags: AdminFlag[];
};

export type FlagFilter = 'open' | 'all';

export const flagsPath = (filter: FlagFilter) => (filter === 'all' ? 'admin/flags?status=all' : 'admin/flags');

export const resolveFlags = (questionId: string, status: 'fixed' | 'kept', reply: string) =>
  post('admin/resolve', { questionId, status, reply });
