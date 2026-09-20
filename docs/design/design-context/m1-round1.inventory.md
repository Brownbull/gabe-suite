<!-- FROZEN 2026-09-19: the inventory exactly as M1 round 1 saw it (47 attributes). gen-matrices.js reads THIS file. The living inventory is inventory-endpoint.md. Do not edit. -->
# Attribute inventory — the API endpoint card as a whole (step 1 of the loop)

Ruled: 2026-09-18

Loop 1 runs on the endpoint card as a whole (Gabe, 2026-09-18). **The importance ratings below are RULED by Gabe** — he rated
the agent's proposal on the rating sheet (`rate-endpoint.html`, inventory 05cdd08f) and pasted the result back: 3 changed
(file:line 2 → 1 · signature 1 → 2 · deciding branches gained the alert), 39 confirmed, 1 left as proposed (own guards), and
one more moved by his own rule (request-scoped state 2 → 1, D-013). Rows whose rating says **(proposed)** were added after
his pass and are still the agent's proposal. His notes, and the answers to the questions in them, are at the foot of this file.

Rating rule, from his depth rule: **3** = it can change the path, the data, the context or the flow · **2** = it gives context
to something that does · **1** = mentioned, never drilled. "An alert" = quiet at rest, shown on the face only when the value
is abnormal. Cardinalities are MEASURED over the 80 gustify endpoints (arms-on feed, 2026-09-17; the four set-in-motion rows
2026-09-18): min · median · max. "First visible at" is the zoom level where it should first appear: far (face) · mid · near ·
tooltip · portrait. The channel column stays empty until M3 (the channel budget).

## Identity

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| method + path | category + text | 1 | **3** | the door's name — every question starts from it | no | own | far |
| entity · cluster | category | 1 | 2 | where it lives; context, not behaviour | no | relation | mid |
| declared status | category | 1 | 2 | the promise — it matters only beside what is produced | no | own | mid |
| file:line | text | 1 | 1 | "can I open it?" (Q15) — a data point for blocks, details and hovers, never the face (Gabe) | yes | own | tooltip |
| risk flag | state | 0–1 | 2 — an alert when abnormal | a verdict from size; quiet at rest (P2) | yes | own | far, as an alert |
| signature (async · lines · returns) | quantity + text | 1 | 2 | async is worth a mark (Gabe); lines and return type stay detail | yes | own | mid for the async mark; portrait for the rest |
| usage · fan-in | quantity | 1 | 1 | reach, not behaviour | yes | relation | tooltip |

## Endings and decision points — what determines the path

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| kinds of ending (success · refusal · framework · validation · uncaught) | category | 2–5 kinds | **3** | the command's vocabulary — concepts, not codes; the behaviour at a glance | with code | own | far |
| the endings (paths) | relation list | 2 · 9 · 22 | **3** | the endings ARE the behaviour | with code | own | mid |
| the stage an ending leaves from | order (1 of 8) | 1 per ending | **3** | position gives the structure quickly (D-007) | with code | own | far / mid |
| status code per ending | category + text | 2 · 7 · 11 distinct | 2 | specific — the middle's filter, never the command | with code | own | mid |
| own guards (preconditions) | relation | 0 · 1 · 16 (18 doors none) | **3** | they change the path | with code | own | mid; predicate near |
| deciding branches (callee arms that change the exit) | relation | 0 · 0 · 8 (65 doors none) | **3** when present — an alert | they change the path one call down; they are forks ON an ending's route, never a fifth list (see the notes) | with code | relation | mid |
| catches (translate · swallow · pass through) | relation | 0 · 1 · 8 | **3** | where a failure becomes a status — or disappears | with code | own | mid / near |
| switches (binding · value · flag) | relation | 0 · 2 · 4 | 2 | configuration changing behaviour — context | with config | relation | near |
| steps in the longest chain | quantity | 4 · 14 · 22 | 1 | a size, not a decision | yes | own | tooltip |

