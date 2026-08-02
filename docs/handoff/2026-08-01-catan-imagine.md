# Handoff — Catan refinement drives gabe-imagine refinement

> Generated 2026-08-01 · branch `main` · HEAD `231ea3b` (pushed, both remotes) · no `.kdbp` by ruling R8 — this doc is the durable copy, the prompt below is the paste-able artifact.

## Resume prompt

```
Refine the Catan explanation, and through it the /gabe-imagine skill, on branch
`main` (HEAD `231ea3b` — the gabe-prism→gabe-imagine rename, pushed to both
remotes; working tree clean except pre-existing scripts/archmap-*.py +
docs/investigations/2026-07-29-tools/, deliberately uncommitted).

READ FIRST:
  docs/handoff/2026-08-01-catan-imagine.md      (this doc — state + constraints)
  skills/gabe-imagine/SKILL.md                  (the contract; note the naming
                                                 rule: skill = gabe-imagine,
                                                 the artifact it renders = prism)
  skills/gabe-imagine/references/disk-target.md (the binding disk-target spec)
  docs/prisms/catan/body.html + prism.json      (the subject of refinement)

STATE
- Landed + PUSHED (origin Brownbull + korigin khujta, dd707b8..231ea3b):
  424e4c5 disk target · b483ac0 width inversion + nav mode icons + gastify
  invented numbers · f0696c0 gastify → component mode · 231ea3b the rename.
- All three explanation modes live with nav glyphs: gauge=console (Catan,
  hook-chain) · scrollcast=article (neural-net) · component=embeds (gastify,
  two fragments; satellites.html embeds {{PRISM:angle-pipeline}}).
- Verified this session: refresh chain green end to end; batteries center
  96/96 · hooks 49 · prism 10 · prism-fit 6 · artifact-motion 6 ·
  pulse-angles 18; suite-doctor CLEAN; ~/.claude/skills/gabe-prism removed.
- gabe-artifact is CONSOLIDATED as-is (1.3.0, zero prism references) — the
  published-Artifact path stays its own skill; if any detail turns out
  forgotten, retrofit it from gustify's published artifacts, never fork it.

TASK (do this next — operator's words, verbatim)
"Iterate on the skill and see what else we are going to change across our
workflow to make it proper" — via "Catan explanation refinement and as a
consequence the refinement of gabe-imagine."
Method constraint: refine the PAGE first (docs/prisms/catan/), and every fix
that is not Catan-specific gets GENERALIZED into the skill in the same pass —
SKILL.md / references/disk-target.md / shell assets (prism.css, prism-fx.js,
prismpage.html) / gates — then mirrored byte-identical to
templates/center/shell/ and covered by a battery case in the same commit.

RUNBOOK
- Fast loop (skip the 2m34s full chain while iterating):
    python3 docs/center/generators/build_suite_center.py
    python3 skills/gabe-imagine/generator/build_prisms.py \
      --shell docs/center/shell --nav docs/site/center/nav.json
    node skills/gabe-imagine/tools/verify-prism.mjs docs/site/center/prism-catan.html
    node skills/gabe-imagine/tools/check-prism-fit.mjs docs/site/center/prism-catan.html
    node skills/gabe-artifact/tools/verify-motion.mjs docs/site/center/prism-catan.html
- Full chain before committing: bash docs/center/generators/refresh_suite_center.sh regen
  (motion leg ~20s/page — that cost is stated in disk-target.md, do not trim it).
- After ANY skills/ or shell edit: ./install.sh && bash scripts/suite-doctor.sh (CLEAN).
- Gotchas that already bit: floor text under 13px breaks the 12px×0.92 floor ·
  a belt past ~5 machines must break into authored .pf-rows (never flex-wrap) ·
  prose caps at 76ch even inside the canvas · a fragment never gets a nav item ·
  Catan's numbers are REAL base-game rules — keep them traceable, unlike
  gastify's ruled-illustrative ones · date-typed test fixtures rot (the center
  battery's KPI case just did; use date.today()).

AFTER THAT
- Close or build the data-num provenance hole (verify-prism checks PRESENT,
  not traceable — a data-num-source the gate resolves; operator deferred).
- Consider an embed-mode Explanations page beyond gastify if Catan spawns
  reusable fragments.
- Twin propagation stays DEFERRED (docs/handoff/2026-07-31-twin-propagation.md).
```

## State snapshot

- **Landed:** four commits `424e4c5`→`231ea3b`, all pushed to both remotes; skill roster 28 with `gabe-imagine` 1.2.0 replacing `gabe-prism`; nav shows all three mode glyphs; gastify is the component-mode demo with invented (declared-illustrative) numbers.
- **In-flight:** nothing — clean cut. Only pre-existing uncommitted strays: `scripts/archmap-census.py`, `scripts/archmap-reach.py`, `docs/investigations/2026-07-29-tools/` (predate this arc; operator to rule).
- **Verified:** refresh chain exit 0 (links · diagrams · prism contract 8/8 × 5 pages · fit · motion); batteries center 96/96, hooks 49/49, prism 10/10, prism-fit 6/6, artifact-motion 6/6, pulse-angles 18/18; suite-doctor CLEAN after install.
- **KDBP sync this run:** none — R8, this repo never carries `.kdbp/`.
- **Decisions this session:** skill-identity rename only, artifact keeps the noun *prism* (SKILL.md naming note; overrule = full-format sweep, cheapest before twin propagation) · gastify numbers invented by ruling, page states it never tracks gastify · gastify carries component mode; Catan stays the canonical console.
