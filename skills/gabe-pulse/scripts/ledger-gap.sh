#!/usr/bin/env bash
# LEDGER-GAP — which commits landed without a LEDGER row.
#
# The one fact nothing in the suite currently produces: work committed outside
# /gabe-commit leaves a git trace and no ledger trace. This is a set
# subtraction, not a judgement — `git log` minus the short hashes recorded in
# the LEDGER's Commits column (gate-spec Step 6 writes `[short hash]` there).
#
# Deterministic: no LLM, no transcript, no session boundary. A repo that records
# its work through a DIFFERENT command vocabulary still commits, so this cannot
# repeat the false-positive class that "did a gabe-* command run?" produces.
#
# BASELINE. Commits older than the oldest ledger-registered commit predate
# ledger discipline and are never reported — otherwise adopting a LEDGER would
# flag the entire history. Override with --since.
#
# BOOKKEEPING. A commit that writes a ledger row can never appear in the ledger
# it just wrote. Measured on real twins (2026-07-26): 73/146 gustify and
# 116/285 gastify flagged commits touched ONLY lifecycle state. A commit whose
# every path sits under a bookkeeping prefix is therefore excluded — and the
# count of what was excluded is always printed, never silently dropped.
#
# Usage:  ledger-gap.sh [--json] [--since <ref>] [--ledger <path>] [--limit N]
#                       [--bookkeeping <prefix>]...   (repeatable; default .kdbp/)
#                       [--no-bookkeeping-filter]
# Exit:   0 = clean (every commit in range is registered or bookkeeping)
#         2 = gap found (unregistered work commits exist)
#         1 = cannot determine (not a git repo / no ledger / no baseline)
#
# Exit 1 is NOT "clean". A caller that treats it as clean is asserting the
# absence of evidence is evidence of absence; the message says which it is.
set -uo pipefail

JSON=0; SINCE=""; LEDGER=".kdbp/LEDGER.md"; LIMIT=0; BK_FILTER=1; BK_PREFIXES=""
while [ $# -gt 0 ]; do
  case "$1" in
    --json)   JSON=1; shift ;;
    --since)  SINCE="${2:-}"; [ -n "$SINCE" ] || { echo "ledger-gap: --since needs a ref" >&2; exit 1; }; shift 2 ;;
    --ledger) LEDGER="${2:-}"; [ -n "$LEDGER" ] || { echo "ledger-gap: --ledger needs a path" >&2; exit 1; }; shift 2 ;;
    --limit)  LIMIT="${2:-0}"; shift 2 ;;
    --bookkeeping) [ -n "${2:-}" ] || { echo "ledger-gap: --bookkeeping needs a path prefix" >&2; exit 1; }
                   BK_PREFIXES="${BK_PREFIXES}${2}:"; shift 2 ;;
    --no-bookkeeping-filter) BK_FILTER=0; shift ;;
    -h|--help) sed -n '2,31p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "ledger-gap: unknown argument: $1" >&2; exit 1 ;;
  esac
done
[ -n "$BK_PREFIXES" ] || BK_PREFIXES=".kdbp/:"
[ "$BK_FILTER" = 1 ] || BK_PREFIXES=""

emit_undetermined() { # $1 = reason
  if [ "$JSON" = 1 ]; then
    printf '{"state":"undetermined","reason":"%s","unregistered":[],"count":0,"bookkeeping_filtered":0}\n' "$1"
  else
    echo "ledger-gap: UNDETERMINED — $1"
  fi
  exit 1
}

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || emit_undetermined "not a git repository"
[ -f "$LEDGER" ] || emit_undetermined "no ledger at $LEDGER"

T=$(mktemp -d) || emit_undetermined "cannot create temp dir"
trap 'rm -rf "$T"' EXIT

# --- registered hashes -------------------------------------------------------
# ONLY the Commits column (5th awk field — a leading empty field shifts by one)
# of a markdown table row is read. Scanning whole lines would let a hex-looking
# token anywhere in the row silently register a commit it never referred to.
awk -F'|' '
  /^[[:space:]]*\|/ {
    if (NF < 5) next
    cell = $5
    while (match(cell, /[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]+/)) {
      tok = substr(cell, RSTART, RLENGTH)
      if (RLENGTH <= 40) print substr(tok, 1, 7)
      cell = substr(cell, RSTART + RLENGTH)
    }
  }