## Effects — the database, and what the endpoint sets in motion beyond it

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| tables touched | relation | 0 · 6 · 18 | **3** | the first standpoint Gabe named | with code | relation | far as a count; mid as blocks |
| operation per table (read · write · both; add · update · delete) | category | 1 per table | **3** | it changes the data | with code | relation | mid (on the block) |
| fate of the writes per ending (committed · maybe · rolled back · uncommitted) | category | 0 · 2 · 46 write steps | **3** | whether the data change survived | with code | own | mid, once a label is in force |
| the moment a table is touched (stage · step) | order | 1 per touch | 2 | the question that started this (Q1); the stage grouping already says most of it | with code | own | mid / near |
| provisions (rows created before the handler) | relation | 0–1 | 2 | a side effect people do not expect | with code | relation | near |
| race on a unique key | state | handled · uncaught | **3** if uncaught, else 1 | an uncaught race is an alarm (P2) | with code | own | far only as an alert |
| idempotency claim | relation | 0 · 0 · 1 (74 doors none) | 2 | changes what a repeat does | with code | own | near |
| events published (the event · the handlers subscribed to it) | relation | 1 of 80 endpoints publishes; 1 event, 2 handlers, both can be dropped | **3** when present (proposed) | other code runs because this endpoint ran — the flow leaves the request | with code | relation | mid; an alert when a handler can be dropped |
| tasks dispatched (background work that outlives the answer) | relation | 0 of 80 here (the app has no queue); 63 task roots in the largest study app | **3** when present (proposed) | work continues after the client has its answer | with code | relation | mid |
| outside services called (an LLM, an identity provider, a payment API) | relation | 1 drawn in the app (gemini) | **3** when present (proposed) | a call that can fail, cost money and add seconds — it can change the path | with code | relation | mid |

## In-flight state — ephemeral but alive during the process

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| request-scoped state (a key set by middleware, the auth context) | relation | partial in the feed | 1 | later steps depend on it — but today every known instance already rides on another row (D-013) | with code | relation | near — **feed gap: no general arm reads it** |
| client cache effects (keys invalidated · seeded) | relation | per hook | 2 | what the screen refetches after the answer | with code | relation | near |

## Structures

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| request shape | relation | 0–1 | 2 | what must come in | with code | relation | mid (block) |
| response shape per ending | relation | 2 · 9 · 22 | 2 | what each ending answers with | with code | relation | mid / near |
| delivery (one answer · a stream) | category | 1 of 80 endpoints streams | 2 (proposed) | a stream changes what the client must do with the answer | with code | own | mid |
| validation cases (the 422 rules) | relation | feed only | 2 | decision points at INPUT | with code | relation | near — **not in the lab's facts yet** |

## Functions — by how crucial they are

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| the handler (API-facing) | relation | 1 | **3** | the function facing the API | with code | own | far / mid |
| decision-point functions (their raise or refusal becomes an ending) | relation | app-wide 30 raise · 50 refuse | **3** | where the 401 / 402 / 200 is decided | with code | relation | mid — derivable, **not named in the feed** |
| data-touching functions (commit · read · write) | relation | app-wide 51 commit | **3** | they change the data | with code | relation | mid |
| context-giving functions (authentication · session · settings) | relation | 0 · 1 · 2 gates + deps | 2 | they give context to the rest | with code | relation | mid (GATE) |
| little helpers, with a TYPE (format · cap · validate…) | relation | many | 1 | mentioned, never drilled | with code | relation | tooltip — **the type is not classified today** |
| functions behind · walk levels | quantity | 1 | 1 | reach | yes | relation | tooltip |

## Coverage, context, client, findings

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| coverage per condition (covered · partial · untested · unmeasured) | state | act calls 0 · 2.5 · 44 (20 doors none) | **3** | "what are we covering, and what not" | with tests | relation | far as one fraction; mid as marks |
| cases (C-ids) | relation | per ending | 2 | the proof itself | with tests | relation | near |
| journeys · workflow step | relation | few | 1 | context | slow | relation | tooltip |
| auth scheme + gate | category | 0 · 1 · 2 | 2 — **3 when ABSENT on a write door** | the anomaly is the alarm, not the 401 | with code | relation | mid; alert when absent |
| rate limit | category | 0 · 1 · 2 | 1 — 2 when absent on a sensitive door | context | with config | relation | near |
| app band (middleware) | relation | 3 on every door | 1 | saturated — it separates nothing | slow | relation | tooltip |
| who fetches it (hook → screen) | relation | 1–n | 2 | where the ending surfaces | with code | relation | mid |
| can the client tell the endings apart | state | per reason site | **3** when collapsed, else 1 | an alarm when two meanings share a status | with code | relation | alert only |
| findings | state list | 2 · 2 · 6 | alarm channel only | colour is an alarm (P2): the anomalies the guide names, never a 4xx by itself | with code | own | far, only when abnormal |

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
