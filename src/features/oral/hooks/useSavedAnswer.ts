// What the player said or typed for a question. It stays in this browser (never sent to the
// server), so a reload or a later visit shows it again. Every change is saved.
import { useEffect, useRef, useState } from 'react';
import { storage } from '@/shared/lib/storage';

const answerKey = (id: string) => `qa-oral-answer:${id}`;

export const loadAnswer = (id: string) => storage.get<{ text?: string } | null>(answerKey(id), null)?.text ?? '';

export function useSavedAnswer(id: string) {
  const [text, setText] = useState(() => loadAnswer(id));
  const saved = useRef(text);

  useEffect(() => {
    if (text === saved.current) return;
    saved.current = text;
    storage.set(answerKey(id), { text, at: Date.now() });
  }, [id, text]);

  return { text, setText };
}
