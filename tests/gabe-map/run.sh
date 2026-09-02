#!/usr/bin/env bash
# gabe-map battery — the MCP server's executable contract (tests/gabe-map/checks.py does the work).
#
# Proves the wire laws (pre-init server/discover → -32601 with the string id · version echo/fallback ·
# roots request · one text channel · garbage survives), honest-empty (no center · suite center R8),
# freshness (fresh after docs-only commits · stale on an uncommitted mapped edit · unknown head),
# every `touches` kind, raw parity with entity-context.py --json, and the five who_calls emit gates
# (claim · code-vs-prose via tokenize · --once · gitignored · emit switch). Hermetic: temp git repos,
# a synthetic center, a FAKE graft on PATH, real git grep, read deadlines on every message, `timeout`
# around the whole run so a hung pipe fails the doctor instead of hanging it.
#
# Mutation proof (suite convention, recorded in the commit message): copy skills/gabe-map/scripts/ to a
# temp dir, mutate ONE file there, run with SERVER_OVERRIDE=<copy>/server.py — siblings resolve from the
# copy, the shared skills from GABE_SKILLS_DIR (exported below). Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
export GABE_SKILLS_DIR="${GABE_SKILLS_DIR:-$REPO/skills}"
export SERVER_OVERRIDE="${SERVER_OVERRIDE:-$REPO/skills/gabe-map/scripts/server.py}"  # override for mutation proof
timeout 240 python3 "$REPO/tests/gabe-map/checks.py"
rc=$?
[ "$rc" -eq 124 ] && echo "FAIL: gabe-map battery timed out (a hung pipe?)"
find "$REPO/skills/gabe-map" "$REPO/tests/gabe-map" -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null
exit $rc
