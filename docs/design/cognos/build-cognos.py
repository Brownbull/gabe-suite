#!/usr/bin/env python3
"""build-cognos.py — the Gabe Cognos first run (API endpoint) as a house-chrome artifact.

Reads cognos-endpoint.json (the workflow's return: facts · station today · reader model · library ·
12 wells · 12 encodings with three-lens verdicts · the critic) and composes the page:
the kit's three blocks (copied, never retyped) + the wells in REQUEST ORDER (the reader's suit is
Sequential-Procedural: gate → request → chain → tables → response → after; time flows top to bottom)
+ the corrections, the channel load, the console seating, the open rulings, the blind side, the skill.

Every sketch is an agent-drawn SVG whose <style> is DOCUMENT-WIDE: rules are scoped to
svg[data-fx="<slug>"], @keyframes and ids are renamed per sketch, so twelve sketches never fight.
"""
import json, re, html, pathlib

HERE = pathlib.Path(__file__).resolve().parent
KIT = pathlib.Path("/home/khujta/.claude/skills/gabe-artifact/assets/artifact-chrome.html").read_text(encoding="utf-8")
R = json.load(open(HERE / "cognos-endpoint.json", encoding="utf-8"))

# ── the kit, three blocks, copied ──────────────────────────────────────────────────────────────
def block(a, b):
    i = KIT.index(a); j = KIT.index(b, i)
    return KIT[i:j]
BLOCK1 = block("<!-- ══ BLOCK 1", "</style>") + "</style>"
BLOCK2 = block("<!-- ══ BLOCK 2", "<!-- ══ BLOCK 3")
BLOCK3 = block("<!-- ══ BLOCK 3", "</script>") + "</script>"
# reduced-motion: the kit KILLS animations (`animation:none`), which would leave an agent sketch whose
# base state is its start frame as a blank card. Sketch elements are excluded here and instead JUMP to
# their finished frame (below) — the contract's "finished state, never an empty frame".
old = "@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }"
assert old in BLOCK1
BLOCK1 = BLOCK1.replace(old, "@media (prefers-reduced-motion: reduce) { *:not(svg[data-fx] *):not(svg[data-fx]) { transition: none !important; animation: none !important; } }")

E = lambda s: html.escape(str(s), quote=True)

# ── lucide icons for the section pills (inlined: the CSP blocks icon CDNs) ──────────────────────
ICO = {
  "target": '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  "route": '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  "orbit": '<circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M10.4 21.9a10 10 0 0 0 9.941-15.416"/><path d="M13.5 2.1a10 10 0 0 0-9.841 15.416"/>',
  "alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "bars": '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  "layout": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  "gavel": '<path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
  "eyeoff": '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  "sparkles": '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  "replay": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  "check": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 5-5"/>',
  "x": '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/>',
}
def ico(name, cls=""):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"%s>%s</svg>' % ((' class="%s"' % cls) if cls else "", ICO[name]))

