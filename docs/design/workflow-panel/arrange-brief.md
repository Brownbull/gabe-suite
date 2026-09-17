# The ARRANGE lab — every dimension as a tile, three panels to drop them in (2026-09-17)

The operator's ask, verbatim intent: *"We have now many dimensions to consider. Some of them don't work on the same
wavelength. Some affect all the others, some are more temporary. I would like to see the paths in the longest panel
with a temporal line showing when they happen, and at the same time the standpoint from security, from functions, from
databases and schemas — and explore all that. Let's create a drag panel with panels where we can drag the different
features. I will copy you what I think would be the better configuration."*

So: a page where the console's three regions are DROP ZONES at their real proportions, every dimension the lab knows is
a TILE on a shelf, each tile says what NATURE it has (global · temporal · standpoint · control · transient), every tile
renders REAL content from the door's facts, and one COPY LINE captures the arrangement so the operator can paste it back.

Page: `docs/design/workflow-panel/arrange-lab.html` (+ its probe `probe-arrange.mjs`). Reuses `_station.js` (tokens,
`S.icon`, `S.KINDCOL`, `S.OPC`, `S.CSSVARS`, `S.CARDCSS`) and `_lab-ep.js` (`window.LABEP`, incl. `.forms` — see the
facts table in `command-brief.md`). Nothing typed by hand that the facts carry. Centred on the screen (operator 2026-09-17).

## The panels (drop zones)

