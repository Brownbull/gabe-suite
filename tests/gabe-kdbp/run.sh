#!/usr/bin/env bash
# gabe-kdbp battery — the KDBP-state MCP server's executable contract. Hermetic: synthetic .kdbp fixtures
# in temp git repos (canon + divergent schemas), the gabe-map fixture center for entity briefs, read
# deadlines in the client, `timeout` around the run. Previews are proven to write nothing.
# Mutation proof: SERVER_OVERRIDE=<same-dir copy>/server.py (shared skills via GABE_SKILLS_DIR).
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
export GABE_SKILLS_DIR="${GABE_SKILLS_DIR:-$REPO/skills}"
timeout 240 python3 "$REPO/tests/gabe-kdbp/checks.py"; rc=$?
find "$REPO/skills/gabe-kdbp" "$REPO/skills/gabe-map" "$REPO/tests/gabe-map" "$REPO/tests/gabe-kdbp" "$REPO/skills/gabe-cc-entity/scripts" "$REPO/skills/gabe-pulse/scripts" -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null
[ $rc -eq 124 ] && echo "FAIL: gabe-kdbp battery timed out (240 s)"
exit $rc
