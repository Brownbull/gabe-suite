#!/usr/bin/env bash
# Forms paths battery — what the generation ARMS write into forms.json, slice by slice (docs/design/element-forms/
# amendment-1.md §A2). Slice 2 · ids: once any arm is selected, every produced exit carries an `x:` id and every
# precondition a `g:` id plus the `exit` it guards; with no arm selected nothing changes. The cases drive the real
# orchestrator (_a3_forms_build.extend_backend) over _a3_paths.build output on a synthetic FastAPI tree — AST only.
# Each case is shown to FIRE and to stay SILENT. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

A="$T/app"
mkdir -p "$A/api" "$A/services" "$A/middleware" "$A/docs/site/center"
printf '{}' > "$A/docs/site/center/center.config.json"
cat > "$A/uv.lock" <<'LOCK'
version = 1

[[package]]
name = "fastapi"
version = "0.136.3"
LOCK
cat > "$A/main.py" <<'PYF'
from fastapi import FastAPI

from middleware.gate import Gate

app = FastAPI()
app.add_middleware(Gate)
PYF
cat > "$A/middleware/gate.py" <<'PYF'
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

HOT = ("/orders",)


def over(request):
    return request.headers.get("x-over") == "1"


class Gate(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.url.path.startswith(HOT):
            if over(request):
                return self._throttled()
        if over(request):
            return self._throttled()
        return await call_next(request)

    def _throttled(self):
        return JSONResponse(status_code=429, content={"detail": "slow down"})
PYF
cat > "$A/services/orders.py" <<'PYF'
class OrderError(Exception):
    pass


def place(x):
    if x == 13:
        raise OrderError
    return x
PYF
cat > "$A/api/orders.py" <<'PYF'
from fastapi import APIRouter, HTTPException

from services.orders import OrderError, place

router = APIRouter(prefix="/orders")


@router.post("/create")
def create(x: int):
    if x < 0:
        raise HTTPException(status_code=400, detail="negative")
    if x < 0:
        raise HTTPException(status_code=400, detail="still negative")
    try:
        place(x)
    except OrderError as exc:
        raise HTTPException(status_code=409, detail="order refused") from exc
    return {"ok": True}
PYF
cat > "$A/api/users.py" <<'PYF'
from fastapi import APIRouter

router = APIRouter(prefix="/users")


@router.get("/list")
def list_users(page: int):
    return []
PYF
cat > "$A/api/people.py" <<'PYF'
from fastapi import APIRouter

router = APIRouter(prefix="/people")


@router.get("/list")
def list_people(page: int):
    return []
PYF

py() {  # py "<name>" <<'PY' … PY  — the prelude gives A · T · GEN · build(repo, arms) → forms · rows(forms) · strip(endpoints)
  local name="$1" src; src=$(cat)
  if (cd "$T" && PYTHONPATH="$GEN" A="$A" T="$T" GEN="$GEN" python3 - >"$T/py.txt" 2>&1 <<PY
import copy, json, os, re, shutil, sys
from pathlib import Path
A, T, GEN = (Path(os.environ[k]) for k in ("A", "T", "GEN"))
import _a3_code as C, _a3_paths as P, _a3_forms_build as B, _a3_forms_ids as I
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
def rows(forms, kind="produced"):
    for key, e in forms["endpoints"].items():
        for vi, v in enumerate(e.get("variants") or [e]):
            for r in v.get(kind) or []:
                yield key, vi, r
def strip(endpoints):
    endpoints = copy.deepcopy(endpoints)
    for e in endpoints.values():
        for v in e.get("variants") or [e]:
            for r in (v.get("produced") or []) + (v.get("preconditions") or []):
                for k in ("id", "exit", "exits"):
                    r.pop(k, None)
    return endpoints
$src
PY
  ); then ok; else bad "$name: $(tail -4 "$T/py.txt")"; fi
}

py "S2.1 · SILENT: with no arm selected no row carries an id and there is no ids block" <<'PY'
f = build(A, None)
assert f["present"] and "ids" not in f and "arms" not in f, sorted(f)
assert not any(k in r for _, _, r in list(rows(f)) + list(rows(f, "preconditions")) for k in ("id", "exit", "exits")), "an id rode on an arms-off build"
g = build(A, "none")
assert g == f, "GABE_FORMS_ARMS=none is arms off"
PY

py "S2.2 · FIRE: any arm on → every exit an x: id, every precondition a g: id; nothing else moves" <<'PY'
off, on = build(A, None), build(A, "paths")
xs = [r for _, _, r in rows(on)]
gs = [r for _, _, r in rows(on, "preconditions")]
assert xs and gs and all(re.fullmatch(r"x:[0-9a-f]{10}", r["id"]) for r in xs) and all(re.fullmatch(r"g:[0-9a-f]{10}", r["id"]) for r in gs), (xs, gs)
assert on["ids"] == {"present": True, "reason": None, "x": len(xs), "g": len(gs), "linked": on["ids"]["linked"],
                     "ambiguous": 0, "unlinked": on["ids"]["unlinked"], "collisions": 0}, on["ids"]
assert on["ids"]["linked"] + on["ids"]["unlinked"] == len(gs)
assert strip(on["endpoints"]) == off["endpoints"], "ids moved something besides the id keys"
PY

py "S2.3 · FIRE: the global 429 — filtered per endpoint by path prefix — carries ONE id on every endpoint; the sensitive 429 another" <<'PY'
f = build(A, "paths")
by_site = {}
carriers = {}
for key, _, r in rows(f):
    if r.get("phase") == "middleware":
        by_site.setdefault(r["site"], set()).add(r["id"])
        carriers.setdefault(r["site"], set()).add(key)
assert len(by_site) == 2 and all(len(v) == 1 for v in by_site.values()), by_site
glob = max(carriers, key=lambda s: len(carriers[s]))
assert len(carriers[glob]) == len(f["endpoints"]) and len(carriers[min(carriers, key=lambda s: len(carriers[s]))]) == 1, carriers
assert len(set().union(*by_site.values())) == 2, "one id names two exits"
PY

py "S2.4 · SILENT on sharing: a handler-owned default (422 · 500) gets a different id on every handler" <<'PY'
f = build(A, "paths")
for phase in ("validation", "uncaught"):
    ids = {}
    for key, _, r in rows(f):
        if r.get("phase") == phase:
            ids.setdefault(r["id"], set()).add(key)
    assert ids and all(len(keys) == 1 for keys in ids.values()), (phase, ids)
PY

py "S2.5 · FIRE: a precondition links to the exit it guards — in the handler and one call down; identical guards stay two" <<'PY'
f = build(A, "paths")
e = f["endpoints"]["endpoint:POST /orders/create"]
by_id = {r["id"]: r for r in e["produced"]}
guards = [g for g in e["preconditions"] if g.get("pred") == "x < 0"]
assert len(guards) == 2 and guards[0]["id"] != guards[1]["id"], guards
assert sorted(by_id[g["exit"]]["detail"] for g in guards) == ["negative", "still negative"], [by_id.get(g["exit"]) for g in guards]
assert all(by_id[g["exit"]]["at"] == g["at"] for g in guards)
deep = [g for g in e["preconditions"] if g.get("depth") == 1]
assert deep and by_id[deep[0]["exit"]]["status"] == 409 and by_id[deep[0]["exit"]]["raised_at"] == deep[0]["at"], (deep, e["produced"])
PY

py "S2.6 · ids survive a line move and follow a reworded detail — x: moves, g: does not" <<'PY'
def ids(repo):
    f = build(repo, "paths")
    return ({r["id"]: r.get("detail") for _, _, r in rows(f)}, {r["id"] for _, _, r in rows(f, "preconditions")})
base_x, base_g = ids(A)
def variant(name, edit):
    d = T / name
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(A, d)
    edit(d)
    return ids(d)
def prepend(d):
    for rel in ("api/orders.py", "services/orders.py", "middleware/gate.py", "api/users.py"):
        p = d / rel
        p.write_text("\n" * 7 + p.read_text())
dx, dg = variant("drift", prepend)
assert set(dx) == set(base_x) and dg == base_g, "a line move changed an id"
def reword(d):
    p = d / "api/orders.py"
    p.write_text(p.read_text().replace('"order refused"', '"order declined"'))
rx, rg = variant("reword", reword)
assert len(set(base_x) - set(rx)) == 1 and len(set(rx) - set(base_x)) == 1 and rg == base_g, (base_x, rx)
PY

py "S2.7 · two handlers on one method and path: each variant's rows carry their own ids" <<'PY'
d = T / "variants"
shutil.rmtree(d, ignore_errors=True)
shutil.copytree(A, d)
(d / "api/people.py").write_text((d / "api/people.py").read_text().replace('prefix="/people"', 'prefix="/users"'))
f = build(d, "paths")
e = f["endpoints"].get("endpoint:GET /users/list") or {}
assert len(e.get("variants") or []) == 2, sorted(f["endpoints"])
v422 = [next(r["id"] for r in v["produced"] if r.get("phase") == "validation") for v in e["variants"]]
assert len(set(v422)) == 2 and all(r.get("id") for v in e["variants"] for r in v["produced"]), v422
assert f["ids"]["collisions"] == 0
PY

py "S2.8 · honest-empty: ids that fail write no id, say why, and never cost the arms" <<'PY'
def boom(*a, **k):
    raise RuntimeError("ids down")
I.g_ids = boom
f = build(A, "paths")
assert f["ids"] == {"present": False, "reason": "error: RuntimeError: ids down"}, f["ids"]
assert "arms" in f and "arms_error" not in f, sorted(f)
assert not any("id" in r for _, _, r in rows(f)), "a half-written id set reached the feed"
PY

echo "forms-paths: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
