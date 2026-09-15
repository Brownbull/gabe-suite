"""Element forms — MIRROR short forms: the short arm's ``mirror`` part (amendment 1 §A2 Slice 10c).

One rule often lives in two places: a request schema and the table it writes, a single-item schema and its batch sibling,
a response schema and the model it reads from, a setting and the constant beside it. ``mirrors{"mirror:<subject>"}`` pairs
the copies and says whether they agree. Pairing (``OPTIONS.mirror_pairing`` — ``flow+orm``, the only value built):

* ``flow`` — a model constructor keyword fed by a field of a schema-typed receiver (a parameter annotated with the schema,
  a loop variable over a schema's list field, ``**x.model_dump()``);
* ``sibling`` — a schema constructor fed the same way by another schema, when the rebuilt schema takes a request or feeds a
  model (a response built from a request enforces nothing);
* ``orm`` — a ``from_attributes`` response schema and the model its name strips to (``PantryItemResponse`` →
  ``PantryItem``; ``_a3_code._schema_orm``);
* ``flag-pair`` — a setting and the constant read beside it (``settings{}`` ``effective``);
* ``setting-copy`` — a module constant named like a setting that is never read beside it.

Rules: ``length`` · ``bound`` · ``allowed`` · ``default`` · ``nullable`` · ``pattern`` (schema ↔ model, schema ↔ schema)
and ``value`` (setting ↔ constant). Verdicts ``agree`` (counted, never listed) · ``disagree`` · ``schema-only`` ·
``model-only``; a model subject lists ``bypass_writers`` — its constructor sites that set the column from something no
schema checked. Findings ``mirror-disagree`` (nag) and ``schema-only-bound`` (count: a schema bound the table lacks while a
writer bypasses the schema).
"""
from __future__ import annotations

import ast
import re
from pathlib import Path

import _a3_code as C
import _a3_forms as F
import _a3_forms_migrate as MG
import _a3_forms_setting as ST
import _a3_forms_settings as S
import _a3_paths as P

SUFFIXES = ("Response", "Public", "Detail", "Schema", "Read", "Out", "DTO")
BOUND_KW = ("gt", "ge", "lt", "le")
LIST_HEADS = frozenset({"list", "List", "Sequence", "tuple", "Tuple", "set", "Set"})
DUMP_CALLS = frozenset({"model_dump", "dict"})


def _site_key(at: str) -> tuple:
    file, _, line = at.rpartition(":")
    return file, int(line) if line.isdigit() else 0


def _class_name(ann) -> str | None:
    """The class an annotation names, through ``Optional`` · ``X | None`` · ``Annotated``."""
    if ann is None:
        return None
    if isinstance(ann, ast.BinOp):
        left_none = isinstance(ann.left, ast.Constant) and ann.left.value is None
        return _class_name(ann.right if left_none else ann.left)
    if isinstance(ann, ast.Subscript):
        elts = ann.slice.elts if isinstance(ann.slice, ast.Tuple) else [ann.slice]
        return _class_name(elts[0]) if P._leaf(ann.value) in ("Optional", "Annotated") else None
    return P._leaf(ann)


def _member(repo: Path, m, node):
    """``Cls.MEMBER`` → the member's literal value, the class resolved from the module (an Enum default)."""
    if not (isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name)):
        return None
    r = S._class(repo, m, node.value.id)
    return next((MG._lit(it.value) for it in (r[1].body if r else []) if isinstance(it, ast.Assign)
                 and any(isinstance(t, ast.Name) and t.id == node.attr for t in it.targets)), None)


def _item_class(annotation: str | None) -> str | None:
    """``list[Inner]`` → ``Inner``."""
    try:
        node = ast.parse(annotation or "", mode="eval").body
    except SyntaxError:
        return None
    if isinstance(node, ast.BinOp):
        node = node.left
    if isinstance(node, ast.Subscript) and P._leaf(node.value) in LIST_HEADS:
        return _class_name(node.slice.elts[0] if isinstance(node.slice, ast.Tuple) else node.slice)
    return None


