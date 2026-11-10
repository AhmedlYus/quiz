// Start of the exam: what will happen, the optional timer, and the button that draws the questions.
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { GraduationCap } from 'lucide-react';
import { plural } from '@/shared/lib/format';
import { TimerSwitch } from '@/features/oral/components/TimerSwitch';
import { useOral } from '@/features/oral/hooks/useOral';

export function ExamIntro({
  hasLast,
  isStarting,
  error,
  onStart,
}: {
  hasLast: boolean;
  isStarting: boolean;
  error: Error | null;
  onStart: () => void;
}) {
  const oral = useOral();
  const { questions, note } = oral.exam;
  return (
    <Card padding={6}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Heading level={2}>Mock oral exam</Heading>
          {note && <Text color="secondary">{note}</Text>}
        </VStack>
        <List listStyle="decimal">
          <ListItem
            label={`${plural(questions, 'question')} from different lectures`}
            description="Drawn at random, preferring ones you have not nailed yet."
          />
          <ListItem
            label="Answer each one in turn"
            description="Speak or type. Hints are there if you get stuck, and you can go back to an earlier question."
          />
          <ListItem
            label="Check yourself"
            description="See the key points and model answer, tick what you covered and rate each answer."
          />
          <ListItem
            label="Copy the exam into ChatGPT"
            description="For an examiner-style review with follow-up questions."
          />
        </List>
        {oral.query && (
          <Text type="supporting">
            {oral.query.language}-writing questions are left out, since you talk rather than type at the exam.
          </Text>
        )}
        <TimerSwitch size="md" label="Time each answer" description="A countdown nudges you; nothing is cut off." />
        {hasLast && <Text type="supporting">Starting a new exam replaces the last one.</Text>}
        {error && <Banner status="error" title="Could not draw the questions" description={error.message} collapsible={false} />}
        <Button
          label="Draw my exam questions"
          variant="primary"
          size="lg"
          icon={<Icon icon={GraduationCap} />}
          isLoading={isStarting}
          onClick={onStart}
        />
      </VStack>
    </Card>
  );
}
