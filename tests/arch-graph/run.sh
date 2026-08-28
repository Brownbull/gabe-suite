#!/usr/bin/env bash
# _a3_graph battery — the C4 codebase-graph derivation's executable contract.
#
# Tests ONLY shapes the real pipeline can emit (an earlier fixture fabricated a
# cross-entity `touches` edge the upstream own-class filter makes impossible —
# false-green coverage; removed). Proves FIRE, SILENT, and the honesty + laws:
#   * L1 cross-entity edges are FK only; an intra-entity self-FK is L2 detail,
#     never an L1 self-loop — MUTATION-PROVEN (plants a self-FK; test FAILS if it
#     leaks to L1).
#   * a FK to a table no entity models → an explicit `__unclaimed__` bucket +
#     `unresolved_tables`, never silently dropped; the bucket id is namespaced so
#     it cannot collide with a real entity slug (even one literally named
#     "unclaimed").
#   * per-directed-pair weight aggregates multiple FKs.
#   * L2: endpoint→own-schema touches (intra only), model→model FK internal, FK to
#     another entity/unclaimed → an external stub; every edge target is a real
#     node; a model/schema class-name tie resolves to the MODEL; node ids are
#     unique.
#   * None-valued list fields (models:null) never crash.
#   * byte-identical on a re-run; keyed on head, carries no wallclock.
#   * emit() writes utf-8 bytes for both artifacts.
# Hermetic: synthetic in-memory archmaps. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators"

python3 - "$GEN" <<'PY'
import sys, json, copy, importlib.util, tempfile, pathlib
gen = sys.argv[1]
spec = importlib.util.spec_from_file_location("_a3_graph", gen + "/_a3_graph.py")
G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

# ── PRE-C: _L2_KINDS is APPEND-ONLY — new kinds join at the END so existing kinds keep their
# indices (every drawn node's stamped x/y byte-identical; only the emitted layout.l2.order grows) ──
check(G._L2_KINDS[:5] == ("endpoint", "model", "schema", "external", "web"),
      "pre-C: the historical 5 L2 kinds keep their order + indices (append-only, byte-identity)")
check(G._L2_KINDS[5:] == ("middleware", "provider", "flag", "prompt"),
      "pre-C: the 4 wave-C kinds are appended after web (they draw no nodes until wave C emits them)")

# ── fixture: entities exercising every REAL derivation path ─────────────────
#   alpha: model A(table=a, fks: self a.id · TWO to beta b.id/b.x · one unmodelled)
#          endpoint touches its OWN schema AlphaOut (the only touch shape upstream
#          can emit); a model Dup + a schema Dup (class-name tie → model wins)
#   beta:  model B(table=b) · schema BetaOut · a DUPLICATE model B (id-dedup test)
#   gamma: model Gm(table=g)  (a sink)
FIX = {"head": "cafef00d", "generated": "2026-01-01 00:00Z", "entities": {
  "alpha": {
    "files": [["api", "apps/api/alpha.py", 100]],
    "models": [
      {"cls": "A", "table": "a",
       "cols": [["id", "uuid.UUID", ""], ["name", "str", ""]],     # → model_ids datatype
       "fks": {"self_col": "a.id",     # intra → no L1 edge
                                          "b_col":  "b.id",       # cross → alpha→beta
                                          "b_col2": "b.x",        # cross → weight 2
                                          "x_col":  "legacy_x.id"}},  # unmodelled → unclaimed
      {"cls": "Dup", "table": "dup", "fks": {}},
    ],
    "schemas": [{"cls": "AlphaOut"}, {"cls": "Dup"}],   # class-name tie with model Dup
    "endpoints": [{"method": "GET", "path": "/alpha", "fn": "get_alpha",
                   "touches": ["AlphaOut", "Dup"],      # own only (real shape)
                   "touches_x": ["B", "SomeLibClass"]}],  # unowned residue: B = beta's model → a cross touches edge; the lib name drops
  },
  "beta": {
    "files": [["api", "apps/api/beta.py", 50]],
    "models": [{"cls": "B", "table": "b", "fks": {}},
               {"cls": "B", "table": "b", "fks": {}}],  # duplicate → node-id dedup
    "schemas": [{"cls": "BetaOut"}],
    "endpoints": [],
  },
  "gamma": {
    "files": [["api", "apps/api/gamma.py", 30]],
    "models": [{"cls": "Gm", "table": "g", "fks": {}}],
    "schemas": [], "endpoints": [],
  },
}}
LABELS = {"alpha": "Alpha", "beta": "Beta", "gamma": "Gamma"}
STATUS = {"alpha": "approved", "beta": "pending"}

g = G.build_c4_graph(FIX, labels=LABELS, status=STATUS)

# ── SCHEMA HOMING provenance (2026-08-27): a homed schema dict carries homed_from/homed_why → the
#    node + its det say so; the archmap's schema_homing block → stats counts; absent → key absent.
_hf = copy.deepcopy(FIX)
_hf["entities"]["alpha"]["schemas"].append({"cls": "MovedIn", "homed_from": "beta", "homed_why": "consumed-by:GET /alpha"})
_hf["schema_homing"] = {"moved": [{"cls": "MovedIn", "from": "beta", "to": "alpha", "why": "consumed-by:GET /alpha"}],
                        "ambiguous": [{"cls": "Sh", "home": "beta", "consumers": ["alpha", "gamma"]}],
                        "unwired": [{"cls": "U1", "home": "gamma", "file": "f", "dormant": True}, {"cls": "U2", "home": "gamma", "file": "g", "dormant": False}], "fn_wires": []}
_hg = G.build_c4_graph(_hf, labels=LABELS, status=STATUS)
_mn = next(n for n in _hg["l2"]["alpha"]["nodes"] if n["id"] == "schema:MovedIn")
check(_mn.get("homed") == {"from": "beta", "why": "consumed-by:GET /alpha"} and (_mn.get("det") or {}).get("homed") == _mn["homed"],
      "a homed schema node carries {from, why} on the node AND in its det (the card reads det)")
check(_hg["stats"].get("schema_homing") == {"moved": 1, "ambiguous": 1, "unwired": 2, "dormant": 1}, "stats.schema_homing counts moved/ambiguous/unwired/dormant")
check("schema_homing" not in g["stats"] and all("homed" not in n for n in g["l2"]["alpha"]["nodes"]), "honest-empty: no homing block upstream → no stats key, no homed field (byte-identical)")
# a HOMED-IN class named in the endpoint's RESIDUE (touches_x — split at parse time, before the move) must
# land as an INTRA edge, never be dropped by the cross-resolver's same-entity guard (the wire vanished
# exactly when the class arrived: ExplorationPreferencesInput lost PATCH /settings/exploration)
_hi = copy.deepcopy(FIX)
_hi["entities"]["alpha"]["schemas"].append({"cls": "HomedIn", "homed_from": "beta", "homed_why": "consumed-by:GET /alpha", "fields": []})
_hi["entities"]["alpha"]["endpoints"][0]["touches_x"] = _hi["entities"]["alpha"]["endpoints"][0]["touches_x"] + ["HomedIn"]
_hig = G.build_c4_graph(_hi, labels=LABELS, status=STATUS)
check({"source": "endpoint:GET /alpha", "target": "schema:HomedIn", "kind": "touches"} in _hig["l2"]["alpha"]["edges"],
      "a residue name resolving to a HOMED-IN own class lands as an intra touches edge")
check(not any(e["to"] == "schema:HomedIn" for e in _hig["cross_edges"]), "…and never as a cross edge (same entity)")
check(len(_hig["cross_edges"]) == len(g["cross_edges"]), "other cross edges unchanged")

# ── cross-entity TOUCHES (2026-08-20, the allergen-reduction exposure): an endpoint's
#    unowned residue (touches_x) resolves against the GLOBAL class index → a cross_edges
#    kind "touches"; unresolvable names (library classes) drop silently; stats count it. ──
_xt = [e for e in g["cross_edges"] if e.get("kind") == "touches"]
check(len(_xt) == 1 and _xt[0]["from"] == "endpoint:GET /alpha" and _xt[0]["to"] == "model:B"
      and _xt[0]["from_slug"] == "alpha" and _xt[0]["to_slug"] == "beta",
      "touches_x residue does not become ONE resolved cross-entity touches edge")
check(g["stats"].get("cross_touches") == 1, "stats.cross_touches does not count the aspect wires")
check(not any("SomeLibClass" in json.dumps(e) for e in g["cross_edges"]),
      "an unresolvable library class leaked into cross_edges")
check(all("xtouch" not in sub for sub in g["l2"].values()),
      "the xtouch working list leaked into the emitted l2 JSON")
l1n = {n["id"]: n for n in g["l1"]["nodes"]}
l1e = {(e["source"], e["target"]): e for e in g["l1"]["edges"]}

# ── FIRE: L1 node set == entities (+ the unclaimed bucket it needs) ─────────
check(g["stats"]["entities"] == 3, "L1 has one node per modelled entity")
check({"alpha", "beta", "gamma"} <= set(l1n), "every entity slug is an L1 node")
check(l1n["alpha"]["counts"]["models"] == 2 and l1n["alpha"]["counts"]["files"] == 1,
      "L1 node carries code_counts")
check(l1n["beta"]["status"] == "pending" and l1n["alpha"]["status"] == "approved",
      "L1 node carries registry status")
check(l1n["alpha"]["label"] == "Alpha", "L1 node uses the registry label")

# ── HONESTY: unclaimed bucket, namespaced id, unresolved table named ───────
check(g["stats"]["unclaimed"] is True and G._UNCLAIMED in l1n,
      "a FK to an unmodelled table creates the __unclaimed__ bucket node")
check(l1n[G._UNCLAIMED]["kind"] == "unclaimed" and l1n[G._UNCLAIMED]["label"] == "unclaimed",
      "the bucket node is kind=unclaimed, label 'unclaimed'")
check(g["stats"]["unresolved_tables"] == ["legacy_x"],
      "the unmodelled table is named in unresolved_tables")
check(("alpha", G._UNCLAIMED) in l1e and l1e[("alpha", G._UNCLAIMED)]["kinds"].get("fk") == 1,
      "the unmodelled FK becomes an alpha→__unclaimed__ fk edge")

# ── MUTATION PROOF: an intra-entity (self) FK must NOT leak into L1 ─────────
check(("alpha", "alpha") not in l1e,
      "intra-entity self-FK is NOT an L1 self-loop (planted a.id self-FK)")

# ── CROSS FK edges: direction + weight aggregation (two FKs alpha→beta) ─────
ab = l1e.get(("alpha", "beta"))
check(ab is not None and ab["kinds"].get("fk") == 2 and ab["weight"] == 2,
      "alpha→beta aggregates TWO FKs into weight 2")
check(("beta", "alpha") not in l1e and ("gamma", "alpha") not in l1e,
      "gamma is a sink and beta does not point back (direction preserved)")
check(all("touches" not in e["kinds"] for e in g["l1"]["edges"]),
      "L1 carries NO touches kind (touches is intra-entity under the archmap)")

# ── COLLISION: a model/schema class-name tie resolves the touch to the MODEL ─
a2 = g["l2"]["alpha"]
a2ids = [n["id"] for n in a2["nodes"]]
check(any(e["source"] == "endpoint:GET /alpha" and e["target"] == "model:Dup"
          and e["kind"] == "touches" for e in a2["edges"]),
      "touch to a name owned by BOTH a model and schema resolves to the model")
