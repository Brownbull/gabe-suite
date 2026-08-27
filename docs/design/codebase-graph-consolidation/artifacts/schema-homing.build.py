#!/usr/bin/env python3
"""Assemble the Schema Homing artifact: kit chrome (3 blocks) + authored content + two motion stages."""
import re
import os,sys
S=os.environ.get('GABE_ART_OUT') or '/tmp/claude-1000/-home-khujta-projects-gabe-lens/7a371e75-06b2-476e-b06e-ede2b294125e/scratchpad'
KIT=os.environ.get('GABE_ART_KIT') or os.path.expanduser('~/.claude/skills/gabe-artifact/assets/artifact-chrome.html')
kit=open(KIT).read()
head=kit[:kit.index('<div class="artifact-page">')]
tail=kit[kit.index('<!-- ══ BLOCK 2'):]
head=head.replace('<title>Artifact chrome kit — gabe-artifact</title>','<title>Schema Homing</title>')
head=re.sub(r'<!--.*?-->','',head,count=1,flags=re.S) if head.lstrip().startswith('<!--') else head

ENT={'allergen':'#3f6d4c','progression':'#8e4585','auth':'#5a53a8','settings':'#a35a00','legal-consent':'#0f766e'}
SCH='#0e9aa7'; RED='#e5484d'; INK='#dfe5ee'; MUT='#8a93a6'
W=240; H=24
# ── STAGE 1 · the move ────────────────────────────────────────────────────────
src={'allergen':(20,56),'progression':(20,318)}
chips=[ # (name, src entity, target entity, consumer key)
 ('DietaryProfileInput','allergen','auth','scr'),('HouseholdFormatInput','allergen','auth','scr'),
 ('NotificationPreferencesInput','allergen','auth','scr'),('PrivacyPermissionsInput','allergen','auth','scr'),
 ('UserFormatInput','allergen','auth','scr'),('ExplorationPreferencesInput','allergen','settings','pse'),
 ('ExplorationPreferencesPatch','allergen','settings','pse'),
 ('MeResponse','progression','auth','me'),('UserSummary','progression','auth','me'),('HouseholdSummary','progression','auth','me'),
 ('MembershipSummary','progression','auth','me'),('PreferencesSummary','progression','auth','me'),
 ('SettingsResponse','progression','settings','gs'),('AccountExportResponse','progression','legal-consent','ax')]
cons={ # key: (entity, x, y, label, sub)
 'scr':('auth',450,56,'SetupCompleteRequest','nests 6 fields · schemas/setup.py:21'),
 'me':('auth',450,300,'GET /me · POST /setup/complete','touches / resp · api/setup.py:18'),
 'pse':('settings',790,56,'PATCH /settings/exploration','touches+consumes · user_settings.py:23'),
 'gs':('settings',790,190,'GET /settings · PATCH /settings/*','4 endpoints touch · user_settings.py:24'),
 'ax':('legal-consent',790,400,'POST /account/export','touches · api/account.py:19')}
# source positions
pos={}; cnt={'allergen':0,'progression':0}
for nm,se,te,ck in chips:
    x,y=src[se]; i=cnt[se]; cnt[se]+=1; pos[nm]=(x,y+34+i*(H+6))
# destination positions: under the consumer box, one after another
dst={}; slot={k:0 for k in cons}
for nm,se,te,ck in chips:
    e,cx,cy,lab,sub=cons[ck]; i=slot[ck]; slot[ck]+=1; dst[nm]=(cx+14,cy+44+i*(H+6))
g=[]
def txt(x,y,s,fill=INK,size=12,extra=''): return f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}"{extra}>{s}</text>'
# headers
g.append(txt(20,22,'FILE HOME (config claims the file)',MUT,12,' letter-spacing="1.5"'))
g.append(txt(450,22,'CONSUMER HOME (who names the class)',MUT,12,' letter-spacing="1.5"'))
for e,(x,y) in src.items():
    g.append(f'<rect x="{x}" y="{y-14}" width="{W+28}" height="20" rx="4" fill="{ENT[e]}" opacity=".9"/>'+txt(x+8,y,e+('  ·  schemas/preferences.py' if e=='allergen' else '  ·  schemas/responses.py'),'#fff',12))
for k,(e,cx,cy,lab,sub) in cons.items():
    g.append(f'<rect x="{cx-10}" y="{cy-14}" width="{W+40}" height="20" rx="4" fill="{ENT[e]}" opacity=".9"/>'+txt(cx-2,cy,e,'#fff',12))
    g.append(f'<rect x="{cx}" y="{cy+10}" width="{W+20}" height="26" rx="6" fill="none" stroke="{ENT[e]}" stroke-width="2"/>'+txt(cx+8,cy+27,lab,INK,12))
    g.append(txt(cx,cy+52+slot[k]*(H+6)+2,sub,MUT,12))
# dashed cross-entity wires (BEFORE) + solid brackets (AFTER) + chips
for i,(nm,se,te,ck) in enumerate(chips):
    sx,sy=pos[nm]; e,cx,cy,lab,sub=cons[ck]; dx,dy=dst[nm]
    d=f'M{sx+W} {sy+H/2} C {sx+W+90} {sy+H/2}, {cx-90} {cy+23}, {cx} {cy+23}'
    g.append(f'<path class="xw" d="{d}" pathLength="100" stroke="{RED}" stroke-width="2" stroke-dasharray="6 5" fill="none" style="animation-delay:{0.2+i*0.07:.2f}s,1.9s"/>')
for k,(e,cx,cy,lab,sub) in cons.items():
    n=slot[k]; y0=cy+36; y1=cy+44+(n-1)*(H+6)+H/2
    g.append(f'<path class="bk" d="M{cx+6} {y0} V {y1}" pathLength="100" stroke="{ENT[e]}" stroke-width="3" fill="none" style="animation-delay:3.7s"/>')
