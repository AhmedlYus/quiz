// Choices for a custom round: how many questions, which lectures, and whether to skip mastered ones.
import { Button } from '@astryxdesign/core/Button';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { StackItem } from '@astryxdesign/core/Stack';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { pct, plural } from '@/shared/lib/format';
import type { TopicRow } from '../api';
import { CUSTOM_COUNTS, useCustomChoices } from '../hooks/useCustomChoices';

type Choices = ReturnType<typeof useCustomChoices>;

export function CustomRoundForm({ topics, choices }: { topics: TopicRow[]; choices: Choices }) {
  const { count, setCount, selected, setSelected, unmastered, setUnmastered, known } = choices;
  const chosen = topics.filter((t) => selected.includes(t.topic));
  const mastered = chosen.reduce((s, t) => s + (t.playable - t.unmastered), 0);

  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Heading level={2}>How many questions?</Heading>
        <SegmentedControl
          label="How many questions"
          value={String(count)}
          onChange={(v) => setCount(v === 'null' ? null : Number(v))}
          layout="fill"
        >
          {CUSTOM_COUNTS.map((n) => (
            <SegmentedControlItem key={String(n)} value={String(n)} label={n == null ? 'All' : String(n)} />
          ))}
        </SegmentedControl>
      </VStack>

      <VStack gap={2}>
        <HStack gap={2} align="center" justify="between">
          <StackItem size="fill">
            <Heading level={2}>Lectures</Heading>
          </StackItem>
          <Button label="Select all" variant="ghost" size="sm" onClick={() => setSelected([...known])} />
          <Button label="None" variant="ghost" size="sm" onClick={() => setSelected([])} />
        </HStack>
        <CheckboxList label="Lectures" isLabelHidden value={selected} onChange={setSelected} hasDividers>
          {topics.map((t) => {
            const empty = !t.total;
            const sub = empty ? 'Coming soon' : t.ready ? plural(t.playable, 'question') : `${plural(t.playable, 'sample question')} · more coming`;
            return (
              <CheckboxListItem
                key={t.topic}
                value={t.topic}
                label={t.topic || 'Other'}
                description={sub}
                isDisabled={empty}
                endContent={empty ? undefined : <Text type="supporting" hasTabularNumbers>{pct(t.mastered, t.total)}% mastered</Text>}
              />
            );
          })}
        </CheckboxList>
      </VStack>

      <Switch
        label="Only questions I haven't mastered"
        description={mastered ? `Skips the ${plural(mastered, 'question')} you already got right in these lectures` : 'Skips questions you already got right'}
        value={unmastered}
        onChange={setUnmastered}
      />
    </VStack>
  );
}