check(any(e["target"] == "schema:AlphaOut" and e["kind"] == "touches" for e in a2["edges"]),
      "L2 endpoint→own-schema touches edge present")

# ── L2 honesty: every edge target is a real node; external stubs present ────
check(all(e["target"] in set(a2ids) for e in a2["edges"]),
      "every L2 edge target is a real node (no dangling target)")
check("external:beta" in a2ids, "L2 shows external:beta for the cross-entity FK")
check(f"external:{G._UNCLAIMED}" in a2ids,
      "L2 shows an external unclaimed stub for the unmodelled FK")
check(not any(e["source"] == e["target"] for e in a2["edges"]),
      "no L2 self-loop from the planted self-FK")

# ══ THE GRAFT-WIRING ARM (_a3_graft + build_c4_graph(graft=)) ══════════════
_gspec = importlib.util.spec_from_file_location("_a3_graft", gen + "/_a3_graft.py")
GG = importlib.util.module_from_spec(_gspec); _gspec.loader.exec_module(GG)
import pathlib as _pl

# a synthetic wiring index exercising every consume rule: cross-entity calls
# (inferred), cross-entity imports (extracted), intra-entity call (dropped),
# .js noise (dropped), raw-specifier import target (dropped), unmapped file
# (dropped) — mirrors the REAL shapes sampled from gustify's index 2026-08-12.
WIRING = {
  "meta": {"version": 1, "nodeCount": 6, "edgeCount": 6, "languages": ["python"]},
  "nodes": [
    {"id": "apps/api/alpha.py", "kind": "file", "path": "apps/api/alpha.py"},
    {"id": "apps/api/alpha.py#do_a", "kind": "function", "path": "apps/api/alpha.py"},
    {"id": "apps/api/beta.py#do_b", "kind": "function", "path": "apps/api/beta.py"},
    {"id": "apps/api/beta.py#do_b2", "kind": "function", "path": "apps/api/beta.py"},
    {"id": "web/dist/bundle.js#x", "kind": "function", "path": "web/dist/bundle.js"},
    {"id": "apps/api/stray.py#s", "kind": "function", "path": "apps/api/stray.py"},
  ],
  "edges": [
    {"source": "apps/api/alpha.py#do_a", "target": "apps/api/beta.py#do_b",  "relation": "calls",   "confidence": "inferred"},
    {"source": "apps/api/alpha.py",      "target": "apps/api/beta.py#do_b2", "relation": "imports", "confidence": "extracted"},
    {"source": "apps/api/beta.py#do_b",  "target": "apps/api/beta.py#do_b2", "relation": "calls",   "confidence": "extracted"},
    {"source": "apps/api/alpha.py#do_a", "target": "web/dist/bundle.js#x",   "relation": "calls",   "confidence": "inferred"},
    {"source": "apps/api/alpha.py",      "target": "react",                  "relation": "imports", "confidence": "extracted"},
    {"source": "apps/api/stray.py#s",    "target": "apps/api/beta.py#do_b",  "relation": "calls",   "confidence": "inferred"},
  ],
}
_gx = GG.derive_cross(WIRING, FIX["entities"])
check(_gx["pairs"] == {("alpha", "beta"): {"calls": 1, "imports": 1}},
      "graft arm: exactly the cross-entity calls+imports pair survives")
check(_gx["stats"]["dropped"] == {"noise": 1, "unresolved_target": 1,
                                  "unmapped_file": 1, "intra_entity": 1},
      "graft arm: every dropped edge is COUNTED by reason (no silent caps)")
check(_gx["stats"]["confidence"]["calls"] == {"extracted": 0, "inferred": 1},
      "graft arm: the trust split rides the stats (cross-file calls are a floor)")

# ── P1 (graft adoption): ALL 6 relations · node_facts · methods in the hidden mass ──
_W2 = {"meta": {"version": 1}, "nodes": [
    {"id": "apps/api/alpha.py#Cls", "kind": "class", "path": "apps/api/alpha.py", "signature": "class Cls(Base)", "exported": "True"},
    {"id": "apps/api/beta.py#Base", "kind": "class", "path": "apps/api/beta.py"},
    {"id": "apps/api/alpha.py#Cls.meth", "kind": "method", "path": "apps/api/alpha.py", "signature": "def meth(self) -> int"},
    {"id": "apps/api/beta.py#leaf", "kind": "function", "path": "apps/api/beta.py"},
    {"id": "web/dist/bundle.js#z", "kind": "function", "path": "web/dist/bundle.js"},
  ], "edges": [
    {"source": "apps/api/alpha.py#Cls", "target": "apps/api/beta.py#Base", "relation": "extends", "confidence": "extracted"},
    {"source": "apps/api/alpha.py#Cls", "target": "apps/api/beta.py#leaf", "relation": "references", "confidence": "inferred"},
    {"source": "apps/api/alpha.py#Cls.meth", "target": "apps/api/beta.py#leaf", "relation": "calls", "confidence": "inferred"},
  ]}
_gx2 = GG.derive_cross(_W2, FIX["entities"])
check(_gx2["stats"]["cross_by_relation"].get("extends") == 1
      and _gx2["stats"]["cross_by_relation"].get("references") == 1,
      "P1: derive_cross consumes ALL 6 relations (extends + references cross-entity counted)")
_nf = GG.derive_node_facts(_W2)
check(_nf.get("apps/api/alpha.py#Cls", {}).get("signature") == "class Cls(Base)"
      and _nf["apps/api/alpha.py#Cls"].get("exported") is True
      and "web/dist/bundle.js#z" not in _nf,
      "P1: derive_node_facts carries signature + exported per node, noise excluded")
_fnb2 = GG.derive_fn_behind(_W2)
check("apps/api/alpha.py#Cls.meth" in _fnb2 and _fnb2["apps/api/alpha.py#Cls.meth"]["fns"] == 1,
      "P1: a METHOD's call-tree counts in the hidden mass (methods were dropped before P1)")
# B2: derive_functions now ADMITS methods to the DRAWN fn graph (was kind != "function")
_df2 = GG.derive_functions(_W2, FIX["entities"])
check("apps/api/alpha.py#Cls.meth" in _df2["fn_slug"],
      "B2: derive_functions admits a METHOD into the drawn fn graph (was dropped)")
check(any(c["s"] == "apps/api/alpha.py#Cls.meth" and c["t"] == "apps/api/beta.py#leaf" for c in _df2["calls"]),
      "B2: a method→fn call edge draws once both ends are homed")

# P1b: element_detail folds graft's node_facts (signature + exported) into the dossier by file#symbol
_nf_fix = {"apps/api/beta.py#leaf": {"kind": "function", "signature": "def leaf() -> int", "exported": True}}
_det_ep = G.element_detail("endpoint", {"file": "apps/api/beta.py", "fn": "leaf"}, {}, {}, {}, {}, {}, node_facts=_nf_fix)
check(_det_ep.get("gsig") == "def leaf() -> int" and _det_ep.get("exported") is True,
      "P1b: element_detail carries graft's signature + exported (by file#fn) into the dossier")
check("gsig" not in G.element_detail("endpoint", {"file": "apps/api/beta.py", "fn": "leaf"}, {}, {}, {}, {}, {}),
      "P1b: no node_facts → no gsig (honest-empty; graft-absent build unchanged)")
# P1b review fix: _normalize_sig strips param DEFAULT bodies (FastAPI Query/Depends prose that
# blew a handler signature to 11.8k chars) + caps length — the useful name·params·return survives.
_rawsig = "async def h( q: str = Query(None, description=(" + "'x'*99 " * 40 + ")), n: int = 5 ) -> Resp"
_norm = G._normalize_sig(_rawsig)
check("Query(" not in _norm and "= 5" not in _norm and "q: str" in _norm and "n: int" in _norm
      and "-> Resp" in _norm and len(_norm) <= 220,
      "P1b-fix: _normalize_sig drops param defaults + caps length (no multi-KB signature)")

# P2a: derive_frontend classifies graft's TS nodes into frontend kinds + carries the TS topology
_W_fe = {"nodes": [
    {"id": "apps/web/src/useAuth.ts#useAuth", "kind": "function", "path": "apps/web/src/useAuth.ts", "name": "useAuth"},
    {"id": "apps/web/src/App.tsx#App", "kind": "function", "path": "apps/web/src/App.tsx", "name": "App"},
    {"id": "apps/web/src/cartStore.ts#cartStore", "kind": "function", "path": "apps/web/src/cartStore.ts", "name": "cartStore"},
    {"id": "apps/web/src/routes/Login.tsx#Login", "kind": "function", "path": "apps/web/src/routes/Login.tsx", "name": "Login"},
    {"id": "apps/web/src/types.ts#Props", "kind": "interface", "path": "apps/web/src/types.ts", "name": "Props"},
    {"id": "apps/web/dist/bundle.js#z", "kind": "function", "path": "apps/web/dist/bundle.js", "name": "z"},
    {"id": "apps/api/x.py#restoreNormalMode", "kind": "function", "path": "apps/api/x.py", "name": "restoreNormalMode"},
  ], "edges": [
    {"source": "apps/web/src/App.tsx#App", "target": "apps/web/src/useAuth.ts#useAuth", "relation": "calls"},
  ]}
_fe = GG.derive_frontend(_W_fe)
_byk = _fe["stats"]["by_kind"]
check(_byk.get("hook") == 1 and _byk.get("component") == 1 and _byk.get("store") == 1
      and _byk.get("route") == 1 and _byk.get("fe-type") == 1 and _fe["stats"]["total"] == 5,
      "P2a: derive_frontend classifies hook/component/store/route/fe-type; .js noise + backend .py excluded")
check(len(_fe["edges"]) == 1 and _fe["edges"][0]["rel"] == "calls",
      "P2a: derive_frontend carries TS→TS topology edges (App calls useAuth)")
check(GG.derive_frontend({"nodes": [{"id": "a.py#f", "kind": "function", "path": "a.py", "name": "f"}], "edges": []})["stats"]["total"] == 0,
      "P2a: a backend-only repo (no TS) → frontend honest-empty")

# P2a review fix 1 — SCAFFOLD (stories/spikes/tests) is dev-time, not app structure → excluded.
# MUTATION-PROVEN: drop `_is_scaffold` from the node filter and this fails (all 4 classify).
_W_scaf = {"nodes": [
    {"id": "apps/web/src/Real.tsx#Real", "kind": "function", "path": "apps/web/src/Real.tsx", "name": "Real"},
    {"id": "apps/web/src/Story.stories.tsx#Demo", "kind": "function", "path": "apps/web/src/Story.stories.tsx", "name": "Demo"},
    {"id": "apps/web/src/spikes/S.tsx#Probe", "kind": "function", "path": "apps/web/src/spikes/S.tsx", "name": "Probe"},
    {"id": "apps/web/src/X.test.tsx#Case", "kind": "function", "path": "apps/web/src/X.test.tsx", "name": "Case"},
  ], "edges": []}
_scaf = GG.derive_frontend(_W_scaf)
check(_scaf["stats"]["total"] == 1 and _scaf["nodes"][0]["name"] == "Real",
      "P2a-fix: scaffold (.stories/spikes/.test) dropped; only the shipped piece survives")

