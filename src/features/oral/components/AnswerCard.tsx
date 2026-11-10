// The answer side of a question: the answer box, the optional countdown (started by the first
// words or keystrokes) and room for the actions below it.
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import type { OralQuestion } from '../api';
import { useCountdown } from '../hooks/useCountdown';
import { useOral } from '../hooks/useOral';
import { useTimerPreference } from '../hooks/useTimerPreference';
import { AnswerArea } from './AnswerArea';
import { Countdown } from './Countdown';

type Props = {
  question: OralQuestion;
  value: string;
  onChange: (text: string) => void;
  onSettled: (text: string) => void;
  /** Locked after the answer is revealed: no more typing or recording, the timer stops. */
  isLocked?: boolean;
  label?: string;
  rows?: number;
  children?: ReactNode;
  /** Off for query practice: writing a query is not timed. */
  hasTimer?: boolean;
};

export function AnswerCard({ question, children, isLocked = false, hasTimer = true, ...answer }: Props) {
  const oral = useOral();
  const [preference] = useTimerPreference();
  const timerOn = hasTimer && preference;
  const timer = useCountdown(question.seconds ?? oral.timerSeconds, timerOn);
  const { pause } = timer;

  useEffect(() => {
    if (isLocked) pause();
  }, [isLocked, pause]);

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <AnswerArea question={question} isLocked={isLocked} onStart={timer.startOnce} {...answer} />
        {timerOn && <Countdown timer={timer} isLocked={isLocked} />}
        {children}
      </VStack>
    </Card>
  );
}
