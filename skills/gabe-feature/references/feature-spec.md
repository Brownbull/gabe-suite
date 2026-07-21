# Feature spec — the binding intentions behind /gabe-feature

> The one deep home for the card contract. SKILL.md carries intention + flow
> and points here; nothing below is restated there. Angle ids: `pytest` ·
> `vitest` · `journey` · `deployed` · `motion`. Diagram headings (exact):
> `# DIAGRAM USERFLOW` · `# DIAGRAM DATAFLOW` · `# DIAGRAM WORKFLOW` — any
> other heading renders nowhere and the gate flags it. One card renders TWO
> pages: the cookbook page carries the story, the feature page the testing.

The FORMAT authority is the project's validator (`scripts/_center_data.py` — it
fails loud on referential errors: unknown entities, unmatched globs, missing
card sections). This file records the INTENTIONS the validator cannot check,
plus the bootstrap for new projects. Never duplicate the schema here.

## The editorial line (the whole system in two sentences)

**Machine sources assert; authored artifacts translate.** The config maps
(which sources belong to which feature), the card explains (what/why/whom/
is/is-not/decided), the narration describes (what the evidence shows) — none
of them may ever state a count, a pass/fail, or a coverage number: those come
only from junit / run-status / coverage / OpenAPI at build time, so they can
never drift from the truth.

## The card, section by section (what GOOD looks like)

| Section | Intention | Trap to avoid |
|---|---|---|
| HANDLE | one line a stranger repeats correctly (≤14 words) | feature-name restating |
| WHAT & WHY | before → after → why it matters; close with ONE physical-analogy line (house voice) | implementation detail; multiple analogies |
| FOR WHOM | who feels it, in their words | "users" |
| FLOWS | the user flows it lives in; journey links resolve at render | route lists |
| IS / IS NOT | shipped behaviors / deliberate non-goals + known gaps, plainly | IS NOT as excuses; hiding gaps |
| DECIDED | D-refs + one-line rulings that shaped it | re-arguing decisions |
| ENTITIES | ids from config `entities[]` (validator enforces), ORDERED BY PRIMACY — the FIRST entity is the feature's home cluster on the hub/docs groupings, and it must be the MOST SPECIFIC entity the feature is about ('user' is almost never primary; a photos feature homes under photos, not under the person holding the camera). The list MAY grow: a genuinely new domain entity is added to config `entities[]` (id + label + a NEW distinct color) in the same authoring pass — part of the card review; the validator's hard-fail is the prompt, not a wall | 'user' first by default; inventing entities inline; splitting hairs (a variant of an existing entity is that entity) |
| ANGLES | one REASON line per absent angle ("not yet mapped/run", never 'untested'-sounding words), ENDING IN A VERDICT: either "Worth growing: <what adding tests would buy, at what cost>" or "Nothing (further) to gain: <why>". The verdict IS the summary label — the renderer replaces the generic ABSENT chip with **GROWTH OPPORTUNITY** (amber, pops; on "Worth growing:") · **SETTLED** (quiet grey; on any "nothing … to gain" phrasing — plain / more / (further)) · **VERDICT MISSING** (red — the reason has no such call, fix the card); a growth angle's body also gets a generated angle-typed "grow it →" next-action (the HOW to the reason's WHAT — the reason carries the specifics). **Verdict precedence (D6/ASK-4):** when a review triage outcome exists for the angle (review-spec Step 3.4 — implemented case / PENDING row / dismissed-with-reason), the verdict is RENDERED from that outcome and the card only translates; the hand-authored verdict is the fallback for angles no review has priced; VERDICT MISSING = neither exists. Notes on partial angles render as footnotes | justifying instead of recording; reasons with no call (renders red) |
| DIAGRAM USERFLOW / DATAFLOW / WORKFLOW | flowchart / sequenceDiagram / stateDiagram-v2 — types, node shapes, and the change-highlight rule are BINDING per `gabe-docs/references/docs-spec.md` §Mermaid (shapes-per-operation table + `classDef changed` / sequence `rect` blocks; validate highlight targets — mermaid silently ignores misses) | drawing the whole system; highlighting everything |
| REVIEWED | date + who, stamped ONLY after the human reviewed the BUILT pages — the stamp flips the board's fifth lifecycle cell (L · card) green and clears the rail's card-review filter; every lifecycle cell on the feature page shows its trigger command, struck through once done. The SAME stamp closes the PLAN loop (E5): the phase's `Center` cell → ✅ in PLAN.md + PLAN.json, so `/gabe-next` stops routing to `/gabe-feature` for it (SKILL.md §Modes step 5) | stamping a TODO-free draft; leaving the PLAN Center cell ⬜ after review |

