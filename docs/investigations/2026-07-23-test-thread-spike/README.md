# Test↔Code thread spike — the analysis record

**Question (operator, 2026-07-23):** the entity Tests tab is confusing; consolidate
all testing app-wide with entity filtering; and link tests to code elements
(endpoints, models, functions, files) BOTH ways — every code row should say
what tests touch it and of what KIND, and every test should say what it
exercises. Analysis first, structure ruling second, implementation after.

**Method:** 4-agent read-only measurement + audit (workflow `wf_2bcd7721-0cd`):
join-key viability measured on both twins' REAL corpora (scripts + full
per-file lists in the session scratchpad `measure-*/`), a UX/IA audit of the
current Tests surfaces, and a spec-constraints read (verification-first record,
red-spec, review-spec, feature-spec). Human-facing synthesis: `analysis.html`.

## The measured numbers (real corpora, 2026-07-23)

| Join key | gastify api (pytest, 1114) | gastify web (vitest, 344) | gustify api (pytest, 1141) | gustify web (vitest, 467) | gustify e2e (playwright, 96) |
|---|---|---|---|---|---|
| junit file → disk file | **100%** (root `backend/`, strip trailing CamelCase) | **100%** (root `web/`) | **100%** (root `apps/api/`) | **100%** (root `apps/web/`) | **100%** (repo-root spec paths) |
| case name carries C-id | **100%** | **100%** | **100%** | 97.2% | 99% |
| test file imports app code | 88% | **100%** (71 src files) | 86.8% | **100%** (79 src files) | 0% — structural: e2e links via HTTP only |
| HTTP literal → endpoint | **100% on adopted surfaces** (296/296; 39.9% overall — the rest hit un-adopted entities) | 45.5% (all 33 literals live in mock tables, 0 at fetch sites) | **81%** (340/420) | 80% (12/15) | **89.6%** (86/96) |
| model classes touched by name | models **10/10**, schemas 22.7% | n/a | 73.3% | n/a | n/a |
| function called by name | 10.2% (6.7% conservative) | n/a | 15.9% | n/a | n/a |
| per-case AST location | **20/20 sample** (parametrize = many-to-one, 5% of cases) | yes | yes | yes | yes |
| per-file coverage on disk | NO (command declared, never captured) | NO | **YES** 13/13 join | YES (2/6 join) | — |

