# Distilling the pilot into scripts + ONE skill (the wave method)

- **Date:** 2026-07-12 · **Status:** v2, POST-SKEPTIC (UPHOLD-WITH-MODS, all 6 mods folded — `../threads/SKEPTIC-distillation.md`). Operator method: wave 1 = deterministic → scripts; wave 2 = newly-unlocked deterministic → more scripts; wave 3 = skills/hooks only where judgment lives. Goal: SIMPLE — intention-first, format contracts in references/, installed in gustify, then backfill until most of the app is covered.
- **Skeptic-driven simplification:** the proposed pair (`/gabe-feature-lens` + `/gabe-center`) collapsed to **ONE skill, `/gabe-feature`** — the `-lens` name collided with /gabe-lens's trigger vocabulary, and the conductor half was a thin router (a smell the suite already solved once with /gabe-next). One skill, four modes, scripts underneath.

## 0. The process the pilot proved (what happens per feature)

```
tests exist (normal dev) ──┐
                           ├─► registry entry ─► lens card (+ diagrams) ─► evidence
machine sources exist ─────┘        │                  │                  (run → proof
(PLAN/LEDGER/junit/openapi/git)     │                  │                   set + narration
                                    └──────────┬───────┘                   + capture)
                                               ▼
                                  regen (build_center_docs.py)
                                  = pages + crawl gate + custody guard
```

The insight the pilot delivered: **the facts are all derivable; only the translation is authored.** That line decides what becomes a script and what becomes a skill.

## 1. Wave 1 — deterministic TODAY → scripts

