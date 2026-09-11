#!/usr/bin/env python3
"""_a3_stacks_next.py — the Next.js / React Server Actions arm.

Lifted out of _a3_code.py (extractor-gateway plan, step 6). It never belonged there: _a3_code is
the PYTHON scanner — 233 `ast.` calls over `.py` files — and this is a TypeScript regex parser that
was appended to it because that is where `parse_task_roots` happened to live. One more foreign
stack landing the same way is the mess the register exists to prevent, so the first per-stack
module is carved off now, while there is exactly one thing to carve.

The record shape is unchanged and deliberately identical to parse_task_roots': the generic `_l2`
builder mints `endpoint:ACTION <name>` and the levels walk roots on it with no knowledge that a
different language produced it. `_a3_stacks.REGISTER` names this module for `request_roots`/ts.
"""
from __future__ import annotations

import re as _re_mod
from pathlib import Path

# ── class 15 · ACTION roots: React Server Actions as endpoint-equivalent trace roots.
#    The FastAPI arm roots every chain at an @router handler; a Next.js App Router app has none —
#    its request entries are the exported functions of a `"use server"` module, which the client
#    reaches by IMPORTING them across the server/client line. Same endpoint-shaped record as
#    parse_task_roots (class 13), so the generic `_l2` builder mints `endpoint:ACTION <name>` and
#    the levels walk ROOTS on it: no new node kind, no new seam, and a repo with no server action
#    emits `[]` so every consumer's `or []` union is a no-op (proven byte-identical on gustify,
#    2026-09-11 — docs/design/repo-study/action-roots-spike.md).
#    FLOORS (stated, never hidden): the file-level directive only (an inline per-function
#    "use server" is not read); the `export const x = async () => {}` action form is not read;
#    `touches` is empty — no SQL-in-TS arm yet, so a chain draws calls, not model access.
_ACTION_ROOTS: list | None = None
_ACTION_SKIP = ("node_modules", ".next", "docs/site", "scripts", "templates", "graft", ".git")
_ACTION_EXPORT_RX = _re_mod.compile(r"^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", _re_mod.M)
_ACTION_LEAD_RX = _re_mod.compile(r"^(?:\s*//[^\n]*\n|\s*/\*.*?\*/\s*)*", _re_mod.S)


def parse_action_roots(repo: Path) -> list[dict]:
    """ACTION roots (class 15): every export of a file-level `"use server"` module as an
    endpoint-shaped record `{method:'ACTION', path:<fn>, fn, file, touches, touches_x, doc,
    resp, status}`. `[]` honest-empty on a repo with no server actions."""
    global _ACTION_ROOTS
    if _ACTION_ROOTS is not None:
        return _ACTION_ROOTS
    out: list[dict] = []
    for p in sorted(repo.rglob("*.ts")) + sorted(repo.rglob("*.tsx")):
        rel = p.relative_to(repo).as_posix()
        if any(s in rel for s in _ACTION_SKIP) or ".test." in rel or ".spec." in rel:
            continue
        try:
            src = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        # the directive is the FIRST statement — skip only a leading comment block
        head = _ACTION_LEAD_RX.sub("", src, count=1)[:40].lstrip()
        if not head.startswith(('"use server"', "'use server'")):
            continue
        for m in _ACTION_EXPORT_RX.finditer(src):
            pre = src[:m.start()].rstrip()
            doc = ""
            if pre.endswith("*/") and "/**" in pre:
                blk = pre[pre.rfind("/**"):]
                doc = " ".join(l.strip(" *\t") for l in blk.splitlines()[1:-1] if l.strip(" *\t"))[:200]
            out.append({"method": "ACTION", "path": m.group(1), "fn": m.group(1), "file": rel,
                        "touches": [], "touches_x": [], "doc": doc, "resp": "\u2014", "status": "\u2014"})
    _ACTION_ROOTS = out
    return out


def __getattr__(name: str):
    """Lazy re-export of what left this module (PEP 562). `build_code_tab` moved to _a3_codetab
    (plan step 1); importing it eagerly here would make the two modules import each other, so the
    binding is resolved on first touch instead. A caller saying `_a3_code.build_code_tab` still
    works; a typo still raises AttributeError with the name in it."""
    if name == "build_code_tab":
        from _a3_codetab import build_code_tab
        return build_code_tab
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
