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
import _a3_fe as FE, _a3_fe_controls as FEC, _a3_fe_forms as FEF, _a3_fe_reason as FER, _a3_forms as F, _a3_forms_build as B
FLOW = json.load(open(HERE / "flow.frozen.json"))
GRAPH = {"cross_edges": [{"kind": "bridge", "export": "fe:src/lib/useMe.ts#useMe", "to": "endpoint:GET /me", "via": "fetch"}]}
FORMS = {"present": True, "endpoints": {"endpoint:GET /me": {"declared": {"response_model": {"name": "MeResponse", "state": "defined"}}}},
         "schemas": {"schema:MeResponse": {"fields": [{"name": "setup_required"}]}}}
def run(flow=FLOW, forms=FORMS, graph=GRAPH):
    return FEF.guards_part(flow, FE.build_fe(flow, None), copy.deepcopy(forms), graph)
FORMS_R = {"present": True, "endpoints": {
    "endpoint:GET /me": {"produced": [{"id": "x:me401", "status": 401, "detail": "Not authenticated"}]},
    "endpoint:POST /setup/complete": {"produced": [{"id": "x:401", "status": 401, "detail": "Not authenticated"}, {"id": "x:inprog", "status": 409, "detail": "setup in progress"},
                                                   {"id": "x:consent", "status": 409, "detail": "consent required"}, {"id": "x:locked", "status": 423, "detail": "locked", "code": "setup_locked"},
                                                   {"id": "x:500", "status": 500}],
                                      "findings": [{"id": "shared-status", "slot": "U7", "status": 409, "details": ["consent required", "setup in progress"]}]},
    "endpoint:PATCH /settings": {"produced": [{"id": "x:422", "status": 422}]}}}
def reason(flow=FLOW, forms=FORMS_R):
    hooks, _ = FEF.hooks_part(flow, GRAPH)
    cl, _ = FEF.client_part(flow, HERE / "fixture", hooks)
    return FER.reason_part(flow, copy.deepcopy(forms), hooks, cl["transport"])
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
assert f2["arms"]["paths"]["reason"] == "switched off", f2["arms"]["paths"]          # V30: not selected → switched off …
os.environ["GABE_FORMS_ARMS"] = "all"
f2a = B.extend_frontend({"present": False, "reason": "no FastAPI endpoints"}, fe_arm, HERE / "fixture", {}, graph=GRAPH)
assert f2a["arms"]["paths"]["reason"].startswith("absent: no endpoint forms") and f2a["arms"]["frontend"]["present"] is True, f2a["arms"]["paths"]   # … selected but nothing to build on → absent, with why
os.environ["GABE_FORMS_ARMS"] = "frontend"
a = f2["arms"]["frontend"]
assert a["present"] is True and a["reason"] is None and all(o == {"present": True, "reason": None} for o in a["parts"].values()) and sorted(a["parts"]) == sorted(F.ARMS["frontend"]["parts"]), a
assert f2["frontend"]["pieces"]["fe:src/lib/useMe.ts#useMe"]["form"] == "hook" and f2["frontend"]["client"]["clients"] and a["stats"]["hooks"]["queries"] == 8, sorted(f2["frontend"])
assert a["stats"]["guards"] == 7 and a["stats"]["findings"] == {"action-uncalled": 1, "dead-control": 4, "no-rollback": 1, "redirect-loop": 1} and "fe:src/components/Views.tsx#SyncError" in f2["frontend"]["pieces"] and "fe:src/store/prefs.ts#usePrefsStore" in f2["frontend"]["stores"] and a["bytes"] > 0 and sorted(f2["arms"]) == sorted(F.ARM_ORDER), a
assert f2["present"] is False and f2["arm_findings"]["frontend"][0]["id"] == "redirect-loop" and "fe:src/routes/RequireSetup.tsx#RequireSetup" in f2["frontend"]["pieces"]
f6 = B.extend_frontend(copy.deepcopy(FORMS_R), fe_arm, HERE / "fixture", {}, graph=GRAPH)
assert f6["arms"]["frontend"]["stats"]["findings"] == {"action-uncalled": 1, "branch-unproduced": 1, "client-detail-unmatched": 1, "dead-control": 4, "no-rollback": 1, "reason-collapsed": 1, "redirect-loop": 1} and len(f6["frontend"]["reasons"]["sites"]) == 25, f6["arms"]["frontend"]["stats"]
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

py "F20 · FIRE+SILENT: routers 0 and mounts 0 beside a state word — the route config was read, or it was not" <<'PY'
g, gs, _ = run(flow=FLOW)
assert gs["route_config"] == "read" and gs["routers"] == 1, gs                       # SILENT: the fixture's router is read
bare = copy.deepcopy(FLOW)
for file, rec in list(bare["byFile"].items()):
    if (rec.get("flow") or {}).get("routes"):
        rec["flow"]["routes"] = []
g2, gs2, _ = run(flow=bare)
assert gs2["route_config"] == "no route config read" and gs2["routers"] == 0 and gs2["mounted"] == 0, gs2   # V40b: a zero with its reason
guards2 = list(g2["pieces"].values())
assert guards2 and all(x["mounts"] == 0 and x.get("mounts_state") == "no route config read" for x in guards2), guards2[:1]
assert all("mounts_state" not in x for x in g["pieces"].values()), "a read route config leaves no mounts_state"   # SILENT
PY

py "F9 · determinism: two runs are byte-identical" <<'PY'
assert json.dumps(run(), sort_keys=True) == json.dumps(run(), sort_keys=True)
PY

