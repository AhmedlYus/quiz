// Read-only code: model queries and quiz snippets in the course's query language, or plain text
// for context such as a question's stream and field list.
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { useQueryLanguage } from './queryLanguage';

type Props = { code: string; hasCopyButton?: boolean; isPlain?: boolean };

export function QueryCode({ code, hasCopyButton = false, isPlain = false }: Props) {
  const language = useQueryLanguage();
  return <CodeBlock code={code} language={isPlain ? 'plaintext' : language} hasCopyButton={hasCopyButton} isWrapped width="100%" size="sm" />;
}
