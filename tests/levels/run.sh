#!/usr/bin/env bash
# _a3_levels battery — the rich LEVELS graph (window.GABE_LEVELS) derivation.
# Hermetic (a synthetic archmap + the real _a3_graph topology), zero-arg,
# python-stdlib only. Proves the rich lenses come from the archmap insight blocks
# (function_insight → fn_nodes · model_insight.internal_refs → use_edges · URL →
# usecases · FK components → communities · guard_insight → guards), the honest-empty
# contract (missing block ⇒ empty field, graft-less ⇒ no fn_edges), determinism, and
# that stripping a block is DETECTABLE (mutation-proven — a checker that cannot fail
# is non-evidence). Doctor auto-runs it.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
GEN="$DIR/../../templates/center/generators"
python3 - "$GEN" <<'PY'
import sys, json, copy
sys.path.insert(0, sys.argv[1])
import _a3_graph, _a3_levels
p = f = 0
def ck(c, m):
    global p, f
    if c: p += 1
    else: f += 1; print("  FAIL:", m)

AMAP = {
  "head": "testsha",
  "entities": {
    "orders": {"models": [{"cls": "Order", "table": "orders", "cols": [["id", "uuid", ""]], "fks": {"user_id": "users.id"}},
                          {"cls": "OrderLine", "table": "order_lines", "cols": [["id", "uuid", ""]], "fks": {"order_id": "orders.id"}}],
               "schemas": [{"cls": "OrderResponse", "fields": []}],
               "endpoints": [{"method": "GET", "path": "/orders", "fn": "list_orders", "file": "api/orders.py", "touches": ["Order"], "resp": "OrderResponse"},
                             {"method": "POST", "path": "/orders/{id}/lines", "fn": "add_line", "file": "api/orders.py", "touches": ["OrderLine"], "resp": ""}],
               "files": [["api", "api/orders.py", 100]], "defines": {}},
    "users": {"models": [{"cls": "User", "table": "users", "cols": [["id", "uuid", ""]]}],
              "schemas": [], "endpoints": [{"method": "GET", "path": "/users", "fn": "list_users", "file": "api/users.py", "touches": ["User"], "resp": ""}],
              "files": [["api", "api/users.py", 50]], "defines": {}}},
  "function_insight": {
    "api/orders.py::list_orders": {"fn": "list_orders", "entity": "orders", "file": "api/orders.py", "layer": "api", "handler": True, "god": False, "internal": 2, "api": 3, "web": 0, "doc": "List all orders for the user.", "lines": 12, "returns": "OrderResponse", "async": True},
    "api/orders.py::add_line": {"fn": "add_line", "entity": "orders", "file": "api/orders.py", "layer": "api", "handler": True, "god": False, "internal": 0, "api": 1, "web": 0},
    "api/users.py::list_users": {"fn": "list_users", "entity": "users", "file": "api/users.py", "layer": "api", "handler": True, "god": False, "internal": 0, "api": 1, "web": 0}},
  "model_insight": {
    "Order": {"cls": "Order", "entity": "orders", "usage": 5, "god": True, "internal_refs": [{"file": "api/users.py", "defs": ["list_users"]}]},
    "User": {"cls": "User", "entity": "users", "usage": 1, "god": False, "internal_refs": []}},
  "guard_insight": {"files": {"api/orders.py": {"declared": 2, "entity": "orders", "names": ["a", "b"]}}},
  "test_insight": {},
}
graph = _a3_graph.build_c4_graph(AMAP)
lv = _a3_levels.build_levels(AMAP, graph)

_names = {n["name"] for n in lv["fn_nodes"]}
ck(len(lv["fn_nodes"]) == 3 and _names == {"list_orders", "add_line", "list_users"},
   "fn_nodes = the DRAWN set: handlers + cross-entity model-users (not every fn)")
ck(all(n.get("layer") and "slug" in n for n in lv["fn_nodes"]), "each fn_node carries layer + slug")
_lu = [n for n in lv["fn_nodes"] if n["name"] == "list_users"][0]
ck(_lu["slug"] == "users" and _lu["layer"] == "api",
   "the cross-entity model-user (users.list_users → orders.Order) is drawn + enriched")
ck(any(e["fs"] == "users" and e["cls"] == "Order" and e["ts"] == "orders" for e in lv["use_edges"]),
   "use_edge from model_insight.internal_refs (users.list_users → orders.Order, cross-entity)")
