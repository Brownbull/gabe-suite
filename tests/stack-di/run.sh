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
# ── the six fixes the port-seam review measured on the study repos ────────────
mkdir -p "$T/b/src/__tests__"
cat > "$T/b/src/svc.ts" <<'TS'
export class Service {
  constructor(
    private readonly store: Store,
    private readonly clock: Clock,
  ) {}

  // a DESTRUCTURED parameter: the body brace sits past the parameter list
  async load({ id }: Args) {
    clearInterval(this.timer);
    return this.store.read(id);
  }

  get ready() { return true; }
}

// a class must end at its own closing brace — what follows is NOT its body
interface ParsedHash {
  readonly token: Store;
  readonly nonce: Clock;
}

export const KEY = "k";
TS
cat > "$T/b/src/disk.ts" <<'TS'
export class DiskStore {
  async read(id: string) { return id; }
}
TS
cat > "$T/b/src/__tests__/fake.ts" <<'TS'
export class FakeStore {
  async read(id: string) { return id; }
}
TS
cat > "$T/b/src/container.ts" <<'TS'
function build() {
  const seen = new Set();
  const err = new Error("x");
  const other = new Map();
  if (!useDisk) {
    return { store: new MemStore() };
  }
  return { store: new DiskStore() };
}
TS
cat > "$T/b/src/vm.ts" <<'TS'
export function vm() {
  const a = new Set(); const b = new Set(); const c = new Set();
  const d = new Map(); const e = new Map(); const f = new Error("x");
  return [a, b, c, d, e, f];
}
TS
cat > "$T/b/wiring.json" <<'JSON'
{"meta":{"version":1},"nodes":[],"edges":[
 {"source":"src/disk.ts#DiskStore","target":"src/ports.ts#Store","relation":"implements","confidence":"extracted"},
 {"source":"src/__tests__/fake.ts#FakeStore","target":"src/ports.ts#Store","relation":"implements","confidence":"extracted"},
 {"source":"src/clock.ts#SystemClock","target":"Clock","relation":"implements","confidence":"extracted"}]}
JSON
if (cd "$GEN" && python3 - "$T/b" <<'DIBPY'
import sys, pathlib, json
import _a3_stacks_di as D
root = pathlib.Path(sys.argv[1])
o = D.parse(root, json.load(open(root / "wiring.json")))
st = o["stats"]
got = {(e["s"].split("#")[-1], e["t"].split("#")[-1]) for e in o["edges"]}

# 1 · di-caller-nearest-call-line — the site sits in `load`, whose body brace is past a
#     DESTRUCTURED parameter list, and a bare `clearInterval(` precedes the call.
assert ("Service.load", "DiskStore.read") in got, f"the caller was misattributed or abstained: {sorted(got)}"
assert not any(c.startswith("Service.ready") or c.startswith("Service.clearInterval")
               for c, _ in got), f"a getter or a bare call stole the attribution: {sorted(got)}"

# 2 · di-field-span-overrun — `interface ParsedHash` follows the class; its two members are NOT
#     the class's fields. Running a class to the NEXT class harvested them on every study repo.
assert st["fields"] == 2, f"the class span overran into the interface below it: fields={st['fields']}"

# 3 · di-impls-include-test-doubles — a FakeStore under __tests__ is not the composed
#     implementation. gustify's entire published TS seam was one test helper.
assert ("Service.load", "FakeStore.read") not in got, "a test double was drawn as an implementation"

# 4 · a `#`-less implements target is unresolvable and COUNTED, never guessed
assert st.get("ports_unresolved") == 1, f"a bare port name must be counted: {st}"

# 5 · di-root-counts-builtins — `new Set/Map/Error` are not compositions. `vm.ts` builds SIX and
#     no implementation; `container.ts` builds one known impl. Neither reaches two, so there is
#     NO root, said out loud — gustify crowned a file with 10 `new Set(` and zero project classes.
assert st["root"] is None, f"a builtin-constructing file was crowned the composition root: {st['root']}"
assert "two or more known implementation" in (st.get("root_reason") or ""), st
assert st.get("capped") is False and st.get("files"), f"the cap must be published: {st}"
print("ok")
DIBPY
) >/dev/null 2>&1; then ok; else bad "di: caller containment · class span · test doubles · bare port · root ignores builtins"; fi

