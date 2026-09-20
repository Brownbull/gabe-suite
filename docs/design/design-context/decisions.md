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

## D-012 — The kinds of ending are fixed slots, drawn even when empty
Date: 2026-09-18 · Fader moved: Space (fixed slot vs flowing) · State (resting)
Decision: success · refusal · framework · validation · uncaught are FIVE constant slots on an endpoint, always drawn in the same order; a kind with no ending is drawn hollow (the zero state), never removed; an empty kind that should not be empty raises an alert (a write endpoint with no refusal · a body with no validation). The same idea is expected on other element kinds, with their own constants.
Reason (Gabe, on the rating sheet): "These families might be constants here in the API endpoint and later in other elements, so we will still show them even if they are empty. They might surface some kind of flag or warning." It is P6 (positional constancy) and the element-forms idea that an empty slot is a finding.
Tests run: none. Revisit if: a kind is empty on every endpoint of an app, so its slot is only noise there.

## D-013 — The endpoint inventory's ratings are ruled; request-scoped state sits at 1 by Gabe's own rule
Date: 2026-09-18 · Input: the RATINGS text pasted from `rate-endpoint.html` (inventory 05cdd08f): 3 changed · 39 confirmed · 1 untouched.
Decision: the ratings in `inventory-endpoint.md` are the record — file:line 1 · signature 2 (the async mark) · deciding branches 3 with an alert · own guards 3 left as proposed. Request-scoped state moves 2 → 1: he confirmed 2 but wrote "maybe a 1 since it's just information… if there is some important information that we can have by having this as a 2 (so we can filter something that is important), we might keep it as a 2", and today nothing can be filtered by it — the three instances the feed knows (auth context · idempotency key · database session) already ride on rows rated 2 or 3, and no generation arm reads request-scoped state in general.
Also: four rows were ADDED after his pass, marked (proposed) — events published · tasks dispatched · outside services called · delivery (a stream) — because his note on `signature` described "other code subscribed to the action", which exists in the feed and was missing from the inventory. They wait for his rating.
Revisit if: a generation arm reads request.state / context variables in general and finds state that no other row carries — then request-scoped state is worth a 2 again.

## D-014 — How M1 is measured: three agent raters, a judge on hard splits, and a cut at the widest gap
Date: 2026-09-18 · Fader moved: none — this is the method's own instrument, logged so its weak points stay visible
Decision: M1 (attribute × question) is filled by THREE AGENT raters, each from a different seat (operator at the console · data engineer · minimalist), merged by the median; a 0 against a 2 is a hard split and only there a fourth agent rules as judge. The questions are grouped by average-linkage on idf-weighted cosine similarity, and the CUT falls at the widest drop between two consecutive joins — no hand-picked threshold. An attribute's home is the block where its total use is highest; an attribute needed in three or more blocks sits in the shared band on top. M2 (attribute × zoom) is a stated rule in `gen-matrices.js`, never a judgement.
Reason: the first cut used a similarity threshold of 0.42, which landed INSIDE a band of three near-equal joins (0.44 · 0.43 · 0.41) and merged tests into the endings and security into the route; the page then told Gabe "tests form no view of their own". A review caught it. The joins run 0.79 … 0.565, then drop to 0.44: the widest gap, and the cut it gives keeps all six lab parts as blocks. The three joins just past it are shown to him as merge candidates, which is what his Merge verdict is for.
Tests run: probe-matrices 76 asserts (the cut is asserted to be the ladder's widest drop; a claim on a card must be checkable on that card); a four-lens review + verifier, 47 findings, 31 confirmed and fixed. Not run: any test with Gabe — the blocks are a proposal until he rules.
Known weak points, said on the page: the raters are agents, not people · three blocks hold a single question · 202 of 301 marked cells had the raters one step apart.
Revisit if: Gabe corrects the question list (the blocks are made of his questions, so they move with it) · his verdicts merge or drop more than a third of the blocks (then the questions, not the clustering, are the thing to fix) · a second rating run on the same input moves a block.

## D-015 — The API endpoint has eleven prisms; all kept, none merged
Date: 2026-09-19 · Input: the RULING text pasted from `matrices-endpoint.html` (m1 95121cec) — eleven `keep`, no note.
Decision: Endings · Data effects · Overview and risk · Gates and decisions · Standard or specialist · Functions · Stages and order · In-flight state · Structures · Proof · Client are the points of view of the API endpoint (table in `prisms.md`). The three merge candidates past the cut stay apart.
Consequence: the command panel's topic level grows from the lab's six parts to eleven concepts — over the "about seven" a menu holds comfortably, and D-006/D-008 cap nesting at three levels. How the eleven are grouped or paged in the command panel is a display question for the variants step, decided by seeing; it is NOT decided here.
Also asked the same day, answered in `gaps-endpoint` (the evaluation page): whether response shape per ending and context-giving functions should leave their rating of 2 (recommendation: keep both at 2 — raising the first moves nothing, raising the second spends a face slot on a value that is the same on 78 of 80 endpoints, lowering either hides it from the 4–5 questions that need it).
Tests run: none with Gabe beyond the ruling itself. Revisit if: the variants step shows eleven entries cannot be navigated in the command panel within three levels · the question list changes (the blocks are made of it).

## D-016 — What M1 left over: ten pieces of work are "do", one is "later"; two attributes dropped, three demoted, four kept
Date: 2026-09-19 · Input: the RULING text pasted from `gaps-endpoint.html` (eval c2f7f9c5), every line his.
Decision: DO 1 The route, in order · 2 What an empty slot means · 3 What each ending carries · 4 Whose write it is · 5 Proof you can open · 6 Inside the calls · 7 How common each piece is · 8 Field rules, and a line to open · 10 What the screen does on each ending · 11 What stays alive during the request (the agent had said "later" on 8, 10 and 11). LATER: 9 Why a touch happens, and why it survives. Attributes: KEEP provisions · race on a unique key · cases · signature (the agent had said demote: the async mark separates nothing in this app); DEMOTE entity · cluster · rate limit · journeys; DROP steps in the longest chain · usage · fan-in.
Consequence: the living inventory changes (61 rows, 20 of them proposed) while M1 round 1 stays a record (`m1-round1.inventory.md`); the order and the definition of done are in `program-leftovers.md`. A piece lands FACTS and corrections with components the lab already has; how the card finally shows them is decided later, by the loop (M3 → variants → tests), by seeing.
Trigger for piece 9 (a "later" needs one): when pieces 1 and 6 have landed — they give a table touch the numbered step and the opened call its condition attaches to — or sooner if Q1 · Q2 · Q19 come up again.
Revisit if: a piece turns out to cost more than its estimate by a whole tier (hours → a day → days) — then it is re-priced on the page before it is built.
