"""Element forms — MIGRATION replay (amendment 1 §A2 Slice 10a · M8): the database schema every alembic tree leaves after
its last revision runs, so a model can be compared with what the database really has.

A tree is a ``script_location`` section of an ``alembic.ini`` (center, vendored and virtual-env directories skipped).
Revisions are ordered breadth-first from ``down_revision = None``, ties broken by filename; more than one head reads
``unknown``. Each ``upgrade()`` is replayed statement by statement — ``op.<verb>`` calls and the bodies of
``with op.batch_alter_table(table) as <alias>:``, ``rename_table`` and ``drop_table`` (a dropped table is remembered), a ``for`` over a constant sequence once per element, a ``*helper()``
spread of columns — into ``{table: {columns, uniques, checks, indexes}}``; ``op.execute``,
``op.get_bind`` and ``op.bulk_insert`` are counted as ``raw_ops``, never read. Types are normalised so ``Uuid ≡ Uuid()``
and ``String(20) ≡ String(length=20)``.
"""
from __future__ import annotations

import re

import ast
import configparser
import os
from pathlib import Path

SKIP_DIRS = frozenset({"node_modules", ".git", ".venv", "venv", "__pycache__", "dist", "build", ".next", "site-packages"})
RAW_OPS = frozenset({"execute", "get_bind", "bulk_insert"})
_RENAME_COL = re.compile(r'\s*ALTER\s+TABLE\s+"?(\w+)"?\s+RENAME\s+(?:COLUMN\s+)?"?(\w+)"?\s+TO\s+"?(\w+)"?\s*;?\s*$', re.I)
# unbound alembic verbs whose first argument is a constraint or index name and whose second is the table
NAME_FIRST = frozenset({"create_check_constraint", "create_unique_constraint", "create_foreign_key", "drop_constraint", "create_index"})
# spellings of one database type
TYPE_SAME = {"Uuid": "UUID"}
TYPE_KW_FIRST = {"String": ("length",), "VARCHAR": ("length",), "CHAR": ("length",), "Text": ("length",), "Numeric": ("precision", "scale")}
# keywords that change what Python sees, never the column the database holds
PY_ONLY_KW = frozenset({"as_uuid", "asdecimal", "astext_type", "values_callable", "create_type", "native_enum", "validate_strings",
                        "create_constraint", "none_as_null", "name", "inherit_schema", "metadata", "schema"})
CAPS_TYPES = frozenset({"UUID", "JSON", "JSONB", "ARRAY", "TEXT", "INTEGER", "BIGINT", "SMALLINT", "VARCHAR", "NVARCHAR", "CHAR", "NCHAR",
                        "BOOLEAN", "TIMESTAMP", "DATETIME", "DATE", "TIME", "INTERVAL", "BYTEA", "BLOB", "CLOB", "INET", "CIDR", "FLOAT",
                        "REAL", "DOUBLE", "NUMERIC", "DECIMAL", "MONEY", "TSVECTOR", "HSTORE", "BIT", "XML", "OID", "ENUM"})


def _leaf(node) -> str | None:
    while isinstance(node, ast.Call):
        node = node.func
    if isinstance(node, ast.Attribute):
        return node.attr
    return node.id if isinstance(node, ast.Name) else None


def _lit(node):
    try:
        return ast.literal_eval(node)
    except (ValueError, SyntaxError, TypeError):
        return None


def _typeish(node) -> bool:
    """A type reference, not a constant: capitalised, and all-caps only for a known dialect type (``UUID``, not ``MAX_LEN``)."""
    name = _leaf(node)
    return bool(name) and name[:1].isupper() and (not name.isupper() or name in CAPS_TYPES)


