// End of a round, a needs-work run or the exam: how it went, the answers as rows, and what to do next.
import { useEffect, type ReactNode } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { List, ListItem } from '@astryxdesign/core/List';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Page } from '@/shared/ui/Page';
import { StatTiles } from '@/shared/ui/StatTiles';
import { withTopic } from '@/shared/lib/format';
import { useCourse } from '@/shared/session/SessionContext';
import { useOral } from '../hooks/useOral';
import { buildGradingPrompt, type GradedItem } from '../lib/gradingPrompt';
import { saveLastSitting } from '../lib/lastSitting';
import { CopyForGptButton } from './CopyForGptButton';
import { RatingToken } from './RatingToken';

type Props = {
  title: string;
  items: GradedItem[];
  /** Lecture of the sitting, so "Needs work" opens just that lecture. */
  topic?: string | null;
  isExam?: boolean;
  /** Offered besides "Oral home", e.g. "All lectures". */
  again?: Action;
  /** Shown above the results, e.g. the exam stepper. */
  header?: ReactNode;
  /** For rounds outside oral mode (query practice): replaces "Oral home" and the needs-work
   * link, and the sitting is not kept as the oral home's "Last sitting". */
  home?: Action;
};

type Action = { label: string; href?: string; onClick?: () => void };

export function SittingSummary({ title, items, topic, isExam = false, again, header, home }: Props) {
  const course = useCourse();
  const oral = useOral();
  const count = (r: string) => items.filter((i) => i.rating === r).length;
  const needsWork = home ? 0 : count('missed') + count('partial');

  useEffect(() => {
    if (!home) saveLastSitting(title, items);
  }, [home, title, items]);

  return (
    <Page title={title} description={items.length ? 'How this sitting went.' : undefined} width="medium">
      <VStack gap={5}>
        {header}
        {items.length === 0 ? (
          <EmptyState title="Nothing answered this sitting" description="Rate an answer to see it here." />
        ) : (
          <>
            <StatTiles
              label="Sitting results"
              stats={[
                { label: 'Solid', value: count('solid'), total: items.length, variant: 'success' },
                { label: 'Partly', value: count('partial') },
                { label: 'Missed', value: count('missed') },
              ]}
            />
            <List header={<Heading level={2}>Your answers</Heading>} hasDividers>
              {items.map((it, i) => (
                <ListItem
                  key={it.q.id}
                  label={<Text maxLines={2}>{it.q.prompt}</Text>}
                  description={`${i + 1} · ${it.q.topic}${it.hintsUsed ? ` · ${it.hintsUsed} hint${it.hintsUsed === 1 ? '' : 's'}` : ''}`}
                  endContent={it.rating ? <RatingToken rating={it.rating} /> : undefined}
                />
              ))}
            </List>
            <Text color="secondary">
              Copy {isExam ? 'the exam' : 'the sitting'} into ChatGPT for a second opinion and follow-up questions.
            </Text>
          </>
        )}
        <HStack gap={2} wrap="wrap">
          {items.length > 0 && (
            <CopyForGptButton
              variant="primary"
              label={isExam ? 'Copy exam for GPT' : 'Copy for GPT'}
              build={() => buildGradingPrompt(items, { course, oral, exam: isExam })}
            />
          )}
          {needsWork > 0 && !isExam && (
            <Button label={`Needs work (${needsWork})`} href={withTopic('/oral/needs-work', topic)} />
          )}
          {again && <Button label={again.label} href={again.href} onClick={again.onClick} />}
          <Button {...(home ?? { label: 'Oral home', href: '/oral' })} variant={items.length ? 'ghost' : 'primary'} />
        </HStack>
      </VStack>
    </Page>
  );
}
