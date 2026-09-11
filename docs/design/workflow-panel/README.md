# The bottom console — analysis, research, and seven proposals

The station's element card lived in a **340px right rail**. The brief: move it to the bottom,
full width, and make it the start of a workflow panel where *"the fields maintain the same position
across all the elements, so we always see the same things in the same places"* — then treat it as a
**game panel** and take the region grammar from StarCraft and Warcraft.

Everything here renders from **real feed data** — gustify, the frozen example centre, `c4_head
8356f531` (313 L2 nodes / 1,078 fe pieces). No invented values; where the feed is empty the page says
so in the feed's own words.

---

## Start here

| if you want | read |
|---|---|
| the current build | **[g-console-25.html](g-console-25.html)** — open it, hit the icons in the top bar |
| what the panel actually shows, per kind | [FINDINGS.md](FINDINGS.md) — 16 findings, 3 of them defects |
| SC2/WC3 console anatomy → what the Suite already has | [CONSOLE-MAP.md](CONSOLE-MAP.md) — 24 regions mapped |
| why a skin may never move a region | [SKIN-LAW.md](SKIN-LAW.md) — Blizzard's own layout files |
| which fields earn a fixed slot | [FIELD-TABLE.md](FIELD-TABLE.md) — coverage over all 16 kinds |
| why the minimap works the way it does | [MINIMAP-CONSTRAINTS.md](MINIMAP-CONSTRAINTS.md) |

---

## 1 · The analysis — what the right-side panel was showing

An exhaustive census of `KINDCARD` (`gabe-universe.html:5356-6060`): every builder, every section, in
render order, with its data keys and measured height. Full detail in **[FINDINGS.md](FINDINGS.md)**.
The three that changed what got built:

- **F6 · `access` never reaches the node.** 79 of 81 endpoints carry `access.ops` in the feed; the
  adapter at `:1248` doesn't copy it, so `accessSec` is dead for the only kind with tables to touch.
  **One line. The highest-value fix in the analysis.**
- **F2 · every frontend piece is flagged untested and nothing measured it.** `tests: 0` is hardcoded
  at `:1305` and no fe piece carries a test key — so all 1,078 render "unguarded · no test covers
  this". A check that always fires.
- **F1 · `middleware` and `flag` open an empty card.** Both carry real `det`; `KINDCARD` has no key
  for either.

Plus, from the field table: **`dispatch` is drawn on all 16 kinds and live on none** — 16 rows, zero
values. Cut.

## 2 · The research — SC2, WC3, and four unrelated traditions

Read from Blizzard's shipped layout files, not from screenshots. Detail in
**[CONSOLE-MAP.md](CONSOLE-MAP.md)** and **[SKIN-LAW.md](SKIN-LAW.md)**.

- `MinimapPanel` **395 × 327**, anchored to `$parent` only — no selection state can reach it, which
  is *why* the operator's two screenshots showed a pixel-identical minimap.
- `InfoPanel` **580 × 199**, and **five different content types mount at byte-identical anchors**
  (`InfoPaneUnit · Hero · Queue · Progress · Cargo`, all `Width 402`). **The pane axis proves
  content-vs-geometry** — which is the actual law this panel needs, more than the race axis.
- `CommandPanel` **400 × 242**, fifteen 76 × 76 cells anchored as a **chain**: a cell physically
  cannot drift alone.
- The console band is **27.25%** of screen height; the reserved world strip is 16.7%.
- **45 skins, and the format cannot express geometry** — `ConsoleSkinData.xml` has three art fields
  and zero coordinate fields. WC3 reaches the same result via `War3Skins.txt`: 360 keys, not one a
  coordinate.
- Container forms were then mined from **cockpit instrumentation, audio/broadcast, clinical
  monitoring, and data/print reference** — because sourcing every option from the RTS console is what
  produced variants that were one idea at three densities.

## 3 · The proposals

| | file | layout logic | ancestor |
|---|---|---|---|
| A | [a-instrument-row.html](a-instrument-row.html) | one element · seven fixed cells in a row | — |
| B | [b-step-ledger.html](b-step-ledger.html) | the same seven as columns · a row per journey step | — |
| C | [c-filmstrip-slots.html](c-filmstrip-slots.html) | journey filmstrip · fixed 4 × 2 slot grid | — |
| D | [d-console.html](d-console.html) | six **unequal** regions ending in a command card | SC + WC3 console |
| E | [e-target-focus.html](e-target-focus.html) | two **mirrored** frames, one pinned, relation bar | WoW target + focus |
| F | [f-standing-console.html](f-standing-console.html) | a short dock plus regions that never blank | `statres.bin` + `minimap.bin` |
| **G** | **[g-console-25.html](g-console-25.html)** | **the U — the current build** | the full console |

**G is where the work landed.** It carries:

- **A U-shaped console** — wings 54px taller than the middle, so the silhouette cradles the content.
  Sized by a dial in the top bar: **25 / 30 / 33%**, with a measured **282px floor** below which the
  fixed regions silently cut.
