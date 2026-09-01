#!/usr/bin/env bash
# map-deltas.py fixture battery — the map↔grep delta loop's executable contract (11a: tally ledger).
#
# Proves FIRE (append writes a v1 delta; analyze --sweep UPSERTS into an edge-keyed v2 ledger, digests
# ACTIVE edges, exit 2) and SILENT (no .kdbp → no file/output, exit 0), plus the 11a laws: edge key is
# (gen, subject, FILE) not file:line so count survives line drift; nothing is ever deleted (cold edges
# stay in the ledger, re-promote on re-touch, tally RESUMES); active/cold computed fresh from commit
# count vs last_n; the threshold gates the suggestion; a v1 legacy rollup folds once; malformed skipped;
# no-new-deltas exits 0 quiet. Hermetic: temp git repos, MAP_DELTAS_H shrinks the horizon. Exit 0 = pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
MD="${MD_OVERRIDE:-$REPO/skills/gabe-commit/scripts/map-deltas.py}"  # override for mutation proof
export MAP_DELTAS_H=3   # an edge reads COLD 3 commits after its last recurrence (fast horizon for tests)

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

mkrepo() { mkdir -p "$1"; (cd "$1" && git init -q && git config user.email t@t && git config user.name t \
  && git commit -q --allow-empty -m base && mkdir -p .kdbp); }
