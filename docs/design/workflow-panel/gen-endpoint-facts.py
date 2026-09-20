#!/usr/bin/env python3
"""gen-endpoint-facts.py — ONE endpoint's facts, generated from the frozen example feed → `_lab-ep.js`.

The endpoint lab (endpoint-lab.html) renders the six PARTS of an API endpoint — DATA+SCHEMAS ·
FUNCTIONS · TESTS · WIDENING · SECURITY (+ identity) — for one real door. The kind-lab law: facts
are GENERATED, judgement is analysed, values are computed live. This is the fact half: nothing here
is typed by hand; every number is read out of the committed example feeds, and a fact the feed
lacks is written as null with a `why` so the page can say so in the feed's own words.

    python3 docs/design/workflow-panel/gen-endpoint-facts.py                       # POST /setup/complete
    python3 docs/design/workflow-panel/gen-endpoint-facts.py "GET /recipes/{recipe_id}"
    python3 docs/design/workflow-panel/gen-endpoint-facts.py --forms <arms-on forms.json> [--archmap <archmap.json>] [--out <file>]
        --forms    an arms-on build of the same twin (its sibling archmap.json is read for the map's per-function facts)
        --out      write the facts somewhere else — a measuring loop over every endpoint must never touch the lab's own file

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
sys.path.insert(0, str(HERE))
from _ep_pieces import common_block, proof_rank  # noqa: E402  (leftovers piece 7 — the shared piece tally)
from _ep_joins import _short_detail, client_joins, field_rules, inside_the_calls  # noqa: E402  (pieces 6 and 8 — the joins of feed blocks the lab did not read)
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


PHASES = ("middleware", "security", "dependency", "body-parse", "validation", "handler", "uncaught")   # _a3_forms.PHASES + the body-parse split


def forms_slice(fj: dict, ID: str, ep: dict) -> dict:
    """The door's forms RESOLVED for a renderer: every chain ref replaced by the record it names, every effect step by its
    table and op, every test ref by the case it names. Nothing invented — a ref the feed cannot resolve is kept as the
    bare id with `unresolved: True`. Arms that are off leave their keys absent (D12), and the slice says which arms were on."""
    steps = fj.get("steps") or {}
    test_cases = fj.get("test_cases") or {}
    fe = fj.get("frontend") or {}
    produced = ep.get("produced") or []
    returns = ep.get("returns") or []
    frame = ep.get("framework_exits") or []
    rows = {}
    for r in produced:
        rows[r["id"]] = dict(r, row="produced")
    for r in frame:
        rows[r["id"]] = dict(r, row="framework")
    for r in returns:
        rows[r["id"]] = dict(r, row="return")
    pre = {g["id"]: g for g in (ep.get("preconditions") or [])}
    branches = {b["id"]: b for b in (ep.get("branches") or [])}
    switches = {w["id"]: w for w in (ep.get("switches") or [])}
    catches = {c["id"]: c for c in ((ep.get("failure") or {}).get("catches") or [])}
    responses = ep.get("responses") or {}

    def case_rec(t):
        c = test_cases.get(t.get("case")) or {}
        # leftovers piece 5 — proof you can open: the call this join rests on (matched by line), what it asserted and what it sent
        calls = [k for k in (c.get("calls") or []) if k.get("endpoint") == ID]
        call = next((k for k in calls if k.get("line") == t.get("line")), None)
        return {"case": t.get("case"), "conf": t.get("conf"), "line": t.get("line"),
                "name": c.get("name"), "file": c.get("file"), "state": c.get("state"), "corpus": c.get("corpus"),
                "role": (call or {}).get("role") or ("service-raises" if "raise" in str(t.get("conf") or "") else None),
                "asserts": (call or {}).get("asserts"), "sends": (call or {}).get("sends")}

    def exit_rec(ref):
        r = rows.get(ref)
        if not r:
            return {"id": ref, "unresolved": True}
        kind = "success" if r["row"] == "return" else ("framework" if r["row"] == "framework" else
                ("uncaught" if r.get("phase") == "uncaught" else ("validation" if r.get("phase") == "validation" else "refusal")))
        return {"id": ref, "kind": kind, "row": r["row"], "status": r.get("status"), "phase": r.get("phase") or ("handler" if r["row"] == "return" else None),
                "at": r.get("at"), "detail": _short_detail(r.get("detail")), "code": r.get("code"), "via": r.get("via"),
                "pred": r.get("pred"), "state": r.get("state"), "form": r.get("form"), "split": r.get("split"),
                "reason": r.get("reason"), "tests": [case_rec(t) for t in (r.get("tests") or [])],
                "response": responses.get(ref),
                # leftovers piece 3 — what each ending carries: the rules that refuse the body (the short arm's 422 cases, as the feed wrote them)
                "cases": [{"id": c.get("id"), "loc": c.get("loc"), "param": c.get("param"), "type": c.get("type"), "rule": c.get("rule"), "at": c.get("at"), "schema": c.get("schema")}
                          for c in (r.get("cases") or []) if isinstance(c, dict)] or None}

    def switch_rec(ref):
        w = switches.get(ref)
        if not w:
            return {"id": ref, "unresolved": True}
        o = {"id": ref, "kind": w.get("kind"), "changes_exit": w.get("changes_exit"), "scope": w.get("scope"), "via": w.get("via")}
        if w.get("kind") == "binding":
            o.update({"port": w.get("port"), "fn": w.get("fn"), "anchor": w.get("anchor"),
                      "branches": [{"impl": b.get("impl"), "pred": b.get("pred"), "binding": b.get("binding"), "ends": b.get("ends")} for b in (w.get("branches") or [])],
                      "proves": w.get("proves")})
        elif w.get("kind") == "value":
            o.update({"anchor": w.get("anchor"), "chain": w.get("chain"), "branches": w.get("branches"), "depth": w.get("depth"),
                      "settings": sorted({b.get("setting") for b in (w.get("branches") or []) if b.get("setting")})})
        elif w.get("kind") == "flag":
            o.update({"settings": w.get("settings"), "expr": w.get("expr"), "when": w.get("when"), "refs": w.get("refs"), "settings_class": w.get("settings_class")})
        return o

    _pre_pred = {g_.get("exit"): g_.get("pred") for g_ in (ep.get("preconditions") or []) if g_.get("exit")}   # a guard's condition, joined to the ending it produces
    def step_rec(c, i):
        k = c.get("kind"); o = {"i": i, "kind": k, "phase": c.get("phase"), "hit": c.get("hit"), "at": c.get("at"), "ref": c.get("ref")}
        if k == "step":
            o["label"] = c.get("call"); o["sub"] = "middleware" if c.get("phase") == "middleware" else c.get("phase")
        elif k == "gate":
            x = exit_rec(c["ref"]); o["status"] = x.get("status"); o["label"] = (str(x.get("status") or "?") + " " + (x.get("detail") or x.get("code") or x.get("reason") or "")).strip()
            o["sub"] = x.get("via") or x.get("pred"); o["split"] = c.get("split"); o["cond"] = c.get("cond"); o["exit_kind"] = x.get("kind")
            o["pred"] = x.get("pred") or _pre_pred.get(c.get("ref")); o["via"] = x.get("via")   # the condition in the author's words — on a PASSED check too (the feed fills `cond` only on the one that fired)
        elif k == "switch":
            w = switch_rec(c["ref"]); o["label"] = w.get("kind")
            st = w.get("settings"); o["sub"] = w.get("port") or (", ".join(sorted(st)) if isinstance(st, dict) else ", ".join(st) if isinstance(st, list) else None) or w.get("via")
            o["switch_kind"] = w.get("kind")
        elif k == "branch":
            b = branches.get(c.get("ref")) or {}; o["label"] = b.get("pred") or "fall-through"; o["sub"] = "branch"
        elif k in ("call", "collapsed"):
            fn = c.get("fn") or ""; o["label"] = c.get("call") or fn.split("::")[-1]; o["fn"] = fn; o["reason"] = c.get("reason"); o["sub"] = fn.split("::")[0]
        elif k == "catch":
            ct = catches.get(c.get("ref")) or next((v for v in catches.values() if v.get("at") == c.get("at")), {})
            o["label"] = c.get("cls") or ", ".join(ct.get("types") or []) or "catch"; o["sub"] = c.get("op") or ct.get("outcome")
            o["answers"] = ct.get("answers"); o["fn"] = ct.get("fn"); o["ref"] = ct.get("id"); o["catch_kind"] = c.get("op") or ct.get("outcome")
        elif k == "exit":
            x = exit_rec(c["ref"]); o["label"] = str(x.get("status") or "?"); o["sub"] = x.get("kind"); o["status"] = x.get("status"); o["exit_kind"] = x.get("kind")
        return o

    def eff_rec(p):
        e = p.get("effects") or {}
        buckets = {b: set(e.get(b) or []) for b in ("committed", "maybe_committed", "rolled_back", "uncommitted")}
        out = []
        for st in (e.get("steps") or []):
            sid = st.get("step") if isinstance(st, dict) else st
            rec = steps.get(sid) or {}
            bucket = next((b for b, ids in buckets.items() if sid in ids), None)
            out.append({"step": sid, "table": rec.get("table"), "op": rec.get("op"), "model": rec.get("model"), "fn": rec.get("fn"),
                        "at": rec.get("at"), "cond": rec.get("cond"), "race": rec.get("race"),
                        "dependency": bool(st.get("dependency")) if isinstance(st, dict) else False,
                        "via": st.get("via") if isinstance(st, dict) else None, "bucket": bucket})
        return {"dependency": e.get("dependency"), "steps": out, "may_follow_commits": e.get("may_follow_commits"),
                "n": {b: len(ids) for b, ids in buckets.items()},
                "tables": sorted({o["table"] for o in out if o.get("table")}),
                "writes": sorted({o["table"] for o in out if o.get("table") and o.get("op") in ("add", "update", "delete", "insert", "upsert", "merge", "bulk_insert", "execute", "write")})}

    def drawn_name(p, x):
        tok = (p.get("names") or {}).get("token"); det = _short_detail((p.get("names") or {}).get("detail"))
        if x.get("kind") == "success":
            return {"fall-through": "first run", "REPLAY": "replay", "completed": "already done"}.get(tok, "success")
        if x.get("kind") == "uncaught":
            return "uncaught"
        if x.get("kind") == "framework":
            return (x.get("reason") or x.get("code") or "body") + " (framework)"
        if x.get("kind") == "validation":
            return "validation"
        pred = x.get("pred") or ""
        if x.get("status") == 429:
            return "rate limit " + ("(sensitive)" if "_sensitive" in pred else "(global)" if "_global" in pred else "")
        return (det or x.get("via") or str(x.get("status"))).strip()

    paths = []
    for p in (ep.get("paths") or []):
        x = exit_rec((p.get("exit") or {}).get("id"))
        chain = [step_rec(c, i) for i, c in enumerate(p.get("chain") or [])]
        names = dict(p.get("names") or {})
        names["drawn"] = drawn_name(p, x); names["detail"] = _short_detail(names.get("detail"))
        names["phase_status"] = f"{p.get('phase')} · {p.get('status')}"
        paths.append({"id": p["id"], "status": p.get("status"), "kind": x.get("kind"), "phase": p.get("phase"), "state": p.get("state"),
                      "names": names, "exit": x, "chain": chain, "effects": eff_rec(p),
                      "switches": [switch_rec(w) for w in (p.get("switches") or [])],
                      "tests": [case_rec(t) for t in (p.get("tests") or [])],
                      "partial": p.get("partial"), "proven_by": p.get("proven_by"), "anywhere": p.get("anywhere"),
                      "n": {"steps": len(chain), "gates": sum(1 for c in chain if c["kind"] == "gate"), "catches": sum(1 for c in chain if c["kind"] == "catch"),
                            "passed": sum(1 for c in chain if c["kind"] == "gate" and c.get("hit") is False), "fired": sum(1 for c in chain if c["kind"] == "gate" and c.get("hit") is True),
                            "branches": sum(1 for c in chain if c["kind"] == "branch"), "calls": sum(1 for c in chain if c["kind"] in ("call", "collapsed"))}})
    # exits in request order: every produced / framework / return row, with the paths that end there
    by_exit = {}
    for p in paths:
        by_exit.setdefault(p["exit"]["id"], []).append(p["id"])
    exits = []
    for rid in list(rows):
        if rows[rid]["row"] == "return" and rows[rid].get("status") is None:
            continue   # a callee's own return arm — carried in `branches` / `returns`, never an exit of the door
        x = exit_rec(rid); x["paths"] = by_exit.get(rid, [])
        exits.append(x)
    exits.sort(key=lambda x: (PHASES.index(x["phase"]) if x.get("phase") in PHASES else len(PHASES), x.get("status") or 0))
    stage_of = {}
    for x in exits:
        stage_of.setdefault(x.get("phase"), []).append(x["id"])
    fe_pieces = fe.get("pieces") or {}
    hook = next((v | {"piece": k} for k, v in fe_pieces.items() if v.get("form") == "hook" and any(c.get("endpoint") == ID for c in (v.get("calls") or []))), None)
    reason_sites = [s for s in ((fe.get("reasons") or {}).get("sites") or []) if ID in (s.get("endpoints") or [])]
    fe_findings = [f for f in ((fj.get("arm_findings") or {}).get("frontend") or []) if f.get("endpoint") == ID]
    # guards · screens · readers are joined in _ep_joins.client_joins — by the feed's own links, never by a name typed here (leftovers piece 10)
    frontend = {"hook": hook, "reason_sites": reason_sites, "findings": fe_findings, "guard": None, "guards": [], "screens": {},
                "client": fe.get("client"), "present": bool(fe)}
    _succ = sorted((p for p in paths if p["kind"] == "success"), key=lambda p: (-p["n"]["passed"], p["id"]))
    _tie = [p for p in _succ if p["n"]["passed"] == _succ[0]["n"]["passed"]] if _succ else []
    _rule = "the success ending that passes the most checks, and none when two tie; how often a route is really taken cannot be read from code"
    through = (None if not _succ else
               {"id": None, "name": None, "tie": [{"id": p["id"], "name": p["names"]["drawn"], "passed": p["n"]["passed"]} for p in _tie], "passed": _succ[0]["n"]["passed"], "checks": _succ[0]["n"]["gates"],
                "others": [{"id": p["id"], "name": p["names"]["drawn"], "passed": p["n"]["passed"]} for p in _succ if p not in _tie], "rule": _rule} if len(_tie) > 1 else
               {"id": _succ[0]["id"], "name": _succ[0]["names"]["drawn"], "tie": [], "passed": _succ[0]["n"]["passed"], "checks": _succ[0]["n"]["gates"],
                "others": [{"id": p["id"], "name": p["names"]["drawn"], "passed": p["n"]["passed"]} for p in _succ[1:]], "rule": _rule})
    return {"through": through, "paths": paths, "exits": exits, "stages": [{"phase": ph, "exits": stage_of.get(ph, [])} for ph in PHASES],
            "preconditions": [dict(g, exit_rec=exit_rec(g.get("exit"))) for g in (ep.get("preconditions") or [])],
            "branches": list(branches.values()), "switches": [switch_rec(i) for i in switches],
            "collapsed": ep.get("collapsed") or [], "returns": returns,
            "repeat": ep.get("repeat"), "auth": ep.get("auth"), "rate": ep.get("rate"), "responses": responses,
            "failure": ep.get("failure"), "findings": ep.get("findings") or [], "arm_findings": ep.get("arm_findings") or {},
            "declared": ep.get("declared"), "framework_exits": frame, "tests": ep.get("tests"), "slots": ep.get("slots"),
            "frontend": frontend, "phases": list(PHASES),
            "counts": {"paths": len(paths), "exits": len(exits), "produced": len(produced), "returns": len(returns), "framework": len(frame),
                       "switches": len(switches), "preconditions": len(pre), "catches": len(catches), "branches": len(branches),
                       "by_kind": dict(collections.Counter(p["kind"] for p in paths)),
                       "by_status": {str(k): v for k, v in sorted(collections.Counter(p["status"] for p in paths).items(), key=lambda kv: (kv[0] is None, kv[0]))},
                       "steps_max": max((p["n"]["steps"] for p in paths), default=0),
                       "cases": sum(len(x.get("cases") or []) for x in exits),
                       "cases_by_type": dict(collections.Counter(c.get("type") for x in exits for c in (x.get("cases") or []))),
                       "exits_with_headers": sum(1 for x in exits if ((x.get("response") or {}).get("headers")))}}


def main() -> int:
    argv = list(sys.argv[1:]); forms_path = None
    if "--forms" in argv:
        i = argv.index("--forms"); forms_path = Path(argv[i + 1]).expanduser(); del argv[i:i + 2]
    out_path = OUT
    if "--out" in argv:      # a measuring loop writes each endpoint's facts beside the lab's own file, never over it
        i = argv.index("--out"); out_path = Path(argv[i + 1]).expanduser(); del argv[i:i + 2]
    archmap_path = None
    if "--archmap" in argv:
        i = argv.index("--archmap"); archmap_path = Path(argv[i + 1]).expanduser(); del argv[i:i + 2]
    target = argv[0] if argv else "POST /setup/complete"
    ID = "endpoint:" + target
    c4 = parse_js(EX / "c4-graph.js")
    lv = json.loads((EX / "levels.json").read_text(encoding="utf-8"))
    commits = parse_js(EX / "commits.js", "[")
    workflows = load_workflows()

    # leftovers piece 6 — the map's own facts per function (lines · returns · calls nothing else · doc) live in archmap.json, beside the forms feed
    _ap = archmap_path or ((forms_path.parent / "archmap.json") if forms_path else (EX / "archmap.json"))
    insight, insight_state = {}, {"state": "not_emitted", "why": "no archmap.json beside the feed — the map's per-function facts were not read"}
    if _ap.is_file():
        try:
            _am = json.loads(_ap.read_text(encoding="utf-8"))
            if _am.get("head") == c4.get("head"):
                insight = _am.get("function_insight") or {}
                insight_state = {"state": "present" if insight else "absent", "why": None if insight else "archmap.json carries no function_insight", "rows": len(insight)}
            else:
                insight_state = {"state": "stale", "why": f"archmap.json is at {_am.get('head')}, the feed at {c4.get('head')} — not joined"}
        except Exception as _exc:  # noqa: BLE001
            insight_state = {"state": "unreadable", "why": f"archmap.json unreadable ({_exc.__class__.__name__})"}

    def insight_rec(key):
        """`file::fn` → what the map read of that function; None when the map holds no row for it."""
        r = insight.get(key)
        if not r:
            return None
        ops = (r.get("access") or {}).get("ops") or []
        return {"lines": r.get("lines"), "returns": r.get("returns"), "async": r.get("async"), "calls_nothing_else": bool(r.get("base")),
                "doc": None if r.get("doc") in (None, "", "—") else r.get("doc"), "tables": len(ops), "used_by_api_files": r.get("api"), "used_by_other_files": r.get("internal")}

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
                "commits": bool(acc.get("commits")), "ops": acc.get("ops") or [], "behind": f.get("behind"),
                "insight": insight_rec(fid.replace("#", "::"))}

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
    _is_http = lambda n: n["kind"] == "endpoint" and bool(re.match(r"^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) ", str(n.get("label") or "")))   # BOOT lifespan · TASK roots are trace roots drawn as endpoint nodes — not endpoints
    n_endpoints = sum(1 for _, n in nodes.values() if _is_http(n))
    n_roots = sum(1 for _, n in nodes.values() if n["kind"] == "endpoint") - n_endpoints
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
                "commits_on_feed": len(commits), "entity_counts": ent_stats.get("counts"),
                "roots_not_counted": n_roots,
                "async": {"n": sum(1 for _, n in nodes.values() if _is_http(n) and ((n.get("det") or {}).get("sig") or {}).get("async")), "of": n_endpoints,
                          "here": bool((det.get("sig") or {}).get("async"))},
                "screens": {"fetched_by": len(fetch_pieces), "with_none": n_endpoints - len({e.get("to") for e in c4.get("cross_edges", []) if e.get("kind") == "bridge"}), "of": n_endpoints,
                            "unmatched": (c4.get("stats", {}).get("web") or {}).get("unmatched"), "dynamic": (c4.get("stats", {}).get("web") or {}).get("dynamic"),
                            "floor": "a floor: a fetch that names no endpoint, or builds its path at run time, is drawn to none"}}

    # ── FIELD CONTEXT: what a value MEANS is often "compared to the other 80 doors", so the feed-wide
    #    shape of each field is generated beside it. The bar's hover cards read these (2026-09-11).
    _st_all, _st_by_m, _named = collections.Counter(), collections.defaultdict(collections.Counter), 0
    _behind, _nocase, _mismatch = [], 0, 0
    for _s, _n in nodes.values():
        if not _is_http(_n):
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

    # the ELEMENT FORMS block for this door, raw (amendment 1 Slice 1) — no panel reads it yet; the state words are the
    # suite's (mapquery.forms_block): not_emitted = no file · absent = the pass ran and said why · present
    _fp = forms_path or (EX / "forms.json")
    if not _fp.is_file():
        forms_block = {"state": "not_emitted", "reason": "no forms.json in the example feed — run regen-example.sh", "endpoint": None}
    else:
        try:
            _fj = json.loads(_fp.read_text(encoding="utf-8"))
            if _fj.get("present"):
                _fe = (_fj.get("endpoints") or {}).get(ID)
                forms_block = {"state": "present", "reason": None if _fe else f"{ID} has no form in forms.json", "endpoint": _fe,
                               "head": _fj.get("head"), "version": _fj.get("version"),
                               "source": {"path": str(_fp.relative_to(REPO)) if _fp.is_relative_to(REPO) else str(_fp).replace(str(Path.home()), "~"),
                                          "arms_on": sorted(a for a, v in (_fj.get("arms") or {}).items() if isinstance(v, dict) and v.get("present")),
                                          "note": "an arms-on build of the same twin (scripts/forms-dryrun.sh writes one to ~/.cache/gabe-map-baselines/.check/<target>/forms.json)" if forms_path else "the example feed as committed (arms off by default)"}}
                if _fe:
                    forms_block.update(forms_slice(_fj, ID, _fe))
                # leftovers piece 4 — ONE table set for every layout: the map's access edges and the routes' own steps, with how each table was found
                _eff = collections.OrderedDict()
                for _p in forms_block.get("paths") or []:
                    for _s in ((_p.get("effects") or {}).get("steps") or []):
                        if _s.get("table"):
                            _e = _eff.setdefault(_s["table"], {"ops": set(), "model": _s.get("model"), "gate_only": True})
                            _e["ops"].add(_s.get("op")); _e["gate_only"] = _e["gate_only"] and bool(_s.get("dependency"))
                for _t in tables_by_name:
                    _t["found"] = "both" if _t["table"] in _eff else "map edge"
                for _tb, _e in _eff.items():
                    if any(_t["table"] == _tb for _t in tables_by_name):
                        continue
                    _m = models.get(_e["model"]); _md = (_m[1].get("det") if _m else None) or {}
                    _w = bool(_e["ops"] - {"read"}); _r = "read" in _e["ops"]
                    tables_by_name.append({"table": _tb, "model": _e["model"], "rw": "rw" if (_w and _r) else ("w" if _w else "r"), "entity": _m[0] if _m else None,
                                           "entity_color": colors.get(_m[0]) if _m else None, "cols": _md.get("cols") or [], "fks": _md.get("fks") or [], "uqs": _md.get("uqs") or [],
                                           "cols_more": _md.get("cols_more") or 0, "file": _md.get("file"), "id": _m[1]["id"] if _m else None,
                                           "found": "route effects", "found_why": ("only the login check touches it, before the handler runs — the map's access edge starts at the handler" if _e["gate_only"]
                                                                                 else "a step of a route touches it; the map's access edge does not carry it")})
                found_counts = dict(collections.Counter(_t["found"] for _t in tables_by_name))
                # the races, by WHO owns the insert: the endpoint's own steps, or the gate's (the login check runs on almost every endpoint)
                _races = {}
                for _p in forms_block.get("paths") or []:
                    for _s in ((_p.get("effects") or {}).get("steps") or []):
                        if _s.get("race"):
                            _races[(_s.get("table"), json.dumps(_s["race"].get("keys")))] = ("gate" if _s.get("dependency") else "own", _s["race"].get("state"))
                _rc = {"own": {}, "gate": {}}
                for _who, _st in _races.values():
                    _rc[_who][_st] = _rc[_who].get(_st, 0) + 1
                forms_block["counts"]["races"] = _rc
                forms_block["counts"]["tables_found"] = found_counts
                # leftovers piece 5 — ONE test roster for this endpoint, each case stamped with WHY it came here
                _tc = _fj.get("test_cases") or {}
                _ORDER = ["act", "arranged", "helper-arranged"]
                _role, _calls = {}, collections.defaultdict(list)
                for _cid, _c in _tc.items():
                    for _k in _c.get("calls") or []:
                        if _k.get("endpoint") != ID:
                            continue
                        _r = "act" if _k.get("role") == "act" else ("helper-arranged" if _k.get("helper") else "arranged")
                        _calls[_cid].append(_k)
                        if _cid not in _role or _ORDER.index(_r) < _ORDER.index(_role[_cid]):
                            _role[_cid] = _r
                _proves = collections.defaultdict(list)
                for _x in forms_block.get("exits") or []:
                    for _j in _x.get("tests") or []:
                        _proves[_j["case"]].append({"exit": _x["id"], "status": _x.get("status"), "conf": _j.get("conf")})
                _named = {c["cid"] for c in cases}
                _ids = [c["cid"] for c in cases] + sorted(k for k in _proves if k not in _named)
                _roster = []
                for _cid in _ids:
                    _c = _tc.get(_cid) or {}
                    _r = _role.get(_cid) or ("service-raises" if any("raise" in str(p.get("conf") or "") for p in _proves.get(_cid, [])) else "named-only")
                    _as = collections.OrderedDict()
                    for _k in _calls.get(_cid, []):
                        if _k.get("role") == "act":
                            for _ak, _av in (_k.get("asserts") or {}).items():
                                _as.setdefault(_ak, [])
                                _as[_ak] += [v for v in (_av if isinstance(_av, list) else [_av]) if v not in _as[_ak]]
                    _roster.append({"cid": _cid, "name": _c.get("name"), "file": _c.get("file"), "line": _c.get("line"), "state": _c.get("state"), "corpus": _c.get("corpus"),
                                    "role": _r, "calls_here": len(_calls.get(_cid, [])), "asserts": dict(_as) or None, "proves": _proves.get(_cid) or [],
                                    "in_map_list": _cid in _named})
                tests["roster"] = _roster
                tests["roles"] = dict(collections.Counter(r["role"] for r in _roster)) | {"helper-arranged": sum(1 for v in _role.values() if v == "helper-arranged")}
                tests["roles_note"] = "act = the test calls this endpoint to test it · arranged = it calls it to set something else up · service-raises = it proves an ending from the service side, without calling the endpoint · helper-arranged = it reaches it only through a shared helper (counted, never listed)"
                # the values tests give the settings this endpoint's switches read — 'exercised somewhere', never 'this arm proven here'
                _keys = []
                for _w in forms_block.get("switches") or []:
                    _keys += list((_w.get("settings") or [])) if not isinstance(_w.get("settings"), dict) else list(_w["settings"].keys())
                    for _b in _w.get("branches") or []:      # a binding names its setting inside the condition that picks the implementation
                        _keys += re.findall(r"settings\.(\w+)", str(_b.get("pred") or ""))
                _st = []
                for _k in dict.fromkeys(_keys):
                    _s = ((_fj.get("settings") or {}).get("setting:" + _k) or {}).get("tests") or {}
                    _st.append({"setting": _k, "default_runs": _s.get("default_runs"), "values": _s.get("values") or [], "sets": _s.get("sets") or []})
                forms_block["settings_tests"] = _st
                inside_the_calls(_fj, ID, forms_block, functions, security, gsig, len(_fj.get("endpoints") or {}), insight_rec, insight_state)
                # leftovers piece 7 — how common each piece is: this app's tally, the committed cross-app digest, and this endpoint's place in the proof
                _dg = HERE / "pieces-digest.json"
                _digest = json.loads(_dg.read_text(encoding="utf-8")) if _dg.is_file() else None
                _app = next((a for a, v in ((_digest or {}).get("apps") or {}).items() if v.get("head") == _fj.get("head")), None)
                feedwide["pieces"] = dict(common_block(_fj, ID, _digest, _app), app=_app)
                feedwide["proof"] = proof_rank(_fj.get("endpoints") or {}, ID)
                feedwide["forms_endpoints"] = len(_fj.get("endpoints") or {})
                client_joins(_fj, ID, forms_block, [p["id"] for p in fetch_pieces] + [p["id"] for lvl in chain for p in lvl])
                # leftovers piece 8 — the rule on every field and column, and the line every block opens at
                forms_block["rules"] = field_rules(_fj, ID, identity, schemas_out, tables_by_name, functions, forms_block)
                _mw = _fj.get("middleware") or {}
                for _m in security["asgi"]:
                    _o = (_mw.get(_m.get("id")) or {}).get("order") or {}
                    _m["runs"] = _o.get("runs"); _m["registered"] = _o.get("registered"); _m["of"] = _o.get("of")
                if security["asgi"] and all(_m.get("runs") is not None for _m in security["asgi"]):
                    security["asgi"].sort(key=lambda _m: _m["runs"]); security["asgi_order"] = "runs"
                else:
                    security["asgi_order"] = "registered"; security["asgi_order_why"] = "the feed carries no run order for the app-wide steps (the kinds arm is off) — this is the order the code registers them in, which Starlette runs in reverse"
            else:
                forms_block = {"state": "absent", "reason": _fj.get("reason") or "forms.json holds no forms", "endpoint": None}
        except Exception as _exc:  # noqa: BLE001
            forms_block = {"state": "unreadable", "reason": f"forms.json unreadable ({_exc.__class__.__name__})", "endpoint": None}

    head = c4.get("head")
    facts = {"head": head, "generated_from": "templates/center/shell/example/codebase-graph-station/{c4-graph.js,levels.json,workflows.js,commits.js,forms.json}",
             "forms": forms_block,
             "identity": identity, "conns": conns,
             "data": {"commits": bool(access.get("commits")), "ops": tables, "tables": tables_by_name, "both": both,
                      "reads": [t for t in tables if t["rw"] == "r"], "writes": [t for t in tables if t["rw"] == "w"],
                      "entities": sorted({t["entity"] for t in tables if t["entity"]}), "schemas": schemas_out},
             "functions": functions, "tests": tests, "widening": widening, "security": security,
             "git_touches": {"commits": touches, "why": None if touches else f"none of the feed's {len(commits)} recent commits touched this door (commits.js)"},
             "feedwide": feedwide, "context": context}
    out_path.write_text("/* GENERATED by gen-endpoint-facts.py from the frozen example feed (head " + str(head) + ") — never edit; re-run the generator. */\n"
                   "window.LABEP = " + json.dumps(facts, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"wrote {out_path.relative_to(REPO) if out_path.is_relative_to(REPO) else out_path} for {target} @ {head}: ops {len(tables)} over {len(tables_by_name)} tables (r {len(facts['data']['reads'])} · w {len(facts['data']['writes'])} · both {len(both)}) · "
          f"schemas req {schemas_out['request'].get('name')} ({len(schemas_out['request'].get('cols', []))} cols, {len(schemas_out['request'].get('nested', []))} nested) "
          f"resp {schemas_out['response'].get('name')} ({len(schemas_out['response'].get('cols', []))} cols, {len(schemas_out['response'].get('nested', []))} nested) · "
          f"walk {functions['walk_levels']} vs behind {behind.get('fns')} · cases {len(cases)} by status {dict((k, len(v)) for k, v in by_status.items())} · "
          f"journeys {len(tests['journeys'])}+{tests['journeys_more']} · workflows {len(tests['workflows'])} · fetched by {len(fetch_pieces)} · chain {[len(l) for l in chain]} · "
          f"guards {len(guards)} (gates {len(security['gates'])}) · asgi {len(asgi)} · walls {len(walls)} · git touches {len(touches)} · "
          f"context: status {context['status']['declared']} · {method} peers {context['status']['same_method']} · behind rank {context['risk']['rank']}/{n_endpoints}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
