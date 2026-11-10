// Admins only: flagged questions, grouped, without the flaggers' names. /flags shows open flags,
// /flags/all also the resolved ones.
import { useEffect } from 'react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { navigate, useParams } from '@/app/router';
import { useApi } from '@/shared/lib/useApi';
import { useSession } from '@/shared/session/SessionContext';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { flagsPath, type FlaggedQuestion, type FlagFilter } from './api';
import { FlagCard } from './components/FlagCard';

export default function FlagsPage() {
  const { filter } = useParams<{ filter?: string }>();
  const view: FlagFilter = filter === 'all' ? 'all' : 'open';
  const { me, refreshMe } = useSession();
  const isAdmin = Boolean(me?.user.admin);
  const { data, error, reload } = useApi<{ questions: FlaggedQuestion[] }>(isAdmin ? flagsPath(view) : null);

  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true });
  }, [isAdmin]);

  const onResolved = () => {
    reload();
    void refreshMe();
  };

  return (
    <Page
      title={view === 'all' ? 'All flags' : 'Flagged questions'}
      description="Only admins see this page. Flags are shown without names. Fix the question in the repo first, then mark it fixed."
      back={{ href: '/', label: 'Overview' }}
      width="medium"
    >
      <VStack gap={4}>
        <TabList value={view} onChange={(v) => navigate(v === 'all' ? '/flags/all' : '/flags')} hasDivider>
          <Tab value="open" label="Open" />
          <Tab value="all" label="All, incl. resolved" />
        </TabList>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <LoadingState />
        ) : data.questions.length === 0 ? (
          <EmptyState title={view === 'all' ? 'No flags yet' : 'No open flags'} description={view === 'all' ? undefined : 'Nice.'} />
        ) : (
          <>
            {data.questions.map((q) => (
              <FlagCard key={q.questionId} q={q} onResolved={onResolved} />
            ))}
            <Text type="supporting">{data.questions.length} flagged {data.questions.length === 1 ? 'question' : 'questions'}.</Text>
          </>
        )}
      </VStack>
    </Page>
  );
}
