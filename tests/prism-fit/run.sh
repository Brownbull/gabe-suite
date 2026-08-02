#!/usr/bin/env bash
# gabe-imagine FIT battery — the executable contract of
# skills/gabe-imagine/tools/check-prism-fit.mjs.
#
# The disk target's whole trade is that the canvas gives up its column. This
# battery holds the four ways that trade goes wrong, each with a case that FIRES
# and the compliant fixture that stays SILENT — a checker that cannot fail is
# non-evidence.
#
# Provenance worth keeping: the gate found three real defects on its first runs —
# floor text authored at 10-11px (under the legibility floor before any scaling),
# a fit box that measured its container instead of its drawing, and doc-page
# images with no max-width that scrolled the page body sideways. All three would
# have shipped.
#
# Hermetic: temp copies only; the fixture inlines everything the gate measures.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GATE="$REPO/skills/gabe-imagine/tools/check-prism-fit.mjs"
FIX="$REPO/tests/prism-fit/fixtures/fit-ok.html"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

[ -f "$GATE" ] || { echo "⛔ missing gate: $GATE"; exit 2; }
[ -f "$FIX" ]  || { echo "⛔ missing fixture: $FIX"; exit 2; }

# A stale anchor aborts rather than reporting green: a mutation that matched
# nothing makes the gate "fire" on an unchanged file, and the case proves nothing.
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

echo "prism-fit battery"

# ── 1 · SILENT on a page that honours the width contract ───────────────────
if [ "$(run_gate "$FIX")" = "0" ]; then ok "a compliant page passes"; else bad "compliant fixture should pass"; cat "$TMP/out"; fi

# ── 2 · FIRES when PROSE takes the canvas's freedom ────────────────────────
# The carry-forward rule in one mutation: drop the 76ch cap inside the stage.
mutate prose-uncapped.html '  .prismstage p, .prismstage li { max-width:76ch; }' '  .prismstage p, .prismstage li { max-width:none; }'
if [ "$(run_gate "$TMP/prose-uncapped.html")" != "0" ]; then
  grep -q "prose took the canvas" "$TMP/out" && ok "fires when prose is uncapped inside the canvas" \
    || bad "failed, but not on the prose clause"
else bad "uncapped prose not caught"; fi

# ── 3 · FIRES when scaling breaches the 12px legibility floor ──────────────
# 13px authored x 0.92 = 12px exactly. Drop the authored size to 12 and the
# same scale lands at 11.04px, which is under the floor.
mutate text-too-small.html '  .pf-recipe { display:grid; grid-template-columns:27px 1fr; gap:1px 6px; font-size:13px; }' '  .pf-recipe { display:grid; grid-template-columns:27px 1fr; gap:1px 6px; font-size:12px; }'
if [ "$(run_gate "$TMP/text-too-small.html")" != "0" ]; then
  grep -q "scaled below 12px" "$TMP/out" && ok "fires when a floor scales under the 12px legibility floor" \
    || bad "failed, but not on the legibility clause"
else bad "sub-floor text not caught"; fi

# ── 4 · FIRES when the PAGE scrolls sideways instead of the box ────────────
# The exact shape of the doc-page image defect this gate found: something inside
# the stage is wider than the viewport and nothing clips it.
mutate page-spills.html '      <p class="pf-legend">running — built and proven · ghost — not built yet</p>' '      <div style="width:2400px;height:8px;background:#ccc"></div>
      <p class="pf-legend">running — built and proven · ghost — not built yet</p>'
if [ "$(run_gate "$TMP/page-spills.html")" != "0" ]; then
  grep -q "PAGE scrolls sideways" "$TMP/out" && ok "fires when the page body scrolls sideways" \
    || bad "failed, but not on the body-scroll clause"
else bad "page-level horizontal overflow not caught"; fi

# ── 5 · FIRES when an overflowing floor has no scrollbar of its own ────────
# Scale-to-fit-then-scroll needs the second half to exist. Take the overflow
# away from the box and the drawing is simply cut off.
mutate no-box-scroll.html '  .pfwrap { overflow-x:auto; overflow-y:hidden; }' '  .pfwrap { overflow-x:hidden; overflow-y:hidden; }'
if [ "$(run_gate "$TMP/no-box-scroll.html")" != "0" ]; then
  grep -q "no scrollbar" "$TMP/out" && ok "fires when an overflowing floor cannot be scrolled" \
    || bad "failed, but not on the box-scroll clause"
else bad "unscrollable overflowing floor not caught"; fi

# ── 6 · FIRES on a page error, so a broken runtime never reads as a pass ───
mutate page-error.html '</body>' '<script>window.addEventListener("load",function(){ null.boom; });</script>
</body>'
if [ "$(run_gate "$TMP/page-error.html")" != "0" ]; then
  grep -q "page errors" "$TMP/out" && ok "fires on a page error" || bad "failed, but not on the page-error clause"
else bad "page error not caught"; fi

echo "prism-fit: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
