// useSpeechToText: thin React wrapper around the framework-free createSpeechSession, so the
// session logic stays testable without a DOM. The textarea is controlled: while listening, the
// session reports base + live interim words through onChange so the words appear inside the box;
// typed edits become the new base; onSettled carries settled text only, which callers persist.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createRecognizer, isSpeechSupported } from './recognition';
import { createSpeechSession } from './session';
import { compileFixes } from './termFixes';

export interface SpeechToTextOptions {
  /** Recognition language, e.g. 'en-US' (oral.speechLang in course.json). */
  lang: string;
  /** Course terms the recognizer should be biased towards (oral.speech.terms). */
  terms: string[];
  /** [pattern, replacement] term fixes (oral.speech.fixes); applied to finished phrases only. */
  fixes: [string, string][];
  /** The controlled text (what the textarea shows). */
  value: string;
  /** Called with settled text + the phrase still being recognised (the live textarea text). */
  onChange: (text: string) => void;
  /** Called with settled text only (finished phrases, term fixes applied); callers persist it. */
  onSettled?: (text: string) => void;
}

export interface SpeechToText {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
}

export function useSpeechToText(opts: SpeechToTextOptions): SpeechToText {
  const { lang, terms, fixes, value } = opts;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always call the latest callbacks and use the latest course settings, without having to
  // recreate the session on every render.
  const latest = useRef({ lang, terms, fixes, value, onChange: opts.onChange, onSettled: opts.onSettled });
  latest.current = { lang, terms, fixes, value, onChange: opts.onChange, onSettled: opts.onSettled };

  // The text this hook last asked to show. If the incoming value differs while listening,
  // the user typed: the typed text becomes the new base (results are not re-added on top).
  const emitted = useRef<string | null>(null);

  const sessionRef = useRef<ReturnType<typeof createSpeechSession> | null>(null);
  if (sessionRef.current === null && isSpeechSupported) {
    sessionRef.current = createSpeechSession({
      createRecognizer: () => {
        const s = latest.current;
        return createRecognizer({ lang: s.lang, terms: s.terms });
      },
      fixText: (text) => compileFixes(latest.current.fixes)(text),
      onChange: (text) => {
        emitted.current = text;
        latest.current.onChange(text);
      },
      onSettled: (text) => latest.current.onSettled?.(text),
      onListeningChange: setIsListening,
      onError: setError,
    });
  }

  // Detect typing while listening: our own emitted updates come back as `value` unchanged;
  // a different value means the user edited the text.
  useEffect(() => {
    const session = sessionRef.current;
    if (!session || !session.isListening()) return;
    if (emitted.current !== null && value !== emitted.current) session.setBase(value);
  }, [value]);

  // Stop on unmount (also stops the auto-restart loop).
  useEffect(() => () => sessionRef.current?.stop(), []);

  const start = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    setError(null);
    session.start(latest.current.value);
  }, []);

  const stop = useCallback(() => sessionRef.current?.stop(), []);

  return { isSupported: isSpeechSupported, isListening, start, stop, error };
}
