// Small colored tag naming a question's type ("Explain", "Write EPL", ...).
import { Token } from '@astryxdesign/core/Token';
import { useTypeLabel } from '../hooks/useOral';

type Color = 'blue' | 'purple' | 'teal' | 'orange' | 'green' | 'gray';

const COLORS: Record<string, Color> = {
  explain: 'blue',
  compare: 'purple',
  walkthrough: 'teal',
  topic: 'orange',
  query: 'green',
};

export function TypeTag({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const label = useTypeLabel();
  return <Token label={label(type)} size={size} color={COLORS[type] ?? 'gray'} />;
}
