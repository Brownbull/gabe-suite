#!/usr/bin/env bash
# Board KPI-filter + ▶ NOW banner contract battery.
#
# Guards the coupling that shipped broken twice: a KPI tile filters on a card
# attribute the GENERATOR must emit, and the banner renders classes the CSS must
# style. When the two halves live in different files, that seam is exactly where
# a filter silently starts showing the whole board again (closed-30d showed 137
# of 83; over-3-months showed all of 2) — no error, just a wrong count.
#
# It is a SOURCE-CONTRACT battery (grep predicates, fire+silent) because the
# suite ships no browser. The runtime counts themselves are proven at author
# time by playwright against a real twin's board (the lab-driver read-only
# build); this battery keeps the two source halves from drifting apart after.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators/_a3_board.py"
JS="$REPO/templates/center/shell/assets/board.js"
CSS="$REPO/templates/center/shell/assets/a3.css"

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

# --- the two predicates, so the SAME check that passes on the shipped file is
#     the one asserted to FAIL on a mutated copy (a checker that cannot fail is
#     non-evidence — meta-review P2). ------------------------------------------
gen_ok() {  # the generator emits BOTH KPI-filter attributes on every card
  grep -q 'data-closed30="' "$1" && grep -q 'data-aged="' "$1"
}
js_ok() {   # board.js carries, applies, and WIRES both filter dimensions,
            # and builds the spine rail mapped to gabe commands
  grep -q 'closed30:' "$1" && grep -q 'aged:' "$1" \
    && grep -q 'F.closed30 || c.dataset.closed30' "$1" \
    && grep -q 'F.aged || c.dataset.aged' "$1" \
    && grep -q "key === 'closed'" "$1" && grep -q "F.closed30 = '1'" "$1" \
    && grep -q "key === 'aged'" "$1" && grep -q "F.aged = '1'" "$1" \
    && grep -q 'bnow-rail' "$1" && grep -q 'bnow-stage' "$1" \
    && grep -q "'/gabe-cc-update'" "$1" && grep -q "'/gabe-push'" "$1"
}

# --- SILENT: the shipped sources satisfy the contract ----------------------
gen_ok "$GEN" && ok || bad "silent: generator must emit data-closed30 + data-aged"
js_ok  "$JS"  && ok || bad "silent: board.js must carry/apply/wire closed30+aged and build the spine rail"
# the NOW pill must stay white-on-accent (the contrast fix — dark-ink-on-accent
# read as one indistinguishable block)
grep -A1 '\.bnow-tag{' "$CSS" | grep -q 'color:#fff' \
  && ok || bad "silent: NOW pill (.bnow-tag) must be white-on-accent"
# the CSS must style what the banner emits: current-stage chip + label rows
grep -q '\.bnow-stage\.now' "$CSS" && ok || bad "silent: CSS must style the lit spine stage (.bnow-stage.now)"
grep -q '\.bnow-lab' "$CSS"        && ok || bad "silent: CSS must style the banner labels (.bnow-lab)"
# the ▶ NOW banner links to the codebase-graph station — this beat's touched→blast IS
# what the station overlays (C2 derives it live from the same inflight, so the target
# is never honest-empty while the banner shows).
grep -q 'href="codebase-graph.html"' "$JS" && grep -q 'bnow-graph' "$JS" \
  && ok || bad "silent: the ▶ NOW banner must link to codebase-graph.html (.bnow-graph)"
grep -q '\.bnow-graph' "$CSS" && ok || bad "silent: CSS must style the ▶ NOW→graph link (.bnow-graph)"

# --- FIRE: drift on EITHER half is caught ----------------------------------
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

# a) generator drops the closed-30d attribute → the silent-KPI bug returns
sed 's/data-closed30="{closed30}" data-aged="{aged}" //' "$GEN" > "$T/gen.py"
gen_ok "$T/gen.py" && bad "fire: a generator missing data-closed30 must be caught" || ok

# b) board.js loses the closed30 filter dimension from F
sed "s/closed30: '', aged: '' };/};/" "$JS" > "$T/board.js"
js_ok "$T/board.js" && bad "fire: a board.js missing the closed30 filter must be caught" || ok

# c) board.js loses the spine-rail command map
sed "s#'/gabe-cc-update'#''#" "$JS" > "$T/board2.js"
js_ok "$T/board2.js" && bad "fire: a spine rail with no command map must be caught" || ok

echo "=================================="
echo "board battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
