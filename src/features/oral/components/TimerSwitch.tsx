// Switch for the optional answer countdown. The choice is remembered in this browser.
import { Switch } from '@astryxdesign/core/Switch';
import { useTimerPreference } from '../hooks/useTimerPreference';

export function TimerSwitch({
  label = 'Time my answers',
  description,
  size = 'sm',
}: {
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}) {
  const [enabled, setEnabled] = useTimerPreference();
  return <Switch label={label} description={description} size={size} value={enabled} onChange={setEnabled} />;
}
