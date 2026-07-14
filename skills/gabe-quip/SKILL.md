---
name: gabe-quip
description: "Sharpen docs with sarcastic, insight-carrying wit — titles, hooks, and asides that surface the pain point, name the obvious-but-unsaid, and make a page worth reading. The joke must carry the point, never replace it; punch-up, never at the reader; dosed with restraint (one sharp line beats ten). Proposes options, never silently rewrites reference prose. Usage: /gabe-quip <file|section|concept> [title|hook|aside|pass]"
when_to_use: "Make a doc title/hook/explanation more engaging, add a witty aside that names a pain point, or do a light wit pass over a page. The sibling of /gabe-meme (same oblique wit, in prose not images). Not for load-bearing reference that must read straight, and not a rewrite tool."
metadata:
  version: 1.0.0
---

# Gabe Quip — sarcastic wit that makes docs worth reading

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings. Full text: `../gabe-docs/references/execution-contract.md` (if missing, E6 — STOP).

## The intention (why this skill exists)

*Dry reference prose doesn't get read, and a doc nobody reads is a doc that failed. A well-placed sarcastic line earns the reader's attention: it says the thing everyone already feels but nobody wrote down, and then the real content lands harder because the reader is now leaning in.* This is the prose sibling of `/gabe-meme` — the same oblique wit (the point lands in the reader's head), applied to titles, hooks, and asides instead of images.

The skill's whole job is judgment: which line is worth a quip, what the unsaid pain point actually is, and — hardest — when to shut up. It proposes; the human places.

## The four rules (the craft in one screen)

1. **The quip carries the point; it never replaces it.** The wit must make the real content land *harder*, not distract from it. Test: delete the fact and keep only the joke — if the joke still "works," it's decoration, and it's wrong. The best quip is useless without the truth it rides on.
2. **Materialize the implicit — name the elephant.** The sharpest lines say what everyone knows and nobody wrote: the pain point, the obvious trade-off, the "yes, we all pretend this is fine." A quip that surfaces a real unsaid thing is worth ten clever-for-clever's-sake ones.
3. **Punch up, never at the reader, and dose with restraint.** Aim at the situation, the complexity, the system — never "you, who didn't understand." And ration it: ONE sharp line per section beats snark in every sentence. Wall-to-wall wit reads as trying-hard and buries the signal it was meant to sharpen. When unsure, cut it.
4. **Match the register to the doc.** A README hook or a narrative intro can be bold; a reference table or a runbook stays mostly straight with at most one aside. The faster a page must be scanned, the less wit it can carry. Never let a joke slow down something someone reads under pressure.

## Modes

### `/gabe-quip <target> title` — a sharper title/heading
Read the target. Propose 3 title/heading options that are accurate first and witty second, each naming what the section actually delivers (not a pun that hides it). The human picks; you place.

### `/gabe-quip <target> hook` — an opening line that earns the read
Propose 2–3 opening hooks that surface the reader's real reason to care (usually a pain point). It must set up the content that follows, not just be a standalone zinger.

### `/gabe-quip <target> aside` — a well-placed witty aside
For a specific passage, propose an aside (a parenthetical, a footnote, a one-line callout) that names the obvious/implicit. Show exactly where it goes. Keep it removable — the passage must still stand if it's cut.

### `/gabe-quip <target> pass` (or no mode) — a light wit pass
Read the whole doc and propose the 2–3 spots (not more) where a quip would most help — each with the line and why it earns its place. Flag any spot where wit would *hurt* (a gotcha, a safety note, a dense reference). The human approves per-spot; nothing is inserted unseen (E3).

## Guardrails

- **Propose, don't silently rewrite.** Especially in reference docs — present options and placements; the human accepts each. Never swap a doc's voice wholesale on your own call.
- **Accuracy outranks the joke, always.** If the funniest line bends the fact, the fact wins and the line is rewritten or dropped.
- **Restraint is the feature.** "Here and there" is the brief — if a page already has a quip in the last two sections, the answer to a third is usually no.
- **Stay in your lane.** Comprehension via analogy is `/gabe-lens`; the structural doc standard (CommonMark, analogy-first opener) is `/gabe-docs`; image wit is `/gabe-meme`. This skill is the optional *voice* layer on top — it sharpens, it doesn't restructure or explain.

The deeper craft — the patterns of a good quip, the anti-patterns that kill a doc, register-by-doc-type dosing, and worked before/after examples — lives once in `references/quip-craft.md`.

## Output contract

Per invocation: a small set of options or placements (titles/hooks/asides/spots), each accurate-first and dosed for the doc's register, with the pain point it surfaces named — for the human to pick and place. Never a silent rewrite; never a joke that costs a fact; never more wit than the page can carry. E7: report which spots were proposed and where they'd land.
