// End-of-round card: one big number, a caption, a few lines and the next steps.
import type { ReactNode } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@/shared/ui/Page';

type Props = {
  title: string;
  number: string;
  caption: string;
  lines: (string | null | false | undefined)[];
  /** Buttons; put the main one first. */
  actions: ReactNode;
};

export function RoundSummary({ title, number, caption, lines, actions }: Props) {
  return (
    <Page title={title} width="narrow">
      <Card padding={8}>
        <VStack gap={5} hAlign="center">
          <VStack gap={1} hAlign="center">
            <Text type="display-1" hasTabularNumbers>
              {number}
            </Text>
            <Text type="supporting">{caption}</Text>
          </VStack>
          <VStack gap={1} hAlign="center">
            {lines.filter((line): line is string => Boolean(line)).map((line) => (
              <Text key={line} color="secondary">
                {line}
              </Text>
            ))}
          </VStack>
          <HStack gap={2} justify="center" wrap="wrap">
            {actions}
          </HStack>
        </VStack>
      </Card>
    </Page>
  );
}
