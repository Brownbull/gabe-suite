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

## D-017 — What happens in the code is shown; how the map knows it sits behind "more information"
Date: 2026-09-20 · Input: Gabe, reading the review page — "Things that are related to how we found the information, like reasons that are more related to our framework than the actual code, should be hidden and not always shown … they don't offer information about what is happening, actually, in the table, but about how we actually mapped that in our codebase map. Any kind of decision of this nature should be hidden. We will get it behind some information options or a plus information option that we can toggle later."
Decision: a fact has one of two natures. **About the code** — what a table, a function, an ending or a route IS and DOES — is shown. **About the map** — how we found it, which reading found it, whether a zero was measured or never read, a place that is a guess, a roster, a word of our own framework — is nice to have and NOT critical: hidden by default, to live behind one "more information" option that is toggled.
Consequence: (1) the lab — the table record goes back to four rows; the fifth row `found by` (leftovers piece 4) is hidden behind a switch that is off (`window.MOREINFO`), the fact stays generated. Hover cards are not "always shown", so facts of this nature that ride a hover stay where they are. (2) decision pages — a decision of this nature is not put in front of him: it is left to Claude's pick, folded away, and listed as such in the pasted text. (3) the same rule cuts reading: on the review page the 30 norm lines that are drawn nowhere yet fold away too, and a card shows its decision, its why, and what each option sets in motion, with the rest behind "more".
Trigger for the toggle (a "later" needs one): when the display step starts (M3 → the variants gallery), where it is built as one rail option and decided by seeing — or sooner, the first time a fact about the map is needed to trust a number on a card.
Revisit if: a fact about the map changes what he would DO — a list he cannot trust, a count that is a floor. Then that one fact is promoted, as an alert, never the whole class.

## D-018 — The review of the leftovers program: his rulings on what I wrote, piece 10 lands, piece 11 follows it
Date: 2026-09-20 · Input: the REVIEW text pasted from `review-leftovers.html` (review 7aa8b87d · POST /setup/complete @ 05007957 · 47 his · 10 left as my pick).
Decision, his: **the 36 norm lines** — 34 ok; `tables · GATE` and `security · EDGE` reword, with no note, so I propose the words and show them before they land. **vocab: sweep** — door and lock leave every drawn string the lab owns, and the probe asserts that quote them; the two sentences lifted from the suite's legend stay (a separate suite change, not ruled). **thresholds: 9 in 10 · 1 in 10** stay. **roles: any raise counts.** **through-route: the most checks, and none named when two tie.** **test roles: the words are right.** **piece 10: land it.** **piece 11: after piece 10.** Opened from the folded section and ruled: the slot sentences are right · mark a helper's guessed place · "after the handler" stays. Already his by D-017: `found by` sits behind "more information".
Left to my pick by D-017 (choices inside the framework), so they stand as I picked: a `useNavigate` roster — yes · the word for "the caller decides" — `beyond one level`, not the design's `returned` · `toast` as a library idiom — yes · `useTranslation` with no app using it — no · piece 11's part keeps the name `inflight`.
The five layout cards came pasted as "my pick, not ruled" — never an approval — and were then ruled by his follow-up in the chat, "go with the recommendation": the three new rows on the function record stay · what sits inside a call becomes a RAIL OPTION with three states (always open · closed until clicked · closed; open by default until he has seen all three) · the two rows and the section on an ending's record stay · field and column rules stay on hover cards · this endpoint's place stays on the whole-app card. One correction attached to the place card is a defect, not a choice, and is fixed: the counts took the app's startup as an endpoint (81, the app has 80).
Consequence: the lab changes land first (the sweep · the tie rule · the guess mark, on hover cards only by D-017 · the count), then piece 10's generation part by its plan (`docs/design/element-forms/plans/slice-11e-does.plan.md`), spec block first, with the four picks above written into it.
Revisit if: the first dry run of piece 10 shows `no-rows` or `beyond one level` on most places the client reads a failure — the plan's own BREAKS IF — then it is re-priced on a page before more is built.

