#!/usr/bin/env python3
"""_a3_levels.py — derive the rich LEVELS graph (window.GABE_LEVELS) the codebase
stations render, from the in-memory archmap + the already-built C4 graph.

The lab-native station renderer (level-lab grammar) reads ``window.GABE_LEVELS``:
entities · colours · L1 kind-edges · piece-level cross edges · per-entity pieces
(models · schemas · endpoints · intra FKs · USE-CASES · COMMUNITIES · use-fns) ·
FUNCTION nodes · USE edges · schema owners · per-element dossier detail.

Provenance (the flip, 2026-08-13): the station used to re-implement the lab grammar
over the slim ``GABE_C4`` topology, so the function / use-case / community lenses
were empty. This module feeds the ITERATED lab renderer directly instead — and the
rich lenses are NOT new data: they come from insight blocks the suite's own
``_a3_code`` already writes into the archmap on every build:

  * ``function_insight`` (per fn: entity · file · layer · god · handler · lines) → ``fn_nodes``
  * ``model_insight.internal_refs`` (which fns reference a model class)          → ``use_edges`` · ``usefns``
  * ``model_insight`` (fan-in ``usage`` · ``god``)                              → per-model ``hub``
  * ``guard_insight`` (declared validators per file)                            → per-endpoint ``guards``
  * ``test_insight`` (carried on each C4 node's ``det.cases``)                  → per-piece ``tests``
  * endpoint URL first segment                                                 → ``usecases``
  * intra FK ∪ shared-touch components                                          → ``communities``

Only the cross-file function CALL edges (``fn_edges``, the Layers cross-lane wires)
need the graft index; they are honest-empty when the arm is absent. Everything else
is pure archmap + C4 derivation — the same data, one host without a graft binary.

Determinism: a pure function of (amap, graph, graft index fp) with every list sorted;
same inputs ⇒ byte-identical output. Honest-empty: a missing insight block yields the
empty field, never a fabricated value; the lab degrades on its own ``||[]`` fallbacks.

Battery: tests/levels/run.sh (derive + honest-empty + determinism, mutation-proven).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _strip(nid: str) -> str:
    """model:Recipe → Recipe (drop the kind prefix a C4 node id carries)."""
    return nid.split(":", 1)[1] if ":" in nid else nid


def _method_of(label: str) -> str:
    tok = str(label).split(" ", 1)[0]
    return tok if tok.isupper() and tok.isalpha() else "GET"


def _path_of(label: str) -> str:
    parts = str(label).split(" ", 1)
    return parts[1] if len(parts) > 1 else label


def _tests_of(det: dict | None) -> dict[str, int]:
    """{api, web, n, red} from a C4 node's det.cases (+ route-file coverage rows)."""
    out = {"api": 0, "web": 0, "n": 0, "red": 0}
    if not det:
        return out
    for c in det.get("cases", []) or []:
        out["n"] += 1
        if c.get("corpus") == "web":
            out["web"] += 1
        else:
            out["api"] += 1
        st = c.get("state")
        if st and st not in ("pass", "skip"):
            out["red"] += 1
    for f in det.get("case_files", []) or []:
        n = 0
        for tok in str(f.get("name", "")).split():
            if tok.isdigit():
                n = int(tok)
                break
        out["n"] += n
        if f.get("corpus") == "web":
            out["web"] += n
        else:
            out["api"] += n
    return out


def _use_case_seg(path: str) -> str:
    """the first non-parameter URL segment — the use-case key (root when none)."""
    for seg in str(path).split("/"):
        if seg and seg[0] not in ("{", ":"):
            return seg
    return "root"