**Normalizations the linker needs:** route mount prefix (`/api/v1`) stripped —
lives in router mounting, not archmap, so it becomes a config key; `{param}`
template segments match literals/f-string slots; per-corpus disk root read
from the corpora config (already implied by each corpus's run command);
pytest classnames drop trailing CamelCase segments; `[parametrize]` brackets
stripped before def lookup.

## The central finding: the thread COMPOSES

Direct name-joins to functions (10–16%) and schemas (23%) are NOT weak links —
they are the wrong mechanism. Handlers and schemas are exercised **via HTTP by
design**. And archmap already knows each endpoint's handler function, response
schema, and touched models. So:

```
case ──(path literal)──▶ endpoint ──(archmap)──▶ handler fn · resp schema · touched models
case ──(direct call/instantiation)──▶ helper fn · model class
test file ──(imports)──▶ source files ──(_file_entity)──▶ entity
```

Three confidence tiers, and the dialect must not blur them:
- **T1 exercises** — HTTP method+path match; imported-and-called; instantiated.
- **T2 exercises via HTTP** — composed through the endpoint join.
- **T3 in reach** — file-level import reach (the only tier vitest gives below file level).
Plus per-file line coverage as the file-tier truth WHEN captured (named gap otherwise).

**Mechanically important:** unjoined HTTP literals overwhelmingly name REAL
routes of entities not yet adopted — endpoint joinability rises as entities
are adopted, with zero test changes. The thread engine also yields an honest
"unclaimed but reachable" signal: import-reach vs `test_rx` regex drift is
REPORTED (never gating; the regex stays the claiming mechanism per feature-spec).

## The audit verdict (why the tab confuses)

Root mechanical cause: **test rows have no anchors** — claims, files, and cases
cannot be linked TO, so 543 C-id pills link nowhere, class names don't link to
the matrix three scrolls down, and the Code tab (514 dlinks) never mentions
tests at all. Vocabulary collisions: KIND has four value-sets; api/web means
corpus, code layer, and runner; CLAIM/CLASS/GROUP name the same container;
three State columns with disjoint vocabularies; two unrelated "Matrix"
sections; shipped internal jargon ("aux of the matrix — same identity").

## Constraints the design must honor (spec read)

Anti-curation (machine asserts, cards translate); anti-bloat (derive, never
store — `test_insight` goes in archmap like `model_insight`); D1
report-never-gate; honest gaps; C-id is the identity and the corpus is the
registry (anchored token rx); claims join by class NAME (C-ids shown, not the
join key); DRIFT only when junit complete; six-kind taxonomy with fixed tag
classes; five-tab bar invariant on entity pages; kinds' intent authored in the
card, counts always machine; maturity tier is the only verification dial.

**Handshake seams when we implement:** feature-spec (config contract + CLAIMS
grammar gap + tab list drift in generators/README.md), adopt-spec promoted
floor, red-spec downstream-readers enumeration, gabe-entity context pack,
hooks fixture battery (same-commit rule). Full list in the workflow output.

## Proposed landing (staged; ruling pending)

- **Stage 1 — the thread:** a `test_insight` engine (new `_a3_tests.py`; R9
  seam — `_a3_code.py` is over budget) computing per-case joins at build,
  serialized in archmap. Code rows gain a Tests cell (kind chips w/ counts +
  honest gap chip) and a titled `TESTED BY` ⊕ block (case receipts, C-id
  pills that LINK). Test rows gain anchors + an `EXERCISES` ⊕ block (endpoint/
  model/function chips linking back). Kind-expectation guidance per element
  type (endpoint wants integration+journey; model unit/integration; handler
  fn via-HTTP; helper fn unit; file coverage) rendered report-never-gate.
- **Stage 2 — the testing estate:** tests.html → dashboard + subpages
  (mirroring the architecture estate) with the entity filter bar + colored
  entity badges; the app-wide matrix page becomes the canonical home of case
  rows (cross-page receipt links land there); vocabulary dedup (one KIND
  taxonomy with the corpus mapping rendered, one State per meaning, matrix
  homonym resolved).
- **Stage 3 — evidence seam** (operator: later): proof sets + walks join the
  same thread.

Decision + iteration happen on `analysis.html` (the human-facing page).

## v2 re-analysis (2026-07-23 evening) — the asymmetry diagnosis

Operator: the tests page still reads disconnected. Measured why (both twins,
live archmaps): only **23% of cases attach to any code element** (identical:
336/1,423 · 385/1,667) while **81–91% of endpoints and 63–87% of models have
receipts** — the thread is strong element→cases, weak case→element, and every
current table is junit-container-shaped with the links buried in ⊕ expansions
(zero visible code links above the fold).

Three shapes proposed in `tests-page-v2.html` (untracked, sandbox rule) for
what follows the SETTLED sections (Action Pending first · Kinds & coverage
second): **A (recommended)** — a new "Coverage by element" section leads:
the entity's endpoints/models/functions as rows (linked to their Code rows,
kind chips, case receipts in ⊕, untested elements as visible gap rows);
Claims stays after it as the promise accumulator; the file Matrix stays last
as the corpus-registry truth. **B** — Exercises as a visible matrix column
(surfaces the weak side: ~77% empty cells). **C** — full inversion (breaks
corpus-as-registry; not viable alone). Open: altitude (section on
test-matrix.html vs own test-elements.html page) and untested-row policy.

## v3 — Shape A REJECTED; the case ledger (rulings 2026-07-24)

Operator, next morning: Shape A copied the code inventory into the Tests
surfaces — "the test section should be about the testing we do." The v2
asymmetry was measured at the wrong granularity: 23% is the per-CASE attach
rate, but per-FILE the test→code joins run 86–100%, so a test-led table
fills honestly once file facts are allowed to ride the rows. Iteration ran
on a private artifact (two rounds); the rulings, all landed:

- **R1 — the C-id is the row.** One ledger row per case IDENTITY; the test
  file demotes to a metadata line; the ledger row is the canonical anchor
  every C-id pill in the center lands on (`test-matrix.html#C<n>`).
- **R2 — filters are dropdowns**, and endpoint / model / function are each
  their own filter (datalist type-aheads; entity/kind/state as selects).
- **R3 — the fold adapts to the kind** (integration: T1 routes + T2
  via-route credits; py unit: calls + reach; vitest: file-tier reach only;
  journey: routes driven; parametrize variants nest under their id).
- **Q1A** inherit file facts onto bare case rows as dashed `via file`
  chips; filters match inherited too. **Q2A** cases without a C-id render
  with an `unminted` tag (+ addendum: mint them in BOTH twins at
  propagation time — the tag should read zero there from day one).
  **Q3A** the file altitude survives as a flat Files table after the
  ledger. **Q4A** failing first, then C-id descending. **Q5A** free-text
  search ships. **Q6A** test-elements.html repurposed as the GAPS page —
  untested rows only; the Shape-A roster is deleted everywhere (a tested
  element's receipts live on its Code rows; only gaps have no case row to
  carry them).

Landed suite-side in `420f822` (engine `case_own`, new `_a3_ledger.py`,
entity tab Kinds → Cases → Files → Claims → Untested, estate Cases/Gaps
pages, battery + fixture growth). Lab numbers: gastify 1,424 identities
(1,421 anchored + 3 unminted, 265 gaps) · gustify 1,679 (1,644 + 35, 89
gaps) · 0 dead anchored refs on either twin's lab output.
