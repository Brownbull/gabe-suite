# Gabe Execute — full spec

> This file is the binding spec; the SKILL.md core is a summary. E1–E7 contract:
> see `../../gabe-docs/references/execution-contract.md`.

Executes phase tasks from `.kdbp/PLAN.md`. Complements `/gabe-plan` (write plan) and `/gabe-commit` (quality gate). This command owns the **implementation** step — reading the plan, writing code, checkpointing at commit boundaries, and advancing Exec state.

**Design principle — auto-run with commit checkpoints.** Between `/gabe-plan` and `/gabe-commit`, there's a gap: someone has to write the code. Before `/gabe-execute`, that someone was the human orchestrating raw prompts. Now the command reads Current Phase, runs all tasks in it, and checkpoints only at commit boundaries (per D2 decision — user-gated by default, `--auto-commit` batches).

**Scope default.** Single phase. Arg overrides: `task` = single next task only, `all` = all remaining phases (autonomous), `<N>` = jump to phase N regardless of Current Phase pointer.

> **Rendering note.** Output templates in this spec wrapped in bare triple-backtick fences are spec-meta delimiters — render their contents as plain markdown at runtime. See `gabe-docs/SKILL.md` § "Runtime output rendering convention".

## Gabe-Lens Output Rule

`**Gabe-Lens block**` is an output-only command-time explanation. It is never written to `.kdbp/PLAN.md`, `.kdbp/REVIEW.md`, `.kdbp/LEDGER.md`, `.kdbp/PENDING.md`, commits, or docs unless another command already owns that write. These blocks help the user understand the current command result; the command-time briefs are the surviving explanation surface (`/gabe-teach` is archived — `skills/_archive/`).

`**Gabe-Lens brief — Platform progress**` follows the same output-only rule. It is the plain-language capability delta for `/gabe-execute`: what changed in the platform, what is newly possible now, and what remains blocked or deferred.

## Procedure

### Step 0: Parse args + validate

Parse `$ARGUMENTS`:

| Token | Meaning |
|-------|---------|
| _(empty)_ | Execute Current Phase (default — per D1 recommend B) |
| `task` | Execute one task only, then stop |
| `all` | Execute all phases in order until plan complete (autonomous mode) |
| `<N>` (integer) | Execute phase N regardless of Current Phase pointer |
| `--auto-commit` | Skip per-task commit prompts, commit per task automatically (per D2 override A) |
| `--dry-run` | Print plan + proposed actions without writing code or committing |

**Preconditions:**

1. `.kdbp/` exists → else print `⚠ No KDBP. Run /gabe-init first.` and exit.
2. `.kdbp/PLAN.md` contains `<!-- status: active -->` → else print `ℹ No active plan. Run /gabe-plan [goal] first.` and exit.
3. Phases table includes `Exec` column → else print legacy warning and exit (do not auto-migrate; recommend `/gabe-plan update` or manual edit).
4. **Red-thread precondition (warn, never halt).** `mcp__gabe-kdbp__phase_context` carries both
   inputs — `plan_md_row.raw.red` (the cell as written; `cells.red` is its normalized state) and
   `records.cases` — and raises its own `Red is unstarted` warning on a `⬜` cell. The predicate
   below stays this step's: the tool's warning does NOT fire on `🔄`, and it looks for `skip` in the
   CELL, not in the Cases record. When the phases table carries a `Red` column
   and the target phase's Red cell is `⬜`/`🔄` with no `skip:*` in its Cases record, print
   `⚠ Red is ⬜ for phase N — failing cases first: /gabe-red N (or record an enumerated skip)`
   and continue only on explicit user say-so ("proceed without red"). When a `Cases:` record
   EXISTS, run the deterministic entry check before the first source Write:
   `python3 ~/.claude/skills/gabe-red/scripts/case-thread.py --phase N --assert-red --run "<case-scoped cmd>"`
   — NOT-RED (declared set already passing, or a broken run) means the red evidence is stale or
   fake; stop and surface it. The `red-entry-guard` PreToolUse hook backs this rail
   deterministically on every source write (D7: debts warn).
5. **Project type preflight.** Parse `<!-- project_type: ... -->` comment. Apply dispatch matrix:
   - `code` or missing → proceed with Step 1.
   - `mockup` → print `⚠ Mockup plan active — use /gabe-mockup instead` and exit 0. Do not redirect silently; print full message so user understands why.
   - `hybrid` → the target phase's `types` list comes from `mcp__gabe-kdbp__phase_context`'s `plan_json.types` (the same call Step 1 makes, made once here, with `phase:` set to the target phase); parse the PLAN.md Phase Details when the mirror carries no record for the phase, or no `types` on that record. If `types ⊆ mockup-tag-set` (`{design-system, ui-kit, mockup-flows, mockup-index, mockup-docs, mockup-validation}`) → print `⚠ Hybrid plan — current phase is mockup-type. Use /gabe-mockup` and exit 0. Otherwise proceed with Step 1.

### Step 1: Load execution context

