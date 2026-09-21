"""Element forms — the shapes of a REQUEST CARRIER, one definition for the two readers that look for them.

A request carries a value in two places a handler can reach: a header (``request.headers.get(X)`` · ``request.headers[X]``)
and the request's own state (``request.state.<attr>`` · ``getattr(request.state, "attr", …)``). The contract arm reads them
to find the repeat key (U12); the kinds arm's inflight part reads them to say what is alive while the request runs (U15).
Every test here looks at ONE node and nothing moves a walker: the ORDER a caller walks in is what makes ``repeat{}``'s bytes,
and it stays with the caller. No arm is imported.
"""
from __future__ import annotations

import ast
from pathlib import Path

import _a3_forms_settings as S
import _a3_paths as P


def text(repo: Path, m, node) -> str | None:
    """A string argument: a literal, or a module constant through one import."""
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.Name):
        val = S.resolve_const(repo, m, node.id)
        return val if isinstance(val, str) else None
    return None


def hit(repo: Path, m, n) -> dict | None:
    """``{"header": name}`` or ``{"state": attr}`` when THIS node reads a carrier, else None. The four shapes are tested in
    the order the contract arm always tested them; no node can satisfy two, and a name that does not resolve falls through."""
    if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "get" and P._leaf(n.func.value) == "headers" and n.args:
        name = text(repo, m, n.args[0])
        if name:
            return {"header": name}
    if isinstance(n, ast.Subscript) and P._leaf(n.value) == "headers" and text(repo, m, n.slice):
        return {"header": text(repo, m, n.slice)}
    if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "getattr" and len(n.args) >= 2 and P._leaf(n.args[0]) == "state":
        attr = text(repo, m, n.args[1])
        if attr:
            return {"state": attr}
    if isinstance(n, ast.Attribute) and isinstance(n.ctx, ast.Load) and isinstance(n.value, ast.Attribute) and n.value.attr == "state":
        return {"state": n.attr}
    return None


def state_target(t) -> str | None:
    """The attribute a target writes on a carrier's state — ``<x>.state.<attr> = …`` → ``attr``."""
    return t.attr if isinstance(t, ast.Attribute) and isinstance(t.value, ast.Attribute) and t.value.attr == "state" else None
