"""Element forms — the KINDS arm's middleware and dependency forms (amendment 1 §A2 Slice 3 · B-mw · B-dep).

A MIDDLEWARE form says where a class runs in the stack, what it refuses, on how many endpoints, and what lets a request
through untouched. A DEPENDENCY form says what a FastAPI dependency needs first (in parameter order), what it refuses
itself and what it inherits, what it commits — itself or one call down — whether it tears down after the response, and
how many endpoints run it. Both are top-level maps (``middleware{}`` keyed ``middleware:<Cls>``, ``dependencies{}``
keyed ``file::qual``) built from what the endpoint pass already reads; every exit carries the SAME ``x:`` id as the
endpoint rows. Findings land in ``arm_findings.kinds``: ``indistinct-exits`` (one builder answers several refusals) and
``dependency-commits`` (a dependency commits before the handler runs).
"""
from __future__ import annotations

import ast
import json
from pathlib import Path

import _a3_code as C
import _a3_forms as F
import _a3_forms_ids as I
import _a3_forms_reach as R
import _a3_forms_settings as S
import _a3_paths as P

PARTS = ("middleware", "dependencies")
_PATH_SUBJECTS = frozenset({"request.url.path", "scope['path']", 'scope["path"]'})
_ROW_KEYS = ("phase", "status", "state", "form", "detail", "code", "at", "site", "scope", "pred", "when", "via", "source", "dep")


def _own_nodes(fn):
    todo = list(ast.iter_child_nodes(fn))
    while todo:
        n = todo.pop()
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef)):
            continue
        yield n
        todo.extend(ast.iter_child_nodes(n))


def _detail(r: dict) -> str:
    return json.dumps(r.get("detail"), sort_keys=True, ensure_ascii=False)


def _ids(forms: dict) -> dict:
    """The ``x:`` ids the endpoint rows already carry, by (site, at, status, detail) and by (at, status, detail)."""
    out: dict = {}
    for e in (forms.get("endpoints") or {}).values():
        for v in e.get("variants") or [e]:
            for r in v.get("produced") or []:
                if r.get("id"):
                    out.setdefault(("site", r.get("site"), r.get("at"), r.get("status"), _detail(r)), r["id"])
                    out.setdefault(("at", r.get("at"), r.get("status"), _detail(r)), r["id"])
    return out


def _id_of(ids: dict, repo, row: dict) -> tuple[str, bool]:
    """``(x: id, on_endpoints)`` — the endpoint row's id, else a fresh one (n 0) for an exit no endpoint carries."""
    got = ids.get(("site", row.get("site"), row.get("at"), row.get("status"), _detail(row))) \
        or ids.get(("at", row.get("at"), row.get("status"), _detail(row)))
    return (got, True) if got else (I.ident("x", I.x_tuple(repo, row, None) + [0]), False)


def _row(r: dict) -> dict:
    return {k: (list(r[k]) if isinstance(r[k], list) else r[k]) for k in _ROW_KEYS if k in r}


def _handlers(repo: Path, forms: dict):
    for key in sorted(forms.get("endpoints") or {}):
        e = forms["endpoints"][key]
        for v in e.get("variants") or [e]:
            file, _, name = str(v.get("handler") or "").partition("::")
            m = P._mod(repo, file) if file else None
            if m is None or not name:
                continue
            fn, dec = P._find_handler(m, {"fn": name, "method": v.get("method"), "path": v.get("path")})
            if fn is not None:
                yield key, v, m, fn, dec


# ── middleware ───────────────────────────────────────────────────────────────────────────────────────
def _locals_once(meth) -> dict[str, str]:
    seen: dict[str, list] = {}
    for st in ast.walk(meth):
        if isinstance(st, ast.Assign) and len(st.targets) == 1 and isinstance(st.targets[0], ast.Name):
            seen.setdefault(st.targets[0].id, []).append(st.value)
    return {k: ast.unparse(v[0]) for k, v in seen.items() if len(v) == 1}