' "$LEDGER" | sort -u > "$T/registered"

[ -s "$T/registered" ] || emit_undetermined "ledger at $LEDGER records no commit hashes — no baseline to measure against"

# --- range -------------------------------------------------------------------
if [ -z "$SINCE" ]; then
  oldest=""
  while IFS= read -r sha; do
    if grep -qxF "${sha:0:7}" "$T/registered"; then oldest="$sha"; fi
  done < <(git log --no-merges --format=%H 2>/dev/null)
  [ -n "$oldest" ] || emit_undetermined "no ledger-registered commit is reachable from HEAD — cannot set a baseline"
  RANGE="$oldest..HEAD"; BASE="$oldest"
else
  git rev-parse --verify --quiet "$SINCE" >/dev/null 2>&1 || emit_undetermined "--since ref not found: $SINCE"
  RANGE="$SINCE..HEAD"; BASE=$(git rev-parse "$SINCE")
fi

# --- one pass over the range, classifying each commit ------------------------
# Records are \x01-delimited so a subject containing a tab or newline cannot
# be mistaken for a path line.
git log --no-merges --format=$'\x01%H\t%s\t%ad' --date=short --name-only "$RANGE" 2>/dev/null |
awk -v prefixes="$BK_PREFIXES" '
  BEGIN { FS="\t"; np = split(prefixes, P, ":") }
  function flush(   i, bk) {
    if (sha == "") return
    bk = (nfiles > 0 && allbk) ? "BK" : "WORK"
    printf "%s\t%s\t%s\t%s\n", sha, date, subj, bk
  }
  /^\x01/ {
    flush()
    line = substr($0, 2)
    n = split(line, F, "\t")
    sha = F[1]; subj = F[2]; date = F[3]
    nfiles = 0; allbk = 1
    next
  }
  {
    if ($0 == "") next
    nfiles++
    hit = 0
    for (i = 1; i <= np; i++) if (P[i] != "" && index($0, P[i]) == 1) { hit = 1; break }
    if (!hit) allbk = 0
  }
  END { flush() }
' > "$T/classified"

n=0; bk=0
: > "$T/gap"
while IFS=$'\t' read -r sha date subj kind; do   # field order MUST match awk's flush()
  [ -n "$sha" ] || continue
  grep -qxF "${sha:0:7}" "$T/registered" && continue
  if [ "$kind" = "BK" ]; then bk=$((bk+1)); continue; fi
  printf '%s\t%s\t%s\n' "${sha:0:7}" "$date" "$subj" >> "$T/gap"
  n=$((n+1))
done < "$T/classified"

reg=$(wc -l < "$T/registered" | tr -d ' ')

if [ "$JSON" = 1 ]; then
  {
    printf '{"state":"%s","baseline":"%s","registered_hashes":%s,"count":%s,"bookkeeping_filtered":%s,"unregistered":[' \
      "$([ "$n" -gt 0 ] && echo gap || echo clean)" "${BASE:0:7}" "$reg" "$n" "$bk"
    first=1
    while IFS=$'\t' read -r h d s; do
      [ "$first" = 1 ] || printf ','
      first=0
      esc=$(printf '%s' "$s" | sed 's/\\/\\\\/g; s/"/\\"/g')
      printf '{"sha":"%s","date":"%s","subject":"%s"}' "$h" "$d" "$esc"
    done < "$T/gap"
    printf ']}\n'
  }
  [ "$n" -gt 0 ] && exit 2 || exit 0
fi

# no silent caps — what was filtered is always stated
bknote=""
[ "$bk" -gt 0 ] && bknote=" · $bk bookkeeping commit(s) excluded (only paths under ${BK_PREFIXES%:})"

if [ "$n" -eq 0 ]; then
  echo "ledger-gap: CLEAN — every commit since ${BASE:0:7} carries a LEDGER row ($reg registered)$bknote"
  exit 0
fi

echo "ledger-gap: $n commit(s) since ${BASE:0:7} have no LEDGER row$bknote"
shown=0
while IFS=$'\t' read -r h d s; do
  if [ "$LIMIT" -gt 0 ] && [ "$shown" -ge "$LIMIT" ]; then
    echo "  … $((n - shown)) more (raise --limit to see them)"
    break
  fi
  printf '  %s  %s  %s\n' "$h" "$d" "$s"
  shown=$((shown+1))
done < "$T/gap"
exit 2
