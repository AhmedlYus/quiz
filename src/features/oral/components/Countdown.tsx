// Shows the answer countdown: time left, a bar, a pause button and a gentle message near the end.
// It only nudges; nothing is cut off when it reaches zero.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Pause, Play, Timer } from 'lucide-react';
import { formatSeconds } from '@/shared/lib/format';
import type { Countdown as CountdownState } from '../hooks/useCountdown';

export function Countdown({ timer, isLocked = false }: { timer: CountdownState; isLocked?: boolean }) {
  const { left, seconds, isRunning, isOver, hasStarted } = timer;
  const isLow = !isOver && left <= Math.min(30, Math.ceil(seconds / 4));
  const variant = isOver ? 'error' : isLow ? 'warning' : 'accent';
  const status = isOver
    ? "Time's up. Nothing is cut off, so finish your thought."
    : isLow
      ? `${left} seconds left.`
      : hasStarted || isLocked
        ? ''
        : 'The timer starts when you start speaking or typing.';

  return (
    <VStack gap={2}>
      <HStack gap={3} justify="between" align="center">
        <HStack gap={2} align="center">
          <Icon icon={Timer} color="secondary" />
          <Text type="large" weight="semibold" hasTabularNumbers>
            {isOver ? "Time's up" : formatSeconds(left)}
          </Text>
          <Text type="supporting">of {formatSeconds(seconds)}</Text>
        </HStack>
        {!isOver && !isLocked && (
          <Button
            label={isRunning ? 'Pause timer' : hasStarted ? 'Resume timer' : 'Start timer'}
            variant="ghost"
            size="sm"
            icon={<Icon icon={isRunning ? Pause : Play} />}
            onClick={isRunning ? timer.pause : timer.start}
          />
        )}
      </HStack>
      <ProgressBar label="Time left" isLabelHidden value={left} max={Math.max(1, seconds)} variant={variant} />
      <Text type="supporting" aria-live="polite">
        {status}
      </Text>
    </VStack>
  );
}
