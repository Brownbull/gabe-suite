# Plan — element forms: from a drawn form to a generator pass (2026-09-13)

**Status:** PHASES 0–3 LANDED. The operator accepted gustify's `forms.json` (2026-09-14): the pass is ON by default
(`forms: false` / `GABE_FORMS=0` turns it off), all four baselines re-blessed with forms in the roster and five forms
measures in the census, the twins propagated. Phases 4–6 wait on their triggers (§4). Landed: 0a `41f8a61` (pulse-angles counts S19: 91 → 100) · 0b `d9fbb48`
(DI/pydi at column 0; tier3 byte-identical) · 0c twin catch-ups gustify `3ce6aae0` · gastify `0641a2d5` · Phases 1–2 in
the commits after them. Measured with the switch on: gustify 80 endpoints · gastify 49 · tier3 512 (collisions 2) ·
keypro none (no FastAPI) — tier3 byte-identical with it off, and on it adds only `forms.json`.

**Was:** PLAN — nothing built. The operator accepted the approach on the [Element Forms page](../logic-map/element-forms.html)
(`df62e8c`) and asked for an implementation plan with the recommended decisions taken. Produced by three read-only
planning agents (pipeline wiring · consumer surfaces · extraction algorithm prototyped with `ast` on gustify), with
the load-bearing claims re-read by hand. Per the iterate-before-implement rule, no generator file is written until the
operator says **"land it"** on this plan.

Ground: suite `df62e8c` (branch `graft-adoption`) · gustify `b205563c` (FastAPI 0.136.3 per `apps/api/uv.lock`) ·
generators at `templates/center/generators/` (`G/` below). Line numbers orient; the builder anchors on literals.

**The one sentence:** a new pass reads what each FastAPI endpoint *decides* — every refusal it can produce, what it
declares, the guards in its body — and writes it to a new `forms.json` feed that pulse, review and gabe-map read,
without moving a byte of any existing output.

---

## 0. The shape, as a chain

1. **The registry** (`G/_a3_forms.py`, data only) names each kind's slots, the framework rules (a body model implies
   422, `HTTPBearer` implies 401), the state rules and the findings catalogue.
2. **The pass** (`G/_a3_paths.py`) re-parses each endpoint handler, walks its body with guard / try / `after` stacks,
   resolves one call level and the dependency chain, and attaches middleware exits by path prefix.
3. **The build** (`G/build_center_a3.py`) runs the pass after `archmap.json` is written, inside its own try, reading
   `amap` without mutating it, and writes `docs/site/center/forms.json`.
4. **The consumers** read the feed: pulse S20 (standing), review FORM DRIFT (diff), gabe-map (`touches` · `map_census
   kind=forms` · `review_drift` subject).
5. **The twins** receive it through `propagate.sh` once the switch defaults on.

What never changes: `archmap.json`, `c4-graph.json/.js`, `levels.json/.js`, `sim.data.js` — byte-identical with the
pass off, on, failing or absent.

---

## 1. Phases at a glance

| Phase | What lands | Where | Proof | Operator cost |
|---|---|---|---|---|
| **0 · Clear the ground** | S19 battery bug fixed · DI/pydi imports reach twins · twins caught up | suite + gustify + gastify | pulse-angles count rises; `propagate.sh --check` clean; baselines re-blessed | review 2 twin catch-up diffs (large, unrelated to forms) |
| **1 · The pass** | `_a3_forms.py` · `_a3_paths.py` · build wiring · `tests/element-forms` | suite only | battery FIRE/SILENT/mutants · 4 gustify goldens reproduced · 4 baselines byte-identical (off) | read the 4 goldens |
| **2 · The consumers** | `form_drift.py` + pulse S20 · review FORM DRIFT · gabe-map fields/section/subject | suite only | pulse-angles · gabe-map · element-forms batteries · suite-doctor CLEAN | read one S20 line + one FORM DRIFT line on gustify |
| **3 · Switch on + propagate** | default ON · twins regenerated · docs | suite + twins | map-baseline re-blessed (forms.json joins the roster) · twin commits | accept gustify's forms.json |
| **4 · More slots** | failure handling · translator · repeat safety · effects per path · tests per path · schema/model/flag short forms · Mirrors | suite, then twins | per-slot goldens + battery cases | per slot: read its goldens |
| **5 · Frontend** | TS pass: guards · hooks · components · store actions | suite, then twins | `tests/frontend` + element-forms TS cases | read RequireSetup + SetupScreen forms |
| **6 · Surfaces** | universe card rows · endpoint-lab rows · example estate | suite, then twins | `tests/gabe-universe` · `probe-eplab.mjs` | see it on the station |

