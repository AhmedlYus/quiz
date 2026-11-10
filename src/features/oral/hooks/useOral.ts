// The course's oral settings, with defaults for courses that do not set any.
import type { OralSettings } from '@/shared/api/types';
import { useCourse } from '@/shared/session/SessionContext';
import { typeLabel } from '../lib/labels';

const DEFAULTS: OralSettings = {
  speechLang: 'en-US',
  timerSeconds: 180,
  examiner: '',
  exam: { questions: 3, note: '' },
  speech: { terms: [], fixes: [] },
  query: null,
};

export const useOral = (): OralSettings => useCourse().oral ?? DEFAULTS;

/** Label for a question type, e.g. "Write EPL". */
export function useTypeLabel() {
  const { query } = useOral();
  return (type: string) => typeLabel(type, query);
}
