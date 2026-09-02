#!/usr/bin/env python3
"""tools — the seven gabe-map v1 tool bodies over mapquery (READ-ONLY except who_calls' gated emit).

Every body returns a dict; the server renders it as ONE text block (D5/§5: the harness hides text
when structuredContent is present, so there is no second channel). Every list is capped and the
cap is named; every answer carries the map stamp; every missing block yields a `reason`, never a
crash. Contracts: skills/gabe-map/references/map-spec.md.
"""
from __future__ import annotations
import hashlib
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapquery as mq  # noqa: E402

HTTP = re.compile(r"^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(/\S*)$", re.I)
CID = re.compile(r"^C\d{1,6}$")
NO_MAP_HINT = "this project has no codebase map; Grep/Glob are the source of truth here. Build one: /gabe-cc-init."


def norm_path(p: str) -> str:
    p = re.sub(r"^/api/v\d+", "", p or "")
    p = re.sub(r"\$?\{[^}]*\}", "{}", p)
    return (p.rstrip("/") or "/")


def _ctx(args: dict, roots: list[str] | None):
    root, source = mq.resolve_root(args.get("root"), roots)
    center, reason = mq.open_center(root)
    return center, root, source, reason


def _absent(root: str, source: str, reason: str) -> dict:
    out = {"present": False, "root": root, "root_source": source, "reason": reason}
    if "ruling R8" not in reason:
        out["hint"] = NO_MAP_HINT
    return out


def _base(center: mq.Center, root: str, source: str) -> dict:
    return {"present": True, "root": root, "root_source": source, "center": str(center.dir), **mq.stamp(center)}


# ── map_status ─────────────────────────────────────────────────────────────────
def t_map_status(args: dict, roots) -> dict:
    center, root, source, reason = _ctx(args, roots)
    if not center:
        out = _absent(root, source, reason)
        out.update({"kdbp_present": os.path.isdir(os.path.join(root, ".kdbp")), "server_sha": mq.server_sha()})
        return out
    a, c = center.archmap, center.c4
    ents = center.entities()
    fi = a.get("function_insight") or {}
    out = _base(center, root, source)
    out["entities"] = sorted(ents)
    out["counts"] = {
        "entities": len(ents),
        "endpoints": sum(len(e.get("endpoints") or []) for e in ents.values()),
        "models": sum(len(e.get("models") or []) for e in ents.values()),
        "schemas": sum(len(e.get("schemas") or []) for e in ents.values()),
        "files_mapped": len(center.idx()["mapped_files"]),
        "functions_py": len(fi),
        "fe_pieces": len((c.get("fe") or {}).get("pieces") or []),
    }
    census = a.get("file_census") or {}
    out["file_census"] = {"claimed": census.get("claimed"), "unclaimed": len(census.get("unclaimed") or [])} if census else {"reason": "no file_census block"}
    wiring = Path(root) / "graft" / ".graph" / "wiring.json"
    g = {"index_present": wiring.is_file()}
    if wiring.is_file():
        try:
            g["wiring_mtime"] = int(wiring.stat().st_mtime)
            g["live_index_hash"] = hashlib.sha256(wiring.read_bytes()).hexdigest()[:12]
        except OSError as exc:
            g["reason"] = str(exc)
    g["committed_index_hash"] = ((c.get("stats") or {}).get("graft") or {}).get("index_hash")
    if g.get("live_index_hash") and g.get("committed_index_hash"):
        g["match"] = g["live_index_hash"] == g["committed_index_hash"]
        if not g["match"]:
            g["note"] = "graft index refreshed since the map's regen — the map's calls/imports edges may lag the index; not source staleness"
    out["graft"] = g
    out["kdbp_present"] = os.path.isdir(os.path.join(root, ".kdbp"))
    infl = mq._load_json(center.dir / "inflight.json")
    if infl:
        out["inflight"] = {"head": infl.get("head"), "active": infl.get("active"), "current_phase": infl.get("current_phase")}
        if infl.get("head"):
            rc, cnt, _ = mq.sh(["git", "-C", root, "rev-list", "--count", "%s..HEAD" % infl["head"]])
            out["inflight"]["commits_behind"] = int(cnt.strip()) if rc == 0 and cnt.strip().isdigit() else None
    else:
        out["inflight"] = {"reason": "no inflight.json (E8 beat tail never ran here, or gitignored and absent)"}
    out["regen_cmd"] = "scripts/refresh_center.sh regen"
    out["server_sha"] = mq.server_sha()
    return out


# ── entity_context ─────────────────────────────────────────────────────────────
def _entity_list(center: mq.Center) -> list[dict]:
    mapped = set(center.entities())
    rows, seen = [], set()
    for s in (center.adoption.get("sections") or []):
        slug = s.get("entity")
        if not slug:
            continue
        seen.add(slug)
        rows.append({"slug": slug, "display_name": s.get("display_name") or s.get("label") or slug,
                     "rank": s.get("rank"), "status": s.get("status"), "mapped": slug in mapped})
    for slug in sorted(mapped - seen):
        rows.append({"slug": slug, "display_name": slug, "rank": None, "status": None, "mapped": True, "note": "in archmap, not in adoption.json"})
    return rows


