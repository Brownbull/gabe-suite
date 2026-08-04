#!/usr/bin/env bash
# workflow-drift battery — the census drift checker + the S8 pulse angle.
# Every case can FAIL: fixtures are built to trip exactly one check each, and
# each was mutation-proven (see cases below).
set -uo pipefail
cd "$(dirname "$0")/../.."
CHK=templates/center/generators/check_workflow_drift.py
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0
ok(){ if [ "$1" = 1 ]; then echo "PASS  $2"; pass=$((pass+1)); else echo "FAIL  $2 — $3"; fail=$((fail+1)); fi; }

mkdir -p "$TMP/center/assets"
: > "$TMP/center/assets/real.png"

# fixture 1 — a clean census: every step captured, no claims, no archmap
cat > "$TMP/clean.json" <<'J'
{"entity":"t","start":"w","states":{
 "a":{"l":"a","st":"running","role":"principal","uc":"x","cap":"2026-01-01","spec":"—",
      "code":[],"models":[],"cids":[],"writes":[],"shot":["assets/real.png"]},
 "sec":{"l":"s","grp":1,"st":"running","role":"section","uc":"x","cap":"—","spec":"—",
      "code":[],"models":[],"cids":[],"writes":[]}},
 "workflows":{"w":{"label":"w","gates":[],"nodes":["a"],"tree":[["a",10,10]],"edges":[],"taps":[],"bands":[],"h":50}}}
J
out=$(python3 "$CHK" "$TMP/clean.json" --center "$TMP/center" 2>&1)
echo "$out" | grep -q "clean —" && ok 1 "C1 a fully-captured census reports clean" || ok 0 "C1 a fully-captured census reports clean" "$out"

# fixture 2 — capture debt: one step with no shot, one whose file is gone
cat > "$TMP/debt.json" <<'J'
{"entity":"t","start":"w","states":{
 "a":{"l":"a","st":"ghost","role":"named gap","uc":"x","cap":"capture owed (run)","spec":"—",
      "code":[],"models":[],"cids":[],"writes":[]},
 "b":{"l":"b","st":"running","role":"principal","uc":"x","cap":"2026-01-01","spec":"—",
      "code":[],"models":[],"cids":[],"writes":[],"shot":["assets/GONE.png"]}},
 "workflows":{"w":{"label":"w","gates":[],"nodes":["a"],"tree":[["a",10,10]],"edges":[],"taps":[],"bands":[],"h":50}}}
J
out=$(python3 "$CHK" "$TMP/debt.json" --center "$TMP/center" 2>&1)
[ "$(echo "$out" | grep -c 'capture-debt (2)')" = 1 ] && ok 1 "C2 capture debt: missing shot AND missing file both caught" \
  || ok 0 "C2 capture debt: missing shot AND missing file both caught" "$out"

# fixture 3 — claim drift: a C-id no junit ran
cat > "$TMP/junit.xml" <<'J'
<testsuite><testcase classname="t" name="does a thing C111"/></testsuite>
J
cat > "$TMP/claim.json" <<'J'
{"entity":"t","start":"w","states":{
 "a":{"l":"a","st":"running","role":"principal","uc":"x","cap":"2026-01-01","spec":"—",
      "code":[],"models":[],"cids":["C999"],"writes":[],"shot":["assets/real.png"]}},
 "workflows":{"w":{"label":"w","gates":[],"nodes":["a"],"tree":[["a",10,10]],"edges":[],"taps":[],"bands":[],"h":50}}}
J
out=$(python3 "$CHK" "$TMP/claim.json" --center "$TMP/center" --junit "$TMP/junit.xml" 2>&1)
echo "$out" | grep -q "claims C999" && ok 1 "C3 claim drift: a C-id no junit ran is caught" || ok 0 "C3 claim drift: a C-id no junit ran is caught" "$out"

# fixture 4 — a C-id that DID run must NOT be reported (no false positives)
cat > "$TMP/claim-ok.json" <<'J'
{"entity":"t","start":"w","states":{
 "a":{"l":"a","st":"running","role":"principal","uc":"x","cap":"2026-01-01","spec":"—",
      "code":[],"models":[],"cids":["C111"],"writes":[],"shot":["assets/real.png"]}},
 "workflows":{"w":{"label":"w","gates":[],"nodes":["a"],"tree":[["a",10,10]],"edges":[],"taps":[],"bands":[],"h":50}}}
J
out=$(python3 "$CHK" "$TMP/claim-ok.json" --center "$TMP/center" --junit "$TMP/junit.xml" 2>&1)
echo "$out" | grep -q "claim-drift" && ok 0 "C4 a running C-id is NOT reported (no false gap)" "$out" || ok 1 "C4 a running C-id is NOT reported (no false gap)"

# fixture 5 — census-lag fires when the archmap DOES carry columns
cat > "$TMP/arch.json" <<'J'
{"models":{"M":{"columns":[{"name":"covered"},{"name":"orphan_field"}]}}}
J
cat > "$TMP/lag.json" <<'J'
{"entity":"t","start":"w","states":{
 "a":{"l":"a","st":"running","role":"principal","uc":"x","cap":"2026-01-01","spec":"—",
      "code":[],"models":[],"cids":[],"shot":["assets/real.png"],
      "writes":[["covered","f()","M.covered"]]}},
 "workflows":{"w":{"label":"w","gates":[],"nodes":["a"],"tree":[["a",10,10]],"edges":[],"taps":[],"bands":[],"h":50}}}
J
out=$(python3 "$CHK" "$TMP/lag.json" --center "$TMP/center" --archmap "$TMP/arch.json" 2>&1)
echo "$out" | grep -q "M.orphan_field" && ok 1 "C5 census lag: an uncovered writable field is caught" || ok 0 "C5 census lag: an uncovered writable field is caught" "$out"
echo "$out" | grep -q "M.covered" && ok 0 "C6 a covered field is NOT reported" "$out" || ok 1 "C6 a covered field is NOT reported"

# fixture 6 — a checker that cannot run must SAY SO, never report clean
out=$(python3 "$CHK" "$TMP/lag.json" --center "$TMP/center" --archmap "$TMP/junit.xml" 2>&1 || true)
out2=$(python3 "$CHK" "$TMP/lag.json" --center "$TMP/center" --archmap "$TMP/clean.json" 2>&1)
echo "$out2" | grep -q "census-lag NOT RUN" && ok 1 "C7 a column-less archmap reports NOT RUN, not clean" || ok 0 "C7 a column-less archmap reports NOT RUN, not clean" "$out2"

# fixture 7 — report-never-gate: findings exit 0 unless --strict
python3 "$CHK" "$TMP/debt.json" --center "$TMP/center" >/dev/null 2>&1
[ $? = 0 ] && ok 1 "C8 findings exit 0 (report-never-gate)" || ok 0 "C8 findings exit 0 (report-never-gate)" "nonzero"
python3 "$CHK" "$TMP/debt.json" --center "$TMP/center" --strict >/dev/null 2>&1
[ $? = 1 ] && ok 1 "C9 --strict exits 1 on findings" || ok 0 "C9 --strict exits 1 on findings" "expected 1"

# fixture 8 — the S8 angle: fires above threshold, silent below, honest when absent
S8=$(python3 tests/workflow-drift/s8_cases.py "$TMP" 2>&1 | tail -1)
[ "$S8" = "S8OK" ] && ok 1 "C10 S8 angle: silent when absent/below, fires above threshold" || ok 0 "C10 S8 angle" "$S8"

echo
echo "workflow-drift battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
