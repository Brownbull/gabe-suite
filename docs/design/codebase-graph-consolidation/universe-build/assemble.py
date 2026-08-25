#!/usr/bin/env python3
"""Transform the 5C spike into the Gabe Universe station (deterministic, re-runnable)."""
import io, os
D=os.path.dirname(os.path.abspath(__file__))
def rd(p): return io.open(os.path.join(D,p),encoding="utf-8").read()
lines = rd("spike-base.html").split("\n")   # 1-indexed logic via i+1

adapter = rd("parts/adapter.js").rstrip("\n")
card    = rd("parts/card.js").rstrip("\n")
css     = rd("parts/station.css").rstrip("\n")
chrome  = rd("parts/chrome.html").rstrip("\n")

TITLE = '<!doctype html><html lang="{{LANG}}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gabe Universe · {{PROJECT_NAME}} Command Center</title>'
STYLE_CLOSE = css + "\n</style></head><body>\n" + chrome
REL2KIND = "var REL2KIND={ fk:'fk', pk:'fk', nests:'fk', handler:'calls', touch:'calls', touches:'calls', resp:'calls', uses:'calls', calls:'calls', consumes:'calls', fetches:'bridge', bridge:'bridge', renders:'imports', mounts:'imports', reads:'imports', imports:'imports', typed:'imports', fecall:'calls', bundle:'calls' };"
GLINE = "  var G=function(label,icon,count,nodeFn,trust){ return {label:label,icon:icon,count:count,node:nodeFn,trust:trust}; };"
TRUSTCONNS = """  function trustTag(tr){ if(!tr) return null;
    return tr==="inferred"
      ? E("span",{class:"ttag inferred",title:"inferred — a graft-call / web-bridge floor (kind-level, not per-edge proof)"},"inferred")
      : E("span",{class:"ttag structural",title:"structural — an exact archmap / FK join"},"structural"); }
  function conns(secIcon,title,groups,opt){ opt=opt||{}; var live=groups.filter(function(g){return g.count>0;}), total=live.reduce(function(s,g){return s+g.count;},0), box=E("div",{class:"connbox"});
    if(!live.length) box.append(E("div",{style:"font-size:12px;color:var(--muted)"}, opt.empty||"— none"));
    live.forEach(function(g){ var tr=g.trust||TRUST[g.label]||null;
      box.append(E("div",{class:"sublbl"}, icoEl(g.icon), g.label+" "+g.count, trustTag(tr)),
        E("div",{class:tr==="inferred"?"cinf":""}, g.node())); });
    return E("div",{class:"sec"}, sechd(secIcon,title, opt.showCount?total:null, false, live.length?{icon:"info",text:"hover a connection → highlights that node. Trust is KIND-level (a floor): structural = exact join; inferred = a graft-call / web-bridge edge.",cls:"info"}:null), box); }"""

# ranges keyed by 1-indexed START line -> (END line inclusive, replacement or None to drop)
repl = {
  1:   (1,   TITLE),
  147: (147, STYLE_CLOSE),
  149: (152, None),                 # drop the spike .bar block (title card + reset → moved to nav/topbar)
  162: (162, '<script src="./assets/3d-bundle.js"></script>'),
  163: (163, '<script src="./assets/chip-assets.js"></script>\n<script src="./c4-graph.js"></script>\n<script src="./levels.js"></script>\n<script src="./sim.data.js"></script>'),   # sim feed: GABE_SIM (live when a change is in flight · null at rest · file absent = undefined)
  234: (282, adapter),              # toy data block -> live adapter
  588: (588, REL2KIND),
  946: (946, GLINE),
  949: (955, TRUSTCONNS),
  969: (1043, card),
}
# GUARD (2026): the map keys are HARDCODED spike-base line numbers, so ANY line-count change
# above a key silently shifts a replacement onto the wrong statement (once truncated `usage`
# and produced un-parseable JS). Assert each content-bearing START line still holds what its
# transform expects — a shift now fails LOUD here instead of shipping broken JS downstream.
_ANCHORS = {234: "var NODEDEF=[", 588: "var REL2KIND={", 946: "var G=function",
            949: "function trustTag(label){", 969: "var cids=function"}   # first token of each rewritten region
for _ln, _needle in _ANCHORS.items():
    _src = lines[_ln-1] if _ln-1 < len(lines) else ""
    assert _needle in _src, ("assemble line-map STALE at %d: expected %r, found %r — a spike-base "
        "line-count change shifted the map; re-sync the keys in `repl`." % (_ln, _needle, _src.strip()[:60]))
out=[]; i=1; N=len(lines)
while i<=N:
    if i in repl:
        end, text = repl[i]
        if text is not None: out.append(text)
        i = end+1
    else:
        out.append(lines[i-1]); i+=1

text = "\n".join(out)

# ── curved connectors (topbar toggle) — QuadraticBezierCurve3 arc, echoing the 2D graph's bowed edges ──
CURVE_HELPERS = """function __uniCurve(A,B,dir,len){ var mid=A.clone().add(B).multiplyScalar(0.5);
  var up=new T.Vector3(0,1,0), perp=new T.Vector3().crossVectors(dir,up);
  if(perp.lengthSq()<1e-4) perp.set(1,0,0);
  perp.normalize(); perp.addScaledVector(up,0.5).normalize();          // bow out, biased slightly up
  mid.addScaledVector(perp, Math.min(len*0.28, 40)*(window.__uniCurveAmt||1));   // arc height ∝ length, capped, × the curve-amount slider
  return new T.QuadraticBezierCurve3(A, mid, B).getPoints(24); }
window.__uniToggleCurved=function(){ window.__uniCurved=!window.__uniCurved;
  try{ updateConnectors(); }catch(e){}
  var b=document.getElementById("curveToggle"); if(b) b.classList.toggle("on", !!window.__uniCurved); };
window.__uniCfgToggle=function(){ var c=document.getElementById("cfg"); if(!c) return;
  var hidden=(c.style.display==="none"); c.style.display=hidden?"":"none";
  if(hidden) c.classList.remove("min");   // the gear always reveals the FULL panel (its own minimize is a separate state — un-minimize on show keeps the two in sync)
  var g=document.getElementById("navgear"); if(g) g.classList.toggle("on", hidden); };
window.__uniNavToggle=function(){ document.body.classList.toggle("nav-min");
  setTimeout(function(){ try{ if(typeof resizeGraph==="function") resizeGraph(); }catch(e){} }, 220); };   // graph refills the reclaimed width after the slide
function connectorWire(grp, a, b, kind, R, hf){ var cfg=CONN[kind]||CONN.calls;
  hf=(hf==null)?1:hf; if(!hf) return;   // depth-highlight factor: 0 = outside a FOCUS set (skip) · >1 = in the lit set (brighter, additive)
  var _bm=(window.__uniBeam && window.__uniBeam[kind]!=null)?window.__uniBeam[kind]:1; if(!_bm) return;"""
assert "function connectorWire(grp, a, b, kind, R){ var cfg=CONN[kind]||CONN.calls;" in text, "connectorWire anchor missing"
text = text.replace("function connectorWire(grp, a, b, kind, R){ var cfg=CONN[kind]||CONN.calls;", CURVE_HELPERS, 1)

# ── batch 10: per-kind BEAM — opacity × beam (capped 1), additive blending past 1 so the wire glows ──
OLD_SOLID = 'mat=new T.LineBasicMaterial({color:cfg.color, transparent:true, opacity:cfg.trust});'
assert OLD_SOLID in text, "connector solid-material anchor missing"
text = text.replace(OLD_SOLID,
  'mat=new T.LineBasicMaterial({color:cfg.color, transparent:true, opacity:Math.min(1,cfg.trust*_bm*hf), blending:((_bm>1||hf>1)?T.AdditiveBlending:T.NormalBlending)});', 1)
OLD_DASHM = 'mat=new T.LineDashedMaterial({color:cfg.color, transparent:true, opacity:cfg.trust, dashSize:base[0]/dn, gapSize:base[1]/dn});'
assert OLD_DASHM in text, "connector dashed-material anchor missing"
text = text.replace(OLD_DASHM,
  'mat=new T.LineDashedMaterial({color:cfg.color, transparent:true, opacity:Math.min(1,cfg.trust*_bm*hf), blending:((_bm>1||hf>1)?T.AdditiveBlending:T.NormalBlending), dashSize:base[0]/dn, gapSize:base[1]/dn});', 1)
OLD_GEO = "  var geo=new T.BufferGeometry().setFromPoints([A,B]), mat;"
assert OLD_GEO in text, "connectorWire geometry line missing"
text = text.replace(OLD_GEO, "  var _pts=window.__uniCurved?__uniCurve(A,B,dir,len):[A,B]; var geo=new T.BufferGeometry().setFromPoints(_pts), mat;", 1)

# ── review fix [2]: hover tooltip uses the REAL per-node label, not the toy legend label ──
assert '.nodeThreeObject(buildNode).nodeLabel(function(n){ return n.K.type+" — "+n.K.label; })' in text
text = text.replace('.nodeLabel(function(n){ return n.K.type+" — "+n.K.label; })',
                    '.nodeLabel(function(n){ return n.K.type+" — "+(n.label||n.K.label); })', 1)

# ── review fix [8/18]: the 3 glyphs the ported card references (skip/nav/journey) were missing from P ──
assert '    endpoint:GLYPH.endpoint, model:GLYPH.model, schema:GLYPH.schema,' in text
text = text.replace('    endpoint:GLYPH.endpoint, model:GLYPH.model, schema:GLYPH.schema,',
  ('    journey:\'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>\',\n'
   '    nav:\'<polygon points="3 11 22 2 13 21 11 13 3 11"/>\',\n'
   '    skip:\'<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>\',\n'
   '    endpoint:GLYPH.endpoint, model:GLYPH.model, schema:GLYPH.schema,'), 1)

# ── review fix [13]: link-card weight is a fixed per-kind constant, not a measured coupling ──
assert '"coupling weight "+(l.w||1)' in text
text = text.replace('"coupling weight "+(l.w||1)', '"edge-kind weight "+(l.w||1)+" (fixed per kind)"', 1)

# ── review fix [14/17]: link-card Trust keyed to l.rel, not a mislabeling two-way constant ──
OLD_TRUST = 'kv(null,"kind", l.proven?"proven · structural (fk / import)":"inferred · graft floor (call)")'
assert OLD_TRUST in text
text = text.replace(OLD_TRUST,
  'kv(null,"kind", ({fk:"structural · foreign-key join", touches:"structural · archmap touch", bridge:"inferred · web-bridge floor (method+path)", calls:"inferred · graft call floor", imports:"inferred · import floor"}[l.rel]) || (l.proven?"structural join":"inferred floor"))', 1)

# ── CARD ASSET THUMBNAILS (operator): the ACTUAL 3D GLB ship/sat the graph draws, rendered inline in the
#    panel sections (Usage→sat · Tests→corpus ship · Journeys→test-chip · Payload→cargo). Uses the SAME shared
#    palR renderer as the legend, into a separate __uniCardCells list pruned on every panel rebuild (no leak).
_LEGTHUMB_TAIL = 'var entry={ctx:cv.getContext("2d"), scene:sc, cam:cam, obj:pivot, w:cv.width, h:cv.height}; PAL_CELLS.push(entry); LEG_CELLS.push(entry); }'
assert _LEGTHUMB_TAIL in text, "legThumb tail anchor missing — cannot add the card asset-thumbnail helper"
_ASSET_HELPER = _LEGTHUMB_TAIL + '''
window.__uniCardCells=[];
window.__uniCardPrune=function(){ if(!window.__uniCardCells.length) return; var drop=window.__uniCardCells; PAL_CELLS=PAL_CELLS.filter(function(c){ return drop.indexOf(c)<0; }); window.__uniCardCells=[]; };
window.__uniAssetThumb=function(buildFn, title){ var cv=document.createElement("canvas"); cv.width=46; cv.height=36; cv.className="asetthumb"; if(title) cv.title=title;
  if(typeof SHIPSREADY!=="undefined" && !SHIPSREADY) return cv;   // ships not loaded → teamShip would give a stale loadingBox that never refreshes; skip the thumbnail until a reselect after load (review)
  try{ var raw=buildFn(); if(raw){ var bb=new T.Box3().setFromObject(raw), cc=bb.getCenter(new T.Vector3());
    var pivot=new T.Group(); raw.position.sub(cc); pivot.add(raw); pivot.rotation.y=0.7;
    var sc=new T.Scene(); sc.add(pivot); sc.add(new T.AmbientLight(0xffffff,0.9));
    var dl=new T.DirectionalLight(0xffffff,1); dl.position.set(5,8,6); sc.add(dl); var dl2=new T.DirectionalLight(0x88aaff,0.4); dl2.position.set(-5,-3,-5); sc.add(dl2);
    var cam=new T.PerspectiveCamera(45, cv.width/cv.height, 0.1, 1000); cam.position.set(2.5,4,18); cam.lookAt(0,0,0);
    var entry={ctx:cv.getContext("2d"), scene:sc, cam:cam, obj:pivot, w:cv.width, h:cv.height};
    PAL_CELLS.push(entry); window.__uniCardCells.push(entry); } }catch(e){}
  return cv; };
window.__uniAssets={
  sat:function(){ return (typeof makeSat==="function")?makeSat():null; },
  ship:function(corpus){ return (typeof teamShip==="function")?teamShip(defModel(({api:"api",web:"web",e2e:"e2e"}[corpus]||"api")), 0x22c55e, 1):null; },
  testchip:function(){ return (typeof teamShip==="function")?teamShip(INTC.testship, 0x22c55e, 1):null; },
  cargo:function(){ return (typeof teamShip==="function")?teamShip(INTC.shuttle, 0x38bdf8, 1):null; },
  god:function(){ return (typeof teamShip==="function")?teamShip(atkModel("god"), 0xef4444, 1):null; },
  ung:function(){ return (typeof teamShip==="function")?teamShip(atkModel("ung"), 0xef4444, 1):null; } };'''
text = text.replace(_LEGTHUMB_TAIL, _ASSET_HELPER, 1)

# Usage section (spike-base) → the SATELLITE asset thumbnail (fan-in = orbiting satellites)
_USAGE_OLD = ('  function usage(n,breakdown){ return E("div",{class:"sec"}, sechd("merge","Usage",n,false,'
  '{icon:"info",text:"IN-DEGREE — how many elements depend on this one. Break it and this many are affected.",cls:"info"}),')
assert _USAGE_OLD in text, "usage() anchor missing — cannot add the satellite thumbnail"
_USAGE_NEW = ('  function usage(n,breakdown){ var _uhd=sechd("merge","Usage",n,false,'
  '{icon:"info",text:"IN-DEGREE — how many elements depend on this one. Break it and this many are affected. In the graph: N satellites orbit the node.",cls:"info"});'
  ' try{ if(n>0 && window.__uniAssetThumb) _uhd.append(window.__uniAssetThumb(function(){ return window.__uniAssets.sat(); }, "satellites \\u2014 one per caller (fan-in)")); }catch(_e){}'
  ' return E("div",{class:"sec"}, _uhd,')
text = text.replace(_USAGE_OLD, _USAGE_NEW, 1)

# prune the card asset-thumbnail cells on every panel rebuild (no WebGL leak across selections)
for _clr in ['function showPanel(n){ var K=n.K;', 'function showLinkPanel(l){', 'function closePanel(){ ']:
    assert _clr in text, "panel builder anchor missing: " + _clr
    text = text.replace(_clr, _clr + ' try{ if(window.__uniCardPrune) __uniCardPrune(); }catch(_cp){}', 1)

# ── FLEET TRANSIT (operator): tie the traveling CARGO/TEST-CHIP assets to the wire's data (cargo ∝ l.payload;
#    test chip ↔ l.proven; ships fly cross-entity wires only). Inserted BEFORE the Trust section in __link. ──
_TRUST_ANCHOR = 'E("div",{class:"sec"}, sechd("info","Trust"),'
assert _TRUST_ANCHOR in text, "link-card Trust anchor missing — cannot insert the Transit section"
_TRANSIT = ('E("div",{class:"sec"}, sechd("truck","Transit"),'
  ' kv("truck","cargo", l.payload? ("carries "+l.payload+" data field"+(l.payload>1?"s":"")+" · the shuttle grows with the payload") : "no payload · no cargo shuttle"),'
  ' kv("test","test chip", l.proven? "test-proven route · the green chip flies it" : "not test-proven · no green chip"),'
  ' E("div",{class:"sublbl"}, (typeof linkCross==="function"&&linkCross(l))? "ships fly this cross-entity wire" : "same-entity wire · no ships transit"))')
text = text.replace(_TRUST_ANCHOR, _TRANSIT + ',\n      ' + _TRUST_ANCHOR, 1)