# ── sketch scoping ────────────────────────────────────────────────────────────────────────────
def scope_sketch(svg, slug):
    """scope every CSS rule to this svg, rename keyframes + ids; set data-fx on the root."""
    svg = svg.strip()
    # root data-fx
    m = re.match(r"<svg\b([^>]*)>", svg, re.S)
    attrs = m.group(1)
    attrs = re.sub(r'\s+data-fx="[^"]*"', "", attrs)
    attrs = re.sub(r"\s+data-fx='[^']*'", "", attrs)
    attrs = re.sub(r'\s+preserveAspectRatio="[^"]*"', "", attrs)
    svg = "<svg%s data-fx=\"%s\" preserveAspectRatio=\"xMinYMid meet\">" % (attrs, slug) + svg[m.end():]   # left-anchored in its frame (H1)
    # ids
    ids = set(re.findall(r'\bid="([^"]+)"', svg))
    for i in sorted(ids, key=len, reverse=True):
        ni = slug + "-" + i
        svg = svg.replace('id="%s"' % i, 'id="%s"' % ni)
        svg = svg.replace("url(#%s)" % i, "url(#%s)" % ni)
        svg = svg.replace('href="#%s"' % i, 'href="#%s"' % ni)
    # styles
    def scope_css(css):
        kfs = re.findall(r"@keyframes\s+([\w-]+)", css)
        for k in sorted(set(kfs), key=len, reverse=True):
            css = re.sub(r"@keyframes\s+%s\b" % re.escape(k), "@keyframes k_%s_%s" % (slug, k), css)
        # rename keyframe references inside animation declarations
        def fix_decl(mm):
            d = mm.group(0)
            for k in sorted(set(kfs), key=len, reverse=True):
                d = re.sub(r"(?<![\w-])%s(?![\w-])" % re.escape(k), "k_%s_%s" % (slug, k), d)
            return d
        css = re.sub(r"animation(?:-name)?\s*:[^;}]+", fix_decl, css)
        # prefix selectors of every non-@ rule at depth 0 (and inside @media)
        out, i, depth_prefix = [], 0, 'svg[data-fx="%s"]' % slug
        def prefix_sel(sel):
            parts = [p.strip() for p in sel.split(",") if p.strip()]
            res = []
            for p in parts:
                # an agent that scoped its own rules wrote `[data-fx] .bead` / `svg[data-fx="x"] .bead`: strip that
                # token, the page's prefix replaces it (left in place it demands a SECOND data-fx descendant → frozen)
                p = re.sub(r'^(?:svg)?\[data-fx(?:=[^\]]*)?\]\s*', "", p).strip() or "svg"
                if p in ("svg", ":root", ":host"): res.append(depth_prefix)
                elif p.startswith("svg") and (len(p) == 3 or p[3] in ".[: >"): res.append(depth_prefix + p[3:])
                else: res.append(depth_prefix + " " + p)
            return ", ".join(res)
        def walk(block_text):
            res = ""; pos = 0
            while True:
                j = block_text.find("{", pos)
                if j < 0: res += block_text[pos:]; break
                head = block_text[pos:j]
                # find matching brace
                k, d = j, 0
                while k < len(block_text):
                    if block_text[k] == "{": d += 1
                    elif block_text[k] == "}":
                        d -= 1
                        if d == 0: break
                    k += 1
                body = block_text[j + 1:k]
                h = head.strip()
                if h.startswith("@keyframes"):
                    res += head + "{" + body + "}"
                elif h.startswith("@media") or h.startswith("@supports"):
                    res += head + "{" + walk(body) + "}"
                elif h.startswith("@"):
                    res += head + "{" + body + "}"
                else:
                    lead = head[:len(head) - len(head.lstrip())]
                    res += lead + prefix_sel(h) + "{" + body + "}"
                pos = k + 1
            return res
        return walk(css)
    svg = re.sub(r"<style[^>]*>(.*?)</style>", lambda mm: "<style>" + scope_css(mm.group(1)) + "</style>", svg, flags=re.S)
    # the motion gate fingerprints opacity, transforms, dashes and colours — not fill-opacity. The request
    # sketch brightens its pins by fill-opacity alone, so the gate read it as frozen; the same fade by opacity
    # is visually identical on a filled pin and measurable.
    svg = re.sub(r"\{([^{}]*?)fill-opacity:([\d.]+)\}", lambda mm: "{" + mm.group(1) + "opacity:" + mm.group(2) + "}", svg)
    return svg

# ── data joins ────────────────────────────────────────────────────────────────────────────────
wells = {w["key"]: w for w in R["wells"]}
encs = {e["well"]: e for e in R["encodings"]}
CHAIN = ["gate", "request", "chain", "footprint", "response", "errors", "after"]
AROUND = ["dependents", "tests", "motion", "home", "runtime"]
LOOP = {"footprint", "chain"}          # the critic: show these two moving, park the rest
FIELDSTATE = {f["key"]: f["state"] for f in R["facts_fields"]}
def norm(s): return re.sub(r"[^a-z0-9]+", "", s.lower())
SURF = [(norm(s["field"]), s) for s in R["station"]["surfaces"]]
def station_line(w):
    """how many of a well's evidence fields the station draws today, by how — matched by name"""
    hows, hidden, seen = {}, 0, 0
    for ev in w["evidence"]:
        k = norm(re.split(r"[\s(:]", ev.strip())[0])
        if not k: continue
        hit = [s for nk, s in SURF if nk == k or (len(k) > 4 and (nk.startswith(k) or k.startswith(nk)))]
        seen += 1
        if not hit: hidden += 1; continue
        h = hit[0]["how"]
        if h == "hidden": hidden += 1
        else: hows[h] = hows.get(h, 0) + 1
    drawn = sum(hows.values())
    parts = " · ".join("%s %d" % (k, v) for k, v in sorted(hows.items(), key=lambda x: -x[1]))
    return drawn, seen, parts, hidden
