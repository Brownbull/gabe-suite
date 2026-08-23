/* ══ BATCH 2 — entity LAYOUT (chain/force/spread) + cluster CORE (layer/kind/tests), ported to 3D ══
   The 2D Levels graph positions entity anchors on an {x,y} plane; here every anchor gets a z too and
   the node sim (zForce) pulls each node to its entity's 3D anchor. Chain keeps the flat layer→Y banding;
   Force/Spread give entities distinct 3D positions → the clustered "bubbles" the 2D shows. */
var __chainMode=true;   // chain = layer-banded flat view; force/spread = 3D entity anchors
function _l1pairs(){ var out=[]; ((_C4.l1&&_C4.l1.edges)||[]).forEach(function(e){
  if(_ents.indexOf(e.source)>=0 && _ents.indexOf(e.target)>=0){
    var w=0, ks=e.kinds||{}; for(var k in ks) w+=ks[k]; out.push([e.source,e.target,w]); } }); return out; }
function recomputeEX(mode){ var n=_ents.length; if(!n) return;
  if(mode==="chain"){                                   // greedy coupling-ordered line; nodes keep layer→Y
    __chainMode=true;
    var W={}, deg={}; _ents.forEach(function(s){ deg[s]=0; });
    _l1pairs().forEach(function(p){ var key=p[0]<p[1]?p[0]+"|"+p[1]:p[1]+"|"+p[0]; W[key]=(W[key]||0)+p[2]; deg[p[0]]+=p[2]; deg[p[1]]+=p[2]; });
    var wOf=function(a,b){ return W[a<b?a+"|"+b:b+"|"+a]||0; };
    var left=_ents.slice().sort(function(a,b){ return deg[b]-deg[a]||(a<b?-1:1); });
    var order=[left.shift()];
    while(left.length){ var last=order[order.length-1], best=-1, bi=0;
      left.forEach(function(s,i){ var w=wOf(last,s); if(w>best){ best=w; bi=i; } }); order.push(left.splice(bi,1)[0]); }
    order.forEach(function(e,i){ EX[e]=n<=1?0:(-550+i*(1100/(n-1))); EY[e]=0; EZ[e]=0; });   // 1100 span — entity columns clear of each other
    return;
  }
  __chainMode=false;
  var P={}, V={};                                        // seed on a deterministic Fibonacci sphere
  _ents.forEach(function(s,i){ var y=(n<=1)?0:(1-(i/(n-1))*2), r=Math.sqrt(Math.max(0,1-y*y)), th=i*2.399963;
    P[s]={x:Math.cos(th)*r*300, y:y*300, z:Math.sin(th)*r*300}; V[s]={x:0,y:0,z:0}; });
  if(mode==="ring"){                                     // coupling-ordered CIRCLE — even spacing, separation by construction
    var W2={}, deg2={}; _ents.forEach(function(s){ deg2[s]=0; });
    _l1pairs().forEach(function(pp){ var key=pp[0]<pp[1]?pp[0]+"|"+pp[1]:pp[1]+"|"+pp[0]; W2[key]=(W2[key]||0)+pp[2]; deg2[pp[0]]+=pp[2]; deg2[pp[1]]+=pp[2]; });
    var wOf2=function(a,b){ return W2[a<b?a+"|"+b:b+"|"+a]||0; };
    var left2=_ents.slice().sort(function(a,b){ return deg2[b]-deg2[a]||(a<b?-1:1); });
    var ord=[left2.shift()];
    while(left2.length){ var last2=ord[ord.length-1], best2=-1, bi2=0;
      left2.forEach(function(s,i){ var w=wOf2(last2,s); if(w>best2){ best2=w; bi2=i; } }); ord.push(left2.splice(bi2,1)[0]); }
    var cnt2={}; nodes.forEach(function(nn){ cnt2[nn.ent]=(cnt2[nn.ent]||0)+1; });
    var circ=0; _ents.forEach(function(s){ circ += 2.8*(30+9*Math.sqrt(cnt2[s]||0)); });   // per-entity arc ≈ 2.8× its nominal radius
    var R=Math.max(430, circ/(2*Math.PI));
    ord.forEach(function(e,i){ var a=i*2*Math.PI/n; P[e]={x:Math.cos(a)*R, y:0, z:Math.sin(a)*R}; });
  } else {                                               // FORCE — repulsion 13000/d² + FK spring rest 230
    var E2=_l1pairs();
    for(var it=0; it<240; it++){
      for(var i=0;i<n;i++) for(var j=i+1;j<n;j++){ var a=_ents[i], b=_ents[j],
        dx=P[a].x-P[b].x, dy=P[a].y-P[b].y, dz=P[a].z-P[b].z, d2=dx*dx+dy*dy+dz*dz+60, d=Math.sqrt(d2), f=13000/d2;
        V[a].x+=dx/d*f; V[a].y+=dy/d*f; V[a].z+=dz/d*f; V[b].x-=dx/d*f; V[b].y-=dy/d*f; V[b].z-=dz/d*f; }
      E2.forEach(function(p){ var a=p[0], b=p[1], dx=P[b].x-P[a].x, dy=P[b].y-P[a].y, dz=P[b].z-P[a].z,
        d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1, f=0.02*(d-230);
        V[a].x+=dx/d*f; V[a].y+=dy/d*f; V[a].z+=dz/d*f; V[b].x-=dx/d*f; V[b].y-=dy/d*f; V[b].z-=dz/d*f; });
      _ents.forEach(function(s){ V[s].x=(V[s].x-P[s].x*0.003)*0.9; V[s].y=(V[s].y-P[s].y*0.003)*0.9; V[s].z=(V[s].z-P[s].z*0.003)*0.9;
        P[s].x+=V[s].x; P[s].y+=V[s].y; P[s].z+=V[s].z; }); }
  }
  var SEP=(mode==="ring")?1.0:1.85;   // force converges tight — widen hard; the ring is already sized by construction
  _ents.forEach(function(s){ EX[s]=Math.round(P[s].x*SEP); EY[s]=Math.round(P[s].y*SEP); EZ[s]=Math.round(P[s].z*SEP); });
}
/* ── batch 9 CLUSTERING — the core drives POSITION, not just hull decoration ──
   SUBANCHOR[ent][sub] = local offset from the entity anchor per sub-group, laid on a ring
   (deterministic: groups sorted by size then name, phase staggered per entity). RENT[ent] =
   the entity's nominal cluster radius — drives the per-kind radial bias + soft containment. */
function recomputeSubAnchors(){
  var cnt={}, subs={};
  nodes.forEach(function(n){ cnt[n.ent]=(cnt[n.ent]||0)+1;
    (subs[n.ent]=subs[n.ent]||{})[n.sub]=(subs[n.ent][n.sub]||0)+1; });
  RENT={}; SUBANCHOR={};
  _ents.forEach(function(e,ei){ var c=cnt[e]||0; RENT[e]=30+9*Math.sqrt(c);
    var g=subs[e]||{}, ks=Object.keys(g).sort(function(a,b){ return (g[b]-g[a])||(a<b?-1:1); });
    var m={}; SUBANCHOR[e]=m;
    if(ks.length<2){ ks.forEach(function(k){ m[k]={x:0,y:0,z:0}; }); return; }   // one group (incl. the honest "other") → centered, no ring
    var SR=Math.min(RENT[e]*0.78, 34+9*ks.length);   // clusters inside an entity sit farther apart (operator: more spread, incl. force)
    ks.forEach(function(k,i){ var a=ei*0.7 + i*(Math.PI*2/ks.length);            // per-entity phase stagger — rings don't all align
      m[k]={ x:Math.cos(a)*SR, y:__chainMode?0:(((i%2)?1:-1)*SR*0.22), z:Math.sin(a)*SR }; }); });
}
if(window.GABE_LEVELS && window.GABE_LEVELS.pieces) CFG.coreBy="community";   // the operator's default lens — layer only when no levels feed
/* cluster core — rewrite n.sub (the sub-cluster grouping key). Decoration only (nodes don't move).
   layer/kind/tests are c4-native; usecase/community/fk join GABE_LEVELS group maps by NAME
   (endpoints by "METHOD /path" = eps; models/schemas by class name = cls). Honest "other" bucket. */
var _LMAP=null;
function _levelsGroupMap(){ var D=window.GABE_LEVELS; if(!D||!D.pieces) return null;
  var out={usecase:{}, community:{}, fk:{}, guards:{}};
  nodes.forEach(function(n){ var pc=D.pieces[n.ent]; if(!pc) return; var nm=n.label;
    var uc=pc.usecases||{}; Object.keys(uc).some(function(gp){ var v=uc[gp]||{};
      if((v.cls||[]).indexOf(nm)>=0 || (v.eps||[]).indexOf(nm)>=0){ out.usecase[n.id]=gp; return true; } return false; });
    var cm=pc.communities||{}; Object.keys(cm).some(function(gp){ if((cm[gp]||[]).indexOf(nm)>=0){ out.community[n.id]=gp; return true; } return false; });
    var fk=pc.fk_communities||{}; Object.keys(fk).some(function(gp){ if((fk[gp]||[]).indexOf(nm)>=0){ out.fk[n.id]=gp; return true; } return false; });
    if(n.kind==="endpoint"){ var pp=(nm||"").split(" "), mth=pp[0], pth=pp.slice(1).join(" ");   // GUARDS from pieces[ent].endpoints[].guards, joined by method+path
      var ep=(pc.endpoints||[]).filter(function(e){ return e.m===mth && e.p===pth; })[0];
      if(ep) out.guards[n.id]=((ep.guards||0)>0)?"guarded":"unguarded"; }
  }); return out; }
function assignSub(mode){
  if(mode==="usecase"||mode==="community"||mode==="fk"){
    if(!_LMAP) _LMAP=_levelsGroupMap();
    var m=(_LMAP&&_LMAP[mode])||{};
    nodes.forEach(function(n){ n.sub=m[n.id]||"other"; }); return; }
  if(mode==="guards"){ if(!_LMAP) _LMAP=_levelsGroupMap(); var gm=(_LMAP&&_LMAP.guards)||{};
    nodes.forEach(function(n){ n.sub=(n.kind==="function")?"functions":(gm[n.id]||(n.kind==="endpoint"?"unguarded":"other")); }); return; }
  nodes.forEach(function(n){
    if(mode==="kind") n.sub=n.kind;
    else if(mode==="tests") n.sub=((n.m&&n.m.tests)>0)?"tested":"untested";
    else n.sub=n.layer||"data"; }); }   // ruling (c): group by the kind's OWN layer — endpoints · api · web · data today, auto-grows with new kinds

/* ── FUNCTIONS layer (from GABE_LEVELS.fn_nodes + fn_edges) — toggled in/out of the graph ── */
var _FNNODES=null, _FNLINKS=null, _fnsOn=false;
function _buildFnData(){ var D=window.GABE_LEVELS; if(!D||!D.fn_nodes||!KINDS["function"]){ _FNNODES=[]; _FNLINKS=[]; return; }
  _FNNODES=D.fn_nodes.map(function(f){ var beh=f.behind||{};
    return { id:f.id, kind:"function", ent:f.slug, label:f.name, col:KINDS["function"].col, K:KINDS["function"],
      layer:KINDS["function"].layer, sub:KINDS["function"].layer||"data", __fn:true,
      m:{ behind:_num(beh.fns), depth:_num(beh.depth), tests:0, cols:0, fanin:_num(f.hub&&f.hub.usage), god:!!f.god, method:null },
      det:{ file:(f.id||"").split("#")[0], doc:"" }, behind:beh }; });
  _FNLINKS=(D.fn_edges||[]).map(function(e){ return {source:e.s, target:e.t, rel:e.rel||"calls"}; });
}
function toggleFns(on){ _fnsOn=on; if(!_FNNODES) _buildFnData(); if(!_FNNODES) return;
  __uniFreezeForSettle();                                  // functions in/out reheats — decorations pause until the settle
  if(on){
    _FNNODES.forEach(function(n,i){ if(!NIDS[n.id]){                       // seed on a golden-angle spiral around the entity anchor —
      var a=i*2.399963, rr=8+i*0.35;                                       // UNIQUE per i (no two coincide → no divide-by-zero → no NaN frame)
      n.x=(EX[n.ent]||0)+Math.cos(a)*rr; n.y=(EY[n.ent]||0)+Math.sin(a)*rr; n.z=(EZ[n.ent]||0)+((i%23)-11);
      nodes.push(n); NIDS[n.id]=n; } });
    _FNLINKS.forEach(function(fl){ if(NIDS[fl.source]&&NIDS[fl.target]&&fl.source!==fl.target){
      var mm=LINKMETA[fl.rel]||{w:2,pv:1}; links.push({source:fl.source,target:fl.target,rel:fl.rel,w:mm.w,proven:!!mm.pv,payload:0,__fn:true}); } });
  } else {
    for(var i=links.length-1;i>=0;i--){ if(links[i].__fn) links.splice(i,1); }
    for(var j=nodes.length-1;j>=0;j--){ if(nodes[j].__fn){ delete NIDS[nodes[j].id]; nodes.splice(j,1); } }
  }
  links.forEach(function(l){ l.source=lid(l.source); l.target=lid(l.target); });   // normalize to string ids before re-seed
  if(typeof Graph!=="undefined" && Graph){ try{ Graph.graphData({nodes:nodes, links:links}); Graph.d3ReheatSimulation(); }catch(e){} }
  try{ assignSub(CFG.coreBy); recomputeSubAnchors(); buildClusters(); updateClusters(true); }catch(e){}   // fn nodes change group sizes → re-ring
  if(window.__uniFleetRegroup) try{ __uniFleetRegroup(); }catch(e){}   // fn nodes add/remove sub groups → the panel re-derives
}
/* LINES — moved off the topbar into the config; sets the curved-connector flag + redraws */
function __uniSetCurve(on){ window.__uniCurved=!!on; try{ updateConnectors(); }catch(e){} }
window.__uniCurveAmt=0.6;                                 // curve-amount slider → arc height multiplier (operator default 0.6)
window.__uniCurved=true;                                  // lines default CURVED (operator config)
window.__uniBeam={ fk:0.9, bridge:0.8, calls:0.8, imports:1 };  // per-kind wire glow (operator defaults) — 0 hides, >1 glows; read by connectorWire
/* ONE style→svg-dasharray map — the Routes row samples AND the legend rows render from it,
   so a sample can never lie (CSS border-style cannot draw "sparse"; SVG dasharray draws all four). */
