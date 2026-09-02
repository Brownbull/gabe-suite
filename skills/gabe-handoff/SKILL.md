---
name: gabe-handoff
description: "Session handoff — paste-able next-session prompt + durable KDBP state sync so a fresh session resumes with full fidelity."
when_to_use: "Hand off, wrap up, context heavy or running out — before ending or switching sessions on ongoing work."
metadata:
  version: 2.1.1
---

# Gabe Handoff — session handoff + resume prompt

**Usage:** `/gabe-handoff [--dry-run | --no-sync | <focus note>]`

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

## What this does

Answers one question: "How do I stop here and resume this exact work in a fresh session with zero fidelity loss?" Produces two deliverables: a paste-able next-session prompt (printed inline AND saved to the singleton `.kdbp/HANDOFF.md`), and a durable KDBP state sync (PLAN cells, LEDGER, PENDING brought into line with what actually happened this session). This is the deliberate, high-fidelity counterpart to the automatic session-end transcript scrape — it captures *why* the work matters, *what was decided*, and the *exact next move with its constraint*, which the mechanical scrape can't.

## Procedure

1. Treat any text after the invocation as `$ARGUMENTS`.
2. Read `references/handoff-spec.md` IN FULL before executing — it is the binding spec. If missing, E6 applies — STOP.
3. Parse `$ARGUMENTS` for `--dry-run` / `--no-sync`; the remainder is a free-text focus note folded into the prompt's Task section.
4. Preconditions: determine repo root; if not a git repo, still emit the prompt from conversation context (note git is best-effort). If `.kdbp/` is absent, force `--no-sync` behavior and tell the user to run `/gabe-init` for durable handoff.
5. Gather evidence read-only, starting with ONE `mcp__gabe-kdbp__kdbp_snapshot` call — it carries branch, ahead/behind, the dirty counts, the last commits, the PLAN phase table with its `current_phase` mirror, the open PENDING rows and the latest LEDGER rows, and says plainly when there is no `.kdbp/` (where it does, run the spec's Step 1 git block yourself — the snapshot returns no git data on a non-KDBP repo). Add `git log --oneline -n 20` for the session's own commits and read `.kdbp/SCOPE.md` `## Phases` if present (no tool carries it); then this session's landed work, verification actually run, decisions made, in-flight work, and agreed-but-not-started next steps — every claim cited (E1).
6. Classify each work item as LANDED / IN-FLIGHT / DECIDED-NEXT / DEFERRED.
7. Unless `--no-sync` or `--dry-run`: sync KDBP state to *observed reality only* — PLAN.md phase cells (Exec/Review/Commit/Push, each ✅ only with an evidence citation, never fabricated, mirrored into PLAN.json), append one LEDGER.md row composed by `mcp__gabe-kdbp__ledger_row_preview`, add/update PENDING.md rows composed by `mcp__gabe-kdbp__pending_row_preview` for in-flight-droppable or deferred items — the previews write nothing, every row lands through Write/Edit so the KDBP hooks see it — and print the visible KDBP SYNC report (E5).
8. Compose the next-session prompt using the spec's skeleton (STATE / TASK / RUNBOOK / AFTER THAT) — absolute + repo-relative paths, the task quoted verbatim with its governing constraint (E3), cited state, no open questions to the user.
9. Write `.kdbp/HANDOFF.md` (singleton, overwritten each run) containing the resume prompt + a state snapshot.
10. Print, in order: the KDBP SYNC report (or dry-run/no-sync note), the resume prompt as a copy-paste block, and the absolute path pointer to `.kdbp/HANDOFF.md` (E7).

## Output contract (summary)

User-visible output is always: (1) the KDBP SYNC report — every PLAN(+PLAN.json)/LEDGER/PENDING write shown, or `DRY-RUN — nothing written` / `none (--no-sync)`; (2) the paste-able resume prompt, self-contained enough for a cold session to resume from alone; (3) `Saved → /abs/path/.kdbp/HANDOFF.md · paste the prompt above into your next session.`

State-sync obligations: never bump a PLAN cell past evidence-backed reality; never run the commit/push gates (handoff reflects committed/pushed reality, it doesn't create it); never fabricate a ✅; never touch VALUES.md, DECISIONS.md, or hooks. The full output contract in the spec is binding.
