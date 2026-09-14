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
assert kinds == [("flag", None, "settings.limit_enabled"), ("exact-paths", ["/healthz"], None)], kinds
by_scope = {("all" if x["scope"] == "all" else "hot"): x for x in g["exits"]}
assert by_scope["hot"]["applies_to"] == 1 and by_scope["hot"]["exempt"] == [], by_scope["hot"]
assert by_scope["all"]["applies_to"] == 3 and by_scope["all"]["exempt"] == ["endpoint:GET /healthz"], by_scope["all"]
rows = {r["site"]: r["id"] for e in f["endpoints"].values() for r in e["produced"] if r.get("phase") == "middleware"}
assert all(x["id"] == rows[x["site"]] for x in g["exits"]) and "on_endpoints" not in json.dumps(g["exits"]), (g["exits"], rows)
parts = f["arms"]["kinds"]["parts"]
assert parts["functions"]["reason"] == "needs effects" and parts["tasks"]["reason"] == "not built yet (slice 8)", parts
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

py "C17 · honest: arms off writes no kinds map; kinds only NEEDED by paths is computed and stripped" <<'PY'
off = build(A, None)
assert not {"middleware", "dependencies", "arms"} & set(off), sorted(off)
f = build(A, "paths")
assert not {"middleware", "dependencies"} & set(f), sorted(f)
assert f["arms"]["kinds"]["reason"].startswith("switched off — computed in memory for paths"), f["arms"]["kinds"]
PY

echo "forms-kinds: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