Phases 0–3 are the first slice. Phases 4–6 each start on a named trigger (§4).

---

## 2. Phase 0 — clear the ground (three separate commits, no forms content)

### 0a · The pulse battery cannot fail on S19

`tests/pulse-angles/run.sh:443-444` prints the summary and exits; the S19 block (`:447-467`) runs after it, so its
checks never count and never fail the battery (`docs/center/data/facts.json` records 91, all before `:443`).

- Move the S19 block above the summary line. Nothing else.
- Re-record: `python3 docs/center/generators/write_facts.py --only pulse-angles`.
- Commit numbers: case count before → after.

### 0b · DI and pydi never reach a twin

`_a3_graft.py:980` and `:989` import `_a3_stacks_di` / `_a3_stacks_pydi` *indented*. `propagate.sh:41` lands a new
generator only when a suite generator imports it at column 0, so gustify has never run the port-seam arms (its
committed levels carry no `pred`). The same trap would swallow `_a3_paths`.

- Make both imports column-0 in `_a3_graft.py`, keeping the per-arm try around the *call*, not the import. Check
  first that both modules are stdlib-only at top level (an import-time failure would now break graft's import).
- `tests/stack-pydi` + `tests/arch-graph` green; `scripts/map-baseline.sh check` on all four targets — expect
  BYTE-IDENTICAL (the build already runs these arms in the suite tree).

### 0c · Catch the twins up before forms exists

A gustify refresh is wholesale: it would pull archmap v4 + the `arms` block + every c4/levels change since
`816665b2`, and bury a forms diff inside it.

- `bash G/propagate.sh /home/khujta/projects/apps/gustify --check` → then the real run → commit in gustify.
  Same for gastify.
- Record the twin's census before → after (fn_nodes / fn_edges, homing, arms states).
- Push/PR stays the operator's manual beat.

**Exit:** pulse-angles counts S19; both twins `--check` clean; the four baselines re-blessed on the new ground.

---

## 3. Phase 1 — the pass (suite only, switch default OFF)

### 3.1 · `G/_a3_forms.py` — the registry (≈150 lines, data only)

A `.py` module, not JSON: bootstrap and propagate copy `*.py *.mjs *.sh` only (`propagate.sh:25`,
`bootstrap_center.sh:38`). Imported at column 0 by `_a3_paths.py`. **Not** added to `_a3_stacks.REGISTER` (§5 D3).

Holds, as literals:

- **Slots per kind** — slice 1: `endpoint: [U7, K1, U3]`, each with its applies / n/a / empty-state rule. Later
  phases add kinds and slots as data edits.
- **States** `defined · default · missing · n/a · unknown` and the rollup precedence
  `defined > default > unknown > missing > n/a` (the `unknown` count always rides beside the rollup).
- **Phase ranks** for ordering produced exits: middleware 0 · security dependency 1 · dependency body 2 ·
  validation 3 · handler + level-one calls 4 · uncaught 5.
- **Framework rules** (each with a `source` cite into the installed package):
  - HTTP exception classes (`fastapi.HTTPException`, `starlette.exceptions.HTTPException`) and the `HTTP_(\d{3})`
    name rule.
  - Security classes (`HTTPBearer`, `HTTPBasic`, `OAuth2PasswordBearer`, `APIKeyHeader`): status, detail,
    `auto_error` keyword, `min_version`. `HTTPBearer` → 401 "Not authenticated", `min_version` = lowest verified.
  - Validation: 422 when any non-injected parameter exists; the special injected types list.
  - Uncaught: 500. Default detail phrase: `http.HTTPStatus(n).phrase`.
  - Response classes that carry `status_code`; middleware method map (`BaseHTTPMiddleware→dispatch`,
    ASGI→`__call__`); CORS → 400 on preflight only.
  - Lock-file readers: `uv.lock`, `poetry.lock`, `requirements*.txt`.
- **Code keys** that make a detail a stable code: `code`, `error_code`, `reason`, `type`; Enum bases.
- **Findings catalogue:** `text-only` · `shared-status` · `undeclared` · `declared-unproduced` · `reason-lost` ·
  `escape-500` · `http-swallowed` · `success-mismatch` — each with slot, template, `needs_person`, and its S20 class
  (`nag` or `count`, §5 D9).
- **Options** (built, not decided — the options-not-decisions rule): `u3_empty: "n/a" | "missing-on-mutating"`, default
  `"n/a"`.

### 3.2 · `G/_a3_paths.py` — the pass (≈600 lines)

Stdlib only at top level; never raises; returns `{version, present, reason, framework, endpoints, stats}`.

1. **Find each handler again.** Re-parse `ep.file`; match `def ep.fn` whose route decorator method is `ep.method`
   (tie-break by decorator line). Read what `parse_endpoints` drops: `status_code`, `response_model`, `responses=`.
   Convert a named status (`HTTP_201_CREATED`, stored as a name at `G/_a3_code.py:471-472`) with the registry rule.
2. **Per-file tables** (cached): imports resolved with `_resolve_module` (`G/_a3_code.py:262-287`), top-level defs,
   `Class.method`, module constants (int · str · tuples of `/`-strings).
3. **Walk statements, not `ast.walk`.** Three stacks:
   - guard stack — `If` pushes its test for the body and `not (test)` for `orelse`; loops push `<loop>`; nested defs
     are skipped;
   - try stack — body pushes the `Try`; handlers walk with `handler=h`;
   - `after` list — every earlier sibling `If` whose body always exits adds `not (test)`.
   Predicate text and the `not (%s)` negation follow `_a3_stacks_pydi.py:185-193`; the id-set mechanism there is not
   reused (it ignores `orelse`, has no try context, cannot express `after`).
4. **Classify each raise.** Status: int constant or `HTTP_nnn` name → `defined`; module int constant → resolved;
   else `status: null`, `unknown`, reason `dynamic status: <unparse>`. Detail form: absent → default phrase ·
   str → `text` · dict with a code key → `object` + code · Enum member → `enum` + code · f-string/variable →
   `dynamic` · other → `expr`. **Own reader — `_raise_status` is not reused or widened** (§5 D5).
5. **Catch resolution**, innermost try first: bare `raise` → pass-through · raises an HTTP exception → translate ·
   raises another class → rethrow-as · else swallow. An HTTP exception inside a try whose broad `except` swallows it
   → `http-swallowed`.
6. **One call level** for the handler and each dependency: same-module def → imported repo def → `param.m()` where
   the parameter's annotation names a class (unwrap with pydi's `_ann_name`, `G/_a3_stacks_pydi.py:66-93`) →
   module alias annotations via `_dep_aliases` / `_dep_alias_meta` (`G/_a3_code.py:2033-2076`). A callee's escaping
   exits are re-caught at the call site. An `except X → HTTPException` whose X is not seen at level one still yields
   a row with `source: unverified`.
