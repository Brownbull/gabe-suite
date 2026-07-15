---
name: gabe-walk
description: "Record a human walking the build — the one verification input with no machine source. Four questions, one append to .kdbp/walks.jsonl (who · when · result · evidence · note). Records, never judges. Usage: /gabe-walk <feature|procedure> [pass|fail|partial]"
when_to_use: "A human just walked a feature, a manual station, or an operational procedure (deploy/rollback/incident drill) and the result should be on the record — pass, fail, or partial. Also: a station is stale and needs a fresh walk."
metadata:
  version: 1.0.0
---

# Gabe Walk — the witness

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings. Full text: `../gabe-docs/references/execution-contract.md` (if missing, E6 — STOP).

## The intention

*Nothing in git, junit, or coverage knows whether a person opened the app and looked. This skill records that one fact and nothing else. It records — it never judges: a half-walk is a `partial`, a bad walk is a `fail`, and a subject with zero records renders NEVER-walked (red) until someone actually walks it. A synthesized witness is worse than an honest gap.*

## Procedure

1. **Subject** — the feature slug or procedure name being walked (e.g. `cook-state`, `deploy-rollback`). If the argument is missing, ask. This skill never invents a subject and never records "walked" on an agent's behalf — the walker is the human (E6: no subject, no record).
2. **Four questions** (any already answered by `$ARGUMENTS` are skipped): result (`pass | fail | partial`) · evidence path if any (shots/notes dir — optional, recorded verbatim) · a one-line note in the walker's words · confirm the walker identity (default: `git config user.name`).
3. **Append one line to `.kdbp/walks.jsonl`** (create the file on first walk — append-only, never edited, never reconciled):
   ```json
   {"subject":"cook-state","who":"<name>","when":"<ISO-8601 UTC>","result":"pass|fail|partial","evidence":"<path or null>","note":"<one line>"}
   ```
4. **Report** (E7): the appended line verbatim + the subject's new staleness clock (last-walk date). A `fail` result also prints: `fail recorded — this renders red on the center until a passing walk lands` (no auto-fixing, no judgment).

## Non-goals

- Does NOT author procedures (those are Foundations prose, written by humans).
- Does NOT verify the evidence path's contents — it records what the walker states (the record is the witness's, not the model's).
- Does NOT compute staleness thresholds — rendering and staleness are the center generator's read of `walks.jsonl`.
- One project-wide file by design (D-ruling: n=1 operator; per-feature files are a cheap later trade if walkers multiply).

$ARGUMENTS
