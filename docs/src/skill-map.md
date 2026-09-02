# The skill map — 29 skills, and what fires each one

The suite is 29 skills. This page answers two questions the roster alone cannot: **what each one is for**, and **how it is reached** — because a skill nothing fires is only as available as your memory of it.

Everything below is derived from the repo, not from recollection: hook scripts under `scripts/hooks/kdbp/`, the router's own dispatch table in `next.mjs`, and each skill's frontmatter flags. Measured 2026-07-31.

:::note The interactive map
The rendered version of this page — cards per skill, machinery filters, the rulings strip, the E1–E7 matrix — lives as a published artifact: **[Gabe Suite — Skill Map](https://claude.ai/code/artifact/4089cf6d-5639-448f-a5ff-e1969dd5a096)**. This page is its durable half; the artifact is the browsable one.
:::

## 1. How a skill gets called

Six ways, and a skill can be reached by more than one — `/gabe-commit` is both hook-fired and router-dispatched.

| Reached by | What it means | Count | Skills |
|---|---|---|---|
| ⛓ **Hook-fired** | a shipped hook injects it; it can start without anyone typing | 4 | `/gabe-assess` `/gabe-commit` `/gabe-plan` `/gabe-red` |
| ⟳ **Router-dispatched** | `/gabe-next` reads PLAN state and names it as the next beat | 8 | `/gabe-cc-update` `/gabe-commit` `/gabe-execute` `/gabe-mockup` `/gabe-plan` `/gabe-push` `/gabe-red` `/gabe-review` |
| ◎ **Path-triggered** | frontmatter `paths:` offers it when matching files are touched | 1 | `/gabe-mockup` |
| ✋ **Human-only** | `disable-model-invocation` — a model may not start it | 4 | `/gabe-cc-init` `/gabe-init` `/gabe-map` `/gabe-scope-pivot` |
| ▽ **Background** | `user-invocable: false` — loads with other skills, never called alone | 1 | `/gabe-docs` |
| ☝ **Manual only** | nothing fires it; it runs when you ask, and not otherwise | **15** | `/gabe-artifact` `/gabe-cc-entity` `/gabe-docsite` `/gabe-handoff` `/gabe-health` `/gabe-help` `/gabe-lens` `/gabe-meme` `/gabe-myopic` `/gabe-next` `/gabe-imagine` `/gabe-pulse` `/gabe-roast` `/gabe-scope` `/gabe-scope-change` |

**Fifteen of twenty-nine have nothing pointing at them.** That is not a defect — a satellite that fired itself would be worse, and `/gabe-next` is manual by definition since it is the thing you call to be told what is next. But it does mean more than half the suite depends on the operator remembering it exists, which is exactly what the estate sweep in `/gabe-health` was built to surface.

The extreme case is `/gabe-help`: nothing fires it **and** no other skill routes to it. Correct for a skill written for repo visitors rather than for the loop — and worth knowing before wondering why it never runs.

## 2. Wired, and what wires it

| Hook | Event | Injects |
|---|---|---|
| `session-plan-awareness.sh` | SessionStart | the plan's state, pointing at `/gabe-plan` |
| `pre-checkpoint.sh` | PreToolUse | the commit gate, pointing at `/gabe-commit` |
| `plan-proof-guard.sh` | PreToolUse | the proof rule, pointing at `/gabe-red` |
| `direction-guard.sh` | UserPromptSubmit | the steer rule → `/gabe-assess brief` before building |
| `stop-session-reminder.sh` | Stop | uncommitted work, pointing at `/gabe-commit` |
| `session-kdbp-active.sh` | SessionStart | `.kdbp/` state (no skill) |
| `post-structure-warning.sh` | PostToolUse | structure drift (no skill) |

Seven hooks ship; five name a skill. The router adds eight more beats, and `paths:` adds one auto-offer. Everything else waits to be asked.

## 3. The groups

- **The Spine (8)** — the loop every phase rides: `plan → red → execute → review → commit → push → cc-update`, with `/gabe-next` as the wheel. Merging any beat means changing the router.
- **Direction & guard-rails (4)** — `/gabe-scope`, `/gabe-scope-change`, `/gabe-scope-pivot`, and `/gabe-assess`, the direction guard that now fires itself.
- **Verification satellites (4)** — `/gabe-roast`, `/gabe-myopic`, `/gabe-pulse`, `/gabe-health`. All read-only, all forked, all manual.
- **Command center (3 + 1)** — `/gabe-cc-init`, `/gabe-cc-entity` and `/gabe-map` (the map served as MCP tools — its TOOLS are reached for by every skill, only its status/register command is human-only); `/gabe-cc-update` is the fourth member but lives in the spine as a router beat.
- **Documentation (2)** — `/gabe-docs` (background standards, the E1–E7 contract) and `/gabe-docsite`, which since the shell merge renders these very pages into the command center.
- **Session ops (3)** — `/gabe-init`, `/gabe-help`, `/gabe-handoff`.
- **Craft & communication (5)** — `/gabe-lens`, `/gabe-mockup`, `/gabe-meme`, `/gabe-artifact`, and `/gabe-imagine`.

## 4. Reading the machinery

Three kinds back the prose: **⚙ scripts** (deterministic checks a skill runs), **⛓ hooks** (the harness firing something), **▤ schemas & contracts** (a shape or a byte-identical string something else validates). Four skills carry none of the three and are prose specs only — `/gabe-review`, `/gabe-roast`, `/gabe-myopic`, `/gabe-health`. That is a real property, not an oversight: their output is judgment, and no script adjudicates judgment.

The corollary matters more than the count. **A rule with no machinery behind it is a convention, and conventions drift.** The enforcement ledger in the command center classifies all 119 of them on exactly that axis — enforced, hardenable, prompt-only, or falsely claimed — and the falsely-claimed bucket is the one that actively misleads.
