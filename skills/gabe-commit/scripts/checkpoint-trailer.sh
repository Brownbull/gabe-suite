#!/usr/bin/env bash
# checkpoint-trailer.sh — gabe-commit deterministic check (ruling 2026-08-07)
#
# The printed TASK CONTRACT went 0-for-19 across two full twin cycles — ceremony with no
# consumer does not survive contact. The per-task record now lives where a machine already
# looks: the checkpoint commit message. /gabe-execute's Step 5 footer gains two lines:
#
#   Cases: <C-ids this task advances (red@<sha>)> · Guard: <ids that stay green>
#   Class: red | guard | wiring | growth
#
# Self-detecting: a message WITH a `Task:` line IS an execute checkpoint and must carry valid
# `Cases:` + `Class:` lines. The Cases grammar is parsed by REUSING gabe-red's parse_cases
# (one grammar, not a fourth copy) so a `Guard:` id can never satisfy the red-claim check, and
# both the ASCII-hyphen and em-dash spellings of `none -` / `none —` are accepted.
#
# Usage: checkpoint-trailer.sh <message-file|->
# Exit 0 = clean or not-applicable · 2 = WARN finding (report, never gate — D1) · 1 = usage.
# Fixture battery: tests/commit-scripts/run.sh (FIRE and SILENT both proven).
set -uo pipefail

if [ $# -ne 1 ]; then
  echo "usage: checkpoint-trailer.sh <message-file|->" >&2
  exit 1
fi
if [ "$1" = "-" ]; then
  msg=$(cat)
else
  [ -f "$1" ] || { echo "usage: checkpoint-trailer.sh <message-file|-> — no such file: $1" >&2; exit 1; }
  msg=$(cat "$1")
fi

SELF="$(cd "$(dirname "$0")" && pwd)"
CT="$SELF/../../gabe-red/scripts/case-thread.py"

GABE_TRAILER_MSG="$msg" GABE_CT="$CT" python3 - <<'PY'
import os, re, sys

msg = os.environ.get("GABE_TRAILER_MSG", "")
if not re.search(r"^Task:\s*T[0-9]+", msg, re.M):
    sys.exit(0)                      # not an execute checkpoint — not this check's business

# Reuse gabe-red's Cases grammar (the guard/declared split lives there); fall back to a
# faithful local copy only if the import fails, so the checker never bricks a commit.
parse_cases = None
ct = os.environ.get("GABE_CT", "")
if ct and os.path.isfile(ct):
    import importlib.util
    try:
        spec = importlib.util.spec_from_file_location("case_thread", ct)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        parse_cases = getattr(mod, "parse_cases", None)
    except Exception:
        parse_cases = None

_CID = re.compile(r"(?<![A-Za-z0-9])C[0-9]{1,5}(?![0-9])")
def _fallback(rec):
    m = re.search(r"skip:[a-z-]+", rec)
    if m:
        return [], [], m.group(0)
    g = re.search(r"GUARD:?", rec, re.I)
    dp, gp = (rec[:g.start()], rec[g.end():]) if g else (rec, "")
    dec = sorted(set(_CID.findall(dp)))
    gua = sorted(set(_CID.findall(gp)))
    return [x for x in dec if x not in gua], gua, None
pc = parse_cases or _fallback

warn = 0
def say(m):
    global warn; warn = 1; print(f"[WARN] checkpoint-trailer: {m}")

lines = msg.splitlines()

# Cases value, gathering wrapped continuation lines (the execute spec prints the value across
# `\n       | …`) so a C-id on the second line is not invisible.
cases_val = None
for i, ln in enumerate(lines):
    m = re.match(r"^Cases:\s*(.*)$", ln)
    if not m:
        continue
    val, j = m.group(1), i + 1
    while j < len(lines):
        nxt = lines[j]
        if not nxt.strip() or re.match(r"^(Task|Class|Phase|Cases):", nxt):
            break
        if nxt[:1].isspace() or nxt.lstrip().startswith("|"):
            val += " " + nxt.strip(); j += 1
        else:
            break
    cases_val = val
    break

class_line = next((ln for ln in lines if re.match(r"^Class:", ln)), None)

if cases_val is None:
    say("checkpoint commit (Task: present) carries no Cases: line — the task record is incomplete (execute-spec Step 5 footer)")
cls = None
if class_line is None:
    say("checkpoint commit (Task: present) carries no Class: line — expected Class: red | guard | wiring | growth")
else:
    cm = re.match(r"^Class:\s*(\S+)\s*$", class_line)
    if cm and cm.group(1).lower() in ("red", "guard", "wiring", "growth"):
        cls = cm.group(1).lower()
    else:
        say(f"malformed Class: line: {class_line!r} — expected exactly one of red | guard | wiring | growth")

if cases_val is not None:
    declared, guards, skip = pc(cases_val)
    honest = bool(re.match(r"^\s*none\s*[—-]", cases_val, re.I)) or skip is not None or "RED OWED" in cases_val
    if not declared and not honest:
        say("Cases: line cites no declared C-id and matches no honest-absence form — want C-ids, "
            f"'none — <reason>', 'skip:<code> …', or 'RED OWED …' (got: {cases_val!r})")
    if cls == "red" and not declared:
        say("Class: red claims declared red cases but the Cases: line declares no C-id "
            "(a Guard: id does not count) — a red claim without its ids is record-less")

sys.exit(2 if warn else 0)
PY
