#!/usr/bin/env bash
# _a3_code ORM-access battery (C2) — the executable contract for the AST pass that
# names which function reads/writes which DB table, the write graft cannot see.
#
# _a3_code._orm_access(fn_node, model2table) returns {'ops':[{model,table,rw}], 'commits':bool}:
#   * READS are a near-census — the model is a LITERAL arg: select(Model) / session.get(Model,..).
#   * WRITES use a per-fn var→class symtab from `x = Model(...)` constructor assigns
#     (session.add(x)) + inline session.add(Model()); Core insert/update/delete(Model) too.
#   * COMMIT/flush → the durable-boundary flag.
#   * HONEST FLOOR: an object bound OUTSIDE the fn (session.add(param)) is an UNDER-count,
#     never a wrong table. NON-model .add()/.get() never fire (no false positives).
# _model_table_map(trees) → {ModelClass: table} via __tablename__.
# FIRE and SILENT both exercised (mutation-proven). Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators"

python3 - "$GEN" <<'PY'
import sys, ast
gen = sys.argv[1]
sys.path.insert(0, gen)
import _a3_code as C

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

def fn(src, name):
    for n in ast.walk(ast.parse(src)):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name == name:
            return n
    raise AssertionError("no fn " + name)

MODELS = '''
class Recipe(Base):
    __tablename__ = "recipes"
class CookingSession(Base):
    __tablename__ = "cooking_sessions"
'''
m2t = C._model_table_map({"m": ast.parse(MODELS)})
check(m2t == {"Recipe": "recipes", "CookingSession": "cooking_sessions"},
      "model_table_map: __tablename__ → {cls:table} (got %r)" % m2t)

def ops(src, name, mm=m2t):
    a = C._orm_access(fn(src, name), mm)
    return {(o["rw"], o["model"], o["table"]) for o in a.get("ops", [])}, a.get("commits", False)

# FIRE 1 — construct-then-add write + commit (the dominant idiom)
o, cm = ops('''
def start():
    cs = CookingSession(x=1)
    session.add(cs)
    session.commit()
''', "start")
check(("w", "CookingSession", "cooking_sessions") in o, "construct-then-add WRITE detected (%r)" % o)
check(cm is True, "commit() → commits=True")

# FIRE 2 — read via literal-arg select, one level inside execute
o, _ = ops('def q():\n    return session.execute(select(Recipe))', "q")
check(o == {("r", "Recipe", "recipes")}, "select(Model) READ named the table (%r)" % o)

# FIRE 3 — inline constructor write + session.get read
o, _ = ops('def m():\n    session.add(Recipe())\n    session.get(CookingSession, 1)', "m")
check(("w", "Recipe", "recipes") in o and ("r", "CookingSession", "cooking_sessions") in o,
      "inline add() WRITE + session.get READ (%r)" % o)

# FIRE 4 — Core insert(Model) write
o, _ = ops('def c():\n    conn.execute(insert(Recipe).values(x=1))', "c")
check(o == {("w", "Recipe", "recipes")}, "Core insert(Model) WRITE (%r)" % o)

# SILENT 1 — non-model .add()/.get() never fire (false-positive guard)
o, cm = ops('def n():\n    items.add(5)\n    cache.get("k")\n    total += 1', "n")
check(o == set() and cm is False, "non-ORM .add()/.get() stay SILENT (%r)" % o)

# SILENT 2 — the honest floor: object bound OUTSIDE the fn → under-count, not a wrong table
o, _ = ops('def o(x):\n    session.add(x)', "o")
check(o == set(), "out-of-fn binding is an honest floor — no false table (%r)" % o)

# SILENT 3 — empty model map → nothing (graft-absent / no models parsed)
a = C._orm_access(fn('def z():\n    session.add(Recipe())', "z"), {})
check(a == {}, "empty model2table → {} (%r)" % a)

# MUTATION — drop the add: the write must disappear (proves the op, not the var, drives it)
o, _ = ops('def d():\n    cs = CookingSession()\n    return cs', "d")
check(("w", "CookingSession", "cooking_sessions") not in o,
      "constructing without add() is NOT a write (mutation guard) (%r)" % o)

# ── C4 · non-ORM SINK floor (_detect_sinks) ──
def sinks(src, name):
    return C._detect_sinks(fn(src, name))
check(sinks('def f():\n    open("out.txt", "w").write("x")', "f") == ["file"], "sink: open(_, 'w') → file")
check(sinks('def f():\n    Path(p).write_text(s)', "f") == ["file"], "sink: .write_text → file")
check(sinks('def q():\n    bus.publish(evt)', "q") == ["queue"], "sink: bus.publish → queue")
check(sinks('def c():\n    redis.set(k, v)', "c") == ["cache"], "sink: redis.set → cache")
check(sinks('def h():\n    httpx.post(url, json=d)', "h") == ["http"], "sink: httpx.post → http")
# SILENT — a bare .set()/.get()/write on a non-sink receiver, or open() without a write mode
check(sinks('def n():\n    d.set(k, v)\n    mylist.get(0)\n    open("in.txt")\n    total += 1', "n") == [],
      "sinks: non-sink receivers + read-open stay SILENT (no false positives)")

