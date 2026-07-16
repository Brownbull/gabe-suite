#!/usr/bin/env python3
"""Regenerate .kdbp/PLAN.json from .kdbp/PLAN.md per plan-spec Step 4b.

Mechanical: Phases table (ids, names, tier, complexity, cells) PLUS each phase's
Phase Details block (types YAML, `- **Proof:**` line, `- **Cases:**` line).
Run from the repo root. Prints a drift summary vs the existing mirror.
"""
import json
import re
import sys
from pathlib import Path

GLYPH = {"⬜": "todo", "🔄": "in_progress", "✅": "done", "⏸": "deferred", "⚰️": "obsolete"}
CELL_COLS = ("red", "exec", "review", "commit", "push", "center")

md = Path(".kdbp/PLAN.md").read_text(encoding="utf-8")

def comment(tag, default):
    m = re.search(rf"<!--\s*{tag}:\s*(\S+)\s*-->", md)
    return m.group(1) if m else default

def context_field(label):
    m = re.search(rf"-\s*\*\*{label}:\*\*\s*([^\n]+)", md)
    return m.group(1).strip() if m else None

def section(name):
    m = re.search(rf"^## {re.escape(name)}\n(.*?)(?=^## |\Z)", md, re.M | re.S)
    return m.group(1) if m else ""

# --- Phases table ---
phases_txt = section("Phases")
rows, header = [], None
for line in phases_txt.splitlines():
    if not line.startswith("|"):
        continue
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if header is None:
        header = [c.lower() for c in cells]
        continue
    if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
        continue  # separator
    rows.append(cells)
if header is None:
    sys.exit("BREAK: no Phases table header found")

def col(name):
    return header.index(name) if name in header else None

idx = {name: col(name) for name in ("#", "phase", "tier", "complexity", *CELL_COLS)}

# --- Phase Details blocks ---
details_txt = section("Phase Details")
blocks = {}
for m in re.finditer(r"^### Phase ([\w.]+) — [^\n]*\n(.*?)(?=^### |\Z)", details_txt, re.M | re.S):
    blocks[m.group(1)] = m.group(2)

def detail(pid, key):
    b = blocks.get(pid, "")
    m = re.search(rf"^- \*\*{key}:\*\*\s*(.+)$", b, re.M)
    return m.group(1).strip() if m else None

def detail_types(pid):
    b = blocks.get(pid, "")
    m = re.search(r"^types:\s*\[([^\]]*)\]", b, re.M)
    return [t.strip() for t in m.group(1).split(",") if t.strip()] if m else []

def detail_proof_type(pid):
    m = re.search(r"^proof_type:\s*(\S+)", blocks.get(pid, ""), re.M)
    return None if not m or m.group(1) in ("null", "~") else m.group(1)

phases = []
for cells in rows:
    def cell(name):
        i = idx[name]
        return cells[i] if i is not None and i < len(cells) else None
    pid = cell("#")
    ph = {
        "id": pid,
        "name": cell("phase"),
        # the Tier cell may carry compact override notation "mvp (obs→ent)" — mirror wants the base
        "tier": (cell("tier") or "").split(" ")[0] or None,
        "complexity": cell("complexity"),
        "types": detail_types(pid),
        "cells": {},
        "proof": detail(pid, "Proof"),
        "proof_type": detail_proof_type(pid),
        "cases": detail(pid, "Cases"),
    }
    for cname in CELL_COLS:
        glyph = cell(cname)
        if glyph is None or glyph == "—":
            continue  # column absent, or render-only dash → omit the key
        if glyph not in GLYPH:
            sys.exit(f"BREAK: phase {pid} {cname} cell {glyph!r} is not a known glyph")
        ph["cells"][cname] = GLYPH[glyph]
    phases.append(ph)

cur = re.search(r"^## Current Phase\s*\n+\s*Phase\s+([\w.]+)", md, re.M)
goal = section("Goal").strip().split("\n\n")[0].replace("\n", " ")

plan = {
    "version": 1,
    "status": comment("status", "active"),
    "project_type": comment("project_type", "code"),
    "goal": goal,
    "maturity": context_field("Maturity"),
    "created": context_field("Created"),
    "last_updated": (context_field("Last Updated") or "").split(" ")[0],
    "current_phase": cur.group(1) if cur else None,
    "phases": phases,
}

old_path = Path(".kdbp/PLAN.json")
if old_path.exists():
    try:
        old = json.loads(old_path.read_text())
        old_ids = {str(p.get("id")) for p in old.get("phases", [])}
        new_ids = [p["id"] for p in phases]
        added = [i for i in new_ids if i not in old_ids]
        dropped = sorted(old_ids - set(new_ids))
        print(f"drift: rows added to mirror: {added or 'none'} · rows dropped: {dropped or 'none'}")
    except Exception as e:
        print(f"old mirror unreadable ({e}) — regenerating fresh")

old_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote .kdbp/PLAN.json: {len(phases)} phases, current_phase={plan['current_phase']!r}")
