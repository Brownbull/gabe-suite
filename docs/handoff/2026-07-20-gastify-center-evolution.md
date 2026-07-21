# Handoff — gastify center evolution → suite absorption

> Accumulator for the dedicated gabe-suite session. Everything the gastify
> re-adoption sessions (2026-07-20) changed in the shell templates, the
> generator, and the METHOD — with the reason behind each change — so the suite
> can absorb it deliberately instead of archaeologically. Written from the
> gastify session; gastify-side evidence lives in its LEDGER rows
> `54a80d6..c0dee6b` and the pages under `docs/site/center/`.

## ⚠ DIRECTION INVERTED — read this first (2026-07-21, gastify D122)

**gastify is the SOURCE. This repo is the destination.** The shell now lives at
`templates/center/shell/` INSIDE gastify and is what its build renders from;
the copy here and the installed one at `~/.claude/templates/gabe/center/shell/`
are deliberately STALE and are to be overwritten FROM gastify by this session.
Do not hand-merge, do not treat this repo's copy as a baseline, and do not
mirror anything back — gastify's build prints a drift line naming every file
that differs, and it will stay noisy until you sync.

That also answers the roast's first critical (see §7): nothing is being
promoted from a single entity, because promotion now happens after gastify has
hardened against its own seven. **§5's order inverts** — copy first, then let
gastify's remaining entities earn the spec amendments.

## 0. State on this repo right now

> **Second pass appended 2026-07-20 (late).** The first pass covered gastify
> `54a80d6..2ad4b48`; everything marked **[p2]** below came out of the tab-by-tab
> refinement that followed (`4b82657..ba2a621` — Tests, Evidence, Overview and
> Risk each rebuilt against operator review). Read the whole file; the apply
> plan in §5 is the merged one.

**Uncommitted here** (left for THIS suite session to commit as one change):
`templates/center/shell/` — a3.css, all 8 station skeletons, NEW
`assets/a3-settings.js`, NEW **[p2]** `assets/a3-lightbox.js`. Diffstat at this
handoff: 9 files changed, **416 insertions / 31 deletions**, plus the two
untracked JS assets. The installed copy
(`~/.claude/templates/gabe/center/shell/`) is byte-identical — gastify built
against it, so the templates are field-tested, not speculative.

⚠ `templates/center/shell/README.md` was NOT updated — its slot contract is
now stale (missing `{{TAB_CODE}}`, the tpills cluster, the removed topbar
pills, and **[p2]** the unwrapped **overview**, **tests** and **evidence**
panes — three of five panes now ship bare because the generator owns their
sectioning). Rewriting it is task #1 below.

## 1. Shell/template changes on disk (what + why)

