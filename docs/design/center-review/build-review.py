#!/usr/bin/env python3
"""build-review.py — Centre Estate Review: the workflow's return (seven maps · findings with verdicts · the plan ·
the critic) as a house-chrome page the operator acts from: the state map as a chain, the findings ranked with the
verifiers' marks, the ordered regen plan with pasteable commands, propagation per twin, the rulings owed."""
import json, re, html, pathlib, importlib.util
HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("cognos_lib", HERE.parent / "cognos" / "cognos_lib.py"); L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
E, ico = L.E, L.ico
R = json.load(open(HERE / "review.json", encoding="utf-8"))
P, CR = R["plan"], R.get("critic") or {}

ICO = dict(L.ICO)
ICO.update({
  "chain": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  "list": '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
  "play": '<polygon points="6 3 20 12 6 21 6 3"/>',
  "send": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  "map": '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>',
})
L.ICO.update(ICO)

SEV = {"blocks-regen": "#b4462f", "wrong-on-page": "#c8871b", "misleading": "#a855f7", "cosmetic": "#7a8595", "debt": "#7a8595"}
def sev(s): return '<span class="sv" style="--c:%s">%s</span>' % (SEV.get(s, "#7a8595"), E(s))
def kind(k): return '<span class="kd">%s</span>' % E(k)
def sec(n, icon, title, count, body):
    return ('<section class="sec panel" data-sec="%d"><div class="sec-head"><h2>%s%s</h2><span class="n">%s</span></div>%s</section>' % (n, ico(icon), E(title), E(count), body))
def cmd(c):
    c = c.strip()
    if not c or c.lower().startswith("manual"): return '<span class="man">%s</span>' % E(c or "manual")
    return '<pre class="cmd">%s</pre>' % E(c)

# ── state map ──────────────────────────────────────────────────────────────────────────────────────────────
state = '<div class="chain">' + "".join(
    '<div class="st"><b>%s</b><p>%s</p><i>%s</i></div>' % (E(s["stage"]), E(s["items"]), E(s["health"])) for s in P["state_map"]) + '</div>'
if CR.get("state_map"):
    state += '<p class="ctx muted"><b>the critic adds</b> ' + " · ".join("%s — %s" % (E(s["stage"]), E(s["health"])) for s in CR["state_map"]) + '</p>'

# ── findings ───────────────────────────────────────────────────────────────────────────────────────────────
F = {f["id"]: f for f in R["findings"]}
def vmarks(f):
    return "".join('<span class="vd %s" title="%s%s">%s</span>' % ("bad" if v["refuted"] else "ok", E(v["reason"]), (" — " + E(v["adjust"])) if v.get("adjust") else "", E(v["lens"])) for v in f.get("verdicts", []))
rows = []
for r in P["ranked"]:
    f = F.get(r["id"], {})
    rows.append('<article class="fd"><div class="rk"><b>%d</b></div><div class="bd"><h3>%s %s %s</h3>'
                '<p class="wh"><b>where</b> %s</p><p class="ev"><b>evidence</b> %s</p><p class="wy"><b>why here</b> %s</p>'
                '<p class="fx"><b>fix</b> %s</p><p class="cs"><b>cost</b> %s</p><div class="vds">%s</div></div></article>'
                % (r["rank"], E(r["title"]), sev(r["severity"]), kind(f.get("kind", "")), E(f.get("where", "")), E(f.get("evidence", "")), E(r["why_here"]), E(r["fix"]), E(r["cost"]), vmarks(f)))
findings = '<div class="fds">' + "".join(rows) + '</div>'
refuted = [f for f in R["findings"] if not f.get("survives", True)]
if refuted:
    findings += '<details class="ref"><summary>%d findings refuted as not reproducible today</summary><ul>%s</ul></details>' % (
        len(refuted), "".join('<li><b>%s</b> %s — <i>%s</i></li>' % (E(f["id"]), E(f["title"]), E((next((v for v in f["verdicts"] if v["lens"] == "real"), {}) or {}).get("reason", ""))) for f in refuted))

# ── the plan ───────────────────────────────────────────────────────────────────────────────────────────────
def plan_steps(steps, cls=""):
    return '<ol class="plan%s">' % cls + "".join(
        '<li><div class="ph"><b>%d</b><span>%s</span></div>%s<p class="why"><b>why</b> %s</p><p class="meta"><b>cost</b> %s <b>gate</b> %s</p></li>'
        % (s["step"], E(s["do"]), cmd(s["command"]), E(s["why"]), E(s["cost"]), E(s["gate"])) for s in steps) + '</ol>'
