# Handoff — twin propagation (rails + review record + memory trial)

> Generated 2026-08-04 · branch `main` · HEAD `41bf13f` · suite repo (no .kdbp by ruling R8 — prompt-only handoff)
> Session closed: the paper-context arc — 13 commits landed and PUSHED to both remotes (Brownbull + khujta, 0 ahead).

## Resume prompt

Propagate the red-thread + review-record rails to the twins on this machine (suite already installed 29/29, hooks live machine-wide). Suite repo: `/home/khujta/projects/gabe_lens` @ `41bf13f`. Twins: `/home/khujta/projects/apps/gastify` · `/home/khujta/projects/apps/gustify`.

READ FIRST: `docs/handoff/2026-08-04-propagation-session.md` (this file), then the memory arc note (paper-context-arc), then `skills/gabe-red/references/red-spec.md` §"The red→green thread".

STATE
- Landed + pushed (both remotes, 0 ahead): red-thread rails `25e2f9c` · rail set 2 `b757118` · review-record option B `76d9c30` · dev-conventions carry `db0b21e` · warn aggregation `1525eb3` · register breathing `009b832..fa1d717` · cost lines `9a749f9` · provenance `3441eaa` · explorer page `87097bf` · investigation record `41bf13f`.
- Verified: tests/hooks 79/79 · tests/case-thread 10/10 · tests/register 6/6 · suite-doctor CLEAN · mutation spot-checks recorded in `1525eb3`.
- Twin dry-run already run (read-only, this arc): NO blocks on either twin; gastify emits ONE aggregated legacy-review warn (34 phases), gustify ONE (3 phases). R2 (sha-less NEW blocks) confirmed safe against their real records.
- Machine hooks: 8 kdbp (incl. red-entry-guard, machine-wide) + 2 register project hooks. ECC fully unwired (backup `~/.claude/settings.json.bak-ecc-2026-08-04`) — session-start ECC:SUMMARY and Bash audit logging are GONE; twins rely on KDBP files + /gabe-handoff for continuity now.
- Parallel thread: a separate session owns the gabe-imagine arc — its uncommitted files in the suite repo (skills/gabe-imagine/*, docs/site/center/* regen, docs/prisms/compound-interest/, tests/prism-probe/, probe-render.mjs, CLAUDE.md imagine/artifact rows) are NOT yours to commit or revert.

TASK (do this next)
Per operator rulings 2026-08-04: (1) adopt the review record in the twins — from the next `/gabe-review` run onward, Step 6 writes `- **Review:** <VERDICT>@<sha> findings:<n> triaged:<n>` into both PLAN mirrors (review-spec 1.10.0; records are written going FORWARD — backfilling the 34/3 legacy phases is optional and NOT required to clear the warn for new work); (2) note the red→green thread in each twin's working agreements (execute stamps `green@<sha>`, case-thread.py at `~/.claude/skills/gabe-red/scripts/case-thread.py`); (3) run the MEMORY-DISABLE TRIAL on ONE twin — the one with the more complete KDBP estate — by setting `"autoMemoryEnabled": false` in that twin's `.claude/settings.json`. Trial governance (operator-agreed, do not soften): KILL if within ~5 sessions a session starts lost (re-derives state KDBP should answer, or redoes work after a missed handoff) → re-enable + record why. WIDEN to twin two only after twin one survives; /gabe-init default only after both. Memory files stay on disk either way.

RUNBOOK
- Twin state check: `cd <twin> && echo '{"tool_input":{"file_path":"/x/.kdbp/PLAN.json"}}' | bash ~/.claude/scripts/hooks/kdbp/plan-proof-guard.sh` — expect exit 0 + one aggregated warn line.
- Suite battery (fast): `bash tests/hooks/run.sh` ≈3 s from the suite repo. Doctor ≈2–4 min — only if suite files changed.
- Gotchas: twins have their own unpushed threads (gastify center/loop2, gustify staging — see memory); the shell-side PLAN-edit warn (R5) now fires on `sed`/`python > .kdbp/PLAN*` — use Write/Edit tools for PLAN changes; red-entry-guard warns on source writes while Red ⬜ — enumerated `skip:*` silences it legitimately.

AFTER THAT
- Wire `docs/site/center/explorer.html` into nav.json at the next suite center regen (nav is generated; currently carries the imagine session's uncommitted work).
- Deferred with triggers: LEDGER case-outcome fields (first disputed ✅) · raw-git hardening (first twin raw-commit incident) · injected-prose canaries (next steer-payload edit) · doctor drift-watch for dev-conventions (next doctor edit).
- Move №2 remainder: global + project CLAUDE.md audit rows still await operator rulings (table on the paper artifact, 📄🧪 aba21fc0).
