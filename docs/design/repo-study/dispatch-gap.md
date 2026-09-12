## Is it graft, TypeScript, or something else

"graft is blind to this codebase style" is **half-right, and the half that's wrong is the part you'd fix**. graft does read TypeScript types — but only three syntactic shapes, and keypro uses a fourth. `bindings.ts:272-278` binds `this.x` from a *field declaration* at class scope; `bindings.ts:279-283` binds a *constructor parameter* under its bare name at constructor scope. keypro writes `constructor(private readonly sessions: SessionRepository, ...)` — cookie-session-store.ts:63-66, auth-service.ts:21-22 — 20 such properties over 10 classes, 37 injected call sites, none in tests. graft extracts the type `SessionRepository` and files it under a key the call site never reads. So the receiver type is *absent*, not wrong, and `.create` falls to the bare-name path where 5 classes declare it → dropped (`resolve.ts:162` requires `global.length === 1`).

Your "one mechanism, two faces" is exact. There is a **third face, and it's the one that actually stops the walk**: `resolve.ts:160` returns `local[0]` from the same file with no uniqueness check and no not-the-caller guard, labelled `extracted` — graft's *highest* confidence. The committed graph carries 21 self-loop `calls` edges, all `extracted`, 8 under `src/` — including postgres-session-repository.ts:18 `return (await this.pool()).query<R>(sql, values)`, the literal database hop, drawn as `PostgresSessionRepository.query` calling **itself**. The adapter isn't merely unconnected upward: its interior terminates on a resolved edge, so a walker sees a step and stops.

Two brief corrections: your graft counts are stale — the file says 1,547 nodes / 4,268 edges / 2,266 calls / 1,340 contains / 649 imports / 12 implements / 1 extends. And a port file is **not** zero nodes: every port yields a file node plus its interface node, and all 12 `implements` edges have existing targets. What's missing is interface *method* nodes (`resolve.ts:77` builds the owner index only from `kind === "method"`) — and `resolve.ts:89` walks only `extends`, so the 12 `implements` edges are never consulted during call resolution.

Measured scale: of 790 method-target edges, the typed path produced 87 (11.0%); only 109 (13.8%) carried any receiver type at all. 702 of 735 `inferred` method edges rest on global name uniqueness alone. It is overwhelmingly a name index — but not blind.

## Why this never bit before

Because FastAPI apps call modules, not objects. Intra-language call-edge targets that are plain functions: gustify 4162/4356 (95%), tier0 869/871 (99%), tier2 83%, tier1 80%, onyx 73%. keypro TS is 137/415 methods (33%) — the highest method share in the study set. And FastAPI's own injection was already invisible: **177 of 177 `Depends(callable)` sites in gustify draw zero call edge**; the map covered the database through `access.ops` and the SQL arm instead, which masked the hole completely.

Where Python *does* hit it, it fails **silently instead of visibly** — the worse outcome. Onyx: 204 call sites through an abstract-annotated receiver → 137 land on the abstract base method, 18 on a real base default, 49 nothing; plus 320 factory-returned receivers → 303 nothing, 10 concrete. **514 of 524 injected sites (98.1%) reach no implementation.** All 83 abstract stubs that receive calls have zero outbound edges; 177 inbound edges die there; `onyx/llm/interfaces.py#LLM.invoke` absorbs 18 of them. keypro's walk visibly stops; onyx's lands on a named node and looks finished.

It is already in your shipped map. gustify's `levels.json` has `TokenVerifier.verify` in a `behind` list and `FirebaseTokenVerifier.verify` behind nothing — the auth journey has truncated one hop short of Firebase since the centre shipped (call site apps/api/auth/context.py:77; stub verifier.py:39; real work :103-120).

And it is the *same bug*: `self.dep = dep` from a typed `__init__` parameter is equally unbound (fixture: `holder_attr.py` no edge; `holder_ctor.py` and `holder_param.py` both resolve). One shared fix, not a TypeScript arm.

## The operator's instinct about a missing element

