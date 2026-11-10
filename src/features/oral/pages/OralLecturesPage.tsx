// Every lecture with its oral progress: practise it, resume it, or go over what needs work.
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Play, StepForward, Target } from 'lucide-react';
import { plural, withTopic } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { LectureList } from '@/shared/ui/LectureList';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { overviewPath, type LectureOverview, type Overview } from '../api';
import { useTypeLabel } from '../hooks/useOral';

function Actions({ t }: { t: LectureOverview }) {
  if (!t.total) return null;
  const needs = t.partial + t.missed;
  const resuming = t.run != null && !t.run.finished;
  return (
    <HStack gap={2} wrap="wrap" justify="end">
      {needs > 0 && <Button label={`Needs work (${needs})`} variant="ghost" size="sm" icon={<Icon icon={Target} />} href={withTopic('/oral/needs-work', t.topic)} />}
      <Button
        label={resuming ? `Resume ${t.run?.position}/${t.run?.total}` : 'Practise'}
        variant={resuming ? 'primary' : 'secondary'}
        size="sm"
        icon={<Icon icon={resuming ? StepForward : Play} />}
        href={withTopic('/oral/play', t.topic)}
      />
    </HStack>
  );
}

export default function OralLecturesPage() {
  const label = useTypeLabel();
  const { data, error, isLoading, reload } = useApi<Overview>(overviewPath);
  return (
    <Page title="Lectures" description="Practise one lecture at a time." back={{ href: '/oral', label: 'Oral' }} width="medium">
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading || !data ? (
        <LoadingState />
      ) : (
        <LectureList
          doneLabel="solid"
          items={data.topics.map((t) => {
            const needs = t.partial + t.missed;
            const types = Object.entries(t.types)
              .map(([type, n]) => `${n} ${label(type).toLowerCase()}`)
              .join(', ');
            return {
              topic: t.topic,
              done: t.solid,
              total: t.total,
              meta: t.total ? `${plural(t.total, 'question')} (${types}) · ${t.solid} solid${needs ? ` · ${needs} need work` : ''}` : undefined,
              actions: <Actions t={t} />,
            };
          })}
        />
      )}
    </Page>
  );
}