def _project_pack(pack: dict, detail: str) -> dict:
    """brief = counts + names · full = capped projection · raw = untouched (parity with entity-context.py --json)."""
    if detail == "raw":
        return pack
    code = pack.get("code") or {}
    out = {k: v for k, v in pack.items() if k not in ("code",)}
    if not code:
        out["code"] = None
        return out
    files_by_layer: dict[str, list] = {}
    for row in code.get("files") or []:
        if len(row) >= 2:
            files_by_layer.setdefault(row[0], []).append(row[1])
    if detail == "brief":
        reg = out.get("registry") or {}
        if reg:
            out["registry"] = {k: reg.get(k) for k in ("rank", "status", "checklist_done", "checklist_total", "approved_walk")}
        b = out.get("bindings") or {}
        if b:
            out["bindings"] = {"test_rx": b.get("test_rx"), "proofs": len(b.get("proofs") or []),
                               "models_allowlist": len(b.get("models_allowlist") or []),
                               "code_globs": {k: len(v) for k, v in (b.get("code_globs") or {}).items()} if isinstance(b.get("code_globs"), dict) else b.get("code_globs")}
        rel = out.get("relations") or {}
        if rel:
            out["relations"] = {"related_entities": rel.get("related_entities"), "unresolved_tables": rel.get("unresolved_tables"),
                                "fk_out": len(rel.get("fk_out") or [])}
        eps, note_e = mq.cap_list(["%s %s" % (e.get("method"), e.get("path")) for e in code.get("endpoints") or []])
        out["code"] = {"counts": code.get("counts"),
                       "endpoints": eps, "endpoints_note": note_e,
                       "models": [m.get("cls") for m in code.get("models") or []][:mq.CAP],
                       "schemas": [s.get("cls") for s in code.get("schemas") or []][:mq.CAP],
                       "files_by_layer": {k: len(v) for k, v in files_by_layer.items()}}
        return out
    # full
    eps = [{"method": e.get("method"), "path": e.get("path"), "fn": e.get("fn"), "file": e.get("file"),
            "status": e.get("status"), "resp": e.get("resp")} for e in code.get("endpoints") or []]
    models = [{"cls": m.get("cls"), "table": m.get("table"), "file": m.get("file"), "cols": len(m.get("cols") or []),
               "cols_head": [c[0] for c in (m.get("cols") or [])[:10]], "fks": m.get("fks"), "doc": (m.get("doc") or "")[:160]}
              for m in code.get("models") or []]
    schemas = [{"cls": s.get("cls"), "file": s.get("file"), "fields": len(s.get("fields") or []), "doc": (s.get("doc") or "")[:160]}
               for s in code.get("schemas") or []]
    fbl = {}
    for k, v in files_by_layer.items():
        lst, note = mq.cap_list(v)
        fbl[k] = {"files": lst, "note": note}
    defines = {}
    for path, names in (code.get("defines") or {}).items():
        lst, note = mq.cap_list([n.rstrip("()") for n in names])
        defines[path] = lst + ([note] if note else [])
    e_l, e_n = mq.cap_list(eps); m_l, m_n = mq.cap_list(models); s_l, s_n = mq.cap_list(schemas)
    out["code"] = {"counts": code.get("counts"), "endpoints": e_l, "endpoints_note": e_n, "models": m_l, "models_note": m_n,
                   "schemas": s_l, "schemas_note": s_n, "files_by_layer": fbl, "defines": dict(list(defines.items())[:mq.CAP])}
    return out


def t_entity_context(args: dict, roots) -> dict:
    center, root, source, reason = _ctx(args, roots)
    if not center:
        return _absent(root, source, reason)
    slug = (args.get("slug") or "").strip()
    detail = (args.get("detail") or "brief").lower()
    if detail not in ("brief", "full", "raw"):
        raise mq.MapStop("detail must be brief | full | raw")
    out = _base(center, root, source)
    if not slug or slug == "list":
        out["entities"] = _entity_list(center)
        return out
    mod = mq.entity_context_module()
    pack = mod.build_pack(slug, center.dir, center.config, center.archmap, center.adoption)
    out["entity"] = _project_pack(pack, detail)
    out["detail"] = detail
    if detail != "raw":
        c = center.c4
        l1 = [e for e in ((c.get("l1") or {}).get("edges") or []) if e.get("source") == slug or e.get("target") == slug]
        out["c4"] = {"l1_edges": [{"source": e.get("source"), "target": e.get("target"), "weight": e.get("weight"), "kinds": e.get("kinds")} for e in l1][:mq.CAP],
                     "l1_note": "calls/imports are graft FLOORS (inferred cross-file); fk is exact",
                     "l2_node_kinds": {}}
        for n in ((c.get("l2") or {}).get(slug) or {}).get("nodes") or []:
            k = n.get("kind") or "?"
            out["c4"]["l2_node_kinds"][k] = out["c4"]["l2_node_kinds"].get(k, 0) + 1
        homes = (c.get("fe") or {}).get("homes") or []
        fe_home = next((h for h in homes if isinstance(h, dict) and h.get("id") == "fe·%s" % slug), None)
        out["c4"]["fe_home"] = fe_home if fe_home else {"reason": "no fe·%s home in GABE_C4.fe" % slug}
        cov = (center.archmap.get("coverage") or {}).get(slug)
        out["coverage"] = cov if cov else {"reason": "no coverage row for %s" % slug}
    return out