py "F10 · hooks: a query's resolved key (a factory, a parameter as *), its literal-path fetch and endpoint; a mutation's invalidations forwarded through .map and its cache seed; invalidated_by by TanStack prefix; an unresolvable key named" <<'PY'
graph = {"cross_edges": GRAPH["cross_edges"] + [{"kind": "bridge", "export": "fe:src/lib/useCompleteSetup.ts#useCompleteSetup", "to": "endpoint:POST /setup/complete", "via": "fetch"}]}
hooks, hs = FEF.hooks_part(FLOW, graph)
def call(name):
    return hooks[next(k for k in hooks if k.endswith("#" + name))]["calls"][0]
me, st, rc, lo, cs = call("useMe"), call("useSettings"), call("useRecipe"), call("useLoose"), call("useCompleteSetup")
assert (me["kind"], me["key"], [(f["method"], f["path"], f["wrapper"]) for f in me["fetch"]], me["endpoint"]) == ("query", ["me"], [("GET", "/api/v1/me", "fe:src/lib/api/client.ts#apiFetch")], "endpoint:GET /me"), me
assert [(b["hook"], b["key"], b["when"]) for b in me["invalidated_by"]] == [("fe:src/lib/useCompleteSetup.ts#useCompleteSetup", ["me"], "onSuccess")], me["invalidated_by"]
assert [(i["key"], i["when"], i["call"]) for i in cs["invalidates"]] == [(["me"], "onSuccess", "invalidateQueries"), (["settings"], "onSuccess", "invalidateQueries"), (["recipes"], "onSuccess", "invalidateQueries")], cs["invalidates"]
assert [s["key"] for s in cs["seeds"]] == [["me"]] and (cs["kind"], [(f["method"], f["path"]) for f in cs["fetch"]], cs["endpoint"]) == ("mutation", [("POST", "/api/v1/setup/complete")], "endpoint:POST /setup/complete"), cs
assert rc["key"] == ["recipes", "detail", "*"] and [b["key"] for b in rc["invalidated_by"]] == [["recipes"]] and [f["path"] for f in rc["fetch"]] == ["/api/v1/recipes/*"], rc
assert "key" not in lo and lo["key_unresolved"] == "KEY" and st["options"] == {"staleTime": 0} and [b["key"] for b in st["invalidated_by"]] == [["settings"]], (lo, st)
assert call("useThings")["key"] == ["things", "list"], call("useThings")
assert hs == {"queries": 8, "mutations": 7, "keys_unresolved": 3, "fetches": 13, "invalidations": 6, "seeds": 3, "invalidated_by": 6}, hs   # + useCards · useCardPair (§A4 fix 5)
tt = {c["at"]: c for c in hooks["fe:src/lib/useToggleThing.ts#useToggleThing"]["calls"]}   # three mutations in one body: each keeps its own callbacks
tf = "src/lib/useToggleThing.ts"
assert ([f["path"] for f in tt[at(tf, "const careless")]["fetch"]], tt[at(tf, "const careless")]["invalidates"], [s["key"] for s in tt[at(tf, "const contextual")]["seeds"]],
        [i["key"] for i in tt[at(tf, "const optimistic")]["invalidates"]]) == (["/api/v1/things/flag"], [], [["things", "pin"]], [["things", "list"]]), tt
assert "fe:src/routes/RequireSetup.tsx#RequireSetup" not in hooks
PY

py "F11 · client policy: a retry function summarised one level with its predicate's status comparisons; a set option defined; an unset option the library default with its source; a lock file below the read version, or none, unknown; the hook that overrides" <<'PY'
import shutil, tempfile
hooks, _ = FEF.hooks_part(FLOW, GRAPH)
cl, cs = FEF.client_part(FLOW, HERE / "fixture", hooks)
c = cl["clients"][0]
q, m = c["policy"]["queries"], c["policy"]["mutations"]
assert (c["at"], c["library"]) == (at("src/lib/query/client.ts", "return new QueryClient"), {"package": "@tanstack/query-core", "version": "5.100.6", "lock": "package-lock.json"}), c
assert q["retry"]["state"] == "defined" and q["retry"]["summary"]["branches"] == [
    {"returns": False, "when": ["isClientError(error)"], "means": ["value.status >= 400", "value.status < 500"]},
    {"returns": "failureCount < MAX_RETRIES", "compares": ["failureCount < 1"]}], q["retry"]
assert (q["staleTime"], q["refetchOnReconnect"], m["retry"]) == ({"state": "defined", "value": 30000}, {"state": "defined", "value": True}, {"state": "defined", "value": False})
assert q["refetchOnWindowFocus"] == {"state": "default", "value": True, "source": "@tanstack/query-core/src/queryObserver.ts:786"} and (q["gcTime"]["state"], q["gcTime"]["value"]) == ("default", 300000), q
assert c["hook_overrides"] == [{"hook": "fe:src/lib/useSettings.ts#useSettings", "option": "staleTime"}] and cs["policy_unknown"] == 0 and cs["clients"] == 2, cs
mc = cl["clients"][1]
assert (mc["at"], mc["fn"], mc["policy"]["queries"]["staleTime"], mc["policy"]["queries"]["retry"]["state"], mc["policy"]["mutations"]["retry"]["value"]) == (
    at("src/lib/query/moduleClient.ts", "new QueryClient"), "src/lib/query/moduleClient.ts::<module>", {"state": "defined", "value": 5000}, "default", 0), mc
