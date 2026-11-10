// Summary after a server-side test round (full, lecture or custom).
import { useEffect, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { plural, topicLabel, withTopic } from '@/shared/lib/format';
import { useSession } from '@/shared/session/SessionContext';
import { getMistakes } from '../api';
import type { Tally } from '../hooks/tally';
import { RoundSummary } from './RoundSummary';

export function TestRoundSummary({ topic, custom, tally }: { topic: string | null; custom: boolean; tally: Tally }) {
  const { me, refreshMe } = useSession();
  const [mistakesLeft, setMistakesLeft] = useState<number | null>(null);

  useEffect(() => {
    void refreshMe();
    if (topic != null && !custom) {
      void getMistakes(topic).then((q) => setMistakesLeft(q.length), () => setMistakesLeft(null));
    }
  }, [refreshMe, topic, custom]);

  const stats = me?.stats;
  const mistakes = mistakesLeft ?? stats?.mistakes ?? 0;
  const title = custom ? 'Custom round complete' : topic == null ? 'Round complete' : `${topicLabel(topic)} complete`;
  return (
    <RoundSummary
      title={title}
      number={`+${tally.points}`}
      caption="points this sitting"
      lines={[
        `${tally.correct} of ${tally.answered} right this sitting.`,
        tally.skipped ? `${plural(tally.skipped, 'pensum-only question')} skipped.` : null,
        stats && `Mastered ${stats.mastered} of ${stats.total} questions overall.`,
      ]}
      actions={
        <>
          {mistakes > 0 && <Button label={`Study mistakes (${mistakes})`} variant="primary" href={withTopic('/mistakes', custom ? null : topic)} />}
          {custom && <Button label="New custom round" href="/custom" />}
          {topic != null && !custom && <Button label="All lectures" href="/lectures" />}
          <Button label="Overview" variant={mistakes > 0 ? 'secondary' : 'primary'} href="/" />
        </>
      }
    />
  );
}
