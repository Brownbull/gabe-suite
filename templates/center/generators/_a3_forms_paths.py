"""Element forms — the PATHS arm, part 1 (amendment 1 §A2 Slice 3 · A4 · A5).

What an endpoint RETURNS when it does not refuse, which called functions DECIDE among several success results, which
calls were collapsed and why — and, for every middleware row that carries a ``when``, whether that condition can hold on
this endpoint's path.

* ``returns[]`` — every return of the handler (a value, a bare ``return``, falling off the end = ``implicit``, a return
  inside an except = ``catch-return``), with its guards; a returned ``JSONResponse(status_code=2xx|3xx)`` is ``defined``,
  anything else answers the declared success status as ``default``. A returned 4xx/5xx response is already a refusal row.
* ``branches[]`` — the returns of a DECIDING callee (D14): at least two candidate returns (the guarded ones plus the first
  unguarded fall-through) AND either the call site contributes a produced row or precondition, or the arms differ in a
  ``.commit(`` on their guard prefix. Each branch links to its depth-1 ``returns[]`` row.
* ``collapsed[]`` — every other project call, with the reason it does not decide.
* ``conditions{}`` + ``when_for_path`` / ``applies`` on middleware rows — the ``when`` terms resolved by
  ``_a3_forms_settings``; path membership is decided against the endpoint's ``full_path``; a provable False annotates
  ``applies: false`` and the row stays (D19).
"""
from __future__ import annotations

import ast
import copy
import json
from pathlib import Path

import _a3_forms as F
import _a3_forms_ids as I
import _a3_forms_reach as R
import _a3_forms_settings as S
import _a3_paths as P

PARTS = ("returns", "conditions")
_BARE, _IMPLICIT = "__gabe_bare_return__", "__gabe_implicit_return__"
_PATH_SUBJECTS = frozenset({"request.url.path", "scope['path']", 'scope["path"]'})


def _own_nodes(fn):
    todo = list(ast.iter_child_nodes(fn))
    while todo:
        n = todo.pop()
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef)):
            continue
        yield n
        todo.extend(ast.iter_child_nodes(n))


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
                yield key, v, m, fn


def _falls_off(stmts: list) -> bool:
    """Whether control can run past the last statement — ``implicit`` return when it can."""
    if not stmts:
        return True
    last = stmts[-1]
    if isinstance(last, (ast.Return, ast.Raise)):
        return False
    if isinstance(last, ast.If):
        return _falls_off(last.body) or _falls_off(last.orelse)
    if isinstance(last, (ast.With, ast.AsyncWith)):
        return _falls_off(last.body)
    if isinstance(last, P._TRY):
        return (_falls_off(last.body + last.orelse) or any(_falls_off(h.body) for h in last.handlers)) \
            and _falls_off(last.finalbody or [ast.Pass()])
    return True


