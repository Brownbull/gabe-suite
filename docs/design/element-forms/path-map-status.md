> **Status record, 2026-09-14.** Produced by the read-only workflow `wf_7386cabb-9d6` (4 readers · a completeness critic that re-read the files · a synthesizer) after element forms phases 0–3 landed, answering: *is the shallow path map generated, what fields exist, what is missing, and how do paths become commands in the endpoint lab?* The critic's corrections are applied. Nothing here is built; section 4 and section 7 are the proposed order.

# Shallow path map for POST /setup/complete: status, fields, gaps, panels

Path abbreviations used throughout:
- **S** = `/home/khujta/projects/gabe_lens`
- **GEN** = `S/templates/center/generators`
- **L** = `S/docs/design/workflow-panel`
- **G** = `/home/khujta/projects/apps/gustify`
- **C** = `G/docs/site/center`

## 1. STATUS

The shallow path map is only half generated. The half that exists is refusals: `C/forms.json` holds all 8 refusal exits of POST /setup/complete (429×2 · 401×2 · 422 · 400 · 409×2) plus the uncaught 500. For each one it records the guard (`pred` · `after` · `when` · `scope`), file:line, which catch translated which raise (`source: verified/unverified`), and the framework defaults, version-gated to FastAPI 0.136.3.

The half that does not exist is paths as objects:
- **Success exits are dropped.** A `return` becomes a row only when it builds a Response with a status (`GEN/_a3_paths.py:373-377`). First setup has no trace at all. Replay and Already-set-up survive only as negated text inside `after` lists.
- **No switches.** The `auth_provider` switch lives only as two levels.json `binds` edges. The credit-tier branch is in no feed.
- **No per-path data or tests.** There are no per-path effects, no commit or rollback positions, and no per-path tests.
- **Rows have no ids.** The only identity is a dedupe tuple that moves with line numbers (`_a3_paths.py:878`).
- **forms.json has no `head` stamp,** unlike the other three feeds.
- **The lab can't see it.** `L/gen-endpoint-facts.py` reads only the frozen example feed (`:29`), and that feed has no forms.json.

The slots that would finish the map are only partly planned:
- U6 Paths is designed (`S/docs/design/logic-map/element-forms.html:501`) but is not in plan Phase 4 (`S/docs/design/element-forms/plan.md:274-286`) or in `_a3_forms.KINDS` (which holds only U3 · U7 · K1).
- U8 Switches (`:503`) and K4 Response-per-exit (`:521`) are in no phase either.

## 2. NEW FIELDS AVAILABLE

All examples are `endpoints["endpoint:POST /setup/complete"]` in gustify's committed forms (gustify `05007957`), unless marked otherwise.

### forms.json · envelope
Top-level keys are exactly `endpoints · framework · kind · present · stats · version`. There is no `head`.

| field | tells | example |
|---|---|---|
| `version` · `present` · `reason` | registry version; whether the pass produced forms; why not | `1` · `true` · absent |
| `kind` | element kind formed (endpoints only) | `"endpoint"` |
| `framework.name` / `.locks` | framework + locked version per lock file | `"fastapi"` / `{"apps/api/uv.lock":"0.136.3"}` |
| `stats.endpoints` · `rows` | forms built · produced rows feed-wide | `80` · `577` |
| `stats.findings` | finding id → endpoints carrying it | `escape-500 8 · reason-lost 11 · shared-status 21 · text-only 80 · undeclared 80` |
| `stats.unknown_rows` · `unknown_reasons` | rows the source could not tell | `0` · `{}` |
| `stats.unresolved_calls` | handler calls naming an import that resolves to no repo def. Feed-wide only; per-endpoint exposure is unmeasured. | `50` |
| `stats.collisions` · `unformed` · `unknown_middleware` | keys needing `variants` · handlers not found · unregistered middleware | `0` · `0` · `[]` |

### forms.json · per endpoint