plan = plan_steps(P["plan"])
if CR.get("plan"):
    plan += '<p class="ctx"><b>the critic adds</b></p>' + plan_steps(CR["plan"], " add")

prop = '<div class="props">' + "".join(
    '<div class="pr"><h3>%s</h3><p><b>what</b> %s</p>%s<p class="meta"><b>cost</b> %s</p><p class="risk"><b>risk</b> %s</p></div>'
    % (E(p["target"]), E(p["what"]), cmd(p["command"]), E(p["cost"]), E(p["risk"])) for p in P["propagate"] + (CR.get("propagate") or [])) + '</div>'

# ── the seven maps ─────────────────────────────────────────────────────────────────────────────────────────
maps = ""
for m in R["reads"]:
    maps += ('<details class="mp"><summary>%s — %d rows</summary><div class="tw"><table><thead><tr><th>item</th><th>emits / reads</th><th>depends on</th><th>guarded by</th><th>note</th></tr></thead><tbody>%s</tbody></table></div></details>'
             % (E(m["area"]), len(m["map"]), "".join('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>' % tuple(E(x[k]) for k in ("item", "emits_or_reads", "depends_on", "guarded_by", "note")) for x in m["map"])))

opens = P["open"] + (CR.get("open") or [])
open_html = '<ol class="opens">' + "".join('<li>%s</li>' % E(o) for o in opens) + '</ol>'
verdict = '<p class="verd">%s</p>' % E(P["verdict"]) + ('<p class="verd crit"><b>the critic</b> %s</p>' % E(CR["verdict"]) if CR.get("verdict") else "")

