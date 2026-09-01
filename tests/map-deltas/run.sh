#!/usr/bin/env bash
# map-deltas.py fixture battery — the map<->grep delta loop's executable contract.
#
# Proves the checker can both FIRE (append writes a schema-valid line; analyze
# clusters + digests + sweeps, exit 2) and stay SILENT (no .kdbp → no file, no
# output, exit 0), plus the honesty + non-block laws: honest-empty byte-identical
# on an empty accumulator, malformed lines skipped-not-fatal, threshold gates the
# suggestion, sweep clears to a rollup and is idempotent, exit 2 is a WARN never a
# block. Hermetic: temp git repos, no network. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
MD="${MD_OVERRIDE:-$REPO/skills/gabe-commit/scripts/map-deltas.py}"  # override for mutation proof

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

mkgit() { # $1 = dir; fresh repo with one base commit
  mkdir -p "$1"
  (cd "$1" && git init -q && git config user.email t@t && git config user.name t \
     && git commit -q --allow-empty -m base)
}
run() { (cd "$1" && shift; python3 "$MD" "$@" >"$T/out" 2>"$T/err"); echo $?; }

# ── SILENT: no .kdbp → append is a no-op, exit 0, writes nothing ────────────
mkgit "$T/silent"
rc=$(run "$T/silent" append --type add --subject "access(Recipe)" --gen _a3_code.access)
[ "$rc" = 0 ] && ok || bad "append with no .kdbp should exit 0 (got $rc)"
[ ! -e "$T/silent/.kdbp" ] && ok || bad "append with no .kdbp must not create .kdbp"

# ── honest-empty: analyze with no .kdbp → exit 0, no output ─────────────────
rc=$(run "$T/silent" analyze --sweep)
[ "$rc" = 0 ] && ok || bad "analyze with no .kdbp should exit 0 (got $rc)"
[ ! -s "$T/out" ] && ok || bad "analyze with no .kdbp must print nothing"

# ── honest-empty: .kdbp present but no accumulator → exit 0, silent ─────────
mkgit "$T/empty"; mkdir -p "$T/empty/.kdbp"
rc=$(run "$T/empty" analyze --sweep)
[ "$rc" = 0 ] && ok || bad "analyze on empty accumulator should exit 0 (got $rc)"
[ ! -s "$T/out" ] && ok || bad "analyze on empty accumulator must be silent"
[ ! -e "$T/empty/.kdbp/map-deltas-rollup.jsonl" ] && ok || bad "empty analyze must not create a rollup"

# ── FIRE append: writes ONE schema-valid line with a non-empty head ─────────
mkgit "$T/fire"; mkdir -p "$T/fire/.kdbp"
run "$T/fire" append --type add --subject "access(Recipe)" \
    --found "services/x.py queries it" --pointer "services/x.py:9" \
    --gen _a3_code.access --cmd execute --entity recipe >/dev/null
LIVE="$T/fire/.kdbp/map-deltas.jsonl"
[ "$(wc -l < "$LIVE")" = 1 ] && ok || bad "one append should write exactly one line"
python3 - "$LIVE" <<'PY' && ok || bad "append line is not schema-valid"
import json, sys
o = json.loads(open(sys.argv[1]).read().splitlines()[0])
assert o["v"] == 1 and o["type"] == "add" and o["subject"] == "access(Recipe)"
assert o["gen"] == "_a3_code.access" and o["ctx"]["cmd"] == "execute"
assert o["ctx"]["entity"] == "recipe" and len(o["ctx"]["head"]) >= 7  # real short sha
assert o["found"] == "services/x.py queries it"   # the free-text evidence field is preserved
assert o["pointer"] == "services/x.py:9"          # the file:line pointer is preserved
PY

# ── FIRE analyze: clusters by gen, digests, exit 2, honours threshold ───────
for i in 2 3 4 5 6 7 8 9; do
  run "$T/fire" append --type add --subject "access(R$i)" --pointer "s.py:$i" --gen _a3_code.access >/dev/null
done
run "$T/fire" append --type subtract --subject "callers(foo)" --gen _a3_graft.calls --cmd red >/dev/null
run "$T/fire" append --type add --subject "callers(bar)" --gen _a3_graft.calls --cmd red >/dev/null
rc=$(run "$T/fire" analyze)   # no --sweep, default threshold 3
[ "$rc" = 2 ] && ok || bad "analyze with deltas should exit 2 WARN (got $rc)"
grep -q "MAP DELTAS · 11 since last sweep" "$T/out" && ok || bad "digest header wrong: $(cat "$T/out")"
grep -q "_a3_code.access x9" "$T/out" && ok || bad "cluster count wrong for _a3_code.access"
grep -q "consider: _a3_code.access — 9 deltas" "$T/out" && ok || bad "≥threshold gen must get a suggestion"
grep -q "consider: _a3_graft.calls" "$T/out" && bad "<threshold gen (2) must NOT be suggested" || ok

