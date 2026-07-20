#!/usr/bin/env python3
"""Generate the section-template lab: per-section layout directions over the A3 skin."""
import shutil
from pathlib import Path

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[2]
(OUT / 'assets').mkdir(parents=True, exist_ok=True)
shutil.copy(REPO / 'templates/center/shell/a3.css', OUT / 'assets/a3.css')

IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>'

# exclusive icons (Feather-style strokes) — one per section, one per page; no icon repeats
ICON_PATHS = {
 'map':        '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
 'zap':        '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
 'trello':     '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="9"/><rect x="14" y="7" width="3" height="5"/>',
 'layers':     '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
 'book':       '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
 'check-circle':'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
 'archive':    '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
 'award':      '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
 'clock':      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
 'bell':       '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
 'list':       '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
 'alert-triangle':'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
 'git-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
 'inbox':      '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
 'box':        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
 'file-text':  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
 'book-open':  '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
 'table':      '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>',
 'camera':     '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
 'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
 'image':      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
 'git-commit': '<circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/>',
 'tag':        '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
 'external-link':'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
}
def icon(name):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round">{ICON_PATHS[name]}</svg>')
SEC_ICON = {'now.recent-changes':'clock','now.needs-you':'bell','board.rail':'list',
 'board.review-debt':'alert-triangle','board.nonphase':'git-branch','board.backlog':'inbox',
 'entities.index':'box','docs.feature-cards':'file-text','docs.foundations':'book-open',
 'testing.matrix':'table','testing.proof':'camera','testing.walks':'user-check',
 'testing.shelf':'image','ledger.change':'git-commit','releases.showcase':'tag',
 'leaf.reports':'external-link'}
PAGE_ICON = {'index':'map','now':'zap','board':'trello','entities':'layers','docs':'book',
 'testing':'check-circle','ledger':'archive','releases':'award'}

LAB_CSS = """/* lab.css — supplement for the section-template lab (frames + direction-specific shapes).
   Everything content-level uses a3.css vocabulary; nothing here ships with the templates. */
.labsec{margin:0 0 46px}
/* tinted section head: group-color banner, distinct from the page bg + white panels */
.sechead{display:flex;gap:14px;align-items:flex-start;background:color-mix(in srgb,var(--gc,var(--accent)) 9%,var(--surface));border:1px solid color-mix(in srgb,var(--gc,var(--accent)) 30%,transparent);border-radius:12px;padding:14px 16px;margin:0 0 14px;box-shadow:var(--shadow)}
.secic{width:40px;height:40px;flex:none;border-radius:10px;background:var(--gc,var(--accent));color:#fff;display:grid;place-items:center}
.secic svg{width:20px;height:20px}
.sechead h2{margin:0;font-size:1.02rem;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sechead .lede{margin:3px 0 0;color:var(--ink-2);font-size:.84rem}
.labsec .hosts{font:var(--mono);font-size:.68rem;color:var(--ink-2);background:color-mix(in srgb,var(--surface) 78%,transparent);border:1px solid color-mix(in srgb,var(--gc,var(--accent)) 22%,transparent);border-radius:8px;padding:8px 12px;margin:10px 0 0}
.labsec .hosts b{color:var(--accent-ink)}
/* direction heads pick up a faint group tint; badges wear the group color */
.labsec .dirhead{background:color-mix(in srgb,var(--gc,#888) 6%,var(--panel))}
.labsec .dirbadge{background:var(--gc,var(--sidebar))}
/* page-title banner */
.pbanner{display:flex;gap:14px;align-items:center;background:color-mix(in srgb,var(--gc,var(--accent)) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--gc,var(--accent)) 32%,transparent);border-radius:14px;padding:16px 18px;margin:0 0 18px;box-shadow:var(--shadow)}
.pbanner .secic{width:46px;height:46px;border-radius:12px}
.pbanner .secic svg{width:23px;height:23px}
.pbanner h1{margin:0;font-size:1.35rem;letter-spacing:-.02em}
.pbanner p{margin:2px 0 0;color:var(--ink-2);font-size:.88rem}
.dir{border:1px solid var(--line);border-radius:12px;margin:16px 0;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}
.dirhead{display:flex;gap:12px;align-items:baseline;padding:11px 16px;border-bottom:1px solid var(--line);background:var(--panel)}
.dirbadge{font:var(--mono);font-weight:700;font-size:.72rem;background:var(--sidebar);color:#fff;border-radius:6px;padding:2px 8px}
.recpill{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--good);background:var(--good-soft);border-radius:20px;padding:2px 9px}
.dirhead b{font-size:.88rem}
.dirhead p{margin:0;font-size:.76rem;color:var(--muted);flex:1;text-align:right}
.dirbody{padding:16px}
/* timeline */
.tline{list-style:none;margin:0;padding:0 0 0 6px}
.tline li{position:relative;padding:0 0 18px 22px;border-left:2px solid var(--line)}
.tline li:last-child{padding-bottom:2px;border-left-color:transparent}
.tline li::before{content:"";position:absolute;left:-6px;top:2px;width:10px;height:10px;border-radius:50%;background:var(--accent);border:2px solid var(--surface);box-shadow:0 0 0 1px var(--line)}
.tline .tdate{font:var(--mono);font-size:.66rem;color:var(--muted)}
.tline .tsha{font:var(--mono);font-size:.68rem;color:var(--accent-ink);background:var(--accent-soft);border-radius:5px;padding:1px 6px;margin-right:6px}
.tline b{font-size:.85rem}
.tline small{display:block;color:var(--muted);font-size:.76rem;margin-top:2px}
/* kanban */
.kb{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kbcol{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px}
.kbcol h4{margin:0 0 8px;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.kbcard{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:9px 11px;margin:6px 0;font-size:.8rem;box-shadow:var(--shadow)}
.kbcard small{display:block;color:var(--muted);font-size:.7rem;margin-top:2px}
.kbcard.red{border-color:#f0cfcf;background:var(--bad-soft)}
.kbempty{border:1px dashed var(--line);border-radius:8px;padding:10px;color:var(--faint);font-size:.76rem;text-align:center}
/* queue */
.queue{list-style:none;margin:0;padding:0;counter-reset:q}
.queue li{display:grid;grid-template-columns:30px 1fr 110px 60px;gap:12px;align-items:center;padding:10px 6px;border-top:1px solid var(--line-2);font-size:.84rem}
.queue li:first-child{border-top:none}
.queue li::before{counter-increment:q;content:counter(q);font:var(--mono);font-weight:700;color:var(--accent-ink);background:var(--accent-soft);border-radius:8px;width:26px;height:26px;display:grid;place-items:center}
.queue .why{color:var(--muted);font-size:.74rem;display:block}
/* stepper lanes */
.lane{display:grid;grid-template-columns:190px 1fr 110px;gap:14px;align-items:center;padding:10px 6px;border-top:1px solid var(--line-2)}
.lane:first-child{border-top:none}
.lane b{font-size:.82rem}
.lane small{display:block;color:var(--muted);font-size:.7rem}
.steps{display:flex;gap:4px}
.step{height:9px;flex:1;border-radius:5px;background:var(--line-2)}
.step.g{background:var(--good)}.step.w{background:var(--warn)}.step.r{background:var(--bad)}
.steplab{font:var(--mono);font-size:.62rem;color:var(--muted);text-align:right}
/* tiles */
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:13px 14px;box-shadow:var(--shadow)}
.tile b{font-size:.86rem}
.tile p{margin:3px 0 0;font-size:.74rem;color:var(--muted)}
.tile.hot{border-left:3px solid var(--warn)}
/* density strip */
.dstrip{display:flex;gap:6px;align-items:stretch;min-height:86px}
.dcell{border-radius:9px;color:#fff;padding:9px 11px;display:flex;flex-direction:column;justify-content:flex-end;font-size:.72rem;font-weight:600;background:var(--accent)}
.dcell small{font-weight:400;opacity:.8}
/* dot wall */
.dots{display:flex;flex-wrap:wrap;gap:3px;margin:6px 0 2px}
.d8{width:9px;height:9px;border-radius:2.5px;background:var(--good)}
.d8.f{background:var(--bad)}.d8.u{background:var(--line)}
/* split */
.split{display:grid;grid-template-columns:1.15fr 1fr;gap:14px;align-items:start}
/* lab shots */
.lgal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.lshot{border:1px solid var(--line);border-radius:9px;overflow:hidden;background:var(--surface)}
.lshot .ph{height:74px;background:linear-gradient(135deg,var(--accent-soft),var(--panel));display:grid;place-items:center;color:var(--accent-ink);font:var(--mono);font-size:.64rem}
.lshot figcaption{padding:6px 9px;font-size:.68rem;color:var(--ink-2)}
/* misc */
.padded{padding:14px 16px}
.mono{font:var(--mono)}
.agetag{font:var(--mono);font-size:.62rem;color:var(--warn);background:var(--warn-soft);border-radius:5px;padding:1px 6px;white-space:nowrap}
.agetag.red{color:var(--bad);background:var(--bad-soft)}
.oktag{font:var(--mono);font-size:.62rem;color:var(--good);background:var(--good-soft);border-radius:5px;padding:1px 6px;white-space:nowrap}
.maptbl code{font:var(--mono);font-size:.7rem;background:var(--accent-soft);color:var(--accent-ink);border-radius:5px;padding:1px 6px}
/* landed-map palette: group accents + command chips (colors verbatim from the map artifact's CSS vars) */
.kchip{font:var(--mono);font-size:.6rem;font-weight:700;letter-spacing:.02em;padding:2px 8px;border-radius:20px;white-space:nowrap;background:color-mix(in srgb,var(--kc) 16%,transparent);color:var(--kc)}
.kchip.v{border:1px dashed var(--kc)}
.kchip.r{border:1px dotted var(--kc);opacity:.78}
.kchips{display:flex;flex-wrap:wrap;gap:5px 6px;align-items:center;margin-top:8px}
.kchips .klab{font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;font-weight:600;margin-right:2px}
.gtag{font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gc)}
.secchip{font:var(--mono);font-size:.7rem;background:color-mix(in srgb,var(--gc,var(--accent)) 13%,transparent);color:var(--gc,var(--accent-ink));border-radius:5px;padding:1px 7px}
.tlink{color:var(--accent-ink);text-decoration:underline;text-underline-offset:2px}
.newmark{font:var(--mono);font-size:.6rem;color:#c0392b;font-weight:700}
"""
(OUT / 'assets/lab.css').write_text(LAB_CSS)

