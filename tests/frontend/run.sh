#!/usr/bin/env bash
# _a3_fe battery — the FRONTEND arm's executable contract (compiler-proven pieces + typed wires).
#
# _a3_fe.build_fe turns the compiler extractor's JSON (_a3_fe_extract.mjs) into {pieces,
# edges, homes, stats}; _a3_graph.fold_fe rides it on GABE_C4 as a SEPARATE `fe` key.
# This battery proves, HERMETICALLY on the hand-enumerated fixture app (tests/frontend/fixture:
# route · 2 components · fetching hook · 2 stores · 2 types · 2 modules · story · barrel):
#   * CLASSIFICATION: every kind lands exactly once per the enumeration; the story + barrel
#     are EXCLUDED and COUNTED; helpers fold into ONE module piece per file.
#   * WIRES: renders · uses-hook · uses-store (both useContext + useXStore) · typed · fecall,
#     each resolved through the compiler's bindings (barrel + path alias followed); cross flag.
#   * SCREEN ABSORPTION: the fetch arm's `web:` node lands on the hook that fetches (sites).
#   * HONEST-EMPTY: GABE_FE_EXTRACT=0 · no web source · no typescript → present=False + reason;
#     fold_fe(fe=None) leaves GABE_C4 byte-identical; present=False → only stats.fe.
#   * DETERMINISM: byte-identical on a re-run (sorted inputs, index-triple wires).
#   * MUTATION: a JSX-less Pascal export is NOT a component (it folds into module + is counted).
#   * LIVE (when a `typescript` resolves — GABE_TS_DIR, else the twins' web node_modules):
#     the extractor re-derives the FROZEN fixture JSON byte-for-byte; else SKIPPED by name.
# FIRE and SILENT both exercised. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators"
FIX="$REPO/tests/frontend/fixture"

# where a `typescript` can be found for the LIVE case (first hit wins; none → skip, named)
TS_DIR="${GABE_TS_DIR:-}"
if [ -z "$TS_DIR" ]; then
  for c in /home/khujta/projects/apps/gustify/apps/web /home/khujta/projects/apps/gastify/web "$REPO/docs/design/graft-adoption/spike/_build"; do
    [ -d "$c/node_modules/typescript" ] && { TS_DIR="$c"; break; }
  done
fi

python3 - "$GEN" "$FIX" "$TS_DIR" <<'PY'
import sys, json, os, copy, subprocess, shutil
from pathlib import Path
gen, fix, ts_dir = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
sys.path.insert(0, gen)
import _a3_fe, _a3_web, _a3_graph

pass_ = 0; fail = 0; skipped = []
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

X = json.load(open(fix / "extract.frozen.json"))
screens = _a3_web.web_arm(fix, {}).get("screens") or []
check(len(screens) == 1 and screens[0]["id"] == "web:src/features/recipe/useRecipe",
      "fixture: the fetch arm sees exactly the one fetching hook as a screen")
fe = _a3_fe.build_fe(X, {"recipe": {}}, screens)
P = {p["id"]: p for p in fe["pieces"]}
kind = {p["name"]: p["kind"] for p in fe["pieces"]}
home = {p["name"]: p["home"] for p in fe["pieces"]}

# ── classification: the enumeration, exactly ──────────────────────────────────────────
check(fe["stats"]["pieces"] == 11, f"11 pieces from 12 files (got {fe['stats']['pieces']})")
check(fe["stats"]["by_kind"] == {"component": 2, "fe-type": 2, "hook": 1, "module": 2, "route": 2, "store": 2},
      f"by_kind matches the enumeration ({fe['stats']['by_kind']})")
check(kind.get("RecipeCard") == "component" and kind.get("Badge") == "component", "JSX-proven exports are components")
check(kind.get("useRecipe") == "hook", "a useX function is a hook")
check(kind.get("ThemeContext") == "store" and kind.get("useUiStore") == "store",
      "createContext() const AND a create()-built useXStore are stores (not hooks)")
check(kind.get("router") == "route" and kind.get("HomeRoute") == "route",
      "the router config (createBrowserRouter) + a JSX export under /routes/ are routes")
