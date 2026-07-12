# SKEPTIC — attack on 12-skill-distillation.md

- **Date:** 2026-07-12 · **Pattern:** adversarial skeptic, read-only, evidence from gustify @ `1a1f943e` + suite repo
- **Target:** `output/12-skill-distillation.md` (wave method: S1–S7 scripts, two skills, backfill driver)

## VERDICT: UPHOLD-WITH-MODS

The wave split itself (deterministic→scripts, judgment→skills) survives every attack — the pilot genuinely proved
the facts are derivable and only the translation is authored, and the S1/S5/S6 gate extensions are correctly priced.
What does NOT survive: the plan's claims about S3's derivation power for backfill, the backfill economics, the
skill naming, and the coupling story. Six mods are mandatory.

---

## Attack 1 — Skill overlap and count: two skills is defensible, ONE of the names is not, and a third neighbor is unmentioned

**The `-lens` name collision is real, not cosmetic.** `skills/gabe-lens/SKILL.md` `when_to_use` reads: *"give me a
handle / analogy / spatial map for X"*. The pilot's card format (`docs/site/center/cards/h8-cook-photos.md`) opens with
`# HANDLE`, and its WHAT&WHY is an analogy ("A Polaroid pinned to the ticket rail"). A skill named `/gabe-feature-lens`
whose product is handles-plus-analogies sits directly on gabe-lens's trigger vocabulary. The fuzzy skill matcher and
the human both will confuse them ("lens this feature" — which one fires?). They are different capabilities (ephemeral
explanation to ONE person's cognitive suit vs. durable published artifact under a format contract), so it is not a
duplicate — but the name manufactures a collision the suite doesn't need. Rename: `/gabe-card`, `/gabe-feature`, or
similar.

**The plan ignores /gabe-docsite entirely.** The suite already ships a skill whose `when_to_use` is *"Publish or update
a page on the generated HTML docs site — place a doc in the right section, wire the nav, render with working
diagrams"* — and it ships its OWN generator inside the suite (`skills/gabe-docsite/generator/build_docsite.py`).
In gustify, `docs/site/` contains both the docsite pages and `center/`. A user saying "add the H9 page to the docs
site" can trigger gabe-docsite instead of the new skill. The plan's §4 rules out a "third skill" but never routes
against the third skill that ALREADY EXISTS. A routing line is required in both skills' when_to_use.

**Two vs one:** Skill B is self-described as "read-heavy, decision-light — run the script, read its output, do the ONE
judgment step it names." That is a router, and S5/S6 exist precisely to make the gaps machine-visible. The only
irreducible judgment in the whole inventory (§3 of the plan) is authoring. One skill with `status`/`backfill` modes
(the gabe-mockup precedent packs 4 modes in 73 lines) is at least as convention-honest as two, and cheaper at 25→26
instead of 27. Two is ACCEPTABLE (gabe-scope family splits similarly), but the plan asserts "exactly TWO" without
arguing against one. Mandatory: argue it or merge it.

## Attack 2 — S3 scaffold: derivation is REAL going forward and mostly FICTION going backward

**Forward case verified.** `git show --numstat a98df2eb` yields test files `apps/api/tests/test_cooking_photos.py` +
`apps/web/src/features/cooking/photoCompression.test.ts`; the registry's actual globs are `*test_cooking_photos*` /
`*photoCompression*` — filename-derived globs reproduce the human-authored registry EXACTLY for H8. `eed31557` touches
`tests/web-e2e/web-journey-cook-state.spec.ts` → `journey_specs` derivable. For trailer-disciplined recent phases, S3
is honestly "the biggest lever."

**Backward case fails on its own inputs.** Evidence from gustify's 851 commits:
1. **Zero trailers for a third of the queue.** `git log --grep 'Phase: H1..H5|SU1'` → **0 commits** for H1–H5 and SU1 —
   6 of the 18 backfill phases have NO `Phase:` trailers at all. Only 259/851 commits carry any trailer.
2. **Phase-id collision across plan generations.** Trailer `1 — SAFE (Ingredient-safety…)` (5 commits) coexists with
   `1 — Backend Batch 1 — Identity, household…` (4 commits). PLAN.json phase `"1"` matched by id hits both. Trailer
   values are free prose ("H7 — Notifications v1 (founder round 4)") — matching them is judgment, not determinism.
3. **The registry's own H7 proves derivation ≠ curation.** The H7 *cook-state* feature lists 4 commits; the `Phase: H7`
   trailer population has ~10, including the journey-runner and suite-repair commits the humans deliberately EXCLUDED —
   and the trailer says "Notifications v1", not cook-state. The pilot's registry is a curated subset with a re-titled
   phase; a scaffold reproducing the trailer set would be wrong in both directions.
4. **Under-claim for old phases:** their in-range commits touch no journey specs (the journey suite postdates them) and
   junit globs must target TODAY's test tree, not the files the phase touched — the right evidence exists but is not
   derivable from the commit range at all.

**Over-claim + scaffolded=trusted:** junit matching is per-FILE (`_junit_file_of`, `_center_data.py:245`) and the gate
fails only on `matches 0 junit files` (`_center_data.py:586`) — over-matching is structurally invisible to the gate.
If a phase's commit edits one test inside a broad pre-existing file (H7 touching `test_cooking.py` → registry glob
`*test_cooking.py` claims every cooking test ever written), the scaffold emits a confident-looking machine-derived glob
whose only counterforce is the skill's soft "judge glob honesty" step. Yes: the draft-entry pattern makes wrong globs
MORE likely to ship, because prose sections get `TODO(author)` markers and S5 teeth while derived globs get neither.
Fix is cheap: scaffold stamps derived globs `TODO(verify-glob)`; S5 WARNs on it exactly like the prose markers.