# ── review-2 fix: 'web' was missing from `order`, so no billboard icon was rasterized for web nodes →
#    they fell back to the purple `panel` PRIMITIVE (the pink cubes). Add it so web shows the screen glyph. ──
OLD_ORDER = 'var order=["route","component","hook","type","store","screen","endpoint","function","schema","model","external","entity"];'
assert OLD_ORDER in text, "order array anchor missing"
text = text.replace(OLD_ORDER, 'var order=["route","component","hook","type","store","module","screen","web","endpoint","function","schema","model","external","entity"];', 1)

# ── center-battery R10: no center page may carry the banned deadness word "orphan" (case-sensitive);
#    the only lowercase hit is an inherited spike comment — reword it (no behavior change) ──
text = text.replace("tab-switches don't leak orphans", "tab-switches don't leak stragglers")
assert "leak orphans" not in text, "R10 orphan trigger survived"

# ── batch 2: entity-layout (chain/force/spread) + cluster-core (layer/kind/tests) + the second config tab ──
LAYOUT_JS = rd("parts/layout.js").rstrip("\n")
OLD_ZFORCE = ('function zForce(alpha){ var ns=zForce.__n||[]; ns.forEach(function(n){\n'
              '  n.vy += ((LZ[n.layer]||0)-n.y)*0.05*alpha; n.vx += ((EX[n.ent]||0)-n.x)*0.045*alpha; }); }\n'
              'zForce.initialize=function(ns){ zForce.__n=ns; };')
assert OLD_ZFORCE in text, "zForce block anchor missing"
text = text.replace(OLD_ZFORCE, LAYOUT_JS, 1)
# ── operator: the top-right config panel is the TEMPORARY-controls home ──
text = text.replace('ico("cog",13)+\'Config</span>', 'ico("cog",13)+\'Temporary Config</span>', 1)
assert 'var CFG={ shape:"polygon", subOn:true, entOn:true,' in text, "CFG anchor missing"
text = text.replace('var CFG={ shape:"polygon", subOn:true, entOn:true,',
                    'var CFG={ shape:"polygon", entLayout:"force", coreBy:"layer", coreByBE:null, coreByFE:null, lineStyle:"curved", showFns:"off", showTypes:"off", subOn:true, entOn:true,', 1)
OLD_APPLY = 'else if(grp==="transports"){ buildTransports(); } else { buildClusters(); updateClusters(true); } }'
assert OLD_APPLY in text, "applyCfg anchor missing"
text = text.replace(OLD_APPLY,
  'else if(grp==="transports"){ buildTransports(); } '
  'else if(grp==="entLayout"){ __uniFreezeForSettle(); recomputeEX(CFG.entLayout); recomputeSubAnchors(); if(Graph){ try{ Graph.d3ReheatSimulation(); }catch(e){} } buildClusters(); updateClusters(true); } '
  'else if(grp==="coreByBE"||grp==="coreByFE"){ __uniFreezeForSettle(); (window.__uniAssignSplit?__uniAssignSplit():assignSub(CFG.coreByBE||"kind")); recomputeSubAnchors(); if(window.__uniApplyCapsules) __uniApplyCapsules(); if(Graph){ try{ Graph.d3ReheatSimulation(); }catch(e){} } buildClusters(); updateClusters(true); if(window.__uniFleetRegroup) __uniFleetRegroup(); } '
  'else if(grp==="lineStyle"){ __uniSetCurve(CFG.lineStyle==="curved"); } '
  'else if(grp==="showFns"){ toggleFns(CFG.showFns==="on"); } '
  'else if(grp==="showTypes"){ toggleTypes(CFG.showTypes==="on"); } '
  'else { buildClusters(); updateClusters(true); } }', 1)
assert 'preloadBillboards(function(){ build();' in text, "boot anchor missing"
text = text.replace('preloadBillboards(function(){ build();',
                    'preloadBillboards(function(){ try{ recomputeEX(CFG.entLayout); (window.__uniAssignSplit?__uniAssignSplit():assignSub(CFG.coreByBE||"kind")); recomputeSubAnchors(); }catch(e){} build(); try{ if(window.__uniComputeSolo) __uniComputeSolo(); }catch(e){} try{ __uniSetupOrbit(); }catch(e){} setTimeout(function(){ try{ if(window.__uniSetKindState) __uniSetKindState("function","critical"); }catch(e){} if(window.__uniApplyCapsules) __uniApplyCapsules(); if(window.__uniCamFit) __uniCamFit(0); }, 400);', 1)
assert '\nbuildCfg();\n' in text, "boot buildCfg anchor missing"
text = text.replace('\nbuildCfg();\n', '\nbuildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg();\n', 1)

# ── batch 9: typed link rest-lengths (intra 40 / cross-entity 280) — the default rest≈30 springs
#    are what collapsed the entities into one mesh; and the unbounded -150 charge BALLOONS each
#    cluster to r≈180 against a ~105 containment (measured) → cap its range, soften it ──
OLD_DEF = 'DEF={x:110,y:40,z:430}'
assert OLD_DEF in text, "camera DEF anchor missing"
text = text.replace(OLD_DEF, 'DEF={x:150,y:80,z:780}', 1)   # scene widened ×1.55 (anchor SEP) → pull the home camera back to frame it

OLD_CHARGE = '  try{ Graph.d3Force("charge").strength(-150); }catch(e){}'
assert OLD_CHARGE in text, "charge-force anchor missing"
text = text.replace(OLD_CHARGE,
  '  try{ Graph.d3Force("charge").strength(-60).distanceMax(150); }catch(e){}\n'
  '  try{ tuneLinkForce(); }catch(e){}', 1)

# ── batch 10: the settle RESUMES what __uniFreezeForSettle paused (layout/core/functions changes) ──
OLD_STOP = '.onEngineStop(function(){ updateClusters(true);'
assert OLD_STOP in text, "onEngineStop anchor missing"
text = text.replace(OLD_STOP, '.onEngineStop(function(){ updateClusters(true); if(window.__uniSettleDone) window.__uniSettleDone();', 1)

# ── batch 11-A: legend Connectors rows DERIVE from CONN (the literals duplicated boot values → lied
#    after any edit); the ln sample becomes an SVG from DASHMAP (CSS border-style cannot draw sparse;
#    inline height beats the .lgln{height:0} border-trick rule) ──
OLD_LEGROWS = '''  Connectors:[ {t:"grp",l:"entity ↔ entity · <i>relationship kind</i>"},
    {t:"ln",c:0x5893ad,s:"dashed",l:"fk <i>a foreign-key data coupling</i>"},
    {t:"ln",c:0xf59e0b,s:"dashed",l:"calls <i>a cross-entity function call</i>"},
    {t:"ln",c:0xa855f7,s:"dotted",l:"imports <i>a cross-entity import</i>"},
    {t:"ln",c:0xe8f443,s:"dotted",l:"bridge <i>a frontend fetch reaching an API</i>"},'''
assert OLD_LEGROWS in text, "legend Connectors literals anchor missing"
text = text.replace(OLD_LEGROWS, '''  Connectors:[ {t:"grp",l:"entity ↔ entity · <i>relationship kind</i>"},
    {t:"ln",k:"fk",l:"fk <i>a foreign-key data coupling</i>"},
    {t:"ln",k:"calls",l:"calls <i>a cross-entity function call</i>"},
    {t:"ln",k:"imports",l:"imports <i>a cross-entity import</i>"},
    {t:"ln",k:"bridge",l:"bridge <i>a frontend fetch reaching an API</i>"},''', 1)
OLD_LNCASE = '''      case "ln": return '<div class="lgln" style="border-bottom:2.5px '+it.s+' '+c+'"></div>';'''
assert OLD_LNCASE in text, "legend ln-case anchor missing"
text = text.replace(OLD_LNCASE,
  '''      case "ln": var lw=it.k?CONN[it.k]:{color:it.c,style:it.s}, lc=hx(lw.color!=null?lw.color:0xffffff),
        ld=DASHMAP[lw.style]; if(ld===undefined) ld="6 3";
        return '<svg class="lgln" style="width:30px;height:8px" viewBox="0 0 30 8"><path d="M1 4 H29" fill="none" stroke="'+lc+'" stroke-width="2.5"'+(ld?' stroke-dasharray="'+ld+'"':'')+'/></svg>';''', 1)

# ── batch 10 (review r2): BOTH bare buildCfg() call sites rebuild the FLAT panel and drop the tabs —
#    re-tab after each (the .cfgtabbar guard makes __uniAddLayoutTab idempotent, state read from CFG) ──
OLD_PRESET = 'if(changed && document.getElementById("cfg")) buildCfg(); })();'
assert OLD_PRESET in text, "URL-preset buildCfg anchor missing"
text = text.replace(OLD_PRESET,
  'if(changed && document.getElementById("cfg")){ buildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg(); if(window.__uniFleetSync) __uniFleetSync(); } })();', 1)
OLD_DRIVE = 'CFG.shape=window.__drive; CFG.subOn=true; CFG.entOn=true; buildCfg(); buildClusters(); updateClusters(true); }'
assert OLD_DRIVE in text, "?drive buildCfg anchor missing"
text = text.replace(OLD_DRIVE,
  'CFG.shape=window.__drive; CFG.subOn=true; CFG.entOn=true; buildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg(); buildClusters(); updateClusters(true); }', 1)

# (orbit-around-click is now a pointerdown re-pivot in __uniSetupOrbit — batch 7; the old click-based
#  approach never fired on a drag, so it is not re-applied here.)

# ── batch 7 PERF: freeze the per-frame fleet bob (FLEETTICK) unless ANIM.fleets; master pause via ANIM.all ──
assert 'function pulseLoop(){ requestAnimationFrame(pulseLoop); var t=Date.now();' in text, "pulseLoop anchor missing"
text = text.replace('function pulseLoop(){ requestAnimationFrame(pulseLoop); var t=Date.now();',
                    'function pulseLoop(){ requestAnimationFrame(pulseLoop); if(!ANIM.all) return; var t=Date.now();', 1)
assert 'if(FLEETTICK.length){ var ft=(t-_pt0)/1000; for(var fi=0;fi<FLEETTICK.length;fi++) FLEETTICK[fi](ft); }' in text, "FLEETTICK anchor missing"
text = text.replace('if(FLEETTICK.length){ var ft=(t-_pt0)/1000; for(var fi=0;fi<FLEETTICK.length;fi++) FLEETTICK[fi](ft); }',
                    'if(ANIM.fleets && FLEETTICK.length){ var ft=(t-_pt0)/1000; for(var fi=0;fi<FLEETTICK.length;fi++) FLEETTICK[fi](ft); }', 1)

# ── NaN guard: never let a non-finite node position enter _npos (protects connector/hull geometry) ──
if 'if(n.x!=null) _npos[n.id]' in text:
    text = text.replace('if(n.x!=null) _npos[n.id]', 'if(n.x!=null && isFinite(n.x)) _npos[n.id]', 1)

# ── batch 6: planet assets OFF by default ──
assert 'warOn:true, warDist' in text, "warOn anchor missing"
# warOn stays TRUE (spike default) — the zone system is always live; the FLEET zone columns are the per-entity control (assets off via _VISDEF zones=0). Operator moved the control off the planet config.

# ── batch 6 PERF: throttle the per-tick connector rebuild (the 227+ geometry churn) during settle;
#    a forced call (onEngineStop / control change) still rebuilds fully, so the settled frame is exact ──
assert '}); updateConnectors(); }' in text, "updateClusters connector-call anchor missing"
text = text.replace('}); updateConnectors(); }', '}); if(window.__uniHLTick) __uniHLTick(); if(force || _wtick%3===0) updateConnectors(); }', 1)

# ── batch 11-B: FLEET panel engine seams — every read goes through visEnt/visN (NIDS-resolved,
#    never NENT: NENT is built once at boot and is stale for toggled-in function nodes) ──
# seam 1: node visibility (hidden = removed from the mapper; rebuilt via buildNode on re-show)
OLD_DRAG = '.enableNodeDrag(false)'
assert OLD_DRAG in text, "enableNodeDrag anchor missing"
text = text.replace(OLD_DRAG, '.nodeVisibility(function(n){ return !!visN(n).show; }).enableNodeDrag(false)', 1)
# seam 2 (dormant while conns is baked on): plain links of a hidden entity stay hidden
OLD_LVIS = 'function linkVisFn(l){ return !CFG.conns; }'
assert OLD_LVIS in text, "linkVisFn anchor missing"
text = text.replace(OLD_LVIS,
  'function linkVisFn(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];\n'
  '  if((s&&!visN(s).show)||(t&&!visN(t).show)) return false; return !CFG.conns; }', 1)
# seam 3: connector wires skip a hidden endpoint entity
OLD_CONNLOOP = 'links.forEach(function(l){ var a=_npos[lid(l.source)], b=_npos[lid(l.target)]; if(!a||!b) return;   // EVERY link → its kind\'s connector wire'
assert OLD_CONNLOOP in text, "updateConnectors loop anchor missing"
text = text.replace(OLD_CONNLOOP, OLD_CONNLOOP +
  '\n    var _cs=NIDS[lid(l.source)], _ct=NIDS[lid(l.target)];\n'
  '    if((_cs&&(!_nodeVisibleFn(_cs)||!visN(_cs).wires))||(_ct&&(!_nodeVisibleFn(_ct)||!visN(_ct).wires))) return;   // fleet: hidden node OR wires-off entity/cluster', 1)
# seam 4: hulls — ent hull skipped when !show; sub hulls when !show OR !subs (their own loop)
OLD_ENTHULL = 'if(CFG.entOn) Object.keys(ENT).forEach(function(e){ var mem=nodes.filter(function(n){return n.ent===e;}).map(function(n){return n.id;});'
assert OLD_ENTHULL in text, "buildClusters ent-loop anchor missing"
text = text.replace(OLD_ENTHULL,
  'if(CFG.entOn) Object.keys(ENT).forEach(function(e){ if(!visEnt(e).show) return; var mem=nodes.filter(function(n){return n.ent===e;}).map(function(n){return n.id;});', 1)
OLD_SUBHULL = 'if(CFG.subOn){ var subs={}; nodes.forEach(function(n){ var k=n.ent+"|"+n.sub; (subs[k]=subs[k]||[]).push(n.id); });'
assert OLD_SUBHULL in text, "buildClusters sub-loop anchor missing"
text = text.replace(OLD_SUBHULL,
  'if(CFG.subOn){ var subs={}; nodes.forEach(function(n){ if(!visEnt(n.ent).show||!visEnt(n.ent).subs) return;\n'
  '    var _shv=UNIVIS.sub[n.ent+"|"+n.sub]; if(_shv&&!_shv.show) return;   // cluster hidden by the fleet panel\n'
  '    var k=n.ent+"|"+n.sub; (subs[k]=subs[k]||[]).push(n.id); });', 1)
# seam 6: transports skip a route whose end entity is hidden or routes-off
OLD_TRLOOP = '  links.forEach(function(l){ if(!linkCross(l)) return;'
assert OLD_TRLOOP in text, "buildTransports loop anchor missing"
text = text.replace(OLD_TRLOOP, OLD_TRLOOP +
  '\n    var _sn=NIDS[lid(l.source)], _tn=NIDS[lid(l.target)], _sv=_sn?visN(_sn):_VISDEF, _tv=_tn?visN(_tn):_VISDEF;\n'
  '    if(!_sv.show||!_tv.show||!_sv.routes||!_tv.routes) return;   // fleet: hidden or routes-off entity/cluster (node-level — sub-aware)', 1)
# seam 5 (batch 11-B2): the four fleet-zone gates become per-entity — global AND entity
OLD_ZD = 'var def=CFG.zDef? placeFleet('
assert OLD_ZD in text, "fleetZones zDef anchor missing"
text = text.replace(OLD_ZD, 'var def=(CFG.zDef&&visN(n).zDef)? placeFleet(', 1)
OLD_ZA = 'var atk=CFG.zAtk? placeFleet('
assert OLD_ZA in text, "fleetZones zAtk anchor missing"
text = text.replace(OLD_ZA, 'var atk=(CFG.zAtk&&visN(n).zAtk)? placeFleet(', 1)
OLD_ZC = 'var eff=CFG.zCfl? cflSpec('
assert OLD_ZC in text, "fleetZones zCfl anchor missing"
text = text.replace(OLD_ZC, 'var eff=(CFG.zCfl&&visN(n).zCfl)? cflSpec(', 1)
OLD_ZS = 'if(CFG.zSat) for(var si=0;'
assert OLD_ZS in text, "fleetZones zSat anchor missing"
text = text.replace(OLD_ZS, 'if(CFG.zSat&&visN(n).zSat) for(var si=0;', 1)