d = Path(tempfile.mkdtemp()) / "fx"
shutil.copytree(HERE / "fixture", d)
(d / "package-lock.json").write_text('{"packages": {"node_modules/@tanstack/query-core": {"version": "5.0.0"}}}')
cl2, cs2 = FEF.client_part(FLOW, d, hooks)
assert cl2["clients"][0]["policy"]["queries"]["gcTime"] == {"state": "unknown", "reason": "@tanstack/query-core 5.0.0 predates 5.100.6"} and cs2["policy_unknown"] == 2 + 5, cl2["clients"][0]["policy"]
(d / "package-lock.json").unlink()
cl3, _ = FEF.client_part(FLOW, d, hooks)
assert cl3["clients"][0]["policy"]["queries"]["refetchOnWindowFocus"] == {"state": "unknown", "reason": "no lock file names @tanstack/query-core"}
PY

py "F12 · transport: the wrapper's file, every .status comparison and throw in it with the conditions above" <<'PY'
hooks, _ = FEF.hooks_part(FLOW, GRAPH)
cl, cs = FEF.client_part(FLOW, HERE / "fixture", hooks)
t, f = cl["transport"], "src/lib/api/client.ts"
assert sorted(t) == [f, "src/lib/api/openapi.ts"] and t[f]["wrappers"] == ["fe:src/lib/api/client.ts#apiFetch"], t   # openapi.ts: a verb-named client, no status branch
assert [(b["fn"], b.get("status"), b.get("throws"), b["when"], b.get("ctx"), b["at"]) for b in t[f]["branches"]] == [
    ("apiFetch", 503, None, [], "callback:then", at(f, "r.status === 503")), ("apiFetch", None, "new ApiError(503)", ["r.status === 503"], "callback:then", at(f, "throw new ApiError(503)")),
    ("apiFetch", 401, None, [], None, at(f, "response.status === 401")), ("apiFetch", None, "new ApiError(response.status)", ["!response.ok"], None, at(f, "throw new ApiError(response.status)"))], t[f]["branches"]
assert (cs["wrappers"], cs["transport_branches"]) == (2, 4), cs
PY

py "F19 · FIRE+SILENT: a verb-named client call carries its verb; a named onSuccess callback — a local arrow, or a function another hook returned — yields its invalidations; useQueries says why it has no key" <<'PY'
hooks, hs = FEF.hooks_part(FLOW, {"cross_edges": []})
def call(name):
    return hooks[next(k for k in hooks if k.endswith("#" + name))]["calls"][0]
pc, pc2, cards, pair, two = call("usePatchCard"), call("usePatchCardTwo"), call("useCards"), call("useCardPair"), call("useCardTwo")
assert [(x["method"], x["path"]) for x in pc["fetch"]] == [("PATCH", "/api/v1/cards/1")], pc["fetch"]            # V13: apiClient.PATCH
assert [(x["method"], x["path"]) for x in cards["fetch"]] == [("GET", "/api/v1/cards")], cards["fetch"]           # SILENT: GET stays GET
assert [(i["key"], i["when"]) for i in pc["invalidates"]] == [(["cards"], "onSuccess")], pc["invalidates"]         # V14: `onSuccess: handleSaved`
assert [(i["key"], i["when"]) for i in pc2["invalidates"]] == [(["cards"], "onSuccess")], pc2["invalidates"]       # V14: `onSuccess: invalidate` (another hook's return)
assert "key" not in pair and pair["key_unresolved"] == "useQueries: entries are not literal", pair                # V28: a reason, never null
assert "key" not in two and two["key_unresolved"] == "useQueries: 2 entries, keys per entry", two
sv = call("useSaveSettings")
assert [(x["method"], x["path"]) for x in sv["fetch"]] == [("PATCH", "/api/v1/settings")], sv["fetch"]              # SILENT: opts.method still wins
PY

