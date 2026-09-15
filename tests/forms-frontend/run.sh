#!/usr/bin/env bash
# Forms frontend battery — the FRONTEND arm's guards part (docs/design/element-forms/amendment-1.md §A2 Slice 11a): the
# extractor's flow run (GABE_FE_FLOW=1) read into guard forms — exits with the hook-member atoms that decide them, the
# endpoint field a data atom is decided by, the effects a guard's useEffect runs, one chain row per way a request ends
# through the guards mounted above, and the router topology (loops · exclusive · unproven · unknown · safe). The cases read
# the FROZEN flow capture of this directory's own fixture app (tests/frontend/fixture counts never move) and mutate it in
# memory to prove each case can FAIL; F16 re-derives the frozen capture LIVE when a typescript resolves, else it SKIPS by
# name. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"
HERE="$REPO/tests/forms-frontend"

TS_DIR="${GABE_TS_DIR:-}"
if [ -z "$TS_DIR" ]; then
  for c in /home/khujta/projects/apps/gustify/apps/web /home/khujta/projects/apps/gastify/web; do
    [ -d "$c/node_modules/typescript" ] && { TS_DIR="$c"; break; }
  done
fi

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0; skip=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

py() {  # py "<name>" <<'PY' … PY — the prelude gives FLOW · GRAPH · FORMS · run(flow) → (frontend, stats, findings) · G(fr, name) · at(rel, text, nth)
  local name="$1" src; src=$(cat)
  if (cd "$T" && PYTHONPATH="$GEN" HERE="$HERE" python3 - >"$T/py.txt" 2>&1 <<PY
import copy, json, os, re
from pathlib import Path
HERE = Path(os.environ["HERE"])
import _a3_fe as FE, _a3_fe_forms as FEF, _a3_forms as F, _a3_forms_build as B
FLOW = json.load(open(HERE / "flow.frozen.json"))
GRAPH = {"cross_edges": [{"kind": "bridge", "export": "fe:src/lib/useMe.ts#useMe", "to": "endpoint:GET /me", "via": "fetch"}]}
FORMS = {"present": True, "endpoints": {"endpoint:GET /me": {"declared": {"response_model": {"name": "MeResponse", "state": "defined"}}}},
         "schemas": {"schema:MeResponse": {"fields": [{"name": "setup_required"}]}}}
def run(flow=FLOW, forms=FORMS, graph=GRAPH):
    return FEF.guards_part(flow, FE.build_fe(flow, None), copy.deepcopy(forms), graph)
def G(fr, name):
    return next(v for k, v in fr["pieces"].items() if k.endswith("#" + name))
def at(rel, text, nth=1):
    hits = [i + 1 for i, l in enumerate((HERE / "fixture" / rel).read_text().splitlines()) if text in l]
    return f"{rel}:{hits[nth - 1]}"
$src
PY
  ); then ok; else bad "$name: $(tail -4 "$T/py.txt")"; fi
}

py "F1 · a guard's exits in order, the hook-member atoms that decide each, the endpoint field a data atom is decided by; SILENT on a component that never navigates" <<'PY'
fr, st, found = run()
g = G(fr, "RequireSetup")
f = "src/routes/RequireSetup.tsx"
assert [(x["kind"], x.get("to") or x.get("tag"), x["at"]) for x in g["exits"]] == [
    ("render", "Splash", at(f, "return <Splash />;", 1)), ("render", "Splash", at(f, "return <Splash />;", 2)),
    ("nav", "/setup", at(f, "return <Navigate")), ("outlet", "Outlet", at(f, "return <Outlet"))], g["exits"]
assert [(a["name"], a["neg"], a["class"], a["hook"]) for a in g["exits"][0]["when"]] == [("isPending", False, "pending", "fe:src/lib/useMe.ts#useMe")]
assert [(a["name"], a["neg"]) for a in g["exits"][3]["passed"]] == [("isPending", True), ("isError", True), ("data.setup_required", True)], g["exits"][3]["passed"]
assert g["exits"][2]["decided_by"] == {"endpoint": "endpoint:GET /me", "response_model": "MeResponse", "field": "setup_required", "state": "defined"}
assert all(re.fullmatch(r"x-[0-9a-f]{10}", x["id"]) for x in g["exits"]) and len({x["id"] for x in g["exits"]}) == 4
assert "fe:src/routes/screens.tsx#Home" not in fr["pieces"] and "fe:src/lib/useMe.ts#useMe" not in fr["pieces"], sorted(fr["pieces"])
assert G(fr, "RequireAuth")["exits"][1]["to"] == "/login?next=1" and "decided_by" not in G(fr, "RequireAuth")["exits"][1]
PY

py "F2 · effects: the calls a useEffect makes through a hook's binding join only the exits whose atoms they cover; a helper call inside them is no effect" <<'PY'
fr, _, _ = run()
g = G(fr, "RequireSetup")
e = g["effects"]
assert [(x["call"], x["hook"], x["lands"]) for x in e] == [("signOut", "fe:src/lib/useAuth.ts#useAuth", "unknown"), ("pushToast", "fe:src/store/ui.ts#useUiStore", "unknown")], e
assert g["exits"][1]["effects"] == [x["id"] for x in e] and not [x for i, x in enumerate(g["exits"]) if i != 1 and x.get("effects")], g["exits"]
assert [a["name"] for a in e[0]["when"] if "name" in a][:1] == ["isError"] and e[1]["when"][-1]["name"] == "isError"
PY

py "F3 · chain: one row per way a request ends — the outer guard's non-outlet exits, then this guard's exits through its outlet, one row per joined effect" <<'PY'
fr, st, _ = run()
g, auth = G(fr, "RequireSetup"), G(fr, "RequireAuth")
rows = g["chain"]
assert [r["guard"].rsplit("#", 1)[1] for r in rows] == ["RequireAuth"] * 2 + ["RequireSetup"] * 5, rows
outlet = next(x["id"] for x in auth["exits"] if x["kind"] == "outlet")
assert all(r["through"] == [] for r in rows[:2]) and all(r["through"] == [outlet] for r in rows[2:]), rows
assert [("effect" in r) for r in rows[2:]] == [False, True, True, False, False] and rows[-1].get("ready") is True and len({r["id"] for r in rows}) == 7
assert G(fr, "RequireAdmin")["mounts"] == 1 and len(G(fr, "RequireAdmin")["chain"]) == 2 + 3 + 2, G(fr, "RequireAdmin")["chain"]
PY

py "F4 · K3: a redirect whose target runs another guard that redirects back reads exclusive when the conditions contradict on one hook member; the guard stays safe" <<'PY'
fr, st, _ = run()
g = G(fr, "RequireSetup")
assert g["k3"]["state"] == "safe" and [(p["with"].rsplit("#", 1)[1], p["state"], p.get("on")) for p in g["k3"]["pairs"]] == [("RedirectIfSetupComplete", "exclusive", "data.setup_required")], g["k3"]
assert G(fr, "RedirectIfSetupComplete")["k3"]["state"] == "safe" and G(fr, "RedirectIfSetupComplete")["k3"]["pairs"][0]["with"].endswith("#RequireSetup")
assert G(fr, "RequireAuth")["k3"] == {"state": "safe", "targets": [{"exit": G(fr, "RequireAuth")["exits"][1]["id"], "to": "/login?next=1", "state": "safe"}]}
assert st["k3"] == {"loops": 1, "safe": 3, "unknown": 1, "unproven": 2} and st["routers"] == 1 and st["guards"] == 7, st
PY

