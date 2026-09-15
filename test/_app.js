/* Pulls the live data and logic straight out of index.html.
   The app has no build step and no modules, so the tests reach into the single
   file rather than importing — which also means they are testing exactly what
   ships, not a copy that can drift. */

const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* the [...] that follows a declaration, skipping over string literals so a
   bracket inside a sentence cannot end the block early */
function arrayAfter(decl) {
  const i = HTML.indexOf(decl);
  if (i < 0) throw new Error('declaration not found: ' + decl);
  const start = HTML.indexOf('[', i);
  let depth = 0;
  for (let j = start; j < HTML.length; j++) {
    const ch = HTML[j];
    if (ch === '"') {
      j++;
      while (j < HTML.length && HTML[j] !== '"') { if (HTML[j] === '\\') j++; j++; }
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return HTML.slice(start, j + 1); }
  }
  throw new Error('unterminated array: ' + decl);
}

/* a named function declaration, by brace depth */
function fnSource(name) {
  const i = HTML.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('function not found: ' + name);
  let depth = 0, open = false;
  for (let j = i; j < HTML.length; j++) {
    if (HTML[j] === '{') { depth++; open = true; }
    else if (HTML[j] === '}') { depth--; if (open && depth === 0) return HTML.slice(i, j + 1); }
  }
  throw new Error('unterminated function: ' + name);
}

function objSource(decl) {
  const i = HTML.indexOf(decl);
  if (i < 0) throw new Error('not found: ' + decl);
  return HTML.slice(i, HTML.indexOf('};', i) + 2);
}

const B = eval(arrayAfter('var B = ['));
const LESSONS = eval(arrayAfter('var LESSONS = ['));
const TOPICS = eval(arrayAfter('var TOPICS = ['));
const WEAK = eval(arrayAfter('var WEAK = ['));

/* the generators need their slot tables, so take the whole span */
const GEN = eval('(function(){' +
  HTML.slice(HTML.indexOf('function r(a){'), HTML.indexOf('GEN.forEach(function(g)')) +
  'return GEN;})()');

/* answer checking, exactly as the app does it */
const answers = new Function([
  fnSource('soft'), fnSource('bare'), objSource('var MARKS = {'),
  fnSource('markGap'), fnSource('accentMiss'), fnSource('correct'),
].join('\n') + '; return {soft, bare, markGap, accentMiss, correct};')();

/* pack validation */
const validate = new Function(fnSource('validate') + '; return validate;')();

module.exports = { HTML, B, LESSONS, TOPICS, WEAK, GEN, answers, validate };
