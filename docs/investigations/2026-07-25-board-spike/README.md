# Board spike — the project's open moves as a pickable board

**Status:** design spike. Operator rulings taken (see below); still nothing wired into the generators.
**Built:** 2026-07-25 · **Twins read:** gustify `1be15058`, gastify `007ee3c` (read-only, neither modified)

## The problem being solved

The center has a `board.html` today and it is a **rail**: phases in plan order, plus three
lanes underneath. It answers *"where am I in the sequence?"* — which is why the only
question it leaves the operator is *"what's next?"*, asked out loud, once per session.

The project is not actually sequential. At any moment there are entity verifications owed,
cheap fixes ripening, priced debt, planned phases, and a long scope arc — all live at once.
The rail can only show one of those as "current", so the rest live in the operator's head
and surface when remembered.

**A board's job here is not to track work. It is to make the available moves visible so
"what's next" becomes a choice instead of a question.**

## What was built

Two static lab pages, one per twin, re-columning each project's real cards.

**Both have since been RETIRED** — the board shipped, so the example folder now carries the
GENERATED pages instead (`example/board.html` gastify · `example/board-gustify.html` gustify ·
`example/arch-code-map.html` with the guard chips). Keeping lab artifacts that no longer match
the shipped page is drift. The record of the spike is this document plus the two scripts beside
it, which still run:

```bash
python3 extract_board_cards.py /path/to/project > cards.json   # read-only
python3 build_board_lab.py cards.json out.html
```

One extractor, no per-project branching — every twin difference is absorbed by reading the
data's own shape (see *Portability* below).

## The card model

Five **tracks** — every card is derived, none authored:

| Track | Source | Gustify | Gastify |
|---|---|---|---|
| **verify** | `adoption.json §sections` checklist + walks | 0 | 4 |
| **prove** | `archmap.json §coverage.unproven` — flows no test claims | 7 | 1 |
| **build** | `PLAN.md` phases with unticked lifecycle cells, + unbuilt `adoption.flows` | 5 | 33 |
| **debt** | `PENDING.md` open rows | 86 | 96 |
| **arc** | `SCOPE.md §Phases` / `ROADMAP.md` — not yet planned | 8 | 2 |

Two **orthogonal label axes**, because one was never enough:

- **entity** — recipe, pantry, cooking… the domain model. Coloured by the *same hash the
  rest of the center uses*, so an entity is never a different colour on two pages.
- **area** — api, web, tooling, process, e2e, docs… *where the work lives*. A tooling debt
  has no entity, and that is the honest answer rather than a gap.

Plus **effort**, **priority**, **gate**, **times-deferred**, **age**, and a **next command**
(`/gabe-walk pantry`, `/gabe-red …`, `/gabe-execute P4`) — the line that turns a card into
a move you can actually start.

### The two ideas worth keeping

**1. "Owed to you" is its own column.** The center already knows which items *only the
operator* can clear — a walk, an approval, a founder ruling. They are not blocked and not
backlog; they are waiting on a human and nothing else. Buried in a general "todo" they rot
silently. Gustify's column read 6 when this spike began and reads **0** now — the six walks
were done mid-build, and the projection tracked it without being told.

**2. "Ripe" is computed from facts, not estimated.** A card is ripe when its prerequisites
are already met and the remaining act is single and named:

- *verify* — 6 of 7 checklist items already true and the survivor is the walk
- *prove* — sibling flows on the entity already have claiming tests, so the corpus and
  fixtures exist and only the case is missing
- *build* — exactly one lifecycle cell unticked
- *debt* — one cited file, never deferred, ungated, and the file is under 300 lines

Effort is real where the data is real: `archmap` records **line counts per file**, so a debt
row citing a 1,443-line service is priced `L` from the recorded number, not a guess. Where
no number exists the card is stamped `~inferred` and says so on hover.

## The six framings (same cards, one page)

| Mode | Columns | Answers |
|---|---|---|
| **State** | Owed to you · Ripe now · Ready · In flight · Blocked · Parked | *what can I actually pick up* |
| **Track** | Verify · Prove · Build · Debt · Arc | *what kind of work is it* |
| **Entity** | one per entity + Cross-cutting | *where does each domain stand* |
| **Effort** | XS · S · M · L | *how much time do I have* |
| **Age** | This week · 8–30d · 1–3mo · 3mo+ · Undated | *what is going stale* |
| **Done** | Last 7d · 30d · 90d · Older · Undated | *what I have finished* |

The first five column the OPEN cards; **Done** switches to the closed population, sorted
newest-first, and hides the ripe/unblocked toggles (they describe open moves only).

