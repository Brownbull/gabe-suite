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

# ── B1 · ORM substrate widening (attr-writes · column-select root-walk · 3 new binders) ──
# attribute write on a Model-annotated PARAM (the 61-site gap): obj.col = v / += is a WRITE
o, _ = ops('def f(r: Recipe):\n    r.title = "x"\n    r.views += 1', "f")
check(("w", "Recipe", "recipes") in o, "B1 FIRE: an attribute write on a Model-annotated param is a WRITE")
# session.get(Model) binds the result → the get is a read, its attr-write a write
o, _ = ops('def f(s):\n    c = s.get(CookingSession, 1)\n    c.state = "done"', "f")
check(("r", "CookingSession", "cooking_sessions") in o and ("w", "CookingSession", "cooking_sessions") in o,
      "B1 FIRE: session.get(Model) result binds → read + its attr-write")
# column select select(Model.col) + .join(Model) — the old bare-Name rule ignored the attribute select
o, _ = ops('def f():\n    q = select(Recipe.id).join(CookingSession)', "f")
check(("r", "Recipe", "recipes") in o and ("r", "CookingSession", "cooking_sessions") in o,
      "B1 FIRE: select(Model.col) + .join(Model) resolve to the model READ")
# `for u in <Model-annotated collection>` carries the model to the loop var + its attr-write
o, _ = ops('def f(items: list[Recipe]):\n    for u in items:\n        u.flagged = True', "f")
check(("w", "Recipe", "recipes") in o, "B1 FIRE: `for u in <Model-annotated collection>` carries the model")
# an attribute write on a NON-Model var is never a table write (no false positive)
o, _ = ops('def f():\n    cfg = 1\n    cfg.value = 2', "f")
check(o == set(), "B1 SILENT: an attribute write on a non-Model var is never a table write")
# an UNANNOTATED param binds nothing → its attr-write stays an honest floor (no wrong table)
o, _ = ops('def f(x):\n    x.title = "y"', "f")
check(o == set(), "B1 SILENT: an attribute write on an UNANNOTATED param stays a floor (never guessed)")

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
# B1 · the http guard: `session.<verb>` is http ONLY when the module imports an http client —
# a SQLAlchemy session.delete is not an http sink (the 5 false gustify sinks vanish)
check(C._detect_sinks(fn('def f(session):\n    session.delete(x)', "f"), http_lib=False) == [],
      "B1 SILENT: session.delete with NO http import is SQLAlchemy, not an http sink")
check(C._detect_sinks(fn('def f(session):\n    session.post(url)', "f"), http_lib=True) == ["http"],
      "B1 FIRE: session.post WITH an http import IS an http sink (aiohttp ClientSession kept)")
check(C._detect_sinks(fn('def f():\n    httpx.post(url)', "f"), http_lib=False) == ["http"],
      "B1: a named http lib (httpx) stays an http sink regardless of the import flag")

# ── class 12 (wave C) · feature-flag walls (parse_flags census + _flag_gates polarity) ──
FL = {"recipe_creation_enabled": {}, "RECIPE_CREATION_ENABLED": {}, "seed_controls_enabled": {}}
def fg(src, name="h"): return C._flag_gates(fn(src, name), FL)
check(fg('def h():\n    if not settings.recipe_creation_enabled:\n        raise HTTPException(status_code=403)')
      == [{"name": "recipe_creation_enabled", "on": "off", "on_fail": "403", "line": 2}],
      "flag FIRE: `if not flag: raise` walls OFF with polarity + status")
w = fg('def h():\n    if not (RECIPE_CREATION_ENABLED or settings.recipe_creation_enabled):\n        raise HTTPException(403)')
check({x["name"] for x in w} == {"RECIPE_CREATION_ENABLED", "recipe_creation_enabled"} and all(x["on"] == "off" for x in w),
      "flag FIRE: `not (A or B)` walls BOTH flags (the effective-flag idiom)")