1. Ask `mcp__gabe-kdbp__phase_context` first — pass `phase: N`, because unset it resolves the phase from PLAN.json's `current_phase` (or the first table row), not from PLAN.md's Current Phase pointer. One call returns `plan_json` (name, tier, complexity, types, cells, proof, proof_type, cases, scope, entities), `plan_md_row` (states in `cells`, the literal cells in `raw`, and the row's line), `records` (`Cases:` · `Reach:` · `Class:` · `Proof:` · `Searched:`) and a `details_excerpt` of the phase section. Then read `.kdbp/PLAN.md` for the pointer itself and for what that call caps or does not carry — the row's Description cell, the `## Phase Details` YAML `dim_overrides:` block (the excerpt stops at 2,000 chars), the Checkpoint verification commands, and any phase the mirror never recorded:
   - Current Phase pointer → integer N (or arg override)
   - Target phase row: Phase name, Description, **Tier**, Complexity, Exec state
   - **Tier column lookup:**
     - If Tier cell = `mvp` / `ent` / `scale` → use it directly as `phase_tier`
     - If Tier cell uses compact override notation like `ent (Obs→scale)` or `ent (Obs→scale, Backup→ent)` → parse `phase_tier` = the leading token (`ent`), note that overrides are present (full details come from Phase Details YAML)
     - If Tier cell missing (legacy plan, pre-v2.10) → default `mvp` silently. Do NOT prompt user mid-execute.
     - Prototype flag: read from `## Phase Details → Phase N → Prototype:` entry. Default: `no`.
   - **Per-dim tier overrides** — read the `## Phase Details` YAML block for this phase, specifically the `dim_overrides:` list. Each entry has `{section, dim, tier, reason}`. Empty list `[]` means no overrides. Legacy plans (no YAML block) treat as empty. This list is the single source of truth — the compact notation in the Tier cell is display-only.
   - Scope section (if present) → list of Modified/New files
   - References section → docs/code pointers for this phase
   - Checkpoint section → verification commands
2. Read `.kdbp/BEHAVIOR.md` — the Step-1 `phase_context` call already carries `behavior{maturity, mode, verify_commands}`; the file read is for the exact `execute_default_mode` key, which the tool's `mode` regex only approximates:
   - `maturity` (mvp/enterprise/scale) — project-level baseline (separate from per-phase Tier)
   - `execute_default_mode: interactive | auto` (optional, default `auto`)
3. Surface the open PENDING items in scope from the Step-1 `phase_context` call's `pending_in_scope` — open rows whose `File` matches the phase's PLAN.json `scope` globs, closure-aware (a Status verdict token or a `<!-- P<n> … resolved -->` comment closes a row; an empty Status is OPEN), capped at 40 — as an informational prompt before starting. A `reason` there (`no PENDING.md` · `phase declares no scope`) is the honest answer, never zero items; read `.kdbp/PENDING.md` directly when the phase declares no scope, or when PLAN.md's Scope section names files the mirror's `scope` does not.
4. **Load tier cap heuristics** from `.kdbp/DECISIONS.md` (find the phase's D-id entry) OR from `~/.claude/templates/gabe/tier-sections/*.md` `## Tier-cap enforcement` blocks. Used by Step 4.1 escalation gate.
5. **Classify runtime journey evidence requirement.** If the phase `types` include any of `{user-facing, native-mobile, mobile-web, web, upload, realtime, streaming, file-media, auth, session, notifications, DB}`, mark `runtime_journey_required=true`. If the phase has no `types` (legacy plan / template gap), `runtime_journey_required` defaults to **true** whenever any Scope or changed-file path matches `**/routes/**, **/components/**, **/screens/**, **/pages/**, **/views/**, **/api/**, **/ui/**`. Only an explicit `runtime-evidence: none` line in the phase's Phase Details may set it false. Never resolve this by judgment. If the project `.kdbp/BEHAVIOR.md` contains a runtime staging proof rule, or the phase touches auth/session/DB/upload/realtime/native-mobile/notifications/file-media/web/user-facing deployed behavior, also mark `staging_proof_required=true`. Determine the target runtime:
   - `native-mobile` / native dependency / permissions → physical device or named emulator/simulator; fresh build/install required when native modules changed.
   - `web` / `mobile-web` / browser UI → Playwright or equivalent browser run with screenshots.
   - `upload`, `realtime`, `streaming`, `file-media`, `auth`, `session`, `notifications` → journey test must exercise the real transport/runtime boundary, not only mocked unit paths.
   - `staging_proof_required=true` → candidate code must be committed and either pushed to the configured staging branch/environment or explicitly deployed with the project's staging CLI fallback before runtime evidence can close Exec.

### Step 2: Decompose phase into tasks

A phase row in PLAN.md is one-line per step. Real execution needs finer granularity. Decompose the phase into tasks by reading the phase's Description + Scope + References — the Step-1 `phase_context` call already carries `plan_json.scope` and the phase section as `details_excerpt` (the Description cell and anything past 2,000 chars come from PLAN.md) — and a Scope or References pointer that names CODE gets its definitions from `mcp__gabe-map__outline <file>` (spans, signatures, owners, models touched, tests reaching it) before the file is opened:

**Deterministic decomposition heuristics (no LLM needed):**

1. If phase description contains comma-separated or semicolon-separated atomic actions → each is a task
2. If Scope lists distinct files with distinct purposes → each file's work is a task
3. If References points to multiple external specs → each spec mapping is a task
4. Otherwise: single-task phase (the whole phase is one task)

**LLM decomposition** (only if heuristics yield <2 or >10 tasks):

- Prompt: "Given this phase description + scope + references, list 2-6 tasks that cover it. Each task must be independently testable and committable."
- Model: Haiku (cheap classification, per U6 value)
- Output: numbered list of tasks

**Tier-cap filter:** Before presenting tasks, prune any task that introduces a pattern above the **effective tier** for that task's section + dim, unless the task description explicitly justifies the escalation. Tier cap heuristics come from each matched section's `## Tier-cap enforcement` block (loaded Step 1.5).

**Runtime journey evidence task:** If Step 1 classified `runtime_journey_required=true`, add an explicit final task:

`T[K]. Capture runtime journey evidence for the changed user path on the target runtime`

This task is not optional and is not satisfied by lint, typecheck, unit tests, API-contract tests, or mocked component tests. It must name the concrete artifact path(s) expected in the `.kdbp/PLAN.json` `proof` field.

If `staging_proof_required=true`, this task must also name the staging branch or deployment path and the deployed service URL. Localhost, `127.0.0.1`, SQLite, mock-only, or local-stub artifacts can support implementation but cannot close this task.

**Effective tier resolution (respects per-dim overrides from Step 1 dim_overrides list):**

For each candidate task:

1. Classify the task by the section + dim it exercises (e.g., task "add OTel tracing to scan worker" maps to `Core.Observability`; task "add DI container" maps to `Core.Abstractions`).
2. Look up `dim_overrides` for that `section.dim` pair:
   - Match found → **effective tier = override tier** (e.g., `Core.Observability` override = `scale` → task permitted up to `scale` patterns)
   - No match → **effective tier = phase_tier** (base)
3. If task introduces a pattern above the effective tier → prune (or surface as escalation candidate). If at or below → allow.

Examples:

- Phase `ent` + dim_overrides: `[{Core.Observability: scale}]` + task "add OTel exporter" (Core.Observability dim, Scale pattern) → **allowed** (effective tier = scale for this dim)
- Same phase + task "add circuit breaker" (Core.Error handling dim, Scale pattern) → **pruned** (effective tier = ent for this dim, no override)
- Phase `mvp` + no overrides + task "add DI container" → prune (DI = Scale per Core)
- Phase `mvp` + task "add structured-output fallback chain" → prune (fallback chain = Scale per AI/Agent)

The prune is informational, not silent — show pruned tasks under a separate `Tier-cap pruned (N):` list in the prompt below, so user can escalate if needed. When the effective tier for a task was elevated by a `dim_override`, surface the override in the allow message: `T3 ✅ effective tier=scale via Core.Observability override (REQ-21 + U8 mandate)`.

**Present the task list** to the user with the Universal Action Menu on first phase only:

```
GABE EXECUTE — Phase N: [name]
TIER: [mvp|ent|scale] (prototype: [yes|no])
EXEC STATE: ⬜ → 🔄
COMPLEXITY: [low/medium/high]
TASKS ([K]):
  T1. [task description]
  T2. [task description]
  T3. [task description]

Tier-cap pruned ([P]):
  [pruned task] — reason: [section.dim] is [Ent|Scale] tier
  [pruned task] — reason: ...

CHECKPOINT CADENCE: per-task (D2.C default) | per-phase (--auto-commit)
PENDING ITEMS IN SCOPE: [N or none]

Proceed? [go] / [edit-tasks] / [escalate] / [abort]
```

- `escalate` → jump to Step 4.1 mid-phase escalation gate to promote phase tier + reinstate pruned tasks.

- `go` → begin Step 3
- `edit-tasks` → user edits task list inline, re-present
- `abort` → exit without state change

### Step 3: Tick Exec → 🔄

Before writing any code, update PLAN.md Exec cell to `🔄` for the target row. Use shared auto-tick procedure from `/gabe-plan` with target state = `start` (the helper also mirrors the tick into `.kdbp/PLAN.json` per its step 4b). Bump Last Updated.

Also write the task checklist into PLAN.md under `## Phase Details → ### Phase N`:

```
#### Phase N Tasks
- [ ] T1 — <desc>
```

(one line per task from Step 2). If the block already exists (resume), READ it instead of rewriting.

### Step 4: Execute tasks

For each task T_i in order:

1. **Announce task:**
   ```
   ▶ T[i]/[K]: [description]
   ```

2. **TASK RECORD (trailer, not ceremony — ruling 2026-08-07):** the task's record lives in its
   checkpoint commit message, where a machine already looks — never in a printed block. (The
   printed TASK CONTRACT this replaces went 0-for-19 across two full twin cycles: ceremony with
   no consumer does not survive contact. Its obligations survive below; its record moved.)
   Step 5's footer carries the record as two lines beside the existing `Task:` line:
   ```
   Cases: <C-ids this task advances (red@<sha>)> · Guard: <ids that must stay green>
   Class: red | guard | wiring | growth
   ```
   - `Cases:` comes from the phase's `Cases:` record (written by /gabe-red). No record? The line
     must say WHICH absence it is: `none — <reason>` (no case relationship) · `skip:<code> …`
     (recorded, legitimate non-TDD exit) · `RED OWED — /gabe-red never ran for this phase`.
     A never-ran red may not dress as a skip.
   - `Class:` names the task's case relationship: `red` = advances declared red cases (must cite
     ≥1 C-id) · `guard` = refactor under held guards · `wiring` = no red claim · `growth` =
     execute-minted case (observed red at execute time); mint its id at or above the corpus floor
     `mcp__gabe-map__cases_for` reports (`corpus.next_cid_floor` — the corpus is the registry, the map may lag).
   - `/gabe-commit` validates both deterministically (`scripts/checkpoint-trailer.sh` — WARN
     finding, never a block; fire/silent fixtures in `tests/commit-scripts/run.sh`).

   Surviving obligations (the ceremony died; these did not):
   - **Acceptance stays named.** Before writing a task's code, state its 1–3 verifiable done-when
     signals ("done when <observable check>"); a task naming a reference (mockup/story/spec/legacy
     screen) states the reference AS its acceptance. The retired printed block carried this as its
     ACCEPTANCE field — it does not survive as a printed line, but the obligation does: Step 4.4's
     lint/types/tests verification is not a substitute for knowing what "done" looks like against
     the task's own intent (drift.md's ten-phase silent-downgrade incident is what its absence costs).
   - **Substitution stops.** A task class cheaper than the task's text implies (restyle≠rebuild,
     stub≠implement, recreate≠reuse) requires an explicit user decision line — STOP and ask. A task
     naming a reference (mockup/story/spec/legacy screen) is rebuilt TO that reference.
   - **E4 REUSE FIRST.** Ask `mcp__gabe-map__find` first — one query across entities, endpoints,
     models, schemas, functions, defines, screens and FE pieces, by name or doc text — then search
     anyway (globs/greps/stories): a name the map lacks is a Grep question, never a proof that
     nothing exists. Re-authoring a lookalike of an existing artifact is a DEFECT, not a style choice.
   - **The map as tools.** When the project has a command center, context A comes from `mcp__gabe-map__touches` /
     `owner_of` / `entity_context` and the two-arm reach from `mcp__gabe-map__who_calls` (it emits the delta itself,
     gated) — reached for mid-reasoning, never remembered. The manual append below stays for divergences the tools
     cannot see.
   - **Map-delta emit (trust-but-verify).** The map is the first-look surface (the entity's
     `access`/callers slice = context A); the confirming grep is context B. When B surfaces a file or
     symbol A did NOT name, append one delta — free feedback for the map generator (non-blocking; only
     on a CLEAR contradiction, never a hunch; nothing with no `.kdbp`):
     `python3 "${ECC_ROOT:-$HOME/.claude}/skills/gabe-commit/scripts/map-deltas.py" append --type add --gen <arm> --cmd execute --entity <slug> --subject "<map claim>" --found "<what grep saw>" --pointer "<file>:<line>"` — `<arm>` is the fix target (`_a3_code.access` for a missed model access, `_a3_graft.calls` for a missed caller). `/gabe-commit` clusters + sweeps it.
   - **Cases bind completion.** When the phase carries a `Cases:` record, each task's trailer lists
     the ids it advances, and the phase may not finish until every declared case is green AND every
     guard is still green. Tests are not a task class — they are the contract ON tasks.
   - **`Reach:` is RECORDED, never binding.** A task may touch a place the reach did not name —
     that disagreement is a review subject (REACH DRIFT), not an error here. **Scoping the work to
     the reach is a DEFECT**: measured, a map-as-scope loop reached 0.560 recall where unscoped
     search reached 0.900, and six of eight sampled commits would have shipped short — one without
     its migration. The reach tells you where to look first; it never tells you where to stop.
     No phase record → compute at need with `mcp__gabe-map__who_calls <symbol>` — the same two arms
     (`graft callers --no-refresh` ∪ word-boundary `git grep -nwI`, every hit classified code vs
     prose) with the same gated emit and never a build — and mark the result `computed@task`; its
     `reach_line` IS the record form: `graft@<sha>` when the index claimed the symbol,
     `grep-only@<sha>` when it did not, `no index` when the project carries no graft index at all.
     Agents reach for the suite's tools; `graft build` serves map CREATION only (ruling 2026-09-02).