| field | tells | example |
|---|---|---|
| `entity` | owning claim slug | `"auth"` (4 auth endpoints: DELETE /me · GET /healthz · GET /me · POST /setup/complete) |
| `handler` / `levels_id` | join keys to archmap `function_insight` / levels `fn_nodes` (handler only) | `apps/api/api/setup.py::setup_complete` / `…#setup_complete` |
| `method` · `path` · `file` · `line` · `full_path` | route identity. `line` is the decorator. | `POST` · `/setup/complete` · `setup.py` · **183** · `/api/v1/setup/complete` |
| `declared.success` / `.response_model` / `.refusals` | what the decorator declares | `{200, default}` / `{MeResponse, defined}` / `[]` |
| `produced[]` | every exit found, in phase order | 9 rows (429, 429, 401, 401, 422, 400, 409, 409, 500) |
| `preconditions[]` (U3) | guards whose branch ends in a refusal: `pred · status · at · depth` + `after · via · dep · kind` | `key is None`→400 @setup.py:193 d0 · `IN_PROGRESS`→409 @services/setup.py:348 d1 · consent→409 @services/setup.py:374 d1. Both d1 rows carry `via "call complete_setup @ apps/api/api/setup.py:196"`. |
| `findings[]` | `{id, slot, …}` convention and client-handling findings | `text-only n5 (U7)` · `shared-status 409 ["consent required","setup in progress"] (U7)` · `undeclared [400,401,409,429] (K1)` |
| `slots.U3` / `.U7` / `.K1` | slot state + counts. U7 always excludes the uncaught row (`_a3_paths.py:900`). | `{defined, rows 3}` / `{missing, rows 8, unknown 0}` / `{missing, declared [], produced [400,401,409,422,429]}` |
| `variants` · `state`/`reason` | collisions · an unformed endpoint | absent |

### forms.json · per `produced[]` row

| key(s) | tells | example on this endpoint |
|---|---|---|
| `phase` | middleware · security · dependency · validation · handler · uncaught | all six occur |
| `status` · `state` | code; defined / default / unknown | 400/409/429 and dep-401 `defined`; security-401, 422, 500 `default` |
| `detail` · `form` · `code` | refusal text, its shape (text · object · enum · const · dynamic · expr · default-phrase), stable machine code | `"Idempotency-Key required"` `text` · 429 `object` · 422 `code "pydantic error type"` |
| `at` · `depth` | exit location; 0 = handler body, 1 = one call/dependency | 400 @setup.py:193 d0 · **409s @api/setup.py:200 and :202, d0** (the translating `except`) · dep-401 @auth/context.py:99 d1 |
| `raised_at` · `source` | where the translated exception was raised; proof (`verified`/`unverified`) or framework-rule citation | 409s: `services/setup.py:348` / `:374`, `verified` · dep-401 `unverified` · security-401 `fastapi/security/http.py:87-92` |
| `via` · `dep` · `site` | how reached; walked dependency; middleware guard site | `except SetupInProgressError` · `auth/context.py::get_auth_context` · 429s `at rate_limit.py:127`, `site` :117 / :121 |
| `pred` · `after` · `when` · `scope` | enclosing guards; negated earlier exiting `if`s; middleware pass-through negation; path scope | 409s `after ["not (key is None)"]` · 429 `when "not (not self._enabled or request.url.path in EXEMPT_PATHS)"` · scope list incl. `/api/v1/setup/complete` / `"all"` |
| `params` · `in_loop` · `reason` | validation params · exit inside a loop · why unknown | `["body"]` · absent (12 elsewhere) · absent |
| `causes` · `unknown_causes` | uncaught only: project exceptions that escape / re-raises the pass cannot follow | `unknown_causes ["pass-through raise apps/api/services/setup.py:407"]` |

### gabe-map fields reading forms

| field | tells | notes |
|---|---|---|
| `touches <endpoint>` → `form` | a compact form: `slots · declared · refusals · refusals_note · uncaught{causes,unknown_causes} · preconditions · preconditions_note · findings` | Set at `skills/gabe-map/scripts/tools.py:413`. Each refusal keeps `phase status state detail code at via source raised_at pred scope reason` and drops `form · after · when · site · params · depth · dep · in_loop` (`mapquery.py:666-673`). |
| `trace` → `from_form` | `{slots, findings, preconditions, variants}` | Start endpoint only (`tools_wave3.py:121-125`). Default rels exclude `binds` (`:21`). |
| `map_census kind=forms` | `state · framework ·` the stats keys `· nag_named (≤12) · nag_note · text` | `tools_wave2.py:413-432` |
| `review_drift` subject `form` | `{ran, new_refusals, classified}`; `classified` rows add `why[]` | `tools_wave2.py:663-674`; `form_drift.py:183-207` |

