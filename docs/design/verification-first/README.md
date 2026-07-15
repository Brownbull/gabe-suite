# Verification-First Redesign — the suite's design record

> **Read this before restructuring the suite.** It is the settled context from the
> 2026-07-14/15 design arc: how the suite, its files, and the command center relate;
> why each decision fell the way it did; and the traps already found and priced.
> Human-facing visuals (same content, navigable): [`map-site-files-suite.html`](map-site-files-suite.html)
> (pin/hover the site⟷files⟷suite connections) · [`consolidated-trees.html`](consolidated-trees.html)
> (the three leveled trees) · [`gabe-red-design.html`](gabe-red-design.html) (the TDD beat's design brief).

**Status:** decisions locked 2026-07-15 (D1–D7 below). Landing in slices (plan at the end).

---

## 1 · The one picture

The command center (`docs/site/center/`) is **not a thing anyone builds or maintains — it is a
derived view of the software lifecycle's execution**. Read one object along three cuts:

- **Lifecycle = the producer.** The suite's domain function is DEVELOPING SOFTWARE. Every command
  is justified by its value to the developer building the thing — never by the docs it emits.
  The doc points fall out of the beats as byproducts.
- **Structure = the shape.** One subject spine (Now · Board · Entities · Docs · Testing · Ledger ·
  Releases · Leaf), read along two axes: **entity** (which subject, horizontal) × **altitude**
  (docs high / tests low, vertical — C4's zoom ≈ ISTQB's test levels). Docs and tests are two
  lenses at the same altitude, meeting at the feature card. Time (past/present/future) is an
  **overlay**, never a fourth wing.
- **Growth = the motion.** Ship a feature and it walks the spine by itself: ticket closes, commit
  lands, every view recounts from the same machine sources. Two clocks: the **present is replaced**
  each refresh (can't drift); the **past accrues in git** (never hand-kept).

**The laws that hold it together** (violating any of these has already been tried and reverted):

1. **Anti-curation** — machine sources ASSERT every count/verdict/pass-fail (git, junit, coverage,
   PLAN, PENDING); authored artifacts only TRANSLATE; gaps are NAMED, never faked.
2. **Anti-bloat** — never store what you can derive; no view that needs refresh-discipline;
   no auto-synthesized prose (deriving narrative from git is fabrication, not projection).
3. **The Standing Correction** — never evaluate a command by whether it emits a doc artifact.
   (A prior pass deleted `/gabe-execute` for "authoring no doc" — that is the canonical error.)
4. **Block lies, warn debts** (D7) — harness hooks block dishonest state (a ✅ whose proof doesn't
   exist); everything else (thin coverage, un-walked stations, absent angles) is reported, never
   blocking.

## 2 · Why test-first never landed before (the load-bearing diagnosis)

The operator asked for TDD repeatedly; it never landed. Three structural reasons — keep these,
they explain most of the design:

- **A beat asserts ONE terminal state; TDD has TWO contradictory terminal states of the same
  measurement.** One command cannot end with "the tests fail" and "the tests pass." Inside a
  merged execute, red is swallowed by the act that produced it — the only boundary observable is
  green, i.e. self-graded evidence. Merged execute yields theatre **by construction**. Hence a
  dedicated beat (`/gabe-red`) whose deliverable IS the failing state.
- **The derived-reader loop.** Every test signal in the suite reads files that already exist
  (commit counts, review's file-adjacency, feature's path globs). A *promised* test had no reader;
  a promise with no reader is never written; no reader is ever justified. Broken by giving the
  promise a schema slot (`proof.type: test`, the `Cases:` line) and a reader (execute + the guard).
- **Nothing owned test identity.** Tests were the only durable artifact born with no command
  present (inside "3. Implement", a step with no registry write). DECISIONS get D[N], PENDING gets
  P[N], phases get ids — tests got nothing. `/gabe-red` is the birth moment.
- Bonus orphan: `evidence-doctrine.md:21` already specified "failing-then-passing test (fails on
  base, passes on fix)" and a `proof: test` type — with no schema slot and no reader. The red-green
  contract predates this redesign; it just never grew the branch.

## 3 · The mutated lifecycle (right side)

| # | Beat | Command | Software job | Doc byproduct | Change |
|---|------|---------|--------------|---------------|--------|
| 1 | Scope | `/gabe-scope` (+change/addition/pivot) | premise + phase arc | foundations/architecture (§9–10) · the backlog (§Phases) | unchanged |
| 2 | Plan | `/gabe-plan` | phases, tier call, **proof declared before code** | board rail (PLAN.json) · risk axes · D-refs | **extended:** `proof` gains a TYPE — `test \| visual \| journey` |
| 3 | **Red** | **`/gabe-red [phase]`** | TDD's first half: inspect corpus → REUSE(id, maybe v-bump) vs NEW(id) → write cases → run → **commit the failure** | red cell · `Cases:` line · the corpus's C-ids | **new** |
| 4 | Execute | `/gabe-execute` | build; turn the red set green under the tier cap | checkpoint commits (lens brief) · proof artifacts · narration legs (authored hot) | **extended:** TASK CONTRACT gains a `CASES:` line |
| 5 | Review | `/gabe-review` | price findings (fix cost × defer risk × maturity gate) | PENDING (review-debt lane) | **extended:** NEW CASE / BUMP subjects · owns CASE DRIFT · growth triage (cap 7) on the SAME pricing |
| 6 | Commit | `/gabe-commit` | the chokepoint gate | LEDGER row · results digest | **extended:** C-id check on new tests · `results_out` digest (report at all tiers) |
| 7 | Push | `/gabe-push` | ship: PR, CI, deploy-verify, promote | DEPLOYMENTS row · deployed angle · leaf links | **extended:** terminal-env write = the release trigger (derived) |
| 8 | Walk | **`/gabe-walk`** | record a human walking the build — the witness | walks.jsonl → manual angles + staleness | **new** (~40 lines; records, never judges) |
| 9 | Center | `/gabe-feature <phase>` | the per-feature translation + test-strategy audit | card · curated proof · REVIEWED stamp → Center ✅ | **extended-shrunk:** verdicts RENDERED from review triage; identity from C-ids (path globs retire) |
| 10 | Release | `/gabe-feature release` | — none (that's the finding: it's a MODE, not a beat) | stakeholder showcase (shots + diagrams; video = named gap, D3) | **new mode**; trigger = terminal-env promotion, derived |
| 11 | Router | `/gabe-next` | zero-logic dispatch over PLAN cells | — | **extended:** red-before-execute as a machine predicate; optional `red` cell like `center` |
| — | Advisors | align · assess · debt · health · myopic · roast (+lens/meme/quip/mockup/init/handoff) | quality judgment / design / birth / resume | — | unchanged (outside the beat loop) |

**`/gabe-red` essentials** (full brief: [`gabe-red-design.html`](gabe-red-design.html)):
- Deliverable = **a commit whose declared cases fail by assertion** (`RED:` trailer). Red isn't
  perishable, it's *unaddressable* — the commit gives it an address; anyone can re-derive the
  failure later (`git worktree add … <red-sha> && pytest -k C147`).
- **Three outcomes:** fails by assertion → RED · fails by import/collection → NOT RED
  (non-evidence) · passes on unchanged code → TAUTOLOGY, halt.
- **The stub RETURNS, never raises** — a raising stub makes every case look red and kills the
  tautology guard; a returning stub lets `assert True` get caught.
- **Refactors are not "not TDD-able":** their contract is `GUARD: C091, C147 …` (existing cases
  must stay green) — no fake red, machine-checkable. Genuinely un-testable changes self-skip with
  an enumerated code recorded on the phase.
- **Verification level = the existing tier.** min_cases: 1 @MVP · 3–6 @ent · +fuzz/load @scale.
  No parallel level system.
- Honest cost: net **+10–15% phase time @MVP, +20–30% @ent** (most test-writing time *moves*
  earlier rather than being added). The dominant new spend is the corpus search — which is
  precisely the reuse work the operator wanted forced into the open.

**Test identity:** the id is a token **inside the test's own text/name** —
`def test_clamps_negative_quantity_C147v2()` / `it('C147v2 · clamps …')`. Project-global,
monotonic `C[N]`; a revision suffix (`v2`) bumps when the *claim* changes (a re-run never bumps).
The **corpus IS the registry** (grep allocates; `git log -S "C147"` recovers history; the id rides
junit reports with zero plumbing). Never path-keyed (renames), never phase-scoped (phases archive),
never a registry file (drift). Known cost: a bump renames the test → junit history shows a
discontinuity; the matrix stitches by the shared stem.

## 4 · The center (left side) and the files (middle)

Condensed; the full leveled trees live in [`consolidated-trees.html`](consolidated-trees.html),
the connection map in [`map-site-files-suite.html`](map-site-files-suite.html).

**Site** (`docs/site/center/`): `now` (present: feed · needs-you · freshness) · `board`
(rail **red**→exec→review→commit→push — glyphs, Red/Review collide on "R"; lanes: backlog ·
non-phase · review-debt) · `entities` · `docs/<entity>/<feature>` **accumulator** (handle ·
Gabe-Lens analogy lead · what&why · for-whom · flows · is/is-not · decided · diagrams · derived
changelog) + `docs/foundations/` (decisions · rules · architecture · procedures) · `testing/`
ONE section: `matrix` (index; per test: id · **ever-red?** · status · source · last-run; buckets:
unclaimed · untyped · id-less) + `<entity>/<feature>` **accumulator** (automated angles ·
**manual angles fed by walks** · verdicts rendered from triage · verification changelog · demo
shelf) · `ledger/<change-id>` **ephemeral, 100% derived** · `releases/<id>` (shots + diagrams;
video deferred) · `leaf/` (OSS reports, linked never rebuilt).

**Files:** git (commits + `RED:`/`Cases:` trailers + lens briefs) and the C-id'd corpus are the
machine spine; `.kdbp/` is the authored state (SCOPE · PLAN.md/json · PENDING · **BEHAVIOR.md**
(new template: verify commands · `results_out` · critical_paths) · **walks.jsonl** (new,
append-only) · LEDGER · DEPLOYMENTS · DECISIONS · RULES · PUSH · HANDOFF); center inputs are the
only prose (center.config.json · cards/ · proof manifests+shots). **Never stored, always derived:**
ledger pages, changelogs, regression relationships, ever-red, scope joins, the non-phase lane.

**Naming (locked earlier):** Docs · Foundations · Ledger · Testing (matrix inside; automated +
manual as angle groups on ONE feature page) · the accumulator/ephemeral split; A3 "tabbed subject"
is the working layout (lab: `docs/investigations/2026-07-14-center-layout-lab/`).

## 5 · The decisions (2026-07-15, all locked)

| # | Decision | Ruling + why |
|---|----------|--------------|
| D1 | MVP verification posture | **Report, never gate.** Red at all tiers (min_cases=1 @MVP) + digest/coverage REPORTED everywhere; no new gate can block an MVP ship. Verification visible on every development without slowing delivery. |
| D2 | Manual-walk witness | **`/gabe-walk` added** (~40 lines, append to walks.jsonl: who·when·result·evidence). Justified as a verification act — the one input with no machine source. NEVER-walked still renders red until the first walk. |
| D3 | Release-page media | **Shots + diagrams only in v1; video custody deferred** to the first real release. (D146 — video machine-local, never committed — stays intact.) |
| D4 | BEHAVIOR.md | **Template ships.** Load-bearing ×3 (verify commands · critical_paths hotfix arm · `results_out`). Greenfield gets `results_out` default-on at init; brownfield opt-in. |
| D5 | C-id adoption in existing corpora | **Backfill sweep** (operator's call over the lazy rec): mechanical-only, one commit per repo, `.git-blame-ignore-revs` registered, **no fake reds** — backfilled tests get an id but their ever-red stays honestly empty. |
| D6 | Remaining TDD recs | **Ratified:** red-as-commit (`RED:` trailer) · case-drift lives in review (judgment-shaped checks in judgment-shaped beats; commit keeps only deterministic greps) · growth findings cap 7 · `/gabe-feature` survives shrunk-in-place (revisit at n=3). |
| D7 | Hook enforcement | **Block lies, warn debts.** `plan-proof-guard` (PostToolUse on PLAN writes) blocks a ✅ tick whose proof doesn't exist on disk/git — every tier. `pre-checkpoint` (already fires on `git commit`) gains the deterministic C-id/case checks as warnings @MVP. Enforcement prose then DELETED from specs (leaner skills — the July-7 research's "hooks are the enforcement layer," finally implemented; PLAN.json is the tasks-JSON from that pattern). |

Standing red flags (deliberate, do not "fix" silently): the **human-witness gap is NOT closed** by
red/C-ids/release pages (a fresh-context evaluator is an agent; only `/gabe-walk` records a human);
architecture/procedures are a **content gap** (render honest absence, never seed prose from
machine state); the generator concentrates logic (D7-promotion to the suite was accepted as ripe
at n=2 — it must return to suite-doctor's radar).

**Tripwire:** if `/gabe-red` ever prints a summary a developer reads instead of a failure a
developer must fix, it has become ceremony — delete it.

## 6 · The landing plan

Suite-first (this repo), install regenerates `~/.claude`, doctor must be CLEAN per slice.

1. **Slice 1 — the red spine:** `skills/gabe-red/` (SKILL.md + references/red-spec.md) ·
   plan-spec `proof.type` · execute-spec `CASES:` line + narration pointer · `next.mjs` optional
   `red` cell + red-before-execute routing (+fixtures) · version bumps · install · doctor.
2. **Slice 2 — the enforcement arm (D7):** `plan-proof-guard` script · extend `pre-checkpoint.sh` ·
   wire both in `templates/gabe/hooks.json` · delete the superseded enforcement prose.
3. **Slice 3 — the small set:** `skills/gabe-walk/` · `templates/BEHAVIOR.md` · review's NEW
   CASE/BUMP + growth triage · commit digest emission · feature rendered-verdicts · release mode.
4. **Slice 4 — cascade:** CLAUDE.md/README/help rows · COMMS · final doctor.
5. **Slice 5 — app repos, ON OPERATOR SIGNAL (sessions stopped):** **gastify FIRST, in chunks,
   verified progressively** (C-id sweep · red on its next phase · center re-render), THEN
   propagate to gustify. Sweeps: mechanical-only, one commit per repo, blame-ignored.

## 7 · Provenance

Designed 2026-07-14/15 across research workflows recorded in this session's artifacts; grounded in
line-verified reads of the binding specs (plan-spec, execute-spec, review-spec, gate-spec,
evidence-doctrine, feature-spec) and the 2026-07-07 workflow-enhancement research
(`docs/investigations/2026-07-07-workflow-enhancement/` — hooks as the enforcement layer).
The center's structure decisions trace to the 2026-07-10 testing-command-center investigation and
the 2026-07-14 layout lab.
