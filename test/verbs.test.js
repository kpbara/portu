/* The Verbos tab is a reference table that doubles as a question bank, which
   makes it the one place in the app where a typo is not a typo: a wrong form
   in VERBS is taught on the verb screen, marked right in the drill, and then
   filed as mastered. So the forms are pinned here by hand, and the rest of
   these tests hold the shape of the data that the screens render with no
   fallback of any kind. */

const { test } = require('node:test');
const assert = require('node:assert');
const { HTML, LESSONS, TOPICS, verbs } = require('./_app');
const { PENINSULAR, scan } = require('./_language');

const { VERBS, VGRUPOS, VTEMPOS, VBOX, VEND } = verbs;
const GROUPS = VGRUPOS.map(g => g.id);
const TENSES = VTEMPOS.map(t => t.id);
const byGroup = gr => VERBS.filter(v => v.gr === gr);

/* ---------------- the verbs themselves ---------------- */

test('every verb is named, glossed, classed, grouped and given a complement', () => {
  // the verb screen renders all five without checking, same as the lessons do
  const bad = VERBS.filter(v =>
    !v.v || !v.es || !v.c || GROUPS.indexOf(v.gr) < 0 || !VEND[v.cl]).map(v => v.v || '(unnamed)');
  assert.deepStrictEqual(bad, []);
});

test('no verb is listed twice', () => {
  const seen = new Set(), dupes = [];
  VERBS.forEach(v => { if (seen.has(v.v)) dupes.push(v.v); seen.add(v.v); });
  assert.deepStrictEqual(dupes, []);
});

test('the class a verb claims is the one its ending gives', () => {
  // cl is what picks the endings, so a verb filed under the wrong one is
  // conjugated wrongly everywhere at once. pôr is -or with a circumflex.
  const bad = VERBS.filter(v => {
    const end = v.v.slice(-2).replace('ô', 'o');
    return end !== v.cl;
  }).map(v => `${v.v} is filed as -${v.cl}`);
  assert.deepStrictEqual(bad, []);
});

test('all three groups have verbs in them', () => {
  const empty = GROUPS.filter(g => !byGroup(g).length);
  assert.deepStrictEqual(empty, [], 'a group with no verbs is a dead card on the tab');
});

test('every group has its own colour', () => {
  // the same trap as the topics and the categories: a missing .vg- rule goes
  // grey beside the rest, and it happens silently
  const missing = GROUPS.filter(id => !HTML.includes('.vg-' + id + ' ') &&
                                      !HTML.includes('.vg-' + id + '{'));
  assert.deepStrictEqual(missing, [], 'no --hue defined for: ' + missing.join(', '));
});

test('a group id is safe to drop into a class attribute', () => {
  const bad = GROUPS.filter(id => !/^[a-z][a-z0-9-]{0,31}$/.test(id));
  assert.deepStrictEqual(bad, []);
});

/* ---------------- what a group promises ---------------- */

test('a regular verb overrides nothing at all', () => {
  // that is the whole claim the group makes: the endings and nothing else
  const bad = byGroup('reg')
    .filter(v => v.pres || v.pret || v.fut || v.gx || v.nocont)
    .map(v => v.v);
  assert.deepStrictEqual(bad, [],
    'these are filed as regular but carry an exception: ' + bad.join(', '));
});

test('every semirregular and irregular verb says what it does and why', () => {
  // membership has to be visible in the data, not just asserted by the group
  const bad = VERBS.filter(v => v.gr !== 'reg' && !(v.pres || v.pret || v.fut))
    .map(v => v.v);
  const mute = VERBS.filter(v => v.gr !== 'reg' && !v.n).map(v => v.v);
  assert.deepStrictEqual(bad, [], 'no irregular form: ' + bad.join(', '));
  assert.deepStrictEqual(mute, [], 'no note to explain it: ' + mute.join(', '));
});

test('no override writes down what the rule already gives', () => {
  // an override that matches the rule is a verb pretending to be an
  // exception, and it takes the group listings down with it
  const rule = (v, t) => VEND[v.cl][t].map(e => v.v.slice(0, -2) + e).join('|');
  const bad = [];
  VERBS.forEach(v => {
    ['pres', 'pret'].forEach(t => {
      if (v[t] && v[t].join('|') === rule(v, t)) bad.push(`${v.v}.${t}`);
    });
    if (v.fut && v.fut.join('|') === ['vou', 'vai', 'vamos', 'vão'].map(i => i + ' ' + v.v).join('|')) {
      bad.push(`${v.v}.fut`);
    }
  });
  assert.deepStrictEqual(bad, []);
});

