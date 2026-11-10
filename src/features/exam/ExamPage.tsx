// Exam simulation ('/oral/exam'): intro, answer each question in turn, review and rate, summary.
// An exam in progress is resumed from this browser's saved answers.
import { useState } from 'react';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { useApi } from '@/shared/lib/useApi';
import { SittingSummary } from '@/features/oral/components/SittingSummary';
import type { GradedItem } from '@/features/oral/lib/gradingPrompt';
import { examPath, startExam, type ExamView } from './api';
import { ExamFrame, ExamStepper } from './ExamFrame';
import { ExamIntro } from './ExamIntro';
import { ExamSession } from './ExamSession';

export default function ExamPage() {
  const { data, error, reload } = useApi<{ exam: ExamView | null }>(examPath);
  const [started, setStarted] = useState<ExamView | null>(null);
  const [finishedKey, setFinishedKey] = useState<string | null>(null);
  const [summary, setSummary] = useState<GradedItem[] | null>(null);
  const [isStarting, setStarting] = useState(false);
  const [startError, setStartError] = useState<Error | null>(null);

  const exam = started ?? data?.exam ?? null;
  const active = exam && !exam.finished && exam.startedAt !== finishedKey ? exam : null;

  async function start() {
    setStarting(true);
    setStartError(null);
    try {
      setStarted((await startExam()).exam);
    } catch (e) {
      setStartError(e as Error);
    } finally {
      setStarting(false);
    }
  }

  if (summary) {
    return (
      <SittingSummary
        title="Exam done"
        items={summary}
        isExam
        header={<ExamStepper step={3} />}
        again={{ label: 'Another exam', onClick: () => setSummary(null) }}
      />
    );
  }
  if (error) {
    return (
      <ExamFrame step={0}>
        <ErrorState error={error} onRetry={reload} />
      </ExamFrame>
    );
  }
  if (!data && !started) {
    return (
      <ExamFrame step={0}>
        <LoadingState />
      </ExamFrame>
    );
  }
  if (active) {
    return (
      <ExamSession
        key={active.startedAt}
        exam={active}
        onFinished={(items) => {
          setFinishedKey(active.startedAt);
          setSummary(items);
        }}
      />
    );
  }
  return (
    <ExamFrame step={0} description="Answer questions from different lectures, then check yourself." width="medium">
      <ExamIntro hasLast={Boolean(exam?.finished || finishedKey)} isStarting={isStarting} error={startError} onStart={() => void start()} />
    </ExamFrame>
  );
}
