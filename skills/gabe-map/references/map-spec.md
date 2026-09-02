# gabe-map — the binding tool contract

> The deep spec for `skills/gabe-map/scripts/{server.py, mapquery.py, tools.py}`. SKILL.md is the lean core; this
> file binds. Design record with the evidence behind every law: `docs/design/gabe-map/README.md`.

## 1 · What it is, and is not

`gabe-map` is a stdio MCP server (Python stdlib only) registered once at **user scope**. In every project it serves
that project's OWN committed codebase map — `docs/site/center/{center.config,archmap,c4-graph,adoption}.json` — as
seven tools. It is the suite's **reliability surface** for questions an agent asks mid-reasoning; it is **not a rail**
(lifecycle moments stay on hooks and gates), **not a mutation channel** (no `.kdbp`, center or source writes), **not a
data dump** (every list capped, every cap named), and **not graft** (graft builds the structural index the map is
generated from; the tools sit on top and add entities · ownership · cases · coverage · drift · deltas — ruling
2026-09-02: graft's own MCP/hooks retire from the twins).

## 2 · Wire laws (verified against Claude Code 2.1.257/258)

- **Framing.** Newline-delimited JSON-RPC 2.0, UTF-8, one message per line, flushed per message, on the ORIGINAL fd 1.
  At startup the server `dup`s fd 1 and re-points fd 1 at stderr, so prints and child processes can never touch the
  wire. stderr is the log (`GABE_MAP_LOG=1` verbose).
- **Routing by shape.** `method`+`id` → request · `method` without `id` → notification (never answered) · `id` without
  `method` → a response to the server's own request (`roots/list`, ids `srv-N`). Unknown method → `-32601` with the
  id echoed verbatim (string ids preserved). A line that does not parse is logged and skipped; a JSON array (a
  2025-03-26 batch) is ignored; EOF → exit 0. A handler exception → `-32603`; a tool-body exception → `isError:true`.
- **Lifecycle.** `initialize` echoes the client's `protocolVersion` when it is `2025-11-25` or `2025-06-18`, else answers
  `2025-11-25`; declares `capabilities: {tools: {}}` only; returns `instructions` (§4). `ping` → `{}` at any time.
  Before `notifications/initialized`: `tools/*` → `-32602`, anything else unknown → `-32601` (the `server/discover` probe
  under `MCP_PROTOCOL_NEGOTIATION=auto` arrives FIRST and must be answered this way, never by exiting). After
  `initialized`, if the client declared `roots`, the server sends `roots/list` once (and again on
  `notifications/roots/list_changed`); `file://` URIs are percent-decoded.
- **Results are ONE text block.** `tools/call` → `{content:[{type:"text", text}], isError}`. Never `structuredContent`
  (the harness hides the text block when it is present). `text` = header `gabe-map · <tool> · map@<head> · <freshness>`
  (or `· no map`) + the JSON result (`indent=1`). Every human-facing string lives INSIDE that JSON.
- **Deferral.** The harness defers every MCP tool's schema (verified: names only in context, loaded on demand). The
  discovery surface is therefore the seven NAMES plus the `instructions` block — both must route the question to the
  tool. Descriptions are read only after a tool is loaded.
- **Laziness.** Nothing heavy before `initialize` is answered; the map loads on the first call and is cached per
  `(path, mtime, size)`; indexes rebuild when archmap/c4 change on disk.

## 3 · Root, center, honest-empty

- **Root (per call):** explicit `root` argument → `CLAUDE_PROJECT_DIR` → `roots[0]` → cwd; then the **git toplevel** of that
  directory (a subdirectory launch must not narrow grep or mislead the emit). Never cwd first — a user-scope server
  starts in `~/.claude`.
- **Center:** `docs/site/center/center.config.json` found walking UP from the root; the project root is the center's
  grandparent (`docs/site/center` → root), and every reused loader receives THAT root.
- **Honest-empty is an answer** (`isError:false`): no center → `{present:false, root, reason, hint}` where `hint` points to
  Grep/Glob and `/gabe-cc-init`; a suite-center repo (`docs/center/suite-center.config.json`) answers `reason: … ruling
  R8` with NO cc-init hint. Unknown slug → the reader's STOP text as `stop`. Unknown symbol in graft → `map_claim:
  absent: symbol not in the graft index`. A missing archmap block → an empty section with `reason`. Bad input
  (missing `target`, non-identifier `symbol`, bad `detail`) → `{stop: <message>}` with `isError:true` so the model
  self-corrects.
- **Freshness on every answer** (`map` + `freshness`): `head` (archmap) · `base` = the last commit that touched
  `archmap.json` when it descends from `head` (the regen commit bundles source the map already reflects), else `head` ·
  `commits_since` · `mapped_files_changed` = `git diff --name-only <base>` (index + worktree) ∪ untracked files,
  ∩ the mapped set (every `entities[].files` path ∪ `fe.pieces[].file`), source extensions only, cap 40 ·
  `stale`: `true|false|null` with `freshness: fresh|stale|unknown|uncommitted regen` and a `reason`. **Stale = a mapped
  source file changed since the base, never the commit count** (`commits_since ≥ 1` on every healthy twin).

## 4 · The instructions block (the discovery surface)

Injected in full every session even when every schema is deferred. Routes one line per tool (grouped two per line for
wave 2), states the floor law once, names `map_status` as the first call when unsure. Text: `tools.INSTRUCTIONS`
(≤ ~1,600 chars with the fifteen tools). Any change to a tool name changes this block in the same commit.

## 5 · Tools — inputs · process · output · caps

Common: `root?` (string). Every list is capped at 40 (`CAP`) and the cap is named (`+N more (cap 40)` or a `_note`).

### 5.1 `map_status(root?)` — read-only
Presence, `entities`, `counts{entities, endpoints, models, schemas, files_mapped, functions_py, fe_pieces}`, `file_census
{claimed, unclaimed}`, `graft{index_present, wiring_mtime, live_index_hash, committed_index_hash, match, note}` (hashes
`graft/.graph/wiring.json` — NEVER `graft check`, 18.7 s, and never a build), `kdbp_present`, `inflight{head, active,
current_phase, commits_behind}`, `regen_cmd`, `server_sha` (md5 of the three scripts — the install-vs-running check).

### 5.2 `entity_context(slug?, detail?=brief, root?)` — read-only
No slug / `list` → the registered entities (adoption ∪ archmap, `mapped` flag). With a slug → `entity-context.py`'s
`build_pack` (imported, its `fail` raised as a stop) projected by `detail`: **brief** = counts + names (endpoints as
`METHOD path`, model/schema class names, files per layer, registry/bindings/relations as counts; ~1–1.5k tokens on
gustify's largest entity) · **full** = capped projection (endpoints ≤40 with fn/file, models with 10 column names, schemas
with field counts, files ≤40 per layer, defines ≤40 per file) · **raw** = the uncapped pack, byte-identical to
`entity-context.py --json` (parity-tested). Plus, except for raw: `c4{l1_edges (calls/imports are floors, fk exact),
l2_node_kinds, fe_home}` and `coverage[slug]` (or a `reason`).

### 5.3 `touches(target, root?)` — read-only
Kind detection, in order: `^(GET|POST|…)\s+/` → **endpoint** (method required; both sides normalized: strip `/api/vN`,
`{x}`/`${x}` → `{}`, rstrip `/`) · contains `::` or `#` → **function** (qualified; `#` → `::`) · contains `/` or a source
extension → **file** · `^C\d+$` → **case** · an entity slug → **entity** (brief context) · a class in `model_insight` →
**model|schema** · a name in `defines` that is not a function → **define** · else **function_bare** (ALL matching keys;
2+ → `ambiguous[]`, 0 → `found:false` with the grep floor named).
Per kind: **file** → `owners[]` (a LIST — files can have two), `census` (claimed / unclaimed + reason), `defines`,
`functions`, `models_defined`, `models_referenced`, `tests_reaching`, `guard{share, unguarded, proven}`, `fe_pieces`,
`web_node`; a test file adds `exercises`. **model/schema** → `definition{table, cols, fks, doc}`, `insight`, `fk_in_models`
(computed from every model's `fks`), `functions_rw` (from `function_insight.access.ops`), `referenced_from`,
`endpoint_edges` grouped by kind over l2 ∪ cross_edges (kind-less FK rows read as `fk`), `tests{cases, covered_by_test_files}`.
**function** → the insight record, `handler_of`, `access_ops`, `tests`, `endpoints_reaching{found, unverifiable, floor}`
(`behind.names` is capped at 12 and joins on the bare name — a FLOOR). **endpoint** → `entity`, `endpoint{handler, status,
resp, doc, middleware, touches_own}`, `behind`, `access`, `edges_out`, `screens_in` (bridges), `tests` (rows with
`state:"file"` become `covered_by_test_files`, never cases); `touches_x` is NEVER surfaced.

### 5.4 `who_calls(symbol, emit?=true, root?)` — read + the ONE write
`symbol` must match `^[A-Za-z_][A-Za-z0-9_]*$`. Arm A: `graft callers <sym> . --json --no-refresh` when `<root>/graft/`
exists (never a build/refresh; the `saved` object is dropped; the binary missing or failing → `callers_status:
unavailable…`). Arm B: `git grep -nwI --untracked --full-name -e <sym>` scoped to source globs with the center dirs,
node_modules, dist and `*.min.js` excluded (rc 1 = no matches; rc ≥ 2 → `grep_status: unavailable…`, no emit).
Each hit is classified **code | prose** at the SYMBOL's position: Python files via `tokenize` (exact — the hit is prose
only when every occurrence on the line sits inside a COMMENT/STRING token), other files by line shape. A file is code if
ANY of its hits is code (first code hit kept). Output: `map_claim` (`present` | `absent: <why>`), `callers`,
`callers_detail`, `defs`, `grep_code_files`, `grep_prose_files`, `grep_hits`, `missed_by_map` (code files the callers
arm did not name, def files excluded), `reach` (callers ∪ defs ∪ code files, noise-filtered), `reach_line` (the record
form — `no index` when there is no index; `graft@sha` with a claim, `grep-only@sha` without), `emitted`,
`emit_skipped[]`, `gates`, `notes`, `floors`.
**Emit gates (all must hold, each skip NAMED in `emit_skipped`):** (a) `map_claim == present` — a delta needs a
context-A claim to diverge from · (b) the hit is code-shaped · (c) `map-deltas.py append --once` (the writer skips an
identical un-swept `(gen, subject, file)` edge — no tally inflation on repeats) · (d) `.kdbp/` exists AND
`git check-ignore -q .kdbp/map-deltas.jsonl` succeeds (an un-seeded twin gets `run /gabe-init update`, never an untracked
file) · (e) the root is inside the session's roots (an explicit foreign `root` is read-only). Per-symbol cap 20, the
excess named in `notes`. `emit:false` or `GABE_MAP_NO_EMIT=1` → no writes (the twin dry-run switch). The delta line:
`--type add --gen _a3_graft.calls --cmd mcp --subject "callers(<sym>)" --found <path:line> --pointer <path:line>`, cwd =
the root's git toplevel. `reach-emit.py` uses the SAME core with `--cmd red`.

### 5.5 `entity_shape(domain?, diff?, root?)` — read-only
`entity_shape.py`'s `load_project` + `entity_shape` (fresh, nothing stored) → `shape{orphans, aspects, owned, coverage}` +
`one_line` (an explicit no-finding sentence when clean). `domain` → `{segment, owners{entity: n}, candidate, reason}`.
`diff=<base>` → `git diff <base>` → `diff_new_routes` + `classify_new_routes` (a classifier shape mismatch → `reason`).

### 5.6 `cases_for(target, root?)` — read-only
Same kind detection as `touches`. `cases[]` = rows WITH a cid (`cid, name, state, corpus, tfile`);
`covered_by_test_files[]` = `state:"file"` rows (`tfile, corpus, n`) — never counted as cases. `via` names the index
used. `max_cid_in_map` from `case_home`; `corpus{searched, max_cid_seen, next_cid_floor, note}` from
`git grep -ohIE '(^|[^A-Za-z0-9_])C[0-9]{1,6}(v[0-9]+)?([^A-Za-z0-9]|$)'` over `**/*test*`, `**/*spec*`, `**/tests/**` —
the corpus is the registry; the map may lag. Absence = no census row (a floor).

### 5.7 `owner_of(path | paths[], root?)` — read-only
Per file: `owners[]` from `entities[].files` (a list), `config_glob_owners` via `work_scope.entity_code_globs` +
`matches`, `census` (claimed / unclaimed + reason), a `note` when the map is blind. A directory (`…/` or an existing dir)
→ `mapped_files`, `owners{entity: n}`, `unclaimed_in_census[]`.

### 5.8 Wave 2 — the graft equivalents + map lifecycle (`tools_wave2.py`, ruling 2026-09-02 D10) — all read-only
- **`find(query, kind?, limit?)`** — graft_find_code's equivalent over the MAP: entities · endpoints (`METHOD path`) · models ·
  schemas · functions (`file::qual`) · defines · FE pieces · screens, by name or doc text; ranking exact 100 · qualified-tail 90 ·
  prefix 70 · substring 50 · in-doc 20; `limit` ≤ 40, `total` + `+N more`; every hit carries `entity` + `file`. Floor: a name the
  map lacks is a Grep question.
- **`outline(file)`** — graft_file_api's equivalent: definitions in span order with `signature` from `graft/.graph/wiring.json`
  when the index exists (cached per mtime/size; `signatures: "graft index (<hash>)"`), else from `function_insight` with
  `signatures: "unavailable — <why>"`; each carries `returns`, `async`, `access_ops`, `doc ≤120`; plus `owners`, `models_defined`,
  `models_referenced`, `tests_reaching`, `census`.
- **`center_overview()`** — graft_repo_map's equivalent by ENTITY: per entity rank · status · endpoints · models · schemas ·
  files · coverage `covered/total` · fe_pieces; `arms{graft, web, fe}`; `census_gaps`; `web.unmatched`; `unregistered`
  (archmap slugs missing from adoption.json). ≤ 600 tokens.
- **`blast_radius(files?)`** — files default to the worktree diff vs HEAD + untracked (source extensions, noise-filtered):
  `touched_entities{slug: n}`, `unowned_files`, `functions`, `models_defined`, `fk_neighbor_entities`, `endpoints_reached`
  (`via: handler in changed file | behind.names (floor, cap 12)`), `tests_reaching` (by_file.reach), `fe_pieces`, `reading:
  contained | local | cross-cutting | unmapped` — labelled a FLOOR; run `who_calls` on the changed symbols before trusting it.
- **`map_census(kind?)`** — the S11/S12/S13 blocks in one read: `file` · `model` · `route` (`claimed`, `scanned_dirs`, `unclaimed`
  capped) · `schema` (`unwired`, `ambiguous`, `moved`, `fn_wires`); an absent block is a `reason` naming the archmap version.
- **`map_diff(base, head?)`** — `git show <ref>:docs/site/center/archmap.json` at each ref (head defaults to the worktree);
  same `head` on both → `regenerated:false` + note; else per entity `endpoints/models/schemas/files {added, removed, more}`,
  entities added/removed, `census_delta`, `functions{base, head}`. A ref without a committed map → `reason`.
- **`center_status()`** — runs the project's `scripts/center_status.py <root>` (installed by /gabe-cc-init) and relays its text
  verbatim (≤ 6,000 chars, `truncated` flag); never a regen; names `next_feature.py`/`risk_sweep.py` as not run.
- **`review_drift(base, phase?, subjects?)`** — one call for review Step 3.4's deterministic subjects vs `git diff <base>`:
  `entity_shape` (new routes classified vs the fresh shape) · `web_bridge` (new fetches vs declared endpoint keys) · `reach`
  (the phase's `- **Reach:** … (graft|grep-only@sha)` record from PLAN.md → `unreached` = changed source not in the record,
  `unused_reach`) · `entity` (PLAN.json declared vs touched via owners) · `workflow_census` (`scripts/check_workflow_drift.py`
  per `docs/site/center/workflows/*.json`); every subject is `{ran, …}` or `{ran:false, reason}`, `not_run[]` lists them —
  "no findings" can never mean "could not run". Pricing stays judgment; STALE ANCHOR lives in gabe-kdbp.
- **`who_calls` grew `direction` (`in` callers · `out` callees → `callees[]`) and `depth` (`1` · N · `all`, graft's transitive
  walk); only `direction=in depth=1` may emit (the delta semantics are "a DIRECT caller the index missed"). Every answer now
  carries `map_confidence{active_missed_edges, edges_total, note}` from the S14 tally ledger (fresh tier, nothing stored).
- **`touches` ENDPOINT** adds `web_unmatched_fetches` (the c4 `stats.web.unmatched` rows naming this method+path).

## 6 · Registration · status · doctor

- Register (ask-first, once per machine): `claude mcp add -s user gabe-map -- python3 "$HOME/.claude/skills/gabe-map/scripts/server.py"`.
  `./install.sh --register-mcp` runs exactly that when `~/.claude.json` lacks `mcpServers.gabe-map` (guarded; runs LAST;
  a failure warns and never truncates the install). A **session restart** is required afterwards.
- Status probe (`scripts/mcp-status.py`) READS `~/.claude.json` — `mcpServers.gabe-map` (registered · its command path vs
  the installed `server.py`) and `projects[<abs cwd>].disabledMcpServers` (disabled here) — never `claude mcp get`, which
  launches the server to health-check it. `scripts/checkers/mcp-registration.sh` prints ONE line, exits 0 always; the
  doctor relays it as INFO (there is no WARN level; registration is the operator's consent, never DRIFT).
- `install.sh --uninstall` PRINTS `claude mcp remove -s user gabe-map` and never runs it.

## 7 · Battery (tests/gabe-map/run.sh)

Hermetic: a synthetic center (archmap · c4 · config · adoption) in a temp git repo with commits past the map head, a
fake `graft` on `PATH` returning canned JSON, real `git grep`, read deadlines in `client.py` and `timeout` around every
invocation. Pins: handshake (echo · fallback · pre-init `server/discover` → `-32601` with the string id · `ping` ·
`instructions` non-empty · `roots/list` requested + consumed) · `tools/list` (7 names, object schemas, annotations) ·
unknown method/tool · garbage line survives · `CLAUDE_PROJECT_DIR` law (cwd elsewhere) · no-center + suite-center texts ·
freshness (stale after a mapped edit; fresh after a mapped-file-free commit; unknown head) · every `touches` kind
(two owners · fk_in · r/w fns · ambiguous · endpoint normalization · case) · `entity_context` raw byte-parity with
`entity-context.py --json` · `who_calls` (code hit emitted with `cmd:mcp`; prose-only not emitted; def site never;
repeat → 0 new lines; `matches: []` → 0 emits + `absent`; `GABE_MAP_NO_EMIT=1` → 0; un-ignored accumulator → skipped +
named; no `graft/` → grep arm still answers) · `cases_for` split · `owner_of` two owners + unclaimed. Mutation hooks:
`SERVER_OVERRIDE` · `MQ_OVERRIDE` (mutants are SAME-DIR temp copies so sibling imports resolve).
