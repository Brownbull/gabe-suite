"""Element forms — the ENDPOINT pass: what a FastAPI endpoint DECIDES.

The map already records what an endpoint REACHES (tables, commits, callers). This pass reads what it
decides, from source, deterministically:
  · K1 status contract — what the decorator declares vs every exit the code can produce
  · U7 refusal reasons — each refusal's status, its detail, and whether it carries a stable code
  · U3 preconditions   — the guards whose branch ends in a refusal
The slots, framework rules and findings are DATA in `_a3_forms.py`; this module is the walker.

How it reads (docs/design/element-forms/plan.md §3.2):
  1 the handler is found again from the archmap endpoint (file · fn · method)
  2 a body is walked statement by statement with three stacks — guards (if/else/loop/match), try
    blocks, and `after` (earlier sibling ifs whose body always exits)
  3 each raise is classified: an HTTP exception (status + detail form), a class, or a bare re-raise
  4 catch resolution climbs the try stack: pass-through · translate · rethrow-as · swallow
  5 ONE call level: a resolved callee's escaping exits are re-caught at the call site
  6 the dependency chain (≤4): a function dependency is walked like a callee; a security class and a
    validated parameter yield the framework's `default` rows, version-gated by the lock file
  7 app middleware exits attach by path prefix (a helper returning `path.startswith(CONST)` is inlined)

Honest floors, said in the rows: a raise two levels down is never a row (it surfaces as an
`unknown_causes` entry on the 500, or as an `unverified` translation); a dynamic status is `unknown`;
library exceptions are never walked. Never raises — a failure returns {present: False, reason}.
"""
from __future__ import annotations

import ast
import re
from http import HTTPStatus
from pathlib import Path

import _a3_code as _C
import _a3_forms as F
from _a3_stacks_pydi import _ann_name

_STATUS_RX = re.compile(F.STATUS_NAME_RX)
_ROUTE_METHODS = ("get", "post", "put", "patch", "delete")
_TRY = (ast.Try,) + ((ast.TryStar,) if hasattr(ast, "TryStar") else ())
_DEP_MAX = 4
_PRED_CAP = 160
_MODS: dict[tuple[str, str], "_Mod | None"] = {}
_EVENTS: dict[int, list] = {}
_LOCKS: dict[str, tuple | None] = {}
_VER_RX = {
    "uv.lock": re.compile(r'^name = "fastapi"\s*\nversion = "([^"]+)"', re.M),
    "poetry.lock": re.compile(r'^name = "fastapi"\s*\nversion = "([^"]+)"', re.M),
    "requirements.txt": re.compile(r"^fastapi(?:\[[^\]]*\])?==([\w.]+)", re.M | re.I),
}


def reset_caches() -> None:
    _MODS.clear()
    _EVENTS.clear()
    _LOCKS.clear()


# ── per-file tables ──────────────────────────────────────────────────────────────────────────────────
def _leaf(e) -> str | None:
    if isinstance(e, ast.Call):
        e = e.func
    if isinstance(e, ast.Subscript):
        e = e.value
    return e.id if isinstance(e, ast.Name) else e.attr if isinstance(e, ast.Attribute) else None


def _unp(e, cap: int = F.DETAIL_CAP) -> str:
    try:
        return ast.unparse(e)[:cap]
    except Exception:  # noqa: BLE001
        return "?"


def _literal(v):
    if isinstance(v, ast.Constant) and isinstance(v.value, (int, str)) and not isinstance(v.value, bool):
        return v.value
    if isinstance(v, ast.Call) and _leaf(v.func) in ("frozenset", "set", "tuple") and len(v.args) == 1:
        v = v.args[0]
    if isinstance(v, (ast.Tuple, ast.List, ast.Set)) and v.elts and all(
            isinstance(x, ast.Constant) and isinstance(x.value, str) for x in v.elts):
        return tuple(x.value for x in v.elts)
    return None


