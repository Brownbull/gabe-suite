#!/usr/bin/env python3
"""Derive the example station's SEEDED sim.data.js from a REAL twin commit — so the
demo sim always joins the co-regenerated feeds (piece ids age together, never apart).

Why: a hand-frozen fixture references piece ids of ITS era; every feed re-snapshot
orphans it (77fe3cd shipped the null stub instead and 6/7 port probes silently died).
build_sim is a pure function of (inflight, archmap, tree) — fabricating the inflight
record from a real commit makes the seeded sim REGENERABLE, deterministic per twin
state, and coherent with the feeds by construction.

Usage: derive-seeded-sim.py <twin-root> <tmp-center-out-with-archmap.json> <out-file>
Seed pick: the most recent commit touching >=3 archmap-mapped files across >=2
entities (walked from HEAD, depth 40) — deterministic given the twin history."""
import sys, json, subprocess
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "templates" / "center" / "generators"))
import _a3_sim

twin, tmpout, outfile = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
amap = json.load(open(tmpout / "archmap.json"))
# entity → its file set (the archmap's own membership list is the ground truth; every
# section's `file` is git-relative). A file's FIRST-listing entity homes it.
ent_of = {}
for slug, ent in (amap.get("entities") or {}).items():
    fs = set()
    for row in (ent.get("files") or []):          # files: [kind, path, size] triples
        if isinstance(row, list) and len(row) >= 2 and row[1]: fs.add(row[1])
    for sec in ("models", "endpoints", "functions", "schemas", "defines"):
        for it in (ent.get(sec) or []):
            f = ((it.get("file") if isinstance(it, dict) else it) or "").split(":")[0]
            if f: fs.add(f)
    for f in fs: ent_of.setdefault(f, slug)
mapped = set(ent_of)
def git(*a): return subprocess.run(["git", "-C", str(twin), *a], capture_output=True, text=True).stdout
# walk deep — recent twin history is polluted by center-regen commits (no source files)
pick = None
for sha in git("log", "--format=%H", "-200").split():
    touched = [f for f in git("show", "--name-only", "--format=", sha).split("\n") if f]
    hit = [f for f in touched if f in mapped]
    if len(hit) >= 3 and len({ent_of[f] for f in hit}) >= 2:
        pick = (sha, touched, hit); break
if not pick:
    sys.exit("FAIL: no commit in the last 40 touches >=3 mapped files across >=2 entities")
sha, touched, hit = pick
subject = git("log", "-1", "--format=%s", sha).strip()
inflight = {"active": True, "head": sha[:8], "last_commit": subject, "touched": sorted(set(touched)),
            "work_source": {"kind": "seeded-example", "label": "example seed · " + sha[:8]}}
sim = _a3_sim.build_sim(inflight, amap, twin)
if not sim: sys.exit("FAIL: build_sim returned None for the picked commit " + sha[:8])
outfile.write_text("// SEEDED example sim — DERIVED from twin commit " + sha[:8]
                   + " by derive-seeded-sim.py (never hand-edit; regen-example.sh refreshes it)\n"
                   + "window.GABE_SIM = " + json.dumps(sim, indent=1, sort_keys=True) + ";\n")
print(f"seeded sim: commit {sha[:8]} · {len(hit)} mapped files · entities {sorted({ent_of[f] for f in hit})}")