# threshold=1 surfaces the sub-threshold gen too
rc=$(run "$T/fire" analyze --threshold 1)
grep -q "consider: _a3_graft.calls" "$T/out" && ok || bad "threshold 1 must surface _a3_graft.calls"

# ── malformed: a bad line is skipped, counted, never fatal ─────────────────
echo "not json"        >> "$LIVE"
echo '{"type":"bogus"}' >> "$LIVE"   # invalid type → not a valid delta
rc=$(run "$T/fire" analyze)
[ "$rc" = 2 ] && ok || bad "malformed lines must not crash analyze (got $rc)"
grep -q "2 malformed skipped" "$T/out" && ok || bad "malformed count not reported"
grep -q "MAP DELTAS · 11 " "$T/out" && ok || bad "malformed lines must not inflate the valid count"

# ── sweep: valid lines → rollup, live back to empty, idempotent ────────────
rc=$(run "$T/fire" analyze --sweep)
[ "$rc" = 2 ] && ok || bad "sweep with deltas should exit 2 (got $rc)"
[ "$(wc -l < "$LIVE")" = 0 ] && ok || bad "sweep must truncate the live accumulator"
[ "$(wc -l < "$T/fire/.kdbp/map-deltas-rollup.jsonl")" = 11 ] && ok \
  || bad "sweep must move 11 valid lines to the rollup (got $(wc -l < "$T/fire/.kdbp/map-deltas-rollup.jsonl"))"
python3 -c "import json,sys; [json.loads(l) for l in open('$T/fire/.kdbp/map-deltas-rollup.jsonl')]" \
  && ok || bad "rollup lines must all be valid JSON"
# idempotent: second sweep on the now-empty accumulator is silent honest-empty
rc=$(run "$T/fire" analyze --sweep)
[ "$rc" = 0 ] && ok || bad "second sweep (empty) should exit 0 (got $rc)"
[ ! -s "$T/out" ] && ok || bad "second sweep must be silent"
[ "$(wc -l < "$T/fire/.kdbp/map-deltas-rollup.jsonl")" = 11 ] && ok \
  || bad "idempotent sweep must not duplicate rollup lines"

# ── determinism: two identical appends → two byte-identical lines ──────────
mkgit "$T/det"; mkdir -p "$T/det/.kdbp"
run "$T/det" append --type modify --subject s --found f --pointer p --gen g --cmd review >/dev/null
run "$T/det" append --type modify --subject s --found f --pointer p --gen g --cmd review >/dev/null
a=$(sed -n '1p' "$T/det/.kdbp/map-deltas.jsonl"); b=$(sed -n '2p' "$T/det/.kdbp/map-deltas.jsonl")
[ "$a" = "$b" ] && ok || bad "identical appends must be byte-identical (head fixed per repo)"

# ── usage errors → exit 1 (not a crash, not a silent pass) ─────────────────
rc=$(run "$T/fire" append --type nope --subject x --gen g)
[ "$rc" = 1 ] && ok || bad "invalid --type should exit 1 (got $rc)"
rc=$(run "$T/fire" append --type add --gen g)
[ "$rc" = 1 ] && ok || bad "missing --subject should exit 1 (got $rc)"
rc=$(run "$T/fire" append --type add --subject x)
[ "$rc" = 1 ] && ok || bad "missing --gen should exit 1 (got $rc)"

# ── digest ranking + top-5 '+N more' truncation ────────────────────────────
mkgit "$T/rank"; mkdir -p "$T/rank/.kdbp"
for pair in g6:6 g5:5 g4:4 g3:3 g2:2 g1:1; do   # 6 gens, descending counts
  g="${pair%%:*}"; n="${pair##*:}"
  for ((i=0; i<n; i++)); do run "$T/rank" append --type add --subject "s$g$i" --gen "$g" >/dev/null; done
done
run "$T/rank" analyze --threshold 99 >/dev/null   # threshold 99 → header only, no suggestions
grep -q "MAP DELTAS · 21 since last sweep · g6 x6" "$T/out" && ok || bad "digest must rank g6 (count 6) first: $(cat "$T/out")"
grep -q "+1 more" "$T/out" && ok || bad "6 gens must truncate to top-5 + '+1 more'"
grep -q "g1 x1" "$T/out" && bad "rank-6 gen g1 must be truncated out of the header" || ok
grep -q "consider:" "$T/out" && bad "threshold 99 must suppress all suggestions" || ok

echo "map-deltas battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