## Post-trial card additions (transaction trial, absorbed 2026-07-21)

Binding alongside the table above; the five-tab section inventory lives in the shell README.

- `# LENS` — gabe-lens fields (handle · analogy · is · is not · decides · map · confuse ·
  limits) LEADS the feature page; the full card folds behind `details.more`.
- `# CODE` — the Code tab's authored intro, rendered at the END of the tab (the machine half —
  endpoints · code map · data model — renders from archmap, never from prose).
- `# RISKS` — structured 4-field grammar: `SEV · status · Kind · what is at stake — detail`
  (three-field lines still parse; a missing stake renders as a named gap). A severity with no
  consequence is a number nobody can argue with.
- `# NOT CARRIED FORWARD` — dropped legacy claims with one-line reasons (visible on the page).
- `# ANGLES` — per-kind INTENT only, inside the section's ⊕ toggle; hand-written counts are
  FORBIDDEN (the card says WHAT FOR; the machine says HOW MUCH).
- `# REVIEWED` supersede flow — a material rewrite after a walk flips the tracker back to
  `awaiting-approval`: **a walk approves a SCOPE, not a slug.**
- Feature pages are generated from registration data (config + registry + card + machine
  sources) — per-entity page code is a defect.

## The verification changelog (machine — but fed by commits[])

Run results are replaced on every refresh BY DESIGN; the durable memory is
git, rendered: each testing page carries a verification changelog (per
registry commit: what it did to the test surface), and suite sections say
when each file entered the corpus. This makes `commits[]` double as the
changelog SOURCE: list every commit that grew or reshaped the feature's
tests — not just the headline product commits. A pruning conversation years
later starts from this record ("these tests exist because…"), never from
run counts.

## Narration (proof manifests)

Authored by the session that creates the evidence, in the manifest's
`narration` block: `story` (2–3 sentences, anyone), `capture_story` (what the
video shows), `legs` (one plain sentence per leg — each leg is a claim, its
shots are the proof). Describes, never asserts. Video custody: capture output
is machine-local and never committed (stable name `latest.mp4` via the journey
runner); committed proof = the curated shots. The pages state both.

## Backfill tiers

- **full** — recent work: evidence exists or is one run away. Everything.
- **card-only** — history: registry + card; ANGLES carry why evidence isn't
  demanded of the past. No fake proof, ever.
- **skip** — dropped/obsoleted work: one line in `backfill_dispositions`
  with the reason. A skip with a reason beats a hollow page.

Queue denominator honesty: `next_feature.py` covers the CURRENT PLAN.json
generation; prior-plan phases are a separately-agreed pass.

## Bootstrap (a project without a center)

Owned by `/gabe-adopt` (ruling R7 — its own skill, its own spec): `init` archives existing
docs (never deletes) and bootstraps the shell from suite `templates/center/` — whose
first-ever run IS the generator promotion (port the reference implementation, gustify's
`scripts/_center_*.py` + `refresh_center.sh` + `check_center_links.py`, into the suite as
templates); `rank`/`section` then ingest the back-catalog one approved section at a time.
This spec owns the FORWARD track only: covering shipped phases in a center that already
exists.

## Release (the stakeholder showcase — a MODE, not a beat)

`/gabe-feature release [--since <deployments-row>]` renders `releases/<id>.html` for
stakeholders: the covered set = phases whose `Center` cell went ✅ since the last TERMINAL-env
row in `.kdbp/DEPLOYMENTS.md` (the trigger is derived — `/gabe-push` detects the terminal-env
ship and prints the pointer; staging ships fire nothing; projects without a center: silent skip).
Contents v1 (design record D3): curated proof shots + diagrams + each feature's summary/narration
— **video slots render as named gaps** ("capture available on the build machine") until video
custody is decided at the first real release. Pure re-runnable join over committed data: no new
state, no config key, nobody is asked "is this a release?".

## Wave-2 notes (recorded, not built)

gabe-commit runs the crawl gate when `docs/site/center/**` is staged · KDBP
schema enrichment (D6) absorbs the feature registry · diagram library
(`center/diagrams/*.mmd` bases + per-feature highlight refs) when a second
feature shares a topology.
