#!/usr/bin/env python3
"""Assemble the Coverage Fix Map artifact: kit chrome (3 blocks) + authored content + the wave motion stage.
GABE_ART_OUT=<dir> python3 coverage-fix-map.build.py  (default: the session scratchpad); then the two gates."""
import os, re, html
S = os.environ.get('GABE_ART_OUT') or '/tmp/claude-1000/-home-khujta-projects-gabe-lens/7a371e75-06b2-476e-b06e-ede2b294125e/scratchpad'
KIT = os.environ.get('GABE_ART_KIT') or os.path.expanduser('~/.claude/skills/gabe-artifact/assets/artifact-chrome.html')
kit = open(KIT).read()
head = kit[:kit.index('<div class="artifact-page">')]
tail = kit[kit.index('<!-- ══ BLOCK 2'):]
head = head.replace('<title>Artifact chrome kit — gabe-artifact</title>', '<title>Coverage Fix Map</title>')
if head.lstrip().startswith('<!--'):
    head = re.sub(r'<!--.*?-->', '', head, count=1, flags=re.S)

# wave palette (semantic: which wave a hop arrives in) — never the skin accent
WA, WB, WC, WD = '#8a8f98', '#eda100', '#1baf7a', '#3b82f6'
INK, MUT, RED, VOID = '#dfe5ee', '#8a93a6', '#e5484d', '#0b0e14'

# ── STAGE · J3 grows wave by wave ─────────────────────────────────────────────
# each hop: (label, sublabel, wave or None=today, x, y, width)
W = 236; H = 36
hops = [
    ('endpoint POST …/complete', 'today', None, 20, 60, W),                      # 0
    ('gated_by RateLimit · Idempotency', '+ wave C · middleware', 'C', 20, 140, W),  # 1
    ('depends get_auth_context', '+ C · Hop 0.5', 'C', 276, 140, W),            # 2
    ('resolve_or_create_user', '+ C · w User · COMMITS', 'C', 532, 140, W),     # 3
    ('handler post_complete', 'today', None, 276, 60, W),                       # 4
    ('require_household [gate]', '+ B · a METHOD drawn', 'B', 532, 60, W),      # 5
    ('complete_session', 'today · w 4 models', None, 788, 60, W),               # 6
    ('storage_method_shelf_life', '+ D · reference reveal', 'D', 788, 312, W),  # 7
    ('clear_pending_…_notifications', 'today · w Notification', None, 788, 140, W),  # 8
    ('EventBus.publish [method]', '+ B · a dead end until C', 'B', 788, 226, W),     # 9
    ('dispatches on_cooked_meal… ×2', '+ C · registry census', 'C', 532, 226, W),    # 10
    ('recompute_skills_for_cook', '+ C · w SkillProgress', 'C', 276, 226, W),        # 11
    ('recompute_node_progress…', '+ C · w NodeProgress', 'C', 20, 226, W),           # 12
    ('resp · consumes CompletionResponse/Request', '+ B · touches split (hand-built → no serializes)', 'B', 276, 312, W * 2 + 20),  # 13
]
wires = [  # (from idx, to idx, wave or None[, explicit path])
    (0, 4, None), (4, 6, None), (6, 8, None),
    (0, 1, 'C'), (1, 2, 'C'), (2, 3, 'C'), (3, 4, 'C'),
    (4, 5, 'B'),
    (6, 7, 'D', f'M{788+W} 78 H 1032 V 330 H {788+W}'),        # down the right margin to the reference hop
    (8, 9, 'B'), (9, 10, 'C'), (10, 11, 'C'), (11, 12, 'C'),
    (0, 13, 'B', 'M20 78 H 12 V 330 H 276'),                      # down the left margin to the contract row
]
WCOL = {None: INK, 'A': WA, 'B': WB, 'C': WC, 'D': WD}
WDELAY = {None: 0.0, 'A': 0.3, 'B': 0.5, 'C': 1.7, 'D': 3.1}
def txt(x, y, s, fill=INK, size=12, extra=''):
    return f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}"{extra}>{html.escape(s)}</text>'
g = []
g.append(txt(20, 24, 'J3 · POST /cooking/sessions/{id}/complete — the drawn chain today (white) and what each wave adds', MUT, 12.5, ' letter-spacing=".3"'))
for i, wire in enumerate(wires):
    a, b, wv = wire[0], wire[1], wire[2]
    xa, ya, wa_ = hops[a][3], hops[a][4], hops[a][5]; xb, yb, wb_ = hops[b][3], hops[b][4], hops[b][5]
    if len(wire) > 3:
        d = wire[3]
    elif ya == yb:
        d = f'M{min(xa,xb)+ (wa_ if xa<xb else wb_)} {ya+H/2} H {max(xa,xb)}' if xa != xb else ''
        if xa > xb: d = f'M{xa} {ya+H/2} H {xb+wb_}'
        else: d = f'M{xa+wa_} {ya+H/2} H {xb}'
    else:
        d = f'M{xa+wa_/2} {ya+H if yb>ya else ya} V {yb if yb>ya else yb+H}' if abs((xa+wa_/2)-(xb+wb_/2)) < 40 else \
            f'M{xa+wa_/2} {ya+H if yb>ya else ya} V {(ya+yb+H)/2} H {xb+wb_/2} V {yb if yb>ya else yb+H}'
    col = WCOL[wv]; cls = 'w today' if wv is None else 'w nw'
    dly = WDELAY[wv] + 0.15 * i * (0 if wv is None else 1)
    g.append(f'<path class="{cls}" d="{d}" pathLength="100" stroke="{col}" stroke-width="{2 if wv is None else 2.5}" fill="none" style="animation-delay:{dly:.2f}s"/>')
for i, (lab, sub, wv, x, y, w) in enumerate(hops):
    col = WCOL[wv]; cls = 'hp today' if wv is None else 'hp nw'
    dly = WDELAY[wv] + 0.12 * i * (0 if wv is None else 1)
    g.append(f'<g class="{cls}" style="animation-delay:{dly:.2f}s"><rect x="{x}" y="{y}" width="{w}" height="{H}" rx="6" fill="{col}" fill-opacity="{".10" if wv else ".16"}" stroke="{col}" stroke-width="{1.4 if wv is None else 1.8}"/>{txt(x+8, y+15, lab, INK, 12.5)}{txt(x+8, y+29, sub, MUT if wv is None else col, 12)}</g>')
# wave legend along the bottom
lx = 20
for k, name in (('A', 'A · census + claims'), ('B', 'B · the substrate'), ('C', 'C · roots + wires'), ('D', 'D · draw rule')):
    g.append(f'<rect x="{lx}" y="376" width="12" height="12" rx="3" fill="{WCOL[k]}"/>' + txt(lx + 18, 386, name, MUT, 12.5))
    lx += 190
g.append(txt(20, 410, 'white = drawn today (3 fns) · each coloured hop arrives with its wave · behind 13 → 36 · progression gets its first write edges', MUT, 12.5))
SVG = f'<svg id="fx-waves" class="run" viewBox="0 0 1040 424" role="img" aria-label="the cook-completion chain growing hop by hop as the four fix waves land">{"".join(g)}</svg>'

