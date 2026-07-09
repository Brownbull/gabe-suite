# Simplify tier — size budget + triggered quality pass (gabe-commit)

> A tier inside the commit gate by design — deliberately NOT a standalone always-loaded skill.
> Evidence-triggered, never every commit.

## Tier 1 — deterministic size-budget check (every commit)

Run `scripts/size-budget.sh` (this skill) alongside the gate's other deterministic checks.

- WARN when any touched file **is, or newly crosses, >800 first-party lines**; generated files
  (by header marker) are exempt.
- The WARN names the file and prints any split seams recorded for it in `.kdbp/RULES.md` /
  `.kdbp/PENDING.md`.
- Zero model cost, zero friction on clean commits. Exit 2 = warnings present; a WARN **never
  blocks the commit by itself** — it enters triage like any other finding.

## Tier 2 — triggered simplify pass (evidence-triggered, never every commit)

**Offer** (do not auto-run) a quality-only pass when ANY of:

1. the size-budget check WARNed on this commit,
2. the phase touched a file recorded as a known monolith (RULES.md / PENDING.md / a health or
   code-audit finding),
3. the operator asks for it.

Shape — parallel quality-only agents over the **changed code only**:

| Lens | Question |
|---|---|
| reuse | does an existing component/helper/module already do this? (the re-implemented-helper signature) |
| simplification | dead branches, needless indirection, nameable seams in files growing past cohesion |
| efficiency | obvious waste — N+1 loops, repeated computation, unbounded reads |

**Never bug-hunting** — correctness findings are `/gabe-review`'s lane; if a pass agent trips
over a real bug, it hands it to review triage rather than expanding its own scope.

Output: findings priced like review findings (cost of NOT fixing), triaged
**fix-now / defer / accept**. Deferred items land as `PENDING.md` rows naming the split seams,
so future size-budget WARNs on the same file cite them automatically.

## Restraint

Orchestrate to verify, not to generate taste (`../../gabe-docs/references/execution-contract.md`).
The pass reviews existing changed code; it never fans out to generate redesigns.
