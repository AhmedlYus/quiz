// Page frame for every exam phase: the title and a stepper showing where you are.
import type { ReactNode } from 'react';
import { Stepper, Step } from '@astryxdesign/core/Stepper';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@/shared/ui/Page';

export const EXAM_STEPS = ['Intro', 'Answer', 'Review', 'Done'] as const;

export function ExamStepper({ step }: { step: number }) {
  return (
    <Stepper activeStep={step} label="Exam progress" density="compact">
      {EXAM_STEPS.map((label, i) => (
        <Step key={label} step={i} label={label} />
      ))}
    </Stepper>
  );
}

export function ExamFrame({
  step,
  description,
  actions,
  back = { href: '/oral', label: 'Oral' },
  width = 'full',
  children,
}: {
  step: number;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label?: string };
  width?: 'narrow' | 'medium' | 'wide' | 'full';
  children: ReactNode;
}) {
  return (
    <Page title="Exam simulation" description={description} back={back} actions={actions} width={width}>
      <VStack gap={5}>
        <ExamStepper step={step} />
        {children}
      </VStack>
    </Page>
  );
}
