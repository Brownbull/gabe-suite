# Gabe Pulse — binding spec

> The deep spec for `/gabe-pulse`. `SKILL.md` is the lean core and carries the summary;
> this file is binding wherever the two could be read differently.
>
> Pulse is a **satellite**: read-only, human-invoked, dispatches nothing. Every rule below
> exists to keep it from becoming a nag surface — a report that fires on everything is
> muted within a week, and a muted report is worse than none because it looks like coverage.

## §0 Contract

Runs under E1–E7 (`../../gabe-docs/references/execution-contract.md`). Two floors bind hardest:

- **E1 EVIDENCE** — every row cites the artifact it read. No row is emitted from inference,
  from prose, or from a session transcript. If a signal cannot be measured, it is
  `undetermined`, never clean.
- **E3 NO SILENT DOWNGRADE** — a signal that did not run prints an enumerated reason. The
  roster line at the end of the report is not optional; it is how the reader distinguishes
  "nothing owed" from "nothing looked".

## §1 Gate and modes

### 1.1 Gate

Pulse runs anywhere. It does **not** require `.kdbp/`. What varies is which signals resolve.

| Repo shape | Detection | Signal set |
|---|---|---|
| KDBP project | `.kdbp/BEHAVIOR.md` exists | all ten |
| Command-center project, no KDBP | a center config exists and declares `paths.ledger` | P1–P3, P10, plus any the config names |
| Plain git repo | `git rev-parse` succeeds | P2, P3, P10 |
| Not a git repo | — | STOP: `pulse: not a git repository — nothing to measure` |

**Ledger location.** P1 needs a ledger. Resolution order, first hit wins:

1. `--ledger <path>` on the command line
2. `.kdbp/LEDGER.md`
3. the center config's `paths.ledger`, if declared

A repo with none of these reports P1 as `undetermined — no ledger surface` and continues.
This is the R8 case: the suite repo carries no `.kdbp/`, so its ledger is config-named.

### 1.2 Modes

| Invocation | Behavior |
|---|---|
| `/gabe-pulse` | full banded report |
| `/gabe-pulse brief` | headline + roster line only; no table |
| `/gabe-pulse --json` | machine output, schema in §4.3; suppresses all prose |
| `--since <ref>` | passed to P1 verbatim; narrows the commit range |
| `--bookkeeping <prefix>` | repeatable; passed to P1 verbatim |

Unknown arguments are an error, not a silent ignore: `pulse: unknown argument: <x>` and STOP.

## §2 The ten signals

Every signal is deterministic and costs zero LLM calls. Run them in this order; none depends
on another's result, so a failure never cascades.

### P1 · Unregistered commits — EVIDENCE

```
bash <skill>/scripts/ledger-gap.sh --json [--since <ref>] [--ledger <path>] [--bookkeeping <p>]...
```

Exit `0` clean · `2` gap · `1` undetermined. **Exit 1 is not clean** — surface the `reason`
field verbatim. Row text: `N unregistered commits · M bookkeeping excluded`. The bookkeeping
count is always shown when non-zero; the filter is never allowed to shrink the number silently.

Evidence: the JSON's `baseline` and `registered_hashes`. Clearing command: `/gabe-commit`
for future work; for the existing gap, a ledger row or an accepted decision to leave it.

### P2 · Uncommitted changes — EVIDENCE

```
git status --porcelain
```

Count tracked modifications and staged entries. **Untracked-only does not fire** — matching
`stop-session-reminder.sh`, so the two surfaces never disagree about what "dirty" means.
Row: `N uncommitted paths`. Clearing command: `/gabe-commit`.

### P3 · Unpushed commits — SHIP

```
git log --oneline @{u}..HEAD
```

No upstream configured → `undetermined — no upstream for <branch>`, not clean. Row:
`N commits ahead of <upstream>`. Clearing command: `/gabe-push`.

### P4 · Router's next step — LIFECYCLE

```
node ../gabe-next/scripts/next.mjs --json
```

