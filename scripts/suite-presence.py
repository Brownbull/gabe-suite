#!/usr/bin/env python3
"""suite-presence.py — which Gabe Suite parts are active in THIS project.

Runs in a project (cwd, or an explicit root). Inventories the project-LOCAL suite
parts — the ones a project must CARRY, not the machine-wide skills/hooks that reach
every project via ~/.claude. It makes absence VISIBLE: a part present-but-unwired
is a GAP; a part absent-and-undeclared is INFO ("not adopted here"), never a false
alarm.

Why this exists: the Gabe register is project-local — its hook reads
$CLAUDE_PROJECT_DIR/.claude/register-core.md, so it only works where those files +
the hook were copied. It was silently absent in the twin projects and nothing
flagged it (suite-doctor checks repo↔~/.claude, never a project's adoption). This
is the PROACTIVE inventory; E6 (missing anchor = stop) is the reactive stop-at-use.

Declared vs optional — the honesty rule that keeps it from crying wolf:
  present + wired          → ✓ ok
  present, hook NOT wired  → ⚠ gap (silently inactive — the register's failure mode)
  absent + not declared    → info ("not adopted"), NO warn
  absent + declared        → ⚠ gap   (.claude/suite-adopts.json lists {"adopts": [...]})

Usage: suite-presence.py [root] [--quiet]
  --quiet : one-line summary + only the ⚠ gaps (for a SessionStart hook)
Exit: 0 when clean/adopted/not-adopted · 1 when any GAP exists.
Silent (exit 0, no output) when the project uses ZERO suite parts — a non-suite
project is not nagged.
Battery: tests/suite-presence/run.sh (fire + silent + no-false-fire proven).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def _json(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def inventory(root: Path) -> tuple[list[tuple[str, str, str, str]], int]:
    """Returns (parts, used). Each part is (name, status, detail, fix);
    status ∈ {wired, info, gap}. `used` counts suite parts the project touches —
    zero means 'not a suite project', so the caller stays silent."""
    parts: list[tuple[str, str, str, str]] = []
    used = 0

    kdbp = root / ".kdbp"
    center_cfg = root / "docs" / "site" / "center" / "center.config.json"
    reg_core = root / ".claude" / "register-core.md"
    reg_style = root / ".claude" / "output-styles" / "gabe.md"
    settings = root / ".claude" / "settings.json"
    adopts_f = root / ".claude" / "suite-adopts.json"
    adopts = ((_json(adopts_f) or {}).get("adopts", []) if adopts_f.exists() else [])

    # --- KDBP (+ CLAUDE.md, implied once KDBP is present) ---
    if kdbp.is_dir():
        used += 1
        miss = [f for f in ("BEHAVIOR.md", "VALUES.md") if not (kdbp / f).exists()]
        if not ((kdbp / "PLAN.md").exists() or (kdbp / "PLAN.json").exists()):
            miss.append("PLAN.md/json")
        if miss:
            parts.append(("KDBP", "gap", f".kdbp/ present, missing {', '.join(miss)}",
                          "restore the file(s) or re-run /gabe-init"))
        else:
            parts.append(("KDBP", "wired", ".kdbp/ · BEHAVIOR·VALUES·PLAN present", ""))
        if not (root / "CLAUDE.md").exists():
            parts.append(("CLAUDE.md", "gap", "KDBP project without a project CLAUDE.md",
                          "add a CLAUDE.md (see the suite's templates/CLAUDE.md)"))

    # --- Command center ---
    if center_cfg.exists():
        used += 1
        gen = (root / "scripts" / "build_center_a3.py").exists()
        adoption = root / "docs" / "site" / "center" / "adoption.json"
        if gen and adoption.exists():
            n = len((_json(adoption) or {}).get("sections", []))
            parts.append(("Command center", "wired",
                          f"center.config.json · generators · adoption.json ({n} entities)", ""))
        else:
            m = ([] if gen else ["scripts/build_center_a3.py"]) + \
                ([] if adoption.exists() else ["adoption.json"])
            parts.append(("Command center", "gap",
                          f"center.config.json present, missing {', '.join(m)}",
                          "re-bootstrap via /gabe-cc-init"))

    # --- Push config ---
    if (kdbp / "PUSH.md").exists():
        parts.append(("Push", "wired", ".kdbp/PUSH.md present", ""))

    # --- Register (project-local trial) ---
    reg_files = reg_core.exists() and reg_style.exists()
    reg_hook = ("register-core" in settings.read_text(encoding="utf-8")
                if settings.exists() else False)
    declared = "register" in adopts
    # machine-wide install (~/.claude) — active in EVERY project via a global hook,
    # so "no project-local register" is NOT "not active" once the register is widened.
    home = Path.home() / ".claude"
    mw_settings = home / "settings.json"
    mw_active = ((home / "output-styles" / "gabe.md").is_file() and mw_settings.is_file()
                 and "register-core" in mw_settings.read_text(encoding="utf-8"))
    if reg_files and reg_hook:
        used += 1
        parts.append(("Register", "wired",
                      ".claude/register-core.md + output-style + re-inject hook (project-local)", ""))
    elif reg_files and not reg_hook:
        used += 1
        parts.append(("Register", "gap",
                      "register files present but the re-inject hook is NOT wired "
                      "— the style is silently inactive",
                      "add the UserPromptSubmit + SessionStart hooks that cat "
                      ".claude/register-core.md"))
    elif mw_active:
        used += 1
        parts.append(("Register", "wired",
                      "active machine-wide (~/.claude/output-styles/gabe.md + global hook) "
                      "— no project-local copy needed", ""))
    elif declared and not reg_files:
        used += 1
        parts.append(("Register", "gap",
                      "declared adopted (suite-adopts.json) but the files are absent",
                      "copy .claude/register-core.md + output-styles/gabe.md and wire the hook"))
    else:
        # absent everywhere + undeclared → info, only meaningful if the project uses other parts
        parts.append(("Register", "info",
                      "not adopted — no project-local or machine-wide register", ""))

    return parts, used


def main() -> int:
    args = sys.argv[1:]
    quiet = "--quiet" in args
    pos = [a for a in args if not a.startswith("-")]
    root = Path(pos[0] if pos else ".").resolve()

    parts, used = inventory(root)
    if used == 0:
        return 0  # not a suite project — stay silent

    wired = [p for p in parts if p[1] == "wired"]
    info = [p for p in parts if p[1] == "info"]
    gaps = [p for p in parts if p[1] == "gap"]
    name = root.name

    if quiet:
        print(f"GABE SUITE PRESENCE — {name}: {len(wired)} wired · "
              f"{len(info)} not adopted · {len(gaps)} gap(s)")
        for n, _s, d, f in gaps:
            print(f"  ⚠ {n} — {d}" + (f"  → {f}" if f else ""))
        return 1 if gaps else 0

    print(f"GABE SUITE PRESENCE — {name}\n")
    if wired:
        print("ADOPTED & WIRED")
        for n, _s, d, _f in wired:
            print(f"  ✓ {n:<15} {d}")
    if info:
        print("\nNOT ADOPTED (info)")
        for n, _s, d, _f in info:
            print(f"  – {n:<15} {d}")
    if gaps:
        print("\n⚠ GAPS")
        for n, _s, d, f in gaps:
            print(f"  ⚠ {n:<15} {d}\n       → {f}")
    print(f"\npresence: {len(wired)} wired · {len(info)} not adopted · {len(gaps)} gap(s)")
    return 1 if gaps else 0


if __name__ == "__main__":
    sys.exit(main())