test('the gerúndio needs no override from anybody', () => {
  // stem + -ndo holds for all of them, pôr and ir included, and the comment
  // above VERBS says so. A ger field would mean that claim had broken.
  const bad = VERBS.filter(v => v.ger).map(v => v.v);
  assert.deepStrictEqual(bad, [], 'wrote its gerúndio down: ' + bad.join(', '));
  assert.strictEqual(verbs.vger(verbs.verbById('pôr')), 'pondo');
  assert.strictEqual(verbs.vger(verbs.verbById('ir')), 'indo');
  assert.strictEqual(verbs.vger(verbs.verbById('comer')), 'comendo', 'not comiendo');
  assert.strictEqual(verbs.vger(verbs.verbById('partir')), 'partindo');
  assert.strictEqual(verbs.vger(verbs.verbById('dormir')), 'dormindo', 'not durmindo');
});

test('the irregulares are the ones the class dictated, no more and no less', () => {
  // the two irregular lessons list them by their Spanish infinitive, which is
  // the only list of record there is. If a verb is added to this tab as
  // irregular without appearing in a lesson, the tab has outrun the course.
  const dictated = new Set();
  LESSONS.filter(L => L.id === 'presente-irregulares' || L.id === 'preterito-irregulares')
    .forEach(L => L.pairs.forEach(p => p[0].split(' y ').forEach(x => dictated.add(x.trim()))));
  const listed = new Set(byGroup('irreg').map(v => v.es));
  assert.deepStrictEqual([...dictated].filter(x => !listed.has(x)), [],
    'dictated in a lesson but missing from the irregulares');
  assert.deepStrictEqual([...listed].filter(x => !dictated.has(x)), [],
    'filed as irregular but never dictated');
});

/* ---------------- the forms, pinned by hand ---------------- */

const EXPECTED = {
  ser:      { pres: 'sou/é/somos/são',               pret: 'fui/foi/fomos/foram' },
  estar:    { pres: 'estou/está/estamos/estão',      pret: 'estive/esteve/estivemos/estiveram' },
  ter:      { pres: 'tenho/tem/temos/têm',           pret: 'tive/teve/tivemos/tiveram' },
  ir:       { pres: 'vou/vai/vamos/vão',             pret: 'fui/foi/fomos/foram' },
  ver:      { pres: 'vejo/vê/vemos/veem',            pret: 'vi/viu/vimos/viram' },
  vir:      { pres: 'venho/vem/vimos/vêm',           pret: 'vim/veio/viemos/vieram' },
  'pôr':    { pres: 'ponho/põe/pomos/põem',          pret: 'pus/pôs/pusemos/puseram' },
  dizer:    { pres: 'digo/diz/dizemos/dizem',        pret: 'disse/disse/dissemos/disseram' },
  fazer:    { pres: 'faço/faz/fazemos/fazem',        pret: 'fiz/fez/fizemos/fizeram' },
  trazer:   { pres: 'trago/traz/trazemos/trazem',    pret: 'trouxe/trouxe/trouxemos/trouxeram' },
  poder:    { pres: 'posso/pode/podemos/podem',      pret: 'pude/pôde/pudemos/puderam' },
  querer:   { pres: 'quero/quer/queremos/querem',    pret: 'quis/quis/quisemos/quiseram' },
  saber:    { pres: 'sei/sabe/sabemos/sabem',        pret: 'soube/soube/soubemos/souberam' },
  dar:      { pres: 'dou/dá/damos/dão',              pret: 'dei/deu/demos/deram' },
  dormir:   { pres: 'durmo/dorme/dormimos/dormem',   pret: 'dormi/dormiu/dormimos/dormiram' },
  pedir:    { pres: 'peço/pede/pedimos/pedem',       pret: 'pedi/pediu/pedimos/pediram' },
  subir:    { pres: 'subo/sobe/subimos/sobem',       pret: 'subi/subiu/subimos/subiram' },
  sair:     { pres: 'saio/sai/saímos/saem',          pret: 'saí/saiu/saímos/saíram' },
  'almoçar':{ pres: 'almoço/almoça/almoçamos/almoçam', pret: 'almocei/almoçou/almoçamos/almoçaram' },
  chegar:   { pres: 'chego/chega/chegamos/chegam',   pret: 'cheguei/chegou/chegamos/chegaram' },
  conhecer: { pres: 'conheço/conhece/conhecemos/conhecem', pret: 'conheci/conheceu/conhecemos/conheceram' },
  falar:    { pres: 'falo/fala/falamos/falam',       pret: 'falei/falou/falamos/falaram' },
  comer:    { pres: 'como/come/comemos/comem',       pret: 'comi/comeu/comemos/comeram' },
  abrir:    { pres: 'abro/abre/abrimos/abrem',       pret: 'abri/abriu/abrimos/abriram' },
};

