# Attribute inventory — the API endpoint card as a whole (step 1 of the loop)

Loop 1 runs on the endpoint card as a whole (Gabe, 2026-09-18). **The importance ratings are the agent's PROPOSAL with a
reason each — Gabe corrects them.** Rating rule, from his depth rule: **3** = it can change the path, the data, the context or
the flow · **2** = it gives context to something that does · **1** = mentioned, never drilled. Cardinalities are MEASURED over
the 80 gustify doors (arms-on feed, 2026-09-17): min · median · max. "First visible at" is the zoom level where it should
first appear: far (face) · mid · near · tooltip · portrait. The channel column stays empty until M3 (the channel budget).

## Identity

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| method + path | category + text | 1 | **3** | the door's name — every question starts from it | no | own | far |
| entity · cluster | category | 1 | 2 | where it lives; context, not behaviour | no | relation | mid |
| declared status | category | 1 | 2 | the promise — it matters only beside what is produced | no | own | mid |
| file:line | text | 1 | 2 | "can I open it?" (Q15) | yes | own | tooltip |
| risk flag | state | 0–1 | 2 — an alert when abnormal | a verdict from size; quiet at rest (P2) | yes | own | far, as an alert |
| signature (async · lines · returns) | quantity + text | 1 | 1 | detail | yes | own | portrait |
| usage · fan-in | quantity | 1 | 1 | reach, not behaviour | yes | relation | tooltip |

## Endings and decision points — what determines the path

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| kinds of ending (success · refusal · framework · validation · uncaught) | category | 2–5 kinds | **3** | the command's vocabulary — concepts, not codes; the behaviour at a glance | with code | own | far |
| the endings (paths) | relation list | 2 · 9 · 22 | **3** | the endings ARE the behaviour | with code | own | mid |
| the stage an ending leaves from | order (1 of 8) | 1 per ending | **3** | position gives the structure quickly (D-007) | with code | own | far / mid |
| status code per ending | category + text | 2 · 7 · 11 distinct | 2 | specific — the middle's filter, never the command | with code | own | mid |
| own guards (preconditions) | relation | 0 · 1 · 16 (18 doors none) | **3** | they change the path | with code | own | mid; predicate near |
| deciding branches (callee arms that change the exit) | relation | 0 · 0 · 8 (65 doors none) | **3** when present | they change the path one call down | with code | relation | mid |
| catches (translate · swallow · pass through) | relation | 0 · 1 · 8 | **3** | where a failure becomes a status — or disappears | with code | own | mid / near |
| switches (binding · value · flag) | relation | 0 · 2 · 4 | 2 | configuration changing behaviour — context | with config | relation | near |
| steps in the longest chain | quantity | 4 · 14 · 22 | 1 | a size, not a decision | yes | own | tooltip |

## Data effects — read, write, modify, create, delete

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| tables touched | relation | 0 · 6 · 18 | **3** | the first standpoint Gabe named | with code | relation | far as a count; mid as blocks |
| operation per table (read · write · both; add · update · delete) | category | 1 per table | **3** | it changes the data | with code | relation | mid (on the block) |
| fate of the writes per ending (committed · maybe · rolled back · uncommitted) | category | 0 · 2 · 46 write steps | **3** | whether the data change survived | with code | own | mid, once a label is in force |
| the moment a table is touched (stage · step) | order | 1 per touch | 2 | the question that started this (Q1); the stage grouping already says most of it | with code | own | mid / near |
| provisions (rows created before the handler) | relation | 0–1 | 2 | a side effect people do not expect | with code | relation | near |
| race on a unique key | state | handled · uncaught | **3** if uncaught, else 1 | an uncaught race is an alarm (P2) | with code | own | far only as an alert |
| idempotency claim | relation | 0 · 0 · 1 (74 doors none) | 2 | changes what a repeat does | with code | own | near |

## In-flight state — ephemeral but alive during the process

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| request-scoped state (a key set by middleware, the auth context) | relation | partial in the feed | 2 | later steps depend on it | with code | relation | near — **feed gap: no general arm reads it** |
| client cache effects (keys invalidated · seeded) | relation | per hook | 2 | what the screen refetches after the answer | with code | relation | near |

## Structures

| attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at |
|---|---|---|---|---|---|---|---|
| request shape | relation | 0–1 | 2 | what must come in | with code | relation | mid (block) |
| response shape per ending | relation | 2 · 9 · 22 | 2 | what each ending answers with | with code | relation | mid / near |
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
