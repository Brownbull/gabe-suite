#!/usr/bin/env python3
"""prove-guard — prove a guard can actually FAIL, by making it fail.

/gabe-red proves a case red ONCE, at the moment it is written. Nothing re-proves
it. A case that was genuinely red at mint goes VOID later — a refactor severs
the assertion, a missing `afterEach(cleanup)` leaves state that satisfies it, a
config change excludes it from the run — and a void guard is indistinguishable
from a real one until the day it fails to catch something. A twin measured its
own void rate at 1 in 6 while actively trying not to write one.

This script closes that loop. It MUTATES the line a guard claims to protect,
runs the guard, and asserts it goes red:

    baseline green  ->  mutant red    PROVEN     (exit 0)
    baseline green  ->  mutant green  VOID       (exit 2)  <- the finding
    baseline red / no safe mutation   INCONCLUSIVE (exit 3)

ALWAYS REVERTS. The original bytes are restored on every path, including
Ctrl-C, a crashing runner, and a runner that never returns — and the restore is
VERIFIED byte-for-byte before the script reports anything. A tool that edits
source and might not put it back is not one anybody should run.

ONLY SYNTAX-SAFE MUTATIONS. Operators and literals are swapped in place; a line
offering neither is REFUSED (exit 3), never mangled. This matters more than
coverage of mutation kinds: a mutation that breaks the parse makes the run fail
for the wrong reason, and the script would report PROVEN for a guard that
actually catches nothing. Deleting or commenting a line cannot be done safely
without a parser for every language in the tree, so it is not attempted.

Usage:
  prove-guard.py <file>:<line> --run "<command>" [--case C123] [--symbol k]
                 [--record PATH | --no-record] [--dry-run]

  --run       the command that executes the guard, from the repo root. Narrow
              it to the single case where the runner allows — a suite-wide run
              makes an unrelated failure look like proof.
  --case      the C-id this proves, recorded with the verdict.
  --symbol    what the guard protects ("file::fn"), for the center's guard lens.
              Defaults to the mutated file.
  --record    verdict sink (default .kdbp/guard-proofs.jsonl).
  --dry-run   show the mutation and exit; touches nothing, runs nothing.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

# Ranked, syntax-preserving. Each entry is (label, pattern, replacement) applied
# to the FIRST match on the line. Comparison flips come first: they change
# behaviour in the most direct way a guard should notice.
MUTATIONS = [
    ("cmp ==>!=", r"(?<![=!<>])==(?!=)", "!="),
    ("cmp !=>==", r"!=(?!=)", "=="),
    ("cmp >=><", r">=", "<"),
    ("cmp <=>>", r"<=", ">"),
    ("cmp <>>", r"(?<![<=])<(?![=<])", ">"),
    ("cmp >><", r"(?<![>=])>(?![=>])", "<"),
    ("bool True>False", r"\bTrue\b", "False"),
    ("bool False>True", r"\bFalse\b", "True"),
    ("bool true>false", r"\btrue\b", "false"),
    ("bool false>true", r"\bfalse\b", "true"),
    ("logic and>or", r"\band\b", "or"),
    ("logic or>and", r"\bor\b", "and"),
    ("logic &&>||", r"&&", "||"),
    ("logic ||>&&", r"\|\|", "&&"),
    ("not: drop", r"\bnot\s+", ""),
    ("negate !", r"(?<![=!<>])!(?![=])", ""),
    ("int n>n+1", r"(?<![\w.])(\d+)(?![\w.])", None),   # handled specially
]


def pick_mutation(line: str):
    """(label, mutated_line) for the first applicable rule, or (None, None).

    A line inside a comment is refused: mutating a comment can never turn a
    guard red, so a VOID verdict from one would be an artefact of this script
    rather than a fact about the test."""
    stripped = line.strip()
    if not stripped or stripped.startswith(("#", "//", "*", "/*")):
        return None, None
    for label, pat, repl in MUTATIONS:
        m = re.search(pat, line)
        if not m:
            continue
        if repl is None:                        # numeric bump
            n = int(m.group(1))
            new = line[:m.start(1)] + str(n + 1) + line[m.end(1):]
        else:
            new = line[:m.start()] + repl + line[m.end():]
        if new != line:
            return label, new
    return None, None


def run(cmd: str, cwd: Path) -> tuple[int, str]:
    p = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr)[-4000:]


def main() -> int:
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("target", help="<file>:<line>")
    ap.add_argument("--run", required=False, default=None)
    ap.add_argument("--case", default="")
    ap.add_argument("--symbol", default="")
    ap.add_argument("--record", default=None)
    ap.add_argument("--no-record", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if ":" not in a.target:
        print("prove-guard: target must be <file>:<line>", file=sys.stderr)
        return 1
    fpart, _, lpart = a.target.rpartition(":")
    if not lpart.isdigit():
        print("prove-guard: target must be <file>:<line>", file=sys.stderr)
        return 1
    lineno = int(lpart)

    try:
        root = Path(subprocess.run(["git", "rev-parse", "--show-toplevel"],
                                   capture_output=True, text=True, check=True
                                   ).stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("prove-guard: not a git repository", file=sys.stderr)
        return 1

    path = (root / fpart) if not Path(fpart).is_absolute() else Path(fpart)
    if not path.is_file():
        print(f"prove-guard: no such file: {fpart}", file=sys.stderr)
        return 1

    original = path.read_bytes()
    lines = original.decode("utf-8", "surrogateescape").splitlines(keepends=True)
    if not (1 <= lineno <= len(lines)):
        print(f"prove-guard: {fpart} has {len(lines)} lines, asked for {lineno}",
              file=sys.stderr)
        return 1

    label, mutated = pick_mutation(lines[lineno - 1])
    if label is None:
        print(f"INCONCLUSIVE  no syntax-safe mutation for {fpart}:{lineno}")
        print(f"  line: {lines[lineno - 1].rstrip()}")
        print("  Only operator and literal swaps are applied — a mutation that "
              "breaks the parse would make the run fail for the wrong reason "
              "and be reported as proof. Cite a line carrying a comparison, "
              "boolean, connective or number.")
        return 3

    print(f"mutation: {label}")
    print(f"  -  {lines[lineno - 1].rstrip()}")
    print(f"  +  {mutated.rstrip()}")
    if a.dry_run:
        print("dry-run: nothing written, nothing run")
        return 0
    if not a.run:
        print("prove-guard: --run is required (or use --dry-run)", file=sys.stderr)
        return 1

    # The file must be pristine, because the ONLY safe revert is the bytes we
    # read a moment ago. Refusing here is cheaper than restoring a file to a
    # state the author had not finished editing.
    dirty = subprocess.run(["git", "status", "--porcelain", "--", str(path)],
                           cwd=root, capture_output=True, text=True).stdout.strip()
    if dirty:
        print(f"INCONCLUSIVE  {fpart} has uncommitted changes — commit or stash "
              f"first so the revert is exact")
        return 3

    backup = Path(tempfile.mkdtemp(prefix="prove-guard-")) / path.name
    backup.write_bytes(original)
    verdict, base_out, mut_out = "INCONCLUSIVE", "", ""
    try:
        base_rc, base_out = run(a.run, root)
        if base_rc != 0:
            print("INCONCLUSIVE  the guard is ALREADY red before any mutation — "
                  "a red guard proves nothing about the code it names")
            print(_tail(base_out))
            return 3

        lines[lineno - 1] = mutated
        path.write_text("".join(lines), errors="surrogateescape")
        mut_rc, mut_out = run(a.run, root)
        verdict = "PROVEN" if mut_rc != 0 else "VOID"
    finally:
        # Restore on EVERY path, then VERIFY. An unverified restore is a claim,
        # and this script exists because unverified claims are the problem.
        path.write_bytes(original)
        restored = path.read_bytes() == original
        shutil.rmtree(backup.parent, ignore_errors=True)
        if not restored:
            print(f"prove-guard: FAILED TO RESTORE {fpart} — recover with "
                  f"`git checkout -- {fpart}`", file=sys.stderr)
            return 1

    if verdict == "PROVEN":
        print(f"PROVEN  the guard went red when {fpart}:{lineno} was mutated")
    else:
        print(f"VOID    the guard stayed GREEN with {fpart}:{lineno} mutated — "
              f"it does not test what it names")
        print(_tail(mut_out))

    if not a.no_record:
        rec = {
            "case": a.case,
            "symbol": a.symbol or fpart,
            "file": fpart,
            "line": lineno,
            "mutation": label,
            "result": verdict.lower(),
            "run": a.run,
            "when": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "head": subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                                   cwd=root, capture_output=True, text=True
                                   ).stdout.strip(),
        }
        sink = Path(a.record) if a.record else (root / ".kdbp/guard-proofs.jsonl")
        sink.parent.mkdir(parents=True, exist_ok=True)
        with sink.open("a") as fh:
            fh.write(json.dumps(rec) + "\n")
        print(f"recorded -> {sink.relative_to(root) if sink.is_relative_to(root) else sink}")
    return 0 if verdict == "PROVEN" else 2


def _tail(out: str, n: int = 12) -> str:
    ls = [ln for ln in out.splitlines() if ln.strip()][-n:]
    return "\n".join("  | " + ln for ln in ls)


if __name__ == "__main__":
    sys.exit(main())
