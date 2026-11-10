// SpeechTextArea: the oral-mode answer box as a ready-to-use component. A controlled textarea
// with a mic toggle, a live "Listening…" status, and a help line that reflects speech support.
// Speech-to-text lives in the browser; the shown text is settled text + live interim words.

import { Button } from '@astryxdesign/core/Button';
import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import type { JSX } from 'react';
import './speech.css';
import { useSpeechToText } from './useSpeechToText';

const SUPPORTED_HELP =
  'Speech-to-text understands English. Words appear in the box as you speak; fix any mistakes by typing.';
const UNSUPPORTED_HELP =
  'Speech-to-text is not available in this browser (try Chrome, Edge or Safari). Type instead, or answer out loud and tick the key points honestly.';

export interface SpeechTextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (text: string) => void;
  onSettled?: (text: string) => void;
  onStart?: () => void;
  /** Recognition language, e.g. 'en-US'. */
  lang: string;
  /** Course terms the recognizer should be biased towards. */
  terms: string[];
  /** [pattern, replacement] term fixes applied to finished phrases. */
  fixes: [string, string][];
  rows?: number;
  isDisabled?: boolean;
  placeholder?: string;
}

export function SpeechTextArea(props: SpeechTextAreaProps): JSX.Element {
  const {
    id,
    label,
    value,
    onChange,
    onSettled,
    onStart,
    lang,
    terms,
    fixes,
    rows = 6,
    isDisabled = false,
    placeholder,
  } = props;

  const speech = useSpeechToText({ lang, terms, fixes, value, onChange, onSettled });
  const { isSupported, isListening, error } = speech;
  const helpId = `${id}-help`;

  function toggleMic() {
    if (isListening) {
      speech.stop();
    } else {
      speech.start();
      onStart?.();
    }
  }

  return (
    <VStack gap={2}>
      <HStack gap={2} vAlign="center">
        <StackItem size="fill">
          <Text type="label">{label}</Text>
        </StackItem>
        <HStack gap={1} vAlign="center" role="status">
          {isListening && <StatusDot variant="accent" isPulsing label="Recording your answer" />}
          {isListening && <Text type="supporting">Listening…</Text>}
        </HStack>
        <Button
          label={isListening ? 'Stop' : 'Start speaking'}
          icon={<Icon icon={isListening ? 'stop' : 'microphone'} />}
          isDisabled={!isSupported || isDisabled}
          aria-pressed={isListening}
          onClick={toggleMic}
        />
      </HStack>
      <TextArea
        id={id}
        label={label}
        isLabelHidden
        value={value}
        onChange={(text) => onChange(text)}
        rows={rows}
        isDisabled={isDisabled}
        placeholder={
          placeholder ??
          (isSupported
            ? 'Press the mic and answer out loud, or type here.'
            : 'Type your answer here, or say it out loud and self-check.')
        }
        aria-describedby={helpId}
        controlClassName={isListening ? 'speech-control-listening' : undefined}
      />
      <Text as="p" type="supporting" id={helpId}>
        {isSupported ? SUPPORTED_HELP : UNSUPPORTED_HELP}
      </Text>
      {error && <FieldStatus type="error" message={error} variant="detached" id={`${id}-error`} />}
    </VStack>
  );
}