| Change | Why |
|---|---|
| `feature.html`: 5th tab **Code** (`{{TAB_CODE}}`, `</>` icon) between Overview and Tests | Operator ruling: every entity page needs a developer-audience decode (endpoints · code map · data model). **Contract-change candidate**: the four-tab invariant is now five on feature pages — adopt it suite-wide or reject it explicitly; a silently divergent tab set is how the last center rotted. |
| `feature.html`: tests pane unwrapped (bare `{{TAB_TESTS}}`) | The generator now emits the pane's own sectioning (summary FIRST, matrix second); the skeleton's hardwired matrix banner forced the wrong order. |
| `feature.html`: `.tpills` right-cluster in the tabbar (pills + sync); topbar pills removed | Operator: on scroll, the TABBAR becomes the title bar — tabs left, tests/phase/last-sync one line far right. Topbar (crumb) scrolls away. |
| a3.css: topbar unsticky; `.tabbar` sticky top:0 + `--bar-bg` | Same scroll model. `--bar-bg` exists because dark mode exposed a hardcoded light glass. |
| a3.css: `:has(.tabpane:target)` → `:has(:target)` + `.tabpane:has(:target){display:block}` | **The critical enabler**: in-page anchors used to untarget the pane and collapse the pure-CSS tabs to Overview. With this, cross-links (endpoints ⟷ code map ⟷ data model) and subnav anchors work. |
| a3.css: `.subnav` (sticky under tabbar, iconed links, padding 8px top / 2px bottom) | Per-tab secondary navigation; labels deliberately ride LOW in the bar (operator: too close to the top border). |
| a3.css: color vocabulary `.tag.m-*` (HTTP verbs), `.l-*` (layers), `.s-*` (severities), `.fm-*` (font-only verb links), `.leg` legend row | One semantic color system, ALWAYS explained by a legend where used ("a color without a legend is decoration"). Font-only variants exist because the operator wanted code-map back-links colored without backgrounds. |
| a3.css: `details.secinfo` (title-row-is-the-summary ⊕ toggle) | Operator: all legends/descriptions collapse behind a ⊕ beside each section title; tables never hide. |
| a3.css: `details.pmore` (⊕ more / ⊖ less inline expander) | Long endpoint purposes truncate at a word boundary and expand in place; no script. |
| a3.css: `details.proofset` (toggleable proof-set rows w/ inline galleries) | Evidence is business-readable: open a set, see its shots. |
| a3.css: `.sechead` = title pill (icon circle + tinted label hugging text) | Earlier operator fix: full-width banner cards read as sibling rows, not titles. |
| a3.css: `.lens*` + `details.more` | gabe-lens block leads each feature page; the full card folds (65% less visible text, nothing deleted). |
| a3.css: `.dgm` diagram picker (radio + CSS siblings) | Diagrams one-at-a-time (Userflow/Dataflow/Workflow), not stacked; pure CSS so it can live inside `:target` panes. |
| a3.css: dark theme `[data-theme="dark"]` variable overrides; mermaid SVGs get a light plate | Full dark mode; pre-rendered SVGs carry light colors — an honest plate beats a fake re-theme. |
| a3.css: viewer-settings vars `--root-size` (on `html`), `--font-content` (content-only), `--side-w`; `data-compact` = VERTICAL density; `data-rail` = icon collapse | Operator-tuned: size scales nav+content together via rem; font changes content (incl. diagram text via `!important` over mermaid's `#m0` ID selector) but never the nav; compact ≠ rail (density vs width). |
| **[p2]** `feature.html`: OVERVIEW and EVIDENCE panes unwrapped too (bare `{{TAB_OVERVIEW}}` / `{{TAB_EVIDENCE}}`) | Same reason as the tests pane, twice over: Overview grew four sections (card · diagrams · growth · changelog) and Evidence two, each with its own subnav. Three of five panes now ship bare — **the skeleton owns the tab SET, the generator owns the sections inside a tab.** Worth stating in the README as the rule rather than leaving it as a pattern. |
| **[p2]** a3.css: `.ty` + `.ty-num1/num2 · tim1/tim2 · str1/str2 · bool · json · id · null` | Type families in a data-model column: one hue per family, **deeper = the wider type** (`int` plain, `float`/`Decimal` deep; `date` plain, `datetime` deep). Operator's own framing. Uncolored = a domain alias, stated in the legend. |
| **[p2]** a3.css: `.meter` (bar + tabular percentage in one cell) | A bar alone hides the count; a percentage alone hides the denominator. Used for per-kind and per-file pass proportions. |
| **[p2]** a3.css: `.tbl tr.exp` expander rows + `tr.exp:has(details.more[open])` highlight | A table row that opens IN PLACE, under its record — the Tests matrix opens onto its cases, Evidence onto its galleries. The open one is tinted with an inset accent bar: with several expanders on a page, "which one is unfolded" has to be answerable without re-reading every summary. |
| **[p2]** a3.css: `details.legset` (a walk's leg as a collapsible sub-section) | A 53-artifact proof set is unreadable as one wall. NOTE: named `legset`, **not** `leg` — `.leg` is already the legend row and the collision silently broke the flex layout the first time. |
| **[p2]** a3.css: `.a3lb*` (proof viewer: backdrop, stage, side arrows, top title, centered caption, index) | Clicking a proof artifact used to navigate away to a raw PNG, losing the reader's place AND the set they were reading. |
| **[p2]** a3.css: `.cid` / `.cid.none` (case-id chip) | The C-id is rendered AS an id and stripped from the prose it prefixes; a case with none reads `—` rather than looking un-run. |
| **[p2]** a3.css: `.tag.l-evidence`, `.tag.e-xs/e-s/e-m/e-l`, `.tag.st-mvp/st-ent/st-scale` | Growth pricing vocabulary: an evidence kind, an effort class, a maturity stage. All three legended where used. |
| **[p2]** NEW `assets/a3-lightbox.js` | The proof viewer + the expander cascade (see §3). Delegated on `a[data-lb]`, inert without them, and progressive — the anchors still point at the real files, so with JS off a click just opens the image. |
| NEW `assets/a3-settings.js` | JS-injected controls so no skeleton carries settings markup: bare cog in the `.brand` row (panel opens ANCHORED to the cog, viewport-clamped); panel = 10 content fonts (Menlo default; Helvetica/Tahoma kept by name), size S/M/L/XL (S=14px default), compact toggle, Light/Dark; icon-only rail button placed after the last menu group. All persisted in localStorage. |

## 2. The generator (gastify-side — the NEW promotion source)

gastify now carries the most mature A3 generator; **it supersedes gustify as
the reference implementation** the adopt-spec's promotion clause points at:

- `scripts/build_center_a3.py` — orchestrator: fills all 8 stations from
  machine sources, writes `archmap.json`, per-entity feature pages.
- `scripts/_a3_render.py` — pure helpers: `table()` (headers mandatory),
  `md()` (markdown rendered, never leaked; code spans stashed first),
  `trunc()` (word-boundary), `sechead(…, info=)` (collapsible legend),
  `legend()`, `subnav()`, `gap()` (named gap, never a zero), `card_html()`.
- `scripts/_a3_feature.py` — feature pages FROM `feature.html`: lens block,
  diagram picker, tests summary+matrix, toggleable proof galleries, risk
  register (parses `SEV · status · Kind — text` card lines), Decisions
  changelog; per-entity walk notes from `walks.jsonl`.
- `scripts/_a3_code.py` — **all ast, no LLM**: endpoints (decorators +
  docstrings + response models + touched types), models (columns vs
  `relationship()` split, ForeignKey targets), pydantic schemas, per-file
  defines, 800-line heat (`green ≤800 → red ramp →2000`), synthetic examples
  (Literal-first, type-shape before name-heuristics), composition links
  (a field typed with a documented class LINKS, never repeats),
  `collect_entity_map()` → the committed `archmap.json`.
- **[p2]** NEW `scripts/_a3_evidence.py` — the Evidence tab, split out under the
  size budget. Walks each proof set RECURSIVELY, splits files into
  shots / videos / traces / **references**, files them into the manifest's
  legs, and renders a header table whose rows open onto per-leg galleries.
- `refresh_center.sh` regen path now calls the A3 generator + link gate; the
  legacy `build_center_docs.py` is retired from the path (it emits the
  pre-adoption layout and would overwrite A3).
- Per-entity registration is DATA: `ENTITY_CODE` / `ENTITY_MODELS` /
  `ENTITY_RX` / `ENTITY_PROOFS`. Entity #2 = add entries, zero page code.
  **[p2] Held through five tab rewrites** — every refinement below landed in
  the renderer, none in per-entity code. That is the clause working.

**[p2] `_a3_render.py` grew three helpers worth promoting verbatim:**

- `table(..., expand=[(summary, html), …])` — a parallel list that emits an
  expander row directly UNDER each record. One mechanism, three users (Tests
  matrix → its cases, Evidence → its galleries, data model → its columns).
- `meter(done, total, label)` — count + proportion in one cell.
- `pmore(text, n, small=)` — word-boundary truncation that carries its own ⊕
  expander. **Every truncation on a page must have one**; a cut sentence with
  no way to finish it is worse than no sentence.
- `table()`'s `note` is now rendered as MARKDOWN, not escaped. It was escaping
  its own argument, so seven notes shipped literal `&lt;code&gt;` and stray
  backticks. Notes are prose; prose is markdown here.

**[p2] `_center_data.py`** — junit case records now carry `cls` (pytest class /
vitest suite), which is what makes the per-file case expansion possible.

**archmap.json** (committed, regenerated each build): endpoints + touched
types, columns/FKs/relationship edges, schemas, files + measured lines,
defines. Consumers read the map instead of re-analyzing the codebase; a PR
diff of the map IS the architecture change. Proposed decision row for the
suite: "archmap = committed machine-derived architecture map; ast-only".

## 3. Method changes to fold into the SKILLS (specs)

**gabe-adopt / adopt-spec:**
- **Machine-surface-first section builds** (operator ruling after catching the
  defect): a section starts from endpoints + models + junit inventory; legacy
  cards are demoted to supporting testimony. The six-card "reorganize" method
  produced a page narrower than its own evidence (counts said 87 api cases,
  prose covered half the surface).
- Section pages carry the **Code tab** (see contract candidate above).
- Card contract additions: `# LENS` (gabe-lens fields: handle/analogy/is/
  is not/decides/map/confuse/limits — leads the page), `# CODE` (tab intro,
  rendered at the END of the tab), `# RISKS` (structured `SEV · status ·
  Kind — text`), `# NOT CARRIED FORWARD` (dropped legacy claims with reasons),
  `# REVIEWED` supersede flow: a material rewrite after a walk flips the
  tracker back to `awaiting-approval` — a walk approves a SCOPE, not a slug.
- Audience framing per tab: Overview=everyone · Code=developers ·
  Tests=what/how/which-cases+coverage · Evidence=business-readable proof ·
  Risk=security/project/estimation priced at maturity, ending with the
  Decisions changelog.
- Anti-curation extensions: synthetic examples labeled synthetic; ORM
  relationships render APART from columns with their backing FK named
  (a back_populates pair = two views over ONE FK, never presented as
  circular); every color legended where used; repeated records = real tables
  with header rows; absent sources = named gaps.

**gabe-feature / feature-spec:** same card-contract additions; feature pages
are generated from registration data, never per-entity page code.

**Testing accumulator (design agreed; HALF BUILT as of p2):** ephemeral = junit
matrix regenerated each build; accumulator = per-entity testing card (case
CLASSES with intent + C-id anchors + named gaps) rendered to a dedicated
testing page; the build validates every anchored C-id against junit — a
claimed case that no longer runs renders as visible drift. C-ids per red-spec
(mint via /gabe-red or review verdicts only).
**[p2] Built:** the C-id SUBSTRATE — every matrix row expands to its cases with
`#` · C-id · what it asserts · group · time · state, the id anchored with
`(?<![A-Za-z0-9])C([0-9]{1,5})(?![0-9])` and stripped from the prose it
prefixes. **Still to build:** the claim side — a card that declares case ids
the build then validates against junit, so a claimed-but-not-running case
renders as drift. The join is now cheap; only the claim file is missing.

---

## 3b. **[p2]** Method rulings from the tab-by-tab refinement

These came out of operator review of each tab in turn. They are the parts most
worth arguing about before they become suite contract.

**Reference material is NOT evidence.** A Storybook / design-lab capture is
what a screen was built to MATCH — captured at development time, from the
design source, not from a run of our software. It cannot be counted or shown
as proof. The split is per FILE, not per set, because fidelity sets interleave
the halves (`ref/browse` sits beside `live/browse` in the same leg); the rule
is a path match on `^ref[-/]`, `/ref/`, `reference`, `storybook`, `mockup`,
`design`. **Never silent**: each set states `N reference artifact(s) held out`
and a set with nothing else reads `reference only — not proof`. This corrected
three sets that were counting design captures as proof (tx1 8→5, tx2 16→13,
tx3 20→13). Candidate for the anti-curation list in adopt-spec.

**Evidence is machine-surface-first too.** Proof sets carry a committed
`manifest.json` (`feature · spec · proof_form · source_run · legs · narration`)
that the tab had been ignoring while rendering a bare name + count. Worse, its
glob was top-level-only, so two full sets (45 shots + 8 videos; 20 shots in
subdirs) rendered as **"empty — named gap"**. *A false gap is as dishonest as a
false pass* — worth stating that way in the spec, because the anti-curation
rules so far only guard the optimistic direction.

**Every angle needs both prices.** Growth (Overview) answers what it costs to
CLOSE a gap: `Kind · What is missing · Effort · Stage · What it buys · Cost per
run after`. Risk answers what it costs to LEAVE it open: `Severity · Risk ·
What is at stake · Status · Detail`, with the unverified angles folded in as
GAP rows. Before this they were the same list in three places (Tests, a "Named
gaps" table, and Growth) saying nothing three times. Two prices, one fact,
neither redundant — and the GAP row links to its growth row.
- **A severity with no consequence is a number nobody can argue with.** Card
  grammar goes to four fields: `SEV · status · Kind · what is at stake — detail`
  (three-field lines still parse; a missing stake renders as a named gap).
- **An opportunity without its recurring cost is a sales pitch.** Every angle
  added is time spent on every future run; the growth table says so per row.
- Effort/stage/gain/cost are keyed by KIND in one generator table — authored
  judgment, applied consistently, and the only hand-written estimates on the
  page. Flag them as such wherever they are promoted.

**The card says WHAT FOR; the machine says HOW MUCH.** The `# ANGLES` section
was restated as per-kind INTENT only, rendered inside the section's ⊕ toggle
with the same kind chips as the table it explains. Its old form carried
hand-written counts ("87 cases across 6 files") that drifted the moment a test
landed. Rule: **a card must not restate a number the build can read.**

**Section inventory per tab** (the shape the five-tab contract should specify):
| Tab | Sections | Audience |
|---|---|---|
| Overview | card · diagrams · **growth** · **changelog** | everyone |
| Code | endpoints · code map · data model | developers |
| Tests | kinds & coverage · matrix (rows → cases) | whoever asks "is it tested" |
| Evidence | proof sets (rows → legs → galleries) · not proven here | business |
| Risk | register (incl. GAP rows) · not carried forward | whoever prices it |
The Decisions changelog MOVED from Risk to Overview (operator): what is open
and why it is the way it is belong together, ahead of the risk pricing.

**Interaction rules the viewer established** (for the README's behaviour
section): one gallery click opens the artifact IN the page; ← / → run the
WHOLE set, leg by leg, never dead-ending at the leg clicked; ↑ / ↓ change SET,
folding the current one shut and unfolding the next; at either end nothing
happens, because wrapping silently changes subject; the top line names the leg
and the position inside it, the bottom line names the set. A row expander
CASCADES to the sub-sections inside it — one toggle is one decision.

## 4. Process learnings (for suite docs / retros)

- **Only the regenerated artifact is proof.** A patch script once corrupted a
  module; the commit landed with stale pages and the "fix" was verified from
  the wrong output. Regenerate, then verify from the page.
- `offsetParent` lies about closed `<details>` (Chromium keeps content in the
  layout tree for find-in-page); use `checkVisibility()`.
- Pure-CSS `:target` tabs break on in-page anchors without the `:has(:target)`
  rules — any center adding cross-links needs them.
- Heredoc patch scripts corrupt on embedded quotes; prefer the Edit tool for
  anything quote-dense.
- `git commit` + any standalone `-n` token (e.g. `sed -n`) in one command line
  trips the block-no-verify hook — split the commands.
- **[p2] `toggle` does not bubble and fires ASYNCHRONOUSLY.** A cascade handler
  must listen in the capture phase, and a test that sets `open` then reads the
  children in the same tick reports a false failure — the first cascade test
  did exactly that and looked broken while working. Wait a tick, then assert.
- **[p2] Class-name collisions are silent.** `details.leg` inherited `.leg`
  (the legend row's flex styles) and quietly wrecked the layout. Prefix new
  block classes rather than reusing a short word already in the vocabulary.
- **[p2] A helper that escapes prose will leak markup.** `table(note=…)` ran
  `E()` over an argument callers were writing `<code>` into. Decide once per
  parameter whether it is HTML or markdown, and say so in the docstring.
- **[p2] Verify the CLAIM, not just the render.** The evidence rewrite only
  surfaced the top-level-glob bug because the check was "does this count match
  what is on disk", not "does the page look right". Both sets *looked* fine
  reading "empty — named gap".

## 5. Suite-session apply plan (ordered)

0. **COPY FROM GASTIFY FIRST** (D122): `cp -r <gastify>/templates/center/shell/. templates/center/shell/` and the same into `~/.claude/templates/gabe/center/shell/`. gastify's vendored copy is authoritative; this repo's is stale by design. Verify with `diff -rq` and by re-running gastify's regen — its drift line must go quiet.
1. Commit `templates/center/shell/` here (one change, this doc as context) —
   now including **`assets/a3-lightbox.js`**.
2. **Rewrite `shell/README.md`** — slot contract + station↔sources table for
   the current skeletons (TAB_CODE, tpills, the THREE unwrapped panes, both JS
   assets, subnav/secinfo/pmore/proofset/legset/expander/dgm/lens/ty/meter/cid
   vocabulary, dark mode, viewer vars) **plus a behaviour section** for the
   viewer + cascade interaction rules in §3b.
3. Decide the **five-tab contract** — and now also the **section inventory per
   tab** (§3b table) and the rule *skeleton owns the tab set, generator owns
   the sections*. Record the decision.
4. **Generator promotion**: port gastify `scripts/{build_center_a3,_a3_render,
   _a3_feature,_a3_code,_a3_evidence}.py` (+ `_center_data.py`
   column-name-resolved PLAN parsing + junit `cls`, `_center_mermaid.py`,
   `check_center_links.py`) into `templates/center/` with
   `center.config.json`-driven bindings; add the install.sh center block.
   gastify is the reference now, not gustify.
   Watch the size budget: `_a3_feature.py` is ~710 lines and `_center_data.py`
   is over at 931 (gastify P165 names the split seam — the junit/coverage/
   history loaders are a separable results-ingest module).
5. Amend `gabe-adopt/references/adopt-spec.md` + `gabe-feature/references/
   feature-spec.md` per §3 **and §3b**; cross-check red-spec for the
   accumulator C-id join. The §3b rulings that are genuinely new contract:
   reference-is-not-evidence · false-gap-is-a-false-pass · both-prices
   (growth + risk) · card-must-not-restate-a-machine-number · four-field RISKS
   grammar · every-truncation-carries-its-expander.
6. Adopt **archmap.json** into the spec (committed machine map; consumers read
   the map) + its decision row.
7. Re-run `./install.sh`; verify gastify regen still green against the
   installed templates (its generator reads them live).

## 6. gastify state pointers (read-only context)

- Tracker `docs/site/center/adoption.json`: transaction `awaiting-approval`
  (7/7 checklist, **re-walk pending** after the full-feature rewrite — the page
  now says so itself, as a GAP row on its own risk register);
  6 entities pending. Walks: `adopt:transaction` pass 2026-07-20.
- Center: 9 pages + archmap.json, crawl gate **314 refs / 0 dead** (was 295).
- Known debt tracked there: per-entity coverage slice not wired; e2e junit
  capture not wired (D121 local-only); `transactions.py` 1044 /
  `transactions.new.tsx` 1022 over the 800 budget (P123); **[p2]**
  `scripts/_center_data.py` 931 over budget (P165, split seam named).
- **[p2]** gastify commits carrying this pass: `4b82657` (Code type colors +
  Tests tab) · `34d04e4` (Evidence from manifests + viewer) · `50812e7`
  (Growth + Changelog on Overview) · `147a9e5` (reference held out · set-wide
  viewer · priced growth) · `eb0c6da` (expander highlight · ↑/↓ sets) ·
  `ba2a621` (risk stake + gaps absorbed). LEDGER rows accompany each.
- **[p2]** ⚠ gastify has **51 commits unpushed** on `main` at this handoff;
  pushing triggers Railway autodeploy, so the full local gate runs first. That
  is gastify's business, not the suite session's — noted so the suite session
  does not read the unpushed state as unfinished work.

---

## 7. **[p3]** Trial complete — the state the retrofit analysis starts from

> Appended 2026-07-21. Covers gastify `4b82657..HEAD` (27 non-KDBP commits,
> shipped through PRs #70/#72/#73 plus direct commits on main; CI green, nothing
> unpushed). This closes the TRIAL: one entity carried end-to-end through the
> center so the suite has real content to contrast against the specs.

### 7.1 What the trial produced

One entity (`transaction`) rendered across five tabs, 450 KB of generated page,
built from 14 endpoints / 5 models / 16 schemas / 37 files of machine-read
architecture, 228 junit cases, 7 proof sets, 424 internal refs with 0 dead.
Guarded by 49 generator tests and two CI jobs that did not exist before
(**Center**, **API Drift**).

### 7.2 Two decisions the suite must absorb before anything else

- **D122 — gastify is the SOURCE of the center templates.** The shell is
  vendored at `templates/center/shell/` and is the build INPUT; the build
  resolves vendored → installed and prints which it used plus any byte drift.
  This repo's copy and `~/.claude/templates/...` are deliberately stale. The
  cause was reproducibility: the build read its skeletons from `$HOME`, so the
  same commit rendered differently per machine and CI could not regenerate at
  all. **§5 step 0 (copy FROM gastify) is not optional.**
- **D123 — `adoption.json` is THE entity registry.** One vocabulary. The center
  had been naming entities three ways at once (`config.areas` 6 · `sections` 7 ·
  `config.entities` 10, plus `ENTITY_RX` as a fourth mapping), so a reader
  crossing from the corpus matrix to a feature page silently changed taxonomy.
  A build guard now aborts on any per-entity mapping keyed to an unknown slug.

### 7.3 The EPHEMERAL / ACCUMULATOR pattern, as actually built

This is the part the specs are thinnest on and the trial has the most to say
about. Every tab pairs a hand-authored accumulator with a machine-derived
ephemeral half — **except the one the product is named after**:

| Tab | Accumulator (persists) | Ephemeral (rebuilt each run) |
|---|---|---|
| Overview | the card | growth table |
| Code | card `# CODE` | endpoints · code map · data model |
| Evidence | `manifest.json` per proof set | the recursive disk walk |
| Risk | card `# RISKS` | derived GAP rows |
| **Tests** | **— none —** | matrix · cases · meters |

- **Ephemeral exemplar:** `archmap.json` — fully rebuilt every run, committed
  only so a PR diff of it IS the architecture change.
- **Accumulator exemplars that exist:** `adoption.json` (rows change status,
  never vanish), the entity card, and — outside the center but read by it —
  `.kdbp/walks.jsonl`, `LEDGER.md`, `PENDING.md`.
- **The center's own run accumulator is MISSING.** `run-history.jsonl` existed
  in the pre-adoption center (5,287 bytes of `{"ts","source","totals"}`); the A3
  rebuild dropped it. `load_history()` still exists (`_center_data.py:401`) and
  `build_center_a3.py:827` renders a NAMED GAP for it. Only the writer is absent.
- **The testing accumulator is HALF BUILT.** Measured: 228 distinct C-ids
  RUNNING in junit for this entity, **1** claimed in the card, and `_CID_RX` is
  used in exactly one place — rendering rows FROM junit. Nothing validates a
  claim against a run, so the design's whole point ("a claimed case that no
  longer runs renders as visible drift") has no mechanism. The ephemeral half
  and the join substrate exist; the claim side does not.

**Operator ruling 2026-07-21: do NOT build either of these yet.** They are
recorded as options so the suite can decide whether the pattern belongs in the
spec first, and gastify then implements the spec rather than the reverse.

### 7.4 Rulings added since §3b

- **Every number in the chrome must be traceable to a section that shows it.**
  The title bar quoted "228 cases" and 228 appeared nowhere on the Tests tab but
  a table footnote. Pills are now links; each destination leads with its number.
- **One fact, one word.** The same count was "4 open gap(s)" in the bar and
  "4 open opportunity(ies)" in the section it summarised. Vocabulary drift
  inside a single page is the same defect class as the three-vocabulary split.
- **A reading measure is not chrome.** `max-width:1060px` is right for prose and
  wrong for a sticky title bar; capping both wasted 612px at 1920 while the bar
  wrapped to three lines. Chrome gets the column; content keeps the measure.
- **Chrome must not scale linearly with the viewer's font control.** Pure `rem`
  put the bar 217px over budget at XL. Damped `calc()` keeps it on one line at
  every viewer setting — verified across 360 combinations (widths × root sizes ×
  rail on/off × 3 content fonts).
- **Under width pressure, scroll — never wrap, never truncate.** A title bar
  that grows to three lines has stopped being a title bar.
- **A gate that cannot fail is worse than no gate.** Three shipped gates were
  reporting PASS while checking nothing; one (`check-rls-table-coverage.sh`) was
  a stub that never needed the live DB it blamed, and once implemented found 15
  of 28 tables undocumented.
- **Guard the invariant, not the step list.** C1710 discovers every workspace
  with a `generate:api` script and demands a diff, so a third consumer is
  covered the day it appears; asserting "the web step exists" would not have
  caught web in the first place.

### 7.5 Process learnings to add to §4

- **A measurement harness needs the same scepticism as the code.** The bar
  harness reported a single-line bar as three rows (clustering by raw `top`
  instead of vertical centre), then under-reported available width by 14px
  (hardcoded padding). Both times the CSS was fine and the ruler was wrong.
- **Later CSS at equal specificity silently kills earlier intent.** Two
  compression rules were overridden by an accreted duplicate block 80 lines
  down; the numbers still looked right because the *other* rules landed.
- **A test that passes on the old code proves nothing.** One `_labels` test used
  depth-2 paths, which the buggy implementation handled correctly; the defect
  was at depth 1. Red-then-green against the ACTUAL prior implementation is the
  only honest check.
- **Do not ship a guard you cannot verify.** A drafted "gate that can only pass"
  detector was deleted after it passed the very stub it was written for
  (`set -euo pipefail` defeated every cheap heuristic).
- **An unreproducible observation is not a finding.** One gate printed FAILED
  once and never again across eight runs; it was dropped rather than reported.

### 7.6 Where the trial is incomplete (deliberately)

- **The `adopt:transaction` re-walk is still open.** The 2026-07-20 walk
  approved the six-card reorganisation; everything since supersedes that scope.
  The tracker reads `awaiting-approval` and the page says so in three places.
- **The shell README documents none of the current shell** (0 hits for
  TAB_CODE, a3-lightbox, legset, data-sub, tpills, subnav, secinfo, ty-num,
  meter, cid). Under D122 it is gastify's file now — but rewriting it is the
  natural first step of the suite export, not before.
- **The shell JS layer is unguarded.** The viewer's keyboard contract, the
  expander cascade and the tabbar one-line ruling were all verified by hand;
  the 360-combination harness was deleted after use, so that proof exists only
  in a session transcript. The 49 tests cover the generator, not the shell.
- **Six entities remain unadopted.** Every §3b ruling has been exercised on ONE
  entity; the measurements in §3b's roast (df2-*-ref sets, loose-file proofs,
  15/45 endpoint docstrings, 50 double-counted cases) predict where they break
  on entity #2.

### 7.7 Suggested shape of the retrofit analysis

1. Copy the shell and generator FROM gastify (D122; §5 step 0).
2. Contrast the five-tab section inventory (§3b) against `feature-spec.md` and
   `adopt-spec.md` — the tab SET is skeleton-owned, the sections inside are
   generator-owned, and that split is currently a pattern rather than a rule.
3. Decide whether the ephemeral/accumulator pair (§7.3) belongs in the spec as a
   REQUIREMENT per tab. If it does, Tests needs a named accumulator and the
   C-id join stops being optional.
4. Take §7.4's rulings as spec candidates; take §7.5 as retro material.
5. Only then hand a spec back to gastify and adopt entity #2 against it.
