# Assets inventory — where to lift from, and what does not exist

> Load BEFORE building any visual component, to answer one question first:
> **is this already built, liftable, or genuinely new?** Three tiers, in
> lookup order. Repo paths given; everything also installs under
> `~/.claude/skills/...`.

## Tier 1 — auto-loaded shell components (free on every prism page)

`docs/center/shell/assets/` (mirror: `templates/center/shell/assets/` —
byte-identical, always edit repo-side then mirror):

| Asset | Classes / API | Gives |
|---|---|---|
| `prism.css` | `.pf-node/.pf-hop/.pf-gates/.pf-legend/.pf-scrub/.pf-detail(s)/.pf-assembly/.pf-cover/.pxfrag` | the floor grammar: machines, belts, gates, legend, scrub, inspectors, article/cover |
| | `.gv/.gv-seats/.gv-seat/.gv-spheres/.gv-sphere/.gv-bodies/.gv-body/.gv-links` | seats, sphere panels, tiles, gravity cross-reaction |
| | `.gvi` | inline Lucide stroke icons (seat + sphere roster) |
| | `.ulrow/.ul` | under-labels — formula with plain-word roles beneath symbols |
| `prism-fx.js` | drivers: console · article scenes · cover · assembly · `gravityDriver`; `window.FXREPLAY`, `__setMotion` | motion + the pause contract; anything animated MUST register here |

Using these = just markup. No install churn.

## Tier 2 — copy-source libraries (open the page, lift the pattern, re-point it)

Nothing here is linked at runtime — each pattern is a self-contained working
example with its own CSS/JS to copy:

| Library | Path | Contents |
|---|---|---|
| static patterns (31) | `skills/gabe-artifact/assets/static-patterns.html` | bar/line/area charts, **table with inline bars**, stat tile row, donut gauge, histogram, dumbbell, sparkline, heat calendar, timeline, scatter, radar, tree, matrix, stepper, mermaid, tabs, accordion, filter chips, sortable table, callouts… |
| motion patterns (20) | `skills/gabe-artifact/assets/motion-patterns.html` | animated flow, marching ants, trace replay, waterfall, pipeline, live-traffic map, event fan-out, **queue fill/drain**, health pulse, walkthrough, ghost cursor, funnel, scroll steps, bar race, chart entrance/morph, **timeline scrubber**, skeleton, log ticker, state machine |
| grammar patterns (5) | `skills/gabe-imagine/assets/patterns/*.html` | belt-line, belt-lanes, floor-grid, recipe-tree, assembly-step — same subject in all five |
| house chrome | `skills/gabe-artifact/assets/artifact-chrome.html` | the artifact target's chrome reference (NOT for disk pages) |

Lifting rules: re-point at real data (a number not in the actor table does
not appear); swap hardcoded colors for skin vars; charts go through the
dataviz skill's procedure (form → color → **run the validator** → marks →
hover layer).

## Tier 3 — page-local (created on the fly, lives in that page's body.html)

Inline `<style>/<script>` in a `docs/prisms/<slug>/body.html` is page-local
by definition — real, gated, but NOT reusable until promoted to Tier 1.
Current instances:

- the loan/saving SIMULATOR (inputs → month-resolution SVG curve with
  hover/click-pin + reactive stacked bar) and the ledger inline bars
  (`.ci-*`) — lift source: `git show 68836bb:docs/prisms/compound-interest/body.html`
  (the bench №1 round-2 page, removed from the live estate; history keeps it).

**Downstream clause:** in a non-suite project the installed skill is
read-only (never patch `~/.claude` in place), so Tier-3 creations are
recorded in a PROJECT-LOCAL ledger — `docs/prisms/_inventory.md` — which the
Tier-3 lookup step reads alongside this file; promotion into Tier 1 remains
a suite-repo act, flagged to the operator as owed.

**Promotion rule:** the second page that needs a Tier-3 component is the
trigger to mint it into Tier 1 (prism.css/prism-fx.js + mirror + install);
until then it stays where it was born. Candidates on the bench: the
simulator frame, chart primitives (line/area + stacked bar), a real hover
tooltip, the split-view layout, and the **detail-level stepper** (level 0
bare bones → a control steps detail in; see interaction-hooks.md).
