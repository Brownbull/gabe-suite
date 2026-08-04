#!/usr/bin/env bash
# RED-ENTRY-GUARD — PreToolUse hook for Write|Edit|MultiEdit on source files.
# D7 (block lies, warn debts): source landing before the phase's failing cases exist is a
# SEQUENCING DEBT, not a lie — so this hook WARNS, never blocks. The lie (a ticked cell
# without evidence) stays plan-proof-guard's business.
# Fires when ALL of:
#   · .kdbp/PLAN.json exists (KDBP project)
#   · the current phase HAS a red cell in todo/in_progress (Red column adopted, red owed)
#   · the phase's cases record carries no enumerated skip:* code
#   · the write targets a SOURCE file — not .kdbp/, not docs/, not a test file (test writes
#     ARE the red work), not .claude/, not markdown
# Silent everywhere else. Fixture battery: tests/hooks/run.sh (red-entry section).
set -uo pipefail

[ -f ".kdbp/PLAN.json" ] || exit 0
input=$(cat)

fp=$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"//;s/"$//')
[ -n "$fp" ] || exit 0

case "$fp" in
  *".kdbp/"*|*"/docs/"*|*"/.claude/"*|*.md) exit 0 ;;
esac
# test files are the red beat's own workspace — never warn on them
if printf '%s' "$fp" | grep -qE '(^|/)tests?/|(^|/)test_[^/]+\.|\.(test|spec)\.[a-zA-Z]+$'; then
  exit 0
fi

# Debt detection needs a real JSON parse; without python3 stay silent — a wrong warn on a
# malformed read would train the operator to ignore the rail (this hook only warns, so
# silence here fails soft; plan-proof-guard's INERT warning covers the python3-missing case).
command -v python3 >/dev/null 2>&1 || exit 0

python3 - <<'PY' 2>/dev/null
import json, re, sys
try:
    p = json.load(open(".kdbp/PLAN.json"))
except Exception:
    sys.exit(0)  # malformed mirror is next.mjs's concern, not this rail's
cur = str(p.get("current_phase", ""))
for ph in p.get("phases", []) or []:
    if str(ph.get("id")) != cur:
        continue
    cells = ph.get("cells") or {}
    red = cells.get("red")
    if red not in ("todo", "in_progress"):
        break  # red done / skipped / column absent — nothing owed
    cases = (ph.get("cases") or "")
    if re.search(r"skip:[a-z-]+", cases):
        break  # enumerated skip is a recorded decision, not a debt
    print(f"[WARN] RED-ENTRY: phase {cur} Red is ⬜ — source edit before failing cases exist. "
          f"Run /gabe-red {cur} first (or record an enumerated skip:<code> in the Cases record). "
          "D7: debts warn; the red→green thread starts red.")
    break
PY
exit 0
