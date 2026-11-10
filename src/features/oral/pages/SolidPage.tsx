// Questions you rated solid, each opening to its key points and model answer.
import { Fragment, useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Divider } from '@astryxdesign/core/Divider';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Button } from '@astryxdesign/core/Button';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { useApi } from '@/shared/lib/useApi';
import { listPath, type RatedQuestion } from '../api';
import { SolidDetail } from '../components/SolidDetail';
import { TypeTag } from '../components/TypeTag';

function SolidRow({ q }: { q: RatedQuestion }) {
  const [opened, setOpened] = useState(false);
  return (
    <Collapsible
      defaultIsOpen={false}
      onOpenChange={(open) => open && setOpened(true)}
      trigger={
        <VStack gap={1}>
          <HStack gap={2} align="center" wrap="wrap">
            <TypeTag type={q.type} size="sm" />
            <Text type="supporting">{q.topic}</Text>
          </HStack>
          <Text weight="semibold" maxLines={2}>
            {q.prompt}
          </Text>
        </VStack>
      }
    >
      {opened && <SolidDetail id={q.id} topic={q.topic} isQuery={q.type === 'query'} />}
    </Collapsible>
  );
}

export default function SolidPage() {
  const { data, error, isLoading, reload } = useApi<{ questions: RatedQuestion[] }>(listPath('solid', 'all'));
  const count = data?.questions.length;
  return (
    <Page
      title="Solid answers"
      description={count == null ? undefined : `${count} rated solid. Open one to read the key points again.`}
      back={{ href: '/oral', label: 'Oral' }}
      width="medium"
    >
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading || !data ? (
        <LoadingState />
      ) : data.questions.length === 0 ? (
        <EmptyState
          title="Nothing rated solid yet"
          description="Answers you rate solid collect here."
          actions={<Button label="Start a round" variant="primary" href="/oral/play" />}
        />
      ) : (
        <Card padding={4}>
          <VStack gap={3}>
            {data.questions.map((q, i) => (
              <Fragment key={q.id}>
                {i > 0 && <Divider />}
                <SolidRow q={q} />
              </Fragment>
            ))}
          </VStack>
        </Card>
      )}
    </Page>
  );
}