test('the forms the table shows are the forms the class taught', () => {
  Object.keys(EXPECTED).forEach(name => {
    const v = verbs.verbById(name);
    assert.ok(v, name + ' is no longer in VERBS');
    ['pres', 'pret'].forEach(t => {
      assert.strictEqual(verbs.vformas(v, t).join('/'), EXPECTED[name][t], `${name} ${t}`);
    });
  });
});

test('the contínuo is estar plus one unchanging gerúndio', () => {
  assert.deepStrictEqual(verbs.vformas(verbs.verbById('comer'), 'cont'),
    ['estou comendo', 'está comendo', 'estamos comendo', 'estão comendo']);
  assert.deepStrictEqual(verbs.vformas(verbs.verbById('ir'), 'cont'),
    ['estou indo', 'está indo', 'estamos indo', 'estão indo']);
});

test('the futuro imediato is ir plus the bare infinitive', () => {
  assert.deepStrictEqual(verbs.vformas(verbs.verbById('falar'), 'fut'),
    ['vou falar', 'vai falar', 'vamos falar', 'vão falar']);
  // and ir is its own: eu vou ao mercado, never eu vou ir
  assert.deepStrictEqual(verbs.vformas(verbs.verbById('ir'), 'fut'),
    ['vou', 'vai', 'vamos', 'vão']);
});

test('every tense of every verb has four forms, or says it has none', () => {
  const bad = [];
  VERBS.forEach(v => TENSES.forEach(t => {
    const f = verbs.vformas(v, t);
    if (f === null) {
      if (t !== 'cont') bad.push(`${v.v}.${t} is missing`);
      return;
    }
    if (f.length !== 4) bad.push(`${v.v}.${t} has ${f.length}`);
    f.forEach((x, i) => { if (!x || !x.trim()) bad.push(`${v.v}.${t}[${i}] is empty`); });
    const words = t === 'pres' || t === 'pret' || v[t] ? 1 : 2;
    f.forEach(x => {
      if (x.split(' ').length !== words) bad.push(`${v.v}.${t}: "${x}" is not ${words} word(s)`);
    });
  }));
  assert.deepStrictEqual(bad, []);
});

test('only a verb that says nocont has no contínuo, and the table says so', () => {
  const quiet = VERBS.filter(v => verbs.vformas(v, 'cont') === null).map(v => v.v);
  assert.deepStrictEqual(quiet, VERBS.filter(v => v.nocont).map(v => v.v));
  quiet.forEach(name => {
    const r = verbs.vregra(verbs.verbById(name), 'cont');
    assert.match(r, /contínuo/, name + ' leaves the contínuo card blank');
  });
});

test('every tense points at the assunto that teaches it', () => {
  // the question card takes its name and its colour from that assunto, and
  // the lição offered after a miss is found the same way
  const ids = TOPICS.map(t => t.id);
  const bad = VTEMPOS.filter(T => ids.indexOf(T.topic) < 0).map(T => T.id + ' -> ' + T.topic);
  assert.deepStrictEqual(bad, []);
});

/* ---------------- the drill ---------------- */

const ALL = verbs.vitems({});

test('the drill reaches every verb and every tense it has', () => {
  let n = 0;
  verbs.veach({}, () => n++);
  assert.strictEqual(ALL.length, n);
  const seen = new Set(ALL.map(it => it.id.split(':')[1]));
  assert.strictEqual(seen.size, VERBS.length, 'a verb with no questions');
  TENSES.forEach(t => {
    assert.ok(ALL.some(it => it.id.split(':')[2] === t), t + ' is never asked');
  });
});

test('every question is answerable', () => {
  const bad = [];
  ALL.forEach(it => {
    if (it.c.length !== 4) bad.push(`${it.id}: ${it.c.length} options`);
    if (new Set(it.c).size !== it.c.length) bad.push(`${it.id}: repeated option`);
    if (it.c.indexOf(it.a) < 0) bad.push(`${it.id}: answer is not an option`);
    if (!it.q.includes('___')) bad.push(`${it.id}: no blank`);
    if (!it.h || !it.h.includes('¿')) bad.push(`${it.id}: hint is not a question`);
    if (!it.e) bad.push(`${it.id}: no explanation`);
    if (it.k !== 'mc') bad.push(`${it.id}: not multiple choice`);
  });
  assert.deepStrictEqual(bad.slice(0, 8), []);
});

