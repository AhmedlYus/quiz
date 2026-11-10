// One question from start to rating: prompt and hints on the left; answer box, timer, key points,
// model answer and rating on the right. Calls onRated when the rating is saved on the server.
import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { useToast } from '@astryxdesign/core/Toast';
import { Eye } from 'lucide-react';
import { QuestionLayout } from '@/shared/ui/QuestionLayout';
import { useApi } from '@/shared/lib/useApi';
import { isOutOfSync, rateAnswer, revealPath, type OralQuestion, type Rating, type RateMode, type Reveal } from '../api';
import { useSavedAnswer } from '../hooks/useSavedAnswer';
import type { GradedItem } from '../lib/gradingPrompt';
import { AnswerCard } from './AnswerCard';
import { QuestionPrompt } from './QuestionPrompt';
import { RevealPanel } from './RevealPanel';

type Props = {
  question: OralQuestion;
  /** 'round' moves the server round on; 'practice' (needs work) only records the rating. */
  mode: Exclude<RateMode, 'exam'>;
  scope?: string;
  onRated: (item: GradedItem) => void;
  /** The question was already answered elsewhere. */
  onResync?: () => void;
  hasTimer?: boolean;
};

export function OralQuestionScreen({ question: q, mode, scope, onRated, onResync, hasTimer = true }: Props) {
  const showToast = useToast();
  const { text, setText, save } = useSavedAnswer(q.id);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wantsReveal, setWantsReveal] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [busy, setBusy] = useState<Rating | null>(null);
  const { data: reveal, error, isLoading, reload } = useApi<Reveal>(wantsReveal ? revealPath(q.id) : null);
  const isQuery = q.type === 'query';

  async function rate(rating: Rating) {
    if (!reveal) return;
    setBusy(rating);
    try {
      await rateAnswer({ questionId: q.id, rating, covered: checked.length, hintsUsed, mode, scope });
      onRated({ q, reveal, answer: text, hintsUsed, rating });
    } catch (e) {
      setBusy(null);
      if (isOutOfSync(e) && onResync) {
        showToast({ body: 'That question was already answered elsewhere. Moving on.' });
        onResync();
      } else {
        showToast({ body: (e as Error).message, type: 'error' });
      }
    }
  }

  return (
    <QuestionLayout
      question={<QuestionPrompt question={q} hintsUsed={hintsUsed} onHint={setHintsUsed} isHintLocked={Boolean(reveal)} />}
      answer={
        <>
          <AnswerCard question={q} value={text} onChange={setText} onSettled={save} isLocked={Boolean(reveal)} hasTimer={hasTimer}>
            {!reveal && (
              <Button
                label={isQuery ? 'Show the model query' : 'Show key points'}
                variant="primary"
                icon={<Icon icon={Eye} />}
                isLoading={isLoading}
                onClick={() => (error ? reload() : setWantsReveal(true))}
              />
            )}
            {error && (
              <Banner status="error" title="Could not load the answer" description={error.message} collapsible={false} />
            )}
          </AnswerCard>
          {reveal && (
            <RevealPanel
              question={q}
              reveal={reveal}
              answer={text}
              checked={checked}
              onCheckedChange={setChecked}
              busy={busy}
              onRate={(r) => void rate(r)}
              hasFocusOnMount
            />
          )}
        </>
      }
    />
  );
}