No column is ever a wall: past 8 cards the rest fold behind `+ N more`. Filters are
**dropdowns** — one per axis, with per-option counts — because the chip grid put four rows of
vocabulary above the board before a single card.

### The time dimension

Every card carries what the repo actually records:

- **`created` → age** — `PENDING`'s `Date` column, a section's `Adopted YYYY-MM-DD` note, or a
  phase's first `LEDGER` mention. Aging and stale cards get a warn/bad chip.
- **`last_activity`** — the newest `LEDGER` row naming that phase. `PLAN.md` carries no dates
  at all, so the ledger is the only per-phase clock either twin keeps.
- **`closed` → recency + cycle time** — from `PENDING`'s `Verified` column, a resolution date
  in the `Status` prose, gastify's `<!-- Pn resolved YYYY-MM-DD -->` comments, `walks.jsonl`
  timestamps, or a phase's last ledger entry.

Undated is a real bucket, not a rounding-to-zero: a `PLAN` phase or scope arc genuinely has no
creation date anywhere in the repo.

### Where "done" comes from

The live `PENDING.md` holds open rows only — the resolved ones are lifted into
`.kdbp/archive/PENDING-resolved_*.md`. Reading only the live file would have made the Done view
claim gustify finished 11 things this quarter instead of 64.

| Source | Gustify | Gastify |
|---|---|---|
| resolved `PENDING` rows (live + archive) | 64 | 73 |
| `walks.jsonl` | 8 | 4 |
| fully-ticked `PLAN` phases | 3 | 13 |
| completed arc phases | 0 | 13 |
| **dated** | **75/75** | 35/103 |

Gustify's median cycle time is **1 day** (longest 50). Gastify's dating is partial because it
has no `Verified` column and not every resolution comment carries a date — visible as its
68-card **Undated** column rather than silently dropped.

## Portability — the part that mattered most

The first version read gustify perfectly and returned **5 cards for gastify**: a clean exit
and an almost-empty board, the worst available failure mode. The twins do not share a
schema:

| | gustify | gastify |
|---|---|---|
| PLAN phase ids | `P1`…`P7` | `1`…`42` |
| PLAN columns | has `Types` | no `Types` |
| PENDING columns | has `Verified` | no `Verified` |
| PENDING row ids | `135` | `P1` |
| **debt closed how** | `Status` verdict token (`STILL-REAL`/`CLOSED`) | **HTML comment on the next line** |
| long arc lives in | `SCOPE.md §Phases` | `ROADMAP.md` |
| arc columns | `ID · Name · Status · Depends-on` | `# · Phase · Status · Depends on` |
| source-tree layout | `apps/api`, `apps/web` | `backend/`, `web/` |

Three fixes, all of which belong in any real generator:

1. **Parse by header, never by column index.** Position-keyed parsing reads one twin and
   silently returns nothing for the other.
2. **A header is a row followed by a `|---|` separator** — that is the only reliable signal.
   Splitting tables on blank lines made gustify's HTML-comment-interleaved PENDING table
   look like it ended at row 45 of 85, and promoted a *data row* to a header.
3. **Read both closure conventions.** An empty `Status` is not "unknown, skip"; in gastify's
   convention it means never closed, and the comment sweep already removed the closed ones.
4. **Match column names by alias, not by exact spelling** (`ID`/`#`, `Name`/`Phase`,
   `Depends-on`/`Depends on`) — otherwise gastify's arc silently reads as zero phases.
5. **Classify paths by SEGMENT, not by prefix.** Area rules written as `apps/api`/`apps/web`
   labelled gastify's entire codebase "tooling" — 69 of 96 debt rows, all wrong.

Verified: 0 resolved-by-comment rows leak into gastify's board; both twins read every source.

## Operator rulings (2026-07-25)

| # | Ruling | State |
|---|---|---|
| **Interactivity** | None. The board is a **projection** of repo truth — no drag, no manual state. | settled |
| **Q1 default framing** | **State.** | implemented |
| **Q3 board.html** | Replace the three lanes; keep the cross-phase sequence as a compact strip. | implemented |
| **Attribution** | **C + D** — path-derived entity *sets* now; widen the entity registry separately. | C implemented, D is twin-side work |

### C, as implemented

The matcher no longer guesses. It normalises the `File` cell into path tokens (expanding
`{a,b}` braces, dropping globs and `:line` refs), matches them against archmap's per-entity
file lists, and returns **every** entity it touches:

- **0 matches → `cross-cutting`**, rendered as an italic chip. A real answer, not a failure.
- **1 match → one chip.** **2+ → both chips**, primary first.
- **More than half the registry → cross-cutting.** `apps/web/src` genuinely contains all 7
  entities' files, so prefix-matching it returned all 7 — true and useless. Past half the
  registry the citation is not discriminating.

