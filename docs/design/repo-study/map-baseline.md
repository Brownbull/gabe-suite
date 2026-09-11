# The codebase-map golden master

**2026-09-11 · operator ruling:** before the extractor estate is split per language/framework, capture
the maps generated for **gustify · gastify · tier3**, then regenerate after every modification and
verify the impact.

`scripts/map-baseline.sh capture | check | list [--gens DIR] [name...]`

## What it does

Runs the emitter against each target in the suite's READ-ONLY lab mode — `GABE_REPO_ROOT` points the
build at the foreign tree, `GABE_CENTER_OUT` redirects every write to scratch, `GABE_GRAFT_BUILD=0`
keeps it off that repo's graft index — so a target is never mutated. Then it reports the delta on
**two axes**:

* **byte** — per-file sha256 of the normalized output, so nothing changes unnoticed.
* **census** — 25 semantic measures (entities · endpoints · models · function_insight · fn_nodes ·
  fn_edges · l1/l2 nodes and edges · cross_edges · fe_pieces · fe_edges · web sites/matched ·
  homing · boot/task/action roots · unparseable …). `archmap.json differs` is useless next to
  `endpoints 80 → 72`.

`--gens DIR` runs a DIFFERENT generators tree against the same baseline — the A/B for a refactor
branch without touching the installed suite.

## The recipe is pinned, not incidental

Each target carries its env in `TARGETS`. tier3 has no installed `node_modules`, so without
`GABE_TS_DIR` its 2,614 TS files yielded **0 fe pieces** — a baseline covering only half the pipeline,
which would have lit up as a huge "refactor" delta the day someone installed it. Pinned to tier0's
compiler, tier3 now baselines **2,608 fe pieces · 5,345 fe edges**.

Normalisation is deliberately narrow — ISO run timestamps only. Measured sufficient: two runs of the
same generators give 82/80/75 files identical. Anything else that differs is REAL.

## Baselines (blessed 2026-09-11)

| target | head | files | entities | endpoints | models | fn_nodes | fn_edges | fe_pieces |
|---|---|---|---|---|---|---|---|---|
| gustify | b205563c | 82 | 8 | 80 | 57 | 292 | 427 | 1078 |
| gastify | 59a833ee | 80 | 5 | 49 | 14 | 128 | 141 | 415 |
| tier3 | 483d7f89 | 75 | 9 | 512 | 155 | 2472 | 3319 | 2608 |

Bulk lives outside the repo (`$GABE_BASELINE_DIR`, default `~/.cache/gabe-map-baselines`); the per-file
hash manifest and the census are COMMITTED at `tests/baselines/<name>.{sha256,census.json}`, so
re-blessing a baseline shows up in git as a reviewable diff.

## Proven, not asserted

* **Detects a real change** — a scratch generator copy with `@router.delete` recognition removed
  reported `endpoints 80 → 72 (-8)` · `fn_edges 427 → 402 (-25)` · `fn_nodes 292 → 279 (-13)` ·
  `l2_nodes -8` · `cross_edges -9` · `web_matched -5`, across 12 changed files.
* **No false positives** — an unchanged run is BYTE-IDENTICAL and census-identical on all three, all
  25 measures.

One harness bug was found by that pass and fixed: `check` wrote its own `.manifest` into the directory
it then enumerated, and the odd line count made a genuine one-file difference print as
`0 file(s) differ`. The harness's own artefacts are now excluded.

## How to use it during the extractor split

After each migration step: `bash scripts/map-baseline.sh check`. Byte-identical on all three = the
step is inert on existing projects, which is the gate every step must pass. A census delta that is
INTENDED (a new arm finding real things) gets re-blessed with `capture`, and the committed manifest
diff is the record of what changed and why.