3. **Implement:**
   - Write/edit files per task scope; follow project conventions (CLAUDE.md, existing patterns)
   - Respect Scope section — only modify listed files unless deviation flagged (Step 6)

4. **Run task-local verification** — the binding comes from `mcp__gabe-kdbp__verify_commands`: BEHAVIOR's `## Verify Commands` when it binds (`source: a: BEHAVIOR.md …`), else the manifest candidates it found (`source: b: package.json / pyproject / Makefile — candidates, not yet bound`), else `source: none: …` and the step names its own commands. It returns `probed: false` always — the tool never runs a command, this step does, via Bash, so every number in the evidence rows below is copied from a real run:
   - Lint the changed files (project tool from BEHAVIOR.md: ruff / biome / etc)
   - Types on changed files
   - Unit tests that exercise changed code (scoped, not full suite)
   - For the runtime journey evidence task, run the target-runtime journey:
     - Mobile native: install or confirm the fresh dev/release build, run on the declared physical device/emulator, exercise the changed path through the UI, and capture screenshots/report/logs.
     - Web: run the browser-level E2E path with screenshot/video/report artifacts.
   - Upload/realtime/auth/session paths: prove the real transport/auth/runtime boundary, including terminal success and at least one relevant edge case when the phase adds error/recovery behavior.
     - If `staging_proof_required=true`: commit the candidate through `/gabe-commit`, push it to the configured staging branch or deploy it through the project's Railway CLI fallback, wait for staging readiness, then run the journey against the deployed staging URL.
   - Write the exact commands, target device/browser, build id when applicable, and artifact paths into the `.kdbp/PLAN.json` mirror as the phase's evidence record: set `phases[id==N].proof` to `PROOF: <exact command> → <runtime/device/browser> → <repo-relative artifact path>` — one line per platform in the declared matrix (e.g. mobile-390 | desktop-1280), joined with " · " when there are multiple platform lines; a missing cell = task not done.
   - When the journey produced proof artifacts, fill the manifest's `narration.legs` NOW — one plain sentence per leg, authored by this session because it is the one looking at the shots (shape + the "describes, never asserts" constraint are binding per `../../gabe-cc-update/references/feature-spec.md` §Narration). Deferring captions to curate reconstructs them cold, weeks later, by a session that never saw the run.
   - If verification fails → fix in-loop, retry up to 2 times, then halt with `[retry] / [skip-task] / [abort]`

   If runtime journey evidence is required but cannot be run, halt with Exec left `🔄`. Record the blocker and missing artifacts in the EXEC thin-index row's Gates column (see Step 7 log format). Do not mark Exec `✅`.

   Structural backstop (D7 — block lies, warn debts): the `plan-proof-guard` PostToolUse hook validates every PLAN write — Exec `✅` with a declared PROOF artifact missing on disk, or Red `✅` without its `cases` record, is BLOCKED by the harness, not by this spec being remembered. (The guard is shorthand-tolerant per ruling R2 — a proof token passes by literal path, brace-expanded glob, or non-empty parent dir; an empty or missing evidence dir still blocks.)

   Before printing `T[i] verification ✅`, print one evidence row per check, populated ONLY from commands executed via the Bash tool this session:
   ```
   T[i] VERIFY
   lint: `<cmd>` → exit <code>, "<copied count>"
   types: `<cmd>` → exit <code>, "<copied count>"
   tests: `<cmd>` → exit <code>, "<copied count>"
   journey: `<cmd>` → <artifact path>   (when required)
   ```
   Rules: a line may be printed only after its command ran; a missing tool prints `lint: none configured (BEHAVIOR.md)` — never omit the line; a skipped check renders `⤫ skipped(<reason>)`, never ✅; every number is copy-pasted from this run's output, never estimated. When the phase carries a `Cases:` record, the `tests:` line MUST be case-scoped (e.g. `pytest -k "C147v2 or C148"`) so the copied count speaks for the declared ids — declared-red cases now green, guards still green.

   **Green stamp (red-thread close).** When the phase's final case-scoped verify passes, run
   `python3 ~/.claude/skills/gabe-red/scripts/case-thread.py --phase N --assert-green --run "<same case-scoped cmd>"`
   and append the printed `green@<sha>` stamp to the END of the phase's Cases record — PLAN.md
   Phase Details bullet AND PLAN.json `phases[].cases`, same turn (E5, real parser, never sed).
   The stamp is what lets Review ✅ pass `plan-proof-guard` later: a red@-bearing record with no
   reachable green@ BLOCKS the review tick (D7 — that tick claims the cases pass).

