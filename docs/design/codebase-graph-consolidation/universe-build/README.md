# universe-build — the Gabe Universe station, reproducibly

**RETIRED as an authoring pipeline — operator ruling 2026-09-03.** The Gabe Universe station
`templates/center/shell/gabe-universe.html` is the **source of record**: it is edited directly and
`build_center_a3.py` ships it to every project's center (`SHELL_SRC.glob("*.html")`). The example
snapshot is that template + rehome tokens (`fill-example.py`). `parts/`, `assemble.py` and
`spike-base.html` stay for history only — the template drifted 21 commits past what they assemble
(last parts commit `fa67dee`, 2026-08-31); they are **not a build input** and must not be landed.
What this dir still owns: the twin-read-only FEED build, the `--check` reproducibility contract, the
seeded sim, and the headless proofs.

## Source layout

| File | Role |
|---|---|
| `spike-base.html` | RETIRED — the 5C spike the station was originally transformed from (history) |
| `parts/{adapter,layout,card}.js` · `parts/{station.css,chrome.html}` | RETIRED — **do not edit**; edit `templates/center/shell/gabe-universe.html` |
| `assemble.py` | RETIRED — the former `spike-base + parts/` → page pipeline; not run by regen-example.sh |
| `fill-example.py` | rehomes the **template** with the gustify example tokens → the committed **example** page |
| `derive-seeded-sim.py` | derives the example's `sim.data.js` from a real twin commit (regenerable seed, never a frozen blob) |
| `regen-example.sh` | **ONE command** — rebuilds (or `--check` drift-checks) the ENTIRE committed example estate |
| `verify-*.mjs` | headless-chrome proofs (SOLO-sequential; see §Proofs) |

## Regenerate everything (the one command)

```bash
bash regen-example.sh            # rebuild all 8 estate files, land them, run the static battery
bash regen-example.sh --check    # byte-compare a fresh regen vs the committed estate (writes nothing)
GABE_TWIN=<repo> bash regen-example.sh   # default twin: /home/khujta/projects/apps/gustify
```

`--check` CLEAN is the reproducibility contract: a generator or source change that is not
re-landed shows as DRIFT. Volatile stamps (twin HEAD sha, regen date) are normalized;
`graft index_hash` is NOT (it is twin-state and its drift is real — see §graft below).

## What the one command produces (the estate)

Into `../../../../templates/center/shell/example/codebase-graph-station/`:
- `c4-graph.js` · `levels.js` · `levels.json` · `sim-archive.js` — one twin-read-only build
- `codebase-graph.html` — the `$TMP` page with `assets/` rehomed to `../../assets/`
- `sim.data.js` — DERIVED from a real twin commit (**never** the build's `null` stub, which
  renders the change-graph blank — the 77fe3cd defect this wrapper exists to prevent)
- `gabe-universe.html` — `assemble.py` + `fill-example.py`
- `workflows.js` — CURATED (not built): `window.GABE_WORKFLOWS = [{name, steps:["METHOD /path"…], note}]`,
  the operator's user workflows for the journeys picker's **workflows** tab. One file per project,
  beside the center's data; the build SEEDS an honest-empty placeholder when a center has none
  (never overwrites a curated one), so the page's script target always exists. The **backend**
  tab needs no file (chains are derived from the fn feed at view time).

And `../../../../templates/center/shell/gabe-universe.html` — the landed shell station (the
assembled page, shell tokens intact). The `cp` to the shell is done BY the wrapper; it is no
longer a manual step to forget.

## Editing the station

```bash
# edit parts/* — never the assembled gabe-universe.html (it is regenerated)
python3 assemble.py            # parts/ → gabe-universe.html (gitignored)
bash regen-example.sh          # lands both the shell + example pages AND runs the battery
```

## graft (why c4-graph.js needs a real graft index)

`regen-example.sh` runs the build with `GABE_GRAFT_BUILD=0` — it reads graft's index
**as found** and never mutates the twin tree. The committed `c4-graph.js` therefore matches
only a twin whose `graft/.graph/wiring.json` is current. To refresh graft first:
`GABE_GRAFT_BUILD=1 ...` (self-provisions per the red-beat recipe; writes into the twin —
do this only on a twin you may write). Absent graft, the FK topology is byte-identical and
the call/import arms are honest-empty (`stats.graft.present=false`).

## Proofs (headless chrome)

The `verify-*.mjs` need a browser + `playwright-core`, resolved from the **gitignored**
`docs/design/graft-adoption/spike/_build/node_modules`. On a fresh clone, reconstruct it once
(`../../graft-adoption/spike/README.md` §"Rebuild the bundle"), or point `GABE_PW_DIR` +
`GABE_CHROME_BIN` at your own. Run them **solo-sequential** (concurrent chrome runs starve):

```bash
for v in panels search walk clustering explore routes ctrl d2w dblclick jrntabs jrnstep selanim backend-journeys workflows; do node verify-$v.mjs; done
# fleet is long (~10min) — run detached: nohup node verify-fleet.mjs &
```

`tests/gabe-universe/run.sh` (from repo root) is the committed static+render battery
(431 static pins + a render proof) — the one suite-doctor runs.
