// Oral mode home: progress numbers, the main round and the other ways to practise, with the
// syllabus in its own column.
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Mic } from 'lucide-react';
import { withTopic } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { ActionList } from '@/shared/ui/dashboard/ActionList';
import { DashboardLayout } from '@/shared/ui/dashboard/DashboardLayout';
import { StartPanel } from '@/shared/ui/dashboard/StartPanel';
import { LectureList } from '@/shared/ui/LectureList';
import { Page } from '@/shared/ui/Page';
import { StatTiles } from '@/shared/ui/StatTiles';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { overviewPath, type Overview } from '../api';
import { homeActions } from '../homeActions';
import { useOral } from '../hooks/useOral';
import { daysAgo, loadLastSitting } from '../lib/lastSitting';

export default function OralHomePage() {
  const oral = useOral();
  const { data, error, isLoading, reload } = useApi<Overview>(overviewPath);
  const last = loadLastSitting();

  return (
    <Page title="Oral practice" description="Say it out loud. Then check it against the key points." width="full">
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading || !data ? (
        <LoadingState />
      ) : !data.stats.total ? (
        <EmptyState title="No oral questions yet" description="Add files to the course's oral folder (see schemas/oral-question.schema.json)." />
      ) : (
        <DashboardLayout
          aside={
            <VStack gap={2}>
              <LectureList
                title="Your syllabus"
                doneLabel="solid"
                isCompact
                items={data.topics.map((t) => ({
                  topic: t.topic,
                  done: t.solid,
                  total: t.total,
                  note: t.partial + t.missed ? `${t.partial + t.missed} need work` : null,
                  href: withTopic('/oral/play', t.topic),
                }))}
              />
              <HStack>
                <Button label="All lectures" variant="ghost" size="sm" href="/oral/lectures" endContent={<Icon icon="chevronRight" />} />
              </HStack>
            </VStack>
          }
        >
          <StatTiles
            label="Your oral progress"
            stats={[
              { label: 'Solid', value: data.stats.solid, total: data.stats.total, variant: 'success' },
              { label: 'Needs work', value: data.stats.partial + data.stats.missed },
              { label: 'Not tried', value: Math.max(0, data.stats.total - data.stats.solid - data.stats.partial - data.stats.missed) },
              ...(last ? [{ label: 'Last sitting', value: `${last.solid}/${last.total}`, description: `solid, ${daysAgo(last.at)}` }] : []),
            ]}
          />
          <Grid columns={{ minWidth: 320, max: 2 }} gap={5} align="start">
            <StartPanel
              run={data.runs.all}
              href="/oral/play"
              icon={Mic}
              isDisabled={!data.stats.playable}
              description={`All ${data.stats.playable} oral questions, shuffled. Say it out loud, then check it against the key points.`}
            />
            <ActionList actions={homeActions(data, oral)} />
          </Grid>
          <Text type="supporting">Only your ratings are saved on the server.</Text>
        </DashboardLayout>
      )}
    </Page>
  );
}