check(fg('def h():\n    if not get_settings().seed_controls_enabled:\n        raise RuntimeError()')[0]["name"] == "seed_controls_enabled",
      "flag FIRE: receiver-agnostic leaf (get_settings().x)")
check(fg('def h():\n    if not settings.recipe_creation_enabled:\n        return None') == [],
      "flag SILENT: `if not flag: return` is an ARM, never a wall (raise-only)")
check(fg('def h():\n    if not settings.other_thing:\n        raise X()') == [], "flag SILENT: a non-flag name never walls")
check(C._flag_gates(fn('def h():\n    if not x:\n        raise X()', "h"), {}) == [], "flag SILENT: empty census → [] (honest-empty)")
# parse_flags on a SYNTHETIC repo (not gustify — the honest-empty must hold on a flagless project too)
import tempfile as _tf, pathlib as _pl
_fr = _pl.Path(_tf.mkdtemp()); (_fr / "api").mkdir()
(_fr / "api/routes.py").write_text("def f():\n    return 1\n")
check(C.parse_flags(_fr, entity_code={"x": {"api": ["api/routes.py"]}}) == {},
      "parse_flags SILENT: no Settings bool / no module Final[bool] → {} (honest-empty, byte-identical)")
(_fr / "config.py").write_text("class Settings(BaseSettings):\n    recipe_creation_enabled: bool = False\n    name: str = 'x'\n")
(_fr / "constants.py").write_text("from typing import Final\nSEED: Final[bool] = True\n")
_pf = C.parse_flags(_fr, entity_code={"x": {"api": ["api/routes.py"]}})
check("recipe_creation_enabled" in _pf and "SEED" in _pf and "name" not in _pf,
      "parse_flags FIRE: a Settings bool + a module Final[bool] are flags; a str field is not")

# ── class 5b (wave C) · serializes (parse_schemas orm flag + _orm_access model_validate site) ──
def scls(src, name): return next(n for n in ast.walk(ast.parse(src)) if isinstance(n, ast.ClassDef) and n.name == name)
check(C._schema_orm(scls("class R(BaseModel):\n    x: int\n    model_config = ConfigDict(from_attributes=True)", "R")) is True,
      "schema orm FIRE: model_config = ConfigDict(from_attributes=True) → orm (v2)")
check(C._schema_orm(scls("class R(BaseModel):\n    x: int\n    class Config:\n        orm_mode = True", "R")) is True,
      "schema orm FIRE: nested class Config: orm_mode = True → orm (v1)")
check(C._schema_orm(scls("class R(BaseModel):\n    x: int", "R")) is False, "schema orm SILENT: a plain schema → no orm flag")
a = C._orm_access(fn('def f(u: Recipe):\n    return RecipeResponse.model_validate(u)', "f"), m2t)
check(a.get("serializes") == [{"cls": "RecipeResponse", "model": "Recipe", "line": 2}],
      "serializes SITE FIRE: X.model_validate(bound) records schema→model via the B1 symtab")
a = C._orm_access(fn('def f():\n    return RecipeResponse.model_validate(mystery)', "f"), m2t)
check(a.get("serializes") == [{"cls": "RecipeResponse", "model": None, "line": 2}],
      "serializes: an unresolvable arg records model:None (honest floor, never guessed)")
check("serializes" not in C._orm_access(fn('def f():\n    return 1', "f"), m2t),
      "serializes SILENT: no model_validate → no serializes key (honest-empty)")

# ── class 8 (wave C) · app-level middleware census (parse_app_middleware finds add_middleware) ──
_mr = _pl.Path(_tf.mkdtemp()); (_mr / "app" / "api").mkdir(parents=True)
(_mr / "app" / "api" / "routes.py").write_text("from fastapi import APIRouter\nrouter=APIRouter()\n@router.get('/x')\ndef h():\n    return 1\n")
(_mr / "app" / "main.py").write_text("app = FastAPI()\napp.add_middleware(CORSMiddleware)\napp.add_middleware(RateLimitMiddleware)\n")
_am = C.parse_app_middleware(_mr, entity_code={"e": {"api": ["app/api/routes.py"]}})
check([m["cls"] for m in _am] == ["CORSMiddleware", "RateLimitMiddleware"] and all(m["scope"] == "all" for m in _am),
      "parse_app_middleware FIRE: finds add_middleware(Cls) in the api dir's PARENT (main.py), scope 'all'")
check(C.parse_app_middleware(_pl.Path(_tf.mkdtemp()), entity_code={"e": {"api": []}}) == [],
      "parse_app_middleware SILENT: no add_middleware → [] (honest-empty, byte-identical)")

# ── class 6 (wave C) · dispatch_map (event-bus registry + publish resolution, fn-local alias) ──
_dr = _pl.Path(_tf.mkdtemp()); (_dr / "app").mkdir()
(_dr / "app/bus.py").write_text("def register_handlers():\n    from app.skills import on_cook as han\n    bus.register_once(CookedEvent, han)\n")
(_dr / "app/skills.py").write_text("def on_cook(session, event):\n    return 1\n")
(_dr / "app/cooking.py").write_text("def post_complete():\n    bus.publish(session, CookedEvent(x=1))\n")
_sv_ec, _sv_cache, _sv_disp = C.ENTITY_CODE, dict(C._EMAP_CACHE), C._DISPATCH
C.ENTITY_CODE = {"e": {"services": ["app/bus.py", "app/skills.py", "app/cooking.py"]}}
C._EMAP_CACHE.clear(); C._DISPATCH = None
try:
    _dm = C.dispatch_map(_dr)
finally:
    C.ENTITY_CODE = _sv_ec; C._EMAP_CACHE.clear(); C._EMAP_CACHE.update(_sv_cache); C._DISPATCH = _sv_disp
_de = [(e["s"].split("#")[-1], e["t"].split("#")[-1], e["event"]) for e in _dm.get("dispatches", [])]
check(_de == [("post_complete", "on_cook", "CookedEvent")],
      "dispatch_map FIRE: register_once(Event, alias) + publish(session, Event()) → publisher→handler edge (fn-local alias resolved, event is arg[1])")
# honest-empty: a repo with no register/publish → {}
C._DISPATCH = None
_dr0 = _pl.Path(_tf.mkdtemp()); (_dr0 / "app").mkdir(); (_dr0 / "app/plain.py").write_text("def f():\n    return 1\n")
_sv_ec2 = C.ENTITY_CODE; C.ENTITY_CODE = {"e": {"services": ["app/plain.py"]}}; C._EMAP_CACHE.clear(); C._DISPATCH = None
try:
    _dm0 = C.dispatch_map(_dr0)
finally:
    C.ENTITY_CODE = _sv_ec2; C._EMAP_CACHE.clear(); C._EMAP_CACHE.update(_sv_cache); C._DISPATCH = _sv_disp
check(_dm0 == {}, "dispatch_map SILENT: no register/publish → {} (honest-empty, byte-identical)")

# ── class 7 (wave C) · parse_boot_roots (FastAPI(lifespan=) / @app.on_event('startup')) ──
_br = _pl.Path(_tf.mkdtemp()); (_br / "app" / "api").mkdir(parents=True)
(_br / "app" / "api" / "routes.py").write_text("from fastapi import APIRouter\nrouter=APIRouter()\n@router.get('/x')\ndef h():\n    return 1\n")
(_br / "app" / "main.py").write_text("async def lifespan(app):\n    seed_all()\n    yield\napp = FastAPI(lifespan=lifespan)\n")
_boot = C.parse_boot_roots(_br, entity_code={"e": {"api": ["app/api/routes.py"]}})
check([(r["fn"], r["method"]) for r in _boot] == [("lifespan", "BOOT")] and _boot[0]["file"] == "app/main.py",
      "parse_boot_roots FIRE: FastAPI(lifespan=F) in the api dir's PARENT → a BOOT root")
(_br / "app" / "app.py").write_text("@app.on_event('startup')\nasync def on_boot():\n    warm()\n")
_boot2 = C.parse_boot_roots(_br, entity_code={"e": {"api": ["app/api/routes.py"]}})
check(any(r["fn"] == "on_boot" for r in _boot2), "parse_boot_roots FIRE: @app.on_event('startup') is a BOOT root too")
check(C.parse_boot_roots(_pl.Path(_tf.mkdtemp()), entity_code={"e": {"api": []}}) == [],
      "parse_boot_roots SILENT: no lifespan/startup → [] (honest-empty, byte-identical)")

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

# ── PARSE ROBUSTNESS (review findings 1·6·7·8) — a bad file must NEVER abort the whole regen ──
class _FP:
    def __init__(self, t=None, raw=None): self._t=t; self._raw=raw
    def exists(self): return True
    def read_text(self, errors=None):
        return self._raw.decode("utf-8", errors=errors or "strict") if self._raw is not None else self._t
    def relative_to(self, o): return self
def _repo(t=None, raw=None):
    fp=_FP(t, raw)
    class R:
        def __truediv__(self, rel): return fp
    return R()

# F1 — a non-literal __tablename__ (computed/f-string/prefixed) must not crash parse_models (stays undocumented)
for _tn in ("TBL", 'f"{P}_users"', 'P + "users"'):
    try:
        _r = C.parse_models(_repo(f'class U(Base):\n    __tablename__ = {_tn}\n    id: Mapped[int]\n'), ["m.py"], None)
        check(isinstance(_r, list), f"non-literal __tablename__={_tn} → no crash (%r)" % _r)
    except Exception as _e:
        check(False, f"non-literal __tablename__={_tn} CRASHED: {_e!r}")
check(C.parse_models(_repo('class U(Base):\n    __tablename__ = "users"\n    id: Mapped[int]\n'), ["m.py"], None)[0]["table"] == "users",
      "a literal __tablename__ still resolves")

# F6 — one unparseable file is SKIPPED, not fatal, in every legacy detector
check(C.parse_endpoints(_repo('def f(:\n  pass'), ["a.py"]) == [], "syntax-error endpoint file → [] (skipped)")
check(C.parse_schemas(_repo('class X(:\n'), ["s.py"]) == [], "syntax-error schema file → [] (skipped)")
check(C.parse_models(_repo('class X(:\n'), ["m.py"], None) == [], "syntax-error model file → [] (skipped)")

# F7 — a non-UTF-8 file decodes with replacement, never raises
check(isinstance(C.parse_endpoints(_repo(raw=b'x = "caf\xe9"\n@router.get("/x")\ndef h(): pass'), ["e.py"]), list),
      "non-UTF-8 source → safe read, no crash")

# F8 — a non-string route prefix / path does not TypeError the build
check(all(isinstance(e["path"], str) for e in C.parse_endpoints(_repo('router = APIRouter(prefix=123)\n@router.get("/x")\ndef h(): pass'), ["e.py"])),
      "int APIRouter prefix → no (prefix + sub) TypeError, path stays str")
check(isinstance(C.parse_endpoints(_repo('@router.get(b"/x")\ndef h(): pass'), ["e.py"]), list),
      "bytes route path → no crash")

