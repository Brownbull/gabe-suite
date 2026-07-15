---
name: gabe-scope-change
description: "Scope evolution, one entry point. Classifies the requested change (Opus, 9 pivot-trigger rules): a PIVOT routes to /gabe-scope-pivot; an ADDITION executes inline (new REQs/SCs/phases/refs/constraints, decimal phase IDs, coverage re-check). Override with --force-addition or --force-pivot. Usage: /gabe-scope-change [--force-addition | --force-pivot] <description>"
when_to_use: "The scope needs to change — add, drop, or switch direction on an existing SCOPE.md. Classifies pivot vs addition; additions are handled here directly, pivots route to the safety-flagged /gabe-scope-pivot. Entry point for all scope evolution."
metadata:
  version: 2.2.0
---

# Gabe Scope Change — classify, then evolve

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

Single entry point for modifying a finalized SCOPE.md — its premise sections or its `## Phases` section alike. Classifies the requested change; **additions are executed by this skill's own Addition path** (Step 5); **pivots route to `/gabe-scope-pivot`**, which stays a separate skill on purpose — its `disable-model-invocation` flag structurally prevents a model from self-triggering a direction change, and a merged mode cannot carry that flag.

**Why classifier-first and not user-picked?** Misclassifying a pivot as an addition corrupts version history. The classifier uses the declared 9 rules + Opus reasoning + rationale, so the user sees *why*. Overrides exist, but the default prevents silent scope corruption.