def _is_path(subject: str | None, subst: dict) -> bool:
    s = subst.get(subject or "", subject or "")
    return s in _PATH_SUBJECTS or s.endswith(".url.path")


def _arm(repo: Path, cm, cname: str, node, subst: dict) -> dict:
    """One ``or`` operand of a pass-through guard → ``exact-paths`` · ``prefix`` · ``method`` · ``flag`` · ``expr``."""
    src = ast.unparse(node)
    if isinstance(node, ast.Compare) and len(node.ops) == 1 and ast.unparse(node.left).endswith(".method") \
            and isinstance(node.ops[0], (ast.Eq, ast.In)):
        right = node.comparators[0]
        vals = [right.value] if isinstance(right, ast.Constant) else list(P._literal(right) or ())
        if vals:
            return {"kind": "method", "src": src, "values": vals}
    terms = S.terms(repo, cm, cname, src)
    if len(terms) == 1:
        t = terms[0]
        if t["kind"] == "in" and _is_path(t.get("subject"), subst):
            return {"kind": "exact-paths", "src": src, "values": t["values"]}
        if t["kind"] == "startswith" and _is_path(t.get("subject"), subst):
            return {"kind": "prefix", "src": src, "values": t["values"]}
        if t["src"].startswith("self."):
            arm = {"kind": "flag", "src": src}
            if t["kind"] == "expr":
                arm["expr"] = t["expr"]
            return arm
    return {"kind": "expr", "src": src}


def _pass_through(repo: Path, cm, cname: str, meth) -> list[tuple]:
    """``[(line, [arms])]`` — each ``return await call_next(…)`` that sits under a guard: the guard, split on ``or``."""
    subst = _locals_once(meth)
    out = []
    for e in P._events(meth):
        if e["kind"] != "return" or not e["guards"]:
            continue
        val = e["node"].value
        val = val.value if isinstance(val, ast.Await) else val
        if not (isinstance(val, ast.Call) and P._leaf(val.func) == "call_next"):
            continue
        if len(e["guards"]) > 1:
            out.append((e["line"], [{"kind": "expr", "src": " and ".join(g for g, _ in e["guards"])}]))
            continue
        node = ast.parse(e["guards"][0][0], mode="eval").body
        parts = node.values if isinstance(node, ast.BoolOp) and isinstance(node.op, ast.Or) else [node]
        out.append((e["line"], [_arm(repo, cm, cname, part, subst) for part in parts]))
    return out


def _exempts(arm: dict, full_path: str) -> bool:
    if arm["kind"] == "exact-paths":
        return full_path in arm["values"]
    if arm["kind"] == "prefix":
        return any(full_path.startswith(v) for v in arm["values"])
    return False


def _helper_exits(repo: Path, cm, cname: str, meth, known_sites: set) -> list[dict]:
    """``return build_429(…)`` — a module-level helper that builds the response: one hop, exits the pass did not keep."""
    out = []
    for e in P._events(meth):
        if e["kind"] != "return" or f"{cm.rel}:{e['line']}" in known_sites:
            continue
        val = e["node"].value
        val = val.value if isinstance(val, ast.Await) else val
        if not (isinstance(val, ast.Call) and isinstance(val.func, ast.Name)):
            continue
        r = P._resolve(repo, cm, val.func.id)
        fn = r[0].defs.get(r[1]) if r else None
        for e2 in (P._events(fn) if fn is not None else []):
            ex = P._response_exit(e2["node"].value, r[0], repo) if e2["kind"] == "return" else None
            if ex:
                out.append({**ex, "phase": "middleware", "at": f"{r[0].rel}:{e2['line']}", "site": f"{cm.rel}:{e['line']}",
                            "via": cname, "scope": "all", "hop": f"helper {val.func.id}"})
                break
    return out


