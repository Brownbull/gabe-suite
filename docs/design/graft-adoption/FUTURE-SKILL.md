# FUTURE SKILL — `GAYGRAPH` (working codename)

> A note-to-future-self, not a spec. Captures the *intention* behind the graft-adoption graph work
> so it survives between sessions. Nothing here is built as a skill yet — the machinery lives as a
> spike (see [`spike/`](spike/)) and a design record (see the `5C-*` files in this folder).
>
> Codename is the operator's word: **GAYGRAPH**. If/when it installs as a suite skill it would follow
> the `gabe-` convention (likely slug `gabe-graph`); the codename stays here as the intent marker.

## The one-line intent

**GAYGRAPH = a skill for *authoring a graph environment*, not for drawing one fixed diagram.**

You hand it a data source (a codebase map — `archmap.json` / `c4-graph.json` today — but the grammar is
source-agnostic) and it lets you *declare the graph you want* along four axes, then renders it live:

1. **What goes in** — which things become nodes (entities: models, functions, endpoints, screens, …).
2. **What fields each entity carries** — the columns/attributes available to drive rendering
   (`behind.fns`, `fanin`, `tests`, `flags`, HTTP `method`, `kind`, …).
3. **How they connect** — which relationships become edges (calls, imports, FK, bridge, …) and what
   each edge's data means (weight · kind · trust · payload · direction).
4. **What effects play across them** — the *encoding grammar*: each field maps to a visual effect, and
   the mapping is **editable per setup**, not hard-coded. This is the heart of the skill.

The point the operator keeps returning to: **the mapping from data-field → visual-effect should be a
thing you compose, inspect, and change** — not a decision frozen into a renderer.

## What the 5C spike already proves (the reusable core)

The live spike ([`spike/index.html`](spike/index.html)) is a working proof of axis 4 — a **data-driven
encoding playground**. Every effect below reads a *real* field from the twin maps; steppers can fake a
value on the selected element to preview the encoding. The grammar (full version in
[`5C-3D-trace.md`](records/5C-3D-trace.md) §9 and mirrored in the handoff):

| effect | reads (field) | render |
|---|---|---|
| icon colour | `kind` (fixed) · or **heat** by mass/fanin/tests | tintable billboard |
| endpoint tint | HTTP `method` | GET green · POST blue · PUT orange · PATCH yellow · DELETE red |
| **mass** | `behind.fns` | the sphere grows (icons never resize) |
| **glow** | `behind.depth` | additive glow |
| **tests** (belt) | `tests` | green satellite belt, spin ∝ flow speed |
| **flags** (belt) | `flags` = god+large+hot | red satellite belt |
| **used-by** (belt/verts) | `fanin` | amber belt *or* radar-vertex lattice glow |
| **god / pulse** | `god` | red satellite + pulse |
| edges | weight·kind·trust·payload·direction | width / colour / dim-if-inferred / particle / flow |

Two design invariants worth carrying into the skill:
- **Effect→field mapping is per-setup and editable** — each row writes `MAP[setup][key]`; presets A/B/C
  swap whole mappings. That editable indirection *is* the skill's value proposition.
- **Scales are twin-calibrated + fixed** (`MAXES.behind=30`, `depth=5`, gastify+gustify p95, n=346) so
  outliers saturate instead of shrinking everyone. A real skill needs a calibration step, not magic maxes.

## What a skill would add on top of the spike

The spike is a *playground*; a skill is a *repeatable authoring flow*. The gap:
- **Source binding** — declare where nodes/fields/edges come from (today hard-wired to synthetic
  recipe+auth payloads; scale-up = read real `c4-graph.json`, FE collapses to one `web` kind + `sites`).
- **Save the composition** — the CONFIG panel already hints at this ("carries into the real diagram");
  the ENCODE panel is marked "not saved". A skill persists the chosen mapping as an artifact.
- **A grammar contract** — the effect catalogue + the field catalogue as declared schema, so a project
  can add a new effect or a new field without editing the renderer.
- **Open threads to resolve first** (from the handoff): used-by has two encodings (belt vs radar-vertex) —
  pick one; the real flag set at scale is god·hot·large-LOC·unguarded; radar sweep azimuthal vs a plane.

## Where the pieces live (so nothing is lost)

- **Intent** — this file.
- **Design record** — [`5C-3D-trace.md`](records/5C-3D-trace.md) §9a–§9x (every step + the why + the fix log),
  [`README.md`](README.md) (the broader graft-adoption plan this graph work sits inside),
  [`5C-HANDOFF.md`](records/5C-HANDOFF.md) / [`HANDOFF-force-graph-5B.md`](records/HANDOFF-force-graph-5B.md) (session resume state).
- **Live machinery** — [`spike/`](spike/) (runnable spike + build recipe + Playwright battery + screenshots).
- **Planning artifacts** — [`artifacts/`](artifacts/) (graft-adoption plan/lineage/tier HTML).
- **Element-components card** — the per-kind colour + card definitions were propagated to the tracked
  `docs/design/codebase-graph-consolidation/element-components.html` (a related, already-landed arc).

## Not built (deliberate)

No skill folder, no frontmatter, no install wiring, no `SKILL.md`. This is research + a spike. Turning it
into `skills/gabe-graph/` is a future decision — when it happens, follow the suite's "Adding a New Skill"
steps in `CLAUDE.md` (lean core ≤200 lines + `references/` deep spec + handshake walk + doctor green).