# ── C4 follow-up · ENDPOINT MIDDLEWARE (_endpoint_middleware) — the level-2 gate/dep floor ──
def epmw(src):
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for dec in node.decorator_list:
                if (isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute)
                        and dec.func.attr in ("get", "post", "put", "patch", "delete")):
                    return C._endpoint_middleware(node, dec)
    return None

# FIRE 1 — signature Depends: one gate dep + one plain dep, both param-dep; gate-first order
m = epmw('@router.post("/x")\ndef create(body, ctx=Depends(get_auth_context), db=Depends(get_db)):\n    pass')
names = [x["name"] for x in m]
check(("get_auth_context" in names and "get_db" in names), "signature Depends → both deps found (%r)" % names)
check(next(x for x in m if x["name"] == "get_auth_context")["gate"] is True, "auth dep flagged gate=True")
check(next(x for x in m if x["name"] == "get_db")["gate"] is False, "get_db is NOT a gate")
check(all(x["via"] == "param-dep" for x in m), "signature deps carry via=param-dep")
check(m[0]["name"] == "get_auth_context", "gate-first sort (gate before non-gate)")

# FIRE 2 — route-decorator dependencies=[Depends(..)]
m = epmw('@router.get("/y", dependencies=[Depends(require_household)])\ndef read():\n    pass')
check(m == [{"name": "require_household", "via": "route-dep", "gate": True}],
      "route dependencies=[Depends(..)] → route-dep gate (%r)" % m)

# FIRE 3 — non-route decorator (@idempotent) rides as a decorator middleware
m = epmw('@idempotent\n@router.post("/z")\ndef make():\n    pass')
check([x for x in m if x["via"] == "decorator" and x["name"] == "idempotent"],
      "custom decorator → decorator middleware (%r)" % m)

# FIRE 4 — Depends(Checker("admin")) → the full dep EXPRESSION (unparsed, so two Checkers stay distinct)
m = epmw('@router.get("/w")\ndef w(scope=Depends(RoleChecker("admin"))):\n    pass')
check(m and m[0]["name"] == "RoleChecker('admin')", "Depends(Checker(..)) → unparsed dep expr (%r)" % m)

# FIRE 5 — the MODERN idiom: x: Annotated[T, Depends(fn)] (Depends lives in the annotation, not the default)
m = epmw('@router.get("/a")\ndef a(ctx: Annotated[AuthContext, Depends(get_auth_context)], db: Annotated[Session, Depends(get_session)]):\n    pass')
names = [x["name"] for x in m]
check("get_auth_context" in names and "get_session" in names, "Annotated[T, Depends(..)] deps found (%r)" % names)
check(all(x["via"] == "param-dep" for x in m), "Annotated deps carry via=param-dep")

# FIRE 6 — attribute-qualified callee: fastapi.Depends(fn) + typing.Annotated[T, fastapi.Security(fn)]
m = epmw('@router.get("/q")\ndef q(u=fastapi.Depends(get_current_user)):\n    pass')
check(m and m[0]["name"] == "get_current_user" and m[0]["gate"] is True, "fastapi.Depends(fn) (Attribute callee) resolved + gated (%r)" % m)
m = epmw('@router.get("/q2")\ndef q2(u: typing.Annotated[User, fastapi.Security(require_scope)]):\n    pass')
check(m and m[0]["name"] == "require_scope", "typing.Annotated[T, fastapi.Security(..)] (both Attribute forms) resolved (%r)" % m)

# FIRE 7 — DISTINCT deps that share a leaf name stay separate (unparse, not leaf-collapse)
m = epmw('@router.get("/v")\ndef v(a=Depends(auth.verify), b=Depends(billing.verify)):\n    pass')
names = sorted(x["name"] for x in m)
check(names == ["auth.verify", "billing.verify"], "distinct dotted deps do NOT collapse on the leaf 'verify' (%r)" % names)

# FIRE 8 — gate heuristic is TOKEN-based: no over-flag on scoped/required, catches check_/enforce_/current_user
def gate(name): return C._is_mw_gate(name)
check(gate("get_user_scoped_query") is False and gate("parse_required_filters") is False,
      "token gate: 'scoped'/'required' do NOT over-flag (scope⊄scoped, require⊄required)")
check(gate("check_ownership") and gate("enforce_quota") and gate("get_current_user") and gate("require_household"),
      "token gate: check_/enforce_/current_user/require_ all flagged")
check(gate("get_session") is False and gate("get_settings") is False and gate("get_db") is False,
      "token gate: resource deps (session/settings/db) stay non-gate")

# SILENT 1 — a plain handler with no deps/decorators → [] (the route decorator is NEVER middleware)
check(epmw('@router.get("/p")\ndef plain(q=None):\n    pass') == [],
      "no deps/decorators → [] and the @router.get is not counted (honest-empty)")

# SILENT 2 — a non-Depends default is not middleware (false-positive guard)
check(epmw('@router.get("/d")\ndef d(limit=SomeHelper(10)):\n    pass') == [],
      "a non-Depends default stays SILENT (%r)" % epmw('@router.get("/d")\ndef d(limit=SomeHelper(10)):\n    pass'))

# MUTATION — drop the Depends wrapper: the gate must disappear (proves Depends drives it, not the name)
check(epmw('@router.get("/m")\ndef m(ctx=get_auth_context):\n    pass') == [],
      "a bare default (no Depends) is NOT middleware (mutation guard)")

print(f"orm-access: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY
