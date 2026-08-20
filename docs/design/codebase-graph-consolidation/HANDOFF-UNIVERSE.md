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

## NEXT FOCUS — CLUSTERING (the whole reason for the next session)

**The complaint**: with polygon containers the diagram is "a big mesh" — entities sit on top of each other, no clear separation; and **changing Cluster Core By does nothing to the actual node arrangement.** In the old 2D graph, choosing a core RE-ARRANGED the elements.

**The goal**: clearly separated entity groups; inside each, **API endpoints at the cluster EDGE, functions/internals INSIDE**; and Cluster Core By should physically re-arrange nodes.

### Why the core does nothing today (the root cause)

Node POSITIONS come only from `zForce`, which pulls each node to its **entity** anchor `(EX/EY/EZ)[n.ent]` (+ a `-150` charge repulsion). The cluster-core control calls `assignSub(coreBy)` which rewrites **`n.sub`** — but `n.sub` feeds ONLY `buildClusters` (hull membership `ent|sub` + hull hue), **never position**. So the hulls regroup while the nodes stay put.

`applyCfg('coreBy')` today = `assignSub + buildClusters + updateClusters(true)` — **decoration only, no reheat, no position change.**

### The technical path (do these, in order)

1. **Make the core drive POSITION — add a sub-anchor term to `zForce`.**
   - Build a `SUBANCHOR[ent][sub]` map: within each entity, lay its distinct `sub` groups out on a small ring/grid offset from the entity center (a per-(ent,sub) local offset).
   - Add a third pull in `zForce`: `n` → `entityAnchor + SUBANCHOR[n.ent][n.sub]` (a weaker pull than the entity term, so sub-groups separate *inside* the entity).
   - `applyCfg('coreBy')` must then: `assignSub` → recompute `SUBANCHOR` → **`Graph.d3ReheatSimulation()`** → `buildClusters` + `updateClusters`. (The 3d-inject recon flagged exactly this as the unbuilt step.)

2. **Endpoints at the edge, internals inside — a per-kind RADIAL bias.**
   - In `zForce`, bias each node's target radius from its entity center by kind: `endpoint` → push outward (boundary), `function`/`model`/`schema` → pull inward (core). i.e. add a radial offset along `(node - entityCenter)` scaled by a per-kind factor.
   - This gives the "endpoints ring the cluster, guts inside" the operator asked for.

3. **Stronger entity separation (kill the overlap).**
   - `recomputeEX` force/spread currently spreads anchors in `~[-300,300]`; the hulls still overlap because node charge (`-150`) + the entity pull let nodes bleed. Options: widen the anchor spread (×1.5–2), raise the entity-pull strength, and/or add a soft **containment** force (pull a node back if it strays beyond a radius of its entity anchor). Tune so hulls read as distinct bubbles.

### Key code anchors (all in `parts/layout.js`, mirrored in the landed html)

- `function zForce(alpha)` — the single place node positions are nudged. Add the sub-anchor + radial terms here (guard every `n.x||0` — the NaN lesson).
- `function recomputeEX(mode)` — entity anchors (chain/force/spread). Widen/strengthen for separation.
- `function assignSub(mode)` — core → `n.sub` (already correct); pair it with a `recomputeSubAnchors()` you add.
- `function buildClusters()` / `makeCluster()` / `updateClusters(force)` — hull rendering; reads `n.x/y/z`. `<2`-member subs are skipped (line in buildClusters).
- `applyCfg('coreBy')` branch — change from decoration-only to: assignSub + recompute sub-anchors + **reheat** + rebuild.
- `EX/EY/EZ` (in `parts/adapter.js`) + a NEW `SUBANCHOR` map.

### Watch-outs

- **NaN frames**: any new node motion + a reheat can start from `undefined`/coincident positions → `computeBoundingSphere NaN` spew. Seed uniquely (golden-angle, as `toggleFns` does) and keep the `isFinite(n.x)` `_npos` guard.
- **Perf**: fleets are static by default (`ANIM.fleets=false`); the connector rebuild is throttled every 3rd tick; freeze-on-drag pauses during rotation. A reheat over 456 nodes (functions on) is the heavy case — consider fewer `cooldownTicks` on a core/layout reheat, and/or throttle the hull recompute too.
- **Cluster-core cores that need levels**: guards/usecase/community/fk join `GABE_LEVELS` by name; the "other" bucket holds unmatched (endpoints/web/external aren't in the cls-keyed maps). Sub-anchoring must handle the "other" group gracefully.

### Deferred / open (not blocking the clustering work)

- Push the 9 commits (operator word required; branch has no upstream — needs `-u origin graft-adoption`).
- Twin propagation (gustify/gastify) — read-only; do NOT write to them.
- Optional: lock the horizon upright in the orbit (currently a little roll is allowed to keep the pivot exact).