### pulse / review

| field | tells | example |
|---|---|---|
| S20 `summary` = `endpoints · nag · count · nag_total · named · unknown_rows` | NAG = shared-status · reason-lost · escape-500 · http-swallowed; COUNT = text-only · undeclared · declared-unproduced (`form_drift.py:37-38, 77-95`) | Fires at `nag_total ≥ 3` (`angles.py:61, :814`). This endpoint contributes 1 nag (shared-status 409) and 2 counts. |
| review FORM DRIFT | a diff-added `raise HTTPException` that is text-only, shares a status with a different text refusal, or is undeclared | `skills/gabe-review/references/review-spec.md:360-366` |
| (defect) state-word inversion | The two readers name the same states in reverse. `mapquery.forms_block`: no file = `not_emitted`, `present:false` = `absent` (`mapquery.py:177-182`). `form_drift.load_forms`: no file = `absent`, `present:false` = `not_emitted` (`form_drift.py:54-63`). | small fix |

### Not in forms, but newly usable
- **gustify levels `fn_edges` with `rel:"binds"`:** 2 edges, carrying `port "TokenVerifier"`, `bind "selected"` and `pred "settings.auth_provider is ProviderMode.REAL"` / its negation, from `auth/context.py#build_auth_context`.
- **The example feed has 0 of them.**
- **c4-graph has 0 `pred` keys.**

## 3. COVERAGE OF THE DRAWN MAP

The map being checked is `S/docs/design/logic-map/shallow-logic-maps.html`.

### The 10 paths

| path | exit | state | where | missing |
|---|---|---|---|---|
| First setup | 200 | **missing** | only `declared.success` + `response_model` | success row (return services/setup.py:389), 11-table write set, commit :388 |
| Replay | 200 | partial (text) | `"not (claimed.outcome is ClaimOutcome.REPLAY)"` in both d1 preconditions' `after` | the arm (return :346), no-write effect |
| Already set up | 200 | partial (text) | `"not (existing is not None and prior is not None and prior.completed)"` in the consent precondition's `after` | the arm: `complete()` :360 → commit **:361** → return :362 |
| In progress | 409 | **represented** | produced 409 @api/setup.py:200 · `raised_at` services/setup.py:348 · verified · precondition d1 | "writes none" can't be claimed (auth commit, below) |
| Consent missing | 409 | **represented** | produced 409 @:202 · `raised_at` :374 · precondition with 3-item `after` | rollback + `_discard_claim` (services/setup.py:403-407) |
| No key | 400 | **represented** | produced + precondition @setup.py:193 d0 | — |
| Bad body | 422 | represented, coarse | validation row `params ["body"]` | which schema rule refuses (`schemas/setup.py:24-40`) |
| Bad token | 401 | **represented** (2 sub-paths) | security 401 (context.py:23) + dependency 401 `except InvalidTokenError` (:99, unverified) | the verifier switch (levels `binds` only) |
| Throttled | 429 | **represented** (2 sub-paths) | middleware rows with `scope` / `pred` / `when` | flag join (see note below) |
| Crash | 500 | partial | uncaught `unknown_causes [:407]` | what raises, rollback |

**Throttled flag join.** Join to `rate_limit_active = rate_limit_enabled or is_production` (`G/apps/api/config.py:248-254`, `rate_limit.py:98`). A name join to `flags.rate_limit_enabled` would be wrong. Throttling is off outside production only, not "off by default". `EXEMPT_PATHS` membership is also unresolved.

**Applies to every refusal path.** `build_auth_context` commits a user row (`auth/context.py:79`) before the handler runs. No feed records this, so no path may be drawn as "writes none". Today only the hand drawing shows it (`element-forms.html:609`).

### Step kinds

