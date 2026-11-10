// A question the player has mastered, with the right answer, explanation and all options.
import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Check } from 'lucide-react';
import { SourceLine } from '@/shared/ui/SourceLine';
import type { CorrectQuestion } from '../api';
import { LETTERS } from '../hooks/useOptionShortcuts';
import { FlagButton } from './FlagButton';
import { PensumTag } from './PensumTag';
import { QueryCode } from '@/shared/editor';

export function CorrectQuestionCard({ q }: { q: CorrectQuestion }) {
  return (
    <Card padding={5}>
      <VStack gap={3}>
        <HStack gap={2} justify="between" align="center">
          <HStack gap={2} wrap="wrap" align="center">
            {q.topic && <Token label={q.topic} size="sm" color="blue" />}
            {q.pensum && <PensumTag />}
          </HStack>
          <FlagButton questionId={q.id} />
        </HStack>
        <Heading level={3}>{q.question}</Heading>
        {q.code && <QueryCode code={q.code} />}
        <HStack gap={2} align="start">
          <Icon icon={Check} color="success" label="Right answer" />
          <StackItem size="fill">
            <Text weight="semibold">{q.options[q.answer]}</Text>
          </StackItem>
        </HStack>
        {q.explanation && <Text color="secondary">{q.explanation}</Text>}
        {q.source && <SourceLine source={q.source} topic={q.topic} />}
        <Collapsible trigger={<Text type="supporting">All options</Text>}>
          <List>
            {q.options.map((o, i) => (
              <ListItem
                key={i}
                startContent={<Token label={LETTERS[i] ?? String(i + 1)} size="sm" color={i === q.answer ? 'green' : 'gray'} />}
                label={<Text weight={i === q.answer ? 'semibold' : 'normal'}>{o}</Text>}
                endContent={i === q.answer ? <Icon icon={Check} size="sm" color="success" label="Right answer" /> : undefined}
              />
            ))}
          </List>
        </Collapsible>
      </VStack>
    </Card>
  );
}
