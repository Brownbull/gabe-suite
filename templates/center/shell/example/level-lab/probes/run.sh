#!/usr/bin/env bash
# Level-lab probe battery — AUTHOR-TIME instruments (playwright, real browser).
#
# These probes are the lab's regression suite: every settled behavior from the
# feedback rounds is pinned here (grammar, selection, hop depth, flow dots,
# edge hop, nav history, layout crossings, the REAL-mouse press matrix).
#
# They live IN THE REPO because the scratchpad wipe of 2026-08-13 deleted the
# whole standing battery — "fixtures that live in session transcripts protect
# nothing" (meta-review P4) now applied to probes too.
#
# NOT wired into suite-doctor: each probe boots a headless browser (~5-8s);
# the full battery is minutes. Run it when iterating on the lab:
#   bash probes/run.sh            # every probe
#   bash probes/run.sh lvl28      # one probe
#
# Engine: machine-bound paths (npx playwright cache + chromium headless shell).
# On a fresh machine: npx playwright install chromium, then update ENGINE lines
# inside the probes (createRequire root + executablePath).
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
pass=0; fail=0
for f in "$DIR"/${1:-}*-probe.mjs; do
  [ -e "$f" ] || { echo "no probes match: ${1:-all}"; exit 2; }
  out=$(node "$f" 2>&1); rc=$?
  tail1=$(echo "$out" | tail -1)
  if [ $rc -eq 0 ]; then pass=$((pass+1)); echo "PASS  $(basename "$f")  · $tail1"
  else fail=$((fail+1)); echo "FAIL  $(basename "$f")"; echo "$out" | grep -E "FAIL|Error" | head -5; fi
done
echo "── level-lab probes: $pass passed · $fail failed"
[ $fail -eq 0 ]