_om = [m for m in lv["pieces"]["orders"]["models"] if m["cls"] == "Order"][0]
ck(_om["hub"]["god"] and _om["hub"]["usage"] == 5, "per-model hub/god from model_insight")
_ouc = lv["pieces"]["orders"]["usecases"]
ck("orders" in _ouc, "usecase keyed on the leading URL segment")
# adaptive depth: orders spreads over ONE first segment (/orders/*) so it deepens to
# 2 segments — /orders/{id}/lines groups under "orders/lines", not the coarse "orders"
ck("orders/lines" in _ouc, "usecase depth adapts DEEPER for a single-prefix entity")
_oc = lv["pieces"]["orders"]["communities"]
ck(any(set(v) >= {"Order", "OrderLine"} for v in _oc.values()), "community groups FK-linked models")
# fk_communities: union-find over INTRA-entity FKs — OrderLine.order_id → Order groups them
_ofk = lv["pieces"]["orders"]["fk_communities"]
ck(any(set(v) >= {"Order", "OrderLine"} for v in _ofk.values()),
   "fk_communities groups models joined by an intra-entity foreign key")
ck(any(e["guards"] == 2 for e in lv["pieces"]["orders"]["endpoints"]), "per-endpoint guards from guard_insight")
# schemas PRUNED to the endpoint-facing set: OrderResponse is a resp (kept); a schema no
# endpoint touches (a nested component) is dropped — matching the fixture's curated list
_osc = {s["cls"] for s in lv["pieces"]["orders"]["schemas"]}
ck("OrderResponse" in _osc, "an endpoint-returned schema is kept in the piece")
_ms = copy.deepcopy(AMAP)
_ms["entities"]["orders"]["schemas"].append({"cls": "OrderInternalBlock", "fields": []})
_lvms = _a3_levels.build_levels(_ms, _a3_graph.build_c4_graph(_ms))
ck("OrderInternalBlock" not in {s["cls"] for s in _lvms["pieces"]["orders"]["schemas"]},
   "MUTATION: a schema no endpoint touches is PRUNED from the piece")
# colors ride WITH the graph — a renderer paints entities the center's hue
_lvc = _a3_levels.build_levels(AMAP, _a3_graph.build_c4_graph(AMAP, colors={"orders": "#112233", "users": "#445566"}))
ck(_lvc["colors"].get("orders") == "#112233", "per-entity colors carried from the C4 graph")
ck(lv["fn_edges"] == [], "fn_edges honest-empty without a graft arm")
# fn_edges FROM a graft arm — a handler-rooted call joins its target to the drawn set
GRAFT = {"present": True, "functions": {
    "fn_slug": {"api/orders.py#list_orders": "orders", "api/users.py#helper": "users"},
    "calls": [{"s": "api/orders.py#list_orders", "t": "api/users.py#helper",
               "ss": "orders", "ts": "users", "conf": "extracted"},
              # a NON-handler-rooted call must be ignored (helper is not a handler)
              {"s": "api/users.py#helper", "t": "api/orders.py#list_orders",
               "ss": "users", "ts": "orders", "conf": "inferred"}]},
    # the per-function CODE-BEHIND floor (hidden mass) — attaches to the drawn fn_node
    "fn_behind": {"api/orders.py#list_orders": {"fns": 1, "depth": 1, "names": ["helper"]}}}
_lvg = _a3_levels.build_levels(AMAP, graph, graft=GRAFT)
ck(len(_lvg["fn_edges"]) == 1, "fn_edges = handler-ROOTED graft calls only (non-handler source ignored)")
_fe = _lvg["fn_edges"][0]
ck(_fe["ss"] == "orders" and _fe["ds"] == "users" and _fe["rel"] == "calls" and _fe["conf"] == "extracted",
   "fn_edge reshaped {s·ss·t·ds·rel·conf} with the graft confidence carried")
ck(any(n["id"] == "api/users.py#helper" for n in _lvg["fn_nodes"]),
   "the call TARGET joins the drawn set (else the lab drops the edge to an undrawn node)")
# fn CODE-BEHIND: graft.fn_behind attaches to the matching drawn fn_node; a fn with no
# fn_behind entry (a leaf) carries no `behind` — honest-empty, the panel omits the section.
_lo = [n for n in _lvg["fn_nodes"] if n["id"] == "api/orders.py#list_orders"][0]
_hp = [n for n in _lvg["fn_nodes"] if n["id"] == "api/users.py#helper"][0]
ck(_lo.get("behind") == {"fns": 1, "depth": 1, "names": ["helper"]} and "behind" not in _hp,
   "fn_behind attaches the hidden-mass floor to its fn_node; a leaf fn stays behind-less")
