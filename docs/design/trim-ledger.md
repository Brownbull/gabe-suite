# Trim ledger — the 2026-07-15 skills/files audit

> Rulings from the trim-matrix audit (evidence: real command runs from both dogfood LEDGERs,
> mentions across both `.kdbp`s, per-skill weight in lines, suite churn in commits). Policy set
> by the operator the same day: **skills are archived, never deleted** — `skills/_archive/`,
> outside the install/doctor glob, one `git mv` from reinstatement.

| # | Call | Ruling | Status |
|---|------|--------|--------|
| 1 | gabe-teach + gabe-arch (2,740 lines, ~2 observed uses) | Archive both | **DONE** `996af8d` — teach/arch + their 3 rider templates in `skills/_archive/`; all active routing removed; `~/.claude/gabe-arch/` user state preserved |
| 2 | gabe-help's hand-kept catalog (18 churns, stale on arrival) | Generate from frontmatter | **DONE** — `scripts/gen-help-catalog.py` writes the CATALOG:BEGIN/END block in help-spec from live `skills/gabe-*/` + `_archive/`; wired into `install.sh`; the drift class is dead. gabe-help 1.2.0 |
| 3 | Scope quartet (4 skills, one capability) | Absorb addition into the router; pivot stays | **DONE** `3515051` — gabe-scope-change 2.2.0 owns the Addition path inline; gabe-scope-addition archived; **gabe-scope-pivot deliberately standalone** (its `disable-model-invocation` flag is a safety property a mode cannot carry) |
| 4 | `CHANGES.jsonl` suspected orphan | Audit | **RESOLVED — NOT an orphan.** It is the scope family's audit log (`/gabe-scope` tombstones + `/gabe-scope-change` routing rows; verified against gustify's live file). The matrix's "no discoverable writer" was a bad grep. Keep, owned. |
| 5 | gabe-align (607 lines) + gabe-assess (329) — 21 combined mentions, 0 LEDGER runs | Defer on evidence | **MARKER SET:** re-measure after gastify's first full verification-first cycle (slice 5). If still quiet: fold assess into review as a pre-change mode; slim align's references. Do not act before the evidence exists. |
| 6 | gabe-meme + gabe-quip → one wit skill (−~150 lines) | Optional, opportunistic | **PARKED:** only if either is being touched anyway. Not worth a dedicated pass. |

Suite after this ledger: **27 skills** (30 → −teach −arch −scope-addition), install 27/27,
suite-doctor CLEAN. Companion decision record: `verification-first/README.md`.
The evidence matrix itself: session artifact "trim-matrix-v1" (claude.ai).
