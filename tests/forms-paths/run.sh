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
cat > "$A/services/orders.py" <<'PYF'
class OrderError(Exception):
    pass


def place(x):
    if x == 13:
        raise OrderError
    return x


def settle(session, mode):
    if mode == Mode.REPLAY:
        return "replay"
    if mode == Mode.DONE:
        session.commit()
        return "done"
    session.commit()
    return "fresh"


def label(x):
    if x:
        return "a"
    return "b"


def stream():
    yield 1


def one(x):
    return x


def compute(x):
    if x:
        return 1
    return 2


def reserve(x):
    if x == 13:
        raise OrderError
    if x > 100:
        return "big"
    return "small"


class Mode:
    REPLAY = 1
    DONE = 2
PYF
cat > "$A/config.py" <<'PYF'
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_")

    limit_enabled: bool = False


def get_settings() -> Settings:
    return Settings()
PYF
cat > "$A/api/health.py" <<'PYF'
from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
def healthz():
    return {"ok": True}
PYF
cat > "$A/api/orders.py" <<'PYF'
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from services.orders import OrderError, compute, label, one, place, reserve, settle, stream

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


@router.post("/settle")
def settle_order(x: int):
    status = settle(None, x)
    tag = label(x)
    for _ in stream():
        pass
    one(x)
    return {"status": status, "tag": tag}


@router.get("/safe")
def safe(x: int):
    try:
        return compute(x)
    except Exception:
        return None


@router.post("/made")
def made(x: int):
    return JSONResponse(status_code=201, content={"x": x})


@router.delete("/drop")
def drop(x: int):
    if x:
        return {"dropped": True}


@router.post("/reserve")
def reserve_order(x: int):
    try:
        size = reserve(x)
    except OrderError as exc:
        raise HTTPException(status_code=409, detail="reserve refused") from exc
    return {"size": size}
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
def subset(a, b):
    if isinstance(a, dict):
        return isinstance(b, dict) and all(k in b and subset(v, b[k]) for k, v in a.items())
    if isinstance(a, list):
        return isinstance(b, list) and len(a) == len(b) and all(subset(x, y) for x, y in zip(a, b))
    return type(a) is type(b) and a == b                  # 0 is not False, 200 is not 200.0 — the file would differ
assert subset(off["endpoints"], on["endpoints"]), "an arm changed or removed something the endpoint pass wrote"
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
hot = min(carriers, key=lambda s: len(carriers[s]))
assert len(carriers[glob]) == len(f["endpoints"]) and all(k.split(" ", 1)[1].startswith("/orders") for k in carriers[hot]), carriers
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

py "S3.P1 · FIRE: a deciding callee becomes branches — each arm linked to its return; statuses defined · default · implicit" <<'PY'
f = build(A, "paths")
s = f["endpoints"]["endpoint:POST /orders/settle"]
br = s["branches"]
assert [b["token"] for b in br] == ["REPLAY", "DONE", "fall-through"], [b["token"] for b in br]
assert len(br) == 3 and all(b["call"] == "settle" and b["fn"] == "services/orders.py::settle" and b["why"] == ["commit-differs"] for b in br), br
rets = {r["id"]: r for r in s["returns"]}
assert all(rets[b["return"]]["depth"] == 1 and rets[b["return"]]["site"] == b["site"] and rets[b["return"]]["branch"] == b["id"] for b in br), (br, s["returns"])
assert [rets[b["return"]]["kind"] for b in br] == ["return", "return", "fall-through"], [rets[b["return"]] for b in br]
assert all(re.fullmatch(r"b:[0-9a-f]{10}", b["id"]) for b in br) and all(re.fullmatch(r"r:[0-9a-f]{10}", r["id"]) for r in s["returns"])
top = [r for r in s["returns"] if r["depth"] == 0]
assert top == [dict(top[0], status=200, state="default")] and top[0]["kind"] == "return", top
m = [r for r in f["endpoints"]["endpoint:POST /orders/made"]["returns"] if r["depth"] == 0]
assert [(r["status"], r["state"]) for r in m] == [(201, "defined")], m
d = [r for r in f["endpoints"]["endpoint:DELETE /orders/drop"]["returns"] if r["depth"] == 0]
assert [r["kind"] for r in d] == ["return", "implicit"] and d[0]["pred"] == "x", d
PY

py "S3.P2 · collapsed: a non-deciding callee, a generator and a one-return helper each say why; nothing collapsed rides a deciding site" <<'PY'
f = build(A, "paths")
col = {c["call"]: c["reason"] for c in f["endpoints"]["endpoint:POST /orders/settle"]["collapsed"]}
assert col == {"label": "arms change neither exit nor commit", "stream": "generator: runs after the response line", "one": "one return"}, col
c2 = {c["call"]: c["reason"] for c in f["endpoints"]["endpoint:POST /orders/create"]["collapsed"]}
assert c2 == {"place": "one return"}, c2
assert "branches" not in f["endpoints"]["endpoint:POST /orders/create"]
PY

py "S3.P6 · a return inside a swallowing except is catch-return; the call it swallows is collapsed" <<'PY'
f = build(A, "paths")
s = f["endpoints"]["endpoint:GET /orders/safe"]
assert [(r["kind"], r.get("pred")) for r in s["returns"] if r["depth"] == 0] == [("return", None), ("catch-return", "except Exception")], s["returns"]
assert s["collapsed"] == [{"site": s["collapsed"][0]["site"], "call": "compute", "fn": "services/orders.py::compute", "reason": "swallowed by the caller"}], s["collapsed"]
PY

py "S3.P7 · conditions: when_for_path names the setting; the exempt path reads applies:false; no row is added or dropped" <<'PY'
off, on = build(A, None), build(A, "paths")
for k in off["endpoints"]:
    assert len(on["endpoints"][k]["produced"]) == len(off["endpoints"][k]["produced"]), k
glob = lambda e: [r for r in e["produced"] if r.get("phase") == "middleware" and r.get("scope") == "all"]
h = glob(on["endpoints"]["endpoint:GET /healthz"])
assert len(h) == 1 and h[0]["applies"] is False and "when_for_path" not in h[0], h
c = glob(on["endpoints"]["endpoint:POST /orders/create"])
assert c[0]["when_for_path"] == "settings.limit_enabled" and "applies" not in c[0], c
ck = "middleware/gate.py::Gate: not (not self._enabled or request.url.path in EXEMPT)"
assert list(on["conditions"]) == [ck], list(on["conditions"])
assert [t["kind"] for t in on["conditions"][ck]["terms"]] == ["expr", "in"]
assert on["arms"]["paths"]["stats"]["applies_false"] >= 1 and on["arms"]["paths"]["parts"]["framework"]["present"] is True, on["arms"]["paths"]
PY

py "S3.P3 · contributes-rows: a callee whose raise the handler turns into a refusal decides the path with no commit in it" <<'PY'
s = build(A, "paths")["endpoints"]["endpoint:POST /orders/reserve"]
assert [(b["token"], b["why"]) for b in s.get("branches", [])] == [("x", ["contributes-rows"]), ("fall-through", ["contributes-rows"])], s.get("branches")
PY

py "S3.P8 · returns as sent: a redirect's own 307, a runtime status unknown, a held response, no phantom implicit; one callee at two sites, a commit an except skips, a void helper, a constructor" <<'PY'
import _a3_forms_paths as FP
assert FP._token("match Mode.REPLAY") == "REPLAY" and FP._token("mode == Mode.DONE") == "DONE"
def edit(d):
    (d / "services/shapes.py").write_text("class Shape:\n    pass\n")
    (d / "services/tx.py").write_text('''def guarded(session, x):
    try:
        session.commit()
    except Exception:
        return "failed"
    return "ok"


def ensure(session, x):
    if x:
        return
    session.commit()
''')
    (d / "api/edge.py").write_text('''from fastapi import APIRouter
from fastapi.responses import JSONResponse, RedirectResponse

from services.orders import settle
from services.shapes import Shape
from services.tx import ensure, guarded

router = APIRouter(prefix="/edge")


@router.get("/go", status_code=200)
def go():
    return RedirectResponse("/elsewhere")


@router.get("/dyn")
def dyn(code: int):
    return JSONResponse(status_code=code, content={})


@router.get("/held")
def held():
    resp = RedirectResponse("/x", status_code=302)
    return resp


@router.get("/match")
def pick(x: int):
    match x:
        case 1:
            return {"one": True}
        case _:
            return {"other": True}


@router.get("/loop")
def spin():
    while True:
        return {"spun": True}


@router.post("/twice")
def twice(x: int):
    a = settle(None, x)
    b = settle(None, x)
    s = Shape()
    return {"a": a, "b": b}


@router.post("/tx")
def tx(x: int):
    g = guarded(None, x)
    ensure(None, x)
    return {"g": g}
''')
f = build(variant("edge", edit), "paths")
def top(k):
    return [(r["kind"], r["status"], r["state"]) for r in f["endpoints"][k]["returns"] if r["depth"] == 0]
