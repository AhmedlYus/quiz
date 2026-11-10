// Everyone's points, mastered share and streaks, ranked by points then questions mastered.
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/HStack';
import { Table, pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Crown } from 'lucide-react';
import { pct, plural } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';
import { Page } from '@/shared/ui/Page';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { LEADERBOARD_PATH, type Leaderboard, type LeaderboardPlayer } from './api';

export default function LeaderboardPage() {
  const { data, error, reload } = useApi<Leaderboard>(LEADERBOARD_PATH);
  const rows: LeaderboardPlayer[] = data ? (data.me ? [...data.players, data.me] : data.players) : [];
  const total = data?.total ?? 0;

  return (
    <Page
      title="Leaderboard"
      description={data ? `${plural(data.players.length, 'player')} · ${plural(total, 'question')}` : undefined}
      back={{ href: '/', label: 'Overview' }}
      width="medium"
    >
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState title="No players yet" description="Answer a question to get on the board." />
      ) : (
        <VStack gap={3}>
          <Table
            data={rows}
            idKey="rank"
            hasHover
            columns={[
              {
                key: 'rank',
                header: '#',
                width: pixel(56),
                renderCell: (p) => (p.rank === 1 ? <Icon icon={Crown} color="warning" label="Rank 1" /> : <Text hasTabularNumbers>{p.rank}</Text>),
              },
              {
                key: 'nickname',
                header: 'Player',
                width: proportional(2, { minWidth: 140 }),
                renderCell: (p) => (
                  <HStack gap={2} align="center">
                    <Text weight={p.me ? 'semibold' : 'normal'}>{p.nickname}</Text>
                    {p.me && <Token label="you" size="sm" color="blue" />}
                  </HStack>
                ),
              },
              { key: 'points', header: 'Points', align: 'end', width: proportional(1, { minWidth: 72 }), renderCell: (p) => <Text weight="semibold" hasTabularNumbers>{p.points}</Text> },
              { key: 'mastered', header: 'Mastered', align: 'end', width: proportional(1, { minWidth: 88 }), renderCell: (p) => <Text hasTabularNumbers>{pct(p.mastered, total)}%</Text> },
              { key: 'answered', header: 'Answered', align: 'end', width: proportional(1, { minWidth: 88 }), renderCell: (p) => <Text hasTabularNumbers>{p.answered}</Text> },
              { key: 'bestStreak', header: 'Best streak', align: 'end', width: proportional(1, { minWidth: 96 }), renderCell: (p) => <Text hasTabularNumbers>{p.bestStreak}</Text> },
            ]}
          />
          <Text type="supporting">Ranked by points, then by questions mastered.</Text>
        </VStack>
      )}
    </Page>
  );
}