var DASHMAP={ solid:"", dashed:"6 3", dotted:"1.5 3.5", sparse:"5 10" };
var CONN0=null;                                           // boot snapshot of CONN color/style → per-row reset
/* freeze ALL animations while a layout / core / functions change re-arranges the graph; the engine's
   settle (onEngineStop) resumes them — only if THIS freeze paused them. Ownership rules (review r2):
   a motionBtn click DURING the window takes ownership (clears the flag — no stale auto-resume), and a
   settle landing MID-DRAG defers to pointerup (freeze-on-drag keeps the drag smooth to its end). */
var _settleFroze=false; window.__uniDragging=false;
function __uniFreezeForSettle(){ if(!ANIM.all) return; _settleFroze=true; ANIM.all=false;
  var mb=document.getElementById("motionBtn"); if(mb){ mb.textContent="▶"; mb.classList.add("on"); } }
window.__uniSettleCancel=function(){ _settleFroze=false; };   // manual motion toggle owns the state from here on
window.__uniSettleDone=function(){ if(!_settleFroze) return; if(window.__uniDragging) return;
  _settleFroze=false; ANIM.all=true;
  var mb=document.getElementById("motionBtn"); if(mb){ mb.textContent="⏸"; mb.classList.remove("on"); } };
/* topbar toggle: pause animations while the camera is being dragged (resume on release) */
window.__uniToggleFreezeDrag=function(btn){ ANIM.freezeOnDrag=!ANIM.freezeOnDrag; if(btn) btn.classList.toggle("on", ANIM.freezeOnDrag); };

/* ORBIT AROUND THE CLICK POINT — on left pointerdown (the drag START, not a click), raycast the cursor
   onto the plane through the current pivot and move BOTH target and camera by the same offset. The view is
   unchanged (camera↔target relationship preserved), but the drag that follows now orbits the clicked point. */
var _dragWasPlaying=false;
/* ORBIT AROUND THE CLICK POINT — take over the left-drag and rotate the camera RIG (camera + look-target)
   rigidly around the clicked point P. Because the rotation FIXES P, it stays put on screen and the distance
   to it is constant → no reposition, no zoom drift. OrbitControls is disabled during the drag (its scroll-zoom
   + right-drag pan are untouched) and re-synced on release. */
function _rotRig(cam, target, P, axis, ang){ if(!ang) return; var q=new T.Quaternion().setFromAxisAngle(axis, ang);
  cam.position.sub(P).applyQuaternion(q).add(P);   // rotate the camera RIG (position + orientation) rigidly about P
  target.sub(P).applyQuaternion(q).add(P);         // → P is the fixed point: stays put on screen, distance constant
  cam.quaternion.premultiply(q); }
window.UNICTL={ invert:false, selPivot:true, camMode:"look" };   // LEFT-drag scheme (look default, vertical inverted by convention); RIGHT=tumble · MIDDLE=pan
/* the CURRENT-ZOOM depth: the nearest visible content ahead (a ~24° cone), never beyond the
   dolly target. Flying close then dragging orbits a NEAR pivot — the giant-sphere feel.
   TOP-LEVEL on purpose: the drag starter AND the Q/E fly tick both call it. */
function _zoomDist(){ try{ var cam=Graph.camera(), ctrls=Graph.controls();
    var vd=new T.Vector3(); cam.getWorldDirection(vd); var cp=cam.position, best=1e9;
    nodes.forEach(function(n){ if(n.x==null||!_nodeVisibleFn(n)) return;
      var dx=n.x-cp.x, dy=n.y-cp.y, dz=n.z-cp.z;
      var along=dx*vd.x+dy*vd.y+dz*vd.z; if(along<40) return;
      var off2=(dx*dx+dy*dy+dz*dz)-along*along;
      if(off2 < (along*0.45)*(along*0.45) && along<best) best=along; });
    var td=cp.distanceTo(ctrls.target);
    return Math.max(70, Math.min(best===1e9?td:best, td)); }catch(e){ return 400; } }
/* ── background click → the CLUSTER under the cursor (batch 22): hull meshes are raycast-dead by
   design (addObj), so the pick is ray-vs-member-cloud — sub hulls beat entity shells, smaller beats bigger ── */
function _raySegDist(ray, A, B){ var u=ray.direction, v=B.clone().sub(A), w=ray.origin.clone().sub(A);
  var a=u.dot(u), b=u.dot(v), c=v.dot(v), d=u.dot(w), e=v.dot(w), D=a*c-b*b, sc, tc;
  if(D<1e-8){ sc=0; tc=(b>c?d/b:e/c); } else { sc=(b*e-c*d)/D; tc=(a*e-b*d)/D; }
  sc=Math.max(0,sc); tc=Math.max(0,Math.min(1,tc));
  var Pr=ray.origin.clone().addScaledVector(u,sc), Ps=A.clone().addScaledVector(v,tc);
  return Pr.distanceTo(Ps); }
window.__uniBgClick=function(ev){ try{ if(!ev || ev.clientX==null) return;
    var g=document.getElementById("g"), r=g.getBoundingClientRect();
    var mx=((ev.clientX-r.left)/r.width)*2-1, my=-((ev.clientY-r.top)/r.height)*2+1;
    var rc=new T.Raycaster(); rc.setFromCamera({x:mx,y:my}, Graph.camera());
    /* WIRES pick first (the lab could click edges — so can we): nearest visible link within
       a small ray distance opens the CONNECTION panel; the curve bows are shallow at 0.6 so
       the straight chord is an honest approximation of the drawn wire. */
    var wbest=null, WTH=6;
    if(typeof links!=="undefined" && typeof _npos!=="undefined"){
      links.forEach(function(l){ var a=_npos[lid(l.source)], b=_npos[lid(l.target)]; if(!a||!b) return;
        var _s=NIDS[lid(l.source)], _t=NIDS[lid(l.target)];
        if((_s&&(!_nodeVisibleFn(_s)||!visN(_s).wires))||(_t&&(!_nodeVisibleFn(_t)||!visN(_t).wires))) return;
        var dd=_raySegDist(rc.ray, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z));
        if(dd<WTH && (!wbest||dd<wbest.d)) wbest={d:dd, l:l}; }); }
    if(wbest){ window.__uniSelLink=wbest.l;                                  // the picked wire GLOWS (hf boost in updateConnectors)
      if(window.__uniHLSelectLink) __uniHLSelectLink(wbest.l);
      try{ showLinkPanel(wbest.l); }catch(e2){} try{ updateConnectors(); }catch(e3){} return; }
    var best=null;
    (typeof CLUSTERS!=="undefined"?CLUSTERS:[]).forEach(function(c){ if(!c.ekey) return;
      var ms=c.members.map(function(id){ var n=NIDS[id]; return (n&&n.x!=null)?n:null; }).filter(Boolean);
      if(!ms.length) return;
      var cx=0,cy=0,cz=0; ms.forEach(function(pt){cx+=pt.x;cy+=pt.y;cz+=pt.z;}); cx/=ms.length; cy/=ms.length; cz/=ms.length;
      var rad=0; ms.forEach(function(pt){ rad=Math.max(rad, Math.hypot(pt.x-cx,pt.y-cy,pt.z-cz)); }); rad+=(c.pad||10)+14;
      var C0=new T.Vector3(cx,cy,cz);
      if(rc.ray.distanceToPoint(C0)>rad) return;
      if(C0.clone().sub(rc.ray.origin).dot(rc.ray.direction)<0) return;      // behind the camera
      var score=(c.level==="sub"?0:1)*1e6 + rad;
      if(!best || score<best.score) best={score:score, c:c}; });
    if(!best) return;
    if(best.c.level==="sub" && window.__uniPanelClu) __uniPanelClu(best.c.ekey, best.c.skey);
    else if(window.__uniPanelEnt) __uniPanelEnt(best.c.ekey);
  }catch(e){} };
function __uniSetupOrbit(){ var g=document.getElementById("g"); if(!g || g.__orbitBound) return; g.__orbitBound=true; var drag=null;
  try{ Graph.onBackgroundClick(window.__uniBgClick); }catch(e){}   // empty-space clicks pick the hull under the cursor
  /* the rig-drag starter — every button routes through here (LEFT=the chosen scheme ·
     RIGHT=tumble · MIDDLE=pan); the starter raycasts the pivot P at the zoom depth and
     snaps the dolly target on-axis so the wheel keeps agreeing with the drag. */
  function _rigStart(cx, cy){ try{ var cam=Graph.camera(), ctrls=Graph.controls(); if(!cam||!ctrls||!ctrls.target) return null;
      var r=g.getBoundingClientRect(), mx=((cx-r.left)/r.width)*2-1, my=-((cy-r.top)/r.height)*2+1;
      var rc=new T.Raycaster(); rc.setFromCamera({x:mx,y:my}, cam);
      var vdir=new T.Vector3(); cam.getWorldDirection(vdir);
      var zd=_zoomDist();                                        // pivot depth = the CURRENT zoom, not the stale dolly target
      var pp=new T.Vector3().copy(cam.position).addScaledVector(vdir, zd);
      var plane=new T.Plane().setFromNormalAndCoplanarPoint(vdir, pp), P=new T.Vector3();
      if(!rc.ray.intersectPlane(plane, P)) return null;
      ctrls.target.copy(pp);                                     // scroll-dolly now zooms toward what you orbit (on-axis → no view snap)
      ctrls.enabled=false; window.__uniDragging=true;
      if(ANIM.freezeOnDrag && ANIM.all){ _dragWasPlaying=true; ANIM.all=false; }
      return { P:P, lx:cx, ly:cy, ax:cx, ay:cy }; }catch(e){ return null; } }   // ax/ay = the CLICK ANCHOR (the joystick scheme's still point)
  function _rigStartP(P){ try{ var ctrls=Graph.controls(); if(!ctrls) return null;
      ctrls.enabled=false; window.__uniDragging=true;
      if(ANIM.freezeOnDrag && ANIM.all){ _dragWasPlaying=true; ANIM.all=false; }
      return { P:new T.Vector3(P.x,P.y,P.z), lx:0, ly:0 }; }catch(e){ return null; } }
  g.addEventListener("pointerdown", function(ev){
    if(drag) return;                                             // first button OWNS the drag; extras are ignored
    if(ev.button===1){ ev.preventDefault();                      // MIDDLE = PAN (drag the graph, no rotation; no browser autoscroll)
      drag=_rigStart(ev.clientX, ev.clientY); if(drag) drag.btn=1; return; }
    if(ev.button===2){                                           // RIGHT = TUMBLE — orbits the SELECTED planet when toggled, else the zoom-depth pivot
      if(UNICTL.selPivot && typeof SEL!=="undefined" && SEL && SEL.kind==="node" && SEL.data && SEL.data.x!=null){
        drag=_rigStartP(SEL.data); if(drag){ drag.lx=ev.clientX; drag.ly=ev.clientY; drag.btn=2; } return; }
      drag=_rigStart(ev.clientX, ev.clientY); if(drag) drag.btn=2; return; }
    if(ev.button!==0) return;                                    // LEFT = the dropdown's scheme (look by default)
    drag=_rigStart(ev.clientX, ev.clientY); if(drag) drag.btn=0; }, true);
  g.addEventListener("contextmenu", function(e){ e.preventDefault(); });   // right button is the TUMBLE drag, never the menu
  window.addEventListener("pointermove", function(ev){
    if(!drag) return;
    var _bit=(drag.btn===1)?4:(drag.btn===2)?2:1;
    if((ev.buttons&_bit)===0){ _endDrag(); return; }             // the OWNING button vanished mid-chord (no pointerup fires for it) → clean release
    try{ var cam=Graph.camera(), ctrls=Graph.controls();
      var dx=ev.clientX-drag.lx, dy=ev.clientY-drag.ly; drag.lx=ev.clientX; drag.ly=ev.clientY;
      if(drag.btn===1){                                                     // MIDDLE = PAN: translate the whole rig, orientation untouched
        var kd=cam.position.distanceTo(ctrls.target)*0.0011;
        var rt=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion).multiplyScalar(-dx*kd);
        var upv=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion).multiplyScalar(dy*kd);
        var off=rt.add(upv); cam.position.add(off); ctrls.target.add(off); drag.P.add(off); return; }
      var mode=(drag.btn===2)?"tumble":(UNICTL.camMode||"look");             // RIGHT always tumbles; LEFT follows the dropdown
      if(mode==="joystick"){ drag.cx=ev.clientX; drag.cy=ev.clientY; return; }   // offset-from-anchor drives a per-frame velocity (the tick below)
      var up=new T.Vector3(0,1,0);
      var right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion).normalize();    // the camera's own right axis (from its orientation)
      var vdir=new T.Vector3().subVectors(cam.position, ctrls.target).normalize();
      var vs=(UNICTL.invert?1:-1)*0.006;                                             // flight-style invert flips ONLY the vertical axis
      if(mode==="arcball"){                                                  // virtual trackball: great-circle between the two cursor points
        var gr=g.getBoundingClientRect();
        var sph=function(px,py){ var R2=Math.min(gr.width,gr.height)/2;
          var x=(px-gr.left-gr.width/2)/R2, y=-(py-gr.top-gr.height/2)/R2;
          var d2=x*x+y*y, z=d2<1?Math.sqrt(1-d2):0; var v=new T.Vector3(x,y,z);
          return v.lengthSq()>0?v.normalize():new T.Vector3(0,0,1); };
        var v0=sph(ev.clientX-dx, ev.clientY-dy), v1=sph(ev.clientX, ev.clientY);
        var axb=new T.Vector3().crossVectors(v1, v0);
        if(axb.lengthSq()>1e-9){ var angb=Math.acos(Math.max(-1,Math.min(1,v0.dot(v1))));
          axb.normalize().applyQuaternion(cam.quaternion);                   // camera-space axis → world
          _rotRig(cam, ctrls.target, drag.P, axb, angb); } return; }
      if(mode==="look"){                                                     // first-person: turn IN PLACE (the camera is the fixed point);
        var eye=cam.position.clone();                                        // vertical INVERTED by default (operator ruling; ctlInv flips it back)
        _rotRig(cam, ctrls.target, eye, up, -dx*0.004);
        var vd2=new T.Vector3().subVectors(ctrls.target, cam.position).normalize();
        var nd2=vd2.clone().applyAxisAngle(right, vs*dy*0.66);
        if(Math.abs(nd2.y)<0.985) _rotRig(cam, ctrls.target, eye, right, vs*dy*0.66); return; }
      _rotRig(cam, ctrls.target, drag.P, up, -dx*0.006);                             // TUMBLE (stock): azimuth around world-up through P
      var nd=vdir.clone().applyAxisAngle(right, vs*dy);                                // polar around camera-right (clamp near vertical to avoid a flip)
      if(Math.abs(nd.y)<0.985) _rotRig(cam, ctrls.target, drag.P, right, vs*dy);
    }catch(e){} });
  setInterval(function(){                                                    // JOYSTICK tick: offset from the CLICK ANCHOR = angular velocity —
    try{ if(!drag || drag.btn!==0 || (UNICTL.camMode||"look")!=="joystick" || drag.cx==null) return;   // LEFT only; hold farther = turn faster (the WoW feel)
      var ox=drag.cx-drag.ax, oy=drag.cy-drag.ay;
      if(Math.abs(ox)<8) ox=0; if(Math.abs(oy)<8) oy=0; if(!ox&&!oy) return; // a small deadzone around the anchor
      var cam=Graph.camera(), ctrls=Graph.controls();
      var up=new T.Vector3(0,1,0), right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion).normalize();
      var vs=(UNICTL.invert?1:-1)*0.00035;
      _rotRig(cam, ctrls.target, drag.P, up, -ox*0.00035);
      var vdir=new T.Vector3().subVectors(cam.position, ctrls.target).normalize();
      var nd=vdir.clone().applyAxisAngle(right, vs*oy);
      if(Math.abs(nd.y)<0.985) _rotRig(cam, ctrls.target, drag.P, right, vs*oy);
    }catch(e){} }, 16);
  function _endDrag(){                                           // the ONE release path — pointerup and the mid-chord owner-loss both land here
    if(drag){ var ctrls=Graph.controls(); drag=null; window.__uniDragging=false; if(ctrls){ ctrls.enabled=true; try{ ctrls.update(); }catch(e){} } }
    if(_dragWasPlaying){ _dragWasPlaying=false; ANIM.all=true; var mb=document.getElementById("motionBtn"); if(mb){ mb.textContent="⏸"; mb.classList.remove("on"); } }
    if(window.__uniSettleDone) window.__uniSettleDone(); }       // release a resume the settle deferred mid-drag (no-op otherwise)
  window.addEventListener("pointerup", function(ev){
    if(drag && ev.buttons!==0) return;                           // buttons remain → the drag survives; the LAST release always ends it
    _endDrag(); });                                              // (chorded mid-releases fire no pointerup per spec — the move recheck below covers them)
  window.addEventListener("contextmenu", function(e){ if(drag||window.__uniDragging) e.preventDefault(); });   // right-release over an overlay/off-canvas: no native menu mid-gesture
}

