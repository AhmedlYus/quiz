// Questions last rated "missed" or "partly", one after another, optionally within one lecture.
import { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Button } from '@astryxdesign/core/Button';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { useApi } from '@/shared/lib/useApi';
import { scopeOf } from '@/shared/lib/format';
import { useParams } from '@/app/router';
import { listPath, type RatedQuestion } from '../api';
import { OralQuestionScreen } from '../components/OralQuestionScreen';
import { SittingSummary } from '../components/SittingSummary';
import { TimerSwitch } from '../components/TimerSwitch';
import type { GradedItem } from '../lib/gradingPrompt';
import { RATING_LABELS } from '../lib/labels';

export default function NeedsWorkPage() {
  const { topic } = useParams<{ topic?: string }>();
  const { data, error, isLoading, reload } = useApi<{ questions: RatedQuestion[] }>(listPath('needs-work', scopeOf(topic)));
  const [index, setIndex] = useState(0);
  const [sitting, setSitting] = useState<GradedItem[]>([]);
  const back = topic == null ? { href: '/oral', label: 'Oral' } : { href: '/oral/lectures', label: 'Lectures' };

  if (error) {
    return (
      <Page title="Needs work" back={back}>
        <ErrorState error={error} onRetry={reload} />
      </Page>
    );
  }
  if (isLoading || !data) {
    return (
      <Page title="Needs work" back={back}>
        <LoadingState />
      </Page>
    );
  }
  const { questions } = data;
  if (!questions.length) {
    return (
      <Page title="Needs work" back={back}>
        <EmptyState
          title="Nothing needs work"
          description='Answers you rate "missed it" or "partly" show up here until you rate them solid.'
          actions={<Button label="Oral home" variant="primary" href="/oral" />}
        />
      </Page>
    );
  }
  if (index >= questions.length) {
    return <SittingSummary title="Needs work: done" items={sitting} topic={topic} />;
  }

  const q = questions[index];
  return (
    <Page
      title="Needs work"
      description={`Question ${index + 1} of ${questions.length} · Last time: ${RATING_LABELS[q.rating].toLowerCase()}`}
      back={back}
      actions={<TimerSwitch />}
    >
      <VStack gap={4}>
        <ProgressBar label="Progress" isLabelHidden value={index} max={questions.length} />
        <OralQuestionScreen
          key={q.id}
          question={q}
          mode="practice"
          onRated={(item) => {
            setSitting((s) => [...s, item]);
            setIndex(index + 1);
          }}
        />
      </VStack>
    </Page>
  );
}
