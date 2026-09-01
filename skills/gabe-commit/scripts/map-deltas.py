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
H_HORIZON = int(os.environ.get("MAP_DELTAS_H", "40"))  # commits since last recurrence → COLD (computed, never stored)


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


def _commit_count(root):
    try:
        r = subprocess.run(["git", "rev-list", "--count", "HEAD"],
                           capture_output=True, text=True, cwd=root)
        s = r.stdout.strip()
        return int(s) if r.returncode == 0 and s.isdigit() else 0
    except Exception:
        return 0


def _edge_file(pointer):
    """The stable half of a pointer — drop a trailing :line so the tally survives line drift."""
    p = pointer or ""
    if ":" in p:
        head, tail = p.rsplit(":", 1)
        if tail.isdigit():
            return head
    return p


def _read_live(live):
    """→ (new_deltas, malformed_count). new_deltas are v1 delta dicts."""
    new, malformed = [], 0
    if not os.path.exists(live):
        return new, malformed
    with open(live) as f:
        for ln in f.read().splitlines():
            ln = ln.strip()
            if not ln:
                continue
            try:
                o = json.loads(ln)
            except Exception:
                malformed += 1
                continue
            if not isinstance(o, dict):        # valid JSON, wrong shape ([1], "s", 5) — skip, never crash
                malformed += 1
                continue
            if o.get("type") in TYPES and o.get("gen"):
                new.append(o)
            else:
                malformed += 1
    return new, malformed


def _bump(edges, d, n):
    """Upsert one v1 delta into the edge ledger at commit-count n (0 = legacy fold, unknown → cold)."""
    file = _edge_file(d.get("pointer", ""))
    key = (d["gen"], d.get("subject", ""), file)
    ptr = d.get("pointer", "")
    e = edges.get(key)
    if e:
        e["count"] += 1
        e["last_n"] = max(e.get("last_n", 0), n)
        if ptr:
            e["last_pointer"] = ptr
    else:
        edges[key] = {"v": 2, "gen": d["gen"], "subject": d.get("subject", ""),
                      "file": file, "count": 1, "first_n": n, "last_n": n, "last_pointer": ptr}


def _load_ledger(path, fold_n=0):
    """Edge-keyed tally {(gen, subject, file): v2 record}. Folds any v1 legacy rollup lines once,
    stamping them last_n=fold_n (the migration commit count) so the accumulated backlog surfaces
    at migration and ages out on its own, rather than reading cold from the first beat."""
    edges = {}
    if not os.path.exists(path):
        return edges
    with open(path) as f:
        for ln in f.read().splitlines():
            ln = ln.strip()
            if not ln:
                continue
            try:
                o = json.loads(ln)
            except Exception:
                continue
            if not isinstance(o, dict):
                continue
            if o.get("v") == 2 and o.get("gen") and "file" in o:
                edges[(o["gen"], o.get("subject", ""), o["file"])] = o
            elif o.get("type") in TYPES and o.get("gen"):   # v1 legacy raw delta → fold at migration
                _bump(edges, o, fold_n)
    return edges


def _write_ledger(path, edges):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        for e in edges.values():
            f.write(json.dumps(e, separators=(",", ":")) + "\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)   # atomic rewrite — a crash leaves the prior ledger intact


def analyze(threshold, sweep):
    root = _git_root()
    kd = _kdbp(root)
    if not kd:
        return 0  # honest-empty: no .kdbp
    live = os.path.join(kd, LIVE)
    ledger_path = os.path.join(kd, ROLL)
    new, malformed = _read_live(live)

    # No new deltas this sweep: the standing reminder is pulse S14's job (it reads the ledger),
    # not the commit digest's — so exit quiet. Drop a junk-only live file if sweeping.
    if not new:
        if sweep and malformed and os.path.exists(live):
            open(live, "w").close()
        return 0

    cur_n = _commit_count(root)
    edges = _load_ledger(ledger_path, cur_n)   # folds a v1 legacy rollup, stamped as seen now
    for d in new:
        _bump(edges, d, cur_n)
    if sweep:
        # Ledger written + fsync'd BEFORE live is truncated, so a crash never LOSES a delta; a crash
        # in the window between them only re-counts this batch next sweep — a benign over-count of a
        # coarse persistence tally, never loss (report-never-gate).
        _write_ledger(ledger_path, edges)
        open(live, "w").close()   # accumulator back to empty

    # Digest the ACTIVE edges — tier computed fresh, never stored (current_n − last_n < H).
    active = [e for e in edges.values() if cur_n - e.get("last_n", 0) < H_HORIZON]
    if not active:
        return 0
    by_gen = defaultdict(list)
    for e in active:
        by_gen[e["gen"]].append(e)
    ranked = sorted(by_gen.items(), key=lambda kv: (-len(kv[1]), kv[0]))
    parts = ["%s x%d (top %dx)" % (gen, len(es), max(e["count"] for e in es))
             for gen, es in ranked[:5]]
    more = "" if len(ranked) <= 5 else " · +%d more" % (len(ranked) - 5)
    mf = " · %d malformed skipped" % malformed if malformed else ""
    print("MAP DELTAS · %d active edges · %s%s%s" % (len(active), " · ".join(parts), more, mf))
    for gen, es in ranked:
        if len(es) >= threshold:
            print("  consider: %s — %d active missed edges (top recurs %dx); ledger in .kdbp/%s"
                  % (gen, len(es), max(e["count"] for e in es), ROLL))
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
