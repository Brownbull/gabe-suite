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
    echo "== build: the center =="
    python3 "$HERE/build_suite_center.py"
    # ORDER IS THE CONTRACT. The center emits nav.json; the docsite build reads
    # it and renders the doc pages into the same shell. Run the gate before the
    # docs exist and it fails on 13 links the next command is about to create,
    # so the chain is: center → docs → gate.
    echo "== build: the docs, into the center's shell =="
    python3 "$REPO/skills/gabe-docsite/generator/build_docsite.py" \
      --config "$REPO/docs/docsite.config.py" \
      --shell  "$REPO/docs/center/shell" \
      --nav    "$REPO/docs/site/center/nav.json"
    # SECOND PASS. The two builds need each other's output: the docsite needs
    # nav.json (pass 1), and the estate pages need docs-backlinks.json, which
    # only exists once the docs have been extracted. Rather than guess, the
    # center is rebuilt against the finished index — the same second-pass shape
    # the board already uses so its cards are priced against THIS build.
    echo "== rebuild: the center, now with the docs' backlinks =="
    python3 "$HERE/build_suite_center.py"
    echo "== gate: links, anchors, assets, unfilled tokens =="
    python3 "$HERE/check_suite_center.py"
    echo "== gate: every diagram renders over file:// =="
    node "$REPO/skills/gabe-docsite/tools/diagram-compliance.mjs" docs/site/center
    ;;
  check)
    echo "== gate: links, anchors, assets, unfilled tokens =="
    python3 "$HERE/check_suite_center.py"
    echo "== gate: every diagram renders over file:// =="
    node "$REPO/skills/gabe-docsite/tools/diagram-compliance.mjs" docs/site/center
    ;;
  *)
    echo "unknown mode: $MODE (expected: regen | check)" >&2
    exit 2
    ;;
esac

echo "suite center: OK"
