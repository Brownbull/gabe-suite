# Codebase-graph stations — example

A **frozen snapshot** of the TWO codebase-graph command-center stations, rendered
over **real gustify data**, so they are viewable without running a twin build:

- **`codebase-graph.html`** — the **Change graph** (ephemeral): the current change in
  flight as the change-simulation lifecycle instrument.
- **`codebase-archive.html`** — the **Codebase archive** (durable): the whole
  ecosystem by default, with a right-panel dropdown that replays any PAST phase from
  the committed archive (`sim-archive.js`), lighting its touched → blast + pieces and
  fading the rest. Shares the change graph's controls — the **Close/Open-all** toggle
  and **⚙ layout** gear stay live in both modes (defaults mirror the change graph:
  entities **ring** · inside **force**), a **Connections** toggle shows the piece↔piece
  FK coupling both INSIDE each entity and ACROSS entities (the emitter's new
  `cross_edges`), an exploded entity's big circle gives way to its container + pieces
  (auto-spaced so they never overlap), and a selected phase opens every involved entity
  to its FULL model set with the four **Red·Execute·Review·Commit** stage lenses
  highlighting what the commit touched.

Open either directly (`file://`).

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
- `codebase-archive.html` — the built **Codebase archive** station (`.eco-root`),
  reading `c4-graph.js` + `sim-archive.js`.
- `sim-archive.js` — a **seeded 2-phase archive** `window.GABE_SIM_ARCHIVE` (P4 ·
  Pantry batch · P6 · Repertorio cupo), so the feature dropdown has entries. In a real
  twin this is the **committed** per-phase accumulator `_a3_sim.archive_upsert` grows
  at each build (durable, unlike the gitignored `sim.data.js`).

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
