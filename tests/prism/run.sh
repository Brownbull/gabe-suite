#!/usr/bin/env bash
# gabe-imagine contract battery — the executable contract of
# skills/gabe-imagine/tools/verify-prism.mjs.
#
# The skill's whole claim is that a floor says more than a concept map. Each
# clause of that claim gets a fixture that FIRES and one that stays SILENT, so
# the gate is evidence rather than decoration.
#
# Hermetic: temp copies only; the gate serves its own page on 127.0.0.1.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GATE="$REPO/skills/gabe-imagine/tools/verify-prism.mjs"
FIX="$REPO/tests/prism/fixtures/floor-ok.html"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

[ -f "$GATE" ] || { echo "⛔ missing gate: $GATE"; exit 2; }
[ -f "$FIX" ]  || { echo "⛔ missing fixture: $FIX"; exit 2; }

# A stale anchor aborts: a fixture that was never built makes the gate "fire" on
# a missing file, and the case reports green while proving nothing.
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

echo "prism battery"

# ── 1 · SILENT on a floor that honours the contract ────────────────────────
if [ "$(run_gate "$FIX")" = "0" ]; then ok "a compliant floor passes"; else bad "compliant fixture should pass"; cat "$TMP/out"; fi

# ── 2 · FIRES on an unnamed payload (P1) ───────────────────────────────────
mutate no-payload.html 'data-in="body html" data-out="token records"' 'data-out="token records"'
if [ "$(run_gate "$TMP/no-payload.html")" != "0" ]; then ok "fires when a stage does not name its input"; else bad "unnamed payload not caught"; fi

# ── 3 · FIRES when a stage produces what it consumed ───────────────────────
mutate inert.html 'data-in="markdown with tokens" data-out="body html"' 'data-in="body html" data-out="body html"'
if [ "$(run_gate "$TMP/inert.html")" != "0" ]; then ok "fires when a stage does nothing"; else bad "inert stage not caught"; fi

# ── 4 · FIRES when the node carries no number ──────────────────────────────
mutate no-number.html 'data-num="472 lines"' 'data-num=""'
if [ "$(run_gate "$TMP/no-number.html")" != "0" ]; then ok "fires when a stage carries no measured number"; else bad "numberless stage not caught"; fi

# ── 5 · FIRES on a state outside the four (P2) ─────────────────────────────
mutate bad-state.html 'data-state="ghost"' 'data-state="pending"'
if [ "$(run_gate "$TMP/bad-state.html")" != "0" ]; then ok "fires on a state outside the vocabulary"; else bad "illegal state not caught"; fi

# ── 6 · FIRES when a state is coloured but never legended ──────────────────
mutate no-legend.html '<p class="legend">running — built and proven · ghost — not built yet · unpowered — no fixture proves it can fail · broken — claims success it did not earn</p>' \
'<p class="legend">the floor</p>'
if [ "$(run_gate "$TMP/no-legend.html")" != "0" ]; then ok "fires when a state is used but never explained"; else bad "unlegended state not caught"; fi

# ── 7 · FIRES when a gate is also a stage (P3 register rule) ───────────────
mutate gate-stage.html '<span class="node gate" data-node="crawl gate" data-gate data-state="unpowered">' \
'<span class="node gate" data-node="crawl gate" data-gate data-in="pages" data-out="pages" data-state="unpowered">'
if [ "$(run_gate "$TMP/gate-stage.html")" != "0" ]; then ok "fires when a gate is drawn as a stage"; else bad "gate/stage conflation not caught"; fi

# ── 8 · FIRES when a clickable cell opens nothing ──────────────────────────
mutate empty-detail.html '<div class="detail" id="d-ext">extractor — the one new generator the merge needs; scans rendered text for 8 token classes.</div>' \
'<div class="detail" id="d-ext"></div>'
if [ "$(run_gate "$TMP/empty-detail.html")" != "0" ]; then ok "fires when an inspectable cell opens an empty panel"; else bad "empty detail panel not caught"; fi

# ── 9 · FIRES when the payload never changes identity ──────────────────────
mutate one-payload.html 'data-in="authored prose" data-out="markdown with tokens"' 'data-in="body html" data-out="body html"'
if [ "$(run_gate "$TMP/one-payload.html")" != "0" ]; then ok "fires when nothing is actually produced"; else bad "static payload not caught"; fi

# ── 10 · an unmarked page reports SKIP, loudly, and does not pass green ────
cat > "$TMP/plain.html" <<'HTML'
<title>plain</title><div class="artifact-page"><p>Just prose here.</p></div>
HTML
code=$(run_gate "$TMP/plain.html")
if [ "$code" = "0" ] && grep -q "SKIP  no \[data-prism\] container" "$TMP/out"; then
  ok "an unmarked page reports SKIP rather than a silent pass"
else
  bad "unmarked page: expected exit 0 with a loud SKIP (got exit $code)"
fi

echo "prism: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
