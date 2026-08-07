# Gabe Suite — Project Context

Development suite for Claude Code. A growing collection of skills, templates, hooks, and docs that transform how you understand, review, decide, and ship. One of the skills inside this suite is called `/gabe-lens` (cognitive translation) — do **not** confuse the suite name (Gabe Suite) with that skill name (Gabe Lens).

**Repos:**
- Brownbull: https://github.com/Brownbull/gabe-suite
- khujta: https://github.com/khujta/gabe-suite

**Local folder:** `gabe_lens/` (legacy name; rename deferred — safe to rename to `gabe-suite/` later).

**Harness:** Claude Code only. Codex support was dropped 2026-07-09 (operator decision); the suite installs to `~/.claude/` exclusively.

## Project Structure

```text
gabe-suite/                   # current local folder: gabe_lens/ (rename deferred)
  skills/                     # ONE SKILL PER CAPABILITY (B2 skills-only migration)
    gabe-<name>/
      SKILL.md                # lean core (≤200 lines): frontmatter + E1–E7 pointer +
                              # summary + output contract
      references/             # the binding deep spec, loaded on demand
      scripts/                # deterministic helpers (e.g. gabe-commit/scripts/size-budget.sh)
  templates/
    *.md, *.yaml, *.json      # .kdbp/ init files, including architecture-principles.md
    tier-sections/*.md        # tier trade-off section files + rubric + index
    mockup/                   # mockup and Storybook workflow templates
    debt-patterns/            # decision-debt pattern catalog
  prompts/*.md                # /gabe-scope prompt library
  schemas/*.json              # JSON Schemas for scope-session + scope-references
  scripts/suite-doctor.sh     # drift check: repo vs ~/.claude
  tests/hooks/run.sh          # hook/router fixture harness — run after ANY enforcement-layer edit
  assets/                     # Images for README
  docs/                       # User docs (start at docs/WORKFLOW.md)
  docs/prisms/<slug>/         # AUTHORED prism pages (prism.json + body.html) —
                              # content, not machinery; the machinery is the skill's.
                              # docs/prisms/_fragments/*.html are the embeddables.
  README.md                   # Public-facing documentation
  CLAUDE.md                   # This file
  install.sh                  # Install suite to ~/.claude/
```

There is no `commands/` directory: it was retired in the B2 skills-only migration (2026-07-09) after the lifecycle dry-run passed via skills alone. Each skill IS its command — the skill name gives the slash invocation (`skills/gabe-plan/` ⇒ `/gabe-plan`).

## User Profile

`~/.claude/gabe-lens-profile.md` stores the user's chosen cognitive suit for the `/gabe-lens` skill. Created by `/gabe-lens calibrate`. Default suit (Spatial-Analogical) is used if absent. File name stays skill-level because it belongs to Gabe Lens, not the whole suite.

## Conventions

