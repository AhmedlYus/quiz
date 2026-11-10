// Study modes, switched on per course in course.json "modes". Each mode's home is its hub.
import type { Course } from '@/shared/api/types';

export type StudyMode = 'quiz' | 'oral' | 'query';

export const MODE_HOME: Record<StudyMode, string> = { quiz: '/', oral: '/oral', query: '/query' };

const ORDER: StudyMode[] = ['quiz', 'oral', 'query'];

export const enabledModes = (course: Course): StudyMode[] => ORDER.filter((m) => course.modes[m]);

export function modeOfPath(path: string): StudyMode {
  if (path === '/oral' || path.startsWith('/oral/')) return 'oral';
  if (path === '/query' || path.startsWith('/query/')) return 'query';
  return 'quiz';
}
