#!/usr/bin/env python3
"""A3 Code tab — the machine-derived technical decode of one entity.

Everything here is parsed from source with `ast`, never hand-listed (the
anti-curation guardrail applied to code documentation): endpoints from the
FastAPI decorators + their real docstrings, the data model from the SQLAlchemy
`Mapped[...]` columns + table args, and the code map from the files on disk
with their measured line counts. The card contributes only the section intro
prose; if a file moves or an endpoint is added, the next regen shows it
without anyone editing a doc.
"""

from __future__ import annotations

import ast
import glob as _glob
import re as _re_mod
from pathlib import Path

import _center_data as _cd
from _a3_render import E, legend, lines_grade, sechead, subnav, table, trunc, xtable


def _field_desc(item: ast.AnnAssign, src_lines: list[str]) -> str:
    """One-line field description, MACHINE-DERIVED only: a description=/comment=
    string kwarg on the field's value call (pydantic Field / mapped_column),
    else the field line's own trailing `# comment`. Absent stays absent —
    the page renders an em dash, never an invented sentence."""
    if isinstance(item.value, ast.Call):
        for kw in item.value.keywords:
            if (kw.arg in ("description", "comment")
                    and isinstance(kw.value, ast.Constant)
                    and isinstance(kw.value.value, str)):
                return " ".join(kw.value.value.split())
    line = src_lines[item.lineno - 1] if 0 < item.lineno <= len(src_lines) else ""
    m = _re_mod.search(r"#\s*(.+?)\s*$", line)
    return " ".join(m.group(1).split()) if m else ""

# The layers a code map is organized by, in render order. Semantic names, not
# paths: api=endpoints (FastAPI), models=SQLAlchemy, schemas=Pydantic, the rest
# are file globs. Declared in center.config.json `code_layers`.
_CODE_LAYERS = _cd.CFG.get("code_layers",
                           ["api", "services", "models", "schemas", "web", "mobile"])

# Icons (feather-style) + colors for the tab's generated section banners.
_IC_ZAP = '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
_IC_FOLDER = ('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 '
              '2-2h5l2 3h9a2 2 0 0 1 2 2z"/>')
_IC_DB = ('<ellipse cx="12" cy="5" rx="9" ry="3"/>'
          '<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>'
          '<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>')

_METHOD_CLS = {"GET": "m-get", "POST": "m-post", "PATCH": "m-mut",
               "PUT": "m-mut", "DELETE": "m-del"}
# Type families for the data-model Type column: one hue per family, and within
# a family the WIDER type renders deeper (int plain → float/Decimal deep). A
# token absent here is a domain type or alias and stays uncolored on purpose.
_TYPE_CLS = {
    "int": "ty-num1", "float": "ty-num2", "Decimal": "ty-num2",
    "Numeric": "ty-num2", "date": "ty-tim1", "time": "ty-tim1",
    "datetime": "ty-tim2", "str": "ty-str1", "Text": "ty-str2",
    "bytes": "ty-str2", "bool": "ty-bool", "dict": "ty-json",
    "list": "ty-json", "Any": "ty-json", "JSON": "ty-json",
    "Literal": "ty-json", "UUID": "ty-id", "uuid": "ty-id",
    "None": "ty-null",
}
_LAYER_CLS = {"api": "l-api", "services": "l-services", "models": "l-models",
              "schemas": "l-schemas", "web": "l-web", "mobile": "l-mobile"}

# Which source files make up an entity, by layer, and which model classes to
# document — read from center.config.json `entities.<slug>.code` /
# `.models`. Paths are repo-relative; web/mobile/test entries are globs. This is
# the ONE editorial mapping and it lives in config, not in this file, so the
# generator source stays project-agnostic (everything rendered from it is
# measured, not asserted).
_ENTITIES = _cd.CFG.get("entities", {})
ENTITY_CODE = {slug: e["code"] for slug, e in _ENTITIES.items() if e.get("code")}
# Entity classes to document from the model files (absent = all classes found).
ENTITY_MODELS = {slug: e["models"] for slug, e in _ENTITIES.items() if e.get("models")}


def _first_sentence(doc: str | None) -> str:
    """The docstring's SUMMARY PARAGRAPH (up to the first blank line), joined —
    wrapped source lines are one sentence, not one line each.

    Returns it WHOLE. It used to cut at 170 chars here, and then `purpose_cell`
    built a ⊕ expander whose "full" span was that already-truncated string — a
    reader who clicked to finish the sentence still could not finish it. One
    truncator per value; this is not it."""
    if not doc:
        return "—"
    return " ".join(doc.strip().split("\n\n")[0].split())


def parse_endpoints(repo: Path, files: list[str]) -> list[dict]:
    """FastAPI surface via ast: decorator method+path, router prefix, the
    handler's REAL docstring, response_model and status_code when literal."""
    out: list[dict] = []
    for rel in files:
        path = repo / rel
        if not path.exists():
            continue
        tree = ast.parse(path.read_text())
        prefix = ""
        for node in ast.walk(tree):
            if (isinstance(node, ast.Call)
                    and getattr(node.func, "id", "") == "APIRouter"):
                for kw in node.keywords:
                    if kw.arg == "prefix" and isinstance(kw.value, ast.Constant):
                        prefix = kw.value.value
        for node in ast.walk(tree):
            if not isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
                continue
            for dec in node.decorator_list:
                if not (isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute)):
                    continue
                method = dec.func.attr
                if method not in ("get", "post", "put", "patch", "delete"):
                    continue
                has_path = dec.args and isinstance(dec.args[0], ast.Constant)
                sub = dec.args[0].value if has_path else ""
                resp = status = None
                for kw in dec.keywords:
                    if kw.arg == "response_model":
                        resp = ast.unparse(kw.value)
                    if kw.arg == "status_code":
                        status = ast.unparse(kw.value).rsplit(".", 1)[-1]
                # Every bare name the handler's body touches — intersected later
                # with model/schema class names to derive endpoint↔type links.
                refs = {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}
                out.append({
                    "method": method.upper(), "path": (prefix + sub) or "/",
                    "fn": node.name, "file": rel, "refs": refs,
                    "doc": _first_sentence(ast.get_docstring(node)),
                    "resp": (resp or "—").removeprefix("PaginatedResponse[").removesuffix("]"),
                    "status": status or "200",
                })
    return out