# ---------- helpers ----------
def panel(inner): return f'<div class="panel">{inner}</div>'
def padded(inner): return f'<div class="panel"><div class="padded">{inner}</div></div>'
def tbl(headers, rows, cls=''):
    h = ''.join(f'<th>{x}</th>' for x in headers)
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="panel {cls}"><table class="tbl"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'
def surfrow(title, sub, right='', tag=''):
    t = f'<span class="agetag">{tag}</span>' if tag else '<span></span>'
    return (f'<a class="surfrow" href="#"><span class="ic">{IC}</span>'
            f'<span class="nm"><b>{title}</b><small>{sub}</small></span>'
            f'<span class="ct">{right}</span>{t}</a>')
def direction(letter, name, rationale, body, rec=False):
    pill = '<span class="recpill">recommended</span>' if rec else ''
    return (f'<div class="dir"><div class="dirhead"><span class="dirbadge">{letter}</span>'
            f'<b>{name}</b>{pill}<p>{rationale}</p></div><div class="dirbody">{body}</div></div>')

# --- the landed map's palette, verbatim (light-scheme values; dark variants for the dark sidebar) ---
GROUP = {'NOW':('#0d7a84','#3bb3bd'),'BOARD':('#1f6feb','#6aa6f5'),'ENTITIES':('#0a7d6b','#4fc3a8'),
         'DOCS':('#8e4585','#c98bbb'),'TESTING':('#3f6d4c','#6fa77d'),'LEDGER':('#9a5a00','#d79a3c'),
         'RELEASES':('#7a5a8a','#b795c9'),'LEAF':('#8494a4','#8494a4')}
CMD = {'scope':('/gabe-scope','#0a7d6b'),'plan':('/gabe-plan','#1f6feb'),'red':('/gabe-red','#c0392b'),
       'exec':('/gabe-execute','#2f8f57'),'review':('/gabe-review','#b5771a'),'commit':('/gabe-commit','#5a53a8'),
       'push':('/gabe-push','#0d7a84'),'walk':('/gabe-walk','#c2461e'),'feature':('/gabe-feature','#8e4585'),
       'init':('/gabe-init','#7b8698'),'guard':('hooks·guard','#9c2350'),'adopt':('/gabe-adopt','#5f7d2e')}
def kchip(c, mode='w'):
    label, col = CMD[c]
    cls = {'w':'','v':' v','r':' r'}[mode]
    return f'<span class="kchip{cls}" style="--kc:{col}">{label}</span>'
def kchips(writes, verifies=(), reads=()):
    return ('<div class="kchips"><span class="klab">written by</span>'
            + ''.join(kchip(c) for c in writes) + ''.join(kchip(c, 'v') for c in verifies)
            + ''.join(kchip(c, 'r') for c in reads) + '</div>')

TPL = '../../../templates/center/shell/'   # the shipped raw skeletons (placeholder tokens visible)
PRE = '../../design/verification-first/shell-preview/'  # the filled interlinked preview
def host(page_name, slot):
    return (f'<a class="tlink" href="{TPL}{page_name}">{page_name}</a> → '
            f'<span class="mono" style="font-size:.68rem">{slot}</span> '
            f'(<a class="tlink" href="{PRE}{page_name}">filled</a>)')

def labsec(sid, group, name, hosts, sources, dirs, lede='', cmds=''):
    gc = GROUP[group][0]
    anchor = sid.replace('.', '-')
    ld = f'<p class="lede">{lede}</p>' if lede else ''
    return (f'<div class="labsec" id="{anchor}" style="--gc:{gc}">'
            f'<div class="sechead"><span class="secic">{icon(SEC_ICON[sid])}</span><div style="flex:1">'
            f'<h2><span class="gtag">{group}</span> {name} <code class="secchip">data-sec="{sid}"</code></h2>'
            f'{ld}<div class="hosts"><b>hosts:</b> {hosts} &nbsp;·&nbsp; <b>sources:</b> {sources}{cmds}</div>'
            f'</div></div>'
            + ''.join(dirs) + '</div>')

# ---------- lab sidebar ----------
PAGES = [('index','Guide & mapping'),('now','NOW'),('board','BOARD'),('entities','ENTITIES'),
         ('docs','DOCS'),('testing','TESTING'),('ledger','LEDGER'),('releases','RELEASES')]
