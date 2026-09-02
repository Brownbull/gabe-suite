#!/usr/bin/env python3
"""tools_wave2 — the graft equivalents + map-lifecycle readers (operator ruling 2026-09-02, D10).

find (graft_find_code) · outline (graft_file_api) · center_overview (graft_repo_map) · blast_radius ·
map_census · map_diff · center_status · review_drift. All READ-ONLY; every list capped and the cap
named; every answer stamped; every missing block a `reason`. Registered into tools.TOOLS at import.
"""
from __future__ import annotations
import hashlib
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapquery as mq  # noqa: E402
import tools as T  # noqa: E402

_WIRING: dict = {}


def load_wiring(root: str) -> tuple[dict | None, str]:
    """graft/.graph/wiring.json (10 MB on gustify) cached per (mtime, size); (None, reason) when absent."""
    p = Path(root) / "graft" / ".graph" / "wiring.json"
    if not p.is_file():
        return None, "no graft index (graft/.graph/wiring.json absent)"
    try:
        st = p.stat()
        key = (st.st_mtime_ns, st.st_size)
        hit = _WIRING.get(str(p))
        if hit and hit[0] == key:
            return hit[1], "index"
        data = json.loads(p.read_text(encoding="utf-8"))
        by_file: dict[str, list] = {}
        for n in data.get("nodes") or []:
            if isinstance(n, dict) and n.get("path") and n.get("kind") != "file":
                by_file.setdefault(n["path"], []).append(n)
        packed = {"by_file": by_file, "meta": data.get("meta") or {}, "hash": hashlib.sha256(p.read_bytes()).hexdigest()[:12]}
        _WIRING[str(p)] = (key, packed)
        return packed, "index"
    except (OSError, json.JSONDecodeError) as exc:
        return None, "unreadable graft index: %s" % exc


# ── find ───────────────────────────────────────────────────────────────────────
def _score(q: str, name: str, doc: str = "") -> int:
    n, d = (name or "").lower(), (doc or "").lower()
    if n == q: return 100
    if n.endswith("." + q) or n.endswith("::" + q) or n.split("/")[-1] == q: return 90
    if n.startswith(q): return 70
    if q in n: return 50
    if q in d: return 20
    return 0


