// How points, mastered, pensum-only questions, "hard for everyone" and flags work.
import type { ReactNode } from 'react';
import { Heading } from '@astryxdesign/core/Heading';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@/shared/ui/Page';

const POINTS: [string, string][] = [
  ['+10', 'for a correct answer the very first time you see a question.'],
  ['+5', 'the first time you get right a question you missed before.'],
  ['+1', 'for getting a question right again after that.'],
  ['0', 'for a wrong answer. No minus points.'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <VStack gap={2}>
      <Heading level={2}>{title}</Heading>
      {children}
    </VStack>
  );
}

export default function RulesPage() {
  return (
    <Page title="How points work" back={{ href: '/', label: 'Overview' }} width="narrow">
      <VStack gap={6}>
        <Section title="Points">
          <List hasDividers>
            {POINTS.map(([amount, text]) => (
              <ListItem key={amount} startContent={<Token label={amount} size="sm" color={amount === '0' ? 'gray' : 'green'} />} label={text} />
            ))}
          </List>
          <Text color="secondary">
            Missing on purpose never pays: it turns a +10 into a +5. The flame is your streak of correct answers in a row, just for bragging rights.
          </Text>
        </Section>
        <Section title="Mastered">
          <Text color="secondary">
            A question counts as mastered while your latest answer to it is right. Get it wrong again and it moves back to your mistakes.
          </Text>
          <Text color="secondary">
            Mastered is always counted out of every question, pensum-only ones included, so 100% means the whole syllabus. Leaving pensum out is fine for quick practice, but you cannot reach 100% without it.
          </Text>
        </Section>
        <Section title="Pensum-only questions">
          <Text color="secondary">
            Questions marked "Pensum only" come from the reading list and are not on the slides. Turn them off on the overview, or press Skip on a single one. Skipping gives no points and does not count as a mistake; the question comes back in your next round.
          </Text>
        </Section>
        <Section title="Hard for everyone">
          <Text color="secondary">
            Under Study mistakes, a second tab lists the questions most players miss on their first try. It appears once enough players have answered. Points work the same there, and answers given from that list do not change how hard a question counts as.
          </Text>
        </Section>
        <Section title="Flagging a question">
          <Text color="secondary">
            Think a question is wrong, ambiguous or badly worded? Press the small flag in its top-right corner, pick a reason and add a note if you like. You can do it at any time, before or after answering, and change or withdraw it later. Flags are private: other players never see them, and the admins see them without your name. When the question has been looked at, you get a short note on the overview.
          </Text>
        </Section>
      </VStack>
    </Page>
  );
}
