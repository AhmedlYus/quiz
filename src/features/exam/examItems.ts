// The exam's questions as graded items (answer, hints, rating, reveal) for the GPT prompt and summary.
import type { Reveal } from '@/features/oral/api';
import type { GradedItem } from '@/features/oral/lib/gradingPrompt';
import type { ExamView } from './api';
import type { ExamProgress } from './useExamProgress';

export const examItems = (exam: ExamView, state: ExamProgress, reveals: Record<string, Reveal> | null): GradedItem[] =>
  exam.questions.map((q) => ({
    q,
    reveal: reveals?.[q.id] ?? null,
    answer: state.answers[q.id] ?? '',
    hintsUsed: state.hints[q.id] ?? 0,
    rating: state.ratings[q.id],
  }));