STYLE = '''
<style>
  :root { --void:#0b0e14; --void-ink:#dfe5ee; --wa:#8a8f98; --wb:#eda100; --wc:#1baf7a; --wd:#3b82f6; }
  .hero-stats { display:flex; flex-wrap:wrap; gap:12px; margin-top:16px; }
  .stat { background:var(--card); border:1px solid var(--rule); border-radius:var(--radius,10px); padding:10px 14px; display:flex; flex-direction:column; gap:2px; min-width:150px; }
  .stat b { font-size:1.35em; line-height:1.1; font-variant-numeric:tabular-nums; }
  .stat span { font-size:var(--fs-xs); color:var(--muted); }
  .voidstrip { background:var(--void); color:var(--void-ink); border-radius:var(--radius,10px); padding:14px; overflow-x:auto; }
  .voidstrip svg { display:block; min-width:880px; width:100%; height:auto; }
  .voidstrip text { font-family:var(--af-stack); }
  .fxbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .fxbar button { font-family:inherit; font-size:var(--fs-sm); color:var(--accent); background:var(--accent-soft); border:1px solid var(--accent); border-radius:8px; padding:4px 12px; cursor:pointer; }
  .fxbar button:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .fxbar .cap { font-size:var(--fs-xs); color:var(--muted); }
  #fx-waves .w { stroke-dasharray:100; stroke-dashoffset:0; } #fx-waves .hp { opacity:1; }
  #fx-waves.run .w.nw { animation:wdraw .6s cubic-bezier(.4,0,.2,1) both; } #fx-waves.run .hp.nw { animation:npop .45s ease both; }
  #fx-waves.fin .w, #fx-waves.fin .hp { animation:none !important; }
  @keyframes wdraw { from { stroke-dashoffset:100; } to { stroke-dashoffset:0; } }
  @keyframes npop { from { opacity:0; } to { opacity:1; } }
  @media (prefers-reduced-motion: reduce) { #fx-waves.run .w.nw, #fx-waves.run .hp.nw { animation:none !important; } }
  .lede { color:var(--ink-soft); max-width:72ch; } .lede b { color:var(--ink); }
  .wave { display:inline-block; font-size:var(--fs-min); font-weight:700; letter-spacing:.05em; text-transform:uppercase; border-radius:5px; padding:1px 7px; color:#fff; }
  .wave.a { background:var(--wa); } .wave.b { background:var(--wb); color:#1a1200; } .wave.c { background:var(--wc); } .wave.d { background:var(--wd); }
  .tag { display:inline-block; font-size:var(--fs-min); font-weight:700; letter-spacing:.04em; text-transform:uppercase; border-radius:5px; padding:1px 6px; color:#fff; }
  .tag.cfg { background:#2f6f8f; } .tag.add { background:#1baf7a; } .tag.chg { background:#c2410c; } .tag.def { background:#6b7280; }
  table.t { border-collapse:collapse; width:100%; font-size:var(--fs-sm); }
  table.t th, table.t td { text-align:left; padding:6px 9px; border-bottom:1px solid var(--rule-soft); vertical-align:top; }
  table.t th { font-size:var(--fs-xs); color:var(--muted); letter-spacing:.06em; text-transform:uppercase; font-weight:600; }
  table.t td.n { font-variant-numeric:tabular-nums; text-align:right; white-space:nowrap; }
  .tw { overflow-x:auto; }
  .grid3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; }
  .cell { border:1px solid var(--rule); border-radius:var(--radius,10px); padding:12px; background:var(--raised); }
  .cell h4 { margin:0 0 6px; font-size:1em; } .cell p { font-size:var(--fs-sm); color:var(--ink-soft); margin:4px 0 0; }
  .cls { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:12px; }
  .cls .cell .hd { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .cls .cell .hd .no { font-weight:700; color:#fff; background:var(--strong); border-radius:999px; padding:1px 8px; font-size:var(--fs-min); }
  .cls .cell .hd b { font-size:1em; }
  .cls .cell .kv { display:grid; grid-template-columns:64px 1fr; gap:3px 8px; font-size:var(--fs-sm); margin-top:8px; }
  .cls .cell .kv i { font-style:normal; color:var(--muted); font-size:var(--fs-xs); letter-spacing:.05em; text-transform:uppercase; padding-top:2px; }
  .cls .cell .kv span { color:var(--ink-soft); }
  .seam { border-collapse:collapse; font-size:var(--fs-sm); }
  .seam th, .seam td { padding:5px 8px; border-bottom:1px solid var(--rule-soft); text-align:center; }
  .seam th { font-size:var(--fs-xs); color:var(--muted); text-transform:uppercase; letter-spacing:.05em; font-weight:600; }
  .seam td:first-child, .seam th:first-child { text-align:left; white-space:nowrap; }
  .seam .dot { display:inline-block; width:11px; height:11px; border-radius:50%; }
  .seam .dot.a { background:var(--wa); } .seam .dot.b { background:var(--wb); } .seam .dot.c { background:var(--wc); } .seam .dot.d { background:var(--wd); }
  .jr { font-size:var(--fs-sm); }
  .jr h4 { margin:12px 0 4px; font-size:1em; }
  .jr .b, .jr .a { border-left:4px solid var(--rule); padding:6px 10px; margin:4px 0; border-radius:0 6px 6px 0; background:var(--card); line-height:1.5; }
  .jr .a { border-left-color:var(--accent); }
  .jr .lbl { font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:600; display:block; margin-bottom:2px; }
  .jr .wb { color:var(--wb); font-weight:700; } .jr .wc { color:var(--wc); font-weight:700; } .jr .wd { color:var(--wd); font-weight:700; } .jr .wa { color:var(--wa); font-weight:700; }
  .jr .del { color:var(--ink-soft); font-size:var(--fs-xs); margin:2px 0 0 10px; }
  .mx { border-collapse:collapse; font-size:var(--fs-sm); }
  .mx th, .mx td { padding:3px 6px; border-bottom:1px solid var(--rule-soft); text-align:center; }
  .mx th { font-size:var(--fs-xs); color:var(--muted); font-weight:600; }
  .mx td:first-child { text-align:left; white-space:nowrap; }
  .mx td.on { color:var(--accent); font-weight:700; } .mx td.off { color:var(--rule); }
  .dec { }
  .dec .kv { display:grid; grid-template-columns:82px 1fr; gap:4px 10px; font-size:var(--fs-sm); margin-top:8px; }
  .dec .kv b { color:var(--muted); font-size:var(--fs-xs); letter-spacing:.06em; text-transform:uppercase; font-weight:600; padding-top:2px; }
  ol.dl { padding-left:20px; font-size:var(--fs-sm); color:var(--ink-soft); } ol.dl li { margin:4px 0; } ol.dl b { color:var(--ink); }
  code { background:var(--raised); border:1px solid var(--rule-soft); border-radius:5px; padding:0 4px; font-size:.95em; }
</style>
'''

ICON = {
    'route': '<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>',
    'layers': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path><path d="m6.08 11-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.9 11"></path>',
    'grid': '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path>',
    'search': '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
    'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v5h5"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>',
    'gavel': '<path d="m14.5 12.5-8 8a2.1 2.1 0 1 1-3-3l8-8"></path><path d="m16 16 6-6"></path><path d="m8 8 6-6"></path><path d="m9 7 8 8"></path><path d="m21 11-8-8"></path>',
    'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
    'bar': '<path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>',
    'swap': '<path d="M8 3 4 7l4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>',
}
def sec(n, icon, title, tag, body):
    return f'''
  <section class="sec" data-sec="{n}">
    <div class="sec-head"><h2><svg viewBox="0 0 24 24" aria-hidden="true">{ICON[icon]}</svg>{title}</h2><span class="n">{tag}</span></div>
    {body}
  </section>'''
