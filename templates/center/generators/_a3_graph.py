#!/usr/bin/env python3
"""_a3_graph.py — derive the C4-style codebase graph from the in-memory archmap.

Pure derivation, ZERO new source read: it consumes the ``amap`` dict that
``build_center_a3`` already assembled (``entities.<slug>`` → files, models,
endpoints, schemas, defines) and emits a LIBRARY-NEUTRAL graph:

    {version, head, l1:{nodes,edges}, l2:{<slug>:{nodes,edges}}, layout, stats}

Why library-neutral: the render step is a lab of alternatives (zero-lib SVG,
force-directed, a vendored graph lib). The canonical form is therefore raw
``nodes`` + ``edges`` (``id`` / ``source`` / ``target`` / ``kind`` / ``weight``)
that ANY renderer can adapt with a thin shim. A deterministic build-time layout
pass ALSO stamps ``x``/``y`` (a ring for L1, columns-by-kind for L2) so the
no-runtime-layout path needs no graph library under strict-CSP / file://;
renderers that lay themselves out simply ignore the stamped coordinates.

What the edges MEAN (slice 1 — the archmap-only arm):
  * L1 CROSS-entity edges come from foreign keys: a model FK ``"table.col"`` →
    the entity whose model owns ``table``. FK is the ONLY cross-entity signal the
    archmap carries today. (Richer calls/imports coupling is the graft-wiring arm,
    a later slice; the per-pair ``kinds`` dict is already multi-kind-ready for it.)
  * ``touches`` is an INTRA-entity signal only: upstream (``_a3_code`` where the
    map is built) intersects each endpoint's references with that entity's OWN
    documented classes, so a touch can only ever name a class the same entity
    owns. It therefore contributes NO L1 edge and only endpoint→own-model/schema
    edges at L2. It is NOT dropped-cross-entity data — the cross-entity case
    cannot occur under the current archmap.

Honesty laws (the map must not lie):
  * The join it makes is an EXACT string join (FK ``table.col`` → owning entity),
    not a heuristic.
  * A FK to a table NO entity models is LOSSY on coverage; it is collected into an
    explicit ``unclaimed`` bucket node (id ``__unclaimed__``, namespaced so it can
    never collide with a real entity slug), never silently dropped.
  * Intra-entity edges (a FK inside one entity) are L2 detail; L1 carries only
    CROSS-entity edges.

Determinism: the output is a pure function of (amap.entities, labels, status) with
every list sorted and every coordinate rounded, keyed on ``amap.head`` (the git
sha, stable on an unchanged tree) — NOT ``amap.generated`` (a wallclock that would
churn the committed file every build). Same inputs ⇒ byte-identical output. (The
ring coordinates round math.cos/sin to 2 dp; that rounding absorbs any libm
last-bit variance, but strict cross-platform byte-identity is a property of the
build host's float repr, not a guarantee this module can make alone.)

Battery: tests/arch-graph/run.sh (fire + silent + determinism, mutation-proven).
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

_UNCLAIMED = "__unclaimed__"   # the coverage-loss bucket; namespaced vs real slugs

# --- layout constants (a deterministic build-time pass; renderers may ignore) ---
_L1_R = 300.0        # ring radius for the entity ring
_L1_UNCLAIMED = (0.0, 0.0)   # the unclaimed bucket sits at the ring's centre
_L2_COL_W = 240.0    # column stride for the columns-by-kind L2 layout
_L2_ROW_H = 64.0     # row stride within a column
_L2_KINDS = ("endpoint", "model", "schema", "external")  # column order, left→right


def _index_tables(entities: dict[str, Any]) -> dict[str, str]:
    """{table_name: owning_slug} — for resolving a FK ``table.col`` to an entity.

    Iterates ``sorted(entities)`` so a table name declared by two entities (a
    shared/legacy table, plausible mid-migration) resolves to the alphabetically
    FIRST slug — a stable, order-independent tie-break, not config-insertion order."""
    idx: dict[str, str] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for model in code.get("models") or []:
            tbl = model.get("table")
            if tbl and tbl not in idx:
                idx[tbl] = slug
    return idx


def _counts(code: dict[str, Any]) -> dict[str, int]:
    files = code.get("files") or []
    return {
        "endpoints": len(code.get("endpoints") or []),
        "models": len(code.get("models") or []),
        "schemas": len(code.get("schemas") or []),
        "files": len(files),
        "lines": sum(f[2] for f in files if len(f) > 2),
    }


def _l1(entities: dict[str, Any], labels: dict[str, str],
        status: dict[str, str] | None) -> tuple[list[dict], list[dict], list[str]]:
    """L1 = one node per domain entity + (when needed) an unclaimed bucket; edges
    are the CROSS-entity FK relations, aggregated per directed pair with a
    per-kind multiplicity (multi-kind-ready for the later graft arm)."""
    tbl2slug = _index_tables(entities)
    status = status or {}

    pairs: dict[tuple[str, str], dict[str, int]] = {}   # (src,dst) -> {kind: n}
    unresolved: set[str] = set()

    def bump(src: str, dst: str, kind: str) -> None:
        d = pairs.setdefault((src, dst), {})
        d[kind] = d.get(kind, 0) + 1

    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for model in code.get("models") or []:
            for _col, ref in (model.get("fks") or {}).items():
                target_table = ref.split(".", 1)[0]
                target = tbl2slug.get(target_table)
                if target is None:
                    unresolved.add(target_table)
                    target = _UNCLAIMED
                if target != slug:            # intra-entity FK is L2 detail
                    bump(slug, target, "fk")

    used_unclaimed = any(dst == _UNCLAIMED for _s, dst in pairs)

    nodes: list[dict] = []
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        nodes.append({
            "id": slug,
            "label": labels.get(slug, slug),
            "kind": "entity",
            "slug": slug,
            "status": status.get(slug),
            "counts": _counts(code),
        })
    if used_unclaimed:
        nodes.append({
            "id": _UNCLAIMED,
            "label": "unclaimed",
            "kind": "unclaimed",
            "slug": _UNCLAIMED,
            "status": None,
            "counts": None,
        })

    edges: list[dict] = []
    for (src, dst) in sorted(pairs):
        kinds = pairs[(src, dst)]
        edges.append({
            "source": src,
            "target": dst,
            "weight": sum(kinds.values()),
            "kinds": {k: kinds[k] for k in sorted(kinds)},
        })
    return nodes, edges, sorted(unresolved)


def _l2(slug: str, code: dict[str, Any], tbl2slug: dict[str, str],
        labels: dict[str, str]) -> dict[str, list[dict]]:
    """L2 = one entity's internal pieces (endpoints · models · schemas) and their
    wiring, plus honest ``external`` stub nodes for outbound FKs into other
    entities / unclaimed tables — so a drill never hides where the entity reaches.

    Touches are intra-entity by construction (upstream own-class filter), so an
    endpoint touch always resolves to one of THIS entity's own model/schema nodes;
    a touch that names no own class is dropped (it cannot name another entity's
    class under the current archmap)."""
    nodes: list[dict] = []
    node_ids: set[str] = set()
    edges: list[dict] = []
    own_classes: dict[str, str] = {}   # cls -> node id (this entity only)
    externals: dict[str, dict] = {}    # ext node id -> node

    def add_node(node: dict) -> None:
        if node["id"] not in node_ids:   # deterministic first-writer dedup
            node_ids.add(node["id"])
            nodes.append(node)

    def ext(owner: str) -> str:
        nid = f"external:{owner}"
        if nid not in externals:
            externals[nid] = {
                "id": nid, "kind": "external", "slug": owner,
                "label": "unclaimed" if owner == _UNCLAIMED
                else labels.get(owner, owner),
            }
        return nid

    for model in code.get("models") or []:
        nid = f"model:{model.get('cls')}"
        add_node({"id": nid, "kind": "model", "slug": slug,
                  "label": model.get("cls"), "table": model.get("table")})
        if model.get("cls"):
            own_classes.setdefault(model["cls"], nid)   # a model wins a name tie
    for schema in code.get("schemas") or []:
        nid = f"schema:{schema.get('cls')}"
        add_node({"id": nid, "kind": "schema", "slug": slug,
                  "label": schema.get("cls")})
        if schema.get("cls"):
            own_classes.setdefault(schema["cls"], nid)
    for ep in code.get("endpoints") or []:
        nid = f"endpoint:{ep.get('method')} {ep.get('path')}"
        add_node({"id": nid, "kind": "endpoint", "slug": slug,
                  "label": f"{ep.get('method')} {ep.get('path')}"})
        for cls in ep.get("touches") or []:
            tgt = own_classes.get(cls)
            if tgt and tgt != nid:
                edges.append({"source": nid, "target": tgt, "kind": "touches"})
            # a touch to no own class: not another entity's (upstream own-filter),
            # an external/library schema with no node → nothing to point at, drop.

    # model → model FK edges: intra-entity → the target model node; cross-entity
    # or unclaimed → the owner's external stub.
    tbl2own = {}
    for m in code.get("models") or []:
        if m.get("table"):
            tbl2own.setdefault(m["table"], f"model:{m.get('cls')}")
    for model in code.get("models") or []:
        src = f"model:{model.get('cls')}"
        for _col, ref in (model.get("fks") or {}).items():
            target_table = ref.split(".", 1)[0]
            if target_table in tbl2own:
                tgt = tbl2own[target_table]
                if tgt != src:                           # self-FK is not an edge
                    edges.append({"source": src, "target": tgt, "kind": "fk"})
            else:
                owner = tbl2slug.get(target_table, _UNCLAIMED)
                edges.append({"source": src, "target": ext(owner), "kind": "fk"})

    for k in sorted(externals):
        add_node(externals[k])
    # de-dup edges (an entity can reach another via several endpoints/FKs) + sort
    seen: set[tuple] = set()
    uniq: list[dict] = []
    for e in edges:
        key = (e["source"], e["target"], e["kind"])
        if key not in seen:
            seen.add(key)
            uniq.append(e)
    uniq.sort(key=lambda e: (e["source"], e["target"], e["kind"]))
    nodes.sort(key=lambda n: (_L2_KINDS.index(n["kind"]), n["id"]))
    return {"nodes": nodes, "edges": uniq}


def _stamp_l1(nodes: list[dict]) -> None:
    """Ring layout: entities evenly on a circle (top-first, clockwise); the
    unclaimed bucket at centre. Deterministic + rounded to 2 dp (absorbs libm
    last-bit variance) ⇒ stable within a build host."""
    ents = [n for n in nodes if n["kind"] == "entity"]
    n = len(ents)
    for i, node in enumerate(ents):
        ang = -math.pi / 2 + (2 * math.pi * i / n if n else 0)
        node["x"] = round(_L1_R * math.cos(ang), 2)
        node["y"] = round(_L1_R * math.sin(ang), 2)
    for node in nodes:
        if node["kind"] == "unclaimed":
            node["x"], node["y"] = _L1_UNCLAIMED


def _stamp_l2(l2: dict[str, list[dict]]) -> None:
    """Columns-by-kind: endpoints | models | schemas | external, each column
    sorted, row y by index. Deterministic + rounded ⇒ stable."""
    cols: dict[str, int] = {k: 0 for k in _L2_KINDS}
    for node in l2["nodes"]:
        kind = node["kind"]
        col = _L2_KINDS.index(kind)
        node["x"] = round(col * _L2_COL_W, 2)
        node["y"] = round(cols[kind] * _L2_ROW_H, 2)
        cols[kind] += 1


def build_c4_graph(amap: dict[str, Any], labels: dict[str, str] | None = None,
                   status: dict[str, str] | None = None) -> dict[str, Any]:
    """The whole derivation: L1 entity graph + one L2 graph per entity, laid out.

    Pure over ``amap["entities"]`` (+ labels/status), keyed on ``amap["head"]``.
    ``labels``/``status`` default to empty — the graph still builds from archmap
    alone, entities just render under their slug and without a registry status."""
    labels = labels or {}
    entities = amap.get("entities") or {}

    l1_nodes, l1_edges, unresolved = _l1(entities, labels, status)
    _stamp_l1(l1_nodes)

    tbl2slug = _index_tables(entities)
    l2: dict[str, dict] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        graph = _l2(slug, code, tbl2slug, labels)
        _stamp_l2(graph)
        l2[slug] = graph

    return {
        "version": 1,
        "head": amap.get("head"),
        "l1": {"nodes": l1_nodes, "edges": l1_edges},
        "l2": l2,
        "layout": {"l1": {"kind": "ring", "cx": 0.0, "cy": 0.0, "r": _L1_R},
                   "l2": {"kind": "columns", "col_w": _L2_COL_W, "row_h": _L2_ROW_H,
                          "order": list(_L2_KINDS)}},
        "stats": {
            "entities": sum(1 for n in l1_nodes if n["kind"] == "entity"),
            "l1_edges": len(l1_edges),
            "unclaimed": any(n["kind"] == "unclaimed" for n in l1_nodes),
            "unresolved_tables": unresolved,
        },
    }


def emit(graph: dict[str, Any], center_out: Path) -> None:
    """Write the committed, human-diffable JSON + a ``window.GABE_C4`` sibling
    (the inflight.js file:// recipe — a strict-CSP page loads data via a script
    global, never fetch). A PR diff of c4-graph.json IS the graph change.

    Encoding is pinned to utf-8 (matching every sibling generator) so a non-ASCII
    label serializes to the same bytes on any build host, never the locale default."""
    center_out = Path(center_out)
    (center_out / "c4-graph.json").write_text(
        json.dumps(graph, indent=1, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8")
    (center_out / "c4-graph.js").write_text(
        "window.GABE_C4 = " + json.dumps(graph, ensure_ascii=False, sort_keys=True)
        + ";\n", encoding="utf-8")
