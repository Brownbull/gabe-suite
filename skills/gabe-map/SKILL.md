---
name: gabe-map
description: "The suite's MCP server — the project's committed codebase map as 15 tools the agent reaches for mid-reasoning (who_calls · touches · owner_of · cases_for · entity_context · entity_shape · map_status + the graft equivalents find · outline · center_overview · blast_radius · map_census · map_diff · center_status · review_drift), read-only, honest-empty without a center. Usage: /gabe-map status | register | probe [root]"
when_to_use: "Manage the gabe-map MCP server: is it registered at user scope, is it disabled in this project, does the running server match the install, does this project have a map. Human-initiated only; the TOOLS themselves are reached for by every skill through mcp__gabe-map__*."
disable-model-invocation: true
metadata:
  version: 1.1.0
---

# Gabe Map — the codebase map as tools

**Usage:** `/gabe-map status` · `/gabe-map register` · `/gabe-map probe [root]`

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

## What this does

`scripts/server.py` is a stdio MCP server (Python stdlib only; the wire framework `mcpwire.py` is shared with gabe-kdbp) that serves a project's committed command-center map — `docs/site/center/{archmap,c4-graph,center.config,adoption}.json` — as fifteen tools: the v1 seven plus the graft equivalents (ruling 2026-09-02: graft serves map creation only; the skills use these). Registered once at **user scope**, it answers in every project from that project's OWN map, and says plainly when a project has none. It is the suite's **reliability surface**: the questions a skill used to answer by remembering to run a script (who calls this, what touches that, which entity owns this path, which cases cover it) become tools advertised to the harness every session. It is NOT a rail — lifecycle moments stay on hooks and gates — and it writes nothing except the gitignored map-delta lines `who_calls` appends when grep finds a code reference the map missed (five gates; see the spec).

Design record: `../../docs/design/gabe-map/README.md`. Binding contract: `references/map-spec.md`.

## The fifteen tools (`mcp__gabe-map__<name>`)

| Tool | Answers | Reads |
|---|---|---|
| `map_status` | is there a map here, how fresh, graft index state, regen command | archmap · c4 · inflight · git |
| `entity_context` | one entity's slice (brief · full · raw); omit slug → the registered list | archmap · adoption · config · c4 |
| `touches` | what touches a file / model / schema / function / entity / endpoint / case | archmap · c4 |
| `who_calls` | who calls or uses a symbol — graft callers ∪ word-boundary git grep, code vs prose | graft index · git grep (+ the emit) |
| `entity_shape` | who owns URL domain /x; orphan domains; a diff's new routes | archmap (fresh) |
| `cases_for` | which C-ids cover X; the corpus's max C-id and next-id floor | archmap · git grep |
| `owner_of` | which entity owns these paths or this directory; where the map is blind | archmap · center.config |
| `find` | X by name/doc across entities, endpoints, models, schemas, functions, screens, FE pieces (graft_find_code's equivalent) | archmap · c4 |
| `outline` | a file's definitions with spans + signatures, owner, models, tests (graft_file_api's equivalent) | graft index · archmap |
| `center_overview` | orientation by entity: rank, status, counts, coverage, arms, census gaps (graft_repo_map's equivalent) | archmap · adoption · c4 |
| `blast_radius` | what a change touches — entities, functions, models, endpoints reached, tests, FE pieces, a reading (floor) | archmap · c4 · git |
| `map_census` | where the map is blind: unclaimed files/models/routes, unwired/ambiguous schemas | archmap |
| `map_diff` | how the committed map changed between two refs, per entity | git show · archmap |
| `center_status` | the center's actionable list, relayed verbatim | scripts/center_status.py |
| `review_drift` | a review's deterministic drift subjects vs a base ref; NOT RUN is first-class | archmap · c4 · PLAN · git |

## Procedure

1. Treat the text after the invocation as the mode: `status` (default) · `register` · `probe [root]`.
2. Read `references/map-spec.md` before acting — the binding tool contract, wire laws and emit gates. If missing, E6 applies — STOP.
3. **status** — run `python3 scripts/mcp-status.py` (installed: `${ECC_ROOT:-$HOME/.claude}/skills/gabe-map/scripts/mcp-status.py`). It reads `~/.claude.json` (never `claude mcp get`, which launches the server to health-check it): registered at user scope? · disabled for this project (`projects[…].disabledMcpServers`)? · the registered command's path vs the installed `server.py` · `server_sha` of the install. Then run the probe (step 5) against the current directory and relay `map_status`. Present the two verbatim.
4. **register** — ask-first, always: show the exact command and run it only after the operator confirms:
   `claude mcp add -s user gabe-map -- python3 "$HOME/.claude/skills/gabe-map/scripts/server.py"` (the shell expands `$HOME`; the harness stores the absolute path). Idempotent: if `~/.claude.json` already carries `mcpServers.gabe-map`, say so and stop. A **restart of the Claude Code session is required** for a stdio server to appear — say so. Equivalent non-interactive form: `./install.sh --register-mcp` in the suite repo.
5. **probe [root]** — one handshake + `tools/list` + `map_status` through the battery's client:
   `python3 "${ECC_ROOT:-$HOME/.claude}/skills/gabe-map/scripts/probe.py" [root]` — prints the tool names and the `map_status` text. Honest-empty on a project with no center (`present: false` + the reason); a suite-center repo answers with ruling R8, never `/gabe-cc-init`.
6. Report (E7): registered/disabled/path-parity · map present + freshness · server_sha. Never register without the confirmation in step 4.

## Output contract (summary)

- **status:** `gabe-map · registered: yes|no (user scope) · disabled here: yes|no · install parity: ok|MISMATCH <path> · server_sha <12hex>` + the `map_status` text for the cwd project.
- **register:** the command, the confirmation, the result line, the restart reminder.
- **probe:** `tools: 15 (…names…)` + the `map_status` text.
- Every tool answer the server returns is ONE text block: a header `gabe-map · <tool> · map@<head> · <fresh|stale|unknown>` and the JSON result; lists are capped and the cap is named; absence is a named `reason`, never silence.
