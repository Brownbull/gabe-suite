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

## The beat tail (E8) — stated once, ruled 2026-08-07

Every spine beat (`/gabe-plan` · `/gabe-red` · `/gabe-execute` · `/gabe-review` · `/gabe-commit` ·
`/gabe-push`) ENDS with one three-part tail, in this order, after the skill's own report. It
replaces every hand-written closing line — the audited cycles' hand-written tails were
non-uniform (one beat had none) and the operator asked "how's it going / what's next" seven
times across two repos while the router already knew the answer. Each part degrades to
SILENCE — a missing source never prints filler.

1. **`NOW:` / `NEXT:` — rendered from the router, never from memory.** Run
   `node ${ECC_ROOT:-$HOME/.claude}/skills/gabe-next/scripts/next.mjs --json` (read-only,
   zero LLM, no state writes) and render its payload:
   ```
   NOW:  Phase <phase> — <name> · <state>
   NEXT: <next> — <reason>
   ```
   The tail runs AFTER the beat's state writes (E5, same turn), so the router reads fresh
   cells. No `.kdbp` plan, or router exit 2 → print neither line. When the beat KNOWS the
   router's answer is stale (e.g. push blocked on an operator merge — the observed loop-spin),
   print `NEXT: blocked — <reason>` INSTEAD of the router's line; an honest override, never
   both lines.

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
