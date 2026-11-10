// Quiz overview ('/'): key numbers, the main action and the other ways to study, with the
// syllabus in its own column.
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import { withTopic } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { useCourse, useSession } from '@/shared/session/SessionContext';
import { ActionList } from '@/shared/ui/dashboard/ActionList';
import { DashboardLayout } from '@/shared/ui/dashboard/DashboardLayout';
import { StartPanel } from '@/shared/ui/dashboard/StartPanel';
import { LectureList } from '@/shared/ui/LectureList';
import { Page } from '@/shared/ui/Page';
import { StatTiles } from '@/shared/ui/StatTiles';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import type { TopicRow } from '../api';
import { LeaderboardPreview } from '../components/LeaderboardPreview';
import { NoticesBanner } from '../components/NoticesBanner';
import { PensumSwitch } from '../components/PensumSwitch';
import { homeActions } from '../homeActions';
import { useHomeShortcuts } from '../hooks/useHomeShortcuts';

export default function QuizHomePage() {
  const course = useCourse();
  const { me } = useSession();
  const topics = useApi<{ topics: TopicRow[] }>('topics');
  const actions = me ? homeActions(me) : [];
  const studyCount = me ? (me.user.includePensum ? me.stats.total : me.stats.total - me.stats.pensum) : 0;
  useHomeShortcuts([{ shortcut: '1', href: '/play', isDisabled: !studyCount }, ...actions]);
  if (!me) return null;

  const { stats, run } = me;
  const level = Math.floor(stats.points / 100) + 1;

  const syllabus = topics.error ? (
    <ErrorState error={topics.error} onRetry={topics.reload} />
  ) : topics.data ? (
    <VStack gap={2}>
      <LectureList
        title="Your syllabus"
        doneLabel="mastered"
        isCompact
        items={topics.data.topics.map((t) => ({
          topic: t.topic,
          done: t.mastered,
          total: t.total,
          isReady: t.ready,
          note: t.mistakes ? `${t.mistakes} to fix` : null,
          href: withTopic('/play', t.topic),
        }))}
      />
      <HStack>
        <Button label="All lectures" variant="ghost" size="sm" href="/lectures" endContent={<Icon icon="chevronRight" />} />
      </HStack>
    </VStack>
  ) : (
    <LoadingState />
  );

  return (
    <Page
      title={course.appName}
      description={course.tagline}
      width="full"
      actions={me.user.admin && me.openFlags ? <Button label={`Flagged questions (${me.openFlags})`} href="/flags" /> : undefined}
    >
      <DashboardLayout aside={syllabus}>
        <NoticesBanner notices={me.notices} />
        <StatTiles
          label="Your progress"
          stats={[
            { label: 'Mastered', value: stats.mastered, total: stats.total, variant: 'success' },
            { label: 'Mistakes', value: stats.mistakes, description: stats.hard ? `${stats.hard} hard for everyone` : undefined },
            { label: 'Points', value: stats.points, description: `Level ${level} · ${100 - (stats.points % 100)} to the next` },
            { label: 'Streak', value: stats.streak, description: `Best ${stats.bestStreak}` },
          ]}
        />
        <Grid columns={{ minWidth: 320, max: 2 }} gap={5} align="start">
          <StartPanel run={run} href="/play" description={`All ${studyCount} questions, shuffled`} isDisabled={!studyCount} shortcut="1" />
          <ActionList actions={actions} />
        </Grid>
        {stats.pensum > 0 && <PensumSwitch count={stats.pensum} onChanged={topics.reload} />}
        {course.features.leaderboard && <LeaderboardPreview />}
      </DashboardLayout>
    </Page>
  );
}
