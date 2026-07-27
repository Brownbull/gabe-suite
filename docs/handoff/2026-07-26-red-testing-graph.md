# Handoff — /gabe-red scope · testing strategy · the graph-engineering PDF

> Written 2026-07-26 at the end of the suite-center arc, for a session that will
> take up three threads deliberately left untouched today. Everything below is
> pointers and settled context — **no conclusions are pre-drawn**, because on the
> first thread the operator's own cases are the input.
>
> State at handoff: working tree clean, 14 commits unpushed on `main`,
> `suite-doctor` CLEAN, 298 assertions green across 9 batteries.
> **No propagation to gustify or gastify** — suite-only by instruction.

---

## Thread 1 — `/gabe-red`: the scope is too narrow

**Status: NEXT SESSION. Do not pre-empt.**

`docs/design/suite-backlog.md` row **B1** exists precisely to hold this open:

> Operator-flagged 2026-07-26: flaws and over-narrow scopes in the red beat,
> testing-related. A dedicated session is planned to state them. Specifics not
> yet written down — **this row is a placeholder for that session, not a
> finding.**

The point of the session is to **hear the operator's cases first**. Arriving with
a designed fix would defeat it. The right opening move is to ask what broke in
live use on gustify, then work outward.

Context worth having loaded, not acting on:

| Where | What it establishes |
|---|---|
| `skills/gabe-red/SKILL.md` (v1.3.1) | the beat's current contract — declare cases, prove RED by assertion, commit the failure |
| `skills/gabe-red/references/red-spec.md:44-95` | the `RED:` trailer, `Cases:` NEW/BUMP/GUARD syntax, enumerated skips |
| `scripts/hooks/kdbp/plan-proof-guard.sh:103-110` | the only mechanical enforcement of any of it — `red==done ⇒ cases non-empty + red@<sha> reachable` |
| `docs/src/gabe-red.md` | the published rationale, for checking whether the doc still matches intent |
| suite center → **Enforcement**, filter `?beat=red` | the 6 catalogued rules on this beat and their buckets |

One measured fact the session should not have to rediscover: the guard has
**ten fail-open paths**, five of which its own header does not mention, and its
sha cache silently passes any lie past 200 entries. Probed and recorded in
`docs/center/data/facts.json`; rendered on the center's **Hooks** station.

---

## Thread 2 — testing strategy

Three backlog rows are one family, and none has been started:

- **B3 — `proof_type: property`.** Plans declare `proof_type (test|visual|journey)`
  and `/gabe-red` reads it. For a hard-exclusion SAFETY rule (allergen wall, auth
  boundary, money) example-based tests are the structurally wrong tool: the rule
  is a claim about an input SPACE, not about twenty points in it. Evidence:
  gustify testing review 2026-07-25 gap #5. Small — vocabulary plus one branch in
  red-spec.
