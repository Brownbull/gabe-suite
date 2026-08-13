#!/usr/bin/env bash
# Codebase-graph STATION probe battery — AUTHOR-TIME instruments (playwright,
# real browser, REAL mouse where z-order matters). Pins the station-port
# behaviors over the committed gustify fixture: the lab grammar (icons, halos,
# gradient wires, flow dots), the beat overlays, the selection engine
# (depth/peek/wire clicks), and the honest-empty degrade + L2 drill.
#
# Lives IN THE REPO (the scratchpad wipe lesson — probes in session transcripts
# protect nothing). NOT wired into suite-doctor: each probe boots a headless
# browser (~5-8s). Run when iterating on the station:
#   bash probes/run.sh          # every probe
#   bash probes/run.sh port1    # one probe
#
# Engine: machine-bound paths (npx playwright cache + chromium headless shell).
# On a fresh machine: npx playwright install chromium, then update the ENGINE
# lines inside the probes (createRequire root + executablePath).
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
pass=0; fail=0
for f in "$DIR"/${1:-}*-probe.mjs; do
  [ -e "$f" ] || { echo "no probes match: ${1:-all}"; exit 2; }
  out=$(node "$f" 2>&1); rc=$?
  tail1=$(echo "$out" | tail -1)
  if [ $rc -eq 0 ]; then pass=$((pass+1)); echo "PASS  $(basename "$f")  · $tail1"
  else fail=$((fail+1)); echo "FAIL  $(basename "$f")"; echo "$out" | grep -E "FAIL|Error" | head -8; fi
done
echo "── station probes: $pass passed · $fail failed"
[ $fail -eq 0 ]
