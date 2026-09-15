/* The app teaches in Spanish. The practice sentences are Portuguese and the
   buttons are Portuguese, but every hint, explanation and lesson passage is
   Spanish — that is the contrast the learner actually reasons in.

   English was never a pedagogical choice; it was a leftover from the prototype
   having been written in an English chat. This test is what stops it coming
   back one item at a time as new material is added. */

const { test } = require('node:test');
const assert = require('node:assert');
const { B, LESSONS, GEN } = require('./_app');

/* Deliberately narrow. Spanish and Portuguese share a great deal with English
   in this domain ("plural", "singular", "final", "natural"), so the list holds
   only words that would have to come from untranslated English prose. */
const ENGLISH = new RegExp('\\b(' + [
  'the', 'what', 'which', 'does', 'is', 'are', 'who', 'can', 'before', 'after',
  'noun', 'pronoun', 'verb', 'sounds?', 'takes?', 'goes', 'with', 'and', 'not',
  'only', 'here', 'this', 'that', 'your', 'you', 'for', 'from', 'when', 'where',
  'how', 'same', 'both', 'never', 'always', 'write', 'think', 'start', 'compare',
  'say', 'ends?', 'means?', 'subject', 'answer', 'question', 'gender', 'article',
  'infinitive', 'stress', 'vowel', 'word', 'sentence', 'stands', 'attaches?',
].join('|') + ')\\b', 'i');

/* "de + o = do" and friends are formulas, not prose */
const isFormula = s => /^[a-zà-ÿ]+\s*\+\s*[a-zà-ÿ]+\s*=/i.test(s.trim());

function scan(label, text, found) {
  if (!text) return;
  const m = String(text).match(ENGLISH);
  if (m && !isFormula(text)) found.push(`${label}: "${String(text).slice(0, 72)}"  <- "${m[0]}"`);
}

test('no English left in the static bank', () => {
  const found = [];
  B.forEach(it => {
    scan(it.id + '.h', it.h, found);
    scan(it.id + '.e', it.e, found);
    scan(it.id + '.g', it.g, found);
  });
  assert.deepStrictEqual(found.slice(0, 8), []);
});

test('no English left in the question prompts', () => {
  // 20 prompts were phrased as English instructions: "Write it in
  // Portuguese: ...", "In dia, the d sounds like:"
  const found = [];
  B.forEach(it => scan(it.id + '.q', it.q, found));
  assert.deepStrictEqual(found.slice(0, 8), []);
});

test('no English left in the lessons', () => {
  const found = [];
  LESSONS.forEach(L => ['hook', 'rule', 'trap'].forEach(k => scan(`${L.id}.${k}`, L[k], found)));
  assert.deepStrictEqual(found.slice(0, 8), []);
});

test('no English leaks out of the sentence makers', () => {
  // the templates are strings concatenated around slot values, so a missed one
  // only shows up in the output
  const found = [];
  GEN.forEach(g => {
    for (let n = 0; n < 300; n++) {
      const it = g.make();
      scan(`${g.id}#${n}.h`, it.h, found);
      scan(`${g.id}#${n}.e`, it.e, found);
      scan(`${g.id}#${n}.g`, it.g, found);
      if (found.length > 8) return;
    }
  });
  assert.deepStrictEqual(found.slice(0, 8), []);
});

test('hints are still questions rather than statements of the answer', () => {
  // a wrong answer is supposed to get a nudge that makes you work it out.
  // Flattening "¿qué artículo lleva música?" into "música es femenina" hands
  // over the answer, and it is the first thing lost translating in bulk.
  const asking = B.filter(it => /[¿?]/.test(it.h)).length;
  const share = asking / B.length;
  assert.ok(share > 0.9,
    `only ${asking}/${B.length} hints are phrased as questions (${Math.round(share * 100)}%)`);
});

test('the Spanish is Latin American, not peninsular', () => {
  // the class is in Managua; vosotros would read as foreign
  const found = [];
  const PENINSULAR = /\b(vosotros|vuestro|os gusta|habéis|tenéis|sois)\b/i;
  B.forEach(it => [it.h, it.e, it.g].forEach(t => {
    if (t && PENINSULAR.test(t)) found.push(`${it.id}: ${t.slice(0, 60)}`);
  }));
  LESSONS.forEach(L => ['hook', 'rule', 'trap'].forEach(k => {
    if (PENINSULAR.test(L[k] || '')) found.push(`${L.id}.${k}`);
  }));
  assert.deepStrictEqual(found, []);
});
