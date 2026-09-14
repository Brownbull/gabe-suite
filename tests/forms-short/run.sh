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
def build(repo, arms, schema_files=("schemas.py",)):
    files = sorted(str(p.relative_to(repo)) for p in (repo / "api").glob("*.py"))
    amap = {"head": "abc1234", "entities": {"items": {"endpoints": C.parse_endpoints(repo, files), "schemas": C.parse_schemas(repo, list(schema_files))}},
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

py "SF11 · honest-empty: a schema part that writes its cases and then raises reads present:false and leaves no case on any row" <<'PY'
import _a3_forms_schema as SC
real = SC.schema_part
def boom(*a, **k):
    real(*a, **k)                                  # every row gets its cases first — the restore is what is proven
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

cat > "$T/review_fixture.py" <<'PYF'
def w(d, rel, text):
    p = d / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)


def identity(d):
    p = d / "schemas.py"
    p.write_text(p.read_text() + '''

class Dup(BaseModel):
    a: int


class Quiet(BaseModel):
    note: str | None = None


class Addr(BaseModel):
    street: str


class Two(BaseModel):
    home: Addr
    work: Addr
''')
    w(d, "s2.py", "from pydantic import BaseModel\n\n\nclass Dup(BaseModel):\n    b: int\n")
    w(d, "s3.py", "from pydantic import BaseModel\n\nfrom schemas import Addr\n\n\nclass Dup(BaseModel):\n    inner: Addr\n")
    w(d, "api/dups.py", '''from fastapi import APIRouter

from s2 import Dup
from schemas import Quiet, Two

router = APIRouter(prefix="/dups")


@router.post("/dup2")
def dup2(body: Dup):
    return {}


@router.post("/quiet")
def quiet(body: Quiet):
    return {}


@router.post("/two")
def two(body: Two):
    return {}
''')


def params(d):
    w(d, "api/params.py", '''from enum import Enum
from typing import Annotated, Optional

from fastapi import APIRouter, Body, Depends, Form, Header, Query, UploadFile
from pydantic import BaseModel

from schemas import Loose

router = APIRouter(prefix="/org/{org_id}")


class Color(str, Enum):
    RED = "red"
    BLUE = "blue"


class Filters(BaseModel):
    q: str


@router.get("/p")
def p(org_id: int, color: Color, f: Annotated[Filters, Depends()], req_opt: Optional[str], x_trace_id: str = Header(),
      need: int = Query(default=...), maybe: Optional[str] = Query(...), limit: Annotated[int, Query(ge=1, le=20)] = 10,
      opt: Optional[str] = None):
    return {}


@router.post("/tags")
def tags(org_id: int, tags: list[int]):
    return {}


@router.post("/up")
def up(org_id: int, file: UploadFile):
    return {}


@router.post("/emb")
def emb(org_id: int, item: Loose = Body(embed=True)):
    return {}


@router.post("/name")
def name_form(org_id: int, username: str = Form()):
    return {}
''')


