# Gabe Universe — session handoff (next focus: CLUSTERING)

## Paste-able resume

> Continue the **Gabe Universe** 3D command-center station. All work is committed **LOCAL on
> branch `graft-adoption` (no upstream) — nothing is pushed; push only on my explicit word.**
> gustify/gastify are **read-only twins**; the suite repo **never** gets `.kdbp`. Respond in the
> Gabe register. This session's focus is **CLUSTERING** — see §"Next focus" below. Rebuild via the
> persisted pipeline (§Build), verify via headless chrome (§Verify), run `tests/gabe-universe/run.sh`.

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

### NEXT — operator visual pass + tuning

The numbers pass; the LOOK is the operator's call. Live levers, all in `parts/layout.js`:
`KRADF` factors (ring radii per kind) · zForce gains (pull 0.08 / radial 0.08 / containment 0.3) ·
`SEP` 1.55 (anchor spread) · `tuneLinkForce` rests 40/280 · charge −60/cap 150 (in assemble.py) ·
`RENT` formula `30+9·√count` · sub-ring `SR=min(0.55·RENT, 26+7·groups)`.
Edit → `python3 assemble.py` → copy to shell → `python3 fill-example.py` → `node verify-clustering.mjs`.

### Deferred / open

- Push the branch — 113 commits main..HEAD by batch 20 (operator word required; branch has no upstream — needs `-u origin graft-adoption`).
- Twin propagation (gustify/gastify) — read-only; do NOT write to them.
- Optional: lock the horizon upright in the orbit (currently a little roll is allowed to keep the pivot exact).
- Optional perf: fewer `cooldownTicks` on core/layout reheats (240 today; settle is fine on the 456-node case but untested beyond).