# P2a review fix 2 — the file/symbol ASYMMETRY: a route FILE node double-counts its route symbol
# (killed — route gates on kind), but a *Context/*Store FILE node is a store's ONLY signal (kept).
# MUTATION-PROVEN: un-guard the route branch → route==2; blanket-skip file nodes → store==0.
_W_file = {"nodes": [
    {"id": "apps/web/src/routes/Login.tsx", "kind": "file", "path": "apps/web/src/routes/Login.tsx", "name": "Login.tsx"},
    {"id": "apps/web/src/routes/Login.tsx#Login", "kind": "function", "path": "apps/web/src/routes/Login.tsx", "name": "Login"},
    {"id": "apps/web/src/authContext.ts", "kind": "file", "path": "apps/web/src/authContext.ts", "name": "authContext.ts"},
  ], "edges": []}
_ffe = GG.derive_frontend(_W_file)
check(_ffe["stats"]["by_kind"].get("route") == 1 and _ffe["stats"]["by_kind"].get("store") == 1
      and _ffe["stats"]["total"] == 2,
      "P2a-fix: route FILE node dropped (no symbol double-count), but a context FILE node kept as store")

# P2a review fix 3 — edges are COMPOSITION only (imports/calls/references); `contains` (file→symbol
# nesting) + extends/implements (type hierarchy) stay OUT. MUTATION-PROVEN: drop the _FE_EDGE_RELATIONS
# guard and `contains` survives.
_W_edge = {"nodes": [
    {"id": "apps/web/src/A.tsx#A", "kind": "function", "path": "apps/web/src/A.tsx", "name": "A"},
    {"id": "apps/web/src/B.tsx#B", "kind": "function", "path": "apps/web/src/B.tsx", "name": "B"},
  ], "edges": [
    {"source": "apps/web/src/A.tsx#A", "target": "apps/web/src/B.tsx#B", "relation": "references"},
    {"source": "apps/web/src/A.tsx#A", "target": "apps/web/src/B.tsx#B", "relation": "contains"},
  ]}
_ee = GG.derive_frontend(_W_edge)
check([e["rel"] for e in _ee["edges"]] == ["references"],
      "P2a-fix: edge set restricted to documented composition relations — `contains` dropped")

# P2b — HOME each piece to an entity or an FE-native bucket + carry scaffold for a toggle.
_W_home = {"nodes": [
    {"id": "apps/web/src/features/cooking/Pot.tsx#Pot", "kind": "function", "path": "apps/web/src/features/cooking/Pot.tsx", "name": "Pot"},
    {"id": "apps/web/src/features/profile/Bio.tsx#Bio", "kind": "function", "path": "apps/web/src/features/profile/Bio.tsx", "name": "Bio"},
    {"id": "apps/web/src/design-system/Btn.tsx#Btn", "kind": "function", "path": "apps/web/src/design-system/Btn.tsx", "name": "Btn"},
    {"id": "apps/web/src/routes/Home.tsx#Home", "kind": "function", "path": "apps/web/src/routes/Home.tsx", "name": "Home"},
    {"id": "apps/web/src/features/cooking/Pot.stories.tsx#Demo", "kind": "function", "path": "apps/web/src/features/cooking/Pot.stories.tsx", "name": "Demo"},
  ], "edges": []}
_h = GG.derive_frontend(_W_home, frozenset({"cooking"}))
_bh = _h["stats"]["by_home"]
check(_bh.get("fe·cooking") == 1 and _bh.get("design-system") == 1 and _bh.get("app-shell") == 1,
      "P2b (C split): a matched feature homes to the PAIRED fe·cooking, plus design-system and app-shell buckets")
check(_bh.get("profile") == 1 and [c["name"] for c in _h["stats"]["candidate_entities"]] == ["profile"],
      "P2b: a feature with no backend entity homes to itself AND flags as a candidate entity")
check(_h["stats"]["total"] == 4 and _h["stats"]["scaffold_total"] == 1
      and len(_h["scaffold"]) == 1 and _h["scaffold"][0]["home"] == "fe·cooking",
      "P2b: scaffold is carried SEPARATELY (out of total, kept for the toggle, homed to the fe twin)")
check(all("home" in n for n in _h["nodes"]),
      "P2b: every shipped piece carries its home")

# folded into the graph: the (alpha,beta) FK edge gains the new kinds; weight = sum
_garm = {"present": True, "reason": "test", "index_hash": "abc123def456",
         "pairs": _gx["pairs"], "stats": _gx["stats"]}
gg = G.build_c4_graph(FIX, labels=LABELS, status=STATUS, graft=_garm)
_ab = [e for e in gg["l1"]["edges"] if e["source"] == "alpha" and e["target"] == "beta"][0]
check(_ab["kinds"] == {"calls": 1, "fk": 2, "imports": 1} and _ab["weight"] == 4,
      "graft kinds fold into the reserved multi-kind edge dict; weight = sum")
check(gg["stats"]["graft"]["present"] is True
      and gg["stats"]["graft"]["index_hash"] == "abc123def456",
      "stats.graft carries the index fingerprint when present")
# a graft-only pair (no FK) creates a NEW edge rather than being dropped
_g2 = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
                       graft={"present": True, "reason": "t", "index_hash": "x",
                              "pairs": {("gamma", "alpha"): {"calls": 3}},
                              "stats": {"cross_calls": 3, "cross_imports": 0,
                                        "confidence": {}, "dropped": {}}})
_ga = [e for e in _g2["l1"]["edges"] if e["source"] == "gamma" and e["target"] == "alpha"]
check(len(_ga) == 1 and _ga[0]["kinds"] == {"calls": 3},
      "a graft-only entity pair becomes a NEW L1 edge (coupling FK cannot see)")

# ── P1a review D1/D2: STAT-ONLY relations never fold into the RENDERED L1 edge ──
# references co-emits a `calls` for the SAME node-pair (100% overlap on gustify) → folding it
# double-counts the weight; and references/contains/extends/implements have no edge CSS/legend.
# They stay honest in stats.cross_by_relation, but are never a drawn L1 kind. Whitelist=calls,imports.
_gwl = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
                        graft={"present": True, "reason": "t", "index_hash": "x",
                               "pairs": {("alpha", "beta"): {"calls": 2, "references": 2, "extends": 1}},
                               "stats": {}})
_abw = [e for e in _gwl["l1"]["edges"] if e["source"] == "alpha" and e["target"] == "beta"][0]
check("references" not in _abw["kinds"] and "extends" not in _abw["kinds"]
      and _abw["kinds"].get("calls") == 2,
      "P1a-fix D1: references/extends do NOT fold into the rendered L1 edge kinds (whitelist)")
_gonly = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
                          graft={"present": True, "reason": "t", "index_hash": "x",
                                 "pairs": {("gamma", "alpha"): {"references": 5}}, "stats": {}})
check(not any("references" in e.get("kinds", {}) for e in _gonly["l1"]["edges"]),
      "P1a-fix D2: a references-ONLY graft pair injects no references kind / no unstyled phantom wire")

# ── REGRESSION: graft absent → TOPOLOGY byte-identical to an FK-only build ──
g_none = G.build_c4_graph(FIX, labels=LABELS, status=STATUS, graft=None)
g_abs  = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
                          graft={"present": False, "reason": "no graft binary"})
for part in ("l1", "l2", "cross_edges", "layout"):
    check(json.dumps(g_none[part], sort_keys=True) == json.dumps(g[part], sort_keys=True)
          and json.dumps(g_abs[part], sort_keys=True) == json.dumps(g[part], sort_keys=True),
          f"graft absent: {part} is byte-identical to the pre-graft build")
check(g_abs["stats"]["graft"] == {"present": False, "reason": "no graft binary"},
      "graft absent: the absence is NAMED in stats, never silent")

# ══ THE ENDPOINT `behind` FLOOR (derive_behind + build_c4_graph attach) ══════
# do_a → do_b → do_b2 (real source): 2 transitive callees, BFS depth 2. The
# do_a → web/dist/bundle.js#x call is DROPPED (build-output noise, like derive_functions).
_beh = GG.derive_behind(WIRING, {"e": {"endpoints": [
    {"file": "apps/api/alpha.py", "fn": "do_a", "method": "GET", "path": "/a"}]}})
check(_beh == {"apps/api/alpha.py#do_a": {"fns": 2, "depth": 2, "names": ["do_b", "do_b2"]}},
      "derive_behind: transitive callees (fns) + BFS depth + NAMED fns, build-output noise EXCLUDED")
_beh2 = GG.derive_behind(WIRING, {"e": {"endpoints": [
    {"file": "apps/api/ghost.py", "fn": "nope", "method": "GET", "path": "/z"}]}})
check(_beh2 == {}, "derive_behind: an unresolvable handler gets NO entry (honest, never a zero)")
# the depth cap sets truncated:True (no silent cap) — exercised with a shrunk cap + a chain
_saved_cap = GG._BEHIND_DEPTH_CAP; GG._BEHIND_DEPTH_CAP = 2
_wt = {"nodes": [{"id": f"a{i}.py#f", "kind": "function", "path": f"a{i}.py"} for i in range(5)],
       "edges": [{"source": f"a{i}.py#f", "target": f"a{i+1}.py#f", "relation": "calls"} for i in range(4)]}
_bt = GG.derive_behind(_wt, {"e": {"endpoints": [{"file": "a0.py", "fn": "f", "method": "G", "path": "/x"}]}})
GG._BEHIND_DEPTH_CAP = _saved_cap
check(_bt["a0.py#f"].get("truncated") is True and _bt["a0.py#f"]["depth"] == 2,
      "derive_behind: the depth cap sets truncated:True (no silent cap)")

# ══ FILE-CENSUS REACH (derive_reach) — min call-hops from a mapped handler ══════════
# WIRING: alpha.py#do_a → calls → beta.py#do_b (hop 1); do_a → bundle.js (build-output noise,
# dropped); stray.py#s is NOT reachable from do_a. Handler = do_a.
_rent = {"e": {"endpoints": [{"file": "apps/api/alpha.py", "fn": "do_a", "method": "G", "path": "/x"}]}}
_rch = GG.derive_reach(WIRING, _rent, ["apps/api/beta.py", "apps/api/stray.py", "web/dist/bundle.js"])
check(_rch == {"apps/api/beta.py": 1},
      "derive_reach: FIRE — a census file reached at min-hop 1; the unreachable file + build-output noise carry no reach (%r)" % _rch)
check(GG.derive_reach(WIRING, _rent, []) == {}, "derive_reach: no census files → {} (honest-empty)")
check(GG.derive_reach({}, _rent, ["apps/api/beta.py"]) == {}, "derive_reach: no wiring → {} (honest-empty, graft absent)")
check(GG.derive_reach(WIRING, {"e": {"endpoints": [{"file": "nope.py", "fn": "g"}]}}, ["apps/api/beta.py"]) == {},
      "derive_reach: no indexed handler roots a walk → {} (never a guess)")

# ══ A2 · ENDPOINT ORM ACCESS via the call-tree (derive_endpoint_access + fold) ══
# WIRING: alpha.py#do_a → calls → beta.py#do_b → calls → beta.py#do_b2. faccess puts the
# ACCESS on the 2-hops-down callee, so the write must surface at the do_a endpoint.
_facc = {"apps/api/beta.py::do_b2": {"ops": [{"model": "Beta", "table": "betas", "rw": "w"}], "commits": True}}
_ea = GG.derive_endpoint_access(WIRING,
    {"e": {"endpoints": [{"file": "apps/api/alpha.py", "fn": "do_a", "method": "POST", "path": "/x"}]}}, _facc)
check(_ea.get("apps/api/alpha.py#do_a", {}).get("ops") == [{"model": "Beta", "table": "betas", "rw": "w"}]
      and _ea["apps/api/alpha.py#do_a"].get("commits") is True,
      "derive_endpoint_access: a WRITE delegated 2 hops down the call-tree surfaces at the endpoint + commits")