def _mark(stmts: list) -> None:
    for st in stmts:
        if isinstance(st, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            continue
        if isinstance(st, ast.Return) and st.value is None:
            st.value = ast.copy_location(ast.Constant(_BARE), st)
        for field in ("body", "orelse", "finalbody"):
            _mark(getattr(st, field, None) or [])
        for h in getattr(st, "handlers", None) or []:
            _mark(h.body)
        for case in getattr(st, "cases", None) or []:
            _mark(case.body)


def returns_of(fn) -> list[dict]:
    """Every return event of ``fn`` — bare and implicit ones included — with ``_a3_paths._walk``'s guard/after/try context."""
    body = copy.deepcopy(fn.body)
    _mark(body)
    if _falls_off(body):
        end = ast.Return(value=ast.Constant(_IMPLICIT))
        end.lineno = end.value.lineno = getattr(fn, "end_lineno", fn.lineno)
        end.col_offset = end.value.col_offset = 0
        body.append(end)
    out: list = []
    P._walk(body, (), (), (), None, False, out)
    return sorted((e for e in out if e["kind"] == "return"), key=lambda e: e["line"])


def _value(e: dict):
    v = e["node"].value
    return None if isinstance(v, ast.Constant) and v.value in (_BARE, _IMPLICIT) else v


def _kind(e: dict) -> str:
    v = e["node"].value
    if isinstance(v, ast.Constant) and v.value == _IMPLICIT:
        return "implicit"
    return "catch-return" if e["handler"] is not None else "return"


def _pred(e: dict) -> str | None:
    parts = [g for g, _ in e["guards"]]
    if e["handler"] is not None:
        parts.append("except " + " | ".join(sorted(P._handler_types(e["handler"][1]) or {"*"})))
    return " and ".join(parts) or None


def _success(v, m, declared: dict) -> tuple:
    inner = v.value if isinstance(v, ast.Await) else v
    if isinstance(inner, ast.Call) and P._leaf(inner.func) in F.RESPONSE_CLASSES:
        st = next((P._status(k.value, m) for k in inner.keywords if k.arg == "status_code"), None)
        if st is None and len(inner.args) > 1:
            st = P._status(inner.args[1], m)
        if st and st < 400:
            return st, "defined"
    return ((declared or {}).get("success") or {}).get("status"), "default"


def _token(pred: str | None) -> str | None:
    if not pred:
        return None
    try:
        tree = ast.parse(pred.split(" and except ")[0], mode="eval")
    except SyntaxError:
        return None
    names = [(getattr(n, "end_col_offset", 0), n.attr if isinstance(n, ast.Attribute) else n.id)
             for n in ast.walk(tree) if isinstance(n, (ast.Attribute, ast.Name))]
    return max(names)[1] if names else None


def _row(fid: str, rel: str, e: dict, depth: int, **extra) -> dict:
    row = {"fn": fid, "kind": _kind(e), "at": f"{rel}:{e['line']}", "depth": depth, **extra}
    v = _value(e)
    row["value"] = P._unp(v, 80) if v is not None else None
    pred = _pred(e)
    if pred:
        row["pred"] = pred
    if e["after"]:
        row["after"] = list(e["after"])
    if e["loop"]:
        row["in_loop"] = True
    return row


def _tuple_r(row: dict, e: dict) -> list:
    return [row["fn"], row["kind"], [g for g, _ in e["guards"]], list(e["after"])]


def _deciding(repo: Path, m, fn, v: dict, fid: str):
    """The handler's project calls → ``(branch sets, collapsed rows)``; a branch set is ``(site, call, callee fid, cm, [(event, fall)], why)``."""
    evs = P._events(fn)
    hev: dict = {}
    for e in evs:
        if e["handler"] is not None:
            hev.setdefault(id(e["handler"][1]), []).append(e)
    rows = (v.get("produced") or []) + (v.get("preconditions") or [])
    sets, collapsed, seen = [], [], set()
    for ce in (e for e in evs if e["kind"] == "call"):
        call = ce["node"]
        site = f"{m.rel}:{ce['line']}"
        name = P._unp(call.func, 60)
        if (site, name) in seen:
            continue
        seen.add((site, name))
        r = R.callee(repo, m, fn.name, fn, call)
        if r is None:
            f = call.func
            if isinstance(f, ast.Name) and (m.imports.get(f.id) or (None,))[0]:
                collapsed.append({"site": site, "call": name, "fn": None, "reason": "unresolved"})
            continue
        cm, qual = r
        cnode = cm.defs[qual]
        cfid = f"{cm.rel}::{qual}"
        base = {"site": site, "call": name, "fn": cfid}
        if any(isinstance(n, (ast.Yield, ast.YieldFrom)) for n in _own_nodes(cnode)):
            collapsed.append({**base, "reason": "generator: runs after the response line"})
            continue
        if P._climb("Exception", {"Exception"}, ce["tries"], hev)[0] == "swallow":
            collapsed.append({**base, "reason": "swallowed by the caller"})
            continue
        rets = returns_of(cnode)
        fall = next((e for e in rets if not e["guards"] and e["handler"] is None), None)
        cands = [e for e in rets if e["guards"] or e["handler"] is not None] + ([fall] if fall else [])
        if len(cands) < 2:
            collapsed.append({**base, "reason": "one return"})
            continue
        why = []
        via = f"call {qual} @ {site}"
        lo, hi = cnode.lineno, getattr(cnode, "end_lineno", cnode.lineno)
        if any(x.get("via") == via for x in rows) or any(
                (x.get("raised_at") or "").rpartition(":")[0] == cm.rel and lo <= I._line(x.get("raised_at")) <= hi for x in rows):
            why.append("contributes-rows")
        commits = [e for e in P._events(cnode) if e["kind"] == "call" and P._leaf(e["node"].func) in F.TX_CALLS]

        def committed(e) -> bool:
            gs = [g for g, _ in e["guards"]]
            return any(c["line"] < e["line"] and [g for g, _ in c["guards"]] == gs[:len(c["guards"])] for c in commits)

        if len({committed(e) for e in cands}) > 1:
            why.append("commit-differs")
        if not why:
            collapsed.append({**base, "reason": "arms change neither exit nor commit"})
            continue
        sets.append((site, name, cfid, cm, [(e, e is fall) for e in sorted(cands, key=lambda e: e["line"])], why))
    return sets, collapsed


def returns_part(repo: Path, forms: dict) -> dict:
    stats = {"returns": 0, "branch_returns": 0, "branches": 0, "handlers_expanded": 0, "collapsed": {}}
    r_entries, b_entries, pending = [], [], []
    for key, v, m, fn in _handlers(repo, forms):
        fid = f"{m.rel}::{fn.name}"
        rets = []
        for e in returns_of(fn):
            val = _value(e)
            if val is not None and P._response_exit(val.value if isinstance(val, ast.Await) else val, m, repo):
                continue                                  # a returned refusal is already a produced row
            status, state = _success(val, m, v.get("declared")) if val is not None else (((v.get("declared") or {}).get("success") or {}).get("status"), "default")
            row = _row(fid, m.rel, e, 0, status=status, state=state)
            rets.append(row)
            r_entries.append((_tuple_r(row, e), I._pos(row["at"]), row))
        sets, collapsed = _deciding(repo, m, fn, v, fid)
        branches = []
        for site, name, cfid, cm, arms, why in sets:
            for e, fall in arms:
                ret = _row(cfid, cm.rel, e, 1, status=None, state="n/a", site=site)
                if fall:
                    ret["kind"] = "fall-through" if ret["kind"] == "return" else ret["kind"]
                rets.append(ret)
                r_entries.append((_tuple_r(ret, e), I._pos(ret["at"]), ret))
                br = {"site": site, "call": name, "fn": cfid, "pred": ret.get("pred"), "after": ret.get("after") or [],
                      "token": "fall-through" if fall else _token(ret.get("pred")), "why": list(why), "_ret": ret}
                branches.append(br)
                b_entries.append(([cfid, [g for g, _ in e["guards"]], list(e["after"])], I._pos(ret["at"]), br))
        stats["returns"] += sum(1 for r in rets if r["depth"] == 0)
        stats["branch_returns"] += sum(1 for r in rets if r["depth"] == 1)
        stats["branches"] += len(branches)
        stats["handlers_expanded"] += 1 if sets else 0
        for c in collapsed:
            stats["collapsed"][c["reason"]] = stats["collapsed"].get(c["reason"], 0) + 1
        pending.append((v, rets, branches, collapsed))
    for (t, pos, row), ident in zip(r_entries, I.ranked("r", [(t, pos) for t, pos, _ in r_entries])):
        row["id"] = ident
    for (t, pos, row), ident in zip(b_entries, I.ranked("b", [(t, pos) for t, pos, _ in b_entries])):
        row["id"] = ident
    for v, rets, branches, collapsed in pending:
        v["returns"] = sorted(rets, key=lambda r: (r["depth"], I._line(r.get("site")), I._line(r["at"])))
        for br in branches:
            br["return"] = br.pop("_ret")["id"]
        if branches:
            v["branches"] = [{"id": b["id"], **{k: b[k] for k in ("site", "call", "fn", "pred", "after", "token", "return", "why")}} for b in branches]
        if collapsed:
            v["collapsed"] = collapsed
    return stats


def _is_path(subject: str | None) -> bool:
    s = subject or ""
    return s in _PATH_SUBJECTS or s.endswith(".url.path")


class _Subst(ast.NodeTransformer):
    def __init__(self, table: dict) -> None:
        self.table = table

    def visit_Attribute(self, node: ast.Attribute):
        src = ast.unparse(node)
        return ast.parse(self.table[src], mode="eval").body if src in self.table else self.generic_visit(node)


def conditions_part(repo: Path, forms: dict) -> tuple[dict, dict]:
    conds: dict = {}
    cache: dict = {}
    stats = {"conditions": 0, "applies_false": 0, "applies_true": 0, "when_for_path": 0}
    for e in (forms.get("endpoints") or {}).values():
        for v in e.get("variants") or [e]:
            fp = v.get("full_path") or ""
            for r in v.get("produced") or []:
                if r.get("phase") != "middleware" or not r.get("when"):
                    continue
                file = str(r.get("site") or r.get("at") or "").rpartition(":")[0]
                ck = (file, r.get("via"), r["when"])
                if ck not in cache:
                    m = P._mod(repo, file)
                    cache[ck] = S.terms(repo, m, r.get("via"), r["when"]) if m else []
                    conds[f"{r.get('via')}: {r['when']}"] = {"via": r.get("via"), "when": r["when"], "file": file, "terms": cache[ck]}
                terms = cache[ck]
                known = {}
                for t in terms:
                    if t["kind"] in ("in", "not-in") and _is_path(t.get("subject")):
                        known[t["src"]] = (fp in t["values"]) == (t["kind"] == "in")
                    elif t["kind"] == "startswith" and _is_path(t.get("subject")):
                        known[t["src"]] = any(fp.startswith(x) for x in t["values"])
                val, residual = S.evaluate(r["when"], known)
                if val is False:
                    r["applies"] = False
                    stats["applies_false"] += 1
                elif val is True:
                    r["applies"] = True
                    stats["applies_true"] += 1
                elif residual:
                    table = {t["src"]: t["expr"] for t in terms if t["kind"] == "expr" and t.get("expr")}
                    r["when_for_path"] = ast.unparse(_Subst(table).visit(ast.parse(residual, mode="eval").body))
                    stats["when_for_path"] += 1
    stats["conditions"] = len(conds)
    return dict(sorted(conds.items())), stats


def run(forms: dict, ctx: dict) -> dict:
    """The paths arm's Slice 3 parts: ``returns`` (returns · branches · collapsed) and ``conditions``."""
    repo, parts = Path(ctx["repo"]), ctx["parts"]
    stats: dict = {}
    if "returns" in parts:
        stats.update(returns_part(repo, forms))
    if "conditions" in parts:
        forms["conditions"], got = conditions_part(repo, forms)
        stats.update(got)
    return {"version": 1, "stats": stats,
            "options": {"expand_branches": F.OPTIONS["expand_branches"], "exempt_rows": F.OPTIONS["exempt_rows"]}}


run.parts = PARTS
