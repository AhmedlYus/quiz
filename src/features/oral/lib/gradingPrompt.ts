// Builds the "Copy for GPT" prompt: an examiner brief plus, per question, the key points, model
// answer and the student's answer. See also courses/<course>/prompts/grade-oral.md.
import type { Course, OralSettings } from '@/shared/api/types';
import type { OralQuestion, Rating, Reveal } from '../api';
import { typeLabel } from './labels';

/** One answered question, kept in the browser for the sitting summary and the GPT prompt. */
export type GradedItem = {
  q: OralQuestion;
  reveal: Reveal | null;
  answer: string;
  hintsUsed: number;
  rating?: Rating;
};

export function buildGradingPrompt(
  items: GradedItem[],
  { course, oral, exam = false }: { course: Course; oral: OralSettings; exam?: boolean },
): string {
  const query = oral.query;
  const lines = [
    `You are an examiner for ${oral.examiner || `${course.code} ${course.name}`}, ${exam ? 'running a mock oral exam' : 'oral exam practice'}.`,
    'Grade each answer strictly against its key points. Do not credit insight the student did not actually express.',
    'For each answer give:',
    '- A score from 1 to 5 for correctness, completeness (key points), clarity/structure and precise terminology.',
    '- Key points that were missed, and anything that was stated wrongly.',
    query
      ? `- For ${query.language} queries: ${query.grading || 'whether the query would produce the required output, and why or why not'}.`
      : null,
    '- One follow-up question an examiner would ask next. Wait for my answer before grading it.',
    'Finish with the 2-3 weakest areas overall and what to revise first.',
    'Answers may come from speech recognition; ignore obvious transcription errors.',
    exam ? 'The student answered each question without slides, books or other aids.' : null,
  ].filter((l): l is string => l !== null);

  items.forEach(({ q, reveal, answer, hintsUsed }, i) => {
    lines.push('', `--- Question ${i + 1} (${q.topic}; ${typeLabel(q.type, query)}) ---`, `Question: ${q.prompt}`);
    if (q.code) lines.push(`Given:\n${q.code}`);
    if (reveal) {
      lines.push(`Key points:\n${reveal.keyPoints.map((p) => `- ${p}`).join('\n')}`);
      lines.push(`Model answer: ${reveal.modelAnswer}`);
      if (reveal.alternatives.length) lines.push(`Also acceptable: ${reveal.alternatives.join(' | ')}`);
    }
    lines.push(`Student's answer:\n${answer.trim() || '(answered out loud, nothing recorded)'}`);
    if (hintsUsed) lines.push(`(The student used ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}.)`);
  });
  return lines.join('\n');
}
