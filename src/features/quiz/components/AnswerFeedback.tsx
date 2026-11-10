// Verdict after answering: points, the right letter, the explanation and where to read more.
import { Banner } from '@astryxdesign/core/Banner';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { SourceLine } from '@/shared/ui/SourceLine';
import { LETTERS } from '../hooks/useOptionShortcuts';
import type { AnswerResult } from '../api';

export function AnswerFeedback({ result, correctPosition, topic }: { result: AnswerResult; correctPosition: number; topic: string | null }) {
  const title = result.correct
    ? `Correct!${result.points ? ` +${result.points} ${result.points === 1 ? 'point' : 'points'}` : ''}`
    : `Not quite. The answer is ${LETTERS[correctPosition]}.`;
  const hasMore = Boolean(result.explanation || result.source);
  return (
    <Banner status={result.correct ? 'success' : 'error'} title={title} collapsible={false}>
      {hasMore && (
        <VStack gap={2}>
          {result.explanation && <Text>{result.explanation}</Text>}
          {result.source && <SourceLine source={result.source} topic={topic} />}
        </VStack>
      )}
    </Banner>
  );
}
