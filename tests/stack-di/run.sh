#!/usr/bin/env bash
# Port-seam arm battery (dispatch-gap phase 3) — _a3_stacks_di's executable contract.
#
# A ports-and-adapters app cuts its own call graph: `this.sessions.create(...)` goes through an
# interface chosen at runtime, and graft resolves a method by NAME — so it drew the hop when the
# name was unique (.save, one class) and nothing when it was not (.create, five). The whole
# postgres adapter sat outside the walk.
#
# This arm joins four facts: a constructor parameter property (field → port), a `this.field.method(`
# call site, graft's own `implements` edges, and the composition root's construction + the PREDICATE
# of the branch it sits in. Every case below was a real defect first:
#   · `if (` matched the method regex, so a call's caller came out as the method "if"
#   · the nearest-if rule put the SAME predicate on both arms of a fallback — the postgres adapters
#     sit AFTER the in-memory block returns, so their predicate is its negation
#   · `not (!config)` is a double negative a reader has to undo
# Hermetic: synthetic trees + synthetic wiring. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

mkdir -p "$T/app/src"
cat > "$T/app/src/store.ts" <<'TS'
export class CookieStore {
  constructor(
    private readonly sessions: SessionRepository,
  ) {}

  async save(u: U) {
    if (u.old) {
      await this.sessions.remove(u.old);
    }
    await this.sessions.create({ id: u.id });
  }
}
TS
cat > "$T/app/src/pg.ts" <<'TS'
export class PgSessions {
  async create(r: R) { return 1; }
  async remove(id: string) { return 1; }
}
TS
cat > "$T/app/src/mem.ts" <<'TS'
export class MemSessions {
  async create(r: R) { return 1; }
  async remove(id: string) { return 1; }
}
TS
cat > "$T/app/src/container.ts" <<'TS'
function makeStores() {
  const config = readConfig();
  if (!config) {
    return { sessions: new MemSessions() };
  }
  return { sessions: new PgSessions() };
}
export const store = new CookieStore(makeStores().sessions);
TS
cat > "$T/wiring.json" <<'JSON'
{"meta":{"version":1},"nodes":[
 {"id":"src/pg.ts#PgSessions","kind":"class","path":"src/pg.ts","span":"L1-L4"},
 {"id":"src/mem.ts#MemSessions","kind":"class","path":"src/mem.ts","span":"L1-L4"}],
 "edges":[
 {"source":"src/pg.ts#PgSessions","target":"src/ports.ts#SessionRepository","relation":"implements","confidence":"extracted"},
 {"source":"src/mem.ts#MemSessions","target":"src/ports.ts#SessionRepository","relation":"implements","confidence":"extracted"}]}
JSON

if (cd "$GEN" && python3 - "$T" <<'DIPY'
import json, sys, pathlib
import _a3_stacks_di as D
T = pathlib.Path(sys.argv[1])
w = json.loads((T / "wiring.json").read_text())
o = D.parse(T / "app", w)

assert o["present"], o
st = o["stats"]
assert st["root"] == "src/container.ts", f"the composition root was misidentified: {st['root']}"
assert st["ports"] == 1 and st["impls"] == 2, st
assert st["fields"] >= 1, f"the constructor parameter property was not read: {st}"

by = {}
for e in o["edges"]:
    by.setdefault(e["s"].split("#")[-1], {})[e["impl"]] = e

# the CALLER must be the method, never a keyword: `if (` matches `name(` at an indented line
assert "CookieStore.save" in by, f"the caller came out wrong: {sorted(by)}"
assert not any(k.endswith(".if") for k in by), f"a keyword was read as the caller: {sorted(by)}"

# one edge per implementation, and the two arms carry OPPOSITE predicates
arms = by["CookieStore.save"]
assert set(arms) == {"PgSessions", "MemSessions"}, sorted(arms)
assert arms["MemSessions"]["predicate"] == "!config", arms["MemSessions"]["predicate"]
assert arms["PgSessions"]["predicate"] == "config", \
    f"the fallback arm must carry the NEGATION, simplified: {arms['PgSessions']['predicate']}"
assert "not (" not in arms["PgSessions"]["predicate"], "the double negative was not simplified"
# the target is the IMPLEMENTATION's method, so the edge folds into the calls substrate
assert arms["PgSessions"]["t"] == "src/pg.ts#PgSessions.create", arms["PgSessions"]["t"]
assert arms["PgSessions"]["port"] == "SessionRepository", arms["PgSessions"]

# SILENT: no `implements` edge ⇒ no resolution, and it says why. Structural matching is NOT used
# (measured on keypro: 5 all-optional-prop interfaces matched all 17 classes — 85 false pairs).
q = D.parse(T / "app", {"nodes": [], "edges": []})
assert q["present"] is False and "implements" in q["reason"], q
# SILENT: a tree with no port-typed field
(T / "bare").mkdir(exist_ok=True)
(T / "bare" / "x.ts").write_text("export function f() { return 1; }\n")
r = D.parse(T / "bare", w)
assert r["present"] is False and r["reason"], r
# never raises on a missing tree
assert D.parse(T / "nope", w)["present"] is False
print("ok")
DIPY
) >/dev/null 2>&1; then ok; else bad "di arm: root · predicate arms · caller · one-edge-per-impl · silent without implements"; fi

# ── the CROSS-ENTITY lists must survive the task/action-root merge ────────────────────────────
# _a3_graph merged only nodes+edges when folding a root into an existing entity, dropping every
# xaccess it produced — and a root's data edge is almost always cross-entity, because the table it
# writes is declared elsewhere. keypro's 10 action rollups drew 0 edges; tier3 lost 263.
if (cd "$GEN" && python3 - <<'XAPY'
import _a3_graph as G
amap = {"head": "h", "generated": "g", "entities": {
    "svc": {"files": [["api", "t.py", 20]], "models": [], "schemas": [],
            "endpoints": [{"method": "GET", "path": "/x", "fn": "handler", "file": "t.py",
                           "touches": [], "touches_x": [], "doc": "", "resp": "", "status": ""}]},
    "data": {"files": [["models", "m.py", 10]], "schemas": [], "endpoints": [],
             "models": [{"cls": "Widget", "table": "widgets", "fks": {}, "cols": [], "rels": [], "uqs": []}]}},
  "task_roots": [{"method": "TASK", "path": "sweep", "fn": "sweep", "file": "t.py",
                  "touches": [], "touches_x": [], "doc": "", "resp": "-", "status": "-"}]}
ea = {"t.py#sweep": {"ops": [{"model": "Widget", "table": "widgets", "rw": "w"}], "commits": True}}
# endpoint_access rides inside the graft arm's result, not as its own parameter
g = G.build_c4_graph(amap, graft={"present": True, "reason": "fixture", "endpoint_access": ea,
                                  "functions": {"fn_slug": {}, "calls": []}, "stats": {}})
edges = [e for e in (g.get("cross_edges") or []) if e.get("kind") in ("writes_to", "reads_from")]
assert edges, "a TASK root's cross-entity data edge was dropped in the merge"
assert any(str(e.get("from")).endswith("TASK sweep") and e.get("to") == "model:Widget" for e in edges), edges
assert (g.get("stats") or {}).get("access_edges") == 1, (g.get("stats") or {}).get("access_edges")
print("ok")
XAPY
) >/dev/null 2>&1; then ok; else bad "a task/action root's cross-entity data edge must survive the merge"; fi

echo "stack-di: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
