# Extractor gateway — synthesis

## The verdict

**The Arms Register wins the spine; the Concept Bench becomes its Phase 2, triggered by the second implementation of a concept, not by the calendar.** Grafted in: the Fact Seam's route-record fields (`path_is_url`, `implicit`) and its **inverted write rule**, the Concept Rosters' `needs=(...)` input declarations and IMPLIES table, and the Stack Gateway's `unsupported_language` word plus per-root scoping (deferred to Phase 2). **The Stack Gateway loses** — its 250-line pack budget and its ban on `ast.walk`/`rglob` inside a pack structurally forbid the first real third stack (Django's urls.py→views.py two-pass), its merge law trades silent absence for silent resolution by pack-id sort, and its S4 converts 15 `global` memos plus the two import-time globals at `_a3_code.py:127-132` in one unsplittable commit.

One sentence of why: the pipeline's mess is 28% of six files and its *lie* is 100% of every zero, so buy the anti-lie first at ~450 lines and let the second detector — not an architect's forecast — pay for the split.

## The architecture

New/moved files under `templates/center/generators/`:

```
_a3_code.py        4,390 → 2,955   content unchanged; gains CONCEPTS, probe(), reset_caches(), __getattr__ tombstone
_a3_codetab.py     NEW  1,435      build_code_tab lifted whole (_a3_code.py:2920-4354); 2 callers: _a3_feature.py:22, build_center_a3.py:1593
_a3_arms.py        NEW  ~200       CONCEPTS · SENTINELS · IMPLIES · census(amap, repo) → amap["arms"]
stacks/__init__.py NEW   ~90       the REGISTER (60 lines data) + PSEUDO_ROOTS + resolve()
stacks/ts_next.py  NEW   ~45       parse_action_roots + the four _ACTION_* constants (_a3_code.py:4355-4390)
stacks/sql_ddl.py  NEW   ~60       CREATE TABLE / SELECT..FROM in string literals  (step 8)
tests/arms/run.sh  NEW              register + census + probe-cannot-select battery
```

**Detector mechanics.** The register is a tuple of `Stack(name, lang, module, concepts, keys)` rows; `module="_a3_code"` appears seven times because **nothing is relocated in Phase 1**. `probe()` returns, per concept: `{scanned, matched, evidence[≤5], reason}` — never raises. **The register never selects**: every registered module's producers run unconditionally, exactly as `build_center_a3.py:2011-2105` runs them today, and `tests/arms/run.sh` mutation-pins it (force a probe to 0 → feeds byte-identical). This is the deliberate refusal of `_a3_web._detect_idiom` (`_a3_web.py:266-276`), whose `max(sorted(counts))` is winner-take-all and already forced SSE out of the roster into a separate always-on pass. `keys` declares which of the 16 published archmap keys a module may fill; the census fails the battery if any other top-level key appears.

**Producer contract, field by field** (frozen — no `stack`/`dialect`/`lang` field is added to any record):

- **R1 route** — `method` (verb, or a member of `stacks.PSEUDO_ROOTS = {BOOT,TASK,ACTION}`) · `path` · `fn` · `file` · `touches[]` · `touches_x[]` · `doc` · `resp` · `status`; optional `stream` · `middleware` · `flags`. **Two grafted fields**: `path_is_url: bool` (false for pseudo-roots — the permission slip that stops `_a3_models._segs` and `entity_shape.url_domain` splitting `createTodo` as a URL domain) and `implicit: bool` (a DRF ViewSet route whose handler is inherited and absent from the repo).
- **R2 table** — `cls` (**nullable**, grafted: a `CREATE TABLE` literal has no class) · `table` · `file` · `doc` · `cols[(name,type,desc)]` · `fks{col:"table.col"}` · `rels[]` · `uqs[]`.
- **R3 schema** — `cls` · `file` · `fields[(name,ann,desc)]` · `doc` (+`orm`, +`homed_from/why`).
- **R4 access** — `{model: str|None, table, rw}` + sibling `commits`. `model` becomes nullable; the one consumer cost is `_a3_graph.py:722` (`own_classes.get(op["model"])`) gaining a table-keyed fallback, ~4 lines. This is the universal endpoint→table road: the BOOT node draws 61 data edges with `touches: []`.
- **R5 gate** — `name` · `via` (open string; `_a3_graph.py:697` copies it verbatim, so `class-attr`/`arg-mw` cost nothing) · `gate` · optional `callee`.
- **R6 task** — `name` · `fn` · `file`. **R7 graft edge** — `{s,t,ss,ts,conf}` + optional `rel`.

