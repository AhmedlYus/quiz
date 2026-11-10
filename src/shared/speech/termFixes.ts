// Term fixes for speech-to-text: course terms that recognition tends to spell out or mishear
// (oral.speech.fixes in course.json). Applied to finished phrases only, never to live interim
// text, so a fix cannot fire halfway through a word being spoken.

export type TermFix = [pattern: string, replacement: string];

/**
 * Compiles [pattern, replacement] pairs into a single text transform. Patterns are
 * case-insensitive and global; invalid patterns are skipped so one bad entry in course.json
 * cannot break the rest.
 */
export function compileFixes(fixes: TermFix[]): (text: string) => string {
  const rules: { re: RegExp; to: string }[] = [];
  for (const [pattern, replacement] of fixes) {
    try {
      rules.push({ re: new RegExp(pattern, 'gi'), to: replacement });
    } catch {
      // Skip invalid regexes; the remaining fixes keep working.
    }
  }
  return (text: string) => rules.reduce((out, { re, to }) => out.replace(re, to), text);
}

/**
 * Joins non-empty parts with single spaces. The first part keeps its leading text but loses
 * trailing whitespace; later parts are trimmed on both sides, so "base" + a recognised phrase
 * never end up double- or leading-spaced. (Same as the old plain-JS joinText.)
 */
export function joinText(...parts: string[]): string {
  return parts
    .filter((p) => p && p.trim())
    .map((p, i) => (i ? p.trim() : p.replace(/\s+$/, '')))
    .join(' ');
}