def norm_type(node) -> str | None:
    """The database type as one string: ``sa.String(length=20)`` → ``String(20)``, ``sa.Uuid()`` / ``sa.Uuid`` → ``Uuid``,
    nested types normalised (``ARRAY(sa.String())`` → ``ARRAY(String)``), Python-side keywords dropped (``as_uuid`` ·
    ``asdecimal`` · ``astext_type`` …), ``Enum(…, native_enum=False)`` read as the ``String`` it stores and any other
    ``Enum`` as ``Enum``; every argument is dropped when one is unreadable (a constant from another module)."""
    if node is None or not _typeish(node):
        return None
    name = TYPE_SAME.get(_leaf(node), _leaf(node))
    if not isinstance(node, ast.Call):
        return name
    if name == "Enum":
        return "String" if any(k.arg == "native_enum" and _lit(k.value) is False for k in node.keywords) else "Enum"

    def arg(a):
        if _lit(a) is not None:
            return repr(_lit(a))
        return norm_type(a) if _typeish(a) else None
    args = [arg(a) for a in node.args]
    kws = {k.arg: arg(k.value) for k in node.keywords if k.arg and k.arg not in PY_ONLY_KW}
    if None in args or None in kws.values():
        return name
    for i, kw in enumerate(TYPE_KW_FIRST.get(name, ())):
        if kw in kws and len(args) == i:
            args.append(kws.pop(kw))
    parts = args + [f"{k}={v}" for k, v in sorted(kws.items())]
    return f"{name}({', '.join(parts)})" if parts else name


def norm_default(node, lit=_lit) -> str | None:
    """A server default as one string: a literal or module constant, ``text('x')`` and ``text("'x'")`` → ``x``, ``func.now()`` → ``now()``,
    ``sa.false()`` ≡ ``false()`` ≡ ``"false"``, an enum member's ``.name`` or resolvable ``.value``; an explicit ``None`` is none."""
    if node is None or (isinstance(node, ast.Constant) and node.value is None):
        return None
    val = lit(node)
    if isinstance(val, (str, int, float, bool)):
        return str(val)
    if isinstance(node, ast.Call) and _leaf(node.func) == "text" and node.args and isinstance(lit(node.args[0]), str):
        sql = lit(node.args[0])
        return sql[1:-1] if len(sql) >= 2 and sql[0] == sql[-1] == "'" else sql
    if isinstance(node, ast.Call) and not node.args and not node.keywords and _leaf(node.func) in ("false", "true"):
        return _leaf(node.func)
    if isinstance(node, ast.Attribute) and node.attr in ("name", "value") and isinstance(node.value, ast.Attribute):
        if node.attr == "name":
            return node.value.attr
        member = lit(node.value)
        if isinstance(member, str):
            return member
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and isinstance(node.func.value, (ast.Attribute, ast.Name)) \
            and _leaf(node.func.value) == "func":
        return f"{node.func.attr}()"
    return ast.unparse(node)


def column(call: ast.Call, lit=_lit) -> tuple[str | None, dict]:
    """``sa.Column("x", Type, ForeignKey(...), nullable=, server_default=, primary_key=)`` → (name, facts); ``lit`` resolves
    the revision's constants and loop names."""
    args = list(call.args)
    name = lit(args.pop(0)) if args and isinstance(lit(args[0]), str) else None
    kw = {k.arg: k.value for k in call.keywords if k.arg}
    col_type, fk = None, None
    for a in args:
        if isinstance(a, ast.Call) and _leaf(a.func) == "ForeignKey":
            target = _lit(a.args[0]) if a.args else None
            ondelete = next((_lit(k.value) for k in a.keywords if k.arg == "ondelete"), None)
            fk = {"target": target, "ondelete": ondelete}
        elif col_type is None:
            col_type = norm_type(a)
    if "type_" in kw and col_type is None:
        col_type = norm_type(kw["type_"])
    pk = _lit(kw["primary_key"]) is True if "primary_key" in kw else False
    nullable = _lit(kw["nullable"]) if "nullable" in kw else (False if pk else True)
    facts = {"type": col_type, "nullable": nullable, "primary_key": pk, "server_default": norm_default(kw.get("server_default"), lit)}
    if fk:
        facts["fk"] = fk
    return name, facts


