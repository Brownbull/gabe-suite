# Backend Journeys — the verified walk catalog

Eight representative backend write-journeys, mined from the Universe station's own drawn
graph (endpoint → calls heat → red access wire → model), then **verified hop-by-hop against
gustify source** by a 13-agent workflow (9 narrators · 3 adversarial refuters · 1 coverage
critic). All eight narrations came back CONFIRMED; the ninth slot (J9, the invisible-write
class survey below) was CORRECTED — 3 fabricated claims caught by the refuter, the class
itself real.

Data: the committed example estate (`c4-graph.js` + `levels.json`) after the **write-path
enrichment** (`_a3_levels.py` §3b). Before it, 26 of 31 write endpoints reached a drawn red
terminal; after it, **31/31** — the five invisible-write endpoints all resolved.

## How to read a walk (the station grammar)

- **Green→orange calls wire** = hops-to-a-write of the TARGET fn (orange = at the write).
- **RED access wire** = the actual ORM write, accessor → model. **Pink** = read.
- **A warm node (orange or amber) with NO red wire** has exactly three causes — learn
  them once:
  1. **Commit boundary** — holds `session.commit()`; its own ORM footprint is zero or
     near-zero (the writers hang one hop deeper). `complete_setup` and most route handlers
     — though `complete_setup` does carry one UPDATE of its own, the household rename.
  2. **Delegating writer** — no ORM op of its own, forwards to the real writer one hop
     down (`_upsert_exploration`, amber at d2w 1 → `upsert_exploration_preferences`, the
     D109 shared path).
  3. **Writer to an UNDRAWN model** — the write is real but its model class is absent from
     the archmap census, so no red wire can land (`_upsert_subscription` →
     SubscriptionEntitlement, `_stamp_completion` → SetupCompletionState, idempotency-key
     rows, `ShoppingItem` in J6). Archmap-coverage debt on the twin, not a graph bug.
- **Double-click** a node = reveal + light its one-hop neighbourhood; walk a chain by
  double-clicking hop after hop. Boot ("critical") keeps the whole write fabric visible —
  fns with d2w or access ops never fold as solo helpers.

## In the station — three journey kinds (2026-08-27)

The journeys picker (topbar) now carries five tabs; the first two are new:

| Tab | Source | Order |
|---|---|---|
| **workflows** | `workflows.js` beside the center data — `window.GABE_WORKFLOWS = [{name, steps:["METHOD /path"…], note}]`, the operator's user stories (gustify: initial setup · look for recipes · filter · cook · store ingredients · locations · shopping · plan) | each endpoint's backend chain, in the curated order; unmapped endpoints counted on the row |
| **backend** | derived at view time from the fn feed the map already carries (`_FNLINKS`: handler · calls · fnwrites/fnreads · **depends · dispatches**) — one chain per endpoint, 81 on gustify | BFS by hop, write path leading within a hop, each writer's models right after it; **the handler's gate deps walk FIRST at Hop 0.5, and a publisher's dispatched handler continues the trace** |
| end-to-end · by-entity · aggregated | `det.test_journeys` — one test case's COVERAGE SET (every element it touches) | entity-by-entity, then by name — not an execution order |

While a walk is live, the **step note** (top-centre over the graph) says what the current step is:
kind · entity · what the piece does (role · hops-to-a-write · reads/writes · gates · behind) ·
`Hop k` and how you got here (called / written by / read by / **gate — runs before the handler body** /
**dispatched — the event bus routes here after a publish**) · the docstring's first line. Everything
in it is derived from the map; nothing is curated prose. The trail chips in the right panel keep a fixed
size and wrap into rows; a middle-click on an entity chip in the picker solos that entity.

A journey walk PINS its steps past the legend's critical solo-fold (`window.__uniPin`), as does every
reveal (ghost click, double-click) — a read-path helper on a chain is never an invisible step.

## The catalog

| # | Journey | Shape | Drawn chain |
|---|---------|-------|-------------|
| J1 | `POST /setup/complete` | **Idempotent commit-boundary orchestrator with fan-out upserts** — the template | 13 fns / h3: handler → `complete_setup` (boundary) → 5 `_upsert_*` red terminals at h2 + the 6th via the h3 exploration delegation |
| J2 | `DELETE /me` | **Hard-delete cascade with an external-identity tail** — wipe + commit FIRST, then Firebase identity delete | `delete_account`@h1 → 5 models, one hop, five red wires |
| J3 | `POST /cooking/sessions/{id}/complete` | **Domain-event completion** — state flip + 2 append-only ledgers + leftovers→pantry, then a second commit for the event handler | `complete_session`@h1 → 4 models; `clear_pending_…`@h2 → Notification |
| J4 | `POST /cooking/sessions` | **Idempotent aggregate-create with a conditional schedule seed** (long-prep) | `start_session`@h1 → CookingSession; `_schedule_next`@h3 → CookingStageReminder |
| J5 | `POST /pantry/items` | **Event-sourced CRUD** — inventory row + immutable "compra" ledger event, back-linked | `add_pantry_item`@h1 → PantryItem + IngredientHistoryEvent |
| J6 | `POST /shopping/items/{id}/confirm-bought` | **Cross-entity domain event with audit trail** — bought item → NEW PantryItem (create, never increment) + ledger | `confirm_bought`@h1 → 2 red wires (the ShoppingItem bulk-UPDATE writes an undrawn model) |
| J7 | `POST /recipe-creation/manual` | **Aggregate write with an idempotency envelope** — root + 2 child collections + request ledger in a SAVEPOINT | `create_recipe_manual`@h1 → 4 models |
| J8 | `POST /consent` | **Minimal append-only compliance** — server stamps the policy version, newest row wins, nothing ever updated | `record_consent`@h1 → ConsentRecord |

Walk J1 to see every grammar element at once: endpoint → `setup_complete` (amber, d2w 1) →
`complete_setup` (orange boundary, no red) → double-click → the upsert fan (orange, red
wires to five preference models) → `_upsert_exploration` (amber delegator) → double-click →
`upsert_exploration_preferences` (the sixth red terminal, at h3, two files away).

## Systemic findings (verified, deferred with triggers)

1. **`commits` conflates flush** — `_a3_code.py` `_ORM_COMMIT = {"commit","flush"}`: every
   flushing service fn wears `commits: true`, though gustify's contract is services
   flush / the HTTP edge commits (six narrators corrected it, refuters confirmed). The
   d2w anchor verdicts survive (those fns hold real write ops), but the flag mislabels
   the boundary. *Fix: split the flag (`commits` vs `flushes`) in `_a3_code` + orm-access
   battery. Trigger: next `_a3_code` session.*
2. **Undrawn-model class** — ShoppingItem, SubscriptionEntitlement, SetupCompletionState,
   IdempotencyKey, AiSpendLog… are absent from the archmap census → invisible to C2 ops,
   red wires, and endpoint rollups (J2's rollup says 5 models, source writes 7; J6 loses
   its state transition). *Fix: archmap coverage on the twin (center.config.json), then
   regen. Trigger: next gustify adoption session.*
3. **Rollups under-count nested/event writes** — J3's completion also writes SkillProgress
   + NodeProgress via the synchronous `CookedMealCreated` handler; setup's transaction also
   writes Household/Membership/Location. The rollup is a floor, and now the drawn chain
   (post-enrichment) shows more than the rollup on some endpoints. *Documented here; no
   action until the rollup's REACH recipe is revisited.*
4. **Auth writes on EVERY request** — `build_auth_context` get-or-creates the User and
   COMMITS before any handler body runs (auth/context.py:79). No journey covers it; it is
   the one write path with no endpoint of its own.

## The gap audit (2026-08-27) — hops the source takes that the map does not draw

Seven classes, ranked by workflow reach; evidence + fixes in the artifact **Trace Anatomy**
(`https://claude.ai/code/artifact/a58e4089-789b-4ef6-932a-0c27b7614a30`), measured by a 7-lens
workflow (36 confirmed findings, 1 refuted) over gustify source + the committed map:
1. **Files no entity claims** — 55/150 backend files, 238 fns, 13 endpoints, 23 schemas
   (`services/ownership.py` carries setup's first write; `reference/resolution.py` the allergen
   reads). The model census, generalised to files.
2. **ORM idioms the access pass cannot see** — unit-of-work writes, column/join reads (23
   readers drawn pure), query-bound deletes mislabelled as http sinks.
3. **The dependency path** — `Depends(get_auth_context)` commits a User on every request and
   feeds a method gate on 47 handlers; drawn as a name, never a hop.
4. **The response leg** — schema→model has no edge kind; request/response share one `touches`.
5. **Event bus** — `bus.publish(CookedMealCreated)` → progression writers, invisible to graft.
6. **Writes with no request root** — lifespan seeders, sandbox reseed, migrations, SSE persist.
7. **Idempotency claim mislabelled** — falls out of 1 + 2.
Raw SQL cleared (41 `text()` sites, 0 app-table writes). Fixes are NOT built — operator picks.

## The critic's five missing journeys (future catalog slots)

1. The auth/identity provisioning commit that rides every request (GAP 1, 100% of traffic).
2. Pure-read journeys — `GET /recipes/explore` (the heaviest read composition) — the
   catalog currently implies the backend is all writes.
3. `POST /recipe-creation/gustify` — the only external-spend shape (credit gate → LLM →
   persist), J9 covered only its SSE tail.
4. The seed/ops write lane (`seed_catalogs_on_startup`) — where the production recipe
   corpus actually comes from; the user-facing creation path is 403-walled.
5. `POST /recipes/demand` — the founder-designated live alternative to gated creation,
   the only route with its own rate-limit clock.

## Provenance

- Mining: `scratchpad/mine-journeys.py` over the committed estate (deterministic BFS —
  endpoint → drawn calls → access ops), before/after the enrichment.
- Verification: workflow `wf_93af8aa1-7dc` (13 agents, gustify read-only), verdicts in the
  session record. Refuter catches: J9's "services/recipe_creation.py does not exist"
  (it exists, 195 lines) and "relief-accept is 403-walled" (only the SSE stream is).
- Walk proof: `verify-backend-journeys.mjs` (14 checks — boot visibility, template hops,
  band-0 orange, red wire, the three-step double-click walk).
