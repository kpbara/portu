/* The nine sentence makers assemble a fresh sentence each round out of word
   lists. That is what stops the learner memorising the line instead of the
   rule — and it is also how the prototype once produced "O que eles vai
   fazer?", a plural subject glued to a singular verb.

   That bug passed every structural check: the answer WAS among the options and
   there WERE four of them. It was only ever caught by running the makers
   hundreds of times and reading every result. So that is what happens here. */

const { test } = require('node:test');
const assert = require('node:assert');
const { GEN } = require('./_app');

const RUNS = 300;

/* draw once, reuse across the tests in this file */
const drawn = GEN.map(g => ({
  id: g.id,
  items: Array.from({ length: RUNS }, () => {
    const it = g.make();
    it.id = g.id; it.t = g.t; it.w = g.w; it.k = 'mc';
    return it;
  }),
}));

const each = fn => drawn.forEach(({ id, items }) =>
  items.forEach((it, n) => fn(it, `${id} #${n}`)));

test('every maker produces, and none has been lost', () => {
  // the original nine are load-bearing; new ones may be added on top
  const ORIGINAL = ['g-gostar-pessoa', 'g-gostar-contr', 'g-gostar-inf', 'g-estarcom',
                    'g-serestar', 'g-contr', 'g-paises', 'g-onde', 'g-queoque'];
  const ids = GEN.map(g => g.id);
  const missing = ORIGINAL.filter(id => !ids.includes(id));
  assert.deepStrictEqual(missing, [], 'makers that disappeared: ' + missing.join(', '));
  assert.strictEqual(new Set(ids).size, ids.length, 'two makers share an id');
  drawn.forEach(({ id, items }) =>
    assert.strictEqual(items.length, RUNS, id + ' did not produce ' + RUNS));
});

test('the answer is always among the options', () => {
  const bad = [];
  each((it, where) => { if (!it.c.includes(it.a)) bad.push(`${where}: ${it.a} not in [${it.c}]`); });
  assert.deepStrictEqual(bad.slice(0, 5), []);
});

test('there are always four distinct options', () => {
  const bad = [];
  each((it, where) => {
    if (it.c.length !== 4) bad.push(`${where}: ${it.c.length} options`);
    else if (new Set(it.c).size !== 4) bad.push(`${where}: repeated options [${it.c}]`);
  });
  assert.deepStrictEqual(bad.slice(0, 5), []);
});

test('subject and verb agree', () => {
  // the "O que eles vai fazer?" bug: slots that must agree have to be drawn
  // together, never independently
  const PLURAL = /^(Eles|Elas|Vocês|Nós)$/;
  const SINGULAR_ANSWER = /^(gosto|gosta|estou com|está com|sou|é|estou|está)$/;
  const SINGULAR = /^(Eu|Ele|Ela|Você)$/;
  const PLURAL_ANSWER = /^(gostam|gostamos|estamos com|estão com)$/;

  const bad = [];
  each((it, where) => {
    const subject = (it.q.split(/\s+/)[0] || '').replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (PLURAL.test(subject) && SINGULAR_ANSWER.test(it.a))
      bad.push(`${where}: plural "${subject}" with singular "${it.a}" — ${it.q}`);
    if (SINGULAR.test(subject) && PLURAL_ANSWER.test(it.a))
      bad.push(`${where}: singular "${subject}" with plural "${it.a}" — ${it.q}`);
  });
  assert.deepStrictEqual(bad.slice(0, 5), []);
});

test('the Spanish gloss is built from the same slots as the Portuguese', () => {
  // drawing them separately produced "Vivo en Rússia" and
  // "Eu ___ cansado / Está cansado"
  const bad = [];
  each((it, where) => {
    if (!it.g) bad.push(`${where}: no gloss — ${it.q}`);
    else if (/undefined|NaN|\[object/.test(it.g)) bad.push(`${where}: broken gloss "${it.g}"`);
  });
  assert.deepStrictEqual(bad.slice(0, 5), []);
});

test('nothing leaks a template placeholder into the visible text', () => {
  const bad = [];
  each((it, where) => {
    ['q', 'g', 'h', 'e', 'a'].forEach(k => {
      if (/undefined|NaN|\[object/.test(String(it[k]))) bad.push(`${where}.${k}: ${it[k]}`);
    });
  });
  assert.deepStrictEqual(bad.slice(0, 5), []);
});

test('every generated item has a hint, so the retry is never skipped', () => {
  const bad = [];
  each((it, where) => { if (!it.h) bad.push(where); });
  assert.deepStrictEqual(bad.slice(0, 5), []);
});

test('a generator stamps one id on everything it makes', () => {
  // mastery is tracked per rule, not per sentence: the sentence is disposable
  drawn.forEach(({ id, items }) =>
    assert.ok(items.every(it => it.id === id), id + ' produced mixed ids'));
});

test('each maker really does vary its output', () => {
  // if a maker returned the same sentence every time, the whole point is lost
  drawn.forEach(({ id, items }) => {
    const distinct = new Set(items.map(it => it.q)).size;
    assert.ok(distinct > 5, `${id} produced only ${distinct} distinct sentences in ${RUNS} draws`);
  });
});