/* THE MESH-MAKER (measured: bleed 43%, nodes at r≈240 vs a ~105 containment radius): the default
   d3 link springs pull EVERY edge to rest≈30, dragging linked entities onto each other. Typed rest
   lengths fix the physics at the source: intra-entity 40 · cross-entity 280 (≈ the anchor spacing). */
function tuneLinkForce(){ if(typeof Graph==="undefined"||!Graph) return;
  var lf=Graph.d3Force("link"); if(!lf||!lf.distance) return;
  lf.distance(function(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];
    return (s&&t&&s.ent!==t.ent)?280:40; });
  lf.strength(function(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];   // soft springs — the anchors own the geometry
    return (s&&t&&s.ent!==t.ent)?0.04:0.12; }); }
/* mode-aware layout force: chain = layer→Y + (entity+sub)→X/Z band · force/spread = pull to the
   3D (entity + sub-ring) anchor, then a per-kind RADIAL bias (endpoints ring the entity EDGE,
   functions/models/schemas pull to the CORE) + a soft containment past 1.3× the nominal radius. */
var KRADF={ endpoint:1.25, web:1.25, screen:1.25, external:1.1, "function":0.35, model:0.28, schema:0.28 };
function zForce(alpha){ var ns=zForce.__n||[]; ns.forEach(function(n){ var x=n.x||0, y=n.y||0, z=n.z||0;
  var sa=(SUBANCHOR[n.ent]||{})[n.sub];
  if(__chainMode){ n.vy += ((LZ[n.layer]||0)-y)*0.05*alpha;
    n.vx += ((EX[n.ent]||0)+(sa?sa.x:0)-x)*0.045*alpha; n.vz += ((sa?sa.z:0)-z)*0.03*alpha; return; }
  var ax=EX[n.ent]||0, ay=EY[n.ent]||0, az=EZ[n.ent]||0;
  n.vx += (ax+(sa?sa.x:0)-x)*0.08*alpha; n.vy += (ay+(sa?sa.y:0)-y)*0.08*alpha; n.vz += (az+(sa?sa.z:0)-z)*0.08*alpha;
  var dx=x-ax, dy=y-ay, dz=z-az, r=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(!(r>1e-3) || !isFinite(r)) return;                     // coincident with the anchor → no radial direction yet (NaN guard)
  var R0=RENT[n.ent]||60, f=KRADF[n.kind];
  if(f){ var kr=0.08*alpha*(R0*f-r)/r; n.vx+=dx*kr; n.vy+=dy*kr; n.vz+=dz*kr; }                // kind ring: boundary out, guts in
  var rmax=R0*1.3; if(r>rmax){ var kc=0.3*alpha*(rmax-r)/r; n.vx+=dx*kc; n.vy+=dy*kc; n.vz+=dz*kc; }   // containment kills the bleed
}); }
zForce.initialize=function(ns){ zForce.__n=ns; };

/* ══ DEPTH HIGHLIGHT (batch 12) — select an element → light everything within N hops (1–5).
   Two styles: GLOW (halo the reached set, dim the rest of the wires) · FOCUS (hide everything
   outside the set; hulls stay as geography). Alt+scroll changes depth; Esc clears. The journeys
   picker feeds the SAME machinery with a carrier set instead of a single origin. */
var HL={ on:false, mode:"glow", depth:3, rest:"hide", origin:null, jr:null, set:{}, links:null, sprites:[] };   // rest = focus's treatment of the OUTSIDE: dim · fade · wires · hide
function _hlCompute(){ if(!HL.origin){ HL.set={}; HL.links=null; return; }
  var adj={}; links.forEach(function(l){ var s=lid(l.source), t=lid(l.target);
    (adj[s]=adj[s]||[]).push(t); (adj[t]=adj[t]||[]).push(s); });
  var depth={}, q=[];
  HL.origin.forEach(function(id){ if(NIDS[id] && depth[id]===undefined){ depth[id]=0; q.push(id); } });
  while(q.length){ var u=q.shift(); if(depth[u]>=HL.depth) continue;
    (adj[u]||[]).forEach(function(v){ if(depth[v]===undefined){ depth[v]=depth[u]+1; q.push(v); } }); }
  HL.set=depth; HL.links=new Set();
  links.forEach(function(l){ if(depth[lid(l.source)]!==undefined && depth[lid(l.target)]!==undefined) HL.links.add(l); }); }
var _RESTF={ dim:0.25, fade:0.08, wires:0, hide:0 };                     // focus rest-factor per behavior
window._hlLinkF=function(l){ if(!HL.on||!HL.links) return 1;             // per-wire factor read by updateConnectors
  if(HL.links.has(l)) return 2.6;
  return HL.mode==="focus" ? _RESTF[HL.rest] : 1; };                     // GLOW leaves the rest ALONE; FOCUS applies the chosen rest behavior
function _nodeVisibleFn(n){ var v=visN(n); if(!v.show||!v.planets) return false;   // the ONE node-visibility truth (fleet show ∧ planets ∧ focus)
  if(HL.on && HL.mode==="focus" && HL.rest==="hide" && HL.set[n.id]===undefined) return false; return true; }   // only the HIDE behavior removes planets — dim/fade/wires keep them
var hlGroup=null;
function _hlGroup(){ if(!hlGroup && typeof Graph!=="undefined" && Graph){ hlGroup=new T.Group(); Graph.scene().add(hlGroup); } return hlGroup; }
function _hlClearSprites(){ if(hlGroup){ while(hlGroup.children.length){ var s=hlGroup.children.pop(); hlGroup.remove(s); } } HL.sprites=[]; }
window.__uniHLReapply=function(){ if(!HL.on||HL.mode!=="glow") return;   // halos live in an INDEPENDENT scene group —
  var g0=_hlGroup(); if(!g0) return; _hlClearSprites();                   // node-object recreation can never kill them
  nodes.forEach(function(n){ if(HL.set[n.id]===undefined) return;
    var d0=HL.set[n.id]===0, g=glowSprite(n.col||"#9ecbff", d0?64:36, d0?0.85:0.55);
    g.userData.nid=n.id; g.raycast=function(){}; g.position.set(n.x||0,n.y||0,n.z||0);
    g0.add(g); HL.sprites.push(g); }); };
window.__uniHLTick=function(){ if(!hlGroup||!HL.on||HL.mode!=="glow") return;   // follow the sim every cluster tick
  hlGroup.children.forEach(function(s){ var p=_npos[s.userData.nid]; if(p) s.position.set(p.x,p.y,p.z); }); };
function _hlRestyle(){ _hlClearSprites();
  if(typeof Graph!=="undefined" && Graph){
    try{ Graph.nodeVisibility(function(n){ return _nodeVisibleFn(n); }); }catch(e){}
    try{ rebuildNodes(); }catch(e){}
    try{ buildClusters(); updateClusters(true); }catch(e){}
    try{ buildTransports(); }catch(e){} }
  try{ __uniHLReapply(); }catch(e){}                       // direct — the halo group is rebuild-proof, no rAF dependency
  _hlSyncUI(); }
function _hlSyncUI(){ var dn=document.getElementById("depthNum"); if(dn) dn.textContent=HL.depth;
  var dr=document.getElementById("depthRng"); if(dr && +dr.value!==HL.depth) dr.value=HL.depth;
  var db=document.getElementById("depthBtn"); if(db) db.classList.toggle("on", HL.on);
  var jb=document.getElementById("jrnBtn"); if(jb) jb.classList.toggle("on", !!HL.jr);
  var ig=document.getElementById("hlIcoGlow"), ifc=document.getElementById("hlIcoFocus");
  if(ig&&ifc){ ig.style.display=(HL.mode==="glow")?"":"none"; ifc.style.display=(HL.mode==="focus")?"":"none"; } }
window.__uniHLSelect=function(n){ if(!n) return; HL.jr=null; HL.jrObj=null; HL.origin=[n.id]; HL.on=true; _hlCompute(); _hlRestyle();
  if(WALK.mode!=="trail"){ WALK.mode="trail"; WALK.steps=[]; }        // a user click while a journey walks = a fresh trail (the 2D rule)
  var ix=WALK.steps.indexOf(n.id);
  if(ix>=0) WALK.i=ix; else { WALK.steps.push(n.id); if(WALK.steps.length>7) WALK.steps.shift(); WALK.i=WALK.steps.length-1; }
  _walkRender(); };
window.__uniHLSelectLink=function(l){ if(!l) return; HL.jr=null; HL.jrObj=null;
  HL.origin=[lid(l.source), lid(l.target)]; HL.on=true; _hlCompute(); _hlRestyle(); };   // a WIRE select seeds the BFS from BOTH endpoints (depth control applies)
window.__uniHLClear=function(){ if(!HL.on && !WALK.mode) return; HL.on=false; HL.jr=null; HL.jrObj=null; HL.origin=null; HL.set={}; HL.links=null;
  window.__uniSelLink=null;
  WALK.mode=null; WALK.steps=[]; WALK.i=0; _hlRestyle(); _walkRender(); };
window.__uniHLDepth=function(d){ HL.depth=Math.max(1,Math.min(5,d));
  if(HL.on){ _hlCompute(); _hlRestyle(); } else _hlSyncUI(); };
window.__uniHLMode=function(){ HL.mode=(HL.mode==="glow")?"focus":"glow"; if(HL.on) _hlRestyle(); else _hlSyncUI(); };
/* ── JOURNEYS — cross-entity tests from det.test_journeys, deduped by cid. NAMED for free: the same
   feed's det.cases carries the real test name in the SAME cid space (test_delete_me_requires_auth_C12)
   → join + humanize, no new information invented. Grouped: END-TO-END (e2e corpus) first — the most
   interesting — then by the journey's STARTING entity (entities[0]). ── */
var JRN=null, _CNAMES=null;
function _caseNames(){ if(_CNAMES) return _CNAMES; _CNAMES={};
  nodes.forEach(function(n){ ((n.det&&n.det.cases)||[]).forEach(function(c){
    if(c.cid && c.name && !_CNAMES[c.cid]) _CNAMES[c.cid]=c.name; }); });
  return _CNAMES; }
function _jrnName(j){ var nm=_caseNames()[j.cid]; if(!nm) return null;
  return nm.replace(/^test[_ ]?/,"").replace(/_C\d+$/,"").replace(/_/g," "); }