| kind | state | where / missing |
|---|---|---|
| step | missing | Calls feed callee resolution only (`_a3_paths.py:826-854`). A non-refusing call produces no row: CORS, IdempotencyMiddleware, load_household_context, name/stamp/`complete(key)`, and building MeResponse. |
| gate | represented when it refuses | `pred` / `when` / `scope` + `preconditions[]`. Callee internals below one level are never walked (`:834-854`); `_deps` doesn't follow calls (`:544-586`). DB constraints are absent. |
| branch | partial via `after` only | Arms as objects are absent. The NEW/abandoned claim arm and resolve_or_create_user known/new are not even text. |
| switch | missing in forms | `auth_provider` is only in gustify levels `binds`. The credit tier is in no feed: `_subscription_block`, `allowance_for` and `credits_summary` are **named** in c4 `behind.names` / LABEP `functions.walk[0][0].behind.names`, but the branch between them isn't. |
| catch | partial | Translating catches: `via` + `source` + `raised_at`. Swallowing catches: the `http-swallowed` finding. Pass-through catches: `unknown_causes`. What a catch does (rollback, discard, the IntegrityError race at `services/idempotency.py:141`) is absent. |
| collapsed | missing | no concept; `depth` 0/1 is the only nesting |
| commit | missing in forms | Only the per-function boolean `archmap.function_insight[fn].access.commits` exists. There are no positions (context.py:79 · services/setup.py:361 · :388). |
| exit | partial | refusals + 500 yes; success exits only as `declared.success` |
| R/W chips | missing per path | Per function only, in `function_insight[fn].access.ops` `{model,table,rw}`, with no line (`GEN/_a3_code.py:1762-1764`). ai_spend_log and the household-name write are in no feed. |
| flag chips | partial | Precondition `kind:"flag"` exists only on depth-0 guards on archmap-flagged lines: 3 feed-wide (recipe-creation), 0 here. |

**No per-path join exists.**
- Rows carry file:line, but `function_insight` has no start line.
- Rows have no ids.
- `trace` attaches `from_form` to the start node only.

## 4. STILL MISSING — ordered build list

Constraint (plan §0): archmap / c4 / levels stay byte-identical, so every generator item below writes only into forms.json. Suite generator changes need a draft review and an explicit "land it".

### A. Needed for the endpoint lab next

| # | item | adds | arm | effort | depends on |
|---|---|---|---|---|---|
| A1 | `head` stamp on the forms.json envelope | lab/tools can detect a cross-head join (forms vs LABEP `2d6fa5f6` vs gustify `3ce6aae0`) | `_a3_paths.py` envelope write (keys at ~:998-999) | XS | — |
| A2 | Lab reads forms: add `forms.json` + current `levels.json` to `regen-example.sh` FEEDS (`S/docs/design/codebase-graph-consolidation/universe-build/regen-example.sh:60`, which lacks forms and workflows.js); `gen-endpoint-facts.py` emits `LABEP.forms` | every FEED-tier command in §6 | lab generator + example regen | S | A1 |
| A3 | Stable ids on `produced[]` / `preconditions[]` (no line numbers in the key) | addressable command cells; survives line drift | `_a3_paths.py:878` (dedupe tuple today) | S | — |
| A4 | Success exits: keep terminal `return`/`raise` in handler + one call level | First / Replay / Already become rows | `_a3_paths.py:373-377`, call rows `:836-853` | S | — |
| A5 | Rate-limit flag join (`self._enabled` → `rate_limit_active`) + resolve `x in EXEMPT_PATHS` | true Throttled condition | `_a3_paths.py` middleware pass; `_path_prefixes :590-610` (startswith only) | S | — |
| A6 | Schema short form → 422 `cases[]` (bounds · `extra="forbid"` · `default_factory` · `_strip_name` validator · nested bounds) | Bad body splits into its real rules | forms schema short form (plan.md:283) | S (S–M with validators/nesting) | — |
| A7 | U11 failure handling (rollback, `_discard_claim` :403-407, IntegrityError race) | what a catch does | `_a3_paths.py` catch resolution ("mostly assembly", plan.md:277-278) | S–M | per-path placement needs A8 |
| A8 | **U6 `paths[]`**: middleware `when` ∧ dep row ∧ guard ∧ `after` ∧ call-site ∧ exit, id'd | paths as first-class objects | `_a3_paths.py` + U6 in `_a3_forms.KINDS` (`GEN/_a3_forms.py:30-36`). **Needs a plan amendment first** (not in Phase 4). | M | A3, A4 |
| A9 | U9 effects per path + commit positions | Data "on this path"; commit / rollback on the walk | line-carrying `_orm_access` variant used only by `_a3_paths` (ops have no line, `_a3_code.py:1762-1764`) | M | A8 |
| A10 | U14 tests per path: extract asserted status / detail + act/arrange role | exact test↔exit; removes the 14-case arrange over-credit | `_a3_tests.py:168-190` (keeps calls / names / http only; asserts exist at `G/apps/api/tests/test_setup_routes.py:28,79,91,126,161`) | M | A8 |
| A11 | U8 switches: join `binds` pred into forms; credit-tier branch | verifier + tier switches on the path | `_a3_paths.py` (+ levels read) | M | A8; no plan phase |
| A12 | U12 repeat safety · K4 response per exit (`element-forms.html:521`) · endpoint K2 auth scope / K3 rate window | idempotency, per-exit response, auth/rate facts | `_a3_paths.py` (plan.md:279 for U12; K4 in no phase; plan.md:277's "K2" is the SERVICE kind's, `element-forms.html:523`) | S–M each | A4 (K4), A8 (U12 per path) |

