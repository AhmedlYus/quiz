// The course's query language (oral.query in course.json) as an Astryx CodeBlock language, so
// shown code is coloured by the same tokenizer as the editor.
import { useMemo } from 'react';
import { createCodeLanguage, type CodeLanguage } from '@astryxdesign/core/CodeBlock';
import type { QuerySettings } from '@/shared/api/types';
import { useCourse } from '@/shared/session/SessionContext';
import { createTokenizer, type Syntax } from './highlight';

export const syntaxOf = (query: QuerySettings): Syntax => ({ keywords: query.keywords, operators: query.operators, views: query.views });

export function useQuerySettings(): QuerySettings | null {
  return useCourse().oral?.query ?? null;
}

/** The course's query language, or plain text when the course has none. */
export function useQueryLanguage(): CodeLanguage | 'plaintext' {
  const query = useQuerySettings();
  return useMemo(() => {
    if (!query) return 'plaintext';
    const tokenize = createTokenizer(syntaxOf(query));
    return createCodeLanguage({ name: query.language, identifiers: [query.language.toLowerCase()], tokenize: (code) => tokenize(code) });
  }, [query]);
}
