"""_ae_universe.py — the all-endpoints page's ONE-ENDPOINT section (D-036): what the Gabe Universe card shows, the block
marks, and the gaps between the universe card and the code map. Imported by gen-all-endpoints.py; nothing here writes.

THE UNIVERSE COLUMN. The station's endpoint card is `C.endpoint` in templates/center/shell/gabe-universe.html plus the
two sections every card gets (the risk flags and Above), under the panel head. Each section is READ from the station's
source here — its icon and its title are regex-lifted, never typed — and its VALUE is computed from the lab's facts the
way the station computes it (gen-endpoint-facts.py already re-does the station's derivations on the same example feed).
Three values the lab's facts do not carry are read from the station's own feeds beside them: the entity-model row under
the settled model (c4 `models`), the cluster Above names (levels.json use-cases, the station's boot core) and the
entity's label (c4 `models.naming`). A section the station would not draw for this endpoint is not a row here: it is
named in `silent`, so the column says what the station leaves out without drawing it.

THE MARKS. A block paired to a lab PART wears that part's icon and colour, read from the lab's own registry
(`window.PANELS` in _lab-ep-panels.js, run under node with the station's tokens) — never typed. The command panel, the
running header and the blocks with no page yet have no registry row: their marks are the agent's pick, in the words file,
and the page marks them so.

THE GAPS. An inventory attribute the code map holds something for on this endpoint (a value that is not absent, unknown,
zero or empty) and that no station row drawn for it shows. Which attributes a station row shows is an AUTHORED proposal
(all-endpoints.words.json `universe.rows[*].attrs`), every id checked against the ruled tree and inventory-endpoint.md.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

HERE = Path(os.environ.get("ALLEP_WP") or Path(__file__).resolve().parent)   # a mutant copy elsewhere still reads the real bench
REPO = HERE.parents[2]
STATION_HTML = REPO / "templates" / "center" / "shell" / "gabe-universe.html"
EX = REPO / "templates" / "center" / "shell" / "example" / "codebase-graph-station"
INVENTORY = REPO / "docs" / "design" / "design-context" / "inventory-endpoint.md"

# the station's card, in the order it draws: the head, `C.endpoint`'s fifteen sections, then the flags and Above that every
# card gets. Each row names the source pattern its icon and title are lifted from (group 1 = icon, group 2 = title).
ROWS = [
    ("HEAD", None),
    ("USAGE", r'sechd\("(\w+)","(Usage)"'),
    ("GUARDS", r'sechd\("(\w+)","(Guards)"'),
    ("DELIVERY", r'sechd\("(\w+)","(Delivery)"\)'),
    ("EVIDENCE", r'kv\("(\w+)","(evidence)"'),
    ("MODEL ROW", r'kv\("(\w+)","(model)", v\+": claim'),
    ("ACCESSES", r'sechd\("(\w+)","(Accesses)"'),
    ("PAYLOAD", r'sechd\("(\w+)","(Payload)", p\.n'),
    ("CONNECTIONS", r'conns\("(\w+)","(Connections)"'),
    ("CODE BEHIND", r'function behindTree[\s\S]*?sechd\("(\w+)","(Code behind)"'),
    ("TESTS", r'tabbed\("(\w+)","(Tests)"'),
    ("JOURNEYS", r'sechd\("(\w+)","(Journeys)"'),
    ("IDENTITY", r'sechd\("(\w+)","(Identity)"'),
    ("SIGNATURE", r'sechd\("(\w+)","(Signature)"'),
    ("DOCSTRING", r'function docSec[\s\S]*?sechd\("(\w+)",label\|\|"(Docstring)"'),
    ("SOURCE", r'function fileRowSec[\s\S]*?sechd\("(\w+)","(Source)"'),
    ("RISK", None),
    ("ABOVE", r'function aboveSec[\s\S]*?sechd\("(\w+)","(Above)"'),
]
# the flag rows of the station's flagsSec: (key, icon, label) — lifted by these patterns
FLAGS = [("god", r'flagrow god"\}, icoEl\("(\w+)"\), E\("span",\{class:"flbl"\},"([^"]+)"'),
         ("untested", r'flagrow warn"\}, icoEl\("(\w+)"\), E\("span",\{class:"flbl"\},"(unguarded[^"]*)"'),
         ("conflict", r'flagrow warn"\}, icoEl\("(\w+)"\), E\("span",\{class:"flbl"\},"(conflict · )"')]


def die(msg: str) -> None:
    raise SystemExit("gen-all-endpoints (universe): " + msg)


def station_spec() -> dict:
    """{row: {icon, title}} lifted from the station's own source; a pattern that no longer matches stops the build."""
    src = STATION_HTML.read_text(encoding="utf-8")
    body = src[src.index("var C={"):]
    ep = body[:body.index('"function":function(n)')]
    for sec in ("usage(", "guardsSec(n)", "streamSec(n)", "homeEvRow(n), modelRow(n)", "accessSec(n)", "payloadSec(det)", "liveConns(n)",
                "behindTree(n)", "testsSec(det)", "journeysSection(", "identSec(n)", "sigSec(det)", "docSec(det)", "fileRowSec(n)"):
        if sec not in ep:
            die(f"the station's endpoint card no longer calls {sec} — re-read C.endpoint in {STATION_HTML.name}")
    if "flagsSec(n); if(_fl) out.push(_fl); out.push(aboveSec(n))" not in src:
        die("the station no longer appends the flags and Above to every card")
    out = {}
    for row, rx in ROWS:
        if rx is None:
            continue
        m = re.search(rx, src)
        if not m:
            die(f"row {row}: the station's source no longer matches {rx}")
        out[row] = {"icon": m.group(1), "title": m.group(2)}
    flags = {}
    for key, rx in FLAGS:
        m = re.search(rx, src)
        if not m:
            die(f"flag {key}: the station's source no longer matches {rx}")
        flags[key] = {"icon": m.group(1), "label": m.group(2)}
    out["RISK"] = {"icon": flags["untested"]["icon"], "title": None, "flags": flags}
    # the connection groups' words and trust, as liveConns + relLabel write them
    m = re.search(r'function relLabel\(rel, dir\)\{ var O=\{([^}]*)\},[^\n]*\n\s*I=\{([^}]*)\};', src)
    t = re.search(r'g\.rel==="(\w+)"\|\|g\.rel==="(\w+)"\?"structural":"inferred"', src)
    if not m or not t:
        die("the station's relation words (relLabel) or its connection trust (liveConns) no longer match")
    pairs = lambda x: dict(re.findall(r'(\w+):"([^"]*)"', x))
    out["_rel"] = {"out": pairs(m.group(1)), "in": pairs(m.group(2)), "structural": [t.group(1), t.group(2)]}
    # the station builds every map node with `god:false` and never raises it for an endpoint (only a function's hub does), so
    # the god-object flag cannot show on an endpoint card — the lab's `risk.god` (a handler of 50 lines or more) is not the station's
    out["_godOff"] = bool(re.search(r'god:false, method:\(kind==="endpoint"\)', src)) and not re.search(r'\bm\.god\s*=', src)
    out["HEAD"] = {"icon": "endpoint", "title": None}          # the panel head draws the node's kind glyph (_dispGlyph → the kind)
    # what the card draws INSIDE its rows, lifted the same way: how many chips a list shows before its "+N more" (and that
    # word), the Delivery row's own note, the word after a journey's component count, the state every case must hold for the
    # Tests count to turn green, and the frontend kinds the station renames
    lift = {"behindCap": r'function behindTree[\s\S]*?expander\(rows, \{cap:(\d+), maxDepth:\d+\}\)',
            "connCap": r'expander\(_connRows\(items, kind\), \{cap:(\d+), maxDepth:\d+\}\)',
            "more": r'"\+"\+\(rows\.length-shown\)\+" (\w+)"',
            "streamNote": r'function streamSec[\s\S]*?"streams to the client ", E\("span",\{[^}]*\}, "([^"]+)"\)',
            "comp": r'\(j\.comp\|\|0\)\+" (\w+)"',
            "okState": r'var okAll=cases\.length>0 && cases\.every\(function\(c\)\{return c\.state==="(\w+)";\}\)',
            "feKind": r'var FE_KIND=(\{[^}]*\})',
            "bootTier": r'if\(window\.__uniSetTier\)\{ try\{ __uniSetTier\((\d+)\); \}catch\(e\)\{\} \} if\(window\.__uniScaleGuard\)',
            "showFns": r'var CFG=\{[^\n]*?showFns:"(\w+)"'}
    card = {}
    for k, rx in lift.items():
        m = re.search(rx, src)
        if not m:
            die(f"card detail {k}: the station's source no longer matches {rx}")
        card[k] = m.group(1)
    for k in ("behindCap", "connCap", "bootTier"):
        card[k] = int(card[k])
    card["feKind"] = json.loads(card["feKind"])
    # the tier the station boots on (its presets, in order): the card this page reproduces is the one drawn there
    tiers = re.findall(r'\{ name:"(\w+)",\s*koff:\[([^\]]*)\]', src)
    if len(tiers) <= card["bootTier"]:
        die("the station's tier presets no longer match")
    card["tiers"] = [{"name": n, "fnOff": '"function"' in k} for n, k in tiers]
    card["tier"] = card["tiers"][card["bootTier"]]["name"]
    if card["tiers"][card["bootTier"]]["fnOff"] != (card["showFns"] == "off"):
        die("the station's boot tier and its Functions default disagree — re-read the boot sequence")
    out["_card"] = card
    return out