py "F13 · reason map: each status, detail or code comparison walked back to the requests its receiver holds — a hook value through an alias, a parameter's call sites, a caught error's try block, a mutate onError, a component prop — and each endpoint's exits routed to the first site that covers them" <<'PY'
r, rs, _ = reason()
f = "src/routes/SetupForm.tsx"
S = {s["at"]: s for s in r["sites"]}
s409 = S[at(f, "error.status === 409) return")]
assert (s409["reads"], s409["value"], s409["branch"], s409["endpoints"]) == ("status", 409, "none", ["endpoint:PATCH /settings", "endpoint:POST /setup/complete"]), s409
assert sorted((o["kind"], tuple(o["endpoints"])) for o in s409["origins"]) == [("catch", ()), ("hook", ("endpoint:PATCH /settings",)), ("hook", ("endpoint:POST /setup/complete",))], s409["origins"]
cm = S[at(f, "error.status === 409) {")]
assert (cm["branch"], cm["endpoints"], [o["kind"] for o in cm["origins"]]) == ("reads", ["endpoint:POST /setup/complete"], ["hook", "hook"]), cm
assert sorted(len(o["via"]) for o in cm["origins"]) == [3, 4] and any(v == at(f, "useRetrySetup({ mutation: complete })") for o in cm["origins"] for v in o["via"]), cm["origins"]
eb = S[at(f, 'error.code === "setup_locked"')]
assert (eb["reads"], eb["endpoints"], eb["origins"][0]["kind"]) == ("code", ["endpoint:POST /setup/complete"], "hook"), eb
me = S[at(f, "me.error.status === 401")]
assert (me["branch"], me["endpoints"]) == ("value", ["endpoint:GET /me"]), me
rq = S[at("src/routes/RequireSetup.tsx", ".status === 401")]
assert (rq["receiver"], rq["branch"], rq["endpoints"], rq["origins"][0]["kind"]) == ("error", "none", ["endpoint:GET /me"], "hook"), rq
un = S[at("src/lib/api/errors.ts", "value.status >= 400")]
assert (un["endpoints"], un["origins"][0]["kind"], un["origins"][0]["reason"]) == ([], "unknown", "no call site passes error"), un
rd = {(x["fn"], x["receiver"]): x for x in r["readers"]["endpoint:POST /setup/complete"]}
assert sorted(rd) == [("ErrorBody", "error"), ("SetupFailure", "complete.error"), ("conflictMessage", "error"), ("setupErrorMessage", "error")], sorted(rd)
assert {x["exit"]: x["site"] for x in rd[("setupErrorMessage", "error")]["routes"]} == {"x:401": "rest", "x:inprog": s409["id"], "x:consent": s409["id"], "x:locked": "rest", "x:500": "rest"}
assert {x["exit"]: x["site"] for x in rd[("ErrorBody", "error")]["routes"]}["x:locked"] == eb["id"]
assert not [s for s in r["sites"] if s["at"].startswith("src/lib/api/client.ts")] and all(re.fullmatch(r"r-[0-9a-f]{10}", s["id"]) for s in r["sites"])
lm, sv = S[at(f, "res.status === 401")], S[at(f, "response.status === 422")]
assert [(o["kind"], o["endpoints"]) for o in lm["origins"]] == [("fetch", ["endpoint:GET /me"])] and [(o["kind"], o["endpoints"]) for o in sv["origins"]] == [("fetch", ["endpoint:PATCH /settings"])], (lm, sv)
does_stats = rs.pop("does")                          # Slice 11e adds ONE stats key; the nine before it keep their meaning (F21 reads the new one)
assert rs == {"sites": 25, "reads_status": 22, "reads_detail": 1, "reads_code": 2, "joined": 14, "unknown": 11, "endpoints": 3, "routed": 12, "rest": 13}, rs   # SetupFailureEdges adds 8 comparisons on a plain parameter: no request reached, the routing stays put
assert json.dumps(reason(), sort_keys=True) == json.dumps(reason(), sort_keys=True), "the reason part is deterministic"
assert len([s for s in r["sites"] if s["at"].startswith("src/store/session.ts")]) == 1, "a store action's comparison is counted once, not again in its action body"
PY

py "F21 · what a reason branch DOES (Slice 11e), from the REAL capture — FIRE: a returned literal, a read detail, a rendered element, a quoted detail site, a call classed by its binder, and one row per class in walk order; SILENT: a comparison that picks a value, one handed back to the caller, a store action, the transport file" <<'PY'
r, rs, _ = reason()
S = {s["at"]: s for s in r["sites"]}
f, g = "src/routes/SetupForm.tsx", "src/routes/SetupFailure.tsx"
cls = lambda s: [d["class"] for d in s["does"]]
s409 = S[at(f, "error.status === 409) return")]
assert [(d["class"], d.get("literal")) for d in s409["does"]] == [("return", "setup in progress")] and s409["branch"] == "none" and s409["does_state"] == "read", s409
cm = S[at(f, "error.status === 409) {")]
assert cm["branch"] == "reads" and cls(cm) == ["return"] and cm["does"][0]["reads"] == ["detail"], cm                     # the word is untouched; the row carries its evidence
eb = S[at(f, 'error.code === "setup_locked"')]
assert [(d["class"], d["k"], d.get("tag")) for d in eb["does"]] == [("render", "ret", "p")] and "branch" not in eb, eb     # a code site has no word, and now has rows: ONE row for a returned tree
dt = next(s for s in r["sites"] if s["reads"] == "detail")
assert [(d["class"], d.get("literal")) for d in dt["does"]] == [("return", "consent")] and dt["does_state"] == "read", dt   # the QUOTED pattern: a detail site finds its branch
rq = S[at("src/routes/RequireSetup.tsx", ".status === 401")]
assert [(d["class"], d["callee"], d.get("from")) for d in rq["does"]] == [("other", "signOut", "bind:useAuth")] and rq["ctx"] == ["callback:useEffect"], rq
assert not [d for d in rq["does"] if d.get("callee") == "pushToast"], "a row under the NEGATED guard is not the branch's"
a, b, c = S[at(g, "status === 401")], S[at(g, "status === LOCKED")], S[at(g, "status === 500")]
assert [(d["class"], d.get("to"), d.get("from"), d.get("bare")) for d in a["does"]] == [("navigate", "/login", "bind:useNavigate", None), ("return", None, None, True)], a["does"]
assert [(d["class"], d["how"], d.get("by")) for d in b["does"]] == [("retry", "mutate", "name")] and b["value"] == 423, b["does"]   # a named constant: the row belongs to the NEAREST comparison, and says it matched by name
assert cls(c) == ["surface", "message", "refresh", "refresh", "state", "log", "request", "other", "state", "throw"], cls(c)
by = {d["class"] + str(i): d for i, d in enumerate(c["does"])}
assert (by["surface0"]["level"], by["message1"]["key"], by["message1"]["from"]) == ("error", "failed", "bind:useTranslations"), c["does"][:2]
assert (by["refresh2"]["how"], by["refresh2"]["key"], by["refresh3"]["how"]) == ("invalidate", ["me"], "refetch"), c["does"][2:4]      # another request's refetch is a refresh, never a retry
assert (by["request6"]["method"], by["request6"]["endpoint"]) == ("GET", "endpoint:GET /me") and by["state8"]["in"] == ["callback:setTimeout"] and by["state8"]["returned"] is True, c["does"][6:9]
assert (by["throw9"]["callee"], by["throw9"]["args"]) == ("Error", ["failed"]) and not [d for d in c["does"] if d["k"] == "new"], c["does"][-1]   # the thrown `new Error(…)` is the throw's own row
me = S[at(f, "me.error.status === 401")]
assert (me["does"], me["does_state"], me["branch"]) == ([], "no-rows", "value"), me                                        # SILENT: a comparison that picks a value
assert [s["does_state"] for s in r["sites"] if s["at"].startswith("src/lib/api/errors.ts")] == ["beyond one level"] * 2    # SILENT: handed back to the caller, who decides — not followed
assert [(s["does"], s["does_state"]) for s in r["sites"] if s["at"].startswith("src/store/session.ts")] == [([], "no-rows")]  # SILENT: a value inside a call's argument is not a comparison handed back
assert not [s for s in r["sites"] if s["at"].startswith("src/lib/api/client.ts")]
assert all(d["class"] in FER.FF.DOES_CLASSES and d["at"].startswith(s["piece"][3:].split("#")[0] + ":") for s in r["sites"] for d in s["does"]) and all(s["does_state"] in FER.FF.DOES_STATES for s in r["sites"])
assert all((s["does_state"] in ("read", "mixed")) == bool(s["does"]) for s in r["sites"]), "a state word that says rows were read means rows"
ds = rs["does"]
assert ds["rows"] == sum(len(s["does"]) for s in r["sites"]) and sorted(ds["sites"]) == sorted(FER.FF.DOES_STATES) and sorted(ds["classes"]) == sorted(FER.FF.DOES_CLASSES) and sum(ds["sites"].values()) == len(r["sites"]) and ds["narrowed"] == 2, ds
# the shapes the review of the four dry-run feeds found (SetupFailureEdges.tsx) — each row pinned WHOLE, so a stray `when`, `in`, `passes` or `returned` fails
e = "src/routes/SetupFailureEdges.tsx"
E = lambda text, nth=1: S[at(e, text, nth)]
picks, effect = E("failure.status === 403", 1), E("failure.status === 403", 2)
assert (picks["does"], picks["does_state"], picks.get("ctx")) == ([], "no-rows", None), picks                              # SILENT: it picks a value and opens no branch — the identical `if` in the effect owns its rows
assert effect["does"] == [{"k": "call", "at": at(e, "onRetry();"), "callee": "onRetry", "from": "param", "class": "other"}] and effect["ctx"] == ["callback:useEffect"], effect   # a destructured props parameter IS a parameter
assert [s["does_state"] for s in r["sites"] if s["at"] == at(e, "f.status === 401")] == ["beyond one level"] * 2            # grouping parentheses are not a call: still the function's own answer
assert E("failure.status === 503")["does"] == [{"k": "call", "at": at(e, "refetch();"), "callee": "refetch", "from": "bind:useMe", "class": "refresh", "how": "refetch"}]   # a destructured member is its binder's; on a plain parameter's comparison it is another request's
assert E("failure.status === 409")["does"] == [{"k": "new", "at": at(e, 'return new Response("")'), "callee": "Response", "args": [""], "class": "other", "returned": True}]   # `return new X()` is ONE row
assert E("failure.status === 410")["does"] == [{"k": "call", "at": at(e, "return NextResponse.redirect("), "callee": "NextResponse.redirect", "class": "navigate", "to": "/auth/create-account", "returned": True}]   # the wrapped `new URL("/…")` feeds `to` and is not a row
w = E("failure.status === 502")["does"]
assert [(d["callee"], d.get("from"), d["class"]) for d in w[:2]] == [("res .json() .catch", "param", "other"), ("res .json", "param", "other")], w[:2]   # a wrapped chain keeps its text and finds its name
assert (w[2]["class"], w[2]["in"]) == ("return", ["callback:catch"]) and (w[3]["class"], w[3]["callee"], w[3].get("clipped"), len(w[3]["value"])) == ("throw", "Error", True, 80) and len(w) == 4, w[2:]
assert not [d for s in r["sites"] for d in s["does"] if d.get("clipped") and "value" not in d and "callee" not in d], "clipped sits on a row that carries the clipped text"
PY

py "F22 · the class comes from the BINDER and the request, never from a local name — mutants: a renamed navigation hook, a fetch aimed at the site's own endpoint, a mutate on another request, a swapped guard polarity" <<'PY'
g = "src/routes/SetupFailure.tsx"
def does(flow, text):
    r, _, _ = reason(flow)
    return next(s for s in r["sites"] if s["at"] == at(g, text))["does"]
def mut(fn):
    m = copy.deepcopy(FLOW); fn(m["byFile"][g]["flow"]["bodies"]["SetupFailure"]["rows"]); return m
def rename_hook(rows):
    next(x for x in rows if x.get("callee") == "useNavigate")["callee"] = "useNav"
assert [d["class"] for d in does(mut(rename_hook), "status === 401")] == ["other", "return"], "a local called `navigate` is only a name: without the library binder it is class other"
def aim_fetch(rows):
    x = next(x for x in rows if x.get("callee") == "fetch"); x["args"] = ["/api/v1/setup/complete"]; x["opts"] = {"method": "POST"}; x["props"] = {"method": "POST"}