7. **Dependency chain** (depth ≤ 4, cycle guard): names from `_endpoint_middleware` (`G/_a3_code.py:2135-2156`,
   works with `route_dec=None`), resolved through the step-2 tables; a security-class assignment yields the registry
   `default` row, version-gated by the lock file (unresolvable version → `unknown`).
8. **Validation 422** as a registry `default` row when any non-injected parameter exists in the chain.
9. **App exception handlers** (`@app.exception_handler`, `add_exception_handler`) in the folders
   `parse_app_middleware` scans (`G/_a3_code.py:2384-2392`).
10. **Middleware exits by path.** Walk `dispatch`/`__call__` of repo middleware; inline one helper returning
    `path.startswith(CONST)`; an early `return await call_next(...)` guard is an exemption arm. Match prefixes
    against the un-stripped path (`_mounts_for` mount + router prefix + sub-path). Third-party middleware → registry
    or `unknown`. `archmap.app_middleware[].scope` stays `"all"`.
11. **Assemble per endpoint:** K1 declared vs produced · U7 = produced minus success · U3 = guards whose branch ends
    in a refusal (`kind: flag` when `_flag_gates` tags the line) · findings · slot rollups.

**Ids and order (byte-stable):** key = the c4 endpoint id `endpoint:{METHOD} {path}` (`G/_a3_graph.py:258`); carry
`handler` (`file::fn`), `levels_id` (`file#fn`), `entity`. Colliding ids (gustify has `POST /` and `DELETE /` twice)
emit `variants[]` sorted by (file, decorator line) and a `stats.collisions` count. Rows sort by (phase rank, status,
file, line, detail); sets become sorted lists; repo-relative paths; no wallclock; pseudo-roots skipped with
`_a3_stacks.node_is_pseudo`.