def harvest(needed_icons: set, colour_refs: set, bench: Path = HERE) -> dict:
    """Run the lab's registry under node with the station's tokens: the six parts' icon · word · colour, every station icon
    the page draws (as the station draws it), and the token colours the marks name (e.g. KINDCOL.type)."""
    js = r"""
const vm=require('vm'),fs=require('fs'),path=require('path');const H=process.argv[1];
const win={};win.window=win;const ctx=vm.createContext(win);
for(const f of ['_station.js','_lab-ep.js','_lab-ep-panels.js']) vm.runInContext(fs.readFileSync(path.join(H,f),'utf8'),ctx,{filename:f});
const S=win.STATION,P=win.PANELS,need=JSON.parse(process.argv[2]),cols=JSON.parse(process.argv[3]);
const parts={};Object.keys(P).forEach(k=>{parts[k]={icon:P[k].icon,word:P[k].word,col:P[k].col};if(need.indexOf(P[k].icon)<0)need.push(P[k].icon);});
const icons={},missing=[];need.forEach(n=>{const s=S.icon(n,16,'currentColor');if(!/<(path|rect|circle|ellipse|polygon|polyline|line)\b/.test(s))missing.push(n);icons[n]=s;});
const col={};cols.forEach(r=>{const [a,b]=r.split('.');col[r]=(S[a]||{})[b]||null;});
const pico=Object.keys(S.P).concat(Object.keys(S.GLYPH));
process.stdout.write(JSON.stringify({parts,icons,missing,col,pico}));"""
    need = sorted(needed_icons)
    r = subprocess.run(["node", "-e", js, str(bench), json.dumps(need), json.dumps(sorted(colour_refs))], capture_output=True, text=True)
    if r.returncode != 0:
        die("the lab's registry could not be read under node: " + r.stderr.strip()[-400:])
    out = json.loads(r.stdout)
    if out["missing"]:
        die(f"icons the station does not draw: {out['missing']}")
    bad = [k for k, v in out["col"].items() if not v]
    if bad:
        die(f"mark colours that name no station token: {bad}")
    return out