got = [d for d in does(mut(aim_fetch), "status === 500") if d.get("callee") == "fetch"]
assert [(d["class"], d["how"]) for d in got] == [("retry", "fetch")], got                                       # the SAME request sent again is a retry …
def other_mutation(rows):
    next(x for x in rows if x.get("callee") == "complete.mutate")["callee"] = "save.mutate"
assert [d["class"] for d in does(mut(other_mutation), "status === LOCKED")] == ["request"], "… and a mutate on ANOTHER request is a request"
def flip(rows):
    for x in rows:
        for gd in x.get("guards") or []:
            if gd["pred"].endswith("=== 500"): gd["neg"] = True
r2, _, _ = reason(mut(flip))
s500 = next(s for s in r2["sites"] if s["at"] == at(g, "status === 500"))
assert s500["does"] == [] and s500["does_state"] in ("no-rows", "empty"), "rows under the ELSE arm are not the branch's"
def retest(rows):                                                                                               # `else { if (same comparison) { … } }` — the rows are the NESTED comparison's
    for x in rows:
        gs = x.get("guards") or []
        if gs and gs[0]["pred"].endswith("=== 500"): x["guards"] = [{"pred": gs[0]["pred"], "neg": True}, *gs]
assert does(mut(retest), "status === 500") == [], "a row whose guard AT THE SITE'S DEPTH is negated is not the branch's, whatever a deeper guard says"
def nav_prop(rows):                                                                                             # `navigate` handed in as a prop, aimed at a path that happens to be an endpoint's
    next(x for x in rows if x.get("callee") == "useNavigate")["callee"] = "useNav"
    next(x for x in rows if x.get("callee") == "navigate")["args"] = ["/me"]
assert [(d["class"], d.get("endpoint")) for d in does(mut(nav_prop), "status === 401")] == [("other", None), ("return", None)], "a literal path alone is never a request, even when it joins an endpoint"
def deeper(rows):
    next(x for x in rows if x.get("callee") == "console.warn")["guards"].append({"pred": "verbose"})
got = {d.get("callee"): d.get("when") for d in does(mut(deeper), "status === 500")}
assert got["console.warn"] == [{"pred": "verbose"}] and got["toast.error"] is None, got                          # `when` is what ELSE must hold, never the branch condition itself
e = "src/routes/SetupFailureEdges.tsx"
def edges(fn):
    m = copy.deepcopy(FLOW); fn(m["byFile"][e]["flow"]["bodies"]["SetupFailureEdges"]["rows"]); return m
def site(flow, text, nth=1):
    r, _, _ = reason(flow)
    return next(s for s in r["sites"] if s["at"] == at(e, text, nth))
def swap_receiver(rows):                                                                                        # the design's own example: `const { error, refetch } = useMe()` … `if (error?.status === 503) refetch()`
    for x in rows:
        if x.get("left") == "failure.status" and x.get("right") == 503: x["left"] = "error?.status"
        for gd in x.get("guards") or []:
            if gd["pred"] == "failure.status === 503": gd["pred"] = "error?.status === 503"
assert [(d["class"], d["how"]) for d in site(edges(swap_receiver), "failure.status === 503")["does"]] == [("retry", "refetch")], "the comparison's receiver and the refetch come from ONE call: the same request again"
def only_lets(rows):
    for x in rows:
        if x.get("callee") == "onRetry": x["k"] = "let"
assert (site(edges(only_lets), "failure.status === 403", 2)["does"], site(edges(only_lets), "failure.status === 403", 2)["does_state"]) == ([], "empty")
def long_guard(rows):
    for x in rows:
        if x.get("callee") == "onRetry": x["guards"] = [{"pred": "a" * 130}]
assert site(edges(long_guard), "failure.status === 403", 2)["does_state"] == "unread"
def flood(rows):
    i, x = next((i, x) for i, x in enumerate(rows) if x.get("callee") == "onRetry")
    rows[i:i] = [copy.deepcopy(x) for _ in range(29)]
s30 = site(edges(flood), "failure.status === 403", 2)
assert (len(s30["does"]), s30["does_more"], s30["does_state"]) == (24, 6, "read"), s30["does_more"]
def same_line(rows):
    i, x = next((i, x) for i, x in enumerate(rows) if x["k"] == "cmp" and x.get("right") == 503)
    rows.insert(i + 1, copy.deepcopy(x))
r9, _, _ = reason(edges(same_line))
assert [(s["does_state"], len(s["does"])) for s in r9["sites"] if s["at"] == at(e, "failure.status === 503")] == [("mixed", 1)] * 2, "two that read the same on ONE line share the rows, and say so"
def apart(rows):                                                                                                # the same comparison twice, on two lines: each owns its rows
    for x in rows:
        if x.get("right") == 409 and x["k"] == "cmp": x["right"] = 503
        for gd in x.get("guards") or []:
            if gd["pred"] == "failure.status === 409": gd["pred"] = "failure.status === 503"
        x["after"] = [a for a in x.get("after") or [] if a["pred"] != "failure.status === 409"]
r8, _, _ = reason(edges(apart))
assert [[d["callee"] for d in s["does"]] for s in r8["sites"] if s["value"] == 503] == [["refetch"], ["Response"]] and all(s["does_state"] == "read" for s in r8["sites"] if s["value"] == 503), "line order parts two identical branches"
PY

py "F23 · arms only add (Slice 11e): with the new keys stripped, the reason part over the capture is byte-equal to a reading with no does[] — the word, the ids, the origins, the routes and the findings never move" <<'PY'
r, rs, found = reason()
keep = copy.deepcopy(r)
for s in keep["sites"]:
    for k in ("does", "does_state", "does_more", "ctx"): s.pop(k, None)
