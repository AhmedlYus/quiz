// Questions as rows: the question text, where it is from and, for "hard for everyone", how many
// players miss it and how the current player stands on it.
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Check, CircleHelp, X, type LucideIcon } from 'lucide-react';
import type { HardQuestion, HardStatus, QuizQuestion } from '../api';

const STATUS: Record<HardStatus, { icon: LucideIcon; label: string; color: 'error' | 'secondary' | 'success' }> = {
  mistake: { icon: X, label: 'To fix', color: 'error' },
  new: { icon: CircleHelp, label: 'New to you', color: 'secondary' },
  mastered: { icon: Check, label: 'You got it', color: 'success' },
};

const isHard = (q: QuizQuestion | HardQuestion): q is HardQuestion => 'missRate' in q;

export function QuestionList({ questions, showTopic, label }: { questions: (QuizQuestion | HardQuestion)[]; showTopic: boolean; label: string }) {
  return (
    <List hasDividers header={<Text type="supporting">{label}</Text>}>
      {questions.map((q) => {
        const meta = [showTopic ? q.topic : null, q.pensum ? 'Pensum only' : null].filter(Boolean).join(' · ');
        return (
          <ListItem
            key={q.id}
            label={<Text>{q.question}</Text>}
            description={meta ? <Text type="supporting">{meta}</Text> : undefined}
            endContent={
              isHard(q) ? (
                <VStack gap={1} hAlign="end">
                  <Text weight="semibold" hasTabularNumbers>
                    {Math.round(q.missRate * 100)}% miss it
                  </Text>
                  <HStack gap={1} align="center">
                    <Icon icon={STATUS[q.status].icon} size="xsm" color={STATUS[q.status].color} />
                    <Text type="supporting">{STATUS[q.status].label}</Text>
                  </HStack>
                </VStack>
              ) : undefined
            }
          />
        );
      })}
    </List>
  );
}
