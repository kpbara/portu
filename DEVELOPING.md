# Developing

Technical notes for the person maintaining this. The user-facing page — what the
app is, where it came from, how to install it — is in [README.md](README.md).

No build step, no dependencies, no framework. `index.html` is the whole app:
markup, styles, logic and question bank in one file. Open it through any static
server and it runs. `package.json` exists only to name the test command.

## Layout

```
index.html              the whole app — markup, styles, logic, question bank
js/progress.js          where progress is saved (IndexedDB, localStorage fallback)
sw.js                   the offline copy; also what makes it installable
manifest.webmanifest    name, icon, standalone launch
icons/                  app icons
images/logo-master.png  the source the icons are generated from
content/ids.lock.json   every item id ever shipped (see Checks)
test/                   the checks, run with `npm test`
tools/make-icons.py     regenerates icons/ from images/logo-master.png
```

`reference/` is gitignored on purpose. It holds the original Claude-artifact
prototype and its handoff notes, which name the teacher and a graded score.

## How the app is put together

**Three tabs, not one stacked screen** — `Treinar` (the round), `Falhas` (misses
grouped by the kind of error) and `Assuntos` (the material, browsable). The home
screen used to grow by one row per class; the tabs exist to stop that.

**Four fixed categories.** `CATS` in `index.html` maps topics into Verbos,
Palavras pequenas, Som e letras and Vocabulário. Topics grow with the course;
categories do not. That is the whole point — it is what keeps the app legible at
class thirty.

> **When you add a class pack, file each new topic into `CATS`.** An unfiled
> topic falls into an automatic *Outros* category. Nothing breaks, but *Outros*
> appearing means the filing step was skipped. Past tenses → Verbos; new
> pronunciation → Som e letras; new vocabulary → Vocabulário.

**Every topic needs a hue.** One entry in `HUES` and its `.t-<id>` CSS rule; the
colour is carried into the tile, the lesson row and the question card. A topic
with no hue renders grey.

**Lessons are two kinds, and the UI depends on the difference.** A lesson whose
`pick` has only a `topic` teaches that one assunto and lives inside it. A lesson
with `pick.tag` or `pick.tags` describes a slip that cuts across assuntos, and
lives in the Falhas tab. Currently nine of the first kind and seven of the
second.

**Rounds are `SIZE = 10`**, drawn from 200 static items plus 12 generators and
weighted toward what this device got wrong.

## Adding material after a class

New material is a **pack**: JSON in the same shape as the built-in bank, either
committed into the bank in `index.html` or loaded on a device through *Material
adicional*. Installing a pack never disturbs existing progress.

Every pack item needs a permanent `id` of its own and a hint — the app refuses a
pack without them. The hint is not optional, because a wrong answer is supposed
to earn a question before it earns the answer; an item with no hint would skip
the learner's second try without telling them.

**Material adicional is hidden from classmates.** It loads raw JSON by hand — a
maintenance tool, not a feature, and a way for a classmate to break their own
copy with bad JSON. Visit the app once with `?dev` to mark that device and the
link appears there from then on, including on the plain URL; `?dev=0` forgets it.
The query string is stripped either way.

This is obscurity, not access control, and cannot be anything else: the site is
static, with no server and no accounts, so the check is client-side and visible
in the source. It is acceptable here because the blast radius is one device —
packs are written to that browser's own storage and reach nobody else.

## Checks

```bash
npm test
```

44 checks, no dependencies — just Node's built-in runner. They read the live
`index.html`, so they test what actually ships rather than a copy. Run them
before publishing anything.

They cover four things that are each invisible until they hurt:

**Item ids never move.** Progress is filed under the id, and ids used to be
computed from the item's position in the array — so inserting one question
shifted every later id and silently re-pointed saved progress at a different
sentence. Ids are now written into the data by hand, and `content/ids.lock.json`
records every one ever shipped. **An id may be added, never renamed or removed.**

**Generated sentences hold together.** Twelve of the topics build a fresh
sentence each round out of word lists, which is how the prototype once produced
*"O que eles vai fazer?"* — a plural subject with a singular verb. That passed
every structural check: the answer was among the options and there were four of
them. So the checks run each maker 300 times and read every result, testing
agreement and that the Spanish was built from the same slots as the Portuguese.

**No English comes back.** All teaching is Spanish. Since new material arrives a
pack at a time, one untranslated hint would otherwise slip in unnoticed.

**Answers stay exact.** Accents are graded, so `dancar` must not pass for
`dançar` — but capitals, trailing punctuation and spacing are ignored, since
none of that is being tested.

## Running it locally

```bash
python -m http.server 8765
```

Then open <http://localhost:8765>. A plain `file://` open will *not* work — the
service worker and IndexedDB both need a real origin.

## Publishing

GitHub Pages serves `main` from the repo root, so pushing to `main` publishes.

The service worker fetches the page **network-first** with a short timeout, so a
change to `index.html` lands on the next open with no version bump. Everything
else in `SHELL` — `js/progress.js`, the manifest, the icons — is cache-first, so
**changing one of those means bumping `VERSION` in `sw.js`** (currently
`portu-v3`) or devices keep the old copy.

## Why the app detects the install path itself

Install is the one step where every phone behaves differently, and written
instructions age badly: the automatic prompt only appears on some Chromium
browsers, Brave suppresses it entirely, Firefox has no prompt at all, and iOS
hides it in the share sheet. So the page detects the browser and either offers a
real one-tap install button — via `beforeinstallprompt`, captured early in
`index.html` before the app boots, since Brave never shows its own banner and
missing the event means losing the button — or spells out that browser's menu
path.
