// Custom round: pick lectures, question types and length, then play it at '/oral/custom/play'.
import { VStack } from '@astryxdesign/core/VStack';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { useApi } from '@/shared/lib/useApi';
import { overviewPath, type Overview } from '../api';
import { CustomRoundForm } from '../components/CustomRoundForm';

export default function OralCustomPage() {
  const { data, error, isLoading, reload } = useApi<Overview>(overviewPath);
  const run = data?.runs.custom;
  return (
    <Page
      title="Custom round"
      description="Pick lectures, question types and length."
      back={{ href: '/oral', label: 'Oral' }}
    >
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading || !data ? (
        <LoadingState />
      ) : (
        <VStack gap={4}>
          {run && !run.finished && (
            <Banner
              status="info"
              title="Custom round in progress"
              description={`${run.position} of ${run.total} answered`}
              collapsible={false}
              endContent={<Button label="Resume" variant="primary" size="sm" href="/oral/custom/play" />}
            />
          )}
          <CustomRoundForm overview={data} />
        </VStack>
      )}
    </Page>
  );
}
