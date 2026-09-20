# Attribute inventory — the API endpoint card as a whole (step 1 of the loop)

Ruled: 2026-09-18

Loop 1 runs on the endpoint card as a whole (Gabe, 2026-09-18). **The importance ratings below are RULED by Gabe** — he rated
the agent's proposal on the rating sheet (`rate-endpoint.html`, inventory 05cdd08f) and pasted the result back: 3 changed
(file:line 2 → 1 · signature 1 → 2 · deciding branches gained the alert), 39 confirmed, 1 left as proposed (own guards), and
one more moved by his own rule (request-scoped state 2 → 1, D-013). Rows whose rating says **(proposed)** were added after
his pass and are still the agent's proposal. His notes, and the answers to the questions in them, are at the foot of this file.

**Second ruling, 2026-09-19 (D-016):** on the evaluation of what M1 left over he dropped two rows (steps in the longest chain ·
usage · fan-in), demoted three (entity · cluster · rate limit · journeys), kept four (provisions · race · cases · signature — the
last against the agent's advice), and marked ten of eleven pieces of work "do". The rows those pieces add are below, each
marked **(proposed)** until he rates it; a row whose facts are not carried yet says which piece brings them.
`m1-round1.inventory.md` is the frozen copy M1 round 1 read; this file is the living one.

Rating rule, from his depth rule: **3** = it can change the path, the data, the context or the flow · **2** = it gives context
to something that does · **1** = mentioned, never drilled. "An alert" = quiet at rest, shown on the face only when the value
is abnormal. Cardinalities are MEASURED over the 80 gustify endpoints (arms-on feed, 2026-09-17; the four set-in-motion rows
2026-09-18): min · median · max. "First visible at" is the zoom level where it should first appear: far (face) · mid · near ·
tooltip · portrait. The channel column stays empty until M3 (the channel budget).

## Identity

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| method + path | category + text | 1 | **3** | the door's name — every question starts from it | no | own | far |
| entity · cluster | category | 1 | 1 | DEMOTED 2026-09-19: the crumb he already navigates by — navigation, never a content row (the home evidence underneath may earn a row later) | no | relation | tooltip |
| declared status | category | 1 | 2 | the promise — it matters only beside what is produced | no | own | mid |
| file:line (on every block, not only the handler) | text | 1 per block | 1 | "can I open it?" (Q15) — a data point for blocks, details and hovers, never the face (Gabe); piece 8 carries the missing definition lines | yes | own | tooltip |
| risk flag | state | 0–1 | 2 — an alert when abnormal | a verdict from size; quiet at rest (P2) | yes | own | far, as an alert |
| signature (async · lines · returns) | quantity + text | 1 | 2 | async is worth a mark (Gabe); KEPT as a row 2026-09-19 against the agent's advice (every endpoint of this app is async, so the mark separates nothing here — it would in the largest study app, 34 of 545) | yes | own | mid for the async mark; portrait for the rest |

## Endings and decision points — what determines the path

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| kinds of ending (success · refusal · framework · validation · uncaught) | category | 2–5 kinds | **3** | the command's vocabulary — concepts, not codes; the behaviour at a glance | with code | own | far |
| the endings (paths) | relation list | 2 · 9 · 22 | **3** | the endings ARE the behaviour | with code | own | mid |
| the stage an ending leaves from | order (1 of 8) | 1 per ending | **3** | position gives the structure quickly (D-007) | with code | own | far / mid |
| the ordered chain per ending (the eight kinds of step, in request order) | order (relation list) | 4 · 14 · 22 | **3** (proposed) | the chain IS the flow, and every later fact attaches to one of its steps; already in the lab's facts (piece 1) | with code | own | near |
| the checks met, in run order (passed · fired) | order (relation list) | 0 · 6 · 10 on an endpoint's longest route (0 · 4 · 10 over all 743 routes) | 2 (proposed) | order and the passed marks give context to the check that fired | with code | own | mid |
| the route that passes every check (and the check each other route fires) | relation | 1 per endpoint | **3** (proposed) | the through-route the exceptions are exceptions to; how often a route is really taken cannot be read from code | with code | own | mid |
| the predicate per decision point (with the deeper raises the route does not translate) | text + relation | to measure when piece 6 lands | **3** (proposed) | what determines the path, in the author's words | with code | relation | near |
| status code per ending | category + text | 2 · 7 · 11 distinct | 2 | specific — the middle's filter, never the command | with code | own | mid |
| own guards (preconditions) | relation | 0 · 1 · 16 (18 doors none) | **3** | they change the path | with code | own | mid; predicate near |
| deciding branches (callee arms that change the exit) | relation | 0 · 0 · 8 (65 doors none) | **3** when present — an alert | they change the path one call down; they are forks ON an ending's route, never a fifth list (see the notes) | with code | relation | mid |
| catches (translate · swallow · pass through) | relation | 0 · 1 · 8 | **3** | where a failure becomes a status — or disappears | with code | own | mid / near |
| switches (binding · value · flag) | relation | 0 · 2 · 4 | 2 | configuration changing behaviour — context | with config | relation | near |

## Effects — the database, and what the endpoint sets in motion beyond it

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| tables touched | relation | 0 · 6 · 18 | **3** | the first standpoint Gabe named | with code | relation | far as a count; mid as blocks |
| operation per table (read · write · both; add · update · delete) | category | 1 per table | **3** | it changes the data | with code | relation | mid (on the block) |
| fate of the writes per ending (committed · maybe · rolled back · uncommitted) | category | 0 · 2 · 46 write steps | **3** | whether the data change survived | with code | own | mid, once a label is in force |
| the moment a table is touched (stage · step) | order | 1 per touch | 2 | the question that started this (Q1); the stage grouping already says most of it | with code | own | mid / near |
| provisions (rows created before the handler) | relation | 0–1 | 2 | a side effect people do not expect | with code | relation | near |
| race on a unique key (the endpoint's own · the gate's counted apart) | state | handled · uncaught | **3** if uncaught, else 1 | an uncaught race is an alarm (P2); counted on the endpoint's own code it fires on 11 of 80 endpoints, not 79 (piece 4) | with code | own | far only as an alert |
| idempotency claim | relation | 0 · 0 · 1 (74 doors none) | 2 | changes what a repeat does | with code | own | near |
| how this table was found (map access edge · route effects · both) | category | 1 per table; 0 · 4 · 7 tables per endpoint are known to a route's steps only (79 of 80 endpoints have one) | 2 (proposed) | provenance on a row that is already a 3; two tables here are known to the route effects only (piece 4) | with code | relation | near |
| events published (the event · the handlers subscribed to it) | relation | 1 of 80 endpoints publishes; 1 event, 2 handlers, both can be dropped | **3** when present (proposed) | other code runs because this endpoint ran — the flow leaves the request | with code | relation | mid; an alert when a handler can be dropped |
| tasks dispatched (background work that outlives the answer) | relation | 0 of 80 here (the app has no queue); 63 task roots in the largest study app | **3** when present (proposed) | work continues after the client has its answer | with code | relation | mid |
| outside services called (an LLM, an identity provider, a payment API) | relation | 1 drawn in the app (gemini) | **3** when present (proposed) | a call that can fail, cost money and add seconds — it can change the path | with code | relation | mid |

## In-flight state — ephemeral but alive during the process

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| request-scoped state (a key set by middleware, the auth context) | relation | partial in the feed | 1 | later steps depend on it — but today every known instance already rides on another row (D-013) | with code | relation | near — **feed gap: no general arm reads it** |
| client cache effects (keys invalidated · seeded) | relation | per hook | 2 | what the screen refetches after the answer | with code | relation | near |
| in-flight values (request-scoped · process-scoped: where set · where read · when it dies) | relation | to measure when piece 11 lands | 2 (proposed) | the general reading D-013 waits for; the request-scoped row above folds into it | with code | relation | near — **feed gap: needs a new generation part (piece 11)** |

## Structures

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| request shape | relation | 0–1 | 2 | what must come in | with code | relation | mid (block) |
| response shape per ending | relation | 2 · 9 · 22 | 2 | what each ending answers with | with code | relation | mid / near |
| delivery (one answer · a stream) | category | 1 of 80 endpoints streams | 2 (proposed) | a stream changes what the client must do with the answer | with code | own | mid |
| response headers per ending | relation | 0 · 2 · 5 endings per endpoint send one (1 endpoint sends none) | 2 (proposed) | what the client is told to do next — a 429 says when to retry, a 401 names the login scheme | with code | own | near |
| field rules of the request body (required · length · range · allowed values) | relation | to measure when piece 8 lands | 2 (proposed) | the rule beside the field, so a shape stops being a list of names | with code | relation | near |
| validation cases (the 422 rules) | relation | 1 · 4 · 42 over 42 of 80 endpoints | 2 | decision points at INPUT; already in the lab's facts — the old note was out of date (piece 3). The evaluation proposes a 3: each case produces an ending | with code | relation | near |

## Functions — by how crucial they are

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| the handler (API-facing) | relation | 1 | **3** | the function facing the API | with code | own | far / mid |
| decision-point functions (their raise or refusal becomes an ending) | relation | app-wide 30 raise · 50 refuse | **3** | where the 401 / 402 / 200 is decided | with code | relation | mid — derivable today; named when piece 6 lands |
| roles per function (faces the API · decides an ending · touches the data · gives context) | category list | to measure when piece 6 lands | **3** (proposed) | a function wears its highest role; a mark when one function holds two | with code | relation | mid |
| data-touching functions (commit · read · write) | relation | app-wide 51 commit | **3** | they change the data | with code | relation | mid |
| context-giving functions (authentication · session · settings) | relation | 0 · 1 · 2 gates + deps | 2 | they give context to the rest | with code | relation | mid (GATE) |
| little helpers, with a TYPE (format · cap · validate…) | relation | many | 1 | mentioned, never drilled | with code | relation | tooltip — **the type is not classified today** |
| functions behind · walk levels | quantity | 1 | 1 | reach | yes | relation | tooltip |

## Coverage, context, client, findings

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| coverage per condition (covered · partial · untested · unmeasured) | state | act calls 0 · 2.5 · 44 (20 doors none) | **3** | "what are we covering, and what not" | with tests | relation | far as one fraction; mid as marks |
| cases (C-ids) | relation | per ending | 2 | the proof itself | with tests | relation | near |
| what the case asserts on this condition (status · detail · code · other) | relation | to measure when piece 5 lands | **3** (proposed) | what a coverage word means; with it, the values tests give a switch's setting | with tests | relation | near |
| case role on this endpoint (act · arranged · helper-arranged · service-raises) | category | 1 per case | 2 (proposed) | whether a test came here on purpose or only passed through (piece 5) | with tests | relation | near |
| workflow step (prev · next in the named walk) | relation | few | 1 | DEMOTED 2026-09-19: one line of before and after stays a tooltip; the broad tests that only pass through go to the far view | slow | relation | tooltip |
| auth scheme + gate | category | 0 · 1 · 2 | 2 — **3 when ABSENT on a write door** | the anomaly is the alarm, not the 401 | with code | relation | mid; alert when absent |
| rate tier (tighter · standard · exempt) | category | 23 · 56 · 1 endpoints | 1 | DEMOTED 2026-09-19: the cap never changes what the code decides; the tier rides on the 429 ending with the cap as its detail | with config | relation | near |
| app band (middleware) | relation | 3 on every door | 1 | saturated — it separates nothing | slow | relation | tooltip |
| who fetches it (hook → screen) | relation | 1–n | 2 | where the ending surfaces | with code | relation | mid |
| can the client tell the endings apart | state | per reason site | **3** when collapsed, else 1 | an alarm when two meanings share a status | with code | relation | alert only |
| findings | state list | 2 · 2 · 6 | alarm channel only | colour is an alarm (P2): the anomalies the guide names, never a 4xx by itself | with code | own | far, only when abnormal |
| how common this piece is (endpoints in this app · apps of the four) | quantity | to measure when piece 7 lands | 2 (proposed) | rarity says where to look, and it is the whole of the Standard or specialist prism | with code | relation | mid |
| where this endpoint sits in the app (rank · median · the largest) | quantity | 1 | 2 (proposed) | a position in a distribution is context; a single risk score would be a grade and is not built | with code | relation | mid |
| why this slot is empty (measured zero · not read here · not applicable) | state | 1 per slot | **3** (proposed) | whether every other empty row on the card can be believed (piece 2) | with the map | own | far |
| expected slots at this stage (the norm for the kind) | text | 6 stages × 6 topics | 2 (proposed) | a norm for the kind of element, never a grade of this one (piece 2) | slow | own | tooltip |
| what the screen does on this ending (message · retry · redirect) | relation | to measure when piece 10 lands | **3** (proposed) | a retry repeats the whole route and a redirect leaves the screen | with code | relation | mid — **feed gap: needs a new generation part (piece 10)** |

## The face this inventory suggests (a proposal for loop 1, to be varied one fader at a time)

Four on the face, plus the alarm: **method + path · the kinds of ending as a tiny strip · tables touched with their operation ·
one coverage fraction** — and an alert badge only when something is abnormal. Everything rated 2 appears at mid or near;
everything rated 1 lives in a tooltip or the portrait.

## Gabe's notes on the ratings (2026-09-18), and the answers

His words are quoted from the pasted ratings text. The answers are the agent's.

- **file:line 2 → 1** — "Files and the location of some function or the definition of something in a file are some data points or
  elements that we might show in blocks or in detail, even in hover sections." Applied: tooltip and detail, never the face.
- **signature 1 → 2** — "async might be something to highlight, and might implicate a related behavior like other function or code
  that will be subscribed to that async action." Applied. One correction of fact: in this stack `async def` on a handler only
  means it can wait on the database or the network without blocking the server; nothing subscribes to it. The thing he
  describes — other code that runs because this endpoint ran — exists and was MISSING from this inventory: an event the
  endpoint publishes and the handlers subscribed to it, a task it dispatches, an outside service it calls, a streamed answer.
  Four rows were added for it, marked (proposed), for him to rate.
- **deciding branches +alert**, and the same question on **catches** and **switches** — "This might be something that complements
  the endings … or is something different?" · "this might fall into the category of the endings or paths, or I'm confusing
  something, or I'm missing a dimension here." No dimension is missing, and he is not confusing anything: they complement the
  endings. An ENDING is where a request stops and with what answer. Own guards, deciding branches, catches and switches are
  the DECISION POINTS — the forks that choose which ending happens. Every ending is one route through the forks, and the feed
  already knows which fork leads to which ending (a guard names its exit, a branch its return, a catch its paths, a switch
  the exits it gates). The four kinds differ only in WHERE the fork sits: in the handler's own code (guard) · one call down
  (deciding branch) · on a failure only (catch) · set before the request arrived, by configuration (switch). Consequence for
  the design: decision points are drawn ON an ending's route — "what made it end this way" — never as four more lists beside
  the endings. The alert he set on deciding branches is recorded; the abnormal case the agent proposes for it is a branch whose
  arms differ in what gets committed (the feed's `commit-differs`), to be confirmed by him.
- **risk flag** — "Agree with this but I'm not sure how this would change the navigation." It does not change navigation inside
  a card. It is a mark on the FAR view (the graph, a list of endpoints) that says which endpoint to open first; on the card
  it is an alert badge, present only when the endpoint is unusually large.
- **kinds of ending** — "These families might be constants here in the API endpoint and later in other elements, so we will still
  show them even if they are empty. They might surface some kind of flag or warning." Logged as D-012: five fixed slots, an
  empty kind drawn hollow, an unexpected empty raised as an alert.
- **request-scoped state** — "Maybe it might be a 1 since it's just information, but if there is some important information that
  we can have by having this as a 2 (so we can filter something that is important), we might keep it as a 2." By his rule it is
  a 1 today (D-013): the three instances the feed knows — the auth context, the idempotency key, the database session — already
  ride on rows rated 2 or 3 (context-giving functions · auth scheme + gate · idempotency claim · fate of the writes), and no
  generation arm reads request-scoped state in general, so nothing can be filtered by it yet.
- **own guards** — left untouched on the sheet; the proposed 3 stands, unconfirmed.

## The second ruling (2026-09-19) — what M1 left over

Pasted from `gaps-endpoint.html` (eval c2f7f9c5), every line his.
- **Work:** do 1 The route, in order · 2 What an empty slot means · 3 What each ending carries · 4 Whose write it is · 5 Proof you
  can open · 6 Inside the calls · 7 How common each piece is · 8 Field rules, and a line to open (the agent said later) · 10 What
  the screen does on each ending (the agent said later) · 11 What stays alive during the request (the agent said later).
  **Later:** 9 Why a touch happens, and why it survives.
- **Attributes:** keep provisions · race on a unique key · cases · signature (the agent said demote); demote entity · cluster ·
  rate limit · journeys; drop steps in the longest chain · usage · fan-in (its count heads the who-fetches-it row).
- Rows added above are **(proposed)** until he rates them on `rate-endpoint.html`. When the ten pieces have landed and the new
  rows are rated, M1 runs a second round on the larger inventory (the guide: a new attribute re-enters at step 1).

