# Parallel-session prompt — benchmark third-party code-analysis tools against our baseline

Paste everything below the line into a fresh session. It is self-contained.
Bring the results back here and we will score them against the Gabe Center's own numbers.

---

## CONTEXT (you have none — read this first)

I maintain a command center that computes per-symbol "usage" and an "orphan" flag for a
FastAPI + React codebase. An audit proved that flag is **~94% false positive**: it is a
bare-name regex over only the files a config file adopts (23.5% of the repo's Python, 0%
of its TypeScript). It cannot see decorators, tests, re-exports, route tables, the app
bootstrap, `typing.Protocol` members, or any cross-language reference.

I want to know whether a real static-analysis tool does better, and by how much. Your job
is to run one or more third-party tools against the same repo and report numbers in a
format I can compare directly.

**Repo:** `/home/khujta/projects/apps/gustify`
**Stack:** Python 3.13 FastAPI backend at `apps/api/`, React/TypeScript at `apps/web/`,
shared types at `shared/`, Alembic migrations, pytest under `apps/api/tests/`.

Do not modify the repo. Read-only measurement. Materialize with `git archive` or work on a
copy if a tool needs to write.

## CORPUS RULES (identical rules or the numbers are not comparable)

**Include:** `apps/api/**`, `apps/web/**`, `shared/**`, `scripts/**`, `alembic/**`.
**Exclude:** `node_modules/`, `.venv/`, `venv/`, `dist/`, `build/`, `storybook-static/`,
`__pycache__/`, `.git/`, `docs/_archive/`, `test-results/`.

**CRITICAL — exclude `docs/`, `.kdbp/`, `design-lab/`, and `templates/` from any
REFERENCE corpus.** `docs/site/center/archmap.json` names every function in the repo, so a
naive whole-repo text scan finds zero dead code because the map counts as evidence of its
own subjects' liveness. Our audit hit this trap; do not repeat it.

State whether each tool was run offline or needed a network install, and give the exact
command line for every run so the numbers are reproducible.

---

## TEST 1 — DEAD-CODE DETECTION

Run each tool you want to evaluate. Suggested candidates (use any, add others):

- **Python:** `vulture`, `pyright --outputjson` (`reportUnusedFunction`), `ruff` (F401/F811),
  `deptry`, `flake8-dead-code`, `Semgrep`, `CodeQL`, `Sourcery`
- **TypeScript:** `knip`, `ts-prune`, `ts-unused-exports`, `depcheck`, `Madge`
- **Cross-language / graph:** `CodeQL`, `Joern`, `Sourcetrail`, `Understand`, `Sourcegraph`

### 1a — RECALL against known-dead (the tool should FLAG these)

These four are hand-verified dead in gustify — whole-repo greps across `.py`, `.ts`, `.tsx`,
`.json`, `.yaml`, tests, and migrations found no reference:

| symbol | file | note |
|---|---|---|
| `get_pantry_item` | `apps/api/services/pantry.py:216` | cleanest case; exactly one repo-wide hit, its own def line |
| `ReceiptIngestRequest` | `apps/api/schemas/gastify.py` | deferred-integration contract (decision D43) |
| `CatalogPublishItem` | `apps/api/schemas/gastify.py:64` | same dead island |
| `publish_catalog` | `apps/api/integrations/gastify_exchange.py:43` | **contested** — a `typing.Protocol` stub with body `...`; count it separately, both ways |

Report: how many of the four does each tool flag?

### 1b — THE BLIND-SPOT BATTERY (the tool should stay SILENT on these)

**This is the decisive test.** All ten are LIVE production code. Our detector falsely
flagged every one of them. A tool that stays silent on all ten is doing real work; a tool
that flags them is making the same mistake we are.

| # | symbol | file | why it looks dead but is not |
|---|---|---|---|
| 1 | `RecipeStepInput._check_technique` | `apps/api/schemas/recipe.py:35` | pydantic `@field_validator` — framework calls it |
| 2 | `_refold_recipe_title` | `apps/api/models/recipe.py:480` | SQLAlchemy `@event.listens_for` (before_insert/before_update) |
| 3 | `ws_gustify` | `apps/api/api/recipe_stream.py:161` | `@router.websocket` — live endpoint, 90 test cases |
| 4 | `_BiasableRecipe.sweet` | `apps/api/guardrails/novelty.py` | `typing.Protocol` `@property`, body is `...` |
| 5 | `set_user_equipment_codes` | `apps/api/services/recipes.py` | imported + awaited from `apps/api/api/equipment.py` |
| 6 | `TreeEdge` | `apps/api/models/progression.py` | re-exported via `apps/api/models/__init__.py:48` + `__all__` |
| 7 | `RecipeIngredientInput` | `apps/api/schemas/recipe.py:14` | composed by its own module at `:63` (same-file usage) |
| 8 | `seed_progression_trees_on_startup` | `apps/api/services/` | awaited from `apps/api/main.py:93` lifespan |
| 9 | `EventBus.register` | `apps/api/events/bus.py:35` | production callers gone; **3 test files still call it** |
| 10 | `DishHistoryResponse` | `apps/api/schemas/` | consumed only by TypeScript (`shared/api-types.ts`, `apps/web/src/features/**`) |

Report per tool: **how many of the ten it correctly stays silent on**, and for each one it
flags, which blind-spot class it fell into.

### 1c — PRECISION on the tool's own output