for i,(nm,se,te,ck) in enumerate(chips):
    sx,sy=pos[nm]; dx,dy=dst[nm]
    g.append(f'<g class="mv" style="--dx:{dx-sx}px;--dy:{dy-sy}px;animation-delay:{1.9+i*0.11:.2f}s"><rect x="{sx}" y="{sy}" width="{W}" height="{H}" rx="5" fill="{SCH}" fill-opacity=".18" stroke="{SCH}" stroke-width="1.5"/>{txt(sx+8,sy+17,nm,INK,13)}</g>')
g.append(txt(20,588,'red = the wire that LEAVES the entity today  ·  the slide = the homing rule  ·  solid bracket = the same wire, now inside one entity',MUT,12))
SVG1=f'<svg id="fx-move" class="run" viewBox="0 0 1080 600" role="img" aria-label="14 schemas sliding from the entity that claims their file to the entity that consumes them">{"".join(g)}</svg>'

# ── STAGE 2 · the fold ────────────────────────────────────────────────────────
kids=['HouseholdFormatInput','UserFormatInput','DietaryProfileInput','PrivacyPermissionsInput','NotificationPreferencesInput']
f=[]
px,py=40,70
f.append(txt(40,24,'BEFORE · 7 schema nodes · 6 nests wires · the survivor sits first (an endpoint also touches it)',MUT,12,' letter-spacing=".4"'))
f.append(f'<rect x="{px}" y="{py}" width="{W}" height="30" rx="6" fill="{SCH}" fill-opacity=".25" stroke="{SCH}" stroke-width="2"/>'+txt(px+10,py+20,'SetupCompleteRequest',INK,12))
for i,k in enumerate(kids):
    kx,ky=px+40,py+90+i*34
    f.append(f'<path class="kw" d="M{px+20} {py+30} V {ky+11} H {kx}" pathLength="100" stroke="{SCH}" stroke-width="1.5" fill="none" style="animation-delay:{2.2+i*0.12:.2f}s"/>')
    f.append(f'<g class="fd" style="--dx:{px-kx}px;--dy:{py-ky}px;animation-delay:{2.2+i*0.12:.2f}s"><rect x="{kx}" y="{ky}" width="{W}" height="{H}" rx="5" fill="{SCH}" fill-opacity=".14" stroke="{SCH}" stroke-width="1.3"/>{txt(kx+8,ky+16,k,INK,13)}</g>')
# the survivor: ExplorationPreferencesInput, also touched by an endpoint → stays
kx,ky=px+40,py+56
f.append(f'<path d="M{px+20} {py+30} V {ky+11} H {kx}" stroke="{SCH}" stroke-width="1.5" fill="none"/>')
f.append(f'<rect x="{kx}" y="{ky}" width="{W}" height="{H}" rx="5" fill="{SCH}" fill-opacity=".14" stroke="{SCH}" stroke-width="1.3"/>'+txt(kx+8,ky+16,'ExplorationPreferencesInput',INK,13))
f.append(f'<path d="M{kx+W} {ky+11} H {kx+W+40}" stroke="{ENT["settings"]}" stroke-width="2" fill="none"/>')
f.append(f'<rect x="{kx+W+40}" y="{ky-2}" width="215" height="28" rx="6" fill="none" stroke="{ENT["settings"]}" stroke-width="2"/>'+txt(kx+W+48,ky+16,'PATCH /settings/exploration',INK,12))
f.append(txt(kx+W+40,ky+40,'touched by an endpoint → stays visible',MUT,12))
# the badge
bx,by=px+W-4,py-2
f.append(f'<g class="bd" style="animation-delay:3.1s"><circle cx="{bx}" cy="{by}" r="13" fill="{SCH}" stroke="#0b0e14" stroke-width="2"/>{txt(bx-4,by+5,"5","#0b0e14",13," font-weight=\"700\"")}</g>')
f.append(txt(px+W+30,py+20,'← the COUNT badge: 5 nested-only schemas folded here',MUT,12,' class="bdl"'))
f.append(txt(40,348,'AFTER (critical) · 2 nodes + a badge · double-click the parent → the five reappear, pinned',MUT,12,' letter-spacing=".4"'))
SVG2=f'<svg id="fx-fold" class="run" viewBox="0 0 800 364" role="img" aria-label="five nested-only schemas collapsing into their parent, which then wears a count badge of 5">{"".join(f)}</svg>'

