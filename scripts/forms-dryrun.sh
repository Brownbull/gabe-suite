#!/usr/bin/env bash
# Element forms dry run (docs/design/element-forms/amendment-1.md §A2 Slice 1 step 11) — prove an ARM SELECTION on
# real targets without touching them. For each target, serially:
#   1. map-baseline.sh check with GABE_FORMS_ARMS=none (beats a target's own forms_arms) → what moved vs the blessed baseline
#   2. map-baseline.sh check with GABE_FORMS_ARMS=<list> → what moved vs run 1 (expect forms.json only)
#   3. one JSON line: forms bytes off · on, each arm's present/reason/stats/bytes (the orchestrator measures the keys each
#      arm added), wall seconds per build
# Read-only on the targets: map-baseline.sh builds with GABE_REPO_ROOT + GABE_CENTER_OUT + GABE_GRAFT_BUILD=0 into
# scratch, and the parent environment passes through to the build (`env $4` never clears it). A run is trusted only
# when map-baseline wrote a fresh manifest and printed no SKIP / NO BASELINE / FAIL line — the scratch dir is cleared first.
# COST: every target builds TWICE — gustify ≈ 1 min a build, tier3 ≈ 2. Run it ALONE (WSL: never beside a battery).
# Exit 1 when run 2 moved anything but forms.json or any run was not trusted; exit 2 on a usage or roster problem.
# usage: scripts/forms-dryrun.sh [--arms a,b|all] [name…]     (names from tests/baselines/targets.conf; none = every target)
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
BASE_DIR="${GABE_BASELINE_DIR:-$HOME/.cache/gabe-map-baselines}"
ARMS="all"; NAMES=()
while [ $# -gt 0 ]; do case "$1" in --arms) ARMS="${2:?--arms needs a value}"; shift 2;; *) NAMES+=("$1"); shift;; esac; done
[ ${#NAMES[@]} -gt 0 ] || mapfile -t NAMES < <(bash "$REPO/scripts/map-baseline.sh" list 2>/dev/null | sed -nE 's/^ +([^ ]+) → .*/\1/p')
[ ${#NAMES[@]} -gt 0 ] || { echo "forms-dryrun: no targets — name them, or add a roster (tests/baselines/targets.conf)"; exit 2; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
rc=0

_moved() {  # $1 manifest a, $2 manifest b → the files whose normalized hash differs or that exist on one side only
  join -a1 -a2 -e MISSING -o 0,1.1,2.1 -j2 <(sort -k2 "$1") <(sort -k2 "$2") 2>/dev/null | awk '$2 != $3 {print $1}' | sort | tr '\n' ' '
}

_check() {  # $1 name, $2 arms value, $3 log → 0 when a fresh, trusted build happened
  rm -rf "$BASE_DIR/.check/$1"
  GABE_FORMS_ARMS="$2" bash "$REPO/scripts/map-baseline.sh" check "$1" >"$3" 2>&1
  if grep -qE "SKIP|NO BASELINE|FAIL" "$3" || [ ! -f "$BASE_DIR/.check/$1/.manifest" ]; then
    grep -E "SKIP|NO BASELINE|FAIL" "$3" | sed 's/^ */  /'; tail -3 "$3" | sed 's/^/  log: /'
    return 1
  fi
}

for n in "${NAMES[@]}"; do
  CK="$BASE_DIR/.check/$n"
  echo "── $n · arms none"
  t0=$(date +%s)
  if ! _check "$n" none "$T/$n.off.log"; then echo "  FAIL — the arms-off build is not trusted"; rc=1; continue; fi
  t1=$(date +%s)
  grep -E "BYTE-IDENTICAL|file\(s\) differ|changed |HEAD MOVED" "$T/$n.off.log" | sed 's/^ */  /'
  cp "$CK/.manifest" "$T/$n.off.manifest"; cp "$CK/forms.json" "$T/$n.off.forms.json" 2>/dev/null
  echo "── $n · arms $ARMS"
  if ! _check "$n" "$ARMS" "$T/$n.on.log"; then echo "  FAIL — the arms-on build is not trusted"; rc=1; continue; fi
  t2=$(date +%s)
  moved="$(_moved "$T/$n.off.manifest" "$CK/.manifest")"
  if [ -z "$moved" ] || [ "$moved" = "forms.json " ]; then echo "  on vs off: ${moved:-nothing} moved — OK"
  else echo "  on vs off: UNEXPECTED — $moved"; rc=1; fi
  python3 - "$n" "$T/$n.off.forms.json" "$CK/forms.json" "$((t1 - t0))" "$((t2 - t1))" "$moved" <<'PY'
import json, os, sys
name, off_p, on_p, s_off, s_on, moved = sys.argv[1:7]
def load(p):
    try:
        return json.load(open(p, encoding="utf-8")), os.path.getsize(p)
    except Exception:
        return None, None
off, b_off = load(off_p)
on, b_on = load(on_p)
arms = {arm: {k: blk.get(k) for k in ("present", "reason", "stats", "bytes")} for arm, blk in ((on or {}).get("arms") or {}).items()}
print(json.dumps({"target": name, "forms_bytes": {"off": b_off, "on": b_on}, "version": (on or {}).get("version"),
                  "head": (on or {}).get("head"), "arms_error": (on or {}).get("arms_error"),
                  "arms_ignored": (on or {}).get("arms_ignored"), "arms": arms,
                  "moved_on_vs_off": moved.split(), "seconds": {"off": int(s_off), "on": int(s_on)}}, sort_keys=True))
PY
done
exit $rc
