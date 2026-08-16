# Graft Adoption — the Command Center becomes a graft renderer

> Decision 2026-08-16 (operator, Option A): stop building the codebase map from scratch.
> Adopt **graft** (`@nanonets/graft`) as the fact + enforcement layer; keep the **Command
> Center** as its renderer. Ends the ~3-session "we don't actually use our map" loop, because
> graft enforces itself (its own hooks/injection) instead of relying on a rail we keep forgetting.
>
> Status: PLAN (draft for operator review). Depends on the "is there an off-the-shelf center"
> quick check (running) — if that finds nothing adopt-able, this plan stands as-is.

## The mental model (operator's words, affirmed)

- **Gabe Suite = the process spine.** read → execute → review → commit → push. A mix of borrowed
  repos, practices, and our own learning. It COMPOUNDS cognitive depth fast during development.
- **Command Center = the visualization** of what that spine produces: what's changing (graphically),
  explore code at every level, tests, evidence, the board (project status), ledger, releases.
- **graft = the codebase map.** We hand mapping to graft and base the Center on it.

## The layering — who owns what

The Center's sections split cleanly into **codebase facts** (→ graft) and **process/domain**
(→ suite). graft is SYMBOL-LEVEL and has no concept of a domain entity, a project board, or a
release — so the suite keeps the modeling + render, and stops re-deriving raw facts.

| Center section | Today (suite from-scratch) | After adoption |
|---|---|---|
| **Board overview** | KDBP `PLAN.md`/board.json | **STAYS suite** — process state, not codebase; graft has no board concept |
| **Entities (domain model)** | `_a3_graph` C4 entity grouping | **suite modeling ON graft facts** — suite groups graft's symbols into entities (graft has no domain) |
| **Index** | archmap-derived | rebuilt from graft nodes + the suite entity model |
| **Code overview** (per entity) | `function_insight` re-parses source | **CONSUME graft** — `signature`·`exported`·`kind`·`span`·`--deep` summary/crux; drop the re-parse |
| **Architecture / "why they call"** (endpoints · code map · data model · functions) | `_a3_graph` + `_a3_web` | **CONSUME graft** edges — `calls`·`imports`·`contains`·`extends`·`implements`; suite keeps the C4 grouping |
| **Frontend** (the arm we were about to build) | `_a3_web` regex | **CONSUME graft's TS nodes/edges** — graft already indexes `apps/web` (28k TS refs); domain-classify on top |
| **Tests** (unit/integration/e2e) | `_a3_tests` (test_insight) | graft indexes test FILES; **suite keeps the case→result evidence** (KDBP junit mapping) |
| **e2e / security** | suite | graft = the files; suite = the case mapping |
| **Ledger / releases** | KDBP `LEDGER.md` / git | **STAYS suite** — process + git history, not codebase map |

One-line rule: **graft owns codebase FACTS (backend + frontend); the suite owns PROCESS/DOMAIN + RENDER.**

## Enforcement (the recurring miss — solved by installation, not by us)

Install graft properly (`npm i @nanonets/graft` + `graft init`) in the twins → get, for FREE:
- **UserPromptSubmit injection** — graft runs `graft ask` on each prompt and drops ranked map
  pointers into context BEFORE the agent decides to grep. The strongest lever; needs no cooperation.
- **MCP query tools** (`graft_find_code`·`graft_trace_calls`·`graft_file_api`·`graft_repo_map`·
  `graft_find_all`) + `graft ask`/`graft callers` CLI — the sanctioned "don't grep" path.
- **`.ignore` re-admit** (grep hits cards), **statusline** (tokens-saved), **pre-authorized
  `Bash(graft:*)`** (a retrieval call never raises a permission prompt).

The suite adds ONE thing: a CLAUDE.md/skill rule "the Command Center + graft answer this first."
No "hookify" needed — Claude Code's native hooks are the primitive; graft already uses them.
graphify's hard-deny is deliberately opt-in/fail-open — skip it (a blanket block strands agents).

## What we finally CONSUME (the under-the-rug list, closed by adoption)

- `signature` (85% of nodes) — stop re-deriving via `function_insight`.
- `--deep` per-node `summary`/`crux` prose — fill the Center's honest-empty `element_detail` (run
  `graft build --deep`; today's plain build leaves 100% `summary_state:pending`).
- Edge relations `contains`/`extends`/`implements` (~15.5k/twin) — file-API + type hierarchy.
- `method`/`class`/`type` nodes (2,006 + 440 + 913) — admit to the graph + the behind/hidden-mass metric.
- `exported` flag + `body_hash` — public-API filter + cheap drift trigger for review/pulse.
- graft's TS index — the frontend arm is now "consume graft," not "build a regex extractor."
- graphify (optional sidecar only): `rationale_for`/`WHY:` nodes + Leiden communities + god-node
  report. NOT the backbone — undirected, can't do who-uses/blast (rejected 2026-08-04).

## Verification (keep the discipline that caught the 24+8 defects)

- The Center's graph, once fed graft, gets the SAME badge-vs-panel + structural-sweep audit.
- graft's edges carry `confidence` (extracted vs inferred) — surface it (a FLOOR, not a census),
  matching the suite's existing graft trust-split.
- Batteries: a hermetic graft-fixture (a tiny wiring.json) → assert each Center section reads the
  right fields; dry-run on the twins READ-ONLY with coverage numbers in the commit.

## Phased sequence (each phase = the suite's slice discipline)

- **P0 — install + inventory.** `graft init` on a twin (or a copy); run `graft build --deep`;
  inventory every node field + edge relation actually populated. Enforcement live at this point.
- **P1 — code overview + architecture** consume graft facts (signature/edges/kinds), drop the
  re-derivation. The biggest, highest-value swap. Battery + coverage numbers.
- **P2 — frontend** = consume graft's TS nodes/edges + domain-classify (the Full 7-kind taxonomy),
  verified against the compiler oracle. (Supersedes the from-scratch `_a3_web` build.)
- **P3 — summary/crux prose** into `element_detail`; **communities** from graphify (optional).
- **P4 — wire `gabe-cc-entity` + the beats** to query the graft-fed map before rescanning (the
  un-deferred `--entity` flag) — the spine finally reads the map.
- **STAYS suite untouched:** board, ledger, releases (process data).

## Open questions for the operator

- Install graft in the twins directly, or in a COPY first (read-only-twin discipline)? graft
  writes into the repo (`graft/`, `.claude/`) — that dirties the tracked tree.
- `graft build --deep` uses an LLM pass — which model/key, and run cadence (per commit? on regen?).
- Does the Center keep its OWN entity/domain grouping layer on top of graft, or do we push that
  concept down (graft has no domain — the suite must own it; assume: suite keeps it).
