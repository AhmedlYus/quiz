// Form to flag a question as bad: pick a reason, add a note; edit or withdraw an existing flag.
import { useEffect, useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Spinner } from '@astryxdesign/core/Spinner';
import { useToast } from '@astryxdesign/core/Toast';
import { FLAG_NOTE_MAX, FLAG_REASONS, getFlag, sendFlag, withdrawFlag, type FlagReason } from '../api';

type Props = {
  questionId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Called after a flag was sent (true) or withdrawn (false). */
  onChanged: (isFlagged: boolean) => void;
};

export function FlagDialog({ questionId, isOpen, onOpenChange, onChanged }: Props) {
  const showToast = useToast();
  const [state, setState] = useState<'loading' | 'ready'>('loading');
  const [existing, setExisting] = useState(false);
  const [reason, setReason] = useState<FlagReason | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    setState('loading');
    setError(null);
    getFlag(questionId)
      .then((flag) => {
        if (!live) return;
        setExisting(Boolean(flag));
        setReason(flag?.reason ?? '');
        setNote(flag?.note ?? '');
        setState('ready');
      })
      .catch((e: Error) => {
        if (!live) return;
        setError(e.message);
        setState('ready');
      });
    return () => {
      live = false;
    };
  }, [isOpen, questionId]);

  async function run(action: () => Promise<unknown>, done: () => void) {
    setIsSending(true);
    setError(null);
    try {
      await action();
      done();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSending(false);
    }
  }

  const send = () => {
    if (!reason) return setError('Pick a reason.');
    void run(
      () => sendFlag(questionId, reason, note),
      () => {
        onChanged(true);
        showToast({ body: 'Thanks! Flag sent. Only the site admins can see it.' });
      },
    );
  };
  const withdraw = () =>
    void run(
      () => withdrawFlag(questionId),
      () => {
        onChanged(false);
        showToast({ body: 'Flag withdrawn.' });
      },
    );

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <DialogHeader title={existing ? 'You flagged this question' : 'Flag this question'} onOpenChange={onOpenChange} />
      <VStack gap={4} padding={4}>
        {state === 'loading' ? (
          <Spinner label="Loading your flag" />
        ) : (
          <>
            <RadioList label="Reason" value={reason} onChange={(v) => setReason(v as FlagReason)} isRequired>
              {(Object.keys(FLAG_REASONS) as FlagReason[]).map((r) => (
                <RadioListItem key={r} value={r} label={FLAG_REASONS[r]} />
              ))}
            </RadioList>
            <TextArea
              label="Notes"
              isOptional
              value={note}
              onChange={setNote}
              maxLength={FLAG_NOTE_MAX}
              rows={3}
              placeholder="What is wrong? Anything that helps us fix it."
            />
            {error && <Banner status="error" title={error} collapsible={false} />}
            <Text type="supporting">Flags are private: other players never see them, and the admins see them without your name.</Text>
            <HStack gap={2} wrap="wrap" justify="between">
              <HStack gap={2}>
                <Button label={existing ? 'Update flag' : 'Send flag'} variant="primary" isLoading={isSending} onClick={send} />
                <Button label="Cancel" variant="ghost" onClick={() => onOpenChange(false)} />
              </HStack>
              {existing && <Button label="Withdraw flag" variant="ghost" isDisabled={isSending} onClick={withdraw} />}
            </HStack>
          </>
        )}
      </VStack>
    </Dialog>
  );
}