ids = [s["id"] for s in r["sites"]]
assert len(set(ids)) == len(ids) and all(set(s) <= {"id", "piece", "at", "receiver", "reads", "op", "value", "classified", "branch", "origins", "endpoints"} for s in keep["sites"]), "a site carries only the Slice 11c keys once the new ones are stripped"
saved, FER._does = FER._does, (lambda *a, **k: ([], "no-rows", False, 0))          # the reading with the new pass switched off
try:
    r0, rs0, found0 = reason()
finally:
    FER._does = saved
for s in r0["sites"]:
    for k in ("does", "does_state", "does_more", "ctx"): s.pop(k, None)
rs.pop("does"); rs0.pop("does")
assert json.dumps([keep, rs, found], sort_keys=True) == json.dumps([r0, rs0, found0], sort_keys=True)
g = "src/routes/SetupFailure.tsx"                                                                              # the WORD rests on the Slice 11c textual selection, never on the narrowed rows
m = copy.deepcopy(FLOW)
x = next(x for x in m["byFile"][g]["flow"]["bodies"]["SetupFailure"]["rows"] if x.get("callee") == "complete.mutate")
x["guards"], x["refs"] = [{"pred": "complete.error?.status === 401"}], ["complete.error.detail"]              # a dead twin AFTER the 401 branch returned, reading the detail
r1, rs1, _ = reason(m)
s401 = next(s for s in r1["sites"] if s["at"] == at(g, "status === 401"))
assert s401["branch"] == "reads" and [d["class"] for d in s401["does"]] == ["navigate", "return"], s401      # the word says reads (the textual selection holds the twin); the rows do not carry the twin
PY

py "F14 · reason findings FIRE: a status-only branch on a shared status, a status no reached endpoint produces, a code no exit says; SILENT on a branch that reads the detail, a status with no shared-status, a site that reaches no endpoint" <<'PY'
_, _, found = reason()
f = "src/routes/SetupForm.tsx"
assert [(x["id"], x["at"], x.get("endpoint"), x.get("status") or x.get("value")) for x in found] == [
    ("branch-unproduced", at(f, "error.status === 418"), None, 418),
    ("client-detail-unmatched", at(f, '"no_such_code"'), None, "no_such_code"),
    ("reason-collapsed", at(f, "error.status === 409) return"), "endpoint:POST /setup/complete", 409)], found
assert found[2]["details"] == ["consent required", "setup in progress"] and found[0]["endpoints"] == ["endpoint:PATCH /settings", "endpoint:POST /setup/complete"], found
m = copy.deepcopy(FORMS_R)
m["endpoints"]["endpoint:POST /setup/complete"].pop("findings")
assert [x["id"] for x in reason(forms=m)[2]] == ["branch-unproduced", "client-detail-unmatched"]
m["endpoints"]["endpoint:GET /me"]["findings"] = [{"id": "shared-status", "status": 401, "details": ["Not authenticated", "token expired"]}]
got = [(x["at"], x["endpoint"]) for x in reason(forms=m)[2] if x["id"] == "reason-collapsed"]
assert got == [(at("src/routes/RequireSetup.tsx", ".status === 401"), "endpoint:GET /me"), (at(f, "res.status === 401"), "endpoint:GET /me"), (at(f, "me.error.status === 401"), "endpoint:GET /me")], got
assert reason(forms={"present": True, "endpoints": {}})[2] == []
m2 = copy.deepcopy(FORMS_R)                           # an exit whose status an app handler sets at runtime: nothing is provably absent
m2["endpoints"]["endpoint:PATCH /settings"]["produced"].append({"id": "x:rt", "status": None, "form": "dynamic", "detail": "handler"})
assert [x["id"] for x in reason(forms=m2)[2]] == ["reason-collapsed"], reason(forms=m2)[2]
m3 = copy.deepcopy(FORMS_R)                           # a runtime detail text: an unmatched literal proves nothing, a missing status still does
m3["endpoints"]["endpoint:POST /setup/complete"]["produced"].append({"id": "x:dyn", "status": 409, "detail": "str(exc)", "form": "dynamic"})
assert [x["id"] for x in reason(forms=m3)[2]] == ["branch-unproduced", "reason-collapsed"], reason(forms=m3)[2]
PY

py "F17 · controls: a button with no handler is dead, an empty handler or a parameter a call site omits maybe-dead, a submit with no form maybe-dead, disabled and spread said, a link with href live; a control component's own element is its definition" <<'PY'
fr, cs, found = FEC.controls_part(FLOW, FE.build_fe(FLOW, None))
v = "src/components/Views.tsx"
C = {c["at"]: c for p in fr.values() for c in p["controls"]}
def st(text, f=v):
    c = C[at(f, text)]
    return (c["state"], c.get("reason"))
