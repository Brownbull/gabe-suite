# Action Ledger — verified roast (2026-07-22)

> **Method.** An exhaustive 8-perspective adversarial roast run as a multi-agent
> workflow: End User · UX/UI · Architect · QA/Testing · Builder · Maintainer ·
> Sweeper · Domain Expert. Each lens read the design's *source of truth* (the
> retrofit generators, the shell-assets, the handoff README) and sampled the
> rendered examples. **Every drafted gap passed two independent verifiers** — an
> evidence-auditor (opened the cited file; does the quote exist and support the
> claim?) and a devil's-advocate (tried to refute: already-handled / out-of-lane /
> taste-not-gap / mis-graded). A gap died if *either* failed.
>
> **98 agents · 0 errors · 44 drafted → 23 survived double-verification → deduped to 16.**
> Provenance: workflow `wf_a398f8a9-563`. This file feeds the retrofit — it is the fix-list.

## Verdict

The redesign's information architecture is **sound** — the panel actively *cleared*
several suspected problems (see "Verified clean" below). What it found is a set of
**honest-signal defects in the generators** (the page lies or contradicts itself on
real project data) plus **retrofit-mechanics traps** (the two-lane fold-in). These
are in the *generator source*, so they must be fixed in
`docs/handoff/2026-07-22-action-ledger/generators/` **before** propagating to
gastify + gustify — otherwise the redesign ships the exact "fake a pass" behaviour
the verification-first center exists to kill.

### Block-before-retrofit set (fix in the generators first)

| Gap | Why it blocks |
|---|---|
| **M1** — six open moves, ten pending | Flagship page contradicts its own headline count; breaks the "one move, one domain" invariant at the machine-gap/risk seam |
| **M2** — failing tests emit no move, stamped green | Loudest possible false-pass on the page built to name gaps |
| **M3** — maturity nailed to 'mvp', caption lies "from BEHAVIOR.md" | Visible false provenance — a D7 "block lies" violation |
| **M4** — regen with new .py + stale a3.css → unstyled tables | The retrofit itself: a Step-A-only regen ships broken pages estate-wide |
| **C1** (coverage-add) — Code-tab type links land on a collapsed row | Navigation regression the `xtable` migration introduced; no lens priced it |
| **M5** — 1,293-line god file + dead branch-trees | The suite's OWN size-budget commit gate will fire on the retrofit commit |

Strongly recommended alongside (the headline "Claimed coverage" feature's own
correctness): **E1** (claim join keys on class name, not the advertised C-id →
rename false-DRIFT) and **E2** (missing junit paints every claim DRIFT).

---

