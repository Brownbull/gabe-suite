"""Test assertions — what each python test function CALLS and ASSERTS, and the role each call plays (amendment 1 §A2
Slice 9). Pure extraction with no forms knowledge, so the model and schema slices reuse it (S11 · F8).

Per test function, a statement walk in source order records every HTTP call (``client.<verb>(path, …)``: method, the
literal or f-string path, the header keys it sends — ``None`` when a header dict cannot be read — and whether it sends a
JSON body), the name the response is bound to, the helper functions it calls (one hop: a helper's own HTTP calls), the
service calls made inside ``pytest.raises(X)``, and every assertion made on a response: ``status`` (``==`` or ``in``),
``detail`` and ``code`` literals, ``is_success``, and any other attribute read (``attrs``). Roles, first match wins:
R1 a helper's call → ``arrange`` · R2 never asserted → ``arrange`` · R3 a status-only 2xx assertion followed by an
asserted call → ``arrange-checked`` · R4 otherwise → ``act``.
"""
from __future__ import annotations

import ast
import re

VERBS = frozenset({"get", "post", "put", "patch", "delete", "head", "options"})
DETAIL_KEYS = frozenset({"detail", "message", "error"})
CODE_KEYS = frozenset({"code", "error_code", "reason", "type"})
CID_RX = re.compile(r"(?:^|_)C(\d{1,6})(?=$|_|\[)")


def _dict_keys(node, aliases: dict):
    """The string keys a header dict literal carries (``**X`` spreads resolved through ``aliases``), or None."""
    if isinstance(node, ast.Name):
        return set(aliases[node.id]) if node.id in aliases else None
    if not isinstance(node, ast.Dict):
        return None
    keys: set = set()
    for k, v in zip(node.keys, node.values):
        if k is None:
            sub = _dict_keys(v, aliases)
            if sub is None:
                return None
            keys |= sub
        elif isinstance(k, ast.Constant) and isinstance(k.value, str):
            keys.add(k.value)
        else:
            return None
    return keys


def _path(node) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str) and node.value.startswith("/"):
        return node.value
    if isinstance(node, ast.JoinedStr):
        raw = "".join(str(p.value) if isinstance(p, ast.Constant) else "{*}" for p in node.values)
        return raw if raw.startswith("/") else None
    return None


def _http(node):
    """The HTTP call an expression is (``await`` unwrapped), or None."""
    node = node.value if isinstance(node, ast.Await) else node
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr in VERBS and node.args and _path(node.args[0]):
        return node
    return None


def _record(call: ast.Call, aliases: dict) -> dict:
    kw = {k.arg: k.value for k in call.keywords if k.arg}
    sends = _dict_keys(kw["headers"], aliases) if "headers" in kw else set()
    return {"line": call.lineno, "method": call.func.attr.upper(), "path": _path(call.args[0]),
            "sends": sorted(sends) if sends is not None else None, "json": "json" in kw,
            "asserts": {"status": [], "detail": [], "code": [], "attrs": [], "is_success": False}}


def _subscript_key(node) -> str | None:
    s = node.slice
    return s.value if isinstance(s, ast.Constant) and isinstance(s.value, str) else None


def _json_key(node, json_of: dict, by_var: dict):
    """``resp.json()["k"]`` / ``body["k"]`` (``body = resp.json()``) → (the response's record, "k")."""
    if not isinstance(node, ast.Subscript):
        return None, None
    base, key = node.value, _subscript_key(node)
    if isinstance(base, ast.Call) and isinstance(base.func, ast.Attribute) and base.func.attr == "json" and isinstance(base.func.value, ast.Name):
        return by_var.get(base.func.value.id), key
    if isinstance(base, ast.Name) and base.id in json_of:
        return by_var.get(json_of[base.id]), key
    return None, None


def _ints(node) -> list | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, int):
        return [node.value]
    if isinstance(node, (ast.Tuple, ast.List, ast.Set)) and all(isinstance(e, ast.Constant) and isinstance(e.value, int) for e in node.elts):
        return [e.value for e in node.elts]
    return None


