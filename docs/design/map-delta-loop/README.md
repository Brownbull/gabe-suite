# The map-delta loop — design record

> Status: **BUILT** (2026-09-01; suite-side, twins untouched). The trust-but-verify feedback loop that
> turns map↔grep divergences, seen during real dev, into codebase-map generator improvements.
> Companion analysis: the `Map In The Loop` artifact (audit → recall re-measure → this loop).
> Tool: `skills/gabe-commit/scripts/map-deltas.py` · battery: `tests/map-deltas/run.sh` (33 asserts,
> 7-mutant-proven). The schema below is the script's own header — the script IS the contract (no separate
> schema doc), validated on every `append`.

## 1 · Why

The codebase map is produced for the 3D station but never read in the dev loop (audit: all three core
commands grep for context; the map's only reach is red's `Reach:` record + review's drift checks). The
enriched read/write map now earns a **first-look** role for data-flow questions — measured on gustify:
**precision 1.000, true-access recall 0.806** (production), directioned (r/w + table), where grep gives
mentions and no direction.

First-look means **trust-but-verify**: the map guides (context A), grep confirms (context B). Every
verify yields a **delta** — B adds to / subtracts from / modifies A. That delta is free feedback for the
generator that produced A. Captured light and swept on a rail that already fires, the map gets sharper
from real use. The first thing it would point at: the ~19% recall gap, concentrated in one AST pattern
(`_a3_code::_orm_access` misses `execute(select(Model.col, …).where(…))`).

## 2 · Settled decisions

| Decision | Choice | Why |
|---|---|---|
| Analyze + sweep host | **`gabe-commit`** | the one beat that fires on EVERY KDBP project — the sweep always closes, so no write-only accumulator. `cc-update` is center-only + after-push, so it can't be the reliable host. |
| Emit breadth | **red + execute + review** | red's two-arm reach is already a map↔grep delta (free); execute (E4 map→grep) and review (drift vs diff) each see divergences the others don't. |
| Accumulator location | **`.kdbp/map-deltas.jsonl`** | per-project, gitignored, append-only. NEVER in the suite repo (advisory-arm ruling R8). |
| Gate posture | **report-never-gate** (WARN) | matches the D7 warn-debts posture + the commit aux-checks (`size-budget.sh` etc.); a delta never blocks a commit. |
| cc-update role | **optional deeper analyze** (later) | center-only; it rebuilds the map, so it can compare pre/post — an enhancement, not the reliable sweep. |

## 3 · The accumulator schema

One JSON object per line in `.kdbp/map-deltas.jsonl` (append-only; a malformed line is skipped, never fatal):

```json
{ "v": 1,
  "type": "add" | "subtract" | "modify",
  "subject": "access(RecipeIngredient)",         // the map claim under test
  "found": "services/meal_plan.py queries it",   // what grep saw that A didn't (or vice-versa)
  "pointer": "apps/api/services/meal_plan.py:203",
  "gen": "_a3_code.access",                       // the generator arm that would fix it
  "ctx": { "cmd": "red|execute|review", "entity": "recipe", "head": "<sha>" } }
```

- `type` — **add** = grep found access/callers the map missed (a recall gap) · **subtract** = the map
  claims something grep can't confirm (a precision/dead-edge gap) · **modify** = same subject, an attribute
  differs (e.g. map says `r`, grep shows a write).
- `gen` — the fix target, so analyze can cluster by generator: `_a3_code.access`, `_a3_graft.calls`,
  `_a3_web.bridge`, `_a3_fe`, `_a3_code.function_insight`, `route_census`, …
- Light by construction: one line, no diff bodies — a pointer, not a payload.

## 4 · Emit — red · execute · review

Emit is **append-only and non-blocking**; a failed append never touches the beat. All three ride steps
that already run — no new "remembered process" (per `[[no-remembered-process]]`).

- **gabe-red** — DETERMINISTIC, the cheapest emit. The `Reach:` record already runs the two-arm query
  (`graft callers <sym>` ∪ `graft grep <sym>`, red-spec §Reach ~L129-137). The **arm difference** IS a
  delta: a symbol only `graft grep` found → `type:add, gen:_a3_graft.calls` (the index missed a caller);
  a symbol only `graft callers` found → `type:subtract`. Emit these lines as the reach is computed.
- **gabe-execute** — the E4 REUSE-FIRST search, once it names the map as the first surface
  (`searched: map → grep`, enforcement procedure ③). When the reuse-grep surfaces a file/symbol the map
  slice didn't, append `type:add`. Agent-observed at the E4 step (execute-spec ~L204).
- **gabe-review** — the drift subjects already compare the committed map to the diff (review-spec Step
  3.4). When a diff-added access/route/fetch matches no map claim, append the same delta (the drift
  finding is priced as today; the delta line is its light, accumulating cousin).

Emit mechanics: a documented one-line append (`echo <json> >> .kdbp/map-deltas.jsonl`, or a 10-line
`append` helper). No shared runtime; the schema is the contract.

## 5 · Analyze + sweep — gabe-commit

A new deterministic aux-check, `skills/gabe-commit/scripts/map-deltas.py`, run in gate-spec Step 2
alongside `size-budget.sh` / `evidence-freshness.sh` (report-never-gate; WARN enters triage, never blocks):

1. **Read** `.kdbp/map-deltas.jsonl` (honest-empty: no file / no `.kdbp` → silent exit 0).
2. **Cluster** by `gen` + `type`; rank by count.
3. **Digest** — print, e.g.:
   `MAP DELTAS · 14 since last sweep · top: _a3_code.access ×9 (add) · _a3_graft.calls ×3 (add) →`
   `consider: follow column-select access in _orm_access (9 hits, pointers in rollup).`
   A generator suggestion only when a cluster crosses a small threshold (≥N of one `gen`), so noise stays quiet.
4. **Sweep** — move the analyzed lines to `.kdbp/map-deltas-rollup.jsonl` (the history persists;
   the live accumulator returns to empty). The rollup is fsync'd before the live file is truncated, so a
   crash can never lose deltas — worst case is benign re-appended duplicates in the rollup on the next
   sweep. Idempotent; safe on re-run.

The digest also enters the commit's **Notable Updates** slot so it rides the existing report surface.

## 6 · What lands where (build order)

| # | Change | File(s) | Landed |
|---|---|---|---|
| 1 | the append+analyze+sweep script + its battery | `skills/gabe-commit/scripts/map-deltas.py` · `tests/map-deltas/run.sh` | ✅ |
| 2 | wire `analyze --sweep` into the commit gate (Step 2 aux, WARN) + LEDGER row | `skills/gabe-commit/references/gate-spec.md` | ✅ |
| 3 | ~~separate schema reference~~ → folded into the script header (the script IS the contract, validated on append) | — | ✅ (dropped) |
| 4 | red emit — the reach arm-difference | `skills/gabe-red/references/red-spec.md` §Reach | ✅ |
| 5 | execute emit — E4 map→grep divergence | `skills/gabe-execute/references/execute-spec.md` E4 | ✅ |
| 6 | review emit — REACH/WEB-BRIDGE/ENTITY-SHAPE drift-vs-diff | `skills/gabe-review/references/review-spec.md` Step 3.4 | ✅ |
| 7 | gitignore the accumulator + rollup | `skills/gabe-init/SKILL.md` step 6 seed list | ✅ |
| 8 | capability note (README gabe-help catalog regenerates at install) | `CLAUDE.md` | ✅ |

Sequencing followed: **1+2 first** (the consumer — never emit without a sweep, the write-only-accumulator
rule), then 4 (red, deterministic, highest signal), then 5+6, then 7+8. Change #3 collapsed once the
`append` subcommand validated the shape itself — a separate schema markdown would be a second source of
truth to drift.

## 7 · Batteries (mutation-proven, per suite convention)

`tests/map-deltas/run.sh` proves the checker can both FIRE and stay SILENT:
- **emit** — an append produces a schema-valid line; a malformed line is skipped, not fatal.
- **analyze** — clusters by `gen`, ranks, emits the suggestion only past the threshold.
- **sweep** — moves lines to the rollup; the live file returns empty; idempotent on re-run.
- **honest-empty** — no `.kdbp` / no accumulator → silent exit 0, byte-identical commit output.
- **non-block** — a populated accumulator never changes the commit's exit code.

## 8 · Risks

- ⚠ **Write-only accumulator.** If emit ships before the sweep, deltas pile up unread.
  - If ignored: the infinite list. · Cost now: build 1+2 first. · Cost later: a manual chore nobody does.
  · Distance: first commit after emit lands without a sweep. · **Verdict: build the sweep before the first emit.**
- ⚠ **Emit noise.** review/execute emit is agent-observed → subjective. Mitigate: red (deterministic) is
  the primary signal; execute/review emit only on a CLEAR contradiction, and the analyze threshold filters low-count noise.
- ⚠ **Schema drift across emitters.** Three skills write the same shape. Mitigate: one schema reference
  (change #3), and the analyze skips malformed lines rather than trusting them.

## 9 · Non-goals

Not a gate (never blocks a commit) · not a new graph element (the accumulator never renders; the map's
data model is unchanged — the `_orm_access` fix produces more of the SAME `access.ops`, no new kind) ·
not automatic generator edits (analyze SUGGESTS; a human decides) · not a suite-repo artifact (the
accumulator is per-project, gitignored, twins only).

## 10 · Post-audit enforcement

An 18-agent, 3-axis wiring audit (artifact "Map Loop Wiring Audit") found the shipped foundation
**correct but SOFT on every axis** — 0 broken, but each step leaned on unenforced agent discretion or
dead-ended, the same class as the retired TASK CONTRACT (0-for-19). The operator chose: land the two
CHEAP fixes, defer the heavy one.

- **Fix 1 — axis 2 → WIRED (LANDED).** `skills/gabe-red/scripts/reach-emit.py` runs the two-arm graft
  query (`callers` ∪ word-boundary `grep '\b<sym>\b'`), prints the Reach line AND auto-emits the
  arm-difference (`grep_files − caller_files − def_files`, noise-filtered, through `map-deltas.py append`).
  red-spec now calls it in place of the manual two-arm + hand-typed append, so producing the gated Reach
  record can no longer skip the emit. Battery `tests/reach-emit/run.sh` (17 asserts, 3-mutant-proven).
  Validated against gustify read-only: word-boundary grep collapses `_auth` 60→1 substring hits;
  `apply_recipe_filters` surfaces 2 real test-caller edges graft's index missed.
- **Fix 2 — axis 3 → WIRED (planned).** A `gabe-pulse` S14 ANGLE that reads the rollup and nags per beat
  when a `gen` accumulates unactioned suggestions, so the digest stops dying at one commit line.
- **Fix 3 — axis 1 (DEFERRED).** Wire `gabe-cc-entity` into execute E4 as a required first-look map read
  = graft-adoption **P4**. Trigger: greenlight P4, or the rollup shows red-only emit is too sparse.
