# gabe-map — the suite's reliability surface (Path C) — design record

> **Status (2026-09-02): DESIGNED + REVIEWED (partial), NOT BUILT.** Successor of
> [map-delta-loop §13](../map-delta-loop/README.md). The operator's tool-surface ANALYSIS is published
> (artifact "Gabe Suite Tool Surface", source: [tool-surface-analysis.html](tool-surface-analysis.html);
> scored data: [tool-surface-scoring.json](tool-surface-scoring.json)). The design below (v1) went through
> 4 of 7 review lenses — 53 findings, [design-review-findings.json](design-review-findings.json) — and the
> skeptic pass did NOT run (session limit). §2 gained the DEFERRAL rows (2026-09-02) and D7 was amended accordingly. **Next session:** apply the §12 amendments, run the 3 missing
> lenses (battery · axis-1 · write-safety) + skeptics, then build. Nothing under `skills/gabe-map/` exists yet.


Inputs: 2 survey workflows (8 lenses, 224 raw rows) · 4 fact readers (data · emit · conventions · protocol) · 2 harness
probe rounds (empirical, §2) · 1 scoring panel (3 judges, 58 candidates) · 4 review lenses (§12).

## 1 · Why (one paragraph)

Axis 1 of the map↔grep loop (the map is READ first) has no gate-close: two reviews proved a receipt proves the
reader RAN, never that the agent CONSUMED the slice. The lever is discovery: agents skip the map because it is
*data behind scripts* (a CLI must be remembered — the 0-for-19 class); an MCP tool is *advertised to the
harness every session* and reached for because it is the cheapest move. Path C packages the committed map as
tools. Because `who_calls` runs the two-arm reach, every map query also feeds axis 2 (the delta emit) with
nobody remembering to. Measured gaps this closes: gustify LEDGER 0 ENTITY rows vs 42 EXEC · pulse never once
offered S6 · 0 `Reach:` records in the live PLAN · inflight.json 20 commits behind its E8 rail.

## 2 · Empirical harness facts (Claude Code 2.1.257, probed 2026-09-01 — not memory)

| Fact | Evidence | Consequence |
|---|---|---|
| Client `initialize` sends `protocolVersion "2025-11-25"`, caps `roots{listChanged}`, `elicitation` | probe log | echo the client's version when it is in our supported set, else answer `2025-06-18` (in the TS SDK's accepted list) |
| Server env carries `CLAUDE_PROJECT_DIR=<project>` | probe log | root resolution needs no cwd |
| `roots/list` (server→client) → `[project, <add-dirs>…]` | probe log | fallback root source; Roots is DEPRECATED in spec 2026-07-28 → never the only source |
| Server cwd under `--mcp-config` = project; docs: user-scope cwd = `~/.claude` | probe + docs | NEVER trust cwd first |
| `instructions` from `initialize` reach the model's system prompt | model quoted the marker | the axis-1 nudge has a delivery channel |
| Tool result warn 10k tokens · cap 25k (`MAX_MCP_OUTPUT_TOKENS`) | docs | every list capped and the cap NAMED |
| Restart required after `claude mcp add` (stdio) | docs | install prints the restart line |
| `--mcp-config` + `--strict-mcp-config` + `--allowedTools "mcp__gabe-map__.*"` run headless | probe exit 0 | e2e gate without registration |
| user scope = `~/.claude.json → mcpServers.<name>`; `projects[…].disabledMcpServers` can hide it per project | docs + local | `map_status`/`/gabe-map status` must check BOTH |
| `tools/call` params carry `_meta.claudecode/toolUseId` + `progressToken` | probe log | ignore `_meta`, never reject |
| With `structuredContent` present the model sees ONLY it — the text block is dropped (probe 2026-09-02: model quoted `STRUCT-MARKER` only) | probe run | ONE channel: results are `content:[{type:"text"}]` only; the JSON rendering carries every human-facing string (honest-empty text, floors, reach line) |
| `--allowedTools "mcp__probe__.*"`, `"mcp__probe__*"` and bare `mcp__probe` each permitted the call (1 `tools/call` received per form) | probe runs | the e2e uses the documented server-level form `mcp__gabe-map`; assert the call via the server's log, never via exit code |
| Under `MCP_PROTOCOL_NEGOTIATION=auto` (client 2.1.258) the FIRST frame is `server/discover` with a STRING id and `_meta` protocolVersion `2026-07-28`; a `-32601` reply with the id echoed makes the client fall back to `initialize` | probe log | pre-initialize unknown method → `-32601`, id echoed verbatim (string ids preserved), never exit |
| TS SDK accepts `[2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05, 2024-10-07]`; batching only in 2025-03-26 | SDK constants | no batch handling |
| **MCP tool schemas are ALWAYS deferred** (probe 2026-09-02, client 2.1.258): a 7-tool probe server was deferred in a normal gustify session (124 deferred tools · 0 MCP schemas loaded — Gmail 29 · Drive 11 · Calendar 9 · Excalidraw 5 · Mermaid 1 · notebooklm 30 · pixellab 8 · **graft 6 — `graft mcp` is LIVE in gustify**) AND alone under `--strict-mcp-config` (22 deferred · 0 loaded). The `instructions` block was injected in full both times (marker quoted). | two probe runs | deferral is the policy, not a threshold: trimming other servers never makes a tool eager. The discovery surface = tool NAMES + `instructions`; descriptions/schemas load per tool on demand (ToolSearch). → D7 amended below. |

## 3 · Settled decisions

- **D1 transport/scope:** stdio + `--scope user`. One registration; every project reads its OWN committed map.
- **D2 zero dependencies:** Python 3 stdlib only. The suite installs by copy to `~/.claude`; a pip/uv dependency
  breaks a fresh machine. Needed protocol subset ≈ 7 handlers.
- **D3 home:** `skills/gabe-map/` — `SKILL.md` (management command) + `scripts/server.py` (the server — under
  `scripts/` so the suite center's script census sees it) + `scripts/mapquery.py` (the pure query library the
  server AND the battery import; no stdout) + `references/map-spec.md` (binding tool contract) + `tests/gabe-map/`.
  Installed path for registration: `$HOME/.claude/skills/gabe-map/scripts/server.py`.
- **D4 root resolution per call:** explicit `root` arg → `CLAUDE_PROJECT_DIR` → `roots[0]` (requested once after
  `initialized`, matched by a `srv-N` id) → `os.getcwd()`. Center = `docs/site/center/center.config.json` found
  walking up (same walk as `entity-context.py`). Every result names `root` + `center`. Paths in results are
  repo-relative; a `root` outside the roots set is still honoured (the operator may point at a twin) but read-only.
- **D5 honest-empty is an ANSWER, not an error:** no center → `isError:false`, `present:false`, text:
  `no command center under <root> (looked for docs/site/center/center.config.json) — this project has no codebase
  map; Grep/Glob are the source of truth here. Build one: /gabe-cc-init.` Unknown slug → the registered list.
  Unknown symbol in graft → `map_claim: absent (not indexed)`. Every missing archmap block → empty section +
  `reason`. Tool-body failures → `isError:true` with the message (so the model self-corrects); JSON-RPC errors only
  for malformed envelopes / unknown tool (-32602) / unknown method (-32601).
