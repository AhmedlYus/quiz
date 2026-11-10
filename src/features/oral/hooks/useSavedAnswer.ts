// What the player said or typed for a question. It stays in this browser (never sent to the
// server), so a reload or a later visit shows it again. Every change is saved: the speech box only
// reports finished text through onSettled while recognising, and typed edits not at all.
import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '@/shared/lib/storage';

const answerKey = (id: string) => `qa-oral-answer:${id}`;

export const loadAnswer = (id: string) => storage.get<{ text?: string } | null>(answerKey(id), null)?.text ?? '';

export function useSavedAnswer(id: string) {
  const [text, setText] = useState(() => loadAnswer(id));
  const saved = useRef(text);

  const save = useCallback(
    (value: string) => {
      saved.current = value;
      storage.set(answerKey(id), { text: value, at: Date.now() });
    },
    [id],
  );

  useEffect(() => {
    if (text !== saved.current) save(text);
  }, [text, save]);

  return { text, setText, save };
}