def shapes(d):
    w(d, "base.py", '''from pydantic import BaseModel, field_validator


class Base(BaseModel):
    model_config = {"extra": "forbid"}
    x: int


class Parent(BaseModel):
    p: str = ""

    @field_validator("p")
    @classmethod
    def pv(cls, v):
        if v == "bad":
            raise ValueError("parent says bad")
        return v
''')
    w(d, "schemas2.py", '''from decimal import Decimal
from typing import Annotated, Generic, NewType, TypeVar

from pydantic import BaseModel as PM, ConfigDict, Field, StringConstraints, field_validator
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel

import base as b

T = TypeVar("T")
Name = Annotated[str, Field(min_length=2, max_length=9)]
Code = NewType("Code", str)
STRICT = ConfigDict(extra="forbid")
Line = Annotated[str, Field(max_length=200)]


class Sq(SQLModel):
    title: str = Field(min_length=1)


class Kw(PM, extra="forbid"):
    a: int


class Named(PM):
    model_config = STRICT
    a: int


class Rules(PM):
    nm: Name
    sc: Annotated[str, StringConstraints(min_length=3)]
    tags: Annotated[list[str], Field(default_factory=list)]
    _secret: str
    fl: float = Field(1.0, allow_inf_nan=True)
    items: list[str] = Field(min_items=1)
    odd: int = Field(0, frobnicate=3)
    price: Decimal = Field(max_digits=5, decimal_places=2)
    lines: list[Line]
    scores: dict[str, Annotated[int, Field(ge=0)]]
    first: str = Field(alias="firstName")

    @field_validator("first")
    @classmethod
    def chk(cls, v):
        if v == "x":
            raise ValueError("no x")
        return v


class Camel(PM):
    model_config = ConfigDict(alias_generator=to_camel)
    first_name: str


class Page(PM, Generic[T]):
    items: list[T]
    total: int


class Dotted(b.Base):
    y: int
''')
    w(d, "api/shapes.py", '''from fastapi import APIRouter

from schemas import Loose
from schemas2 import Camel, Dotted, Kw, Named, Page, Rules, Sq

router = APIRouter(prefix="/shapes")


@router.post("/sq")
def sq(body: Sq):
    return {}


@router.post("/kw")
def kw(body: Kw):
    return {}


@router.post("/named")
def named(body: Named):
    return {}


@router.post("/rules")
def rules(body: Rules):
    return {}


@router.post("/camel")
def camel(body: Camel):
    return {}


@router.post("/page")
def page(body: Page[Loose]):
    return {}


@router.post("/dotted")
def dotted(body: Dotted):
    return {}
''')


def validators(d):
    shapes(d)
    w(d, "helpers2.py", '''HELPER_MAX = 10


def check_limit(value, limit=HELPER_MAX):
    if len(value) > limit:
        raise ValueError(f"over {limit}")
    return value


def check_allowed(value, allowed=None):
    if allowed is None:
        return value
    if value not in allowed:
        raise ValueError("not allowed")
    return value


def check_boolop(value, allowed=None):
    if allowed is not None and value not in allowed:
        raise ValueError("not allowed either")
    return value


def check_in(value, allowed):
    if value not in allowed:
        raise ValueError("not in")
    return value


def outer(value):
    return inner(value)


def inner(value):
    if value == "deep":
        raise ValueError("deep")
    return value
''')
    w(d, "vals.py", '''from typing import ClassVar

from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError

from base import Parent
from helpers2 import check_allowed, check_boolop, check_in, check_limit, outer

HELPER_MAX = 99
SCHEMA_ALLOWED = ("s1", "s2")
MSG = "must be valid"
FIELDS = ("f1",)


class MyValueError(ValueError):
    pass


class Base2(BaseModel):
    x: str = ""

    @field_validator("x")
    @classmethod
    def chk(cls, v):
        raise ValueError("base says no")


class V(Base2):
    CODES: ClassVar[tuple] = ("p", "q")
    a: str = ""
    b: str = ""
    c: str = ""
    d: int = 0
    f1: str = ""

    @field_validator("x")
    @classmethod
    def chk(cls, v):
        return v

    @field_validator("a")
    @classmethod
    def va(cls, v):
        try:
            if v == "boom":
                raise ValueError("swallowed")
        except ValueError:
            return v
        check_limit(v)
        check_allowed(v)
        check_boolop(v)
        check_in(v, allowed=SCHEMA_ALLOWED)
        return outer(v)

    @field_validator("b")
    @classmethod
    def vb(cls, v):
        assert v != "no", "no b"
        if v == "sub":
            raise MyValueError("sub error")
        if v == "bare":
            raise ValueError
        if v == "custom":
            raise PydanticCustomError("code_bad", "the code {v} is bad", {"v": "zz"})
        if v == "msg":
            raise ValueError(MSG)
        return cls._helper(v)

    @classmethod
    def _helper(cls, v):
        if v == "helped":
            raise ValueError("helper refuses")
        return v

    @field_validator("c")
    @classmethod
    def vc(cls, v):
        if v not in cls.CODES:
            raise ValueError("unknown code")
        return v

    @field_validator("d")
    @classmethod
    def vd(cls, v):
        if 1 <= v <= 5:
            raise ValueError("in the refused band")
        return v

    @field_validator("*")
    @classmethod
    def star(cls, v):
        if v == "star":
            raise ValueError("star")
        return v

    @field_validator(*FIELDS)
    @classmethod
    def starred(cls, v):
        if v == "starred":
            raise ValueError("starred")
        return v


class Kid(Parent):
    k: int = 0
''')
    w(d, "api/checks.py", '''from fastapi import APIRouter

from vals import Kid, V

router = APIRouter(prefix="/vals")


@router.post("/v")
def v_(body: V):
    return {}


@router.post("/kid")
def kid(body: Kid):
    return {}
''')


