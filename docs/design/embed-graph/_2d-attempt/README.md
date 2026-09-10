# RETIRED — the 2D attempt (six layouts, one resolver)

> **Retired 2026-09-08, same day it was built.** The operator's correction: *"none of this does what I
> was expecting. I was expecting the actual 3D mini planes that allow us to navigate, just like we do
> when we focus on something."* This folder read the ask as **pictures of a slice**; the ask was
> **navigation**. The live work is one level up — see [../README.md](../README.md).
>
> Kept, not deleted, for three reasons: the resolver it was built around survived the pivot untouched
> and still powers the 3D pane; findings F1–F4 are about SLICING and hold just as hard in 3D; and F5/F7
> are defects worth remembering — a chip row that silently dropped pieces, and two layouts that clipped
> while every element-count assert passed. Its pages and battery still run from inside this directory.

# Embeddable graphs — six layouts, one resolver

**The ask (operator, 2026-09-08):** from the big graph, generate *little* graphs that embed in web pages
throughout the Gabe Center — details for one **entity**, one **commit**, one **test** — showing only what
is pertinent, with the flip menu, the legend and the rest of the station's chrome stripped down to a
couple of buttons.

**The answer, measured:** all three scopes already resolve against the shipped feed with no emitter work,
and one entity's card-sized slice is **0.8–8.2 kb against a 1,188 kb feed**. The layout question is open
and this folder is the bake-off; the delivery question (build-time slice file vs view-time slice) is
recorded below as the one decision that has to be settled before anything ships.

Open **[index.html](index.html)** — six layouts, one subject, side by side.

---

## One picture

```
  c4-graph.js (1,188 kb) ─┐
                          ├─► _slice.js  RESOLVER ──► {subject, nodes, edges, honest, stats}
  commits.js    (34 kb) ──┘   entity | commit | test        0.8 – 8.2 kb
                              hops 1|2 · per-kind cap              │
                                                                   ▼
                                            ┌──────────────────────────────────────┐
                                            │  the EMBED frame  (_shell.js mount)  │
                                            │  head · picture · 2 controls · honest│
                                            └──────────┬───────────────────────────┘
                                                       │  only draw() differs
                     ┌───────────┬───────────┬─────────┴─┬───────────┬───────────┐
                     A           B           C           D           E           F
                 column      radial      lane        adjacency   spark      focus+
                 strip       ring        flow        tile        graph      context
```

Everything above the frame is shared. **The only variable between two pages is `draw()`** — same feed,
same slice, same cap, same frame, same two controls, same honest line. If B reads better than A, that is
the layout and not a styling accident.

---

## What was measured before any of it was drawn

Frozen example feed — gustify, `c4_head 8356f531`, read 2026-09-08.

| fact | number | why it decides something |
|---|---:|---|
| `c4-graph.js` | **1,188 kb** | too heavy to drag onto every feature page — the whole reason a resolver exists |
| `levels.js` | 1,132 kb | not loaded here at all; the three scopes never needed it |
| L2 nodes · cross-edges | 313 · 343 | the backend half, with baked `x`/`y` |
| fe pieces · fe edges | 1,078 · 3,229 | the frontend half, **no `x`/`y`, no `det`, no `cases`** |
| commits with `touched[]` | 30 | the commit scope needs no new emitter output |
| touched ids that fail to resolve | **0 of 425** | the commit scope is exact, not a floor |
| touched ids that are `fe:` | **246 of 425 (58%)** | a commit graph is a *frontend* graph more often than not |
| distinct C-ids on `det.cases` | 488 across 196 nodes | the test scope needs no new emitter output either |

### The slice, per subject (hop 1, card budget 24)

| subject | seed | drawn | wires | slice | held back |
|---|---:|---:|---:|---:|---|
| entity `allergen` | 11 | 11 | 1 | 0.9 kb | — |
| entity `settings` | 16 | 16 | **43** | 4.5 kb | — |
| entity `auth` | 18 | 18 | 26 | 2.8 kb | — |
| entity `pantry` | 81 | 24 | 35 | 4.5 kb | 6 web · 14 endpoint · 31 schema · 6 model |
| entity `recipe` | 98 | 24 | 47 | 5.0 kb | 7 web · 21 endpoint · 31 schema · 14 model |
| commit `fed71a2b` | 7 | 7 | 1 | 1.1 kb | — |
| commit `a99719f3` | 65 | 24 | 13 | 3.9 kb | 6 component · 3 module · 7 fe-type · 4 endpoint … |
| test `C250` | 20 | 20 | 15 | 2.7 kb | *(fe pieces unmeasured — see F2)* |
| test `C13` | 16 | 16 | **30** | 2.3 kb | *(same)* |

**Six of nine entities fit the card budget with nothing held back.** The two that do not are the two big
ones, and their honest line names exactly what is missing, per kind.

---

## Findings

### F1 · Wire density kills a small picture; node count does not

`settings` draws **16 nodes and 43 wires**. `pantry` draws **24 nodes and 35 wires**. The smaller entity is
the harder picture. Same for tests: `C13` is 16 pieces and 30 relations, denser than `C250`'s 20 and 15.

A node budget alone is the wrong control. Either the cap grows a wire term, or a layout wins by not
drawing wires at all — which is exactly what **D** exists to test.

### F2 · A frontend piece has no test data, and the test scope must say so

The `fe` arm carries `area · feClass · file · home · id · kind · name · span` — no `det`, no `cases`. So a
frontend piece in a test slice is **unmeasured**, never *untested*. The resolver emits that sentence on
every test-scope slice.

This is the same defect [`workflow-panel/FINDINGS.md`](../../workflow-panel/FINDINGS.md) F2 found in the
station's own card, where all 1,078 fe pieces render "unguarded · no test covers this" beside a red ship.
Two independent surfaces hit it in one day; it is a **feed** gap, not a render gap.

### F3 · The commit scope is a frontend scope

246 of 425 touched ids across the 30 commits are `fe:`. Any commit embed that only understood backend
nodes would draw a minority of the change and look complete doing it.

### F4 · Hop 2 is a sample, not a neighbourhood

Hop 2 takes `__unclaimed__` from 9 candidates to 43, `allergen` 11 → 65, `auth` 18 → 70. Every hop-2 slice
at card budget is capped, always. The second hop position is honestly *"a sample of what is adjacent"* and
the honest line has to carry that weight — it does.

### F5 · The chip row lost pieces, and the probe caught it *(fixed)*

**F**'s context chips originally skipped any chip that did not fit the width. Two pieces were then neither
drawn nor counted — a silent drop, which is the one failure this whole folder is built to prevent. The fix
reserves room for a trailing `+N more` chip before drawing the last one that fits; the probe now asserts
`drawn + Σ chips == every resolved piece` and fails without it.

### F6 · The emitter's baked coordinates cover half the graph

`l2` nodes carry `x`/`y`; `fe.pieces` do not. Since 58% of a commit's touched set is `fe:`, **no layout can
be driven by the emitter's coordinates** — each computes its own deterministic positions. Still zero
settle, which was the point; the coordinates are a hint for **A** and nothing more.

### F7 · Two layouts clipped, and only a screenshot caught it *(fixed)*

**A** and **C** spilled chips past the bottom of the body while the honest line still said *24 drawn*.
Every element-count assert passed: a clipped chip is still in the DOM, so counting the DOM was exactly
the proxy the universe render-bug lesson warns about — *measure the thing you assert, not a proxy*.

The cap bounds the TOTAL, never the tallest column, so a subject whose pieces pile into one kind
overflows. Both layouts now shrink the gap, then the chip, to fit the tallest column, and the probe
grew a **bbox assert**: every drawn node's client rect must sit inside the picture box.

### F8 · A kind-per-column layout dies at ~6 kinds *(fixed, and it is a real limit)*

On commit `a99719f3` (8 kinds) **A**'s headers collided into `COMPONEHOOK` and `ENDPOIMIDDLEWSCHEMA`.
A header truncated into a collision is worse than none, so a column too narrow for four legible
characters now wears a kind-coloured bar instead. That is a patch on a symptom: the underlying limit is
that a column-per-kind layout has a hard ceiling around six kinds at card width, and commits routinely
exceed it. Weigh it in D1.

---

## The six

Each page carries its own *holds / breaks* panel. Summary:

| | file | the shape | its bet | where it breaks |
|---|---|---|---|---|
| **A** | [a-column-strip.html](a-column-strip.html) | one column per kind, in the emitter's own order | familiarity — a station reader already knows this map | a commit has no direction; and past ~6 kinds the headers stop fitting (F8) |
| **B** | [b-radial-ring.html](b-radial-ring.html) | subject centred, pieces on a ring, kinds as arcs | **constant footprint** whatever the node count | no labels past ~14 nodes; a chord cannot carry direction |
| **C** | [c-lane-flow.html](c-lane-flow.html) | five permanent lanes: frontend→screens→api→shapes→data | an empty lane is evidence, not an absence | five lanes across 324px truncate hard |
| **D** | [d-adjacency-tile.html](d-adjacency-tile.html) | no wires; dense kind-grouped tiles, coupling on hover | at 300px a hairball says *complicated* and nothing else | a screenshot of it carries no relations at all |
| **E** | [e-sparkgraph.html](e-sparkgraph.html) | 148×44, no labels — sized for a table row | it competes with a **number**, not with a diagram | saturates past ~14 pieces; cannot show its own honest line |
| **F** | [f-focus-context.html](f-focus-context.html) | a few pieces drawn properly, the rest as counted chips | 5 readable beats 24 unreadable | shows the least; degree is a proxy for importance |

**C** borrows its central law from [`workflow-panel`](../../workflow-panel/README.md) directly: *a cell a unit
cannot use keeps its position.* An empty `screens` lane still draws, because the reader learns as much from
it as from a full one.

---

## Rulings so far

**R1 · The layouts draw baked; nothing settles.** *(operator-confirmed direction, 2026-09-08)*
No force simulation anywhere. The renderer lab's strongest measured row was a deterministic `fdp` bake at
0.996 purity with **0 settle** ([graph-renderers](../../graph-renderers/README.md)); a 300px embed that jiggles
for two seconds before reading is worse than one that is simply correct at frame one. The probe asserts
byte-identical re-renders.

**R2 · The chrome floor is two controls.** *(operator, 2026-09-08)*
One that changes the graph (hop depth), one that leaves it (open in the station). No legend, no flip menu,
no kind toggles. Hover carries the naming. The probe **enforces** it: exactly 2 buttons and 1 link inside
the frame, on every page, at every size — a seventh control fails the battery.

**R3 · Everything held back is counted and named.** A cap allocates a per-kind quota proportional to the
kind's share, floor 1, so a picture never silently becomes *"this entity is all schemas"*. What is dropped
appears on the honest line, per kind. F5 is the proof this rule needs teeth.

**R4 · The frame is the deliverable; the harness ships nowhere.** Subject pickers, the size ladder, the
cycle button and the spec panels are lab chrome, drawn outside the frame in a different tone on purpose.

### Open — needs an operator ruling

**D1 · Which layout (or which two).** The bake-off's whole point. Likely more than one survives: **E** is
not competing with the others, it is competing with a printed count in a table row.

**D2 · Build-time slice vs view-time slice.** *Not settled, and it decides all the emitter work.*

| | build-time slice files | view-time slice from the full feed |
|---|---|---|
| page cost | 1–8 kb per subject | 1,188 kb on every page that embeds |
| emitter cost | a new emitter arm + a new committed artifact per subject | **zero** |
| staleness | a slice can drift from the feed | impossible |
| commit scope | 30 files per project, growing per commit | free |

Recommendation: **build-time for entity, view-time for commit and test on pages that already load the
feed.** Defer the decision until a layout is picked — the winning layout's node budget changes the slice
size and therefore the arithmetic.

**D3 · Where the first embed lands.** [`feature.html`](../../../../templates/center/shell/feature.html) (entity,
5 tabs), [`ledger.html`](../../../../templates/center/shell/ledger.html) (commit) and
[`tests.html`](../../../../templates/center/shell/tests.html) (test) all carry slot tokens already. No wiring
has been done and none should be until D1 and D2 are settled.

---

## Running it

```bash
# the bake-off — six layouts, one subject, live pickers
xdg-open docs/design/embed-graph/_2d-attempt/index.html

# the render proof: 792 asserts across 6 layouts x 4 subjects x 3 sizes
cd docs/design/embed-graph/_2d-attempt && node probe.mjs        # ~3 min, boots a headless browser
node probe.mjs C                                    # one layout, ~30 s
```

The probe measures what it claims, per the universe-render-bug lesson that headless-green is not proof:
node counts against the resolver, painted wires against the relations whose both ends are drawn, the
honest line verbatim, the two-control floor, byte-identical re-renders, **client-rect containment** so a
clipped piece cannot pass as a drawn one, and a hand-read **BASELINE** table so a resolver that stops
reporting cannot move both sides of an assert together.

**Mutation-proven, 2026-09-08 — three mutants, each caught:**

| mutant | caught |
|---|---|
| one wire silently dropped in `l-a.js` | 12 failures |
| `cap()` stops reporting what it held back | 6 failures — *and 0 before the BASELINE table existed, which is why it does* |
| `l-a.js` fit law removed (chips overflow the body) | 4 failures — *the assert F7 had to be written to get* |

Two of the three defects this folder found were found by the probe (F5) and by a **screenshot** (F7, F8),
not by reading the code. Neither would have shown up in a page that merely loaded.

Pages read the frozen example feed by relative path and are `file://`-safe. Nothing in this folder is
installed, generated, or wired into `suite-doctor.sh`.

---

## Files

| | |
|---|---|
| `_slice.js` | **the resolver** — entity / commit / test → a slice, plus the cap law. The load-bearing file. |
| `_grammar.js` | the shipped `KINDCOL` / `METHOD` / `RELCOL` literals, lifted from `gabe-universe.html` so a spike paints what the station paints |
| `_shell.js` | the harness: frame, two controls, honest line, generic hover focus, pickers, size ladder |
| `_embed.css` | one skin, two zones — `.emb*` ships, `.lab*` does not |
| `l-a.js` … `l-f.js` | one `draw()` each; loaded by both the single page and the six-up index |
| `index.html` | the bake-off |
| `probe.mjs` | the render proof |
