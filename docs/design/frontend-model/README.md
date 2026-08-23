# Frontend Model — design record & build plan

> A richer frontend arm for the codebase-graph: from "screens" (fetching files) to a real
> structure graph — components, hooks, stores, routes, the frontend's own types — mirroring
> how the backend has models/schemas/endpoints/functions.
>
> Status: **BUILT (P0–P3, 2026-08-23)** — see §9 for what landed, the measured numbers and what the plan got wrong. Triggered 2026-08-16 by the operator's
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

**Nodes** — DECIDED 2026-08-16: the **FULL** taxonomy, 7 kinds:
`component` · `hook` (useX) · `store` (Zustand/Redux/Context/Jotai) · `route`
(page/route→component) · `fe-type` (the frontend's own TS interfaces — a schema-equivalent)
· `endpoint` (backend, the bridge target) · `screen` = a role/flag on whichever file fetches.
Glyphs LOCKED to the operator-approved set from the `Frontend Graph Tiers` artifact:
component = browser-window · hook = fn-braces rect · store = box/package · route = signpost
· fe-type = schema-braces · endpoint = bolt (all Lucide, matching the levels-graph kit).

**Edges**: `imports` (file→file) · `renders` (component→component via JSX) · `uses-hook`
(component→hook) · `uses-store` (consumer→store) · `fetches` (the existing bridge, screen→
endpoint). This mirrors graft's "one graph, two providers": TOPOLOGY (imports/refs) + DOMAIN
(the node classification).

## 2b. CORRECTION — graft ALREADY indexes the frontend (the gap is ours, not graft's)

Measured 2026-08-16: gustify's `graft/.graph/wiring.json` = **18,494 nodes** (files + symbols,
each with `kind·path·span·signature·exported·summary·crux`) + **47,139 edges**
(`source·target·relation·confidence`), and **28,211 `.ts` refs** sit alongside 25,218 `.py`
(gastify: 22,106 `.ts`). TS files (`App.tsx`, …) are indexed with `origin:ast`.

So **graft has NO frontend gap** — it maps TS topology (imports/calls, cross-file) today, the
same as Python. The gap is entirely in the SUITE's CONSUMPTION: `_a3_web.py` regex-extracts only
fetch-sites and ignores graft's rich TS node/edge data. We have been leaving the frontend
topology on the table.

**This reshapes the plan — REUSE-FIRST:**
- **Topology (edges)** — come from graft's EXISTING TS wiring, not a new tool. `dependency-cruiser`
  is demoted to an optional import-only fallback (graft already covers imports + calls).
- **Domain (node kinds)** — the real new work: classify each graft TS file/symbol into
  component/hook/store/route/fe-type (convention + `ast-grep`, or `ts-morph`).