**Lab-side only, no generator:**
- Command-region plumbing: FRAME keys, CSS `order:4` (`_lab-ep.css:794-797`), `applyFrame`, `COPYTXT`, INV rows.
- Generalize `selectIn` beyond `[data-table]` (`endpoint-lab.html:2117`).
- Portraits for tests / widening / security (idle message at `:2094-2097`).
- Probe asserts beside the portrait block (`probe-eplab.mjs:741-754`).

### B. Later (other kinds)

| item | arm | effort |
|---|---|---|
| Middleware / dependency forms keyed by themselves, with `applies_to[]` (RateLimit paths exist only as copies in 80 endpoint forms) | `_a3_paths.py` `_middleware_exits` / `_deps` | S |
| Function / service forms with `reached_by[]` | `_a3_paths.py` | S (depth-1) · M (all) |
| Task / event roots (gustify: no tasks, 2 dispatch edges) | `_a3_paths.py` + `_task_registry` retry keywords | M |
| Model + settings short forms (nullable · server_default · ondelete · CheckConstraint; int/str settings, properties) | forms short forms (plan.md:283-284) | S–M |
| Phase 5 frontend pass: RequireSetup branches + `Navigate` targets; `useCompleteSetup` onSuccess invalidations (`useCompleteSetup.ts:28-45`); header allowlist (`lib/api/idempotency.ts:18`); SetupScreen status map. It would expose a real client bug: any 409 is read as "in progress" (`SetupScreen.tsx:43`). | `_a3_fe_extract.mjs` (today only `jsx/calls/types/idents/ctxArgs/storage/queryKeys`, `:113-142`) + `_a3_fe.py` | M–L |
| Phase 6 universe `formsSec` card row (both station copies) | station | M (plan.md:298-300) |

## 5. THE DATA PANEL

### What it consumes today
Source: example feed `c4-graph.js`, `levels.json`, `commits.js`, `workflows.js` (`gen-endpoint-facts.py:29, :53-56, :340`). The door is `ID = "endpoint:POST /setup/complete"` (`:52`).

| LABEP key | ← feed · field |
|---|---|
| `data.tables[]` {table, model, rw, entity, entity_color, cols, fks, uqs, cols_more, file, id} | c4 endpoint `access.ops[]` {table, model, rw} (`:98-103`) joined to the c4 `kind=model` node's `det.*` (`:97`); rw merged (`:110-114`). 13 tables. |
| `data.reads` / `writes` / `both` / `entities` | filters on `access.ops` (`:108-109`, `:343-344`). 13 / 11 / 11. |
| `data.commits` | c4 `access.commits` (`:342`). `true`. |
| `identity.entity` · `home_ev` · `models_home` | l2 slug · c4 `home_ev` · `c4.models.homes[view][ID]` (`:271-277`) |
| `security.idempotent` / `idempotency_table` | guessed from `access.ops` containing `idempotency_keys` (`:260-264`) |
| `git_touches.commits` · `feedwide.commits_on_feed` | `commits.js` (`:282, :289, :346`) |

