# 5C Trace-Graph Spike — the encoding playground

The runnable proof-of-concept for the GAYGRAPH graph-authoring idea
(see [`../FUTURE-SKILL.md`](../FUTURE-SKILL.md)). This is a **live encoding playground**, not the final
diagram: two panels let you compose which data-field drives which visual effect, in a 3D force graph.

Moved into the repo 2026-08-18 from the external scratch dir `/home/khujta/gabe-graph-review/` so the
work survives that dir being cleaned. This is now the **canonical** copy.

## Run it

Fully offline — no server, no build needed. `index.html` loads its sibling `./3d-bundle.js` (a vendored
esbuild bundle of THREE + ForceGraph3D + SVGLoader + ConvexGeometry + MarchingCubes) and embeds its own
synthetic data. Just open it:

```bash
google-chrome "file://$PWD/index.html"
# URL hooks: ?enc=A|B|C  ?panel=<nodeId>  ?link=<src>>​<tgt>  ?cmode=heat  ?bubble=ghost
```

Headless screenshot:

```bash
google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=1500,950 --virtual-time-budget=15000 --screenshot=out.png \
  "file://$PWD/index.html?enc=B&subOn=off&entOn=off"
```

## The two panels

- **CONFIG** (top-right, draggable) — the hand-off surface that carries into the real diagram: container
  shape (polygon/wrap), sub/entity on-off, radius, transparency (faint/ghost/film).
- **ENCODE** (top-left, marked "not saved") — the experiment surface: A/B/C presets, colour identity/heat,
  icon-size, per-dimension rows (toggle · variable dropdown · value · ± steppers), `↺` reset, flow-speed
  slider. Each row's dropdown writes `MAP[setup][key]` — the editable field→effect mapping that is the
  whole point.

The encoding grammar (what reads what) is tabulated in [`../FUTURE-SKILL.md`](../FUTURE-SKILL.md) and
spec'd step-by-step in [`../records/5C-3D-trace.md`](../records/5C-3D-trace.md) §9a–§9x.

## What's in this folder

| path | committed? | what |
|---|---|---|
| `index.html` | ✅ tracked | the live spike (source of truth) |
| `3d-bundle.js` | ✅ tracked | vendored esbuild bundle so the spike runs standalone (regenerable — see below) |
| `_build/` | ⬜ gitignored (local-only) | esbuild recipe + Playwright battery + `node_modules` — not pushed |
| `screenshots/` | ⬜ gitignored (local-only) | ~60 PNGs, visual provenance of each `§9` step — not pushed |

`_build/` and `screenshots/` are **kept on disk but gitignored** — heavy/rebuildable, deliberately out of
pushed history (operator call 2026-08-18). Everything you need to *run* the spike (`index.html` +
`3d-bundle.js`) is tracked, so a fresh clone runs it standalone with no build step.

## Rebuild the bundle / run the battery (both live only in local `_build/`)

`_build/` is gitignored, so a fresh clone has no bundle-build workspace and no battery. Reconstruct it:

```bash
# rebuild the vendored bundle (recipe: ../records/5C-3D-trace.md §8)
mkdir -p _build && cd _build
npm i 3d-force-graph three
echo "import * as THREE from 'three'; import ForceGraph3D from '3d-force-graph';\
 window.THREE=THREE; window.ForceGraph3D=ForceGraph3D;" > entry.js
npx esbuild entry.js --bundle --minify --format=iife --outfile=../3d-bundle.js

# run the panel battery (was 57/57) — needs playwright-core + system Chrome
npm i playwright-core
node pw-panel-test.mjs  # resolves ../index.html via import.meta.url — no hardcoded path
```

The `pw-panel-test.mjs` battery itself lives in the local `_build/` (not pushed); what it asserts is
narrated in `../records/5C-3D-trace.md` (search "Playwright test") if it ever needs rebuilding from spec.

## What stayed external (not moved, by operator choice — "lean source")

Left in `/home/khujta/gabe-graph-review/`, not committed:
- `_build/node_modules/` (~92M, regenerable via `npm ci`).
- `gustify/` · `gastify/` · `gustify-p1/` (~152M read-only twin data copies — the spike embeds its own
  synthetic data and never reads these at runtime).
- `spike-3d/` · `graph-spike/` (the earlier 3D spike + the cytoscape/sigma/force-graph library trials;
  their exploration is narrated in `../records/5C-3D-trace.md` and `../records/HANDOFF-force-graph-5B.md`).

## Scale-up (open)

Port the encoders + cards from the synthetic recipe+auth payload to a real `c4-graph.json` (frontend
collapses to one `web` kind + `sites`). The frozen example payloads go stale silently on regen — treat
them as a fixture, not a census.
