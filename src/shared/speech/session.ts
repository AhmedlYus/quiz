// Framework-free speech session: the ported logic of the old answerBox(). It keeps a "base" of
// settled text (finished phrases, term fixes applied) plus whatever phrase is still being
// recognised. While listening, the shown text is base + live interim words, so the words appear
// inside the textarea as they are spoken. Only settled text is reported to onSettled, which
// callers use to persist the answer.

import { joinText } from './termFixes';
import type { SpeechRecognitionLike } from './recognition';

/** The exact message for blocked microphone permissions ('not-allowed' / 'service-not-allowed'). */
export const MIC_BLOCKED_MESSAGE =
  'Microphone access is blocked. Allow it in the browser to use speech-to-text.';
const START_FAILED_MESSAGE = 'Speech-to-text could not start.';

export interface SpeechSession {
  /** Starts listening; baseText is the current text shown (typing before this is kept). */
  start(baseText: string): void;
  /** Stops listening and ends the session (no auto-restart). */
  stop(): void;
  isListening(): boolean;
  /**
   * The user typed while listening: the typed text becomes the new base, and results already
   * received are not re-added on top of it.
   */
  setBase(text: string): void;
}

export interface SpeechSessionOptions {
  /** Creates a fresh recognizer for each listening session (injectable for tests). */
  createRecognizer: () => SpeechRecognitionLike;
  /** Applies term fixes to finished phrases (e.g. compileFixes(oral.speech.fixes)). */
  fixText: (text: string) => string;
  /** Called with settled text plus the phrase still being recognised (the live textarea text). */
  onChange(text: string): void;
  /** Called with settled text only (finished phrases, term fixes applied); callers persist it. */
  onSettled(text: string): void;
  onListeningChange?(listening: boolean): void;
  /** Called with a user-facing message when listening fails (blocked mic, start failure). */
  onError?(message: string): void;
}

export function createSpeechSession(opts: SpeechSessionOptions): SpeechSession {
  const { createRecognizer, fixText, onChange, onSettled, onListeningChange, onError } = opts;

  let base = '';
  let offset = 0; // results before this index are already folded into base
  let resultCount = 0;
  let rec: SpeechRecognitionLike | null = null;
  let listening = false;

  function emitListening(value: boolean) {
    listening = value;
    onListeningChange?.(value);
  }

  function handleResult(ev: SpeechRecognitionEventLikeResult) {
    resultCount = ev.results.length;
    // Fold finished phrases into base (term fixes applied), then show whatever is still
    // being recognised after it.
    while (offset < ev.results.length && ev.results[offset].isFinal) {
      base = joinText(base, fixText(ev.results[offset][0].transcript));
      offset++;
    }
    let pending = '';
    for (let i = offset; i < ev.results.length; i++) pending += ev.results[i][0].transcript;
    onChange(joinText(base, pending));
    onSettled(base);
  }

  function handleError(ev: { error: string }) {
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      emitListening(false);
      onError?.(MIC_BLOCKED_MESSAGE);
      try {
        rec?.stop();
      } catch {
        // Ignore: the session is over either way.
      }
    }
  }

  function handleEnd() {
    // Whatever was still being recognised is dropped; the shown text becomes base.
    onChange(base);
    // Browsers end recognition after a pause; keep going until stop() is called.
    if (listening) {
      offset = 0;
      resultCount = 0;
      try {
        rec?.start();
      } catch {
        stop();
      }
    }
  }

  function start(baseText: string) {
    if (listening) return;
    base = baseText;
    offset = 0;
    resultCount = 0;
    rec = createRecognizer();
    rec.onresult = (ev) => handleResult(ev);
    rec.onerror = (ev) => handleError(ev);
    rec.onend = () => handleEnd();
    try {
      rec.start();
    } catch {
      rec = null;
      onError?.(START_FAILED_MESSAGE);
      return;
    }
    emitListening(true);
  }

  function stop() {
    if (!listening) return;
    emitListening(false);
    try {
      rec?.stop();
    } catch {
      // Ignore; listening=false already stops the auto-restart.
    }
  }

  function setBase(text: string) {
    base = text;
    offset = resultCount; // results already received are not re-added on top of the typed text
    onSettled(base);
  }

  return { start, stop, isListening: () => listening, setBase };
}

/** Structural type for the result event so a plain object works in tests without the DOM. */
interface SpeechRecognitionEventLikeResult {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
  };
}
