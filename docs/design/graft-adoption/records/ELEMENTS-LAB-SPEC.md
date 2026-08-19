# Elements Lab → 5C implementation spec

The **Elements Lab** (`spike/elements-lab.html`, formerly chip-lab) is the design surface where the
Gabe-universe visual language was settled. This is the **structure the 5C spike implements** — 5C already
carries the graph (entities, edges, force layout); it adds the *planet rendering* below, using the settled
config. Do **not** recreate the lab in 5C; implement these decisions.

**Model:** one **element = a planet** (the entity sphere / "bubble"). Around each planet sit five zones; between
planets run typed **connectors**; groups of planets form **clusters** with a hidden-mass star field.

The Lab stays the design tool (full asset roster + every option). 5C carries **only what's used below.**

---

## The bubble (the planet itself)

- A neutral translucent sphere: fill `#aab4c6` @ 0.05 (double-side) + a wireframe lattice @ 0.13. Tintable per
  entity (inter-entity + clusters pass an entity colour; the single-planet views use the neutral bubble).
- Planet skins are **deprecated/trimmed** — one bubble for every element.

## Assets roster (what 5C needs)

- **Ships (used):** `bomber cat jet · speederB speederC speederD · miner cargoA cargoB` (defence) · `dart fighter
  cruiser · tie` (attack). Kenney Space Kit (CC0) + curated Poly Pizza (CC-BY, see `spike/assets/links.txt`).
- **Shuttles (used):** `hauler` (data movers) · `clipper` (journey ship). CC-BY.
- **Satellite:** `starlink` — real 3D flying sat w/ solar reflectors (CC-BY, K7kE2DCBY8).
- Base64 GLBs live in `spike/chip-assets.js` (2.6 MB). Loader → `normShip()` (centre, fit=7/maxDim, long-axis +
  **nose** = narrower end). Unused ships (`speederA racer quaternius sub pod`) + `runner` shuttle stay in the Lab
  roster for future design; **5C omits them.**

---

## The five zones (per planet)

| zone | represents | map dimension → drives | asset / effect |
|---|---|---|---|
| **defence** (right shell) | tests defending the element | test **KIND** — the three model keys are `unit/integ/e2e` (sourced from the junit corpus, whose kinds are `api/web/e2e`) → which ship · test **count** (`test_insight.by_function`) → ships/kind · **guard state** (`guard_insight` unguarded→proven) → fleet HEALTH | a ship per kind, team-green, effect `aura` |
| **attack** (left shell) | problems attacking | **god** (`function_insight` size fn≥50/cls≥15) → 1 heavy raider · **unguarded** (`_a3_guard` floor **count**) → N small raiders | ships, team-red, effect `aura` |
| **conflict** (top cloud) | in-flight change effect | **blast radius/size** (`_a3_sim.blast` — a list of entities; size = `len`) → shock waves · **failing tests** (junit) + **untested element** (`_a3_tests.untested_surface` — emits an HTML string, so 5C must re-derive the set from `by_endpoint`/`by_model` + `function_insight`, not read it as a field) → flak | shock rings + flak burst, NO centre sphere |
| **deployment** | fleets placed around the planet | the war-zone placement law | def right · atk left · conflict top · sats south |
| **satellites** (south pole) | used-by / callers | **used-by** (`det.usage` fan-in — a compound dict on **endpoint/model L2 nodes only** — `{api,internal}` for endpoints, `{fk_in,internal}` for models; 5C picks a component, e.g. `fk_in+internal`; there is NO `det.usage` per function) → count | N starlink sats orbiting, signal waves |