def ev_state(ev):
    k = ev.strip()
    for key, st in FIELDSTATE.items():
        if norm(key) == norm(re.split(r"[\s(:]", k)[0]): return st
    return "live"
def chip_label(ch):
    t = re.split(r"\s+[—–-]\s+|\s*\(", ch.strip(), 1)[0]
    return t[:28]

STATE_ICO = {"live": "check", "empty": "x", "unmeasured": "alert", "absent": "eyeoff"}

def well_card(key, n):
    w = wells[key]; e = encs.get(key)
    drawn, seen, parts, hidden = station_line(w)
    evs = "".join('<span class="ev %s" title="%s">%s</span>' % (ev_state(ev), E(ev), E(re.split(r"[\s(]", ev.strip())[0])) for ev in w["evidence"]) or '<span class="ev absent">no field carries it</span>'
    lenses = "".join('<i class="ln" title="raised by the %s lens">%s</i>' % (E(l), E(l[:3])) for l in w["lenses"])
    st = ('<span class="today"><b>station today</b> draws %d of %d evidence fields%s%s</span>' %
          (drawn, seen, (" — " + parts) if parts else "", (" · hidden %d" % hidden) if hidden else ""))
    if e is None:
        return ('<article class="well" id="w-%s" data-group="%s"><div class="rail"><b>%d</b><span class="grp">%s</span></div>'
                '<div class="txt"><h3>%s</h3><p class="q">%s</p><p class="plain">%s</p><div class="evs">%s</div>%s</div></article>'
                % (E(key), E(w["group"]), n, E(w["group"]), E(w["label"]), E(w["question"]), E(w["plain"]), evs, st))
    sk = scope_sketch(e["sketch"], key)
    vd = "".join('<span class="vd %s" title="%s: %s">%s</span>' % ("bad" if v["refuted"] else "ok", E(v["lens"]), E(v["reason"]), E(v["lens"])) for v in e["verdicts"])
    fixes = [v for v in e["verdicts"] if v.get("fix")]
    fx = ('<details class="fix"><summary>fixes the verifiers wrote (%d)</summary><ul>%s</ul></details>' %
          (len(fixes), "".join("<li><b>%s</b> %s</li>" % (E(v["lens"]), E(v["fix"])) for v in fixes))) if fixes else ""
    chs = "".join('<span class="ch" title="%s">%s</span>' % (E(c), E(chip_label(c))) for c in e["channels"])
    verdict = '<span class="verdict %s">%s</span>' % ("ok" if e["survives"] else "bad", "survives" if e["survives"] else "refuted by " + " + ".join(e["refuted_by"]))
    mode = "loop" if key in LOOP else "once"
    return ('<article class="well" id="w-%s" data-group="%s">'
            '<div class="rail"><b>%d</b><span class="grp">%s</span>%s</div>'
            '<div class="txt"><h3>%s</h3><p class="q">%s</p><p class="plain">%s</p><div class="evs">%s</div>%s</div>'
            '<div class="enc"><div class="enc-h"><span class="nm">%s</span>%s</div>'
            '<div class="sk %s" data-mode="%s"><template>%s</template><div class="stage"></div>'
            '<button class="replay" type="button" data-fx-replay="%s" title="replay">%s</button><span class="mode">%s</span></div>'
            '<p class="glance"><b>at a glance</b> %s</p><p class="motion"><b>over time</b> %s</p>'
            '<div class="chs">%s%s</div><p class="ex"><b>the bench</b> %s</p>%s</div></article>'
            % (E(key), E(w["group"]), n, E(w["group"]), lenses,
               E(w["label"]), E(w["question"]), E(w["plain"]), evs, st,
               E(re.split(r"\s+\(adapts|\s+\(", e["name"], 1)[0]), verdict,
               mode, mode, sk, E(key), ico("replay"), "loops" if mode == "loop" else "plays once, parks",
               E(e["glance"]), E(e["motion"]),
               chs, vd, E(e["example_numbers"]), fx))

