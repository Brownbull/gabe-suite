---
name: gabe-scope-addition
description: "Additive scope change. Inserts new REQs / phases / refs / constraints without changing SCOPE.md direction. Phases use decimal IDs (e.g., 2.1). SCOPE.md scope_version does NOT bump; phases_version bumps. Usage (direct): /gabe-scope-addition <description>"
when_to_use: "Additive scope evolution routed from /gabe-scope-change — new REQs/phases/refs without changing direction. Normally reached via the router, not invoked directly."
metadata:
  version: 2.1.0
---

# Gabe Scope Addition — additive scope evolution

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

Handles additive scope changes. Inserts new content without touching primary user, success criteria, non-goals, architecture posture, or authoritative refs. All of those changes route to `/gabe-scope-pivot` instead.

**Invariants:**
- SCOPE.md `scope_version:` frontmatter stays the same (additions don't bump major version).
- SCOPE.md `last_scope_event:` updates to today.
- SCOPE.md `phases_version:` bumps by 1 (any `-change` bumps phases_version).
- Change Log (§15) appends `addition` row — never rewrites existing rows. One log for both premise and phase-arc changes.
- Prior phase IDs are immutable. New phases use decimal IDs (e.g., `2.1` between `2` and `3`).
- Prior REQ IDs are immutable. New REQs append with the next sequential ID.

> **Rendering note.** Output templates in this spec wrapped in bare triple-backtick fences are spec-meta delimiters — render their contents as plain markdown at runtime. Tagged fences (```jsonl) stay fenced. See `gabe-docs/SKILL.md` § "Runtime output rendering convention".

## Procedure

### Step 1: Pre-flight

Same as `/gabe-scope-change` pre-flight — SCOPE.md must exist, no active session.

Read current SCOPE.md (including its `## Phases` section) + scope-references.yaml. Parse into structured state for drafting.

### Step 2: Detect addition type

Parse description to detect what's being added:

| Type | Example description | Action |
|---|---|---|
| New REQ | "Add REQ for export-to-markdown" | Append REQ-NN+1 to §12; map to existing SC or new phase |
| New SC (non-inverting) | "Add SC tightening existing REQ-02 acceptance signal" | Append SC-NN+1 to §7; wire to existing REQ |
| New phase | "Insert observability phase between Phase 2 and 3" | Insert phase with decimal ID `2.1` |
| New reference | "Add suggestive ref for wireframes" | Append to scope-references.yaml (contextual/suggestive only; authoritative adds route to pivot) |
| Constraint tightening | "Tighten budget to $10/mo" | Update §9 Constraints; must remain feasible for existing SCs |
| Non-goal addition | "Add NG for multi-tenant" | Append NG-NN+1 to §8 |

Ambiguous additions → prompt for clarification. Never guess the type.

### Step 3: Draft with Sonnet

Invoke `prompts/users-and-non-users-drafter` or `prompts/non-goals-generator` or `prompts/req-decomposer` etc. depending on detected type. Pass current SCOPE state + description as context.

**Write targets (all appends, never rewrites):**

- `.kdbp/SCOPE.md` — add the new entity with its anchor (`{#req-NN}`, `{#sc-NN}`, etc.)
- `.kdbp/SCOPE.md` `## Phases` — if new phase, insert with decimal ID + update Phase Table + Dependency Graph
- `.kdbp/scope-references.yaml` — if new ref
- `.kdbp/SCOPE.md` §15 Change Log — append `addition` row (covers phase-arc changes too — no separate roadmap change log)

### Step 4: Coverage re-check

Run same deterministic coverage validator as Step 7 of `/gabe-scope`:
- Every SC has ≥1 REQ
- Every REQ in exactly one phase

If the addition breaks coverage (e.g., new SC with no REQ yet), prompt: "Coverage now incomplete. Add REQ for new SC now? [y/N]" Loop until fixed or user `--force`s.

### Step 5: Confirm + commit

Show diff preview. User approves → write files. Offer git-commit prompt (same flow as `/gabe-scope` Step 8f).

Append to CHANGES.jsonl:

```jsonl
{"ts":"2026-04-21T15:30:00Z","event":"scope_addition","scope_version":1,"phases_version":2,"addition_type":"new_phase","entity_ids":["2.1"]}
```

## Decimal ID rules

- New phase between integer phases N and N+1 → `N.1`, `N.2`, ...
- New phase after `N.1` → `N.2`
- No nested decimals (`N.1.1` forbidden — if depth needed, pivot)
- Existing integer IDs never renumber

## Flags

- `--force` — bypass coverage check. Records `finalize_forced_at` + rationale.

## Edge cases

**User invokes directly (not via `/gabe-scope-change`).** Allowed, but the classifier gate is skipped. Log `classifier_skipped: true` in CHANGES.jsonl. Recommend user use `/gabe-scope-change` instead.

**Addition that implicitly becomes a pivot** (e.g., "add REQ" but the REQ text changes an SC's observable truth). Detect via a mini-classifier call on the drafted output. If detected, abort with: "This addition appears to modify existing SC semantics. Pivot recommended. Re-run as `/gabe-scope-change` or `--force-addition` to override."

**Phase decimal ID collision.** If `2.1` already exists, new insert gets `2.2`. Auto-assign.

**No argument given.** Prompt for description; exit if empty.

## Integration

Called by `/gabe-scope-change` (routed) or directly by user (not recommended). Does not chain further.

## Command version

`v1.0`.
