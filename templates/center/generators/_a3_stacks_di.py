#!/usr/bin/env python3
"""_a3_stacks_di.py — the PORT SEAM arm: resolve a call that stops at an injected interface.

A ports-and-adapters app cuts its own call graph on purpose. `CookieSessionStore.save` calls
`this.sessions.create(...)` where `sessions` is typed `SessionRepository` — an interface, chosen at
runtime by the composition root. graft resolves a method by NAME, so it drew the hop when the name
happened to be unique (`.save`, one class) and nothing when it was not (`.create`, five classes).
The whole postgres adapter therefore sat outside the walk: 15 methods over 2 tables, reachable by
clicking and by no journey.

This arm reads three facts that are all plainly in the source, and joins them:

  1. FIELD → PORT     `constructor(private readonly sessions: SessionRepository)` — a TypeScript
                      parameter property. 12 of them on keypro, over 10 classes.
  2. CALL SITE        `this.sessions.create(` inside a method — 52 sites on keypro.
  3. PORT → IMPL      graft's own `implements` edges — an EXTRACTED fact, not a guess.

and then, so the answer is not merely "one of these":

  4. BINDING          the composition root's `new PostgresSessionRepository(...)`, and the PREDICATE
                      of the branch it sits in (`if (!config)` over `readPostgresConfig()`).

An edge therefore says WHICH implementation runs, and UNDER WHAT CONDITION — because a call that
reaches two adapters at once is true of the type system and false of every actual run.

FLOORS, stated:
  · A port with several implementations and no distinguishing predicate yields an edge to EACH,
    marked `binding: "ambiguous"`. Reported, never silently resolved to one.
  · Only a file-level composition root is read (the file with the most constructions). A registry
    keyed at runtime, or a DI container that scans, is out of reach and says so.
  · The field→port read is syntactic: a parameter property or a declared field. A field assigned
    from a factory call is not typed here.
  · `implements` is required. No `implements` edge ⇒ no resolution; structural assignability is
    deliberately NOT used (measured on keypro: 5 all-optional-prop interfaces matched all 17
    classes — 85 false pairs against 8 real ones).
"""
from __future__ import annotations

import re as _re
from pathlib import Path
from typing import Any

_SKIP = ("/node_modules/", "/.venv/", "/venv/", "/__pycache__/", "/.git/", "/build/", "/dist/",
         "/scripts/", "/docs/site/", "/templates/", "/graft/", "/.next/", "/vendor/",
         # a test double is not the implementation the app composes. The SOURCE side already
         # skipped `.test.`/`.spec.`; the IMPL side took graft's roster unfiltered, so gustify's
         # whole published TypeScript seam was one test helper and gastify shipped `impls:3`,
         # all three test-only.
         "/test/", "/tests/", "/__tests__/", "/e2e/", "/fixtures/", "/mocks/", "/__mocks__/")
_EXT = (".ts", ".tsx")
_FILE_CAP = 4000

# `private readonly sessions: SessionRepository` / `readonly x: T` / `public y: T` / `sessions: T`
_PARAM_PROP_RX = _re.compile(
    r"(?:private|public|protected|readonly)[\w\s]*?\b([a-z][A-Za-z0-9_]*)\s*:\s*([A-Z][A-Za-z0-9_]*)")
# `this.sessions.create(`
_THIS_CALL_RX = _re.compile(r"this\.([a-z][A-Za-z0-9_]*)\.([a-zA-Z][A-Za-z0-9_]*)\s*\(")
_CLASS_RX = _re.compile(r"^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Z][A-Za-z0-9_]*)", _re.M)
_METHOD_RX = _re.compile(r"^\s{2,}(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([a-zA-Z][A-Za-z0-9_]*)\s*\(", _re.M)
# `if (`, `for (`, `while (` all look like `name(` at the start of an indented line — without this
# the caller of a statement inside an `if` came out as the method "if".
_NOT_A_METHOD = frozenset({
    "if", "for", "while", "switch", "catch", "return", "await", "typeof", "throw", "do", "else",
    "new", "delete", "void", "yield", "super", "function", "get", "set"})
