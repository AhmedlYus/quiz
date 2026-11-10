// A rating shown as a colored tag: Solid (green), Partly (yellow), Missed it (red).
import { Token } from '@astryxdesign/core/Token';
import type { Rating } from '../api';
import { RATING_LABELS } from '../lib/labels';

const COLORS = { solid: 'green', partial: 'yellow', missed: 'red' } as const;

export function RatingToken({ rating, size = 'sm' }: { rating: Rating; size?: 'sm' | 'md' }) {
  return <Token label={RATING_LABELS[rating]} size={size} color={COLORS[rating]} />;
}