def middleware_forms(repo: Path, forms: dict, amap: dict) -> tuple[dict, list]:
    mws = sorted(amap.get("app_middleware") or [], key=lambda x: (x.get("order", 0), x.get("file") or "", x.get("line") or 0))
    n = len(mws)
    rows = P._middleware_exits(repo, amap, {"unknown_middleware": []})
    ids = _ids(forms)
    eps = sorted({(key, v.get("full_path") or "") for key, e in (forms.get("endpoints") or {}).items() for v in (e.get("variants") or [e])})
    out: dict = {}
    findings: list = []
    for i, mw in enumerate(mws):
        cls = mw.get("cls")
        key = f"middleware:{cls}"
        form = {"cls": cls, "registered_at": f"{mw.get('file')}:{mw.get('line')}",
                "order": {"registered": i, "runs": n - 1 - i, "of": n},
                "outer": f"middleware:{mws[i + 1]['cls']}" if i + 1 < n else None,
                "inner": f"middleware:{mws[i - 1]['cls']}" if i > 0 else None}
        m = P._mod(repo, mw.get("file"))
        r = P._resolve(repo, m, cls) if m else None
        arms: list = []
        extra: list = []
        if r and r[1] in r[0].classes:
            cm, cname = r
            meth = next((cm.defs[f"{cname}.{x}"] for x in F.MIDDLEWARE_METHODS if f"{cname}.{x}" in cm.defs), None)
            form.update({"kind": "project", "file": cm.rel, "method": f"{cm.rel}::{cname}.{meth.name}" if meth else None})
            if meth is not None:
                arms = _pass_through(repo, cm, cname, meth)
                extra = _helper_exits(repo, cm, cname, meth, {x.get("site") for x in rows if x.get("via") == cls})
            form["pass_through"] = [{**a, "at": f"{cm.rel}:{ln}"} for ln, al in arms for a in al]
        else:
            form["kind"] = "third-party" if cls in F.THIRD_PARTY_MIDDLEWARE else "unknown"
        exits = []
        for x in [x for x in rows if x.get("via") == cls] + extra:
            site_line = I._line(x.get("site") or x.get("at"))
            scope = x.get("scope") or "all"
            in_scope = {k: fp for k, fp in eps if scope == "all" or any(fp.startswith(p) for p in scope)}
            exempt = sorted(k for k, fp in in_scope.items() if any(_exempts(a, fp) for ln, al in arms if ln < site_line for a in al))
            ident, on = _id_of(ids, repo, x)
            row = {"id": ident, **_row(x), "applies_to": len(in_scope) - len(exempt), "exempt": exempt}
            if x.get("hop"):
                row["hop"] = x["hop"]
            if not on:
                row["on_endpoints"] = False
            exits.append(row)
        form["exits"] = exits
        groups: dict = {}
        for x in exits:
            groups.setdefault((x.get("status"), _detail(x), x.get("at")), []).append(x)
        for (status, _, at), same in sorted(groups.items(), key=lambda kv: str(kv[0])):
            if len(same) > 1:
                findings.append({"id": "indistinct-exits", "slot": "K3", "subject": key, "status": status, "at": at,
                                 "exits": [x["id"] for x in same], "sites": sorted(x.get("site") or "" for x in same)})
        if key in out:
            prior = out[key]
            out[key] = {"variants": (prior["variants"] if "variants" in prior else [prior]) + [form]}
        else:
            out[key] = form
    return out, findings


