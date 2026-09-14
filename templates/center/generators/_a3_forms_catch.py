"""Element forms — the catch vocabulary the generation arms share (amendment 1).

The words are ``_a3_paths._climb``'s, so a path, an effect and a function form never disagree about a handler:
``translate`` (the handler raises an HTTP refusal) · ``pass-through`` (a bare ``raise`` or ``raise <bound name>`` —
the next try out decides) · ``rethrow`` (it raises a DIFFERENT class) · ``swallow`` (it returns normally), and
``escape`` when no handler matches. ``_climb`` stops at the first decision; ``trail`` keeps every handler an
exception passes, which is what a path needs to draw. ``actions`` lists what a handler DOES on its way: rollbacks,
calls, calls inside ``contextlib.suppress``, the raise that ends it. Matching follows Python's hierarchy: ``except
Exception`` never catches a class that derives from ``BaseException`` alone (``KeyboardInterrupt`` · ``SystemExit`` ·
``GeneratorExit`` · ``asyncio.CancelledError``) — a rule ``_a3_paths._climb`` does not apply yet.
"""
from __future__ import annotations

import ast

import _a3_paths as P

_ROLLBACK = frozenset({"rollback"})
_SUPPRESS = frozenset({"suppress"})
_BASE_ONLY = frozenset({"BaseException", "KeyboardInterrupt", "SystemExit", "GeneratorExit", "CancelledError",
                        "BaseExceptionGroup"})


def _matches(h, cls: str, bases) -> bool:
    types = P._handler_types(h)
    if types is None:
        return True                                   # a bare `except:` catches everything
    lineage = {cls} | set(bases or ())
    base_only = bool(lineage & _BASE_ONLY) and "Exception" not in lineage
    return bool(types & (lineage | {"BaseException"} | (set() if base_only else {"Exception"})))


def classify(h, hev: dict) -> str:
    """One handler's outcome, in ``_climb``'s precedence: translate > pass-through > rethrow > swallow."""
    raises = [e for e in hev.get(id(h), []) if e["kind"] == "raise"]
    if any(P._http_parts(e["node"].exc) for e in raises):
        return "translate"
    if any(P._is_reraise(e["node"].exc, h) for e in raises):
        return "pass-through"
    if raises:
        return "rethrow"
    return "swallow"


def trail(cls: str, bases, tries: tuple, hev: dict) -> list[dict]:
    """Every handler ``cls`` passes, innermost try first, ending at the first non-pass-through handler or
    ``{"op": "escape"}``. Python picks the FIRST matching handler of a try, so one entry per try at most."""
    out: list[dict] = []
    for t in reversed(tries):
        for h in t.handlers:
            if not _matches(h, cls, bases):
                continue
            op = classify(h, hev)
            out.append({"try": t.lineno, "handler": h.lineno, "types": sorted(P._handler_types(h) or {"*"}), "op": op})
            if op != "pass-through":
                return out
            break
    out.append({"op": "escape"})
    return out


def actions(h) -> list[dict]:
    """What a handler does, in source order: ``rollback`` · ``call`` (``suppressed`` inside contextlib.suppress) ·
    ``return`` · ``raise`` (a new exception) · ``pass-through`` (a bare or bound re-raise). A row from the handler of a
    try NESTED inside ``h`` carries ``in_handler`` (that handler's line): its re-raise passes THAT exception on, not
    ``h``'s."""
    out: list[dict] = []

    def calls(node, suppressed: bool, inner) -> None:
        for n in ast.walk(node):
            if isinstance(n, ast.Call):
                row = {"op": "rollback" if P._leaf(n.func) in _ROLLBACK else "call", "at": n.lineno, "call": P._unp(n.func, 80)}
                if suppressed:
                    row["suppressed"] = True
                if inner is not h:
                    row["in_handler"] = inner.lineno
                out.append(row)

    def mark(row: dict, inner) -> dict:
        if inner is not h:
            row["in_handler"] = inner.lineno
        return row

    def visit(stmts, suppressed: bool, inner) -> None:
        for st in stmts:
            if isinstance(st, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                continue
            if isinstance(st, (ast.With, ast.AsyncWith)):
                sup = any(P._leaf(it.context_expr) in _SUPPRESS for it in st.items)
                for it in st.items:
                    if P._leaf(it.context_expr) not in _SUPPRESS:      # suppress() itself rides as `suppressed` on the calls inside
                        calls(it.context_expr, suppressed, inner)
                visit(st.body, suppressed or sup, inner)
            elif isinstance(st, ast.Raise):
                if st.exc is None or P._is_reraise(st.exc, inner):
                    out.append(mark({"op": "pass-through", "at": st.lineno}, inner))
                else:
                    out.append(mark({"op": "raise", "at": st.lineno, "call": P._unp(st.exc, 80)}, inner))
            elif isinstance(st, (ast.If, ast.While)):
                calls(st.test, suppressed, inner)
                visit(st.body, suppressed, inner)
                visit(st.orelse, suppressed, inner)
            elif isinstance(st, (ast.For, ast.AsyncFor)):
                calls(st.iter, suppressed, inner)
                visit(st.body, suppressed, inner)
                visit(st.orelse, suppressed, inner)
            elif isinstance(st, P._TRY):
                visit(st.body, suppressed, inner)
                for hh in st.handlers:
                    visit(hh.body, suppressed, hh)
                visit(st.orelse, suppressed, inner)
                visit(st.finalbody, suppressed, inner)
            else:
                if isinstance(st, ast.Return):
                    out.append(mark({"op": "return", "at": st.lineno}, inner))
                calls(st, suppressed, inner)

    visit(h.body, False, h)
    return out
