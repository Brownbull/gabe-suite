#!/usr/bin/env bash
# suite-doctor — drift check: repo vs ~/.claude (Claude Code is the only harness).
#
# The standing rule this enforces (investigation 2026-07, plan step 0.1):
#   suite changes land in the REPO first; installs are regenerated via
#   ./install.sh, never patched in place. This script makes silent drift
#   visible. Exit 0 = clean, exit 1 = drift found.
#
# Usage: scripts/suite-doctor.sh [--quiet]
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
QUIET="${1:-}"
drift=0

hash_of() { [ -f "$1" ] && md5sum "$1" | cut -d' ' -f1 || echo "MISSING"; }

report() { # status path detail
  drift=1
  echo "DRIFT  $1  $2"
}

check_pair() { # repo_file install_file label
  local rh ih
  rh=$(hash_of "$1"); ih=$(hash_of "$2")
  if [ "$rh" != "$ih" ]; then
    if [ "$ih" = "MISSING" ]; then report "$3" "missing from install: $2"
    elif [ "$rh" = "MISSING" ]; then report "$3" "exists only in install (never committed): $2"
    else report "$3" "differs: $2"
    fi
  fi
}

check_home() { # home label
  local home="$1" label="$2"
  [ -d "$home" ] || { echo "SKIP   $label — $home not present"; return; }
  # skills
  for d in "$REPO"/skills/gabe-*/; do
    name=$(basename "$d")
    while IFS= read -r f; do
      rel="${f#"$d"}"
      check_pair "$f" "$home/skills/$name/$rel" "$label"
    done < <(find "$d" -type f ! -path '*node_modules*' ! -path '*__pycache__*')
    # files present in install but not in repo
    if [ -d "$home/skills/$name" ]; then
      while IFS= read -r f; do
        rel="${f#"$home"/skills/"$name"/}"
        [ -f "$d$rel" ] || report "$label" "exists only in install (never committed): $f"
      done < <(find "$home/skills/$name" -type f ! -path '*__pycache__*')
    fi
  done
  # whole skill dirs present in the install but absent from the repo glob — decommissioned
  # skills (skills/_archive/) must leave the install too, or they stay live and triggerable
  for d in "$home"/skills/gabe-*/; do
    [ -d "$d" ] || continue
    name=$(basename "$d")
    [ -d "$REPO/skills/$name" ] || report "$label" "orphaned skill still installed (not in repo skills/ — decommissioned? remove): $d"
  done
  # commands retired (B2 skills-only migration) — any surviving gabe command file is a straggler
  for f in "$home"/commands/gabe-*.md; do
    [ -e "$f" ] || continue
    report "$label" "retired surface still installed (commands are gone — remove): $f"
  done
  # kdbp session hooks (repo scripts/hooks/kdbp/* → <home>/scripts/hooks/kdbp/*, both directions)
  while IFS= read -r f; do
    rel="${f#"$REPO"/scripts/hooks/kdbp/}"
    check_pair "$f" "$home/scripts/hooks/kdbp/$rel" "$label"
  done < <(find "$REPO/scripts/hooks/kdbp" -type f 2>/dev/null)
  if [ -d "$home/scripts/hooks/kdbp" ]; then
    while IFS= read -r f; do
      rel="${f#"$home"/scripts/hooks/kdbp/}"
      [ -f "$REPO/scripts/hooks/kdbp/$rel" ] || report "$label" "retired hook still installed (A2 KDBP-lite — remove): $f"
    done < <(find "$home/scripts/hooks/kdbp" -type f)
  fi
  # templates (repo templates/* → <home>/templates/gabe/*, both directions)
  while IFS= read -r f; do
    rel="${f#"$REPO"/templates/}"
    check_pair "$f" "$home/templates/gabe/$rel" "$label"
  done < <(find "$REPO/templates" -type f)
  if [ -d "$home/templates/gabe" ]; then
    while IFS= read -r f; do
      rel="${f#"$home"/templates/gabe/}"
      [ -f "$REPO/templates/$rel" ] || report "$label" "exists only in install (never committed): $f"
    done < <(find "$home/templates/gabe" -type f)
  fi
}

check_home "$HOME/.claude" "claude"

# ---- suite invariants (meta-review 2026-07-16: the five review rounds' recurring classes) ----
check_invariants() {
  # P2/P4 — the enforcement layer's executable contract must stay green
  if [ -f "$REPO/tests/hooks/run.sh" ] && ! bash "$REPO/tests/hooks/run.sh" >/dev/null 2>&1; then
    report "invariant" "hook harness FAILING — run: bash tests/hooks/run.sh"
  fi
  # P3 — version parity: SKILL.md metadata.version must match the CLAUDE.md Capabilities row
  for d in "$REPO"/skills/gabe-*/; do
    name=$(basename "$d")
    sv=$(sed -n 's/^  version: \([0-9.]*\)$/\1/p' "$d/SKILL.md" | head -1)
    cv=$(sed -n "s/^| \*\*$name\*\* | \([0-9.]*\) |.*/\1/p" "$REPO/CLAUDE.md" | head -1)
    [ -n "$sv" ] && [ "$sv" != "$cv" ] && report "invariant" "version drift: $name SKILL.md=$sv vs CLAUDE.md=${cv:-NO ROW}"
  done
  # P3 — skill-count claims in the two hand-kept indexes vs the directory truth
  n=$(ls -d "$REPO"/skills/gabe-*/ 2>/dev/null | wc -l)
  for f in CLAUDE.md README.md; do
    while IFS= read -r claim; do
      [ "$claim" = "$n" ] || report "invariant" "$f claims ($claim skills) but skills/gabe-*/ has $n"
    done < <(grep -oE '\([0-9]+ skills\)' "$REPO/$f" | grep -oE '[0-9]+')
  done
  # P6 — portability: shipped surfaces must not couple to one machine
  # (pattern split so this script never matches itself; bytecode caches excluded)
  op_path="/home/""khujta"
  hits=$(grep -rl "$op_path" "$REPO"/skills "$REPO"/templates "$REPO"/scripts "$REPO"/prompts "$REPO"/schemas "$REPO/install.sh" 2>/dev/null | grep -vE '_archive|__pycache__|\.pyc$' || true)
  [ -n "$hits" ] && report "invariant" "operator-machine path in shipped surface(s): $(echo "$hits" | tr '\n' ' ')"
  bare=$(grep -rn '\$ECC_ROOT' "$REPO"/templates "$REPO"/skills 2>/dev/null | grep -v 'ECC_ROOT:-' || true)
  [ -n "$bare" ] && report "invariant" "bare \$ECC_ROOT (no :-\$HOME/.claude fallback): $(echo "$bare" | cut -d: -f1-2 | tr '\n' ' ')"
  # P3/P4 — docsite: markdown source newer than its generated page means the site is stale
  for src in "$REPO"/docs/src/*.md; do
    [ -f "$src" ] || continue
    page="$REPO/docs/site/$(basename "${src%.md}").html"
    if [ -f "$page" ] && [ "$src" -nt "$page" ]; then
      report "invariant" "docsite stale: docs/src/$(basename "$src") is newer than its generated page — rebuild (build_docsite.py)"
    fi
  done
}
check_invariants

if [ "$drift" -eq 0 ]; then
  [ "$QUIET" = "--quiet" ] || echo "suite-doctor: CLEAN — repo and ~/.claude are in sync."
  exit 0
else
  echo "suite-doctor: DRIFT FOUND — reconcile via the repo (commit repo-ward captures, then ./install.sh). Never patch installs in place."
  exit 1
fi
