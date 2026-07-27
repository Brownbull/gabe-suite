#!/usr/bin/env bash
# Battery for the Gabe Suite's own command center — the board's card rules and
# the center's link gate.
#
#   bash docs/center/tests/run.sh          exit 0 all green · 1 any failure
#
# It lives under tests/ so scripts/suite-doctor.sh's G3 sweep picks it up: the
# doctor globs `tests/*/run.sh` and fails the whole run if any battery is red.
# No doctor edit was needed — the glob enrols it automatically.
#
# EVERY RULE IS PROVEN BOTH WAYS. A checker that cannot fail is non-evidence, so
# each rule has a fixture that makes it FIRE and one that keeps it SILENT. The
# fixtures are built hermetically into a temp dir; nothing touches the real repo.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
GEN="$REPO/docs/center/generators"
pass=0; fail=0

ok()   { pass=$((pass+1)); }
bad()  { fail=$((fail+1)); printf '  FAIL  %s\n' "$1"; }
check(){ if [ "$2" = "$3" ]; then ok; else bad "$1 — expected [$3] got [$2]"; fi; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---------------------------------------------------------- roster gate
# _suite_data.py resolves a skill's group with beats.get(name, "cross-cutting"),
# so a skill missing from the config is SILENTLY relabelled rather than flagged.
# Adding gabe-pulse hit exactly that and nothing reported it (2026-07-26).
roster_fixture() {                 # roster_fixture <dir> <declared…>
  local d="$1"; shift
  mkdir -p "$d/skills"
  python3 - "$d/cfg.json" "$@" <<'PY'
import json, sys
out, names = sys.argv[1], sys.argv[2:]
json.dump({"paths": {"center": "site"},
           "beats": [{"slug": "satellites", "skills": list(names)}]},
          open(out, "w"))
PY
}
roster_run() {                     # roster_run <dir>
  python3 "$GEN/check_suite_center.py" --roster-only \
    --config "$1/cfg.json" --skills-dir "$1/skills" > "$1/out" 2>&1
  echo $?
}

# SILENT — config and disk agree
R="$TMP/roster-ok"; roster_fixture "$R" gabe-alpha gabe-beta
mkdir -p "$R/skills/gabe-alpha" "$R/skills/gabe-beta"
check "roster: matching config and disk stays SILENT" "$(roster_run "$R")" "0"

# FIRE — on disk, in no group (the gabe-pulse case)
R="$TMP/roster-unlisted"; roster_fixture "$R" gabe-alpha
mkdir -p "$R/skills/gabe-alpha" "$R/skills/gabe-orphan"
check "roster: unlisted skill FIREs" "$(roster_run "$R")" "1"
grep -q "gabe-orphan is in no beat group" "$R/out" \
  && ok || bad "roster: unlisted skill must be named, and the silent relabel explained"

# FIRE — declared but deleted (an archived skill still in the estate)
R="$TMP/roster-ghost"; roster_fixture "$R" gabe-alpha gabe-ghost
mkdir -p "$R/skills/gabe-alpha"
check "roster: declared-but-absent skill FIREs" "$(roster_run "$R")" "1"
grep -q "gabe-ghost is declared" "$R/out" \
  && ok || bad "roster: ghost skill must be named"

# FIRE — declared in two groups
R="$TMP/roster-dup"; mkdir -p "$R/skills/gabe-alpha"
python3 - "$R/cfg.json" <<'PY'
import json, sys
json.dump({"paths": {"center": "site"},
           "beats": [{"slug": "satellites", "skills": ["gabe-alpha"]},
                     {"slug": "cross-cutting", "skills": ["gabe-alpha"]}]},
          open(sys.argv[1], "w"))
PY
check "roster: duplicate declaration FIREs" "$(roster_run "$R")" "1"
grep -q "declared in 2 groups" "$R/out" \
  && ok || bad "roster: duplicate must name both groups"

# the REAL repo must be clean — this is the assertion that would have caught
# gabe-pulse before the center was ever regenerated
check "roster: this repo is complete" \
  "$(python3 "$GEN/check_suite_center.py" --roster-only >/dev/null 2>&1; echo $?)" "0"

# ---------------------------------------------------------------- fixtures

mkfixture() {                      # mkfixture <dir> <trim-status> <backlog-state>
  local d="$1" trim="$2" state="$3"
  mkdir -p "$d/docs/design" "$d/docs/handoff"
  cat > "$d/docs/design/suite-backlog.md" <<EOF
# Suite backlog
> Opened 2026-07-26 at the end of the arc.

| # | Item | Why it is here | Evidence | State |
|---|------|----------------|----------|-------|
| B1 | **A thing** | because | measured | **$state** |
EOF
  cat > "$d/docs/design/trim-ledger.md" <<EOF
# Trim ledger — the 2026-07-15 skills/files audit

| # | Call | Ruling | Status |
|---|------|--------|--------|
| 1 | An acted call | Archive | **DONE** \`abc1234\` |
| 5 | A waiting call | Defer on evidence | **$trim** re-measure later |
EOF
  cat > "$d/docs/handoff/h.md" <<'EOF'
## 10. A twin-proven fix (2026-07-24)

- Something was wrong and got fixed in the twin.
- **Absorb into the suite**: the fix.

## 12. Not an absorb section (2026-07-24)

- This one merely mentions the word absorb in passing prose.
EOF
}

run_py() {                          # run_py <repo-dir> <python-expr-file>
  ( cd "$GEN" && python3 - "$1" ) <<PY
import sys
from pathlib import Path
sys.path.insert(0, ".")
import _suite_board as SB
repo = Path(sys.argv[1])
cards, labels = SB.build(repo)
$2
PY
}

echo "== board card rules =="

# R1 — a MARKER SET ruling is BLOCKED, never ready. Acting early is exactly what
# the operator ruling forbids, so "ready" here would invite the harm.
mkfixture "$TMP/a" "MARKER SET:" "NOT STARTED"
got=$(run_py "$TMP/a" 'print([c["state"] for c in cards if c["track"]=="ruling"][0])')
check "R1 SILENT: MARKER SET -> blocked" "$got" "blocked"

# R1 FIRE — the same row without the marker must NOT be blocked. If the mapping
# were hardcoded to blocked, or dropped, one of this pair goes red.
mkfixture "$TMP/b" "PARKED:" "NOT STARTED"
got=$(run_py "$TMP/b" 'print([c["state"] for c in cards if c["track"]=="ruling"][0])')
check "R1 FIRE:   PARKED -> parked (not blocked)" "$got" "parked"

# R2 — a DONE trim row is not an open move and must yield no card at all.
mkfixture "$TMP/c" "DONE" "NOT STARTED"
got=$(run_py "$TMP/c" 'print(len([c for c in cards if c["track"]=="ruling"]))')
check "R2 SILENT: DONE rows produce no card" "$got" "0"

# R3 — the backlog State cell DRIVES the state and is never re-derived.
mkfixture "$TMP/d" "DONE" "NEXT SESSION"
got=$(run_py "$TMP/d" 'print([c["state"] for c in cards if c["track"]=="backlog"][0])')
check "R3 SILENT: NEXT SESSION -> owed_to_you" "$got" "owed_to_you"

mkfixture "$TMP/e" "DONE" "DEFERRED"
got=$(run_py "$TMP/e" 'print([c["state"] for c in cards if c["track"]=="backlog"][0])')
check "R3 FIRE:   DEFERRED -> parked (state not fixed)" "$got" "parked"

# R4 — an absorb section is recognised by its INSTRUCTION, not by the word
# "absorb" appearing. §12 mentions it in prose and must not become a card.
#
# The assertion names the exact section SET rather than a count. A count alone
# was vacuous under mutation: loosening the guard to a bare case-sensitive
# `absorb` stops matching §10's "**Absorb into the suite**" while it starts
# matching §12's prose, so the total stays 1 and only the identity changes.
mkfixture "$TMP/f" "DONE" "NOT STARTED"
got=$(run_py "$TMP/f" \
  'print(",".join(sorted(c["title"].split(" ")[0] for c in cards if c["track"]=="absorb")) or "none")')
check "R4 SILENT: §10 is the only absorb section" "$got" "§10"

# R4 FIRE — a handoff with no instruction at all yields no absorb card.
mkdir -p "$TMP/f2/docs/handoff" "$TMP/f2/docs/design"
printf '## 12. Mentions absorb in prose (2026-07-24)\n\n- nothing to do here.\n' \
  > "$TMP/f2/docs/handoff/h.md"
got=$(run_py "$TMP/f2" 'print(len([c for c in cards if c["track"]=="absorb"]))')
check "R4 FIRE:   prose-only mention yields no card" "$got" "0"

# R5 — every source is reported even when it yields nothing, so "no open moves"
# and "the board never looked" cannot render identically.
rm -rf "$TMP/g"; mkdir -p "$TMP/g"
got=$(run_py "$TMP/g" 'import _suite_board as S; print(len(S.source_table(repo)))')
check "R5 SILENT: all 5 sources reported on an empty repo" "$got" "5"
got=$(run_py "$TMP/g" 'import _suite_board as S; print(sum(1 for s in S.source_table(repo) if s["present"]))')
check "R5 FIRE:   none of them claims to be present" "$got" "0"

# R6 — PROJECTION ONLY (ruling 1). Building cards must write nothing: a stored
# card would be a second source of truth competing with its file.
mkfixture "$TMP/h" "DONE" "NOT STARTED"
before=$(find "$TMP/h" -type f | wc -l)
run_py "$TMP/h" 'pass' >/dev/null
after=$(find "$TMP/h" -type f | wc -l)
check "R6 SILENT: building cards writes no file" "$after" "$before"

# R9 — a cell containing an ESCAPED pipe must not shift the row.
#
# Found in the real data, not invented: backlog row B3's Why cell carries
# `test\|visual\|journey`, and a naive split("|") pushed its State cell out of
# position so the card silently fell through to the `ready` default — which
# re-derives the state the operator ruling says to READ. Both halves are pinned:
# the state must survive, and an unrecognised cell must announce itself.
mkdir -p "$TMP/i/docs/design"
cat > "$TMP/i/docs/design/suite-backlog.md" <<'EOF'
# Suite backlog
> Opened 2026-07-26.

| # | Item | Why it is here | Evidence | State |
|---|------|----------------|----------|-------|
| B1 | **Piped** | declares `a\|b\|c` inline | measured | **DEFERRED** later |
EOF
got=$(run_py "$TMP/i" 'print([c["state"] for c in cards if c["track"]=="backlog"][0])')
check "R9 SILENT: escaped pipe keeps the State cell aligned" "$got" "parked"

# R9 FIRE — an unrecognised State cell is announced on the card, never silent.
mkdir -p "$TMP/j/docs/design"
sed 's/\*\*DEFERRED\*\* later/**WHATEVER** unknown/' \
  "$TMP/i/docs/design/suite-backlog.md" > "$TMP/j/docs/design/suite-backlog.md"
got=$(run_py "$TMP/j" \
  'print("loud" if "UNRECOGNISED" in [c["source"] for c in cards if c["track"]=="backlog"][0] else "silent")')
check "R9 FIRE:   an unknown State cell says so on the card" "$got" "loud"

# R10 — a numbered heading is a section boundary regardless of how its trailing
# aside is punctuated.
#
# Also found in the real data: `## 12. … (gastify retro, 2026-07-26)` has a
# parenthetical that is not a bare date. A regex demanding `(YYYY-MM-DD)` stopped
# seeing it as a boundary, so its body merged into the previous section — and §9,
# whose aside reads `(2026-07-22, commit 6ed1292)`, was swallowed the same way and
# its absorb instruction went unseen entirely.
mkdir -p "$TMP/k/docs/handoff"
cat > "$TMP/k/docs/handoff/h.md" <<'EOF'
## 8. Plain heading with no aside

- **Absorb into the suite**: the first one.

## 9. Heading with a compound aside (2026-07-22, commit abc1234)

- **Absorb into the suite**: the second one.

## 12. Heading with a prose aside (some retro, 2026-07-26)

- nothing to absorb here, just prose.
EOF
got=$(run_py "$TMP/k" \
  'print(",".join(sorted(c["title"].split(" ")[0] for c in cards if c["track"]=="absorb")))')
check "R10 SILENT: compound and bare asides both bound sections" "$got" "§8,§9"

got=$(run_py "$TMP/k" \
  'print([c["created"] for c in cards if c["track"]=="absorb" and c["title"].startswith("§9")][0])')
check "R10 FIRE:   the date is read out of a compound aside" "$got" "2026-07-22"

echo "== track registration =="

# R7 — suite tracks are registered without dropping upstream ones, because
# card_html does TRACKS[c["track"]] and a missing key is a KeyError.
got=$(run_py "$TMP/a" 'import _a3_board as B; print(int(all(k in B.TRACKS for k in ("verify","prove","guard","build","debt","arc"))))')
check "R7 SILENT: upstream tracks survive registration" "$got" "1"
got=$(run_py "$TMP/a" 'import _a3_board as B; print(",".join(B.TRACK_ORDER))')
check "R7 FIRE:   TRACK_ORDER is the suite's, not upstream's" \
      "$got" "ship,absorb,backlog,ruling,budget"

echo "== overview deep links =="

OUT="$REPO/docs/site/center"
if [ -d "$OUT" ]; then
  # R11 — the overview leads with what can be acted on. Operator ruling: the
  # accountability split was buried under three descriptive sections, so the
  # first thing the page showed was state rather than work.
  got=$(grep -o 'data-sec="overview-[a-z]*"' "$OUT/index.html" | head -1 | sed 's/.*overview-//;s/"//')
  check "R11 SILENT: 'needs attention' is the first section" "$got" "attention"
  got=$(grep -o 'data-sec="overview-[a-z]*"' "$OUT/index.html" | sed -n 2p | sed 's/.*overview-//;s/"//')
  check "R11 FIRE:   the split is second, above the descriptive sections" "$got" "split"

  # R12 — every bucket row is a live link whose anchor exists on the target.
  # A count that states a number and goes nowhere makes the reader hunt for the
  # thing it just named.
  miss=0
  for b in broken_claim hardenable hard_enforced prompt_only; do
    grep -q "enforcement.html?bucket=[A-Z_]*#sec-$b" "$OUT/index.html" || miss=$((miss+1))
    grep -q "id=\"sec-$b\"" "$OUT/enforcement.html" || miss=$((miss+1))
  done
  check "R12 SILENT: all 4 buckets link to a real anchor" "$miss" "0"

  # R12 FIRE — the link must carry the FILTER, not just the anchor; without the
  # query the reader lands on the right heading in an unfiltered page.
  #
  # Counted with `grep -o | wc -l`, not `grep -c`: the generated HTML is one long
  # line, so `grep -c` returns 1 no matter how many links are on it. The first
  # version of this assertion failed for that reason and looked like a page bug.
  got=$(grep -o 'enforcement.html?bucket=' "$OUT/index.html" | wc -l)
  check "R12 FIRE:   bucket links carry a ?bucket= filter" \
        "$([ "$got" -ge 4 ] && echo yes || echo no)" "yes"

  # R13 — filters are labelled dropdowns with per-option counts (ruling 3),
  # not a chip grid, and every filter key is stamped on the rows it filters.
  got=$(grep -o '<select data-f="[a-z]*"' "$OUT/enforcement.html" | wc -l)
  check "R13 SILENT: enforcement carries 3 dropdowns" "$got" "3"
  got=$(grep -c 'class="dmchips"' "$OUT/enforcement.html" || true)
  check "R13 FIRE:   the old chip grid is gone" "$got" "0"
  got=$(grep -o 'data-row ' "$OUT/enforcement.html" | wc -l)
  check "R13 FIRE:   every rule row is stamped for filtering" "$got" "119"
else
  bad "R11-R13 — docs/site/center is not built; run refresh_suite_center.sh first"
fi

echo "== center link gate =="

# R8 — the gate refuses a vacuous run, passes a real one, and fires on a break.
mkdir -p "$TMP/empty"
python3 "$GEN/check_suite_center.py" "$TMP/empty" >/dev/null 2>&1
check "R8 FIRE:   0 pages -> exit 2 (vacuous run refused)" "$?" "2"

OUT="$REPO/docs/site/center"
if [ -d "$OUT" ]; then
  python3 "$GEN/check_suite_center.py" "$OUT" >/dev/null 2>&1
  check "R8 SILENT: the built center passes" "$?" "0"
  cp -r "$OUT" "$TMP/broken"
  sed -i 's|href="hooks.html"|href="nope.html"|' "$TMP/broken/index.html"
  python3 "$GEN/check_suite_center.py" "$TMP/broken" >/dev/null 2>&1
  check "R8 FIRE:   a dead link -> exit 1" "$?" "1"

  # R14 — a deep link's QUERY selects rows on arrival and is not part of the
  # filename. The gate resolved the whole string as a path and reported all 33
  # filtered links as dead; stripping the query must not cost it the ability to
  # catch a genuinely dead target behind one.
  cp -r "$OUT" "$TMP/q1"
  sed -i 's|enforcement.html?bucket=BROKEN_CLAIM#sec-broken_claim|nope.html?bucket=X#sec-broken_claim|' "$TMP/q1/index.html"
  python3 "$GEN/check_suite_center.py" "$TMP/q1" >/dev/null 2>&1
  check "R14 FIRE:   a dead page behind a query -> exit 1" "$?" "1"

  cp -r "$OUT" "$TMP/q2"
  sed -i 's|enforcement.html?bucket=HARDENABLE#sec-hardenable|enforcement.html?bucket=HARDENABLE#sec-nope|' "$TMP/q2/index.html"
  python3 "$GEN/check_suite_center.py" "$TMP/q2" >/dev/null 2>&1
  check "R14 FIRE:   a dead anchor behind a query -> exit 1" "$?" "1"
else
  bad "R8 — docs/site/center is not built; run refresh_suite_center.sh first"
fi

echo
echo "suite-center battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