### 3.3 · `G/build_center_a3.py` — wiring (≈25 lines)

- `import _a3_paths` at column 0 (so `propagate.sh:41` lands it and, through it, `_a3_forms`).
- After the archmap write (`:2182-2190`), before the c4 block: `if forms_on:` → own `try` → `_a3_paths.build(amap,
  REPO_ROOT)` → write `forms.json` (indent 1, sort_keys, like archmap) → `wrote.append`. On exception: print
  `⚠ forms SKIPPED: <reason>`, write nothing. Never touch `amap`.
- The switch: `center.config.json#forms` (bool) or `GABE_FORMS=1`; default OFF in Phases 1–2.
- No `.js` twin in slice 1 — no page loads it (a `<script src>` feed would need an always-present stub, `:2425-2447`).
- `gen/README.md` module table (`:38-61`) and emit order (`:77-84`).

### 3.4 · `tests/element-forms/run.sh` — the battery (≈300 lines)

House style of `tests/stack-pydi/run.sh`: `set -u`, `GEN_OVERRIDE`, `mktemp -d` + EXIT trap, heredoc fixture tree,
`ok`/`bad`, one summary line, exit 1 on failure. AST-only — FastAPI need not be installed.

Fixture `$T/app/`: `uv.lock` (fastapi 0.136.3) · `main.py` (middleware, `/api/v1` router, one app exception
handler) · `middleware/throttle.py` (429 on a HOT prefix only) · `auth.py` (`HTTPBearer(auto_error=True)`, a `Ctx`
with `require_team()` → 409, `except BadToken → 401`) · `services/items.py` (`Busy` raised behind an `after` guard,
a pass-through broad except, a depth-two raise) · `api/items.py` · `api/plain.py`.

| # | Kind | Proves |
|---|---|---|
| C1 | FIRE | handler raise → 400 `defined` · `text` · code missing · U3 `key is None` · 422 `default` |
| C2 | FIRE + SILENT half | `except Busy → 409 {"code": ...}` → `translated`, `raised_at`, code present (no text finding) · declared 201 → `undeclared` 400, 409 · U3 d1 with `after` · 429 scoped to HOT |
| C3 | FIRE | `ctx.require_team()` through an annotated dependency → 409 `via` · bearer 401 `default` · `except BadToken` 401 `unverified` |
| C4 | SILENT | a bare `GET /plain` → U7 `n/a` · U3 `n/a` · produced = 500 only · no findings · no 429 |
| C5 | unknown | `status_code=code`, f-string detail → `status null` · `unknown` · `dynamic` |
| C6 | depth floor | a depth-two raise never becomes a row |
| C7 | swallow | a broad except returning normally around a 403 → `http-swallowed` |
| C8 | app handler | a custom exception with an app handler → `translated via app handler` |
| C9 | mutation | delete `except Busy:` → the 409 row goes, `escape-500` appears · `auto_error=False` → the bearer 401 goes |
| C10 | honest-empty + determinism | no routes → `present False` + reason · a missing path never raises · two runs and a reversed discovery order are byte-equal · `parse_endpoints` output, `_raise_status`, `_flag_gates` unchanged by the pass |

