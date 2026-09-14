#!/usr/bin/env bash
# Forms short battery — the SHORT arm's schema part and the body-parse framework exits (docs/design/element-forms/
# amendment-1.md §A2 Slice 4 · A6 · critic gap G2): request schemas become `schemas{}`, every validation row gains the 422
# `cases[]` a request can break (pydantic error type · full loc · the rule's line), and a body endpoint gains FastAPI's two
# body-parse `framework_exits[]`. The cases drive the real orchestrator over _a3_paths.build on a synthetic FastAPI tree —
# AST only — and edit the fixture in-test to prove each case can FAIL. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

A="$T/app"
mkdir -p "$A/api" "$A/docs/site/center"
printf '{}' > "$A/docs/site/center/center.config.json"
cat > "$A/uv.lock" <<'LOCK'
version = 1

[[package]]
name = "fastapi"
version = "0.136.3"
LOCK
cat > "$A/consts.py" <<'PYF'
ALLOWED = ("a", "b")
MAX_TAGS = 5
PYF
cat > "$A/schemas.py" <<'PYF'
from pydantic import BaseModel, ConfigDict, Field, field_validator

from consts import ALLOWED, MAX_TAGS


def clean(raw, *, max_items, label, allowed=None):
    out = []
    for item in raw:
        tag = item.strip().lower()
        if not tag:
            raise ValueError(f"{label} contains an empty tag")
        out.append(tag)
    if len(out) > max_items:
        raise ValueError(f"{label} allows at most {max_items} items")
    if allowed is not None:
        unknown = [t for t in out if t not in allowed]
        if unknown:
            raise ValueError(f"unknown {label} code(s) {unknown}")
    return out


class Inner(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tags: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    size: int = 1

    @field_validator("tags")
    @classmethod
    def _tags(cls, value):
        return clean(value, max_items=MAX_TAGS, label="tags", allowed=ALLOWED)

    @field_validator("notes")
    @classmethod
    def _notes(cls, value):
        return clean(value, max_items=3, label="notes")

    @field_validator("size")
    @classmethod
    def _size(cls, value):
        if value not in (1, 2, 4):
            raise ValueError("size must be 1, 2 or 4")
        return value


class CreateItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=40)
    inner: Inner = Field(default_factory=Inner)
    label: str = ""

    @field_validator("label")
    @classmethod
    def _label(cls, value):
        return value.strip()


class Loose(BaseModel):
    name: str
PYF
cat > "$A/api/items.py" <<'PYF'
from fastapi import APIRouter, Query

from schemas import CreateItem, Loose

router = APIRouter(prefix="/items")


@router.post("/create")
def create(body: CreateItem):
    return {"ok": True}


@router.get("/search")
def search(page: int = Query(1, ge=1, le=50), q: str = Query(...)):
    return []


@router.post("/loose")
def loose(payload: Loose):
    return {"ok": True}
PYF

py() {  # py "<name>" <<'PY' … PY  — the prelude gives A · T · build(repo, arms) → forms · variant(name, edit) · patch · row(forms, key)
  local name="$1" src; src=$(cat)
  if (cd "$T" && PYTHONPATH="$GEN" A="$A" T="$T" python3 - >"$T/py.txt" 2>&1 <<PY
import copy, json, os, re, shutil
from pathlib import Path
A, T = Path(os.environ["A"]), Path(os.environ["T"])
import _a3_code as C, _a3_paths as P, _a3_forms_build as B
def build(repo, arms):
    files = sorted(str(p.relative_to(repo)) for p in (repo / "api").glob("*.py"))
    amap = {"head": "abc1234", "entities": {"items": {"endpoints": C.parse_endpoints(repo, files), "schemas": C.parse_schemas(repo, ["schemas.py"])}},
            "app_middleware": []}
    for ep in amap["entities"]["items"]["endpoints"]:
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
def row(forms, key):
    return next(r for r in forms["endpoints"][key]["produced"] if r.get("phase") == "validation")
$src
PY
  ); then ok; else bad "$name: $(tail -4 "$T/py.txt")"; fi
}

py "SF1 · a nested body gives its exact case list: forbid, bounds, a helper's rules with call-site keywords, a constant allow-list" <<'PY'
f = build(A, "short")
r = row(f, "endpoint:POST /items/create")
got = sorted((c["loc"], c["type"], c.get("rule") or json.dumps((c.get("allowed") or {}).get("values")) if c.get("allowed") else c.get("rule") or c.get("msg")) for c in r["cases"] if c.get("state") != "default")
want = sorted([
    ("body", "extra_forbidden", 'extra="forbid"'),
    ("body.name", "missing", None), ("body.name", "string_too_short", "min_length=1"), ("body.name", "string_too_long", "max_length=40"),
    ("body.inner", "extra_forbidden", 'extra="forbid"'),
    ("body.inner.tags", "value_error", "tags contains an empty tag"), ("body.inner.tags", "value_error", "tags allows at most 5 items"),
    ("body.inner.tags", "value_error", '["a", "b"]'),
    ("body.inner.notes", "value_error", "notes contains an empty tag"), ("body.inner.notes", "value_error", "notes allows at most 3 items"),
    ("body.inner.size", "value_error", "[1, 2, 4]"),
], key=str)
assert sorted(got, key=str) == want, "\n".join(map(str, sorted(got, key=str)))
assert [c["loc"] for c in r["cases"] if c.get("state") == "default"] == ["body"], r["cases"]
assert r["schemas"] == ["schema:CreateItem", "schema:Inner"] and r["types"] == "collapsed", (r["schemas"], r.get("types"))
assert all(c["id"].startswith(("case:schema:", "case:framework:")) for c in r["cases"]) and len({c["id"] for c in r["cases"]}) == len(r["cases"])
assert f["schemas"]["schema:CreateItem"]["extra"] == "forbid" and f["schemas"]["schema:CreateItem"]["consumers"] == 1
PY