def _assert(test, by_var: dict, json_of: dict) -> None:
    if isinstance(test, ast.BoolOp):
        for v in test.values:
            _assert(v, by_var, json_of)
        return
    touched = set()
    if isinstance(test, ast.Compare) and len(test.ops) == 1:
        left, op, right = test.left, test.ops[0], test.comparators[0]
        if isinstance(left, ast.Attribute) and left.attr == "status_code" and isinstance(left.value, ast.Name) and left.value.id in by_var:
            vals = _ints(right)
            if vals and isinstance(op, (ast.Eq, ast.In)):
                by_var[left.value.id]["asserts"]["status"] += vals
                touched.add(left.value.id)
        for side, other in ((left, right), (right, left)):
            rec, key = _json_key(side, json_of, by_var)
            if rec is not None and isinstance(other, ast.Constant) and isinstance(other.value, str):
                if key in DETAIL_KEYS:
                    rec["asserts"]["detail"].append(other.value)
                    touched.add(id(rec))
                elif key in CODE_KEYS:
                    rec["asserts"]["code"].append(other.value)
                    touched.add(id(rec))
    if isinstance(test, ast.Attribute) and test.attr == "is_success" and isinstance(test.value, ast.Name) and test.value.id in by_var:
        by_var[test.value.id]["asserts"]["is_success"] = True
        return
    for n in ast.walk(test):
        name = n.id if isinstance(n, ast.Name) else None
        rec = by_var.get(name) if name in by_var else (by_var.get(json_of[name]) if name in json_of else None)
        if rec is not None and name not in touched and id(rec) not in touched:
            snippet = ast.unparse(test)[:120]
            if snippet not in rec["asserts"]["attrs"] and not (isinstance(test, ast.Compare) and "status_code" in snippet and not rec["asserts"]["attrs"] and len(test.ops) == 1 and _ints(test.comparators[0])):
                rec["asserts"]["attrs"].append(snippet)
            touched.add(id(rec))


