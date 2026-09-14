"""Element forms — the SHORT arm's SCHEMA form and the 422 cases (amendment 1 §A2 Slice 4 · A6 · critic gap G2).

A request schema decides which bodies FastAPI refuses with 422, and pydantic names every refusal: a missing field, a
string too long, an unknown extra key, a validator's ``ValueError``. This part reads each request schema the archmap
lists into ``schemas{}`` (fields, constraints, ``extra``, validator rules), then turns every validation row of an endpoint
into ``cases[]`` — one per rule a request can break, with the pydantic error type (``_a3_forms_short.PYDANTIC_ERRORS``), the
full ``loc`` (``body.dietary.allergens``) and the line that holds the rule. A validator that calls a repo helper is followed
ONE level with the call's keywords substituted, so a guard those keywords falsify (``allowed is not None`` when no
``allowed=`` is passed) drops its rule; an allow-list read at runtime (``allergen_codes()``) reads ``allowed: unknown``.
Per-annotation type errors collapse to ``types: "collapsed"``. A dependency parameter's cases are not read (said so).
It also builds the two body-parse ``framework_exits[]`` FastAPI answers before any dependency runs.
"""
from __future__ import annotations

import ast
import copy
from pathlib import Path

import _a3_code as C
import _a3_forms_ids as I
import _a3_forms_settings as S
import _a3_forms_short as SH
import _a3_paths as P

PARTS = ("schema",)
_MODEL_BASES = frozenset({"BaseModel"})
_ENUM_BASES = frozenset({"Enum", "StrEnum", "IntEnum"})
_VALIDATORS = frozenset({"field_validator", "validator", "model_validator", "root_validator"})
_OPTIONAL = frozenset({"Optional"})
_UNION = frozenset({"Union"})
_SEQ = {"list": "list", "List": "list", "Sequence": "list", "set": "set", "Set": "set", "frozenset": "frozenset",
        "tuple": "tuple", "Tuple": "tuple", "dict": "dict", "Dict": "dict", "Mapping": "dict"}
_SCALARS = frozenset({"str", "int", "float", "bool", "bytes", "UUID", "date", "datetime", "time", "timedelta", "Decimal"})


# ── constants ────────────────────────────────────────────────────────────────────────────────────────
def const_value(repo: Path, m, node, depth: int = 0):
    """An int/float/str scalar or a tuple of them — a literal, ``frozenset({…})``, or a module constant one import away.
    ``_a3_paths._literal`` reads string tuples only; allow-lists here are often ints (``ALLOWED_SERVINGS``)."""
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float, str)) and not isinstance(node.value, bool):
        return node.value
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub) and isinstance(node.operand, ast.Constant) \
            and isinstance(node.operand.value, (int, float)):
        return -node.operand.value
    if isinstance(node, (ast.Tuple, ast.List, ast.Set)):
        vals = [const_value(repo, m, e, depth + 1) for e in node.elts]
        return tuple(vals) if vals and all(v is not None for v in vals) else None
    if isinstance(node, ast.Call) and P._leaf(node.func) in ("frozenset", "set", "tuple", "list") and len(node.args) == 1:
        return const_value(repo, m, node.args[0], depth + 1)
    if isinstance(node, ast.Name) and m is not None and depth < 4:
        r = P._resolve(repo, m, node.id)
        if r and r[1] in r[0].assigns:
            return const_value(repo, r[0], r[0].assigns[r[1]], depth + 1)
    return None


# ── the schema form ──────────────────────────────────────────────────────────────────────────────────
def _is_model(repo: Path, m, node: ast.ClassDef) -> bool:
    return any({P._leaf(b) for b in c.bases} & _MODEL_BASES for _, c in S._chain(repo, m, node)) \
        or bool(P._bases(repo, m, node.name) & _MODEL_BASES)