def inventory_ids() -> set:
    """Every attribute row of inventory-endpoint.md, as the id the ruled tree gives it (its gloss in brackets dropped, lowercase,
    every run of non-alphanumerics → '-')."""
    ids = set()
    for line in INVENTORY.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\|\s*([^|]+?)\s*\|", line)
        if not m or m.group(1) in ("attribute", "---") or set(m.group(1)) <= {"-"}:
            continue
        name = re.sub(r"\*|`|\([^)]*\)", "", m.group(1)).strip()      # the tree's id drops a row's (parenthesised gloss)
        ids.add(re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"))
    return ids


def station_feeds() -> dict:
    """The three readings the lab's facts lack, from the station's own feeds."""
    s = (EX / "c4-graph.js").read_text(encoding="utf-8")
    G = json.JSONDecoder().raw_decode(s, s.index("{"))[0]
    LV = json.loads((EX / "levels.json").read_text(encoding="utf-8"))
    M, LM = G.get("models") or {}, LV.get("models") or {}
    return {"models": M, "lmodels": LM, "pieces": LV.get("pieces") or {}, "naming": M.get("naming") or {}, "graph": G, "_links": None}


def _station_links(feeds: dict, spec: dict) -> tuple:
    """The station's boot-time wires, built the way gabe-universe.html builds `nodes`/`links` (the l2 pieces deduped first
    home wins, then the frontend pieces; the l2 edges then the cross edges; a bridge re-targeted onto the export that fetched
    or the piece that absorbs its screen; only wires whose both ends are drawn). Built once, reused for every endpoint."""
    if feeds.get("_links"):
        return feeds["_links"]
    G, FK = feeds["graph"], spec["_card"]["feKind"]
    nid, order = {}, []
    for ent, g in (G.get("l2") or {}).items():
        for p in g.get("nodes") or []:
            if p["id"] not in nid:
                nid[p["id"]] = {"kind": p["kind"], "label": p.get("label") or p.get("slug") or p["id"]}
                order.append(p["id"])
    links = []
    for ent, g in (G.get("l2") or {}).items():
        for e in g.get("edges") or []:
            links.append([e.get("source"), e.get("target"), e.get("kind") or "calls", None])
    for e in G.get("cross_edges") or []:
        links.append([e.get("from"), e.get("to"), e.get("kind") or "fk", e.get("export")])
    fe = G.get("fe") if ((G.get("fe") or {}).get("pieces")) else None
    if fe:
        for p in fe["pieces"]:
            if p["id"] in nid:
                continue
            nid[p["id"]] = {"kind": FK.get(p["kind"], p["kind"]), "label": p.get("label") or p.get("name"), "screen": p.get("screen")}
            order.append(p["id"])
        ab = {}
        for i in order:                                          # the station walks `nodes` in order; a later piece wins a screen
            n = nid[i]
            if n.get("screen") and n["screen"] in nid and nid[n["screen"]]["kind"] == "web":
                ab[n["screen"]] = i
        for l in links:
            if l[3] and l[3] in nid:
                l[0] = l[3]
            elif l[0] in ab:
                l[0] = ab[l[0]]
            if l[1] in ab:
                l[1] = ab[l[1]]
        for w in ab:
            nid.pop(w, None)
    links = [l for l in links if l[0] in nid and l[1] in nid and l[0] != l[1]]
    feeds["_links"] = (nid, links)
    return feeds["_links"]


def station_conns(ID: str, feeds: dict, spec: dict, say: dict) -> list:
    """liveConns for one endpoint: its wires grouped by relation · direction · the other end's KIND, in the order the station
    meets them (outgoing groups first), each [label, count, trust, the members its list shows, how many more, rel, dir, every
    member]. The last three are for this generator's own reading (the gaps) and never drawn."""
    nid, links = _station_links(feeds, spec)
    rel, cap = spec["_rel"], spec["_card"]["connCap"]
    out = []
    for d in ("out", "in"):
        by = {}
        for s_, t_, r_, _ in links:
            if (s_ if d == "out" else t_) != ID:
                continue
            o = nid[t_ if d == "out" else s_]
            g = by.setdefault(f"{r_}|{d}|{o['kind']}", {"rel": r_, "items": []})
            g["items"].append(o["label"])
        for g in by.values():
            lab = (rel[d].get(g["rel"]) or (g["rel"] + ("" if d == "out" else " (in)")))
            tr = say["structural"] if g["rel"] in rel["structural"] else say["inferred"]
            it = g["items"]
            out.append([lab, len(it), tr, it[:cap], max(0, len(it) - cap), g["rel"], d, it])
    return out


def pascal(run: str) -> str:
    """window.__uniCaseRun(run, "pascal") — split on space _ - / &, capitalise each word, join."""
    ws = [w for w in re.split(r"[\s_\-/&]+", str(run or "")) if w]
    return "".join(w[:1].upper() + w[1:] for w in ws) if ws else run


def ent_label(slug: str, feeds: dict) -> str:
    """window.__uniEntLabel for a backend entity under the station's defaults: the domain strategy names it by its key, and the
    frontend/backend convention's backend form renders it (case → PascalCase)."""
    fe = (feeds["naming"].get("fe") or {})
    form = ((fe.get("forms") or {}).get(fe.get("convention") or "case") or {}).get("be") or "{name}"
    name = "unclaimed" if slug == "__unclaimed__" else str(slug or "")
    return pascal(name) if form == "{name|pascal}" else form.replace("{name}", name)


def _top(m: dict):
    ks = sorted((m or {}).keys(), key=lambda k: -m[k])
    if not ks:
        return None
    tot = sum(m.values())
    hs = "unclaimed" if ks[0] == "__unclaimed__" else re.sub(r"^fe·", "", ks[0])
    return f"{hs} {round(100 * m[ks[0]] / tot)}% of {tot}"   # Math.round: a .5 share is rare here; the probe reads the station


def universe(L: dict, spec: dict, feeds: dict, U: dict) -> dict:
    """The station card's rows for one endpoint, in the station's order, each {row, icon, title, count, value, items}; and
    `silent`, the station's sections it does not draw for this endpoint. U = the words file's `universe` block."""
    I, sec, fx, tests = L["identity"], L["security"], L["functions"], L["tests"]
    say, rows, silent = U["say"], [], []
    ID = I["id"]
    view = "seeded"                                          # the station is SETTLED on seeded (CLAUDE.md, entity models 2026-09-07)
    H = dict((feeds["models"].get("homes") or {}).get(view) or {}); H.update((feeds["lmodels"].get("homes") or {}).get(view) or {})
    AB = set((feeds["models"].get("abstain") or {}).get(view) or []) | set((feeds["lmodels"].get("abstain") or {}).get(view) or [])
    HD = set((feeds["models"].get("held") or {}).get(view) or []) | set((feeds["lmodels"].get("held") or {}).get(view) or [])
    claim = I["entity"]
    ent = H.get(ID) or claim
    mark = "moved" if H.get(ID) else "abstain" if ID in AB else "held" if ID in HD else None

    def add(row, count=None, value="", items=None):
        rows.append({"row": row, "icon": spec[row]["icon"], "title": spec[row]["title"], "count": count, "value": value, "items": items or []})

    add("HEAD", None, f"{I['label']} · {I['type']} · {ent}")
    u = I.get("usage")
    n_use = ((u.get("api") or 0) + (u.get("internal") or 0)) if u else (I.get("fanin") or 0)
    add("USAGE", n_use, (f"{u.get('api') or 0} {say['api']} · {u.get('internal') or 0} {say['internal']}") if u
        else f"{I.get('fanin') or 0} {say['depend']}")
    g = sec.get("guards") or []
    if g:
        add("GUARDS", len(g), " · ".join(x["name"] + (f" ({say['gate']})" if x.get("gate") else "") for x in g),
            [[x["name"], x.get("via"), bool(x.get("gate"))] for x in g])
    else:
        silent.append("GUARDS")
    if sec.get("stream"):
        add("DELIVERY", None, say["stream"])
        rows[-1]["note"] = spec["_card"]["streamNote"]
    else:
        silent.append("DELIVERY")
    ev = I.get("home_ev") or {}
    if ev.get("verdict") and ev["verdict"] != "agree":
        by = say["by"].get(ev.get("by")) or ev.get("by") or say["by"]["file"]
        dest = ""
        if ev.get("to"):
            hs = "unclaimed" if ev["to"] == "__unclaimed__" else re.sub(r"^fe·", "", ev["to"])
            dest = say["feArea"].replace("{area}", hs) if ev.get("to_kind") == "fe-area" else hs
        more = (ev.get("others") or 0) - 1
        if ev["verdict"] == "move":
            word = say["move"] + " → " + dest + ((" · " + say["alsoUsedOne" if more == 1 else "alsoUsedMany"].replace("{n}", str(more))) if more > 0 else "")
        elif ev["verdict"] == "shared":
            word = say["shared"].replace("{n}", str(ev.get("others") or 0))
        else:
            word = say["stay"] + ((" " + say["over"] + " " + dest) if dest else "")
        us, ds = _top(ev.get("users")), _top(ev.get("data"))
        home = "unclaimed" if claim == "__unclaimed__" else claim
        add("EVIDENCE", None, f"{say['home']} {home} {say['byWord']} {by} · " + (f"{say['usersSay']} {us}" if us else say["usersAbstain"])
            + " · " + (f"{say['dataSays']} {ds}" if ds else (say["dataAbstains"] + (" — " + ev["data_note"] if ev.get("data_note") else "")))
            + " → " + word + " — " + say["evOnly"])
    else:
        silent.append("EVIDENCE")
    if mark and claim:
        add("MODEL ROW", None, f"{view}: " + (say["moved"].replace("{claim}", claim).replace("{home}", ent) if mark == "moved"
                                             else say["abstain"].replace("{claim}", claim) if mark == "abstain"
                                             else say["held"].replace("{claim}", claim)))
    else:
        silent.append("MODEL ROW")
    ops = (L["data"].get("ops") or [])
    if ops:
        nr = sum(1 for o in ops if o.get("rw") != "w")
        add("ACCESSES", len(ops), f"{nr} {say['reads']} · {len(ops) - nr} {say['writes']}", [[o.get("rw"), o.get("model"), o.get("table")] for o in ops])
    else:
        silent.append("ACCESSES")
    p = I.get("payload")
    if p:
        add("PAYLOAD", p["n"], f"{p['n']} {say['fieldOne' if p['n'] == 1 else 'fieldMany']} · → {p['schema']} {say['response']}")
    else:
        silent.append("PAYLOAD")
    card = spec["_card"]
    # the station's own grouping (liveConns keys a group by relation, direction AND the other end's kind — `touches` a model
    # and `touches` a schema are two groups), read off its own feed, never the lab's relation-only grouping
    cg = station_conns(ID, feeds, spec, say)
    tot = sum(x[1] for x in cg)
    # liveConns always shows its total, a 0 included (showCount)
    add("CONNECTIONS", tot, " · ".join(f"{g[0]} {g[1]}" for g in cg) or say["noEdges"], [g[:5] for g in cg])
    drawn = {"members": sorted({m for g in cg for m in g[7]}), "walls": sorted({m for g in cg if g[5] == "walls" and g[6] == "in" for m in g[7]})}
    b = fx.get("behind") or {}
    if b.get("fns"):
        # behindTree lists the callee NAMES the feed carries, its first `cap` as chips and the rest behind "+N more"; the
        # count the feed holds past its names list (names_more) is drawn nowhere on the card, so it is not drawn here
        nm = list(b.get("names") or [])
        add("CODE BEHIND", b["fns"], f"{say['reach']} {b.get('depth')} · {b['fns']} {say['behind']}", nm[:card["behindCap"]])
        rows[-1]["more"] = max(0, len(nm) - card["behindCap"])
    else:
        silent.append("CODE BEHIND")
    byc, fil = {}, {}
    for c in tests.get("cases") or []:
        byc.setdefault(c.get("corpus") or "api", []).append(c)
    for f in tests.get("case_files") or []:
        fil.setdefault(f.get("corpus") or "api", []).append(f)
    corp = list(dict.fromkeys(list(byc) + list(fil)))
    tg = [[k, len(byc.get(k) or []) or len(fil.get(k) or [])] for k in corp]
    tsum = sum(x[1] for x in tg)
    cs = tests.get("cases") or []
    add("TESTS", tsum if tg else None, " · ".join(f"{k} {n}" for k, n in tg) if tg else say["noCases"],
        [[c["cid"], c.get("state") or "unknown"] for c in cs])
    rows[-1]["ok"] = bool(cs) and all(c.get("state") == card["okState"] for c in cs)   # the station's green count (okAll)
    js_ = tests.get("journeys") or []
    if js_:
        mo = tests.get("journeys_more") or 0
        add("JOURNEYS", f"{len(js_)}+{mo}" if mo else len(js_), " · ".join(j["cid"] for j in js_[:3]) + (" …" if len(js_) > 3 else ""),
            [[j["cid"], j.get("corpus"), j.get("comp") or 0, list(j.get("entities") or [])] for j in js_])
    else:
        silent.append("JOURNEYS")
    fi = I.get("fanin") or 0
    add("IDENTITY", None, f"{say['entity']} {ent} · {say['layer']} {I.get('layer')} · {say['fanin']} {fi} " + (say["caller"] if fi == 1 else say["callers"]) + " " + say["indegree"])
    sg = I.get("sig") or {}
    if I.get("gsig") or I.get("sig"):
        body = ((say["async"] + " · ") if sg.get("async") else "") + f"{sg.get('lines')} {say['lines']} · → {sg.get('returns') or '—'}" if sg.get("lines") is not None else ""
        add("SIGNATURE", None, body, [I.get("gsig") or ""])
    else:
        silent.append("SIGNATURE")
    if I.get("doc"):
        add("DOCSTRING", None, I["doc"])
    else:
        silent.append("DOCSTRING")
    if I.get("file"):
        add("SOURCE", None, f"{I['file']}" + (f":{I['flines']}" if I.get("flines") else "") + (f" · {say['status']} {I['status']}" if I.get("status") else ""))
    else:
        silent.append("SOURCE")
    rk, fl = I.get("risk") or {}, spec["RISK"]["flags"]
    flags = []
    if rk.get("god") and not spec["_godOff"]:
        flags.append(["god", fl["god"]["icon"], fl["god"]["label"]])
    # the station's test floor (_testFloor): the cases drawn, the capped overflow, and the case counts file coverage names —
    # the lab's `risk.untested` counts named cases only, so a web file that covers the endpoint is read here the station's way
    floor = len(tests.get("cases") or []) + (tests.get("cases_more") or 0) + sum(
        int(m.group(1)) for f in (tests.get("case_files") or []) for m in [re.search(r"(\d+)\s*case", f.get("name") or "")] if m)
    if floor == 0:
        flags.append(["untested", fl["untested"]["icon"], fl["untested"]["label"]])
    if rk.get("conflict"):
        flags.append(["conflict", fl["conflict"]["icon"], fl["conflict"]["label"] + rk["conflict"]])
    if flags:
        rows.append({"row": "RISK", "icon": flags[0][1], "title": None, "count": None, "value": " · ".join(f[2] for f in flags), "items": flags})
    else:
        silent.append("RISK")
    uc = ((feeds["pieces"].get(claim) or {}).get("usecases") or {})
    sub = next((gp for gp, v in uc.items() if I["label"] in ((v or {}).get("cls") or []) or I["label"] in ((v or {}).get("eps") or [])), "other")
    add("ABOVE", None, f"{say['cluster']} · {sub} · {say['entity']} · {ent_label(ent, feeds)} · {say['everything']}", [sub, ent_label(ent, feeds)])
    return {"rows": rows, "silent": silent, "_drawn": dict(drawn, sig=I.get("gsig") or "")}


LAB_MAP_JS = HERE / "_lab-ep-map.js"
LAB_HTML = HERE / "endpoint-lab.html"
LAB_NAV_WORDS = HERE / "map-nav.words.json"


def lab_marks() -> dict:
    """The marks the LAB's section map gives a block no part answers (_lab-ep-map.js blockMark, D-035) — read from the lab's
    source, never typed: per join kind the glyph (its markup from the table it is drawn from), the colour token and the
    lab's word for it. {act kind: {icon, svg, col, word}}; the key "*" is the mark every other block wears."""
    js, html = LAB_MAP_JS.read_text(encoding="utf-8"), LAB_HTML.read_text(encoding="utf-8")
    face = (json.loads(LAB_NAV_WORDS.read_text(encoding="utf-8")).get("face") or {})
    fn = re.search(r"function blockMark\(b\)\{([\s\S]*?)\n  \}", js) or re.search(r"function blockMark\(b\)\{([\s\S]*?\}); \}", js)
    if not fn:
        die("the lab's section map no longer has blockMark() — re-read _lab-ep-map.js")
    body = fn.group(1)
    one = r'return \{ kind: "(\w+)",(?: part: "\w+",)? col: "([^"]+)", svg: (?:LI \? LI\("(\w+)"|gly\("(\w+)")[^}]*?word: FW\("(\w+)", "([^"]*)"\) \}'
    tables = {"LI": (html, r"var LABICO = \{", r"function labIco\(n, size, col\)\{ return '<svg([^']*)'"),
              "gly": (js, r"var MAPICO = \{", r"function gly\(n, size, col\)\{ return '<svg([^']*)'")}

    def glyph(src_key: str, name: str) -> str:
        src, start, wrap = tables[src_key]
        a = re.search(start, src)
        m = a and re.search(r"(?:^|[\s,{])" + re.escape(name) + r"""\s*:\s*'([^']*)'""", src[a.end():])
        w = re.search(wrap, src)
        if not m or not w:
            die(f"the lab's glyph {name!r} could not be read from its table")
        sw = re.search(r'stroke-width="([\d.]+)"', src[w.end():w.end() + 200])
        return ('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="' + (sw.group(1) if sw else "1.8")
                + '" stroke-linecap="round" stroke-linejoin="round">' + m.group(1) + "</svg>")
    out = {}
    for m in re.finditer(r'if \(a\.kind === "(\w+)"\) ' + one, body):
        act, _, col, li, gl, wk, wd = m.groups()
        out[act] = {"icon": "lab:" + (li or gl), "svg": glyph("LI" if li else "gly", li or gl), "col": col, "word": face.get(wk) or wd}
    last = re.search(one + r"\s*$", body.strip() + " ")
    if not last or last.group(1) != "none":
        die("the lab's blockMark() no longer ends on its no-page mark")
    _, col, li, gl, wk, wd = last.groups()
    out["*"] = {"icon": "lab:" + (li or gl), "svg": glyph("LI" if li else "gly", li or gl), "col": col, "word": face.get(wk) or wd}
    if not re.search(r'if \(a\.kind === "part" && PN\[a\.part\]\) return', body):
        die("the lab's blockMark() no longer marks a paired block with its part")
    return out


def marks(blocks: list, parts: dict, W: dict, lab: dict) -> dict:
    """Each block's mark: its part's icon and colour where the tree's join pairs it to a lab part; else THE LAB SECTION MAP'S
    mark for it (D-036: the table aligns with the lab) — the command panel's glyph for Endings, the running header's for a
    block read across every part, the one no-page mark for the rest. Those are my picks in the lab too, so they stay dashed
    here. The Shared group keeps its own hue (--sh, D-034) and takes an icon."""
    M = W["marks"]
    out = {}
    for b in blocks:
        sk = b["surface"]
        if sk in parts:
            out[b["key"]] = {"icon": parts[sk]["icon"], "col": parts[sk]["col"], "from": "part", "part": parts[sk]["word"], "surface": sk}
            continue
        m = lab.get(b["act"]) or lab["*"]
        out[b["key"]] = {"icon": m["icon"], "col": m["col"], "from": "lab", "part": m["word"], "surface": sk}
    out["_shared"] = {"icon": M["shared"]["icon"], "col": None, "from": "pick", "part": None, "surface": None}
    return out


def mark_refs(W: dict) -> tuple:
    return {W["marks"]["shared"]["icon"]}, set()


IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def read_here(row: dict, uni: dict) -> dict:
    """The attributes a station row shows on SOME endpoints only, read per endpoint from what the card draws for it:
    request-shape is shown when the card names the request schema (a Connections chip or the signature); a switch or an own
    guard is shown when a flag the card draws as `walled by` is a name its condition reads. {attr: [shown, of, names]}."""
    dr, d, out = uni["_drawn"], row["d"], {}
    if d.get("request"):
        nm = d["request"][0]
        hit = nm in dr["members"] or re.search(r"\b" + re.escape(nm) + r"\b", dr["sig"])
        out["request-shape"] = [1 if hit else 0, 1, [nm] if hit else []]
    walls = set(dr["walls"])
    for attr, key, text in (("switches", "switches", lambda x: " ".join(str(v) for v in x if v)),
                            ("own-guards", "guards", lambda x: str(x[1] or ""))):
        lst = d.get(key) or {"items": [], "more": 0}
        names = [n for x in lst["items"] for n in sorted(walls & set(IDENT.findall(text(x))))]
        hit = sum(1 for x in lst["items"] if walls & set(IDENT.findall(text(x))))
        out[attr] = [hit, len(lst["items"]) + (lst.get("more") or 0), sorted(set(names))]
    return out


def gaps(carried: set, uni: dict, U: dict, here: dict) -> tuple:
    """(gaps, partly): the attributes the code map holds something for here that no drawn station row shows, and those a row
    shows only part of on this endpoint ([attr, shown, of, names]) — both sorted by the tree's order later."""
    shown = {a for r in uni["rows"] for a in (U["rows"].get(r["row"]) or {}).get("attrs") or []}
    full, part = [], []
    for a in sorted(carried - shown):
        h = here.get(a)
        if h and h[1] and h[0] >= h[1]:
            continue                                                # all of it is on the card here
        if h and h[0]:
            part.append([a] + h)
            continue
        full.append(a)
    return full, part


def _has(x) -> bool:
    """A value the code map HOLDS something for: not absent or unknown, not zero, not an empty list, not none."""
    if x is None or x in ("absent", "unknown", "none", ""):
        return False
    if isinstance(x, bool):
        return x
    if isinstance(x, (int, float)):
        return x > 0
    if isinstance(x, dict):
        if "items" in x and "more" in x:
            return bool(x["items"])
        return any(_has(v) for v in x.values())
    if isinstance(x, (list, tuple)):
        return any(_has(v) for v in x)
    return True


def carried(row: dict, cols: list, CM: dict) -> dict:
    """{attr: [the right-column pairs that hold it]} for one row — the head pairs, every column, every detail pair."""
    out = {}
    def put(attrs, key):
        for a in attrs:
            out.setdefault(a, []).append(key)
    head = {"method": row["m"] + " " + row["p"], "handler": row.get("fn"), "entity": row.get("ent"), "segment": row.get("seg"), "declared": row.get("declared")}
    for k, spec in CM["head"].items():
        if _has(head.get(k)):
            put(spec["attrs"], "h:" + k)
    for c in cols:
        v, k = row["v"][c["id"]], row["k"][c["id"]]
        has = (_has(v) and _has(k)) if c["kind"] not in ("ratio", "spine", "stack", "dots", "cat") else (
            v[1] > 0 if c["kind"] == "ratio" else _has(v) if c["kind"] in ("spine", "dots", "cat") else
            any(n for f, n in v.items() if f != "none") if c["id"] == "fate" else _has(k)) if v not in ("absent", "unknown") else False
        if has:
            put([c["attr"]], "c:" + c["id"])
    for k, spec in CM["details"].items():
        x = row["d"].get(k)
        if k == "behind":
            x = (x or [None])[0]
        elif k == "proof":
            x = (x or {}).get("produced")
        elif k == "fates":                     # a path list whose every fate is "no own write" holds nothing about the writes
            x = [f for f in (x or {}).get("items") or [] if f[2] != "none"]
        if _has(x):
            put(spec["attrs"], "d:" + k)
    return out


def as_station_draws(rows: list, pico: set) -> None:
    """The station's card draws a row's icon with pico(n) = P[n] || GLYPH[n] — a name found only in its pill set (ICO) draws an
    EMPTY glyph there (the conflict flag's "burst"). The universe column shows what the station draws, so such an icon is None."""
    for r in rows:
        if r.get("icon") and r["icon"] not in pico and r["row"] != "HEAD":
            r["icon"] = None
        for f in (r["items"] if r["row"] == "RISK" else []):
            if f[1] not in pico:
                f[1] = None
