#!/usr/bin/env bash
# case-thread fixture battery — every verdict proven to FIRE and to stay silent.
# Hermetic: temp git repo, fake runners (shell scripts), no project data touched.
# Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
CT="$REPO/skills/gabe-red/scripts/case-thread.py"

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
cd "$T" || exit 1
git init -q && git config user.email t@t && git config user.name t
mkdir -p .kdbp
git commit -qm base --allow-empty

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

plan() { # $1 = cases string or None
  python3 -c "
import json
plan={'version':1,'status':'active','current_phase':'1',
      'phases':[{'id':'1','cells':{'red':'done'},'cases':$1}]}
json.dump(plan,open('.kdbp/PLAN.json','w'))"
}
runner() { printf '#!/bin/sh\nprintf "%%s\\n" "$OUT"\nexit %s\n' "$1" > r.sh; chmod +x r.sh; }
ct() { python3 "$CT" --phase 1 --run ./r.sh "$@" >out.txt 2>&1; echo $?; }

# --- assert-red ----------------------------------------------------------
plan "'NEW C147 · BUMP C148→v2 (red@abc1234) · GUARD C091'"
OUT="FAILED test_wall.py::test_C147_rejects AssertionError · FAILED test_C148" ; export OUT
runner 1
[ "$(ct --assert-red)" = 0 ] && grep -q RED-PROVEN out.txt && ok || bad "red: failing run must be RED-PROVEN exit 0"
runner 0
[ "$(ct --assert-red)" = 2 ] && grep -q NOT-RED out.txt && ok || bad "red: passing run must be NOT-RED exit 2"
OUT="ImportError: cannot import name wall" ; export OUT
runner 2
[ "$(ct --assert-red)" = 2 ] && grep -q 'BROKEN' out.txt && ok || bad "red: import error must be NOT-RED(broken) exit 2, never red evidence"

# --- assert-green --------------------------------------------------------
OUT="2 passed · C147 C148 ok" ; export OUT
runner 0
[ "$(ct --assert-green)" = 0 ] && grep -q GREEN-PROVEN out.txt && grep -q 'stamp: green@' out.txt && ok || bad "green: passing run must be GREEN-PROVEN with a green@ stamp line"
runner 1
[ "$(ct --assert-green)" = 2 ] && grep -q NOT-GREEN out.txt && ok || bad "green: failing run must be NOT-GREEN exit 2"

# --- unseen-id warn (scoping honesty) ------------------------------------
OUT="FAILED test_C147 only" ; export OUT
runner 1
ct --assert-red >/dev/null; grep -q 'not seen in output: C148' out.txt && ok || bad "red: id absent from output must WARN about scoping"

# --- inconclusive exits --------------------------------------------------
plan "'skip:not-testable — config-only phase'"
runner 1
[ "$(ct --assert-red)" = 3 ] && ok || bad "skip:* record must be INCONCLUSIVE exit 3"
plan "None"
[ "$(ct --assert-red)" = 3 ] && ok || bad "missing Cases record must be INCONCLUSIVE exit 3"
plan "'prose with no ids at all'"
[ "$(ct --assert-green)" = 3 ] && ok || bad "record without C-ids must be INCONCLUSIVE exit 3"

# --- guard-only record ---------------------------------------------------
plan "'— · GUARD: C091, C120 (behavior unchanged)'"
OUT="2 passed" ; export OUT
runner 0
[ "$(ct --assert-green)" = 0 ] && ok || bad "guard-only record with passing run must be GREEN-PROVEN"

echo "case-thread battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
