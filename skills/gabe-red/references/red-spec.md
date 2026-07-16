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
- **The corpus IS the registry.** Allocation = max of the ANCHORED token pattern across
  `<test roots>` + 1 (PCRE `(?<![A-Za-z0-9])C[0-9]{1,5}(?![0-9])`; ERE shell form
  `(^|[^A-Za-z0-9])C[0-9]{1,5}([^0-9]|$)` — never the bare `C[0-9]+`, which over-matches
  `RFC1234`/`SEC101` and inflates allocation).
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
- **The gate expects this commit to fail its tests.** `/gabe-commit` recognizes the `RED:`
  trailer (gate-spec Step 3, red-checkpoint carve-out): the DECLARED ids' assertion-failures are
  the evidence, not a blocker; any import/collection error or out-of-set failure blocks as usual.
  Never `force-commit` a red checkpoint — if the gate blocks it, the red is not clean.
- Squash warning (print it whenever the project squash-merges): squashing eats the red commit —
  carry the `RED:` trailer into the squash-merge commit message, or tag the red sha
  (`git tag red/C148 <sha>`), so it stays reachable; otherwise ever-red goes dark for those ids.
- Guard-only (refactor) records need no red commit — the `Cases:` line in PLAN carries the record.

## The `Cases:` record (PLAN.md Phase Details)

Written by this skill under the phase's details; mirrored to the PLAN.json phase's `cases` field
(E5) — the field the `plan-proof-guard` hook reads (Red ✅ without a cases record is BLOCKED, D7).
**If the phase has no Phase Details block** (brownfield table-only plans), create it first:
`### Phase <id> — <name>` under `## Phase Details`, then the `- **Cases:**` bullet inside it —
that exact heading is what the PLAN.json mirror regeneration parses; a Cases line anywhere else
is invisible to the mirror and the guard blocks the Red ✅ as record-less. Cell writes: this
skill ticks its own `Red` cell in PLAN.md AND mirrors `cells.red`/`cases` into PLAN.json the
same turn (E5) — edit the JSON with a real parser, never `sed` (the auto-tick helper's rule;
Red is outside the helper's four-column set by design):

```
- **Cases:** NEW C148 · BUMP C147→v2 (red@a1b2c3d) · GUARD C091, C120
```

NEW-only form: `- **Cases:** NEW C148 (red@a1b2c3d)` — the `red@sha` attaches wherever a red
commit exists, not only to BUMPs. Because the sha exists only after the red commit lands, the
Red ✅ tick + Cases write is necessarily a SEPARATE follow-up write — give it its own chore
commit (or the next checkpoint). Guard scope, stated plainly: the plan-proof-guard validates
that a cases record EXISTS and that every sha it CITES is reachable — a record citing no sha
passes; the hook never re-runs tests or verifies the failure itself (that is the gate's
carve-out at commit time and review's CASE DRIFT afterward).

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

Mechanical sweep — the tested tool ships at `scripts/backfill-sweep.py` (explicit roots,
`--myopic-labels=`, idempotent; its header carries the rehearsed runbook). One SWEEP commit per
repo, staged by explicit file list (never by directory — a stray `__pycache__/` rides a
dir-scoped add); the sweep sha then goes into `.git-blame-ignore-revs` + `git config
blame.ignoreRevsFile .git-blame-ignore-revs` in an immediately following chore commit — the sha
cannot ride its own commit, and the file alone only helps GitHub's UI. **Never** rewrite a
claim; **no fake reds** — backfilled cases carry ids but their ever-red stays empty until a
genuine red is ever observed. New test files after the sweep: the commit-gate check requires an
id at birth.

Sweep mechanics (rulings R2/R3, rehearsal-hardened): roots are EXPLICIT arguments, never
inferred (legacy trees and generated artifact dirs must stay out); id detection/allocation uses
the anchored token pattern `(?<![A-Za-z0-9])C[0-9]{1,5}(?![0-9])` (shell greps use the ERE
equivalent `(^|[^A-Za-z0-9])C[0-9]{1,5}([^0-9]|$)` — no PCRE dependency) — the bare `C[0-9]+`
grep over-matches (`RFC1234` would start allocation at C1235). Pre-existing id-LIKE conventions
colliding with `C[N]` (e.g. scenario labels in test titles) are renamed to `M[N]` (see
gabe-myopic) in the same sweep, with three rehearsal-proven rules: the colliding set is
**ENUMERATED at sweep time**, never pattern-derived (post-sweep C-id title prefixes are
indistinguishable from labels — an open pattern eats fresh ids on re-run); renames run **BEFORE
allocation** (frees the label numbers); relabeled tests still receive a fresh C-id like every
other test (dual-token titles, e.g. `it("C26 · M1 · …")`). Every prose reference to the old
labels (PLAN risks, docs) is updated in the sweep commit. Case ids own the `C` prefix outright.
