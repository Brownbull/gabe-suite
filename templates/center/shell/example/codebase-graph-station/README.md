# Codebase-graph station — example

A **frozen snapshot** of the `Codebase graph` command-center station
(`shell/codebase-graph.html`), rendered over **real gustify data**, so the station
is viewable without running a twin build. Open `codebase-graph.html` directly
(`file://`).

The station is the **change-simulation lifecycle instrument** (the final agreed
layout): the C4 entity graph with the change in flight overlaid — touched entities
(green) and their FK blast radius (amber) — explodable into typed mini-circle
pieces, four stage lenses (**Red · Execute · Review · Commit**), stage-coloured hot
flows, a per-stage lower-left encoding legend, and a persistent right panel with the
per-piece **lifecycle timeline**, typed identifier chips (fn · endpoint · model ·
schema · data type), and tests + evidence.

## Files

- `codebase-graph.html` — the built station (shell chrome + the instrument, scoped
  under `.cbg-root`). Shell assets are rehomed to the suite's real `../../assets/`
  (incl. `sim-panel.js`, the shared detail panel).
- `c4-graph.js` — gustify's emitted C4 graph (`window.GABE_C4` topology with baked
  ring **x/y** + deps-gradient **fx/fy**, plus `window.GABE_C4_COLORS`, the palette).
- `sim.data.js` — the **seeded example change** `window.GABE_SIM` (gustify commit
  `fecb2ce3`, "the mode row becomes the cupo"): `recipe` changed → `cooking`
  downstream. This is an **example fixture**, not live data.

**Honest-empty by design.** A real twin center ships **no** seeded change —
`build_center_a3` writes `sim.data.js` as `window.GABE_SIM = null`, and the station
degrades to the plain codebase **map** (the L1 graph + a "no change in flight" note;
double-click an entity to drill its L2 pieces). C2 will teach `_a3_sim.py` to derive
a live projection from inflight + git. This example seeds the fixture only so the
full instrument is demonstrable offline.

Note: only the station page ships here — the sidebar's links to sibling center pages
(board, entities, …) are illustrative chrome, not live in this isolated snapshot.

## Regenerate (portable — no machine paths)

Build a twin's center into a temp dir (the twin's tree is never written), then copy
the files out:

```bash
TMP=$(mktemp -d)
GABE_REPO_ROOT=<twin-repo> \
GABE_CONFIG=<twin-repo>/docs/site/center/center.config.json \
GABE_SHELL_SRC="$PWD/templates/center/shell" \
GABE_CENTER_OUT="$TMP" \
python3 templates/center/generators/build_center_a3.py
# 1. rehome  assets/ → ../../assets/  in $TMP/codebase-graph.html, copy it here.
# 2. copy $TMP/c4-graph.js here.
# 3. copy shell/example/arch-graph-lab/sim.data.js here as the seeded fixture
#    ($TMP/sim.data.js is the honest-empty null stub — do NOT ship that one).
```
