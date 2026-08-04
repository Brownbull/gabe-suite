#!/usr/bin/env bash
# Canary for the Gabe Register (ponytail check-rule-copies pattern):
# pins invariant lines so a reword can never silently delete a rule.
# Mutation-proven — deletes an invariant from a COPY and requires the check to FAIL.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STYLE="$ROOT/.claude/output-styles/gabe.md"
CORE="$ROOT/.claude/register-core.md"
pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

INVARIANTS=(
  "attach its consequence or delete it"
  "changes the operator's next move goes first"
  "BEFORE executing"
  "BREAKS IF:"
  "A defer without a trigger is forbidden"
  "Drop the register for"
  "Lists cap at 5"
  "break the line when the point shifts"
  "NOT current on this stack"
  "Not expanded:"
  "No definitions mid-chain"
  "was → gets"
  "If ignored:"
  "repeat the actor's name"
)

missing_count(){ # $1 = file; prints how many invariants are absent
  local f="$1" miss=0 inv
  for inv in "${INVARIANTS[@]}"; do
    grep -qF "$inv" "$f" || miss=$((miss+1))
  done
  echo "$miss"
}

# 1. artifacts exist
[ -f "$STYLE" ] && ok "style file exists" || bad "style file missing: $STYLE"
[ -f "$CORE" ]  && ok "core payload exists" || bad "core payload missing: $CORE"

# 2. SILENT case: intact register carries every invariant
[ "$(missing_count "$STYLE")" = "0" ] \
  && ok "all ${#INVARIANTS[@]} invariants present (canary stays silent)" \
  || bad "invariant reworded/removed from register"

# 3. FIRE case: mutated copy must trip the canary
TMP="$(mktemp)"
grep -vF "A defer without a trigger is forbidden" "$STYLE" > "$TMP"
[ "$(missing_count "$TMP")" != "0" ] \
  && ok "canary FIRES on mutated copy" \
  || bad "canary cannot fail — non-evidence"
rm -f "$TMP"

# 4. core payload stays cheap (injected on EVERY prompt)
lines=$(wc -l < "$CORE")
[ "$lines" -le 14 ] \
  && ok "core payload $lines lines (cap 14)" \
  || bad "core payload $lines lines exceeds cap 14 — per-prompt cost creep"

# 5. hooks in settings.json point at the payload that exists
grep -qF 'register-core.md' "$ROOT/.claude/settings.json" \
  && ok "settings hooks reference the payload" \
  || bad "settings.json does not reference register-core.md"

echo "register battery: $pass ok, $fail fail"
[ "$fail" -eq 0 ]
