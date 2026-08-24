# Gabe Universe — session handoff (SYNC VERIFICATION ✅ + FRONTEND EXPANSION ✅ 2026-08-23; next: operator visual pass · gastify propagation)

## Paste-able resume

> Continue the **Gabe Universe** 3D command-center station on branch `graft-adoption`
> (HEAD `e90128f` — batch 47, fleet clicks select; **156 commits main..HEAD, LOCAL, no
> upstream — push only on my explicit word**). gustify/gastify twins: gustify commits
> allowed on `graft-pilot` (push owed), gastify read-only; the suite repo **never** gets
> `.kdbp`. Respond in the Gabe register.
>
> READ FIRST: docs/design/codebase-graph-consolidation/HANDOFF-UNIVERSE.md (§Build ·
> §Verify · the batch ledger below), then docs/design/frontend-model/README.md for task 2.
>
> STATE: batches 9–47 all landed + green (battery `tests/gabe-universe` **287 static** +
> render PASS · `tests/arch-graph` **172**; proofs verify-{panels,ctrl,routes,fleet,
> explore,walk,clustering}.mjs ALL PASS). Emitter grew CONSUMES+NESTS (floating schemas
> 44→6) + endpoint→handler wires; example feeds rebuilt twin-read-only @ gustify
> `52a56d03` with `GABE_GRAFT_BUILD=0` (as-found graft index `1657206d`).
>
> TASK 1 (verbatim): "Verify that, with the current scripts and everything that we have
> in place, what we generate is in sync with what we already have, or whether we deviate
> from it, and see if there is a deviation and if we can fix them."
> Concretely: (a) `python3 assemble.py` must byte-reproduce the committed
> `templates/center/shell/gabe-universe.html` (then `fill-example.py` the example);
> (b) the twin-read-only regen (`GABE_GRAFT_BUILD=0 GABE_REPO_ROOT=/home/khujta/projects/
> apps/gustify GABE_CENTER_OUT=<scratch> python3 templates/center/generators/
> build_center_a3.py`) must reproduce the committed example feeds — NOTE: `c4-graph.js`
> was rehomed this session but **`levels.js` was NOT regenerated** (known deviation
> candidate); (c) `scripts/suite-doctor.sh` (≈2–4 min) must be CLEAN; (d) known drift to
> either fix or record: the TWINS' installed generator copies predate touches_x +
> consumes/nests + behind — twin propagation is OWED (gustify first).
>
> TASK 2 (verbatim): "We will start working on the frontend, so expand this diagram to
> also show the frontend parts, all the elements, relationships, and so on."
> The plan exists at docs/design/frontend-model/README.md (dependency-cruiser + ast-grep
> = Tier-1 "graft-for-frontend"; NOT built). The universe already reserves the seams:
> REL2KIND carries renders/mounts/reads/typed/imports; the catalog carries Component/
> Hook/Store/Route/Type specimen cards; the web arm is SCREENS-ONLY today (32 screens ·
> 48 bridged · 6 unmatched · 4 dynamic); the wire-palette ledger flagged the lab-only
> `fecall` (frontend-internal call) wire as the missing kind. Expansion = emit frontend
> pieces + their rels into GABE_C4 (new l2 kinds), adapter/KINDS already draw most.
>
> RUNBOOK: build = `cd docs/design/codebase-graph-consolidation/universe-build &&
> python3 assemble.py && cp gabe-universe.html ../../../../templates/center/shell/ &&
> python3 fill-example.py`; verify = `node verify-panels.mjs` (+ the sibling proofs) and
> `bash tests/gabe-universe/run.sh` FROM THE REPO ROOT (relative paths bite); emitter
> changes also run `bash tests/arch-graph/run.sh` + a twin-read-only regen.
> GOTCHAS: rt is a DETACHED workbench (bind at build via rt.querySelector, runtime
> lookups via document — three dead-control bugs came from this) · proofs that light
> hulls/gradients must Esc-reset baselines and exclude vertexColors materials from
> white-checks · the battery greps pin EXACT literals (className= not class=) · headless
> rAF starves (waits outside evaluate; mechanisms on setInterval).

## Where it is

- **Station**: [templates/center/shell/gabe-universe.html](../../../templates/center/shell/gabe-universe.html) — the 5C 3D graph (lifted from the graft-adoption spike), fed live by `window.GABE_C4` + `window.GABE_LEVELS`, with the element-components card. Rendered in every project's center (a new nav item, additive — the old "Levels graph" stays).
- **Example (renderable, real gustify data)**: [templates/center/shell/example/codebase-graph-station/gabe-universe.html](../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html) — loads `./c4-graph.js` + `./levels.js` + `../../assets/{3d-bundle,chip-assets}.js`. Open this in **google-chrome** (WebGL) to review.
- **Battery**: [tests/gabe-universe/run.sh](../../../tests/gabe-universe/run.sh) — 84 static + nav-consistency + optional headless render. `bash` it; must stay green.
- **Commits** (9, local on `graft-adoption`): `b0dc75c` station → `414d324` chrome (config/legend/web/nav) → `62939cd` entity-layout + 3 c4 cores → `822f6e4` levels cores → `abdf010` functions+guards+lines → `079c795` Planets|Universe tabs + orbit → `01953c3` planets tidy + perf → `7c5d5a2` static fleets + motion + freeze-on-drag → `ee19b5d` rigid orbit-around-click + transport speed. `git show <sha>` for each rationale.
- **Memory**: `gabe-universe-station.md` (full arc). Pre-existing, NOT ours: center battery baseline is 129/3 (a duplicate `id="cls:"` in the Levels page — red before this work).

## Build (reproducible pipeline)

The station is **assembled** from a copy of the spike + override parts, NOT hand-edited. Pipeline persisted at [docs/design/codebase-graph-consolidation/universe-build/](universe-build/):

