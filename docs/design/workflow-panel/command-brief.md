# Endpoint lab — the COMMAND panel brief (Phase 6 · slice 1, 2026-09-17)

The console's ACT half. The element forms now carry, per endpoint, one ordered PATH per way a request ends —
what the operator asked for on 2026-09-14: *"we will create the three layouts once we finish all this. Just skip
the decision. I want to be able to see all of them and then decide."* So this slice builds EVERY layout and every
choice from `path-map-status.md` §6 as a switchable option, on the real door, and the operator decides by looking.

Bench: **POST /setup/complete** (`auth`), facts in `_lab-ep.js` (`window.LABEP`, regenerated 2026-09-17 with
`gen-endpoint-facts.py --forms ~/.cache/gabe-map-baselines/.check/gustify/forms.json` — an arms-on build of the
same twin at head 05007957; `LABEP.forms.source` says so). Nothing in the lab may be typed by hand that the facts
carry — a count, a name, a status, a line: read it from `F.forms`.

## The facts (`window.LABEP.forms`, state `present`)

| key | holds | measured |
|---|---|---|
| `paths[]` | one per ending: `id · status · kind (success·refusal·framework·validation·uncaught) · phase · state · names{drawn,detail,exception,token,phase_status} · exit{…} · chain[] · effects{} · switches[] · tests[] · partial · proven_by · anywhere · n{steps,gates,catches,branches,calls}` | **14**: 7 refusal · 2 framework · 1 validation · 3 success (first run · replay · already done) · 1 uncaught |
| `paths[].chain[]` | ordered steps: `i · kind (step·switch·gate·branch·call·collapsed·catch·exit) · phase · hit (a gate: true = it fired) · at · label · sub · ref · status · split · exit_kind · switch_kind · catch_kind · fn · reason` | 4 – 22 steps |
| `paths[].effects` | `dependency (ran·not-run) · steps[]{step,table,op,model,fn,at,cond,race,dependency,via,bucket} · n{committed,maybe_committed,rolled_back,uncommitted} · tables[] · writes[] · may_follow_commits` | first run commits 45 over 13 tables; consent 409 rolls back 5 on `idempotency_keys` |
| `exits[]` | request order (`phases` + the body-parse split): `id · kind · row · status · phase · at · detail · code · via · pred · state · form · tests[] · response{media,body,model,fields} · paths[]` | **12** over 7 stages (`stages[]` = phase → exit ids) |
| `switches[]` | `binding` (port TokenVerifier, 2 impls) · `value` (ai_credits_* per tier) · `flag` (rate limit: `settings{}` environment · rate_limit_enabled, `expr`, `when`, `refs`) | 3 |
| `preconditions[]` `branches[]` `returns[]` `collapsed[]` | the paths arm's rows, raw + `exit_rec` | 3 · 3 · 4 · 2 |
| `repeat` `auth` `rate` `responses` `failure.catches[]` | the contract arm (U12 · K2 · K3 · K4) + U11 | claims 1 (race handled) · 1 scheme + 1 gate + 1 provision · 2 limiters · 12 responses · 5 catches |
| `findings[]` `arm_findings` `declared` `framework_exits[]` `tests{}` `slots` | as the feed | 3 findings · effects: refusal-writes on the consent path |
| `frontend` | `hook` (useCompleteSetup: the mutation, its fetch, invalidations, seeds) · `guard` (RequireSetup: chain rows + effects signOut/pushToast) · `reason_sites[]` (SetupScreen.tsx:43 reads status only) · `findings[]` (reason-collapsed 409) · `screens{}` (3 setup screen components with their controls) · `client` | present |
| `counts` `phases[]` | the numbers the titles use | — |
| `endpoint` | the raw block (honesty) | — |

## The thing and its pieces (the pattern book's first step)

- **THE THING = a PATH** — one way a request through this door ends. Its pieces are its chain steps, its facts are
  status · kind · phase · the effect buckets · the tests that prove it · the switches it crossed.
- **The second thing = an EXIT** — the row an ending lands on; its pieces are the paths that end there, its tests,
  its response.
