// Custom round: pick lectures and length, then play the random selection at /custom/play.
import { useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { VStack } from '@astryxdesign/core/VStack';
import { StepForward, Play } from 'lucide-react';
import { navigate } from '@/app/router';
import { plural } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { useSession } from '@/shared/session/SessionContext';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { startRun, type TopicRow } from '../api';
import { CustomRoundForm } from '../components/CustomRoundForm';
import { useCustomChoices } from '../hooks/useCustomChoices';

function CustomRound({ topics }: { topics: TopicRow[] }) {
  const { me } = useSession();
  const showToast = useToast();
  const choices = useCustomChoices(topics);
  const [isStarting, setIsStarting] = useState(false);
  const { count, selected, unmastered } = choices;

  const chosen = topics.filter((t) => selected.includes(t.topic));
  const available = chosen.reduce((s, t) => s + (unmastered ? t.unmastered : t.playable), 0);
  const n = count == null ? available : Math.min(count, available);
  const customRun = me?.customRun;
  const resuming = customRun != null && !customRun.finished;

  async function start() {
    setIsStarting(true);
    try {
      await startRun('custom', { topics: selected, count, unmastered });
      navigate('/custom/play');
    } catch (e) {
      showToast({ body: (e as Error).message, type: 'error' });
      setIsStarting(false);
    }
  }

  return (
    <VStack gap={6}>
      {resuming && (
        <Banner
          status="info"
          title="Unfinished custom round"
          description={`${customRun.position} of ${customRun.total} answered`}
          collapsible={false}
          endContent={<Button label="Resume" href="/custom/play" icon={<Icon icon={StepForward} />} />}
        />
      )}
      <CustomRoundForm topics={topics} choices={choices} />
      <VStack gap={2} hAlign="start">
        <Button
          label={n === 0 ? (chosen.length ? 'No questions match' : 'Pick at least one lecture') : `Start ${plural(n, 'question')} from ${plural(chosen.length, 'lecture')}`}
          variant="primary"
          size="lg"
          icon={<Icon icon={Play} />}
          isDisabled={n === 0}
          isLoading={isStarting}
          onClick={() => void start()}
        />
        <Text type="supporting">
          {resuming ? 'Starting a new round replaces the unfinished one. ' : ''}
          {me?.user.includePensum ? '' : 'Pensum-only questions are left out (switch on the overview). '}
          Progress saves after every answer.
        </Text>
      </VStack>
    </VStack>
  );
}

export default function CustomRoundPage() {
  const { data, error, reload } = useApi<{ topics: TopicRow[] }>('topics');
  return (
    <Page title="Custom round" description="Pick a length and lectures; the round draws randomly from them." back={{ href: '/', label: 'Overview' }} width="narrow">
      {error ? <ErrorState error={error} onRetry={reload} /> : !data ? <LoadingState /> : <CustomRound topics={data.topics} />}
    </Page>
  );
}
