// Top five players with a link to the full leaderboard.
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Crown } from 'lucide-react';
import { pct } from '@/shared/lib/format';
import { useApi } from '@/shared/lib/useApi';

type Player = { rank: number; nickname: string; points: number; mastered: number; bestStreak: number; me: boolean };
type Board = { total: number; players: Player[]; me: Player | null };

export function LeaderboardPreview() {
  const { data, error } = useApi<Board>('leaderboard?limit=5');
  if (error || !data) return null;
  const rows = data.me ? [...data.players, data.me] : data.players;
  return (
    <VStack gap={2}>
      <List header={<Heading level={2}>Leaderboard · top 5</Heading>} hasDividers>
        {rows.length === 0 ? (
          <ListItem label="No players yet." />
        ) : (
          rows.map((p) => (
            <ListItem
              key={p.rank}
              startContent={p.rank === 1 ? <Icon icon={Crown} color="warning" label="Rank 1" /> : <Text hasTabularNumbers color="secondary">{p.rank}</Text>}
              label={
                <Text weight={p.me ? 'semibold' : 'normal'}>
                  {p.nickname} {p.me && <Token label="you" size="sm" color="blue" />}
                </Text>
              }
              description={`${pct(p.mastered, data.total)}% mastered · best streak ${p.bestStreak}`}
              endContent={<Text weight="semibold" hasTabularNumbers>{p.points} pts</Text>}
            />
          ))
        )}
      </List>
      <HStack>
        <Button label="Full leaderboard" variant="ghost" size="sm" href="/leaderboard" endContent={<Icon icon="chevronRight" />} />
      </HStack>
    </VStack>
  );
}
