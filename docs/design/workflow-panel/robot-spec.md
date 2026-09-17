# THE ROBOT — build spec for section 6 of `data-atlas.html`

Winner: "The robot — armour, plate by plate", with the grafts both judges named folded in.
One drawing, one idea: **the door is a machine standing on end, wearing armour, read top to bottom
in the order a request meets it.** A plate is one condition; its shape says how much armour is on it.
Handle: *only the handler is wearing armour.*

Data: `scratchpad/robot.json` (embedded verbatim as `<script type="application/json" id="ROBOT">`,
AFTER the plain-line corrections in §7 land in that file — never patched in the page).

---

## 0 · Where it lands, what it reuses

- `<section class="sec" data-sec="6">` after section 5. `--sec6` exists (wine).
- Section head: Lucide `bot` inlined in the `<h2>` (the section's subject — the figure below has no face),
  title **The robot**, `<span class="n">` = `8 parts · 31 conditions · 5 covered` computed as
  `levels.length` · `Σ levels[].conds.length` · `Σ (levels[].tally.covered||0)`.
- `.panel` → `.cardhead` [ `<span class="sp">` · `.ib#robot-t` (plates ↔ track, icon only, aria-label) ·
  `.ib#robot-replay` "Replay" ] → `<div class="robot" data-fx="robot" id="robot">` → `<div class="lg" id="robot-lg">`
  → `<p class="cap" id="robot-cap" tabindex="0">one door, part by part</p>`. Exactly section 1's skeleton.
- Reused as-is: `.tip` (+ a `.tip.wide { max-width: 44ch }` modifier for the robot's cards), `tipFor`/`showTip`/`hideTip`/`wire`
  (focus + blur already wired → every plate is keyboard-reachable), `.ib`, `.lg`, `.cap`, `tRead`/`tWrite`, `MOTION`, `esc`.
- Library cards lifted: **Process stepper** (static — the spine with numbered nodes) · **Pipeline progression**
  (motion — the descending bead) · the page's own `.tip` (already lifted from the static library).
  The QC stamp is a 120 ms CSS keyframe (`scale 1.18 → 1`, opacity 0 → 1), no library card.

---

## 1 · THE PICTURE — geometry

Left-anchored inside the panel, ~520 × ~330 px, DOM rows + one thin inline SVG for the spine
(the bead rides the SVG; plates are DOM so hover and focus are native).

```
        ●  top socket (request in)
   ①──  EDGE      ▢▢▨                    0/3   ┆      ┆  UNCAUGHT
   ②──  GATE      ▢▢▨▨▨                  0/5   ┆  ▢   ┆   (the 500 bay, spans rows 1–6,
   ③──  INPUT     ▢▢◧                    0/3   ┆      ┆    dotted --muted outline, one tick
   ④──  HANDLER   ▮▮▮◧◧◧▮▮▨▨▨            5/11  ┆      ┆    per row on its left edge)
   ⑤──  EFFECTS   ▨▨⧄▨                   0/4   ┆      ┆
   ⑥──  ANSWER    ◧⧄                     0/2   ┆      ┆   0/1
        ●  bottom socket (answer out)
        ┊  18px dotted gap
      ┌ CLIENT    ⧄⧄                     0/2 ┐          the screen block, dashed outline
      └──────────────────────────────────────┘
   [ legend: five plates drawn at true size, one state word each ]
   one door, part by part
```

Columns per row: `[spine 24px] [label 116px] [plates, ragged right, max 272px] [readout 60px] [gap 12px] [bay 26px]`.

- **SPINE** — 2px `--ink-soft` vertical line at x = 12 in the spine column; a filled 7px socket dot at the top
  (request in) and at the bottom (answer out); one 9px ring node per numbered row (1.5px `--ink-soft`, `--card`
  fill), a 10px stub from the node into the row. The ordinal `1–6` sits just left of the node at `--fs-min`, `--muted`,
  tabular. Ordinal = index among levels whose `stage` is neither `"anywhere"` nor `"after the exit"`.
- **ROW (a part)** — 34px tall. Label = `levels[].name`, caps, `--fs-min`, `--ink-soft`. Readout = `(tally.covered||0) + "/" + conds.length`,
  `--fs-min`, `--muted`, tabular, right-aligned so the fractions stack as one column.
- **PLATE (a condition)** — `<i class="plate" data-state=cov.state data-id=cond.id tabindex="0">`, **22 × 26 px, radius 4, 3px gap**,
  drawn in `conds[]` order, never re-sorted. Constant size, so a slab's LENGTH is the count of conditions the part
  decides — HANDLER is eleven plates long, UNCAUGHT one. A bar chart hidden inside the armour, for free and true.
- **THE 500 BAY** — the level whose `stage === "anywhere"` is not a step. It is drawn as a 26px-wide bay down the far
  right, spanning the full height of the numbered rows: 1px dotted `--muted` outline, its name above it (`--fs-min`),
  its plates centred vertically, its readout below it, and **one 6px hairline tick per numbered row on its left edge**
  (graft) — "possible at any step", drawn.
- **THE SCREEN** — the level whose `stage === "after the exit"` sits BELOW the bottom socket, across an **18px dotted
  `--muted` gap** (the answer leaving the machine), in its own 1px dashed `--muted` block with the same label / plates /
  readout columns as a row. Outside the body, because it is.
  If neither stage string is present the picture still draws: every level is a numbered row (honest fallback).
- **THE ROSTER (graft — never drop a row)** — `ROSTER = ["edge","gate","input","handler","effects","answer","uncaught","client"]`
  is the endpoint kind's fixed slot list (a constant of the STANDARD, not this door's data). The figure draws
  `levels[]` in emitted order; a level with `conds: []` draws as an **open slab** — a dotted 1px `--muted` track one
  plate wide, readout `0/0`; a ROSTER key absent from `levels[]` altogether draws the same open slab labelled by the
  key in caps, with hover row 1 `KEY · not emitted`. The emitter is asked to always carry all eight (plain lines
  included); the page's guard only makes a dropped row visible. Two doors then stack as the same eight rows, and the
  break in the silhouette IS the finding.
- **THE 10-SECOND READ** — bare frames on top (EDGE, GATE, INPUT), one solid band in the middle (HANDLER), hatching over
  EFFECTS, slashes at the bottom and on the screen. With the cursor off the page: *only the handler is wearing armour.*
- **The one display option (build both, decide by seeing):** `.ib#robot-t` toggles **plates** (default — constant 22px
  plate, slab length = count) ↔ **track** (a constant 272px track per row, cells flex 1/N, min 18px, area = the
  part's fraction). Remembered at `gabe:atlas:robot-t`, `aria-pressed` mirrors it, exactly like `#when-t`. Default is
  plates because a lone untested 500 must not look like the biggest hole on the page while three unmeasured
  catches shrink to slivers.

---

## 2 · THE PARTS — eight rows, the endpoint form's slots in request order

| # | name | slots (`levels[].slot`) | holds (`levels[].conds[]`) | drawn as |
|---|---|---|---|---|
| 1 | EDGE | K3 rate · U3 guards | 3 — two 429 exits (RateLimitMiddleware) + the `rate_limit_enabled` switch; 0 covered · 2 untested · 1 unmeasured | row 1 |
| 2 | GATE | K2 auth · U3 guards · U8 switches | 5 — 401 ×2, the two verifier switch-arms, the users provision; 0 · 2 untested · 3 unmeasured | row 2 |
| 3 | INPUT | schema cases · K1 declared | 3 — 400 body parse, 422 JSON decode, 422 pydantic (partial, C1051 C1052); 0 · 1 partial · 2 untested | row 3 |
| 4 | HANDLER | U3 · U7 · U6 · U11 | 11 — 3 refusals, 3 branch arms, 5 catches; 5 covered · 3 partial · 3 unmeasured — the only armour | row 4 |
| 5 | EFFECTS | U9 effects · U12 repeat | 4 — commit on success, rollback on refusal, a refusal that still writes (gap), the idempotency claim's race; 0 · 3 unmeasured · 1 gap | row 5 |
| 6 | ANSWER | K4 responses · K1 declared | 2 — 200 MeResponse (partial), declared vs produced (gap); 1 partial · 1 gap | row 6 |
| — | UNCAUGHT | U11 failure | 1 — the 500 (starlette ServerErrorMiddleware), untested | the bay (`stage` "anywhere") |
| — | CLIENT | frontend reason | 2 — reads status 409 only, reason-collapsed 409; 2 gaps | the screen (`stage` "after the exit") |

Every cell above is READ, not typed: `levels[i].name` · `.slot[]` · `.conds[]` · `.tally` · `.stage`.
Plain lines per part: §7.

---

## 3 · THE HOVER — part card (≤ 6 rows, numbers first, plain line last)

Hover / focus a row label, its ordinal, the bay, or the screen block. Card = `.tip.wide`.

| row | reads | example (HANDLER) |
|---|---|---|
| 1 | `levels[].name` · `tally.covered\|\|0` · `conds.length` | `HANDLER · 5 of 11 covered` |
| 2 | five mini plates (`<i class="plate mini" data-state>` 11×13, same CSS) each preceded by `tally[state]\|\|0`, in `states{}` key order; a **zero renders dimmed (opacity .38), never dropped** (graft) | `5 ▮ · 3 ◧ · 0 ▢ · 3 ▨ · 0 ⧄` |
| 3 | `levels[].stage` · the first token of each `levels[].slot[]` · appends ` · ends nothing` when the part has no `kind:"exit"` condition (true for EFFECTS and CLIENT — its conditions never end the request) | `handler · U3 U7 U6 U11` |
| 4 | the one thing missing: the first condition by rank **gap > untested > unmeasured > partial**, ties in `conds[]` order — `conds[].label` + `(cov.state)`; `missing · —` when every plate is covered | `missing · catch InvalidTokenError (unmeasured)` |
| 5 | the deduped union of `conds[].cov.cases` in first-seen order: count first, three ids, `+n`; `0 cases` when empty (honest for EDGE, GATE, EFFECTS, UNCAUGHT, CLIENT) | `13 cases · C1048 C1057 C1061 +10` |
| 6 | 1px rule, then `levels[].plain` verbatim | `the door's own decisions — its guards, the calls it makes, the arms it takes, the exceptions it catches` |

Absent-row variant (open slab): row 1 `EDGE · 0 of 0 covered` (or `EDGE · not emitted`), rows 2–5 as computed (all zero / `0 cases`), row 6 the plain line if the level was emitted, else `—`.

## 4 · THE HOVER — condition card (≤ 6 rows)

Hover / focus a plate.

| row | reads | example (`x:a086031223`) |
|---|---|---|
| 1 | the status parsed from `conds[].label` (`/^\d{3}\b/`, omitted when none) · `cov.state` · `cov.cases.length` cases · `cov.conf.join(" · ")` (omitted when absent) | `409 · covered · 4 cases · status+detail · ambiguous of 2 · service raises` — a branch reads `8 cases · partial · status` |
| 2 | `conds[].label`, minus the status prefix row 1 already carried | `consent required` |
| 3 | `conds[].sub` — the predicate, the catch, the middleware, or where the provision commits; **row omitted when `sub` is empty**, never a filler | `except ConsentRequiredError` |
| 4 | `FAMILY[conds[].kind]` · `conds[].kind` · `conds[].slot` — FAMILY is the kind alphabet, 10 → 5: out (exit, contract) · choice (branch, switch, switch-arm) · catch (catch) · write (effect, race) · flag (finding, client) | `out · exit · U7` |
| 5 | the first case: `cases[id].name` · `cases[id].state`, then ` +n` for the rest; `—` when none | `test_setup_complete_without_consent_409_C1055 · pass +3` |
| 6 | 1px rule, then `states[cov.state]` verbatim — the same string the legend and the part card use, written once in the JSON | `a case proves it — the status and the detail, or the service raise` |

`cases[id].file` is carried but not shown (bandwidth); `conds[].id` rides the plate as `data-id` for a deep link / the probe, not as a card row.

## 5 · Other hovers

- **Legend glyph** → 2 rows: `unmeasured · 10 of 31` (count of `conds[].cov.state === word` over all conditions) · rule · `states[word]`.
  And it **lights the picture**: `.robot[data-lit="<state>"]` dims every plate not in that state to opacity .3 (graft: bidirectional pointing).
- **Plate** → its card, plus a 2px `--accent` halo on the plate (chrome, not data) and its row's label + ordinal + readout go `--ink`.
- **Row label / ordinal** → the part card, plus that row's plates stay full while sibling rows dim to .55.
- **Caption** (`#robot-cap`, focusable) → the three ANALOGY LIMITS, said out loud, 3 rows:
  `armour is evidence, not defence — a solid plate says a test proves the condition` ·
  `plates are independent — a bare plate exposes nothing beside it` ·
  `a hatched plate is armour nobody can fit today, not armour nobody fitted`.
- **Card placement (graft, the arrange-lab ruling — never cover what it describes):** the robot uses its own
  `placeRobot(row)` instead of `showTip`'s cursor-above: the card opens **beside the chassis, to the right**, top-aligned
  with the hovered row (clamped inside the panel) — H1 leaves that space empty by design, so nothing is covered.
  When the panel is narrower than chassis + card + 16px, fall back to **below the hovered row for rows 1–5, above it for
  row 6, the bay's readout and the screen**. Both paths exist in code; the operator sees which one.

---

## 6 · THE STATES — five words, five shapes (colour is the second channel)

One grammar: *how much armour is on the plate — all · half · none · cannot be fitted · broken.*

| state | shape | tokens | greyscale |
|---|---|---|---|
| **covered** | SOLID — filled edge to edge, a 2px rivet dot at centre in `color-mix(in srgb, var(--good) 65%, var(--ink))` | `--good` | 100% fill |
| **partial** | HALF — filled from the base to the midline (hard-stop `linear-gradient(to top, var(--warning) 50%, transparent 50%)`), the top half a 1px `--ink-soft` outline. Base-up rather than left-half so it never reads as "the first half in time" inside a slab that runs left → right | `--warning` + `--ink-soft` | a half-height block |
| **untested** | EMPTY — no fill, 1px solid `--ink-soft` outline (not `--rule`: #e7e9ee on the #fff card is ~1.1:1 in the light skins) | `--ink-soft` | a bare frame |
| **unmeasured** | HATCHED — no fill, 1px **dashed** `--muted` outline, 45° hatch in `--muted` at 3px pitch (`repeating-linear-gradient`), full strength (a 12% hatch vanishes in greyscale and the dark skins). **Never a warning colour — it is not a defect** | `--muted` | dashed frame + stripes |
| **gap** | SLASHED — no fill, 1.5px `--critical` outline, **ONE** corner-to-corner slash top-left → bottom-right (graft: one mark, the broken corner dropped). The only mark that crosses the plate's own geometry | `--critical` | frame + diagonal |

Fixed status/neutral tokens only, never themed per skin; `--accent` touches chrome only (bead, halo);
`--s1..--s4` are **never** used — sections 1–2 already spend them on write fates (`FATE`, line 682).
The mini plates in the part card and the legend are the SAME `.plate` class at another size, so the five shapes are drawn once.

**LEGEND** — one `.lg` row under the figure holding five real `<i class="plate" data-state>` at full 22×26 (its own size,
not the page's 10px `.lg i`), each followed by its state word at `--fs-min`; the sentence is hover-only (§5).

---

## 7 · PLAIN LINES — corrections land in `robot.json`, the page reads them

The page prints `levels[].plain` and `states[word]` verbatim; the legend row, the plate's card and the part card
all read the same key, so the sentences cannot drift. Voice = the seven-line plain rule (one sentence · concrete noun
first · ≤ 1 em dash · reader's side · earned jargon · the honest negative out loud · never restate the label).

Apply to `robot.json` BEFORE embedding (the grafts named EDGE, GATE, EFFECTS, ANSWER, `states.gap`; `states.partial` is the
one correction beyond them — "the join is ambiguous" is jargon the sentence had not earned, rule 5):

```json
"levels[key=edge].plain":    "the checks every request meets before it reaches this door — the same ones guard every door in the app",
"levels[key=gate].plain":    "the lock on the door — it decides who may knock, and it writes a row when it lets someone in",
"levels[key=effects].plain": "the writes the door leaves behind — which survive each ending and which are rolled back",
"levels[key=answer].plain":  "the reply the caller gets — one body per ending, beside what the door promised to return",
"states.partial":            "a case reaches the status only — or it could be proving a different ending with the same status",
"states.gap":                "a hole the forms found in the contract or the screen — the fix is code, not another test"
```

Kept verbatim (already in voice): INPUT `the body — can it be read, does it fit the shape` · HANDLER `the door's own decisions —
its guards, the calls it makes, the arms it takes, the exceptions it catches` · UNCAUGHT `the 500 — anything nobody caught,
possible at any step` · CLIENT `the screen that reads the answer — can it tell the endings apart` · `states.covered`
`a case proves it — the status and the detail, or the service raise` · `states.untested` `no case reaches it` ·
`states.unmeasured` `no test can assert it today — effects, switch arms, provisions, races`.

---

## 8 · MOTION — one replayable pass, the armour arriving in request order

It teaches the one fact the still frame cannot: **the order the request meets the parts.** ~3.0 s, one pass, no loop.

1. t = 0 — a 6px `--accent` bead (chrome) appears at the top socket.
2. It falls to node *i*; on arrival the ordinal lights (`--muted → --ink`) and that row's plates draw on left → right,
   **55 ms apart, each already in its finished state** (a slashed plate arrives slashed — nothing is ever shown in a state
   it is not in). The bead waits until the row is drawn: hop *i* = `55 × n_i + 120` ms (EDGE 285 · GATE 395 · INPUT 285 ·
   HANDLER 725 · EFFECTS 340 · ANSWER 230).
3. **QC stamp (graft):** as the bead LEAVES node *i*, that row's readout stamps in — `scale 1.18 → 1`, opacity 0 → 1, 120 ms.
4. **The bay is alive the whole way down:** its plate draws on when the bead reaches node 1 (a 500 is possible from the
   first step); as the bead passes each row, that row's bay tick pulses once (opacity .4 → 1 → .4, 200 ms); the bay's
   readout stamps when the bead exits the bottom socket.
5. The bead leaves the bottom socket; the 18px dotted gap writes itself downward (180 ms); the screen's plates draw on
   (2 × 55 ms); its readout stamps.
6. Last: the section head's `.n` count stamps (the summed count, graft).

**Contract (H4 + this page's wiring):**
- Stage `data-fx="robot"`; `buildRobot(play)` is rAF-driven, cancels any running rAF first (the ghost-timer trap),
  and copies `buildWhen`'s still test verbatim:
  `still = !MOTION.on || matchMedia("(prefers-reduced-motion: reduce)").matches || (MOTION.finished && play !== true)`.
  `still` → the finished frame: every plate on, every readout and the head count stamped, ordinals lit, **no bead**.
- Register BOTH: `window.FXREPLAY.robot = function(){ buildRobot(true) }` and `window.FXBUILD.robot = function(){ buildRobot(false) }`
  — `__rebuildMotion` iterates `FXBUILD`. **Trap:** line 1335 assigns `window.FXBUILD = { when: … }` as a literal;
  register the robot AFTER it inside the same IIFE, or change that line to `window.FXBUILD = window.FXBUILD || {}; window.FXBUILD.when = …`.
- Replay = `.ib#robot-replay` in `.cardhead` → `buildRobot(true)`. Paused shows the last frame. The cog's Animations option
  (`start finished` default · `start playing`) governs the opening frame through `MOTION.finished`, as sections 1–5.
- Resize → debounce `buildRobot()` like `when`.
- Verify with `node ~/.claude/skills/gabe-artifact/tools/verify-motion.mjs` (samples at uneven gaps) and the chrome gate
  `verify-artifact-chrome.mjs` (12px floor at the smallest base, skins, no sideways scroll). Never by eye.
- It is deliberately NOT section 1's stage walk: that bead crosses tables left → right; this one falls through armour top → bottom.

---

## 9 · SURFACE WORDS (visible without hovering, in order) — 25

The · robot · parts · conditions · covered · Replay · EDGE · GATE · INPUT · HANDLER · EFFECTS · ANSWER · UNCAUGHT · CLIENT ·
covered · partial · untested · unmeasured · gap · one · door, · part · by · part

Numerals on the surface (not words): `8 · 31 · 5` in the head; ordinals `1 2 3 4 5 6`; readouts `0/3 0/5 0/3 5/11 0/4 0/2 0/1 0/2`.
Nothing else. The toggle is icon-only; the door's name lives in the page header already.

---

## 10 · MUST NOT

1. Must not read as a humanoid — no head, arms, legs or face. Body parts are not time.
2. Must not let armour mean security — a solid plate = a case proves this condition, nothing about whether it is defended; the caption's limits say so.
3. Must not re-sort plates or rows by state, severity or count — order inside a slab is `conds[]` order, rows are `levels[]` order.
4. Must not become a second heat matrix — ragged slabs by default; the track option is the compared alternative, off by default, never a grid of equal cells with a second mark on them.
5. Must not put UNCAUGHT or CLIENT in the numbered chain — the bay and the screen are chosen from `levels[].stage`, never by hand.
6. Must not drop a row — the eight-row roster is fixed for the kind; an empty or missing level draws as an open slab with readout `0/0`.
7. Must not hand-type a label, count, case id, state, stage, slot or plain line — every mark reads its key (§1–§7); a number typed into the markup is the defect.
8. Must not headline a single percentage for the door — 5/31 with ten structurally unmeasurable is not 16% of anything; it folds unmeasured, untested and gap into one ask.
9. Must not hide anything behind motion — the page opens finished, Replay re-teaches order, Paused shows the last frame, reduced-motion never starts the bead.
10. Must not add a colour — `--good · --warning · --ink-soft · --muted · --critical` carry the states, `--accent` is chrome only; `--s1..--s4` never (write fates in sections 1–2); unmeasured never takes a warning colour.
11. Must not encode a state by hue alone — every state changes SHAPE, so greyscale print and all three skins keep five.
12. Must not size anything under `--fs-min`, and must not put text inside a plate — 22 px cannot hold a legible word, which is why the words live in the hover.
13. Must not let a card run past 6 rows, open with prose, end with a number, or cover the row it describes; the plain line is last, after a rule.
14. Must not add a floating control, a per-part toggle or a filter strip — one cog, one Replay `.ib`, one plates ↔ track `.ib`.
15. Must not need the hover for the verdict — if the figure does not say "only the handler is wearing armour" in ten seconds with the cursor off the page, no card rescues it.
16. Must not patch a plain line in the page — corrections land in `robot.json`.

---

## 11 · Build notes (the checklist)

- CSS: `.robot` grid; `.seg` row (34px); `.seg .lab` (116px, caps, `--fs-min`); `.seg .plates` (flex, gap 3px); `.plate` 22×26 r4 with
  `[data-state]` variants (§6); `.plate.mini` 11×13; `.readout` (60px, tabular, right); `.bay` (26px, dotted, `.tick` ×6); `.screen`
  (dashed block); `.gapline` (18px dotted); `.stamp` keyframe; `.robot[data-lit] .plate:not([data-state=lit])` dim;
  `.robot[data-t="1"]` track mode. `@media (prefers-reduced-motion)` already kills transitions page-wide.
- SVG spine: `viewBox 0 0 24 H`, sockets `r=3.5`, nodes `r=4.5`, bead `<circle r=3>` moved by rAF (`cy`), stubs as `<line>`.
- JS: `buildRobot(play)` — reads `ROBOT`, resolves bay/screen by stage, orders rows, draws open slabs for the roster gaps,
  computes head `.n`, wires every plate/label/bay/screen/legend/caption through `wire()` with `placeRobot`, then either paints
  finished (`still`) or schedules the timeline (§8).
- Rank constants of the STANDARD (not door data): `ROSTER`, `FAMILY`, the missing-row rank `gap > untested > unmeasured > partial`,
  the legend order = `states{}` key order.
- Gates before publish: chrome gate green (count pasted), motion gate green on `robot` (not SKIP), 12px floor measured at
  the smallest roster base with every plate's card open, and a greyscale screenshot where the five plates still separate.