# ── touches ────────────────────────────────────────────────────────────────────
def _cases_split(rows) -> tuple[list, list]:
    cases, files = [], []
    for grp in (rows or {}).values() if isinstance(rows, dict) else []:
        for r in grp or []:
            if r.get("state") == "file" or not r.get("cid"):
                files.append({"tfile": r.get("tfile"), "corpus": r.get("corpus"), "n": r.get("n")})
            else:
                cases.append({"cid": r.get("cid"), "name": r.get("name"), "state": r.get("state"), "corpus": r.get("corpus"), "tfile": r.get("tfile")})
    return cases, files


def detect_kind(target: str, center: mq.Center) -> tuple[str, object]:
    t = target.strip()
    idx = center.idx()
    m = HTTP.match(t)
    if m:
        return "endpoint", (m.group(1).upper(), m.group(2))
    if "::" in t or "#" in t:
        return "function", t.replace("#", "::", 1)
    if "/" in t or t.endswith(mq.SRC_EXT):
        return "file", t
    if CID.match(t):
        return "case", t
    if t in center.entities():
        return "entity", t
    if t in idx["cls"]:
        return idx["cls"][t][1] or "model", t
    if t in idx["defines"] and t not in idx["fn_by_bare"]:
        return "define", t
    return "function_bare", t


def _fn_record(center: mq.Center, key: str) -> dict:
    a, idx = center.archmap, center.idx()
    rec = (a.get("function_insight") or {}).get(key)
    if not rec:
        return {"key": key, "reason": "not in function_insight"}
    ti = a.get("test_insight") or {}
    bare = key.split("::", 1)[1].split(".")[-1]
    reaching, unverifiable = [], 0
    for (slug, nid), n in idx["c4_nodes"].items():
        if n.get("kind") != "endpoint":
            continue
        b = n.get("behind") or {}
        if bare in (b.get("names") or []):
            reaching.append(nid)
        elif b.get("names_more") or b.get("truncated"):
            unverifiable += 1
    cases, files = _cases_split((ti.get("by_function") or {}).get(key))
    return {"key": key, "entity": rec.get("entity"), "layer": rec.get("layer"), "handler": rec.get("handler"),
            "handler_of": idx["handler_of"].get(key), "async": rec.get("async"), "lines": rec.get("lines"),
            "returns": rec.get("returns"), "doc": (rec.get("doc") or "")[:160], "usage": rec.get("usage"),
            "access_ops": (rec.get("access") or {}).get("ops"),
            "tests": {"cases": cases[:mq.CAP], "test_files": files[:mq.CAP]},
            "endpoints_reaching": {"found": reaching[:mq.CAP], "unverifiable": unverifiable,
                                   "floor": "behind.names is capped at 12 per endpoint and joins on the bare name — a FLOOR, never an absence proof"}}


