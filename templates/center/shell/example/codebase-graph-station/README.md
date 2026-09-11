# Gabe Universe station — example

A **frozen snapshot** of the Gabe Universe station (`gabe-universe.html`, the suite's SOLE codebase-graph
station since f8de670 retired the Change graph, the Codebase archive and the Levels stations) rendered over
**real gustify data**, so it is viewable without running a twin build. Feed head **8356f531** (the `head` key of
`c4-graph.js`, `levels.js` and `levels.json` — the same head all three stamp).

| file | what | landed by |
|---|---|---|
| `gabe-universe.html` | the station page — the TEMPLATE (`templates/center/shell/gabe-universe.html`, the source of record) with its tokens filled and assets rehomed to `../../assets/` | `docs/design/codebase-graph-consolidation/universe-build/fill-example.py` |
| `c4-graph.js` | `window.GABE_C4` — the C4 topology: l1 · l2 nodes/edges · cross_edges · fe · stats · models · naming | one twin-read-only build (`regen-example.sh`) |
| `levels.js` · `levels.json` | `window.GABE_LEVELS` — functions · call edges · detail · schema/use edges · homing · models · pressure | the same build |
| `commits.js` | `window.GABE_COMMITS` — the twin's last 30 commits as journeys | the same build |
| `workflows.js` | CURATED user workflows (suite content — never built, never landed) | by hand |
| `workflows.draft.js` | the curate-workflows DRAFTER over this example's own graph | `regen-example.sh` |
| `sim.data.js` | a change in flight, DERIVED from a real twin commit (never the build's null stub) | `derive-seeded-sim.py` via `regen-example.sh` |
| `assets/` | the station's own assets, rehomed | — |

Regenerate: `bash docs/design/codebase-graph-consolidation/universe-build/regen-example.sh` (against the gustify
twin; `--check` proves the committed estate reproduces byte-identically and never reverts uncommitted edits).
Proof: `bash tests/gabe-universe/run.sh` (static + a headless render over this feed).

Retired 2026-09-10 (f8de670): `codebase-graph.html` · `codebase-archive.html` · `codebase-archive-lab.html` ·
`sim-archive.js` and the seven `probes/port*-probe.mjs` that drove the 2D station — removed from this snapshot.
The sibling labs `../level-lab/` and `../arch-graph-lab/` are frozen design labs (their READMEs say so).