_NEW_RX = _re.compile(r"new\s+([A-Z][A-Za-z0-9_]*)\s*\(")
# the branch a construction sits in: `if (!config) {` / `if (x === "true") {`
_IF_RX = _re.compile(r"^\s*if\s*\((.+?)\)\s*\{?\s*$", _re.M)


def _files(repo: Path) -> list[Path]:
    out: list[Path] = []
    for p in sorted(repo.rglob("*")):
        if len(out) >= _FILE_CAP:
            break
        if p.is_file() and p.suffix in _EXT and not any(
                s in "/" + p.relative_to(repo).as_posix() for s in _SKIP) \
                and ".test." not in p.name and ".spec." not in p.name:
            out.append(p)
    return out


def _paren_end(text: str, at: int) -> int:
    """Offset just past the `)` closing the parameter list opening at or after `at`; -1 if none."""
    i = text.find("(", at)
    if i < 0:
        return -1
    depth, j = 0, i
    while j < len(text):
        if text[j] == "(":
            depth += 1
        elif text[j] == ")":
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    return -1


def _brace_end(text: str, at: int) -> int:
    """Line of the `}` closing the first `{` at or after `at`; 0 when unbalanced."""
    i = text.find("{", at)
    if i < 0:
        return 0
    depth, j = 0, i
    while j < len(text):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                return text.count("\n", 0, j) + 1
        j += 1
    return 0


def _class_spans(text: str) -> list[tuple[str, int, int]]:
    """`[(ClassName, start_line, end_line)]` — a class ends at its closing brace.

    Running a class to the NEXT class overran every span on all four study repos: whatever follows
    the class body — an interface, a const, a second declaration — was harvested as part of it, and
    keypro read 2 of its 17 `fields` out of `interface ParsedHash`."""
    marks = [(m.group(1), text.count("\n", 0, m.start()) + 1, m.start())
             for m in _CLASS_RX.finditer(text)]
    out = []
    lines = text.count("\n") + 1
    for i, (name, ln, off) in enumerate(marks):
        nxt = marks[i + 1][1] - 1 if i + 1 < len(marks) else lines
        be = _brace_end(text, off)
        out.append((name, ln, min(nxt, be) if be else nxt))
    return out


def _method_at(text: str, line: int, cls_lo: int, cls_hi: int) -> str | None:
    """The method whose BODY contains `line` — the narrowest containing span, else None.

    "Nearest declaration above" attributed a call to whatever indented `name(` preceded it, so a
    getter or a bare `clearInterval(...)` on the line before could take the credit. Brace-matching
    each candidate makes containment the test, and a site inside no method body ABSTAINS rather
    than borrowing the name above it."""
    best = None
    for m in _METHOD_RX.finditer(text):
        ln = text.count("\n", 0, m.start()) + 1
        if m.group(1) in _NOT_A_METHOD or not (cls_lo <= ln <= cls_hi):
            continue
        _pe = _paren_end(text, m.end() - 1)
        end = _brace_end(text, _pe) if _pe > 0 else 0
        if not end or not (ln <= line <= end):
            continue
        if best is None or (end - ln) < (best[2] - best[1]):
            best = (m.group(1), ln, end)
    return best[0] if best else None


