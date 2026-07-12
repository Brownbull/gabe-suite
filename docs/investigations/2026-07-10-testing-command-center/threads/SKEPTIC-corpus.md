# SKEPTIC — the test-corpus architecture (doc 10)

- **Target:** `output/10-test-corpus-architecture.md` (matrix pages + diagram library + close-out ritual)
- **Date:** 2026-07-12 · house pattern: designs get attacked before they're built
- **Method:** every claim checked against the real gustify repo at HEAD `1a1f943e` (read-only). Mermaid behavior tested EMPIRICALLY through gustify's own render pipeline (`scripts/_render_mermaid.mjs`, mermaid@10), not from memory.
- **Operator locks respected as given:** (a) full inline per-test tables deep-linking to matrix anchors; (b) evolving bases + per-feature highlight overlays. The attack targets the design's *mechanics and omissions*, not the locks.

## VERDICT: UPHOLD-WITH-MODS (8 mandatory)

The core insight survives: angle tables genuinely are projections (registry maps by reference — `center.config.json` `features[]` globs, resolved at build in `_center_data.py:load_features`), and within a single build they physically cannot drift from the matrix. Gap A (tests have no home) and Gap B (diagrams would duplicate) are real. But the doc under-specifies exactly the things that will kill it in execution: it never defines a per-test anchor scheme against junit names that contain brackets, spaces, `<lambda>0`, and 197-char unicode sentences; it re-introduces at finer granularity the committed-HTML-from-gitignored-inputs churn that spike plan v3's own skeptic pass cut; and its flagship "no stale snapshots" claim for evolving bases is empirically backwards — mermaid **silently ignores** highlights on renamed/removed nodes, so old feature pages quietly stop showing their change while still claiming "changed shapes highlighted."

---

## Attack 1 — Anchor stability: the design never defines the anchor, and the names are hostile

**The lock demands per-TEST anchors. The doc's only example anchor is per-FILE.** Line 34 shows `suite-api.html#tests-test_cooking_photos-py` — a file-section anchor. Nowhere does the doc define how a *test row* gets an id. That is the whole hard problem, skipped.

**The names, verified from the real junit** (`tests/results/api-junit.xml`, 1,110 cases; `web-junit.xml`, 415 cases):

- pytest parametrized ids include brackets, **spaces**, tab escapes, positional lambda ids, and unicode:
  - `test_sanitize_resists_whitespace_split_reconstitution[ignore\tprevious instructions]`
  - `test_gemini_call_non_health_errors_do_not_trip[<lambda>0]` / `[<lambda>1]`
  - `test_full_pipeline_one_novel_per_mode[nueva_cocina-Causa Limeña]`
- **All 415** vitest names contain special chars; titles run to 197 chars of prose with em-dashes, arrows, `≤`, quotes, parens (`PersistGate — cross-user isolation (the headline safety test) > user B does NOT see user A's persisted data; B's cache is empty`).
- run-status per-test keys are the same class: `02 unmarking a done step is guarded by a confirm; "Cancelar" is a real no-op…`.

Raw names are not valid HTML ids (spaces) and not sane URL fragments. Any slug function must handle collision (long titles differing only in punctuation truncate to the same slug) — and the current codebase has **no slug function at all**: existing anchors are `id="group-{gname}"`, `id="phase-{id}"`, `id="ticket-{num}"` (`build_center_docs.py:474,342,389`), all from clean-charset names.

**The IDs-derive-from-names rule is violated by parametrized cases.** `build_center_docs.py:15-17`: "IDs/anchors derive from NAMES … never from run data, so regeneration never churns anchors." But `[<lambda>0]` is a *positional* id — insert one param and every subsequent case renumbers. `[nueva_cocina-Causa Limeña]` embeds test *data* — change the fixture dataset and the anchor churns with zero test-code change. Per-test anchors for parametrized tests cannot satisfy the churn rule as named.

**Rename behavior:** feature pages and matrix pages regenerate in the same build (`build_center_docs.py:main`), so *internal* links stay consistent — a rename breaks only external references (COMMS rows, PENDING tickets, operator bookmarks, demo links already sent to someone). That's survivable but must be stated as accepted breakage; the doc says nothing.

**Wound severity: near-kill until Mod 1 exists.** Acceptance 6 of spike plan v3 ("regen ×2 → zero anchor churn") also silently becomes "…on identical junit" — a *re-run* of pytest with dynamic params can churn anchors with no code change.

## Attack 2 — Junit custody: the committed matrix is built from inputs git doesn't have

Verified custody: `tests/results/` gitignored (`.gitignore:97`), `tests/web-e2e/artifacts/` gitignored (`.gitignore:70` — **run-status.json AND pw-report durations are local-only too**, so this trap covers the spec pages, not just the suite pages). Committed: `docs/site/center/*.html` (git ls-files confirms). The committed `tests.html` was built WITH junit present (`pytest · 1110` baked in) and carries build-frozen freshness stamps (`T−26h`) that lie one day later.

**Fresh clone:** no junit, no run-status, no pw-report. The committed matrix *looks* fully populated — good. But the first `python3 scripts/build_center_docs.py` on that machine (e.g., to refresh board.html after a PLAN edit) rebuilds *everything*: `load_junit` returns `None` (`_center_data.py:269-274`), suite pages collapse to the "ARRIVES A4" placeholder row (`junit_station_rows`, `build_center_docs.py:419-424`), spec pages lose all runs (`run-status.json` absent → `group_totals` marks every spec `recorded: False`), and **every feature-page deep link into per-test anchors goes dead in the same commit**. Crucially, `load_features`' loud-fail glob validation is **skipped when junit is None** (`_center_data.py:562-571` — the `if pat and junit` guard), so this build SUCCEEDS silently.

**Poisoning path, confirmed:** `pytest tests/test_recipes.py --junitxml=tests/results/api-junit.xml` overwrites the 1,110-case file with a subset. On regen: if the subset misses another feature's glob, `load_features` dies loud ("matches 0 junit files") — genuinely good, existing teeth. But the natural human "fix" is deleting the stale junit, which flips into the silent-None path above. And if the partial run happens to *include* every registered feature's files (2 features today, trivially satisfiable), the build passes and **~1,000 matrix rows vanish without any gate noticing**. Nothing checks totals against the previous build; `run-history.jsonl` records the drop (1110 → 45) but nothing reads it as a guard.

**The honesty that exists today does not scale by itself.** The "arrives at A4" state and the provenance stamp (`build_center_docs.py:87`) are honest on ONE page a human eyeballs. Across 30+ matrix pages plus two features' deep links, honesty becomes *distributed*: each page is individually honest while the estate as a whole silently regressed. The planned crawl gate (v3 B7, `check_center_links.py` — **does not exist yet in gustify**, verified `grep -r crawl` = zero hits) would catch the dead anchors — which creates the opposite failure: **regen on any machine without a full local test run goes gate-red**, so either every regen now costs a 1,500-test local run, or people learn to skip the gate. Also unaddressed: two git users (Brownbull + khujta) regenerating with different local run states produce wholesale-conflicting 1,100-row committed HTML — per-test rows embed per-case *times* (`_case_table` meta, `_center_pages.py:305`), which differ every run, so suite pages rewrite entirely on every regen even with zero test changes.

**Bonus overclaim found:** the doc promises spec pages with "steps, shots, **history**" (line 29). No per-spec history exists in any source: `run-status.json` holds only the LATEST run per spec (verified shape), and `run-history.jsonl` holds three per-SOURCE totals lines per regen (verified: `journeys/pytest/vitest` only). Spec-page history has no data source.

## Attack 3 — Evolving bases: the silent no-op is real (empirically proven)

Ran gustify's own pipeline on a flowchart containing `class MissingNode changed`:

```
node scripts/_render_mermaid.mjs <b64>   # mermaid@10, the production path
exit=0, empty stderr, valid SVG, zero occurrences of "MissingNode",
zero elements carrying the "changed" class
```