```
cd docs/design/codebase-graph-consolidation/universe-build
python3 assemble.py                         # transforms spike-base.html + parts/* → gabe-universe.html (here)
```
- **`parts/adapter.js`** — GABE_C4 (l1/l2/cross_edges) → the spike's `{nodes,links}`; `ANIM` state; `ENT/EX/EY/EZ` entity maps.
- **`parts/layout.js`** — the layout engine: `recomputeEX` (chain/force/spread), `assignSub` (cluster cores), the mode-aware `zForce`, `__uniAddLayoutTab` (the Planets|Universe config), `__uniSetupOrbit` (rigid rotate-around-click), functions toggle.
- **`parts/card.js`** — the live det-reading card. **`parts/station.css`** — chrome + config CSS. **`parts/chrome.html`** — nav + topbar.
- **`assemble.py`** — line-splices the parts into `spike-base.html` + str.replace edits (documented inline). Re-running is idempotent; it byte-reproduces the landed station.

**To land after an edit**: copy `universe-build/gabe-universe.html` → `templates/center/shell/gabe-universe.html`; then rebuild the example (fill the SHARED tokens with gustify values + rehome `./assets/`→`../../assets/`, keep `./c4-graph.js`/`./levels.js`). See any prior commit's landing step; the fill dict is in the batteries' history.

## Verify (headless chrome)

`playwright-core` + `google-chrome-stable` live under `docs/design/graft-adoption/spike/_build/node_modules`. Pattern (see `universe-build/verify-latest.mjs`): launch chromium `--use-angle=swiftshader --no-sandbox`, goto the filled dev page, `waitForFunction('window.__spikeKindsReady===true')`, capture `pageerror`+console-error (must be **0**), then `page.evaluate` against the engine globals (`nodes`, `links`, `CFG`, `EX/EY/EZ`, `Graph`, `ANIM`). The dev harness needs `c4-graph.js` + `levels.js` + `assets/` beside the filled page (copy from the example/shell dirs).

---

## CLUSTERING — LANDED (batch 9, `985f9b0`)

The complaint (big mesh, core-by = decoration only) is fixed and proven headless:

- **Core drives position**: `SUBANCHOR[ent][sub]` ring (`recomputeSubAnchors` in `parts/layout.js`) + a sub-anchor term in `zForce`; `applyCfg('coreBy')` now re-anchors + `d3ReheatSimulation()`. Measured: a core flip moves **97.3%** of nodes.
- **Kind rings**: `KRADF` radial bias — endpoints/web at the entity EDGE, functions/models/schemas at the CORE; soft containment past `1.3×RENT[ent]`. Measured: endpoints meanR 129 vs internals 83 (**1.55× ring**); functions-on (456 nodes): fn 80 vs endpoint 148.
- **Separation — the measured root cause was NOT the anchors**: default link springs (rest≈30) dragged linked entities together, and the unbounded `-150` charge ballooned clusters to r≈180. Fix: `tuneLinkForce()` typed rests (intra 40 / cross 280, soft strengths) + charge `-60` range-capped 150 + anchor spread ×1.55 + camera `DEF={150,80,780}`. Measured: bleed **43.1% → 1.9%**.
- Proofs: `universe-build/verify-clustering.mjs` (committed, re-runnable) + a heavy-case run (456 nodes, usecase core, 343-node "other" bucket — 0 errors, 0 NaN). Battery grew to **93 static** (new 10j section, mutation-proven both ways).
- `fill-example.py` persisted — the example rebuild is now scripted (`assemble.py` → copy to shell → `fill-example.py`), no history spelunking.

## BATCH 10 — LANDED (`8ac9692`): settle-freeze · ROUTES tab · icon lines + curve amount · per-kind beam

- **Freeze through re-arrange**: entity-layout/core/functions changes pause all decorations; the settle resumes. Ownership hardened by an 11-agent adversarial review (6 confirmed → 3 deduped defects fixed): motionBtn during the window cancels the auto-resume, a mid-drag settle defers to pointerup, URL-preset boots re-tab the config (all 3 `buildCfg` sites).
- **Routes tab**: LINES (straight/curved ICONS + curve-amount slider ×0.2–2.5) · per-kind BEAM (fk/bridge/calls/imports, 0 hides · >1 glows additive, sample-wire legends) · Transports toggle + speed.
- Proof committed: `universe-build/verify-routes.mjs` (tab · freeze interleaves · drag-held · curve geometry · beam · preset boot, 0 errors). Battery **108 static**, all new checks mutation-proven.

## BATCH 11 — LANDED (4 slices, `5a31d33`→`0c9f88d`): wire styling + the FLEET panel

Executed per [PLAN-BATCH11-FLEET.md](PLAN-BATCH11-FLEET.md) (v2, plan-verified) on the operator's "land it":
- **A** `5a31d33` — per-kind wire COLOR + SHAPE (solid/dashed/dotted/sparse) on the Routes tab; state IS `CONN`; ONE DASHMAP renders row samples AND the legend (Connectors rows now DERIVE from CONN — the frozen literals are gone).
- **B1** `b57d95c` — the **FLEET panel** (top-left, minimizable/draggable): per-entity show/subs; the `UNIVIS{ent,node,meta}` contract + `visEnt/visN` accessors + `__uniApplyVisPreset` (node/meta reserved for the in-flight batch — GABE_SIM piece ids == universe node ids); six engine seams NIDS-resolved; show routing runs `rebuildNodes` (registry reset) + `buildTransports` (no ghost shuttles); card carries an honest note for a hidden selection.
- **B2** `5594b6b` — zones (def/atk/cfl/sat) + routes columns, gates = global AND entity; masters-dim (zonesoff pattern) incl. the URL-preset rebuild path.
- **C** `0c9f88d` — `sim.data.js` loaded by the page (the in-flight seam EXISTS now); presets All/None live via the preset entry point; In-flight DISABLED stub with three honest states (undefined / null / object).
- **B4** `1245a7d` (operator fixes) — the ALL master row propagates into cluster overrides + cluster switches dim when their entity is off (inherited-off); the three Universe-tab note lines replaced by HOVER explainers (section label + per-option titles, Functions keeps the live count). Battery **145 static**.
- **B3** `aa97f7a` (operator ask on seeing the panel) — **CLUSTER rows**: the entity name expands its CURRENT-coreBy clusters (caret + counter chip); cluster rows carry the same switch columns in a DISTINCT teal (never reads as entity state); `UNIVIS.sub` 4th namespace, `visN` AND-combines entity∧cluster; `__uniFleetRegroup` on core/functions changes drops stale overrides; sub-hull + transport seams are cluster-aware (node-level). Battery **140 static**.

