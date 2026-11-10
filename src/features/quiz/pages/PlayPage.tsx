// Plays a round: the whole bank (/play), one lecture (/play/:topic) or the custom round (/custom/play).
// Progress is saved on the server after every answer, so a round can be paused and resumed.
import { useEffect, useState } from 'react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/VStack';
import { navigate, useParams } from '@/app/router';
import { scopeOf, topicLabel } from '@/shared/lib/format';
import { useSession } from '@/shared/session/SessionContext';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { Page } from '@/shared/ui/Page';
import { QuestionCard } from '../components/QuestionCard';
import { RoundProgress } from '../components/RoundProgress';
import { TestRoundSummary } from '../components/TestRoundSummary';
import { useTestRound } from '../hooks/useTestRound';

export default function PlayPage({ custom = false }: { custom?: boolean }) {
  const { topic = null } = useParams<{ topic?: string }>();
  const scope = custom ? 'custom' : scopeOf(topic);
  const { me } = useSession();
  const { state, tally, onOutcome, restart, retry } = useTestRound(scope, custom);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const missing = state.phase === 'missing';
  useEffect(() => {
    // A custom round is started on the Custom round page; with none in progress, go there.
    if (missing) navigate('/custom', { replace: true });
  }, [missing]);

  const back = custom
    ? { href: '/custom', label: 'Custom round' }
    : topic == null
      ? { href: '/', label: 'Overview' }
      : { href: '/lectures', label: 'Lectures' };

  if (state.phase === 'finished') return <TestRoundSummary topic={topic} custom={custom} tally={tally} />;
  if (state.phase === 'missing') return null;
  if (state.phase !== 'playing') {
    return (
      <Page title={custom ? 'Custom round' : topic == null ? 'Round' : topicLabel(topic)} back={back} width="medium">
        {state.phase === 'error' ? <ErrorState error={state.error} onRetry={retry} /> : <LoadingState />}
      </Page>
    );
  }

  const { run } = state;
  const question = run.current;
  if (!question) return null;
  const title = custom ? 'Custom round' : topic == null ? 'Round' : topicLabel(topic);
  return (
    <Page
      title={title}
      description={`Question ${run.position + 1} of ${run.total}`}
      back={back}
      width="full"
      actions={
        custom ? (
          <Button label="New custom round" variant="ghost" size="sm" href="/custom" />
        ) : (
          <Button label="Restart round" variant="ghost" size="sm" onClick={() => setConfirmRestart(true)} />
        )
      }
    >
      <VStack gap={4}>
        <RoundProgress position={run.position} total={run.total} streak={tally.streak ?? me?.stats.streak ?? 0} />
        <QuestionCard
          key={question.id}
          question={question}
          mode="test"
          scope={scope}
          isLast={run.position + 1 >= run.total}
          onOutcome={(o) => void onOutcome(o)}
        />
      </VStack>
      <AlertDialog
        isOpen={confirmRestart}
        onOpenChange={setConfirmRestart}
        title="Restart this round?"
        description="Start a new round from question 1? Your points and history are kept."
        actionLabel="Restart"
        onAction={() => void restart()}
      />
    </Page>
  );
}