STYLE='''
<style>
  :root { --void:#0b0e14; --void-ink:#dfe5ee; --red:#e5484d; --sch:#0e9aa7; }
  .hero-stats { display:flex; flex-wrap:wrap; gap:12px; margin-top:16px; }
  .stat { background:var(--card); border:1px solid var(--rule); border-radius:var(--radius,10px); padding:10px 14px; display:flex; flex-direction:column; gap:2px; min-width:150px; }
  .stat b { font-size:1.35em; line-height:1.1; font-variant-numeric:tabular-nums; }
  .stat span { font-size:var(--fs-xs); color:var(--muted); }
  .voidstrip { background:var(--void); color:var(--void-ink); border-radius:var(--radius,10px); padding:14px; overflow-x:auto; }
  .voidstrip svg { display:block; min-width:860px; width:100%; height:auto; }
  .voidstrip text { font-family:var(--af-stack); }
  .fxbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .fxbar button { font-family:inherit; font-size:var(--fs-sm); color:var(--accent); background:var(--accent-soft); border:1px solid var(--accent); border-radius:8px; padding:4px 12px; cursor:pointer; }
  .fxbar button:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .fxbar .cap { font-size:var(--fs-xs); color:var(--muted); }
  /* stage 1 — the move */
  #fx-move .xw { stroke-dashoffset:0; opacity:1; } #fx-move .bk { stroke-dashoffset:0; } #fx-move .mv { transform:translate(0,0); }
  #fx-move.run .xw { animation:wdraw .6s cubic-bezier(.4,0,.2,1) both, wfade .6s ease both; }
  #fx-move.run .mv { animation:mv .8s cubic-bezier(.4,0,.2,1) both; }
  #fx-move.run .bk { animation:wdraw .6s cubic-bezier(.4,0,.2,1) both; }
  #fx-move.fin .xw { opacity:0; animation:none !important; } #fx-move.fin .mv { transform:translate(var(--dx),var(--dy)); animation:none !important; } #fx-move.fin .bk { animation:none !important; }
  /* stage 2 — the fold */
  #fx-fold .fd { transform:translate(0,0); opacity:1; } #fx-fold .kw { stroke-dashoffset:0; opacity:1; } #fx-fold .bd { opacity:1; } #fx-fold .bdl { opacity:1; }
  #fx-fold.run .fd { animation:fold .7s cubic-bezier(.4,0,.2,1) both; }
  #fx-fold.run .kw { animation:wfade .5s ease both; }
  #fx-fold.run .bd, #fx-fold.run .bdl { animation:npop .4s ease both; }
  #fx-fold.fin .fd { transform:translate(var(--dx),var(--dy)); opacity:0; animation:none !important; } #fx-fold.fin .kw { opacity:0; animation:none !important; } #fx-fold.fin .bd, #fx-fold.fin .bdl { animation:none !important; }
  @keyframes wdraw { from { stroke-dasharray:100; stroke-dashoffset:100; } to { stroke-dasharray:100; stroke-dashoffset:0; } }
  @keyframes wfade { from { opacity:1; } to { opacity:0; } }
  @keyframes mv { from { transform:translate(0,0); } to { transform:translate(var(--dx),var(--dy)); } }
  @keyframes fold { from { transform:translate(0,0); opacity:1; } to { transform:translate(var(--dx),var(--dy)); opacity:0; } }
  @keyframes npop { from { opacity:0; } to { opacity:1; } }
  @media (prefers-reduced-motion: reduce) { #fx-move.run .xw, #fx-move.run .mv, #fx-move.run .bk, #fx-fold.run .fd, #fx-fold.run .kw, #fx-fold.run .bd, #fx-fold.run .bdl { animation:none !important; }
    #fx-move.run .xw { opacity:0; } #fx-move.run .mv { transform:translate(var(--dx),var(--dy)); } #fx-fold.run .fd { transform:translate(var(--dx),var(--dy)); opacity:0; } #fx-fold.run .kw { opacity:0; } }
  table.t { border-collapse:collapse; width:100%; font-size:var(--fs-sm); }
  table.t th, table.t td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--rule-soft); vertical-align:top; }
  table.t th { font-size:var(--fs-xs); color:var(--muted); letter-spacing:.06em; text-transform:uppercase; font-weight:600; }
  table.t td.n { font-variant-numeric:tabular-nums; text-align:right; }
  .tw { overflow-x:auto; }
  .ent { display:inline-block; font-size:var(--fs-min); font-weight:700; color:#fff; border-radius:5px; padding:1px 7px; letter-spacing:.03em; }
  .ent.allergen{background:#3f6d4c} .ent.progression{background:#8e4585} .ent.auth{background:#5a53a8} .ent.settings{background:#a35a00} .ent.legal{background:#0f766e} .ent.other{background:#8a8f98}
  .grid3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:12px; }
  .cell { border:1px solid var(--rule); border-radius:var(--radius,10px); padding:12px; background:var(--raised); }
  .cell h4 { margin:0 0 6px; font-size:1em; } .cell p { font-size:var(--fs-sm); color:var(--ink-soft); margin:4px 0 0; } .cell .n { font-variant-numeric:tabular-nums; font-weight:700; }
  .chain { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; align-items:stretch; }
  .chain .beat { border:1px solid var(--rule); border-radius:var(--radius,10px); padding:10px 12px; background:var(--card); position:relative; }
  .chain .beat .who { font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--accent); font-weight:700; }
  .chain .beat p { font-size:var(--fs-sm); color:var(--ink-soft); margin:6px 0 0; }
  .chain .beat .ev { font-size:var(--fs-xs); color:var(--muted); margin-top:6px; display:block; }
  .chain .beat:not(:last-child)::after { content:"→"; position:absolute; right:-11px; top:12px; color:var(--muted); font-weight:700; background:var(--ground); }
  @media (max-width:860px) { .chain { grid-template-columns:1fr 1fr; } .chain .beat::after { display:none; } }
  .verdict { display:inline-block; font-size:var(--fs-min); font-weight:700; letter-spacing:.05em; text-transform:uppercase; border-radius:5px; padding:1px 7px; color:#fff; }
  .verdict.go { background:#1baf7a; } .verdict.no { background:#b5443c; } .verdict.hold { background:#a35a00; }
  .dec { }
  .dec .kv { display:grid; grid-template-columns:82px 1fr; gap:4px 10px; font-size:var(--fs-sm); margin-top:8px; }
  .dec .kv b { color:var(--muted); font-size:var(--fs-xs); letter-spacing:.06em; text-transform:uppercase; font-weight:600; padding-top:2px; }
  pre.rule { background:var(--void); color:var(--void-ink); border-radius:var(--radius,10px); padding:12px 14px; font-size:var(--fs-sm); overflow-x:auto; line-height:1.45; margin:0; }
  pre.rule .k { color:#eda100; } pre.rule .c { color:#8a93a6; }
  .bars { display:grid; grid-template-columns:110px 1fr 60px; gap:6px 10px; align-items:center; font-size:var(--fs-sm); }
  .bars .lane { position:relative; height:16px; background:var(--rule-soft); border-radius:4px; overflow:hidden; }
  .bars .lane i { position:absolute; left:0; top:0; bottom:0; border-radius:4px; }
  .bars .lane i.b { background:var(--rule); } .bars .lane i.a { background:var(--accent); opacity:.85; }
  .bars .d { font-variant-numeric:tabular-nums; color:var(--ink-soft); text-align:right; }
  .kind { display:inline-block; font-size:var(--fs-min); font-weight:700; letter-spacing:.05em; text-transform:uppercase; border-radius:5px; padding:1px 7px; color:#fff; }
  .kind.cfg { background:#2f6f8f; } .kind.add { background:#1baf7a; }
  code { background:var(--raised); border:1px solid var(--rule-soft); border-radius:5px; padding:0 4px; font-size:.95em; }
  .lede { color:var(--ink-soft); max-width:70ch; }
  .lede b { color:var(--ink); }
</style>
'''