| concept | shared / per-stack | today's producer | Phase 1 → Phase 2 target |
|---|---|---|---|
| request_roots | per-stack **join**, shared mint | `_a3_code.py:417` · `:1179` · `:2783` · `:4361` | register rows `py_fastapi`,`py_queues`,`ts_next` → `stacks/py_fastapi.py`, `stacks/ts_next.py` (step 6) |
| mounts | **shared** (115 lines, 6 name FastAPI) | `_a3_code.py:290` | `concepts/mounts.py` — parameterized against 2 real callers |
| gates | site per-stack, **judgement shared** | `_a3_code.py:2119`; `_is_mw_gate` `:1991` | `_is_mw_gate` → `concepts/gates.py` verbatim |
| tables | per-stack (2 idioms known) | `_a3_code.py:220` · `:644` | `stacks/py_sqlalchemy.py` + `stacks/sql_ddl.py` |
| access | symtab **shared**, 3 frozensets per-stack | `_a3_code.py:1700`; verbs `:1671-1675` | `concepts/access.py` + per-stack `Verbs` |
| queues | ~90% shared name-join | `_a3_code.py:2716` | `stacks/py_queues.py` |
| providers | roster shape shared | `_a3_code.py:1853` | `stacks/py_providers.py` |
| census | **shared**, `lang` parameterized | `_a3_code.py:925`/`:1032`/`:1097` (`rglob("*.py")`, `"lang":"py"` at `:1076`,`:1086`) | `concepts/census.py` |
| call_graph | **shared / language** | `_a3_graft.py:861` | unchanged |
| fetch_bridge | per-stack roster, already pluggable | `_a3_web.py:395` | unchanged (it is already the bench) |
| fe_structure | per-stack | `_a3_fe.py:751` | unchanged |

## Honest-empty — the anti-lie rule

**Invariant (from the Fact Seam, inverted write rule):** *an archmap key may be written only when the arms block carries a state record for its concept; a key written with no state record is a battery failure.* Today `build_center_a3.py:2011-2105` writes ~22 keys behind `if non-empty` guards, so a missing key means both "full coverage" and "no arm exists" — and all 130+ external readers do `.get(key)` with an empty fallback.

Five words per concept, computed from the probe's two integers plus sentinels:

- `present` — matched and produced; names `by: [module,…]`.
- `empty` — every installed detector ran (`scanned > 0`), matched nothing, no sentinel fired. **The honest zero.**
- `unmatched` — produced 0 **and** (`scanned == 0` or a sentinel hit). **The keypro state.**
- `contested` — two arms claim overlapping evidence (the `("src",)` last entry of `_WEB_ROOTS` at `_a3_web.py:49` makes `_detect_web_root:78` call a NestJS backend the frontend; `present=True` with wrong content).
- `unsupported_language` (grafted from the Gateway) — no grammar exists. graft ships python/javascript/typescript/go only, so "0 fn_nodes because nothing calls anything" and "because no Ruby provider exists" stop being the same number.

**SENTINELS** are the piece no rival has: a ~5-line literal-substring roster per concept (`CREATE TABLE`, `pgTable(`, `@Entity(`, `models.Model`, `$queryRaw`, `@Controller`, `urlpatterns`, `@UseGuards`, `new Queue(`), counted over the already-globbed tree, evaluated **only when a concept produced zero**, reporting the hit count and ≤5 files. Verified premise: `grep -rlE "CREATE TABLE|INSERT INTO" templates/center/generators/*.py` returns **nothing** — keypro's 15 statements were invisible because no line of code anywhere was capable of noticing. A sentinel catches a concept for which *no detector was ever written*; a state word only covers concepts already in a roster.

**IMPLIES** (grafted from the Concept Rosters): `(tables→access), (roots→gates), (structure→bridge), (roots→access)`. Left fired, right unmatched ⇒ a note in the voice of the hand-written one-off this replaces: `mapquery.py:314`'s `schemas_zero` ("the schema arm extracted nothing across %d endpoint(s) — an EMPTY arm, not a clean one") is deleted and subsumed.

**Surfaces** (all already fire — no remembered process): `archmap["arms"]`, diffable in a PR · `map_health`'s one line (`mapquery.py:292`, reusing `HEALTH_STATES` at `:279`) · `map_census` gains an `arms` section · `/gabe-pulse` **S19** · the Universe's Sources rows beside `unparseable`/`route_mounts`/`fn_similarity`. Report-never-gate throughout.

## Migration

Byte-identity for every step: `scripts/map-baseline.sh check` (its header already names this work) against the three blessed manifests in `tests/baselines/` (gustify/gastify/tier3, `.sha256` + `.census.json`, blessed 2026-09-11). PASS = 0 changed files **and** identical census. Serial only (WSL2 rule).

| # | change | battery | byte-identity | coherent if you stop here |
|---|---|---|---|---|
| 1 | Lift `build_code_tab` (`_a3_code.py:2920-4354`, 1,435 lines, 351 tag lines) → `_a3_codetab.py`; update `_a3_feature.py:22` + `build_center_a3.py:1593`; keep a re-export | tests/center, tests/orm-access | full check, all three | **Yes** — `_a3_code` is 33% smaller, zero behaviour |
| 2 | `stacks/__init__.py` register + `CONCEPTS`/`probe()`/`reset_caches()` on `_a3_code`; adapt the three `{present,reason,stats}` arms; nothing calls probe | **tests/arms** (rows resolve · `row.concepts == module.CONCEPTS` · MUTATION: probe→0 leaves feeds identical) | full check | **Yes** — an inert, documented table |
| 3 | **★ FIRST VISIBLE VALUE** `_a3_arms.census()` + SENTINELS + IMPLIES; one line after the producers; `"version": 3` → 4 (`build_center_a3.py:2011`) | tests/arms | c4-graph + levels byte-identical; `jq 'del(.arms)\|.version=3'` on archmap diffs clean; gustify reports `present` on every concept | **Yes** — the map can say "no detector for your stack" |
| 4 | Readers: `map_health` arms block (delete `mapquery.py:314`), `map_census` arms section, pulse **S19** | tests/gabe-map, tests/pulse-angles | feeds untouched | **Yes** |
| 5 | `stacks.PSEUDO_ROOTS` + `path_is_url` replace the literal rosters at `_a3_graph.py:1398` · `_a3_models.py:243`,`:256-257`,`:432` · `_a3_homing.py:149` · `tools.py:20` · `draft-workflows.py:40` | tests/arms **synthetic ACTION fixture**, mutation-proven per site | gustify `action_roots: 0` ⇒ byte-identical **by construction** — hence the second gate | **Yes** — five live ACTION bugs closed |
| 6 | `parse_action_roots` + `_ACTION_*` → `stacks/ts_next.py`; `__getattr__` tombstone + `reset_caches()`; battery assert: zero `.ts` globs in `_a3_code.py` | tests/action-roots (retargeted; 3 mutants still killed) | full check | **Yes** — the overfit is out of the Python scanner |
| 7 | `needs=("access",)` on `derive_endpoint_access` (`_a3_graft.py:373`), `derive_fn_roles` (`:447`), `derive_distance_to_write` (`:494`) — an unmatched concept stamps its word instead of 152 lines returning `{}` | tests/arms | full check | **Yes** — flat `fed2w` stops rendering confident |
| 8 | `stacks/sql_ddl.py` (R2 with `cls=None`) + raw-SQL access ops (R4 with `model=None`) + the `_a3_graph.py:722` table-keyed fallback | tests/stack-sql FIRE+SILENT, mutation-proven | full check (no raw SQL under the three targets' claim roots) | **Yes** — keypro draws 2 tables, 15 ops |
| 9 | **NOT SCHEDULED.** The Concept Bench split — `concepts/{mounts,access,gates,census}.py` + `stacks/py_*.py`. **Trigger: the second implementation of one concept** (a Django or Prisma detector reaching for `_mounts_for`/`_orm_access`). Factor against two real callers, never one imagined one | — | — | — |

## Costs and what this forecloses

Steps 1–8 are **days**, ~450 new lines + 1,480 relocated. Step 3 is the only non-byte-identical one and its gate is explicitly weaker (strip-diff). Step 5 is the widest blast radius asked for: seven sites across two generators and two skills in one commit, gated by a synthetic fixture because gustify cannot see it. Step 9 is **weeks** and is deliberately unpriced until triggered.

What this makes harder, on purpose: **a concept that does not fit a frozen record.** GraphQL has no `(method, path)` — the node id (`_a3_graph.py:691`), the bridge key (`:243-258`) and derived-cluster naming (`_a3_models.py:432-434`) all read `path` as a URL. Under this design you widen the record for everyone or register the concept `unsupported` and let the census say so; you cannot quietly stuff `Query.orders` into `path`, which is exactly what ACTION did and exactly why five consumers are wrong today. Also harder: factoring `_mounts_for` or `_orm_access`'s symtab **now** — correct, since `build_fe` (`_a3_fe.py:224`, 500 lines, ~15 naming an idiom) is the standing proof that factoring from a sample of one duplicates 480 shared lines per stack.

What stays broken after step 8, stated plainly: the graft bare-name false resolution (`formData.get` → `FakeConversationHistory.get`, 8 of 23 keypro edges, worse on Node where `.get/.set/.use/.on` are Express's surface) and the `.js/.mjs/.jsx` drop at `_a3_graft.py:49,141` that zeroes a plain-JS backend's whole call graph. Both are `graft` register rows with sentinel-shaped probes; neither is in this plan. Fix them next, as their own steps, with the ambient-roster downgrade that finally gives the already-carried-but-unrendered `conf` a consumer.

## Scorecard

| design | third-stack cost | landability | honest-empty + maintenance | total |
|---|---|---|---|---|
| **Arms Register** (chosen spine) | 3.5 | **9.5** | **9.0** | **22.0** |
| Concept Rosters (→ Phase 2, step 9) | **8.0** | 7.5 | 6.0 | 21.5 |
| Fact Seam (record fields + write rule grafted) | **9.0** | 5.5 | 7.0 | 21.5 |
| Stack Gateway (rejected; `unsupported_language` + root scoping grafted) | 6.5 | 4.5 | 5.0 | 16.0 |

The tradeoff being accepted: **the winner scores 3.5 on the third-stack lens.** When Django arrives, its implementer edits the shared 2,955-line `_a3_code.py` — `_mounts_for` still fused to `include_router`, `parse_models:644` still hard-gated on `Mapped[`. That is the bill for step 9, and it is the bill this plan deliberately defers rather than pre-pays on a forecast.
---

# Build log

## Step 1 — `build_code_tab` leaves `_a3_code` (`0b45682`)

Pure move. `_a3_code.py` 4,390 → 2,979; `_a3_codetab.py` holds the 1,422-line renderer and imports
the 50 names it needs back. Two callers repointed; `_a3_code` keeps a lazy PEP-562 re-export so
`_a3_code.build_code_tab` still resolves without a circular import. **Proven inert**: the pre-lift
tree checked against the blessed baselines — 82/80/75 files byte-identical, census identical.

Found on the way, NOT caused by the lift: `_a3_render._row_mark` stripped tags with `""` before
scrubbing volatile time, so `31d ago<br><small>node…</small>` collapsed to `31d agonode…` and
`\bago\b` could not match. The age rode into the row digest and every day-tick re-badged an
unchanged row NEW. The scrub now runs on the RAW cell. `texts` is left alone deliberately — it is
the KEY material, and rewriting it re-keys 3,988 stable rows to fix 14 volatile ones. Measured:
0 keys churned, 14 of 7,422 hashes corrected. `tests/center` +4 assertions, 2 mutants killed.
The battery already HAD a relative-time case; it passed throughout because its cells were bare
text with no adjacent markup to glue to.

## Step 2 — the arms register, inert (`ba1c86a`)

`_a3_stacks.py`: 10 rows, 12 concepts, 7 rows on `_a3_code`. `_a3_code` gains `CONCEPTS`, `probe()`,
`reset_caches()`. Nothing calls probe — 82/80/75 byte-identical. The register states the overfit
out loud: **tables · access · gates · mounts · queues · providers · schemas resolve to `py` only.**

Three review catches:
1. The plan said `stacks/` PACKAGE. `bootstrap_center.sh:38` and `propagate.sh:25` copy generators
   with a flat `*.py *.mjs *.sh` glob — a subdirectory ships nowhere, and every adopting project's
   build would die on `import stacks` the day the census called it. Flat `_a3_stacks.py` instead.
2. `probe()` scanned the center's OWN machinery. An adopting repo carries the generators under
   `scripts/`, and those are full of `APIRouter`/`Depends(`/`table=True` because they are what LOOKS
   for them — so keypro-front, a Next.js app with zero Python, probed positive for FastAPI on all
   nine concepts. The census's own instrument telling the census's own lie.
3. The cannot-select proof passed as a SKIP, then VACUOUSLY, then while a real SELECT mutant
   survived (a Python-only fixture makes the gated producer empty either way). Fixture is now
   polyglot; the mutant is caught.

## Step 3 — the census (`this commit`) · FIRST VISIBLE VALUE

`_a3_arms.py` (228 lines) writes `archmap["arms"]`, archmap version 3 → 4. Five state words:
`present` · `empty` (the honest zero) · `unmatched` · `unsupported_language` · `contested`.
SENTINELS run only for a concept that produced zero, in ONE bounded pass (merged from two; 11.7s →
7.1s on gustify). IMPLIES catches an arm whose dependent silently produced nothing.

**Gate, exactly as the plan specified:** `c4-graph.json` · `levels.json` · both `.js` twins
BYTE-IDENTICAL; archmap equal after stripping `.arms` and restoring version 3; 81 of 82 files
untouched.

What it now says, where a bare zero used to sit:

| repo | reading |
|---|---|
| gustify · gastify | 8/9 present; `queues: empty — no Celery/ARQ/Taskiq task or enqueue site in any scanned .py` |
| tier3 | `schemas: unmatched — the arm's own idiom appears in 366 of 3,225 scanned file(s), yet it extracted nothing — an EMPTY arm, not a clean one` |
| keypro-front | `tables: unmatched — 2 file(s) show this concept as raw SQL DDL … no registered arm reads that idiom`; `access: unmatched — 5 file(s) …`; six concepts `unsupported_language — arms cover ['py']; this tree is ['ts']` |

The tier3 line is a real finding the map had been hiding as a zero.

Five counting/scoping defects found by review before this shipped:
1. `gates` counted only `app_middleware`, reading **0** on gustify while **81** endpoint gates were
   drawn — a false `empty` on a plainly present concept, told by the file built to kill false zeros.
2. `file_census.claimed` is an **int** on this pipeline, not a roster.
3. `call_graph`/`fetch_bridge`/`fe_structure` already emit their own `{present, reason}` into
   `c4-graph.json` stats. Measuring them here would put one truth in two files and invite drift —
   the block POINTS at them (`ELSEWHERE`) instead.
4. `produced == 0` while the arm's OWN idiom is present is a BROKEN arm, not a clean zero. Without
   this branch tier3's schemas rendered as a tidy `empty`.
5. `unsupported_language` must never be claimed from a CAPPED walk — a partial language census
   would be a confident wrong answer.

`tests/arms` 4/4, **6 mutants killed** (no-sentinel · no-broken-arm · no-unsupported · cap-blind ·
measure-c4-twice · register-selects). The cannot-select test strips the arms block before
comparing — the block is commentary that is SUPPOSED to reflect the probes; comparing it would
assert the census does not work.
