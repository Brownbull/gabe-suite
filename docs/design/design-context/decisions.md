# Decision log — panels and graph (template: design-context-agent-guide.md §10)

Entries D-001…D-006 are BACKFILLED from 2026-09-17: they were ruled by seeing, with no test run. They stand until a test
says otherwise; "Tests run: none" is the honest record, not a gap to hide.

## D-001 — The endpoint's stages are the standard spine
Date: 2026-09-17 · Fader moved: space (the axis every topic shares) · Variants compared: the six part panels alone vs the same on EDGE · GATE · INPUT · HANDLER · EFFECTS · ANSWER (+ the 500 bay, the client screen)
Tests run: none (ruled by seeing the robot and the WHEN picture) · Result: adopted
Decision + reason: every endpoint in every app gets the same eight-row spine; doors compare, a gap is a silhouette. Record: `workflow-panel/endpoint-stages.md`.
Revisit if: a second door (GET /recipes, 22 paths) does not read on the spine, or a timed question is slower than on the old panels.

## D-002 — The Blocks card is the table's face in every layout
Date: 2026-09-17 · Fader moved: none (a constant, P6) · Variants compared: stage grid (WHEN) vs the Blocks card grouped by stage
Tests run: none · Result: adopted — the stage only groups the block (rows or columns)
Decision + reason: the block was tuned over a week and reads well; positional constancy across layouts.
Revisit if: the glyph-face count fails P3 (the face shows ~7 attributes today) or the 5-second test recalls fewer than 4.

## D-003 — The rail is grouped by the region a control changes, and every control is tagged
Date: 2026-09-17 · Fader moved: none on the console (lab chrome) · Tests run: probe only · Result: adopted
Revisit if: a control's region tag is wrong in use.

## D-004 — An animation opens on its finished frame; Replay runs it
Date: 2026-09-17 · Fader moved: state (transitions) · Tests run: motion gate · Result: adopted — agrees with P10 (never require watching an animation to read a static value)
Revisit if: never expected.

## D-005 — Page content is centred on the operator's wide screen
Date: 2026-09-17 · Fader moved: space · Tests run: none · Result: adopted for local pages and artifacts; the artifact kit's H1 still says left
Revisit if: the kit flip is landed.

## D-006 — The command card navigates topic and label (seven groups, ≤ 3 levels, the cancel corner everywhere)
Date: 2026-09-17 · Fader moved: several at once (grouping · depth · what a cell opens) — the pattern this log exists to stop
Tests run: probe only · Result: adopted as the default, not tested against the part buttons for speed
Revisit if: timed questions show the part buttons are faster for "open topic X".

## D-007 — Data's default is the Blocks card grouped by stage (rows), with columns as the compared option
Date: 2026-09-17, committed 2026-09-18 · Fader moved: space (grouping by stage) — plus two more in the same build (placement · empty stages), which the method now forbids in one variant
Variants compared: stage grid (WHEN) · stage blocks in rows · stage blocks in columns — seen one at a time in the lab, not side by side
Tests run: probe only (1,013 structure asserts: the block is proven identical to the Blocks block table for table); none of the five design tests
Result: adopted as the Data default by the operator's words ("we keep the blocks … group them in rows or in columns")
Decision + reason: positional constancy (P6) — the table's face never changes; the stage is only a group. The stage header states the expectation (P12: one tooltip per concept), not a diagnosis.
Revisit if: GET /recipes (22 paths) does not fit the bands; the squint test cannot tell the six bands apart; rows vs columns has never been timed on Q1/Q2 — run that before calling either the winner.

---

# Gabe's corrections to D-001 … D-007 (2026-09-18) — his words, condensed; the full rules live in `console-rules.md` and `prisms.md`

- **D-001 stands, scoped.** The spine is the structure for API endpoints in general — the result of working a lot on the endpoint itself. Whether it translates to the other element kinds is open: start with it, then look at the principal kinds. Priorities (tier 1 in the graph): backend endpoints · functions · schemas · models; frontend views · components · stores · hooks.
- **D-002 is downgraded from a law to a default.** "The block card is the table's face in every layout" was an assumption made while settling things; probably not the case. The blocks for tables/models and for schemas are right ("we nailed them"); function cards are to be revisited; tests have no card at all, only labels — wanted; other block kinds may come.
- **D-003 was read as the MIDDLE section, and that reading is the ruling that matters** (the lab's controls rail stays grouped by region — lab chrome). See D-008.
- **D-004 is scoped to ARTIFACTS** (start finished + a repeat button; the gabe-artifact skill may change for it). Panels follow the guide's animation directions (P10). The 3D graph's animations are a separate topic, at the end.
- **D-005 is scoped to ARTIFACTS.** Exploration pages use the endpoint lab's layout — configuration on the left, the page on the right.
- **D-006 stands with a constraint:** the command card holds topics and points of view, **nothing with actual codes**. See D-008 and D-009.
- **D-007 stands** as the default for API endpoints: on entering an endpoint, what we rationalise first are its stages / facets / general attributes, and grouping by position gives that structure quickly.

## D-008 — What each console region may hold
Date: 2026-09-18 · Fader moved: none — a rule of the space family
Decision: COMMAND = concepts and points of view only (topics · prisms · kinds of ending), never a code or a value · MIDDLE = the ground of operations, everything available under the point of view, specifics and the filter by code live here, drill-down in several ways (data · functions · cases · paths — behaviour, not only reach) · PORTRAIT = the detail of the one thing clicked.
Reason: the command helps you know what is available to explore and move through it swiftly; specifics would crowd it.
Known conflict: the built PATHS ▸ level lists fourteen endings by status code — to be reworked into kinds in the loop.
Revisit if: a kind-only command makes "open the 409" slower than today (timed on Q2/Q6).

## D-009 — Hovers have three depths
Date: 2026-09-18 · Decision: headers · the command panel · little buttons · settings → very short, one brief explanation (+ ONE example of application if complex, nothing more) · elements with more to show (tables · models · function blocks) → a detail hover with more context, less than the portrait · click → the portrait.
Known conflict: command cells, headers and rail controls open multi-row cards today — to be shortened.
Revisit if: a short hover leaves a control unusable without the docs.

## D-010 — Loop 1 runs on the endpoint card as a whole; importance is proposed by the agent and corrected by Gabe
Date: 2026-09-18 · Inventory: `inventory-endpoint.md` (ratings 3 · 2 · 1 with a reason each, cardinalities measured over 80 doors).
Revisit if: Gabe's corrections move more than a third of the ratings — then the rating rule itself is wrong, not the rows.

## D-011 — "Prism" means a point of view
Date: 2026-09-18 · Decision: in the design context, a prism is a standpoint from which an element is read (data effects · in-flight state · decision points · structures · functions by how crucial they are · coverage · context · reach outward — candidates in `prisms.md`). The depth rule: detail where something can change the path, the data, the context or the flow; the rest is mentioned, never drilled.
Note: the suite's authored "prism pages" (gabe-imagine) share the word and are a different thing.
