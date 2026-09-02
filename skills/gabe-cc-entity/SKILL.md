---
name: gabe-cc-entity
description: "Entity-context reader — assembles one entity's slice (code map + registry + bindings) into a context pack from the command center's committed data, without re-reading the codebase."
when_to_use: "Everything about an entity: brief, context pack, what code/endpoints/models touch X, FK-related entities, coverage status. ONLY with a built command center; elsewhere STOP → /gabe-cc-init."
metadata:
  version: 1.0.2
---

# Gabe Entity — Entity-Context Reader Skill

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

## What this does

Assembles everything the suite already knows about one application **entity** — its code map, its adoption-registry row, and its config bindings — into a single **context pack** (a markdown brief, or JSON for an agent). It is a pure DATA reader: it indexes the command center's committed, read-once `archmap.json` and never re-analyzes the source (E4 reuse-first). The three sources join on the entity **slug**.

This is the DATA answer to "a skill dedicated to Transactions": entities stay data (the D7 ruling — `adoption.json` is the registry, `center.config.json` holds bindings, `archmap.json` is the code map); this reader is a lens over that data, not a per-entity skill. It does not produce or refresh the center — to rebuild the underlying data, run `/gabe-cc-init` or `/gabe-cc-update`.

## Usage / modes

`/gabe-cc-entity <slug> [--center DIR] [--json]` · `/gabe-cc-entity list`

| Mode | Output |
|------|--------|
| **brief** (default) | Markdown pack: Registry · Code (endpoints/models/schemas/files-by-layer) · Relations (FK-derived related entities) · Bindings, with an availability line |
| **json** (`--json`) | The machine context pack — for injecting entity context into an agent or another beat |
| **list** | Enumerate registered entities (slug · display_name · rank · status · mapped/unmapped) |

## Procedure

1. Treat any text after the invocation as `$ARGUMENTS` — the entity slug, or the literal `list`.
2. Read `references/entity-spec.md` before executing — the binding spec (data contract, join, pack schema, degradation rules). If missing, E6 applies — STOP.
3. Locate the center: `docs/site/center/` found up from CWD, or `--center DIR` — `mcp__gabe-map__map_status` walks up for `center.config.json` too, but from the project ROOT (the git toplevel of CWD), so a center homed under a sub-directory is found here and not there; it adds the map's entities and freshness when the server is registered; `--center DIR` has no tool equivalent (the tool resolves a project ROOT). If no `center.config.json` anchor exists, this project has no built center — **STOP and route to `/gabe-cc-init`** (E6), never fabricate a pack.
4. Ask `mcp__gabe-map__entity_context` (`slug`, `detail` brief|full|raw) — the server loads THIS skill's `scripts/entity-context.py` and returns its pack, and for `brief`/`full` adds the entity's C4 L1 edges and its `coverage` row (`raw` is the pack untouched); `python3 scripts/entity-context.py <slug> [--center DIR] [--json]` is the same reader run directly, the fallback when the server is not registered (`/gabe-map status`) or when the center sits outside a project root. Do NOT re-derive the slice by reading source; both index the committed `archmap.json`.
5. Present the reader's output verbatim. If it STOPs (unknown slug, no center, no data), surface its message and available-entity list — do not invent a slice.
6. Choose the detail by consumer: **brief** for a human (counts + names, capped) · the working slice for a session mid-task (`detail: full`, capped lists that name their cap) · **`detail: raw`** — parity with the script's `--json` — when an agent or a downstream beat needs the whole pack as structured context.

## Output contract (summary)

Brief mode: a markdown pack headed `# Entity context — <name> (slug: <slug>)` with an availability line (`archmap ✓ · adoption ✓ · canonical config ✓/—`) then Registry / Code / Relations / Bindings sections. JSON mode: `{slug, display_name, source, registry, code (+counts), relations (fk_out/related_entities/unresolved_tables), bindings, availability}`. Degrades honestly and never crashes on partial data: an unmapped entity → `code: null`; a legacy-shape or absent config → `bindings: null` with `config_canonical: false`. The full output contract in the spec is binding.