5. **Checkpoint (D2 decision):**
   - At every checkpoint, run `git diff --name-only` and compare against the phase Scope list. Price each out-of-scope file with `mcp__gabe-map__owner_of` before classifying it: a file owned by an entity this phase never declared reads structural; one inside a declared entity's own files reads minor. The reading is advisory — an unclaimed file is a census gap, not an acquittal, and no command center means no reading at all, classify by hand — and the classification, the halt and the deviation line stay this step's. Any file outside Scope forces a classification NOW: structural → Step 6 halt menu; minor → record the deviation immediately, pre-filled with the file names, as a `deviation(minor): <path> — <1-line note>` line for the checkpoint commit body (Step 6). If no Scope list exists, print `Scope unfenced — deviation check skipped` so the omission is visible. Staging at Step 4.5 is an explicit path list — never `git add -A` when status shows out-of-scope files; print `excluded (other-track): <files>`.
   - Default (interactive, no `--auto-commit`):
     ```
     T[i] verification ✅

     Files changed:
       - app/agent/triage.py (+42 / -8)
       - tests/test_triage.py (+28 / -0)

     [commit] — run /gabe-commit for this task
     [continue] — proceed to T[i+1] without committing (batch later)
     [stop] — halt phase exec here, keep Exec=🔄
     ```
   - Auto mode (`--auto-commit`): proceed to commit without prompt. Skip to Step 4.5.

