// Page actions during a round: the timer switch, this sitting's GPT prompt, restart / new custom round.
import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Icon } from '@astryxdesign/core/Icon';
import { useToast } from '@astryxdesign/core/Toast';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useCourse } from '@/shared/session/SessionContext';
import { useOral } from '../hooks/useOral';
import { buildGradingPrompt, type GradedItem } from '../lib/gradingPrompt';
import { CopyForGptButton } from './CopyForGptButton';
import { TimerSwitch } from './TimerSwitch';

export function RoundActions({
  sitting,
  isCustom,
  hasTimer = true,
  onRestart,
}: {
  sitting: GradedItem[];
  isCustom: boolean;
  hasTimer?: boolean;
  onRestart: () => Promise<void>;
}) {
  const course = useCourse();
  const oral = useOral();
  const showToast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const restart = async () => {
    setRestarting(true);
    try {
      await onRestart();
      setConfirming(false);
    } catch (e) {
      showToast({ body: (e as Error).message, type: 'error' });
    } finally {
      setRestarting(false);
    }
  };

  return (
    <>
      {hasTimer && <TimerSwitch />}
      {sitting.length > 0 && (
        <CopyForGptButton
          size="sm"
          label={`Copy this sitting for GPT (${sitting.length})`}
          build={() => buildGradingPrompt(sitting, { course, oral })}
        />
      )}
      {isCustom ? (
        <Button label="New custom round" variant="ghost" size="sm" href="/oral/custom" icon={<Icon icon={SlidersHorizontal} />} />
      ) : (
        <Button label="Restart round" variant="ghost" size="sm" icon={<Icon icon={RotateCcw} />} onClick={() => setConfirming(true)} />
      )}
      <AlertDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title="Restart this round?"
        description="It starts again from question 1. Your ratings are kept."
        actionLabel="Restart"
        actionVariant="primary"
        isActionLoading={restarting}
        onAction={restart}
      />
    </>
  );
}
