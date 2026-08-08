#!/usr/bin/env python3
"""work_scope.py — the ONE answer to "what is the current work, and whose is it".

Ruling 2026-08-07 (review of the visibility arc): the same two questions —
"which files did this beat change" and "which entities do they belong to" — had
grown FOUR implementations with four different semantics (angles.py literal-only,
write-inflight fnmatch, the ledger fnmatch, _a3_code glob), so the board and the
pulse line could name different entities for the same tree. This module is the
single resolver both the pulse signals (S6/S7) and the in-flight projection
(write-inflight.py) call; /gabe-review's ENTITY DRIFT prose cites it too.

Pure stdlib, no writes. `changed_files` is cached per root within a process.
"""
from __future__ import annotations

import fnmatch
import json
import re
import subprocess
from pathlib import Path

WALK = 10  # clean-tree walk-back window (the bound; the pulse decay record dampens repeats)
# match the projection by BASENAME under any center dir — the suite layout writes it to
# docs/center/, the app layout to docs/site/center/; a path-list check missed the former and
# re-blinded S6/S7 there (review 2026-08-07).
_INFLIGHT = ("inflight.json", "inflight.js")


def _sh(args: list[str], root: Path) -> str:
    try:
        r = subprocess.run(args, cwd=str(root), capture_output=True, text=True, timeout=30)
        return r.stdout if r.returncode == 0 else ""
    except Exception:  # noqa: BLE001
        return ""


def _is_bookkeeping(f: str) -> bool:
    # .kdbp state ticks and the beat-tail's own projection are not "work"; counting
    # them re-blinds the signal exactly as the pre-2026-08-07 HEAD~1..HEAD fallback did.
    # Match inflight by basename so BOTH center layouts (docs/center/, docs/site/center/)
    # are covered.
    return f.startswith(".kdbp/") or f.rsplit("/", 1)[-1] in _INFLIGHT


_CACHE: dict[str, tuple[list[str], str]] = {}


def changed_files(root: Path) -> tuple[list[str], str]:
    """(files, source). source ∈ 'dirty' | '<short-sha>' | 'none'.

    Dirty tree first — tracked modifications AND untracked new files (a phase's
    first files are born untracked; `git diff HEAD` alone calls that tree clean),
    minus bookkeeping. Otherwise walk back ≤WALK commits to the newest one whose
    files are not all bookkeeping — beats end on a .kdbp tick commit, so
    HEAD~1..HEAD would see only bookkeeping.
    """
    key = str(root)
    if key in _CACHE:
        return _CACHE[key]
    dirty = [f for f in _sh(["git", "diff", "--name-only", "HEAD"], root).splitlines() if f.strip()]
    dirty += [f for f in _sh(["git", "ls-files", "--others", "--exclude-standard"], root).splitlines()
              if f.strip()]
    dirty = sorted({f for f in dirty if not _is_bookkeeping(f)})
    if dirty:
        val = (dirty, "dirty")
    else:
        val = ([], "none")
        for sha in _sh(["git", "log", f"-{WALK}", "--format=%H"], root).split():
            files = [f for f in _sh(["git", "diff", "--name-only", f"{sha}~1", sha], root).splitlines()
                     if f.strip()]
            work = [f for f in files if not _is_bookkeeping(f)]
            if work:
                val = (work, sha[:8])
                break
    _CACHE[key] = val
    return val


def _seg_match(f: list[str], p: list[str]) -> bool:
    # anchored, path-aware glob: '*' never crosses '/', '**' matches zero+ segments.
    # This is `repo.glob(pat)` semantics without touching the filesystem — the
    # authoritative code-map form, so the board/pulse and the entity Code tab agree.
    if not p:
        return not f
    if p[0] == "**":
        return _seg_match(f, p[1:]) or (bool(f) and _seg_match(f[1:], p))
    if not f:
        return False
    if fnmatch.fnmatchcase(f[0], p[0]):
        return _seg_match(f[1:], p[1:])
    return False


def matches(path: str, pattern: str) -> bool:
    if not re.search(r"[*?\[]", pattern):
        return path == pattern            # a literal is exact, never a right-anchored tail match
    return _seg_match(path.split("/"), pattern.split("/"))


def entity_code_globs(cfg: dict) -> dict[str, list[str]]:
    """{slug: [every code pattern]} — literals AND globs (dropping globs is the
    bug that made glob-declared entities invisible to the pulse line)."""
    out: dict[str, list[str]] = {}
    for slug, row in (cfg.get("entities") or {}).items():
        pats: list[str] = []
        for _layer, paths in (row.get("code") or {}).items():
            pats += list(paths or [])
        if pats:
            out[slug] = pats
    return out


def layer_globs(cfg: dict) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for _slug, row in (cfg.get("entities") or {}).items():
        for layer, paths in (row.get("code") or {}).items():
            out.setdefault(layer, []).extend(paths or [])
    return out


def touched_entities(cfg: dict, files: list[str]) -> list[dict]:
    """[{slug, files}] sorted by slug — path-derived, never keyword-guessed."""
    globs = entity_code_globs(cfg)
    out = []
    for slug in sorted(globs):
        pats = globs[slug]
        n = sum(1 for f in files if any(matches(f, p) for p in pats))
        if n:
            out.append({"slug": slug, "files": n})
    return out


def touched_layers(cfg: dict, files: list[str]) -> list[str]:
    lg = layer_globs(cfg)
    return sorted(l for l, pats in lg.items() if any(matches(f, p) for f in files for p in pats))


def load_center_config(root: Path):
    """The ONE center-config probe, both layouts. Returns (cfg, center_dir):
    cfg is None when no center exists AND when the config is malformed (a broken
    config is not a usable center); center_dir is the config's directory so a
    caller that also writes into the center (write-inflight) needs no second probe.
    """
    for rel in ("docs/site/center/center.config.json",
                "docs/center/suite-center.config.json"):
        p = root / rel
        if p.is_file():
            try:
                return json.loads(p.read_text(encoding="utf-8")), p.parent
            except json.JSONDecodeError:
                return None, p.parent
    return None, None
