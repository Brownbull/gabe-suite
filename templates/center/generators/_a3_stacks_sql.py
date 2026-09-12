#!/usr/bin/env python3
"""_a3_stacks_sql.py — the RAW-SQL arm: tables and access read out of SQL string literals.

The FastAPI arm finds tables by parsing `class X(SQLModel, table=True)` and access by reading ORM
session verbs. An app that talks to Postgres through a driver has neither: its schema is a
`CREATE TABLE` inside a template string and its reads and writes are `pool.query("SELECT … FROM
users")`. keypro-front has 2 tables and 15 statements that way, and the map drew none of them — the
STORE column on every journey step was empty, which a reader takes as "this app stores nothing".

This arm reads those literals. It is a FLOOR, never a census: it sees SQL it can find in a string,
in any language, and says so. Dynamic SQL, a query builder, an ORM in a language no other arm
covers — none of it is here, and the arms census reports the gap rather than this file pretending.

Contract (frozen, matching the FastAPI arm's records so every consumer is untouched):
  R2 table  {cls, table, file, doc, cols[(name, type, desc)], fks{col: "table.col"}, rels[], uqs[]}
            `cls` CARRIES THE TABLE NAME, not None. The plan said cls was nullable and consumers
            would key on `table`; 81 hard `["cls"]` reads across the generators said otherwise, and
            three of them killed the build outright — _a3_tests ran re.sub over None, _a3_codetab
            ran html.escape over it, and each crash took the whole regen down to render one link.
            A nullable field that 81 readers assume is a string is not a contract, it is a fuse.
            The table name is also exactly what every surface would have labelled it.
  R4 access {model, table, rw}  — `model` CARRIES THE TABLE NAME, for the same reason `cls` does.
            A None there collapsed every raw-SQL op into one key (_a3_graft:433 keys on
            (model, rw)), crashed the sort at :439 on any tree mixing ORM and raw-SQL rows, and
            drew `model:null` in the station (:2173). One None, three breakages.
            FLOOR: an access table must be lower_snake, or `SELECT Id FROM User` (Salesforce SOQL,
            measured on tier3) counts as one of the app's tables. A PascalCase table is missed and
            reported by the census, never guessed at.

Own try/except per pass, like the web arm: a parser bug degrades this to honest-empty and never
touches the FK topology or any other arm's output.
"""
from __future__ import annotations

import json
import re as _re
from pathlib import Path

# a table declaration inside a string literal, whatever the host language
_CREATE_RX = _re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\"`\[]?(\w+)[\"`\]]?\s*\((.*?)\)\s*;",
    _re.I | _re.S)
_ALTER_ADD_RX = _re.compile(
    r"ALTER\s+TABLE\s+[\"`\[]?(\w+)[\"`\]]?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?[\"`\[]?(\w+)[\"`\]]?\s+([A-Za-z][\w ()]*)",
    _re.I)
_FK_RX = _re.compile(r"[\"`\[]?(\w+)[\"`\]]?[^,]*?REFERENCES\s+[\"`\[]?(\w+)[\"`\]]?\s*\(\s*[\"`\[]?(\w+)", _re.I | _re.S)
_UQ_RX = _re.compile(r"CREATE\s+(UNIQUE)\s+INDEX[^;]*?\bON\s+[\"`\[]?(\w+)[\"`\]]?\s*\(([^)]*)\)", _re.I | _re.S)

# Each verb must be followed by the STRUCTURE that makes it a statement rather than a sentence:
# INSERT INTO t (…|VALUES|SELECT) · UPDATE t SET · DELETE FROM t (WHERE|;|end) · SELECT … FROM t.
# Without this, prose inside a string literal ("UPDATE the docs", "DELETE FROM its cache") scored
# as access: `the`, `its` and `EVERY` were table names on gustify.
_INSERT_RX = _re.compile(r"\bINSERT\s+INTO\s+[\"`\[]?([a-z_][a-z0-9_]{2,})[\"`\]]?\s*(?:\(|VALUES\b|SELECT\b)", _re.I)
_UPDATE_RX = _re.compile(r"\bUPDATE\s+[\"`\[]?([a-z_][a-z0-9_]{2,})[\"`\]]?\s+SET\b", _re.I)
_DELETE_RX = _re.compile(r"\bDELETE\s+FROM\s+[\"`\[]?([a-z_][a-z0-9_]{2,})[\"`\]]?\s*(?:WHERE\b|;|$)", _re.I | _re.M)
_READ_RX = _re.compile(r"\bSELECT\b[^;]{0,400}?\bFROM\s+[\"`\[]?([a-z_][a-z0-9_]{2,})[\"`\]]?\s*(?:\bWHERE\b|\bJOIN\b|\bORDER\b|\bLIMIT\b|\bGROUP\b|[;,)\s]|$)", _re.I | _re.M)
_WRITE_RXS = (_INSERT_RX, _UPDATE_RX, _DELETE_RX)

# SQL lives in a STRING LITERAL — the whole premise of this arm, and the only reliable way to tell
# a statement from a sentence about one. Quoted spans in any hosting language; a .sql file IS one.
_LIT_PARTS = [
    r'"""(.*?)"""',
    r"'''(.*?)'''",
    r'`([^`]*)`',
    r'"((?:[^"\\\n]|\\.)*)"',
    r"'((?:[^'\\\n]|\\.)*)'",
]
_LITERALS_RX = _re.compile("|".join(_LIT_PARTS), _re.S)


def _literal_text(path: Path, text: str) -> str:
    """Every string literal in the file, concatenated. A .sql file IS the literal."""
    if path.suffix == ".sql":
        return text
    return "\n".join(g for m in _LITERALS_RX.finditer(text) for g in m.groups() if g)

_SRC_EXT = (".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rb", ".sql")
_SKIP = ("/node_modules/", "/.venv/", "/venv/", "/site-packages/", "/__pycache__/", "/.git/",
         "/build/", "/dist/", "/scripts/", "/docs/site/", "/templates/", "/graft/", "/.next/",
         "/vendor/", "/.mypy_cache/")
_FILE_CAP = 4000                       # a bound, stated on the result — never a silent truncation
# A MIGRATION is schema history, not request-path access. Its INSERTs ran once, years ago, outside
# any endpoint; recording them as access would put "recipes: write" on a file no request reaches.
# Tables are still read from anywhere — a CREATE TABLE is a table wherever it lives.
_MIGRATION_DIRS = ("/alembic/", "/migrations/", "/migrate/", "/db/migrate/", "/versions/")


def _is_test(rel: str) -> bool:
    return ".test." in rel or ".spec." in rel or "/__tests__/" in "/" + rel


def _is_migration(rel: str) -> bool:
    return any(d in "/" + rel for d in _MIGRATION_DIRS)

# a column line inside CREATE TABLE ( … ) that is a CONSTRAINT, not a column
_SPAN_RX = _re.compile(r"L(\d+)-L(\d+)")
_NOT_A_COL = _re.compile(r"^\s*(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b", _re.I)


def _columns(body: str) -> list[list[str]]:
    """`[[name, type, ""]]` from a CREATE TABLE body. Splits on top-level commas only, so
    `NUMERIC(10, 2)` stays one column."""
    out: list[list[str]] = []
    depth = 0
    cur: list[str] = []
    parts: list[str] = []
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(cur)); cur = []
            continue
        cur.append(ch)
    if cur:
        parts.append("".join(cur))
    for raw in parts:
        line = raw.strip().strip("\n")
        if not line or _NOT_A_COL.match(line) or line.startswith("--"):
            continue
        line = _re.sub(r"--[^\n]*", "", line).strip()
        m = _re.match(r'^[\"`\[]?(\w+)[\"`\]]?\s+([A-Za-z][\w ]*(?:\([^)]*\))?)', line)
        if m:
            out.append([m.group(1), m.group(2).strip(), ""])
    return out


