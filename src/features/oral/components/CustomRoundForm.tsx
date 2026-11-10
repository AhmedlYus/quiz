// Custom round picker: lectures, question types, length, and whether to skip solid answers.
import { useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { Switch } from '@astryxdesign/core/Switch';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Play } from 'lucide-react';
import { navigate } from '@/app/router';
import { plural } from '@/shared/lib/format';
import { startCustomRun, type Overview } from '../api';
import { useTypeLabel } from '../hooks/useOral';

const COUNTS = ['5', '10', '20', '40', 'all'] as const;

export function CustomRoundForm({ overview }: { overview: Overview }) {
  const label = useTypeLabel();
  const lectures = overview.topics.filter((t) => t.playable);
  const typeCounts: Record<string, number> = {};
  for (const t of lectures) for (const [k, n] of Object.entries(t.types)) typeCounts[k] = (typeCounts[k] ?? 0) + n;

  const [topics, setTopics] = useState(() => lectures.map((t) => t.topic));
  const [types, setTypes] = useState(() => Object.keys(typeCounts));
  const [count, setCount] = useState<(typeof COUNTS)[number]>('10');
  const [notSolid, setNotSolid] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStarting, setStarting] = useState(false);

  async function start() {
    setError(null);
    setStarting(true);
    try {
      await startCustomRun({ topics, types, count: count === 'all' ? null : Number(count), notSolid });
      navigate('/oral/custom/play');
    } catch (e) {
      setError(e as Error);
      setStarting(false);
    }
  }

  return (
    <Grid columns={{ minWidth: 420, max: 2 }} gap={4} align="start">
      <Card padding={5}>
        <CheckboxList label="Lectures" description="Questions are drawn from the lectures you tick." hasDividers value={topics} onChange={setTopics}>
          {lectures.map((t) => (
            <CheckboxListItem
              key={t.topic}
              value={t.topic}
              label={t.topic}
              description={`${plural(t.playable, 'question')} · ${t.solid} solid`}
            />
          ))}
        </CheckboxList>
      </Card>
      <VStack gap={4}>
        <Card padding={5}>
          <VStack gap={5}>
            <CheckboxList label="Question types" hasDividers density="compact" value={types} onChange={setTypes}>
              {Object.entries(typeCounts).map(([type, n]) => (
                <CheckboxListItem key={type} value={type} label={`${label(type)} (${n})`} />
              ))}
            </CheckboxList>
            <VStack gap={2} hAlign="start">
              <Text type="label" weight="semibold">
                Number of questions
              </Text>
              <SegmentedControl label="Number of questions" value={count} onChange={(v) => setCount(v as typeof count)}>
                {COUNTS.map((c) => (
                  <SegmentedControlItem key={c} value={c} label={c === 'all' ? 'All' : c} />
                ))}
              </SegmentedControl>
            </VStack>
            <Switch
              label="Leave out solid answers"
              description="Only questions you have not rated solid yet"
              value={notSolid}
              onChange={setNotSolid}
            />
            {error && <Banner status="error" title="Could not start the round" description={error.message} collapsible={false} />}
            <Button
              label="Start custom round"
              variant="primary"
              size="lg"
              icon={<Icon icon={Play} />}
              isLoading={isStarting}
              isDisabled={!topics.length || !types.length}
              onClick={() => void start()}
            />
          </VStack>
        </Card>
      </VStack>
    </Grid>
  );
}
