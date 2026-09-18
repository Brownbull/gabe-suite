# How we design the panels — the working method (adopted 2026-09-18)

Source: `design-context-agent-guide.md` (Gabe's research handoff, same folder). That guide is recommendations; THIS file is
the working agreement built from it, and it changes when Gabe says so. Yesterday's work advanced but moved many faders at
once; this is the structure that stops that.

## The loop, and where each step lives in this repo

| step (guide §8) | what it is | where it lives | state today |
|---|---|---|---|
| 1 INVENTORY | every attribute of an entity type: data type · cardinality · importance · volatility · own/relation | `inventory-<kind>.md` here; seeded from `workflow-panel/field-atlas.html` (72 fields for the endpoint) | the atlas has name · source · joins · shown-in; it lacks cardinality · importance · volatility |
| 2 QUESTIONS | 10–15 real questions Gabe asks the graph, tagged locate · trace · compare · audit · summarize | `questions.md` here | not written — drafted from what Gabe has asked, then HE corrects it |
| 3 FADERS | the five families: data · task · encoding · space · state | the lab rail (`endpoint-lab.html`) — every pick is a fader; the copy line is the preset | built, but un-inventoried: no list says which family a pick belongs to |
| 4 MATRICES | M1 attribute × question · M2 attribute × zoom · M3 attribute × channel (the channel budget) · M4 cardinality × zone | generated from 1 + 2 into `matrices.md` | none exist |
| 5 PRISMS | a named recipe: questions · promotes · channels · dims · alert rule · entry | `prisms/<name>.md` | the six topics + the PATH label are candidates; no spec, no channel budget |
| 6 VARIANTS | 3–5 at once, ONE fader moved each, labelled, real data incl. the densest entity | a gallery page beside the lab | the lab shows one variant at a time; the arrange lab is a drag board, not a gallery |
| 7 TEST · LOG · PROMOTE | squint · grayscale · worst-case · 5-second · timed questions → `decisions.md` → slot maps + tokens | probe + dev toggles + `decisions.md` here | the probe measures structure (1,013 asserts) but none of the five tests; no log |

## The rules the agent now works under (guide §11, adopted)

1. **Ask first:** which question or prism does this change serve? No answer → it is not built.
2. **One fader per variant**, 3–5 variants side by side, each labelled with the fader it moved.
3. **Real data, ugliest included:** the densest door (GET /recipes, 22 paths) and the widest table ride every gallery.
4. **Four on the face** (P3): a glyph or card face shows ≤ 4–5 attributes; the rest is hover, nested and pinnable.
5. **One channel, one meaning, per view** (P4 · M3): a hue or shape is added only after the channel budget says it is free.
6. **Quiet resting state** (P2): colour is an alarm; alert tokens are separate and never reused for categories; a 4xx
   ending is not a warning — the alarm is the anomaly (a write with no 401, a body with no 422, an ending with no test).
7. **Same slot, every card** (P6): slot maps per entity type live in ONE source-of-truth file.
8. **Tests before promotion:** squint · grayscale · worst-case data measured by the probe; 5-second and timed questions
   run by Gabe on a harness page; the result goes to `decisions.md` with "revisit if".
9. **Explain to Gabe in gabe-lens form** (problem → analogy → map → constraint box → handle); hovers in plain mode.

## The guide's unknowns — answered from the codebase (2026-09-18)

| unknown (guide §12) | answer | source |
|---|---|---|
| what `widening` means | how far the endpoint reaches outward: the hook that fetches it → screen → route → router → app, plus the workflow steps around it | `_lab-ep-panels.js` renderWidening · `LABEP.widening` |
| renderer stack | `ForceGraph3D` (3d-force-graph over three.js), one instanced render path | `templates/center/shell/gabe-universe.html` |
| do column icons map to the card's rows | NO — one mark per column of the table; they summarise the whole table, not the block's rows | `dataBlockNode` field marks |
| the 4 rows of a table block | title lines: icon + name · entity · count + RW chip · model — then the field-marks row | the operator's default line (`endpoint-lab-arc` memory) |
| columns per table | min 3 · median 8 · max 10 listed (the feed lists up to 10 and counts the rest as `cols_more` — a cap to verify) | example feed `c4-graph.js`, 57 models |
| node count | 312 L2 nodes (123 schemas · 81 endpoints · 57 models · 33 screens…) + 1,078 frontend pieces on gustify; ~3.9k on onyx | same feed |
| densest entity for worst-case tests | GET /recipes — 22 paths; widest tables UserExplorationPreferences · TaxonomyValue · ShoppingItem (10 listed) | arms-on forms feed |
| a mock of the left-rail proposal | none in this repo | — |

By the guide's own §7 table, icons that summarise the whole table make the footer strip "fine"; the left rail wins only if
the self-test says so. That test is not run yet.

## Answered by Gabe on 2026-09-18

1. **Prism = a point of view** — his definition, the standpoints he named for an endpoint, and the depth rule are in `prisms.md` (D-011).
2. **The question list** — not struck; five questions added from his own words (Q16–Q20 in `questions.md`). Still a draft.
3. **Importance** — proposed by the agent with a reason per attribute in `inventory-endpoint.md`; he corrects it (D-010).
4. **Loop 1** — the endpoint card as a whole (D-010).

He also corrected D-001…D-007 and stated three rules that now bind every panel: what each console region may hold (D-008),
the three depths of a hover (D-009), and where the animation and centring rules apply (artifacts only). All of it is in
`console-rules.md` and at the foot of `decisions.md`.

## Loop 1 — the endpoint card as a whole (the order of work)

1. Gabe corrects the ratings in `inventory-endpoint.md`.
2. The agent builds M1 (attribute × question) and M2 (attribute × zoom level) from the corrected inventory and `questions.md`,
   reorders M1 until clusters appear, and names the candidate prisms the clusters suggest.
3. M3 for the first prism: the channel budget — which channel carries which attribute, where two attributes collide.
4. A gallery page in the endpoint lab's layout: 3–5 variants of the endpoint card at true size, ONE fader moved each, on
   POST /setup/complete AND GET /recipes (22 paths, the worst case), with the squint · grayscale dev toggles.
5. The probe measures squint, grayscale and worst-case; Gabe runs the 5-second and timed questions on a harness.
6. The result goes to `decisions.md`; the winner is promoted to the slot map and the tokens.

**Status 2026-09-18, evening:** step 1 is done (ratings ruled, D-013; four proposed rows still wait for a rating on `rate-endpoint.html`). Step 2 is built
and waits on Gabe: `matrices-endpoint.html` shows M1 reordered into eleven blocks, the ladder of joins with the cut, the shared band, the face the
questions earn, and M2 by rule (D-014). His ruling on the blocks (Keep · Merge · Drop + a name) is what step 3 starts from.

Two known conflicts with the rules are queued for the loop, not patched ahead of it: PATHS ▸ listing codes in the command
panel (D-008) and the long hovers on headers, command cells and rail controls (D-009).