def _extra(chain: list) -> tuple:
    """``(extra, file:line)`` from ``model_config = ConfigDict(extra=…)`` / ``{"extra": …}`` or ``class Config: extra = …``."""
    def word(v):
        if isinstance(v, ast.Constant) and isinstance(v.value, str):
            return v.value
        return v.attr if isinstance(v, ast.Attribute) else None
    for cm, c in chain:
        for it in c.body:
            if isinstance(it, ast.ClassDef) and it.name == "Config":
                for s in it.body:
                    if isinstance(s, ast.Assign) and any(getattr(t, "id", None) == "extra" for t in s.targets) and word(s.value):
                        return word(s.value), f"{cm.rel}:{s.lineno}"
                continue
            tgt = it.targets[0] if isinstance(it, ast.Assign) and it.targets else it.target if isinstance(it, ast.AnnAssign) else None
            if getattr(tgt, "id", None) != "model_config":
                continue
            if isinstance(it.value, ast.Call):
                for kw in it.value.keywords:
                    if kw.arg == "extra" and word(kw.value):
                        return word(kw.value), f"{cm.rel}:{it.lineno}"
            elif isinstance(it.value, ast.Dict):
                for k, v in zip(it.value.keys, it.value.values):
                    if isinstance(k, ast.Constant) and k.value == "extra" and word(v):
                        return word(v), f"{cm.rel}:{it.lineno}"
    return None, None


def _constraints(repo: Path, m, call: ast.Call) -> dict:
    out = {}
    for kw in call.keywords:
        if kw.arg in SH.PYDANTIC_ERRORS:
            val = const_value(repo, m, kw.value)
            out[kw.arg] = val if val is not None else ast.unparse(kw.value)
    return out


def annotation(repo: Path, m, node) -> dict:
    """``{family, optional, item?, literal?, model?: (module, ClassDef), enum?, constraints}`` of one annotation."""
    out: dict = {"family": None, "optional": False, "constraints": {}}

    def walk(n) -> None:
        if isinstance(n, ast.Constant) and n.value is None:
            out["optional"] = True
            return
        if isinstance(n, ast.BinOp) and isinstance(n.op, ast.BitOr):
            walk(n.left)
            walk(n.right)
            return
        if isinstance(n, ast.Subscript):
            base = P._leaf(n.value)
            elts = n.slice.elts if isinstance(n.slice, ast.Tuple) else [n.slice]
            if base in _OPTIONAL:
                out["optional"] = True
                walk(elts[0])
            elif base in _UNION:
                for e in elts:
                    walk(e)
            elif base == "Annotated":
                walk(elts[0])
                for meta in elts[1:]:
                    if isinstance(meta, ast.Call) and P._leaf(meta.func) == "Field":
                        out["constraints"].update(_constraints(repo, m, meta))
            elif base == "Literal":
                out["family"] = "literal"
                out["literal"] = [const_value(repo, m, e) for e in elts]
            elif base in _SEQ:
                out["family"] = _SEQ[base]
                if elts:
                    out["item"] = annotation(repo, m, elts[0])
            else:
                walk(n.value)
            return
        if isinstance(n, ast.Call) and P._leaf(n.func) in SH.CONSTRAINED_TYPES:
            out["family"] = SH.CONSTRAINED_TYPES[P._leaf(n.func)]
            out["constraints"].update(_constraints(repo, m, n))
            return
        leaf = P._leaf(n)
        if leaf in _SCALARS:
            out["family"] = out["family"] or leaf
            return
        if leaf in _SEQ:
            out["family"] = _SEQ[leaf]
            return
        r = S._class(repo, m, leaf) if leaf else None
        if r:
            cm, cls = r
            if _is_model(repo, cm, cls):
                out["family"], out["model"] = "model", r
            elif {P._leaf(b) for b in cls.bases} & _ENUM_BASES or P._bases(repo, cm, cls.name) & _ENUM_BASES:
                out["family"], out["enum"] = "enum", f"{cm.rel}::{cls.name}"
                return
        elif leaf and leaf not in ("None", "Any"):
            out["family"] = out["family"] or leaf

    walk(node)
    return out


def _fields(repo: Path, chain: list) -> list[dict]:
    out: dict = {}
    for cm, c in reversed(chain):                         # bases first; the class itself overrides
        for it in c.body:
            if not (isinstance(it, ast.AnnAssign) and isinstance(it.target, ast.Name)) or it.target.id == "model_config":
                continue
            if P._leaf(it.annotation.value if isinstance(it.annotation, ast.Subscript) else it.annotation) == "ClassVar":
                continue
            a = annotation(repo, cm, it.annotation)
            row = {"name": it.target.id, "at": f"{cm.rel}:{it.lineno}", "annotation": P._unp(it.annotation), "_ann": a,
                   "constraints": dict(a["constraints"])}
            default, required = it.value, it.value is None
            if isinstance(default, ast.Call) and P._leaf(default.func) == "Field":
                row["constraints"].update(_constraints(repo, cm, default))
                dflt = next((k.value for k in default.keywords if k.arg == "default"), default.args[0] if default.args else None)
                factory = any(k.arg == "default_factory" for k in default.keywords)
                required = not factory and (dflt is None or (isinstance(dflt, ast.Constant) and dflt.value is Ellipsis))
                alias = next((k.value.value for k in default.keywords if k.arg in ("validation_alias", "alias")
                              and isinstance(k.value, ast.Constant) and isinstance(k.value.value, str)), None)
                if alias:
                    row["alias"] = alias
            row["required"] = required
            out[row["name"]] = row
    return list(out.values())


# ── validators ───────────────────────────────────────────────────────────────────────────────────────
def _bound(fn, call: ast.Call | None) -> dict:
    """The helper's parameters → the call site's expressions (defaults where the call does not pass one)."""
    args = fn.args
    params = [a.arg for a in args.posonlyargs + args.args]
    out = dict(zip(params[len(params) - len(args.defaults):], args.defaults))
    out.update({a.arg: d for a, d in zip(args.kwonlyargs, args.kw_defaults) if d is not None})
    for a in args.kwonlyargs:
        out.setdefault(a.arg, None)
    if call is not None:
        out.update(dict(zip(params, call.args)))
        out.update({k.arg: k.value for k in call.keywords if k.arg})
    return out


def _falsified(pred: str, bound: dict) -> bool:
    """``allowed is not None`` with ``allowed`` bound to nothing (its default ``None``) → falsified."""
    try:
        node = ast.parse(pred, mode="eval").body
    except SyntaxError:
        return False
    if isinstance(node, ast.Compare) and len(node.ops) == 1 and isinstance(node.left, ast.Name) and node.left.id in bound \
            and isinstance(node.comparators[0], ast.Constant) and node.comparators[0].value is None:
        val = bound[node.left.id]
        is_none = val is None or (isinstance(val, ast.Constant) and val.value is None)
        return is_none if isinstance(node.ops[0], ast.IsNot) else (not is_none if isinstance(node.ops[0], ast.Is) else False)
    return False


def _allowed(repo: Path, m, fn, pred: str, bound: dict) -> dict | None:
    """The allow-list a guard tests against: ``{values}`` from a constant, ``{state: unknown, reason: runtime: f()}`` from a call."""
    try:
        node = ast.parse(pred, mode="eval").body
    except SyntaxError:
        return None
    local = {}
    for st in ast.walk(fn):
        if isinstance(st, ast.Assign) and len(st.targets) == 1 and isinstance(st.targets[0], ast.Name):
            local.setdefault(st.targets[0].id, st.value)
    tests = []
    for n in ast.walk(node):
        if isinstance(n, ast.Compare) and len(n.ops) == 1 and isinstance(n.ops[0], ast.NotIn):
            tests.append(n.comparators[0])
        elif isinstance(n, ast.Name) and isinstance(local.get(n.id), ast.ListComp):
            for gen in local[n.id].generators:
                for cond in gen.ifs:
                    if isinstance(cond, ast.Compare) and len(cond.ops) == 1 and isinstance(cond.ops[0], ast.NotIn):
                        tests.append(cond.comparators[0])
    for t in tests:
        src = bound.get(t.id) if isinstance(t, ast.Name) and t.id in bound else local.get(t.id) if isinstance(t, ast.Name) else t
        src = t if src is None else src
        if isinstance(src, ast.Call):
            return {"state": "unknown", "reason": f"runtime: {ast.unparse(src)}"}
        vals = const_value(repo, m, src)
        if vals is not None:
            return {"values": list(vals) if isinstance(vals, tuple) else [vals]}
    return None


