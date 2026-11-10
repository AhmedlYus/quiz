// Study mistakes (/mistakes/:topic?) and questions that are hard for everyone (/hard/:topic?).
// Two tabs once enough players have answered; each lists its questions and can run them as a round.
import { useEffect, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { navigate, useParams } from '@/app/router';
import { plural, scopeOf, topicLabel, withTopic } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { Page } from '@/shared/ui/Page';
import { CircleCheck, Play } from 'lucide-react';
import type { HardQuestion, QuizQuestion } from '../api';
import { QueueRound } from '../components/QueueRound';
import { QuestionList } from '../components/QuestionList';

type PracticeTab = 'mistakes' | 'hard';

export default function PracticePage({ tab = 'mistakes' }: { tab?: PracticeTab }) {
  const { topic = null } = useParams<{ topic?: string }>();
  const scope = encodeURIComponent(scopeOf(topic));
  const mistakes = useApi<{ questions: QuizQuestion[] }>(`mistakes?scope=${scope}`);
  const hard = useApi<{ questions: HardQuestion[] }>(`hard?scope=${scope}`);
  const [running, setRunning] = useState<PracticeTab | null>(null);

  const loaded = mistakes.data && hard.data;
  const hasHard = Boolean(hard.data?.questions.length);
  const redirect = Boolean(loaded) && tab === 'hard' && !hasHard;
  useEffect(() => {
    if (redirect) navigate(withTopic('/mistakes', topic), { replace: true });
  }, [redirect, topic]);

  const back = topic == null ? { href: '/', label: 'Overview' } : { href: '/lectures', label: 'Lectures' };
  const title = topic == null ? 'Study mistakes' : topicLabel(topic);
  const error = mistakes.error ?? hard.error;
  if (error || !loaded) {
    return (
      <Page title={title} back={back} width="medium">
        {error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              mistakes.reload();
              hard.reload();
            }}
          />
        ) : (
          <LoadingState />
        )}
      </Page>
    );
  }
  if (redirect) return null;

  const exit = () => {
    setRunning(null);
    mistakes.reload();
    hard.reload();
  };
  if (running) {
    const questions = running === 'hard' ? hard.data!.questions : mistakes.data!.questions;
    return <QueueRound mode={running} questions={questions} topic={topic} onExit={exit} />;
  }

  const items = tab === 'hard' ? hard.data!.questions : mistakes.data!.questions;
  const where = topic == null ? '' : ` in ${topicLabel(topic)}`;
  const lead =
    tab === 'hard'
      ? `Questions${where} that most players get wrong on their first try.`
      : `Questions${where} where your latest answer was wrong.`;
  const startLabel =
    tab === 'hard' ? `Practise ${plural(items.length, 'hard question')}` : `Fix ${plural(items.length, 'mistake')}`;

  return (
    <Page title={title} description={lead} back={back} width="medium">
      <VStack gap={5}>
        {hasHard && (
          <TabList value={tab} onChange={(v) => navigate(withTopic(`/${v}`, topic))} hasDivider>
            <Tab value="mistakes" label="Your mistakes" endContent={<Badge label={String(mistakes.data!.questions.length)} />} />
            <Tab value="hard" label="Hard for everyone" endContent={<Badge label={String(hard.data!.questions.length)} />} />
          </TabList>
        )}
        {items.length === 0 ? (
          <EmptyState
            icon={<Icon icon={CircleCheck} size="lg" color="success" />}
            title="Nothing to fix"
            description={`Nothing to fix${where}. Everything you have answered is currently right.`}
            actions={<Button label={back.label} href={back.href} />}
          />
        ) : (
          <>
            <HStack gap={3} align="center" justify="between" wrap="wrap">
              <StackItem size="fill">
                <Text color="secondary">{plural(items.length, 'question')}</Text>
              </StackItem>
              <Button label={startLabel} variant="primary" icon={<Icon icon={Play} />} onClick={() => setRunning(tab)} />
            </HStack>
            <QuestionList questions={items} showTopic={topic == null} label={tab === 'hard' ? 'Hardest first' : 'Questions to fix'} />
          </>
        )}
      </VStack>
    </Page>
  );
}