# ── the critic's tables ───────────────────────────────────────────────────────────────────────
C = R["critic"]
def split_ab(t):
    m = re.match(r"^(.*?)\s+[—–-]\s+\(a\)\s*(.*?);?\s*or\s*\(b\)\s*(.*)$", t, re.S)
    if not m: return (t, "", "")
    return m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
opens = [split_ab(o) for o in C["open"]]
loads = []
for cl in C["channel_load"]:
    m = re.match(r"^([\w /·()-]+?)\s+[—–-]\s+(\d+)/12(.*)$", cl, re.S)
    if m: loads.append((m.group(1).strip(), int(m.group(2)), m.group(3).strip(" .—–-")))
    else: loads.append((cl.split("—")[0].strip(), 0, cl))
corrections = [m for m in C["missing"] if m.startswith("FACT ")]
op_missing = [m for m in C["missing"] if m.startswith("OPERATOR ITEM")]
field_missing = [m for m in C["missing"] if m.startswith("FIELD ")]
def first_sentence(t, n=220):
    t = t.strip(); i = t.find(". ")
    return (t[:i + 1] if 0 < i < n else t[:n] + ("…" if len(t) > n else ""))

# ── page ──────────────────────────────────────────────────────────────────────────────────────
CSS = """
<style>
  /* ── Cognos · Endpoint — the page's own rules; the kit owns the chrome ─────────────────── */
  .artifact-page{ max-width: calc(100% - clamp(16px,4vw,56px) - clamp(40px,6vw,120px)); }
  .lede{ max-width:76ch; } .lede p{ margin:0 0 .6em; }
  h1{ max-width:34ch; text-wrap:balance; }
  .bench{ display:grid; grid-template-columns:repeat(auto-fit,minmax(11rem,1fr)); gap:.5em; margin-top:.8em; }
  .bench .b{ display:grid; gap:.15em; padding:.5em .7em; border-radius:8px; border:1px solid var(--rule); background:var(--raised); }
  .bench .b b{ font-size:1.25em; font-variant-numeric:tabular-nums; }
  .bench .b span{ font-size:var(--fs-xs); color:var(--muted); }
  .keyrow{ display:flex; flex-wrap:wrap; gap:.5em 1.2em; align-items:center; margin:.9em 0 0; font-size:var(--fs-sm); }
  .kchip{ display:inline-flex; align-items:center; gap:.4em; }
  .kchip svg, .ev svg{ width:1.05em; height:1.05em; }

  /* the wells — one card each, in the order a request meets them */
  .wells{ display:grid; gap:.9em; }
  .well{ display:grid; grid-template-columns:3.4em minmax(22ch,34ch) minmax(0,1fr); gap:0 1em; align-items:start;
    border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); padding:.8em .9em .8em .6em; }
  @media (max-width:1100px){ .well{ grid-template-columns:3.2em minmax(0,1fr); } .well .enc{ grid-column:2; margin-top:.8em; } }
  .rail{ display:flex; flex-direction:column; align-items:center; gap:.3em; }
  .rail b{ font-size:1.35em; font-variant-numeric:tabular-nums; color:var(--accent); line-height:1; }
  .rail .grp{ font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); writing-mode:vertical-rl; transform:rotate(180deg); }
  .rail .ln{ font-style:normal; font-size:var(--fs-min); color:var(--muted); opacity:.75; letter-spacing:.04em; }
  .well h3{ margin:0 0 .25em; font-size:1.06em; }
  .well .q{ font-weight:700; margin:0 0 .35em; }
  .well .plain{ font-size:1.02em; color:var(--ink-soft); margin:0 0 .5em; }
  .evs{ display:flex; flex-wrap:wrap; gap:.25em; margin-bottom:.45em; }
  .ev{ display:inline-flex; align-items:center; gap:.3em; font-size:var(--fs-min); padding:.08em .45em; border-radius:999px;
    border:1px solid color-mix(in srgb,currentColor 30%,transparent); font-variant-numeric:tabular-nums; }
  .ev.live{ color:#2e9e6b; } .ev.empty{ color:var(--muted); } .ev.unmeasured{ color:#c8871b; border-style:dashed; }
  .ev.absent{ color:color-mix(in srgb,currentColor 55%,transparent); border-style:dotted; }
  .today{ display:block; font-size:var(--fs-xs); color:var(--muted); } .today b{ color:var(--ink-soft); }
  .enc{ min-width:0; }
  .enc-h{ display:flex; align-items:baseline; gap:.6em; flex-wrap:wrap; margin-bottom:.4em; }
  .enc-h .nm{ font-weight:700; }
  .verdict{ font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; padding:.12em .5em; border-radius:999px; border:1px solid currentColor; }
  .verdict.ok{ color:#2e9e6b; } .verdict.bad{ color:#b4462f; }
  .sk{ position:relative; border:1px solid var(--rule); border-radius:8px; background:var(--raised); padding:.5em .6em .4em; overflow:hidden; }
  .sk .stage{ display:block; } .sk .stage svg{ display:block; width:100%; height:auto; max-height:19em; }
  .sk .replay{ position:absolute; top:.45em; right:.45em; width:1.8em; height:1.8em; display:grid; place-items:center; padding:0;
    background:var(--card); color:var(--muted); border:1px solid var(--rule); border-radius:6px; cursor:pointer; }
  .sk .replay:hover{ color:var(--accent); border-color:var(--accent); } .sk .replay svg{ width:1em; height:1em; }
  .sk .mode{ position:absolute; bottom:.35em; right:.6em; font-size:var(--fs-min); color:var(--muted); letter-spacing:.06em; }
  .sk.once .stage svg *{ animation-iteration-count:1 !important; animation-fill-mode:forwards !important; }
  @media (prefers-reduced-motion: reduce){ svg[data-fx] *{ animation-duration:.001s !important; animation-iteration-count:1 !important; animation-fill-mode:forwards !important; } }
  .glance, .motion{ margin:.45em 0 0; font-size:var(--fs-sm); } .glance b, .motion b, .ex b{ color:var(--accent); font-weight:700; margin-right:.3em; }
  .chs{ display:flex; flex-wrap:wrap; gap:.25em; margin-top:.5em; align-items:center; }
  .ch{ font-size:var(--fs-min); padding:.08em .45em; border-radius:4px; background:var(--accent-soft); color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 30%,transparent); }
  .vd{ font-size:var(--fs-min); padding:.08em .45em; border-radius:4px; border:1px solid currentColor; margin-left:.15em; }
  .vd.ok{ color:#2e9e6b; } .vd.bad{ color:#b4462f; text-decoration:line-through; }
  .ex{ margin:.45em 0 0; font-size:var(--fs-xs); color:var(--muted); }
  .fix{ margin-top:.4em; font-size:var(--fs-xs); } .fix summary{ cursor:pointer; color:var(--muted); } .fix ul{ margin:.3em 0 0; padding-left:1.2em; } .fix li{ margin:.2em 0; } .fix b{ color:var(--ink-soft); }

  /* corrections · load · seating · open · blind side · skill */
  .corr{ display:grid; gap:.5em; }
  .corr .c{ display:grid; grid-template-columns:auto 1fr; gap:.7em; align-items:start; padding:.55em .7em; border-radius:8px; border-left:3px solid #c8871b; background:color-mix(in srgb,#c8871b 8%,transparent); }
  .corr .c b{ color:#c8871b; white-space:nowrap; }
  .load{ display:grid; grid-template-columns:auto 6em 1fr; gap:.35em .8em; align-items:center; max-width:100%; }
  .load .n{ font-variant-numeric:tabular-nums; text-align:right; color:var(--muted); font-size:var(--fs-sm); }
  .load .bar{ height:.7em; border-radius:3px; background:color-mix(in srgb,currentColor 10%,transparent); overflow:hidden; }
  .load .bar i{ display:block; height:100%; background:var(--accent); }
  .load .v{ font-size:var(--fs-xs); color:var(--ink-soft); }
  .seat{ display:grid; grid-template-columns:auto 1fr; gap:.4em 1em; align-items:baseline; }
  .seat .r{ font-weight:700; white-space:nowrap; } .seat .w{ font-size:var(--fs-sm); }
  .seat .w .ch{ margin-right:.2em; } .seat .why{ color:var(--muted); font-size:var(--fs-xs); display:block; margin-top:.15em; }
  .open{ display:grid; gap:.55em; counter-reset:r; }
  .open .o{ display:grid; grid-template-columns:auto 1fr; gap:.7em; padding:.55em .7em; border:1px solid var(--rule); border-radius:8px; background:var(--card); }
  .open .o .id{ font-weight:700; color:var(--accent); font-variant-numeric:tabular-nums; }
  .open .o b{ display:block; margin-bottom:.25em; }
  .open .ab{ display:grid; grid-template-columns:1fr 1fr; gap:.6em; font-size:var(--fs-sm); }
  .open .ab span{ padding:.4em .55em; border-radius:6px; background:var(--raised); border:1px solid var(--rule); }
  .open .ab span::before{ font-weight:700; color:var(--accent); margin-right:.4em; }
  .open .ab span:first-child::before{ content:"a"; } .open .ab span:last-child::before{ content:"b"; }
  .blind{ display:grid; grid-template-columns:repeat(auto-fit,minmax(20rem,1fr)); gap:.8em; }
  .blind h4{ margin:0 0 .3em; font-size:1em; } .blind ul{ margin:0; padding-left:1.1em; font-size:var(--fs-sm); } .blind li{ margin:.2em 0; }
  .blind .note{ font-size:var(--fs-sm); color:var(--ink-soft); }
  .skill{ display:grid; grid-template-columns:repeat(auto-fit,minmax(16rem,1fr)); gap:.8em; }
  .skill .s{ padding:.6em .75em; border-radius:8px; border:1px solid var(--rule); background:var(--raised); font-size:var(--fs-sm); }
  .skill .s b{ display:block; margin-bottom:.3em; color:var(--accent); }
  .skill .s ul{ margin:0; padding-left:1.1em; } .skill .s li{ margin:.15em 0; }
  .decision{ padding:.6em .8em; border-left:3px solid var(--accent); background:var(--accent-soft); border-radius:6px; font-size:var(--fs-sm); max-width:76ch; }
  .decision b{ color:var(--accent); }
  .muted{ color:var(--muted); }
</style>
"""

def sec(n, icon, title, count, body, cls="sec panel"):
    return ('<section class="%s" data-sec="%d"><div class="sec-head"><h2>%s%s</h2><span class="n">%s</span></div>%s</section>'
            % (cls, n, ico(icon), E(title), E(count), body))

ex = R["example"]
bench = ('<div class="bench">'
         '<div class="b"><b>%s</b><span>the bench · entity %s</span></div>'
         '<div class="b"><b>55</b><span>fields an endpoint node carries (40 live · 6 empty · 2 unmeasured · 7 absent here)</span></div>'
         '<div class="b"><b>19</b><span>wire kinds touch it, in or out</span></div>'
         '<div class="b"><b>12</b><span>wells — five lenses, one judge</span></div>'
         '<div class="b"><b>6 / 12</b><span>encodings survive three refuters; the six refuted carry their fix</span></div>'
         '<div class="b"><b>53</b><span>surfaces the station draws today — 14 as text, 9 hidden</span></div></div>'
         % (E(ex["id"].replace("endpoint:", "")), E(ex["entity"])))

lede = ('<div class="lede"><p><b>Gabe Cognos, first run.</b> For one kind of element — the API endpoint — the questions your attention '
        'is pulled into, the feed fields that answer each, and a representation that answers it <i>without reading</i>: count, length, '
        'colour, shape, and motion that means something. Read on the bench element, never estimated.</p>'
        '<p>The reader model came back different from the default: your calibrated suit is <b>Sequential-Procedural</b> — an endpoint '
        'reads as an ordered chain, time flowing top to bottom. The wells below are in the order a request meets them; the surround comes after.</p>'
        '<div class="keyrow">'
        '<span class="kchip">%s<b>live</b> the field carries a value</span>'
        '<span class="kchip">%s<b>empty</b> measured, nothing there</span>'
        '<span class="kchip">%s<b>unmeasured</b> never looked</span>'
        '<span class="kchip">%s<b>absent</b> the bench has no such field</span>'
        '<span class="kchip"><span class="vd ok">lens</span> passed &nbsp; <span class="vd bad">lens</span> refuted</span></div>%s</div>'
        % (ico("check", "ev live"), ico("x", "ev empty"), ico("alert", "ev unmeasured"), ico("eyeoff", "ev absent"), bench))

chain_cards = "".join(well_card(k, i + 1) for i, k in enumerate(CHAIN) if k in wells)
around_cards = "".join(well_card(k, len(CHAIN) + i + 1) for i, k in enumerate(AROUND) if k in wells)

corr_html = '<div class="corr">' + "".join(
    '<div class="c"><b>%d</b><span>%s</span></div>' % (i + 1, E(c.replace("FACT ", "", 1))) for i, c in enumerate(corrections)) + '</div>'

load_html = '<div class="load">' + "".join(
    '<span>%s</span><span class="n">%d / 12</span><span class="bar" title="%d of 12 encodings spend it"><i style="width:%d%%"></i></span><span></span><span></span><span class="v">%s</span>'
    % (E(name), n, n, round(100 * n / 12), E(first_sentence(v, 260))) for name, n, v in loads) + '</div>'

seat_html = '<div class="seat">' + "".join(
    '<span class="r">%s</span><span class="w">%s<span class="why">%s</span></span>'
    % (E(o["region"]), "".join('<a class="ch" href="#w-%s">%s</a>' % (E(w), E(w)) for w in o["wells"]), E(first_sentence(o["why"], 230)))
    for o in C["reading_order"]) + '</div>'

open_html = '<div class="open">' + "".join(
    '<div class="o"><span class="id">R%d</span><div><b>%s</b>%s</div></div>'
    % (i + 1, E(t), ('<div class="ab"><span>%s</span><span>%s</span></div>' % (E(a), E(b))) if a else "")
    for i, (t, a, b) in enumerate(opens)) + '</div>'

