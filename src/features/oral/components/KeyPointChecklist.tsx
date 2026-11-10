// "Which key points did you cover?": the key points as a checklist. Points the transcript seems to
// mention are marked, but ticking is the player's own call.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { ListChecks } from 'lucide-react';
import { suggestedPoints, suggestionFor } from '../lib/seemsMentioned';

const SUGGESTIONS = { solid: 'that sounds solid', partial: 'that sounds partial', miss: 'that sounds like a miss' } as const;

export function KeyPointChecklist({
  points,
  answer,
  checked,
  onChange,
}: {
  points: string[];
  answer: string;
  /** Indices of the ticked key points. */
  checked: number[];
  onChange: (checked: number[]) => void;
}) {
  const seen = suggestedPoints(points, answer);
  const missingSeen = seen.filter((i) => !checked.includes(i));
  const verdict = suggestionFor(checked.length, points.length);

  return (
    <VStack gap={2}>
      <CheckboxList
        label="Which key points did you cover?"
        hasDividers
        density="compact"
        value={checked.map(String)}
        onChange={(values) => onChange(values.map(Number).sort((a, b) => a - b))}
      >
        {points.map((point, i) => (
          <CheckboxListItem
            key={i}
            value={String(i)}
            label={<Text>{point}</Text>}
            align="first-line"
            aria-label={point}
            description={seen.includes(i) ? 'Sounds like you said this' : undefined}
          />
        ))}
      </CheckboxList>
      <HStack gap={3} justify="between" align="center" wrap="wrap">
        <Text type="supporting" aria-live="polite">
          {checked.length} of {points.length} key points covered{verdict ? ` · ${SUGGESTIONS[verdict]}` : ''}.
        </Text>
        {missingSeen.length > 0 && (
          <Button
            label="Tick the ones that sound right"
            variant="ghost"
            size="sm"
            icon={<Icon icon={ListChecks} />}
            onClick={() => onChange([...new Set([...checked, ...seen])].sort((a, b) => a - b))}
          />
        )}
      </HStack>
    </VStack>
  );
}
