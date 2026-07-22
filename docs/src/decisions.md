The [verification-first](verification-first.html) architecture didn't fall out of a diagram — it was settled by a set of rulings, each one a fork where the suite could have gone a cheaper or a heavier way. Seven of them (D1–D7) were locked together as a set, and they're worth reading because each answers a real objection someone raised. This page is the single home of those rulings, including **block-lies-warn-debts** (D7), which the four laws only *name*.

## The seven decisions

| # | The question | The ruling, and why |
|---|---|---|
| **D1** | How hard should verification gate an MVP? | **Report, never gate.** Red runs at *every* tier (`min_cases=1` even at MVP) and coverage/digest are reported everywhere — but no new gate can *block* an MVP ship. Verification is visible on every change without slowing delivery. |
| **D2** | Who records that a *human* actually used the feature? | **Add [`/gabe-walk`](commands.html)** (~40 lines: append who · when · result · evidence to `walks.jsonl`). It's a verification act — the one input with no machine source. A NEVER-walked station renders red until the first walk. |
| **D3** | What media does a release page carry? | **Shots + diagrams in v1; video custody deferred** to the first real release. Video stays machine-local and is never committed — a named gap, not a faked one. |
| **D4** | Does the suite need a `BEHAVIOR.md`? | **The template ships.** It's load-bearing three ways: the project's verify commands, its `critical_paths` hotfix arm, and its `results_out` digest target. Greenfield gets `results_out` on by default; brownfield opts in. |
| **D5** | How do existing test corpora adopt [C-ids](c-id.html)? | **A mechanical backfill sweep**, one commit per repo, registered in `.git-blame-ignore-revs` — with **no fake reds.** A backfilled test gets an id, but its ever-red column stays honestly empty, because it was never actually seen to fail. |
| **D6** | Which remaining test-first ideas are in? | **Ratified:** red-as-commit (the `RED:` trailer), case-drift checks live in *review* (judgment-shaped work in a judgment-shaped beat; commit keeps only deterministic greps), growth findings capped at 7, and `/gabe-feature` survives shrunk-in-place. |
| **D7** | What does the harness enforce? | **Block lies, warn debts.** A hook blocks a ✅ whose proof doesn't exist on disk or git — at every tier. Everything else (thin coverage, un-walked stations, absent angles) is *warned*, never blocked. Enforcement then leaves the skill prose and lives in the hook, so the skills stay lean. |

:::note D7 is the harness half of the fourth law
[Law 4](verification-first.html) says "block lies, warn debts." D7 is where that becomes a running hook: `plan-proof-guard` fires on writes to `PLAN` and blocks a tick whose proof isn't on disk; the pre-checkpoint hook adds the C-id and case checks as *warnings*. A dishonest state can't land; an honest-but-incomplete one always can.
:::

## Standing red flags

These are gaps left open **on purpose.** Naming them is the point — a silently-missing capability reads as "covered" when it isn't, which is exactly the failure the whole model exists to prevent.

- **The human-witness gap is not closed by machines.** Red, C-ids, and release pages are all still produced by an agent. A fresh-context evaluator is *also* an agent. Only [`/gabe-walk`](commands.html) records an actual human — so the center renders an un-walked station red until a person signs it, and no amount of green automated tests turns that column green.
- **Architecture and procedures are a content gap.** The center renders *honest absence* for these rather than seeding prose from machine state — because deriving narrative from git is fabrication, not projection (the anti-bloat law). An empty architecture page is more honest than an auto-written one.
- **The generator concentrates logic.** Promoting the center's generator into the shared suite was accepted as ripe, but it means logic now lives in one place that must stay on the drift-checker's radar — a watched trade-off, not a solved one.

## The rollout rulings

A pre-rollout review produced a further set of rulings (R1–R7) before the design landed on real repos. Two shaped the product lastingly:

- **R1 — red-column retrofits seed honestly.** Adding a Red column to an existing plan seeds "to-do" *only* where execution is still to-do; already-shipped rows render `—` and never demand a retroactive fake red.
- **R7 — [`/gabe-adopt`](command-center.html) is its own skill** — brownfield command-center adoption: archive-never-delete init, a machine-ranked shortlist, one section per run at human speed, and approval recorded as a walk.

The rest (R2–R6) were mechanical honesty fixes to the enforcement scripts — the kind of fixture-level tightening that keeps a checker able to both fire and stay silent.

:::note Next
- [The one picture & the four laws](verification-first.html) — the model these rulings settled.
- [/gabe-red](gabe-red.html) — D1 and D6 in action.
- [The command center](command-center.html) — where D2, D3, and R7 land.
:::