**Orientation rules (critical — this is where the Lab's time went):**
- `orientTo(obj, forwardDir, nose)` — aligns the model's detected **nose** to `forwardDir` AND rolls up→world-Y
  (upright). Fleet ships face the planet; movers face travel.
- `NOSE_FLIP = {hauler}` — models whose auto-detected nose is backwards (wide-front cargo); corrected everywhere.
- Per-slot manual rotation `ROT[section][kind][tier] = {x,y,z deg, scale}`, applied **Y→X→Z in LOCAL axes** on top
  of the facing pose (yaw first to face the planet, then X pitch / Z roll). The dialed values are in the config.

---

## Inter-entity connectors (entity ↔ entity)

Connector **type = the relationship kind**, already in `c4-graph.json`. **fk / calls / imports are L1 multi-kind
edge kinds** (the `kinds` dict on an entity↔entity L1 edge); **bridge is different** — a top-level `cross_edges`
piece-level edge (`kind:'bridge'`, screen→endpoint), NOT an L1 kind. Draw each present kind as its own styled line,
**reaching the sphere edge** (offset endpoints by R), with a count label:

| kind | meaning | source | trust | dialed style |
|---|---|---|---|---|
| **fk** | data coupling (foreign keys) | `_a3_graph._l1` `kinds.fk` (L1) | trusted (exact join) | dashed · density 2.7 · `#5893ad` |
| **calls** | cross-entity function calls | `_a3_graft.derive_cross` → `kinds.calls` (L1) | inferred floor | dashed · density 2 · `#f59e0b` |
| **imports** | cross-entity imports | `_a3_graft.derive_cross` → `kinds.imports` (L1) | inferred | dotted · density 2.2 · `#a855f7` |
| **bridge** | frontend fetch → API endpoint | `_a3_graph` web arm — a top-level `cross_edges` `kind:'bridge'` (`_bridges` join); `stats.web` is only the summary count, not the edge source | heuristic | dotted · density 1.7 · `#e8f443` |

- Style patterns: solid / dashed / dotted / sparse; **density** scales dash+gap (`base/density`, higher = tighter);
  opacity = trust; thickness/weight → count label.
- **e2e / integration** is NOT a pairwise connector — it's the multi-stop **journey** of the `clipper` test ship
  (`test_insight.exercises`, an unordered bag). The **ordered** journey path is a GAP; producing it needs a small
  `_a3_graft` tweak (DFS each test's `calls` call-tree from its entry → first-reached entity order `journey_order[]`,
  static inferred floor). **This is the e2e-journey tweak** — distinct from the satellites `callers`/in-degree
  fan-in tweak floated in the trace record; only the `journey_order[]` tweak is in scope for this retrofit.

## Clusters (groups of planets)

- **Shape** = the member-planet **layout** wrapped by a hull: `polygon` (`ConvexGeometry`, seeded ±(R+2) points) or
  `wrap` (`MarchingCubes` metaball). Layout options (`irregular`=organic scatter · `compact` · `chain`=elongated ·
  `spread` · `ring`) arrange N member planets → the cluster's overall shape follows. Both shapes are inherited from
  the 5C spike's own `makeCluster` (polygon/wrap) — reuse that machinery.
- **Stars** = elements USED by the cluster's components but never surfaced as one:
  - **count** = `derive_functions.fn_slug` **minus** the drawn `fn_nodes` (hidden functions; exact per-cluster
    set-difference).
  - **size** = the transitive callee mass, pre-emitted in `levels.json` at `fn_nodes[].behind.fns` (NOT a top-level
    `fn_behind.fns` key) — or `function_insight.usage`.
  - alt metrics: **unclaimed tables** (`_a3_graph.__unclaimed__`) · **untested surface** (`untested_surface`).
  - Rendered as glowing **dots** (bright core + soft halo), distributed to fill the cluster's bounding box
    (scatter / cloud=fibonacci-sphere / ring / orbit), glow radius + colour configurable.
- No repo-wide cluster aggregator exists yet — clustering is per-entity (`communities`/`fk_communities` in
  `_a3_levels`); 5C aggregates the star metrics across a group itself.

---

## Settled config (paste into 5C's implementation)

```json
{
  "defense": { "color_mode": "aura", "count": 1, "health": 1,
    "models": { "unit": ["bomber","cat","jet"], "integ": ["speederC","speederD","speederB"], "e2e": ["miner","cargoA","cargoB"] },
    "active": { "unit": 3, "integ": 3, "e2e": 3 },
    "rotations": { "unit": {"1":{"y":-90},"2":{"y":-180},"3":{"y":90}}, "integ": {"1":{"y":-90},"2":{"y":90},"3":{}}, "e2e": {"1":{"y":-180},"2":{},"3":{}} } },
  "attack": { "color_mode": "aura",
    "god": { "on": true, "models": ["dart","fighter","cruiser"], "active": 1 },
    "unguarded": { "model": "tie", "count": 4 },
    "rotations": { "god": {"1":{"y":-90,"x":-90,"z":0},"2":{},"3":{}}, "ung": {"scale":0.35,"x":90,"y":0,"z":90} } },
  "conflict": { "radius": 1.2, "waves": 2, "velocity": 0.35,
    "fields": { "blast radius": {"effect":"shock","color":"#f59e0b"}, "failing tests": {"effect":"flak","color":"#ef4444"}, "untested element": {"effect":"flak","color":"#ef4444"} } },
  "deployment": { "atk_def_dist": 3.5, "conflict_dist": 1.5, "satellite_dist": 9.5, "spread": 1.4, "movement": 0.45, "atk_def_up_down": 0 },
  "satellites": { "model": "starlink", "count": 10, "size": 0.12, "orbit_r": 2.5, "tilt": 0.25, "speed": 0.2, "signal": 0.45, "rings": 3, "ring_opacity": 0 },
  "inter_entity": { "shuttle": "hauler", "test_ship": "clipper", "per_route": 1, "size": 0.35, "speed": 0.3,
    "connectors": { "fk": {"pattern":"dashed","density":2.7,"color":"#5893ad"}, "bridge": {"pattern":"dotted","density":1.7,"color":"#e8f443"}, "calls": {"pattern":"dashed","density":2,"color":"#f59e0b"}, "imports": {"pattern":"dotted","density":2.2,"color":"#a855f7"} } },
  "clusters": { "shape": "polygon", "layout": "ring", "planets": 4, "star_metric": "hidden fns", "star_count": 40, "star_size": 0.15, "glow_radius": 0.7, "star_color": "white", "distribution": "scatter", "hull_opacity": 0.18 }
}
```

## The adopted dimensions (what the legend encodes)

The legend is not decoration — it is the **contract of what this lab designs and 5C adopts.** Each tab is one
**dimension**: a real map field rendered as an asset/effect/star. The node itself (icon-per-kind + 3D form) is the
**spike's**, not this lab's — it stays a placeholder.

| legend tab | dimension | map source | rendered as |
|---|---|---|---|
| **Elements** (placeholder) | the element node — *not designed here* | `_a3_graph` node kind + 3D body (spike `index.html`) | dashed placeholder only |
| **Connectors** | entity↔entity relationship kind | `c4-graph.json` — fk/calls/imports (L1 edge kinds) + bridge (top-level `cross_edges`) | the 4 styled wires |
| **Defense** | **test KIND** (unit/integ/e2e) | junit corpus + `test_insight.by_function` | a fleet ship per kind (green team accent) |
| **Attack** | **problem type** (god/unguarded) | `function_insight` size · `_a3_guard` floor count | a raider ship per type (red team accent) |
| **Conflict** | **internal function usage** (in-flight) | `_a3_sim.blast` · junit failing · re-derived untested set | shock (blast) + flak (failing/untested) + team sub-lights |
| **Field** | **used-by** (sat) + **fns used across the cluster** (stars) | `det.usage` fan-in (endpoint/model L2) · `derive_functions.fn_slug` − `fn_nodes` | starlink sat thumbnail + glowing star-dots |

These are the **things this lab works on** — **five designed dimensions** (Connectors · Defense · Attack · Conflict ·
Field) plus **one placeholder** (Elements, the spike-owned node). 5C **adopts the five dimensions**; it does **not**
re-adopt the node representation (the spike already owns the kind-icon + 3D form).

## Legend (lift as-is)

A portable, **fixed-size, minimizable** tabbed legend lives bottom-left of the Lab (`#legend` + `LEGEND` data +
`buildLegend()`). **Fixed 300px wide** with a **fixed 250px scrolling body** → the box never resizes on tab switch
(the tab row wraps to 2 rows; overall height is not CSS-pinned but is constant because the tab set is constant —
measured 327px across all six tabs). Per the legend rule every row renders the **actual thing as drawn**, word only
as a parenthetical:

- **Ship/sat rows** (Defense · Attack · Field) render the **real 3D asset thumbnail** — reusing the ONE shared palette
  renderer (`legThumb` registers a cell into `PAL_CELLS`; `palLoop` scales the 236×208 render into each ~42×36 cell,
  so **no new WebGL contexts**). Defence ships carry the green team accent, attack ships the red — as drawn in the diagram.
- **Wire/effect/star rows** (Connectors · Conflict · Field stars) render CSS glyphs in the exact config colours/patterns.
- **Elements** is a dashed **placeholder** — the spike owns the node; this lab abstains.

Self-contained CSS+HTML+JS. To lift into 5C: copy the `#legend` CSS block, the `<div id="legend">`, the
`legThumb`/`legPrune` helpers + the `palLoop` per-cell-size line, the `LEGEND`/`buildLegend()` pair, and the
`rebuildAll` ships-ready hook. In 5C, swap the thumbnail build closures for the data-driven models; keep colours/patterns
in sync with the config above.

## What 5C implements

5C's graph already renders entities + typed edges via `_a3_levels`. Add: (1) the **bubble** as each entity node's
body; (2) the five **zones** around a focused/hovered planet, driven by that entity's map fields; (3) the **typed
connectors** styled per the config (fk/calls/imports/bridge already in `c4-graph`); (4) the **cluster** hull + star
field over a group, stars = hidden-fn set-difference. Reuse 5C's own polygon/wrap `makeCluster`. No new data is
required except the optional `journey_order[]` graft tweak for the ordered e2e path.
