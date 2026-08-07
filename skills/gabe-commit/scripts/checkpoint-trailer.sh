#!/usr/bin/env bash
# checkpoint-trailer.sh — gabe-commit deterministic check (ruling 2026-08-07)
#
# The printed TASK CONTRACT went 0-for-19 across two full twin cycles — ceremony with no
# consumer does not survive contact. The per-task record now lives where a machine already
# looks: the checkpoint commit message. /gabe-execute's Step 5 footer gains two lines:
#
#   Task:  T<i>/<K> — <description>          (already present — the checkpoint marker)
#   Cases: <C-ids ...> | none — <reason> | skip:<code> ... | RED OWED ...
#   Class: red | guard | wiring | growth
#
# Self-detecting: a message WITH a `Task:` line IS an execute checkpoint and must carry valid
# `Cases:` + `Class:` lines; a message without `Task:` is not this script's business.
# Class semantics: red = advances declared red cases (must cite ≥1 C-id) · guard = refactor
# under held guards · wiring = no red claim · growth = execute-minted case.
#
# Usage: checkpoint-trailer.sh <message-file>   ("-" = stdin)
# Exit 0 = clean or not-applicable · 2 = WARN finding (report, never gate — D1) · 1 = usage.
# Fixture battery: tests/commit-scripts/run.sh (FIRE and SILENT both proven).
set -uo pipefail

if [ $# -ne 1 ]; then
  echo "usage: checkpoint-trailer.sh <message-file|-> " >&2
  exit 1
fi
if [ "$1" = "-" ]; then
  msg=$(cat)
else
  [ -f "$1" ] || { echo "usage: checkpoint-trailer.sh <message-file|-> — no such file: $1" >&2; exit 1; }
  msg=$(cat "$1")
fi

# not a checkpoint commit — nothing to check
printf '%s\n' "$msg" | grep -qE '^Task:[[:space:]]*T[0-9]+' || exit 0

warn=0
say() { warn=1; echo "[WARN] checkpoint-trailer: $1"; }

cases_line=$(printf '%s\n' "$msg" | grep -E '^Cases:' | head -1 || true)
class_line=$(printf '%s\n' "$msg" | grep -E '^Class:' | head -1 || true)

if [ -z "$cases_line" ]; then
  say "checkpoint commit (Task: present) carries no Cases: line — the task record is incomplete (execute-spec Step 5 footer)"
fi
if [ -z "$class_line" ]; then
  say "checkpoint commit (Task: present) carries no Class: line — expected Class: red | guard | wiring | growth"
fi

cls=""
if [ -n "$class_line" ]; then
  if printf '%s' "$class_line" | grep -qE '^Class:[[:space:]]*(red|guard|wiring|growth)[[:space:]]*$'; then
    cls=$(printf '%s' "$class_line" | sed -E 's/^Class:[[:space:]]*//; s/[[:space:]]*$//')
  else
    say "malformed Class: line: '${class_line}' — expected exactly one of red | guard | wiring | growth"
  fi
fi

if [ -n "$cases_line" ]; then
  val=$(printf '%s' "$cases_line" | sed -E 's/^Cases:[[:space:]]*//')
  has_id=0
  printf '%s' "$val" | grep -qE '(^|[^A-Za-z0-9])C[0-9]{1,5}([^0-9]|$)' && has_id=1
  if [ "$has_id" = 0 ]; then
    # id-less forms must name their absence honestly (mirrors the retired contract's rule:
    # a never-ran red may not dress as a skip)
    if ! printf '%s' "$val" | grep -qE '^(none[[:space:]]+—[[:space:]]+.+|skip:[a-z-]+.*|RED OWED.*)$'; then
      say "Cases: line cites no C-id and matches no honest-absence form — want C-ids, 'none — <reason>', 'skip:<code> …', or 'RED OWED …' (got: '${val}')"
    fi
  fi
  if [ "$cls" = "red" ] && [ "$has_id" = 0 ]; then
    say "Class: red claims declared red cases but the Cases: line cites no C-id — a red claim without its ids is record-less"
  fi
fi

[ "$warn" = 1 ] && exit 2
exit 0