py "SF1 · SILENT: no extra_forbidden without forbid, no allow-list case when the call site passes none, no case for a normalisation" <<'PY'
f = build(A, "short")
lo = row(f, "endpoint:POST /items/loose")
assert [(c["loc"], c["type"]) for c in lo["cases"] if c.get("state") != "default"] == [("body.name", "missing")], lo["cases"]
cr = row(f, "endpoint:POST /items/create")
assert not [c for c in cr["cases"] if c["loc"] == "body.inner.notes" and c.get("allowed")], "a falsified `allowed is not None` guard kept its rule"
assert not [c for c in cr["cases"] if c["loc"] == "body.label"], "a normalisation-only validator minted a case"
assert [x["subject"] for x in f["arm_findings"]["short"] if x["id"] == "extra-ignored"] == ["schema:Loose"], f["arm_findings"]
PY

py "SF2 · query parameters: Query(ge, le) bounds; missing only where the parameter is required" <<'PY'
f = build(A, "short")
q = row(f, "endpoint:GET /items/search")
got = sorted((c["loc"], c["type"], c.get("rule")) for c in q["cases"])
assert got == [("query.page", "greater_than_equal", "ge=1"), ("query.page", "less_than_equal", "le=50"), ("query.q", "missing", None)], got
PY

py "SF-B · body-parse exits: FIRE on a body endpoint, SILENT on a GET; ids per handler" <<'PY'
f = build(A, "paths")
for key in ("endpoint:POST /items/create", "endpoint:POST /items/loose"):
    fx = f["endpoints"][key].get("framework_exits") or []
    assert [(x["status"], x["phase"], x["source"]) for x in fx] == [(422, "body-parse", "fastapi/routing.py:427"), (400, "body-parse", "fastapi/routing.py:447")], (key, fx)
    assert all(re.fullmatch(r"x:[0-9a-f]{10}", x["id"]) for x in fx)
assert "framework_exits" not in f["endpoints"]["endpoint:GET /items/search"]
ids = [x["id"] for k in ("endpoint:POST /items/create", "endpoint:POST /items/loose") for x in f["endpoints"][k]["framework_exits"]]
assert len(set(ids)) == 4, ids
assert f["arms"]["paths"]["parts"]["framework"]["present"] is True, f["arms"]["paths"]["parts"]
PY

py "SF9 · determinism: two builds of the same tree are byte-identical" <<'PY'
a, b = build(A, "short,paths"), build(A, "short,paths")
assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
PY

py "SF10a · FIRE: dropping extra=forbid removes its case and raises extra-ignored" <<'PY'
d = variant("noforbid", lambda d: patch(d, "schemas.py", '''class CreateItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
''', '''class CreateItem(BaseModel):
'''))
f = build(d, "short")
r = row(f, "endpoint:POST /items/create")
assert not [c for c in r["cases"] if c["loc"] == "body" and c["type"] == "extra_forbidden"], r["cases"]
assert [c for c in r["cases"] if c["loc"] == "body.inner" and c["type"] == "extra_forbidden"], "the nested model's own forbid must stay"
assert "schema:CreateItem" in [x["subject"] for x in f["arm_findings"]["short"] if x["id"] == "extra-ignored"], f["arm_findings"]
PY

py "SF11 · honest-empty: a raising schema part reads present:false and leaves no case on any row" <<'PY'
import _a3_forms_schema as SC
def boom(*a, **k):
    raise RuntimeError("schema down")
SC.schema_part = boom
f = build(A, "short")
assert f["arms"]["short"]["parts"]["schema"] == {"present": False, "reason": "error: RuntimeError: schema down"}, f["arms"]["short"]
assert not any("cases" in r for e in f["endpoints"].values() for r in e["produced"]) and "schemas" not in f, sorted(f)
PY

py "SF12 · no dangling schema: a body model no claim covers is formed through its handler, kept as claimed:false, and every case's schema is in the map" <<'PY'
def edit(d):
    patch(d, "api/items.py", "from fastapi import APIRouter, Query\n", "from fastapi import APIRouter, Query\nfrom pydantic import BaseModel, Field\n")
    patch(d, "api/items.py", '@router.post("/loose")', '''class InlineBody(BaseModel):
    code: str = Field(min_length=2)


@router.post("/inline")
def inline(body: InlineBody):
    return {"ok": True}


@router.post("/loose")''')
f = build(variant("inline", edit), "short")
s = f["schemas"]["schema:InlineBody"]
assert s["claimed"] is False and s["file"] == "api/items.py" and s["consumers"] == 1, s
assert all("claimed" not in v for k, v in f["schemas"].items() if k != "schema:InlineBody"), "a claimed schema gained a marker"
refs = {c["schema"] for e in f["endpoints"].values() for r in e["produced"] for c in r.get("cases") or [] if c.get("schema")}
assert "schema:InlineBody" in refs and refs <= set(f["schemas"]), sorted(refs - set(f["schemas"]))
assert f["arms"]["short"]["stats"]["schemas_unclaimed"] == 1, f["arms"]["short"]["stats"]
PY

echo "forms-short: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
