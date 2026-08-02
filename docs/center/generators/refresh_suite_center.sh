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

# The prism gates. Separate from the center's own gates because they are about
# an AUTHORED page's claims rather than the build's links: the contract gate
# (payloads named, numbers present, states legal and legended, gates not stages),
# the fit gate at three widths, and the motion gate. Every page that carries a
# floor is checked — including doc pages, which carry them through embedded
# fragments and would otherwise never be looked at.
prism_gates() {
  local pages
  # Selected on class="pfwrap" — the fit box build_prisms.py wraps every floor
  # in — rather than on 'data-prism', which also matches a stage's mode attribute
  # and any page that merely QUOTES the attribute (functions.html renders the
  # builder's docstrings). Those pages have no floor, so both the contract gate
  # and the motion gate reported a loud "nothing to verify" on a page that was
  # never claiming to move. A SKIP that fires on the wrong page teaches the
  # reader to ignore it, which is how a real SKIP gets missed.
  pages="$(grep -l 'class="pfwrap"' "$REPO"/docs/site/center/*.html 2>/dev/null || true)"
  if [ -z "$pages" ]; then
    echo "== gate: prisms — none on this site, nothing to check =="
    return 0
  fi
  echo "== gate: prism contract (payloads · numbers · states · gates) =="
  for f in $pages; do
    node "$REPO/skills/gabe-imagine/tools/verify-prism.mjs" "$f" | tail -1
  done
  echo "== gate: prism fit at 1440/1280/1024 =="
  # shellcheck disable=SC2086
  node "$REPO/skills/gabe-imagine/tools/check-prism-fit.mjs" $pages | tail -1
  echo "== gate: prism motion (replay · pause · reduced) =="
  for f in $pages; do
    node "$REPO/skills/gabe-artifact/tools/verify-motion.mjs" "$f" | tail -1
  done
}

case "$MODE" in
  regen)
    echo "== build: the center =="
    python3 "$HERE/build_suite_center.py"
    # ORDER IS THE CONTRACT. The center emits nav.json; the docsite build reads
    # it and renders the doc pages into the same shell. Run the gate before the
    # docs exist and it fails on 13 links the next command is about to create,
    # so the chain is: center → docs → gate.
    # PRISMS RUN BEFORE THE DOCS, not after. The handoff plan said after — that
    # was written before the fragment seam existed. A doc page can embed
    # {{PRISM:<slug>}}, so the fragment manifest has to be on disk BEFORE the
    # docs render, or every token ships unexpanded. Prism pages need nav.json,
    # which pass 1 above already wrote, and the Explanations group is scanned
    # from docs/prisms/ on disk — so pass 1's nav already carries it.
    echo "== build: the prisms, into the center's shell =="
    python3 "$REPO/skills/gabe-imagine/generator/build_prisms.py" \
      --shell "$REPO/docs/center/shell" \
      --nav   "$REPO/docs/site/center/nav.json"
    echo "== build: the docs, into the center's shell =="
    python3 "$REPO/skills/gabe-docsite/generator/build_docsite.py" \
      --config "$REPO/docs/docsite.config.py" \
      --shell  "$REPO/docs/center/shell" \
      --nav    "$REPO/docs/site/center/nav.json" \
      --prisms "$REPO/docs/site/center/prism-fragments.json"
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
    prism_gates
    ;;
  check)
    echo "== gate: links, anchors, assets, unfilled tokens =="
    python3 "$HERE/check_suite_center.py"
    echo "== gate: every diagram renders over file:// =="
    node "$REPO/skills/gabe-docsite/tools/diagram-compliance.mjs" docs/site/center
    prism_gates
    ;;
  *)
    echo "unknown mode: $MODE (expected: regen | check)" >&2
    exit 2
    ;;
esac

echo "suite center: OK"
