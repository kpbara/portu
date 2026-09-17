# Portu

A Brazilian Portuguese course for Spanish speakers, shipped as an installable
PWA. No build step: `index.html` is the whole app, and GitHub Pages serves
`main` straight to https://kpbara.github.io/portu/. What is on `main` is what
learners have on their phones.

## Several agents work here at once

This repo is usually being edited by more than one Claude session, and they all
share **one checkout**. There is no lock. Assume you are not alone.

- **Read `git status` before you start.** A dirty tree means someone else is
  mid-edit. Do not edit, stash, checkout, or reset — wait, or say so and stop.
- **Commit before you hand off.** Never end a turn leaving the tree dirty;
  the next session cannot tell your work from a broken state.
- **`git pull --rebase` before pushing.** Commits from other sessions land
  between your fetch and your push.
- **Never rewrite published history.** No force-push, no rebasing `main`, no
  amending anything already pushed. Other sessions hold clones of `main`, and a
  rewrite desyncs all of them at once.

## `main` is the only line of work

`origin/claude/nonsensical-expressions-334tbn` is the pre-squash history and
**shares no common ancestor with `main`** (`git merge-base` exits 1). It cannot
be merged — only cherry-picked, and `index.html` has diverged far enough that
cherry-picks conflict. If something useful appears there, **reimplement it on
`main`** rather than porting the commit. Do not merge it, and do not delete it
without asking: it is the only copy of the original development history.

## Before you push

Run `npm test` (59 tests, `node --test`). They are not only about data — several
guard decisions that are easy to undo by accident:

- every colour lives in the palette block; a hex anywhere else fails
- no box wears a coloured bar down one edge
- topic ids are safe to drop into a class attribute
- **`esc()` escapes the quote, not just the angle brackets, and no `data-*`
  attribute takes an interpolated value raw** — a pack mints topic ids from its
  own item fields (`p.topics.push({id:it.t, name:it.t})`), so anything reaching
  an attribute is untrusted input
- lessons are validated on load, because they render with no fallback
- the Os números course still writes out every number from zero to twenty;
  the rows of those four lessons are the lesson, and losing one is silent

Content lives in Spanish (the teaching language) and Portuguese (what is being
taught). Tests fail on English left in either, and on peninsular Spanish.
