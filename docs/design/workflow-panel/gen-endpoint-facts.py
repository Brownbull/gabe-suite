#!/usr/bin/env python3
"""gen-endpoint-facts.py — ONE endpoint's facts, generated from the frozen example feed → `_lab-ep.js`.

The endpoint lab (endpoint-lab.html) renders the six PARTS of an API endpoint — DATA+SCHEMAS ·
FUNCTIONS · TESTS · WIDENING · SECURITY (+ identity) — for one real door. The kind-lab law: facts
are GENERATED, judgement is analysed, values are computed live. This is the fact half: nothing here
is typed by hand; every number is read out of the committed example feeds, and a fact the feed
lacks is written as null with a `why` so the page can say so in the feed's own words.

    python3 docs/design/workflow-panel/gen-endpoint-facts.py                       # POST /setup/complete
    python3 docs/design/workflow-panel/gen-endpoint-facts.py "GET /recipes/{recipe_id}"

Feeds (templates/center/shell/example/codebase-graph-station/): c4-graph.js (window.GABE_C4) ·
levels.json · workflows.js · commits.js. The station's own derivations are re-done here where the
lab must match the card (fan-in = graph in-degree · large = behind ≥ 15 or fan-in ≥ 15 · the cluster
= the URL's first segment · status codes parsed from case names `_NNN_`).
"""
from __future__ import annotations

import collections
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
EX = REPO / "templates" / "center" / "shell" / "example" / "codebase-graph-station"
OUT = HERE / "_lab-ep.js"

# the station's TRUST map — a relation is either an exact join or a kind-level floor
STRUCTURAL = {"touches", "fk", "resp", "returns", "consumes", "nests", "takes", "uses", "handler", "gated_by", "walls"}


def parse_js(path: Path, open_ch: str = "{"):
    s = path.read_text(encoding="utf-8")
    i = s.index(open_ch)
    return json.JSONDecoder().raw_decode(s, i)[0]