def _message(repo: Path, m, bm, exc: ast.Call, bound: dict) -> str | None:
    """The refusal text, with each ``{name}`` a constant resolves filled in — a call-site keyword against the caller's
    module ``bm``, a module constant against ``m``; a runtime value (``{len(cleaned)}``) stays a placeholder."""
    if not exc.args:
        return None
    arg = copy.deepcopy(exc.args[0])
    if isinstance(arg, ast.JoinedStr):
        parts = []
        for v in arg.values:
            if isinstance(v, ast.Constant):
                parts.append(str(v.value))
                continue
            val = None
            if isinstance(v, ast.FormattedValue) and isinstance(v.value, ast.Call) and P._leaf(v.value.func) in ("list", "sorted", "tuple") \
                    and len(v.value.args) == 1 and isinstance(v.value.args[0], ast.Name):
                got = const_value(repo, m, v.value.args[0])
                if isinstance(got, tuple):
                    parts.append(str(sorted(got) if P._leaf(v.value.func) == "sorted" else list(got)))
                    continue
            if isinstance(v, ast.FormattedValue) and isinstance(v.value, ast.Name):
                if v.value.id in bound and bound[v.value.id] is not None:
                    val = const_value(repo, bm, bound[v.value.id])
                elif v.value.id not in bound:
                    val = const_value(repo, m, v.value)
            parts.append(str(val) if val is not None and not isinstance(val, tuple) else "{" + ast.unparse(v.value) + "}")
        return "".join(parts)
    return arg.value if isinstance(arg, ast.Constant) and isinstance(arg.value, str) else ast.unparse(arg)


def _range(repo: Path, m, pred: str) -> list | None:
    """``not MIN <= value <= MAX`` → ``[MIN, MAX]`` when both ends resolve to numbers."""
    try:
        node = ast.parse(pred, mode="eval").body
    except SyntaxError:
        return None
    for n in ast.walk(node):
        if isinstance(n, ast.Compare) and len(n.ops) == 2 and all(isinstance(o, (ast.Lt, ast.LtE)) for o in n.ops):
            lo, hi = const_value(repo, m, n.left), const_value(repo, m, n.comparators[-1])
            if isinstance(lo, (int, float)) and isinstance(hi, (int, float)):
                return [lo, hi]
    return None


def _rules(repo: Path, m, fn, bound: dict | None = None, hop: bool = True, bm=None) -> tuple[list, list]:
    """A validator (or the helper it calls, one hop) → ``(rules, normalisers)``; ``bm`` is the caller's module the
    bound keywords are resolved against."""
    bound = bound or {}
    bm = bm or m
    rules: list = []
    norms = sorted({n.func.attr for n in ast.walk(fn) if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                    and n.func.attr in SH.NORMALISERS})
    for e in P._events(fn):
        if e["kind"] == "raise" and isinstance(e["node"].exc, ast.Call):
            cls = P._leaf(e["node"].exc.func)
            if cls not in SH.RAISE_ERRORS:
                continue
            pred = " and ".join(g for g, _ in e["guards"]) or None
            if pred and any(_falsified(g, bound) for g, _ in e["guards"]):
                continue                                  # the call site's keywords make this guard false
            etype = SH.RAISE_ERRORS[cls]
            if etype is None and e["node"].exc.args and isinstance(e["node"].exc.args[0], ast.Constant):
                etype = e["node"].exc.args[0].value       # PydanticCustomError("my_type", …)
            rule = {"type": etype or "unknown", "at": f"{m.rel}:{e['line']}", "msg": _message(repo, m, bm, e["node"].exc, bound)}
            if pred:
                rule["pred"] = pred
                bounds = _range(repo, m, pred)
                if bounds:
                    rule["range"] = bounds
                allowed = _allowed(repo, m, fn, pred, bound)
                if allowed:
                    rule["allowed"] = allowed
            if bound:
                consts = {k: const_value(repo, bm, v) for k, v in bound.items() if v is not None}
                rule["bound"] = {k: v for k, v in sorted(consts.items()) if v is not None}
            rules.append(rule)
        elif e["kind"] == "call" and hop:
            r = P._callee(repo, m, fn, e["node"])
            if r and r[1] in r[0].defs:
                sub, sub_norms = _rules(repo, r[0], r[0].defs[r[1]], _bound(r[0].defs[r[1]], e["node"]), hop=False, bm=m)
                for rule in sub:
                    rule["via"] = f"{r[1]} @ {m.rel}:{e['line']}"
                rules += sub
                norms = sorted(set(norms) | set(sub_norms))
    return rules, norms