def _schema_facts(repo: Path, forms: dict) -> dict:
    out = {}
    for key, s in sorted((forms.get("schemas") or {}).items()):
        for v in (s.get("variants") or [s]):
            cls, rel = v.get("cls") or key.split(":", 1)[1], v.get("file")
            m = P._mod(repo, rel) if rel else None
            node = m.classes.get(cls) if m else None
            if node is None or cls in out:
                continue
            decl = {}
            for cm, c in reversed(S._chain(repo, m, node)):          # a field a project base declares is the subclass's too
                decl.update({it.target.id: (cm, it) for it in c.body if isinstance(it, ast.AnnAssign) and isinstance(it.target, ast.Name)})
            fields = {}
            for f in v.get("fields") or []:
                (dm, it), fact = decl.get(f["name"], (None, None)), {"at": f.get("at"), "constraints": dict(f.get("constraints") or {}), "annotation": f.get("annotation")}
                if it is not None:
                    ann = it.annotation
                    if isinstance(ann, ast.Name) and isinstance(dm.assigns.get(ann.id), ast.Subscript):
                        ann = dm.assigns[ann.id]                 # BatchItemKind = Literal[...]
                    names, nullable, literal, _ = ST._types(ann)
                    fact["nullable"] = nullable
                    allowed = literal if literal is not None else ST._enum_values(repo, dm, names[0] if names else None)
                    if allowed is not None:
                        fact["allowed"] = sorted(map(str, allowed))
                    dv = it.value
                    if isinstance(dv, ast.Call) and P._leaf(dv.func) == "Field":
                        dv = next((k.value for k in dv.keywords if k.arg == "default"), dv.args[0] if dv.args else None)
                    if dv is not None and not (isinstance(dv, ast.Constant) and dv.value is Ellipsis):
                        lit = MG._lit(dv) if not isinstance(dv, ast.Attribute) else _member(repo, dm, dv)
                        fact["default"] = lit if lit is not None or isinstance(dv, ast.Constant) else ast.unparse(dv)[:60]
                fields[f["name"]] = fact
            out[cls] = {"key": key, "file": rel, "fields": fields, "orm": C._schema_orm(node)}
    return out


def _model_facts(forms: dict) -> dict:
    out = {}
    for key, md in sorted((forms.get("models") or {}).items()):
        sqls = [ck.get("sql") or "" for ck in (md.get("constraints") or {}).get("checks") or []]
        cols = {}
        for name, c in (md.get("columns") or {}).items():
            fact = {"at": f"{md['file']}:{c.get('at')}", "nullable": c.get("nullable")}
            length = re.match(r"^(String|VARCHAR|CHAR|Unicode)\((\d+)\)", c.get("type") or "")
            fact["length"] = int(length.group(2)) if length else None
            if "default" in c:
                fact["default"] = c["default"]
            col = re.escape(name)
            got = next((x for q in sqls if (x := re.search(rf"\b{col}\s+IN\s*\(([^)]*)\)", q, re.I))), None)
            if got:
                fact["allowed"] = sorted(v.strip().strip("'\"") for v in got.group(1).split(","))
            bound = [x.group(0) for q in sqls for x in re.finditer(rf"\b{col}\s*(>=|<=|>|<)\s*-?\d+(\.\d+)?", q)]
            if bound:
                fact["bound"] = bound
            pattern = next((q for q in sqls if re.search(rf"\b{col}\s*(~\*?|SIMILAR TO|REGEXP)", q, re.I)), None)
            if pattern:
                fact["pattern"] = pattern
            cols[c.get("attr", name)] = fact
        out.setdefault(md["cls"], {"key": key, "file": md["file"], "columns": cols})
    return out


def _typed(fn, name: str, schemas: dict, depth: int = 0) -> str | None:
    """The schema class a name holds inside ``fn``: a parameter annotated with it, or a loop variable over a schema's list field."""
    if fn is None or depth > 2:
        return None
    arg = next((p for p in fn.args.posonlyargs + fn.args.args + fn.args.kwonlyargs if p.arg == name), None)
    if arg is not None:
        c = _class_name(arg.annotation)
        return c if c in schemas else None
    for n in ST._own(fn):
        if not isinstance(n, (ast.For, ast.AsyncFor)):
            continue
        tgt, it = n.target, n.iter
        if isinstance(it, ast.Call) and P._leaf(it.func) == "enumerate" and it.args:
            it, tgt = it.args[0], (tgt.elts[1] if isinstance(tgt, ast.Tuple) and len(tgt.elts) == 2 else None)
        if isinstance(tgt, ast.Name) and tgt.id == name and isinstance(it, ast.Attribute) and isinstance(it.value, ast.Name):
            outer = _typed(fn, it.value.id, schemas, depth + 1)
            field = schemas[outer]["fields"].get(it.attr) if outer else None
            inner = _item_class(field.get("annotation")) if field else None
            return inner if inner in schemas else None
    return None