Proof: `universe-build/verify-fleet.mjs` (two pages, one booted `?war=1`; hide/round-trips/subs/zones-mesh-scoping/routes-scoping/FLEETTICK-stability/card-note/preset-namespaces/functions-on NENT case/None-All). Battery **134 static**, all new checks mutation-proven.

**The in-flight batch (NEXT after the visual pass)** picks up: the preset derivation from GABE_SIM (touched/blast/context via `role` on UNIVIS — zones are NOT the role channel, fleets are metric-derived), the "dim" tri-state inside `visN()`, the zone↔lifecycle vocabulary (operator picks), and the FK-only-blast widening ruling — all recorded in the plan §C.

## BATCH 12 — LANDED (`37062d5`): rulings settled · layer (c) · depth highlight · journeys · icon topbar · chord pan

**Rulings recorded in [PLAN-BATCH11-FLEET.md](PLAN-BATCH11-FLEET.md) §C**: R1=(b) hull tint + stage beacon · R2=DROPPED (fleet-panel hiding IS the context mechanism) · R3=(b) client-side trust-tinted blast widen · Layers=(c) LANDED (the SUBOF collapse retired — layer core groups by the kind's OWN layer: endpoints·api·web·data, auto-grows; (d) frontend-model enrichment HELD on the enforcement trigger).

- **Depth highlight**: select → BFS N hops (1–5); GLOW (halos + dimmed outside wires) or FOCUS (outside hidden, hulls stay); Alt+scroll / click-cycle / Esc; per-wire `hf` factor through `connectorWire`; `_nodeVisibleFn` = fleet ∧ focus (the one visibility truth).
- **Journeys picker**: topbar button → 135 cross-entity tests (dedup by cid from det.test_journeys); picking one feeds the same highlight machinery (carriers = origin).
- **Icon topbar**: depth badge · style · journeys · freeze · reset (rich hover titles), repo pills FAR right.
- **Chord pan**: left-drag orbits; +right button pans the rig (quaternion frozen), release right → orbit resumes around the same point.
- Proof `universe-build/verify-explore.mjs`; battery **158 static**.

## BATCH 13 — LANDED (`cd63623`): the WALK · named+grouped journeys · clusters-only view · decoupled panel

Nine visual-pass asks: journeys picker LEFT + grouped (END-TO-END first — emitter caps web/e2e into "N case(s)" AGGREGATE rows, labeled honestly; then by start entity) + NAMED for free (det.cases carries the test name in the same cid space, 114/135); journey BANNER top-center; **the WALK** ported from the 2D graph (panel-top bar: journey ‹i/N› stepping with camera-aim + card-open + path-stays-lit · 7-step element TRAIL chips · a click during a journey starts a fresh trail); panel chevron → FOOTER (both copies); fleet header ELEMENTS/WIRES global toggles (elements-off = the clusters-only view: 0 nodes/27 hulls; showWires gates connectors AND plain links); `#g right:0` — the panel overlays, canvas width stable across open/close; chip-hover WHITE halo; gear↔config sync (un-minimize on show). Proof `universe-build/verify-walk.mjs`; battery **169 static**.

## BATCH 14 — LANDED (`66c2266`): journey HUD in the topbar middle · chord fixed for real mice

Journey command center = topbar MIDDLE ([journeys][style] · name · ‹i/N› · step · ✕; picker opens centered; panel keeps only the TRAIL; banner retired). Fleet gains the labeled VIEW row (planets · wires). Rail chevron parity (collapsed ‹ at the BOTTOM like the expanded footer ›). CHORD: chorded presses fire NO pointerdown (spec) → a left press joining a right-pan now starts the rig drag from the move stream; the chord does BOTH (orbit + half-strength rig drift); right-release keeps the drag. Proofs verify-walk + verify-explore; battery **175 static**.

## BATCH 15 — LANDED (`2072219`): highlight fixed FOR THE EYE · planets/wires matrix · step pill · depth bar

Operator's diagnostic protocol ran first (real-UI journey select → screenshots): counters said working, the SCREEN said noise. Fixes: contrast floors (dim 0.05 · lit 2.6 · halos 64/36) · transports fly the LIT path only · journey select FRAMES the carrier set (`_frameSet`, camera 910 > radius 325) · stepping aims ≥260. Re-shot: unmistakable in both styles. UI: PLANETS+WIRES are fleet MATRIX columns (entity AND cluster, masters; hull stays on planets-off; wires scope exactly; CFG.showElems/showWires retired) · the journey stepper is a WIDE PILL over the diagram (‹ edge · i/N · NAME · edge ›; ✕ in its own pill; topbar HUD gone) · card body scrolls inside the panel (footer chevron always on screen) · depth = draggable 1–5 bar + ArrowUp/Down (Alt+scroll stays). Battery **180 static**.

## BATCH 16 — LANDED (`736a269`): stepper centered in the header · Lucide buttons · WASD flight

Journey stepper back IN the header bar, centered ([‹][i/N · name][›][✕], real Lucide chevron/x buttons in 32px squares — the text glyphs sat skewed). FLIGHT: hold W/A/S/D + Space (up) + Ctrl (down) — the whole rig flies, speed scales with zoom, keys clear on blur. Engineering: the fly tick is **setInterval(16), not rAF** — this headless profile starves free-running rAF chains (measured 1 tick/400ms); anything proof-critical must not depend on free-running rAF. Battery **182 static**.

## ALLERGEN REDUCTION — EXECUTED (option B): gustify `52a56d03` + suite `8b49c6c`

The "endpoints piling on allergen" root cause: allergen's gustify config claimed FOUR whole router files → 32 co-homed endpoint clones; the adapter's alphabetical first-home dedup made allergen swallow all of them on screen. Fixed at the MODEL (the deferred half of the 2026-08-14 entity-shape ruling): dropped the router claims — allergen = the honest aspect (6 models + 7 schemas, 0 endpoints), all 67 endpoints single-homed under their domains, **S9 aspect finding CLEARED** (17 domains · 0 unclaimed), gustify chrome harness 524/0. Example feeds rebuilt via the twin-READ-ONLY lab run (`GABE_REPO_ROOT=<twin> GABE_CENTER_OUT=<scratch> python3 templates/center/generators/build_center_a3.py` — THE recipe, twin verified untouched). Proof updates measured-not-loosened: per-entity ring metric (1.76/7 ents), anchor floor 180, journeys pin self-consistent (visible floor 90). Gustify push still owed (operator word).

## BATCH 17 — LANDED (`0cc790b`): community default · rebuild-proof halos · bright glow · ring layout · cross-entity touches

Community = the default core (levels-fed pages). GLOW brightens the set and leaves the field ALONE (dim/removal = focus only). Halos live in an INDEPENDENT scene group ticked from `_npos` — the live-browser vanish class is dead. RING replaces spread (coupling-ordered circle, measured flat/even); force SEP 1.85, chain 1100, sub-rings RENT×0.78. **Cross-entity `touches` edges exist now**: `_a3_code` keeps the unowned residue (`touches_x`), `_a3_graph` resolves it globally → `cross_edges` kind `touches` (11 on gustify; stats.cross_touches; arch-graph battery case added) — found because the allergen reduction orphaned the aspect's models. Disconnected census answered: 64/260 honest strays (44 never-returned schemas the 2D pruned · 9 untouching endpoints · 5 unmatched fetches · 6 service-coupled models — a future model↔service edge kind is the recorded option). Batteries 189 + 167. NOTE: gustify's own generator copy predates `touches_x` — twin propagation still owed.

## BATCH 18 — LANDED (`273a0bc`): focus behaviors · controls panel · Q/E yaw · invert mouse · middle-orbits-selection

FOCUS group in Routes: Dim 25% (the missing mode) · Fade 8% · Wires (outside wires gone, planets stay) · Hide (current); only Hide removes planets. CONTROLS panel bottom-right (kbd cheat-sheet, minimizable, tracks the card rail): Q/E turn-in-place (yaw about world-up at the camera), invert-mouse toggle (drag button + OrbitControls map swap, chord follows), middle-drag orbits the SELECTED planet (constant node distance; no selection → dolly as stock). Drag ownership generalized: only the starting button ends a drag. Proof `verify-ctrl.mjs`; battery **195 static**.

## BATCH 19 — LANDED (`884c188`): flight-style invert · zoom-depth orbits · inward Q/E · controls freeze

Corrections from the hands-on pass: INVERT = the AXIS (aviation convention — flips only the drag's vertical rotation sign, +178→−154; buttons never swap, `__uniApplyMouseMap` deleted). THE GIANT-SPHERE ORBIT: drag pivot at the CURRENT zoom depth (`_zoomDist` = nearest visible content in a ~24° cone, capped by dolly; the dolly target snaps on-axis to that depth so scroll agrees) — same drag sweeps 190 far → 60 near. Q/E orbit INWARD around the view centre at that depth (keyboard twin of the drag; bug: `_zoomDist` was closure-scoped → the fly tick threw silently — hoisted). EVERY camera control freezes decorations (fly keys freeze/thaw on hold; wheel freezes, thaws 350ms after idle; drags already did). Proof `verify-ctrl.mjs` rewritten; battery **199 static**.

## BATCH 20 — LANDED (`2dc1de1`): camera-mode dropdown — tumble · joystick (WoW) · arcball · look

Left-drag now picks its scheme from a Controls-panel dropdown (`UNICTL.camMode`, default **tumble** = the stock delta orbit, untouched). **Joystick** is the operator's WoW ask: the click records an ANCHOR (`drag.ax/ay`); the cursor's offset from it becomes an angular VELOCITY (direction = which way, radius = how fast, 8px deadzone) applied by a dedicated 16ms tick — hold still and it KEEPS turning (0.472→1.008 rad measured), release dead-stops (0). **Arcball** = virtual trackball (great-circle between cursor points, camera-space axis lifted to world, rotated about the drag pivot). **Look** = first-person, yaw/pitch about the CAMERA itself (turn 0.365 with position delta <1). Middle-orbit always tumbles; chord-pan works in every scheme. Grounded in the standard taxonomy (three.js Orbit/Arcball/FirstPerson + dual-stick velocity semantics). Proof: verify-ctrl §6; battery **210 static**, joystick-tick pin mutation-proven.

## BATCH 21+21b — LANDED (`e3f7429` + `7863d9a`): the mouse remap + chord hardening

Operator ruling after trying the schemes: LEFT = LOOK (vertical inverted by default — pure sign flip, ctlInv restores) · RIGHT = TUMBLE (absorbs orbit-the-selection when toggled + selected; zoom-depth pivot otherwise) · MIDDLE = PAN (the old right-button drag, full strength). Chord-pan + late-join removed. A 3-lens adversarial verify caught two MAJORS, both fixed in 21b: the STRANDED DRAG (chorded owner-first release swallowed the gesture's only pointerup → camera glued, zoom dead, anim frozen — fix: one shared `_endDrag`, pointerup ends on `ev.buttons===0`, the move stream releases on owner-bit loss) and the RED PROOF (verify-explore [6] proved the removed late-join — rewritten as the stranded-drag proof). Battery **211 static**.

## BATCH 22 — LANDED (`b19a227`): the PANEL HIERARCHY — Everything → Entity → Cluster → Element

The right panel exists at EVERY level: EVERYTHING (boot default + the Esc target — field makeup · Stars = functions not drawn · feed stats · entity rows) → ENTITY (makeup · per-entity Stars · cross-entity counts · Inside = clusters under the CURRENT core · Above) → CLUSTER (members, click = select in graph) → ELEMENT (the card + a new Above section, all kinds wrapped once). Esc clears + lands on Everything. Background clicks pick the hull under the cursor via ray-vs-member-cloud (`__uniBgClick`; hull meshes are raycast-dead by design; sub beats ent, smaller beats bigger; CLUSTERS carry `ekey`/`skey`). Boot call deferred one tick (the card IIFE defines the builders later — the guard skipped silently). Proof `verify-panels.mjs`; battery **221 static**.

## BATCHES 23–25 — LANDED (`b8b401b`→`7e0d87a`): the panel-tuning arc (operator passes)

**23 (`b8b401b`) Everything tuned**: Entities LEAD (rule: navigable sections top every panel) · Field→ELEMENTS (kind glyphs + KINDTIP hover meanings) · Stars behind a clickable wall (8 preview → +30 pages → show less; chip hover = source file, the center-docs wiring seam) · Feeds→SOURCES with per-row tip badges + the [object Object] fix (stats.web.unmatched is an ARRAY → count + real chips). **23b (`3a751fe`)**: info icons show ONLY the styled dark tip (native title dropped everywhere — the double-tooltip photo). **23c (`376c151`)**: edge-aware tips (_tipPlace: slide off the right edge, clamp left, flip above near the bottom). **24 (`191b56c`)**: direction markers (corner-down = drill, corner-up = Above) on every nav row + the SEVEN core-strategy icons (layer stack · kind shapes · tests check · guards shield · usecase flag · community triad · fk key) in ONE map (`__uniCoreIco`) — config CORE BY pills carry them, cluster surfaces inherit the ACTIVE core's icon live. **25 (`7e0d87a`)**: HULL SELECTION LIGHT — element display brightens its cluster ×3 + entity ×2.2, entity/cluster panels light their level, Esc restores; `__uniApplyHullSel` (lazy `__baseOp` stock capture, buildClusters wrapped, showPanel hook). Catalog synced through 24. Battery **234 static**; proof `verify-panels.mjs` covers the whole arc.

## BATCHES 26–30 — LANDED (`b773c16`→`6b9bd0f`): the FLEET becomes the configuration home

**26 (`b773c16`)**: the fleet MIRRORS the selection — entity row spotted, cluster selection auto-opens its entity + spots both, Esc clears; driven from the hull engine (`__uniApplyHullSel` tail → `__uniFleetSpot`; rows carry `data-fle`/`data-fls`). **27 (`db5c61c`)**: number keys 1–8 toggle fleet columns for the SELECTION (cluster → that cluster · entity → that entity · nothing → the ALL row); ONE path (`__uniFleetToggle`) for clicks + keys; header cells wear their key number; spot = full-row accent background. **28 (`3eadeff`)**: presets (All/None/In-flight) moved into the fleet HEADER as icon buttons; first column icon = the entity cube; rows read [dot][count][name] (entity) · [count][name] (cluster), carets gone; verify-fleet's stale 6-per-row divisor → distinct-key count. **29 (`c333d6a`)**: planets config migrated (transparency + Zones master); the four per-zone buttons DEPRECATED (gates forced ON — fleet columns are the only zone control). **30 (`6b9bd0f`)**: the FREE-STANDING SIDE DRAWER (body-level, docks at the fleet's right edge via `__uniFlDock`, slides from BEHIND, ‹/× slide it back; own 250px×72vh box — the fleet never stretches) with per-column panes: ENTITY (layout·show·radius·transparency·container·stars·functions) · CLUSTERS (core·show·transparency + SHARED radius/container) · PLANETS; container icons-only; config = Routes-only; column order Entity·Sub-cluster·Planets·Connections·zones·transports (number keys follow); groups live in `#flstash` between opens (listeners + hover titles survive). Battery **246 static**.

## BATCHES 31–45 — LANDED (`bec1f8e`→`4a625cb`): connections/transports panes · compaction · wire UX · panels-config · the floating-schema fix

**31** Connections+Transports panes, config TABLESS. **32** drawer compaction (icon pills · opacity dots · one × · speed steppers) + TWO dead-slider fixes (rt is DETACHED — bind via rt.querySelector, runtime lookups via document). **33** transport speed LADDER (7 stops ×√2, default 0.1 at pos 0, numbered-dot thumb). **34** one-row wire kinds + per-kind on/off (beam-0 mechanism) + the honest ✦ glow label. **35** ENTITY GRADIENT per kind (vertex colors; ea/eb threaded; sample blends; reset restores). **36** ⧉ copy-settings (Connections only, __uniLastCopy). **37** operator wire defaults + imports-empty EXPLAINED (0 piece-level imports edges at rest — fn-node rels) + focus BITES (auto-switch to focus) + CLICKABLE WIRES (_raySegDist — w=origin−A! — → showLinkPanel; catalog Connection card). **38** focus=DIM/HIDE icons · selected wire glows ×2.6 + BFS from both endpoints · Alt+Q/E depth (wheel retired; fly alt-guarded). **39** link-card chips hover-halo (_lchip) + the [7] wire-clear probe. **40** F toggles glow⇄focus · FOCUS keeps origin halos · hover lights the wire pair. **41/41b** theme toggle (sun/moon topbar, light var roster, 23 surfaces de-hardcoded, scene bg swap) + WHITE=HOVER-ONLY accent (hov arg; lit/selected keep kind colors; gradient mats are white-by-design — probes exclude vertexColors). **42** entity pane rebuilt (combo row layout·transparency·container / options row boundary·stars·ƒ-toggle OFF) + SPREAD slider (scales RENT — the real separation lever; radius only pads hulls). **43** connector rev 2 (calls glow 0.5) · spread at 20% (0.55–2.8) · radius+spread one row · LEGEND panel-chrome refit. **44/b/c** legend Types 2-col · ONE fixed 330px size every tab · minimize specificity fix. **45** CONSUMES+NESTS: signatures wire ~nothing (0/44 named — they're NESTED components); schema-COMPOSITION (field types) is the real fix → 70 new wires, floating 44→6 (the 6 = unmapped-endpoint shapes); REL2KIND consumes→calls/nests→fk; arch-graph battery 172. Battery **283 static**; example feeds rebuilt twin-read-only @ gustify 52a56d03.

## BATCHES 46–47 — LANDED (`1910360` · `e90128f`): handler wires + fleet selection

**46**: endpoint→HANDLER wires when Functions is ON (adapter keeps `p.fn`; `_buildFnData` joins `det.file#fn` to the fn pool — 67 wires on gustify; the zero-edge DELETE …/cupo case answered: its data work lives in service fns + its fetch is one of the 4 DYNAMIC templates) + the honest empty-Connections message (call-tree pointer · dynamic-fetch hint). **47**: fleet clicks SELECT — entity/cluster NAME = panel + hull light + camera framing (`_frameSet`); the count badge owns expand/collapse (stopPropagation).

## SYNC PASS — CLOSED 2026-08-23 (`ba025ba` + `9c66a59`)

(a) assemble + fill-example BYTE-IDENTICAL. (b) twin-read-only regen: c4-graph.js SAME;
levels.js/levels.json were stale (batch 17 / pre-17; batch-45 CONSUMES adds 7 levels
cross_edges) — rehomed; a feed regen must touch ALL THREE. (c) doctor: tests/center's 129/3
was a FALSE POSITIVE (`check_center_links.py` ID_RX matched JS literals `var id="cls:"` /
`rid=` / `cid=`) — left-bounded regex + `<script>` stripped from the dup check, silent case
added, mutation-proven → 133/0, doctor CLEAN. (d) 4 of 7 proofs were stale vs batches 31–47
(fleet `.cfgtab`/`.flx`/material-color/frozen-stock · walk+explore absolute 0.4 rest floor ·
routes curved-boot/material-color) — repaired measured-not-loosened (rest floors RELATIVE to
the measured resting min; fk by userData.kind; stock = CONN0). Install drift: 6 files + a
stray `_artshot2.mjs` — `./install.sh` + delete; `FIXED` closer backported from gustify.
**Twin propagation EXECUTED: gustify `6338db7b` (generators + shell + stations + regen,
chrome 524→565/0) — PUSH OWED. gastify read-only: same pure-lag drift recorded, owed.**

## BATCH 48 — LANDED (`d06d578`): the FRONTEND ARM — compiler-proven pieces + typed wires

TASK 2 executed per docs/design/frontend-model/README.md — **§9 is the record** (P0 numbers,
the three plan corrections, what landed, deferred). Headlines:

- **P0 measured** (gustify, read-only): compiler = 488 files · 2,401 resolved import sites ·
  2,822 exports; graft covers 38.9% of import pairs; graft's convention arm over-claims
  (637 vs 458 JSX-proven components). → the EXTRACTOR IS the twin's own `typescript`
  (`_a3_fe_extract.mjs`; ast-grep/dependency-cruiser NOT adopted); 8th kind `module`
  (111 files); 113 stories excluded+counted.
- **`_a3_fe.py`**: per-export classification · homing (entity / buckets / candidates) ·
  wires through checker bindings (renders 935 · uses-hook 436 · uses-store 28 · typed 1,124 ·
  fecall 815 · imports 228, compact index triples) · SCREEN ABSORPTION (32/32, bridge kept) ·
  honest-empty. `fold_fe` → a SEPARATE `fe` key in GABE_C4 (fe=None byte-identical — pinned).
  Feed 327→747 KB. Twin-read-only regen re-verified byte-identical post-commit.
- **The universe fold**: 13 clusters (8 entities + design-system/app-shell buckets +
  profile/shopping/me candidates), `module` slab kind, **Types held at boot** (613, T toggle
  beside ƒ — 888 planets at rest, 1,501 with types), frontend card builder, Sources row.
- **Layout at scale**: the fold measured **48.5% bleed** → frontend KRADF layers + containment
  0.6 + `__uniRelaxHulls` (anchors ≥ 1.05·max(Ra+Rb, 2·max(Ra,Rb)), R=1.6×RENT measured) +
  proportional ring arcs (floor 260) + ring gain 0.16 → **bleed 0.3–2.6%, ratio 1.39**.
- **Flight at scale**: fly/yaw tick elapsed-time-scaled (cap 320 ms) + an IMMEDIATE first
  step on keydown (headless fired the 16 ms interval once per 400 ms; a real browser k=1).
- Batteries: **tests/frontend NEW 45** (frozen fixture hermetic + LIVE compiler case,
  mutation-proven) · universe **300 static** + fe-aware render · all neighbours green.
  Proofs: **7/7 ALL PASS on the final artifact** — fleet included (detached run past the
  600 s harness cap; it needs ~10+ min on the 888-planet field headless).
- Propagated: gustify `51a0da4d` (regen 59 s · chrome 565/0 · the PRESENCE-FLIP tripwire
  announced the arm by design). PUSH OWED with `6338db7b`.

## BATCH 49 — the JOURNEY FRONTEND LEG + the header SEARCH (adversarially reviewed)

Operator ask: "journeys that now can include front end, working with what we already have on the
codebase map, also let's add a search bar in the header."

- **Journey fe leg** (`_jrnFeLeg`, client-side, NO emitter change): a journey's carrier endpoints
  reach back over `bridge` wires to their fetching pieces (screens) and one hop up the
  `uses`/`renders`/`fecall`/`reads` sources (the components/callers driving them). The walk steps
  UI → API → data (users → screens → carriers); the pill + 45 picker rows wear a component-glyph
  chip with the count (row = the map's potential reach; pill = the pieces ACTUALLY walking, with
  "(N more fleet-hidden)" when they differ). Fleet-hidden pieces never enter the walk (`visN`).
- **EXACT-set journeys**: the old depth-BFS, harmless on sparse backend carriers, lit **2,824**
  wires from the dense fe cluster (screen = noise, the batch-15 lesson) → journeys light exactly
  their path (4 movers measured); widening depth (Alt+Q/E, the bar) is the explicit opt-in to the
  BFS neighborhood (`HL.exact`).
- **Header search** (`#tsrch`, `/` focuses · ↑↓ · Enter · Esc): live elements, HELD types and HELD
  functions (each row turns its toggle ON before selecting — the T and ƒ twins), entities,
  clusters (current core), journeys (searchable by name/cid, firing one starts the walk). Entries
  rebuild per keystroke from the live field — nothing cached to go stale.
- **Adversarial review** (4 lenses → per-finding refutation, 20 agents): 15 confirmed findings,
  deduped to 7 defects, ALL FIXED: the #jrn z-index trap (the picker painted OVER the dropdown and
  stole clicks → exclusive surfaces), held functions unfindable with ƒ off, innerHTML injection
  (labels are code identifiers — `_esc` at the seam), the fe-leg fleet-visibility no-op filter +
  its lying comment + the unfiltered pill count, Tab-blur leaving the dropdown open, fragmented
  group headers, the on-row chip contrast.
- Proofs: `verify-search.mjs` (NEW — search · fe leg · exact set · all 7 fix probes) ALL PASS;
  battery **319 static** + fe-aware render. GOTCHA: `.topbar` (z-29, position:fixed) is a STACKING
  CONTEXT — any topbar child's z-index only ranks against topbar children; document-level surfaces
  (#jrn z-55) beat them regardless. Keep topbar popovers exclusive with document-level panels.

## BATCH 50 — fe· identifier · FE clustering · the scaffold cut · controls trim (operator asks ×4)

- **fe· identifier**: frontend-only homes (design-system · app-shell · profile · shopping · me) wear a
  `fe · ` DISPLAY prefix on all five name surfaces — fleet rows, Everything rows, entity panel head,
  search rows, the 3D hull label. The raw slug stays the KEY everywhere. Search scores best-of
  display/raw so "design…" keeps its prefix rank. **The prefix exposed a pre-existing sprite bug**
  (the operator's screenshot): labelSprite drew onto a fixed 256px canvas (long labels clipped BOTH
  ends — "fe · design-system" → "· design-syst") AND updateClusters re-squeezed every label to a fixed
  50×12.5 each tick. Both fixed: text-fitted canvas + aspect-true rescale; short labels byte-identical.
- **FE clustering** (`_feAssignSub`): coreBy=usecase seeds screens from their bridged endpoints' groups
  and propagates 3 rounds over intra-entity fe wires (cooking: sessions 132 · recipes 30 · honest
  other); coreBy=community runs deterministic async label propagation (sorted order, strict-improvement,
  10 rounds), communities named `c·<hub>` with a PER-ENTITY dedupe (`·2` — two gustify hubs share the
  label profileModel; an undisambiguated name FUSED distinct communities downstream). Community
  5/5/7/3 distinct clusters where every non-Kind core previously produced ONE.
- **The scaffold cut** (`_a3_fe.py`, MEASURED first): /spikes/ (122 pieces) + /showcase/ (4) had ZERO
  app in-edges → excluded + counted (23 files · 167 exports incl. stray *Spike exports); fixtures +
  lib/mockupAssets are APP-WIRED (8 + 90 edges — CookingScreen runs on fixture data) and STAY — the
  honest answer to "are mockups involved in the app": spikes no, fixtures/mockupAssets yes. Refs into
  cut scaffold (file- OR export-level) count under `unresolved.scaffold`, never rewire. The fix pass
  also killed **195 fabricated edges**: the module-scope pass re-attributed every export's refs to the
  file's PRINCIPAL piece (the extractor's file_refs is a whole-file superset — now claimed-ref-skipped).
  Feed: 1,148 pieces · 3,188 wires · 797 at rest.
- **Controls panel**: the overflowing row split + rows wrap inside the border; LMB FIXED to Look
  (dropdown retired); invert-vertical + orbit-selection toggle rows retired (their behaviors stay the
  engine defaults; every scheme kept engine-side for the proofs, driven via UNICTL).
- **Layout at the slimmer field**: the cut tightened hulls and flattened the kind rings (ratio 1.14) —
  the inner core is physically unpackable under the fixed −60 charge, so the RATIO lives in the outer
  shell: ring gain 0.30 · endpoints 1.45 · model/schema 0.4 · containment boundary 1.6 (ABOVE the
  outermost ring — below it the two forces fight and the shell never forms). Settled ratio **1.51**,
  bleed 0%; the clustering proof's settle window widened to the measured 9 s.
- **Adversarial review** (3 lenses, 16 agents): 9 confirmed → 4 distinct, ALL FIXED: the half-migrated
  (dead) ctrl proof — it still CLICKED the retired toggles; community-name fusion; the silent
  *Spike-export ref rewire; the search prefix demotion. GOTCHA for proof authors: a proof that drives
  retired UI dies silently outside the battery — migrate PROBES with the UI, not just assertions.

## BATCH 51 — card-chip TRAIL navigation · legend hide-by-kind · fe/backend legend groups

Operator asks ×3 (screenshot session): (1) the card's connection chips are NAVIGATION now — click
"GET /shopping" / "ShoppingDashboardResponse" → `__uniGoto` selects + frames the target (a HELD
type/function wakes its T/ƒ toggle first, the search rows' behavior shared) and the existing 7-step
TRAIL accumulates (walkbar chips = back/forward, the archive-lab pattern). (2) the legend Types rows
are hide-by-kind CONTROLS: click → that kind vanishes GRAPH-WIDE (one gate at the top of `visN`,
`__uniKindOff`, applied through the fleet's own `_applyVisNow` path — meshes, hulls, wires, shuttles),
the row dims + strikes; click again restores. (3) the Types tab is grouped `frontend` / `backend`
(`.lghd2` headers span the grid; labels sit closer to their icons). Proofs: verify-panels [batch 51]
block (chip→trail · hide/restore 349 components · groups) + battery 330 static.

## BATCH 52 — the C SPLIT LANDED + the WIRE VIEW R-lab (operator: "implement C right away")

- **The split is DATA now**: `_fe_home` homes every backend-matched feature to `fe·<entity>`
  (`_fe_pair` maps it back); homes carry kind `fe` + `pair`. gustify: six paired fe entities
  (fe·cooking 480 · fe·pantry 208 · fe·auth · fe·settings · fe·legal-consent · fe·recipe),
  buckets + candidates unchanged. The universe TINTS each fe entity from its twin's colour and
  SEATS it adjacent (force pair-spring + ring adjacency); cards say "fe · pantry (frontend of
  pantry)". The levels lab folds fe·X into its PAIR's frontend band (review [0]: fold-by-slug
  matched nothing and mislabeled paired estates as "no backend entity").
- **WIRE VIEW** (config, top-right): R1 structure-at-rest (2,373 → 332 wires) · R2 utility
  demotion (fan-in≥15 fecall sinks) · R3 cluster-pair bundles (brightness = count) · R4 tree
  containment (sole children spring tight) — independent toggles on the live graph; hidden
  wires keep their springs. **The light-on-demand contract** (review [5]): a journey/selection
  DRAWS R-hidden wires; unlit hidden wires are unpickable ([1]) and never flown ([4]); the
  camera fits the live field on boot + reset ([6]).
- Review: 3 lenses · 16 agents · 7 confirmed → 6 distinct, ALL FIXED (one refuter died on an
  API-side flag; its subject — the levels fold — was independently confirmed as [0]).
- **Navigation findings for batch 53** (measured): cross-hull wires EXIST (48 bridge · 410
  renders · 316 uses cross) but read invisible at overview distance; max wire clearance
  anywhere is 1.1 world units, so hull-clicking is effectively dead on the split field —
  both point at S1 capsules.

## PENDING OPERATOR DECISION — fe DENSITY: the S options (batch 53)

fe·cooking draws ~255 labeled planets in one hull — a label cloud; no wire policy fixes a
COUNT problem. Options explored (2026-08-23): **S1 collapsed capsules** (big fe entities boot
with sub-clusters as single compound planets + R3 bundles as their wires; click/fleet-row
expands — view-only, RECOMMENDED) · S2 emitter `area` element (the data-level promote-later)
· S3 panel sections (subsumed by S1) · S4 screens-first rest state (a later MODE). The
operator holds the pick.

## RESOLVED — frontend/backend entity SPLIT (analysis delivered, no changes)

Measured: pantry = 78 backend + 208 fe (73% fe) · cooking = 46 + 480 (91%) — the batch-48 fold of
`features/<x>` into the backend entity is the density complaint. The fe wires are 348/1,019 INTRA;
the only real seam is the bridge (6/11 fetching screens). Options: A = adapter-side split
(`fe · pantry` sibling cluster, feed untouched, reversible toggle) · B = sub-band inside the hull
(rejected: keeps the density) · C = emitter split (`_fe_home` emits fe·<feat> — the end state, re-keys
every reader). RECOMMENDED: A now default-ON, promote to C after the split survives operator use
(trigger: the bridge-majority pairing rule never mis-homes a feature across a few sessions). Entity
establishment mirrors cc-init: feature dirs = the candidate list, the bridge = the confirming lens.

### NEXT — operator visual pass + tuning

The numbers pass; the LOOK is the operator's call. Live levers, all in `parts/layout.js`:
`KRADF` factors (ring radii per kind) · zForce gains (pull 0.08 / radial 0.08 / containment 0.3) ·
`SEP` 1.55 (anchor spread) · `tuneLinkForce` rests 40/280 · charge −60/cap 150 (in assemble.py) ·
`RENT` formula `30+9·√count` · sub-ring `SR=min(0.55·RENT, 26+7·groups)`.
Edit → `python3 assemble.py` → copy to shell → `python3 fill-example.py` → `node verify-clustering.mjs`.

### Deferred / open

- Push the branch — 161 commits main..HEAD by batch 48 (operator word required; branch has no upstream — needs `-u origin graft-adoption`); gustify `graft-pilot` push owed too (`6338db7b` + `51a0da4d`).
- gastify propagation (read-only until allowed): same recipe as gustify — generators + shell + `refresh_center.sh regen`; its web (`web/`, typescript 5.9.3) is fe-arm ready.
- Batch-48 deferred (frontend-model §9): fecall/renders as OWN wire kinds · route→component from the router CONFIG · prop schemas / P4 · the levels lab still reads graft's convention arm.
- Twin propagation (gustify/gastify) — read-only; do NOT write to them.
- Optional: lock the horizon upright in the orbit (currently a little roll is allowed to keep the pivot exact).
- Optional perf: fewer `cooldownTicks` on core/layout reheats (240 today; settle is fine on the 456-node case but untested beyond).
