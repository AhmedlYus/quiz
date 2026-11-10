// The one primary action of an overview: start or resume that mode's full round.
import type { ReactNode } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Kbd } from '@astryxdesign/core/Kbd';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Play, StepForward, type LucideIcon } from 'lucide-react';
import type { RunSummary } from '@/shared/api/types';

type Props = {
  run: RunSummary | null;
  href: string;
  /** Shown when no round is in progress, e.g. "All 40 questions, shuffled". */
  description: ReactNode;
  icon?: LucideIcon;
  isDisabled?: boolean;
  shortcut?: string;
};

export function StartPanel({ run, href, description, icon = Play, isDisabled = false, shortcut }: Props) {
  const resuming = run != null && !run.finished;
  return (
    <Card padding={6}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>{resuming ? 'Pick up your round' : run ? 'Start a new round' : 'Start a round'}</Heading>
          <Text color="secondary">{resuming ? `${run.position} of ${run.total} answered. Carry on where you stopped.` : description}</Text>
        </VStack>
        {resuming && <ProgressBar label="Round progress" isLabelHidden value={run.position} max={Math.max(1, run.total)} variant="accent" />}
        <HStack gap={3} align="center">
          <Button
            label={resuming ? 'Resume round' : run ? 'New round' : 'Start round'}
            variant="primary"
            size="lg"
            href={href}
            isDisabled={isDisabled}
            icon={<Icon icon={resuming ? StepForward : icon} />}
          />
          {shortcut && <Kbd keys={shortcut} />}
        </HStack>
      </VStack>
    </Card>
  );
}
