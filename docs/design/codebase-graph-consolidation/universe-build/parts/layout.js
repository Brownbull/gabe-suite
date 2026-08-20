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
}
/* LINES — moved off the topbar into the config; sets the curved-connector flag + redraws */
function __uniSetCurve(on){ window.__uniCurved=!!on; try{ updateConnectors(); }catch(e){} }
window.__uniCurveAmt=1;                                   // curve-amount slider → arc height multiplier (read by __uniCurve)
window.__uniBeam={ fk:1, bridge:1, calls:1, imports:1 };  // per-kind wire beam: 0 hides, 1 stock, >1 glows (additive) — read by connectorWire
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
  var cores=[{v:"layer",t:"Layer"},{v:"kind",t:"Kind"},{v:"tests",t:"Tests"}];
  if(hasLevels) cores.push({v:"guards",t:"Guards"},{v:"usecase",t:"Use-case"},{v:"community",t:"Community"},{v:"fk",t:"FK-join"});
  var coreNote=hasLevels ? "Guards / Use-case / Community / FK-join joined from the levels feed by name"
                         : "Guards / Use-case / Community / FK-join need the levels feed (not loaded here)";
  var layWrap=mk("uniLay");
  layWrap.innerHTML=
     '<div class="grp"><div class="grplbl">ENTITY LAYOUT</div>'
    + pillHTML("entLayout",[{v:"chain",t:"Chain"},{v:"force",t:"Force"},{v:"spread",t:"Spread"}], CFG.entLayout)
    + '<div style="font-size:10px;color:var(--muted);margin-top:4px">chain = layered plane · force = coupling bubbles · spread = graph-distance</div></div>'
    + '<div class="grp"><div class="grplbl">CLUSTER CORE BY</div>'
    + pillHTML("coreBy", cores, CFG.coreBy)
    + '<div style="font-size:10px;color:var(--muted);margin-top:4px">'+coreNote+'</div></div>'
    + (hasFns ? ('<div class="grp"><div class="grplbl">FUNCTIONS</div>'
      + pillHTML("showFns",[{v:"off",t:"Hide"},{v:"on",t:"Show"}], CFG.showFns)
      + '<div style="font-size:10px;color:var(--muted);margin-top:4px">'+window.GABE_LEVELS.fn_nodes.length+' code functions + call edges from the levels feed</div></div>') : '');
  while(layWrap.firstChild) uni.appendChild(layWrap.firstChild);

  // ── ROUTES pane: lines (icon pill + curve amount) · per-kind beam · transports + speed ──
  var rt=mk("cfgpane"); rt.style.display="none";
  var LNS='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 20 5"/></svg>';
  var LNC='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 C 8 5 16 5 20 12"/></svg>';
  var beamRow=function(kind){ var c=(typeof CONN!=="undefined"&&CONN[kind])||{color:0x8794ab,style:"dashed"};
    var col="#"+("00000"+(c.color).toString(16)).slice(-6), dash=(c.style==="dotted")?"1.5 3.5":"6 3";
    return '<div class="cfgrow" style="gap:6px"><span class="rlbl" style="width:36px" title="'+kind+'">'   // legend rule: the ACTUAL wire drawn, word on hover
      +'<svg viewBox="0 0 36 8" width="36" height="8"><path d="M1 4 H35" fill="none" stroke="'+col+'" stroke-width="2" stroke-dasharray="'+dash+'"/></svg></span>'
      +'<input type="range" class="rng" data-beam="'+kind+'" min="0" max="2" step="0.1" value="'+(window.__uniBeam[kind]!=null?window.__uniBeam[kind]:1)+'" title="'+kind+' beam · 0 hides · >1 glows"></div>'; };
  rt.innerHTML=
     '<div class="grp"><div class="grplbl">LINES</div>'
    + '<div class="cfgrow" style="gap:6px">'
    + pillHTML("lineStyle",[{v:"straight",t:LNS,ti:"straight"},{v:"curved",t:LNC,ti:"curved"}], CFG.lineStyle)
    + '<input type="range" class="rng" id="curveAmtRng" min="0.2" max="2.5" step="0.1" value="'+window.__uniCurveAmt+'" title="curve amount (when curved)"></div></div>'
    + '<div class="grp"><div class="grplbl">BEAM</div>'
    + beamRow("fk")+beamRow("bridge")+beamRow("calls")+beamRow("imports")
    + '<div style="font-size:10px;color:var(--muted);margin-top:4px">per line kind · 0 hides · past 1 glows</div></div>';
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
};
