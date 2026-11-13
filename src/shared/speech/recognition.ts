// Web Speech API feature detection and recognizer factory. The TS DOM lib does not have
// SpeechRecognition (and SpeechRecognitionPhrase exists only in newer Chrome), so the minimal
// types are declared here.

import { storage } from '@/shared/lib/storage';

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message?: string;
}

/** A phrase bias entry for browsers that support them (Chrome); weight 1-99, higher = stronger. */
export interface SpeechRecognitionPhraseLike {
  readonly phrase: string;
  readonly weight: number;
}

/** The minimal recognizer surface the speech session needs. */
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  /** Phrase biasing; absent in browsers that do not support it. */
  phrases?: SpeechRecognitionPhraseLike[];
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type SpeechRecognitionPhraseCtor = new (phrase: string, weight: number) => SpeechRecognitionPhraseLike;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
  SpeechRecognitionPhrase?: SpeechRecognitionPhraseCtor;
}

const speechWindow: SpeechWindow | undefined =
  typeof window === 'undefined' ? undefined : (window as Window & SpeechWindow);

const RecognitionCtor = speechWindow?.SpeechRecognition ?? speechWindow?.webkitSpeechRecognition;

/** True when this browser exposes (webkit)SpeechRecognition. */
export const isSpeechSupported: boolean = RecognitionCtor !== undefined;

// Chrome has SpeechRecognitionPhrase but rejects phrases with 'phrases-not-supported' unless
// recognition runs on-device (which hears less than its online service). A rejected start costs
// the first words of an answer, so the rejection is remembered in this browser and biasing is
// only tried again after PHRASES_RETRY_MS, in case a newer browser version accepts it.
const PHRASES_KEY = 'qa-speech-phrases-rejected';
const PHRASES_RETRY_MS = 30 * 24 * 60 * 60 * 1000;
let phrasesSupported = Date.now() - storage.get<number>(PHRASES_KEY, 0) > PHRASES_RETRY_MS;
export function disablePhrases(): void {
  phrasesSupported = false;
  storage.set(PHRASES_KEY, Date.now());
}

/**
 * Creates a configured recognizer: continuous, interim results, one alternative, and phrase
 * biasing towards the course's terms when the browser supports SpeechRecognitionPhrase
 * (older browsers just ignore it). Throws if speech recognition is not available.
 */
export function createRecognizer(opts: { lang: string; terms: string[] }): SpeechRecognitionLike {
  if (!RecognitionCtor) throw new Error('Speech recognition is not supported in this browser.');
  const rec = new RecognitionCtor();
  rec.lang = opts.lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  const PhraseCtor = speechWindow?.SpeechRecognitionPhrase;
  if (phrasesSupported && opts.terms.length && PhraseCtor && 'phrases' in rec) {
    try {
      rec.phrases = opts.terms.map((term) => new PhraseCtor(term, 5));
    } catch {
      // Phrase biasing is best-effort; recognition works without it.
    }
  }
  return rec;
}
