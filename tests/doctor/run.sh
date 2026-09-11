#!/usr/bin/env bash
# suite-doctor fixture battery — the executable contract of scripts/suite-doctor.sh, the repo's TOP-LEVEL gate.
#
# The doctor enforces CLAUDE.md's fixture rule on every other checker ("a checker that cannot be shown to fail is
# not evidence") and was, until 2026-09-10, the largest violation of it: nothing proved any of its invariants could
# FIRE. This battery proves five of them FIRE and that a clean tree stays SILENT — hermetically: the WORKING TREE's
# tracked files are copied to a temp repo (so the doctor under test is the one you just edited), `install.sh` lands
# that copy under a FAKE $HOME, and the doctor compares the two. GABE_DOCTOR_NO_BATTERIES=1 skips the G3 sweep (the
# sweep is every other battery's job, and would recurse into this one); the skip must be LOUD — a case pins that.
#   FIRE    — install byte parity (missing from install · differs) · SKILL.md ⇄ CLAUDE.md version drift ·
#             an UNPARSEABLE version stanza · the (N skills) count claim
#   SILENT  — a freshly installed copy of the tree reads CLEAN, exit 0, with the sweep-skipped INFO line printed
# Cost ≈ 20 s (one install + six doctor runs at ~2 s each). Exit 0 = all pass.
set -u
cd "$(dirname "$0")/../.."
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/repo" "$T/home"
# The working tree's TRACKED files (index = staged deletions already gone; an unstaged deletion is skipped, never fatal).
git ls-files -z | tar --null -T - -cf - --ignore-failed-read 2>/dev/null | tar -x -C "$T/repo"
[ -f "$T/repo/scripts/suite-doctor.sh" ] && [ -f "$T/repo/install.sh" ] && ok || { bad "fixture: the working tree did not copy"; echo "doctor battery: $pass passed, $fail failed"; exit 1; }
( cd "$T/repo" && HOME="$T/home" bash ./install.sh >"$T/install.out" 2>&1 ) && grep -q "Installed [0-9]*/[0-9]* skills" "$T/install.out" \
  && ok || { bad "fixture: install.sh into the fake HOME"; tail -5 "$T/install.out"; echo "doctor battery: $pass passed, $fail failed"; exit 1; }

doctor() { HOME="$T/home" GABE_DOCTOR_NO_BATTERIES=1 bash "$T/repo/scripts/suite-doctor.sh" >"$T/$1.out" 2>&1; echo $?; }

# ── SILENT: the installed copy of the tree is CLEAN, and the skipped sweep says so ──
[ "$(doctor clean)" = 0 ] && grep -q "suite-doctor: CLEAN" "$T/clean.out" \
  && ok || { bad "SILENT: a freshly installed copy must read CLEAN (exit 0)"; grep -v "^  INFO" "$T/clean.out" | head -8; }
grep -q "battery sweep SKIPPED (GABE_DOCTOR_NO_BATTERIES=1) — not a full CLEAN" "$T/clean.out" \
  && ok || bad "SILENT is LOUD: the skipped sweep must print its INFO line (a CLEAN without batteries is not a full CLEAN)"

# ── FIRE: version drift — SKILL.md says one thing, the CLAUDE.md row another ──
SK="$T/repo/skills/gabe-map/SKILL.md"; cp "$SK" "$T/skill.bak"
sed -i 's/^  version: [0-9.]*$/  version: 9.9.9/' "$SK"
[ "$(doctor ver)" = 1 ] && grep -q "version drift: gabe-map SKILL.md=9.9.9 vs CLAUDE.md=" "$T/ver.out" \
  && ok || { bad "FIRE: version drift names the skill and both numbers, exit 1"; grep DRIFT "$T/ver.out" | head -3; }

# ── FIRE: an UNPARSEABLE version stanza is itself drift (M31 — the old sed skipped it silently) ──
sed -i 's/^  version: 9\.9\.9$/version: 9.9.9/' "$SK"
[ "$(doctor unparse)" = 1 ] && grep -q "unparseable version frontmatter: gabe-map" "$T/unparse.out" \
  && ok || { bad "FIRE: a version line at the wrong indent is reported as UNPARSEABLE, never skipped"; grep DRIFT "$T/unparse.out" | head -3; }
cp "$T/skill.bak" "$SK"

# ── FIRE: the (N skills) count claim in CLAUDE.md drifts from skills/gabe-*/ ──
N=$(ls -d "$T/repo"/skills/gabe-*/ | wc -l); cp "$T/repo/CLAUDE.md" "$T/claude.bak"
sed -i "s/($N skills)/($((N+1)) skills)/" "$T/repo/CLAUDE.md"
[ "$(doctor count)" = 1 ] && grep -q "CLAUDE.md claims ($((N+1)) skills) but skills/gabe-\*/ has $N" "$T/count.out" \
  && ok || { bad "FIRE: the skill-count claim is checked against the directory truth"; grep DRIFT "$T/count.out" | head -3; }
cp "$T/claude.bak" "$T/repo/CLAUDE.md"

# ── FIRE: install byte parity — a file missing from the install, then one that differs ──
IN="$T/home/.claude/skills/gabe-red/SKILL.md"; cp "$IN" "$T/inst.bak"
rm -f "$IN"
[ "$(doctor missing)" = 1 ] && grep -q "missing from install: .*skills/gabe-red/SKILL.md" "$T/missing.out" \
  && ok || { bad "FIRE: a file the repo ships that the install lacks is named"; grep DRIFT "$T/missing.out" | head -3; }
cp "$T/inst.bak" "$IN"; echo "# patched in place" >>"$IN"
[ "$(doctor differs)" = 1 ] && grep -q "differs: .*skills/gabe-red/SKILL.md" "$T/differs.out" \
  && ok || { bad "FIRE: an install patched in place reads as 'differs' (never patch ~/.claude in place)"; grep DRIFT "$T/differs.out" | head -3; }
cp "$T/inst.bak" "$IN"

# ── SILENT again: every mutation restored → CLEAN (the restores above are real, not assumed) ──
[ "$(doctor clean2)" = 0 ] && ok || { bad "SILENT: after restoring every mutation the copy must read CLEAN again"; grep DRIFT "$T/clean2.out" | head -5; }

echo "doctor battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
