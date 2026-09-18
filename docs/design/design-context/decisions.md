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
