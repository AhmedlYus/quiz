// Does the transcript seem to mention a key point? Only a nudge for the self-check, never a grade:
// speech recognition mangles technical terms.

const STOP = new Set(
  'the and for with that this from what which when where then than into over under about between their there they them have has had been being also only each such more most other some same very just like your yours mean means used uses using does make makes made'.split(
    ' ',
  ),
);

const WORD = /[\p{L}\p{N}]+/gu;
const stem = (w: string) => w.slice(0, 5);

export function seemsMentioned(point: string, transcript: string): boolean {
  if (!transcript.trim()) return false;
  const said = new Set((transcript.toLowerCase().match(WORD) ?? []).map(stem));
  const words = (point.toLowerCase().match(WORD) ?? []).filter((w) => w.length >= 4 && !STOP.has(w));
  if (!words.length) return false;
  const hits = words.filter((w) => said.has(stem(w))).length;
  return hits / words.length >= 0.6;
}

/** Indices of the key points the transcript seems to mention. */
export const suggestedPoints = (points: string[], transcript: string): number[] =>
  points.flatMap((p, i) => (seemsMentioned(p, transcript) ? [i] : []));

/** How a share of covered key points reads as a self-rating. */
export function suggestionFor(covered: number, total: number): 'solid' | 'partial' | 'miss' | null {
  if (!covered || !total) return null;
  const share = covered / total;
  return share >= 0.8 ? 'solid' : share >= 0.4 ? 'partial' : 'miss';
}
