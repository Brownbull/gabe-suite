# Third-party code-graph benchmark — RESULTS

**Run:** 2026-08-04 · **Corpus:** gustify @ `7a09a454` · **Companion prompt:** [2026-08-04-third-party-tool-benchmark.md](2026-08-04-third-party-tool-benchmark.md)

Answers TEST 1 (1a/1b/1d) in full, TEST 2 at n=1. Written for the parallel suite-consolidation
session: every number carries its denominator, every claim carries its evidence strength.

---

## Verdict in one line

**Graft replaces grep for traversal. graphify does not, and cannot** — its graph is
undirected and a definition's edges point *outbound* at the types in its own signature,
so degree cannot separate live from dead.

---

## Method

Read-only. `git archive HEAD | tar -x` into a scratchpad copy; gustify and the suite were
never written to.

Corpus rules per the benchmark prompt — `docs/`, `.kdbp/`, `design-lab/`, `templates/`
stripped from the copy so `archmap.json` could not count as evidence of its own subjects'
liveness. Also stripped: `node_modules/`, `.venv/`, `dist/`, `build/`, `storybook-static/`,
`__pycache__/`, `test-results/`.

Resulting corpus: 363 `.py`, 633 `.ts`/`.tsx`, 2,767 files total, 29 MB.

```bash
# graft 0.8.2 — network install, then fully offline
npm install -g @nanonets/graft
cd <corpus> && graft build                    # 14.8s cold, no key, no network

# graphify 0.9.33 — network install, then fully offline
uv tool install graphifyy
cd <corpus> && graphify update . --no-cluster # 27.4s, no LLM
```

Both installed from the network; both **build** offline with no API key.

---

## TEST 1d — COVERAGE

| metric | archmap (baseline) | graft | graphify |
|---|---|---|---|
| files parsed | — | **1,009 / 1,009** | 1,173 (84 yielded zero nodes) |
| symbols indexed | 448 | **7,916** | 11,879 |
| edges | — | 20,600 | 33,352 |
| Python callables | — | 3,074 | — |
| TypeScript callables | **0** | **2,743** (+987 type-level) | covered |
| share of ~4,852 surface | **9.2%** | **≥100%** | ≥100% |
| cold build | — | **14.8s** | 27.4s |
| LLM / network at build | — | none | none |

graft's node breakdown: 5,355 function · 1,009 file · 906 type · 354 class · 211 method ·
81 interface. Languages detected: `python`, `typescript`, `tsx`.

graft exceeds the 4,852 denominator because it counts non-exported and test symbols that
the baseline denominator excluded. The honest statement is **full surface coverage**, not
a percentage above 100.

**Evidence strength: SOLID.** Direct counts from `wiring.json` and `graph.json`.

---

## TEST 1b — THE BLIND-SPOT BATTERY (the decisive test)

Ten symbols that are LIVE production code. The archmap falsely flagged all ten.

| # | symbol | blind-spot class | graft `callers` | + `grep` arm |
|---|---|---|---|---|
| 1 | `_check_technique` | pydantic `@field_validator` | ✗ | ✗ |
| 2 | `_refold_recipe_title` | SQLAlchemy `@event.listens_for` | ✗ | ✗ |
| 3 | `ws_gustify` | `@router.websocket` | ✓ | ✓ |
| 4 | `_BiasableRecipe.sweet` | `typing.Protocol` property | ✗ | ✗ (153 noisy hits) |
| 5 | `set_user_equipment_codes` | cross-file await | ✓ | ✓ |
| 6 | `TreeEdge` | re-export via `__init__.py` | ✗ | **✓** |
| 7 | `RecipeIngredientInput` | same-file composition | ✗ | **✓** |
| 8 | `seed_progression_trees_on_startup` | lifespan await | ✓ | ✓ |
| 9 | `EventBus.register` | test-only callers | ✓ | ✓ |
| 10 | `DishHistoryResponse` | Python → TypeScript | ✗ | **✓** |

**archmap 0/10 · graft `callers` alone 4/10 · graft two-arm 8/10.**

The three the second arm recovers are the three classes that hurt most: **re-exports**,
**test usage**, and the **cross-language boundary**.

The two permanent misses (`_check_technique`, `_refold_recipe_title`) have *zero textual
reference anywhere in the repo* — the framework invokes them through a decorator. **No
name-based tool reaches these.** That is the floor, not a graft defect. `_refold_recipe_title`
already carries a `# pyright: ignore[reportUnusedFunction]` comment in the source, which is
the human workaround for exactly this.

