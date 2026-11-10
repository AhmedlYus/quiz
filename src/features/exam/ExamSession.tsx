// An exam in progress: the answer phase, then the review. Saves ratings and finishes the exam on the server.
import { useRef, useState } from 'react';
import { rateAnswer } from '@/features/oral/api';
import { TimerSwitch } from '@/features/oral/components/TimerSwitch';
import type { GradedItem } from '@/features/oral/lib/gradingPrompt';
import { finishExam, type ExamView } from './api';
import { ExamAnswerStep } from './ExamAnswerStep';
import { ExamFrame } from './ExamFrame';
import { ExamReview } from './ExamReview';
import { clearExamProgress, useExamProgress } from './useExamProgress';

export function ExamSession({ exam, onFinished }: { exam: ExamView; onFinished: (items: GradedItem[]) => void }) {
  const progress = useExamProgress(exam.startedAt);
  const { state } = progress;
  const [isSaving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  // Ratings already sent, so a retry after a failure does not send them twice.
  const sent = useRef(new Set<string>());
  const total = exam.questions.length;

  async function finish(items: GradedItem[]) {
    setSaving(true);
    setSaveError(null);
    try {
      for (const q of exam.questions) {
        const rating = state.ratings[q.id];
        if (!rating || sent.current.has(q.id)) continue;
        await rateAnswer({
          questionId: q.id,
          rating,
          covered: state.checked[q.id]?.length ?? 0,
          hintsUsed: state.hints[q.id] ?? 0,
          mode: 'exam',
        });
        sent.current.add(q.id);
      }
      await finishExam();
      clearExamProgress();
      onFinished(items);
    } catch (e) {
      setSaveError(e as Error);
      setSaving(false);
    }
  }

  if (state.phase === 'review') {
    return (
      <ExamFrame step={2} description="Check your answers against the key points." back={{ href: '/oral', label: 'Leave (progress is saved)' }}>
        <ExamReview exam={exam} progress={progress} isSaving={isSaving} saveError={saveError} onFinish={(items) => void finish(items)} />
      </ExamFrame>
    );
  }
  const index = Math.min(state.index, total - 1);
  return (
    <ExamFrame
      step={1}
      description={`Question ${index + 1} of ${total}`}
      actions={<TimerSwitch label="Time each answer" />}
      back={{ href: '/oral', label: 'Leave (progress is saved)' }}
    >
      <ExamAnswerStep exam={exam} progress={progress} />
    </ExamFrame>
  );
}
