# The disposition contract — a flag becomes a PENDING row or a PLAN phase, stated once

The risk sweep (and any detector) emits a **FLAG** — the currency of disposition:

```
{ dimension, entity, severity, description, fix, source, file }
```

- `dimension` ∈ `evidence` · `testing` · `code` · `security` (the sweep's four lenses)
- `severity` ∈ `critical` · `high` · `medium` · `low`
- `file` — the code path the finding sits on. It **must be archmap-owned** for the board to
  attribute the card to its entity (GAP-A, below).

A flag is disposed **one of two ways** — the P0–P3 ladder decides which is offered, the operator
confirms. The primitive is `scripts/disposition.py`; it reuses existing machinery, never forks it.

## DEFER → a PENDING row (deterministic)

`disposition.py <root> --defer --flag '<json>'` appends the canonical 11-column row
(`templates/PENDING.md` schema — `| # | Date | Source | Finding | File | Scale | Priority | Impact |
Times Deferred | Status | Verified |`), mints the next `P-id` (max + 1), and stamps
`Verified: @<HEAD sha> <today>` (born re-derivable). The `Finding` carries a `[dimension]`
class-tag prefix.

Reusing **review's recurring-match** (same `File` + >50 % `Finding` word overlap on an open row),
a repeat is an escalation, not a duplicate: Times Deferred `++`, and the priority follows review's
ladder — **TD 2** promotes a `medium`/`low` finding to `high` (caps there); **TD 3+** is treated as
`critical`. The board renders the row as a **debt card for free**; pulse **P8/S8 nags it for free**.

> ⚠ **GAP-A** — the board attributes the debt card via the `File` cell's archmap-owned path, NOT any
> entity field. Pass an entity code path as `file`, or the card renders **cross-cutting** and drops
> out of the entity's column. `disposition.py` validates against `archmap.json` and WARNs
> (report-never) when it would. Ask `mcp__gabe-map__owner_of` for the path BEFORE composing the
> flag — it names the owning entity (`owners`), the entities whose `center.config` code globs claim it
> (`config_glob_owners` — slugs, never the pattern; the glob itself is read from `center.config.json`),
> and whether the census says the map is blind there (`census` + the blind `note`); unowned or blind
> means the card will land cross-cutting, so pick an
> owned path or say so in the `Finding`. No map → the tool says so and `disposition.py`'s WARN is
> the only check.

## TACKLE-NOW → a /gabe-plan phase (a contract, not a writer)

`disposition.py <root> --tackle --flag '<json>'` **prints** a plan-phase spec (the Phases-table row
+ a `### Phase` details block with an explicit `Entities:` bullet — no GAP-A). The model applies it
via **`/gabe-plan update`** (allowed edit: `add-phase` — append or a decimal `N.5`, **never renumber,
never tick cells**; the scope fence belongs to `/gabe-plan`). `regen-mirror.py` writes `PLAN.json`,
`next.mjs` routes it, and the board renders the **build card for free**.

Tackle-now is **new behavior** — review's `fix-now` is inline remediation, not a phase. Only the
DEFER arm reuses review's disposition.

## Reuse map (do not rebuild)

- **DEFER reuses:** the canonical PENDING schema + the `Verified` two-class stamp · `P-id` minting ·
  review's recurring-match dedup + escalation ladder · the board's debt-card read + pulse P8/S8.
- **TACKLE reuses:** `/gabe-plan update [add-phase]` + its scope fence · `regen-mirror.py` ·
  `next.mjs` · the board's build-card read.

The six model-authored PENDING sites (gabe-review/commit/push/assess/init/plan) **may adopt**
`disposition.py --defer` to replace hand-authored rows with the deterministic writer. Until a site
adopts it, the hand-authored row is composed by `mcp__gabe-kdbp__pending_row_preview` — this file's
own column order, the next `P-id` (archive included), the `Verified: @<sha> <date>` stamp and the
recurring candidates (same `File` + overlapping `Finding`) — and then written with Write/Edit, which
is what the D7 hooks watch; the preview writes nothing and reports whether the project even has
`scripts/disposition.py`.

**Consumed by:** the risk sweep (`/gabe-cc-update`, slice 3) routes each dispositioned flag through
this contract. **Battery:** `tests/disposition/run.sh` (14 asserts — canonical row · board-parse ·
recurrence · escalation · GAP-A · tackle · fire).