# ── operator: METHOD BADGE — a coloured HTTP-method chip at the endpoint icon's lower-right ──
_METHOD_BADGE = "function methodBadge(m, br){ var col=(typeof METHOD!=='undefined'&&METHOD[m])||'#8794ab'; var cv=document.createElement('canvas'); cv.width=cv.height=128; var c=cv.getContext('2d'); c.fillStyle=col; c.beginPath(); c.arc(64,64,58,0,6.2832); c.fill(); c.strokeStyle='#0b0f18'; c.fillStyle='#0b0f18'; c.lineWidth=13; c.lineCap='round'; c.lineJoin='round'; c.beginPath(); if(m==='GET'){ c.moveTo(64,34); c.lineTo(64,94); c.moveTo(46,78); c.lineTo(64,94); c.lineTo(82,78); } else if(m==='PUT'){ c.moveTo(64,94); c.lineTo(64,34); c.moveTo(46,50); c.lineTo(64,34); c.lineTo(82,50); } else if(m==='POST'){ c.moveTo(34,64); c.lineTo(94,64); c.moveTo(64,34); c.lineTo(64,94); } else if(m==='DELETE'){ c.moveTo(43,43); c.lineTo(85,85); c.moveTo(85,43); c.lineTo(43,85); } else if(m==='PATCH'){ c.moveTo(38,72); c.quadraticCurveTo(54,44,64,64); c.quadraticCurveTo(74,84,90,56); } else { c.arc(64,64,15,0,6.2832); } c.stroke(); var _o=(typeof CFG!=='undefined'&&CFG.mbOp!=null)?CFG.mbOp:0.6; var _z=(typeof CFG!=='undefined'&&CFG.mbSize!=null)?CFG.mbSize:3.5; var _x=(typeof CFG!=='undefined'&&CFG.mbX!=null)?CFG.mbX:2; var _y=(typeof CFG!=='undefined'&&CFG.mbY!=null)?CFG.mbY:-2.5; var s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv), transparent:true, opacity:_o, depthWrite:false, depthTest:false })); s.scale.set(_z,_z,1); s.position.set(_x,_y,4); s.raycast=function(){}; if(window.__uniBadges) window.__uniBadges.push(s); return s; }\n"
assert 'function buildNode(n){' in text, "buildNode anchor missing (method badge)"
text = text.replace('function buildNode(n){', _METHOD_BADGE + 'function buildNode(n){', 1)
assert '  grp.add(ic);' in text, "grp.add(ic) anchor missing (method badge)"
text = text.replace('  grp.add(ic);', '  grp.add(ic);\n  if(n.kind==="endpoint" && n.m && n.m.method){ try{ grp.add(methodBadge(n.m.method, br)); }catch(_mb){} }   // operator: HTTP-method badge at the icon lower-right', 1)

# ── batch 12: layer ruling (c) — sub groups carry the kind's OWN layer (endpoints·api·web·data);
#    the hull hue-shift map gains the un-collapsed keys ──
OLD_SUBSHIFT = 'var SUBSHIFT={ frontend:0.10, api:-0.08, data:0.0 };'
assert OLD_SUBSHIFT in text, "SUBSHIFT anchor missing"
text = text.replace(OLD_SUBSHIFT, 'var SUBSHIFT={ endpoints:0.04, api:-0.08, web:0.10, frontend:0.10, data:0.0 };', 1)

# ── batch 12: DEPTH HIGHLIGHT — selection hook · per-wire factor · shared visibility fn · reapply ──
# ── batch 22: cluster hulls carry their keys (ekey/skey) so the background-click picker can route
#    a hull hit to the entity/cluster panel; the boot chain opens the Everything panel (no selection). ──
text = text.replace(
  'CLUSTERS.push(makeCluster(mem, ENT[e], CFG.shape, OPMAP[CFG.shape][CFG.entOp], "ent", e));',
  'CLUSTERS.push(Object.assign(makeCluster(mem, ENT[e], CFG.shape, OPMAP[CFG.shape][CFG.entOp], "ent", e), {ekey:e}));', 1)
text = text.replace(
  'CLUSTERS.push(makeCluster(mem, col, CFG.shape, OPMAP[CFG.shape][CFG.subOp], "sub", sub));',
  'CLUSTERS.push(Object.assign(makeCluster(mem, col, CFG.shape, OPMAP[CFG.shape][CFG.subOp], "sub", sub), {ekey:e, skey:sub}));', 1)

# ── batch 23b: info icons show ONLY the styled dark tip — the native title doubled it (operator photo) ──
text = text.replace(
  'function tipIcon(t){ var w=E("span",{class:"tipico "+(t.cls||"info"),title:t.text}, icoEl(t.icon), E("span",{class:"tip"},t.text)); w.onclick=function(e){ e.stopPropagation(); w.classList.toggle("on"); }; return w; }',
  'function tipIcon(t){ var w=E("span",{class:"tipico "+(t.cls||"info")}, icoEl(t.icon), E("span",{class:"tip"},t.text)); var tip=w.lastChild;\n'
  '  function _tipPlace(){ tip.style.left="-4px"; tip.style.top="19px"; tip.style.bottom="auto";\n'
  '    var r=tip.getBoundingClientRect(), iw=window.innerWidth, ih=window.innerHeight;\n'
  '    if(r.right>iw-8) tip.style.left=(-4-(r.right-(iw-8)))+"px";              // slide LEFT of the viewport edge\n'
  '    r=tip.getBoundingClientRect(); if(r.left<8) tip.style.left=(parseFloat(tip.style.left)+(8-r.left))+"px";\n'
  '    if(r.bottom>ih-8){ tip.style.top="auto"; tip.style.bottom="19px"; } }    // flip ABOVE near the bottom\n'
  '  w.addEventListener("mouseenter", _tipPlace);\n'
  '  w.onclick=function(e){ e.stopPropagation(); w.classList.toggle("on"); _tipPlace(); }; return w; }', 1)

# ── batch 25: every element display (click, walk, chips, member rows — all flow through showPanel)
#    lights the element's CLUSTER + ENTITY hulls; Esc/panelAll clears via the same engine. ──
text = text.replace(
  'var card=KINDCARD[n.kind]; (card ? card(n) : []).forEach(function(nd){ if(nd) pb.append(nd); });',
  'var card=KINDCARD[n.kind]; (card ? card(n) : []).forEach(function(nd){ if(nd) pb.append(nd); });\n  if(window.__uniSelHulls) __uniSelHulls(n);', 1)

# ── batch 35: per-kind ENTITY GRADIENT (the lab's L1 device, ported) — cfg.grad colors the wire
#    by its endpoint ENTITY colors via vertex colors; the kind keeps carrying the dash STYLE. ──
assert "function connectorWire(grp, a, b, kind, R, hf){ var cfg=CONN[kind]||CONN.calls;" in text
text = text.replace("function connectorWire(grp, a, b, kind, R, hf){ var cfg=CONN[kind]||CONN.calls;",
  "function connectorWire(grp, a, b, kind, R, hf, ea, eb, hov){ var cfg=CONN[kind]||CONN.calls;", 1)
OLD_GEO2 = "var _pts=window.__uniCurved?__uniCurve(A,B,dir,len):[A,B]; var geo=new T.BufferGeometry().setFromPoints(_pts), mat;"
assert OLD_GEO2 in text, "gradient geometry anchor missing"
text = text.replace(OLD_GEO2, OLD_GEO2 + """
  var _hlc=hov?((window.__uniTheme==="light")?0x4f46e5:0xffffff):0;   // ONLY the HOVER pair recolors; lit/selected wires keep their kind color
  var _gr=!!(cfg.grad && ea!=null && eb!=null) && !_hlc;
  if(_gr){ var _ca=new T.Color(ea), _cb=new T.Color(eb), _n=_pts.length, _arr=new Float32Array(_n*3), _tc=new T.Color();
    for(var _i=0;_i<_n;_i++){ _tc.copy(_ca).lerp(_cb, _n>1?_i/(_n-1):0); _arr[_i*3]=_tc.r; _arr[_i*3+1]=_tc.g; _arr[_i*3+2]=_tc.b; }
    geo.setAttribute("color", new T.BufferAttribute(_arr,3)); }""", 1)
