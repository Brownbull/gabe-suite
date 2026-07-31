---
name: gabe-prism
description: "Explanations rendered as a working system — the Gabe register's actors, chain, risks and blast radius drawn as a production floor where the payload moves, machines state their recipe, failures flag themselves and any cell opens to its detail. Five grammars, chosen by the shape of the material, not by taste."
when_to_use: "Explaining something with three or more interlocking parts where a static diagram would hide the cargo — a pipeline, a build, an architecture, a migration, a lifecycle. Also when a reader says a concept map left them lost."
metadata:
  version: 1.0.0
  status: suite skill (generic, project-agnostic)
  scope: any subject that can be decomposed into actors with named payloads
---

# gabe-prism — one subject, split into the grammar that fits

**Usage:** `/gabe-prism <what to explain>` · `/gabe-prism <subject> as <pattern>` · `/gabe-prism patterns`

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

> **One line:** a concept map draws the connections and hides the cargo, so the reader stares at an arrow labelled *processes* with no way to ask what went in or which box jams. A production floor answers both by existing — the item is on the belt, it changes shape at each machine, and the starved machine turns colour before anyone reads a word.

## What it borrows, what it owns

**Borrowed from `gabe-artifact`** — all of the chrome: left anchor, one cog, the roster, three skins, iconed caps pills, the 12px floor, the motion pause contract, the 36-check render gate. A prism page IS an artifact and wears the house.

**Borrowed from the Gabe register** — the material: actors, the chain, risks rendered at their position, cast cards, blast radius, decisions with breaks-if, defers with triggers. Nothing new is invented here, because the register already decomposes a system exactly the way a floor needs it:

| Register element | Floor element |
|---|---|
| HANDLE · one hook line | the line's name plate |
| VALUE · `was → gets`, with numbers | the production readout at the end |
| THE CHAIN · one actor per beat | machines in sequence, payload riding between them |
| a beat's consumes · produces · hands-to | the machine's recipe card |
| ⚠ risk rendered AT its position | an alert badge on that machine |
| the risk's five dots | the alert's inspector fields |
| THE CAST · what · why · does · relation | the panel that opens on click |
| DECISION · CHOSE / ASSUMED / BREAKS IF | a junction: one route live, the other greyed with its breaks-if |
| defer + its trigger | a machine built but unpowered, trigger printed on the housing |
| blast radius | reach highlight — touch a node, everything it touches lights |
| context · where we are now | the state of the floor before anything is pressed |
| MOVE · the single next move | the one machine outlined as next to build |

**Owned here** — the actor table (below), the four-state vocabulary, the pattern chooser, and the verifier that holds them.

## P1 · The actor table, or no floor

Before any pattern is chosen, this table must be fillable. Per actor:

| Field | Required | The failure its absence causes |
|---|---|---|
| name | ✅ | an unnamed machine is a box; the reader cannot refer to it, so cannot ask about it |
| consumes — the payload IN, named | ✅ | without it the belt carries "data" and no hop can be read |
| produces — the payload OUT, named | ✅ | if IN and OUT share a name the machine does nothing and belongs out of the chain |
| one measured number | ✅ | lines, count, coverage, bytes. Absent, every machine looks equally important and no bottleneck can appear |
| state — one of the four | ✅ | the floor lies by omission |
| gate that guards it | — | if one exists it renders in the gate register, never as another stage |
| failure mode | — | what this node does wrong when it goes wrong; the alert's contents |
| inspector payload | ✅ | what does not fit in the cell. Nothing to open ⇒ the cell is not clickable — a control that opens nothing is a defect |

**STOP condition (E6-shaped):** fewer than three actors with *distinct named payloads* is not a floor — it is one sentence, and it ships as one sentence. Decorating a system nobody decomposed is the failure this skill exists to prevent.

## P2 · Four states, because "red or green" collapses three different next moves

| State | Means | House rule it encodes |
|---|---|---|
| **running** | built, and something proves it works | evidence exists and was run |
| **ghost** (dashed outline) | not built yet — an honest absence | an absent source is a NAMED GAP, never a zero, never staged |
| **unpowered** (amber) | exists, but nothing proves it can fail | a gate that cannot fail is non-evidence |
| **broken** (red) | reports success over work it did not do | never assert enforcement that does not exist |

Every state used on a page is legended **on that page**, beside the thing it colours.

## P3 · The chooser — pattern follows material, not taste

Read the actor table, then pick. When two fit, offer both; when the ask says "explain it as a floor / as a belt", the operator's word wins.

| Pattern | Choose when | Gives up |
|---|---|---|
| **belt-line** | one linear chain, ≤7 actors, and payload identity is the point | branching, gate layer |
| **belt-lanes** | the chain forks and rejoins; gates matter | costs more attention to parse |
| **floor-grid** | 8+ actors where adjacency and "which cell is dead" matter | movement becomes secondary |
| **recipe-tree** | the question is dependency — what is missing before X can exist | no sense of time or flow |
| **assembly-step** | teaching someone the system for the first time | slow; a poor reference view |

Each ships as an openable page under `assets/patterns/` — **read one before authoring** (E4). All five render the same real subject, so the differences you see are grammar, not content.

## P4 · The build loop

1. **Fill the actor table.** Cannot fill it ⇒ STOP and write prose (P1).
2. **Choose** with P3 and say which pattern and why, in one line, before building.
3. **Load `gabe-artifact`** and copy its three chrome blocks. The chrome is never re-authored here.
4. **Lift the closest pattern** from `assets/patterns/` and re-point it at the real actor table. Numbers come from the table; a number not in the table does not appear on the page.
5. **Run both gates** (E2):
   ```
   node ../gabe-artifact/tools/verify-artifact-chrome.mjs <file>   # 36 checks
   node ../gabe-artifact/tools/verify-motion.mjs        <file>     # replay · pause · reduced
   node tools/verify-prism.mjs                          <file>     # the contract below
   ```
6. **Publish and report** the URL *and* the absolute source path.

## P5 · What the verifier checks

`tools/verify-prism.mjs`, fixtures in `tests/prism/`:

- every node declares **consumes and produces**, and they differ
- every node carries **at least one number**
- every node's **state is one of the four**, and every state used is legended on the page
- every **clickable cell opens a panel that has content**
- **gates render in the gate register** — no element is both a stage and a gate
- the **payload changes identity at least twice** across the chain, or nothing is being produced

Prose-only, and named as such: whether the actors are the *right* actors, and whether the analogy earns its cost. No script adjudicates that — a reviewer does.

## Anti-patterns

- A floor drawn from a system nobody decomposed (P1's STOP exists for this).
- Motion for its own sake: a taxonomy or comparison matrix does **not** move (`gabe-artifact` H4 decides).
- A number on the page that is not in the actor table.
- Two states where four are needed — "not green" hides whether to build it, prove it, or stop trusting it.
- Re-authoring chrome, palettes or motion primitives that `gabe-artifact` already ships.