Also: `tests/center/run.sh` gains a boom case (a raising `_a3_paths.build` → exit 0, `SKIPPED` printed, no
`forms.json`, archmap unchanged) beside the models case at `:338-356`.

### 3.5 · Dry-run on COPIES (the CLAUDE.md rule; numbers go in the commit message)

Run with `GABE_REPO_ROOT` + `GABE_CENTER_OUT` + `GABE_GRAFT_BUILD=0` against copies of gustify, gastify, tier3
(scale) and keypro (TS-only → `present: false` + reason).

- **Switch off:** `scripts/map-baseline.sh check` → BYTE-IDENTICAL on all four.
- **Switch on:** only `forms.json` is new; the other files hash identical.
- **Goldens on gustify** — the pass reproduces, row for row, the expected forms for `POST /setup/complete`,
  `GET /history/dishes`, `POST /pantry/reset/apply`, `GET /recipe-creation/gustify/stream` (§6).
- **Record:** endpoints formed · rows · findings by id · `unknown` rows by reason · unresolved calls · collisions ·
  wall time added.

**Exit:** battery green with every mutant killed · goldens match · four baselines identical (off) ·
`_a3_paths.py` under 800 lines.

---

## 4. Phases 2–6

### Phase 2 — the consumers (suite only; build order matters)

**2a · `skills/gabe-pulse/scripts/form_drift.py`** (new, the `fetch_bridge.py` contract): `root`, `--json`,
`--one-line`, `--diff [base]`; exit always 0; `FORM DRIFT NOT RUN: <reason>` when no feed.
- Standing arm reads `forms.json`.
- `--diff` arm: `diff_new_raises(diff)` + `classify_new_raises(...)` — a diff-added refusal that is text-only, shares
  a status with an existing refusal, or produces a status the endpoint does not declare. Compares
  (status, detail, via symbol), never lines.
- Pure-function cases in `tests/element-forms`.

**2b · pulse S20** in `angles.py`: `s20_element_forms(root, plan, cfg)`; no `forms.json` → `None` (opt-in arm);
`present: false` → `Unavailable(reason)`; fires on the `nag` class (§5 D9); `count` class and `unknown` ride the line.
`THRESHOLDS` entry; `SIGNALS` row last (lowest priority). Battery cases (fire · below threshold · absent · broken
file · present:false) go **above** the summary line. Docs: `SKILL.md:136-155` (count, roster, cases),
`references/pulse-spec.md` §5.1 (add S19 and S20 rows), the module docstring. Version 1.8.1 → **1.9.0**.

**2c · review FORM DRIFT:** `references/review-spec.md` Step 3.4 — a bullet after WEB-BRIDGE DRIFT (`:356`),
"all five" → six (`:215-216`), a map-delta emit line (`--gen _a3_paths.forms`, `:291`). Standard pricing, no new
machinery. Version 1.18.2 → **1.19.0**.

**2d · gabe-map** (after 2a — `review_drift` imports the pulse script via `mq.pulse_module`):
- `mapquery.py`: a lazy `Center.forms` loader + `forms_block()` tri-state copied from `entity_models()` (`:159-172`);
  optional one-line `forms` entry in `map_health`.
- `tools.py`: a `forms` field on `touches` for endpoints, added only when present (the `home_evidence` precedent,
  `:408-409`); one instructions line (`:818-835`, inside its char budget).
- `tools_wave2.py`: `map_census` `forms` section (copy the lazy `homing` block, `:395-406`) + the two enum spots
  (`:409`, `:719`); `review_drift` `form` subject + enum (`:645`, `:728`).
- `tools_wave3.py`: `trace` carries the start endpoint's form summary on `from`.
- `tests/gabe-map/checks.py`: `forms.json` in the fixture loop (`:260`); FIRE/SILENT for census, touches,
  review_drift. Tool count stays 18.
- Docs: `SKILL.md` table rows, `references/map-spec.md` §5.3 · §5.8 · §5.9 · §7. Version 1.3.2 → **1.4.0**.

**Phase 2 close:** `CLAUDE.md` rows for pulse / review / map (the doctor checks SKILL.md ↔ CLAUDE.md parity in the
same commit) and the stale counts there and in `README.md` (pulse "EIGHTEEN" → twenty; gabe-map "17" → 18) ·
`./install.sh` (≈5 s) · `write_facts.py --only pulse-angles`, `--only gabe-map`, `--only element-forms` ·
`scripts/suite-doctor.sh` CLEAN (≈5–6 min).

### Phase 3 — switch on and propagate

**Trigger:** the operator reads gustify's `forms.json` (the goldens + the findings totals) and accepts it.
- Default ON (the config key stays as the off switch).
- `scripts/map-baseline.sh` re-bless all four (forms.json joins the roster); add forms measures to `_census`
  (endpoints formed · rows · nag/count findings · unknown rows).
- `propagate.sh` gustify + gastify (`--check` first) → twin commits.
- `CLAUDE.md` forms bullet beside the membership-evidence bullet; `templates/center/shell/README.md` feed list.

### Phase 4 — more slots, same pass

**Trigger:** Phase 3 accepted. One slot per sub-slice, each with its goldens and battery cases.
- **U11 failure handling** and **service K2 raised errors → translator** — the catch resolution already computes
  them; mostly assembly.
- **U12 repeat safety** — idempotency key reads, claim calls, unique keys used as guards (registry allow-list).
- **U9 effects per path** — join `_orm_access` per branch.
- **U14 tests per path** — `_a3_tests` asserted statuses joined to produced exits (fixes the fixture-caller
  over-credit on the same row).
- **Short forms inside the forms feed** (never widening archmap): schema (Field defaults, bounds, `extra`,
  validators) · model (CheckConstraint, nullable, server_default, ondelete) · flag (int/str settings, validators).
- **Mirrors** — the first deterministic cross-piece slot: schema bound vs model column vs sibling schema.
- **The sixth state `external`** for deploy-platform values.

### Phase 5 — the frontend pass

**Trigger:** Phase 4's endpoint slots stable for one full refresh cycle on both twins. Extend
`G/_a3_fe_extract.mjs` (if → return, `Navigate to`, factory query keys, `isPending`/`isError` branches,
`onMutate`/`onError`) and classify in `_a3_fe.py`; forms for guard · hook · component · store action. The client
**reason map** joins the endpoint **refusal catalog** (U7): a client that reads status only against a server with two
refusals on one status → a finding. Revisit D3 here (register a `forms` concept on the arms census).

### Phase 6 — surfaces

**Trigger:** the operator asks to see forms on the station or the lab. Universe card: a `formsSec` row on endpoint and
function cards — small if a compact summary is folded onto c4 nodes (moves c4 bytes: its own decision then), medium if
the station loads a `forms.js` (both station copies, the two-file law, `tests/gabe-universe`). Endpoint lab:
`gen-endpoint-facts.py` reads the feed; rows inside existing panels (security for U3, functions for U7), not a
seventh tab. Example estate: `regen-example.sh` FEEDS.

---

## 5. Decisions — taken as recommended

DECISION D1: where the data lands
CHOSE: a separate `forms.json` over a `forms` key inside archmap
ASSUMED: gabe-map and pulse can afford one more lazy loader
BREAKS IF: a consumer needs forms in the same read as archmap under a hard latency budget

DECISION D2: registry format
CHOSE: a `.py` module of literals over a JSON file
ASSUMED: none beyond the verified copy glob (`*.py *.mjs *.sh`)
BREAKS IF: the generator copy becomes a recursive or explicit manifest

DECISION D3: arms census registration
CHOSE: not registered in `_a3_stacks.REGISTER` in slices 1–4
ASSUMED: the census's job is language/idiom coverage, which forms does not change yet
BREAKS IF: Phase 5 lands — then a TS-only tree should show forms coverage (revisit there)

DECISION D4: switch default
CHOSE: OFF through Phases 1–2 (opt-in by config or `GABE_FORMS=1`), ON at Phase 3
ASSUMED: you want to read gustify's output before twins carry it
BREAKS IF: you want twins to carry it from Phase 1 — then Phase 0c must land first regardless

DECISION D5: the status reader
CHOSE: a new reader inside `_a3_paths` over widening `_a3_code._raise_status`
ASSUMED: `flags[].on_fail` bytes should not move in this slice
BREAKS IF: never — widening `_raise_status` is a separate follow-up, triggered after Phase 3's re-bless

DECISION D6: how deep the pass reads
CHOSE: handler + one call level + the dependency chain (≤4); deeper raises become `unknown_causes` / `unverified`
ASSUMED: the shallow-map collapse rule from the drawn maps holds
BREAKS IF: more than a third of gustify's 500 rows carry `unknown_causes` — then read the path pass's depth again

DECISION D7: an empty U3
CHOSE: `n/a` by default, `missing-on-mutating` built as a registry option
ASSUMED: a read endpoint with no in-body guard is normal
BREAKS IF: you rule every write must guard in its body — flip the option

DECISION D8: the framework version
CHOSE: the committed lock file over `.venv`; `HTTPBearer` 401 gated at the lowest verified version (0.135.3), older → `unknown`
ASSUMED: the 403 → 401 cut-over version stays unverified on this machine
BREAKS IF: a twin pins FastAPI below 0.135.3 — verify the changelog then

DECISION D9: what pulse S20 nags
CHOSE: nag `shared-status` · `http-swallowed` · `reason-lost` · `escape-500` (fire at ≥3); `text-only` and `undeclared` ride the line as counts
ASSUMED: text-only refusals are a codebase-wide convention on gustify, a policy to set once, not per-endpoint debt
BREAKS IF: you adopt stable reason codes as the rule — then promote `text-only` to the nag class

DECISION D10: twin ground first
CHOSE: Phase 0 catch-up as separate commits over propagating forms onto stale twins
ASSUMED: the twins' unrelated drift since `816665b2` is wanted anyway
BREAKS IF: a twin is frozen for a release — then skip it until the release ships

---

## 6. The goldens (Phase 1 acceptance, gustify `b205563c`)

Shared rows (written once): **MW-sens** 429 when a sensitive prefix matches (`middleware/rate_limit.py:27-37, 114-117,
127-131`) · **MW-glob** 429 on every path (`:120-121`) · **DEP-bearer** 401 `default` "Not authenticated"
(`auth/context.py:23`, from `uv.lock:416`) · **DEP-invalid** 401 "invalid token" `unverified`
(`auth/context.py:98-99`) · **UNC** 500 `default`. CORS → `n/a`; IdempotencyMiddleware → no rows.

