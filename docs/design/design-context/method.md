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

## Still Gabe's to answer

1. **"Prism" — the word collides.** In this suite a prism is already a thing: an authored instrument page (`docs/prisms/`,
   the gabe-imagine skill). The guide's prism is a saved fader preset that recolours the view. Same word for both, or a new
   word for the guide's (lens · preset · view)?
2. **The question list** — the draft in `questions.md` is mine, from what you asked this week; the real list is yours.
3. **Importance 1–3 per attribute** — only you can rate it; the inventory ships with the column empty.
4. **Where the loop runs first** — the table block inside the endpoint's Data topic (the guide's open question §7), or the
   endpoint card as a whole.