The whole Data panel is a union over the call tree: it answers "the endpoint writes households", never "which path does".

### What forms.json adds to Data today
Honestly, nothing per table: forms holds no table facts. What it can give the Data panel:
1. **A per-exit veil.** Each exit's position (`at` · `depth` · `via` · `raised_at`) lets Data hatch "not measured per path" per exit instead of implying every table is written on every path.
2. **The uncaught 500's `unknown_causes`** as the rollback hint.
3. **A handler line fix.** `line: 183` replaces the source value the lab takes from `det.flines` (254 = file length; `ep-brief.md:42` cites `:254`).

Already in LABEP and usable without forms:
- `functions.walk[][].ops` / `.commits`, which give "who writes it / who commits".

Per-path writes, commit positions and rollback need A9 + A7.

### Where it plugs in
1. Add forms.json to `regen-example.sh:60` FEEDS. This keeps the one-feed law; pointing at gustify's live centre instead mixes heads.
2. In `gen-endpoint-facts.py`, load `EX/forms.json` beside the loads at `:53-56`.
3. Emit `LABEP.forms = forms["endpoints"][ID]`. The key string equals `LABEP.identity.id`.
4. Emit `LABEP.forms_head`, once A1 exists, and compare it to `LABEP.head`.
5. Point the identity source line at `forms.line`.

**Placement is unresolved.** Plan Phase 6 says rows go inside Security (U3) and Functions (U7), "not a seventh tab" (plan.md:301). The operator asked for the Data panel plus a command panel. Build the placement as a rail option, not a decision.

**Trap** (memory `journeys-dive.md`): `regen-example.sh --check` reverts uncommitted edits to the example page.

## 6. THE COMMAND PANEL

### What the original console said it was for
- `_archive/d-console.html:7-12`: "a command panel is not seven equal columns — it is a portrait, a stat block, a status display, an inventory, a record and a command card … The dock finally has an ACT half, not only a READ half."
- `_archive/d-console.html:28-34`: bottom-right corner, "two screen edges, the largest target, the highest click frequency … A verb this element cannot use **keeps its cell**."
- `g-console-25.html:7-13`: "far-right = ACTIONS (the command card) … The rule between EVIDENCE and COMMAND is … a LAW rather than a divider." `:349-350`: portrait beside command card, "what you are commanding, and what you can do."
- `CONSOLE-MAP.md:53`: "Fifteen-plus verbs exist as callable functions with no card"; `:162`: `LEFT = WORLD | CENTRE = INFORMATION | RIGHT = ACTIONS`.
- Contents: `_data.js:539-555`, 15 verbs all bound to the 3D station (FRAME · FOCUS · DEPTH± · NEIGH · CALLERS · BEHIND · TABLES · SCREENS · EXPAND · CLUSTER · ENTITY · WALK‹› · CLEAR). States lit · blank · grey · unmeas (`:532-537`).
- **Why it was dropped: no file says.** The only record is the preset text (`endpoint-lab.html:2125`). My inference: the 15 verbs act on a 3D field the lab doesn't have, and the lab kept only the look, as the part buttons (`:1889`).

**Tiers used below:**
- **LAB** = already in LABEP.
- **FEED** = committed in gustify; needs A2 (a `gen-endpoint-facts.py` change, not "just a read").
- **NEW** = needs generation from §4.

### Per-section command sets for POST /setup/complete

