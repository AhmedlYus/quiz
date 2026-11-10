// Key points and model answer of one solid question, loaded when its row is opened.
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { List, ListItem } from '@astryxdesign/core/List';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { useApi } from '@/shared/lib/useApi';
import { revealPath, type Reveal } from '../api';
import { ModelAnswer } from './ModelAnswer';

export function SolidDetail({ id, topic, isQuery }: { id: string; topic: string; isQuery: boolean }) {
  const { data, error, isLoading, reload } = useApi<Reveal>(revealPath(id));
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (isLoading || !data) return <LoadingState />;
  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Text weight="semibold">Key points</Text>
        <List listStyle="disc">
          {data.keyPoints.map((p, i) => (
            <ListItem key={i} label={<Text>{p}</Text>} />
          ))}
        </List>
      </VStack>
      <ModelAnswer reveal={data} topic={topic} isQuery={isQuery} />
    </VStack>
  );
}
