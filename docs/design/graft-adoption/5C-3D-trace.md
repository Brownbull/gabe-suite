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

### 9a · ICONS + panel (operator pass, 2026-08-17)

- **Type icon fixed** — `element-components.html`: Type was `{ }` braces, too close to Schema.
  Now `< >` (code brackets); the icon is the only identifier, so no two kinds share one.
- **spike-kinds — an ICON-MODE SELECTOR** (all three use the SAME element-components lucide
  glyphs, one per kind), so we can iterate and compare:
  1. **Primitives** — abstract 3D shapes (ring/cube/cylinder/octahedron/cone/knot/panel/…).
  2. **Billboard 2D** — the flat 2D lucide icon as a camera-facing sprite (crispest, reads
     exactly like the panel; always legible from any angle).
  3. **Tube 3D** — the lucide icon **traced as solid 3D tubes** (`SVGLoader` → subpath
     points → `CatmullRomCurve3` → `TubeGeometry`, y-flipped/centred/scaled): a real 3D
     object that catches light + rotates, but still *reads* as the 2D icon. (Fill-extruding
     fails — lucide icons are STROKES, not fills; tubes are the correct 3D-ification.)
- **Panel = the element-components card** ported into the spike: Usage bar · Connections
  (with the kind glyphs) · Tests · Identity · Note, plus a **minimize-to-rail** button.
- Bundle now also exposes `SVGLoader` (esbuild, one three instance).

### 9b · volume + bubbles + font (operator pass, 2026-08-17)

- **BUBBLE (the sphere container, default ON, toggle)** — every node is a translucent
  glowing sphere (kind hue · wireframe rim · a bright core) with the icon INSIDE. It does
  three jobs at once: gives the flat 2D icon **volume**; is the **boundary the links reach**
  (no more line stabbing the icon centre — the operator's confusion); and is the canvas for
  **effects** (glow/rim now; fresnel/pulse later).
- **SOLID 3D icon mode** — the icon's filled silhouette **extruded with a bevel** (createShapes
  closes the stroke path → a fill → ExtrudeGeometry): the 2D icon with real depth (a solid
  lightning bolt, diamond, `{ }`, `< >`, hook). The volumetric look, still reading as the icon.
  Four modes now: **Billboard 2D · Solid 3D · Tube 3D · Primitives** (Billboard is the default).
- **FONT** — the link + node labels now use the **Gabe-center content font (Menlo, mono)** with
  a selector (Menlo · Cascadia · Segoe · Helvetica). (Was a generic sans.)

**Open for the operator:** the default icon mode (Billboard-in-bubble vs Solid-in-bubble),
and which bubble effects to add (fresnel rim · pulse on select · colour = a metric).

### 9c · all 12 kinds · slim bubbles · first CLUSTERING pass (operator, 2026-08-17)