assert top("endpoint:GET /edge/go") == [("return", 307, "default")], top("endpoint:GET /edge/go")
assert top("endpoint:GET /edge/dyn") == [("return", None, "unknown")], top("endpoint:GET /edge/dyn")
assert top("endpoint:GET /edge/held") == [("return", 302, "defined")], top("endpoint:GET /edge/held")
assert [k for k, _, _ in top("endpoint:GET /edge/match")] == ["return", "return"], top("endpoint:GET /edge/match")
assert [k for k, _, _ in top("endpoint:GET /edge/loop")] == ["return"], top("endpoint:GET /edge/loop")
t = f["endpoints"]["endpoint:POST /edge/twice"]
assert len(t["branches"]) == 6 and len({b["id"] for b in t["branches"]}) == 6 and len({r["id"] for r in t["returns"]}) == len(t["returns"]), (t["branches"], t["returns"])
assert {c["call"]: c["reason"] for c in t["collapsed"]} == {"Shape": "constructor: builds a value"}, t["collapsed"]
x = f["endpoints"]["endpoint:POST /edge/tx"]
assert [(b["call"], b["why"]) for b in x.get("branches", [])] == [("guarded", ["commit-differs"])] * 2, x.get("branches")
assert {c["call"]: c["reason"] for c in x["collapsed"]} == {"ensure": "one return"}, x["collapsed"]
PY

py "S3.P9 · conditions read a local path and route templates; a condition proven true reads applies:true" <<'PY'
def edit(d):
    patch(d, "middleware/gate.py", "        if not self._enabled or request.url.path in EXEMPT:", "        path = request.url.path\n        if path in EXEMPT:")
    patch(d, "middleware/gate.py", 'EXEMPT = frozenset({"/healthz"})', 'EXEMPT = frozenset({"/healthz", "/users/me"})')
    patch(d, "api/users.py", '@router.get("/list")\ndef list_users(page: int):', '@router.get("/{uid}")\ndef list_users(uid: str):')
f = build(variant("cond", edit), "paths")
def glob(k):
    return [r for r in f["endpoints"][k]["produced"] if r.get("phase") == "middleware" and r.get("scope") == "all"]
assert [r.get("applies") for r in glob("endpoint:GET /healthz")] == [False], glob("endpoint:GET /healthz")
assert [r.get("applies") for r in glob("endpoint:GET /people/list")] == [True], glob("endpoint:GET /people/list")
u = glob("endpoint:GET /users/{uid}")
assert [r.get("applies") for r in u] == [None] and u[0]["when_for_path"] == "not path in EXEMPT", u
assert list(f["conditions"]) == ["middleware/gate.py::Gate: not (path in EXEMPT)"], list(f["conditions"])
PY

py "S3.P10 · options are honoured: expand_branches all and none; an exempt_rows form that is not built refuses" <<'PY'
import _a3_forms as F
F.OPTIONS["expand_branches"] = "all"
s = build(A, "paths")["endpoints"]["endpoint:POST /orders/settle"]
assert [b["why"] for b in s["branches"] if b["call"] == "label"] == [["expand_branches: all"]] * 2, s["branches"]
F.OPTIONS["expand_branches"] = "none"
s = build(A, "paths")["endpoints"]["endpoint:POST /orders/settle"]
assert "branches" not in s and {c["call"]: c["reason"] for c in s["collapsed"]}["settle"] == "expand_branches: none", s
F.OPTIONS["expand_branches"], F.OPTIONS["exempt_rows"] = "deciding", "drop"
p = build(A, "paths")["arms"]["paths"]
assert p["parts"]["conditions"]["present"] is False and "exempt_rows 'drop' is not built" in p["parts"]["conditions"]["reason"], p["parts"]
PY

py "S3.P11 · a needed-only arm: the parts that ran say computed in memory, a part not built keeps its own reason" <<'PY'
B.RUNNERS["effects"] = lambda forms, ctx: {}
p = build(A, "effects")["arms"]["paths"]
assert p["reason"] == "switched off — computed in memory for effects" and p["parts"]["returns"]["reason"] == p["reason"], p
assert p["parts"]["paths"]["reason"] == "not built yet (slice 5)", p["parts"]
PY

echo "forms-paths: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
