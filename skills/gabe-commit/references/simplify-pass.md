# Simplify tier — size budget + triggered quality pass (gabe-commit)

> Provenance: investigation 2026-07-07, deliverable 10 §2 (step 0.5a verdict). The standalone
> `/gabe-simplify` wrapper was rejected — demand-side evidence was zero; a new always-loaded
> surface stays unjustified. The supply-side evidence (one twin material-accumulated-complexity;
> monoliths growing at high churn; helpers re-implemented instead of shared) justifies this
> **tiered gate inside gabe-commit** instead: zero new always-loaded surface.
> **Re-open trigger:** if Wave-2 re-measurement shows the tier firing constantly, promote it to
> its own skill — with usage numbers.

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