SUBS = {'now':[('now.recent-changes','Recent changes'),('now.needs-you','Needs-you')],
 'board':[('board.rail','Rail'),('board.review-debt','Review-debt lane'),('board.nonphase','Non-phase lane'),('board.backlog','Backlog')],
 'entities':[('entities.index','Entity index')],
 'docs':[('docs.feature-cards','Feature docs'),('docs.foundations','Foundations')],
 'testing':[('testing.matrix','Matrix'),('testing.proof','Feature proof'),('testing.walks','Manual angles'),('testing.shelf','Demo shelf')],
 'ledger':[('ledger.change','Change pages')],
 'releases':[('releases.showcase','Release showcase')]}

def sidebar(active):
    items = []
    for slug, label in PAGES:
        on = ' on' if slug == active else ''
        if slug == 'index':
            items.append('<div class="navlabel">Guide</div>')
            items.append(f'<a class="navitem{on}" href="index.html">{icon(PAGE_ICON[slug])} {label}</a>')
            continue
        dark = GROUP[label][1]
        items.append(f'<div class="navlabel" style="color:{dark}">{label}</div>')
        items.append(f'<a class="navitem{on}" href="{slug}.html">{icon(PAGE_ICON[slug])} {label.capitalize()} directions</a>')
        if slug in SUBS:
            subs = ''.join(f'<a href="{slug}.html#{sid.replace(".","-")}">{lab}</a>' for sid, lab in SUBS[slug])
            items.append(f'<div class="navsub">{subs}</div>')
    return ('<aside class="side"><div class="brand"><span class="logo">' + IC + '</span>'
      '<span><b>Section Lab</b><small>templates · directions</small></span></div>'
      + ''.join(items) +
      f'<div class="navlabel" style="color:{GROUP["LEAF"][1]}">LEAF</div><a class="navitem" href="index.html#leaf">' + IC + ' OSS reports (no template)</a>'
      '<div class="foot">section-template lab · 2026-07-20<br>skin: a3.css · palette: the landed map</div></aside>')