def wv(k): return f'<span class="wave {k.lower()}">{k}</span>'
def tg(*ks):
    m = {'config': ('cfg', 'config'), 'additive': ('add', 'additive'), 'change': ('chg', 'change'), 'defer': ('def', 'defer')}
    return ' '.join(f'<span class="tag {m[k][0]}">{m[k][1]}</span>' for k in ks)

# ── the class map (refuter-corrected) ────────────────────────────────────────
CLASSES = [
 (1, 'API routes', '8 of 80 still missing after the twin\'s claims (equipment 2 · meal_plan 2 · e2e_seed 2 · locale 1 · health 1)',
  '<code>parse_endpoints</code> runs only over <code>code.api</code> lists; no route census; every arm keys off <code>entities[*].endpoints</code>.',
  '<code>_a3_code.route_census</code> (the model-census pattern) + pulse S13 + the cc-init rail. The refuter proved a pseudo-entity mint yields node · gates · behind · rollup · bridge but <b>no walk</b> — levels roots <code>fn_edges</code> at function_insight handlers only — so the cure is the CLAIM. Plus a parser defect: 4 routes drawn as <code>/</code> (a <code>_BASE</code> Name path) and a <code>trigger</code> field (user · poll · boot · e2e).',
  ['additive', 'config'], 'A', '3', 'K1 gate census 72 → 80 · K4 gains the seed twin · J1 an e2e twin'),
 (2, 'WS / SSE routes', '2 routes + 1 EventSource opener (not 4); the SSE GET is already drawn as a plain GET',
  '<code>websocket</code> ∉ the verb tuple; streaming has no carrier; <code>_a3_web</code> is a single-idiom extractor — an <code>eventsource</code> regex would never run.',
  '<code>parse_endpoints</code> admits <code>websocket</code> → <code>WS</code> + a <code>transport</code> field keyed on <code>text/event-stream</code> / <code>EventSourceResponse</code> only (StreamingResponse over-fires); a separate always-on transport pass in <code>_a3_web</code> + same-file const resolution; station <code>METHOD.WS</code> + a transport chip; the column station\'s <code>methodOf</code> too.',
  ['additive', 'change'], 'C', '1', 'K3: the stream gets its web entry + a second door (both 403-walled in prod; WS tests attach 0 cases — a join rule is owed)'),
 (3, 'Backend fns in unclaimed files', '52 files · 233 callables · 74 reachable from a handler, 66 within 3 hops in 18 files',
  'File→entity homing drops the fn and every call touching it (9,679 dropped as <code>unmapped_file</code>); function_insight walks mapped trees only; the <code>behind</code> pill counts them, the walk cannot (setup 29 behind / 13 drawn).',
  '<code>file_census</code> + <code>derive_reach</code> (graft BFS: min hops per unclaimed file) + S11/S13; the cure is the claim list (ownership · idempotency · client_ip → auth; ai_credits · ai_spend → progression; recipe_filter_modes · reference/* · pipeline runtime → recipe…). An optional mint must parse census files in a SEPARATE tree set or it becomes change-in-place on every drawn fn\'s fan-in. A tests/ noise rule rides with it.',
  ['additive', 'config'], 'A', '9', 'W1/J1 the claim INSERT + Household/Location writes · W2 +7 catalog readers · W4 idempotency + tier · J7 idempotency · K3 client_ip + record_spend_for → AiSpendLog'),
 (4, 'Class methods', '149 in apps/api (96 claimed, 50 validators); 0 drawn; 6 homed methods have homed callers',
  '<code>derive_functions</code> keeps <code>kind == "function"</code> while <code>_CALLABLE_KINDS</code> already admits methods for behind/d2w/roles — the behind pill leaks <code>require_household</code> on 49 endpoints, the walk never draws it.',
  'ONE line (<code>not in _CALLABLE_KINDS</code>) + <code>method:true</code> on fn_nodes + a station <b>hub relief</b>: a gate-role method with fan-in ≥ N folds into each caller\'s gate badge — else a 47-spoke star on every household journey. fn_nodes 219 → 222 · fn_edges 150 → 199 · hidden_fns +93; 63/65 method calls are inferred.',
  ['change'], 'B', '14', 'every W2–W8 step + J3–J6 + K2/K3 gain the h1 gate wire; J3 gains EventBus.publish (a dead end until 6)'),
 (5, 'Pydantic schemas', '23 absent classes in 6 unclaimed files · schema→model 0 edges · one undirected touches for three roles',
  'Claimed files only (7 endpoints carry a dangling <code>resp</code> string); <code>model_validate</code> is no ORM idiom; <code>from_attributes</code> is an Assign the parser skips; <code>consumes</code> runs after <code>touches</code> and skips claimed targets → 0 intra edges.',
  '(a) config: consent.py → legal-consent, catalog + recipe_filter_mode → recipe (+17 nodes). (b) <code>orm:True</code> + a <code>serializes</code> edge from <code>model_validate</code> sites resolved through the wave-B symtab (today binds ctor/annot only) + a naming arm (strip Response/Summary/Item/Ref/Block/Out → exactly one model), site wins. (c) the role split in <code>_l2</code>: <code>resp</code> (keep the field, add the wire) · <code>consumes</code> (27) · residue <code>touches</code>; three name-filters re-pinned; RELCOL/LINKMETA rows for consumes/nests owed.',
  ['config', 'additive', 'change'], 'B', '18', 'every response leg; K5 is the template (ctor-bound → DTO → RecipeDemand); J1\'s MeResponse blocks → 9 serializes; J3/J6/J8 hand-built → none, honest'),
 (6, 'Event bus + dispatch tables', '1 type · 2 handlers · 1 publish · 1 registration — and PIPELINE_STAGES, the anatomy\'s uncovered idiom (10 stages)',
  'A type-keyed registry is no call: graft\'s only edge out of <code>publish</code> is a TEST closure; handlers are imported inside <code>register_handlers</code> under aliases; every derivation BFSes <code>calls</code>; the AST files <code>bus.publish</code> as a <code>queue</code> sink that renders nowhere.',
  '<code>dispatch_map</code> (registry pass with fn-local alias resolution + publish pass → <code>dispatches</code>, conf census) + <code>dispatch_tables</code> (a module tuple of local def Names + the iterating fn → <code>dispatches</code>, inferred) → folded into the shared adjacency (behind · access · roles · d2w) and <code>functions.calls</code> → levels passes <code>rel</code> through (§3b pulls the writers) → a <code>dispatch</code> wire + legend; demote the queue sink; stats key-conditional.',
  ['additive', 'change'], 'C', '2 + K3', 'J3/W4 step 5: two dispatch wires → 4 fns → SkillProgress · NodeProgress (progression\'s first writes; behind 13 → 36) · K3: run_pipeline → 10 stages'),
 (7, 'Boot / lifespan writers', '34 boot-reachable writer fns; lifespan has 11 resolved graft calls, all dropped',
  'main.py unclaimed; levels has ONE root class (<code>_handlers</code>); unhomed ends are dropped; C4 mints nodes from endpoints/models/schemas only.',
  '<code>parse_boot_roots</code> → a <code>__boot__</code> pseudo-entity injected into <code>graft_arm</code> ONLY (into <code>entities</code> it is a 9th ring entity + S9 noise) + an explicit C4 <code>endpoint:BOOT lifespan</code> under an L1 <code>boot</code> bucket with its own layout branch → levels rule 0 (boot roots join <code>_handlers</code>) → station <code>METHOD.BOOT</code> + the backend-tab chain. A <code>gate:deploy-only</code> floor over the seeders\' three predicates. Later: rootless writers (9 CLI scripts · 4 data migrations).',
  ['additive', 'config'], 'C', '1', 'K4: nothing → a 7-deep BOOT walk (behind 135; 70 fns in claimed files; ≈ +59 nodes). The "SSE persist" and "reminder poller" were mis-filed'),
 (8, 'Middleware + the dependency path', '3 add_middleware · Depends(get_auth_context) on 71/72 · require_household on 48',
  '<code>_endpoint_middleware</code> records NAMES with no import resolution; Depends is not a call (0 graft edges from api/ into <code>get_auth_context</code>); the 409 gate is a METHOD; the User writer sits in unclaimed ownership.py; nothing reads <code>add_middleware</code>.',
  'Resolve Depends targets to <code>file#fn</code> via <code>_file_imports</code> + <code>parse_app_middleware</code> → <code>derive_depends</code> (extracted) + seed behind/access BFS with dep ids → dep fns join <code>drawn_fn</code> → a <code>middleware</code> node kind + <code>gated_by</code> edges {scope} + <code>via:depends</code> on rollups → a <code>gate</code> wire bucket, Guards rows link to nodes, step note "Hop 0.5". Draw only <code>gate=True</code> deps (84 resource-dep wires otherwise); nested deps are not walked; the verifier resolves to the Protocol stub.',
  ['config', 'additive'], 'C', '20', 'every journey gains gated_by → depends get_auth_context → build_auth_context → resolve_or_create_user [w User, COMMITS] → load_household_context; K1 becomes drawable; User: 72 reads → default-dim toggle'),
 (9, 'Integrations', '3 SDK call sites + 3 credential sites + 2 constructors + Sentry; the row\'s 12 = adapters + real/mock pairs',
  'The sink detector reads a one-level attribute on a bare Name; Gemini is 3-deep, Firebase is <code>to_thread(sdk.fn)</code> with an importlib-bound SDK; <code>session.delete</code> tagged http (8 sites, 0 real); <code>external</code> = FK stubs; sinks render nowhere; the Gemini call has no d2w so §3b can never pull it.',
  'A per-module PROVIDER pass (explicit package-root registry + importlib strings; a Call whose chain root is bound, or a bound Attribute passed as an argument) → access unions <code>externals</code> → a <code>provider:&lt;name&gt;</code> node kind (not <code>external</code>) + a <code>reaches</code> wire → fn→provider edges in levels → KINDS.provider + REL2KIND + card + legend. The 5 false http sinks vanish (7 FI entries move).',
  ['config', 'additive', 'change'], 'C', '2', 'J2: delete_identity → reaches provider:firebase · K3: provider:gemini once 4 + 6 land and reaches counts as an anchor'),
 (10, 'Guardrails', '12 gate-named callables (not 25); 1 gate drawn, its 3 callees unhomed, its own read invisible, 2 of 3 callers undrawn',
  'resolution.py unclaimed; <code>select(RecipeIngredient.ingredient_code)</code> is an attribute select the pass ignores; non-handler callers with no d2w never draw; role precedence ERASES the gate the moment its reads land.',
  'config (resolution + normalize → allergen) + the wave-B root-walk + gate-name before accessor (a NEW fixture) + the wave-D draw rule (drawn fn → gate callee; gate → its inputs) + a body-based gate for inline <code>raise HTTPException</code> clocks (K5\'s 429). <code>ensure_principal_household</code> is a gate WITH ops on J1 — claim and precedence interact; the SQL allergen wall isn\'t gate-named → B\'s select_from/join branch.',
  ['config', 'change'], 'D', '5', 'W2 detail: the gate reads its snapshot · W4/J4: the safety decision BEFORE the CookingSession write · W8: the guard between read and write · K3: check_credits / check_spend_cap'),
 (11, 'Reference data', '46 fns in 5 files, 0 drawn; 64 production call edges from 52 callers in 25 files; 9 handler-direct',
  'No <code>reference</code> code layer, nothing claimed; both ends must be homed; levels draws handler-rooted + write-gradient only — a mid-chain read hop is skipped; behind counts them (resolve-batch 15 / 2).',
  'config (<code>code_layers += reference</code>; resolution + safety_warnings → allergen · catalogs + normalize → recipe · fuzzy → pantry) + the wave-D rule (one hop into a reference-layer fn; a <code>FI.get(…, {})</code> guard — the finder\'s join would raise on graft-only fns). REFUTED on reads: <code>build_match_corpus</code> draws PURE (column selects → B); the snapshot gets 2 reads config-only, 3 with B; catalogs.py serves four entities.',
  ['config'], 'D', '7', 'W2 +7 catalog readers · W2 detail: the gate\'s reads · W4/J3: storage_method_shelf_life → PantryItem.expires_at · J7: NORMALIZES, does not resolve · K3: the snapshot + the sanitizer'),
 (12, 'Feature flags', '4 Settings bools · 2 effective props (flag OR is_production) · 1 module Final[bool] · seed_controls',
  'The middleware floor reads the route surface, never the body where <code>if not FLAG: raise 403</code> lives; the flag NAME is collected then discarded; no <code>ast.Raise</code> scan; no census; the FE featureFlags module is drawn at file identity.',
  '<code>parse_flags</code> + <code>_flag_gates</code> (an If whose test leaf ∈ census AND whose body raises — POLARITY matters: <code>if not flag: raise</code> walls, <code>if not flag: return</code> arms) → a <code>flag:&lt;NAME&gt;</code> node kind + <code>walls</code> edges {on_fail} → fn.flags in levels → KINDS.flag + the wire + a Guards "Flags" row + "Walled by X (OFF → 403)". App-level walls draw on the middleware node, never per endpoint (71/72 saturation); show the EFFECTIVE value. Later: the imported symbol on FE imports → fe↔be <code>mirrors</code>.',
  ['config', 'additive'], 'C', '2', 'J7 + K3 + the stream: ONE flag node fanning walls → 403 into three doors'),
 (13, 'AI prompts', 'exactly ONE: a 42-word module string in a 1-entry registry',
  'Module-level Assigns are never visited; the chain is cut three times (unclaimed runner/producer/registry · the PIPELINE_STAGES table · a Protocol render); stages have no d2w → never pulled.',
  'config (registry · runner · state · producer → recipe) + the dispatch-table floor (6) + <code>prompt_registry</code> (registry dict / <code>{placeholder}</code> string consumed by .format/.render) + an ATTACHMENT PULL in levels (backward BFS from <code>rendered_by</code> to the nearest drawn fn, ≤ 6 hops) + KINDS.prompt + <code>fnprompts</code>. Path-only pulls 2 fns; <code>run_pipeline</code> / <code>rate_limit_*</code> are PURE.',
  ['defer'], 'D', '1', 'DEFER until a twin with ≥ 3 prompts — 1 node + 1 wire on gustify; the dispatch floor it needs ships with 6'),
 (14, 'ORM idioms', 'the connector class: 61 attribute-write sites in 21 fns · 91 select(Model.col) + 10 join + select_from in 40 fns · 8 session.delete (false http)',
  'The symtab binds constructor locals + annotated assigns only; no attribute-assign detector at all (the ops loop walks <code>ast.Call</code> only); <code>_name_model</code> takes a bare Name; <code>"session" in recv</code> → http.',
  '<code>_orm_access</code>: +5 binders (single-model select/join RHS · for-loop · Model-annotated params · session.get · same-file annotated helper) + an attribute-assign write branch (NOT flush-gated — session.add is a write without a flush today) + root-of-chain over select/join/select_from + <code>session</code> off the http receivers (guard: require an import-bound http lib, or aiohttp\'s ClientSession is lost) + split <code>commits</code> into commits/flushes/savepoint. Every twin moves: +81 rollup ops over 29/72 endpoints, ~30 role flips, ~60 new pink wires.',
  ['change'], 'B', '14', 'J1: the idempotency DELETE lands red, the false http vanishes · K2: three "pure" helpers read three tables · W4: cancel/advance-stage\'s state flip · W6/W8: the DELETEs draw red · K5: the clock as a pink self-read'),
]
def cls_card(c):
    n, name, count, why, where, tags, wave, jn, jtxt = c
    return f'''<div class="cell"><div class="hd"><span class="no">{n}</span><b>{name}</b>{wv(wave)}{tg(*tags)}</div>
      <p style="margin-top:6px"><b>{count}</b></p>
      <div class="kv"><i>why</i><span>{why}</span><i>where</i><span>{where}</span><i>journeys</i><span><b>{jn}</b> — {jtxt}</span></div></div>'''

