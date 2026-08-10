#!/usr/bin/env bash
# disposition battery — the flag → defer(PENDING) / tackle(plan-spec) primitive.
#
# Proves the DEFER writer emits a CANONICAL row the board's own parser accepts
# (load_pending_rows), mints P-ids, dedups a recurrence (same File + >50% Finding
# overlap → one row, Times Deferred++), follows review's escalation ladder
# (TD2 promotes medium/low→high and caps; TD3→critical), WARNs on a non-archmap
# File (GAP-A) without dropping the row, and that TACKLE prints a plan-phase spec
# without touching PENDING. Hermetic: a temp KDBP project with a git HEAD + archmap.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SP="$REPO/scripts/disposition.py"

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkproj() {  # fresh KDBP fixture with a git HEAD + a one-entity archmap
  local d="$1"; rm -rf "$d"; mkdir -p "$d/.kdbp" "$d/docs/site/center"
  git -C "$d" init -q; git -C "$d" -c user.email=t@t -c user.name=t commit --allow-empty -q -m init
  printf '# Deferred Items\n\n| # | Date | Source | Finding | File | Scale | Priority | Impact | Times Deferred | Status | Verified |\n|---|------|--------|---------|------|-------|----------|--------|----------------|--------|----------|\n' > "$d/.kdbp/PENDING.md"
  echo '{"entities":{"cooking":{"files":[["Cook","backend/app/services/cooking.py",120]]}}}' > "$d/docs/site/center/archmap.json"
}
rows() { grep -c '^| P' "$1/.kdbp/PENDING.md"; }
FL_GOD='{"dimension":"code","entity":"cooking","severity":"high","description":"cooking.py is a 900-line god file","source":"gabe-health","file":"backend/app/services/cooking.py"}'

# ---- DEFER: a canonical row appears, parseable by the board ----
mkproj "$T/a"
python3 "$SP" "$T/a" --defer --flag "$FL_GOD" >/dev/null 2>&1
[ "$(rows "$T/a")" = 1 ] && ok || bad "defer: one row appended"
grep -q '^| P1 | .* | gabe-health | \[code\] .* | backend/app/services/cooking.py | mvp | high | high | 1 | open | @' \
  "$T/a/.kdbp/PENDING.md" && ok || bad "defer: canonical 11-col row with born-verified @sha stamp"
GABE_REPO_ROOT="$T/a" python3 -c '
import sys; sys.path.insert(0,"'"$REPO"'/templates/center/generators")
import _center_data as D
assert len(D.load_pending_rows())==1, "board parser must accept the row"
' 2>/dev/null && ok || bad "defer: the board load_pending_rows parser accepts the written row"

# ---- RECURRENCE: same finding again → one row, Times Deferred 2, stays high ----
python3 "$SP" "$T/a" --defer --flag '{"dimension":"code","entity":"cooking","severity":"high","description":"cooking.py god file too many lines","source":"gabe-health","file":"backend/app/services/cooking.py"}' >/dev/null 2>&1
[ "$(rows "$T/a")" = 1 ] && ok || bad "recurrence: no duplicate row"
awk -F'|' '/^\| P1 /{gsub(/ /,"",$10); gsub(/ /,"",$8); if($10=="2"&&$8=="high") e=1} END{exit !e}' \
  "$T/a/.kdbp/PENDING.md" && ok || bad "recurrence: Times Deferred 2, priority stays high (not critical at TD2)"

# ---- ESCALATION: a medium finding promotes to high at TD2; →critical at TD3 ----
mkproj "$T/e"
FL_MED='{"dimension":"testing","entity":"cooking","severity":"medium","description":"weak coverage on the retry path","source":"gabe-health","file":"backend/app/services/cooking.py"}'
python3 "$SP" "$T/e" --defer --flag "$FL_MED" >/dev/null 2>&1   # TD1 medium
python3 "$SP" "$T/e" --defer --flag "$FL_MED" >/dev/null 2>&1   # TD2 → high
awk -F'|' '/^\| P1 /{gsub(/ /,"",$10);gsub(/ /,"",$8);if($10=="2"&&$8=="high")e=1}END{exit !e}' \
  "$T/e/.kdbp/PENDING.md" && ok || bad "escalation: medium → high at TD2"
