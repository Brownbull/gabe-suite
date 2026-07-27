#!/usr/bin/env bash
# Rebuild the Gabe Suite's own command center and run its gates.
#
#   bash docs/center/generators/refresh_suite_center.sh [regen|check]
#
#   regen  (default) — build the pages, then gate them
#   check            — gate only, no rebuild
#
# Gate chaining is the point: `set -e` means a failing gate aborts the run, so
# the center never reports success over pages that do not resolve. This mirrors
# the standard center's refresh_center.sh contract without sharing its config.
set -euo pipefail

MODE="${1:-regen}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"

case "$MODE" in
  regen)
    echo "== build =="
    python3 "$HERE/build_suite_center.py"
    echo "== gate: links, anchors, assets, unfilled tokens =="
    python3 "$HERE/check_suite_center.py"
    ;;
  check)
    echo "== gate: links, anchors, assets, unfilled tokens =="
    python3 "$HERE/check_suite_center.py"
    ;;
  *)
    echo "unknown mode: $MODE (expected: regen | check)" >&2
    exit 2
    ;;
esac

echo "suite center: OK"
