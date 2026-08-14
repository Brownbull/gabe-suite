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
    "api/orders.py::list_orders": {"fn": "list_orders", "entity": "orders", "file": "api/orders.py", "layer": "api", "handler": True, "god": False, "internal": 2, "api": 3, "web": 0},
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
               "ss": "users", "ts": "orders", "conf": "inferred"}]}}
_lvg = _a3_levels.build_levels(AMAP, graph, graft=GRAFT)
ck(len(_lvg["fn_edges"]) == 1, "fn_edges = handler-ROOTED graft calls only (non-handler source ignored)")
_fe = _lvg["fn_edges"][0]
ck(_fe["ss"] == "orders" and _fe["ds"] == "users" and _fe["rel"] == "calls" and _fe["conf"] == "extracted",
   "fn_edge reshaped {s·ss·t·ds·rel·conf} with the graft confidence carried")
ck(any(n["id"] == "api/users.py#helper" for n in _lvg["fn_nodes"]),
   "the call TARGET joins the drawn set (else the lab drops the edge to an undrawn node)")
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

print(f"levels battery: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
