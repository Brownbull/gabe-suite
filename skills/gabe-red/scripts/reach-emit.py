#!/usr/bin/env python3
"""reach-emit — red's Reach record + map-delta emit in ONE deterministic run.

Runs the two-arm reach (graft callers UNION word-boundary grep) for each subject symbol,
prints the Reach line for the record, AND auto-emits the arm-difference as map-delta lines.
One command, so the "notice the divergence + remember to append" discretion the audit flagged
(axis 2, the 0-for-19 failure class) disappears — the gated Reach record can no longer be
produced without the emit.

  reach-emit.py <sym>... [--dir REPO] [--dry-run]
  reach-emit.py <sym> --callers-json F --grep-json F [--dir REPO]   # test injection

The CORE lives in gabe-map's `mapquery.two_arm` (one emitter for red AND the MCP tool
`mcp__gabe-map__who_calls`): delta = grep-found CODE references (docstring/comment mentions
are classified prose and never emitted) minus caller files minus def files, noise-filtered to
source; the emit needs a MAP CLAIM (graft resolved the symbol — an empty or failed callers arm
emits nothing, it is not a divergence), goes through `map-deltas.py append --once` (no tally
inflation on repeats), and is skipped when `.kdbp/map-deltas.jsonl` is not gitignored.
Word-boundary grep: `_auth` collapses 60 substring hits to 1 real caller edge (gustify).

No graft index → prints `no index`, emits nothing, exit 0. --dry-run prints the deltas instead
of appending (safe preview; used to validate against a twin read-only).

Exit: 0 for any normal run (report-never-gate) · 1 = usage error.
"""
import json
import os
import sys

_SKILLS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
sys.path.insert(0, os.path.join(_SKILLS, "gabe-map", "scripts"))
import mapquery as mq  # noqa: E402

CAP = mq.REACH_CAP


def _graft_grep_hits(grep_json):
    """graft grep --json groups (per enclosing symbol) → flat hits, first hit per path kept by two_arm."""
    hits = []
    try:
        for g in (json.loads(grep_json) if grep_json else {}).get("groups", []):
            p = g.get("path")
            for h in (g.get("hits") or []):
                if p:
                    hits.append({"path": p, "line": h.get("line", 0), "text": h.get("text", "")})
    except Exception:
        pass
    return hits


def process(sym, repo, callers_json, grep_json, dry):
    """Return (reach_files sorted, emitted_count, result) — emits deltas as a side effect (gated)."""
    cstat = "ran" if callers_json is not None else "no index"
    res = mq.two_arm(sym, repo, callers_json, cstat, _graft_grep_hits(grep_json), "ran",
                     emit=True, cmd="red", dry=dry, allowed_roots=None, cap=CAP)
    if dry:
        for p in res["missed_by_map"]:
            line = next((h["line"] for h in res["grep_hits"] if h["path"] == p), 0)
            print("  DELTA %s  %s:%s  (gen _a3_graft.calls)" % (sym, p, line))
    for n in res["notes"]:
        print("  note: %s — %s" % (sym, n))
    for s in res["emit_skipped"]:
        print("  emit skipped: %s" % s)
    n = len(res["missed_by_map"]) if dry else res["emitted"]
    return res["reach"], n, res


def _print_reach(files, repo, claim_present=True):
    rc, out, _ = mq.sh(["git", "-C", repo, "rev-parse", "--short", "HEAD"])
    sha = out.strip() if rc == 0 else "?"
    body = " · ".join(files) if files else "—"
    print("- **Reach:** %s (%s@%s)" % (body, "graft" if claim_present else "grep-only", sha))


def main():
    args = sys.argv[1:]
    dry, dir_, cj, gj, syms = False, ".", None, None, []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--dir":
            i += 1; dir_ = args[i] if i < len(args) else "."
        elif a == "--dry-run":
            dry = True
        elif a == "--callers-json":
            i += 1; cj = args[i] if i < len(args) else None
        elif a == "--grep-json":
            i += 1; gj = args[i] if i < len(args) else None
        elif a.startswith("--"):
            sys.stderr.write("reach-emit: unknown flag %s\n" % a); return 1
        else:
            syms.append(a)
        i += 1
    if not syms:
        sys.stderr.write("reach-emit: need at least one <symbol>\n"); return 1
    repo = os.path.abspath(dir_)

    # test-injection mode: one symbol, JSON supplied from files (no graft run)
    if cj is not None or gj is not None:
        cjson = open(cj).read() if cj else "{}"
        gjson = open(gj).read() if gj else "{}"
        reach, n, res = process(syms[0], repo, cjson, gjson, dry)
        _print_reach(reach, repo, res["map_claim"] == "present")
        print("  emitted %d delta(s)%s" % (n, " (dry-run)" if dry else ""))
        return 0

    if not os.path.isdir(os.path.join(repo, "graft")):
        print("no index")
        return 0

    all_reach, total, any_claim = set(), 0, False
    for s in syms:
        cjson, _ = mq.graft_callers(s, repo)
        rc_g, gout, _ = mq.sh(["graft", "grep", r"\b%s\b" % s, ".", "--json", "--no-refresh"], cwd=repo)
        gjson = gout if rc_g == 0 else None
        reach, n, res = process(s, repo, cjson, gjson, dry)
        any_claim = any_claim or res["map_claim"] == "present"
        all_reach.update(reach); total += n
    _print_reach(sorted(all_reach), repo, any_claim)
    print("  emitted %d delta(s)%s" % (total, " (dry-run)" if dry else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
