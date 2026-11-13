// Loads and validates the oral question bank from oral/*.json (spoken questions) and query/*.json
// (write-a-query questions) in the active course folder. Kept apart from questions/ so a bad oral
// file can never break quiz mode. The rules mirror schemas/oral-question.schema.json and
// schemas/query-question.schema.json.
import fs from 'node:fs';
import path from 'node:path';
import { ORAL, coursePath } from '../config/course.js';

export const ORAL_TYPES = ['explain', 'compare', 'walkthrough', 'topic', 'query'];
// Each folder holds its own question types; in query/ the type may be left out.
const FOLDERS = [
  { folder: 'oral', types: ['explain', 'compare', 'walkthrough', 'topic'] },
  { folder: 'query', types: ['query'], defaultType: 'query' },
];
const FIELDS = new Set([
  'id', 'type', 'topic', 'prompt', 'code', 'hints', 'keyPoints', 'modelAnswer',
  'alternatives', 'followUps', 'seconds', 'source', 'coverage',
]);
let cache;

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const textList = (v, min, max) => Array.isArray(v) && v.length >= min && v.length <= max && v.every(isText);

export function validateOral(q, where, types = ORAL_TYPES) {
  if (!q || typeof q !== 'object' || Array.isArray(q)) return [`${where}: not an object`];
  const errors = [];
  for (const key of Object.keys(q)) if (!FIELDS.has(key)) errors.push(`${where}: unknown field "${key}"`);
  if (typeof q.id !== 'string' || !/^oral-[A-Za-z0-9._-]{1,75}$/.test(q.id)) {
    errors.push(`${where}: id must start with "oral-" followed by letters, digits, dots, dashes or underscores`);
  }
  if (q.type === 'query' && !types.includes('query')) errors.push(`${where}: query questions go in the query/ folder`);
  else if (!types.includes(q.type)) errors.push(`${where}: type must be ${types.length > 1 ? `one of ${types.join(', ')}` : `"${types[0]}"`}`);
  if (q.type === 'query' && !ORAL.query) errors.push(`${where}: type "query" needs oral.query (the query language) in course.json`);
  for (const field of ['topic', 'prompt', 'modelAnswer']) {
    if (!isText(q[field])) errors.push(`${where}: ${field} is missing`);
  }
  if (!textList(q.keyPoints, 2, 10)) errors.push(`${where}: keyPoints must be a list of 2-10 non-empty texts`);
  for (const field of ['hints', 'alternatives', 'followUps']) {
    if (q[field] !== undefined && !textList(q[field], 0, 5)) errors.push(`${where}: ${field} must be a list of up to 5 non-empty texts`);
  }
  for (const field of ['code', 'source']) {
    if (q[field] !== undefined && typeof q[field] !== 'string') errors.push(`${where}: ${field} must be text`);
  }
  if (q.seconds !== undefined && !(Number.isInteger(q.seconds) && q.seconds >= 30 && q.seconds <= 1800)) {
    errors.push(`${where}: seconds must be a whole number from 30 to 1800`);
  }
  if (q.coverage !== undefined && q.coverage !== 'slides' && q.coverage !== 'pensum') {
    errors.push(`${where}: coverage must be "slides" or "pensum"`);
  }
  return errors;
}

// Ids are unique across both folders.
export function loadOralBank(dir = coursePath()) {
  const list = [];
  const byId = new Map();
  const errors = [];
  for (const { folder, types, defaultType } of FOLDERS) {
    const folderDir = path.join(dir, folder);
    const files = fs.existsSync(folderDir) ? fs.readdirSync(folderDir).filter((f) => f.endsWith('.json')).sort() : [];
    for (const file of files) {
      let data;
      try {
        data = JSON.parse(fs.readFileSync(path.join(folderDir, file), 'utf8'));
      } catch (e) {
        errors.push(`${folder}/${file}: invalid JSON (${e.message})`);
        continue;
      }
      if (!Array.isArray(data)) {
        errors.push(`${folder}/${file}: must contain a JSON list of questions`);
        continue;
      }
      data.forEach((raw, i) => {
        const isObject = raw && typeof raw === 'object' && !Array.isArray(raw);
        const q = isObject && raw.type === undefined && defaultType ? { ...raw, type: defaultType } : raw;
        const where = `${folder}/${file} #${i + 1}${q && typeof q.id === 'string' ? ` (${q.id})` : ''}`;
        const problems = validateOral(q, where, types);
        if (problems.length) return errors.push(...problems);
        if (byId.has(q.id)) return errors.push(`${where}: duplicate id`);
        const trimList = (v) => (v || []).map((x) => x.trim());
        const clean = {
          id: q.id,
          type: q.type,
          topic: q.topic.trim(),
          prompt: q.prompt.trim(),
          code: (q.code || '').replace(/\s+$/, '').replace(/^\n+/, ''),
          hints: trimList(q.hints),
          keyPoints: trimList(q.keyPoints),
          modelAnswer: q.modelAnswer.trim(),
          alternatives: trimList(q.alternatives),
          followUps: trimList(q.followUps),
          seconds: q.seconds || null,
          source: (q.source || '').trim(),
          pensum: q.coverage === 'pensum',
          folder,
          file,
        };
        byId.set(clean.id, clean);
        list.push(clean);
      });
    }
  }
  return { list, byId, errors };
}

// Cached bank for the running server. Invalid questions are skipped (the build check fails on them).
export function oralBank() {
  if (!cache) {
    cache = loadOralBank();
    if (cache.errors.length) console.error(`Oral question bank problems:\n${cache.errors.join('\n')}`);
  }
  return cache;
}