def _files(repo: Path) -> tuple[list[Path], bool]:
    out: list[Path] = []
    for p in sorted(repo.rglob("*")):
        if len(out) >= _FILE_CAP:
            return out, True
        if not p.is_file() or p.suffix not in _SRC_EXT:
            continue
        if any(s in "/" + p.relative_to(repo).as_posix() for s in _SKIP):
            continue
        out.append(p)
    return out, False


def _tbl_ok(t: str) -> bool:
    """A FLOOR, stated: an access table must be lower_snake. SQL is case-insensitive but the
    convention is overwhelming, and the alternative is counting `SELECT Id FROM User` — SALESFORCE
    SOQL, measured on tier3 — as one of the app's tables."""
    return bool(t) and t == t.lower()


def _sql_sites(path: Path, text: str) -> list[tuple[str, str, int]]:
    """`[(table, rw, line)]` for every statement in a string literal, with the SOURCE line it sits
    on. The line is what lets a statement be joined to the FUNCTION that runs it — concatenating
    the literals first was simpler and threw exactly that away."""
    out: list[tuple[str, str, int]] = []

    def _scan(chunk: str, base: int) -> None:
        for rx in _WRITE_RXS:
            for m in rx.finditer(chunk):
                if _tbl_ok(m.group(1)):
                    out.append((m.group(1), "w", base + chunk.count("\n", 0, m.start())))
        for m in _READ_RX.finditer(chunk):
            if _tbl_ok(m.group(1)):
                out.append((m.group(1), "r", base + chunk.count("\n", 0, m.start())))

    if path.suffix == ".sql":
        _scan(text, 1)
        return out
    for lm in _LITERALS_RX.finditer(text):
        g = next((x for x in lm.groups() if x is not None), None)
        if not g:
            continue
        _scan(g, text.count("\n", 0, lm.start()) + 1)
    return out


def join_functions(repo: Path, access: dict[str, list]) -> dict[str, dict]:
    """`{"<file>::<fn>": {"file", "fn", "access": {"ops": [...]}}}` — each statement attached to the
    FUNCTION whose graft span contains its line.

    This is the join the STORE column was missing: `function_insight` is keyed `file::fn` and built
    by the PYTHON scanner, so a TypeScript file's SQL had no function to hang on and the data layer
    stopped at the archmap. graft already indexes ts/tsx functions WITH spans, so the join needs no
    new parse — only the line this arm now records.

    A statement inside no function's span (module scope) is dropped and COUNTED, never guessed onto
    a neighbour. No graft index → `{}`, and the census says the join did not run."""
    out: dict[str, dict] = {}
    try:
        idx = Path(repo) / "graft" / ".graph" / "wiring.json"
        if not idx.is_file():
            return out
        nodes = (json.loads(idx.read_text(encoding="utf-8")) or {}).get("nodes") or []
    except Exception:  # noqa: BLE001
        return out
    spans: dict[str, list[tuple[int, int, str]]] = {}
    for n in nodes:
        if n.get("kind") not in ("function", "method"):
            continue
        m = _SPAN_RX.match(str(n.get("span") or ""))
        p = n.get("path")
        if not m or not p or "#" not in str(n.get("id") or ""):
            continue
        spans.setdefault(p, []).append((int(m.group(1)), int(m.group(2)), str(n["id"]).split("#", 1)[1]))
    for rel, sites in access.items():
        cands = spans.get(rel) or []
        for site in sites:
            line = site.get("line")
            if line is None:
                continue
            # the INNERMOST enclosing span wins — a method inside a class both contain the line
            best = None
            for lo, hi, fn in cands:
                if lo <= line <= hi and (best is None or (hi - lo) < (best[1] - best[0])):
                    best = (lo, hi, fn)
            if best is None:
                continue
            key = f"{rel}::{best[2]}"
            rec = out.setdefault(key, {"file": rel, "fn": best[2], "access": {"ops": []}})
            op = {"model": site["table"], "table": site["table"], "rw": site["rw"]}
            if op not in rec["access"]["ops"]:
                rec["access"]["ops"].append(op)
    return out


