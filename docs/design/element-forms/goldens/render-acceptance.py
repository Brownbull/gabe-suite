#!/usr/bin/env python3
"""§A4 step 6 — the acceptance sheet: every golden per arm beside the value the fresh feed holds. Generated, never authored.
usage: render-acceptance.py <expected.json> <forms.json> <out.html> [<review-a4.md>]"""
import html, json, sys
from pathlib import Path
exp, feed, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
rev = Path(sys.argv[4]) if len(sys.argv) > 4 else None
E = json.loads(exp.read_text()); F = json.loads(feed.read_text())
ARM = {"1": "core", "2": "ids", "3a": "kinds", "3b": "paths", "4": "short · schema", "5a": "switches", "5b": "paths · walk", "6": "effects", "7": "contract",
       "8": "kinds · fn/task/handler", "9": "tests", "10a": "short · model+migration", "10b": "short · setting", "10c": "short · mirror",
       "11a": "frontend · guards", "11b": "frontend · hooks/client", "11c": "frontend · reason", "11d": "frontend · controls/stores"}
MARK = {"V": "verified in source", "R": "read", "P": "projected", "U": "unknown until measured"}
import importlib.util
_spec = importlib.util.spec_from_file_location("chk", exp.parent / "check-goldens.py"); chk = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(chk)
def verdict(g):
    found, value, stopped = chk.walk(F, g["get"])
    if not found: return "MISSING", stopped or "path stopped"
    ok, text = chk.verdict(g, value)
    return ("MATCH" if ok else "MISMATCH"), (json.dumps(value, default=str)[:160] if ok else text[:160])
by = {}
for g in E["goldens"]:
    by.setdefault(g["slice"], []).append(g)
counts = {"MATCH": 0, "MISMATCH": 0, "MISSING": 0}
secs = []
for sl in sorted(by, key=lambda s: (int("".join(ch for ch in s if ch.isdigit()) or 0), s)):
    rows = []
    for g in by[sl]:
        v, val = verdict(g); counts[v] += 1
        rows.append(f'<tr class="{v.lower()}"><td class="m" title="{MARK.get(g["mark"], "")}">{g["mark"]}</td><td>{html.escape(g["says"])}</td><td class="path">{html.escape(" › ".join(map(str, g["get"])))}</td><td class="val">{html.escape(val)}</td><td class="v">{v}</td></tr>')
    secs.append(f'<section><h2><span class="pill">{html.escape(sl)}</span> {html.escape(ARM.get(sl, ""))} <small>{len(by[sl])} goldens</small></h2><table><thead><tr><th>mark</th><th>the golden says</th><th>where in the feed</th><th>the feed holds</th><th></th></tr></thead><tbody>{"".join(rows)}</tbody></table></section>')
ledger = ""
if rev and rev.exists():
    t = rev.read_text(encoding="utf-8"); i = t.find("## Landed"); j = t.find("## Refuted", i)
    if i > 0: ledger = f'<section><h2>The fix ledger (from review-a4.md)</h2><pre>{html.escape(t[i:j].strip())}</pre></section>'
page = f'''<title>Element Forms · A4 acceptance</title>
<style>:root{{--ink:#1a1a1a;--bg:#fafaf7;--rule:#ddd;--ok:#1f7a3a;--bad:#b3261e;--miss:#8a6d00;--pill:#e8e2d0}}
:root:not([data-theme="light"]) {{ }} @media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--ink:#e8e8e4;--bg:#15161a;--rule:#333;--pill:#3a3628}}}} :root[data-theme="dark"]{{--ink:#e8e8e4;--bg:#15161a;--rule:#333;--pill:#3a3628}}
body{{margin:0;padding:24px 16px 48px;background:var(--bg);color:var(--ink);font:14px/1.45 ui-monospace,monospace;max-width:1200px}}
h1{{font-size:1.4em;margin:0 0 4px}} h2{{font-size:1.05em;margin:28px 0 8px}} small{{font-weight:400;opacity:.7}} .pill{{background:var(--pill);border-radius:999px;padding:1px 9px}}
table{{border-collapse:collapse;width:100%;font-size:.93em}} th,td{{text-align:left;padding:5px 8px;border-bottom:1px solid var(--rule);vertical-align:top}} th{{font-weight:600;opacity:.75}}
td.m{{width:2em;text-align:center}} td.path{{opacity:.7;max-width:26em;word-break:break-all}} td.val{{max-width:22em;word-break:break-all}} td.v{{font-weight:700}}
tr.match td.v{{color:var(--ok)}} tr.mismatch td.v{{color:var(--bad)}} tr.missing td.v{{color:var(--miss)}} pre{{white-space:pre-wrap;font-size:.88em;border-left:3px solid var(--rule);padding-left:12px}}
.tally{{display:flex;gap:18px;margin:8px 0 18px}} .tally b{{font-size:1.3em}}</style>
<h1>Element Forms · §A4 acceptance</h1>
<div>{html.escape(E.get("says", ""))} · target <b>{html.escape(E.get("target", ""))}</b> · feed head <b>{html.escape(str(F.get("head")))}</b> · marks: V verified in source · R read · P projected · U unknown until measured</div>
<div class="tally"><span><b>{counts["MATCH"]}</b> match</span><span><b>{counts["MISMATCH"]}</b> mismatch</span><span><b>{counts["MISSING"]}</b> missing</span><span><b>{len(E["goldens"])}</b> goldens across {len(by)} slices</span></div>
{"".join(secs)}
{ledger}'''
out.write_text(page, encoding="utf-8"); print(f"{out}: {counts} · {len(E['goldens'])} goldens · {len(by)} slices")