The keyword fallback is gone, and with it the class of error that mattered: a layout fix-list
spanning auth + profile screens no longer gets chipped `pantry` because the word appeared
somewhere in the cell. Attribution *rate* fell (55% → 43% on gustify); attribution *accuracy*
is now 100% by construction, because every chip is a path fact.

### D, sized per twin — the payoff is very different

The unattributed app-code rows were checked for which domain directories they actually name:

- **Gastify — strong case.** 47 app-code rows name `settings` (7), `groups` (6), `reports`
  (4), `retention` (3), `items` (3), `insights` (2), `cohort` (2), `home` (2). These are real
  product domains with no entity in the registry. Adopting them would attribute most of the gap.
- **Gustify — weak case.** 25 app-code rows, and the named domains are scattered:
  `shopping` (3), `profile` (1). The rest is prose cells and infra paths that no entity would
  ever own. Adopting `shopping` + `profile` buys ~4 rows.

**Recommendation: run D on gastify, skip it on gustify.** Gustify's residual gap is a
*writing* problem (prose in the `File` column), not a registry problem, and no amount of
adoption fixes it.

## Twin comparison (2026-07-25)

| | Gustify `1be15058` | Gastify `007ee3c` |
|---|---|---|
| cards | 106 | 136 |
| verify · prove · build · debt · arc | 0 · 7 · 5 · 86 · 8 | 4 · 1 · 33 · 96 · 2 |
| owed to you | **0** | 4 |
| ripe | 16 | 42 |
| blocked · parked | 10 · 8 | 0 · 1 |
| phases complete | 3/7 | 13/46 |
| debt attributed | 37/86 (43%) | 27/96 (28%) |

The two projects read as genuinely different shapes, which is the point of building both:

- **Gustify is verification-complete and debt-heavy.** All 7 entities were walked and
  approved mid-spike (the board went from 6 verify cards to 0 while it was being built — the
  projection tracking reality in real time). What is left is 86 debt rows and 10 gated items.
- **Gastify is build-heavy and barely adopted.** 33 open build phases against 46 total, its 4
  adopted entities all sitting at **0/7 checklist** — which is why their cards route to
  `/gabe-adopt section <entity>`, not `/gabe-walk`. It has zero blocked items: nothing has
  been escalated to a decision yet.

## Known weaknesses (deliberately visible, not hidden)

- **Cross-cutting is now the largest entity bucket** (62 gustify, 104 gastify). That is the
  honest reading, not a defect — but it means the Entity framing is the weakest of the four
  until D lands on gastify.
- **"Ready" is still 72 cards on gustify.** The fold and filters make it navigable; the number
  is the real backlog and the board does not make it feel smaller than it is.
- **Effort is derived, not recorded.** Where a cited file is in archmap, its line count prices
  the card (a fact). Where it is not, the card falls back to "single file vs glob" and is
  stamped `~inferred`.
- **`prove` cards do not exist on gastify** (1 vs gustify's 7) because its coverage map has
  almost no `unproven` flows recorded yet — an input gap, not a board gap.

## LANDED — wired into the generators (same day)

The board is now the real `board.html`, generated by
`templates/center/generators/_a3_board.py` from `_center_data.py`'s loaders. The three lanes are
retired; the phase sequence survives as the clickable strip.

**The scripts in this folder are the SPIKE, kept as the record. The generator is canonical**, and
it differs where integration proved the spike wrong:

| Found during integration | Spike | Generator |
|---|---|---|
| Brace expansion ran AFTER the comma split, so `{a,b}` never expanded — every multi-domain citation resolved to nothing | buggy | expands first, then splits |
| The closure verdict is the LEADING token; a substring test also matched the `· prior: STILL-REAL` history clause, leaving two shipped-and-verified rows counted as open debt | buggy | `_verdict_closed`, leading-token |
| `load_plan` derives the phase id by partitioning Phase on `·`; with no separator the id came back as the whole NAME, so cards titled themselves twice and every ledger date lookup missed | n/a | `phase_id()` falls back to the `#` column |
| An explicit open-verdict list could never change an outcome — no open verdict starts with a closer, and no fixture could make it fail | n/a | removed as dead logic |

Two suite-wide consequences, both beyond the board:

- **`load_pending()` no longer infers openness from the substring "open"** in the Status cell —
  that was gustify's own logged debt (#136). One tolerant parser now serves every station.
- **`load_plan()` captures `Description` and `Types`**, which were being dropped.

Ten guards ship with fixture cases in `tests/center/run.sh`, each proven able to FIRE (by
sabotaging the rule) and to stay silent.