def parse_schemas(repo: Path, files: list[str]) -> list[dict]:
    """Pydantic request/response shapes — the classes the Returns column names.
    Same honesty rule: parsed from source, never listed by hand."""
    out: list[dict] = []
    for rel in files:
        path = repo / rel
        if not path.exists():
            continue
        src = path.read_text()
        src_lines = src.splitlines()
        for node in ast.parse(src).body:
            if not isinstance(node, ast.ClassDef):
                continue
            fields = [(i.target.id, ast.unparse(i.annotation),
                       _field_desc(i, src_lines))
                      for i in node.body
                      if isinstance(i, ast.AnnAssign) and isinstance(i.target, ast.Name)]
            if fields:
                out.append({"cls": node.name, "file": rel, "fields": fields,
                            "doc": _first_sentence(ast.get_docstring(node))})
    return out


def _anchor(kind: str, slug: str, name: str) -> str:
    import re as _re
    return f"{kind}-{slug}-{_re.sub(r'[^A-Za-z0-9]+', '-', name).strip('-')}"


def parse_defines(repo: Path, rel: str) -> list[str]:
    """What a file DEFINES, parsed per language: python -> top-level classes +
    public functions (ast); ts/tsx -> exported symbols (export grammar)."""
    import re as _re
    path = repo / rel
    if not path.exists():
        return []
    if rel.endswith(".py"):
        names = []
        for node in ast.parse(path.read_text()).body:
            if isinstance(node, ast.ClassDef):
                names.append(node.name)
            elif (isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                  and not node.name.startswith("_")):
                names.append(f"{node.name}()")
        return names
    src = path.read_text()
    names = _re.findall(
        r"export\s+(?:default\s+)?(?:async\s+)?"
        r"(?:function|const|class|interface|type)\s+([A-Za-z_]\w*)", src)
    return list(dict.fromkeys(names))


# Example values are SYNTHETIC — derived from Literal values when the type
# carries them, else from field-name/type heuristics. Labeled as such.
_NAME_EXAMPLES = [
    ("currency", '"CLP"'), ("country", '"CL"'), ("city", '"Concepción"'),
    ("merchant", '"Jumbo Bio Bío"'), ("alias", '"Jumbo"'),
    ("term_total", "12"), ("term_current", "3"), ("share_count", "2"),
    ("confidence", "0.93"), ("fx_rate", "0.00106"), ("qty", "2"),
    ("_minor", "12990"), ("_ms", "840"), ("tokens", "1250"),
    ("label", '"cuota 3 de 12"'), ("name", '"Pan integral"'),
    ("image_url", '"/transactions/{id}/images/{id}"'),
    ("thumbnail_url", '"data:image/webp;…"'), ("payload", '{"merchant": "…"}'),
    ("signals", '[{"kind": "total_mismatch"}]'), ("sort_order", "1"),
]


def _example(name: str, typ: str) -> str:
    import re as _re
    lit = _re.search(r'Literal\[\s*[\'"]([^\'"]+)[\'"]', typ)
    if lit:
        return f'"{lit.group(1)}"'
    low = name.lower()
    t = typ.lower()
    # Type-shaped checks FIRST where the type is unambiguous — a *_user_edited_at
    # datetime must never inherit the merchant string example by name-match.
    if "datetime" in t or low.endswith("_at"):
        return '"2026-07-20T14:32:00Z"'
    if "uuid" in t:
        return '"b7e2a1c4-5d68-4f2e-9a3b-1c2d3e4f5a6b"'
    for frag, ex in _NAME_EXAMPLES:
        if frag in low:
            return ex
    if t.startswith("date"):
        return '"2026-07-20"'
    if t.startswith("time"):
        return '"14:32"'
    if "bool" in t:
        return "true"
    if "decimal" in t or "float" in t:
        return "0.93"
    if "int" in t:
        return "3"
    if t.startswith("list"):
        return "[…]"
    if "dict" in t:
        return "{…}"
    return '"…"'


# Stable per-file font colors for the endpoints table's file links.
_FILE_PALETTE = ["#4f46e5", "#0f766e", "#b45309", "#7c3aed",
                 "#0d7a84", "#c2410c", "#8a6d1a", "#d1443c"]
_VERB_FONT = {"GET": "fm-get", "POST": "fm-post", "PATCH": "fm-mut",
              "PUT": "fm-mut", "DELETE": "fm-del"}


def parse_models(repo: Path, files: list[str], only: list[str] | None) -> list[dict]:
    """SQLAlchemy entities via ast: table name, Mapped[...] columns with their
    annotations, unique constraints, and the class docstring."""
    out: list[dict] = []
    for rel in files:
        path = repo / rel
        if not path.exists():
            continue
        _src = path.read_text()
        _src_lines = _src.splitlines()
        tree = ast.parse(_src)
        for node in tree.body:
            if not isinstance(node, ast.ClassDef):
                continue
            if only and node.name not in only:
                continue
            tab = None
            cols: list[tuple[str, str]] = []
            fks: dict[str, str] = {}
            rels: list[dict] = []
            uqs: list[str] = []
            for item in node.body:
                if (isinstance(item, ast.Assign) and
                        getattr(item.targets[0], "id", "") == "__tablename__"):
                    tab = item.value.value
                if (isinstance(item, ast.Assign) and
                        getattr(item.targets[0], "id", "") == "__table_args__"):
                    uqs = [ast.unparse(e)[:90] for e in getattr(item.value, "elts", [])
                           if "UniqueConstraint" in ast.unparse(e)]
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    ann = ast.unparse(item.annotation)
                    if not ann.startswith("Mapped["):
                        continue
                    inner = ann[7:-1]
                    call = item.value if isinstance(item.value, ast.Call) else None
                    fn = ""
                    if call is not None:
                        fn = getattr(call.func, "id", getattr(call.func, "attr", ""))
                    if fn == "relationship":
                        # An ORM NAVIGATION property — not a stored column. The
                        # only stored direction is the ForeignKey column.
                        many = inner.startswith("list[")
                        target = (inner[5:-1] if many else inner)
                        target = target.split("|")[0].strip().strip("\"'")
                        kw = {k.arg: ast.unparse(k.value).strip("'\"")
                              for k in call.keywords if k.arg}
                        rels.append({"name": item.target.id, "target": target,
                                     "many": many,
                                     "back": kw.get("back_populates", ""),
                                     "cascade": kw.get("cascade", "")})
                        continue
                    cols.append((item.target.id, inner,
                                 _field_desc(item, _src_lines)))
                    if call is not None:
                        for sub in ast.walk(call):
                            if (isinstance(sub, ast.Call)
                                    and getattr(sub.func, "id", "") == "ForeignKey"
                                    and sub.args
                                    and isinstance(sub.args[0], ast.Constant)):
                                fks[item.target.id] = sub.args[0].value
            if tab:
                out.append({"cls": node.name, "table": tab, "file": rel,
                            "doc": _first_sentence(ast.get_docstring(node)),
                            "cols": cols, "fks": fks, "rels": rels, "uqs": uqs})
    return out