- **Oracle (verification)** — the compiler still matters: graft's cross-file TS calls are inferred,
  a FLOOR (per the suite's own graft trust-split), so `ts-morph`/`scip` is the authoritative
  denominator that tells us what graft's floor missed.

Net: the frontend arm is mostly a CONSUMER of graft's TS index + a domain classifier + a compiler
oracle — far less new tooling than §3/§4 first assumed.

## 2c. The DUAL PURPOSE — the map as pre-computed context (token-saving), not just a picture

The operator's framing: a codebase map exists so the suite's spine reads pre-computed context
instead of rescanning the codebase every task (graft/graphify's token-saving premise). Honest
current state:
- The ASSET exists and is rich — graft's `wiring.json` carries per-node `summary`/`crux` fields
  built for exactly this, over the WHOLE codebase (backend + frontend).
- The suite surfaces a SLICE into `archmap.json` (backend-leaning) + reads it in TARGETED ways:
  `gabe-cc-entity` assembles an entity context-pack "from the committed `archmap.json`, never
  re-reading the source"; `gabe-execute` uses graft for reach/reuse; `gabe-review` reads `archmap`
  for drift checks. But there is NO universal "inject the precomputed map as context on every task."
- So the double purpose is REAL but under-exploited: the index is a whole-codebase map; the wiring
  to save tokens broadly across the spine is partial.

**Adding the frontend map (this project) makes `archmap` whole-codebase** → `gabe-cc-entity` and any
map-reader then serve FRONTEND context too, same as backend. **Wiring the map as universal spine
pre-context is a SEPARATE, larger arc** (its own design record) — worthwhile, but not folded into
the frontend build; flagged here so it is not lost.

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

## 5b. Verification & completeness — the ORACLE strategy (operator's core concern)

The backend earned trust because Python's AST is authoritative + graft's graph was
cross-checked by the badge-vs-panel audit (24 defects found). The frontend needs the same
rigor, and the same shape: an authoritative ORACLE + a layered check that names every gap
instead of skipping it silently.

**The oracle = the TypeScript COMPILER.** It resolves every import, symbol, and reference —
it is the engine behind VS Code's "Find All References," so it knows the truth about what
connects to what. Reach it via **ts-morph** (in-process TS Compiler API, emits JSON we
control, degrades gracefully without `node_modules`) — or **scip-typescript** for a portable
committed index. This is the frontend's Python-AST-equivalent, and it is an EXISTING tool
(the operator's "prefer a tool over building from scratch" — the oracle is not hand-rolled).

The extraction and the oracle are DIFFERENT tools on purpose, so they can disagree:
- ast-grep + dependency-cruiser do the cheap, fast extraction (node classification + import edges).
- the compiler (ts-morph/scip) is the authoritative denominator we check that extraction against.

**Three verification layers (mirroring the backend):**

1. **Hermetic BATTERY** (`tests/frontend/`) — a tiny known React app with EVERY node + edge
   hand-enumerated; the extractor must find exactly that set (prove it can FIRE and stay
   silent, mutation-checked). Deterministic, like the synthetic archmaps in `tests/levels`.

2. **Real DRY-RUN + coverage numbers** against gustify's `apps/web` READ-ONLY:
   - **Node coverage** — the compiler enumerates ALL `.ts/.tsx` files (the denominator). Every
     file is either classified (component/hook/store/route/type) or bucketed `unclassified: N`.
     A skipped file is a NAMED number, never a silent drop → "not skipping nodes" is provable.
   - **Edge coverage** — `captured / compiler-resolved` for imports + references. A reference the
     compiler resolves that our graph misses is a listed gap, with the file+symbol.
   - Numbers go in the commit message (the suite's dry-run-on-a-COPY rule).
   - **Hand-verified sample flow** — the recipe-browse flow already enumerated by hand (7 nodes,
     6 edges: route→container→{view,store,hook}, hook→endpoint, type→hook) is a golden assertion.

3. **Adversarial AUDIT** — once it renders, the SAME badge-vs-panel + structural-sweep discipline
   that caught the 24 backend defects: agents diff the drawn frontend graph against the source +
   the oracle, hunting misclassification and missing edges the coverage % can't see.

The completeness guarantee is layer 2's node/edge coverage: the compiler is the total, our
extraction is the numerator, and the difference is always a named list — honest-empty applied
to completeness. **`ast-grep`/`dependency-cruiser` shift from "the extractor" to "the FAST extractor
verified against the compiler oracle"; scip/ts-morph rise from Tier-2 to the verification backbone.**

## 6. Constraints (non-negotiable, from the suite's design record)

Deterministic (sorted globs, no wallclock) · honest-empty (missing tool/root ⇒ empty field,
FK+graft bytes byte-identical) · read-only (never writes the twin tree) · build-free preferred
(no app run; tsconfig for resolution only) · every new detector ships fixture cases in `tests/`
proving it can FIRE and stay silent · a deterministic script runs against real data only after a
dry-run on a COPY with the numbers in the commit message.

## 7. Phased build plan

- **P0 — spike + oracle baseline (1 slice):** against gustify's `apps/web` READ-ONLY, run BOTH
  the fast extractor (`ast-grep` + `dependency-cruiser`) AND the compiler oracle (`ts-morph`
  `getSourceFiles`/`findReferences`, or `scip-typescript`). Report the **coverage numbers**: total
  files (oracle denominator) · classified-by-kind histogram · `unclassified: N` · edges captured /
  compiler-resolved. This IS the verification harness proving nothing is silently skipped — built
  first, before any render. Taxonomy already DECIDED (Full, 7 kinds); P0 validates it against real data.
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


## 9. BUILT — 2026-08-23 (suite `graft-adoption`, Gabe Universe batch 48)

### What the P0 spike measured (gustify `apps/web`, READ-ONLY, the numbers that changed the plan)

| measure | value |
|---|---|
| oracle denominator (TS compiler, non-test `.ts/.tsx`) | **488 files · 2,806 import sites (2,401 internal-resolved · 404 external · 1 unresolved) · 2,822 exports** |
| graft's TS coverage | every file indexed (2,627 fns · 880 types · 85 interfaces) but only **222 import pairs + 715 call pairs = 38.9 %** of the compiler's 2,290 file→file import pairs |
| graft-convention arm (`derive_frontend`, name/path only) | **637 "components"** vs the compiler's **458 JSX-proven** exported components (over-claims non-JSX Pascal fns + non-exported symbols); 793 fe-types incl. non-exported; 535 `calls` edges, no imports/renders/typed |
| fast regex classifier vs oracle (files) | 206 component · 44 hook · 5 store · 4 fe-type · 1 route · **113 stories** · **111 plain modules** · 4 other — 2 disagreements left (a container whose JSX the scan missed; a barrel) |

**Three plan corrections the numbers forced:**
1. **The TypeScript compiler is the extractor, not the oracle-only.** Import resolution (path aliases, barrels, index files) is compiler work; re-implementing it in Python or adding dependency-cruiser is strictly worse than running the `typescript` every TS frontend already ships. ast-grep/dependency-cruiser are not adopted.
2. **An 8th kind, `module`.** 111 files (23 %) are plain value-export modules (feature logic 52 in cooking, lib, api clients) — the target of 515 component imports. Burying them as "unclassified" would hide a quarter of the frontend; they are an honest named kind (ONE piece per file).
3. **Stories are excluded, named.** 113 `.stories.tsx` files are documentation, not app elements (they would have been "components").

### What landed

- **`templates/center/generators/_a3_fe_extract.mjs`** — the compiler pass (read-only, temp-file output, 4.2 s on gustify): per file → resolved imports · exported symbols {kind, JSX, hook} · per-export body refs {jsx tags · calls · type refs · idents · useContext args} · checker-resolved import BINDINGS (barrels followed). `GABE_TS_DIR` overrides where `typescript` lives (batteries). Exit 3 = no typescript, 4 = no tsconfig.
- **`templates/center/generators/_a3_fe.py`** — `fe_arm(root, entities, screens)`: classification per EXPORT (component = Pascal + JSX proof · hook = `useX` fn · store = create/createContext/atom const or `useXStore` · route = router config or `*Route` / under `routes/` · fe-type · module), homing via `_a3_graft._fe_home` (entity / `design-system` · `app-shell` buckets / candidate features), typed wires resolved through bindings (`renders` · `uses-hook` · `uses-store` · `typed` · `fecall` · `imports`, most-specific wins), **screen absorption** (the fetch arm's `web:` node lands on the file's principal piece), honest-empty (`GABE_FE_EXTRACT=0` · no web · no node · no typescript → `present=False` + reason). Wires are compact index triples.
- **`_a3_graph.fold_fe`** — the arm rides a SEPARATE top-level `fe` key in GABE_C4 (`fe=None` → byte-identical; `present=False` → only `stats.fe`), so the 2D station, the bridge drift detectors and every existing battery see unchanged bytes. `build_center_a3.py` runs it in its own try/except with a presence-flip tripwire.
- **The Gabe Universe fold** (`universe-build/parts/adapter.js` + `layout.js` + `card.js`): pieces → planets under their home (synthetic coloured clusters for buckets/candidates), `module` kind (slab form + grid glyph), `fe-type`→`type`, wires via `FE_REL`, **Types held back at boot** (`_FETYPES`, the Functions precedent — `T` toggle beside ƒ), the shared frontend card builder (Frontend section: home · absorbed screen · exports), the Everything-panel Sources row, the legend roster. **Layout at scale:** the fold tripled the field (260 → 888 planets at rest, 1,501 with types) and the clustering proof measured **48.5 % bleed**; fixed with frontend `KRADF` layers (types core → routes rim), containment 0.3 → 0.6, and a deterministic **hull-overlap relaxation** (`__uniRelaxHulls`: anchors ≥ 1.05·max(R_a+R_b, 2·max(R_a,R_b)) with R = 1.6×RENT, the measured settled radius) → **2.6 %**.

### Measured on gustify (twin-read-only, `GABE_GRAFT_BUILD=0`)

**1,273 pieces** — 437 components · 83 hooks · 5 stores · 22 routes · 613 fe-types (265 referenced by a running piece) · 113 modules — across 8 entities + 2 buckets (design-system 113 · app-shell 98) + 3 candidate features (profile 97 · shopping 55 · me 2). **3,566 wires** — 935 renders · 436 uses-hook · 28 uses-store · 1,124 typed · 815 fecall · 228 imports; 1,563 cross-home. **32 screens absorbed** (all), 48 bridge wires preserved. Excluded + counted: 113 stories · 2 barrels · 2 pascal-no-jsx. Unresolved: 927 refs into libraries, 112 onto files with nothing drawn. Feed: `c4-graph.js` 327 KB → 747 KB.

### Batteries

`tests/frontend/run.sh` (NEW, 45 cases, mutation-proven): the hand-enumerated fixture app (`tests/frontend/fixture/`, 12 files → 11 pieces · 11 wires, every kind + every rel, barrel + alias + story) as a FROZEN extractor JSON (hermetic) + the LIVE compiler case when a `typescript` resolves (`GABE_TS_DIR` or the twins' web `node_modules`) else SKIPPED by name; honest-empty states; `fold_fe` invariants; determinism; the JSX-removed mutation. `tests/gabe-universe` §10u + a frontend-aware render assertion; `tests/arch-graph` 172 unchanged.

### Deferred (named)

- `fecall`/`renders` as their OWN wire kinds on the Connections pane (today they ride `calls`/`imports` styling) — the pane pins 4 rows.
- Route → component tree from the router CONFIG object (path → element) — today only the JSX inside it wires.
- Prop schemas on components (react-docgen) · compiler-resolved reference edges beyond bindings (P4).
- The levels lab (`codebase-archive-lab.html`) still reads graft's convention arm; it has not been switched to `fe`.
