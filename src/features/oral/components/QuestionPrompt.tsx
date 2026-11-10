// The question side: topic, type, the prompt, any code to work from, and the hints.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { QueryCode } from '@/shared/editor';
import { HintPanel } from '@/shared/ui/HintPanel';
import type { OralQuestion } from '../api';
import { ProseText } from './ProseText';
import { TypeTag } from './TypeTag';

export function QuestionPrompt({
  question,
  hintsUsed,
  onHint,
  isHintLocked,
}: {
  question: OralQuestion;
  hintsUsed: number;
  onHint: (used: number) => void;
  isHintLocked: boolean;
}) {
  return (
    <>
      <HStack gap={2} align="center" wrap="wrap">
        <TypeTag type={question.type} />
        <Text type="supporting">{question.topic}</Text>
      </HStack>
      <ProseText type="large">{question.prompt}</ProseText>
      {question.code && <QueryCode code={question.code} isPlain />}
      <VStack>
        <HintPanel hints={question.hints ?? []} used={hintsUsed} onUse={onHint} isLocked={isHintLocked} />
      </VStack>
    </>
  );
}