def t_touches(args: dict, roots) -> dict:
    center, root, source, reason = _ctx(args, roots)
    if not center:
        return _absent(root, source, reason)
    target = (args.get("target") or "").strip()
    if not target:
        raise mq.MapStop("target is required: a file path, model/schema/class name, function (bare or file::fn), entity slug, endpoint 'METHOD /path', or case id")
    a, idx = center.archmap, center.idx()
    ti = a.get("test_insight") or {}
    kind, key = detect_kind(target, center)
    out = _base(center, root, source)
    out.update({"target": target, "kind": kind})
    if kind == "endpoint":
        method, path = key
        want = norm_path(path)
        found = None
        for slug, ent in center.entities().items():
            for ep in ent.get("endpoints") or []:
                if str(ep.get("method", "")).upper() == method and norm_path(ep.get("path", "")) == want:
                    found = (slug, ep)
                    break
            if found:
                break
        if not found:
            out.update({"matched": False, "normalized": "%s %s" % (method, want),
                        "reason": "no declared endpoint matches (normalization strips /api/vN and collapses {x})"})
            return out
        slug, ep = found
        fkey = "%s::%s" % (ep.get("file"), ep.get("fn"))
        nid = "endpoint:%s %s" % (method, ep.get("path"))
        node = idx["c4_nodes"].get((slug, nid)) or {}
        cases, files = _cases_split((ti.get("by_endpoint") or {}).get(fkey))
        out.update({"matched": True, "entity": slug, "endpoint": {"method": method, "path": ep.get("path"), "handler": fkey,
                    "status": ep.get("status"), "resp": ep.get("resp"), "doc": (ep.get("doc") or "")[:160],
                    "middleware": ep.get("middleware"), "touches_own": ep.get("touches")},
                    "behind": node.get("behind") or {"reason": "no behind block (graft arm absent at regen)"},
                    "access": node.get("access") or {"reason": "no access block"},
                    "edges_out": [{"target": t, "kind": k} for t, k, _ in idx["edges_out"].get(nid, [])][:mq.CAP],
                    "screens_in": [{"source": s, "kind": k} for s, k, _ in idx["edges_in"].get(nid, []) if k == "bridge"][:mq.CAP],
                    "tests": {"cases": cases[:mq.CAP], "covered_by_test_files": files[:mq.CAP]}})
        web = ((center.c4.get("stats") or {}).get("web") or {})
        unm = web.get("unmatched") if isinstance(web.get("unmatched"), list) else []
        out["web_unmatched_fetches"] = [u for u in unm if isinstance(u, dict) and norm_path(str(u.get("path", ""))) == want and str(u.get("method", "")).upper() == method][:mq.CAP] or None
        return out
    if kind == "function":
        out["function"] = _fn_record(center, key)
        return out
    if kind == "function_bare":
        keys = idx["fn_by_bare"].get(key) or []
        if not keys:
            out.update({"found": False, "reason": "no function, class, entity, file or endpoint named %r in the map — a map miss or a new name; grep is the floor" % key})
            return out
        if len(keys) > 1:
            out.update({"ambiguous": [{"key": k, "entity": (a.get("function_insight") or {}).get(k, {}).get("entity")} for k in keys][:mq.CAP],
                        "reason": "%d functions share this bare name — pass file::name" % len(keys)})
            return out
        out["function"] = _fn_record(center, keys[0])
        return out
    if kind == "file":
        p = key
        owners = idx["file_owners"].get(p) or []
        mi = a.get("model_insight") or {}
        defined = [c for c, r in mi.items() if r.get("file") == p]
        referenced = sorted({c for c, r in mi.items() for ref in (r.get("internal_refs") or []) if ref.get("file") == p})
        is_test = "/tests/" in p or "/test_" in p or ".test." in p or ".spec." in p or "/__tests__/" in p
        fe_pieces = [x.get("name") or x.get("id") for x in ((center.c4.get("fe") or {}).get("pieces") or []) if isinstance(x, dict) and x.get("file") == p]
        stem = re.sub(r"\.[a-z]+$", "", p)
        web = idx["web_by_stem"].get(stem)
        guard = (a.get("guard_insight") or {}).get("files", {}).get(p)
        defs = []
        for slug, ent in center.entities().items():
            defs += [n.rstrip("()") for n in (ent.get("defines") or {}).get(p, [])]
        out.update({"owners": [{"entity": s, "layer": l, "lines": n} for s, l, n in owners] or [],
                    "owned": bool(owners), "census": _census_entry(a, p),
                    "defines": mq.cap_list(sorted(set(defs)))[0], "functions": mq.cap_list(idx["fn_by_file"].get(p, []))[0],
                    "models_defined": defined[:mq.CAP], "models_referenced": referenced[:mq.CAP],
                    "tests_reaching": ((ti.get("by_file") or {}).get(p) or {}).get("reach", [])[:mq.CAP],
                    "guard": {"share": guard.get("share"), "unguarded": guard.get("unguarded"), "proven": guard.get("proven")} if guard else {"reason": "no guard row"},
                    "fe_pieces": fe_pieces[:mq.CAP],
                    "web_node": {"entity": web[0], "id": web[1].get("id")} if web else None})
        if is_test:
            ex = (ti.get("exercises") or {}).get(p)
            out["exercises"] = ex if ex else {"reason": "test file not in test_insight.exercises"}
        return out
    if kind == "case":
        home = (ti.get("case_home") or {}).get(key)
        own = {k: v for k, v in (ti.get("case_own") or {}).items() if k.endswith("_" + key) or ("_%s" % key) in k}
        out.update({"case": key, "home": home or {"reason": "case id not in the map's case_home"}, "owns": dict(list(own.items())[:5])})
        return out
    if kind == "entity":
        ec = t_entity_context({"slug": key, "detail": "brief", "root": root}, roots)
        ec.update({"target": target, "kind": "entity"})
        return ec
    if kind in ("model", "schema"):
        return _model_touches(center, key, kind, out)
    if kind == "define":
        homes = idx["defines"].get(key) or []
        methods = sorted(k for k in (a.get("function_insight") or {}) if ("::%s." % key) in k)
        out.update({"defined_in": [{"entity": s, "file": f} for s, f in homes][:mq.CAP], "methods": methods[:mq.CAP],
                    "tests_reaching": sorted({t for _, f in homes for t in ((ti.get("by_file") or {}).get(f) or {}).get("reach", [])})[:mq.CAP]})
        return out
    out["reason"] = "unhandled kind %s" % kind
    return out


def _census_entry(a: dict, path: str):
    for row in (a.get("file_census") or {}).get("unclaimed") or []:
        if row.get("file") == path:
            return {"claimed": False, "reason": row.get("reason"), "fns": row.get("fns"), "routes": row.get("routes")}
    return {"claimed": True} if (a.get("file_census") or {}) else {"reason": "no file_census block"}


def _model_touches(center: mq.Center, cls: str, kind: str, out: dict) -> dict:
    a, idx = center.archmap, center.idx()
    mi = (a.get("model_insight") or {}).get(cls) or {}
    ti = a.get("test_insight") or {}
    defn = None
    for slug, ent in center.entities().items():
        for m in (ent.get("models") if kind == "model" else ent.get("schemas")) or []:
            if m.get("cls") == cls:
                defn = (slug, m)
                break
        if defn:
            break
    fk_in = []
    if defn and defn[1].get("table"):
        table = defn[1]["table"]
        for slug, ent in center.entities().items():
            for m in ent.get("models") or []:
                for col, ref in (m.get("fks") or {}).items():
                    if ref.split(".")[0] == table:
                        fk_in.append({"model": m.get("cls"), "col": col, "entity": slug})
    fns = [{"fn": k, "rw": rw} for k, rw in idx["model_fns"].get(cls, [])]
    nid = "%s:%s" % (kind, cls)
    edges = {}
    for s, k, slug in idx["edges_in"].get(nid, []):
        edges.setdefault(k, []).append({"source": s, "entity": slug})
    cases, files = _cases_split((ti.get("by_model") or {}).get(cls))
    out.update({"cls": cls, "entity": mi.get("entity") or (defn[0] if defn else None), "file": mi.get("file"),
                "definition": ({"table": defn[1].get("table"), "cols": len(defn[1].get("cols") or defn[1].get("fields") or []),
                                "fks": defn[1].get("fks"), "doc": (defn[1].get("doc") or "")[:160]} if defn else {"reason": "not in any entity's models/schemas"}),
                "insight": {k: mi.get(k) for k in ("fk_in", "internal", "touches", "usage", "god", "base") if k in mi},
                "fk_in_models": fk_in[:mq.CAP],
                "functions_rw": fns[:mq.CAP], "functions_rw_note": "from function_insight.access.ops (r/w per function)",
                "referenced_from": [{"file": r.get("file"), "defs": r.get("defs")} for r in (mi.get("internal_refs") or [])][:mq.CAP],
                "endpoint_edges": {k: v[:mq.CAP] for k, v in edges.items()},
                "endpoint_edges_note": "l2 ∪ cross_edges; kinds as emitted (touches/reads_from/writes_to/consumes; nests = schema composition)",
                "tests": {"cases": cases[:mq.CAP], "covered_by_test_files": files[:mq.CAP]}})
    return out


# ── who_calls ──────────────────────────────────────────────────────────────────
def _map_confidence(root: str) -> dict:
    """The S14 tally read as a per-answer field: ACTIVE missed edges for the callers arm (fresh tier, no store)."""
    ledger = os.path.join(root, ".kdbp", "map-deltas-rollup.jsonl")
    if not os.path.isfile(ledger):
        return {"active_missed_edges": None, "note": "no map-delta ledger yet — the index has not been contradicted by grep here"}
    rc, cnt, _ = mq.sh(["git", "-C", root, "rev-list", "--count", "HEAD"])
    n_now = int(cnt.strip()) if rc == 0 and cnt.strip().isdigit() else 0
    horizon = int(os.environ.get("MAP_DELTAS_H", "40"))
    active, total = 0, 0
    try:
        for line in open(ledger, encoding="utf-8"):
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if o.get("v") != 2 or o.get("gen") != "_a3_graft.calls":
                continue
            total += 1
            if n_now - int(o.get("last_n") or 0) < horizon:
                active += 1
    except OSError:
        pass
    return {"active_missed_edges": active, "edges_total": total,
            "note": ("%d active missed caller edge(s) tallied — confirm with grep" % active) if active else "no active missed caller edges tallied"}


def t_who_calls(args: dict, roots) -> dict:
    sym = (args.get("symbol") or "").strip()
    if not mq.SYMBOL_RE.match(sym):
        raise mq.MapStop("symbol must be an identifier ([A-Za-z_][A-Za-z0-9_]*)")
    direction = (args.get("direction") or "in").lower()
    if direction not in ("in", "out"):
        raise mq.MapStop("direction must be in (callers) or out (callees)")
    depth = str(args.get("depth") or "1")
    if not (depth == "all" or depth.isdigit()):
        raise mq.MapStop("depth must be an integer or 'all'")
    root, source = mq.resolve_root(args.get("root"), roots)
    center, reason = mq.open_center(root)
    transitive = direction == "out" or depth != "1"
    emit = bool(args.get("emit", True)) and not os.environ.get("GABE_MAP_NO_EMIT") and not transitive
    cj, cstat = mq.graft_callers(sym, root, direction=direction, depth=depth)
    hits, gstat = mq.git_grep_hits(sym, root)
    allowed = list(roots or [])
    if os.environ.get("CLAUDE_PROJECT_DIR"):
        allowed.append(os.path.abspath(os.environ["CLAUDE_PROJECT_DIR"]))
    allowed = [mq.git_toplevel(p) or p for p in allowed] or None
    res = mq.two_arm(sym, root, cj, cstat, hits, gstat, emit=emit, cmd="mcp", allowed_roots=allowed)
    out = {"present": center is not None, "root": root, "root_source": source}
    if center:
        out.update(mq.stamp(center))
    else:
        out["map_note"] = reason
    out.update(res)
    out["direction"], out["depth"] = direction, depth
    if direction == "out":
        out["callees"] = out.pop("callers", [])
        out["callees_detail"] = out.pop("callers_detail", [])
    if transitive:
        out["emit_skipped"] = list(out.get("emit_skipped") or []) + ["transitive/callee queries never emit — the delta semantics are 'a DIRECT caller the index missed'"]
    out["map_confidence"] = _map_confidence(root) if center else None
    out["reach_line"] = mq.reach_line(res, root)
    out["floors"] = ["graft indexes .py/.ts/.tsx/.js/.jsx only; an empty reach is never an absence proof — grep -rn is",
                     "grep hits classified code vs prose (Python via tokenize, exact; others by line shape) — prose hits are listed, never emitted"]
    return out


