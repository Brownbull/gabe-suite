# Suite backlog — considered, not acted on

> Things this suite has DECIDED are worth thinking about and has deliberately NOT built.
> Opened 2026-07-26 at the end of the board + guard arc, so the reasoning survives the
> session that produced it.
>
> **Nothing here is a commitment.** An entry earns its place by carrying the evidence that
> made it interesting — a measured number, a named finding, a real failure — because the
> cost of re-deriving that later is what makes a backlog rot. An entry with no evidence
> should be deleted, not kept.
>
> Companion records: [`trim-ledger.md`](trim-ledger.md) (what was removed and why),
> [`verification-first/README.md`](verification-first/README.md) (the landed model),
> [`../investigations/2026-07-25-board-spike/`](../investigations/2026-07-25-board-spike/)
> (the board's design record).

## Open

| # | Item | Why it is here | Evidence | State |
|---|------|----------------|----------|-------|
| B1 | **`/gabe-red` — scope is too narrow** | Operator-flagged 2026-07-26: flaws and over-narrow scopes in the red beat, testing-related. A dedicated session is planned to state them. | Operator, from live use on gustify. Specifics not yet written down — **this row is a placeholder for that session, not a finding.** | **NEXT SESSION** — do not pre-empt; the point is to hear the operator's cases first |
| B2 | **Propagate board + guard to both twins** | Everything built 2026-07-25/26 is suite-only by instruction. | 9 commits: board station, guard lens, 4 generator modules, `board.js`, `a3.css`, 3 vendored fixes. | **DEFERRED** by operator — see *Propagation shape* below |
| B3 | **`proof_type: property`** | Plans declare `proof_type` (`test\|visual\|journey`) and `/gabe-red` reads it. For a hard-exclusion SAFETY rule (allergen wall, auth boundary, money) example-based tests are the structurally wrong tool: the rule is a claim about an input SPACE, not about twenty points in it. | gustify testing review 2026-07-25, gap #5: "SC-03/REQ-07's acceptance is unimplemented… you want generated adversarial inputs". Named as one of the two they would add if they could add only two. | **NOT STARTED** — small (vocabulary + one branch in red-spec), high leverage |
| B4 | **A review family for "a green that cannot go red"** | gustify gaps #2 and #7 are one family: framework config that hides reds, and a scheduled guard red so long it is ignored. | #2: no `afterEach(cleanup)` (every component stayed mounted); `__regression__` excluded when `CI=true` → "CI green" ≠ "suite green". #7: nightly watchdog red **5 consecutive nights**. | **NOT STARTED** — split it: the deterministic half (a CI-conditional exclusion is greppable) is a checker; the judgment half ("deliberate or accident?") is one paragraph of review-spec. gustify's own exclusion was DELIBERATE, so automating the verdict would be wrong |
| B5 | **Per-gate red streaks in the center** | A permanently-red signal is indistinguishable from a real regression, so it stops being read. | `run-history.jsonl` records `{source, totals, ts}` — totals only. The center can say "7 runs recorded" and cannot say "this gate has been red 5 nights". | **NOT STARTED** — cheap; the history file exists, it needs a per-gate field rather than a rollup |
| B6 | **Option D — widen gastify's entity registry** | Guard/board attribution is capped by the registry, not by the matcher. | Unattributed app-code rows repeatedly name `settings` (7), `groups` (6), `reports` (4), `retention` (3), `items` (3), `insights` (2) — real product domains with no entity. gustify's residual gap is prose in PENDING's `File` column instead, which no adoption fixes. | **EVALUATE AT PROPAGATION** (operator) — recommended for gastify, recommended AGAINST for gustify |

## Live consequences worth remembering

Not tasks — properties of what shipped, which a future session will otherwise rediscover.

- **`named` is not `guarded`, and most of the estate is `named`.** The guard lens joins NAMES;
  whether a naming case can FAIL is a separate fact that exists only after
  `skills/gabe-red/scripts/prove-guard.py` has been run. With zero proofs on record:
  gustify **0 guarded · 37 named · 139 unguarded**, gastify **0 · 18 · 82**. This is
  deliberate — a twin measured its own void rate at **1 in 6** — but anyone reading the
  center for the first time should know the zero is honest, not broken.
- **`prove-guard --run` must be narrowed to one case.** A suite-wide run makes an unrelated
  failure look like proof, and the script cannot tell the difference. This is its one way
  to lie.
- **The first post-propagation diff will be mostly noise.** `sort_keys` reorders the whole
  archmap once (#150) and every `guarded N/N` becomes `named N/N`. Land it on its own.

## Propagation shape (B2)

Each twin vendors BOTH the generators and the shell, so a sync is four moves, not a copy:

1. **Generators** → twin `scripts/`: new `_a3_board.py`, `_a3_guard.py`; changed
   `_center_data.py`, `_a3_code.py`, `_a3_feature.py`, `build_center_a3.py`, `next_feature.py`
2. **Shell** → twin `docs/site/center/shell/`: `board.html` skeleton, `assets/board.js`, `a3.css`
3. **Regen**, then read the diff against the notes above
4. **Twin-side follow-ups**: gustify #148/#150/#151 can be closed by the sync itself (the
   fixes are upstream as of `033d82e`); B6 decided per twin

## Working note

`git add -A` in a worktree a parallel session is also writing to swept 58 of that session's
files into two commits (2026-07-26). Split back out with `git commit-tree` against a scratch
index — a rebase would have checked out the working tree and destroyed their uncommitted
edits. **Stage explicit paths when another session is live.**
