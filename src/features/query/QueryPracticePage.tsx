// Query practice ('/query'): a round of only the write-a-query questions, typed in the code
// editor and checked against the model query. Works whether oral mode is on or not; it reuses the
// oral round and question screen, with the server's 'query' scope.
import { VStack } from '@astryxdesign/core/VStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { useQuerySettings } from '@/shared/editor';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { OralQuestionScreen } from '@/features/oral/components/OralQuestionScreen';
import { RoundActions } from '@/features/oral/components/RoundActions';
import { SittingSummary } from '@/features/oral/components/SittingSummary';
import { useOralRound } from '@/features/oral/hooks/useOralRound';

const SCOPE = 'query';

export default function QueryPracticePage() {
  const query = useQuerySettings();
  const title = query?.title ?? 'Query practice';
  const language = query?.language ?? 'query';
  const { run, error, sitting, advance, restart, retry } = useOralRound(SCOPE, false);

  if (error || !run) {
    return (
      <Page title={title}>
        {error ? <ErrorState error={error} onRetry={retry} /> : <LoadingState />}
      </Page>
    );
  }
  if (run.finished || !run.current) {
    return (
      <SittingSummary
        title={`${title} round done`}
        items={sitting}
        home={{ label: 'New round', onClick: () => void restart() }}
      />
    );
  }

  return (
    <Page
      title={title}
      description={`Write the ${language} statement, then compare it with the model query. Question ${run.position + 1} of ${run.total}.`}
      width="full"
      actions={<RoundActions sitting={sitting} isCustom={false} hasTimer={false} onRestart={restart} />}
    >
      <VStack gap={4}>
        <ProgressBar label="Round progress" isLabelHidden value={run.position} max={Math.max(1, run.total)} />
        <OralQuestionScreen
          key={run.current.id}
          question={run.current}
          mode="round"
          scope={SCOPE}
          onRated={(item) => void advance(item)}
          onResync={() => void advance(null)}
          hasTimer={false}
        />
      </VStack>
    </Page>
  );
}