def find_trees(repo: Path, is_center=None) -> list[dict]:
    """``[{ini, section, versions}]`` for every ``script_location`` in every ``alembic.ini`` under the repo."""
    out = []
    for root, dirs, files in os.walk(repo):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS and not d.startswith("."))
        rel_root = os.path.relpath(root, repo)
        if is_center and rel_root != "." and is_center(rel_root + "/"):
            dirs[:] = []
            continue
        if "alembic.ini" not in files:
            continue
        ini = Path(root) / "alembic.ini"
        cp = configparser.ConfigParser(interpolation=None)
        try:
            cp.read(ini)
        except configparser.Error:
            continue
        for section in cp.sections():
            own = cp._sections.get(section, {})                    # a section's own keys — DEFAULT inheritance is not a tree
            loc = own.get("script_location")
            if not loc:
                continue
            vl = cp.get(section, "version_locations", fallback="").replace("%(script_location)s", loc).replace("%(here)s", ".").split()
            versions = Path(root) / (vl[0] if vl else f"{loc}/versions")
            rel = os.path.relpath(versions, repo)
            if versions.is_dir() and all(t["versions"] != rel for t in out):
                out.append({"ini": os.path.relpath(ini, repo), "section": section, "versions": rel})
    return out


def _revision(tree: ast.Module) -> tuple[str | None, object]:
    rev, down = None, None
    for n in tree.body:
        if isinstance(n, (ast.Assign, ast.AnnAssign)):
            tgt = n.targets[0] if isinstance(n, ast.Assign) else n.target
            if isinstance(tgt, ast.Name) and tgt.id == "revision":
                rev = _lit(n.value)
            elif isinstance(tgt, ast.Name) and tgt.id == "down_revision":
                down = _lit(n.value)
    return rev, down


def order(repo: Path, versions: str) -> dict:
    """``{files: [rel] in upgrade order, heads: [rev], revisions: n, unreadable: [rel]}``."""
    revs, unreadable = {}, []
    for p in sorted((repo / versions).glob("*.py")):
        try:
            tree = ast.parse(p.read_text())
        except (SyntaxError, UnicodeDecodeError):
            unreadable.append(os.path.relpath(p, repo))
            continue
        rev, down = _revision(tree)
        if rev:
            revs[rev] = {"file": os.path.relpath(p, repo), "down": down, "tree": tree}
    children: dict = {}
    for rev, r in revs.items():
        downs = r["down"] if isinstance(r["down"], (list, tuple)) else [r["down"]]
        for d in downs:
            children.setdefault(d, []).append(rev)
    seen, queue, files = set(), sorted(children.get(None, []), key=lambda x: revs[x]["file"]), []
    while queue:
        rev = queue.pop(0)
        if rev in seen:
            continue
        seen.add(rev)
        files.append(rev)
        queue += sorted((c for c in children.get(rev, []) if c not in seen), key=lambda x: revs[x]["file"])
    referenced = {d for r in revs.values() for d in (r["down"] if isinstance(r["down"], (list, tuple)) else [r["down"]]) if d}
    heads = sorted(rev for rev in revs if rev not in referenced)
    return {"order": files, "revs": revs, "heads": heads, "unreadable": unreadable}


def _cols_arg(node) -> list:
    val = _lit(node)
    return list(val) if isinstance(val, (list, tuple)) else ([val] if isinstance(val, str) else [])