check(kind.get("Recipe") == "fe-type" and kind.get("RecipeProps") == "fe-type", "type + interface are fe-types")
check(kind.get("scoring") == "module" and sorted(P["fe:src/features/recipe/scoring.ts"]["exports"]) == ["WEIGHTS", "score"],
      "plain value exports fold into ONE module piece per file, exports listed")
check(kind.get("api") == "module", "the apiFetch definition file is a module (the fetch arm skips it; this arm draws it)")
check(fe["stats"]["excluded"]["stories"] == 1 and fe["stats"]["excluded"]["barrels"] == 1,
      "the story and the barrel are EXCLUDED and COUNTED")
check("Primary" not in kind and "index" not in kind, "no piece for a story export or a barrel")
# ── homing ─────────────────────────────────────────────────────────────────────────────
check(home.get("RecipeCard") == "recipe" and home.get("useRecipe") == "recipe", "features/recipe → the recipe entity")
check(home.get("Badge") == "design-system", "design-system → its own shared bucket")
check(home.get("ThemeContext") == "app-shell" and home.get("router") == "app-shell", "store/ + app/ → app-shell")
check({h["id"]: h["kind"] for h in fe["homes"]} == {"app-shell": "bucket", "design-system": "bucket", "recipe": "entity"},
      f"homes carry their kind (entity / bucket) ({fe['homes']})")
# ── wires: every rel, resolved through bindings (barrel + alias followed) ──────────────
E = {(fe["pieces"][a]["name"], fe["pieces"][b]["name"]): r for a, b, r in fe["edges"]}
check(E.get(("RecipeCard", "Badge")) == "renders", "JSX tag → renders (through the @design-system alias)")
check(E.get(("HomeRoute", "RecipeCard")) == "renders", "renders resolved THROUGH the barrel (features/recipe/index.ts)")
check(E.get(("router", "HomeRoute")) == "renders", "a route config's JSX element → renders")
check(E.get(("RecipeCard", "useRecipe")) == "uses-hook", "hook call → uses-hook")
check(E.get(("RecipeCard", "ThemeContext")) == "uses-store", "useContext(X) → uses-store")
check(E.get(("RecipeCard", "useUiStore")) == "uses-store", "a useXStore call → uses-store (not uses-hook)")
check(E.get(("RecipeCard", "RecipeProps")) == "typed" and E.get(("useRecipe", "Recipe")) == "typed", "type refs → typed")
check(E.get(("RecipeCard", "scoring")) == "fecall", "a call into a module's helper → fecall onto the MODULE piece")
check(E.get(("useRecipe", "api")) == "fecall", "apiFetch() → fecall onto the api module")
check(E.get(("scoring", "Recipe")) == "typed", "a module's type import → typed")
check(fe["stats"]["edges"] == 11 and fe["stats"]["by_rel"] == {"fecall": 2, "renders": 3, "typed": 3, "uses-hook": 1, "uses-store": 2},
      f"exactly the enumerated 11 wires ({fe['stats']['by_rel']})")
check(fe["stats"]["cross"] == 5, f"5 wires cross homes (got {fe['stats']['cross']})")
check(all(isinstance(e, list) and len(e) == 3 and isinstance(e[0], int) for e in fe["edges"]), "wires are COMPACT index triples")
check(fe["stats"]["unresolved"] == {"ext": 0, "no_piece": 0}, "nothing unresolved on the fixture")
# ── screen absorption ──────────────────────────────────────────────────────────────────
hook = P["fe:src/features/recipe/useRecipe.ts#useRecipe"]
check(hook.get("screen") == "web:src/features/recipe/useRecipe" and hook.get("sites") == 1,
      "the fetching hook carries the absorbed web node id + its fetch-site count")
check(fe["stats"]["screens_absorbed"] == 1, "screens_absorbed counts it")
check("screen" not in P["fe:src/features/recipe/RecipeCard.tsx#RecipeCard"], "a non-fetching piece carries no screen")
# ── determinism ────────────────────────────────────────────────────────────────────────
fe2 = _a3_fe.build_fe(json.loads(json.dumps(X)), {"recipe": {}}, screens)
check(json.dumps(fe, sort_keys=True) == json.dumps(fe2, sort_keys=True), "byte-identical on a re-run")
# ── MUTATION: a Pascal export WITHOUT JSX is not a component ──────────────────────────
Xm = copy.deepcopy(X)
for ex in Xm["byFile"]["src/design-system/Badge.tsx"]["exports"]:
    if ex["name"] == "Badge": ex["hasJsx"] = False; ex["jsx"] = []
