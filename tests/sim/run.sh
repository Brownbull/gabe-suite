#!/usr/bin/env bash
# _a3_sim battery — the LIVE change-simulation derivation's executable contract.
#
# _a3_sim.build_sim turns the beat-tail inflight + the committed archmap + git into
# window.GABE_SIM (touched/blast/pieces/stages), or None when no change is in flight.
# This battery proves, HERMETICALLY (synthetic archmap + a throwaway git repo, no
# twin, no network):
#   * HONEST-EMPTY: inactive / no-touch / no-inflight → None (the null stub).
#   * BLAST is the FK reverse of touched, read from the SAME edges the station draws;
#     the coupling (cross_edges) names the FK column.
#   * CLASS-LEVEL attribution: only the model whose OWN class lines changed is a
#     changed piece with its per-class +N — a neighbour in the same file stays out.
#   * DETERMINISM: byte-identical on a re-run (no wallclock; sorted keys).
# FIRE and SILENT both exercised (mutation-proven). Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators"

python3 - "$GEN" <<'PY'
import sys, json, tempfile, subprocess, pathlib, os
gen = sys.argv[1]
sys.path.insert(0, gen)
import _a3_sim  # pulls in _a3_graph (sibling)

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

# ── synthetic archmap: recipe ← cooking (FK cooking.recipe_id → recipes.id) ──
AMAP = {"head": "synth", "entities": {
    "recipe":  {"files": [["m", "m/recipe.py", 10]],
                "models": [{"cls": "Recipe", "table": "recipes", "file": "m/recipe.py",
                            "cols": [["id", "uuid.UUID", ""]], "fks": {}},
                           {"cls": "Other", "table": "others", "file": "m/recipe.py",
                            "cols": [], "fks": {}}],
                "endpoints": []},
    "cooking": {"files": [["m", "m/cooking.py", 5]],
                "models": [{"cls": "CookingSession", "table": "cooking_sessions",
                            "file": "m/cooking.py", "cols": [],
                            "fks": {"recipe_id": "recipes.id"}}],
                "endpoints": []},
}}

# ── A · honest-empty (no git needed) ──
here = pathlib.Path(".")
check(_a3_sim.build_sim(None, AMAP, here) is None, "no inflight → None")
check(_a3_sim.build_sim({"active": False}, AMAP, here) is None, "inactive inflight → None")
check(_a3_sim.build_sim({"active": True, "touched": []}, AMAP, here) is None, "active but no touched → None")

# ── B · blast + coupling from FK (git returns nothing relevant → pieces via FK only) ──
inflight = {"active": True, "touched": ["recipe"], "head": "h", "last_commit": "s",
            "work_source": "none", "phase": {"cases": ["C1"]}}
sim = _a3_sim.build_sim(inflight, AMAP, here)
check(sim is not None, "active + touched → a sim")
check(sim["touched"] == ["recipe"], "touched carried through")
check(sim["blast"] == ["cooking"], f"blast = FK reverse of touched (got {sim['blast']})")
check(sim["blast_edges"] == [{"from": "cooking", "to": "recipe", "kinds": {"fk": 1}}],
      f"blast_edges names the FK (got {sim['blast_edges']})")
ce = sim["cross_edges"]
check(len(ce) == 1 and ce[0]["from"] == "model:CookingSession"
      and ce[0]["to"] == "model:Recipe" and ce[0]["via"] == "recipe_id",
      f"cross_edge couples CookingSession → Recipe via recipe_id (got {ce})")
check([p["label"] for p in sim["pieces"]["cooking"]] == ["CookingSession"],
      "blast entity's link model is a piece (role=link)")
check(sim["pieces"]["cooking"][0]["role"] == "link", "link role set")
check(sim["derived"] is True, "derived provenance flag set")