| section | LAB (today) | FEED (after A2) | NEW |
|---|---|---|---|
| Paths (cross-part) | — | 7 refusal paths from `produced` + `preconditions`; 401 and 429 each as two sub-paths; 500 from uncaught | First / Replay / Already (A4 + A8); names need a rule |
| Data | prev/next table (13) · Written/Read/Both · Record/Shape/Wheel/Keys portraits · follow FK · who writes it (`functions.walk[][].ops`) · the commit (`data.commits`) | per-exit veil (§5) | on this path (A9) · constraint → exit (model short form) |
| Schemas | prev/next shape · IN/OUT (`SCHCFG.dir`, `_lab-ep-panels.js:1654`) · response consumers (2) | response on this exit (`produced[].form/detail` + `declared.response_model`) · the 422 row | which rule refuses (A6) · response per exit (K4) |
| Functions | walk levels 3·16·5·1 · role filters · commits here | where it refuses: 400 at setup_complete; both 409s *translated* in setup_complete (api/setup.py:200/202, d0) and *raised* in complete_setup (preconditions d1, services/setup.py:348/374); 401 at get_auth_context · open source `line 183` · verifier switch (gustify `binds`, 2) | trim walk to path (fn_edges are unordered) |
| Tests | prev/next case (26) · status columns (name-parsed, `gen-endpoint-facts.py:188`: 200 [C1056,C1057] · 400 [C1048] · 404 [C605,C705] · 409 [C1055] · 422 [C1051,C1052] · 18 no code) · journeys 6 · workflow step | untested exits 401 · 429 · 500 (dashed) · 409 ambiguous (shared-status) | exact test↔exit (A10); a case portrait |
| Widening | climb useCompleteSetup → SetupScreen → SetupRoute → router → App · response consumers | — | client behaviour per exit; where the user lands (Phase 5); a rung portrait; prev/next workflow step is blank (facts exist for one door) |
| Security | prev/next ASGI lane (Idempotency · RateLimit · CORS) · dependencies (get_auth_context gate · get_session · get_settings) | stage filter (`produced[].phase`, `_a3_forms.PHASES`) · preconditions (3) · findings (3) · rate-limit `when` (with the active-vs-enabled caveat) | idempotency exact (U12) · K2 / K3 · a lane portrait |

### Three layouts
Bench ≈ 517 tall (45 + 52 + 420); portrait 440×560 (`endpoint-lab.html:550-563`).

| option | regions | behaviour | width @dock | cost | trade-off |
|---|---|---|---|---|---|
| (a) Card with path submenu | ~352×560 right of portrait: 3×5 grid of 64px cells + tooltip; row 2 = Paths ▸ · ‹exit · exit› · Refusals · Clear | Paths ▸ swaps the card to the path cells; the chosen path persists as a head chip; unavailable cells keep their place (blank / hollow / hatched / dashed) | ≈1642 | low–medium: `CMDREG[part]` of 15 cells with `state(F)` + ~30 probe checks | most SC2-faithful, fewest regions; a path in force is one level down and easy to lose |
| (b) Path strip + per-part card | ~700×72 strip under the part buttons (3 success \| 7 refusal) + the same card | a path click projects all six parts; portrait becomes the path record; parts without per-path facts get a hatched veil | ≈1642 (bench grows to ~589) | medium: `pathsOf(F)` + 6 projectors + probe over 10×6 | paths always visible, mode across parts; costs height |
| (c) Exit ladder + entity card | ~196×560 column; rungs = `PHASES` order + returns; exits hang where they leave | click an exit: rungs above light, below dim; one clock can replay the walk; gaps have a location | ≈1850 | medium–large | shows *where* a path leaves and puts the missing success paths in place; widest, least SC2-like |

**Correction to (c).** All three handler exits (400, 409, 409) are `produced` `phase:"handler"`, `depth:0`. An "orchestrator" rung must be built from `preconditions[].depth` / `via` / `raised_at`, not from `produced[].depth`.

**Matrix variant.** Path × part, 10×6 cells of 28px. Each cell's state doubles as a map of what is still ungenerated.

**Region notes for any option:**
- The row never wraps (`_lab-ep.css:791`).
- A new region needs `order:4` (`:794-797`).
- The `dockw` preset text ("the middle if COMMAND + EVIDENCE go", `endpoint-lab.html:2125`) needs rewording if COMMAND returns.
- Unverified: `_lab-ep.css:846` sets `#lab{overflow-x:auto}` against a "no overflow" comment.

### Entity command card
Keys keep their cells for every element of the card's scope.