fm = _a3_fe.build_fe(Xm, {"recipe": {}}, screens)
km = {p["name"]: p["kind"] for p in fm["pieces"]}
check(km.get("Badge") == "module" and fm["stats"]["excluded"]["pascal_no_jsx"] == 1,
      "MUTATION: JSX removed → Badge is a module piece (the file's value export) and pascal_no_jsx counts it")
Em = {(fm["pieces"][a]["name"], fm["pieces"][b]["name"]): r for a, b, r in fm["edges"]}
check(Em.get(("RecipeCard", "Badge")) == "renders", "MUTATION: the JSX tag still wires (renders) onto the module piece")
# ── the C4 fold ────────────────────────────────────────────────────────────────────────
base = {"version": 1, "stats": {"entities": 1}, "l2": {}}
check(json.dumps(_a3_graph.fold_fe(copy.deepcopy(base), None), sort_keys=True) == json.dumps(base, sort_keys=True),
      "fold_fe(None) leaves GABE_C4 byte-identical")
off = _a3_graph.fold_fe(copy.deepcopy(base), {"present": False, "reason": "no web source"})
check("fe" not in off and off["stats"]["fe"] == {"present": False, "reason": "no web source"},
      "present=False → only stats.fe names the absence")
on = _a3_graph.fold_fe(copy.deepcopy(base), {**fe, "present": True, "reason": "typescript x"})
check(sorted(on["fe"]) == ["edges", "homes", "pieces"] and on["stats"]["fe"]["present"] and on["stats"]["fe"]["pieces"] == 11,
      "present → the `fe` key (pieces · edges · homes) + stats.fe")
check("l2" in on and on["l2"] == {}, "the fold never touches l2")
# ── honest-empty arm states ────────────────────────────────────────────────────────────
os.environ["GABE_FE_EXTRACT"] = "0"
d = _a3_fe.fe_arm(fix, {"recipe": {}}, screens)
check(d == {"present": False, "reason": "extract disabled (GABE_FE_EXTRACT=0)"}, f"GABE_FE_EXTRACT=0 → disabled, named ({d})")
del os.environ["GABE_FE_EXTRACT"]
nw = _a3_fe.fe_arm(Path("/nonexistent-root"), {})
check(nw == {"present": False, "reason": "no web source"}, f"no web source → present=False, named ({nw})")
os.environ["GABE_TS_DIR"] = "/nonexistent-ts"
nts = _a3_fe.fe_arm(fix, {"recipe": {}}, screens)
check(nts.get("present") is False and "typescript not resolvable" in nts.get("reason", ""),
      f"no typescript → present=False with the extractor's reason ({nts})")
del os.environ["GABE_TS_DIR"]
# ── LIVE: the extractor re-derives the frozen JSON (when a typescript resolves) ─────────
if ts_dir and shutil.which("node"):
    os.environ["GABE_TS_DIR"] = ts_dir
    live = _a3_fe.fe_arm(fix, {"recipe": {}}, screens)
    del os.environ["GABE_TS_DIR"]
    check(live.get("present") is True, f"LIVE: the arm runs on the fixture ({live.get('reason')})")
    same = json.dumps({k: live.get(k) for k in ("pieces", "edges", "homes")}, sort_keys=True) == \
           json.dumps({k: fe[k] for k in ("pieces", "edges", "homes")}, sort_keys=True)
    check(same, "LIVE: the compiler pass re-derives the FROZEN fixture graph exactly (pieces · edges · homes)")
else:
    skipped.append("LIVE extractor case — no `typescript` resolvable (set GABE_TS_DIR)")

for s in skipped: print("  SKIP:", s)
print(f"frontend battery: {pass_} passed, {fail} failed" + (f", {len(skipped)} skipped" if skipped else ""))
sys.exit(1 if fail else 0)
PY