def page(slug, title, lede, body):
    label = dict(PAGES)[slug]
    gc = GROUP[label][0] if label in GROUP else '#4f46e5'
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Section Lab</title>
<link rel="stylesheet" href="assets/a3.css"><link rel="stylesheet" href="assets/lab.css"></head>
<body><div class="app">{sidebar(slug)}
<main class="main"><div class="topbar"><div class="crumb"><a href="index.html">Section Lab</a> › <b>{title}</b></div>
<div class="spacer"></div><span class="statuspill warn"><span class="dot"></span> exploration</span>
<span class="stamp">gastify example data · illustrative</span></div>
<div class="subject"><div class="subjecthead">
<div class="pbanner" style="--gc:{gc}"><span class="secic">{icon(PAGE_ICON[slug])}</span><div><h1>{title}</h1><p>{lede}</p></div></div>
</div>
{body}</div></main></div></body></html>'''

W = lambda slug, html: (OUT / f'{slug}.html').write_text(html)

# ================= NOW =================
recent_A = direction('A','Timeline','Change-shaped: time flows down, each dot links to its ledger change page.', panel('<div class="padded"><ul class="tline">'
 '<li><span class="tdate">2026-07-17</span><br><span class="tsha">e545f3c</span><b>Adoption brief + Analytics amendment</b><small>HANDOFF.md carries the 7-entity baseline · no cells flipped</small></li>'
 '<li><span class="tdate">2026-07-17</span><br><span class="tsha">d2309ef</span><b>Red column adopted</b><small>⬜ seeded on 16 · 17 · 26 · 27 only — router now points at /gabe-red 16</small></li>'
 '<li><span class="tdate">2026-07-17</span><br><span class="tsha">5dbd928</span><b>The C-id sweep — 1,585 tests named</b><small>corpus became a registry · counts before == after</small></li>'
 '<li><span class="tdate">2026-07-17</span><br><span class="tsha">d15a5bf</span><b>Chunk-0 repairs</b><small>PLAN table repair · BEHAVIOR retrofit · proofs normalized 29+36</small></li>'
 '</ul></div>'), rec=True)
recent_B = direction('B','Change table','Densest scan; loses the time-shape and reads like any other table.', tbl(
 ['date','sha','change','cells flipped'],
 [['07-17','<span class="mono">e545f3c</span>','<b>Adoption brief + Analytics amendment</b>','—'],
  ['07-17','<span class="mono">d2309ef</span>','<b>Red column adopted</b>','4 × Red ⬜'],
  ['07-17','<span class="mono">5dbd928</span>','<b>C-id sweep — 1,585 named</b>','—'],
  ['07-17','<span class="mono">d15a5bf</span>','<b>Chunk-0 repairs</b>','SB1 · SB2 healed']]))

needs_A = direction('A','Action rows','One vertical scan; each row = one thing only the operator can do, kind-tagged, age-visible.', panel(
 surfrow('Approve the DF5 red checkpoint','/gabe-red 16 declared its cases — the walk is yours','walk','2d')
 + surfrow('Stamp TX2b','full-tier backfill awaiting your # REVIEWED stamp','stamp','5d')
 + surfrow('Two amber reviews open','P147 · P149 — deferred, non-blocking, aging','review','9d')
 + surfrow('deploy-rollback has NEVER been walked','renders red until a human walks it','walk','never')), rec=True)
needs_B = direction('B','Kind columns','Kanban by action type; good when the list grows, wasteful at n=4.',
 '<div class="kb"><div class="kbcol"><h4>Reviews</h4><div class="kbcard"><b>P147</b> · consent edge<small>9d old</small></div><div class="kbcard"><b>P149</b> · digest gap<small>9d old</small></div></div>'
 '<div class="kbcol"><h4>Stamps & walks</h4><div class="kbcard"><b>DF5 red checkpoint</b><small>awaiting walk · 2d</small></div><div class="kbcard"><b>TX2b</b><small>stamp pending · 5d</small></div><div class="kbcard red"><b>deploy-rollback</b><small>NEVER walked</small></div></div>'
 '<div class="kbcol"><h4>Ships</h4><div class="kbempty">nothing waiting — honest empty</div></div></div>')
needs_C = direction('C','Priority queue','Machine-ordered urgency; hides the kind grouping, invites false precision in the ranking.', panel('<div class="padded"><ol class="queue">'
 '<li><span><b>Approve the DF5 red checkpoint</b><span class="why">blocks phase 16 — the router points here</span></span><div class="bar"><i class="bad" style="width:92%"></i></div><span class="agetag">2d</span></li>'
 '<li><span><b>Walk deploy-rollback</b><span class="why">only NEVER-walked critical path</span></span><div class="bar"><i class="warn" style="width:70%"></i></div><span class="agetag red">never</span></li>'
 '<li><span><b>Stamp TX2b</b><span class="why">backfill complete, unverified</span></span><div class="bar"><i class="warn" style="width:55%"></i></div><span class="agetag">5d</span></li>'
 '<li><span><b>Clear P147 · P149</b><span class="why">amber debt, aging</span></span><div class="bar"><i style="width:30%"></i></div><span class="agetag">9d</span></li>'
 '</ol></div>'))

W('now', page('now','NOW — the hub Overview tab',
 'Two sections share the hub\'s Overview pane: what just happened, and what only you can unblock.',
 labsec('now.recent-changes','NOW','Recent changes',
  host('index.html','{{TAB_OVERVIEW}} upper'),'git · .kdbp/LEDGER.md · digests · ledger change pages',
  [recent_A, recent_B], cmds=kchips(['commit','red','exec','push'],['guard']))
 + labsec('now.needs-you','NOW','Needs-you',
  host('index.html','{{TAB_OVERVIEW}} lower'),'PLAN owed cells · PENDING.md · walks.jsonl · DEPLOYMENTS.md',
  [needs_A, needs_B, needs_C], cmds=kchips(['plan','red','exec','review','commit','push','walk'],['guard'],['adopt']))))

# ================= BOARD =================
rail_A = direction('A','Glyph grid','The PLAN table verbatim — machine truth, zero interpretation; the Red column lands as just another beat.', tbl(
 ['#','Phase','Red','Exec','Review','Commit','Push','Center'],
 [['15','<b>DF4 · notifications</b>','—','✅','⬜','✅','✅','⬜'],
  ['16','<b>DF5 · SSE families</b>','⬜','⬜','⬜','⬜','⬜','⬜'],
  ['37','<b>GS1 · detail share</b>','—','✅','✅','✅','✅','⬜'],
  ['41','<b>GS5 · Efectivo</b>','—','✅','✅','✅','✅','⬜'],
  ['42','<b>P134 · consent</b>','—','✅','✅','✅','✅','⬜']]), rec=True)
rail_B = direction('B','Stepper lanes','Each phase a progress strip — glanceable completion, but glyph semantics (⬜ vs — vs 🔄) collapse into color.', panel('<div class="padded">'
 '<div class="lane"><span><b>15 · DF4 notifications</b><small>review owed</small></span><div class="steps"><span class="step"></span><span class="step g"></span><span class="step w"></span><span class="step g"></span><span class="step g"></span><span class="step"></span></div><span class="steplab">4/6 · review owed</span></div>'
 '<div class="lane"><span><b>16 · DF5 SSE families</b><small>next: /gabe-red</small></span><div class="steps"><span class="step r"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span></div><span class="steplab">0/6 · red first</span></div>'
 '<div class="lane"><span><b>41 · GS5 Efectivo</b><small>center owed</small></span><div class="steps"><span class="step"></span><span class="step g"></span><span class="step g"></span><span class="step g"></span><span class="step g"></span><span class="step w"></span></div><span class="steplab">5/6 · center owed</span></div>'
 '</div>'))
rail_C = direction('C','State swimlanes','Groups by where work IS, not by phase number — good triage view, loses the beat-by-beat honesty.',
 '<div class="kb"><div class="kbcol"><h4>Shipped, center owed</h4><div class="kbcard"><b>GS1 · detail share</b><small>Center ⬜</small></div><div class="kbcard"><b>GS5 · Efectivo</b><small>Center ⬜</small></div><div class="kbcard"><b>P134 · consent</b><small>Center ⬜ · +10 more</small></div></div>'
 '<div class="kbcol"><h4>In flight</h4><div class="kbcard"><b>16 · DF5 SSE families</b><small>Red ⬜ — /gabe-red next</small></div><div class="kbcard"><b>15 · DF4</b><small>Review ⬜</small></div></div>'
 '<div class="kbcol"><h4>Queued</h4><div class="kbcard"><b>17 · DF6 overlays</b></div><div class="kbcard"><b>26 · CA7</b></div><div class="kbcard"><b>27 · CA8</b></div></div></div>')

debt_A = direction('A','Amber ledger rows','Debts as callouts with age — visible, named, never nagging; the lane IS the honesty.',
 '<div class="callout warn"><h3>' + IC + ' P147 · consent revoke edge <span class="tag">amber</span></h3>uncovered branch on double-revoke — deferred at review, non-blocking<div class="items"><a><b>age</b> 9d</a><a><b>phase</b> 42</a><a><b>owner</b> review triage</a></div></div>'
 '<div class="callout warn"><h3>' + IC + ' P149 · web digest gap <span class="tag">amber</span></h3>vitest digest ⤫ skipped(no reporter) — flags not landed<div class="items"><a><b>age</b> 9d</a><a><b>phase</b> —</a><a><b>owner</b> infra</a></div></div>'
 '<div class="callout warn"><h3>' + IC + ' P150 · scan retry narration <span class="tag">amber</span></h3>narration leg missing on the retry path<div class="items"><a><b>age</b> 7d</a><a><b>phase</b> 38</a><a><b>owner</b> next exec</a></div></div>', rec=True)
debt_B = direction('B','Severity table','Compact; reads as a backlog table and stops feeling like debt.', tbl(
 ['id','finding','severity','age','phase'],
 [['<b>P147</b>','consent revoke edge — double-revoke branch','amber','<span class="agetag">9d</span>','42'],
  ['<b>P149</b>','web digest ⤫ skipped(no reporter)','amber','<span class="agetag">9d</span>','—'],
  ['<b>P150</b>','scan retry narration leg missing','amber','<span class="agetag">7d</span>','38']]))

nonphase_A = direction('A','Ledger chips','Work outside phases stays small and chip-shaped — it is a footnote lane, not a second board.', padded(
 'Work that landed outside any PLAN phase — from git + LEDGER, never synthesized.'
 '<div class="echips" style="margin-top:10px"><span class="echip" style="--ec:var(--accent)">GS6 · chooser cards — PR #63</span>'
 '<span class="echip" style="--ec:var(--good)">blame-ignore registration · 7a449ab</span>'
 '<span class="echip" style="--ec:var(--muted)">docs túnel: adoption brief · e545f3c</span></div>'), rec=True)
nonphase_B = direction('B','Mini-table','Same facts, table-shaped; heavier than the lane usually needs.', tbl(
 ['sha','what','recorded in'],
 [['<span class="mono">PR #63</span>','<b>GS6 chooser cards</b>','LEDGER only'],
  ['<span class="mono">7a449ab</span>','blame-ignore registration','git'],
  ['<span class="mono">e545f3c</span>','adoption brief','HANDOFF.md']]))

backlog_A = direction('A','Muted queue','Upcoming phases dimmed under arc headers — present but not shouting; next-up is the only bright row.', panel(
 '<table class="tbl"><tbody>'
 '<tr><td colspan="3" style="font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Data-flow arc</td></tr>'
 '<tr><td><b>17 · DF6 overlays</b></td><td>after DF5</td><td class="num"><span class="oktag">next after 16</span></td></tr>'
 '<tr><td colspan="3" style="font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Card-analytics arc</td></tr>'
 '<tr><td style="color:var(--faint)"><b style="color:var(--faint)">26 · CA7</b></td><td style="color:var(--faint)">drill L3→L4</td><td class="num" style="color:var(--faint)">queued</td></tr>'
 '<tr><td style="color:var(--faint)"><b style="color:var(--faint)">27 · CA8</b></td><td style="color:var(--faint)">item-level compare</td><td class="num" style="color:var(--faint)">queued</td></tr>'
 '</tbody></table>'), rec=True)
backlog_B = direction('B','Arc bands','One band per SCOPE arc with counts — the 50-phase view; overkill while the queue is 3 rows.',
 '<div class="kb"><div class="kbcol"><h4>Data-flow · 2 queued</h4><div class="kbcard"><b>17 · DF6</b><small>next after 16</small></div></div>'
 '<div class="kbcol"><h4>Card-analytics · 2 queued</h4><div class="kbcard"><b>26 · CA7</b> · <b>27 · CA8</b><small>drill + compare</small></div></div>'
 '<div class="kbcol"><h4>SCOPE remainder</h4><div class="kbempty">arc not yet planned — honest empty</div></div></div>')

W('board', page('board','BOARD — the lifecycle station',
 'Four sections, one page: the rail is the spine; debt, non-phase and backlog are its margins.',
 labsec('board.rail','BOARD','Rail · red→exec→review→commit→push <span class="newmark">•new</span>',
  host('board.html','{{RAIL}}'),'PLAN.md / PLAN.json cells (glyphs are machine truth)',
  [rail_A, rail_B, rail_C], cmds=kchips(['plan','red','exec','review','commit','push'],['guard']))
 + labsec('board.review-debt','BOARD','Review-debt lane',
  host('board.html','{{REVIEW_DEBT_LANE}}'),'PENDING.md (deferred findings + ages)',
  [debt_A, debt_B], cmds=kchips(['review']))
 + labsec('board.nonphase','BOARD','Non-phase lane',
  host('board.html','{{NONPHASE_LANE}}'),'git · LEDGER.md (work outside phases)',
  [nonphase_A, nonphase_B], cmds=kchips(['red','exec','commit'],['guard']))
 + labsec('board.backlog','BOARD','Backlog',
  host('board.html','{{BACKLOG}}'),'PLAN ⬜ phases · SCOPE §Phases arc',
  [backlog_A, backlog_B], cmds=kchips(['scope','init','plan','red','exec','review','commit','push'],['guard']))))

# ================= ENTITIES =================
ent_data = [('Transactions','The T1 ledger spine','113 web C-ids','21 commits/90d','reorganize 6 cards'),
 ('Scan / Receipt','The acquisition funnel','353 api C-ids','14 commits/90d','3 cards adequate'),
 ('Statements','Zero dedicated cards — the biggest gap','117 api C-ids','9 commits/90d','NEW section'),
 ('Card aliases','GS5 money-destruction guard rails','10 api C-ids','6 commits/90d','NEW section'),
 ('Groups & sharing','90-day window, locks','132 C-ids','5 commits/90d','2-3 cards + index'),
 ('Consent & privacy','Ley 21.719 — register + erasure','66 api C-ids','4 commits/90d','extend ce card'),
 ('Analytics drill-down','Sankey · treemap · L1→L4 · items','100 C-ids','11 commits/90d','NEW nav-story card')]
ent_A = direction('A','Card grid','One card per noun — the sidebar\'s vocabulary made tangible; status chip carries adoption state.',
 '<div class="tiles">' + ''.join(
   f'<div class="tile{" hot" if "NEW" in st else ""}"><b>{n}</b><p>{d}</p><div class="echips">'
   f'<span class="echip" style="--ec:var(--accent)">{t}</span><span class="echip" style="--ec:var(--{"warn" if "NEW" in st else "good"})">{st}</span></div></div>'
   for n,d,t,ch,st in ent_data) + '</div>', rec=True)
ent_B = direction('B','Coverage table','Sortable density view — tests, churn, adoption per row; better for 30 entities than for 7.', tbl(
 ['entity','tests','churn','adoption'],
 [[f'<b>{n}</b>', f'<span class="num">{t.split()[0]}</span>', ch,
   f'<span class="{"agetag" if "NEW" in st else "oktag"}">{st}</span>'] for n,d,t,ch,st in ent_data]))
ent_C = direction('C','Density strip','Width ∝ test count — where the verification mass actually sits; navigation is secondary.',
 '<div class="dstrip">'
 '<div class="dcell" style="flex:353">Scan / Receipt<small>353</small></div>'
 '<div class="dcell" style="flex:132;background:#6366f1">Groups<small>132</small></div>'
 '<div class="dcell" style="flex:117;background:#7c3aed">Statements<small>117</small></div>'
 '<div class="dcell" style="flex:113;background:#8b5cf6">Transactions<small>113</small></div>'
 '<div class="dcell" style="flex:100;background:#a78bfa">Analytics<small>100</small></div>'
 '<div class="dcell" style="flex:66;background:#c4b5fd;color:var(--ink)">Consent<small>66</small></div>'
 '<div class="dcell" style="flex:30;background:#ddd6fe;color:var(--ink)">Aliases<small>10</small></div></div>')

W('entities', page('entities','ENTITIES — the noun index',
 'The durable nouns of the product — each links to its feature subject page; states come from adoption.json.',
 labsec('entities.index','ENTITIES','Entity index',
  host('entity-index.html','{{ENTITY_GRID}}') + ' — the sidebar\'s Catalog group renders the SAME nouns','center.config.json entities[] · adoption.json · corpus grep counts',
  [ent_A, ent_B, ent_C], cmds=kchips(['feature','adopt']))))

# ================= DOCS =================
cards_A = direction('A','Catalog rows','Accumulator as a flat catalog — title, entity, freshness, stamp; scan-first like Backstage.', panel(
 surfrow('Statements — the reconciliation story','entity: statements · diagrams 2 · NEW','','unstamped')
 + surfrow('Card aliases — guard rails for money','entity: card-aliases · # REVIEWED','','T−3d')
 + surfrow('Analytics — the L1→L4 drill story','entity: analytics · nav-story · NEW','','unstamped')), rec=True)
cards_B = direction('B','Card gallery','Diagram-thumb forward — prettier, but thumbs go stale faster than titles and invite decoration.',
 '<div class="tiles"><div class="tile"><div class="lshot"><div class="ph">flow diagram</div></div><b style="display:block;margin-top:8px">Statements</b><p>reconciliation story · NEW</p></div>'
 '<div class="tile"><div class="lshot"><div class="ph">state machine</div></div><b style="display:block;margin-top:8px">Card aliases</b><p># REVIEWED · T−3d</p></div>'
 '<div class="tile"><div class="lshot"><div class="ph">L1→L4 drill</div></div><b style="display:block;margin-top:8px">Analytics</b><p>nav-story · NEW</p></div></div>')

found_A = direction('A','Four fixed tiles','The four authored anchors, always in the same order — foundations are furniture, not a feed.',
 '<div class="tiles">'
 '<div class="tile"><b>SCOPE.md</b><p>premise + §Phases arc</p><div class="echips"><span class="echip" style="--ec:var(--good)">updated 07-17</span></div></div>'
 '<div class="tile"><b>DECISIONS.md</b><p>D1–D121, rationale attached</p><div class="echips"><span class="echip" style="--ec:var(--good)">D121 · 07-16</span></div></div>'
 '<div class="tile"><b>RULES.md</b><p>project invariants</p><div class="echips"><span class="echip" style="--ec:var(--muted)">stable</span></div></div>'
 '<div class="tile"><b>BEHAVIOR.md</b><p>verify commands · results_out · critical_paths</p><div class="echips"><span class="echip" style="--ec:var(--good)">retrofit 07-17</span></div></div></div>', rec=True)
found_B = direction('B','Single shelf','One panel, four rows — quieter, but foundations lose their landmark quality.', panel(
 surfrow('SCOPE.md','premise + §Phases arc','','07-17') + surfrow('DECISIONS.md','D1–D121','','07-16')
 + surfrow('RULES.md','project invariants','','stable') + surfrow('BEHAVIOR.md','verify commands · results_out','','07-17')))

W('docs', page('docs','DOCS — accumulator + foundations',
 'Feature docs accumulate (cards re-enter one adoption section at a time); foundations are the four authored anchors.',
 labsec('docs.feature-cards','DOCS','Feature docs (accumulator)',
  host('docs.html','{{FEATURE_DOCS}}') + ' · single card also on ' + host('feature.html','{{TAB_OVERVIEW}}'),'cards/*.md · # REVIEWED stamps · adoption.json',
  [cards_A, cards_B], lede='Post clean-slate the accumulator is EMPTY — rows below show the target shape, not current state.',
  cmds=kchips(['feature','adopt','plan','review']))
 + labsec('docs.foundations','DOCS','Foundations',
  host('docs.html','{{FOUNDATIONS}}'),'.kdbp/ SCOPE · DECISIONS · RULES · BEHAVIOR (authored, linked out)',
  [found_A, found_B], cmds=kchips(['scope','init','plan','review']))))

# ================= TESTING =================
matrix_A = direction('A','Bucket-grouped matrix','Corpus headers break the 1,585 into scannable runs; ever-red is a first-class column (the •new).', panel(
 '<table class="tbl"><thead><tr><th>C-id</th><th>test</th><th>status</th><th>ever-red?</th><th>last run</th></tr></thead><tbody>'
 '<tr><td colspan="5" style="font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);background:var(--panel)">backend · pytest — 1,070 · api-junit.xml</td></tr>'
 '<tr><td><b>C38</b></td><td>invite deep-link survives redirect</td><td><span class="oktag">pass</span></td><td><span class="agetag red">RED seen · red@c6dd185</span></td><td class="mono">07-17 09:41</td></tr>'
 '<tr><td><b>C187</b></td><td>list consents empty (async)</td><td><span class="oktag">pass</span></td><td>— backfilled</td><td class="mono">07-17 09:41</td></tr>'
 '<tr><td colspan="5" style="font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);background:var(--panel)">web · vitest — 344 · web-junit.xml</td></tr>'
 '<tr><td><b>C926</b></td><td>SharedGroupsCard owner chip</td><td><span class="agetag red">fail</span></td><td>— backfilled</td><td class="mono">07-17 09:43</td></tr>'
 '<tr><td><b>—</b></td><td class="mono">it(`shows ${count} scans`)</td><td><span class="agetag">no id — unstamped</span></td><td>n/a</td><td class="mono">07-17 09:43</td></tr>'
 '</tbody></table>'), rec=True)
matrix_B = direction('B','Flat + filter chips','One table, corpus as a column, seg-control filters on top — good once search/filter is scripted; flatter honesty until then.',
 '<div class="seg"><a class="on">All <span class="n">1,585</span></a><a>backend <span class="n">1,070</span></a><a>web <span class="n">344</span></a><a>e2e <span class="n">171</span></a><a>ever-red <span class="n">1</span></a><a>unstamped <span class="n">27</span></a></div>'
 + tbl(['C-id','test','corpus','status'],
 [['<b>C38</b>','invite deep-link survives redirect','api','<span class="oktag">pass</span>'],
  ['<b>C926</b>','SharedGroupsCard owner chip','web','<span class="agetag red">fail</span>'],
  ['<b>C1592</b>','SSE family dedup (DF5)','api','<span class="agetag red">red · declared</span>']]))
matrix_C = direction('C','Status wall','The whole corpus as dots — density at a glance, detail on hover (needs script); a summary lens, not a registry lens.', padded(
 '<b style="font-size:.8rem">backend · pytest — 1,070</b><div class="dots">' + '<span class="d8"></span>'*46 + '<span class="d8 f"></span>' + '<span class="d8"></span>'*13 + '</div>'
 '<b style="font-size:.8rem">web · vitest — 344</b><div class="dots">' + '<span class="d8"></span>'*22 + '<span class="d8 f"></span>' + '<span class="d8 u"></span>'*4 + '<span class="d8"></span>'*8 + '</div>'
 '<b style="font-size:.8rem">e2e · playwright — 171</b><div class="dots">' + '<span class="d8"></span>'*18 + '</div>'
 '<small style="color:var(--muted);font-size:.7rem">green pass · red fail · grey unstamped — sampled to scale, hover detail would need script</small>'))

proof_A = direction('A','Evidence rows','Per proof set: what it proves, item count, freshness — claims first, pixels second.', panel(
 surfrow('gs6-chooser-card-pill','proves: card pill renders per alias · e2e 3/3','5 shots','T−4d')
 + surfrow('p134-consent-register','proves: register + erasure round-trip','manifest','T−6d')
 + surfrow('ca10-destructive-guards','proves: Efectivo cannot be deleted or merged','6 shots','T−9d')), rec=True)
proof_B = direction('B','Shot shelf','Pixels first — persuasive, but a wall of thumbs hides WHAT each one proves.',
 '<div class="lgal">'
 '<figure class="lshot" style="margin:0"><div class="ph">gs6 · pill</div><figcaption>chooser card pill</figcaption></figure>'
 '<figure class="lshot" style="margin:0"><div class="ph">gs6 · list</div><figcaption>alias list state</figcaption></figure>'
 '<figure class="lshot" style="margin:0"><div class="ph">p134 · register</div><figcaption>consent register</figcaption></figure>'
 '<figure class="lshot" style="margin:0"><div class="ph">ca10 · guard</div><figcaption>delete blocked</figcaption></figure></div>')

walks_A = direction('A','Walk cards + red gaps','Human verification as testimony cards; the NEVER-walked card is red and stays red until someone walks.',
 '<div class="kb"><div class="kbcol"><h4>Walked</h4><div class="kbcard"><b>gs1-detail-share</b> · pass<small>khujta · 07-15 · evidence: share-flow shots</small></div></div>'
 '<div class="kbcol"><h4>Walked</h4><div class="kbcard"><b>adopt:transactions</b> · pending<small>section awaiting approval walk</small></div></div>'
 '<div class="kbcol"><h4>Never walked</h4><div class="kbcard red"><b>deploy-rollback</b><small>no human has ever walked this — renders red</small></div></div></div>', rec=True)
walks_B = direction('B','Angle table','Compact audit view; loses the who-said-so testimony feel that makes walks trustworthy.', tbl(
 ['angle','last walk','by','age','status'],
 [['<b>gs1-detail-share</b>','07-15','khujta','<span class="oktag">5d</span>','pass'],
  ['<b>adopt:transactions</b>','—','—','—','<span class="agetag">pending</span>'],
  ['<b>deploy-rollback</b>','never','—','<span class="agetag red">never</span>','<span class="agetag red">NEVER walked</span>']]))

shelf_A = direction('A','Curated gallery','The demo shelf as a gallery with captions + manifest link — show, then cite.',
 '<div class="lgal">'
 '<figure class="lshot" style="margin:0"><div class="ph">ca10 · 1/6</div><figcaption>Efectivo delete blocked</figcaption></figure>'
 '<figure class="lshot" style="margin:0"><div class="ph">ca10 · 2/6</div><figcaption>merge guard fires</figcaption></figure>'
 '<figure class="lshot" style="margin:0"><div class="ph">ca10 · 3/6</div><figcaption>orphan check green</figcaption></figure>'
 '<figure class="lshot" style="margin:0"><div class="ph">p134</div><figcaption>consent manifest</figcaption></figure></div>'
 '<p style="font-size:.74rem;color:var(--muted);margin:10px 0 0">video slot: <span class="agetag">named gap — no recording yet, never staged</span></p>', rec=True)
shelf_B = direction('B','Curated list','Same shelf, table-shaped: set · shots · proves · updated; better for many sets, drier for stakeholders.', tbl(
 ['set','shots','proves','updated'],
 [['<b>ca10-destructive-guards</b>','6','Efectivo cannot be destroyed','07-11'],
  ['<b>p134-consent</b>','manifest','register + erasure round-trip','07-14'],
  ['<b>gs6-chooser</b>','5','card pill per alias','07-16']]))

W('testing', page('testing','TESTING — the verification estate',
 'Four sections: the registry matrix, the per-feature proof accumulator, human walks, and the curated shelf.',
 labsec('testing.matrix','TESTING','Matrix · id · ever-red? <span class="newmark">•new</span>',
  host('tests.html','{{MATRIX}}') + ' · entity-scoped on ' + host('feature.html','{{TAB_TESTS}}') + ' — SAME section, filtered','corpus C-ids · junit ×3 · git RED: trailers (ever-red) · digests',
  [matrix_A, matrix_B, matrix_C], cmds=kchips(['red','exec','commit'],['guard']))
 + labsec('testing.proof','TESTING','Feature proof (accumulator)',
  host('feature.html','{{TAB_EVIDENCE}}') + ' · rollup on ' + host('tests.html','evidence area'),'proof/ manifests + shots · junit links',
  [proof_A, proof_B], cmds=kchips(['red','exec','review','commit','feature','adopt'],['guard']))
 + labsec('testing.walks','TESTING','Manual angles (walks) <span class="newmark">•new</span>',
  host('tests.html','{{MANUAL_ANGLES}}') + ' · angle group on feature pages','walks.jsonl (who · when · result · evidence) — NEVER-walked renders red',
  [walks_A, walks_B], cmds=kchips(['walk','init'],[],['adopt']))
 + labsec('testing.shelf','TESTING','Demo shelf',
  host('tests.html','{{DEMO_SHELF}}') + ' · hero shots reused by ' + host('releases.html','{{LATEST_RELEASE}}'),'curated proof sets (manifests) — absent proofs are named gaps',
  [shelf_A, shelf_B], cmds=kchips(['exec','feature','adopt'],[],['guard']))))

# ================= LEDGER =================
ledger_A = direction('A','Stacked machine panels','Commits → cells flipped → verified-by, in reading order — the current skeleton shape.',
 tbl(['sha','commit'],[['<span class="mono">5dbd928</span>','<b>test: C-id backfill sweep — 1585 stamped</b>'],
  ['<span class="mono">7a449ab</span>','chore(git): blame-ignore registration']])
 + tbl(['PLAN cell','before','after'],[['16 · Red','<i>absent</i>','⬜'],['17 · Red','<i>absent</i>','⬜']])
 + padded('<b>Verified by:</b> counts before == after · idempotent re-run 0 · py_compile clean · guard rc=0'), rec=True)
ledger_B = direction('B','Narrative + facts split','Left: the change translated for a reader. Right: raw machine facts. Two audiences, one page.',
 '<div class="split">' + padded('<b>What changed</b><p style="font-size:.82rem;color:var(--ink-2)">Every test in the corpus received a permanent C-id. Nothing about behavior changed — the corpus became a registry, so reviews and the center can now cite tests by identity instead of by name.</p><p style="font-size:.76rem;color:var(--muted)">Translated from the commit; never invented.</p>')
 + padded('<div class="mono" style="font-size:.72rem;line-height:2">sha 5dbd928 · +1,585 / −1,585 · 221 files<br>trailer Cases: C1–C1585<br>digest api-junit.xml ✓ unchanged counts<br>cells flipped: none</div>') + '</div>')

W('ledger', page('ledger','LEDGER — change pages (ephemeral)',
 'One page per change, regenerated and superseded — never accumulates. Example: the C-id sweep.',
 labsec('ledger.change','LEDGER','Change pages',
  host('ledger.html','{{CHANGE_COMMITS}} · {{CHANGE_CELLS}} · {{CHANGE_VERIFY}} (whole page)') + ' — linked from <a class="tlink" href="now.html#now-recent-changes">now.recent-changes</a>','git (diff stats · trailers RED:/Cases:) · PLAN cells flipped · LEDGER row',
  [ledger_A, ledger_B], cmds=kchips(['plan','red','exec','review','commit','push'],['guard']))))

# ================= RELEASES =================
rel_A = direction('A','Hero + index','Latest release as a showcase hero (shelf shots reused), prior ships as a table — stakeholder-first.',
 padded('<b style="font-size:1rem">Next release (candidate)</b><p style="font-size:.8rem;color:var(--ink-2)">GS1–GS6 + P134 + DF3 become the first post-adoption showcase once their center sections land.</p>'
 '<div class="echips"><span class="echip" style="--ec:var(--accent)">GS suite · 6 features</span><span class="echip" style="--ec:var(--accent)">P134 consent</span><span class="echip" style="--ec:var(--muted)">env: production</span></div>'
 '<div class="lgal" style="margin-top:12px"><figure class="lshot" style="margin:0"><div class="ph">hero · gs6</div><figcaption>chooser cards</figcaption></figure><figure class="lshot" style="margin:0"><div class="ph">hero · p134</div><figcaption>consent register</figcaption></figure></div>')
 + tbl(['date','env','features'],[['—','—','no releases recorded yet — honest empty']]), rec=True)
rel_B = direction('B','Ship timeline','Releases as a vertical timeline of ships, env-chipped — history-first, weaker as a showcase.', panel('<div class="padded"><ul class="tline">'
 '<li><span class="tdate">upcoming</span><br><b>First post-adoption release</b><small>GS suite + P134 · production · awaiting center coverage</small></li>'
 '<li><span class="tdate">—</span><br><b>No prior releases recorded</b><small>DEPLOYMENTS.md empty — honest empty, never backdated</small></li>'
 '</ul></div>'))

W('releases', page('releases','RELEASES — the stakeholder showcase',
 'Covered features since each terminal-env ship; proof reused from the demo shelf, gaps named.',
 labsec('releases.showcase','RELEASES','Release showcase <span class="newmark">•new</span>',
  host('releases.html','{{LATEST_RELEASE}} · {{RELEASE_INDEX}}'),'DEPLOYMENTS.md · Center-covered phases · curated proof (video = named gap)',
  [rel_A, rel_B], cmds=kchips(['push','exec','feature','adopt']))))

# ================= INDEX (guide + mapping) =================
GP = {'NOW':'now','BOARD':'board','ENTITIES':'entities','DOCS':'docs','TESTING':'testing','LEDGER':'ledger','RELEASES':'releases'}
NEW = '<span class="newmark">•new</span>'
# (group, label, sid, home page file or None, slot(s), also-appears, sources, (writes, verifies, reads))
MAP_ROWS = [
 ('NOW','Recent changes','now.recent-changes','index.html','{{TAB_OVERVIEW}} upper','—','git · LEDGER · digests',(['commit','red','exec','push'],['guard'],[])),
 ('NOW','Needs-you','now.needs-you','index.html','{{TAB_OVERVIEW}} lower','—','PLAN owed · PENDING · walks · DEPLOYMENTS',(['plan','red','exec','review','commit','push','walk'],['guard'],['adopt'])),
 ('BOARD','Rail '+NEW,'board.rail','board.html','{{RAIL}}','—','PLAN.md/json cells',(['plan','red','exec','review','commit','push'],['guard'],[])),
 ('BOARD','Review-debt lane','board.review-debt','board.html','{{REVIEW_DEBT_LANE}}','—','PENDING.md',(['review'],[],[])),
 ('BOARD','Non-phase lane','board.nonphase','board.html','{{NONPHASE_LANE}}','—','git · LEDGER',(['red','exec','commit'],['guard'],[])),
 ('BOARD','Backlog','board.backlog','board.html','{{BACKLOG}}','—','PLAN ⬜ · SCOPE arc',(['scope','init','plan','red','exec','review','commit','push'],['guard'],[])),
 ('ENTITIES','Entity index','entities.index','entity-index.html','{{ENTITY_GRID}}','sidebar Catalog group','center.config entities · adoption.json',(['feature','adopt'],[],[])),
 ('DOCS','Feature docs (accum.)','docs.feature-cards','docs.html','{{FEATURE_DOCS}}','feature.html {{TAB_OVERVIEW}} (single card)','cards/*.md · stamps',(['feature','adopt','plan','review'],[],[])),
 ('DOCS','Foundations','docs.foundations','docs.html','{{FOUNDATIONS}}','—','SCOPE · DECISIONS · RULES · BEHAVIOR',(['scope','init','plan','review'],[],[])),
 ('TESTING','Matrix '+NEW,'testing.matrix','tests.html','{{MATRIX}} (+ {{BUCKETS}} aux)','feature.html {{TAB_TESTS}} (entity-scoped)','C-ids · junit · RED: trailers',(['red','exec','commit'],['guard'],[])),
 ('TESTING','Feature proof (accum.)','testing.proof','feature.html','{{TAB_EVIDENCE}}','tests.html evidence rollup','proof/ manifests + shots',(['red','exec','review','commit','feature','adopt'],['guard'],[])),
 ('TESTING','Manual angles '+NEW,'testing.walks','tests.html','{{MANUAL_ANGLES}}','feature pages (angle group)','walks.jsonl',(['walk','init'],[],['adopt'])),
 ('TESTING','Demo shelf','testing.shelf','tests.html','{{DEMO_SHELF}}','releases.html hero (shot reuse)','curated proof sets',(['exec','feature','adopt'],[],['guard'])),
 ('LEDGER','Change pages','ledger.change','ledger.html','{{CHANGE_COMMITS}}·{{CHANGE_CELLS}}·{{CHANGE_VERIFY}}','linked from now.recent-changes','git · PLAN cells · LEDGER row',(['plan','red','exec','review','commit','push'],['guard'],[])),
 ('RELEASES','Showcase '+NEW,'releases.showcase','releases.html','{{LATEST_RELEASE}}·{{RELEASE_INDEX}}','—','DEPLOYMENTS · covered phases · proof',(['push','exec','feature','adopt'],[],[])),
 ('LEAF','OSS reports','leaf.reports',None,'sidebar external links','—','htmlcov · playwright report',(['push'],[],[])),
]
rows_html = []
for grp, label, sid, home, slots, also, src, (w, v, r) in MAP_ROWS:
    gc = GROUP[grp][0]
    anchor = sid.replace('.', '-')
    target = f'{GP[grp]}.html#{anchor}' if grp in GP else 'index.html#leaf'
    seccell = f'<a class="tlink" style="color:{gc};font-weight:650" href="{target}">{grp} · {label}</a>'
    idcell = f'<a href="{target}" style="text-decoration:none"><code>{sid}</code></a>'
    if home:
        homecell = f'<a class="tlink" href="{TPL}{home}">{home}</a><br><a class="tlink" style="font-size:.72rem" href="{PRE}{home}">filled preview ↗</a>'
    else:
        homecell = '<i>no template — by ruling</i>'
    badges = kchips(w, v, r)
    rows_html.append('<tr>'
        f'<td style="border-left:3px solid {gc}">{seccell}</td><td>{idcell}</td><td>{homecell}</td>'
        f'<td><span class="mono" style="font-size:.68rem">{slots}</span></td><td>{also}</td>'
        f'<td><span style="font-size:.74rem;color:var(--muted)">{src}</span>{badges}</td></tr>')
maptbl = ('<div class="panel maptbl"><table class="tbl"><thead><tr><th>map section</th><th>section id</th><th>home template</th><th>slot(s)</th><th>also appears on</th><th>machine sources · written by</th></tr></thead><tbody>'
 + ''.join(rows_html) + '</tbody></table></div>')

aux = padded('<b>Auxiliary slots</b> (inherit their section\'s direction, no separate exploration): '
 '<span class="mono" style="font-size:.7rem">{{BUCKETS}}</span> + <span class="mono" style="font-size:.7rem">{{GATES}}</span> belong to <code>testing.matrix</code>; '
 '<span class="mono" style="font-size:.7rem">{{VERIFICATION_CHANGELOG}}</span> is <code>now.recent-changes</code> scoped to verification commits; '
 'headline KPI strips (<span class="mono" style="font-size:.7rem">{{*_KPIS}}</span>) are the page\'s own chrome, not a map section.')

scheme = padded('<b>The identity scheme</b><p style="font-size:.84rem;color:var(--ink-2)">'
 'A section is NOT a page — it is a unit of meaning that can render on several pages (the matrix appears full on Tests and entity-scoped on every feature page). '
 'So each section becomes ONE fragment template — <span class="mono" style="font-size:.72rem">templates/center/shell/sections/&lt;id&gt;.html</span> — and every rendered instance carries '
 '<span class="mono" style="font-size:.72rem">data-sec="&lt;id&gt;"</span> in its wrapper. Page skeletons keep their slots; a slot\'s comment names the section fragment(s) that fill it. '
 'Generators compose pages FROM fragments — a section rendered from scratch instead of its fragment is a defect (same rule adopt-spec already states for pages).</p>'
 '<p style="font-size:.8rem;color:var(--muted)">Once you pick a direction per section, the picked markup becomes that fragment, placeholders extracted. Nothing lands until you pick.</p>'
 '<p style="font-size:.8rem;color:var(--muted)"><b>Palette provenance:</b> group colors and command chips are verbatim from the landed map artifact\'s CSS vars (--h-now · --h-board · … / --c-plan · --c-red · …) — solid chip = writes, dashed = verifies (the guard), dotted = reads. Section colors mark the group everywhere: sidebar labels, section headers, table rows.</p>')

W('index', page('index','Guide — sections ⟷ templates ⟷ directions',
 'The map\'s left column as a registry: every section gets an id, a home in the shipped page templates, and 2–3 candidate layouts (recommended first). Click a section in the sidebar, pick per section.',
 '<h2 class="sec">' + IC + ' The mapping</h2>' + maptbl + aux
 + '<h2 class="sec" id="leaf">' + IC + ' The scheme (and Leaf)</h2>' + scheme
 + padded('<b>Leaf · OSS reports</b> — deliberately template-less: htmlcov and the playwright report are external tools\' own HTML, linked from the sidebar, never re-skinned.')))

print('lab pages:', sorted(p.name for p in OUT.glob('*.html')))