# seam matrix: class → seams touched (dot wave)
SEAMS = ['config', '_a3_code', '_a3_graft', '_a3_graph', '_a3_levels', '_a3_web / fe', 'station']
SM = {1: 'AA·A··A', 2: 'C·C·C·C·C', 3: 'AAA·A·A', 4: '··B·B·B', 5: 'BBBBB·B', 6: '·CCCC·C', 7: 'ACCCC·C', 8: 'CCCCC·C', 9: 'CCCCC·C', 10: 'DDD·D·D', 11: 'D···D··', 12: 'C·C·CCC', 13: 'DD·DD·D', 14: '·B·····'}
def seam_rows():
    out = []
    for c in CLASSES:
        n = c[0]; row = SM[n].replace('·', '.')
        cells = ''.join(f'<td>{("<span class=\'dot %s\'></span>" % ch.lower()) if ch != "." else ""}</td>' for ch in row[:7].ljust(7, '.'))
        out.append(f'<tr><td>{n} · {c[1]}</td>{cells}</tr>')
    return ''.join(out)

# journey × class matrix
MX = {
 'W1 setup': '..●●●..●.●...●', 'W2 look': '..●●●..●.●●..●', 'W3 filter': '..●●●..●.....●', 'W4 cook': '..●●●●.●.●●..●', 'W5 pantry': '..●●●..●..●..●',
 'W6 locations': '...●●..●.....●', 'W7 shopping': '...●●..●.....●', 'W8 plan': '...●●..●.●...●', 'J1 setup/complete': '●.●.●..●.●...●', 'J2 DELETE /me': '.......●●....●',
 'J3 cook complete': '...●●●.●..●...', 'J4 start session': '..●●●..●.●...●', 'J5 pantry item': '...●●..●......', 'J6 confirm-bought': '...●●..●......', 'J7 manual recipe': '..●.●..●..●●..',
 'J8 consent': '....●..●......', 'K1 auth commit': '●.●●...●●.....', 'K2 explore': '...●●..●.....●', 'K3 gustify + SSE': '.●●●●●.●●●●●●●', 'K4 seed lane': '●.....●......●', 'K5 demand': '....●..●.●...●',
}
def mx_rows():
    return ''.join(f'<tr><td>{j}</td>' + ''.join(f'<td class="{"on" if ch=="●" else "off"}">{"●" if ch=="●" else "·"}</td>' for ch in row) + '</tr>' for j, row in MX.items())

