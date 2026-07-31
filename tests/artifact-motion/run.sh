#!/usr/bin/env bash
# Motion-gate fixture battery — the executable contract of
# skills/gabe-artifact/tools/verify-motion.mjs.
#
# H4 says a page's animation must be replayable, pausable from the cog, and
# safe under reduced motion. Until now nothing proved the GATE could catch a
# page that broke any of those: the tool was hardcoded to its own catalog file
# and could not be pointed at an artifact at all, so every "motion verified"
# claim rested on a run that never happened. This battery pins each obligation
# with a fixture that FIRES and one that stays SILENT.
#
# Hermetic: temp copies only; the gate serves its own page on 127.0.0.1.
# Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GATE="$REPO/skills/gabe-artifact/tools/verify-motion.mjs"
FIX="$REPO/tests/artifact-motion/fixtures/motion-ok.html"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

[ -f "$GATE" ] || { echo "⛔ missing gate: $GATE"; exit 2; }
[ -f "$FIX" ]  || { echo "⛔ missing fixture: $FIX"; exit 2; }

# A stale anchor must abort, never skip: a fixture that was not built makes the
# gate "fire" on a missing file, and the case reports green proving nothing.
mutate(){
  local out="$TMP/$1"; shift
  if ! python3 - "$FIX" "$out" "$@" <<'PY'
import sys
src, dst, old, new = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s = open(src, encoding="utf-8").read()
if old not in s:
    sys.exit("anchor missing: " + old[:70])
open(dst, "w", encoding="utf-8").write(s.replace(old, new, 1))
PY
  then
    echo "  FAIL: mutation anchor no longer matches the fixture — not built"
    exit 2
  fi
}

run_gate(){ node "$GATE" "$1" >"$TMP/out" 2>&1; echo $?; }

echo "artifact-motion battery"

# ── 1 · SILENT on a fixture that honours H4 in full ────────────────────────
if [ "$(run_gate "$FIX")" = "0" ]; then ok "a compliant page passes the gate"; else bad "compliant fixture should pass"; cat "$TMP/out"; fi

# ── 2 · FIRES when the animation never moves ───────────────────────────────
# The loop is removed; replay redraws the same frame forever.
mutate frozen.html '    loop = setInterval(function () {' '    if (0) setInterval(function () {'
if [ "$(run_gate "$TMP/frozen.html")" != "0" ]; then ok "fires when an animation is frozen after replay"; else bad "frozen animation not caught"; fi

# ── 3 · FIRES when the cog pause does not reach a JS-driven animation ──────
# Exactly the defect found in the shipped kit on 2026-07-31: CSS and SMIL froze,
# setInterval kept running, and nothing reported it.
mutate unpausable.html '    if (window.__rebuildMotion) window.__rebuildMotion();' '    /* pause never reaches JS animation */'
if [ "$(run_gate "$TMP/unpausable.html")" != "0" ]; then ok "fires when Paused does not freeze a JS animation"; else bad "unpausable animation not caught"; fi

# ── 4 · FIRES when reduced motion renders an EMPTY stage ───────────────────
# The start state is the trap: a reader with reduced motion must get the
# finished frame, never a blank one.
mutate empty-reduced.html 'if (reduced || !on) { cells.forEach(function (c) { c.setAttribute("data-hot", "true"); }); return; }' \
'if (reduced || !on) { document.getElementById("cells").innerHTML = ""; return; }'
if [ "$(run_gate "$TMP/empty-reduced.html")" != "0" ]; then ok "fires when reduced motion leaves an empty stage"; else bad "empty reduced-motion stage not caught"; fi

# ── 5 · a page with NO animation reports SKIP, loudly, and does not pass green ─
# "Nothing to verify" and "verified" must never read the same.
cat > "$TMP/still.html" <<'HTML'
<title>still page</title><div class="artifact-page"><p>No animation here.</p></div>
HTML
code=$(run_gate "$TMP/still.html")
if [ "$code" = "0" ] && grep -q "SKIP  no animation found" "$TMP/out"; then
  ok "a still page reports SKIP rather than a silent pass"
else
  bad "still page: expected exit 0 with a loud SKIP (got exit $code)"
fi

# ── 6 · the gate refuses a page whose cog cannot pause ─────────────────────
mutate no-cog.html '<div class="af-group" role="radiogroup" aria-label="Motion" id="af-motion"></div>' \
'<div class="af-group" role="radiogroup" aria-label="Motion" id="af-motion-renamed"></div>'
node "$GATE" "$TMP/no-cog.html" >"$TMP/out" 2>&1
if grep -q "SKIP  cog Motion group absent" "$TMP/out"; then ok "names the missing cog Motion group instead of assuming it passed"; else bad "absent cog group not reported"; fi

echo "artifact-motion: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
