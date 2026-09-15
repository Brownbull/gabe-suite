"""Element forms — the endpoint pass's READING half: how a Python source line becomes a fact.

Split out of ``_a3_paths.py`` under D26 (byte-neutral, re-exported: the arms reach these privates through ``_a3_paths``
and ``tests/forms-core`` K8 pins the list). Nothing here knows what FastAPI is — it reads modules and their bases,
resolves a status and a detail, walks statements with their guard · try · after stacks, and climbs a raise to the handler
that catches it. The endpoint shape (parameters, dependencies, middleware, routes, the row assembly) stays in
``_a3_paths.py``.
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


def _unpacked_code(v, m: _Mod, repo: Path) -> str | None:
    """A dict's `**<Enum>.<MEMBER>.detail(...)` unpack: the enum member IS the stable code the dict carries, so the
    detail is not text-only. Onyx builds every error body this way (`error_handling/error_codes.py`)."""
    node = v.func if isinstance(v, ast.Call) else v
    while isinstance(node, ast.Attribute):
        owner = node.value
        if isinstance(owner, ast.Attribute) and isinstance(owner.value, ast.Name) and (
                _bases(repo, m, owner.value.id) & F.ENUM_BASES):
            return _unp(owner)
        node = owner
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
            if k is None and (code := _unpacked_code(v, m, repo)):   # `**OnyxErrorCode.BAD_REQUEST.detail(msg)`
                return {"form": "object", "detail": _unp(expr), "code": code}
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