- **B4 — a review family for "a green that cannot go red".** gustify gaps #2 and
  #7: framework config that hides reds (`no afterEach(cleanup)`, `__regression__`
  excluded when `CI=true`), and a nightly watchdog red **5 consecutive nights**.
  Split it — the deterministic half is greppable, the judgment half ("deliberate
  or accident?") is a paragraph of review-spec. gustify's own exclusion was
  DELIBERATE, so automating the verdict would be wrong.
- **B5 — per-gate red streaks.** `run-history.jsonl` records `{source, totals, ts}`
  — totals only. The center can say "7 runs recorded" and cannot say "this gate
  has been red 5 nights".

**Read alongside them: `docs/handoff/2026-07-20-gastify-center-evolution.md` §12
PROXY EVIDENCE** (committed today, `ca15120`). A retrospective over 30 sessions,
1236 commits and 218 LEDGER rows names one dominant class — *accepting a signal
that correlates with the property in place of observing the property itself*. Its
proposed suite change is to sharpen **E1 EVIDENCE** so evidence must be of the
property, not a correlate, and to give the failure mode a handle. B4 is arguably
a special case of it. The document notes the suite has converged here three times
already.

What the new suite center now measures, which this thread can use as its baseline:

| Fact | Where to see it |
|---|---|
| **15 gates with no battery**, led by `suite-doctor.sh` itself — the gate that enforces the fixture rule on everything else | Testing → *Gates with no battery* |
| 9 batteries · 298 assertions · 0 red | Testing → *Fixture batteries* |
| Which batteries prove **both FIRE and SILENT**, and which only claim to | same table, per row |
| 5 of 6 hooks cannot block; the one in the pre-emptive slot never returns non-zero | Hooks |

---

## Thread 3 — the graph-engineering PDF

`docs/investigations/2026-07-23-anthropic-graph-eng/Graph-Engineering-Athropic-Playbook.pdf`

**Read this before weighting it.** Two facts established by a verified audit on
2026-07-25:

1. **It is not an Anthropic publication.** Page 1 line 7 and the page 12 footer
   both state: *"Independently compiled, July 2026 — not affiliated with or
   endorsed by Anthropic."* It is a third-party synthesis of Anthropic's public
   cookbook, *Building Effective Agents*, and *Scaling Managed Agents*. Treat it
   as a secondary source; go to the primaries for anything load-bearing.
2. **It is an orphan.** Zero inbound references anywhere in the repo (`grep` for
   `graph-eng` / `Graph-Engineering` returns only the file itself). It arrived as
   a drive-by inside an unrelated commit, `13a2019` "feat(center): the TESTING
   ESTATE".

The Read tool cannot open it — poppler is absent. Extract with `pymupdf`.

Its load-bearing structural claims, if the session wants them:

- *"The schema is the contract: the API call either returns a valid
  `ExtractedGraph` object or raises an error. No parsing, no validation, no
  silent corruption."* (§III.B) — Pydantic `BaseModel`s passed as
  `output_format=` to `client.messages.parse()`.
- Tied explicitly to Anthropic's *"crafting the agent–computer interface"* —
  making tools hard to misuse.
- *"Version the schema"* as standing operational discipline (§XI.E).
- A 10-item production-readiness checklist (App. D, p11-12).

**Why this collides with the suite's own state.** The audit found the suite
enforces Pydantic **nowhere**: zero `import pydantic` anywhere, no Python
dependency manifest at all, and its only validator uses `jsonschema`. Meanwhile
`skills/gabe-review/references/review-spec.md:503` and
`skills/gabe-push/references/push-spec.md:306` declare typed pseudo-classes
labelled *"Structured output (PydanticAI `output_type` … )"* for beats that run
inside Claude Code, make no API call, and have no runtime that could pass an
`output_type`. Both are catalogued as BROKEN_CLAIM.

Suite center → **Enforcement**, then filter Bucket = *Broken claim*, or open
`enforcement.html?bucket=BROKEN_CLAIM#sec-broken_claim` directly.

---

## Where to start reading

```bash
open docs/site/center/index.html      # leads with "Needs attention" — 13 linked rows
bash docs/center/generators/refresh_suite_center.sh   # rebuild + gate
bash tests/suite-center/run.sh        # 28 assertions
bash scripts/suite-doctor.sh          # must be CLEAN
```

Landing pointers for the three threads:

- Thread 1 → `enforcement.html?beat=red`
- Thread 2 → `testing.html#sec-uncovered`
- Thread 3 → `enforcement.html?bucket=BROKEN_CLAIM#sec-broken_claim`

## Standing constraints

- **No propagation to the twins.** Everything from 2026-07-25/26 is suite-only by
  instruction; backlog **B2** holds the propagation, DEFERRED by the operator.
- **Nothing is pushed.** 14 commits sit on `main` unpushed — only the operator
  pushes. They are the `ship` track on the board.
- `templates/`, `skills/` and `tests/` outside `tests/suite-center/` were not
  touched by the suite-center arc.
- `build_suite_center.py` is **1,399 lines, 599 over the 800-line budget** —
  report-never-gate, and it carries its own card on the board's budget track.
