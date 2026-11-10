// "Show a hint" button revealing hints one at a time. Used by quiz and oral questions.
// The parent keeps the count (it is sent to the server with the answer); reset it per question
// by giving this component a key.
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { VStack } from '@astryxdesign/core/VStack';
import { Lightbulb } from 'lucide-react';

export function HintPanel({
  hints,
  used,
  onUse,
  isLocked = false,
}: {
  hints: string[];
  used: number;
  onUse: (used: number) => void;
  /** After answering, hints stay visible but no more can be taken. */
  isLocked?: boolean;
}) {
  if (!hints.length) return null;
  const left = hints.length - used;
  return (
    <VStack gap={2} hAlign="start">
      {used > 0 && (
        <List listStyle="decimal" aria-live="polite">
          {hints.slice(0, used).map((hint, i) => (
            <ListItem key={i} label={hint} />
          ))}
        </List>
      )}
      {left > 0 && !isLocked && (
        <Button
          label={used ? `Another hint (${left} left)` : `Show a hint (${hints.length})`}
          variant="ghost"
          size="sm"
          icon={<Icon icon={Lightbulb} />}
          onClick={() => onUse(used + 1)}
        />
      )}
    </VStack>
  );
}