def code_map(repo: Path, layers: dict) -> list[tuple[str, str, int]]:
    """(layer, file, measured line count) for every file the mapping names —
    globs expanded against disk, so a moved file drops out visibly."""
    rows: list[tuple[str, str, int]] = []
    for layer in _CODE_LAYERS:
        for pat in layers.get(layer, []):
            for f in sorted(_glob.glob(str(repo / pat))):
                p = Path(f)
                if p.is_file() and ".test." not in p.name:
                    rows.append((layer, str(p.relative_to(repo)),
                                 len(p.read_text().splitlines())))
    return rows


# One parse per entity per build: the Code tab, the archmap serialization and
# the model-insight pass all read THIS cache (before it, the tree was parsed
# twice per entity; the insight pass would have made it three).
_EMAP_CACHE: dict[str, dict | None] = {}


def collect_entity_map(slug: str, repo: Path) -> dict | None:
    if slug in _EMAP_CACHE:
        return _EMAP_CACHE[slug]
    _EMAP_CACHE[slug] = _collect_entity_map(slug, repo)
    return _EMAP_CACHE[slug]


def _collect_entity_map(slug: str, repo: Path) -> dict | None:
    """The entity's architecture map, gathered ONCE per build: endpoints (with
    the documented types each handler touches), models (columns/FKs/relationship
    edges), schemas, files-with-lines, and per-file defines.

    This object is BOTH the Code tab's input and the serialized archmap.json —
    the committed, machine-derived reference map the operator asked for: later
    sessions (or any tool) read the map instead of re-analyzing the codebase,
    and a PR diff of the map IS the architecture change, reviewable."""
    layers = ENTITY_CODE.get(slug)
    if not layers:
        return None
    eps = parse_endpoints(repo, layers.get("api", []))
    models = parse_models(repo, layers.get("models", []), ENTITY_MODELS.get(slug))
    schemas = parse_schemas(repo, layers.get("schemas", []))
    files = code_map(repo, layers)
    documented = {m["cls"] for m in models} | {s["cls"] for s in schemas}
    for e in eps:
        e["touches"] = sorted(e.pop("refs") & documented)
    return {
        "endpoints": eps, "models": models, "schemas": schemas,
        "files": [[layer, f, n] for layer, f, n in files],
        "defines": {f: parse_defines(repo, f)
                    for layer, f, _ in files if layer != "api"},
    }


# --------------------------------------------------------------------------- #
# Model insight — the DATA-MODEL lens (operator ruling 2026-07-23, spike at
# docs/investigations/2026-07-23-model-insight-spike/): every documented class
# app-wide gets machine-derived signals — usage on TWO axes (api = endpoint
# touches + FK in-degree · internal = mapped backend files referencing it),
# a BASE flag (derives from nothing), a god-class flag, its closest structural
# twin, and the orphan verdict (zero on BOTH usage axes). The same shape is
# built to run over other member kinds later (functions · methods) — scoped
# tables, never mixed. The generator NAMES candidates; verdicts stay with
# judgment (review / a health pass), never authored here.
# --------------------------------------------------------------------------- #

_GOD_FIELDS = 15
_SIM_FLOOR = 0.5
_MERGE_FLOOR = 0.8

_INS_ICONS = {
    "model": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    "schema": '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    "base": '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
    "fields": '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>',
    "sim": '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "orphan": '<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/>',
    "merge": '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    "split": '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    "archive": '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" y1="12" x2="14" y2="12"/>',
    "doc": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    "zap": '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
}


def _ins_ic(name: str) -> str:
    return ('<svg viewBox="0 0 24 24" width="13" height="13" fill="none" '
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            f'stroke-linejoin="round">{_INS_ICONS[name]}</svg>')


def itag(color_cls: str, icon: str, title: str, text: str = "") -> str:
    """An icon chip: the tag COLOR pair stays, the word lives in the tooltip
    and the section's ⊕ dictionary; data (a count, a twin + %) rides beside
    the icon."""
    body = _ins_ic(icon) + (f" {text}" if text else "")
    return f'<span class="tag ic {color_cls}" title="{E(title)}">{body}</span>'


_INSIGHT: dict | None = None
_DEF_SPANS: dict[str, list] = {}


