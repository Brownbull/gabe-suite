# A3 command-center generators

The machine-derived station generator for a project's **Testing Command Center** —
the same pipeline that renders gastify's center, generalized so any project drives
it entirely from one config file. It fills the vendored A3-Tabbed shell skeletons
(`templates/center/shell/`) with facts read from PLAN.md, PENDING.md, LEDGER.md,
junit XML, adoption.json and git at build time. Nothing on the pages is authored
except each entity's lens card; every number is machine-read (the anti-curation
guardrail).

## The one binding file: `center.config.json`

These scripts read **only** from `docs/site/center/center.config.json` and
`docs/site/center/adoption.json`. No project path, suite name, or entity mapping
is hardcoded in the Python. Copy `center.config.template.json` into the center dir
at adoption and fill it; `center.config.example.json` is the gastify binding as a
worked example.

| Key | What it binds |
|---|---|
| `project` | name · display_name · lang — the hub title and page chrome |
| `paths` | center · kdbp · results · proof · e2e_spec_glob · mermaid_renderer |
| `corpora[]` | one per test suite: `key` · `runner` · `kind` · `kind_detail` · `tag_class`. Drives junit loading, the estate totals, the corpus matrix, the per-entity Tests tab, and run-history sources — no suite name is written in code |
| `e2e` | runner + the local-only / coverage-gate notes the prose interpolates |
| `leaf_reports[]` | the OSS HTML reports the sidebar links when on disk |
| `commands` | capture commands run by `refresh_center.sh <mode>` (one shell line each) |
| `foundations`, `code_layers`, `build_architecture` | the KDBP docs to list, the code-map layer order, whether to emit the Architecture station |
| `entities.<slug>` | `test_rx` (claims test files — required), and once the section is adopted: `proofs`, `code` (files by layer), `models` (classes to document) |

**adoption.json is the entity registry** (D123): every `entities` key MUST be a
slug registered there. An unknown slug aborts the build — the drift class this
tool exists to kill, applied to its own config.

## Module map

