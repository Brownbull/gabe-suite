#!/usr/bin/env bash
# gabe-pulse deterministic-script fixture battery.
#
# Proves ledger-gap.sh can FIRE (exit 2, naming the unregistered commit), stay
# SILENT (exit 0), and refuse to guess (exit 1 UNDETERMINED) against its real
# contract as read from the script source. Hermetic: temp git repos, no network.
#
# The load-bearing case is COLUMN DISCIPLINE: a hash written anywhere other than
# the Commits column must NOT register a commit. Without that assertion the awk
# could scan whole lines and the battery would still pass — the check would be
# unfalsifiable, which is the failure mode tests/ exists to prevent.
#
# Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GAP="$REPO/skills/gabe-pulse/scripts/ledger-gap.sh"

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

mkgit() {
  mkdir -p "$1"
  (cd "$1" && git init -q && git config user.email t@t && git config user.name t \
     && git config commit.gpgsign false)
}

# commit a file, echo the short sha
mkcommit() { # $1=dir $2=name
  (cd "$1" && echo "$2" > "$2.txt" && git add "$2.txt" && git commit -qm "$2" \
     && git rev-parse --short=7 HEAD)
}

ledger_head() { # $1=dir
  mkdir -p "$1/.kdbp"
  { echo '# Session Ledger — thin index'; echo
    echo '| Date | Entry | Theme / scope | Commits | Gates / results |'
    echo '|---|---|---|---|---|'
  } > "$1/.kdbp/LEDGER.md"
}

ledger_row() { # $1=dir $2=hash $3=theme
  echo "| 2026-07-26 | COMMIT | ${3:-work} | $2 | findings 0→0 · size-budget ok |" >> "$1/.kdbp/LEDGER.md"
}

run_gap() { (cd "$1" && shift && bash "$GAP" "$@" >"$T/out" 2>&1); echo $?; }

# =====================================================================
# 1. SILENT — every commit registered
# =====================================================================
mkgit "$T/clean"
a=$(mkcommit "$T/clean" base)
ledger_head "$T/clean"; ledger_row "$T/clean" "$a"
b=$(mkcommit "$T/clean" second); ledger_row "$T/clean" "$b"
rc=$(run_gap "$T/clean")
[ "$rc" = 0 ] && grep -q "CLEAN" "$T/out" \
  && ok || bad "all-registered repo must stay SILENT exit 0 (got $rc: $(head -1 "$T/out"))"

# =====================================================================
# 2. FIRE — a raw commit with no ledger row
# =====================================================================
mkgit "$T/gap"
a=$(mkcommit "$T/gap" base)
ledger_head "$T/gap"; ledger_row "$T/gap" "$a"
raw=$(mkcommit "$T/gap" raw-work)
rc=$(run_gap "$T/gap")
[ "$rc" = 2 ] && grep -q "$raw" "$T/out" && grep -q "raw-work" "$T/out" \
  && ok || bad "unregistered commit must FIRE exit 2 naming sha+subject (got $rc)"

# =====================================================================
# 3. COLUMN DISCIPLINE (mutation proof) — a hash in the Theme column
#    must NOT count as registered.
# =====================================================================
mkgit "$T/col"
a=$(mkcommit "$T/col" base)
ledger_head "$T/col"; ledger_row "$T/col" "$a"
sneaky=$(mkcommit "$T/col" sneaky)
# hash appears in Theme (col 4), Commits column holds an em dash
echo "| 2026-07-26 | COMMIT | mentions $sneaky in prose | — | actions 0 |" >> "$T/col/.kdbp/LEDGER.md"
rc=$(run_gap "$T/col")
[ "$rc" = 2 ] && grep -q "$sneaky" "$T/out" \
  && ok || bad "hash outside the Commits column must NOT register (got $rc)"

# =====================================================================
# 4. BASELINE — commits older than the oldest registered one are ignored
# =====================================================================
mkgit "$T/base"
old=$(mkcommit "$T/base" ancient)      # predates ledger discipline
mid=$(mkcommit "$T/base" first-tracked)
ledger_head "$T/base"; ledger_row "$T/base" "$mid"
rc=$(run_gap "$T/base")
[ "$rc" = 0 ] && ! grep -q "$old" "$T/out" \
  && ok || bad "pre-baseline commit must not be reported (got $rc)"

