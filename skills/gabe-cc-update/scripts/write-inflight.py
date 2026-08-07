#!/usr/bin/env python3
"""write-inflight.py — the center's in-flight projection (ruling 2026-08-07, ask A).

Derives docs/site/center/inflight.json from .kdbp/PLAN.json + git — a PROJECTION,
never a database (the board's own law): a script writes it, nobody hand-edits it,
and the board + chrome pill read it at view time the way the evidence navigator
reads its committed census. Invoked by the E8 beat tail (execution-contract §"The
beat tail") before the CENTER: pointer prints, so the file is exactly as fresh as
the last beat.

Determinism: NO wallclock — freshness is carried by `head` + the dirty-file count
(the suite's byte-identical-builds law; a timestamp would make every run a diff).
Same tree ⇒ same bytes: keys sorted on emit.

Honest blanks: a phase with no `entities` key renders `declared: null` (never
guessed); an explicit `none — <reason>` declaration arrives as `declared: []`.
`touched` is path-derived only — dirty + last-work-commit files fnmatched against
center.config `entities{}.code` globs (the ledger's resolver semantics; pure-.kdbp
bookkeeping commits are skipped exactly like the pulse engine's walk-back).

Usage: write-inflight.py [root]
  silent exit 0 when the project has no center (docs/site/center/center.config.json)
  writes + prints one line otherwise; exit 1 only on a write failure.
Battery: tests/inflight/run.sh (FIRE and SILENT both proven).
"""
from __future__ import annotations

import fnmatch
import json
import subprocess
import sys
from pathlib import Path


def sh(args: list[str], cwd: Path) -> str:
    try:
        p = subprocess.run(args, cwd=str(cwd), capture_output=True, text=True, timeout=30)
        return p.stdout if p.returncode == 0 else ""
    except Exception:  # noqa: BLE001
        return ""


def work_files(root: Path) -> tuple[list[str], str]:
    """(files of the newest WORK state, its label) — dirty tree first, else the
    newest commit whose files are not all under .kdbp/ (bookkeeping-blindness
    rule, measured in the Wave-2 diagnosis)."""
    # tracked changes AND untracked new files — a phase's first files are born
    # untracked, and `git diff HEAD` alone would call that tree clean (the
    # battery caught exactly this; B7's lesson: uncommitted work is the state
    # most worth showing)
    dirty = [f for f in sh(["git", "diff", "--name-only", "HEAD"], root).splitlines() if f.strip()]
    dirty += [f for f in sh(["git", "ls-files", "--others", "--exclude-standard"],
                            root).splitlines() if f.strip()]
    # bookkeeping is not work (walk-back law), and the projection must never
    # watch ITSELF — its own fresh file in the untracked set broke the
    # unchanged-tree byte-identity until the battery caught it
    dirty = [f for f in dirty
             if not f.startswith(".kdbp/")
             and not f.endswith(("center/inflight.json", "center/inflight.js"))]
    if dirty:
        return sorted(set(dirty)), "dirty"
    for sha in sh(["git", "log", "-10", "--format=%H"], root).split():
        files = [f for f in sh(["git", "diff", "--name-only", f"{sha}~1", sha], root).splitlines()
                 if f.strip()]
        if files and not all(f.startswith(".kdbp/") for f in files):
            return files, sha[:8]
    return [], "none"


def touched_entities(cfg: dict, files: list[str]) -> list[dict]:
    out = []
    for slug, row in sorted((cfg.get("entities") or {}).items()):
        globs: list[str] = []
        for paths in (row.get("code") or {}).values():
            globs += list(paths)
        n = sum(1 for f in files if any(fnmatch.fnmatch(f, g) or f == g for g in globs))
        if n:
            out.append({"slug": slug, "files": n})
    return out


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    cfg_path = root / "docs" / "site" / "center" / "center.config.json"
    if not cfg_path.is_file():
        return 0  # no center — not this project's surface; silence, not filler
    try:
        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        cfg = {}

    out_path = cfg_path.parent / "inflight.json"
    head = sh(["git", "rev-parse", "--short", "HEAD"], root).strip() or None
    branch = sh(["git", "rev-parse", "--abbrev-ref", "HEAD"], root).strip() or None

    plan = None
    plan_path = root / ".kdbp" / "PLAN.json"
    if plan_path.is_file():
        try:
            plan = json.loads(plan_path.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            plan = None

    doc: dict = {"v": 1, "head": head, "branch": branch}
    if not plan or plan.get("status") != "active":
        doc["active"] = False
        doc["reason"] = ("no PLAN.json" if plan is None
                        else f"plan status: {plan.get('status') or 'unknown'}")
    else:
        cur = str(plan.get("current_phase", ""))
        ph = next((p for p in plan.get("phases", []) or []
                   if str(p.get("id")) == cur), None)
        files, src = work_files(root)
        doc["active"] = True
        doc["current_phase"] = cur
        doc["phase"] = ({
            "id": str(ph.get("id")), "name": ph.get("name"),
            "tier": ph.get("tier"), "complexity": ph.get("complexity"),
            "types": ph.get("types") or [],
            "cells": ph.get("cells") or {},
            "cases": ph.get("cases"),
            "scope": ph.get("scope"),          # null = never declared
        } if ph else None)
        # declared: null = never declared · [] = explicit `none — <reason>` (honest blank)
        doc["declared"] = (ph.get("entities") if ph and "entities" in ph else None)
        doc["touched"] = touched_entities(cfg, files)
        doc["work_source"] = src               # "dirty" | <short sha> | "none"
        doc["dirty_files"] = len([1 for _ in files]) if src == "dirty" else 0

    body = json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    # inflight.js is the SAME projection as a script sibling — the center's
    # primary viewing mode is file://, where fetch() of a sibling JSON is dead;
    # a <script src="inflight.js"> in the shell loads fine in both modes and a
    # missing file degrades to a silent 404.
    js_path = cfg_path.parent / "inflight.js"
    js_body = "window.GABE_INFLIGHT = " + json.dumps(doc, sort_keys=True, ensure_ascii=False) + ";\n"
    try:
        if (out_path.is_file() and out_path.read_text(encoding="utf-8") == body
                and js_path.is_file() and js_path.read_text(encoding="utf-8") == js_body):
            return 0  # unchanged — no write, no output (byte-identical law)
        out_path.write_text(body, encoding="utf-8")
        js_path.write_text(js_body, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001
        print(f"inflight: write failed — {exc}", file=sys.stderr)
        return 1
    label = doc.get("current_phase") if doc.get("active") else "inactive"
    print(f"inflight: {label} → {out_path.relative_to(root)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