- One skill per capability: `skills/<name>/SKILL.md` (lean core, ≤200 lines) + `references/` (the binding deep spec) + optional `scripts/`.
- Frontmatter: `description` + `when_to_use` (trigger sentence; combined ≤1,536 chars), plus flags where they apply — `context: fork` (satellite analyses), `agent: Explore` (read-only runs), `disable-model-invocation: true` (human-initiated only), `user-invocable: false` (background knowledge), `paths:` (auto-trigger globs).
- The execution contract E1–E7 is stated ONCE in `skills/gabe-docs/references/execution-contract.md`; every SKILL.md carries a one-line pointer, never a pasted copy.
- Provenance lives in git, not in runtime files — no migration notes, dates, or "moved from X" headers in skills (see the ledger rationale in the migration log).
- Architecture Principles AP1–AP13 live in `templates/architecture-principles.md` and are advisory context for `/gabe-assess`, `/gabe-health debt`, and `/gabe-review`.
- The Archetype Map (Prototyper/Builder/Sweeper/Grower/Maintainer) lives in `templates/archetype-map.md` — advisory context for `/gabe-roast` (canonical perspectives) and `/gabe-assess` (maturity posture-mix); a reading of the existing maturity axis, not a new level system.
- Suite changes land in the REPO first; installs regenerate via `./install.sh`; `scripts/suite-doctor.sh` makes drift visible (incl. the suite invariants: hook harness green, version/count parity, portability lint, docsite staleness). Never patch `~/.claude` in place.
- **Command costs** (stated so sessions pick the targeted path — the one context effect the 2607.27250 ablation proved, Table 2): `suite-doctor.sh` ≈ **2–4 min** (re-runs every `tests/*/run.sh` battery incl. two headless-browser harnesses — when iterating on ONE battery, run that battery's `run.sh` directly); `install.sh` ≈ 5 s; `tests/hooks` ≈ 3 s; `tests/register` < 1 s; `tests/case-thread` < 1 s; full center regen (`docs/center/generators/refresh_suite_center.sh`) is browser-gated (**minutes**) — for a single page, regen that page only.
- A deterministic script that will run against real project data ships only after a dry-run against a COPY of that data — record the run's numbers in the commit message (meta-review P1: template-derived fixtures validate the template, not reality).
- Every hook/checker ships fixture cases in `tests/` proving it can both FIRE and stay silent; behavior edits update the battery in the same commit (`tests/hooks/run.sh` — meta-review P2/P4: a checker that cannot fail is non-evidence, and fixtures that live in session transcripts protect nothing).
- The **evidence navigator** is shell machinery, not a page: `templates/center/shell/assets/evidence-nav.{js,css}` renders one entity's workflows (map left · capture + provenance right) from a committed CENSUS at `docs/site/center/workflows/<entity>.json`. The census is an ACCUMULATOR; its drift is checked by `templates/center/generators/check_workflow_drift.py` (report-never-gate) and routed by `/gabe-review` (detects on the diff) + `/gabe-pulse` S8 (nags on deferred capture debt). Layout law and wiring contract: the asset's header + `templates/center/shell/README.md`.
- **The in-flight projection** is beat-tail machinery, not a page: `skills/gabe-cc-update/scripts/write-inflight.py` derives `docs/site/center/inflight.{json,js}` from PLAN.json + git (declared entities from the plan record · touched entities path-derived · no wallclock, byte-identical on an unchanged tree); the E8 beat tail refreshes it, `board.js` reads it at view time via the script sibling (file:// kills fetch). Declared-vs-touched drift is priced by `/gabe-review`'s ENTITY DRIFT subject. Battery: `tests/inflight/run.sh`.
- **This repo never carries `.kdbp/`** (operator ruling 2026-07-22, R8 in the [design record §5 addendum](docs/design/verification-first/README.md)): the suite is built with the advisory arm only — suite-doctor (runs every `tests/*/run.sh` battery) + /gabe-roast + adversarial verify + dry-run-on-a-COPY numbers in commit messages. Do not propose dogfooding the KDBP lifecycle here.
- Size budget: 800 lines is a CODE budget, report-never-gate — state the numbers in any commit that grows a file past it; `references/` deep specs sit outside the cap (ruling R9, same addendum, with the deferral record for the two over-budget generators).

## The Gabe Register (project-scoped trial)

`.claude/output-styles/gabe.md` (movement register: action → consequence → next move; comptroller position-check on direction changes; DECISION blocks with mandatory defer-triggers; actors·elements·effects explanation format — naked chain, cast cards, risk dots) + `.claude/register-core.md` (4-rule payload re-injected by `.claude/settings.json` hooks on every prompt and after compaction). Canary battery: `tests/register/run.sh` — invariants pinned, mutation-proven. KILL/WIDEN conditions live in the style file's header; widen machine-wide only after it survives here. Full scope record: `docs/investigations/2026-07-30-gabe-suite-diet/`.

## Capabilities (28 skills)

| Skill | Version | Purpose |
|---|---|---|
| **gabe-artifact** | 1.3.1 | House chrome for published Artifacts — left-anchored content, one cog panel top-right, font roster + three suite skins (Catalog/Blueprint/Mission Console, light+dark), iconed section title pills (condensed grotesque, caps, the page's ONLY distinctive title face), a 12px legibility floor measured at the smallest base, H4 motion-first; 36-check render gate + 19-case chrome battery + a generic motion gate with a 6-case battery; two pattern libraries (25 motion + 31 static) |
| **gabe-cc-init** | 1.2.4 | Brownfield command-center adoption — archive-never-delete init, machine-ranked shortlist, one section per run at human speed, walk-recorded approval; tracker lives outside PLAN.md (human-initiated only) |
| **gabe-assess** | 1.3.0 | The direction guard — rapid impact assessment (blast radius, maturity scope, prerequisites) + the boundary check absorbed from gabe-align; auto-trigger LIVE: direction-guard.sh (UserPromptSubmit, KDBP projects) injects the steer rule → /gabe-assess brief before building |
| **gabe-commit** | 2.7.0 | Commit quality gate — deterministic checks incl. size-budget + the checkpoint task-record trailer (scripts/checkpoint-trailer.sh: a `Task:`-footered message must carry valid `Cases:`/`Class:`), triage, simplify tier, docs-audit; optional results_out digest, path or list (reports every tier, gates none) |
| **gabe-docs** | 1.3.0 | Documentation standards + diagrams library + the suite execution contract incl. the E8 beat tail (stated once, all six spine skills point at it) (background) |
| **gabe-docsite** | 1.1.0 | Publish docs onto the project's HTML site — renders INTO a command center's shell when one exists (nav.json seam, one skin, docs.html as the Docs station), extracts four reference classes so outbound chips and inbound 'Written up in' lines are derived in one pass, and takes the pre-render diagram path when a renderer probes clean |
| **gabe-cc-entity** | 1.0.1 | Entity-context reader — assembles one entity's slice (code map + registry + bindings) into a context pack from the center's committed data (archmap/adoption/config), joined on slug; a DATA lens not a per-entity skill (D7); brief or `--json`, plus `list` mode |
| **gabe-execute** | 2.6.0 | Phase execution with tier cap, escalation gate, checkpoint commits; the task RECORD is a commit-message trailer (`Cases:`/`Class:` beside the `Task:` footer, validated by /gabe-commit — the printed TASK CONTRACT retired 2026-08-07 after going 0-for-19) + `Reach:` (recorded, never binding — scoping to it is a defect) + case-scoped verify; narration legs authored hot |
| **gabe-cc-update** | 1.7.0 | Command-center feature coverage — card/diagrams/narration over machine facts; verdicts RENDERED from review triage (authored fallback); closes the PLAN `Center` cell on review; status, backfill, curate, release; bootstrap pointer → /gabe-cc-init |
| **gabe-handoff** | 2.1.0 | Session handoff — paste-able resume prompt + KDBP state sync |
| **gabe-health** | 1.2.0 | The suite scanner, three lenses (fork/read-only) — codebase health (god files, churn, coupling), decision-debt (absorbed from gabe-debt, AP citations), and the ask-first skill-estate sweep (promote/archive by usage); LIVE production-push gate via /gabe-push Step 3.7 |
| **gabe-help** | 1.2.1 | Context-aware guide + the P14 cross-project tool registry; Full Suite Catalog is GENERATED from skill frontmatter (scripts/gen-help-catalog.py, run by install.sh) |
| **gabe-imagine** | 1.4.0 | Understanding carried visually, not by prose — the I0–I5 flow (dissect · propose+ASK · index · produce · gate) yields INSTRUMENT pages: one variable model + consolidated hover-morph variable bar, shape-leads/mechanism-follows ordering, formulas as badged equations, floors with directed wires, ≤150 surface words incl. lede+handle. Six grammars (loop-grid new; its pattern page a named gap); the representation-lab move (contested representation ⇒ lettered live chooser artifact, runners-up stored); formula free-variable lever census; absolute-scale + time-anchored motion laws. **Two targets:** `disk` (default) · `artifact`. Gates: contract + fit + motion + the render probe (data-probe hooks, 10-case battery) |
| **gabe-init** | 2.3.2 | Project setup — `.kdbp/`, the 9 KDBP hooks, project type, maturity (human-initiated only) |
| **gabe-lens** | 2.4.0 | Cognitive translation — analogies, maps, constraint boxes, handles |
| **gabe-meme** | 1.2.0 | Oblique-meme generation — persona-matched visual metaphors via memegen.link, verified PNGs, punch-up; + surface-wit mode (absorbed gabe-quip): witty titles/hooks/callouts for rendered HTML surfaces, proposes never rewrites |
| **gabe-mockup** | 2.1.0 | The lift SOP (L0–L4) over a per-project mockup manifest; Storybook + legacy HTML modes |
| **gabe-myopic** | 1.2.0 | Short-sighted-user walkthrough — foresight traps, overwhelm, recall, no-undo (fork); findings labeled M[N], never C[N] |
| **gabe-next** | 2.4.1 | Zero-logic lifecycle router over PLAN.md state — optional `Red` (routes /gabe-red BEFORE Exec) → Exec→Review→Commit→Push + optional `Center` (routes /gabe-cc-update) |
| **gabe-plan** | 2.7.0 | KDBP planning + per-phase tier decision (MVP/enterprise/scale); `proof_type` (test|visual|journey) declared at plan time; optional `Red`/`Center` columns (Red retrofits seed ⬜ only where Exec is ⬜) |
| **gabe-pulse** | 1.3.0 | Read-only completeness sweep — ten deterministic signals in four bands, plus the **ANGLE family** (`scripts/angles.py`): SEVEN evidence-backed triggers naming which satellite would find something now (S8 = workflow-census capture debt), printed as ONE line at the end of every spine beat so the 15 manual-only skills stop depending on memory; reset patterns are record-tight (prose collisions measured 2026-08-07), the diff source sees past `.kdbp` bookkeeping commits, S1's command is pasteable verbatim; decay record, stated kill condition, 22-case battery |
| **gabe-push** | 2.5.0 | Push, PR, CI watch, promotion — env-aware shipping via `.kdbp/PUSH.md`; terminal-env/--epic pushes run the PRODUCTION GATES (Step 3.7: /gabe-health three-lens scan, findings presented, ONE BLOCKING proceed/hold ask that mints `.kdbp/.push-gate-ok` — the machine-wide push-gate-guard hook fails a raw terminal push closed without it); terminal-env ship prints the /gabe-cc-update release pointer |
| **gabe-red** | 1.8.0 | TDD's first half as a beat — inspect the corpus, declare cases (C-ids in test names, corpus = registry), prove RED by assertion, commit the red checkpoint; GUARDs for refactors, enumerated skips; FOUR red outcomes (RED-WRONG-REASON + the FLIP test) + async-boundary rules for journey cases; writes the phase's `Reach:` record (two-arm graft callers+grep, `graft@sha` stamped); scripts/prove-guard.py re-proves a guard can still FAIL (mutate → assert red → restore), feeding the center's named-vs-guarded distinction; scripts/case-thread.py observes the red→green thread at both ends (execute entry assert-red, execute-finish/review assert-green + green@sha stamp; Review ✅ without the stamp BLOCKED by plan-proof-guard) |
| **gabe-review** | 1.15.0 | Code review — risk pricing, confidence scoring, plan alignment, triage; case-estate subjects (NEW CASE/BUMP/DRIFT, reserved C-ids) + absent-angle GROWTH triage (cap 7) + WORKFLOW DRIFT (census vs diff: census-lag · claim-drift · capture-debt) + REACH DRIFT (unreached · unused reach, vs the phase's `Reach:` record) + STALE ANCHOR (5c on PENDING: cited files moved past a row's `Verified` sha) on the same pricing |
| **gabe-roast** | 1.1.0 | Adversarial gap review from a required perspective (fork/read-only) |
| **gabe-scope** | 2.1.1 | Scope authoring — SCOPE.md (stable premise + §Phases arc) for a new project |
| **gabe-scope-change** | 2.2.0 | Scope evolution, one entry point — classifies pivot vs addition; additions execute inline (absorbed gabe-scope-addition), pivots route to the safety-flagged gabe-scope-pivot |
| **gabe-scope-pivot** | 2.1.0 | Direction-change scope rewrite (human/router-initiated only) |

## Archived skills

Decommissioned-not-deleted skills live in `skills/_archive/` (outside the install/doctor glob) with a
README covering why + how to reinstate; rulings in [docs/design/trim-ledger.md](docs/design/trim-ledger.md). Currently: **gabe-teach** + **gabe-arch** + **gabe-scope-addition** (archived 2026-07-15 —
2,740 lines serving ~2 observed uses; trim-matrix audit) + **gabe-walk** + **gabe-quip** + **gabe-align** +
**gabe-debt** (archived 2026-07-30 — operator rulings on the skill-map artifact: walk lost its why;
quip/align/debt absorbed into gabe-meme/gabe-assess/gabe-health). `~/.claude/gabe-arch/` user state is never
touched by decommission.

## Companion estate

`skills/dev-conventions/` — the operator's cross-project conventions (NOT a suite capability: no
`gabe-` prefix, no capability row, outside the doctor's parity globs). Carried in the repo so a
reinstall on a fresh machine lands it; installed to `~/.claude/skills/dev-conventions/` by
install.sh. Origin: the 2026-08-04 always-on diet (move №2) — content relocated from
`~/.claude/rules/common/`, loaded on demand only.

## Workflow Docs

- **[docs/design/verification-first/README.md](docs/design/verification-first/README.md) — the suite's design record (read BEFORE restructuring the suite):** the one-picture model (lifecycle produces · structure shapes · growth accrues), the mutated lifecycle incl. `/gabe-red` + `/gabe-walk`, the C-id test-identity scheme, decisions D1–D7 (block-lies/warn-debts hooks, report-never-gate MVP), and the landing plan.
- [docs/workflows/README.md](docs/workflows/README.md) — quick chooser.
- [docs/workflows/greenfield.md](docs/workflows/greenfield.md) — new app from idea to first phase.
- [docs/workflows/brownfield.md](docs/workflows/brownfield.md) — existing codebase adoption.
- [docs/design/suite-backlog.md](docs/design/suite-backlog.md) — considered-but-not-built, with the evidence that made each interesting (read before proposing suite work).
- [docs/suite-state-audit.md](docs/suite-state-audit.md) — runtime inventory audit (see its Updated line for currency).

Workflow docs are installed locally under `~/.claude/docs/gabe-suite/`.

## Adding a New Skill

1. Create `skills/<skill-name>/SKILL.md` with frontmatter (name, description, `when_to_use`, metadata.version) — lean core ≤200 lines with the E1–E7 pointer; deep spec goes in `skills/<skill-name>/references/`.
2. **Handshake walk:** read the ADJACENT beats' specs for seam contradictions — what this skill emits, do its neighbors accept, and vice versa? (Meta-review P5: the gate once blocked the very commit /gabe-red must produce; two specs disagreed on where `proof` lives. Seams break where each spec is written from its own seat.) Same walk applies to any spec change that alters a beat's inputs/outputs.
3. Add it to README.md and CLAUDE.md (the gabe-help catalog is generated at install).
4. Run `./install.sh` (≈5 s) then `scripts/suite-doctor.sh` (≈2–4 min, all batteries; must be CLEAN — the doctor also checks version/count parity, so a missed CLAUDE.md row fails here).
5. Update install/validation tests if the inventory count changes. (`install.sh` auto-discovers `skills/gabe-*/` — no list maintenance.)
