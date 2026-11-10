// The custom round form's choices (length, lectures, "only not mastered"), remembered on this device.
import { useCallback, useState } from 'react';
import { storage } from '@/shared/lib/storage';
import type { TopicRow } from '../api';

export const CUSTOM_COUNTS = [10, 20, 30, 50, null] as const;
type Saved = { count?: number | null; topics?: string[]; unmastered?: boolean };
const KEY = 'qa-custom';

export function useCustomChoices(topics: TopicRow[]) {
  // Lectures without any questions yet are listed but cannot be ticked.
  const known = new Set(topics.filter((t) => t.total).map((t) => t.topic));
  const [state] = useState(() => {
    const saved = storage.get<Saved>(KEY, {});
    const count = (CUSTOM_COUNTS as readonly (number | null | undefined)[]).includes(saved.count) ? (saved.count as number | null) : 20;
    return {
      count,
      topics: (saved.topics ?? [...known]).filter((t) => known.has(t)),
      unmastered: saved.unmastered ?? true,
    };
  });
  const [count, setCountState] = useState<number | null>(state.count);
  const [selected, setSelectedState] = useState<string[]>(state.topics);
  const [unmastered, setUnmasteredState] = useState(state.unmastered);

  const save = useCallback((next: Required<Saved>) => storage.set(KEY, next), []);
  const setCount = (v: number | null) => (setCountState(v), save({ count: v, topics: selected, unmastered }));
  const setSelected = (v: string[]) => (setSelectedState(v), save({ count, topics: v, unmastered }));
  const setUnmastered = (v: boolean) => (setUnmasteredState(v), save({ count, topics: selected, unmastered: v }));

  return { count, setCount, selected, setSelected, unmastered, setUnmastered, known };
}
