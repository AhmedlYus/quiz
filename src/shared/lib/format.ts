// Small formatting helpers used across features.

export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

// "Lecture 3: Complex Event Processing" -> { number: "3", name: "Complex Event Processing" }
export function splitLecture(topic: string): { number: string | null; name: string } {
  const m = topic.match(/^Lecture\s+(\d+)\s*:\s*/i);
  return m ? { number: m[1], name: topic.slice(m[0].length) } : { number: null, name: topic };
}

export const topicLabel = (topic: string | null | undefined) => topic || 'Other';

// Round scope used by the API: 'all' or 't:<topic>'.
export const scopeOf = (topic: string | null | undefined) => (topic == null ? 'all' : `t:${topic}`);

// Route with an optional lecture, e.g. withTopic('/play', 'Lecture 1: Intro') -> '/play/Lecture%201%3A%20Intro'.
export const withTopic = (route: string, topic: string | null | undefined) =>
  topic == null ? route : `${route}/${encodeURIComponent(topic)}`;

export function formatSeconds(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
