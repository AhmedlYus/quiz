// Validates questions/*.json of the active course (see server/config/course.js). Runs as the Vercel build, so a broken file blocks the deploy
// and the previous version stays live.
import { loadBank } from '../server/quiz/bank.js';
import { LECTURES, courseLabel } from '../server/config/course.js';

console.log(`Course: ${courseLabel()}`);
const { list, errors } = loadBank();
const known = new Set(LECTURES);
for (const q of list) {
  if (!known.has(q.topic)) errors.push(`${q.file} (${q.id}): topic "${q.topic}" is not one of the lectures in course.json`);
}
if (errors.length) {
  console.error(`Question bank has ${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
const topics = new Map();
for (const q of list) topics.set(q.topic || '(no topic)', (topics.get(q.topic || '(no topic)') || 0) + 1);
console.log(`Question bank OK: ${list.length} questions.`);
for (const [topic, n] of [...topics].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${topic}`);