ck(len(lv["entities"]) == 2 and len(lv["l1_edges"]) >= 1, "entities + L1 edges carried from the C4 topology")
# determinism — byte-identical across two independent builds
ck(json.dumps(lv, sort_keys=True) == json.dumps(_a3_levels.build_levels(AMAP, _a3_graph.build_c4_graph(AMAP)), sort_keys=True),
   "deterministic (byte-identical output)")

# MUTATION 1 — strip function_insight ⇒ fn_nodes must zero: it names the handlers
#   (the trace roots) AND carries the file→entity map that decides which references
#   cross an entity boundary — remove it and the drawn set has no seed (detectable)
_m1 = copy.deepcopy(AMAP); _m1["function_insight"] = {}
_lv1 = _a3_levels.build_levels(_m1, _a3_graph.build_c4_graph(_m1))
ck(len(_lv1["fn_nodes"]) == 0 and len(lv["fn_nodes"]) > 0, "MUTATION: removing function_insight zeroes fn_nodes")
# MUTATION 2 — strip internal_refs ⇒ use_edges must zero; the HANDLERS still draw (they
#   ride function_insight.handler, not internal_refs), so fn_nodes falls to just the 3 handlers
_m2 = copy.deepcopy(AMAP)
for _k in _m2["model_insight"]:
    _m2["model_insight"][_k]["internal_refs"] = []
_lv2 = _a3_levels.build_levels(_m2, _a3_graph.build_c4_graph(_m2))
ck(len(_lv2["use_edges"]) == 0 and len(_lv2["fn_nodes"]) == 3 and len(lv["use_edges"]) > 0,
   "MUTATION: removing internal_refs zeroes use_edges; handlers still draw")
# MUTATION 3 — strip guard_insight ⇒ endpoint guards must fall to 0 (detectable)
_m3 = copy.deepcopy(AMAP); _m3["guard_insight"] = {"files": {}}
_lv3 = _a3_levels.build_levels(_m3, _a3_graph.build_c4_graph(_m3))
ck(all(e["guards"] == 0 for e in _lv3["pieces"]["orders"]["endpoints"])
   and any(e["guards"] == 2 for e in lv["pieces"]["orders"]["endpoints"]),
   "MUTATION: removing guard_insight zeroes endpoint guards")
# MUTATION 4 — spread orders across 3 distinct first segments ⇒ adaptive depth drops
#   to 1, so "orders/lines" collapses back to the coarse "orders" (detectable)
_m4 = copy.deepcopy(AMAP)
_m4["entities"]["orders"]["endpoints"] += [
    {"method": "GET", "path": "/baskets", "fn": "list_baskets", "file": "api/orders.py", "touches": [], "resp": ""},
    {"method": "GET", "path": "/carts", "fn": "list_carts", "file": "api/orders.py", "touches": [], "resp": ""}]
_lv4 = _a3_levels.build_levels(_m4, _a3_graph.build_c4_graph(_m4))
ck("orders/lines" not in _lv4["pieces"]["orders"]["usecases"] and "orders/lines" in lv["pieces"]["orders"]["usecases"],
   "MUTATION: a 3rd first-segment flattens the adaptive use-case depth to 1")
# MUTATION 5 — strip OrderLine's intra FK ⇒ fk_communities no longer joins it to Order
_m5 = copy.deepcopy(AMAP)
for _m in _m5["entities"]["orders"]["models"]:
    if _m["cls"] == "OrderLine":
        _m["fks"] = {}
_lv5 = _a3_levels.build_levels(_m5, _a3_graph.build_c4_graph(_m5))
ck(not any(set(v) >= {"Order", "OrderLine"} for v in _lv5["pieces"]["orders"]["fk_communities"].values())
   and any(set(v) >= {"Order", "OrderLine"} for v in lv["pieces"]["orders"]["fk_communities"].values()),
   "MUTATION: removing the intra FK splits the fk_community")

# ── fn DETAIL projection (the panel's Function card feed): doc · file · signature
#    from function_insight, keyed "fn:"+slug+"|"+name like the cls: rows, honest-empty
#    per field. list_orders' FI carries a docstring + returns + async + line count.
_fd = lv["detail"].get("fn:orders|list_orders")
ck(bool(_fd) and _fd.get("doc") == "List all orders for the user." and _fd.get("file") == "api/orders.py"
   and _fd.get("flines") == 12 and _fd.get("sig", {}).get("returns") == "OrderResponse"
   and _fd.get("sig", {}).get("async") is True,
   "fn detail projects doc + file + flines + signature from function_insight")
