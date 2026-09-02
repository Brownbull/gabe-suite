#!/usr/bin/env bash
# mcp-registration — ONE line about the gabe-map MCP server's registration, exit 0 ALWAYS.
#
# The doctor relays this as INFO: registration is the operator's consent (ask-first), so an
# unregistered server is never DRIFT — but it must be VISIBLE, or "the tools aren't showing"
# turns into a re-install. Reads ~/.claude.json (never `claude mcp get`, which launches the
# server to health-check it). Lives in its own script so tests/mcp-registration/run.sh can prove
# it FIRES (unregistered · disabled · path mismatch) and stays SILENT-green (registered) against
# fixture configs — an inline doctor check could only ever run against this machine.
#
#   mcp-registration.sh [--config FILE] [--project DIR]     (prints one line per server: gabe-map, gabe-kdbp)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
STATUS="$HERE/../../skills/gabe-map/scripts/mcp-status.py"
[ -f "$STATUS" ] || STATUS="$HOME/.claude/skills/gabe-map/scripts/mcp-status.py"
if [ ! -f "$STATUS" ]; then
  echo "gabe-map: status probe missing (skills/gabe-map/scripts/mcp-status.py)"
  exit 0
fi
# one line per server; extra args (e.g. --config/--project for the battery) pass through to both
for srv in gabe-map gabe-kdbp; do
  python3 "$STATUS" --server "$srv" "$@" 2>/dev/null || echo "$srv: status probe failed to run"
done
exit 0
