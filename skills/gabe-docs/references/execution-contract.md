# Suite conventions — the Gabe execution contract

> **Stated once, here, for the whole suite.** Every gabe skill carries a one-line pointer to
> this file instead of a pasted copy — do not re-add the full block to individual skills or
> commands.

## Gabe execution contract (E1–E7)

These are floors, not ceilings — a skill's own gate may be stricter, never looser.

- **E1 EVIDENCE** — every claim about code/state cites file:line or a command run THIS session; no citation → mark it `(assumed)` and verify before building on it. Absence claims ("no X exists") require a recorded search → 0 hits.
- **E2 RUN-BEFORE-✅** — ✅ only after the command executed here (paste cmd + exit/count). Skipped = `⤫ skipped(<reason>)`, never ✅. Every printed number is copied from this run's output — never estimated.
- **E3 NO SILENT DOWNGRADE** — quote the task text verbatim before implementing; if your plan delivers a cheaper class (restyle≠rebuild, stub≠implement, recreate≠reuse), STOP and ask. Substitution requires an explicit user decision line.
- **E4 REUSE FIRST** — before creating anything, print: `REUSE <path> | EXTEND <path> | NEW (searched <where> — none fit)`. Recreating an existing artifact is a defect.
- **E5 STATE SYNC** — actions that change reality (commit/merge/defer/pivot) write their state row in the SAME turn; a skipped write prints an enumerated skip code, never silence.
- **E6 MISSING ANCHOR = STOP** — referenced template/spec/catalog absent → print ⛔ and stop; never reconstruct it from memory.
- **E7 REPORT WHERE** — end user-visible work with: exact URL/screen · env (local :port vs deployed) · what to look at · absolute artifact paths.

## The beat brief — stated once, ruled 2026-08-07 (ask C)

Every spine beat's report carries ONE compact orientation block, printed just before the E8
tail. It exists because the audited cycles' only orientation was hand-authored prose that
evaporated with the context window (7 re-orientation asks). Output-only, like every
Gabe-Lens surface — NEVER written to PLAN/REVIEW/LEDGER/PENDING/commits/docs; the machine
half persists via `inflight.json`, the prose half is meant to evaporate.

```
**Gabe-Lens brief**
ENTITY:  <the phase's declared entities, verbatim from the plan record; `none declared`
          when the record has no entities key (honest blank, never a guess); append
          `· touched: <slugs>` when the in-flight projection names entities the
          declaration does not>
FEATURE: <phase id — phase name, in the plan's own words>
DID:     <this beat's outcome in one sentence — what moved, not what was attempted>
```

`NEXT` is deliberately absent — the E8 tail renders it from the router; the brief never
duplicates it. Beat-specific richness EXTENDS this block where it already exists and stays
where it lives: execute's `PLATFORM PROGRESS` (BUILT / NOW POSSIBLE / STILL NOT POSSIBLE /
HANDLE — execute-spec) and commit's commit-shaped brief (gate-spec) print after these three
lines, never instead of them.

## The beat tail (E8) — stated once, ruled 2026-08-07

Every spine beat (`/gabe-plan` · `/gabe-red` · `/gabe-execute` · `/gabe-review` · `/gabe-commit` ·
`/gabe-push`) ENDS with one three-part tail, in this order, after the skill's own report. It
replaces every hand-written closing line — the audited cycles' hand-written tails were
non-uniform (one beat had none) and the operator asked "how's it going / what's next" seven
times across two repos while the router already knew the answer. Each part degrades to
SILENCE — a missing source never prints filler.

1. **`NOW:` / `NEXT:` — printed from the router's own rendered strings, never formatted here.** Run
   `node ${ECC_ROOT:-$HOME/.claude}/skills/gabe-next/scripts/next.mjs --json` (read-only, zero LLM,
   no state writes) and print its `now_line` / `next_line` fields VERBATIM:
   ```
   NOW:  <now_line>
   NEXT: <next_line>
   ```
   The tail must NOT build these itself — the payload's `state` is a cells OBJECT, and formatting
   it by hand rendered `· [object Object]` on every beat; the router owns the vocabulary and emits
   the finished strings. The tail runs AFTER the beat's state writes (E5, same turn), so the router
   reads fresh cells. Degrade rules: `now_line` is `null` on the plan-complete payload → print only
   the NEXT line; `next` is `null` (exit 2 mirror-unusable, or the exit-1 no-active-plan payload) →
   print NEITHER line; `node` not installed / the command errors → print NEITHER (never invent the
   lines). When the beat KNOWS the router's answer is stale (e.g. push blocked on an operator
   merge — the observed loop-spin), print `NEXT: blocked — <reason>` INSTEAD; an honest override,
   never both.

2. **`CENTER:` — refresh the in-flight projection, then point at it. Conditional, never a
   gate.** Only when `docs/site/center/center.config.json` exists — first run
   `python3 ${ECC_ROOT:-$HOME/.claude}/skills/gabe-cc-update/scripts/write-inflight.py .`
   (deterministic, zero LLM: projects PLAN.json + git into `docs/site/center/inflight.json`,
   which the board and chrome pill read at view time; silent no-op when nothing changed —
   battery at `tests/inflight/run.sh`), then print:
   ```
   CENTER: docs/site/center/ — inflight.json carries this beat's state (phase · declared vs touched entities)
   ```
   No center → run nothing, print nothing. (Same conditional shape as push-spec's terminal-env
   release pointer — silent when inapplicable.)

3. **The PULSE line — last.** Run
   `python3 ${ECC_ROOT:-$HOME/.claude}/skills/gabe-pulse/scripts/angles.py . --one-line`
   and print its output VERBATIM — at most one line, silence when no signal fires, never an
   all-clear, no suggestions added beside it. The signals, sources, and decay rule live in
   `../../gabe-pulse/references/pulse-spec.md` §5.

Why parts 1–2 pass the no-unconditional-lines law: a beat just CHANGED cell state, so
`NOW:`/`NEXT:` are state-carrying, not reassurance; the `CENTER:` pointer prints only where a
center exists to point at. Part 3 keeps its own silence contract.

## Orchestration restraint (0.5c)

Before any multi-agent design/mockup fan-out, run the premise past the human with ONE cheap
single-agent spike. **Orchestrate to verify, not to generate taste.**

Why: in the 2026-07 investigation corpus, multi-agent fan-out was measurably strong for
*verification* (adversarial passes caught real defects) and measurably weak for *taste
generation* (delegated design panels amplified wrong premises instead of challenging them).