| panel | proportion (the lab's own numbers) | note |
|---|---|---|
| **middle** — "the one that is longer in width" | 1100 × 420 (a dial: 826×264 dock · 1100×420 work · 1500×460 wide) | above it a fixed HEAD BAR strip (identity: method · path · status · file) that is not a drop zone |
| **portrait** | 440 × 560 | tall |
| **command** | 360 × 560 | right of the portrait |

Drawn in a row, in the lab's own chrome (panel ground, line, radius 12). A panel is a flex-wrap grid of tile SLOTS; a
tile carries a SIZE — S (a third of the panel's width) · M (half) · L (full width); height is the tile's own, capped
by the panel; a panel that cannot hold what was dropped scrolls AND wears a red `overflow` badge with the measured
excess in px (never silently clipped). Empty panel = a dashed outline and the word "drop a tile".

## The shelf (the tiles)

Left of the panels, grouped by NATURE — the operator's "wavelengths". Each group has a legend row saying what the
nature means in one plain line. Every tile: a nature badge (colour per nature, from the station palette) · a station
glyph · its name · a one-line plain description on hover · a `size` default.

| nature | what it means (the plain line) | tiles |
|---|---|---|
| **global** — affects every other tile | "what is in force right now — pick it once, every tile follows" | `selection` (the path · exit · case in force: the head chip, the kind colour, Clear) |
| **temporal** — time runs through it | "reads left to right in request order" | `paths-timeline` (THE operator's ask: 7 stage columns in request order — middleware · security · dependency · body-parse · validation · handler · uncaught — plus the return; one LANE per path (14); each lane runs from the left to the column where it ends and a marker sits where it leaves — status number, kind colour; click a lane = select the path, global); `clock` (play · pause · replay; the timeline's marker walks the lanes on it) |
| **standpoint** — one part's view of the path in force | "what this part sees on the selected path; dims when nothing is selected" | `security` (the app band in runs order, then the door's deps; per gate: passed · fired for the selected path, hit read from the chain), `functions` (the handler + the calls on the chain, role colours; a catch step shows its class), `data` (the tables the selected path touches with one bucket chip per bucket: committed · maybe · rolled back · uncommitted), `schemas` (the request shape on paths that pass validation, the response shape of the selected exit: model + fields), `tests` (the cases proving the selected exit: C-id · confidence · name), `widening` (hook → screen → route → app chain from `LABEP.widening.chain`, the reason site of the selected status if any) |
| **control** — chooses; never shows a part's facts | "the ACT half: press it to change what is in force" | `command-card` (the 15 verbs compact — glyph · letter · badge; Walk opens the 14 paths; the corner is always there), `path-strip` (14 cells), `exit-ladder` (8 rungs, 12 exits), `matrix` (14 × 6) |
| **transient** — appears and goes | "lives only while you hover or until the next click" | `hover-card` (a docked copy of the last hover card), `caption` (one line under the tile last touched) |
| **record** — the selected thing in full | "everything the feed knows about what is in force, in rows" | `path-record` (status · kind · stage · exit · via · at · the chain as an ordered table · effects · tests), `exit-record`, `case-record` |

The four `control` tiles and the `paths-timeline` all SET the same global selection (`window.ARR.select(path|exit|case)`);
every `standpoint` and `record` tile READS it. This is the "some affect all the others" the operator named: the lab must
make that visible — when a selection changes, every tile that follows it flashes its border once (CSS, on the one clock;
reduced motion = no flash).

## Drag, drop, and the copy line

- Drag a tile from the shelf into a panel, between panels, or back to the shelf (HTML5 drag and drop). The tile's
  header carries: nature badge · name · a size cycle (S → M → L) · a remove ×.
- **One function does every placement** — `window.ARR.place(tile, panel, size, index)` — used by the drop handler AND the
  probe, so the probe never needs to simulate a drag.
- **The copy line**: a button top-right writes ONE line, e.g.
  `arrange · middle: paths-timeline L · security S · functions S · data S | portrait: path-record L | command: command-card L · clock S`
  and a paste box next to it LOADS such a line (round trip, exact). The arrangement also persists in localStorage, wrapped
  in try/catch, so a reload keeps it; the copy line is the source of truth the operator pastes back.
- A RESET button returns every tile to the shelf. A "fill the operator's first cut" button places the arrangement the
  operator described in words: middle ← paths-timeline L, security S, functions S, data S · portrait ← path-record L ·
  command ← command-card L (say on the button that it is a starting point, not a ruling).

## Laws (binding, from the lab)

1. Facts generated, values computed live — every count, name, status and colour from `window.LABEP` / `window.STATION`.
2. Icons are labels, words on the hover card (the lab's `hcard` shape: title · value · rows · plain line last).
3. The four states where a tile has nothing: hollow (measured zero) · hatched (unmeasured) · dashed (inferred) · blank.
4. One clock; replay restarts; pause freezes; reduced motion = the finished frame.
5. 12px floor inside every panel, measured by the probe at the dock size too.
6. Sequential-Procedural reader: every tile reads top to bottom or left to right in request order; one idea per block.
7. Centred column on the screen; no sideways scroll inside a panel (the page row may scroll).

## The probe — `node docs/design/workflow-panel/probe-arrange.mjs [--shots DIR]`

Same recipe as `probe-eplab.mjs` (system Chrome + the spike's playwright-core; SKIP loudly if missing). Asserts, each
measuring the drawn thing: boots, no page errors, the shelf shows every tile (count = the registry's); `paths-timeline`
placed in `middle` draws `LABEP.forms.paths.length` lanes over 7 stage columns + the return, each lane ending at the
column of its path's phase (compare per lane); clicking a lane sets the selection and the `security` tile then shows the
chain's gates with the right passed/fired counts; `data` shows the consent 409's rolled-back chip; the copy line round
trips (write → reset → paste → identical placement); an overfull panel wears the overflow badge with a positive px number
and loses it when a tile is removed; sizes S/M/L measure a third, half, full of the panel width (±2px); the 12px floor at
dock and work sizes; localStorage survives a reload (and the page still boots with storage blocked); `--shots` writes one
PNG of the operator's first cut, one of the empty page, one per panel size.

Deliver the page, the probe green with its count, the shots, and a report (tiles built, what each renders and from
which keys, the first-cut copy line verbatim, anything hatched and why, line counts).

## Addition (operator, 2026-09-17, mid-build): the shelf is a MIND MAP, and a hover explains each dimension

- **The map.** The shelf becomes a 2D map of the dimensions in a fixed layout computed from nature (no physics): the
  global `selection` at the centre; the four CONTROL tiles on the left with SETS arrows into the centre; the six
  STANDPOINT tiles on the right in request order (security · functions · data · schemas · tests · widening) with READS
  arrows out of the centre; the TEMPORAL tiles at the top (`paths-timeline` sets the selection; `clock` → timeline,
  "walks it"); the RECORD tiles at the bottom-right (read); the TRANSIENT tiles at the bottom with one faint dashed ring
  ("shows" — every tile feeds the hover card). Edge kinds drawn with distinct strokes from the station's own tokens and
  a legend that draws each stroke as drawn. Nodes ARE the draggable tiles: drag a node into a panel; a placed node stays
  on the map dimmed with an "in <panel>" tag; drag it back to remove. A compact list under the map stays as the fallback.
- **The hover.** Each node opens the lab's hcard with four sections in this order: *what happens here* (one plain
  sentence) · *kind* (the nature word + its plain line) · *on this door* (ONE live example computed from the facts — e.g.
  security: deps · lanes · gates passed/fired on the selected path; data: tables and commits on the first run; timeline:
  paths over stages, the longest chain) · *use it when* (two or three examples of application, authored plain lines).
- **Probe.** One node per tile; SETS = controls + the timeline, READS = standpoints + records, measured on the drawn map;
  hovering `security` shows the four titles and a number equal to one computed in the page; `ARR.place` dims the node
  and tags it; the 12px floor on node labels; shots of the empty map and of the first cut placed.

## Addition 2 (operator, 2026-09-17): the console model — WHAT × PATH × TIME, and three starting layouts

The operator's model: WHAT (tables · schemas · functions · tests · security · widening — the rich content) × PATH (the
use case, the ending in force) × TIME (the chain order inside a path). The COMMAND panel navigates WHAT and PATH as a
drill-down; the MIDDLE shows the result in the chosen dimension; the PORTRAIT magnifies what is clicked in the middle.

- **Views on every standpoint tile:** `all` (the door's whole set — today's part panel) · `path` (filtered by the path in
  force) · `time` (ordered by the chain, top to bottom in request order: data = effects.steps in order · functions = the
  chain's calls · security = gates and switches with hit · schemas = the body read → the response · widening = the
  frontend after the exit; tests HATCHED — a case proves an ending, it has no time inside). The view rides the copy line
  as `tile:view`.
- **The command tile's `menu` view:** level 1 = PATHS ▸ + the six WHAT groups (+ the corner); level 2 = a WHAT's views
  ALL · ON THIS PATH · ALONG TIME + its verbs + Back, or the path cells + Back. Never deeper than 3. The `verbs` view
  keeps the 15-verb card.
- **Presets** (starting points, never rulings): `blank` · `today` (the endpoint lab as built: middle ← `part-buttons`,
  portrait ← `thing-record`, command ← `command-card:verbs`) · `proposed` (middle ← `paths-timeline` M then `data:path` ·
  `functions:path` · `security:path` S; portrait ← `thing-record` L; command ← `command-card:menu` L; dial fit). The
  operator's own line, pasted back, is the ruling.