def build_levels(amap: dict[str, Any], graph: dict[str, Any],
                 graft: dict[str, Any] | None = None) -> dict[str, Any]:
    """Pure derivation of the LEVELS graph from the archmap + the C4 graph."""
    ents = amap.get("entities", {}) or {}
    FI = amap.get("function_insight", {}) or {}
    MI = amap.get("model_insight", {}) or {}
    GI = (amap.get("guard_insight", {}) or {}).get("files", {}) or {}

    l1_nodes = [n for n in graph.get("l1", {}).get("nodes", []) if n.get("kind") == "entity"]
    l2 = graph.get("l2", {}) or {}
    colors = graph.get("colors", {}) or {}

    # class → owning entity (models + schemas), and file → entity (for fn homing)
    cls_ent: dict[str, str] = {}
    file_ent: dict[str, str] = {}
    for slug, code in ents.items():
        for m in code.get("models", []) or []:
            cls_ent[m["cls"]] = slug
        for s in code.get("schemas", []) or []:
            cls_ent.setdefault(s["cls"], slug)
    for fid, f in FI.items():
        if f.get("file") and f.get("entity"):
            file_ent[f["file"]] = f["entity"]

    lv: dict[str, Any] = {
        "note": "live from the archmap — functions · use-cases · communities · use-edges "
                "derived from function_insight + model_insight (cross-file call edges ride the graft arm)",
        "census_note": "workflow census not curated for this project yet",
        "colors": colors,
        "entities": [{"slug": n["slug"], "label": n.get("label", n["slug"]),
                      "counts": n.get("counts", {})} for n in l1_nodes],
        "l1_edges": [{"s": e["source"], "t": e["target"], "kinds": e.get("kinds", {"fk": 1})}
                     for e in graph.get("l1", {}).get("edges", [])
                     if e.get("source") and e.get("target")
                     and e["source"] != "__unclaimed__" and e["target"] != "__unclaimed__"],
        "cross_edges": [{"fs": e["from_slug"], "f": _strip(e["from"]),
                         "ts": e["to_slug"], "t": _strip(e["to"]), "via": e.get("via", "")}
                        for e in graph.get("cross_edges", [])],
        "schema_owner": {},
        "detail": {},
        "fn_nodes": [],
        "fn_edges": [],
        "use_edges": [],
        "pressure": {},
        "census": {},
        "pieces": {},
    }

    # ── fn_nodes — every function, from function_insight ──────────────────────
    for fid in sorted(FI):
        f = FI[fid]
        slug = f.get("entity")
        if not slug:
            continue
        lv["fn_nodes"].append({
            "id": fid.replace("::", "#"), "name": f.get("fn", ""), "slug": slug,
            "kind": "function", "lang": "py" if str(f.get("file", "")).endswith(".py") else "ts",
            "layer": f.get("layer", "services"), "handler": bool(f.get("handler")),
            "god": bool(f.get("god")),
            "hub": {"god": bool(f.get("god")), "usage": f.get("internal", 0)},
            "tests": {"api": f.get("api", 0), "web": f.get("web", 0),
                      "n": (f.get("api", 0) + f.get("web", 0)), "red": 0},
        })

    # ── use_edges + usefns — a fn references a model owned elsewhere ───────────
    usefns_by: dict[str, dict[str, int]] = {}
    for cls in sorted(MI):
        owner = cls_ent.get(cls)
        if not owner:
            continue
        for ref in MI[cls].get("internal_refs", []) or []:
            using = file_ent.get(ref.get("file", "")) or owner
            for fn in ref.get("defs", []) or []:
                usefns_by.setdefault(using, {})
                usefns_by[using][fn] = usefns_by[using].get(fn, 0) + 1
                if using != owner:
                    lv["use_edges"].append({"fs": using, "cls": cls, "ts": owner, "fn": fn})
    lv["use_edges"].sort(key=lambda e: (e["fs"], e["ts"], e["cls"], e["fn"]))

    # ── per-entity pieces (from the C4 L2) + the rich lenses ──────────────────
    for slug in sorted(l2):
        g = l2[slug]
        nodes = g.get("nodes", [])
        edges = g.get("edges", [])
        model_id: dict[str, str] = {}
        models, schemas, endpoints = [], [], []
        for nd in nodes:
            det = nd.get("det")
            k = nd.get("kind")
            if k == "model":
                model_id[nd["id"]] = nd["label"]
                lv["schema_owner"].setdefault(nd["label"], slug)
                mi = MI.get(nd["label"], {})
                nfk = sum(1 for e in edges if e.get("kind") == "fk" and e.get("source") == nd["id"])
                models.append({"cls": nd["label"], "table": nd.get("table", ""), "nfk": nfk,
                               "hub": {"god": bool(mi.get("god")), "usage": mi.get("usage", 0)},
                               "tests": _tests_of(det)})
                if det:
                    lv["detail"]["cls:" + slug + "|" + nd["label"]] = {"cases": det.get("cases", []), "det": det}
            elif k == "schema":
                lv["schema_owner"][nd["label"]] = slug
                schemas.append({"cls": nd["label"], "tests": _tests_of(det)})
                if det:
                    lv["detail"]["cls:" + slug + "|" + nd["label"]] = {"cases": det.get("cases", []), "det": det}
            elif k == "endpoint":
                touch = sorted({_strip(e["target"]) for e in edges
                                if e.get("kind") == "touches" and e.get("source") == nd["id"]})
                efile = (det or {}).get("file", "")
                guards = int((GI.get(efile, {}) or {}).get("declared", 0)) if efile else 0
                endpoints.append({"m": _method_of(nd["label"]), "p": _path_of(nd["label"]),
                                  "fn": nd.get("fn", ""), "resp": (nd.get("resp") or "") if nd.get("resp") != "—" else "",
                                  "guards": guards, "touch": touch})
        # intra: model→model FK inside the entity (via unknown at L2 → "")
        intra = sorted(({"s": model_id[e["source"]], "t": model_id[e["target"]], "via": ""}
                        for e in edges if e.get("kind") == "fk"
                        and e.get("source") in model_id and e.get("target") in model_id),
                       key=lambda x: (x["s"], x["t"]))
        # usecases: endpoints grouped by first non-param URL segment
        usecases: dict[str, dict[str, list]] = {}
        for ep in endpoints:
            seg = _use_case_seg(ep["p"])
            uc = usecases.setdefault(seg, {"cls": [], "eps": [], "fns": []})
            uc["eps"].append(ep["m"] + " " + ep["p"])
            if ep["fn"]:
                uc["fns"].append(ep["fn"])
            for c in ep["touch"]:
                if c not in uc["cls"]:
                    uc["cls"].append(c)
        # communities: components over intra-FK ∪ shared-endpoint-touch, hub-named
        parent = {m["cls"]: m["cls"] for m in models}

        def find(x: str) -> str:
            while parent.get(x, x) != x:
                parent[x] = parent.get(parent[x], parent[x])
                x = parent[x]
            return x

        def union(a: str, b: str) -> None:
            if a in parent and b in parent:
                parent[find(a)] = find(b)

        for e in intra:
            union(e["s"], e["t"])
        for ep in endpoints:                       # models co-touched by one endpoint group together
            ms = [c for c in ep["touch"] if c in parent]
            for c in ms[1:]:
                union(ms[0], c)
        comp: dict[str, list[str]] = {}
        for m in models:
            comp.setdefault(find(m["cls"]), []).append(m["cls"])
        communities: dict[str, list[str]] = {}
        ci = 0
        for root in sorted(comp, key=lambda r: (-len(comp[r]), r)):
            ci += 1
            members = sorted(comp[root])
            hub = max(members, key=lambda c: (MI.get(c, {}).get("usage", 0), c))
            communities["c%d·%s" % (ci, hub)] = members
        usefns = sorted(({"fn": fn, "uses": n} for fn, n in (usefns_by.get(slug, {})).items()),
                        key=lambda x: (-x["uses"], x["fn"]))[:40]
        lv["pieces"][slug] = {"models": models, "schemas": schemas, "endpoints": endpoints,
                              "intra": intra, "usecases": usecases, "communities": communities,
                              "usefns": usefns}

    # ── fn_edges — cross-file function CALLS (graft only; honest-empty else) ───
    if graft and graft.get("present") and graft.get("fn_edges"):
        lv["fn_edges"] = sorted(graft["fn_edges"],
                                key=lambda e: (e.get("ss", ""), e.get("ds", ""), e.get("s", ""), e.get("t", "")))

    return lv


def emit(levels: dict[str, Any], center_out: Path) -> None:
    """Write levels.json (diffable) + levels.js (window.GABE_LEVELS)."""
    center_out.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(levels, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    (center_out / "levels.json").write_text(payload + "\n", encoding="utf-8")
    (center_out / "levels.js").write_text("window.GABE_LEVELS = " + payload + ";\n", encoding="utf-8")
