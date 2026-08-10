#!/usr/bin/env python3
"""disposition.py — the reusable flag-disposition primitive (risk-sweep slice 2).

A detected FLAG {dimension, entity, severity, description, fix, source, file} is
disposed one of two ways:
  --defer  → append a PENDING.md row (deterministic — this script)
  --tackle → PRINT a /gabe-plan [add-phase] spec for the model to apply via the
             sanctioned plan path (no plan write here; the no-renumber scope fence
             belongs to /gabe-plan; tackle-now is new behavior, not review's inline
             fix-now).

The DEFER writer is HEADER-RESOLVED and CLOSURE-AWARE — byte-for-byte compatible
with the board's reader (_center_data.load_pending_rows), because PENDING.md
schemas DIVERGE across projects (one twin keeps `| # | Gate | Finding |`, another
drops the `Verified` column). It therefore:
  - reads existing rows BY HEADER NAME, never positionally, and appends a new row
    in the FILE's own column order (canonical schema only when the file is new);
  - treats a row as OPEN using the board's closure model (a leading-token verdict
    in Status, OR a `<!-- P<n> resolved -->` comment) so it never re-opens closed
    debt nor misses an open one whose Status carries prose;
  - mints the next P-id over live PENDING.md AND .kdbp/archive/PENDING-resolved_*
    (the same id space the board reads), widened to `^[A-Za-z]?\\d+$`;
  - reuses review's recurring-match (same File + >50% Finding overlap → Times
    Deferred++ and the escalation ladder: TD2 promotes medium/low→high; TD3+ →
    critical) instead of a duplicate row;
  - WARNs (report-never) when the File cell is not archmap-owned — the board
    attributes the debt card by that path, not by any entity field (GAP-A).
The board renders the row as a debt card for free; pulse P8/S8 nags it for free.

Usage:
  disposition.py <root> --defer  --flag '<json>' [--dry-run]
  disposition.py <root> --tackle --flag '<json>'
Exit 0 on write/print; 1 on a malformed flag, a missing .kdbp/, or a PENDING.md
whose schema has no Finding column. Battery: tests/disposition/run.sh.
"""
from __future__ import annotations

import datetime as _dt
import json
import re
import subprocess
import sys
from pathlib import Path

CANON = ("#", "Date", "Source", "Finding", "File", "Scale", "Priority", "Impact",
         "Times Deferred", "Status", "Verified")
_CLOSERS = ("CLOSED", "RESOLVED", "WONT-DO", "WON'T-DO", "SUPERSEDED")  # mirror _center_data
_WORD = re.compile(r"[a-zA-Z0-9]{3,}")
_ID = re.compile(r"^[A-Za-z]?\d+$")


def sh(args: list[str], cwd: Path) -> str:
    try:
        p = subprocess.run(args, cwd=str(cwd), capture_output=True, text=True, timeout=15)
        return p.stdout.strip() if p.returncode == 0 else ""
    except Exception:  # noqa: BLE001
        return ""


def clean(s) -> str:
    """A cell value safe for a markdown row — a literal `|` or newline would inject
    a column break and corrupt the table (which the board + review parse by row)."""
    return re.sub(r"\s+", " ", str(s).replace("|", "/").replace("\n", " ")).strip()


def words(s: str) -> set[str]:
    return {w.lower() for w in _WORD.findall(re.sub(r"^\[[^\]]+\]\s*", "", s or ""))}


def verdict_closed(status: str) -> bool:
    """Mirror _center_data._verdict_closed: the closing verdict is the LEADING
    all-caps token (a history clause in the tail must not close a live row); older
    lowercase vocab falls through to a substring rule; empty Status is NOT closed."""
    su = (status or "").strip().upper()
    if not su:
        return False
    m = re.match(r"^[^A-Z]*([A-Z][A-Z\-']*)", su)
    verdict = m[1] if m else ""
    if verdict:
        return any(verdict.startswith(t) for t in _CLOSERS)
    return "OPEN" not in su and any(t in su for t in _CLOSERS)


def parse_table(text: str) -> tuple[list[str] | None, list[dict], list[str]]:
    """(header-lower, rows, lines). Header = the first pipe row carrying a `finding`
    column; rows are read BY NAME. Each row dict also holds `_line` and `_cells`."""
    lines = text.splitlines()
    header: list[str] | None = None
    rows: list[dict] = []
    for i, ln in enumerate(lines):
        s = ln.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if header is None:
            if any(c.lower() == "finding" for c in cells):
                header = [c.lower() for c in cells]
            continue
        if cells and all(re.fullmatch(r":?-{2,}:?", c or "") for c in cells):
            continue  # separator
        if not cells or not cells[0]:
            continue
        row = {header[j]: cells[j] for j in range(min(len(header), len(cells)))}
        row["_line"], row["_cells"] = i, cells
        rows.append(row)
    return header, rows, lines