test('the answer is the form the verb screen shows, in the box it shows it in', () => {
  // the table and the drill read one source, and this is what keeps it so:
  // a drill that marks a form right while the table prints another is worse
  // than either of them being wrong on its own
  const bad = [];
  verbs.veach({}, (v, T, b, f) => {
    const it = verbs.vitem(v, T, b, f);
    if (it.a !== verbs.vformas(v, T.id)[b]) bad.push(it.id);
  });
  assert.deepStrictEqual(bad, []);
});

test('the wrong options are the slips the lessons name, not invented words', () => {
  const ESTARP = ['estou', 'está', 'estamos', 'estão'];
  const IRP = ['vou', 'vai', 'vamos', 'vão'];
  const bad = [];
  verbs.veach({}, (v, T, b, f) => {
    const it = verbs.vitem(v, T, b, f);
    if (T.id === 'pres' || T.id === 'pret') {
      // every option is one of this verb's own forms in one of the two tenses
      const own = verbs.vformas(v, 'pres').concat(verbs.vformas(v, 'pret'));
      it.c.forEach(c => { if (own.indexOf(c) < 0) bad.push(`${it.id}: "${c}" is not a form of ${v.v}`); });
    }
    if (T.id === 'cont') {
      it.c.forEach(c => {
        if (ESTARP.indexOf(c.split(' ')[0]) < 0) bad.push(`${it.id}: "${c}" does not start with estar`);
      });
      // the Spanish-interference gerúndio is on the card, and it is wrong
      const x = ESTARP[b] + ' ' + verbs.vgerx(v);
      assert.notStrictEqual(verbs.vgerx(v), verbs.vger(v), v.v + ': the wrong gerúndio is the right one');
      if (it.c.indexOf(x) < 0) bad.push(`${it.id}: ${x} is not offered`);
    }
    if (T.id === 'fut') {
      // the a that a Spanish speaker adds, which is the whole trap
      if (it.c.indexOf(IRP[b] + ' a ' + v.v) < 0) bad.push(`${it.id}: the spurious a is not offered`);
    }
  });
  assert.deepStrictEqual(bad.slice(0, 8), []);
});

test('an id is a verb, a tense and a box — so progress is filed per form', () => {
  const seen = new Map();
  ALL.forEach(it => {
    assert.match(it.id, /^vb:.+:(pres|pret|cont|fut):[0-3]$/, it.id);
    assert.ok(!seen.has(it.id), 'two questions share ' + it.id);
    seen.set(it.id, it);
  });
  // and it does not move when the sentence does
  const v = verbs.verbById('falar'), T = { id: 'pres', topic: 'presente' };
  const f = verbs.vformas(v, 'pres');
  for (let n = 0; n < 20; n++) {
    assert.strictEqual(verbs.vitem(v, T, 1, f).id, 'vb:falar:pres:1');
  }
});

test('which pronoun asks is drawn fresh, but never changes the answer', () => {
  // Você, Ele and Ela share a box; which of them asks is not the lesson
  const v = verbs.verbById('comer'), T = { id: 'pres', topic: 'presente' };
  const f = verbs.vformas(v, 'pres');
  const asked = new Set();
  for (let n = 0; n < 200; n++) {
    const it = verbs.vitem(v, T, 1, f);
    asked.add(it.q.split(' ')[0]);
    assert.strictEqual(it.a, 'come');
  }
  assert.deepStrictEqual([...asked].sort(), ['Ela', 'Ele', 'Você']);
});

test('a scope narrows the drill to exactly what the screen was showing', () => {
  assert.deepStrictEqual(verbs.vscope('g:irreg'), { gr: 'irreg' });
  assert.deepStrictEqual(verbs.vscope('v:pôr'), { v: 'pôr' });
  assert.deepStrictEqual(verbs.vscope('pret'), { t: 'pret' });
  assert.deepStrictEqual(verbs.vscope('todos'), {});
  assert.deepStrictEqual(verbs.vscope('nonsense'), {}, 'an unknown scope asks everything');
  assert.deepStrictEqual(verbs.vscope(null), {});

  assert.ok(verbs.vitems({ gr: 'reg' }).every(it => it.id.split(':')[1] !== 'ser'));
  assert.ok(verbs.vitems({ t: 'pret' }).every(it => it.t === 'preterito'));
  const one = verbs.vitems({ v: 'dizer' });
  assert.strictEqual(one.length, 16, 'dizer has four tenses of four boxes');
  assert.ok(one.every(it => it.id.indexOf('vb:dizer:') === 0));
  assert.strictEqual(verbs.vitems({ v: 'ir' }).length, 12, 'ir has no futuro of its own');
});

