// Question screen, two columns on wide screens and stacked on narrow ones.
// split: question and answer side by side at equal width (oral). The question column stays
//   pinned while the answer column grows.
// aside: the question with its options takes the wider column; the side column (hints, then the
//   explanation) is narrower and stays pinned (quiz).
import type { ReactNode } from 'react';
import { Grid } from '@astryxdesign/core/Grid';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import './question-layout.css';

type Props = { question: ReactNode; answer: ReactNode; variant?: 'split' | 'aside' };

export function QuestionLayout({ question, answer, variant = 'split' }: Props) {
  return (
    <Grid columns={1} gap={6} align="start" className={`question-layout question-layout-${variant}`}>
      <Card padding={6} className="question-layout-question">
        <VStack gap={4}>{question}</VStack>
      </Card>
      <VStack gap={4} className="question-layout-answer">
        {answer}
      </VStack>
    </Grid>
  );
}