# =====================================================================
# 5-7. UNDETERMINED — refuses to guess, and says which
# =====================================================================
mkdir -p "$T/nogit"
rc=$(run_gap "$T/nogit")
[ "$rc" = 1 ] && grep -q "not a git repository" "$T/out" \
  && ok || bad "non-git dir must exit 1 UNDETERMINED (got $rc)"

mkgit "$T/noledger"; mkcommit "$T/noledger" base >/dev/null
rc=$(run_gap "$T/noledger")
[ "$rc" = 1 ] && grep -q "no ledger" "$T/out" \
  && ok || bad "missing ledger must exit 1 UNDETERMINED (got $rc)"

mkgit "$T/nohash"; mkcommit "$T/nohash" base >/dev/null
ledger_head "$T/nohash"
echo "| 2026-07-26 | COMMIT | docs-audit: scope | — | actions 3 · drift 1 |" >> "$T/nohash/.kdbp/LEDGER.md"
rc=$(run_gap "$T/nohash")
[ "$rc" = 1 ] && grep -q "no baseline" "$T/out" \
  && ok || bad "hashless ledger must exit 1 UNDETERMINED, never CLEAN (got $rc)"

# =====================================================================
# 8. JSON — valid, correct count, machine-readable
# =====================================================================
mkgit "$T/json"
a=$(mkcommit "$T/json" base)
ledger_head "$T/json"; ledger_row "$T/json" "$a"
mkcommit "$T/json" one >/dev/null; mkcommit "$T/json" two >/dev/null
rc=$(run_gap "$T/json" --json)
if [ "$rc" = 2 ] && command -v python3 >/dev/null 2>&1; then
  got=$(python3 -c "
import json,sys
d=json.load(open('$T/out'))
print(d['state'], d['count'], len(d['unregistered']))
" 2>/dev/null)
  [ "$got" = "gap 2 2" ] && ok || bad "--json must emit valid JSON with count=2 (got '$got')"
  # FIELD ORDER — a sha/date/subject rotation is invisible to a count check and
  # silently corrupts every machine consumer. Found on real twin data, not here.
  got=$(python3 -c "
import json,re
d=json.load(open('$T/out'))
r=d['unregistered'][0]
print('ok' if re.fullmatch(r'\d{4}-\d{2}-\d{2}', r['date'])
      and r['subject'] in ('one','two')
      and re.fullmatch(r'[0-9a-f]{7}', r['sha']) else f\"{r['sha']}|{r['date']}|{r['subject']}\")
" 2>/dev/null)
  [ "$got" = "ok" ] && ok || bad "--json fields must not be rotated (got '$got')"
else
  bad "--json must exit 2 on a gap (got $rc)"
fi

# text output must read sha, then date, then subject
mkgit "$T/order"
a=$(mkcommit "$T/order" base)
ledger_head "$T/order"; ledger_row "$T/order" "$a"
mkcommit "$T/order" ordered-subject >/dev/null
rc=$(run_gap "$T/order")
[ "$rc" = 2 ] && grep -qE '^  [0-9a-f]{7}  [0-9]{4}-[0-9]{2}-[0-9]{2}  ordered-subject$' "$T/out" \
  && ok || bad "text row must be 'sha date subject' in that order (got: $(grep -m1 '^  ' "$T/out"))"

# =====================================================================
# 9. --since override
# =====================================================================
mkgit "$T/since"
a=$(mkcommit "$T/since" base)
ledger_head "$T/since"; ledger_row "$T/since" "$a"
mkcommit "$T/since" one >/dev/null
tip=$(cd "$T/since" && git rev-parse HEAD)
mkcommit "$T/since" two >/dev/null
rc=$(run_gap "$T/since" --since "$tip")
[ "$rc" = 2 ] && grep -q "two" "$T/out" && ! grep -q " one$" "$T/out" \
  && ok || bad "--since must narrow the range (got $rc)"

rc=$(run_gap "$T/since" --since nonexistent-ref)
[ "$rc" = 1 ] && grep -q "not found" "$T/out" \
  && ok || bad "--since with a bad ref must exit 1, not scan everything (got $rc)"

# =====================================================================
# 10. merges are not work — excluded from the gap
# =====================================================================
mkgit "$T/merge"
a=$(mkcommit "$T/merge" base)
ledger_head "$T/merge"; ledger_row "$T/merge" "$a"
(cd "$T/merge" && git checkout -qb side && echo x > s.txt && git add s.txt && git commit -qm side-work \
   && git checkout -q - && git merge -q --no-ff side -m "merge side" ) >/dev/null 2>&1
rc=$(run_gap "$T/merge")
[ "$rc" = 2 ] && ! grep -q "merge side" "$T/out" \
  && ok || bad "merge commit must be excluded from the gap list (got $rc)"

# =====================================================================
# 11. --limit truncates and says so
# =====================================================================
mkgit "$T/lim"
a=$(mkcommit "$T/lim" base)
ledger_head "$T/lim"; ledger_row "$T/lim" "$a"
for i in 1 2 3 4; do mkcommit "$T/lim" "c$i" >/dev/null; done
rc=$(run_gap "$T/lim" --limit 2)
[ "$rc" = 2 ] && grep -q "2 more" "$T/out" \
  && ok || bad "--limit must truncate and report the remainder (got $rc)"

# =====================================================================
# 12-15. BOOKKEEPING FILTER — a commit that writes a ledger row cannot
#    appear in the ledger it wrote. Measured on real twins: 73/146 gustify,
#    116/285 gastify. Without this the detector is ~half noise.
# =====================================================================
mkgit "$T/bk"
a=$(mkcommit "$T/bk" base)
ledger_head "$T/bk"; ledger_row "$T/bk" "$a"
# a .kdbp-only commit — pure bookkeeping
(cd "$T/bk" && ledger_row "$T/bk" "0000000" && git add .kdbp/LEDGER.md && git commit -qm "chore(kdbp): ledger row")
rc=$(run_gap "$T/bk")
[ "$rc" = 0 ] && grep -q "1 bookkeeping commit(s) excluded" "$T/out" \
  && ok || bad "kdbp-only commit must be excluded AND the exclusion stated (got $rc)"

# the same commit must be REPORTED when the filter is off — proves the filter
# is doing the work, not the baseline
rc=$(run_gap "$T/bk" --no-bookkeeping-filter)
[ "$rc" = 2 ] && grep -q "chore(kdbp)" "$T/out" \
  && ok || bad "--no-bookkeeping-filter must report the kdbp-only commit (got $rc)"

# a commit touching .kdbp AND source is WORK, not bookkeeping
(cd "$T/bk" && echo x > src.py && ledger_row "$T/bk" "1111111" \
   && git add src.py .kdbp/LEDGER.md && git commit -qm "mixed ledger plus source")
rc=$(run_gap "$T/bk")
[ "$rc" = 2 ] && grep -q "mixed ledger plus source" "$T/out" \
  && ok || bad "mixed .kdbp+source commit must count as WORK (got $rc)"

# a custom prefix widens the filter (gustify writes tests/results/*.digest.json)
mkgit "$T/bk2"
a=$(mkcommit "$T/bk2" base)
ledger_head "$T/bk2"; ledger_row "$T/bk2" "$a"
(cd "$T/bk2" && mkdir -p tests/results && echo '{}' > tests/results/api.digest.json \
   && ledger_row "$T/bk2" "2222222" && git add .kdbp/LEDGER.md tests/results \
   && git commit -qm "chore(kdbp): row plus digests")
rc=$(run_gap "$T/bk2")
[ "$rc" = 2 ] && ok || bad "digest commit must be WORK under the default prefix set (got $rc)"
rc=$(run_gap "$T/bk2" --bookkeeping .kdbp/ --bookkeeping tests/results/)
[ "$rc" = 0 ] && ok || bad "custom --bookkeeping prefix must exclude the digest commit (got $rc)"

# =====================================================================
echo "gabe-pulse scripts: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
