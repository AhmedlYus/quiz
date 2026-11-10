// One line telling which keys work on a question screen.
import { Text } from '@astryxdesign/core/Text';
import { LETTERS } from '../hooks/useOptionShortcuts';

export function KeyHint({ count, canSkip }: { count: number; canSkip: boolean }) {
  return (
    <Text type="supporting">
      Keys: 1–{count} or {LETTERS[0]}–{LETTERS[count - 1]} to answer{canSkip ? ', S to skip' : ''}, Enter for next.
    </Text>
  );
}