- **Default LOCKED: Billboard 2D + bubble on** (operator's pick).
- **12 kinds** — added the two missing from element-components: **Frontend screen** (monitor)
  + **External (fk target)** (external-link). Entity stays the container/boundary, not an
  icon-node.
- **Bubbles slimmed** — smaller (r 7.8, was 11), tighter to the icon, more transparent, and
  **NEUTRAL grey** (no longer the kind colour): the colour channel is now free for clustering.
- **CLUSTERING — first pass:** the graph is now **two entities** (recipe · auth). Each node
  carries `kind` (→ icon/panel) + `ent` (→ cluster). Layout: layer on Y, **entity on X** (the
  clusters pull apart). A **big translucent sphere per entity** (colour = ENTITY, updated each
  `onEngineTick` to enclose its cluster, labelled) is the "one big entity around the icons".
  Icon colour = kind · bubble = neutral · **big sphere = entity** — three separate channels.
  A cross-entity FK wire runs recipe.Recipe → auth.users.id.

**NEXT:** tune the cluster boundary (sphere vs hull; the layer-spread makes recipe's sphere
tall) + the clustering encoding → then scale to recipe+auth real data → then 5C + the suite.

### 9d · clusters as an AURA + sub-clusters (operator, 2026-08-17)

Operator: drop the hard sphere; a cluster should be an **aura** around the elements AND the
links — and show **sub-clusters inside** the entities.

- **AURA (replaces the wireframe sphere):** soft additive **glow sprites** (a cached radial-
  gradient texture, `AdditiveBlending`) placed at every member **node** AND at two points
  along every member **link** — overlapping glows merge into a cloud that wraps the elements
  and their connectors. Updated each `onEngineTick`.
- **Two levels:** the **entity** aura is big + faint (colour = ENTITY); the **sub-cluster**
  aura is tighter + denser, hue-nudged off the entity colour, and **labelled** (frontend ·
  api · data — the layer band, standing in for kind/usecase/community/fk). So you read the
  entity as a soft cloud with denser sub-clouds inside.
- Channels stay separate: **icon = kind · bubble = neutral · entity aura = entity · sub aura
  = a hue-nudge of the entity**.

Tunable: aura opacity/size, sub-cluster key (layer vs kind vs the 2D grouping), hue spread.

### 9e · cluster controls: shape × transparency, two-level polygons (operator, 2026-08-17)

- **Bar decluttered** — icon (Billboard), font (Menlo), rotation (Orbit) are LOCKED; their
  selectors removed to make room.
- **Bubble** → a dropdown of transparency levels (subtle · medium · strong); never off.
- **Cluster controls, two levels each a SHAPE × a TRANSPARENCY dropdown:**
  - **sub-cluster:** aura · polygon · off × subtle/medium/strong.
  - **entity:** aura · sphere · polygon · off × subtle/medium/strong.
- **POLYGON = a convex HULL** (`ConvexGeometry` over the member positions, rebuilt each tick;
  <4 pts → sphere fallback). The **entity hull is padded bigger** (pad 16 vs 5) so it "contains
  the same elements + more"; sub-cluster hulls sit inside and may **overlap** (fine). So you can
  now dial: sub = tight inner polygons, entity = a big outer polygon — the nested-containment
  the operator described. SPHERE and AURA remain as alternative shapes per level.
- Channels still separate: icon = kind · bubble = neutral · cluster colour = entity (sub =
  hue-nudge). Bundle now also exposes `ConvexGeometry`.

### 9f · curved + roomy polygons · the WRAP shape · lighter opacity (operator, 2026-08-17)

Operator ruling (drawing: entities connected, an outer shell around entities + their links = a
cluster; clusters nest inside entities; two containment levels — inner = the cluster around
elements+connectors, outer = a polygon holding "the same + more" = the entity).

- **Polygon now ENCLOSES each node, and rounds.** Old hull anchored to node *centres* (icons
  poked the boundary). New `hull(ms,pad)` seeds a sphere of 12 icosahedron points (radius
  `NR+pad`) around every member, then convex-hulls the cloud → the boundary clears every icon
  (room to spare) and the corners read rounded, not faceted. Entity pad 26 vs sub 10.
- **WRAP = a new shape: a sphere at each node + a cylinder along each connector** — the
  "spheres and cylinders that surround the connectors" from the drawing, a *secondary polygon*
  built from solids. It reads as an organic, fully-curved blob (the closest match to the
  hand-drawn shells). Available at both levels; cylinders oriented per tick
  (`quaternion.setFromUnitVectors(UP, dir)`).
- **Shape sets now:** sub = aura · polygon · **wrap** · off; entity = aura · sphere · polygon ·
  **wrap** · off. A polygon-outer + wrap-inner mix reproduces the two-level sketch.
- **Opacity retuned LIGHT, five steps.** medium/strong were too strong; added **ghost** + **faint**
  below subtle. `OPMAP` per surface (bubble/aura/sphere/polygon/wrap). Defaults: bubble=subtle,
  sub=aura/faint, entity=polygon/ghost.
- Spike gained a URL preset (`?entShape=…&entOp=…`) + a `window.onerror` red banner — for scripted
  comparison shots (`google-chrome --headless --use-angle=swiftshader`, no puppeteer on this box).
- OPEN: the polygon's long spans between distant nodes stay flat (convex-hull limit). Fully-curved
  *polygon* (metaball/marching-cubes) is a heavier lift — **defer until** the operator picks polygon
  over wrap AND the flat spans read wrong at real scale; wrap already covers the curved case.

### 9g · WRAP = a fused liquid (metaball) · faint polygon · film opacity (operator, 2026-08-17)

Operator ruling (two drawings: image-1 = the current discrete users.id/User wrap; the sheet = an
arrow to the DESIRED single sticky glob). "Cannot distinguish one [sphere/cylinder] from the other …
a unified wrap … like a liquid, basically around what is inside."

- **WRAP is now ONE metaball iso-surface**, not discrete spheres + cylinders. `MarchingCubes`
  (`three/examples/jsm/objects/MarchingCubes.js`, added to the esbuild bundle → `window.MarchingCubes`)
  builds a single fused surface per cluster: a ball at each node (`nodeR`) + balls sampled along each
  connector (`tubeR`) melt into one sticky liquid; the connector becomes a neck, no part is separable.
  Coordinate map: geometry spans local [-1,1], balls in [0,1]; `strength = (iso+subtract)·(r/2S)²`,
  `S` = uniform half-extent of the member bbox + nodeR. Applies at **both** levels (sub + entity).
- **Cost control:** the metaball is expensive (O(res³) per rebuild), so it rebuilds every `every`
  ticks during cool-down + a **forced final on `onEngineStop`** (crisp settled blob). res 96 entity /
  64 sub. `WRAPCFG` is URL-overridable (`?wEntRes=…&wIso=…`) for tuning. Only built when WRAP is
  selected — a plain load (polygon default) pays nothing.
- **POLYGON lost its wireframe.** The vertex lines competed with the element links and would only
  multiply as entities grow. Now a **Lambert-shaded translucent fill** (with `computeVertexNormals`)
  carries the form; no lines. Directly answers "make the lines between vertices less prominent."
- **Opacity gained `film`** — below ghost, the barest whisper (bubble default now `film`). Six steps:
  film · ghost · faint · subtle · medium · strong. WRAP has its own heavier ramp (a metaball at 0.01
  is invisible; its faint = 0.08).
- Verified headless (google-chrome swiftshader): liquid single-blob, two-level nested blobs, faint
  polygon, 0 JS errors. The metaball reproduces the sheet's peanut/neck shape a convex hull cannot.
- OPEN: metaball at REAL scale (dozens of nodes, long links) may need res/every tuning for perf; the
  `WRAPCFG` URL knobs exist for that. Sub-blob vs entity-blob separation currently rides opacity +
  hue-nudge — revisit if they read as one at real density.

### 9h · wrap-shows-nothing BUG + control narrowing (operator, 2026-08-17)

- **BUG (operator: "select Wrap, I don't see anything … titles pile in the middle, everything
  intertwined").** Root cause: the metaball rebuild was gated `if(!force && _wtick%every!==0) return;`
  — a `return` **inside** the `CLUSTERS.forEach`. Switching to wrap AFTER the sim cooled meant the one
  `updateClusters()` call hit the gate, `return`ed, and (a) never added balls → empty invisible
  surface, (b) skipped the label-positioning code that follows the shape branches → both entity labels
  fell back to origin (0,0,0) and stacked at screen centre. Screenshots missed it because a URL preset
  builds wrap DURING the tick loop (gate passes), never post-settle.
- **FIX:** gate only the REBUILD, never the label — `else if(shape==="wrap" && (force||_wtick%every===0))`
  so a non-rebuild tick falls through to the label code. And `onCluster` now calls `updateClusters(true)`
  (force) so flipping to wrap when the sim is already stopped builds the blob immediately. Regression
  hook `?drive=wrap` flips the selectors AFTER `onEngineStop` to exercise exactly this path.
- **Controls narrowed** (operator): shapes are **polygon · wrap** only now — aura removed from both
  levels, sphere removed from entity. Transparency is **faint · ghost · film** only (subtle/medium/strong
  dropped from the UI; OPMAP keys kept but unexposed), and the three transparency selectors (bubble ·
  sub · entity) moved to a **top-right panel** — the keepers that carry into the final diagram (a nav
  bar later). Wrap's film/ghost/faint values bumped (0.06/0.11/0.17) so a metaball still reads at the
  three light levels.
- OPEN: the force layout is non-deterministic between runs — one settle spread the entities wide,
  another overlapped them. If overlap reads as "intertwined" at real scale, seed the layout or widen
  the entity-separation force (`EX`).

### 9i · config panel (draggable · icons + pills) · shared shape · radius (operator, 2026-08-17)

The transparency strip becomes a real **config panel** — the control surface that carries into the
final diagram (a nav bar, later).

- **Panel:** draggable (grab the header) · minimizable (`–`/`+`) · starts top-right · legend font (the
  body sans, not the OS select font) · every group led by a lucide icon. Node-detail panel moved to the
  left column so it no longer collides.
- **Pills, not dropdowns** (operator rule: ≤3 options → a pill toggle, >3 → a dropdown; everything here
  is ≤3): CONTAINER `shape` = `polygon | wrap` (icons); SHOW = `sub` / `entity` on-off toggles (deselect
  = that level hidden); TRANSPARENCY = three 3-way pills (`bubble` / `sub` / `entity` × faint·ghost·film).
- **Shape is SHARED** (operator "one or the other for both"): one `polygon | wrap` choice drives BOTH
  levels. `CFG.subShape`/`entShape` collapsed into `CFG.shape` + `CFG.subOn`/`entOn`.
- **Radius** — a bounded slider (0.6×–1.6×, `RADMIN/RADMAX`) fits both containers tighter or looser.
  Applied LIVE in `updateClusters` (polygon `pad·radius`, wrap `nodeR/tubeR·radius`) so dragging never
  forces a metaball rebuild — the slider's `input` just re-runs `updateClusters(true)`.
- Model: `CFG={shape,subOn,entOn,radius,bubble,subOp,entOp}`. Panel built in JS (`buildCfg`) from the
  `GLYPH`/`ICO` sets; `applyCfg` routes bubble→node-rebuild, everything else→cluster-rebuild. URL presets
  + `?drive` updated to the new keys; `dragCfg` binds window listeners once (no leak across rebuilds).
- Verified headless: default/​wrap/​tight/​loose + post-settle `?drive=wrap`, no clip, 0 JS errors.
- NOT covered (spike-only, deferred to the real build): pill/panel styling will be re-skinned to the
  command-center shell when this ports; the nav-bar home is later.

### 9j · encoding research (3 field inventories) + the top-left ENCODE explorer (operator, 2026-08-17)

Operator pivot: "what dimensions can we express on connectors and elements, using ONLY fields already
in archmap.json — no new data?" + "how is colour encoded — kind-fixed, or by value?" Answered with three
parallel read-only inventories against REAL gustify data, then built a navigable explorer.

- **Clip fix (max-radius wrap):** the metaball cube was `S=span/2+nodeR+8`; overlapping balls bulge past
  nodeR and MarchingCubes never triangulates its outer voxel ring → the blob sheared flat at the cube
  face. Now `S=span/2+nodeR*2+14`. Gone.
- **Field inventory (grounded, gustify):** ELEMENT signals real AND populated — `behind.fns` (0–47) /
  `behind.depth` (0–6), entity `counts.lines` (365–25k), `det.flines`/`det.sig.lines`, `det.cols`,
  `usage.fk_in` (User=19), `det.cases` (tested-by; **presence only** — all pass), `god` (38/191 fn).
  CONNECTION signals — L1 `weight` (1–86), edge `kind` (touches/fk/bridge/calls/imports), **kind-as-trust
  proxy** (calls=inferred floor 454/454, imports/fk=proven; no per-edge trust flag), direction
  (asymmetric), `via` (FK col / fetch), `behind` projected to endpoint end. DEAD on gustify (don't
  encode): `usage.api` (always 1), `sig.async` (always true), proof status (0), `gsig` (build disabled),
  `sim` (not in feed), test pass/fail (all pass). **Frontend sub-kinds don't exist** — every FE node is
  one `web` kind + a `sites` count (reshapes the FE side at scale-up).
- **Colour model (the answer):** today colour = IDENTITY for structure (entity on containers, KIND on
  pieces) and VALUE only for endpoints (HTTP method tint). Recommendation kept: colour stays identity
  (kind on icon · entity on boundary — two identities on two surfaces), values ride size/glow/halo/motion.
- **Payload (operator ask, confirmed possible):** a wire carrying a structure (endpoint→schema `resp`,
  endpoint→model `touches`, web→endpoint `bridge`) knows that structure's `det.cols` field-count AND
  types → "which wires move the biggest objects" = particle width. No new data.
- **Atlas artifact:** `Trace Encoding Atlas` (color model · connector table · element table · 3 setups ·
  don't-encode list) — a reusable reference. Source in scratchpad `encoding-atlas.html`.
- **ENCODE explorer (top-left, SEPARATE from CONFIG — operator: config is the consolidated hand-off, all
  custom experiments go top-left):** Setup A·Structure / B·Health&Load / C·Flow&Behind presets; Colour
  identity|heat × heat-by mass|fanin|tests; ELEMENT toggles size·glow·halo·god·pulse·method; EDGE toggles
  width·trust·flow·payload. Billboards re-render WHITE + tint at runtime (identity/heat/method all cheap);
  pulse via a `requestAnimationFrame` loop; synthetic `METRICS`/`LINKMETA` stand in for the real archmap
  fields under the SAME names the encoders will read at scale-up. `?enc=B&cmode=heat&heatBy=fanin` URL
  hooks for shots. Verified headless A/B/C/heat, 0 JS errors.
- OPEN: explorer runs on synthetic recipe+auth data (operator's choice) — port encoders to read real
  c4-graph fields when the grammar settles; FE collapses to `web`+`sites` then.

### 9k · runtime-error fix + node panel → docked right rail (operator, 2026-08-17)

- **BUG ("Uncaught TypeError: Cannot read properties of undefined (reading 'x')", masked in my banner as
  "Script error." because it throws inside the cross-origin file:// bundle):** `linkPositionUpdate` read
  `coords.start.x` with no guard. On a particle/link re-trigger frame (fired by `applyEnc` re-setting the
  particle accessors) `coords.start` is momentarily undefined → throw every frame. Fix: guard
  `if(sprite && coords && coords.start && coords.end)`. Also upgraded the error banner to an
  `addEventListener("error")` capturing message+file+line+stack for future diagnosis.
- **Node panel → a docked RIGHT RAIL (operator: "reserved space on the right, start minimized as one
  column, maximize on element click — not floating over the graph"):** the panel is now `position:fixed`
  full-height at the right edge, width driven by `--rail` (46px collapsed · 340px open, via
  `body.panel-open`). `#g` reserves the column (`right:var(--rail)`) so the graph never sits under the
  panel; on open/close `resizeGraph()` calls `Graph.width()/height()` to re-fit the canvas. Collapsed = a
  thin rail (expand `‹` + vertical last-element name); a click fills phead/pbody and opens; the header `›`
  minimizes back to the rail (never disappears). CONFIG + hint offset by `calc(var(--rail)+12px)` to clear
  it. `.chip` class collision resolved (panel connection chips → `.pchip`; explorer keeps `.chip`).
  `?panel=<id>` URL hook opens a node's card after settle for headless shots.
- Verified headless: rail collapsed (default) + opened on `r_fn`, graph re-fits, 0 JS errors.

### 9l · Playwright click-test + full element-components card in the rail (operator, 2026-08-17)

- **Real root cause of the `reading 'x'` crash (corrected from §9k):** it was **node-drag**, not
  `linkPositionUpdate`. Stack = Three controls `'change'` → force-graph's drag handler (`yG`) → reads an
  undefined drag-subject `.x` on a click that registers as a zero-move drag. Fix: `.enableNodeDrag(false)`
  (we never drag nodes). The §9k `coords` guard + a `raycast`-noop on decorative cluster objects stay in
  as defensive hardening. Playwright confirms 0 page errors after the fix.
- **Rail now renders the FULL element-components card** (was a simplified Usage/Connections/Tests/Identity/
  Note subset): ported the reference renderer (`element-components.html`) into the spike — `usage()` bar
  with in-degree tip · `conns()` chip groups (never tabbed) · `tabbed()` Tests (api/web tabs only when >1
  group is live, else direct) · `colsTable()` Structure/Fields/Shape with FK key glyphs · Keys · Code-behind
  (fn chips + depth + warn tip) · Composition counts (entity) · Identity kv rows + god `flag` · Docstring.
  `KINDCARD[kind](node)` builds the body themed to the spike's recipe/auth nodes, reading `n.m` metrics
  where present. Panel `.chip`→`.pchip` (kept clear of the explorer's `.chip`).
- **Playwright test** (`_build/pw-panel-test.mjs`, drives system Chrome via `playwright-core`, no browser
  download): waits for settle, projects a node to screen px via `Graph.graph2ScreenCoords`, clicks it, and
  asserts — panel starts minimized · opens on click · header name+kind · rail widens to ~340 · Usage /
  Connections / Code-behind / god-flag / Identity present (function) · Structure table + Keys (model) ·
  minimize returns to the rail · **zero page/console errors**. Result: **19/19**.
- OPEN: cards are keyed by KIND (themed to the canonical node); the 2nd instance of a kind (POST /login,
  User) shows kind-canonical body under its own header — resolves when encoders read real per-node
  c4-graph fields at scale-up.
