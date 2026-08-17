# 5C — the 3D Trace (design spec, before the spikes)

> **5C is the 3D sibling of 5B.** 5 = SVG Trace · 5B = 2D force-graph Trace · **5C = 3D
> force-graph Trace** (`3d-force-graph`, vasturiano — three.js/WebGL, same API family as the
> `force-graph` we vendored). Same data, same interaction *logic*; a new render + orbit controls.
>
> **Why now:** the 2D plane is saturated (operator: "what we have today really stretched the
> limits of the two-dimensional plane"). The Z axis buys a new encoding channel *and* un-crowds.
>
> **This doc spells out HOW we conform the 3D plane. We agree the grammar, THEN spike, THEN
> assemble 5C.** Nothing here is built yet.

---

## 1 · What ports for free (render-agnostic) vs what is rebuilt

The 5B work already split cleanly: the **logic** doesn't know about 2D.

| Ports unchanged | Rebuilt for 3D |
|---|---|
| the highlight BFS (depth, cross-hop rule), journeys, the finder | the DRAW: 2D canvas glyphs → three.js **meshes/sprites** (`nodeThreeObject`) |
| the spec builders (nodes/links, keys, entity `cl`, sub-groups) | the CONTROLS: the SVG wheel scheme → **orbit** (drag=rotate · right-drag=pan · scroll=zoom) |
| the panels (`showEndpoint`/`showFn`/`showPiece`), selection keys | the LAYOUT: 2D cluster ring → a 3D arrangement (entities in a ring **+ a Z axis**) |
| the grouping (kind/usecase/community/fk/tests) | link rendering: canvas quadratic → three.js line/tube + 3D particles |

So 5C is **~60% reuse**: feed the same spec into a 3D renderer, swap draw + controls + layout.

---

## 2 · Scope for the spikes (small on purpose)

Not the whole graph — **two connected entities + one frontend set**, so we can iterate the
representation fast and read it clearly.

- **Backend pair — RECOMMEND `recipe` + `auth`.** `recipe` is the richest (most endpoints /
  handlers / models / schemas — "a bit of everything"); `auth` is the **cross-entity hub**
  everything FK's into (User / Household), so it's the best pair to prove **inter-entity
  connections** in 3D. (Alternative: `recipe` + `cooking` — cooking is downstream of recipe,
  a cleaner one-way flow but fewer cross links to stress-test.)
- **Frontend set — one feature** (e.g. the recipe screens: components + hooks + the store),
  to establish how FE kinds sit in the same 3D grammar.

---

## 3 · The representation grammar (the core — what each channel MEANS)

Three independent channel families: **FORM** (what kind), **NODE CHANNELS** (the metrics), **LINK
CHANNELS** (the relations). All are real, per-node data we already emit.

### 3a · FORM — kind → 3D shape (`nodeThreeObject`)

Kind is the **shape** (as in 2D), now as a solid mesh so it reads from any angle:

| kind | 2D glyph | 3D form |
|---|---|---|
| endpoint | bolt-in-circle | a **portal ring / beveled torus** (sits on the entity shell — the exposed surface) |
| handler ƒ | rounded square + ƒ | a **rounded cube** (a "unit of work") |
| using ƒ | same, teal | a **sphere** (service) |
| model | cylinder | a **3D cylinder / database** |
| schema | braces box | an **octahedron** (a faceted "contract") |
| component (FE) | ▢ | a **flat panel / card** |
| hook (FE) | hook | a **torus** |
| store (FE) | cylinder | a **cylinder** (as model, FE-hue) |
| route (FE) | ◇ | an **octahedron** (FE-hue) |
| type (FE) | `{}` | a small **wireframe box** (quiet) |

### 3b · NODE CHANNELS — the metrics → visual encoding (what the operator listed)

We have real per-node metrics: `behind` (code-behind mass + depth), `hub.usage` (fan-in /
used-by), `tests`, `nfk` (FK count), `god`. Proposed mapping (**one decision to confirm**):

| channel | encodes | data |
|---|---|---|
| **hue** | ENTITY (identity) | `entCol` |
| **size** | **code-behind mass** — how much is pulled in behind it | `behind.fns` |
| **emissive glow** | **test coverage** — tested nodes glow green, untested are matte | `tests` |
| **halo ring (orbit)** | **used-by / fan-in** — a ring whose weight = in-degree | `hub.usage` |
| **a red satellite** | **god / hotspot** | `god` |

So at a glance: *hue = whose · shape = what · size = weight behind it · glow = proven · ring
= depended-on.* Five facts on one node without reading a label.

### 3c · LINK CHANNELS — relations → encoding (richer in 3D)

The operator wants the wiring itself to carry more. In 3D we have geometry + color + motion:

| channel | encodes |
|---|---|
| **geometry** | straight for intra-flow; **curved/bundled** for cross-entity FKs (edge-bundling cuts the 3D hairball) |
| **color** | relation kind (route/touch/resp/xfk/use) OR entity-blend (as 5B) |
| **particles** | direction + traffic (the flow, as 5B) |
| **thickness / opacity** | confidence (graft-inferred cross-file calls are a FLOOR → thinner/dashed) |

---

## 4 · The 3rd dimension (Z) — the key semantic choice

The whole point of 3D is what the **Z axis** means. Three options (**decision to confirm**):

- **A — LAYER ALTITUDE (recommend):** endpoints at the top (the shell), handlers below,
  services below that, data at the bottom. A request literally **falls down through the
  layers**. Entities are columns on the XY ring; the request-flow reads top→down. This is
  4B's lane idea, stood vertical — the most *semantic* Z.
- **B — a METRIC:** Z = `behind.depth` (call-tree depth) — deeper code sinks lower. Good for
  "how deep does this go," weaker as a navigational frame.
- **C — free 3D force:** no semantic Z, the layout just breathes in 3D. Simplest; least meaning.

Recommendation: **A (layer altitude)** — it makes 5C "the request falling through the layers,
in space," which is the story the Trace tells.

---

## 5 · Controls (3D)

`3d-force-graph` ships three.js **OrbitControls**: **drag = rotate**, **right-drag = pan**,
**scroll = zoom**. That covers the operator's "ctrl-rotate OR right-click move." Click =
select (highlight ports unchanged); the depth slider + journeys work as-is.

---

## 6 · The spike plan (after we agree §3–§4)

1. **Spike 1 — render path:** vendor `3d-force-graph`; render the `recipe`+`auth` spec as a
   3D force-graph with kind-**shapes** + entity-**hue** + orbit controls. Prove WebGL + the
   reuse of the existing spec builder.
2. **Spike 2 — Z axis + node channels:** layer-altitude Z; size=code-behind, glow=tests,
   halo=used-by. Read it from several angles.
3. **Spike 3 — link channels:** cross-entity bundling, particle flow, kind-color.
4. **Spike 4 — one frontend set** in the same grammar.
5. **Assemble 5C** as a new level (`data-lvl="trace3d"`), reusing the highlight/journey/finder.

Each spike is a headless-verified render + a screenshot for sign-off, same discipline as 5B.

---

## 7 · Open decisions (for the operator)

1. **Entity pair:** `recipe`+`auth` (rec — hub, most cross links) · `recipe`+`cooking` · other.
2. **Z axis:** layer-altitude (rec) · a metric (`behind.depth`) · free 3D force.
3. **Node channels:** confirm size=code-behind · glow=tests · halo=used-by (or reassign).
4. **First spike as:** a throwaway standalone page · or straight into a `5C` level.

Costs: vendoring `3d-force-graph` adds three.js (~single ~1MB min.js, one-time). Spike 1 is
~half a day; the full 5C with all channels is a multi-spike arc.

---

## 8 · SPIKE 1 — BUILT (2026-08-17)

A live, self-contained 3D spike is at **`/home/khujta/gabe-graph-review/spike-3d/index.html`**
(open in a browser). It renders **recipe + auth** (77 nodes) in `3d-force-graph` and puts
**every channel above on a live toggle** so we can compare them:

- **Z axis** toggle: Layer altitude · Call depth · Free 3D. (Layer altitude reads best — the
  request falls top→down: endpoint rings up top, handler cubes mid, schema octahedrons +
  model cylinders at the bottom.)
- **Node size:** Code-behind · Used-by · Uniform.
- **Extra channels** (checkboxes): glow = tested · halo ring = used-by · red satellite = god.
- **Links:** colour by kind / by entity · particles = flow · curve cross-entity wires.
- Kind = shape: endpoint = portal **ring** · handler = **cube** · service = **sphere** ·
  model = **cylinder** · schema = **octahedron**. Hue-ring at the base = entity.
- Orbit controls (drag=rotate · right-drag=pan · scroll=zoom).

**Rebuild the bundle** (self-contained, THREE + ForceGraph3D one instance — a separately
loaded three.js conflicts with the bundled one):
```
npm i 3d-force-graph three
echo "import * as THREE from 'three'; import ForceGraph3D from '3d-force-graph';\
 window.THREE=THREE; window.ForceGraph3D=ForceGraph3D;" > entry.js
npx esbuild entry.js --bundle --minify --format=iife --outfile=3d-bundle.js
```
Data slice (`spike-3d-data.js`) is extracted from a built `levels.json` (recipe+auth
endpoints→handler→touched→resp + cross_edges + use_edges, each node carrying
behind.fns / behind.depth / hub.usage / tests / god).

**NEXT after operator review of the spike:** lock the channel choices → assemble 5C as a
`data-lvl="trace3d"` level, reusing 5B's highlight/journey/finder logic + the shared spec
builder, swapping only draw (three.js meshes) + controls (orbit) + the Y-altitude layout.

---

## 9 · SPIKE 2 — "one of each kind" (atomic 3D vocabulary, 2026-08-17)

Operator backtracked: settle the **atomic** representation (each kind's 3D form + its
right-panel + its links) before the composite graph. Two deliverables:

- **`docs/design/codebase-graph-consolidation/element-components.html` UPDATED** — the
  per-kind right-panel reference now includes the **frontend kinds** (Component · Hook ·
  Store · Route · Type), each with its own panel (Connections · Identity · Note), beside
  the backend kinds. 12 panels.
- **`/home/khujta/gabe-graph-review/spike-kinds/index.html`** — a minimal 3D graph, **one
  node per kind**, wired FE→API→data through every kind, each kind a **distinct 3D form**:

  | kind | 3D form | | kind | 3D form |
  |---|---|---|---|---|
  | endpoint | torus **ring** (method-hue) | | component | flat **panel** |
  | function | **cube** | | hook | torus-**knot** |
  | model | **cylinder** | | store | **cylinder** (FE-hue) |
  | schema | **octahedron** | | route | **cone** |
  | entity | wireframe **icosahedron** (container) | | type | wireframe **box** (erased) |

  Links carry a **relation label** + colour + particles (renders/uses/reads/typed/fetches/
  handler/touch/resp/in). **Click a node → its element-components panel.** Y = layer
  altitude (FE up top, data low). Legend = the vocabulary.

**ORBIT FIX (operator: rotation felt spinny):** `controlType` is a *construction* option in
3d-force-graph — the spike now builds with **`{controlType:'orbit'}`** (up-vector stays
fixed, no roll) with a **Trackball** toggle + a **Reset view** button. (A full nav-cube
gizmo is a later nicety.)

**NEXT:** settle each kind's form + link encoding + the clustering encoding here → then
return to the group spike (recipe+auth) → then replicate the grammar into 5C + the suite.