def load_workflows() -> list:
    """workflows.js is a JS literal with bare keys — node parses it; python cannot."""
    js = ("const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');const window={};eval(s);"
          "process.stdout.write(JSON.stringify(window.GABE_WORKFLOWS||[]));")
    r = subprocess.run(["node", "-e", js, str(EX / "workflows.js")], capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout else []


def main() -> int:
    target = sys.argv[1] if len(sys.argv) > 1 else "POST /setup/complete"
    ID = "endpoint:" + target
    c4 = parse_js(EX / "c4-graph.js")
    lv = json.loads((EX / "levels.json").read_text(encoding="utf-8"))
    commits = parse_js(EX / "commits.js", "[")
    workflows = load_workflows()

    nodes = {n["id"]: (slug, n) for slug, g in c4["l2"].items() for n in g["nodes"]}
    if ID not in nodes:
        raise SystemExit(f"{ID} is not in the feed")
    home, node = nodes[ID]
    det = node.get("det") or {}
    method, path = target.split(" ", 1)
    colors = c4.get("colors") or {}

    # ── edges touching the door (l2 intra + cross) ──────────────────────────────────────────
    outs, ins = [], []
    for slug, g in c4["l2"].items():
        for e in g.get("edges", []):
            if e.get("source") == ID:
                outs.append({"kind": e.get("kind"), "to": e.get("target"), "cross": False})
            if e.get("target") == ID:
                ins.append({"kind": e.get("kind"), "from": e.get("source"), "cross": False})
    for e in c4.get("cross_edges", []):
        if e.get("from") == ID:
            outs.append({"kind": e.get("kind"), "to": e.get("to"), "cross": True, "to_slug": e.get("to_slug")})
        if e.get("to") == ID:
            ins.append({"kind": e.get("kind"), "from": e.get("from"), "cross": True, "from_slug": e.get("from_slug"),
                        "export": e.get("export")})

    def other(nid):
        s = nodes.get(nid)
        if s:
            return {"id": nid, "label": s[1]["label"], "kind": s[1]["kind"], "entity": s[0]}
        return {"id": nid, "label": nid.split(":", 1)[-1], "kind": nid.split(":", 1)[0], "entity": None}

    def group(edges, key):
        by = collections.OrderedDict()
        for e in edges:
            g = by.setdefault(e["kind"], {"kind": e["kind"], "trust": "structural" if e["kind"] in STRUCTURAL else "inferred", "items": []})
            g["items"].append(dict(other(e[key]), **({"export": e["export"]} if e.get("export") else {})))
        return list(by.values())

    conns = {"out": group(outs, "to"), "in": group(ins, "from"), "fanin": len(ins)}

    # ── DATA: the tables (access.ops) joined to their model nodes ────────────────────────────
    models = {n["label"]: (slug, n) for slug, g in c4["l2"].items() for n in g["nodes"] if n["kind"] == "model"}
    access = node.get("access") or {}
    tables = []
    for op in access.get("ops") or []:
        m = models.get(op["model"])
        md = (m[1].get("det") if m else None) or {}
        tables.append({"table": op["table"], "model": op["model"], "rw": op["rw"], "entity": m[0] if m else None,
                       "entity_color": colors.get(m[0]) if m else None,
                       "cols": md.get("cols") or [], "fks": md.get("fks") or [], "uqs": md.get("uqs") or [],
                       "cols_more": md.get("cols_more") or 0, "file": md.get("file"), "id": m[1]["id"] if m else None})
    # both-direction tables: the same table read AND written by this door
    seen = collections.Counter(t["table"] for t in tables)
    both = sorted(t for t, n in seen.items() if n > 1)
    by_table = collections.OrderedDict()
    for t in tables:
        row = by_table.setdefault(t["table"], dict(t, rw=set()))
        row["rw"].add(t["rw"])
    tables_by_name = [dict(r, rw=("rw" if r["rw"] == {"r", "w"} else next(iter(r["rw"])))) for r in by_table.values()]

    # ── SCHEMAS: request (consumed) + response (returned), nested shapes resolved by label ───
    schemas = {n["label"]: (slug, n) for slug, g in c4["l2"].items() for n in g["nodes"] if n["kind"] == "schema"}

    def schema_rec(label, depth=0):
        s = schemas.get(label)
        if not s:
            return {"name": label, "present": False, "why": "no schema node carries this label in the feed"}
        sd = s[1].get("det") or {}
        cols = sd.get("cols") or []
        nested = []
        if depth < 1:
            for c in cols:
                base = re.sub(r"\s*\|\s*None$", "", str(c[1])).strip()
                base = re.sub(r"^(list|List|Optional)\[(.*)\]$", r"\2", base)
                if base in schemas and base != label:
                    nested.append(schema_rec(base, depth + 1))
        return {"name": label, "present": True, "id": s[1]["id"], "entity": s[0], "entity_color": colors.get(s[0]),
                "file": sd.get("file"), "flines": sd.get("flines"), "doc": sd.get("doc") or "", "cols": cols,
                "cols_more": sd.get("cols_more") or 0, "nested": nested, "usage": sd.get("usage")}

    req_names = [x["label"] for g in conns["out"] if g["kind"] in ("consumes", "touches") for x in g["items"] if x["kind"] == "schema"]
    gsig = det.get("gsig") or ""
    m_body = re.search(r"\bbody:\s*([A-Za-z_][\w\[\]|. ]*)", gsig)
    request_name = (m_body.group(1).strip() if m_body else None) or next((n for n in req_names if n != node.get("resp")), None)
    schemas_out = {"request": schema_rec(request_name) if request_name else {"name": None, "present": False, "why": "the handler signature names no body and no consumes wire reaches a schema"},
                   "response": schema_rec(node.get("resp")) if node.get("resp") else {"name": None, "present": False, "why": "the endpoint returns no schema (det.resp absent)"},
                   "touched": [x for g in conns["out"] if g["kind"] == "touches" for x in g["items"]]}

    # ── FUNCTIONS: the handler + the levels calls-walk (BFS, conf per hop) + c4's behind ─────
    FN = {f["id"]: f for f in lv["fn_nodes"]}
    detail = lv.get("detail") or {}
    _fn = node.get("fn") or (gsig.split("(")[0].split()[-1] if gsig else "")
    fn_id = _fn if "#" in str(_fn) else f"{det.get('file')}#{_fn}"
    handler = FN.get(fn_id)

    def fn_rec(fid, conf=None):
        f = FN.get(fid) or {}
        name = fid.split("#")[-1]
        d = detail.get(f"fn:{f.get('slug', '')}|{name}") or {}
        acc = f.get("access") or {}
        return {"id": fid, "name": name, "file": fid.split("#")[0], "loaded": bool(f), "conf": conf,
                "role": f.get("role"), "layer": f.get("layer"), "entity": f.get("slug"), "handler": bool(f.get("handler")),
                "lines": d.get("flines"), "async": (d.get("sig") or {}).get("async"), "returns": (d.get("sig") or {}).get("returns"),
                "god": bool((f.get("hub") or {}).get("god")), "usage": (f.get("hub") or {}).get("usage"), "d2w": f.get("d2w"),
                "commits": bool(acc.get("commits")), "ops": acc.get("ops") or [], "behind": f.get("behind")}

    out_edges = collections.defaultdict(list)
    for e in lv.get("fn_edges", []):
        out_edges[e["s"]].append(e)
    walk, seen_ids, frontier = [], {fn_id}, [fn_id]
    for _ in range(12):
        nxt = []
        for s in frontier:
            for e in out_edges.get(s, []):
                if e["t"] not in seen_ids:
                    seen_ids.add(e["t"])
                    nxt.append(dict(fn_rec(e["t"], e.get("conf")), rel=e.get("rel"), via=s.split("#")[-1]))
        if not nxt:
            break
        walk.append(nxt)
        frontier = [x["id"] for x in nxt]
    behind = node.get("behind") or {}
    functions = {"handler": fn_rec(fn_id) if handler else {"id": fn_id, "loaded": False, "why": "the handler is not a levels fn_node"},
                 "behind": {"depth": behind.get("depth"), "fns": behind.get("fns"), "names": behind.get("names") or [],
                            "names_more": behind.get("names_more") or max(0, (behind.get("fns") or 0) - len(behind.get("names") or [])),
                            "truncated": bool(behind.get("truncated"))},
                 "walk": walk, "walk_levels": [len(l) for l in walk], "walk_total": sum(len(l) for l in walk),
                 "walk_note": "the levels calls-walk (fn_edges, conf per hop) vs c4 behind.fns (graft-only hops the walk cannot see)"}

    # ── TESTS: cases · files · journeys · workflows · status codes ──────────────────────────
    cases = []
    for c in det.get("cases") or []:
        m = re.search(r"_(\d{3})_", c.get("name") or "")
        cases.append(dict(c, status=(m.group(1) if m else None)))
    by_status = collections.OrderedDict()
    for c in sorted(cases, key=lambda c: (c.get("status") or "zzz", c.get("cid") or "")):
        by_status.setdefault(c.get("status") or "no code in name", []).append(c["cid"])
    tests = {"cases": cases, "cases_more": det.get("cases_more") or 0,
             "by_state": dict(collections.Counter(c.get("state", "unknown") for c in cases)),
             "by_corpus": dict(collections.Counter(c.get("corpus", "api") for c in cases)),
             "by_status": by_status, "declared_status": det.get("status"),
             "case_files": det.get("case_files") or [],
             "journeys": det.get("test_journeys") or [], "journeys_more": det.get("test_journeys_more") or 0,
             "workflows": [dict(w, step_index=[i for i, s in enumerate(w["steps"]) if s == target]) for w in workflows if target in w["steps"]]}

    # ── WIDENING: who fetches it (fe chain via the index-triple edges) · the doors around it ─
    fe = c4.get("fe") or {}
    pieces = fe.get("pieces") or []
    pidx = {p["id"]: i for i, p in enumerate(pieces)}
    fe_edges = fe.get("edges") or []
    inbound = collections.defaultdict(list)   # target idx → [(source idx, kind)]
    for e in fe_edges:
        inbound[e[1]].append((e[0], e[2]))

    def piece_rec(i):
        p = pieces[i]
        return {k: p.get(k) for k in ("id", "kind", "home", "feClass", "hrole", "cache", "fed2w", "label", "route", "name") if k in p} | {"name": p["id"].split("#")[-1]}

    def climb(start_ids, hops=4):
        """from the fetching hook, climb the callers/renderers up to a route."""
        levels_, seen_, frontier_ = [], set(start_ids), list(start_ids)
        for _ in range(hops):
            nxt = []
            for pid in frontier_:
                for src, kind in inbound.get(pidx.get(pid, -1), []):
                    sid = pieces[src]["id"]
                    if sid not in seen_:
                        seen_.add(sid)
                        nxt.append(dict(piece_rec(src), rel=kind, to=pid.split("#")[-1]))
            if not nxt:
                break
            levels_.append(nxt)
            frontier_ = [x["id"] for x in nxt]
        return levels_

    fetchers = [x for g in conns["in"] if g["kind"] == "bridge" for x in g["items"]]
    fetch_pieces = []
    for f in fetchers:
        pid = f.get("export")
        if pid and pid in pidx:
            fetch_pieces.append(dict(piece_rec(pidx[pid]), via=f["label"]))
    chain = climb([p["id"] for p in fetch_pieces]) if fetch_pieces else []
    resp_consumers = [n["label"] for _, n in nodes.values() if n["kind"] == "endpoint" and n.get("resp") == node.get("resp") and n["id"] != ID]
    steps_around = []
    for w in tests["workflows"]:
        for i in w["step_index"]:
            steps_around.append({"workflow": w["name"], "prev": w["steps"][i - 1] if i > 0 else None, "next": w["steps"][i + 1] if i + 1 < len(w["steps"]) else None})
    widening = {"usage": det.get("usage"), "fetched_by": fetch_pieces, "fetch_wires": fetchers, "chain": chain,
                "screens": [p for l in chain for p in l if p.get("feClass") == "view"],
                "routes": [p for l in chain for p in l if p.get("kind") == "route"],
                "steps_around": steps_around, "response_consumers": resp_consumers}

    # ── SECURITY: the door's guards · the app-scope ASGI band · flag walls · status contract ──
    dep_count = collections.Counter()
    for _, n in nodes.values():
        if n["kind"] == "endpoint":
            for m in n.get("middleware") or []:
                dep_count[m["name"]] += 1
    n_endpoints = sum(1 for _, n in nodes.values() if n["kind"] == "endpoint")
    guards = [dict(m, feedwide=dep_count.get(m["name"], 0), fn_rec=(fn_rec(m["fn"]) if m.get("fn") in FN else None)) for m in node.get("middleware") or []]
    asgi = sorted([dict(n.get("det") or {}, name=n["label"], id=n["id"]) for _, n in nodes.values() if n["kind"] == "middleware"], key=lambda x: x.get("order", 0))
    walls = [dict(w, flag=n["label"], flag_id=n["id"], default=(n.get("det") or {}).get("default"), src=(n.get("det") or {}).get("src"))
             for _, n in nodes.values() if n["kind"] == "flag" for w in ((n.get("det") or {}).get("walls") or []) if w.get("endpoint") == ID]
    flags_feedwide = sum(1 for _, n in nodes.values() if n["kind"] == "flag")
    idem = next((t for t in tables if t["table"] == "idempotency_keys"), None)
    security = {"guards": guards, "gates": [g for g in guards if g.get("gate")], "asgi": asgi,
                "app_middleware": c4.get("stats", {}).get("app_middleware"), "walls": walls, "flags_feedwide": flags_feedwide,
                "status": {"declared": det.get("status"), "declared_name": det.get("status_name"), "observed": by_status},
                "idempotent": bool(idem), "idempotency_table": idem["table"] if idem else None,
                "commits": bool(access.get("commits")), "stream": bool(node.get("stream")), "exported": det.get("exported")}

    # ── identity · risk · above · git touches · feed-wide comparators ────────────────────────
    m_large = (behind.get("fns") or 0) >= 15 or conns["fanin"] >= 15
    hub = (handler or {}).get("hub") or {}
    identity = {"id": ID, "label": target, "method": method, "path": path, "kind": "endpoint", "type": "API endpoint",
                "entity": home, "entity_color": colors.get(home), "cluster": path.strip("/").split("/")[0] or "—",
                "cluster_note": "the URL's first segment (the station's backend core groups by the levels map; the lab says which)",
                "layer": "endpoints", "fanin": conns["fanin"], "file": det.get("file"), "flines": det.get("flines"),
                "status": det.get("status"), "status_name": det.get("status_name"), "exported": det.get("exported"),
                "sig": det.get("sig"), "gsig": gsig, "doc": det.get("doc") or "", "resp": node.get("resp"),
                "payload": det.get("payload"), "usage": det.get("usage"), "home_ev": node.get("home_ev"),
                "models_home": {v: (c4.get("models", {}).get("homes", {}).get(v) or {}).get(ID) for v in ("seeded", "derived", "proposed")},
                "risk": {"god": bool(hub.get("god")), "large": m_large, "behind": behind.get("fns"), "fanin": conns["fanin"],
                         "untested": (len(cases) == 0), "tests_measured": True,
                         "conflict": ("large surface" if m_large else None)},
                "above": [{"kind": "cluster", "label": path.strip("/").split("/")[0] or "—"}, {"kind": "entity", "label": home}, {"kind": "everything", "label": "everything"}]}
    touches = [c for c in commits if ID in (c.get("touched") or [])]
    _ents = lv.get("entities") or []
    ent_stats = (_ents.get(home) if isinstance(_ents, dict) else next((e for e in _ents if e.get("slug") == home or e.get("id") == home), None)) or {}
    feedwide = {"endpoints": n_endpoints, "deps": dict(dep_count.most_common(8)), "flags": flags_feedwide,
                "behind_max": max((n.get("behind") or {}).get("fns") or 0 for _, n in nodes.values() if n["kind"] == "endpoint"),
                "tables_touched_max": max(len((n.get("access") or {}).get("ops") or []) for _, n in nodes.values() if n["kind"] == "endpoint"),
                "cases_max": max(len((n.get("det") or {}).get("cases") or []) for _, n in nodes.values() if n["kind"] == "endpoint"),
                "commits_on_feed": len(commits), "entity_counts": ent_stats.get("counts")}

    # ── FIELD CONTEXT: what a value MEANS is often "compared to the other 80 doors", so the feed-wide
    #    shape of each field is generated beside it. The bar's hover cards read these (2026-09-11).
    _st_all, _st_by_m, _named = collections.Counter(), collections.defaultdict(collections.Counter), 0
    _behind, _nocase, _mismatch = [], 0, 0
    for _s, _n in nodes.values():
        if _n["kind"] != "endpoint":
            continue
        _d = _n.get("det") or {}
        _code = _d.get("status") or "none"
        _st_all[_code] += 1
        _st_by_m[_n["label"].split(" ", 1)[0]][_code] += 1
        if _d.get("status_name"):
            _named += 1
        _behind.append(((_n.get("behind") or {}).get("fns") or 0, _n["label"]))
        _cs = _d.get("cases") or []
        if not _cs:
            _nocase += 1
        else:
            _codes = {m.group(1) for c in _cs if (m := re.search(r"_(\d{3})_", c.get("name") or ""))}
            if _d.get("status") and _codes and _d["status"] not in _codes:
                _mismatch += 1
    _behind.sort(reverse=True)
    _bins = collections.Counter()
    for _f, _ in _behind:
        _bins["0" if _f == 0 else "1-4" if _f < 5 else "5-14" if _f < 15 else "15-39" if _f < 40 else "40+"] += 1
    _rank = [l for _, l in _behind].index(target) + 1 if target in [l for _, l in _behind] else None
    context = {
        "status": {"declared": dict(_st_all.most_common()), "by_method": {k: dict(v.most_common()) for k, v in sorted(_st_by_m.items())},
                   "as_constant": _named, "of": n_endpoints,
                   "cases_never_assert_declared": _mismatch, "no_cases": _nocase,
                   "peers": sorted(l for _, l in _behind if False)},
        "risk": {"rule_large": "behind >= 15 or fan-in >= 15", "rule_god": "the handler is >= 50 lines",
                 "god_lines": 50, "handler_lines": (det.get("sig") or {}).get("lines"), "cases": len(cases),
                 "god_count": sum(1 for _s, _n in nodes.values() if _n["kind"] == "endpoint" and ((_n.get("det") or {}).get("sig") or {}).get("lines", 0) >= 50),
                 "large_count": sum(1 for f, _ in _behind if f >= 15), "of": n_endpoints,
                 "behind_bins": dict(_bins), "behind_max": _behind[0][0] if _behind else 0, "behind_max_of": _behind[0][1] if _behind else None,
                 "behind_median": sorted(f for f, _ in _behind)[len(_behind) // 2] if _behind else 0,
                 "rank": _rank, "heaviest": [{"label": l, "behind": f} for f, l in _behind[:5]],
                 "no_cases": _nocase},
    }
    # the same-method peers that declare a different code — the pointer that actually changes a decision
    _mine = method
    _peer = collections.Counter()
    for _s, _n in nodes.values():
        if _n["kind"] == "endpoint" and _n["label"].startswith(_mine + " "):
            _peer[(_n.get("det") or {}).get("status") or "none"] += 1
    context["status"]["same_method"] = dict(_peer.most_common())

    head = c4.get("head")
    facts = {"head": head, "generated_from": "templates/center/shell/example/codebase-graph-station/{c4-graph.js,levels.json,workflows.js,commits.js}",
             "identity": identity, "conns": conns,
             "data": {"commits": bool(access.get("commits")), "ops": tables, "tables": tables_by_name, "both": both,
                      "reads": [t for t in tables if t["rw"] == "r"], "writes": [t for t in tables if t["rw"] == "w"],
                      "entities": sorted({t["entity"] for t in tables if t["entity"]}), "schemas": schemas_out},
             "functions": functions, "tests": tests, "widening": widening, "security": security,
             "git_touches": {"commits": touches, "why": None if touches else f"none of the feed's {len(commits)} recent commits touched this door (commits.js)"},
             "feedwide": feedwide, "context": context}
    OUT.write_text("/* GENERATED by gen-endpoint-facts.py from the frozen example feed (head " + str(head) + ") — never edit; re-run the generator. */\n"
                   "window.LABEP = " + json.dumps(facts, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)} for {target} @ {head}: ops {len(tables)} over {len(tables_by_name)} tables (r {len(facts['data']['reads'])} · w {len(facts['data']['writes'])} · both {len(both)}) · "
          f"schemas req {schemas_out['request'].get('name')} ({len(schemas_out['request'].get('cols', []))} cols, {len(schemas_out['request'].get('nested', []))} nested) "
          f"resp {schemas_out['response'].get('name')} ({len(schemas_out['response'].get('cols', []))} cols, {len(schemas_out['response'].get('nested', []))} nested) · "
          f"walk {functions['walk_levels']} vs behind {behind.get('fns')} · cases {len(cases)} by status {dict((k, len(v)) for k, v in by_status.items())} · "
          f"journeys {len(tests['journeys'])}+{tests['journeys_more']} · workflows {len(tests['workflows'])} · fetched by {len(fetch_pieces)} · chain {[len(l) for l in chain]} · "
          f"guards {len(guards)} (gates {len(security['gates'])}) · asgi {len(asgi)} · walls {len(walls)} · git touches {len(touches)} · "
          f"context: status {context['status']['declared']} · {method} peers {context['status']['same_method']} · behind rank {context['risk']['rank']}/{n_endpoints}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