pad() { (cd "$1" && for _ in $(seq 1 "$2"); do git commit -q --allow-empty -m pad; done); }
LEDGER() { echo "$1/.kdbp/map-deltas-rollup.jsonl"; }
LIVEF()  { echo "$1/.kdbp/map-deltas.jsonl"; }
# count of a subject's edge / its count field, from the ledger
edgecount() { python3 -c "import json,sys
c=[o for o in map(json.loads,open(sys.argv[1])) if o.get('subject')==sys.argv[2]]
print(c[0]['count'] if c else 'MISSING')" "$(LEDGER "$3")" "$1" 2>/dev/null; }
app() { (cd "$3" && python3 "$MD" append --type add --gen "$1" --subject "$2" \
        --found ev --pointer "$4" --cmd red >/dev/null 2>&1); }
ana() { (cd "$1" && shift; python3 "$MD" analyze "$@" >"$T/out" 2>"$T/err"); echo $?; }

# ── SILENT: no .kdbp → append no-op, analyze silent ────────────────────────
mkrepo "$T/silent"; rm -rf "$T/silent/.kdbp"
(cd "$T/silent" && python3 "$MD" append --type add --gen g --subject s --pointer p:1 >/dev/null 2>&1)
[ ! -e "$T/silent/.kdbp" ] && ok || bad "append with no .kdbp must not create .kdbp"
rc=$(ana "$T/silent" --sweep); [ "$rc" = 0 ] && [ ! -s "$T/out" ] && ok || bad "no-.kdbp analyze must be silent exit 0 (got $rc)"

# ── append still writes a v1 delta to LIVE (unchanged emit contract) ────────
mkrepo "$T/emit"
app _a3_graft.calls "callers(x)" "$T/emit" "svc/x.py:9"
[ "$(wc -l < "$(LIVEF "$T/emit")")" = 1 ] && ok || bad "one append should write one live line"
python3 - "$(LIVEF "$T/emit")" <<'PY' && ok || bad "live delta not v1-schema-valid"
import json,sys
o=json.loads(open(sys.argv[1]).read().splitlines()[0])
assert o["v"]==1 and o["type"]=="add" and o["gen"]=="_a3_graft.calls"
assert o["pointer"]=="svc/x.py:9" and o["found"]=="ev"
PY

# ── UPSERT dedup: same (gen,subject,FILE) at 3 different LINES → 1 edge, count 3 ──
mkrepo "$T/up"; R="$T/up"
app _a3_graft.calls "callers(foo)" "$R" "svc/a.py:10"
app _a3_graft.calls "callers(foo)" "$R" "svc/a.py:22"
app _a3_graft.calls "callers(foo)" "$R" "svc/a.py:99"
app _a3_graft.calls "callers(bar)" "$R" "svc/b.py:5"
rc=$(ana "$R" --sweep); [ "$rc" = 2 ] && ok || bad "sweep with deltas should exit 2 (got $rc)"
[ "$(wc -l < "$(LEDGER "$R")")" = 2 ] && ok || bad "3 same-edge + 1 distinct → 2 ledger records (got $(cat "$(LEDGER "$R")"))"
[ "$(edgecount 'callers(foo)' _ "$R")" = 3 ] && ok || bad "line drift must not reset the tally — foo count should be 3"
[ "$(edgecount 'callers(bar)' _ "$R")" = 1 ] && ok || bad "distinct edge bar should be count 1"
python3 -c "import json;o=[x for x in map(json.loads,open('$(LEDGER "$R")')) if x['subject']=='callers(foo)'][0]; assert o['file']=='svc/a.py' and ':' not in o['file']" && ok || bad "edge key file must carry NO :line"
[ "$(wc -l < "$(LIVEF "$R")")" = 0 ] && ok || bad "sweep must truncate live"

# ── DIGEST + threshold: 3 active edges of one gen → a 'consider' line ───────
mkrepo "$T/dg"; R="$T/dg"
for s in one two three; do app _a3_code.access "access($s)" "$R" "svc/$s.py:1"; done
app _a3_web.bridge "fetch(/z)" "$R" "web/z.tsx:2"   # a lone edge for a second gen
ana "$R" --sweep >/dev/null
grep -q "MAP DELTAS · 4 active edges" "$T/out" && ok || bad "digest header wrong: $(cat "$T/out")"
grep -q "consider: _a3_code.access — 3 active missed edges" "$T/out" && ok || bad "≥threshold gen must get a consider line"
grep -q "consider: _a3_web.bridge" "$T/out" && bad "<threshold gen (1 edge) must NOT be suggested" || ok

# ── COLD tier (computed) + no delete: advance > H, emit a NEW edge ──────────
mkrepo "$T/cold"; R="$T/cold"
app _a3_graft.calls "callers(old)" "$R" "svc/o.py:3"
ana "$R" --sweep >/dev/null                 # old edge last_n = now
pad "$R" 5                                   # 5 > H(3) commits pass, nobody re-touches old
app _a3_graft.calls "callers(new)" "$R" "svc/n.py:4"
ana "$R" --sweep >/dev/null
grep -q "MAP DELTAS · 1 active edges" "$T/out" && ok || bad "only the fresh edge should read ACTIVE (got: $(cat "$T/out"))"
[ "$(wc -l < "$(LEDGER "$R")")" = 2 ] && ok || bad "cold edge must NOT be deleted — ledger keeps both records"

# ── RE-PROMOTE: re-touch the cold edge → count RESUMES, active again ────────
app _a3_graft.calls "callers(old)" "$R" "svc/o.py:8"
ana "$R" --sweep >/dev/null
[ "$(edgecount 'callers(old)' _ "$R")" = 2 ] && ok || bad "re-touch must RESUME the tally to 2, not restart at 1"
grep -q "MAP DELTAS · 2 active edges" "$T/out" && ok || bad "re-touched cold edge must read ACTIVE again"

# ── MIGRATION: a v1 legacy rollup folds to v2 edges, stamped ACTIVE at migration ──
mkrepo "$T/mig"; R="$T/mig"
printf '%s\n' \
 '{"v":1,"type":"add","subject":"callers(q)","found":"e","pointer":"svc/q.py:3","gen":"_a3_graft.calls","ctx":{"cmd":"red","entity":"","head":"a"}}' \
 '{"v":1,"type":"add","subject":"callers(q)","found":"e","pointer":"svc/q.py:8","gen":"_a3_graft.calls","ctx":{"cmd":"red","entity":"","head":"a"}}' > "$(LEDGER "$R")"
pad "$R" 5                                   # advance past H(3): a mis-stamped (last_n=0) fold would read COLD
app _a3_web.bridge "fetch(/x)" "$R" "web/a.tsx:2"   # a new delta to trigger the sweep
ana "$R" --sweep >/dev/null
[ "$(wc -l < "$(LEDGER "$R")")" = 2 ] && ok || bad "v1 legacy (2 lines, same edge) + 1 new → 2 v2 edges (got $(cat "$(LEDGER "$R")"))"
[ "$(edgecount 'callers(q)' _ "$R")" = 2 ] && ok || bad "folded legacy edge q must carry count 2"
python3 -c "import json; assert all(o.get('v')==2 for o in map(json.loads,open('$(LEDGER "$R")')))" && ok || bad "migration must leave ONLY v2 records"
grep -q "MAP DELTAS · 2 active edges" "$T/out" && ok || bad "folded legacy edge must be stamped seen-at-migration (ACTIVE), not cold: $(cat "$T/out")"

# ── malformed live lines (incl. valid-JSON non-dicts) skipped, NEVER fatal ──
mkrepo "$T/mf"; R="$T/mf"
app _a3_graft.calls "callers(z)" "$R" "svc/z.py:1"
printf 'not json\n{"type":"bogus"}\n[1,2,3]\n"astring"\n42\n' >> "$(LIVEF "$R")"   # non-dict JSON must not crash
rc=$(ana "$R" --sweep); [ "$rc" = 2 ] && grep -q "1 active edges" "$T/out" && grep -q "malformed skipped" "$T/out" && ok || bad "malformed (incl. non-dict JSON) must be skipped, valid swept, never fatal (rc=$rc)"
rc=$(ana "$R" --sweep); [ "$rc" = 0 ] && [ ! -s "$T/out" ] && ok || bad "no new deltas → exit 0 silent (S14 owns standing reminders)"

# ── usage errors → exit 1 ──────────────────────────────────────────────────
rc=$( (cd "$R" && python3 "$MD" append --type nope --subject x --gen g >/dev/null 2>&1); echo $? )
[ "$rc" = 1 ] && ok || bad "invalid --type should exit 1 (got $rc)"
rc=$( (cd "$R" && python3 "$MD" append --type add --gen g >/dev/null 2>&1); echo $? )
[ "$rc" = 1 ] && ok || bad "missing --subject should exit 1 (got $rc)"

echo "map-deltas battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
