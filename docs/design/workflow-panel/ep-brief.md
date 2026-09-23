# Endpoint lab — the brief (2026-09-11)

The bench: **POST /setup/complete** (entity `auth`), the real door from the frozen gustify example feed
(head 2d6fa5f6). The facts are GENERATED into `_lab-ep.js` (`window.LABEP`) by `gen-endpoint-facts.py`;
the station's visual system is LIFTED into `_station.js` (`window.STATION`) by `gen-station-tokens.py`.
Nothing in the lab may be typed by hand that either file carries.

**Any endpoint (D-035, 2026-09-23).** `_lab-ep.js` stays the committed default. `endpoint-lab.html?ep=<slug>` opens any
other endpoint of the feed from `_eps/<slug>.js` — a LOCAL, git-ignored build of the same facts, one file per endpoint:
`cd docs/design/workflow-panel && python3 gen-endpoint-set.py` (≈ 15 s for all 80; `--only "METHOD /path"` for one). The
slug is `_ep-slug.js`'s rule (the one place it lives; the all-endpoints page inlines the same file). The committed list of
every endpoint the picker shows is `_lab-ep-index.js` (`--index-only` rewrites just it). A `?ep=` whose file is missing
boots the default and says so in the lede, with the command that builds it.

## The operator's ask (verbatim intent, 2026-09-11)

- The **six parts** of an element (from the alphabet ruling A) become the panels of the console's
  **middle region**, with options at the top so we see **one panel at a time**: Functions · Tests ·
  Widening · Security · **Data + Schemas merged** — "one says where the read and write operations are
  happening, and the other shows the shapes. I imagine something where, throughout the read or write
  operations, we can also see the shapes of that data, but with these representations, like with lines, to
  show the abstractions, not with the actual data itself. If we hover over it, we can describe the data
  exactly, but visually it should be abstractions."
- "The abstractions are good, but I would like to work more on the way that we show them. The icons,
  colors, shapes, and theme should be more aligned with what we have in the Gabe universe" — the station
  `templates/center/shell/gabe-universe.html` (its example twin renders the same page over the frozen feed).
- **No loss:** "the idea is that we are able to cover the information that we are already showing. If we
  have more information than what we are showing today, that's okay, but what we cannot do is show less or
  lose information."

## What the station card shows TODAY for this door (the no-loss inventory)

Every line below must land somewhere in the five panels (or the head strip) — a hover card counts.

| station section | today's content (POST /setup/complete) | facts key |
|---|---|---|
| HEAD | `/setup/complete` · kind "API ENDPOINT" + the POST method badge (canvas glyph, dimmed) · entity `auth` | identity.label/method/entity |
| USAGE 1 | bar + "1 api · 0 internal caller(s)" | identity.usage |
| GUARDS 3 | get_auth_context · param-dep · **gate** / get_session · param-dep / get_settings · param-dep | security.guards |
| evidence row | "home auth by its file claim · users say auth 100% of 1 · data says settings 42% of 24 → STAY — the file wins — evidence only, nothing re-homed" | identity.home_ev |
| ACCESSES 24 | 13 × "reads → Model · table" + 11 × "writes → Model · table" | data.ops / data.tables (13 tables, 11 rw) |
| PAYLOAD 6 | "6 fields ferried · → MeResponse (response)" + the cargo-shuttle thumbnail | identity.payload · data.schemas.response |
| CONNECTIONS 27 | reads_from 13 INFERRED · writes_to 11 INFERRED · touches 2 STRUCTURAL (SetupCompleteRequest · MeResponse) · fetched by 1 INFERRED (useCompleteSetup) — chips, +N more | conns.out / conns.in (trust per relation) |
| CODE BEHIND 29 | "reach 5 · 29 behind — turn Functions ON to walk the tree" + 12 named callee chips (+more) | functions.behind · functions.walk (3·16·5·1, conf per hop) |
| TESTS 27 | tabs api 26 · web 1 · chips C1048 C1049 C1050 C1051 C1052 C1055 +20 more · web = file-coverage "15 case(s)" | tests.cases · tests.case_files · tests.by_status |
| JOURNEYS 6+21 | rows C250 API 27 comp (5 entity faces) · "15 case(s)" WEB 24 comp · C785 API 24 · C1887 API 19 · C555 API 17 · C558 API 17 · "+21 more" | tests.journeys · tests.journeys_more · tests.workflows |
| IDENTITY | entity auth · layer endpoints · fan-in 1 caller (graph in-degree) | identity.* |
| SIGNATURE | the gsig in monospace · body "async · 21 lines · → MeResponse" | identity.gsig/sig |
| SOURCE | file apps/api/api/setup.py:254 · status 200 | identity.file/flines/status |
| RISK FLAG | "CONFLICT · LARGE SURFACE" (red row; because behind ≥ 15) | identity.risk |
| ABOVE | cluster · setup ↑ · entity · Auth ↑ · everything ↑ | identity.above |
| (builder-only, empty here) | Delivery (stream) · model row (entity-model view) · docstring | security.stream · identity.models_home · identity.doc |