check(GG.derive_endpoint_access(WIRING, {"e": {"endpoints": [{"file": "apps/api/alpha.py", "fn": "do_a", "method": "P", "path": "/x"}]}}, None) == {},
      "derive_endpoint_access: no faccess → {} (honest-empty)")
check(GG.derive_endpoint_access(WIRING, {"e": {"endpoints": [{"file": "apps/api/stray.py", "fn": "s", "method": "G", "path": "/y"}]}},
    {"apps/api/nowhere.py::z": {"ops": [{"model": "Q", "table": "q", "rw": "r"}]}}) == {},
      "derive_endpoint_access: a handler whose tree touches no data gets NO entry")
# ── D2W · distance-to-write: reverse-BFS from the write-anchors over the fn→fn calls graph ──
# WIRING chain: alpha.py#do_a → do_b → do_b2 (writes); stray.py#s → do_b. do_a→bundle.js#x is noise.
_d2w = GG.derive_distance_to_write(WIRING, _facc)
check(_d2w.get("apps/api/beta.py#do_b2") == 0 and _d2w.get("apps/api/beta.py#do_b") == 1
      and _d2w.get("apps/api/alpha.py#do_a") == 2 and _d2w.get("apps/api/stray.py#s") == 2,
      "derive_distance_to_write: write-anchor=0, each caller +1 (reverse-BFS over the calls graph)")
check("web/dist/bundle.js#x" not in _d2w and all(isinstance(v, int) and v >= 0 for v in _d2w.values()),
      "derive_distance_to_write: build-output noise excluded; only reachable fns carry a distance")
check(GG.derive_distance_to_write(WIRING, None) == {}
      and GG.derive_distance_to_write(WIRING, {"apps/api/beta.py::do_b2": {"ops": [{"model": "Beta", "table": "betas", "rw": "r"}]}}) == {},
      "derive_distance_to_write: no faccess OR read-only (no write-anchor) → {} (honest-empty)")
# FOLD — build_c4_graph draws writes_to/reads_from from endpoint_access (intra or cross)
_gacc = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
    graft={"present": True, "reason": "t", "index_hash": "x", "index_nodes": 1, "index_edges": 1,
           "pairs": {}, "stats": {},
           "endpoint_access": {"None#get_alpha": {"ops": [{"model": "A", "table": "a", "rw": "w"}], "commits": True}}})
_wall = ([e for _s in _gacc["l2"].values() for e in _s["edges"] if e.get("kind") == "writes_to"]
         + [e for e in _gacc["cross_edges"] if e.get("kind") == "writes_to"])
check(any((e.get("target") or e.get("to")) == "model:A" for e in _wall) and _gacc["stats"].get("access_edges", 0) >= 1,
      "A2 fold: endpoint_access → a drawn writes_to edge to the model + stats.access_edges counts it")
_gna = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
    graft={"present": True, "reason": "t", "index_hash": "x", "index_nodes": 1, "index_edges": 1, "pairs": {}, "stats": {}})
check(not any(e.get("kind") in ("writes_to", "reads_from") for _s in _gna["l2"].values() for e in _s["edges"])
      and _gna["stats"].get("access_edges", 0) == 0,
      "A2 honest-empty: no endpoint_access → no access edges (0)")
# ── C3 · mint an ABSENT access-target model (not in FIX) → unclaimed bucket + landed edge ──
_gc3 = G.build_c4_graph(FIX, labels=LABELS, status=STATUS,
    graft={"present": True, "reason": "t", "index_hash": "x", "index_nodes": 1, "index_edges": 1,
           "pairs": {}, "stats": {},
           "endpoint_access": {"None#get_alpha": {"ops": [{"model": "Ghost", "table": "ghosts", "rw": "w"}], "commits": False}}})
_um = _gc3["l2"].get("__unclaimed__", {"nodes": []})
check(any(n["id"] == "model:Ghost" and n.get("unmapped") for n in _um["nodes"])
      and _gc3["stats"].get("minted_models", 0) == 1,
      "C3: an absent access-target model is MINTED into the unclaimed bucket (unmapped node)")
check(any(e.get("to") == "model:Ghost" and e.get("kind") == "writes_to" for e in _gc3["cross_edges"])
      and any(n["kind"] == "unclaimed" for n in _gc3["l1"]["nodes"]),
      "C3: the write edge LANDS on the minted model + the unclaimed L1 node exists")
check(_gna["stats"].get("minted_models", 0) == 0,
      "C3 honest-empty: no absent-model access → nothing minted (0)")
# ── C1 · function roles (accessor / caller / gate / pure) ──
_wr = {"nodes": [{"id": "a.py#handler", "kind": "function", "path": "a.py"},
                 {"id": "a.py#svc_write", "kind": "function", "path": "a.py"},
                 {"id": "a.py#require_auth", "kind": "function", "path": "a.py"},
                 {"id": "a.py#helper", "kind": "function", "path": "a.py"}],
       "edges": [{"source": "a.py#handler", "target": "a.py#svc_write", "relation": "calls"}]}
_fr = GG.derive_fn_roles(_wr, {"a.py::svc_write": {"ops": [{"model": "M", "table": "m", "rw": "w"}]}})
check(_fr.get("a.py#svc_write") == "accessor" and _fr.get("a.py#handler") == "caller"
      and _fr.get("a.py#require_auth") == "gate" and _fr.get("a.py#helper") == "pure",
      "derive_fn_roles: accessor (own op) · caller (reaches it) · gate (name) · pure (leaf)")
check(GG.derive_fn_roles(_wr, None) == {}, "derive_fn_roles: no faccess → {} (honest-empty)")
# B0 precedence swap: a gate-named fn that ALSO carries ops is labeled GATE, not accessor (a guard
# that reads is still a guard); it stays in the accessor set (write-path anchor) but wears gate.
_frb = GG.derive_fn_roles(_wr, {"a.py::svc_write": {"ops": [{"model": "M", "table": "m", "rw": "w"}]},
                                "a.py::require_auth": {"ops": [{"model": "H", "table": "h", "rw": "r"}]}})
check(_frb.get("a.py#require_auth") == "gate" and _frb.get("a.py#handler") == "caller",
      "B0: a gate-named fn WITH ops is GATE not accessor; its caller still reaches the write-path")

# ── class 12 (wave C) · feature-flag walls: mint a flag:<NAME> node + a walls edge ──
_fixfl = json.loads(json.dumps(FIX))
_fixfl["entities"]["alpha"]["endpoints"][0]["flags"] = [{"name": "FEAT", "on": "off", "on_fail": "403", "line": 5}]
_fixfl["flags"] = {"FEAT": {"src": "config.py", "line": 5, "default": False}}
_gfl = G.build_c4_graph(_fixfl, labels=LABELS, status=STATUS)
_flnodes = [n for g in _gfl["l2"].values() for n in g["nodes"] if n["kind"] == "flag"]
check(len(_flnodes) == 1 and _flnodes[0]["id"] == "flag:FEAT" and _flnodes[0]["slug"] == "alpha",
      "class 12 FIRE: a flag walling an endpoint mints flag:<NAME> homed to the reader entity (intra)")
_wedges = [e for g in _gfl["l2"].values() for e in g.get("edges", []) if e.get("kind") == "walls"] \
          + [e for e in _gfl["cross_edges"] if e.get("kind") == "walls"]
check(len(_wedges) == 1 and _wedges[0]["from"] == "flag:FEAT" and _wedges[0]["on_fail"] == "403",
      "class 12 FIRE: a walls edge flag→endpoint carries on_fail")
check(_gfl["stats"].get("flags") == {"declared": 1, "drawn": 1}, "class 12: stats.flags {declared, drawn}")
# honest-empty: no amap.flags + no endpoint.flags → no flag node, no walls edge, no stats.flags key
_gfl0 = G.build_c4_graph(FIX, labels=LABELS, status=STATUS)
check(not any(n["kind"] == "flag" for g in _gfl0["l2"].values() for n in g["nodes"]) and "flags" not in _gfl0["stats"],
      "class 12 honest-empty: no flags upstream → no flag node + no stats.flags key (byte-identical)")

# ── class 5b (wave C) · serializes (schema→model): NAMING arm + SITE-wins + honest-empty ──
_fixsr = {"head": "h", "entities": {"e": {"endpoints": [],
          "models": [{"cls": "Recipe", "table": "recipes"}],
          "schemas": [{"cls": "RecipeResponse", "orm": True}, {"cls": "PlainOut"}], "files": []}},
          "function_insight": {}}
_gsr = G.build_c4_graph(_fixsr, labels={"e": "E"}, status={})
_se = [e for g in _gsr["l2"].values() for e in g.get("edges", []) if e.get("kind") == "serializes"] \
      + [e for e in _gsr["cross_edges"] if e.get("kind") == "serializes"]
_pairs = {(e.get("source", e.get("from")), e.get("target", e.get("to"))) for e in _se}
check(("schema:RecipeResponse", "model:Recipe") in _pairs and len(_se) == 1,
      "class 5b NAMING: an orm:True schema strips to exactly one model → serializes edge (PlainOut, no orm, no edge)")
check(_gsr["stats"]["serializes"] == {"pairs": 1, "site": 0, "naming": 1}, "class 5b: stats.serializes {pairs, site, naming}")
_fixsr2 = json.loads(json.dumps(_fixsr))
_fixsr2["function_insight"] = {"e.py::f": {"access": {"serializes": [{"cls": "RecipeResponse", "model": "Recipe", "line": 3}]}}}
_gsr2 = G.build_c4_graph(_fixsr2, labels={"e": "E"}, status={})
check(_gsr2["stats"]["serializes"]["site"] == 1 and _gsr2["stats"]["serializes"]["naming"] == 0,
      "class 5b SITE-WINS: a model_validate site is the extracted pair; the schema's naming edge is suppressed")
_fixsr0 = {"head": "h", "entities": {"e": {"endpoints": [], "models": [{"cls": "Recipe", "table": "recipes"}], "schemas": [{"cls": "RecipeResponse"}], "files": []}}}
_gsr0 = G.build_c4_graph(_fixsr0, labels={"e": "E"}, status={})
check(not any(e.get("kind") == "serializes" for g in _gsr0["l2"].values() for e in g.get("edges", [])) and "serializes" not in _gsr0["stats"],
      "class 5b honest-empty: no orm schema + no site → no serializes edge + no stats key")

# ── C4 follow-up · endpoint MIDDLEWARE floor folded to the node + stats ──
_fixmw = json.loads(json.dumps(FIX))
_fixmw["entities"]["alpha"]["endpoints"][0]["middleware"] = [
    {"name": "get_auth_context", "via": "param-dep", "gate": True},
    {"name": "get_session", "via": "param-dep", "gate": False}]
_gmw = G.build_c4_graph(_fixmw, labels=LABELS, status=STATUS)
_epn = [n for _s in _gmw["l2"].values() for n in _s["nodes"] if n["kind"] == "endpoint" and n.get("middleware")]
check(_epn and _epn[0]["middleware"][0]["name"] == "get_auth_context",
      "C4: the endpoint node carries its middleware floor (gate-first order preserved)")
check(_gmw["stats"].get("middleware_endpoints", 0) == 1 and _gmw["stats"].get("gate_endpoints", 0) == 1,
      "C4 stats: middleware_endpoints + gate_endpoints count the folded gates")
check(_gna["stats"].get("middleware_endpoints", 0) == 0 and _gna["stats"].get("gate_endpoints", 0) == 0,
      "C4 honest-empty: no middleware on any endpoint → both counts 0")