# ── entity_shape ───────────────────────────────────────────────────────────────
def t_entity_shape(args: dict, roots) -> dict:
    center, root, source, reason = _ctx(args, roots)
    if not center:
        return _absent(root, source, reason)
    es = mq.pulse_module("entity_shape")
    endpoints, umap = es.load_project(Path(center.root))
    shape = es.entity_shape(endpoints, umap)
    out = _base(center, root, source)
    out["shape"] = shape
    out["one_line"] = es.one_line(shape) or "no finding — every URL domain is owned by exactly the entities the model expects"
    domain = (args.get("domain") or "").strip().strip("/")
    if domain:
        owners: dict[str, int] = {}
        for e in endpoints:
            if es.url_domain(e.get("path", "")) == domain:
                owners[e.get("entity") or "(unclaimed)"] = owners.get(e.get("entity") or "(unclaimed)", 0) + 1
        out["domain"] = {"segment": domain, "owners": owners, "candidate": umap.get(domain),
                         "reason": None if owners else "no declared endpoint under /%s" % domain}
    base = (args.get("diff") or "").strip()
    if base:
        rc, text, err = mq.sh(["git", "-C", root, "diff", base])
        if rc != 0:
            out["diff"] = {"reason": "git diff %s failed: %s" % (base, err.strip()[:120])}
        else:
            new_routes = es.diff_new_routes(text)
            try:
                cls = es.classify_new_routes(new_routes, shape.get("owned") or {}, shape.get("orphans") or shape.get("orphan_domains") or [], umap)
            except Exception as exc:  # the classifier's shape may differ across versions — honest, never a crash
                cls = {"reason": "classifier unavailable: %s" % exc}
            out["diff"] = {"base": base, "new_routes": new_routes[:mq.CAP], "classified": cls}
    return out


# ── cases_for ──────────────────────────────────────────────────────────────────
_CID_TOKEN = re.compile(r"(?<![A-Za-z0-9_])C(\d{1,6})(?:v\d+)?(?![A-Za-z0-9])")


def t_cases_for(args: dict, roots) -> dict:
    center, root, source, reason = _ctx(args, roots)
    if not center:
        return _absent(root, source, reason)
    target = (args.get("target") or "").strip()
    if not target:
        raise mq.MapStop("target is required: function (bare or file::fn), model, endpoint 'METHOD /path' or file::fn handler, file, or case id")
    a = center.archmap
    ti = a.get("test_insight") or {}
    idx = center.idx()
    out = _base(center, root, source)
    out["target"] = target
    kind, key = detect_kind(target, center)
    rows, via = None, None
    if kind == "function" or kind == "function_bare":
        keys = [key] if kind == "function" else (idx["fn_by_bare"].get(key) or [])
        if len(keys) > 1:
            out["ambiguous"] = keys[:mq.CAP]
        rows = {k: (ti.get("by_function") or {}).get(k) for k in keys[:1]} if keys else None
        rows = list(rows.values())[0] if rows else None
        via = "by_function"
        if rows is None and keys:
            rows = (ti.get("by_endpoint") or {}).get(keys[0]); via = "by_endpoint"
    elif kind in ("model", "schema"):
        rows, via = (ti.get("by_model") or {}).get(key), "by_model"
    elif kind == "endpoint":
        method, path = key
        want = norm_path(path)
        for slug, ent in center.entities().items():
            for ep in ent.get("endpoints") or []:
                if str(ep.get("method", "")).upper() == method and norm_path(ep.get("path", "")) == want:
                    rows = (ti.get("by_endpoint") or {}).get("%s::%s" % (ep.get("file"), ep.get("fn"))); via = "by_endpoint"
    elif kind == "file":
        bf = (ti.get("by_file") or {}).get(key)
        out["test_files_reaching"] = (bf or {}).get("reach", [])[:mq.CAP]
        ex = (ti.get("exercises") or {}).get(key)
        if ex:
            out["exercises"] = ex
        via = "by_file"
    elif kind == "case":
        out["home"] = (ti.get("case_home") or {}).get(key) or {"reason": "not in case_home"}
        via = "case_home"
    cases, files = _cases_split(rows) if isinstance(rows, dict) else ([], [])
    out.update({"kind": kind, "via": via, "cases": cases[:mq.CAP], "covered_by_test_files": files[:mq.CAP],
                "census_note": "absence here = no census row in the map (a floor), not proof of no test"})
    if rows is None and kind not in ("file", "case"):
        out["reason"] = "no %s row for %s in the committed map" % (via or "test_insight", target)
    maxmap = 0
    for cid in (ti.get("case_home") or {}):
        m = _CID_TOKEN.search(cid)
        if m:
            maxmap = max(maxmap, int(m.group(1)))
    out["max_cid_in_map"] = maxmap or None
    rc, grep, _ = mq.sh(["git", "-C", root, "grep", "-ohIE", "(^|[^A-Za-z0-9_])C[0-9]{1,6}(v[0-9]+)?([^A-Za-z0-9]|$)", "--",
                         ":(glob)**/*test*", ":(glob)**/*spec*", ":(glob)**/tests/**"], timeout=60)
    if rc in (0, 1):
        found = [int(m.group(1)) for m in _CID_TOKEN.finditer(grep)]
        mx = max(found) if found else 0
        out["corpus"] = {"searched": "git grep -ohIE '(^|[^A-Za-z0-9_])C[0-9]{1,6}(v[0-9]+)?([^A-Za-z0-9]|$)' -- '**/*test*' '**/*spec*' '**/tests/**'",
                         "max_cid_seen": mx or None, "next_cid_floor": (mx + 1) if mx else None,
                         "note": "the corpus is the registry; the map may lag — re-grep before minting"}
    else:
        out["corpus"] = {"reason": "git grep unavailable (rc %d)" % rc}
    return out


