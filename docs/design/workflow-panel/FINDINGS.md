# What the panel census found

Read from `templates/center/shell/gabe-universe.html` and the frozen example feed
(`c4_head 8356f531`) on 2026-09-08. Every claim below is code- or feed-derived and cites
where. These are inputs to the dock design, not a review — but three of them are defects.

---

## F1 · Two kinds render a completely empty card

`showPanel` ([:6119](../../../templates/center/shell/gabe-universe.html)) does:

```js
var card = KINDCARD[n.kind]; (card ? card(n) : []).forEach(…)
```

`KINDCARD` holds builders for endpoint · function · model · schema · web · provider · external ·
entity · store · type · hook · component · element · route · module · capsule · screen.

It has **no `middleware` and no `flag` key**. The example feed carries **3 middleware + 2 flag**
nodes. Clicking one opens a body with nothing in it — not even the risk flags or the Above nav,
because the decorator loop at `:5974` only wraps builders that already exist.

**The data is there.** `middleware.det = {file, gates, line, order, scope}` — `gates` names the
endpoints it stands in front of. `flag.det = {default, line, src, walls}` — `walls` names the
endpoints it can close. A render gap over live data.

Same class, unproven here: `FE_KIND` maps `fe-unknown` → `unknown` (`:1169`) and `KINDCARD` has
no `unknown` key either. Zero such nodes in this feed; pulse S15 exists because the classifier
can mint them.

*(Checked and cleared: `C.screen = C.web` at `:5977` sits after the decorator loop, but the loop
reassigns `C[k]` in place, so `screen` inherits the wrapped builder. Not a bug.)*

---

## F2 · Every frontend piece is flagged untested, and nothing measured it

`flagsSec` ([:5967](../../../templates/center/shell/gabe-universe.html)):

```js
untested = (tests === 0 && n.kind !== "entity")
```

Backend nodes get `tests: _testFloor(det)` — real, counted from `det.cases` + `cases_more`
(`:1245`). **Frontend pieces get `tests: 0`, hardcoded** (`:1305`).

And the emitter never measured it: across all **1,078** fe pieces the feed carries no test key at
all — the full key set is `area · cache · candidate · client · exports · feClass · fed2w ·
fields · file · fixture · home · home_ev · hrole · id · kind · mclass · members · name · ops ·
screen · shape · sites · span · sse · state · via · write · wsites`. No `det`, no `cases`.

So every drawn frontend piece renders **"unguarded · no test covers this"** beside a red raider
ship. That is not a measurement, it is a default rendered as a warning — a check that always
fires, which is the same non-evidence class as one that cannot fail.

The honest string is *"not measured for frontend pieces"*. **This argues for the fixed-slot dock:**
give EVIDENCE a permanent position and the falsehood shows up in the same place on every
frontend element instead of scrolling past.

---

## F3 · The size encoding reads a capped column count

`m.cols = (det.cols || []).length` (`:1245`), and `det.cols` is **capped at 10 in the feed** with
the remainder in `det.cols_more`. `Recipe` has **38** columns (the full list is `ids.datatype`)
and reports **10**. Every node with more than 10 columns is undersized by the same amount, so the
encoding flattens exactly where structure matters most.

---

## F4 · The station already computes a stat block it never draws as one

`n.m` (`:1245`) is built for every node:

```js
m = { behind, depth, tests, cols, fanin, god, method }   // + large, hot derived at :1352
```

`fanin` is real — filled by in-degree at `:1344`. These four scalars are the station's
HP-shields-energy: **the same measurements for every element, already computed.** Today they go
to fleet decoration and three risk rows.

Measured on the demo elements:

| element | behind | depth | tests | cols | fan-in |
|---|---|---|---|---|---|
| `POST /…/relief-accept` | 42 | 5 | 3 | — | 0 |
| `Recipe` | — | — | 67 | 10 *(of 38 — see F3)* | 22 |
| `ShoppingItemResponse` | — | — | 5 | 10 | 6 |
| `Auth` (external) | — | — | 0 | — | 29 |

**The frontend has its own vitals and the bundle discards them.** `RecipeBrowseContainer` carries
`fed2w 1 · write true · state true · fan-in 3`; `useRedoSetup` carries `fed2w 0 · sites 2 ·
wsites 2 · cache true`. All of it is thrown away for four zeros.

**Design conclusion:** the vitals block should be **fixed in position, kind-aware in source**.
Four meters, always the same four screen slots — a backend node fills them with reach · depth ·
tests · fan-in, a frontend piece with write-distance · call-sites · writes · fan-in. That is
exactly how an RTS shows HP for everything but energy only for casters: same slot, different
meter, never a reflow.

---

## F5 · 13% of backend nodes carry no `det` at all

41 of 313 L2 nodes are bare 5-key stubs — every `web` screen (33) and every `external` node (8).
Separately, **213 of 1,078** fe pieces carry only the 7 skeletal keys
`area · file · home · id · kind · name · span` — including **21 of the 22 routes**.

A panel that assumes `det` exists renders blank on 13% of the backend graph and 20% of the
frontend. A fixed-slot dock has to treat the empty slot as a first-class rendering, which is why
all proposals dim-and-explain rather than remove.

---

## F6 · The one section that answers "what tables does this touch" is dead

`accessSec` ([:5572](../../../templates/center/shell/gabe-universe.html)) reads `n.access`. The node
adapter at `:1248-1251` copies `resp · ids · table · sites · fn · middleware · stream · pclass ·
home_ev · fns` — and **not `access`**, while **79 of 81** L2 endpoint nodes carry it in the feed.

`n.access` is only ever set at `:2077`, for levels-derived *function* nodes. So the ACCESSES section
can never render on an endpoint: the single most important fact about a handler — which tables it
reads and writes, with r/w per table — is in the feed and unreachable from its own card.

**One line. The highest-value fix the whole analysis found.** Until it lands, every STORE row in
this folder's demo data is marked `unmeas`, because the proposals must not show an answer the live
panel does not have.

---

## F7 · Every global readout lives inside the selection-driven surface

Tier, node budget, the `__uniScaleGuard` tier-0 boot, kinds-on, `stats.web` unmatched fetches,
`stats.homing` move candidates and `stats.fe.by_kind['fe-unknown']` all render as **panelAll's
Sources rows** (`:5926-5936`) — so all of it **vanishes the instant an element is selected**.

In StarCraft these facts live in *physically separate compiled dialog files* (`statres.bin`,
`minimap.bin`) precisely so the engine cannot reflow them with the selection; SC2 kept the same
corner through a full engine rewrite; WC3 puts them on the top bar outside `ConsoleUI`. This is the
clearest structural inversion the analysis found, and it is what proposal F is built on.

---

## F8 · The station has no where-instrument

Every game surveyed ships a persistent, **selection-independent** overview in a screen corner — SC
`minimap.bin` lower-left, WC3 `ORIGIN_FRAME_MINIMAP` bottom-left, SC2 `MinimapPanel`, WoW top-right.
The station has `__uniCamFit` (`:1891`) and nothing else.

Proposal C's journey filmstrip is the nearest thing and it is **driven by the selected journey**,
which is exactly what a minimap must never be. The click behaviour a minimap needs is already
written verbatim in the search's entity branch at `:4432-4437`.

---

## F9 · Nine verbs are mouse-only, and the best one is behind a timing window

`__uniRevealNeighbors` (`:2366`) — force every 1-hop neighbour's entity and cluster on, pin them,
re-select — is reachable **only by a second click within 350ms** (`__uniLastClick :5201`).
`__uniGoto` · `__uniJrnToggle` · `__uniCapExpand/Collapse` · `panelEnt` · `panelClu` · `__uniHoverHL`
· `__uniReveal` · `__uniSelectLink` have no key at all.

A **grid-key** card is unavailable: bare `1-8` are `__uniFleetToggle` fleet columns (`:3182-3184`)
and `Alt+1..4` are `__uniSetTier` (`:4328`). So the station must take BW's **mnemonic-letter** route.
Free after `w a s d q e`, space, control, `f`, `/`, arrows and the Alt pairs:
`b c g h i j k l m n o p r t u v x y z`.

---

## F10 · `__uniPin` is not a user verb and does not survive

It is wiped by `__uniHLClear` (`:2653`) and by every tier press (`:4285`) — and `__uniSetTier`
explicitly **preserves a journey while wiping the pin**. WoW's focus frame exists because a panel
driven by a volatile selection needs exactly one slot that ignores the selection. The station has
the mechanism and no way to reach it. Proposals E and F both require a pin that survives.

---

## F11 · Six kind-shaped section inconsistencies with no stated reason

- **IDENTITY** (`:5621`) is on endpoint, function and the fe builders — but not on model, schema,
  web, provider or external, though a model has an entity, a layer and a fan-in.
- **JOURNEYS** (`:5467`) is on endpoint, model and schema and on **no frontend kind**, though a
  screen is the most obvious thing for a journey to stop at.
- **SOURCE** has an inline fallback for `web` (`:5668`) and none for provider or external.
- **NOTE** has fallbacks for provider (`:5673`) and external (`:5678`) and none for web — the exact
  mirror image.
- **DOCSTRING** is wired on every fe kind and dead on all of them (`det.doc` minted as `''` at `:1301`).
- **STRUCTURE** has a fallback for schema, store and type — but not for model.

A fixed-region dock turns all six into visible empty cells. That is the argument for the exercise in
one sentence.

---

## F12 · Three verdicts render as unlabelled prose

`homeEvRow` (`:5700`), `modelRow` (`:5709`) and `homeRow` (`:5696`) are bare `.kv` rows with **no
section header**, wrapping 3–7 lines each in a ~215px column: a move candidate, an entity-model
delta, a config-homed piece. These are verdicts and they get less chrome than a docstring. In the
region grammar they become EVIDENCE row 3.

---

## F13 · Dead code

`behind()` at `:5423` is defined and never called (`behindTree` at `:5549` is live). `C.entity`
(`:5680`) is unreachable — L1 entities are clusters and no entity-kind node is ever pushed into
`nodes` — yet `flagsSec` (`:5967`) still carries an `n.kind !== "entity"` special case guarding a
builder that cannot run.

---

## Corrections made during this pass

Recorded because both were stated before they were checked.

- **`C.screen = C.web` at `:5977` is NOT a bug.** It sits after the decorator loop at `:5974`, but
  the loop reassigns `C[k]` in place, so `screen` inherits the wrapped builder. (`screen` is also a
  chip class, not a live node kind — node kinds come from the feed.)
- **`m.fanin` IS filled.** It is incremented by in-degree at `:1344`; an initial grep for `m.fanin =`
  missed the `++`.
