// Where the answer goes: speech-to-text box (type or speak) for most questions, the code editor
// with a "Copy query" button for query questions.
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { useToast } from '@astryxdesign/core/Toast';
import { Copy } from 'lucide-react';
import { SpeechTextArea } from '@/shared/speech';
import { CodeEditor, syntaxOf } from '@/shared/editor';
import { copyText } from '@/shared/lib/clipboard';
import type { OralQuestion } from '../api';
import { useOral } from '../hooks/useOral';

type Props = {
  question: OralQuestion;
  value: string;
  onChange: (text: string) => void;
  onStart: () => void;
  isLocked?: boolean;
  label?: string;
  rows?: number;
};

export function AnswerArea({ question, value, onChange, onStart, isLocked = false, label = 'Your answer', rows = 6 }: Props) {
  const oral = useOral();
  const showToast = useToast();

  if (question.type === 'query' && oral.query) {
    const { query } = oral;
    return (
      <VStack gap={2}>
        <CodeEditor
          id={`query-${question.id}`}
          label={query.label || 'Your query'}
          value={value}
          placeholder={query.placeholder}
          syntax={syntaxOf(query)}
          rows={7}
          onChange={(v) => {
            onChange(v);
            if (v.trim()) onStart();
          }}
        />
        <HStack>
          <Button
            label="Copy query"
            variant="ghost"
            size="sm"
            icon={<Icon icon={Copy} />}
            isDisabled={!value.trim()}
            clickAction={async () => {
              const ok = await copyText(value);
              showToast({ body: ok ? 'Query copied.' : 'Could not copy the query.', type: ok ? 'info' : 'error' });
            }}
          />
        </HStack>
      </VStack>
    );
  }

  return (
    <SpeechTextArea
      id={`answer-${question.id}`}
      label={label}
      value={value}
      rows={rows}
      isDisabled={isLocked}
      lang={oral.speechLang}
      terms={oral.speech.terms}
      fixes={oral.speech.fixes}
      placeholder="Press the mic and answer out loud, or type here."
      onStart={onStart}
      onChange={(text) => {
        onChange(text);
        if (text.trim()) onStart();
      }}
    />
  );
}
