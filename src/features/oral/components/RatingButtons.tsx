// Rate your own answer: Missed it / Partly / Solid. The chosen rating shows as selected.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Check, CircleDashed, X, type LucideIcon } from 'lucide-react';
import type { Rating } from '../api';
import { RATINGS, RATING_LABELS } from '../lib/labels';

const ICONS: Record<Rating, { icon: LucideIcon; color: 'error' | 'warning' | 'success' }> = {
  missed: { icon: X, color: 'error' },
  partial: { icon: CircleDashed, color: 'warning' },
  solid: { icon: Check, color: 'success' },
};

export function RatingButtons({
  label,
  selected,
  busy = null,
  isDisabled = false,
  onRate,
}: {
  label: string;
  selected?: Rating | null;
  /** The rating being saved right now (shows a spinner on that button). */
  busy?: Rating | null;
  isDisabled?: boolean;
  onRate: (rating: Rating) => void;
}) {
  return (
    <VStack gap={2} role="group" aria-label={label}>
      <Text type="label" weight="semibold">
        {label}
      </Text>
      <HStack gap={2} wrap="wrap">
        {RATINGS.map((rating) => {
          const { icon, color } = ICONS[rating];
          const isSelected = selected === rating;
          return (
            <Button
              key={rating}
              label={RATING_LABELS[rating]}
              variant={isSelected ? 'primary' : 'secondary'}
              icon={<Icon icon={icon} color={isSelected ? 'inherit' : color} />}
              isLoading={busy === rating}
              isDisabled={isDisabled || (busy !== null && busy !== rating)}
              aria-pressed={selected === undefined ? undefined : isSelected}
              onClick={() => onRate(rating)}
            />
          );
        })}
      </HStack>
    </VStack>
  );
}