`sweet` is a `typing.Protocol` property whose bare name collides with a taste-axis code used
153 times; no tool separates those without type resolution.

### The posture difference matters more than the score

graft never says "dead". Its miss message is:

> `no indexed callers — the graph has no incoming call/reference edges for this symbol as
> written. Check the name (try the bare symbol, or "Type.method"), or find its uses with
> graft grep "<sym>". Fall back to raw grep -rn only for unindexed files`

The archmap **asserts** an orphan flag. graft **reports and hands you the next move**. A
~94%-false-positive assertion and a ~50%-incomplete report are not the same kind of error:
one misleads, the other routes.

**Evidence strength: SOLID.** All 10 hand-verified, both arms run.

---

## TEST 1a — KNOWN-DEAD RECALL

| symbol | graft `callers` |
|---|---|
| `get_pantry_item` | no indexed callers ✓ |
| `ReceiptIngestRequest` | no indexed callers ✓ |
| `CatalogPublishItem` | no indexed callers ✓ |
| `publish_catalog` (Protocol stub) | no indexed callers ✓ |

**graft 4/4**, and the contested `publish_catalog` reads the same either way — it is a
`Protocol` stub with body `...`, so "no callers" is correct whether you count it as dead
code or as an interface declaration.

**graphify 0/4 distinguishable.** All four carry graph edges. Reading them explains why:

```
get_pantry_item -> AsyncSession
get_pantry_item -> UUID
get_pantry_item -> PantryItem
```

Those are the types in its own signature, pointing **away**. Combined with `directed: false`
in `graph.json`, degree is not a liveness signal: all 10 blind-spots have edges, and so do
all 4 known-dead.

**Evidence strength: SOLID.**

---

## TEST 2 — LANDING-SITE PREDICTION (n=1 — WEAK EVIDENCE)

Commit `b31862d4` (recipe search stops depending on accents), parent `eda861d8` built
read-only. Graph-only, no free-text grep, **4 tool calls**.

Ground truth, 5 files under `apps/api`:

| file | predicted? | note |
|---|---|---|
| `services/recipe_filters.py` | ✓ | call 1 |
| `models/recipe.py` | ✓ | call 4 |
| `services/text_search.py` | ✗ | **CREATED by the commit** |
| `tests/test_recipe_search.py` | ✗ | not queried for |
| `tests/test_text_search.py` | ✗ | **CREATED by the commit** |

| metric | value |
|---|---|
| precision | 0.50 (2 TP / 2 FP) |
| recall, all 5 | 0.40 |
| recall, src-only (3) | 0.667 |
| recall, src-only minus files the commit CREATED | **1.000** |
| tool calls | 4 |

Two of the five files did not exist at the parent commit. **No graph predicts a file that
does not yet exist** — the baseline's own scoring must be checked for how it handled this.

**graft indexes tests.** Proven separately: it returned four test callers of
`EventBus.register` (`test_event_bus.py` ×2, `test_p29_hardening.py`, `test_progression.py`)
and the test caller of `ws_gustify`. The archmap indexes no tests at all, and **16 of its 22
landing-site misses were test files** — that gap is structurally closed.

**Evidence strength: WEAK — n=1 of 8 commits.** Not yet comparable to the baseline's
0.683 / 0.560 / 0.813 / 79 calls. The full 8-commit protocol is the outstanding measurement.

---

## Context cost — the actual pain

graft self-reports per call. Across the 10 battery calls: **~53,850 tokens saved** versus
reading the covered files whole (94–100% reduction per call).

`graft map` renders the entire 1,009-file repo — directory clusters, per-directory hubs with
in-degree, global hotspots — in **653 words**:

```
repo map — 1009 files · 6907 symbols · 20600 edges · python, tsx, typescript

## apps/api/
apps/api/services/  48 files · 333 symbols   hubs: list_recipes (recipes.py, 84←), ...
apps/api/auth/       3 files ·  24 symbols   hubs: require_household (context.py, 54←), ...
```

### ⚠ Counter-finding: `graft ask` is not reliably cheap

`graft ask "recipe search query matching titles"` returned a **single ~3,000-token
signature** — gustify's `search_recipes` carries 40 `Query(...)` params with inline prose
descriptions, and `ask` prints full signatures.

