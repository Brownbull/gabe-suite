#!/usr/bin/env bash
# docsite-staleness fixture battery — the executable contract of
# scripts/checkers/docsite-staleness.sh.
#
# This check guards a false-green: when the docs merged into the command center
# (2026-07-31) the generated pages moved from docs/site/ to docs/site/center/,
# and a check left pointing at the old tree would have compared all 13 sources
# against absent files and reported CLEAN forever. Every clause is pinned here
# with a fixture that FIRES and one that stays SILENT — including the empty-glob
# case, which is how a checker passes by looking at nothing.
#
# Hermetic: builds throwaway repo skeletons in a temp dir. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
CHECK="$REPO/scripts/checkers/docsite-staleness.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

[ -f "$CHECK" ] || { echo "⛔ missing checker: $CHECK"; exit 2; }

# skeleton <name> — a repo with two sources and two current pages
skeleton() {
  local root="$TMP/$1"
  mkdir -p "$root/docs/src" "$root/docs/site/center"
  printf '# One\n' > "$root/docs/src/kdbp.md"
  printf '# Hub\n'  > "$root/docs/src/hub.md"
  sleep 0.02
  printf '<html>kdbp</html>' > "$root/docs/site/center/kdbp.html"
  printf '<html>docs</html>' > "$root/docs/site/center/docs.html"
  echo "$root"
}

run() { bash "$CHECK" "$1" >"$TMP/out" 2>&1; echo $?; }

echo "docsite-staleness battery"

# ── 1 · SILENT when every page exists and is current ───────────────────────
r=$(skeleton clean)
if [ "$(run "$r")" = "0" ]; then ok "a current site passes"; else bad "current site should pass"; cat "$TMP/out"; fi

# ── 2 · FIRES when a source is newer than its page ─────────────────────────
r=$(skeleton stale); sleep 0.02; touch "$r/docs/src/kdbp.md"
if [ "$(run "$r")" != "0" ] && grep -q "stale: docs/src/kdbp.md" "$TMP/out"; then
  ok "fires when a source is newer than its page"
else bad "stale source not caught"; fi

# ── 3 · FIRES when a source has no page at all ─────────────────────────────
r=$(skeleton missing); rm "$r/docs/site/center/kdbp.html"
if [ "$(run "$r")" != "0" ] && grep -q "no generated page for docs/src/kdbp.md" "$TMP/out"; then
  ok "fires when a source has no page"
else bad "missing page not caught"; fi

# ── 4 · hub.md is checked against docs.html, not a hub.html nobody emits ───
# The pre-merge bug (M13) in its new form: get this mapping wrong and the front
# page of the docs can never be reported stale.
r=$(skeleton hub); rm "$r/docs/site/center/docs.html"
if [ "$(run "$r")" != "0" ] && grep -q "no generated page for docs/src/hub.md" "$TMP/out"; then
  ok "hub.md maps to docs.html"
else bad "hub.md → docs.html mapping not enforced"; fi

# ── 5 · FIRES when the OUTPUT TREE has moved out from under the check ──────
# The exact false-green this extraction exists to prevent: pages present, but
# in the pre-merge location the check no longer looks at.
r=$(skeleton moved)
mkdir -p "$r/docs/site"
mv "$r/docs/site/center/"*.html "$r/docs/site/"
rmdir "$r/docs/site/center"
if [ "$(run "$r")" != "0" ]; then ok "fires when the pages sit in the pre-merge tree"; else bad "moved output tree not caught — this is the false-green"; fi

# ── 6 · an EMPTY source dir is a failure, not a pass ───────────────────────
r="$TMP/empty"; mkdir -p "$r/docs/src" "$r/docs/site/center"
if [ "$(run "$r")" != "0" ] && grep -q "holds no markdown" "$TMP/out"; then
  ok "an empty docs/src reports that nothing was verified"
else bad "empty source dir passed green — a checker that looked at nothing"; fi

# ── 7 · a repo with no docs/src at all is legitimately not applicable ──────
r="$TMP/nodocs"; mkdir -p "$r"
if [ "$(run "$r")" = "0" ] && grep -q "nothing to check" "$TMP/out"; then
  ok "a repo with no docs/src says so and passes"
else bad "absent docs/src mishandled"; fi

echo "docsite-staleness: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
