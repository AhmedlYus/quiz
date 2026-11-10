// The answer options as large rows. Before answering each row is a button; afterwards the right
// answer and the player's pick are marked with an icon and a word as well as a colour.
import type { ReactNode } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { Icon } from '@astryxdesign/core/Icon';
import { Check, X } from 'lucide-react';
import type { QuizOption } from '../api';
import { LETTERS } from '../hooks/useOptionShortcuts';

type Props = {
  options: QuizOption[];
  isSending: boolean;
  picked: number | null;
  /** Position of the right option once answered, otherwise -1. */
  correctPosition: number;
  onChoose: (position: number) => void;
};

function OptionContent({ letter, text, note }: { letter: string; text: string; note?: ReactNode }) {
  return (
    <HStack gap={3} align="center">
      <Token label={letter} size="sm" color="gray" />
      <StackItem size="fill">
        <VStack gap={1}>
          <Text>{text}</Text>
          {note}
        </VStack>
      </StackItem>
    </HStack>
  );
}

export function OptionList({ options, isSending, picked, correctPosition, onChoose }: Props) {
  const answered = correctPosition >= 0;
  return (
    <VStack gap={2}>
      {options.map((option, position) => {
        const letter = LETTERS[position] ?? String(position + 1);
        if (!answered) {
          return (
            <ClickableCard
              key={option.i}
              label={`${letter}. ${option.text}`}
              padding={4}
              variant={isSending && picked === position ? 'blue' : 'default'}
              isDisabled={isSending}
              onClick={() => onChoose(position)}
            >
              <OptionContent letter={letter} text={option.text} />
            </ClickableCard>
          );
        }
        const isRight = position === correctPosition;
        const isWrongPick = position === picked && !isRight;
        const verdict = isRight ? (position === picked ? 'Your answer · correct' : 'Correct answer') : isWrongPick ? 'Your answer' : null;
        return (
          <Card key={option.i} padding={4} variant={isRight ? 'green' : isWrongPick ? 'red' : 'default'}>
            <OptionContent
              letter={letter}
              text={option.text}
              note={
                verdict && (
                  <HStack gap={1} align="center">
                    <Icon icon={isRight ? Check : X} size="sm" color={isRight ? 'success' : 'error'} />
                    <Text type="supporting" weight="semibold">
                      {verdict}
                    </Text>
                  </HStack>
                )
              }
            />
          </Card>
        );
      })}
    </VStack>
  );
}
