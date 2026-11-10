// Answer phase: one question at a time with hints, the answer box and the optional countdown.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { ArrowLeft, ArrowRight, ListChecks } from 'lucide-react';
import { QuestionLayout } from '@/shared/ui/QuestionLayout';
import { AnswerCard } from '@/features/oral/components/AnswerCard';
import { QuestionPrompt } from '@/features/oral/components/QuestionPrompt';
import type { ExamView } from './api';
import type { ExamProgressApi } from './useExamProgress';

export function ExamAnswerStep({ exam, progress }: { exam: ExamView; progress: ExamProgressApi }) {
  const { state } = progress;
  const last = exam.questions.length - 1;
  const index = Math.min(state.index, last);
  const q = exam.questions[index];

  return (
    <VStack gap={4}>
      <ProgressBar label="Questions answered" isLabelHidden value={index} max={Math.max(1, exam.questions.length)} />
      <QuestionLayout
        key={q.id}
        question={
          <QuestionPrompt
            question={q}
            hintsUsed={state.hints[q.id] ?? 0}
            onHint={(n) => progress.setHints(q.id, n)}
            isHintLocked={false}
          />
        }
        answer={
          <AnswerCard
            question={q}
            label="What you say"
            rows={8}
            value={state.answers[q.id] ?? ''}
            onChange={(text) => progress.setAnswer(q.id, text)}
            onSettled={(text) => progress.setAnswer(q.id, text)}
          />
        }
      />
      <HStack gap={2} justify="between" wrap="wrap">
        <Button
          label="Previous"
          icon={<Icon icon={ArrowLeft} />}
          isDisabled={index === 0}
          onClick={() => progress.setIndex(index - 1)}
        />
        {index < last ? (
          <Button
            label="Next question"
            variant="primary"
            endContent={<Icon icon={ArrowRight} />}
            onClick={() => progress.setIndex(index + 1)}
          />
        ) : (
          <Button
            label="Finish and check my answers"
            variant="primary"
            icon={<Icon icon={ListChecks} />}
            onClick={() => progress.setPhase('review')}
          />
        )}
      </HStack>
    </VStack>
  );
}
