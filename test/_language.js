/* The app teaches in Spanish. The practice sentences are Portuguese and the
   buttons are Portuguese, but every hint, explanation and lesson passage is
   Spanish — that is the contrast the learner actually reasons in.

   English was never a pedagogical choice; it was a leftover from the prototype
   having been written in an English chat. These two patterns are what stops it
   coming back one item at a time as new material is added, and they live here
   rather than inside one test file because the verb tables need the same scan. */

/* Deliberately narrow. Spanish and Portuguese share a great deal with English
   in this domain ("plural", "singular", "final", "natural"), so the list holds
   only words that would have to come from untranslated English prose. */
/* Accented letters count as part of a word, and a leading hyphen marks a
   suffix rather than a word. The JS word boundary falls between a letter
   and an accented one, so faróis, fiéis, anéis and papéis all read as the
   English "is" and notícia as "not" — and those are the handout's own
   examples. A named suffix (-is, -ões, -inho, -zinho) is Portuguese
   morphology, never untranslated English prose. */
const LETTER = 'A-Za-zÀ-ÿ0-9_';
const ENGLISH = new RegExp('(?<![' + LETTER + '-])(' + [
  'the', 'what', 'which', 'does', 'is', 'are', 'who', 'can', 'before', 'after',
  'noun', 'pronoun', 'verb', 'sounds?', 'takes?', 'goes', 'with', 'and', 'not',
  'only', 'here', 'this', 'that', 'your', 'you', 'for', 'from', 'when', 'where',
  'how', 'same', 'both', 'never', 'always', 'write', 'think', 'start', 'compare',
  'say', 'ends?', 'means?', 'subject', 'answer', 'question', 'gender', 'article',
  'infinitive', 'stress', 'vowels?', 'word', 'sentence', 'stands', 'attaches?',
  'becomes?', 'between',
].join('|') + ')(?![' + LETTER + '])', 'i');

/* the class is in Managua; vosotros would read as foreign */
const PENINSULAR = /\b(vosotros|vuestro|os gusta|habéis|tenéis|sois)\b/i;

/* "de + o = do" and friends are formulas, not prose */
const isFormula = s => /^[a-zà-ÿ]+\s*\+\s*[a-zà-ÿ]+\s*=/i.test(s.trim());

function scan(label, text, found) {
  if (!text) return;
  const m = String(text).match(ENGLISH);
  if (m && !isFormula(text)) found.push(`${label}: "${String(text).slice(0, 72)}"  <- "${m[0]}"`);
}

module.exports = { ENGLISH, PENINSULAR, isFormula, scan };