# ── owner_of ───────────────────────────────────────────────────────────────────
def t_owner_of(args: dict, roots) -> dict:
    center, root, source, reason = _ctx(args, roots)
    if not center:
        return _absent(root, source, reason)
    paths = args.get("paths") or args.get("path") or []
    if isinstance(paths, str):
        paths = [paths]
    paths = [p.strip().lstrip("./") for p in paths if str(p).strip()]
    if not paths:
        raise mq.MapStop("path (or paths) is required")
    ws = mq.pulse_module("work_scope")
    globs = ws.entity_code_globs(center.config or {})
    idx = center.idx()
    a = center.archmap
    out = _base(center, root, source)
    out["results"] = []
    for p in paths[:mq.CAP]:
        is_dir = p.endswith("/") or (os.path.isdir(os.path.join(root, p)) and not os.path.isfile(os.path.join(root, p)))
        if is_dir:
            pre = p.rstrip("/") + "/"
            per: dict[str, int] = {}
            n = 0
            for f, owners in idx["file_owners"].items():
                if f.startswith(pre):
                    n += 1
                    for s, _, _ in owners:
                        per[s] = per.get(s, 0) + 1
            uncl = [r.get("file") for r in (a.get("file_census") or {}).get("unclaimed") or [] if str(r.get("file", "")).startswith(pre)]
            out["results"].append({"path": p, "kind": "dir", "mapped_files": n, "owners": per, "unclaimed_in_census": uncl[:mq.CAP]})
            continue
        owners = [{"entity": s, "layer": l, "lines": n} for s, l, n in idx["file_owners"].get(p, [])]
        glob_owners = sorted(s for s, pats in globs.items() if any(ws.matches(p, pat) for pat in pats))
        out["results"].append({"path": p, "kind": "file", "owners": owners, "owned": bool(owners),
                               "config_glob_owners": glob_owners, "census": _census_entry(a, p),
                               "note": None if owners else "unowned by the map — the map is BLIND here; the retro-trace found 82% of misses are coverage"})
    return out


# ── registry ───────────────────────────────────────────────────────────────────
def _schema(props: dict, required: list[str] | None = None) -> dict:
    s = {"type": "object", "properties": props, "additionalProperties": False}
    if required:
        s["required"] = required
    return s


ROOT_PROP = {"root": {"type": "string", "description": "Project root (defaults to the session's project; normalized to the git toplevel)."}}
RO = {"readOnlyHint": True, "destructiveHint": False, "idempotentHint": True, "openWorldHint": False}

