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
import sys, json, importlib.util, tempfile, pathlib
gen = sys.argv[1]
spec = importlib.util.spec_from_file_location("_a3_graph", gen + "/_a3_graph.py")
G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

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
      {"cls": "A", "table": "a", "fks": {"self_col": "a.id",     # intra → no L1 edge
                                          "b_col":  "b.id",       # cross → alpha→beta
                                          "b_col2": "b.x",        # cross → weight 2
                                          "x_col":  "legacy_x.id"}},  # unmodelled → unclaimed
      {"cls": "Dup", "table": "dup", "fks": {}},
    ],
    "schemas": [{"cls": "AlphaOut"}, {"cls": "Dup"}],   # class-name tie with model Dup
    "endpoints": [{"method": "GET", "path": "/alpha", "fn": "get_alpha",
                   "touches": ["AlphaOut", "Dup"]}],    # own only (real shape)
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

# ── CROSS-ENTITY PIECE EDGES: model→model FKs that cross entities (piece res) ─
# alpha.A has 4 FKs: self a.id (intra) · b.id + b.x (both → beta model:B) · legacy_x
# (unclaimed). Only the two beta FKs are cross-entity piece edges; intra + unclaimed
# are excluded. Both target table b → model:B (the deduped owner). via keeps the col.
xe = g["cross_edges"]
check(g["stats"]["cross_edges"] == len(xe) == 2,
      "cross_edges has exactly the 2 cross-entity FKs (intra + unclaimed excluded)")
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

print(f"arch-graph battery: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY