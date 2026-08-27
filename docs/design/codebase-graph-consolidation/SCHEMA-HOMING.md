# Schema Homing — census · cause · correction · the nested fold (2026-08-27, DRAFT, not built)

> Operator ask (order-of-work item 1): the 8 schemas whose only connections leave their entity —
> list every case (cross-cluster too), explain why, propose the correction (config and/or an
> emitter homing rule), and a display fold with a COUNT badge like the functions' critical fold.
> Status: LANDED 2026-08-27 (operator "land it") — commit 1 homing (emitter + S12 + batteries + estate), commit 2 fold + badge (station + proof). Measured on the committed gustify example estate
> (`templates/center/shell/example/codebase-graph-station/{c4-graph.js,levels.json}`) by
> `scratchpad/schema-homing.py` (pure read; reproduce by re-running it).
> Artifact: **Schema Homing** 🏠 `https://claude.ai/code/artifact/f1994c49-f28e-4516-bcc5-8be3a8cb861a` — builder
> `artifacts/schema-homing.build.py` (kit + content → page; `GABE_ART_OUT=<dir> python3 …` then the two gates, republish by `url:`).

HANDLE — a schema lives where its CONSUMER lives, not where its FILE was claimed.
VALUE — 14 schemas move to the entity that reads/writes/nests them (allergen 7→0 · progression
21→14 · auth 1→11 · settings 2→5 · legal-consent 0→1); 34 nested-only schemas fold into 14 parents
under `critical` (123 → 89 schema nodes at boot); zero ambiguous cases on gustify.

## (a) The census — every case