OLD_MS = "mat=new T.LineBasicMaterial({color:cfg.color, transparent:true, opacity:Math.min(1,cfg.trust*_bm*hf), blending:((_bm>1||hf>1)?T.AdditiveBlending:T.NormalBlending)});"
assert OLD_MS in text, "gradient solid-material anchor missing"
text = text.replace(OLD_MS,
  "mat=new T.LineBasicMaterial({color:_hlc||(_gr?0xffffff:cfg.color), vertexColors:_gr, transparent:true, opacity:Math.min(1,cfg.trust*_bm*hf), blending:((_bm>1||hf>1)?T.AdditiveBlending:T.NormalBlending)});", 1)
OLD_MD = "mat=new T.LineDashedMaterial({color:cfg.color, transparent:true, opacity:Math.min(1,cfg.trust*_bm*hf), blending:((_bm>1||hf>1)?T.AdditiveBlending:T.NormalBlending), dashSize:base[0]/dn, gapSize:base[1]/dn});"
assert OLD_MD in text, "gradient dashed-material anchor missing"
text = text.replace(OLD_MD,
  "mat=new T.LineDashedMaterial({color:_hlc||(_gr?0xffffff:cfg.color), vertexColors:_gr, transparent:true, opacity:Math.min(1,cfg.trust*_bm*hf), blending:((_bm>1||hf>1)?T.AdditiveBlending:T.NormalBlending), dashSize:base[0]/dn, gapSize:base[1]/dn});", 1)
# ── batch 37: the operator's dialed-in Connections DEFAULTS (pasted config 2026-08-23) ──
OLD_CONN = "var CONN={ fk:{color:0x5893ad,style:'dashed',density:2.7,trust:0.9}, bridge:{color:0xe8f443,style:'dotted',density:1.7,trust:0.62}, calls:{color:0xf59e0b,style:'dashed',density:2,trust:0.6}, imports:{color:0xa855f7,style:'dotted',density:2.2,trust:0.52} };"
assert OLD_CONN in text, "CONN literal anchor missing"
text = text.replace(OLD_CONN,
  "var CONN={ fk:{color:0x5893ad,style:'sparse',density:2.7,trust:0.9,grad:true}, bridge:{color:0xe8f443,style:'sparse',density:1.7,trust:0.62}, calls:{color:0xf59e0b,style:'solid',density:2,trust:0.6,grad:true}, imports:{color:0xa855f7,style:'dotted',density:2.2,trust:0.52} };", 1)


# batch 37: wires remember their KIND (proofs + future pickers read line.userData.kind)
OLD_LINEADD = "var line=new T.Line(geo,mat); if(mat.isLineDashedMaterial) line.computeLineDistances(); grp.add(line); }"
assert OLD_LINEADD in text, "line-add anchor missing"
text = text.replace(OLD_LINEADD,
  "var line=new T.Line(geo,mat); line.userData.kind=kind; if(mat.isLineDashedMaterial) line.computeLineDistances(); grp.add(line); }", 1)

# ── batch 39: the LINK card's endpoint chips hover-light their nodes (element-card parity) ──
OLD_LCHIP = """  C.__link=function(l){ var s=l.source, t=l.target, sl=(s&&s.label)||s, tl=(t&&t.label)||t, sk=(s&&s.kind)||"function", tk=(t&&t.kind)||"function";
    return [
      E("div",{class:"sec"}, sechd("link","Relation"),
        E("div",{style:"display:flex;align-items:center;gap:6px;flex-wrap:wrap"},
          E("span",{class:"pchip "+chipCls(sk)}, icoEl(sk), sl), E("span",{style:"color:var(--muted);font-weight:700"},"→"), E("span",{class:"pchip "+chipCls(tk)}, icoEl(tk), tl)),"""
assert OLD_LCHIP in text, "link-card chips anchor missing"
text = text.replace(OLD_LCHIP,
"""  C.__link=function(l){ var s=l.source, t=l.target, sl=(s&&s.label)||s, tl=(t&&t.label)||t, sk=(s&&s.kind)||"function", tk=(t&&t.kind)||"function";
    var _lchip=function(nd,k,lb){ var el=E("span",{class:"pchip "+chipCls(k)}, icoEl(k), lb);   // hover lights the node — same halo as the element card's chips
      var id=(nd&&nd.id)||((typeof nd==="string")?nd:null);
      if(id&&window.__uniHoverHL){ el.style.cursor="pointer"; el.title=(el.title?el.title+" · ":"")+"click to open (builds the 7-step trail)";
        el.addEventListener("mouseenter",function(){ __uniHoverHL(id); });
        el.addEventListener("mouseleave",function(){ __uniHoverHL(null); });
        el.addEventListener("click",function(ev){ ev.stopPropagation(); if(window.__uniGoto) __uniGoto(id); }); }
      return el; };
    return [
      E("div",{class:"sec"}, sechd("link","Relation"),
        E("div",{style:"display:flex;align-items:center;gap:6px;flex-wrap:wrap"},
          _lchip(s,sk,sl), E("span",{style:"color:var(--muted);font-weight:700"},"→"), _lchip(t,tk,tl)),""", 1)

# ── batch 43: the legend head wears the panel title format (icon + caps, like fleet/controls) ──
OLD_LGHD = """    var h='<div class="lghd"><b>Legend</b><div class="lgtabs">';"""
assert OLD_LGHD in text, "legend head anchor missing"
text = text.replace(OLD_LGHD,
  """    var h='<div class="lghd"><b>'+(typeof ico==="function"?ico("shape",13):"")+'Legend</b><div class="lgtabs">';""", 1)

# ── batch 44: the legend body carries the active tab as a class → per-tab layout (Types = 2 columns) ──
OLD_LGBODY = """    h+='<div class="lgbody">';"""
assert OLD_LGBODY in text, "legend body anchor missing"
text = text.replace(OLD_LGBODY,
  """    h+='<div class="lgbody lg-'+active.toLowerCase().replace(/[^a-z]/g,"")+'">';""", 1)

OLD_CLICK = '.onNodeClick(function(n){ SEL={kind:"node",data:n}; showPanel(n); refreshEncSel(); })'
assert OLD_CLICK in text, "onNodeClick anchor missing"
text = text.replace(OLD_CLICK,
  '.onNodeClick(function(n){ if(n&&n.kind==="capsule"){ if(window.__uniCapExpand) __uniCapExpand(n.ent); return; } SEL={kind:"node",data:n}; showPanel(n); refreshEncSel(); if(window.__uniHLSelect) __uniHLSelect(n); })', 1)
# batch 48: the `module` kind's SLAB form (a flat wide box — "a bag of functions") beside the spike's nine forms
OLD_WIREFORM = '  if(f==="wire") return new T.Mesh(new T.BoxGeometry(r*1.4,r*1.4,r*1.4), m(col,true));'
assert OLD_WIREFORM in text, "primitiveMesh wire-form anchor missing"
text = text.replace(OLD_WIREFORM, OLD_WIREFORM + '\n  if(f==="slab") return new T.Mesh(new T.BoxGeometry(r*2.0,r*0.55,r*2.0), m(col));\n  if(f==="pod") return new T.Mesh(new T.SphereGeometry(r*2.1, 12, 9), m(col));', 1)

# batch 50: fe-only homes wear the `fe ·` identifier on their HULL LABEL (display only — c.name stays the key)
# batch 50b: labelSprite sizes its canvas to the TEXT (the fixed 256px canvas clipped both ends of a
# centered long label — "fe · design-system" rendered as "· design-syst"); the sprite scales
# proportionally so the on-screen glyph height is unchanged for every label that already fit.
# batch 50b(2): updateClusters overwrote every label to a FIXED 50x12.5 / 30x7.5 each tick (aspect 4 —
# the old 256x64 canvas). A text-fitted canvas needs the width to FOLLOW its own aspect or the text squeezes.
OLD_LSCALE = 'if(c.lbl){ c.lbl.position.set(c.level==="ent"?cx:cx-28, c.level==="ent"?top+26:cy, cz); c.lbl.scale.set(c.level==="ent"?50:30, c.level==="ent"?12.5:7.5, 1); }'
assert OLD_LSCALE in text, "cluster label rescale anchor missing"
text = text.replace(OLD_LSCALE,
  'if(c.lbl){ c.lbl.position.set(c.level==="ent"?cx:cx-28, c.level==="ent"?top+26:cy, cz); '
  'var _lh=c.level==="ent"?12.5:7.5, _la=(c.lbl.material.map&&c.lbl.material.map.image)?(c.lbl.material.map.image.width/c.lbl.material.map.image.height):4; '
  'c.lbl.scale.set(_lh*_la, _lh, 1); }', 1)