def _validators(repo: Path, chain: list) -> list[dict]:
    out = []
    for cm, c in chain:
        for it in c.body:
            if not isinstance(it, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            dec = next((d for d in it.decorator_list if P._leaf(d.func if isinstance(d, ast.Call) else d) in _VALIDATORS), None)
            if dec is None:
                continue
            kind = P._leaf(dec.func if isinstance(dec, ast.Call) else dec)
            fields = [a.value for a in (dec.args if isinstance(dec, ast.Call) else []) if isinstance(a, ast.Constant) and isinstance(a.value, str)]
            rules, norms = _rules(repo, cm, it)
            out.append({"name": it.name, "kind": kind, "fields": fields if kind in ("field_validator", "validator") else ["__model__"],
                        "at": f"{cm.rel}:{it.lineno}", "rules": rules, "normalises": norms})
    return out


def schema_form(repo: Path, m, node: ast.ClassDef) -> dict:
    chain = S._chain(repo, m, node)
    extra, extra_at = _extra(chain)
    return {"cls": node.name, "file": m.rel, "at": f"{m.rel}:{node.lineno}", "extra": extra or "ignore",
            "extra_state": "defined" if extra else "default", "extra_at": extra_at,
            "fields": _fields(repo, chain), "validators": _validators(repo, chain)}


# ── cases ────────────────────────────────────────────────────────────────────────────────────────────
def _form_for(repo: Path, key: str, mod, node: ast.ClassDef, forms_by_key: dict) -> dict:
    """The schema form a case reads: the claimed one, else one formed from the class a handler names and KEPT in the map
    (``claimed: false``), so no case ever names a schema ``schemas{}`` lacks."""
    if key not in forms_by_key:
        forms_by_key[key] = {**schema_form(repo, mod, node), "claimed": False}
    return forms_by_key[key]


def _join(prefix: str, name: str) -> str:
    return f"{prefix}.{name}" if prefix and name else prefix or name


def cases_of(repo: Path, key: str, form: dict, prefix: str, forms_by_key: dict, seen: frozenset, depth: int) -> list[dict]:
    """Every case one schema (and, recursively, the models its fields hold) contributes at ``prefix``."""
    cls, out = form["cls"], []
    if form["extra"] == "forbid":
        out.append({"id": f"case:schema:{cls}/__model__/extra_forbidden", "loc": prefix, "type": "extra_forbidden",
                    "rule": 'extra="forbid"', "at": form["extra_at"], "schema": key})
    for f in form["fields"]:
        loc, a = _join(prefix, f.get("alias") or f["name"]), f["_ann"]
        base = f"case:schema:{cls}/{f['name']}"
        if f["required"]:
            out.append({"id": f"{base}/missing", "loc": loc, "type": "missing", "at": f["at"], "schema": key})
        fam = a.get("family") or "*"
        for kw, val in f["constraints"].items():
            etype = SH.PYDANTIC_ERRORS[kw].get(fam if fam in SH.PYDANTIC_ERRORS[kw] else "*", "unknown")
            out.append({"id": f"{base}/{etype}", "loc": loc, "type": etype, "rule": f"{kw}={val}", "at": f["at"], "schema": key})
        if a.get("literal"):
            out.append({"id": f"{base}/literal_error", "loc": loc, "type": "literal_error", "at": f["at"], "schema": key,
                        "allowed": {"values": a["literal"]}})
        if a.get("enum"):
            out.append({"id": f"{base}/enum", "loc": loc, "type": "enum", "at": f["at"], "schema": key, "enum": a["enum"]})
        model = a.get("model") or (a.get("item") or {}).get("model")
        if model and depth < SH.OPTIONS["nest_depth"]:
            mkey = f"schema:{model[1].name}"
            if mkey not in seen:
                sub = _form_for(repo, mkey, model[0], model[1], forms_by_key)
                out += cases_of(repo, mkey, sub, loc if a.get("model") else f"{loc}.[]", forms_by_key, seen | {mkey}, depth + 1)
    for v in form["validators"]:
        for n, rule in enumerate(v["rules"]):
            for fld in v["fields"]:
                name = "" if fld == "__model__" else fld
                case = {"id": f"case:schema:{cls}/{fld}/{rule['type']}/{v['name']}.{n}", "loc": _join(prefix, name),
                        "type": rule["type"], "at": rule["at"], "schema": key, "validator": f"{form['file']}::{cls}.{v['name']}"}
                for k in ("msg", "pred", "allowed", "range", "bound", "via"):
                    if rule.get(k) is not None:
                        case[k] = rule[k]
                if v["normalises"]:
                    case["normalises"] = v["normalises"]
                out.append(case)
    return out


def _location(dflt, ann) -> str | None:
    for node in [dflt] + (list(ann.slice.elts[1:]) if isinstance(ann, ast.Subscript) and P._leaf(ann.value) == "Annotated"
                           and isinstance(ann.slice, ast.Tuple) else []):
        if isinstance(node, ast.Call) and P._leaf(node.func) in SH.PARAM_LOCATIONS:
            return SH.PARAM_LOCATIONS[P._leaf(node.func)]
    return None


def _embed(dflt, ann) -> bool:
    for node in [dflt] + (list(ann.slice.elts[1:]) if isinstance(ann, ast.Subscript) and isinstance(ann.slice, ast.Tuple) else []):
        if isinstance(node, ast.Call) and P._leaf(node.func) == "Body" and any(
                k.arg == "embed" and isinstance(k.value, ast.Constant) and k.value.value is True for k in node.keywords):
            return True
    return False


def endpoint_cases(repo: Path, v: dict, m, fn, forms_by_key: dict) -> dict:
    """For each validation row of one endpoint: ``cases[]``, ``schemas[]``, ``types``, ``unread`` (dependency parameters)."""
    args = fn.args
    params = list(args.posonlyargs) + list(args.args) + list(args.kwonlyargs)
    dflts = dict(zip([p.arg for p in (list(args.posonlyargs) + list(args.args))][len(list(args.posonlyargs) + list(args.args)) - len(args.defaults):], args.defaults))
    dflts.update({p.arg: d for p, d in zip(args.kwonlyargs, args.kw_defaults) if d is not None})
    anns = {p.arg: p.annotation for p in params}
    path_names = set()
    for dec in fn.decorator_list:
        if isinstance(dec, ast.Call) and dec.args and isinstance(dec.args[0], ast.Constant) and isinstance(dec.args[0].value, str):
            path_names |= {seg.strip("{}").split(":")[0] for seg in dec.args[0].value.split("/") if seg.startswith("{")}
    written = {"rows": 0, "cases": 0, "unread": 0}
    for row in v.get("produced") or []:
        if row.get("phase") != "validation":
            continue
        own = [p for p in row.get("params") or [] if "." not in p]
        info = {}
        for p in own:
            ann, dflt = anns.get(p), dflts.get(p)
            cls = P._class_of(repo, m, ann) if ann is not None else None
            loc = _location(dflt, ann) or ("path" if p in path_names else "body" if cls else "query")
            info[p] = (ann, dflt, cls, loc)
        body_params = [p for p, (_, _, _, loc) in info.items() if loc == "body"]
        embed = len(body_params) > 1 or any(_embed(info[p][1], info[p][0]) for p in body_params)
        cases, schemas = [], set()
        for p, (ann, dflt, cls, loc) in info.items():
            prefix = "body" if loc == "body" and not embed else f"{loc}.{p}"
            if cls is not None and _is_model(repo, cls[0], cls[0].classes[cls[1]]):
                key = f"schema:{cls[1]}"
                form = _form_for(repo, key, cls[0], cls[0].classes[cls[1]], forms_by_key)
                got = cases_of(repo, key, form, prefix, forms_by_key, frozenset({key}), 0)
                for c in got:
                    c["param"] = p
                    schemas.add(c["schema"])
                cases += got
                if dflt is None:
                    cases.append({"id": f"case:framework:{p}/missing", "loc": prefix, "type": "missing", "state": "default",
                                  "param": p, "source": "fastapi/dependencies/utils.py request_body_to_args"})
            else:
                a = annotation(repo, m, ann) if ann is not None else {"constraints": {}}
                cons = dict(a["constraints"])
                if isinstance(dflt, ast.Call) and P._leaf(dflt.func) in SH.PARAM_LOCATIONS:
                    cons.update(_constraints(repo, m, dflt))
                fam = a.get("family") or "*"
                for kw, val in cons.items():
                    etype = SH.PYDANTIC_ERRORS[kw].get(fam if fam in SH.PYDANTIC_ERRORS[kw] else "*", "unknown")
                    cases.append({"id": f"case:param:{p}/{etype}", "loc": prefix, "type": etype, "rule": f"{kw}={val}", "param": p})
                required = dflt is None or (isinstance(dflt, ast.Call) and P._leaf(dflt.func) in SH.PARAM_LOCATIONS
                                            and (not dflt.args or (isinstance(dflt.args[0], ast.Constant) and dflt.args[0].value is Ellipsis))
                                            and not any(k.arg in ("default", "default_factory") for k in dflt.keywords))
                if required and not a.get("optional"):
                    cases.append({"id": f"case:param:{p}/missing", "loc": prefix, "type": "missing", "param": p})
        row["cases"] = cases
        row["schemas"] = sorted(schemas)
        row["types"] = SH.OPTIONS["s_type_cases"]
        unread = [p for p in row.get("params") or [] if "." in p]
        if unread:
            row["unread"] = [{"param": p, "reason": "dependency parameter: rules not read"} for p in unread]
        written["rows"] += 1
        written["cases"] += len(cases)
        written["unread"] += len(unread)
    return written


def schema_part(repo: Path, forms: dict, amap: dict) -> tuple[dict, dict, list]:
    forms_by_key: dict = {}
    for slug in sorted(amap.get("entities") or {}):
        for sd in ((amap["entities"].get(slug) or {}).get("schemas") or []):
            m = P._mod(repo, sd.get("file"))
            node = m.classes.get(sd.get("cls")) if m else None
            if node is None or not _is_model(repo, m, node):
                continue
            key = f"schema:{node.name}"
            form = schema_form(repo, m, node)
            if key in forms_by_key and forms_by_key[key]["file"] != form["file"]:
                prior = forms_by_key[key]
                forms_by_key[key] = {"variants": (prior.get("variants") or [prior]) + [form]}
            else:
                forms_by_key.setdefault(key, form)
    stats = {"schemas": 0, "schemas_unclaimed": 0, "rows": 0, "cases": 0, "unread": 0, "runtime_allowlist": 0}
    lookup = {k: f for k, f in forms_by_key.items() if "variants" not in f}   # grows with every class a handler names
    consumers: dict = {}
    for key, e in (forms.get("endpoints") or {}).items():
        for v in e.get("variants") or [e]:
            file, _, name = str(v.get("handler") or "").partition("::")
            m = P._mod(repo, file) if file else None
            fn, _dec = P._find_handler(m, {"fn": name, "method": v.get("method"), "path": v.get("path")}) if m else (None, None)
            if fn is None:
                continue
            got = endpoint_cases(repo, v, m, fn, lookup)
            for s in ("rows", "cases", "unread"):
                stats[s] += got[s]
            for row in v.get("produced") or []:
                for c in row.get("cases") or []:
                    if (c.get("allowed") or {}).get("state") == "unknown":
                        stats["runtime_allowlist"] += 1
                for s in row.get("schemas") or []:
                    consumers.setdefault(s, set()).add(key)
    for k, form in lookup.items():                         # a colliding claimed name stays its variants; a new class joins
        forms_by_key.setdefault(k, form)
    stats["schemas"] = len(forms_by_key)
    stats["schemas_unclaimed"] = sum(1 for f in forms_by_key.values() if f.get("claimed") is False)
    out, findings = {}, []
    for key, form in sorted(forms_by_key.items()):
        clean = {k: v for k, v in form.items() if k != "fields"} if "variants" not in form else form
        if "fields" in form:
            clean["fields"] = [{k: v for k, v in f.items() if k != "_ann"} for f in form["fields"]]
            clean["consumers"] = len(consumers.get(key, ()))
            if clean["consumers"] and form["extra_state"] == "default":
                findings.append({"id": "extra-ignored", "slot": "S6", "subject": key, "consumers": clean["consumers"]})
        out[key] = clean
    return out, stats, findings


# ── the body-parse framework exits (paths.framework) ────────────────────────────────────────────────
def reads_body(repo: Path, m, fn) -> bool:
    """Whether FastAPI reads a request body for this handler: a parameter marked ``Body()`` / ``Form()`` / ``File()``, or a
    parameter typed by a pydantic model that no ``Depends`` provides."""
    args = fn.args
    pos = list(args.posonlyargs) + list(args.args)
    dflts = dict(zip([p.arg for p in pos][len(pos) - len(args.defaults):], args.defaults))
    dflts.update({p.arg: d for p, d in zip(args.kwonlyargs, args.kw_defaults) if d is not None})
    for p in pos + list(args.kwonlyargs):
        if p.arg in ("self", "cls"):
            continue
        ann, dflt = p.annotation, dflts.get(p.arg)
        if P._is_depends(dflt) or (ann is not None and C._annotated_depends(ann)):
            continue
        loc = _location(dflt, ann)
        if loc == "body":
            return True
        if loc is None and ann is not None:
            cls = P._class_of(repo, m, ann)
            if cls and _is_model(repo, cls[0], cls[0].classes[cls[1]]):
                return True
    return False


def framework_exits(repo: Path, forms: dict) -> dict:
    """Two ``x:`` exits FastAPI answers before any dependency runs, on every endpoint whose handler reads a body."""
    entries, hosts = [], []
    for key in sorted(forms.get("endpoints") or {}):
        e = forms["endpoints"][key]
        for v in e.get("variants") or [e]:
            file, _, name = str(v.get("handler") or "").partition("::")
            m = P._mod(repo, file) if file else None
            fn, _dec = P._find_handler(m, {"fn": name, "method": v.get("method"), "path": v.get("path")}) if m else (None, None)
            if fn is None or not reads_body(repo, m, fn):
                continue
            rows = [dict(x) for x in SH.FRAMEWORK_BODY_EXITS]
            for r in rows:
                entries.append(([r["phase"], r["status"], v.get("handler"), None, None, None, r["detail"]], ()))
            hosts.append((v, rows))
    ids = iter(I.ranked("x", entries))
    for v, rows in hosts:
        for r in rows:
            r["id"] = next(ids)
        v["framework_exits"] = rows
    return {"framework_endpoints": len(hosts)}


def run(forms: dict, ctx: dict) -> dict:
    """The short arm's Slice 4 part: ``schema`` (schemas{} + cases on validation rows)."""
    repo, parts = Path(ctx["repo"]), ctx["parts"]
    stats: dict = {}
    if "schema" in parts:
        forms["schemas"], stats, findings = schema_part(repo, forms, ctx["amap"])
        if findings:
            forms["arm_findings"].setdefault("short", []).extend(findings)
            stats["findings"] = {"extra-ignored": len(findings)}
    return {"version": 1, "stats": stats, "options": dict(SH.OPTIONS)}


run.parts = PARTS