def parse(repo: Path, wiring: dict[str, Any] | None = None) -> dict:
    """`{present, reason, edges[{s, t, via, port, impl, predicate, binding}], stats}`.

    `s`/`t` are graft-style `<file>#<Class>.<method>` ids, so the result folds straight into the
    calls substrate. Never raises."""
    repo = Path(repo)
    res: dict = {"present": False, "reason": "", "edges": [], "stats": {
        "fields": 0, "sites": 0, "ports": 0, "impls": 0, "resolved": 0, "ambiguous": 0,
        "unresolved": 0, "root": None}}
    try:
        files = _files(repo)
        texts = {p.relative_to(repo).as_posix(): p.read_text(encoding="utf-8", errors="replace")
                 for p in files}

        # 1 + 2 · field → port, and the call sites, per class. SCANNED BEFORE ANY EARLY RETURN:
        # harvesting these inside the resolution loop published `fields:0, sites:0` on every repo
        # that returns early — tier3 read as "declares no port-typed field" across 2,236 TS files
        # it never opened. Costs one pass (~2s on onyx) and buys a number that means what it says.
        scan: list[tuple[str, str, int, int, dict, str]] = []
        for rel, text in texts.items():
            for cls, lo, hi in _class_spans(text):
                body = "\n".join(text.split("\n")[lo - 1:hi])
                fld2port = {m.group(1): m.group(2) for m in _PARAM_PROP_RX.finditer(body)}
                res["stats"]["fields"] += len(fld2port)
                res["stats"]["sites"] += len(_THIS_CALL_RX.findall(body))
                scan.append((rel, cls, lo, hi, fld2port, body))
        res["stats"]["files"] = len(files)
        res["stats"]["capped"] = len(files) >= _FILE_CAP
        if res["stats"]["capped"]:
            # UNCONDITIONAL: the damaging case is `present:true`, where `reason` is never written
            res["stats"]["caveat"] = ("scan clipped at %d files — the composition root and any "
                                      "seam past the cap are unread" % _FILE_CAP)

        # 3 · PORT → IMPL, from graft's own extracted facts
        impls: dict[str, list[str]] = {}
        for e in ((wiring or {}).get("edges") or []):
            if e.get("relation") == "implements" and e.get("source") and e.get("target"):
                src, tgt = str(e["source"]), str(e["target"])
                if any(x in "/" + src for x in _SKIP) or ".test." in src or ".spec." in src:
                    continue
                if "#" not in tgt:
                    # a bare `Reporter` names a file-less port: unresolvable, and counted as such
                    res["stats"]["ports_unresolved"] = res["stats"].get("ports_unresolved", 0) + 1
                    continue
                impls.setdefault(tgt.split("#")[-1], []).append(src)
        res["stats"]["ports"] = len(impls)
        res["stats"]["impls"] = sum(len(v) for v in impls.values())
        if not impls:
            res["reason"] = ("the index carries no `implements` edge, so no port can be joined to "
                             "an implementation — structural matching is deliberately not used")
            return res

        # 4 · the composition ROOT: the file constructing the most DISTINCT KNOWN implementations.
        # Counting every `new X(` made the root whichever file built the most Sets and Errors —
        # gustify crowned a view-model file with 10 `new Set(` and ZERO project classes, and on
        # keypro one ordinary file with 20 builtin `new`s outvoted the real container's 16,
        # stripping the predicate from 54 of 65 edges. A root must construct the things being bound.
        impl_cls = {i.split("#")[-1] for v in impls.values() for i in v}
        counts = {rel: len({m.group(1) for m in _NEW_RX.finditer(t)} & impl_cls)
                  for rel, t in texts.items()}
        root = max(counts, key=lambda k: counts[k]) if counts else None
        if not root or counts[root] < 2:
            root = None
            res["stats"]["root_reason"] = ("no file constructs two or more known implementation "
                                           "classes — no composition root to read predicates from")
        res["stats"]["root"] = root

        # the predicate that selects each construction in the root
        bound: dict[str, str] = {}          # ClassName → predicate ("" when unconditional)
        if root:
            rt = texts[root]
            # An `if` has TWO arms and they select OPPOSITE implementations. Taking the nearest
            # `if` above a construction put `!config` on the postgres adapters too — they sit
            # AFTER the in-memory block returns, so their predicate is its negation. Brace-match
            # the block to tell inside from after.
            spans = []                                      # (cond, first_line, last_line)
            for m in _IF_RX.finditer(rt):
                cond = m.group(1).strip()
                i = rt.find("{", m.start())
                if i < 0:
                    continue
                depth, j = 0, i
                while j < len(rt):
                    if rt[j] == "{":
                        depth += 1
                    elif rt[j] == "}":
                        depth -= 1
                        if depth == 0:
                            break
                    j += 1
                spans.append((cond, rt.count("\n", 0, i) + 1, rt.count("\n", 0, j) + 1))
            for m in _NEW_RX.finditer(rt):
                ln = rt.count("\n", 0, m.start()) + 1
                pred = ""
                for cond, lo, hi in spans:
                    if lo <= ln <= hi:
                        pred = cond                         # inside the block: the condition holds
                    elif ln > hi and not pred:
                        # `not (!config)` is what a reader has to undo in their head — the double
                        # negative is simplified so the predicate reads as the condition it is
                        pred = cond[1:].strip() if cond.startswith("!") else "not (%s)" % cond
                bound.setdefault(m.group(1), pred)

        # 5 · resolve each scanned call site through its field's port
        if True:
            for rel, cls, lo, hi, fld2port, body in scan:
                text = texts[rel]
                for m in _THIS_CALL_RX.finditer(body):
                    fld, meth = m.group(1), m.group(2)
                    port = fld2port.get(fld)
                    if not port or port not in impls:
                        res["stats"]["unresolved"] += 1
                        continue
                    site_line = lo + body.count("\n", 0, m.start())
                    caller = _method_at(text, site_line, lo, hi)
                    if not caller:
                        res["stats"]["unresolved"] += 1
                        continue
                    targets = impls[port]
                    many = len(targets) > 1
                    for impl_id in sorted(targets):
                        impl_cls = impl_id.split("#")[-1]
                        res["edges"].append({
                            "s": f"{rel}#{cls}.{caller}", "t": f"{impl_id}.{meth}",
                            "via": "binding", "port": port, "impl": impl_cls,
                            "predicate": bound.get(impl_cls, ""),
                            # `selected` means the root distinguishes THIS implementation: it has a
                            # predicate, and no sibling carries the same one. Without the sibling
                            # test, 6 of keypro's 65 edges claimed `selected` on a `config` guard
                            # that sat above every construction in the file.
                            "binding": "selected" if (
                                not many or (bound.get(impl_cls) and not any(
                                    bound.get(o.split("#")[-1]) == bound.get(impl_cls)
                                    for o in targets if o != impl_id))) else "ambiguous",
                        })
                    res["stats"]["resolved"] += 1
                    if many:
                        res["stats"]["ambiguous"] += 1
        res["present"] = bool(res["edges"])
        if not res["present"]:
            # DERIVED from what was measured. The hardcoded disjunct told gastify's reader "no class
            # declares a port-typed field" while the census beside it said `fields: 12` — and the
            # real causes (optional chaining `this.x?.close()`, `export default class`) went unnamed.
            _st = res["stats"]
            if _st["fields"] == 0:
                res["reason"] = ("no class declares a field typed by an abstraction — this tree "
                                 "injects through something other than a typed class field")
            elif _st["sites"] == 0:
                res["reason"] = ("classes declare %d port-typed field(s), but none is called as "
                                 "`this.<field>.<method>(`" % _st["fields"])
            else:
                res["reason"] = ("%d call(s) on injected fields, none reaching a port the index "
                                 "carries an `implements` edge for; not read: optional chaining "
                                 "(`this.x?.m()`) and `export default class`" % _st["sites"])
    except Exception as exc:  # noqa: BLE001 — its own try/except, like the web and sql arms
        return {"present": False, "reason": f"di arm error: {exc}", "edges": [],
                "stats": res["stats"]}
    return res
