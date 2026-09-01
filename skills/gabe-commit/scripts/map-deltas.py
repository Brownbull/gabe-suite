#!/usr/bin/env python3
"""map-deltas — the map<->grep delta loop's one tool (emit + analyze+sweep).

Two subcommands, zero LLM cost, report-never-gate. Full design record:
../../../docs/design/map-delta-loop/README.md.

  append   Emit one delta line. Called by /gabe-red, /gabe-execute, /gabe-review
           when a grep (context B) diverges from a codebase-map claim (context A).
           Validates the shape and appends one JSON object to
           .kdbp/map-deltas.jsonl. Silent no-op (exit 0) when the project has no
           .kdbp/ (not a KDBP project) — never litters a non-KDBP tree.

  analyze  Cluster the accumulator by generator arm, print a digest, and (with
           --sweep) move the analyzed lines to .kdbp/map-deltas-rollup.jsonl so
           the live accumulator never grows write-only. Called by the /gabe-commit
           gate alongside size-budget.sh et al.

Schema (one JSON object per line in .kdbp/map-deltas.jsonl):
  {"v":1,"type":"add|subtract|modify","subject":str,"found":str,
   "pointer":str,"gen":str,"ctx":{"cmd":str,"entity":str,"head":str}}

  type   add      grep found access/callers the map MISSED   (recall gap)
         subtract the map claims an edge grep can't CONFIRM  (precision gap)
         modify   same subject, an attribute DIFFERS (r vs w, table, ...)
  gen    the generator arm that would fix it -- _a3_code.access, _a3_graft.calls,
         _a3_web.bridge, _a3_fe, route_census, ... -- the analyze cluster key.

Exit: append  0 = written or silent no-op   · 1 = usage error.
      analyze 0 = nothing to show (honest-empty) · 2 = digest printed · 1 = env error.
An exit 2 is a WARN that feeds the gate's triage; it NEVER blocks a commit.
"""
import sys, os, json, subprocess
from collections import defaultdict

TYPES = ("add", "subtract", "modify")
LIVE = "map-deltas.jsonl"
ROLL = "map-deltas-rollup.jsonl"


def _git_root():
    try:
        r = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                           capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else None
    except Exception:
        return None


def _kdbp(root):
    if not root:
        return None
    d = os.path.join(root, ".kdbp")
    return d if os.path.isdir(d) else None


def _head(root):
    try:
        r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                           capture_output=True, text=True, cwd=root)
        return r.stdout.strip() if r.returncode == 0 else ""
    except Exception:
        return ""


def append(a):
    if a.type not in TYPES:
        sys.stderr.write("map-deltas: --type must be one of %s\n" % (TYPES,))
        return 1
    if not a.subject or not a.gen:
        sys.stderr.write("map-deltas: --subject and --gen are required\n")
        return 1
    root = _git_root()
    kd = _kdbp(root)
    if not kd:
        return 0  # not a KDBP project — silent no-op, no stray file
    rec = {"v": 1, "type": a.type, "subject": a.subject,
           "found": a.found or "", "pointer": a.pointer or "", "gen": a.gen,
           "ctx": {"cmd": a.cmd or "", "entity": a.entity or "", "head": _head(root)}}
    with open(os.path.join(kd, LIVE), "a") as f:
        f.write(json.dumps(rec, separators=(",", ":")) + "\n")
    return 0


def analyze(threshold, sweep):
    root = _git_root()
    kd = _kdbp(root)
    if not kd:
        return 0  # honest-empty: no .kdbp
    live = os.path.join(kd, LIVE)
    if not os.path.exists(live):
        return 0
    with open(live) as f:
        raw = [ln.strip() for ln in f.read().splitlines() if ln.strip()]
    if not raw:
        return 0
    valid, malformed = [], 0
    for ln in raw:
        try:
            o = json.loads(ln)
        except Exception:
            malformed += 1
            continue
        if o.get("type") in TYPES and o.get("gen"):
            valid.append(o)
        else:
            malformed += 1

    if not valid:
        if sweep:
            open(live, "w").close()  # drop malformed junk quietly
        return 0

    by_gen = defaultdict(lambda: defaultdict(int))
    gen_total = defaultdict(int)
    for o in valid:
        by_gen[o["gen"]][o["type"]] += 1
        gen_total[o["gen"]] += 1
    ranked = sorted(gen_total.items(), key=lambda kv: (-kv[1], kv[0]))

    head_parts = []
    for gen, n in ranked[:5]:
        ts = by_gen[gen]
        tstr = "/".join(t[:3] for t in sorted(ts, key=lambda t: (-ts[t], t)))
        head_parts.append("%s x%d (%s)" % (gen, n, tstr))
    more = "" if len(ranked) <= 5 else " · +%d more" % (len(ranked) - 5)
    mf = " · %d malformed skipped" % malformed if malformed else ""
    print("MAP DELTAS · %d since last sweep · %s%s%s"
          % (len(valid), " · ".join(head_parts), more, mf))
    for gen, n in ranked:
        if n >= threshold:
            print("  consider: %s — %d deltas; pointers in .kdbp/%s" % (gen, n, ROLL))

    if sweep:
        # Durability order: the rollup is fully written + fsync'd BEFORE the live file is
        # truncated, so a crash can never lose deltas. A crash in the window between fsync and
        # truncate only re-sweeps the same lines next run — benign rollup duplicates, never loss.
        with open(os.path.join(kd, ROLL), "a") as rf:
            for o in valid:
                rf.write(json.dumps(o, separators=(",", ":")) + "\n")
            rf.flush()
            os.fsync(rf.fileno())
        open(live, "w").close()  # accumulator back to empty — never write-only
    return 2


def main():
    import argparse
    p = argparse.ArgumentParser(prog="map-deltas", description="map<->grep delta loop")
    sub = p.add_subparsers(dest="op")  # not "cmd" — collides with append's --cmd flag
    ap = sub.add_parser("append", help="emit one delta line")
    ap.add_argument("--type", default="")
    ap.add_argument("--subject", default="")
    ap.add_argument("--found", default="")
    ap.add_argument("--pointer", default="")
    ap.add_argument("--gen", default="")
    ap.add_argument("--cmd", default="")
    ap.add_argument("--entity", default="")
    an = sub.add_parser("analyze", help="cluster + digest + (--sweep) clear")
    an.add_argument("--threshold", type=int, default=3)
    an.add_argument("--sweep", action="store_true")
    a = p.parse_args()
    if a.op == "append":
        sys.exit(append(a))
    elif a.op == "analyze":
        sys.exit(analyze(a.threshold, a.sweep))
    else:
        p.print_usage(sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