def framework(d):
    params(d)
    w(d, "app.py", '''from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI()


@app.exception_handler(RequestValidationError)
async def reshape(request, exc):
    return JSONResponse(status_code=400, content={"detail": "bad request"})
''')
    w(d, "api/deps.py", '''from fastapi import APIRouter, Depends

from schemas import Loose

router = APIRouter(prefix="/deps")


def body_dep(payload: Loose):
    return payload


def require(scope: str):
    def dependency(x: int = 0):
        return x
    return dependency


@router.post("/flat")
def flat(extra: Loose = Depends(body_dep)):
    return {}


@router.get("/factory")
def factory(page: int, dep=Depends(require("admin"))):
    return {}
''')
PYF

py "SF13 · schema identity: three same-named claimed classes are variants and serialise; a handler's class is its own file's; a rule-less body still consumes; one model at two fields keeps two ids" <<'PY'
import sys; sys.path.insert(0, str(T))
from review_fixture import identity
d = variant("identity", identity)
f = build(d, "short", ("schemas.py", "s2.py", "s3.py"))
assert f["arms"]["short"]["present"] is True, f["arms"]["short"]
var = f["schemas"]["schema:Dup"]["variants"]
assert sorted(x["file"] for x in var) == ["s2.py", "s3.py", "schemas.py"] and "_ann" not in json.dumps(var), var
dc = row(f, "endpoint:POST /dups/dup2")["cases"]
assert [(c["loc"], c["type"]) for c in dc if c.get("schema") == "schema:Dup"] == [("body.b", "missing")] and all(c["schema_file"] == "s2.py" for c in dc if c.get("schema") == "schema:Dup"), dc
q = row(f, "endpoint:POST /dups/quiet")
assert q["schemas"] == ["schema:Quiet"] and f["schemas"]["schema:Quiet"]["consumers"] == 1, (q, f["schemas"]["schema:Quiet"])
assert "schema:Quiet" in [x["subject"] for x in f["arm_findings"]["short"] if x["id"] == "extra-ignored"], f["arm_findings"]["short"]
tc = row(f, "endpoint:POST /dups/two")["cases"]
assert {"case:schema:Addr/home.street/missing", "case:schema:Addr/work.street/missing"} <= {c["id"] for c in tc} and len({c["id"] for c in tc}) == len(tc), [c["id"] for c in tc]
PY

py "SF14 · parameters as FastAPI reads them: an Enum is a query, a list a body, an UploadFile a form field; Annotated Query bounds; no missing path; header aliases; required by the default alone; Depends() is no body" <<'PY'
import sys; sys.path.insert(0, str(T))
from review_fixture import params
f = build(variant("params", params), "short,paths")
pc = {(c["loc"], c["type"]) for c in row(f, "endpoint:GET /org/{org_id}/p")["cases"]}
want = {("query.color", "missing"), ("query.color", "enum"), ("query.req_opt", "missing"), ("header.x-trace-id", "missing"),
        ("query.need", "missing"), ("query.maybe", "missing"), ("query.limit", "greater_than_equal"), ("query.limit", "less_than_equal")}