J = lambda s: s  # journey text helper (already HTML)
BODY = f'''<div class="artifact-page">
  <header>
    <p style="font-size:var(--fs-min);letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0">gabe universe · gustify example · order of work 2 of 3 · draft · pre-flight reviewed</p>
    <h1 style="font-size:2.1em;line-height:1.15;margin:8px 0 0;text-wrap:balance">Coverage Fix Map</h1>
    <p class="lede" style="margin:12px 0 0">Thirteen coverage classes, five seams: the fixes are a <b>dependency graph</b>, not a list. Today a walk shows the handler, its write-path descent and the tables. After the map it shows the gate that runs first and commits the User, the methods and reference readers the walk skips, the second write leg an event fires, the contract each response is serialised from, and the provider the LLM call reaches. Fourteen findings, each adversarially refuted (four on a central claim) — the corrections are folded in. Nothing is built; the waves below are the integration decision.</p>
    <div class="hero-stats">
      <div class="stat"><b>14 → 4</b><span>classes → waves · one substrate commit carries the five change-in-place fixes</span></div>
      <div class="stat"><b>20 / 21</b><span>journeys the substrate touches (middleware · ORM idioms · schemas · methods)</span></div>
      <div class="stat"><b>5 + 4</b><span>new wire kinds (gate · dispatch · serializes · reaches · walls) + node kinds (middleware · provider · flag · prompt)</span></div>
      <div class="stat"><b>8 / 8</b><span>Trace Anatomy items with no class → folded as widenings</span></div>
    </div>
  </header>
''' + sec(1, 'route', 'The waves — J3 grows as each lands', 'stage · replayable', f'''
    <div class="fxbar"><button id="fx-waves-replay" type="button">↻ Replay the waves</button><span class="cap">The cook-completion chain: white = drawn today (3 functions). Each coloured hop arrives with its wave — {wv('A')} census + claims · {wv('B')} the substrate (one change-in-place commit) · {wv('C')} roots + wires (one honest-empty floor per commit) · {wv('D')} the draw rule + station.</span></div>
    <div class="voidstrip" data-fx="waves" id="fx-waves-stage" style="margin-top:10px">{SVG}</div>
    <div class="tw" style="margin-top:12px"><table class="t">
      <thead><tr><th>wave</th><th>what</th><th>tag</th><th>moves existing bytes?</th><th>unblocks</th></tr></thead>
      <tbody>
        <tr><td>{wv('A')} census + claims</td><td><code>route_census</code> + <code>file_census</code> beside <code>model_census</code> (pulse S13 · the cc-init rail); the twin CLAIMS files</td><td>{tg('additive','config')}</td><td>suite no · twin yes (its own claims)</td><td>every class whose evidence sits in an unclaimed file — 8 routes · 233 fns · 23 schemas · reference/* · ownership/idempotency · the pipeline runtime · main.py</td></tr>
        <tr><td>{wv('B')} the substrate</td><td>ORM symtab + attribute writes + select(Model.col)/join/select_from root-walk · <code>session</code> off the http receivers · METHODS admitted + hub relief · gate-name before accessor · <code>touches</code> role split</td><td>{tg('change')}</td><td><b>yes — every twin, one regen, one re-pin round</b></td><td>roles · ops · rollups · fn_edges — the numbers every later wave pins against</td></tr>
        <tr><td>{wv('C')} roots + wires</td><td><code>depends</code> + <code>gated_by</code> · the BOOT root · <code>dispatches</code> (bus + tables) · <code>serializes</code> · <code>provider</code> + <code>reaches</code> · <code>flag</code> + <code>walls</code> · WS + <code>transport</code></td><td>{tg('additive')}</td><td>no — new kinds only, byte-identical when the idiom is absent</td><td>K1 · K4 · J3's second leg · every response leg · K3's LLM hop · the 403 walls</td></tr>
        <tr><td>{wv('D')} draw rule + station</td><td>ONE levels §3c: reveal one hop from a drawn fn into a gate-role fn · a reference-layer fn · a dispatch/depends target · a rendered_by fn — replacing three per-class rules; station kinds + legend rows + the hub fold</td><td>{tg('additive')}</td><td>levels fn counts (stated)</td><td>guardrails · reference · prompts · the walkability of everything C added</td></tr>
        <tr><td>then item 3 · tiers</td><td>the ladder's floors gain the new kinds as rows (the tiers doc already lists depends 2 · dispatches 1 · serializes 3 · boot root)</td><td></td><td></td><td>the noise C–D bring is what the ceiling is for</td></tr>
      </tbody></table></div>
    <p class="lede" style="font-size:var(--fs-sm);margin-top:10px"><b>Why B is one commit:</b> the refuters proved the methods admission is not honest-empty (any project whose handlers call methods moves), the root-walk is the "select-attr half" three classes each ask for, the gate precedence only matters once reads land, and the role split re-pins the same touches counts. Shipped separately: five regens and five re-pin rounds on every twin. <b>Why C is per-commit:</b> each floor is byte-identical when its idiom is absent, so each can land, be measured on gustify, and be reverted alone.</p>
''') + sec(2, 'grid', 'The seam graph — where each fix lives', 'classes × seams · dot = wave', f'''
    <div class="tw"><table class="seam"><thead><tr><th>class</th>{''.join(f'<th>{s}</th>' for s in SEAMS)}</tr></thead><tbody>{seam_rows()}</tbody></table></div>
    <p class="lede" style="font-size:var(--fs-xs);margin-top:8px;color:var(--muted)">Five seams carry thirteen classes. <code>_a3_code</code> (the AST pass) and the station appear in almost every row — the parser learns idioms, the station learns kinds. <code>_a3_graph</code> sits at 1,191 lines against the 800 code budget (report-never-gate): every addition there states the number.</p>
''') + sec(3, 'layers', 'The class map', 'why · where · journeys · verdict (refuter-corrected)', f'''
    <div class="cls">{''.join(cls_card(c) for c in CLASSES)}</div>
''') + sec(4, 'search', 'Journeys — BEFORE → AFTER', 'five carry every grammar element; the matrix covers the rest', f'''
    <div class="jr">
      <h4>J1 · POST /setup/complete — the flagship</h4>
      <div class="b"><span class="lbl">before · 13 fns</span>endpoint [gates: names only] → handler setup_complete → complete_setup [r SetupCompletionState · commits] → _discard_claim [r IdempotencyKey · <span style="color:var(--wb)">false http sink</span>] · _stamp_completion · _upsert_× 6 [each w its preference model] → h3 upsert_exploration_preferences · touches SetupCompleteRequest · MeResponse</div>
      <div class="a"><span class="lbl">after</span><span class="wc">+ gated_by CORS · RateLimit [sensitive] · Idempotency [stamp] → + depends get_auth_context → + build_auth_context → + resolve_or_create_user [+ fnreads / fnwrites User · COMMITS] → + load_household_context [r Membership · Household · Location]</span> → handler → <span class="wa">+ get_idempotency_key</span> → complete_setup → <span class="wa">+ claim [w IdempotencyKey — the INSERT] → + ensure_principal_household [gate · w Household · Location]</span> → _discard_claim [<span class="wb">+ fnwrites IdempotencyKey — the query-bound DELETE · − http</span>] → the upsert fan · <span class="wb">consumes SetupCompleteRequest · resp MeResponse</span> · <span class="wc">+ serializes × 9 → User · Household · Membership · the 6 preference models</span><div class="del">Δ the walk starts one hop earlier (User exists and is committed before the household transaction); the claim is an INSERT, not a read; the response leg closes onto the same six tables the upsert fan writes.</div></div>
      <h4>J3 · POST /cooking/sessions/{{id}}/complete — the domain event (the stage above)</h4>
      <div class="b"><span class="lbl">before · 3 fns</span>endpoint → post_complete → complete_session [w CookingSession · DishHistoryEvent · IngredientHistoryEvent · PantryItem · commits] → clear_pending_cooking_timer_notifications [w Notification] · touches CompletionRequest · CompletionResponse</div>
      <div class="a"><span class="lbl">after</span><span class="wc">+ gated_by RateLimit [sensitive] · Idempotency [stamp, unread] → + depends get_auth_context → [K1 chain]</span> → post_complete → <span class="wb">+ require_household [gate · a method]</span> → complete_session → <span class="wd">+ storage_method_shelf_life [reference; feeds PantryItem.expires_at]</span> → clear_pending… → <span class="wb">+ EventBus.publish [method]</span> → <span class="wc">+ dispatches on_cooked_meal_created × 2 → recompute_skills_for_cook [w SkillProgress] · recompute_node_progress_for_cook → _upsert_node_progress [w NodeProgress] · + writes_to SkillProgress · NodeProgress (progression's first write edges)</span> · <span class="wb">consumes CompletionRequest · resp CompletionResponse (hand-built → no serializes)</span><div class="del">Δ the second write leg the catalog verified and the map never drew; behind 13 → 36; the queue sink on post_complete stops lying.</div></div>
      <h4>K3 · POST /recipe-creation/gustify + the SSE tail — credit gate → LLM → persist</h4>
      <div class="b"><span class="lbl">before · 6 fns · screens none bridged</span>endpoint → post_create_gustify → _gustify_response · _raise_for_pipeline_error → generate_gustify_recipe [w RecipeCreationRequest · commits · <span style="color:var(--wb)">false http</span>] → reclaim_if_abandoned → enqueue_unknown_ingredients [w IngredientReconciliationQueue] · SSE: stream_gustify → _sse_frames · stream_gustify_events → _finalize_stream</div>
      <div class="a"><span class="lbl">after</span><span class="wc">+ flag:RECIPE_CREATION_ENABLED —walls (OFF → 403)→ POST · GET …/stream · WS …/ws · + screen sse.ts —bridge→ GET …/stream [transport sse] · + WS door (bypasses the rate limiter) · + gated_by RateLimit [sensitive] → + depends get_auth_context → [K1 chain]</span> → <span class="wb">+ require_household</span> → handler → <span class="wa">+ get_idempotency_key · + client_ip</span> → generate_gustify_recipe [<span class="wb">− http</span>] → <span class="wd">+ load_resolution_snapshot [r CanonicalIngredient · IngredientAlias · IngredientRestriction]</span> → <span class="wd">+ check_credits · + check_spend_cap [gates]</span> → <span class="wc">+ run_pipeline → + dispatches validate_request · rate_limit_user · rate_limit_ip · circuit_breaker · build_prompt (→ + fnprompts prompt:recipe_suggestion.v1) · gemini_call → + reaches provider:gemini</span> → <span class="wa">+ record_spend_for → + record_spend [w AiSpendLog]</span> → reclaim_if_abandoned [<span class="wb">pure → accessor</span>] → enqueue… · <span class="wb">consumes GustifyCreateRequest · resp GustifyCreationResponse</span> → <span class="wc">+ serializes → RecipeCreationRequest</span><div class="del">Δ the only external-spend journey stops jumping from the service to its writes: the wall, the gate, the ten stages, the provider and the ledger appear in order.</div></div>
      <h4>K1 · the auth provisioning commit on every request</h4>
      <div class="b"><span class="lbl">before</span>nothing — a NAME on 71 endpoint cards ("Gated by get_auth_context")</div>
      <div class="a"><span class="lbl">after</span>endpoint × 72 → <span class="wc">+ gated_by CORS [all] · RateLimit [global 120/min · sensitive 20/min on 23] · Idempotency [mutating] → + depends get_auth_context (or …_from_query on the stream) → + build_auth_context → + resolve_or_create_user [fnreads User · fnwrites User · COMMITS — the first-sight write] → + load_household_context [fnreads Membership · Household · Location]</span> → handler. The verifier resolves to the Protocol stub; the Firebase hop is class 9 (<span class="wc">+ reaches provider:firebase</span>). /healthz is the one gate-free route; the WS door calls build_auth_context directly.<div class="del">Δ the catalog's missing journey exists; User becomes the most-read model (72) — hence the via:depends tag and a default-dim toggle.</div></div>
      <h4>K2 · GET /recipes/explore — the "pure read"</h4>
      <div class="b"><span class="lbl">before · 9 fns</span>explore_recipes → build_candidate · build_cooked_ledger · filter_candidates · rerank_by_preferences [pure] · get_exploration_preferences [r UserExplorationPreferences] · compute_recipe_availability [pure] · iter_candidate_recipes [r Recipe] · load_user_allergens [r UserDietaryProfile]</div>
      <div class="a"><span class="lbl">after</span><span class="wc">+ gated_by RateLimit [global] → + depends get_auth_context → [K1 chain: fnwrites User, commits]</span> → <span class="wb">+ require_household [gate] · + ExplorationBias.from_lists [method]</span> → explore_recipes [<span class="wb">caller → ACCESSOR · + fnreads RecipeIngredient</span>] · build_cooked_ledger [<span class="wb">pure → ACCESSOR · + r DishHistoryEvent · Recipe · RecipeIngredient</span>] · compute_recipe_availability [<span class="wb">pure → ACCESSOR · + r RecipeIngredient</span>] · <span class="wb">resp ExploreResponse</span> → nests RecipeListItem → <span class="wc">+ serializes → Recipe</span><div class="del">Δ not pure: Hop 0.5 commits User; three "pure" helpers were reading three tables; the response finally terminates at Recipe.</div></div>
    </div>
    <h4 style="margin:16px 0 6px">Which classes change which journey</h4>
    <div class="tw"><table class="mx"><thead><tr><th>journey</th>{''.join(f'<th>{i}</th>' for i in range(1, 15))}</tr></thead><tbody>{mx_rows()}</tbody></table></div>
    <p class="lede" style="font-size:var(--fs-xs);margin-top:6px;color:var(--muted)">Columns 8 (middleware), 14 (ORM idioms), 5 (schemas) and 4 (methods) touch almost every journey — they are the substrate and the reason wave B is one commit.</p>
''') + sec(5, 'file', 'Trace Anatomy cross-check', 'every node and connector the artifact names → a class', f'''
    <div class="grid3">
      <div class="cell"><h4>Covered by the 14</h4><p>screen · endpoint · gate/Depends · handler · service fn · accessor · method · model · FK · event handler write · response schema · row→DTO · auth dependency · boot writer · Pydantic validators · RateLimitMiddleware · list-dispatched pipelines · service-side serialisation · external sinks · query-bound deletes · unit-of-work writes · column/join reads · idempotency — each maps to a row above.</p></div>
      <div class="cell"><h4>Not covered → folded as widenings (8)</h4><p>PIPELINE_STAGES table dispatch → 6 · transaction boundaries commit/flush/savepoint → 14 · rootless writers CLI + migrations → 7 · tests/ as graft callers → 3 (a noise rule) · the hub-gate render policy → 4 (station) · sinks rendering nowhere → 9 · inline body gates with no function → 10 · endpoint trigger provenance user/poll/boot/e2e → 1.</p></div>
      <div class="cell"><h4>Already drawn (not gaps)</h4><p>72 endpoints · 57 models · 123 schemas · 32 screens · 8 FK stubs; 219 fn nodes / 150 calls; touches 125 · nests 54+15 · fk 56+40 · bridge 48; access wires 212; middleware names on 72/72; behind pills on 72/72; the schema-homing fn wires (76). The census check kept the finders from calling any of these a gap.</p></div>
    </div>
''') + sec(6, 'gavel', 'Decisions owed', 'eleven · overrule any', f'''
    <ol class="dl">
      <li><b>The twin's claims</b> — the census makes 52 files visible; claiming is yours. The 17-file request-path list is in the digest (class 3); route files (1), schema files (5), reference/* (11), the pipeline runtime (13), main.py (7) are named per class. catalogs.py serves four entities — first-claim-wins colours it as one.</li>
      <li><b>Wave B as one commit</b> — five change-in-place fixes, one regen, one re-pin round (recommended) vs five landings each moving the same numbers.</li>
      <li><b>Attribute-write gating</b> — not flush-gated (recommended: session.add is a write without a flush today; 12 fns gain a write) vs flush-gated (9).</li>
      <li><b>Gate precedence</b> — gate-name before accessor (recommended; a guard that reads is still a guard; needs a NEW fixture) vs today's order (the only gate badge disappears when its reads land).</li>
      <li><b>Hub relief for methods</b> — fold a gate-role method with fan-in ≥ N into each caller's gate badge (recommended) vs bundle the wires vs the 47-spoke star.</li>
      <li><b>Which deps draw</b> — only gate=True deps (recommended; 84 resource-dep wires otherwise) vs all.</li>
      <li><b>The BOOT root's seat</b> — pseudo-entity into graft_arm only + an explicit node (recommended) vs into entities (a 9th ring entity; S9 noise).</li>
      <li><b>session as an http receiver</b> — require an import-bound http lib (recommended; keeps aiohttp's ClientSession) vs blanket subtraction.</li>
      <li><b>The consolidated §3c draw rule</b> (wave D) vs three per-class rules — one rule, one battery.</li>
      <li><b>AI prompts</b> — defer until a twin with ≥ 3 prompts (recommended; 1 node + 1 wire on gustify); the dispatch-table floor still ships with the event bus.</li>
      <li><b>touches role split</b> — ship in B (recommended; three name-filters re-pinned, RELCOL/LINKMETA rows added) vs keep the undirected wire and add serializes only.</li>
    </ol>
    <div class="grid3" style="margin-top:12px"><div class="cell panel dec"><h4>DECISION · integration shape</h4><div class="kv"><b>chose</b><span>four waves (census + claims · ONE substrate commit · per-floor roots + wires · one draw rule + station) over fourteen per-class commits</span><b>assumed</b><span>every twin regenerates once per wave; the batteries pin numbers, not shapes, so one re-pin round per moving wave is the cost</span><b>breaks if</b><span>a twin cannot absorb wave B's move in one regen — then split B by file (_a3_code first, _a3_graft second — two regens, stated)</span></div></div></div>
''') + sec(7, 'swap', 'Pre-flight amendments', 'review 2026-08-27 · 7 lenses · 3 real defects, absorbed', f'''
    <div class="grid3">
      <div class="cell panel"><h4>P1 · kind extensibility is PRE-C, station-first</h4><p>Every new node kind hits a FIXED kind list three times: <code>_a3_graph._L2_KINDS</code> (<code>.index()</code> raises — the build crashes), the column station (<code>x = kc[kind]*COLW</code> → NaN), the Universe adapter (unknown kinds DROPPED). One commit before the first floor: append <code>middleware · provider · flag · prompt</code> in one step (a stated one-time order move), an unknown-kind guard in both stations, and REL2KIND / RELCOL / LINKMETA / card rows for every new rel — else each renders as a PROVEN calls wire. "Station deferred to D" is withdrawn.</p></div>
      <div class="cell panel"><h4>P2 · serializes would un-fold the schema fold</h4><p>The landed fold marks a schema WIRED on any non-function wire; <code>serializes</code> is schema→model, so every Block would reappear. The fold treats serializes as composition (like nests) — one line + a pin in the fold proof.</p></div>
      <div class="cell panel"><h4>P3 · the gate swap needs its levels half</h4><p><code>_a3_levels</code> attaches <code>access</code> only when role == accessor — a fn re-labelled gate loses its drawn reads. Attach access for ANY role with ops; land the precedence swap FIRST as a byte-identical commit; the http-lib guard reads the module's imports (the fn node cannot); a flush-only fn STAYS a d2w anchor (the split is a label); decide whether the solo exemption narrows to w-ops.</p></div>
      <div class="cell"><h4>P4 · the second twin</h4><p>gastify vendors no graph-arm module and has no committed c4/levels; propagate is update-only — "every twin, one regen" was gustify-only. Wave A gains a one-time gastify graph-arm adoption; its idioms enter the detectors as idioms (Annotated-alias Depends · pydantic_ai provider · BACKGROUND TASKS as a root kind · websocket_connect tests), never as gustify-shaped registries. <code>_a3_tiers.py</code> (item 3) needs the same adoption step.</p></div>
      <div class="cell"><h4>P5 · honest-empty as a rule</h4><p>Every new key is emitted ONLY when non-empty (the schema_homing idiom) with a per-floor pin; the regen --check normalizer learns any new index-state counter; synthetic dispatches/depends fold into the adjacency + functions.calls only, never into wiring edges (L1 kinds would move).</p></div>
      <div class="cell"><h4>P6 · no new pseudo-entities</h4><p><code>__unclaimed__</code> is special-cased by literal at 25 sites; the BOOT node and unhomed flags live in that existing bucket (label "unclaimed · platform" in item 3).</p></div>
      <div class="cell"><h4>P7 · the walk must learn the rels</h4><p>The backend-chain collector, the card's calls list and the tiers' reach walk follow calls only — J3's dispatch leg and K1's Hop 0.5 would draw but not walk. Wave D: the walkable rel set gains dispatches + depends; the tiers doc gets floor rows + why codes for every new kind (it has none today).</p></div>
      <div class="cell"><h4>P8 · re-pins · claims · tests</h4><p>The pins wave B moves are the Universe proofs + the estate (fixture batteries pin no gustify number); the decayed proofs fail on chrome pins, so a recorded baseline run precedes B, not a re-pin. The _BASE route-id fix is wave B (it renames node ids). The claims commit moves L1 coupling. First-claim-wins is two rules (config order vs alphabetical) — unify before claiming. An undeclared code_layers layer is a silent no-op — report it. Methods and the new kinds cannot be test-credited by name → the card says n/a, never red. The trigger field has no seat → dropped.</p></div>
    </div>
    <p class="lede" style="font-size:var(--fs-sm);margin-top:10px"><b>Waves after amendment:</b> A census + claims + first-claim rule + layer report + gastify adoption · <b>pre-C</b> kind extensibility (station-first) · B precedence → root-walk + symtab + attr writes + sinks guard + role split + access-for-any-role → methods + hub fold · C per floor with its honest-empty pin and station rows · D the reveal rule + the walkable rel set · then tiers with floor rows for every kind.</p>
''') + sec(8, 'alert', 'Gaps the map does not close', 'honest residue', f'''
    <div class="grid3">
      <div class="cell"><h4>Residual floors after every class</h4><p>Cross-file helper returns bind nothing (owned_mode in an unclaimed file — the cupo attach write stays undrawn until claimed); dict-comprehension bindings; multi-model selects; <code>_upsert_by_code(session, Model, …)</code>'s parameterised writes (5 reference models on the BOOT lane); the SQL allergen wall (<code>select(1).select_from().join()</code>) — B's select_from/join branch reaches it, name-based gating does not.</p></div>
      <div class="cell"><h4>Trust</h4><p>63/65 method calls and every boot wire are graft-inferred; the registry dispatch match is a census; depends is extracted. Carry <code>conf</code> on every new edge so the station's floor/census split holds.</p></div>
      <div class="cell"><h4>Dormant paths draw as live</h4><p>Both AI doors are 403-walled in prod; every seeder gates on LOCAL/sqlite; the sandbox on STAGING. The <code>walls</code> edge and the <code>gate:deploy-only</code> floor keep the picture honest — without them wave C paints production behaviour that never runs.</p></div>
      <div class="cell"><h4>Owed later</h4><p>Rootless writers beyond boot (9 CLI scripts, 4 data migrations); a WS test-attachment join rule; and the numbers: every pin in tests/{{orm-access, arch-graph, levels, gabe-universe, codebase-graph}} and the committed estate re-base once per moving wave — the commit message carries them.</p></div>
    </div>
''') + sec(9, 'bar', 'Provenance', 'how this was measured', f'''
    <div class="grid3">
      <div class="cell"><h4>The workflow</h4><p><code>wf_37cd71af-e77</code> (2026-08-27): 14 class finders + a Trace Anatomy cross-check → 14 adversarial refuters; 29 agents · 4.4M tokens · 972 tool uses · 72 min; gustify read-only, suite at <code>4af0f4b</code>. Four findings refuted on a central claim (api-routes: a mint yields no walk · ws-sse: the single-idiom extractor · integrations: methods + d2w block the LLM hop · reference-data: column selects draw pure); every finding corrected on line cites, counts and hop nesting.</p></div>
      <div class="cell"><h4>Evidence in the repo</h4><p><code>docs/design/codebase-graph-consolidation/COVERAGE-FIX-MAP.md</code> (this map) · <code>fix-map/findings-digest.txt</code> (per class: finding · refuter checks · corrections · misses) · <code>fix-map/findings.json.gz</code> (raw returns) · <code>fix-map/chain.py</code> + <code>before-chains.txt</code> (the BEFORE chains from the committed estate — one deterministic source).</p></div>
      <div class="cell"><h4>Baseline</h4><p>The committed gustify example at HEAD <code>4af0f4b</code>: 72 endpoints · 219 fn nodes · 150 fn edges · 212 access edges. Finders that measured HEAD~3 (67 · 210 · 145 · 206) were re-based by their refuters; every pinned number in a landing commit re-measures against the tree, not HEAD.</p></div>
    </div>
''') + '\n</div>\n'

SCRIPT = '''
<script>
(function () { "use strict";
  var stage = document.getElementById("fx-waves-stage"), master = document.getElementById("fx-waves").cloneNode(true);
  function build() { var cur = stage.querySelector("svg"), next = master.cloneNode(true);
    var on = (typeof MOTION !== "undefined") ? !!MOTION.on : true; next.classList.toggle("run", on); next.classList.toggle("fin", !on); cur.replaceWith(next); }
  window.FXREPLAY = window.FXREPLAY || {}; window.FXREPLAY["waves"] = build;
  window.__rebuildMotion = function () { Object.keys(window.FXREPLAY).forEach(function (k) { window.FXREPLAY[k](); }); };
  document.getElementById("fx-waves-replay").addEventListener("click", build);
})();
</script>
'''
out = head + STYLE + BODY + tail + SCRIPT
os.makedirs(S, exist_ok=True)
open(os.path.join(S, 'coverage-fix-map.html'), 'w').write(out)
print('wrote', len(out), 'bytes →', os.path.join(S, 'coverage-fix-map.html'))
