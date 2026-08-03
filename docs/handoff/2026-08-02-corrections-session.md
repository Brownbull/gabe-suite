# Handoff — the corrections session (Session B of the two-session protocol)

> Generated 2026-08-02 · branch `main` · HEAD `059cd79` · 8 commits ahead of
> both remotes (PUSH OWED) · no `.kdbp` by ruling R8 — this doc is the
> durable copy; the prompt below is what Session B pastes.

## The protocol

- **Session A (generator)** runs ONLY this thin prompt, one shot, and stops:
  ```
  /gabe-imagine compound interest, for a saver — what does my money become,
  and which lever moves it?
  ```
- **Session B (corrections — THIS handoff's heir)** receives the operator's
  feedback on Session A's page and, per verdict: fixes the page AND
  generalizes the fix into the skill/map in the same pass — the map is what
  accumulates, never just the page.

## Resume prompt for Session B

```
You are the CORRECTIONS session for the gabe-imagine one-shot test, on
branch `main` (HEAD `059cd79` unless Session A committed on top — read
git log first). Session A ran "/gabe-imagine compound interest, for a
saver" cold; the operator will paste feedback about its page here.

READ FIRST:
  docs/design/catan-dissection-notes.md      (the whole arc: verdicts, the
                                              one-shot goal + budget, mined
                                              patterns, panel round, protocol)
  skills/gabe-imagine/SKILL.md               (v1.3.1 — the I0–I5 flow)
  skills/gabe-imagine/references/dissection/MAP.md → its routed files
  docs/design/2026-08-02-imagine-flow-panel.json  (the 3-lens findings —
                                              minors there may explain fails)

THE JOB, per operator verdict on Session A's page:
1. Reproduce the complaint on the page (look at the built HTML).
2. Fix the page — smallest correct change.
3. GENERALIZE: encode the correction into the map/SKILL so the next cold
   run cannot repeat it (this is the actual product; a page fix without a
   map fix is a failed round). Suite discipline applies: shell edits mirror
   byte-identical to templates/center/shell/, ./install.sh +
   scripts/suite-doctor.sh CLEAN, checker changes carry battery cases.
4. Rebuild + gates (one command: bash docs/center/generators/
   refresh_suite_center.sh regen) and report the pre-present checklist
   (surface word count · caption spot-check · ladder order).
5. Append the round to docs/design/catan-dissection-notes.md (verdict →
   fix → generalization), commit on the operator's word.

STANDING RULES:
- The bar: "zero diagrams…" and "word salad…" must not recur; surface
  budget ≤150 free-standing words (unit + tiebreak defined in
  translation-elements.md §surface budget).
- Detail levels (interaction-hooks.md): level-0 bare bones + a stepper;
  levels REPLACE explanation text. The stepper is a sanctioned Tier-3 mint
  if Session A didn't build one and the feedback asks for levels.
- Assets: lift before create (assets-inventory.md); the round-2 simulator
  lives at `git show 68836bb:docs/prisms/compound-interest/body.html`.
- OWED items you may be told to pick up: mechanical budget/caption checks
  in verify-prism.mjs (+ battery in tests/prism/) · fixtured
  tools/probe-render.mjs · downstream prism wiring (twin propagation).
- PUSH is owed on both remotes (origin Brownbull + korigin khujta) when the
  operator says push.
```

## State snapshot

- **Landed this session:** a4d432f nav sections · b03aaa7 the Catan section ·
  d33a4c8 the strategist page · 259efa7 + earlier handoff · a584efd mined
  record + staged map · 68836bb v1.3.1 flow (panel-hardened) + round-2
  baseline · 059cd79 round-2 page removal. All gated; doctor CLEAN.
- **Caution flag:** 68836bb swept the operator's strays in via `git add -A`
  (notebook photos, archmap scripts, 2026-07-29-tools, .gitignore edit) —
  operator to confirm or lift before push.
- **The skill:** gabe-imagine v1.3.1, flow I0–I5, map BOUND, seats
  generalized, disk-target schema complete, one-command build named.
- **Verified:** full chain exit 0 after removal; suite-doctor CLEAN.
