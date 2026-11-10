// Exam simulation calls (/api/oral/exam*). Questions come back without key points; those are
// fetched in the review phase with the oral reveal call.
import { post } from '@/shared/api/client';
import type { OralQuestion } from '@/features/oral/api';

export type ExamView = {
  /** Identifies this exam; the in-progress answers in the browser are keyed by it. */
  startedAt: string;
  finished: boolean;
  questions: OralQuestion[];
  settings: { questions: number; note: string };
};

export const examPath = 'oral/exam';
export const startExam = () => post<{ exam: ExamView | null }>('oral/exam/start');
export const finishExam = () => post<{ ok: true }>('oral/exam/finish');