Take the tool's full flagged set. If it exceeds 30, take a stratified sample of 30. Hand-verify
each: ripgrep the symbol across the whole repo INCLUDING tests, migrations, config, and
TypeScript, and read the defining file to check for framework invocation.

Classify each as: `TRUE_DEAD` · `FRAMEWORK_INVOKED` · `TEST_ONLY` · `RE_EXPORT` ·
`CROSS_LANGUAGE` · `DYNAMIC_DISPATCH` · `UNCLEAR`.

Report precision = TRUE_DEAD / sampled, with the sample size stated.

### 1d — COVERAGE

How many symbols does the tool examine, out of what surface? Our measured denominators:

- Python: **2,602** repo defs · **692** production-backend defs (`apps/api/`, non-test)
- TypeScript: **~2,250** value exports (`export function|const|class` + defaults)
- Combined non-test callable surface: **~4,852**

### BASELINE TO BEAT (Gabe Center's archmap, measured)

| metric | archmap |
|---|---|
| symbols examined | 448 of ~4,852 = **9.2%** |
| TypeScript examined | **0** |
| flagged | 84 functions + 14 models = 98 |
| verified dead among flagged | **3–4** |
| precision | **~4%** |
| blind-spot battery passed | **0 of 10** |

Independent cross-checks we already ran, for reference: `vulture 2.16` with a decorator
ignore-list gave **4/692 = 0.58%** in the production backend; a scope-blind ripgrep pass gave
**0.4%**; `knip 5.88.1` on `apps/web` gave 9 unused exports + 39 unused types + 1 unused file.
A tool that lands near 0.4–0.6% on the Python backend is agreeing with our controls.

---

## TEST 2 — LANDING-SITE PREDICTION (only for tools that build a real call/reference graph)

Skip this unless the tool produces a traversable graph (CodeQL, Joern, Sourcetrail,
Understand, Sourcegraph, pyan, code2flow).

**The question:** given a change request in plain language and the codebase as it stood
*before* the change, can the tool's graph identify the files the change actually had to touch?

For each of the eight commits below: check out the **parent** read-only
(`git -C <repo> archive <parent> | tar -x -C <tmp>`), build the tool's index at that state,
then use ONLY the tool's graph — no free-text grep — to predict the files the task requires.
Score precision and recall against the ground truth, and **count the tool invocations used**.

| # | commit | parent | entity | task (paths and symbol names removed on purpose) |
|---|---|---|---|---|
| 1 | `166e6da6` | `fefd625c` | pantry | Give the pantry's storage-location ordering and its active/inactive toggle a persistent server-side home so they survive a reload. Reject deactivating the main location; reject an explicit null toggle; pick column defaults so pre-existing locations keep rendering. |
| 2 | `b31862d4` | `eda861d8` | recipe | Make recipe search stop depending on accents, so a query typed without diacritics matches titles that carry them. |
| 3 | `aa6b5619` | `297abcf1` | legal-consent | Implement a real personal-data export behind a new account endpoint, and wire the existing "download" affordance to it. |
| 4 | `46f8a9d0` | `4f0e8515` | auth | Enforce consent server-side: completing account setup must require accepting the current terms, not merely showing them. |
| 5 | `701d62c6` | `f9607bbb` | cooking | Scope cooking-step progress to the owning user (an IDOR fix) and give the client a server-side read path for it. |
| 6 | `a7d9ac6d` | `565d19e0` | progression | Add a fifth progression tree covering flavor, with the same shape as the existing four. |
| 7 | `6966a5ae` | `05c40e40` | allergen | Merge the dietary settings into a single preferences collection and collapse the surface to two sections. |
| 8 | `9e9eafbf` | (from git) | allergen | Close the remaining allergen-bypass vectors and make the "bought" replay idempotent. |

**Ground truth** (files the commit actually touched under `apps/api`) — get it with
`git -C /home/khujta/projects/apps/gustify show --stat <sha> -- apps/api`.

Score twice: **all `apps/api` files** and **non-test source only**. Report both.

### BASELINE TO BEAT (measured on these exact commits)

| arm | precision | recall (all) | recall (src-only) | tool calls |
|---|---|---|---|---|
| archmap edges only | 0.683 | 0.560 | 0.813 | 79 |
| plain grep, uncapped | 0.738 | 0.900 | **1.000** | 160 |

The archmap arm missed **22 files**; **16 were test files** (it indexes no tests at all).
Any graph tool that indexes tests should beat it there — that is the interesting number.

---

## OUTPUT FORMAT (so results can be merged with ours)

For each tool, report:

1. Tool name, version, exact command line, offline or network-installed.
2. TEST 1a: known-dead found, `N/4` (state the `publish_catalog` call both ways).
3. TEST 1b: blind-spot battery, `N/10` silent — plus which ones it flagged and why.
4. TEST 1c: precision on its own output, with sample size and the classification tally.
5. TEST 1d: symbols examined / surface, and whether TypeScript was covered.
6. TEST 2 (if run): per-commit precision/recall/calls table + pooled, both scopings.
7. **Setup cost**: wall-clock to install, configure, and produce a first result. A tool that
   needs a two-day CodeQL database build is a different proposition from `vulture`.
8. **What it can express that a name-regex cannot** — import resolution, type binding,
   decorator awareness, cross-file call edges, cross-language edges. Be concrete.
9. Anything the tool got wrong that we should not copy.

State every caveat. A number without its denominator and its exclusion list is not usable.