- **If ignored:** `ask` becomes the most expensive call on exactly the god-functions you most need
- **Cost now:** wire `map` → `grep` → `callers`; gate `ask` behind them
- **Cost later:** an agent instructed to `ask`-first burns more context than the grep it replaced
- **Distance:** fires on any FastAPI file with documented query params — true today
- **Verdict: act now**

The cheap arms are `map` (whole-repo orientation), `grep` (hits grouped by enclosing symbol,
with in-degree) and `callers` (direction-aware, `--direction out`, `--depth N|all`).

---

## The two rejected tools

| tool | what it is | why not |
|---|---|---|
| **codesight** | 8 parallel detectors → `CODESIGHT.md`, `routes.md`, `schema.md`, `graph.md` | Detector summaries, not a traversable graph. A session-opener, not a grep replacement. |
| **codemap** (Go) | tree / `--diff` / `--deps` / `--importers`, MCP server, daemon | Directory altitude, not symbol level. `--deps` needs `ast-grep`. No reference edges. |

Neither carries symbol-level reference edges, so neither answers "who uses this".

**graphify is not worthless** — it is answering a different question. It retains value for
communities (Leiden), god-nodes, `A → B` shortest path, and `rationale_for` edges: it turns
`# NOTE:` / `# WHY:` comments and ADR citations into first-class graph nodes (1,533 of them
in gustify). graft has no equivalent. Its `re_exports` relation (104 edges) is also a class
the archmap misses entirely.

---

## Capability diff — what a name-regex cannot express

| capability | archmap | graft |
|---|---|---|
| import resolution | ✗ | ✓ tree-sitter AST |
| cross-file call edges | ✗ | ✓ 20,600 edges |
| edge direction | ✗ | ✓ `--direction out` / in |
| in-degree per symbol | ✗ | ✓ reported by `grep` |
| transitive blast radius | ✗ | ✓ `--depth N|all` |
| re-export following | ✗ | via `grep` arm |
| test indexing | ✗ | ✓ |
| TypeScript | ✗ | ✓ 2,743 callables |
| cross-language edges | ✗ | ✗ (sees both sides as separate nodes) |
| decorator awareness | ✗ | ✗ |
| type binding | ✗ | ✗ |

Note the last three rows: graft **surfaces** the Python and TypeScript `DishHistoryResponse`
as two separate nodes and does not link them. The `grep` arm finds the cross-language usage
textually; the graph does not carry the edge.

### One false edge, flagged

`graft callers register` returned `initAnalytics (apps/web/src/lib/analytics.ts)` alongside
the four real Python test callers. That is a **name collision** — a different `register`.
graft resolves by name where it cannot resolve by import, which is the same failure class as
the archmap's, at a far smaller scale. Do not assume graft edges are collision-free.

---

## What must NOT be copied

1. **Do not adopt an assertion posture.** graft's value is partly that it says "no indexed
   callers, go grep" rather than "orphan". Any suite surface that converts a graft empty
   result into a dead-code claim reintroduces the ~94% false-positive problem in a new coat.
2. **Do not trust `ask` as the default query.** See the counter-finding.
3. **Do not assume name-resolved edges are real.** The `register` collision is proof.
4. **Do not expect decorator or type-binding awareness.** Blind spots 1, 2 and 4 remain
   unsolved by any name-based tool, graft included.

---

## Reproduction

```bash
SP=<scratchpad>
git -C /home/khujta/projects/apps/gustify archive HEAD | tar -x -C $SP/gustify-corpus
cd $SP/gustify-corpus
rm -rf docs .kdbp design-lab templates node_modules .venv dist build storybook-static test-results
find . -name __pycache__ -type d -prune -exec rm -rf {} +
graft build                      # 14.8s
graft callers <symbol>           # inbound edges
graft callers <symbol> --direction out
graft grep <symbol>              # grouped by enclosing symbol, with in-degree
graft map                        # 653-word whole-repo orientation
graphify update . --no-cluster   # 27.4s
```

Artifacts left in scratchpad: `gustify-corpus/` (HEAD) and `gustify-p2/` (parent `eda861d8`),
each with a built `graft/` and `graphify-out/`.

---

## Outstanding

1. **The full 8-commit landing-site protocol.** The one number still missing, and the only
   one directly comparable to the baseline's 0.813 / 79 calls.
2. **Whether `graft/` gets committed or gitignored** in a suite-integrated project.
3. **Integration shape** — replace / augment / retreat. Under analysis in the companion
   recommendation.