assert pc == want, sorted(pc ^ want)
assert "framework_exits" not in f["endpoints"]["endpoint:GET /org/{org_id}/p"], "a Depends() model read as a body"
assert [(c["loc"], c["type"]) for c in row(f, "endpoint:POST /org/{org_id}/tags")["cases"]] == [("body", "missing")], row(f, "endpoint:POST /org/{org_id}/tags")["cases"]
assert [(c["loc"], c["type"]) for c in row(f, "endpoint:POST /org/{org_id}/up")["cases"]] == [("body.file", "missing")], row(f, "endpoint:POST /org/{org_id}/up")["cases"]
assert [(c["loc"], c["type"]) for c in row(f, "endpoint:POST /org/{org_id}/name")["cases"]] == [("body.username", "missing")]
em = row(f, "endpoint:POST /org/{org_id}/emb")
assert {(c["loc"], c["type"]) for c in em["cases"]} == {("body.item.name", "missing"), ("body.item", "missing")} and em["embed"].startswith("fastapi/"), em
PY

py "SF15 · schema reading: SQLModel, aliased and attribute bases, class-keyword and named extra, Annotated aliases and StringConstraints, defaults inside Annotated, private attributes, v1 and unknown keywords, decimal digits, items, aliases and generators, generics" <<'PY'
import sys; sys.path.insert(0, str(T))
from review_fixture import shapes
f = build(variant("shapes", shapes), "short,paths")
def lt(k):
    return {(c["loc"], c["type"]) for c in row(f, k)["cases"] if c.get("state") != "default"}
assert lt("endpoint:POST /shapes/sq") == {("body.title", "missing"), ("body.title", "string_too_short")} and f["endpoints"]["endpoint:POST /shapes/sq"].get("framework_exits"), lt("endpoint:POST /shapes/sq")
assert ("body", "extra_forbidden") in lt("endpoint:POST /shapes/kw") and ("body", "extra_forbidden") in lt("endpoint:POST /shapes/named")
assert lt("endpoint:POST /shapes/dotted") == {("body", "extra_forbidden"), ("body.x", "missing"), ("body.y", "missing")}, lt("endpoint:POST /shapes/dotted")
r = row(f, "endpoint:POST /shapes/rules")["cases"]
got = {(c["loc"], c["type"], c.get("rule")) for c in r}
for x in [("body.nm", "string_too_short", "min_length=2"), ("body.nm", "string_too_long", "max_length=9"), ("body.sc", "string_too_short", "min_length=3"),
          ("body.items", "too_short", "min_length=1"), ("body.odd", "unknown", "frobnicate=3"), ("body.price", "decimal_whole_digits", "max_digits=5,decimal_places=2"),
          ("body.lines.[]", "string_too_long", "max_length=200"), ("body.scores.{}", "greater_than_equal", "ge=0"), ("body.firstName", "missing", None),
          ("body.firstName", "value_error", None)]:
    assert x in got, (x, sorted(map(str, got)))
assert not [c for c in r if c["loc"] in ("body.tags", "body._secret") or c["type"] == "finite_number"], [c for c in r if c["loc"] in ("body.tags", "body._secret") or c["type"] == "finite_number"]
assert f["arms"]["short"]["stats"]["unknown"] == {"frobnicate": 1}, f["arms"]["short"]["stats"]
assert lt("endpoint:POST /shapes/camel") == {("body.firstName", "missing")}, lt("endpoint:POST /shapes/camel")
assert lt("endpoint:POST /shapes/page") == {("body.items", "missing"), ("body.total", "missing")}, lt("endpoint:POST /shapes/page")
PY

py "SF16 · validator rules: an override replaces the base; a swallowed raise, an early return and an and-guard the call site decides drop; constants read in the right module; assert, subclasses, bare raises, custom errors, class helpers, star fields, class allow-lists, bands; the defining validator; an unread second hop" <<'PY'
import sys; sys.path.insert(0, str(T))
from review_fixture import validators
f = build(variant("vals", validators), "short")
vc = row(f, "endpoint:POST /vals/v")["cases"]
by = {}
for c in vc:
    by.setdefault(c.get("msg"), []).append(c)
