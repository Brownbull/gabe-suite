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
REL2KIND = "var REL2KIND={ fk:'fk', pk:'fk', handler:'calls', touch:'calls', touches:'calls', resp:'calls', uses:'calls', calls:'calls', fetches:'bridge', bridge:'bridge', renders:'imports', mounts:'imports', reads:'imports', imports:'imports', typed:'imports' };"
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
  163: (163, '<script src="./assets/chip-assets.js"></script>\n<script src="./c4-graph.js"></script>\n<script src="./levels.js"></script>'),
  234: (282, adapter),              # toy data block -> live adapter
  588: (588, REL2KIND),
  946: (946, GLINE),
  949: (955, TRUSTCONNS),
  969: (1043, card),
}
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
  var g=document.getElementById("navgear"); if(g) g.classList.toggle("on", hidden); };
window.__uniNavToggle=function(){ document.body.classList.toggle("nav-min");
  setTimeout(function(){ try{ if(typeof resizeGraph==="function") resizeGraph(); }catch(e){} }, 220); };   // graph refills the reclaimed width after the slide
function connectorWire(grp, a, b, kind, R){ var cfg=CONN[kind]||CONN.calls;
  var _bm=(window.__uniBeam && window.__uniBeam[kind]!=null)?window.__uniBeam[kind]:1; if(!_bm) return;"""
assert "function connectorWire(grp, a, b, kind, R){ var cfg=CONN[kind]||CONN.calls;" in text, "connectorWire anchor missing"
text = text.replace("function connectorWire(grp, a, b, kind, R){ var cfg=CONN[kind]||CONN.calls;", CURVE_HELPERS, 1)

# ── batch 10: per-kind BEAM — opacity × beam (capped 1), additive blending past 1 so the wire glows ──
OLD_SOLID = 'mat=new T.LineBasicMaterial({color:cfg.color, transparent:true, opacity:cfg.trust});'
assert OLD_SOLID in text, "connector solid-material anchor missing"
text = text.replace(OLD_SOLID,
  'mat=new T.LineBasicMaterial({color:cfg.color, transparent:true, opacity:Math.min(1,cfg.trust*_bm), blending:(_bm>1?T.AdditiveBlending:T.NormalBlending)});', 1)
OLD_DASHM = 'mat=new T.LineDashedMaterial({color:cfg.color, transparent:true, opacity:cfg.trust, dashSize:base[0]/dn, gapSize:base[1]/dn});'
assert OLD_DASHM in text, "connector dashed-material anchor missing"
text = text.replace(OLD_DASHM,
  'mat=new T.LineDashedMaterial({color:cfg.color, transparent:true, opacity:Math.min(1,cfg.trust*_bm), blending:(_bm>1?T.AdditiveBlending:T.NormalBlending), dashSize:base[0]/dn, gapSize:base[1]/dn});', 1)
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

# ── review-2 fix: 'web' was missing from `order`, so no billboard icon was rasterized for web nodes →
#    they fell back to the purple `panel` PRIMITIVE (the pink cubes). Add it so web shows the screen glyph. ──
OLD_ORDER = 'var order=["route","component","hook","type","store","screen","endpoint","function","schema","model","external","entity"];'
assert OLD_ORDER in text, "order array anchor missing"
text = text.replace(OLD_ORDER, 'var order=["route","component","hook","type","store","screen","web","endpoint","function","schema","model","external","entity"];', 1)

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
assert 'var CFG={ shape:"polygon", subOn:true, entOn:true,' in text, "CFG anchor missing"
text = text.replace('var CFG={ shape:"polygon", subOn:true, entOn:true,',
                    'var CFG={ shape:"polygon", entLayout:"force", coreBy:"layer", lineStyle:"straight", showFns:"off", subOn:true, entOn:true,', 1)
OLD_APPLY = 'else if(grp==="transports"){ buildTransports(); } else { buildClusters(); updateClusters(true); } }'
assert OLD_APPLY in text, "applyCfg anchor missing"
text = text.replace(OLD_APPLY,
  'else if(grp==="transports"){ buildTransports(); } '
  'else if(grp==="entLayout"){ __uniFreezeForSettle(); recomputeEX(CFG.entLayout); recomputeSubAnchors(); if(Graph){ try{ Graph.d3ReheatSimulation(); }catch(e){} } buildClusters(); updateClusters(true); } '
  'else if(grp==="coreBy"){ __uniFreezeForSettle(); assignSub(CFG.coreBy); recomputeSubAnchors(); if(Graph){ try{ Graph.d3ReheatSimulation(); }catch(e){} } buildClusters(); updateClusters(true); } '
  'else if(grp==="lineStyle"){ __uniSetCurve(CFG.lineStyle==="curved"); } '
  'else if(grp==="showFns"){ toggleFns(CFG.showFns==="on"); } '
  'else { buildClusters(); updateClusters(true); } }', 1)
assert 'preloadBillboards(function(){ build();' in text, "boot anchor missing"
text = text.replace('preloadBillboards(function(){ build();',
                    'preloadBillboards(function(){ try{ recomputeEX(CFG.entLayout); recomputeSubAnchors(); }catch(e){} build(); try{ __uniSetupOrbit(); }catch(e){}', 1)
assert '\nbuildCfg();\n' in text, "boot buildCfg anchor missing"
text = text.replace('\nbuildCfg();\n', '\nbuildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab();\n', 1)

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

# ── batch 10 (review r2): BOTH bare buildCfg() call sites rebuild the FLAT panel and drop the tabs —
#    re-tab after each (the .cfgtabbar guard makes __uniAddLayoutTab idempotent, state read from CFG) ──
OLD_PRESET = 'if(changed && document.getElementById("cfg")) buildCfg(); })();'
assert OLD_PRESET in text, "URL-preset buildCfg anchor missing"
text = text.replace(OLD_PRESET,
  'if(changed && document.getElementById("cfg")){ buildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); } })();', 1)
OLD_DRIVE = 'CFG.shape=window.__drive; CFG.subOn=true; CFG.entOn=true; buildCfg(); buildClusters(); updateClusters(true); }'
assert OLD_DRIVE in text, "?drive buildCfg anchor missing"
text = text.replace(OLD_DRIVE,
  'CFG.shape=window.__drive; CFG.subOn=true; CFG.entOn=true; buildCfg(); if(window.__uniAddLayoutTab) __uniAddLayoutTab(); buildClusters(); updateClusters(true); }', 1)

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
text = text.replace('warOn:true, warDist', 'warOn:false, warDist', 1)

# ── batch 6 PERF: throttle the per-tick connector rebuild (the 227+ geometry churn) during settle;
#    a forced call (onEngineStop / control change) still rebuilds fully, so the settled frame is exact ──
assert '}); updateConnectors(); }' in text, "updateClusters connector-call anchor missing"
text = text.replace('}); updateConnectors(); }', '}); if(force || _wtick%3===0) updateConnectors(); }', 1)

io.open(os.path.join(D,"gabe-universe.html"),"w",encoding="utf-8").write(text)
out = text.split("\n")
print("wrote gabe-universe.html:", len("\n".join(out)), "bytes,", len(out), "lines")
# sanity: markers present
t=rd("gabe-universe.html")
for m in ["Gabe Universe · {{PROJECT_NAME}}","window.GABE_C4","testsSec(det)","journeysSection","nav class=\"side\"",'src="./assets/3d-bundle.js"','var C={']:
    print(("  OK  " if m in t else " MISS "), m)
for m in ["var NODEDEF=","var cids=function","5C spike — kinds",'<div class="bar">']:
    print(("  STILL-PRESENT(bad) " if m in t else "  removed  "), m)
