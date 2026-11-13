// useSpeechToText: thin React wrapper around the framework-free createSpeechSession, so the
// session logic stays testable without a DOM. The textarea is controlled: while listening, the
// session reports settled text + live interim words through onChange so the words appear inside
// the box. The text box reports the user's own edits through edit(), which makes the edited text
// the new starting point for what is heard next.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createRecognizer, disablePhrases, isSpeechSupported } from './recognition';
import { createSpeechSession } from './session';
import { compileFixes, type TermFix } from './termFixes';

export interface SpeechToTextOptions {
  /** Recognition language, e.g. 'en-US' (oral.speechLang in course.json). */
  lang: string;
  /** Course terms the recognizer should be biased towards (oral.speech.terms). */
  terms: string[];
  /** [pattern, replacement] term fixes (oral.speech.fixes); applied to finished phrases only. */
  fixes: TermFix[];
  /** The controlled text (what the textarea shows). */
  value: string;
  /** Called with settled text + the phrase still being recognised (the live textarea text). */
  onChange: (text: string) => void;
}

export interface SpeechToText {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  /** Tell the session the user typed: `text` is the whole edited text. No-op when not listening. */
  edit: (text: string) => void;
  error: string | null;
}

export function useSpeechToText(opts: SpeechToTextOptions): SpeechToText {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always call the latest callback and use the latest course settings, without having to
  // recreate the session on every render.
  const latest = useRef(opts);
  latest.current = opts;

  const sessionRef = useRef<ReturnType<typeof createSpeechSession> | null>(null);
  if (sessionRef.current === null && isSpeechSupported) {
    let fixes: TermFix[] | null = null;
    let fix = (text: string) => text;
    sessionRef.current = createSpeechSession({
      createRecognizer: () => createRecognizer({ lang: latest.current.lang, terms: latest.current.terms }),
      fixText: (text) => {
        if (fixes !== latest.current.fixes) {
          fixes = latest.current.fixes;
          fix = compileFixes(fixes);
        }
        return fix(text);
      },
      onChange: (text) => latest.current.onChange(text),
      onListeningChange: setIsListening,
      onError: setError,
      onPhrasesUnsupported: disablePhrases,
    });
  }

  // Stop on unmount (also stops the auto-restart loop).
  useEffect(() => () => sessionRef.current?.stop(), []);

  const start = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    setError(null);
    session.start(latest.current.value);
  }, []);

  const stop = useCallback(() => sessionRef.current?.stop(), []);

  const edit = useCallback((text: string) => {
    const session = sessionRef.current;
    if (session?.isListening()) session.setBase(text);
  }, []);

  return { isSupported: isSpeechSupported, isListening, start, stop, edit, error };
}
