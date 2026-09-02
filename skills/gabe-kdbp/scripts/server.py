#!/usr/bin/env python3
"""gabe-kdbp — the Gabe Suite's second MCP server (stdio, stdlib only): a project's .kdbp/ lifecycle
state as read-only tools, siblings of gabe-map's map tools.

Register once, user scope (ask-first — `./install.sh --register-mcp` registers both servers):
  claude mcp add -s user gabe-kdbp -- python3 "$HOME/.claude/skills/gabe-kdbp/scripts/server.py"

The wire framework is gabe-map's `mcpwire.py` (one implementation for both servers); the tool bodies
live in `kdbp_tools.py` (kdbp_snapshot · phase_context · review_target · next_beat · verify_commands ·
pending_row_preview · ledger_row_preview). Binding contract: references/kdbp-spec.md.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILLS_DIR = os.environ.get("GABE_SKILLS_DIR") or os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(SKILLS_DIR, "gabe-map", "scripts"))
sys.path.insert(0, HERE)
import mcpwire  # noqa: E402
import kdbp_tools  # noqa: E402

VERSION = "1.0.0"

if __name__ == "__main__":
    sys.exit(mcpwire.main("gabe-kdbp", VERSION, kdbp_tools))
