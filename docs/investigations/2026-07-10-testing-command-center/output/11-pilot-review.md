# Pilot completion review — CC2a at round 13

- **Date:** 2026-07-12 · **Inputs:** consistency crawl (`raw/pilot-consistency-audit.md`, 40 pages) + myopic walk (4 tasks × 3 horizons, verify-passed 10 findings) + the session record (COMMS rev 1–13).
- **Question answered:** is the pilot complete and consistent enough to consolidate, or does it need more honing?

## 1. What the pilot IS (inventory)

**40 generated pages, one generator family (2,7xx lines, 5 modules), one config overlay + 2 lens cards, all uncommitted in gustify:**
hub · board · tests (6 stations + 3 PLANNED) · 1 drill · 2 feature pages (5-angle board, demo shelf w/ narration + lightbox, capture video, numstat footprint, paper trail) · 2 suite corpus pages (129 collapsible file sections, machine one-liners 129/129) · 8 group + 21 spec pages · docs wing (hub + 2 feature docs w/ highlighted diagrams, API surface, transitive structures) · v1 archive ×3.
Conventions banked along the way: lens card schema · narration blocks · diagram shape+highlight rules (recorded in gabe-docs) · feature registry w/ validated globs + rendered match lists · custody guard · entity taxonomy · future-station template contract.

## 2. Consistency verdict: STRUCTURALLY CLEAN

The audit found **zero dead links/anchors, zero orphan content pages, zero empty sections, zero numeric mismatches** (every count matches everywhere it appears), every ABSENT angle carries an authored reason, and the template contract (placeholders, entity validation, custody guard) is implemented. The information architecture holds.

## 3. What the probes caught (ranked, deduped across both)

| # | Finding | Source | Class |
|---|---|---|---|
| P1 | **The proof video is machine-local** — `<video>` points into gitignored artifacts; renders dead everywhere but here, with no custody note (the shots say "committed", the video says nothing) | walk CRIT | honesty |
| P2 | **"41.5% web coverage" counts only files tests import** — 103 of 314 src files in the report; 22 of 23 screens absent; "what's NOT covered" is unanswerable where the number sends you | walk CRIT | honesty |
| P3 | **H7 has zero registry presence** — the biggest phase by commits (17), proof set on disk, but no card/feature/docs page; renders as a dead board card next to H8's door | audit #1 | gap |
| P4 | **Sort nulls mislead** — 28/32 phases carry span 0.0 ("no phase-tagged commits" reads as zero, not unknown); parked tickets (the REAL biggest deferrals) sit collapsed at "deferred ×0" | walk HIGH ×2 | honesty |
| P5 | **Docs doors carry no endpoint scent** — nothing maps "/api/v1/me" to the edge-batch card; the legacy shelf claims authority and contains a near-miss (`/meals`) | walk HIGH | navigation |
| P6 | **tests.html lacks collapse + crumb row** (the largest page); hub lacks crumb row; suite pages lack a filter over 85 sections (needle at position 57) | audit #5/#6 + walk MED | consistency |
| P7 | **7 of 8 populated risk cells still doorless** (drills unauthored) — quantified shallowness remnant | audit #2 | CC2b scope |
| P8 | **No crawl-gate script** — today's 0-dead-links is unenforced; nothing stops rot | audit #3 | process |
| P9 | Hub stat splits missing (81 = 78 pass + 3 skip; hand-run chip says UNDATED, not FAIL·15 VULNS) | walk MED | honesty |
| P10 | archive/board-v1 + tests-v1 unreachable; group/suite pages use no h2 icons; sort has no reset | audit/walk LOW | polish |

## 4. Verdict: ONE finishing round, then CONSOLIDATE

The pilot is architecturally done — both probes agree the structure, data integrity, and honesty *machinery* hold. What remains is one bounded finishing round (the F-list below ≈ one session), then consolidation. Continuing to hone beyond that hits diminishing returns: P7 (7 drills) and the icon/retrofit work are generalization tasks that belong to CC2b, not the pilot.

**F-list (the finishing round):**
- F1 (P1): video custody chip + poster fallback with the regen command; custody question (commit a size-budgeted copy?) → rides D146.
- F2 (P2): coverage honesty stamp at the number ("of the N files tests import — M src files unlisted", computed at build); vitest `all:true` decision → gustify PENDING (it will drop the % hard — a choice, not a patch).
- F3 (P3): H7 registry entry + lens card (evidence already on disk).
- F4 (P6): tests.html collapse + crumb; hub crumb; suite-page filter input (framework-free).
- F5 (P4): "span unknown" wording + measured/unmeasured split on sort; parked tickets count as deferred; plan-order reset button.
- F6 (P9): hub stat splits + worst-fact chips.
- F7 (P5): endpoint chips on docs.html cards (from the same snapshot).
- F8 (P8): `scripts/check_center_links.py` — the crawl gate, finally (local, regen-wired).
- F9 (P10): link the two unreachable archives from the legacy shelf; inert risk cells drop the door face.

**Consolidation sequence after the F-round:** (1) gustify: open phase CC2 via the lifecycle, commit the working tree (gates), operator inspection, push (with CC1's pending push). (2) Suite repo: commit the docs-spec convention additions + investigation updates. (3) File gustify PENDING rows: screen-docs ImportError (pre-existing), vitest `all:true` coverage decision, deletion-journey gap, video custody (→D146). (4) CC2b backlog: 7 drills · diagram library extraction · Lucide estate-wide · archive retrofit · narration as suite convention (Evidence Doctrine §6) · D6/D7 Wave-2.