def t_find(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    q = (args.get("query") or "").strip().lower()
    if len(q) < 2:
        raise mq.MapStop("query must be at least 2 characters")
    kinds = args.get("kind")
    kinds = {kinds} if isinstance(kinds, str) and kinds else None
    limit = max(1, min(int(args.get("limit") or 20), mq.CAP))
    a, c, idx = center.archmap, center.c4, center.idx()
    hits = []

    def add(kind, name, entity, file, extra=None, doc=""):
        s = _score(q, name, doc)
        if s and (kinds is None or kind in kinds):
            hits.append((s, {"kind": kind, "name": name, "entity": entity, "file": file, **(extra or {})}))
    for slug, ent in center.entities().items():
        add("entity", slug, slug, None)
        for ep in ent.get("endpoints") or []:
            add("endpoint", "%s %s" % (ep.get("method"), ep.get("path")), slug, ep.get("file"), {"fn": ep.get("fn")}, ep.get("doc") or "")
        for m in ent.get("models") or []:
            add("model", m.get("cls") or "", slug, m.get("file"), {"table": m.get("table")}, m.get("doc") or "")
        for s_ in ent.get("schemas") or []:
            add("schema", s_.get("cls") or "", slug, s_.get("file"), None, s_.get("doc") or "")
        for path, names in (ent.get("defines") or {}).items():
            for n in names:
                nm = n.rstrip("()")
                if nm not in idx["fn_by_bare"] and nm not in idx["cls"]:
                    add("define", nm, slug, path)
    for k, rec in (a.get("function_insight") or {}).items():
        add("function", k, rec.get("entity"), rec.get("file"), {"layer": rec.get("layer"), "handler": rec.get("handler")}, rec.get("doc") or "")
    for p in (c.get("fe") or {}).get("pieces") or []:
        if isinstance(p, dict):
            add("fe", p.get("name") or p.get("id") or "", p.get("home"), p.get("file"), {"piece_kind": p.get("kind")})
    for stem, (slug, node) in idx["web_by_stem"].items():
        add("screen", stem, slug, None)
    hits.sort(key=lambda h: (-h[0], h[1]["kind"], h[1]["name"]))
    out = T._base(center, root, source)
    out.update({"query": q, "hits": [h[1] for h in hits[:limit]], "total": len(hits),
                "note": ("+%d more (limit %d)" % (len(hits) - limit, limit)) if len(hits) > limit else None,
                "ranking": "exact 100 · qualified-tail 90 · prefix 70 · substring 50 · in-doc 20",
                "floor": "searches the map's names and docs, not the source — a name the map lacks is a Grep question"})
    return out


# ── outline ────────────────────────────────────────────────────────────────────
def t_outline(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    path = (args.get("file") or "").strip().lstrip("./")
    if not path:
        raise mq.MapStop("file is required (repo-relative path)")
    a, idx = center.archmap, center.idx()
    fi = a.get("function_insight") or {}
    wiring, wstat = load_wiring(root)
    out = T._base(center, root, source)
    out.update({"file": path, "exists": os.path.isfile(os.path.join(root, path)),
                "owners": [{"entity": s, "layer": l, "lines": n} for s, l, n in idx["file_owners"].get(path, [])]})
    defs = []
    if wiring and path in wiring["by_file"]:
        for n in sorted(wiring["by_file"][path], key=lambda x: int((x.get("span") or "L0").split("-")[0].lstrip("L") or 0)):
            key = "%s::%s" % (path, n.get("name"))
            rec = fi.get(key) or next((fi[k] for k in idx["fn_by_file"].get(path, []) if k.split("::", 1)[1].split(".")[-1] == n.get("name")), {})
            defs.append({"span": n.get("span"), "kind": n.get("kind"), "name": n.get("name"), "signature": (n.get("signature") or "")[:200],
                         "exported": n.get("exported"), "returns": rec.get("returns"), "async": rec.get("async"),
                         "access_ops": (rec.get("access") or {}).get("ops"), "doc": (rec.get("doc") or "")[:120] or None})
        out["signatures"] = "graft index (%s)" % wiring["hash"]
    else:
        for k in idx["fn_by_file"].get(path, []):
            rec = fi[k]
            defs.append({"span": None, "kind": "method" if "." in k.split("::", 1)[1] else "function", "name": k.split("::", 1)[1],
                         "signature": None, "returns": rec.get("returns"), "async": rec.get("async"),
                         "access_ops": (rec.get("access") or {}).get("ops"), "doc": (rec.get("doc") or "")[:120] or None})
        out["signatures"] = "unavailable — %s; names/returns from function_insight" % wstat
    lst, note = mq.cap_list(defs)
    mi = a.get("model_insight") or {}
    ti = a.get("test_insight") or {}
    out.update({"definitions": lst, "definitions_note": note,
                "models_defined": [cls for cls, r in mi.items() if r.get("file") == path][:mq.CAP],
                "models_referenced": sorted({cls for cls, r in mi.items() for ref in (r.get("internal_refs") or []) if ref.get("file") == path})[:mq.CAP],
                "tests_reaching": ((ti.get("by_file") or {}).get(path) or {}).get("reach", [])[:mq.CAP],
                "census": T._census_entry(a, path)})
    return out


# ── center_overview ────────────────────────────────────────────────────────────
def t_center_overview(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    a, c = center.archmap, center.c4
    ad = {s.get("entity"): s for s in (center.adoption.get("sections") or [])}
    cov = a.get("coverage") or {}
    rows = []
    for slug, ent in sorted(center.entities().items()):
        s = ad.get(slug) or {}
        cv = cov.get(slug) or {}
        fe_home = next((h for h in ((c.get("fe") or {}).get("homes") or []) if isinstance(h, dict) and h.get("id") == "fe·%s" % slug), {})
        rows.append({"entity": slug, "rank": s.get("rank"), "status": s.get("status"),
                     "endpoints": len(ent.get("endpoints") or []), "models": len(ent.get("models") or []),
                     "schemas": len(ent.get("schemas") or []), "files": len(ent.get("files") or []),
                     "coverage": ("%s/%s" % (cv.get("covered"), cv.get("total"))) if cv else None,
                     "fe_pieces": fe_home.get("pieces")})
    st = c.get("stats") or {}
    sh_ = a.get("schema_homing") or {}
    out = T._base(center, root, source)
    out.update({"entities": rows,
                "arms": {"graft": (st.get("graft") or {}).get("present"), "web": (st.get("web") or {}).get("present"),
                         "fe": bool((c.get("fe") or {}).get("pieces"))},
                "census_gaps": {"files_unclaimed": len((a.get("file_census") or {}).get("unclaimed") or []),
                                "models_unclaimed": len((a.get("model_census") or {}).get("unclaimed") or []),
                                "routes_unclaimed": len((a.get("route_census") or {}).get("unclaimed") or []) if a.get("route_census") else None,
                                "schemas_unwired": len(sh_.get("unwired") or []), "schemas_ambiguous": len(sh_.get("ambiguous") or [])},
                "web": {k: (st.get("web") or {}).get(k) for k in ("screens", "fetch_sites", "matched", "unmatched") if (st.get("web") or {}).get(k) is not None}
                if isinstance((st.get("web") or {}).get("unmatched"), int) else {"unmatched": len((st.get("web") or {}).get("unmatched") or [])},
                "unregistered": sorted(set(center.entities()) - set(ad)),
                "stations": "codebase-graph.html · gabe-universe.html · architecture.html · board.html (docs/site/center/)"})
    return out


# ── blast_radius ───────────────────────────────────────────────────────────────
def _changed_files(root: str) -> tuple[list[str], str]:
    files: set[str] = set()
    rc, out, _ = mq.sh(["git", "-C", root, "diff", "--name-only", "HEAD"])
    if rc != 0:
        return [], "git diff unavailable"
    files.update(l.strip() for l in out.splitlines() if l.strip())
    rc, st, _ = mq.sh(["git", "-C", root, "status", "--porcelain", "--untracked-files=all"])
    if rc == 0:
        files.update(l[3:].strip() for l in st.splitlines() if l.startswith("??"))
    return sorted(f for f in files if f.endswith(mq.SRC_EXT) and not mq.noise(f)), "worktree vs HEAD (+ untracked)"


def t_blast_radius(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    files = args.get("files")
    if isinstance(files, str):
        files = [files]
    if files:
        files, src = [f.strip().lstrip("./") for f in files if str(f).strip()], "argument"
    else:
        files, src = _changed_files(root)
    a, idx = center.archmap, center.idx()
    fi = a.get("function_insight") or {}
    ti = a.get("test_insight") or {}
    mi = a.get("model_insight") or {}
    touched: dict[str, int] = {}
    unowned, fns, models, endpoints, tests, fe = [], [], set(), {}, set(), []
    for f in files:
        owners = idx["file_owners"].get(f, [])
        if not owners:
            unowned.append(f)
        for s, _, _ in owners:
            touched[s] = touched.get(s, 0) + 1
        fns += idx["fn_by_file"].get(f, [])
        models.update(cls for cls, r in mi.items() if r.get("file") == f)
        tests.update(((ti.get("by_file") or {}).get(f) or {}).get("reach", []))
        fe += [p.get("name") for p in ((center.c4.get("fe") or {}).get("pieces") or []) if isinstance(p, dict) and p.get("file") == f]
    bare = {k.split("::", 1)[1].split(".")[-1] for k in fns}
    for (slug, nid), n in idx["c4_nodes"].items():
        if n.get("kind") != "endpoint":
            continue
        hkey = None
        for ep_key, (s, m, p) in idx["handler_of"].items():
            if ep_key.split("::", 1)[0] in files and nid == "endpoint:%s %s" % (m, p):
                hkey = ep_key
        names = set((n.get("behind") or {}).get("names") or [])
        if hkey or (names & bare):
            endpoints[nid] = {"entity": slug, "via": "handler in changed file" if hkey else "behind.names (floor, cap 12)"}
    fk_neighbors = set()
    for cls in models:
        for row in T._model_touches(center, cls, "model", {}).get("fk_in_models") or []:
            if row.get("entity"):
                fk_neighbors.add(row["entity"])
    n_ent = len(touched)
    reading = "contained" if n_ent <= 1 and not (fk_neighbors - set(touched)) else ("local" if n_ent <= 1 else "cross-cutting")
    if unowned and not touched:
        reading = "unmapped"
    out = T._base(center, root, source)
    out.update({"files": files[:mq.CAP], "files_source": src, "files_more": max(0, len(files) - mq.CAP),
                "touched_entities": touched, "unowned_files": unowned[:mq.CAP],
                "functions": sorted(fns)[:mq.CAP], "models_defined": sorted(models)[:mq.CAP],
                "fk_neighbor_entities": sorted(fk_neighbors - set(touched)),
                "endpoints_reached": dict(list(endpoints.items())[:mq.CAP]),
                "tests_reaching": sorted(tests)[:mq.CAP], "fe_pieces": fe[:mq.CAP],
                "reading": reading,
                "floor": "map joins only (owners · handler files · behind.names capped 12 · by_file.reach); the sim's FK blast is exact, everything else is a floor — run who_calls on the changed symbols before trusting 'contained'"})
    return out


# ── map_census ─────────────────────────────────────────────────────────────────
def t_map_census(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    a = center.archmap
    want = (args.get("kind") or "").strip()
    out = T._base(center, root, source)
    def block(name):
        b = a.get(name)
        if not b:
            return {"reason": "no %s block in this archmap (version %s)" % (name, a.get("version"))}
        uncl, note = mq.cap_list(b.get("unclaimed") or [])
        return {"claimed": b.get("claimed"), "scanned_dirs": b.get("scanned_dirs"), "unclaimed": uncl, "unclaimed_note": note}
    sh_ = a.get("schema_homing") or {}
    sections = {"file": block("file_census"), "model": block("model_census"), "route": block("route_census"),
                "schema": ({"unwired": mq.cap_list(sh_.get("unwired") or [])[0], "ambiguous": mq.cap_list(sh_.get("ambiguous") or [])[0],
                            "moved": len(sh_.get("moved") or []), "fn_wires": len(sh_.get("fn_wires") or [])} if sh_ else {"reason": "no schema_homing block"})}
    if want:
        if want not in sections:
            raise mq.MapStop("kind must be one of file | model | route | schema")
        out["census"] = {want: sections[want]}
    else:
        out["census"] = sections
    out["note"] = "unclaimed = the map is BLIND there (pulse S11/S13 nag these); 'full coverage' holds only for archmap version ≥ 2"
    return out


# ── map_diff ───────────────────────────────────────────────────────────────────
def _map_at(root: str, ref: str | None):
    rel = mq.CENTER_REL + "/archmap.json"
    if ref in (None, "", "WORKTREE"):
        p = Path(root) / rel
        return (json.loads(p.read_text(encoding="utf-8")) if p.is_file() else None), "worktree"
    rc, out, err = mq.sh(["git", "-C", root, "show", "%s:%s" % (ref, rel)])
    if rc != 0:
        return None, "git show failed: %s" % err.strip()[:120]
    try:
        return json.loads(out), ref
    except json.JSONDecodeError:
        return None, "unparseable archmap at %s" % ref


def _ent_sets(m: dict) -> dict:
    out = {}
    for slug, ent in (m.get("entities") or {}).items():
        out[slug] = {"endpoints": {"%s %s" % (e.get("method"), e.get("path")) for e in ent.get("endpoints") or []},
                     "models": {x.get("cls") for x in ent.get("models") or []},
                     "schemas": {x.get("cls") for x in ent.get("schemas") or []},
                     "files": {r[1] for r in ent.get("files") or [] if len(r) > 1}}
    return out


def t_map_diff(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    base = (args.get("base") or "").strip()
    if not base:
        raise mq.MapStop("base is required (a sha, branch or tag whose committed archmap to compare against)")
    head = (args.get("head") or "").strip() or None
    A, a_src = _map_at(root, base)
    B, b_src = _map_at(root, head)
    out = T._base(center, root, source)
    if A is None or B is None:
        out["reason"] = "%s · %s" % (a_src, b_src)
        return out
    if A.get("head") == B.get("head"):
        out.update({"base": a_src, "head": b_src, "regenerated": False, "note": "both maps carry head %s — the map was not regenerated between these refs" % A.get("head")})
        return out
    ea, eb = _ent_sets(A), _ent_sets(B)
    per = {}
    for slug in sorted(set(ea) | set(eb)):
        if slug not in ea:
            per[slug] = {"entity": "added"}; continue
        if slug not in eb:
            per[slug] = {"entity": "removed"}; continue
        d = {}
        for k in ("endpoints", "models", "schemas", "files"):
            add, rem = sorted(eb[slug][k] - ea[slug][k]), sorted(ea[slug][k] - eb[slug][k])
            if add or rem:
                d[k] = {"added": add[:20], "removed": rem[:20], "more": max(0, len(add) + len(rem) - 40)}
        if d:
            per[slug] = d
    def cnt(m, k): return len((m.get(k) or {}).get("unclaimed") or []) if m.get(k) else None
    out.update({"base": a_src, "head": b_src, "regenerated": True, "map_heads": {"base": A.get("head"), "head": B.get("head")},
                "entities": per or {"note": "no entity-level change"},
                "census_delta": {k: {"base": cnt(A, k), "head": cnt(B, k)} for k in ("file_census", "model_census", "route_census")},
                "functions": {"base": len(A.get("function_insight") or {}), "head": len(B.get("function_insight") or {})}})
    return out


# ── center_status ──────────────────────────────────────────────────────────────
def t_center_status(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    out = T._base(center, root, source)
    script = Path(root) / "scripts" / "center_status.py"
    if not script.is_file():
        out["status"] = {"reason": "no scripts/center_status.py in this project (installed by /gabe-cc-init)"}
        return out
    rc, text, err = mq.sh([sys.executable, str(script), root], cwd=root, timeout=60)
    out["status"] = {"ran": rc == 0, "exit": rc, "text": text[:6000], "truncated": len(text) > 6000, "stderr": err.strip()[:300] or None}
    out["not_run"] = ["next_feature.py (backfill queue) and risk_sweep.py (P0–P3 ladder) are /gabe-cc-update's — heavier; not run here"]
    return out


# ── review_drift ───────────────────────────────────────────────────────────────
_REACH_RE = re.compile(r"- \*\*Reach:\*\* (.+?) \((graft|grep-only)@([0-9a-f]+)\)")


def _phase_reach(root: str, phase_id: str | None) -> tuple[list[str], str | None, str | None]:
    plan = Path(root) / ".kdbp" / "PLAN.md"
    if not plan.is_file():
        return [], None, "no .kdbp/PLAN.md"
    text = plan.read_text(encoding="utf-8", errors="replace")
    if phase_id:
        m = re.search(r"### Phase %s\b.*?(?=\n### Phase |\n## |\Z)" % re.escape(phase_id), text, re.S)
        text = m.group(0) if m else ""
    m = _REACH_RE.search(text)
    if not m:
        return [], None, "no Reach: record%s" % (" for phase %s" % phase_id if phase_id else "")
    files = [f.strip() for f in m.group(1).split("·") if f.strip() and f.strip() != "—"]
    return files, m.group(3), None


def t_review_drift(args: dict, roots) -> dict:
    center, root, source, reason = T._ctx(args, roots)
    if not center:
        return T._absent(root, source, reason)
    base = (args.get("base") or "").strip()
    if not base:
        raise mq.MapStop("base is required (the ref the phase's diff is measured against)")
    want = args.get("subjects")
    want = set(want) if isinstance(want, list) else None
    rc, diff, err = mq.sh(["git", "-C", root, "diff", base], timeout=60)
    if rc != 0:
        raise mq.MapStop("git diff %s failed: %s" % (base, err.strip()[:120]))
    rc, names, _ = mq.sh(["git", "-C", root, "diff", "--name-only", base])
    changed = sorted(l.strip() for l in names.splitlines() if l.strip()) if rc == 0 else []
    changed_src = [f for f in changed if f.endswith(mq.SRC_EXT) and not mq.noise(f)]
    out = T._base(center, root, source)
    out.update({"base": base, "changed_files": len(changed), "changed_source": changed_src[:mq.CAP], "subjects": {}})
    subj = out["subjects"]

    def run(name):
        return want is None or name in want
    if run("entity_shape"):
        try:
            es = mq.pulse_module("entity_shape")
            eps, umap = es.load_project(Path(center.root))
            shape = es.entity_shape(eps, umap)
            new_routes = es.diff_new_routes(diff)
            cls = es.classify_new_routes(new_routes, shape.get("owned") or {}, shape.get("orphans") or [], umap) if new_routes else {}
            subj["entity_shape"] = {"ran": True, "new_routes": new_routes[:mq.CAP], "classified": cls, "standing": es.one_line(shape) or "clean"}
        except Exception as exc:
            subj["entity_shape"] = {"ran": False, "reason": "%s: %s" % (type(exc).__name__, exc)}
    if run("web_bridge"):
        try:
            fb = mq.pulse_module("fetch_bridge")
            keys = fb.load_endpoint_keys(Path(center.root))
            new_f = fb.diff_new_fetches(diff)
            present, unmatched, why = fb.load_unmatched(Path(center.root))
            cls = fb.classify_new_fetches(new_f, keys) if new_f else {}
            subj["web_bridge"] = {"ran": True, "new_fetches": new_f[:mq.CAP], "classified": cls, "standing_unmatched": len(unmatched), "web_arm": present or why}
        except Exception as exc:
            subj["web_bridge"] = {"ran": False, "reason": "%s: %s" % (type(exc).__name__, exc)}
    if run("reach"):
        reach, sha, why = _phase_reach(root, args.get("phase"))
        if why:
            subj["reach"] = {"ran": False, "reason": why}
        else:
            rs = set(reach)
            subj["reach"] = {"ran": True, "record": reach[:mq.CAP], "graft_at": sha,
                             "unreached": [f for f in changed_src if f not in rs][:mq.CAP],
                             "unused_reach": [f for f in reach if f not in set(changed)][:mq.CAP],
                             "note": "unreached = the graph missed an edge OR the change grew past its cases; compare the diff's distance from graft@%s" % sha}
    if run("entity"):
        declared = None
        pj = Path(root) / ".kdbp" / "PLAN.json"
        if pj.is_file():
            try:
                plan = json.loads(pj.read_text(encoding="utf-8"))
                cur = plan.get("current_phase")
                ph = next((p for p in plan.get("phases") or [] if p.get("id") == (args.get("phase") or cur)), None)
                declared = (ph or {}).get("entities")
            except json.JSONDecodeError:
                declared = None
        idx = center.idx()
        touched = sorted({s for f in changed_src for s, _, _ in idx["file_owners"].get(f, [])})
        if declared is None:
            subj["entity"] = {"ran": False, "reason": "no PLAN.json phase with an entities list", "touched": touched}
        else:
            subj["entity"] = {"ran": True, "declared": declared, "touched": touched,
                              "undeclared_touched": sorted(set(touched) - set(declared)), "declared_untouched": sorted(set(declared) - set(touched))}
    if run("workflow_census"):
        censuses = sorted((center.dir / "workflows").glob("*.json")) if (center.dir / "workflows").is_dir() else []
        if not censuses:
            subj["workflow_census"] = {"ran": False, "reason": "no docs/site/center/workflows/*.json census on this project"}
        else:
            script = Path(root) / "scripts" / "check_workflow_drift.py"
            if not script.is_file():
                subj["workflow_census"] = {"ran": False, "reason": "census present but scripts/check_workflow_drift.py missing"}
            else:
                res = []
                for cpath in censuses[:10]:
                    rc, o, e = mq.sh([sys.executable, str(script), str(cpath), "--center", str(center.dir), "--json"], cwd=root, timeout=90)
                    try:
                        res.append({"census": cpath.name, "exit": rc, "result": json.loads(o) if o.strip() else None})
                    except json.JSONDecodeError:
                        res.append({"census": cpath.name, "exit": rc, "text": o[:800]})
                subj["workflow_census"] = {"ran": True, "results": res}
    out["not_run"] = [k for k, v in subj.items() if not v.get("ran")]
    out["note"] = "STALE ANCHOR (PENDING rows' cited files moved past their Verified sha) lives in gabe-kdbp; pricing stays judgment (review D6)"
    return out


# ── registry (appended into tools.TOOLS by tools.py) ──────────────────────────
RO = T.RO
TOOLS = [
    {"name": "find", "fn": t_find, "annotations": RO,
     "description": "Find X in the map by name or doc text: entities, endpoints, models, schemas, functions, screens, FE pieces — each hit with owner entity and file. Capped; graft_find_code's equivalent.",
     "inputSchema": T._schema({"query": {"type": "string", "description": "A name or fragment (≥ 2 chars)."},
                               "kind": {"type": "string", "enum": ["entity", "endpoint", "model", "schema", "function", "define", "fe", "screen"], "description": "Restrict to one kind."},
                               "limit": {"type": "integer", "description": "Max hits (default 20, cap 40)."}, **T.ROOT_PROP}, ["query"])},
    {"name": "outline", "fn": t_outline, "annotations": RO,
     "description": "A file's outline without reading it: definitions with span, kind, signature (graft index), returns, r/w access; owner entity, models defined/referenced, tests reaching. graft_file_api's equivalent.",
     "inputSchema": T._schema({"file": {"type": "string", "description": "Repo-relative file path."}, **T.ROOT_PROP}, ["file"])},
    {"name": "center_overview", "fn": t_center_overview, "annotations": RO,
     "description": "Orientation by entity, not directory: rank, status, counts, coverage, FE pieces per entity; arms present; census gaps. graft_repo_map's equivalent, ≤ 600 tokens.",
     "inputSchema": T._schema({**T.ROOT_PROP})},
    {"name": "blast_radius", "fn": t_blast_radius, "annotations": RO,
     "description": "What a change touches: worktree diff (or given files) → owning entities, functions, models, endpoints reached, tests reaching, FE pieces, a contained/local/cross-cutting reading (a FLOOR).",
     "inputSchema": T._schema({"files": {"type": "array", "items": {"type": "string"}, "description": "Changed files; default = worktree vs HEAD + untracked."}, **T.ROOT_PROP})},
    {"name": "map_census", "fn": t_map_census, "annotations": RO,
     "description": "Where the map is blind: unclaimed files, models and routes, unwired/ambiguous schemas — the S11/S12/S13 census blocks in one read.",
     "inputSchema": T._schema({"kind": {"type": "string", "enum": ["file", "model", "route", "schema"], "description": "One census only."}, **T.ROOT_PROP})},
    {"name": "map_diff", "fn": t_map_diff, "annotations": RO,
     "description": "How the committed map changed between two refs: per entity, endpoints/models/schemas/files added or removed; census and function deltas; says so when the map was not regenerated.",
     "inputSchema": T._schema({"base": {"type": "string", "description": "A sha/branch/tag."}, "head": {"type": "string", "description": "Default: the worktree's archmap."}, **T.ROOT_PROP}, ["base"])},
    {"name": "center_status", "fn": t_center_status, "annotations": RO,
     "description": "The command center's actionable list (scripts/center_status.py, relayed verbatim with its links and → next steps); never triggers a regen.",
     "inputSchema": T._schema({**T.ROOT_PROP})},
    {"name": "review_drift", "fn": t_review_drift, "annotations": RO,
     "description": "A review's deterministic drift subjects in one call vs a base ref: entity_shape, web_bridge, reach (vs the Reach record), entity (declared vs touched), workflow_census; NOT RUN is first-class.",
     "inputSchema": T._schema({"base": {"type": "string", "description": "The diff base (sha/branch)."}, "phase": {"type": "string", "description": "Phase id (default: PLAN.json current_phase)."},
                               "subjects": {"type": "array", "items": {"type": "string", "enum": ["entity_shape", "web_bridge", "reach", "entity", "workflow_census"]}}, **T.ROOT_PROP}, ["base"])},
]
