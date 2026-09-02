---
name: gabe-assess
description: "The direction guard — rapid impact assessment (blast radius, maturity-appropriate scope, prerequisites) before committing to an 'obvious' change, plus the boundary check absorbed from gabe-align (values + AP advisory at commit/PR boundaries)."
when_to_use: "A new direction appears mid-development, the scope is being steered or expanded, 'this change feels obvious' — evaluate pros/cons and proceed-vs-backlog before code; also pre-flight before a risky or irreversible change. Cheaper than a full plan."
metadata:
  version: 1.3.1
---

# Gabe Assess — Change Impact Assessment Skill

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

## What this does

Pause before an "obvious yes" and take a photograph of what a proposed change actually means — blast radius, maturity-appropriate scope, prerequisites, and alternatives — before agreeing to it. This is NOT a code review (use gabe-roast); it's the moment between "should we do X?" and "yes," the triage instinct that asks what you're actually signing up for. Use when about to reflexively say yes to a suggested fix, detour, or scope addition; skip for trivially-scoped changes (rename, typo) or when you've already assessed and are now implementing.

## Boundary check (absorbed from gabe-align, 2026-07-30)

The values + AP advisory check that lived in gabe-align now runs here as part of the assessment when the change is risky, irreversible, or lands at a commit/PR boundary: check the proposal against the project's stated values and the Architecture Principles (`templates/architecture-principles.md`, AP1–AP13, advisory citations only — never gates). Deep spec preserved at `../_archive/gabe-align/references/`.

## Direction guard (LIVE 2026-07-31 — semantic trigger)

This skill IS the suite's direction guard. The trigger is semantic and machine-wide: `scripts/hooks/kdbp/direction-guard.sh` (UserPromptSubmit, KDBP projects only) injects the steer rule into every prompt — a prompt that steers the work in a new direction (new target, scope expansion, tier jump) runs `/gabe-assess brief` BEFORE building and shows it: blast radius · tier fit · proceed-vs-backlog. Contained, tier-matched asks proceed without ceremony. Semantic-only by operator ruling (2026-07-31) — no commit counters, no diff thresholds; the pain this answers is targets moving across sessions with no at-hand evaluation.

## Usage / modes

`/gabe-assess [change description or 'this']`

Required input: the proposed change (inline description, a reference to earlier discussion, or "this") plus its context (mid-task / planning / post-review / blocker) — auto-detected or stated.

Every full-mode assessment covers five dimensions: **D1** Blast Radius (Contained/Local/Cross-cutting/External), **D2** Maturity-Appropriate Scope (MVP/Enterprise/Scale, vs. the project's actual maturity — optionally citing the archetype posture-mix from `templates/archetype-map.md`), **D3** Prerequisites, **D4** Alternatives (do nothing / minimal / proper / workaround), **D5** Structural Fit (only when `.kdbp/STRUCTURE.md` exists — flags files proposed in undeclared locations).

| Mode | Alias | Output | Use when |
|------|-------|--------|----------|
| **full** | (default) | All 5 dimensions + alternatives + recommendation | Change isn't trivial and you need to decide |
| **brief** | `bf` | One line per dimension + Rec + Handle | Quick gut-check, triaging multiple changes in sequence |
| **inline** | `il` | Single sentence, no formatting | The assessment should feel like a colleague's aside |

## Procedure

1. Treat any text after the invocation as `$ARGUMENTS` (the proposed change, or "this").
2. Read `references/assess-spec.md` IN FULL before executing — the binding spec. If missing, E6 applies — STOP.
3. Identify the proposed change and its context; if either is vague, ask rather than guess.
4. Read enough to understand what the change touches — files, configs, environments — before classifying D1; where the project carries a command center, orient with `mcp__gabe-map__center_overview` and take the floor reading from `mcp__gabe-map__blast_radius` on the paths the change names, then open them.
5. Assess D1-D4 concretely and specifically (never inflate or deflate); run D5 only when `.kdbp/STRUCTURE.md` exists, extracting anticipated file paths from the change description and matching them against Allowed Patterns.
6. Produce the mode-appropriate output. The recommendation is a suggestion, not a gate — the user decides.
7. When multiple changes are proposed together, assess each separately in brief mode, then produce a combined batch recommendation (independent/coupled/sequenced + order).

## Output contract (summary)

Full mode: GABE ASSESS header + D1-D5 breakdown + RECOMMENDATION + a Gabe-Lens-format ONE-LINER (5-12 words, concrete, survives fatigue). Brief mode: one line per dimension + Rec + Handle. Inline mode: a single sentence. Batch mode adds a combined table (Change/Blast/Maturity/Rec) + Order + Handle. The full output contract in the spec is binding.