| key | command | tier · source |
|---|---|---|
| Q | Walk a path ▸ | FEED for 7 refusals; success hatched until A4 / A8 |
| W / E | prev / next exit (stage order) | FEED `produced[]` + `PHASES` |
| R | Show refusals — **badge 8** (U7), with the uncaught 500 shown separately | FEED `slots.U7.rows`, `produced[]` |
| T | Show success (200 · MeResponse) | FEED `declared` |
| A | Show writes (badge 11) + commit | LAB `data.writes` / `commits`; per path NEW A9 |
| S | Show preconditions (badge 3) | FEED |
| D | Show gates (1 gate of 3 deps + 3 ASGI lanes; per refusal: phase + via) | LAB + FEED |
| F | Show findings (badge 3) | FEED |
| G | Declared vs produced (declares 200, no refusals; produces 400 · 401 · 409 · 422 · 429) | FEED `declared`, `slots.K1` |
| Z | Tests for this exit | LAB name-parsed, dashed; exact A10 |
| X | Untested exits (401 · 429 · 500) | derived, dashed |
| C | Open the handler (setup.py:183) | FEED `handler`, `line` |
| V | Up to entity / cluster (3) | LAB `identity.above` |
| B | Clear (Esc) | always lit |
| — | Constraint → exit | hatched (NEW) until a cell frees up |

**"Entity" is ambiguous.** Report D drafted a card for the element's KIND (endpoint). In this suite "entity" is the claim slug (`auth`), and the old console's ENTITY verb was `panelEnt`. An owning-entity card is derivable from forms today (4 auth endpoints). Offer kind-card / entity-card / both.

### Choices that must become lab rail options
1. command layout: (a) · (b) · (c) · matrix
2. where forms rows go: plan Phase 6 (Security U3 + Functions U7) · Data · command panel · all six parts
3. card scope: element kind · owning entity · both
4. path grouping: 10 named · by status (7) · by produced row (9 + success)
5. path names: drawn names · detail text · exception class · phase·status
6. success source: drawn by hand (labelled) · generated only (one hatched cell) · hidden
7. sub-paths: 401 and 429 as one or two cells each
8. what a path does to the middle: dim .28 · filter · outline
9. portrait on path select: path record · keep selection · split
10. wrong-question cell: SC2 blank (keeps place) · collapsed. Hollow / hatched / dashed stay fixed by lab law.
11. hotkeys: QWERT grid · mnemonic letter · off
12. cell size: 76 / 64 / 52 px; face valley or flat. The 12px floor is measured at the smallest size.
13. tooltip: SC2 card · lab hover card · caption block
14. test↔exit join: name-parsed dashed · off until A10
15. path on part switch: kept · cleared
16. card side: right of portrait · left
17. ladder placement: right of portrait · left of bench · inside portrait edge
18. walking state: one-clock replay · static
19. rate-limit flag chip: hidden · shown with the active-vs-enabled caveat

## 7. RECOMMENDED SEQUENCE

1. **Give the lab the forms feed (A1 + A2).**
   - Build: a `head` stamp on forms.json, then forms.json and levels.json added to `regen-example.sh` FEEDS, then `gen-endpoint-facts.py` emits `LABEP.forms`, with the source line fixed to 183.
   - Cost: S. Draft review + "land it" for the generator stamp; commit with `git commit -- <paths>` (shared-branch memory).
   - Unblocks: every FEED-tier command above, and a detectable head mismatch.
2. **Build the command region in the lab, with every §6 choice as a rail option.** Read `L/panel-patterns.html` first.
   - Build: the plumbing (FRAME, `order:4`, `applyFrame`, COPYTXT, INV rows, generalized `selectIn`, probe asserts) plus the three missing portraits. Success paths render hatched ("not generated").
   - Cost: M.
   - Unblocks: the operator's layout ruling on real data, before any path generation is paid for.
3. **Draft the plan amendment for a U6 sub-slice (A3 ids + A4 success exits + A8 `paths[]`)** ahead of Phase 4's U9 / U14, since both need paths to join onto.
   - Cost: S to draft. Then S (A3 + A4) and M (A8) to build after "land it".
   - Unblocks: paths as first-class commands; the three success cells stop being hatched.
4. **U9 effects per path + commit positions (A9), with U11 (A7) alongside.**
   - Cost: M + S–M.
   - Unblocks: Data "on this path"; commit / rollback on the walk; the "refusals still commit a user" fact becomes generated.
5. **U14 tests per path (A10).**
   - Cost: M.
   - Unblocks: exact test↔exit (Tests commands go solid); untested exits (401 · 429 · 500) become measured rather than dashed; the 14-case arrange over-credit is fixed.
   - A6 (schema → 422 cases) and A5 (flag join) are independent S items and can slot in anywhere.