# add_line's FI has file/entity but NO doc/lines/returns ⇒ file only, nothing fabricated
_fda = lv["detail"].get("fn:orders|add_line")
ck(bool(_fda) and _fda.get("file") == "api/orders.py" and "doc" not in _fda
   and "flines" not in _fda and "sig" not in _fda,
   "fn detail honest-empty: no docstring/signature insight ⇒ file only, no fabricated fields")
# MUTATION 6 — strip list_orders' doc + returns + async ⇒ its fn detail loses doc + sig,
#   keeping file (which comes from the drawn id, not the insight) — detectable
_m6 = copy.deepcopy(AMAP)
for _f in ("doc", "returns", "async", "lines"):
    _m6["function_insight"]["api/orders.py::list_orders"].pop(_f, None)
_lv6 = _a3_levels.build_levels(_m6, _a3_graph.build_c4_graph(_m6))
_fd6 = _lv6["detail"].get("fn:orders|list_orders")
ck(bool(_fd6) and "doc" not in _fd6 and "sig" not in _fd6 and "flines" not in _fd6
   and _fd6.get("file") == "api/orders.py" and bool(_fd) and _fd.get("doc"),
   "MUTATION: stripping the docstring/signature insight drops the fn detail doc + sig, keeps file")

# ── AUDIT LOCKS: the proof/detail invariants the badge-vs-panel audit exposed ────────
# (the pre-audit battery passed while all 16 defects existed — these pin the fixes)
# #1: fn_nodes NEVER carry a `tests` field — a function is not a test target; the badge
#     fabricated proof for functions. The feed must not emit one.
ck(all("tests" not in n for n in lv["fn_nodes"]),
   "AUDIT #1: fn_nodes carry NO tests field (no fabricated function proof)")
# #8: a fn_node's fan-in usage = internal + api callers (function_insight.internal EXCLUDES
#     the api layer; counting internal alone read a false 0 for a handler no internal fn calls).
_lo0 = [n for n in lv["fn_nodes"] if n["name"] == "list_orders"][0]
ck(_lo0["hub"]["usage"] == 5, "AUDIT #8: fn hub.usage = internal + api (2 + 3 = 5)")
_m8 = copy.deepcopy(AMAP); _m8["function_insight"]["api/orders.py::list_orders"]["api"] = 0
_lv8 = _a3_levels.build_levels(_m8, _a3_graph.build_c4_graph(_m8))
_lo8 = [n for n in _lv8["fn_nodes"] if n["name"] == "list_orders"][0]
ck(_lo8["hub"]["usage"] == 2 and _lo0["hub"]["usage"] == 5,
   "AUDIT #8 MUTATION: dropping api callers drops fan-in (5 → 2) — api IS counted")
# #2: every endpoint carries a tests{n,api,web,red} dict — missing → the page drew every
#     endpoint as the hollow 'unproven' glyph even when det.cases existed.
ck(all(isinstance(e.get("tests"), dict) and "n" in e["tests"]
       for s in lv["pieces"].values() for e in s["endpoints"]),
   "AUDIT #2: every endpoint carries a tests{n,...} dict (proof badge can render)")
# #6: a container return (list[X]/Optional[X]) is BARE in `resp` (so schema_owner joins)
#     with the full form kept in resp_full.
_mr = copy.deepcopy(AMAP)
_mr["entities"]["orders"]["endpoints"].append(
    {"method": "GET", "path": "/orders/recent", "fn": "recent", "file": "api/orders.py",
     "touches": [], "resp": "list[OrderResponse]"})
_lvr = _a3_levels.build_levels(_mr, _a3_graph.build_c4_graph(_mr))
_er = [e for e in _lvr["pieces"]["orders"]["endpoints"] if e["p"] == "/orders/recent"][0]
ck(_er["resp"] == "OrderResponse" and _er["resp_full"] == "list[OrderResponse]",
   "AUDIT #6: a container resp (list[X]) is BARE in resp, full in resp_full")
# #7/#14 (unit): _tests_of counts cases_more (the >cap overflow) in n — a >cap model
#     reported n=6 not the true count, so badge(29) ≠ panel — and IGNORES case_files
#     (coverage-by-file, not cases — a stray filename digit used to inflate n).
ck(_a3_levels._tests_of({"cases": [{"corpus": "api", "cid": "C1", "state": "pass"}], "cases_more": 5})["n"] == 6,
   "AUDIT #14: _tests_of.n includes cases_more (6 = 1 shown + 5 overflow)")
