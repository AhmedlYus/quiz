// "a sample question" / "3 sample questions", or with course.json "samplesOwner" (e.g. "the
// lecturer's"): "the lecturer's sample question" / "the lecturer's 3 sample questions".
export function samplesText(n: number, owner: string): string {
  const what = n === 1 ? 'sample question' : `${n} sample questions`;
  if (owner) return `${owner} ${what}`;
  return n === 1 ? `a ${what}` : what;
}
