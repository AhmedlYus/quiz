// Explains page references in a question's "source" text, using course.json sourceInfo:
//   "p. 12" / "pp. 3-5"  pages of the course's own reading for that lecture (sourceInfo.pages)
//   "book p. 210"        pages printed in the book itself; matching sourceInfo.books give the edition
//   documents            parts citing one of sourceInfo.documents are pages of that document
// Patterns in sourceInfo are case-insensitive regular expressions.
import type { Course } from '../api/types';

export type SourceNote = { label: string; text: string };
export type SourceExplanation = { notes: SourceNote[]; editions: string[] } | null;

const rx = (s?: string) => (s ? new RegExp(s, 'i') : null);
const fill = (s: string, m: RegExpExecArray) => String(s || '').replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? '');
const PAGES = String.raw`(pp?)\.\s*(\d+(?:\s*[–-]\s*\d+)?(?:,\s*\d+(?:\s*[–-]\s*\d+)?)*)`;
const isPlural = (m: RegExpExecArray) => m[1] === 'pp' || /[–,-]/.test(m[2]);

/** Null when the source cites no pages, so there is nothing to explain. */
export function explainSource(source: string, topic: string | null | undefined, course: Course): SourceExplanation {
  if (!/\bpp?\.\s*\d/.test(source)) return null;
  const info = course.sourceInfo;
  const lecture = /lecture\s*(\d+)/i.exec(topic || '')?.[1];
  const reading = lecture
    ? String(info.pages || 'the reading for Lecture {lecture}').replaceAll('{lecture}', lecture)
    : info.pagesNoLecture || 'the reading for this lecture';

  const docs = (info.documents || []).filter((d) => d.match).map((d) => ({ re: rx(d.match)!, ...d }));
  const parts: string[] = [];
  const notes: SourceNote[] = [];
  for (const part of source.split(';')) {
    const d = docs.find((o) => o.re.test(part));
    if (!d) {
      parts.push(part);
      continue;
    }
    const dm = d.re.exec(part)!;
    const pm = new RegExp(PAGES, 'i').exec(part);
    if (pm) {
      notes.push({
        label: `${fill(d.name, dm)} ${pm[1]}. ${pm[2]}`,
        text: `${isPlural(pm) ? 'are pages' : 'is page'} ${pm[2]} of ${fill(d.doc, dm)}.`,
      });
    }
  }
  const bookText = parts.join(';');
  const pdfM = new RegExp(String.raw`(?<!book )\b${PAGES}`, 'i').exec(bookText);
  const bookM = new RegExp(String.raw`book ${PAGES}`, 'i').exec(bookText);
  if (!pdfM && !bookM && !notes.length) return null;
  if (bookM) {
    notes.unshift({
      label: `book ${bookM[1]}. ${bookM[2]}`,
      text: isPlural(bookM) ? 'are the page numbers printed in the book itself.' : 'is the page number printed in the book itself.',
    });
  }
  if (pdfM) {
    notes.unshift({ label: `${pdfM[1]}. ${pdfM[2]}`, text: `${isPlural(pdfM) ? 'are pages' : 'is page'} ${pdfM[2]} of ${reading}.` });
  }
  const editions = (info.books || [])
    .filter((b) => {
      const [match, also, unless] = [rx(b.match), rx(b.also), rx(b.unless)];
      return parts.some((p) => match?.test(p) && (!also || also.test(p)) && !(unless && unless.test(p)));
    })
    .map((b) => b.text);
  return { notes, editions };
}