# the named-fn list caps at _BEHIND_NAMES_CAP (12) with a +N remainder
_wc = {"nodes": [{"id": f"c/{i}.py#f{i}", "kind": "function", "path": f"c/{i}.py"} for i in range(15)]
                + [{"id": "c/h.py#h", "kind": "function", "path": "c/h.py"}],
       "edges": [{"source": "c/h.py#h", "target": f"c/{i}.py#f{i}", "relation": "calls"} for i in range(15)]}
_bc = GG.derive_behind(_wc, {"e": {"endpoints": [{"file": "c/h.py", "fn": "h", "method": "G", "path": "/x"}]}})["c/h.py#h"]
check(_bc["fns"] == 15 and len(_bc["names"]) == 12 and _bc.get("names_more") == 3,
      "derive_behind: the named-fn list caps at 12 with a +N remainder")
# the floor attaches to the endpoint node by <file>#<fn>; a mini-archmap with a filed endpoint
_bam = {"head": "b", "entities": {"e": {
    "files": [["api", "apps/api/alpha.py", 10]], "models": [], "schemas": [],
    "endpoints": [{"method": "GET", "path": "/a", "fn": "do_a",
                   "file": "apps/api/alpha.py", "touches": []}]}}}
_bgraft = {"present": True, "reason": "t", "index_hash": "x", "pairs": {}, "stats": {},
           "behind": {"apps/api/alpha.py#do_a": {"fns": 2, "depth": 2}}}
_bg = G.build_c4_graph(_bam, graft=_bgraft)
_enode = [n for n in _bg["l2"]["e"]["nodes"] if n["kind"] == "endpoint"][0]
check(_enode.get("behind") == {"fns": 2, "depth": 2},
      "build_c4_graph: the behind floor attaches to the endpoint node by <file>#<fn>")
check(_bg["stats"]["behind"] == {"present": True, "scored": 1, "max_fns": 2},
      "stats.behind records the scored-handler count + max mass when graft present")
# honest-empty: graft absent → no endpoint carries behind, stats.behind names the absence
_bg0 = G.build_c4_graph(_bam, graft=None)
_e0 = [n for n in _bg0["l2"]["e"]["nodes"] if n["kind"] == "endpoint"][0]
check("behind" not in _e0 and _bg0["stats"]["behind"] == {"present": False},
      "behind honest-empty: graft absent → no endpoint badge + stats.behind present:False")

# ══ THE PER-FUNCTION `behind` FLOOR (derive_fn_behind — every call-source fn) ══
# the operator's "every drawn node carries its hidden mass": what a FUNCTION pulls in
# transitively (put under the rug), same BFS/noise-filter/caps as the endpoint floor.
# adj = do_a→do_b→do_b2 ; stray.s→do_b ; do_a→bundle.js DROPPED (build-output noise).
_fnb = GG.derive_fn_behind(WIRING)
check(_fnb.get("apps/api/alpha.py#do_a") == {"fns": 2, "depth": 2, "names": ["do_b", "do_b2"]},
      "derive_fn_behind: a caller's transitive callee mass (noise excluded), same shape as an endpoint's")
check(_fnb.get("apps/api/beta.py#do_b") == {"fns": 1, "depth": 1, "names": ["do_b2"]},
      "derive_fn_behind: an intermediate fn carries only what IT pulls in (do_b → do_b2)")
check("apps/api/beta.py#do_b2" not in _fnb,
      "derive_fn_behind: a LEAF fn (no outgoing calls) gets NO entry (honest-empty, panel omits the section)")
check("web/dist/bundle.js#x" not in _fnb,
      "derive_fn_behind: build-output noise is never a call-source (mirrors derive_behind)")

# ── the .ignore defuse: SURGICAL — graft's block dies, user lines survive ──
with tempfile.TemporaryDirectory() as _td:
    _r = _pl.Path(_td)
    # FIRE: a pure graft-written .ignore (its comment + its entries) is removed whole
    (_r / ".ignore").write_text("# graft: keep the cards out of ripgrep\n!graft/\ngraft/.cache/\ngraft/.graph/\n")
    GG._defuse_ignore(_r)
    check(not (_r / ".ignore").exists(), ".ignore defuse FIRES: a pure graft block is removed")
    # SILENT half: a USER .ignore with graft's block APPENDED keeps every user line
    (_r / ".ignore").write_text("coverage/\ngraft/\n# mine, mentions nothing\n!graft/\ngraft/.graph/\n")
    GG._defuse_ignore(_r)
    _left = (_r / ".ignore").read_text()
    check(_left == "coverage/\ngraft/\n# mine, mentions nothing\n",
          ".ignore defuse is SURGICAL: user lines (incl. their own graft/ hide-rule) survive")
    # SILENT: an .ignore with NOTHING of graft's is untouched byte-for-byte
    (_r / ".ignore").write_text("dist/\n*.log\n")
    GG._defuse_ignore(_r)
    check((_r / ".ignore").read_text() == "dist/\n*.log\n",
          ".ignore defuse stays SILENT on a file with no graft content")

# ── ensure_index BUILD path: a fake `graft` binary on PATH (hermetic) ──
import os as _os
with tempfile.TemporaryDirectory() as _td:
    _r = _pl.Path(_td); _bin = _r / "bin"; _bin.mkdir()
    _gdir = _r / "repo" / "graft" / ".graph"; _gdir.mkdir(parents=True)
    # the fake binary writes the hazardous .ignore + a wiring index, like the real one
    (_bin / "graft").write_text("#!/bin/sh\nprintf '!graft/\\n' > .ignore\n"
                                "exit 0\n")
    (_bin / "graft").chmod(0o755)
    (_gdir / "wiring.json").write_text(json.dumps(WIRING), encoding="utf-8")
    _old = _os.environ.get("PATH", "")
    _os.environ["PATH"] = str(_bin) + _os.pathsep + _old
    try:
        _p2, _r2 = GG.ensure_index(_r / "repo", allow_build=True)
        check(_p2 is not None and _r2 == "rebuilt", "ensure_index build path: fake binary runs → 'rebuilt'")
        check(not (_r / "repo" / ".ignore").exists(),
              "ensure_index build path: the hazardous .ignore the build wrote is defused")
    finally:
        _os.environ["PATH"] = _old

# ── a corrupt/truncated index → a NAMED state, never a parser traceback ──
with tempfile.TemporaryDirectory() as _td:
    _gd = _pl.Path(_td) / "graft" / ".graph"; _gd.mkdir(parents=True)
    (_gd / "wiring.json").write_text('{"meta": {"version": 1}, "nodes": [{"id"')  # truncated
    _armc = GG.graft_arm(_pl.Path(_td), FIX["entities"], allow_build=False)
    check(_armc["present"] is False and _armc["reason"] == "index unreadable (corrupt or truncated)",
          "graft_arm: a truncated index yields the clean named reason, no parser leak")

# ── FLOW STABILITY: the deps gradient is FK-only — graft must not move fx/fy ──
_gflow = G.build_c4_graph(FIX, labels=LABELS, status=STATUS, graft=_garm)
_nof   = G.build_c4_graph(FIX, labels=LABELS, status=STATUS, graft=None)
check(all(a["fx"] == b["fx"] and a["fy"] == b["fy"]
          for a, b in zip(sorted(_gflow["l1"]["nodes"], key=lambda n: n["id"]),
                          sorted(_nof["l1"]["nodes"], key=lambda n: n["id"]))),
      "flow layout is FK-only: graft call edges never move the baked fx/fy")

# ── drop evidence: the counters carry top path prefixes + the collision count ──
check("dropped_top_prefixes" in _gx["stats"] and
      _gx["stats"]["dropped_top_prefixes"].get("noise", {}).get("web/dist") == 1,
      "derive_cross records WHICH prefixes were dropped, not just how many")
check(_gx["stats"]["file_entity_collisions"] == 0,
      "derive_cross counts file→entity claim collisions (0 in the fixture)")

# ── ensure_index: no binary + no index → honest reason; never raises ──
with tempfile.TemporaryDirectory() as _td:
    _p, _r = GG.ensure_index(_pl.Path(_td), allow_build=False)
    check(_p is None and "no index" in _r, "ensure_index: empty repo → None + reason")
    _arm = GG.graft_arm(_pl.Path(_td), FIX["entities"], allow_build=False)
    check(_arm["present"] is False and "no index" in _arm["reason"],
          "graft_arm: absence degrades to present=False with the reason")
    # a real index on disk, read as-found (build disabled = the dry-run path)
    _gd = _pl.Path(_td) / "graft" / ".graph"; _gd.mkdir(parents=True)
    (_gd / "wiring.json").write_text(json.dumps(WIRING), encoding="utf-8")
    _arm2 = GG.graft_arm(_pl.Path(_td), FIX["entities"], allow_build=False)
    check(_arm2["present"] is True and _arm2["pairs"] == {("alpha", "beta"): {"calls": 1, "imports": 1}}
          and len(_arm2["index_hash"]) == 12,
          "graft_arm: as-found index consumed + fingerprinted (dry-run path)")
    # determinism: same index bytes → same hash + same pairs
    _arm3 = GG.graft_arm(_pl.Path(_td), FIX["entities"], allow_build=False)
    check(_arm2 == _arm3, "graft_arm: deterministic (same input → identical output)")

# ── CROSS-ENTITY PIECE EDGES: model→model FKs that cross entities (piece res) ─
# alpha.A has 4 FKs: self a.id (intra) · b.id + b.x (both → beta model:B) · legacy_x
# (unclaimed). Only the two beta FKs are cross-entity piece edges; intra + unclaimed
# are excluded. Both target table b → model:B (the deduped owner). via keeps the col.
xa = g["cross_edges"]
xe = [e for e in xa if "via" in e]   # FK cross-edges — touches edges carry kind, no via
check(g["stats"]["cross_edges"] == len(xa) == 3 and len(xe) == 2,
      "cross_edges = 2 cross-entity FKs + 1 touches (intra + unclaimed excluded)")
check(all(e["from_slug"] == "alpha" and e["from"] == "model:A"
          and e["to_slug"] == "beta" and e["to"] == "model:B" for e in xe),
      "each cross edge resolves BOTH ends to the specific model piece")
check(sorted(e["via"] for e in xe) == ["b_col", "b_col2"],
      "cross edges keep the FK column (via) the L1 aggregate drops")
check(not any(e["via"] == "self_col" for e in xe),
      "the intra-entity self-FK is NOT a cross edge")
check(not any(e["to_slug"] == G._UNCLAIMED or "legacy" in e.get("via", "") for e in xe),
      "a FK to an unmodelled table has no target piece → excluded from cross_edges")
check(xe == sorted(xe, key=lambda e: (e["from_slug"], e["from"], e["to_slug"], e["to"], e["via"])),
      "cross_edges is deterministically sorted")
# FIRE: a fixture with NO cross-entity FK yields an empty list (the check can fail)
_nox = G.build_c4_graph({"head": "nox", "entities": {
    "solo": {"files": [], "models": [{"cls": "S", "table": "s", "fks": {"self": "s.id"}}],
             "schemas": [], "endpoints": []}}})
check(_nox["cross_edges"] == [] and _nox["stats"]["cross_edges"] == 0,
      "MUTATION: an intra-only graph has zero cross_edges (guard is falsifiable)")