### Step 4.1: Mid-phase tier escalation gate

Fires when any of:
- User picks `escalate` at the Step 2 Universal Action Menu
- During Step 4 implementation, a task genuinely requires a pattern above the declared tier (e.g., mvp phase but the external API is flaky enough that retry logic is load-bearing)
- A drift signal from `## Known drift signals` in a loaded section file fires during task implementation

**Escalation prompt:**

```
⚠ TIER ESCALATION REQUESTED — Phase N
CURRENT TIER: [current]
TRIGGER: [task T[i] requires / drift signal / user-requested]
DETAIL: [which section.dim forced the escalation, e.g. "AI/Agent.Structured output needs fallback chain"]

Promote to: [next] / [next+1] / [cancel]

Reason (required — one sentence):
```

**Promotion rules:**
- From `mvp`: may promote to `ent` or `scale`
- From `ent`: may promote to `scale`
- Reason is mandatory. Blank input is refused with: `Escalation requires a reason (one sentence). Silent escalation is not allowed.`

**On accept:**

1. **Update PLAN.md Phases table** — change Tier cell to new tier for phase N. Bump Last Updated.
2. **Append to DECISIONS.md** under the phase's existing D-entry (the one /gabe-plan wrote at Step 3.5.4):
   ```markdown
   ### Tier escalation — YYYY-MM-DD HH:MM
   - **From:** [old tier]
   - **To:** [new tier]
   - **Trigger:** [task T[i] / drift signal / user]
   - **Reason:** [user reason]
   - **Reinstates dimensions:** [list of previously-suppressed or previously-capped dims that now apply at new tier]
   ```