Extra facts the lab may ADD (they are in `_lab-ep.js`): the 13 tables' columns/FKs/uniques + entity
colours · the request schema's 7 fields with 6 nested shapes and the response's 6 with 5 · the calls-walk
per level with role/lines/commits per callee · cases by HTTP status (200·400·404·409·422 + 18 with no code
in the name) · the ONE curated workflow that names this door (Initial setup — first run: POST /consent →
**POST /setup/complete** → GET /me → GET /settings) · the frontend chain (useCompleteSetup hook, fetcher,
client-cached → SetupScreen view → SetupRoute → router → App) · the ASGI band (Idempotency 0 · RateLimit 1 ·
CORS 2, scope all, gates 80/81) · feed-wide dep counts (get_session 79 · get_auth_context 78 · get_settings 12)
· idempotent write (idempotency_keys is written) · DB commit true · feed-wide maxima (behind 135 · tables 61
· cases 27) · git touches: none of the 30 recent commits.

## The rulings that bind the design (operator, 2026-09-10)

- **A how many** is the workhorse: counts INSIDE each part. The six PARTS are fixed slots.
- **C which kind** is a LABELLING RULE: icons instead of words on titles/labels; the word on hover.
- **D in what order**: at most TWO sequence pictures per element, same place on every kind — the animated
  one is FUNCTIONS (a bead walking the chain), the static one is WIDENING (a ladder). F is absorbed into D.
- **E how deep/far** is the DATA axis: stack structures, show growth/shrink.
- **G how sure** = the MAP's certainty: dashed = inferred · hatched = unmeasured · hollow = measured-zero.
- **I pulse** on a COMMIT = the DATABASE transaction commit (`access.commits`), NEVER git. Git history is
  "git touches".
- **J mutation** (writes · verbs · states) · **K speed** = mass (payload in + steps behind) · **M waiting**
  (async / stream / queue / 202 / cache) — agreed.
- Encodings are INHERITED from the station's journey matrix: R `#22c55e` · W `#f97316` · RW `#eab308`
  (dark ink) chips; OPERATION badge colours `STATION.OPC`; the hover card shape of `_jdCellPop` (header ·
  kind · entity · operation · here · fields · "in the station: <id>").
- The reader's calibrated suit is **Sequential-Procedural**: an element reads as an ordered chain, time
  top to bottom; one idea per block.
- Motion: ONE shared clock; replayable; pausable; reduced-motion shows the FINISHED frame.

## The visual system (all in `window.STATION`)

- Icons: `STATION.P` (link test table key doc info layers merge role globe file down alert journey nav
  skip endpoint model schema function web entity external drill up) · `STATION.GLYPH` (the 18 kind
  glyphs) · `STATION.ICO` (pills: claim seeded derived proposed domain table class path action config …
  shield swords burst star truck). Draw with `STATION.icon(name, size, colour)`.
- Colours: `STATION.KINDCOL` (endpoint #8b5cf6 · function #6366f1 · model #14b8a6 · schema #06b6d4 · entity
  #84cc16 · component #2f7de1 · hook #10b981 · store #ec4899 · route #38bdf8 · type #64748b · screen
  #a855f7 · external #94a3b8) · `STATION.METHOD` (GET #22c55e POST #3b82f6 PUT #f97316 PATCH #eab308 DELETE
  #ef4444) · `STATION.BADGE_COL` (role: accessor #ef4444 caller #3b82f6 gate #eab308 pure #8794ab; feclass;
  hrole; delivery) · `STATION.OPC` (read #22c55e write #f97316 call #3b82f6 pure #8794ab gate #eab308 model
  #12b886 schema #f59f00) · `STATION.RW` (r/w/rw) · `STATION.CONN` (wire colours as hex ints; use
  `STATION.hexOf`) · entity colours ride the facts (`entity_color`, from the feed's `colors`).
- CSS: `STATION.CSSVARS` (the palette --bg #0e1524 · --panel #182136 · --ink · --muted · --line · --accent
  #8b83f5 · --ok · --red · --god; fonts --font-ui · --font-mono) and `STATION.CARDCSS` (the card chrome:
  .sec .sechd .kv .pchip .sublbl .tipico .ttag .jmeta .jfaces .face .flagrow .pnav — reuse, never restyle).
- Legibility floor 12px computed; dark theme is the station's; no external assets.

## The box the panel must fit

The console's MIDDLE region at 1440 wide is ~826 × 264 (dock); the lab renders it at **1100 × 420** as
the working size with a toggle to the dock size. A panel that only works tall is a failed panel.
