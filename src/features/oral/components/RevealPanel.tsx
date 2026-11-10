// After answering: key points to tick, the model answer and the rating. Fully controlled, so the
// round screen (rating moves on at once) and the exam review (rating is chosen, saved at the end)
// share it.
import { useEffect } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Divider } from '@astryxdesign/core/Divider';
import type { OralQuestion, Rating, Reveal } from '../api';
import { KeyPointChecklist } from './KeyPointChecklist';
import { ModelAnswer } from './ModelAnswer';
import { RatingButtons } from './RatingButtons';

type Props = {
  question: OralQuestion;
  reveal: Reveal;
  /** What the player said or typed, used to suggest covered key points. */
  answer: string;
  checked: number[];
  onCheckedChange: (checked: number[]) => void;
  rateLabel?: string;
  selected?: Rating | null;
  busy?: Rating | null;
  isRatingDisabled?: boolean;
  onRate: (rating: Rating) => void;
  /** Move keyboard focus here when it appears, so screen readers land on the new content. */
  hasFocusOnMount?: boolean;
  headingLevel?: 2 | 3;
};

export function RevealPanel({
  question,
  reveal,
  answer,
  checked,
  onCheckedChange,
  rateLabel = 'How did it go?',
  selected,
  busy,
  isRatingDisabled,
  onRate,
  hasFocusOnMount = false,
  headingLevel = 2,
}: Props) {
  const headingId = `reveal-${question.id}`;
  useEffect(() => {
    if (!hasFocusOnMount) return;
    const el = document.getElementById(headingId);
    el?.setAttribute('tabindex', '-1');
    el?.focus();
  }, [hasFocusOnMount, headingId]);

  return (
    <Card padding={5}>
      <VStack gap={5} as="section" aria-label="Answer and self-check">
        <Heading level={headingLevel} id={headingId}>
          Check yourself
        </Heading>
        <KeyPointChecklist points={reveal.keyPoints} answer={answer} checked={checked} onChange={onCheckedChange} />
        <Divider />
        <ModelAnswer reveal={reveal} topic={question.topic} isQuery={question.type === 'query'} />
        <Divider />
        <RatingButtons label={rateLabel} selected={selected} busy={busy} isDisabled={isRatingDisabled} onRate={onRate} />
      </VStack>
    </Card>
  );
}