OLD_LSPR = '''function labelSprite(txt, size, y, col){ var cv=document.createElement("canvas"); cv.width=256; cv.height=64; var c=cv.getContext("2d");
  c.font="600 "+(size||26)+"px "+curFont(); c.fillStyle=col||"#cdd6ea"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(txt,128,32);
  var s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv), transparent:true, depthWrite:false})); s.scale.set(34,8.5,1); if(y!=null) s.position.y=y; return s; }'''
assert OLD_LSPR in text, "labelSprite anchor missing"
text = text.replace(OLD_LSPR, '''function labelSprite(txt, size, y, col){ var cv=document.createElement("canvas"); var c0=cv.getContext("2d");
  var fnt="600 "+(size||26)+"px "+curFont(); c0.font=fnt;
  var tw=Math.ceil(c0.measureText(txt).width)+16;                         // the canvas FITS the text (16px breathing)
  cv.width=Math.max(256, tw); cv.height=64; var c=cv.getContext("2d");    // resizing resets state — re-set the font
  c.font=fnt; c.fillStyle=col||"#cdd6ea"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(txt, cv.width/2, 32);
  var s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv), transparent:true, depthWrite:false}));
  s.scale.set(34*(cv.width/256),8.5,1); if(y!=null) s.position.y=y; return s; }''', 1)

# review 52[4]: shuttles never fly a WIRE VIEW-hidden wire (unless it is lit — the light-on-demand contract)
OLD_TRLOOP = 'links.forEach(function(l){ if(!linkCross(l)) return;'
assert OLD_TRLOOP in text, "buildTransports loop anchor missing"
text = text.replace(OLD_TRLOOP,
  'links.forEach(function(l){ if(!linkCross(l)) return; if(window.__uniRelHide&&__uniRelHide(l)&&!(HL.on&&HL.links&&HL.links.has(l))) return;', 1)

# review 52[6]: the reset + boot camera FIT the live field (19 clusters outgrew the fixed 780)
OLD_RESET = 'document.getElementById("reset").onclick=function(){ Graph.cameraPosition(DEF,{x:0,y:0,z:0},600); };'
assert OLD_RESET in text, "reset handler anchor missing"
text = text.replace(OLD_RESET, 'document.getElementById("reset").onclick=function(){ if(window.__uniCamFit) __uniCamFit(600); else Graph.cameraPosition(DEF,{x:0,y:0,z:0},600); };', 1)

OLD_CLBL = 'c.lbl=addObj(labelSprite(label, level==="ent"?34:24, null, level==="ent"?color:"#c9d3e6"));'
assert OLD_CLBL in text, "cluster label sprite anchor missing"
text = text.replace(OLD_CLBL, 'c.lbl=addObj(labelSprite((level==="ent"&&window.__uniEntLabel)?__uniEntLabel(label):label, level==="ent"?34:24, null, level==="ent"?color:"#c9d3e6"));', 1)

# batch 51: the legend Types tab GROUPS (frontend · backend) and each kind row is a hide-by-kind CONTROL
OLD_TYPES = """  Types: order.map(function(k){ return {t:"kind",k:k}; }).concat([   # the 12 element KINDS — icon + 3D form (the node representation)
    {t:"note",l:"boundary colour = ENTITY (the cluster) · icon colour = kind · container: polygon / wrap"} ]),"""
OLD_TYPES = OLD_TYPES.replace("#", "//")
assert OLD_TYPES in text, "legend Types list anchor missing"
NEW_TYPES = """  Types: [{t:"hd",l:"frontend"}].concat(
    ["route","component","hook","type","store","module","screen","web"].filter(function(k){ return order.indexOf(k)>=0; }).map(function(k){ return {t:"kind",k:k}; }),
    [{t:"hd",l:"backend"}],
    ["endpoint","function","schema","model","external","entity"].filter(function(k){ return order.indexOf(k)>=0; }).map(function(k){ return {t:"kind",k:k}; }),
    [ {t:"note",l:"boundary colour = ENTITY (the cluster) · icon colour = kind · click a row to HIDE that kind graph-wide"} ]),"""
text = text.replace(OLD_TYPES, NEW_TYPES, 1)

OLD_KROW = '''      if(it.t==="kind"){ var K=KINDS[it.k]; h+=\'<div class="lgrow"><div class="lgvis">\'+svgInline(it.k,K.col,17)+\'</div><div class="lglbl"><b style="color:\'+K.col+\'">\'+K.type+\'</b></div></div>\'; return; }   // the node KIND — its actual icon glyph'''
assert OLD_KROW in text, "legend kind-row anchor missing"
NEW_KROW = '''      if(it.t==="hd"){ var _gs=(window.__uniGrpState&&__uniGrpState[it.l])||"all";   // group header = a MASTER (click cycles all→critical→off for the whole side)
        h+=\'<div class="lghd2 lggrp gs-\'+_gs+\'" data-lggrp="\'+it.l+\'" title="\'+it.l+\' — click: ALL -> CRITICAL -> OFF for every \'+it.l+\' kind"><span>\'+it.l+\'</span><span class="lggs">\'+_gs+\'</span></div>\'; return; }
      if(it.t==="kind"){ var K=KINDS[it.k];
        var _st=(window.__uniKindState&&__uniKindState[it.k])||(it.k==="type"?"off":"critical");
        var _hasCrit=(window.__uniKindHasSolo?__uniKindHasSolo(it.k):false);
        var _cls=(_st==="off")?"lgoff":((_st==="critical"&&_hasCrit)?"lgcrit":"");
        var _t=(_st==="off")?("hidden — click to show"+(_hasCrit?" critical":"")):((_st==="critical"&&_hasCrit)?"critical only (single-caller helpers hidden) — click to hide all":("showing"+(_hasCrit?" — click for critical only":" — click to hide")));
        h+=\'<div class="lgrow lgk \'+_cls+\'" data-lgk="\'+it.k+\'" title="\'+_t+\' · \'+K.type+\'"><div class="lgvis">\'+svgInline(it.k,K.col,17)+\'</div><div class="lglbl"><b style="color:\'+K.col+\'">\'+K.type+\'</b></div></div>\'; return; }   // the node KIND — a 3-STATE control (all · critical · off)'''
text = text.replace(OLD_KROW, NEW_KROW, 1)

OLD_LGBIND = """    [].forEach.call(el.querySelectorAll(".lgsub"), function(b){ b.onclick=function(){ _legSub=b.dataset.sub; render(); }; });"""
assert OLD_LGBIND in text, "legend binder anchor missing"
text = text.replace(OLD_LGBIND, OLD_LGBIND + """
    [].forEach.call(el.querySelectorAll("[data-lgk]"), function(rw){ rw.onclick=function(){ if(window.__uniKindToggle) __uniKindToggle(rw.dataset.lgk); }; });
    [].forEach.call(el.querySelectorAll("[data-lggrp]"), function(hd){ hd.style.cursor="pointer"; hd.onclick=function(){ if(window.__uniGroupToggle) __uniGroupToggle(hd.dataset.lggrp); }; });""", 1)

OLD_CWCALL = "connectorWire(connGroup, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z), REL2KIND[l.rel]||'calls', 8); });"
assert OLD_CWCALL in text, "connectorWire call anchor missing"
text = text.replace(OLD_CWCALL,
  "if(window.__uniRelHide&&__uniRelHide(l)&&!(HL.on&&HL.links&&HL.links.has(l))&&l!==window.__uniSelLink) return; connectorWire(connGroup, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z), REL2KIND[l.rel]||'calls', 8, (window._hlLinkF?_hlLinkF(l):1)); });\n  if(window.__uniDrawBundles) __uniDrawBundles(connGroup);", 1)

# batch 35 (after the hf call exists): thread the endpoint ENTITY colors into every wire
OLD_CALL2 = "connectorWire(connGroup, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z), REL2KIND[l.rel]||'calls', 8, (window._hlLinkF?_hlLinkF(l):1)); });"
assert OLD_CALL2 in text, "gradient call-site anchor missing"
text = text.replace(OLD_CALL2,
  "connectorWire(connGroup, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z), REL2KIND[l.rel]||'calls', 8, (window._hlLinkF?_hlLinkF(l):1), (_cs&&typeof ENT!==\"undefined\"&&ENT[_cs.ent])||null, (_ct&&typeof ENT!==\"undefined\"&&ENT[_ct.ent])||null); });", 1)