# ── dependencies ─────────────────────────────────────────────────────────────────────────────────────
def _dep_params(fn, dec, aliases: dict, meta: dict) -> list[dict]:
    """The dependencies FastAPI resolves for ``fn``, in its own order: route ``dependencies=[…]`` first, then each
    parameter as written (a ``Depends()`` default, an ``Annotated[…, Depends()]``, a module alias), then — on a route
    handler only — its non-route decorators (a ``@require_household`` gate; ``@lru_cache`` on a dependency is not one).
    ``_a3_code._endpoint_middleware`` names the same set but sorts gates first."""
    order: list[dict] = []
    seen: set = set()

    def add(name, callee=None, decl=None, via="param-dep"):
        if name and name not in seen:
            seen.add(name)
            order.append({"name": name, "callee": callee, "_decl": decl, "via": via})

    for kw in getattr(dec, "keywords", None) or []:
        if kw.arg == "dependencies" and isinstance(kw.value, (ast.List, ast.Tuple)):
            for el in kw.value.elts:
                add(C._depends_target(el), C._depends_callee(el), via="route-dep")
    args = fn.args
    params = list(args.posonlyargs) + list(args.args)
    defaults = dict(zip([p.arg for p in params[len(params) - len(args.defaults):]], args.defaults))
    defaults.update({p.arg: d for p, d in zip(args.kwonlyargs, args.kw_defaults) if d is not None})
    for p in params + list(args.kwonlyargs):
        d = defaults.get(p.arg)
        if d is not None:
            add(C._depends_target(d), C._depends_callee(d))
        if p.annotation is not None:
            for nm in C._annotated_depends(p.annotation):
                add(nm)
            if isinstance(p.annotation, ast.Name) and p.annotation.id in aliases:
                am = meta.get(p.annotation.id) or {}
                for nm in aliases[p.annotation.id]:
                    add(nm, (am.get("callees") or {}).get(nm), am.get("decl"))
    for d in (fn.decorator_list if dec is not None else ()):
        if d is not dec:
            nm = C._dec_name(d)
            if nm and nm not in P._ROUTE_METHODS:
                add(nm, via="decorator")
    return order


def _commits(repo: Path, rm, qual: str, node) -> list[dict]:
    out, seen = [], set()
    for e in P._events(node):
        if e["kind"] != "call":
            continue
        if P._leaf(e["node"].func) in F.TX_CALLS:
            row = {"op": P._leaf(e["node"].func), "at": f"{rm.rel}:{e['line']}"}
        else:
            r = R.callee(repo, rm, qual, node, e["node"])
            hit = None
            for e2 in (P._events(r[0].defs[r[1]]) if r and r[1] in r[0].defs else []):
                if e2["kind"] == "call" and P._leaf(e2["node"].func) in F.TX_CALLS:
                    hit = {"op": P._leaf(e2["node"].func), "at": f"{r[0].rel}:{e2['line']}", "via": f"{r[1]} @ {rm.rel}:{e['line']}"}
                    break
            if hit is None:
                continue
            row = hit
        if row["at"] not in seen:
            seen.add(row["at"])
            out.append(row)
    return out


def _dep_form(repo: Path, rm, qual: str, ids: dict) -> tuple[dict, object]:
    base = {"levels_id": f"{rm.rel}#{qual}"}
    val = rm.assigns.get(qual)
    if isinstance(val, ast.Call) and P._leaf(val.func) in F.SECURITY_CLASSES:
        auto = not any(k.arg == F.SECURITY_CLASSES[P._leaf(val.func)]["auto_error_kw"] and isinstance(k.value, ast.Constant)
                       and k.value.value is False for k in val.keywords)
        at, via = f"{rm.rel}:{val.lineno}", f"{P._leaf(val.func)} {qual}"
        exits = [{"id": _id_of(ids, repo, {"at": at, "status": F.SECURITY_CLASSES[P._leaf(val.func)]["status"],
                                           "detail": F.SECURITY_CLASSES[P._leaf(val.func)]["detail"]})[0],
                  "phase": "security", "status": F.SECURITY_CLASSES[P._leaf(val.func)]["status"], "at": at, "via": via}] if auto else []
        return {**base, "kind": "security", "class": P._leaf(val.func), "at": at, "auto_error": auto, "exits": exits,
                "inherited_exits": [], "effects": [], "teardown": False, "subdeps": []}, None
    node = rm.defs.get(qual) or rm.defs.get(f"{qual}.__call__")
    if node is None:
        return {**base, "kind": "unknown", "reason": "not a function, a callable class or a security scheme", "subdeps": []}, None
    A = P._analyse(repo, rm, node)
    acc = {"rows": [], "escapes": [], "unknown_causes": [], "validated": [], "swallowed": [], "framework": P._framework(repo, rm.rel)}
    P._deps(repo, rm, node, None, 0, set(), acc)
    form = {**base, "kind": "class" if qual not in rm.defs else "function", "at": f"{rm.rel}:{node.lineno}",
            "exits": [{"id": _id_of(ids, repo, r)[0], **_row(r)} for r in A["rows"]],
            "inherited_exits": [{"id": _id_of(ids, repo, r)[0], **_row(r)} for r in acc["rows"]],
            "escapes": sorted({f"{x['cls']} {x['at']}" for x in A["escapes"]}),
            "effects": _commits(repo, rm, qual, node),
            "teardown": any(isinstance(x, (ast.Yield, ast.YieldFrom)) for x in _own_nodes(node)), "subdeps": []}
    return form, node


