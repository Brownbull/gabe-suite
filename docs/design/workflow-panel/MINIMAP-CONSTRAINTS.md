# Minimap — the constraints, verified before designing

Read from `templates/center/shell/gabe-universe.html` and the example feed on 2026-09-08.
Every line here was checked against the file, not assumed.

## C1 · The feed's coordinates cannot be used

`c4.l2[*].nodes` carry `x` and `y` — all 313 of them — but:

- **`x` has only 9 distinct values** (`0 · 240 · 480 · 720 · 960 · 1200 · 1440 · 1680 · 2160`).
  It is a **layer/column index**, not a position. 123 nodes share `x=480`.
- **There is no `z` at all.**
- **Frontend pieces carry no coordinates** — 0 of 1,078.
- Entity centroids computed from them overlap almost exactly: `recipe (379, 855)` against
  `pantry (394, 914)`. A minimap drawn from these would put two of the three biggest entities on
  top of each other.

**And the station discards them anyway.** The node adapter at `:1249-1251` copies
`id · kind · ent · entClaim · label · col · K · layer · sub · m · det · behind · resp · ids ·
table · sites · fn · middleware · stream · pclass · homeEv · fnsN` — and **no x, y or z**.

## C2 · Positions are pure 3D simulation

- `numDimensions(3)` at `:5211` — a true 3D layout, not a projected 2D one.
- `cooldownTicks(240)` · `cooldownTime(1e9)` — the sim runs to a tick budget, not a wall clock.
- `d3Force("charge").strength(-60).distanceMax(150)` at `:5219`.
- **No `fx` / `fy` / `fz` anywhere in the file** — nothing is pinned. Every position is emergent.

So the minimap must read **live `node.x/y/z`** off `Graph.graphData().nodes`, and only after the
layout settles. There is no authored map to draw.

## C3 · Z is semantic, which decides the projection

`d3Force("layer", zForce)` at `:5218` pushes nodes onto **Z bands by their `layer` property**
(the kind's layer). That makes the three candidate projections mean different things:

| projection | shows | verdict |
|---|---|---|
| top-down `(x, z)` | the **kind layering** — endpoints, models, screens as strata | reads as a cross-section, not a map |
| face-on `(x, y)` | the **entity spread** — clusters as islands | this is the map the operator described |
| camera-basis | whatever the camera sees, rotated | **rotates with the view, which is the ask** |

C3 is why the projection has to be camera-relative rather than a fixed world axis: a fixed axis
cannot rotate, and the operator asked for *"the map should be able to rotate just like we do."*

## C4 · The integration point already exists

`.onEngineStop(...)` at `:5212` already fires `window.__uniSettleDone()` when the layout finishes,
and already drives deep links, the panel restore and cluster updates. That is the hook a minimap
builds its point cloud on — no new lifecycle needed.

`updateClusters(true)` runs in the same handler, so entity cluster geometry is computed there too.

## C5 · The dock must be sized in `vh`, not `px`

The operator reported the dock reading as *"a sixth of the page"*. Measured:

| dock | 900p | 1080p | 1440p | 1600p |
|---|---|---|---|---|
| A/B/C · 264px | 29.3% | 24.4% | 18.3% | **16.5%** |
| D · 288px | 32.0% | 26.7% | 20.0% | 18.0% |
| F · 200px | 22.2% | 18.5% | 13.9% | 12.5% |

At 1600px tall a 264px dock **is** a sixth. The proposals hardcoded pixels, so every "measured at
1600×900" figure stayed true and became irrelevant on a taller display. Sizing in `vh`
(`--dock: 25vh`) makes 25% hold everywhere; the px figures then become per-display readings rather
than the spec.
