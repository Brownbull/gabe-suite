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

ck(len(lv["fn_nodes"]) == 3, "fn_nodes derived from function_insight (3)")
ck(all(n.get("layer") and "slug" in n for n in lv["fn_nodes"]), "each fn_node carries layer + slug")
ck(any(e["fs"] == "users" and e["cls"] == "Order" and e["ts"] == "orders" for e in lv["use_edges"]),
   "use_edge from model_insight.internal_refs (users.list_users → orders.Order, cross-entity)")
_om = [m for m in lv["pieces"]["orders"]["models"] if m["cls"] == "Order"][0]
ck(_om["hub"]["god"] and _om["hub"]["usage"] == 5, "per-model hub/god from model_insight")
ck("orders" in lv["pieces"]["orders"]["usecases"], "usecase keyed on the URL first non-param segment")
_oc = lv["pieces"]["orders"]["communities"]
ck(any(set(v) >= {"Order", "OrderLine"} for v in _oc.values()), "community groups FK-linked models")
ck(any(e["guards"] == 2 for e in lv["pieces"]["orders"]["endpoints"]), "per-endpoint guards from guard_insight")
ck(lv["fn_edges"] == [], "fn_edges honest-empty without a graft arm")
ck(len(lv["entities"]) == 2 and len(lv["l1_edges"]) >= 1, "entities + L1 edges carried from the C4 topology")
# determinism — byte-identical across two independent builds
ck(json.dumps(lv, sort_keys=True) == json.dumps(_a3_levels.build_levels(AMAP, _a3_graph.build_c4_graph(AMAP)), sort_keys=True),
   "deterministic (byte-identical output)")

# MUTATION 1 — strip function_insight ⇒ fn_nodes must zero (detectable)
_m1 = copy.deepcopy(AMAP); _m1["function_insight"] = {}
_lv1 = _a3_levels.build_levels(_m1, _a3_graph.build_c4_graph(_m1))
ck(len(_lv1["fn_nodes"]) == 0 and len(lv["fn_nodes"]) > 0, "MUTATION: removing function_insight zeroes fn_nodes")
# MUTATION 2 — strip internal_refs ⇒ use_edges must zero (detectable)
_m2 = copy.deepcopy(AMAP)
for _k in _m2["model_insight"]:
    _m2["model_insight"][_k]["internal_refs"] = []
_lv2 = _a3_levels.build_levels(_m2, _a3_graph.build_c4_graph(_m2))
ck(len(_lv2["use_edges"]) == 0 and len(lv["use_edges"]) > 0, "MUTATION: removing internal_refs zeroes use_edges")
# MUTATION 3 — strip guard_insight ⇒ endpoint guards must fall to 0 (detectable)
_m3 = copy.deepcopy(AMAP); _m3["guard_insight"] = {"files": {}}
_lv3 = _a3_levels.build_levels(_m3, _a3_graph.build_c4_graph(_m3))
ck(all(e["guards"] == 0 for e in _lv3["pieces"]["orders"]["endpoints"])
   and any(e["guards"] == 2 for e in lv["pieces"]["orders"]["endpoints"]),
   "MUTATION: removing guard_insight zeroes endpoint guards")

print(f"levels battery: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
