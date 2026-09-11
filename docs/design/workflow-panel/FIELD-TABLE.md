# What earns a fixed slot — the candidate table

*"Can we create a table to see the candidates that we can match across all the components and
evaluate what we should put in the middle section and on the sides?"*

Measured over all **16 elements, one per kind**, from `_data.js` + `_kinds.js` — real feed data, not
a guess about what a kind "should" have. LIVE = the field carries a value · EMPTY = measured and
there is nothing · UNMEAS = the station never measured it.

## The candidates, ranked by how many kinds carry them

| field | slot | kinds | live | empty | unmeas | live % | verdict |
|---|---|---:|---:|---:|---:|---:|---|
| `name` | ident | **16** | 16 | 0 | 0 | **100%** | **MIDDLE · title** |
| `kind` | ident | **16** | 16 | 0 | 0 | **100%** | **RIGHT · portrait** |
| `entity` | ident | **16** | 16 | 0 | 0 | **100%** | **RIGHT · portrait** |
| `conn` | place | **16** | 16 | 0 | 0 | **100%** | **MIDDLE** |
| `home` | place | **16** | 16 | 0 | 0 | **100%** | **MIDDLE** |
| `above` | place | **16** | 16 | 0 | 0 | **100%** | RIGHT · the ladder is a verb |
| `file` | ident | 16 | 14 | 2 | 0 | 88% | **MIDDLE** |
| `delivery` | op | 16 | 13 | 3 | 0 | 81% | **MIDDLE** |
| `sig` | op | 16 | 12 | 4 | 0 | 75% | **MIDDLE** |
| `caller` | in | 16 | 12 | 4 | 0 | 75% | **MIDDLE** |
| `fn` | op | 16 | 11 | 5 | 0 | 69% | **MIDDLE** |
| `col` | store | 15 | 23 | 3 | 0 | 88% | **MIDDLE** — most live values of any field |
| `payload` | in | 15 | 10 | 5 | 0 | 67% | MIDDLE |
| `read` | store | 14 | 9 | 5 | 3 | 53% | MIDDLE |
| `write` | store/out | 16 | 7 | 9 | 1 | 41% | MIDDLE |
| `gate` | in | 16 | 6 | 10 | 0 | 38% | MIDDLE |
| `touch` | out | 10 | 6 | 4 | 0 | 60% | middle, low priority |
| `fetch` | out | 6 | 4 | 3 | 0 | 57% | kind-specific |
| `doc` | op | 16 | 5 | 11 | 0 | 31% | demote |
| `reach` | place | 16 | 4 | 12 | 0 | 25% | **vitals meter, not a row** |
| `shape` | store | 11 | 3 | 8 | 0 | 27% | demote |
| `resp` | out | 15 | 3 | 12 | 0 | 20% | demote |
| `test` | ev | 16 | 3 | 5 | **8** | 19% | **RIGHT · evidence** |
| `journey` | ev | 16 | 3 | 13 | 0 | 19% | RIGHT · evidence |
| `flag` | ev | 16 | 3 | 3 | **10** | 19% | RIGHT · evidence |
| `state` | store | 10 | 2 | 8 | 0 | 20% | demote |
| `store` | store | 10 | 1 | 9 | 0 | 10% | demote |
| `dispatch` | out | 16 | **0** | 16 | 0 | **0%** | **CUT** |
| `dep` · `fk` · `api` · `commits` | — | 1–2 | — | — | — | — | kind-specific, demote |

### The three findings that decide the layout

**1 · Six fields are universal and always live.** `name` · `kind` · `entity` · `conn` · `home` ·
`above` — 16 of 16 kinds, 100% live. These are the only fields that can anchor a layout, because
they are the only ones that never render as an empty box.

**2 · `dispatch` is drawn on all sixteen and is live on none.** 16 kinds, 16 rows, **zero values**.
It has been occupying a permanent row in OUT for every element in the demo. Cut it — a slot that has
never once carried a value is not honest-empty, it is dead.

**3 · `col` carries the most live values of any field** (23 across 15 kinds, 88% live) — more than
any identity field. Structure is the densest thing the feed actually knows, which argues for CARGO
keeping a real region rather than being demoted to a submenu.

## How full is each kind?

Mean fill is **59%** — four in ten rows are already empty or unmeasured. That is the number the
layout has to survive.

| | fill | vitals ok/na/unmeas |
|---|---:|---|
| model | 83% | 3/1/0 |
| function | 81% | 2/1/1 |
| component · hook | 74% | 3/0/1 |
| endpoint | 71% | 3/0/0 |
| schema | 70% | 3/1/0 |
| middleware · store | 67% | 0/2/2 · 2/1/1 |
| type | 63% | 2/1/1 |
| flag | 56% | 0/2/2 |
| module | 54% | 1/2/1 |
| element | 48% | 0/1/2 |
| **route · web** | **41%** | 1/0/3 · 0/2/1 |
| **provider** | **30%** | 0/2/1 |
| **external** | **26%** | 1/2/1 |

**The thin end is the design constraint.** `external` fills 26% and `provider` 30%. A middle section
tuned for `model` at 83% will read as mostly-empty on a quarter of the kinds — which is exactly why
the empty state has to be a first-class rendering, and why the middle should hold the **eleven
near-universal fields** rather than everything the richest kind can offer.

## The three zones

Following the SC2 console, where the left and right sit taller than the centre:

| zone | holds | why |
|---|---|---|
| **LEFT** (tall) | minimap + its icon controls on the outer edge | world state — selection-independent, and the only region that never blanks |
| **MIDDLE** (shorter, the U's floor) | the title, then the eleven near-universal fields | the only fields that survive all 16 kinds; the title leads because `name` is the one field that is 100% live and unique per element |
| **RIGHT** (tall) | the portrait animation + the verbs | identity you look at, and actions you press — SC2 puts the portrait and the command card adjacent for exactly this reason |

`above` moves right because it is a *verb* (go up a level), not a fact — it was only ever a row
because there was nowhere to press.