python3 "$SP" "$T/e" --defer --flag "$FL_MED" >/dev/null 2>&1   # TD3 → critical
awk -F'|' '/^\| P1 /{gsub(/ /,"",$10);gsub(/ /,"",$8);if($10=="3"&&$8=="critical")e=1}END{exit !e}' \
  "$T/e/.kdbp/PENDING.md" && ok || bad "escalation: → critical at TD3"

# ---- GAP-A: non-archmap File warns (stderr) but still writes ----
mkproj "$T/g"
err=$(python3 "$SP" "$T/g" --defer --flag '{"dimension":"security","entity":"auth","severity":"high","description":"missing rate limit","source":"gabe-roast","file":"cross-cutting"}' 2>&1 >/dev/null)
{ echo "$err" | grep -q "not archmap-owned" && [ "$(rows "$T/g")" = 1 ]; } \
  && ok || bad "GAP-A: non-archmap File warns but still writes the row"
# archmap-owned File → NO warn
err=$(python3 "$SP" "$T/g" --defer --flag "$FL_GOD" 2>&1 >/dev/null)
echo "$err" | grep -q "not archmap-owned" && bad "GAP-A: archmap-owned File must NOT warn" || ok

# ---- --dry-run prints, writes nothing ----
mkproj "$T/d"
python3 "$SP" "$T/d" --defer --flag "$FL_GOD" --dry-run | grep -q '\[code\]' && ok || bad "dry-run: prints the row"
[ "$(rows "$T/d")" = 0 ] && ok || bad "dry-run: writes nothing"

# ---- TACKLE: prints a plan-phase spec, touches no PENDING ----
mkproj "$T/t"
out=$(python3 "$SP" "$T/t" --tackle --flag '{"dimension":"evidence","entity":"cooking","severity":"high","description":"no e2e proof of the cook flow","fix":"add a journey test"}')
{ echo "$out" | grep -q "add-phase" && echo "$out" | grep -q "Entities:.*cooking" && [ "$(rows "$T/t")" = 0 ]; } \
  && ok || bad "tackle: prints the /gabe-plan phase spec, writes no PENDING row"

# ---- PIPE SAFETY: a | in the description must not inject a column ----
mkproj "$T/p"
python3 "$SP" "$T/p" --defer --flag '{"dimension":"code","entity":"cooking","severity":"low","description":"split cooking.py into A | B | C","source":"gabe-health","file":"backend/app/services/cooking.py"}' >/dev/null 2>&1
awk '/^\| P1 /{n=gsub(/\|/,"|"); if(n==12) e=1} END{exit !e}' "$T/p/.kdbp/PENDING.md" \
  && ok || bad "pipe-safety: a | in description must not add table columns (want 12 pipes)"
GABE_REPO_ROOT="$T/p" python3 -c 'import sys;sys.path.insert(0,"'"$REPO"'/templates/center/generators");import _center_data as D;assert len(D.load_pending_rows())==1' 2>/dev/null \
  && ok || bad "pipe-safety: board still parses exactly one row"

# ---- DIVERGENT HEADER (10-col, no Verified — a real twin schema) ----
mkhdr() {  # $1=dir $2=header-line ; git + archmap, custom PENDING header
  local d="$1"; rm -rf "$d"; mkdir -p "$d/.kdbp" "$d/docs/site/center"
  git -C "$d" init -q; git -C "$d" -c user.email=t@t -c user.name=t commit --allow-empty -q -m init
  { printf '# Deferred Items\n\n'; printf '%s\n' "$2"
    printf '%s\n' "$2" | sed 's/[^|]/-/g'; } > "$d/.kdbp/PENDING.md"
  echo '{"entities":{"cooking":{"files":[["Cook","backend/app/services/cooking.py",120]]}}}' > "$d/docs/site/center/archmap.json"
}
mkhdr "$T/x10" '| # | Date | Source | Finding | File | Scale | Priority | Impact | Times Deferred | Status |'
python3 "$SP" "$T/x10" --defer --flag "$FL_GOD" >/dev/null 2>&1
awk '/^\| P1 /{n=gsub(/\|/,"|"); if(n==11) e=1} END{exit !e}' "$T/x10/.kdbp/PENDING.md" \
  && ok || bad "divergent-10col: appended row matches the file's 10-col header (no Verified column)"
