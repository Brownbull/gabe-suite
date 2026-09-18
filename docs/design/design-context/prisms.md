# Prisms — points of view (Gabe's definition, 2026-09-18)

**A prism is a point of view.** When we open an element of the graph we read it from several standpoints, and they cannot
be compressed into one view: things belong to different topics, points of view, prisms. (The suite also calls its authored
instrument pages "prisms" — a different thing. In these design documents, prism = point of view.)

What an element is, in Gabe's words: an API endpoint is a point — a function that touches different parts of the
application. Except for the data entities (store, schemas, models, databases), the rest is code that executes some kind of
function and writes, validates or calculates something. On that operation we want several standpoints.

## The depth rule

> Go into detail where things can change **the path, the data, the context, or the flow**. Anything else inside the loop is
> mentioned, never drilled.

## The standpoints Gabe named for an API endpoint

| prism (working name) | the question it answers, in his words | what the feed carries today | gap |
|---|---|---|---|
| **data effects** | what did we actually read and write, or modify, or create, or delete? | tables touched per path · op per step · the fate of each write (committed · maybe · rolled back · uncommitted) · provisions · races | the Data panel draws the union only; two tables (`users`, `ai_spend_log`) are touched and never drawn |
| **in-flight state** | what did we save temporarily — cache, or something ephemeral that was alive and important during the process? | the idempotency key's route through `request.state` · the auth context the gate builds · the client's cache seeds and invalidations | no general arm reads request-scoped or cached state — a generation gap, said here |
| **decision points** | what determines the different paths — what makes the response a 401, a 402 or a 200? | preconditions · deciding branches · switches · catches · the ordered chain per ending with which gate fired | complete for the handler and one call level; deeper calls are collapsed with a reason |
| **structures** | what structures are we using — the schema category | request shape · response shape per ending · (feed only: validation cases · mirrors) | validation cases and mirrors are in the feed, not in the lab's facts yet |
| **functions, by how crucial they are** | which functions face the API · which are the decision points (where the 401 / 402 / 200 is decided) · which touch the database · which give context to the others (authentication and so on) · and the little ones inside the loop, mentioned with their TYPE (formatting · capping · validation…) but never drilled | handler · walk levels · role (accessor · caller · gate · pure) · raises and refusals joined to the endings they become · commits | the helper TYPE (format · cap · validate…) is not classified today; "decision-point function" is derivable (a function whose raise or refusal becomes an ending) but not named |
| **coverage** | what are we covering, and what are we not covering? | case → ending joins with confidence · untested endings · unmeasurable conditions | effects, switch arms, provisions and races cannot be asserted by any test today |
| **context / security** | what gives context to the rest: authentication, limits | scheme · gate · provisions · limiters · the flag that turns them on | — |
| **reach outward** (widening) | where the ending surfaces on the screen | hook → screen → route → app · the reason site · cache effects | — |

These are CANDIDATES. Per the method, M1 (attribute × question) decides whether the real prisms differ from this list.

## Prism spec — to be filled one at a time, in the loop (template: the guide §10)

```
PRISM:      <name>
QUESTIONS:  the 2–5 questions it answers (ids from questions.md)
PROMOTES:   attributes brought to the face
CHANNELS:   hue → …   shape → …   length → …   motion → …
DIMS:       what fades to neutral
ALERT RULE: what counts as abnormal in this prism
ENTRY:      how it is switched on — a CONCEPT in the command panel, never a code
```
