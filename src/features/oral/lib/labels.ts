// Display names for question types and ratings.
import type { QuerySettings } from '@/shared/api/types';
import type { Rating } from '../api';

export const RATINGS: Rating[] = ['missed', 'partial', 'solid'];

export const RATING_LABELS: Record<Rating, string> = {
  missed: 'Missed it',
  partial: 'Partly',
  solid: 'Solid',
};

const TYPE_LABELS: Record<string, string> = {
  explain: 'Explain',
  compare: 'Compare',
  walkthrough: 'Walk through',
  topic: 'Talk about a topic',
  query: 'Write a query',
};

/** "Write EPL" when the course names its query language, else "Write a query". */
export function typeLabel(type: string, query: QuerySettings | null): string {
  if (type === 'query' && query) return `Write ${query.language}`;
  return TYPE_LABELS[type] ?? type;
}