def _collect(repo: Path, code: list, schemas: dict, models: dict) -> tuple[dict, dict]:
    """``(pairs{(via, a_cls, a_field, b_cls, b_field): {how, sites}}, constructs{model: [(column, value, at, from_schema)]})``."""
    pairs, constructs = {}, {}
    targets = set(schemas) | set(models)
    rx = re.compile(r"\b(" + "|".join(map(re.escape, sorted(targets))) + r")\(") if targets else None
    for rel, p in code:
        if rx is None or not rx.search(ST._read(p)):
            continue
        m = P._mod(repo, rel)
        for qual, fn, _ in (ST._scopes(m) if m else []):
            nodes = list(ast.walk(fn)) if fn is not None else [n for st in m.tree.body if not isinstance(
                st, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) for n in ast.walk(st)]
            for call in nodes:
                if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id in targets):
                    continue
                target, at = call.func.id, f"{rel}:{call.lineno}"
                via = "flow" if target in models else "sibling"
                dest = models[target]["columns"] if target in models else schemas[target]["fields"]
                for k in call.keywords:
                    v = k.value
                    if k.arg is None:
                        if isinstance(v, ast.Call) and isinstance(v.func, ast.Attribute) and v.func.attr in DUMP_CALLS and isinstance(v.func.value, ast.Name):
                            src = _typed(fn, v.func.value.id, schemas)
                            for f in (schemas[src]["fields"] if src and src != target else {}):
                                if f in dest:
                                    pairs.setdefault((via, src, f, target, f), {"how": "dump", "sites": set()})["sites"].add(at)
                        continue
                    src = _typed(fn, v.value.id, schemas) if isinstance(v, ast.Attribute) and isinstance(v.value, ast.Name) else None
                    fed = bool(src and src != target and v.attr in schemas[src]["fields"])
                    if fed and k.arg in dest:
                        pairs.setdefault((via, src, v.attr, target, k.arg), {"how": "keyword", "sites": set()})["sites"].add(at)
                    if target in models:
                        constructs.setdefault(target, []).append((k.arg, ast.unparse(v)[:60], at, fed))
    for cls, s in schemas.items():
        if not s["orm"]:
            continue
        base = next((cls[: -len(x)] for x in SUFFIXES if cls.endswith(x) and cls[: -len(x)] in models), None)
        for f in (s["fields"] if base else {}):
            if f in models[base]["columns"]:
                pairs.setdefault(("orm", cls, f, base, f), {"how": "name", "sites": {s["fields"][f].get("at")}})
    return pairs, constructs


def _rules(via: str, a: dict, b: dict) -> list[dict]:
    rows = []
    sib = via == "sibling"

    def row(rule, verdict, av, bv):
        rows.append({"rule": rule, "verdict": verdict, "a": av, "b": bv})
    ac, bc = a.get("constraints") or {}, (b.get("constraints") or {}) if sib else {}
    al, bl = ac.get("max_length"), (bc.get("max_length") if sib else b.get("length"))
    if via != "orm" and (al is not None or bl is not None):
        if al == bl:
            row("length", "agree", al, bl)
        elif sib:
            row("length", "disagree", al, bl)
        else:
            row("length", "model-only" if al is None else "schema-only" if bl is None else "agree" if al <= bl else "disagree", al, bl)
    ab = {k: ac[k] for k in BOUND_KW if k in ac} or None
    bb = ({k: bc[k] for k in BOUND_KW if k in bc} or None) if sib else b.get("bound")
    if via != "orm" and (ab or bb):
        row("bound", ("agree" if ab == bb else "disagree") if sib else "agree" if ab and bb else "schema-only" if ab else "model-only", ab, bb)
    aa, ba = a.get("allowed"), b.get("allowed")
    if aa is not None and ba is not None:
        row("allowed", "agree" if sorted(aa) == sorted(ba) else "disagree", aa, ba)
    elif (aa is not None or ba is not None) and via != "orm":
        row("allowed", "disagree" if sib else "schema-only" if aa is not None else "model-only", aa, ba)
    if via != "orm" and "default" in a and "default" in b:      # one side required is another contract, not another value
        row("default", "agree" if ST._canon(a["default"]) == ST._canon(b["default"]) else "disagree", a["default"], b["default"])
    an, bn = a.get("nullable"), b.get("nullable")
    if isinstance(an, bool) and isinstance(bn, bool):
        bad = (bn and not an) if via == "orm" else (an and not bn)   # a NULL the receiving side refuses
        row("nullable", "disagree" if bad else "agree", an, bn)
    ap, bp = ac.get("pattern"), (bc.get("pattern") if sib else b.get("pattern"))
    if via != "orm" and (ap or bp):
        row("pattern", ("agree" if ap == bp else "disagree") if sib else "agree" if ap and bp else "schema-only" if ap else "model-only", ap, bp)
    return rows


