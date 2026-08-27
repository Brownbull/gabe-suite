# Coverage-Class Fix Map — where each fix lives, what each journey gains (2026-08-27, DRAFT, not built)

> Operator ask (order-of-work item 2): from the Disclosure Tiers coverage table, drop every LOW row except
> AI prompts; for each remaining class answer WHY it is not captured · WHERE the fix lives (graft ·
> `_a3_code` · `_a3_graft` · `_a3_graph` · `_a3_levels` · `center.config` · station) · and for every journey
> whose node SEQUENCE changes, BEFORE → AFTER. Cross-check the Trace Anatomy artifact for nodes/connectors
> the class list misses. **This decides how the fixes integrate.**
> Method: workflow `wf_37cd71af-e77` — 14 class finders (one per row + the ORM-idioms connector class) +
> a Trace Anatomy cross-check, each finding handed to an adversarial refuter (29 agents, 972 tool uses,
> gustify read-only). 4 findings REFUTED on a central claim (api-routes · ws-sse · integrations ·
> reference-data), every finding corrected; corrections are folded in below. Evidence:
> `fix-map/findings-digest.txt` (per class: finding · refuter checks · corrections · misses),
> `fix-map/findings.json.gz` (the raw returns), `fix-map/chain.py` + `before-chains.txt` (the BEFORE
> chains, one deterministic source). Baseline: the committed gustify example at HEAD `4af0f4b`
> (72 endpoints · 219 fn nodes · 150 fn edges · 212 access edges); finders that measured HEAD~3
> (67 · 210 · 145 · 206) were re-based by their refuters.
> Artifact: **Coverage Fix Map** 🧩 `https://claude.ai/code/artifact/f91b3b59-a7ca-4c8b-a855-28a945f9a5bf` — builder
> `artifacts/coverage-fix-map.build.py` (`GABE_ART_OUT=<dir> python3 …`, then the two gates; republish by `url:`).

HANDLE — thirteen classes, five seams: the fixes are a dependency graph, not a list.
VALUE — today a journey walk shows the handler, its write-path descent and the tables; after the map
it shows the gate that runs first (and commits the User), the methods and reference readers the walk
skips, the second write leg an event fires, the contract each response is serialised from, and the
provider the LLM call reaches — with 5 new wire kinds, 4 new node kinds and one consolidated draw rule.

## 0 · The integration verdict — four waves, one substrate commit

The fourteen fixes touch the same five files and move the same numbers. Shipped one class at a time
they cost five regens and five re-pin rounds on every twin; grouped by what they MOVE they cost two.

| wave | what | tag | moves existing bytes? | what it unblocks |
|---|---|---|---|---|
| **A · census + claims** | `route_census` + `file_census` beside `model_census` (S13 · cc-init rail); the twin CLAIMS files (config) | additive + config | suite: no · twin: yes (its own claims) | every class whose evidence sits in an unclaimed file — routes 8, fns 233, schemas 23, reference/*, ownership/idempotency, the pipeline runtime, main.py |
| **B · the substrate** | ORM symtab + attribute writes + `select(Model.col)`/join/select_from root-walk · `session` off the http receivers · METHODS admitted (`_CALLABLE_KINDS`) + hub relief · gate-name before accessor · `touches` role split (resp / consumes / touches) | change-in-place | **yes, every twin, one regen** | roles, ops, rollups, fn_edges — the numbers every later wave pins against |
| **C · roots + wires** | `depends` + `gated_by` (middleware) · `BOOT` root · `dispatches` (bus + tables) · `serializes` · `provider` + `reaches` · `flag` + `walls` · `WS` + `transport` | additive, honest-empty each | no (new kinds only) | K1 · K4 · J3's second leg · every response leg · K3's LLM hop · the 403 walls |
| **D · draw rule + station** | ONE levels §3c: reveal one hop from a drawn fn into a gate-role fn · a reference-layer fn · a dispatch/depends target · a `rendered_by` fn — replacing three per-class §3c proposals; station kinds + legend rows + hub fold | additive | levels fn counts (stated) | guardrails · reference · prompts · the walkability of everything C added |
| then **item 3 · tiers** | the ladder's floors gain the new kinds as rows (`DISCLOSURE-TIERS.md` already lists depends 2 · dispatches 1 · serializes 3 · boot root) | — | — | the noise waves C–D bring is what the ceiling is for |

Why B is ONE commit: the refuters proved the methods admission is not honest-empty (any project
whose handlers call methods moves), the select-attr root-walk is the "select-attr half" three classes
each ask for, the gate precedence swap only matters once reads land, and the role split re-pins the same
`touches` counts. One regen, one re-pin round, one commit message with the numbers.

Why C is per-commit: each floor is byte-identical when its idiom is absent (proven per class below),
so each can land, be measured on gustify, and be reverted alone.

## 1 · The class map

Tags: **config** = the twin's `center.config.json` only · **additive** = a new floor, everything today
byte-identical · **change** = an existing detector widens, outputs move. "Journeys" counts the 21
(W1–W8 · J1–J8 · K1–K5) whose drawn sequence changes. Line cites are HEAD `4af0f4b`.

| # | class | why the map holds nothing | where the fix lives | tag | journeys | verdict |
|---|---|---|---|---|---|---|
| 1 | **API routes** (8 of 80 still missing after the twin's `d1880cf4` claims: equipment 2 · meal_plan 2 · e2e_seed 2 · locale 1 · health 1) | `parse_endpoints` runs only over `code.api` lists (`_a3_code.py:412-415`); no route census; every arm keys off `entities[*].endpoints` | `_a3_code.route_census` (~45 lines, the `model_census` pattern) + S13 + cc-init rail; a `__unclaimed__` pseudo-entity mint in `_a3_graph` is possible but **the refuter proved step A yields no chain** — levels roots `fn_edges` only at function_insight handlers (`_a3_levels.py:233-238`, `:263`), so a census endpoint gets node + gates + behind + rollup + bridge and no walk; the cure is the CLAIM (config), as with models | additive + config | 3 (K1 gate census 72→80, K4 seed twin, J1's e2e twin) | census ships; claims are the twin's; + a `parse_endpoints` defect: 4 routes drawn as `/` (recipe_filter_modes passes `_BASE`, a Name) — resolve module str constants (~6 lines); + `trigger` field (user · poll · boot · e2e) from the anatomy |
| 2 | **WS / SSE routes** (2 routes + 1 EventSource opener, not 4; the SSE GET IS drawn as a plain GET) | `websocket` ∉ the verb tuple (`_a3_code.py:169`); streaming has no carrier; `_a3_web` is a SINGLE-idiom extractor (`_detect_idiom` picks apiFetch) so an `eventsource` regex never runs | `parse_endpoints` admits `websocket` → `WS` + `transport` (sse keyed on the `text/event-stream` constant / `EventSourceResponse` ONLY — `StreamingResponse` over-fires on downloads); `_a3_web` gets a separate always-on transport pass + same-file const resolution; station `METHOD.WS` colour/glyph + `transport` chip; the column station's `methodOf` too | additive + change | 1 (K3: the stream gets its web entry + a second door) | LOW-MED — both doors are 403-walled in prod; WS tests attach 0 cases (no route literal) → needs a stated join rule |
| 3 | **Backend fns in unclaimed files** (52 files · 233 callables; 74 reachable from a mapped handler, 66 within 3 hops in 18 files) | file→entity homing drops the fn and every call touching it (`_a3_graft.py:181-189`, 9,679 dropped `unmapped_file`); function_insight walks mapped trees only (`_a3_code.py:1139`); the `behind` pill counts them, the walk cannot (setup 29 behind / 13 drawn) | `file_census` + `derive_reach` (graft BFS from handlers → min hops per unclaimed file) + S11/S13; the cure = config claims (the 17-file list in the digest: ownership · idempotency · middleware/idempotency · net/client_ip → auth; ai_credits · ai_spend → progression; recipe_filter_modes · reference/* · text_search · pipeline/runner · streaming/producer → recipe …); an optional mint must parse census files in a SEPARATE tree set or it becomes change-in-place on every drawn fn's fan-in | additive + config | 9 (W1/J1 gains the claim INSERT + Household/Location writes — Membership's `add_all` stays invisible until B · W2 +7 catalog readers · W3 tier gate · W4 idempotency + tier · W5 locale leg · J7 idempotency · K3 client_ip + `record_spend_for → AiSpendLog` on REST and SSE) | a tests/ noise rule (anatomy: a test closure is graft's only caller of `EventBus.publish`) rides with it |
| 4 | **Class methods** (149 in apps/api, 96 in claimed files, 50 of them validators; 0 drawn; 6 homed methods have homed callers) | `derive_functions` keeps `kind == "function"` (`_a3_graft.py:176`) while `_CALLABLE_KINDS` already admits methods for behind/d2w/roles — the only channel that leaks them is the behind pill (`AuthContext.require_household` named on 49 endpoints) | ONE line (`not in _CALLABLE_KINDS`) + `method:true` on fn_nodes + a **hub relief** in the station: a gate-role method with fan-in ≥ N folds into each caller's gate badge (else a 47-spoke star on every household journey) | change | 14 (every W2–W8 step + J3–J6 + K2/K3 gain the h1 `require_household` gate wire; J3 gains the `EventBus.publish` hop, a dead end until 6) | fn_nodes 219→222 · fn_edges 150→199 · hidden_fns +93; 63/65 method calls are inferred (a same-named method elsewhere would mis-wire — the floor caveat) |
| 5 | **Pydantic schemas** — (a) 23 absent classes in 6 unclaimed schema files · (b) schema→model 0 edges · (c) one undirected `touches` for three roles | (a) `parse_schemas` reads claimed files only; 7 drawn endpoints carry a `resp` string with no node · (b) `model_validate` is not an ORM idiom the pass knows; `from_attributes` is an Assign the schema parser skips · (c) `touches` = every bare Name in the handler ∩ documented; `consumes` runs after and skips claimed targets → 0 intra edges | (a) config: consent.py → legal-consent, catalog.py + recipe_filter_mode.py → recipe (+17 nodes, the 7 dangling `resp` resolve); equipment/meal_plan/locale wait on their route files · (b) `orm:True` from `from_attributes`; `serializes` from `X.model_validate(v)` sites resolved through the **B symtab** (today's binds ctor/annot only — the refuter killed "select-bound resolves today") + a naming arm (strip Response/Summary/Item/Ref/Block/Out → exactly one model, requires `orm`), site wins (NotificationBlock: site → UserNotificationPreferences beats naming → Notification) · (c) split in `_l2`: `resp` (census, promote the field to a wire, KEEP the field), `consumes` (signature-typed, 27), residue `touches`; widen the three name-filters (`_a3_levels.py:400/439` prune · `codebase-graph.html:1588/1836`); station: RELCOL/LINKMETA lack consumes/nests rows (owed); `serializes` is the only new REL2KIND | config + additive + change | 18 (every response leg; K5 is the template — ctor-bound row → DTO→RecipeDemand in one hop with zero resolver; J1's MeResponse blocks → 9 serializes to User/Household/Membership + the 6 preference models; J3/J6/J8 hand-built DTOs → none, honest) | the landed schema-homing `fn_wires` (76 returns/takes/uses) already carry the function-level half — `_build_me_response ⟶returns MeResponse` is drawn today |
| 6 | **Event bus** (1 type · 2 handlers · 1 publish · 1 registration = the row's 5) + **dispatch tables** (the anatomy's uncovered item: `PIPELINE_STAGES`, 10 stages) | a type-keyed registry is no call: graft's only edge out of `publish` is a TEST closure; handlers are imported INSIDE `register_handlers` under aliases; every derivation BFSes `calls` only; the AST pass files `bus.publish` as a `queue` SINK that renders nowhere | `_a3_code.dispatch_map` (registry pass with fn-local ImportFrom alias resolution via `_file_imports:828` + publish pass → `dispatches`, conf census) + `dispatch_tables` (a module tuple/list of local def Names + the fn that iterates it → `dispatches`, conf inferred) → `_a3_graft` folds both into the shared adjacency (behind · endpoint_access · roles · d2w · `derive_fn_behind`) + `functions.calls` rel `dispatches` (+ the L1 `derive_cross` kinds decision) → `_a3_levels` `rel` passthrough (§3b then pulls `recompute_skills_for_cook` d2w 0 · `recompute_node_progress_for_cook` d2w 1 · `_upsert_node_progress`) → `_a3_graph` unchanged (access unions SkillProgress/NodeProgress → cross `writes_to` into progression) → station `dispatch` wire + legend; demote the `queue` sink | additive + change (the sink) | 2 + K3's middle (J3/W4 step 5: two dispatch wires → 4 new fns → 5 new cross writes; behind 13→36 · K3: run_pipeline → 10 stages incl. build_prompt · gemini_call · allergen_filter) | the registry match is a CENSUS — emit conf `extracted`, not graft's inferred default; stats key-conditional (no `dispatches: 0` on no-idiom projects) |
| 7 | **Boot / lifespan writers** (34 boot-reachable writer fns; `lifespan` has 11 resolved graft calls, all dropped) | main.py unclaimed; levels has ONE root class (`_handlers`, `:233`); `derive_functions` drops unhomed ends; C4 mints nodes only from endpoints/models/schemas | `_a3_code.parse_boot_roots` (`FastAPI(lifespan=F)` / `on_event("startup")`) → inject a `__boot__` pseudo-entity ONLY into `graft_arm` (into `entities` it becomes a 9th ring entity + S9 noise — refuter) → explicit C4 `endpoint:BOOT lifespan` + an L1 `boot` bucket with its own `_layout` branch (no `__unclaimed__` neighbour on gustify) → `_a3_levels` rule 0 (boot roots join `_handlers`) → station `METHOD.BOOT`, the backend tab chain "BOOT lifespan"; a `gate:'deploy-only'` floor reading all three seeder predicates (LOCAL/sqlite · STAGING+uid+non-sqlite) | additive + config | 1 (K4: nothing → a 7-deep BOOT walk; behind 135 fns; 70 inside claimed files; ≈+59 fn nodes / ≤98 fn edges) | state the rollup-vs-walk split on the node (rollup walks unclaimed nodes: ~29-34 models; the chain stops at claimed files); `_upsert_by_code(session, Model, …)` hides 5 reference writes (B); widen to **rootless-writers** later: `CLI` (9 scripts) · `MIGRATE` (4 data migrations, table→model via inverse m2t); the "SSE terminal persist" and the "reminder poller" were mis-filed (ORM param binding; a client poll) |
| 8 | **Middleware + the dependency path** (3 `add_middleware` · `Depends(get_auth_context)` on 71/72 · `require_household` on 48) | `_endpoint_middleware` records NAMES with no import resolution (`_a3_code.py:1029-1043`, `:1071-1103`); Depends is not a call (0 graft edges from api/ into `get_auth_context`); the 409 gate is a METHOD; the User writer sits in unclaimed ownership.py; nothing reads `add_middleware` | resolve Depends targets to `<file>#<fn>` via `_file_imports` (extend with the module path; ordering: `_PY_TEXTS` fills after `parse_endpoints`) + `parse_app_middleware` (sites + literal prefix/method floors) → `_a3_graft.derive_depends` (extracted) + seed behind/endpoint_access with dep ids → `_a3_levels` dep fns join `drawn_fn` → `_a3_graph` `middleware` L2 kind + `gated_by` cross edges {scope} + `via:'depends'` on rollups → station `gate` wire bucket (depends + gated_by), `KINDS.middleware`, Guards rows link to nodes, step note "Hop 0.5" | config + additive (+ B for the method) | 20 — every journey gains `gated_by [global / sensitive 20/min / stamp]` → `depends get_auth_context` → `build_auth_context` → `resolve_or_create_user` [fnreads/fnwrites User, COMMITS] → `load_household_context` [reads Membership · Household · Location] → the 409 gate; K1 becomes drawable; J8/W1: User is committed BEFORE ConsentRecord; K2 "pure read" isn't | **draw only `gate=True` deps** (get_session ×72 + get_settings ×12 would add 84 noise wires); nested deps (bearer_scheme · _resolve_verifier) are not walked; `TokenVerifier.verify` resolves to the Protocol stub (Firebase → 9); User gains 72 reads → `via:'depends'` + a station toggle default-dim; WS bypasses the rate limiter (a third entrance); `/healthz` is the one exempt route |
| 9 | **Integrations** (3 SDK call sites + 3 credential sites + 2 constructors + Sentry; the row's 12 = adapters + real/mock pairs; 0 provider callers outside tests are honest dead shells) | the sink detector reads a one-level attribute on a bare Name receiver (`_a3_code.py:974-975`): `client.aio.models.generate_content` is 3-deep, Firebase is `asyncio.to_thread(sdk.fn)` with an importlib-bound SDK; `session.delete` tagged http (8 sites in 8 fns, 0 real); `external` = FK stubs only; sinks render nowhere; the Gemini call sits behind three dispatch breaks and **has no d2w, so §3b can never pull it** (refuter: claiming is not sufficient) | per-module PROVIDER pass (explicit package-root registry + importlib strings; rule a: Call whose attribute-chain root is bound; rule b: a bound Attribute passed as a Call arg) — http requires a bound http lib (the orm-access `httpx.post` fixture has no import: keep name-based for bound clients) → `_a3_graft` endpoint_access unions `externals` → `_a3_graph` `provider:<name>` L2 kind (NOT `external`) + `reaches` wire → `_a3_levels` fn→provider edges → station KINDS.provider + order/_GRPKINDS/KRADF + REL2KIND + `_buildFnData` + card + legend | config + additive + change (the sink) | 2 (J2: `delete_identity → reaches provider:firebase` — the catalog's external-identity tail · K3: `provider:gemini` once 4 + 6 land and `reaches` counts as an anchor) | the 5 false http sinks vanish (7 FI entries move); the registry is a curated allowlist — keep it root-package + importlib based, never "every third-party import" |
| 10 | **Guardrails** (12 gate-named callables by the generator's own rule, not 25; 1 gate drawn, its 3 callees unhomed, its own read invisible, 2 of 3 callers undrawn) | resolution.py unclaimed; `select(RecipeIngredient.ingredient_code)` is an attribute select `_name_model` ignores (`:927-928`); non-handler callers with no d2w never draw; **role precedence erases the gate** the moment its reads land (`derive_fn_roles` tests accessor first, `_a3_graft.py:391-394`) | config (resolution.py + normalize.py → allergen) + the B root-walk + gate-name before accessor (NEW fixture: gate-named fn WITH ops) + the D draw rule (inbound: drawn fn → gate-role callee; outbound: gate → callees to fixpoint) + a body-based gate rule for inline `raise HTTPException` clocks (K5's 429, anatomy) | config + change + D | 5 (W2 detail: the gate reads its 3-table snapshot · W4/J4: the safety decision BEFORE the CookingSession write · W8: the guard between the Recipe read and the PlannedRecipe write · K3: `check_credits`/`check_spend_cap` hops — dead-end badges until ai_credits/ai_spend are claimed) | `ensure_principal_household` (ownership.py:89) is a gate-named guard WITH ops on J1 — claim + precedence interact; the SQL allergen wall (`select(1).select_from().join()`) is not gate-named → B's select_from/join branch; `guardrails/novelty.py` is already drawn as 4 pure nodes |
| 11 | **Reference data** (46 top-level fns in 5 files, 0 drawn; 64 production call edges from 52 callers — 34 fn + 18 method — in 25 files; 9 handler-direct) | no `reference` code layer, nothing claimed; both ends must be homed; levels draws handler-rooted + write-gradient only, so a mid-chain read hop is skipped; behind counts them (resolve-batch 15 behind / 2 drawn) | config (`code_layers += reference`; resolution + safety_warnings → allergen · catalogs + normalize → recipe · fuzzy → pantry) + `_CODE_LAYERS` default + the D draw rule (one hop into a `layer == reference` fn; `FI.get(…, {})` guard — the finder's join would raise on graft-only fns) | config + D | 7 (W2 GET /recipes +7 catalog readers, handler-direct, config-only · W2 detail: the gate's reads · W4/J3 complete: `storage_method_shelf_life` feeding PantryItem.expires_at · J7: `normalize_ingredient_code` — manual NORMALIZES, does not resolve · K3: the snapshot's reads + the sanitizer · resolve-batch: parse → match) | REFUTED on reads: `build_match_corpus` draws PURE (all 3 selects are column selects → B); `load_resolution_snapshot` gets 2 reads config-only, 3 with B; rollups move on "unchanged" journeys (endpoint_access walks the whole tree); catalogs.py serves 4 entities — first-claim-wins colours all 31 fns as one |
| 12 | **Feature flags** (4 Settings bools · 2 effective props `flag OR is_production` · 1 module `Final[bool]` · seed_controls) | the middleware floor reads the route surface, never the body where `if not FLAG: raise 403` lives; the flag NAME is collected into `refs` then discarded; no `ast.Raise` scan anywhere; no flag census; the FE `featureFlags` module is drawn at file identity | `parse_flags` + `_flag_gates` (ast.If whose test leaf ∈ census AND whose body raises — POLARITY matters: `if not flag: raise` walls, `if not flag: return` arms; key on the attribute name regardless of receiver for `get_settings().x`) → `_a3_graph` `flag:<NAME>` L2 kind (homed by reader / `__config__`) + `walls` cross edges {on_fail} + stats.flags → `_a3_levels` fn.flags → station KINDS.flag + `walls` wire + Guards "Flags" row + step note "Walled by X (OFF → 403)"; later `_a3_fe` emits the imported symbol → per-flag `reads` + fe↔be `mirrors` | config + additive | 2 (J7 + K3 + the stream: ONE `flag:RECIPE_CREATION_ENABLED` node fanning `walls → 403` into three doors) | app-level walls (`rate_limit_active` on 71/72) draw on the middleware node, never per endpoint (saturation); show the EFFECTIVE value; K3's spend-cap read is in `assert_under_spend_cap` (unclaimed), the pipeline's rate wall is `stages.py:68/77` over `PipelineDeps.rate_limit_enabled` (a name collision); 1 test pins the 403, none pins the stream's |
| 13 | **AI prompts** (exactly ONE: a 42-word module string in a 1-entry registry) | module-level Assigns are never visited; the chain is cut three times (unclaimed runner/producer/registry · the PIPELINE_STAGES table · a Protocol `render`); stages have no d2w → never pulled; Gemini untagged | config (registry · runner · state · producer → recipe) + PREREQ 6's `dispatch_tables` + `prompt_registry` (registry dict / `{placeholder}` string consumed by `.format`/`.render` → id, words, placeholders; `rendered_by` via the getter's callers) + `_a3_levels` ATTACHMENT PULL (backward BFS from `rendered_by` to the nearest drawn fn ≤ 6 hops — the first non-write draw rule, scoped) + station KINDS.prompt + `fnprompts` wire | config + additive | 1 (K3: run_pipeline → build_prompt → prompt; path-only pulls 2 fns, whole lane 12; `gemini_call` stays a dead end until 9) | **DEFER** — 1 node + 1 wire on gustify; `run_pipeline`/`rate_limit_*` are PURE (not caller/gate); the mechanism pays on a multi-prompt twin (trigger: a twin with ≥ 3 prompts); the dispatch-table floor it needs ships with 6 |
| 14 | **ORM idioms** — the connector-fidelity class (Trace Anatomy gap 2 + 7): 61 attribute-write sites in 21 mapped fns · 91 `select(Model.col)` + 10 `join` + `select_from` sites in 40 fns (29 no-access fns are readers) · 8 `session.delete` sites (false http) | the symtab binds constructor locals + annotated assigns only (`_a3_code.py:907-918`); no attribute-assign detector at all (the ops loop walks `ast.Call` only, `:937-952`); `_name_model` takes a bare Name (`:927-928`); `"session" in recv` → http (`:988`) | `_orm_access`: +5 binders (single-model `select()`/`join()` RHS → `.scalar_one()`… · `for row in <bound>` · Model-annotated params · `session.get` · same-file annotated helper) + an Assign/AugAssign branch on `<bound>.attr` (**recommend NOT flush-gated** — `session.add` is a write without a flush today) + root-of-chain over `select`/`join`/`select_from` + drop `session` as an http receiver (**guard: require an import-bound http lib** — aiohttp's `ClientSession` idiom would otherwise be lost) + widen `commits` into commits/flushes/savepoint (`_ORM_COMMIT = {commit, flush}` conflates the boundary — BACKEND-JOURNEYS systemic #1) | change | 14 (W1/J1: the idempotency DELETE lands as a red wire, the false http vanishes · W2/K2: 3 explore + 5 search + 5 detail hops turn accessor, 10 tables rolled up · W4: cancel/advance-stage's CookingSession state flip drawn · J4: `seed_stage_schedule` becomes a writer · W5: batch reads Location, overview 2→9 · W6/W8: the DELETEs draw red · W7: dashboard 3→8 · W3 cupos 1→4 · J2 7→9 (+Recipe +Membership) · K5: the rate-limit clock as a pink self-read) | every twin's map moves: +81 rollup ops over 29/72 endpoints, ~30 drawn nodes flip role, ~59-64 new pink wires; residual floor: cross-file helper returns (`owned_mode` in an unclaimed file), dict-comprehension bindings, multi-model selects |

**The Trace Anatomy cross-check** — every node/connector the artifact mentions maps to a class; eight
items had no class and are folded above as widenings: PIPELINE_STAGES table dispatch (→ 6) · transaction
boundaries commit/flush/savepoint (→ 14) · rootless writers CLI + migrations (→ 7) · tests/ as graft
callers (→ 3, a noise rule) · the hub-gate render policy (→ 4, station) · sinks rendering nowhere (→ 9) ·
inline body gates with no function (→ 10) · endpoint trigger provenance user/poll/boot/e2e (→ 1).

## 2 · Journeys — BEFORE → AFTER, consolidated across classes

BEFORE = `chain.py` on the committed estate (`fix-map/before-chains.txt`). AFTER = the union of every
class's hops, each tagged with its class number and the wire kind it rides. Five journeys carry every
grammar element; the matrix after them says which classes touch the other sixteen.

### J1 · `POST /setup/complete` — the flagship (W1 step 2)
BEFORE (13 fns, h3): `endpoint POST /setup/complete` [gates get_auth_context · get_session · get_settings — names]
→ `handler setup_complete` [caller · d2w 1] → `_me_response_from_result` [pure] · `complete_setup` [accessor · d2w 0 · reads SetupCompletionState · commits]
→ `_discard_claim` [reads IdempotencyKey · **false http sink**] · `_stamp_completion` [w SetupCompletionState] · `_upsert_dietary` · `_upsert_format_prefs` · `_upsert_notifications` · `_upsert_privacy` · `_upsert_subscription` · `_upsert_user_format` [each w its preference model] · `_upsert_exploration` → h3 `upsert_exploration_preferences` [w UserExplorationPreferences]
· schema wires: touches SetupCompleteRequest · touches MeResponse · rollup: writes_to ×8 · reads_from ×10.

AFTER:
`+ gated_by CORSMiddleware [all] → + gated_by RateLimitMiddleware [sensitive 20/min] → + gated_by IdempotencyMiddleware [stamp POST]` (8)
`→ + depends get_auth_context → + build_auth_context → + resolve_or_create_user [+ fnreads User · + fnwrites User · COMMITS] → + load_household_context [+ fnreads Membership · Household · Location]` (8 + 3: ownership.py claimed)
`→ endpoint → handler setup_complete → + get_idempotency_key [pure]` (3) `→ complete_setup`
`→ + claim [w IdempotencyKey — the INSERT] → + _outcome_for → + complete → + ensure_principal_household [gate · w Household · w Location · r Membership]` (3 + 10 precedence; Membership's `add_all` needs 14)
`→ _discard_claim [+ fnwrites IdempotencyKey — the query-bound DELETE · − http sink]` (14)
`→ the upsert fan (unchanged)`
`· consumes SetupCompleteRequest · resp MeResponse · + serializes ×9 from MeResponse's blocks → User · Household · Membership · the 6 preference models` (5)
`· + walls: none · + reaches: none · + POST /_e2e/seed as a grey twin fanning into complete_setup` (1, once claimed).
Δ the walk starts one hop earlier (the User row exists and is committed before the household transaction), the claim is an INSERT not a read, the response leg closes onto the same six tables the upsert fan writes.

### J3 · `POST /cooking/sessions/{id}/complete` — the domain event (W4 step 5)
BEFORE (3 fns): `endpoint` → `handler post_complete` [caller · d2w 0] → `complete_session` [accessor · w CookingSession · DishHistoryEvent · IngredientHistoryEvent · PantryItem · r CookingSession · Recipe · RecipeIngredient · commits] → h2 `clear_pending_cooking_timer_notifications` [w Notification] · touches CompletionRequest · CompletionResponse.

AFTER:
`+ gated_by RateLimitMiddleware [sensitive] → + gated_by IdempotencyMiddleware [stamp, unread here] → + depends get_auth_context → [the K1 chain]` (8)
`→ handler post_complete → + calls AuthContext.require_household [gate · auth]` (4)
`→ complete_session → + calls storage_method_shelf_life [pure · reference] (feeds PantryItem.expires_at)` (11) `→ clear_pending… (unchanged)`
`→ + calls EventBus.publish [method]` (4) `→ + dispatches on_cooked_meal_created (skills.py) → + recompute_skills_for_cook [accessor · d2w 0 · w SkillProgress] · + dispatches on_cooked_meal_created (progression.py) → + recompute_node_progress_for_cook [d2w 1] → + _upsert_node_progress [w NodeProgress]` (6)
`· + writes_to SkillProgress · NodeProgress (cross-entity into progression, its first write edges)` (6) `· consumes CompletionRequest · resp CompletionResponse (hand-built → no serializes)` (5).
Δ the second write leg the catalog verified and the map never drew; behind 13 → 36; the `queue` sink on post_complete stops lying.

### K3 · `POST /recipe-creation/gustify` + the SSE tail — credit gate → LLM → persist
BEFORE (6 fns): `endpoint` [screens: none bridged] → `handler post_create_gustify` → `_gustify_response` · `_raise_for_pipeline_error` [pure] → `generate_gustify_recipe` [accessor · w RecipeCreationRequest · commits · **false http sink**] → `reclaim_if_abandoned` [pure] → `enqueue_unknown_ingredients` [w IngredientReconciliationQueue]; SSE: `GET …/stream` → `stream_gustify` [d2w 2] → `_sse_frames` · `stream_gustify_events` [d2w 1] → `_finalize_stream` → `reclaim_if_abandoned` → `enqueue_unknown_ingredients`.

AFTER:
`+ flag:RECIPE_CREATION_ENABLED —walls (OFF → 403)→ POST · GET …/stream · WS …/ws` (12 · 2)
`+ screen sse.ts —bridge→ GET …/stream [transport: sse]` (2) `· + WS /recipe-creation/gustify/ws [second door; bypasses the rate limiter]` (2 · 8)
`+ gated_by RateLimitMiddleware [sensitive] → + depends get_auth_context → [K1 chain] → + require_household [gate]` (8 · 4)
`→ handler → + get_idempotency_key · + client_ip [pure]` (3) `→ generate_gustify_recipe [− http sink]` (14)
`→ + load_resolution_snapshot [accessor · reference · r CanonicalIngredient · IngredientAlias · IngredientRestriction]` (11 · 14 for the attribute select)
`→ + check_credits [gate] · + check_spend_cap [gate]` (10; their inputs `assert_credits_available` / `assert_under_spend_cap` need the claim, 3)
`→ + run_pipeline [pure] → + dispatches validate_request · rate_limit_user · rate_limit_ip · circuit_breaker · build_prompt (→ + fnprompts prompt:recipe_suggestion.v1, 13) · gemini_call → + StreamPipeline.events / CircuitBreaker.* [methods]` (6 · 4)
`→ gemini_call → + reaches provider:gemini (via _RealGeminiRecipeClient.generate_recipes [method])` (9 · 4)
`→ + record_spend_for → + record_spend [w AiSpendLog]` (3) `→ reclaim_if_abandoned [pure→accessor]` (14) `→ enqueue… (unchanged)`
`· consumes GustifyCreateRequest · resp GustifyCreationResponse → nests CreationRequestResponse → + serializes → RecipeCreationRequest` (5).
Δ the only external-spend journey stops jumping from the service to its writes: the wall, the gate, the ten stages, the provider and the ledger appear in order.

### K1 · the auth provisioning commit on every request
BEFORE: nothing — a NAME on 71 endpoint cards ("Gated by get_auth_context").
AFTER: `endpoint × 72 → + gated_by CORS [all] · RateLimit [global 120/min; sensitive 20/min on 23] · Idempotency [mutating] → + depends get_auth_context (or get_auth_context_from_query on the stream) → + build_auth_context → + resolve_or_create_user [fnreads User · fnwrites User · COMMITS — the first-sight write] → + load_household_context [fnreads Membership · Household · Location] → handler` (8 + 3). `TokenVerifier.verify` resolves to the Protocol stub; the Firebase verification hop is class 9 (`+ reaches provider:firebase` via the credential sites). `/healthz` (once claimed, 1) is the one route with no gate; the WS door calls `build_auth_context` directly (a third entrance).
Δ the catalog's missing journey exists; User becomes the map's most-read model (72) — hence the `via:'depends'` tag and a default-dim toggle.

### K2 · `GET /recipes/explore` — the "pure read"
BEFORE (9 fns): `handler explore_recipes` → `build_candidate` · `build_cooked_ledger` · `filter_candidates` · `rerank_by_preferences` [pure] · `get_exploration_preferences` [r UserExplorationPreferences] · `compute_recipe_availability` [pure · pantry] · `iter_candidate_recipes` [r Recipe] · `load_user_allergens` [r UserDietaryProfile] · touches ExploreResponse · RecipeAvailability · RecipeListItem.
AFTER: `+ gated_by RateLimit [global] → + depends get_auth_context → [K1 chain: fnwrites User, commits]` (8) `→ handler → + require_household [gate] · + ExplorationBias.from_lists [pure · method]` (4) `→ explore_recipes [caller → ACCESSOR · + fnreads RecipeIngredient] · build_cooked_ledger [pure → ACCESSOR · + fnreads DishHistoryEvent · Recipe · RecipeIngredient] · compute_recipe_availability [pure → ACCESSOR · + fnreads RecipeIngredient]` (14) `· resp ExploreResponse → nests RecipeListItem → + serializes → Recipe` (5).
Δ not pure: Hop 0.5 commits User; three "pure" helpers were reading three tables; the response finally terminates at Recipe.

### The matrix — which classes change which journey

| journey | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| W1 setup (4 steps) | · | · | ● | ● | ● | · | · | ● | · | ● | · | · | · | ● |
| W2 look for recipes | · | · | ● | ● | ● | · | · | ● | · | ● | ● | · | · | ● |
| W3 filter | · | · | ● | ● | ● | · | · | ● | · | · | · | · | · | ● |
| W4 cook (5 steps) | · | · | ● | ● | ● | ● | · | ● | · | ● | ● | · | · | ● |
| W5 pantry | · | · | ● | ● | ● | · | · | ● | · | · | ● | · | · | ● |
| W6 locations | · | · | · | ● | ● | · | · | ● | · | · | · | · | · | ● |
| W7 shopping | · | · | · | ● | ● | · | · | ● | · | · | · | · | · | ● |
| W8 plan | · | · | · | ● | ● | · | · | ● | · | ● | · | · | · | ● |
| J1 setup/complete | ● | · | ● | · | ● | · | · | ● | · | ● | · | · | · | ● |
| J2 DELETE /me | · | · | · | · | · | · | · | ● | ● | · | · | · | · | ● |
| J3 cook complete | · | · | · | ● | ● | ● | · | ● | · | · | ● | · | · | · |
| J4 start session | · | · | ● | ● | ● | · | · | ● | · | ● | · | · | · | ● |
| J5 pantry item | · | · | · | ● | ● | · | · | ● | · | · | · | · | · | · |
| J6 confirm-bought | · | · | · | ● | ● | · | · | ● | · | · | · | · | · | · |
| J7 manual recipe | · | · | ● | · | ● | · | · | ● | · | · | ● | ● | · | · |
| J8 consent | · | · | · | · | ● | · | · | ● | · | · | · | · | · | · |
| K1 auth commit | ● | · | ● | ● | · | · | · | ● | ● | · | · | · | · | · |
| K2 explore | · | · | · | ● | ● | · | · | ● | · | · | · | · | · | ● |
| K3 gustify + SSE | · | ● | ● | ● | ● | ● | · | ● | ● | ● | ● | ● | ● | ● |
| K4 seed lane | ● | · | · | · | · | · | ● | · | · | · | · | · | · | ● |
| K5 demand | · | · | · | · | ● | · | · | ● | · | ● | · | · | · | ● |

Columns 8 (middleware), 14 (ORM idioms), 5 (schemas) and 4 (methods) touch almost every journey —
they are the substrate and the reason wave B is one commit.

## 3 · Decisions owed (operator)

1. **The twin's claims** — the census makes the 52 files visible; claiming is yours. The 17-file
   request-path list is in the digest (class 3); the route files (1), schema files (5), reference/* (11),
   the pipeline runtime (13) and main.py (7) are named per class. `catalogs.py` serves four entities —
   first-claim-wins colours it as one.
2. **Wave B as one commit** — five change-in-place fixes, one regen, one re-pin round (recommended) vs
   five separate landings each moving the same numbers.
3. **Attribute-write gating** — not flush-gated (recommended: `session.add` is a write without a flush
   today; 12 fns gain a write, `seed_stage_schedule` becomes an anchor) vs flush-gated (9).
4. **Gate precedence** — gate-name before accessor (recommended: a guard that reads is still a guard;
   needs a NEW fixture) vs today's order (the only gate badge disappears when its reads land).
5. **Hub relief for methods** — fold a gate-role method with fan-in ≥ N into each caller's gate badge
   (recommended) vs bundle the wires vs draw the 47-spoke star.
6. **Which deps draw** — only `gate=True` deps (recommended; 84 resource-dep wires otherwise) vs all.
7. **The BOOT root's seat** — pseudo-entity into `graft_arm` only + an explicit C4/levels node
   (recommended) vs into `entities` (a 9th ring entity; S9 noise).
8. **`session` as an http receiver** — require an import-bound http lib (recommended; keeps aiohttp's
   `ClientSession`) vs blanket subtraction (loses it).
9. **The consolidated §3c draw rule** (wave D) vs three per-class rules — one rule, one battery.
10. **AI prompts** — defer until a twin with ≥ 3 prompts (recommended; 1 node + 1 wire on gustify);
    the dispatch-table floor it needs still ships with the event bus.
11. **`touches` role split** — ship in B (recommended; three name-filters re-pinned, RELCOL/LINKMETA
    rows added) vs keep the undirected wire and add `serializes` only.

```
DECISION: integration shape
CHOSE: four waves (census+claims · ONE substrate commit · per-floor roots+wires · one draw rule + station) over fourteen per-class commits
ASSUMED: every twin regenerates once per wave; the batteries pin numbers, not shapes, so one re-pin round per moving wave is the cost
BREAKS IF: a twin cannot absorb wave B's move in one regen (then split B by file: _a3_code first, _a3_graft second — two regens, stated)
```

## 4 · Gaps the map does not close

- **Residual floors** after every class: cross-file helper returns bind nothing (`owned_mode` in an
  unclaimed file — the cupo attach write stays undrawn until claimed); dict-comprehension bindings;
  multi-model selects; `_upsert_by_code(session, Model, …)`'s parameterised writes (5 reference models on
  the BOOT lane); the SQL allergen wall (`select(1).select_from().join()`) — B's select_from/join branch
  reaches it, name-based gating does not.
- **Trust**: 63/65 method calls and every boot wire are graft-inferred; the registry dispatch match is a
  census; `depends` is extracted. Carry `conf` on every new edge so the station's floor/census split holds.
- **Dormant paths draw as live**: both AI doors are 403-walled in prod; every seeder gates on
  LOCAL/sqlite; the sandbox on STAGING. The `walls` edge and the `gate:'deploy-only'` floor are what keep
  the picture honest — without them wave C paints production behaviour that never runs.
- **Rootless writers** beyond boot (9 CLI scripts, 4 data migrations) — a later widening of 7.
- **WS test attachment** — no route literal; needs a stated join rule before the WS door claims cases.
- **The numbers move**: every pin in `tests/{orm-access,arch-graph,levels,gabe-universe,codebase-graph}`
  and the committed example estate re-base once per moving wave; the commit message carries them.

## 5 · Provenance

Workflow `wf_37cd71af-e77` (2026-08-27): 14 finders + anatomy cross-check → 14 refuters; 4.4M tokens,
972 tool uses, 72 min; gustify read-only at `d1880cf4`'s working tree; suite at `4af0f4b`. Per-class
evidence with file:line cites, counts, risks, the refuter's wrong-check list and misses:
`fix-map/findings-digest.txt`; raw returns `fix-map/findings.json.gz`; BEFORE chains
`fix-map/before-chains.txt` from `fix-map/chain.py` (pure read over the committed estate).
