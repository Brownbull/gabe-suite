# Handoff — Gabe Universe: schema homing → coverage-class fix map → tiers (in that order)

> Generated 2026-08-27 · branch `graft-adoption` · HEAD after this commit · no `.kdbp` (suite advisory arm).
> Durable state: `~/.claude/projects/-home-khujta-projects-gabe-lens/memory/gabe-universe-station.md` (+ `febe-trace-model.md` for the gap audit).
> This file is the paste-able resume prompt for the next session.

## Resume prompt

Continue the **Gabe Universe** station on branch `graft-adoption` (suite local, UNPUSHED; gustify `graft-pilot` local at `7628b19e`+, UNPUSHED; push only on operator word). No `.kdbp` here by design. Regen recipe: `cd docs/design/codebase-graph-consolidation/universe-build && bash regen-example.sh`; edit `parts/*` + `assemble.py`, never the generated page; proofs solo-sequential (`verify-*.mjs`), gates via the scratchpad system-chrome shim (memory `artifact-gate-chromium-wsl`).

READ FIRST: memory topic `gabe-universe-station.md` (tail: journeys batch · model census · current-step selection · the tiers proposal), `febe-trace-model.md` (the gap audit), then `docs/design/codebase-graph-consolidation/DISCLOSURE-TIERS.md` (tabled proposal + the coverage-value table) and `universe-build/BACKEND-JOURNEYS.md`.

STATE
- Landed (suite, local): `2de272a` workflow/backend journeys + step note + walk pin · `497b535` model census (config = ownership never existence; S11 + cc-init rail) · `12d133a` current-step selection + themed legend tips · docs `de25da7` gap audit · `a316bd7`/`1c9a992` Disclosure Tiers proposal. Gustify `graft-pilot`: `bddf50f5` (census re-home, 21→2 unclaimed) + `7628b19e` (shell).
- Artifacts (republish by `url:` — scratchpad sources are wiped): Trace Anatomy `a58e4089-789b-4ef6-932a-0c27b7614a30` 🔬 (gap audit, 7 classes, each fix tagged config/additive/change-in-place) · Disclosure Tiers `5e3ef87a-1c2c-48fd-9500-3e91a27e617e` 🪜 (TABLED) · Field Guide `9ede2a68…` 🗺️ · Backend Journeys `49d33967…` 🧭.
- Batteries green at HEAD: gabe-universe static 462 + render · workflows 21/21 · d2w 12/12 · jrnstep/jrntabs/backend-journeys/dblclick/search PASS · levels 62 · orm-access 52 · pulse-angles 41 · arch-graph 193 · center 133/0. Decayed (owed re-pin): verify-{panels,walk,explore,routes} fail at HEAD's parent too.

THE OPERATOR'S ORDER OF WORK (2026-08-27 ruling) — tiers are TABLED until 1 and 2 are done:

1. **SCHEMA HOMING.** Measured on the committed map: **8 schemas whose ONLY connections leave their entity** — allergen homes 7 (`DietaryProfileInput`, `HouseholdFormatInput`, `NotificationPreferencesInput`, `PrivacyPermissionsInput`, `UserFormatInput` → nest only into auth's `SetupCompleteRequest`; `ExplorationPreferencesInput`/`Patch` → settings), progression homes `AccountExportResponse` → legal-consent. Asks: (a) find every such case (done above — verify + list cross-cluster too, not only cross-entity); (b) explain WHY (the config's `schemas` file lists home `apps/api/schemas/preferences.py`-style files under allergen; `nests`/`consumes` edges cross entities) and propose the correction — re-home by consumer (e.g. into auth) via config and/or a homing rule in the emitter ("a schema whose only consumer is one entity belongs to it"); (c) a DISPLAY change mirroring the functions' critical fold: nested-only schemas fold into their parent with a COUNT BADGE (like the endpoint METHOD / function ROLE badges) — `SetupCompleteRequest` would wear "6"; badge candidates by nests fan: ProfileSummaryResponse 7 · SettingsResponse 7 · PreferencesSummary 6 · SetupCompleteRequest 6 · MeResponse 5 · RecipeDetailResponse 5. Iterate-before-implement: draft → "land it".

2. **COVERAGE-CLASS FIX MAP.** From the Disclosure Tiers table "What the map holds nothing of": DROP every LOW row except AI prompts (styles/assets, infra/CI, observability, i18n, CLI scripts — never nodes). For EVERY remaining row (HIGH/MED + AI prompts) answer, per class: WHY is it not captured today · WHERE the fix lives (graft index? `_a3_code` AST pass? `_a3_graft`? `_a3_graph` C4 builder? `_a3_levels`? `center.config.json`? the station adapter?) · and for each workflow/journey whose node SEQUENCE changes, show BEFORE → AFTER (e.g. cook: `POST …/complete → complete_session → …` gains `→ bus.publish → recompute_* → SkillProgress/NodeProgress`). Deliverable: a GabeArtifact table + the same in the design doc. Evidence base: the gap audit (`febe-trace-model.md` 2026-08-27 entry, `tasks/wmv2scat2.output` in the old scratchpad is gone — re-derive from source + `Trace Anatomy`). This decides how the fixes integrate.

3. **TIERS — after 1 and 2.** The operator will propose the CONTROL approach (no obscure buttons); the path-role ladder proposal + 12 decisions stand in `DISCLOSURE-TIERS.md`.

RUNBOOK + GOTCHAS: absolute paths in chained proofs (relative `cd` chains skipped the battery twice) · `git -C` when the cwd drifted · a runtime script loader still trips the string link gate — seed the file · usecase core clusters a handler's fns WITH its endpoint (re-hide after goto in proofs) · `__d2wBand()` returns a colour int · popups born inside a fixed-height panel must be body-level + fixed.

## State snapshot
- Landed: through the tiers proposal docs; tree clean.
- In-flight: none. Push (both repos) on operator word.
- Owed: proof re-pins (panels/walk/explore/routes) · the 2 admin-lane models' home · gastify propagation.