| # | Action | Script | Status |
|---|---|---|---|
| S1 | Build all pages + custody guard + crawl gate | `scripts/build_center_docs.py` (+4 modules, `check_center_links.py`) | EXISTS (the pilot) |
| S2 | Run the evidence refreshers (junit ×2, coverage ×2, journeys per group, `--capture`, local checks) | `scripts/refresh_center.sh` — ONE entry point that runs whatever subset is asked and ends with S1 | TO WRITE (thin orchestration of commands that already exist in docs/site/README) |
| S3 | **Scaffold a feature** from a phase id OR an explicit commit range: derive commits (`Phase:` trailers — verified exact for H8; ABSENT for pre-SU1 phases, so old phases pass a commit range instead), junit-file candidates, journey specs touched, api paths touched, D-refs; emit a DRAFT entry + card SKELETON. **Best-effort by contract:** every derived glob ships with a `TODO(verify-glob)` marker the gate WARNs on until a human confirms against the rendered match list — scaffolded must never mean trusted. | `scripts/scaffold_feature.py <phase-id\|--range A..B>` | TO WRITE (the biggest lever) |
| S4 | Proof-set scaffolding after a green run: copy selected shots → `proof/<dir>/`, derive the manifest skeleton (legs from shot names, artifacts list, source_run) with `TODO(narration)` markers | `scripts/curate_proof.py <spec> <shot-numbers…>` | TO WRITE (selection stays human; the mechanics don't) |

## 2. Wave 2 — deterministic UNLOCKED by wave 1 → more scripts (mostly gate teeth)

| # | Action | Where |
|---|---|---|
| S5 | **Completeness detection**: gate learns to WARN on `TODO(author)`/`TODO(narration)`/`TODO(verify-glob)` markers, proof_dir without a narration block, capture without `latest.mp4`, and features whose card lacks `reviewed:` — "incomplete" AND "unreviewed" become machine-visible (a TODO-free draft is not a reviewed card) | extend `check_center_links.py` |
| S6 | **The backfill queue** with DISPOSITION STATES per phase: `pending → full \| card-only \| skip(reason)` recorded in the registry — dropped features (e.g. phase 8 MIXING, later removed) get `skip`, never a fake page. Denominator honesty: the queue walks the CURRENT PLAN.json (18 unmapped); prior-generation phases (LEDGER/git history, 60+) are a separately-priced optional pass, not silently claimed | `scripts/next_feature.py` (queue + next command) |
| S7 | Bootstrap for a NEW project (gastify later): copy the generator family + config skeleton + CSS from the reference implementation; D7 (real promotion) stays a Wave-2 rewrite decision — bootstrap is a copy, priced as such | `scripts/` copy step documented in the skill's references (not a suite script yet) |

## 3. Wave 3 — judgment → ONE skill, `/gabe-feature` (and no hook yet)

**The judgment inventory** (everything a script cannot do): write the translation (handle/why/whom/is/is-not/entities/angle reasons); draw the change (which topology, which nodes are lit); narrate evidence; choose the proof shots; judge glob honesty against the rendered match list; decide full vs card-only vs skip; decide when a gap is a reason vs a task.

### `/gabe-feature` — one skill, four modes
- **Intention (stated first in SKILL.md):** *a shipped feature becomes explainable to anyone, with its testing and proof one click away — the machine already knows the facts; this skill writes ONLY the translation and keeps the center regenerating green. Every claim it cannot derive, it must refuse to invent.*
- **Modes:**
  - `(default) <phase|--range>` — author: S3 scaffold → prose + ENTITIES + angle reasons + 3 diagrams (types/shapes/highlights per docs-spec) → narration when evidence exists → S1 regen → verify the match list (clear `TODO(verify-glob)`) → present pages for the human card review → record `reviewed:`.
  - `status` — S1 + read the gate: dead links, unmapped, incomplete, unreviewed, NO-RUN, undated; report + the single next action each.
  - `backfill` — S6 queue: newest first; per phase the human picks the TIER — **full** (evidence + narration) for recent work · **card-only** (registry + card, no evidence demanded of history) · **skip(reason)** for dropped work. Old UIs and prose-only commit messages make full-tier backfill fiction; the tiers keep it honest.
  - `curate <spec>` — after a green run: S4 proof scaffold → pick shots → write narration → set registry custody → regen.
- **Scoping (the trigger contract):** applies ONLY where `docs/site/center/center.config.json` exists; otherwise E6-style STOP with the bootstrap pointer (S7 copy from the reference implementation). `when_to_use` names the center explicitly so the skill never fires in unrelated projects.
- **One schema truth:** the format is ENFORCED by the project validator (`_center_data.py` fails loud); `references/feature-spec.md` states intention + editorial line (cards MAP and TRANSLATE, never assert results) and POINTS at the validator instead of duplicating it — no second truth to drift.
- **Review is recorded, not implied:** the card carries `reviewed: <date> <who>`; S5 WARNs when absent — a TODO-free draft can no longer pass as reviewed.

**Hooks: none in this wave.** Regen stays manual-by-design (the provenance stamp is the honesty mechanism); the natural future hook — gabe-commit running the crawl gate when `docs/site/center/**` is staged — is a Wave-2 note, not built now.

**Priced honestly:** forward ≈ one session per feature (author + review). Backfill: 18 current-plan phases ≈ 4–6 sessions mixing card-only (older) and full (recent); the 60+ prior-plan phases are OPT-IN after that, on the operator's call. Stopping rule = the operator's, not the queue's.

**Acceptance for the distillation itself:** (1) a NEW feature goes commit → center pages green in ONE `/gabe-feature` invocation + one human review; (2) a card-only backfill phase takes ≤15 minutes end-to-end; (3) `suite-doctor` CLEAN after install; (4) the same skill STOPs cleanly (bootstrap pointer) in a project with no center.

## 4. What deliberately stays OUT (simplicity guardrails)

- No generator promotion to the suite (D7 unchanged — the skill points at the project's scripts; gastify bootstraps by copy).
- No prose templating beyond section headings — the card's voice is the value; a fill-in-the-blanks card would be worse than none.
- No third skill for docs/board/hub — they regenerate from the same inputs; there is nothing per-feature to conduct.
- No CI (unchanged constraint); no auto-regen daemon.

## 5. Install + continuation plan

1. Build S2–S6 in gustify (`scripts/`, tests-surface) — project scripts, versioned with the project (the gabe-mockup pattern: procedure in the skill, bindings in the project).
2. Build `/gabe-feature` in the SUITE repo (`skills/gabe-feature/` — SKILL.md ≤200 + `references/feature-spec.md`), update README/CLAUDE/gabe-help, `./install.sh`, `suite-doctor` CLEAN.
3. In gustify: `/gabe-feature backfill` → tier call per phase, newest first → review → repeat in waves of 2–3 features, refining the skill as the pilot teaches. At gastify's window the bootstrap copy (S7) gets its first second-project test — D7's n=2 evidence.
