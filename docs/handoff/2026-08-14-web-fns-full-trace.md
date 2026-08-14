# Handoff — the web-fns full-stack trace (Option B + the hidden-mass patch)

**Session goal:** add the FRONTEND half of the codebase-archive trace, wired to the
backend, so a workflow traces **UI → API → data** end to end — and make the
spine-reduction honest by attaching a *count of what it hides* to every drawn node.

Operator-chosen scope (2026-08-14): **Option B** (web subgraph + the api↔web bridge)
+ the **`behind` metric patch** (py retrofit AND web).

---

## Where we are (all committed + pushed)

| Commit | What |
|---|---|
| suite `7885aa4` | the lab-native rich feed — colors · dedup · communities · FK filter · adaptive use-case · **graft py `fn_edges`** (the backend spine) · Functions level · schema prune |
| suite `5d535f4` | the entity-shape drift detector (pulse S9 · review subject · cc-init lens) |
| suite `cc4f5eb` | example regen — the **settings entity** (allergen → pure aspect) |
| gustify `fcc3bb73` (staging, pushed) | settings entity in config+adoption+archmap |

The **py spine** is the reference implementation to mirror: `_a3_levels.build_levels`
draws handlers ∪ cross-entity model-users ∪ handler-call-targets (~190 of 2,261),
edges = handler-rooted graft calls (108). The web pass reuses this shape.

---

## The three work items

### 1 · The web spine (1,349 → ~24), FETCH-AWARE
Graft's TS→TS call graph is **1,689 calls / 1,349 functions** (measured on gustify).
Curate to a legible on-path set, same principle as py:
- **roots** = web entry points — containers/screens (`*Container.tsx`, `*Screen.tsx`)
  and the hooks/models they call (1 hop), + cross-entity TS→TS (314 calls).
- **⚠ KEEP THE FETCHING HOOKS** — any web fn that makes a `fetch`/axios call MUST
  survive the cut, or its endpoint shows no UI caller (a false "nothing touches this").
  Treat "makes an API call" as a keep-signal alongside "is a root".
- Web fn_nodes carry `layer:"web"`, `lang:"ts"`, homed by file→entity (the config's
  `web` lists — `_a3_graft._file2slug` already does this).

### 2 · The api↔web BRIDGE (the reason for Option B)
Graft traces **ZERO ts→py calls** — the frontend talks to the API over HTTP, not
direct calls. So the bridge is a **heuristic matcher**, not a graft edge:
- Parse each web fetch/axios call site for its **method + URL** (`fetch(\`/settings\`,
  {method:'PATCH'})`, axios `.patch('/settings/...')`, a generated api-client call).
- Match (method, path) to an archmap endpoint (the same `(method,path)` key the
  dedup uses). Normalize path params (`/pantry/items/${id}` → `/pantry/items/{id}`).
- Emit a **bridge edge**: web-hook → endpoint. This is what answers "which endpoint
  is this screen operating."
- Honesty: an unmatched fetch is NAMED (not silently dropped) — a bridge miss is a
  finding, like the graft "inferred = a floor" label.

### 3 · The `behind` metric patch (py retrofit + web)
Per drawn node (function · endpoint · model), from graft reachability over the FULL
call graph (not the drawn subset):
- `behind.fns` — reachable-but-undrawn function count (the hidden mass).
- `behind.depth` — max hop depth of the subtree.
- `behind.cycles` — does the subtree loop (back-edge / recursion)?
Measured range on gustify handlers: **0–32 fns, median 2** — `search_recipes` 32/d3,
`explore_recipes` 30, CRUD getters 0. The count IS the flow's complexity weight.
Render as a node badge (mirror the test-count pill); a high count invites a drill.

---

## Files to touch

- `templates/center/generators/_a3_graft.py` — `derive_functions` already returns
  `{fn_slug, calls}` (py+ts). ADD: a fetch-call extractor (parse web source for
  `(method, url)` at call sites) + a reachability helper for `behind`.
- `templates/center/generators/_a3_levels.py` — extend the drawn set with the web
  spine; emit web `fn_nodes` + ts→ts `fn_edges` + the bridge edges (web-hook →
  endpoint); attach `behind` to every drawn node.
- `templates/center/shell/example/level-lab/level-lab.html` — `drawFunctions` already
  has a `layer==="web"` branch; add the bridge-edge rendering (web-hook → endpoint
  marker) + the `behind` badge. The Trace level may also surface the bridge.
- `tests/levels/run.sh` — battery: web fns drawn · fetch→endpoint bridge match ·
  `behind` counts · fetch-aware keep (a fetching hook survives the cut) · honest
  unmatched-fetch. Mutation-proven.
- `tests/entity-drift/run.sh` + others — unaffected, but re-run.
- Regen the example (`scratchpad/regen_example_levels.py`), `install.sh`, `suite-doctor`.

---

## Design decisions to make IN-SESSION (hear the operator first)

1. **Fetch-URL extraction** — gustify's web likely centralizes API calls (a generated
   client or a `useApi` wrapper). FIND that pattern first (grep `fetch(`, axios, the
   api-client) — it decides whether the matcher is 1 parser or many. Spike before building.
2. **Web-root rule** — containers/screens only, or any fetching hook? (fetch-aware
   means a hook 2 hops from a screen but making a call is still a root.)
3. **`behind` per kind** — for a handler it's the call subtree; for a model it's the
   fns that touch it; for an endpoint, its handler's subtree. Confirm the semantics.
4. **Bridge visibility** — draw the web→endpoint edge on the Functions level, the
   Trace level, or both? The Trace is where "UI→API→data" reads as one path.

## Risks (⚠)

- **Fetch-URL heuristic noise** — dynamic URLs (`\`/pantry/${id}\``), a client
  abstraction, or query strings can defeat method+path matching. Measure the match
  rate on gustify FIRST; if low, the bridge needs the client pattern, not raw fetch.
- **Over-pruning the fetchers** — the keep-signal must win over the spine cut, or
  endpoints look UI-orphaned. Battery-guard it.
- **Scale** — 1,349 web fns; the cut must be tight or the web view is a hairball.
  Validate the ~24-per-view count against the fixture's 24.

## Why this matters (the purpose)

The diagram is a **workflow-tracing instrument** — follow how data moves through
functions, structures, and endpoints. Today it stops at the API boundary. Option B +
the bridge lets a trace answer *"this screen operates which endpoint, which touches
which model"* — the full stack. The `behind` patch keeps that trace honest: the
reduction stays for legibility, but its hidden mass is measured and visible, so the
diagram also shows **where the major flows are**.

## Data findings (measured, to ground the session)

- graft ts→py calls: **0** (cross-language not traced → the bridge is a heuristic).
- graft ts→ts calls: **1,689** / **1,349** fns; cross-entity **314**.
- py drawn set: **~190** of 2,261; edges 108 (handler-rooted).
- hidden mass behind a handler: **0–32 fns, median 2**, depth ≤4.
- fixture web fn_nodes: **24** (the ~target-per-view count).