def _def_spans(f: str, text: str) -> list:
    """Per-file (def name, start, end) spans, parsed once per build."""
    if f not in _DEF_SPANS:
        try:
            _DEF_SPANS[f] = [
                (n.name, n.lineno, n.end_lineno or n.lineno)
                for n in ast.walk(ast.parse(text))
                if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        except SyntaxError:
            _DEF_SPANS[f] = []
    return _DEF_SPANS[f]


def model_insight(repo: Path) -> dict:
    """{cls: signals} across EVERY documented class app-wide — computed once
    per build off the cached entity maps + one word-boundary scan of the
    mapped backend files. Serialized into archmap.json as `model_insight`."""
    global _INSIGHT
    if _INSIGHT is not None:
        return _INSIGHT
    classes: dict[str, dict] = {}
    table_owner: dict[str, str] = {}
    all_eps: list[dict] = []
    py_files: set[str] = set()
    for slug in ENTITY_CODE:
        v = collect_entity_map(slug, repo)
        if not v:
            continue
        all_eps.extend(v["endpoints"])
        for _layer, f, _n in v["files"]:
            if f.endswith(".py"):
                py_files.add(f)
        for m in v["models"]:
            classes[m["cls"]] = {
                "cls": m["cls"], "kind": "model", "entity": slug,
                "file": m["file"], "fields": m["cols"],
                "fks_out": m.get("fks", {})}
            table_owner[m.get("table", "")] = m["cls"]
        for s in v["schemas"]:
            classes[s["cls"]] = {
                "cls": s["cls"], "kind": "schema", "entity": slug,
                "file": s["file"], "fields": s["fields"], "fks_out": {}}
    texts = {}
    for f in sorted(py_files):
        p = repo / f
        if p.exists():
            texts[f] = p.read_text()
    names = set(classes)
    for c in classes.values():
        c["touches"] = sum(1 for e in all_eps if c["cls"] in e.get("touches", []))
        tgt = {t for t, owner in table_owner.items() if owner == c["cls"]}
        c["fk_in"] = sum(1 for o in classes.values() if o is not c
                         for ref in o["fks_out"].values()
                         if str(ref).split(".")[0] in tgt)
        refs_out = {n for n in names if n != c["cls"]
                    and any(n in str(t) for _f in [c["fields"]] for _n, t, *_ in _f)}
        c["base"] = not c["fks_out"] and not refs_out
        c["god"] = len(c["fields"]) >= _GOD_FIELDS
        c["usage"] = c["touches"] + c["fk_in"]
        rx = _re_mod.compile(rf"\b{_re_mod.escape(c['cls'])}\b")
        c["internal_files"] = sorted(f for f, t in texts.items()
                                     if f != c["file"] and rx.search(t))
        c["internal"] = len(c["internal_files"])
        # WHICH defs in each referencing file mention the class — for the
        # detail's "Usage by internal" table (file · functions).
        c["internal_refs"] = []
        for f in c["internal_files"]:
            lines = texts[f].splitlines()
            defs = [name for name, s, e in _def_spans(f, texts[f])
                    if rx.search("\n".join(lines[s - 1:e]))]
            c["internal_refs"].append(
                {"file": f, "defs": list(dict.fromkeys(defs))[:6]})
        c["orphan"] = c["usage"] == 0 and c["internal"] == 0
    for c in classes.values():
        mine = {n for n, *_ in c["fields"]}
        best, best_j, shared = "", 0.0, 0
        for o in classes.values():
            if o is c:
                continue
            theirs = {n for n, *_ in o["fields"]}
            union = mine | theirs
            j = len(mine & theirs) / len(union) if union else 0.0
            if j > best_j:
                best, best_j, shared = o["cls"], j, len(mine & theirs)
        c["sim"] = ({"cls": best, "j": round(best_j, 2), "shared": shared,
                     "of": len(mine)} if best_j >= _SIM_FLOOR else None)
    _INSIGHT = classes
    return classes


def insight_serial(repo: Path) -> dict:
    """The archmap-ready view: signals only, never the field lists (those
    already ride models/schemas)."""
    return {k: {kk: vv for kk, vv in v.items()
                if kk not in ("fields", "fks_out", "internal_files")}
            for k, v in model_insight(repo).items()}


def _ins_tags(cls: str, ins: dict) -> str:
    """The icon chips for one class cell — dialect + colors per the ruling:
    kind (violet model / teal schema) · base green · fields-count red ·
    twin+% amber · orphan slate."""
    c = ins.get(cls)
    if not c:
        return ""
    out = itag("l-models" if c["kind"] == "model" else "l-schemas", c["kind"],
               "model — a persisted DB entity" if c["kind"] == "model"
               else "schema — an API / pipeline shape")
    if c["base"]:
        out += " " + itag("t-base", "base",
                          "base class — derives from nothing: no FK out, no "
                          "field typed by another documented class")
    if c["god"]:
        out += " " + itag("t-god", "fields",
                          f"god-class flag — {len(c['fields'])} fields",
                          str(len(c["fields"])))
    if c["sim"]:
        s = c["sim"]
        out += " " + itag("t-sim", "sim",
                          f"closest structural twin — {s['shared']}/{s['of']} "
                          f"fields shared",
                          f'{E(s["cls"])} {int(s["j"] * 100)}%')
    if c["orphan"]:
        out += " " + itag("t-orph", "orphan",
                          "orphan — zero API usage AND zero internal "
                          "references in the mapped backend files")
    return out


def _ins_usage(cls: str, ins: dict) -> str:
    c = ins.get(cls)
    if not c:
        return "—"
    w_api = max(2, min(60, c["usage"] * 11))
    w_int = max(2, min(60, c["internal"] * 11))
    return (f'<span class="ubar" style="width:{w_api}px"></span>'
            f'<b>{c["usage"]}</b> <small>api</small><br>'
            f'<span class="ubar u-int" style="width:{w_int}px"></span>'
            f'<b>{c["internal"]}</b> <small>internal</small>')


def build_code_tab(slug: str, repo: Path, intro_html: str) -> str:
    """The Code tab: endpoints · code map · data model. Returns "" for entities
    with no ENTITY_CODE mapping yet — rendered as a named gap by the caller."""
    amap = collect_entity_map(slug, repo)
    if not amap:
        return ""
    eps, models, schemas = amap["endpoints"], amap["models"], amap["schemas"]
    files = [tuple(row) for row in amap["files"]]

    # The link graph: file colors, endpoint↔file, endpoint↔type — every id is
    # derived so the three tables cross-reference without hand-kept indexes.
    file_color = {f: _FILE_PALETTE[i % len(_FILE_PALETTE)]
                  for i, f in enumerate(dict.fromkeys(e["file"] for e in eps))}
    model_names = {m["cls"] for m in models}
    schema_names = {s["cls"] for s in schemas}
    eps_by_file: dict[str, list[dict]] = {}
    for e in eps:
        eps_by_file.setdefault(e["file"], []).append(e)

    # The longest path segment every endpoint shares — the router's own prefix,
    # derived rather than the literal "/transactions" this used to carry.
    _paths = [e["path"] for e in eps]
    _common = ""
    if _paths:
        head = _paths[0].split("/")
        for i in range(1, len(head) + 1):
            cand = "/".join(head[:i])
            if cand and all(p == cand or p.startswith(cand + "/") for p in _paths):
                _common = cand

    def ep_chip(e: dict) -> str:
        """Font-colored, background-free endpoint link back to its row."""
        short = (e["path"].removeprefix(_common) if _common else e["path"]) or "/"
        return (f'<a class="{_VERB_FONT.get(e["method"], "")}" '
                f'href="#{_anchor("ep", slug, e["fn"])}">{E(e["method"])} '
                f"{E(short)}</a>")

    def purpose_cell(doc: str) -> str:
        if doc == "—" or len(doc) <= 76:
            return E(doc)
        cut = doc[:76].rsplit(" ", 1)[0].rstrip(" ,;·")
        return (f'<details class="pmore"><summary><span class="cut">{E(cut)}…</span>'
                f'<span class="full">{E(doc)}</span><i></i></summary></details>')

    def returns_cell(e: dict) -> str:
        import re as _re
        parts = []
        for tok in dict.fromkeys(_re.findall(r"[A-Za-z_]\w+", e["resp"])):
            if tok in schema_names:
                parts.append(f'<a class="dlink" href="#{_anchor("dm", slug, tok)}">'
                             f"{E(tok)}</a>")
        body = " ".join(parts) or f'<code>{E(e["resp"])}</code>'
        return f'{body}<br><small>{E(e["status"])}</small>'

    # --- Endpoints ---------------------------------------------------------
    html = subnav([("sec-code-endpoints", "Endpoints", _IC_ZAP),
                   ("sec-code-map", "Code map", _IC_FOLDER),
                   ("sec-code-model", "Data model", _IC_DB)])
    html += sechead(
        "Code", "Endpoints", "#4f46e5", _IC_ZAP,
        sub="the HTTP surface, parsed from the FastAPI decorators",
        id_="sec-code-endpoints",
        note=f"{len(eps)} endpoint(s) — method, path, docstring, response model "
             f"and handler are read from source at build time, never hand-listed.",
        info=legend("Verb colors:", [
            ("m-get", "GET", "reads — no state change ·"),
            ("m-post", "POST", "creates ·"),
            ("m-mut", "PATCH/PUT", "modifies ·"),
            ("m-del", "DELETE", "removes")])
        + '<div class="leg">Links: the file name jumps to its code-map row; '
          'a violet return type jumps to its definition in the data model. '
          '⊕ expands a cut-off purpose.</div>')
    html += table(
        ["Endpoint", "Purpose", "Returns"],
        [[f'<span id="{_anchor("ep", slug, e["fn"])}" class="tag '
          f'{_METHOD_CLS.get(e["method"], "")}">{E(e["method"])}</span> '
          f'<code>{E(e["path"])}</code><br><small>{E(e["fn"])} · '
          f'<a class="flink" style="color:{file_color[e["file"]]}" '
          f'href="#{_anchor("cm", slug, e["file"])}">'
          f'{E(e["file"].rsplit("/", 1)[-1])}</a></small>',
          purpose_cell(e["doc"]), returns_cell(e)]
         for e in eps])

    # --- Code map: one table PER LAYER, each with an honest Defines column --
    _map_info = ('<div class="leg">Defines per layer: api → its endpoints '
                 "(verb-colored, clickable) · models/schemas → their classes "
                 "(violet links into the data model) · services → public "
                 "functions · web/mobile → exported symbols.</div>")
    layer_desc = {"api": "HTTP routes", "services": "business logic",
                   "models": "DB tables", "schemas": "request/response shapes",
                   "web": "browser UI", "mobile": "native app"}
    documented = model_names | schema_names

    def defines_cell(layer: str, f: str) -> str:
        if layer == "api":
            return " · ".join(ep_chip(e) for e in eps_by_file.get(f, [])) or "—"
        names = amap["defines"].get(f, [])
        if not names:
            return "—"
        shown, extra = names[:8], len(names) - 8
        chips = []
        for n in shown:
            if n in documented:
                chips.append(f'<a class="dlink" href="#{_anchor("dm", slug, n)}">'
                             f"{E(n)}</a>")
            else:
                chips.append(f"<code>{E(n)}</code>")
        return (" · ".join(chips)
                + (f" · <small>+{extra} more</small>" if extra > 0 else ""))

    over = sum(1 for _, _, n in files if n > 800)
    html += sechead(
        "Code", "Code map", "#0f766e", _IC_FOLDER,
        sub="every file this entity lives in, measured on disk",
        id_="sec-code-map",
        note=f"{len(files)} file(s) · {sum(n for _, _, n in files):,} lines "
             f"measured on disk this build · {over} file(s) over the 800-line "
             f"budget. A moved file drops out of this table visibly.",
        info=_map_info + legend("Lines encode the 800-line budget:", [
            ("s-ok", "≤ 800", "within budget ·"),
            ("s-med", "801+", "refactor candidate — red deepens toward 2,000 ·"),
            ("s-high", "≥ 2000", "most intense red")]))
    html += table(
        ["Layer", "File", "Lines", "Defines"],
        [[f'<span class="tag {_LAYER_CLS.get(layer, "")}" '
          f'title="{E(layer_desc.get(layer, ""))}">{E(layer)}</span>',
          f'<code id="{_anchor("cm", slug, f)}">{E(f)}</code>', lines_grade(n),
          defines_cell(layer, f)] for layer, f, n in files],
        num={2})

    # --- Data model: header-table cards; compositions LINK, never repeat ----
    def link_types(typ: str) -> str:
        """A field typed with another documented class links to that class's
        card instead of repeating its structure — composition by reference.
        Every OTHER identifier is colored by its type family (see _TYPE_CLS):
        one pass over the tokens, so a documented class is never re-matched
        inside the markup a previous pass inserted."""
        import re as _re

        def one(m: _re.Match) -> str:
            tok = m.group(0)
            if tok in documented:
                return (f'<a class="dlink" href="#{_anchor("dm", slug, tok)}">'
                        f"{tok}</a>")
            cls = _TYPE_CLS.get(tok)
            return f'<span class="ty {cls}">{tok}</span>' if cls else tok

        # Quoted segments are Literal VALUES, not type names — split them out
        # first so an enum value like 'date' is never colored as a type.
        return "".join(
            E(part) if i % 2 else _re.sub(r"[A-Za-z_]\w*", one, E(part))
            for i, part in enumerate(_re.split(r"('[^']*')", typ[:60])))

    by_cls = {m["cls"]: m for m in models}

    def rel_rows(cls: str, rels: list[dict]) -> str:
        """ORM navigation properties, rendered APART from columns — with the
        one stored direction (the ForeignKey) named for each. A back_populates
        pair is two views of one FK, never circular storage."""
        if not rels:
            return ""
        rows = ""
        for r in rels:
            tgt = by_cls.get(r["target"])
            link = (f'<a class="dlink" href="#{_anchor("dm", slug, r["target"])}">'
                    f'{E(r["target"])}</a>')
            if r["many"]:
                kind = "one → many"
                via = next((f'{r["target"]}.{c} → {t2}'
                            for c, t2 in (tgt["fks"].items() if tgt else [])
                            if by_cls.get(cls) and t2.split(".")[0] == by_cls[cls]["table"]),
                           "—")
            else:
                kind = "many → one"
                me = by_cls.get(cls)
                via = next((f'{cls}.{c} → {t2}'
                            for c, t2 in (me["fks"].items() if me else [])
                            if tgt and t2.split(".")[0] == tgt["table"]), "—")
            back = (f'back_populates=<code>{E(r["back"])}</code>' if r["back"] else "—")
            casc = f' · cascade <code>{E(r["cascade"])}</code>' if r["cascade"] else ""
            rows += (f"<tr><td><code>{E(r['name'])}</code></td><td>{link} "
                     f"<small>{kind}</small></td>"
                     f"<td><code>{E(via)}</code></td><td>{back}{casc}</td></tr>")
        return (f'<p class="sub" style="margin-top:10px">Relationships — ORM '
                f"navigation, not stored columns; each is a view over ONE "
                f"ForeignKey:</p>"
                f'<table class="tbl"><thead><tr><th>Attribute</th><th>Target</th>'
                f"<th>Stored as (the FK)</th><th>Paired via</th></tr></thead>"
                f"<tbody>{rows}</tbody></table>")

    _page_files = {f for _layer, f, _n in files}

    def _fchip(f: str) -> str:
        """A file mention LINKS to its code-map row when the file is on this
        page; a file mapped by another entity stays plain."""
        name = E(f.rsplit("/", 1)[-1])
        if f in _page_files:
            return f'<a class="dlink" href="#{_anchor("cm", slug, f)}"><code>{name}</code></a>'
        return f"<code>{name}</code>"

    def _dmh(color: str, icon: str, label: str, extra: str = "") -> str:
        """A titled subsection head inside the row detail — icon + colored
        label, so each block (usage · structure) is identifiable at a
        glance (operator polish 2026-07-23)."""
        return (f'<p class="dmh" style="--dc:{color}">{_ins_ic(icon)}'
                f"<b>{E(label)}</b>{extra}</p>")

    def _dm_meta(cls: str, kind_html: str, doc: str = "") -> str:
        """Kind + docstring only — the usage facts are titled TABLES now."""
        rows = [(f'{_ins_ic("model" if "model" in kind_html else "schema")} KIND',
                 "#7c3aed", kind_html)]
        if doc:
            rows.append((f'{_ins_ic("doc")} DOCSTRING', "#64748b", E(doc)))
        body = "".join(
            f'<tr><td class="metak" style="color:{col}">{k}</td>'
            f"<td>{v}</td></tr>" for k, col, v in rows)
        return f'<table class="tbl dm-meta"><tbody>{body}</tbody></table>'

    def _dm_api_tbl(cls: str, is_schema: bool) -> str:
        """Usage by API — the teal bar's receipts: one row per endpoint that
        touches the class, linked to its endpoint row."""
        c = ins.get(cls, {})
        n = c.get("usage", 0)
        bar = (f'<span class="ubar" style="width:{max(2, min(60, n * 11))}px">'
               f"</span><b>{n}</b>")
        head = _dmh("#0d6e78", "zap", "Usage by API", f" {bar}")
        hits = [e for e in eps
                if cls in e["touches"] or (is_schema and cls in e["resp"])]
        fk = (f'<p class="sub">+ {c["fk_in"]} FK in-degree (other models '
              f"pointing at this table) also rides the teal bar.</p>"
              if c.get("fk_in") else "")
        if not hits:
            return head + (fk or '<p class="sub">no API usage on record — '
                                 "the teal bar is empty.</p>")
        body = "".join(
            f"<tr><td>{ep_chip(e)}</td><td><code>{E(e['fn'])}</code></td>"
            f"<td>{_fchip(e['file'])}</td></tr>" for e in hits)
        return (head + '<table class="tbl"><thead><tr><th>Endpoint</th>'
                "<th>Handler</th><th>Defined in</th></tr></thead>"
                f"<tbody>{body}</tbody></table>" + fk)

    def _dm_int_tbl(cls: str) -> str:
        """Usage by internal — the violet bar's receipts: one row per mapped
        backend file referencing the class, with the functions that do."""
        c = ins.get(cls, {})
        n = c.get("internal", 0)
        bar = (f'<span class="ubar u-int" style="width:'
               f'{max(2, min(60, n * 11))}px"></span><b>{n}</b>')
        head = _dmh("#7c3aed", "schema", "Usage by internal", f" {bar}")
        refs = c.get("internal_refs") or []
        if not refs:
            return head + ('<p class="sub">no internal references across the '
                           "mapped backend files — the violet bar is empty.</p>")
        body = "".join(
            f"<tr><td>{_fchip(r['file'])}</td><td>"
            + (" · ".join(f"<code>{E(d)}</code>" for d in r["defs"]) or
               "<span class='sub'>module level</span>")
            + "</td></tr>" for r in refs)
        return (head + '<table class="tbl"><thead><tr><th>File</th>'
                "<th>Referencing function(s)</th></tr></thead>"
                f"<tbody>{body}</tbody></table>")

    def _dm_detail(cls: str, fields: list, meta_html: str = "",
                   rels: list[dict] | None = None, is_schema: bool = True,
                   uqs: list | None = None) -> str:
        """The in-place expansion, in titled blocks (operator polish
        2026-07-23): metadata (kind · docstring) → Usage by API → Usage by
        internal → relationships → Structure (columns, with unique-constraint
        chips packed onto their rows). Descriptions read from source; absent
        renders an em dash. Older 2-tuple archmaps stay renderable."""
        uq_cols: set = set()
        leftover_uqs = []
        fnames = {str(f[0]) for f in fields}
        for u in (uqs or []):
            named = set(_re_mod.findall(r"'([A-Za-z_][A-Za-z0-9_]*)'", u)) & fnames
            if named:
                uq_cols |= named
            else:
                leftover_uqs.append(u)
        body = ""
        for f in fields:
            n, t = f[0], f[1]
            d = f[2] if len(f) > 2 and f[2] else "—"
            uq_chip = (' <span class="tag t-uq" title="part of a UNIQUE '
                       'constraint">unique</span>' if n in uq_cols else "")
            body += (f"<tr><td><code>{E(n)}</code>{uq_chip}</td>"
                     f"<td>{link_types(t)}</td>"
                     f"<td><code>{E(_example(n, t))}</code></td>"
                     f"<td>{E(trunc(d, 96))}</td></tr>")
        struct_head = _dmh("#b3403a", "fields", "Structure",
                           f' <span class="sub">{len(fields)} column(s)</span>')
        leftover = "".join(
            f'<p class="sub">Constraint: <code>{E(u)}</code></p>'
            for u in leftover_uqs)
        return (f"{meta_html}{_dm_api_tbl(cls, is_schema)}{_dm_int_tbl(cls)}"
                f"{rel_rows(cls, rels or [])}{struct_head}{leftover}"
                f'<table class="tbl"><thead><tr><th>Column</th><th>Type</th>'
                f"<th>Example (synthetic)</th><th>Description</th></tr></thead>"
                f"<tbody>{body}</tbody></table>")

    _DM_W = ["2.2fr", "0.9fr", "1.7fr", "1.2fr"]

    html += sechead(
        "Code", "Data model", "#7c3aed", _IC_DB,
        sub="DB entities and API shapes — each names its file and "
            "the endpoints that touch it", id_="sec-code-model",
        info='<div class="leg">A field typed with another documented class LINKS '
             "to it (violet) instead of repeating its structure. Examples are "
             "synthetic — derived from Literal values and field-name heuristics, "
             "never real user data.</div>"
             + '<div class="leg">Type colors — one hue per family, deeper = the '
               'wider type: <span class="ty ty-num1">int</span> '
               '<span class="ty ty-num2">float · Decimal</span> numeric · '
               '<span class="ty ty-tim1">date · time</span> '
               '<span class="ty ty-tim2">datetime</span> temporal · '
               '<span class="ty ty-str1">str</span> '
               '<span class="ty ty-str2">bytes · Text</span> textual · '
               '<span class="ty ty-bool">bool</span> · '
               '<span class="ty ty-json">list · dict · Literal</span> '
               'structured · <span class="ty ty-id">UUID</span> identity · '
               '<span class="ty ty-null">None</span> nullable. An uncolored '
               "token is a domain alias (an enum defined in this codebase).</div>"
             + '<div class="leg"><b>Insight icons</b> — the DATA-MODEL lens; '
               "the same shape runs over other member kinds later (functions "
               "· methods), scoped, never mixed:"
               '<ul class="iclist">'
               f"<li>{itag('l-models', 'model', 'model')} <b>model</b> — a "
               "persisted DB entity: lives in a table, owns FKs.</li>"
               f"<li>{itag('l-schemas', 'schema', 'schema')} <b>schema</b> — "
               "an API / pipeline shape: crosses a boundary, owns no "
               "storage.</li>"
               f"<li>{itag('t-base', 'base', 'base class')} <b>base</b> — "
               "derives from NOTHING: no FK out, no field typed by another "
               "documented class; a foundation others build on.</li>"
               f"<li>{itag('t-god', 'fields', 'god-class flag', 'N')} "
               f"<b>god-class flag</b> — field count ≥ {_GOD_FIELDS}; the "
               f"number that makes it a {itag('t-god', 'split', 'split candidate')} "
               "split candidate below.</li>"
               f"<li>{itag('t-sim', 'sim', 'structural twin', 'Class N%')} "
               "<b>closest structural twin</b> — % = shared fields over the "
               f"union (Jaccard); a ≥{int(_MERGE_FLOOR * 100)}% pair becomes "
               f"a {itag('t-sim', 'merge', 'merge candidate')} merge candidate "
               "below.</li>"
               f"<li>{itag('t-orph', 'orphan', 'orphan')} <b>orphan</b> — zero "
               "API usage AND zero internal references; becomes a "
               f"{itag('t-orph', 'archive', 'deprecation candidate')} "
               "deprecation candidate below.</li>"
               "<li>Usage bars: teal = api (endpoint touches + FK in) · "
               "violet = internal (mapped backend files referencing the "
               "class). Api-silent is not dead; only a true orphan is.</li>"
               "</ul></div>"
             + (f'<p class="sub"><b>About this section</b></p>{intro_html}'
                if intro_html else ""))
    ins = model_insight(repo)
    html += ('<div class="dmchips" id="dm-chips">'
             + "".join(f'<button class="chip" data-f="{k}">{lbl}</button>'
                       for k, lbl in (("all", "All"), ("t-base", "base"),
                                      ("t-sim", "≈ similar"),
                                      ("t-orph", "orphan"),
                                      ("t-god", "god"))) + "</div>")
    html += (f'<p class="sub"><span class="tag l-models">models</span> '
             f"{len(models)} DB entity class(es) — click a row to open its "
             f"columns:</p>")
    _mrows = []
    for m in models:
        meta = _dm_meta(m["cls"],
                        f'model — table <code>{E(m["table"])}</code>',
                        doc=m.get("doc") or "")
        cells = [f'<b>{E(m["cls"])}</b><br>{_ins_tags(m["cls"], ins)}',
                 E(slug),
                 f'<code>{E(m["file"])}</code>',
                 _ins_usage(m["cls"], ins)]
        _mrows.append((cells,
                       _dm_detail(m["cls"], m["cols"], meta, m["rels"],
                                  is_schema=False, uqs=m["uqs"]),
                       _anchor("dm", slug, m["cls"])))
    html += xtable(["Class", "Entity", "File", "Usage"], _mrows, widths=_DM_W)
    html += (f'<p class="sub" style="margin-top:14px">'
             f'<span class="tag l-schemas">schemas</span> {len(schemas)} API '
             f"schema(s) — the shapes the Returns column links to:</p>")
    _srows = []
    for s_ in schemas:
        meta = _dm_meta(s_["cls"], "API schema", doc=s_.get("doc") or "")
        cells = [f'<b>{E(s_["cls"])}</b><br>{_ins_tags(s_["cls"], ins)}',
                 E(slug),
                 f'<code>{E(s_["file"])}</code>',
                 _ins_usage(s_["cls"], ins)]
        _srows.append((cells, _dm_detail(s_["cls"], s_["fields"], meta),
                       _anchor("dm", slug, s_["cls"])))
    html += xtable(["Class", "Entity", "File", "Usage"], _srows, widths=_DM_W)
    # Filter chips act on the two class tables above (any .xrow after the
    # chips in this pane); the candidates table below uses plain rows and is
    # deliberately outside the filter.
    html += (
        "<script>(function(){var c=document.getElementById('dm-chips');"
        "if(!c)return;var rows=[];var n=c.nextElementSibling;"
        "while(n){rows.push.apply(rows,n.querySelectorAll('.xrow'));"
        "n=n.nextElementSibling;}c.addEventListener('click',function(ev){"
        "var b=ev.target.closest('.chip');if(!b)return;"
        "c.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on')});"
        "b.classList.add('on');var f=b.dataset.f;rows.forEach(function(r){"
        "r.style.display=(f==='all'||r.querySelector('summary .'+f))?'':'none'});"
        "});c.querySelector('.chip').classList.add('on');})();</script>")

    # -- Data-model candidates: named by the machine, ruled by judgment ------
    own = {m["cls"] for m in models} | {s_["cls"] for s_ in schemas}
    cands = ""
    seen_pairs: set = set()
    for cls in sorted(own):
        c = ins.get(cls)
        if not c or not c["sim"] or c["sim"]["j"] < _MERGE_FLOOR:
            continue
        key = tuple(sorted((cls, c["sim"]["cls"])))
        if key in seen_pairs:
            continue
        seen_pairs.add(key)
        s = c["sim"]
        cands += (f'<tr><td>{itag("t-sim", "merge", "merge candidate")}</td>'
                  f'<td><code>{E(key[0])}</code> ≈ <code>{E(key[1])}</code></td>'
                  f'<td>{int(s["j"] * 100)}% structural twin ({s["shared"]}/'
                  f'{s["of"]} fields) — justified echo, or duplication waiting '
                  f"to drift? Rule it.</td></tr>")
    for cls in sorted(own):
        c = ins.get(cls)
        if c and c["orphan"]:
            cands += (f'<tr><td>{itag("t-orph", "archive", "deprecation candidate")}'
                      f'</td><td><code>{E(cls)}</code></td>'
                      f"<td>zero API usage · zero internal references across "
                      f"the mapped backend files — if nothing outside the map "
                      f"uses it either, file for removal.</td></tr>")
    for cls in sorted(own, key=lambda k: -len(ins[k]["fields"]) if k in ins else 0):
        c = ins.get(cls)
        if c and c["god"]:
            cands += (f'<tr><td>{itag("t-god", "split", "split candidate")}</td>'
                      f'<td><code>{E(cls)}</code></td>'
                      f'<td>{len(c["fields"])} fields — past the {_GOD_FIELDS}-'
                      f"field line; the number names it, judgment rules it."
                      f"</td></tr>")
    if cands:
        html += (
            '<p class="sub" style="margin-top:18px"><b>Data-model candidates '
            "— named by the machine, ruled by judgment.</b> Each wears the "
            "color and icon dialect of the flag that triggered it above; the "
            "verdict lands in DECISIONS/PENDING via review or a health pass, "
            "never here.</p>"
            "<details><summary class=\"sub\" style=\"cursor:pointer\">⊕ what "
            "the candidate icons mean</summary><div class=\"leg\">"
            + itag("t-sim", "merge", "merge candidate")
            + f" merge — structural twins ≥ {int(_MERGE_FLOOR * 100)}% (from "
            + itag("t-sim", "sim", "similarity flag") + ") · "
            + itag("t-orph", "archive", "deprecation candidate")
            + " deprecation — a true orphan (from "
            + itag("t-orph", "orphan", "orphan flag") + ") · "
            + itag("t-god", "split", "split candidate")
            + f" split — a god class ≥ {_GOD_FIELDS} fields (from "
            + itag("t-god", "fields", "fields flag", "N") + ")</div></details>"
            "<table class=\"tbl\"><thead><tr><th>Candidate</th><th>Classes</th>"
            "<th>Why the machine flags it</th></tr></thead>"
            f"<tbody>{cands}</tbody></table>")
    # The "About this section" methodology prose used to trail the tables; the
    # declutter ruling folds it into the section's ⊕ (info above) instead.
    return html