function _jrnCollect(){ if(JRN) return JRN; var m={};
  nodes.forEach(function(n){ ((n.det&&n.det.test_journeys)||[]).forEach(function(j){ if(!j.cid) return;
    var r=m[j.cid]||(m[j.cid]={cid:j.cid, corpora:{}, ents:j.entities||[], carriers:[]});
    r.corpora[j.corpus||"?"]=1; r.carriers.push(n.id); }); });
  JRN=Object.keys(m).map(function(k){ var j=m[k];
    j.agg=/^\d+ case/.test(j.cid);                              // the emitter caps web/e2e journeys into "N case(s)" AGGREGATE rows — label them honestly
    j.e2e=!!j.corpora.e2e; j.corpus=Object.keys(j.corpora).sort().join("+");
    j.name=j.agg ? (j.corpus+" tests · "+j.cid+" (aggregated)") : _jrnName(j);
    j.start=(j.ents[0]||"other");
    j.carriers.sort(function(a,b){ var ea=(NIDS[a]||{}).ent||"", eb=(NIDS[b]||{}).ent||"";   // steps walk entity-by-entity along the span
      var ia=j.ents.indexOf(ea), ib=j.ents.indexOf(eb); if(ia!==ib) return ia-ib; return a<b?-1:1; });
    return j; });
  return JRN; }
function _jrnRow(j){ return '<div class="jrnrow'+(HL.jr===j.cid?" on":"")+'" data-jr="'+j.cid+'" title="'+j.ents.join(" → ")+'">'
  +'<span class="jrnname">'+(j.name||j.cid)+'</span><b>'+(j.agg?"agg":j.cid)+'</b><span class="jrncorp">'+j.corpus+'</span>'
  +'<span class="jrnn">'+j.ents.length+' ents</span></div>'; }
window.__uniJrnToggle=function(){ var p=document.getElementById("jrn"); if(!p) return;
  if(p.style.display!=="none"){ p.style.display="none"; return; }
  var js=_jrnCollect(), bySpan=function(a,b){ return (b.ents.length-a.ents.length)||(b.carriers.length-a.carriers.length); };
  var e2e=js.filter(function(j){ return j.e2e; }).sort(bySpan);
  var rest=js.filter(function(j){ return !j.e2e; });
  var groups={}; rest.forEach(function(j){ (groups[j.start]=groups[j.start]||[]).push(j); });
  var h='<div class="jrnhd">journeys · '+js.length+' cross-entity tests</div><div class="jrnrow jrnnone" data-jr="">— none (clear)</div>';
  if(e2e.length){ h+='<div class="jrngrp">end-to-end · '+e2e.length+'</div>'; e2e.forEach(function(j){ h+=_jrnRow(j); }); }
  Object.keys(groups).sort().forEach(function(g){ h+='<div class="jrngrp">'+g+' · '+groups[g].length+'</div>';
    groups[g].sort(bySpan).forEach(function(j){ h+=_jrnRow(j); }); });
  p.innerHTML=h; p.style.display="";
  p.querySelectorAll(".jrnrow").forEach(function(r){ r.onclick=function(){ var cid=r.getAttribute("data-jr");
    p.style.display="none";
    if(!cid){ __uniHLClear(); return; }
    var j=_jrnCollect().filter(function(x){ return x.cid===cid; })[0]; if(!j) return;
    HL.jr=cid; HL.jrObj=j; HL.origin=j.carriers.slice(); HL.on=true; _hlCompute(); _hlRestyle();
    WALK.mode="journey"; WALK.steps=j.carriers.slice(); WALK.i=0; _walkRender(); _walkGo(0); }; }); };
/* ── THE WALK (ported from the 2D graph): journey steps ‹ i/N › jump the camera + open each carrier's
   card while the whole path stays lit; element clicks build a TRAIL (up to 7) of step chips. ── */
var WALK={ mode:null, steps:[], i:0 };
function _aimAt(n){ if(typeof Graph==="undefined"||!Graph||n.x==null) return;
  try{ var cam=Graph.camera(), P={x:n.x,y:n.y,z:n.z};
    var d=new T.Vector3(cam.position.x-P.x, cam.position.y-P.y, cam.position.z-P.z);
    var len=d.length()||1, keep=Math.max(260, Math.min(len, 420)); d.multiplyScalar(keep/len);   // never dive INSIDE the wire jungle
    Graph.cameraPosition({x:P.x+d.x, y:P.y+d.y, z:P.z+d.z}, P, 700); }catch(e){} }
function _frameSet(ids){ if(typeof Graph==="undefined"||!Graph||!ids||!ids.length) return;      // journey select: see the WHOLE path first
  try{ var cx=0,cy=0,cz=0,n=0; ids.forEach(function(id){ var nd=NIDS[id]; if(nd&&nd.x!=null){ cx+=nd.x; cy+=nd.y; cz+=nd.z; n++; } });
    if(!n) return; cx/=n; cy/=n; cz/=n; var r=0;
    ids.forEach(function(id){ var nd=NIDS[id]; if(nd&&nd.x!=null) r=Math.max(r, Math.hypot(nd.x-cx,nd.y-cy,nd.z-cz)); });
    var cam=Graph.camera(), d=new T.Vector3(cam.position.x-cx, cam.position.y-cy, cam.position.z-cz);
    var len=d.length()||1, keep=Math.max(r*2.1+220, 420); d.multiplyScalar(keep/len);
    Graph.cameraPosition({x:cx+d.x, y:cy+d.y, z:cz+d.z}, {x:cx,y:cy,z:cz}, 900); }catch(e){} }
function _walkGo(di){ if(!WALK.steps.length) return;
  WALK.i=Math.max(0, Math.min(WALK.steps.length-1, WALK.i+di));
  var n=NIDS[WALK.steps[WALK.i]]; if(!n) return;
  if(WALK.mode==="journey" && di===0) _frameSet(WALK.steps);   // selection shows the WHOLE path; arrows dive per step
  else _aimAt(n);
  SEL={kind:"node",data:n}; try{ showPanel(n); refreshEncSel(); }catch(e){}   // programmatic — does NOT re-run the select hook (the lit path stays)
  _walkRender(); }
function _walkRender(){ var wb=document.getElementById("walkbar"), pill=document.getElementById("jrnpill");
  /* JOURNEY controls live CENTERED in the header bar: [‹] [i/N · name] [›] [✕] — real buttons,
     Lucide chevrons (the text glyphs sat skewed in their circles). */
  if(pill){ if(WALK.mode==="journey" && HL.jrObj){ var j=HL.jrObj, stepN=(NIDS[WALK.steps[WALK.i]]||{}).label||"";
      var CHL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
      var CHR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
      var XIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      pill.style.display="";
      pill.innerHTML='<button class="tbico wbtn" data-wgo="-1" title="previous step">'+CHL+'</button>'
        +'<span class="wname" title="step '+(WALK.i+1)+': '+stepN+' · '+(j.ents||[]).join(" → ")+' · '+HL.jr+' · '+j.corpus+'">'
        +'<b class="wpos">'+(WALK.i+1)+'/'+WALK.steps.length+'</b><span class="wjname">'+(j.name||j.cid)+'</span></span>'
        +'<button class="tbico wbtn" data-wgo="1" title="next step">'+CHR+'</button>'
        +'<button class="tbico hlbx" title="clear the journey (Esc)">'+XIC+'</button>';
      pill.querySelectorAll("[data-wgo]").forEach(function(b){ b.onclick=function(){ _walkGo(+b.getAttribute("data-wgo")); }; });
      pill.querySelector(".hlbx").onclick=function(){ __uniHLClear(); }; }
    else pill.style.display="none"; }
  if(wb){ if(WALK.mode!=="trail"){ wb.style.display="none"; }
    else { var chips=WALK.steps.map(function(id,i){ var n=NIDS[id]; if(!n) return "";
        return '<button class="wchip'+(i===WALK.i?" on":"")+'" data-wi="'+i+'" title="'+n.label+' · '+n.ent+'" style="color:'+(n.col||"#9ab")+'">'+(i+1)+'</button>'; }).join("");
      wb.style.display=""; wb.innerHTML='<div class="wjname">trail</div><div class="wnav">'+chips
        +'<span class="wstepname">'+((NIDS[WALK.steps[WALK.i]]||{}).label||"")+'</span></div>';
      wb.querySelectorAll("[data-wi]").forEach(function(b){ b.onclick=function(){ WALK.i=+b.getAttribute("data-wi"); _walkGo(0); }; }); } } }
/* hover a connection chip in the card → that node gets a WHITE halo (a different color than the
   depth highlight) so the relationship reads instantly */
var _hovSprite=null;
window.__uniHoverHL=function(id){ if(_hovSprite){ try{ if(_hovSprite.parent) _hovSprite.parent.remove(_hovSprite); }catch(e){} _hovSprite=null; }
  if(!id) return; var n=NIDS[id]; if(!n||!n.__threeObj) return;
  _hovSprite=glowSprite("#ffffff", 40, 0.9); _hovSprite.userData.__hov=1; n.__threeObj.add(_hovSprite); };
/* ── CONTROLS panel (bottom-right): the navigation cheat-sheet + mouse toggles ── */
window.__uniBuildCtrl=function(){ if(document.getElementById("ctrlp")) return;
  var p=document.createElement("div"); p.className="cfg ctrlp"; p.id="ctrlp";
  var KB=function(k){ return '<b class="kbd">'+k+'</b>'; };
  p.innerHTML='<div class="cfghead" id="ctrlphead"><span class="cfgtitle">'+(typeof ico==="function"?ico("target",13):"")+'Controls</span>'
    +'<button class="cfgmin" id="ctrlpmin" title="minimize">–</button></div>'
    +'<div class="cfgbody">'
    +'<div class="ctlrow">'+KB("W")+KB("A")+KB("S")+KB("D")+'<span class="ctll">move</span></div>'
    +'<div class="ctlrow">'+KB("Space")+'<span class="ctll">up</span>'+KB("Ctrl")+'<span class="ctll">down</span></div>'
    +'<div class="ctlrow">'+KB("Q")+KB("E")+'<span class="ctll">turn in place</span></div>'
    +'<div class="ctlrow">'+KB("Alt+Q")+KB("Alt+E")+KB("↑")+KB("↓")+'<span class="ctll">depth</span>'+KB("Esc")+'<span class="ctll">clear</span></div>'
    +'<div class="ctlrow">'+KB("1")+'…'+KB("8")+'<span class="ctll">fleet columns — for the selection (none = all)</span></div>'
    +'<div class="ctlrow">'+KB("LMB")+'<select id="ctlCam" title="how the LEFT drag rotates">'
    +'<option value="look">Look — first-person, turn in place</option>'
    +'<option value="tumble">Tumble — drag = turn (stock)</option>'
    +'<option value="joystick">Joystick — hold offset = keep turning (WoW)</option>'
    +'<option value="arcball">Arcball — virtual trackball</option></select></div>'
    +'<div class="ctlrow">'+KB("RMB")+'<span class="ctll">tumble (orbit)</span>'+KB("MMB")+'<span class="ctll">pan</span></div>'
    +'<div class="ctlrow ctltog"><button class="fltog'+(UNICTL.invert?" on":"")+'" id="ctlInv" title="flips the vertical rotation axis of every rotating drag (left look starts inverted; right tumble starts direct)"></button><span class="ctll">invert vertical (flight-style)</span></div>'
    +'<div class="ctlrow ctltog"><button class="fltog'+(UNICTL.selPivot?" on":"")+'" id="ctlPvt" title="right-drag tumble orbits around the SELECTED planet"></button><span class="ctll">right = orbit selection</span></div>'
    +'</div>';
  document.body.appendChild(p);
  document.getElementById("ctrlpmin").onclick=function(){ p.classList.toggle("min"); this.textContent=p.classList.contains("min")?"+":"–"; };
  document.getElementById("ctlInv").onclick=function(){ UNICTL.invert=!UNICTL.invert; this.classList.toggle("on",UNICTL.invert); };
  var cs=document.getElementById("ctlCam"); if(cs){ cs.value=UNICTL.camMode;
    cs.addEventListener("change", function(){ UNICTL.camMode=cs.value; }); }
  document.getElementById("ctlPvt").onclick=function(){ UNICTL.selPivot=!UNICTL.selPivot; this.classList.toggle("on",UNICTL.selPivot); }; };