n_real = sum(1 for f in R["findings"] if f.get("survives", True))
CSS = """
<style>
  .artifact-page{ max-width: calc(100% - clamp(16px,4vw,56px) - clamp(40px,6vw,120px)); }
  h1{ max-width:34ch; text-wrap:balance; } .lede{ max-width:78ch; } .lede p{ margin:0 0 .6em; } .ctx{ max-width:86ch; margin:0 0 .6em; } .muted{ color:var(--muted); }
  .chain{ display:grid; grid-template-columns:repeat(auto-fill,minmax(min(13rem,100%),1fr)); gap:.5em; overflow-x:auto; }
  .st p, .st i{ overflow-wrap:anywhere; }   /* a path or key in a health line must never set the grid's track width */
  .st{ display:grid; gap:.3em; padding:.55em .7em; border-radius:8px; border:1px solid var(--rule); background:var(--raised); position:relative; }
  .st b{ font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--accent); } .st p{ margin:0; font-size:var(--fs-sm); } .st i{ font-style:normal; font-size:var(--fs-xs); color:var(--ink-soft); }
  .sv{ display:inline-block; font-size:var(--fs-min); letter-spacing:.05em; text-transform:uppercase; padding:.1em .5em; border-radius:999px; color:var(--c); border:1px solid var(--c); margin-left:.4em; vertical-align:middle; }
  .kd{ display:inline-block; font-size:var(--fs-min); padding:.1em .45em; border-radius:4px; background:var(--accent-soft); color:var(--accent); margin-left:.3em; vertical-align:middle; }
  .fds{ display:grid; gap:.6em; }
  .fd .bd, .plan li, .pr, .st{ min-width:0; }   /* a long command or path must wrap inside its cell, never widen the page */
  .cmd{ max-width:100%; }
  .fd{ display:grid; grid-template-columns:2.6em minmax(0,1fr); gap:.6em; padding:.6em .8em .6em .5em; border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); }
  .fd .rk b{ font-size:1.3em; color:var(--accent); font-variant-numeric:tabular-nums; }
  .fd h3{ margin:0 0 .3em; font-size:1.02em; } .fd p{ margin:.15em 0; font-size:var(--fs-sm); } .fd p b{ color:var(--muted); font-weight:700; margin-right:.35em; font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; }
  .fd .ev{ font-family:ui-monospace,monospace; color:var(--ink-soft); word-break:break-word; } .fd .wh{ font-family:ui-monospace,monospace; }
  .vds{ margin-top:.3em; } .vd{ font-size:var(--fs-min); padding:.08em .45em; border-radius:4px; border:1px solid currentColor; margin-right:.25em; cursor:help; } .vd.ok{ color:#2e9e6b; } .vd.bad{ color:#b4462f; text-decoration:line-through; }
  .ref{ margin-top:.6em; font-size:var(--fs-sm); } .ref summary{ cursor:pointer; color:var(--muted); } .ref ul{ margin:.3em 0 0; padding-left:1.2em; } .ref li{ margin:.2em 0; } .ref i{ color:var(--muted); }
  .plan{ margin:0; padding:0; list-style:none; display:grid; gap:.6em; counter-reset:s; }
  .plan li{ padding:.6em .8em; border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); }
  .plan.add li{ border-style:dashed; }
  .ph{ display:flex; align-items:baseline; gap:.6em; margin-bottom:.35em; } .ph b{ color:var(--accent); font-size:1.2em; font-variant-numeric:tabular-nums; } .ph span{ font-weight:700; }
  .cmd{ margin:.3em 0; padding:.5em .7em; border-radius:6px; background:color-mix(in srgb,currentColor 7%,transparent); font-size:var(--fs-sm); white-space:pre-wrap; word-break:break-word; overflow-x:auto; }
  .man{ display:inline-block; margin:.3em 0; padding:.2em .55em; border-radius:6px; border:1px dashed var(--rule); font-size:var(--fs-sm); color:var(--ink-soft); }
  .plan .why, .plan .meta, .pr p{ margin:.15em 0; font-size:var(--fs-sm); } .plan p b, .pr p b{ color:var(--muted); font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; margin-right:.35em; }
  .plan .meta b + b, .plan .meta b:nth-of-type(2){ margin-left:.8em; }
  .props{ display:grid; grid-template-columns:repeat(auto-fit,minmax(22rem,1fr)); gap:.7em; }
  .pr{ padding:.6em .8em; border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); } .pr h3{ margin:0 0 .3em; font-size:1.02em; } .pr .risk{ color:#b4462f; }
  .sec, .mp, .tw{ min-width:0; max-width:100%; }   /* a 1,480px table inside a closed details still widens its flex parent — pin the chain */
  .mp{ margin:.3em 0; font-size:var(--fs-sm); } .mp summary{ cursor:pointer; font-weight:700; } .tw{ overflow-x:auto; margin-top:.4em; }
  .mp table{ border-collapse:collapse; width:100%; min-width:60rem; } .mp th, .mp td{ text-align:left; vertical-align:top; padding:.3em .5em; border-bottom:1px solid var(--rule); font-size:var(--fs-xs); }
  .mp th{ font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
  .opens{ margin:0; padding-left:1.4em; display:grid; gap:.4em; font-size:var(--fs-sm); }
  .verd{ max-width:86ch; margin:.6em 0 0; padding:.6em .8em; border-left:3px solid var(--accent); background:var(--accent-soft); border-radius:6px; font-size:var(--fs-sm); }
  .verd.crit{ border-left-color:#c8871b; background:color-mix(in srgb,#c8871b 8%,transparent); }
</style>
"""
page = ("<title>Centre Estate Review</title>\n" + L.BLOCK1 + "\n" + CSS + '\n<div class="artifact-page">\n'
        + '<h1>Is the command centre consistent enough to regenerate — and what goes first?</h1>'
        + '<div class="lede"><p>Seven readers measured the estate — generators, pages and links, the field contract between emitters and readers, the skills and regen entry points, the twins and the frozen example, the batteries, the work still waiting in design folders. '
          'Three verifiers checked every finding: is it real today, is the severity honest, is the fix legal under the repo’s rules. <b>%d findings survive, %d were refuted.</b> The plan below is the order to run.</p></div>\n' % (n_real, len(refuted))
        + sec(1, "chain", "The estate, as a chain", "config → twins", state)
        + sec(2, "alert", "What is inconsistent — ranked by what it changes next", "%d real" % n_real, findings)
        + sec(3, "play", "The regeneration plan — in order", "this repo", plan)
        + sec(4, "send", "Propagation — per twin", "gustify · gastify", prop)
        + sec(5, "gavel", "Rulings only you can make", "%d" % len(opens), open_html + verdict)
        + sec(6, "map", "The seven maps", "what each reader saw", maps)
        + "\n</div>\n" + L.BLOCK2 + "\n" + L.BLOCK3)
out = HERE / "center-review.html"; out.write_text(page, encoding="utf-8")
print("wrote", out, len(page), "bytes ·", n_real, "real findings ·", len(P["plan"]), "plan steps ·", len(opens), "open")