- **LEFT wing · WORLD** — the rotating minimap (298 × 294), its three controls as icons on the outer
  edge. Selection-independent by construction.
- **MIDDLE · THE FACTS** — a title bar carrying `name` (the one field 100% live on all 16 kinds),
  then five fixed columns **VITALS · IN · STORE · OUT · CARGO**, chosen by measured coverage.
- **RIGHT wing · THE ELEMENT AND ITS VERBS** — the planetary portrait (faithful to what `nodeFleet`
  actually draws), evidence, and the 15-cell command card.
- **One integrated top bar** — breadcrumb plus seven icon control groups. Nothing floats over the
  graph.
- **Icon mode** — **434 row keys across 32 names** on the 16 elements became glyphs (576 counting the
  journey steps, which is what an earlier grep reported); every word moved to a hover tooltip.
- **Four availability states** — LIT · BLANK (*wrong question*) · GREY (*no answer*) ·
  **HATCHED (*never measured*)**. The fourth is the one no RTS needs and this station cannot do
  without.
- **Five skins**, colour tokens only, using Blizzard's published constants: Terran `#9BFFBE`,
  Protoss `#6EAAFF`, Zerg `#F58C46`.

## 3b · The kind lab — one kind at a time

**[kind-lab.html](kind-lab.html)** takes the console apart one kind at a time, on one real element each.
For every kind: say what it needs to communicate and *why* (ranked, with the feed's own coverage), show
every fact the feed holds for the example, show what the station's card draws today (by line), then
build the layouts that carry it — as LAYOUT variants of the same dock, so the geometry law still holds.
Patterns merge across kinds later; nothing is generalised from one kind.

| kind | example | status |
|---|---|---|
| **function** | `apps/api/api/user_settings.py#_build_settings` | on the bench — 35 dims ranked · 5 layouts (P1 waist · P2 cargo hold · P3 ledger · P4 cockpit · P5 build queue) · 12 findings · 6 open |
| endpoint · model · component · hook · schema · route · external · middleware · flag · store · module · type · web · provider · element | — | next, in that order |

Files: `_lab.js` / `_lab.css` (the lab shell) · `_lab-fn.js` (**generated** 2026-09-09 by `gen_fn_facts.py` — every
value read out of `levels.json` / `c4-graph.js` / the station at generation time; **the generator lived in a session
scratchpad and is LOST — `_lab-fn.js` is a frozen snapshot @ 8356f531; rewrite `gen_fn_facts.py` before the next kind**) · `_lab-fn-dims.js`
(**generated** from the analysis pass — judgement only; the page computes every example value live from
`_lab-fn.js`, so a number cannot drift) · `_lab-fn-layouts.js` (the five middles).

Measured, not asserted: the fact sheet was recomputed from the feed by `probe-kindlab.mjs` (session scratchpad,
**lost with it** — the 123-check probe must be rewritten before it can run again) and compared to the DOM; every layout must clear `< 0.60` structural similarity against G and each other on **two**
fingerprints (class paths, and tag-only paths that renaming cannot fool) — P5's first draft measured
0.75 against G on the second and was rebuilt as SC2's actual queue strip.

## 4 · What is verified, mechanically

Not asserted — measured by headless probes on every change:

- **All 7 pages pass** at two viewports, every element, zero overflow, no horizontal scroll.
- **Region geometry is byte-stable** across all 16 elements, all 20 variants, and all 5 skins:
  `328,232,572,220,188,168,212`. If a skin ever moves a region, the probe fails.
- **The size dial is honest** — 25/30/33 measured at 1080, 1305 and 1600 tall.
- **Text scale changes type only** — widths identical at 90/100/115/130%.
- **A structural-similarity probe** scores each pair of container variants; anything ≥0.85 is one
  idea restyled and gets cut. It is how the too-similar variants were caught.

## 5 · Open — decisions still yours

- **The divergent containers are specified but not built.** Mimic synoptic for STATUS, polygon for
  VITALS, crosspoint for COMMAND, card plate for PORTRAIT — each has to clear `<0.60` similarity
  before it enters the menu.
- **Mean fill is 59%**, and the thin end is `external` 26% / `provider` 30%. If the five middle
  columns read empty on those kinds, the answer is **fewer columns, not a taller console**.
- **Nine control groups is a lot of surface** for a page arguing "the same things in the same
  places". Blizzard shipped 45 skins and zero per-region layout switches. The density tier is the
  control that matches their model; the rest is a design tool for us, not a shipping feature.
- **The Trail panel** (top-right since 2026-09-07) — does it fold into the Status Display as a roster
  mode? Both RTS ancestors put the multi-select roster inside the centre rectangle.
- **Nothing here has touched the station.** Landing any of it means the `#g` geometry swap plus the
  `access` adapter line, which is worth doing regardless of which layout wins.
