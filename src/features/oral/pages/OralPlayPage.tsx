// A round of oral questions: all of them ('/oral/play'), one lecture ('/oral/play/:topic') or a
// custom pick ('/oral/custom/play'). Resumes where you stopped; ends with a sitting summary.
import { VStack } from '@astryxdesign/core/VStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { scopeOf } from '@/shared/lib/format';
import { useParams } from '@/app/router';
import { OralQuestionScreen } from '../components/OralQuestionScreen';
import { RoundActions } from '../components/RoundActions';
import { SittingSummary } from '../components/SittingSummary';
import { useOralRound } from '../hooks/useOralRound';

export default function OralPlayPage({ custom = false }: { custom?: boolean }) {
  const { topic } = useParams<{ topic?: string }>();
  const scope = custom ? 'custom' : scopeOf(topic);
  const name = custom ? 'Custom round' : topic ?? 'Oral round';
  const back = custom ? { href: '/oral/custom', label: 'Custom round' } : topic == null ? { href: '/oral', label: 'Oral' } : { href: '/oral/lectures', label: 'Lectures' };
  const { run, error, sitting, advance, restart, retry } = useOralRound(scope, custom);

  if (error) {
    return (
      <Page title={name} back={back}>
        <ErrorState error={error} onRetry={retry} />
      </Page>
    );
  }
  if (!run) {
    return (
      <Page title={name} back={back}>
        <LoadingState />
      </Page>
    );
  }
  if (run.finished || !run.current) {
    return (
      <SittingSummary
        title={custom ? 'Custom round done' : topic == null ? 'Round done' : `${topic} done`}
        items={sitting}
        topic={topic}
        again={custom ? { label: 'New custom round', href: '/oral/custom' } : topic == null ? undefined : { label: 'All lectures', href: '/oral/lectures' }}
      />
    );
  }

  return (
    <Page
      title={name}
      description={`Question ${run.position + 1} of ${run.total}`}
      back={back}
      width="full"
      actions={<RoundActions sitting={sitting} isCustom={custom} onRestart={restart} />}
    >
      <VStack gap={4}>
        <ProgressBar label="Round progress" isLabelHidden value={run.position} max={Math.max(1, run.total)} />
        <OralQuestionScreen
          key={run.current.id}
          question={run.current}
          mode="round"
          scope={scope}
          onRated={(item) => void advance(item)}
          onResync={() => void advance(null)}
        />
      </VStack>
    </Page>
  );
}