- **D6 read-only, one write:** the server never writes the center, the source, `.gitignore`, or `.kdbp` bookkeeping
  — except the map-delta EMIT from `who_calls` through the one validated writer
  (`map-deltas.py append --type add --gen _a3_graft.calls --cmd mcp --subject "callers(<sym>)" --found <p:l>
  --pointer <p:l>`, `cwd=<root>`), and ONLY when `.kdbp/` exists. Three emit gates (from the emit-contract reader):
  (a) **map claim present** — the callers arm ran (rc 0, parsed) AND returned ≥1 match; otherwise NO emit (a
  delta needs a context-A claim to diverge from; today reach-emit floods the ledger with every grep file, def
  site included, when graft returns nothing — a real defect, fixed in the shared core + a battery case);
  (b) **code-shaped hit** — the grep line matches `<sym>\s*\(` · `\.<sym>\b` · `import … <sym>` / `from … import
  … <sym>` · `<sym>\s*=` / `=\s*<sym>` · `@<sym>` · `<sym>\s*[,)\]]` (callback/argument), and does NOT start with
  `#`/`//`/`*`/`"""`/`'''`; prose-only hits are RETURNED (labelled `prose_only`) but never emitted (on gustify the
  two `apply_recipe_filters` deltas were docstring mentions — graft was right, grep wrong; the design record §10
  claim "2 real test-caller edges" is corrected in this commit);
  (c) **dedupe** — one emit per `(symbol, file)` per server process, and skip when an identical un-swept
  `(gen, subject, file)` line already sits in `.kdbp/map-deltas.jsonl` (`_read_live` never dedupes, so N appends
  → `count += N` — confirmed). `emit:false` or `GABE_MAP_NO_EMIT=1` (the twin dry-run switch) → nothing.
- **D7 the nudge (`instructions`, ≤ ~1,000 chars) — AMENDED 2026-09-02:** because every MCP schema is deferred (§2), the
  `instructions` block and the seven tool NAMES are the ENTIRE always-on discovery surface; a tool description is read only
  after the model loads that one tool. So the instructions block must ROUTE, one line per tool
  (`who calls X / where is X used → mcp__gabe-map__who_calls` · `what touches this file/model/endpoint → touches` ·
  `which entity owns this path → owner_of` · `cases covering X / next C-id → cases_for` · `an entity's slice → entity_context`
  · `who owns URL domain /x → entity_shape` · `is there a map here, how stale → map_status`), state the floor law once, and
  name `map_status` as the first call when unsure. Names stay verbs/nouns that read as the question. The ≤7 rule is a
  discoverability rule (names in the deferred list + one routing block), not a token rule: 7 names ≈ 85 tokens always-on.
  Original text follows —
  **D7 the nudge (`instructions`, ≤ 8 lines):** when the project has a command center, call `touches` / `who_calls`
  / `entity_context` BEFORE grepping for callers, owners, usages or an entity's surface; the map is a FLOOR
  (absence is never proof — `who_calls` already runs the grep arm and says which files are code vs prose);
  every answer stamps freshness; `map_status` first when unsure the project has a map.
- **D8 freshness on every result:** `head` (archmap) · `commits_since` (`git rev-list --count <head>..HEAD`) ·
  `mapped_files_changed_since` (`git diff --name-only <head>..HEAD` ∩ every `entities[].files` path, cap 20). The law:
  **stale = a mapped file changed since `head`, never the count** — `head` is the PARENT of the regen commit, so
  `commits_since ≥ 1` on every healthy twin. Unresolvable head → `freshness: unknown (head not in history)`.
- **D9 ask-first registration:** `install.sh` copies the skill and PRINTS the register line when
  `claude mcp get gabe-map` fails (never runs it — install stays non-interactive/idempotent).
  `./install.sh --register-mcp` runs `claude mcp add -s user gabe-map -- python3 "$HOME/.claude/skills/gabe-map/scripts/server.py"`
  (idempotent; shell expands `$HOME`). `--uninstall` prints `claude mcp remove -s user gabe-map` (never runs it).
  The doctor has NO warn level (DRIFT · SKIP · INFO only) → the registration state is an INFO line, never DRIFT.
