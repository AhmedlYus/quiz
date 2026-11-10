// Small pure helpers shared across the server.

export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Natural order for lecture names (Lecture 2 before Lecture 10).
export const byTopicName = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