# ── MODEL IDS: the structural id-card (Tier 1 panel data) on L2 model nodes ──
# model A has cols → datatype. The GET /alpha endpoint touches model Dup → Dup gets
# endpoint + principal fn. A model touched by nothing with no cols → NO ids (honest).
a2n = {n["id"]: n for n in a2["nodes"]}
aids = a2n["model:A"].get("ids", {})
check([d["n"] for d in aids.get("datatype", [])] == ["id", "name"]
      and aids["datatype"][0]["t"] == "uuid.UUID",
      "model_ids: a model's cols become datatype [{n,t}] in source order")
dupids = a2n["model:Dup"].get("ids", {})
check(any(e["fn"] == "get_alpha" and e["m"] == "GET" for e in dupids.get("endpoint", [])),
      "model_ids: an endpoint that touches the model appears in ids.endpoint")
check(dupids.get("principal") == "get_alpha" and dupids.get("fn") == ["get_alpha"],
      "model_ids: the principal fn is the endpoint's fn (surfaced for the panel)")
check("endpoint" not in aids and "principal" not in aids,
      "model_ids: model A (no endpoint touches it) has no API/principal — honest-empty")
# a pure sink model with neither cols nor a touching endpoint carries NO ids at all
gmn = {n["id"]: n for n in g["l2"]["gamma"]["nodes"]}
check("ids" not in gmn["model:Gm"], "model_ids: a bare model gets no ids card (honest-empty)")
# reuse-shape: model_ids is a pure function callable directly
_mi = G.model_ids({"cls": "Z", "cols": [["x", "int", ""]]},
                  [{"method": "POST", "path": "/z", "fn": "mk_z", "touches": ["Z"]}])
check(_mi["principal"] == "mk_z" and _mi["datatype"] == [{"n": "x", "t": "int"}],
      "model_ids is a reusable pure helper (datatype + principal)")

# ── ELEMENT DETAIL: the panel dossier (PURPOSE·STRUCTURE·SIGNATURE·TESTED-BY)
# on L2 nodes — derived from the insight blocks, capped, honest-empty.
# FIX has NO insight blocks: det still fires from archmap alone (cols), and an
# endpoint with nothing to show carries NO det key at all.
check(a2n["model:A"].get("det", {}).get("cols") == [["id", "uuid.UUID", ""], ["name", "str", ""]],
      "det: model cols ride the dossier even without insight blocks")
check("det" not in a2n["endpoint:GET /alpha"],
      "det: an endpoint with no doc/file/insight carries NO det key (honest-empty)")
check("det" not in gmn["model:Gm"] or gmn["model:Gm"]["det"],
      "det: never an empty dict on a node")
FIX_DET = {"head": "de7a11", "entities": {
  "alpha": {
    "files": [["api", "apps/api/alpha.py", 900]],   # over the 800 budget → flines carries it
    "models": [{"cls": "A", "table": "a", "doc": "The A record.",
                "file": "apps/api/alpha.py",
                "cols": [[f"c{i}", "int", ""] for i in range(12)],   # 12 → 10 + 2 more
                "uqs": ["UniqueConstraint('c2', 'c1', name='uq_a_c2_c1')",
                         "UniqueConstraint('nope', name='uq_gone')"],   # the PARSER shape (ast.unparse)
                "fks": {"b_col": "b.id", "a_col": "a.id"}},
               {"cls": "Bare", "table": "bare", "doc": "—", "fks": {}}],   # em-dash doc skipped
    "schemas": [{"cls": "AOut", "doc": "Out shape.", "file": "apps/api/alpha.py",
                 "fields": [["x", "str", ""]]}],
    "endpoints": [{"method": "GET", "path": "/a", "fn": "get_a", "doc": "Reads A.",
                   "file": "apps/api/alpha.py", "status": 200, "resp": "AOut",
                   "touches": ["AOut"]}],
  }},
  "function_insight": {"apps/api/alpha.py::get_a":
      {"returns": "AOut", "async": True, "lines": 42, "api": 3, "internal": 1}},
  "model_insight": {"A": {"fk_in": 5, "internal": 2}},
  "test_insight": {
    "by_endpoint": {"apps/api/alpha.py::get_a":
        {"api": [{"cid": f"C{i}", "name": f"t{i}_C{i}", "state": "pass", "corpus": "api",
                  "tfile": "tests/t.py"} for i in range(G._DET_CASES_CAP + 2)]
              + [{"cid": "", "name": "3 case(s)", "state": "file", "corpus": "web",
                  "tfile": "tests/w.spec.ts"}]}},   # 8 → 6 + 2 more; the file row splits out
    "by_model": {"A": {"direct": [{"cid": "C9", "name": "t9_C9", "state": "fail",
                                   "corpus": "api", "tfile": "tests/t.py"}],
                       "via_route": [{"cid": "C9", "name": "t9_C9", "state": "fail",
                                      "corpus": "api", "tfile": "tests/t.py"}]},   # same case, twice-credited
                 "AOut": {"direct": [{"cid": "C77", "name": "t77_C77", "state": "pass",
                                      "corpus": "api", "tfile": "tests/t.py"}]}},
  }}
gd = G.build_c4_graph(FIX_DET)
dn = {n["id"]: n for n in gd["l2"]["alpha"]["nodes"]}
adet = dn["model:A"]["det"]
check(adet["doc"] == "The A record." and adet["file"] == "apps/api/alpha.py"
      and adet["flines"] == 900,
      "det: model doc + file + flines (joined from the entity's files)")
check(len(adet["cols"]) == 10 and adet["cols_more"] == 2,
      "det: STRUCTURE capped at 10 cols with cols_more (12-col model)")
check(adet["uqs"] == ["c1", "c2"],
      "det: uqs NORMALIZED — quoted names extracted from the constraint EXPRESSION "
      "strings and intersected with the columns ('nope' dropped)")
check(adet["fks"] == [["a_col", "a.id"], ["b_col", "b.id"]],
      "det: STORED-AS fks sorted by column")
check(adet["usage"] == {"fk_in": 5, "internal": 2},
      "det: model usage from model_insight")
check(adet["cases"] == [{"cid": "C9", "name": "t9_C9", "state": "fail", "corpus": "api"}]
      and "cases_more" not in adet,
      "det: TESTED-BY deduped across direct/via_route (one row, not two), tfile dropped")
edet = dn["endpoint:GET /a"]["det"]
check(edet["doc"] == "Reads A." and edet["status"] == "200",
      "det: endpoint PURPOSE + status (stringified)")
check(edet["sig"] == {"returns": "AOut", "async": True, "lines": 42},
      "det: SIGNATURE from function_insight (returns/async/lines)")
check(edet["usage"] == {"api": 3, "internal": 1}, "det: endpoint usage from function_insight")
check(len(edet["cases"]) == G._DET_CASES_CAP and edet["cases_more"] == 2,
      "det: TESTED-BY capped at _DET_CASES_CAP with cases_more (CAP+2 REAL cases; the file row never counts)")
check(all(c["state"] != "file" for c in edet["cases"]),
      "det: route-literal FILE credits never impersonate cases")
check(edet["case_files"] == [{"corpus": "web", "name": "3 case(s)"}],
      "det: the file credit survives as case_files (a coverage-by-file fact)")
check(edet["cases"] == sorted(edet["cases"], key=lambda r: (r["corpus"], r["cid"], r["name"])),
      "det: cases deterministically sorted")
check(dn["endpoint:GET /a"].get("fn") == "get_a" and dn["endpoint:GET /a"].get("resp") == "AOut",
      "det: endpoint node carries fn + resp for the card's route rows")
_gdash = G.build_c4_graph({"head": "d1", "entities": {"e": {"files": [], "models": [], "schemas": [],
    "endpoints": [{"method": "GET", "path": "/x", "fn": "g", "resp": "—", "touches": []}]}}})
check("resp" not in {n["id"]: n for n in _gdash["l2"]["e"]["nodes"]}["endpoint:GET /x"],
      "det: the parser's em-dash resp default never ships as a returns row")

# ══ RESPONSE PAYLOAD floor (det.payload) — FIRE + SILENT + the list[X] unwrap ═══════════════
check(edet.get("payload") == {"n": 1, "schema": "AOut"},
      "det: endpoint carries a payload field-count for its modelled resp (AOut → 1 field)")   # gap #4 FIRE
check("payload" not in {n["id"]: n for n in _gdash["l2"]["e"]["nodes"]}["endpoint:GET /x"].get("det", {}),
      "det: an em-dash / unmodelled resp emits NO payload (honest-empty)")                    # gap #4 SILENT
_gwrap = G.build_c4_graph({"head": "w", "entities": {"e": {"files": [], "models": [],
    "schemas": [{"cls": "WOut", "fields": [["a", "int", ""], ["b", "int", ""]]}],
    "endpoints": [{"method": "GET", "path": "/w", "fn": "gw", "resp": "list[WOut]", "touches": []}]}}})
check({n["id"]: n for n in _gwrap["l2"]["e"]["nodes"]}["endpoint:GET /w"]["det"].get("payload") == {"n": 2, "schema": "WOut"},
      "det: a wrapped resp list[WOut] unwraps to WOut for the payload count")                 # gap #2 regression

# ══ TEST JOURNEYS (det.test_journeys) — an ENDPOINT-mediated cross-entity span, NO _file_entity ═══
# the fixture carries no _file_entity (build_center_a3's production shape); the emitter must build
# fent from each entity's files, else endpoint/function journeys are silently dropped (gap #1).
FIX_JRN = {"head": "j0", "entities": {
  "alpha": {"files": [["api", "apps/api/alpha.py", 10]], "models": [], "schemas": [],
            "endpoints": [{"method": "GET", "path": "/a", "fn": "ga", "file": "apps/api/alpha.py", "touches": []}]},
  "beta":  {"files": [["api", "apps/api/beta.py", 10]], "models": [], "schemas": [],
            "endpoints": [{"method": "GET", "path": "/b", "fn": "gb", "file": "apps/api/beta.py", "touches": []}]}},
  "test_insight": {"by_endpoint": {
    "apps/api/alpha.py::ga": {"api": [{"cid": "C1", "name": "tC1", "state": "pass", "corpus": "api", "tfile": "t.py"}]},
    "apps/api/beta.py::gb":  {"api": [{"cid": "C1", "name": "tC1", "state": "pass", "corpus": "api", "tfile": "t.py"}]}}}}
_gj = G.build_c4_graph(FIX_JRN)
_ja = {n["id"]: n for n in _gj["l2"]["alpha"]["nodes"]}["endpoint:GET /a"].get("det", {})
check(bool(_ja.get("test_journeys")) and _ja["test_journeys"][0]["cid"] == "C1"
      and set(_ja["test_journeys"][0]["entities"]) == {"alpha", "beta"},
      "det: an ENDPOINT-mediated cross-entity test emits a journey (fent built from files — gap #1 guard)")  # gap #5 FIRE
_gj0 = G.build_c4_graph({**FIX_JRN, "test_insight": {}})
check(not any((n.get("det") or {}).get("test_journeys") for gg2 in _gj0["l2"].values() for n in gg2["nodes"]),
      "det: no test_insight → no test_journeys anywhere (honest-empty, byte-identical)")       # gap #5 SILENT
sdet = dn["schema:AOut"]["det"]
check(sdet["cols"] == [["x", "str", ""]] and sdet["doc"] == "Out shape.",
      "det: schema fields become cols; schema doc carried")
check(sdet.get("cases") == [{"cid": "C77", "name": "t77_C77", "state": "pass", "corpus": "api"}],
      "det: a schema's own by_model cases carry (no mi record → the floor keeps them)")