3. **Reinstate pruned tasks** — any tasks previously pruned by Step 2 tier cap that fit within the new tier get added back to the task list.
4. **Log to LEDGER.md** — one thin-index row, composed with `mcp__gabe-kdbp__ledger_row_preview` (`entry: EXEC`; it returns the row in the FILE's own column order and copies the Gates cell verbatim) and written with the harness Write/Edit — never through a tool — so the D7 hooks see the write:
   ```
   | [YYYY-MM-DD] | EXEC | Phase [N] tier escalation [old]→[new] | — | reason: [user reason] · decisions: D[id] updated |
   ```
5. Continue Step 4 implementation at the new tier.

**On cancel:**
- Halt phase. Exec stays `🔄`. User needs to either refactor task to stay within tier, build the needed pattern outside `/gabe-execute`, or re-invoke `/gabe-plan` to re-tier and replan.

**De-escalation path (tier → lower):**
Not supported mid-phase. Orphaned higher-tier patterns would require manual cleanup. To de-escalate, use `/gabe-plan update` or edit the Tier cell directly after reverting the over-built code.

### Step 4.5: Commit (when user picks `commit` or `--auto-commit` active):

   **MUST invoke `/gabe-commit` inline.** Raw `git commit` / `git commit -m` at this step is prohibited. `/gabe-commit` is the sole owner of CHECK 6 (deferred), CHECK 7 (doc drift), CHECK 8 (structure), the per-commit LEDGER thin-index row (findings/deferred/size-budget), PENDING.md updates, and the auto-tick of the `Commit` column (Step 6.6). Bypassing it silently drops all six responsibilities — the observed failure mode being: `Exec=✅` yet `Commit=⬜`, no findings row in LEDGER, no teach trigger, and `docs/AGENTS_USE.md` / `docs/wells/*.md` drift uncaught.

   Procedure:

   1. Build the commit message per Step 5 (Subject + body with Before/After + Phase/Task footer + the Cases/Class task-record trailer).
   2. Invoke `/gabe-commit "<message>"` — pass the generated message as `$ARGUMENTS` so `/gabe-commit` skips its own message-generation step (gabe-commit Step 1) and honors the Phase/Task footer verbatim.
   3. Handle findings surfaced by `/gabe-commit`:
      - **CRITICAL** → Exec stays `🔄`. Never proceed to T[i+1] with unresolved CRITICAL findings. User must resolve via `fix` / `skip-to-pending` before exec resumes.
      - **HIGH / MEDIUM / LOW** → user picks per-finding action (`fix` / `accept` / `defer`). Exec resumes after `/gabe-commit` returns 0.
      - `defer` → PENDING.md row added with source=`gabe-commit`; Exec continues.
   4. **Confirm Commit column ticked.** After `/gabe-commit` returns 0, read the row back with `mcp__gabe-kdbp__phase_context` (`plan_md_row.raw.commit` is the cell as written — `cells.commit` normalizes it to a state; columns resolve by NAME, so a missing Commit column comes back as a missing key instead of a silent pass) or re-read `.kdbp/PLAN.md`, and verify the current phase's `Commit` cell is `✅`. If still `⬜` (gabe-commit Step 6.6 silent no-op fired), print:
      ```
      ⚠ Commit column not ticked for Phase N — PLAN.md state drift detected.
      Possible causes: legacy plan schema, Current Phase mismatch, or Phases table missing Commit column.
      Fix PLAN.md before continuing.
      ```
      Do not silently continue to T[i+1].
   5. **Tick the task row in PLAN.md in the SAME turn as the commit:** `- [x] T[i] (commit <short-hash>)`. If the block is missing, print `ℹ PLAN: task tick skipped (tasks-block-missing)` — never silent.

   Do NOT duplicate CHECK 6/7/8 logic inside `/gabe-execute`. Single source of truth = `/gabe-commit`.

### Step 5: Commit message enrichment (D2 — gabe-lens brief + before/after)

When `/gabe-execute` generates a commit message, body includes:

```
<subject>: <conventional type(scope): one-line>

<paragraph 1: what changed — plain language, 1-2 sentences>

Before:
<3-6 line snippet or structured description of prior behavior>

After:
<3-6 line snippet or structured description of new behavior>

Phase: N — [phase name]
Task: T[i]/[K] — [task description]
Cases: <C-ids advanced (red@<sha>) · Guard: <ids>> | none — <reason> | skip:<code> … | RED OWED …
Class: red | guard | wiring | growth
```

**Generation rules:**

- **Subject**: Conventional commit (feat/fix/refactor/chore/etc). Derived from task description.
- **Paragraph 1 (gabe-lens brief)**: 1-2 sentence explanation of the *why* and *how it maps*. Uses gabe-lens analogy style only if the change is conceptual (not mechanical). Skip analogy for renames/moves/typo fixes.
- **Before / After**: Concrete contrast. For code changes: 3-6 lines of pseudocode or actual snippet showing the behavior delta. For config/docs: structured description (`"triage agent used rule-based keyword matching"` → `"triage agent uses PydanticAI with TriageResult output_type and 4-tier fallback"`).
- **Phase/Task footer**: Always appended. Makes retroactive phase reconstruction trivial.
- **Cases/Class trailer**: the TASK RECORD (Step 4.2) — always appended on checkpoint commits.
  `/gabe-commit`'s `checkpoint-trailer.sh` warns on any message that carries `Task:` without
  valid `Cases:` + `Class:` lines; the trailer is what `case-thread` and the center's narration
  read back later.

**Model**: Haiku for mechanical changes (renames, moves, small refactors). Sonnet for conceptual changes (new pattern, new abstraction, architectural shift). Per U6 value — route by task complexity, never expose to user.

**Example body:**

```
feat(triage): wire PydanticAI agent with 4-tier fallback chain

Triage now enforces output shape mechanically via PydanticAI's output_type
rather than hoping the LLM returns valid JSON. A 4-tier fallback (regex
extract → rule-based → safe default) guarantees the pipeline never crashes
and never returns empty.

Before:
  result = triage_incident(title, desc)
  # rule-based keyword matching; returns None on mismatch

After:
  result = await run_triage(title, desc)
  # PydanticAI Agent(output_type=TriageResult, retries=2)
  # on exhaustion: regex-extract → rule-based → P3 safe default
  # tier fired logged via structlog tier=1|2|3|4

Phase: 2 — PydanticAI Agent
Task: T2/6 — New app/agent/triage_agent.py with Agent + fallback wrapper
```

### Step 6: Deviation handling (D3)

If during execution, the task reveals PLAN.md is incomplete, wrong, or needs restructure:

**Structural deviation (per D3.A — halt):**

Halt conditions — any of these:
- Task needs to split into 2+ tasks, changing phase task count
- New phase must be added (insert phase N.5 or append after current plan)
- Scope section needs new file not currently listed
- Phase dependency order is wrong (this phase needs something from a later phase)
- Risk surfaced that's not in Risks table

Halt prompt:
```
⚠ DEVIATION DETECTED (structural)
TASK: T[i] — [description]
ISSUE: [what's wrong with PLAN.md]

Options:
  [update-plan] — run /gabe-plan update inline, then resume exec
  [split-task]  — split T[i] into sub-tasks inline, continue this phase only
  [skip-task]   — skip T[i], mark as deferred in PENDING.md
  [abort]       — halt exec, leave Exec=🔄, manual intervention
```

**Minor deviation (per D3.C — log + continue):**

Log conditions — any of these:
- Task needs a small extra change not in Scope (e.g., update one import, add one constant)
- Implementation variance from Description (e.g., used dict not list, inlined vs helper)
- A Risk from the Risks table fired and was mitigated as documented

Action: record `deviation(minor): <path> — <1-line note>` in the checkpoint commit body (`/gabe-commit` already owns the body) AND count it in the EXEC thin-index row's `deviations` cell (see Step 7).

No prompt. Continue execution.

### Step 7: Phase complete

When last task T_K commits successfully:

1. **Invariant: runtime journey evidence must be present when required.** If Step 1 classified `runtime_journey_required=true`, read this phase's `proof` field back from `mcp__gabe-kdbp__phase_context` (`plan_json.proof` + `proof_type`, straight off the PLAN.json mirror, with `phase:` set to N) — or from `.kdbp/PLAN.json` when the mirror carries no record for it — and verify it names target-runtime evidence: command(s), target device/browser, build id when applicable, and artifact path(s). If `staging_proof_required=true`, also verify the evidence names the candidate branch/commit, staging service/API URL, readiness or deployment result, and excludes localhost/`127.0.0.1`/SQLite/mock-only as the closing runtime. If evidence is absent or only local/unit/static tests are listed, halt:
   ```
   ⚠ PHASE COMPLETE BLOCKED — runtime journey evidence missing for Phase N
   This phase changes a user-facing/runtime path, so lint/typecheck/unit tests are not enough.
   Exec remains 🔄 until the journey is run on the deployed staging target and artifacts are logged.
   ```
   Then run `ls <each artifact path>` via Bash — a non-existent path means evidence is ABSENT: halt with the block message above. Prose claims (e.g. ":<port> desktop+mobile proof") without a path fail this check by definition.
2. **Invariant: Commit column must be `✅`.** Read the Phases table row for current phase N back with `mcp__gabe-kdbp__phase_context` (`plan_md_row.raw.commit` is the cell as written; `cells.commit` is its normalized state, and columns resolve by NAME) or by re-reading `.kdbp/PLAN.md`. If `Commit` is still `⬜` despite all K tasks having committed, halt:
   ```
   ⚠ PHASE COMPLETE BLOCKED — Commit column still ⬜ for Phase N
   Root cause: one or more tasks bypassed /gabe-commit (raw git commit used instead).
   Consequence: doc drift (DOCS.md CHECK 7), deferred items (CHECK 6), and structure (CHECK 8) were not evaluated for this phase.
   Fix:
     1. Run /gabe-commit docs-audit to surface missed doc drift and triage.
     2. Re-invoke /gabe-commit on any uncommitted state so Step 6.6 ticks the column.
     3. Re-run /gabe-execute once Commit = ✅.
   ```
   Do not tick Exec `✅` until the Commit invariant holds. This prevents the cascade failure where Exec advances past a phase that skipped `/gabe-commit`.
3. Tick Exec cell: 🔄 → ✅ via shared auto-tick (target state = `complete`; the helper mirrors the tick into `.kdbp/PLAN.json` per its step 4b)
4. Bump Last Updated
5. Log to `.kdbp/LEDGER.md` — one thin-index row, composed with `mcp__gabe-kdbp__ledger_row_preview` (`entry: EXEC`; the row comes back in the FILE's own column order, the Gates cell copied verbatim) and written with the harness Write/Edit — never through a tool — so the D7 hooks see the write:
   ```
   | [YYYY-MM-DD] | EXEC | Phase [N] [name] — tasks [K]/[K] | [checkpoint shas] | tests [result] · deviations [S]str/[m]min · proof → PLAN.json |
   ```
   Fold the per-phase TOKENS line (U8 "Measure the Machine", see Model + cost section below) into this same row's Gates column as `· tokens [in]+[out] ($[cost])` — not a separate LEDGER append; include only when the harness exposes real counts (never fabricate — E1).
6. Print phase-complete summary:
   ```
   ✅ GABE EXECUTE — Phase N complete
   EXEC: ✅  REVIEW: ⬜  COMMIT: ✅  PUSH: ⬜
   ```
7. **Print the Gabe-Lens platform-progress brief (output only).** Runs immediately after the normal phase-complete summary and before the full Gabe-Lens block.
   - Header line: `**Gabe-Lens brief — Platform progress**`
   - Open with the shared three-line beat brief (ENTITY / FEATURE / DID — stated once in
     `../../gabe-docs/references/execution-contract.md` §"The beat brief"), then the
     platform-progress block below EXTENDS it.
   - Use active `gabe-lens` brief mode: concise constraint box plus one-line handle.
   - Format:
     ```
     PLATFORM PROGRESS
       BUILT: [one sentence: the concrete capability added or unlocked]
       NOW POSSIBLE:
         - [new user/system action that was impossible or unproven before]
         - [new runtime/proof/operational capability, if any]
       STILL NOT POSSIBLE:
         - [next-phase gap, deferred platform, missing UI, or remaining proof boundary]
       HANDLE: "[5-10 word gabe-lens handle]"
     ```
   - Keep it capability-first: prefer "users/operators can now..." over file lists.
   - If the phase was purely internal or mechanical, state the internal capability honestly (for example, "review can now trust X invariant") instead of inventing user-facing progress.
   - Base it only on the completed phase, current PLAN state, runtime artifacts, and explicit deferrals. Do not speculate about future phases as completed.
   - Keep the brief output-only per the Gabe-Lens Output Rule. Do not append it to PLAN, LEDGER, PENDING, REVIEW, commits, or docs.
8. **Print the Gabe-Lens block (output only).** Runs after the platform-progress brief and before final teach/routing notes.
   - Header line: `**Gabe-Lens block**`
   - Use the active `gabe-lens` cognitive suit and the full Gabe Block format: THE PROBLEM or WHAT IT ENABLES, THE ANALOGY, HOW IT MAPS, THE MAP, CONSTRAINT BOX, EASY TO CONFUSE WITH when helpful, ONE-LINE HANDLE, ANALOGY LIMITS, SIGNAL.
   - Explain what was implemented in the phase, how the changed pieces now connect, and why the next route is review.
   - Base the block only on the completed phase, task/commit summary, changed-file categories, verification outcomes, deviations, and current PLAN state.
   - Keep the block output-only per the Gabe-Lens Output Rule. Do not append it to PLAN, LEDGER, PENDING, REVIEW, commits, or docs.
9. **Teach nudge (phase-level) — RETIRED** (gabe-teach archived 2026-07-15; `skills/_archive/`). Formerly: suggest `/gabe-teach topics` before `/gabe-next` if ANY of:
   - Phase added ≥2 new files in a new folder (matches `/gabe-commit` Step 6.5 trigger at phase scope)
   - Phase introduced new top-level imports in changed files (e.g. `pydantic-ai`, `langchain`, `ai-sdk`, auth libs — any dep not present before the phase)
   - Phase modified `.kdbp/DECISIONS.md`
   - Phase touched files mapped to a Gravity Well whose Topics column shows `(0 / … / …)` or `(… / 0 / …)` verified — i.e. an architecturally significant well with no consolidated knowledge yet

   If triggered, print (one line):
   ```
   (retired output — no nudge is printed)
   ```
   This is a redundant safety net — per-commit `/gabe-commit` Step 6.5 already suggests teach, but scroll-loss in bulk commits can lose it.
10. If scope arg was `all` → advance Current Phase to N+1 and re-enter Step 1. Else → the route is
   printed by the **E8 beat tail** (`NOW:`/`NEXT:` rendered from `next.mjs --json`, stated once in
   `../../gabe-docs/references/execution-contract.md`), NOT a hardcoded line here — a second
   literal route contradicts the router (e.g. a TDD project's next beat is `/gabe-red N+1`, not
   `/gabe-review`). Do not print your own `Next:` line.

### Step 8: Interrupts + resume

If user aborts mid-phase (`stop`, `abort`, or Ctrl+C):

- Exec column stays at `🔄` — signals "in progress, not done"
- Committed tasks stay committed (don't revert)
- Next `/gabe-execute` invocation detects `🔄` state and prompts:
  ```
  ℹ PLAN: Phase N — [name] is in progress (Exec=🔄)
  Completed tasks: T1, T2
  Remaining: T3, T4, T5
  Resume? [resume] / [restart-phase] / [abort]
  ```

Completed/Remaining lists are read from the `#### Phase N Tasks` block in PLAN.md — NEVER from session memory. A task with no ticked row is NOT complete regardless of what the session remembers. Claiming a task complete with no ticked row is a defect.

Never silently re-run completed tasks.

## Model + cost

Per U6 (Route by Task, Not by User):

| Decision | Model | Reason |
|----------|-------|--------|
| Task decomposition (when heuristics fail) | Haiku | Classification, cheap (~$0.001) |
| Code implementation | Sonnet | Main development work (best coding model) |
| Commit message — mechanical changes | Haiku | Rename/move/typo — trivial summarization |
| Commit message — conceptual changes | Sonnet | Gabe-lens brief + before/after analogy |
| Deviation severity classification | Haiku | Structural vs minor is a simple decision tree |

Per U8 (Measure the Machine): folded into the Step 7 phase-completion LEDGER thin-index row's Gates column as `· tokens [in]+[out] ($[cost])` — not a separate LEDGER append. Include only when the harness exposes real counts (never fabricate — E1). Skip in dry-run.

## Non-goals

- Does NOT replace `/gabe-commit` — it invokes it
- Does NOT replace `/gabe-review` — surfaces findings via `/gabe-commit` which already runs deterministic checks
- Does NOT auto-push — that's `/gabe-push`
- Does NOT write architectural docs (architect-level consolidation is archived with gabe-teach)

## Example session

```
$ /gabe-execute
ℹ PLAN: Phase 2 — PydanticAI triage agent (Exec ⬜ → 🔄)
TASKS (3):
  T1. Upgrade TriageResult schema in app/agent/triage.py
  T2. New app/agent/triage_agent.py with Agent + fallback wrapper
  T3. Add pydantic-ai to pyproject.toml

Proceed? [go]

▶ T1/3: Upgrade TriageResult schema
[implementation happens]
T1 verification ✅

Files changed:
  - app/agent/triage.py (+42 / -8)

[commit] — Running /gabe-commit...
✅ commit ab12cd3 — feat(triage): upgrade TriageResult schema to V2

▶ T2/3: New app/agent/triage_agent.py
[...continues...]

✅ GABE EXECUTE — Phase 2 complete
EXEC: ✅  REVIEW: ⬜  COMMIT: ✅  PUSH: ⬜
[beat brief + E8 tail follow — NOW:/NEXT: rendered by the router, not a hardcoded line]
```

$ARGUMENTS
