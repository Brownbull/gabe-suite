#!/usr/bin/env bash
# suite-presence battery — the project-local suite-adoption inventory.
#
# Proves the check FIRES on a broken/declared-but-missing part, stays SILENT on a
# non-suite project, and — critically — does NOT false-fire when a part is simply
# not adopted (the twin case: register absent + undeclared → info, exit 0). That
# false-fire is the trap that would make the check cry wolf on every project that
# never opted into a trial. Hermetic: synthetic fixtures under a temp dir.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SP="$REPO/scripts/suite-presence.py"

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

reg_wired() {  # $1 = project dir — a fully wired register
  mkdir -p "$1/.claude/output-styles"
  echo core  > "$1/.claude/register-core.md"
  echo style > "$1/.claude/output-styles/gabe.md"
  printf '{"hooks":{"UserPromptSubmit":[{"hooks":[{"command":"cat .claude/register-core.md"}]}]}}' \
    > "$1/.claude/settings.json"
}
kdbp_full() {  # $1 = project dir — a complete .kdbp + CLAUDE.md
  mkdir -p "$1/.kdbp"
  for f in BEHAVIOR.md VALUES.md PLAN.md; do echo x > "$1/.kdbp/$f"; done
  echo x > "$1/CLAUDE.md"
}

# ---- SILENT: a non-suite dir prints nothing, exit 0 ----
mkdir -p "$T/empty"
out=$(python3 "$SP" "$T/empty"); rc=$?
[ -z "$out" ] && [ "$rc" = 0 ] && ok || bad "silent: non-suite dir must be silent + exit 0 (rc=$rc)"

# ---- SILENT: a wired register reads wired, 0 gaps, exit 0 ----
mkdir -p "$T/reg"; reg_wired "$T/reg"
out=$(python3 "$SP" "$T/reg"); rc=$?
{ echo "$out" | grep -q "Register" && echo "$out" | grep -q "wired" && [ "$rc" = 0 ]; } \
  && ok || bad "silent: wired register → wired exit 0 (rc=$rc)"
echo "$out" | grep -q "0 gap(s)" && ok || bad "silent: wired register must report 0 gaps"

# ---- FIRE: register files present but the hook is NOT wired ----
mkdir -p "$T/nohook/.claude/output-styles"
echo core > "$T/nohook/.claude/register-core.md"
echo style > "$T/nohook/.claude/output-styles/gabe.md"
printf '{}' > "$T/nohook/.claude/settings.json"
out=$(python3 "$SP" "$T/nohook"); rc=$?
{ echo "$out" | grep -q "hook is NOT wired" && [ "$rc" = 1 ]; } \
  && ok || bad "fire: register files without the hook → gap exit 1 (rc=$rc)"

# ---- FIRE: register DECLARED adopted but the files are absent ----
mkdir -p "$T/declared/.claude"
printf '{"adopts":["register"]}' > "$T/declared/.claude/suite-adopts.json"
out=$(python3 "$SP" "$T/declared"); rc=$?
{ echo "$out" | grep -q "declared adopted" && [ "$rc" = 1 ]; } \
  && ok || bad "fire: declared-but-absent register → gap exit 1 (rc=$rc)"

# ---- FIRE: .kdbp present but a core file missing ----
mkdir -p "$T/kdbp/.kdbp"; echo x > "$T/kdbp/.kdbp/VALUES.md"; echo x > "$T/kdbp/.kdbp/PLAN.md"
echo x > "$T/kdbp/CLAUDE.md"
out=$(python3 "$SP" "$T/kdbp"); rc=$?
{ echo "$out" | grep -q "missing BEHAVIOR.md" && [ "$rc" = 1 ]; } \
  && ok || bad "fire: incomplete .kdbp → gap exit 1 (rc=$rc)"

# ---- NO FALSE FIRE: KDBP project without the register → info, exit 0 ----
# (the twin case — absence-by-design must NOT read as a gap)
kdbp_full "$T/twin"
out=$(python3 "$SP" "$T/twin"); rc=$?
{ echo "$out" | grep -q "not adopted" && [ "$rc" = 0 ]; } \
  && ok || bad "no-false-fire: twin without register → info exit 0 (rc=$rc)"
echo "$out" | grep -q "0 gap(s)" && ok || bad "no-false-fire: twin must report 0 gaps"

echo "=================================="
echo "suite-presence battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
