# THE ROBOT — design brief (2026-09-17)

## The operator's words (verbatim intent)
- "If we put the API endpoint at the centre as the component in question, what are the different sections? Imagine that you
  are building a robot. If we are building this robot, we might have different parts, covered or not covered. That is part of
  the new fields: coverage of conditions on different paths. What are we covering, and what are we not covering? Something
  we might do for all the other components, but start with this one to standardize how the API endpoint should work."
- Their model, from credit scoring: "levels of data or processing — that involves data and functions. Those cover different
  paths and conditions. We clean up that data, aggregate it and produce data in another level (trade level → consumer level).
  Again there is data coming in and data coming out, and functions involve default conditions and edge cases. Then the scores
  — a decision tool — with their own conditions to cover: edge cases, default conditions, thresholds min and max, adverse-action
  codes. With that I can do a matrix of what a scoring algorithm program must have. I want the same thing here for the API
  endpoint element kind."
- On reading: "let's come up with something where we don't have to read that much, but we do something visual where we hover
  and see information compressed in each hover on the parts of this robot." Earlier the same day: dense pages are "unreadable,
  too much for my cognitive bandwidth"; pictures with words on hover; Gabe Lens plain lines (one sentence, a concrete noun
  first, at most one em dash, from the reader's side, the honest negative said out loud); one idea per section.
- The reader's suit: Sequential-Procedural — a thing reads as an ordered chain, time top to bottom or left to right.

## The data (robot.json — read it)
Eight parts in request order, each with conditions and a coverage state per condition:
EDGE (429 ×2, the rate-limit flag) · GATE (401 ×2, the verifier's two implementations, the users provision) · INPUT (400 body,
422 JSON, 422 schema) · HANDLER (400 key required, 409 in progress, 409 consent, the three success arms replay / already done /
first run, five catches) · EFFECTS (commit on success, rollback on refusal, a refusal that still writes, the idempotency claim
and its race) · ANSWER (200 MeResponse, declared vs produced) · UNCAUGHT (500) · CLIENT (the screen reads status only; the
409 is collapsed). States: covered (a case proves status and detail, or the service raise) · partial (status only, or an
ambiguous join) · untested (no case reaches it) · unmeasured (no test can assert it today: effects, switch arms, provisions,
races) · gap (a contract or client gap the forms found). Tallies: EDGE 0/3 covered · GATE 0/5 · INPUT 0/3 (1 partial) ·
HANDLER 5/11 (3 partial) · EFFECTS 0/4 (1 gap) · ANSWER 0/2 (1 partial · 1 gap) · UNCAUGHT 0/1 · CLIENT 0/2 (2 gaps).
The parts ARE the endpoint form's slots (U3 guards · U7 refusals · K1 declared · U6 paths · U8 switches · U9 effects · U11
failure · U12 idempotency · K2 auth · K3 rate · K4 responses · schema cases · frontend reason) read in request order — that is
what makes the picture a STANDARD for the kind, repeatable on every door, and later a template for every other kind.

## The surface it lands on
Section 6 of the published Gabe Artifact `data-atlas.html` (house chrome: cog, roster, three skins; iconed pill title; the
12px floor; hover cards in the kit's style; series colours only from the kit's tokens; the page opens on the finished
picture — Replay is what runs any motion). Sections 1–5 already draw WHEN (a path walking the stages, the tables lighting),
WHICH (the heat matrix), THE TABLE (a tree), THE JOINS, NOT SHOWN YET. The robot must read in ~10 seconds with no
reading, and every hover must COMPRESS: a few rows, numbers first, one plain line.

## What a proposal must decide
1. THE PICTURE — one drawing, one idea: what physical thing is the door, what are its parts, how does "covered / not" show
   on a part at a glance (colour, fill, armour, light, health), how does request ORDER show (top→bottom or left→right).
2. THE PARTS — the eight (or a better cut of the same slots) with a plain line each.
3. THE HOVER — the compressed card per part (≤ 6 rows: what it is · conditions n · covered/partial/untested/unmeasured/gap
   counts · the one thing missing · the cases) and per condition (label · state · the cases · the plain line).
4. THE STATES — five words → five visual encodings that survive the three skins and print in greyscale.
5. MOTION — none, or one replayable thing that earns its place (a request assembling the robot? a QC stamp per part?).
6. WHY IT FITS the operator (bandwidth · scoring analogy · game console · sequential) and what it must NOT do.
