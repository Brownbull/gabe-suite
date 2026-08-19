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
(the earlier spike — kept external, superseded by `../spike/`; see `../spike/README.md`).
It renders **recipe + auth** (77 nodes) in `3d-force-graph` and puts
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
- **`../spike/index.html`** (the spike/ sibling folder; moved in-repo 2026-08-18 from
  `/home/khujta/gabe-graph-review/spike-kinds/`) — a minimal 3D graph, **one
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
- **Playwright test** (`../spike/_build/pw-panel-test.mjs`, local-only — see the spike README; drives system Chrome via `playwright-core`, no browser
  download): waits for settle, projects a node to screen px via `Graph.graph2ScreenCoords`, clicks it, and
  asserts — panel starts minimized · opens on click · header name+kind · rail widens to ~340 · Usage /
  Connections / Code-behind / god-flag / Identity present (function) · Structure table + Keys (model) ·
  minimize returns to the rail · **zero page/console errors**. Result: **19/19**.
- OPEN: cards are keyed by KIND (themed to the canonical node); the 2nd instance of a kind (POST /login,
  User) shows kind-canonical body under its own header — resolves when encoders read real per-node
  c4-graph fields at scale-up.

### 9m · mass off icon-size → sphere · flow-speed control (operator, 2026-08-17)

- **Icons never resize** (operator ruling). Code-behind mass moved off icon-scale onto the **bubble
  sphere radius** (`massR(n)=BUBR*(0.85+behind/MAX*1.15)`; `bubble(r)` now takes a radius). The icon
  billboard is a flat `×0.86`, always. Glow (behind depth) stays a separate channel — mass rides the
  sphere, depth rides the glow. Halo/satellite/label offsets rebased on the (now variable) sphere radius
  `br`. ENC channel `size`→`mass` (chip relabelled; `heatBy:"mass"` is a distinct key, no clash).
- **Flow speed is a live slider** in the ENCODE panel (Edges group, slow↔fast, 0.1–1.6). Particles read
  too fast at every setup; `linkSpeedFn` now multiplies by `ENC.speed` (default **0.4**, ~2.5× slower).
  `speed` is a GLOBAL viewing-comfort control — NOT in any preset, so switching A/B/C keeps your speed.
  Live: the slider re-sets `Graph.linkDirectionalParticleSpeed(linkSpeedFn)`, no rebuild. `?speed=` URL hook.
- Atlas updated (mass → sphere/glow · icons stay fixed · speed added to setup C). Playwright regression:
  still 19/19.

### 9n · selectable links + link card + a "Selected" value readout (operator, 2026-08-17)

Operator: for every ON encoding channel, show the SELECTED element's value; make LINKS selectable too,
with their own right-panel card.

- **Links are selectable** — `.onLinkClick(...)` + `.linkHoverPrecision(8)` (thin lines were unhittable).
  Node click also now records the selection. Clusters stay non-clickable (decorative).
- **Link card in the rail** — `KINDCARD.__link(l)` (element-components style): Relation (source→target kind
  chips + relation), Weight bar, Payload ("carries N fields — <target>"), Trust (proven/inferred), Direction.
  Header `<src> → <tgt> · CONNECTION · <rel>`.
- **"Selected" readout in the ENCODE panel** (`#encsel`, `refreshEncSel`) — the name of the clicked
  element/link + one row per ACTIVE dimension with THIS target's value: node → mass·behind, glow·depth,
  halo·fan-in + tested, hotspot·god, method, heat·<by>; link → relation, width/flow·weight, payload·fields,
  trust, direction. Only active channels show (toggling a channel updates the readout live via `applyEnc`).
  `SEL={kind,data}` drives it; guarded against the load-order where `buildExpl()` fires before `SEL` inits.
- `?panel=<id>` / `?link=<src>>​<tgt>` URL hooks set the selection for headless shots. Playwright grew to
  **30/30** (node readout: name + mass·behind + numeric value; link: card sections + readout src→tgt + weight).

### 9o · the ENCODE panel becomes a per-element value PLAYGROUND (operator, 2026-08-17)

Operator: put each dimension's value NEXT TO its toggle (not a separate readout); gray a dimension whose
value has no effect on the selected element; and — bold — show EVERY dimension for the selection (default
0 if absent) with ± steppers to FAKE the value and watch the encoding react. Ephemeral; erased on reload.

- **Dimension rows** replace the chip-wrap + the `#encsel` readout. `DIMR` maps each channel to a backing
  field (mass→behind, glow→depth, halo→fanin, god/pulse→god, method→method enum; width/flow→w, payload→
  payload, trust→proven). Each `.drow` = the toggle chip (global on/off) · the SELECTED target's value ·
  `−`/`+`. A `#selhdr` names the selection.
- **Gray-out by effect** (`dimEff`): a row is `.noeffect` (dimmed label + value) when its value can't show —
  int ≤ 0, bool false, method `—` or on a non-endpoint, or the dimension's scope ≠ the selection's kind
  (node dims gray while a link is selected, and vice-versa). Toggling still works when grayed.
- **Steppers fake the value** (`dimSet`): ± mutates `SEL.data.m[field]` (node) or `SEL.data[field]` (link)
  then `applyEnc()` rebuilds the graph + refreshes the rows — so cranking `list_recipes()` mass 8→20 grows
  its sphere immediately. Values are throwaway (live on the in-memory node; gone on reload). Visual growth
  capped at 3× (`cap3`) so a huge fake value can't fill the screen.
- Load-order: `buildExpl()` now runs at the BOTTOM (after `DIMR`/`drow` exist) — the premature call crashed
  reading `DIMR.node`. Playwright **33/33** (rows show values, mass ungrayed / method grayed for a fn,
  stepper increments the value AND mutates `n.m.behind`, link width row shows weight).
- **Restore-defaults button** (`↺` in the panel header): the steppers mutate the live metrics, so at load
  `ORIG_M` (per-node `m` copy) + `ORIG_L` (per-link w/payload/proven) snapshot the pristine values; `n.m` is
  now a COPY of `METRICS` (decoupled from the shared source). `resetValues()` writes the snapshots back and
  `applyEnc()` rebuilds — every faked value returns to default in one click. Playwright **35/35** (crank
  mass 8→10, reset → metric and row both back to 8).

### 9p · effect → variable MAPPING, editable per setup (operator, 2026-08-17)

Operator: show which VARIABLE each effect reads, let me change it, and make A/B/C independent maps I can
retune — so I can play with which field drives which effect for a given selection.

