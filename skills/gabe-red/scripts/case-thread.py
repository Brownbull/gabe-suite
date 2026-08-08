#!/usr/bin/env python3
"""case-thread — the red→green thread, machine-observed at both ends.

/gabe-red proves cases red once, at mint. /gabe-execute turns them green.
Nothing between the two ever re-runs the declared set: execute can start on a
phase whose cases were never red, and review can tick on a phase whose cases
never went green — both on narration alone. This script closes the thread:

    --assert-red    the declared set is failing RIGHT NOW (execute-entry)
    --assert-green  the declared set passes NOW; prints the green@<sha> stamp
                    (execute finish / review opener)

Verdicts (exit codes mirror prove-guard):
    RED-PROVEN / GREEN-PROVEN    exit 0
    NOT-RED / NOT-GREEN          exit 2   <- the finding
    INCONCLUSIVE                 exit 3   (skip:* record, no ids, no record)

REPORT, NEVER GATE: this script prints verdicts and stamps; it writes nothing.
The caller (skill step or human) applies the stamp to the Cases record; the
plan-proof-guard hook is what makes a missing stamp block a Review ✅ (D7).

A NOT-RED on a red assert distinguishes its reasons: a run where the declared
set PASSES is not red; a run that dies on import/collection is not red EITHER —
it is broken, and gate-spec's carve-out treats those as blockers, not evidence.

Usage:
  case-thread.py --phase <id> --run "<case-scoped command>" --assert-red
  case-thread.py --phase <id> --run "<case-scoped command>" --assert-green
                 [--plan .kdbp/PLAN.json]

  --run   the case-scoped runner (e.g. `pytest -k "C147 or C148"`), from the
          repo root. Narrow it to the declared ids — a suite-wide run makes an
          unrelated failure look like a red proof.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys

# Output shapes that mean "the run is broken", not "the cases are red".
BROKEN_MARKERS = [
    r"\bImportError\b", r"\bModuleNotFoundError\b", r"\bSyntaxError\b",
    r"errors? during collection", r"\bcollected 0 items\b", r"no tests ran",
    r"command not found", r"\bUsage error\b", r"INTERNALERROR",
]

CID = re.compile(r"(?<![A-Za-z0-9])C[0-9]{1,5}(?![0-9])")


def parse_cases(record: str):
    """(declared_ids, guard_ids, skip_code) from a Cases record string."""
    skip = re.search(r"skip:[a-z-]+", record)
    if skip:
        return [], [], skip.group(0)
    guard_part = ""
    declared_part = record
    # Match the two REAL spellings only — red-spec's `GUARD`/`GUARD:` and the execute
    # trailer's `Guard:` — both word-bounded, never a bare case-insensitive `guard`
    # (that split records at prose like "guard-rail case C100" and misclassified the
    # declared id as a guard — review regression 2026-08-07).
    m = re.search(r"\b(?:GUARD|Guard)\b:?", record)
    if m:
        declared_part, guard_part = record[: m.start()], record[m.end():]
    declared = sorted(set(CID.findall(declared_part)))
    guards = sorted(set(CID.findall(guard_part)))
    return [d for d in declared if d not in guards], guards, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", required=True)
    ap.add_argument("--run", required=True, dest="cmd")
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--assert-red", action="store_true")
    mode.add_argument("--assert-green", action="store_true")
    ap.add_argument("--plan", default=".kdbp/PLAN.json")
    a = ap.parse_args()

    try:
        plan = json.load(open(a.plan))
    except Exception as e:
        print(f"INCONCLUSIVE: cannot read {a.plan} ({e})")
        return 3
    record = ""
    for ph in plan.get("phases", []) or []:
        if str(ph.get("id")) == str(a.phase):
            record = (ph.get("cases") or "").strip()
            break
    if not record:
        print(f"INCONCLUSIVE: phase {a.phase} has no Cases record — run /gabe-red first")
        return 3
    declared, guards, skip = parse_cases(record)
    if skip:
        print(f"INCONCLUSIVE: phase {a.phase} records {skip} — nothing to assert")
        return 3
    if not declared and not guards:
        print(f"INCONCLUSIVE: phase {a.phase} Cases record carries no C-ids: {record!r}")
        return 3

    p = subprocess.run(a.cmd, shell=True, capture_output=True, text=True)
    out = (p.stdout or "") + (p.stderr or "")
    broken = next((m for m in BROKEN_MARKERS if re.search(m, out, re.I)), None)
    seen = {cid: bool(re.search(rf"(?<![A-Za-z0-9]){cid}(?![0-9])", out)) for cid in declared}
    unseen = [c for c, s in seen.items() if not s]

    if a.assert_red:
        if broken:
            print(f"NOT-RED: run is BROKEN, not red — matched {broken!r} (exit {p.returncode}). "
                  "An import/collection error is a blocker, never red evidence (gate-spec carve-out).")
            print(_tail(out))
            return 2
        if p.returncode == 0:
            print(f"NOT-RED: declared set PASSED (exit 0) — nothing is red for phase {a.phase}. "
                  f"Declared: {' '.join(declared) or '—'}")
            return 2
        print(f"RED-PROVEN: runner exit {p.returncode}, no broken-run markers — "
              f"declared set failing now. Declared: {' '.join(declared)}"
              + (f" · guards: {' '.join(guards)}" if guards else ""))
        if unseen:
            print(f"[WARN] ids not seen in output: {' '.join(unseen)} — is the --run scoped to them?")
        return 0

    # --assert-green
    if p.returncode != 0 or broken:
        why = f"matched {broken!r}" if broken else f"runner exit {p.returncode}"
        print(f"NOT-GREEN: {why} — declared set is not green for phase {a.phase}.")
        print(_tail(out))
        return 2
    sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                         capture_output=True, text=True).stdout.strip() or "HEAD"
    print(f"GREEN-PROVEN: exit 0 — declared set green, guards green (one run covers both). "
          f"Declared: {' '.join(declared) or '—'}"
          + (f" · guards: {' '.join(guards)}" if guards else ""))
    if unseen:
        print(f"[WARN] ids not seen in output: {' '.join(unseen)} — is the --run scoped to them?")
    print(f"stamp: green@{sha}   <- append to the phase's Cases record "
          "(PLAN.md Phase Details + PLAN.json phases[].cases, same turn — E5)")
    return 0


def _tail(out: str, n: int = 10) -> str:
    lines = [l for l in out.splitlines() if l.strip()]
    return "\n".join("  | " + l for l in lines[-n:])


if __name__ == "__main__":
    sys.exit(main())
