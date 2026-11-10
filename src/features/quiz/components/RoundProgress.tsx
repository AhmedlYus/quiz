// Progress through a round: a bar plus the player's current streak.
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Flame } from 'lucide-react';

export function RoundProgress({ position, total, streak }: { position: number; total: number; streak: number }) {
  return (
    <HStack gap={4} align="center">
      <StackItem size="fill">
        <ProgressBar label={`Question ${position + 1} of ${total}`} isLabelHidden value={position} max={Math.max(1, total)} variant="accent" />
      </StackItem>
      <HStack gap={1} align="center">
        <Icon icon={Flame} size="sm" color={streak ? 'warning' : 'secondary'} />
        <Text type="supporting" hasTabularNumbers>
          Streak {streak}
        </Text>
      </HStack>
    </HStack>
  );
}