py "F5 · redirect-loop FIRE: a guard that redirects into its own subtree; SILENT on every other guard" <<'PY'
fr, st, found = run()
assert G(fr, "RequireAdmin")["k3"]["state"] == "loops", G(fr, "RequireAdmin")["k3"]
assert [(x["id"], x["piece"], x["to"], x["slot"]) for x in found] == [("redirect-loop", "fe:src/routes/RequireAdmin.tsx#RequireAdmin", ["/admin"], "K3")], found
PY

py "F6 · unproven: two guards that redirect into each other on unrelated conditions; contradict one condition and the pair reads exclusive" <<'PY'
fr, _, _ = run()
assert G(fr, "GuardP")["k3"]["state"] == "unproven" and [p["state"] for p in G(fr, "GuardQ")["k3"]["pairs"]] == ["unproven"]
m = copy.deepcopy(FLOW)
body = m["byFile"]["src/routes/Pair.tsx"]["flow"]["bodies"]["GuardQ"]
body["rows"] = json.loads(json.dumps(body["rows"]).replace('"data.wants_p"', '"!data.wants_q"'))
fr2, _, _ = run(m)
assert G(fr2, "GuardP")["k3"] == {"state": "safe", "targets": [{"exit": G(fr2, "GuardP")["exits"][0]["id"], "to": "/q", "state": "safe"}],
                                 "pairs": [{"with": "fe:src/routes/Pair.tsx#GuardQ", "exit": G(fr2, "GuardQ")["exits"][0]["id"], "state": "exclusive", "on": "data.wants_q"}]}, G(fr2, "GuardP")["k3"]
PY

py "F7 · a thrown redirect in a beforeLoad is a guard; a target no route config holds is unknown; with no route config read every guard is unknown and nothing fires" <<'PY'
fr, _, _ = run()
r = fr["pieces"]["fe:src/routes/reports.tsx#Route"]
assert (r["via"], [(x["kind"], x.get("to")) for x in r["exits"]], r["k3"]["state"], r["chain"], r["mounts"]) == ("beforeLoad", [("nav", "/items")], "unknown", [], 0), r
m = copy.deepcopy(FLOW)
m["byFile"]["src/routes/router.tsx"]["flow"].pop("routes")
fr3, st3, found3 = run(m)
assert all(p["k3"] == {"state": "unknown", "reason": "no route config read"} for p in fr3["pieces"].values()) and found3 == [] and st3["routers"] == 0
PY

py "F8 · extend_frontend: unselected it touches nothing; an absent fe arm reads present:false; on a tree with no endpoint forms it still writes arms + frontend (D21); a raising part restores the feed" <<'PY'
os.environ["GABE_FORMS_ARMS"] = "none"
f0 = {"present": True, "endpoints": {}}
assert B.extend_frontend(copy.deepcopy(f0), {"present": True}, HERE / "fixture", {}) == f0
os.environ["GABE_FORMS_ARMS"] = "frontend"
f1 = B.extend_frontend({"present": True, "endpoints": {}}, {"present": False, "reason": "no web source"}, HERE / "fixture", {})
assert f1["arms"]["frontend"]["present"] is False and "the fe structure arm is absent: no web source" in f1["arms"]["frontend"]["reason"] and "frontend" not in f1, f1
B._flow = lambda repo: (FLOW, "ok")
fe_arm = {**FE.build_fe(FLOW, None), "present": True}
f2 = B.extend_frontend({"present": False, "reason": "no FastAPI endpoints"}, fe_arm, HERE / "fixture", {}, graph=GRAPH)
a = f2["arms"]["frontend"]
assert a["present"] is True and a["parts"]["guards"] == {"present": True, "reason": None} and a["parts"]["hooks"] == {"present": False, "reason": "not built yet (slice 11)"}, a
assert a["stats"]["guards"] == 7 and a["stats"]["findings"] == {"redirect-loop": 1} and a["bytes"] > 0 and sorted(f2["arms"]) == sorted(F.ARM_ORDER), a
assert f2["present"] is False and f2["arm_findings"]["frontend"][0]["id"] == "redirect-loop" and "fe:src/routes/RequireSetup.tsx#RequireSetup" in f2["frontend"]["pieces"]
B._flow = lambda repo: (None, "extractor timed out after 300s")
f4 = B.extend_frontend({"present": True, "endpoints": {}}, fe_arm, HERE / "fixture", {}, graph=GRAPH)
assert f4["arms"]["frontend"]["reason"] == "flow capture: extractor timed out after 300s" and "frontend" not in f4
B._flow = lambda repo: (FLOW, "ok")
real = FEF.guards_part
def boom(*a, **k):
    real(*a, **k)
    raise RuntimeError("guards down")
