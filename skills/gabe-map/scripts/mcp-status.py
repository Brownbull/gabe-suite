#!/usr/bin/env python3
"""mcp-status — is gabe-map registered, disabled here, and does the install match? READ-ONLY.

Reads ~/.claude.json (never `claude mcp get`, which LAUNCHES the server to health-check it):
  mcpServers.gabe-map                       → registered at user scope + the command it runs
  projects[<abs project>].disabledMcpServers → disabled for this project
and compares the registered server path with the installed one. Prints ONE line; exit 0 always
(report-never-gate — registration is the operator's consent, never drift).

  mcp-status.py [--config ~/.claude.json] [--project DIR] [--installed PATH] [--json]
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def server_sha(scripts_dir: str) -> str:
    h = hashlib.md5()
    for n in ("server.py", "mapquery.py", "tools.py"):
        p = os.path.join(scripts_dir, n)
        if os.path.isfile(p):
            with open(p, "rb") as f:
                h.update(f.read())
    return h.hexdigest()[:12]


def status(config: str, project: str, installed: str) -> dict:
    out = {"config": config, "project": project, "installed": installed, "registered": False, "command": None,
           "path_parity": None, "disabled_here": False, "server_sha": server_sha(os.path.dirname(installed)), "note": ""}
    try:
        data = json.load(open(config, encoding="utf-8"))
    except FileNotFoundError:
        out["note"] = "no %s" % config
        return out
    except json.JSONDecodeError as exc:
        out["note"] = "unreadable %s: %s" % (config, exc)
        return out
    ent = (data.get("mcpServers") or {}).get("gabe-map")
    if ent:
        out["registered"] = True
        args = ent.get("args") or []
        out["command"] = " ".join([ent.get("command", "")] + list(args))
        reg_path = next((a for a in args if str(a).endswith("server.py")), None)
        out["path_parity"] = (os.path.realpath(reg_path) == os.path.realpath(installed)) if reg_path else False
    proj = (data.get("projects") or {}).get(os.path.abspath(project)) or {}
    out["disabled_here"] = "gabe-map" in (proj.get("disabledMcpServers") or [])
    return out


def line(s: dict) -> str:
    if not s["registered"]:
        return "gabe-map: NOT registered at user scope — run `./install.sh --register-mcp` (or /gabe-map register); restart the session afterwards"
    parts = ["gabe-map: registered (user scope)"]
    parts.append("disabled here" if s["disabled_here"] else "enabled here")
    parts.append("install parity ok" if s["path_parity"] else "PATH MISMATCH — registered %s" % s["command"])
    parts.append("server_sha %s" % s["server_sha"])
    return " · ".join(parts)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=os.path.expanduser("~/.claude.json"))
    ap.add_argument("--project", default=os.getcwd())
    ap.add_argument("--installed", default=os.path.expanduser("~/.claude/skills/gabe-map/scripts/server.py"))
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    s = status(a.config, a.project, a.installed)
    print(json.dumps(s, indent=1) if a.json else line(s))
    return 0


if __name__ == "__main__":
    sys.exit(main())