ICON={
 'route':'<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>',
 'search':'<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
 'file':'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v5h5"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>',
 'swap':'<path d="M8 3 4 7l4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>',
 'layers':'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path><path d="m6.08 11-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.9 11"></path>',
 'gavel':'<path d="m14.5 12.5-8 8a2.1 2.1 0 1 1-3-3l8-8"></path><path d="m16 16 6-6"></path><path d="m8 8 6-6"></path><path d="m9 7 8 8"></path><path d="m21 11-8-8"></path>',
 'alert':'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
 'bar':'<path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>',
}
def sec(n,icon,title,tag,body): return f'''
  <section class="sec" data-sec="{n}">
    <div class="sec-head"><h2><svg viewBox="0 0 24 24" aria-hidden="true">{ICON[icon]}</svg>{title}</h2><span class="n">{tag}</span></div>
    {body}
  </section>'''
E=lambda e: f'<span class="ent {"legal" if e=="legal-consent" else e}">{e}</span>'

BODY=f'''<div class="artifact-page">
  <header>
    <p style="font-size:var(--fs-min);letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0">gabe universe · gustify example · order of work 1 of 3 · LANDED 2026-08-27</p>
    <h1 style="font-size:2.1em;line-height:1.15;margin:8px 0 0;text-wrap:balance">Schema Homing</h1>
    <p class="lede" style="margin:12px 0 0">A schema lives where its <b>consumer</b> lives, not where its <b>file</b> was claimed. Eight schemas whose every wire leaves their entity were the symptom; measured on the committed map the rule moves <b>14</b>, and a display fold hides <b>34</b> nested-only shapes behind a count badge. Landed on your "land it": the homing rule + S12 (emitter), the fold + count badge (station); the numbers below are the landed estate's.</p>
    <div class="hero-stats">
      <div class="stat"><b>14 / 123</b><span>schemas re-home · 7 ambiguous (the shared Blocks, stay) · 2 unwired, both dormant</span></div>
      <div class="stat"><b>7 → 0</b><span>allergen schemas — a pure aspect again</span></div>
      <div class="stat"><b>11 → 2</b><span>cross-entity touches wires · nests 6 → 15 (the shared Blocks' wires, hidden by the fold)</span></div>
      <div class="stat"><b>123 → 89</b><span>schema nodes at boot after the fold (34 fold into 14 parents)</span></div>
    </div>
  </header>
''' + sec(1,'route','The move','stage 1 · replayable', f'''
    <div class="fxbar"><button id="fx-move-replay" type="button">↻ Replay the move</button><span class="cap">Left: the entity whose config claims the FILE. Right: the entity whose endpoint or parent schema NAMES the class. Every wire drawn first is red — it crosses an entity boundary today. Colours match the Universe station (settings is given its own tone here; the station paints it like progression).</span></div>
    <div class="voidstrip" data-fx="move" id="fx-move-stage" style="margin-top:10px">{SVG1}</div>
    <div class="hops" style="margin-top:12px"><p class="lede" style="font-size:var(--fs-sm);margin:0">What you would see in the station: allergen's schema column empties (its five <code>*Input</code> shapes were only ever fields of auth's <code>SetupCompleteRequest</code>); progression keeps its profile shapes and loses the ones only <code>GET /me</code>, <code>GET /settings</code> and <code>POST /account/export</code> ever return. Nothing is added or removed — 123 schema nodes before and after; 14 change column, 12 of them join a use-case cluster they had no membership in.</p></div>
''') + sec(2,'search','The census — every case','(a) · measured', f'''
    <div class="tw"><table class="t">
      <thead><tr><th>schema</th><th>file home</th><th>its only wires</th><th>resolved home</th><th>class</th></tr></thead>
      <tbody>
        <tr><td>DietaryProfileInput · HouseholdFormatInput · NotificationPreferencesInput · PrivacyPermissionsInput · UserFormatInput</td><td>{E('allergen')}</td><td><code>nests</code> ← SetupCompleteRequest (auth)</td><td>{E('auth')}</td><td>all-leave</td></tr>
        <tr><td>ExplorationPreferencesInput</td><td>{E('allergen')}</td><td><code>nests</code> ← SetupCompleteRequest (auth) · <code>touches</code> ← PATCH /settings/exploration</td><td>{E('settings')} — the endpoint outranks the nest</td><td>all-leave</td></tr>
        <tr><td>ExplorationPreferencesPatch</td><td>{E('allergen')}</td><td><code>touches</code> + <code>consumes</code> ← PATCH /settings/exploration</td><td>{E('settings')}</td><td>all-leave</td></tr>
        <tr><td>AccountExportResponse</td><td>{E('progression')}</td><td><code>touches</code> ← POST /account/export</td><td>{E('legal-consent')}</td><td>all-leave</td></tr>
        <tr><td>MeResponse</td><td>{E('progression')}</td><td><code>touches</code> ← GET /me · POST /setup/complete</td><td>{E('auth')}</td><td>transitive — its own children co-home in responses.py, so the all-leave test missed it</td></tr>
        <tr><td>UserSummary · HouseholdSummary · MembershipSummary · PreferencesSummary</td><td>{E('progression')}</td><td>nested ONLY by MeResponse</td><td>{E('auth')} — follow the parent</td><td>transitive</td></tr>
        <tr><td>SettingsResponse</td><td>{E('progression')}</td><td><code>touches</code> ← GET /settings · PATCH /settings/{{household,preferences,exploration}}</td><td>{E('settings')}</td><td>transitive</td></tr>
        <tr><td>MarkReadRequest · ProfileProjectionResponse · DegradedReadResult · ExchangeConfig · ReceiptIngestRequest · ReceiptIngestResult</td><td>cooking · pantry</td><td>none</td><td>stays — nothing to home by</td><td>unwired (6)</td></tr>
      </tbody></table></div>
    <div class="grid3" style="margin-top:14px">
      <div class="cell"><h4>Cross-cluster · the 14 movers</h4><p>Every mover has <b>no use-case</b> in its file home — the use-case core is keyed by an entity's own endpoints and classes, so a schema only foreign endpoints touch lands in the station's "other" blob. After homing, <span class="n">12/14</span> join one use-case (<code>setup/complete</code>, <code>me</code>, <code>settings/*</code>, <code>account/export</code>).</p></div>
      <div class="cell"><h4>Cross-cluster · nested-only helpers (20)</h4><p>BatchItemInput, ComplexityBucket, the seven Blocks, the three Recipe*Input… — the parent has a use-case, the child does not. The fold (stage 2) takes them off the field; not a homing defect.</p></div>
      <div class="cell"><h4>Cross-cluster · shared shapes inside one entity (5)</h4><p>PantryItemResponse sits in <code>pantry/overview</code> while four <code>pantry/items</code> endpoints return it; likewise CookingSessionResponse, ShoppingItemResponse, CupoResponse, StageReminderResponse. Correct home, first-seen cluster. <b>Report only</b> — a multi-use-case schema has no single cluster, and the core is decoration (nodes never move).</p></div>
    </div>
''') + sec(3,'file','Why the map does this','(b) · the cause, one actor per beat', f'''
    <div class="chain">
      <div class="beat"><span class="who">center.config.json</span><p>claims schema <b>FILES</b> per entity: <code>preferences.py</code> under allergen (its models file shares the name), <code>responses.py</code> under progression (a cross-cutting response file, 22 classes).</p><span class="ev">entities.allergen.code.schemas · entities.progression.code.schemas</span></div>
      <div class="beat"><span class="who">_a3_code.collect_entity_map</span><p>parses every class in the claimed file and stamps <code>entity = slug</code> — the file's owner becomes every class's owner.</p><span class="ev">_a3_code.py:616</span></div>
      <div class="beat"><span class="who">_a3_graph._l2</span><p>builds the schema node under that slug; a field type or handler name it cannot resolve locally goes to the cross-entity residue.</p><span class="ev">_a3_graph.py:576-600 · 648-668</span></div>
      <div class="beat"><span class="who">the cross resolvers</span><p>resolve the residue against a global class index and draw the <code>nests</code> / <code>consumes</code> / <code>touches</code> wires that LEAVE. The archmap always knew the consumer; the home never asked it.</p><span class="ev">_a3_graph.py:999-1041</span></div>
    </div>
    <p class="lede" style="font-size:var(--fs-sm);margin-top:12px">Source proof: <code>schemas/setup.py:11</code> imports the six <code>*Input</code> classes into <code>SetupCompleteRequest</code>'s fields (<code>:21-42</code>); <code>api/user_settings.py:23</code> imports the exploration pair; <code>api/setup.py:18</code> imports <code>MeResponse</code>; <code>api/account.py:19</code> imports <code>AccountExportResponse</code>. A file-level claim cannot split <code>preferences.py</code> (5 → auth, 2 → settings) or <code>responses.py</code> (4 targets) — which is why config alone cannot fix it.</p>
''') + sec(4,'swap','The correction','(b) · options weighed, one recommendation', f'''
    <pre class="rule"><span class="k">home_schemas(entities)</span>   <span class="c">— _a3_code, ~60 lines, pure, deterministic; called once after `entities` is assembled (build_center_a3.py:1962)</span>
  consumers[s] = {{ slug : an endpoint of slug names s in touches ∪ touches_x ∪ resp }}   <span class="c"># a floor by design</span>
  parents[s]   = {{ p : a field TYPE of schema p names s }}                                <span class="c"># the nests source</span>
  resolve(s):  |consumers| == 1            → that slug                          <span class="c">why: consumed-by:&lt;slug&gt;</span>
               consumers = ∅ ∧ parents ≠ ∅ → the ONE slug all parents resolve to <span class="c">why: nested-in:&lt;parent&gt;  (recursive, cycle-safe)</span>
               otherwise                   → file home, unchanged               <span class="c">why: ambiguous | unwired | own</span>
  move the schema dict between entities[*]["schemas"]; stamp {{homed_from, why}}; return stats → amap["schema_homing"]</pre>
    <div class="grid3" style="margin-top:12px">
      <div class="cell"><h4>A · archmap-level rule <span class="verdict go">recommended</span></h4><p>Every consumer of <code>entities[slug]["schemas"]</code> agrees at once — C4, the levels <code>schema_owner</code>, the data-model page, <code>gabe-cc-entity</code>. One class, one home, on every page. Provenance on the node ("homed from allergen — consumed by auth"), <code>stats.schema_homing</code>, pulse angle S12 on the beat rail. Config untouched.</p><p><b>Cost:</b> ~100 lines across 4 files · 3 mutation-proven battery cases · one gustify regen (numbers in the commit).</p></div>
      <div class="cell"><h4>B · C4-only pre-pass <span class="verdict no">rejected</span></h4><p>~40 lines in <code>build_c4_graph</code>, no archmap change — but the entity's Code tab keeps listing MeResponse under progression while the Universe draws it under auth, and levels' <code>schema_owner</code> disagrees with c4. <b>Two homes for one class.</b></p></div>
      <div class="cell"><h4>C · config class-list <span class="verdict no">rejected</span></h4><p>Zero suite code: a hand-maintained <code>schemas_cls</code> allowlist beside <code>models</code>. Drifts the day a schema is added, and nothing reports the drift — the no-remembered-process ruling.</p></div>
    </div>
    <h4 style="margin:16px 0 6px">Measured effect on gustify — schema nodes per entity</h4>
    <div class="bars">
      <span>allergen</span><div class="lane"><i class="b" style="width:16.3%"></i><i class="a" style="width:0%"></i></div><span class="d">7 → 0</span>
      <span>progression</span><div class="lane"><i class="b" style="width:48.8%"></i><i class="a" style="width:32.6%"></i></div><span class="d">21 → 14</span>
      <span>auth</span><div class="lane"><i class="b" style="width:2.3%"></i><i class="a" style="width:25.6%"></i></div><span class="d">1 → 11</span>
      <span>settings</span><div class="lane"><i class="b" style="width:4.7%"></i><i class="a" style="width:11.6%"></i></div><span class="d">2 → 5</span>
      <span>legal-consent</span><div class="lane"><i class="b" style="width:0%"></i><i class="a" style="width:2.3%"></i></div><span class="d">0 → 1</span>
    </div>
    <p class="lede" style="font-size:var(--fs-xs);margin-top:6px;color:var(--muted)">grey = today · accent = after the rule · lanes scaled to pantry's 43 (unchanged, like cooking 21 and recipe 28). Cross-entity wires: touches 11 → 2 · consumes 1 → 0 · nests 6 → <b>15</b> — up, not down: the seven shared Blocks stay in progression (three parents in three entities) while two of their parents moved away, so those parents now reach across; every one of the 15 is a wire to a nested-only schema, i.e. exactly what the fold hides. Landed stats: moved 14 · ambiguous 7 · unwired 2 (both dormant) · endpoints 67 → 72 · census-unclaimed models 2 → 0 · fn→schema wires 76. Honest-empty: a project whose schemas are all consumed in-entity moves nothing — byte-identical.</p>
''') + sec(5,'layers','The fold — nested-only schemas','(c) · stage 2 · replayable', f'''
    <div class="fxbar"><button id="fx-fold-replay" type="button">↻ Replay the fold</button><span class="cap">Mirror of the functions' critical fold: a schema with only <code>nests</code> wires in and no endpoint wire folds into its parent under the legend's <b>critical</b> state; the parent wears the count. The un-fold is the double-click reveal that already pins the one-hop set.</span></div>
    <div class="voidstrip" data-fx="fold" id="fx-fold-stage" style="margin-top:10px">{SVG2}</div>
    <div class="tw" style="margin-top:12px"><table class="t">
      <thead><tr><th>parent</th><th class="n">direct nests</th><th class="n">folded (badge)</th><th class="n">subtree</th><th>note</th></tr></thead>
      <tbody>
        <tr><td>ProfileSummaryResponse</td><td class="n">7</td><td class="n"><b>7</b></td><td class="n">7</td><td>progression's own profile shape</td></tr>
        <tr><td>SettingsResponse</td><td class="n">7</td><td class="n"><b>7</b></td><td class="n">7</td><td>six Blocks + SubscriptionSummary</td></tr>
        <tr><td>PreferencesSummary</td><td class="n">6</td><td class="n"><b>6</b></td><td class="n">6</td><td>itself folded into MeResponse — recursive</td></tr>
        <tr><td>SetupCompleteRequest</td><td class="n">6</td><td class="n"><b>5</b></td><td class="n">5</td><td>ExplorationPreferencesInput is also touched by PATCH /settings/exploration — it stays visible, so the badge reads 5, not 6</td></tr>
        <tr><td>MeResponse</td><td class="n">5</td><td class="n"><b>5</b></td><td class="n">11</td><td>PreferencesSummary carries its six Blocks with it</td></tr>
        <tr><td>ManualRecipeCreate · GustifyCreationResponse</td><td class="n">3 · 3</td><td class="n"><b>3 · 2</b></td><td class="n">3 · 3</td><td></td></tr>
        <tr><td>7 single-child parents</td><td class="n">1</td><td class="n"><b>1</b></td><td class="n">1</td><td>CatalogPublishResponse · CreateBatchRequest · DishHistoryListResponse · GeneratedCandidateOut · NotificationListResponse · ReceiptItemsResult · ResetApplyRequest</td></tr>
        <tr><td>RecipeDetailResponse</td><td class="n">5</td><td class="n"><b>0 → no badge</b></td><td class="n">0</td><td>all five nests are endpoint-touched; nothing hides</td></tr>
      </tbody></table></div>
    <div class="grid3" style="margin-top:12px">
      <div class="cell"><h4>Where it lives</h4><p><code>__uniComputeSolo</code> gains a second clause (~6 lines, <code>parts/layout.js:2069</code>) — "no wire but composition", separate from the function fold's "single caller of my kind". <code>visN</code> already hides <code>__solo</code> unless pinned; no new gate. The schema legend row gains a real CRITICAL state (today it cycles ALL → OFF).</p></div>
      <div class="cell"><h4>The badge</h4><p><code>__badgeGlyph(c, "count", n)</code> in the one glyph source (<code>layout.js:1970</code>) — schema disc + the digits; attached in <code>buildNode</code> beside method/role (<code>assemble.py:444</code>) when <code>__foldN &gt; 0</code>; rides <code>_mbTick</code> with the same opacity/size controls; painted into the badge-key popup by the same fn (legend-visual law).</p></div>
      <div class="cell"><h4>Proof + size</h4><p><code>verify-schemafold.mjs</code> ~80 lines: 89 schema nodes at boot · 14 badge sprites · SetupCompleteRequest reads "5" · double-click reveals 5 · Esc re-folds · legend cycles ALL → CRITICAL → OFF. Static pins +4 in <code>tests/gabe-universe</code>. Station-only: layout.js ~25 · assemble.py ~6 · card.js ~3. <b>No emitter change, no regen.</b></p></div>
    </div>
''') + sec(6,'gavel','Decisions owed','three blocks · overrule any', f'''
    <div class="grid3">
      <div class="cell panel dec"><h4>1 · Homing seat</h4><div class="kv"><b>chose</b><span>archmap-level rule (A) over C4-only (B) and a config class-list (C)</span><b>assumed</b><span>one class must have ONE home across every center page; the file lists stay the ownership claim</span><b>breaks if</b><span>a twin wants a schema drawn under its FILE's entity regardless of consumer — then a config <code>schemas_pin: [cls]</code> escape hatch (5 lines) reinstates the file home per class</span></div></div>
      <div class="cell panel dec"><h4>2 · Badge semantics</h4><div class="kv"><b>chose</b><span>badge = FOLDED direct children (what is hidden here) — SetupCompleteRequest reads 5, not 6</span><b>assumed</b><span>the badge answers "how many did the fold hide", so it disappears when nothing folds (RecipeDetailResponse)</span><b>breaks if</b><span>you want the composition SIZE regardless of visibility — then the nests fan, always shown; a one-line change</span></div></div>
      <div class="cell panel dec"><h4>3 · Multi-parent nested-only schemas</h4><div class="kv"><b>chose</b><span>stay in the file home, flagged <code>ambiguous</code> (7 on gustify) — over duplicating the node per parent</span><b>assumed</b><span>a shared Block is genuinely cross-cutting; the fold hides it under every parent anyway</span><b>breaks if</b><span>a walk needs the Block's own node visible across entities — the reveal pins it; no duplicate needed</span></div></div>
    </div>
''') + sec(7,'alert','Gaps — what the rule does not settle','honest residue', f'''
    <div class="grid3">
      <div class="cell"><h4>7 fold survivors</h4><p>DietaryBlock, ExplorationBlock, HouseholdFormatBlock, NotificationBlock, PrivacyBlock, UserFormatBlock, SubscriptionSummary — nested by parents that resolve to <b>different</b> entities (PreferencesSummary → auth · SettingsResponse → settings · ProfileSummaryResponse → progression). They stay in progression, flagged. Their home stops mattering visually once they fold — which is why homing and fold ship together.</p></div>
      <div class="cell"><h4>6 unwired schemas → two causes, dug deeper below</h4><p>Not dead shapes. Cooking's pair is consumed by a route file the config never claimed; pantry's four are the Gustify ↔ Boletapp exchange contract — a whole lane with no request root. Neither is a missing entity. See "The six unwired".</p></div>
      <div class="cell"><h4>Consumer detection is a floor</h4><p>Endpoint consumers: <code>touches ∪ touches_x ∪ resp</code>, a bare-name scan of the handler body plus the decorator. Function consumers (landed): a claimed non-handler function's <code>returns</code>, <code>takes</code> (param annotation) or <code>uses</code> (body name) — endpoint consumers outrank them, and a schema's own validator method never counts. What remains below the floor: a shape used only through <code>getattr</code>/string dispatch. The S12 line says when the floor stops being high enough.</p></div>
      <div class="cell"><h4>Not expanded</h4><p>The S12 angle text · the <code>schemas_pin</code> escape hatch · the badge glyph geometry (digit size at 128²) · whether the levels use-case core should re-run after homing (the 12/14 join is by construction, not yet measured in <code>levels.json</code>).</p></div>
    </div>
''') + sec(8,'search','The six unwired','(a′) · dug deeper', f'''
    <p class="lede" style="font-size:var(--fs-sm);margin:0 0 10px">Two causes. <b>U1</b> — cooking claims the notification schemas, services and models but not the route file <code>api/notifications.py</code> (4 routes), so its two schemas have no endpoint the map knows. <b>U2</b> — <code>schemas/gastify.py</code> is the Gustify ↔ Boletapp catalog-exchange contract: "Phase 10 — structure only, no live HTTP executes this phase (D43)". The lane exists end-to-end in source — a client, a service that writes two tables, four DTOs — and has <b>no endpoint</b>. The map's only root is a request handler, so the whole lane is invisible: four unwired schemas, two census-unclaimed models (<code>ReceiptIngestLog</code>, <code>AdminReviewQueue</code>), two uncalled functions.</p>
    <div class="tw"><table class="t">
      <thead><tr><th>schema</th><th>home</th><th>consumer in source</th><th>why the map sees nothing</th><th>fix</th></tr></thead>
      <tbody>
        <tr><td>MarkReadRequest</td><td><span class="ent other" style="background:#0d6e78">cooking</span></td><td><code>POST /notifications/mark-read</code> · <code>/delete</code> (body) — api/notifications.py:47-62</td><td>route file unclaimed (gap class 1)</td><td><span class="kind cfg">config</span> claim <code>api/notifications.py</code> → cooking</td></tr>
        <tr><td>ProfileProjectionResponse</td><td><span class="ent other" style="background:#0d6e78">cooking</span></td><td><code>GET /profile/projection</code> <code>response_model</code> — api/notifications.py:72-82</td><td>route file unclaimed; the <code>/profile</code> path sits in progression's URL domain (S9 will flag it — report only)</td><td>same</td></tr>
        <tr><td>ExchangeConfig</td><td><span class="ent other" style="background:#b45309">pantry</span></td><td><code>_RealBoletappReceiptClient(config=ExchangeConfig())</code> — integrations/gastify_exchange.py:104</td><td>consumer is a FUNCTION, not a handler; the consumer scan reads handler bodies only</td><td><span class="kind add">additive</span> fn→schema <code>takes</code> wire (param types in <code>fn_insight</code>, ~10 lines)</td></tr>
        <tr><td>ReceiptIngestResult</td><td><span class="ent other" style="background:#b45309">pantry</span></td><td><code>ingest_receipt_items(...) -> ReceiptIngestResult</code> — services/receipt_ingest.py:24 (writes ReceiptIngestLog + AdminReviewQueue)</td><td>same — and <code>function_insight[*].returns</code> ALREADY carries the name</td><td><span class="kind add">additive</span> fn→schema <code>returns</code> wire — zero new source read</td></tr>
        <tr><td>ReceiptIngestRequest</td><td><span class="ent other" style="background:#b45309">pantry</span></td><td>none outside tests</td><td>contract-only until the P2 wiring (<code>get_gastify_ingest_adapter</code> → "P2 wiring (D43)")</td><td>stays <code>unwired</code>, tagged <b>dormant</b></td></tr>
        <tr><td>DegradedReadResult</td><td><span class="ent other" style="background:#b45309">pantry</span></td><td>none outside tests</td><td>contract-only until P2</td><td>stays <code>unwired</code>, tagged <b>dormant</b></td></tr>
      </tbody></table></div>
    <div class="grid3" style="margin-top:12px">
      <div class="cell"><h4>Missing entity or cluster?</h4><p>Neither. The ADR makes the lane <b>pantry's</b> (receipt items auto-populate the pantry; the review queue is Gustify-owned). What is missing is a <b>root class</b>: the use-case core is endpoint-keyed and the write-path BFS starts at handlers, so a lane with no endpoint can never cluster or light up. Trace Anatomy class 6 (writes with no request root) meeting class 12 (a provider flag walls it) — the fix map, item 2, owns the root-class fix.</p></div>
      <div class="cell"><h4>What homing does with them — revised</h4><p><b>1 · config, 2 lines:</b> claim <code>api/notifications.py</code> → cooking and <code>models/admin_review.py</code> → pantry (this is the owed "2 admin-lane models' home"). <b>2 · emitter, ~25 lines additive:</b> the consumer set widens to "a handler OR a claimed function returns/takes it" — <code>returns</code> is already in the archmap; <code>ExchangeConfig</code> and <code>ReceiptIngestResult</code> get a wire and stop being unwired. This also closes the consumer-floor gap for every service-consumed schema. <b>3 · report:</b> a schema still unwired after (2) whose file or provider flag names a deferral is tagged <b>dormant</b>; the S12 line reads "2 dormant (gastify contract, provider not wired)".</p></div>
      <div class="cell"><h4>After the three moves</h4><p>Landed: unwired 6 → <span class="n">2</span> (both dormant by design, named as such) · endpoints 67 → 72 (notifications 4 + history 1 — <code>DishHistoryListResponse</code> was a third unclaimed-route casualty S12 caught) · census-unclaimed models 2 → 0 · the receipt lane (client → ingest → two tables) visible today through its function wires, drawable end-to-end the day it gets a root.</p></div>
    </div>
''') + sec(9,'bar','Provenance + landing order','how this was measured', f'''
    <div class="grid3">
      <div class="cell"><h4>Measurement</h4><p><code>scratchpad/schema-homing.py</code> — pure read over the committed estate <code>templates/center/shell/example/codebase-graph-station/{{c4-graph.js, levels.json}}</code>; the transitive rule, the use-case join, the fold census. The archmap-seat inputs re-checked against gustify's committed <code>archmap.json</code> (14/14). Design record: <code>docs/design/codebase-graph-consolidation/SCHEMA-HOMING.md</code>.</p></div>
      <div class="cell"><h4>Landing order</h4><p><b>1.</b> <code>feat(center): schema homing — a schema lives where its consumer lives</code> — rule + S12 + batteries + gustify regen numbers. <b>2.</b> <code>feat(universe): nested-only schema fold + count badge</code> — station + proof. Homing first: it changes the numbers the fold's proof pins.</p></div>
      <div class="cell"><h4>Re-pins</h4><p>None expected — <code>tests/arch-graph</code>, <code>tests/levels</code>, <code>tests/gabe-universe</code> pin synthetic fixtures or no per-entity schema count (grepped). The committed estate diff (c4-graph.js · levels.json · levels.js) is the only moving artifact.</p></div>
    </div>
''') + '\n</div>\n'

SCRIPT='''
<script>
(function () { "use strict";
  function reg(stageId, svgId, slug, btnId) {
    var stage = document.getElementById(stageId), master = document.getElementById(svgId).cloneNode(true);
    function build() { var cur = stage.querySelector("svg"), next = master.cloneNode(true);
      var on = (typeof MOTION !== "undefined") ? !!MOTION.on : true; next.classList.toggle("run", on); next.classList.toggle("fin", !on); cur.replaceWith(next); }
    window.FXREPLAY = window.FXREPLAY || {}; window.FXREPLAY[slug] = build;
    document.getElementById(btnId).addEventListener("click", build);
  }
  reg("fx-move-stage", "fx-move", "move", "fx-move-replay");
  reg("fx-fold-stage", "fx-fold", "fold", "fx-fold-replay");
  window.__rebuildMotion = function () { Object.keys(window.FXREPLAY).forEach(function (k) { window.FXREPLAY[k](); }); };
})();
</script>
'''
out=head+STYLE+BODY+tail+SCRIPT
open(S+'/schema-homing.html','w').write(out)
print('wrote', len(out), 'bytes')
