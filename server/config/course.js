// Everything specific to one course lives in its own folder, courses/<name>/:
//   course.json   settings, lectures, oral options
//   questions/    quiz questions          oral/    oral questions          prompts/  GPT templates
//   query/        write-a-query questions
// The COURSE environment variable picks the folder; with only one folder it is picked automatically.
// Without a courses/ folder the old layout (course.json and questions/ at the root) still works.
// This module loads and checks course.json once; the front end gets the public parts through
// GET /api/config.
//
// Lectures are listed in order, even before they have questions. A lecture counts as "ready" once
// it has questions of its own; until then it shows as "Coming soon", with any sample questions
// (from samplesFile) playable. Question topics must match the lecture names exactly.
import fs from 'node:fs';
import path from 'node:path';

function courseDir() {
  const root = process.cwd();
  const all = path.join(root, 'courses');
  const names = fs.existsSync(all)
    ? fs.readdirSync(all).filter((n) => fs.existsSync(path.join(all, n, 'course.json'))).sort()
    : [];
  const wanted = process.env.COURSE?.trim();
  if (wanted) {
    if (!names.includes(wanted)) throw new Error(`COURSE="${wanted}" but courses/${wanted}/course.json does not exist (found: ${names.join(', ') || 'none'})`);
    return path.join(all, wanted);
  }
  if (names.length === 1) return path.join(all, names[0]);
  if (names.length > 1) throw new Error(`Several courses found (${names.join(', ')}); set COURSE to one of them`);
  return root;
}

export const COURSE_DIR = courseDir();
// Path inside the active course folder, e.g. coursePath('oral').
export const coursePath = (...parts) => path.join(COURSE_DIR, ...parts);
// Short folder name for messages, e.g. "courses/in5040/oral".
export const courseLabel = (...parts) => path.relative(process.cwd(), coursePath(...parts)) || '.';

const FILE = coursePath('course.json');

function load() {
  let c;
  try {
    c = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    throw new Error(`course.json could not be read: ${e.message}`);
  }
  const errors = [];
  for (const key of ['appName', 'code', 'name']) {
    if (typeof c[key] !== 'string' || !c[key].trim()) errors.push(`course.json: "${key}" must be a non-empty text`);
  }
  if (!Array.isArray(c.lectures) || !c.lectures.length || c.lectures.some((l) => typeof l !== 'string' || !l.trim())) {
    errors.push('course.json: "lectures" must be a list of lecture names');
  } else if (new Set(c.lectures).size !== c.lectures.length) {
    errors.push('course.json: lecture names must be unique');
  }
  const info = c.sourceInfo || {};
  for (const [kind, list] of [['books', info.books], ['documents', info.documents]]) {
    for (const [i, item] of (list || []).entries()) {
      for (const re of [item.match, item.also, item.unless].filter((x) => x !== undefined)) {
        try {
          new RegExp(re, 'i');
        } catch {
          errors.push(`course.json: sourceInfo.${kind}[${i}] has an invalid pattern "${re}"`);
        }
      }
    }
  }
  for (const key of ['modes', 'features']) {
    const v = c[key];
    if (v === undefined) continue;
    if (!v || typeof v !== 'object' || Object.values(v).some((x) => typeof x !== 'boolean')) {
      errors.push(`course.json: "${key}" must be an object of true/false switches`);
    }
  }
  if (c.modes && !c.modes.quiz && !c.modes.oral && !c.modes.query) errors.push('course.json: at least one of modes.quiz, modes.oral and modes.query must be on');
  if (c.modes?.query && !c.oral?.query) errors.push('course.json: modes.query needs oral.query (the query language)');
  if (c.oral !== undefined && (!c.oral || typeof c.oral !== 'object')) errors.push('course.json: "oral" must be an object');
  const patterns = [
    ...(c.oral?.speech?.fixes || []).map((f, i) => [
      `oral.speech.fixes[${i}] must be ["pattern", "replacement"] with a valid pattern`,
      Array.isArray(f) && f.length === 2 && typeof f[1] === 'string' ? f[0] : null,
    ]),
    ...(c.oral?.query?.views !== undefined ? [['oral.query.views must be a valid pattern', c.oral.query.views]] : []),
  ];
  for (const [message, re] of patterns) {
    try {
      if (typeof re !== 'string') throw new Error();
      new RegExp(re, 'gi');
    } catch {
      errors.push(`course.json: ${message}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return c;
}

export const COURSE = load();
export const LECTURES = COURSE.lectures;
// Questions from this file are samples (e.g. from the lecturer) and don't make a lecture "ready".
export const SAMPLES_FILE = COURSE.samplesFile || null;

// Missing switches keep the original behaviour: quiz on, oral and query practice off, leaderboard
// and hints on. Query practice is a round of only the write-a-query questions from query/, typed
// in the code editor; it works whether oral mode is on or not.
export const MODES = { quiz: true, oral: false, query: false, ...(COURSE.modes || {}) };
export const FEATURES = { leaderboard: true, hints: true, ...(COURSE.features || {}) };

const num = (v, def, min, max) => (Number.isFinite(v) && v >= min && v <= max ? v : def);
const text = (v, def = '') => (typeof v === 'string' && v.trim() ? v.trim() : def);
const texts = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max) : []);
const oral = COURSE.oral || {};
const exam = oral.exam || {};
const speech = oral.speech || {};
const query = oral.query && typeof oral.query === 'object' ? oral.query : null;
// Course-specific parts of oral mode. Without "query" the course has no write-a-query questions.
// The exam simulation has no time limits: the player answers at their own pace.
export const ORAL = {
  speechLang: typeof oral.speechLang === 'string' && oral.speechLang ? oral.speechLang : 'en-US',
  timerSeconds: num(oral.timerSeconds, 180, 0, 3600),
  examiner: typeof oral.examiner === 'string' && oral.examiner ? oral.examiner : `${COURSE.code} ${COURSE.name}`,
  exam: {
    questions: num(exam.questions, 3, 1, 10),
    note: text(exam.note),
  },
  speech: {
    terms: texts(speech.terms, 200),
    fixes: (Array.isArray(speech.fixes) ? speech.fixes : []).slice(0, 200),
  },
  query: query && {
    language: text(query.language, 'query'),
    title: text(query.title, `${text(query.language, 'Query')} practice`),
    label: text(query.label, `Your ${text(query.language, 'query')}`),
    placeholder: text(query.placeholder),
    grading: text(query.grading),
    keywords: texts(query.keywords, 500),
    operators: texts(query.operators, 50),
    views: text(query.views),
  },
};

// What the browser needs. Only public, non-secret course settings belong in course.json.
export function publicCourse() {
  const d = COURSE.directory || {};
  return {
    appName: COURSE.appName,
    code: COURSE.code,
    name: COURSE.name,
    tagline: COURSE.tagline || 'Multiple-choice practice for the exam',
    samplesOwner: typeof COURSE.samplesOwner === 'string' ? COURSE.samplesOwner : '',
    sourceInfo: COURSE.sourceInfo || {},
    directory: Boolean(d.enabled && d.url),
    modes: MODES,
    features: FEATURES,
    oral: MODES.oral || MODES.query ? ORAL : null,
  };
}
