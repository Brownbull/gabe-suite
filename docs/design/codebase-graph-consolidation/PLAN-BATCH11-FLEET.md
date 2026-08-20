# PLAN — Batch 11: per-wire styling + the FLEET panel (the in-flight diagram's seed)

Status: **DRAFT v2 — awaiting operator word.** No station code changes until approved.
v2 = v1 corrected by a 3-lens adversarial plan-verify workflow (feasibility · completeness ·
in-flight-seam; 20 findings: 5 blockers, 10 gaps folded in below, 5 nits absorbed).

Engine facts verified in code: `nodeVisibility` exists in the bundle (hides = the node's three
object is REMOVED and rebuilt on re-show — not a visible flag); `linkVisibility(linkVisFn)` wired
but plain links are ALL hidden already (conns baked on) — that seam is dormant future-proofing;
fleets gate per-node via `CFG.warOn && CFG.z*` inside `buildNode→fleetZones`; transports/connectors/
hulls each rebuild from one loop; the per-node animation registries (FLEETTICK/PULSE/ORBIT/WAVE)
are reset ONLY by `rebuildNodes()`.

---

## A. Per-kind wire COLOR + SHAPE (extends the Routes tab)

Each BEAM row grows into a wire-styling row — TWO lines per kind (the 246px panel cannot fit one):
line 1 `[live sample] [color] [shape icons]`, line 2 `[beam slider]`.

- **State = CONN itself.** `CONN[kind].color`/`CONN[kind].style` are read live by `connectorWire`;
  mutate directly, redraw via the existing rAF `redraw()`. Boot snapshot `CONN0` → per-row reset.
- **Color**: native `<input type="color">` → `parseInt(hex.slice(1),16)` (CONN colors are NUMBERS
  everywhere they are read — keep them numbers).
- **Shape**: icon pill — solid / dashed / dotted / sparse. Solid is the separate
  `LineBasicMaterial` branch in `connectorWire` (not a base-map entry) — the control just sets
  `style:"solid"`; the branch handles it.
- **ONE style→dasharray map** (`{solid:"", dashed:"6 3", dotted:"1.5 3.5", sparse:"5 10"}`),
  shared by the row sample AND the legend — the current `beamRow` dotted-vs-else map lies for
  solid/sparse, and the legend's CSS `border-bottom:<style>` cannot draw sparse at all. Both
  samples become SVG-dasharray renders from that map (legend ruling: the actual wire as drawn).
- **Legend CONNECTORS rows are hardcoded literals** (duplicate CONN's boot values) — verified, so
  "re-render" is not enough: derive the rows FROM `CONN[kind]` at render time. Then edits follow free.
- Session-local; no persistence — consistent with all config.

## B. The FLEET panel — top-left, per-entity visibility + ops matrix

**Chrome**: new `#fleet` panel, config skin. `dragCfg` is id-hardwired to `#cfg` — parameterize
into `makeDraggable(panel, head)` (config keeps its behavior; fleet gets its own drag state).
Geometry (three verified collisions):
- `left: calc(var(--navw) + 12px)` + the same `transition:left .18s` #elegend carries, PLUS a
  nav-min offset (`body.nav-min` puts the `.navshow` restore tab at the exact same corner —
  fleet shifts right ~36px under `nav-min` so the tab stays clickable).
- `top: calc(var(--topbarh) + 10px)`; `max-height: calc(100vh - var(--topbarh) - 500px)` floor
  240px + scroll — legend-aware (the 470px legend shares the left edge; battery renders at
  1100×760 where an 8-row matrix would otherwise overlap it).
- z-index between the legend (45) and navshow (60); dragging over the legend is allowed (panels
  are both movable).
Built once at boot OUTSIDE `#cfg` → immune to the `buildCfg()` wipes by construction. Every
handler guards `if(Graph)` — Graph is created async inside `preloadBillboards`.

**Matrix**: one row per entity (color dot + slug, from `_ents`), MASTER row on top:

| col | icon | effect |
|---|---|---|
| show | eye | nodes + hull + label + wires + shuttles of that entity |
| subs | sub glyph | that entity's sub-cluster hulls |
| def / atk / cfl / sat | shield / swords / burst / target | that entity's fleet zones |
| routes | truck | transports on routes touching that entity |

**Masters-off honesty**: every column whose GLOBAL master is off (warOn/zones on Planets;
entOn/subOn/transports on Universe) renders dimmed via the existing `zonesoff` pattern, kept in
sync when the master flips (incl. `?war=1` URL params). Zones default OFF (`warOn:false`) — the
dimming is what tells the operator why a z* cell does nothing.

**State contract (THE SEAM — v2, in-flight-proof):**

```js
window.UNIVIS = {
  ent:  { [slug]: { show:1, subs:1, zDef:1, zAtk:1, zCfl:1, zSat:1, routes:1 } },
  node: {},   // RESERVED: per-piece overrides — GABE_SIM stages key pieces by pid ("model:"+cls)
              // and universe node ids are the SAME strings (verified) → later = a direct id join
  meta: {},   // RESERVED: stage/role vocabulary for the in-flight batch (e.g. {stage:"execute"})
};
function visEnt(slug)   // accessor: missing entry ⇒ SHOWN (unknown/l2-only entities never vanish)
function visN(n)        // accessor: node override else visEnt(n.ent) — the ONE place "dim" and
                        // per-piece roles land later; ALL seams read through these two
function applyVis(scope)              // pushes UNIVIS into the engine; scope picks WHICH routines
                                      // run (nodes/clusters/transports) — never a partial rebuild
window.__uniApplyVisPreset(preset)    // deep-merge ALL namespaces, PRESERVE unknown keys —
                                      // a later preset carries node/meta through unchanged
```

Also reserved on ent/node values: `role` (touched/blast/context marking). Zone visibility is NOT
the role channel — fleets are metric-derived (attack ships only exist for god/untested nodes), so
a healthy touched entity would show nothing; role marking will map to hull tint / an injected
marker in the in-flight batch.

**Precedence — stated for EVERY column**: effective = global AND entity
(`CFG.warOn && CFG.zDef && visEnt(e).zDef`; `CFG.entOn && show` for hulls; `CFG.subOn && subs`;
`CFG.transports && routes`). The panel refines; a global off is absolute.

**Engine wiring (v2 — entity resolution via `NIDS[lid(id)].ent`, never NENT: NENT is built once
at boot and is STALE for toggled-in function nodes):**
1. nodes → `Graph.nodeVisibility(n => visN(n).show)`; fn nodes inherit via `n.ent`.
2. hulls + stars + labels → `buildClusters`: ent hull skipped when `!show`; sub hulls skipped when
   `!show || !subs` (sub hulls build in their own loop — `!subs` alone leaves ghost sub-hulls
   around a hidden entity).
3. connector wires → `updateConnectors` skips when either endpoint's entity (via NIDS) is hidden.
4. fleets → gates in `fleetZones` become `global && visN(n).z*`.
5. transports → `buildTransports` skips a route when either end `!routes || !show`.
6. plain links → extend `linkVisFn` the same way — DORMANT future-proofing (conns baked on hides
   them all today); stated as such, no proof weight on it.

**Rebuild routing (v2 — two blockers fixed here):**
- show/subs → `rebuildNodes()` + `buildClusters` + `updateClusters(true)` + **`buildTransports()`**.
  `rebuildNodes` is REQUIRED on show changes: re-show recreates node objects through `buildNode`,
  which pushes NEW animation closures while stale ones keep ticking — only `rebuildNodes` resets
  the FLEETTICK/PULSE/ORBIT/WAVE registries (unbounded growth across All/None otherwise). And
  `buildTransports` is REQUIRED here too: MOVERS rebuild nowhere else — hiding via the eye would
  leave ghost shuttles flying to an invisible entity.
- z* → `rebuildNodes()` (all-nodes by design — same cost the global zone toggle already pays;
  no partial-rebuild mechanism exists or is needed).
- routes → `buildTransports()`.
- The panel gets its OWN rAF coalescing (the Routes-tab `redraw()` is closure-local and only
  covers connectors); a master-row drag coalesces to one rebuild per frame.

**Interaction rules (decided, in proof):**
- Selected node/link whose entity hides: the card STAYS OPEN with an explicit "entity hidden by
  the fleet panel" line (honest-empty style) — clicks can no longer land on hidden nodes anyway.
- Shared pieces (first-home-wins dedup): hiding the HOME entity hides the shared node and every
  other entity's wires to it; the card's liveConns still lists them. ACCEPTED this batch, named
  in the panel's help line; the stub-or-dim treatment rides the "dim" trigger below.
- Chain layout keeps fixed slots for hidden entities (gaps in the ribbon) and sub-anchor counts
  include hidden nodes — ACCEPTED; hiding never re-runs layout.

## C. The in-flight seam (v2 — one wiring lands THIS batch)

- **`<script src="./sim.data.js">` joins the universe page NOW** (assemble patch + fill-example
  rehome). Verified: without it `window.GABE_SIM` is undefined on EVERY deployment — the sibling
  codebase-graph station already loads it; the example dir already carries `sim.data.js` with
  `GABE_SIM = null` (no 404, no console error).
- Panel header PRESETS row: **[All] [None] [In-flight]**. All/None live. In-flight DISABLED stub
  whose title distinguishes the two honest-empty states: feed absent (`undefined` — page has no
  sim.data.js sibling) vs at rest (`null` — feed present, no change in flight).
- **RULINGS SETTLED (operator, 2026-08-20)** for the in-flight batch:
  - **R1 = (b)**: stages mark via HULL TINT per stage + a stage BEACON above the entity — zones
    stay quality signals (metric-derived fleets cannot carry roles). The Red→Execute→Review→Commit
    color vocabulary is still the operator's pick at build time.
  - **R2 = DROPPED**: no "dim" state — the fleet panel's hide controls ARE the context mechanism
    (keep only related entities/clusters visible). `visN()` stays boolean.
  - **R3 = (b)**: blast widens CLIENT-SIDE, 1 hop over the loaded GABE_C4 l1 multi-kind edges,
    TINTED BY TRUST (structural FK-blast vs inferred call/bridge-blast). Emitter untouched.
  - **Layers = (c), LANDED batch 12**: the layer core groups by the kind's OWN layer
    (endpoints · api · web · data), auto-grows with new kinds; (d) full frontend-model enrichment
    stays HELD on its existing trigger (codebase-map enforcement understood first).

## Slices (each: assemble → land → fill → headless proof → battery, committed separately)

1. **A** — wire styling rows + the shared style map + CONN-derived legend rows.
2. **B1** — panel chrome (makeDraggable, geometry, masters-dim) + UNIVIS/accessors + show/subs
   (seams 1-3 + the corrected routing incl. rebuildNodes + buildTransports).
3. **B2** — z*/routes columns + master row + panel rAF coalescing.
4. **C** — sim.data.js include + presets row (All/None live, In-flight honest stub).

Operator-felt cost: one session, 4 commits, battery grows ~18 checks, verify-fleet.mjs joins the
committed proofs. No generator/emitter changes.

## Proof plan (verify-fleet.mjs — v2 assertions match the real mechanism)

- Hide an entity → its node OBJECTS ABSENT from the scene (not a visible flag), hull+label gone,
  no connector touches it, **no shuttle flies to it**, its fn nodes gone too (**Functions ON
  case included** — the NENT-staleness trap). Re-show → objects recreated.
- All/None round-trip ×3 → FLEETTICK/PULSE/ORBIT/WAVE lengths STABLE (the closure-duplication trap).
- Sub toggle → sub-hull count drops for that entity only; hidden entity shows NO sub-hulls
  regardless of its subs flag.
- Zones: boot `?war=1` (masters ON — otherwise the check is vacuously green), per-entity zDef off
  → that entity's fleet groups absent, others present; masters off → panel columns dimmed.
- Card open on a node whose entity then hides → card carries the "entity hidden" line.
- Wire styling: set color+style per kind → wire material color/dash changes, row sample + legend
  row match CONN, solid and sparse samples render truthfully.
- Presets: `__uniApplyVisPreset({ent:{...}, node:{x:1}, meta:{y:1}})` → unknown namespaces
  preserved through merge. URL-preset boot keeps the panel. 0 errors, 0 NaN throughout.

## Decisions taken (overrule any)

- Panel name **FLEET** — "Entities" if you prefer.
- Precedence global AND entity for every column; a global off is absolute, the panel refines.
- MVP hides (boolean); "dim" reserved inside `visN()` for the in-flight batch.
- Hidden-home shared pieces: silent drop ACCEPTED this batch, named in the panel help.
- Wire colors mutate CONN session-locally; legend derives from CONN (stops lying by construction).
- sim.data.js include ships in slice C even though the button stays stubbed — the seam must exist
  before the in-flight batch or that batch debugs a phantom.
