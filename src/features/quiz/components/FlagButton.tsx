// Small flag button for a question: opens the flag dialog and shows whether the player flagged it.
import { useState } from 'react';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Flag } from 'lucide-react';
import { useSession } from '@/shared/session/SessionContext';
import { FlagDialog } from './FlagDialog';

export function FlagButton({ questionId }: { questionId: string }) {
  const { me, setMe } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const isFlagged = Boolean(me?.flagged.includes(questionId));

  function onChanged(flagged: boolean) {
    if (!me) return;
    setMe({ ...me, flagged: [...me.flagged.filter((id) => id !== questionId), ...(flagged ? [questionId] : [])] });
  }

  const label = isFlagged ? 'You flagged this question. Edit flag' : 'Flag as a bad question';
  return (
    <>
      <IconButton
        label={label}
        tooltip={label}
        variant="ghost"
        size="sm"
        icon={<Icon icon={Flag} color={isFlagged ? 'warning' : 'secondary'} />}
        onClick={() => setIsOpen(true)}
      />
      <FlagDialog questionId={questionId} isOpen={isOpen} onOpenChange={setIsOpen} onChanged={onChanged} />
    </>
  );
}
