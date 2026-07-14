# Quip craft — the binding patterns behind /gabe-quip

> The one deep home for the wit patterns. SKILL.md carries the four rules, the
> modes, and the guardrails, and points here; nothing below is restated there.
> Sibling reference: `../../gabe-meme/references/meme-craft.md` (the same oblique
> wit in image form — the §Writing "mental-step" idea is shared craft).

## The shapes of a good quip

A quip is not "a joke in a doc." It is a compression: it makes the reader *feel*
the point in fewer words than the straight version would take, then hands them
back to the content leaning in. The recurring shapes:

| Shape | What it does | Example (subject) |
|---|---|---|
| **Name the elephant** | States the obvious-but-unsaid everyone tiptoes around | "There is no `commands/` directory. It was retired the day someone admitted every skill was already its own command." |
| **The honest gloss** | Says what a euphemism really means | "'Deferred' — the polite word for a ticket we've all agreed to stop feeling guilty about." |
| **The deadpan stat** | Lets an absurd number speak, then underlines it flatly | "Six of 185 screenshots were doors. The other 179 were walls with good lighting." |
| **The setup-payoff title** | A heading that promises, then the section pays off | "## The video that nobody watches (so it's collapsed now)" |
| **The self-aware aside** | Admits the friction the reader is already feeling | "(Yes, that's three framing blocks before any content. We counted too.)" |
| **The inverted expectation** | Frames a good thing by the bad thing it isn't | "It compiles, ships, and regenerates green — which, if you've met software, is the surprise." |

## Anti-patterns — the ways wit kills a doc

- **The joke that ate the fact.** If a reader finishes the line and can't say what
  it *taught*, cut it. Decoration is worse than dry — it costs a read and returns
  nothing. (Rule 1, in practice.)
- **Snark tax.** A quip in every paragraph turns into background noise; by section
  three the reader tunes the voice out and misses the one line that mattered. Dose:
  at most one per section, fewer in reference.
- **Punching at the reader.** "If you didn't already know this…" / "obviously…" —
  humor at the reader's expense reads as contempt and they close the tab. Aim at the
  situation, never the person holding the docs.
- **Clever that needs a decoder.** An in-joke or a pun that only lands if you already
  know the answer fails the newcomer — the exact person a hook is for.
- **Wit on a landmine.** Never near a data-loss warning, a security note, a
  destructive command, or a gotcha someone hits under pressure. Those read straight,
  every time. A laugh next to `rm -rf` is a bug.
- **The forced callback.** Reusing a bit past its first landing (the third "elephant"
  reference) is trying-hard; each quip earns its place fresh or not at all.

## Register — how much wit each doc type can carry

| Doc type | Dose | Where it goes |
|---|---|---|
| README / landing / narrative intro | Bold | The hook, section openers, one memorable close |
| Workflow / how-to guide | Moderate | The intro, a per-step aside that names a real snag |
| Concept explainer / retro / investigation | Moderate | Titles + the "here's the thing nobody says" beat |
| API / config reference, checklists | Sparse | At most one framing aside up top; the entries stay straight |
| Runbook / safety / migration steps | None to one | The intro only; every actionable line reads dead-straight |

Rule of thumb: **the faster a page is scanned under pressure, the less wit it can
carry.** Hooks and intros are where wit pays; load-bearing bodies are where it taxes.

## Worked before / after

**Title.**
- Before: `## Folder restructure`
- After: `## 50 files, one flat directory, and the day it stopped scaling`
  *(surfaces the pain point the restructure solved — accurate first, witty second)*

**Hook.**
- Before: "This document describes the testing command center."
- After: "A test suite you can't see is a test suite you don't trust. This is the
  window into the one we built."
  *(names the reader's real reason to care before explaining anything)*

**Aside.**
- Before: "Captures are machine-local and never committed."
- After: "Captures are machine-local and never committed — the video exists exactly
  where a human once ran it, and nowhere else. (The screenshots are the part you can
  actually take home.)"
  *(materializes the implicit consequence; removable without breaking the sentence)*

**When the answer is no.**
- Passage: "Run `scripts/refresh_center.sh all` before a release; a partial run
  poisons the estate view."
- Verdict: leave it straight. It's an actionable instruction with a real failure
  mode — a joke here buys nothing and risks softening the warning.

## The method (how to generate)

1. Read the target fully (E1). Find the **unsaid thing**: the pain point the reader
   feels, the trade-off the prose steps around, the number that's quietly absurd.
2. Pick the shape (table above) that fits — most doc wit is "name the elephant" or
   "the honest gloss."
3. Write it accurate-first: draft the straight version of the point, then find the
   fewer-words wittier version that says the *same* thing. If you can't get back to
   the straight point from the quip, it drifted — redo.
4. Dose against the register (table above). If the section already carries a quip,
   the honest move is usually to stop.
5. Present options + exact placement; never insert into reference prose unseen. The
   human picks and places (E3).