ck(_a3_levels._tests_of({"cases": [], "case_files": [{"corpus": "api", "name": "x"}]})["n"] == 0,
   "AUDIT #7: _tests_of ignores case_files (coverage-by-file, not a case count)")
# #16 (unit): _store_det MERGES a same-key write (model det then schema det, either order)
#     instead of clobbering — a schema (cols, no cases) wiped a model (29 cases) so the
#     badge read the model's tests while the panel read the schema's 0-case det.
_lvu = {"detail": {}}
_a3_levels._store_det(_lvu, "cls:x|Dup", {"cases": [{"cid": "C1"}], "cases_more": 3, "file": "m.py"})
_a3_levels._store_det(_lvu, "cls:x|Dup", {"cols": [["a", "int", ""]], "file": "s.py"})
_du = _lvu["detail"]["cls:x|Dup"]["det"]
ck(len(_du.get("cases", [])) == 1 and _du.get("cases_more") == 3 and bool(_du.get("cols")),
   "AUDIT #16: _store_det MERGES model cases + schema cols on a shared key (no clobber)")
_lvu2 = {"detail": {}}
_a3_levels._store_det(_lvu2, "cls:x|Dup", {"cols": [["a", "int", ""]], "file": "s.py"})
_a3_levels._store_det(_lvu2, "cls:x|Dup", {"cases": [{"cid": "C1"}], "cases_more": 3, "file": "m.py"})
_du2 = _lvu2["detail"]["cls:x|Dup"]["det"]
ck(len(_du2.get("cases", [])) == 1 and _du2.get("cases_more") == 3 and bool(_du2.get("cols")),
   "AUDIT #16: _store_det merge is order-independent (schema-first == model-first)")

# ── SWEEP LOCKS: the structural-audit fixes (model/schema identity + cross-entity prune) ──
# SWEEP-A: a model and a SAME-NAMED schema in one entity keep DISTINCT detail records —
#   model under cls:, schema under sch: — so the schema panel shows its OWN columns, not
#   the model's (gastify StatementLine: schema 20 fields/source_order vs model 23/id).
# SWEEP-C: a schema OWNED by entity A but returned only by entity B's endpoint survives the
#   per-entity prune (was dropped → drawn nowhere, gustify MeResponse/SettingsResponse).
_msw = copy.deepcopy(AMAP)
_msw["entities"]["orders"]["models"].append(
    {"cls": "Dup", "table": "dups", "cols": [["mid", "uuid", ""]], "fks": {}})
_msw["entities"]["orders"]["schemas"].append(
    {"cls": "Dup", "fields": [["sfield", "str", ""]]})
_msw["entities"]["orders"]["endpoints"].append(
    {"method": "GET", "path": "/dup", "fn": "get_dup", "file": "api/orders.py", "touches": [], "resp": "Dup"})
# UserExport is a users-owned schema returned by an ORDERS endpoint (cross-entity)
_msw["entities"]["users"]["schemas"].append({"cls": "UserExport", "fields": [["x", "str", ""]]})
_msw["entities"]["orders"]["endpoints"].append(
    {"method": "GET", "path": "/export", "fn": "export", "file": "api/orders.py", "touches": [], "resp": "UserExport"})
_lsw = _a3_levels.build_levels(_msw, _a3_graph.build_c4_graph(_msw))
_dm = (_lsw["detail"].get("cls:orders|Dup") or {}).get("det", {})
_ds = (_lsw["detail"].get("sch:orders|Dup") or {}).get("det", {})
ck((_dm.get("cols") or [[None]])[0][0] == "mid" and (_ds.get("cols") or [[None]])[0][0] == "sfield",
   "SWEEP-A: model (cls:) + same-named schema (sch:) keep DISTINCT detail — own columns each")
ck("UserExport" in {s["cls"] for s in _lsw["pieces"]["users"]["schemas"]},
   "SWEEP-C: a schema returned by ANOTHER entity's endpoint survives the prune (drawn, not dropped)")
# MUTATION — a schema NO endpoint anywhere touches/returns is still pruned (guard can fire)
_msw2 = copy.deepcopy(_msw)
_msw2["entities"]["users"]["schemas"].append({"cls": "NeverUsed", "fields": [["y", "str", ""]]})
_lsw2 = _a3_levels.build_levels(_msw2, _a3_graph.build_c4_graph(_msw2))
ck("NeverUsed" not in {s["cls"] for s in _lsw2["pieces"]["users"]["schemas"]},
   "SWEEP-C MUTATION: a schema referenced by NO endpoint (any entity) is still pruned")

print(f"levels battery: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