/* topbar wiring + Alt+scroll + Esc — bound once at boot */
window.__uniWireTopbar=function(){
  var dr=document.getElementById("depthRng"); if(dr&&!dr.__w){ dr.__w=1;
    dr.addEventListener("input", function(){ __uniHLDepth(+dr.value); }); }
  var mb=document.getElementById("hlModeBtn"); if(mb&&!mb.__w){ mb.__w=1; mb.onclick=function(){ __uniHLMode(); }; }
  var jb=document.getElementById("jrnBtn"); if(jb&&!jb.__w){ jb.__w=1; jb.onclick=function(){ __uniJrnToggle(); }; }
  if(!window.__uniFly){ window.__uniFly=1; var FK={};
    var _flyOK=function(e){ var tag=(e.target&&e.target.tagName)||""; return tag!=="INPUT"&&tag!=="TEXTAREA"; };
    var _flyFroze=false;
    function _flyFreeze(){ if(!_flyFroze && ANIM.freezeOnDrag && ANIM.all){ _flyFroze=true; ANIM.all=false; } }
    function _flyThaw(){ var any=false; for(var k in FK){ any=true; break; }
      if(!any && _flyFroze){ _flyFroze=false; ANIM.all=true; } }
    window.addEventListener("keydown", function(e){ if(!_flyOK(e)) return; var k=e.key.toLowerCase();
      if(e.altKey&&(k==="q"||k==="e")){ e.preventDefault(); if(window.__uniHLDepth) __uniHLDepth(HL.depth+(k==="e"?1:-1)); }   // Alt+Q/E = depth (replaces Alt+scroll)
      else if((k==="w"||k==="a"||k==="s"||k==="d"||k==="q"||k==="e")&&!e.altKey){ FK[k]=1; _flyFreeze(); }
      else if(k===" "){ FK.up=1; _flyFreeze(); e.preventDefault(); }   // Space = ascend (and never scrolls/clicks)
      else if(k==="control"){ FK.dn=1; _flyFreeze(); }
      else if(k>="1"&&k<="8"&&!e.altKey&&!e.ctrlKey&&!e.metaKey){        // 1–8 = fleet columns 2–9, applied to the SELECTION (none → the ALL row)
        var FC=_FCOLS[+k]; if(FC && window.__uniFleetToggle){ var hs=window.__uniHullSel||{};
          __uniFleetToggle(hs.ent||"*", (hs.ent&&hs.sub!=null)?hs.sub:null, FC.k); } } });
    window.addEventListener("keyup", function(e){ var k=e.key.toLowerCase();
      if(k==="w"||k==="a"||k==="s"||k==="d"||k==="q"||k==="e") delete FK[k];
      else if(k===" ") delete FK.up; else if(k==="control") delete FK.dn;
      _flyThaw(); });
    var _whT=null;                                              // wheel zoom freezes too, resumes when the scrolling stops
    window.addEventListener("wheel", function(e){ if(e.altKey) return;
      if(ANIM.freezeOnDrag && ANIM.all){ _flyFroze=true; ANIM.all=false; }
      if(_whT) clearTimeout(_whT);
      _whT=setTimeout(function(){ _whT=null; _flyThaw(); }, 350); }, {passive:true});
    window.addEventListener("blur", function(){ for(var k in FK) delete FK[k]; });
    setInterval(function _flyTick(){                                        // setInterval, NOT rAF: headless/background pages starve rAF chains (measured 1 tick/400ms) — the flight must tick everywhere
      if(typeof Graph==="undefined"||!Graph) return; var any=false; for(var k in FK){ any=true; break; } if(!any) return;
      try{ var cam=Graph.camera(), ctrls=Graph.controls(); if(!cam||!ctrls) return;
        var sp=Math.max(2.5, cam.position.distanceTo(ctrls.target)*0.016);   // speed scales with zoom — close = fine, far = fast
        var fwd=new T.Vector3(0,0,-1).applyQuaternion(cam.quaternion).multiplyScalar(sp);
        var rgt=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion).multiplyScalar(sp);
        var off=new T.Vector3();
        if(FK.w) off.add(fwd); if(FK.s) off.sub(fwd);
        if(FK.d) off.add(rgt); if(FK.a) off.sub(rgt);
        if(FK.up) off.y+=sp; if(FK.dn) off.y-=sp;
        if(FK.q||FK.e){                                        // Q/E = orbit INWARD around the view centre at the zoom depth
          var ya=(FK.e?1:0)-(FK.q?1:0);                        // swapped (operator): E spins Q's old way, Q spins E's
          var vdq=new T.Vector3(); cam.getWorldDirection(vdq);
          var pv=new T.Vector3().copy(cam.position).addScaledVector(vdq, _zoomDist());
          _rotRig(cam, ctrls.target, pv, new T.Vector3(0,1,0), ya*0.022); }
        if(!off.lengthSq()) return;
        cam.position.add(off); ctrls.target.add(off);          // the whole rig flies — orbiting keeps working wherever you stop
      }catch(e){} }, 16); }
  if(!window.__uniHLKeys){ window.__uniHLKeys=1;

    window.addEventListener("keydown", function(e){ var tag=(e.target&&e.target.tagName)||"";
      if(tag==="INPUT"||tag==="TEXTAREA") return;
      if(e.key==="Escape"){ __uniHLClear();
        try{ SEL=null; refreshEncSel(); }catch(e2){}
        if(window.__uniPanelAll) __uniPanelAll(); }                 // deselect → the principal (Everything) panel
      else if(e.key==="ArrowUp"){ e.preventDefault(); __uniHLDepth(HL.depth+1); }     // arrows mirror Alt+scroll (some setups eat it)
      else if(e.key==="ArrowDown"){ e.preventDefault(); __uniHLDepth(HL.depth-1); } }); }
  _hlSyncUI(); };

/* ══ FLEET panel (batch 11-B) — per-entity visibility + ops matrix; the in-flight diagram's seed ══
   State contract: UNIVIS{ent,node,meta}. node/meta are RESERVED for the in-flight batch — GABE_SIM
   keys its stages by piece id and the universe node ids are the SAME strings, so a later per-piece
   join is direct. ALL engine seams read through visEnt/visN — the ONE place a "dim" tri-state and
   per-piece roles land later. An unknown entity resolves to SHOWN (l2-only entities never vanish). */
var _VISDEF={ show:1, planets:1, wires:1, subs:1, zDef:1, zAtk:1, zCfl:1, zSat:1, routes:1 };
/* the seven cluster-core strategies each own an ICON (operator ask) — the config pills carry them
   and every cluster surface (rows, panels) INHERITS the active core's icon from this one map. */
window.__uniCoreIco=function(mode,px){ px=px||13; var PATHS={
  layer:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  kind:'<path d="M8.3 10a.7.7 0 0 1-.6-1.1L11.4 3a.7.7 0 0 1 1.2 0l3.7 5.9a.7.7 0 0 1-.6 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
  tests:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  guards:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  usecase:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  community:'<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M10.8 7.2 6.2 15.7M13.2 7.2l4.6 8.5M7.5 18h9"/>',
  fk:'<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>' };
  return '<svg viewBox="0 0 24 24" width="'+px+'" height="'+px+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(PATHS[mode]||PATHS.layer)+'</svg>'; };
/* ── HULL SELECTION LIGHT (batch 25): the selected container(s) BRIGHTEN — the element's cluster
   and entity, the entity alone, or the cluster+entity, per the panel level; Esc clears. Materials
   lazily remember their built opacity (__baseOp) so rebuilds re-capture stock and the scale is
   idempotent; buildClusters is wrapped below so every hull rebuild re-applies the light. ── */
window.__uniHullSel={ ent:null, sub:null };
window.__uniApplyHullSel=function(){ try{ var hs=window.__uniHullSel;
  (typeof CLUSTERS!=="undefined"?CLUSTERS:[]).forEach(function(c){ if(!c.ekey) return;
    var hit=false;
    if(hs.ent && c.ekey===hs.ent) hit = (c.level==="ent") ? true : (hs.sub!=null && c.skey===hs.sub);
    var mats=[];
    if(c.sph) mats.push(c.sph.material); if(c.rim) mats.push(c.rim.material);
    if(c.hull) mats.push(c.hull.material);
    if(c.sprites) c.sprites.forEach(function(sp){ if(sp.s) mats.push(sp.s.material); });
    var floor=(c.level==="ent")?0.05:0.06;                       // absolute floors (a ×factor alone is invisible on big shells); operator-tuned 2026-08-22 (two more dims both)
    var glow=(c.level==="ent")?0.16:0.24;
    mats.forEach(function(m){ if(!m) return; if(m.__baseOp==null) m.__baseOp=m.opacity;
      m.opacity = hit ? Math.min(0.92, Math.max(m.__baseOp*2, floor)) : m.__baseOp;
      if(m.emissiveIntensity!==undefined){ if(m.__baseEm==null) m.__baseEm=m.emissiveIntensity;   // shaded hulls also GLOW when lit
        m.emissiveIntensity = hit ? glow : m.__baseEm; } });
  });
  if(window.__uniFleetSpot) __uniFleetSpot(hs.ent, hs.sub);
  }catch(e){} };
window.__uniSelHulls=function(n){ window.__uniHullSel={ ent:(n&&n.ent)||null, sub:(n&&n.ent&&n.sub)||null }; __uniApplyHullSel(); };
if(typeof buildClusters==="function"){ var _bcOrig=buildClusters;
  buildClusters=function(){ _bcOrig(); try{ __uniApplyHullSel(); }catch(e){} }; }
window.UNIVIS={ ent:{}, sub:{}, node:{}, meta:{} };   // sub = per-(ent|subgroup) overrides — keys are CURRENT-coreBy groups, regrouped on a core change
_ents.forEach(function(e){ UNIVIS.ent[e]=Object.assign({},_VISDEF); });
function visEnt(slug){ return UNIVIS.ent[slug]||_VISDEF; }
/* effective per-node: node override wins; else the entity flags AND the node's sub-group flags —
   a sub-cluster is visible/armed only when its entity is too (the panel refines downward). */
function visN(n){ var o=n&&UNIVIS.node[n.id]; if(o) return o;
  var ev=visEnt(n&&n.ent), sv=(n&&n.sub!=null)?UNIVIS.sub[n.ent+"|"+n.sub]:null;
  if(!sv) return ev;
  return { show:(ev.show&&sv.show)?1:0, planets:(ev.planets&&sv.planets)?1:0, wires:(ev.wires&&sv.wires)?1:0, subs:ev.subs,
    zDef:(ev.zDef&&sv.zDef)?1:0, zAtk:(ev.zAtk&&sv.zAtk)?1:0, zCfl:(ev.zCfl&&sv.zCfl)?1:0,
    zSat:(ev.zSat&&sv.zSat)?1:0, routes:(ev.routes&&sv.routes)?1:0 }; }
/* applyVis pushes UNIVIS into the engine. scope picks WHICH routines run — never a partial rebuild:
   nodes = show flips (visibility + rebuildNodes registry reset + hulls + shuttles) · clusters = subs ·
   zones = z* (rebuildNodes only — all-nodes by design, same cost the global zone toggle pays) ·
   routes = transports. rAF-coalesced: a master-row drag lands as ONE rebuild per frame. */
var _visRAF=null, _visScopes={};
function applyVis(scope){ _visScopes[scope||"all"]=1;
  if(_visRAF) return; _visRAF=requestAnimationFrame(function(){ _visRAF=null; var s=_visScopes; _visScopes={}; _applyVisNow(s); }); }
function _applyVisNow(s){ if(typeof Graph==="undefined"||!Graph) return; var all=s.all;
  if(all||s.nodes){ try{ Graph.nodeVisibility(function(n){ return _nodeVisibleFn(n); }); }catch(e){} }
  if(all||s.nodes||s.wires){ try{ Graph.linkVisibility(linkVisFn); }catch(e){}   // dormant while conns is baked on
    try{ buildClusters(); updateClusters(true); }catch(e){} }        // connector rebuild picks up the per-entity/cluster wires flag
  if(all||s.nodes||s.zones){ try{ rebuildNodes(); }catch(e){} }      // ONLY rebuildNodes resets FLEETTICK/PULSE/ORBIT/WAVE — re-show would duplicate closures otherwise
  if(all||s.nodes||s.clusters){ try{ buildClusters(); updateClusters(true); }catch(e){} }
  if(all||s.nodes||s.routes){ try{ buildTransports(); }catch(e){} }  // MOVERS rebuild nowhere else — ghost shuttles fly to hidden entities otherwise
  if(window.__uniFleetSync) try{ __uniFleetSync(); }catch(e){}
  try{ var pb=document.getElementById("pbody");                      // card honesty: a selected node whose entity hid gets an explicit note
    if(pb && typeof SEL!=="undefined" && SEL && SEL.kind==="node" && SEL.data){
      var hid=!visN(SEL.data).show, note=pb.querySelector(".fleethid");
      if(hid && !note){ var d=document.createElement("div"); d.className="fleethid";
        d.textContent="entity hidden by the fleet panel — the selection stays, the node is not drawn"; pb.insertBefore(d, pb.firstChild); }
      else if(!hid && note) note.parentNode.removeChild(note); } }catch(e){}
}
window.__uniApplyVisPreset=function(preset){ if(!preset) return;     // deep-merge ALL namespaces, PRESERVE unknown keys —
  Object.keys(preset).forEach(function(ns){                          // a later in-flight preset carries node/meta through unchanged
    if(ns==="ent"||ns==="sub"){ Object.keys(preset[ns]||{}).forEach(function(k){
      UNIVIS[ns][k]=Object.assign({}, UNIVIS[ns][k]||_VISDEF, preset[ns][k]); }); }
    else if(UNIVIS[ns] && typeof preset[ns]==="object"){ Object.assign(UNIVIS[ns], preset[ns]); }
    else UNIVIS[ns]=preset[ns]; });
  applyVis("all"); if(window.__uniFleetRender) try{ __uniFleetRender(); }catch(e){} };
/* the sub keys are CURRENT-coreBy groups: a core change (or the functions toggle) regroups —
   overrides whose (ent|sub) no longer exists are dropped, the panel re-renders live groups. */
window.__uniFleetRegroup=function(){ var live={}; nodes.forEach(function(n){ live[n.ent+"|"+n.sub]=1; });
  Object.keys(UNIVIS.sub).forEach(function(k){ if(!live[k]) delete UNIVIS.sub[k]; });
  if(window.__uniFleetRender) try{ __uniFleetRender(); }catch(e){} };
/* a second draggable panel — dragCfg is id-hardwired to #cfg, so the fleet gets its own helper */
function _dragPanel(panel, head){ var dg={on:false,ox:0,oy:0};
  head.addEventListener("mousedown",function(e){ if(e.target.closest(".cfgmin")) return; var r=panel.getBoundingClientRect();
    panel.style.right="auto"; panel.style.left=r.left+"px"; panel.style.top=r.top+"px"; dg.on=true; dg.ox=e.clientX-r.left; dg.oy=e.clientY-r.top; e.preventDefault(); });
  window.addEventListener("mousemove",function(e){ if(!dg.on) return;
    panel.style.left=Math.max(4,Math.min(window.innerWidth-40,e.clientX-dg.ox))+"px"; panel.style.top=Math.max(4,Math.min(window.innerHeight-30,e.clientY-dg.oy))+"px"; });
  window.addEventListener("mouseup",function(){ dg.on=false; }); }
/* matrix columns — g() = the GLOBAL master gate (cell dims when off, the zonesoff pattern);
   icons come from the spike's own ICO set via ico() so the panel speaks the config's language */
var _FCOLS=[
  { k:"show",   ti:"show entity",         scope:"nodes",    icon:"shape",  g:function(){ return true; } },
  { k:"subs",   ti:"sub-cluster hulls",   scope:"clusters", icon:"sub",    g:function(){ return !!CFG.subOn; } },
  { k:"planets",ti:"planets (element nodes) — hulls stay", scope:"nodes",  icon:"bubble", g:function(){ return true; } },
  { k:"wires",  ti:"connections touching it",              scope:"wires",  icon:"radius", g:function(){ return true; } },
  { k:"routes", ti:"transports (routes)", scope:"routes",   icon:"truck",  g:function(){ return !!CFG.transports; } },
  { k:"zDef",   ti:"defense fleet",       scope:"zones",    icon:"shield", g:function(){ return !!(CFG.warOn&&CFG.zDef); } },
  { k:"zAtk",   ti:"attack fleet",        scope:"zones",    icon:"swords", g:function(){ return !!(CFG.warOn&&CFG.zAtk); } },
  { k:"zCfl",   ti:"conflict effects",    scope:"zones",    icon:"burst",  g:function(){ return !!(CFG.warOn&&CFG.zCfl); } },
  { k:"zSat",   ti:"satellites",          scope:"zones",    icon:"target", g:function(){ return !!(CFG.warOn&&CFG.zSat); } } ];
window.__uniBuildFleet=function(){ if(document.getElementById("fleet")) return;
  if(typeof ICO!=="undefined"){                                             // presets speak icons now — extend the config's own set
    ICO.hide='<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>';
    ICO.flight='<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'; }
  var p=document.createElement("div"); p.className="cfg fleet"; p.id="fleet";
  var _simTitle=(typeof window.GABE_SIM==="undefined") ? "no sim feed on this page (sim.data.js absent)"
    : (window.GABE_SIM===null ? "no change in flight (sim feed at rest)" : "a change IS in flight — the preset derivation lands in a later batch");
  p.innerHTML='<div class="cfghead" id="fleethead"><span class="cfgtitle">'+(typeof ico==="function"?ico("shape",13):"")+'Fleet</span>'
    +'<span class="flprehead">'
    +'<button class="flpre" data-fpre="all" title="ALL — show everything (cluster overrides reset too)">'+(typeof ico==="function"?ico("show",13):"")+'</button>'
    +'<button class="flpre" data-fpre="none" title="NONE — hide every entity">'+(typeof ico==="function"?ico("hide",13):"")+'</button>'
    +'<button class="flpre" data-fpre="inflight" disabled title="IN-FLIGHT — '+_simTitle+'">'+(typeof ico==="function"?ico("flight",13):"")+'</button>'
    +'</span>'
    +'<button class="cfgmin" id="fleetmin" title="minimize">–</button></div>'
    +'<div class="cfgbody" id="fleetbody"></div>';
  document.body.appendChild(p);
  p.querySelectorAll(".flpre").forEach(function(b){ b.onclick=function(){ var k=b.getAttribute("data-fpre"), ent={};
    if(k==="all"){ UNIVIS.sub={};
      _ents.forEach(function(e){ ent[e]=Object.assign({},_VISDEF); }); __uniApplyVisPreset({ent:ent}); }
    else if(k==="none"){ _ents.forEach(function(e){ ent[e]={show:0}; }); __uniApplyVisPreset({ent:ent}); } }; });
  document.getElementById("fleetmin").onclick=function(){ p.classList.toggle("min"); this.textContent=p.classList.contains("min")?"+":"–"; };
  var side=document.getElementById("flside");                    // the drawer is its OWN container — an add-on beside the fleet, not an extension
  if(!side){ side=document.createElement("div"); side.id="flside";
    side.innerHTML='<div class="flshead"><span class="flstitle" id="flstitle"></span>'
      +'<button class="flsx" id="flscopy" style="display:none" title="copy these settings as JSON — paste them back to adopt an exact configuration">⧉</button>'
      +'<button class="flsx" id="flsclose" title="close — slides back behind the fleet">×</button></div>'
      +'<div class="flsbody" id="flsbody"></div>';
    document.body.appendChild(side);
    document.getElementById("flsclose").onclick=function(){ __uniFlOpen(null); };
    document.getElementById("flscopy").onclick=function(){ var b=this;
      try{ var hx=function(v){ return "#"+("000000"+(v>>>0).toString(16)).slice(-6); };
        var out={ pane:"connections", lineStyle:CFG.lineStyle, curveAmt:(window.__uniCurveAmt!=null?window.__uniCurveAmt:1),
          focusRest:(typeof HL!=="undefined"?HL.rest:null), kinds:{} };
        (typeof CONN_KINDS!=="undefined"?CONN_KINDS:["fk","bridge","calls","imports"]).forEach(function(k){ var c=CONN[k]||{};
          out.kinds[k]={ on:!!(window.__uniBeam[k]==null||window.__uniBeam[k]>0),
            color:hx(c.color||0), style:c.style||"dashed", glow:(window.__uniBeam[k]!=null?window.__uniBeam[k]:1), grad:!!c.grad }; });
        var txt=JSON.stringify(out,null,1);
        window.__uniLastCopy=txt;                                  // proofs + a paste-back fallback read this
        var ok=(typeof copyText==="function")?copyText(txt):false;
        b.textContent=ok?"✓":"⧉"; setTimeout(function(){ b.textContent="⧉"; },900);
      }catch(e){} };
    setInterval(function(){ if(side.classList.contains("out")) __uniFlDock(); }, 300); }   // the fleet drags — the add-on follows
  _dragPanel(p, document.getElementById("fleethead"));
  __uniFleetRender(); };
/* ── the SIDE DRAWER: slides out from behind the fleet square (left→right); minimize/close slide it
   back under. One drawer, per-column content — groups move from the #flstash on open, back on close
   (stashed groups stay in the DOM so their listeners and hover titles never die). ── */
window.__uniFlOpenKey=null;
window.__uniFlDock=function(){ try{ var side=document.getElementById("flside"), fl=document.getElementById("fleet");
  if(!side||!fl) return; var fr=fl.getBoundingClientRect();
  side.style.left=(fr.right+10)+"px"; side.style.top=fr.top+"px";
  side.style.zIndex=String((parseInt(getComputedStyle(fl).zIndex,10)||40)-1);   // BELOW the fleet — the slide comes out from behind it
}catch(e){} };
window.__uniFlOpen=function(key, remount){ try{
  var side=document.getElementById("flside"), bodyEl=document.getElementById("flsbody"),
      title=document.getElementById("flstitle"), stash=document.getElementById("flstash");
  if(!side||!bodyEl) return;
  if(key===window.__uniFlOpenKey && !remount) key=null;                 // same icon again = toggle shut
  if(!key){ window.__uniFlOpenKey=null; side.classList.remove("out");
    if(stash) [].slice.call(bodyEl.children).forEach(function(g){ stash.appendChild(g); });
    document.querySelectorAll("#fleetbody .flhead .flcfgbtn.on").forEach(function(c){ c.classList.remove("on"); });
    return; }
  var pane=(window.__uniFlPanes||{})[key]; if(!pane) return;
  if(stash) [].slice.call(bodyEl.children).forEach(function(g){ stash.appendChild(g); });   // previous pane's groups go home
  title.innerHTML=(typeof ico==="function"?ico(pane.icon,13):"")+pane.title;
  var cpy=document.getElementById("flscopy"); if(cpy) cpy.style.display=(key==="wires")?"":"none";   // copy-settings: Connections only (operator ask)
  var _seen=[]; pane.groups.concat(pane.shared||[]).forEach(function(g){
    if(g && _seen.indexOf(g)<0){ _seen.push(g); bodyEl.appendChild(g); } });
  window.__uniFlOpenKey=key; if(window.__uniFlDock) __uniFlDock(); side.classList.add("out");
  document.querySelectorAll("#fleetbody .flhead .flcfgbtn").forEach(function(c){
    c.classList.toggle("on", c.getAttribute("data-fk")===key); });
}catch(e){} };
window.__uniFleetRender=function(){ var body=document.getElementById("fleetbody"); if(!body) return;
  var h='<div class="flhead"><span class="flent"></span>'+_FCOLS.map(function(c,i){
    var cfgable=(c.k==="planets"||c.k==="show"||c.k==="subs"||c.k==="wires"||c.k==="routes");  // every config now lives here
    return '<span class="flcell'+(cfgable?' flcfgbtn':'')+'" data-fk="'+c.k+'" title="'+c.ti
      +(i>=1?' — key '+i+' toggles it for the SELECTION (nothing selected = all)':'')
      +(cfgable?' · CLICK for its configuration':'')+'">'
      +(typeof ico==="function"?ico(c.icon,13):"")+(i>=1?'<i class="flkey">'+i+'</i>':'')+'</span>'; }).join('')+'</div>';
  h+='<div class="flrow flmaster"><span class="flent">all</span>'+_FCOLS.map(function(c){
    return '<button class="fltog flall" data-fent="*" data-fcol="'+c.k+'" title="'+c.ti+' — all entities"></button>'; }).join('')+'</div>';
  var groups={}; nodes.forEach(function(n){ (groups[n.ent]=groups[n.ent]||{})[n.sub]=(groups[n.ent][n.sub]||0)+1; });
  _ents.forEach(function(e){ var gs=groups[e]||{}, gk=Object.keys(gs).sort(), open=!!_flOpen[e];
    h+='<div class="flrow" data-fle="'+e+'"><span class="flent flx" data-flx="'+e+'" title="'+e+' · click for its '+gk.length+' cluster(s)">'
      +'<i class="fldot" style="background:'+(ENT[e]||"#888")+'"></i><b class="flcnt">'+gk.length+'</b>'+e+'</span>'
      +_FCOLS.map(function(c){ return '<button class="fltog" data-fent="'+e+'" data-fcol="'+c.k+'" title="'+c.ti+'"></button>'; }).join('')+'</div>';
    if(open) gk.forEach(function(s){ var key=e+"|"+s;
      h+='<div class="flrow flsub" data-fle="'+e+'" data-fls="'+s+'"><span class="flent flsubname" title="'+s+' · '+gs[s]+' member(s)"><b class="flcnt">'+gs[s]+'</b>'+s+'</span>'
        +_FCOLS.map(function(c){ if(c.k==="subs") return '<span class="flcell flspacer"></span>';   // a cluster has no sub-clusters
          return '<button class="fltog flstog" data-fent="'+e+'" data-fsub="'+s+'" data-fcol="'+c.k+'" title="'+c.ti+' — cluster '+s+'"></button>'; }).join('')+'</div>'; }); });
  body.innerHTML=h;
  body.querySelectorAll(".flhead .flcfgbtn").forEach(function(cell){ cell.onclick=function(){
    if(window.__uniFlOpen) __uniFlOpen(cell.getAttribute("data-fk")); }; });
  if(window.__uniFlOpenKey){ var oc=body.querySelector('.flhead .flcfgbtn[data-fk="'+window.__uniFlOpenKey+'"]');
    if(oc) oc.classList.add("on"); }
  body.querySelectorAll(".flx").forEach(function(sp){ sp.onclick=function(){
    var e=sp.getAttribute("data-flx"); _flOpen[e]=!_flOpen[e]; __uniFleetRender(); }; });
  body.querySelectorAll(".fltog").forEach(function(b){ b.onclick=function(){
    __uniFleetToggle(b.getAttribute("data-fent"), b.getAttribute("data-fsub"), b.getAttribute("data-fcol")); }; });
  __uniFleetSync();
  if(window.__uniFleetSpotState) __uniFleetSpot(__uniFleetSpotState.ent, __uniFleetSpotState.sub); };
/* ── FLEET SPOT (batch 26): the fleet panel mirrors the selection — the selected entity's row is
   marked; a CLUSTER selection also OPENS its entity's cluster rows and marks the cluster. ── */
window.__uniFleetSpotState=null;
window.__uniFleetSpot=function(ent, sub){ try{
  window.__uniFleetSpotState={ent:ent||null, sub:sub!=null?sub:null};
  if(ent && sub!=null && !_flOpen[ent]){ _flOpen[ent]=1; __uniFleetRender(); return; }   // render re-enters here with the row now present
  var body=document.getElementById("fleetbody"); if(!body) return;
  body.querySelectorAll(".flrow.spot").forEach(function(r){ r.classList.remove("spot"); });
  if(!ent) return;
  var esc=(window.CSS&&CSS.escape)?CSS.escape:function(x){return x;};
  var er=body.querySelector('.flrow[data-fle="'+esc(ent)+'"]:not(.flsub)');
  if(er) er.classList.add("spot");
  var tr=(sub!=null)?body.querySelector('.flrow.flsub[data-fle="'+esc(ent)+'"][data-fls="'+esc(sub)+'"]'):null;
  if(tr) tr.classList.add("spot");
  var f=tr||er; if(f&&f.scrollIntoView) f.scrollIntoView({block:"nearest"});
}catch(e){} };
/* the ONE fleet toggle — clicks and the 1–8 number keys both land here (ent "*" = the ALL row) */
window.__uniFleetToggle=function(ent, sub, col){ try{
  var C=_FCOLS.filter(function(c){ return c.k===col; })[0];
  if(sub!=null && ent!=="*"){ var key=ent+"|"+sub, sv=UNIVIS.sub[key]||(UNIVIS.sub[key]=Object.assign({},_VISDEF));
    sv[col]=sv[col]?0:1; }
  else if(ent==="*"){ var on=!_ents.every(function(e){ return UNIVIS.ent[e][col]; });   // any off → all on; all on → all off
    _ents.forEach(function(e){ UNIVIS.ent[e][col]=on?1:0; });
    Object.keys(UNIVIS.sub).forEach(function(k){ UNIVIS.sub[k][col]=on?1:0; }); }      // the ALL row is a bulk gesture — cluster overrides follow it
  else UNIVIS.ent[ent][col]=UNIVIS.ent[ent][col]?0:1;
  applyVis(C?C.scope:"all"); __uniFleetSync(); }catch(e){} };
window.__uniFleetSync=function(){ var body=document.getElementById("fleetbody"); if(!body) return;
  body.querySelectorAll(".fltog").forEach(function(b){ var ent=b.getAttribute("data-fent"), sub=b.getAttribute("data-fsub"),
    col=b.getAttribute("data-fcol"), C=_FCOLS.filter(function(c){ return c.k===col; })[0];
    if(sub!=null){ b.classList.toggle("on", !!(UNIVIS.sub[ent+"|"+sub]||_VISDEF)[col]);
      b.classList.toggle("mdim", !(C&&C.g()) || !(UNIVIS.ent[ent]||_VISDEF)[col]); return; }   // parent entity off → the cluster switch reads inherited-off (dim)
    if(ent!=="*") b.classList.toggle("on", !!(UNIVIS.ent[ent]||_VISDEF)[col]);
    else b.classList.toggle("on", _ents.every(function(e){ return UNIVIS.ent[e][col]; }));
    b.classList.toggle("mdim", !(C&&C.g())); }); };
var _flOpen={};   // which entity rows are expanded to their clusters

/* re-tab the config into PLANETS | UNIVERSE. The spike's own groups (Container/Show/Transparency/Planet/
   Universe) are already wired by wireCfg — we MOVE their DOM (preserving listeners) into the two panes,
   splitting the 3-row Transparency (bubble→planets, sub/ent→universe), and add the layout controls to Universe. */
window.__uniAddLayoutTab=function(){ var cfg=document.getElementById("cfg"); if(!cfg) return;
  var body=cfg.querySelector(".cfgbody"); if(!body || cfg.querySelector(".cfgtabbar")) return;
  // MOTION play/pause button in the config header (top section) — flips ANIM.all
  var head=cfg.querySelector(".cfghead");
  if(head && !head.querySelector("#motionBtn")){ var mo=document.createElement("button"); mo.className="cfgmin"; mo.id="motionBtn";
    mo.title="pause / resume animations"; mo.style.marginRight="4px"; mo.textContent=ANIM.all?"⏸":"▶";
    mo.onclick=function(){ window.__uniSettleCancel(); ANIM.all=!ANIM.all; mo.textContent=ANIM.all?"⏸":"▶"; mo.classList.toggle("on",!ANIM.all); };   // manual toggle cancels any pending settle auto-resume
    var manch=head.querySelector("#cfgcopy")||head.querySelector("#cfgmin"); if(manch) head.insertBefore(mo, manch); else head.appendChild(mo); }
  var mk=function(cls){ var d=document.createElement("div"); d.className=cls; return d; };
  var grpWith=function(label, child){ var g=mk("grp"); g.innerHTML='<div class="grplbl">'+label+'</div>'; if(child) g.appendChild(child); return g; };
  var pillHTML=function(grp, opts, cur){ var s='<div class="pill" data-grp="'+grp+'">';
    opts.forEach(function(o){ s+='<button data-v="'+o.v+'"'+(o.v===cur?' class="on"':'')+(o.ti?' title="'+o.ti+'"':'')+'>'+(o.ic||'')+o.t+'</button>'; }); return s+'</div>'; };
  // grab the spike's generated groups by label
  var G={}; [].forEach.call(body.querySelectorAll(":scope > .grp"), function(g){ var t=(g.querySelector(".grplbl")||{}).textContent||"";
    if(/Container/i.test(t))G.container=g; else if(/Show/i.test(t))G.show=g; else if(/Transparency/i.test(t))G.transp=g; else if(/Planet/i.test(t))G.planet=g; else if(/Universe/i.test(t))G.universe=g; });
  var trows=G.transp? [].slice.call(G.transp.querySelectorAll(".cfgrow")) : [];   // [bubble, subOp, entOp]

  // ── PLANETS pane: planet transparency (bubble) · Zones (title + inline On/Off master, icons only) ──
  /* CONFIG-INTO-FLEET (operator migration): the Universe tab dissolves into per-column side-panel
     panes — Entity (cube): entity layout · show entity boundary · radius · entity transparency ·
     container · cluster stars · functions | Clusters: core-by · show sub hulls · radius · cluster
     transparency · container | Planets: planet transparency · the Zones master. Radius + container
     are SHARED (one DOM node, both levels) — they ride whichever pane is open. The four per-zone
     buttons are DEPRECATED (gates forced ON; the fleet's zone columns are the only control). */
  CFG.zDef=CFG.zAtk=CFG.zCfl=CFG.zSat=true;
  var planetsPane=[];
  if(trows[0]){ var pt=grpWith("Transparency"); pt.appendChild(trows[0]); planetsPane.push(pt); }
  if(G.planet){ var zlbl=G.planet.querySelector(".grplbl"); zlbl.className="grplbl zoneshd";
    zlbl.innerHTML='<span>Zones</span>'+pillHTML("warOn",[{v:true,t:"On"},{v:false,t:"Off"}], CFG.warOn);   // the master survives; the four icons do not
    var zg=document.createElement("div"); zg.className="grp"; zg.appendChild(zlbl); planetsPane.push(zg); }
  var flyw=document.createElement("div"); flyw.className="flcfgbody";   // (binding container reused below)
  planetsPane.forEach(function(g){ flyw.appendChild(g); })

  // ── the ex-UNIVERSE groups, split per pane (the DOM moves; wireCfg listeners ride along) ──
  var entPane=[], cluPane=[];
  if(G.container){ G.container.querySelectorAll('.pill[data-grp="shape"] button').forEach(function(b){   // icons ONLY (operator) — the word becomes the hover
      var tt=(b.textContent||"").trim(); if(tt) b.title=tt;
      [].slice.call(b.childNodes).forEach(function(nd){ if(nd.nodeType===3 || nd.tagName==="SPAN") b.removeChild(nd); }); });
    var _cl=G.container.querySelector(".grplbl");
    if(_cl){ _cl.title="the boundary shape — applies to entities AND clusters";
      [].slice.call(_cl.querySelectorAll("span")).forEach(function(s){ s.remove(); }); } }
  /* transparency pills (faint/ghost/film) → three opacity DOTS, the word on hover */
  var _opGlyph=function(v){ var op={faint:0.2, ghost:0.5, film:0.85}[v]||0.5;
    return '<svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity="'+op+'" stroke="currentColor" stroke-width="1.5"/></svg>'; };
  [trows[0],trows[1],trows[2]].forEach(function(r){ if(!r) return;   // the rows are detached mid-migration — query THEM, not the document
    r.querySelectorAll(".pill button").forEach(function(b){
      var v=b.getAttribute("data-v"), tt=(b.textContent||"").trim();
      if(tt && /^(faint|ghost|film)$/.test(v||"")){ b.title=tt+" — "+({faint:"barely there",ghost:"soft",film:"solid-ish"}[v]||""); b.innerHTML=_opGlyph(v); } }); });
  var radiusGrp=null, entShowGrp=null, cluShowGrp=null;
  if(G.show){ var entTog=G.show.querySelector('[data-itog="entOn"]'),
      subTog=G.show.querySelector('[data-itog="subOn"]'),
      radRow=document.createElement("div");
    radRow.className="cfgrow";
    ["radMinus","radRng","radPlus"].forEach(function(id){ var el=G.show.querySelector("#"+id); if(el) radRow.appendChild(el); });
    radiusGrp=grpWith("Radius"); radiusGrp.appendChild(radRow);
    var _rl=radiusGrp.querySelector(".grplbl"); if(_rl) _rl.title="applies to entities AND clusters";
    if(entTog){ entShowGrp=grpWith("Show"); var er=document.createElement("div"); er.className="cfgrow"; er.appendChild(entTog); entShowGrp.appendChild(er); }
    if(subTog){ cluShowGrp=grpWith("Show"); var sr=document.createElement("div"); sr.className="cfgrow"; sr.appendChild(subTog); cluShowGrp.appendChild(sr); } }
  var entOpGrp=null, subOpGrp=null;
  if(trows[2]){ entOpGrp=grpWith("Transparency"); entOpGrp.appendChild(trows[2]); }
  if(trows[1]){ subOpGrp=grpWith("Transparency"); subOpGrp.appendChild(trows[1]); }
  var hasLevels=!!(window.GABE_LEVELS && window.GABE_LEVELS.pieces);
  var hasFns=!!(window.GABE_LEVELS && (window.GABE_LEVELS.fn_nodes||[]).length);
  /* the explainers live on HOVER (operator ruling): the section label carries the summary,
     every option carries its own meaning — the note lines below the pills are gone. */
  var cores=[
    {v:"layer",t:"",ic:__uniCoreIco("layer",12),ti:"Layer — group by the kind's architectural layer — endpoints · api · web · data (grows with new kinds)"},
    {v:"kind",t:"",ic:__uniCoreIco("kind",12),ti:"Kind — group by element kind — endpoint · model · schema · function · screen"},
    {v:"tests",t:"",ic:__uniCoreIco("tests",12),ti:"Tests — group by test coverage — tested vs untested"}];
  if(hasLevels) cores.push(
    {v:"guards",t:"",ic:__uniCoreIco("guards",12),ti:"Guards — endpoints by guard status — guarded vs unguarded (levels feed)"},
    {v:"usecase",t:"",ic:__uniCoreIco("usecase",12),ti:"Use-case — group by the use-case flows mapped in the levels feed"},
    {v:"community",t:"",ic:__uniCoreIco("community",12),ti:"Community — group by code community — label propagation over the levels feed"},
    {v:"fk",t:"",ic:__uniCoreIco("fk",12),ti:"FK-join — group by foreign-key join community (levels feed)"});
  var coreHd=hasLevels ? "what forms the clusters INSIDE each entity — nodes physically regroup on change; hover each option"
                       : "what forms the clusters INSIDE each entity — Guards/Use-case/Community/FK-join need the levels feed (not loaded here)";
  var layWrap=document.createElement("div");
  layWrap.innerHTML=
     '<div class="grp"><div class="grplbl" title="where each ENTITY sits in space — hover each option">LAYOUT</div>'
    + pillHTML("entLayout",[
        {v:"chain",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3"/></svg>',ti:"Chain — a flat layered ribbon: layers band vertically, entities line up by coupling"},
        {v:"force",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="7" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M8 9l3 6M15.5 8.5l-2 6.5M8.5 6.7l6-0.5"/></svg>',ti:"Force — 3D coupling bubbles: entities repel, FK springs pull coupled ones together"},
        {v:"ring",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7" stroke-dasharray="2 3"/><circle cx="12" cy="5" r="1.8"/><circle cx="19" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/><circle cx="5" cy="12" r="1.8"/></svg>',ti:"Ring — a coupling-ordered circle: even spacing, separation by construction"}], CFG.entLayout)+'</div>'
    + '<div class="grp"><div class="grplbl" title="'+coreHd+'">CORE</div>'
    + pillHTML("coreBy", cores, CFG.coreBy)+'</div>'
    + (hasFns ? ('<div class="grp"><div class="grplbl" title="the code-function layer — hover each option">FUNCTIONS</div>'
      + pillHTML("showFns",[
          {v:"off",t:"Hide",ti:"endpoints · models · schemas · screens only — the lighter graph"},
          {v:"on",t:"Show",ti:"adds "+window.GABE_LEVELS.fn_nodes.length+" code functions + their call edges (levels feed) — heavier, complete"}], CFG.showFns)+'</div>') : '');
  var _lw=[].slice.call(layWrap.children);                       // [entity layout, core by, (functions)]
  var layGrp=_lw[0]||null, coreGrp=_lw[1]||null, fnGrp=_lw[2]||null;
  if(layGrp) entPane.push(layGrp);
  if(entShowGrp) entPane.push(entShowGrp);
  if(radiusGrp) entPane.push(radiusGrp);
  if(entOpGrp) entPane.push(entOpGrp);
  if(G.container) entPane.push(G.container);
  if(G.universe) entPane.push(G.universe);                        // cluster stars (+ whatever the spike keeps here)
  if(fnGrp) entPane.push(fnGrp);
  if(coreGrp) cluPane.push(coreGrp);
  if(cluShowGrp) cluPane.push(cluShowGrp);
  if(subOpGrp) cluPane.push(subOpGrp);
  window.__uniFlPanes={
    show:{ title:"Entity", icon:"shape", groups:entPane, shared:[radiusGrp, G.container] },
    subs:{ title:"Clusters", icon:"sub", groups:cluPane, shared:[radiusGrp, G.container] },
    planets:{ title:"Planets", icon:"bubble", groups:planetsPane, shared:[] } };
  var _stash=document.getElementById("flstash");
  if(!_stash){ _stash=document.createElement("div"); _stash.id="flstash"; _stash.style.display="none"; document.body.appendChild(_stash); }
  _stash.innerHTML="";
  [entPane, cluPane, planetsPane].forEach(function(gs){ gs.forEach(function(g){ if(g&&g.parentNode!==_stash) _stash.appendChild(g); }); });
  [radiusGrp, G.container].forEach(function(g){ if(g&&g.parentNode!==_stash) _stash.appendChild(g); });
  if(window.__uniFlOpen) try{ __uniFlOpen(window.__uniFlOpenKey||null, true); }catch(e){}

  // ── ROUTES pane: lines (icon pill + curve amount) · per-kind beam · transports + speed ──
  var rt=mk("cfgpane"); rt.style.display="none";
  var LNS='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 20 5"/></svg>';
  var LNC='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 C 8 5 16 5 20 12"/></svg>';
  if(!CONN0 && typeof CONN!=="undefined"){ CONN0={};   // stock snapshot BEFORE any edit (reset target)
    CONN_KINDS.forEach(function(k){ CONN0[k]={color:CONN[k].color, style:CONN[k].style, grad:!!CONN[k].grad}; }); }   // grad rides the snapshot (stock fk/calls ON)
  var _hx=function(c){ return "#"+("00000"+(c).toString(16)).slice(-6); };
  var _sampSVG=function(kind){ var c=(typeof CONN!=="undefined"&&CONN[kind])||{color:0x8794ab,style:"dashed"};
    var d=DASHMAP[c.style]; if(d===undefined) d="6 3";   // sample renders the ACTUAL wire (legend ruling), word on hover
    if(c.grad){ var gid="wg-"+kind;                      // gradient mode: the wire wears its ENDPOINT ENTITY colors — sample shows a generic blend
      return '<svg viewBox="0 0 36 8" width="36" height="8"><defs><linearGradient id="'+gid+'" x1="0" x2="1" y1="0" y2="0">'
        +'<stop offset="0" stop-color="#d9821f"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>'
        +'<path d="M1 4 H35" fill="none" stroke="url(#'+gid+')" stroke-width="2"'+(d?' stroke-dasharray="'+d+'"':'')+'/></svg>'; }
    return '<svg viewBox="0 0 36 8" width="36" height="8"><path d="M1 4 H35" fill="none" stroke="'+_hx(c.color)+'" stroke-width="2"'+(d?' stroke-dasharray="'+d+'"':'')+'/></svg>'; };
  var wireRow=function(kind){ var c=(typeof CONN!=="undefined"&&CONN[kind])||{color:0x8794ab,style:"dashed"};
    var shapes=["solid","dashed","dotted","sparse"].map(function(s){ var d=DASHMAP[s];
      return '<button data-v="'+s+'"'+(s===c.style?' class="on"':'')+' title="'+s+'"><svg viewBox="0 0 20 6" width="13" height="5"><path d="M1 3 H19" fill="none" stroke="currentColor" stroke-width="2"'+(d?' stroke-dasharray="'+d+'"':'')+'/></svg></button>'; }).join('');
    var bOn=(window.__uniBeam[kind]==null||window.__uniBeam[kind]>0);
    return '<div class="cfgrow wkrow" style="gap:4px">'
      +'<button class="wtog'+(bOn?' on':'')+'" data-wtog="'+kind+'" title="show / hide '+kind+' wires">'+(typeof ico==="function"?ico("show",11):"")+'</button>'
      +'<span class="rlbl wsamp" data-wsamp="'+kind+'" title="'+kind+'">'+_sampSVG(kind)+'</span>'
      +'<input type="color" class="wcol" data-wcol="'+kind+'" value="'+_hx(c.color)+'" title="'+kind+' color">'
      +'<div class="pill wshape" data-wshape="'+kind+'">'+shapes+'</div>'
      +'<button class="wgrad'+(c.grad?" on":"")+'" data-wgrad="'+kind+'" title="entity gradient — the wire blends its two endpoint ENTITY colors (the 2D lab device); the dash keeps carrying the kind">'
      +'<svg viewBox="0 0 20 8" width="14" height="6"><defs><linearGradient id="wgb-'+kind+'" x1="0" x2="1"><stop offset="0" stop-color="#d9821f"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><path d="M1 4 H19" stroke="url(#wgb-'+kind+')" stroke-width="3" fill="none"/></svg></button>'
      +'<span class="wglow" title="glow strength — 0 hides · past 1 glows (NOT speed; speed lives in Transports)">✦</span>'
      +'<input type="range" class="rng wbeam" data-beam="'+kind+'" min="0" max="2" step="0.1" value="'+(window.__uniBeam[kind]!=null?window.__uniBeam[kind]:1)+'" title="'+kind+' glow · 0 hides · >1 glows">'
      +'<button class="wreset" data-wreset="'+kind+'" title="reset '+kind+' to stock">&#8634;</button></div>'; };
  rt.innerHTML=
     '<div class="grp"><div class="grplbl">LINES</div>'
    + '<div class="cfgrow" style="gap:6px">'
    + pillHTML("lineStyle",[{v:"straight",t:LNS,ti:"straight"},{v:"curved",t:LNC,ti:"curved"}], CFG.lineStyle)
    + '<input type="range" class="rng" id="curveAmtRng" min="0.2" max="2.5" step="0.1" value="'+window.__uniCurveAmt+'" title="curve amount (when curved)"></div></div>'
    + '<div class="grp"><div class="grplbl" title="applies WHILE a focus highlight is active: select something and these choose what happens to everything OUTSIDE the lit set (clicking one switches a glow highlight to focus).">FOCUS</div>'
    + pillHTML("focusRest",[
        {v:"dim",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.6"/></svg>',ti:"Dim — everything outside the lit set drops to 25%, still readable"},
        {v:"hide",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',ti:"Hide — everything outside the lit set is gone; hulls stay as geography (default)"}], HL.rest)+'</div>'
    + '<div class="grp"><div class="grplbl">WIRE KINDS</div>'
    + wireRow("fk")+wireRow("bridge")+wireRow("calls")+wireRow("imports")+'</div>';
  var tg=grpWith("TRANSPORTS"); var trow=mk("cfgrow"); trow.style.gap="6px";
  var trBtn=G.universe && G.universe.querySelector('[data-itog="transports"]');
  if(trBtn) trow.appendChild(trBtn);                       // DOM-move keeps its wireCfg listener
  trow.insertAdjacentHTML("beforeend",
    '<span class="rlbl" style="width:auto;font-size:10px;text-transform:none;letter-spacing:0">speed</span>'
    +'<input type="range" class="rng" id="trSpeedRng" min="0.05" max="1.2" step="0.05" value="'+((typeof INTC!=="undefined"&&INTC.speed)||0.3)+'">');
  tg.appendChild(trow); rt.appendChild(tg);

  // re-tab
  if(G.transp && G.transp.parentNode) G.transp.parentNode.removeChild(G.transp);   // drop the now-empty shell
  body.innerHTML='';
  var bar=mk("cfgtabbar");
  var note=document.createElement("div"); note.className="cfgnote";
  note.textContent="Every control lives in the FLEET now — click a column icon (cube · clusters · planets · connections · transports) for its panel.";
  body.appendChild(note);                                      // rt stays a detached workbench; its groups leave for the fleet stash below
  // wire the NEW controls only (the moved spike pills keep their wireCfg listeners)
  var _bindRoots=[rt]; entPane.concat(cluPane).concat(planetsPane).forEach(function(g){ if(g) _bindRoots.push(g); });
  _bindRoots.forEach(function(pane){ pane.querySelectorAll(".pill[data-grp]").forEach(function(p){ var grp=p.getAttribute("data-grp");
    if(["warOn","entLayout","coreBy","lineStyle","showFns"].indexOf(grp)<0) return;   // skip the moved spike pills (shape/subOp/entOp)
    p.addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; var v=b.getAttribute("data-v");
      CFG[grp]=(grp==="warOn")?(v==="true"):v; p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x===b); });
      if(grp==="warOn" && G.planet) G.planet.classList.toggle("zonesoff", !CFG.warOn);
      try{ applyCfg(grp); }catch(err){} }); }); });
  // transport speed is a POSITION LADDER now — wired where the Transports pane is assembled below
  var _rAF=null, redraw=function(){ if(_rAF) return; _rAF=requestAnimationFrame(function(){ _rAF=null; try{ updateConnectors(); }catch(e){} }); };
  rt.querySelectorAll('.pill[data-grp="focusRest"] button').forEach(function(b){ b.addEventListener("click", function(){
    HL.rest=b.getAttribute("data-v");
    b.closest(".pill").querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x===b); });
    if(HL.on && HL.mode!=="focus" && window.__uniHLMode) __uniHLMode();       // a FOCUS option while glowing = switch to focus (the buttons BITE now)
    if(HL.on && HL.mode==="focus") _hlRestyle(); }); });
  var car=rt.querySelector("#curveAmtRng");  // curve amount is LIVE while curved (rt is DETACHED — document lookups miss it)
  if(car) car.addEventListener("input", function(){ window.__uniCurveAmt=+this.value; if(window.__uniCurved) redraw(); });
  rt.querySelectorAll("input[data-beam]").forEach(function(s){ s.addEventListener("input", function(){
    window.__uniBeam[s.getAttribute("data-beam")]=+s.value; redraw(); }); });
  /* wire styling: color / shape mutate CONN itself (connectorWire reads it live); the row sample
     and the CONN-derived legend re-render so neither can drift from the drawn wire. */
  var updSamp=function(kind){ var el=document.querySelector('[data-wsamp="'+kind+'"]'); if(el) el.innerHTML=_sampSVG(kind);   // rows live in the DRAWER at runtime
    if(window.__legRender) try{ __legRender(); }catch(e){} };
  rt.querySelectorAll("input[data-wcol]").forEach(function(inp){ inp.addEventListener("input", function(){
    var k=inp.getAttribute("data-wcol"); CONN[k].color=parseInt(inp.value.slice(1),16); updSamp(k); redraw(); }); });
  rt.querySelectorAll(".pill[data-wshape]").forEach(function(p){ p.addEventListener("click", function(e){
    var b=e.target.closest("button"); if(!b) return; var k=p.getAttribute("data-wshape");
    CONN[k].style=b.getAttribute("data-v"); p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on",x===b); });
    updSamp(k); redraw(); }); });
  window.__uniBeamPrev=window.__uniBeamPrev||{};
  rt.querySelectorAll("button[data-wtog]").forEach(function(b){ b.addEventListener("click", function(){
    var k=b.getAttribute("data-wtog"), sl=document.querySelector('input[data-beam="'+k+'"]');
    var on=b.classList.contains("on");
    if(on){ __uniBeamPrev[k]=(window.__uniBeam[k]==null?1:window.__uniBeam[k])||1; window.__uniBeam[k]=0; }
    else { window.__uniBeam[k]=__uniBeamPrev[k]||1; }
    if(sl) sl.value=String(window.__uniBeam[k]);
    b.classList.toggle("on", !on); redraw(); }); });
  rt.querySelectorAll("input[data-beam]").forEach(function(s){ s.addEventListener("input", function(){
    var k=s.getAttribute("data-beam"), tg=document.querySelector('button[data-wtog="'+k+'"]');
    if(tg) tg.classList.toggle("on", +s.value>0); }); });                       // sliding past 0 re-arms the toggle
  rt.querySelectorAll("button[data-wgrad]").forEach(function(b){ b.addEventListener("click", function(){
    var k=b.getAttribute("data-wgrad"); CONN[k].grad=!CONN[k].grad;
    b.classList.toggle("on", !!CONN[k].grad); updSamp(k); redraw(); }); });
  rt.querySelectorAll("button[data-wreset]").forEach(function(b){ b.addEventListener("click", function(){
    var k=b.getAttribute("data-wreset"); if(CONN0&&CONN0[k]){ CONN[k].color=CONN0[k].color; CONN[k].style=CONN0[k].style;
      CONN[k].grad=!!CONN0[k].grad; }                                          // stock carries grad now (fk/calls default ON) — reset RESTORES it
    var gb=document.querySelector('button[data-wgrad="'+k+'"]'); if(gb) gb.classList.toggle("on", !!CONN[k].grad);
    var inp=document.querySelector('[data-wcol="'+k+'"]'); if(inp) inp.value=_hx(CONN[k].color);
    var p=document.querySelector('.pill[data-wshape="'+k+'"]'); if(p) p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x.getAttribute("data-v")===CONN[k].style); });
    updSamp(k); redraw(); }); });
  /* the ROUTES estate splits: transports (toggle + speed) → the TRANSPORT pane; everything else
     (lines · curve · focus · wire kinds · beams) → the CONNECTIONS pane. Bindings above already
     attached to the elements, so the move is free. */
  var transGrp=null, connGrps=[];
  [].slice.call(rt.children).forEach(function(g){
    if(g.querySelector && (g.querySelector("#trSpeedRng")||g.querySelector('[data-itog="transports"]'))) transGrp=g;
    else connGrps.push(g); });
  window.__uniFlPanes.wires={ title:"Connections", icon:"radius", groups:connGrps, shared:[] };
  if(transGrp){ var _tl=transGrp.querySelector(".grplbl"); if(_tl) _tl.remove();   // the pane title already says Transports
    var _ts=transGrp.querySelector("#trSpeedRng");
    if(_ts && !transGrp.querySelector("#trMinus")){
      /* the SPEED LADDER (operator spec): 7 positions, 0 = the default (two levels below the old
         0.3), 2 stops left · 4 right, ×√2 per stop → 0.05 · 0.07 · 0.1 · 0.14 · 0.2 · 0.28 · 0.4.
         The thumb is a numbered DOT (badge rides the thumb; the native thumb goes transparent). */
      _ts.min="-2"; _ts.max="4"; _ts.step="1"; _ts.value="0";
      var SPD=function(pos){ return +(0.1*Math.pow(Math.SQRT2,pos)).toFixed(3); };
      var wrapEl=document.createElement("span"); wrapEl.className="spdwrap";
      _ts.parentNode.insertBefore(wrapEl,_ts); wrapEl.appendChild(_ts);
      var badge=document.createElement("span"); badge.className="spdbadge"; badge.id="trSpdBadge"; wrapEl.appendChild(badge);
      var upd=function(){ var pos=+_ts.value, sp=SPD(pos);
        if(typeof INTC!=="undefined") INTC.speed=sp;
        badge.textContent=String(+sp.toFixed(2));
        var f=(pos+2)/6; badge.style.left="calc("+(f*100)+"% + "+((0.5-f)*22).toFixed(1)+"px)"; };
      _ts.addEventListener("input", upd);
      var _mk=function(id,txt,ti){ var b=document.createElement("button"); b.className="stp"; b.id=id; b.textContent=txt; b.title=ti; return b; };
      var m=_mk("trMinus","–","slower (one stop)"), pl=_mk("trPlus","+","faster (one stop)");
      wrapEl.parentNode.insertBefore(m,wrapEl); wrapEl.parentNode.insertBefore(pl,wrapEl.nextSibling);
      var _step=function(d){ _ts.value=String(Math.max(-2, Math.min(4, (+_ts.value)+d))); _ts.dispatchEvent(new Event("input")); };
      m.onclick=function(){ _step(-1); }; pl.onclick=function(){ _step(1); };
      upd(); } }
  window.__uniFlPanes.routes={ title:"Transports", icon:"truck", groups:transGrp?[transGrp]:[], shared:[] };
  var _st2=document.getElementById("flstash");
  if(_st2) connGrps.concat(transGrp?[transGrp]:[]).forEach(function(g){ _st2.appendChild(g); });
};
