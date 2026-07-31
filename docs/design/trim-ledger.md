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
| 5 | gabe-align (607 lines) + gabe-assess (329) — 21 combined mentions, 0 LEDGER runs | Defer on evidence | **DONE 2026-07-30** — marker fired (slice 5 complete on both twins 2026-07-17; align still 0 window uses, assess 0 lifetime). Operator ruled a stronger form than the prescription: align ABSORBED INTO assess (boundary check), assess KEPT and ruled to become the auto-triggering direction guard (fires on direction steers / big changes / N commits on main — rework pending). |
| 6 | gabe-meme + gabe-quip → one wit skill (−~150 lines) | Optional, opportunistic | **DONE 2026-07-30** — operator ruled the merge during the skill-map session: quip absorbed into gabe-meme as the surface-wit mode; gabe-meme 1.2.0. |
| 7 | gabe-health (298) + gabe-debt (526) — 4 combined uses, both dormant ≥90d, both prose-only | Merge | **DONE 2026-07-30** — debt absorbed into gabe-health as the `debt` lens; health 1.2.0 also gains the ask-first `estate` sweep (lazy-promotion rack model: propose skill promotions AND archivals by usage at production pushes — always asked, never auto). |
| 8 | gabe-walk (46 lines, 2 lifetime uses, stations unread) | Archive | **DONE 2026-07-30** — operator: lost its why. walks.jsonl record format survives; /gabe-cc-init appends approvals directly; the estate sweep's first live case. |
| 9 | Command-center namespace | Rename | **DONE 2026-07-30** — gabe-adopt→gabe-cc-init, gabe-entity→gabe-cc-entity, gabe-feature→gabe-cc-update ("refresh" collides with refresh_center.sh regen). gabe-docs/gabe-docsite stay OUT of cc-* (suite-wide, not center). Historical design records keep old names on purpose. |

Suite after rows 1–6: 27 skills. After rows 7–9 (2026-07-30): **26 skills**
(−walk −quip −align −debt, +entity/pulse/quip had shipped in between), install 26/26, suite-doctor CLEAN. Companion decision record: `verification-first/README.md`.
The evidence matrix itself: session artifact "trim-matrix-v1" (claude.ai).