def dependency_forms(repo: Path, forms: dict) -> tuple[dict, list]:
    ids = _ids(forms)
    out: dict = {}
    applies: dict[str, set] = {}

    def transitive(fid: str, acc: set) -> set:
        for sub in (out.get(fid) or {}).get("subdeps") or []:
            if isinstance(sub, str) and sub not in acc:
                acc.add(sub)
                transitive(sub, acc)
        return acc

    def chain(m, fn, dec, depth: int, path: frozenset, key: str) -> list:
        order: list = []
        aliases = C._dep_aliases(repo, m.rel, m.tree)
        for d in _dep_params(fn, dec, aliases, C._dep_alias_meta(m.rel)):
            r = P._dep_target(repo, m, d.get("callee") or d["name"], d.get("_decl"))
            if not r:
                order.append({"name": d["name"], "resolved": False})
                continue
            rm, qual = r
            fid = f"{rm.rel}::{qual}"
            order.append(fid)
            applies.setdefault(fid, set()).add(key)
            if fid in path:
                continue
            if fid in out:
                for sub in transitive(fid, set()):
                    applies.setdefault(sub, set()).add(key)
                continue
            form, node = _dep_form(repo, rm, qual, ids)
            out[fid] = form
            if node is not None and depth + 1 < P._DEP_MAX:
                form["subdeps"] = chain(rm, node, None, depth + 1, path | {fid}, key)
        return order

    for key, v, m, fn, dec in _handlers(repo, forms):
        chain(m, fn, dec, 0, frozenset(), key)
    findings = []
    for fid in sorted(out):
        out[fid]["applies_to"] = len(applies.get(fid, ()))
        commits = [x for x in out[fid].get("effects") or [] if x["op"] in F.TX_CALLS]
        if commits:
            findings.append({"id": "dependency-commits", "slot": "K3", "subject": fid, "commits": [x["at"] for x in commits],
                             "applies_to": out[fid]["applies_to"]})
    return dict(sorted(out.items())), findings


def run(forms: dict, ctx: dict) -> dict:
    """The kinds arm's Slice 3 parts: ``middleware`` and ``dependencies`` (the orchestrator passes the ones to run)."""
    repo, parts = Path(ctx["repo"]), ctx["parts"]
    stats: dict = {"findings": {}}
    found: list = []
    if "middleware" in parts:
        forms["middleware"], got = middleware_forms(repo, forms, ctx["amap"])
        found += got
        stats["middleware"] = len(forms["middleware"])
        stats["middleware_exits"] = sum(len(f.get("exits") or []) for x in forms["middleware"].values() for f in (x.get("variants") or [x]))
    if "dependencies" in parts:
        forms["dependencies"], got = dependency_forms(repo, forms)
        found += got
        stats["dependencies"] = len(forms["dependencies"])
    if found:
        forms["arm_findings"].setdefault("kinds", []).extend(found)
    for f in found:
        stats["findings"][f["id"]] = stats["findings"].get(f["id"], 0) + 1
    return {"version": 1, "stats": stats}


run.parts = PARTS
