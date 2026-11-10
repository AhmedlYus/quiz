// Review phase: key points, model answer and a rating for every question, then save and finish.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { Check, ArrowLeft } from 'lucide-react';
import { LoadingState } from '@/shared/ui/States';
import { useCourse } from '@/shared/session/SessionContext';
import { useOral } from '@/features/oral/hooks/useOral';
import { useReveals } from '@/features/oral/hooks/useReveals';
import { buildGradingPrompt, type GradedItem } from '@/features/oral/lib/gradingPrompt';
import { CopyForGptButton } from '@/features/oral/components/CopyForGptButton';
import type { ExamView } from './api';
import { examItems } from './examItems';
import { ExamReviewItem } from './ExamReviewItem';
import type { ExamProgressApi } from './useExamProgress';

export function ExamReview({
  exam,
  progress,
  isSaving,
  saveError,
  onFinish,
}: {
  exam: ExamView;
  progress: ExamProgressApi;
  isSaving: boolean;
  saveError: Error | null;
  onFinish: (items: GradedItem[]) => void;
}) {
  const course = useCourse();
  const oral = useOral();
  const { state } = progress;
  const { reveals, error, reload } = useReveals(exam.questions.map((q) => q.id));

  if (error) {
    return (
      <Banner
        status="error"
        title="Could not load the key points"
        description={error.message}
        collapsible={false}
        endContent={<Button label="Try again" size="sm" onClick={reload} />}
      />
    );
  }
  if (!reveals) return <LoadingState label="Loading key points…" />;

  const rated = exam.questions.filter((q) => state.ratings[q.id]).length;
  const total = exam.questions.length;
  const allRated = rated === total;

  return (
    <VStack gap={6}>
      <Text color="secondary">Tick the key points you covered and rate each answer.</Text>
      {exam.questions.map((q, i) => (
        <ExamReviewItem
          key={q.id}
          number={i + 1}
          question={q}
          reveal={reveals[q.id]}
          answer={state.answers[q.id] ?? ''}
          hintsUsed={state.hints[q.id] ?? 0}
          checked={state.checked[q.id] ?? []}
          rating={state.ratings[q.id]}
          onCheckedChange={(c) => progress.setChecked(q.id, c)}
          onRate={(r) => progress.setRating(q.id, r)}
        />
      ))}
      {saveError && <Banner status="error" title="Could not save your ratings" description={saveError.message} collapsible={false} />}
      <HStack gap={3} justify="between" align="center" wrap="wrap">
        <HStack gap={2} wrap="wrap">
          <Button label="Back to answers" variant="ghost" icon={<Icon icon={ArrowLeft} />} onClick={() => progress.setPhase('answer')} />
          <CopyForGptButton
            label="Copy exam for GPT"
            build={() => buildGradingPrompt(examItems(exam, state, reveals), { course, oral, exam: true })}
          />
        </HStack>
        <HStack gap={3} align="center" wrap="wrap">
          <Text type="supporting" aria-live="polite">
            {allRated ? 'All answers rated.' : `${rated} of ${total} rated. Rate every answer to finish.`}
          </Text>
          <Button
            label="Save ratings and finish"
            variant="primary"
            icon={<Icon icon={Check} />}
            isDisabled={!allRated}
            isLoading={isSaving}
            onClick={() => onFinish(examItems(exam, state, reveals))}
          />
        </HStack>
      </HStack>
    </VStack>
  );
}