print(f"orm-access: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY

# ── SCHEMA HOMING (operator ruling 2026-08-27: a schema lives where its CONSUMER lives) ──
# Endpoint consumer → move · nested-only → follow the parent (transitive) · multi-consumer stays
# (ambiguous) · function consumer (returns) → move + a fn wire · unwired + dormant-file tag ·
# honest-empty + deterministic. FIRE and SILENT both exercised; the control case proves the rule
# can NOT move a schema when the consumer evidence is removed (mutation-proven).
python3 - "$GEN" <<'PY'
import sys, copy
gen = sys.argv[1]; sys.path.insert(0, gen)
import _a3_code as C
p = f = 0
def ck(c, m):
    global p, f
    if c: p += 1
    else: f += 1; print("  FAIL:", m)
def fixture():
    return {
      "auth": {"schemas": [{"cls": "SetupReq", "file": "s/setup.py", "fields": [["dietary", "DietIn", ""]]}],
               "endpoints": [{"method": "POST", "path": "/setup", "touches": ["SetupReq"], "touches_x": ["MeOut"], "resp": "MeOut"}]},
      "allergen": {"schemas": [{"cls": "DietIn", "file": "s/prefs.py", "fields": []},
                               {"cls": "ExplIn", "file": "s/prefs.py", "fields": []}], "endpoints": []},
      "progression": {"schemas": [{"cls": "MeOut", "file": "s/resp.py", "fields": [["user", "UserSum", ""]]},
                                  {"cls": "UserSum", "file": "s/resp.py", "fields": []},
                                  {"cls": "Shared", "file": "s/resp.py", "fields": []},
                                  {"cls": "Ghost", "file": "s/ghost.py", "fields": []},
                                  {"cls": "Lane", "file": "s/lane.py", "fields": []}],
                      "endpoints": [{"method": "GET", "path": "/profile", "touches": ["Shared"], "touches_x": [], "resp": ""}]},
      "settings": {"schemas": [], "endpoints": [{"method": "PATCH", "path": "/settings", "touches": [], "touches_x": ["ExplIn", "Shared"], "resp": ""}]},
      "pantry": {"schemas": [], "endpoints": []},
    }
FI = {"svc/lane.py::ingest": {"entity": "pantry", "file": "svc/lane.py", "fn": "ingest", "handler": False,
                              "returns": "Lane", "params": [("cfg", "Ghost")], "ids": set()}}
E = fixture(); st = C.home_schemas(E, FI)
mv = {m["cls"]: m for m in st["moved"]}
ck(set(mv) == {"DietIn", "ExplIn", "MeOut", "UserSum", "Lane", "Ghost"}, "FIRE: exactly the six consumer-homed schemas move (%r)" % sorted(mv))
ck(mv["Ghost"]["to"] == "pantry" and mv["Ghost"]["why"] == "fn-consumed-by:svc/lane.py#ingest", "a claimed function's PARAM annotation (takes) homes a schema too")
ck(mv["ExplIn"]["to"] == "settings" and mv["ExplIn"]["why"] == "consumed-by:PATCH /settings", "an endpoint consumer (touches_x) homes the schema")
ck(mv["MeOut"]["to"] == "auth" and mv["MeOut"]["why"].startswith("consumed-by:POST /setup"), "resp + touches_x resolve to ONE consumer entity")
ck(mv["DietIn"]["to"] == "auth" and mv["DietIn"]["why"] == "nested-in:SetupReq", "a nested-only schema follows its parent")
ck(mv["UserSum"]["to"] == "auth" and mv["UserSum"]["why"] == "nested-in:MeOut", "TRANSITIVE: nested in a schema that itself moved → same home")
ck(mv["Lane"]["to"] == "pantry" and mv["Lane"]["why"] == "fn-consumed-by:svc/lane.py#ingest", "a claimed function's return type homes a schema no route names")
ck([a["cls"] for a in st["ambiguous"]] == ["Shared"] and st["ambiguous"][0]["consumers"] == ["progression", "settings"], "SILENT: a multi-consumer schema stays, reported ambiguous with its consumers")
ck(st["unwired"] == [], "nothing unwired once every shape has a route or function consumer")
ck([(w["cls"], w["rel"]) for w in st["fn_wires"]] == [("Ghost", "takes"), ("Lane", "returns")], "fn wires: returns + takes, sorted (%r)" % st["fn_wires"])
ck([x["cls"] for x in E["allergen"]["schemas"]] == [], "the file home LOSES the moved dicts")
ck([x["cls"] for x in E["auth"]["schemas"]] == ["SetupReq", "DietIn", "MeOut", "UserSum"], "the consumer home GAINS them, appended in class order (untouched order kept)")
ck(E["auth"]["schemas"][1].get("homed_from") == "allergen" and E["auth"]["schemas"][1].get("homed_why") == "nested-in:SetupReq", "provenance stamped on the moved dict")
ck(E["progression"]["schemas"][0]["cls"] == "Shared" and "homed_from" not in E["progression"]["schemas"][0], "a staying schema carries no provenance")
# dormant: unwired in a file NO route reaches; live: unwired in a file some route reaches
E2 = fixture(); st2 = C.home_schemas(E2, {})
u = {x["cls"]: x for x in st2["unwired"]}
ck(set(u) == {"Ghost", "Lane"} and u["Ghost"]["dormant"] is True and u["Lane"]["dormant"] is True, "without function insight, Ghost + Lane are unwired and DORMANT (their files have no endpoint consumer)")
E3 = fixture(); E3["progression"]["endpoints"][0]["touches_x"] = ["Lane"]; st3 = C.home_schemas(E3, {})
u3 = {x["cls"]: x for x in st3["unwired"]}
ck("Lane" not in u3 and u3["Ghost"]["dormant"] is True, "the dormant tag clears for a file the moment a route names any of its classes (Lane consumed → moved)")
E4 = fixture(); E4["progression"]["schemas"].append({"cls": "Live", "file": "s/resp.py", "fields": []}); st4 = C.home_schemas(E4, {})
ck({x["cls"]: x["dormant"] for x in st4["unwired"]}.get("Live") is False, "unwired in a LIVE file (a route consumes a sibling) is NOT dormant")
# CONTROL (mutation-proof): remove the consumer evidence → the schema does not move
E5 = fixture(); E5["auth"]["endpoints"][0]["touches_x"] = []; E5["auth"]["endpoints"][0]["resp"] = ""; st5 = C.home_schemas(E5, {})
ck("MeOut" not in {m["cls"] for m in st5["moved"]} and E5["progression"]["schemas"][0]["cls"] == "MeOut", "CONTROL: no consumer names MeOut → it stays in its file home")
# a schema's OWN validator/helper method never counts as a consumer (gustify: DietaryProfileInput._fold_diet…
# returned its own class and made the schema "ambiguous" between allergen and auth)
E8 = fixture(); st8 = C.home_schemas(E8, {"s/prefs.py::DietIn._fold": {"entity": "allergen", "file": "s/prefs.py", "fn": "DietIn._fold", "method": True, "handler": False, "returns": "DietIn", "params": [], "ids": set()}})
ck({m["cls"]: m["to"] for m in st8["moved"]}.get("DietIn") == "auth" and not [w for w in st8["fn_wires"] if w["cls"] == "DietIn"], "a schema's own method is not a consumer: DietIn still follows its parent, no self wire")
# endpoint consumers OUTRANK function consumers
E6 = fixture(); st6 = C.home_schemas(E6, {"svc/x.py::mk": {"entity": "pantry", "file": "svc/x.py", "fn": "mk", "handler": False, "returns": "ExplIn", "params": [], "ids": set()}})
ck({m["cls"]: m["to"] for m in st6["moved"]}["ExplIn"] == "settings", "a route consumer outranks a function consumer (ExplIn → settings, not pantry)")
# honest-empty + deterministic
ck(C.home_schemas({}, {}) == {"moved": [], "ambiguous": [], "unwired": [], "fn_wires": []}, "honest-empty: no entities → empty stats")
E7 = {"a": {"schemas": [{"cls": "X", "file": "f", "fields": []}], "endpoints": [{"method": "GET", "path": "/x", "touches": ["X"], "touches_x": [], "resp": "X"}]}}
E7c = copy.deepcopy(E7); st7 = C.home_schemas(E7, {})
ck(st7["moved"] == [] and E7 == E7c, "honest-empty: an own-consumed schema moves nothing and the entities dict is untouched")
A, B = fixture(), fixture(); sa, sb = C.home_schemas(A, FI), C.home_schemas(B, FI)
ck(sa == sb and A == B, "deterministic: two runs, identical stats and identical entities")
print(f"schema-homing: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
[ $? -eq 0 ] || exit 1

# ── MODEL CENSUS (operator ruling 2026-08-27: config = ownership, never existence) ──
# A table class in an UNCLAIMED model file, or filtered by an entity's class allowlist,
# is reported (never silently dropped); mixins without __tablename__ never count.
python3 - "$GEN" <<'PY'
import sys, json, tempfile, pathlib
gen = sys.argv[1]; sys.path.insert(0, gen)
import _a3_code as C
p = f = 0
def ck(c, m):
    global p, f
    if c: p += 1
    else: f += 1; print("  FAIL:", m)
root = pathlib.Path(tempfile.mkdtemp())
(root / "app/models").mkdir(parents=True)
(root / "app/models/pantry.py").write_text('class Base: pass\nclass PantryItem(Base):\n    __tablename__ = "pantry_items"\nclass ShelfMixin:\n    x = 1\nclass Location(Base):\n    __tablename__ = "locations"\n')
(root / "app/models/shopping.py").write_text('class ShoppingItem(Base):\n    __tablename__ = "shopping_items"\nclass Draft(Base):\n    __tablename__ = 42\n')
EC = {"pantry": {"models": ["app/models/pantry.py"]}}
EM = {"pantry": ["PantryItem"]}                       # Location filtered by the class allowlist
cen = C.model_census(root, EC, EM)
u = {x["cls"]: x for x in cen.get("unclaimed", [])}
ck(cen.get("claimed") == 1 and cen.get("scanned_dirs") == ["app/models"], "census: claimed count + scanned model dirs (%r)" % cen)
ck("Location" in u and "allowlist" in u["Location"]["reason"], "FIRE: a class the entity's allowlist filtered is reported with its reason")
ck("ShoppingItem" in u and u["ShoppingItem"]["reason"].startswith("file not in any"), "FIRE: a table class in an UNCLAIMED model file is reported")
ck("ShelfMixin" not in u and "Draft" not in u and "Base" not in u, "a mixin / non-string __tablename__ / base never counts (no false positives)")
ck([x["cls"] for x in cen["unclaimed"]] == ["Location", "ShoppingItem"], "deterministic order (file, cls)")
cen2 = C.model_census(root, {"pantry": {"models": ["app/models/pantry.py", "app/models/shopping.py"]}}, {})
ck(cen2["unclaimed"] == [] and cen2["claimed"] >= 3, "SILENT: everything claimed (no class allowlist) → no unclaimed rows (claimed counts every parsed class)")
ck(C.model_census(root, {}, {}) == {}, "honest-empty: no configured model file → {}")
print(f"model-census: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
[ $? -eq 0 ] || exit 1

# ── ROUTE + FILE CENSUS (the model-census ruling widened to routes + backend files, wave A) ──
# A route file the api list omits, or a backend .py no code list names, is REPORTED (never
# silently dropped). Non-empty-only keys: full coverage → {} (no census key at all). Undeclared
# layers are reported so a claim under a layer code_layers never declares is not a silent no-op.
python3 - "$GEN" <<'PY'
import sys, tempfile, pathlib
gen = sys.argv[1]; sys.path.insert(0, gen)
import _a3_code as C
p = f = 0
def ck(c, m):
    global p, f
    if c: p += 1
    else: f += 1; print("  FAIL:", m)
root = pathlib.Path(tempfile.mkdtemp())
(root / "api").mkdir(parents=True); (root / "svc").mkdir(parents=True)
(root / "api/auth.py").write_text("from fastapi import APIRouter\nrouter=APIRouter()\n@router.get('/me')\ndef me():\n    return helper()\n")
(root / "api/equipment.py").write_text("from fastapi import APIRouter\nrouter=APIRouter(prefix='/eq')\n@router.get('/')\ndef ls():\n    return 1\n@router.post('/')\ndef add():\n    return 2\n")
(root / "api/__init__.py").write_text("")                       # a bare package file is never nagged
(root / "api/test_routes.py").write_text("from fastapi import APIRouter\nrouter=APIRouter()\n@router.get('/t')\ndef t():\n    return 1\n")  # a TEST router in an api dir is not a prod route
(root / "svc/ownership.py").write_text("class Foo:\n    __tablename__='foos'\ndef resolve_user():\n    return 1\ndef load_ctx():\n    return 2\n")
(root / "svc/auth_svc.py").write_text("def helper():\n    return 3\n")
(root / "svc/consts.py").write_text("X = 1\nY = 2\n")            # no route/fn/table → not nagged
(root / "svc/test_ownership.py").write_text("def test_it():\n    assert 1\n")  # test_* skipped
EC = {"auth": {"api": ["api/auth.py"], "services": ["svc/auth_svc.py"]}}

# route_census — FIRE: the unclaimed route file, its methods, its reason
rc = C.route_census(root, EC)
ru = {x["file"]: x for x in rc.get("unclaimed", [])}
ck(rc.get("scanned_dirs") == ["api"] and rc.get("claimed") == 1, "route census: scanned api dir + claimed count (%r)" % rc)
ck("api/equipment.py" in ru and ru["api/equipment.py"]["routes"] == 2, "FIRE: an unclaimed route file is reported with its route count")
ck(ru["api/equipment.py"]["methods"] == ["GET", "POST"], "route census carries the sorted methods")
ck("api/auth.py" not in ru and "api/__init__.py" not in ru and "api/test_routes.py" not in ru, "the claimed route file + a bare __init__ + a test_* router never appear (test-route skip)")
ck(C.route_census(root, {"auth": {"api": ["api/auth.py", "api/equipment.py"]}}) == {}, "SILENT: every route file claimed → {} (non-empty-only)")
ck(C.route_census(root, {}) == {}, "honest-empty: no api config → {}")

# file_census — FIRE: unclaimed backend files with route/fn/table counts; noise skipped
fc = C.file_census(root, EC)
fu = {x["file"]: x for x in fc.get("unclaimed", [])}
ck(set(fc.get("scanned_dirs", [])) == {"api", "svc"}, "file census scans every python code dir (%r)" % fc.get("scanned_dirs"))
ck("svc/ownership.py" in fu and fu["svc/ownership.py"]["fns"] == 2 and fu["svc/ownership.py"]["tables"] == 1, "FIRE: unclaimed backend file with fn + table counts")
ck("api/equipment.py" in fu and fu["api/equipment.py"]["routes"] == 2, "the unclaimed route file also appears in the file census with its route count")
ck("svc/consts.py" not in fu and "svc/test_ownership.py" not in fu and "api/test_routes.py" not in fu and "api/__init__.py" not in fu, "a constants/test/bare-init module is never nagged (no route/fn/table, or noise)")
ck([x["file"] for x in fc["unclaimed"]] == sorted(x["file"] for x in fc["unclaimed"]), "deterministic file order")
ck(C.file_census(root, EC) == fc, "deterministic: a second call returns the same census")
ck(C.file_census(root, {}) == {}, "honest-empty: no python code config → {}")

# undeclared_layers — a claim under a layer code_layers never declares is surfaced
ck(C.undeclared_layers({"x": {"api": ["a.py"], "reference": ["r.py"]}}) == [("x", "reference")], "FIRE: a claim under an undeclared layer is reported")
ck(C.undeclared_layers({"x": {"api": ["a.py"], "services": ["s.py"]}}) == [], "SILENT: every claimed layer is declared → []")
print(f"route/file-census: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
[ $? -eq 0 ] || exit 1
