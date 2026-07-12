# The test corpus ("the harness") — one matrix, many projections

- **Date:** 2026-07-12 · **Status:** v2, POST-SKEPTIC (UPHOLD-WITH-MODS, all 8 mandatory mods folded in as §6 — `../threads/SKEPTIC-corpus.md`). Operator rulings locked: D-A inline projections + matrix links · D-B evolving bases + highlights · D-C analyze-before-build (this document is that analysis; build awaits the greenlight).
- **The operator's worry, restated:** when the next feature ships (e.g., more images on recipes), do we duplicate tests, tables, and diagrams onto its page? How do feature pages stay honest VIEWS of one growing corpus instead of copies that drift?

## 1. The answer in one line

**Tests already live once; what was missing is the corpus's own canonical pages and a diagram library. Feature pages are — and stay — generated projections that reference, never copy.**

## 2. What is already reconciled by construction (no action needed)

| Thing | Where it lives ONCE | How feature pages get it |
|---|---|---|
| Test code | the suites/specs on disk | never copied — linked (GitHub/blob + spec source) |
| Test results | junit XML · run-status.json · pw-report.json | the registry maps by REFERENCE (globs, spec names); pages regenerate from the same files |
| The feature↔test mapping | `features[]` in the ONE config | a future "recipe images v2" feature adds ONE registry entry; its new tests join the same suites; both features project overlapping subsets with zero copying |
| Evidence + narration | proof manifests, artifacts, capture | referenced by path; live-probe |

The angle tables on a feature page are **views, not copies** — they cost nothing to keep because they regenerate together with the matrix from the same junit/run-status inputs and physically cannot drift. Two features sharing a test both show it; the test still exists once.

## 3. What was genuinely missing (the two real gaps)

### Gap A — the matrix has no canonical pages ("the main corpus")
Today the estate is visible on `tests.html` but a test has no HOME. The matrix becomes a first-class, multi-page corpus (this is 07's L2 set, now with its purpose named):

```
tests.html            THE MATRIX HUB — the whole estate + the risk grid (criticality × area)
├─ group/<g>.html ×8      a journey group's home: specs, runs, serving features
├─ spec/<s>.html ×21      a spec's home: steps, shots, history, features it verifies
├─ suite-api.html ×1      every pytest file as an anchored section, every test a row
└─ suite-web.html ×1      same for vitest
```

**The reference contract:** every row in a feature page's angle table deep-links to its canonical anchor in the matrix (`suite-api.html#tests-test_cooking_photos-py`, `spec/web-journey-cook-state.html`), and every matrix entity lists back "verifies: H8 · edge batch" (the two-way key, already started with "serves:"). The feature page answers *"is THIS change safe, from every angle?"*; the matrix answers *"what does the application's harness contain, and how healthy is it?"* Same data, two questions.

### Gap B — diagrams WOULD duplicate (the one real risk the operator spotted)
Diagrams are authored, so a second photos-feature would redraw the same data-flow. Fix: a **diagram library with highlight overlays**, enabled by the shape/highlight convention just recorded:

- Base topology diagrams become named corpus assets: `docs/site/center/diagrams/<name>.mmd` (e.g., `cook-session-dataflow.mmd`) — ONE drawing of how that part of the system works, shapes per the convention, NO highlights.
- A feature card references a base + its own accent: `base: cook-session-dataflow` + `highlight: Persisted, Kept` (flowchart/state) or highlight markers for sequence rects. The generator injects the classDef/class lines at render time.
- When a future feature extends the topology (a new node/exchange), it **edits the base** — the corpus mutates and grows, exactly the operator's "enlarge the harness" — and highlights only its addition. Every feature page then renders against TODAY's system truth with ITS change lit up (one topology, many views; no stale snapshots).
- First occurrence creates the base (H8's three diagrams become the first library entries); a card may still carry a bespoke one-off when no shared topology exists yet.

## 4. The repeatable process (the close-out ritual, per feature)

1. Write the tests where they belong in the corpus (suites/specs — normal development).
2. Add ONE `features[]` registry entry (globs, specs, proof dir, capture group).
3. Author the lens card (+ narration when evidence is curated) — translation, reviewed once.
4. Diagrams: reference base(s) + this feature's highlight set; create/extend a base only when topology changed.
5. Regenerate + crawl gate green. Done — the matrix grew, the feature page exists, nothing was copied.

Wave-2 makes steps 2–4 a gabe lifecycle output (the close-out emits drafts), so the ritual runs itself; the CI enlargement later is a SELECTION over the same corpus (e.g., "run T1 cells per push") — the harness already knows groups and criticality, so no new bookkeeping.

## 5. Operator decisions (RULED, round 6)

- **D-A: inline tables + matrix links** — feature pages keep full per-test tables (projections), every row deep-links to its canonical matrix anchor.
- **D-B: evolving bases + highlights** — one topology per subsystem, edited as the app grows; features render against today's truth with their change lit.
- **D-C: analyze once more before building** — done: the skeptic pass below; build starts only on the operator's greenlight.

## 6. Post-skeptic mods (BINDING for the build — `../threads/SKEPTIC-corpus.md`)

1. **Anchor contract:** per-FILE anchors are name-derived slugs; per-TEST anchors anchor at the FUNCTION level for parametrized cases (pytest `test_x[param]` → `#t-<file-slug>-<function-slug>`, one anchor per function, params listed within) and long vitest sentences get `slug[:60] + '-' + sha1(name)[:8]` — stable under the IDs-derive-from-names rule; a rename changes ONE anchor by definition, never by churn.
2. **Regen custody guard (severe):** junit/run-status/pw-report are gitignored LOCAL inputs but matrix HTML is committed — the generator gains a totals floor: if a source is absent/shrunk vs the last committed run-history line, regen FAILS unless `--accept-shrink` is passed (kills both the fresh-clone silent collapse and partial-run poisoning). The `load_features` glob-validation bypass when junit is None is removed (absent junit = LOUD notice, not skipped validation).
3. **Highlight validation, loud:** mermaid silently ignores `class MissingNode changed` (empirically verified via gustify's own renderer) — so the generator validates every highlight target against the base's node/state ids BEFORE render and fails loud on a miss. A base rename cannot silently un-highlight a feature page.
4. **Sequence diagrams don't evolve-in-place:** rect highlights are positional and unvalidatable — sequence bases are content-anchored (highlight markers travel WITH the named messages in the base file) or duplicated per feature; only flowchart/state bases evolve freely under mod 3.
5. **Diagram library = a RECORDED guardrail amendment** (the third authored asset class after config-maps and cards): `center/diagrams/*.mmd`, naming rule = one base per user-meaningful flow (not per feature, not per endpoint), edits reviewed like card edits (they change every referencing page), and the referencing cards listed in each base's header comment.
6. **Two-way links honest about granularity:** "verifies: H8" renders at FILE/SPEC level (what the registry actually knows); no per-test claims.
7. **Ritual gates:** crawl gate WARNs on (a) PLAN phases with no registry entry AND (b) registry features whose card lacks diagrams — plus a ghost-key policy: run-status keys not in journey-groups (zzprobe residue) render nowhere and are listed once on tests.html as "unregistered probes".
8. **Build shape:** matrix pages live in a new `scripts/_center_matrix.py` (size budgets respected — `build_center_docs.py` is at 799/800), the `_case_table` 120-row cap is replaced by full rendering on matrix pages (no-truncation rule), priced ~1 session with the stop-loss seam = spec pages collapse into group pages.