blind_html = ('<div class="blind">'
              '<div><h4>The feed cannot say</h4><p class="note">%s</p></div>'
              '<div><h4>Your list, not yet a well (%d)</h4><ul>%s</ul></div>'
              '<div><h4>Fields with no well (%d) · fields no reader asks about (%d)</h4><ul>%s</ul><p class="note">Correctly orphaned: %s</p></div>'
              '</div>'
              % (E(first_sentence(R["coverage_note"], 620)),
                 len(op_missing), "".join("<li>%s</li>" % E(first_sentence(m.replace("OPERATOR ITEM · ", ""), 260)) for m in op_missing),
                 len(field_missing), len(R["orphan_fields"]), "".join("<li>%s</li>" % E(first_sentence(m.replace("FIELD · ", ""), 220)) for m in field_missing),
                 E(" · ".join(R["orphan_fields"]))))

skill_html = ('<div class="decision"><b>DECISION</b> Gabe Cognos as its own skill — the SPEC layer between the reader model (gabe-lens) and the '
              'instrument builders (gabe-imagine, the console). Not written to disk until you say <b>land it</b>; this page is its first run.</div>'
              '<div class="skill" style="margin-top:.8em">'
              '<div class="s"><b>input</b><ul><li>one kind · one bench element · the frozen feed</li><li>the reader model (the calibrated suit)</li><li>the encoding library: station grammar · console regions · motion/static patterns · namethatui</li></ul></div>'
              '<div class="s"><b>the run</b><ul><li>facts computed, never estimated</li><li>five lenses propose wells → one judge merges</li><li>an encoder per batch draws a sketch on real numbers</li><li>three refuters: drawable · collision · motion contract</li><li>a critic: missing · channel load · seating · open rulings</li></ul></div>'
              '<div class="s"><b>output</b><ul><li>a WELL MAP per kind (this page), the operator rules on it</li><li>the rulings feed the kind lab (dims · layouts) and the console</li><li>next kind only after the rulings land — one at a time</li></ul></div>'
              '</div>')

