# Amendment 1 — complete the generation (2026-09-14)

**Status: AUTHORIZED, building (operator "go", 2026-09-14).** The operator's direction: **first finish generating the codebase map. The scripts that generate the content come first. Then review, polish and verify what the map generates. How it is displayed is decided later, by looking at the app, never from text.** The operator's "go" stands in for the per-slice "land it": slices build in order, and each slice ends with its real outputs (goldens, dry-run numbers, byte-identity) for the operator to check. The D-decisions below are generation defaults only — no display decision is taken here.

**What this amendment covers:**
- Every generation item in `path-map-status.md` §4. That is list A (A1–A12) and list B: middleware, dependency, service, task and handler forms, the schema, model, setting and mirror short forms, and the Phase 5 frontend pass.
- The plan's Phase 4 list, including the sixth state `external` (`plan.md:274-286`).
- The shared foundation those items need.

**What it leaves out:**
- Phase 6 surfaces: the universe card, the endpoint-lab panel rows, the command region.
- Every display question: path names, grouping, which rows show, how collapsed sites are drawn.
- WebSocket routes, `@app.middleware("http")` functions and Next.js server idioms. Each is a named floor, counted and not formed.
- The `_a3_tests._credit_ep` over-credit fix and plan D5's `_raise_status` widening. Both move archmap bytes.

**Ground:**
- suite `576ae8f` (`graft-adoption`)
- gustify `05007957`; its committed feeds were built at `3ce6aae0`
- FastAPI 0.136.3
- `GEN/` = `templates/center/generators/`

**Notation:**
- **Sections:** amendment sections are written §A1–§A6. Build items keep their `path-map-status.md` ids: A1–A12, and B for the later-kinds list.
- **Slices:** "Slice N", never "SN", so they don't read as pulse signals.
- **Decisions:** numbered D11 onward, continuing plan §5.
- **Golden marks:**
  - **(V)** re-read in source by the critic or this synthesis
  - **(P)** read-only `ast` prototype output
  - **(R)** a designer's source read, not re-checked
  - **(U)** unverified; re-measure at the dry run

---

## §A1 · The agreed feed interface

### Envelope (Slice 1)

```jsonc
{
 "version": 2,                         // was 1 — F.VERSION; the endpoint pass emits it itself
 "head": "<sha>|null",                 // = amap["head"] of the same build (build_center_a3.py:2026)
 "present": true, "kind": "endpoint", "framework": {…}, "endpoints": {…}, "stats": {…},   // unchanged
 "arms_ignored": ["<name>"],           // only when a selection named something that is not an arm (names are case-insensitive)
 "arms_error": "<Type>: <message>",    // only when the orchestrator itself failed — the endpoint forms are still written
 "arms": {                             // WRITTEN ONLY when ≥1 arm is selected; then every registry arm is listed, frontend included
   "<arm>": {"present": bool,          // true when any part ran
             "reason": "switched off" | "switched off — computed in memory for <arms>" | "needs <unit>" | "not built yet (slice n)"
                     | "partial — <part>: <reason>; …" | "needed by <arms>; written only where <arms> writes inside it" | "error: …" | null,
             "version": int, "options": {…}, "stats": {…, "findings": {"<id>": int}},
             "bytes": int,                                                 // selected arms: serialized size of the keys the arm added
             "parts": {"<part>": {"present": bool, "reason": str|null}}}   // only arms with parts
 }
}
```

**Invariant:** with every arm off, `forms.json` equals `_a3_paths.build(amap)` plus `head`. With every arm on, `archmap.json`, `c4-graph.json/.js` and `levels.json/.js` are byte-identical to the off build.

**Orchestration (as built in Slice 1, after its review — `_a3_forms_build.py`):**
- Stages run in `F.ARM_STAGES`, one arm or some of its parts at a time. A part runs only when its OWN hard needs succeeded, so a sibling's failed need never blocks it (review F1).
- A runner is `runner(forms, ctx) -> {version, options, stats}`; `ctx` carries `amap` (a private deep copy — no arm can move the archmap · c4 · levels built after the forms block, F4) · `repo` · `cfg` · `selected` · `parts` · `ok` (units that already succeeded) · `soft` (selected soft needs that succeeded).
- Each stage snapshots the whole feed. A raise, a non-dict return, or a feed or result that `json.dumps(sort_keys=True)` cannot write restores the snapshot and records `error: …`; nothing from that stage is merged (F2 F5).
- The orchestrator records the key paths each stage ADDED (a diff against its snapshot). A unit that is only needed has its additions deleted before the write, unless a selected arm wrote inside them — then the host stays and the reason says so (F3 F30). The shared `arm_findings` dicts (top level and per endpoint or variant) are created before any stage, so each arm owns only its entry; ones left empty are removed.
- An arm whose parts partly failed reads `present: true` with a `partial — …` reason (F6).

### Arms, switches and dependencies

| arm | parts | slice | writes |
|---|---|---|---|
| `paths` | `returns` · `conditions` · `framework` · `paths` | 3 · 4 · 5 | `returns[]` `branches[]` `collapsed[]` `framework_exits[]` `paths[]` on endpoints; top-level `conditions{}`; U6 |
| `switches` | — | 5 | `switches[]` on endpoints; U8 |
| `effects` | — | 6 | top-level `steps{}`; `paths[i].effects`; `failure{}`; U9 U11 |
| `contract` | — | 7 | `repeat{}` `auth{}` `rate{}` `responses{}`; U12 K2 K3 K4 |
| `kinds` | `middleware` · `dependencies` · `functions` · `tasks` · `handlers` | 3 · 8 | top-level maps of the same names |
| `short` | `schema` · `model` · `migration` · `setting` · `mirror` | 4 · 10 | `schemas{}` `models{}` `settings{}` `mirrors{}`; `cases[]` on 422 rows |
| `tests` | — | 9 | top-level `test_cases{}`; `tests{}` on endpoints; `produced[j].tests`; `paths[i].tests`; U14 |
| `frontend` | `guards` · `hooks` · `client` · `reason` · `controls` · `stores` | 11 | top-level `frontend{}` |

**Selecting arms:**
- `center.config.json#forms_arms: {"paths": true, …}`. Every arm defaults to **false**.
- `GABE_FORMS_ARMS=paths,effects|all|none` replaces the config for one run.
- `forms: false` / `GABE_FORMS=0` still turns the whole feed off.

**Dependencies between arms:**
- **Hard needs** are computed in memory and written only if the needed arm is also selected (`F.ARM_NEEDS`):
  - `paths` ← `kinds.middleware`
  - `effects` ← `paths`
  - `contract` ← `effects`
  - `tests` ← `paths`
  - `kinds.functions` ← `effects`
  - `short.model` ← `effects`
- **Soft needs** are used only when selected: `paths` uses `switches` and `short.schema`.
- **Ids** (the `id` keys on existing rows) are written whenever any arm is selected (D13).

### Ids: `<prefix>:<sha1(json.dumps(tuple, separators=(",",":"), ensure_ascii=False))[:10]>`, never a line number

- **The ordinal `n`** tells identical tuples apart: it ranks the row's (site line, at line) among every DISTINCT position that tuple has anywhere in the feed. Ranking one endpoint's rows gave a middleware exit that path prefixes filter per endpoint two ids, and one id two exits (Slice 1 review F10) — `_a3_forms_ids.x_ids(repo, forms)` ranks feed-wide.
- **Function fields** are `file::qual`, found as the innermost def in `P._Mod.defs` (`_a3_paths.py:103-109`, V). Module level is `file::<module>`.
- **`via_sym`** is `via` with ` @ file:line` stripped (`_a3_paths.py:835`).
- **The ids live in a leaf module,** `_a3_forms_ids.py`.

| prefix | object | tuple | shared across endpoints |
|---|---|---|---|
| `x:` | produced exit (refusal · uncaught · framework) | `[phase, status, at_fn, site_fn, via_sym, raised_fn, detail, n]`; no `at` → handler | yes, so `middleware{}.exits[].id == endpoints[*].produced[].id` |
| `g:` | precondition | `[pred, status, at_fn, via_sym, depth, n]` (`n` ranks distinct `at` positions, as for `x:`); carries `exit: x:` (`exits[]` + `exit: null` when several rows share its `at`) | yes |
| `r:` | success return | `[fn, kind(return·implicit·catch-return), guards[], after[], n]` | yes |
| `b:` | branch (a deciding callee's arm) | `[fn, guards[], after[], n]` | yes |
| `p:` | path | `[endpoint_key, handler, exit_id, [chosen b: ids], split_tag]` | no |
| `sw:` | switch | `["binding", s_fn, port]` · `["value", fn]` · `["flag", sorted ref ids]` | yes |
| `st:` | effect step | `[fn, op, table, cond, n]` | stored once in `steps{}` |
| `c:` | catch | `[fn, sorted types[], n]` | yes |
| `k:` | claim | `[fn, model, column]` | yes |
| `w:` | rate window | `[limiter_cls, attr]` | yes |
| `e:` | service raise | `[fn, cls, pred, after[], n]` | yes |
| `case:schema:` | a 422 case | `<Cls>/<field path>/<pydantic type>[/<validator>.<n>]` | yes |
| `<l>-<sha10>` | a frontend row (`x e c b s a q m t p r`) | hashed per piece | scoped per piece |

### Map keys

| map | key | also carries |
|---|---|---|
| `schemas` · `models` | `schema:<Cls>` · `model:<Cls>` | the c4 ids, `_a3_graph.py:672` / `:654` (V) |
| `settings` | `setting:<name>` | `archmap_flag` · `aliases[]` |
| `middleware` | `middleware:<Cls>` | a collision becomes `{"variants": […]}` |
| `dependencies` · `functions` · `handlers` | `file::qual` | `levels_id: "file#qual"`. Archmap `dispatch.dispatches[].t` is `file#qual` and is converted (V) |
| `tasks` | `endpoint:TASK <name>` | `fn`, `levels_id` |
| `frontend.pieces` | `fe:<file>#<Export>`; a store action is `fe:<file>#<Store>.<action>` | — |
| `test_cases` | the C-id if it is unique in the feed, else `<tfile>::<def>` | — |

### Kinds forms (as built, Slice 3a — `_a3_forms_mw.py`)

```jsonc
"middleware": {"middleware:<Cls>": {"cls", "kind": "project|third-party|unknown", "registered_at": "file:line",
  "order": {"registered": int, "runs": int, "of": int},        // runs = of-1-registered (Starlette inserts at 0)
  "outer": "middleware:<Cls>"|null, "inner": "middleware:<Cls>"|null, "file"?, "method"?,
  "pass_through": [{"kind": "exact-paths|prefix|method|flag|expr", "src", "values"?, "expr"?, "at"}],
  "exits": [{"id": "x:…", …the endpoint row's fields…, "applies_to": int, "exempt": ["endpoint:…"], "hop"?, "on_endpoints"?: false}]}},
"dependencies": {"file::qual": {"kind": "function|class|security|unknown", "levels_id", "at"?,
  "subdeps": ["file::qual" | {"name", "resolved": false}],   // FastAPI's parameter order, not gate-first
  "exits": [{"id", …}], "inherited_exits": [{"id", …}], "escapes"?: ["Cls file:line"],
  "effects": [{"op": "commit", "at", "via"?: "callee @ file:line"}], "teardown": bool, "applies_to": int,
  "class"?/"auto_error"? (security)}}
```
Findings (`arm_findings.kinds`): `indistinct-exits {subject, status, at, exits[], sites[]}` · `dependency-commits {subject, commits[], applies_to}`.

### Paths forms (as built, Slice 3b — `_a3_forms_paths.py`)

The `returns[]` · `branches[]` · `collapsed[]` shapes are the core shapes below, with these readings:
- `returns[].kind` — `return` · `implicit` (control can fall off the end; found by a walk over a copy with sentinel returns) ·
  `catch-return` (inside an except) · `fall-through` (a branch set's first unguarded return). Depth-1 rows belong to a deciding
  callee: `site` is the call, `status: null`, `state: "n/a"`.
- `branches[].token` — the last name in the guard (`REPLAY`, `completed`), or `fall-through`; `why` — `contributes-rows` ·
  `commit-differs`.
- `conditions{}` — keyed `"<Cls>: <when>"` → `{via, when, file, terms[]}` (`_a3_forms_settings.terms`). A middleware row gains
  `applies: true|false` only when path membership proves it, else `when_for_path` (the residual with each settings term
  substituted; `evaluate` folds `not not X`).
- Stats: returns · branch_returns · branches · handlers_expanded · collapsed{reason: n} · conditions · applies_false ·
  applies_true · when_for_path.

### Core object shapes (per endpoint, and per `variants[]` entry)

```jsonc
"paths": [{"id":"p:…","phase":str,"status":int|null,
  "exit":{"id":"x:…|r:…","kind":"refusal|success|uncaught|framework"},
  "names":{"detail":str|null,"token":str|null,"exception":str|null,"stage":str},   // D15: never a chosen `name`
  "split"?:"dependency-params|own-params|body-parse","cases"?:["case:schema:…"],
  "chain":[{"kind":"step|gate|branch|switch|call|collapsed|catch|commit|exit","ref"?:id,"hit"?:bool,
            "phase"?:str,"at"?:"file:line","cond"?:str,"call"?:str,"fn"?:"file::qual",
            "op"?:"translate|pass-through|rethrow|swallow","cls"?:str}],
  "switches":["sw:…"],"proven_by"?:"sw:…","state":"defined|partial","unknown"?:[str],"anywhere"?:true,
  "effects"?:{"steps":[{"step":"st:…","via":"file::qual"}],"committed":[…],"maybe_committed":[…],
              "rolled_back":[…],"uncommitted":[…],"dependency":"ran|not-run|unknown","may_follow_commits"?:["st:…"]},
  "tests"?:[TestRef]}],
"returns":[{"id":"r:…","fn","kind","at","depth","status":int|null,"state","value","pred"?,"after"?,"in_loop"?,"site"?,"branch"?}],
"branches":[{"id":"b:…","site","call","fn","pred","after","token","return":"r:…","why":["contributes-rows"|"commit-differs"]}],
"collapsed":[{"site","call","fn","reason":"one return|arms change neither exit nor commit|generator: runs after the response line|swallowed by the caller|unresolved"}],
"framework_exits":[{"id":"x:…","phase":"body-parse","status":422|400,"state":"default","source":"fastapi/routing.py:427|:447"}],
"switches":[{"id":"sw:…","kind":"binding|value|flag","scope":"handler|call|dependency|middleware",…}],
"failure":{"state","catches":[{"id":"c:…","fn","at","depth","types","scope","guards":{"writes","commits"},
           "actions":[{"op","at","fn"?,"suppressed"?,"steps"?}],"outcome":"translate|pass-through|rethrow|swallow","answers"?}]},
"arm_findings":{"<arm>":[{"id","slot",…}]},
"slots":{ /* U3 U7 K1 unchanged */ "U6","U8","U9","U11","U12","U14","K2","K3","K4": {"state", …counts} }
```

**Changes to existing rows** (each key appears only when its arm is on):
- `produced[i]` gains:
  - `id`
  - on middleware rows: `when_for_path` and `applies` (paths)
  - on 422 rows: `schemas[]`, `types`, `cases[]` (short.schema)
  - `tests[]` (tests)
- `preconditions[i]` gains `id` and `exit`.

### Shared rules

- **Findings.** A new arm **never** appends to `endpoints[k].findings[]` and never touches `stats.findings`, which is counted inside `P.build` (`_a3_paths.py:935-936`).
  - Per-endpoint findings go in `arm_findings.<arm>`.
  - Feed-wide counts go in `arms.<arm>.stats.findings`.
  - `_a3_forms.FINDINGS` gains an `arm` key.
  - Ids are unique across the feed:
    - `test-detail-unmatched` belongs to tests;
    - `client-detail-unmatched` belongs to frontend;
    - there is exactly one `race-500` (slot U12, arm contract); the model form's M10 refers to it, and `uq-race` is dropped;
    - `untranslated-raise` is a count that points at the endpoint's `escape-500`.
- **Catch vocabulary** is `_climb`'s (`_a3_paths.py:330-345`, V): `translate` · `pass-through` (a bare `raise` or `raise <name>`) · `rethrow` (raises a *different* class) · `swallow`, plus `escape` when no handler matches. `re-raise` is not a word in the feed.
- **Path identity.** There is one walker for paths: one path per exit, plus the arms of deciding callees, combined linearly. The effects walker runs **along** each path; a non-exiting `if` becomes `cond` steps and never forks (`shallow-logic-maps.html:348` collapse rule).
- **422 split tags.** The tags are `dependency-params`, `own-params` and `body-parse`.
  - A validation row keeps its one `x:` id.
  - Each `cases[]` entry carries `param`.
  - Test refs join the `x:` id; `case` is added only when a payload literal is actually evaluated.
- **Registry.** `KINDS.endpoint` += U6 U8 U9 U11 U12 U14 K2 K3 K4.
  - New kinds: middleware · dependency · service · task · handler · schema · model · setting · mirror · guard · hook · component · store_action.
  - Slot ids are scoped per kind.
  - `STATES` gains `external` (D23).
  - Paths order by a new `PATH_PHASES` (middleware · body-parse · security · dependency · validation · handler · uncaught). `PHASES` stays untouched, so `P.build`'s row sort does not move.

---

## §A2 · Slices in dependency order

**Every slice follows this protocol:**
1. Build in order under the operator's "go"; the slice's outputs are shown at its exit.
2. New modules land at column 0 through `_a3_forms_build.py`.
3. Each slice has its own battery directory, hermetic and AST-only, in the house style of `tests/element-forms/run.sh`: `set -u`, `GEN_OVERRIDE`, `mktemp -d` with an EXIT trap, `ok`/`bad`, one summary line printed **last**. Every mutant must flip its check or the battery FAILs.
4. Dry-run with `scripts/forms-dryrun.sh` (Slice 1) on gustify · gastify · tier3 · keypro, serially.
5. The commit message records the numbers.
6. Commit by explicit path; check `git log -1` before and after.

`tests/element-forms` (C0–C13) is never edited.

**Every slice has the same exit criteria:**
- Battery green, every mutant killed.
- The slice's goldens reproduced.
- Arms off: `map-baseline.sh check` BYTE-IDENTICAL on all four targets.
- Arms on: only `forms.json` differs.
- Every new module under 800 lines.
- A `gen/README.md` module-table row.
- Suite-doctor CLEAN.

---

### Slice 0 · Rulings (no files)

This amendment. The operator rules on the §A1 interface, the switch policy (D12) and D11–D28, then says "land it" for Slice 1.

---

### Slice 1 · Foundation — A1, A2 plumbing, envelope, shared leaves

**Generates:** `version 2`, `head`, and the `arms{}` machinery (no real arm yet). The example estate gains `forms.json`, and `LABEP.forms` carries the raw block for the door endpoint. No panel reads it (Phase 6).

**Modules** (import chain: `build_center_a3.py` → `_a3_forms_build` → leaves):

| module | lines (est.) |
|---|---|
| `_a3_forms_build.py` | ~150 |
| `_a3_forms_ids.py` | ~80 |
| `_a3_forms_settings.py` | ~200 |
| `_a3_forms_catch.py` | ~150 |
| `_a3_forms_reach.py` | ~160 |
| `_a3_forms.py` | +~60 (VERSION, ARM_NEEDS, arm keys on FINDINGS, PATH_PHASES, OPTIONS `reach_depth` 4) |
| `build_center_a3.py` | +~15 (2,558 → ~2,573, over budget; state the numbers) |

**Algorithm:**
1. `F.VERSION` goes 1 → 2. `_a3_forms_build.extend_backend(forms, amap, repo)` sets `forms["head"] = amap.get("head")` before any arm runs, so even a failed arm leaves it stamped.
2. **Switches.** Read `CFG.get("forms_arms")` and `GABE_FORMS_ARMS`, then close over the hard needs from `F.ARM_NEEDS`. Selected arms are written; needed-only arms are computed in memory and discarded.
3. **Run each arm** in the fixed order: ids → kinds.middleware/dependencies → short.schema (+ framework exits) → switches → paths → effects → contract → kinds.functions/tasks/handlers → tests → short.model/migration/setting/mirror.
   - Each arm runs in its own `try`, over a deepcopy snapshot of `endpoints`.
   - If an arm raises, the snapshot is restored and `arms.<arm> = {present: false, reason: "error: …"[:200]}`. The later arms still run, minus that arm's hard dependents, which record `reason: "needs <arm>"`.
4. **Write `arms`** only when at least one arm is selected; an unselected arm reads `present: false, reason: "switched off"`.
5. **Wiring:**
   - Hoist `_forms = None` above the forms block (`build_center_a3.py:2199`).
   - After `_a3_paths.build` (`:2201`), inside the existing `try`, call `_forms = _a3_forms_build.extend_backend(…)`. It never raises.
   - Leave `extend_frontend` as a stub call after the fe arm (`:2283`), returning `None`.
   - The write rule (`:2202`, V) is unchanged until Slice 11.
6. **`_a3_forms_ids`:** `ident(prefix, tuple)` · `x_tuple(repo, row, handler)` · `x_ids(repo, forms)` (the feed-wide ordinal) · `fn_at` · `via_sym`.
7. **`_a3_forms_settings`:**
   - `self.<attr>`: follow the `__init__` assignment → the `x or get_settings()` local, typed through `_a3_stacks_pydi._ann_name` (`:66-93`) → a one-return `@property`, inlined once.
   - Read AnnAssign / `Field(default=)` values, `Final` constants, and `SettingsConfigDict(env_prefix=)`.
   - `x in CONST` → `P._Mod.consts` via `P._literal` (`_a3_paths.py:73-81`).
   - `startswith` → `P._path_prefixes` (`:590-610`).
   - Method arms, and a three-valued `not/and/or` simplifier.
   - Floors are `opaque`, verbatim.
8. **`_a3_forms_catch`:**
   - `classify(h, hev)` in `_climb` precedence (`:337-344`).
   - `trail(cls, bases, tries, hev)` returns **every** handler passed, which is why `_climb`'s `break` needs its own trail copy.
   - `actions(h)` lists rollback, calls and `contextlib.suppress`, reusing `P._handler_types` / `P._is_reraise` / `P._http_parts` (`:200-211`, `:319-327`).
9. **`_a3_forms_reach`:**
   - `callee()` = `P._callee` (`:446-462`) plus `self.m()` → `Class.m`, memoised.
   - `bfs(roots, depth=OPTIONS.reach_depth)` in level order, keeping the first-reached entry per `(fn, root)`, tie-broken by `(caller, site)`.
   - `skip(path)` = `_a3_graft._is_center` (`_a3_graft.py:169-176`). Its file list is built from the generator dir at import (`:69-75`, V), so new modules are skipped on twins automatically.
10. **Consumer fixes:**
    - (a) `form_drift.load_forms` adopts the suite state words of `mapquery.forms_block` / `entity_models`: no file → `not_emitted`, `present:false` → `absent` (`mapquery.py:170-182` vs `form_drift.py:54-63`, V; inverted today).
    - (b) Lab plumbing: `regen-example.sh:60` FEEDS gains `forms.json` only (`levels.json` is already listed, V), and `forms.head` joins that script's volatile-stamp normalisation. `gen-endpoint-facts.py` reads `EX/forms.json` when present and emits `LABEP.forms = {state, reason, endpoint}`, raw.
11. **`scripts/forms-dryrun.sh <target…> --arms <list>`** (~90 lines, serial). For each target:
    - run `scripts/map-baseline.sh check` with arms unset (expect BYTE-IDENTICAL);
    - run it again with `GABE_FORMS_ARMS=<list>` (expect only `forms.json` to differ);
    - print one JSON line: forms bytes, `arms.*.stats`, per-arm serialised bytes, wall time.

    `map-baseline.sh` is read-only on targets (`GABE_REPO_ROOT` + `GABE_CENTER_OUT` + `GABE_GRAFT_BUILD=0`, `:9-11`, V). At build, confirm it passes the parent environment through to the build.

**Goldens (gustify):**
- Arms off: `forms.json` = today's bytes, plus `version: 2` and `head` equal to the same build's archmap head. The committed feeds carry `3ce6aae0` (V).
- Settings resolver on `RateLimitMiddleware._enabled` (`middleware/rate_limit.py:97-98`) gives `settings.rate_limit_enabled or settings.is_production` (`config.py:247-254`); `is_production` expands to `settings.environment is Environment.PRODUCTION` (`config.py:278`) (R, two designs agree).
- `EXEMPT_PATHS` resolves to `("/healthz",)` (`rate_limit.py:40`) (P).
- Catch trail for `ConsentRequiredError` from `services/setup.py:374`: `pass-through` at `:403` (bare raise `:407`), then `translate` at `api/setup.py:201` (V).
- Reach: `services/ai_spend.py::record_spend` is reached at depth 3 from `POST /recipe-creation/gustify` via `services/ai_recipes.py:325` (P).

**Battery `tests/forms-core/` (~300 lines):**

| # | kind | proves |
|---|---|---|
| K1 | SILENT | arms unset: `forms == P.build(amap) ∪ {head}`, no `arms` key |
| K2 | honest-empty | a monkeypatched fake arm that raises: `arms.fake.present false` + reason; `endpoints` byte-equal to the snapshot; later arms still run |
| K3 | FIRE/SILENT | ids are equal under 7 prepended blank lines; one detail edit changes exactly that `x:` id; an identical duplicate raise shifts `n` |
| K4 | FIRE/SILENT | settings: property one-hop, `x in CONST` resolved; an attribute set outside `__init__` stays `opaque` |
| K5 | FIRE | catch trail: pass-through → translate; a raise of a different class → `rethrow`, never `pass-through` |
| K6 | FIRE/SILENT | reach: `self.m()` resolved; the depth cap counts `truncated`; a vendored `scripts/_a3_code.py` is skipped |
| K7 | sync | `form_drift.NAG/COUNT` equal the registry's endpoint-arm nag/count lists (mutation: add a nag finding to the registry → FAIL) |
| K8 | guard | every `_a3_paths` private name the arms import exists (mutation: rename one → FAIL) |
| K9 | FIRE | `form_drift.load_forms` and `mapquery.forms_block` return the same state word for no-file and for `present:false` |

`tests/center/run.sh` gains a case beside `:357-388`:
- `GABE_FORMS_ARMS=all` on the fixture → `archmap.json`, `c4-graph.json` and `levels.json` byte-identical to the arms-off build;
- a raising `extend_backend` internal → exit 0 and `forms.json` still written.

**Dry run:** only the forms.json hash moves (version and head) on gustify, gastify and tier3; keypro unchanged (no forms). Record forms bytes before and after.

**Consumers:** form_drift state words plus the `tests/pulse-angles` expectations that name them; pulse patch-version bump; re-bless the forms.json hash in `tests/baselines/*.sha256`; regenerate the example estate.

**Effort:** M.

---

### Slice 2 · Ids — A3

**Generates:** `produced[].id` (`x:`), `preconditions[].id` (`g:`) and `.exit`. Written whenever any arm is on (D13), before the first stage, so no arm owns them. A top-level `ids` block carries `{present, reason, x, g, linked, ambiguous, unlinked, collisions}`; ids that fail read `present: false` and never cost the arms.

**Module:** the ids part of `_a3_forms_build.py` (+~60).

**Algorithm:**
1. Build a per-file line → innermost def map from `P._mod(...).defs`.
2. Compute each row's tuple and ordinal with `_a3_forms_ids.x_ids(repo, forms)` (§A1: `n` ranks distinct positions feed-wide).
3. Set `exit` on each precondition: the `x:` row whose `at` or `raised_at` equals the precondition's `at`.
4. Handle every `variants[]` entry separately.

**Goldens (gustify):**
- `POST /setup/complete`: the two 429 rows share every tuple field except `n`. The sensitive row (site `:117`) has n=0; the global row (site `:121`) has n=1. Both `at` = `rate_limit.py:127` (V, committed forms).
- The global 429 id is equal on every endpoint that carries it (V by construction; counts P: 79 after Slice 3 marks `/healthz` inapplicable).
- Precondition `key is None` (`api/setup.py:193`) → its `exit` = the 400 row's id.
- Hash strings are **recorded at the dry run, not asserted from the design.** The designers' values were computed under a feed-wide ordinal and are provisional.

**Battery `tests/forms-paths/`, first cases:**
- ids on the fixture's middleware 429 are equal across endpoints (FIRE);
- a validation row's id differs per handler (SILENT on sharing);
- line-drift and detail mutants as in K3.

**Dry run:** count ids, count id collisions (expect 0), forms bytes.

**Effort:** S.

---

### Slice 3 · Success exits, conditions, middleware and dependency forms — A4 · A5 · B-mw · B-dep

**Generates:**
- **paths** arm, parts `returns` and `conditions`: `returns[]`, `branches[]`, `collapsed[]`, top-level `conditions{}`, `when_for_path` / `applies` on middleware rows.
- **kinds** arm, parts `middleware` and `dependencies`.

**Modules:**
- `_a3_forms_paths.py` (part 1, ~250)
- `_a3_forms_mw.py` (~260)
- `_a3_forms.py` +~30 (`RESPONSE_CLASSES` reuse, `MIDDLEWARE_ORDER`, `TX_CALLS`, OPTIONS `expand_branches` / `exempt_rows`)

**Algorithm:**
1. **Handler exits.** Re-find the handler with `P._find_handler` (`:733-743`) and read `P._events`.
   - Bare returns come from `ast.walk`: `_walk` drops them (`_a3_paths.py:302-305`, V).
   - A trailing non-exit statement gives an `implicit` return.
   - A return in a swallowing except gives `catch-return`.
   - Status is `defined` only for a returned `RESPONSE_CLASSES` call with a literal status below 400; otherwise it is `declared.success` with state `default`.
2. **Candidate calls.** Handler call events resolved by `_a3_forms_reach.callee`.
   - Skip generators (Yield/YieldFrom): they run after the response line.
   - Skip calls whose handler-level catch swallows.
3. **Branch candidates.** Each value return in the callee: guarded → a branch; the first unguarded → the fall-through; `in_loop` is recorded and never multiplied.
4. **Expand only deciding callees:** at least 2 branches **and** either (a) the site contributes a produced row or precondition (join `via_sym == "call <qual>"`, or a `raised_at` inside the callee), or (b) the branches differ in a literal `.commit(` on their guard prefix. Never use archmap `access.commits`, which is true on flush (`_a3_code.py:1678`, V). Everything else goes to `collapsed[]` with a reason.
5. **A5 conditions.** For each middleware row with `when`, resolve its terms with `_a3_forms_settings`.
   - Per endpoint, substitute path membership against `full_path` (`_a3_paths.py:746-757`) and simplify.
   - A provable False gives `applies: false`. The row stays (`exempt_rows: annotate`, D19).
6. **Middleware forms** (`amap.app_middleware` sorted by `order`):
   - **order:** `runs = n-1-registered`, because Starlette does `user_middleware.insert(0, …)` (starlette `applications.py:101`, V);
   - **exits:** `P._middleware_exits` filtered by `via` (`:613-667`), carrying the same `x:` ids;
   - **pass-through arms:** split `BoolOp(Or)` into `exact-paths` / `prefix` / `method` / `flag` / `expr`, inlining a local assigned once;
   - **`applies_to` / `exempt`:** by `full_path`;
   - **helper hop:** a `return helper(...)` that builds a response class, as in `:712-719`.
7. **Dependency forms:**
   - Walk `C._endpoint_middleware` → `P._dep_target` (`:528-541`), depth ≤ `P._DEP_MAX`, with a cycle set.
   - K1 order comes from a new `_dep_params` that reads `args` in order through `C._annotated_depends` (`_a3_code.py:2105-2119`). `_endpoint_middleware` sorts gate-first, which is not FastAPI's order.
   - Own exits from `P._analyse`; inherited exits from `P._deps(repo, m, depnode, None, 0, set(), acc)` (arity V `:544`; `acc` keys `validated · framework · rows · escapes · unknown_causes · swallowed`).
   - Effects: commit-family calls in the dependency and its level-1 callees.
   - `yield` → `teardown: true`.
8. **Findings:** `indistinct-exits` (kinds · middleware K3 · count) and `dependency-commits` (kinds · dependency K3 · count).

**Goldens (gustify):**
- **`POST /setup/complete` returns/branches** (P; lines V against `path-map-status.md:104-106`):
  - handler return `api/setup.py:204`, after `not (key is None)`;
  - branches at site `api/setup.py:196`: REPLAY → `services/setup.py:346`; already → `:362`; fall-through → `:389`;
  - `why` = contributes-rows + commit-differs (commits `:361`, `:388`);
  - `collapsed`: `get_idempotency_key @:191` and `_me_response_from_result @:204` (one return each).
- **Feed-wide expansion** (P, an upper bound under a proxy rule): 16 handlers expand; ≤107 success exits; `GET /catalog/{domain}` → `_query_domain` has 8 branches.
- **A5:** `when_for_path` = `"settings.rate_limit_enabled or settings.is_production"` on `POST /setup/complete`. `GET /healthz` gets `applies: false`; today it wrongly carries the global 429 (V).
- **`middleware:RateLimitMiddleware`:**
  - order `registered 1, runs 1, of 3`, outer `CORSMiddleware`, inner `IdempotencyMiddleware` (`main.py:119-122`, `:127`, V);
  - pass-through arm `request.url.path in EXEMPT_PATHS` → `exact-paths ["/healthz"]`; arm `not self._enabled` → `flag`;
  - the sensitive exit applies to 23 endpoints, the global exit to 79 with `exempt ["endpoint:GET /healthz"]` (P);
  - `indistinct-exits` fires: one `_throttled` for both (`rate_limit.py:125-131`, R).
- **`apps/api/auth/context.py::get_auth_context`:**
  - subdeps in order `bearer_scheme`, `get_session`, `_resolve_verifier` (`:91-93`, R);
  - exit 401 "invalid token" `:99` `unverified`; inherited security 401 `:23`;
  - effect commit `auth/context.py:79` via `build_auth_context @:97`;
  - `applies_to` 78 endpoints (P; equals the 78 committed `dep` rows);
  - `dependency-commits` fires.
- **`db.py::get_session`:** `teardown: true`, no commit (`db.py:51-54`, V).

**Batteries:**
- `tests/forms-paths/`: P1 (a deciding callee → two branches), P2 (a non-deciding callee and a generator callee → collapsed), P6 (swallowed → `catch-return`), P7 (A5 `when_for_path`, `applies false` on the exempt path, row count unchanged).
- `tests/forms-kinds/`: C14 (middleware order + exemption + `applies_to`; mutation: swap the `add_middleware` lines → outer/inner swap; drop the exempt arm → `applies_to` +1), C15 (`indistinct-exits` FIRE/SILENT), C16 (dependency `applies_to`, subdep order, `dependency-commits`; SILENT on a dependency-free endpoint).

**Dry run — record:**
- returns and branches; collapsed by reason;
- rows with `applies:false` (gustify expects 1);
- middleware forms and exits; exits not on endpoint forms (tier3 captcha middlewares, P: 0 rows today);
- dependency forms and `applies_to` pairs;
- forms bytes; wall time.

**Effort:** M.

---

### Slice 4 · Schema short form, 422 cases, body-parse exits — A6 · critic gap G2

**Generates:**
- **short.schema:** `schemas{}`; `schemas[]`, `types` and `cases[]` on validation rows.
- **paths.framework:** `framework_exits[]`.

**Modules:**
- `_a3_forms_schema.py` (~430)
- `_a3_forms_short.py`: data only, ~130 (`PYDANTIC_ERRORS` with source cite, `TYPE_ERRORS`, `BODY_EMBED_SRC`, later `SQLA_ERRORS` / `ALEMBIC_OPS` / `SETTINGS_BASES` / `ENV_FILES` / `SECRET_NAME_RX`)

**Algorithm:**
1. **Schemas.** Take `amap.entities[*].schemas[]` (`_a3_code.parse_schemas`, `:532-557`) and re-parse with `P._mod`. `parse_schemas` is never changed. Merge repo bases through `P._resolve` / `P._bases` (`:129-154`). Read `model_config` `extra`.
2. **Fields.** Split each annotation (Optional · list · Literal · repo Enum · nested BaseModel · `Annotated` alias followed through a module assign). Read the `Field` / `constr` / `conint` keywords.
   - Constants resolve through a new int/str scalar-and-tuple reader in this module. `P._literal` reads str tuples only and is not widened.
3. **Validators.**
   - `@field_validator` / `@model_validator` bodies are walked with `P._events`.
   - `raise ValueError | AssertionError | PydanticCustomError` becomes a rule `{pred, msg, at}`.
   - strip/lower/upper/casefold becomes normalisation.
   - A repo helper call is followed one level with call-site keyword substitution: a guard falsified by the call's keywords drops its rule.
   - A call-valued allow-list gives `allowed.state unknown`, reason `runtime: <fn>`.
4. **Rule → error type** from `PYDANTIC_ERRORS`, verified against gustify's pydantic 2.13.4 (`uv.lock:1119-1120`, V; `pydantic_core/core_schema.py:4247-4337`, R). Per-annotation type errors collapse to `types: "collapsed"` (option `s_type_cases`).
5. **Loc per endpoint parameter.**
   - `P._find_handler` → `_validated_params` (`:505-525`) → `_param_ann` / `_class_of` (`:429-444`).
   - `Query`/`Path`/`Header`/`Cookie`/`Body`/`Form` give the location.
   - Embedding follows FastAPI's rule (`fastapi/dependencies/utils.py:892-913`, R).
   - A dependency parameter gets `cases: []`, reason `dependency parameter: rules not read`.
6. **Nesting** recurses with a `seen` set, depth ≤ 6. The rule belongs to the defining schema; `loc` carries the full path.
7. **S9–S11.**
   - S9: a `RequestValidationError` app handler via `P._app_handlers` (`:671-730`).
   - S10: consumers.
   - S11: test constructions inside `pytest.raises(ValidationError)`, matched by `match=`, by an extra key, or by the literal evaluator. Route-level tests stay `unknown` until Slice 9.
8. **Framework exits.** An endpoint whose chain reads a body gets two `x:` rows, both before security:
   - 422 JSON decode (`fastapi/routing.py:427`)
   - 400 body parse (`:447`)

   Both happen before `solve_dependencies` (`:457`) (V). Phase `body-parse`, state `default`.

**Goldens (gustify, `POST /setup/complete` 422 row).** 41 defined cases (P, corrected by source read). The body is one non-embed parameter (`api/setup.py:186`), so locs are `body.<field>`.

| group | cases |
|---|---|
| top level | `body` extra_forbidden `schemas/setup.py:24` (V) · `body.household_name` missing · string_too_short `min_length=1` · string_too_long `max_length=120` (R) · value_error "household_name must not be blank": strip `:43`, pred `not name` `:44`, raise `:45` (V) |
| household_format | extra_forbidden · country value_error · units allow-list `["metric","imperial"]` (`constants.py:17`, V) · currency value_error · default_servings allow-list `[1,2,3,4,5,8,10,20]` (`constants.py:16`, V) |
| user_format | extra_forbidden · language value_error |
| dietary | extra_forbidden · allergens: empty tag, at most 5 (`MAX_ALLERGENS`, `constants.py:27`, V), unknown code (allowed `unknown`, runtime `allergen_codes()`) · preferences: empty tag, at most 20. **No** allow-list case for preferences: the guard `if allowed is not None` is false (R). |
| exploration | extra_forbidden · empty / at-most / runtime-unknown for 6 list fields · `skill_complexity_cap` range 1..5 · `preference_temperature` runtime-unknown (R) |
| privacy · notifications | extra_forbidden ×2 |

- Beside the list: one framework `default` case (body missing); type errors collapsed.
- The full 41-row list is pinned in the goldens file (§A4 step 1) **from the dry run**, then compared by hand against the table above.
- **Trap:** test C1052 ("too_many_allergens") sends 4 allergens (`tests/test_setup_routes.py:83-91`, V). That is under 5, so its 422 is the runtime unknown-code rule. Nothing may join C1052 to the at-most-5 case.
- **`PantryItemCreate` on `POST /pantry/items`** (P): 9 cases — ingredient_code missing / too long 80 · display_name missing / too long 200 · kind literal_error `['ingredient','prepared']` · quantity greater_than `gt=0` · unit_code too long 20 · expiry_date too long 10 + pattern. S6 `default` → finding `extra-ignored`. S11 `missing`.
- **Framework exits:** `POST /setup/complete` carries both body-parse exits; `GET /history/dishes` (no body) carries none.

**Battery `tests/forms-short/`, schema part:**
- SF1: an exact case list on a nested body. SILENT: no extra_forbidden without `forbid`, no allow-list case when the guard is falsified, no normalisation row.
- SF2: `Query(ge=1, le=50)` bounds; SILENT on `missing`.
- SF-B: body-parse exits FIRE on a body endpoint, SILENT on a GET.
- SF9: determinism.
- SF11: a raising schema part → `arms.short.parts.schema` reason; endpoints restored.
- Mutation SF10a: drop `extra="forbid"` → the case goes.

**Dry run — record:**
- schemas; cases on rows; unknown by reason; `runtime-allowlist` count; framework exits.
- gustify expectation: 123 schemas (archmap count).

**Effort:** M.

---

### Slice 5 · Switches, then paths — A11 · A8

**Generates:**
- **switches:** `switches[]`, U8.
- **paths.paths:** `paths[]`, U6.

**Modules:**
- `_a3_forms_switch.py` (~280)
- `_a3_forms_paths.py` (+~250 → ~500)
- `_a3_forms.py` +~25 (`PATH_CAP` 48, `CHAIN_KINDS`, `PATH_EXPRS`, OPTIONS `combos`)

**Algorithm — detection comes before placement:**
1. **Scope functions:** the handler, its level-1 callees, every dependency function `_deps` walks, and those dependencies' level-1 callees (resolved with `callee`). Each carries `levels_id`, stage and anchor.
2. **Binding switches** from `_a3_stacks_pydi.parse(repo)`, memoised per build. Its `wiring` argument is never read (`:232`); edge `predicate` / `binding` sit at `:354-359` (V). Group by `(s, port)` for `s` in scope.
   - `factory`: the def whose return annotation names the port.
   - `changes_exit`: whether the escaping classes of each branch's `t` method (`P._analyse`) differ against the scope's catches.
   - When they agree, the translated row's paths get `proven_by`.
   - Levels `binds` are a **cross-check count, never a source**.
3. **Value switches**, on success paths only. A reach BFS to `reach_depth` (4) finds a function with at least 2 value returns, at least one guarded, every return a settings attribute or a constant (at least one a setting), and a guard comparing with a constant or an ALL-CAPS enum member. The discovery depth never produces rows (D17).
4. **Flag switches:** joins only, onto A5 conditions and `kind: flag` preconditions.
5. **Exit set:**
   - every `produced[]` and `framework_exits[]` row with `applies` not false;
   - the success combinations;
   - uncaught: one `anywhere` path per endpoint, plus one placed 500 per `escape-500` whose `at` and `pred` are known.
6. **422 split:** a row mixing `dep.param` names with own params becomes two paths — `dependency-params` before that dependency's body, `own-params` after every dependency (`fastapi/dependencies/utils.py:628-663` then `:685-712`; the raise at `routing.py:723`, V). Each path's `cases` holds that split's case ids from Slice 4.
7. **Chain, built backwards from the exit's stage:**
   - `step` rows for non-refusing middleware in `middleware.order`;
   - `gate hit:false` for every earlier-stage row;
   - the handler spine: anchors sorted by line (depth-0 raises, contributing call sites, exits). An anchor joins exit E when `A.line ≤ E.line` and A's guards prefix E's guards, or A's extra guard terms appear negated in E's `after`, read from the `_walk` stacks (`_a3_paths.py:264-307`);
   - inside an expanded call, each `after` term is classified by matching its return (`branch hit:false`) or its raise (`gate hit:false`);
   - `collapsed` chain entries for collapsed sites on the path;
   - `catch` steps from `_a3_forms_catch.trail`, using the §A1 vocabulary;
   - `switch` steps placed at (stage rank, anchor) on every later path — a switch never forks.
8. **Linear combination:** paths = 1 + Σ(branches − 1) per exit. `combinations_omitted` = product − linear. Past `PATH_CAP` 48, keep every refusal path plus success paths in id order, and set `paths_truncated`.
9. **Names and state:**
   - `names{}` holds every candidate (detail · token by the guard-token rules · exception · stage); no `name` key (D15).
   - A path is `partial` when a step is unknown: dynamic status, an `unverified` row no binding proves, an ambiguous binding, `anywhere`.
   - Order by (`PATH_PHASES` rank, anchor line, callee line, status, id).

**Goldens (gustify, `POST /setup/complete`).**

The switches:
- **Binding switch** (V against committed levels `binds`, 2 of 2 placed):
  - scope `dependency`, fn `auth/context.py::build_auth_context`, site `:77`, anchor `:97`, port `TokenVerifier`;
  - branches `FirebaseTokenVerifier` (pred `settings.auth_provider is ProviderMode.REAL`) and `MockTokenVerifier` (its negation);
  - both raise `InvalidTokenError` → `changes_exit: false`, so the dependency 401 path is `proven_by` it.
- **Value switch** `services/ai_credits.py::allowance_for`: `tier == 'chef'` → `settings.ai_credits_chef` (`:66-67`), else `settings.ai_credits_free` (`:68`) (P, two designs agree). The call chain from `api/setup.py:204` to `:103` is (U).
- **Flag switch** refs the two 429 ids; flag `rate_limit_enabled` default false (`config.py:137`, R).

Paths, in order. E = `step IdempotencyMiddleware · step RateLimit… · gate X3 · switch S1 · gate X4 · gate body-parse · gate 422`; the exact middleware step order is recorded at the dry run.

| # | exit | chain after the stage prefix | state |
|---|---|---|---|
| 1 | 429 sensitive | hit (cond: when ∧ scope ∧ `not self._sensitive.allow(key, now)`) | defined |
| 2 | 429 global | pass #1 · hit | defined |
| 3 | 422/400 body-parse ×2 | after the middleware passes | defined |
| 4 | 401 "Not authenticated" | security hit | defined |
| 5 | 401 "invalid token" | switch S1 · hit · catch translate `except InvalidTokenError` `auth/context.py:98` | defined, proven_by S1 |
| 6 | 422 body | cases = Slice 4's 41 | defined |
| 7 | 400 "Idempotency-Key required" | E · hit `key is None` `api/setup.py:193` | defined |
| 8 | 200 replay | E · pass · call `complete_setup @:196` · branch hit `services/setup.py:346` · switch value | defined |
| 9 | 409 "setup in progress" | E · call · branch pass replay · hit `:348` · catch translate `api/setup.py:199` | defined |
| 10 | 200 already | … · branch hit `:362` | defined |
| 11 | 409 "consent required" | … · branch pass already · hit `:374` · **catch pass-through `except Exception` `services/setup.py:403`** · catch translate `api/setup.py:201` | defined |
| 12 | 200 otherwise | … · pass consent · branch hit `:389` | defined |
| 13 | 500 uncaught | anywhere; `unknown_causes ["pass-through raise apps/api/services/setup.py:407"]` | partial |

- Path #11's catch op is **pass-through**. The designer's "rethrow" was wrong (V).
- The drawn map has 10 paths. The generator splits Bad token into 2, Throttled into 2 and Bad body into its body-parse exits plus the schema 422. Display grouping is not chosen here.

Other endpoints:
- **`GET /recipe-creation/gustify/stream`** (V):
  - 57 validation rows feed-wide, exactly 1 mixed: this endpoint.
  - The path `422 dependency-params [get_auth_context_from_query.token]` sits **before** the 401: a missing token answers 422, the plan §6 "needs a person" row, now structural.
  - `stream_gustify_events` collapsed as a generator (`services/ai_recipe_stream.py:129`, R).
- **`GET /healthz`:** no 429 path.

**Battery `tests/forms-paths/`:**
- P3: ids under line drift across paths.
- P4: chain kinds, in order, for a translated 409.
- P5: the linear rule — two deciding callees with 2 branches each → 3 success paths, `combinations_omitted == 1`.
- P8: binding preds equal `_a3_stacks_pydi.parse` (asserted in the check); `proven_by`.
- P9: value switch at depth 3 on success paths only. Mutant: depth 5 → gone, `switch_depth_capped ≥ 1`.
- P10: SILENT — a dataclass factory under a non-abstract annotation gives no binding (the tier3 billing shape); a compare on a non-setting gives no value switch.
- P11: mutations — delete `if x.done: return x` → a branch and a path go; drop the `Protocol` base → the binding goes; add the path to EXEMPT → its 429 path goes.
- P12: honest-empty + determinism; strip the new keys → equals `P.build`.
- P13: the 422 split on a query-dependency fixture.

**Dry run — record:**
- paths / success / refusal / uncaught / partial;
- branches, collapsed, `combinations_omitted`, `paths_truncated`;
- switches by kind; `binds_unplaced`; levels cross-check (gustify 2/2);
- forms bytes; wall time.
- gustify upper bound ≈ 685 paths (P); tier3 needs a fresh build (its committed center has no forms.json, V).

**Effort:** M–L.

---

### Slice 6 · Effects along paths and failure handling — A9 · A7

**Generates:** effects arm: `steps{}`, `paths[i].effects`, `failure{}`, U9, U11; race facts on insert steps (`steps[st].race`).

**Module:** `_a3_forms_effects.py` (~520). `_a3_forms.py` +~40 (`EFFECTS` depth · ops · widenings, `DEPENDENCY_ORDER` with cites, `SUPPRESSORS`).

**Algorithm:**
1. **Model → table** from `amap.entities[*].models[]` plus `C.model_census` (`_a3_code.py:859`), mirroring `function_insight` (`:2203-2212`). Unique columns come from `uqs` parsed with `ast` and from `Index(unique=True)`.
2. **`effect_events(fn)`** uses `C._ORM_WRITE_M` / `_WRITE_CORE` / `_READ_CORE` idioms (`_a3_code.py:1674-1677`) but emits one line-carrying event per occurrence. `flush`, `commit`, `rollback` and `savepoint` stay separate: the archmap lumps commit with flush (`_ORM_COMMIT = {commit, flush}` `:1678`, V).
   - Four named widenings: W1 tuple-unpack by return annotation · W2 select-bound · W3 select-anywhere · W4 `add_all`.
   - `C._orm_access` (`:1703`) is never changed; its output has no lines (`:1762-1764`).
3. **Collapse below the spine.**
   - `cond` is true under if/else bodies, loops, except bodies, and after a sibling exiting `if` (`_a3_paths.py:276-277`).
   - Recursion to depth 4 with memoisation and a cycle guard.
   - Depth 5 counts into `floor`.
   - Protocol-typed calls go to `unresolved`.
4. **Along each Slice 5 path,** walk the path's anchors in order and splice in each anchor's collapsed steps.
   - A non-exiting `if` gives `cond` steps.
   - `with suppress(...)` marks steps `suppressed`.
   - `begin_nested()` adds a `savepoint` step and tags the inner steps.
   - A raise inside a try walks the matching handler body with the state at the raise (via `_a3_forms_catch`), so rollback and discard land on that path.
5. **Rollup per path:**
   - write/delete → pending;
   - an unconditional commit → committed;
   - a conditional commit → maybe_committed;
   - rollback → rolled_back;
   - flush → no change;
   - still pending at the end → uncommitted (`get_session` never commits: `db.py:51-54`, V).
   - The uncaught path gets `may_follow_commits` = every commit step on any path.
6. **Dependency attachment** from `F.DEPENDENCY_ORDER`, gated on FastAPI ≥ 0.136.3:
   - `not-run` for middleware exits, body-parse exits, security 401 and a dependency whose own params fail (`routing.py:427-457`; `dependencies/utils.py:628-663`, V);
   - `ran` for endpoint-param 422 (`utils.py:685-712`, raise `routing.py:723`, V), handler refusals, success and uncaught;
   - `unknown` for a refusal raised inside the dependency whose raise site is `unverified`;
   - below the minimum version, every field is `unknown`.
7. **U11 catches:** per `try` on a path or dependency — types, the guarded region's writes and commits, `actions[]`, outcome, answers, and the path ids through it.
8. **Race facts.** For an `add(<bound instance>)` on a table with a unique constraint, key on the first flush or commit after it on the path (possibly in another function):
   - an enclosing `except IntegrityError` that returns or translates → `handled`;
   - a broad catch that re-raises does not count;
   - otherwise → `uncaught`.
   - The finding is emitted in Slice 7.
9. **Findings** (effects arm): `refusal-writes` (U9, count), `safe-method-commits` (U9, count).

**Goldens (gustify):**
- **The auth commit** `auth/context.py:79` (V) attaches to 400, 409, endpoint-param 422, success and 500. It does not attach to 429, security 401 or body-parse exits. It is `unknown` on the dependency 401. This answers `shallow-logic-maps.html:250` and corrects the drawing's "writes none" on refusal paths.
- **Claim** `services/idempotency.py`: `begin_nested :138`, add `:139`, flush `:140`, `except IntegrityError :141`, `raise :144`, return `_outcome_for :145` → race `handled` (V).
- **First setup:** commits `auth/context.py:79` and `services/setup.py:388` (V); writes `households` via W1 at `services/setup.py:377` (R).
- **Consent path:**
  - `rolled_back` at `:404`;
  - `_discard_claim` at `:406` suppressed by `:405`: delete `idempotency_keys :333` conditional, commit `:334` conditional (R). This disagrees with the drawn "commits 0".
- **Replay:** reads only after auth (R). The designer's table count (11) is **(U)**; record it.
- **`ai_spend_log`** read at `services/ai_credits.py:83` via W3 (V).
- **`POST /pantry/reset/apply`:** insert flushed at `services/pantry_reset.py:72`; the only catch is `except ResetConflictError` (`api/pantry.py:531`); commit `:533` → race `uncaught` (V; unique `models/pantry.py:115`).
- **`POST /cooking/sessions`:** add+flush `services/cooking.py:165-166`, unique `models/cooking.py:39-40`, catches at `api/cooking.py:155-166` are non-Integrity → race `uncaught` (V). At build, confirm `start_session` has no IntegrityError catch (U).
- **`GET /recipe-creation/gustify/stream`:** commit `ai_recipe_stream.py:302` inside `except IntegrityError :303` → `handled` (R).

**Battery `tests/forms-effects/` (~380 lines):**

| # | kind | proves |
|---|---|---|
| E1 | FIRE | ordered steps and rollup on the fixture's place path |
| E2 | FIRE + SILENT | dependency `ran` / `not-run` mapping; `refusal-writes` present on place, absent on pure |
| E3 | FIRE | consent-shape rollback, suppressed discard, pass-through outcome |
| E4 | FIRE | each widening tagged |
| E5 | parity | with widenings off, `{(model, rw)}` and commit-flag parity equal `C._orm_access`; archmap identical |
| E11 | floors | depth-5 floor, unresolved port call, cap |
| E12 | honest-empty + determinism | step ids stable under line drift |
| E13 | mutation | (a) delete the handler commit → committed empties; (b) wrap the flush in `except IntegrityError` → race `handled`; (c) delete the rollback → `rolled_back` empties |

**Dry run — record:**
- steps; commit sites; floor; unresolved calls; findings;
- forms bytes; the effects arm's serialised bytes on tier3 (the D20 trigger); wall time.

**Effort:** M–L.

---

### Slice 7 · Contract — A12 (U12 · K2 · K3 · K4)

**Generates:** contract arm: `repeat{}`, `auth{}`, `rate{}`, `responses{}`; the finding `race-500` (U12, **nag**).

**Module:** `_a3_forms_contract.py` (~340). It reads `steps{}` and race facts from the in-memory feed and imports no arm. `_a3_forms.py` +~20 (`KEY_NAME_RX`, `GUARD_IDIOMS`, `RATE_IDIOMS`, `BODIES` with cites).

**Algorithm:**
1. **U12 key.** A handler local from a helper that reads `request.headers.get(X)` or `request.state.<attr>`. The `state` hop follows into the repo middleware `dispatch` that sets it (the `_middleware_exits` walk). The name must match `KEY_NAME_RX`. `required` = the existing `key is None` precondition.
2. **Claims.** Follow the key argument by position or keyword (depth ≤ 2) to `Model(col=<key>)` with `col` in a unique constraint.
   - `race` comes from Slice 6.
   - `race: uncaught` fires `race-500`.
   - `arms` = the consecutive exiting ifs on the claim result.
   - `idioms` covers `on_conflict_do_*`, `with_for_update` and get-or-create.
3. **K2:**
   - schemes from security rows (with carrier);
   - gates from archmap `middleware[]` with `gate: true`;
   - requires from preconditions whose `via` names a method of the gate's return class;
   - provisions from dependency commit steps that write.
4. **K3.** Take the 429 row's `pred` attr → the `__init__` assignment `Limiter(s.a, s.b)` → name the arguments from the limiter's `__init__` parameters → values from the settings leaf (`state: default`, since the environment can override).
   - `switch` and `exempt` come from the Slice 3 conditions.
   - Third-party limiters come from `RATE_IDIOMS`.
5. **K4 per exit:**
   - success → `response_model` fields, one level (`P._declared` `:760-783`);
   - HTTPException → `{detail}` plus headers (`fastapi/exception_handlers.py:11-17`);
   - 422 → `{detail: list}`;
   - security 401 → `WWW-Authenticate: Bearer` (`fastapi/security/http.py:84-92`);
   - a response literal → its keys;
   - 500 → `text/plain`;
   - stream → `n/a`.

**Goldens (gustify):**
- **`POST /setup/complete` U12:** key `Idempotency-Key` (`middleware/idempotency.py:14`, R) via `api/setup.py:191`; required 400 `:193` (V); claim `IdempotencyKey`, unique `uq_idempotency_key_op_owner` (`models/idempotency.py:23`, R); race `handled` → `race-500` **SILENT**.
- **`POST /pantry/reset/apply`:** `race-500` **FIRE** (V). `POST /cooking/sessions`: FIRE (V, pending the `start_session` check). The stream endpoint is SILENT (R). gustify total = 2.
- **K3 on `POST /setup/complete`:**
  - `_sensitive` 20 per 60.0 (`config.py:139`, `:140`), key `f"{ip}:sensitive"`;
  - `_global` 120 per 60.0 (`:138`);
  - switch → `rate_limit_enabled or is_production`; exempt `["/healthz"]` (R + Slice 1 resolver).
- **K2:** HTTPBearer header (`auth/context.py:23`) · gate `get_auth_context` · provisions `users`, conditional, committed at `:79`.
- **K4:** 200 `MeResponse` fields (`schemas/responses.py:157-163`, R) · 401 security with `WWW-Authenticate` · 429 `{detail}` + `Retry-After` (`rate_limit.py:127-131`, R) · 500 text/plain.
- **`GET /history/dishes`:** U12 `n/a`; K3 global only (the path is not in `SENSITIVE_PREFIXES`, `rate_limit.py:27-37`).

**Battery `tests/forms-contract/` (~250 lines):**
- E6: `race-500` FIRE on place; SILENT on the handled claim and on the commit-in-another-function shape (the prototype's misfire shape).
- E7: U12 states `n/a` / `missing`.
- E8: K3 values.
- E9: K4 shapes.
- Mutations: (b) wrap the flush → `race-500` goes; (d) `hot_per_minute` 5 → 7 → K3 value 7; (e) `auto_error=False` → the scheme and its `not-run` mapping go.

**Dry run — record:**
- U12 / K2 / K3 / K4 state counts; `race-500`; idioms.
- tier3 (R): 0 Idempotency-Key header reads (grep), so U12 key is null everywhere; K3 expected `missing` / `unknown`.

**Effort:** M.

---

### Slice 8 · Function, task and handler forms — B-fn · B-task · B-evt (service K2 folded in)

**Generates:** kinds parts `functions`, `tasks`, `handlers`. There is no `services{}` map: service K2 lives as `functions[].raises[].translated_by` / `untranslated_at`.

**Modules:** `_a3_forms_fn.py` (~260), `_a3_forms_task.py` (~250). `_a3_forms.py` +~25 (`TASK_KW`, `RETRY_CALLS`, `LOCK_CALLS`, OPTIONS `function_scope`, `k2_climb`).

**Algorithm:**
1. **Roots:**
   - endpoint handlers;
   - task roots from `amap.task_roots` (`build_center_a3.py:2106`), keyed `endpoint:TASK <name>`;
   - event handlers from `amap.dispatch.dispatches[].t`, converted from `file#qual`;
   - task dispatch edges from `C.task_map(repo)` (cached `_TASKS`, `_a3_code.py:2722-2724`). Never from levels.
2. **Reach:** `_a3_forms_reach.bfs` seeded with handlers, dependency defs at their `applies_to` depth, dispatch and task edges (`rel: dispatches`), and task/handler roots. Each entry is `{root, depth, rel, caller, site, root_site}`; `reached_by[].paths` = the paths whose chain has `{kind: call, at: root_site}`.
3. **Function forms** for reached functions that carry a fact:
   - `commits` are refs to Slice 6 `st:` ids (a hard need);
   - `raises` come from `P._analyse` escapes, with `through` from the catch trail;
   - `translated_by` is joined from produced rows with `raised_at == at` and `source: verified`;
   - `untranslated_at` comes from `escape-500` / uncaught `causes`;
   - `refusals` carry `surfaces_on`;
   - with `k2_climb: one-level` (default) a deeper function gets `translation: "beyond one level"`.
4. **Task forms:**
   - decorator keywords filtered to `TASK_KW` (literal or `{expr, state: unknown}`);
   - retry sites (`retry` calls with `P._where`);
   - the last-failure `If` comparing `retries` with `max_retries`, with its guard read from the `If` itself, because `P._exits` ignores `break` (`_a3_paths.py:254-255`);
   - trigger from dispatch sites plus beat dicts joined through `C._name_arg` (`_a3_code.py:2670-2678`);
   - concurrency from keywords and locks.
5. **Handler forms:**
   - resolve the publisher's `bus.publish`;
   - the registration order;
   - classify the publish loop's catch;
   - `begin_nested` → `isolation: savepoint`;
   - `retries: 0`, `sequential` unless gather/create_task;
   - the publisher's commits before and after the publish site.
6. **Findings** (kinds): `swallows-broad` (count), `untranslated-raise` (count → endpoint `escape-500`), `retry-unbounded` (**nag**), `handler-dropped` (count).

**Goldens:**
- **`apps/api/services/setup.py::complete_setup`** (P, joined from committed forms):
  - `SetupInProgressError` `:348` → translated `POST /setup/complete` 409 (`api/setup.py:200`) and `POST /_e2e/seed` 409 (`api/e2e_seed.py:88`);
  - `ConsentRequiredError` `:374` → through `:403` pass-through → translated `api/setup.py:202`; `untranslated_at` `POST /_e2e/seed` 500, matching that endpoint's committed `escape-500` (V);
  - `reached_by` d1 at `api/setup.py:196` and `api/e2e_seed.py:84`.
- **`services/ai_spend.py::record_spend`:** savepoint `:97`; catch `:102` swallow → `swallows-broad`; `reached_by` d3 / d4 (P). `root_site` is (U) until built.
- **`services/skills.py::on_cooked_meal_created`:** savepoint `events/bus.py:77`; swallow `:79`; counter `:81`; `register_once :106-107` (V); publisher `api/cooking.py:417` with commits before `:410` and after `:425` (P).
- **tier3 `endpoint:TASK document_by_cc_pair_cleanup_task`:** decorator `shared/tasks.py:104-110`; retry `:345`; last failure `:312` → `break` (R).

**Battery `tests/forms-kinds/`, continued:**
- C17: translators and `untranslated_at`; SILENT depth floor.
- C18: `swallows-broad` FIRE/SILENT.
- C19: task decorator, retry, beat join, unresolved dispatch, `retry-unbounded`.
- C20: handler trigger, isolation, retries.
- C21: mutations — delete `except Busy` → the translator moves to `untranslated_at`; remove `max_retries` → `retry-unbounded`; delete `register_once` → the handler form goes.
- C22: honest-empty / determinism / non-interference.

**Dry run — record:**
- forms per part; `reached_by` pairs; truncated; beat joined / unjoined; unresolved dispatch.
- tier3 prototype numbers to re-measure: reach 1,641 functions / 6,040 pairs at depth 4; 46 task roots; beat 25/31 joined (P). Timings (U).
- The `functions` bytes feed D20.
- Named floor: `@app.middleware("http")` functions counted in `arms.kinds.stats`.

**Effort:** M–L.

---

### Slice 9 · Tests per exit and per path — A10

**Generates:** tests arm: `test_cases{}`, `produced[j].tests`, `tests{}` on endpoints (`act`, `arranged_by`, `helper_arranged`, `unjoined`), `paths[i].tests`, U14; findings `test-detail-unmatched`, `asserted-unproduced`, `untested-exit` in `arm_findings.tests`.

**Modules:**
- `_a3_test_asserts.py` (~280): pure extraction plus the role classifier, with no forms knowledge, so Slice 10's S11 and F8 reuse it.
- `_a3_forms_tests.py` (~240).

**Algorithm:**
1. **Corpus:** `D.load_junit` (`_results_ingest.py:49-89`) per Python corpus; root via `_a3_tests._probe_root` (`:82-99`). No Python junit → `present: false` + reason.
2. **Per test def,** a statement walk:
   - HTTP calls (`_VERBS :74`, `_fstr_segs :134-144`, the `full_path` template first, else `_ep_match :113-131` → `route_match: suffix`);
   - the header set sent;
   - helper/fixture calls (one hop, role `arrange`);
   - service calls under `pytest.raises`;
   - aliases;
   - asserts: `status`, `status_in`, detail, code keys, `is_success`, attrs.
3. **Roles,** first match wins:
   - R1: inside a helper → arrange;
   - R2: never asserted → arrange;
   - R3: status-only 2xx followed by an asserted call → arrange-checked;
   - R4: otherwise → act.
4. **Join** act calls to candidate exits by `x:` / `r:` id:
   1. by status;
   2. narrowed by detail/code;
   3. narrowed by header shape (security row vs dependency row), skipped when `sends` is null or `dependency_overrides` exists;
   4. service raises via `pytest.raises(X)` → rows whose `raised_at` file equals the target's;
   5. service returns via attr literal vs a return keyword literal.

   One candidate left → its conf; several → `ambiguous of n`; zero → `asserted-unproduced`.
   - A bare 422 assertion joins the row's `x:`, never a case.
5. **`paths[i].tests`** = the refs on `paths[i].exit.id`.

**Goldens (gustify; test lines V):**
- **Over-credit today:** `test_insight.by_endpoint[setup_complete].api` holds 26 cases (V). The act vs arrange split (designer: 12 / 14) is (U); record it.
- **C1048** (`tests/test_setup_routes.py:23`, asserts `:28-29`) → 400 `status+detail`.
- **C1054** (`:107`, `in (401, 403)` `:108`, no `headers=`) → `GET /me` security 401 `status+shape`, `alternatives [403]`.
- **C1057:** calls `:158/:161` → ambiguous of 2 (the 409s) · `:162/:165` → arrange-checked (consent) · `:166/:169` → success.
- **C1051 / C1052** → the 422 row only. C1052 never joins at-most-5 (4 < `MAX_ALLERGENS` 5, V).
- **C605 / C705** (P) are arrange-checked setup calls, so the lab's name-parsed `404` column is wrong for setup.
- **Replay vs Already** cannot be told apart statically (both return `_load_setup_result(…, replayed=True)`) → ambiguous refs only.
- **tier3:** no `tests/results` → `present: false`. gastify has `api-junit.xml`.

**Battery `tests/forms-tests/` (~300 lines):** T1–T11 as designed.
- T5 SILENT: arrange helpers credit nothing.
- T9 honest-empty.
- T10: `_a3_tests.test_insight` output unchanged before and after.
- T11 mutations:
  - (a) delete the status assert → the exit becomes untested;
  - (b) `raises(Busy)` → `raises(ValueError)` → the ref goes;
  - (c) add `headers=AUTH` → the ref moves from the security row to the dependency row;
  - (d) delete the later act → setup becomes act.

**Dry run — record:** cases; calls by role; unmatched; headers unknown; joins by conf; exits tested / total; endpoints tested. gustify prototype frame: 622 calls, 109/577 exits joined (P).

**Effort:** M.

---

### Slice 10 · Model, migration, setting and mirror short forms, plus `external` — B-model · B-setting · X1

Sub-slices each get their own "land it": **10a** model + migration · **10b** setting + `external` · **10c** mirror.

**Generates:** short parts `model`, `migration`, `setting`, `mirror` → `models{}`, `settings{}`, `mirrors{}`.

**Modules:**
- `_a3_forms_model.py` (~380, imports `_a3_forms_migrate`)
- `_a3_forms_migrate.py` (~300)
- `_a3_forms_setting.py` (~360, uses the settings leaf)
- `_a3_forms_mirror.py` (~280)

**Algorithm:**
1. **Model (M1–M7, M9):**
   - `__table_args__` (Index / UniqueConstraint / CheckConstraint);
   - columns with FK `ondelete`;
   - effective nullability: explicit keyword > primary key > `Mapped[Optional]` under SQLAlchemy ≥ 2.0 (`uv.lock:1437-1438` 2.0.50, V; below or unreadable → `unknown`);
   - default classes;
   - `fk_in`;
   - `guard_use` (a select on exactly a unique column set followed by an exiting `If`);
   - hooks;
   - writers from `function_insight.access.ops` plus `writers_outside_map` (a constructor scan, center machinery skipped).
2. **M10** refers to Slice 6 race facts and Slice 7's `race-500` by id. There is no second detector.
3. **Migration (M8):**
   - find `alembic.ini` files, skipping center dirs via the reach leaf;
   - order revisions breadth-first from `None`, tie-broken by filename; more than one head → `unknown`;
   - replay `upgrade()` ops from `ALEMBIC_OPS`, including batch bodies (`op.execute` counted as `raw_ops`);
   - diff against the model with **normalised** types (`Uuid ≡ Uuid()`, `String(20) ≡ String(length=20)`).
4. **Setting (F1–F8):**
   - Declarations: Settings fields + `Final` constants (option `setting_constants`).
   - Env name from `env_prefix` / alias.
   - Type and allowed values.
   - Validators and startup rules via the `_walk` stacks.
   - Readers only with a **verified** receiver; the rest go to `readers_unverified`.
   - `effective[]` pairs by the `_a3_graph._fold_flag_aliases` evidence rule (`:345-363`), recomputed here.
   - `copies[]`, never readers.
   - F6 fallback exits joined from endpoint forms.
   - F8 test values via `_a3_test_asserts`.
5. **F4 per environment.**
   - Scan a **fixed filename allow-list only**, never `git ls-files` (D24): `.env.example|sample|template|development|test`, `docker-compose*.yml`, `railway.json`, `.github/workflows/*.yml`.
   - Never read `.env` or `.env*.local`; secrets are redacted.
   - A value set only outside the repo → `external` (D23).
6. **Mirrors:**
   - Pairing by `flow+orm` (default) — `Model(col=<schema param>.<f>)`, sibling rebuilds, `_schema_orm`.
   - Rules: length · bound · allowed · default · nullable · pattern · flag-pair · setting-copy.
   - Verdicts `agree` (counted) · `disagree` · `schema-only` (+ `bypass_writers`) · `model-only` · `unknown`.
7. **Findings** (short):

   | finding | class |
   |---|---|
   | `migration-drift` | nag |
   | `mirror-disagree` | nag |
   | `extra-ignored` | count |
   | `runtime-allowlist` | count |
   | `no-refusal-test` | count |
   | `violation-500` | count |
   | `default-overridden` | count |
   | `unbounded-number` | count |
   | `startup-unchecked` | count |
   | `env-unset` | count |
   | `one-value-tested` | count |
   | `schema-only-bound` | count |

   `uq-race` is gone; M10 refers to `race-500`.

**Goldens (gustify):**
- **`model:PantryItem`:**
  - M8 drift 3: `unit_code` server_default model none vs migration `'unit'` (`migrations 0004_pantry_and_history.py:38`, V; model `models/pantry.py:58`, V) · `created_at` / `updated_at` nullable: model NOT NULL by annotation vs migration NULL (`0004:44-45`, V).
  - Migrations live at gustify's root (`alembic.ini:6`, V).
  - M10: `POST /pantry/items` → 500; `POST /pantry/items/batch` → swallowed at `api/pantry.py:257` then 500 at commit `:271` (P).
- **`model:PantryResetOperation`:**
  - unique `(household_id, idempotency_key)` (`models/pantry.py:115`, V) with `guard_use` `services/pantry_reset.py:50-57` (R);
  - `created_at` drift (`0004:76`, R; corrects `element-forms.html:899` "matches");
  - M10 refs `race-500`;
  - `default-overridden` (`status="in_progress"` at `pantry_reset.py:68`, R).
- **`setting:recipe_creation_enabled`:**
  - `config.py:112`, env `GUSTIFY_RECIPE_CREATION_ENABLED`;
  - effective with `RECIPE_CREATION_ENABLED` (`constants.py:68`);
  - verified readers `api/recipe_creation.py:72` (receiver `:66`) and `api/recipe_stream.py:135` (receiver `:119`); readers `:235` and ws `:195` (U) until the receiver check runs;
  - startup rules `config.py:300-303` and `:362-372`;
  - F4 `external` / `env-unset` (R).
- **`setting:ai_credits_chef`:** `config.py:202` int 15, no bound → `unbounded-number`; reader `services/ai_credits.py:67` (R).
- **Mirrors** (P):
  - `quantity` `gt=0` schema-only, bypass writers `services/shopping.py:452`, `services/cooking.py:608`;
  - `unit_code` default `"unit"` (`schemas/pantry.py:20`) vs `"un"` (`:326`) → disagree;
  - `notes` length disagree;
  - `kind` Literal vs `ck_pantry_items_kind` → agree (counted).

**Battery `tests/forms-short/`, continued:**
- SF3: M2 `guard_use`, M4, M6, M8 drift; SILENT: the batch-added check matches.
- SF4: M10 refs; SILENT on the handled claim.
- SF5: setting effective, verified reader, copies not readers, F6 exit, F8 autouse.
- SF6: `unbounded-number` FIRE/SILENT; F4 commented value.
- SF7: mirrors.
- SF-X: `external` state on a deploy-only value; SILENT when a tracked example file sets it.
- SF10 mutations b–f as designed (drift, typed receiver → reader, sibling defaults equal → mirror row gone).

**Dry run — record:**
- models / checks / drift / raw_ops; migration trees / heads;
- settings / readers verified vs unverified;
- mirrors by verdict; findings.
- Frames (P): gustify 57 models · 46 settings · 63 migrations · 1 head; tier3 2 alembic trees, settings `absent` (the only BaseSettings-shaped class is in vendored `scripts/_a3_code.py`, now skipped).

**Effort:** L.

---

### Slice 11 · The frontend pass — Phase 5 (sub-slices 11a–11d)

Sub-slices: **11a** extractor flow + guards + router topology · **11b** hooks + keys + client policy + transport · **11c** reason map · **11d** controls + store actions + optimistic.

**Generates:** frontend arm: top-level `frontend{}` (§A1 envelope conventions; row ids `<l>-<sha10>`; endpoint refs are `x:` ids).

**Modules:**

| module | change | lines |
|---|---|---|
| `_a3_fe_extract.mjs` | flow walker, gated by `GABE_FE_FLOW=1` | 288 → ~560 |
| `_a3_fe.py` | `run_extractor(..., env=None)` | 776 → ~779 |
| `_a3_fe_forms.py` | new | ~560 |
| `_a3_fe_reason.py` | new | ~230 |
| `_a3_forms_fe.py` | new, data only: FE rosters, `LIBRARY_DEFAULTS` with sources | ~95 |
| `build_center_a3.py` | real `extend_frontend` call after `_graph` + the write-rule change | — |

**Algorithm:**
1. **The extractor stays the same run it is today.**
   - The structure run (`fe_arm`) is unchanged; c4 `fe` bytes never depend on flow.
   - Flow capture is a **second invocation**, with `GABE_FE_FLOW=1` and its own timeout (D21). A flow failure → `arms.frontend.present false` + reason.
2. **Capture** (raw facts only, no roster in JS, matching `_a3_fe_extract.mjs:95-98`):
   - **Bodies walked:** every local export, module-local functions one level deep, store initializer objects, and function-valued properties passed to calls.
   - **Guard / after / ctx stacks** mirror `_a3_paths`.
   - **Row kinds:** `ret`, `throw`, `call`, `new`, `cmp`, `jsx` (lowercase tags included).
   - **Checker resolution:** constants depth ≤ 3; factory-key arrays; forwarding over `.map` / `for…of`; union literal domains; `handlerProps`.
   - **Route configs.**
   - **Limits:** 600 rows per body.
3. **Origins** (`_a3_fe_reason.origin`): hook member · cache call (`_a3_fe._CACHE_CALLEES`, `:68-73`) · cond union · catch parameter → try body · parameter → call sites · store selector · unknown.
4. **Form classification:**
   - **guard:** a conditional NAV element / `throw redirect` / nav hook, with a trailing outlet or none;
   - **hook:** a cache callee;
   - **component:** conditional rets or controls;
   - **store action:** a function-valued property of a `_STORE_CALLEES` initializer.
5. **Guards:**
   - exits with QUERY_STATE atom classes;
   - `decided_by` via bridge edge → `declared.response_model` → schema field;
   - effects join an exit when their atoms cover its pred;
   - chain paths = ancestor outlets × innermost exits.
   - **K3 topology:** `loops` · `exclusive` (the two redirect branches contradict on the same hook member) · `unproven` · `safe` · `unknown`, worst across mounts.
6. **Hooks and client:**
   - keys matched as TanStack prefixes;
   - `invalidated_by`;
   - policy from `new QueryClient` (retry functions summarised one level), falling back to hook options, then library defaults from the web lockfile (else `unknown`);
   - transport `.status` branches in the wrapper definition file.
7. **Reason map:**
   - sites are `.status` / `.detail` compares whose origin reaches an endpoint, narrowed to the enclosing `useMutation`'s `mutationFn` fetch (bridge edges keep the first export only, `_a3_web.py:344`);
   - rows route by status into the first branch that covers them;
   - `reason-collapsed` fires only when the branch reads no detail or code **and** the endpoint already carries `shared-status` for that status (reusing `_a3_paths.py:900-910` output);
   - `branch-unproduced` and `client-detail-unmatched` as designed.
8. **Controls and stores:**
   - control states `live` · `maybe-dead` · `dead` · `disabled` · `unknown`;
   - store `set` transitions append · remove · reset · set-literal · set-param · merge · expr;
   - K3 persist;
   - optimistic rollback: `defined`, or `missing` → `no-rollback`.
9. **Write rule** (D21): `forms.json` is written when `present` **or** `arms.frontend.present`. On a TS-only tree (keypro) this creates the file with `present: false, reason` plus `arms` and `frontend`. Next.js server idioms land in `frontend.idioms.unknown` with counts.

**Goldens (gustify `apps/web/src`, source read; reason-map join over committed forms):**
- **`RequireSetup`** (`routes/RequireSetup.tsx:31-63`, V):
  - exits: `isPending` → splash · `isError` → splash, joined by effects `signOut` on 401 and `pushToast` otherwise · `data.setup_required` → redirect `/setup` (`paths.ts:13`, V), `decided_by {endpoint:"endpoint:GET /me", response_model:"MeResponse", field:"setup_required"}` · outlet.
  - K3 `safe` + `exclusive` against `RedirectIfSetupComplete` (router `routes/router.tsx:101`, `:104`, `:131`, V).
  - Chain rows: 7, for the drawn map's 6 paths; the grouping is left to display.
  - The `signOut` landing is `unknown`: an external Firebase event (R).
- **`SetupScreen`** (`:41-51`; 409 branch `:43`; swallow `:94`; `:97-98`, V) → **exactly one** `reason-collapsed` on `POST /setup/complete` 409 (`["consent required", "setup in progress"]`, the committed `shared-status`, V).
- **`GET /me`** has no `shared-status` → `RequireSetup`'s 401 branch stays SILENT (V).
- **Client policy** (`lib/query/client.ts:14-35`, V): retry 0 on 4xx, else 1; `refetchOnReconnect` true; mutations retry 0.
- **`useUiStore.clearToasts`** has no caller (`store/ui.ts:49`, `:83` only, V) → `action-uncalled`.
- **Dead controls** at `PantryStateViews` `:64`, `:65`, `:107` (R).
- **`useRecipeFilterModes`** 409 site endpoint `unknown` (the `ENDPOINT` const not read).

**Battery `tests/forms-frontend/`:** its own fixture dir, so `tests/frontend/fixture` counts do not move; F1–F16 as designed, with:
- F15: `build_fe` / `fold_fe` identical with flow on vs off;
- F16 LIVE: `GABE_FE_FLOW=1` re-derives `flow.frozen.json` byte for byte when a typescript resolves, else `SKIP ⚠` by name.

Also `tests/frontend`: the extractor without the flag emits no `flow` key. `tests/center`: a raising `extend_frontend` → exit 0, `frontend forms SKIPPED`, endpoints unchanged.

**Dry run — record:**
- pieces by form; rows; findings; unknown rows by reason; unresolved keys and origins; truncated bodies;
- extractor wall time with flow off vs on (not yet measured);
- keypro: the new-file write rule.
- Grep frames only, not goldens: gustify `useQuery` 18 · `useMutation` 40; gastify `beforeLoad` 3; tier3 `useSWR` 156 · `redirect(` 49.

**Effort:** L.

---

## §A3 · Module map

All paths are in `GEN/`. Every module is stdlib-only at top level and uses column-0 imports.

| module | slice | est. lines | imports | imported by |
|---|---|---|---|---|
| `_a3_forms.py` (registry, data) | 1–10 | 106 → ~330 | — | everything below, `_a3_paths` |
| `_a3_forms_short.py` (data) | 4 | ~130 | — | schema · model · migrate · setting · mirror |
| `_a3_forms_fe.py` (data) | 11 | ~95 | — | `_a3_fe_forms`, `_a3_fe_reason` |
| `_a3_forms_build.py` (orchestrator) | 1 | ~210 with the ids pass | every arm module below, `_a3_forms_ids` | `build_center_a3.py` |
| `_a3_forms_ids.py` | 1 | ~80 | `_a3_forms` | build, arms |
| `_a3_forms_settings.py` | 1 | ~200 | `_a3_paths`, `_a3_code`, `_a3_forms`, `_a3_stacks_pydi` | paths, contract, mw, setting |
| `_a3_forms_catch.py` | 1 | ~150 | `_a3_paths`, `_a3_forms` | paths, effects, fn |
| `_a3_forms_reach.py` | 1 | ~160 | `_a3_paths`, `_a3_code`, `_a3_forms`, `_a3_graft` (`_is_center` only) | paths, switch, effects, fn, task, model, setting |
| `_a3_forms_paths.py` | 3, 4, 5 | ~500 | leaves | build |
| `_a3_forms_mw.py` | 3 | ~260 | leaves | build |
| `_a3_forms_schema.py` | 4 | ~430 | leaves, `_a3_forms_short` | build |
| `_a3_forms_switch.py` | 5 | ~280 | leaves, `_a3_stacks_pydi` | build |
| `_a3_forms_effects.py` | 6 | ~520 | leaves | build |
| `_a3_forms_contract.py` | 7 | ~340 | leaves | build |
| `_a3_forms_fn.py` · `_a3_forms_task.py` | 8 | ~260 · ~250 | leaves | build |
| `_a3_test_asserts.py` · `_a3_forms_tests.py` | 9 | ~280 · ~240 | `_a3_tests`, `_a3_paths`, `_a3_forms`, `_center_data` | build · tests, setting, schema |
| `_a3_forms_model.py` · `_a3_forms_migrate.py` · `_a3_forms_setting.py` · `_a3_forms_mirror.py` | 10 | ~380 · ~300 · ~360 · ~280 | leaves, `_a3_forms_short` (model imports migrate) | build |
| `_a3_fe_forms.py` · `_a3_fe_reason.py` | 11 | ~560 · ~230 | `_a3_forms`, `_a3_forms_fe`, `_a3_fe` (rosters), `_a3_graph._norm_path` | build |
| `_a3_fe_extract.mjs` (existing) | 11 | 288 → ~560 | — | `_a3_fe.run_extractor` |

**Import chain for propagate.**
- `build_center_a3.py` adds only `import _a3_forms_build` at column 0, beside `:52`.
- `_a3_forms_build` imports every arm module at column 0.
- The arms import the leaves at column 0.
- `propagate.sh:41` greps `^(import|from) <mod>\b` over **every** `GEN/*.py` (V), so a module imported by any suite generator lands on the twins, and so does one imported by another new module.
- `\b` keeps `_a3_forms` from matching `_a3_forms_build`: `s_` has no word boundary.
- The extractor extension lands through the update loop, because the file already exists on the twins (`propagate.sh:25-32`). A **new** `.mjs` would only print `NEW (not vendored)` (`:47`), which is why no new `.mjs` is created.

**No cycles:**
- `_a3_paths`, `_a3_code`, `_a3_graft` and `_a3_stacks_pydi` import no forms module.
- No arm imports another arm; cross-arm data flows through the in-memory feed dict.
- The only arm-to-arm import is model → migrate.

**Size budget:**
- Every new module stays under 800 lines.
- `_a3_paths.py` stays at **1,000, untouched** (D26). Its private helpers are imported by the arms. Precedent: `_a3_paths.py:34` imports pydi's `_ann_name`. forms-core K8 pins the imported names.
- `_a3_fe.py`: 776 → ~779.
- `build_center_a3.py`: 2,558 → ~2,580 (over budget, report-never-gate; state the numbers in the commit).
- **Totals:** new generator code ≈ 6.4k lines across 24 modules, plus ≈ 270 in the extractor. New batteries ≈ 2.8k lines across 8 directories: forms-core · forms-paths · forms-kinds · forms-short · forms-effects · forms-contract · forms-tests · forms-frontend.
- **Optional split of `_a3_paths.py`,** triggered only when a later change must edit it: move `_path_prefixes` · `_middleware_exits` · `_app_handlers` (`:590-730`) to `_a3_paths_mw.py`. Keep re-exports in `_a3_paths` so every arm's private import survives. Byte-neutral, proven by `map-baseline.sh check`.

---

## §A4 · Verification and polish pass (after Slices 1–11)

1. **Goldens as data, beside the drawing.**
   - `docs/design/element-forms/goldens/expected.json` holds every (V)/(R) golden in §A2, entered by hand.
   - `docs/design/element-forms/goldens/check-goldens.py` is read-only: `<forms.json>` prints match / mismatch / missing per golden. For `POST /setup/complete` and `RequireSetup` it also prints each generated path as an ordered chain beside `PATHS_API` / `MAP_API` from `shallow-logic-maps.html`.
   - This is a verification tool, not a surface, and not a generator.
2. **Review workflow** (read-only, ≤6 agents, one verifier over the deduped union).
   - Lenses:
     - (a) goldens mismatches;
     - (b) per arm, 10 gustify endpoints re-read by hand against their feed rows;
     - (c) the tier3 false-positive sweep;
     - (d) gastify as a second FastAPI style;
     - (e) determinism and id stability;
     - (f) feed shape against §A1.
   - Output: a findings list; nothing is written by the agents.
3. **tier3 false-positive sweep.** For every finding id and every `unknown` reason on tier3, sample up to 20 hits and read the source.
   - Record precision per finding.
   - Below 80%: tighten the rule, demote the finding to `count`, or fold it into `unknown` with a reason. Every fix ships with a battery case.
4. **Id stability on real code.** Copy gustify's `apps/api` into scratch (check `df -h /mnt/c` and `du -sh /var/log` first), prepend one blank line to every `.py`, and rebuild with all arms on. Every `x g r b p sw st c k w e` id must be equal and every `at` different. Record counts.
5. **Polish loop.** Each fix goes in its own commit with its battery case and dry-run numbers. `_a3_paths.py` stays untouched (D26).
6. **The operator reads each arm's generated goldens and output** (in the lab, via `LABEP.forms`, and in `check-goldens.py`), then accepts per arm. An accepted arm flips its default to on (the D4 precedent, per arm). Display choices are made there, later, not in this plan.
7. **Consumer uptake,** after acceptance and in this order:
   - (a) `form_drift.py`: NAG/COUNT read from `_a3_forms.FINDINGS` by `arm` (the K7 sync stays); S20 counts arm findings (`race-500` · `migration-drift` · `mirror-disagree` · `retry-unbounded` · `reason-collapsed` · `redirect-loop` · `no-rollback` · `dead-control` as nag); pulse-angles cases above the summary line.
   - (b) gabe-map:
     - `mapquery.form_summary` keep list (`mapquery.py:666-673`) gains `id`;
     - `touches` on middleware, function, task, schema, model, setting and fe piece;
     - `trace.from_form` gains paths;
     - `map_census kind=forms` gains an arms section;
     - the TS-only `forms_block` state (`:180-182`) reads `arms.frontend`.
   - (c) review FORM DRIFT: diff arms for a diff-added `race`, `migration-drift`, and a client `error.status === N`.
   - (d) `map-baseline.sh` census: per-arm measures beside `:102-107`.
   - (e) Version bumps: pulse, review, map. Update CLAUDE.md rows in the same commit (doctor parity).
8. **Close:**
   - `gen/README.md` module table and emit order;
   - the CLAUDE.md forms bullet;
   - `templates/center/shell/README.md` feed list;
   - `./install.sh`;
   - `write_facts.py --only <each new battery>`;
   - re-bless the forms.json hash in `tests/baselines/*.sha256` (archmap/c4/levels must show identical);
   - `scripts/suite-doctor.sh` CLEAN (≈5–6 min, alone);
   - `propagate.sh <twin> --check`, then the real run, gustify then gastify; twin commits by explicit path;
   - push/PR is the operator's manual beat.
9. **Size check (D20).** Record `forms.json` bytes per target and per arm. Apply the split trigger if it is crossed.

---

## §A5 · Decisions taken (generation only)

DECISION D11: scope of this amendment
CHOSE: finish generation (lists A and B, Phase 4, Phase 5) first; Phase 6 surfaces and every display choice come later
ASSUMED: the operator judges display by seeing the generated data in the app
BREAKS IF: a slice cannot be judged without a surface. Then that one surface moves forward as its own Phase 6 item.

DECISION D12: switch policy
CHOSE: one switch per arm (`forms_arms`, `GABE_FORMS_ARMS`), all default OFF; only `version: 2` and `head` ride on, at Slice 1
ASSUMED: one forms-only re-bless at Slice 1 is acceptable. No consumer reads `version` (grep of form_drift, mapquery and tools_wave2/3, V).
BREAKS IF: a consumer starts gating on `version == 1`. Then bump it with that consumer's update.

DECISION D13: ids
CHOSE: prefixed sha1 of a canonical tuple with no line numbers, an ordinal scoped to the function, written whenever any arm is on
ASSUMED: text-level change is the right identity change and line drift is not
BREAKS IF: the operator wants an id to survive a detail rewording. Then drop `detail` from the `x:` tuple and accept collisions resolved by `n`.

DECISION D14: one path identity
CHOSE: D1's per-exit paths with deciding-callee expansion, linear combination and PATH_CAP 48; effects walk along paths and never fork
ASSUMED: the drawn collapse rule (`shallow-logic-maps.html:348`) holds on real code
BREAKS IF: an operator-drawn path needs two non-exiting branches combined. Then flip `OPTIONS.combos` to `product` for that endpoint class.

DECISION D15: path names
CHOSE: emit `names{}` candidates only, never a chosen `name`
ASSUMED: naming is a display rail option (`path-map-status.md:289`)
BREAKS IF: a non-display consumer (pulse, review) needs one name. Then pick it in that consumer, not the feed.

DECISION D16: where new findings live
CHOSE: `arm_findings.<arm>` and `arms.<arm>.stats.findings`; `endpoints[k].findings[]` and `stats.findings` stay frozen until §A4 step 7
ASSUMED: S20, `touches.form` and the `forms_nag` census should not move before acceptance
BREAKS IF: the operator wants S20 to see an arm before its acceptance. Then do that arm's consumer uptake early.

DECISION D17: how deep the reading goes
CHOSE: rows stay at plan D6 (handler + one level + dependencies ≤4); discovery (reach, value switches, effects collapse) reads to `reach_depth` 4
ASSUMED: a deeper read that never mints a row cannot inflate refusals
BREAKS IF: tier3 reach time or bytes cross D20. Then lower `reach_depth` per arm.

DECISION D18: bindings source
CHOSE: `_a3_stacks_pydi.parse(repo)` recomputed inside forms; levels `binds` is a cross-check count
ASSUMED: forms must run without graft and before c4/levels (`build_center_a3.py:2199` vs `:2221`)
BREAKS IF: pydi's predicates diverge from levels. The P8 equality assert catches it.

DECISION D19: exempt middleware rows
CHOSE: `annotate` (the row stays, `applies: false`, no path)
ASSUMED: S20 and review bytes should not move before consumer uptake
BREAKS IF: the operator reads `/healthz`'s 429 row as a bug. Then flip `exempt_rows: drop`; S20 moves by one endpoint on gustify.

DECISION D20: one feed file
CHOSE: every arm writes into `forms.json`
ASSUMED: gabe-map's single lazy loader stays fast enough
BREAKS IF: on any target, `forms.json` exceeds that target's `archmap.json` (tier3 archmap 9,956,334 B, V). Then split into `forms.<arm>.json` with a loader ruling.

DECISION D21: frontend flow capture
CHOSE: a second extractor invocation behind `GABE_FE_FLOW=1` with its own timeout; `forms.json` is written when `present` or `arms.frontend.present`
ASSUMED: doubling extractor time is affordable when the arm is on, and a new file on TS-only trees is wanted
BREAKS IF: tier3 extractor time doubles past the operator's budget. Then use a single run with a re-run-without-flow fallback.

DECISION D22: Phase 5 trigger
CHOSE: Slice 11 starts when Slices 1–10 pass their exit criteria on copies, not after a twin refresh cycle
ASSUMED: arms are default off, so nothing depends on twins carrying Phase 4 first; joins use only `x:` ids
BREAKS IF: an endpoint arm's id tuple changes after Slice 11 lands. Then re-bless forms-frontend fixtures in the same commit.

DECISION D23: the sixth state
CHOSE: `external` = a value set only by the deploy platform; rollup precedence `defined > external > default > unknown > missing > n/a`
ASSUMED: an external value is a fact, just not in the repo
BREAKS IF: the operator wants external to count as missing for audits. Then swap its rank with `unknown`.

DECISION D24: environment files
CHOSE: a fixed filename allow-list; never `.env` or `.env*.local`; never `git ls-files`; secrets redacted
ASSUMED: dry-run copies may lack `.git`, and determinism beats coverage
BREAKS IF: a twin keeps its example env under another name. Then add it to `ENV_FILES`.

DECISION D25: arms census registration (plan D3)
CHOSE: still not registered in `_a3_stacks.REGISTER`; coverage is stated in `arms.*` and `frontend.idioms`
ASSUMED: moving archmap bytes on every map is not worth it
BREAKS IF: the operator wants the arms census to show forms coverage on TS-only trees.

DECISION D26: `_a3_paths.py`
CHOSE: untouched (1,000 lines); new work in new modules that import its privates; the split is optional and byte-neutral with re-exports
ASSUMED: endpoint bytes and C0–C13 must not move
BREAKS IF: a slice must change an endpoint row's own content. Then split first, in its own commit.

DECISION D27: the test over-credit source
CHOSE: fixed only for forms readers; `_a3_tests._credit_ep` (`:353-356`) unchanged
ASSUMED: archmap, c4 and levels bytes stay put in this amendment
BREAKS IF: the operator accepts Slice 9's output. That is the trigger for a separate re-bless commit fixing the source.

DECISION D28: framework ordering rules
CHOSE: `DEPENDENCY_ORDER` and body-parse exits as registry literals cited to FastAPI 0.136.3, version-gated; below it, `unknown`
ASSUMED: gustify and gastify stay on ≥0.136.3
BREAKS IF: a twin pins an older FastAPI. Then read that version's `routing.py` and `dependencies/utils.py` and add a gated row.

---

## §A6 · Traps carried forward

**Import and landing rules**
- **Column-0 import or no twin.** New modules are imported by `_a3_forms_build` at column 0 (`propagate.sh:41`). A new `.mjs` never lands (`:47`).
- **Private-helper coupling.** Arms import `_a3_paths` privates (`_walk`, `_events`, `_climb`, `_callee`, `_deps`, `_analyse`, `_find_handler`, `_middleware_exits`, `_app_handlers`, `_literal`, `_where`, …). A split must re-export them; forms-core K8 fails otherwise.
- **The vendored-center skip list is built at import from the generator dir** (`_a3_graft.py:69-75`). tier3's `scripts/_a3_code.py` carries a BaseSettings class, and any all-`.py` scan must skip it through `_a3_forms_reach`.

**Reading `_a3_paths` and archmap facts**
- **`_climb` breaks on a bare `raise`** (`_a3_paths.py:340-341`): that is **pass-through**. "Rethrow" means a different class.
- **`_walk` drops a bare `return`** (`:302-305`), and **`P._exits` ignores `break`** (`:254-255`).
- **Archmap `access.commits` is true on a flush** (`_a3_code.py:1678`); `services/idempotency.py::complete` only flushes (`:156`, V).
- **`_orm_access` ops carry no line** (`_a3_code.py:1762-1764`). The line-carrying variant lives only in forms.
- **Two function id formats:** `file::qual` and `file#qual`. Archmap dispatch `t` is `file#qual`.
- **`stats.findings` is counted inside `P.build`** (`:935-936`). Appending to `endpoints[k].findings[]` leaves it stale.

**Consumers**
- **`form_drift.py:37-38` hardcodes NAG/COUNT**, and **`mapquery.py:666-673` drops every key not listed.** New findings and keys are invisible to consumers until §A4 step 7.
- **The two state-word vocabularies are inverted** (`mapquery.py:177-182` vs `form_drift.py:54-63`). Slice 1 fixes them to the `entity_models` convention.

**Build and feed**
- **The build writes `forms.json` only when `present`** (`build_center_a3.py:2202`). The TS-only rule change is explicit in Slice 11.
- **`tests/frontend` re-derives `extract.frozen.json` byte for byte.** Flow capture must stay behind its flag and in a second invocation.
- **`_a3_fe.py` is at 776 lines.** Glue goes in `_a3_fe_forms.py`.
- **`regen-example.sh --check` normalises `head` and reverts uncommitted example-page edits.** Add `forms.head` to its normalisation; never run `--check` over unsaved lab edits.
- **A battery line printed after its summary line never counts.**

**FastAPI and Starlette rules**
- **FastAPI order:** body JSON decode 422 (`routing.py:427`) and body parse 400 (`:447`) run before `solve_dependencies` (`:457`). A dependency whose own params fail is skipped (`dependencies/utils.py:660-663`). The endpoint-param raise is `routing.py:723`.
- **Starlette middleware runs last-added first** (`applications.py:101`).
- **`get_session` never commits** (`db.py:51-54`). The request session is shared through the dependency cache, so a handler rollback cannot undo the auth commit at `auth/context.py:79`.

**Gustify golden corrections**
- **`_strip_name`:** strip `schemas/setup.py:43`, pred `:44`, raise **`:45`**.
- **C1052** sends 4 allergens (under `MAX_ALLERGENS` 5): its 422 is the runtime allow-list.

**Process**
- **Design goldens carrying hash strings are provisional.** Ids are pinned structurally in batteries and recorded from the dry run.
- **A concurrent session's `git add -A` has swallowed a commit on this branch.** Commit by explicit path; check `git log -1` before and after.
- **Machine limits:** heavy verification runs one job at a time (tsc, vitest, builds, doctor, `map-baseline.sh`, tier3 builds of several minutes). Check `df -h /mnt/c` and `du -sh /var/log` before copying gustify or tier3 into scratch.

**Carried unverified (re-measure at the dry run, never cite as fact):**
- the credit-tier call-chain lines to `allowance_for`;
- replay's "11 tables";
- the ≈135 helper-arranged test cases and the 12 / 14 act/arrange split;
- the tier3 reach and extractor timings;
- whether `start_session` catches IntegrityError;
- the receivers at `api/recipe_creation.py:235` and `api/recipe_stream.py:195`;
- whether tier3's fastapi-users routers are in the archmap endpoints;
- the `fastapi/security/api_key` `reads` source line;
- the SQLAlchemy 2.0 `Mapped[Optional]` nullability source line.