TOOLS = [
    {"name": "map_status", "fn": t_map_status, "annotations": RO,
     "description": "Is there a codebase map here, and how fresh is it? Entities, counts, freshness vs git, graft index state, regen command. Call first when unsure the project has a map.",
     "inputSchema": _schema({**ROOT_PROP})},
    {"name": "entity_context", "fn": t_entity_context, "annotations": RO,
     "description": "One entity's slice from the map: endpoints, models, schemas, files by layer, FK relations, coverage. Omit slug to list entities. detail brief|full|raw.",
     "inputSchema": _schema({"slug": {"type": "string", "description": "Entity slug, or omit / 'list' for the registered entities."},
                             "detail": {"type": "string", "enum": ["brief", "full", "raw"], "description": "brief (default, ~300 tokens) · full (capped) · raw (uncapped pack)."}, **ROOT_PROP})},
    {"name": "touches", "fn": t_touches, "annotations": RO,
     "description": "What touches X in the map: for a file, model/schema, function (bare or file::fn), entity, endpoint 'METHOD /path' or case id — owners, r/w functions, endpoints, tests, edges.",
     "inputSchema": _schema({"target": {"type": "string", "description": "File path · Model/Schema/Class · function · file::fn · entity slug · 'GET /path' · C123"}, **ROOT_PROP}, ["target"])},
    {"name": "who_calls", "fn": t_who_calls, "annotations": {**RO, "readOnlyHint": False},
     "description": "Who calls / where is symbol X used (or what it calls: direction=out, depth=N|all): graft callers ∪ word-boundary git grep, hits code vs prose, misses emitted as deltas. Returns the Reach line.",
     "inputSchema": _schema({"symbol": {"type": "string", "description": "An identifier (function, class, hook name)."},
                             "direction": {"type": "string", "enum": ["in", "out"], "description": "in = callers (default) · out = callees."},
                             "depth": {"type": "string", "description": "1 (default), N hops, or 'all' — transitive blast radius via graft; only direction=in depth=1 emits deltas."},
                             "emit": {"type": "boolean", "description": "Append map-delta lines for code hits the map missed (default true; gated)."}, **ROOT_PROP}, ["symbol"])},
    {"name": "entity_shape", "fn": t_entity_shape, "annotations": RO,
     "description": "Which entity owns URL domain /x; orphan URL domains and aspect entities, computed fresh from the map. Optional diff=<base> classifies routes a diff adds.",
     "inputSchema": _schema({"domain": {"type": "string", "description": "A URL domain segment to look up, e.g. 'settings'."},
                             "diff": {"type": "string", "description": "A git base (sha/branch) — classify routes added since it."}, **ROOT_PROP})},
    {"name": "cases_for", "fn": t_cases_for, "annotations": RO,
     "description": "Which test cases (C-ids) cover X — function, model, endpoint, file or case id — plus the corpus's max C-id and next-id floor. REUSE before NEW.",
     "inputSchema": _schema({"target": {"type": "string", "description": "function · file::fn · Model · 'GET /path' · file path · C123"}, **ROOT_PROP}, ["target"])},
    {"name": "owner_of", "fn": t_owner_of, "annotations": RO,
     "description": "Which entity owns these file paths (or a directory): map owners, center.config globs, and whether the census says the map is blind there.",
     "inputSchema": _schema({"path": {"type": "string", "description": "One repo-relative path or directory."},
                             "paths": {"type": "array", "items": {"type": "string"}, "description": "Several paths."}, **ROOT_PROP})},
]
BY_NAME = {t["name"]: t for t in TOOLS}

INSTRUCTIONS = """gabe-map: the project's committed codebase map as tools (read-only; who_calls may append gitignored map-delta lines).
When a project has a command center (docs/site/center/), ask the map BEFORE grepping:
- who calls X / where is X used → mcp__gabe-map__who_calls (both arms: index ∪ grep; hits marked code vs prose)
- what touches this file / model / endpoint / function → mcp__gabe-map__touches
- which entity owns this path or directory → mcp__gabe-map__owner_of
- which test cases cover X, next free C-id → mcp__gabe-map__cases_for
- one entity's endpoints/models/files → mcp__gabe-map__entity_context (omit slug to list entities)
- who owns URL domain /x, orphan domains → mcp__gabe-map__entity_shape
- is there a map here, how stale → mcp__gabe-map__map_status (call first when unsure)
- find X by name (entity/endpoint/model/function/screen) → mcp__gabe-map__find · a file's definitions + signatures → mcp__gabe-map__outline
- orient in the codebase → mcp__gabe-map__center_overview · what does this change touch → mcp__gabe-map__blast_radius
- where is the map blind → mcp__gabe-map__map_census · how did the map change between refs → mcp__gabe-map__map_diff
- the center's actionable list → mcp__gabe-map__center_status · a review's drift subjects vs a base → mcp__gabe-map__review_drift
The map is a FLOOR, never a scope: absence in an answer is not proof of absence — grep -rn remains the absence proof. Every answer stamps map@<head> · freshness. No center → the tools say so and point to Grep/Glob."""


def call(name: str, args: dict, roots: list[str] | None) -> tuple[dict, bool]:
    """→ (result, is_error). MapStop → an honest answer (is_error True so the model self-corrects on bad input)."""
    t = BY_NAME.get(name)
    if not t:
        raise KeyError(name)
    try:
        return t["fn"](args or {}, roots), False
    except mq.MapStop as exc:
        return {"stop": str(exc), "tool": name}, True


# ── wave 2 (the graft equivalents + map lifecycle) — registered after the helpers exist ──
import tools_wave2 as _w2  # noqa: E402
TOOLS.extend(_w2.TOOLS)
BY_NAME.update({t["name"]: t for t in _w2.TOOLS})
