// All lectures with the player's progress, and a round of their own for each.
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Play, StepForward, Target } from 'lucide-react';
import { plural, withTopic } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { useCourse } from '@/shared/session/SessionContext';
import { LectureList } from '@/shared/ui/LectureList';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import type { TopicRow } from '../api';
import { samplesText } from '../samples';

function Actions({ t }: { t: TopicRow }) {
  if (!t.total) return null;
  const resuming = t.run != null && !t.run.finished;
  return (
    <HStack gap={2} wrap="wrap" justify="end">
      {t.mistakes > 0 && <Button label={`Fix ${t.mistakes}`} variant="ghost" size="sm" href={withTopic('/mistakes', t.topic)} icon={<Icon icon={Target} />} />}
      <Button
        label={resuming ? `Resume ${t.run?.position}/${t.run?.total}` : t.run ? 'Play again' : 'Start'}
        variant={resuming ? 'primary' : 'secondary'}
        size="sm"
        href={withTopic('/play', t.topic)}
        icon={<Icon icon={resuming ? StepForward : Play} />}
      />
    </HStack>
  );
}

export default function LecturesPage() {
  const course = useCourse();
  const { data, error, reload } = useApi<{ topics: TopicRow[] }>('topics');
  return (
    <Page title="Lectures" description={data ? plural(data.topics.length, 'lecture') : undefined} back={{ href: '/', label: 'Overview' }} width="medium">
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <VStack gap={4}>
          <LectureList
            doneLabel="mastered"
            items={data.topics.map((t) => ({
              topic: t.topic,
              done: t.mastered,
              total: t.total,
              isReady: t.ready,
              note: t.mistakes ? plural(t.mistakes, 'mistake') : null,
              meta: t.ready || !t.total ? undefined : `Coming soon · only ${samplesText(t.total, course.samplesOwner)} so far · ${t.mastered}/${t.total} mastered`,
              actions: <Actions t={t} />,
            }))}
          />
          <Text type="supporting">Each lecture has its own round that you can pause and resume. Points count the same everywhere.</Text>
        </VStack>
      )}
    </Page>
  );
}