- **D10 — AMENDED by operator ruling 2026-09-02: graft serves map CREATION only.** `graft build` stays as the structural
  arm the generators consume (center regen, the red beat's index refresh); everything agent-facing graft ships — `graft mcp`
  (6 tools), `graft init`'s SessionStart/UserPromptSubmit hooks, statusline, tokens-saved footer — RETIRES from the twins
  (gustify carries `graft mcp` live + graft hooks, both untracked → propagation step owed; gabe-map never depends on them).
  The skills use the suite's tools, which sit on top of graft's index and add entities · ownership · cases · coverage ·
  drift · deltas. Every graft tool gets a suite equivalent or better: `graft_check_freshness` → `map_status` (v1) ·
  `graft_trace_calls` → `who_calls` (v1 callers; `direction:out` + `depth` = callees/blast in wave 2) · `graft_find_code` →
  `find` (search over the map's names + docs, hits carry owner/file:line/cases; wave 2) · `graft_file_api` → `outline(file)`
  (signatures from graft's wiring.json when present + owner + models + tests; wave 2) · `graft_repo_map` → `center_overview`
  (entity-level orientation ≤ 600 tok; wave 2) · `graft_find_all` → `who_calls` grep arm + built-in Grep (symbol-grouped grep
  later) · graft's injection/statusline → the D7 `instructions` block. This settles §11 Q1: red-spec L191-193 STANDS;
  graft-adoption README's "Enforcement (solved by installation)" section is SUPERSEDED. The judges' `never` on `find_code`/
  `find_all` and `later` on `file_api`/`center_overview` rested on graft covering them — re-verdicted `next`/`later` on the
  artifact as a visible ruling chip beside the judges' scores (their scores untouched).
- **D10 (original) no third-party directives:** never `graft mcp` / `graft init` / `graft ask` / `--deep` / a refresh from the
  server. The server shells ONLY to `graft callers <sym> . --json --no-refresh` and drops the `saved` object (the
  `--json` output carries no directive — verified: 0 occurrences of "token"). Ruling seam (open question for the
  operator, §11): red-spec L191-193 (2026-08-05, "never graft init/mcp") vs graft-adoption README (2026-08-16,
  "graft init STAYS"); gabe-map needs neither, violates neither.
- **D11 caps are named:** every list capped (default 40) → `+N more (cap 40)`. `det` is never echoed whole;
  fields are projected. `entity_context` defaults to `detail:"brief"` (the full pack is 146 KB ≈ 35k tokens on gustify).
- **D12 the grep arm is `git grep`:** `git grep -nwI -- <sym> -- '*.py' '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs'` scoped to
  source globs, then reach-emit's `_noise` filter (reused, not re-authored). Tracked files only (immune to graft's
  `.ignore` re-admit and untracked build output), no index needed, 4× faster than `graft grep`, and it keeps
  `who_calls` useful when graft is absent (graft arm → `map_claim: absent (no index)`, grep arm still answers).
  Never an unscoped `-n` (6.3 MB of single-line center JSON). Symbol validated `^[A-Za-z_][A-Za-z0-9_]*$`.
- **D13 lazy load + cache:** nothing heavy before `initialize` answers (startup timeout is client-enforced). Center
  files load on first call, keyed `(path, mtime, size)`; inverse indexes built once per load (bare-fn→keys ·
  class→(slug,kind,file) · table→model · model→fns-with-access · c4 node-id→(slug,node) · edge target→sources ·
  web-stem→node). A mid-session regen re-loads on the next call.
- **D14 no mutation tools:** the D7 hooks (plan-proof-guard etc.) watch harness Write/Edit/Bash — an MCP tool
  writing `.kdbp` bypasses them (the HOOK-VISIBILITY COLLISION). v1 has zero `.kdbp`/center/source writers; the
  gitignored delta emit is the one write and no hook guards it today either.

## 4 · Tool roster v1 — the scoring panel's seven unanimous `now` verdicts

**v1 = `map_status` · `entity_context` · `touches` · `who_calls` · `entity_shape` · `cases_for` · `owner_of`** (3 judges,
every one `now/now/now`; medians importance 5·5·5·5·3·4·4, cost ≤3, risk ≤3). `endpoint_for` scored `next` (folded
later as a method+path mode of `touches`, reusing `fetch_bridge.norm_path`); 14 `next` · 17 `later` · 20 `never` form
the ranked backlog in the published analysis (§10). `entity_shape` is the seat to yield if the operator wants six.
**Wave 2 = the graft equivalents (ruling 2026-09-02, D10):** `find` · `outline` · `center_overview` · `who_calls direction/depth`
(+ `endpoint_for` as a `touches` mode). They ship AFTER v1 is measured, in a second server or as a v1.1 growth — the ≤7
discoverability rule decides which (D7: the routing block must still fit).
Contracts (4.1–4.8; 4.6 `endpoint_for` is documented but NOT in v1):

### 4.1 `map_status(root?)` — freshness + presence, the "is there a map here" answer
Returns `{present, root, center, head, generated, commits_since, mapped_files_changed_since[≤20], stale:bool,
entities[slugs], counts{endpoints, models, schemas, files, functions}, graft{index_present, wiring_mtime,
committed_index_hash, live_index_hash, match}, kdbp_present, inflight{head, commits_behind}|null,
regen_cmd:"scripts/refresh_center.sh regen"}`. Never calls `graft check` (18.7 s); hashes `wiring.json` (≈30 ms).
Fills a gap no script covers today (nothing compares `archmap.head` to HEAD; pulse S9–S13 inherit the map's
freshness silently).

### 4.2 `entity_context(slug?, root?, detail?)` — one entity's slice; omit `slug` → the registered list
Imports `entity-context.py` (hyphenated → `importlib.util.spec_from_file_location`; `fail` monkeypatched to raise
`MapStop`, so no `sys.exit`/stdout from the reused module) and calls `build_pack`. Adds from c4: `l1.edges`
touching the slug (`{target, weight, kinds{calls, fk, imports}}`, calls/imports are graft FLOORS, fk exact),
`l2[slug]` node counts by kind, `fe.homes` row; from archmap: `coverage[slug]` (tolerate absence — gustify has 7/8).
`detail:"brief"` (default) = counts + names, no cols/docs; `"full"` = the pack with cols ≤10/model, docs ≤160 chars,
files ≤40/layer. Byte-parity proof: `full` minus the additions equals `entity-context.py --json`.

### 4.3 `touches(target, root?, detail?)` — what code · endpoints · models · schemas · tests · entities touch X
Kind detection in order: `^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/` → ENDPOINT (method REQUIRED — `/me` ×2;
normalize both sides: strip `/api/vN`, `{x}`/`${x}`→`{}`, rstrip `/`) · contains `::`/`#` → qualified FUNCTION ·
contains `/` or ends `.py|.ts|.tsx|.js|.jsx` → FILE (test file → `exercises`/`case_own` view) · `^C\d+$` → CASE ·
exact `entities` slug → ENTITY (→ `entity_context` brief) · PascalCase ∈ `model_insight` → MODEL/SCHEMA (by `kind`)
· else bare FUNCTION → ALL matching keys (20 names map to 2–3 keys on gustify; never pick one silently → `ambiguous[]`).
Join keys: generate BOTH `file::qual` and `file#qual`; c4 ids by prefix (`model:` · `schema:` · `endpoint:<M> <p>` ·
`web:<stem>` · `fe:<path>#<Name>`); `external:<slug>` is per-L2, never indexed as unique; fk `cross_edges` rows have
NO `kind` (→ `fk`); `fe.edges` are index triples.
Per kind: FILE → owners (a LIST — 8 gustify files have 2), layer, defines (strip `()`), functions, models
defined/referenced (`internal_refs`), tests reaching (`by_file.reach`), guard share, fe pieces, web bridges;
MODEL/SCHEMA → owner/table/cols count, `fk_in` (computed by scanning every model's `fks` table prefix), functions
r/w it (`function_insight.access.ops` inverse), referencing files+defs, endpoints via c4 l2 edges grouped by
whatever `kind` is present (touches/reads_from/writes_to/consumes/nests=composition), tests `by_model`;
FUNCTION → entity/layer/handler/access ops, tests `by_function` direct/via_route, endpoints reaching it via
`behind.names` **labelled FLOOR (cap 12, `names_more`)**, handler-of endpoint; ENDPOINT → slug + `file::fn`,
`behind{fns,depth}`, `access` (union over the call tree), out-edges, `bridge` in-edges (screens), cases (rows
`state=='file'` filtered to `covered_by_test_files`), `touches_x` NEVER surfaced; CASE → `case_home` file + cases.
Every list capped 40 + named.

### 4.4 `who_calls(symbol, root?, emit?)` — the two-arm reach with the emit riding
Arm A graft (`callers … --json --no-refresh`, only when `<root>/graft/` exists): `callers[{path, symbol, span}]`,
`defs[]`; absent → `map_claim:"absent", reason`. Arm B `git grep` (D12): per file `{path, line, text, shape:
code|prose}`. Returns `{symbol, map_claim, callers, defs, grep{code_files, prose_only_files}, missed_by_map[]
(code-shaped grep-only files = the deltas), deltas_emitted:n, reach_line:"- **Reach:** a · b (graft@sha)",
floors:["graft indexes .py/.ts/.tsx/.js/.jsx only", "an empty reach is never an absence proof — use grep -rn"]}`.
Emit per D6. `reach_line` lets red paste the record; `reach-emit.py` stays the CLI/record form and is refactored
onto the same core (`mapquery.two_arm`) so there is ONE emitter (the double-emit fix the reader recommended).

### 4.5 `entity_shape(root?, diff?)` — URL-domain ↔ entity model
Imports `entity_shape.py` (`load_project`, `entity_shape`, `one_line`, `diff_new_routes`, `classify_new_routes`).
Returns the shape (orphan domains → candidate entities · aspects · owned map) + the pulse line; `diff:"<base>"`
classifies diff-added routes (the review subject, now callable when the route is DESIGNED, review stays the backstop).

### 4.6 `endpoint_for(method, path, root?)` — does this fetch resolve to a declared endpoint?
Imports `fetch_bridge.py` (`load_endpoint_keys`, `norm_path`, `load_unmatched`). Returns `{matched:[endpoint
ids], normalized, already_unmatched_at_emit:bool, nearest_by_path[≤5]}`. Authoring-time lookup; review's
WEB-BRIDGE DRIFT stays the backstop. (May fold into `touches` ENDPOINT if the panel trims.)

### 4.7 `cases_for(target, root?)` — the case estate around X
`test_insight.by_function/by_model/by_endpoint/by_file/case_home` → cases `{cid, name, state, corpus}` + test files
+ `max_cid_in_map`; `next_cid_floor` = max over a `git grep -ohE` of the anchored C-id token across test roots
(the corpus is the registry; the map may lag) — labelled floor.

### 4.8 `owner_of(path_or_dir, root?)` — which entity claims these files
`entities[].files` + `center.config.json` code globs (reuse `work_scope.entity_code_globs`) + `file_census`
claimed/unclaimed. A FILE `touches` already answers ownership → the panel may fold this in.

## 5 · Protocol implementation (server.py, ~250 lines)

- Framing: newline-delimited JSON-RPC 2.0 on stdout, one message per line, `flush()` per message, `\r` stripped,
  blank lines tolerated; stdout is otherwise NEVER written (fd 1 stays the wire; every reused module's prints go
  to stderr via `contextlib.redirect_stdout(sys.stderr)` inside tool bodies). stderr = log.
- Routing by SHAPE: `method`+`id` → request · `method` no `id` → notification (never answered) · `id` no
  `method` → a response to OUR request (roots). Unknown request → `-32601`; malformed envelope → `-32600`;
  unparseable line → log + continue (no `id:null` frames). Every handler wrapped; unexpected exception → `-32603`
  (envelope) or `isError:true` (tool body). EOF → exit 0.
- `initialize` → `{protocolVersion, capabilities:{tools:{}}, serverInfo:{name:"gabe-map", version}, instructions}`;
  no `logging`/`listChanged` declared. `ping` → `{}`. Pre-initialize requests other than ping → `-32602`.
- `notifications/initialized` → if the client declared `roots`, send `{"id":"srv-1","method":"roots/list"}`.
- `tools/list` → the roster; each `inputSchema.type == "object"`, property names `[A-Za-z0-9_.-]{1,64}`;
  `annotations{readOnlyHint, destructiveHint:false, idempotentHint:true, openWorldHint:false}` (`who_calls`
  `readOnlyHint:false` because of the emit). `resources/list`/`prompts/list` → `-32601` (not declared → correct).
- `tools/call` → `{content:[{type:"text", text}], isError}` — text ONLY (no `structuredContent`: the harness drops the text
  block when it is present, §2). `text` = one header line (`gabe-map · <tool> · map@<head> · <freshness>`) + the JSON result
  rendered with `indent=1`; every human-facing string (honest-empty, floors, caps, reach line) lives INSIDE that JSON.

## 6 · Skill surface + spec pointers

- `skills/gabe-map/SKILL.md` (`disable-model-invocation: true`; version 1.0.0): `/gabe-map status` (registered
  at user scope? disabled in this project? server path parity? this project's map present + freshness) ·
  `/gabe-map register` (confirms, then runs the D9 command) · `/gabe-map probe [root]` (runs the battery client
  once: handshake + `tools/list` + `map_status`). Procedure step 2 = read `references/map-spec.md` (E6).
- red-spec: the two-arm reach may be produced by `who_calls` (same core, same emit); `reach-emit.py` remains the
  record form. Fix the §10 "2 real test-caller edges" claim (they were docstring mentions). gabe-red 1.9.3 → 1.9.4.
- execute-spec E4 / review REACH: name `mcp__gabe-map__touches`/`who_calls` as the first-look path (one line each).
- gabe-cc-entity SKILL.md: note the same pack is exposed as `entity_context`. gabe-help tool-registry: 1 row.

## 7 · Install · doctor · docs (28 → 29 skills)

install.sh: skill copy (already recursive) + register hint + `--register-mcp` + uninstall hint. Doctor: an INFO
line `gabe-map: registered at user scope | NOT registered (./install.sh --register-mcp)`. Parity edits: CLAUDE.md
row `| **gabe-map** | 1.0.0 | … |` + `(29 skills)`, README row + `(29 skills)`, `docs/center/suite-center.config.json`
skills list, `skills/gabe-help/references/help-spec.md` (generated), `tool-registry.md` row, `docs/src/skill-map.md`
count (+ docsite rebuild in the same commit or the staleness invariant fails), design record
`docs/design/gabe-map/README.md`, map-delta-loop §14 pointer. Portability: no literal home path anywhere under
`skills/` (use `$HOME`).

## 8 · Batteries

`tests/gabe-map/run.sh` (hermetic, `SERVER_OVERRIDE` + `MQ_OVERRIDE` hooks for mutation proof):
- **client** `tests/gabe-map/client.py`: spawns the server over pipes; handshake asserts (echo `2025-11-25`; garbage
  version → `2025-06-18`; `serverInfo.name`; `instructions` non-empty; a pre-init `tools/list` → `-32602`; `ping` → `{}`);
  answers `roots/list` with a fixture root; `tools/list` (roster names, `type:"object"`, annotations); unknown method
  → `-32601`; unknown tool → `-32602`; garbage line → server survives; EOF → exit 0.
- **fixture center** (synthetic `archmap.json` · `c4-graph.json` · `center.config.json` · `adoption.json` in a temp git
  repo with 2 commits past the map `head`, one touching a mapped file): `map_status` (present · `commits_since 2` ·
  `mapped_files_changed_since 1` · `stale true`); `entity_context` full ≡ `entity-context.py --json` byte-for-byte after
  removing the additions; `touches` for FILE (two owners) · MODEL (fk_in computed · r/w fns) · qualified FUNCTION
  (floor label present) · bare ambiguous name → `ambiguous[2]` · ENDPOINT normalized (`GET /api/v1/x/${id}` → raw id)
  · CASE; `entity_shape`; `endpoint_for` matched + unmatched; `cases_for`.
- **who_calls** with a FAKE `graft` on `PATH` (canned JSON) + real `git grep` on the fixture: union; code-shaped
  grep-only file → 1 delta appended via `map-deltas.py` into `.kdbp/map-deltas.jsonl` with `"cmd":"mcp"`; prose-only
  file (docstring mention) returned but NOT emitted; def site never emitted; second identical call → 0 new lines;
  fake graft returning `matches: []` → `map_claim absent`, 0 emits; `GABE_MAP_NO_EMIT=1` → 0; no `.kdbp/` → 0, no
  error; no `graft/` dir → grep arm still answers.
- **root law**: `CLAUDE_PROJECT_DIR=<fixture>` with cwd elsewhere resolves the fixture; a no-center root → the named
  honest-empty text, `isError:false`.
- **reach-emit** battery: +1 case (empty callers arm → 0 emits).
- Mutation proof (commit message, suite convention): mutants `noise-filter-off` · `emit-gate-off` (empty arm floods)
  · `prose-emitted` · `dedupe-off` · `honest-empty-text-removed` — each must fail ≥1 assert.
- Real-twin dry-run (gustify READ-ONLY, `GABE_MAP_NO_EMIT=1`): `map_status`, `touches PantryItem`, `who_calls
  apply_recipe_filters` (expect 3 callers · 2 prose-only · 0 missed), `entity_context pantry brief` — numbers in the commit.
- Harness e2e (opt-in, API-billed): `GABE_MAP_E2E=1 bash tests/gabe-map/run.sh` → `claude -p … --mcp-config …
  --strict-mcp-config --allowedTools "mcp__gabe-map__.*"` from the fixture root; asserts the model called `map_status`.

## 9 · Risks

⚠ Advertised but still not reached for (habit greps first).
- If ignored: axis 1 stays soft; context A never forms. · Cost now: D7 nudge + a stderr `tools/call` counter per
  session. · Cost later: a PreToolUse hook on Grep in center projects that says "gabe-map has an answer" (graphify's
  intercept pattern; a rail, report-never-gate) — a designed follow-up. · Distance: the first 3 twin sessions after
  registration. · Verdict: act now on D7 + measure; defer the Grep hook until 3 sessions show < 1 call/session.
⚠ Stale map answers confidently. · Verdict: D8 on every result; `map_status` names the regen command.
⚠ Result bloat (`det` 319 KB). · Verdict: D11 projection + caps; `entity_context` brief by default.
⚠ False deltas poison S14 (prose hits; empty arm). · Verdict: D6 gates (a)+(b) — the first two emit gates the loop
  ever had; 3 prose files would otherwise trip the breadth threshold.
⚠ Twins lack the `.gitignore` seed for `.kdbp/map-deltas*.jsonl` (gustify). · Verdict: the server never edits
  `.gitignore`; propagation of the gabe-init seed is owed before `who_calls` emits in a twin (handoff item).
⚠ Roster dilution. · Verdict: ≤ 7 tools; the rest is a ranked backlog (§10).

## 10 · The reliability-surface analysis (operator ask) — PUBLISHED

Artifact "Gabe Suite Tool Surface" (source [tool-surface-analysis.html](tool-surface-analysis.html), data
[tool-surface-scoring.json](tool-surface-scoring.json)): 58 candidates · 7 now · 14 next · 17 later · 20 never; five waves with
observable triggers; the trade-off matrix per family (today vs as-tool: gained · lost · guard); six enforcement channels
(server `instructions` ADOPT · prompt-injection DEFER · grep-intercept NEVER · session-start DEFER · tokens-saved-footer
NEVER · tool-registry-as-resource ADOPT-if-supported); the judges' 17 splits and how they were resolved; 11 rulings owed.
Headline: v1 closes the axis-1 discovery gap, NOT the remembered-process leak — that leak (gustify 34 raw commits vs 1 gate
run; inflight.json 20 commits behind) is closed only by two hooks beside the server (a fail-closed commit hook, a
PostToolUse inflight refresh) = **wave 0**, its own designed pass.

## 11 · Open questions for the operator
1. ~~Ruling seam: red-spec vs graft-adoption on `graft init`~~ — **RULED 2026-09-02 (D10):** graft = map creation only; agent surface retires; equivalents owed.
2. Mutation tools (`plan_tick`, PENDING rows) are blocked by the hook-visibility collision — rule: never, or design
   a hook-visible write path first.
3. Registration cadence: `--register-mcp` once per machine; twins' `disabledMcpServers` must not list gabe-map.

## 12 · Design review — 4 of 7 lenses (UNVERIFIED by skeptics; apply or refute before building)

Every finding below was produced by one reviewer reading the design + the repo; the skeptic pass that would confirm or
refute each one did not run. Three of them were settled EMPIRICALLY afterwards (§2 rows 31–33): text-vs-structuredContent
(CONFIRMED → one channel), `--allowedTools` glob (REFUTED — all three forms permitted the call), `server/discover` first
frame (CONFIRMED). The rest are the build's amendment list, highest severity first.


### 12.1 · conventions — land-with-fixes · 13 findings

- **[high] `mcp-get-health-checks`** (§3 D9 / §2 harness table / §7) — D9's registration probe `claude mcp get gabe-map` is not a read — the CLI health-checks approved servers by launching them, so once gabe-map is registered every `./install.sh` (and every doctor run, per §7's INFO line) spawns `python3 ~/.claude/skills/gabe-map/scripts/server.py`, and a broken-but-re
  → fix: Drop `claude mcp get` as the probe. Read `~/.claude.json` with python3 stdlib: `mcpServers["gabe-map"]` for presence, `projects[<abs cwd>].disabledMcpServers` for per-project suppression (that key is real and populated — `/home/khujta/projects/gabe_lens` carries `["magic","pencil"]`). A pure JSON re
- **[high] `doctor-info-line-untestable`** (§3 D9 / §7) — The registration INFO line is specified as an inline suite-doctor.sh edit, which the repo's own precedent forbids: an inline check can only ever run against this machine, so it can never be proven to FIRE or stay SILENT — and §7's parity list does not even name scripts/suite-doctor.sh as a file the 
  → fix: Extract to `scripts/checkers/mcp-registration.sh [--config <claude.json>] [--project <dir>]` printing one line and exiting 0 always; suite-doctor.sh calls it the way it calls docsite-staleness.sh but routes output to `echo "  INFO …"` instead of `report`. Ship `tests/mcp-registration/run.sh` with fo
- **[high] `installed-vs-running-server`** (§3 D9 / §6 /gabe-map status) — The doctor's parity model (repo file hash == install file hash) cannot see the one thing that matters for an MCP server: the LIVE process is the copy loaded at session start, so after `./install.sh` overwrites server.py the doctor reports CLEAN while the tool surface in the running session is the pr
  → fix: Put a content identity on the wire: `serverInfo.version` plus a `server_sha` (md5 over server.py+mapquery.py, computed at startup) echoed in every `map_status` result. `/gabe-map status` compares the live tool's reported `server_sha` against the on-disk `~/.claude/skills/gabe-map/scripts/*.py` and s
- **[high] `battery-hang-no-timeout`** (§8) — tests/gabe-map/run.sh is the first battery to drive a long-lived bidirectional subprocess, and suite-doctor runs every battery with NO timeout — a blocked client read hangs the doctor forever instead of failing it.
  → fix: In client.py give every read a deadline (non-blocking `select` on the pipe, hard fail after ~5 s per message); in run.sh wrap each client invocation in `timeout 30` and add `trap 'kill $SRV_PID 2>/dev/null' EXIT`. Separately: when `GABE_MAP_E2E` is unset, print a line containing `SKIPPED-COVERAGE` s
- **[medium] `skill-map-and-count-strings-missed`** (§7) — §7 names only `docs/src/skill-map.md count` (singular) and misses three further count/classification edits in that page plus two 28-skill strings in files it never lists — and it puts gabe-map in the wrong row of the page's taxonomy by omission.
  → fix: Enumerate all five edits in §7. Then rebuild the docsite in the same commit: touching docs/src/skill-map.md makes it newer than docs/site/center/skill-map.html and `scripts/checkers/docsite-staleness.sh:44` fires → suite-doctor.sh:188-190 reports DRIFT. Currently clean (`docsite: 14 source(s) checke
- **[medium] `gabe-red-version-parity`** (§6 / §7) — §6 bumps gabe-red 1.9.3 → 1.9.4 but §7's parity edit list omits the matching CLAUDE.md row bump — the doctor's version-parity invariant fails on exactly that pair.
  → fix: Add `CLAUDE.md:99 gabe-red row 1.9.3 → 1.9.4` to §7's parity list, and state the general rule there: any §6 spec edit that bumps a skill version is a TWO-file edit. Also pin the frontmatter shape the regex demands — `metadata:` then `  version: 1.0.0` with exactly two leading spaces and nothing afte
- **[medium] `register-mcp-flag-and-set-e`** (§3 D9 / §7) — `--register-mcp` is currently swallowed silently by install.sh's arg loop (no default case), and the `claude mcp add` idempotency D9 asserts is unverified — combined with `set -e` and `run(){ eval "$@" }` a non-zero add aborts the install mid-way.
  → fix: Add the case; run the registration as the LAST step of the install, guarded (`if ! <json read says registered>; then claude mcp add … || echo '  WARN: registration failed (continuing)'; fi`) so it can never truncate the install; make `--register-mcp` respect `--dry-run`. Do not claim idempotence — p
- **[medium] `twin-dry-run-not-a-copy`** (§8 / §9) — The real-twin dry-run runs against the LIVE gustify tree with a single env var as the write guard, contradicting the suite's stated convention that a script touching real project data dry-runs against a COPY.
  → fix: Copy the twin's read surface into the scratchpad (`cp -a <gustify>/docs/site/center <scratch>/docs/site/center` plus a throwaway `git init` for the freshness arm, or `git worktree add --detach`) and run the dry-run there — the existing read-only-twin precedent is `GABE_REPO_ROOT=<twin> GABE_CENTER_O
- **[medium] `emit-root-vs-writer-root`** (§3 D4 / D6) — D6's emit gate ("`.kdbp/` exists under `<root>`") and the reused writer's own gate (`.kdbp` under `git rev-parse --show-toplevel` of the process cwd) are different root laws; D4 explicitly allows `<root>` to be any directory the operator names.
  → fix: State one root law: the emit root is `git -C <root> rev-parse --show-toplevel`, and D6 gates on `.kdbp/` under THAT path — identical to what the writer will do. Add a battery case with a fixture root that is a subdirectory of the git repo, asserting the delta lands in the toplevel `.kdbp/` exactly o
- **[medium] `suite-center-roster-is-a-gate`** (§7) — §7 lists `docs/center/suite-center.config.json skills list` as ordinary parity, but it is a hard doctor gate with a constraint the design never states: gabe-map must appear in EXACTLY ONE `beats[].skills` array, and which one is a real decision because an omission is silently relabelled rather than 
  → fix: In §7 mark the config edit as GATED and name the group. `suite-maintenance` (currently `["gabe-init"]`) is the honest home — gabe-map is machine the suite installs and registers, not a lifecycle beat and not an on-demand analysis satellite. Note that the roster gate runs on this repo through the doc
- **[low] `mapquery-size-unbudgeted`** (§3 D3 / §5) — The design prices only `server.py ~250 lines` and never prices `mapquery.py`, which must carry seven tool bodies, §4.3's six-way kind detection and c4/archmap join key-space, and D13's seven inverse indexes — comfortably over the suite's 800-line CODE budget, with no split seam declared.
  → fix: Declare the split up front in D3: `mapquery.py` = root/center resolution + loaders + D13 indexes + `two_arm`; a sibling `tools.py` = the seven tool bodies. Both still under `scripts/` so the script census sees them (`_suite_data.py:150-151` counts any file whose parent dir is `scripts`/`tools`/`gene
- **[low] `enforcement-ledger-pin`** (§7) — §7 lists no enforcement-ledger work, yet gabe-map ships several new enforcement claims (the three D6 emit gates, D5 honest-empty text, the report-never-gate INFO) — and the ledger's row count is hard-pinned by a battery the doctor runs.
  → fix: Decide explicitly in §7: either (a) no ledger rows for v1 and say so, or (b) add the rows AND bump the tests/suite-center/run.sh:300 pin in the same commit, plus regenerate the center. Note the same commit must rebuild docs/site/center for the pin to match.
- **[low] `frozen-exemplar-28-skills`** (§7) — `templates/center/shell/example/docpage-skill-map.html` is a shipped, installed, doctor-compared exemplar that names all 28 skills and will silently claim 28 forever; §7 does not mention it.
  → fix: One line in §7: decide and record whether the exemplar is regenerated with the change or annotated in-page as a dated snapshot. The second is cheaper and matches how `example/feature-transaction.html` is already described in templates/center/shell/README.md:17 ("a SNAPSHOT of the gastify trial's rea

### 12.2 · honesty — land-with-fixes · 17 findings

- **[high] `d6b-docstring-code-shape`** (D6(b) · §8 twin dry-run) — The code-shaped regex passes docstring lines, so prose still emits deltas and the design's own dry-run expectation (3 callers · 2 prose-only · 0 missed) is wrong.
  → fix: Tighten (b) to `<sym>(` with no whitespace + import/from-import/`.sym`/`@sym`/assignment shapes (drop the `\s*[,)\]]` and space-tolerant paren shapes), AND classify by docstring state: the server has the file + line, so scan the tracked file once counting unbalanced `"""`/`'''` up to the hit line an
- **[high] `d8-worktree-blind`** (D8 · 4.1) — Freshness compares committed states only (`<head>..HEAD`), so uncommitted edits — the window in which an agent actually queries the map — never flip `stale`.
  → fix: Compute `git diff --name-only <base>` (no `..HEAD`, so index+worktree vs base) ∪ untracked files from `git status --porcelain` filtered to source extensions, ∩ the mapped set; report `mapped_files_changed_since` split into `committed` and `uncommitted`. Battery: fixture with an uncommitted edit to a
- **[high] `touches-model-misses-cross-edges`** (4.3 MODEL/SCHEMA · D13) — The MODEL branch reads 'endpoints via c4 l2 edges', but endpoint→model edges that cross entities are emitted only into top-level `cross_edges`; intra-slug `l2[slug].edges` miss them.
  → fix: Build the D13 `edge target→sources` inverse over l2 edges ∪ cross_edges (`from`/`to`, kind default `fk`, keep `from_slug`), and render cross-entity sources with their slug. Fixture: a model referenced by an endpoint in another entity → appears in `touches` with `cross:true`.
- **[medium] `full-parity-vs-caps`** (4.2 · §8 fixture battery) — §4.2 caps `full` (cols ≤10/model, docs ≤160, files ≤40/layer) while §8 asserts `full` minus the additions ≡ `entity-context.py --json` byte-for-byte — both cannot hold on any real entity.
  → fix: Split the contract: `detail:"raw"` = the uncapped pack (parity-tested, touches_x stripped and named as stripped) for tooling; `detail:"full"` = capped projection with `+N more (cap)` per list; `brief` default. Make the byte-parity assert target `raw`.
- **[medium] `cases-for-file-state-rows`** (4.7 · 4.3 ENDPOINT/CASE) — `test_insight` web/e2e rows carry `state:"file"`, `cid:""`, `name:"6 case(s)"`, `n:6`; `cases_for` emits them as cases, and the corpus-vs-map lag is larger than the max-cid floor shows.
  → fix: Separate `cases[]` (rows with a cid) from `test_files[{tfile, corpus, n}]` (state=file rows), never cap the cid list (cap names only), label by_* absence as 'no census row (map floor)', and report `corpus_cids_not_in_map` beside `next_cid_floor`.
- **[medium] `d8-base-is-regen-parent`** (D8) — Using `archmap.head` as the diff base flags the regen commit's own bundled source changes as staleness.
  → fix: Base = the last commit touching `<center>/archmap.json` when it descends from `head` (else `head`); if archmap.json is dirty in the worktree, report `freshness:"uncommitted regen"`. Add a fixture: regen commit that also edits a mapped file → `stale:false`.
- **[medium] `d8-mapped-set-too-narrow`** (D8 · 4.1) — The staleness set is `entities[].files` only, but the c4 `fe` and `web` arms index files outside it.
  → fix: Mapped set = entities[].files ∪ fe.pieces[].file ∪ file_census scanned files; report which arm each changed file belongs to (`arm:"fe"`).
- **[medium] `stale-tristate`** (D8 · 4.1) — `stale:bool` cannot express 'head not in history', so an unresolvable head reads as fresh.
  → fix: `stale: true|false|null` with `freshness: "fresh"|"stale"|"unknown"` and `reason`; battery case with a fixture head not in history asserts `stale:null`.
- **[medium] `touches-no-class-branch`** (4.3 kind detection · D13) — D13 builds a `class→(slug,kind,file)` index that no `touches` branch consults, so PascalCase non-model classes fall through to bare-FUNCTION and answer empty.
  → fix: Insert a DEFINE branch after MODEL: exact match on the class→(slug,kind,file) index → owner(s), file, methods (function_insight keys with prefix `file::Class.`), tests via by_file.reach; fall to bare-FUNCTION only after.
- **[medium] `behind-inverse-capped-and-bare`** (4.3 FUNCTION) — 'Endpoints reaching this function' is an inverse over `behind.names`, which is capped at 12 bare names — the floor label alone does not quantify what could not be checked, and bare names join ambiguously.
  → fix: Return `endpoints_reaching: {found:[…], unverifiable: N endpoints with names_more (list ids), join:"bare-name"}`; for ambiguous bare names mark each attributed key `via:"bare-name (3 candidates)"`. Consider reading `graft/.graph/wiring.json` when present for an exact inverse (one BFS, noise-filtered
- **[low] `arm-a-noise-unfiltered`** (4.4 · D12) — Only the grep arm is stated as `_noise`-filtered; graft's callers/defs carry build-output nodes too.
  → fix: Apply `_noise` to arm A's paths as well (state it in 4.4) and battery it with a fake-graft fixture containing a `.min.js` def.
- **[low] `cid-grep-binary-lines`** (4.7) — `git grep -ohE` without `-I` emits 'Binary file … matches' lines, which the C-id parser turns into a crash or a bogus max.
  → fix: `git grep -ohIE` scoped to the corpora's test roots from center.config.json (`paths.e2e_spec_glob`, corpus dirs), parse `^C\d+$` tokens only.
- **[low] `loaders-hardcode-root`** (4.5 · 4.6 · D4) — `entity_shape.load_project(root)` and `fetch_bridge._center(root)` hardcode `root/docs/site/center`; passing D4's raw `root` when the center was found by walking UP yields a false 'no archmap'.
  → fix: Derive `project_root = center.parent.parent.parent` once in the center loader and pass THAT to every reused loader; assert in the battery with a subdir cwd.
- **[low] `fe-homes-join-key`** (4.2) — The `fe.homes` row for a slug is keyed `fe·<slug>` (middle dot), not the slug; two entities have no fe home.
  → fix: Join on `f"fe·{slug}"`, emit `fe_home: null, reason:"no fe·<slug> home in GABE_C4.fe"` when absent.
- **[low] `map-status-count-scopes`** (4.1) — `counts{files, functions}` mixes scopes: `functions` is Python-only and `files` is entity-claimed, neither is 'the codebase'.
  → fix: Name the scopes: `files_mapped`, `backend_files_census{claimed,unclaimed}`, `functions_py`, `fe_pieces`; owner_of derives 'claimed' from entities[].files + config globs, using file_census only for `unclaimed`.
- **[low] `honest-empty-suite-repo`** (D5) — The honest-empty text pushes `/gabe-cc-init` in the suite repo itself, which the R8 ruling forbids.
  → fix: When `docs/center/suite-center.config.json` exists and no codebase map does, answer `present:false, reason:"suite center (beat spine) — no codebase map by ruling R8"` without the cc-init pointer.
- **[low] `graft-match-semantics`** (4.1) — `graft.match` will read false on most days and the design does not say what that means or where the index lives.
  → fix: Name the path, and render `match:false` as `graft_index: "refreshed since regen (topology may be newer than the map's calls/imports edges — not source staleness)"`.

### 12.3 · emit-reuse — land-with-fixes · 12 findings

- **[high] `d6b-shape-regex-wrong-both-ways`** (D6(b) / 4.4 / §8 twin dry-run) — The code-shape allowlist plus line-start prefix test misclassifies real twin hits in BOTH directions — it emits docstring mentions it promises to suppress and drops the grep-only test-caller edges the loop exists to catch.
  → fix: Invert the gate to a PROSE detector: default = code; a hit is prose only when it sits inside a comment or string token. Python: stdlib `tokenize` over the hit file (exact for multi-line docstrings). TS/JS: a ~30-line state machine for `//`, `/* */`, quotes and template literals. Keep per-line `shape
- **[high] `reach-emit-refactor-grep-arm-unspecified`** (4.4 / D12 / §6 / §8) — The refactor of reach-emit.py onto `mapquery.two_arm` does not say which grep arm red's LIVE path uses afterwards; both answers break a stated property, and the battery's 10 FIRE/NO-DELTA asserts pin the graft-grep JSON shape.
  → fix: Choose (i) explicitly. Core API `two_arm(callers_json, grep_hits:[{path,line,text}], …)`; reach-emit keeps its CLI shell (`no index` early return, `--dry-run`, Reach print) and its `--grep-json` injection becomes a ≤10-line test adapter that converts graft-grep JSON to the hit list (or rewrite the f
- **[high] `gitignore-seed-not-gated`** (D6 / §9 risk 5) — The emit fires whenever `.kdbp/` exists, but the twin has no `.gitignore` entry for the accumulator and `.kdbp/` is tracked there — the first `who_calls` plants an untracked bookkeeping file that the next `git add -A`/`/gabe-commit` commits; §9 leaves this to a remembered handoff item.
  → fix: Gate (d) in the core, before the writer: `git -C <root> check-ignore -q .kdbp/map-deltas.jsonl` must succeed; otherwise skip the emit and return `emit_skipped: ".kdbp/map-deltas.jsonl is not gitignored — run /gabe-init update"` (still `isError:false`). Battery: fixture repo WITHOUT the seed → 0 line
- **[medium] `center-js-blob-in-grep-text`** (D12 / 4.4) — D12's rationale is wrong: the source globs do NOT keep the single-line center JSON out — `*.js` matches the committed `c4-graph.js`; only reach-emit's `_EXCL_DIR` drops it post-hoc, and that filter does not cover the suite repo's own tracked copy, so `who_calls` there returns a ~1 MB `text` field.
  → fix: Add pathspec excludes to the grep call (`':(exclude)docs/site/center' ':(exclude)docs/center' ':(exclude)**/*.min.js' ':(exclude)**/c4-graph*.js' ':(exclude)**/*.data.js'`), add a generated-line rule to `_noise` (line length > 2,000 chars → noise, labelled), and cap each returned `text` at ~200 char
- **[medium] `git-grep-rc-and-untracked`** (D12 / 4.4) — Reusing reach-emit's `_run` for `git grep` conflates 'no matches' with 'grep could not run', and `git grep` without `--untracked` never sees a phase's newborn files — both make an empty arm read as absence.
  → fix: Core grep runner distinct from `_run`: rc 0/1 → hits/empty, rc ≥ 2 → `grep_arm: "unavailable: <first stderr line>"` surfaced in the result (and no emit). Add `--untracked` (respects .gitignore, so build output stays out). Battery: non-git root → the unavailable reason; untracked caller file → presen
- **[medium] `entity-context-parity-vs-caps`** (4.2 / §8) — `detail:"full"` is defined as a CAPPED pack and, in the same sentence, as byte-identical to `entity-context.py --json` minus additions — on the twin these are incompatible, so the parity proof can only pass on an undersized fixture.
  → fix: `full` = the uncapped pack (parity provable on the twin; name the 146 KB cost in the tool description), caps live in `brief` (default) — or add `detail:"capped"`. Run the parity assert in the twin dry-run too and record the numbers in the commit. Rewrite `source.center` to repo-relative in the serve
- **[medium] `dedupe-duplicates-writer-and-outlives-sweep`** (D6(c)) — Gate (c) re-implements the ledger's edge key in the server and adds a per-process set that survives the commit sweep, under-counting the persistence tally 11a defines.
  → fix: Add `map-deltas.py append --once` (skip when an identical un-swept `(gen,subject,file)` line exists — the writer already owns `_read_live`/`_edge_file`); the server and reach-emit call it; execute/review's manual appends can too. Drop the per-process set. map-deltas battery +2 asserts (`--once` skip
- **[medium] `reach-line-claims-graft-when-absent`** (4.4 vs red-spec / tests/reach-emit assert 15) — With the grep arm answering when `graft/` is absent, the unconditional `reach_line "- **Reach:** … (graft@sha)"` stamps a graft state that never existed, while reach-emit must keep printing `no index` for the same input — one core, two record semantics.
  → fix: `reach_line` = `no index` when `map_claim` is absent (or `- **Reach:** … (grep-only@sha)` if the record must carry files) — decide once in the core and let reach-emit print the core's line. gabe-map battery: no `graft/` dir → `reach_line` never contains `graft@`.
- **[medium] `mutant-sibling-resolution`** (§8 mutation proof) — The `SERVER_OVERRIDE`/`MQ_OVERRIDE` hooks inherit a trap already present in reach-emit: an out-of-tree mutant cannot find its sibling scripts, so it emits 0 for the wrong reason and every mutant 'fails an assert' vacuously.
  → fix: State the mutant placement rule in §8: mutants are same-dir temp files (`mapquery.mut.py`, removed in the battery's `trap`), or mapquery resolves siblings via `GABE_SKILLS_DIR` (default `dirname(__file__)/../..`) which the battery sets. First assert of the mutation run: the UN-mutated override passe
- **[low] `emit-ignores-root-outside-roots`** (D4 / D6) — D4 promises a `root` outside the session's roots is read-only, but the D6 gate list never checks it and the writer runs with `cwd=<root>`.
  → fix: Gate (e): emit only when `root` ∈ {`CLAUDE_PROJECT_DIR`, `roots[]`}; otherwise `emit_skipped: "root outside session roots (read-only)"`. One battery case with an explicit foreign root → 0 lines.
- **[low] `cap-notes-and-child-stdout`** (4.4 / D3 / §5) — reach-emit's per-symbol CAP note and dry-run lines are `print`ed, and its writer child inherits fd 1 — neither fits a core that must have no stdout when fd 1 is the JSON-RPC wire.
  → fix: Core returns `notes[]` and `capped:bool` (reach-emit prints them; the server puts them in `structuredContent`); every child process gets `stdout=subprocess.DEVNULL` or `PIPE`. Battery: fixture with 21 grep-only files → `capped:true`, 20 lines.
- **[low] `gate-a-match-definition`** (D6(a) / §8) — 'callers arm returned ≥1 match' is ambiguous between symbol-resolved-with-zero-hits and unresolved, and the battery only covers the unresolved case.
  → fix: Define match = `matches[]` non-empty (symbol resolved), hits may be empty; add the resolved-zero-hits fixture (expect emits for code-shaped grep-only files) next to `matches: []` (expect 0); assert graft's stderr text never appears in any result field.

### 12.4 · protocol — land-with-fixes · 11 findings

- **[high] `structured-content-drops-text`** (§5 tools/call · D5 · D11) — Claude Code feeds the model the serialized structuredContent and DROPS every text content block whenever structuredContent is present, so the design's compact human text (and the D5 honest-empty guidance carried in it) never reaches the model and the 25k budget is spent on the JSON, not the ≤2k-toke
  → fix: Pick ONE channel: v1 returns content:[{type:'text'}] only (the model sees exactly the rendering the design sized), OR keep structuredContent and move every human-facing string (D5 honest-empty guidance, D7 nudge, `reach_line`, freshness stamp, `+N more (cap 40)` notes, `floors[]`) INTO the JSON and 
- **[medium] `fd1-inheritance`** (§5 framing/stdout purity · D6 emit) — contextlib.redirect_stdout(sys.stderr) only rebinds Python's sys.stdout; child processes inherit the real fd 1 (the MCP wire), and the emit path the server is refactored onto spawns map-deltas.py with inherited stdio.
  → fix: At server start: `wire=os.dup(1); os.dup2(2,1)` so fd 1 IS stderr for everything (Python prints, C-level writes, children); write frames only through `os.fdopen(wire,'wb',buffering=0)` with a full-write loop + no interleaving; drop redirect_stdout; still pass stdout=DEVNULL/PIPE to every child. Read
- **[medium] `allowedtools-glob`** (§2 row 8 · §8 harness e2e) — `--allowedTools "mcp__gabe-map__.*"` is a permission GLOB, not a regex: `.*` requires a literal dot, matches no tool, and auto-approves nothing; the cited 'probe exit 0' cannot detect this because a denied tool call still exits 0 in -p mode.
  → fix: Use `--allowedTools mcp__gabe-map` (or `"mcp__gabe-map__*"`); assert the tool_use via `--output-format stream-json` (a `tool_use` block named mcp__gabe-map__map_status), never on exit code; correct §2 row 8's evidence.
- **[medium] `root-not-toplevel`** (D4 · D12 · D6(c)) — CLAUDE_PROJECT_DIR is the directory the session started in, not the git toplevel; running `git grep` with cwd=<root> from a subdirectory restricts the search to that subtree and prints cwd-relative paths, breaking the grep arm's recall, the delta path keys, and the `.kdbp` gate.
  → fix: Normalize root := `git -C <root> rev-parse --show-toplevel` when it succeeds (else the dir containing the center walk-up hit); run `git grep --full-name … -- ':/*.py' ':/*.ts' …` from the toplevel; report `root` as the toplevel; battery case: CLAUDE_PROJECT_DIR=<fixture>/sub resolves the fixture top
- **[medium] `grep-rc-conflation`** (§4.4 who_calls · D12 · D5) — `git grep` exits 1 on no match and 128 when not in a git repo, and `graft callers` exits 1 for an un-indexed symbol vs FileNotFoundError when the binary is absent; the reused `_run` collapses every non-zero rc to None, so 'arm unavailable' is reported as a clean zero.
  → fix: In mapquery.two_arm return per-arm status: grep rc 0/1 → ran (matches/none), rc ≥2 or OSError → `grep_arm:{status:'unavailable', reason:<stderr first line>}`; graft rc 1 + 'no symbol' → `absent (not indexed)`, FileNotFoundError → `unavailable (graft not on PATH)`, other → `unavailable (<stderr>)`. B
- **[low] `append-exit-ambiguous`** (D6(c) · §4.4 deltas_emitted) — map-deltas.py append returns 0 both when it wrote a line and when it silently no-op'd (no .kdbp at the git toplevel), so `deltas_emitted:n` can only count attempts, not writes.
  → fix: Import map-deltas.py via spec_from_file_location and call `append()` in-process (still the one validated writer) using the SAME `_git_root()/_kdbp()` resolution for the gate and the dedupe read, and count only calls that actually wrote (check `os.path.getsize` before/after, or extend append to retur
- **[low] `discover-probe-unpinned`** (§2 · §5 pre-initialize handling) — Claude Code 2.1.258 ships the dual-era MCP client: in `MCP_PROTOCOL_NEGOTIATION=auto` (default today is `legacy`) the FIRST frame is a `server/discover` request with a string id before any `initialize`; the design's pre-init rule works by accident (-32602 is 'a non-modern error') but uses the wrong 
  → fix: Pre-init unknown method → -32601 with the request id echoed verbatim (preserve string ids), never -32022, never close/exit; add a battery case: `server/discover` before initialize → error code ∉ {-32022} with the same string id, then `initialize` still succeeds; document `MCP_PROTOCOL_NEGOTIATION` i
- **[low] `version-fallback-not-latest`** (§2 row 1 · §8 handshake asserts) — On an unsupported requested protocolVersion the server answers 2025-06-18 although it supports 2025-11-25; the spec says the fallback SHOULD be the server's latest, and the battery pins the SHOULD-violation.
  → fix: Supported set = {2025-11-25, 2025-06-18}; echo the request when in the set, else answer 2025-11-25; update the battery assert accordingly.
- **[low] `roots-uri-and-error-reply`** (D4 · §5 routing) — `roots/list` results carry file:// URIs (percent-encoded) and may be an error response (-32601 when the client lacks roots); the design treats `roots[0]` as a path and its 'id no method → a response' branch names only results, and it does not say tool calls must not block on the roots reply.
  → fix: Decode with `urllib.parse.unquote(urlparse(uri).path)`; accept `error` responses for srv-N ids; never block a tools/call on the roots reply (root resolution reads whatever has arrived).
- **[low] `hook-visibility-premise`** (D14 · §11 Q2) — Hooks DO fire for MCP tools (PreToolUse/PostToolUse with matcher `mcp__<server>__.*` and tool_input = the arguments); the 'HOOK-VISIBILITY COLLISION' exists only because the KDBP hook matchers are `Write|Edit|MultiEdit` and `Bash`, so Q2's 'never, or design a hook-visible write path first' premise i
  → fix: Reword D14: 'the KDBP hooks' matchers do not include mcp__gabe-map__.*; a mutation tool would need the matcher extended (`Write|Edit|MultiEdit|mcp__gabe-map__.*`) and tool_input-based path checks' — no v1 change.
- **[low] `fact-table-citations`** (§2 facts table) — Three §2 rows cite 'docs' for claims the current docs do not make, and the wire's 10 MiB per-frame cap is unnamed.
  → fix: Re-cite rows 24/27 as 'probe' or drop 'docs'; state 'cap 25k (bundle-verified; env-vars page stale)'; add a map-spec wire law: one frame ≤ 1 MiB (well under the client's 10 MiB ReadBuffer) enforced by projection, with a battery assert on the largest fixture result.

## 13 · What the next session does (build order, pre-amendment)

1. Apply §12 amendments to §3–§8 (design v2); run the missing lenses (battery · axis-1 · write-safety) + a skeptic pass.
2. Build `skills/gabe-map/{SKILL.md, references/map-spec.md, scripts/server.py, scripts/mapquery.py, scripts/tools.py}` +
   `tests/gabe-map/{run.sh, client.py}`; refactor `reach-emit.py` onto the shared two-arm core (+ battery case for the empty
   graft arm); `map-deltas.py append --once`; parity edits for 28 → 29 (CLAUDE.md · README · suite-center.config.json
   `suite-maintenance` group · help-spec (generated) · tool-registry · docs/src/skill-map.md + docsite rebuild · gabe-red row bump).
3. `./install.sh` → `scripts/suite-doctor.sh` CLEAN → twin dry-run on a COPY of gustify's center (numbers in the commit) →
   opt-in harness e2e (`--mcp-config`, `--allowedTools mcp__gabe-map`, assert the call in the server log) → commit + push both.
4. Registration stays ask-first: `./install.sh --register-mcp` (never automatic). Twins need the `.gitignore` seed for
   `.kdbp/map-deltas*.jsonl` before `who_calls` emits there.
