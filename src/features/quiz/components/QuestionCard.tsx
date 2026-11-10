// One question on screen: the question, its code and the options under it, with Next / Skip; the
// side column holds the hints and, once answered, the verdict and explanation. Reports what
// happened through onOutcome. Use a key per question.
import { useEffect, useRef, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { useEntryAnimation } from '@astryxdesign/core/hooks';
import { SkipForward } from 'lucide-react';
import { useCourse } from '@/shared/session/SessionContext';
import { QueryCode } from '@/shared/editor';
import { HintPanel } from '@/shared/ui/HintPanel';
import { QuestionLayout } from '@/shared/ui/QuestionLayout';
import type { AnswerMode, QuizQuestion } from '../api';
import { useAnswer } from '../hooks/useAnswer';
import type { Outcome } from '../hooks/tally';
import { useOptionShortcuts } from '../hooks/useOptionShortcuts';
import { AnswerFeedback } from './AnswerFeedback';
import { FlagButton } from './FlagButton';
import { KeyHint } from './KeyHint';
import { OptionList } from './OptionList';
import { PensumTag } from './PensumTag';

type Props = {
  question: QuizQuestion;
  mode: AnswerMode;
  scope: string;
  /** Last question of the round: Next reads "See results". */
  isLast: boolean;
  onOutcome: (outcome: Outcome) => void;
};

export function QuestionCard({ question, mode, scope, isLast, onOutcome }: Props) {
  const course = useCourse();
  const [hintsUsed, setHintsUsed] = useState(0);
  const { phase, picked, result, correctPosition, choose, skip, next } = useAnswer({ question, mode, scope, onOutcome });
  const nextRef = useRef<HTMLButtonElement>(null);
  const answered = phase === 'answered';
  const entryStyle = useEntryAnimation('slideUp');

  useOptionShortcuts({
    optionCount: question.options.length,
    answered,
    canSkip: question.pensum,
    isBusy: phase === 'sending',
    onChoose: (position) => void choose(position),
    onSkip: () => void skip(),
    onNext: next,
  });

  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [answered]);

  const hints = course.features.hints ? (question.hints ?? []) : [];
  const showsHints = hints.length > 0 && (!answered || hintsUsed > 0);

  return (
    <QuestionLayout
      variant="aside"
      question={
        <>
          <HStack gap={2} justify="between" align="center">
            <HStack gap={2} wrap="wrap" align="center">
              {question.topic && <Token label={question.topic} size="sm" color="blue" />}
              {question.pensum && <PensumTag />}
            </HStack>
            <FlagButton questionId={question.id} />
          </HStack>
          <Heading level={2}>{question.question}</Heading>
          {question.code && <QueryCode code={question.code} />}
          <OptionList
            options={question.options}
            isSending={phase === 'sending'}
            picked={picked}
            correctPosition={correctPosition}
            onChoose={(position) => void choose(position)}
          />
          <HStack gap={2}>
            {answered ? (
              <Button ref={nextRef} label={isLast ? 'See results' : 'Next question'} variant="primary" size="lg" endContent={<Icon icon="chevronRight" />} onClick={next} />
            ) : (
              question.pensum && (
                <Button label="Skip this one" variant="ghost" icon={<Icon icon={SkipForward} />} isDisabled={phase === 'sending'} onClick={() => void skip()} />
              )
            )}
          </HStack>
        </>
      }
      answer={
        <>
          {result ? (
            <VStack xstyle={entryStyle}>
              <AnswerFeedback result={result} correctPosition={correctPosition} topic={question.topic} />
            </VStack>
          ) : (
            <Text color="secondary">Pick an answer. The explanation shows up here.</Text>
          )}
          {showsHints && (
            <Card padding={4}>
              <HintPanel hints={hints} used={hintsUsed} onUse={setHintsUsed} isLocked={answered} />
            </Card>
          )}
          <KeyHint count={question.options.length} canSkip={question.pensum && !answered} />
        </>
      }
    />
  );
}