# SILENT / REASON: the reason must be DERIVED. gastify shipped "no class declares a port-typed
# field" beside a census reading `fields: 12`.
mkdir -p "$T/c/src"
cat > "$T/c/src/a.ts" <<'TS'
export class Holder {
  constructor(private readonly sock: Sock) {}
  close() { return this.sock?.close(); }
}
TS
cat > "$T/c/wiring.json" <<'JSON'
{"meta":{"version":1},"nodes":[],"edges":[
 {"source":"src/impl.ts#RealSock","target":"src/ports.ts#Other","relation":"implements","confidence":"extracted"}]}
JSON
mkdir -p "$T/c-plain/src"
cat > "$T/c-plain/src/b.ts" <<'TS'
export class Plain {
  constructor(private readonly sock: Sock) {}
  close() { return this.sock.close(); }
}
TS
if (cd "$GEN" && python3 - "$T/c" <<'DICPY'
import sys, pathlib, json
import _a3_stacks_di as D
root = pathlib.Path(sys.argv[1])
o = D.parse(root, json.load(open(root / "wiring.json")))
st = o["stats"]
assert o["present"] is False, o
# the field IS declared and counted — so the reason may not claim otherwise
assert st["fields"] == 1, st
# `this.sock?.close()` is not matched (optional chaining, a named floor), so sites == 0 — and the
# reason must say THAT, not "no class declares a port-typed field" while shipping `fields: 1`.
assert st["sites"] == 0, st
assert "declare 1 port-typed field" in o["reason"] and "none is called" in o["reason"], \
    f"the reason is not derived from the stats beside it: {o['reason']}"

# the THIRD clause: fields declared, sites called, nothing reaching an implemented port
o3 = D.parse(pathlib.Path(sys.argv[1] + "-plain"), json.load(open(root / "wiring.json")))
assert o3["stats"]["sites"] > 0 and o3["present"] is False, o3["stats"]
assert "none reaching a port" in o3["reason"] and "optional chaining" in o3["reason"], \
    f"the third clause must name the unread floors: {o3['reason']}"

# and with NO implements edge at all, the cause is the index, not the source
o2 = D.parse(root, {"edges": []})
assert "implements" in o2["reason"], o2["reason"]
print("ok")
DICPY
) >/dev/null 2>&1; then ok; else bad "di: the silence reason is DERIVED from the stats, never hardcoded"; fi


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

# ── BOTH arms' bindings must reach derive_functions ──────────────────────────────────────────
# The call site passed only the TypeScript arm's edges after the Python arm was added, so the
# Firebase hop resolved and then vanished — the arm's stats said "resolved: 1" while the map drew
# nothing. Only the baseline gate caught it (gustify census identical when it should have moved).
# A source pin is the right tool here: exercising the handoff needs a graft INDEX in the fixture,
# and this is the exact line that regressed.
grep -q "bindings=_dibind" "$GEN/_a3_graft.py" \
  && grep -q '_dibind = list(_di.get("edges") or \[\]) + list(_pdi.get("edges") or \[\])' "$GEN/_a3_graft.py" \
  && ok || bad "derive_functions must receive BOTH port arms' bindings (_dibind), not one arm's"
# and the substrate the derivations read must carry them too, or d2w stays blind past the port
grep -q "for _e in _dibind\]" "$GEN/_a3_graft.py" \
  && ok || bad "the bindings must also enter the wiring the behind/d2w/roles derivations read"

echo "stack-di: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
