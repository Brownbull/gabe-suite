#!/usr/bin/env bash
# Forms kinds battery — the KINDS arm (docs/design/element-forms/amendment-1.md §A2 Slice 3 · B-mw · B-dep): the
# middleware forms (stack order, pass-through arms, exits with the endpoint rows' ids, applies_to / exempt) and the
# dependency forms (parameter order, own + inherited exits, commits one call down, teardown, applies_to), with their
# findings `indistinct-exits` and `dependency-commits`. The cases drive the real orchestrator over _a3_paths.build on a
# synthetic FastAPI tree — AST only — and edit the fixture in-test to prove each case can FAIL. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

A="$T/app"
mkdir -p "$A/api" "$A/middleware" "$A/docs/site/center"
printf '{}' > "$A/docs/site/center/center.config.json"
cat > "$A/uv.lock" <<'LOCK'
version = 1

[[package]]
name = "fastapi"
version = "0.136.3"
LOCK
cat > "$A/config.py" <<'PYF'
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_")

    limit_enabled: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
PYF
cat > "$A/main.py" <<'PYF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from middleware.gate import Gate
from middleware.stamp import Stamp

app = FastAPI()
app.add_middleware(Stamp)
app.add_middleware(Gate)
app.add_middleware(CORSMiddleware, allow_origins=["*"])
PYF
cat > "$A/middleware/stamp.py" <<'PYF'
from starlette.middleware.base import BaseHTTPMiddleware


class Stamp(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        return await call_next(request)
PYF
cat > "$A/middleware/gate.py" <<'PYF'
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import Settings, get_settings

EXEMPT = frozenset({"/healthz"})
HOT = ("/orders",)


def over(request):
    return request.headers.get("x-over") == "1"


class Gate(BaseHTTPMiddleware):
    def __init__(self, app, settings: Settings | None = None):
        super().__init__(app)
        s = settings or get_settings()
        self._enabled = s.limit_enabled

    async def dispatch(self, request, call_next):
        if not self._enabled or request.url.path in EXEMPT:
            return await call_next(request)
        if request.url.path.startswith(HOT):
            if over(request):
                return self._throttled()
        if over(request):
            return self._throttled()
        return await call_next(request)

    def _throttled(self):
        return JSONResponse(status_code=429, content={"detail": "slow down"})
PYF
cat > "$A/db.py" <<'PYF'
class Session:
    def commit(self):
        return None


def get_session():
    session = Session()
    yield session
PYF
cat > "$A/auth.py" <<'PYF'
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

from db import get_session

bearer = HTTPBearer(auto_error=True)


class BadToken(Exception):
    pass


def verifier():
    return object()


def persist(token, session):
    if not token:
        raise BadToken
    session.commit()
    return token


def get_auth(session=Depends(get_session), creds=Depends(bearer), check=Depends(verifier)):
    try:
        return persist(creds, session)
    except BadToken as exc:
        raise HTTPException(status_code=401, detail="invalid token") from exc
PYF
cat > "$A/api/orders.py" <<'PYF'
from fastapi import APIRouter, Depends

from auth import get_auth

router = APIRouter(prefix="/orders")


@router.post("/create")
def create(x: int, user=Depends(get_auth)):
    return {"ok": True}
PYF
cat > "$A/api/me.py" <<'PYF'
from fastapi import APIRouter, Depends

from auth import get_auth
from config import get_settings

router = APIRouter(prefix="/me")


@router.get("/profile")
def profile(user=Depends(get_auth), cfg=Depends(get_settings)):
    return {"user": user}
PYF
cat > "$A/api/users.py" <<'PYF'
from fastapi import APIRouter

router = APIRouter(prefix="/users")


@router.get("/list")
def list_users():
    return []
PYF
cat > "$A/api/health.py" <<'PYF'
from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
def healthz():
    return {"ok": True}
PYF

py() {  # py "<name>" <<'PY' … PY  — the prelude gives A · T · build(repo, arms) → forms · variant(name, edit) → repo copy
  local name="$1" src; src=$(cat)
  if (cd "$T" && PYTHONPATH="$GEN" A="$A" T="$T" python3 - >"$T/py.txt" 2>&1 <<PY
import copy, json, os, re, shutil
from pathlib import Path
A, T = Path(os.environ["A"]), Path(os.environ["T"])
import _a3_code as C, _a3_paths as P, _a3_forms_build as B
def build(repo, arms):
    files = sorted(str(p.relative_to(repo)) for p in (repo / "api").glob("*.py"))
    amap = {"head": "abc1234", "entities": {"x": {"endpoints": C.parse_endpoints(repo, files)}},
            "app_middleware": C.parse_app_middleware(repo, {"x": {"api": ["api/*.py"]}})}
    for ep in amap["entities"]["x"]["endpoints"]:
        ep.pop("refs", None)
    if arms is None:
        os.environ.pop("GABE_FORMS_ARMS", None)
    else:
        os.environ["GABE_FORMS_ARMS"] = arms
    return B.extend_backend(P.build(amap, repo), amap, repo, {})
def variant(name, edit):
    d = T / name
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(A, d)
    edit(d)
    return d
def patch(d, rel, a, b):
    p = d / rel
    s = p.read_text()
    assert s.count(a) == 1, (rel, a)
    p.write_text(s.replace(a, b))
$src
PY
  ); then ok; else bad "$name: $(tail -4 "$T/py.txt")"; fi
}

py "C14 · middleware: the stack runs in reverse registration; pass-through arms by kind; exits carry the endpoint ids, applies_to and exempt" <<'PY'
f = build(A, "kinds")
mw = f["middleware"]
assert list(mw) == ["middleware:Stamp", "middleware:Gate", "middleware:CORSMiddleware"], list(mw)
g = mw["middleware:Gate"]
assert g["order"] == {"registered": 1, "runs": 1, "of": 3} and g["outer"] == "middleware:CORSMiddleware" and g["inner"] == "middleware:Stamp", g
assert mw["middleware:CORSMiddleware"]["kind"] == "third-party" and mw["middleware:CORSMiddleware"]["order"]["runs"] == 0
kinds = [(a["kind"], a.get("values"), a.get("expr")) for a in g["pass_through"]]
assert kinds == [("flag", None, "not settings.limit_enabled"), ("exact-paths", ["/healthz"], None)], kinds
by_scope = {("all" if x["scope"] == "all" else "hot"): x for x in g["exits"]}
assert by_scope["hot"]["applies_to"] == 1 and by_scope["hot"]["exempt"] == [], by_scope["hot"]
assert by_scope["all"]["applies_to"] == 3 and by_scope["all"]["exempt"] == ["endpoint:GET /healthz"], by_scope["all"]
rows = {r["site"]: r["id"] for e in f["endpoints"].values() for r in e["produced"] if r.get("phase") == "middleware"}
assert all(x["id"] == rows[x["site"]] for x in g["exits"]) and "on_endpoints" not in json.dumps(g["exits"]), (g["exits"], rows)
parts = f["arms"]["kinds"]["parts"]
assert parts["functions"]["reason"] == "not built yet (slice 8)" and parts["tasks"]["reason"] == "not built yet (slice 8)", parts
PY

py "C14 · FIRE: swapping two registrations swaps outer and inner; dropping the exempt arm widens applies_to by one" <<'PY'
d = variant("swap", lambda d: patch(d, "main.py", "app.add_middleware(Stamp)\napp.add_middleware(Gate)\n", "app.add_middleware(Gate)\napp.add_middleware(Stamp)\n"))
g = build(d, "kinds")["middleware"]["middleware:Gate"]
assert g["order"]["registered"] == 0 and g["outer"] == "middleware:Stamp" and g["inner"] is None, g
d = variant("noexempt", lambda d: patch(d, "middleware/gate.py", "if not self._enabled or request.url.path in EXEMPT:", "if not self._enabled:"))
g = build(d, "kinds")["middleware"]["middleware:Gate"]
glob = next(x for x in g["exits"] if x["scope"] == "all")
assert glob["applies_to"] == 4 and glob["exempt"] == [] and [a["kind"] for a in g["pass_through"]] == ["flag"], (glob, g["pass_through"])
PY

py "C15 · indistinct-exits: FIRE when one builder answers both 429s; SILENT when each says its own" <<'PY'
f = build(A, "kinds")
hits = [x for x in f["arm_findings"]["kinds"] if x["id"] == "indistinct-exits"]
assert len(hits) == 1 and hits[0]["subject"] == "middleware:Gate" and len(hits[0]["sites"]) == 2, hits
assert f["arms"]["kinds"]["stats"]["findings"]["indistinct-exits"] == 1
d = variant("distinct", lambda d: patch(d, "middleware/gate.py", "            if over(request):\n                return self._throttled()\n",
    '            if over(request):\n                return JSONResponse(status_code=429, content={"detail": "slow down, hot path"})\n'))
g = build(d, "kinds")
assert not [x for x in g["arm_findings"].get("kinds", []) if x["id"] == "indistinct-exits"] if "arm_findings" in g else True, g.get("arm_findings")
assert "indistinct-exits" not in g["arms"]["kinds"]["stats"]["findings"]
PY

py "C16 · dependency forms: parameter order, own and inherited exits with ids, a commit one call down, teardown, applies_to" <<'PY'
f = build(A, "kinds")
deps = f["dependencies"]
auth = deps["auth.py::get_auth"]
assert auth["subdeps"] == ["db.py::get_session", "auth.py::bearer", "auth.py::verifier"], "parameter order, not gate-first: " + str(auth["subdeps"])
assert [(x["status"], x.get("detail")) for x in auth["exits"]] == [(401, "invalid token")] and auth["exits"][0]["id"].startswith("x:"), auth["exits"]
assert [(x["phase"], x["status"]) for x in auth["inherited_exits"]] == [("security", 401)], auth["inherited_exits"]
rows = {(r.get("at"), r["status"]): r["id"] for r in f["endpoints"]["endpoint:POST /orders/create"]["produced"]}
assert auth["exits"][0]["id"] == rows[(auth["exits"][0]["at"], 401)] and auth["inherited_exits"][0]["id"] == rows[(auth["inherited_exits"][0]["at"], 401)], (auth, rows)
src = (A / "auth.py").read_text().splitlines()
commit_ln = next(i + 1 for i, l in enumerate(src) if "session.commit()" in l)
call_ln = next(i + 1 for i, l in enumerate(src) if "return persist(" in l)
assert auth["effects"] == [{"op": "commit", "at": f"auth.py:{commit_ln}", "via": f"persist @ auth.py:{call_ln}"}], auth["effects"]
assert auth["applies_to"] == 2 and auth["teardown"] is False and deps["db.py::get_session"]["teardown"] is True, auth
assert deps["auth.py::bearer"]["kind"] == "security" and deps["auth.py::bearer"]["exits"][0]["status"] == 401, deps["auth.py::bearer"]
found = [x for x in f["arm_findings"]["kinds"] if x["id"] == "dependency-commits"]
assert [x["subject"] for x in found] == ["auth.py::get_auth"], found
assert all(deps[k]["applies_to"] == 2 for k in ("auth.py::get_auth", "auth.py::bearer", "db.py::get_session", "auth.py::verifier")), "each dependency runs on both dependent endpoints, transitively: " + str({k: v["applies_to"] for k, v in deps.items()})
assert deps["config.py::get_settings"]["subdeps"] == [] and deps["config.py::get_settings"]["applies_to"] == 1, "a decorator on a dependency is not a dependency: " + str(deps["config.py::get_settings"])
PY

py "C16 · SILENT: a dependency-free endpoint adds nothing; a dependency with no commit carries no finding" <<'PY'
d = variant("nocommit", lambda d: patch(d, "auth.py", "    session.commit()\n", ""))
f = build(d, "kinds")
assert not [x for x in (f.get("arm_findings") or {}).get("kinds", []) if x["id"] == "dependency-commits"], f.get("arm_findings")
assert f["dependencies"]["auth.py::get_auth"]["effects"] == []
def strip_deps(d):
    patch(d, "api/orders.py", "def create(x: int, user=Depends(get_auth)):", "def create(x: int):")
    patch(d, "api/me.py", "def profile(user=Depends(get_auth), cfg=Depends(get_settings)):", "def profile():")
d2 = variant("nodeps", strip_deps)
g = build(d2, "kinds")
assert g["dependencies"] == {}, g["dependencies"]
PY

py "C17 · honest: arms off writes no kinds map; paths needs the middleware stack for its paths part — kinds is computed in memory and stripped" <<'PY'
off = build(A, None)
assert not {"middleware", "dependencies", "arms"} & set(off), sorted(off)
f = build(A, "paths")
assert not {"middleware", "dependencies"} & set(f), sorted(f)
assert f["arms"]["kinds"]["reason"].startswith("switched off — computed in memory for paths") and f["arms"]["paths"]["parts"]["paths"]["present"] is True, (f["arms"]["kinds"], f["arms"]["paths"]["parts"])
PY

py "C18 · pass-through polarity: a negated prefix passes every path but its own; the kinds form and the paths rows agree endpoint by endpoint" <<'PY'
d = variant("neg", lambda d: patch(d, "middleware/gate.py", "if not self._enabled or request.url.path in EXEMPT:",
                                   'if not request.url.path.startswith(HOT) or request.method == "OPTIONS":'))
f = build(d, "kinds,paths")
g = f["middleware"]["middleware:Gate"]
assert [(a["kind"], a.get("values"), a.get("negated")) for a in g["pass_through"]] == [("prefix", ["/orders"], True), ("method", ["OPTIONS"], None)], g["pass_through"]
glob = next(x for x in g["exits"] if x["scope"] == "all")
assert glob["exempt"] == ["endpoint:GET /healthz", "endpoint:GET /me/profile", "endpoint:GET /users/list"] and glob["applies_to"] == 1, glob
rows = {k: r for k, e in f["endpoints"].items() for r in e["produced"] if r.get("id") == glob["id"]}
assert {k for k, r in rows.items() if r.get("applies") is False} == set(glob["exempt"]), ({k: r.get("applies") for k, r in rows.items()}, glob["exempt"])
PY

py "C19 · exits no endpoint carries: a scoped exit matching no route and two helper sites each mint their own id and say on_endpoints:false" <<'PY'
def edit(d):
    patch(d, "middleware/gate.py", 'HOT = ("/orders",)', 'HOT = ("/nowhere",)')
    patch(d, "middleware/gate.py", "def over(request):", 'def too_many():\n    return JSONResponse(status_code=429, content={"detail": "too many"})\n\n\ndef over(request):')
    patch(d, "middleware/gate.py", "        return await call_next(request)\n\n    def _throttled",
          '        if request.headers.get("x-a"):\n            return too_many()\n        if request.url.path.startswith(HOT):\n'
          '            return too_many()\n        return await call_next(request)\n\n    def _throttled')
f = build(variant("off", edit), "kinds")
g = f["middleware"]["middleware:Gate"]
on_eps = {r["id"] for e in f["endpoints"].values() for r in e["produced"]}
assert len({x["id"] for x in g["exits"]}) == len(g["exits"]) == 4, g["exits"]
scoped = next(x for x in g["exits"] if x["scope"] == ["/nowhere"] and not x.get("hop"))
assert scoped.get("on_endpoints") is False and scoped["id"] not in on_eps and scoped["applies_to"] == 0, scoped
helpers = sorted((x for x in g["exits"] if x.get("hop") == "helper too_many"), key=lambda x: x["site"])
assert len(helpers) == 2 and all(x.get("on_endpoints") is False and x["id"] not in on_eps and x.get("when") for x in helpers), helpers
assert [x["scope"] for x in helpers] == ["all", ["/nowhere"]] and helpers[0]["pred"].startswith("request.headers.get"), helpers
assert f["arms"]["kinds"]["stats"]["middleware_exits_off_endpoints"] == 3, f["arms"]["kinds"]["stats"]
PY

py "C20 · a security scheme under an unreadable framework version: its exit carries the endpoint row's id and unknown status" <<'PY'
d = variant("nolock", lambda d: (d / "uv.lock").unlink())
f = build(d, "kinds")
b = f["dependencies"]["auth.py::bearer"]["exits"]
rows = [r for r in f["endpoints"]["endpoint:POST /orders/create"]["produced"] if r.get("phase") == "security"]
assert len(b) == 1 and len(rows) == 1 and b[0]["id"] == rows[0]["id"] and b[0]["status"] is None and b[0]["state"] == "unknown" and "on_endpoints" not in b[0], (b, rows)
PY

py "C21 · dependencies as FastAPI calls them: Depends(Cls) reads __init__, Depends(instance) its class __call__; a commit after yield is teardown and raises no finding" <<'PY'
def edit(d):
    patch(d, "db.py", "    yield session\n", "    yield session\n    session.commit()\n")
    (d / "extras.py").write_text('''from fastapi import Depends, HTTPException

from db import get_session


class Role:
    def __init__(self, name):
        self.name = name

    def __call__(self):
        raise HTTPException(status_code=403, detail="role")


class Pager:
    def __init__(self, page: int = 1, session=Depends(get_session), missing=Depends(nowhere)):
        self.page = page

    def __call__(self):
        raise RuntimeError("never called by FastAPI")


class Audit:
    def __call__(self, session=Depends(get_session)):
        self.record(session)

    def record(self, session):
        session.commit()


audit = Audit()
''')
    patch(d, "api/users.py", "from fastapi import APIRouter\n", "from fastapi import APIRouter, Depends\n\nfrom extras import Pager, Role, audit\n")
    patch(d, "api/users.py", "def list_users():", 'def list_users(p=Depends(Pager), a=Depends(audit), r=Depends(Role("admin"))):')
f = build(variant("deps", edit), "kinds")
deps = f["dependencies"]
ro = deps["extras.py::Role"]
rows = {r["id"] for r in f["endpoints"]["endpoint:GET /users/list"]["produced"]}
assert ro["kind"] == "instance" and ro["calls"] == "extras.py::Role.__call__" and [(x["status"], x["id"] in rows) for x in ro["exits"]] == [(403, True)], ro
pg = deps["extras.py::Pager"]
assert pg["kind"] == "class" and pg["calls"] == "extras.py::Pager.__init__" and pg["escapes"] == [], pg
assert pg["subdeps"] == ["db.py::get_session", {"name": "nowhere", "resolved": False}], pg["subdeps"]
au = deps["extras.py::audit"]
assert au["kind"] == "instance" and au["calls"] == "extras.py::Audit.__call__" and au["subdeps"] == ["db.py::get_session"], au
assert [(x["op"], x["via"].split(" @ ")[0]) for x in au["effects"]] == [("commit", "Audit.record")], au["effects"]
gs = deps["db.py::get_session"]
assert gs["teardown"] is True and [x.get("when") for x in gs["effects"]] == ["teardown"], gs
hits = [x["subject"] for x in f["arm_findings"]["kinds"] if x["id"] == "dependency-commits"]
assert "db.py::get_session" not in hits and "extras.py::audit" in hits, hits
assert f["arms"]["kinds"]["stats"]["dependency_endpoint_pairs"] == sum(v.get("applies_to", 0) for v in deps.values())
PY

py "C22 · reading the stack: a guard past 160 characters and a match case keep their arms; an elif pass-through is its own test; a class registered twice or under an alias is read once, by its class; unscanned registrations are named" <<'PY'
LONG = 'request.url.path in EXEMPT or request.headers.get("x-internal-service-token-for-a-long-guard") == "a-very-long-token-value-that-pushes-the-guard-well-past-the-cap"'
def edit(d):
    patch(d, "middleware/gate.py", "if not self._enabled or request.url.path in EXEMPT:", f"if {LONG}:")
    patch(d, "middleware/stamp.py", "from starlette.middleware.base import BaseHTTPMiddleware\n",
          "from starlette.middleware.base import BaseHTTPMiddleware\nfrom starlette.responses import JSONResponse\n")
    patch(d, "middleware/stamp.py", "        return await call_next(request)\n",
          '        if request.method == "HEAD":\n            return JSONResponse(status_code=405, content={"detail": "no"})\n'
          '        elif request.url.path in ("/healthz",):\n            return await call_next(request)\n'
          '        match request.method:\n            case "OPTIONS":\n                return await call_next(request)\n'
          '        return JSONResponse(status_code=403, content={"detail": "stamped"})\n')
    patch(d, "main.py", "from middleware.gate import Gate\n", "from middleware.gate import Gate as Limiter\n")
    patch(d, "main.py", "app.add_middleware(Gate)\n", "app.add_middleware(Limiter)\n")
    patch(d, "main.py", "app = FastAPI()\n", 'app = FastAPI()\n\n\n@app.middleware("http")\nasync def stamp_header(request, call_next):\n    return await call_next(request)\n\n\n')
    (d / "wire.py").write_text("from middleware.stamp import Stamp\n\n\ndef wire(app):\n    app.add_middleware(Stamp)\n")
assert len(LONG) > 160
f = build(variant("stack", edit), "kinds,paths")
k = f["arms"]["kinds"]
assert k["parts"]["middleware"]["present"] and f["arms"]["paths"]["parts"]["conditions"]["present"], (k, f["arms"]["paths"])
g = f["middleware"]["middleware:Limiter"]
assert [a["kind"] for a in g["pass_through"]] == ["exact-paths", "expr"], g["pass_through"]
rows = {r["id"] for e in f["endpoints"].values() for r in e["produced"]}
glob = next(x for x in g["exits"] if x["scope"] == "all")
assert glob["exempt"] == ["endpoint:GET /healthz"] and all(x["id"] in rows for x in g["exits"]), g["exits"]
st = f["middleware"]["middleware:Stamp"]["variants"]
assert len(st) == 2 and all(v["order"]["basis"].startswith("file-sorted") for v in st), [v["order"] for v in st]
assert all([(a["kind"], a.get("reason")) for a in v["pass_through"]] == [("exact-paths", None), ("expr", "a match case is a pattern, not a condition")] for v in st), [v["pass_through"] for v in st]
assert all(sorted(x["status"] for x in v["exits"]) == [403, 405] for v in st), [v["exits"] for v in st]
assert next(x for x in st[0]["exits"] if x["status"] == 403)["exempt"] == ["endpoint:GET /healthz"], st[0]["exits"]
un = st[0]["order"]["unscanned"]
assert len(un) == 1 and un[0].startswith("main.py:") and un[0].endswith("@app.middleware stamp_header") and k["stats"]["unscanned_registrations"] == 1, (un, k["stats"])
PY

py "C23 · a dependency's form never depends on which endpoint reached it first: a deep chain keeps its tail" <<'PY'
def edit(d):
    (d / "depchain.py").write_text("from fastapi import Depends\n\n\ndef e_dep():\n    return 5\n\n\ndef d_dep(e=Depends(e_dep)):\n    return e\n\n\n"
                                   "def c_dep(d=Depends(d_dep)):\n    return d\n\n\ndef b_dep(c=Depends(c_dep)):\n    return c\n\n\ndef a_dep(b=Depends(b_dep)):\n    return b\n")
    (d / "api/deep.py").write_text('from fastapi import APIRouter, Depends\n\nfrom depchain import a_dep, d_dep\n\nrouter = APIRouter()\n\n\n'
                                   '@router.get("/aaa/deep")\ndef deep(x=Depends(a_dep)):\n    return {}\n\n\n@router.get("/zzz/shallow")\ndef shallow(y=Depends(d_dep)):\n    return {}\n')
deps = build(variant("chain", edit), "kinds")["dependencies"]
assert deps["depchain.py::d_dep"]["subdeps"] == ["depchain.py::e_dep"] and deps["depchain.py::e_dep"]["applies_to"] == 2, {k: (v["subdeps"], v["applies_to"]) for k, v in deps.items() if k.startswith("depchain")}
PY

echo "forms-kinds: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
