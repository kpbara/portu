/* Item ids are the addresses progress is filed under.
   They used to be computed from the array position, so inserting one question
   shifted every later id and silently re-pointed saved progress at a different
   sentence — mastery for something never seen, failure for something known.
   These tests make that impossible to ship. */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { B, HTML } = require('./_app');

const LOCK = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'content', 'ids.lock.json'), 'utf8'));

test('every item carries an id', () => {
  const missing = B.filter(it => !it.id).map((it, i) => `${it.t}#${i}`);
  assert.deepStrictEqual(missing, [], 'items without an id: ' + missing.join(', '));
});

test('ids are unique', () => {
  const seen = new Map();
  const dupes = [];
  B.forEach(it => {
    if (seen.has(it.id)) dupes.push(it.id);
    seen.set(it.id, true);
  });
  assert.deepStrictEqual(dupes, [], 'duplicate ids: ' + dupes.join(', '));
});

test('no id has been renamed or dropped since the lock was frozen', () => {
  const now = new Set(B.map(it => it.id));
  const gone = LOCK.ids.filter(id => !now.has(id));
  assert.deepStrictEqual(gone, [],
    'these ids vanished, so the progress filed under them is orphaned: ' + gone.join(', ') +
    '\nAdding ids is fine. Renaming or removing one is not.');
});

test('new ids are added to the lock file', () => {
  const locked = new Set(LOCK.ids);
  const unlocked = B.map(it => it.id).filter(id => !locked.has(id));
  assert.deepStrictEqual(unlocked, [],
    'these ids are not in content/ids.lock.json yet: ' + unlocked.join(', ') +
    '\nAppend them to the lock file so future runs can tell an addition from a rename.');
});

test('ids are not computed from the array position any more', () => {
  assert.ok(!/B\.forEach\(function\(it,\s*i\)\{\s*it\.id\s*=/.test(HTML),
    'index.html still assigns ids from the loop index — the bug this milestone fixes');
});

test('pack items are namespaced by their own id, not their position', () => {
  assert.ok(HTML.includes('c.id = "pk:"+(p.id||pi)+":"+(it.id||i)'),
    'pack items must be keyed on the id the author gave them');
});

test('generated items share one id per generator, so mastery is per rule', () => {
  // the sentence is disposable; the rule is the object of study
  assert.ok(HTML.includes('it.id = g.id;'),
    'each generator must stamp its own id on everything it produces');
});