- **Encoders read a MAPPED field, not a hardcoded one.** `MAP={A,B,C}` (each `{effect→field}`, seeded from
  `DEFMAP`; **B's halo defaults to `tests`** to show maps can differ). `fieldOf(key)=MAP[ENC.setup][key]`.
  `buildNode` (mass/glow/halo/god/pulse) and the link accessors (width/flow/payload/trust/speed) now read
  `fieldOf(key)` via `nodeVal`/`linkVal`, normalized by a per-field `MAXES` (behind/depth/fanin/tests/cols/
  w/payload; bool→1). `truthy()` gates the flag effects. Halo colours green only when its field is `tests`.
- **Each row carries a variable dropdown** — `NODE_VARS`=behind·depth·fanin·tests·cols·god, `LINK_VARS`=
  w·payload·proven; `method` stays fixed (the tint is method-specific). Changing it writes
  `MAP[ENC.setup][key]` and re-renders. The stepper edits whatever field is mapped; the value shown is the
  mapped field's. `FIELDT` types each field (int/bool/enum) so steppers + gray-out behave.
- **Per setup:** switching A/B/C rebuilds the rows against that setup's map, so the dropdowns (and the graph)
  change. Maps start mostly identical (except B·halo) and are independently editable — the operator diverges
  them to taste. Panel widened 236→256 for the extra control.
- Playwright **40/40** (mass dropdown = behind; remap mass→depth → value 8→2 + `MAP.A.mass` updated; setup B
  halo → tests vs setup A halo → fanin).

### 9q · global icon-size control (operator, 2026-08-17)

Operator: icons are too big vs the label font; make them ~font-size and add a control — a CONSTANT size I
pick, applied to every element's icon.

- **Icons default smaller + operator-set.** `ENC.iconSize` (default 10, was the baked ~13). `buildNode`
  scales the billboard sprite to `ENC.iconSize` (primitive fallback `×iconSize/13`) — a flat constant, NOT
  data-driven, same for every element. The neutral sphere's base now tracks it (`bubR()=iconSize·0.62`) so
  mass-sphere / halo / satellite / label offsets stay proportional as the icon resizes.
- **Icon-size slider** in the ENCODE panel (under Colour, 6–20), live via `rebuildNodes()`. A GLOBAL display
  control like `speed` — not per-setup, not per-element, not in any preset.
- Playwright **42/42** (slider sets `ENC.iconSize` 10→16 and the node's icon sprite scale follows).

### 9r · one distinct colour per kind + per method, no overlap (operator, 2026-08-17)

Operator: every element kind a unique colour, every HTTP method a unique colour, and **no method colour
reused by any element kind**. The old palette had exact collisions (component == screen == `#e8590c`),
near-identical purples (function ≈ endpoint), and method↔kind clashes (GET green ≈ model green, PUT orange ≈
component orange).

- **METHODS (reserved verb family, no kind may use these):** GET `#22c55e` · POST `#3b82f6` · PUT `#f97316`
  · PATCH `#eab308` · DELETE `#ef4444`.
- **KINDS (12, all distinct, none on a method hue):** endpoint `#8b5cf6` · function `#6366f1` · model
  `#14b8a6` · schema `#06b6d4` · entity `#84cc16` · external `#94a3b8` · route `#38bdf8` · component `#d946ef`
  · hook `#10b981` · store `#ec4899` · type `#64748b` · screen `#a855f7`. Applied via a `KINDCOL` override on
  `KINDS[k].col` (before the `nodes` map) so icons/legend/panel-type all pick it up; panel `.pchip` classes
  updated through the `:root` `--c-*`/`--fk-*` vars (+ new `--c-web`/`--c-external`).
- **Propagated to the reference** `docs/design/codebase-graph-consolidation/element-components.html` (operator
  mid-turn) — its `--c-*`/`--fk-*` vars now carry the same palette; the stale dark `--c-model` override dropped.
- Playwright **45/45** (`window.KINDCOL` all-unique · `window.METHOD` all-unique · no method colour in the
  kind set). Verified headless: identity mode (distinct kind icons) + method mode (GET green / POST blue).
- OPEN: edge `RELCOL` still uses some old hexes (edges are a separate encoding the operator didn't raise);
  tightest kind adjacency is hook-emerald vs model-teal (Δ~14° hue) — legible, tweak a hex if it reads close.

### 9s · icon-size positions · twin-calibrated behind/depth scale · tested-by orbit rings (operator, 2026-08-18)

- **Icon size = 3 positions** (operator: keep 3/4/5, load on 4). Slider now `8·10·12`, step 2, default **10**
  (the middle = position 4). "Carry into the config later."
- **behind/depth scale FIXED from real twins, not the per-graph max** (operator). Measured gastify+gustify
  (n=346): `behind.fns` min 0 · max 110 · avg 7 · median 3 · **p95 29** · p99 47; `behind.depth` max 7 ·
  **p95 5**. Set `MAXES.behind=30`, `MAXES.depth=5` (p95) so the typical range fills the band and the rare
  outliers (110!) saturate via `cap3`. mass→behind, glow→depth stays established; same fixed scale for every
  graph. (fanin/tests/cols/w/payload still per-graph.)
- **Tested-by = ORBITING RINGS** (operator's new halo). Halo default remapped to **tests**; `orbitRings()`
  adds one thin green torus per test (capped 6), each tilted + spun continuously around the sphere via a new
  `ORBIT` list in the rAF loop (`rotateOnAxis`). Untested → no rings; more tests → more spinning rings. The
  halo channel stays generic (N rings = the mapped count; green only when the field is `tests`, else icon
  colour). `ORBIT` cleared in `rebuildNodes` like `PULSE`.
- Per-setup maps simplified to three independent `DEFMAP` copies (halo=tests everywhere now). Playwright
  **49/49** (icon slider 8/10/12 + sprite follows; halo defaults to tests; per-setup independence — A.mass
  remap doesn't leak to B; ORBIT populated when halo on over tested nodes).

### 9t · speed positions · solid rings → SATELLITE BELTS (tests · flags · used-by) (operator, 2026-08-18)

- **Speed = 5 slow positions** (operator: keep the first five incl. the first). Slider `0.1–0.3` step 0.05,
  default **0.1** (the slowest/first). Particles now crawl by default.
- **The solid test-ring is retired; the ring becomes an AXIS carrying SATELLITE dots** (operator's "Starlink
  chain / planets with moons"). `satelliteRing()` places N small spheres evenly on a tilted orbit + a faint
  guide torus, and spins the whole belt (the dots travel). One belt per dimension via a tilt index (3 planes).
- **Three belts replace the single `halo`:** `ring1` tests (green `#22c55e`) · `ring2` flags (red `#ef4444`)
  · `ring3` used-by (amber `#fbbf24`). N dots = the mapped count (cap 8). Each is a mappable effect row
  (tests/flags/fanin defaults). Untested/flag-free/unused → no dots. **Code-behind stays on mass/glow** (both
  used), so it gets no belt — the three former badges (tests · used-by · code-behind) are all covered.
- **`flags` is a new synthetic field** = count of active issues (`god` + `large` [behind≥15 or fanin≥15 as a
  LOC proxy] + `hot` [churn]); added to `NODE_VARS`/`FIELDT`/`MAXES` (max 3). At scale-up it reads real flags.
- Playwright **53/53** (ring1/2/3 default to tests/flags/fanin; setup B spawns belts → ORBIT populated;
  speed slider is the 5 slow positions at default 0.1).
- OPEN: dots are small at graph-zoom (readable on a node, faint from afar); real flag set to wire at
  scale-up = god · hot · large-LOC · unguarded (see the handoff answer). Rotation is continuous, not pendulum.

### 9u · belts tied to flow speed · used-by lights the sphere lattice (operator, 2026-08-18)

- **Belt spin ∝ the connection speed** (operator: much slower, aligned with the wires). ORBIT entries now
  carry a `base` (per-ring, outer slower); the rAF loop rotates by `base × ENC.speed` LIVE — so the same
  slider drives particle flow AND belt orbit, and both crawl at the slow default. No rebuild on speed change.
- **used-by can LIGHT THE SPHERE'S LATTICE** (operator's alt to the belt / a "gravity" proxy). New `verts`
  effect: `bubble(r, glow)` lerps the wireframe grey→bright and raises its opacity by `glow` (= the mapped
  field normalized, default fanin), plus a soft additive field-glow — a heavily-used element reads as a
  dense, energized star. Mappable row like the rest; setup B swaps ring3(belt)→verts(glow) for used-by so
  the two used-by encodings can be compared.
- On "gravity": no literal gravity animation added — it's abstract to render honestly; the lattice-lighting
  (density/brightness = importance) is the chosen proxy. An inward particle-pull is possible but heavier;
  deferred unless asked.
- Playwright **56/56** (verts defaults to fanin + ENC.verts on in B; ORBIT uses `base` not a fixed `spd`).

### 9v · verts, refined: a LATTICE WAVE of lit vertices (operator, 2026-08-18)

Operator corrected the verts idea: not "brighten the whole lattice" — light **N of the sphere's own
vertices** (N = used-by, cap 8) with glowing dots that pulse in a **travelling wave**, the glow bleeding a
little onto the edges between vertices. recipeStore (used-by 9) → 8 lit vertices.

- `bubble()` reverted to its plain grey lattice (segments now the shared `BUBSEG=[18,12]`). `latticeWave()`
  reads that same sphere's vertices, dedups, picks N by even stride, and drops a soft additive glow sprite +
  a tiny bright core on each — the additive falloff is the "bleeds onto the connectors" effect.
- New `WAVE` animation list (cleared in `rebuildNodes` like `PULSE`/`ORBIT`): each dot's opacity + scale
  oscillate by `sin(g + phase)`, phase from the vertex's own position → a wave sweeps across the sphere.
  Wave rate rides `ENC.speed` (crawls at the slow default), consistent with the belts/flow.
- Playwright **57/57** (used-by on tested nodes populates `WAVE`).
- OPEN: dots are subtle at graph-zoom (clear on a selected/zoomed node); brightness/size are one-line tweaks
  if you want them punchier. Wave is a smooth phase-sweep, not literal edge-to-edge propagation.

### 9w · verts = a RADAR sweep that ignites vertices into little X's (operator, 2026-08-18)

Operator refined again: not a soft glow pulse — a **radar** sweeping the sphere. As the sweep passes a
vertex it fires: the **dot snaps on** (crisp, no glow), then short **stubs grow along its 4 lattice edges
into an X** (ink creeping a short way down the carved canals, never reaching the neighbour vertex).

- `radarVerts()` replaces `latticeWave()`. It rebuilds the lat/lon grid parametrically (so each vertex knows
  its 4 neighbours), picks N interior vertices by stride, and per vertex builds a `sub` group = a crisp dot
  (opacity 0) + a `lineGroup` of `LineSegments` stubs reaching **40%** toward each neighbour.
- Loop: a `rad` angle sweeps `[0,2π)` (rate ∝ `ENC.speed`); each vertex fires on a narrow window
  `act = 1-|az-rad|/0.7`. `dot.opacity = min(1, act·2.2)` (appears first) → `lineGroup.scale/opacity` lag on
  `(act-0.22)/0.78` (the X grows after the dot). ~1 vertex lit at a time → a radar "reveal" cadence.
- Playwright **57/57** (unchanged asserts; `WAVE` still populates under verts). Still frames can't show it —
  the sweep means most vertices are dark at any instant.
- OPEN: sweep is AZIMUTHAL (a rotating radar around the vertical axis); a translating-plane "through" the
  sphere is a coordinate swap if that reads better. Lines are 1px (WebGL linewidth cap).

### 9x · radar verts, on-lattice + visible stubs + grow/contract (operator notebook, 2026-08-18)

Operator's notebook fixed three things: the dots were floating moons (stubs invisible), and the lifecycle
should GROW then CONTRACT (dot → lines out → lines back → dot → gone), stubs reaching no more than half-way.

- **Stubs are now thin cylinders**, not 1px `LineSegments` (WebGL can't thicken lines) — so the little `+`
  that highlights the lattice edges is actually visible. Shared material per vertex, radius 0.11, reach
  **45%** toward each neighbour (≤ half). Dots shrunk to 0.4.
- **Dots land ON the wireframe crossings:** `P(i,j)` now matches `THREE.SphereGeometry`'s formula (the `-x`
  sign), so a lit vertex coincides with a real lattice intersection and its 4 stubs lie along the drawn
  edges.
- **Grow→contract lifecycle:** `lineGroup.scale = 0.001 + ls` where `ls=(act-0.24)/0.76` — so as the sweep's
  `act` rises then falls, the stubs grow out and pull back; the dot (`min(1, act·2.4)`) leads in and lingers
  a touch past them, then fades. Matches the 6-step chain (dot · +line · ++line · contract · dot · gone).
- Playwright **57/57**. Still frames can't show it (per-node detail + sweep); judge live/zoomed. Sizes +
  cylinder radius are one-line tweaks.
- **Thinned (operator: still felt like moons on the shell):** dot 0.4→**0.17**, stub cylinder radius
  0.11→**0.045** — now flush with the wireframe so a firing vertex reads as the lattice line lighting up, not
  a tube/ball on top. Playwright still **57/57**.
- **Vertex-dot: tuned to 0.05, LOCKED.** Explored via a temporary slider (0.05–0.30 + datalist ticks + live
  value); operator chose **0.05**, so `ENC.dotR=0.05` is baked and the tuning slider + its handler/CSS were
  removed. The dot is a unit sphere scaled to `ENC.dotR` in the loop (constant now).

### 9y · SPACE WAR positions — three war zones around each planet (operator notebook, 2026-08-18)

Operator's notebook (the sketch): each entity component's **sphere = a "planet"**; around it, three
**zones** placed like a battle map — **ATTACK** left · **CONFLICT** top (the "arctic") · **DEFENSE** right,
all **outside** the sphere. The squares in the sketch are just *placement* — the zones are transparent
AREAS (spheres/squares/radial cylinders, interchangeable); the DATA rides inside them.

- **First pass = discrete boxes (attack-L box · conflict-T cylinder · defense-R box) with data dots →
  REDIRECTED in-session.** Operator's second notebook: the zones should HUG the globe, spaceship-war style,
  not float as boxes. v2 below is the shipped shape; the box pass never left this session.
- **v2 geometry (`warZones(grp, br, n)`):**
  - **ATTACK + DEFENSE = curved half-shell wedges** wrapping opposite hemispheres, **separated** by front/
    back gaps ("radius areas around the two halves"). Each is a `SphereGeometry(Rd,…, phiStart, ~150°,
    thetaStart 0.16π, 0.66π)` at `Rd = br + CFG.warDist`, opacity 0.11 + a **low-segment wireframe** (7×5 →
    a few longitude lines = the "petal/rib" look the sketch shows, NOT the v1 barcode). Centre azimuth =
    the angle slider (attack default 180° · defense 0°). Colours attack red · defense green.
  - **CONFLICT = a smooth flattened CLOUD dome** over the top (arctic): a top-cap `SphereGeometry(…,0,2π,0,
    0.42π)` scaled `y=0.5` + lifted `y=br*0.35` → an expanded disc with a little volume (mushroom / volcano
    cloud). Soft grey-blue `#cdd8ea`, smooth (no wireframe). Symmetric, so its angle slider is a no-op for now.
- **Star chips = DEFERRED (operator).** The zones are the AREAS; "star chips" get placed inside each later —
  attack chips one half · defense chips the other · they meet and fight at the top. v2 removed the v1 data
  dots (chips supersede them).
- **Controls (CONFIG `War zones` group, persistent):** master `warOn` toggle · one **distance** slider
  (hug↔far, default 6) · three **angle** sliders (attack/conflict/defense, colour-coded). Changes
  `rebuildNodes()` when shown.
- **URL hooks:** `?war=1` · `?warDist=N` · `?angAttack|angDefense=deg` · **`?cam=top`** (the overhead
  view the operator drew — proves the two separated C-shells + the conflict ring).
- **Verified headless:** front (`?war=1`, `?panel=r_model`) + **top-down (`?cam=top`)** render the hugging
  red/green half-shells + cloud cap; separation + halves read from above. Zones off by default → **57/57**.
- **BATTERY BUG fixed (shipped in `cbb284d`):** the earlier portability edit named the resolved URL
  `const URL`, shadowing the global `URL` ctor → TDZ `ReferenceError` killed the battery. Renamed
  `SPIKE_URL`. Caught only by actually running `npm ci && node pw-panel-test.mjs` from the committed recipe
  (which also proved the recipe restores cleanly).
- **Open (operator to steer):** shell span/latitude band + cloud height/spread · rib density · whether the
  shells REPLACE the tests/flags belts or stay parallel · then the STAR CHIPS pass (attack vs defense units
  fighting at the top).

**v3 (operator, same day — controls repurposed + dots moved in):**
- **Colours inverted:** RED on the LEFT (az 0) · GREEN on the RIGHT (az 180). Angles are now FIXED
  constants (operator: don't change the defaults) — the angle sliders were freed for shape controls.
- **Distance extended LEFT:** `warDist` range now **−24 → 30** (was 2→30). Negative = the shell moves
  INSIDE the globe (`Rd=max(1, br+warDist)` clamps the radius). Label `in ↔ far`.
- **Three repurposed sliders:** `shell ht` (`shellH`, band height — equator-centred `thetaLength=π·shellH`,
  shrink → a narrow ring) · `concave` (cloud openness — `capTheta=π·(0.12+0.42·concave)`, flat plane ↔
  rounder cup) · `lift` (cloud vertical position along Y, `dome.y=br·lift`, closer ↔ farther).
- **Dots moved from the belts INTO the zones** (operator: "transport the ring dots to the areas"): red
  shell ← `flags` · green shell ← `tests` (both scattered on the shell surface via `shellPt()`, cap 8) ·
  the top cloud ← `fanin`/used-by (amber dots under the dome). The god/pulse dot was NOT folded in.
- **URL:** `?war=1&warDist=N&shellH=F&concave=F&lift=F&cam=top`. Verified headless: colour-invert · narrow
  band · flat+lifted cloud · inside-sphere all render; battery **57/57** (zones off by default).
- **Consolidation DONE (operator: toggles-only, remove from ENCODE · used-by = the VERTS effect):** a new
  CONFIG **NODE** group (`mass`·`glow`·`used-by`) of ENC-backed toggles (`pillTogEnc` + a `data-enc` branch
  in the cfg click-handler → `ENC[field]`+`applyEnc`). **used-by drives `ENC.verts`** — the radar-lattice
  sweep tuned in §9v–§9x, NOT amber dots (a first mis-take put amber `fanin` dots under the cloud; the
  operator corrected it to verts, the dots + `ENC.usedby` were removed). `mass`/`glow`/`ring3`/`verts` rows
  removed from `DIMR.node` (all four now live in CONFIG or are retired). `buildCfg()` re-runs on a preset
  switch so the toggles reflect A/B/C. **Battery retargeted** (mass rows/steppers/mapping were mass-specific):
  the ENCODE stepper + mapping proofs now run on `flags`/`ring1`, + 3 consolidation checks (mass row gone
  from ENCODE · CONFIG has the `mass`/`glow`/`verts` toggles · a CONFIG toggle flips `ENC.mass`). **56/56.**
- **STILL OPEN / next:** the STAR-CHIPS pass — replace the flat dots with star-shaped chips (attack units
  one half · defense the other · fighting at the top); shell span/band + cloud shape fine-tuning.
- **Defaults captured (operator config, 2026-08-18):** `warDist 7 · shellH 0.6 · concave 0.72 · lift 0.65`
  (read off the operator's slider screenshot; `warOn` still false — zones toggle on).

### 9z · Battle-Space Chip Lab — variables · tiers · 3D chips per zone (operator, 2026-08-18)

Operator asked for an exploration artifact to decide WHAT goes in each war zone + WHICH 3D chip renders it +
whether the CURRENT code map already carries the data (constraint: don't touch map generation; small gaps OK).

- **Built `spike/chip-lab.html`** (local, reuses `./3d-bundle.js`; NOT a published artifact — operator chose
  local). Self-contained THREE viewer (`Viewer()` — auto-spin + drag, no OrbitControls dep; per-chip
  `userData.tick` for animation). Three zone cards, each: a **feasibility table** (variable → map source →
  per-element? → status ●in-map / ◐derivable / ○gap), a **tier ladder**, and an **orbitable 3D candidate
  gallery** with morph sliders.
- **Feasibility (grounded in the real generators, not the synthetic spike):** DEFENSE/tests fully sourceable
  — `test_insight.by_function` (C-ids) · junit **corpus = KIND** (api/web/e2e) · `case.state` pass/fail ·
  `load_coverage()` (◐ needs reporters wired) · `proof_type` (◐ plan-level, small fold-in). ATTACK: `god` ●,
  `unguarded` ● (guard floor), `large`/`hot` ◐ (health-lens per-file), `complexity`/`bug-density` ○ gaps.
  CONFLICT: `inflight.json` + `_a3_sim` (blast/PENDING/stages) + junit `failed` + drift — all ●, active-only.
- **Tier system = BOTH axes contrasted** (operator wanted the contrast): KIND (smoke→unit→integration→e2e,
  depth) × COVERAGE (none→partial→covered→proven, strength) — independent; the chip carries kind→structure,
  coverage→brightness+fill.
- **Candidate chips:** defense = Screen-stack / Shield-hex (green) · attack = Caltrop / Mine (red) · conflict
  = Burst / Shockwave (amber, animated). All render headless (verified).
- **element-components.html impact = DEFERRED** until the operator picks one chip per zone (the lab's "decision
  owed"). Then the chosen draw fns get authored once in element-components.html + reused by the spike's
  `warZones()` (same single-source move the per-kind colours took). NOT edited yet.
- **REAL ASSETS (operator: hand-built primitives rejected — wanted actual spaceships + explosions; find a
  library, don't build from scratch).** Researched CC0 libs; operator picked **Quaternius ships (red/green
  variants)** + **broader battle FX** for conflict.
  - **Ships DONE:** downloaded a Quaternius spaceship GLB (CC0, Poly Pizza · `static.poly.pizza/…glb`, 158KB)
    → `assets/ship.glb` + base64 data-URL in `chip-assets.js` (so the lab loads it over `file://`, no server).
    **Bundle rebuilt additively** — `_build/entry.js` now imports `GLTFLoader` (`window.GLTFLoader`), re-esbuilt
    to `spike/3d-bundle.js` (1.59→1.64MB); **spike battery still 56/56** (rebuild safe, three@0.185.1). Lab's
    defense/attack now render the REAL ship tinted green/red, fleet size = tier (`shipFleet`/`shipOne`/`tintClone`).
    BUG fixed: `new T.GLTFLoader()` → `new window.GLTFLoader()` (it's a window global, not on THREE). Verified via
    Playwright (`__shipReady`, 1 mesh, no errors) — note a plain `--virtual-time` headless screenshot shows the
    fallback box because it can't finish an async data-URL load; a real browser / Playwright loads it fine.
  - **Lab REDESIGN (operator refinements):** 3 distinct CC0 ships now (`SHIP_GLBS`={quaternius, speeder(Kenney),
    mining(Kenney)}, 286KB base64). `teamShip()` KEEPS the ship's ORIGINAL colours + adds a team theme (emissive)
    + a dedicated team accent (underglow disc + halo sprite) — NOT a full tint (operator: "original colours +
    green/red areas + theme"). **A distinct hull per kind/dimension** (operator: different chips, not clones):
    defense unit=speeder · integ=mining · e2e=quaternius; attack god=quaternius raider · unguarded=speeder swarm.
    **Controls mapped to variables:** defense kind-toggles + count + pass/fail(health); attack god-toggle +
    unguarded-count; conflict radius←blast · waves←failing · velocity←in-flight. **Conflict:** Burst DROPPED;
    Shockwave + **Flak** (2nd effect, debris sprites), both procedural with the 3 mapped sliders. **Var trims:**
    attack = god + unguarded ONLY (large-LOC/hot-churn/complexity/bug-density all discarded — operator); defense
    C-ids → INFO PANEL only (not a chip dim), coverage → optional/dropped. Verified via Playwright (3 ships
    loaded, no errors). DECISION OWED: confirm ship→kind assignments + conflict effect (Shockwave vs Flak).
  - **Iteration 3 (more models · layout · deployment):** **5 CC0 ships** now (added `cruiser`+`scout` from Poly
    Pizza; all CC0 — CC-BY candidates skipped to keep the suite attribution-free). **Layout reworked:** LEFT =
    variable feasibility + an **ASSIGNMENT panel** (a `<select>` ship picker per kind/dimension + effect picker +
    sliders, each tagged `←mapVar`); RIGHT = the resulting 3D only. **New DEPLOYMENT view** (`depBuild`): the
    entity **sphere** with the SAME configured fleets placed in their zones — defence right (+X) · attack left
    (−X) · conflict top (+Y) — via `placeFleet()`; controls **distance** (off-surface) · **distribution** (spread)
    · **movement** (patrol drift, animated in the tick). `Viewer(id,camZ,tilt0)` gained a per-view camera so the
    wide deployment fits (camZ 66, tilt 0.42). Playwright-verified (5 ships, no errors). This deployment law
    becomes the spike `warZones()` placement once locked.
  - **Iteration 4 (satellites · trade routes · cross-entity tests):** THREE new component families, all
    map-sourceable. **SATELLITES** = the functions that USE the element (`hub.usage`/graft callers, used-by),
    orbiting the **SOUTH pole** (inverted from the conflict cap on top) — **replaces the verts glow**; model
    picker (probe/station) + count(=used-by)/orbit-r/speed. **INTER-ENTITY** view = a 3-entity constellation
    with route lines: **shuttles** ferry **data between entities** (cross-entity edges — `cross_edges`/FK/bridge)
    and a **test ship** runs a **cross-entity journey** (integration/e2e = `test_insight` reach across elements);
    shuttle + test-ship pickers + count/speed. Satellites also added to the DEPLOYMENT view (south-pole orbit),
    so the full system reads: defence right · attack left · conflict top · satellites bottom. **Assets:** 5 ships
    + 2 satellites (probe CC-BY Liz Reddington, station CC0) + 3 shuttles (CC0), all Poly Pizza, base64 in
    `chip-assets.js` (now ~1.1MB); a CC-BY credit line in the footer (`sat-b` dropped — 1.4MB too heavy). Loader
    generalized to SHIP/SAT/SHUTTLE categories. Playwright-verified (10 assets, no errors). BUG fixed: the
    generated `ASSET_CREDITS` string had unescaped inner quotes → regenerated with single quotes.
  - **Iteration 5 (telecom sats · battle orientation · more controls):** satellites reworked to **small TELECOM
    sats transmitting WAVES** (operator: Starlink-style, small vs ships) — swapped station/probe for `comsat`+`mini`
    (Poly-by-Google CC-BY) + kept `probe` (Liz Reddington CC-BY); `makeSat()` = model·`SATC.size` + 2 light-blue
    expanding wave rings; `satPose()` orbits the south pole on a **tilt-controllable** plane. New sat controls:
    size · tilt(orient) (+ count·radius·speed). **Ships now FACE each other** (battle stance): `placeFleet` gained
    a `faceY`; defence `+π/2`, attack `−π/2` (deployment + zone views) — sign unverified, may need a flip. **Transport**
    enlarged (`INTC.size`) + brighter routes + a size control. chip-assets.js 1.1MB→806KB (telecom sats tiny; dropped
    station + a 1.35MB candidate). Playwright-verified (11 assets, no errors).
  - **Iteration 6 (no handmade planetary models — operator directive):** the last procedural MODEL, the entity
    `entitySphere()` teal sphere, replaced with a **real planet GLB** (3 CC0 Quaternius planets A/B/C, Poly Pizza)
    + a planet picker in the deployment controls; `entitySphere(R)` clones `PLANETS[PLANC.model]` scaled to R (a
    wireframe fallback ONLY while loading). Used in sat/inter/deployment views (deployment's inline sphere also
    swapped). 14 assets total, chip-assets.js ~1.08MB. Playwright-verified (no errors). **Then (operator): kept the
    procedural sphere as a first-class picker OPTION** — `PLANC.model==='sphere'` renders the original teal sphere;
    picker = `sphere · A · B · C`, default `sphere` (cleanest read; real planets are the fancy options).
  - **Iteration 7 — FIELD REVIEW (5-agent workflow `wf_e8d2b80a`, ran ~8 min, inventoried the real generators):**
    grounded every allocation against what the map ACTUALLY emits. **Honest (kept):** satellites = `det.usage`
    fan-in COUNT (present per-element; fk_in for models) · attack = `god` (size: fn≥50/cls≥15, standing) +
    `unguarded` (`guard_insight`, the standing per-element problem index) · conflict radius←`sim.blast` ·
    velocity←`inflight.touched` · FK/`cross_edges` + web→API `bridge` routes (present). **Corrected in the lab
    (dishonest before):** (1) defence HEALTH pass/fail is PYTHON-ONLY (web/e2e frefs hard-set `state='file'`, no
    per-element red/green rollup) → reframed HEALTH = `guard_insight` unguarded/named/**proven** (the standing
    per-element defence index). (2) conflict "failing→waves": per-element failing has NO rollup (junit `failed` is
    corpus-total) → waves now ← **blast size**. (3) inter-entity "e2e journey path": the ORDERED cross-entity
    journey is a GAP — refs carry no sibling linkage; only `exercises[tfile]` (per-FILE unordered bag) + `via_route`
    T2 (one hop) exist → journey ship = the exercises bag (file-floor), ordered path flagged gap. **The oft-run
    graft script = `_a3_graft.py`** (`graft_arm()` at build_center_a3.py:1986). Named tweaks (proposed, NOT
    implemented — suite change needs dry-run + arch-graph battery): 1-line `res["direct"]=len(adj.get(start))` in
    `_behind_of` (per-endpoint/fn direct-callee fan-out, lands in c4-graph.json) + a `callers` in-degree pass in
    `derive_node_facts` (the honest per-node **used-by** count the satellites should ride — `function_insight.usage`
    undercounts). Also noted: `fn_behind` is already computed by graft but never consumed by `_a3_graph`. Lab
    footer carries the verdict + tweak. Playwright-verified, no errors.
  - **Iteration 8 (operator batch + a mid-turn note):** (1) planet **spin default-OFF** on the planet views
    (`Viewer(...,noSpin)`; operator found the auto-spin, stopping it made the layout read) — the current chip
    movement is KEPT (operator: "perfect"). (2) **Satellites = lucide dish/satellite BILLBOARDS** — an asset hunt
    (rendered a 13-candidate inspector grid) confirmed NO proper 3D solar-panel satellite exists on the free
    packages (the "satellite" tag returns planets/rockets/moons/ships); flagged as a DECISION, billboard chosen
    (matches the operator's own reference icons, tiny-friendly). (3) Satellites now transit **3 invisible rings**
    (120° apart, `SAT_RINGS`, faint guides). (4) **Shuttles = sleek craft** (clipper/runner/hauler, replacing the
    cargo-crate "squares"). (5) **Model palette** — a new TOP section rendering every asset as a small orbiting
    3D preview (ships as a T1→T5 tier row · shuttles · satellite billboards · planets), the operator's "see all
    assets in one place" (`palCell`/`populatePalette`). chip-assets.js → 774KB (dropped the junk sat GLBs).
    Playwright-verified (13 palette cells, no errors). OPEN: the full kind×tier ASSIGNMENT grid + whether to
    insist on a 3D satellite (Kenney kit / Sketchfab).
  - **Iteration 9 (palette spin fix + planets + a sourcing wall):** FIXED the palette preview spin — `palCell`
    now recentres each model in a pivot (bbox-centre) so it spins IN PLACE (T2/T3 were orbiting an off-centre
    pivot and drifting off-screen). Added 2 planets (ringed "saturn" + moon → 5 total: A/B/C/ringed/moon).
    **Sourcing wall on the operator's two biggest asks:** rendered inspector grids proved Poly Pizza's individual
    search can't supply (a) a coherent EVOLVING ship line — generic "spaceship" returns boats/daggers/tanks, and
    the "Ultimate Space Kit" BUNDLE is planets/rocks, not the "Ultimate Spaceships" pack — or (b) any 3D
    solar-panel satellite (the tag is all planets/rockets/moons). PLAN flagged to operator: go to the DEDICATED
    ZIP packs — Quaternius Ultimate SPACESHIPS (10 CC0 ships → 3×3 tiers) + Kenney Space Station Kit (CC0
    solar-panel/dish) — not individual Poly Pizza search. **Still OPEN:** 9 evolving ship chips · a real 3D
    satellite · per-element-kind planet map + method-tinted endpoint planet (wiring, planets now in hand).
    chip-assets.js ~934KB. Playwright-verified (15 palette cells, no errors).
  - **Iteration 10 (GOT THE PACKS):** the dedicated-pack path worked. Kenney Space Kit ZIP (direct URL found in the
    page: `kenney.nl/media/pages/assets/space-kit/…/kenney_space-kit.zip`, CC0, 153 GLBs) → extracted a **coherent
    8-craft ship fleet** (`craft_speederA–D`, `cargoA/B`, `miner`, `racer`) + **3 real satellite DISHES**
    (`satelliteDish`/`_detailed`/`_large`). Ships now = **3 evolving lines × 3 tiers** (`SHIP_LINES`: interceptor
    speederA→B→C · hauler cargoA→B→miner · assault racer→speederD→quaternius); **satellites = the real 3D dish**
    (`makeSat` uses `asset(SATS,…)`, billboard retired to fallback). Palette restructured to the 3 line-rows.
    **Fixed a WebGL context blow-out** — 20 palette canvases + 6 viewers > the ~16-context cap blanked cells + the
    sat view; palette now uses ONE shared renderer drawing STATIC snapshots (`palR`, preserveDrawingBuffer +
    drawImage), which also kills the preview spin cleanly. Note the Kenney satellite is the ground-dish-on-a-stand
    (best free 3D satellite available). chip-assets.js ~1.05MB (9 ships + 3 dishes + 3 shuttles + 5 planets).
    Playwright-verified (20 palette cells, no errors). STILL OPEN: per-element-kind planet map + method-tinted
    endpoint planet (wiring, planets in hand). **Still procedural (EFFECTS,
    not models — flagged to operator):** conflict shockwave/flak, satellite wave rings, team-accent glow/disc,
    route lines — these are animations/decorations; the real-asset path for them is sprite-sheets, a separate hunt.
  - **Iteration 11 (operator-curated roster · flat palette · tier system · Starlink · bubble):** the operator
    handed a curated `assets/links.txt` (15 Poly Pizza models + Quaternius pack) — that replaced the blind hunt.
    Downloaded + render-triaged all 15: **10 clean** (9 ships + the win), **5 troubled** (2 tiny/off-origin, 2
    blank-material, 1 corrupt-then-3.2MB). The WIN: **`K7kE2DCBY8` = the Starlink flying satellite** (grey body ·
    gold dish · **blue solar-panel reflectors**) — wired as `SATC.model='starlink'`, orbits the south pole.
    Shipped the **9 clean curated ships** into `chip-assets.js` (`fighter/cruiser/tie/dart/sub/cat/pod/jet/bomber`
    — SHIP_NAMES now **18**, all selectable everywhere; file 1.05MB→3.2MB). **Palette flattened** — the 3 tier-line
    rows (`SHIP_LINES` deleted) collapse to ONE flat `CHIPS` group; **now animated** (the static snapshot was read
    as "frozen") via the shared renderer spun in a rAF loop — still 1 WebGL context, drawImage copy per cell.
    **Tier system**: `DEF_SHIP`/`ATK_SHIP` → a shared `TIER_SHIP` map (T1/T2/T3 → **any** ship) + `DEF_TIER`
    (unit/integ/e2e) + `ATK_TIER` (god/unguarded); the assignment panels rebuild via `buildAssign()` so tier
    relabels stay live. **Planets deprecated** (operator): `entitySphere` sphere-branch is now the **spike bubble**
    (`BUB #aab4c6`, ghost/film translucency + wireframe lattice, from index.html) — one neutral bubble for every
    entity across Deployment/Satellites/Inter-entity; planet picker → static "bubble" note. Conflict left as-is
    (operator). Retired the 3 Kenney dishes from the roster (rendered blank + superseded; GLB data kept dormant).
    Playwright nav-verified: 23 palette cells **0 blank**, palette animates, 6 def-selects + 2 atk-selects, Starlink
    + bubble composited crops confirmed, **0 console errors**; index.html canary battery still 56/56.
    **Render-bug pass (operator caught 3 in the palette):** (1) each cell left a **smear trail** — the 2D canvas was
    never cleared before `drawImage`, frames piled up → added `ctx.clearRect` per frame; (2) the 8 Kenney ships
    **orbited a big circle** instead of spinning on-axis — rotating `raw` (off-centre origin) orbited; wrapped each
    model in a **pivot Group** (geometry centred inside, rotate the pivot) → on-axis spin; (3) label **CHIPS→SHIPS**.
    Re-verified crisp, no trails, on-axis. STILL OPEN: the 5 troubled curated models (recover or drop) · the
    procedural EFFECTS (same as it 10).
  - **Iteration 12 (3×3 assignment · colour modes · orientation · pinned palette):** operator batch.
    (1) **3×3 model matrix** — the shared `TIER_SHIP` map became per-dimension: `DEF_MODELS[kind][tier]` +
    `DEF_ACTIVE[kind]` (3×3, unit/integ/e2e) and `ATK_MODELS`/`ATK_ACTIVE` (2×3, god/unguarded); `matrixKind()`
    renders a header + 3 tier rows (active-radio + full-roster `shipSelect`); `defModel()/atkModel()` pick the
    active tier; removed `tShip/DEF_TIER/ATK_TIER/tierSelect`. (2) **Colour modes** (`COLOR_MODE`, one selector,
    both teams, ground **disc removed**). Modes settled to **aura / glow / outline** (paint DROPPED, operator was
    about to): `aura` (DEFAULT) = a shape-matched additive backface HALO, ORIGINAL colours untouched (the effect
    the operator called "perfect" — renamed off "glow" since it isn't one) · `glow` = NEW, a LIGHT from the asset
    CENTRE (layered additive blooms + lit interior, team colour) · `outline` = crisp `EdgesGeometry` team-colour
    edge lines (the inverted-hull shell read as a chunky blob). (3) **Inter-entity orientation** — `faceAlong`(lookAt→wrong −Z) replaced by
    `orientAlong` = `quaternion.setFromUnitVectors(model.longAxis, travelDir)`; `normShip` stores `userData.long`.
    Ships now lie ALONG the connection. (4) **normShip centring bug fixed** — it set `position=−c` THEN
    `rotation.y=π`, so the rotation threw the geometry off-origin by `(−2c.x,0,−2c.z)`; the glow halo (scaled by a
    different factor) then drifted AWAY from off-centre ships. Fix: rotate FIRST, recompute the bbox centre, then
    offset → geometry truly centred, halo hugs every ship. (5) **Palette PINNED** — `.palette` → `position:fixed`
    right rail (304px, own `overflow-y`, 2-col cells), `body{padding-right}`, un-pins < 1080px; stays visible while
    the page scrolls. Adversarial **review workflow** (4 dimensions → verify, `wf_3a482572`) returned **0 defects**,
    corroborating the Playwright 0-error pass. Verified: def 10 selects/9 radios, atk 6/6, all 3 modes render for
    both teams, halos centred + original colours kept, orientation on-axis, 23 palette cells 0 blank, 0 errors.
  - **Iteration 13 (lock/copy · unguarded quantity · ships+shuttles · nose-orient · entity colours):** 5-ask batch.
    (1) **Lock + copy + dim**: `LOCKED` Set; a `lockBtn` beside every model selector reserves its asset → the
    palette cell greys (`filter:grayscale` + "used" badge, `refreshPaletteLocks` on `.palcell[data-k]`), and the
    lock state repaints across ALL selectors (`repaintLocks`); a `copyBtn` per section dumps that section's
    selections as JSON to the clipboard (textarea fallback for file://). (2) **Unguarded remodel** — NO tiers: one
    `shipSelect` + a count slider; `atkModel('ung')`=`ATK_MODELS.ung[0]`, rendered ×count at **half scale** (0.24).
    Confirmed to operator: unguarded IS a detectable quantity (the `guard_insight`/`_a3_guard` unguarded floor
    count). (3) **Ships+shuttles unified** — `craftBase(k)=SHIPS[k]||SHUTTLES[k]`, `teamShip` uses it, `shipSelect`
    lists both in two `<optgroup>`s; any chip slot (defence 3×3, attack, inter-entity) can now pick a shuttle. (4)
    **Inter-entity reverse FIXED universally** — `normShip` detects the model's **nose** (narrower end sampled along
    the long axis) → `g.userData.nose`; `orientAlong` aligns nose→travel, so ANY craft leads nose-first (clipper
    nose `−z` was the exact opposite of racer `+z` → the reverse cause). (5) **Inter-entity ENTITY COLOURS** —
    `entitySphere(R,colHex)` tints each of the 3 bubbles a distinct `ENT_COLORS`; routes coloured by destination;
    movers = `teamShip(key, ENT_COLORS[dest])` = ORIGINAL hull colours + the current effect in the entity's colour.
    Verified: 15 lock buttons, 6 copy buttons, shuttle selectable (optgroups), lock dims the palette cell, unguarded
    single + ×N half-size, nose opposite for clipper/racer, 3 entity-coloured spheres + nose-forward movers, 0
    console errors. Adversarial review `wf_20f51a89` (15 agents) found **2 real defects**, both fixed: the COLOUR
    MODE selector omitted `rInt()` (inter-entity movers route through `teamShip(COLOR_MODE)` → stale mixed-style
    view) and the attack note printed a phantom `T1` tier for the now-tier-less unguarded.
  - **Iteration 14 (fleet levelling · mover flip · satellite signal/rings):** operator polish batch.
    (1) **Tie tilt fixed** — a plain `rotation.y` inherited the model's baked-in roll (the TIE read 45° tilted);
    new `orientTo(obj,fwd,nose)` aligns nose→enemy AND rolls up→world-up, so def/atk ships sit upright for ANY
    craft (def nose→−X, atk nose→+X; verified tie level + def unregressed). (2) **Mover reverse toggle** — nose
    auto-detect fails for wide-front craft (a cargo hauler's narrow end is its TAIL), so `INTC.shuttleFlip`/
    `testFlip` + a `rev` toggle per mover negate the nose (deterministic operator override). (3) **Satellite
    signals** — the emitted wave rings were a fixed too-wide radius → `SATC.sig` slider (scales the wave, smaller
    default 0.45). (4) **Satellite rings** — `SATC.rings` slider (1–3, `satRingGuides` draws only that many, sats
    distribute `i%rings`) + `SATC.ringOp` slider (dim/transparent, 0 hides). Three new sat sliders (signal/rings/
    ring-opacity). Verified: tie upright, hauler flip nose-forward, 1-ring + tight-wave sat render, 0 errors.
  - **Iteration 15 (conflict dual-effect + colours→dimensions · deployment split distances):** last two sections.
    **Conflict**: `CFL_EFF` (either/or) → `CFL_FX={shock:{on,color,dim}, flak:{on,color,dim}}` — BOTH effects usable
    at once, each in its OWN colour, and the **centre sphere REMOVED** from both (operator). Each effect colour is
    a `<input type=color>` picker + a **dimension dropdown** (`CFL_DIMS`: blast size/radius · failing tests ·
    in-flight · guard state · god · unguarded) recording which map field will DRIVE the colour later — suggested
    defaults shock←blast-size, flak←failing-tests. `cflBuild` composes both ticks. **Deployment**: `DEPC.dist` split
    into **three** independent distances — `adDist` (attack+defence share it, equally distant), `cflDist` (conflict
    cloud height), `satDist` (satellite orbit); `spread`+`move` unchanged (attack+defence only). The standalone
    SATELLITE view keeps its own `SATC.rad`. Verified: 2 colour pickers + 2 toggles + 2 dim-dropdowns in conflict,
    both effects render distinct colours with no centre sphere, 3 deployment distance sliders drive conflict-far/
    fleets-mid/sats-close independently, 0 console errors. (Batch visually verified + closures reasoned; no review
    workflow this round — it's slider-splitting + a dual-effect toggle, and the last two reviews found only cosmetic
    gaps.)
  - **Iteration 16 (conflict mapping FLIPPED · sat defaults):** operator corrections. (1) Conflict re-modelled the
    right way round: `CFL_FX` (effect-per-row) → **`CFL_MAP` (field-per-row)** — LEFT = the mappable field, RIGHT =
    its colour picker + effect selector (none/shock/flak); `cflBuild` renders each mapped field as its effect in its
    colour (multiple fields → the same effect just stack in different colours). **god + unguarded DROPPED** (already
    represented in attack); remaining fields = blast size · blast radius · failing tests · in-flight · guard state.
    (2) Satellite defaults set to the operator's config: count 10 · size 0.12 · orbit_r 2.5 · tilt 0.25 · speed 0.2.
    Verified: 5 field rows (5 colour inputs + 5 effect selects), multi-field render (cyan+green shock + red flak, no
    centre sphere), sat defaults live, 0 errors.
  - **Iteration 17 (consolidate settled configs as DEFAULTS + pre-lock):** the lab reset to code defaults on reload,
    losing the operator's settled work. Baked their four copied configs into the default state — defence
    (unit bomber/cat/jet·integ speederC/D/B·e2e miner/cargoA/B, active 3/1/3, all kinds on), attack (god
    dart/fighter/cruiser@T3, unguarded tie ×4), inter-entity (hauler shuttle w/ `shuttleFlip:true`, clipper test,
    ×1, size .35, speed .3), satellites (count10/size.12/orbit2.5/tilt.25/speed.2). Pre-populated `LOCKED` with the
    16 settled assets → they load **dimmed + "used"** in the palette (15 lock buttons amber). The old trailing notes
    resolved: tie upright (orientTo), hauler nose-forward (flip default). Verified: all configs live on load, 16
    dimmed cells, tie level, 0 errors.
  - **Iteration 18 (deployment distances/Y/orientation · sat rings off · conflict section slot):** (1)
    `SATC.ringOp` default 0 (no visible orbit rings). (2) Deployment `adDist`/`cflDist` ranges 4–30 → **1–8**
    (close-range, defaults 4). (3) New **`DEPC.adY`** slider (attack+defence up/down, −15…15) — `placeFleet` shifts
    the fleet centre in Y. (4) **Deployment orientation FIXED** — `placeFleet` used a fixed `rotation.y` (models
    looked away from the planet); now `orientTo(ship, −pos, nose)` points every ship's nose at the planet centre, so
    attack + defence face each other across it. (5) Conflict rows gained a **section** dropdown after the effect
    (`CFL_SECTIONS`: conflict/attack/defense/deployment/satellites/inter-entity) — records where each field
    indicates its problem (`CFL_MAP[dim].section`, in copyHead). Verified: dep sliders 1–8 + up-down present, ships
    nose-to-planet, 10 conflict selects (effect+section), rings off, 0 errors.
  - **Iteration 19 (conflict flag-reason · deployment nose-flip corrected):** (1) Conflict section dropdown → a
    **FLAG REASON** editable text per field (`CFL_MAP[dim].flag`, in copyHead) = the case that makes that field a
    negative signal (defaults supplied: blast size = "many entities hit — wide blast, high coupling", failing tests
    = "junit failures — a guard broke", …). (2) Deployment orientation — added a per-model **`NOSE_FLIP`** override
    (`craftNose` negates the detected nose for listed models, correcting EVERYWHERE at once). First seeded with all
    cargo craft — **WRONG**: a clean nose-inspector (`_build/nose-inspect.html`, each model oriented nose→+X) proved
    cargoB/miner/cruiser/jet/speederC all detect front-forward; only **hauler** is genuinely reversed → `NOSE_FLIP=
    {hauler}`. Settled deployment fleets now face the planet. Nose detect is heuristic (narrower end = nose); a
    wide-front craft can fool it — the fix is naming it into NOSE_FLIP. Verified 5 flag inputs, fleets inward, 0-err.
  - **Iteration 20 (conflict shock-dedup + binary flak + flak-candidate research · def/atk inspection views):**
    **Conflict**: (1) blast size + blast radius BOTH → shock; `cflBuild` now DEDUPES by effect (one shock, first
    field's colour) so the two blast fields drive a single scaled shockwave (`CFLC.rad`←blast radius · `wav`←blast
    size). (2) `cflFlak` is now **BINARY** — fixed 18-part burst, decoupled from the blast sliders (failing tests
    happen or not). (3) An **Explore agent** inventoried the command-centre generators for already-computed binary
    problem-flags usable as flak (no recompute): top hits **junit case-fail** (=failing tests) · **unproven flow**
    (`_a3_evidence.collect_coverage`) · **untested element** (`_a3_tests.untested_surface`) · **web-bridge unmatched
    fetch** (`_a3_graph.build_c4_graph stats.web.unmatched`); also entity-shape orphan/aspect, workflow-census drift,
    stale-anchor. Added the top 3 as conflict fields (default OFF, map to flak). **Def/atk views REDESIGNED** to
    inspection layout — defence = planet LEFT + assets stacked RIGHT facing it; attack = planet RIGHT + assets LEFT;
    STATIC (`Vdef`/`Vatk` `noSpin:true`, camZ 62) so the operator can judge each asset vs the planet and name any
    reversed one. Verified: 8 conflict fields, one deduped shock + binary flak no-sphere, def planet-left/atk
    planet-right static, 0 errors.
  - **Iteration 21 (per-slot manual rotation overrides · conflict narrowed):** operator took manual orientation
    control. Added **`ROT[section][kind][tier]`** = `{r:rollDeg (horizontal planet-axis, clockwise +), y:yawDeg
    (vertical Y), scale}`; `applyRot` runs it on top of the planet-facing pose in the def/atk inspection views
    (def unit t1/t2/t3 = 90cw/180/90ccw, integ = 90cw/90ccw/—, e2e = 180/—/—; atk god t1 = 90cw+90yaw, unguarded =
    90cw+90yaw+×0.7). `defBuild`/`atkBuild` now thread {key,kind,tier} so the active tier's override applies.
    **Conflict narrowed** (operator): only **blast radius → shock**; **failing tests + untested element → flak
    (red)** (both dedupe to one red flak); blast size → none. Verified: rotations applied per active tier, conflict
    = one shock + one flak, 0 errors. **Axis fix (same iteration):** first tried roll around the horizontal
    planet-facing axis → it PITCHED the chips nose-up (operator: "looking up"). Corrected `applyRot`'s `r` to a
    **SCREEN-PLANE spin around the depth/camera axis** (world Z, clockwise = +) — clockwise/anticlockwise now read as
    an on-screen image rotation, not a pitch. `y` stays vertical-axis yaw. Re-verified: in-plane spin, 0 errors.
  - **Iteration 22 (live 3-axis rotation controls — operator dials, copies, pastes):** the fixed-guess rotations
    kept missing, so handed the operator live control. `ROT[section][kind][tier]={x,y,z}` (deg, world X/Y/Z) reset to
    zero; `applyRot` rotates the planet-facing pose by all three. New `rotSliders(spec,…)` adds X/Y/Z range sliders
    (−180…180) targeting the ACTIVE tier's ROT entry; `matrixKind` grew `section`+`rebuild` params and renders the
    three sliders under each kind (radio switch → `buildAssign` retargets them to the new active tier). Unguarded
    gets its own 3 sliders (`ROT.atk.ung`, keeps ×0.7). `ROT.def`/`ROT.atk` folded into the def/atk copyHeads so a
    copy round-trips the dialed rotations. Verified: 9 def + 6 atk rotation sliders, live yaw rotates the asset,
    0 errors. (The operator dials each tier on-screen and pastes the config back.)
  - **Iteration 23 (bake dialed rotations + LOCAL-axis fix):** operator pasted the dialed configs → baked `ROT.def`
    (unit y −90/−180/90 · integ y −90/90/0 · e2e y −180/0/0), `ROT.atk` (god t1 y −90 · ung x90/z90/×0.7), and the
    active-tier changes (`DEF_ACTIVE.integ` 1→3, `ATK_ACTIVE.god` 3→1). Operator reported an axis "won't reach a
    needed 90°" — cause: `applyRot` used fixed **world** axes in a set order, so after one rotation the next slider
    no longer lined up (a lock). **Switched `applyRot` to the model's LOCAL axes** (`obj.rotateX/Y/Z`), so each
    slider rotates around the asset's current axis and sequential dialing reaches any pose. Defence/god are Y-only on
    a leveled (up=worldY) asset → look unchanged; unguarded (X+Z) shifts and gets a quick re-dial with reachable
    axes. Verified: baked config loads, defence assets face the planet, 0 errors.
  - **Iteration 24 (rotation apply-order fix + deployment propagation):** (1) god-T1 dart's X/Z sliders "wouldn't
    rotate" — cause: `applyRot` ran the local rotations X→Y→Z, so X was applied BEFORE the y:−90 yaw and got
    absorbed by it. Reordered to **Y→X→Z** (yaw to face the planet first, THEN X pitches / Z rolls the facing
    model) — X now pitches the dart (wings up→toward planet). Defence/ung unaffected (Y-only, or Y=0). (2)
    Deployment ignored the corrections — `defList`/`atkList` now carry each slot's `rot` spec and `placeFleet` runs
    `applyRot` after `orientTo`, so the fleets around the planet render in the SAME dialed poses as the def/atk
    inspection views. Verified: god-T1 X pitches the dart, deployment fleets show the corrections, 0 errors.
    **Final bake:** operator re-dialed + pasted → `ROT.atk.god[1]={y:-90,x:-90,z:0}` (dart wings now point at the
    planet). Both defence + attack fleets now render in the operator's exact dialed poses across the def/atk
    inspection views AND deployment. Orientation arc complete.
    **Deployment defaults baked:** `DEPC={adDist:3.5,cflDist:1.5,satDist:9.5,spread:1.4,move:0.45,adY:0}` (operator
    config). ALL SIX spike sections now carry operator-dialed defaults that survive reload (def/atk/conflict/
    satellites/deployment/inter-entity). The whole chip-lab arc remains UNCOMMITTED on the local `graft-adoption`
    branch — offer to commit.
  - **Iteration 25 (TRIM dead tier + inter-entity/cluster research):** operator approved the dead-tier trim.
    **Removed:** the planet path (`PLANC`, `PLANETS`, the `entitySphere` planet branch, the loader loop, `PLANET_GLBS`/
    `PLANET_NAMES` — 5 GLBs, 316 KB), the 3 dormant dish GLBs (58 KB), `satBillboard`/`SAT_ICONS`/`satTex` + the dead
    `makeSat` else, and unused `CRAFT_NAMES`. chip-assets **3139→2639 KB** (−500 KB); verified 18 ships + starlink,
    0 errors. Ships/shuttles roster KEPT (may serve inter-entity/clusters). Two Explore agents researched the next
    two builds:
    **Inter-entity CONNECTORS** (answer: connector type = RELATIONSHIP kind, not component kind) — entity↔entity L1
    multi-kind edge carries `fk` (data coupling, trusted, `_a3_graph._l1`), `calls` + `imports` (graft cross-wire,
    inferred floor, `_a3_graft.derive_cross`), each with weight=count + direction + trust; component-level: `bridge`
    (web fetch→API, `_a3_graph` web arm), `cross_edges` FK (model→model), `use_edges` (fn→model), `fn_edges` (fn→fn,
    per-edge `conf` trust). Reco: 3 inter-entity connectors (fk/calls/imports) styled by kind + weighted + trust,
    optional 4th `bridge`.
    **Cluster STARS** (operator: "functions used by the cluster's components but not themselves a component") — best
    precise = **#3** `derive_functions.fn_slug` MINUS the drawn `fn_nodes` (exact hidden-fn count per cluster, clean);
    closest pre-emitted = **#1** `fn_behind` (per-fn transitive callee mass, `_a3_graft.derive_fn_behind`, in
    levels.json). Reco: star COUNT = #3, star SIZE = #1 `behind.fns` or #4 `function_insight.usage`. Other star
    flavors: unclaimed FK tables (data used, no component), untested surface (coverage gap), fan-in usage. No repo-
    wide cluster aggregator exists — clustering is per-entity (`communities`/`fk_communities` in `_a3_levels`).
  - **Iteration 26 (typed connectors + CLUSTERS section built):** (1) unguarded −50% (`ROT.atk.ung.scale` 0.7→0.35).
    (2) **Inter-entity TYPED CONNECTORS** — `connectorLines()` draws the relationship kinds per route: `fk` solid cyan
    (trusted, opacity 0.9), `calls` dashed amber (inferred 0.5), `imports` dotted purple (inferred 0.42), each offset
    parallel + a colour-coded count label (`textSprite`); `LineDashedMaterial`+`computeLineDistances` for dash/dot.
    `CONN`/`ROUTE_KINDS` sample the c4 L1 multi-kind edge weights; per-kind toggles + copy in the inter panel.
    (3) **NEW CLUSTERS section** (`cv-clu`/`asg-clu`/`Vclu`/`cluBuild`/`rClu`, amber): 4 entity spheres wrapped by
    **polygon** (`ConvexGeometry` hull, seeded ±(R+2) points) or **wrap** (`MarchingCubes` metaball, addBall per
    member) — both from the 5C spike; **STARS** inside (a 5-point `starTex` additive sprite, count←hidden-fn metric,
    size←callee mass) with a metric selector (hidden fns / unclaimed tables / untested surface) + count/size/opacity
    sliders. Verified: connectors show 3 styles + counts, polygon hull + wrap metaball both render with stars, ung
    smaller, ConvexGeometry/MarchingCubes present, 0 errors. Both designs now VISIBLE in the lab for the operator to
    dial. (No review workflow — new rendering, visually verified + 0 errors.)
  - **Iteration 27 (glow-dot stars · edge-reach connectors · bridge · e2e/ordered-path answers):** operator gave an
    NMS galaxy-map reference for stars. (1) `starTex` → a **GLOWING DOT** (bright core + soft halo radial gradient),
    not a 5-point star. (2) **Connectors reach the sphere EDGE** — `connectorLines(…,R)` offsets both endpoints by R
    along the axis (start/end at the surface, not the centre). (3) Added the **`bridge`** connector (4th kind, rose
    solid, trust 0.55 = heuristic; web fetch→API); `CONN_KINDS=[fk,bridge,calls,imports]`, per-route sample counts.
    Answered two questions: **e2e/integration** is NOT a pairwise connector — it's the multi-stop test-ship JOURNEY
    (a hyperedge, `test_insight.exercises`), already shown by the moving test ship (optional faint path line offered).
    **Ordered journey path footprint** = a small `_a3_graft` tweak: DFS each test's `calls` call-tree from its entry,
    record first-reached entity order → `journey_order[]` (static, inferred floor; today only an unordered bag exists,
    the flagged gap). Verified: glow dots, 4 connectors edge-reaching w/ bridge, 0 errors.
  - **Iteration 28 (cluster star controls + per-connector pattern/density/colour):** (1) CLUSTERS gained **glow
    radius** (`CLUC.glow` → `starSprite` = bright dot + a soft halo sprite at size×glow), **star colour**
    (`CLU_COLORS`: metric/white/yellow/gold/orange/cyan/rose — fixed or follow-metric), and **distribution**
    (`CLU_DISTS` + `starPos()`: scatter / cloud=fibonacci-sphere / ring / orbit). (2) INTER-ENTITY connectors became
    per-kind DIMENSIONS — each fk/bridge/calls/imports has: on-toggle · **pattern** (`CONN_PATTERNS`: solid/dashed/
    dotted/sparse) · **colour** picker · **density** slider (dash+gap = base/density, higher = tighter);
    `connectorLines` drives `LineDashedMaterial` from pattern+density. Both copyHeads capture the new fields.
    Verified: 8 cluster rows (white+cloud+glow render), 4 connector colour-inputs + pattern selects (fk→dotted-dense,
    imports→sparse render distinctly), 0 errors.
  - **Iteration 29 (expand star distributions to fill the cluster):** operator: scatter hugged the centre. Rewrote
    `starPos` to take the cluster's **bounding box** (`ext` = CLU_P min/max + R+2, computed in `cluBuild`) and a
    deterministic `prand(i,seed)` (stable across rebuilds); **scatter now fills the whole box randomly** (reaches the
    hull edges), and cloud/ring/orbit radii scale to the box half-extent + `prand` jitter. Verified: dots spread out
    to the hull around all 4 planets, 0 errors. **Connector config baked** (operator): `CONN` = fk dashed/2.7/#5893ad
    · bridge dotted/1.7/#e8f443 · calls dashed/2/#f59e0b · imports dotted/2.2/#a855f7. All 8 chip-lab sections now
    carry operator-dialed defaults (def/atk/conflict/deployment/satellites/inter-entity+connectors/clusters).
  - **Iteration 30 (cluster SHAPE via planet layout):** operator wanted varied/irregular cluster shapes (real
    clustering). Replaced the fixed 4-member `CLU_P` with **`clusterPlanets()`** — arranges `CLUC.planets` (3–8)
    members per **`CLUC.layout`** (`CLU_LAYOUTS`: irregular=organic scatter · compact · chain=elongated · spread=
    wide · ring), deterministic via `prand`; the hull/metaball + star bounding box follow, so each layout reshapes
    the whole cluster. Added a `layout` selector + `planets` slider (both in copyHead). Verified: chain→elongated
    hull, spread→large irregular hull, stars fill each, 0 errors. Clusters section now fully parametric (shape ·
    layout · planets · metric · colour · distribution · count · size · glow · opacity). **Cluster config baked**
    (operator): polygon · ring · 4 planets · 40 white scatter dots · size 0.6 · glow 0 · op 0.18. Extended the ranges
    for finer/smaller: star size 0.1–3 step 0.05, glow radius step 0.1. Renders as a subtle white star-field.
  - **Iteration 31 (CONSOLIDATE + rename → Elements Lab + 5C structure spec):** final cluster config baked (star
    size 0.15, glow 0.7). **Renamed** the lab `chip-lab.html` → **`spike/elements-lab.html`**, h1/title → "Elements
    Lab — designing Gabe universes" (the design surface for a Gabe universe: element = planet; future = a suite to
    design Gabe universes). **Authored [records/ELEMENTS-LAB-SPEC.md](ELEMENTS-LAB-SPEC.md)** — the structure the 5C
    spike IMPLEMENTS (does not recreate): the bubble, the 5 zones (defence/attack/conflict/deployment/satellites)
    with their map-dimension→asset/effect mappings, orientation rules (`orientTo`/`NOSE_FLIP`/per-slot `ROT` Y→X→Z
    local), the 4 typed connectors (fk/calls/imports/bridge, sources + trust + dialed styles), clusters (polygon/wrap
    layout + hidden-fn star field via `derive_functions.fn_slug`−`fn_nodes`), the full settled-config JSON, and the
    5C integration points. **Trim DECISION:** 5C carries only the used config; the Lab keeps its full roster/options
    (design tool — operator wants future assets/dimensions/effects available). Renamed lab verified (loads, 0 errors).
    Historic iteration notes above still say "chip-lab"; the live file is `elements-lab.html`.
  - **Iteration 32 (portable LEGEND widget — build it here first):** operator wanted the "legend square" for the
    Final Dynamo built in the Lab first (don't overwhelm the 5C retrofit). Added a self-contained tabbed legend
    (`#legend` bottom-left overlay + `LEGEND` data + `buildLegend()`), collapsible, 4 tabs **Zones · Connectors ·
    Effects · Clusters**. Per the [legend-visual-not-words] ruling every row renders the **actual glyph as drawn** —
    CSS swatches (zones), dashed/dotted border-lines in the **exact** connector colours (fk teal-dashed · calls
    amber-dashed · imports purple-dotted · bridge yellow-dotted), effect glyphs (aura halo · glow centre-dot ·
    outline ring · shock rings · flak burst · signal dot), cluster shapes (poly/wrap/dot) — the word sits only as a
    muted parenthetical. Verified headless (Playwright): tabs `[Zones,Connectors,Effects,Clusters]`, tab-switch +
    minimise work, connector wires + effect glyphs match the 3D, 0 errors. Logged in the spec under **Legend (lift
    as-is)** — copy into 5C and extend `LEGEND`.
  - **Iteration 33 (legend REDESIGN → dimension tabs + asset thumbnails + adversarial verify):** operator bound the
    legend as the **contract of what this lab designs**. Rebuilt: **fixed-size** (300px wide · 250px scrolling body ·
    tab row wraps → constant 327px, measured across all tabs), minimizable, **6 tabs = the adopted dimensions**:
    `Elements` (dashed **placeholder** — the spike owns the kind-icon+3D node, this lab abstains) · `Connectors`
    (kept — the only surviving old tab) · `Defense` (unit/integ/e2e) · `Attack` (god/unguarded) · `Conflict`
    (blast/failing/untested + sub-lights) · `Field` (satellites + cluster stars). **Defense/Attack/Field render REAL
    3D asset thumbnails** — `legThumb` registers a cell into the ONE shared palette renderer (`palLoop` scales the
    236×208 render into each 42×36 cell → **no new WebGL contexts**), `legPrune` drops them on re-render so tab-switches
    don't leak; ships carry their team accent (green/red) as drawn. Folds: old **Effects** tab → Conflict sub-lights;
    old **Clusters** tab → Field. **"Elem-assets" dropped** as a dictation artifact (DECISION — attack = god+unguarded,
    confirmed by the operator's five-dimension list). Updated the spec (adopted-dimensions table + rewritten Legend
    section) + authored **`records/5C-RETROFIT-PROMPT.md`** (paste-able prompt to implement into `index.html`).
    **Adversarial verify** (5-agent workflow `wf_7a845a96`, 425k tok): ruling PASS (every row a real glyph/thumbnail,
    placeholder abstains). **2 real code bugs FIXED:** (HIGH) `loadShips` error cb never decremented `left` → one
    failed GLB hung ready-state forever + froze every viewer/thumbnail → extracted a shared `fin()` fired on
    success OR failure; (LOW) COLOR_MODE change didn't repaint legend thumbs → added `window.__legRender()` to the
    tint selector. **Doc-accuracy fixes:** bridge is a top-level `cross_edges` edge NOT an L1 kind · `fn_behind` reads
    at `fn_nodes[].behind.fns` · `det.usage` is a compound endpoint/model-L2 dict (no per-fn) · `untested_surface`
    emits HTML (re-derive) · retrofit's "six dimensions" split-Field/no-Elements trap → **five designed dimensions +
    one placeholder, six tabs** stated explicitly · e2e `journey_order[]` tweak disambiguated from the used-by
    `callers` tweak. Re-verified: 6 tabs, 327 constant, all thumbnails painted, 0 errors. **DEFERRED (operator's
    call):** GPU dispose in legPrune/Viewer.set (leak per tab-switch/slider — trigger: if the lab becomes the shipped
    long-running diagram) · effect/wire/star cells are faithful CSS stills not live draw-fn reuse (trigger: operator
    wants strict fidelity). **FLAGGED for operator:** defense "side-by-side" (stacked rows vs 3-in-a-row) · default
    tab opens on the Elements placeholder · literal parens vs muted-italic descriptors. **COMMITTED** `0abcd96` (whole
    uncommitted arc, 53 files) + this fix/log commit; branch `graft-adoption` LOCAL, unpushed.
