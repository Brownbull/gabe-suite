---
name: gabe-red
description: "TDD's first half as a lifecycle beat — after /gabe-plan, before any source edit: declare case ids (REUSE vs NEW), write failing tests against stubs, prove RED, commit the red checkpoint."
when_to_use: "The phase is planned and about to be executed. Refactors declare GUARDs instead of a fake red; genuinely un-testable phases self-skip with an enumerated code."
metadata:
  version: 1.9.5
---

# Gabe Red — the failing state, given an address

**Usage:** `/gabe-red [phase]`

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

## The intention (why this beat exists)

*A beat asserts one terminal state; TDD has two contradictory terminal states of the same measurement. No wording inside execute can end with "the tests fail" — so red gets its own beat, and its deliverable is a COMMIT whose declared cases fail by assertion. Red is not perishable; it is unaddressable — the commit gives it an address anyone can re-derive later. A test that has never been observed red is not known to test anything.*

This beat decides what the change must be TRUE OF while the answer can still shape the design. It authors no documentation — it writes test code and produces a commit. **Tripwire:** if this beat ever prints a summary a developer reads instead of a failure a developer must fix, it has become ceremony — delete it.

## Ordering gate

Runs after `/gabe-plan` (needs the phase row + its `proof_type`) and **before execute's first source Write** for the phase. `/gabe-next` routes here when the phase row carries a `Red` cell ⬜ (projects without the column are untouched — missing column = always-✅, the same degradation as `Center`).

## Procedure (deep spec: `references/red-spec.md` — binding)

1. **Read the phase** — description, tier, `proof_type`. No test-shaped proof possible → the skip/guard decision (spec §Skip codes) — **never a fake red**.
2. **Scan the corpus** (E4): grep existing C-ids + search tests related to the touched behavior. Print the `Searched:` line — an empty one invalidates the pass. Where the project carries a graft index, run `graft build && rm -f .ignore` (unconditional; ~2 s warm — **the `rm` is mandatory**, the build re-admits graft's own cards to ripgrep and poisons every later grep) and take the cases' **reach** two-arm — `graft callers` + `graft grep`, never `ask` — or call `mcp__gabe-map__who_calls`, the same core with the same gated emit; `reach-emit.py` prints the record form.
3. **Decide per case:** REUSE an existing case (cite `C<N>`; bump to `v<K+1>` ONLY if the claim itself must change — a re-run never bumps) vs NEW (allocate `max(grep C-ids)+1`).
4. **Write the cases** — id inside the test NAME (`test_..._C147v2` / `it('C147v2 · ...')`). Where the subject doesn't exist yet, add a **returning stub** (returns a wrong-but-typed value; NEVER raises — a raising stub blinds the tautology guard).
5. **Run them.** Classify each case against FOUR outcomes: **RED** (fails by assertion, caused by the absent behavior — evidence) · **NOT-RED** (import/collection error — non-evidence, fix before proceeding) · **TAUTOLOGY** (passes on unchanged code — halt; the case asserts nothing) · **RED-WRONG-REASON** (fails by assertion but NOT from the declared absence — indistinguishable from RED at the console; prove the cause with the spec's FLIP test). Runtime-evidence cases also obey the async-boundary rules: bounded waits, an explicit sync point before every post-mutation assertion, and assertions against the source of truth rather than a re-derived rendering.
   *The tautology check is a MINT-TIME check, and its proof is perishable.* A case that was genuinely red here goes **VOID** later — a refactor severs the assertion, a missing cleanup leaves state that satisfies it, a config change excludes it from the run — and a void guard is indistinguishable from a real one until the day it fails to catch something (a twin measured its own void rate at **1 in 6** while trying not to write one). `scripts/prove-guard.py` is the standing form of this step: it mutates the line a case claims to protect and asserts the case goes red. Re-run it when the claim matters, not only when it is written.
6. **Commit the red checkpoint** through `/gabe-commit` with the `RED:` trailer + `Cases:` line (formats in the spec). Write the phase's `Cases:` **and `Reach:`** records into PLAN.md Phase Details, tick the `Red` cell ✅, mirror PLAN.json (E5), and **log ONE `RED` row to `.kdbp/LEDGER.md`** (spec § The LEDGER row — compose it with `mcp__gabe-kdbp__ledger_row_preview`, write it with Write/Edit; `(plan-state)` in Commits for guard-only reds).
7. **Report** (E7): ids declared (new/reused/bumped/guards), the red run's output line, the red commit sha.

## Scripts

| Script | What it does |
|---|---|
| `scripts/prove-guard.py` | **Proves a guard can fail, by making it fail.** Mutates `<file>:<line>`, runs the case, asserts RED, and **always restores the file byte-for-byte** (verified, including on a crashing runner). `PROVEN` exit 0 · `VOID` exit 2 · `INCONCLUSIVE` exit 3 (already-red baseline · no syntax-safe mutation · dirty file). Only operator/literal swaps are applied — a mutation that broke the parse would fail the run for the wrong reason and be reported as proof. Verdicts append to `.kdbp/guard-proofs.jsonl`, which the command center's guard lens reads: an unproven case renders **`named`**, never `guarded`. |
| `scripts/backfill-sweep.py` | Corpus sweep for un-minted cases. |
| `scripts/case-thread.py` | **The red→green thread, observed at both ends.** `--assert-red` re-proves the declared set is failing NOW (execute entry; a broken run — import/collection error — is NOT-RED, never evidence). `--assert-green` proves it passes and prints the `green@<sha>` stamp execute appends to the Cases record (review's opener re-runs it; `plan-proof-guard` BLOCKS Review ✅ without a reachable stamp). `PROVEN` exit 0 · finding exit 2 · `INCONCLUSIVE` exit 3 (skip:* record, no ids). Report-never-gate: prints, writes nothing. |

```
python3 ~/.claude/skills/gabe-red/scripts/prove-guard.py apps/api/wall.py:42 \
    --run "pytest -q tests/test_wall.py::test_excludes_C147" --case C147 \
    --symbol "apps/api/wall.py::is_allowed"
```

Narrow `--run` to the single case where the runner allows: a suite-wide run makes an unrelated failure look like proof.

**min_cases by tier** (the tier IS the verification level — no parallel system): `mvp` 1 · `ent` 3–6 (+edges) · `scale` per plan's matrix (+fuzz/load). Refactors: `GUARD:` list, no new cases required.

## Output contract

Per phase, on completion: a committed red checkpoint (`RED:` trailer) OR a guard-only record OR an enumerated skip code — never silence; the `Cases:` line in PLAN Phase Details naming every id, beside a `Reach:` line (or `no index`); the `Red` cell ✅ in PLAN.md + PLAN.json; the failure output quoted verbatim in the report. This skill states no count or verdict beyond what the run printed (anti-curation).

Emit the shared beat brief (`**Gabe-Lens brief**` — ENTITY / FEATURE / DID, stated once in `../gabe-docs/references/execution-contract.md` §"The beat brief") just before the E8 tail; output-only, never persisted.

## Closing — the beat tail (E8)

End every run with the three-part beat tail, specified ONCE in
`../gabe-docs/references/execution-contract.md` §"The beat tail (E8)": `NOW:`/`NEXT:` rendered
from `node ${ECC_ROOT:-$HOME/.claude}/skills/gabe-next/scripts/next.mjs --json` (or the honest
`NEXT: blocked — <reason>` override when this beat knows the router's answer is stale) · the
conditional `CENTER:` pointer · the PULSE line last, verbatim, silent when silent.
