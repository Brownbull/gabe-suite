#!/usr/bin/env python3
"""write-inflight.py — the center's in-flight projection (ruling 2026-08-07, ask A).

Derives docs/site/center/inflight.{json,js} from .kdbp/PLAN.json + git — a
PROJECTION, never a database (the board's own law): a script writes it, nobody
hand-edits it, and board.js reads it at view time. Invoked by the E8 beat tail
before the CENTER: pointer prints, so the file is exactly as fresh as the last
beat. The files are GITIGNORED (gabe-init seeds it): they carry `head`, which
changes every commit, so tracking them would dirty the tree forever and re-blind
the pulse signals; the board reads them locally and renders absence as absence.

"What changed" and "whose is it" come from the SHARED resolver
(gabe-pulse/scripts/work_scope.py) — the same one the pulse S6/S7 signals use, so
the board and the pulse line can never name different entities for one tree.

Honest blanks: a phase with no `entities` key renders `declared: null` (never
guessed); an explicit `none — <reason>` declaration arrives as `declared: []`.

Usage: write-inflight.py [root]
  silent exit 0 when the project has no center; writes + prints one line otherwise;
  exit 1 only on a write failure.
Battery: tests/inflight/run.sh (FIRE and SILENT both proven).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

# The shared work-scope resolver lives in the pulse skill (pulse "owns the diff
# source"). Under both the repo layout and the installed ~/.claude layout it sits
# at ../../gabe-pulse/scripts relative to this file.
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "gabe-pulse" / "scripts"))
try:
    import work_scope
except Exception:  # noqa: BLE001
    work_scope = None


def sh(args: list[str], cwd: Path) -> str:
    try:
        p = subprocess.run(args, cwd=str(cwd), capture_output=True, text=True, timeout=30)
        return p.stdout if p.returncode == 0 else ""
    except Exception:  # noqa: BLE001
        return ""


def load_center_config(root: Path):
    """Probe BOTH center layouts — the app layout and the suite layout. The
    single-path probe was a real bug: a suite-shaped center produced nothing while
    the pulse line fired on the same registry."""
    for rel in ("docs/site/center/center.config.json",
                "docs/center/suite-center.config.json"):
        p = root / rel
        if p.is_file():
            try:
                return json.loads(p.read_text(encoding="utf-8")), p.parent
            except Exception:  # noqa: BLE001
                return {}, p.parent
    return None, None


def main() -> int:
    if work_scope is None:
        print("inflight: work_scope resolver not importable — skipped", file=sys.stderr)
        return 0  # a missing shared module is not a reason to brick a beat
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    cfg, out_dir = load_center_config(root)
    if cfg is None:
        return 0  # no center — not this project's surface; silence, not filler

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
    ph = None
    if plan and plan.get("status") == "active":
        cur = plan.get("current_phase")
        # current_phase may be null (PLAN.md's Current Phase line didn't parse) —
        # stringifying that to "None" and looking it up publishes a real phase as
        # never-declared. Guard it: active but no resolvable phase is honest.
        if cur not in (None, "", "null"):
            ph = next((p for p in plan.get("phases", []) or []
                       if str(p.get("id")) == str(cur)), None)

    if ph is None:
        doc["active"] = False
        if plan is None:
            doc["reason"] = "no PLAN.json"
        elif plan.get("status") != "active":
            doc["reason"] = f"plan status: {plan.get('status') or 'unknown'}"
        else:
            doc["reason"] = "current phase not resolvable in PLAN.json"
    else:
        files, src = work_scope.changed_files(root)
        doc["active"] = True
        doc["current_phase"] = str(ph.get("id"))
        doc["phase"] = {
            "id": str(ph.get("id")), "name": ph.get("name"),
            "tier": ph.get("tier"), "complexity": ph.get("complexity"),
            "types": ph.get("types") or [],
            "cells": ph.get("cells") or {},
            "cases": ph.get("cases"),
            "scope": ph.get("scope"),          # null = never declared
        }
        # declared: null = never declared · [] = explicit `none — <reason>` (honest blank)
        doc["declared"] = ph.get("entities") if "entities" in ph else None
        doc["touched"] = work_scope.touched_entities(cfg, files)
        doc["work_source"] = src               # "dirty" | <short sha> | "none"
        doc["dirty_files"] = len(files) if src == "dirty" else 0

    out_path = out_dir / "inflight.json"
    js_path = out_dir / "inflight.js"
    body = json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    js_body = "window.GABE_INFLIGHT = " + json.dumps(doc, sort_keys=True, ensure_ascii=False) + ";\n"
    try:
        if (out_path.is_file() and out_path.read_text(encoding="utf-8") == body
                and js_path.is_file() and js_path.read_text(encoding="utf-8") == js_body):
            return 0  # unchanged — no write, no output
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