| Endpoint | Declared | Produced (U7) | U3 | Findings |
|---|---|---|---|---|
| `POST /setup/complete` | 200 default · MeResponse · refusals missing | MW-sens · MW-glob · DEP-bearer · DEP-invalid · 422 default · 400 "Idempotency-Key required" (`api/setup.py:193`) · 409 "setup in progress" translated from `services/setup.py:348` · 409 "consent required" translated from `services/setup.py:374` · UNC with unknown causes (pass-through `services/setup.py:407`) | d0 `key is None` → 400 · d1 IN_PROGRESS → 409 after REPLAY · d1 consent → 409 after three | text-only · shared-status 409 · undeclared 400 401 409 429 |
| `GET /history/dishes` | 200 default · DishHistoryListResponse | MW-glob · DEP-bearer · DEP-invalid · 422 (limit, offset) · 409 "setup required" via `AuthContext.require_household` (`auth/context.py:55`) · UNC | d1 `self.household is None` → 409 | text-only · undeclared 401 409 429 |
| `POST /pantry/reset/apply` | 200 default · ResetApplyResponse | MW-sens · MW-glob · DEP-bearer · DEP-invalid · 422 · 409 "setup required" (via `:523`) · 400 "Idempotency-Key required for reset apply" (`api/pantry.py:526`) · 409 "Conflict" translated from `services/pantry_reset.py:60` · UNC | d1 household → 409 · d0 `key is None` → 400 · d1 `existing is not None` → 409 after `completed` | text-only · shared-status 409 · reason-lost · undeclared 400 401 409 429 |
| `GET /recipe-creation/gustify/stream` | 200 default · response_model n/a (stream) | MW-sens · MW-glob · 401 "invalid token" `unverified` (no bearer: query token) · 422 (token, mode, key, tier) · 403 "recipe creation is disabled" flag guard (`api/recipe_stream.py:135-136`) · 409 "setup required" (via `:140`) · UNC | d0 flag → 403 · d1 household → 409 | text-only · undeclared 401 403 409 429 · a missing token answers 422, not 401 (needs a person) |

Not resolvable by design, and marked so: the 401 "invalid token" source (two levels down), the causes behind each 500,
library exits (`session.commit`), and the runtime value of `rate_limit_active` (recorded as `when`).

---

## 7. Traps carried from the research

- **Import at column 0** or the module never reaches a twin (`propagate.sh:41`) — the reason for Phase 0b.
- **A `.json` generator file is never copied** — the reason the registry is `.py`.
- **Registering in `_a3_stacks.REGISTER` moves archmap bytes on every map** and can move S19 on TS-only trees.
- **`_raise_status` reads only int constants** — gustify's `status.HTTP_403_FORBIDDEN` reads as the class name in
  today's `flags[].on_fail`.
- **`touches_x` holds no method calls** and `function_insight` does not resolve callees — the pass resolves in AST.
- **Levels `fn_edges` are built after archmap** and only with graft — a cross-check count, never a source.
- **Two function id formats:** `file::fn` (archmap) and `file#fn` (levels) — carry both.
- **Colliding endpoint ids exist** — `variants[]`, never a suffixed id.
- **Anything a battery prints after its summary line never counts** — S19 today.
- **A gustify refresh is wholesale** — never let a twin catch-up and a new feed share a commit.
- **Check `git log -1` before and after every commit; commit by explicit path** — a concurrent session's `git add -A` once swallowed a commit on this branch.

---

## 8. Batteries touched, per phase

| Phase | Battery | Change |
|---|---|---|
| 0a | `tests/pulse-angles` | S19 block counted |
| 0b | `tests/stack-pydi` · `tests/arch-graph` | green, unchanged |
| 1 | `tests/element-forms` (new) | C1–C10 + mutants |
| 1 | `tests/center` | forms boom case |
| 2 | `tests/element-forms` | `form_drift` pure functions |
| 2 | `tests/pulse-angles` | S20 cases |
| 2 | `tests/gabe-map` | forms fixture + census / touches / review_drift |
| 3 | `scripts/map-baseline.sh` | re-bless, forms measures |
| 4 | `tests/element-forms` | per-slot goldens |
| 5 | `tests/frontend` · `tests/element-forms` | TS cases |
| 6 | `tests/gabe-universe` · `probe-eplab.mjs` | card / lab rows |

Every battery is auto-discovered by `scripts/suite-doctor.sh` and `write_facts.py`; re-record facts with `--only`.

---

## Amendment 1 — complete the generation (2026-09-14)

The remaining generation (the paths slice, Phase 4 slots, short forms, the other backend kinds and the Phase 5 frontend pass) is planned as 11 slices in [amendment-1.md](amendment-1.md): the feed interface, the slice order with goldens and batteries, the module map, the verification pass and decisions D11–D28. Status: authorized (operator "go"), building in slice order.