Report its decision **verbatim**. Exit `1` → its terminal message (no plan / plan complete)
becomes the row. Exit `2` → `undetermined — PLAN.json unusable`.

Pulse never re-derives this. Two readers of PLAN cells that disagree is a second source of
truth, and the router is the one the lifecycle already trusts.

### P5 · Prior-phase debt — LIFECYCLE

From the same `next.mjs --json` payload: its prior-row sweep. Row lists phase ids and which
cells are outstanding. Clearing command: the beat each cell names.

### P6 · Center coverage — LIFECYCLE

Phases whose `Center` cell is `⬜` **and** whose `Push` cell is `✅` — shipped but uncovered.
Column absent → `unavailable — no Center column` (normal, not a defect). Clearing command:
`/gabe-cc-update <phase>`.

### P7 · Red debt — LIFECYCLE

Phases whose `Red` cell is `⬜` **and** whose `Exec` cell is not `⬜` — executed without a
committed red checkpoint. Column absent → `unavailable — no Red column`. Clearing command:
`/gabe-red <phase>`.

> A phase with `Red ⬜` and `Exec ⬜` is not debt — it is simply not started. Reporting it
> would make every unstarted phase look owed, which is how a report earns its mute.

### P8 · PENDING escalations — AGING

`.kdbp/PENDING.md` rows with `status=open`. Report two numbers: total open, and how many sit
at `Times Deferred ≥ 3` (gate-spec's forced-decision threshold). Only the second is a row;
the total is context. Clearing command: `/gabe-review deferred`.

### P9 · Never-walked stations — AGING

Stations declared in the center config that have **zero** entries in `.kdbp/walks.jsonl`.
Never-walked is the reportable state; a stale walk is not pulse's business (the center already
renders staleness). Clearing action: append a walk record to `.kdbp/walks.jsonl` (the `/gabe-walk` skill was archived 2026-07-30; the record format survives).

### P10 · Size-budget breaches — AGING

```
bash ../gabe-commit/scripts/size-budget.sh $(git diff --name-only HEAD)
```

**Pass the file list explicitly.** A bare invocation defaults to `git diff --cached --name-only`
and, with nothing staged, exits 0 having inspected **zero files** — a vacuous pass reported as
clean. The first live run of this skill hit exactly that (2026-07-26). Always state the count:
`clean — N files inspected`. `N = 0` because nothing changed is clean; `N = 0` from a wrong
invocation is not, and only the printed count tells them apart.

Exit `2` = breaches exist. **Advisory only** — R9 makes the 800-line budget report-never-gate,
so this row never reads as blocking and never proposes a fix.

## §3 Ranking and caps

### 3.1 Band order

`EVIDENCE` → `LIFECYCLE` → `SHIP` → `AGING`. Fixed; not re-sorted by count or severity.

EVIDENCE leads because it is the only band where the **record** is missing rather than the
work. Everything in the other three bands describes something the project can still see and
act on; an EVIDENCE gap is the class that disappears.

### 3.2 The headline

One line, above the table: the highest-band row with the largest count, phrased as a fact.
If every signal is clean or unavailable → `▶ nothing owed`. If every signal is *unavailable*
→ `▶ nothing measured — N signals unavailable` (never `nothing owed`; that would be the
absence-of-evidence error the whole skill exists to prevent).

### 3.3 Caps

Five rows per band. A truncated band ends with `… N more`. Within a band, rows sort by count
descending, ties by signal id. **No silent caps** — a cap that does not announce itself reads
as coverage.

## §4 Output contract

### 4.1 Full report

```
PULSE — <project> · <date>

▶ Most important: <headline>

EVIDENCE
  P1  <row text>                                → <clearing command>
  ...
LIFECYCLE
  ...
SHIP
  ...
AGING
  ...

signals: N ran · M unavailable (<id> <reason> · <id> <reason>)
```

Bands with no rows print `clean` on one line rather than being omitted — an omitted band is
indistinguishable from a band that was never checked.

### 4.2 Brief