def resolved_ids(text: str) -> set[str]:
    return {m[1] for m in re.finditer(
        r"<!--\s*([A-Za-z]?\d+)\s+(?:resolved|closed|done)\b[^>]*-->", text, re.I)}


def archmap_paths(root: Path) -> set[str]:
    amp = root / "docs" / "site" / "center" / "archmap.json"
    if not amp.is_file():
        return set()
    try:
        am = json.loads(amp.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return set()
    paths: set[str] = set()
    for _slug, ent in (am.get("entities") or {}).items():
        for f in ent.get("files", []) or []:
            p = f[1] if isinstance(f, (list, tuple)) and len(f) >= 2 else f
            if isinstance(p, str):
                paths.add(p)
    return paths


def file_is_owned(file_cell: str, owned: set[str]) -> bool:
    tok = file_cell.split(":", 1)[0].strip()
    if not tok:
        return False
    for p in owned:
        if p == tok or p.startswith(tok.rstrip("/") + "/") or tok.startswith(p):
            return True
    stem = tok.rsplit("/", 1)[-1]
    return sum(1 for p in owned if p.rsplit("/", 1)[-1] == stem) == 1


def maturity(root: Path) -> str:
    b = root / ".kdbp" / "BEHAVIOR.md"
    if b.is_file():
        m = re.search(r"maturity[:\s|*]+([a-z]+)", b.read_text(encoding="utf-8"), re.I)
        if m and m.group(1).lower() in ("mvp", "enterprise", "scale"):
            return m.group(1).lower()
    return "mvp"


def _idnum(v: str) -> int | None:
    v = v.lstrip("#").strip()
    if not _ID.match(v):
        return None
    return int(re.sub(r"^[A-Za-z]+", "", v))


def next_pid(root: Path, live_rows: list[dict], header: list[str] | None) -> int:
    """Max id over live PENDING + the resolved archive — the id space the board reads."""
    idcol = header[0] if header else "#"
    nums = [n for r in live_rows if (n := _idnum(r.get(idcol, ""))) is not None]
    for arch in (root / ".kdbp" / "archive").glob("PENDING-resolved_*.md") \
            if (root / ".kdbp" / "archive").is_dir() else []:
        h2, r2, _ = parse_table(arch.read_text(encoding="utf-8"))
        ic = h2[0] if h2 else "#"
        nums += [n for r in r2 if (n := _idnum(r.get(ic, ""))) is not None]
    return (max(nums) if nums else 0) + 1


def defer(root: Path, flag: dict, dry: bool) -> int:
    if not (root / ".kdbp").is_dir():
        print("disposition: no .kdbp/ — not a KDBP project", file=sys.stderr)
        return 1
    pend = root / ".kdbp" / "PENDING.md"
    dim = clean(flag.get("dimension", "flag"))
    desc = clean(flag.get("description", ""))
    file_cell = clean(flag.get("file") or "-")
    severity = clean(flag.get("severity") or "medium").lower()
    source = clean(flag.get("source") or "sweep")
    scale = clean(flag.get("scale") or maturity(root))
    impact = clean(flag.get("impact") or {"critical": "high", "high": "high",
                   "medium": "moderate", "low": "low"}.get(severity, "moderate"))
    today = _dt.date.today().isoformat()
    sha = sh(["git", "rev-parse", "--short", "HEAD"], root)
    verified = f"@{sha} {today}" if sha else f"- {today}"

    text = pend.read_text(encoding="utf-8") if pend.is_file() else ""
    header, rows, lines = parse_table(text)
    if header is not None and "finding" not in header:
        print("disposition: PENDING.md has no Finding column — cannot write a "
              "finding row; align the schema or author it via /gabe-review.",
              file=sys.stderr)
        return 1

    closed = resolved_ids(text)
    idcol = header[0] if header else "#"
    findcol = "finding"
    filecol = "file" if (header and "file" in header) else None

    # recurring-match: same File (if the schema has one) + >50% Finding overlap on
    # an OPEN row → escalate in place, never a duplicate.
    new_words = words(desc)
    for r in rows:
        rid = (r.get(idcol, "") or "").lstrip("#").strip()
        if rid in closed or verdict_closed(r.get("status", "")):
            continue
        if filecol and r.get(filecol, "") != file_cell:
            continue
        r_words = words(r.get(findcol, ""))
        if min(len(new_words), len(r_words)) < 3:      # too small to match reliably
            continue
        ov = new_words & r_words
        if len(ov) / (min(len(new_words), len(r_words)) or 1) <= 0.5:
            continue
        # recurrence — bump Times Deferred + escalate priority IN PLACE (by name)
        cells = r["_cells"]
        def _set(name: str, val: str) -> None:
            if header and name in header and header.index(name) < len(cells):
                cells[header.index(name)] = val
        try:
            td = int(re.sub(r"\D", "", r.get("times deferred", "1")) or 1) + 1
        except ValueError:
            td = 2
        prio = (r.get("priority", severity) or severity).lower()
        if td >= 3:
            prio = "critical"
        elif td == 2 and prio in ("low", "medium"):
            prio = "high"
        _set("times deferred", str(td))
        _set("priority", prio)
        lines[r["_line"]] = "| " + " | ".join(cells) + " |"
        out = "\n".join(lines) + ("\n" if text.endswith("\n") else "")
        if dry:
            print(f"[dry-run] recurrence {rid} → Times Deferred {td}, priority {prio}")
            return 0
        pend.write_text(out, encoding="utf-8")
        print(f"disposition: recurrence — {rid} Times Deferred {td} · priority {prio}")
        return 0

    # new row, built in the FILE's header order (canonical when the file is new)
    pid = f"P{next_pid(root, rows, header)}"
    field = {"#": pid, "date": today, "source": source, "finding": f"[{dim}] {desc}",
             "file": file_cell, "scale": scale, "priority": severity, "impact": impact,
             "times deferred": "1", "status": "open", "verified": verified}
    head_lower = [c.lower() for c in CANON] if header is None else header
    cells = [field.get(name, "") for name in head_lower]
    row = "| " + " | ".join(cells) + " |"

    warn = ""
    owned = archmap_paths(root)
    if filecol and owned and file_cell not in ("-", "") and not file_is_owned(file_cell, owned):
        warn = (f"⚠ File '{file_cell}' is not archmap-owned — the board renders this "
                f"cross-cutting, not under entity '{flag.get('entity','?')}'. Pass an "
                f"entity code path as `file` (GAP-A).")
    elif header and not filecol:
        warn = ("⚠ this PENDING.md schema has no File column — the debt card cannot "
                "be attributed to an entity.")

    if dry:
        print(row)
        if warn:
            print(warn, file=sys.stderr)
        return 0
    if header is None:
        body = ("# Deferred Items\n\n| " + " | ".join(CANON) + " |\n|"
                + "|".join(["---"] * len(CANON)) + "|\n")
    else:
        body = text if text.endswith("\n") else text + "\n"
    pend.write_text(body + row + "\n", encoding="utf-8")
    print(f"disposition: deferred → {pid} in .kdbp/PENDING.md")
    if warn:
        print(warn, file=sys.stderr)
    return 0


def tackle(root: Path, flag: dict) -> int:
    dim = clean(flag.get("dimension", "flag"))
    desc = clean(flag.get("description", ""))
    fix = clean(flag.get("fix", ""))
    entity = clean(flag.get("entity") or "none — cross-cutting")
    file_cell = clean(flag.get("file") or "-")
    types = {"evidence": "testing, e2e", "testing": "testing",
             "code": "refactor, tooling", "security": "security"}.get(dim, dim)
    title = (desc[:48] + "…") if len(desc) > 49 else desc
    print("TACKLE-NOW → apply via `/gabe-plan update` (allowed edit: add-phase; "
          "append or decimal N.5 — NEVER renumber, NEVER tick cells).")
    print("Adjust the lifecycle cells to THIS project's PLAN header — prepend a Red "
          "cell if the project runs /gabe-red, append a Center cell if it has a "
          "command center.\n")
    print("Phases-table row (append):")
    print(f"| <next|N.5> | {title} | {desc} — {fix} | [{types}] | mvp | med | ⬜ | ⬜ | ⬜ | ⬜ |\n")
    print(f"### Phase <id> — {title}")
    print(f"- **Types:** {types}")
    print(f"- **Tier:** mvp   (honest baseline — re-tier in /gabe-plan if it warrants)")
    print(f"- **Entities:** {entity}")
    print(f"- **Scope:** {file_cell}")
    print(f"- **Why:** {desc}")
    print(f"- **Fix:** {fix}")
    return 0


def main() -> int:
    args = sys.argv[1:]
    pos = [a for a in args if not a.startswith("--")]
    if not pos or "--flag" not in args:
        print("usage: disposition.py <root> --defer|--tackle --flag '<json>' [--dry-run]",
              file=sys.stderr)
        return 1
    root = Path(pos[0]).resolve()
    try:
        flag = json.loads(args[args.index("--flag") + 1])
    except Exception as exc:  # noqa: BLE001
        print(f"disposition: malformed --flag json — {exc}", file=sys.stderr)
        return 1
    if "--tackle" in args:
        return tackle(root, flag)
    if "--defer" in args:
        return defer(root, flag, "--dry-run" in args)
    print("disposition: choose --defer or --tackle", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