GABE_REPO_ROOT="$T/x10" python3 -c 'import sys;sys.path.insert(0,"'"$REPO"'/templates/center/generators");import _center_data as D;assert len(D.load_pending_rows())==1' 2>/dev/null \
  && ok || bad "divergent-10col: board parses the appended row"

# ---- DIVERGENT HEADER (3-col | # | Gate | Finding | — the other twin) ----
mkhdr "$T/x3" '| # | Gate | Finding |'
err=$(python3 "$SP" "$T/x3" --defer --flag "$FL_GOD" 2>&1 >/dev/null)
awk '/^\| P1 /{n=gsub(/\|/,"|"); if(n==4) e=1} END{exit !e}' "$T/x3/.kdbp/PENDING.md" \
  && ok || bad "divergent-3col: appended row matches the 3-col header"
{ grep -q '\[code\]' "$T/x3/.kdbp/PENDING.md" && echo "$err" | grep -q "no File column"; } \
  && ok || bad "divergent-3col: Finding written + warns the schema has no File column"

# ---- CLOSURE-AWARE: a prose-Status open row recur-matches (no false-skip duplicate) ----
mkproj "$T/ps"
printf '| P1 | 2026-01-01 | gabe-review | [code] cooking.py god file too many lines | backend/app/services/cooking.py | mvp | high | high | 1 | in-progress: refactor underway | @s 2026-01-01 |\n' >> "$T/ps/.kdbp/PENDING.md"
python3 "$SP" "$T/ps" --defer --flag "$FL_GOD" >/dev/null 2>&1
[ "$(rows "$T/ps")" = 1 ] && ok || bad "closure: an OPEN prose-Status row must recur-match, not duplicate"

# ---- CLOSURE-AWARE: a comment-closed row is NOT re-escalated (append new instead) ----
mkproj "$T/cc"
printf '| P1 | 2026-01-01 | gabe-review | [code] cooking.py god file too many lines | backend/app/services/cooking.py | mvp | high | high | 1 |  | @s 2026-01-01 |\n<!-- P1 resolved 2026-02-01: split done -->\n' >> "$T/cc/.kdbp/PENDING.md"
python3 "$SP" "$T/cc" --defer --flag "$FL_GOD" >/dev/null 2>&1
[ "$(rows "$T/cc")" = 2 ] && ok || bad "closure: a comment-resolved row must NOT be re-escalated (new row appended)"

# ---- P-id minted over the resolved archive, not just live ----
mkproj "$T/ar"; mkdir -p "$T/ar/.kdbp/archive"
printf '| # | Finding | Priority |\n|---|---|---|\n| P5 | old resolved thing | low |\n' > "$T/ar/.kdbp/archive/PENDING-resolved_2026.md"
python3 "$SP" "$T/ar" --defer --flag "$FL_GOD" >/dev/null 2>&1
grep -q '^| P6 ' "$T/ar/.kdbp/PENDING.md" && ok || bad "P-id: minted over the resolved archive (P5 → P6)"

# ---- FIRE: malformed flag / no kdbp ----
python3 "$SP" "$T/t" --defer --flag 'not json' >/dev/null 2>&1; [ "$?" = 1 ] && ok || bad "fire: malformed --flag → exit 1"
mkdir -p "$T/nokdbp"
python3 "$SP" "$T/nokdbp" --defer --flag "$FL_GOD" >/dev/null 2>&1; [ "$?" = 1 ] && ok || bad "fire: no .kdbp → exit 1"

echo "=================================="
echo "disposition battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
