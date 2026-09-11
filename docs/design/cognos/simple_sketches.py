"""simple_sketches.py — the BRIDGE's twelve drawings, simple and big, from the accepted letters only — and now
EVERY glyph carries the station's hover card (operator 2026-09-10: "hovering over the items shows these mini
containers with additional information, instead of explaining that much").

Drawing law: viewBox ≥ 440 wide · stroke 2 · shapes ≥ 18 px · currentColor ink · entity colours from c4.colors ·
words on the picture only as numerals, status codes and entity names (C: the rest lives on hover). Encoding
INHERITED from the station's journey matrix, never hand-written: the R / W / RW store chips (.jdrw-* :919), the
OPERATION badge (.jdop-* :951-953, _OPC :5108) and the cell popover's shape (_jdCellPop :5108-5122):
header · kind · entity · operation · here · the structure's fields · where it lives in the station.
Numbers are the bench's (POST /setup/complete @ 8356f531), read from bench-data.json (computed from the feed).
"""
import json as _json, pathlib as _pl, re as _re, html as _html
BENCH = _json.load(open(_pl.Path(__file__).resolve().parent / "bench-data.json", encoding="utf-8"))
OPC = {"read": "#22c55e", "write": "#f97316", "call": "#3b82f6", "pure": "#8794ab", "gate": "#eab308", "model": "#12b886", "schema": "#f59f00", "boot": "#8a8f98"}
RWC = {"r": "#22c55e", "w": "#f97316", "rw": "#eab308"}
HEREC = {"r": "#22c55e", "w": "#f97316", "rw": "#a855f7"}
ENT = {"auth": "#5a53a8", "settings": "#8e4585", "allergen": "#3f6d4c", "pantry": "#b45309", "legal-consent": "#0f766e", "fe·auth": "#5a53a8"}
RED = "#e5484d"      # the station's ACCESS-write red
GREEN = "#2e9e6b"    # tests / proven
AMBER = "#c8871b"    # never measured
ACC = "var(--accent,#4f46e5)"
EP, SC, FE, WF = BENCH["endpoint"], BENCH["schemas"], BENCH["fe"], BENCH["workflow"]
MONO = 'font-family="ui-monospace,monospace"'

# ── the card (the station's popover, as data) ─────────────────────────────────────────────────────────────
def card(h, hc, sub, rows, fields=None, foot=""):
    return _html.escape(_json.dumps({"h": h, "hc": hc, "sub": sub, "rows": rows, "fields": fields or [], "foot": foot}, ensure_ascii=False), quote=True)
def G(c, inner): return '<g data-card="%s">%s</g>' % (c, inner)
def station(id_): return "in the station: " + id_

def C(kind, key=None, i=None):
    """every card the twelve drawings use, from the bench data"""
    e = EP
    if kind == "door":
        return card(e["label"], ENT["auth"], "endpoint · " + e["entity"],
                    [["operation", "writes", OPC["write"]], ["status", e["status"] + " on success", GREEN], ["handler", e["handler"] + " · " + str(e["sig"].get("lines", "?")) + " lines" + (" · async" if e["sig"].get("async") else ""), "currentColor"],
                     ["file", e["file"] + " · " + str(e["flines"]) + " lines", "currentColor"], ["proven by", "%d api cases" % len(e["cases"]), GREEN]], None, station(e["id"]))
    if kind == "op":
        return card("writes", OPC["write"], "the door's operation — the matrix's OPERATION badge",
                    [["why", "POST · 11 tables written · DB commit", "currentColor"], ["feed-wide", "43 of 81 doors write", "currentColor"]])
    if kind == "ground":
        ts = [t for t in BENCH["tables"] if t["entity"] == key]
        return card(key, ENT.get(key, "#9ab"), "entity" + (" · the door's own" if key == "auth" else " · another entity") + " · %d table%s touched" % (len(ts), "" if len(ts) == 1 else "s"),
                    [["reads", "%d" % sum(1 for t in ts if "r" in t["rw"]), HEREC["r"]], ["writes", "%d" % sum(1 for t in ts if "w" in t["rw"]), HEREC["w"]]],
                    [[t["table"], t["rw"].upper()] for t in ts], "in the station: entity " + key)
    if kind == "table":
        t = key; here = {"r": "reads this table (input)", "w": "writes this table (output)", "rw": "reads + writes this table"}[t["rw"]]
        return card(t["model"], ENT.get(t["entity"], "#9ab"), "model · a table · " + t["entity"],
                    [["operation", "writes", OPC["write"]], ["here", here, HEREC[t["rw"]]]], t["cols"], station("model:" + t["model"]))
    if kind == "commit":
        w = [t["table"] for t in BENCH["tables"] if "w" in t["rw"]]
        return card("DB commit", OPC["write"], "the transaction — access.commits: true",
                    [["here", "%d writes become permanent" % len(w), HEREC["w"]], ["not", "a git commit — history is 'git touches'", "currentColor"]], [[t, "W"] for t in w])
    if kind == "pulse":
        return card("the write lands", RED, "I — one pulse where the DB commit happens", [["means", "an event at a place; a second pulse would mean a double write", "currentColor"]])
    if kind == "fe":
        p = FE.get(key)
        if not p: return card(key, "#9ab", "frontend piece — not in this feed", [["state", "the feed does not carry it", AMBER]])
        rows = [["file", p["file"], "currentColor"]]
        if p.get("hrole"): rows.append(["role", p["hrole"], OPC["read"]])
        if p.get("feClass"): rows.append(["class", p["feClass"], "currentColor"])
        rows.append(["cache", "holds the reply after the call" if p.get("cache") else "no cache", HEREC["r"] if p.get("cache") else "currentColor"])
        if key == "hook": rows.append(["here", "the fetch that names this door", HEREC["rw"]])
        return card(p["name"], ENT.get(p["home"], "#9ab"), p["kind"] + " · " + p["home"], rows, None, station(p["id"]))
    if kind == "step":
        steps = WF["steps"]; lab, ent, st = steps[key]
        return card("step %d — %s" % (key + 1, lab), ENT.get(ent, "#9ab"), WF["name"] + " · a curated workflow · level %s" % WF["level"],
                    [["entity", ent, ENT.get(ent, "#9ab")], ["status", st, GREEN], ["this door", "is step 2 of %d" % len(steps), "currentColor"]],
                    [["%d · %s" % (j + 1, s[0]), s[1]] for j, s in enumerate(steps)], "in the station: journey " + WF["name"])
    if kind == "screens1":
        return card("1 screen fires it", GREEN, "bridges in — the frontend fetch that names this door",
                    [["screen", FE["screen"]["name"] if FE.get("screen") else "?", "currentColor"], ["through", FE["hook"]["name"] if FE.get("hook") else "?", "currentColor"], ["feed-wide", "53 of 81 doors have exactly one", "currentColor"]])
    if kind == "inside0":
        return card("0 callers inside the app", "currentColor", "det.usage.internal — measured zero, not unmeasured",
                    [["means", "nothing in the codebase calls this handler except the route", "currentColor"]])
    if kind == "status":
        code = key; cases = BENCH["status"]["by_status"].get(code, [])
        if code == e["status"]: return card(code, GREEN, "HTTP status · the SUCCESS the door declares (det.status)", [["proven by", "%d test cases" % len(cases), GREEN]], cases, "")
        if not cases: return card(code, AMBER, "HTTP status · the gate's refusal — never tested", [["state", "no test names it: hatched, not zero", AMBER], ["would come from", BENCH["gatefn"]["name"], OPC["gate"]]])
        return card(code, RED, "HTTP status · a failure a test proves", [["proven by", "%d test case%s" % (len(cases), "" if len(cases) == 1 else "s"), RED]], cases, "")
    if kind == "schema":
        s = SC[key]
        return card(s["name"], ENT.get(s["entity"], "#9ab"), "schema · a body shape · " + s["entity"],
                    [["fields", "%d, %d of them structured" % (len(s["cols"]), len(s["nested"])), "currentColor"], ["structured", " · ".join(s["nested"]) or "—", "currentColor"], ["file", s["file"] or "?", "currentColor"]],
                    s["cols"], station("schema:" + s["name"]))
    if kind == "field":
        s = SC[key]; name, typ = s["cols"][i] if i < len(s["cols"]) else ("field %d" % (i + 1), "")
        structured = i < len(s["nested"])
        return card(name, ENT.get(s["entity"], "#9ab"), "field of " + s["name"], [["type", typ or "—", "currentColor"], ["structured", ("yes — one of: " + " · ".join(s["nested"])) if structured else "no — a scalar", HEREC["rw"] if structured else "currentColor"]])
    if kind == "reply":
        return card("one reply, delivered once", "currentColor", "delivery — stream: false", [["means", "the whole record arrives at once; a stream would keep sending", "currentColor"], ["feed-wide", "1 of 81 doors streams", "currentColor"]])
    if kind == "bodyin":
        return card("the body reaches the door", "#8794ab", "inferred — read off the signature, no explicit edge", [["signature", e["gsig"], "currentColor"], ["consumes edge", "drawn 1 of 81 doors; the stat says 70", AMBER]])
    if kind == "method":
        return card("POST", "currentColor", "the verb — creates or mutates", [["feed-wide", "GET 29 · POST 29 · PATCH 10 · DELETE 8 · PUT 4 · BOOT 1", "currentColor"]])
    if kind == "fn":
        f = key; rw = f["rw"]; op, opk = fn_op(f["role"], rw)
        nr = sum(1 for _, r in f["tables"] if "r" in r); nw = sum(1 for _, r in f["tables"] if "w" in r)
        here = " · ".join(x for x in ["reads %d table%s" % (nr, "" if nr == 1 else "s") if nr else "", "writes %d table%s" % (nw, "" if nw == 1 else "s") if nw else ""] if x) or "touches no table"
        return card(f["name"], ENT.get(f["entity"], "#9ab"), "function · " + f["entity"] + (" · " + f["role"] if f["role"] else ""),
                    [["operation", op, OPC[opk]], ["here", here, HEREC.get(rw, "#8794ab")], ["this call", "inferred by the map" if f["conf"] == "inferred" else "extracted from source", "#8794ab" if f["conf"] == "inferred" else "currentColor"]],
                    [[t, r.upper()] for t, r in f["tables"]], station(f["id"]))
    if kind == "handlerbar":
        return card(e["file"], ENT["auth"], "the handler's file", [["file", "%s lines" % e["flines"], "currentColor"], ["handler", "%s · %s lines%s · returns %s" % (e["handler"], e["sig"].get("lines", "?"), " · async" if e["sig"].get("async") else "", e["sig"].get("returns", "?")), "currentColor"]])
    if kind == "handler":
        return card(e["handler"], ENT["auth"], "function · auth · the handler", [["operation", "handles", OPC["call"]], ["lines", "%s%s" % (e["sig"].get("lines", "?"), " · async" if e["sig"].get("async") else ""), "currentColor"], ["returns", e["sig"].get("returns", "?"), "currentColor"], ["calls first", "%d functions" % len(BENCH["chain"][0]), "currentColor"]], None, station(e["file"] + "#" + e["handler"]))
    if kind == "chainbead":
        n = sum(len(l) for l in BENCH["chain"])
        return card("the request", "currentColor", "one bead — one row per hop", [["speed", "slow: mass 7 fields in + %d functions behind" % n, "currentColor"], ["layers", " · ".join(str(len(l)) for l in BENCH["chain"]), "currentColor"]])
    if kind == "asgi":
        a = next(x for x in BENCH["asgi"] if x["name"] == key); d = a["det"]
        return card(key, OPC["gate"], "app-level middleware · scope %s · order %s" % (d.get("scope"), d.get("order")),
                    [["file", "%s:%s" % (d.get("file"), d.get("line")), "currentColor"], ["gates", "%s doors at app scope" % d.get("gates"), "currentColor"], ["this door", "never tied to it — hatched, not zero", AMBER]])
    if kind == "wall":
        return card("no feature flag", "currentColor", "walls — measured zero (hollow)", [["feed-wide", "3 doors are walled (6 wall edges, 2 flags); the stream is one", "currentColor"]])
    if kind == "waiting":
        return card("the request, waiting", "currentColor", "M — stopped at the turnstile until the gate passes", [["what checks it", BENCH["gatefn"]["name"], OPC["gate"]]])
    if kind == "turnstile":
        g = BENCH["gatefn"]
        return card(g["name"], OPC["gate"], "dependency · gate: true · via param-dep", [["operation", "guards", OPC["gate"]], ["function", g["fn"] or "?", "currentColor"], ["used from", "%s files" % g["usage"], "currentColor"], ["guards", "%s of 81 doors" % g["guards"], "currentColor"], ["refuses with", "401", RED]], None, station((g["fn"] or "").replace("::", "#")))
    if kind == "peg":
        d = next(x for x in BENCH["deps"] if x["name"] == key)
        return card(key, "#8794ab", "dependency · gate: false · via " + d["via"], [["means", "injected into the handler; cannot refuse", "currentColor"], ["feed-wide", "on %d of 81 doors" % d["feedwide"], "currentColor"]])
    if kind == "lane":
        if key == "api":
            return card("%d api cases" % len(e["cases"]), GREEN, "det.cases · corpus api · every state: pass", [["means", "a named test whose path touches this door", "currentColor"]], [[c[0], c[1]] for c in e["cases"]])
        if key == "web":
            cf = [x for x in e["case_files"] if x.get("corpus") == "web"]
            return card("web cases — counted, not named", AMBER, "det.case_files · corpus web", [["count", cf[0]["name"] if cf else "15 case(s)", AMBER], ["state", "unmeasured — the feed never names them", AMBER]])
        if key == "journeys":
            n = len(e["journeys"]) + int(e.get("journeys_more") or 0)
            return card("%d test journeys" % n, GREEN, "det.test_journeys — walks that pass through this door", [["listed", "%d, +%s more" % (len(e["journeys"]), e.get("journeys_more") or 0), "currentColor"]], [[j[0], "%s comps · %s · %s" % (j[1], j[2], j[3])] for j in e["journeys"]])
        return card("end-to-end: none", "currentColor", "no e2e case file names this door — measured zero", [["feed-wide", "e2e case files exist on 19 doors", "currentColor"]])
    if kind == "cache":
        p = FE.get("hook") or {}
        return card((p.get("name") or "the hook") + " · cache", HEREC["r"], "the fetching hook holds the reply", [["cache", "true — the screen re-renders from it", HEREC["r"]], ["invalidates", "on the next fetch", "currentColor"]])
    if kind == "next":
        n = BENCH["next"]
        return card(n["label"], ENT.get(n["entity"], "#9ab"), "endpoint · " + n["entity"] + " · the story's next step", [["status", n["status"], GREEN], ["returns", n["resp"] or "?", "currentColor"], ["handler", n["handler"], "currentColor"], ["step", "3 of %d in %s" % (len(WF["steps"]), WF["name"]), "currentColor"]], None, station("endpoint:" + n["label"]))
    if kind == "retry":
        rc = [c for c in e["cases"] if _re.search(r"replay|retry", c[1])]
        return card("a retry", ACC, "the return hop — the same request, sent again", [["result", "replay identical, count one: no second write", HEREC["rw"]], ["proven by", "%d cases" % len(rc), GREEN]], [[c[0], c[1]] for c in rc])
    if kind == "key":
        k = BENCH["idem"]
        return card(k["name"], ENT.get(k["entity"], "#9ab"), "model · a table · " + k["entity"] + " — the idempotency key", [["here", "read + written on every call", HEREC["rw"]], ["means", "a repeated key replays the first result", "currentColor"]], k["cols"], station("model:" + k["name"]))
    if kind == "home":
        h = BENCH["entity"]["auth"]; ev = e["home_ev"] or {}
        return card("auth", ENT["auth"], "entity · the claim home (by file)", [["owns", "%d endpoints · %d models · %d schemas" % (h["endpoints"], h["models"], h["schemas"]), "currentColor"], ["verdict", (ev.get("verdict") or "?") + " · by " + (ev.get("by") or "?"), "currentColor"]], None, "in the station: entity auth")
    if kind == "witness":
        ev = e["home_ev"] or {}
        if key == "file": return card("the file witness", ENT["auth"], "where the handler's file lives", [["says", "auth — " + e["file"], ENT["auth"]], ["weight", "decides the verdict", "currentColor"]])
        if key == "users": return card("the users witness", ENT["auth"], "who calls it", [["says", "auth — " + " · ".join("%s %d" % (k, v) for k, v in (ev.get("users") or {}).items()), ENT["auth"]]])
        d = ev.get("data") or {}
        return card("the data witness", "#a855f7", "the tables and classes it touches, by entity", [["leans", "settings %d vs auth %d" % (d.get("settings", 0), d.get("auth", 0)), "#a855f7"]], [[k, str(v)] for k, v in sorted(d.items(), key=lambda kv: -kv[1])])
    if kind == "pin":
        ev = e["home_ev"] or {}
        return card("verdict: " + (ev.get("verdict") or "?"), "currentColor", "decided by the " + (ev.get("by") or "?") + " row", [["means", "the door stays under auth although its data leans settings", "currentColor"], ["feed-wide", "29 of 81 doors carry disagreeing witnesses; 0 move", "currentColor"]])
    if kind == "tick":
        c = key
        return card(c["short"], "currentColor", c["date"] + " · git touch", [["subject", c["subject"], "currentColor"], ["files", "%s · %d pieces touched" % (c["nFiles"], c["touched"]), "currentColor"], ["in this door's entities", "%d pieces" % c["houses"], HEREC["w"]]])
    if kind == "lane0":
        return card("this door · 0 touches", "currentColor", "commits.js — 30 commits, 2026-07-28 → 08-07", [["means", "nothing changed this door in the window", "currentColor"], ["in flight", "none (sim at rest)", "currentColor"]])
    if kind == "now":
        return card("NOW — head 8356f531", ACC, "the feed's head commit", [["window", "30 commits · 11 days", "currentColor"]])
    if kind == "gauge":
        return card(key, AMBER, "runtime — never measured", [["state", "the feed is a static map: no latency, no rate, no errors, no bytes", AMBER], ["would need", "a runtime feed (logs · traces)", "currentColor"]])
    return card(str(key), "currentColor", kind, [])

OP_WORD = {"pure": ("computes", "pure"), "gate": ("guards", "gate"), "caller": ("calls", "call")}
def fn_op(role, rw):
    if role == "accessor": return ("reads / writes", "write") if rw == "rw" else (("writes", "write") if rw == "w" else ("reads", "read"))
    return OP_WORD.get(role) or ("calls", "call")

# ── primitives ─────────────────────────────────────────────────────────────────────────────────────────────
def svg(inner, fx=None, static=True, w=440, h=150):
    inner = _re.sub(r"<g>\s*<title>(.*?)</title>", lambda m: '<g data-t="%s">' % _html.escape(_html.unescape(m.group(1)), quote=True), inner, flags=_re.S)
    a = (' data-fx="%s"' % fx) if fx else ""
    return ('<svg viewBox="0 0 %d %d" preserveAspectRatio="xMinYMid meet" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round"%s%s>%s</svg>' % (w, h, a, ' data-static="1"' if static else "", inner))
def txt(x, y, t, size=13, fill="currentColor", anchor="start", weight="", opacity=""):
    return '<text x="%s" y="%s" font-size="%s" text-anchor="%s" fill="%s" stroke="none" %s%s%s>%s</text>' % (x, y, size, anchor, fill, MONO, ' font-weight="700"' if weight else "", (' opacity="%s"' % opacity) if opacity else "", t)
def door_shape(x, y, r=15):
    return '<circle cx="%d" cy="%d" r="%d"/><polygon points="%d %d %d %d %d %d %d %d %d %d %d %d" fill="currentColor" stroke="none"/>' % (x, y, r, x + 2, y - 9, x - 5, y + 1, x + 1, y + 1, x - 1, y + 9, x + 6, y - 1, x, y - 1)
def door(x, y, r=15, c=None): return G(c or C("door"), door_shape(x, y, r))
def hatch_defs(pid, col=AMBER):
    return ('<defs><pattern id="%s" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="7" fill="%s" fill-opacity=".55"/></pattern></defs>' % (pid, col))
def rwbadge(x, y, rw, w=None, fs=14):
    w = w or (34 if rw == "rw" else 24)
    return '<rect x="%d" y="%d" width="%d" height="22" rx="4" fill="%s" stroke="none"/>%s' % (x, y, w, RWC[rw], txt(x + w / 2, y + 16, rw.upper(), fs, "#0b0e13", "middle", 1))
def opchip(x, y, text, opk, fs=14):
    ink = "#1a1400" if opk in ("gate", "schema") else "#fff"; w = 16 + len(text) * (fs * 0.66)
    return '<rect x="%d" y="%d" width="%.0f" height="22" rx="5" fill="%s" stroke="none"/>%s' % (x, y, w, OPC[opk], txt(x + w / 2, y + 16, text.upper(), fs, ink, "middle", 1))
def screen_shape(x, y):
    return '<rect x="%d" y="%d" width="50" height="48" rx="6"/><path d="M%d %dh50"/><rect x="%d" y="%d" width="34" height="6" rx="2" fill="currentColor" fill-opacity=".5" stroke="none"/><rect x="%d" y="%d" width="22" height="6" rx="2" fill="currentColor" fill-opacity=".5" stroke="none"/>' % (x, y, x, y + 12, x + 8, y + 20, x + 8, y + 32)
def record(x, y, w, key, title_y=None):
    """a record: one row per field, each its own card; the frame is the schema's card"""
    s = SC[key]; n, nested = len(s["cols"]), len(s["nested"])
    parts = [G(C("schema", key), '<rect x="%d" y="%d" width="%d" height="%d" rx="6"/>' % (x, y, w, n * 14 + 8))]
    yy = y + 10
    for i in range(n):
        structured = i < nested
        parts.append(G(C("field", key, i), '<rect x="%d" y="%d" width="10" height="10" rx="2" fill="currentColor" fill-opacity=".7" stroke="none"/><path d="M%d %dh%d" stroke-width="3" stroke-opacity=".55"/>%s'
                       % (x + 8, yy - 5, x + 24, yy, w - 36 - (18 if structured else 0), ('<path d="M%d %dh18" stroke-width="2" stroke-opacity=".35" stroke-dasharray="3 3"/>' % (x + w - 30, yy)) if structured else "")))
        yy += 14
    if title_y: parts.append(txt(x, title_y, "%s · %d fields" % (s["name"], n), 12, "currentColor", opacity=".75"))
    return "".join(parts)

# ── 1 · DATA footprint ──────────────────────────────────────────────────────────────────────────────────────
def s_footprint():
    order = ["auth", "settings", "allergen", "pantry", "legal-consent"]
    by = {e: [t for t in BENCH["tables"] if t["entity"] == e] for e in order}
    out = [door(38, 50, 16), G(C("op"), opchip(10, 76, "writes", "write"))]
    x = 96
    for ent in order:
        tables = by[ent]; w = max(70, 12 + len(tables) * 38); home = ent == "auth"
        out.append(G(C("ground", ent), '<rect x="%d" y="26" width="%d" height="56" rx="8" fill="%s" fill-opacity=".22" stroke="%s" stroke-width="%s"/>' % (x, w, ENT[ent], ENT[ent], "3.5" if home else "2")))
        out.append(txt(x + 2, 20, ent, 14, ENT[ent], weight=1))
        tx = x + 8
        for t in tables:
            out.append(G(C("table", t), rwbadge(tx, 43, t["rw"], w=34))); tx += 38
        x += w + 8
    lx = x // 2 + 40
    out.append(G(C("commit"), '<path d="M96 118h%d" stroke-width="5"/><rect x="%d" y="106" width="22" height="24" rx="4" fill="currentColor"/><path d="M%d 106v-8a7 7 0 0 1 14 0v8"/>' % (x - 104, lx - 4, lx)))
    out.append(G(C("pulse"), '<circle cx="%d" cy="118" r="12" class="pulse" stroke="%s" stroke-width="3"/>' % (lx + 7, RED)))
    style = ('<style>svg[data-fx="s-footprint"] .pulse{transform-origin:%dpx 118px;animation:k_s_footprint 2.2s ease-out 1 forwards}@keyframes k_s_footprint{0%%{transform:scale(1);opacity:1}100%%{transform:scale(3.2);opacity:0}}</style>' % (lx + 7))
    return svg("".join(out) + style, fx="s-footprint", static=False, w=x + 44, h=150)

# ── 2 · WIDENING dependents ─────────────────────────────────────────────────────────────────────────────────
def s_dependents():
    lad = (G(C("fe", "route"), '<path d="M46 14 32 30 46 46 60 30z" fill="currentColor" fill-opacity=".25"/>') + '<path d="M46 48v10m-5-4 5 5 5-5"/>'
           + G(C("fe", "screen"), '<rect x="33" y="64" width="26" height="22" rx="4" fill="currentColor" fill-opacity=".25"/>') + '<path d="M46 88v8m-5-3 5 5 5-5"/>'
           + G(C("fe", "hook"), '<path d="M56 100v12a10 10 0 0 1-20 0" stroke-width="3"/><circle cx="56" cy="99" r="3" fill="currentColor"/>') + '<path d="M46 124v4"/>' + door(46, 138, 11))
    sx = [150, 236, 322, 408]; names = ["consent", "setup", "me", "settings"]
    st = ['<path d="M150 80h258" stroke-width="2" stroke-dasharray="6 6"/><path d="M150 80h86" stroke-width="3"/>', txt(150, 128, "the story: %s — this door is step 2" % WF["name"], 11, opacity=".75")]
    for i, cx in enumerate(sx):
        lit = i == 1
        st.append(G(C("step", i), '<circle cx="%d" cy="80" r="16"%s/>%s' % (cx, ' fill="currentColor" fill-opacity=".9"' if lit else "", txt(cx, 85, str(i + 1), 13, "var(--card,#fff)" if lit else "currentColor", "middle", 1))))
        st.append(txt(cx, 110, names[i], 11, "currentColor", "middle", opacity=".75"))
    st.append(G(C("screens1"), '<rect x="150" y="18" width="52" height="22" rx="4" stroke="%s"/><circle cx="163" cy="29" r="5" fill="%s" stroke="none"/>%s' % (GREEN, GREEN, txt(176, 34, "1", 12))))
    st.append(G(C("inside0"), '<rect x="210" y="18" width="52" height="22" rx="4" stroke-dasharray="4 4"/><circle cx="223" cy="29" r="5"/>%s' % txt(236, 34, "0", 12)))
    return svg(lad + "".join(st))

# ── 3 · response · 4 · request ──────────────────────────────────────────────────────────────────────────────
def s_response():
    return svg(door(34, 70) + G(C("status", EP["status"]), '<rect x="14" y="98" width="40" height="20" rx="5" fill="%s" fill-opacity=".9" stroke="%s"/>%s' % (GREEN, GREEN, txt(34, 112, EP["status"], 12, "#fff", "middle", 1)))
               + '<path d="M52 70h40m-5-5 5 5-5 5"/>' + record(98, 20, 190, "response", 130)
               + '<path d="M292 70h70m-5-5 5 5-5 5"/>' + G(C("reply"), '<circle cx="326" cy="70" r="7" fill="currentColor"/>')
               + G(C("fe", "screen"), screen_shape(376, 46)))
def s_request():
    return svg(G(C("fe", "screen"), screen_shape(20, 46)) + '<path d="M76 70h30m-5-5 5 5-5 5"/>' + record(112, 14, 190, "request", 138)
               + '<path d="M308 70h56m-5-5 5 5-5 5" stroke-dasharray="6 5"/>' + G(C("bodyin"), '<circle cx="336" cy="70" r="7"/>') + door(392, 70)
               + G(C("method"), '<rect x="372" y="98" width="40" height="20" rx="5" fill="currentColor" fill-opacity=".85"/>%s' % txt(392, 112, "POST", 12, "var(--card,#fff)", "middle", 1)))

# ── 5 · FUNCTIONS chain ─────────────────────────────────────────────────────────────────────────────────────
def s_chain():
    layers = BENCH["chain"]
    out = [door(30, 22, 12, C("handler")), G(C("op"), opchip(52, 11, "writes", "write")),
           G(C("handlerbar"), '<rect x="140" y="14" width="420" height="14" rx="3"/><rect x="140" y="14" width="35" height="14" rx="3" fill="currentColor"/>')]
    y = 44
    for depth, fns in enumerate(layers):
        out.append(txt(14, y + 17, "L%d" % (depth + 1), 14, opacity=".7"))
        for i, f in enumerate(fns):
            x = 52 + i * 34; inf = f["conf"] == "inferred"; rw = f["rw"]
            if rw: cell = '<rect x="%d" y="%d" width="30" height="24" rx="4" fill="%s" stroke="%s"%s/>%s' % (x, y, RWC[rw], RWC[rw], ' stroke-dasharray="4 3" fill-opacity=".55"' if inf else "", txt(x + 15, y + 17, rw.upper(), 13, "#0b0e13", "middle", 1))
            else: cell = '<rect x="%d" y="%d" width="30" height="24" rx="4" fill="currentColor" fill-opacity="%s"%s/>' % (x, y, ".12" if inf else ".25", ' stroke-dasharray="4 3"' if inf else "")
            out.append(G(C("fn", f), cell))
        y += 30
    out.append(G(C("chainbead"), '<circle cx="30" cy="22" r="7" fill="currentColor" class="bead"/>'))
    style = ('<style>svg[data-fx="s-chain"] .bead{animation:k_s_chain 5s steps(1,end) infinite}@keyframes k_s_chain{0%{transform:translate(0,0)}25%{transform:translate(8px,34px)}50%{transform:translate(8px,64px)}75%{transform:translate(8px,94px)}90%,100%{transform:translate(8px,124px)}}</style>')
    return svg("".join(out) + style, fx="s-chain", static=False, w=580, h=170)

# ── 6 · SECURITY gate ───────────────────────────────────────────────────────────────────────────────────────
def s_gate():
    out = [hatch_defs("s-gate-h"), '<path d="M14 84h404" stroke-width="2"/>']
    for i, name in enumerate(["IdempotencyMiddleware", "RateLimitMiddleware", "CORSMiddleware"]):
        out.append(G(C("asgi", name), '<rect x="%d" y="66" width="30" height="36" rx="4" fill="url(#s-gate-h)" stroke="%s"/>' % (24 + i * 38, AMBER)))
    out.append(G(C("wall"), '<rect x="160" y="58" width="16" height="52" rx="3" stroke-dasharray="4 4"/>'))
    out.append(G(C("turnstile"), '<path d="M250 44v80" stroke-width="4"/><path d="M250 84l22-16M250 84l-22-16M250 84l22 16M250 84l-22 16" stroke-width="4"/><circle cx="250" cy="84" r="6" fill="currentColor"/>'))
    out.append(G(C("waiting"), '<circle cx="222" cy="84" r="8"/>'))
    for i, d in enumerate(BENCH["deps"]):
        out.append(G(C("peg", d["name"]), '<circle cx="%d" cy="58" r="7" fill="currentColor" fill-opacity=".45"/><path d="M%d 65v19"/>' % (312 + i * 30, 312 + i * 30)))
    out.append(door(396, 84))
    return svg("".join(out))

# ── 7 · ERRORS ──────────────────────────────────────────────────────────────────────────────────────────────
def chip(x, y, code, kind, w=52):
    if kind == "hatched": fill, stroke, ink, fo = 'url(#s-errors-h)', AMBER, "currentColor", ""
    elif kind == "ok": fill, stroke, ink, fo = GREEN, GREEN, "#fff", ' fill-opacity=".9"'
    else: fill, stroke, ink, fo = RED, RED, "#fff", ' fill-opacity=".85"'
    return '<rect x="%d" y="%d" width="%d" height="26" rx="6" fill="%s"%s stroke="%s"/>%s' % (x, y, w, fill, fo, stroke, txt(x + w // 2, y + 18, code, 13, ink, "middle", 1))
def s_errors():
    out = [hatch_defs("s-errors-h"), door(30, 46), '<path d="M48 46h60" stroke-width="3"/>',
           G(C("turnstile"), '<path d="M126 28 144 46 126 64 108 46z" stroke-width="2.5"/>'), '<path d="M144 46h70" stroke-width="3"/>',
           G(C("handler"), '<rect x="214" y="32" width="40" height="28" rx="5" fill="currentColor" fill-opacity=".18"/>'), '<path d="M254 46h96m-6-6 6 6-6 6" stroke-width="5"/>',
           G(C("status", "200"), chip(356, 33, "200", "ok", 58)),
           '<path d="M126 64v36" stroke-dasharray="4 4"/>', G(C("status", "401"), chip(100, 104, "401", "hatched")),
           '<path d="M226 60v36" stroke-width="2"/>', G(C("status", "400"), chip(176, 104, "400", "bad")),
           '<path d="M240 60v36" stroke-width="2"/>', G(C("status", "409"), chip(236, 104, "409", "bad")),
           '<path d="M252 60l30 36" stroke-width="3.5"/>', G(C("status", "422"), chip(296, 104, "422", "bad"))]
    return svg("".join(out))

# ── 8 · TESTS ───────────────────────────────────────────────────────────────────────────────────────────────
def s_tests():
    out = [hatch_defs("s-tests-h", GREEN)]
    lanes = [("api", 26, "solid"), ("web", 15, "hatched"), ("journeys", len(EP["journeys"]) + int(EP.get("journeys_more") or 0), "solid")]
    icons = ['<circle cx="34" cy="%d" r="10"/><path d="m29 %d 4 4 7-7"/>', '<path d="M26 %dh10l6 6v12H26z"/>', '<circle cx="28" cy="%d" r="4"/><path d="M32 %dh14a6 6 0 0 1 0 12H30"/>']
    for i, (key, n, kind) in enumerate(lanes):
        y = 26 + i * 40
        ic = icons[0] % (y, y) if i == 0 else (icons[1] % (y - 9) if i == 1 else icons[2] % (y, y - 6))
        w = min(n, 27) * 13
        bar = ('<rect x="60" y="%d" width="%d" height="22" rx="5" fill="%s" fill-opacity=".8" stroke="%s"/>' % (y - 11, w, GREEN, GREEN) + "".join('<path d="M%d %dv22" stroke="var(--card,#fff)" stroke-width="1.5"/>' % (60 + k * 13, y - 11) for k in range(1, min(n, 27)))
               if kind == "solid" else '<rect x="60" y="%d" width="%d" height="22" rx="5" fill="url(#s-tests-h)" stroke="%s"/>' % (y - 11, w, GREEN))
        out.append(G(C("lane", key), ic + bar + txt(66 + w, y + 5, str(n), 13, weight=1)))
    out.append(G(C("lane", "e2e"), '<rect x="60" y="128" width="60" height="16" rx="4" stroke-dasharray="4 4"/>%s' % txt(128, 141, "e2e 0", 12, opacity=".7")))
    return svg("".join(out))

# ── 9 · AFTER ───────────────────────────────────────────────────────────────────────────────────────────────
def s_after():
    out = [door(40, 56), '<path d="M58 56h56m-5-5 5 5-5 5"/>',
           G(C("commit"), '<rect x="118" y="40" width="24" height="30" rx="4" fill="currentColor"/><path d="M122 40v-8a8 8 0 0 1 16 0v8"/>'),
           G(C("pulse"), '<circle cx="130" cy="55" r="12" class="pulse" stroke="%s" stroke-width="3"/>' % RED),
           '<path d="M146 56h56m-5-5 5 5-5 5"/>', G(C("cache"), '<rect x="206" y="36" width="36" height="40" rx="5"/><rect x="209" y="52" width="30" height="21" rx="3" fill="currentColor" fill-opacity=".45" stroke="none"/>'),
           '<path d="M246 56h56m-5-5 5 5-5 5"/>', G(C("next"), '<circle cx="330" cy="56" r="16"/>%s' % txt(330, 61, "GET", 12, "currentColor", "middle", 1)),
           '<path d="M330 74v24H40v-24m0 6-5 5 5 5" stroke-width="3" stroke="%s"/>' % ACC,
           G(C("retry"), '<circle cx="200" cy="98" r="8" stroke="%s"/>' % ACC), G(C("key"), '<circle cx="150" cy="98" r="6"/><path d="M156 98h10m-3-3v6m3-6v6"/>'),
           txt(40, 130, "one write · a retry does not write twice", 12, opacity=".7")]
    style = ('<style>svg[data-fx="s-after"] .pulse{transform-origin:130px 55px;animation:k_s_after 2.2s ease-out 1 forwards}@keyframes k_s_after{0%{transform:scale(1);opacity:1}100%{transform:scale(3.2);opacity:0}}</style>')
    return svg("".join(out) + style, fx="s-after", static=False)

# ── 10 · HOME ───────────────────────────────────────────────────────────────────────────────────────────────
def s_home():
    ev = EP["home_ev"] or {}; data = ev.get("data") or {}
    out = [G(C("home"), '<rect x="14" y="24" width="96" height="102" rx="10" fill="%s" fill-opacity=".25" stroke="%s" stroke-width="3"/>%s%s' % (ENT["auth"], ENT["auth"], door_shape(62, 66, 18), txt(62, 112, "auth", 12, "currentColor", "middle")))]
    rows = [("file", [("auth", 1)]), ("users", [(k, v) for k, v in (ev.get("users") or {"auth": 1}).items()]), ("data", sorted(data.items(), key=lambda kv: -kv[1]))]
    for i, (name, segs) in enumerate(rows):
        y = 40 + i * 34; x = 182
        out.append(txt(132, y + 5, name, 12, opacity=".8"))
        segsvg = ""
        for ent, n in segs:
            for _ in range(n): segsvg += '<rect x="%d" y="%d" width="9" height="20" rx="2" fill="%s" stroke="none"/>' % (x, y - 10, ENT.get(ent, "#9ab")); x += 10
        out.append(G(C("witness", name), segsvg))
    out.append(G(C("pin"), '<path d="M420 30l-10 10 10 10z" fill="currentColor"/>'))
    return svg("".join(out))

# ── 11 · CHANGE PRESSURE ────────────────────────────────────────────────────────────────────────────────────
def s_motion():
    days = ["07-28", "07-29", "07-30", "07-31", "08-01", "08-02", "08-03", "08-04", "08-05", "08-06", "08-07"]
    out = ['<path d="M40 78h380" stroke-width="2"/>'] + ['<path d="M%d 74v8"/>' % (40 + i * 36) for i in range(len(days))]
    out.append(G(C("now"), '<path d="M400 20v112" stroke-width="3" stroke="%s"/>%s' % (ACC, txt(406, 30, "NOW", 12, ACC, weight=1))))
    out.append(G(C("lane0"), '<rect x="40" y="36" width="360" height="22" rx="5" stroke-dasharray="4 4"/>%s' % txt(48, 51, "this door · 0 touches", 12, opacity=".7")))
    out.append('<rect x="40" y="98" width="360" height="22" rx="5"/>' + txt(40, 140, "the entities it writes into · %d touches" % len(BENCH["commits"]), 12, opacity=".7"))
    for c in BENCH["commits"]:
        d = c["date"][5:]
        if d in days: out.append(G(C("tick", c), '<rect x="%d" y="101" width="6" height="16" rx="1" fill="currentColor"/>' % (40 + days.index(d) * 36 - 3)))
    return svg("".join(out))

# ── 12 · RUNTIME ────────────────────────────────────────────────────────────────────────────────────────────
def s_runtime():
    out = [hatch_defs("s-runtime-h"), txt(14, 24, "runtime — nothing here is measured (the feed is a static map)", 12, opacity=".75")]
    for i, name in enumerate(["latency", "calls / min", "error rate", "bytes"]):
        cx = 60 + i * 106
        out.append(G(C("gauge", name), '<path d="M%d 96a36 36 0 0 1 72 0" stroke-width="12" stroke="url(#s-runtime-h)"/><path d="M%d 96a36 36 0 0 1 72 0" stroke="%s"/>%s%s' % (cx - 36, cx - 36, AMBER, txt(cx, 114, "no needle", 11, AMBER, "middle", 1), txt(cx, 132, name, 12, "currentColor", "middle", opacity=".7"))))
    return svg("".join(out))

# ── the assembly's SCHEMAS part ─────────────────────────────────────────────────────────────────────────────
def s_schemas():
    return svg(record(14, 30, 176, "request") + '<path d="M196 74h30" stroke-dasharray="5 4"/>'
               + G(card("L — 7 in → 6 out", "currentColor", "the funnel between two counts in sequence", [["reads", "narrows: the door condenses", "currentColor"], ["contrast", "GET /recipes/{id}: 0 → 39, it manufactures data", "currentColor"]]), '<path d="M228 56h28l14 10-14 10h-28z" fill="currentColor" fill-opacity=".25"/>')
               + door(300, 74) + '<path d="M318 74h14m-4-4 4 4-4 4"/>' + record(334, 34, 96, "response"))

SIMPLE = {"footprint": s_footprint, "dependents": s_dependents, "response": s_response, "request": s_request, "chain": s_chain,
          "gate": s_gate, "errors": s_errors, "tests": s_tests, "after": s_after, "home": s_home, "motion": s_motion, "runtime": s_runtime, "schemas": s_schemas}

# ── legends + readouts ──────────────────────────────────────────────────────────────────────────────────────
def _lg(inner, w=26, h=22):
    return '<svg viewBox="0 0 %d %d" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % (w, h, inner)
LG = {
  "ground":  _lg('<rect x="2" y="3" width="22" height="16" rx="4" fill="%s" fill-opacity=".25" stroke="%s"/>' % (ENT["settings"], ENT["settings"])),
  "home":    _lg('<rect x="2" y="3" width="22" height="16" rx="4" fill="%s" fill-opacity=".25" stroke="%s" stroke-width="3.5"/>' % (ENT["auth"], ENT["auth"])),
  "R":       _lg('<rect x="2" y="3" width="22" height="16" rx="4" fill="%s"/>%s' % (RWC["r"], txt(13, 15, "R", 11, "#0b0e13", "middle", 1))),
  "W":       _lg('<rect x="2" y="3" width="22" height="16" rx="4" fill="%s"/>%s' % (RWC["w"], txt(13, 15, "W", 11, "#0b0e13", "middle", 1))),
  "RW":      _lg('<rect x="1" y="3" width="24" height="16" rx="4" fill="%s"/>%s' % (RWC["rw"], txt(13, 15, "RW", 10, "#0b0e13", "middle", 1))),
  "writes":  _lg('<rect x="1" y="3" width="24" height="16" rx="4" fill="%s"/><path d="M6 11h14" stroke="#fff" stroke-width="2.5"/>' % OPC["write"]),
  "lock":    _lg('<rect x="7" y="9" width="12" height="11" rx="2" fill="currentColor"/><path d="M9 9V6a4 4 0 0 1 8 0v3"/>'),
  "pulse":   _lg('<circle cx="13" cy="11" r="4" fill="currentColor"/><circle cx="13" cy="11" r="9" stroke="%s"/>' % RED),
  "route":   _lg('<path d="M13 2 4 11l9 9 9-9z" fill="currentColor" fill-opacity=".25"/>'),
  "screen":  _lg('<rect x="4" y="4" width="18" height="14" rx="3" fill="currentColor" fill-opacity=".25"/>'),
  "hook":    _lg('<path d="M18 3v10a6 6 0 0 1-12 0" stroke-width="3"/><circle cx="18" cy="3" r="2" fill="currentColor"/>'),
  "door":    _lg('<circle cx="13" cy="11" r="8"/><polygon points="14 5 10 12 13 12 12 17 17 10 14 10" fill="currentColor" stroke="none"/>'),
  "step":    _lg('<circle cx="13" cy="11" r="8" fill="currentColor" fill-opacity=".9"/>'),
  "field":   _lg('<rect x="4" y="6" width="8" height="8" rx="2" fill="currentColor" fill-opacity=".7" stroke="none"/><path d="M15 10h8" stroke-width="3" stroke-opacity=".55"/>'),
  "nested":  _lg('<rect x="4" y="6" width="8" height="8" rx="2" fill="currentColor" fill-opacity=".7" stroke="none"/><path d="M15 10h4" stroke-width="3" stroke-opacity=".55"/><path d="M20 10h4" stroke-dasharray="2 2" stroke-opacity=".5"/>'),
  "ok":      _lg('<rect x="2" y="4" width="22" height="14" rx="4" fill="%s" fill-opacity=".9" stroke="%s"/>' % (GREEN, GREEN)),
  "bad":     _lg('<rect x="2" y="4" width="22" height="14" rx="4" fill="%s" fill-opacity=".85" stroke="%s"/>' % (RED, RED)),
  "hatched": _lg('<defs><pattern id="lgh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="%s" fill-opacity=".55"/></pattern></defs><rect x="2" y="4" width="22" height="14" rx="4" fill="url(#lgh)" stroke="%s"/>' % (AMBER, AMBER)),
  "hollow":  _lg('<rect x="2" y="4" width="22" height="14" rx="4" stroke-dasharray="4 3"/>'),
  "fn":      _lg('<rect x="5" y="3" width="16" height="16" rx="3" fill="currentColor" fill-opacity=".28"/>'),
  "fninf":   _lg('<rect x="5" y="3" width="16" height="16" rx="3" fill="currentColor" fill-opacity=".12" stroke-dasharray="4 3"/>'),
  "bead":    _lg('<circle cx="13" cy="11" r="6" fill="currentColor"/>'),
  "wait":    _lg('<circle cx="13" cy="11" r="6"/>'),
  "turnstile": _lg('<path d="M13 2v18" stroke-width="3"/><path d="M13 11l8-6M13 11l-8-6M13 11l8 6M13 11l-8 6" stroke-width="3"/>'),
  "peg":     _lg('<circle cx="13" cy="7" r="5" fill="currentColor" fill-opacity=".45"/><path d="M13 12v8"/>'),
  "bar":     _lg('<rect x="2" y="6" width="22" height="10" rx="3" fill="%s" fill-opacity=".8" stroke="%s"/>' % (GREEN, GREEN)),
  "hbar":    _lg('<rect x="2" y="6" width="22" height="10" rx="3" fill="url(#lgh)" stroke="%s"/>' % GREEN),
  "cache":   _lg('<rect x="5" y="3" width="16" height="16" rx="3"/><rect x="7" y="10" width="12" height="7" rx="2" fill="currentColor" fill-opacity=".45" stroke="none"/>'),
  "retry":   _lg('<path d="M4 6h18v10H4" stroke="%s" stroke-width="2.5"/><path d="M8 16l-4 0 0-4" stroke="%s"/>' % (ACC, ACC)),
  "key":     _lg('<circle cx="9" cy="11" r="4"/><path d="M13 11h9m-3-3v6m3-6v6"/>'),
  "vote":    _lg('<rect x="3" y="4" width="6" height="14" rx="1" fill="%s" stroke="none"/><rect x="10" y="4" width="6" height="14" rx="1" fill="%s" stroke="none"/><rect x="17" y="4" width="6" height="14" rx="1" fill="%s" stroke="none"/>' % (ENT["settings"], ENT["auth"], ENT["allergen"])),
  "pin":     _lg('<path d="M20 4l-9 7 9 7z" fill="currentColor"/>'),
  "tick":    _lg('<path d="M4 11h18"/><rect x="11" y="4" width="4" height="14" rx="1" fill="currentColor"/>'),
  "now":     _lg('<path d="M13 2v18" stroke="%s" stroke-width="3"/>' % ACC),
  "gauge":   _lg('<path d="M4 16a9 9 0 0 1 18 0" stroke-width="5" stroke="url(#lgh)"/><path d="M4 16a9 9 0 0 1 18 0" stroke="%s"/>' % AMBER),
  "funnel":  _lg('<path d="M3 5h12l8 6-8 6H3z" fill="currentColor" fill-opacity=".25"/>'),
}
LEGEND = {
  "footprint":  [("door", "this door"), ("writes", "its operation"), ("home", "the door's own entity"), ("ground", "another entity"), ("R", "a table it reads"), ("RW", "a table it reads + writes"), ("lock", "DB commit"), ("pulse", "the write lands")],
  "dependents": [("route", "URL page"), ("screen", "screen"), ("hook", "hook that fetches"), ("door", "this door"), ("step", "the story's current step"), ("hollow", "measured zero")],
  "response":   [("door", "this door"), ("ok", "success status"), ("field", "a field of the reply"), ("nested", "a structured field"), ("bead", "one reply, once"), ("screen", "screen that receives it")],
  "request":    [("screen", "screen that sends"), ("field", "a field you send"), ("nested", "a structured field"), ("wait", "the body, inferred"), ("door", "this door")],
  "chain":      [("door", "the handler"), ("fn", "a function it reaches"), ("fninf", "a call the map inferred"), ("R", "reads a table"), ("W", "writes a table"), ("RW", "reads + writes"), ("bead", "the request, one row per hop")],
  "gate":       [("hatched", "app-level middleware, not tied to this door"), ("hollow", "no feature flag"), ("wait", "the request, waiting"), ("turnstile", "can refuse it"), ("peg", "injected, cannot refuse"), ("door", "this door")],
  "errors":     [("door", "this door"), ("ok", "success it declares"), ("bad", "failure a test proves"), ("hatched", "failure nobody tested")],
  "tests":      [("bar", "named passing cases"), ("hbar", "counted, never named"), ("hollow", "none")],
  "after":      [("door", "this door"), ("lock", "DB commit"), ("pulse", "the write lands"), ("cache", "the reply cached"), ("step", "next step of the story"), ("retry", "a retry"), ("key", "idempotency key")],
  "home":       [("home", "the entity that owns it"), ("vote", "votes per witness, by entity"), ("pin", "the row that decided")],
  "motion":     [("tick", "a git commit"), ("hollow", "none"), ("now", "NOW")],
  "runtime":    [("gauge", "never measured")],
  "schemas":    [("field", "a field"), ("nested", "a structured field"), ("funnel", "in → out: narrows or widens"), ("door", "this door")],
}
_nj = len(EP["journeys"]) + int(EP.get("journeys_more") or 0)
_fns = [f for l in BENCH["chain"] for f in l]
READOUT = {
  "footprint": "13 tables · 11 RW · 2 R · 8 in 4 other entities · DB commit ✓",
  "dependents": "1 screen fires it · 4 rungs from the URL · story step 2 of 4 · 0 callers inside",
  "response": "MeResponse · 6 fields · 5 structured · status 200 · delivered once",
  "request": "SetupCompleteRequest · 7 fields · 6 structured · inferred from the signature",
  "chain": "%d functions on the calls walk · %s by layer · %d calls inferred · %d write · %d read (c4 behind.fns 29 counts graft-only hops too)" % (len(_fns), " · ".join(str(len(l)) for l in BENCH["chain"]), sum(f["conf"] == "inferred" for f in _fns), sum("w" in f["rw"] for f in _fns), sum("r" in f["rw"] for f in _fns)),
  "gate": "1 can refuse (get_auth_context) · 2 injected · 0 flags · 3 app-level, untied",
  "errors": "declares 200 · tests prove 400 · 409 · 422 ×2 · 401 never tested",
  "tests": "26 api cases · 15 web cases unnamed · %d journeys · 0 end-to-end" % _nj,
  "after": "one DB commit · reply cached · next: GET /me · retry-safe (IdempotencyKey)",
  "home": "owner auth by file · users: auth 1 · data: settings 10 · auth 9 · 3 others 5 · verdict stay",
  "motion": "0 commits touch it (30 in window) · %d touch the entities it writes into · none in flight" % len(BENCH["commits"]),
  "runtime": "latency · calls · errors · bytes — not in the feed",
  "schemas": "in 7 → out 6 (−1) · both structured",
}
def legend_html(key):
    items = LEGEND.get(key, [])
    return '<div class="lg">' + "".join('<span>%s<i>%s</i></span>' % (LG[g], lab) for g, lab in items) + '</div>' + ('<p class="ro">%s</p>' % READOUT[key] if key in READOUT else "")