assert (st("<Button>Retry"), st("<Button>Connect"), st("<a>Nowhere")) == (("dead", None),) * 3
assert st("Offline") == ("maybe-dead", "the handler does nothing") and st("onClick={onRetry}") == ("maybe-dead", "1 of 2 call sites omit onRetry")
assert st("onClick={onAdd}") == ("live", None) and st("onClick={onMore}") == ("live", None), "a button rendered only when its handler is given is live"
assert st("<Panel compact") == ("maybe-dead", "renders its control only when !compact") and st("{...{ title")[0] == "unknown"
assert st('type="submit"') == ("maybe-dead", "a submit button with no form handler in this body") and st("<Button disabled>") == ("disabled", None)
assert st('href="/help"') == ("live", None) and st("{...(extra")[0] == "unknown" and st("<button onClick", "src/components/PrefsPanel.tsx") == ("live", None)
assert (st('message="saved"'), st('message="gone"')) == (("live", None), ("dead", None)), "a component that passes onDismiss to its button is judged by onDismiss"
assert not [a for a in C if a.startswith(("src/components/Button.tsx", "src/components/Views.stories.tsx")) or a in (at(v, "<button onClick={onDismiss}>"), at(v, "<button onClick={onClose}>"), at(v, "<Menu items"))] and C[at(v, "<Button>Connect")]["when"] == ["!onAdd"], sorted(C)
assert sorted((x["id"], x["at"]) for x in found) == sorted([("dead-control", at(v, t)) for t in ("<Button>Retry", "<Button>Connect", "<a>Nowhere", 'message="gone"')]), found
assert st("<button>toggle") == ("live", "<CollapsibleTrigger asChild> supplies its handler") and st("<button>x</button>") == ("live", "its parent <span> handles the click")
assert st('<button type="submit">save') == ("live", "submits the form in this body") and st("<a {...extra}>")[0] == "unknown" and at(v, "<Popup />") not in C, "a spread of a local object is no pass-through"
assert at(v, "<ActionBar actions") not in C and st("<button {...props} onClick={action.onPick}>")[0] == "unknown", "a spread onto a button with its own handler is no pass-through"
assert cs == {"controls": 21, "components": 3, "live": 8, "maybe-dead": 4, "dead": 4, "disabled": 1, "unknown": 4}, cs
assert all(re.fullmatch(r"c-[0-9a-f]{10}", c["id"]) for c in C.values()) and len({c["id"] for c in C.values()}) == 21
PY

py "F18 · stores and optimistic updates: each action's transitions, persistence (a persist wrapper · a storage helper), an action nothing calls; a mutation that writes the cache in onMutate rolls back by a cache write or its context, or misses it" <<'PY'
hooks, _ = FEF.hooks_part(FLOW, GRAPH)
pieces = copy.deepcopy(hooks)
stores, ss, found = FEC.stores_part(FLOW, FE.build_fe(FLOW, None), pieces, HERE / "fixture")
m = copy.deepcopy(FLOW)                               # a caller's body cut at the row cap: the source still names the call
body = m["byFile"]["src/components/PrefsPanel.tsx"]["flow"]["bodies"]["PrefsPanel"]
body["rows"], body["truncated"] = [r for r in body["rows"] if '"add' not in json.dumps(r) and ".add" not in json.dumps(r)], True
assert FEC.stores_part(m, FE.build_fe(m, None), copy.deepcopy(hooks), HERE / "fixture")[0]["fe:src/store/prefs.ts#usePrefsStore"]["actions"]["add"]["called"] is True
assert FEC.stores_part(m, FE.build_fe(m, None), copy.deepcopy(hooks))[0]["fe:src/store/prefs.ts#usePrefsStore"]["actions"]["add"]["called"] is False
p, s = stores["fe:src/store/prefs.ts#usePrefsStore"], stores["fe:src/store/session.ts#useSessionStore"]
T = {a: [(t["field"], t["kind"]) for t in x["transitions"]] for a, x in p["actions"].items()}
assert T == {"add": [("items", "append")], "clear": [("items", "reset")], "remove": [("items", "remove")], "saveTheme": [("theme", "set-literal")],
             "setTheme": [("theme", "set-param")], "toggle": [("open", "expr")], "unused": [("open", "set-literal")],
             "resetAll": [("*", "reset")], "wipe": [("*", "reset")], "noop": [("*", "expr")]}, T
assert p["initial"] == {"theme": '"light"', "items": "[]", "open": "false", "...INITIAL": True}, p["initial"]
assert p["persist"] == {"state": "partial", "writers": ["saveTheme"], "set_by_writers": ["theme"], "via": ["fe:src/store/prefs.ts#storeTheme"]}, p["persist"]
assert s["persist"] == {"state": "persisted", "via": "persist", "name": "session"} and {a: [(t["field"], t["kind"]) for t in x["transitions"]] for a, x in s["actions"].items()} == {"expire": [("token", "expr")], "signOut": [("token", "reset")]}, s
assert [a for a, x in p["actions"].items() if not x["called"]] == ["unused"] and s["actions"]["signOut"]["called"] is True
f = "src/lib/useToggleThing.ts"
O = {c["at"]: c.get("optimistic") for c in pieces["fe:src/lib/useToggleThing.ts#useToggleThing"]["calls"]}
assert O[at(f, "const optimistic")] == {"writes": [at(f, "onMutate: (done) => writeThings")], "rollback": "defined", "via": "cache write", "reconcile": True}, O
assert O[at(f, "const careless")] == {"writes": [at(f, 'setQueryData(["things", "flag"]')], "rollback": "missing", "reconcile": False}, O
assert (O[at(f, "const contextual")]["rollback"], O[at(f, "const contextual")]["via"]) == ("defined", "context"), O
assert [(x["id"], x["at"]) for x in found] == [("action-uncalled", p["actions"]["unused"]["at"]), ("no-rollback", at(f, "const careless"))], found
au = next(x for x in found if x["id"] == "action-uncalled")
assert au["store"] in stores and "piece" not in au and au["action"] == "unused", au                        # V34: store + action, no dangling piece
assert ss["stores"] == 2 and ss["actions"] == 12 and ss["persist"] == {"partial": 1, "persisted": 1} and ss["rollback"] == {"defined": 2, "missing": 1}, ss
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