Headline plus the roster line. Nothing else.

### 4.3 JSON

```json
{
  "project": "<name>", "generated": "<ISO date>",
  "headline": "<text>",
  "bands": { "EVIDENCE": [ {"id":"P1","text":"…","command":"…","count":73,"evidence":"…"} ], … },
  "roster": { "ran": 8, "unavailable": [ {"id":"P9","reason":"no walks.jsonl"} ] }
}
```

`generated` is the date the run happened, read from the environment — never fabricated.

## §5 Degradation table

| Signal | KDBP project | Center-only repo | Plain git repo |
|---|---|---|---|
| P1 unregistered | yes | yes, if `paths.ledger` | no — `no ledger surface` |
| P2 uncommitted | yes | yes | yes |
| P3 unpushed | yes | yes | yes |
| P4 router | yes | no — `no PLAN.json` | no |
| P5 prior debt | yes | no | no |
| P6 center | if `Center` column | no | no |
| P7 red | if `Red` column | no | no |
| P8 pending | yes | no — `no PENDING.md` | no |
| P9 walks | if walks.jsonl | if walks.jsonl | no |
| P10 size budget | yes | yes | yes |

In this repo (suite, R8 — no `.kdbp/` by ruling) pulse resolves **P2, P3 and P10**, and
enumerates the other seven as unavailable with reasons. That is the intended behavior, not a
degraded one: the suite's open moves live in the board's sources, and pulse says so rather
than pretending to measure a lifecycle that was deliberately not adopted.

**P1 is unavailable here, by decision.** `suite-center.config.json` declares no `paths.ledger`
and will not: `/gabe-commit` writes rows into `.kdbp/LEDGER.md` and is KDBP-gated, so nothing
in this repo would ever write a ledger. A declared-but-unwritten ledger would flip P1 from
`no ledger surface` to `no baseline` — configured-looking and measuring nothing, which §7
forbids. Operator ruling 2026-07-26: accept P1 as unavailable here. Revisit only if something
starts writing ledger rows in this repo, which would mean revisiting R8 itself.

> An earlier draft of this section claimed P1 resolved here. The first live run of the skill
> disproved it. Kept as a note because the failure mode — a spec asserting a capability its
> own environment cannot provide — is the one E1 exists to catch.

## §6 Seams

Checked against the adjacent specs at authoring time (CLAUDE.md's handshake-walk rule).

| Neighbor | Seam | Resolution |
|---|---|---|
| `/gabe-next` | both read PLAN cells | pulse **calls** `next.mjs --json` and quotes it; it never parses cells itself for P4/P5 |
| `/gabe-health` | both survey the project | health = code condition (god files, churn, coupling); pulse = lifecycle completeness. No overlapping signal |
| `/gabe-review` | both surface owed work | review prices and triages a diff; pulse counts and points. Pulse never opens a finding |
| `/gabe-commit` | both read the LEDGER | commit **writes** rows; pulse only subtracts against them. Pulse writes nothing |
 | walks.jsonl records | both read walks.jsonl | walk records land by hand or via /gabe-cc-init approvals; pulse counts never-walked. Pulse never appends |
| `stop-session-reminder` hook | both define "dirty" | identical rule — tracked modifications only, untracked-only does not fire |

## §7 What pulse must never become

Recorded because the suite has already made this mistake once: the LEDGER per-tool-call writer
was retired in A2 KDBP-lite after it filled a real project's ledger with five garbage rows from
`[pre-flight]` and `[classifier]` output lines.

- Never fires automatically. Human-invoked only.
- Never writes. The moment pulse records something, it becomes a source of truth that can
  disagree with the ledger it reads.
- Never lists more than the cap. A 40-row report is a muted report.
- Never reports a clean signal as a row. Bands print `clean`; individual clean signals do not
  earn a line.
- Never converts an `undetermined` into a `clean`. That is the absence-of-evidence error, and
  §12 PROXY EVIDENCE names it as the suite's dominant recurring failure class.
