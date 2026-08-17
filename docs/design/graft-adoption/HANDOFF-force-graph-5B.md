# Handoff — force-graph "5B" (emulate the Trace diagram) + frontend refinement

> Session boundary 2026-08-17. Branch `graft-adoption`, ~25 commits ahead of `main`, **unpushed**.
> Operator wrapped this session and reset the priority. Read this + memory
> `codebase-map-enforcement.md` before touching anything.

## Where we are

The frontend force-graph LANDED as a live level — commit `a1ffb71`: a "2 · Frontend" level in
`templates/center/shell/codebase-archive-lab.html` renders graft's 1,547 classified TS pieces via the
vendored **force-graph 1.51.4** (`assets/force-graph.min.js`), with animated link particles at 60fps.
It works, but the operator's verdict is **"not good enough"** — it looks nothing like the suite's other
diagrams, and its controls are wrong.

## THE NEW PLAN (operator ruling, this session) — priority reset

1. **DEFER** the Tier-1 linking parse (`_a3_fe_link`: ast-grep JSX/useX + dependency-cruiser type-only
   imports — the arm that would link the orphan types/components) AND broader frontend refinement.
   The blind-spot diagnosis stands (graft emits 0 type-usage edges; see memory) — it's just not next.
2. **BUILD "5B"** — a SECOND version of the **"5 · Trace"** diagram (`drawTrace`, line ~1787) that uses
   the **force-graph library** but **emulates the current Trace diagram as closely as possible**: same
   icons, same link look, same controls. The current force-graph frontend is "super different" from the
   SVG diagrams — that gap is the whole problem to close. Prove the emulation on Trace (the richest
   diagram), THEN apply the same force-graph render to the **frontend columns** ("2 · Frontend").
3. Net goal: the library's PERFORMANCE + the existing diagrams' LOOK & CONTROLS, unified.

## The current force-graph's flaws — each is a "make it like the SVG" task

| flaw operator hit | cause | fix direction |
|---|---|---|
| **no icons** (plain circles) | force-graph default node = a circle | `nodeCanvasObject` — draw the per-kind glyph (component ▢ · hook · store ⛁ · route ◇ · type `{}`) on the canvas, like `feGlyph`. Kind = shape. |
| **links look different** | straight lines, one colour | match the SVG wire: curvature (`linkCurvature`) + entity-blend colour + the existing particle flow |
| **confusing node sizes / "is it 3D?"** | `nodeVal` sized by KIND; it is **2D** (force-graph, not 3d-force-graph) | it is NOT 3D — say so, or make size a clear single property (or uniform). Decide with the operator. |
| **auto-zoom-out after dragging** | `onEngineStop → zoomToFit` (line ~2645) **re-fires** every time a node-drag re-heats the sim | fit **ONCE** (guard with a `_fgFitted` flag), never on subsequent engine stops |
| **shortcuts dead** (scroll / shift / alt / ctrl) | force-graph owns its own wheel/drag; the SVG scheme is bypassed | EMULATE the SVG controls — see lines **625–653** (`stage.addEventListener("wheel"...)`): `altKey`=depth, `ctrl/meta`=zoom, `shift`=h-pan, plain scroll=v-pan, `pointerdown`=drag-pan. Re-implement that scheme over the force-graph canvas (disable FG's defaults, wire your own). |

## The reference to emulate — read these first

- **`drawTrace`** (line ~1787) + **`drawTraceFlow`** (~1945) — the "5 · Trace" render: icons, link
  styles (curve/gradient/flow-dots), the onion/cluster layout, the panel wiring (`showFn`/`showPiece`/
  `attachSelection`), selection registry (`regNode`/`regEdge`).
- **The control scheme** — lines **625–653** (`stage` wheel + pointer handlers). This is what "the
  shortcuts" means. The force-graph "5B" must feel identical.
- **The marker grammar** — `fGlyph`/`feGlyph`/`epMark`/`cylinder` + `twoRowLabel` + the entity-colour
  dot + `halo`. Port the SHAPES into `nodeCanvasObject`.
- **The current force-graph** — `drawFrontendGraph` (line ~2622) + `showFrontendDefault`. This is the
  first pass to REBUILD in the emulated style. The `render()` level-swap (`level==="frontend"` →
  `#fgstage` canvas vs `#stage` SVG, line ~2600) is the integration seam — 5B reuses it.

## force-graph API cheatsheet (for the emulation)

- `.nodeCanvasObject((node, ctx, scale) => {...})` + `.nodeCanvasObjectMode(()=>'replace')` — draw the
  kind glyph + label yourself (icons, entity colour). `.nodePointerAreaPaint` for hit-testing.
- `.linkCanvasObject` / `.linkCurvature` / `.linkColor` / `.linkDirectionalParticles*` — match the wire.
- Controls: `.enableZoomInteraction(false)` / `.enablePanInteraction(false)` / `.enableNodeDrag(...)` to
  DISABLE the defaults, then wire the SVG scheme over the canvas element. `.zoom()` / `.centerAt()` /
  `.zoomToFit()` are programmatic; `.onZoom`/`.onZoomEnd` fire on view change.
- `.graphData()` update re-heats; `.cooldownTicks`/`.warmupTicks`/`.d3Force(...)` tune the layout.
- Pause: `.pauseAnimation()`/`.resumeAnimation()` (already wired to `#motionbtn` via `setMotion`).

## Verify + guardrails

- Read-only twin: gustify pilot. Build: `GABE_GRAFT_BUILD=0 GABE_REPO_ROOT=/home/khujta/projects/apps/gustify
  GABE_SHELL_SRC=$PWD/templates/center/shell GABE_CENTER_OUT=<scratch> python3
  templates/center/generators/build_center_a3.py`. Playwright: gustify's node_modules/playwright,
  `channel:'chrome'`, `--no-sandbox`, `--use-gl=swiftshader` for WebGL.
- Batteries (all green now): `tests/levels-page` (95, static — has the P2b-fg force-graph checks),
  `tests/arch-graph` 158, `tests/levels` 45, `tests/codebase-graph` 239, `tests/sim` 31.
- Refresh `/home/khujta/gabe-graph-review/gustify-p1/` for the operator each visible change.
- Spikes to reuse: `/home/khujta/gabe-graph-review/graph-spike/` (fg.html = force-graph, sigma.html,
  cyto.html — the perf/aesthetic references).

## Owed / not done

- Tier-1 `_a3_fe_link` (deferred, but the design is in `docs/design/frontend-model/README.md` §4).
- Slice 3 (fold backend endpoints into the frontend graph — the frontend→endpoint→backend path).
- **PUSH**: branch `graft-adoption` ~25 commits ahead of `main`, nothing pushed to either remote.