Same for `stateDiagram-v2` with `class GhostState changed`: **exit 0, no error, no highlight.** So the exact scenario in the design — base evolves, a node the old feature highlighted gets renamed (`Persisted` → `PersistedV2`) — produces an old feature page that renders TODAY's topology with **no highlight at all**, under a sublabel still promising "new states highlighted" (`_center_pages.py:519-520`). The page confidently shows *nothing changed*. This is precisely the "confident wrong numbers" class the center's own test suite declares war on (`tests/center/test_center_data.py` docstring), and it inverts the doc's selling line "no stale snapshots": a frozen copy would at least stay TRUE-about-then; an evolved base with a dangling highlight is FALSE-about-now.

**Sequence diagrams are worse — unvalidatable as designed.** The recorded convention (docs-spec §change-highlight; H8's card, `cards/h8-cook-photos.md:52-56`) highlights sequence exchanges with **positional `rect … end` blocks around message lines**. Sequence diagrams have no node ids: when a base gains an exchange above the rect, an injected per-feature rect wraps the WRONG messages — silently, and there is nothing to validate against. Flowchart/state highlights can be guarded (ids are parseable); positional sequence rects cannot.

**Also unspecified:** where highlight sets live (card front-matter? `features[]`? — doc line 40 says "the card references a base," but the card parser `parse_card` has a fixed section contract and no `base:`/`highlight:` syntax), and the mermaid SVG cache (`docs/site/assets/mermaid/<hash>.svg`, committed, 20 files/260K today) mints a new hash per base-version × feature-highlight combination — the orphan sweep is already a pending manual chore (COMMS REV 6); a living library compounds it.

## Attack 4 — Spec cardinality: ×21 is right, but only by unstated luck

Verified: `journey-groups.json` = 8 groups, exactly 21 specs; 21 spec files on disk; disk ↔ registration currently exact. `run-status.json` = **33 keys, 12 of them ghosts** of deleted probe specs (`web-journey-zzprobe-*` ×8, `zzdiag`, `scrim-probe`, `combined-cook`, `recipes-cleanup.teardown.ts`) — run-status is append-forever, never pruned. The design's "×21" implies derivation from journey-groups (correct choice) but never SAYS so, and never states the ghost policy. If anyone ever derives spec pages from run-status keys "because that's where the results are," the matrix mints 12 zzprobe ghost pages. Conversely the doc's own tagline — "the matrix answers *what does the application's harness contain*" — is 12-keys false unless the residue is either pruned or surfaced ("unregistered run residue: N keys"). The earlier crawl's ~10 orphan *artifact dirs* have a v3 disposition (B4 "unregistered evidence"); the orphan *run-status keys* have none anywhere.

## Attack 5 — Two-way links: per-test "verifies" is an overclaim by construction

The registry maps at FILE level (`junit_api_glob` matched against junit file paths, `_center_data.py:567-569`) and SPEC level (`journey_specs`). Case names are never matched by anything. So "verifies: H8" is honest on a file section or spec page; stamped on a per-TEST row it is *inherited*, and it overclaims whenever a mapped file/spec carries tests unrelated to the feature — concretely today: `web-journey-phase64` is mapped to edge-batch AND to the safety-recipes drill; its individual tests span facet/allergen concerns and edge concerns — a per-test "verifies: edge batch" on each of its rows is false for several rows. The doc's line 34 ("every matrix entity lists back 'verifies: H8'") must be scoped to registry granularity or it manufactures exactly the false precision the anti-curation rule exists to prevent.

## Attack 6 — The ritual: steps 2 and 4 have no net under them

What actually catches a forgotten step, per the ritual's 5 steps (all manual until Wave-2):

| Forgotten step | What fires | Verified basis |
|---|---|---|
| 1 (tests) | normal dev gates; not the center's problem | — |
| 2 (registry entry) | crawl-gate **WARN** only, and **only for PLAN-phase features** — the planned WARN keys off "phases absent from the registry" (07-site-arch:106-107). A LEDGER-batch feature (`"phase": null` — edge-batch is exactly this, verified in `center.config.json`) triggers **nothing, ever** | config + 07/08 docs |
| 3 (card) | `load_features` fails LOUD on missing card — but only if step 2 happened. Skip 2+3 together: silence | `_center_data.py:557-559` |
| 4 (diagrams) | **nothing.** `feature_diagrams`: "absent sections are simply absent" (`_center_pages.py:528`). No gate counts base refs, no nudge renders | code |
| 5 (regen+gate) | nothing forces regen; committed pages go stale with only the provenance stamp as witness; the crawl gate doesn't exist yet and is manual when it does | repo grep; v3 B7 "NOT into CI" |

So on the NEXT feature, the two steps the corpus doc was written to systematize — the registry entry and the diagram ref — are precisely the two with the weakest (or zero) enforcement. "The ritual runs itself" is Wave-2; until then the doc should not present a 5-step list with invisible holes as "repeatable process."

## Attack 7 — Diagram governance: shared mutable state with no owner

A base is edited by "the feature that extends the topology" — i.e., **any session, any time, changing every feature page that renders it**, with no review trigger, no listing of affected pages, and (per attack 3) silent downgrade of older pages' highlights. Compare: cards got an explicit editorial contract (D13 amendment, required sections, loud parse failure, review-at-close-out). Bases get none. Missing entirely: naming/granularity rules (is it `cook-session-dataflow` or `cooking-flow`? one base per subsystem or per flow? — at n=10 bases the overlap disputes start), and a **shrink rule**: a base that "evolves with the app" only ever grows, because *removing* a node breaks (silently!) every old highlight set referencing it — the design's incentive structure forces god-diagrams or forces rewriting history. One-way growth is the same decision-debt shape gabe-debt scans for.

## Attack 8 — Contradictions with locked constraints

1. **Anti-curation ("still ONE overlay file," v3 line 6):** `center/diagrams/*.mmd` is a THIRD authored asset class (config → cards → now bases). Cards entered via an explicit recorded amendment with teeth. Bases enter via one bullet in doc 10. A base is arguably *more* assertive than a card: it asserts system topology as fact on every page that renders it. Needs its own recorded amendment + validation teeth, or it is a guardrail breach by accretion.
2. **v3's own skeptic cut, reversed without answering it:** v3 B3 cut per-file pages because "junit is a gitignored local input, 130 committed pages would churn per run"; v3 out-of-scope: "Per-test-file PAGES … escalate later only on operator ask." The operator did ask — the lock legitimately overrides the cut — but the *churn rationale was never re-answered*: doc 10 re-introduces committed-HTML-from-gitignored-inputs at finer granularity (per-test rows with per-case times on 2 suite pages + 21 spec pages) and adds zero mitigation. The objection is not addressed; it is outvoted.
3. **Size budget:** `build_center_docs.py` is at **799 lines** — one under the 800 gate (`gabe-commit` size-budget WARN; verified `wc -l` and `size-budget.sh CAP=800`). `_center_pages.py` 645, `_center_data.py` 623. The matrix (31+ new pages, two-way link plumbing, anchor slugger, highlight injection/validation) does not fit anywhere existing; the doc says nothing about module layout. Any naive execution trips the gate on file one.
4. **IDs-derive-from-names:** see attack 1 — parametrized junit ids break the rule as stated; the rule needs a recorded refinement, not silent reinterpretation.
5. **Skin J / file:// / no-CI:** no direct conflicts found (static pages, same shell, gate stays local). file:// survives; though v3's own "fragment Ctrl-F" argument against splitting listings applies to any future spec-page splitting of suites.
6. **Row-cap conflict:** `_case_table` caps at 120 rows/file with an "… N more" tail (`_center_pages.py:257,270-271`) — v3 acceptance 4 bans truncation without a door; per-test anchor completeness bans it harder (an anchor behind the cap doesn't exist). Doc silent.

## Attack 9 — What the design misses against the operator's stated goal

- **Cost/pricing discipline vanished.** v3 priced every step (+900–1,400 lines, ~2 sessions, stop-loss seam). Doc 10's D-C proposes "build the full canonical set now" with zero line/session estimate and no stop-loss. The matrix set is plausibly bigger than all of CC2a.
- **Demo material angle untouched by the matrix.** The operator's goal list includes demo material; the matrix pages as specced are tables — nothing says whether suite/spec pages participate in the demo-strip/print story or are internal-only. Cheap to state, missing.
- **"Later CI selection" is asserted, not designed.** "The harness already knows groups and criticality" is true (risk_grid), but a CI selection needs a machine-readable export (the grid lives only as rendered HTML); one JSON emission line would make the claim real. Not mentioned.
- **Freshness stamps at matrix scale:** committed per-test rows carry build-frozen `T−2h`-style stamps (rel_age is computed at build; verified `T−26h` strings baked in committed tests.html). Honest-at-build, wrong-at-read. Known class (provenance stamp names the regen), but multiplied ×1,500 rows it deserves a page-level "as of <date>" banner rather than per-row false precision.
- **run-status pruning policy** (attack 4) — the "growing harness" also needs a shedding rule; nothing owns deletion.

---

## MANDATORY MODS (UPHOLD conditional on all 8)

1. **Define the anchor contract in the doc before any build.** One slug function; per-test anchor = slug of file + stable hash suffix of `classname+name` (collision = build failure); parametrized cases anchor at the test-FUNCTION level with param rows as hash-suffixed children; feature-page rows link at registry granularity (file/spec section), not to param rows. Record explicitly: internal links regenerate together (safe); external deep links break on rename (accepted); the CC1 "IDs derive from names" rule gains a recorded refinement covering parametrized ids.
2. **Custody guard on regen.** The build must refuse (or demand an explicit `--accept-shrink` flag) when a junit/run-status source that produced the currently committed matrix is absent or its totals drop beyond a floor vs the last `run-history.jsonl` line. The silent `None`-bypass in `load_features` (validation skipped when junit absent) must not remain the path of least resistance on fresh clones.
3. **Highlight validation, render-time, loud.** For flowchart/stateDiagram bases: parse declared node/state ids from the base `.mmd`; a feature highlight referencing a missing id fails the build (config-typo doctrine). Justified empirically: mermaid@10 silently no-ops missing-node classes through the repo's own renderer.
4. **Sequence bases exempted from evolve-in-place.** Positional rects cannot be validated. Sequence highlights must be either (a) frozen per-feature copies (a recorded D-B exception), or (b) anchored by message-content match that fails loud when the anchor text no longer occurs in the base. No third option ships.
5. **Diagram library = recorded anti-curation amendment with governance.** Registered base list (in `center.config.json`, not a fourth file); naming rule (`<flow>-<kind>.mmd`); base edits print the affected feature pages at build; node rename/removal requires touching every referencing highlight set (enforced by mod 3's failure). State the growth/shrink rule explicitly.
6. **Scope "verifies:" to registry granularity.** File sections and spec pages say "verifies: H8"; per-test rows say at most "in a file mapped to H8" — never per-test verification claims the registry cannot support.
7. **Ritual teeth now, not Wave-2:** extend the crawl-gate WARN to registry-absent LEDGER-only features (the phase-keyed WARN misses `"phase": null` features entirely), and add a visibility line "features with no diagram base ref: N". Pin spec-page derivation to `journey-groups.json` and state the run-status ghost policy (prune or surface; zzprobe residue mints no pages).
8. **Module layout + pricing in the doc.** Matrix builders go in a new `scripts/_center_matrix.py` (`build_center_docs.py` sits at 799/800); remove or door-ify the 120-row `_case_table` cap; add a v3-style line/session estimate and a stop-loss seam for D-C.

## What survives untouched

- The one-line answer (§1) and the reconciliation table (§2) are verified TRUE at build scope: globs resolve by reference, projections regenerate from the same parse, `match_list` renders resolved matches on-page.
- The loud-fail validation culture in `_center_data.py` (`load_config`, `load_features`, `parse_card`) is the right chassis for every mod above — the design's guards should extend it, and mostly can.
- Gap A is real (tests have no home today — verified: feature rows currently link only to `tests.html#group-*`), Gap B is real (H8's three authored diagrams would be redrawn by the next photo feature).
- The ritual's *shape* (5 steps ending in regen+gate) is right; only its unenforced middle is dishonest as written.