**All-leave (8)** — every wire crosses the entity boundary (the operator's list, confirmed):

| schema | config home | its only wires | resolved home |
|---|---|---|---|
| DietaryProfileInput · HouseholdFormatInput · NotificationPreferencesInput · PrivacyPermissionsInput · UserFormatInput | allergen | `nests` ← auth's `SetupCompleteRequest` | **auth** |
| ExplorationPreferencesInput | allergen | `nests` ← SetupCompleteRequest (auth) · `touches` ← PATCH /settings/exploration (settings) | **settings** (the endpoint consumer outranks the nest) |
| ExplorationPreferencesPatch | allergen | `touches` + `consumes` ← PATCH /settings/exploration | **settings** |
| AccountExportResponse | progression | `touches` ← POST /account/export | **legal-consent** |

**Transitive (6 more)** — a schema with NO endpoint wire whose parents all resolve elsewhere, plus two
parents the all-leave test missed because their own children co-home with them in `responses.py`:

| schema | config home | why it moves | resolved home |
|---|---|---|---|
| MeResponse | progression | `touches` ← GET /me · POST /setup/complete (both auth) | **auth** |
| UserSummary · HouseholdSummary · MembershipSummary · PreferencesSummary | progression | nested ONLY by MeResponse → follow the parent | **auth** |
| SettingsResponse | progression | `touches` ← GET /settings · PATCH /settings/{household,preferences,exploration} | **settings** |

Total (as measured on wires): **14 re-home · 0 ambiguous · 6 unwired · 103 stay** (of 123). Landed (with
function consumers): 14 re-home · 7 ambiguous (the shared Blocks + SubscriptionSummary — several
functions in auth/settings/progression build them) · 2 unwired, both dormant. The 6 unwired (MarkReadRequest,
ProfileProjectionResponse, DegradedReadResult, ExchangeConfig, ReceiptIngestRequest, ReceiptIngestResult)
have no wire at all — nothing to home by; they stay and are reported, not moved.

**Cross-cluster (use-case core), 56 rows, three classes:**
1. **The 14 movers** — every one has NO use-case in its config home (`levels.json pieces[ent].usecases`
   is keyed by the entity's own endpoints/classes, so a schema only foreign endpoints touch lands in
   the station's "other" blob). After homing, 12/14 join one use-case (`setup/complete`, `me`,
   `settings/*`, `account/export`); the 7 shared blocks below stay "other".
2. **Nested-only helpers with no use-case (20)** — BatchItemInput, ComplexityBucket, the 7 Blocks,
   RecipeIngredientInput/StageInput/StepInput, ResetDecisionInput, GustifyUsage… — their parent has a
   use-case, they do not. The fold (c) removes them from the field; not a homing defect.
3. **Shared response shapes inside ONE entity (5)** — PantryItemResponse (`pantry/overview` ← 4
   `pantry/items` endpoints), CookingSessionResponse, ShoppingItemResponse, CupoResponse,
   StageReminderResponse: consumed by several use-cases of their own entity; the levels emitter keeps
   the FIRST use-case seen. Correct home, arbitrary cluster — report only, no action (a multi-use-case
   schema has no single cluster; the station's use-case core is decoration, nodes do not move).

**Fold survivors after homing (7)** — DietaryBlock, ExplorationBlock, HouseholdFormatBlock,
NotificationBlock, PrivacyBlock, UserFormatBlock, SubscriptionSummary: nested by parents that resolve to
DIFFERENT entities (PreferencesSummary→auth · SettingsResponse→settings · ProfileSummaryResponse→
progression). Multi-parent = ambiguous → they stay in progression (`responses.py`), flagged. They are
nested-only, so under `critical` they fold into whichever parent is revealed — their home stops
mattering visually, which is why the fold and the homing ship together.

## (a′) The six unwired — dug deeper (operator ask, 2026-08-27)

Two causes, neither a missing entity:

**Cause U1 — an unclaimed ROUTE file (cooking's pair).** `MarkReadRequest` and
`ProfileProjectionResponse` are consumed only by `api/notifications.py` (4 routes: `GET /notifications` ·
`POST /notifications/mark-read` · `POST /notifications/delete` · `GET /profile/projection`,
`api/notifications.py:28-82`), and that file is one of the 8 route files no entity claims. Cooking claims the
notification SCHEMAS (`schemas/notification.py`), SERVICES (`services/notifications.py`) and MODELS
(`Notification`, `ProfileProjection`) — the route file alone was missed. Gap class 1 (unclaimed files).
*Fix: config — add `apps/api/api/notifications.py` to `cooking.code.api`.* Effect: +4 of the 13 missing
endpoints, both schemas wired (`MarkReadRequest` consumed by two endpoints, `ProfileProjectionResponse`
the `resp` of `GET /profile/projection`), `NotificationListResponse` gains its endpoint. Note: the
`/profile/projection` path sits in progression's URL domain while its service and model are cooking's —
the S9 entity-shape angle will flag the cross-domain route; report only, home stays cooking.

**Cause U2 — a DORMANT integration lane with no root (pantry's four).** `schemas/gastify.py` is the
Gustify ↔ Boletapp catalog-exchange CONTRACT ("Phase 10 — structure only. No live HTTP executes this phase
(D43 — Gastify not ready)", `schemas/gastify.py:1-14`; `integrations/providers.py:76-80` `get_gastify_ingest_adapter`
→ "P2 wiring (D43)"). The lane exists end-to-end in source and has NO endpoint: `get_boletapp_receipt_client`
(`integrations/gastify_exchange.py:100`, usage 0) takes `ExchangeConfig`; `ingest_receipt_items`
(`services/receipt_ingest.py:24`, usage 0, `returns: ReceiptIngestResult`) writes `ReceiptIngestLog` +
`AdminReviewQueue` — the two models the model census still lists as unclaimed
(`models/admin_review.py`, "file not in any entity's models list" — the owed "2 admin-lane models' home").
`ReceiptIngestRequest` and `DegradedReadResult` have no non-test reference at all: contract-only DTOs until P2.
So four unwired schemas, two unclaimed models and two uncalled service functions are ONE lane, invisible for one
reason: the map's only root class is a request handler, and this lane has no request yet.

| schema | consumer in source | why the map sees nothing | fix |
|---|---|---|---|
| MarkReadRequest | `POST /notifications/mark-read` · `/delete` (body) | route file unclaimed | config: claim `api/notifications.py` → cooking |
| ProfileProjectionResponse | `GET /profile/projection` (`response_model`) | route file unclaimed | same |
| ExchangeConfig | `_RealBoletappReceiptClient(config=ExchangeConfig())` — a service-layer constructor | consumer is a FUNCTION, not a handler; consumer scan is handler-body-only | fn→schema `takes` wire (needs param types in `fn_insight`, ~10 lines) |
| ReceiptIngestResult | `ingest_receipt_items(...) -> ReceiptIngestResult` | same; `function_insight[*].returns` ALREADY carries it | fn→schema `returns` wire — zero new source read |
| ReceiptIngestRequest | none outside tests | contract-only until P2 | stays `unwired`, tagged `dormant` |
| DegradedReadResult | none outside tests | contract-only until P2 | stays `unwired`, tagged `dormant` |

**Is it a missing entity or cluster?** Not an entity — the ADR makes the lane pantry's (receipt items
auto-populate the pantry; the admin review queue is "Gustify-owned"). It is a missing **root class**: the
levels use-case core is endpoint-keyed, so a lane with no endpoint can never cluster, and the write-path
BFS never reaches it. That is Trace Anatomy class 6 ("writes with no request root") meeting class 12
(feature flags: `settings.gastify_ingest_provider` walls it) — the coverage-class fix map (item 2) owns the
root-class fix; homing owns the reporting.

**What homing does with them, revised:**
1. Config (twin, 2 lines): claim `api/notifications.py` → cooking; claim `models/admin_review.py` → pantry
   (closes the 2 unclaimed models too). U1 disappears; the lane's models become drawable.
2. Emitter, additive (~25 lines): the homing rule's consumer set widens from "handler names it" to
   "handler OR a claimed function returns/takes it" — `function_insight[*].returns` is already there;
   `params` types are a small `fn_insight` addition. `ReceiptIngestResult` and `ExchangeConfig` get a home
   by their function's entity (pantry — unchanged) and a WIRE (`returns` / `takes`, floor-grade), so they
   stop being unwired. This also closes the "consumer detection is a floor" gap for service-consumed schemas.
3. Report: a schema with no wire after (2) and a file docstring / provider flag naming a deferral is tagged
   `dormant` (not just `unwired`) in `stats.schema_homing`; the S12 line reads "2 dormant (gastify contract,
   provider not wired)". Nothing hidden, nothing invented.

## (b) Why — and the correction

**Cause.** `center.config.json` claims schema FILES per entity, and a file is one entity's:
`allergen.code.schemas = [apps/api/schemas/preferences.py]` (claimed because the allergen MODELS live in
`models/preferences.py`), `progression.code.schemas = [apps/api/schemas/responses.py]` (a cross-cutting
response file, 22 classes / 21 drawn, claimed by the entity that happened to adopt it). `_a3_code.collect_entity_map`
parses every class in the claimed file and stamps `entity = slug` (`_a3_code.py:616`); `_a3_graph._l2`
builds the schema node under that slug; the cross-entity `nests`/`consumes`/`touches` resolvers
(`_a3_graph.py:999-1041`) then draw the wires that LEAVE — the archmap always knew the consumer, the
home never asked it. Source proof: `schemas/setup.py:11` imports the six `*Input` classes into
`SetupCompleteRequest`'s fields (`:21-42`); `api/user_settings.py:23` imports the exploration pair;
`api/setup.py:18` imports `MeResponse`; `api/account.py:19` imports `AccountExportResponse`.

**Why config alone cannot fix it.** A file-level claim cannot split `preferences.py` (5 classes → auth,
2 → settings) or `responses.py` (4 targets). A class-level allowlist (`schemas_cls`, like `models`) could —
but it is a hand-maintained list that drifts the day a schema is added (the no-remembered-process ruling),
and the model census just ruled "config decides ownership, never existence" for FILES; for schemas the
honest ownership signal is structural and already parsed.

**The correction: an emitter HOMING RULE at the archmap seat** (option A, recommended).

```
home_schemas(entities)  — _a3_code, ~60 lines, pure, deterministic, called once in
build_center_a3.py right after `entities` is assembled (:1962), BEFORE the C4/levels/data-model
consumers read it:
  consumers[s] = { slug : an endpoint of slug names s in touches ∪ touches_x ∪ resp }   # floor by design
  parents[s]   = { p : a field TYPE of schema p names s }                                # the nests source
  resolve(s):  |consumers|==1            → that slug                     why: consumed-by:<slug>
               consumers=∅ ∧ parents≠∅  → the ONE slug all parents resolve to (recursive, cycle-safe)
                                                                           why: nested-in:<parent>
               otherwise                → config home, unchanged        why: ambiguous | unwired | own
  move the schema dict between entities[*]["schemas"]; stamp {"homed_from": <slug>, "why": …} on it;
  return stats {moved:[…], ambiguous:[…], unwired:[…]} → amap["schema_homing"] (report-never-gate)
```

- **Provenance carried**: the schema node's card shows "homed from allergen — consumed by auth";
  `c4.stats.schema_homing = {moved, ambiguous, unwired}`; pulse angle **S12 "schema homing"** prints the
  moved/ambiguous line every beat (same rail as S11), so a new schema landing in the wrong file is seen
  without anyone remembering to look.
- **Config untouched** — the file lists stay the ownership claim; the rule only decides the GRAPH home of
  a class the claim could not place. A class both consumed and nested (ExplorationPreferencesInput) follows
  the ENDPOINT (a route is a stronger ownership signal than a composition).
- **Honest-empty**: a project whose schemas are all consumed in-entity moves nothing → byte-identical.
- **Measured effect (gustify)**: 14 moved · 0 ambiguous · 6 unwired. Entity schema counts: allergen 7→0
  (allergen becomes a pure aspect for schemas too — consistent with the 2026-08-20 allergen reduction),
  progression 21→14, auth 1→11, settings 2→5, legal-consent 0→1. Cross-entity wires: `touches` 11→2 ·
  `consumes` 1→0 · `nests` 6→**15** — up, not down: the 7 shared Blocks stay in progression (multi-parent)
  while two of their three parents moved away, so each of those parents now reaches across. Those 15 are
  nests wires to nested-only schemas, i.e. exactly the wires the fold (c) hides under `critical`. LANDED
  numbers (`c4.stats.schema_homing`): **moved 14 · ambiguous 7 · unwired 2 (both dormant)** — the five
  `*Input` movers resolve by the FUNCTION consumer (`fn-consumed-by:services/setup.py#_upsert_*`, auth)
  before the nest rule even runs; endpoints 67→72 once the twin claims `api/notifications.py` +
  `api/history.py`; census-unclaimed models 2→0 (`models/admin_review.py` claimed); `schema_edges` 76
  (16 returns · 16 takes · 44 uses).
- **Blast radius**: every consumer of `entities[slug]["schemas"]` agrees at once — C4 (`_a3_graph`),
  levels `schema_owner` (`_a3_levels.py:418-427`), the data-model page (`_a3_code`), `gabe-cc-entity`
  (3 reads) — no page contradicts the universe. Regen: gustify archmap + the committed example estate
  (c4-graph.js · levels.json · levels.js; `regen-example.sh`). Re-pin: none expected — `tests/arch-graph`,
  `tests/levels` and `tests/gabe-universe` pin synthetic fixtures / no per-entity schema count (grepped);
  the estate diff is the only moving artifact, its numbers go in the commit message. Size: `_a3_code` +60 · `build_center_a3` +4 · `_a3_graph` +6 (stats) · `angles.py` +30
  (S12) · batteries: `tests/orm-access` or `tests/arch-graph` +3 cases (move · ambiguous-stays ·
  honest-empty, mutation-proven) · `tests/pulse-angles` +1.

Options weighed — one recommendation:
- **A · archmap-level rule** (above): every page agrees; +~100 lines; one regen per twin. **Recommended.**
- **B · C4-only rule** (`_a3_graph.build_c4_graph` pre-pass): ~40 lines, no archmap change — but the
  entity's Code tab still lists MeResponse under progression while the universe draws it under auth;
  `schema_owner` in levels disagrees with c4. Rejected: two homes for one class.
- **C · config class-list**: zero suite code; hand-maintained, silent drift, cannot be reported. Rejected.

## (c) The display fold — nested-only schemas collapse into their parent with a COUNT badge

Mirror of the functions' critical fold (`__uniComputeSolo`, `parts/layout.js:2069`):

- **Rule**: a schema with ≥1 `nests` wire IN and ZERO `touches`/`consumes`/`resp` wires in is a
  **nested-only schema** → `n.__solo = true` under the schema kind's `critical` state; `visN` already
  hides `__solo` nodes unless pinned (`layout.js:1221`) — no new gate. Multi-parent nested-only schemas
  (the 7 shared blocks) fold too. Recursive by construction: PreferencesSummary (nested-only) folds into
  MeResponse and its own 6 blocks fold with it (MeResponse subtree = 11).
- **Second clause, not `_SOLO_REL`**: the function fold asks "single caller of my kind"; the schema fold
  asks "no wire but composition" — a separate predicate in `__uniComputeSolo` (~6 lines). Schemas gain a
  real `critical` state in the legend (today `__uniKindHasSolo("schema")` is false, so the schema row cycles
  ALL→OFF; after: ALL→CRITICAL→OFF), and the BACKEND master's `critical` default (`_kindDefault`) folds
  them at boot — consistent with "everything critical-capable boots CRITICAL".
- **The COUNT badge**: `__badgeGlyph(c, "count", n)` — the schema disc colour + the digit(s) drawn with
  `fillText` (the one glyph source, `layout.js:1970`; legend-visual law: the badge key popup paints the
  same fn onto a DOM canvas). Attached in `buildNode` beside method/role (`assemble.py:444`) for
  `n.kind==="schema" && n.__foldN>0`; rides `_mbTick` like every badge (opacity/size/offset controls
  apply). Count = the DIRECT nested-only children hidden under this node:

  | parent | direct nests | **folded (badge)** | subtree |
  |---|---|---|---|
  | ProfileSummaryResponse | 7 | **7** | 7 |
  | SettingsResponse | 7 | **7** | 7 |
  | PreferencesSummary (itself folded into MeResponse) | 6 | **6** | 6 |
  | SetupCompleteRequest | 6 | **5** | 5 — ExplorationPreferencesInput is also touched by PATCH /settings/exploration, so it stays visible |
  | MeResponse | 5 | **5** | 11 |
  | ManualRecipeCreate | 3 | **3** | 3 |
  | GustifyCreationResponse | 3 | **2** | 3 |
  | 7 single-child parents (CatalogPublishResponse, CreateBatchRequest, DishHistoryListResponse, GeneratedCandidateOut, NotificationListResponse, ReceiptItemsResult, ResetApplyRequest) | 1 | **1** | 1 |
  | RecipeDetailResponse | 5 | **0 → no badge** | its 5 nests are all endpoint-touched |

  34 schemas fold · 14 parents wear a badge · 123 → 89 schema nodes at boot.
- **Un-fold gestures — all exist today**: double-click the parent → `__uniRevealNeighbors` pins the 1-hop
  set (`layout.js:480`), the kids appear with their nests wires; search → `__uniGoto` pins the hit; a
  journey walk pins its steps; Esc / re-cycling the legend re-folds. The parent's card already groups
  "nests N" in the connections expander (`card.js:156`) — the group label gains "(N folded)".
- **Proof**: `verify-schemafold.mjs` (~80 lines, solo-sequential): boot schema count 89 · badge sprites
  14 · SetupCompleteRequest badge reads "5" · double-click reveals 5 kids · Esc re-folds · legend schema
  row cycles ALL→CRITICAL→OFF · the badge-key popup shows the count swatch. Static pins in
  `tests/gabe-universe/run.sh`: the second solo clause present, `count` in `__badgeGlyph`, the attach line.
- **Size**: `parts/layout.js` ~25 · `assemble.py` ~6 · `parts/card.js` ~3 · proof ~80 · static pins +4.
  No emitter change, no regen — the fold reads wires the map already carries.

## Order + decisions

Land as two commits, homing first (it changes the numbers the fold's proof pins):
1. `feat(center): schema homing — a schema lives where its consumer lives` (A + S12 + batteries + gustify
   regen numbers in the message).
2. `feat(universe): nested-only schema fold + count badge` (station only + proof).

```
DECISION: homing seat
CHOSE: archmap-level rule (A) over C4-only (B) and a config class-list (C)
ASSUMED: one class must have ONE home across every center page; the file lists stay the ownership claim
BREAKS IF: a twin wants a schema drawn under its FILE's entity regardless of consumer — then a
          config `schemas_pin: [cls]` escape hatch (5 lines) reinstates the file home per class
```
```
DECISION: badge semantics
CHOSE: badge = FOLDED direct children (what is hidden here) over badge = nests fan (SetupCompleteRequest
       reads 5, not 6)
ASSUMED: the badge answers "how many did the fold hide", so it disappears when nothing folds
BREAKS IF: the operator wants the composition SIZE regardless of visibility — then the fan count,
          always shown, one-line change
```
```
DECISION: multi-parent nested-only schemas
CHOSE: stay in the config home + flagged `ambiguous` (7 on gustify) over duplicating the node per parent
ASSUMED: a shared block is genuinely cross-cutting; the fold hides it under every parent anyway
BREAKS IF: a walk needs the block's own node visible across entities — the reveal pins it, no dup needed
```

Not expanded: the S12 angle text · the `schemas_pin` escape hatch · the badge glyph geometry (digit
size at 128²) — say which to dig into.
