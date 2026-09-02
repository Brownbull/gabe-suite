---
name: gabe-help
description: "Context-aware guide — detects project state, shows what's configured, suggests the right workflow."
when_to_use: "What can the suite do, which gabe command fits, where do I start; check the tool registry before building anything new."
metadata:
  version: 1.2.2
---

# Gabe Help — Suite Entry Point

**Usage:** `/gabe-help`

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

## Purpose

Answer one question: **"What should I do next with the Gabe Suite?"**

Scan the current project environment, detect what's configured, what's missing, and where the user is in their workflow. Then recommend specific commands with reasoning.

> **Rendering note.** Output templates in this spec wrapped in bare triple-backtick fences are spec-meta delimiters — render their contents as plain markdown at runtime. Dashboards, workflow recommendations, and tables display as markdown, not monospace code. See `../gabe-docs/references/docs-spec.md` § "Runtime output rendering convention".

This is NOT a man page. It reads the actual state and gives contextual advice.

## Tool registry (P14)

Before building any tooling, harness, generator, or pipeline: read `references/tool-registry.md` — the cross-project "what exists where" registry. E4 REUSE FIRST applies across projects.

---

## Procedure

### Step 1: Environment Scan

Check each probe silently. Do NOT run commands that modify anything. On a `.kdbp/` project ONE `mcp__gabe-kdbp__kdbp_snapshot` call answers the lifecycle rows in a single pass — branch, ahead/behind, the dirty counts, the PLAN phase table (capped at 40 rows, the cap named), the open PENDING count, the last LEDGER rows — and says plainly when there is no `.kdbp/`; the file-existence probes below stay for what it does not carry (VALUES, the profile, maturity).

| Probe | How | Result |
|-------|-----|--------|
| **Git repo** | Check if `.git/` exists | yes / no |
| **Uncommitted changes** | `mcp__gabe-kdbp__kdbp_snapshot` `git.dirty` (modified · untracked · total), else `git status --porcelain` (if git repo) | count of changed files, or clean |
| **Alignment initialized** | `mcp__gabe-kdbp__kdbp_snapshot` (`present` + the `files` list), else check if `.kdbp/` or `.kdbp/VALUES.md` exists | yes (with maturity read from BEHAVIOR.md — the snapshot does not carry it) / no |
| **User values** | Check if `~/.kdbp/VALUES.md` exists | yes (count of values) / no |
| **Cognitive profile** | Check if `~/.claude/gabe-lens-profile.md` exists | yes (suit name) / no |
| **Checkpoint ledger** | `mcp__gabe-kdbp__kdbp_snapshot` `ledger` (its `reason` when absent) settles presence and shows the last rows; count the rows in `.kdbp/LEDGER.md` | yes (count of entries) / no |
| **Deferred items** | `mcp__gabe-kdbp__kdbp_snapshot` `pending.open` — the canonical surface is `.kdbp/PENDING.md` (its `top` list caps at 10, the count does not); fall back to `.kdbp/deferred-cr.md` or `.planning/deferred-cr.md`, the legacy read-only names `/gabe-review` still honours | count of open items / none |
| **Active phase** | `mcp__gabe-kdbp__kdbp_snapshot` — `plan.status` (`active` / `none`) + `plan.current_phase` and that row's cells; when `plan.mirror` reads `no PLAN.json mirror`, take the pointer from `## Current Phase` in `.kdbp/PLAN.md` | phase number + the cell it owes, or none |

### Step 2: Classify Situation

Based on the scan, classify into one of these situations:

| Situation | Conditions | Primary recommendation |
|-----------|------------|----------------------|
| **New machine** | No `~/.kdbp/VALUES.md`, no `~/.claude/gabe-lens-profile.md` | Set up user-level tools first |
| **Greenfield project** | Git repo exists, no `.kdbp/`, idea/new app context | Run deep alignment, then initialize KDBP |
| **Brownfield project** | Git repo exists, no `.kdbp/`, existing code/docs/tests (`mcp__gabe-map__map_status` says whether a command center already exists — if it does, the inventory starts from `mcp__gabe-map__center_overview`) | Inventory first, then cautious KDBP adoption |
| **Configured, idle** | `.kdbp/` exists, no uncommitted changes, no active phase | Start work or run health check |
| **Mid-work** | Uncommitted changes exist | Review before committing |
| **Pre-PR** | Changes staged or branch ahead of main | Review + prepare to ship |
| **Deferred debt** | Deferred items exist (any count) | Surface and triage deferred items |
| **Post-milestone** | A plan exists and no phase is active — `plan.status` is `none` (archived/complete), or every phase row's cells are done | Retro + health check |

Multiple situations can be true simultaneously (e.g., "mid-work" + "deferred debt"). List all that apply, ordered by priority. Full per-situation command sequences (New Machine, Greenfield, Brownfield, Configured-Idle, Mid-Work, Pre-PR, Post-Commit, Deferred Debt, Post-Milestone): `references/help-spec.md` § "Recommendation Logic".

### Step 3: Output

```
GABE HELP — [project name from BEHAVIOR.md or directory name]

┌─ Environment ───────────────────────────────────────┐
│ Git repo:        ✅ [branch name]                    │
│ Changes:         [N files modified | clean]          │
│ Alignment:       ✅ Initialized (maturity: MVP)      │
│                  or ❌ Not initialized                │
│ User values:     ✅ N values | ❌ Not set up          │
│ Cognitive suit:  ✅ Spatial-Analogical | ❌ Default    │
│ Checkpoints:     ✅ N entries | ❌ No ledger           │
│ Deferred items:  ⚠️ N pending | ✅ None               │
│ KDBP plan:       ✅ Phase N active | ❌ No active plan │
└─────────────────────────────────────────────────────┘

Situation: [classified situation(s)]

Suggested next:

  1. /command — [why this, based on current state]
  2. /command — [why this]
  3. /command — [why this]
```

---

## Behavior Rules

1. **Read-only.** gabe-help never modifies files, creates directories, or writes output files. It only reads and recommends.
2. **Fast.** The scan should take < 5 seconds. Don't read file contents unless needed (e.g., maturity from BEHAVIOR.md frontmatter, suit from profile) — one `mcp__gabe-kdbp__kdbp_snapshot` call is cheaper than the PLAN/PENDING/LEDGER reads it replaces, and it is capped by design.
3. **No redundancy.** If the user just ran `/gabe-review`, don't suggest `/gabe-review` again. Check the conversation context.
4. **Honest gaps.** If something isn't set up, say so directly. Don't hedge with "you might want to consider." Say: "Not initialized. For greenfield, run `/gabe-assess` then `/gabe-init`; for brownfield, follow `docs/workflows/brownfield.md` first."
5. **Max 5 suggestions.** More than 5 is noise. Pick the highest-value actions for the current state.
6. **Show the full suite on request.** If the user asks "what tools are available?" or similar, render the full 22-command / 12-skill catalog table — verbatim in `references/help-spec.md` § "Full Suite Catalog (on request)".

Installed workflow docs: `docs/workflows/README.md` (quick chooser), `docs/workflows/greenfield.md`, `docs/workflows/brownfield.md`, `docs/suite-state-audit.md` (current inventory, install state, known gaps).

## Integration

| From | Trigger | What gabe-help adds |
|------|---------|-------------------|
| User runs `/gabe-help` | Direct invocation | Full scan + recommendations |
| User seems lost | "What should I do?", "Where do I start?" | Suggest `/gabe-help` |
| Post-install | After `install.sh` runs | Suggest `/gabe-help` as first command |