# the kind/file-blind join: a schema named like a MODEL in another file must NOT
# inherit that model's fan-in or cases
_gcol = G.build_c4_graph({"head": "col1", "entities": {
    "a": {"files": [], "models": [{"cls": "X", "table": "x", "file": "fa.py", "fks": {},
                                    "cols": [["id", "int", ""]]}], "schemas": [], "endpoints": []},
    "b": {"files": [], "models": [], "schemas": [{"cls": "X", "file": "fb.py",
                                                   "fields": [["y", "str", ""]]}], "endpoints": []}},
    "model_insight": {"X": {"file": "fa.py", "fk_in": 5, "internal": 2}},
    "test_insight": {"by_model": {"X": {"direct": [{"cid": "C1", "name": "t_C1",
                                                     "state": "pass", "corpus": "api"}]}}}})
_bx = {n["id"]: n for n in _gcol["l2"]["b"]["nodes"]}["schema:X"]
check("usage" not in _bx.get("det", {}) and "cases" not in _bx.get("det", {}),
      "det: a schema sharing a MODEL's class name inherits neither its fan-in nor its cases")
_ax = {n["id"]: n for n in _gcol["l2"]["a"]["nodes"]}["model:X"]
check(_ax["det"]["usage"] == {"fk_in": 5, "internal": 2},
      "det: the true owner (file-matched) keeps its usage")
check("doc" not in dn["model:Bare"].get("det", {}),
      "det: an em-dash doc is skipped (honest-empty PURPOSE)")
check(json.dumps(gd, sort_keys=True) == json.dumps(G.build_c4_graph(FIX_DET), sort_keys=True),
      "det: byte-deterministic across rebuilds")

# ── NODE-ID UNIQUENESS: beta's duplicate model B yields ONE node ────────────
b2ids = [n["id"] for n in g["l2"]["beta"]["nodes"]]
check(b2ids.count("model:B") == 1, "a duplicate model class yields a single L2 node id")

# ── LAYOUT: every node carries stamped x/y ─────────────────────────────────
check(all("x" in n and "y" in n for n in g["l1"]["nodes"]),
      "L1 nodes carry stamped x/y")
check(all("x" in n and "y" in n for n in a2["nodes"]), "L2 nodes carry stamped x/y")

# ── FLOW LAYOUT: fx/fy stamped; the deps gradient (dependent RIGHT of its sink) ─
check(all("fx" in n and "fy" in n for n in g["l1"]["nodes"]),
      "L1 nodes carry flow fx/fy alongside ring x/y (additive)")
check(l1n["alpha"]["fx"] > l1n["beta"]["fx"] and l1n["gamma"]["fx"] == l1n["beta"]["fx"],
      "flow: a dependent (alpha→beta) sits RIGHT of its sink; sinks share a column")
check(l1n[G._UNCLAIMED]["fx"] == 0.0 and l1n[G._UNCLAIMED]["fy"] == 0.0,
      "flow: the unclaimed bucket pins at the origin (excluded from the DAG)")
check(g["layout"]["l1"]["flow"]["col_w"] == 210.0 and g["stats"]["l1_flow_cols"] == 2,
      "flow layout metadata + column count advertised (alpha depth 1 ⇒ 2 cols)")

# ── FLOW CYCLE SAFETY: a FK cycle must not infinite-loop; both get finite fx ──
cyc = G.build_c4_graph({"head": "cyc", "entities": {
    "p": {"files": [], "models": [{"cls": "P", "table": "p", "fks": {"q": "q.id"}}],
          "schemas": [], "endpoints": []},
    "q": {"files": [], "models": [{"cls": "Q", "table": "q", "fks": {"p": "p.id"}}],
          "schemas": [], "endpoints": []}}}, labels={}, status={})
cn = {n["id"]: n for n in cyc["l1"]["nodes"]}
check(all(isinstance(cn[s]["fx"], (int, float)) for s in ("p", "q")),
      "flow is cycle-safe: a p↔q FK cycle yields finite fx (on-stack guard)")

# ── COLORS: the per-entity palette rides WITH the graph (renderer parity) ────
gc = G.build_c4_graph(FIX, labels=LABELS, status=STATUS, colors={"alpha": "#123456"})
check(gc["colors"]["alpha"] == "#123456", "a passed palette rides in graph['colors']")
check(g["colors"] == {}, "colors default to empty on an archmap-only build")

# ── DETERMINISM: same inputs ⇒ byte-identical; keyed on head not wallclock ──
g2 = G.build_c4_graph(FIX, labels=LABELS, status=STATUS)
check(json.dumps(g, sort_keys=True) == json.dumps(g2, sort_keys=True),
      "two builds are byte-identical (pure derivation)")
check(g["head"] == "cafef00d" and "generated" not in g,
      "graph keys on head, carries NO wallclock (unchanged tree ⇒ no churn)")

# ── NONE-VALUED FIELDS: models:null must not crash ─────────────────────────
try:
    nz = G.build_c4_graph({"head": "z", "entities": {
        "e": {"files": None, "models": None, "schemas": None, "endpoints": None}}},
        labels={}, status={})
    check(nz["stats"]["entities"] == 1, "null list fields build a bare node, no crash")
except Exception as _e:  # noqa: BLE001
    check(False, f"null list fields crashed: {_e}")

# ── SLUG COLLISION: a real entity named 'unclaimed' cannot clash the bucket ─
coll = G.build_c4_graph({"head": "c", "entities": {
    "unclaimed": {"files": [], "models": [{"cls": "U", "table": "u", "fks": {}}],
                  "schemas": [], "endpoints": []},
    "other": {"files": [], "models": [{"cls": "O", "table": "o",
              "fks": {"c": "ghost.id"}}], "schemas": [], "endpoints": []}}},
    labels={}, status={})
cids = {n["id"]: n["kind"] for n in coll["l1"]["nodes"]}
check(cids.get("unclaimed") == "entity" and cids.get(G._UNCLAIMED) == "unclaimed",
      "an entity slugged 'unclaimed' and the __unclaimed__ bucket coexist distinctly")

# ── SILENT: empty entities → empty graph, no crash, no unclaimed ───────────
empty = G.build_c4_graph({"head": "0", "entities": {}}, labels={}, status={})
check(empty["l1"]["nodes"] == [] and empty["l1"]["edges"] == [] and empty["l2"] == {}
      and empty["stats"]["unclaimed"] is False,
      "empty archmap yields an empty graph, no crash")

# ── REALISTIC derivation path (covers what build_center_a3's try/except wraps) ─
big = {"head": "big", "entities": {}}
for i in range(6):
    s = f"ent{i}"
    big["entities"][s] = {
        "files": [["api", f"apps/api/{s}.py", 100 + i]],
        "models": [{"cls": f"M{i}", "table": f"t{i}",
                    "fks": ({"ref": "t0.id"} if i else {})}],   # ent1..5 → ent0
        "schemas": [{"cls": f"S{i}"}],
        "endpoints": [{"method": "GET", "path": f"/{s}", "fn": f"g{i}",
                       "touches": [f"S{i}"]}],
    }
bg = G.build_c4_graph(big, labels={}, status={})
check(bg["stats"]["entities"] == 6 and bg["stats"]["l1_edges"] == 5
      and all((f"ent{i}", "ent0") in {(e["source"], e["target"]) for e in bg["l1"]["edges"]}
              for i in range(1, 6)),
      "a realistic multi-entity archmap derives the expected star into ent0")
bg_l1n = {n["id"]: n for n in bg["l1"]["nodes"]}
check(all(bg_l1n[f"ent{i}"]["fx"] > bg_l1n["ent0"]["fx"] for i in range(1, 6))
      and len({bg_l1n[f"ent{i}"]["fx"] for i in range(1, 6)}) == 1,
      "flow: the star's dependents (ent1..5) share one column RIGHT of the ent0 sink")

# ── emit writes both artifacts as utf-8 (non-ASCII label round-trips) ───────
d = pathlib.Path(tempfile.mkdtemp())
uni = G.build_c4_graph({"head": "u", "entities": {
    "e": {"files": [], "models": [], "schemas": [], "endpoints": []}}},
    labels={"e": "Café-Ñoño"}, status={}, colors={"e": "#abcdef"})
G.emit(uni, d)
check((d / "c4-graph.json").is_file() and (d / "c4-graph.js").is_file(),
      "emit writes c4-graph.json + c4-graph.js")
raw = (d / "c4-graph.json").read_bytes()
check("Café-Ñoño".encode("utf-8") in raw,
      "emit writes utf-8 bytes for a non-ASCII label (encoding pinned)")
js = (d / "c4-graph.js").read_text(encoding="utf-8")
check(js.startswith("window.GABE_C4 = ") and js.rstrip().endswith(";"),
      "c4-graph.js assigns window.GABE_C4 (file:// no-fetch recipe)")
check("window.GABE_C4_COLORS = " in js and "#abcdef" in js,
      "c4-graph.js also assigns window.GABE_C4_COLORS (the palette sibling)")

# ══ THE WEB→API BRIDGE ARM (_a3_web + build_c4_graph(web=)) ═════════════════
# The frontend arm: a fetching FILE becomes a web PIECE, its apiFetch(method,path)
# becomes a BRIDGE cross-edge to the endpoint it names, an unmatched fetch is NAMED.
sys.path.insert(0, gen)                     # so _a3_web can `from _a3_graft import`
import _a3_web as W

# ── web_arm extraction self-test: real source, a temp web tree (hermetic) ──
with tempfile.TemporaryDirectory() as _td:
    _wr = pathlib.Path(_td) / "apps" / "web" / "src" / "features"
    _wr.mkdir(parents=True)
    (_wr / "OrderList.tsx").write_text(
        'import { apiFetch } from "@lib/api/client";\n'
        'export function useOrders(){ return apiFetch<T>("/api/v1/orders", { signal }); }\n'
        'export function addLine(id){ return apiFetch<T>(`/api/v1/orders/${id}/lines`,'
        ' { method: "POST", body: { qty: 1 } }); }\n', encoding="utf-8")
    (_wr / "client.ts").write_text(               # the DEFINITION file → excluded
        'export async function apiFetch<T>(path, opts){ return fetch(path); }\n', encoding="utf-8")
    _ent = {"orders": {"files": [["web", "apps/web/src/features/OrderList.tsx", 3]]}}
    _wa = W.web_arm(pathlib.Path(_td), _ent)
    check(_wa["present"] is True and _wa["extractor"] == "apiFetch",
          "web_arm detects the apiFetch idiom over the tree")
    _ol = [s for s in _wa["screens"] if s["file"].endswith("OrderList.tsx")]
    check(len(_ol) == 1, "web_arm collapses a fetching file to ONE screen node")
    _calls = {(c["method"], c["path"]) for c in _ol[0]["calls"]} if _ol else set()
    check(("GET", "/api/v1/orders") in _calls, "web_arm extracts a literal apiFetch path")
    check(("POST", "/api/v1/orders/${id}/lines") in _calls,
          "web_arm reads method from the options object (a nested body:{…} survived)")
    check(_ol[0]["slug"] == "orders" if _ol else False,
          "web_arm homes a screen by its archmap file row")
    check(not any("client" in s["file"] for s in _wa["screens"]),
          "web_arm SKIPS the apiFetch definition file (its param calls are not sites)")
    _wempty = W.web_arm(pathlib.Path(_td) / "nowhere", _ent)
    check(_wempty["present"] is False and "no web source" in _wempty["reason"],
          "web_arm honest-empty (present=False + reason) when there is no web source")
    _wdet = W.web_arm(pathlib.Path(_td), _ent)
    check(json.dumps(_wa, sort_keys=True) == json.dumps(_wdet, sort_keys=True),
          "web_arm deterministic: same tree → identical output")

# ── multi-layout web-root detection: web/src (not apps/web/src) is found ──────
# gastify's frontend lives at web/src, not gustify's apps/web/src — the arm detects
# the root across common layouts instead of assuming one (else frontend = false-empty).
with tempfile.TemporaryDirectory() as _td2:
    _wr2 = pathlib.Path(_td2) / "web" / "src" / "features"
    _wr2.mkdir(parents=True)
    (_wr2 / "Cards.tsx").write_text(
        'import { apiFetch } from "@lib/api/client";\n'
        'export function useCards(){ return apiFetch<T>("/api/v1/cards", { signal }); }\n', encoding="utf-8")
    _wm = W.web_arm(pathlib.Path(_td2), {"cards": {"files": [["web", "web/src/features/Cards.tsx", 2]]}})
    check(_wm["present"] is True and bool(_wm["screens"]),
          "web_arm detects a NON-apps web root (web/src) — not gustify-layout-specific")
    check(any(c["path"] == "/api/v1/cards" for s in _wm["screens"] for c in s["calls"]),
          "web_arm extracts fetches from the detected web/src root")
    # apps/web/src still WINS the order when both exist (monorepo precedence)
    (pathlib.Path(_td2) / "apps" / "web" / "src" / "features").mkdir(parents=True)
    (pathlib.Path(_td2) / "apps" / "web" / "src" / "features" / "A.tsx").write_text("export const x=1;\n", encoding="utf-8")
    check(str(W._detect_web_root(pathlib.Path(_td2))).replace("\\", "/").endswith("apps/web/src"),
          "web-root order: apps/web/src wins when both apps/web/src and web/src exist")

# ── build_c4_graph(web=): a param endpoint proving the snake↔camel + prefix norm ─
FIX_WEB = {"head": "web1", "entities": {
  "orders": {"files": [["api", "apps/api/orders.py", 50]],
             "models": [{"cls": "Order", "table": "orders", "fks": {}}], "schemas": [],
             "endpoints": [
                 {"method": "GET", "path": "/orders", "fn": "list_orders", "touches": []},
                 {"method": "POST", "path": "/orders/{order_id}/lines",   # snake param
                  "fn": "add_line", "touches": []}]},
}}
WARM = {"present": True, "reason": "apiFetch · 3 files",
        "stats": {"extractor": "apiFetch", "fetch_sites": 3, "dynamic": 1},
        "screens": [
            {"id": "web:OrderList", "file": "apps/web/OrderList.tsx", "slug": "orders",
             "label": "OrderList", "sites": 1,
             "calls": [{"method": "GET", "path": "/api/v1/orders"}]},          # prefix strip
            {"id": "web:AddLine", "file": "apps/web/AddLine.tsx", "slug": None,  # endpoint-homed
             "label": "AddLine", "sites": 1,
             "calls": [{"method": "POST", "path": "/api/v1/orders/${orderId}/lines"}]},  # camel param
            {"id": "web:Ghost", "file": "apps/web/Ghost.tsx", "slug": "orders",
             "label": "Ghost", "sites": 1,
             "calls": [{"method": "DELETE", "path": "/api/v1/nope"}]}]}          # no endpoint
gw = G.build_c4_graph(FIX_WEB, web=WARM)
gw_o = {n["id"]: n for n in gw["l2"]["orders"]["nodes"]}
gw_br = [e for e in gw["cross_edges"] if e.get("kind") == "bridge"]
check(gw_o.get("web:OrderList", {}).get("kind") == "web",
      "a fetching file becomes a web PIECE in its entity's L2")
check(any(e["from"] == "web:OrderList" and e["to"] == "endpoint:GET /orders" for e in gw_br),
      "bridge: /api/v1/orders → endpoint GET /orders (the /api/vN prefix is stripped)")
check(any(e["from"] == "web:AddLine" and e["to"] == "endpoint:POST /orders/{order_id}/lines"
          for e in gw_br),
      "bridge: camel ${orderId} matches snake {order_id} (param normalized to a placeholder)")
check("web:AddLine" in gw_o,
      "an unhomed screen (slug=None) homes to the entity of the endpoint it fetched")
_wst = gw["stats"]["web"]
check(_wst["present"] is True and _wst["matched"] == 2,
      "stats.web.matched counts the bridged fetches")
check(any(u["m"] == "DELETE" and u["p"] == "/api/v1/nope" for u in _wst["unmatched"]),
      "an unmatched fetch is NAMED in stats.web.unmatched, never dropped")
check(not any(e["to"] == "endpoint:DELETE /nope" or "/nope" in e["to"] for e in gw_br),
      "an unmatched fetch produces NO bridge edge")
check(gw["cross_edges"] == sorted(gw["cross_edges"],
      key=lambda e: (e["from_slug"], e["from"], e["to_slug"], e["to"], e.get("via", ""))),
      "cross_edges (FK + bridge) stays deterministically sorted")

# ── MUTATION: remove the POST endpoint → AddLine's fetch flips matched→unmatched ─
FIX_NOEP = json.loads(json.dumps(FIX_WEB))
FIX_NOEP["entities"]["orders"]["endpoints"] = [
    e for e in FIX_NOEP["entities"]["orders"]["endpoints"] if e["method"] != "POST"]
gwm = G.build_c4_graph(FIX_NOEP, web=WARM)
gwm_br = [e for e in gwm["cross_edges"] if e.get("kind") == "bridge"]
check(not any(e["from"] == "web:AddLine" for e in gwm_br)
      and any(u["p"] == "/api/v1/orders/${orderId}/lines" for u in gwm["stats"]["web"]["unmatched"])
      and _wst["matched"] == 2,
      "MUTATION: dropping the endpoint flips its bridge to unmatched (baseline still matched)")

# ── HONEST-EMPTY: web absent → l1/l2/cross_edges/layout byte-identical ──────
gw_base = G.build_c4_graph(FIX_WEB)                       # no web kwarg
gw_none = G.build_c4_graph(FIX_WEB, web=None)
gw_abs  = G.build_c4_graph(FIX_WEB, web={"present": False, "reason": "no web source"})
for part in ("l1", "l2", "cross_edges", "layout"):
    check(json.dumps(gw_none[part], sort_keys=True) == json.dumps(gw_base[part], sort_keys=True)
          and json.dumps(gw_abs[part], sort_keys=True) == json.dumps(gw_base[part], sort_keys=True),
          f"web absent: {part} is byte-identical to the web-less build")
check(gw_abs["stats"]["web"] == {"present": False, "reason": "no web source"},
      "web absent: the absence is NAMED in stats.web, never silent")
check("web" not in {n["kind"] for n in gw_none["l2"]["orders"]["nodes"]},
      "web absent: no web piece is drawn")

# ── DETERMINISM: two web builds are byte-identical ─────────────────────────
check(json.dumps(gw, sort_keys=True) == json.dumps(G.build_c4_graph(FIX_WEB, web=WARM), sort_keys=True),
      "web build is byte-deterministic across rebuilds")

# ── NORMALIZATION unit: the join key collapses prefix + params on both sides ─
check(G._norm_path("/api/v1/orders/${orderId}/lines") == "/orders/{}/lines"
      and G._norm_path("/orders/{order_id}/lines") == "/orders/{}/lines",
      "_norm_path: /api/vN stripped and {x}/${x} collapsed → the two sides meet")


# ── batch 45: CONSUMES + NESTS — request-shape + composition wires (the floating-schema fix) ──
FIX_NEST = {"head": "h", "generated": "g", "entities": {
  "na": {"models": [], "endpoints": [],
          "schemas": [{"cls": "NaIn", "file": "a.py", "fields": [["inner", "NaPart", ""], ["other", "NbOut", ""], ["plain", "str", ""]]},
                       {"cls": "NaPart", "file": "a.py", "fields": [["x", "str", ""]]}]},
  "nb": {"models": [], "endpoints": [],
          "schemas": [{"cls": "NbOut", "file": "b.py", "fields": [["y", "int", ""]]}]},
}}
gn = G.build_c4_graph(FIX_NEST)
_ne = [e for e in gn["l2"]["na"]["edges"] if e.get("kind") == "nests"]
check(len(_ne) == 1 and _ne[0]["source"] == "schema:NaIn" and _ne[0]["target"] == "schema:NaPart",
      "schema composition does not wire a LOCAL nests edge (field type -> own schema)")
_nx = [e for e in gn["cross_edges"] if e.get("kind") == "nests"]
check(len(_nx) == 1 and _nx[0]["from"] == "schema:NaIn" and _nx[0]["to"] == "schema:NbOut",
      "a field typed with ANOTHER entity's schema does not become a cross nests edge")
check(gn["stats"].get("consumes") == 2, "stats.consumes must count nests+consumes wires (local + cross)")
check(not any("str" in str(e.get("to", "")) + str(e.get("target", "")) for e in _ne + _nx),
      "plain field types leak into composition wires")
# mutation-proof: no fields -> no wires
FIX_NEST2 = {"head": "h", "generated": "g", "entities": {"na": {"models": [], "endpoints": [],
  "schemas": [{"cls": "NaIn", "file": "a.py"}]}}}
gn2 = G.build_c4_graph(FIX_NEST2)
check(gn2["stats"].get("consumes") == 0 and not any(e.get("kind") in ("nests", "consumes")
      for s in gn2["l2"].values() for e in s.get("edges", [])),
      "field-less schemas must emit ZERO composition wires (the checker can stay silent)")

# ── GRAFT ROBUSTNESS (review findings 11·12·13) ──
_adjc = {}
for _i in range(GG._BEHIND_DEPTH_CAP): _adjc.setdefault(f"a{_i}", []).append(f"a{_i+1}")
_rc = GG._behind_of("a0", _adjc)
check(_rc["depth"] == GG._BEHIND_DEPTH_CAP and "truncated" not in _rc,
      "F11: a COMPLETE chain ending exactly at the depth cap is NOT flagged truncated")
_adjd = {}
for _i in range(GG._BEHIND_DEPTH_CAP + 10): _adjd.setdefault(f"b{_i}", []).append(f"b{_i+1}")
check(GG._behind_of("b0", _adjd).get("truncated") is True,
      "F11: a chain that truly exceeds the cap IS flagged truncated (guard can fire)")
_td = pathlib.Path(tempfile.mkdtemp())
_ix = _td / "wiring.json"; _ix.write_text("[]")
try:
    GG.load_wiring(_ix); check(False, "F12: non-object index should raise")
except ValueError:
    check(True, "F12: a non-object index raises ValueError (routed to the honest 'unreadable' reason, not a leaked AttributeError)")
except Exception as _e:
    check(False, f"F12: wrong exception {_e!r}")
_ig = _td / ".ignore"
_ig.write_text("# graft's cards are gitignored...\n# .ignore before .gitignore, so this re-admits the tree to search only.\n!graft/\ngraft/.cache/\ngraft/.graph/\n")
GG._defuse_ignore(_td)
check(not _ig.exists(), "F13: a graft-ONLY .ignore (incl. its non-'graft' second comment) is UNLINKED, not left as a growing orphan")
_ig.write_text("# my rule\nbuild/\n!graft/\ngraft/.cache/\n")
GG._defuse_ignore(_td)
check(_ig.exists() and "build/" in _ig.read_text() and "graft" not in _ig.read_text(),
      "F13: a user's real .ignore patterns survive; only graft's signature is stripped")

print(f"arch-graph battery: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY