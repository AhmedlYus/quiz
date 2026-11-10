// Include or leave out pensum-only questions; saved on the player's account.
import { Switch } from '@astryxdesign/core/Switch';
import { useToast } from '@astryxdesign/core/Toast';
import { plural } from '@/shared/lib/format';
import { useSession } from '@/shared/session/SessionContext';
import { setIncludePensum } from '../api';

export function PensumSwitch({ count, onChanged }: { count: number; onChanged: () => void }) {
  const { me, refreshMe } = useSession();
  const showToast = useToast();
  if (!me) return null;
  return (
    <Switch
      label="Include pensum-only questions"
      description={`${plural(count, 'question')} from the reading list that are not on the slides`}
      value={me.user.includePensum}
      changeAction={async (on) => {
        try {
          await setIncludePensum(on);
          await refreshMe();
          onChanged();
        } catch (e) {
          showToast({ body: (e as Error).message, type: 'error' });
        }
      }}
    />
  );
}
