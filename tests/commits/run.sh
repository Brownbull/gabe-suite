#!/usr/bin/env bash
# _a3_commits battery — recent git commits → the graph ELEMENTS they touched, as journeys.
#
# build_commits reads git + the built c4 graph's file→node index and returns the most recent
# N commits that TOUCHED THE MAP (a commit changing only tests/docs/config is SKIPPED).
# Proven HERMETICALLY (a throwaway git repo + a stub graph, no twin, no network):
#   * FILE→NODE mapping covers BOTH backend det.file AND fe piece file; a node with no file
#     is never mapped.
#   * MAP-TOUCHING FILTER: a commit touching only non-graph files has no journey (skipped),
#     so N counts map-touching commits, not raw commits.
#   * HONEST-EMPTY: no git → None; emit(None) → window.GABE_COMMITS = [].
#   * DETERMINISM: byte-identical on a re-run (a function of tree+head; no wallclock).
# FIRE and SILENT both exercised (mutation-proven). Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators"

python3 - "$GEN" <<'PY'
import sys, json, tempfile, subprocess, pathlib, os
gen = sys.argv[1]
sys.path.insert(0, gen)
import _a3_commits

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

# a stub c4 graph: backend nodes homed by det.file + one fe piece by file; one node has NO file.
GRAPH = {"l2": {"recipe": {"nodes": [
            {"id": "model:Recipe",        "det": {"file": "api/recipe.py"}},
            {"id": "endpoint:GET /recipes","det": {"file": "api/recipe.py"}},
            {"id": "model:NoFile"}]}},                      # no det.file → never mapped
         "fe": {"pieces": [{"id": "fe:web/RecipeScreen.tsx", "file": "web/RecipeScreen.tsx"}]}}

with tempfile.TemporaryDirectory() as td:
    root = pathlib.Path(td)
    (root / "api").mkdir(); (root / "web").mkdir(); (root / "docs").mkdir()
    env = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t",
           "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}
    def git(*a): subprocess.run(["git", *a], cwd=td, env=env, capture_output=True)
    git("init", "-q")
    # base: docs ONLY (not a graph file) → base itself is NOT map-touching
    (root / "docs/README.md").write_text("# docs\n")
    git("add", "-A"); git("commit", "-qm", "base: docs only")
    # commit A: ADD a backend file AND the fe file → maps to 3 nodes
    (root / "api/recipe.py").write_text("x=1\n"); (root / "web/RecipeScreen.tsx").write_text("export const S=1\n")
    git("add", "-A"); git("commit", "-qm", "A: recipe api + screen")
    # commit B: touch ONLY docs (no graph node) → MUST be skipped
    (root / "docs/README.md").write_text("# docs v2\n")
    git("add", "-A"); git("commit", "-qm", "B: docs only")
    # commit C (newest): touch only the backend file → 2 nodes
    (root / "api/recipe.py").write_text("x=3\n")
    git("add", "-A"); git("commit", "-qm", "C: recipe api")

    cs = _a3_commits.build_commits(root, GRAPH, n=30)
    check(cs is not None and len(cs) == 2,
          f"only the 2 MAP-TOUCHING commits are kept (B, docs-only, is skipped) — got {None if cs is None else len(cs)}")
    subs = [c["subject"] for c in (cs or [])]
    check("B: docs only" not in subs, "the docs-only commit produces NO journey (map-touching filter)")
    check(bool(cs) and cs[0]["subject"].startswith("C") and cs[1]["subject"].startswith("A"),
          "commits are newest-first (C before A)")
    # C touched the backend file → both nodes homed to it, sorted; the no-file node never appears
    check(bool(cs) and cs[0]["touched"] == ["endpoint:GET /recipes", "model:Recipe"],
          f"a backend file maps to ALL its nodes, sorted; a file-less node never maps — got {cs[0]['touched'] if cs else None}")
    # A touched backend + fe → the fe piece id is included (fe file mapping works)
    check(bool(cs) and "fe:web/RecipeScreen.tsx" in cs[1]["touched"] and cs[1]["nTouched"] == 3,
          f"a commit touching an fe file maps to its fe piece — got {cs[1]['touched'] if cs else None}")
    # n limit counts MAP-TOUCHING commits: n=1 → only the newest map-touching (C)
    c1 = _a3_commits.build_commits(root, GRAPH, n=1)
    check(bool(c1) and len(c1) == 1 and c1[0]["subject"].startswith("C"),
          "n limits to the newest MAP-TOUCHING commits (n=1 → C only)")
    # DETERMINISM: a function of tree+head → byte-identical
    check(json.dumps(cs, sort_keys=True) == json.dumps(_a3_commits.build_commits(root, GRAPH, n=30), sort_keys=True),
          "build_commits is byte-deterministic across re-runs")
    # a graph with NO files → nothing maps → no map-touching commits (empty, not a crash)
    check(_a3_commits.build_commits(root, {"l2": {}, "fe": {"pieces": []}}, n=30) == [],
          "a graph with no file-homed node yields ZERO commit journeys (honest-empty)")

# HONEST-EMPTY: a non-git dir → None; emit(None) → the empty stub
with tempfile.TemporaryDirectory() as td2:
    check(_a3_commits.build_commits(pathlib.Path(td2), GRAPH) is None,
          "no git → None (caller writes honest-empty)")
    _a3_commits.emit(None, pathlib.Path(td2))
    txt = (pathlib.Path(td2) / "commits.js").read_text()
    check("window.GABE_COMMITS = [];" in txt, "emit(None) writes the honest-empty stub")
    _a3_commits.emit([{"sha": "z", "short": "z", "subject": "s", "date": "2026-01-01T00:00:00",
                       "author": "a", "touched": ["model:X"], "nFiles": 1, "nTouched": 1}], pathlib.Path(td2))
    txt2 = (pathlib.Path(td2) / "commits.js").read_text()
    check(txt2.startswith("window.GABE_COMMITS = [") and "model:X" in txt2, "emit(list) writes the window global")

print(f"commits battery: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY
