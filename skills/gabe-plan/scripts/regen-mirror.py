#!/usr/bin/env python3
"""Regenerate .kdbp/PLAN.json from .kdbp/PLAN.md per plan-spec Step 4b.

Mechanical: Phases table (ids, names, tier, complexity, cells — incl. an in-table Types column)
PLUS each phase's Phase Details block (types YAML or `- **Types:**` bullet, `- **Proof:**` line,
`proof_type:` YAML, `- **Cases:**` line). Grouped detail headings (`### Phases 19–29 — …`) apply
to every numeric id in the range. Run from the repo root. Prints a drift summary vs the existing
mirror.

Preservation rule (dry-run hardened): `proof` / `proof_type` / `cases` are OVERWRITTEN only when
the .md provides a value; when the .md is silent AND the old mirror has one (e.g. /gabe-execute
wrote `proof` straight into PLAN.json per execute-spec), the old value is PRESERVED and printed —
regeneration must never wipe recorded evidence into null (that would also blind the
plan-proof-guard, which skips null proofs).
"""
import json
import re
import sys
from pathlib import Path

GLYPH = {"⬜": "todo", "🔄": "in_progress", "✅": "done", "⏸": "deferred", "⚰️": "obsolete", "⚰": "obsolete"}
CELL_COLS = ("red", "exec", "review", "commit", "push", "center")

_md_path = Path(".kdbp/PLAN.md")
if not _md_path.exists():
    sys.exit("BREAK: no .kdbp/PLAN.md — nothing to mirror (run /gabe-plan first)")
md = _md_path.read_text(encoding="utf-8")
notes = []

def comment(tag, default):
    m = re.search(rf"<!--\s*{tag}:\s*(\S+)\s*-->", md)
    return m.group(1) if m else default

def context_field(label):
    m = re.search(rf"-\s*\*\*{label}:\*\*\s*([^\n]+)", md)
    return m.group(1).strip() if m else None

def section(name):
    m = re.search(rf"^## {re.escape(name)}\n(.*?)(?=^## |\Z)", md, re.M | re.S)
    return m.group(1) if m else ""

def split_cells(line):
    # markdown-escaped pipes (\|) are cell CONTENT, not boundaries (real gastify row 25)
    cells = re.split(r"(?<!\\)\|", line.strip())
    return [c.strip().replace("\\|", "|").replace("️", "") for c in cells[1:-1]] if len(cells) >= 3 else []

# --- Phases table ---
phases_txt = section("Phases")
rows, header = [], None
for line in phases_txt.splitlines():
    if not line.lstrip().startswith("|"):
        continue
    cells = split_cells(line)
    if not cells:
        continue
    if header is None:
        low = [c.lower() for c in cells]
        if "#" in low and "phase" in low:  # a stray |-line must not masquerade as the header
            header = low
        else:
            notes.append(f"note: skipped pre-header |-line: {line.strip()[:60]!r}")
        continue
    if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
        continue  # separator (any cell count — real twins ship malformed ones)
    rows.append(cells)
if header is None:
    sys.exit("BREAK: no Phases table header (needs '#' and 'Phase' columns) found")

def col(name):
    return header.index(name) if name in header else None

idx = {name: col(name) for name in ("#", "phase", "tier", "complexity", "types", *CELL_COLS)}

# --- Phase Details blocks (single and grouped/plural range headings) ---
details_txt = section("Phase Details")
blocks = {}
for m in re.finditer(r"^### Phases? ([\w.]+)(?:\s*[–—-]\s*([\w.]+))?\s+—[^\n]*\n(.*?)(?=^### |\Z)",
                     details_txt, re.M | re.S):
    first, last, body = m.group(1), m.group(2), m.group(3)
    if last and first.isdigit() and last.isdigit():
        for pid in range(int(first), int(last) + 1):
            blocks[str(pid)] = body  # grouped heading applies to every id in range
    else:
        blocks[first] = body

def detail(pid, key):
    b = blocks.get(pid, "")
    m = re.search(rf"^- \*\*{key}:\*\*\s*(.+)$", b, re.M)
    val = m.group(1).strip() if m else None
    # A whitespace-only bullet is NO value, never the empty string — "" would
    # overwrite a recorded old-mirror proof while the preservation rule guards
    # exact-None only, silently wiping evidence (battery finding, M26).
    return val or None

def detail_types(pid):
    b = blocks.get(pid, "")
    m = re.search(r"^types:\s*\[([^\]]*)\]", b, re.M)  # YAML form
    if m:
        return [t.strip() for t in m.group(1).split(",") if t.strip()]
    bullet = detail(pid, "Types")  # `- **Types:** \`a\`, \`b\`` bullet form
    if bullet:
        return [t.strip(" `") for t in bullet.split(",") if t.strip(" `")]
    return []

def detail_proof_type(pid):
    m = re.search(r"^proof_type:\s*(\S+)", blocks.get(pid, ""), re.M)
    return None if not m or m.group(1) in ("null", "~") else m.group(1)

def _depth_split(s):
    """Comma split that respects {} and () groups — a brace glob (`{a,b}.tsx`) or a
    parenthetical (`x.md (new, evidence companion)`) is ONE token, not several."""
    out, depth, cur = [], 0, ""
    for ch in s:
        if ch in "{(":
            depth += 1; cur += ch
        elif ch in "})":
            depth = max(0, depth - 1); cur += ch
        elif ch == "," and depth == 0:
            out.append(cur); cur = ""
        else:
            cur += ch
    out.append(cur)
    return out


_PATHY = re.compile(r"^[\w./*{}@,\[\]-]+$")   # a path/glob token: no spaces, no markdown

def detail_list(pid, label, kind=None):
    """A bullet → list, hardened against the ways a naive split fabricates data
    (review 2026-08-07, proven on gustify's REAL prose-heavy Scope bullets):
    · an UNFILLED template placeholder (`<files/globs …>`) is not a declaration → None;
    · `none — <reason>` / `none` → [] (explicit honest blank); `none of the…` is prose;
    · groups (`{a,b}`, `(new)`) never split; depth-0 commas only.
    kind='path' (Scope): real bullets carry parentheticals, `→ new sibling modules`
    prose, `· **scope change …:**` history, and backticks — EXTRACT only path-shaped
    tokens and drop the prose, rather than mirror junk globs into S5 and the board.
    kind='slug' (Entities): a slug is a bare identifier; any item with a space or
    angle bracket means the bullet is prose that slipped the guard → None (never
    guess a slug), caller notes it."""
    bullet = detail(pid, label)
    if bullet is None:
        return None
    s = bullet.strip()
    if s.startswith("<") or s.startswith("e.g.") or "projects only" in s:
        return None                                   # unfilled template placeholder
    if re.match(r"^none$", s, re.I) or re.match(r"^none\s*[—-]", s):
        return []                                     # explicit honest-none, not "none of the…"

    if kind == "path":
        # ALL-OR-NOTHING (proven necessary on gustify's real 6-bullet plan, P1 dry-run
        # 2026-08-07): a scan-for-path-runs picked up dates-with-slashes and `**bold`
        # artifacts as junk globs. So each comma-token is cleaned of a trailing
        # `(annotation)` / `→ prose` / `+ prose` tail and must then be path-shaped; if
        # ANY token is still prose (a `·`/`**scope change:**` note, an "and"-joined
        # clause), the whole bullet is human prose not a machine path list → return None
        # and don't mirror. Clean paths or nothing — S5 and the board never see junk.
        out = []
        for raw in _depth_split(s):
            t = re.split(r"\s+\(| → | \+ ", raw.strip().strip("`"))[0].strip().strip("`").strip()
            if not t:
                continue                              # a pure annotation like `(new)` — skip
            if _PATHY.match(t) and ("/" in t or "*" in t or re.search(r"\.\w+$", t)):
                out.append(t)
            else:
                return None                           # a prose token — the bullet is not machine-parseable
        return out or None

    items = [t.strip().strip("`").strip() for t in _depth_split(s)]
    items = [t for t in items if t]
    if kind == "slug" and any(re.search(r"[\s<>]", t) for t in items):
        return None                                   # prose, not slugs — refuse to guess
    return items

# --- old mirror (drift + preservation source) ---
old_path = Path(".kdbp/PLAN.json")
old_by_id = {}
if old_path.exists():
    try:
        old = json.loads(old_path.read_text())
        old_by_id = {str(p.get("id")): p for p in old.get("phases", []) if isinstance(p, dict)}
    except Exception as e:
        notes.append(f"old mirror unreadable ({e}) — regenerating fresh")

phases = []
for cells in rows:
    def cell(name):
        i = idx[name]
        return cells[i] if i is not None and i < len(cells) else None
    pid = cell("#")
    old_ph = old_by_id.get(str(pid), {})
    types = detail_types(pid) or [t.strip(" `[]") for t in (cell("types") or "").split(",") if t.strip(" `[]")]
    proof = detail(pid, "Proof")
    proof_type = detail_proof_type(pid)
    cases = detail(pid, "Cases")
    review = detail(pid, "Review")
    scope = detail_list(pid, "Scope", kind="path")
    entities = detail_list(pid, "Entities", kind="slug")
    if entities is None and detail(pid, "Entities") is not None:
        notes.append(f"phase {pid} Entities bullet unparseable (placeholder or prose) — not mirrored, never guessed")
    for field, mdval in (("proof", proof), ("proof_type", proof_type), ("cases", cases),
                         ("review", review), ("scope", scope), ("entities", entities)):
        if mdval is None and old_ph.get(field) is not None:
            notes.append(f"preserved phase {pid} {field} from old mirror (no .md source): {str(old_ph[field])[:60]!r}")
    proof = proof if proof is not None else old_ph.get("proof")
    proof_type = proof_type if proof_type is not None else old_ph.get("proof_type")
    cases = cases if cases is not None else old_ph.get("cases")
    review = review if review is not None else old_ph.get("review")
    scope = scope if scope is not None else old_ph.get("scope")
    entities = entities if entities is not None else old_ph.get("entities")
    ph = {
        "id": pid,
        "name": cell("phase"),
        # the Tier cell may carry compact override notation "mvp (obs→ent)" — mirror wants the base
        "tier": (cell("tier") or "").split(" ")[0] or None,
        "complexity": cell("complexity"),
        "types": types,
        "cells": {},
        "proof": proof,
        "proof_type": proof_type,
        "cases": cases,
        "review": review,
    }
    # optional declared fields — emitted only when they exist (absent ≠ declared-none)
    if scope is not None:
        ph["scope"] = scope
    if entities is not None:
        ph["entities"] = entities
    for cname in CELL_COLS:
        glyph = cell(cname)
        if glyph is None or glyph == "—":
            continue  # column absent, or render-only dash → omit the key
        if glyph == "":
            notes.append(f"warn: phase {pid} {cname} cell is BLANK — recorded as todo (fill it in PLAN.md)")
            ph["cells"][cname] = "todo"
            continue
        if glyph not in GLYPH:
            sys.exit(f"BREAK: phase {pid} {cname} cell {glyph!r} is not a known glyph")
        ph["cells"][cname] = GLYPH[glyph]
    phases.append(ph)

cur_sec = section("Current Phase")
cur = re.search(r"Phase\s+([A-Za-z0-9][\w.]*)", cur_sec)  # tolerates narrative like "(Phase 24), …"
goal = section("Goal").strip().split("\n\n")[0].replace("\n", " ")

plan = {
    "version": 1,
    "status": comment("status", "active"),
    "project_type": comment("project_type", "code"),
    "goal": goal,
    "maturity": context_field("Maturity"),
    "created": context_field("Created"),
    "last_updated": (context_field("Last Updated") or "").split(" ")[0],
    "current_phase": cur.group(1).rstrip(".,)") if cur else None,
    "phases": phases,
}

if old_by_id:
    new_ids = [p["id"] for p in phases]
    added = [i for i in new_ids if i not in old_by_id]
    dropped = sorted(set(old_by_id) - set(map(str, new_ids)))
    print(f"drift: rows added to mirror: {added or 'none'} · rows dropped: {dropped or 'none'}")
for n in notes:
    print(n)

old_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote .kdbp/PLAN.json: {len(phases)} phases, current_phase={plan['current_phase']!r}")
