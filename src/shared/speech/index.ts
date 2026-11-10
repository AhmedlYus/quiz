// Public API of the speech-to-text module (see AGENTS.md for the layout).
export { compileFixes, joinText, type TermFix } from './termFixes';
export {
  createRecognizer,
  isSpeechSupported,
  type SpeechRecognitionAlternative,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionEvent,
  type SpeechRecognitionLike,
  type SpeechRecognitionPhraseLike,
  type SpeechRecognitionResult,
  type SpeechRecognitionResultList,
} from './recognition';
export {
  createSpeechSession,
  MIC_BLOCKED_MESSAGE,
  type SpeechSession,
  type SpeechSessionOptions,
} from './session';
export { useSpeechToText, type SpeechToText, type SpeechToTextOptions } from './useSpeechToText';
export { SpeechTextArea, type SpeechTextAreaProps } from './SpeechTextArea';
