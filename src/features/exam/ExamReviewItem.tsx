// One exam question in the review: the question and what you said on the left, key points,
// model answer and rating on the right.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { QueryCode } from '@/shared/editor';
import { Divider } from '@astryxdesign/core/Divider';
import { QuestionLayout } from '@/shared/ui/QuestionLayout';
import type { OralQuestion, Rating, Reveal } from '@/features/oral/api';
import { ProseText } from '@/features/oral/components/ProseText';
import { RevealPanel } from '@/features/oral/components/RevealPanel';
import { TypeTag } from '@/features/oral/components/TypeTag';
import { plural } from '@/shared/lib/format';

export function ExamReviewItem({
  number,
  question: q,
  reveal,
  answer,
  hintsUsed,
  checked,
  rating,
  onCheckedChange,
  onRate,
}: {
  number: number;
  question: OralQuestion;
  reveal: Reveal;
  answer: string;
  hintsUsed: number;
  checked: number[];
  rating: Rating | undefined;
  onCheckedChange: (checked: number[]) => void;
  onRate: (rating: Rating) => void;
}) {
  return (
    <VStack gap={3}>
      <Heading level={2}>Question {number}</Heading>
      <QuestionLayout
        question={
          <>
            <HStack gap={2} align="center" wrap="wrap">
              <TypeTag type={q.type} />
              <Text type="supporting">{q.topic}</Text>
            </HStack>
            <ProseText type="large">{q.prompt}</ProseText>
            {q.code && <QueryCode code={q.code} isPlain />}
            <Divider />
            <VStack gap={1}>
              <Text type="label" weight="semibold">
                What you said
              </Text>
              {answer.trim() ? <ProseText>{answer}</ProseText> : <Text color="secondary">Nothing recorded.</Text>}
              {hintsUsed > 0 && <Text type="supporting">{plural(hintsUsed, 'hint')} used.</Text>}
            </VStack>
          </>
        }
        answer={
          <RevealPanel
            question={q}
            reveal={reveal}
            answer={answer}
            checked={checked}
            onCheckedChange={onCheckedChange}
            rateLabel="Rate this answer"
            selected={rating ?? null}
            onRate={onRate}
            headingLevel={3}
          />
        }
      />
    </VStack>
  );
}