## Attack 3 — The 18-phase backfill: the ritual does NOT scale backwards and the plan doesn't say so

The 18 fully-done unmapped phases (PLAN.json: 1–9, 13–15, H1–H5, SU1) have no proof sets, no captures, prose commit
messages, and drifted UIs. The full ritual (evidence run → proof curation → capture → narration) is impossible for
most of them: phase **8 "MIXING — parallel-cook scheduler" was DROPPED by H6** — it sits in the done-queue with no UI
to photograph, ever. The data model already supports a lighter tier (edge-batch ships `proof_dir: null, capture: null`)
but the plan never DEFINES a backfill tier — §5 sends `/gabe-feature-lens <phase>` at the queue undifferentiated.
Required: backfill default = card + registry + junit globs against today's suite + ANGLES recording the evidence gap
honestly; proof/capture only where a current journey already covers the feature. And the queue needs disposition
states (mapped / skip-dropped / obsolete), or it never empties — the S6 driver will nag about phase 8 forever.

**Worse: the queue's denominator is wrong for the stated goal.** The queue = PLAN.json phases, i.e. the CURRENT plan.
The trailer census shows whole earlier plan generations (Backend Batches 0–4, phases 19–71: option-model, pantry
batch, recipes/AI, auth/setup, deploys) that are not PLAN.json phases and therefore invisible to S6 — yet they ARE
"most of the application" the operator wants covered. Emptying the queue covers most of the current plan, not most of
the app. Either the goal statement narrows or the queue gains a second source (LEDGER/`ledger_match`, like edge-batch
already uses).

## Attack 4 — Project-local scripts vs suite skill: inverts the suite's own precedent, and drift has no doctor