verdict_html = '<p class="muted" style="max-width:80ch;margin-top:.6em">%s</p>' % E(C["verdict"])

SCRIPT = """
<script>
(function(){
  /* every sketch is a <template>; the stage holds a live clone. Replay = a fresh clone (CSS animations restart);
     the cog's Motion switch calls __rebuildMotion() then pauses — the contract's order. */
  window.FXREPLAY = window.FXREPLAY || {};
  var sks = document.querySelectorAll('.sk');
  sks.forEach(function(sk){
    var tpl = sk.querySelector('template'), stage = sk.querySelector('.stage'), btn = sk.querySelector('.replay');
    var slug = btn.getAttribute('data-fx-replay');
    function build(){
      stage.innerHTML = '';
      stage.appendChild(tpl.content.cloneNode(true));
      var svg = stage.querySelector('svg');
      if (svg && window.MOTION && !MOTION.on && svg.pauseAnimations) svg.pauseAnimations();
    }
    window.FXREPLAY[slug] = build;
    btn.addEventListener('click', build);
    build();
  });
  window.__rebuildMotion = function(){ Object.keys(window.FXREPLAY).forEach(function(k){ window.FXREPLAY[k](); }); };
})();
</script>
"""

page = ("<title>Cognos · Endpoint</title>\n" + BLOCK1 + "\n" + CSS + '\n<div class="artifact-page">\n'
        + '<h1>Which questions does an endpoint pull you into — and what answers them without reading?</h1>\n' + lede + "\n"
        + sec(1, "route", "A request's life — the seven wells in order", "gate → after",
              '<p class="muted" style="max-width:80ch">Each card: the question, the plain line, the evidence fields with their state on the bench, what the station draws today, then the encoding — a sketch on the bench\'s real numbers, what lands at a glance, what the motion means, the channels it spends, and the three refuters\' verdicts. Two sketches loop (the critic\'s pick); the rest play once and park at their finished frame. Replay any with ↻.</p><div class="wells">' + chain_cards + '</div>')
        + sec(2, "orbit", "Around it — who fires it, what proves it, whose it is", "5 wells",
              '<div class="wells">' + around_cards + '</div>')
        + sec(3, "alert", "Three corrections before the pictures", "the critic", corr_html)
        + sec(4, "bars", "Channel load — what twelve encodings spend", "per channel",
              '<p class="muted" style="max-width:80ch">Motion is on every card and eight of them mint their own clock; the critic\'s ruling request is one shared clock. Position is the geometry law, so full load there is correct.</p>' + load_html)
        + sec(5, "layout", "Where each well sits on the console", "regions", seat_html)
        + sec(6, "gavel", "Open — rulings only you can make", "R1–R%d" % len(opens),
              '<p class="muted" style="max-width:80ch">Reply by number: <b>R1 a</b>, <b>R4 b</b>. R1 is the one the critic asks for first.</p>' + open_html + verdict_html)
        + sec(7, "eyeoff", "The blind side", "honest-empty", blind_html)
        + sec(8, "sparkles", "The skill — Gabe Cognos", "proposal", skill_html)
        + "\n</div>\n" + BLOCK2 + "\n" + BLOCK3 + "\n" + SCRIPT)

out = HERE / "cognos-endpoint.html"
out.write_text(page, encoding="utf-8")
print("wrote", out, len(page), "bytes ·", len(CHAIN) + len(AROUND), "wells ·", len(R["encodings"]), "sketches ·", len(opens), "open rulings")
