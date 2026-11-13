// Framework-free speech session. It keeps a "base" of settled text (finished phrases, term fixes
// applied) plus whatever phrase is still being recognised. While listening, the shown text is
// base + live interim words, so the words appear inside the textarea as they are spoken.

import { joinText } from './termFixes';
import type { SpeechRecognitionLike } from './recognition';

/** The message for blocked microphone permissions ('not-allowed'). */
export const MIC_BLOCKED_MESSAGE =
  'Microphone access is blocked. Allow it in the browser to use speech-to-text.';
const START_FAILED_MESSAGE = 'Speech-to-text could not start. Try again, or type your answer.';

// Errors that end the session; anything else ('no-speech', 'aborted') just restarts listening.
const FATAL_ERRORS: Record<string, string> = {
  'not-allowed': MIC_BLOCKED_MESSAGE,
  'service-not-allowed':
    'This browser does not allow speech-to-text here. Try Chrome, Edge or Safari, or type your answer.',
  'audio-capture': 'No microphone was found. Connect one or check your sound settings.',
  network: 'Speech-to-text needs an internet connection to the browser’s speech service. Check your connection, or type your answer.',
  'language-not-supported': 'This browser cannot recognise the course language. Type your answer instead.',
};

// Restarts that end within this time without any result count as failures; after
// MAX_EMPTY_RESTARTS of them in a row the session gives up instead of looping silently.
const QUICK_END_MS = 1500;
const MAX_EMPTY_RESTARTS = 5;

export interface SpeechSession {
  /** Starts listening; baseText is the current text shown (typing before this is kept). */
  start(baseText: string): void;
  /** Stops listening and ends the session (no auto-restart). */
  stop(): void;
  isListening(): boolean;
  /**
   * The user edited the text while listening: the edited text (which includes the words shown
   * so far) becomes the new base, and the phrase in progress is not added a second time.
   */
  setBase(text: string): void;
}

export interface SpeechSessionOptions {
  /** Creates a fresh recognizer for each listening stretch (injectable for tests). */
  createRecognizer: () => SpeechRecognitionLike;
  /** Applies term fixes to finished phrases (e.g. compileFixes(oral.speech.fixes)). */
  fixText: (text: string) => string;
  /** Called with settled text plus the phrase still being recognised (the live textarea text). */
  onChange(text: string): void;
  onListeningChange?(listening: boolean): void;
  /** Called with a user-facing message when listening fails (blocked mic, start failure). */
  onError?(message: string): void;
  /** The browser rejected phrase biasing; later recognizers should be created without it. */
  onPhrasesUnsupported?(): void;
}

export function createSpeechSession(opts: SpeechSessionOptions): SpeechSession {
  const { createRecognizer, fixText, onChange, onListeningChange, onError, onPhrasesUnsupported } = opts;

  let base = '';
  let pending = ''; // the phrase still being recognised (not in base yet)
  let offset = 0; // results before this index are already folded into base
  let skip = -1; // index of a phrase the user already kept by editing the text mid-phrase
  let rec: SpeechRecognitionLike | null = null;
  let listening = false;
  let startedAt = 0;
  let heard = false; // a result arrived since the recognizer last started
  let emptyRestarts = 0;

  function emitListening(value: boolean) {
    listening = value;
    onListeningChange?.(value);
  }

  // The browser does not always finish the last phrase before a stretch ends (silence timeout,
  // connection drop), so what was heard of it is kept rather than lost.
  function settlePending() {
    if (pending.trim()) base = joinText(base, fixText(pending));
    pending = '';
  }

  function fail(message: string) {
    settlePending();
    onChange(base);
    emitListening(false);
    onError?.(message);
    const old = rec;
    rec = null;
    try {
      old?.abort();
    } catch {
      // Ignore: the session is over either way.
    }
  }

  // Each listening stretch gets a fresh recognizer, so a restart picks up changed settings
  // (phrases turned off) and never reuses one the browser has given up on.
  function launch(): boolean {
    const next = createRecognizer();
    next.onresult = (ev) => rec === next && handleResult(ev);
    next.onerror = (ev) => rec === next && handleError(ev);
    next.onend = () => rec === next && handleEnd();
    rec = next;
    offset = 0;
    skip = -1;
    heard = false;
    startedAt = Date.now();
    try {
      next.start();
      return true;
    } catch {
      rec = null;
      return false;
    }
  }

  function handleResult(ev: SpeechRecognitionEventLikeResult) {
    heard = true;
    emptyRestarts = 0;
    // Fold finished phrases into base (term fixes applied), then show whatever is still
    // being recognised after it.
    while (offset < ev.results.length && ev.results[offset].isFinal) {
      if (offset === skip) skip = -1;
      else base = joinText(base, fixText(ev.results[offset][0].transcript));
      offset++;
    }
    pending = '';
    // A phrase in progress can span several entries (a stable part and the newest words).
    if (offset !== skip) for (let i = offset; i < ev.results.length; i++) pending += ev.results[i][0].transcript;
    onChange(joinText(base, pending));
  }

  function handleError(ev: { error: string }) {
    if (ev.error === 'phrases-not-supported') {
      onPhrasesUnsupported?.();
      return; // onend follows and restarts with a recognizer without phrases
    }
    const message = FATAL_ERRORS[ev.error];
    if (message) fail(message);
  }

  function handleEnd() {
    settlePending();
    onChange(base);
    if (!listening) {
      rec = null;
      return;
    }
    // Browsers end recognition after a pause; keep going until stop() is called.
    const empty = !heard && Date.now() - startedAt < QUICK_END_MS;
    emptyRestarts = empty ? emptyRestarts + 1 : 0;
    if (emptyRestarts > MAX_EMPTY_RESTARTS || !launch()) fail(START_FAILED_MESSAGE);
  }

  function start(baseText: string) {
    if (listening) return;
    base = baseText;
    pending = '';
    emptyRestarts = 0;
    if (!launch()) {
      onError?.(START_FAILED_MESSAGE);
      return;
    }
    emitListening(true);
  }

  function stop() {
    if (!listening) return;
    emitListening(false);
    // stop() (not abort()) lets the browser deliver the last phrase before onend.
    try {
      rec?.stop();
    } catch {
      rec = null;
      settlePending();
      onChange(base);
    }
  }

  function setBase(text: string) {
    base = text;
    // The edited text already contains the words shown for the phrase in progress.
    if (pending) skip = offset;
    pending = '';
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