gabe-mockup's contract is explicit: *"Procedures stay in this skill; only bindings live in the manifest."* The plan
inverts it — the procedures (generator, gate, scaffold) live in gustify's `scripts/`, versioned with the project,
while the suite skill carries format contracts in `references/feature-lens-spec.md`. That creates TWO sources of truth
for the same schemas: the operational one (`_center_data.py` raises `SystemExit` on registry violations — it IS the
schema) and the documentary one in suite references. `suite-doctor.sh` checks repo↔`~/.claude`; nothing checks suite
references↔project scripts. **What breaks first:** gustify's scripts evolve with the project (they already did — "Mod
2" comments in `_center_data.py` postdate the pilot), the suite references silently stale, and the skill starts
instructing against a contract the gate no longer enforces. Second break: gastify day 1 — skill installed globally,
scripts absent, flow step 1 "run S1" hits E6 STOP; bootstrap-by-copy then forks a THIRD copy with no drift check.
Also unaddressed: trigger scoping. Skills install globally; without gabe-mockup-style scoping ("in a project with a
mockup manifest" + `paths:` globs), both skills are matchable in every project. Required: references POINT at the
project validator as the binding schema (one truth), a bindings block (script paths, config path) per project
gabe-mockup-style, and `when_to_use`/`paths` gated on `docs/site/center/center.config.json` existing.

## Attack 5 — Cost per feature: forward is fine, backfill is unpriced, and the plan prices NOTHING

Forward per-feature: scaffold (seconds) + author ~80-line card with 3 Mermaid diagrams + narration block + proof
curation + regen/crawl + the once-per-feature human review — realistically one working session per feature, dominated
by the authoring+review loop, plus evidence runs (journey ~1.4 min green ×2 for cook-state; junit ×2 + coverage ×2 =
full-suite runs, minutes-scale). Acceptable forward. Backfill: 18 features × that ritual at the plan's own cadence
("each wave of 2–3 features") = **6–9 full sessions minimum** even at the lighter card-only tier — and the plan
contains zero arithmetic, no batching guidance (one evidence refresh can serve a whole batch; the plan makes S2
per-feature-shaped), and no stopping rule for "most of the app." The operator's "go back through most of the
application" is a multi-week commitment being sold at the price of a §5 bullet.

## Attack 6 — What the plan forgot (vs. simple / repeatable / intention-first / install / backfill)

1. **Review state is unrecorded.** The pilot's once-per-feature card review has no home — proof manifests carry a
   `curated:` date, the registry carries nothing. `/gabe-center status` cannot distinguish a reviewed card from a
   TODO-free draft; S5 detects markers, not approval. Add a per-feature `reviewed:` field the gate can read.
2. **Registry surfaces beyond features[] are unowned.** `entities`, `map`, `drills`, `future_stations` exist in
   center.config.json; S3 emits only a features[] draft. Who adds a NEW entity when a feature introduces one? The gate
   fails loud on unknown entities (`_center_data.py:575`) — so the first new-entity feature will hard-fail regen with
   no instruction anywhere.
3. **Trigger scoping** (attack 4) — absent, and it's the difference between "installed in gustify" and "fires
   everywhere."
4. **No acceptance criterion for the distillation itself.** The pilot had a 7/7 acceptance list; the plan's §5 has
   install steps but no "the skills work when X" — the natural one is: first backfill feature ships end-to-end via the
   skills alone, no ad-hoc improvisation. Cheap to state, expensive to skip.
5. **Honest positives, for balance:** S2/S4/S5/S6 are correctly scoped (refresher commands verified present in
   `docs/site/README.md`; unmapped-phase WARN verified in `check_center_links.py:66-73`); "no hook yet" and "no prose
   templating" guardrails match the pilot's honesty doctrine; intention-first statements ARE first, as the operator
   asked.

---

## MANDATORY MODS (conditions of UPHOLD)

1. **Rename Skill A** off the `-lens` suffix (`/gabe-card` or `/gabe-feature`); add mutual routing lines with
   `/gabe-lens` AND `/gabe-docsite`; either merge Skill B into Skill A as `status`/`backfill` modes or add one
   paragraph justifying two skills against the one-skill alternative.
2. **Demote S3's phase→commit derivation to best-effort with mandatory human confirm** (trailer collisions, 0-trailer
   phases, curated-subset reality); S3 must accept an explicit commit list; derived globs get `TODO(verify-glob)`
   markers and S5 WARNs on them (closes the scaffolded=trusted hole — the gate only catches 0-match, never over-match).
3. **Define the backfill tier**: card + registry + today's-suite junit globs + ANGLES gap note; proof/capture only
   where a current journey covers the feature; add queue disposition states (skip-dropped for phase 8 MIXING et al.).
4. **Fix the denominator**: state that the S6 queue covers the current PLAN.json only, and either narrow the goal to
   that or add a ledger/older-plan source for pre-PLAN features — "most of the app" is currently false advertising.
5. **One schema truth**: suite references/ point at the project validator (`_center_data.py`) as binding; add a
   per-project bindings block (gabe-mockup pattern) and scope `when_to_use`/`paths` to projects with
   `docs/site/center/center.config.json`.
6. **Record the review + price the grind**: per-feature `reviewed:` field readable by the gate; add the backfill
   arithmetic (≈6–9 sessions at 2–3 features/session) and evidence-refresh batching to §5; state the distillation's
   own acceptance criterion (first backfill feature end-to-end via skills alone).
