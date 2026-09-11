# ACTION roots — the Next.js request-root spike (measured)

**2026-09-11 · dry-run on a COPY** (`repo-study/others/keypro-front/scripts/`, a study clone of a
friend's repo; the suite's own generators are UNTOUCHED). This record corrects the
[nextjs-gap-audit](nextjs-gap-audit.md) build order: its step 4 priced server-action roots as
**"days · new-arm"**. Measured, it is **four small edits on an existing generic seam**.

## The finding

`_a3_levels.py:234` seeds `drawn_fn` from exactly three root sources — Python handlers
(`function_insight.handler`), `boot_roots`, `task_roots` — then rule 3 (`:274`) expands graft's
call edges **only from a seeded root** (`if c["s"] not in _handlers: continue`).

So on keypro-front graft had already indexed the whole app — `graft/.graph/wiring.json`:
**1,499 nodes · 4,163 edges**, `languages: [python, tsx, typescript]`, node kinds
`function 1049 · file 194 · method 111 · interface 84 · type 41 · class 20`, relations incl.
`implements` and `extends` — and **none of it was ever entered**, because nothing minted a root.
The function graph read `fn_nodes: 0`, not because TypeScript is unsupported (`_a3_levels.py:403`
sets `"lang": "py" if is_py else "ts"` and defaults a TS fn's layer by extension — TS fns are a
supported shape) but because the app has no `@router`.

`parse_task_roots` (`_a3_code.py:2783`) already returns **endpoint-shaped** records
`{method, path, fn, file, touches, touches_x, doc, resp, status}`, and `_a3_graph.py:1100` passes
them into the **generic** `_l2` endpoint builder — nothing hardcodes `TASK`. The seam accepts a
new root kind as-is.

## The change (4 edits)

1. `_a3_code.parse_action_roots(repo)` — a file whose first statement is `"use server"` is a
   server-action module; each `export [async] function NAME(` becomes
   `{method:"ACTION", path:NAME, fn:NAME, file, touches:[], touches_x:[], doc:<jsdoc>, resp:"—", status:"—"}`.
2. `build_center_a3.py` — `amap["action_roots"] = parse_action_roots(REPO_ROOT)`, and add it to the
   `boot_roots=` union handed to the graft arm.
3. `_a3_graph.py:1100` — `_troots = task_roots + action_roots`.
4. `_a3_levels.py:251` — the same union seeds `drawn_fn` / `_handlers`.

## Measured (keypro-front, 11 actions across 4 files)

| | before | after |
|---|---|---|
| `levels.fn_nodes` | 0 | **22** (all `lang: ts`) |
| `levels.fn_edges` | 0 | **23** (`calls`) |
| l2 endpoint nodes | 0 | **11** (`ACTION login`, `ACTION requestReply`, …) |
| station nodes / links | 78 / 120 | **89** / 120 |
| curated journeys resolving | 0 (byLabel empty) | **8 of 8, zero unmapped steps** |
| chrome harness | 346 pass / 0 fail | **346 pass / 0 fail** |

Real chains drew, e.g. `requestReply → AuthService.currentUser` and `→ ChatService.reply`.

## Floors — stated, not hidden

- **Depth is 1 hop.** Rule 3 draws only handler-rooted calls; going deeper (service → port →
  adapter) needs the d2w gradient, which needs model access — i.e. the SQL-in-TS arm
  (`sql-in-ts-tables-not-drawn` in the audit). Today a journey shows action → service, not
  action → adapter → table.
- **File-level directive only.** An inline per-function `"use server"` and the
  `export const x = async () => {}` action form are not read.
- **`touches` is empty** — no model access, so no d2w heat and no write rings.

## A REAL defect this surfaced (graft, suite-level)

8 of the 23 edges are FALSE: every admin action and `login` "calls"
`fake-conversation-history.ts#FakeConversationHistory.get`. The actual source line is
`formData.get("username")` — the **web-standard FormData API**. graft resolves an unqualified
`.get(` to the only `get` method it knows, across files, with no import-reachability check.
35% of this app's function graph was wrong. Fix direction: require the callee's file to be
import-reachable from the caller before accepting a bare-method resolution, or de-rank
single-name method hits against a std-lib/DOM roster (`get`, `set`, `has`, `map`, `then`, …).
This is the map↔grep delta loop's exact territory, but keypro has no `.kdbp/` so nothing
accumulated — recorded here instead.

## LANDED 2026-09-11 (operator: "I agree with all of this")

Promoted to the suite as **class 15**: `_a3_code.parse_action_roots` + the 4 wirings, plus
`tests/action-roots/run.sh` (**15 assertions**, 3 mutants killed: dropped `.test.` skip ·
directive-anywhere · directive-ignored). `./install.sh` + `suite-doctor.sh` **CLEAN**.

**The inertness proof the promotion was gated on** — the emitter run TWICE against gustify in the
suite's read-only lab mode (`GABE_REPO_ROOT` + `GABE_CENTER_OUT`; gustify's tree clean before and
after), unpatched vs patched:

* `c4-graph.json` · `levels.json` · `c4-graph.js` · `levels.js` — **byte-identical**
* all **82** emitted files, run-timestamp normalized — **82 identical · 0 differing**
* `archmap.json` structurally equal ignoring `generated`; the `action_roots` key **absent**
* `parse_action_roots` returns `[]` on tier0, tier1 and gustify

Still owed: the `formData.get` graft-resolution fix as a regression fixture (below).
