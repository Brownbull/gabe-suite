#!/usr/bin/env bash
# gabe-imagine RENDER-PROBE battery — the executable contract of
# skills/gabe-imagine/tools/probe-render.mjs.
#
# The probe exists because the compound-interest one-shot shipped a simulator
# with every static gate green and its runtime never proven. Each clause of the
# probe's contract gets a mutation that FIRES and the compliant fixture that
# stays SILENT — a checker that cannot fail is non-evidence.
#
# Hermetic: temp copies only; the probe serves each page on 127.0.0.1 itself.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GATE="$REPO/skills/gabe-imagine/tools/probe-render.mjs"
FIX="$REPO/tests/prism-probe/fixtures/probe-ok.html"
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
fired_on(){ grep -q "FAIL" "$TMP/out" && grep -q "$1" "$TMP/out"; }

echo "prism render-probe battery"

# ── 1 · SILENT on the compliant fixture ────────────────────────────────────
if [ "$(run_gate "$FIX")" = "0" ]; then ok "a compliant page passes"
else bad "compliant fixture should pass"; cat "$TMP/out"; fi

# ── 2 · FIRES when the authored script throws ──────────────────────────────
mutate script-throws.html '  "use strict";' '  "use strict"; throw new Error("boom");'
if [ "$(run_gate "$TMP/script-throws.html")" != "0" ] && fired_on "errors on load"; then
  ok "fires when the authored script throws"
else bad "a throwing script must fail the error clause"; cat "$TMP/out"; fi

# ── 3 · FIRES when a data-fx slug never registers ──────────────────────────
mutate no-registry.html '  window.FXREPLAY = { fxa: function () {} };' '  window.FXREPLAY = {};'
if [ "$(run_gate "$TMP/no-registry.html")" != "0" ] && fired_on "FXREPLAY"; then
  ok "fires when a declared data-fx slug is not in FXREPLAY"
else bad "an unregistered data-fx slug must fail the registry clause"; cat "$TMP/out"; fi

# ── 4 · FIRES when a data-probe root stays empty ───────────────────────────
mutate empty-root.html '  document.getElementById("root").appendChild(document.createElement("span"));' ''
if [ "$(run_gate "$TMP/empty-root.html")" != "0" ] && fired_on "non-empty"; then
  ok "fires when a data-probe root renders empty"
else bad "an empty declared root must fail the non-empty clause"; cat "$TMP/out"; fi

# ── 5 · FIRES when a readout misses its expected value ─────────────────────
mutate wrong-value.html '  document.getElementById("read").textContent = "answer 42";' '  document.getElementById("read").textContent = "answer 41";'
if [ "$(run_gate "$TMP/wrong-value.html")" != "0" ] && fired_on "holds its value"; then
  ok "fires when a data-probe-expect readout holds the wrong value"
else bad "a wrong readout must fail the expect clause"; cat "$TMP/out"; fi

# ── 6 · FIRES on a dead input listener ─────────────────────────────────────
mutate dead-listener.html '  document.getElementById("n").addEventListener("input", calc);' ''
if [ "$(run_gate "$TMP/dead-listener.html")" != "0" ] && fired_on "moves its readouts"; then
  ok "fires when an input no longer moves its readouts"
else bad "a dead listener must fail the react clause"; cat "$TMP/out"; fi

# ── 7 · FIRES on a dead hover ──────────────────────────────────────────────
mutate dead-hover.html '  document.getElementById("hov").addEventListener("mouseenter", function () {' '  document.getElementById("hov").addEventListener("__never", function () {'
if [ "$(run_gate "$TMP/dead-hover.html")" != "0" ] && fired_on "hover"; then
  ok "fires when hover changes nothing"
else bad "a dead hover must fail the hover clause"; cat "$TMP/out"; fi

# ── 8 · FIRES on an authored script with NOTHING declared ──────────────────
# Session A's gap verbatim: interactive page, zero hooks, every gate green.
python3 - "$FIX" "$TMP/no-hooks.html" <<'PY'
import re, sys
s = open(sys.argv[1], encoding="utf-8").read()
out = re.sub(r' data-probe-(?:expect|hover|react|out)="[^"]*"| data-probe-(?:react|out)\b| data-probe\b', '', s)
if out == s:
    sys.exit("no data-probe attributes found to strip")
open(sys.argv[2], "w", encoding="utf-8").write(out)
PY
[ $? -ne 0 ] && { echo "  FAIL: hook-strip mutation not built"; exit 2; }
if [ "$(run_gate "$TMP/no-hooks.html")" != "0" ] && fired_on "declares probe hooks"; then
  ok "fires on an authored script that declares no hooks"
else bad "an undeclared interactive page must fail loudly, not pass vacuously"; cat "$TMP/out"; fi

# ── 8b · FIRES when a readout is reachable by NO input ─────────────────────
# Point #m's effect at #out instead of #out2: every input still moves ≥1
# readout, but #out2 never moves under any input — the union clause fires.
mutate orphan-readout.html 'document.getElementById("out2").textContent = "shifted " + (m + 1);' 'document.getElementById("out").textContent = "shifted " + (m + 1);'
if [ "$(run_gate "$TMP/orphan-readout.html")" != "0" ] && fired_on "no input moves"; then
  ok "fires when a declared readout is moved by no input"
else bad "an unreachable readout must fail the union clause"; cat "$TMP/out"; fi

# ── 9 · SILENT on generator chrome: a mermaid.initialize-only page ─────────
# The docsite generator emits this exact call on diagram pages; it is chrome,
# not an authored component, and must not be forced to declare hooks.
cat > "$TMP/mermaid-only.html" <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>m</title></head>
<body><div class="pfwrap">a diagram page</div>
<script src="data:text/javascript,window.mermaid={initialize:function(){}}"></script>
<script>mermaid.initialize({startOnLoad: false});</script>
</body></html>
HTML
if [ "$(run_gate "$TMP/mermaid-only.html")" = "0" ]; then
  ok "a mermaid.initialize-only page passes without hooks"
else bad "generator diagram chrome must not demand probe hooks"; cat "$TMP/out"; fi

echo ""
echo "prism-probe battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
