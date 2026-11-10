// The result of the most recent sitting, kept in this browser to show on the oral home page.
import { storage } from '@/shared/lib/storage';
import type { GradedItem } from './gradingPrompt';

const KEY = 'qa-oral-last-sitting';

export type LastSitting = { title: string; solid: number; total: number; at: number };

export function saveLastSitting(title: string, items: GradedItem[]) {
  if (!items.length) return;
  storage.set(KEY, { title, solid: items.filter((i) => i.rating === 'solid').length, total: items.length, at: Date.now() });
}

export const loadLastSitting = () => storage.get<LastSitting | null>(KEY, null);

/** "today", "yesterday" or "3 days ago". */
export function daysAgo(at: number): string {
  const days = Math.floor((Date.now() - at) / 86_400_000);
  if (days <= 0) return 'today';
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