test('a verb that collapses two boxes still gets four buttons', () => {
  // disse and disse, quis and quis, soube and soube, trouxe and trouxe
  ['dizer', 'querer', 'saber', 'trazer'].forEach(name => {
    const v = verbs.verbById(name), f = verbs.vformas(v, 'pret');
    assert.strictEqual(new Set(f).size, 3, name + ' no longer collapses');
    for (let b = 0; b < 4; b++) {
      const it = verbs.vitem(v, { id: 'pret', topic: 'preterito' }, b, f);
      assert.strictEqual(new Set(it.c).size, 4, `${name} box ${b}`);
      assert.ok(it.c.indexOf(it.a) > -1);
    }
  });
});

test('an irregular past is drilled harder than a regular one', () => {
  // pret-irreg is the slip the notebook actually recorded, and weight()
  // doubles anything carrying a tag
  const tagged = ALL.filter(it => (it.w || []).indexOf('pret-irreg') > -1);
  assert.ok(tagged.length, 'nothing claims the slip any more');
  assert.ok(tagged.every(it => it.id.split(':')[2] === 'pret'));
  const irreg = new Set(byGroup('irreg').map(v => v.v));
  assert.ok(tagged.every(it => irreg.has(it.id.split(':')[1])));
});

/* ---------------- the language, same rule as everywhere else ---------------- */

test('no English in the verb tables', () => {
  const found = [];
  VERBS.forEach(v => {
    scan(v.v + '.n', v.n, found);
    scan(v.v + '.es', v.es, found);
    scan(v.v + '.c', v.c, found);
  });
  VGRUPOS.forEach(G => { scan(G.id + '.name', G.name, found); scan(G.id + '.desc', G.desc, found); });
  VTEMPOS.forEach(T => scan(T.id + '.name', T.name, found));
  VBOX.forEach(B => scan('box', B.nome, found));
  VERBS.forEach(v => TENSES.forEach(t => scan(v.v + '.' + t, verbs.vregra(v, t), found)));
  assert.deepStrictEqual(found.slice(0, 8), []);
});

test('no English leaks out of the verb questions', () => {
  const found = [];
  ALL.forEach(it => {
    scan(it.id + '.q', it.q, found);
    scan(it.id + '.h', it.h, found);
    scan(it.id + '.e', it.e, found);
  });
  assert.deepStrictEqual(found.slice(0, 8), []);
});

test('the Spanish of the verb tab is Latin American', () => {
  const found = [];
  const look = (label, s) => { if (s && PENINSULAR.test(s)) found.push(label + ': ' + s.slice(0, 60)); };
  VERBS.forEach(v => look(v.v, v.n));
  VGRUPOS.forEach(G => look(G.id, G.desc));
  ALL.forEach(it => { look(it.id, it.h); look(it.id, it.e); });
  assert.deepStrictEqual(found.slice(0, 8), []);
});

/* ---------------- the tab itself ---------------- */

test('the Verbos tab is in the bar, with an icon and a screen behind it', () => {
  assert.match(HTML, /one\("verbos", "Verbos", 0\)/, 'not in the tab bar');
  assert.match(HTML, /verbos:\s+'<svg/, 'no icon');
  assert.match(HTML, /TAB === "verbos"\s+\? tabVerbos\(\)/, 'home () does not route to it');
  assert.ok(HTML.includes('function tabVerbos()') &&
            HTML.includes('function grupoVerbos(id)') &&
            HTML.includes('function verbo(name)'), 'a screen is missing');
  // the drill has to be reachable from all three of them
  assert.ok(HTML.includes('vwire();'), 'nothing wires the verb buttons up');
});

test('another round of the same thing comes back scoped', () => {
  // the result screen used to know about topics, lessons and provas only, so
  // "Outra rodada" after a verb round would have thrown the scope away
  assert.ok(HTML.includes('V0 = ses.verbos'), 'the result screen forgets the scope');
  assert.ok(HTML.includes('if(V0) return startVerbos(V0);'), 'and cannot start another');
});