assert "base says no" not in by and "swallowed" not in by and "not allowed" not in by and "not allowed either" not in by, sorted(map(str, by))
lim = by["over 10"][0]
assert lim["bound"] == {"limit": 10} and lim["validator"] == "vals.py::V.va", lim
assert by["not in"][0]["allowed"] == {"values": ["s1", "s2"]}, by["not in"][0]
assert [(c["type"], c["loc"]) for c in by["no b"]] == [("assertion_error", "body.b")], by["no b"]
assert [c["type"] for c in by["sub error"]] == ["value_error"] and [c["type"] for c in by["the code zz is bad"]] == ["code_bad"], (by["sub error"], by["the code zz is bad"])
assert [c["loc"] for c in by["must be valid"]] == ["body.b"] and [c["loc"] for c in by["helper refuses"]] == ["body.b"], by
assert any(c["type"] == "value_error" and c.get("msg") is None and c["loc"] == "body.b" for c in vc), "a bare `raise ValueError` minted no case"
assert by["unknown code"][0]["allowed"] == {"values": ["p", "q"]} and (by["in the refused band"][0]["range"], by["in the refused band"][0]["band"]) == ([1, 5], "refused"), (by["unknown code"], by["in the refused band"])
assert sorted(c["loc"] for c in by["star"]) == ["body.a", "body.b", "body.c", "body.d", "body.f1", "body.x"] and [c["loc"] for c in by["starred"]] == ["body.f1"], (by["star"], by["starred"])
va = next(v for v in f["schemas"]["schema:V"]["validators"] if v["name"] == "va")
assert va["unread_calls"] == [next(f"inner @ helpers2.py:{i + 1}" for i, l in enumerate((T / "vals/helpers2.py").read_text().splitlines()) if "return inner(value)" in l)], va
kc = row(f, "endpoint:POST /vals/kid")["cases"]
assert [(c["msg"], c["validator"]) for c in kc if c["type"] == "value_error"] == [("parent says bad", "base.py::Parent.pv")], kc
PY

py "SF17 · framework and dependencies: a form body sends two 400s and no JSON exit; a version below the one read reads unknown; framework ids join the ids audit; a dependency's body is read; a factory's argument is named; an app 422 handler answers; cap and depth markers" <<'PY'
import sys; sys.path.insert(0, str(T))
import _a3_forms_short as SH
from review_fixture import framework
d = variant("fw", framework)
f = build(d, "short,paths")
up = f["endpoints"]["endpoint:POST /org/{org_id}/up"]["framework_exits"]
assert [(x["status"], x["body"], x.get("detail_state")) for x in up] == [(400, "form", "variable"), (400, "form", None)], up
fx = [x for e in f["endpoints"].values() for x in e.get("framework_exits") or []]
assert f["ids"]["framework_x"] == len(fx) and f["ids"]["collisions"] == 0, f["ids"]
fl = row(f, "endpoint:POST /deps/flat")
assert ("body.name", "missing", "body_dep.payload") in {(c["loc"], c["type"], c["param"]) for c in fl["cases"]} and f["endpoints"]["endpoint:POST /deps/flat"].get("framework_exits"), fl
fa = row(f, "endpoint:GET /deps/factory")
assert [u["param"] for u in fa.get("unread", [])] == ["require.scope"] and "factory" in fa["unread"][0]["reason"], fa.get("unread")
assert all(r["answered_by"]["status"] == 400 for e in f["endpoints"].values() for r in e["produced"] if r.get("phase") == "validation"), "the app's RequestValidationError handler is not said"
def old(d2):
    framework(d2)
    (d2 / "uv.lock").write_text('version = 1\n\n[[package]]\nname = "fastapi"\nversion = "0.133.1"\n')
g = build(variant("fw-old", old), "short,paths")
ox = [x for e in g["endpoints"].values() for x in e.get("framework_exits") or []]
assert ox and all(x["state"] == "unknown" and x["status"] is None and "predates" in x["reason"] for x in ox), ox[:2]
SH.OPTIONS["case_cap"], SH.OPTIONS["nest_depth"] = 2, 0
h = build(A, "short")
cr = row(h, "endpoint:POST /items/create")
assert len(cr["cases"]) == 2 and cr["cases_truncated"] > 0 and cr["nest_cut"] == ["body.inner"], {k: cr.get(k) for k in ("cases_truncated", "nest_cut")}
PY

echo "forms-short: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
