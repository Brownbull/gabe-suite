# Handoff — twin propagation GOAL (rails + centers current + memory trial)

> Generated 2026-08-04 · suite `main` synced to BOTH remotes (Brownbull + khujta) at `6cb212e`, 0 ahead.
> Suite repo: `/home/khujta/projects/gabe_lens` (no .kdbp by ruling R8). Twins: `/home/khujta/projects/apps/gastify` · `/home/khujta/projects/apps/gustify`.
> Written to run as a **Claude Code Goal** (or pasted as a session prompt). Execution mode: **ultracode + ultrathink — use Workflows** for the fan-out stages; think hard at the adoption decisions.

## GOAL

By tomorrow, **both gastify and gustify are ready to work under the new Gabe Suite**: the red→green
thread and the review record are adopted, each command center is up to date with everything already
shipped in those projects, and every touched surface is left WORKING — nothing half-migrated,
nothing broken, no in-flight twin thread discarded.

## DONE WHEN (per twin — all six, evidence-cited)

1. Guard probe green: `echo '{"tool_input":{"file_path":"/x/.kdbp/PLAN.json"}}' | bash ~/.claude/scripts/hooks/kdbp/plan-proof-guard.sh` → exit 0, ≤1 aggregated legacy warn.
2. Rails adopted: the twin's working agreements (CLAUDE.md/KDBP docs) name the red→green thread — execute stamps `green@<sha>`, `case-thread.py` at `~/.claude/skills/gabe-red/scripts/`, review Step 6 writes `- **Review:** <VERDICT>@<sha> findings:<n> triaged:<n>` into BOTH plan mirrors from the next review onward (forward-writing; backfilling the 34/3 legacy phases NOT required).
3. Command center current: `/gabe-cc-update status` shows every shipped feature covered or explicitly queued; the regen loop (`bash scripts/refresh_center.sh regen` — build·links·chrome) exits green.
4. **Changelog dates:** any changelog table encountered during center work that lacks a date column GAINS one (Dates as a column, per row) — center verification changelogs included.
5. Memory trial set on ONE twin — the one with the more complete KDBP estate (evidence points at gustify: plan COMPLETE per the tests-ledger arc; verify before choosing): `"autoMemoryEnabled": false` in that twin's `.claude/settings.json`, with the trial note in its handoff. KILL: within ~5 sessions a session starts lost (re-derives state KDBP should answer, or redoes work after a missed handoff) → re-enable + record why. WIDEN: twin two only after twin one survives; `/gabe-init` default only after both. Memory files stay on disk either way.
6. All work committed through each twin's own `/gabe-commit` gate; push per the twin's `.kdbp/PUSH.md` env rules where its state allows — never force, never discard their unpushed threads (gastify center/loop2, gustify staging).

## EXECUTION SHAPE (ultracode)

- Two twin lanes; within each lane, Workflow fan-outs where the work is per-item: center coverage
  per entity/feature (cc-update backfill), changelog-table sweeps, verification passes. Adversarially
  verify claims that a center page is "covered" — a rendered card is not evidence; the regen gate is.
- **Checkpoint policy:** suite skills carry ask-first gates (tier calls, walk stamps, curate approvals).
  Running as a Goal, do NOT stall on them — execute the deterministic/batchable parts, collect every
  operator-stamp moment into a final CHECKPOINTS list for the human, and leave those items visibly ⬜.

## STATE (what the suite now ships — all pushed)

- Rails: red-thread `25e2f9c` + rail set 2 `b757118` (case-thread.py, red-entry-guard, carve-out parser, sha-less NEW block, PLAN-edit warn) · review record `76d9c30` · warn aggregation `1525eb3` · cost lines `9a749f9` · explorer page `87097bf` · conventions estate `db0b21e` (install 29/29).
- Verified this arc: tests/hooks 79/79 · case-thread 10/10 · register 6/6 · doctor CLEAN · twin dry-run: NO blocks, gastify ONE aggregated warn (34 legacy phases), gustify ONE (3).
- Machine hooks: 8 kdbp + 2 register; ECC fully unwired (backup `~/.claude/settings.json.bak-ecc-2026-08-04`) — no more ECC:SUMMARY at session start; continuity = KDBP files + /gabe-handoff.
- Parallel thread: a separate session owns the gabe-imagine arc — its uncommitted suite-repo files (skills/gabe-imagine/*, docs/site/center/* regen, docs/prisms/*, tests/prism-probe/, CLAUDE.md imagine/artifact rows) are NOT this goal's to commit or revert.

## RUNBOOK

- Fast checks: suite `tests/hooks/run.sh` ≈3 s; guard probe (above) per twin; doctor ≈2–4 min only if suite files change.
- Gotchas: R5 warns on shell-side PLAN edits (`sed`/`python > .kdbp/PLAN*`) — use Write/Edit tools for PLAN; red-entry-guard warns on source writes while Red ⬜ (enumerated `skip:*` silences legitimately); center regens are browser-gated (minutes) — regen once per twin at the end, not per page.

## AFTER THAT

- Wire `docs/site/center/explorer.html` into the suite center's nav at the next suite regen (nav.json is generated; currently carries the imagine session's work).
- Deferred with triggers: LEDGER case-outcome fields (first disputed ✅) · raw-git hardening (first twin raw-commit incident) · injected-prose canaries (next steer-payload edit) · doctor drift-watch for dev-conventions (next doctor edit).
- Move №2 remainder: global + project CLAUDE.md audit rows await operator rulings (table on the paper artifact 📄🧪).