| File | Role |
|---|---|
| `build_center_a3.py` | orchestrator — loads sources, fills every station, writes the pages + `archmap.json` |
| `_center_data.py` | durable layer — KDBP docs, gate configs, the lens-card parser, and **config + path resolution** every module reads |
| `_results_ingest.py` | run-result loaders — junit / coverage / run-history (the P165 split seam: the sources a run REPLACES, apart from the durable layer) |
| `_a3_render.py` | pure HTML helpers (tables, meters, section banners, markdown) — no data, no state |
| `_a3_feature.py` | per-entity feature pages (Overview · Tests · Evidence · Risk · Growth) |
| `_a3_code.py` | the Code tab — endpoints / models / schemas parsed from source with `ast` |
| `_a3_evidence.py` | the Evidence tab — proof sets walked off disk, narrated from each `manifest.json` |
| `_a3_graph.py` | the C4 codebase graph — a LIBRARY-NEUTRAL `{nodes,edges}` view derived from the in-memory archmap (zero new source read; FK-only L1 edges, honesty laws), emitted as committed `c4-graph.json` + the `window.GABE_C4`/`GABE_C4_COLORS` sibling `c4-graph.js` with a baked ring x/y + deps-gradient fx/fy layout. Feeds the `gabe-universe.html` station (the `codebase-graph.html` page retired 2026-09-10). Battery: `tests/arch-graph` (emitter) + `tests/gabe-universe` (station) |
| `_a3_levels.py` | the rich LEVELS graph — `window.GABE_LEVELS` for the Gabe Universe (its only reader since the Levels lab retired 2026-09-10): functions · use-cases · communities · use-edges · per-piece hub/god/guards, the fn→schema/use edges, homing, models; stamps the archmap's `head` + `version` |
| `_center_mermaid.py` | build-time mermaid pre-render, cached by content hash |
| `check_center_links.py` | the crawl gate — every internal href resolves, or the build fails |
| `refresh_center.sh` | ONE entry point — `regen` (default, cheap) or a capture mode from `commands` |
| `_a3_tests.py` | archmap `test_insight` — T1 exercises · T2 via route · T3 named, by function / endpoint / model, from the junit corpus |
| `_a3_guard.py` | archmap `guard_insight` — unguarded · named · proven, proofs from `.kdbp/guard-proofs.jsonl` |
| `_a3_ledger.py` | `ledger.html` — one row per C-id, parametrize variants grouped |
| `_a3_board.py` | `board.html` — a PROJECTION over PLAN/PENDING/adoption/walks/guard_insight; KPI attrs for `board.js` |
| `_a3_graft.py` | the graft arm — cross-entity `calls`/`imports` into the L1 multi-kind edges, the endpoint `behind` floor, module-call fold, `dispatches`; honest-empty `present:false` + reason without an index |
| `_a3_web.py` | the web→API bridge arm — fetch call sites per screen file (apiFetch · axios · fetch · a generated SDK table) matched to endpoint pieces → `web` kind + `bridge` cross-edges; `present:false` with a reason |
| `_a3_fe.py` + `_a3_fe_extract.mjs` | the frontend STRUCTURE arm — the TypeScript extractor (needs a `typescript` package: the project's, a sibling's, or the spike's — `GABE_TS_DIR`) → `GABE_C4.fe` pieces/edges/homes + feClass · hrole · fed2w · store shapes |
| `_a3_homing.py` | membership EVIDENCE — file · users · data witnesses per piece → agree · stay · move-candidate · shared; `c4.stats.homing` + `levels.homing` |
| `_a3_models.py` | the four ENTITY MODELS — claim (the registry) · seeded · derived · proposed as per-piece home DELTAS on `c4.models` + `levels.models` |
| `_a3_naming.py` | every name a cluster could wear (`c4.models.naming`) — strategies × conventions; the universe labels from the feed's own defaults |
| `_a3_sim.py` | `sim.data.js` — the change-simulation projection from inflight + archmap + git + junit (`window.GABE_SIM = null` at rest); `archive_upsert` stays pure, `emit_archive` retired with the archive station (2026-09-10) |
| `_a3_commits.py` | `commits.js` — the twin's last 30 commits as journeys (`touched` ids) |
| `_render_mermaid.mjs` | the mermaid pre-renderer `_center_mermaid.py` drives |
| `check_workflow_drift.py` | the evidence-navigator census drift (report-never-gate; `/gabe-review` + pulse S8 route it) |
| `curate_proof.py` · `next_feature.py` · `center_status.py` · `risk_sweep.py` · `scaffold_census.py` · `disposition.py` | the cc-update / cc-init bindings that land in a twin's `scripts/` — proof curation · the next-entity chooser · the actionable list · the P0–P3 risk ladder · the scaffold census · the PENDING disposition primitive (moved here from the suite's `scripts/` 2026-09-10 so bootstrap + propagate carry it) |
| `verify_center_chrome.mjs` | the shell-JS harness (rowclick · lightbox · expander cascade) in a REAL browser — the third gate of `refresh_center.sh`; ONE home since 2026-09-10 (`tests/chrome` points here) |
| `bootstrap_center.sh` · `propagate.sh` | adoption init (archive-never-delete: generators → `scripts/`, shell, config skeleton, the nine `.gitignore` seeds) · the suite→twin update (copy-only, update-only — it cannot see a suite deletion; see the RETIRED listing) |

## Environment + config keys the generators read (the contract)

`GABE_REPO_ROOT` (the tree to scan) · `GABE_CONFIG` (center.config.json) · `GABE_CENTER_OUT` (write root; twin-read-only
builds point it at a temp dir) · `GABE_SHELL_SRC` (the shell skeletons) · `GABE_GRAFT_BUILD` (`0` = read the index as found;
never build) · `GABE_GRAFT_INDEX` (an index built out of tree) · `GABE_TS_DIR` (a `typescript` package for the fe extractor)
· `ECC_ROOT` (the install root the refresh rail reads the drafter from, default `~/.claude`). Config keys beyond `entities`:
`naming` (words · entities for the naming strategies) · `url_domain_map` (the URL-domain second lens) · `homing`
(`usage-first`, opt-in, off) · `code.*` globs (recursive `**` accepted).

## Emit order (what `build_center_a3.py main` writes, in sequence)

assets/ → every shell `*.html` (architecture · board and `RETIRED_PAGES` skipped) → `feature-<slug>.html` → `archmap.json`
(entities · insights · censuses · flags · middleware · dispatch · tasks · boot roots) → the arms: graft → web → the three
PRESENCE-FLIP tripwires (against the COMMITTED `c4-graph.json`) → fe → `build_c4_graph` → `build_levels` → homing →
models → `levels.json` + `levels.js` → `c4-graph.json` + `c4-graph.js` → `sim.data.js` → `commits.js` → `workflows.js` /
`workflows.draft.js` (ensure-exists) → `board.html` → `inflight.{json,js}` (stub) → the `test-*` / `arch-*` estate pages →
`rows-seen.json` → the late `{{SIDEBAR_FE}}` pass → the `a3.css` guard. Every arm after the archmap is try/except:
it prints ⚠ and degrades, never blanks the centre. `refresh_center.sh` then runs the link gate, the chrome harness and
(2026-09-10) the entity-model drafter.

