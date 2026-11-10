// Every question the player currently has right, searchable.
import { useMemo, useState } from 'react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useApi } from '@/shared/lib/useApi';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import type { CorrectQuestion } from '../api';
import { CorrectQuestionCard } from '../components/CorrectQuestionCard';

export default function CorrectPage() {
  const { data, error, reload } = useApi<{ questions: CorrectQuestion[] }>('correct');
  const [term, setTerm] = useState('');

  const shown = useMemo(() => {
    const t = term.trim().toLowerCase();
    const all = data?.questions ?? [];
    if (!t) return all;
    return all.filter((q) => [q.question, q.options[q.answer], q.explanation, q.topic].join(' ').toLowerCase().includes(t));
  }, [data, term]);

  return (
    <Page
      title="Answered right"
      description={data ? `${data.questions.length} questions mastered` : undefined}
      back={{ href: '/', label: 'Overview' }}
      width="medium"
    >
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <VStack gap={4}>
          <TextInput label="Search" isLabelHidden type="search" startIcon="search" hasClear value={term} onChange={setTerm} placeholder="Search questions and answers…" />
          {shown.length ? shown.map((q) => <CorrectQuestionCard key={q.id} q={q} />) : <EmptyState title="Nothing matches" description={term ? 'Try another search.' : 'Answer some questions first.'} />}
        </VStack>
      )}
    </Page>
  );
}