def replay(repo: Path, versions: str) -> dict:
    """``{state, schema{table}, raw_ops, revisions, heads, unreadable}`` for one tree."""
    o = order(repo, versions)
    schema: dict = {}
    dropped: set = set()
    raw = 0

    def table(name):
        return schema.setdefault(name, {"columns": {}, "uniques": [], "checks": [], "indexes": [], "partial": True})

    def put(t, key, row):
        """A named constraint or index replaces one of the same name (a revision that re-creates it under a constant)."""
        tb = table(t)
        tb[key] = [c for c in tb[key] if not row["name"] or c["name"] != row["name"]] + [row]

    consts: dict = {}
    funcs: dict = {}
    env: dict = {}

    def lit(node):
        """A literal, a loop name bound to one element, or a module constant of the revision being replayed."""
        if isinstance(node, ast.Name) and node.id in env:
            return env[node.id]
        if isinstance(node, ast.Name) and node.id in consts:
            return consts[node.id]
        return _lit(node)

    def spread(node) -> list:
        """``*_timestamps()`` — the elements a module helper's ``return (…)`` names."""
        if not (isinstance(node, ast.Starred) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name)):
            return [node]
        fn = funcs.get(node.value.func.id)
        ret = next((r.value for r in ast.walk(fn) if isinstance(r, ast.Return) and isinstance(r.value, (ast.Tuple, ast.List))), None) if fn else None
        return list(ret.elts) if ret is not None else []

    def elements(node) -> list | None:
        """What a ``for`` iterates when it is readable: a literal or constant sequence, through ``reversed``/``sorted``."""
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in ("reversed", "sorted") and len(node.args) == 1:
            node = node.args[0]
        val = lit(node)
        return list(val) if isinstance(val, (list, tuple)) else None

    def cols_arg(node) -> list:
        val = lit(node)
        return list(val) if isinstance(val, (list, tuple)) else ([val] if isinstance(val, str) else [])

    def apply(verb: str, args: list, kw: dict, bound: str | None) -> None:
        nonlocal raw
        if verb == "execute" and args and isinstance(lit(args[0]), str):   # §A4 V16: the one raw statement the replay
            mt = _RENAME_COL.match(lit(args[0]))                             # can read — a column rename in SQL
            if mt and mt.group(1) in schema and mt.group(2) in schema[mt.group(1)]["columns"]:
                schema[mt.group(1)]["columns"][mt.group(3)] = schema[mt.group(1)]["columns"].pop(mt.group(2))
                return
        if verb in RAW_OPS:
            raw += 1
            return
        t = bound
        if verb == "create_table" and args and isinstance(lit(args[0]), str):
            schema[lit(args[0])] = {"columns": {}, "uniques": [], "checks": [], "indexes": [], "partial": False}
            tb = table(lit(args[0]))
            dropped.discard(lit(args[0]))
            for a in (x for arg in args[1:] for x in spread(arg)):
                if isinstance(a, ast.Call) and _leaf(a.func) == "Column":
                    name, facts = column(a, lit)
                    if name:
                        tb["columns"][name] = facts
                elif isinstance(a, ast.Call) and _leaf(a.func) == "UniqueConstraint":
                    tb["uniques"].append({"name": next((lit(k.value) for k in a.keywords if k.arg == "name"), None), "cols": [lit(x) for x in a.args]})
                elif isinstance(a, ast.Call) and _leaf(a.func) == "CheckConstraint":
                    tb["checks"].append({"name": next((lit(k.value) for k in a.keywords if k.arg == "name"), None), "sql": lit(a.args[0]) if a.args else None})
            return
        if verb == "drop_table" and args:
            if schema.pop(lit(args[0]), None) is not None:
                dropped.add(lit(args[0]))
            return
        if verb == "rename_table" and len(args) >= 2:
            old, new = lit(args[0]), lit(args[1])
            if isinstance(old, str) and isinstance(new, str) and old in schema:
                schema[new] = schema.pop(old)
                dropped.discard(new)
            return
        if bound is None and args:                               # unbound: which positional argument names the table
            if verb in NAME_FIRST and len(args) >= 2:
                t = lit(args[1])
                args = [args[0]] + args[2:]
            elif verb not in ("drop_index",):
                t = lit(args[0])
                args = args[1:]
        if not isinstance(t, str) and verb != "drop_index":
            return
        if verb == "add_column" and args and isinstance(args[0], ast.Call):
            name, facts = column(args[0], lit)
            if name:
                table(t)["columns"][name] = facts
        elif verb == "drop_column" and args:
            table(t)["columns"].pop(lit(args[0]), None)
        elif verb == "alter_column" and args:
            col = table(t)["columns"].setdefault(lit(args[0]), {"type": None, "nullable": True, "primary_key": False, "server_default": None})
            if "nullable" in kw:
                col["nullable"] = lit(kw["nullable"])
            if "server_default" in kw:
                col["server_default"] = norm_default(kw["server_default"], lit)
            if "type_" in kw:
                col["type"] = norm_type(kw["type_"])
            if "new_column_name" in kw and isinstance(lit(kw["new_column_name"]), str):
                table(t)["columns"][lit(kw["new_column_name"])] = table(t)["columns"].pop(lit(args[0]))
        elif verb == "create_check_constraint" and len(args) >= 1:
            put(t, "checks", {"name": lit(args[0]), "sql": lit(args[1]) if len(args) > 1 else None})
        elif verb == "create_unique_constraint" and len(args) >= 2:
            put(t, "uniques", {"name": lit(args[0]), "cols": cols_arg(args[1])})
        elif verb == "drop_constraint" and args:
            name = lit(args[0])
            for key in ("uniques", "checks"):
                table(t)[key] = [c for c in table(t)[key] if c["name"] != name]
        elif verb == "create_foreign_key" and len(args) >= 4:
            referent = lit(args[1])
            for local, remote in zip(cols_arg(args[2]), cols_arg(args[3])):
                col = table(t)["columns"].get(local)
                if col is not None:
                    col["fk"] = {"target": f"{referent}.{remote}", "ondelete": lit(kw["ondelete"]) if "ondelete" in kw else None}
        elif verb == "create_index" and len(args) >= 2:
            put(t, "indexes", {"name": lit(args[0]), "cols": cols_arg(args[1]), "unique": lit(kw["unique"]) is True if "unique" in kw else False})
        elif verb == "drop_index" and args:
            name = lit(args[0])
            for tb in schema.values():
                tb["indexes"] = [i for i in tb["indexes"] if i["name"] != name]

    def walk(stmts, bound_alias: dict) -> None:
        for st in stmts:
            if isinstance(st, (ast.With, ast.AsyncWith)):
                inner = dict(bound_alias)
                for it in st.items:
                    ce = it.context_expr
                    if isinstance(ce, ast.Call) and _leaf(ce.func) == "batch_alter_table" and ce.args and isinstance(it.optional_vars, ast.Name):
                        inner[it.optional_vars.id] = lit(ce.args[0])
                walk(st.body, inner)
                continue
            if isinstance(st, ast.For) and isinstance(st.target, ast.Name) and elements(st.iter) is not None:
                had, old = st.target.id in env, env.get(st.target.id)
                for val in elements(st.iter):                   # the body once per element, the loop name bound
                    env[st.target.id] = val
                    walk(st.body, bound_alias)
                if had:
                    env[st.target.id] = old
                else:
                    env.pop(st.target.id, None)
                continue
            for n in ast.walk(st) if not isinstance(st, (ast.If, ast.For, ast.Try)) else []:
                if not (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and isinstance(n.func.value, ast.Name)):
                    continue
                recv = n.func.value.id
                if recv == "op":
                    apply(n.func.attr, list(n.args), {k.arg: k.value for k in n.keywords if k.arg}, None)
                elif recv in bound_alias:
                    apply(n.func.attr, list(n.args), {k.arg: k.value for k in n.keywords if k.arg}, bound_alias[recv])
            if isinstance(st, (ast.If, ast.For, ast.Try)):
                walk(getattr(st, "body", []), bound_alias)
                walk(getattr(st, "orelse", []), bound_alias)

    for rev in o["order"]:
        mod = o["revs"][rev]["tree"]
        consts.clear()
        consts.update({t.id: _lit(n.value) for n in mod.body if isinstance(n, ast.Assign) for t in n.targets
                       if isinstance(t, ast.Name) and _lit(n.value) is not None})
        funcs.clear()
        funcs.update({n.name: n for n in mod.body if isinstance(n, ast.FunctionDef)})
        env.clear()
        up = next((n for n in mod.body if isinstance(n, ast.FunctionDef) and n.name == "upgrade"), None)
        if up is not None:
            walk(up.body, {})
    return {"state": "unknown" if len(o["heads"]) != 1 else "defined", "schema": schema, "dropped": sorted(dropped), "raw_ops": raw,
            "revisions": len(o["revs"]), "heads": o["heads"], "unreadable": o["unreadable"]}