## Running it

```bash
scripts/refresh_center.sh            # regen only — re-render from inputs on disk
scripts/refresh_center.sh junit      # run the declared junit capture, then regen
scripts/refresh_center.sh all        # junit + coverage + e2e, then regen
```

`build_center_a3.py` renders from the **vendored** shell
(`<repo>/templates/center/shell/`) so a clone regenerates reproducibly; the
installed suite copy (`~/.claude/templates/gabe/center/shell/`) is a fallback and
any drift between the two is reported, never silently preferred.

## Stack assumptions

The code decode (`_a3_code.py`) parses **FastAPI** decorators, **SQLAlchemy**
`Mapped[...]` columns and **Pydantic** classes with `ast`; the corpus loaders read
**junit** XML (pytest xunit2 / vitest junit reporter). Projects on that stack —
the suite's twin apps — bind cleanly. A different backend swaps the code-decode
parsers; the rest (KDBP, junit, proof, render) is stack-agnostic.

## Provenance

Ported from gastify's field-tested `scripts/` (the reference implementation named
by adopt-spec). Every gastify-specific binding was moved into `center.config.json`;
the port was proved behavior-preserving by a differential byte-diff — fed gastify's
own bindings, the generalized generators reproduce gastify's committed center
exactly (all 10 pages + `archmap.json` byte-identical modulo the wall-clock stamp).
`_center_data.py` was split at the P165 seam (931 → 302 data + 144 results-ingest).

## Environment contract (the GABE_* variables)

`build_center_a3.py` and the arms read these; a fresh regen sets them explicitly:

| Var | Meaning |
|---|---|
| `GABE_REPO_ROOT` | the project whose center is built (its tree is READ; writes only if `GABE_GRAFT_BUILD=1`) |
| `GABE_CONFIG` | that project's `docs/site/center/center.config.json` (bindings + capture commands) |
| `GABE_SHELL_SRC` | the vendored shell skeletons to fill (`templates/center/shell`) |
| `GABE_CENTER_OUT` | redirect ALL writes here (a temp dir → twin-read-only build); unset = the project's own `docs/site/center` |
| `GABE_GRAFT_BUILD` | `1` (default) self-provisions graft (`graft build` + scoped `.ignore` edit — **writes into the twin tree**); `0` reads the index as-found, twin tree untouched — use for a read-only regen |
| `GABE_TS_DIR` | (fe arm) a dir whose `node_modules` has `typescript`; absent → the fe arm is honest-empty |
| `GABE_FE_EXTRACT` | `0` disables the fe compiler pass (honest-empty) |

**Twin-read-only recipe** (never writes the twin): `GABE_GRAFT_BUILD=0 GABE_REPO_ROOT=<twin>
GABE_CONFIG=<twin>/docs/site/center/center.config.json GABE_SHELL_SRC=$PWD/templates/center/shell
GABE_CENTER_OUT=$(mktemp -d) python3 templates/center/generators/build_center_a3.py`.

**Propagate to an adopted twin**: `bash templates/center/generators/propagate.sh <twin-root>`
- `bootstrap_center.sh <repo> [--name <slug>] [--display "<name>"]` — the CONFIG-ONLY adoption of the center into a repo that has none (review 2026-09-06): lands the generators into `scripts/`, the shell (minus `example/`) into `templates/center/shell/`, a `center.config.json` skeleton (`entities: {}` — fill it), the `.gitignore` seeds; never a tracker (the build takes the config's entities as the registry, out loud), never overwrites, re-runnable. Then `bash scripts/refresh_center.sh regen`. A suite-side driver like `propagate.sh` — never vendored.
(`--check` reports drift, writes nothing) — updates the twin's vendored generators + shell, REMOVES what the suite
retired (the `RETIRED` listing in the script: the three retired station pages, the archive feed, `force-graph.min.js` —
`--check` names a survivor, a real run deletes it; a copy-only sync could never see a deletion), then runs the twin's
`scripts/refresh_center.sh regen`.