It's a missing **EDGE**, not a node kind: *which implementation is live under which configuration*. The 15 postgres methods over 2 tables are already nodes and already joined to SQL (archmap `sql_arm`: 18 statements, 15 joined functions), and the port nodes already exist. Nothing needs minting — one arrow is pointing the wrong way and one is absent.

Worth modelling on its own merits: **yes**, and your homing arm already noticed. `container.ts` comes out as one `module` piece with `home_ev.verdict: "shared"`, share 0.30, users split auth 3 · chat 2 · platform 2 · users 3 — the measured signature of a file that belongs to no entity because it binds all of them.

Correction to the brief: there are **four** dual-implementation ports, not three — SessionRepository, UserRepository, CredentialVerifier, ChatAssistant (graft's 12 `implements` edges: 4 ports with 1 impl, 4 with 2). And the fan is not ambiguity — it's **two deployment modes with a named, single-site selector**. Six of those implementations are partitioned by one predicate: `container.ts:72` `readPostgresConfig()` → `:74 if (!config)`, in-memory at :75/:80/:81, postgres at :93/:96/:97. ChatAssistant hangs off a *different* switch, `container.ts:50` `AGENT_USE_FAKE`. So for the dual ports a binding edge shows a fork whose arms land in different stores:

```
SessionRepository  --binds--> InMemorySessionRepository   when POSTGRES_* unset  → in-process Map
                   \-binds--> PostgresSessionRepository   when POSTGRES_* set    → sessions table
```

28 of 37 injected sites fan two ways, and every fan carries a predicate you can print. That is the fact no existing kind can state.

Separately (and decoupled from the walk) there *is* a small node-kind gap: this app has three persistence sinks and the map can name one. The `kp_session` cookie — written at cookie-session-store.ts:88, deleted at :122 — and the two `new Map<>` stores (in-memory-session-repository.ts:10, 15 op sites across the two) have no kind. `store` is already taken for a client React context. Real, but a schema change, so it's the full chain — decide it on its own, after the walk works.

## Option B, honestly

The real checker was run over keypro's tsconfig (typescript borrowed from tier0/node_modules — keypro has no install), 92 files. At cookie-session-store.ts:82 `this.sessions.create()` it answers `SessionRepository`. **38/38 production interface-method sites resolved, 0 wrong, with no node_modules** — port imports resolve through tsconfig `paths`.

But "the annotation erases the adapters" is wrong: the same run reads the branch returns — container.ts:78 → `{InMemoryUserRepository, InMemorySessionRepository, FakeCredentialVerifier}`, container.ts:94 → `{PostgresUserRepository, PostgresSessionRepository, RepositoryCredentialVerifier}`. The compiler *does* hand you the adapters. What it cannot do is pick one.

So: **one edge per implementation.** 38 sites → 66 edges (10 × one impl, 28 × two). Drawing one is a lie; drawing two bare is noise; drawing two with the predicate is the honest answer.

Cost is genuinely small: `_a3_fe_extract.mjs:52` already builds a Program and TypeChecker. One checker call in the call branch measured keypro 0.88 → 0.91 s, payload +2.7%; tier0/frontend (full install) 1.97 → 2.41 s; tier3/web 4.06 → 5.46 s at 823 MB.

What it does **not** solve, and this is the part that changes the price:

- **Member calls aren't recorded at all.** `_a3_fe_extract.mjs:121` keeps only `leftmost(n.expression)`, which is `null` for `this.x.y()` (`:66` requires an Identifier). `this.sessions.create()` isn't unresolved — it's absent. Per-call-site receiver typing is a new extraction pass, not a flag.
- **There is no class piece to attach to.** `_a3_fe.py` `_classify` falls through to `return None` at :216 for a plain exported class, so auth-service.ts and cookie-session-store.ts are each *one* `module` piece. Measured `by_kind`: component 32 · fe-type 112 · fe-unknown 1 · hook 1 · module 37 · route 6 · store 1 — zero class pieces. Method-level edges mean splitting every adapter/service file into N pieces, which moves `_PRINCIPAL` order, screen absorption, homing, mclass and the legend.
- **It's keypro-shaped.** `implements` clauses: keypro 8, tier0/frontend 0 (85 files), tier3/web 0 (1,287 own files). Gustify: 0 clauses, 7 interface-method sites, 0 implementation edges. Gastify: 3 clauses, all test helpers. Option B buys ~7 edges on your own twins.
- **The `any` bucket is a missing install, not honest silence.** Without deps, keypro has 1,529 `any` receivers of 2,282 property calls (67%). With deps: tier0/frontend 0 of 1,103, gustify 0 of 8,296. The "checker stays silent where graft lies" guarantee is untested with types present.
- **It doesn't reconnect the walk.** I patched graft to bind the parameter property — typed sites 742 → 779, calls **2,266 → 2,266**, and `CookieSessionStore.save` still points at `FakeConversationHistory.get`. Fanning out through `implements` on top: calls 2,266 → **2,263** — 5 false self-loops removed, 2 true edges gained. Net: the fix's real payoff is deletion, and it reads as regression on a stats tile.

## Recommendation

**Don't build option B as "tsc resolves the call." Build the composition-root edge, suite-side, in three steps.**

1. **Reconnect the substrate (~40 lines, `_a3_graft.py`).** Read `container.ts`'s 16 `new X(...)` sites — construction is entirely centralised: 104 sites repo-wide, 88 in tests, the only non-test file is container.ts — join them to graft's 12 `implements` edges, mint a binding edge per port→impl carrying its predicate, and fold it into the calls substrate the way `dispatches`/`module_calls` already do (`_a3_graft.py:903-908`, rel at :218-222). Measured on the real substrate: fn_edges 23 → 36, d2w keys 17 → 60, drawn fns 37 → 40, and the whole chain prints: `login → AuthService.login → CookieSessionStore.save → PostgresSessionRepository.create`. **No edit to the handler-only rule** — the comment at `_a3_levels.py:291` / filter at :296 is not the binding constraint; rule 3b (:313) and 3c (:352) already admit non-handler calls and simply have nothing to descend (11 fn_nodes at d2w 0, 26 null).
2. **Fix the last hop (two lines).** `access_edges` is 0 *not* because `model: null` blocks anything — `_a3_graph.py:653/:667/:732` already key a raw-SQL table by name, and `model:users`/`model:sessions` exist in the feed. It's two seams: `derive_endpoint_access` iterates `ent["endpoints"]` (`_a3_graft.py:392`) and all five keypro entities have 0 endpoints (its 11 roots are *action* roots); and the station keys the fn→model wire on `o.model` alone (`gabe-universe.html:2173`). Mirror the emitter: `o.model || o.table`.
3. **Delete the lies (hours).** A receiver-required / not-the-caller guard at `resolve.ts:160` removes all 21 self-loops including `PostgresSessionRepository.query → itself`; the 7 of 23 shipped `formData.get → FakeConversationHistory.get` edges die with it. Then fix the shared binding bug at `bindings.ts:279-283` (and the Python `self.x = x` twin) for honesty — expecting **zero** new edges from it alone.

**The trade-off:** step 1 hard-codes a hexagonal idiom (a factory returning ports, constructing impls in mutually exclusive branches). It fires on keypro and nowhere else in the study set, and it will need a state word in the arms census so a repo without that shape reads `unsupported_idiom` rather than clean. Steps 2 and 3 are unconditional wins.

**What I would not do:** structural assignability as the fallback for repos with no `implements` — 5 all-optional props interfaces matched all 17 keypro classes, 85 false pairs against 8 exact ones. Any resolver that *picks* the live implementation: `_a3_graft.py:217` folds `confidence` through verbatim, so a guessed adapter edge would inherit the same trust as a real one. And a new node kind as the first move — the binding is an edge, and the cookie/Map stores are a separate decision.

**One latent defect to fix in step 2's neighbourhood:** `_a3_graft.py:424` keys ops as `(o["model"], o["rw"])` with `model=None` for every raw-SQL row, so `users` and `sessions` writes collapse into a single op — and the sort at :430 on `(x["rw"], x["model"])` will raise `TypeError` on any tree mixing ORM rows (model set) with raw-SQL rows (None) at the same `rw`.