def mirror_part(repo: Path, forms: dict) -> tuple[dict, dict, list]:
    """``(mirrors{"mirror:<subject>": form}, stats, findings)``."""
    if F.OPTIONS.get("mirror_pairing", "flow+orm") != "flow+orm":
        raise ValueError(f"mirror_pairing={F.OPTIONS['mirror_pairing']!r}: only 'flow+orm' is built")
    repo = Path(repo)
    code = [(rel, p) for rel, p in ST._walk_repo(repo) if rel.endswith(".py") and not ST.TEST_RX.search(rel)]
    schemas, models = _schema_facts(repo, forms), _model_facts(forms)
    pairs, constructs = _collect(repo, code, schemas, models)
    out: dict = {}
    counts = {"agree": 0, "disagree": 0, "schema-only": 0, "model-only": 0}
    via_counts: dict = {}

    def subject(key, at):
        return out.setdefault(key, {"at": at, "pairs": [], "rows": [], "agree": 0})
    feeds = {k[1] for k in pairs if k[0] == "flow"}
    for (via, acls, af, bcls, bf), info in sorted(pairs.items()):
        if via == "sibling" and not (bcls in feeds or (forms.get("schemas", {}).get(f"schema:{bcls}") or {}).get("consumers")):
            continue                                              # a response built from a request enforces nothing
        a = schemas[acls]["fields"][af]
        b = models[bcls]["columns"][bf] if bcls in models else schemas[bcls]["fields"][bf]
        kind = "model" if bcls in models else "schema"
        form = subject(f"mirror:{bcls}.{bf}", b.get("at"))
        form["subject"] = f"{kind}:{bcls}.{bf}"
        other = f"schema:{acls}.{af}"
        form["pairs"].append({"with": other, "via": via, "how": info["how"], "sites": sorted((x for x in info["sites"] if x), key=_site_key)})
        via_counts[via] = via_counts.get(via, 0) + 1
        for r in _rules(via, a, b):
            counts[r["verdict"]] += 1
            if r["verdict"] == "agree":
                form["agree"] += 1
            else:
                form["rows"].append({**r, "with": other, "via": via})
    for sid, s in sorted((forms.get("settings") or {}).items()):
        paired = {e["constant"] for e in s.get("effective") or []}
        for e in s.get("effective") or []:
            form = subject(f"mirror:{sid}", s.get("at"))
            form["subject"] = sid
            form["pairs"].append({"with": f"constant:{e['constant']}", "via": "flag-pair", "how": "same condition", "sites": [e["at"]]})
            via_counts["flag-pair"] = via_counts.get("flag-pair", 0) + 1
            same = ST._canon(ST._default(s.get("default"))) == ST._canon(e.get("value"))
            counts["agree" if same else "disagree"] += 1
            if same:
                form["agree"] += 1
            else:
                form["rows"].append({"rule": "value", "verdict": "disagree", "a": s.get("default"), "b": e.get("value"), "with": f"constant:{e['constant']}", "via": "flag-pair"})
        name = sid.split(":", 1)[1].rsplit(".", 1)[-1].upper()
        for rel, p in code:
            if name in paired or name not in ST._read(p):
                continue
            m = P._mod(repo, rel)
            if m is None or name not in m.assigns or (value := MG._lit(m.assigns[name])) is None:
                continue
            form = subject(f"mirror:{sid}", s.get("at"))
            form["subject"] = sid
            at = f"{rel}:{ST._assign_line(m, name)}"
            form["pairs"].append({"with": f"constant:{name}", "via": "setting-copy", "how": "same name", "sites": [at]})
            via_counts["setting-copy"] = via_counts.get("setting-copy", 0) + 1
            same = ST._canon(ST._default(s.get("default"))) == ST._canon(value)
            counts["agree" if same else "disagree"] += 1
            if same:
                form["agree"] += 1
            else:
                form["rows"].append({"rule": "value", "verdict": "disagree", "a": s.get("default"), "b": value, "with": f"constant:{name}@{at}", "via": "setting-copy"})
    found = []
    for key, form in sorted(out.items()):
        cls, _, col = key.split(":", 1)[1].partition(".")
        one_sided = [r for r in form["rows"] if r["verdict"] == "schema-only"]
        if cls in models and one_sided:
            form["bypass_writers"] = sorted({(at, value) for column, value, at, fed in constructs.get(cls, []) if column == col and not fed})
            form["bypass_writers"] = [{"at": at, "value": value} for at, value in form["bypass_writers"]][:20]
        for r in form["rows"]:
            if r["verdict"] == "disagree":
                found.append({"id": "mirror-disagree", "slot": F.FINDINGS["mirror-disagree"]["slot"], "mirror": key, "rule": r["rule"], "with": r["with"]})
            elif r["verdict"] == "schema-only" and r["rule"] == "bound" and form.get("bypass_writers"):
                found.append({"id": "schema-only-bound", "slot": F.FINDINGS["schema-only-bound"]["slot"], "mirror": key,
                              "with": r["with"], "bypass": len(form["bypass_writers"])})
        form["pairs"].sort(key=lambda x: (x["via"], x["with"]))
    stats = {"mirrors": len(out), "pairs": dict(sorted(via_counts.items())), "verdicts": counts,
             "bypass_writers": sum(len(f.get("bypass_writers") or []) for f in out.values())}
    return dict(sorted(out.items())), stats, found