FEF.guards_part = boom
f3 = B.extend_frontend({"present": True, "endpoints": {"endpoint:GET /me": {}}}, fe_arm, HERE / "fixture", {}, graph=GRAPH)
assert f3["arms"]["frontend"]["present"] is False and "guards down" in f3["arms"]["frontend"]["reason"], f3["arms"]["frontend"]
assert "frontend" not in f3 and "arm_findings" not in f3 and f3["endpoints"] == {"endpoint:GET /me": {}}, sorted(f3)
FEF.guards_part = real
real_size = B._size
def size_boom(v):
    raise RuntimeError("size down")
B._size = size_boom                                   # fails AFTER frontend{} and the findings are written — the restore is what is proven
f5 = B.extend_frontend({"present": True, "endpoints": {}}, fe_arm, HERE / "fixture", {}, graph=GRAPH)
assert "size down" in f5["arms"]["frontend"]["reason"] and "frontend" not in f5 and "arm_findings" not in f5, sorted(f5)
B._size = real_size
PY

py "F9 · determinism: two runs are byte-identical" <<'PY'
assert json.dumps(run(), sort_keys=True) == json.dumps(run(), sort_keys=True)
PY

py "F15 · the structure arm never depends on flow: build_fe over the capture with and without its flow keys is identical" <<'PY'
plain = copy.deepcopy(FLOW)
for rec in plain["byFile"].values():
    rec.pop("flow", None)
assert json.dumps(FE.build_fe(FLOW, None), sort_keys=True) == json.dumps(FE.build_fe(plain, None), sort_keys=True)
PY

if [ -n "$TS_DIR" ]; then
  if (cd "$T" && GABE_TS_DIR="$TS_DIR" GABE_FE_FLOW=1 node "$GEN/_a3_fe_extract.mjs" "$HERE/fixture" "$T/flow.json" "$HERE/fixture" 2>/dev/null) \
     && cmp -s "$T/flow.json" "$HERE/flow.frozen.json"; then ok; else bad "F16 LIVE: GABE_FE_FLOW=1 re-derives flow.frozen.json byte for byte (typescript from $TS_DIR)"; fi
  if (cd "$T" && GABE_TS_DIR="$TS_DIR" node "$GEN/_a3_fe_extract.mjs" "$HERE/fixture" "$T/plain.json" "$HERE/fixture" 2>/dev/null) \
     && python3 - "$T/plain.json" "$HERE/flow.frozen.json" <<'PY'
import json, sys
plain, frozen = (json.load(open(x)) for x in sys.argv[1:3])
assert not [f for f, r in plain["byFile"].items() if "flow" in r], "the extractor emitted flow without the flag"
for r in frozen["byFile"].values():
    r.pop("flow", None)
assert plain == frozen, "without the flag the structure capture differs from the flow capture minus its flow keys"
PY
  then ok; else bad "F16 LIVE: without the flag the extractor emits no flow key and the same structure"; fi
else
  skip=$((skip+1)); echo "SKIP ⚠ F16 LIVE: no typescript resolves (set GABE_TS_DIR, or install a twin's web node_modules)"
fi

echo "forms-frontend: $pass passed, $fail failed, $skip skipped"
[ "$fail" -eq 0 ] || exit 1
