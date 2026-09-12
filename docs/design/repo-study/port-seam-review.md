# Port-seam review — 20 findings, all confirmed ones now LANDED (2026-09-12)

## Status — every confirmed finding fixed

All 9 "Fix now" findings and all 10 "Fix when convenient" ones are applied, each mutation-proven and
re-blessed. One finding (`port-seam-unregistered`) was refuted by the review itself and not applied;
one proposed fix (`di-no-register-row`'s register row) was applied in the review's ALTERNATIVE form,
because the proposed one makes the census lie on 3 of 4 repos.

**Measured before → after, on the four blessed baselines:**

| target  | fn_nodes | fn_edges | notes |
|---|---|---|---|
| gustify | 301 → 301 | 429 → 429 | census IDENTICAL on all 25 measures; both Firebase/Mock arms keep their predicates |
| gastify | 136 → 136 | 141 → 141 | census IDENTICAL; pydi census 0/0 → **1,971 receivers / 3,977 sites** (numbers that were never computed) |
| tier3   | 2,719 → **2,806** (+87) | 3,461 → **3,620** (+159) | +2 homing_agree; the new nodes are onyx's four FileStore backends (S3 · GCS · Azure · Postgres) and its Tool implementations |
| keypro  | 60 → **70** (+10) | 66 → **84** (+18) | cross_edges held at 30; di `resolved` held at 37 with `fields` 17 → 15 |

**Two defects found while fixing, not in the original 20:**
- `_a3_stacks_di._brace_end` started its search at the parameter list's `(`, so a DESTRUCTURED
  parameter (`async load({ id }: Args) {`) closed the method span on its own brace. Caught by the
  baseline gate as keypro losing a real cross edge, `ACTION login → model:users`.
- `mapquery.map_health` bound the `arms: not_emitted` verdict to blocked-derivations rather than to
  the census's presence. Since no derivation is blocked on ANY of the four repos, every current map
  reported its own arms census absent and told the reader to regen. 199 assertions missed it; the
  fixture never carried an arms census.

**Battery coverage added** (the review's cross-cutting note — "the new batteries pin almost none of
this"): stack-pydi 2 → 4 asserts, stack-di 4 → 6, levels 78 → 83, gabe-map 199 → 202. Fifteen
mutants run, fifteen killed. Two of those mutants initially SURVIVED and both were fixture defects,
not code: an interface whose members carried no access modifier was invisible to the field regex,
and a reason assertion tested for wording the mutant did not use.

## Verdict
The five phases are sound engineering — every established result reproduces exactly (keypro fn_nodes 60/edges 66, tier3 2,719/3,461, gustify 301, gastify census-identical), the arms are honest-empty where they find nothing, and `derive_functions`' both-ends-homed gate (`_a3_graft.py:227`) keeps the arms' loose edges out of all four pictures. The worst thing found is that the port seam's whole point is thrown away at one seam: both arms compute `predicate` + `binding: selected|ambiguous` per edge, `_a3_graft.py:228-230` keeps only `{s,t,ss,ts,conf,rel}`, and the station — which has zero occurrences of the string `binds` — then stamps those wires `proven:true` and labels them "structural join". So gustify's map draws `MockTokenVerifier.verify` beside `FirebaseTokenVerifier.verify` as equal, proven hops. Second theme: the pydi arm's annotation reader treats a container as its element type, and the emit loop never checks the target class has the method. Cross-cutting: the new batteries pin almost none of this (stack-pydi 2 asserts, stack-di 4 with no impl-side case, rule 3b2 zero), and four of these fixes move blessed baselines and need a stated re-bless.

## Fix now

### predicate-discarded-before-emit — high
- Both arms emit `{predicate, binding, port, impl}` (`_a3_stacks_di.py:192-197`, `_a3_stacks_pydi.py:302-307`); the fold keeps none of it and flattens everything to `conf:"inferred"`.
- `_a3_graft.py:228-230`; blessed `levels.json` binds-edge key set is exactly `['conf','ds','rel','s','ss','t']` on gustify (2 edges) and keypro (39). keypro arm output: 57 `selected` + 8 `ambiguous`, predicates `config`/`!config`/`''`.
- gustify auth journey: `build_auth_context → MockTokenVerifier.verify` (predicate `not (settings.auth_provider is ProviderMode.REAL)`) draws identically to the Firebase hop; keypro draws `InMemorySessionRepository.create` (no table) beside `PostgresSessionRepository.create` (writes `sessions`) as twins.
- Carry `pred`/`bind` on the binds record at `_a3_graft.py:228-230` (guard on `rel=="binds"` so all other fn_edges stay byte-identical) and copy them at `_a3_levels.py:374-376`. Do **not** take the "minimum version" of stamping `conf:"ambiguous"` — gustify's two edges are both `selected`, so it fixes nothing there and overloads a field `tools_wave3.py:139` already buckets.

### binds-rel-reads-as-proven — medium
- The new `binds` rel reached the station untold: `grep -c binds` = 0 in `templates/center/shell/gabe-universe.html` **and** its example twin, and `git diff --stat 554c2b5^ fd10af9 -- templates/center/shell/` is empty.
- `gabe-universe.html:2192` does `LINKMETA[fl.rel]||{w:2,pv:1}` and LINKMETA's rows stop at `:1268-1269`; the link card's Trust row `:6267` then falls through to `l.proven?"structural join":"inferred floor"`, and the Test chip at `:6263` reads "test-proven route".
- Click any binds wire → an edge the emitter stamped `inferred` is presented as a structural, test-proven join. Latent only because the shipped example feed has 0 binds edges; it fires on the next regen (gustify's regenerated `levels.json` carries the two).
- Add `LINKMETA.binds={w:4,pv:0}` beside `:1268-1269` (this is the load-bearing line — it fixes both rows), plus `RELCOL.binds`, `binds:'calls'` in `REL2KIND` at `:1748`, and a `binds` Trust string at `:6267` — in **both** station copies (two-file law), and add `binds` to the rel list at `tests/gabe-universe/run.sh:106`. Pick a real hue; `"<hue>"` is a placeholder.

### di-binding-marker-dropped — medium (same seam as above; one fix serves both)
- The computed ambiguity is discarded, so a one-of-N port hop is indistinguishable from a resolved one on the drawn map.
- Cross-referencing tier3's committed `levels.json` against the arm's markers: **47 of the 76 drawn port hops are `ambiguous`**, 29 `selected` — e.g. `PostgresCacheBackend.set` + `RedisCacheBackend.set` from the same function, `HuggingFaceTokenizer.encode` + `TiktokenTokenizer.encode`. keypro: 8 of 65.
- `ChatAssistant` has two impls and no readable predicate (`keypro-front/src/composition/container.ts:49-51` is a one-line guard `_IF_RX` at `_a3_stacks_di.py:62` cannot match) — the station draws the real assistant and the fake on the same run.
- Same edit as `predicate-discarded-before-emit`; note `_a3_graft.py:951-954`'s `_w2["edges"]` copy is **inert** (read only by behind/d2w/fn_roles for s/t) — editing it adds nothing. Also forward the keys at all four binds append sites in `_a3_levels.py` (`:301`, `:348`, `:374-375`, `:407`), not just 3b2, or the marker is present on some hops and absent on others.

### target-method-unchecked — medium
- The emit loop writes `<file>#<Impl>.<method>` for every registered impl with no membership test, and the impl roster is one level deep.
- `_a3_stacks_pydi.py:300-307`; the roster's own scaffolding is dead at `:273-276` (`meth_of` declared, `for c in w.calls: pass`). Measured on tier3: **115 of 507 edges (22.7%) name an absent attribute** (append 38 · extend 17 · setdefault 16 · validate_checkpoint_json 9 · retrieve_all_slim_docs 8 · load_from_state 8 · poll_source 8).
- `runnable_connector: BaseConnector` (`backend/onyx/background/celery/celery_utils.py:147`) `.load_from_state()` at `:187` fans to 9 interface classes; only `LoadConnector` defines it (`connectors/interfaces.py:122`), and the **52 concrete connectors** that transitively subclass them are registered as impls of nothing.
- Build the roster from method **definitions** in `_a3_stacks_pydi._Walker` (a `self.methods` set populated in `_fn` when the enclosing scope is a class) — never from `w.calls`, which holds call sites and would drop 12 legitimate call-free targets (`PostgresCacheLock.owned`, `RedisCacheBackend.__init__`, …). Abstain-and-count, don't suppress, when the base chain leaves the scanned tree. Simulated: 453 → 348 pairs, gustify's 2 blessed edges survive. Take the transitive-closure half **separately, behind a fan-out cap** — simulated closure takes tier3 to 579 pairs with two sites fanning to 58 targets each.

### container-receiver — medium
- `_ann_name` unwraps any Subscript to its first capitalized element, so `list[Port]`/`dict[K,Port]` registers the **container** as a port receiver and `.append`/`.get` becomes a resolved binding edge.
- `_a3_stacks_pydi.py:69-71` (`return inner or _ann_name(node.value)`, no container guard). Measured by diffing a guarded copy over all four repos: tier3 507 → 431 edges (**76 container-derived, 66 distinct pairs**); gustify/gastify/keypro unchanged.
- Synthetic idiomatic shape fires end to end: `def pick(name: str, caches: dict[str, CacheBackend])` + `caches.get(name)` → `binds → RedisCacheBackend.get`, binding **"selected"**, and that target is a live `fn_slug` node, so `_a3_levels.py:367` mints it into `drawn_fn` and `:373-374` draws the wire.
- Guard the container roster in `_a3_stacks_pydi._ann_name` — **but pair it with collecting subscripted bases at `:114-115`**, or the guard alone deletes two landed, semantically correct tier3 edges (`SearchTool.run`, `SearchTool.tool_definition`), because `class SearchTool(Tool[...])` is only seen through the unwrap. Measured paired: tier3 507→491, ports 60→75, impls 125→147, all 76 landed baseline binds edges preserved, 48 genuine new pairs. Do not add `Awaitable`/`Coroutine` to the word list.

### ctor-field-receiver — medium
- Constructor injection — the dominant Python port shape — resolves nothing: params are filed under `Class.__init__` and `self.x: Port` under the method key, while the walk climbs only `Class.method → Class`.
- `_a3_stacks_pydi.py:129-132`, `:180-187`, `:292-295`. **41 ctor-field sites on tier3 resolve to nothing**, e.g. `backend/onyx/chat/stream_buffer.py:70/:76/:127` — both ends (`StreamBufferWriter.flush`, `RedisCacheBackend.set`) are drawn nodes, so the station shows the two ends and no wire.
- The same `cache: CacheBackend` as a plain parameter (`sandbox_proxy/approval_cache.py:64`) **does** draw. The docstring `:23-24` and `docs/design/repo-study/dispatch-gap-report.md:174` both claim an "attribute" receiver is covered, and `stats.graft.pydi` has no `unresolved` field (unlike its `di` sibling), so nothing makes the drop visible.
- In `_fn`, file `field → Port` under the enclosing **ClassDef** key when a port-annotated param is assigned to `self.<field>`; in `visit_AnnAssign` re-key **only** an Attribute target whose `.value` is `Name('self')` (reuse the guard at `:197-199`) — a plain local must stay method-scoped. Prototyped: gustify/gastify/keypro byte-identical, tier3 resolved 180→221, edges 507→668, ambiguous 134→175 (state it, re-bless tier3). Add the `unresolved` counter and correct the docstring FLOORS `:27-33` in the same pass.

### di-root-counts-builtins — medium
- The composition root is "the file with the most `new X(`", and `new Set/Map/Error/Date` all count.
- `_a3_stacks_di.py:60` + `:128-130`. Published as fact in two blessed baselines: gustify `apps/web/src/features/cooking/model/recipeFacetOptions.ts` (10 `new Set(` + 2 `new Error(`, **zero project classes**), gastify `web/src/hooks/useGroups.ts` (17 `new Error(`). tier3 never reaches the pick (no `implements`), so it is 2 of 4, not 3.
- Proved live on keypro: dropping one ordinary view-model file (20 builtin `new`s > container's 16) flips the root, strips the predicate from 54 of 65 edges and turns 47 from `selected` to `ambiguous` — and in one arm publishes `binding:"selected"` with a Storybook predicate for a production hop.
- Intersect `_NEW_RX` names with the `impls` class names and count **distinct** classes; when nothing reaches 2, set `root: None` with an emitted reason ("no file constructs two or more known implementation classes") — a bare `null` trades a stated lie for an unstated gap. Patched result: keypro holds `container.ts` even under attack, gustify/gastify go `None` (a 2-field re-bless).

### di-reason-misnames-cause — medium
- `present=False` always prints one hardcoded reason, even when the stats contradict both of its disjuncts.
- `_a3_stacks_di.py:203-204`; blessed gastify `stats.graft.di` = `{fields:12, sites:24, ports:2, impls:3, resolved:0, unresolved:24}` with "no class declares a port-typed field, or no such field is called" — but `mobile/src/lib/scanProgressSocket.ts:36` declares `socket: ScanWebSocketLike`, which **is** one of the two ports, and calls it at `:61`/`:185` as `this.socket?.close()`.
- A reviewer reads gastify's census and concludes the app has no port seam; the truth is optional chaining (`_THIS_CALL_RX:52` has no `\??`; 8 sites on gastify, 4 on tier3) and `export default class` (`_CLASS_RX:53`, 1 file each on gastify and gustify — the sole impl of the second port).
- Derive the reason from the stats in `_a3_stacks_di.py` (fields==0 / sites==0 / resolved==0 ∧ sites>0), and assert the **clause** at `tests/stack-di/run.sh:112`, which today only checks truthiness. **Ship the two regex widenings only with a test-path filter on the impl side**: applied bare they flip gastify to `present:true` with 8 false edges into `__tests__` FakeSockets, losing the "gastify census-identical" result.

### census-zero-lies — medium
- `if not impls: return` happens before the counting loop, so two fields are emitted as 0 without ever being computed.
- `_a3_stacks_pydi.py:267-270` precedes the increments at `:286`/`:288`. Blessed gastify reads `receivers:0, sites:0`; re-running the shipped `_Walker` over the same 165 files gives **receivers 2,514, sites 3,977**. gustify (1,870/1,904) and tier3 (13,928/24,927) carry real numbers for the same keys, so one field means "measured" on some projects and "never computed" on others. keypro's `files: 0` gets a verdict about factories for code never opened.
- A reader of the committed `c4-graph.json` concludes gastify annotates nothing with an abstraction — verbatim the "a zero reads as a fact" defect `_a3_arms.py:4-9` exists to kill.
- Count from `w.recv`/`w.calls` in the file loop at `_a3_stacks_pydi.py:231-233` (free — already populated), and say "no Python files scanned" when `files == 0`. Fix the identical defect at `_a3_stacks_di.py:119-121` in the same pass (tier3 ships `fields:0, sites:0, root:None` for a TypeScript-heavy repo). Leave `resolved`/`ambiguous` alone — those zeros are true. Byte-identity holds; only those stats move.

## Fix when convenient
- **3b2-source-only-orphans** — `_a3_levels.py:365/:373` both require a drawn source, so 74 of tier3's 152 dropped binds edges are discarded with their target already drawn (keypro's 5 caller-less `PostgresUserRepository.*` nodes). Fix: mint `drawn_fn.setdefault(c["s"], c["ss"])` when the target is drawn — measured gustify/gastify byte-identical, keypro 60→65/66→79, tier3 2,719→2,751/3,461→3,535. Land **after** the `_method_at` fix (it turns a lost edge into a drawn false node) and re-bless.
- **di-caller-nearest-call-line** — `_a3_stacks_di.py:54/:88-97` picks any indented `name(` line as the caller; a getter or a bare `clearInterval(...)` steals attribution. Latent (37/37 invocations correct across all four repos — tier3 never reaches it, 0 `implements` edges). Fix: take the narrowest containing `function|method` span from `wiring` and use that node's own **id**; abstain when none, never fall back.
- **di-predicate-any-if-above** — `_a3_stacks_di.py:164`'s `elif ln > hi` makes any closed `if` above a construction its predicate; 6 of keypro's 65 edges carry a false `config`. The proposed scope rule fails its own fixture and loses 9 correct keypro edges. Fix the **verdict** at `:196` instead: mark `selected` only when this impl's predicate is non-empty and distinct from every sibling impl's — one expression, restores the docstring floor.
- **di-field-span-overrun** — `_class_spans` ends a class at the next `class` or EOF (`:77-85`); every span overruns on all four repos, keypro harvests 2 of 17 `fields` from `interface ParsedHash`. Fix: brace-match with `min(next_class_mark-1, brace_end)`; edge sets unchanged on all four, keypro `fields` 17→15 (single-hash re-bless). Drop the first-wins stat — 0 duplicates measured.
- **di-impls-include-test-doubles** — impls come from graft unfiltered while sources skip `.test.`/`.spec.` (`:111-117` vs `:70-72`); gastify publishes `ports:2 · impls:3`, all test-only, one under the unresolvable bare key `Reporter`; gustify's entire published TS seam is one test helper. Fix: add `/test/`, `/tests/`, `/__tests__/`, `/e2e/`, `/fixtures/`, `/mocks/`, `/__mocks__/` to `_SKIP` and apply to impl ids, and count a `#`-less target as `ports_unresolved`. **Do not** re-key ports by full node id — measured, it silences keypro entirely (65 edges → 0).
- **scope-walk-edges** — `_a3_stacks_pydi.py:292-295` never consults the module key, and accepts a class-level annotation for a method's own local (a false `Holder.unrelated → RealVerifier.verify` in a fixture). Land the **shadowing guard only** (byte-identical on all four); opening module scope adds 10 edges on tier3, all false, until the container floor lands.
- **di-file-cap-silent** — `_a3_stacks_di.py:46/:65-74` clips at 4,000 files with no `files`/`capped` key, while its twin `_a3_stacks_sql.py:129-140/:241` reports both. Proved on keypro at cap 60: `present:true`, empty reason, and `stats.root` silently moves off the real composition root. Fix: return `(out, capped)`, publish both, and set the caveat **unconditionally** when capped (the damaging case has `present:true`, where `reason` is never written). Same one-liner owed for pydi's silent 6,000 cap. Drop `skipped_dirs`.
- **dead-scaffolding** — `_pred_of` (`:84-93`), the `_stack` bookkeeping feeding only it (`:107/:120/:122/:172/:174`) and `meth_of` + `for c in w.calls: pass` (`:272-276`) are all dead; deleting them is byte-identical on all four repos (318 → 296 lines). Delete only the `_stack` lines, never the interleaved `_scope` ones.
- **3c-node-admission-dead-after-2b** — 2b draws every ops-carrying function unconditionally (`_a3_levels.py:283-289`), so 3c's admission predicate (`:398-403`) is a strict subset and `_DATA_REACH_DEPTH` is inert (mutating it to 1/2/5 leaves all four baselines byte-identical; instrumented `nodes_admitted=0` across the whole battery). Collapse 3c to one pass over `sorted(drawn_fn)` **and** rewrite the false comment at `:382-383`, naming the new dependency on 2b staying unconditional.
- **di-no-register-row** — no `port_seam` concept or row in `_a3_stacks.py:37-50/:58-89`. **Do not apply the proposed fix**: applied verbatim it makes the census lie on 3 of 4 repos (keypro, 37 resolved, reports `state:"empty"`; tier3 and gustify report `unmatched`) because `_produced()` falls through to `return 0` for a concept with no archmap key, and the sentinel is a literal substring so `implements\s+[A-Z]` is dead. Either add it to `ELSEWHERE` as a pointer (updating the `tests/arms/run.sh` set assert), or simply render `di`/`pydi` present+reason in `map_health` (`mapquery.py:337-344`) and `center_overview` (`tools_wave2.py:221`), which read nothing today.

## Checked and clean
- **Byte-identity**, the gate for every step: gustify and gastify stay byte-identical under the ctor-field fix, the shadowing guard, the container guard, the 3b2 symmetry fix and the dead-code deletion (controlled shipped-vs-fix diffs, 82 and 80 files, 0 differing). Only tier3 and keypro move, and only where intended.
- **The blessed baselines reproduce exactly** from a clean generator copy: keypro 60/66, gustify 301/429, gastify 136/141, tier3 2,719/3,461, node ids and edge lists byte-equal; keypro's di stats (`resolved 37 · ambiguous 28 · fields 17 · root container.ts`) reproduce from a rebuilt wiring.
- **The phantom edges never draw.** All 115 tier3 phantom-method edges and all 74 container-derived ones are held out by `_a3_graft.py:225-231`'s both-ends-homed gate; the 2 container pairs that *do* land are semantically correct. Test-double impls likewise draw nothing — no test file is homed on gastify (`_a3_code.code_map:712-722`), and `FakeSocket.close` is not a node in the index.
- **Honest-empty holds where it counts**: tier3 di states a named capability floor ("the index carries no `implements` edge… structural matching is deliberately not used"); gastify/gustify/keypro pydi each carry distinguishable reasons. The register's binding contract is intact — `claimed_keys()` (`_a3_stacks.py:98-101`) is unviolated, neither arm writes an archmap key.
- **No collisions, no cascade**: zero bare-name `implements` target collisions on any of the four repos; the 3b2 widening adds 74 binds edges on tier3 and **0** cascaded 3c nodes; no duplicate field names inside any true class body.
- **Budgets and batteries**: `_a3_stacks_pydi.py` 318/800, `_a3_levels.py` 754/800 (756 after the 3b2 fix); `tests/stack-pydi/run.sh` and `tests/stack-di/run.sh` stay green under every proposed patch — which is also the problem: they would go green on the broken and the fixed arm alike, so each fix above owes its FIRE/SILENT case.

## Refuted
- **port-seam-unregistered** — the arms already state presence where the register's own contract sends them: `_a3_arms.ELSEWHERE` (`_a3_arms.py:36-44`) defers `call_graph` to "c4-graph.json stats.graft" precisely to avoid two truths, both arms emit `{present, reason, stats}` at `_a3_graft.py:1010-1011`, and the silence is distinguishable four ways across the blessed baselines — keypro's di is `present: true` with 37 resolved. A vocabulary wish, not an honest-empty breach.