def parse(repo: Path, orm_tables: int = 0, orm_access: int = 0) -> dict:
    """`{present, reason, tables[R2], access{file: [R4]}, stats, role}`. Never raises.

    ROLE — this arm is the data layer's FALLBACK, not a second opinion. When another arm already
    produced tables and access for the repo, this one reports `role: "unused"` and contributes
    nothing: two arms claiming one concept is how a map acquires a confident wrong answer. Measured
    reasons, all four study repos, 2026-09-11:
      · gustify/gastify have genuine runtime raw SQL beside a working ORM arm — true, but already
        described, and merging it would double-count the same reads.
      · tier3 reads `SELECT Id FROM User` out of a SALESFORCE SOQL literal; `User` is not one of
        its tables. A fallback that only speaks when nothing else does cannot make that mistake.
      · keypro-front has no ORM arm at all, which is exactly when this one should answer."""
    repo = Path(repo)
    res: dict = {"present": False, "reason": "", "tables": [], "access": {}, "role": "fallback",
                 "stats": {"files": 0, "capped": False, "statements": 0, "writes": 0, "reads": 0}}
    try:
        files, capped = _files(repo)
        res["stats"]["files"] = len(files); res["stats"]["capped"] = capped
        by_table: dict[str, dict] = {}
        access: dict[str, list] = {}
        for p in files:
            rel = p.relative_to(repo).as_posix()
            try:
                text = p.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            raw = text                              # keep the source for line numbers
            text = _literal_text(p, text)          # SQL in a literal, never SQL in a sentence
            # ALTER must be in the cheap gate too: a file whose only SQL is
            # `ALTER TABLE users ADD COLUMN email` has no CREATE and no statement verb, so it was
            # skipped outright and its column never reached the table — keypro's `email`.
            _up = text.upper()
            if not text or ("CREATE TABLE" not in _up and "ALTER TABLE" not in _up
                            and not any(rx.search(text) for rx in _WRITE_RXS)
                            and not _READ_RX.search(text)):
                continue
            for m in _CREATE_RX.finditer(text):
                tbl, body = m.group(1), m.group(2)
                rec = by_table.setdefault(tbl, {"cls": tbl, "table": tbl, "file": rel, "doc": "",
                                                "cols": [], "fks": {}, "rels": [], "uqs": []})
                # a table's HOME must not be a test file: files are walked sorted, so
                # `schema.test.ts` claimed `users` before `schema.ts` did — and the code map
                # excludes `.test.` from an entity's files, so the table homed nowhere and the
                # model was dropped. A real declaration always wins the home from a test one.
                if _is_test(rec["file"]) and not _is_test(rel):
                    rec["file"] = rel
                # CREATE wins over an ALTER stub: files are walked in sorted order, so an
                # `ALTER TABLE users ADD COLUMN email` seen first created a one-column record and
                # `rec["cols"] or …` then kept it, discarding the real DDL's eight. Merge instead,
                # with the declared columns first and any ALTER-added ones appended.
                declared = _columns(body)
                if declared:
                    added = [c for c in rec["cols"] if c[0] not in {d[0] for d in declared}]
                    rec["cols"] = declared + added
                for f in _FK_RX.finditer(body):
                    rec["fks"][f.group(1)] = f"{f.group(2)}.{f.group(3)}"
            for m in _ALTER_ADD_RX.finditer(text):
                tbl, col, typ = m.group(1), m.group(2), m.group(3).strip()
                rec = by_table.setdefault(tbl, {"cls": tbl, "table": tbl, "file": rel, "doc": "",
                                                "cols": [], "fks": {}, "rels": [], "uqs": []})
                # a table's HOME must not be a test file: files are walked sorted, so
                # `schema.test.ts` claimed `users` before `schema.ts` did — and the code map
                # excludes `.test.` from an entity's files, so the table homed nowhere and the
                # model was dropped. A real declaration always wins the home from a test one.
                if _is_test(rec["file"]) and not _is_test(rel):
                    rec["file"] = rel
                if col not in [c[0] for c in rec["cols"]]:
                    rec["cols"].append([col, typ, "added by ALTER TABLE"])
            for m in _UQ_RX.finditer(text):
                rec = by_table.get(m.group(2))
                if rec is not None:
                    # `uqs` is a list of STRINGS — the constraint's source text, matching the
                    # Python arm ("UniqueConstraint('user_id', name='uq_…')"). Emitting a list of
                    # lists here made _a3_codetab._dm_detail run re.findall over a list and take
                    # the whole regen down. A functional index also reads `lower(email)`, and
                    # `([^)]*)` stops at the inner paren, so the expression is rebalanced first.
                    cols = []
                    for c in m.group(3).split(","):
                        c = c.strip().strip('"`[]')
                        if c.count("(") > c.count(")"):
                            c += ")" * (c.count("(") - c.count(")"))
                        if c:
                            cols.append(c)
                    if cols:
                        _uq = "UNIQUE (%s)" % ", ".join(cols)
                        if _uq not in rec["uqs"]:
                            rec["uqs"].append(_uq)
            # (the lower_snake floor now lives at module scope as _tbl_ok)
            # SQL is case-insensitive but the
            # convention is overwhelming, and the alternative is counting `SELECT Id FROM User` —
            # SALESFORCE SOQL, measured on tier3 — as one of the app's tables. A table genuinely
            # declared in PascalCase is missed here and named by the arms census instead of guessed.
            # sites carry their SOURCE LINE, which is what join_functions() needs to attach a
            # statement to the function that runs it
            sites = _sql_sites(p, raw)
            # dedup on (table, rw, LINE), not (table, rw): collapsing per FILE threw away every
            # statement after the first of its kind, so `findByEmail`'s SELECT vanished because
            # `list`'s had already claimed `users r` — five functions became two. The join dedups
            # per FUNCTION afterwards, which is the level that actually carries meaning.
            seen = set(); uniq = []
            for tbl, rw, line in sites:
                k = (tbl, rw, line)
                if k in seen:
                    continue
                seen.add(k)
                uniq.append({"model": tbl, "table": tbl, "rw": rw, "line": line})
            if uniq and not _is_migration(rel):
                access[rel] = uniq
                res["stats"]["statements"] += len(uniq)
                res["stats"]["writes"] += sum(1 for o in uniq if o["rw"] == "w")
                res["stats"]["reads"] += sum(1 for o in uniq if o["rw"] == "r")
        res["tables"] = [by_table[t] for t in sorted(by_table)]
        res["access"] = access
        res["present"] = bool(res["tables"] or access)
        if orm_tables and orm_access:
            # another arm already describes this repo's data layer — report, never merge
            res["role"] = "unused"
            res["reason"] = (f"an ORM arm already produced {orm_tables} table(s) and {orm_access} "
                             "access record(s) — this fallback stays silent rather than "
                             "double-counting a data layer that is already described")
        elif not res["present"]:
            res["reason"] = ("no CREATE TABLE or SQL statement found in a string literal under the "
                             "scanned roots")
    except Exception as exc:  # noqa: BLE001 — its own try/except: a parser bug degrades to empty
        return {"present": False, "reason": f"sql arm error: {exc}", "tables": [], "access": {},
                "stats": {"files": 0, "capped": False, "statements": 0, "writes": 0, "reads": 0}}
    return res