def _walk(stmts, ctx: dict) -> None:
    for st in stmts:
        if isinstance(st, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            continue
        if isinstance(st, ast.Assign) and len(st.targets) == 1 and isinstance(st.targets[0], ast.Name):
            name, val = st.targets[0].id, st.value
            keys = _dict_keys(val, ctx["aliases"]) if isinstance(val, ast.Dict) else None
            if keys is not None:
                ctx["aliases"][name] = keys
            inner = val.value if isinstance(val, ast.Await) else val
            if isinstance(inner, ast.Call) and isinstance(inner.func, ast.Attribute) and inner.func.attr == "json" \
                    and isinstance(inner.func.value, ast.Name) and inner.func.value.id in ctx["by_var"]:
                ctx["json_of"][name] = inner.func.value.id
        value = st.value if isinstance(st, (ast.Assign, ast.Expr, ast.AnnAssign)) and getattr(st, "value", None) is not None else None
        call = _http(value) if value is not None else None
        if call is not None:
            rec = _record(call, ctx["aliases"])
            if isinstance(st, ast.Assign) and len(st.targets) == 1 and isinstance(st.targets[0], ast.Name):
                ctx["by_var"][st.targets[0].id] = rec
            ctx["calls"].append(rec)
        for n in ast.walk(st) if not isinstance(st, (ast.With, ast.AsyncWith, ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try)) else ():
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in ctx["helpers"] and n.func.id not in ctx["seen_helpers"]:
                ctx["seen_helpers"].add(n.func.id)
                sub = {"aliases": dict(ctx["module_aliases"]), "by_var": {}, "json_of": {}, "calls": [], "helpers": {}, "seen_helpers": set(),
                       "module_aliases": ctx["module_aliases"], "raises": [], "in_raises": None}
                _walk(ctx["helpers"][n.func.id].body, sub)
                for c in sub["calls"]:
                    c["helper"] = n.func.id
                    ctx["calls"].append(c)
        if isinstance(st, ast.Assert):
            _assert(st.test, ctx["by_var"], ctx["json_of"])
        if isinstance(st, (ast.With, ast.AsyncWith)):
            raised = next((P for it in st.items for P in [it.context_expr] if isinstance(P, ast.Call) and isinstance(P.func, ast.Attribute)
                           and P.func.attr == "raises" and P.args), None)
            if raised is not None:
                cls = ast.unparse(raised.args[0]).rsplit(".", 1)[-1]
                for n in ast.walk(ast.Module(body=st.body, type_ignores=[])):
                    if isinstance(n, ast.Call) and not _http(n) and not (isinstance(n.func, ast.Attribute) and n.func.attr in ("raises",)):
                        root = n.func
                        while isinstance(root, ast.Attribute):
                            root = root.value
                        ctx["raises"].append({"raises": cls, "call": ast.unparse(n.func)[:80], "line": n.lineno,
                                              "root": root.id if isinstance(root, ast.Name) else None})
                        break
            _walk(st.body, ctx)
        elif isinstance(st, (ast.If, ast.For, ast.AsyncFor, ast.While)):
            _walk(st.body, ctx)
            _walk(st.orelse, ctx)
        elif isinstance(st, ast.Try):
            _walk(st.body, ctx)
            for h in st.handlers:
                _walk(h.body, ctx)
            _walk(st.orelse, ctx)
            _walk(st.finalbody, ctx)


def _roles(calls: list) -> None:
    for i, c in enumerate(calls):
        a = c["asserts"]
        asserted = bool(a["status"] or a["detail"] or a["code"] or a["attrs"] or a["is_success"])
        if c.get("helper"):
            c["role"] = "arrange"
        elif not asserted:
            c["role"] = "arrange"
        elif a["status"] and not (a["detail"] or a["code"] or a["attrs"]) and all(200 <= s < 300 for s in a["status"]) and \
                any(not x.get("helper") and (x["asserts"]["status"] or x["asserts"]["detail"] or x["asserts"]["code"] or x["asserts"]["attrs"])
                    for x in calls[i + 1:]):
            c["role"] = "arrange-checked"
        else:
            c["role"] = "act"


def extract(src: str) -> dict:
    """``{"tests": {function name: {line, calls[], raises[]}}, "overrides": bool, "imports": {alias: [module, name]}}`` for one
    test module."""
    tree = ast.parse(src)
    module_aliases = {}
    for n in tree.body:
        if isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name) and isinstance(n.value, ast.Dict):
            keys = _dict_keys(n.value, module_aliases)
            if keys is not None:
                module_aliases[n.targets[0].id] = keys
    helpers = {n.name: n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and not n.name.startswith("test")}
    defs = [n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name.startswith("test")]
    defs += [m for c in tree.body if isinstance(c, ast.ClassDef) and c.name.startswith("Test")
             for m in c.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)) and m.name.startswith("test")]
    imports = {}
    for n in tree.body:
        if isinstance(n, ast.Import):
            for a in n.names:
                imports[a.asname or a.name.split(".")[0]] = [a.name if a.asname else a.name.split(".")[0], None]
        elif isinstance(n, ast.ImportFrom) and n.module:
            for a in n.names:
                imports[a.asname or a.name] = [n.module, a.name]
    out = {"tests": {}, "overrides": "dependency_overrides" in src, "imports": imports}
    for fn in defs:
        ctx = {"aliases": dict(module_aliases), "by_var": {}, "json_of": {}, "calls": [], "helpers": helpers, "seen_helpers": set(),
               "module_aliases": module_aliases, "raises": [], "in_raises": None}
        _walk(fn.body, ctx)
        _roles(ctx["calls"])
        out["tests"][fn.name] = {"line": fn.lineno, "calls": ctx["calls"], "raises": ctx["raises"]}
    return out
