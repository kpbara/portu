/* Structure of the question bank, and the answer checking.
   Most of these guard decisions that were made deliberately and would be easy
   to undo by accident while adding material. */

const { test } = require('node:test');
const assert = require('node:assert');
const { B, LESSONS, TOPICS, WEAK, GEN, answers, validate, lessons } = require('./_app');
const { matches, lessonsFor } = lessons;

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
  const empty = LESSONS.filter(L => !B.some(x => matches(L, x))).map(L => L.id);
  assert.deepStrictEqual(empty, [], 'lessons that would drill nothing: ' + empty.join(', '));
});

/* ---------------- which lesson an item offers ---------------- */

// A wrong answer offers one lesson — lessonsFor(it)[0] — on the retry card and
// again in the round summary. These pin that it is the lesson the item is
// actually about. It was not: "Chegamos ___ duas horas" offered "Gostar precisa
// de", because that lesson's pick listed the contr tag and was declared first.

test('the lesson an item offers never belongs to another assunto', () => {
  const bad = B.concat(GEN)
    .map(x => [x, lessonsFor(x)[0]])
    .filter(([x, L]) => L && L.pick.topic && L.pick.topic !== x.t)
    .map(([x, L]) => x.id + ' → ' + L.id + ' (teaches ' + L.pick.topic + ', item is ' + x.t + ')');
  assert.deepStrictEqual(bad, [], 'off-topic lesson offered: ' + bad.join('; '));
});

test('a crase item is sent to the contraction lesson, not to gostar', () => {
  const crase = B.find(x => x.id === 'artigos-65');
  assert.ok(crase, 'artigos-65 has gone from the bank');
  assert.strictEqual(lessonsFor(crase)[0].id, 'contr');
});

test('a pick that names a topic as well as tags stays inside that topic', () => {
  // the tags narrow the assunto, they do not reach outside it
  const scoped = LESSONS.filter(L => L.pick.topic && (L.pick.tag || L.pick.tags));
  const strays = scoped.flatMap(L =>
    B.concat(GEN).filter(x => matches(L, x) && x.t !== L.pick.topic)
      .map(x => L.id + ' claims ' + x.id));
  assert.deepStrictEqual(strays, [], 'lesson reaching outside its topic: ' + strays.join('; '));
});

test('the lessons an item matches come back best fit first', () => {
  // A tag is the item's own note about which slip it trips, so it beats merely
  // sharing an assunto, and a lesson that matches on both beats either. Without
  // this ordering the offer falls back to whichever lesson was declared first,
  // which is how the crase item ended up with the gostar lesson.
  const bad = B.concat(GEN)
    .map(x => [x, lessonsFor(x).map(L => lessons.fit(L, x))])
    .filter(([, fits]) => fits.some((f, i) => i > 0 && f > fits[i - 1]))
    .map(([x, fits]) => x.id + ' [' + fits.join(',') + ']');
  assert.deepStrictEqual(bad, [], 'lessons offered out of fit order: ' + bad.join('; '));
});

test('a gostar sentence needing de is sent to the gostar lesson', () => {
  // the other side of the same coin: contr also matches here, but gostar-de
  // sits on both the assunto and the tag, so it is the squarer fit
  assert.strictEqual(lessonsFor(B.find(x => x.id === 'gostar-33'))[0].id, 'gostar-de');
});

test('the scale item has a lesson of its own to offer', () => {
  // gostar-36 carries no tag of its own until the escala one, so every other
  // lesson misses it. It used to be handed "Gostar precisa de", which says
  // nothing about adoro or demais.
  assert.strictEqual(lessonsFor(B.find(x => x.id === 'gostar-36'))[0].id, 'escala');
});

test('no gostar item falls through without a lesson', () => {
  // gostar is one of the five assuntos with no lesson of its own, so nothing
  // catches an item there by topic alone: add one without a tag and its
  // wrong-answer card offers no way back to a rule. Every other assunto has a
  // topic lesson underneath to land on.
  const loose = B.filter(x => x.t === 'gostar' && !lessonsFor(x).length).map(x => x.id);
  assert.deepStrictEqual(loose, [],
    'gostar items matching no lesson: ' + loose.join(', ') + ' (give each one a tag)');
});

test('the scale lesson drills the scale, not the whole assunto', () => {
  const escala = LESSONS.find(L => L.id === 'escala');
  const pool = B.concat(GEN).filter(x => matches(escala, x));
  const strays = pool.filter(x => !(x.w || []).includes('escala')).map(x => x.id);
  assert.deepStrictEqual(strays, [], 'in the drill but not about the scale: ' + strays.join(', '));
  assert.ok(pool.length >= 6,
    `the drill button offers 6 items and the pool holds ${pool.length}`);
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

test('every category has its own colour', () => {
  // same trap as the topics above, one level up
  const { HTML } = require('./_app');
  const block = HTML.slice(HTML.indexOf('var CATS'), HTML.indexOf('function catList'));
  const ids = [...block.matchAll(/\{id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  const missing = ids.filter(id => !HTML.includes('.c-' + id + ' ') &&
                                   !HTML.includes('.c-' + id + '{'));
  assert.deepStrictEqual(missing, [],
    'no --hue defined for: ' + missing.join(', ') + ' (add a .c-<id> rule)');
});

test('no colour is written down outside the palette block', () => {
  // the whole point of that block is that there is one place to change a
  // colour. A hex anywhere else is a second copy, and a second copy drifts:
  // the HUES list did exactly that, silently, for five topics.
  const { HTML } = require('./_app');
  const rest = HTML.slice(HTML.indexOf('</style>'));
  const loose = rest.match(/#[0-9A-Fa-f]{6}\b|\brgba?\([\d.,\s]+\)/g) || [];
  assert.deepStrictEqual(loose, [],
    'colour outside the palette block: ' + loose.join(', ') +
    ' (give it a name in :root and use var())');
});

test('the copies CSS cannot reach still agree with --ground', () => {
  // a <meta> attribute and a JSON manifest cannot read a custom property, so
  // these three are copies by necessity rather than by choice. This is the
  // only thing stopping them drifting apart.
  const fs = require('fs');
  const path = require('path');
  const { HTML } = require('./_app');

  const hex = s => (s || '').toUpperCase();
  const ground = hex((HTML.match(/--ground:\s*(#[0-9A-Fa-f]{6})/) || [])[1]);
  assert.ok(ground, '--ground not found in the palette block');

  const meta = hex((HTML.match(/name="theme-color"\s+content="(#[0-9A-Fa-f]{6})"/) || [])[1]);
  const mf = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.webmanifest'), 'utf8'));

  assert.strictEqual(meta, ground, 'the theme-color meta has drifted from --ground');
  assert.strictEqual(hex(mf.theme_color), ground, 'manifest theme_color has drifted from --ground');
  assert.strictEqual(hex(mf.background_color), ground, 'manifest background_color has drifted from --ground');
});
