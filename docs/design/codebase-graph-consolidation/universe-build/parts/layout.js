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
    order.forEach(function(e,i){ EX[e]=n<=1?0:(-450+i*(900/(n-1))); EY[e]=0; EZ[e]=0; });   // 900 span (was 600) — entity columns stop overlapping
    return;
  }
  __chainMode=false;
  var P={}, V={};                                        // seed on a deterministic Fibonacci sphere
  _ents.forEach(function(s,i){ var y=(n<=1)?0:(1-(i/(n-1))*2), r=Math.sqrt(Math.max(0,1-y*y)), th=i*2.399963;
    P[s]={x:Math.cos(th)*r*300, y:y*300, z:Math.sin(th)*r*300}; V[s]={x:0,y:0,z:0}; });
  if(mode==="spread"){                                   // stress-majorization (MDS) over BFS hop distance
    var adj={}; _ents.forEach(function(s){ adj[s]=[]; });
    _l1pairs().forEach(function(p){ adj[p[0]].push(p[1]); adj[p[1]].push(p[0]); });
    var HOP={}; _ents.forEach(function(s){ var d={}, q=[s]; d[s]=0;
      while(q.length){ var u=q.shift(); adj[u].forEach(function(v){ if(d[v]===undefined){ d[v]=d[u]+1; q.push(v); } }); } HOP[s]=d; });
    var far=1; _ents.forEach(function(a){ _ents.forEach(function(b){ if((HOP[a][b]||0)>far) far=HOP[a][b]; }); });
    for(var st=0; st<200; st++){ _ents.forEach(function(a){ var mx=0,my=0,mz=0,ws=0;
      _ents.forEach(function(b){ if(a===b) return; var hop=(HOP[a][b]!==undefined)?HOP[a][b]:far+1, target=hop*170;
        var dx=P[a].x-P[b].x, dy=P[a].y-P[b].y, dz=P[a].z-P[b].z, d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1, w=1/(hop*hop);
        mx+=w*(P[b].x+dx/d*target); my+=w*(P[b].y+dy/d*target); mz+=w*(P[b].z+dz/d*target); ws+=w; });
      P[a]={x:mx/ws,y:my/ws,z:mz/ws}; }); }
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
  var SEP=1.55;   // widen the converged anchors — hulls read as distinct bubbles (the containment in zForce holds each cluster inside its radius)
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
    var SR=Math.min(RENT[e]*0.55, 26+7*ks.length);
    ks.forEach(function(k,i){ var a=ei*0.7 + i*(Math.PI*2/ks.length);            // per-entity phase stagger — rings don't all align
      m[k]={ x:Math.cos(a)*SR, y:__chainMode?0:(((i%2)?1:-1)*SR*0.22), z:Math.sin(a)*SR }; }); });
}
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
    else n.sub=SUBOF[n.layer]||"data"; }); }

/* ── FUNCTIONS layer (from GABE_LEVELS.fn_nodes + fn_edges) — toggled in/out of the graph ── */
var _FNNODES=null, _FNLINKS=null, _fnsOn=false;
function _buildFnData(){ var D=window.GABE_LEVELS; if(!D||!D.fn_nodes||!KINDS["function"]){ _FNNODES=[]; _FNLINKS=[]; return; }
  _FNNODES=D.fn_nodes.map(function(f){ var beh=f.behind||{};
    return { id:f.id, kind:"function", ent:f.slug, label:f.name, col:KINDS["function"].col, K:KINDS["function"],
      layer:KINDS["function"].layer, sub:SUBOF[KINDS["function"].layer]||"data", __fn:true,
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
window.__uniCurveAmt=1;                                   // curve-amount slider → arc height multiplier (read by __uniCurve)
window.__uniBeam={ fk:1, bridge:1, calls:1, imports:1 };  // per-kind wire beam: 0 hides, 1 stock, >1 glows (additive) — read by connectorWire
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
function __uniSetupOrbit(){ var g=document.getElementById("g"); if(!g || g.__orbitBound) return; g.__orbitBound=true; var drag=null;
  g.addEventListener("pointerdown", function(ev){ if(ev.button!==0) return;
    try{ var cam=Graph.camera(), ctrls=Graph.controls(); if(!cam||!ctrls||!ctrls.target) return;
      var r=g.getBoundingClientRect(), mx=((ev.clientX-r.left)/r.width)*2-1, my=-((ev.clientY-r.top)/r.height)*2+1;
      var rc=new T.Raycaster(); rc.setFromCamera({x:mx,y:my}, cam);
      var vdir=new T.Vector3(); cam.getWorldDirection(vdir);
      var plane=new T.Plane().setFromNormalAndCoplanarPoint(vdir, ctrls.target), P=new T.Vector3();
      if(!rc.ray.intersectPlane(plane, P)) return;
      drag={ P:P, lx:ev.clientX, ly:ev.clientY }; ctrls.enabled=false; window.__uniDragging=true;   // custom rotation owns this drag; a settle mid-drag defers its resume
      if(ANIM.freezeOnDrag && ANIM.all){ _dragWasPlaying=true; ANIM.all=false; }
    }catch(e){} }, true);
  window.addEventListener("pointermove", function(ev){ if(!drag) return;
    try{ var cam=Graph.camera(), ctrls=Graph.controls();
      var dx=ev.clientX-drag.lx, dy=ev.clientY-drag.ly; drag.lx=ev.clientX; drag.ly=ev.clientY;
      var up=new T.Vector3(0,1,0);
      var right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion).normalize();    // the camera's own right axis (from its orientation)
      var vdir=new T.Vector3().subVectors(cam.position, ctrls.target).normalize();
      _rotRig(cam, ctrls.target, drag.P, up, -dx*0.006);                             // azimuth around world-up through P
      var nd=vdir.clone().applyAxisAngle(right, -dy*0.006);                          // polar around camera-right (clamp near vertical to avoid a flip)
      if(Math.abs(nd.y)<0.985) _rotRig(cam, ctrls.target, drag.P, right, -dy*0.006);
    }catch(e){} });
  window.addEventListener("pointerup", function(){
    if(drag){ var ctrls=Graph.controls(); drag=null; window.__uniDragging=false; if(ctrls){ ctrls.enabled=true; try{ ctrls.update(); }catch(e){} } }
    if(_dragWasPlaying){ _dragWasPlaying=false; ANIM.all=true; var mb=document.getElementById("motionBtn"); if(mb){ mb.textContent="⏸"; mb.classList.remove("on"); } }
    if(window.__uniSettleDone) window.__uniSettleDone(); });   // release a resume the settle deferred mid-drag (no-op otherwise)
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

/* ══ FLEET panel (batch 11-B) — per-entity visibility + ops matrix; the in-flight diagram's seed ══
   State contract: UNIVIS{ent,node,meta}. node/meta are RESERVED for the in-flight batch — GABE_SIM
   keys its stages by piece id and the universe node ids are the SAME strings, so a later per-piece
   join is direct. ALL engine seams read through visEnt/visN — the ONE place a "dim" tri-state and
   per-piece roles land later. An unknown entity resolves to SHOWN (l2-only entities never vanish). */
var _VISDEF={ show:1, subs:1, zDef:1, zAtk:1, zCfl:1, zSat:1, routes:1 };
window.UNIVIS={ ent:{}, sub:{}, node:{}, meta:{} };   // sub = per-(ent|subgroup) overrides — keys are CURRENT-coreBy groups, regrouped on a core change
_ents.forEach(function(e){ UNIVIS.ent[e]=Object.assign({},_VISDEF); });
function visEnt(slug){ return UNIVIS.ent[slug]||_VISDEF; }
/* effective per-node: node override wins; else the entity flags AND the node's sub-group flags —
   a sub-cluster is visible/armed only when its entity is too (the panel refines downward). */
function visN(n){ var o=n&&UNIVIS.node[n.id]; if(o) return o;
  var ev=visEnt(n&&n.ent), sv=(n&&n.sub!=null)?UNIVIS.sub[n.ent+"|"+n.sub]:null;
  if(!sv) return ev;
  return { show:(ev.show&&sv.show)?1:0, subs:ev.subs,
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
  if(all||s.nodes){ try{ Graph.nodeVisibility(function(n){ return !!visN(n).show; }); }catch(e){}
    try{ Graph.linkVisibility(linkVisFn); }catch(e){} }              // dormant while conns is baked on — future-proofing
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
  { k:"show",   ti:"show entity",         scope:"nodes",    icon:"show",   g:function(){ return true; } },
  { k:"subs",   ti:"sub-cluster hulls",   scope:"clusters", icon:"sub",    g:function(){ return !!CFG.subOn; } },
  { k:"zDef",   ti:"defense fleet",       scope:"zones",    icon:"shield", g:function(){ return !!(CFG.warOn&&CFG.zDef); } },
  { k:"zAtk",   ti:"attack fleet",        scope:"zones",    icon:"swords", g:function(){ return !!(CFG.warOn&&CFG.zAtk); } },
  { k:"zCfl",   ti:"conflict effects",    scope:"zones",    icon:"burst",  g:function(){ return !!(CFG.warOn&&CFG.zCfl); } },
  { k:"zSat",   ti:"satellites",          scope:"zones",    icon:"target", g:function(){ return !!(CFG.warOn&&CFG.zSat); } },
  { k:"routes", ti:"transports (routes)", scope:"routes",   icon:"truck",  g:function(){ return !!CFG.transports; } } ];
window.__uniBuildFleet=function(){ if(document.getElementById("fleet")) return;
  var p=document.createElement("div"); p.className="cfg fleet"; p.id="fleet";
  p.innerHTML='<div class="cfghead" id="fleethead"><span class="cfgtitle">'+(typeof ico==="function"?ico("shape",13):"")+'Fleet</span>'
    +'<button class="cfgmin" id="fleetmin" title="minimize">–</button></div><div class="cfgbody" id="fleetbody"></div>';
  document.body.appendChild(p);
  document.getElementById("fleetmin").onclick=function(){ p.classList.toggle("min"); this.textContent=p.classList.contains("min")?"+":"–"; };
  _dragPanel(p, document.getElementById("fleethead"));
  __uniFleetRender(); };
window.__uniFleetRender=function(){ var body=document.getElementById("fleetbody"); if(!body) return;
  var h='<div class="flhead"><span class="flent"></span>'+_FCOLS.map(function(c){
    return '<span class="flcell" title="'+c.ti+'">'+(typeof ico==="function"?ico(c.icon,13):"")+'</span>'; }).join('')+'</div>';
  /* presets: All/None live via the SAME preset entry point the in-flight batch will use; the
     In-flight stub ships DISABLED with the honest-empty reason (undefined = no feed on this page ·
     null = feed at rest, no change in flight · object = the derivation lands in a later batch). */
  var _simTitle=(typeof window.GABE_SIM==="undefined") ? "no sim feed on this page (sim.data.js absent)"
    : (window.GABE_SIM===null ? "no change in flight (sim feed at rest)" : "a change IS in flight — the preset derivation lands in a later batch");
  h+='<div class="flrow flpresets"><button class="flpre" data-fpre="all">All</button>'
    +'<button class="flpre" data-fpre="none">None</button>'
    +'<button class="flpre" data-fpre="inflight" disabled title="'+_simTitle+'">In-flight</button></div>';
  h+='<div class="flrow flmaster"><span class="flent">all</span>'+_FCOLS.map(function(c){
    return '<button class="fltog flall" data-fent="*" data-fcol="'+c.k+'" title="'+c.ti+' — all entities"></button>'; }).join('')+'</div>';
  var groups={}; nodes.forEach(function(n){ (groups[n.ent]=groups[n.ent]||{})[n.sub]=(groups[n.ent][n.sub]||0)+1; });
  _ents.forEach(function(e){ var gs=groups[e]||{}, gk=Object.keys(gs).sort(), open=!!_flOpen[e];
    h+='<div class="flrow"><span class="flent flx" data-flx="'+e+'" title="'+e+' · click for its '+gk.length+' cluster(s)">'
      +'<i class="fldot" style="background:'+(ENT[e]||"#888")+'"></i><i class="flcaret">'+(open?"▾":"▸")+'</i>'+e
      +'<b class="flcnt">'+gk.length+'</b></span>'
      +_FCOLS.map(function(c){ return '<button class="fltog" data-fent="'+e+'" data-fcol="'+c.k+'" title="'+c.ti+'"></button>'; }).join('')+'</div>';
    if(open) gk.forEach(function(s){ var key=e+"|"+s;
      h+='<div class="flrow flsub"><span class="flent flsubname" title="'+s+' · '+gs[s]+' member(s)">'+s+' <b class="flcnt">'+gs[s]+'</b></span>'
        +_FCOLS.map(function(c){ if(c.k==="subs") return '<span class="flcell flspacer"></span>';   // a cluster has no sub-clusters
          return '<button class="fltog flstog" data-fent="'+e+'" data-fsub="'+s+'" data-fcol="'+c.k+'" title="'+c.ti+' — cluster '+s+'"></button>'; }).join('')+'</div>'; }); });
  body.innerHTML=h;
  body.querySelectorAll(".flx").forEach(function(sp){ sp.onclick=function(){
    var e=sp.getAttribute("data-flx"); _flOpen[e]=!_flOpen[e]; __uniFleetRender(); }; });
  body.querySelectorAll(".fltog").forEach(function(b){ b.onclick=function(){
    var ent=b.getAttribute("data-fent"), sub=b.getAttribute("data-fsub"), col=b.getAttribute("data-fcol"),
        C=_FCOLS.filter(function(c){ return c.k===col; })[0];
    if(sub!=null){ var key=ent+"|"+sub, sv=UNIVIS.sub[key]||(UNIVIS.sub[key]=Object.assign({},_VISDEF));
      sv[col]=sv[col]?0:1; }
    else if(ent==="*"){ var on=!_ents.every(function(e){ return UNIVIS.ent[e][col]; });   // any off → all on; all on → all off
      _ents.forEach(function(e){ UNIVIS.ent[e][col]=on?1:0; });
      Object.keys(UNIVIS.sub).forEach(function(k){ UNIVIS.sub[k][col]=on?1:0; }); }   // the ALL row is a bulk gesture — cluster overrides follow it
    else UNIVIS.ent[ent][col]=UNIVIS.ent[ent][col]?0:1;
    applyVis(C?C.scope:"all"); __uniFleetSync(); }; });
  body.querySelectorAll(".flpre").forEach(function(b){ b.onclick=function(){ var k=b.getAttribute("data-fpre"), ent={};
    if(k==="all"){ UNIVIS.sub={};   // All = truly everything — cluster overrides reset too
      _ents.forEach(function(e){ ent[e]=Object.assign({},_VISDEF); }); __uniApplyVisPreset({ent:ent}); }
    else if(k==="none"){ _ents.forEach(function(e){ ent[e]={show:0}; }); __uniApplyVisPreset({ent:ent}); } }; });
  __uniFleetSync(); };
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
    opts.forEach(function(o){ s+='<button data-v="'+o.v+'"'+(o.v===cur?' class="on"':'')+(o.ti?' title="'+o.ti+'"':'')+'>'+o.t+'</button>'; }); return s+'</div>'; };
  // grab the spike's generated groups by label
  var G={}; [].forEach.call(body.querySelectorAll(":scope > .grp"), function(g){ var t=(g.querySelector(".grplbl")||{}).textContent||"";
    if(/Container/i.test(t))G.container=g; else if(/Show/i.test(t))G.show=g; else if(/Transparency/i.test(t))G.transp=g; else if(/Planet/i.test(t))G.planet=g; else if(/Universe/i.test(t))G.universe=g; });
  var trows=G.transp? [].slice.call(G.transp.querySelectorAll(".cfgrow")) : [];   // [bubble, subOp, entOp]

  // ── PLANETS pane: planet transparency (bubble) · Zones (title + inline On/Off master, icons only) ──
  var pl=mk("cfgpane");
  if(trows[0]){ var pt=grpWith("Transparency"); pt.appendChild(trows[0]); pl.appendChild(pt); }
  if(G.planet){ var zlbl=G.planet.querySelector(".grplbl"); zlbl.className="grplbl zoneshd";
    zlbl.innerHTML='<span>Zones</span>'+pillHTML("warOn",[{v:true,t:"On"},{v:false,t:"Off"}], CFG.warOn);   // master on/off inline with the title
    G.planet.classList.toggle("zonesoff", !CFG.warOn);                                                     // dim the zone icons when the master is off
    pl.appendChild(G.planet); }

  // ── UNIVERSE pane: container · sub-cluster + radius · cluster transparency · stars · layout ──
  var uni=mk("cfgpane"); uni.style.display="none";
  if(G.container) uni.appendChild(G.container);
  if(G.show) uni.appendChild(G.show);
  if(trows[1]||trows[2]){ var ct=grpWith("Cluster transparency"); if(trows[1])ct.appendChild(trows[1]); if(trows[2])ct.appendChild(trows[2]); uni.appendChild(ct); }
  if(G.universe) uni.appendChild(G.universe);   // transports itog migrates to ROUTES below; stars stay here
  var hasLevels=!!(window.GABE_LEVELS && window.GABE_LEVELS.pieces);
  var hasFns=!!(window.GABE_LEVELS && (window.GABE_LEVELS.fn_nodes||[]).length);
  /* the explainers live on HOVER (operator ruling): the section label carries the summary,
     every option carries its own meaning — the note lines below the pills are gone. */
  var cores=[
    {v:"layer",t:"Layer",ti:"group by architectural layer — api · frontend · data"},
    {v:"kind",t:"Kind",ti:"group by element kind — endpoint · model · schema · function · screen"},
    {v:"tests",t:"Tests",ti:"group by test coverage — tested vs untested"}];
  if(hasLevels) cores.push(
    {v:"guards",t:"Guards",ti:"endpoints by guard status — guarded vs unguarded (levels feed)"},
    {v:"usecase",t:"Use-case",ti:"group by the use-case flows mapped in the levels feed"},
    {v:"community",t:"Community",ti:"group by code community — label propagation over the levels feed"},
    {v:"fk",t:"FK-join",ti:"group by foreign-key join community (levels feed)"});
  var coreHd=hasLevels ? "what forms the clusters INSIDE each entity — nodes physically regroup on change; hover each option"
                       : "what forms the clusters INSIDE each entity — Guards/Use-case/Community/FK-join need the levels feed (not loaded here)";
  var layWrap=mk("uniLay");
  layWrap.innerHTML=
     '<div class="grp"><div class="grplbl" title="where each ENTITY sits in space — hover each option">ENTITY LAYOUT</div>'
    + pillHTML("entLayout",[
        {v:"chain",t:"Chain",ti:"a flat layered ribbon — layers band vertically, entities line up by coupling"},
        {v:"force",t:"Force",ti:"3D coupling bubbles — entities repel, FK springs pull coupled ones together"},
        {v:"spread",t:"Spread",ti:"graph-distance spacing — entities placed by hop distance (MDS)"}], CFG.entLayout)+'</div>'
    + '<div class="grp"><div class="grplbl" title="'+coreHd+'">CLUSTER CORE BY</div>'
    + pillHTML("coreBy", cores, CFG.coreBy)+'</div>'
    + (hasFns ? ('<div class="grp"><div class="grplbl" title="the code-function layer — hover each option">FUNCTIONS</div>'
      + pillHTML("showFns",[
          {v:"off",t:"Hide",ti:"endpoints · models · schemas · screens only — the lighter graph"},
          {v:"on",t:"Show",ti:"adds "+window.GABE_LEVELS.fn_nodes.length+" code functions + their call edges (levels feed) — heavier, complete"}], CFG.showFns)+'</div>') : '');
  while(layWrap.firstChild) uni.appendChild(layWrap.firstChild);

  // ── ROUTES pane: lines (icon pill + curve amount) · per-kind beam · transports + speed ──
  var rt=mk("cfgpane"); rt.style.display="none";
  var LNS='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 20 5"/></svg>';
  var LNC='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 C 8 5 16 5 20 12"/></svg>';
  if(!CONN0 && typeof CONN!=="undefined"){ CONN0={};   // stock snapshot BEFORE any edit (reset target)
    CONN_KINDS.forEach(function(k){ CONN0[k]={color:CONN[k].color, style:CONN[k].style}; }); }
  var _hx=function(c){ return "#"+("00000"+(c).toString(16)).slice(-6); };
  var _sampSVG=function(kind){ var c=(typeof CONN!=="undefined"&&CONN[kind])||{color:0x8794ab,style:"dashed"};
    var d=DASHMAP[c.style]; if(d===undefined) d="6 3";   // sample renders the ACTUAL wire (legend ruling), word on hover
    return '<svg viewBox="0 0 36 8" width="36" height="8"><path d="M1 4 H35" fill="none" stroke="'+_hx(c.color)+'" stroke-width="2"'+(d?' stroke-dasharray="'+d+'"':'')+'/></svg>'; };
  var wireRow=function(kind){ var c=(typeof CONN!=="undefined"&&CONN[kind])||{color:0x8794ab,style:"dashed"};
    var shapes=["solid","dashed","dotted","sparse"].map(function(s){ var d=DASHMAP[s];
      return '<button data-v="'+s+'"'+(s===c.style?' class="on"':'')+' title="'+s+'"><svg viewBox="0 0 20 6" width="16" height="6"><path d="M1 3 H19" fill="none" stroke="currentColor" stroke-width="2"'+(d?' stroke-dasharray="'+d+'"':'')+'/></svg></button>'; }).join('');
    return '<div class="cfgrow" style="gap:5px"><span class="rlbl wsamp" data-wsamp="'+kind+'" style="width:36px" title="'+kind+'">'+_sampSVG(kind)+'</span>'
      +'<input type="color" class="wcol" data-wcol="'+kind+'" value="'+_hx(c.color)+'" title="'+kind+' color">'
      +'<div class="pill wshape" data-wshape="'+kind+'">'+shapes+'</div>'
      +'<button class="wreset" data-wreset="'+kind+'" title="reset '+kind+' to stock">&#8634;</button></div>'
      +'<div class="cfgrow" style="gap:6px;margin-bottom:7px"><input type="range" class="rng" data-beam="'+kind+'" min="0" max="2" step="0.1" value="'+(window.__uniBeam[kind]!=null?window.__uniBeam[kind]:1)+'" title="'+kind+' beam · 0 hides · >1 glows"></div>'; };
  rt.innerHTML=
     '<div class="grp"><div class="grplbl">LINES</div>'
    + '<div class="cfgrow" style="gap:6px">'
    + pillHTML("lineStyle",[{v:"straight",t:LNS,ti:"straight"},{v:"curved",t:LNC,ti:"curved"}], CFG.lineStyle)
    + '<input type="range" class="rng" id="curveAmtRng" min="0.2" max="2.5" step="0.1" value="'+window.__uniCurveAmt+'" title="curve amount (when curved)"></div></div>'
    + '<div class="grp"><div class="grplbl">WIRE KINDS</div>'
    + wireRow("fk")+wireRow("bridge")+wireRow("calls")+wireRow("imports")
    + '<div style="font-size:10px;color:var(--muted);margin-top:2px">per kind: sample · color · shape · beam (0 hides · past 1 glows)</div></div>';
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
  bar.innerHTML='<button class="cfgtab on" data-pane="planets">Planets</button><button class="cfgtab" data-pane="universe">Universe</button><button class="cfgtab" data-pane="routes">Routes</button>';
  body.appendChild(bar); body.appendChild(pl); body.appendChild(uni); body.appendChild(rt);
  var PANES={ planets:pl, universe:uni, routes:rt };
  bar.querySelectorAll(".cfgtab").forEach(function(t){ t.onclick=function(){ var pane=t.getAttribute("data-pane");
    bar.querySelectorAll(".cfgtab").forEach(function(x){ x.classList.toggle("on", x===t); });
    Object.keys(PANES).forEach(function(k){ PANES[k].style.display=(k===pane)?"":"none"; }); }; });
  // wire the NEW controls only (the moved spike pills keep their wireCfg listeners)
  [pl, uni, rt].forEach(function(pane){ pane.querySelectorAll(".pill[data-grp]").forEach(function(p){ var grp=p.getAttribute("data-grp");
    if(["warOn","entLayout","coreBy","lineStyle","showFns"].indexOf(grp)<0) return;   // skip the moved spike pills (shape/subOp/entOp)
    p.addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; var v=b.getAttribute("data-v");
      CFG[grp]=(grp==="warOn")?(v==="true"):v; p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x===b); });
      if(grp==="warOn" && G.planet) G.planet.classList.toggle("zonesoff", !CFG.warOn);
      try{ applyCfg(grp); }catch(err){} }); }); });
  var tsr=document.getElementById("trSpeedRng");   // transport-speed slider → INTC.speed (read live by tickTransports)
  if(tsr) tsr.addEventListener("input", function(){ if(typeof INTC!=="undefined") INTC.speed=+this.value; });
  var _rAF=null, redraw=function(){ if(_rAF) return; _rAF=requestAnimationFrame(function(){ _rAF=null; try{ updateConnectors(); }catch(e){} }); };
  var car=document.getElementById("curveAmtRng");  // curve amount is LIVE while curved (rAF-debounced full connector redraw)
  if(car) car.addEventListener("input", function(){ window.__uniCurveAmt=+this.value; if(window.__uniCurved) redraw(); });
  rt.querySelectorAll("input[data-beam]").forEach(function(s){ s.addEventListener("input", function(){
    window.__uniBeam[s.getAttribute("data-beam")]=+s.value; redraw(); }); });
  /* wire styling: color / shape mutate CONN itself (connectorWire reads it live); the row sample
     and the CONN-derived legend re-render so neither can drift from the drawn wire. */
  var updSamp=function(kind){ var el=rt.querySelector('[data-wsamp="'+kind+'"]'); if(el) el.innerHTML=_sampSVG(kind);
    if(window.__legRender) try{ __legRender(); }catch(e){} };
  rt.querySelectorAll("input[data-wcol]").forEach(function(inp){ inp.addEventListener("input", function(){
    var k=inp.getAttribute("data-wcol"); CONN[k].color=parseInt(inp.value.slice(1),16); updSamp(k); redraw(); }); });
  rt.querySelectorAll(".pill[data-wshape]").forEach(function(p){ p.addEventListener("click", function(e){
    var b=e.target.closest("button"); if(!b) return; var k=p.getAttribute("data-wshape");
    CONN[k].style=b.getAttribute("data-v"); p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on",x===b); });
    updSamp(k); redraw(); }); });
  rt.querySelectorAll("button[data-wreset]").forEach(function(b){ b.addEventListener("click", function(){
    var k=b.getAttribute("data-wreset"); if(CONN0&&CONN0[k]){ CONN[k].color=CONN0[k].color; CONN[k].style=CONN0[k].style; }
    var inp=rt.querySelector('[data-wcol="'+k+'"]'); if(inp) inp.value=_hx(CONN[k].color);
    var p=rt.querySelector('.pill[data-wshape="'+k+'"]'); if(p) p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x.getAttribute("data-v")===CONN[k].style); });
    updSamp(k); redraw(); }); });
};