class _Mod:
    """One parsed file: imports, defs (`fn`, `Class.method`), classes, module assignments, constants."""

    def __init__(self, rel: str, tree: ast.Module, repo: Path) -> None:
        self.rel, self.tree = rel, tree
        self.imports: dict[str, tuple] = {}
        self.defs: dict[str, ast.AST] = {}
        self.classes: dict[str, ast.ClassDef] = {}
        self.assigns: dict[str, ast.AST] = {}
        self.consts: dict[str, object] = {}
        for node in tree.body:
            if isinstance(node, ast.ImportFrom):
                mf = _C._resolve_module(repo, rel, node.module, node.level)
                for a in node.names:
                    if a.name != "*":
                        self.imports[a.asname or a.name] = (mf, a.name)
            elif isinstance(node, ast.Import):
                for a in node.names:
                    self.imports[a.asname or a.name.split(".")[0]] = (_C._resolve_module(repo, rel, a.name, 0), None)
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self.defs[node.name] = node
            elif isinstance(node, ast.ClassDef):
                self.classes[node.name] = node
                for it in node.body:
                    if isinstance(it, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        self.defs[f"{node.name}.{it.name}"] = it
            elif isinstance(node, (ast.Assign, ast.AnnAssign)) and node.value is not None:
                for t in (node.targets if isinstance(node, ast.Assign) else [node.target]):
                    if isinstance(t, ast.Name):
                        self.assigns[t.id] = node.value
                        lit = _literal(node.value)
                        if lit is not None:
                            self.consts[t.id] = lit


def _mod(repo: Path, rel: str | None) -> _Mod | None:
    if not rel:
        return None
    key = (str(repo), rel)
    if key not in _MODS:
        tree, _ = _C._safe_parse(repo / rel)
        _MODS[key] = _Mod(rel, tree, repo) if tree is not None else None
    return _MODS[key]


def _resolve(repo: Path, m: _Mod | None, name: str | None, hops: int = 2):
    """A name in module ``m`` → (module, qual) of the repo def/class/assignment it names, or None."""
    if m is None or not name:
        return None
    if name in m.defs or name in m.classes or name in m.assigns:
        return m, name
    imp = m.imports.get(name)
    if imp and imp[0] and imp[1] and hops:
        return _resolve(repo, _mod(repo, imp[0]), imp[1], hops - 1)
    return None


def _bases(repo: Path, m: _Mod | None, cls: str) -> set[str]:
    """A class's base names, two hops (``class Busy(DomainError)`` · ``class DomainError(Exception)``)."""
    out: set[str] = set()
    r = _resolve(repo, m, cls)
    if not r or r[1] not in r[0].classes:
        return out
    for b in r[0].classes[r[1]].bases:
        bn = _leaf(b)
        if bn:
            out.add(bn)
            r2 = _resolve(repo, r[0], bn)
            if r2 and r2[1] in r2[0].classes:
                out |= {x for x in (_leaf(bb) for bb in r2[0].classes[r2[1]].bases) if x}
    return out


# ── statuses and details ─────────────────────────────────────────────────────────────────────────────
def _status(expr, m: _Mod) -> int | None:
    if isinstance(expr, ast.Constant) and isinstance(expr.value, int) and not isinstance(expr.value, bool):
        return expr.value
    nm = expr.id if isinstance(expr, ast.Name) else expr.attr if isinstance(expr, ast.Attribute) else None
    if nm:
        hit = _STATUS_RX.match(nm)
        if hit:
            return int(hit.group(1))
        if isinstance(expr, ast.Name) and isinstance(m.consts.get(nm), int):
            return m.consts[nm]
    return None


def _detail(expr, m: _Mod, repo: Path, status: int | None) -> dict:
    """{form, detail[, code]} — text · object · enum · const · dynamic · expr · default-phrase."""
    if expr is None:
        try:
            phrase = HTTPStatus(status).phrase if status else None
        except ValueError:
            phrase = None
        return {"form": "default-phrase", "detail": phrase}
    if isinstance(expr, ast.Constant) and isinstance(expr.value, str):
        return {"form": "text", "detail": expr.value[:F.DETAIL_CAP]}
    if isinstance(expr, ast.Dict):
        for k, v in zip(expr.keys, expr.values):
            if isinstance(k, ast.Constant) and k.value in F.CODE_KEYS and isinstance(v, ast.Constant):
                return {"form": "object", "detail": _unp(expr), "code": str(v.value)}
        return {"form": "object", "detail": _unp(expr)}
    if isinstance(expr, ast.Attribute) and isinstance(expr.value, ast.Name) and (
            _bases(repo, m, expr.value.id) & F.ENUM_BASES):
        return {"form": "enum", "detail": _unp(expr), "code": _unp(expr)}
    if isinstance(expr, ast.Call):
        kw = next((k for k in expr.keywords if k.arg in F.CODE_KEYS), None)
        if kw is not None:
            return {"form": "object", "detail": _unp(expr), "code": _unp(kw.value)}
    if isinstance(expr, ast.Name) and isinstance(m.consts.get(expr.id), str):
        return {"form": "const", "detail": str(m.consts[expr.id])[:F.DETAIL_CAP]}
    if isinstance(expr, (ast.JoinedStr, ast.BinOp, ast.Name, ast.Call, ast.Attribute, ast.Subscript)):
        return {"form": "dynamic", "detail": _unp(expr)}
    return {"form": "expr", "detail": _unp(expr)}


def _http_parts(exc):
    """(status expr, detail expr) of ``HTTPException(...)``, or None."""
    if not isinstance(exc, ast.Call) or _leaf(exc.func) not in F.HTTP_EXCEPTIONS:
        return None
    st = exc.args[0] if exc.args else None
    det = exc.args[1] if len(exc.args) > 1 else None
    for kw in exc.keywords:
        if kw.arg == "status_code":
            st = kw.value
        elif kw.arg == "detail":
            det = kw.value
    return st, det


def _response_exit(val, m: _Mod, repo: Path) -> dict | None:
    """``return JSONResponse(status_code=4xx|5xx, content=…)`` → an exit, or None."""
    if not (isinstance(val, ast.Call) and _leaf(val.func) in F.RESPONSE_CLASSES):
        return None
    st = None
    for kw in val.keywords:
        if kw.arg == "status_code":
            st = _status(kw.value, m)
    if st is None and len(val.args) > 1:
        st = _status(val.args[1], m)
    if not st or st < 400:
        return None
    content = next((kw.value for kw in val.keywords if kw.arg == "content"), val.args[0] if val.args else None)
    return {"status": st, "state": "defined", **_detail(content, m, repo, st)}


def _http_subclass(repo: Path, m: _Mod, cls: str) -> dict | None:
    """A project class whose bases reach an HTTP exception → its refusal row (status from ``super().__init__(status_code=…)``
    or a ``status_code = …`` class attribute; unknown when neither is literal), else None."""
    r = _resolve(repo, m, cls)
    if not r or r[1] not in r[0].classes or not (_bases(repo, r[0], r[1]) & F.HTTP_EXCEPTIONS):
        return None
    node, cm = r[0].classes[r[1]], r[0]
    status = None
    for it in node.body:
        if isinstance(it, (ast.Assign, ast.AnnAssign)) and any(
                getattr(t, "id", None) == "status_code" for t in (it.targets if isinstance(it, ast.Assign) else [it.target])):
            status = _status(it.value, cm) if it.value is not None else None
        if isinstance(it, (ast.FunctionDef, ast.AsyncFunctionDef)) and it.name == "__init__":
            for c in ast.walk(it):
                if isinstance(c, ast.Call) and _leaf(c.func) == "__init__":
                    st = next((k.value for k in c.keywords if k.arg == "status_code"), c.args[0] if c.args else None)
                    status = _status(st, cm) if st is not None else status
    row = {"status": status, "state": "defined" if status else "unknown", "form": "dynamic", "detail": f"{cls}(…)"}
    if status is None:
        row["reason"] = f"HTTPException subclass {cls}: status set at runtime"
    return row


# ── the statement walker ─────────────────────────────────────────────────────────────────────────────
def _exits(stmts) -> bool:
    return any(isinstance(s, (ast.Raise, ast.Return)) for s in stmts)


def _calls(node, ctx: dict, out: list) -> None:
    for n in ast.walk(node):
        if isinstance(n, ast.Call):
            out.append({**ctx, "kind": "call", "node": n, "line": n.lineno})


def _walk(stmts, guards: tuple, after: tuple, tries: tuple, handler, loop: bool, out: list) -> None:
    after_l = list(after)
    for st in stmts:
        ctx = {"guards": guards, "after": tuple(after_l), "tries": tries, "handler": handler, "loop": loop}
        if isinstance(st, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            continue
        if isinstance(st, ast.If):
            _calls(st.test, ctx, out)
            t = _unp(st.test, _PRED_CAP)
            _walk(st.body, guards + ((t, st.lineno),), tuple(after_l), tries, handler, loop, out)
            if st.orelse:
                _walk(st.orelse, guards + ((f"not ({t})", st.lineno),), tuple(after_l), tries, handler, loop, out)
            elif _exits(st.body):
                after_l.append(f"not ({t})")
        elif isinstance(st, (ast.For, ast.AsyncFor, ast.While)):
            _calls(st.test if isinstance(st, ast.While) else st.iter, ctx, out)
            _walk(st.body, guards, tuple(after_l), tries, handler, True, out)
            _walk(st.orelse, guards, tuple(after_l), tries, handler, loop, out)
        elif isinstance(st, (ast.With, ast.AsyncWith)):
            for it in st.items:
                _calls(it.context_expr, ctx, out)
            _walk(st.body, guards, tuple(after_l), tries, handler, loop, out)
        elif isinstance(st, _TRY):
            _walk(st.body, guards, tuple(after_l), tries + (st,), handler, loop, out)
            for h in st.handlers:
                _walk(h.body, guards, tuple(after_l), tries, (st, h), loop, out)
            _walk(st.orelse, guards, tuple(after_l), tries, handler, loop, out)
            _walk(st.finalbody, guards, tuple(after_l), tries, handler, loop, out)
        elif isinstance(st, ast.Match):
            _calls(st.subject, ctx, out)
            for case in st.cases:
                _walk(case.body, guards + ((f"match {_unp(case.pattern, _PRED_CAP)}", st.lineno),),
                      tuple(after_l), tries, handler, loop, out)
        elif isinstance(st, ast.Raise):
            out.append({**ctx, "kind": "raise", "node": st, "line": st.lineno})
            if isinstance(st.exc, ast.Call):
                for a in list(st.exc.args) + [k.value for k in st.exc.keywords]:
                    _calls(a, ctx, out)
        elif isinstance(st, ast.Return):
            if st.value is not None:
                out.append({**ctx, "kind": "return", "node": st, "line": st.lineno})
                _calls(st.value, ctx, out)
        else:
            _calls(st, ctx, out)


def _events(fn) -> list:
    k = id(fn)
    if k not in _EVENTS:
        out: list = []
        _walk(fn.body, (), (), (), None, False, out)
        _EVENTS[k] = out
    return _EVENTS[k]


def _handler_types(h) -> set[str] | None:
    if h.type is None:
        return None                                          # a bare `except:` catches everything
    els = h.type.elts if isinstance(h.type, ast.Tuple) else [h.type]
    return {x for x in (_leaf(e) for e in els) if x}


def _is_reraise(exc, h) -> bool:
    return exc is None or (h is not None and h.name and isinstance(exc, ast.Name) and exc.id == h.name)


def _climb(cls: str, cls_bases: set[str], tries: tuple, hev: dict) -> tuple:
    """Where an exception raised under ``tries`` goes: escape · swallow · translate · rethrow."""
    for t in reversed(tries):
        for h in t.handlers:
            types = _handler_types(h)
            if types is not None and not (types & ({cls, "Exception", "BaseException"} | cls_bases)):
                continue
            raises = [e for e in hev.get(id(h), []) if e["kind"] == "raise"]
            if any(_http_parts(e["node"].exc) for e in raises):
                return "translate", h
            if any(_is_reraise(e["node"].exc, h) for e in raises):
                break                                        # pass-through: the next try out decides
            if raises:
                return "rethrow", h
            return "swallow", h
    return "escape", None


def _where(e: dict) -> dict:
    w: dict = {}
    if e["guards"]:
        w["pred"] = " and ".join(g for g, _ in e["guards"])
        w["_guard_line"] = e["guards"][-1][1]
    if e["after"]:
        w["after"] = list(e["after"])
    if e["loop"]:
        w["in_loop"] = True
    return w


def _analyse(repo: Path, m: _Mod, fn) -> dict:
    """One function's own exits: http rows, escaping classes, pass-through re-raises, calls."""
    evs = _events(fn)
    hev: dict[int, list] = {}
    for e in evs:
        if e["handler"] is not None:
            hev.setdefault(id(e["handler"][1]), []).append(e)
    rows, escapes, passthrough, swallowed, calls = [], [], [], [], []
    for e in evs:
        at = f"{m.rel}:{e['line']}"
        if e["kind"] == "call":
            calls.append(e)
            continue
        if e["kind"] == "return":
            ex = _response_exit(e["node"].value, m, repo)
            if ex:
                rows.append({**ex, "at": at, **_where(e)})
            continue
        exc, h = e["node"].exc, (e["handler"][1] if e["handler"] else None)
        if _is_reraise(exc, h):
            if h is not None:
                passthrough.append(at)
            continue
        hp = _http_parts(exc)
        if hp:
            st = _status(hp[0], m) if hp[0] is not None else None
            row = {"status": st, "state": "defined" if st else "unknown", **_detail(hp[1], m, repo, st),
                   "at": at, **_where(e)}
            if st is None:
                row["reason"] = "dynamic status: " + (_unp(hp[0]) if hp[0] is not None else "none")
            if _climb("HTTPException", {"Exception"}, e["tries"], hev)[0] == "swallow":
                swallowed.append(at)
                continue
            if h is not None:
                row["via"] = "except " + " | ".join(sorted(_handler_types(h) or {"*"}))
                row["source"] = "unverified"
                row["_handler"] = id(h)
            rows.append(row)
            continue
        cls = _leaf(exc)
        if not cls or not cls[:1].isupper():                 # `raise size_error` — a variable, not a class: nothing to classify
            continue
        sub = _http_subclass(repo, m, cls)
        if sub is not None:                                  # `class AuthError(HTTPException)` — a refusal, never an escape
            row = {**sub, "at": at, "via": f"raise {cls}", **_where(e)}
            if _climb("HTTPException", {"Exception"}, e["tries"], hev)[0] == "swallow":
                swallowed.append(at)
            else:
                rows.append(row)
            continue
        msg = (exc.args[0].value if isinstance(exc, ast.Call) and exc.args and isinstance(exc.args[0], ast.Constant)
               and isinstance(exc.args[0].value, str) else None)
        where, hid = _climb(cls, _bases(repo, m, cls), e["tries"], hev)
        ex = {"cls": cls, "at": at, **({"msg": msg} if msg else {}), **_where(e)}
        if where == "escape":
            escapes.append(ex)
        elif where == "translate":
            ex["_translated_by"] = id(hid)
            escapes.append(ex)                               # re-caught below by the same function's handler rows
    local = [x for x in escapes if "_translated_by" in x]
    for x in local:                                          # a translation proven inside the same function
        for r in rows:
            if r.get("_handler") == x["_translated_by"]:
                r["source"], r["raised_at"] = "verified", x["at"]
    return {"rows": rows, "escapes": [x for x in escapes if "_translated_by" not in x],
            "passthrough": passthrough, "swallowed": swallowed, "calls": calls, "hev": hev}


# ── one call level ───────────────────────────────────────────────────────────────────────────────────
def _param_ann(fn, name: str):
    a = fn.args
    for p in list(a.posonlyargs) + list(a.args) + list(a.kwonlyargs):
        if p.arg == name:
            return p.annotation
    return None


def _class_of(repo: Path, m: _Mod, ann):
    """An annotation → (module, ClassName) of a project class, through an `Annotated` alias too."""
    cname = _ann_name(ann)
    r = _resolve(repo, m, cname)
    if r and r[1] in r[0].assigns:                           # `ctx: CurrentCtx` where CurrentCtx = Annotated[Ctx, …]
        r = _resolve(repo, r[0], _ann_name(r[0].assigns[r[1]]))
    return r if r and r[1] in r[0].classes else None


def _callee(repo: Path, m: _Mod, fn, call):
    f = call.func
    if isinstance(f, ast.Name):
        r = _resolve(repo, m, f.id)
        return r if r and r[1] in r[0].defs else None
    if isinstance(f, ast.Attribute) and isinstance(f.value, ast.Name):
        ann = _param_ann(fn, f.value.id)
        if ann is not None:
            r = _class_of(repo, m, ann)
            if r and f"{r[1]}.{f.attr}" in r[0].defs:
                return r[0], f"{r[1]}.{f.attr}"
        imp = m.imports.get(f.value.id)
        if imp and imp[0] and imp[1] is None:
            tm = _mod(repo, imp[0])
            if tm and f.attr in tm.defs:
                return tm, f.attr
    return None


def _copy(row: dict, **extra) -> dict:
    out = {k: (list(v) if isinstance(v, list) else v) for k, v in row.items()}
    out.update(extra)
    return out


# ── dependencies ─────────────────────────────────────────────────────────────────────────────────────
def _vt(v: str) -> tuple:
    return tuple(int(x) for x in re.findall(r"\d+", v)[:3])


def _framework(repo: Path, rel: str) -> tuple | None:
    """(version, lock file) of the framework from the nearest lock file above ``rel``."""
    d = (repo / rel).parent
    start = str(d)
    if start in _LOCKS:
        return _LOCKS[start]
    found = None
    while found is None:
        for lf in F.LOCK_FILES:
            p = d / lf
            if p.is_file():
                try:
                    hit = _VER_RX[lf].search(p.read_text(encoding="utf-8", errors="replace"))
                except OSError:
                    hit = None
                if hit:
                    found = (hit.group(1), str(p.relative_to(repo)))
                    break
        if found or d == repo or repo not in d.parents:
            break
        d = d.parent
    _LOCKS[start] = found
    return found


def _is_depends(d) -> bool:
    return isinstance(d, ast.Call) and _leaf(d.func) in F.DEPENDS


def _validated_params(fn, aliases: dict) -> list[str]:
    """Parameters FastAPI validates (every one not injected or depended on) — each can answer 422."""
    a = fn.args
    pos = list(a.posonlyargs) + list(a.args)
    dflt = dict(zip([p.arg for p in pos[len(pos) - len(a.defaults):]], a.defaults))
    dflt.update({p.arg: d for p, d in zip(a.kwonlyargs, a.kw_defaults) if d is not None})
    out = []
    for p in pos + list(a.kwonlyargs):
        if p.arg in ("self", "cls") or _is_depends(dflt.get(p.arg)):
            continue
        ann = p.annotation
        if ann is not None and (_C._annotated_depends(ann) or (isinstance(ann, ast.Name) and ann.id in (aliases or {}))):
            continue
        base = ann
        if isinstance(base, ast.Subscript) and _leaf(base.value) == "Annotated":
            sl = base.slice
            base = sl.elts[0] if isinstance(sl, ast.Tuple) and sl.elts else sl
        if _leaf(base) in F.INJECTED_TYPES:
            continue
        out.append(p.arg)
    return out


def _dep_target(repo: Path, m: _Mod, expr: str, decl: str | None):
    try:
        node = ast.parse(expr, mode="eval").body
    except SyntaxError:
        return None
    if isinstance(node, ast.Call):
        node = node.func
    if isinstance(node, ast.Name):
        return _resolve(repo, m, node.id) or (decl and _resolve(repo, _mod(repo, decl), node.id)) or None
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
        imp = m.imports.get(node.value.id)
        if imp and imp[0] and imp[1] is None:
            return _resolve(repo, _mod(repo, imp[0]), node.attr)
    return None


def _security_row(rm: _Mod, qual: str, val, fw) -> dict | None:
    """The refusal a security scheme answers while ``auto_error`` is on (None when it is off), its status gated by the
    framework version the rule was read on."""
    rule = F.SECURITY_CLASSES[_leaf(val.func)]
    if any(k.arg == rule["auto_error_kw"] and isinstance(k.value, ast.Constant) and k.value.value is False
           for k in val.keywords):
        return None
    row = {"phase": "security", "status": rule["status"], "form": "default-phrase",
           "detail": rule["detail"], "at": f"{rm.rel}:{val.lineno}", "via": f"{_leaf(val.func)} {qual}",
           "source": rule["source"]}
    if fw and _vt(fw[0]) >= _vt(rule["min_version"]):
        row["state"] = "default"
    else:
        row["state"], row["status"] = "unknown", None
        row["reason"] = ("framework version unreadable" if not fw
                         else f"fastapi {fw[0]} predates the verified {rule['min_version']}")
    return row


def _dep_node(repo: Path, rm: _Mod, qual: str, called: bool = False):
    """What FastAPI CALLS for the dependency ``qual`` → ``(module, node | None, qual of the node, kind)``: a function; a
    class's ``__init__`` (``Depends(Cls)`` constructs it — its parameters are the sub-dependencies); an instance's class
    ``__call__`` (``Depends(obj)``, or ``Depends(Cls(…))`` — ``called``). None when ``qual`` is none of these."""
    if qual in rm.defs:
        return rm, rm.defs[qual], qual, "function"
    if qual in rm.classes and called:
        return rm, rm.defs.get(f"{qual}.__call__"), f"{qual}.__call__", "instance"
    if qual in rm.classes:
        return rm, rm.defs.get(f"{qual}.__init__"), f"{qual}.__init__", "class"
    val = rm.assigns.get(qual)
    if isinstance(val, ast.Call) and isinstance(val.func, ast.Name):
        r = _resolve(repo, rm, val.func.id)
        if r and r[1] in r[0].classes:
            return r[0], r[0].defs.get(f"{r[1]}.__call__"), f"{r[1]}.__call__", "instance"
    return None


def _deps(repo: Path, m: _Mod, fn, dec, depth: int, seen: set, acc: dict) -> None:
    aliases = _C._dep_aliases(repo, m.rel, m.tree)
    if depth:
        acc["validated"] += [f"{fn.name}.{p}" for p in _validated_params(fn, aliases)]
    if depth >= _DEP_MAX:
        return
    for d in _C._endpoint_middleware(fn, dec, aliases, _C._dep_alias_meta(m.rel)):
        r = _dep_target(repo, m, d.get("callee") or d["name"], d.get("_decl"))
        if not r:
            continue
        rm, qual = r
        key = (rm.rel, qual)
        if key in seen:
            continue
        seen.add(key)
        val = rm.assigns.get(qual)
        if isinstance(val, ast.Call) and _leaf(val.func) in F.SECURITY_CLASSES:
            row = _security_row(rm, qual, val, acc["framework"])
            if row is not None:
                acc["rows"].append(row)
            continue
        got = _dep_node(repo, rm, qual, called=str(d["name"]).rstrip().endswith(")"))
        if got is None or got[1] is None:
            continue
        nm, node = got[0], got[1]
        A = _analyse(repo, nm, node)
        for row in A["rows"]:
            acc["rows"].append(_copy(row, phase="dependency", dep=f"{rm.rel}::{qual}", depth=1))
        acc["escapes"] += [_copy(x, via=f"dependency {qual}") for x in A["escapes"]]
        acc["unknown_causes"] += [f"pass-through raise {p}" for p in A["passthrough"]]
        acc["swallowed"] += A["swallowed"]
        _deps(repo, nm, node, None, depth + 1, seen, acc)


# ── middleware ───────────────────────────────────────────────────────────────────────────────────────
def _path_prefixes(pred: str, m: _Mod, repo: Path):
    try:
        node = ast.parse(pred, mode="eval").body
    except SyntaxError:
        return None
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        r = _resolve(repo, m, node.func.id)
        if r and r[1] in r[0].defs:
            body = [s for s in r[0].defs[r[1]].body
                    if not (isinstance(s, ast.Expr) and isinstance(s.value, ast.Constant))]
            if len(body) == 1 and isinstance(body[0], ast.Return):
                node, m = body[0].value, r[0]
    if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
            and node.func.attr == "startswith" and node.args):
        a = node.args[0]
        v = m.consts.get(a.id) if isinstance(a, ast.Name) else _literal(a)
        if isinstance(v, str):
            return (v,)
        if isinstance(v, tuple):
            return v
    return None


def _middleware_exits(repo: Path, amap: dict, stats: dict) -> list[dict]:
    out: list[dict] = []
    for mw in amap.get("app_middleware") or []:
        m = _mod(repo, mw.get("file"))
        r = _resolve(repo, m, mw.get("cls"))
        if not r or r[1] not in r[0].classes:
            spec = F.THIRD_PARTY_MIDDLEWARE.get(mw.get("cls"))
            if spec is None:
                stats["unknown_middleware"].append(mw.get("cls"))
            elif spec.get("status"):
                out.append({"phase": "middleware", "status": spec["status"], "state": "default", "form": "text",
                            "detail": spec["detail"], "at": f"{mw.get('file')}:{mw.get('line')}", "via": mw["cls"]})
            continue
        cm, cname = r
        meth = next((cm.defs[f"{cname}.{x}"] for x in F.MIDDLEWARE_METHODS if f"{cname}.{x}" in cm.defs), None)
        if meth is None:
            continue
        exempt: list[tuple[int, str]] = []
        for e in _events(meth):
            if e["kind"] != "return":
                continue
            val = e["node"].value
            val = val.value if isinstance(val, ast.Await) else val
            if isinstance(val, ast.Call) and _leaf(val.func) == "call_next":
                if e["guards"]:
                    exempt.append((e["line"], "not (" + " and ".join(g for g, _ in e["guards"]) + ")"))
                continue
            ex, at_line = _response_exit(val, cm, repo), e["line"]
            if ex is None and isinstance(val, ast.Call) and isinstance(val.func, ast.Attribute) and \
                    isinstance(val.func.value, ast.Name) and val.func.value.id == "self" and \
                    f"{cname}.{val.func.attr}" in cm.defs:
                for e2 in _events(cm.defs[f"{cname}.{val.func.attr}"]):
                    if e2["kind"] == "return":
                        ex = _response_exit(e2["node"].value, cm, repo)
                        if ex:
                            at_line = e2["line"]
                            break
            if not ex:
                continue
            scope, preds = None, []
            for g, _ in e["guards"]:
                px = _path_prefixes(g, cm, repo)
                if px:
                    scope = sorted(px)
                else:
                    preds.append(g)
            row = {**ex, "phase": "middleware", "at": f"{cm.rel}:{at_line}", "site": f"{cm.rel}:{e['line']}",
                   "via": cname, "scope": scope or "all"}
            if preds:
                row["pred"] = " and ".join(preds)
            when = [w for ln, w in exempt if ln < e["line"]]
            if when:
                row["when"] = " and ".join(when)
            out.append(row)
    return out


# ── app exception handlers ───────────────────────────────────────────────────────────────────────────
def _app_handlers(repo: Path, files: list[str]) -> dict[str, dict]:
    """{ExceptionClass: exit} from ``@app.exception_handler(Cls)`` and ``app.add_exception_handler(Cls, fn)``
    in the files beside and one level above the route files — where ``main.py`` lives."""
    cands: set = set()
    for f in files:                                          # beside and above the routes (gustify's main.py) …
        p = (repo / f).parent
        for d in (p, p.parent):
            if d.is_dir() and (d == repo or repo in d.parents):
                cands.update(d.glob("*.py"))
    for top in sorted({Path(f).parts[0] for f in files if len(Path(f).parts) > 1}):   # … and anywhere under their top dir
        root = repo / top                                    # that NAMES an exception handler (onyx registers them in a factory)
        if root.is_dir():
            for py in root.rglob("*.py"):
                if not any(k in str(py) for k in _C._MOUNT_SKIP):
                    src = _C._safe_read(py)
                    if src and "exception_handler" in src:
                        cands.add(py)
    out: dict[str, dict] = {}
    for py in sorted(cands, key=str):
        if True:
            m = _mod(repo, str(py.relative_to(repo)))
            if m is None:
                continue
            pairs = []
            for node in ast.walk(m.tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    for dec in node.decorator_list:
                        if isinstance(dec, ast.Call) and _leaf(dec.func) == "exception_handler" and dec.args:
                            pairs.append((_leaf(dec.args[0]), m, node))
                elif isinstance(node, ast.Call) and _leaf(node.func) == "add_exception_handler" and len(node.args) > 1:
                    r = _resolve(repo, m, _leaf(node.args[1]))
                    if r and r[1] in r[0].defs:
                        pairs.append((_leaf(node.args[0]), r[0], r[0].defs[r[1]]))
            for cls, hm, fnode in pairs:
                if not cls or cls in F.HTTP_EXCEPTIONS or cls in out or _STATUS_RX.match(cls):
                    continue                                 # `add_exception_handler(status.HTTP_404_NOT_FOUND, …)` keys a STATUS, not a class
                answer = None
                for e in _events(fnode):
                    if e["kind"] != "return":
                        continue
                    val, vm, vline = e["node"].value, hm, e["line"]
                    if isinstance(val, ast.Call) and _leaf(val.func) not in F.RESPONSE_CLASSES:
                        r = _resolve(repo, hm, _leaf(val.func))      # `return to_json_response(exc)` — ONE helper hop (onyx)
                        if r and r[1] in r[0].defs:
                            for e2 in _events(r[0].defs[r[1]]):
                                if e2["kind"] == "return" and isinstance(e2["node"].value, ast.Call) \
                                        and _leaf(e2["node"].value.func) in F.RESPONSE_CLASSES:
                                    val, vm, vline = e2["node"].value, r[0], e2["line"]
                                    break
                    ex = _response_exit(val, vm, repo)
                    if ex:
                        out[cls] = {**ex, "at": f"{vm.rel}:{vline}"}
                        break
                    if isinstance(val, ast.Call) and _leaf(val.func) in F.RESPONSE_CLASSES:
                        answer = answer or {"line": vline, "rel": vm.rel}
                if cls not in out and answer is not None:    # the handler answers, with a status set at runtime (`exc.status_code`)
                    out[cls] = {"status": None, "state": "unknown", "form": "dynamic", "detail": f"{cls} handler",
                                "reason": f"app handler for {cls}: status set at runtime", "at": f"{answer['rel']}:{answer['line']}"}
    return out


# ── one endpoint ─────────────────────────────────────────────────────────────────────────────────────
def _find_handler(m: _Mod, ep: dict):
    hits = []
    for node in ast.walk(m.tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == ep.get("fn"):
            for dec in node.decorator_list:
                if (isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute)
                        and dec.func.attr in _ROUTE_METHODS and dec.func.attr.upper() == ep.get("method")):
                    sub = dec.args[0].value if dec.args and isinstance(dec.args[0], ast.Constant) else ""
                    hits.append((0 if str(ep.get("path", "")).endswith(str(sub)) else 1, dec.lineno, node, dec))
    hits.sort(key=lambda h: (h[0], h[1]))
    return (hits[0][2], hits[0][3]) if hits else (None, None)


def _full_path(repo: Path, m: _Mod, dec, files: list[str]) -> str:
    rv = dec.func.value
    sub = dec.args[0].value if dec.args and isinstance(dec.args[0], ast.Constant) and isinstance(dec.args[0].value, str) else ""
    pre, mount = "", ""
    if isinstance(rv, ast.Name):
        val = m.assigns.get(rv.id)
        if isinstance(val, ast.Call) and _leaf(val.func) == "APIRouter":
            for kw in val.keywords:
                if kw.arg == "prefix" and isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, str):
                    pre = kw.value.value
        mount = _C._mounts_for(repo, files)["mount"].get((m.rel, rv.id), "")
    return mount + pre + sub


def _declared(dec, fn, m: _Mod, ep: dict) -> dict:
    success, resp, refusals = None, None, []
    for kw in dec.keywords:
        if kw.arg == "status_code":
            success = _status(kw.value, m)
        elif kw.arg == "response_model":
            resp = _unp(kw.value)
        elif kw.arg == "responses" and isinstance(kw.value, ast.Dict):
            for k in kw.value.keys:
                s = _status(k, m) if k is not None else None
                if s is None and isinstance(k, ast.Constant) and str(k.value).isdigit():
                    s = int(k.value)
                if s:
                    refusals.append(s)
    if resp:
        rm = {"name": resp, "state": "defined"}
    elif ep.get("stream"):
        rm = {"state": "n/a"}
    elif fn.returns is not None:
        rm = {"name": _unp(fn.returns), "state": "default"}
    else:
        rm = {"state": "missing"}
    return {"success": {"status": success or 200, "state": "defined" if success else "default"},
            "response_model": rm, "refusals": sorted(set(refusals))}


def _row_key(r: dict) -> tuple:
    f, _, ln = str(r.get("at", "")).rpartition(":")
    return (F.PHASES.get(r.get("phase"), 9), r.get("status") or 999, f, int(ln) if ln.isdigit() else 0,
            str(r.get("detail") or ""))


def _form(repo: Path, amap: dict, slug: str, ep: dict, mwx: list, files: list, flags_lines: set, stats: dict,
          apph: dict) -> dict:
    head = {"entity": slug, "handler": f"{ep['file']}::{ep['fn']}", "levels_id": f"{ep['file']}#{ep['fn']}",
            "method": ep["method"], "path": ep["path"], "file": ep["file"]}
    m = _mod(repo, ep["file"])
    fn, dec = _find_handler(m, ep) if m else (None, None)
    if fn is None:
        stats["unformed"] += 1
        return {**head, "state": "unknown", "reason": "handler file unparseable" if m is None else "handler not found"}
    full = _full_path(repo, m, dec, files)
    produced: list[dict] = []
    for x in mwx:                                            # 1 · app middleware, by path prefix
        if x["scope"] == "all" or any(full.startswith(p) for p in x["scope"]):
            produced.append(_copy(x))
    acc = {"rows": [], "escapes": [], "unknown_causes": [], "validated": [], "swallowed": [],
           "framework": _framework(repo, ep["file"])}
    _deps(repo, m, fn, dec, 0, set(), acc)                   # 2 · the dependency chain
    produced += acc["rows"]
    aliases = _C._dep_aliases(repo, m.rel, m.tree)
    val = _validated_params(fn, aliases) + acc["validated"]
    if val:                                                  # 3 · validation
        produced.append({"phase": "validation", "status": F.VALIDATION["status"], "state": "default",
                         "form": F.VALIDATION["form"], "code": F.VALIDATION["code"], "params": sorted(set(val)),
                         "source": F.VALIDATION["source"]})
    H = _analyse(repo, m, fn)                                # 4 · the handler body …
    hrows = [_copy(r, phase="handler", depth=0) for r in H["rows"]]
    by_handler = {r.get("_handler"): [] for r in hrows if r.get("_handler")}
    for r in hrows:
        if r.get("_handler"):
            by_handler[r["_handler"]].append(r)
    escapes = list(acc["escapes"]) + [_copy(x) for x in H["escapes"]]
    unknown_causes = list(acc["unknown_causes"]) + [f"pass-through raise {p}" for p in H["passthrough"]]
    swallowed = list(acc["swallowed"]) + list(H["swallowed"])
    reason_lost, guard_rows = [], []
    for ce in H["calls"]:                                    # … and ONE call level
        r = _callee(repo, m, fn, ce["node"])
        if not r:
            f = ce["node"].func
            if isinstance(f, ast.Name) and (m.imports.get(f.id) or (None,))[0]:
                stats["unresolved_calls"] += 1
            continue
        cm, qual = r
        CA = _analyse(repo, cm, cm.defs[qual])
        via = f"call {qual} @ {m.rel}:{ce['line']}"
        for row in CA["rows"]:
            if _climb("HTTPException", {"Exception"}, ce["tries"], H["hev"])[0] == "swallow":
                swallowed.append(row["at"])
                continue
            hrows.append(_copy(row, phase="handler", depth=1, via=via))
        for ex in CA["escapes"]:
            where, h = _climb(ex["cls"], _bases(repo, cm, ex["cls"]), ce["tries"], H["hev"])
            if where == "translate":
                for hr in by_handler.get(id(h), []):
                    hr["source"], hr["raised_at"] = "verified", ex["at"]
                    if ex.get("pred"):                       # the guard behind a translated refusal is a precondition too
                        guard_rows.append({"pred": ex["pred"], "status": hr["status"], "at": ex["at"], "depth": 1,
                                           "via": via, **({"after": list(ex["after"])} if ex.get("after") else {})})
                    if ex.get("msg") and hr.get("form") == "text" and hr.get("detail") != ex["msg"]:
                        reason_lost.append({"status": hr["status"], "detail": hr["detail"], "was": ex["msg"],
                                            "at": hr["at"]})
            elif where == "escape":
                escapes.append(_copy(ex, via=via))
        unknown_causes += [f"pass-through raise {p}" for p in CA["passthrough"]]
    kept = []
    for x in escapes:                                        # an app exception handler catches what escaped
        xm = _mod(repo, x["at"].rpartition(":")[0])
        hit = x["cls"] if x["cls"] in apph else next((b for b in sorted(_bases(repo, xm, x["cls"])) if b in apph), None)
        if hit:
            hrows.append(_copy(apph[hit], phase="handler", depth=1, via=f"app handler {hit}", raised_at=x["at"],
                               source="verified"))
        else:
            kept.append(x)
    escapes = kept
    for hr in hrows:
        hr.pop("_handler", None)
    produced += hrows
    for r in produced:
        r.pop("_handler", None)
    unc = {"phase": "uncaught", "status": F.UNCAUGHT["status"], "state": "default", "source": F.UNCAUGHT["source"]}
    if escapes:
        unc["causes"] = sorted({f"{x['cls']} {x['at']}" for x in escapes})
    if unknown_causes:
        unc["unknown_causes"] = sorted(set(unknown_causes))
    produced.append(unc)
    seen, rows = set(), []
    for r in sorted(produced, key=_row_key):                 # 5 · dedupe + a byte-stable order
        k = (r.get("phase"), r.get("status"), r.get("detail"), r.get("at"), r.get("site"))
        if k not in seen:
            seen.add(k)
            rows.append(r)

    pre = []                                                 # U3 — the guards that end in a refusal
    for r in rows:
        if r["phase"] in ("handler", "dependency") and r.get("pred"):
            g = {"pred": r["pred"], "status": r["status"], "at": r["at"], "depth": r.get("depth", 1)}
            for k in ("after", "via", "dep"):
                if r.get(k):
                    g[k] = r[k]
            if r.get("depth") == 0 and r.get("_guard_line") in flags_lines:
                g["kind"] = "flag"
            pre.append(g)
    pre += guard_rows
    pre = list({(g["pred"], g["status"], g["at"]): g for g in pre}.values())
    pre.sort(key=lambda g: (g["depth"], g["at"], g["pred"]))
    for r in rows:
        r.pop("_guard_line", None)

    declared = _declared(dec, fn, m, ep)
    refusals = [r for r in rows if r["phase"] != "uncaught"]
    own = [r for r in refusals if r["state"] == "defined"]
    findings = []
    text = sorted({(r["status"], str(r.get("detail"))) for r in own if not r.get("code")})
    if text:
        findings.append({"id": "text-only", "n": len(text)})
    by_status: dict[int, set] = {}
    for st, det in text:
        by_status.setdefault(st, set()).add(det)
    for st in sorted(s for s, d in by_status.items() if len(d) > 1):
        findings.append({"id": "shared-status", "status": st, "details": sorted(by_status[st])})
    for rl in reason_lost:
        findings.append({"id": "reason-lost", **rl})
    for x in sorted({(x["cls"], x["at"]) for x in escapes}):
        findings.append({"id": "escape-500", "cls": x[0], "at": x[1]})
    for at in sorted(set(swallowed)):
        findings.append({"id": "http-swallowed", "at": at})
    produced_st = {r["status"] for r in refusals if r.get("status") and r["state"] in ("defined", "default")}
    undeclared = sorted(produced_st - {422, declared["success"]["status"]} - set(declared["refusals"]))
    if undeclared:
        findings.append({"id": "undeclared", "statuses": undeclared})
    unproduced = sorted(set(declared["refusals"]) - produced_st)
    if unproduced:
        findings.append({"id": "declared-unproduced", "statuses": unproduced})
    findings = list({repr(sorted(f.items())): f for f in findings}.values())
    for f in findings:
        f["slot"] = F.FINDINGS[f["id"]]["slot"]

    unknown = sum(1 for r in rows if r["state"] == "unknown")
    if not refusals:
        u7 = "n/a"
    elif any(not r.get("code") for r in own):
        u7 = "missing"
    elif own:
        u7 = "defined"
    else:
        u7 = "default" if any(r["state"] == "default" for r in refusals) else "unknown"
    need = produced_st - {422, declared["success"]["status"]}
    k1 = "n/a" if not need else ("defined" if need <= set(declared["refusals"]) else "missing")
    if pre:
        u3 = "defined"
    elif F.OPTIONS["u3_empty"] == "missing-on-mutating" and ep["method"] in F.MUTATING_METHODS:
        u3 = "missing"
    else:
        u3 = "n/a"
    stats["rows"] += len(rows)
    stats["unknown_rows"] += unknown
    for r in rows:
        if r["state"] == "unknown":
            stats["unknown_reasons"][r.get("reason", "?")] = stats["unknown_reasons"].get(r.get("reason", "?"), 0) + 1
    for f in findings:
        stats["findings"][f["id"]] = stats["findings"].get(f["id"], 0) + 1
    return {**head, "line": dec.lineno, "full_path": full, "declared": declared, "produced": rows,
            "preconditions": pre, "findings": findings,
            "slots": {"U3": {"state": u3, "rows": len(pre)},
                      "U7": {"state": u7, "rows": len(refusals), "unknown": unknown},
                      "K1": {"state": k1, "declared": declared["refusals"], "produced": sorted(produced_st)}}}


def build(amap: dict, repo) -> dict:
    """The forms feed for every FastAPI endpoint in ``amap`` — never raises."""
    try:
        return _build(amap, Path(repo))
    except Exception as exc:  # noqa: BLE001
        return {"version": F.VERSION, "present": False, "reason": f"forms pass error: {type(exc).__name__}: {exc}"[:200]}


def _build(amap: dict, repo: Path) -> dict:
    eps = []
    for slug in sorted(amap.get("entities") or {}):
        for ep in ((amap["entities"].get(slug) or {}).get("endpoints") or []):
            if ep.get("method", "").lower() in _ROUTE_METHODS and ep.get("file") and ep.get("fn"):
                eps.append((slug, ep))
    if not eps:
        return {"version": F.VERSION, "present": False, "reason": "no FastAPI endpoints in the archmap"}
    stats = {"endpoints": 0, "rows": 0, "unknown_rows": 0, "unknown_reasons": {}, "findings": {},
             "unresolved_calls": 0, "collisions": 0, "unformed": 0, "unknown_middleware": []}
    files = sorted({ep["file"] for _, ep in eps})
    mwx = _middleware_exits(repo, amap, stats)
    apph = _app_handlers(repo, files)
    flags_lines: dict[str, set] = {}
    for _, ep in eps:
        flags_lines.setdefault(ep["file"], set()).update(int(f.get("line", 0)) for f in (ep.get("flags") or []))
    grouped: dict[str, list] = {}
    for slug, ep in eps:
        form = _form(repo, amap, slug, ep, mwx, files, flags_lines.get(ep["file"], set()), stats, apph)
        grouped.setdefault(f"endpoint:{ep['method']} {ep['path']}", []).append(form)
        stats["endpoints"] += 1
    out: dict[str, dict] = {}
    for key in sorted(grouped):
        forms = sorted(grouped[key], key=lambda f: (f["file"], f.get("line", 0)))
        if len(forms) == 1:
            out[key] = forms[0]
        else:
            out[key] = {"variants": forms}
            stats["collisions"] += 1
    fws = sorted({fw for _, ep in eps if (fw := _framework(repo, ep["file"]))}, key=lambda x: x[1])
    stats["unknown_middleware"] = sorted(set(stats["unknown_middleware"]))
    return {"version": F.VERSION, "present": True, "kind": "endpoint",
            "framework": {"name": F.FRAMEWORK, "locks": {lf: v for v, lf in fws}},
            "endpoints": out, "stats": stats}
