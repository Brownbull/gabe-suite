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
- **B3** `aa97f7a` (operator ask on seeing the panel) — **CLUSTER rows**: the entity name expands its CURRENT-coreBy clusters (caret + counter chip); cluster rows carry the same switch columns in a DISTINCT teal (never reads as entity state); `UNIVIS.sub` 4th namespace, `visN` AND-combines entity∧cluster; `__uniFleetRegroup` on core/functions changes drops stale overrides; sub-hull + transport seams are cluster-aware (node-level). Battery **140 static**.

Proof: `universe-build/verify-fleet.mjs` (two pages, one booted `?war=1`; hide/round-trips/subs/zones-mesh-scoping/routes-scoping/FLEETTICK-stability/card-note/preset-namespaces/functions-on NENT case/None-All). Battery **134 static**, all new checks mutation-proven.

**The in-flight batch (NEXT after the visual pass)** picks up: the preset derivation from GABE_SIM (touched/blast/context via `role` on UNIVIS — zones are NOT the role channel, fleets are metric-derived), the "dim" tri-state inside `visN()`, the zone↔lifecycle vocabulary (operator picks), and the FK-only-blast widening ruling — all recorded in the plan §C.

### NEXT — operator visual pass + tuning

The numbers pass; the LOOK is the operator's call. Live levers, all in `parts/layout.js`:
`KRADF` factors (ring radii per kind) · zForce gains (pull 0.08 / radial 0.08 / containment 0.3) ·
`SEP` 1.55 (anchor spread) · `tuneLinkForce` rests 40/280 · charge −60/cap 150 (in assemble.py) ·
`RENT` formula `30+9·√count` · sub-ring `SR=min(0.55·RENT, 26+7·groups)`.
Edit → `python3 assemble.py` → copy to shell → `python3 fill-example.py` → `node verify-clustering.mjs`.

### Deferred / open

- Push the 10 commits (operator word required; branch has no upstream — needs `-u origin graft-adoption`).
- Twin propagation (gustify/gastify) — read-only; do NOT write to them.
- Optional: lock the horizon upright in the orbit (currently a little roll is allowed to keep the pivot exact).
- Optional perf: fewer `cooldownTicks` on core/layout reheats (240 today; settle is fine on the 456-node case but untested beyond).
