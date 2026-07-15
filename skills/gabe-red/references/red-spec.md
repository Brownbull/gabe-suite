# Red spec — the binding contract behind /gabe-red

> The one deep home for case identity, the red checkpoint, guards, and skip codes.
> SKILL.md carries intention + flow and points here; nothing below is restated there.
> Design record & rationale: `docs/design/verification-first/README.md` (suite repo).

## Case identity (C-ids)

- **Format:** project-global, monotonic `C[N]`, revision suffix `v[K]` from the second revision on
  (`C147`, then `C147v2`). Matches the suite's id family (`D[N]` decisions, `P[N]` pending).
- **The id lives INSIDE the test's own text, in the NAME** — never a path, never a registry file,
  never phase-scoped:
  - python: `def test_clamps_negative_quantity_C147v2():`
  - ts/js:  `it('C147v2 · clamps a negative quantity to zero', …)`
  Rationale: survives file renames/moves (identity-by-location is what refactors break); rides the
  junit pipeline with zero plumbing (`<testcase name=…C147v2…>`); selectable (`-k C147v2`).
- **The corpus IS the registry.** Allocation = `max(grep -rhoE 'C[0-9]+' <test roots>) + 1`.
  History = `git log -S "C147"` → first commit → did it carry a `RED:` trailer → has this case
  ever been observed failing?
- **Version bumps:** bump ONLY when the case's CLAIM changes (asserting something different).
  A re-run, a rename, a lint fix, a fixture refactor never bumps. A bump renames the test —
  junit history shows a discontinuity by design; readers stitch on the shared stem (`C147`).
- **Never:** a stored version registry (git already knows what changed) · a phase-scoped id
  (cases outlive phases; PLAN.json resets on archive) · retroactive id edits that alter a claim.

## The red run — three outcomes, not two

| Outcome | Meaning | Action |
|---|---|---|
| **RED** — fails **by assertion** | real evidence: the case demands behavior that doesn't exist yet | proceed to the red commit |
| **NOT-RED** — fails by import / collection / syntax | non-evidence: a broken test is not a failing test | fix the test/stub; re-run; never commit as red |
| **TAUTOLOGY** — passes on unchanged code | the case asserts nothing about the change | HALT; rewrite the case (this is the guard `assert True` dies on) |

**The stub rule (what makes the tautology guard live):** when the subject under test does not
exist yet, write a stub that **RETURNS a wrong-but-typed value — it never raises**. A raising stub
makes every case fail, so every case looks red and the guard is blind; a returning stub lets each
assertion execute against a real value, so an empty assertion gets caught. The stub is production
code written at red — that is the priced tax, not an accident; "stub, not behavior" is a review
subject (CASE DRIFT), not a gate check.

## The red checkpoint commit

Committed through `/gabe-commit` (raw git prohibited as everywhere). Body carries:

```
RED: C147v2, C148 — fail by assertion @ <short reason>
Cases: NEW C148 · BUMP C147→v2 · GUARD C091, C120
```

- The `RED:` trailer marks the commit as the failure's address: re-derivable by a stranger via
  `git worktree add /tmp/x <red-sha> && <runner> -k "C147v2 or C148"`.
- Squash warning (print it whenever the project squash-merges): squashing eats the red commit —
  the trailer must survive on SOME reachable commit or ever-red? goes dark for those ids.
- Guard-only (refactor) records need no red commit — the `Cases:` line in PLAN carries the record.

## The `Cases:` record (PLAN.md Phase Details)

Written by this skill under the phase's details; mirrored to the PLAN.json phase's `cases` field
(E5) — the field the `plan-proof-guard` hook reads (Red ✅ without a cases record is BLOCKED, D7):

```
- **Cases:** NEW C148 · BUMP C147→v2 (red@a1b2c3d) · GUARD C091, C120
```

Refactor form: `- **Cases:** — · GUARD: C091, C147, C203 (behavior unchanged; must stay green)`
with `RED: n/a (guard-only — no new claim)` in the report.

Downstream readers: `/gabe-execute`'s TASK CONTRACT `CASES:` line (which ids each task advances;
phase completion = every declared case green + every guard still green) · the center's testing
pages (ever-red, verification changelog) · the enforcement hook (declared ids must grep ≥1 in the
corpus).

## Skip codes (the honest non-TDD-able exits)

A phase that cannot be test-first does NOT fake a red — it records one of (in the `Cases:` line
and the report; enumerated, never freeform):

- `skip:guard-only` — refactor; existing cases are the contract (this is the NORMAL refactor path,
  not an exception).
- `skip:no-runtime-surface` — docs / config / asset-only change; nothing executes.
- `skip:migration` — data migration verified by its own checked artifact (plan's proof line).
- `skip:spike` — explicitly throwaway exploration (plan must say so; the phase cannot ship).
- `skip:blocked-external` — the failing case needs an external system not yet available; names it.

A skip is visible in the phase record and on the board; repeated `skip:*` on shippable phases is a
review finding, not a silent norm. **Never** `skip` because writing the case is hard — that is the
signal the design isn't settled, which is exactly what red exists to surface (expect 2–3 version
bumps per case on early greenfield phases; that is TDD's known cost, not a failure).

## min_cases by tier

`mvp` = 1 · `ent` = 3–6 (happy + edges per plan's Testing row) · `scale` = plan's matrix
(+fuzz/load where declared). The tier is the verification level; this spec adds no second dial.

## Backfill (existing corpora — one-time, per design decision D5)

Mechanical sweep, one commit per repo: stamp `C[N]` into every existing test name; register the
commit in `.git-blame-ignore-revs`; **never** rewrite a claim; **no fake reds** — backfilled cases
carry ids but their ever-red stays empty until a genuine red is ever observed. New test files
after the sweep: the commit-gate check requires an id at birth.
