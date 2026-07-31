#!/usr/bin/env bash
# Artifact-chrome fixture battery — the executable contract of
# skills/gabe-artifact/tools/verify-artifact-chrome.mjs.
#
# A gate that cannot fail is non-evidence (CLAUDE.md conventions). This proves
# the gate stays SILENT on the shipped kit and FIRES on each way an artifact
# can drift off the house rules: cog removed, column centred, roster options
# collapsed onto one face, selection not persisted.
#
# Hermetic: temp copies only, no network (the gate serves its own page on
# 127.0.0.1), cleans up after itself. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
KIT="$REPO/skills/gabe-artifact/assets/artifact-chrome.html"
GATE="$REPO/skills/gabe-artifact/tools/verify-artifact-chrome.mjs"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

[ -f "$KIT" ]  || { echo "⛔ missing kit: $KIT"; exit 2; }
[ -f "$GATE" ] || { echo "⛔ missing gate: $GATE"; exit 2; }

# mutate <out-name> <python-replacement-expression>
mutate(){
  local out="$TMP/$1"; shift
  python3 - "$KIT" "$out" "$@" <<'PY'
import sys
src, dst, old, new = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s = open(src, encoding="utf-8").read()
if old not in s:
    sys.exit("anchor missing: " + old[:60])
open(dst, "w", encoding="utf-8").write(s.replace(old, new, 1))
PY
}

run_gate(){ node "$GATE" "$1" >/dev/null 2>&1; echo $?; }

echo "artifact-chrome battery"

# ── 1 · SILENT on the shipped kit ──────────────────────────────────────────
if [ "$(run_gate "$KIT")" = "0" ]; then ok "shipped kit passes the gate"; else bad "shipped kit should pass"; fi

# ── 2 · FIRES when the cog is gone ─────────────────────────────────────────
mutate no-cog.html '<button class="af-cog" id="af-cog"' '<button class="af-cog" id="af-cog-renamed"'
if [ "$(run_gate "$TMP/no-cog.html")" != "0" ]; then ok "fires when the cog is missing"; else bad "missing cog not caught"; fi

# ── 3 · FIRES when the column is centred (H1 violation) ────────────────────
mutate centred.html 'margin: 0 auto 0 clamp(16px, 4vw, 56px);' 'margin: 0 auto;'
if [ "$(run_gate "$TMP/centred.html")" != "0" ]; then ok "fires when content is centred"; else bad "centred column not caught"; fi

# ── 4 · FIRES when two roster options render identically ───────────────────
mutate twins.html "stack: '\"Segoe UI\", sans-serif',  size: 16, track: -0.015" "stack: 'ui-monospace, monospace', size: 15, track: -0.025"
if [ "$(run_gate "$TMP/twins.html")" != "0" ]; then ok "fires when options collapse onto one face"; else bad "duplicate options not caught"; fi

# ── 5 · FIRES when the choice is not persisted ─────────────────────────────
mutate no-store.html 'var id = window.localStorage.getItem(STORE_KEY);' 'var id = null;'
if [ "$(run_gate "$TMP/no-store.html")" != "0" ]; then ok "fires when the selection is not remembered"; else bad "lost persistence not caught"; fi

echo "artifact-chrome: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
