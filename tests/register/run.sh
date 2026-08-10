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
  "attention is the scarce resource"
  "the doable leads"
  "operator-felt cost"
  "Cap the sentence, not only the paragraph"
  "term per concept"
  "never re-narrates the plan"
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

# 4. core payload stays cheap (injected on EVERY prompt) — 5 rules now, cap raised
lines=$(wc -l < "$CORE")
[ "$lines" -le 18 ] \
  && ok "core payload $lines lines (cap 18)" \
  || bad "core payload $lines lines exceeds cap 18 — per-prompt cost creep"

# 5. hooks in settings.json point at the payload that exists
grep -qF 'register-core.md' "$ROOT/.claude/settings.json" \
  && ok "settings hooks reference the payload" \
  || bad "settings.json does not reference register-core.md"

# 6. register-lint: SILENT on a compliant message + FIRES per rule (P2 — each of the
#    checkable rules proven, not just one; the bulleted no-period voice stays clean)
LINT="$ROOT/scripts/register-lint.py"
tmpf() { local f; f=$(mktemp); printf '%b' "$1" > "$f"; echo "$f"; }
fires() { python3 "$LINT" "$1" 2>/dev/null | grep -q "$2"; }

G=$(tmpf '- doctor CLEAN across every battery and both twins\n- the sweep routes each flag to its board lane\n\nNOW: sweep arc done\nNEXT: land it (~2 files).\n')
python3 "$LINT" "$G" >/dev/null 2>&1 \
  && ok "lint stays SILENT on a compliant bulleted (period-less) message" \
  || bad "lint flags the register's own bulleted voice — false positive"

SC=$(tmpf 'This is a deliberately long run-on sentence that keeps going and going with clause after clause well past thirty separate words where the reader has surely lost the thread entirely by now indeed truly.\n')
fires "$SC" "⚠ sentence_cap" && ok "lint FIRES sentence_cap on a 30+ word sentence" || bad "sentence_cap cannot fire — non-evidence"

NX=$(tmpf 'Pushed.\n\nNEXT: run the doctor and then commit and then push and then open the PR.\n')
fires "$NX" "⚠ next_one" && ok "lint FIRES next_one on a multi-move NEXT" || bad "next_one cannot fire — non-evidence"

RC=$(tmpf 'All set here.\n\nHope this helps! Let me know if you need anything else.\n')
fires "$RC" "⚠ no_recap" && ok "lint FIRES no_recap on a closing pleasantry" || bad "no_recap cannot fire — non-evidence"

NN=$(tmpf "$(printf 'A long report clause here. %.0s' $(seq 1 30))")
fires "$NN" "⚠ now_next" && ok "lint FIRES now_next on a substantial message missing the close" || bad "now_next cannot fire — non-evidence"

rm -f "$G" "$SC" "$NX" "$RC" "$NN"

echo "register battery: $pass ok, $fail fail"
[ "$fail" -eq 0 ]