```
GABE ROAST: Action Ledger feature-page redesign
Perspective: 8-lens panel (End User · UX · Architect · QA · Builder · Maintainer · Sweeper · Domain Expert)
Read: synthesis of a verified multi-agent panel — 44 gaps drafted across 8 perspectives, each survivor passed an independent evidence-audit and a devil's-advocate refutation (23 verified in), then deduped across lenses here to 16. Every gap below is grounded in cited file:line evidence; nothing is invented at synthesis.

═══ MVP ═══

── CRITICAL ──

M1
**Gap:** The Action Ledger reports two different counts of "what is pending" on the same screen. The stat strip's "open moves" cell and both status pills read `len(ledger_rows)`, which EXCLUDES the 4 authored risks, while the per-area summary dashboard an inch below sums `_dom_count` — which adds `"risk": len(_all_risks)` — and prints "10 pending move(s) across 5 areas". On both approved exemplars a reader sees 6 (pill), 6 (strip), then 10 (dashboard) for the same word "move" within one scroll. Design move 5 calls a risk "one more action table," yet the headline refuses to count it. Deeper: the machine-gap tree and the authored-risk tree don't know about each other, so an authored RISK that restates a machine gap (e.g. "no journey coverage") is counted in BOTH the Tests domain and the Risk domain and shown in both tables — breaking the redesign's load-bearing "each open move lives in exactly ONE section" invariant at the machine-gap / authored-risk seam, re-forming the three-places scatter the redesign exists to retire, one seam over.
**One-liner:** Six open moves, ten pending — the ledger can't count itself
**Effort:** S (confident)
**Lose:** The flagship promote-candidate page contradicts itself on its own headline number: a dev asking "how many things do I have to do on this feature" gets 6 from the pill and 10 from the ledger and can trust neither. A careful reader assumes a rendering bug and stops trusting the "every number is machine-derived and reconciles" claim the whole center rests on — and any authored risk naming a machine gap double-books that move into two sections.
**Evidence:** `_a3_feature.py:969-970` stat strip `(_KPI_SEED, str(len(ledger_rows)), "open moves", …)`; `:1264/:1272` pill `n_moves = len(ledger_rows)`; vs `:916-917` `_dom_count[… "risk": len(_all_risks)]`, `:977` `_total = sum(_dom_count.values())`, `:993` note `f"{_total} pending move(s) across {len(_DOMAIN_ORDER)} areas."`. Rendered `feature-transaction-action-ledger.html` + `feature-allergen-action-ledger.html` (L395 pill): strip "6 open moves" + pill "6 moves · 4 ripe" + dashboard "10 pending move(s) across 5 areas" — the 4-move gap is exactly the card's risks.
**Fix:** Pick ONE universe of moves. Either fold authored risks into `angle_rows` so `len(ledger_rows)` is the single count everywhere, or relabel the strip/pill "6 moves + 4 risks" and drop the merged "10" — and de-duplicate machine-gap vs authored-risk before counting so no concern lands in two domains. One derivation, one number.
**Raised by:** End User · Architect · QA/Testing Lead · Maintainer · Sweeper

M2
**Gap:** The Action Ledger has NO branch for failing tests. In `angle_rows` the per-corpus loop tests `not cases` then `skipped`, and everything else — including a corpus with failing cases and zero skips — falls to the `else` that appends it to the CLOSED-green "N green" list. So an entity with a red suite emits no "fix the failing cases" move AND is stamped green in the ledger's "Closed this build" line. The whole design thesis is "action leads, record follows," and the lead surface silently drops the single most urgent action a developer has; failure survives only in the title pill and the Tests tab — exactly the "record" the redesign demoted beneath the action.
**One-liner:** Failing tests emit no move, get stamped green
**Effort:** S (confident)
**Lose:** On any build where a corpus has one failing case with zero skips, the Action Ledger (the page's lead) shows no move for it and prints "integration — N green" among the Closed-this-build tags; a reader who trusts the ledger concludes the entity is clean while a suite is red — the loudest possible false pass, on the page built to name gaps.
**Evidence:** `_a3_feature.py:588-589` `else: closed.append(f'{kind} — {inv[key]["cases"]} green')`. The branch (lines 578-589) reads `not inv[key]["cases"]` and `inv[key]["skipped"]` but never `inv[key]["failed"]` — `grep -n failed` shows `failed` used at 91/141/426/874/1075/1111/1269 but 0 hits inside `angle_rows` (555-645). Closed-this-build render at `:998-1002`.
**Fix:** Add `elif inv[key]["failed"]:` before the skipped branch, emitting a high/ripe "fix the N failing case(s)" move; never let a failing corpus reach the green `else`.
**Raised by:** Domain Expert

── HIGH ──

M3
**Gap:** Ripeness — the ledger's entire ripe-now/later prioritization axis and the dashboard's Ripe column — is computed against a hardcoded `maturity='mvp'`. `angle_rows` defaults `maturity='mvp'` (:557) and `build_feature_pages` calls it WITHOUT the argument (:903); the `ctx` SimpleNamespace never carries maturity even though `_center_data` already returns a `maturity` key. The stat strip then prints the literal "mvp" captioned "from BEHAVIOR.md," and the sechead sub hardcodes "(project maturity: mvp)" — nothing reads BEHAVIOR.md. So the ripe split `_MATURITY_ORD[stage] <= _MATURITY_ORD['mvp']` is computed against a constant, and the page invents a provenance for it — a direct violation of anti-curation law 1 and D7 "block lies."
**One-liner:** Maturity nailed to 'mvp', caption lies 'from BEHAVIOR.md'
**Effort:** S (confident)
**Lose:** On any non-mvp project (gastify transaction is a shipped payments feature, unlikely to be mvp-tier) every enterprise-stage move renders "later" when it is ripe, and the page shows "maturity: mvp — from BEHAVIOR.md" as visible FALSE provenance — a fabricated source on the exact page built to name gaps, not fake them.
**Evidence:** `_a3_feature.py:557` `maturity: str = "mvp"`; `:903-905` call omits the arg; `:946` sub "(project maturity: mvp)"; `:973` `(_KPI_TREND, "mvp", "maturity", "from BEHAVIOR.md")`. `ctx` @ `build_center_a3.py:1160-1166` has no maturity key; `_center_data.py:182` returns `"maturity": ""`. Rendered `feature-transaction-action-ledger.html` contains both "from BEHAVIOR.md" and "project maturity: mvp."
**Fix:** Thread PLAN/BEHAVIOR maturity through `_center_data → ctx → angle_rows` and the KPI/sechead; render the real value. If unreadable, render an honest gap ("maturity not declared") via `gap()`, never a literal "mvp · from BEHAVIOR.md."
**Raised by:** Architect · Domain Expert

M4
**Gap:** The redesign's core new component (xtable) and its layout block are styled/scripted ONLY by shell assets that live in a DIFFERENT retrofit lane (Step B) from the generators (Step A), and nothing gates the two together — yet Step D regenerates the twins after A+B land. A regen after Step A alone ships broken pages estate-wide. Three manifestations, one coordination gap: (1) shipped `assets/a3.css` carries ZERO `.xtbl/.xrow` rules, so the data-model, test-matrix and proof-shelf render as unstyled stacked cells until `proposed-a3css-additions.css` is hand-folded AFTER the base — its `--content-max` block redefines `.subject/.tabbody/.subjecthead` max-width, which the base ALREADY sets (1400/1060/1060) at the same specificity, so source order decides and a wrong-position fold silently no-ops the layout redesign (or leaves two rules per property where editing the original 1400px line does nothing — the "I changed it and nothing happened" trap); (2) `rowclick.js` is referenced in ZERO of the 8 station skeletons; (3) `a3-lightbox.js` must be REPLACED, not merged. Both approved examples hide all of this because they INLINE the CSS/JS, so they never exercise the shipped pipeline.
**One-liner:** Regenerate with new .py, stale a3.css → unstyled tables everywhere
**Effort:** M (confident — mechanical fold+wire, but across a 44KB CSS file and 8 skeletons, order-sensitive)
**Lose:** Operator approves the rich demo, runs Step D after only copying `generators/*.py`, and every feature page renders its data model / test matrix / proof shelf as unstyled stacked text with no expand affordance — the flagship redesign ships looking broken; and if the layout block folds before a3.css:236 the rail-widening/content-max layout silently does nothing while a maintainer edits the dead original 1400px line to no effect.
**Evidence:** shipped `assets/a3.css`: `grep -cE '\.xtbl|\.xrow' → 0`; base `a3.css:235-237` `.subject{max-width:1400px} .tabbody{max-width:1060px} .subjecthead{max-width:1060px}` vs `proposed-a3css-additions.css:36-40` `:root{--content-max:1120px}` … `.subject,.subjecthead,.tabbody,.tabbar{max-width:var(--content-max)}` (README:58-63 "layout rules must load AFTER the base rules"). `grep -rln rowclick templates/center/shell/ → 0`. Examples inline it: `grep -c '\.xtbl{' feature-allergen-action-ledger.html → 1`.
**Fix:** Add a build/doctor guard that FAILS if a generated page emits `.xtbl` while the sibling `a3.css` lacks a `.xtbl` rule (and if a skeleton emitting `rowclick` markup lacks the `<script>`). Fold the CSS at the END of a3.css and DELETE the superseded lines 235-237 — hoist width to `--content-max` in ONE place. Treat A+B as one atomic commit, not two lanes.
**Raised by:** Builder · Maintainer

── MEDIUM ──

M5
**Gap:** The generator that prices the god-file tax on other files is itself the worst offender in its own directory, and the branch-trees the design says it "replaces" were never removed. `_a3_feature.py` grew 808 → 1293 lines in this redesign — 62% over the suite's 800-line budget (CLAUDE.md) and deep into the red band this same file renders via `_lines_grade`. `growth_rows` (:226), `unverified_risks` (:361) and `risk_cells` (:334, only called by the dead `unverified_risks`) are superseded by `angle_rows` — the comment at :497 literally says "Replaces the growth_rows / unverified_risks branch-trees" — but ~180 dead lines still ship.
**One-liner:** The god-file grader is a 1,293-line god file with dead branch-trees
**Effort:** S (confident)
**Lose:** The suite's own size-budget gate fires on the retrofit commit, the "branch-trees replaced" claim is contradicted by the file itself, and a future reader can't tell the live derivation (`angle_rows`) from the dead one still sitting beside it.
**Evidence:** `wc -l`: shipped 808, handoff 1293. `growth_rows/unverified_risks/risk_cells` defined but no live call site (`risk_cells` only called inside dead `unverified_risks`). `_a3_feature.py:497` "# … Replaces the growth_rows / unverified_risks branch-trees." Same file renders the >800 red grade at `_lines_grade:542`.
**Fix:** Delete `growth_rows`, `unverified_risks`, `risk_cells` and their orphaned constants; if still >800, extract the Action-Ledger block (`angle_rows/_ledger_render/action_table/_stat_strip/claim_verdicts`) into `_a3_ledger.py`, matching the `_a3_code`/`_a3_evidence` split.
**Raised by:** Architect

M6
**Gap:** The 800→2000 line-grade colour ramp is hand-copied into two files (AP9). `_lines_grade` (`_a3_feature:542-552`) and `_lines_cell` (`_a3_code:305-314`) share identical arithmetic — cap 800, span 1200, 0xE5→0xB7 / 0x73→0x1C — and README move #7 states the intent that they read as the SAME signal. Yet they already differ: `_lines_cell` emits `{n}`, `_lines_grade` emits `{n:,}`. Two sources of truth for one grading rule, drifted on formatting at birth and set to drift on threshold the first time the 800 budget moves.
**One-liner:** Two copies of the 800→2000 red ramp, already drifting
**Effort:** S (confident)
**Lose:** The structure-move grade and the code-map grade are meant to read as one signal but are two constants; change the budget in one and the two Lines columns silently disagree, exactly when a reader trusts them to match.
**Evidence:** `_a3_feature.py:542-552` vs `_a3_code.py:305-314` — identical frac/rgb math; formatting already divergent (`{n:,}` vs `{n}`). README move #7 "structure line counts are red-graded like the code map's Lines column."
**Fix:** Hoist the ramp into `_a3_render` (e.g. `lines_grade(n, thousands=True/False)`) and call it from both feature and code, so the budget and curve live once.
**Raised by:** Architect

═══ ENTERPRISE ═══

── HIGH ──

E1
**Gap:** The claim→junit join keys on the pytest CLASS / vitest describe NAME, not the C-id the card advertises. `_match()` (:809-812) matches a claim key against observed `cls` strings; C-ids are only harvested (:806-807) for display INSIDE an already-class-matched row. Two failure modes fall out of the one wrong key. (a) RENAME → false DRIFT: a refactor that renames a claimed class — the exact event C-ids exist to ride through (verification-first: "never path-keyed (renames), never phase-scoped") — leaves every C-id inside it running yet renders the claim "DRIFT — claimed, not running," a D7 lie, while README move #4 promises "joined to junit by C-id" (self-contradicted by its own step C "class — intent per line"). (b) COLLISION → false running: `_match` is short-name greedy (`cls == key OR cls.endswith('.'+key) OR basename == key`) and a claim is "verified" on ANY non-empty hit, so a renamed/deleted class whose short name is reused by a DIFFERENT class in the same entity matches → drift masked as running, and `n`/C-id sets are summed across all matches under `observed[hits[0]]`'s corpus.
**One-liner:** Claimed coverage joins on class name, not the advertised C-id
**Effort:** M (confident on the rename false-DRIFT; the collision arm is uncertain — depends on the project's test-class naming)
**Lose:** The one feature whose entire purpose is catching drift is wrong in both directions: the first class rename after retrofit turns a still-green claim into DRIFT (a promise reported broken that the tests are keeping), and a promised class quietly renamed shows green "running" when an unrelated same-named class exists. The suite's central C-id-as-identity invariant ships silently unhonored inside its own accumulator, and the C-id column is decorative.
**Evidence:** `_a3_feature.py:809-812` `_match`: `cls == key or cls.endswith("."+key) or cls.rsplit("/",1)[-1]==key`; C-ids gathered only at `:806-807`; verdict `:814/:823-844` `verified += 1` on any hit, `n = sum(...)`, `cids = sorted({...})`, `_corpus = observed[hits[0]]['corpus']`; DRIFT at `:845-850`. Rendered claim keys in `feature-transaction-action-ledger.html` are class names (`TestBatchOperations`, `test_transaction_drafts`). `README.md` move #4 vs step C (self-contradiction); `verification-first/README.md:107-113`.
**Fix:** Key CLAIMS on the case-carried C-id(s) and match by the C-id the cases already stamp, making DRIFT rename-proof; flag a distinct "ambiguous match" state when a claim matches >1 observed class or matches by short name only; require the qualifier when a short name is non-unique. Reconcile README move #4 / step C to the chosen key. OR drop the "by C-id" language and rename the verdict to a class-scoped honest one.
**Raised by:** Architect · QA/Testing Lead

E2
**Gap:** The Tests tab and the new Claimed-coverage join have no junit provenance guard. When a corpus junit is ABSENT (`load_junit → None`, `(j or {}).get('files',{}) → empty`), `observed` is empty and EVERY authored claim renders "DRIFT — claimed, not running" — a class-removed verdict caused by a missing file, not a removed test. When junit is STALE (present but predating HEAD), the Kinds table still hardcodes the green "captured at HEAD" and the running/DRIFT verdicts are computed against the old run. The feature page surfaces no `ranAt`/`mtime`/SHA anywhere (0 hits for `rel_age`/`ranAt`), and `build_center_a3.py:930-935` notes the default regen path does not re-run any suite.
**One-liner:** Missing junit paints every claim DRIFT; stale junit still says HEAD
**Effort:** M (confident)
**Lose:** A CI hiccup or a mis-set results path that emits no junit flips the entire Claimed-coverage table to red DRIFT on every entity; a routine regen-without-retest leaves "captured at HEAD" asserting a currency nobody verified — the verification-first center reporting a false pass and a false alarm from the same missing fact.
**Evidence:** `entity_corpus _a3_feature.py:86-87` `j = junit_by.get(c['key'])` / `(j or {}).get('files', {})`; `claim_verdicts` builds `observed` (:795-807) then emits DRIFT for zero hits (:845-850); `kind_state:144` returns `captured at HEAD` (inherited, not fixed by the redesign); junit parser DOES carry `ranAt`+`mtime` (`_results_ingest.py:87-89`) but the retrofit page uses neither.
**Fix:** Guard the Claims/Kinds surface on junit presence+freshness: if a corpus has zero loaded cases, render a "junit absent — drift unknown" banner instead of blanket DRIFT; stamp each corpus's `ranAt`/`mtime` (and, where a digest exists, `head_sha` vs HEAD) beside "captured at HEAD."
**Raised by:** QA/Testing Lead

── MEDIUM ──

E3
**Gap:** The title-bar cases pill colours on `own_failed` only, so an entity with a card but zero matching tests (`own == 0`) renders GREEN "ok" reading "0 cases · 0 failed." Neither approved example exercises this — allergen has 58 matched cases, transaction 228 — so the genuine zero-data / not-yet-built render was never in the review surface.
**One-liner:** A not-yet-built entity shows a green '0 cases · 0 failed'
**Effort:** S (confident)
**Lose:** The first feature page of a freshly-adopted entity (card authored, feature not built, regex matches nothing) opens with a green pass pill — the loudest false-pass a page can make, on exactly the entity that most needs a red flag. The file elsewhere warns against this class of false-pass pill.
**Evidence:** `_a3_feature.py:1268-1271` `f'<a class="statuspill {"warn" if own_failed else "ok"}" …>{own:,} cases · {own_failed} failed</a>'` — `own==0, own_failed==0 → 'ok'` (green); `own` @ `:873`. Rendered allergen pill "statuspill ok … 58 cases · 0 failed" masks the zero case; contrast the `:1260` comment about a green pill read as a false entity verdict.
**Fix:** Treat `own==0` as its own state — grey/amber "no cases yet," not "ok" — so the emptiest entity never wears a pass colour.
**Raised by:** Maintainer

E4
**Gap:** The claim-DRIFT verdict — a headline capability of this redesign — is never exercised as a LIVE row in either approved example. The transaction demo resolves all 21 claims as "running" (0 drift) and the allergen example has no `# CLAIMS` at all, so the only DRIFT strings on the review surface are legend/explainer text. The branch that renders a real drifted claim (`claim_verdicts:845-850`) shipped its approval without a single rendered instance to check.
**One-liner:** DRIFT row branch approved without ever being rendered
**Effort:** S (confident — add one drifted-claim fixture to the dry-run and eyeball the row)
**Lose:** A markup or logic bug in the DRIFT row (a mis-closed span, wrong cell count vs the running-row's 5 cells, bad tag class) ships unseen because neither approved example triggered it, and it first appears — on a real project — exactly when a claimed class stops running, the moment the operator most needs the signal to be right.
**Evidence:** `grep -oE 'DRIFT[^<]{0,40}' feature-transaction-action-ledger.html` → only legend text; `grep -c 'DRIFT — claimed' → 0` live rows. README:88-90 dry-run "resolves 21 claims" — all running. Branch `_a3_feature.py:845-850` emits `'DRIFT — claimed, not running'` and a flat detail vs the 5-cell running row.
**Fix:** Add a fixture entity whose card claims a class NOT in junit, regenerate, and confirm the DRIFT row renders with the right cell count and closes flat — then the approved surface actually proves the feature it advertises.
**Raised by:** Builder

E5
**Gap:** `collect_set()` trusts the SHAPE of `manifest.json` after a successful `json.loads`: `legs` is assumed dict (`legs_def.items()`) and `narration` assumed dict (`.get('legs',…)`). A structurally-valid-but-wrong manifest — `legs` authored as a list, or `narration` as a string — raises AttributeError inside `build_evidence_tab`, and `build_feature_pages` wraps the per-entity build in no try/except, so a single bad manifest aborts the whole center build and NO feature pages regenerate.
**One-liner:** One malformed manifest and zero feature pages regenerate
**Effort:** S (confident)
**Lose:** A hand-edited or tool-emitted manifest with legs-as-a-list stops the entire center from regenerating; the operator sees a stack trace and a stale center instead of one entity's evidence tab degrading to a named gap.
**Evidence:** `_a3_evidence.py:145` `legs_def = man.get('legs', {}) or {}` (a list survives `or {}`) then `:149` `for leg, pres in legs_def.items()`; `:144` `notes = (man.get('narration', {}) or {}).get('legs', {}) or {}` (a string survives `or {}` then `.get` throws). `build_feature_pages` loop and its evidence call (`_a3_feature.py:1206`) have no per-entity guard.
**Fix:** Validate manifest field types after load (coerce non-dict legs/narration to `{}` with a named-gap note), and/or wrap each entity's build in try/except that degrades that page to a gap rather than failing the whole run.
**Raised by:** QA/Testing Lead

E6
**Gap:** `GABE_CENTER_OUT` redirects EVERY center write (pages, assets, archmap, run-history, architecture) to an env-named dir, silently — no print, no note, no guard — and it ships live in `build_center_a3.py`, not gated behind a `--lab` flag. Its sibling `GABE_SHELL_SRC` at least announces itself ("(env override)"). This is the "leftover lab scaffolding that changes behavior" risk: a normal `/gabe-feature` regen inherits a stray/leaked `GABE_CENTER_OUT` from a dev or CI shell and writes the whole center to a scratch dir while printing "A3 regen OK."
**One-liner:** A leaked GABE_CENTER_OUT silently writes the center nowhere useful
**Effort:** S (confident — strip the env overrides at retrofit, or print a loud note)
**Lose:** A `GABE_CENTER_OUT` left set in someone's shell profile or CI env makes every regen write to the scratch dir and report success; the operator ships a stale `docs/site/center` believing it just refreshed, with zero on-screen signal that writes were redirected.
**Evidence:** `build_center_a3.py`: `grep CENTER_OUT | grep -iE 'print|note|warn' → 0` (silent). Contrast `resolve_shell()` 96-98 `return Path(env), f'shell: {env} (env override)'` — the shell override IS announced. Default is safe when unset (`CENTER_OUT=CENTER`), so this is a leak/collision footgun, not a wrong-when-unset bug.
**Fix:** Per README's own "keep or strip at retrofit" — strip the `GABE_*` overrides from the shipped copy and keep them in a separate lab driver; or, if kept, print "WRITE redirected to <dir> (GABE_CENTER_OUT)" at the top of the run like `resolve_shell()`.
**Raised by:** Builder

E7
**Gap:** The 8-column `.tbl.wcol` Action Ledger and 6-column Risk table use `table-layout:fixed` with percentage colgroups inside a `.panel{overflow:hidden}` wrapper, but unlike `.xtbl` (which got a `@media(max-width:760px)` that hides its middle columns) they have NO responsive rule and no horizontal-scroll fallback. At tablet/phone widths the fixed percentages squeeze columns to ~40-60px with `word-break:anywhere`.
**One-liner:** Eight-column fixed ledger has no narrow-screen escape
**Effort:** S (confident)
**Lose:** On the very tablet/phone widths the center already writes `@media` rules for, the redesign's centerpiece collapses into a wall of vertically-stacked characters (Effort 6% and Stage 8% columns unreadable), with no sideways scroll to recover it — the Action Ledger becomes the one table that does not survive a narrow viewport.
**Evidence:** `proposed-a3css-additions.css:27-29` `.tbl.wcol{table-layout:fixed}…word-break:break-word` and `:42` with NO `@media`, vs `:22` `@media(max-width:760px){.xhead{display:none}…}` for xtbl; base `a3.css:137` `.panel{…overflow:hidden}` clips rather than scrolls. `_LEDGER_W = [11%,19%,11%,6%,8%,15%,16%,14%]` (`_a3_feature.py:761`).
**Fix:** Give `.panel` (or `.tbl.wcol`) `overflow-x:auto` under a breakpoint, or add a `.tbl.wcol @media` that drops to fewer columns / stacks label+value — the same treatment `.xtbl` already got.
**Raised by:** UX/UI Designer

E8
**Gap:** The retrofit introduces a second expandable-row engine (`xtable`/`.xrow`) alongside the existing one (`table(expand=…) → tr.exp`) and then ships both permanently. `xtable()` (`_a3_render.py:146`) plus its `.xtbl/.xrow` CSS and the `rowclick.js`/`a3-lightbox.js` `.xrow` branches duplicate ~80% of what `table(expand=)/tr.exp` already did. The migration only half-lands: feature pages moved galleries to `xtable`, but the `tests.html` corpus table still uses `table(expand=)` (`build_center_a3.py:566`). Net: two row-expand idioms maintained forever — and `a3-lightbox.js`'s entire legacy `tr.exp` GALLERY path is now unreachable, because the only producer of `data-lb` anchors (`_a3_evidence._tile`) renders exclusively inside `xtable`. Neither example exercises it.
**One-liner:** Two row-expand engines shipped; the lightbox's tr.exp path is dead
**Effort:** M (uncertain — depends on whether the station tables also migrate to xtable)
**Lose:** Every future change to row-expand behaviour must be made twice and kept in sync across two DOM shapes and two JS branches; the `a3-lightbox` `tr.exp` gallery code can never fire so it rots silently — the exact hand-synchronised-in-two-places trap the Action Ledger's own comment (:496-501) claims to be retiring, re-created one layer down.
**Evidence:** `grep` on `feature-transaction-action-ledger.html`: 70 `class="xrow` / 0 `tr class="exp"`. Only `data-lb` producer is `_a3_evidence.py _tile()`, called solely from `build_evidence_tab → xtable`. `a3-lightbox.js:151` `scope = a.closest('.xrow') || a.closest('tr.exp') || …` and `:203` `d.classList.contains('more') && d.closest('tr.exp')` — the `tr.exp` arms have no reachable input. README:66-68 says the copy "keeps the legacy tr.exp path" but nothing emits it.
**Fix:** Either migrate the two remaining `table(expand=)` station tables to `xtable` and delete the `tr.exp` path from CSS + both JS files, or keep `tr.exp` and don't add `xtable` — do not ship both. If the `tr.exp` branch must stay for a future generator, add a fixture page that exercises it.
**Raised by:** Sweeper

── LOW ──

E9
**Gap:** The retrofit adds a `kpi(icon=…)` parameter to `_a3_render.py` (with a full inline-svg branch) that no caller ever uses — `grep 'icon='` across all six retrofit generators returns zero hits, and no generated `.kpi` carries an svg. Separately, `_a3_feature.py` introduces four `_KPI_*` glyph constants for the stat strip, two of which (`_KPI_SEED`, `_KPI_CHECK`) are byte-identical duplicates of `_IC_SEED`/`_IC_CHECK` already defined at the top of the same file. The stat strip builds its own svg in `_stat_strip()` and does not route through `kpi()`.
**One-liner:** kpi(icon=) never fed an icon; _KPI_ glyphs re-type _IC_
**Effort:** XS (confident)
**Lose:** Dead parameter surface plus copy-pasted glyph paths that will drift when one copy is edited and the other isn't — small, but exactly the un-exercised, duplicated cruft this pass exists to catch, added in the same change that preaches single-derivation.
**Evidence:** `grep -rho 'icon=' …/generators/*.py → 0` `kpi(icon=)` calls; rendered page has 0 `.kpi .lab><svg`. `_a3_feature.py:508-509` `_KPI_SEED` is character-for-character `_IC_SEED` at `:59-60`; `_KPI_CHECK:513-514 == _IC_CHECK:38-39`.
**Fix:** Drop the `kpi(icon=)` param and its svg branch until a caller needs it; reuse `_IC_SEED`/`_IC_CHECK` for the stat strip instead of the duplicate `_KPI_` constants (keep only the genuinely-new `_KPI_CLOCK`/`_KPI_TREND`).
**Raised by:** Sweeper

═══ SCALE ═══

── MEDIUM ──

S1
**Gap:** The "one move, one domain" invariant rests on four hand-synced lists (`_ACTION_DOMAIN` values, `_DOMAIN_META` keys, `_DOMAIN_ORDER`, and the literal tuple in the `_dom_rows` comprehension). `_dom_rows` covers only `('code','tests','evidence','other')`; a ledger row whose domain is anything else is silently dropped from every action table while still counting in `len(ledger_rows)`.
**One-liner:** Add a move-domain, its rows vanish from every table silently
**Effort:** S (confident)
**Lose:** When a new move type arrives (the brief anticipates this) and someone maps it to a fresh domain, the move is counted in "open moves" but rendered nowhere — or KeyErrors in `_DOMAIN_META[d]`. Precisely the silent-drift class this generator exists to kill, reintroduced one refactor away.
**Evidence:** `_a3_feature.py:913` `_dom_rows = {d: [r for r in ledger_rows if r["domain"] == d] for d in ("code","tests","evidence","other")}`; `_ACTION_DOMAIN:678`, `_DOMAIN_META:685`, `_DOMAIN_ORDER:692` (includes 'risk', which `_dom_rows` does not); `angle_rows` sets `"domain": _ACTION_DOMAIN.get(kind, "other")` (:576).
**Fix:** Derive the bucket set from `_ACTION_DOMAIN.values()` (plus 'risk') rather than a literal tuple, and assert every ledger row lands in a bucket that has a `_DOMAIN_META` entry — raise loudly on a missing mapping.
**Raised by:** Maintainer

───────────────────────────────

drafted 44 → deduped to 16 → reported 16
TOTAL: 16 gaps — 2 critical, 4 high, 9 medium, 1 low
Effort estimate: XS–M — most fixes are S/confident; three M (E1, E2, E8) and one XS (E9). E1's collision arm and E8's scope depend on the project's test-class naming and whether the station tables also migrate. Two Criticals (M1, M2) plus the D7 provenance lie (M3) and the two-lane fold-in trap (M4) are the block-before-promote set.
```

## Completeness critic — the uncovered hole (+ 2 neighbours)

## The uncovered hole: Code-tab cross-reference links now dead-end on a collapsed row

The panel roasted the Overview ledger (counting, hardcoded `mvp`), the Tests join (C-id vs class-name, DRIFT, failing-stamped-green), the Code map's line-grade dup, the god file, the CSS/env/propagation seams, and the lightbox's dead `tr.exp` path. **Nobody tested the data-model cross-reference navigation that the `xtable` migration silently broke.**

### The specific thing, with citations

The whole Code tab is built on "compose by reference — a field typed as another documented class **LINKS** to it instead of repeating its structure" (the data-model info block in `_a3_code.py`, `link_types()` / `returns_cell()` / `defines_cell()`). Those cross-links are everywhere: in `templates/center/shell/example/feature-transaction-action-ledger.html` the Returns column and Defines column emit dozens of `href="#dm-transaction-<Class>"` (e.g. `#dm-transaction-TransactionDetail` ×4, `#dm-transaction-BatchResult` ×3, `#dm-transaction-Transaction` ×3).

The retrofit (`docs/handoff/2026-07-22-action-ledger/generators/_a3_code.py`) moved every target class from the shipped `dm_card()` — a `<div class="panel" id="dm-…">` whose **header row is always visible**, columns folded behind an inner `<details>` (shipped `_a3_code.py:549,556`) — into `xtable(…, _anchor("dm",slug,cls))`, so the id now sits on **`<details class="xrow" id="dm-transaction-Transaction">`**, closed by default (confirmed in the rendered example).

Nothing reopens a targeted `<details>`:
- **CSS**: grepping `assets/a3.css` + `proposed-a3css-additions.css` for `:target` open rules finds only tab/diagram-picker `:target` rules and `.xrow[open]` styling — there is **no `.xrow:target` / `details:target` open rule**. `:target` never sets the `open` attribute.
- **JS**: no `hashchange` / `location.hash` / open-on-target handler exists. `rowclick.js` explicitly `return`s on `e.target.closest('a')` (links navigate, never open the row); `a3-lightbox.js`'s only `.open=true` is the proof-leg cascade.

**Failure mode:** a reader clicks "returns `TransactionDetail`" (or a violet Defines class chip). The tab machinery works — `.subject:has(#tab-code :target)` reveals the Code tab and scrolls to the row — but the columns/types/relationships they clicked to see stay **hidden behind the collapsed summary**. They land on a closed row that looks like they clicked nothing. The pre-redesign version at least landed on a visible header card naming the class and its fields-toggle. The README dry-run papers over exactly this: it asserts the cross-links "all **land on** their (now-`.xrow`) class rows" — it verified they *land*, never that they *reveal*. This is a navigation/data-join regression the redesign introduced and no finding priced.

### Two smaller un-roasted items (same neighborhood)

- **No-JS / a11y break in the Evidence xtable.** `build_evidence_tab` puts `pmore(...)` cells (story, feature, source_run) into `xtable` rows, so a `<details class="pmore">` nests inside the `<details class="xrow">` **`<summary>`** — invalid HTML (`_a3_evidence.py:279,288-291` → `_a3_render.xtable`). `rowclick.js` handles the click *with* JS, but the suite's repeated "works with JS off, a click simply opens it" promise is void here: with JS off, clicking the inner ⊕ toggles the outer row instead. The Code-tab data-model xtable avoids this (no `pmore` in its cells); Evidence is the one that regressed.

- **Two ledger moves that can never close.** In `angle_rows` (`_a3_feature.py:601-619`), `add("coverage", …)` and `add("deployed", …)` are unconditional with no branch that ever moves them to `closed` — so every entity's "open moves" count is permanently ≥2 and can never reach the honest-empty "clear this build" state the ledger advertises. Not a counting-drift bug (that family is covered), but an honest-signal gap: a move that can't be closed is decoration, not an action item.

---

## Verified clean (the panel cleared these — do NOT chase them in the retrofit)

The QA lens explicitly ran these down and found them sound:

- **`# CLAIMS` is escaped before HTML injection** — `claim_verdicts` uses `E(key)` for the class and `md(intent)` which calls `html.escape` first. No injection surface.
- **No 800-line off-by-one** — `_lines_grade(800)`=green, `over_files` uses `n>800`, `_lines_cell(800)`=green. Exactly 800 is within budget, consistently.
- **Allergen honest-empty renders a clean placeholder**, not a broken shell — "no claims authored for this entity yet" (gated at `_a3_feature.py:1124`).
- **Each ledger row carries exactly one domain** — no move's *row* renders twice across a section + Overview (Overview "Other" is count-in-summary + detail-table, not a double render). *(Note: M1 is a COUNTING double-book at the machine-gap/authored-risk seam — a different issue from row double-render.)*
- **`+N→expand` does NOT drop cases** — the row detail (`case_rows`) lists every case.
- **Cross-corpus `observed` key collision not realistically triggerable** — pytest dotted-module vs vitest file-path classnames never collide.

---

## Retrofit fix-order (maps gaps → the retrofit steps)

1. **Generator correctness (Step A source), before any regen:** M1, M2, M3 (honest-signal lies) · E1, E2 (Claimed-coverage correctness) · E3 (own==0 green pill) · E5 (manifest robustness) · S1 (domain-list drift guard).
2. **De-cruft the generators (Step A):** M5 (delete dead `growth_rows`/`unverified_risks`/`risk_cells`; split if still >800) · M6 (hoist the line-grade ramp to `_a3_render`) · E9 (drop `kpi(icon=)`, reuse `_IC_*`) · E8 (resolve the two row-expand engines / dead `tr.exp` path).
3. **Shell fold-in as ONE atomic step (Steps A+B together):** M4 (fold CSS at END of a3.css + delete superseded width lines; wire `rowclick.js` into skeletons; REPLACE `a3-lightbox.js`; add a build/doctor guard that fails when a page emits `.xtbl` but the sibling a3.css lacks `.xtbl`) · C1 (add `.xrow:target{...open}` CSS or a `hashchange` opener so type-links reveal the row) · the Evidence-xtable no-JS nesting a11y item · E7 (narrow-screen escape for the 8-col ledger).
4. **Prove it before promote (Step D dry-run):** E4 (add a drifted-claim fixture so the DRIFT row is actually rendered once) · E6 (strip/announce `GABE_CENTER_OUT`) · then regen both twins and re-verify 0 dead links + the counts reconcile.

---

## Fixes APPLIED — 2026-07-22 (all in the retrofit source, dry-run-validated)

The operator ruled **fix everything (16 + 3 adds)**. All were applied to
`docs/handoff/2026-07-22-action-ledger/generators/` + `shell-assets/` and validated
by a read-only dry-run of the FIXED generators against **both live twins** (gustify
`allergen`, gastify `transaction`+`scan-receipt`), writing only to scratch — **both
twins' `docs/site/center/` verified untouched (0→0 dirty)** on every run.

| Gap | Fix | Validation |
|---|---|---|
| **M1** | one move universe (`_moves_total`/`_moves_ripe`) feeds strip + pill + dashboard | strip **10** = pill **10** = dashboard **10** (was 6/6/10) |
| **M2** | `angle_rows` failing branch — a red corpus emits a ripe "fix the failing cases" move, never reaches the green `else` | synthetic red corpus → ripe move, not closed-green |
| **M3** | `_center_data.load_maturity()` reads `.kdbp/BEHAVIOR.md`; threaded via `ctx`; honest "not declared · assuming mvp" fallback | page renders `maturity: mvp` + "from BEHAVIOR.md" (now **true**) |
| **M4** | build guard: refuses success (exit 3) if pages emit `.xtbl` but the copied `a3.css` has no `.xtbl` rule; sharpened CSS fold banner (delete superseded base widths) | guard **fires** on stale-css shell, **passes** on folded shell |
| **M5** | dead `growth_rows`/`unverified_risks`/`risk_cells`/`_GROWTH_LINK`/`_SEV_ORDER` deleted (1294→1160 lines). **File-split DEFERRED** (see below) | AST-clean; dead symbols = 0 refs |
| **M6** | `lines_grade(n, thousands=)` hoisted to `_a3_render`, called from feature + code — one budget, one curve | both call sites use the shared fn |
| **E1** | claim join keyed on class **name** (honest), ambiguous-state on multi-match, C-ids display-only; README move #4 reconciled | **21 running / 0 drift** restored; synthetic DRIFT+ambiguous render |
| **E2** | junit guard is **per-corpus** (`junit_complete = all(present)`, using the carried `present` field): DRIFT only when EVERY corpus loaded, else "drift unknown" — catches the partial outage (pytest ran, vitest didn't). `kind_state` shows capture **time**, not "at HEAD" | web-absent synthetic → **11 running / 0 false DRIFT / 10 unknown** (was 11/10-false/0); "captured at HEAD" = 0 |
| **E3** | `own==0` → amber "no cases yet", never a green pass pill | logic verified (no own==0 entity in the twins to render) |
| **E5** | `collect_set` coerces non-dict root / `legs` / `narration` / `artifacts`; leaf values coerced too (`spec`/`story`/`proof_form`/`feature`/leg-note); plus a per-entity `try/except` backstop degrades a bad Evidence tab to a named gap | **all-fields-wrong** manifest renders 4,909 chars, no crash; empty/absent set still renders |
| **E6** | `GABE_CENTER_OUT` announced loudly at run start | "⚠ WRITE redirected …" printed every lab run |
| **E7** | `.tbl.wcol` scrolls sideways under `@media(max-width:760px)` | CSS present |
| **E8** | dead `tr.exp` arms removed from `a3-lightbox.js` (only `.xrow` produces `data-lb` now) | `node --check` clean |
| **E9** | `kpi(icon=)` param + svg branch dropped; `_KPI_SEED/_CHECK` alias `_IC_*` (one source) | no duplicate glyph strings |
| **S1** | `_LEDGER_DOMAINS` derived from `_ACTION_DOMAIN.values()`; an unbucketed row RAISES | 0 unbucketed rows; guard live |
| **C1** | `rowclick.js` opens a targeted `.xrow` (+ ancestors) on load/`hashchange`; `.xrow:target` highlight | 35+65 cross-ref links, **0 dead**; `dm-` targets on `.xrow` |
| **a11y** | Evidence xtable summary cells truncate PLAIN (no nested `<details>`); full story moved into the row detail | **0** nested-details-in-summary on both pages |
| **moves-never-close** | coverage/deployed moves gate on `e2e.coverage_sliced`/`deployed_probes` — closable when the capability lands | closes when the config flag flips |

### Adversarial verification round (2026-07-22)

After the fixes landed, a second multi-agent pass re-attacked the PATCHED code (6 clusters
trying to refute each fix / find a regression): **17/20 resolved, 3 real concerns**, all
then closed:
- **E2** was too coarse — a GLOBAL "any junit present" guard let a *partial* outage
  (pytest ran, vitest didn't) still emit false DRIFT for the missing corpus. Fixed to
  **per-corpus** completeness (the panel reproduced 10 false DRIFT → now 10 "drift unknown").
- **E5** coerced containers but not leaf VALUES — `spec` as a list, `story`/`proof_form`/
  `feature`/leg-note as non-strings still aborted the build. Fixed by coercing each leaf +
  a per-entity `try/except` backstop (panel's all-fields-wrong manifest now renders clean).
- The panel also confirmed the other 17 hold, and that the carried-but-dead `present` field
  is now the E2 guard's input.

### The one DEFERRED item — M5 file-split (isolated follow-up, not a blocker)

`_a3_feature.py` is **1,256 lines** after the fixes (the dead-code core of M5 is done).
The remaining 800-budget **file-split** — extracting the Action-Ledger block
(`angle_rows`, `_ledger_render`, `_risk_ledger_render`, `claim_verdicts`, `parse_risks`,
`_stat_strip`, the pricing/domain constants, plus the shared `case_rows`/`_CID_RX`/
`_KIND_CLS`) into a new `_a3_ledger.py` — is a ~450-line extraction with ~20 symbols
imported back and a circular-import hazard on the glyph/`case_rows` shared symbols.

It is **deferred on purpose**: the suite's own size-budget **reports, it does not gate**
(`/gabe-commit` "reports every tier, gates none"), so this does not block the retrofit
commit; and bundling a large mechanical refactor with 17 freshly-validated correctness
fixes would risk them for zero correctness gain. Do it as its own reviewed change:
move the block to `_a3_ledger.py`, keep `entity_corpus`/`kind_state`/`angles_html`/
`action_table`/`build_feature_pages` + the `_IC_`/`_KPI_` glyphs in `_a3_feature.py`,
define `ENTITY_PROOFS` once in `_a3_ledger.py`, then re-run this same dry-run to prove
identical output. (E5's broader per-entity `try/except` folds naturally into that split
by extracting `build_one_feature`; the cited manifest-abort is already fixed by E5a.)
