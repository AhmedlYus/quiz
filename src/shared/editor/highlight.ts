// Tokenizer for the course's query language. Knows no language itself: the course passes its
// keywords, operators and "views" pattern (oral.query in course.json). Pure and DOM-free, safe to
// run in Node. Feeds both the editor overlay (createHighlighter) and Astryx CodeBlock
// (queryLanguage.ts), so code looks the same while typing and when shown.

export type Syntax = {
  keywords?: string[];
  operators?: string[];
  /** Regex source matching "views" like #time(30 sec), whose numbers it should swallow. */
  views?: string;
};

/** Astryx syntax token types, also used as the editor's colour classes. */
export type TokenType = 'comment' | 'string' | 'function' | 'operator' | 'keyword' | 'number';
export type Token = { type: TokenType; start: number; end: number };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const escapeHTML = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** Alternation of escaped terms, longest first, so multi-word keywords match before their parts. */
const alt = (list: string[]) => list.slice().sort((a, b) => b.length - a.length).map(escapeRe).join('|');

export function createTokenizer(syntax?: Syntax): (text: string) => Token[] {
  const { keywords = [], operators = [], views = '' } = syntax ?? {};
  // Alternation order matters: comments/strings protect their contents, views
  // (e.g. #time(30 sec)) swallow their numbers, and multi-word keywords must
  // precede their single-word parts ("insert into" before "in").
  const tokenRe = new RegExp(
    [
      String.raw`(?<com>//[^\n]*|/\*[\s\S]*?(?:\*/|$))`,
      String.raw`(?<str>'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?)`,
      views ? `(?<view>${views})` : null,
      operators.length ? `(?<op>${alt(operators)})` : null,
      keywords.length ? String.raw`(?<kw>\b(?:${alt(keywords)})\b)` : null,
      String.raw`(?<num>\b\d+(?:\.\d+)?\b)`,
    ]
      .filter(Boolean)
      .join('|'),
    'gi',
  );

  return (text: string) => {
    const src = String(text ?? '');
    const tokens: Token[] = [];
    tokenRe.lastIndex = 0;
    for (let m = tokenRe.exec(src); m; m = tokenRe.exec(src)) {
      if (m[0].length === 0) {
        tokenRe.lastIndex++;
        continue;
      }
      const g = m.groups;
      const type: TokenType = g?.com ? 'comment' : g?.str ? 'string' : g?.view ? 'function' : g?.op ? 'operator' : g?.kw ? 'keyword' : 'number';
      tokens.push({ type, start: m.index, end: m.index + m[0].length });
    }
    return tokens;
  };
}

/** HTML for the editor overlay: every character of the input exactly once (HTML-escaped), so
 * the overlay text always matches the textarea byte-for-byte. */
export function createHighlighter(syntax?: Syntax): (text: string) => string {
  const tokenize = createTokenizer(syntax);
  return (text: string) => {
    const src = String(text ?? '');
    let out = '';
    let last = 0;
    for (const t of tokenize(src)) {
      if (t.start > last) out += escapeHTML(src.slice(last, t.start));
      out += `<span class="ed-${t.type}">${escapeHTML(src.slice(t.start, t.end))}</span>`;
      last = t.end;
    }
    return out + escapeHTML(src.slice(last));
  };
}
