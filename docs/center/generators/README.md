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
| `_center_mermaid.py` | build-time mermaid pre-render, cached by content hash |
| `check_center_links.py` | the crawl gate — every internal href resolves, or the build fails |
| `refresh_center.sh` | ONE entry point — `regen` (default, cheap) or a capture mode from `commands` |

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
