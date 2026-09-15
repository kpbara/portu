/* Structure of the question bank, and the answer checking.
   Most of these guard decisions that were made deliberately and would be easy
   to undo by accident while adding material. */

const { test } = require('node:test');
const assert = require('node:assert');
const { B, LESSONS, TOPICS, WEAK, answers, validate } = require('./_app');

const id = it => it.id || it.t;

test('every item has a hint', () => {
  // an item with no hint used to skip the retry silently: the learner went
  // straight to the answer with no sign they had been shortchanged
  const bad = B.filter(it => !it.h).map(id);
  assert.deepStrictEqual(bad, [], 'items with no hint: ' + bad.join(', '));
});

test('every item has an explanation', () => {
  const bad = B.filter(it => !it.e).map(id);
  assert.deepStrictEqual(bad, [], 'items with no explanation: ' + bad.join(', '));
});

test('multiple-choice answers are among their options', () => {
  const bad = B.filter(it => it.k === 'mc' && !it.c.includes(it.a)).map(id);
  assert.deepStrictEqual(bad, [], 'answer missing from its own options: ' + bad.join(', '));
});

test('multiple-choice options are all distinct', () => {
  const bad = B.filter(it => it.k === 'mc' && new Set(it.c).size !== it.c.length).map(id);
  assert.deepStrictEqual(bad, [], 'repeated options: ' + bad.join(', '));
});

test('every item belongs to a known topic', () => {
  const known = new Set(TOPICS.map(t => t.id));
  const bad = B.filter(it => !known.has(it.t)).map(id);
  assert.deepStrictEqual(bad, [], 'unknown topic: ' + bad.join(', '));
});

test('weak tags are drawn from the ones actually observed on paper', () => {
  const known = new Set(WEAK);
  const bad = B.flatMap(it => (it.w || []).filter(w => !known.has(w)));
  assert.deepStrictEqual([...new Set(bad)], [], 'unknown weak tag: ' + bad.join(', '));
});

test('every lesson can find items to drill', () => {
  const matches = (L, x) =>
    (L.pick.topic && x.t === L.pick.topic) ||
    (L.pick.tag && (x.w || []).includes(L.pick.tag)) ||
    (L.pick.tags && (x.w || []).some(t => L.pick.tags.includes(t)));
  const empty = LESSONS.filter(L => !B.some(x => matches(L, x))).map(L => L.id);
  assert.deepStrictEqual(empty, [], 'lessons that would drill nothing: ' + empty.join(', '));
});

test('a Portuguese sentence to complete always shows its Spanish', () => {
  // The blank is the test: if there is a sentence to fill in, the learner gets
  // the Spanish beside it, because translation anchoring is the study method.
  // Prompts with no blank are metalinguistic ("Más fuerte que gosto muito:")
  // and are either already in Spanish or would give away their own answer if
  // glossed — estarcom-45 asks what "dor de cotovelo" means.
  const bad = B.filter(it => it.q.includes('___') && !it.g).map(id);
  assert.deepStrictEqual(bad, [], 'fill-in sentence with no Spanish gloss: ' + bad.join(', '));
});

/* ---------------- typed answers ---------------- */

const ITEM = { k: 'w', a: 'eu não gosto de dançar', alt: ['não gosto de dançar'] };

test('a typed answer is accepted when it is exactly right', () => {
  assert.ok(answers.correct(ITEM, 'eu não gosto de dançar'));
  assert.ok(answers.correct(ITEM, 'não gosto de dançar'), 'listed variants count');
});

test('capitals, final punctuation and spacing are not what is being tested', () => {
  assert.ok(answers.correct(ITEM, 'Eu não gosto de dançar'));
  assert.ok(answers.correct(ITEM, 'eu não gosto de dançar.'));
  assert.ok(answers.correct(ITEM, '  eu  não gosto de dançar '));
});

test('accents are no longer waved through', () => {
  // the course is graded on paper, so a missing cedilha is a mistake
  assert.ok(!answers.correct(ITEM, 'eu nao gosto de dancar'));
  assert.ok(!answers.correct(ITEM, 'eu não gosto de dancar'));
});

test('a near miss names the mark that is missing', () => {
  assert.deepStrictEqual(answers.accentMiss(ITEM, 'eu não gosto de dancar'),
    { mark: 'la cedilla (ç)', word: 'dançar' });
  assert.deepStrictEqual(answers.accentMiss(ITEM, 'eu nao gosto de dançar'),
    { mark: 'la virgulilla (~)', word: 'não' });
});

test('a genuinely wrong answer is not dressed up as an accent slip', () => {
  assert.strictEqual(answers.accentMiss(ITEM, 'eu não gosto de cantar'), null);
  assert.strictEqual(answers.accentMiss(ITEM, ''), null);
  assert.strictEqual(answers.accentMiss(ITEM, 'eu não gosto de dançar'), null,
    'a right answer has nothing to correct');
});

test('the stored answers are themselves correctly accented', () => {
  // they were once saved stripped, because the comparison stripped too — with
  // exact matching that would make the app demand the wrong spelling
  const stripped = B.filter(it => it.k === 'w')
    .filter(it => [it.a].concat(it.alt || []).some(a => a !== a.normalize('NFC') ||
      /\b(pao|dancar|nao|portugues|voce)\b/.test(a)))
    .map(id);
  assert.deepStrictEqual(stripped, [],
    'these answers look accent-stripped, so the app would demand a misspelling: ' + stripped.join(', '));
});

/* ---------------- packs ---------------- */

const pack = items => ({ name: 'test', items });
const ok = { id: 'x-1', t: 'gostar', k: 'mc', q: 'a ___ b', a: 'do', c: ['do', 'da', 'dos', 'das'], h: '¿?' };

test('a well-formed pack is accepted', () => {
  assert.strictEqual(validate(pack([ok])), null);
});

test('a pack item without a permanent id is refused', () => {
  const { id: _drop, ...noId } = ok;
  assert.match(validate(pack([noId])) || '', /id/);
});

test('a pack with two items sharing an id is refused', () => {
  assert.match(validate(pack([ok, { ...ok }])) || '', /repetido/);
});

test('a pack item without a hint is refused', () => {
  const { h: _drop, ...noHint } = ok;
  assert.match(validate(pack([noHint])) || '', /dica/);
});

test('a pack whose answer is not among its options is refused', () => {
  assert.match(validate(pack([{ ...ok, a: 'pelo' }])) || '', /resposta/);
});

test('a pack with repeated options is refused', () => {
  assert.match(validate(pack([{ ...ok, c: ['do', 'do', 'dos', 'das'] }])) || '', /repetidas/);
});

test('every topic has its own colour', () => {
  // topics fall back to grey when no .t-<id> rule exists, which reads as
  // unfinished beside the rest — and it happens silently
  const { HTML } = require('./_app');
  const missing = TOPICS.filter(t => !HTML.includes('.t-' + t.id + ' ') &&
                                     !HTML.includes('.t-' + t.id + '{'))
    .map(t => t.id);
  assert.deepStrictEqual(missing, [],
    'no --hue defined for: ' + missing.join(', ') + ' (add a .t-<id> rule)');
});

test('a topic id is safe to drop into a class attribute', () => {
  const bad = TOPICS.filter(t => !/^[a-z][a-z0-9-]{0,31}$/.test(t.id)).map(t => t.id);
  assert.deepStrictEqual(bad, [], 'unsafe topic ids: ' + bad.join(', '));
});
