# Handoff — the pattern bench: test the mined dissection map on a new concept

> Generated 2026-08-02 · branch `main` · HEAD `a584efd` (4 commits ahead of
> both remotes, PUSH OWED) · no `.kdbp` by ruling R8 — this doc is the
> durable copy, the prompt below is the paste-able artifact.

## Resume prompt

```
Test the mined dissection patterns on ONE new concept, on branch `main`
(HEAD `a584efd` — the pattern-mining record + staged reference map; 4
commits UNPUSHED to both remotes; strays deliberately uncommitted:
scripts/archmap-*.py, docs/investigations/2026-07-29-tools/,
docs/investigations/2026-08-02-personal-notes/ (the operator's notebook
photos — operator to rule if they stay in the repo), modified .gitignore).

READ FIRST:
  docs/design/catan-dissection-notes.md                (the whole arc's record —
                                                        rulings, mined patterns,
                                                        THE SEVEN-CONCEPT BENCH)
  skills/gabe-imagine/references/dissection/MAP.md     (the staged map — router
                                                        to method/seats/ladder/
                                                        translation/visual/
                                                        interaction files)
  skills/gabe-imagine/references/disk-target.md        (still the ONLY binding
                                                        spec — the map is staged,
                                                        not bound)

STATE
- Landed + gated this session: nav sections (a4d432f, battery R15 37/37) ·
  the Catan section — index/turn/dissection with dimension grammar + gravity
  map + icons (b03aaa7, full chain green) · the strategist seat page
  (d33a4c8, contract 8/8 · fit 15/15 · motion 4/4, chain "suite center: OK") ·
  the pattern-mining record + the staged dissection map (a584efd, doctor
  CLEAN). Corpus mined: Lucidchart (DL page deep, Linkchain Core structural;
  Idea/System UN-WALKED — renderer stopped) + 35 notebook photos (4 books).
- CATAN IS ON HOLD (operator, 2026-08-02). Do not iterate Catan pages.
- The dissection reference map is STAGED at
  skills/gabe-imagine/references/dissection/ — 7 files: MAP.md router +
  dissection-method · seat-archetypes · representation-ladder (incl. focus
  gravity wells) · translation-elements · visual-grammar (incl. unlike-kinds
  rule) · interaction-hooks (glance→hover→click→selection ladder). It binds
  into SKILL.md only at the operator's "land it".
- Named shell gaps (do not fake around them — name them on the page if hit):
  no real hover-tooltip element (title= only) · no split-view layout ·
  data-num-source provenance hole (gate checks PRESENT, not traceable).

TASK (operator's words, verbatim)
"I will need a list of seven different concepts, maybe with different levels
of complexity, that we can test these skills on... We will not execute all.
I will choose, but I need a list."
The list EXISTS — docs/design/catan-dissection-notes.md § "The test bench —
seven concepts": 1 compound interest (simple) · 2 the login flow
(simple-medium) · 3 git under the hood (medium, recommended first) ·
4 D'Hondt seat allocation (medium) · 5 QR code anatomy (medium-hard) ·
6 DNS resolution (medium-hard) · 7 transformer attention (hard).
FIRST MOVE: present the bench, let the operator choose. THEN build the
chosen concept as a prism page (new slug, no section unless it earns one),
deliberately test-driving the staged map: run the dissection method (seats
first), open on a focus well, climb the representation ladder (one worked
case → enumeration → generalization), under-labels + consequence lines on
the surface, unlike-kinds silhouettes, interaction ladder where the shell
supports it. Where the shell lacks a layer, SAY SO on the page or in the
report — the test's product is a fit-gap list for the land-it session, not
just a page.

RUNBOOK
- Fast loop:
    python3 docs/center/generators/build_suite_center.py
    python3 skills/gabe-imagine/generator/build_prisms.py \
      --shell docs/center/shell --nav docs/site/center/nav.json
    node skills/gabe-imagine/tools/verify-prism.mjs   docs/site/center/prism-<slug>.html
    node skills/gabe-imagine/tools/check-prism-fit.mjs docs/site/center/prism-<slug>.html
    node skills/gabe-artifact/tools/verify-motion.mjs  docs/site/center/prism-<slug>.html
- Full chain before committing: bash docs/center/generators/refresh_suite_center.sh regen
- After ANY skills/ or shell edit: ./install.sh && bash scripts/suite-doctor.sh (CLEAN).
- Gotchas: numbers must be real + traceable (provenance rule; git concept =
  measure THIS repo live) · a belt past ~5 machines breaks into .pf-rows ·
  prose caps at 76ch · chromium batteries are load-flaky (2 recorded hits —
  rerun before diagnosing; third hit = widen the sampling window) · new
  visual kinds MINT a silhouette in prism.css, mirrored byte-identical to
  templates/center/shell/, battery case if a checker changes.

AFTER THAT
- PUSH: 4 commits owed to both remotes (origin Brownbull + korigin khujta).
- The land-it session: wire MAP.md into SKILL.md using the fit-gap list.
- Deferred, unchanged: per-angle Catan pages (trigger: content authored) ·
  twin propagation · data-num-source hole · hover tooltip + split view.
```

## State snapshot

- **Landed:** a4d432f · b03aaa7 · d33a4c8 · a584efd — all gated (batteries
  37/37, 96/96; full chain exit 0; doctor CLEAN after every skills/ touch).
- **In-flight:** nothing mid-task — clean cut. Lucidchart Idea/System pages
  un-walked (renderer stopped re-rendering; revisit only if the operator
  reopens them).
- **Verified this session:** refresh_suite_center.sh regen exit 0 ("suite
  center: OK"); verify-prism 8/8 + check-prism-fit 15/15 + verify-motion 4/4
  on the strategist page; suite-doctor CLEAN (last run after the map
  install).
- **KDBP sync this run:** none — no `.kdbp` by ruling R8 (forced --no-sync);
  this doc is the durable record.