- A **test case** is the third (a case that proves an exit).

## What to build

### 1 · A new REGION `#cmd` in `#row`

Right of the portrait by default (`order` renumbered: rail 1 · cmd-left 2 · bench 3 · port 4 · cmd-right 5, so
choice 16 "card side" is one `order` value). It holds whichever LAYOUT is chosen. It is part of what ships (the
console's COMMAND half), so it lives in the row, never in the rail. `applyFrame` gains `cmdW`/`cmdGap` vars.

### 2 · Four LAYOUTS — the `layout` pick (choice 1), all built, all switchable

| key | what | where |
|---|---|---|
| `card` | the command card: a 3×5 grid of cells in the SC2 command-square look (reuse the part buttons' valley classes via a shared class — same rim, same glyph ghost). Row 1–3 = the entity command card from `path-map-status.md` §6 (Q W E R T / A S D F G / Z X C V B: Walk a path ▸ · prev exit · next exit · Show refusals (badge = refusals count) · Show success · Show writes (badge = writes) + commit · Show preconditions (badge) · Show gates · Show findings (badge) · Declared vs produced · Tests for this exit · Untested exits · Open the handler · Up to entity · Clear). **Walk a path ▸** swaps the grid to PATH cells (14 fit in 3×5; page if more); a chosen path persists as a chip on the head bar's RIGHT pile and as the portrait subject; a cell a command cannot use KEEPS ITS PLACE (choice 10). **The bottom-right slot is the CORNER in every mode** — Clear on the verb and entity cards, Back on the path grid (up to the verbs, the path stays in force; Esc clears); `collapsed` drops empty rows, never the corner (operator, 2026-09-17, first look: SC2's cancel corner was missing from the sub-menus). | `#cmd` |
| `strip` | a path strip UNDER the part buttons inside the bench (`#pathstrip`, ~72px, one cell per path, grouped per choice 4) + the same card in `#cmd`; a path click PROJECTS all six parts and the portrait becomes the path record | bench + `#cmd` |
| `ladder` | an exit ladder (~196px column): rungs = the 7 stages in request order + the success return at the foot; exits hang on the rung they leave from; click an exit → rungs above light, below dim; the ONE clock can replay the walk (choice 18) | `#cmd`, or left of bench, or as a 28px tick rail inside the portrait's left edge (choice 17) |
| `matrix` | path × part, 14 × 6 cells of 28px; a cell's state says whether that part has per-path facts for that path (Data: `effects.tables` non-empty · Schemas: `exit.response` present · Functions: chain has call/collapsed/catch steps · Tests: `tests` non-empty · Widening: a `frontend.reason_sites[]` route with this status, or the hook · Security: the chain's gates + switches > 0). lit = facts · hollow = measured zero · hatched = the part has no projector | `#cmd` |

All four share ONE selection: `window.SEL.path` / `window.SEL.exit` / `window.SEL.case`, set through `selectPath(id)` ·
`selectExit(id)` · `selectCase(cid)` · `clearPath()` (Esc, the Clear cell, hotkey B). Selecting redraws: the open
part with the PROJECTION, the portrait, the head chip, the region itself.

### 3 · The PROJECTION onto the six parts (choice 8: dim .28 · filter · outline; choice 15: kept · cleared on part switch)

A post-render pass `applyPath(panelEl, part, path)` marks what is ON the path and treats the rest per choice 8. Each
renderer already tags its drawn things (`data-table` on Data tiles/blocks; find or ADD `data-schema` · `data-fn` ·
`data-case` · `data-lane`/`data-dep` · `data-rung` in `_lab-ep-panels.js` — the smallest edit inside the renderer).

| part | on the path | extra mark |
|---|---|---|
| Data | `effects.tables` | a written table gets its BUCKET chip: committed · maybe · rolled back · uncommitted (colour: committed = the commit pulse green, rolled back = red, uncommitted = hollow, maybe = dashed) |
| Schemas | the exit's `response.model` (+ its fields) and the request on every path that passes the validation gate | — |
| Functions | the `fn` set of the chain's call · collapsed · catch steps + the handler | a catch step's function carries the catch class |
| Tests | `tests[].case` | conf as a chip: status · status+detail · ambiguous of N · service raises |
| Widening | `frontend.reason_sites[]` routes whose `value` equals the status; the hook on every path; the guard's 401 effect rows when status is 401 | the reason-collapsed finding on the 409s |
| Security | the chain's gates: hit true = the gate that fired (lit in the refusal colour) · hit false = passed; the switches crossed | the rate-limit flag chip (choice 19) |

Choice 2 (`rows`): `command` (default) · `parts` (each part ALSO draws a one-line "on this path" strip under its title
with that part's facts for the path) · `both`.

### 4 · The PORTRAITS (choice 9: path record · keep selection · split)

Three portrait variants added to every part while a path/exit/case is selected (the portrait belongs to the stage):
- **Path** — header (kind glyph in the path colour + name) · status · phase · exit detail · via · the chain as an
  ordered table (i · kind glyph · label · sub · hit) · effects buckets with tables · tests (C-id · conf · name) · switches.
- **Exit** — status · phase · detail · code · via · pred · form/state · response (media · body · model · fields) ·
  the paths that end there · tests.
- **Case** — name · file:line · corpus · state · its calls (method path → status/detail asserted, headers sent) →
  the exit each proves (`refs`).
A card mirrors the thing and never repeats a fact another line carries (pattern book).

### 5 · Every other choice from §6, as picks in the rail block `blk-command`

| # | pick | options (default first) |
|---|---|---|
| 3 | card scope | kind card · entity card (the owning entity's endpoints as cells + Walk/Clear) · both |
| 4 | path grouping | request order · by kind · by status |
| 5 | path names | drawn · detail · exception · phase·status (all four ride `path.names`) |
| 6 | success paths | shown (generated) · hidden — *the "drawn by hand" source is gone: all three are generated now; say so on the card* |
| 7 | sub-paths | split (two 429 cells, two 401 cells) · merged (one cell fans out on hover) |
| 8 | on the middle | dim .28 · filter · outline |
| 9 | portrait on select | path record · keep selection · split |
| 10 | wrong-question cell | blank keeps its place · collapsed |
| 11 | hotkeys | QWERT grid · mnemonic letter · off (keydown only when no input has focus; the letter drawn in the cell's corner) |
| 12 | cell size | 64 · 76 · 52 px (face valley · flat) — the 12px floor is MEASURED at 52 |
| 13 | tooltip | lab hover card · SC2 card (a fixed card area under the grid) · caption block |
| 14 | test↔exit join | exact (forms) · name-parsed dashed (today's `LABEP.tests.by_status`) · off |
| 15 | path on part switch | kept · cleared |
| 16 | card side | right of portrait · left of bench |
| 17 | ladder placement | right of portrait · left of bench · inside the portrait edge |
| 18 | walking state | one-clock replay · static |
| 19 | rate-limit flag chip | shown with the caveat (active only when `rate_limit_enabled` or production; measured default False, env `GUSTIFY_RATE_LIMIT_ENABLED`) · hidden |
| B13 | **colour by** | kind (success · refusal · framework · validation · uncaught) · status (2xx · 4xx · 5xx, the station's own rule in the tests panel) · phase (a 7-step ramp) · mono — this is backlog **B13**, colour the connections by path kind, as a rail option to SEE |

The rail block: `railKit` groups — `layout` · `map` (BOOTS OPEN; every choice above) · `cells` (size · face · hotkeys ·
tooltip) · `colour` · `sections` (show/hide: head chip · strip · card · ladder · matrix caption) · a copy button
writing ONE pasteable line `COPYTXT.command` with every default pinned. `OPENBLK` moves to `blk-command`.

## Laws (binding — from ep-brief.md, panel-patterns.html, the memory rulings)

1. **The bench holds only what ships.** The region, the strip, the ladder, the matrix ARE what would ship; every dial
   lives in the rail block. Nothing the operator judges is a knob.
2. **Icons are the labels, words on the card.** A cell = a station glyph (`S.icon`) + the hotkey letter + a count badge
   where the command has a count; the verb word lives on its hover card (`hcard`, the plain line last).
3. **A card mirrors its thing** and never repeats a fact another line carries.
4. **Nothing typed by hand**: every count, name, status, line and colour comes from `F.forms` or `window.STATION`.
   (Fix in passing: `PANELS.functions.hint` hard-codes "3·16·5·1" — read `F.functions.walk_levels`.)
5. **The four states**: dashed = inferred · hatched = unmeasured · hollow = measured zero · blank = wrong question.
6. **One clock** (`window.CLOCK`): the replay walks the selected path on it; pause freezes; reduced motion = the
   finished frame.
7. **12px floor measured, never authored**; the count badges stay at 12 (the 11px exception belongs to Data's line only).
8. **Every option changes the picture** — the probe fingerprints the DOM before and after each pick and requires a
   difference; defaults pinned in the copy line; the boot line asserted verbatim.
9. **No-loss stays 18/18**; the existing 517 probe asserts stay green; no page errors; no sideways scroll INSIDE
   `#bench` · `#port` · `#cmd` (the row scrolls sideways by design).
10. **The rail pattern**: one block per region, `railKit` groups, every control an icon with a hover card, a hidden
    section is `display:none` (nothing leaves the page), a control the open layout does not use is drawn DASHED and
    its card says so.
11. **Two-file law does not apply** (the lab is not the station). Edit: `endpoint-lab.html` (region · rail block ·
    selection · head chip · copy line), `_lab-ep-panels.js` (layout renderers · projectors · portraits · `data-` tags),
    `_lab-ep.css` (region + cells + states; fence the rail CSS to `#blk-command`), `probe-eplab.mjs` (a new section).

## The probe (`node docs/design/workflow-panel/probe-eplab.mjs --shots <dir>`)

Add a section `// ── THE COMMAND PANEL (Phase 6 slice 1, 2026-09-17) ──` with at least these asserts, each one
measuring the DRAWN thing (a bare `> 0` is not an assert):
- boots on the default copy line (verbatim); `#cmd` exists with the declared `order`; `OPENBLK === "blk-command"`.
- `card`: 15 cells drawn; every cell answers a hover with a card naming its verb; Walk a path ▸ shows exactly
  `F.forms.paths.length` path cells; a wrong-question cell keeps its place (count stays 15 under `blank`, drops under `collapsed`).
- `strip`: `F.forms.paths.length` cells under the part buttons; grouping changes their order (fingerprint).
- `ladder`: 7 stage rungs + the foot; `F.forms.exits.length` exits hung; clicking the consent 409 exit lights the
  rungs above it and dims those below (computed opacity); replay moves the bead (two samples at uneven gaps differ).
- `matrix`: 14 × 6 cells; the lit count equals the number computed from `F.forms` in the page (`eval`).
- select the first-run path → `SEL.path` set · the head chip appears with the path name · Data: tiles NOT on the path
  count = tables − `effects.tables.length` and are dimmed to .28 (computed) · Functions: the chain's fns are marked ·
  Tests: the 10 C-ids are marked · Security: the passed gates read hit=false, none lit · the portrait shows the Path
  record with `n.steps` chain rows · Esc clears everything.
- select the consent 409 → Data shows 5 rolled-back chips on `idempotency_keys`; Widening marks the reason-collapsed
  finding; Tests marks C1055 · C1057 · C1065 · C1067.
- colour by kind: a success cell's computed colour differs from a refusal cell's; `mono` makes them equal.
- every pick in the map fold changes a DOM fingerprint of `#cmd` or `#panel`; the 12px floor holds at cell size 52.
- `--shots`: one PNG per layout at the work box, plus one with the first-run path selected on each part.

## Deliver

The edited files, the probe GREEN with its count, the shots directory, and a report: what each layout and option
does, the default line, the counts measured on the page, anything left hatched and why.