# ── C · class-level attribution on a throwaway git repo ──
with tempfile.TemporaryDirectory() as td:
    root = pathlib.Path(td)
    (root / "m").mkdir()
    env = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t",
           "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}
    def git(*a): subprocess.run(["git", *a], cwd=td, env=env, capture_output=True)
    git("init", "-q")
    # recipe.py: class Recipe + class Other; cooking.py: class CookingSession
    (root / "m" / "recipe.py").write_text("class Recipe:\n    id = 1\n\nclass Other:\n    x = 1\n")
    (root / "m" / "cooking.py").write_text("class CookingSession:\n    recipe_id = None\n")
    git("add", "-A"); git("commit", "-qm", "base")
    # change ONLY the Recipe class (+2 lines); Other is untouched
    (root / "m" / "recipe.py").write_text(
        "class Recipe:\n    id = 1\n    cupo_id = None\n    dish = None\n\nclass Other:\n    x = 1\n")
    git("add", "-A")
    git("commit", "-qm", "change recipe only")
    sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=td, env=env,
                         capture_output=True, text=True).stdout.strip()

    inf = {"active": True, "touched": ["recipe"], "head": sha, "last_commit": "change recipe only",
           "work_source": sha, "phase": {"cases": ["C1"]}}
    s2 = _a3_sim.build_sim(inf, AMAP, root)
    changed = sorted(p["label"] for p in s2["pieces"]["recipe"])
    check(changed == ["Recipe"], f"CLASS-level: only Recipe changed, not its file-mate Other (got {changed})")
    ex = s2["stages"]["execute"]["pieces"]
    check(ex.get("model:Recipe", {}).get("add") == 2, f"Recipe +2 (class-level add) (got {ex})")
    check("model:Other" not in ex, "the untouched file-mate is not in Execute")
    check(s2["stages"]["red"]["pieces"].get("model:Recipe", {}).get("cases") == ["C1"],
          "Red carries the phase's declared cases")
    check(s2["stages"]["commit"]["meta"]["cases"] == ["C1"], "Commit meta carries cases")
    # FIRE: change ONLY the OTHER class → the changed piece flips to Other, and
    # Recipe (unchanged this commit) drops out. Proves attribution tracks the real
    # class both ways, not "always the first model".
    (root / "m" / "recipe.py").write_text(
        "class Recipe:\n    id = 1\n    cupo_id = None\n    dish = None\n\nclass Other:\n    x = 1\n    y = 2\n")
    git("add", "-A"); git("commit", "-qm", "change Other only")
    sha2 = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=td, env=env,
                          capture_output=True, text=True).stdout.strip()
    inf2 = {**inf, "head": sha2, "work_source": sha2}
    s3 = _a3_sim.build_sim(inf2, AMAP, root)
    changed3 = sorted(p["label"] for p in s3["pieces"]["recipe"])
    check(changed3 == ["Other"],
          f"MUTATION: editing only Other flips the changed piece to Other, excludes Recipe (got {changed3})")

    # ── D · determinism (in-process) ──
    a = json.dumps(_a3_sim.build_sim(inf, AMAP, root), sort_keys=True)
    b = json.dumps(_a3_sim.build_sim(inf, AMAP, root), sort_keys=True)
    check(a == b, "byte-identical on a re-run (deterministic)")

    # ── E · rename normalization · born-new (untracked) files · intra_edges ──
    check(_a3_sim._unrename("m/{recipe => recipe2}.py") == "m/recipe2.py", "rename brace form → new path")
    check(_a3_sim._unrename("old.py => new.py") == "new.py", "rename arrow form → new path")
    check(_a3_sim._unrename("plain.py") == "plain.py", "non-rename path unchanged")

    # born-new: an UNTRACKED new model file → its class is a changed piece (whole file new)
    (root / "m" / "fresh.py").write_text("class Fresh:\n    a = 1\n    b = 2\n")   # NOT git-added
    AMAP2 = json.loads(json.dumps(AMAP))
    AMAP2["entities"]["recipe"]["models"].append(
        {"cls": "Fresh", "table": "fresh", "file": "m/fresh.py", "cols": [], "fks": {}})
    sd = _a3_sim.build_sim({"active": True, "touched": ["recipe"], "head": "h",
                            "last_commit": "wip", "work_source": "dirty", "phase": {"cases": []}},
                           AMAP2, root)
    check("Fresh" in [p["label"] for p in sd["pieces"]["recipe"]],
          "born-new UNTRACKED file → its model is a changed piece (git diff HEAD alone misses it)")
    check(sd["stages"]["execute"]["pieces"].get("model:Fresh", {}).get("add") == 3,
          "born-new: whole class counted as added (+3)")
    (root / "m" / "fresh.py").unlink()

    # intra_edges: two changed sibling models with an FK between them
    AMAP3 = json.loads(json.dumps(AMAP))
    AMAP3["entities"]["recipe"]["models"][1]["fks"] = {"rid": "recipes.id"}   # Other → Recipe
    (root / "m" / "recipe.py").write_text(
        "class Recipe:\n    id = 1\n    z = 2\n\nclass Other:\n    x = 1\n    rid = None\n")
    git("add", "-A"); git("commit", "-qm", "both siblings")
    shab = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=td, env=env,
                          capture_output=True, text=True).stdout.strip()
    si = _a3_sim.build_sim({**inf, "head": shab, "work_source": shab}, AMAP3, root)
    check(si["intra_edges"].get("recipe") == [{"source": "model:Other", "target": "model:Recipe"}],
          f"intra_edges couples the two changed siblings via FK (got {si['intra_edges']})")

# ── F · cross-process determinism (hash-seed independence) ──
_prog = ("import json,sys; sys.path.insert(0,%r); import _a3_sim; "
         "print(json.dumps(_a3_sim.build_sim(%r,%r,'.'),sort_keys=True))"
         % (gen,
            {"active": True, "touched": ["recipe"], "work_source": "none",
             "head": "h", "last_commit": "s", "phase": {"cases": ["C1"]}},
            AMAP))
_o0 = subprocess.run([sys.executable, "-c", _prog], env={**os.environ, "PYTHONHASHSEED": "0"},
                     capture_output=True, text=True).stdout
_o1 = subprocess.run([sys.executable, "-c", _prog], env={**os.environ, "PYTHONHASHSEED": "1"},
                     capture_output=True, text=True).stdout
check(_o0 == _o1 and _o0.strip().startswith("{"),
      "byte-identical across differing PYTHONHASHSEED (no set-order leak into output)")

print(f"sim battery: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY
