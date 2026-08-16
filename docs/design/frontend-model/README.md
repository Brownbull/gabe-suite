# Frontend Model — design record & build plan

> A richer frontend arm for the codebase-graph: from "screens" (fetching files) to a real
> structure graph — components, hooks, stores, routes, the frontend's own types — mirroring
> how the backend has models/schemas/endpoints/functions.
>
> Status: **PLAN** (research done, not yet built). Triggered 2026-08-16 by the operator's
> question "what about the frontend? those pieces do not exist on the frontend" during the
> levels-graph polish. The polish (color/force/dotted/finder/legend) shipped separately.

## 1. Where we are (Tier 0)

`templates/center/generators/_a3_web.py` is a **regex fetch-extractor**. A frontend file
becomes a node ("screen") ONLY if it makes an API call (`apiClient.GET("/path")` etc.). It
carries the `(method, path)` of each call, which `_a3_graph` matches to a backend endpoint
(the bridge). Nothing else is modeled.

Consequence: the frontend cluster is the **data-fetching layer** (in gustify, the `useX`
hooks), not the view layer. A `.tsx` component that renders UI but never fetches is
invisible. The asymmetry is real —

| | backend | frontend (today) |
|---|---|---|
| node types | model · schema · endpoint · function | **screen (fetching file) only** |
| derivation | Python AST (`function_insight`/`model_insight`) + graft call graph | **regex fetch-sites** |
| edges | FK · touches · returns · calls · imports | **bridge (screen→endpoint) only** |

## 2. Goal — the frontend structure graph

Model the frontend the way the backend is modeled: typed NODES + resolved EDGES, honest-empty.

**Nodes** (proposed kinds): `component` · `hook` (useX) · `store` (Zustand/Redux/Context/Jotai)
· `route` (page/route→component) · `fe-type` (the frontend's own TS interfaces — a
schema-equivalent) · keep `screen` as a role/flag on whichever file fetches.

**Edges**: `imports` (file→file) · `renders` (component→component via JSX) · `uses-hook`
(component→hook) · `uses-store` (consumer→store) · `fetches` (the existing bridge, screen→
endpoint). This mirrors graft's "one graph, two providers": TOPOLOGY (imports/refs) + DOMAIN
(the node classification).

## 3. Research — the tool landscape (2026-08-16)

**There is no single "graft for the frontend."** graft's power is a queryable cross-file
import+call graph; on the frontend that job splits into a **topology arm** (import/reference
edges) and a **domain arm** (classify nodes + prop/type schemas). No tool emits the semantic
node labels (this-is-a-store / this-is-a-hook) — you synthesize those on top.

Ranked candidates (all static, no app-run; JSON-emitting preferred):

| Tool | Yields | JSON? | Build-free? | License | Effort | Role |
|---|---|---|---|---|---|---|
| **dependency-cruiser** | file import edges + **reverse edges (dependents)**, type-only imports, cycles/orphans | ✅ `-T json` | ✅ (tsconfig for resolution only) | MIT | **low** | **topology arm** — the graft-imports mirror |
| **ast-grep** | AST-precise match nodes: `useX()` calls, `<Component>`, `create()/atom()/useContext()`, fetch sites | ✅ `--json` | ✅ | MIT | **low** | **pattern arm** — the AST-accurate upgrade of the regex extractor |
| **ts-morph** | build-your-own graph over the TS AST + type checker; component/hook/store nodes, render/call edges | you emit it | ✅ (degrades w/o node_modules) | MIT | med | **domain arm** engine |
| **react-docgen** | per-component prop schema (name/type/required/default/JSDoc) | ✅ | ✅ | MIT | low–med | hang a prop schema on component nodes |
| **scip-typescript** | compiler-accurate cross-file **symbol reference graph** (the truest graft-calls parallel) | protobuf (decode step) | static but wants deps installed | Apache-2.0 | med–high | Tier-2 resolved call/ref edges |
| skott / madge | file import edges (subset of dependency-cruiser) | ✅ | ✅ | MIT | low | fallback only |
| stack-graphs | no-build whole-repo name resolution | SQLite, not JSON | ✅ | MIT/Apache | high | long-term watch |
| semgrep | matches + taint (overkill) | ✅ | ✅ | LGPL + **restrictive rules license** | med | avoid (ast-grep is lighter + more permissive) |
| Glean | server-backed index | Angle query | needs a server | BSD-3 | very high | not for a static generator |

**No off-the-shelf tool for state/store detection or routes** — both are bespoke pattern
passes: store = definition (`create`/`createSlice`/`atom`/`createContext`) + consumers
(`useTheStore`/`useSelector`/`useAtom`/`useContext`), joined through the import graph; routes
= Next.js filesystem glob, or ast-grep the router config (`createBrowserRouter`/`createFileRoute`).

Sources: dependency-cruiser github.com/sverweij/dependency-cruiser · ast-grep github.com/ast-grep/ast-grep
· ts-morph github.com/dsherret/ts-morph · scip-typescript github.com/sourcegraph/scip-typescript
· react-docgen github.com/reactjs/react-docgen · skott github.com/antoine-coulon/skott.

## 4. Recommended path

**Tier 1 (do first — ~80% of the value, low cost, honest-empty, build-free):**
`ast-grep` (replace the brittle regex fetch-extractor with AST-accurate call-site + pattern
extraction) **+ dependency-cruiser** (import edges). Yields: screen/hook/component/store nodes
by naming convention + pattern, import edges, the fetch bridge — deterministic JSON both.

**Tier 2 (only once Tier 1 proves the node/edge model):** compiler-accurate reference edges
via `scip-typescript` (protobuf decode) or a `ts-morph` `findReferences` walker; `react-docgen`
prop schemas on component nodes.

Rationale: prove the model with the cheap AST layer before adopting a heavier indexer that
wants `node_modules` present and a protobuf-decode step.

## 5. Architecture fit (two arms, mirroring the backend)

- **`_a3_web.py` grows a topology arm** — shell out to `dependency-cruiser -T json` (self-provisioned
  like graft's `.graph/wiring.json`; `GABE_*_BUILD=0` reads as-found for read-only twin dry-runs),
  parse the module graph → frontend `imports` edges. Honest-empty when the tool or web root is absent
  (byte-identical to today's fetch-only build).
- **`_a3_web.py` grows a domain arm** — an ast-grep pass (rules for `useX`/JSX/`create`/`atom`/
  `useContext`/route configs) classifies each file into a node kind + emits render/uses edges.
  A SEPARATE try/except from the topology arm (a parser bug degrades to honest-empty, never touches
  the FK/graft bytes) — the same defense-in-depth the current web arm already uses.
- `_a3_graph.build_c4_graph` folds the frontend nodes/edges into `GABE_C4` (new L2 kinds +
  cross_edges), the same way the web bridge already lands.
- The levels page (`codebase-archive-lab.html`) `drawFrontend` grows from "screens on a force
  ring" to a small multi-glyph cluster (component/hook/store glyphs) — the force layout + per-entity
  bubble we just shipped already accommodate this (that is WHY we kept the bubble over concentric).

## 6. Constraints (non-negotiable, from the suite's design record)

Deterministic (sorted globs, no wallclock) · honest-empty (missing tool/root ⇒ empty field,
FK+graft bytes byte-identical) · read-only (never writes the twin tree) · build-free preferred
(no app run; tsconfig for resolution only) · every new detector ships fixture cases in `tests/`
proving it can FIRE and stay silent · a deterministic script runs against real data only after a
dry-run on a COPY with the numbers in the commit message.

## 7. Phased build plan

- **P0 — spike (1 slice):** run `ast-grep` + `dependency-cruiser` against gustify's `apps/web`
  READ-ONLY; hand-count what nodes/edges they yield vs the actual source. Record numbers. Decide
  the node-kind taxonomy from real data (not a template).
- **P1 — topology arm:** dependency-cruiser import edges into `_a3_web` (self-provisioned, honest-empty,
  own try/except) → `imports` edges in `GABE_C4`. Battery + twin dry-run numbers.
- **P2 — domain arm:** ast-grep classification (component/hook/store) + render/uses edges. New L2
  kinds + glyphs. Battery + both-twin numbers.
- **P3 — render:** `drawFrontend` multi-glyph cluster (kept bubble + force); the finder + legend
  (visual swatches) already generalize. Playwright field-match.
- **P4 (optional) — Tier 2:** scip/ts-morph resolved reference edges; react-docgen prop schemas.

## 8. Open questions for the operator

- Node-kind taxonomy: is `component · hook · store · route · fe-type` the right cut, or start
  narrower (hook + component + store)?
- Adopt `ast-grep`/`dependency-cruiser` as suite dependencies (npm/binary), or vendor a minimal
  equivalent? (They are external tools the twin must have installed — graft already sets this precedent.)
- Do routes matter for the graph, or is the component/hook/store/fetch core enough for v1?