> **Rendering note.** Output templates wrapped in bare triple-backtick fences are spec-meta delimiters — render as plain markdown at runtime. Tagged fences (```jsonl) stay fenced. See `gabe-docs/SKILL.md` § "Runtime output rendering convention".

## Procedure

### Step 1: Pre-flight

- If `.kdbp/SCOPE.md` does not exist: exit with "No finalized SCOPE.md. Run `/gabe-scope` first."
- If `.kdbp/scope-session.json` exists (in-progress scope): exit with "Active scope session in progress. Finish or abort `/gabe-scope` first."
- Parse `$ARGUMENTS`: extract `--force-addition`, `--force-pivot`, `--force` (coverage bypass, Addition path only), and description text.
- If no description provided: prompt "What do you want to change? (one paragraph describing the desired change)"
- Read SCOPE.md (incl. `## Phases`) + `scope-references.yaml` into structured state.

### Step 2: Classify

If `--force-addition` or `--force-pivot` set → skip classification, go to the matching path.

Otherwise invoke `prompts/scope-change-classifier.md` (Opus) with `{current_scope, proposed_change, user_intent}`.

The 9 pivot triggers (any ONE = pivot; otherwise addition) — copied verbatim from `~/.claude/prompts/gabe-scope/scope-change-classifier.md` §System role, keep in sync:

| # | trigger_rule | Fires when |
|---|---|---|
| 1 | primary_user | Primary User changes (role/persona/segment) |
| 2 | non_user_flip | a Non-User becomes a Primary/Secondary User, or vice versa |
| 3 | sc_change | a Success Criterion is removed, inverted, or truth-flipped |
| 4 | goal_flip | a Non-Goal becomes a Goal, or a Goal becomes a Non-Goal |
| 5 | posture_shift | Architecture Posture macro-shift (sync↔async, local↔cloud-first…) |
| 6 | ref_conflict | authoritative ref replaced/downgraded/overridden, or a new conflicting authoritative ref added |
| 7 | business_model | funding/business-model shift that retargets the product |
| 8 | constraint_infeasibility | a constraint change makes an existing SC/REQ infeasible as written |
| 9 | timeline_compression | timeline forces REMOVING/skipping phases, not just accelerating |

Fallback gate: if the classifier prompt file cannot be read, do NOT classify from memory — present this table to the user and ask them to pick, recording `classifier: unavailable — user-picked rule <N>` in CHANGES.jsonl.

**Output:** `{classification, trigger_rule, rationale, confidence, user_intent_matches_classification, suggested_next_command}`.

### Step 3: Present + confirm

Render the classification (classification · trigger · confidence · rationale · suggested path). Options:
- `[p]` Proceed with the suggested path
- `[o]` Override to the other path (requires a one-line rationale, appended to the Change Log)
- `[c]` Cancel — exit, no writes

Low-confidence classifications add: "Classifier confidence low — human review recommended before proceeding." Record every routing decision in `.kdbp/CHANGES.jsonl`:

```jsonl
{"ts":"2026-04-21T15:00:00Z","event":"scope_change_classified","classification":"pivot","trigger_rule":"primary_user","confidence":"high","override":false,"routed_to":"/gabe-scope-pivot"}
```

### Step 4: Pivot path — route out

Classification = pivot → exec `/gabe-scope-pivot` with the description as its argument; this skill exits. All pivot writes happen there.

### Step 5: Addition path — execute inline

Classification = addition → this skill performs it. **Invariants:**
- SCOPE.md `scope_version:` stays the same (additions never bump major); `last_scope_event:` → today; `phases_version:` bumps by 1.
- Change Log (§15) appends an `addition` row — never rewrites existing rows.
- Prior phase IDs and REQ IDs are immutable. New phases use decimal IDs; new REQs append with the next sequential ID.

**5a — Detect addition type** (ambiguous → prompt; never guess):

| Type | Example | Action |
|---|---|---|
| New REQ | "Add REQ for export-to-markdown" | Append REQ-NN+1 to §12; map to existing SC or new phase |
| New SC (non-inverting) | "Add SC tightening REQ-02's acceptance signal" | Append SC-NN+1 to §7; wire to existing REQ |
| New phase | "Insert observability phase between 2 and 3" | Insert with decimal ID `2.1` |
| New reference | "Add suggestive ref for wireframes" | Append to scope-references.yaml (contextual/suggestive only; authoritative adds are trigger 6 → pivot) |
| Constraint tightening | "Tighten budget to $10/mo" | Update §9; must stay feasible for existing SCs (else trigger 8 → pivot) |
| Non-goal addition | "Add NG for multi-tenant" | Append NG-NN+1 to §8 |

**5b — Draft with Sonnet** via the matching `prompts/` drafter (users-and-non-users / non-goals-generator / req-decomposer …), passing current SCOPE state + the description.

**5c — Write targets (all appends, never rewrites):** `.kdbp/SCOPE.md` (new entity + anchor); its `## Phases` (decimal-ID insert + Phase Table + Dependency Graph when adding a phase); `scope-references.yaml` (new ref); SCOPE §15 Change Log (`addition` row — one log for premise and phase-arc changes alike).

**5d — Coverage re-check** (same deterministic validator as `/gabe-scope` Step 7): every SC has ≥1 REQ; every REQ in exactly one phase. Broken coverage → prompt "Coverage now incomplete. Add REQ for new SC now? [y/N]" and loop until fixed or `--force` (records `finalize_forced_at` + rationale).

**5e — Confirm + commit.** Diff preview → user approves → write files → offer the git-commit prompt (same flow as `/gabe-scope` Step 8f). Append to CHANGES.jsonl:

```jsonl
{"ts":"2026-04-21T15:30:00Z","event":"scope_addition","scope_version":1,"phases_version":2,"addition_type":"new_phase","entity_ids":["2.1"]}
```

**Decimal ID rules:** between integers N and N+1 → `N.1`, `N.2`, …; after `N.1` → `N.2`; no nested decimals (`N.1.1` forbidden — if depth is needed, that's a pivot); existing integer IDs never renumber; collisions auto-assign the next free decimal.

## Flags

- `--force-addition` / `--force-pivot` — skip the classifier (records `override: true`; a one-line reason is still required in the Change Log). Both set → reject: "Pick one override flag."
- `--force` — Addition path only: bypass the coverage re-check.

## Edge cases

- **Addition that implicitly becomes a pivot** (e.g., "add REQ" whose text changes an SC's observable truth): a mini-classifier call on the drafted output detects it → abort with "This addition appears to modify existing SC semantics. Pivot recommended — re-run, or `--force-addition` to override."
- **Description touches both pivot AND addition scope**: the classifier picks the more disruptive (pivot); the rationale surfaces both; user can split into two invocations.
- **Empty description twice** → exit.

## Integration

Called by the user directly; does not chain from `/gabe-scope`. Pivot writes happen in `/gabe-scope-pivot`; addition writes happen here. (The former standalone `/gabe-scope-addition` entry point is archived — `skills/_archive/` — its procedure lives on as Step 5.)