# ── batch 38: the SELECTED wire glows — its highlight factor is boosted ×2.6 (additive past 1) ──
OLD_WHF = "connectorWire(connGroup, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z), REL2KIND[l.rel]||'calls', 8, (window._hlLinkF?_hlLinkF(l):1), (_cs&&typeof ENT!==\"undefined\"&&ENT[_cs.ent])||null, (_ct&&typeof ENT!==\"undefined\"&&ENT[_ct.ent])||null); });"
assert OLD_WHF in text, "selected-wire glow anchor missing"
text = text.replace(OLD_WHF,
  "var _whf=(window._hlLinkF?_hlLinkF(l):1); if(window.__uniSelLink===l||window.__uniHovLink===l) _whf=Math.max(_whf,1)*2.6;\n    connectorWire(connGroup, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z), REL2KIND[l.rel]||'calls', 8, _whf, (_cs&&typeof ENT!==\"undefined\"&&ENT[_cs.ent])||null, (_ct&&typeof ENT!==\"undefined\"&&ENT[_ct.ent])||null, (window.__uniHovLink===l)); });", 1)
OLD_NVIS = '.nodeVisibility(function(n){ return !!visN(n).show; }).enableNodeDrag(false)'
assert OLD_NVIS in text, "nodeVisibility seam anchor missing"
text = text.replace(OLD_NVIS, '.nodeVisibility(function(n){ return _nodeVisibleFn(n); }).enableNodeDrag(false)', 1)
OLD_RBN = 'function rebuildNodes(){ PULSE=[]; ORBIT=[]; WAVE=[]; FLEETTICK=[]; if(Graph) Graph.nodeThreeObject(function(n){ return buildNode(n); }); }'
assert OLD_RBN in text, "rebuildNodes anchor missing"
text = text.replace(OLD_RBN, OLD_RBN, 1)  # halos live in their own scene group now — no reapply hook needed
OLD_TRV = 'var _sn=NIDS[lid(l.source)], _tn=NIDS[lid(l.target)], _sv=_sn?visN(_sn):_VISDEF, _tv=_tn?visN(_tn):_VISDEF;\n    if(!_sv.show||!_tv.show||!_sv.routes||!_tv.routes) return;'
assert OLD_TRV in text, "transports visibility anchor missing"
text = text.replace(OLD_TRV,
  'var _sn=NIDS[lid(l.source)], _tn=NIDS[lid(l.target)], _sv=_sn?visN(_sn):_VISDEF, _tv=_tn?visN(_tn):_VISDEF;\n'
  '    if((_sn&&!_nodeVisibleFn(_sn))||(_tn&&!_nodeVisibleFn(_tn))||!_sv.routes||!_tv.routes) return;\n'
  '    if(HL.on && HL.links && !HL.links.has(l)) return;   // a highlight owns the roads — shuttles fly the lit path only', 1)

# panel boot + master-dim sync on every config change
OLD_BOOTCFG = '\nbuildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg();\n'
assert OLD_BOOTCFG in text, "boot buildCfg anchor missing (batch-11 fleet boot)"
text = text.replace(OLD_BOOTCFG, '\nbuildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg(); if(window.__uniBuildFleet) __uniBuildFleet();\n', 1)
OLD_APPLYHEAD = 'function applyCfg(grp){ if(grp==="bubble"'
assert OLD_APPLYHEAD in text, "applyCfg head anchor missing"
text = text.replace(OLD_APPLYHEAD,
  'function applyCfg(grp){ if(window.__uniFleetSync) try{ __uniFleetSync(); }catch(e){} if(grp==="bubble"', 1)

# ── batch 13: WALK bar in the panel top · collapse chevron moves to a panel FOOTER · wires gate ·
#    chipList hover → white halo · the panel never resizes the graph (css) ──
OLD_PANEL = '''<div class="panel" id="panel">
  <div class="minbar"><button class="pmin" id="pexpand" title="element details">‹</button><div class="minname" id="prailname">details</div></div>
  <div class="phead" id="phead"></div>
  <div class="pbody" id="pbody"></div>
</div>'''
assert OLD_PANEL in text, "panel markup anchor missing"
text = text.replace(OLD_PANEL, '''<div class="panel" id="panel">
  <div class="minbar"><button class="pmin" id="pexpand" title="element details">‹</button><div class="minname" id="prailname">details</div></div>
  <div id="walkbar" style="display:none"></div>
  <div class="phead" id="phead"></div>
  <div class="pbody" id="pbody"></div>
  <div class="pfoot"><button class="pmin" title="minimize the panel to its rail" onclick="closePanel()">›</button></div>
</div>''', 1)
OLD_PHBTN = '''      +"<button class='pmin' title='minimize' onclick=\\"closePanel()\\">›</button>";'''
assert OLD_PHBTN in text, "phead chevron anchor missing"
text = text.replace(OLD_PHBTN, '      ;   // the collapse chevron lives in the panel FOOTER now (the walk bar owns the top)')   # BOTH copies (link panel + node panel)
OLD_UCGATE = 'if(!CFG.conns) return;'
assert OLD_UCGATE in text, "updateConnectors conns gate anchor missing"
text = text.replace(OLD_UCGATE, OLD_UCGATE, 1)  # gate unchanged — per-entity/cluster wires filtering happens per link in the seam
OLD_LV2 = 'if((s&&!visN(s).show)||(t&&!visN(t).show)) return false; return !CFG.conns; }'
assert OLD_LV2 in text, "linkVisFn anchor missing (wires gate)"
text = text.replace(OLD_LV2, 'if((s&&(!_nodeVisibleFn(s)||!visN(s).wires))||(t&&(!_nodeVisibleFn(t)||!visN(t).wires))) return false; return !CFG.conns; }', 1)
OLD_CHIP = 'var mk=function(x){ return E("span",{class:"pchip "+cls}, glyph?icoEl(glyph):null, x); };'
assert OLD_CHIP in text, "chipList mk anchor missing"
text = text.replace(OLD_CHIP,
  'var mk=function(x){ var t=(x&&x.t!==undefined)?x.t:x, el=E("span",{class:"pchip "+cls}, glyph?icoEl(glyph):null, t);\n'
  '      if(x&&x.id&&window.__uniHoverHL){ el.style.cursor="pointer"; el.title=(el.title?el.title+" · ":"")+"click to open (builds the 7-step trail)";\n'
  '        el.addEventListener("mouseenter",function(){ __uniHoverHL(x.id); });\n'
  '        el.addEventListener("mouseleave",function(){ __uniHoverHL(null); });\n'
  '        el.addEventListener("click",function(ev){ ev.stopPropagation(); if(window.__uniGoto) __uniGoto(x.id); }); }\n'
  '      return el; };', 1)

# batch 12: topbar wiring joins the boot chain (after the panel-boot replace creates the anchor)
OLD_BOOT2 = 'buildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg(); if(window.__uniBuildFleet) __uniBuildFleet();'
assert OLD_BOOT2 in text, "boot anchor missing (topbar wiring)"
text = text.replace(OLD_BOOT2, OLD_BOOT2 + ' if(window.__uniWireTopbar) __uniWireTopbar(); if(window.__uniBuildCtrl) __uniBuildCtrl(); setTimeout(function(){ if(window.__uniPanelAll) __uniPanelAll(); }, 0);', 1)

# CROSS-BOUNDARY STUBS (operator): draw outward stubs for wires whose far end is fleet-hidden,
# right after the bundle pass in updateConnectors. One targeted append on the final __uniDrawBundles line.
assert 'if(window.__uniDrawBundles) __uniDrawBundles(connGroup);' in text, "the __uniDrawBundles hook is missing — stub patch anchor gone"
text = text.replace('if(window.__uniDrawBundles) __uniDrawBundles(connGroup);',
  'if(window.__uniDrawBundles) __uniDrawBundles(connGroup); if(window.__uniDrawStubs) __uniDrawStubs(connGroup);', 1)

io.open(os.path.join(D,"gabe-universe.html"),"w",encoding="utf-8").write(text)
out = text.split("\n")
print("wrote gabe-universe.html:", len("\n".join(out)), "bytes,", len(out), "lines")
# sanity: markers present
t=rd("gabe-universe.html")
for m in ["Gabe Universe · {{PROJECT_NAME}}","window.GABE_C4","testsSec(det)","journeysSection","nav class=\"side\"",'src="./assets/3d-bundle.js"','var C={']:
    print(("  OK  " if m in t else " MISS "), m)
for m in ["var NODEDEF=","var cids=function","5C spike — kinds",'<div class="bar">']:
    print(("  STILL-PRESENT(bad) " if m in t else "  removed  "), m)
