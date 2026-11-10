// Runs a mistakes or hard-for-everyone round over a fixed list, then shows how it went.
import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/VStack';
import { plural, topicLabel } from '@/shared/lib/format';
import { useSession } from '@/shared/session/SessionContext';
import { Page } from '@/shared/ui/Page';
import type { QuizQuestion } from '../api';
import { useQueueRound } from '../hooks/useQueueRound';
import { QuestionCard } from './QuestionCard';
import { RoundProgress } from './RoundProgress';
import { RoundSummary } from './RoundSummary';

type Props = {
  mode: 'mistakes' | 'hard';
  questions: QuizQuestion[];
  topic: string | null;
  /** Leave the round and show the list again (reloaded). */
  onExit: () => void;
};

export function QueueRound({ mode, questions, topic, onExit }: Props) {
  const { me } = useSession();
  const { index, total, question, finished, tally, onOutcome } = useQueueRound(questions);
  const isHard = mode === 'hard';
  const name = isHard ? 'Hard question' : topic == null ? 'Mistake' : `${topicLabel(topic)} mistake`;

  if (finished) {
    const stillWrong = tally.answered - tally.correct;
    const skipped = tally.skipped ? `${plural(tally.skipped, 'pensum-only question')} skipped.` : null;
    return (
      <RoundSummary
        title={isHard ? 'Hard round done' : 'Mistakes round done'}
        number={`${tally.correct}/${tally.answered}`}
        caption={isHard ? 'right' : 'fixed'}
        lines={
          isHard
            ? [`+${tally.points} points.`, skipped, tally.correct === tally.answered && tally.answered > 0 && 'Not so hard after all.']
            : [`+${tally.points} points.`, skipped, stillWrong ? `${plural(stillWrong, 'question')} still to fix.` : 'All fixed. Nice.']
        }
        actions={
          <>
            <Button label={!isHard && stillWrong ? 'Go again' : 'Back to the list'} variant="primary" onClick={onExit} />
            {topic != null && <Button label="All lectures" href="/lectures" />}
            <Button label="Overview" href="/" />
          </>
        }
      />
    );
  }
  if (!question) return null;

  return (
    <Page
      title={isHard ? 'Hard for everyone' : 'Fix your mistakes'}
      description={`${name} ${index + 1} of ${total}`}
      width="full"
      actions={<Button label="Back to the list" variant="ghost" size="sm" onClick={onExit} />}
    >
      <VStack gap={4}>
        <RoundProgress position={index} total={total} streak={tally.streak ?? me?.stats.streak ?? 0} />
        <QuestionCard key={question.id} question={question} mode={mode} scope="all" isLast={index + 1 >= total} onOutcome={onOutcome} />
      </VStack>
    </Page>
  );
}
