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
    if(typeof FE_PAIR!=="undefined"){ Object.keys(FE_PAIR).forEach(function(fh){   // C split: the ring seats fe·X right AFTER X
      var bi=ord.indexOf(FE_PAIR[fh]), fi=ord.indexOf(fh);
      if(bi>=0&&fi>=0&&fi!==bi+1){ ord.splice(fi,1); bi=ord.indexOf(FE_PAIR[fh]); ord.splice(bi+1,0,fh); } }); }
    var arcOf={}, circ=0; _ents.forEach(function(s){ arcOf[s]=Math.max(260, 2.8*(30+9*Math.sqrt(cnt2[s]||0))); circ+=arcOf[s]; });   // per-entity arc ≈ 2.8× its nominal radius, floored so two TINY neighbours still sit ≥250 apart
    var R=Math.max(430, circ/(2*Math.PI));
    /* PROPORTIONAL arcs (batch 48): each entity owns an arc sized to ITS radius — a 625-node frontend-folded
       cooking no longer gets the same slot as a 2-node candidate (even spacing bled a third of the field). */
    var acc=0; ord.forEach(function(e){ var a=(acc+arcOf[e]/2)/R*(2*Math.PI*R/circ); P[e]={x:Math.cos(a)*R, y:0, z:Math.sin(a)*R}; acc+=arcOf[e]; });
  } else {                                               // FORCE — repulsion 13000/d² + FK spring rest 230, SIZE-AWARE (batch 48)
    var E2=_l1pairs();
    if(typeof FE_PAIR!=="undefined") Object.keys(FE_PAIR).forEach(function(fh){   // C split: fe·X rides a spring to X — the pair sits adjacent
      if(P[fh]&&P[FE_PAIR[fh]]) E2.push([fh, FE_PAIR[fh], 8]); });
    var cntF={}; nodes.forEach(function(nn){ cntF[nn.ent]=(cntF[nn.ent]||0)+1; });
    var radF=function(s){ return 30+9*Math.sqrt(cntF[s]||0); };   // the entity's nominal radius (RENT formula, pre-spread)
    for(var it=0; it<240; it++){
      for(var i=0;i<n;i++) for(var j=i+1;j<n;j++){ var a=_ents[i], b=_ents[j],
        dx=P[a].x-P[b].x, dy=P[a].y-P[b].y, dz=P[a].z-P[b].z, d2=dx*dx+dy*dy+dz*dz+60, d=Math.sqrt(d2), f=13000/d2;
        var need=(radF(a)+radF(b))*0.7; if(d<need) f+=(need-d)*0.12;   // COLLISION: two hulls may not overlap (radius-sum floor, pre-SEP)
        V[a].x+=dx/d*f; V[a].y+=dy/d*f; V[a].z+=dz/d*f; V[b].x-=dx/d*f; V[b].y-=dy/d*f; V[b].z-=dz/d*f; }
      E2.forEach(function(p){ var a=p[0], b=p[1], dx=P[b].x-P[a].x, dy=P[b].y-P[a].y, dz=P[b].z-P[a].z,
        d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1, f=0.02*(d-Math.max(230,(radF(a)+radF(b))*0.7));   // the FK spring rests no closer than the hulls allow
        V[a].x+=dx/d*f; V[a].y+=dy/d*f; V[a].z+=dz/d*f; V[b].x-=dx/d*f; V[b].y-=dy/d*f; V[b].z-=dz/d*f; });
      _ents.forEach(function(s){ V[s].x=(V[s].x-P[s].x*0.003)*0.9; V[s].y=(V[s].y-P[s].y*0.003)*0.9; V[s].z=(V[s].z-P[s].z*0.003)*0.9;
        P[s].x+=V[s].x; P[s].y+=V[s].y; P[s].z+=V[s].z; }); }
  }
  var SEP=(mode==="ring")?1.0:1.85;   // force converges tight — widen hard; the ring is already sized by construction
  _ents.forEach(function(s){ EX[s]=Math.round(P[s].x*SEP); EY[s]=Math.round(P[s].y*SEP); EZ[s]=Math.round(P[s].z*SEP); });
  __uniRelaxHulls();
}
/* HULL-OVERLAP RELAXATION (batch 48): whatever force/ring produced, no two entity hulls may overlap —
   D(a,b) ≥ 1.15·(R_a+R_b) with R the live RENT formula. The frontend fold made cooking a 625-node hull
   (R≈203) whose far-side planets sat nearer a neighbour's anchor (bleed 48%); the force balance alone
   cannot promise the floor, a deterministic pairwise relaxation can (60 sweeps, converges in a few). */
window.__uniCamFit=function(ms){ try{ if(typeof Graph==="undefined"||!Graph) return;   // frame the WHOLE field: 19 clusters outgrew the fixed 780 (review 52[6])
  var maxR=0; _ents.forEach(function(e){ var a=Math.hypot(EX[e]||0,EY[e]||0,EZ[e]||0)+(RENT[e]||60)*1.6; if(a>maxR) maxR=a; });
  var d=Math.max(780, maxR*1.35+180), cur=Graph.camera().position, L=Math.hypot(cur.x,cur.y,cur.z)||1;
  Graph.cameraPosition({x:cur.x/L*d, y:cur.y/L*d, z:cur.z/L*d},{x:0,y:0,z:0}, ms==null?600:ms); }catch(e){} };
function __uniRelaxHulls(){ var n=_ents.length; if(n<2 || __chainMode || CFG.entLayout==="ring") return;   // ring/chain are sized by construction (the ring's proportional arcs keep it a circle)
  var cnt={}; nodes.forEach(function(nn){ cnt[nn.ent]=(cnt[nn.ent]||0)+1; });
  /* R = the SETTLED radius estimate, not the nominal one: measured (gustify, 888 planets) hulls settle at
     1.6–1.8× RENT under the −60 charge — sizing the floor to RENT alone left the bleed at 46%. */
  var HULLK=window.__uniHullK||1.6;
  var R=function(s){ return HULLK*(30+9*Math.sqrt(cnt[s]||0))*(window.__uniSpread||1.4); };
  for(var k=0;k<60;k++){ var moved=false;
    for(var i=0;i<n;i++) for(var j=i+1;j<n;j++){ var a=_ents[i], b=_ents[j],
      dx=EX[b]-EX[a], dy=EY[b]-EY[a], dz=EZ[b]-EZ[a], d=Math.sqrt(dx*dx+dy*dy+dz*dz), need=1.05*Math.max(R(a)+R(b), 2*Math.max(R(a),R(b)));   // 2·max: a tiny anchor beside a giant hull must clear the giant's FAR side too
      if(d>=need) continue; moved=true;
      if(d<1e-6){ dx=Math.cos(i*2.399963); dy=0; dz=Math.sin(i*2.399963); d=1; }   // coincident → a deterministic axis
      var push=(need-d)/2; EX[a]-=dx/d*push; EY[a]-=dy/d*push; EZ[a]-=dz/d*push; EX[b]+=dx/d*push; EY[b]+=dy/d*push; EZ[b]+=dz/d*push; }
    if(!moved) break; }
  _ents.forEach(function(s){ EX[s]=Math.round(EX[s]); EY[s]=Math.round(EY[s]); EZ[s]=Math.round(EZ[s]); });
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
  _ents.forEach(function(e,ei){ var c=cnt[e]||0; RENT[e]=(30+9*Math.sqrt(c))*(window.__uniSpread||1.4);   // spread slider: element separation INSIDE entities
    var g=subs[e]||{}, ks=Object.keys(g).sort(function(a,b){ return (g[b]-g[a])||(a<b?-1:1); });
    var m={}; SUBANCHOR[e]=m;
    if(ks.length<2){ ks.forEach(function(k){ m[k]={x:0,y:0,z:0}; }); return; }   // one group (incl. the honest "other") → centered, no ring
    var SR=Math.min(RENT[e]*0.78, 44+13*ks.length);   // clusters inside an entity sit farther apart — cap raised (operator: dense entities overlapped; 34+9→44+13 lets a busy entity's clusters use more of RENT*0.78)
    ks.forEach(function(k,i){ var a=ei*0.7 + i*(Math.PI*2/ks.length);            // per-entity phase stagger — rings don't all align
      m[k]={ x:Math.cos(a)*SR, y:__chainMode?0:(((i%2)?1:-1)*SR*0.22), z:Math.sin(a)*SR }; }); });
}
// PER-SIDE cluster cores (operator: two cores at once): backend entities cluster by coreByBE,
// frontend entities by coreByFE — simultaneously. Defaults chase what actually divides each side
// (community is the backend spine, screen the frontend spine); without a levels feed, kind on both.
(function(){ var lv=!!(window.GABE_LEVELS && window.GABE_LEVELS.pieces);
  if(CFG.coreByBE==null) CFG.coreByBE=lv?"usecase":"kind";   // operator default: use-case clustering when the levels feed is present
  if(CFG.coreByFE==null) CFG.coreByFE="screen";
  CFG.coreBy=CFG.coreByBE;   // back-compat: any lingering single-core reader sees the backend core
})();
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
/* ── BACKEND-FUNCTION PLACEMENT (operator ruling — the artifact's option A) — on a DATA core
   (community / use-case / fk) a function is NOT its own cluster; it JOINS the data cluster it
   serves. The seed: a handler function inherits the sub of the ENDPOINT it handles; that label
   then propagates over the fn↔fn call graph to the helpers the handler calls. Unreached
   functions stay "other" (honest). Kind/Layer never call this — there "function" IS the axis, so
   functions form one group beside the data kinds. Measured: recipe 62 fns → 51 join their
   use-case, 0 separate ƒ· clusters. ── */
function _fnAssignSub(mode){
  // Functions JOIN the data cluster they serve (operator ruling — the artifact's option A): a
  // handler function inherits the community/use-case/fk sub of the ENDPOINT it handles, then that
  // label propagates over the call graph to the helpers the handler calls. No separate ƒ· geography
  // on a data core — a function reads as part of the flow it implements. Unreached functions stay
  // "other" (honest). (Kind/Layer never call this — there "function" IS the grouping axis.)
  var ids=[]; for(var i=0;i<nodes.length;i++){ if(nodes[i].kind==="function") ids.push(nodes[i].id); }
  if(!ids.length) return;                                        // Functions not loaded — nothing to place
  ids.sort();
  var adj={}, cur={};
  links.forEach(function(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];
    if(!s||!t||s.ent!==t.ent) return;                            // INTRA-entity only
    if(l.rel==="handler" && s.kind==="endpoint" && t.kind==="function" && s.sub && s.sub!=="other")
      cur[t.id]=s.sub;                                           // seed the handler with its endpoint's DATA cluster
    if(s.kind==="function" && t.kind==="function"){ (adj[s.id]=adj[s.id]||[]).push(t.id); (adj[t.id]=adj[t.id]||[]).push(s.id); }
  });
  for(var r=0;r<8;r++){ var nx={};                               // propagate the data label over the call graph
    ids.forEach(function(id){ if(cur[id]) return;
      var c={}; (adj[id]||[]).forEach(function(v){ if(cur[v]) c[cur[v]]=(c[cur[v]]||0)+1; });
      var best=_domKey(c); if(best!=null) nx[id]=best; });
    if(!Object.keys(nx).length) break;
    Object.keys(nx).forEach(function(k){ cur[k]=nx[k]; }); }
  nodes.forEach(function(n){ if(n.kind==="function") n.sub=cur[n.id]||"other"; });   // joins its data cluster, or honest "other"
}
/* PER-SIDE assignment (operator: two cores at once) — run the backend core, capture backend
   nodes' subs, run the frontend core, then restore the backend nodes. Frontend = its entity is
   a frontend entity (fe·/bucket/candidate); backend = the rest. Capsules restamp to their area
   last (mirrors the assignSub wrapper). Each _assignSubImpl already clusters each side with the
   right sub-algorithm (_feAssignSub for fe, the levels map for backend, _fnAssignSub for fns);
   this just lets the two SIDES carry different cores. */
window.__uniAssignSplit=function(){
  var feSet={}; if(typeof _ents!=="undefined") _ents.forEach(function(e){ if(window.__uniIsFeEnt && __uniIsFeEnt(e)) feSet[e]=1; });
  _assignSubImpl(CFG.coreByBE||"kind");
  var be={}; nodes.forEach(function(n){ if(!n.__cap && !feSet[n.ent]) be[n.id]=n.sub; });
  _assignSubImpl(CFG.coreByFE||"screen");
  nodes.forEach(function(n){ if(!n.__cap && !feSet[n.ent]) n.sub=be[n.id]; });   // backend nodes revert to their backend-core sub
  nodes.forEach(function(n){ if(n.__cap) n.sub=n.area||n.sub; });                // capsule sub IS its area (review 53[2])
};
function assignSub(mode){ _assignSubImpl(mode);
  nodes.forEach(function(n){ if(n.__cap) n.sub=n.area||n.sub; }); }   // review 53[2]: a capsule's sub IS its area — no core may clobber it
function _assignSubImpl(mode){
  if(mode==="usecase"||mode==="community"||mode==="fk"){
    if(!_LMAP) _LMAP=_levelsGroupMap();
    var m=(_LMAP&&_LMAP[mode])||{};
    nodes.forEach(function(n){ n.sub=m[n.id]||"other"; });
    if(mode!=="fk") try{ _feAssignSub(mode); }catch(e){}   // batch 50: fe pieces get REAL groups (the levels maps only know backend names)
    try{ _fnAssignSub(mode); }catch(e){}   // functions JOIN their served data cluster (community/use-case/fk), not a separate ƒ· geography
    return; }
  if(mode==="guards"){ if(!_LMAP) _LMAP=_levelsGroupMap(); var gm=(_LMAP&&_LMAP.guards)||{};
    nodes.forEach(function(n){ n.sub=(n.kind==="function")?"functions":(gm[n.id]||(n.kind==="endpoint"?"unguarded":"other")); }); return; }
  if(mode==="screen"){                                    // S4 (batch 53): fe pieces adopt their nearest SCREEN —
    var adjS={};                                          // BFS over fe wires ≤4 hops; backend pieces group by kind
    links.forEach(function(l){ var s=NIDS[lid(l.source)], t2=NIDS[lid(l.target)];
      if(!s||!t2||!s.fe||!t2.fe) return;
      (adjS[s.id]=adjS[s.id]||[]).push(t2.id); (adjS[t2.id]=adjS[t2.id]||[]).push(s.id); });
    var labS={}, qS=[];
    nodes.forEach(function(n){ if(n.fe&&n.screen){ labS[n.id]=n.label; qS.push(n.id); } });
    for(var hop=0; hop<4 && qS.length; hop++){ var nq=[];
      qS.forEach(function(id){ (adjS[id]||[]).forEach(function(v){ if(labS[v]===undefined){ labS[v]=labS[id]; nq.push(v); } }); });
      qS=nq; }
    nodes.forEach(function(n){ n.sub=n.fe?(labS[n.id]||"other"):n.kind; });
    return; }
  nodes.forEach(function(n){
    if(mode==="kind") n.sub=n.kind;
    else if(mode==="tests") n.sub=((n.m&&n.m.tests)>0)?"tested":"untested";
    else n.sub=n.layer||"data"; }); }   // ruling (c): group by the kind's OWN layer — endpoints · api · web · data today, auto-grows with new kinds

/* ── FE SUB-CLUSTERS (batch 50) — before this, every core except Kind put ALL frontend pieces in one
   honest "other" blob (the levels group maps are backend-name-keyed). USECASE: screens adopt the
   dominant use-case of the endpoints they bridge to, then the label spreads 3 rounds over the entity's
   fe wires — the frontend inherits the backend's use-case geography through real call paths.
   COMMUNITY: deterministic asynchronous label propagation per entity over the fe wires (sorted order,
   strict-improvement adoption, 10-round cap — byte-stable across runs); each community is named after
   its highest-degree member (`c·RecipeCard`), singletons stay "other". ── */
function _domKey(c){ var best=null; Object.keys(c).sort().forEach(function(k){ if(best===null||c[k]>c[best]) best=k; }); return best; }
function _feAssignSub(mode){
  var adj={}, deg={};
  links.forEach(function(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];
    if(!s||!t||!s.fe||!t.fe||s.ent!==t.ent) return;
    (adj[s.id]=adj[s.id]||[]).push(t.id); (adj[t.id]=adj[t.id]||[]).push(s.id);
    deg[s.id]=(deg[s.id]||0)+1; deg[t.id]=(deg[t.id]||0)+1; });
  if(mode==="usecase"){
    var seed={};
    links.forEach(function(l){ if(l.rel!=="bridge") return; var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];
      if(!s||!t||!s.fe||!t.sub||t.sub==="other") return;
      (seed[s.id]=seed[s.id]||{})[t.sub]=(seed[s.id][t.sub]||0)+1; });
    var cur={}; Object.keys(seed).forEach(function(id){ cur[id]=_domKey(seed[id]); });
    for(var r=0;r<3;r++){ var nx={};
      nodes.forEach(function(n){ if(!n.fe||cur[n.id]) return;
        var c={}; (adj[n.id]||[]).forEach(function(v){ if(cur[v]) c[cur[v]]=(c[cur[v]]||0)+1; });
        var k=_domKey(c); if(k) nx[n.id]=k; });
      var any=false; Object.keys(nx).forEach(function(id){ cur[id]=nx[id]; any=true; });
      if(!any) break; }
    nodes.forEach(function(n){ if(n.fe) n.sub=cur[n.id]||"other"; });
    return; }
  var lab={}, ids=nodes.filter(function(n){ return n.fe; }).map(function(n){ return n.id; }).sort();
  ids.forEach(function(id){ lab[id]=id; });
  for(var r2=0;r2<10;r2++){ var changed=false;
    ids.forEach(function(id){ var c={}; (adj[id]||[]).forEach(function(v){ if(lab[v]!=null) c[lab[v]]=(c[lab[v]]||0)+1; });
      var k2=_domKey(c); if(!k2||k2===lab[id]) return;
      if((c[k2]||0)>(c[lab[id]]||0) || ((c[k2]||0)===(c[lab[id]]||0) && k2<lab[id])){ lab[id]=k2; changed=true; } });
    if(!changed) break; }
  var groups={}; ids.forEach(function(id){ (groups[lab[id]]=groups[lab[id]]||[]).push(id); });
  var name={}, used={};
  Object.keys(groups).sort().forEach(function(g){ var mem=groups[g];
    if(mem.length<2){ name[mem[0]]="other"; return; }
    var rep=mem.slice().sort(function(a,b){ return (deg[b]||0)-(deg[a]||0) || (a<b?-1:1); })[0];
    var nm="c·"+(NIDS[rep]?NIDS[rep].label:rep);
    var ek=(NIDS[rep]?NIDS[rep].ent:"?"), full=nm, n2=2;                   // two hubs can share a LABEL (profileModel ×2 on gustify) —
    while(used[ek+"|"+full]){ full=nm+"·"+n2; n2++; }                      // an undisambiguated name would FUSE distinct communities downstream
    used[ek+"|"+full]=1;
    mem.forEach(function(id){ name[id]=full; }); });
  nodes.forEach(function(n){ if(n.fe) n.sub=name[n.id]||"other"; });
}
/* ── FUNCTIONS layer (from GABE_LEVELS.fn_nodes + fn_edges) — toggled in/out of the graph ── */
var _FNNODES=null, _FNLINKS=null, _fnsOn=false;
function _buildFnData(){ var D=window.GABE_LEVELS; if(!D||!D.fn_nodes||!KINDS["function"]){ _FNNODES=[]; _FNLINKS=[]; return; }
  _FNNODES=D.fn_nodes.map(function(f){ var beh=f.behind||{};
    return { id:f.id, kind:"function", ent:f.slug, label:f.name, col:KINDS["function"].col, K:KINDS["function"],
      layer:KINDS["function"].layer, sub:KINDS["function"].layer||"data", __fn:true,
      role:f.role, access:f.access, sinks:f.sinks, d2w:f.d2w,   // C1/C2/C4: role badge + ops/sinks; D2W: hops-to-a-write (call-wire heat, 0 is real → keep undefined distinct)
      m:{ behind:_num(beh.fns), depth:_num(beh.depth), tests:0, cols:0, fanin:_num(f.hub&&f.hub.usage), god:!!f.god, method:null },
      det:{ file:(f.id||"").split("#")[0], doc:"" }, behind:beh }; });
  _FNLINKS=(D.fn_edges||[]).map(function(e){ return {source:e.s, target:e.t, rel:e.rel||"calls"}; });
  /* endpoint → HANDLER wires (batch 46): the endpoint's own handler fn is in the pool — wire it
     so a data-edge-less endpoint (DELETE …/cupo) joins the call net the moment Functions is ON. */
  var _fnset={}; _FNNODES.forEach(function(f){ _fnset[f.id]=1; });
  nodes.forEach(function(n){ if(n.kind!=="endpoint"||!n.fn||!n.det||!n.det.file) return;
    var key=String(n.det.file).split(":")[0]+"#"+n.fn;
    if(_fnset[key]) _FNLINKS.push({source:n.id, target:key, rel:"handler"}); });
  /* fn → MODEL access wire (Option A) — each accessor's OWN reads/writes (C2 access.ops) become a
     DRAWN edge to the model node it touches, when that model is in the graph. This is the TRUE data
     access the endpoint→model ROLLUP hides; kind 'access' (fnreads/fnwrites), separately configurable. */
  _FNNODES.forEach(function(f){ var a=f.access; if(!a||!a.ops) return;
    a.ops.forEach(function(o){ var mid="model:"+o.model;
      if(NIDS[mid]) _FNLINKS.push({source:f.id, target:mid, rel:(o.rw==="w"?"fnwrites":"fnreads"), access:true}); }); });
  /* fn → SCHEMA wires (schema homing, 2026-08-27) — the levels `schema_edges` feed: a claimed function
     returns / takes / uses a schema. Drawn when both ends are in the field; a schema with one of these
     is a CONTRACT (never folds as a nested-only helper). */
  (D.schema_edges||[]).forEach(function(e){ if(_fnset[e.s] && NIDS[e.t]) _FNLINKS.push({source:e.s, target:e.t, rel:e.rel||"uses", schema:true}); });
}
function _stashPurge(flag){ if(!_CAPST) return;          // strip toggle-owned pieces from the capsule stash (review 53[9])
  for(var i=_CAPST.links.length-1;i>=0;i--){ if(_CAPST.links[i][flag]) _CAPST.links.splice(i,1); }
  for(var j=_CAPST.nodes.length-1;j>=0;j--){ if(_CAPST.nodes[j][flag]){ delete _CAPST.byPiece[_CAPST.nodes[j].id]; _CAPST.nodes.splice(j,1); } } }
function toggleFns(on){ _fnsOn=on; if(!_FNNODES) _buildFnData(); if(!_FNNODES) return;
  __uniFreezeForSettle();                                  // functions in/out reheats — decorations pause until the settle
  _stashPurge("__fn");                                     // review 53[9]: the stash never holds fn entries across a toggle — no zombies, no duplicate wires
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
  try{ __uniAssignSplit(); recomputeSubAnchors(); buildClusters(); updateClusters(true); }catch(e){}   // fn nodes change group sizes → re-ring
  if(window.__uniFleetRegroup) try{ __uniFleetRegroup(); }catch(e){}   // fn nodes add/remove sub groups → the panel re-derives
  if(window.__uniApplyCapsules&&_CAPST!==undefined) try{ __uniApplyCapsules(); }catch(e){}   // review 53[1]: a collapsed entity re-folds its new fn pieces
}
/* TYPES (batch 48) — the frontend's fe-type pieces + their typed wires, held back at boot (adapter) and seeded in
   here on demand; the exact toggleFns mechanics (spiral seed · reheat · re-ring · fleet regroup). */
function toggleTypes(on){ if(typeof _FETYPES==="undefined" || !_FETYPES.length) return;
  __uniFreezeForSettle();
  _stashPurge("__ty");                                     // review 53[9]: symmetric — the stash never holds fe-type entries across a toggle
  if(on){
    _FETYPES.forEach(function(n,i){ if(!NIDS[n.id]){
      var a=i*2.399963, rr=8+i*0.35;
      n.x=(EX[n.ent]||0)+Math.cos(a)*rr; n.y=(EY[n.ent]||0)+Math.sin(a)*rr; n.z=(EZ[n.ent]||0)+((i%23)-11);
      nodes.push(n); NIDS[n.id]=n; } });
    _FETYPELINKS.forEach(function(tl){ var s=lid(tl.source), t=lid(tl.target); if(NIDS[s]&&NIDS[t]&&s!==t){
      var mm=LINKMETA[tl.rel]||{w:2,pv:1}; links.push({source:s,target:t,rel:tl.rel,w:mm.w,proven:!!mm.pv,payload:0,__ty:true,fe:true}); } });
  } else {
    for(var i=links.length-1;i>=0;i--){ if(links[i].__ty) links.splice(i,1); }
    for(var j=nodes.length-1;j>=0;j--){ if(nodes[j].__ty){ delete NIDS[nodes[j].id]; nodes.splice(j,1); } }
  }
  links.forEach(function(l){ l.source=lid(l.source); l.target=lid(l.target); });
  if(typeof Graph!=="undefined" && Graph){ try{ Graph.graphData({nodes:nodes, links:links}); Graph.d3ReheatSimulation(); }catch(e){} }
  try{ __uniAssignSplit(); recomputeSubAnchors(); buildClusters(); updateClusters(true); }catch(e){}
  if(window.__uniFleetRegroup) try{ __uniFleetRegroup(); }catch(e){}
  if(window.__uniApplyCapsules&&_CAPST!==undefined) try{ __uniApplyCapsules(); }catch(e){}   // a collapsed entity re-folds its new pieces
}
/* LINES — moved off the topbar into the config; sets the curved-connector flag + redraws */
function __uniSetCurve(on){ window.__uniCurved=!!on; try{ updateConnectors(); }catch(e){} }
window.__uniCurveAmt=0.6;                                 // curve-amount slider → arc height multiplier (operator default 0.6)
window.__uniCurved=true;                                  // lines default CURVED (operator config)
window.__uniBeam={ fk:0.9, bridge:0.8, calls:0.5, imports:1, rollup:0, access:0.7 };  // per-kind wire glow (operator defaults) — 0 hides, >1 glows; read by connectorWire. rollup HIDDEN by default (beam 0)
/* D2W — the CALLS-wire heat spectrum (Proposal A, discrete bands). A calls wire never IS the write —
   it APPROACHES one; the actual write is the red ACCESS wire (accessor→model). So a calls wire is
   coloured by its TARGET function's distance-to-write: band 0 = the call reaching the writing function
   (ORANGE, the hottest a call gets), cooling through amber/yellow as the target sits further back, to
   GREEN where the target never reaches a write (or isn't a function). Distances 3,4,5… all clamp into
   band 3 ("3+ hops"); band 4 (green) is reserved for undefined = never-reaches. RED is the access wire,
   not a call. The distance rides the levels fn_node (emitter: derive_distance_to_write). */
window.BANDPAL=[0xf2711c, 0xf59f00, 0xf5d90a, 0xbcd12f, 0x46a758];  // 0 closest→orange · 1 · 2 · 3+ · 4/none→green (calibratable; red is the ACCESS write wire)
window.__uniD2W=true;                                     // calls wires coloured by distance-to-write by default (legend toggle falls back to flat)
window.__d2wBand=function(n){ if(!window.__uniD2W||!n) return null;   // → band colour for a calls TARGET, or null (flat cfg.color)
  var d=n.d2w; return window.BANDPAL[(d==null)?4:Math.min(d|0,3)]; };  // reaching fns clamp into band 3; band 4 (green) is never-reaches only
// ── FE WRITE-SPINE heat (operator D1/D3/D4): a SEPARATE gradient from the backend's, in the
//    previously-decided FE range (option A · blue→magenta): 0 AT the write→magenta, rising outward
//    to blue. It has its OWN toggle (D4, default OFF) so the FE spine can be read without the backend
//    heat, and it colours a FE WRITE wire by its target's fed2w (hops-to-a-write-fetch). ──
window.FEBAND=[0xc026d3, 0x9c33e0, 0x7c3aed, 0x4f52ea, 0x2563eb];   // 0 at-the-write→magenta · 1 · 2 · 3 · 4/far→blue
window.__uniFED2W=false;                                   // FE write heat — separate toggle, DEFAULT OFF (operator D4)
window.__feD2WBand=function(n){ if(!window.__uniFED2W||!n||n.fed2w==null) return null;   // → band for a FE WRITE wire's target, or null (flat)
  return window.FEBAND[Math.min(n.fed2w|0,4)]; };
window.__uniWriteRing=false;                               // the write-spine node RING — separate toggle, DEFAULT OFF (operator D2)
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
        if(window.__uniRelHide&&__uniRelHide(l)&&!(HL.on&&HL.links&&HL.links.has(l))&&l!==window.__uniSelLink) return;   // an R-hidden wire is unpickable UNLESS it is lit (review 52[1])
        var dd=_raySegDist(rc.ray, new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z));
        if(dd<WTH && (!wbest||dd<wbest.d)) wbest={d:dd, l:l}; }); }
    if(wbest){ window.__uniSelLink=wbest.l;                                  // the picked wire GLOWS (hf boost in updateConnectors)
      if(window.__uniHLSelectLink) __uniHLSelectLink(wbest.l);
      try{ showLinkPanel(wbest.l); }catch(e2){} try{ updateConnectors(); }catch(e3){} return; }
    /* CONNECTION GHOST pick — the star is the SMALL, intentional target, so it takes PRIORITY over the
       big entity hull whose bounding sphere the ray merely crosses (operator: clicking a star must select
       THE STAR, not the entity behind it). The point threshold is tight → it only fires when the cursor is
       genuinely on a star. Reveal its cluster+entity IN PLACE, then SELECT the node (panel + trail). */
    if(window.__uniStubs && window.__uniStubs.length){ var gbest=null;
      window.__uniStubs.forEach(function(st){ var P=new T.Vector3(st.p.x,st.p.y,st.p.z);
        if(P.clone().sub(rc.ray.origin).dot(rc.ray.direction)<0) return;     // behind the camera
        var d=rc.ray.distanceToPoint(P); if(d<22 && (!gbest||d<gbest.d)) gbest={d:d, st:st}; });
      if(gbest && window.__uniReveal){ var _gid=gbest.st.hid; __uniReveal(_gid);   // reveal the cluster/entity IN PLACE, then SELECT the node
        var _gn=NIDS[_gid];
        if(_gn){ if(_gn.kind==="capsule"){ if(window.__uniCapExpand) try{ __uniCapExpand(_gn.ent); }catch(_ce){} }   // a capsule ghost EXPANDS (matches onNodeClick) — never lands in SEL/trail
          else { SEL={kind:"node",data:_gn}; try{ showPanel(_gn); }catch(e5){} try{ if(typeof refreshEncSel==="function") refreshEncSel(); }catch(e6){} try{ if(window.__uniHLSelect) __uniHLSelect(_gn); }catch(e7){} } }
        return; } }
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
    if(best){ if(best.c.level==="sub" && window.__uniPanelClu) __uniPanelClu(best.c.ekey, best.c.skey);
      else if(window.__uniPanelEnt) __uniPanelEnt(best.c.ekey); return; }
  }catch(e){} };
/* ── CONNECTION GHOSTS (operator): a hidden node still CONNECTED to a rendered node is shown as a faint
   glow STAR at its OWN position (where it sits in its cluster/entity) — NO line to the selection, no
   reposition. Hover → the node's icon + name (a preview, "as if selected"); click → reveal its cluster
   + entity IN PLACE (__uniReveal un-hides the real node, already at that spot). The stars live in their
   OWN scene group (never connGroup → wire counts untouched) and are point-picked manually. ── */
window.__uniStubs=[];   // [{p:{x,y,z}, hid, col}] — one ghost per hidden connected node, for the manual pick
window.__uniDrawStubs=function(){ window.__uniStubs=[]; try{
  if(typeof Graph==="undefined"||!Graph||!Graph.scene) return;
  var grp=window.__uniStubGroup;
  if(!grp){ grp=window.__uniStubGroup=new T.Group(); }
  try{ var _sc=Graph.scene(); if(_sc && grp.parent!==_sc) _sc.add(grp); }catch(e){}   // (re)attach — survive a scene reset
  while(grp.children.length){ var ch=grp.children.pop(); if(ch.geometry&&ch.geometry.dispose&&!ch.isSprite) ch.geometry.dispose(); if(ch.material&&ch.material.dispose) ch.material.dispose(); grp.remove(ch); }   // NEVER dispose the SHARED sprite geometry (review: the gh singleton)
  if(!CFG.conns || typeof links==="undefined" || typeof _npos==="undefined") return;
  /* a ghost target is hidden by the FLEET (show∧planets) but NOT by kind (types-off / solo-helper) —
     __uniReveal only clears fleet flags, so a kind-hidden node could never surface (review). The visible
     end must be actually RENDERED (_nodeVisibleFn, focus included — review: focus-hidden ≠ a source). */
  var _fleetShown=function(n){ if(!n||typeof UNIVIS==="undefined") return false;
    var o=UNIVIS.node[n.id]; if(o) return !!(o.show&&o.planets);
    var ev=visEnt(n.ent), sv=(n.sub!=null)?UNIVIS.sub[n.ent+"|"+n.sub]:null;
    if(sv) return !!(ev.show&&sv.show&&ev.planets&&sv.planets);
    return !!(ev.show&&ev.planets); };
  var _kindShown=function(n){ if(!n) return false;
    var st=(window.__uniKindState||{})[n.kind]||(typeof _kindDefault==="function"?_kindDefault(n.kind):(n.kind==="function"?"off":"all"));
    if(st==="off") return false; if(window.__uniFoldHelpers!==false && n.__solo && !(window.__uniPin||{})[n.id]) return false; return true; };   // ghost stars agree with visN's GLOBAL helper-fold; a walk/reveal PIN clears it
  var seen={};
  links.forEach(function(l){ var sid=lid(l.source), tid=lid(l.target); var s=NIDS[sid], t=NIDS[tid]; if(!s||!t) return;
    if(window.__uniRelHide && __uniRelHide(l)) return;               // respect the R-lab hides
    var H=null, hidId=null;
    if(_nodeVisibleFn(s) && !_fleetShown(t) && _kindShown(t)){ H=t; hidId=tid; }        // s rendered, t a revealable fleet-hidden ghost
    else if(_nodeVisibleFn(t) && !_fleetShown(s) && _kindShown(s)){ H=s; hidId=sid; }   // t rendered, s the ghost
    else return;
    if(seen[hidId]) return; seen[hidId]=1;                          // ONE star per hidden node (operator)
    var p=_npos[hidId]||((H.ent!=null && typeof EX!=="undefined" && EX[H.ent]!=null) ? {x:EX[H.ent],y:EY[H.ent]||0,z:EZ[H.ent]||0} : null); if(!p) return;
    var col=(H&&H.col)||"#8590a8";
    var star=glowSprite(col, 22, 0.45); star.position.set(p.x,p.y,p.z); star.raycast=function(){}; grp.add(star);   // faint glow AT the hidden node's own spot — no line
    window.__uniStubs.push({ p:{x:p.x,y:p.y,z:p.z}, hid:hidId, col:col }); }); }catch(e){} };
/* ── WRITE-SPINE RINGS (operator D2): a ring HALO on every rendered write-spine node (`fed2w` set),
   coloured by its fed2w band (FEBAND — magenta at the write → blue far), the NODE signal that
   complements the wire gradient. A SEPARATE toggle (`__uniWriteRing`), DEFAULT OFF. Its own scene
   group, rebuilt each updateConnectors like the stubs; `ringSprite` is the crisp halo primitive. ── */
window.__uniWriteRingGroup=null;
window.__uniDrawWriteRings=function(){ try{
  if(typeof Graph==="undefined"||!Graph||!Graph.scene) return;
  var grp=window.__uniWriteRingGroup;
  if(!grp){ grp=window.__uniWriteRingGroup=new T.Group(); }
  try{ var _sc=Graph.scene(); if(_sc && grp.parent!==_sc) _sc.add(grp); }catch(e){}   // (re)attach — survive a scene reset
  while(grp.children.length){ var ch=grp.children.pop(); if(ch.material&&ch.material.dispose) ch.material.dispose(); grp.remove(ch); }
  if(!window.__uniWriteRing) return;                              // DEFAULT OFF — the toggle gates the whole pass
  if(typeof nodes==="undefined"||typeof _npos==="undefined"||typeof ringSprite!=="function") return;
  var pal=window.FEBAND||[0xc026d3];
  nodes.forEach(function(n){ if(!n||n.fed2w==null) return;        // write-spine nodes only (fed2w = hops-to-a-write)
    if(typeof _nodeVisibleFn==="function" && !_nodeVisibleFn(n)) return;   // only actually-rendered nodes
    var p=_npos[n.id]; if(!p) return;
    var col=pal[Math.min(n.fed2w|0, pal.length-1)];
    var r=ringSprite(col, 30, 0.72); r.position.set(p.x,p.y,p.z); r.raycast=function(){}; grp.add(r); }); }catch(e){} };
/* ── JOURNEY STEP NUMBERS (operator): while a journey/trail WALKS, overlay each step node with its
   SEQUENCE number (1..N) — a badge in the entity colour, centred on the icon, on top (depthTest off),
   the CURRENT step brighter/bigger. Mirrors the trail chips in the panel, drawn onto the 3D nodes so the
   order reads from a distance. Own scene group, rebuilt on each walk render + updateConnectors; the
   badges track the sim via __uniHLTick (userData.nid). It ADDS an overlay, never replaces the icon. ── */
// live config (operator-tunable via the Controls panel, copyable): scoped SMALL by default so a badge
// does NOT cover the sphere's encoding — a small centred number with a faint disc + thin ring.
window.__uniJn = window.__uniJn || { size:5, line:4.5, disc:0.6, font:0, off:-9 };   // operator-tuned default (2026-08-29); the live tuner was removed once settled
var _JN_FONTS = ["Menlo,Consolas,ui-monospace,monospace", "'Segoe UI',system-ui,sans-serif", "Georgia,'Times New Roman',serif", "'Arial Narrow','Arial',sans-serif"];
function _numBadgeSprite(num, col, cur){ var cfg=window.__uniJn||{}, cv=document.createElement("canvas"); cv.width=cv.height=128; var c=cv.getContext("2d");
  var C=col||"#9ecbff";
  if((cfg.disc||0)>0){ c.beginPath(); c.arc(64,64,50,0,Math.PI*2); c.fillStyle="#0b0f18"; c.globalAlpha=Math.min(1,cfg.disc*(cur?1.15:1)); c.fill(); c.globalAlpha=1; }   // faint disc (tunable — 0 = none, so the sphere shows through)
  if((cfg.line||0)>0){ c.beginPath(); c.arc(64,64,50,0,Math.PI*2); c.lineWidth=cfg.line*(cur?1.5:1); c.strokeStyle=C; c.stroke(); }                                        // ENTITY-colour ring (trail coloring); current step thicker
  var t=String(num); c.font="800 "+(t.length>2?46:t.length>1?60:74)+"px "+(_JN_FONTS[cfg.font|0]||_JN_FONTS[0]); c.textAlign="center"; c.textBaseline="middle";
  c.lineWidth=5; c.strokeStyle="#0b0f18"; c.strokeText(t,64,69); c.fillStyle=cur?"#ffffff":C; c.fillText(t,64,69);           // number in the entity colour (current = white), dark outline for contrast on any hue
  var s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv), transparent:true, depthWrite:false, depthTest:false})); var sz=(cfg.size||8)*(cur?1.35:1); s.scale.set(sz,sz,1); return s; }
window.__uniJrnNumGroup=null;
window.__uniDrawJourneyNums=function(){ try{
  if(typeof Graph==="undefined"||!Graph||!Graph.scene) return;
  var grp=window.__uniJrnNumGroup; if(!grp){ grp=window.__uniJrnNumGroup=new T.Group(); grp.renderOrder=9; }
  try{ var _sc=Graph.scene(); if(_sc && grp.parent!==_sc) _sc.add(grp); }catch(e){}   // (re)attach — survive a scene reset
  while(grp.children.length){ var ch=grp.children.pop(); if(ch.material){ if(ch.material.map&&ch.material.map.dispose) ch.material.map.dispose(); if(ch.material.dispose) ch.material.dispose(); } grp.remove(ch); }
  if(typeof WALK==="undefined" || !(WALK.mode==="journey"||WALK.mode==="trail") || !WALK.steps.length) return;   // ONLY while a walk is active
  if(typeof _npos==="undefined") return;
  var off=(window.__uniJn&&window.__uniJn.off)||0, _cur=WALK.i, _byNode={};
  WALK.steps.forEach(function(id, i){ (_byNode[id]=_byNode[id]||[]).push(i); });              // a node can be MANY steps — one badge each, never stacked
  Object.keys(_byNode).forEach(function(id){ var n=(typeof _fnById==="function")?_fnById(id):(typeof NIDS!=="undefined"&&NIDS[id]); if(!n) return;
    if(typeof _nodeVisibleFn==="function" && !_nodeVisibleFn(n)) return;                       // only actually-rendered steps
    var p=_npos[id]; if(!p) return;
    var idxs=_byNode[id], best=idxs[0];                                                        // ONE number per node: the step CLOSEST to the current; on a distance tie, the GREATER (forward) index (operator)
    for(var k=1;k<idxs.length;k++){ var i=idxs[k], db=Math.abs(best-_cur), di=Math.abs(i-_cur); if(di<db || (di===db && i>best)) best=i; }
    var col=(n.col||(typeof ENT!=="undefined"&&ENT[n.ent])||"#9ecbff");
    var s=_numBadgeSprite(best+1, col, best===_cur); s.position.set(p.x,p.y+off,p.z); s.userData.nid=id; s.raycast=function(){}; grp.add(s); }); }catch(e){} };
window.__uniReveal=function(hidId){ try{ var h=NIDS[hidId]; if(!h) return; var ent=h.ent, sub=h.sub, cols=["show","planets","wires"];
  if(typeof UNIVIS==="undefined"||typeof _VISDEF==="undefined") return;
  if(!UNIVIS.ent[ent]) UNIVIS.ent[ent]=Object.assign({},_VISDEF);
  cols.forEach(function(c){ UNIVIS.ent[ent][c]=1; });               // force the hidden entity ON for show + planets + wires
  if(sub!=null){ var k=ent+"|"+sub; if(!UNIVIS.sub[k]) UNIVIS.sub[k]=Object.assign({},_VISDEF); cols.forEach(function(c){ UNIVIS.sub[k][c]=1; }); }   // and its cluster
  if(typeof HL!=="undefined" && HL.on && HL.mode==="focus" && HL.rest==="hide" && HL.set && HL.set[hidId]===undefined){ HL.set[hidId]=(HL.depth||1); }   // focus-hide would still cull the revealed node → exempt it (review)
  var _gh=window.__uniGhostHov; if(_gh) _gh.visible=false;          // drop the lingering hover preview the instant we reveal (review)
  var _tip=document.getElementById("unistubtip"); if(_tip) _tip.style.display="none";
  var _g=document.getElementById("g"); if(_g && _g.style.cursor==="pointer") _g.style.cursor="";
  window.__uniPin[hidId]=1;                                          // a revealed node must not stay folded as a solo helper (review minor)
  try{ applyVis("all"); }catch(e){} try{ if(window.__uniFleetSync) __uniFleetSync(); }catch(e){} try{ updateConnectors(); }catch(e){} }catch(e){} };
/* DOUBLE-CLICK a node → reveal + light its ONE-HOP neighbourhood (operator): every element directly
   connected to n is un-hidden (its element + cluster + entity forced ON if the fleet had it hidden),
   as if you had walked to each connected element and switched it on, then the whole set is selected
   (the depth-1 highlight lights the neighbours). Batches the flag-writes → ONE applyVis/updateConnectors
   (not N), then selects through the shared _selNode path. One hop only — the direct connections. */
window.__uniRevealNeighbors=function(n){ try{ if(!n) return 0;
  if(typeof UNIVIS==="undefined"||typeof _VISDEF==="undefined"||typeof links==="undefined") return 0;
  var nid=n.id, seen={}, hop=[];
  links.forEach(function(l){ var s=lid(l.source), t=lid(l.target);
    var o=(s===nid)?t:(t===nid?s:null); if(o!=null && !seen[o]){ seen[o]=1; hop.push(o); } });
  var cols=["show","planets","wires"];
  var _force=function(id){ var m=NIDS[id]; if(!m) return; var ent=m.ent, sub=m.sub; window.__uniPin[id]=1;   // past the solo fold too
    if(!UNIVIS.ent[ent]) UNIVIS.ent[ent]=Object.assign({},_VISDEF);
    cols.forEach(function(c){ UNIVIS.ent[ent][c]=1; });
    if(sub!=null){ var k=ent+"|"+sub; if(!UNIVIS.sub[k]) UNIVIS.sub[k]=Object.assign({},_VISDEF); cols.forEach(function(c){ UNIVIS.sub[k][c]=1; }); }
    if(typeof HL!=="undefined" && HL.on && HL.mode==="focus" && HL.rest==="hide" && HL.set && HL.set[id]===undefined) HL.set[id]=(HL.depth||1); };   // focus-hide would re-cull a revealed node
  _force(nid); hop.forEach(_force);                                 // the clicked node (if hidden) + every 1-hop neighbour
  var _gh=window.__uniGhostHov; if(_gh) _gh.visible=false;
  try{ applyVis("all"); }catch(e){} try{ if(window.__uniFleetSync) __uniFleetSync(); }catch(e){} try{ updateConnectors(); }catch(e){}
  if(window.__uniSelNode) try{ __uniSelNode(n); }catch(e){}         // select through the ONE path → panel + depth-1 highlight lights the revealed set
  return hop.length; }catch(e){ return 0; } };
window.__uniStubHoverInit=function(){ var g=document.getElementById("g"); if(!g || g.__stubHov) return; g.__stubHov=true;
  var tip=document.getElementById("unistubtip");
  if(!tip){ tip=document.createElement("div"); tip.id="unistubtip"; tip.className="unistubtip"; tip.style.display="none"; document.body.appendChild(tip); }
  var _last=0;
  var _clear=function(){ if(tip.style.display!=="none") tip.style.display="none"; if(g.style.cursor==="pointer") g.style.cursor=""; if(window.__uniGhostHov) window.__uniGhostHov.visible=false; };
  g.addEventListener("pointermove", function(ev){
    if(ev.buttons){ _clear(); return; }                             // suppress + reset cursor while dragging (review: cursor stuck)
    var now=(window.performance&&performance.now)?performance.now():+new Date(); if(now-_last<45) return; _last=now;   // throttle the raycast
    if(!window.__uniStubs || !window.__uniStubs.length){ _clear(); return; }
    try{ var r=g.getBoundingClientRect(), mx=((ev.clientX-r.left)/r.width)*2-1, my=-((ev.clientY-r.top)/r.height)*2+1;
      var rc=new T.Raycaster(); rc.setFromCamera({x:mx,y:my}, Graph.camera());
      var best=null; window.__uniStubs.forEach(function(st){ var P=new T.Vector3(st.p.x,st.p.y,st.p.z);
        if(P.clone().sub(rc.ray.origin).dot(rc.ray.direction)<0) return;   // behind the camera
        var d=rc.ray.distanceToPoint(P); if(d<22 && (!best||d<best.d)) best={d:d, st:st, P:P}; });
      if(best){ var hn=NIDS[best.st.hid]||{}, ent=hn.ent||"?", sub=(hn.sub!=null?hn.sub:null);
        var ico=(typeof svgInline==="function" && hn.kind)?svgInline(hn.kind, (typeof KINDCOL!=="undefined"&&KINDCOL[hn.kind])||best.st.col, 13):"";   // the STAR's icon (operator: icon + name)
        tip.innerHTML='<span class="ustname">'+ico+'<b>'+(hn.label||best.st.hid)+'</b></span><span class="ustmeta">'+ent+(sub!=null?(" · "+sub):"")+' · hidden — click to reveal</span>';
        tip.style.left=(ev.clientX+14)+"px"; tip.style.top=(ev.clientY+12)+"px"; tip.style.borderColor=best.st.col; tip.style.display="block"; g.style.cursor="pointer";
        try{ if(!window.__uniGhostHov){ window.__uniGhostHov=glowSprite("#ffffff", 40, 0.95); window.__uniGhostHov.raycast=function(){}; Graph.scene().add(window.__uniGhostHov); }   // brighten the star — "as if selected but not actively selected"
          window.__uniGhostHov.material.color.set(best.st.col); window.__uniGhostHov.position.copy(best.P); window.__uniGhostHov.visible=true; }catch(_e){} }
      else { _clear(); }
    }catch(e){ tip.style.display="none"; } });
  g.addEventListener("pointerleave", function(){ _clear(); }); };
function __uniSetupOrbit(){ var g=document.getElementById("g"); if(!g || g.__orbitBound) return; g.__orbitBound=true; var drag=null;
  try{ Graph.onBackgroundClick(window.__uniBgClick); }catch(e){}   // empty-space clicks pick the hull under the cursor
  try{ if(window.__uniStubHoverInit) __uniStubHoverInit(); }catch(e){}   // cross-boundary stub hover labels (same #g)
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
    if(window.UNIWIRE&&UNIWIRE.r4&&l.rel==="renders"&&_SOLEP&&_SOLEP[lid(l.target)]) return 14;   // R4: sole children hug their parent
    return (s&&t&&s.ent!==t.ent)?280:40; });
  lf.strength(function(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)];   // soft springs — the anchors own the geometry
    return (s&&t&&s.ent!==t.ent)?0.04:0.12; }); }
/* mode-aware layout force: chain = layer→Y + (entity+sub)→X/Z band · force/spread = pull to the
   3D (entity + sub-ring) anchor, then a per-kind RADIAL bias (endpoints ring the entity EDGE,
   functions/models/schemas pull to the CORE) + a soft containment past 1.3× the nominal radius. */
var KRADF={ endpoint:1.45, web:1.45, screen:1.45, external:1.1, "function":0.35, model:0.4, schema:0.4,   // 1.45/0.4 (batch 50): the charge floor makes a 0.28-core physically unpackable — the RATIO lives in the outer shell, where few pieces contend
  /* FRONTEND kinds (batch 48) — concentric like the backend: types at the core (the schema-equivalent), modules +
     stores inside, hooks mid, components outer, routes at the rim (entry points, like endpoints). Without these
     every frontend piece defaulted to the rim (factor 1) and the fold ballooned each hull to ~1.8× its radius. */
  type:0.3, module:0.45, store:0.5, hook:0.7, component:0.9, route:1.2 };
function zForce(alpha){ var ns=zForce.__n||[]; ns.forEach(function(n){ var x=n.x||0, y=n.y||0, z=n.z||0;
  var sa=(SUBANCHOR[n.ent]||{})[n.sub];
  if(__chainMode){ n.vy += ((LZ[n.layer]||0)-y)*0.05*alpha;
    n.vx += ((EX[n.ent]||0)+(sa?sa.x:0)-x)*0.045*alpha; n.vz += ((sa?sa.z:0)-z)*0.03*alpha; return; }
  var ax=EX[n.ent]||0, ay=EY[n.ent]||0, az=EZ[n.ent]||0;
  n.vx += (ax+(sa?sa.x:0)-x)*0.08*alpha; n.vy += (ay+(sa?sa.y:0)-y)*0.08*alpha; n.vz += (az+(sa?sa.z:0)-z)*0.08*alpha;
  var dx=x-ax, dy=y-ay, dz=z-az, r=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(!(r>1e-3) || !isFinite(r)) return;                     // coincident with the anchor → no radial direction yet (NaN guard)
  var R0=RENT[n.ent]||60, f=KRADF[n.kind];
  if(f){ var kr=0.30*alpha*(R0*f-r)/r; n.vx+=dx*kr; n.vy+=dy*kr; n.vz+=dz*kr; }                // kind ring: boundary out, guts in (0.30 — third tune: the charge is FIXED (−60) while RENT shrinks with each field change, so the ring gain must dominate at small radii; 0.08 pre-fold · 0.16 at 888 · 0.30 after the scaffold cut tightened hulls)
  var rmax=R0*1.6; if(r>rmax){ var kc=0.6*alpha*(rmax-r)/r; n.vx+=dx*kc; n.vy+=dy*kc; n.vz+=dz*kc; }   // containment kills the bleed (0.6; boundary 1.6 — it must sit ABOVE the outermost kind ring (endpoints 1.45) or the two forces fight and the shell never forms; the hull floor already budgets 1.6×RENT)
}); }
zForce.initialize=function(ns){ zForce.__n=ns; };

/* ══ DEPTH HIGHLIGHT (batch 12) — select an element → light everything within N hops (1–5).
   Two styles: GLOW (halo the reached set, dim the rest of the wires) · FOCUS (hide everything
   outside the set; hulls stay as geography). Alt+scroll changes depth; Esc clears. The journeys
   picker feeds the SAME machinery with a carrier set instead of a single origin. */
var HL={ on:false, mode:"glow", depth:3, rest:"hide", origin:null, jr:null, set:{}, links:null, sprites:[], rings:[] };   // rings = the spinning focus rings (operator)   // rest = focus's treatment of the OUTSIDE: dim · fade · wires · hide
function _hlCompute(){ if(!HL.origin){ HL.set={}; HL.links=null; return; }
  if(HL.exact){                                            // JOURNEY mode (batch 49): the path IS the set — the fe leg
    var ex={};                                             // sits in the dense frontend cluster, and a depth-BFS from it
    /* operator (2026-08-27): while a journey WALKS, only the CURRENT step is the selection (depth 0 →
       the focus ring); the rest of the path stays lit as CONTEXT at depth 1 (glow, no focus ring). */
    var cur=(WALK.mode==="journey" && WALK.steps.length) ? WALK.steps[WALK.i] : null;
    HL.origin.forEach(function(id){ if(NIDS[id]) ex[id]=(cur && id!==cur) ? 1 : 0; });   // lit 2,824 wires (screen = noise, the batch-15 lesson).
    HL.set=ex; HL.links=new Set();                         // exact origin + only the wires BETWEEN its members.
    links.forEach(function(l){ if(ex[lid(l.source)]!==undefined && ex[lid(l.target)]!==undefined) HL.links.add(l); });
    return; }
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
function _hlClearSprites(){ if(hlGroup){ while(hlGroup.children.length){ var s=hlGroup.children.pop(); hlGroup.remove(s); } } HL.sprites=[]; HL.rings=[]; }
/* the FOCUS RING — configurable (operator): pattern (spinner/solid/dashed/dotted), colour,
   size mode (const/icon/sphere, always CENTRED), animation (spin/pulse/none). */
var _ringTexCache={};
function _ringTex(pat, thick, sz){ pat=pat||"spinner"; thick=thick||4; sz=sz||22;
  var res=Math.min(512, Math.max(128, Math.round(sz/16)*128));                    // texture res scales with the ring (bucketed 128..512) — big rings stop pixelating
  var dashN=(pat==="dashed")?Math.max(10, Math.round(sz*0.8)):14;                 // dash COUNT scales with the sphere radius (operator: more, crisper dashes when big)
  var key=pat+"|"+thick+"|"+res+"|"+dashN; if(_ringTexCache[key]) return _ringTexCache[key];
  var cv=document.createElement("canvas"); cv.width=cv.height=res; var c=cv.getContext("2d"); var R=res*0.39, ctr=res/2, lw=thick*(res/128);
  c.strokeStyle="#fff"; c.lineCap="round"; c.lineWidth=lw;
  if(pat==="solid"){ c.beginPath(); c.arc(ctr,ctr,R,0,6.2832); c.stroke(); }
  else if(pat==="dashed"){ var period=(2*Math.PI*R)/dashN; c.setLineDash([period*0.5, period*0.5]); c.beginPath(); c.arc(ctr,ctr,R,0,6.2832); c.stroke(); }
  else { c.beginPath(); c.arc(ctr,ctr,R,-Math.PI*0.5,Math.PI*1.15); c.stroke(); }   // spinner (gapped arc)
  _ringTexCache[key]=new T.CanvasTexture(cv); return _ringTexCache[key]; }
function _focSizeFor(n){ var m=(typeof CFG!=="undefined"&&CFG.focSize)||"const";
  if(m==="sphere"){ var br=(typeof massR==="function")?massR(n):8; return Math.max(16, br*2.4); } if(m==="icon") return 20; return 22; }
/* the RING sprite — shape (size/pattern/thick) shared; opacity varies (bright on the selected, dim on
   the non-selected). The colour is ALWAYS the node's. `const` thickness holds the on-screen line width
   fixed by scaling the texture stroke inversely to the ring size (operator). */
function _ringSprite(n, opacity){ var sz=_focSizeFor(n);
  var thick=(typeof CFG!=="undefined"&&CFG.focThick!=null)?CFG.focThick:4;
  if(typeof CFG!=="undefined"&&CFG.focThickConst) thick=Math.max(0.5, Math.round(thick*22/Math.max(6,sz)*2)/2);   // constant on-screen stroke: inverse to the ring size
  var s=new T.Sprite(new T.SpriteMaterial({map:_ringTex(typeof CFG!=="undefined"?CFG.focPat:null, thick, sz), color:new T.Color((n&&n.col)||"#9ecbff"), transparent:true, opacity:opacity, depthWrite:false, depthTest:false }));
  s.scale.set(sz,sz,1); s.__baseSize=sz; return s; }
/* the GLOW sprite — sphere-relative size, given radius/intensity, optional depth falloff from the origin */
function _glowFor(n, rad, inten, fallK){ var br=(typeof massR==="function")?massR(n):8, depth=(HL.set&&HL.set[n.id])||1;
  var fall=(fallK>0)?(1-fallK*Math.min(1,Math.max(0,depth-1)/Math.max(1,HL.depth))):1;   // depth-0 (selected) never fades
  return glowSprite((n&&n.col)||"#9ecbff", Math.max(6, br*rad*fall), inten*fall); }
var _hlPhase=0;
(function _hlSpin(){ requestAnimationFrame(_hlSpin); if(!(HL.on && HL.rings && HL.rings.length)) return;
  var anim=(typeof CFG!=="undefined"&&CFG.focAnim)||"spin", spd=(typeof CFG!=="undefined"&&CFG.focSpeed!=null)?CFG.focSpeed:1;
  _hlPhase=(_hlPhase + 0.05*spd) % 6.2832;   // BOUNDED phase — Date.now()*k overflowed float precision and froze the spin (operator: spin was dead)
  for(var i=0;i<HL.rings.length;i++){ var m=HL.rings[i]; if(!m||!m.material) continue;
    if(anim==="pulse"){ var bs=m.__baseSize||22, s2=Math.sin(_hlPhase*2), amp=(typeof CFG!=="undefined"&&CFG.pulseAmp!=null)?CFG.pulseAmp:0.13;
      if(typeof CFG!=="undefined"&&CFG.pulseMode==="const"){ var sc=Math.max(1, bs+amp*18*s2); m.scale.set(sc,sc,1); }   // CONSTANT world-unit swing — same absolute delta on every sphere (operator: big spheres over-pulsed)
      else { var f=1+amp*s2; m.scale.set(bs*f,bs*f,1); } }                                                                // PROPORTIONAL — swing scales with ring size (the old behavior)
    else if(anim==="none"){ /* static */ }
    else { m.material.rotation=_hlPhase; } } })();   // spin (default)
/* ── SELECTED LINE motion (operator: pulse / flow + separate glow) — same bounded phase as _hlSpin; NEVER Date.now()*k (that froze the spin) ── */
var _selPhase=0;
(function _selAnim(){ requestAnimationFrame(_selAnim);
  if(typeof CFG==="undefined") return;
  var sel=!!window.__uniSelLink, anim=CFG.selAnim||"none", spd=(CFG.selAnimSpeed!=null)?CFG.selAnimSpeed:1;
  if(window.__uniSelFlow && (!sel || anim!=="flow")) window.__uniSelFlow.visible=false;   // park the marching dots when idle
  if(!sel || anim==="none") return;
  _selPhase=(_selPhase + 0.05*spd) % 6.2832;
  if(anim==="pulse"){ var ms=window.__uniSelMeshes; if(ms) for(var i=0;i<ms.length;i++){ var m=ms[i]; if(!m||!m.material) continue;
      var b=(m.userData&&m.userData.__selBaseOp!=null)?m.userData.__selBaseOp:0.95; m.material.opacity=b*(0.35+0.65*(0.5+0.5*Math.sin(_selPhase))); } }   // breathe the tube's opacity between .35×base and 1×base
  else if(anim==="flow"){ var crv=window.__uniSelCurve; if(!crv||typeof Graph==="undefined"||!Graph) return;
    if(!window.__uniSelFlow){ try{ var _fg=new T.Group(); for(var k=0;k<3;k++){ var _d=new T.Mesh(new T.SphereGeometry(1,12,10), new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.98, blending:T.AdditiveBlending, depthWrite:false, depthTest:false})); _d.raycast=function(){}; _d.renderOrder=999; _fg.add(_d); } window.__uniSelFlow=_fg; Graph.scene().add(_fg); }catch(e){ return; } }
    var fg=window.__uniSelFlow; fg.visible=true; var base=_selPhase/6.2832, fs=((CFG.selThick!=null)?CFG.selThick:0.5)*2.6;   // 3 dots march source→target for a directional read
    for(var j=0;j<fg.children.length;j++){ var tt=(base + j/3)%1, p2=crv.getPoint(tt); if(p2) fg.children[j].position.copy(p2); fg.children[j].scale.setScalar(fs); } } })();
window.__uniHLReapply=function(){ if(!HL.on) return;                     // halos live in an INDEPENDENT scene group —
  var g0=_hlGroup(); if(!g0) return; _hlClearSprites();                   // node-object recreation can never kill them
  var _add=function(n, g, isRing){ if(!g) return; g.userData.nid=n.id; g.raycast=function(){}; g.position.set(n.x||0,n.y||0,n.z||0);
    g0.add(g); HL.sprites.push(g); if(isRing) HL.rings.push(g); };
  var _selEnts={}; if(HL.origin) HL.origin.forEach(function(id){ var o=NIDS[id]; if(o&&o.ent!=null) _selEnts[o.ent]=1; });   // entities of the selected element(s) — the dim ring stays inside them
  nodes.forEach(function(n){ if(HL.set[n.id]===undefined) return;
    var d0=HL.set[n.id]===0;
    if(!d0 && !_nodeVisibleFn(n)) return;                                  // a HIDDEN neighbour draws NO glow — its colored halo was confusing noise vs the clickable ghost stars (operator); connection ghosts already mark hidden connected nodes
    if(HL.mode!=="glow" && !d0) return;                                    // FOCUS mode: only the SELECTED element(s) carry markers
    if(d0){                                                                // SELECTED — ring + optional glow (both layers, operator)
      if(CFG.focRing!==false) _add(n, _ringSprite(n, 0.95), true);
      if(CFG.focGlow) _add(n, _glowFor(n, (CFG.focGlowRad!=null?CFG.focGlowRad:2), (CFG.focGlowInt!=null?CFG.focGlowInt:0.5), (CFG.focGlowFall!=null?CFG.focGlowFall:0)), false);
    } else {                                                               // NON-SELECTED — glow always; DIM ring only inside the selected entity (operator: outer entities glow-only)
      if(CFG.othGlow!==false) _add(n, _glowFor(n, (CFG.glowRad!=null?CFG.glowRad:2), (CFG.glowInt!=null?CFG.glowInt:0.55), (CFG.glowFall!=null?CFG.glowFall:0)), false);
      if(CFG.othRing && n.ent!=null && _selEnts[n.ent] && !(WALK.mode==="journey" && HL.exact)) _add(n, _ringSprite(n, (CFG.othRingInt!=null?CFG.othRingInt:0.35)), false);   // STATIC — same-entity only, only the FOCUS ring animates (operator); a walking journey's path context wears NO ring — the current step alone does
    } }); };
window.__uniHLTick=function(){                                                  // follow the sim every cluster tick (focus keeps origin halos)
  if(hlGroup && HL.on) hlGroup.children.forEach(function(s){ var p=_npos[s.userData.nid]; if(p) s.position.set(p.x,p.y,p.z); });
  var jg=window.__uniJrnNumGroup; if(jg && jg.children.length){ var _jo=(window.__uniJn&&window.__uniJn.off)||0; jg.children.forEach(function(s){ if(!s.userData.nid) return; var p=_npos[s.userData.nid]; if(p) s.position.set(p.x,p.y+_jo,p.z); }); } };   // journey step-number badges track the sim too (+ offset)
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
window.__uniHLSelect=function(n){ if(!n) return; HL.jr=null; HL.jrObj=null; HL.exact=false; HL.origin=[n.id]; HL.on=true; _hlCompute(); _hlRestyle();
  if(WALK.mode!=="trail"){ WALK.mode="trail"; WALK.steps=[]; }        // a user click while a journey walks = a fresh trail (the 2D rule)
  var ix=WALK.steps.indexOf(n.id);
  if(ix>=0) WALK.i=ix; else { WALK.steps.push(n.id); if(WALK.steps.length>7) WALK.steps.shift(); WALK.i=WALK.steps.length-1; }
  _walkRender(); };
window.__uniHLSelectLink=function(l){ if(!l) return; HL.jr=null; HL.jrObj=null; HL.exact=false;
  HL.origin=[lid(l.source), lid(l.target)]; HL.on=true; _hlCompute(); _hlRestyle(); };   // a WIRE select seeds the BFS from BOTH endpoints (depth control applies)
window.__uniPin=window.__uniPin||{};   // nodes a journey walk / reveal pinned past the critical solo fold — cleared with the walk
window.__uniHLClear=function(){ if(!HL.on && !WALK.mode) return; HL.on=false; window.__uniPin={}; try{ _applyVisNow({all:true}); }catch(e){} HL.jr=null; HL.jrObj=null; HL.exact=false; HL.origin=null; HL.set={}; HL.links=null;
  window.__uniSelLink=null;
  WALK.mode=null; WALK.steps=[]; WALK.i=0; _hlRestyle(); _walkRender(); };
window.__uniHLDepth=function(d){ HL.depth=Math.max(1,Math.min(5,d));
  // During a JOURNEY the path IS the set — a depth BFS from all ~67 path nodes FLOODS the view and can't
  // be undone (operator). So the depth slider does NOT widen a walking journey: it keeps the exact clean
  // path. (Depth still drives SELECTION highlighting outside a journey.) The number updates for later use.
  if(HL.jr){ _hlSyncUI(); return; }
  HL.exact=false;
  if(HL.on){ _hlCompute(); _hlRestyle(); } else _hlSyncUI(); };
window.__uniHLMode=function(){ HL.mode=(HL.mode==="glow")?"focus":"glow"; if(HL.on) _hlRestyle(); else _hlSyncUI(); };
/* ── JOURNEYS — cross-entity tests from det.test_journeys, deduped by cid. NAMED for free: the same
   feed's det.cases carries the real test name in the SAME cid space (test_delete_me_requires_auth_C12)
   → join + humanize, no new information invented. Grouped: END-TO-END (e2e corpus) first — the most
   interesting — then by the journey's STARTING entity (entities[0]). ── */
var JRN=null, _CNAMES=null;
/* the FIELD = drawn + capsule-stashed — journeys/cases are fold-independent facts (review 53[0]) */
function _fieldNodes(){ return _CAPST ? nodes.filter(function(n){ return !n.__cap; }).concat(_CAPST.nodes) : nodes; }
function _fieldLinks(){ return _CAPST ? links.filter(function(l){ return !l.__cap; }).concat(_CAPST.links) : links; }
function _fieldN(id){ if(NIDS[id]) return NIDS[id];
  if(_CAPST){ for(var i=0;i<_CAPST.nodes.length;i++) if(_CAPST.nodes[i].id===id) return _CAPST.nodes[i]; }
  return null; }
function _caseNames(){ if(_CNAMES) return _CNAMES; _CNAMES={};
  _fieldNodes().forEach(function(n){ ((n.det&&n.det.cases)||[]).forEach(function(c){
    if(c.cid && c.name && !_CNAMES[c.cid]) _CNAMES[c.cid]=c.name; }); });
  return _CNAMES; }
function _jrnName(j){ var nm=_caseNames()[j.cid]; if(!nm) return null;
  return nm.replace(/^test[_ ]?/,"").replace(/_C\d+$/,"").replace(/_/g," "); }
function _jrnCollect(){ if(JRN) return JRN; var m={};
  _fieldNodes().forEach(function(n){ ((n.det&&n.det.test_journeys)||[]).forEach(function(j){ if(!j.cid) return;
    var r=m[j.cid]||(m[j.cid]={cid:j.cid, corpora:{}, ents:j.entities||[], carriers:[]});
    r.corpora[j.corpus||"?"]=1; r.carriers.push(n.id); }); });
  JRN=Object.keys(m).map(function(k){ var j=m[k];
    j.agg=/^\d+ case/.test(j.cid);                              // the emitter caps web/e2e journeys into "N case(s)" AGGREGATE rows — label them honestly
    j.e2e=!!j.corpora.e2e; j.corpus=Object.keys(j.corpora).sort().join("+");
    j.name=j.agg ? (j.corpus+" tests · "+j.cid+" (aggregated)") : _jrnName(j);
    j.start=(j.ents[0]||"other");
    j.fe=_jrnFeLeg(j.carriers); j.feN=j.fe.users.length+j.fe.screens.length;   // batch 49: the FRONTEND leg this journey's endpoints reach over the bridge
    j.carriers.sort(function(a,b){ var ea=(_fieldN(a)||{}).ent||"", eb=(_fieldN(b)||{}).ent||"";   // steps walk entity-by-entity along the span
      var ia=j.ents.indexOf(ea), ib=j.ents.indexOf(eb); if(ia!==ib) return ia-ib; return a<b?-1:1; });
    return j; });
  var bk=[]; try{ bk=_bkCollect(); }catch(e){}            // derived BACKEND journeys — honest-empty on any failure
  var wf=[]; try{ wf=_wfCollect(bk); }catch(e){}          // curated USER WORKFLOWS over those chains
  var cm=[]; try{ cm=_commitCollect(); }catch(e){}        // recent COMMITS as coverage journeys (window.GABE_COMMITS)
  JRN=wf.concat(bk).concat(cm).concat(JRN);
  return JRN; }
/* ── COMMIT journeys — each recent commit (window.GABE_COMMITS, from _a3_commits) becomes a
   COVERAGE journey: its carriers are the CURRENT-graph nodes it touched (a touched id that no
   longer exists is dropped — honest). Not an ordered chain; walked entity-by-entity like a test.
   The date BUCKET (today/this week/…) is computed HERE at view time (the emitter forbids
   wallclock). Absent feed → no rows, never fabricated. ── */
function _commitBucket(iso){ var t=Date.parse(iso); if(isNaN(t)) return "older";
  var d=(Date.now()-t)/86400000; return d<1?"today":(d<7?"this week":(d<30?"this month":"older")); }
function _commitCollect(){ var C=window.GABE_COMMITS; if(!C||!C.length) return [];
  return C.map(function(c){
    var carriers=(c.touched||[]).filter(function(id){ return !!_fnById(id); });   // only nodes still on the map
    var ents={}; carriers.forEach(function(id){ var n=_fnById(id); if(n&&n.ent) ents[n.ent]=1; });
    carriers.sort(function(a,b){ var na=_fnById(a)||{}, nb=_fnById(b)||{}; var ea=na.ent||"", eb=nb.ent||"";
      return ea<eb?-1:(ea>eb?1:(a<b?-1:1)); });                                    // entity-by-entity coverage order
    return { cid:"commit:"+c.sha, commit:true, corpora:{commit:1}, corpus:"commit", agg:false, e2e:false,
      ents:Object.keys(ents), carriers:carriers,
      meta:carriers.map(function(id){ return { id:id, why:"touched", from:null }; }),   // step note: "touched by this commit"
      name:(c.short?c.short+" ":"")+(c.subject||c.sha), short:c.short, date:c.date, author:c.author,
      nFiles:c.nFiles||0, nTouched:carriers.length, start:_commitBucket(c.date),
      fe:{screens:[],users:[]}, feN:0 }; })
    .filter(function(j){ return j.carriers.length; }); }   // a commit that touched nothing ON THE MAP has no journey
/* ── BACKEND journeys (operator, 2026-08-27): a test journey is a COVERAGE SET (every element one
   test touches, sorted entity-by-entity) — not an execution order, so it reads as noise. A backend
   journey is the graph's OWN trace, ordered by hops: endpoint → handler → calls (BFS) → each
   writer's models right after it. Derived client-side from the fn feed the map already carries
   (_FNLINKS: handler · calls · fnwrites/fnreads) — no emitter change, no curation. Steps carry
   META {hop, why, from} so the step note can say what is happening. Capped per journey (honest
   "+N" in the name). ── */
var _BK_CAP=28, _GATE_CAP=8;   // the write chain gets _BK_CAP; the gate pre-hop is bounded separately (review [0])
function _bkFeLeg(eps){ var l=_jrnFeLeg(eps);   // a user reaches an endpoint from a SCREEN → keep the driving components, but only SAME-FEATURE ones (operator): a fetching hook is used by several screens across features; keep only those in the fetching hook's OWN feature, dropping big shared containers. The walk orders users→screens→endpoint, so it starts at the on-feature screen.
  var _fEnts={}; l.screens.forEach(function(id){ var n=_fnById(id); if(n&&n.ent) _fEnts[n.ent]=1; });
  var users=l.users.filter(function(id){ var n=_fnById(id); return !!(n && _fEnts[n.ent]); });
  return { screens:l.screens, users:users }; }
function _fnById(id){ if(NIDS[id]) return NIDS[id]; var f=_fieldN(id); if(f) return f;
  if(_FNNODES){ for(var i=0;i<_FNNODES.length;i++) if(_FNNODES[i].id===id) return _FNNODES[i]; } return null; }
function _bkCollect(){ if(!_FNNODES){ try{ _buildFnData(); }catch(e){} } if(!_FNLINKS) return [];
  var calls={}, handler={}, acc={}, dep={}, disp={};
  _FNLINKS.forEach(function(l){ if(l.rel==="calls") (calls[l.source]=calls[l.source]||[]).push(l.target);
    else if(l.rel==="depends") (dep[l.source]=dep[l.source]||[]).push(l.target);           // K1 gate chain — WALK it, not just draw (wave D / P7)
    else if(l.rel==="dispatches") (disp[l.source]=disp[l.source]||[]).push(l.target);        // J3 event-bus leg — WALK it, not just draw (wave D / P7)
    else if(l.rel==="handler") handler[l.source]=l.target;
    else if(l.access){ var A=(acc[l.source]=acc[l.source]||{}); A[l.target]=A[l.target]||(l.rel==="fnwrites"); } });   // read+write on one model = a WRITER of it (write wins)
  Object.keys(acc).forEach(function(k){ acc[k]=Object.keys(acc[k]).sort().map(function(t){ return {t:t, w:acc[k][t]}; }); });
  var _d2wOf=function(id){ var f=_fnById(id); return (f&&f.d2w!=null)?f.d2w:99; };
  Object.keys(calls).forEach(function(k){ calls[k].sort(function(a,b){ return (_d2wOf(a)-_d2wOf(b))||(a<b?-1:1); }); });   // within a hop, the write path leads (d2w ascending), then name
  [dep, disp].forEach(function(M){ Object.keys(M).forEach(function(k){ M[k].sort(function(a,b){ return (_d2wOf(a)-_d2wOf(b))||(a<b?-1:1); }); }); });   // deterministic walk order
  var out=[];
  _fieldNodes().forEach(function(ep){ if(ep.kind!=="endpoint") return; var h=handler[ep.id]; if(!h) return;
    var steps=[{id:ep.id, hop:0, why:"endpoint"}], seen={}; seen[ep.id]=1; seen[h]=1;
    var q=[[h,1,"fn",null]], ents={}; ents[ep.ent]=1; var writes=0, reads=0, more=0, disps=0;
    // ── the write CHAIN first: handler → calls (BFS) → dispatched handlers, each writer's models.
    //    Owns the FULL _BK_CAP; gates are a bounded pre-hop added AFTER (review [0]: a gate-heavy handler
    //    must not starve its own write chain), and never touch this `seen` (review [1]/[4]: a fn that is
    //    both a gate AND a deep call-target is walked DEEP here, not claimed shallow).
    while(q.length){ var cur=q.shift(), fid=cur[0], hop=cur[1], cwhy=cur[2]||"fn", cfrom=cur[3]||null, f=_fnById(fid); if(!f) continue;
      if(steps.length>=_BK_CAP){ more++; continue; }
      steps.push({id:fid, hop:hop, why:cwhy, from:cfrom}); if(f.ent) ents[f.ent]=1;
      if(cwhy==="dispatch") disps++;
      (acc[fid]||[]).forEach(function(a){ var key=a.t+"|"+fid; if(seen[key]) return; seen[key]=1;
        if(steps.length>=_BK_CAP){ more++; return; }
        steps.push({id:a.t, hop:hop+1, why:a.w?"write":"read", from:fid}); if(a.w) writes++; else reads++;
        var mn=_fieldN(a.t); if(mn&&mn.ent) ents[mn.ent]=1; });
      (calls[fid]||[]).forEach(function(t){ if(!seen[t]){ seen[t]=1; q.push([t,hop+1,"fn",fid]); } });
      (disp[fid]||[]).forEach(function(t){ if(!seen[t]){ seen[t]=1; q.push([t,hop+1,"dispatch",fid]); } }); }   // the event bus continues the trace
    // ── the GATE pre-hop (Hop 0.5): the handler's Depends() gates the chain didn't already walk, each
    //    SHALLOW (itself + its OWN model reads). A gate already in the chain is shown deep there (skip it).
    //    Bounded by _GATE_CAP so it decorates the chain without ballooning; inserted before the handler.
    //    FLOOR: a gate's writes that live ONLY in its private callee subtree are not walked (deliberate —
    //    gates are auth/validation; a deep-writing gate is dormant on gustify). Trigger to revisit: a
    //    journey whose gate reads a model but its deeper write is absent.
    var gsteps=[], gates=0, gseen={};
    (dep[h]||[]).forEach(function(g){ if(seen[g]||gseen[g]) return; var gf=_fnById(g); if(!gf) return;
      if(gates>=_GATE_CAP){ more++; return; }
      gseen[g]=1; gsteps.push({id:g, hop:0.5, why:"gate", from:h}); gates++; if(gf.ent) ents[gf.ent]=1;
      (acc[g]||[]).forEach(function(a){ var key=a.t+"|"+g; if(seen[key]||gseen[key]) return; gseen[key]=1;
        gsteps.push({id:a.t, hop:0.5, why:a.w?"write":"read", from:g}); if(a.w) writes++; else reads++;
        var mn=_fieldN(a.t); if(mn&&mn.ent) ents[mn.ent]=1; }); });
    if(gsteps.length) steps=[steps[0]].concat(gsteps, steps.slice(1));   // gates render right after the endpoint, before the handler
    if(steps.length<2) return;
    out.push({ cid:"bk:"+ep.id, bk:true, ep:ep.id, corpora:{backend:1}, corpus:"backend", agg:false, e2e:false,
      ents:Object.keys(ents), carriers:steps.map(function(s){ return s.id; }), meta:steps,
      writes:writes, reads:reads, more:more, gates:gates, disps:disps, method:String(ep.label||"").split(" ")[0],
      name:(ep.label||ep.id)+(more?(" (+"+more+"+ more — capped at "+_BK_CAP+" steps)"):""), start:ep.ent||"other", fe:_bkFeLeg([ep.id]) });   // a FLOOR: fns cut at the cap never count their own subtrees
    out[out.length-1].feN=out[out.length-1].fe.users.length+out[out.length-1].fe.screens.length; });
  out.sort(function(a,b){ return (b.writes-a.writes)||(b.carriers.length-a.carriers.length)||(a.name<b.name?-1:1); });
  return out; }
/* curated USER WORKFLOWS — window.GABE_WORKFLOWS = [{name, steps:["METHOD /path", …], note}] (the
   center's workflows.js; absent → no tab content, never fabricated). A workflow = its endpoints'
   backend chains walked in the curated order; an endpoint the map has no chain for is COUNTED
   in the row (unmapped), never silently dropped. */
function _wfCollect(bk){ var W=window.GABE_WORKFLOWS; if(!W||!W.length) return [];
  var byLabel={}; bk.forEach(function(j){ var ep=_fieldN(j.ep); if(ep&&ep.label) byLabel[ep.label]=j; });
  return W.map(function(w,i){ var steps=[], ents={}, miss=[], writes=0, epn=0;
    (w.steps||[]).forEach(function(lbl){ var j=byLabel[lbl]; if(!j){ miss.push(lbl); return; } epn++;
      j.meta.forEach(function(m){ steps.push({id:m.id, hop:m.hop, why:m.why, from:m.from, ep:j.ep}); });
      j.ents.forEach(function(e){ ents[e]=1; }); writes+=j.writes; });
    var eps=(w.steps||[]).filter(function(l){ return byLabel[l]; }).map(function(l){ return byLabel[l].ep; });
    return { cid:"wf:"+i, wf:true, corpora:{workflow:1}, corpus:"workflow", agg:false, e2e:false,
      ents:Object.keys(ents), carriers:steps.map(function(s){ return s.id; }), meta:steps, writes:writes,
      epn:epn, miss:miss, note:w.note||"", name:w.name||("workflow "+(i+1)), start:"user workflows",
      level:(w.level>=1&&w.level<=3)?w.level:0,                // dev-onboarding level (1/2/3; anything else → 0 = unleveled, ONE "other" bucket)
      fe:_bkFeLeg(eps), feN:0 }; }).map(function(j){ j.feN=j.fe.users.length+j.fe.screens.length; return j; }); }   // an all-unmapped workflow KEEPS its row (unmapped counted) — the start is a no-op
function _jrnRow(j){ var badge=j.bk?j.method:(j.wf?(j.epn+" ep"+(j.miss.length?(" · "+j.miss.length+" unmapped"):"")):(j.commit?(j.nTouched+" el"):(j.agg?"agg":j.cid)));
  var tt=(j.commit?("commit "+(j.short||"")+(j.date?(" · "+String(j.date).slice(0,10)):"")+(j.author?(" · "+j.author):"")+" · touched "+j.nTouched+" element(s) across "+(j.nFiles||0)+" file(s)"+(j.ents.length?(" · "+j.ents.join(", ")):"")):(j.ents.join(" → ")))+(j.feN?(" · reaches "+j.feN+" frontend piece(s) over the bridge"):"")+(j.bk?(" · "+j.writes+" write(s) · "+j.reads+" read(s)"+(j.gates?(" · "+j.gates+" gate(s)"):"")+(j.disps?(" · "+j.disps+" dispatch(es)"):"")+" · ordered by hops"):"")+(j.wf?(" · "+(j.note||"curated user workflow")+(j.miss.length?(" · unmapped: "+j.miss.join(", ")):"")):"");
  return '<div class="jrnrow'+(HL.jr===j.cid?" on":"")+'" data-jr="'+j.cid+'" title="'+tt.replace(/"/g,"&quot;")+'">'
  +(j.wf&&j.level&&_JRNLEVELS[j.level]?('<span class="jrnlvl l'+j.level+'" title="level '+j.level+' · '+_JRNLEVELS[j.level].label+'">'+_JRNLEVELS[j.level].ico+'</span>'):"")
  +'<span class="jrnname">'+(j.name||j.cid)+'</span><b>'+badge+'</b><span class="jrncorp">'+j.corpus+'</span>'
  +(j.feN?('<span class="jrnfe">'+svgInline("component", KINDCOL.component, 10)+j.feN+'</span>'):"")
  +'<span class="jrnn">'+j.ents.length+' ents</span></div>'; }
/* ── the FRONTEND LEG (batch 49) — derived from wires the map ALREADY carries, no emitter change:
   a journey's carrier ENDPOINTS are fetched over `bridge` wires by their screen PIECES (the hook/
   component that fetches — the web node was absorbed into it, batch 48), and those screens are driven
   by their direct USERS (`uses`/`renders` sources: the components/routes that call the hook). The leg
   walks UI → API → data: users → screens → carriers. One hop up on purpose — the full renders chain
   is the depth slider's job, not the journey's. ── */
function _jrnFeLeg(carriers){ var cs={}; carriers.forEach(function(id){ cs[id]=1; });
  var scr={}, use={}, FL=_fieldLinks();
  FL.forEach(function(l){ if(l.rel==="bridge" && cs[lid(l.target)]) scr[lid(l.source)]=1; });
  // WRAPPER CLIMB: a bridged screen that is a plain shared MODULE whose non-module callers live
  // in a DIFFERENT entity is a cross-cutting lib client (an SSE wrapper like lib/api/sse.ts,
  // homed to app-shell) — transparent, not a feature surface. Swap it for those callers so the
  // leg reaches the real feature piece and _bkFeLeg's same-feature filter homes to the caller's
  // entity, not the lib's. A component/hook/route/store screen, or a module whose callers share
  // its own entity (a feature's own container), is already a feature surface and is KEPT.
  Object.keys(scr).forEach(function(sid){ var sn=_fnById(sid); if(!(sn && sn.kind==="module")) return;
    var callers=[];
    FL.forEach(function(l){ if((l.rel==="uses"||l.rel==="renders"||l.rel==="fecall"||l.rel==="reads") && lid(l.target)===sid){
      var c=_fnById(lid(l.source)); if(c && c.kind!=="module" && c.ent && c.ent!==sn.ent) callers.push(lid(l.source)); } });
    if(callers.length){ delete scr[sid]; callers.forEach(function(c){ scr[c]=1; }); } });
  FL.forEach(function(l){ if((l.rel==="uses"||l.rel==="renders"||l.rel==="fecall"||l.rel==="reads") && scr[lid(l.target)]) use[lid(l.source)]=1; });   // fecall/reads too: a fetching MODULE or store has callers, not renderers
  Object.keys(scr).forEach(function(id){ delete use[id]; });               // a screen is a screen, never doubled as its own user
  return { screens:Object.keys(scr).sort(), users:Object.keys(use).sort() }; }
window.__uniJrnStart=function(cid){ var p=document.getElementById("jrn"); if(p) p.style.display="none";
  if(!cid){ __uniHLClear(); return; }
  var j=_jrnCollect().filter(function(x){ return x.cid===cid; })[0]; if(!j||!j.carriers.length) return;
  // The FRONTEND leg is part of the journey — a user reaches an endpoint THROUGH the frontend, so the
  // walk starts there (operator). Include every fe piece that EXISTS as a node/stash, exactly like the
  // backend carriers below; the wake loop then surfaces their kind. Do NOT drop a TIER-hidden screen
  // (the old visN filter emptied the leg at T1, where hooks are hidden → journeys started at the endpoint).
  var fe=j.fe?j.fe.users.concat(j.fe.screens).filter(function(id){
    return !!(NIDS[id] || (_CAPST&&_CAPST.byPiece[id]&&_fieldN(id))); }):[];
  if((j.bk||j.wf) && window.__uniKindState && window.__uniSetKindState){   // the chain's steps are fns — an OFF function layer would make every step dead
    var _fs=__uniKindState["function"]||(typeof _kindDefault==="function"?_kindDefault("function"):"all");
    if(_fs==="off") __uniSetKindState("function","all"); }
  HL.jr=cid; HL.jrObj=j; HL.exact=true; HL.origin=fe.concat(j.carriers); HL.on=true; _hlCompute(); _hlRestyle();
  WALK.mode="journey"; WALK.steps=fe.concat(j.carriers); WALK.i=0; WALK.feLen=fe.length;
  window.__uniPin={}; WALK.steps.forEach(function(id){ window.__uniPin[id]=1; });   // pins belong to THIS walk (no accumulation across journeys)
  if(window.__uniKindState && window.__uniSetKindState){ var _woke={};                 // an OFF kind (model/endpoint/schema…) would hide its steps — wake it to critical
    WALK.steps.forEach(function(id){ var sn=_fnById(id); if(!sn||_woke[sn.kind]) return; _woke[sn.kind]=1;
      var st=__uniKindState[sn.kind]||(typeof _kindDefault==="function"?_kindDefault(sn.kind):"all"); if(st==="off") __uniSetKindState(sn.kind,"all",true); }); }
  try{ _applyVisNow({all:true}); }catch(e){}   // every step visible past the solo fold
  _walkRender(); _walkGo(0); };
/* ── the journeys PICKER (operator): PERSISTENT entity chips on top (click to hide that entity's group) ·
   KIND TABS below (end-to-end / by-entity / aggregated) · the selected kind's journeys grouped by START
   entity into COLLAPSIBLE groups (click a group title to fold its tests). __uniJrnExcl = hidden start-
   entities; __uniJrnKind = the open kind tab; __uniJrnCollapse = folded groups. ── */
window.__uniJrnExcl=window.__uniJrnExcl||{}; window.__uniJrnKind=window.__uniJrnKind||null; window.__uniJrnCollapse=window.__uniJrnCollapse||{};   // default tab resolved LAZILY at first paint (workflows.js loads at runtime)
var _JRNKINDS=[["wf","workflows"],["commit","commits"],["bk","backend"],["e2e","end-to-end"],["ent","by-entity"],["agg","aggregated"]];
// journey-kind TAB icons (operator: replace the type-title selectors with icons; the WORD stays on
// hover via title=, per the legend-visual ruling — the tab shows the glyph, not the word). route ·
// server · bullseye · box · layers — currentColor so each inherits the tab's muted/on colour.
var _JRNKINDICO={
  wf:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>',
  bk:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
  e2e:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  ent:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  agg:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 11-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.9 11"/></svg>',
  commit:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/></svg>' };
var _JCHEV='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
// dev-onboarding expertise tiers (operator): a filled-bar RAMP — N bars for level N — reads as
// "level" without a word; the label rides beside it in the group header.
function _lvlBars(n){ var b=''; for(var i=0;i<3;i++){ var on=i<n, h=6+i*4, y=20-h;
    b+='<rect x="'+(3+i*6)+'" y="'+y+'" width="4" height="'+h+'" rx="1" '+(on?'fill="currentColor"':'fill="currentColor" opacity="0.22"')+'/>'; }
  return '<svg viewBox="0 0 24 24" width="13" height="13">'+b+'</svg>'; }
// info glyph (ⓘ) — the classification explainer per level header, hover shows `vars` (legend law: word on hover)
var _JINFO='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>';
var _JRNLEVELS={
  1:{label:"Orientation",  hint:"get your bearings — how you get in, how data flows out", ico:_lvlBars(1),
     vars:"Classified here: entry + read paths — auth/setup and browsing; low or no writes; the foundational entities you meet first."},
  2:{label:"Core",         hint:"the critical flows the app exists for", ico:_lvlBars(2),
     vars:"Classified here: the load-bearing write-loops — the central create/update flows the app exists for; moderate-to-high writes across the domain."},
  3:{label:"Specialized",  hint:"the deep end — AI, GDPR, config, cross-cutting edges", ico:_lvlBars(3),
     vars:"Classified here: the edges — AI/streaming, GDPR/account, config/settings, and cross-cutting or external-spend flows."} };
function _jrnKindOf(j){ return j.wf?"wf":(j.commit?"commit":(j.bk?"bk":(j.e2e?"e2e":(j.agg?"agg":"ent")))); }   // workflows · commits · backend · then the test kinds (e2e > agg > by-entity)
function _jrnTouch(){ var c={}; _jrnCollect().forEach(function(j){ var s={}; j.ents.forEach(function(e){ if(!s[e]){ s[e]=1; c[e]=(c[e]||0)+1; } }); }); return c; }   // journeys TOUCHING each entity (span) — ALL entities, not just group heads
function _jrnVisible(j){ if(j.wf && !j.ents.length) return true;                                // an ALL-UNMAPPED workflow has no span — it stays visible so its 'unmapped' badge can say so
  return j.ents.some(function(e){ return !window.__uniJrnExcl[e]; }); }   // SPAN filter: a journey shows iff its span touches ≥1 INCLUDED entity
function _jrnKindCount(k){ return _jrnCollect().filter(function(j){ return _jrnKindOf(j)===k && _jrnVisible(j); }).length; }
function _jrnChipsHTML(){ var c=_jrnTouch(); var ks=Object.keys(c).sort();   // COLLAPSED by default (operator): all-at-once was too much — tuck the picker behind a toggle
  var nHid=ks.filter(function(e){ return window.__uniJrnExcl[e]; }).length, nShown=ks.length-nHid, open=!!window.__uniJrnEntOpen;
  var h='<div class="jrnenttog'+(open?" open":"")+'" id="jrnEntTog" title="entity filter — click to '+(open?"collapse":"expand")+'"><span class="jcar">'+_JCHEV+'</span>entities · <b>'+nShown+'</b> shown'+(nHid?(' · <b class="hid">'+nHid+'</b> hidden'):"")+'</div>';
  if(!open) return h;                                        // collapsed → just the one-line toggle
  h+='<div class="jrnenthint">click an entity to drop it from the filter · middle-click = only that one</div><div class="jrnentgrid">';
  ks.forEach(function(e){ var off=!!window.__uniJrnExcl[e];
    h+='<span class="jrnent'+(off?" off":"")+'" data-e="'+e+'" style="--ec:'+(ENT[e]||"#888")+'" title="'+c[e]+' journey(s) touch '+e+'"><i></i>'+e+'<b>'+c[e]+'</b></span>'; });
  return h+'</div>'; }
function _jrnTabsHTML(){ var sel=window.__uniJrnKind;
  return '<div class="jrnkindtabs">'+_JRNKINDS.map(function(kd){ return '<button data-jk="'+kd[0]+'" title="'+kd[1]+'"'+(kd[0]===sel?' class="on"':'')+'>'+(_JRNKINDICO[kd[0]]||kd[1])+'<b>'+_jrnKindCount(kd[0])+'</b></button>'; }).join('')+'</div>'; }
function _jrnGroupsHTML(){ var sel=window.__uniJrnKind, bySpan=function(a,b){ return (b.ents.length-a.ents.length)||(b.carriers.length-a.carriers.length); };
  var vis=_jrnCollect().filter(function(j){ return _jrnKindOf(j)===sel && _jrnVisible(j); });
  var h='<div class="jrnrow jrnnone" data-jr="">— none (clear)</div>';
  if(!vis.length) return h+'<div class="jrnnone" style="padding:8px 7px">no '+sel+' journeys for the included entities</div>';
  if(sel==="wf"){                                              // WORKFLOWS group by DEV-ONBOARDING LEVEL (operator): a new dev reads ①→②→③ top-down
    var byLvl={}; vis.forEach(function(j){ var L=j.level||99; (byLvl[L]=byLvl[L]||[]).push(j); });
    h+='<div class="jrnlede">a learning ladder — start at the top and work down. click a level to collapse it · middle-click to focus just that level.</div>';
    Object.keys(byLvl).map(Number).sort(function(a,b){ return a-b; }).forEach(function(L){
      var m=_JRNLEVELS[L]||{label:"other",hint:"unleveled — no level assigned",ico:_lvlBars(0)}, key="lvl"+L, cl=!!window.__uniJrnCollapse[key];
      h+='<div class="jrngrp jgcl jglvl'+(cl?" cl":"")+'" data-ge="'+key+'" title="'+m.hint+' — middle-click to focus"><span class="jcar">'+_JCHEV+'</span><span class="jglvlico">'+m.ico+'</span><span class="jglvlnm">'+m.label+'</span><b class="jglvln">'+byLvl[L].length+'</b><span class="jglvlinfo" title="'+String(m.vars||"").replace(/"/g,"&quot;")+'">'+_JINFO+'</span><span class="jglvlhint">'+m.hint+'</span></div>';
      if(!cl) byLvl[L].forEach(function(j){ h+=_jrnRow(j); });   // curated order within a level — never re-sorted
    });
    return h;
  }
  if(sel==="commit"){                                          // COMMITS group by DATE BUCKET, newest first (emitter order preserved within a bucket)
    var BORD=["today","this week","this month","older"], byB={}; vis.forEach(function(j){ (byB[j.start]=byB[j.start]||[]).push(j); });
    h+='<div class="jrnlede">each commit is a coverage journey — walk the elements it touched. newest first.</div>';
    BORD.filter(function(b){ return byB[b]; }).forEach(function(b){ var key="cm:"+b, cl=!!window.__uniJrnCollapse[key];
      h+='<div class="jrngrp jgcl'+(cl?" cl":"")+'" data-ge="'+key+'"><span class="jcar">'+_JCHEV+'</span>'+b+' · '+byB[b].length+'</div>';
      if(!cl) byB[b].forEach(function(j){ h+=_jrnRow(j); }); });
    return h;
  }
  var groups={}; vis.forEach(function(j){ (groups[j.start]=groups[j.start]||[]).push(j); });
  Object.keys(groups).sort().forEach(function(g){ var cl=!!window.__uniJrnCollapse[g];
    h+='<div class="jrngrp jgcl'+(cl?" cl":"")+'" data-ge="'+g+'" style="color:'+(ENT[g]||"var(--muted)")+'"><span class="jcar">'+_JCHEV+'</span>'+g+' · '+groups[g].length+'</div>';
    if(!cl) (g==="user workflows"?groups[g]:groups[g].sort(bySpan)).forEach(function(j){ h+=_jrnRow(j); }); });   // curated order is the operator's — never re-sorted
  return h; }
function _jrnPaint(p){ if(!window.__uniJrnKind) window.__uniJrnKind=((window.GABE_WORKFLOWS||[]).length?"wf":"bk");   // workflows when curated, else the derived backend chains
  var js=_jrnCollect();
  var _nt=js.filter(function(j){ return !j.bk&&!j.wf; }).length, _nb=js.filter(function(j){ return j.bk; }).length, _nw=js.filter(function(j){ return j.wf; }).length;
  p.innerHTML='<div class="jrnhd">journeys · '+_nw+' workflow(s) · '+_nb+' backend chain(s) · '+_nt+' cross-entity test(s)</div>'+_jrnChipsHTML()+_jrnTabsHTML()+'<div class="jrnlist">'+_jrnGroupsHTML()+'</div>';
  var _et=p.querySelector("#jrnEntTog"); if(_et) _et.onclick=function(){ window.__uniJrnEntOpen=!window.__uniJrnEntOpen; _jrnPaint(p); };   // COLLAPSE/expand the entity picker (operator)
  p.querySelectorAll(".jrnent").forEach(function(c){ c.onclick=function(){ var e=c.getAttribute("data-e"); if(window.__uniJrnExcl[e]) delete window.__uniJrnExcl[e]; else window.__uniJrnExcl[e]=1; _jrnPaint(p); };
    c.onauxclick=function(ev){ if(ev.button!==1) return; ev.preventDefault(); window.__uniJrnSolo(c.getAttribute("data-e")); _jrnPaint(p); };   // middle-click = SOLO this entity (operator)
    c.onmousedown=function(ev){ if(ev.button===1) ev.preventDefault(); }; });   // no autoscroll on the wheel button
  p.querySelectorAll(".jrnkindtabs button").forEach(function(b){ b.onclick=function(){ window.__uniJrnKind=b.getAttribute("data-jk"); _jrnPaint(p); }; });
  p.querySelectorAll(".jgcl").forEach(function(g){ g.onclick=function(){ var e=g.getAttribute("data-ge"); if(window.__uniJrnCollapse[e]) delete window.__uniJrnCollapse[e]; else window.__uniJrnCollapse[e]=1; _jrnPaint(p); }; });
  p.querySelectorAll(".jglvl").forEach(function(g){                                    // middle-click a LEVEL header = FOCUS just that level (mirror the entity solo — operator gap)
    g.onauxclick=function(ev){ if(ev.button!==1) return; ev.preventDefault(); window.__uniJrnLvlSolo(g.getAttribute("data-ge")); _jrnPaint(p); };
    g.onmousedown=function(ev){ if(ev.button===1) ev.preventDefault(); }; });          // no autoscroll on the wheel button
  p.querySelectorAll(".jrnrow").forEach(function(r){ r.onclick=function(){ __uniJrnStart(r.getAttribute("data-jr")); }; }); }
window.__uniJrnLvlSolo=function(key){ var keys={}; _jrnCollect().forEach(function(j){ if(j.wf) keys["lvl"+(j.level||99)]=1; }); keys=Object.keys(keys);
  var others=keys.filter(function(k){ return k!==key; });
  var soloed=others.length && others.every(function(k){ return window.__uniJrnCollapse[k]; }) && !window.__uniJrnCollapse[key];
  keys.forEach(function(k){ delete window.__uniJrnCollapse[k]; });                       // clear, then collapse the rest (repeat middle-click = restore all)
  if(!soloed) others.forEach(function(k){ window.__uniJrnCollapse[k]=1; }); };
window.__uniJrnSolo=function(e){ var all=Object.keys(_jrnTouch()); var only=all.length&&all.every(function(x){ return x===e||window.__uniJrnExcl[x]; })&&!window.__uniJrnExcl[e];
  window.__uniJrnExcl={}; if(!only) all.forEach(function(x){ if(x!==e) window.__uniJrnExcl[x]=1; }); };   // already solo → middle-click again restores all
window.__uniJrnToggle=function(){ var p=document.getElementById("jrn"); if(!p) return;
  if(p.style.display!=="none"){ p.style.display="none"; _stepNote(); return; }
  _jrnPaint(p); p.style.display=""; _stepNote(); };
/* ── the STEP NOTE — "what the hell is happening at this step" (operator): DERIVED per node kind from
   the map's own facts (role · d2w · access ops · middleware · behind · doc) + the journey META (hop ·
   why · from). Top-centre over the graph while a walk is live; hidden under the picker. ── */
function _stepNote(){ var el=document.getElementById("stepnote"); if(!el) return;
  var jp=document.getElementById("jrn"), pickerOpen=jp&&jp.style.display!=="none";
  var active=(WALK.mode==="trail"||WALK.mode==="journey")&&WALK.steps.length;
  if(!active||pickerOpen){ el.style.display="none"; return; }
  var id=WALK.steps[WALK.i], n=_fnById(id), j=HL.jrObj, meta=null;
  if(j&&j.meta){ var mi=WALK.i-(WALK.feLen||0);                                    // META aligns with the CARRIERS (steps = fe leg + carriers) — by INDEX, so a repeated model keeps its own writer
    if(mi>=0 && mi<j.meta.length && j.meta[mi].id===id) meta=j.meta[mi];
    else { for(var k=0;k<j.meta.length;k++){ if(j.meta[k].id===id){ meta=j.meta[k]; break; } } } }
  var esc=function(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); };
  var lbl=n?(n.label||id):id.split("#").pop(), kind=n?n.kind:"?", ent=n&&n.ent||"", col=(ENT[ent]||(n&&n.col))||"#888";
  var what="", doc=(n&&n.det&&n.det.doc)?(function(d){ var m=/^[\s\S]*?[.!?](?=\s|$)/.exec(d); return m?m[0]:d; })(String(n.det.doc)):"";
  var accTxt=function(a){ if(!a||!a.ops||!a.ops.length) return ""; var w=[],r=[]; a.ops.forEach(function(o){ (o.rw==="w"?w:r).push(o.model); });
    return (w.length?('<span class="snw">writes</span> '+esc(w.join(", "))):"")+(w.length&&r.length?" · ":"")+(r.length?('<span class="snr">reads</span> '+esc(r.join(", "))):""); };
  if(kind==="endpoint"){ var gates=(n.middleware||[]).filter(function(m){ return m.gate; }).map(function(m){ return m.name; });
    what="API endpoint — the entity's outward door. "+(gates.length?("Gated by "+esc(gates.join(", "))+". "):"")+(n.m&&n.m.behind?("Pulls in "+n.m.behind+" function(s) behind its handler. "):"");
    var ea=n.access&&n.access.ops?accTxt(n.access):""; if(ea) what+="Rollup: "+ea+"."; }
  else if(kind==="function"){ var d=n.d2w, role=n.role||"function";
    var band=(d===0)?"a WRITE-ANCHOR — writes here or holds the commit":(d===1)?"one hop from a write":(d==null)?"never reaches a write (read / serialize path)":(d+" hops from a write");
    what=esc(role)+" function · "+band+". "; var fa=accTxt(n.access); if(fa) what+=fa+". ";
    if(n.m&&n.m.behind) what+="Calls "+n.m.behind+" function(s) beneath it. "; }
  else if(kind==="model"){ var wby=[], rby=[], _seenW={}; (_FNLINKS||[]).forEach(function(l){ if(l.access&&l.target===id){ var f=_fnById(l.source), nm=f?f.label:l.source.split("#").pop(), kk=l.rel+"|"+nm; if(_seenW[kk]) return; _seenW[kk]=1; (l.rel==="fnwrites"?wby:rby).push(nm); } });
    what="data model"+(n.m&&n.m.cols?(" · "+n.m.cols+(n.m.cols>=10?"+":"")+" column(s)"):"")+". "+(wby.length?('<span class="snw">written by</span> '+esc(wby.join(", "))+". "):"")+(rby.length?('<span class="snr">read by</span> '+esc(rby.join(", "))+". "):"");
    if(!wby.length&&!rby.length) what+="No drawn function touches it directly (endpoint rollups only)."; }
  else if(kind==="schema"){ what="request/response shape — the data contract this journey carries over the wire."; }
  else if(n&&n.fe){ what=esc(kind)+" (frontend) — "+(kind==="screen"||kind==="web"?"the screen that fetches this journey's endpoint":"a piece on the UI side of the bridge")+"."; }
  else { what=esc(kind)+"."; }
  var hop="";
  if(meta){ var frm=meta.from?_fnById(meta.from):null, frmL=frm?(frm.label||meta.from):(meta.from||"");
    var _epN=0,_epI=0; if(meta.why==="endpoint"&&j&&j.meta){ j.meta.forEach(function(m,ii){ if(m.why==="endpoint"){ _epN++; if(ii<=(WALK.i-(WALK.feLen||0))) _epI++; } }); }
    var _heat=(window.__uniD2W!==false);
    hop=(meta.why==="endpoint")?("<b>Hop 0</b> · "+(_epN>1?("endpoint "+_epI+" of "+_epN+" in this workflow — a new chain starts here"):"the journey's entry point")):
        (meta.why==="gate")?("<b>Hop 0.5</b> · <span class=\"sng\">GATE</span> — runs BEFORE the handler body (a Depends() dependency of "+esc(frmL)+"), reached by a depends wire"):
        (meta.why==="dispatch")?("<b>Hop "+meta.hop+"</b> · <span class=\"snd\">DISPATCHED</span> — the event bus routes here after "+esc(frmL)+" publishes (its own writes/reads follow, if any)"):
        (meta.why==="write")?("<b>Hop "+meta.hop+"</b> · <span class=\"snw\">WRITTEN</span> by "+esc(frmL)+" — the red access wire"):
        (meta.why==="read")?("<b>Hop "+meta.hop+"</b> · <span class=\"snr\">read</span> by "+esc(frmL)):
        ("<b>Hop "+meta.hop+"</b> · reached by a calls wire"+(_heat&&n&&n.d2w===0?" (orange — at the write)":_heat&&n&&n.d2w===1?" (amber — one hop out)":"")); }
  else if(WALK.mode==="journey"&&j&&(j.bk||j.wf)&&n&&n.fe){ hop="<b>UI leg</b> · a screen that fetches this journey's endpoint over the bridge — the backend chain starts at the first endpoint step"; }
  else if(WALK.mode==="journey"&&j&&!j.bk&&!j.wf){ hop="test-journey step — an element this test touches (coverage set, entity-by-entity; not an execution order)"; }
  el.innerHTML='<div class="snhd"><span class="snpos">'+(WALK.i+1)+'/'+WALK.steps.length+'</span>'
    +(typeof svgInline==="function"&&kind!=="?"?('<span style="display:inline-flex;flex:none">'+svgInline(kind, col, 14)+'</span>'):"")
    +'<span class="snlbl" title="'+esc(lbl)+'">'+esc(lbl)+'</span><span class="snkind">'+esc(kind)+'</span>'
    +(ent?('<span class="snent" style="background:'+col+'">'+esc(ent)+'</span>'):"")
    +'<span class="snnav"><button class="snmin" title="minimize to the title / expand">–</button><button title="previous step (Alt+A)" data-sd="-1">‹</button><button title="next step (Alt+D)" data-sd="1">›</button></span></div>'
    +'<div class="snwhat">'+what+'</div>'+(hop?('<div class="snhop">'+hop+'</div>'):"")
    +(doc?('<div class="sndoc">'+esc(doc)+'</div>'):"");
  el.querySelectorAll("[data-sd]").forEach(function(b){ b.onclick=function(){ _walkGo(+b.getAttribute("data-sd")); }; });
  el.classList.toggle("min", !!window.__uniStepMin);                              // collapse to the title row (persisted across steps — operator)
  var _mb=el.querySelector(".snmin"); if(_mb){ _mb.textContent=window.__uniStepMin?"+":"–";
    _mb.onclick=function(){ window.__uniStepMin=!window.__uniStepMin; el.classList.toggle("min", !!window.__uniStepMin); _mb.textContent=window.__uniStepMin?"+":"–"; }; }
  el.style.display=""; }
/* ── THE WALK (ported from the 2D graph): journey steps ‹ i/N › jump the camera + open each carrier's
   card while the whole path stays lit; element clicks build a TRAIL (up to 7) of step chips. ── */
var WALK={ mode:null, steps:[], i:0 };
function _aimAt(n){ if(typeof Graph==="undefined"||!Graph||!n) return;
  var P=(n.x!=null)?{x:n.x,y:n.y,z:n.z}:(n.ent&&EX[n.ent]!=null?{x:EX[n.ent],y:EY[n.ent]||0,z:EZ[n.ent]||0}:null);   // unpositioned/hidden node → fly to its entity anchor so trail focus ALWAYS moves (operator)
  if(!P) return;
  try{ var cam=Graph.camera();
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
  var id=WALK.steps[WALK.i], n=NIDS[id];
  if(!n && _CAPST && _CAPST.byPiece[id] && window.__uniCapExpand){            // stashed step → open its capsule, then land (review 53[0])
    var ce=(_CAPST.byPiece[id]||"").replace(/^cap:/,"").split("|")[0];
    try{ __uniCapExpand(ce); }catch(e){}
    n=NIDS[id];
    if(n&&HL.on) try{ _hlCompute(); _hlRestyle(); }catch(e){} }
  if(!n){ _walkRender(); return; }                                            // the pill tracks WALK.i even on a dead step
  if(n && window.__uniReveal && typeof _nodeVisibleFn==="function" && !_nodeVisibleFn(n)){ try{ __uniReveal(n.id); }catch(_re){} }   // a step SELECTS its element → reveal its cluster+entity if the fleet has it hidden (operator)
  if(WALK.mode==="journey" && di===0) _frameSet(WALK.steps);   // selection shows the WHOLE path; arrows dive per step
  else _aimAt(n);
  SEL={kind:"node",data:n}; try{ showPanel(n); refreshEncSel(); }catch(e){}   // programmatic — does NOT re-run the select hook
  if(WALK.mode==="trail" && HL.on){ HL.origin=[n.id]; HL.exact=false; try{ _hlCompute(); _hlRestyle(); }catch(e){} }   // the focus RING transports to the trail step (operator)
  else if(WALK.mode==="journey" && HL.on && HL.exact){ try{ _hlCompute(); _hlRestyle(); }catch(e){} }                  // journey: the ring follows the CURRENT step, the path keeps its context glow
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
        +'<b class="wpos">'+(WALK.i+1)+'/'+WALK.steps.length+'</b><span class="wjname">'+(j.name||j.cid)+'</span>'
        +(function(){ var wf=WALK.steps.filter(function(id){ var fn=_fieldN(id); return fn&&fn.fe; }).length;
            return wf?('<span class="wfe" title="'+wf+' frontend piece(s) walk FIRST — the screens fetching this journey\'s endpoints + the components/callers driving them'+(wf<j.feN?(' ('+(j.feN-wf)+' more fleet-hidden)'):'')+'">'+svgInline("component", KINDCOL.component, 11)+wf+'</span>'):""; })()+'</span>'
        +'<button class="tbico wbtn" data-wgo="1" title="next step">'+CHR+'</button>'
        +'<button class="tbico hlbx" title="clear the journey (Esc)">'+XIC+'</button>';
      pill.querySelectorAll("[data-wgo]").forEach(function(b){ b.onclick=function(){ _walkGo(+b.getAttribute("data-wgo")); }; });
      pill.querySelector(".hlbx").onclick=function(){ __uniHLClear(); }; }
    else { pill.style.display=""; pill.innerHTML=""; } }   // keep the RESERVED slot present + empty (no display:none) so the header never shifts (operator)
  /* the TRAIL bar shows for a TRAIL and for a selected JOURNEY (operator: a journey becomes the current
     trail — navigable by the same chips + Alt+A/D, with a CLEAR button next to its title). */
  if(wb){ var _wActive=(WALK.mode==="trail"||WALK.mode==="journey") && WALK.steps.length;
    if(!_wActive){ wb.style.display="none"; try{ _stepNote(); }catch(e){} }   // a cleared walk takes the step note down with it
    else { var chips=WALK.steps.map(function(id,i){ var n=NIDS[id]; if(!n) return "";
        return '<button class="wchip'+(i===WALK.i?" on":"")+'" data-wi="'+i+'" title="'+n.label+' · '+n.ent+'" style="color:'+(n.col||"#9ab")+'">'+(i+1)+'</button>'; }).join("");
      var _wtitle=(WALK.mode==="journey" && HL.jrObj)?(HL.jrObj.name||HL.jrObj.cid):"trail";   // a journey trail wears the journey's name
      var _WX='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      wb.style.display=""; wb.innerHTML='<div class="wjhd"><span class="wjname" title="'+(WALK.mode==="journey"?"the selected journey IS the current trail — navigate with the chips or Alt+A/D":"trail")+'">'+_wtitle+'</span><button class="wclear tbico" title="clear the trail (Esc)">'+_WX+'</button></div>'
        +'<div class="wnav">'+chips+'<span class="wstepname" title="focus this step">'+((NIDS[WALK.steps[WALK.i]]||{}).label||"")+'</span></div>';
      wb.querySelectorAll("[data-wi]").forEach(function(b){ b.onclick=function(){ WALK.i=+b.getAttribute("data-wi"); _walkGo(0); }; });
      try{ _stepNote(); }catch(e){}
      var _sn=wb.querySelector(".wstepname"); if(_sn){ _sn.style.cursor="pointer"; _sn.onclick=function(){ _walkGo(0); }; }
      var _cl=wb.querySelector(".wclear"); if(_cl) _cl.onclick=function(){ __uniHLClear(); }; } }
  if(window.__uniDrawJourneyNums) try{ __uniDrawJourneyNums(); }catch(e){} }   // refresh the step-number badges on every walk start / step / clear
/* hover a connection chip in the card → that node gets a WHITE halo (a different color than the
   depth highlight) so the relationship reads instantly */
var _hovSprite=null;
/* ── THEME (batch 41): dark native · light on toggle — chrome flips by CSS vars, the scene by
   Graph.backgroundColor, highlighted wires by __uniTheme (white on dark · indigo on light). ── */
window.__uniTheme="dark";
window.__uniApplyTheme=function(th){ th=(th==="light")?"light":"dark"; window.__uniTheme=th;
  try{ document.documentElement.setAttribute("data-theme", th); }catch(e){}
  try{ Graph.backgroundColor(th==="light"?"#e8ecf3":"#0e1524"); }catch(e){}
  try{ updateConnectors(); }catch(e){}
  try{ window.localStorage.setItem("gabe:universe:theme", th); }catch(e){}
  var b=document.getElementById("themeBtn");
  if(b){ b.classList.toggle("on", th==="light");
    b.innerHTML=(th==="light")
      ?'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      :'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'; } };
window.__uniHoverHL=function(id){ if(_hovSprite){ try{ if(_hovSprite.parent) _hovSprite.parent.remove(_hovSprite); }catch(e){} _hovSprite=null; }
  if(window.__uniHovLink){ window.__uniHovLink=null; try{ updateConnectors(); }catch(e){} }
  if(!id) return; var n=NIDS[id]; if(!n) return;
  _hovSprite=glowSprite((window.__uniTheme==="light")?"#4f46e5":"#ffffff", 40, 0.9); _hovSprite.userData.__hov=1;
  if((typeof _nodeVisibleFn!=="function"||_nodeVisibleFn(n)) && n.__threeObj){ n.__threeObj.add(_hovSprite); }   // VISIBLE → halo rides the node
  else { var _hp=_npos[id]; if(!_hp){ _hovSprite=null; return; } _hovSprite.position.set(_hp.x,_hp.y,_hp.z); try{ Graph.scene().add(_hovSprite); }catch(_he){ _hovSprite=null; return; } }   // HIDDEN → the node's __threeObj is invisible, so the halo would vanish; put the WHITE halo in the scene at its ghost position instead (operator)
  var selId=(typeof SEL!=="undefined"&&SEL&&SEL.kind==="node"&&SEL.data)?SEL.data.id:null, hl=null;   // the WIRE to the hovered element glows too
  for(var i=0;i<links.length;i++){ var l=links[i], s=lid(l.source), tt=lid(l.target);
    if(selId && ((s===selId&&tt===id)||(tt===selId&&s===id))){ hl=l; break; }
    if(!selId && window.__uniSelLink===l && (s===id||tt===id)){ hl=l; break; } }
  if(hl){ window.__uniHovLink=hl; try{ updateConnectors(); }catch(e){} } };
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
    +'<div class="ctlrow">'+KB("Alt+Q")+KB("Alt+E")+KB("↑")+KB("↓")+'<span class="ctll">depth</span></div>'
    +'<div class="ctlrow">'+KB("Alt+A")+KB("Alt+D")+'<span class="ctll">trail prev / next</span></div>'
    +'<div class="ctlrow">'+KB("F")+'<span class="ctll">glow⇄focus</span>'+KB("Esc")+'<span class="ctll">clear</span></div>'
    +'<div class="ctlrow">'+KB("1")+'…'+KB("8")+'<span class="ctll">fleet columns — for the selection (none = all)</span></div>'
    +'<div class="ctlrow">'+KB("LMB")+'<span class="ctll" title="first-person look — vertical inverted by convention">look — turn in place</span></div>'
    +'<div class="ctlrow">'+KB("RMB")+'<span class="ctll" title="orbits the SELECTED planet when one is selected, else the zoom depth">tumble (orbit)</span>'+KB("MMB")+'<span class="ctll">pan</span></div>'
    +'</div>';
  document.body.appendChild(p);
  document.getElementById("ctrlpmin").onclick=function(){ p.classList.toggle("min"); this.textContent=p.classList.contains("min")?"+":"–"; };
  };   // LMB fixed to LOOK (operator ruling batch 50) — the scheme engine keeps every mode for the proofs; invert/selPivot ride their defaults, their toggle rows retired
/* topbar wiring + Alt+scroll + Esc — bound once at boot */
window.__uniWireTopbar=function(){
  var dr=document.getElementById("depthRng"); if(dr&&!dr.__w){ dr.__w=1;
    dr.addEventListener("input", function(){ __uniHLDepth(+dr.value); }); }
  var mb=document.getElementById("hlModeBtn"); if(mb&&!mb.__w){ mb.__w=1; mb.onclick=function(){ __uniHLMode(); }; }
  var tb=document.getElementById("themeBtn"); if(tb&&!tb.__w){ tb.__w=1;
    tb.onclick=function(){ __uniApplyTheme(window.__uniTheme==="light"?"dark":"light"); };
    var saved="dark"; try{ saved=window.localStorage.getItem("gabe:universe:theme")||"dark"; }catch(e){}
    __uniApplyTheme(saved); }
  var jb=document.getElementById("jrnBtn"); if(jb&&!jb.__w){ jb.__w=1; jb.onclick=function(){ __uniJrnToggle(); }; }
  if(!window.__uniFly){ window.__uniFly=1; var FK={};
    var _flyOK=function(e){ var tag=(e.target&&e.target.tagName)||""; return tag!=="INPUT"&&tag!=="TEXTAREA"; };
    var _flyFroze=false;
    function _flyFreeze(){ if(!_flyFroze && ANIM.freezeOnDrag && ANIM.all){ _flyFroze=true; ANIM.all=false; } }
    function _flyThaw(){ var any=false; for(var k in FK){ any=true; break; }
      if(!any && _flyFroze){ _flyFroze=false; ANIM.all=true; } }
    window.addEventListener("keydown", function(e){ if(!_flyOK(e)) return; var k=e.key.toLowerCase(), kc=e.code||"";   // kc = physical key — macOS Option composes e.key into a glyph, so Alt+letter needs e.code (review)
      if(e.altKey&&(k==="q"||k==="e"||kc==="KeyQ"||kc==="KeyE")){ e.preventDefault(); if(window.__uniHLDepth) __uniHLDepth(HL.depth+((k==="e"||kc==="KeyE")?1:-1)); }   // Alt+Q/E = depth (replaces Alt+scroll)
      else if(e.altKey&&(k==="a"||k==="d"||kc==="KeyA"||kc==="KeyD")){ e.preventDefault(); try{ if(typeof _walkGo==="function") _walkGo((k==="d"||kc==="KeyD")?1:-1); }catch(_we){} }   // Alt+A/D = trail prev/next (operator)
      else if((k==="w"||k==="a"||k==="s"||k==="d"||k==="q"||k==="e")&&!e.altKey){ var _new=!FK[k]; FK[k]=1; _flyFreeze();
        if(_new&&window.__uniFlyStep) try{ window.__uniFlyStep(); }catch(_fe){} }   // IMMEDIATE first step — a starved interval (heavy field, low fps) must not delay the response
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
    window.__uniFlyStep=function _flyTick(){                                        // setInterval, NOT rAF: headless/background pages starve rAF chains (measured 1 tick/400ms) — the flight must tick everywhere
      if(typeof Graph==="undefined"||!Graph) return; var any=false; for(var k in FK){ any=true; break; } if(!any){ _flyTick.__t=0; return; }
      /* ELAPSED-TIME scaling (batch 48): the step is per 16 ms of wall time, not per tick — a heavy frame (888 planets
         under swiftshader fired the interval ONCE in 400 ms) must not slow the flight/yaw. Capped at 20 ticks'
         worth per fire — a 60 fps browser sees dt≈16 → k=1, untouched. */
      var _now=(typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();
      var _dt=_flyTick.__t?Math.min(320,_now-_flyTick.__t):16; _flyTick.__t=_now; var _k=_dt/16;
      try{ var cam=Graph.camera(), ctrls=Graph.controls(); if(!cam||!ctrls) return;
        var sp=Math.max(2.5, cam.position.distanceTo(ctrls.target)*0.016)*_k;   // speed scales with zoom — close = fine, far = fast
        var fwd=new T.Vector3(0,0,-1).applyQuaternion(cam.quaternion).multiplyScalar(sp);
        var rgt=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion).multiplyScalar(sp);
        var off=new T.Vector3();
        if(FK.w) off.add(fwd); if(FK.s) off.sub(fwd);
        if(FK.d) off.add(rgt); if(FK.a) off.sub(rgt);
        if(FK.up||FK.dn){ var _upv=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion).multiplyScalar(sp); if(FK.up) off.add(_upv); if(FK.dn) off.sub(_upv); }   // up/down along the CAMERA up axis (operator: camera-relative like WASD, was world-Y)
        if(FK.q||FK.e){                                        // Q/E = orbit INWARD around the view centre at the zoom depth
          var ya=(FK.e?1:0)-(FK.q?1:0);                        // swapped (operator): E spins Q's old way, Q spins E's
          var vdq=new T.Vector3(); cam.getWorldDirection(vdq);
          var pv=new T.Vector3().copy(cam.position).addScaledVector(vdq, _zoomDist());
          _rotRig(cam, ctrls.target, pv, new T.Vector3(0,1,0), ya*0.022*_k); }
        if(!off.lengthSq()) return;
        cam.position.add(off); ctrls.target.add(off);          // the whole rig flies — orbiting keeps working wherever you stop
      }catch(e){} }; setInterval(window.__uniFlyStep, 16); }
  if(!window.__uniHLKeys){ window.__uniHLKeys=1;

    window.addEventListener("keydown", function(e){ var tag=(e.target&&e.target.tagName)||"";
      if(tag==="INPUT"||tag==="TEXTAREA") return;
      if((e.key==="f"||e.key==="F") && !e.altKey && !e.ctrlKey && !e.metaKey){ __uniHLMode(); return; }   // F = glow ⇄ focus
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
var _VISDEF={ show:1, planets:1, wires:1, subs:1, zDef:0, zAtk:0, zCfl:0, zSat:0, routes:1 };   // zones OFF by default — the FLEET zone columns are the only control
/* the seven cluster-core strategies each own an ICON (operator ask) — the config pills carry them
   and every cluster surface (rows, panels) INHERITS the active core's icon from this one map. */
window.__uniCoreIco=function(mode,px){ px=px||13; var PATHS={
  layer:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  kind:'<path d="M8.3 10a.7.7 0 0 1-.6-1.1L11.4 3a.7.7 0 0 1 1.2 0l3.7 5.9a.7.7 0 0 1-.6 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
  tests:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  guards:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  usecase:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  community:'<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M10.8 7.2 6.2 15.7M13.2 7.2l4.6 8.5M7.5 18h9"/>',
  fk:'<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  screen:'<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' };
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
function visN(n){ if(n){ var _st=(window.__uniKindState||{})[n.kind]||(typeof _kindDefault==="function"?_kindDefault(n.kind):(n.kind==="function"?"off":"all"));   // hide-by-kind (batch 51) — 3-state; the fallback MUST match _kindDefault/legend/masters (operator: critical by default)
    if(_st==="off" && !(window.__uniPin&&window.__uniPin[n.id])) return _KOFF;   // a walk/reveal PIN survives kind-off too (operator: a tier must not strand a journey's steps) — matches the two gates below
    if(window.__uniFoldHelpers!==false && n.__solo && !window.__uniPin[n.id]) return _KOFF;   // GLOBAL helper-fold (was per-kind "critical") — unless a walk/reveal PINNED it
    if(n.feClass && window.__uniFeClassState && window.__uniFeClassState[n.feClass]===false && !window.__uniPin[n.id]) return _KOFF; }   // class-visibility control — a tier/fleet toggle hides a component CLASS (phase 2)
  var o=n&&UNIVIS.node[n.id]; if(o) return o;
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
  if(_CAPST) _CAPST.nodes.forEach(function(n){ live[n.ent+"|"+n.sub]=1; });   // review 53[4]: folded pieces are hidden, not gone — their cluster overrides survive the round-trip
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
            color:hx(c.color||0), style:c.style||"dashed", glow:(window.__uniBeam[k]!=null?window.__uniBeam[k]:1), grad:!!c.grad, gmode:(c.gmode||"ent"),
            density:(c.density!=null?c.density:null), trust:(c.trust!=null?c.trust:null), thick:(c.thick!=null?c.thick:null) }; });
        var txt=JSON.stringify(out,null,1);
        window.__uniLastCopy=txt;                                  // proofs + a paste-back fallback read this
        var ok=(typeof copyText==="function")?copyText(txt):false;
        b.textContent=ok?"✓":"⧉"; setTimeout(function(){ b.textContent="⧉"; },900);
      }catch(e){} };
    setInterval(function(){ if(side.classList.contains("out")) __uniFlDock(); }, 300); }   // the fleet drags — the add-on follows
  /* WIDTH RESIZE (operator): drag the right edge to widen the fleet within a range; double-click
     the edge restores the default. Explicit width overrides the CSS default; the label column
     (.flent flex:1) absorbs the extra so cluster titles get room. */
  (function(){ var rz=document.createElement("div"); rz.className="flresize"; rz.title="drag to resize · double-click to reset"; p.appendChild(rz);
    var MINW=230, MAXW=520, drag=null;
    rz.addEventListener("pointerdown", function(e){ e.preventDefault(); e.stopPropagation();
      drag={ x:e.clientX, w:p.getBoundingClientRect().width }; rz.classList.add("on"); p.classList.add("resizing");
      try{ rz.setPointerCapture(e.pointerId); }catch(_){}
    });
    rz.addEventListener("pointermove", function(e){ if(!drag) return;
      var w=Math.max(MINW, Math.min(MAXW, drag.w + (e.clientX - drag.x)));
      p.style.width=w+"px"; p.style.maxWidth="none"; });
    rz.addEventListener("pointerup", function(e){ if(!drag) return; drag=null; rz.classList.remove("on"); p.classList.remove("resizing");
      try{ rz.releasePointerCapture(e.pointerId); }catch(_){} });
    rz.addEventListener("dblclick", function(e){ e.preventDefault(); e.stopPropagation();
      p.style.width=""; p.style.maxWidth=""; });   // restore the CSS default
  })();
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
  if(window.__uniSyncGrpSel) __uniSyncGrpSel();
  document.querySelectorAll("#fleetbody .flhead .flcfgbtn").forEach(function(c){
    c.classList.toggle("on", c.getAttribute("data-fk")===key); });
}catch(e){} };
window.__uniIsFeEnt=function(e){ return window.__uniEntLabel ? /^fe · /.test(__uniEntLabel(e)) : /^fe·/.test(e); };
/* SELECTED-OPTION NAME after a section title (operator aesthetic) — for each single-select pill
   group, echo the chosen option's word next to its label in a lighter, non-title font. Skips
   numeric/boolean pills (transparency, warOn). Kept in sync by a delegated pill-click listener. */
window.__uniSyncGrpSel=function(root){ try{ (root||document).querySelectorAll(".grp").forEach(function(g){
  var lbl=g.querySelector(":scope > .grplbl"); if(!lbl) return;
  var pills=g.querySelectorAll(".pill[data-grp]"); if(pills.length!==1) return;   // one pill per section only
  var on=pills[0].querySelector("button.on"), v=on?(on.getAttribute("data-v")||""):"";
  if(!/^[a-z]/i.test(v) || v==="true" || v==="false"){ var old=lbl.querySelector(".grpsel"); if(old) old.remove(); return; }
  var sel=lbl.querySelector(".grpsel"); if(!sel){ sel=document.createElement("span"); sel.className="grpsel"; lbl.appendChild(sel); }
  sel.textContent=v;
}); }catch(e){} };
if(!window.__uniGrpSelWired){ window.__uniGrpSelWired=true;
  document.addEventListener("click", function(e){ if(e.target.closest && e.target.closest(".pill[data-grp] button")) setTimeout(function(){ __uniSyncGrpSel(); }, 0); }, false); }
window.__uniFleetRender=function(){ var body=document.getElementById("fleetbody"); if(!body) return;
  var h='<div class="flhead"><span class="flent"></span>'+_FCOLS.map(function(c,i){
    var cfgable=(c.k==="planets"||c.k==="show"||c.k==="subs"||c.k==="wires"||c.k==="routes");  // every config now lives here
    var ztog=(c.k==="zDef"||c.k==="zAtk"||c.k==="zCfl"||c.k==="zSat");   // zone columns TOGGLE on header click (operator: zones off by default, one click shows a zone for all)
    return '<span class="flcell'+(cfgable?' flcfgbtn':'')+(ztog?' flztog':'')+'" data-fk="'+c.k+'" title="'+c.ti
      +(i>=1?(ztog?' — CLICK (or key '+i+') toggles this zone for the SELECTION (nothing selected = all entities)':' — key '+i+' toggles it for the SELECTION (nothing selected = all)'):'')
      +(cfgable?' · CLICK for its configuration':'')+'">'
      +(typeof ico==="function"?ico(c.icon,13):"")+(i>=1?'<i class="flkey">'+i+'</i>':'')+'</span>'; }).join('')+'</div>';
  var groups={}; nodes.forEach(function(n){ (groups[n.ent]=groups[n.ent]||{})[n.sub]=(groups[n.ent][n.sub]||0)+1; });
  // backend vs frontend split (operator ask): fe·<entity> pieces are the frontend estate;
  // each group gets its OWN master row so the two are controlled independently — hide the
  // frontend master's `show` and the graph falls back to the backend-only diagram.
  var beEnts=_ents.filter(function(e){ return !__uniIsFeEnt(e); });
  var feEnts=_ents.filter(function(e){ return __uniIsFeEnt(e); });
  var _entRow=function(e){ var gs=groups[e]||{}, gk=Object.keys(gs).sort(), open=!!_flOpen[e];
    var r='<div class="flrow" data-fle="'+e+'"><span class="flent flx" data-flx="'+e+'" title="'+e+' — click to SELECT it (panel + camera); the count expands its clusters">'
      +'<b class="flcnt flexp" style="--flc:'+(ENT[e]||"#888")+'" title="expand / collapse the '+gk.length+' cluster(s)">'+gk.length+'</b>'+(window.__uniEntLabel?__uniEntLabel(e):e)+'</span>'
      +_FCOLS.map(function(c){ return '<button class="fltog" data-fent="'+e+'" data-fcol="'+c.k+'" title="'+c.ti+'"></button>'; }).join('')+'</div>';
    if(open) gk.forEach(function(s){
      r+='<div class="flrow flsub" data-fle="'+e+'" data-fls="'+s+'"><span class="flent flsubname" data-fse="'+e+'" data-fss="'+s+'" title="'+s+' · '+gs[s]+' member(s) — click to SELECT this cluster (panel + camera)"><b class="flcnt" style="--flc:'+(ENT[e]||"#888")+'">'+gs[s]+'</b>'+s+'</span>'
        +_FCOLS.map(function(c){ if(c.k==="subs") return '<span class="flcell flspacer"></span>';
          return '<button class="fltog flstog" data-fent="'+e+'" data-fsub="'+s+'" data-fcol="'+c.k+'" title="'+c.ti+' — cluster '+s+'"></button>'; }).join(''); r+='</div>'; });
    return r; };
  var _masterRow=function(label, tag, extra){ return '<div class="flrow flmaster'+(extra||'')+'" data-fgrp="'+tag+'"><span class="flent">'+label+'</span>'
      +_FCOLS.map(function(c){ return '<button class="fltog flall" data-fent="'+tag+'" data-fcol="'+c.k+'" title="'+c.ti+' — all '+label+' entities"></button>'; }).join('')+'</div>'; };
  h+=_masterRow("backend", "*backend", "");
  beEnts.forEach(function(e){ h+=_entRow(e); });
  if(feEnts.length){ h+=_masterRow("frontend", "*frontend", " flgroup2");
    feEnts.forEach(function(e){ h+=_entRow(e); }); }
  body.innerHTML=h;
  body.querySelectorAll(".flhead .flcfgbtn").forEach(function(cell){ cell.onclick=function(){
    if(window.__uniFlOpen) __uniFlOpen(cell.getAttribute("data-fk")); }; });
  body.querySelectorAll(".flhead .flztog").forEach(function(cell){ cell.style.cursor="pointer"; cell.onclick=function(){   // zone header = a bulk toggle for the selection (all when none) — the discoverable path (operator)
    var hs=window.__uniHullSel||{}; if(window.__uniFleetToggle) __uniFleetToggle(hs.ent||"*", (hs.ent&&hs.sub!=null)?hs.sub:null, cell.getAttribute("data-fk")); }; });
  if(window.__uniFlOpenKey){ var oc=body.querySelector('.flhead .flcfgbtn[data-fk="'+window.__uniFlOpenKey+'"]');
    if(oc) oc.classList.add("on"); }
  body.querySelectorAll(".flx .flexp").forEach(function(b){ b.onclick=function(ev){   // the COUNT badge owns expand/collapse now
    ev.stopPropagation(); var e=b.closest(".flx").getAttribute("data-flx");
    _flOpen[e]=!_flOpen[e]; __uniFleetRender(); }; });
  body.querySelectorAll(".flx").forEach(function(sp){ sp.onclick=function(){          // the NAME selects: panel + hull light + camera
    var e=sp.getAttribute("data-flx");
    if(_CAPST && window.__uniCapExpand && nodes.some(function(n){ return n.__cap&&n.ent===e; }))
      try{ __uniCapExpand(e); }catch(e3){}                                            // review 53[3]: the promised fleet-row expand
    if(window.__uniPanelEnt) __uniPanelEnt(e);
    var ids=nodes.filter(function(n){ return n.ent===e; }).map(function(n){ return n.id; });
    if(typeof _frameSet==="function") try{ _frameSet(ids); }catch(e2){} }; });
  body.querySelectorAll(".flsubname").forEach(function(sp){ sp.onclick=function(){    // cluster name = select the cluster
    var e=sp.getAttribute("data-fse"), s=sp.getAttribute("data-fss");
    if(window.__uniPanelClu) __uniPanelClu(e, s);
    var ids=nodes.filter(function(n){ return n.ent===e && (n.sub||"—")===s; }).map(function(n){ return n.id; });
    if(typeof _frameSet==="function") try{ _frameSet(ids); }catch(e2){} }; });
  body.querySelectorAll(".fltog").forEach(function(b){ b.onclick=function(){
    __uniFleetToggle(b.getAttribute("data-fent"), b.getAttribute("data-fsub"), b.getAttribute("data-fcol")); }; });
  __uniFleetSync();
  if(window.__uniSyncGrpSel) __uniSyncGrpSel();
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
function _entSubKeys(ent){ var seen={}; nodes.forEach(function(n){ if(n.ent===ent && n.sub!=null) seen[ent+"|"+n.sub]=1; }); return Object.keys(seen); }
window.__uniFleetToggle=function(ent, sub, col){ try{
  var C=_FCOLS.filter(function(c){ return c.k===col; })[0];
  if(sub!=null && ent!=="*"){ var key=ent+"|"+sub, sv=UNIVIS.sub[key]||(UNIVIS.sub[key]=Object.assign({},_VISDEF));
    var was=sv[col]; sv[col]=sv[col]?0:1;
    if(!was && sv[col] && UNIVIS.ent[ent] && !UNIVIS.ent[ent][col]) UNIVIS.ent[ent][col]=1;   // ANY column: a cluster turned ON re-enables its entity for THAT column — the last click makes it appear (operator: clusters behave like the entity column)
  }
  else if(ent==="*"||ent==="*backend"||ent==="*frontend"){
    var sel=(ent==="*backend")?_ents.filter(function(e){return !__uniIsFeEnt(e);})
           :(ent==="*frontend")?_ents.filter(function(e){return __uniIsFeEnt(e);}):_ents;   // group master = its own subset
    var on=!sel.every(function(e){ return UNIVIS.ent[e][col]; });                    // any off → all on; all on → all off
    sel.forEach(function(e){ UNIVIS.ent[e][col]=on?1:0;
      _entSubKeys(e).forEach(function(k){ (UNIVIS.sub[k]||(UNIVIS.sub[k]=Object.assign({},UNIVIS.ent[e]||_VISDEF)))[col]=on?1:0; }); }); }   // cascade to EVERY cluster (init the missing ones FROM the entity, not zone-off _VISDEF — a fresh sub must inherit the entity's zones/etc, review) — no cluster left "waiting on" under a hidden entity (operator)
  else { UNIVIS.ent[ent][col]=UNIVIS.ent[ent][col]?0:1;
    if(col!=="subs"){ var eon=UNIVIS.ent[ent][col];                                  // the entity column is a MASTER over its clusters for EVERY column except "subs" (the clusters column keeps per-cluster options) — off → all clusters off · on → all on (operator)
      _entSubKeys(ent).forEach(function(k){ (UNIVIS.sub[k]||(UNIVIS.sub[k]=Object.assign({},UNIVIS.ent[ent]||_VISDEF)))[col]=eon?1:0; }); }   // seed a fresh sub FROM the entity (keeps other columns), not zone-off _VISDEF (review)
  }
  applyVis(C?C.scope:"all"); __uniFleetSync(); }catch(e){} };
window.__uniFleetSync=function(){ var body=document.getElementById("fleetbody"); if(!body) return;
  body.querySelectorAll(".fltog").forEach(function(b){ var ent=b.getAttribute("data-fent"), sub=b.getAttribute("data-fsub"),
    col=b.getAttribute("data-fcol"), C=_FCOLS.filter(function(c){ return c.k===col; })[0];
    if(sub!=null){ b.classList.toggle("on", !!(UNIVIS.sub[ent+"|"+sub]||_VISDEF)[col]);
      b.classList.toggle("mdim", !(C&&C.g()) || !(UNIVIS.ent[ent]||_VISDEF)[col]); return; }   // parent entity off → the cluster switch reads inherited-off (dim)
    if(ent==="*"||ent==="*backend"||ent==="*frontend"){
      var sel=(ent==="*backend")?_ents.filter(function(e){return !__uniIsFeEnt(e);})
             :(ent==="*frontend")?_ents.filter(function(e){return __uniIsFeEnt(e);}):_ents;
      b.classList.toggle("on", sel.length>0 && sel.every(function(e){ return UNIVIS.ent[e][col]; })); }
    else b.classList.toggle("on", !!(UNIVIS.ent[ent]||_VISDEF)[col]);
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
  // BADGE OPACITY (operator): one GLOBAL control for every badge we stack on planet icons (method today,
  // more later) — lives in the Planets pane; size/offset are fixed defaults, opacity is the live knob.
  if(CFG.mbOp==null) CFG.mbOp=0.6; if(CFG.mbSize==null) CFG.mbSize=3.5; if(CFG.mbX==null) CFG.mbX=2; if(CFG.mbY==null) CFG.mbY=-2.5;
  var bg=mk("grp"); bg.innerHTML='<div class="grplbl">Badges</div>'
    +'<div class="cfgrow"><span class="rlbl" style="width:46px" title="transparency of every badge stacked on a planet icon (method badge today)">opacity</span>'
    +'<input type="range" class="rng" id="mbOpRng" min="0" max="1" step="0.05" value="'+CFG.mbOp+'">'
    +'<span class="rval" id="mbOpVal">'+(+CFG.mbOp).toFixed(2)+'</span></div>';
  var _mbi=bg.querySelector("#mbOpRng"); if(_mbi) _mbi.addEventListener("input", function(){ CFG.mbOp=+_mbi.value; var vv=bg.querySelector("#mbOpVal"); if(vv) vv.textContent=(+_mbi.value).toFixed(2); });   // _mbTick applies it live to every badge — no rebuild
  planetsPane.push(bg);
  // (the Zones config section is GONE — zones are controlled only from the fleet zone columns now, operator)
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
  /* PER-SIDE cores (operator: two cores at once + drop guards). Each side offers only the cores
     that actually DIVIDE it (measured: layer/tests/guards/fk are dead on frontend; screen is the
     FE spine, community the BE spine). usecase/community/fk need the levels feed. */
  var CORE_TI={
    layer:"Layer — the kind's architectural layer (api · data)",
    kind:"Kind — element kind (endpoint · model · schema / component · hook · store · route)",
    tests:"Tests — tested vs untested",
    screen:"Screen — pieces group by the SCREEN they serve (nearest fetching piece over the fe wires)",
    usecase:"Use-case — the use-case flows mapped in the levels feed",
    community:"Community — code communities by label propagation",
    fk:"FK-join — foreign-key join community" };
  var CORE_LV={usecase:1, community:1, fk:1};   // need the levels feed
  var _coreOpts=function(keys){ return keys.filter(function(k){ return !CORE_LV[k] || hasLevels; })
    .map(function(k){ return {v:k, t:"", ic:__uniCoreIco(k,12), ti:CORE_TI[k]}; }); };
  var beCores=_coreOpts(["community","usecase","kind","fk","layer","tests"]);
  var feCores=_coreOpts(["screen","community","kind","usecase"]);
  var layWrap=document.createElement("div");
  layWrap.innerHTML=
     '<div class="grp"><div class="grplbl" title="where each ENTITY sits in space — hover each option">LAYOUT</div>'
    + pillHTML("entLayout",[
        {v:"chain",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3"/></svg>',ti:"Chain — a flat layered ribbon: layers band vertically, entities line up by coupling"},
        {v:"force",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="7" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M8 9l3 6M15.5 8.5l-2 6.5M8.5 6.7l6-0.5"/></svg>',ti:"Force — 3D coupling bubbles: entities repel, FK springs pull coupled ones together"},
        {v:"ring",t:"",ic:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7" stroke-dasharray="2 3"/><circle cx="12" cy="5" r="1.8"/><circle cx="19" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/><circle cx="5" cy="12" r="1.8"/></svg>',ti:"Ring — a coupling-ordered circle: even spacing, separation by construction"}], CFG.entLayout)+'</div>'
    + '<div class="grp cgside"><div class="grplbl bghd" title="clusters INSIDE backend (data-model) entities — hover each core">BACKEND · CORE</div>'
    + pillHTML("coreByBE", beCores, CFG.coreByBE)+'</div>'
    + '<div class="grp cgside"><div class="grplbl fghd" title="clusters INSIDE frontend (UI) entities — hover each core">FRONTEND · CORE</div>'
    + pillHTML("coreByFE", feCores, CFG.coreByFE)+'</div>';
  var _lw=[].slice.call(layWrap.children);                       // [entity layout, backend core, frontend core]
  var layGrp=_lw[0]||null, coreBEGrp=_lw[1]||null, coreFEGrp=_lw[2]||null;
  /* combo row — LAYOUT pills · TRANSPARENCY dots · CONTAINER shapes, three clusters in one row */
  var comboGrp=grpWith("Layout");
  var _cbl=comboGrp.querySelector(".grplbl"); if(_cbl) _cbl.title="entity layout (chain · force · ring) — planet transparency — boundary shape (both levels)";
  var comboRow=document.createElement("div"); comboRow.className="cfgrow entcombo";
  var lp=layGrp?layGrp.querySelector(".pill"):null, tp2=trows[2]?trows[2].querySelector(".pill"):null,
      cp2=G.container?G.container.querySelector(".pill"):null;
  if(lp) comboRow.appendChild(lp); if(tp2) comboRow.appendChild(tp2); if(cp2) comboRow.appendChild(cp2);
  comboGrp.appendChild(comboRow); entPane.push(comboGrp);
  /* options row — entity boundary · cluster stars · FUNCTIONS (an icon toggle now; starts OFF) */
  var optGrp=grpWith("Options");
  var _ogl=optGrp.querySelector(".grplbl"); if(_ogl) _ogl.title="entity boundary · cluster stars · code functions · frontend types — hover each; functions + types START OFF";
  var optRow=document.createElement("div"); optRow.className="cfgrow entcombo";
  var entTog2=entShowGrp?entShowGrp.querySelector('[data-itog="entOn"]'):null;
  var starsTog=G.universe?G.universe.querySelector('[data-itog="stars"]'):null;
  if(entTog2) optRow.appendChild(entTog2); if(starsTog) optRow.appendChild(starsTog);
  /* the Functions boolean is GONE (operator ruling — the artifact's option B): the legend's
     "Function" row loads/unloads functions now, so there is one control, not two. See __uniKindToggle. */
  if(typeof _FETYPES!=="undefined" && _FETYPES.length){ var tb=document.createElement("button"); tb.className="itog"; tb.id="typesTog";
    tb.title="types — adds "+_FETYPES.length+" frontend TS types/interfaces + their typed wires (the schema-equivalent; "+((window.GABE_C4&&GABE_C4.stats&&GABE_C4.stats.fe&&GABE_C4.stats.fe.fe_types_referenced)||0)+" referenced by a running piece) — starts OFF";
    tb.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
    tb.classList.toggle("on", CFG.showTypes==="on");
    tb.onclick=function(){ CFG.showTypes=(CFG.showTypes==="on")?"off":"on"; tb.classList.toggle("on", CFG.showTypes==="on");
      try{ applyCfg("showTypes"); }catch(e){} };
    if(coreFEGrp){ var tsr=document.createElement("div"); tsr.className="cfgrow shrow";   // SHOW: types live under the FRONTEND core (operator)
      tsr.innerHTML='<span class="shlbl">show</span>'; tsr.appendChild(tb); coreFEGrp.appendChild(tsr); }
    else optRow.appendChild(tb); }
  optGrp.appendChild(optRow); entPane.push(optGrp);
  /* HIGHLIGHT — the four surviving selection-highlight toggles (operator: sliders/pills retired to
     fixed defaults; these on/off masters live in the entity config, GLOBAL for all entities). FOCUS =
     the selected element (ring · glow); OTHERS = its neighbourhood (glow · same-entity ring). The
     engine (__uniHLReapply) reads CFG.focRing/focGlow/othGlow/othRing; glyphs, not words (legend law). */
  if(window.__uniHLSeed) try{ window.__uniHLSeed(); }catch(e){}   // defensive — defaults seeded before the toggles read CFG
  var _hlRingIco='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/></svg>';
  var _hlGlowIco='<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.16"/><circle cx="12" cy="12" r="5.5" fill="currentColor" fill-opacity="0.42"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/></svg>';
  var _hlBtn=function(key, glyph, ttl){ var b=document.createElement("button"); b.className="itog hltog"; b.setAttribute("data-hl",key);
    b.title=ttl; b.innerHTML=glyph; b.classList.toggle("on", CFG[key]!==false);
    b.onclick=function(){ CFG[key]=(CFG[key]===false); b.classList.toggle("on", CFG[key]!==false);   // flip the global boolean
      try{ if(HL.on && window.__uniHLReapply) __uniHLReapply(); }catch(e){} }; return b; };
  var hlGrp=grpWith("Highlight");
  var _hgl=hlGrp.querySelector(".grplbl"); if(_hgl) _hgl.title="selection highlight, global for all entities — FOCUS = the selected element (ring · glow); OTHERS = its neighbourhood (glow · ring). The others-ring lights only same-entity elements.";
  var _hlRow=function(lbl){ var r=document.createElement("div"); r.className="cfgrow shrow"; r.innerHTML='<span class="shlbl">'+lbl+'</span>'; return r; };
  var _fRow=_hlRow("focus"); _fRow.appendChild(_hlBtn("focRing", _hlRingIco, "focus RING on the selected element")); _fRow.appendChild(_hlBtn("focGlow", _hlGlowIco, "focus GLOW on the selected element"));
  var _oRow=_hlRow("others"); _oRow.appendChild(_hlBtn("othGlow", _hlGlowIco, "GLOW on the neighbourhood (every lit entity)")); _oRow.appendChild(_hlBtn("othRing", _hlRingIco, "dim RING on the neighbourhood — same-entity elements only"));
  hlGrp.appendChild(_fRow); hlGrp.appendChild(_oRow); entPane.push(hlGrp);
  /* radius (hull pad, live) + SPREAD (internal separation — default at a QUARTER of the bar) */
  if(radiusGrp){ var spRow=document.createElement("div"); spRow.className="cfgrow";
    spRow.innerHTML='<span class="rlbl splbl" title="element separation INSIDE entities — the default sits at a FIFTH of the bar; drag right for a LOT more room, left to pack tighter">spread</span>'
      +'<input type="range" class="rng" id="spreadRng" min="0.55" max="2.8" step="0.05" value="1.4">';
    var rsRow=document.createElement("div"); rsRow.className="cfgrow rsrow";        // radius + spread: ONE row, two columns
    if(radRow&&radRow.parentNode===radiusGrp) radiusGrp.removeChild(radRow);
    rsRow.appendChild(radRow); rsRow.appendChild(spRow); radiusGrp.appendChild(rsRow);
    var _sr=spRow.querySelector("#spreadRng");
    _sr.addEventListener("input", function(){ window.__uniSpread=+_sr.value;
      try{ __uniFreezeForSettle(); }catch(e){}
      try{ recomputeSubAnchors(); }catch(e){}
      try{ recomputeEX(); }catch(e){}
      try{ Graph.d3ReheatSimulation(); }catch(e){} });
    entPane.push(radiusGrp); }
  if(coreBEGrp) cluPane.push(coreBEGrp);
  if(coreFEGrp) cluPane.push(coreFEGrp);
  if(cluShowGrp) cluPane.push(cluShowGrp);
  if(subOpGrp) cluPane.push(subOpGrp);
  /* ── DISCLOSURE-TIER controls in the FLEET (operator: the tier configs live in the fleet section
     as multi-state pills). The header T0–T3 selector + the legend class rows are the quick surfaces;
     this is the fleet-side config. Prepended to the Entity pane so it opens with the "show" column. ── */
  var tierGrp=mk("grp"); tierGrp.innerHTML='<div class="grplbl">Disclosure tier</div>'
    +pillHTML("tier",[{v:"0",t:"T0",ti:"Skeleton — doors, tables & screens"},{v:"1",t:"T1",ti:"Surface — + schemas, stores, data-connectors"},{v:"2",t:"T2",ti:"Trace — + functions & private components"},{v:"3",t:"T3",ti:"Everything"}], String(window.__uniTier));
  [].forEach.call(tierGrp.querySelectorAll('.pill[data-grp="tier"] button'), function(btn){ btn.onclick=function(){ if(window.__uniSetTier) __uniSetTier(+btn.getAttribute("data-v")); }; });
  var foldGrp=mk("grp"); foldGrp.innerHTML='<div class="grplbl">Fold helpers</div>'
    +pillHTML("fold",[{v:"on",t:"on",ti:"fold single-caller helper nodes"},{v:"off",t:"off",ti:"show every node"}], window.__uniFoldHelpers!==false?"on":"off");
  [].forEach.call(foldGrp.querySelectorAll('.pill[data-grp="fold"] button'), function(btn){ btn.onclick=function(){ if(window.__uniSetFoldHelpers) __uniSetFoldHelpers(btn.getAttribute("data-v")==="on"); [].forEach.call(foldGrp.querySelectorAll("button"),function(x){ x.classList.toggle("on",x===btn); }); }; });
  var fcGrp=mk("grp"); fcGrp.innerHTML='<div class="grplbl">Component classes</div>';   // multi-toggle (each class on/off independently)
  var fcPill=document.createElement("div"); fcPill.className="pill fcpill";
  ["view","private","connector","container","leaf"].forEach(function(fc){ var bn=document.createElement("button");
    bn.setAttribute("data-fc",fc); bn.title="toggle the "+fc+" component class"; bn.textContent=fc;
    bn.className=(window.__uniFeClassState&&window.__uniFeClassState[fc]===false)?"":"on";
    bn.onclick=function(){ if(window.__uniFeClassToggle) __uniFeClassToggle(fc); bn.classList.toggle("on", !(window.__uniFeClassState&&window.__uniFeClassState[fc]===false)); }; fcPill.appendChild(bn); });
  fcGrp.appendChild(fcPill);
  entPane.unshift(foldGrp); entPane.unshift(fcGrp); entPane.unshift(tierGrp);   // tier first, then classes, then fold — atop the Entity pane
  window.__uniFlPanes={
    show:{ title:"Entity", icon:"shape", groups:entPane, shared:[radiusGrp] },
    subs:{ title:"Clusters", icon:"sub", groups:cluPane, shared:[radiusGrp] },   // container lives in the entity combo row now (it always affected both levels)
    planets:{ title:"Planets", icon:"bubble", groups:planetsPane, shared:[] } };
  var _stash=document.getElementById("flstash");
  if(!_stash){ _stash=document.createElement("div"); _stash.id="flstash"; _stash.style.display="none"; document.body.appendChild(_stash); }
  _stash.innerHTML="";
  [entPane, cluPane, planetsPane].forEach(function(gs){ gs.forEach(function(g){ if(g&&g.parentNode!==_stash) _stash.appendChild(g); }); });
  [radiusGrp].forEach(function(g){ if(g&&g.parentNode!==_stash) _stash.appendChild(g); });
  if(window.__uniFlOpen) try{ __uniFlOpen(window.__uniFlOpenKey||null, true); }catch(e){}

  // ── ROUTES pane: lines (icon pill + curve amount) · per-kind beam · transports + speed ──
  var rt=mk("cfgpane"); rt.style.display="none";
  var LNS='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 20 5"/></svg>';
  var LNC='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19 C 8 5 16 5 20 12"/></svg>';
  if(!CONN0 && typeof CONN!=="undefined"){ CONN0={};   // stock snapshot BEFORE any edit (reset target)
    CONN_KINDS.forEach(function(k){ CONN0[k]={color:CONN[k].color, style:CONN[k].style, grad:!!CONN[k].grad, gmode:CONN[k].gmode, density:CONN[k].density, trust:CONN[k].trust, thick:CONN[k].thick}; }); }   // grad/gmode + density/trust/thick ride the snapshot (reset restores the stock look)
  if(!window.BANDPAL0 && window.BANDPAL) window.BANDPAL0=window.BANDPAL.slice();   // D2W band-palette stock snapshot (reset target)
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
  /* second config row — the fine controls (density · transparency · thickness). The per-kind gradient MODE
     is baked (operator ruling: modes settled, the selector removed); only access still fine-tunes here. */
  var wireRow2=function(kind){ var c=(typeof CONN!=="undefined"&&CONN[kind])||{density:2,trust:0.6,thick:1};
    return '<div class="cfgrow wkrow2" style="gap:5px">'
      +'<span class="wk2l" title="'+kind+' pattern DENSITY">den</span><input type="range" class="rng wden" data-wden="'+kind+'" min="0.6" max="6" step="0.1" value="'+(c.density!=null?c.density:2)+'">'
      +'<span class="wk2l" title="'+kind+' TRANSPARENCY (opacity)">α</span><input type="range" class="rng wtru" data-wtru="'+kind+'" min="0.05" max="1" step="0.05" value="'+(c.trust!=null?c.trust:0.6)+'">'
      +'<span class="wk2l" title="'+kind+' THICKNESS (>1 draws a tube)">wt</span><input type="range" class="rng wthk" data-wthk="'+kind+'" min="0.5" max="4" step="0.1" value="'+(c.thick!=null?c.thick:1)+'">'
      +'</div>'; };
  /* D2W band palette — the calls-wire heat calibrator (Proposal A): 5 colour swatches (write→green)
     + an on/off toggle + copy/reset, mirroring the per-kind wire calibrate loop. Mutates window.BANDPAL
     live (connectorWire reads it), the legend re-renders so its swatches never drift from the wires. */
  var BANDLBL=["into write","1 hop","2 hops","3+ hops","no write"];
  var bandCfg=function(){ var d2on=!!window.__uniD2W;
    var rows=(window.BANDPAL||[]).map(function(c,i){ return '<div class="cfgrow" style="gap:5px;align-items:center">'
      +'<span class="wk2l" style="width:54px" title="distance '+(i<4?i:"4+ / none")+' — hops from a call target to a write">'+BANDLBL[i]+'</span>'
      +'<input type="color" class="wcol" data-band="'+i+'" value="'+_hx(c)+'" title="band '+i+' colour"></div>'; }).join('');
    return '<div class="grp"><div class="grplbl" style="display:flex;align-items:center;gap:6px" title="a calls wire is coloured by its TARGET hops-to-a-write: 0 = lands on a DB write (red), each call further cools toward green.">CALLS · DISTANCE HEAT'
      +'<button class="wtog'+(d2on?" on":"")+'" data-d2wtog2="1" title="colour calls by distance-to-write (off = the flat calls colour)" style="margin-left:auto">'+(typeof ico==="function"?ico("show",11):"◑")+'</button>'
      +'<button class="wreset" data-bandreset="1" title="reset the band palette to stock">&#8634;</button>'
      +'<button class="wreset" data-bandcopy="1" title="copy the band palette as JSON">⧉</button></div>'
      + rows + '</div>'; };
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
    + wireRow("fk")+wireRow("bridge")+wireRow("calls")+wireRow("imports")
    + '<div class="grplbl" style="margin-top:9px" title="the DATA-ACCESS connectors (Option A): endpoint→model ROLLUP (the direct call-tree shortcut, method-coloured, hidden by default) vs the true function→model ACCESS wire (role-coloured when its gradient is on).">DATA-ACCESS</div>'
    + wireRow("rollup")+wireRow("access")+wireRow2("access")+'</div>'
    + bandCfg();
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
    if(["warOn","entLayout","coreByBE","coreByFE","lineStyle","showFns"].indexOf(grp)<0) return;   // skip the moved spike pills (shape/subOp/entOp) — coreByBE/coreByFE are the per-side cores
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
  /* D2W band-palette calibrators: mutate window.BANDPAL live (connectorWire reads it) + re-render the
     legend so its band swatches track the wires; the toggle flips __uniD2W (calibrate-and-bake loop). */
  var _legRe=function(){ if(window.__legRender) try{ __legRender(); }catch(e){} };
  rt.querySelectorAll("input[data-band]").forEach(function(inp){ inp.addEventListener("input", function(){
    var i=+inp.getAttribute("data-band"); if(window.BANDPAL){ window.BANDPAL[i]=parseInt(inp.value.slice(1),16); if(window.__uniD2W) redraw(); _legRe(); } }); });
  rt.querySelectorAll("[data-d2wtog2]").forEach(function(b){ b.addEventListener("click", function(){
    window.__uniD2W=!window.__uniD2W; b.classList.toggle("on", !!window.__uniD2W); redraw(); _legRe(); }); });
  rt.querySelectorAll("[data-bandreset]").forEach(function(b){ b.addEventListener("click", function(){
    if(window.BANDPAL0){ window.BANDPAL=window.BANDPAL0.slice();
      document.querySelectorAll("input[data-band]").forEach(function(inp){ inp.value=_hx(window.BANDPAL[+inp.getAttribute("data-band")]); });   // rt is a DETACHED workbench; the rows MOVE to the fleet stash — query the live document (like the wire reset)
      if(window.__uniD2W) redraw(); _legRe(); } }); });
  rt.querySelectorAll("[data-bandcopy]").forEach(function(b){ b.addEventListener("click", function(){
    try{ var txt=JSON.stringify({ d2w:!!window.__uniD2W, bands:(window.BANDPAL||[]).map(function(c){ return _hx(c); }) }, null, 1);
      window.__uniLastCopy=txt; var ok=(typeof copyText==="function")?copyText(txt):false;
      b.textContent=ok?"✓":"⧉"; setTimeout(function(){ b.textContent="⧉"; },900); }catch(e){} }); });
  // the DATA-ACCESS fine sliders (density · transparency · thickness); the gradient MODE is baked (no selector)
  rt.querySelectorAll("input[data-wden]").forEach(function(s){ s.addEventListener("input", function(){ var k=s.getAttribute("data-wden"); CONN[k].density=+s.value; updSamp(k); redraw(); }); });
  rt.querySelectorAll("input[data-wtru]").forEach(function(s){ s.addEventListener("input", function(){ CONN[s.getAttribute("data-wtru")].trust=+s.value; redraw(); }); });
  rt.querySelectorAll("input[data-wthk]").forEach(function(s){ s.addEventListener("input", function(){ CONN[s.getAttribute("data-wthk")].thick=+s.value; redraw(); }); });
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
      CONN[k].grad=!!CONN0[k].grad; if(CONN0[k].gmode) CONN[k].gmode=CONN0[k].gmode;
      if(CONN0[k].density!=null) CONN[k].density=CONN0[k].density; if(CONN0[k].trust!=null) CONN[k].trust=CONN0[k].trust; if(CONN0[k].thick!=null) CONN[k].thick=CONN0[k].thick; }   // grad/gmode + density/trust/thick RESTORED
    var gb=document.querySelector('button[data-wgrad="'+k+'"]'); if(gb) gb.classList.toggle("on", !!CONN[k].grad);
    var inp=document.querySelector('[data-wcol="'+k+'"]'); if(inp) inp.value=_hx(CONN[k].color);
    var p=document.querySelector('.pill[data-wshape="'+k+'"]'); if(p) p.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x.getAttribute("data-v")===CONN[k].style); });
    var _rd=document.querySelector('[data-wden="'+k+'"]'); if(_rd) _rd.value=CONN[k].density;   // DATA-ACCESS sliders reflect the reset
    var _rt=document.querySelector('[data-wtru="'+k+'"]'); if(_rt) _rt.value=CONN[k].trust;
    var _rk=document.querySelector('[data-wthk="'+k+'"]'); if(_rk) _rk.value=CONN[k].thick;
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

/* ── CAPSULES (batch 53, S1+S2+S3) — a big entity boots COLLAPSED: its pieces fold into one
   compound planet per AREA (the emitter's stable sub-directory group, S2), with aggregated
   bundle wires between capsules. Click a capsule (or its card's Expand, or the fleet row, or
   any search/chip hit inside it) → the entity opens to its pieces; the CAP toggle in the
   config flips the whole mechanism. Restore-then-apply keeps the surgery idempotent. ── */
window.UNICAP={ on:false, threshold:80, open:{} };   // DEFAULT OFF (operator): simplification is control-driven (tiers) now, not the capsule click-fold — the CAP fleet toggle can still turn the legacy fold back on
var _CAPST=null;   // {nodes:[...], links:[...], caps:[capIds], byPiece:{pieceId:capId}}
window.__uniApplyCapsules=function(){ try{
  if(typeof Graph==="undefined"||!Graph) return;
  /* 1 · RESTORE any previous capsule state */
  if(_CAPST){
    for(var i=nodes.length-1;i>=0;i--){ if(nodes[i].__cap){ delete NIDS[nodes[i].id]; nodes.splice(i,1); } }
    for(var j=links.length-1;j>=0;j--){ if(links[j].__cap) links.splice(j,1); }
    _CAPST.nodes.forEach(function(n){ if(!NIDS[n.id]){ nodes.push(n); NIDS[n.id]=n; } });
    _CAPST.links.forEach(function(l){ links.push(l); });
    _CAPST=null; }
  /* 1.5 · FRESH SUBS before any fold — a core switch must regroup restored pieces (review 53[11]) */
  try{ __uniAssignSplit(); }catch(e){}
  /* 2 · APPLY per the current threshold/open set */
  if(UNICAP.on){
    var cnt={}; nodes.forEach(function(n){ if(n.kind!=="function") cnt[n.ent]=(cnt[n.ent]||0)+1; });   // functions NEVER trip the fold (review: loading them via the legend must not collapse the entity that holds them)
    var fold={}; _ents.forEach(function(e){ if((cnt[e]||0)>UNICAP.threshold && !UNICAP.open[e]) fold[e]=1; });
    if(Object.keys(fold).length){
      var st={ nodes:[], links:[], byPiece:{} };
      var caps={};
      for(var k=nodes.length-1;k>=0;k--){ var n=nodes[k]; if(!fold[n.ent]) continue;
        var g=(n.fe&&n.area)?n.area:(n.sub||"other");
        var cid="cap:"+n.ent+"|"+g;
        if(!caps[cid]){ caps[cid]={ id:cid, kind:"capsule", ent:n.ent, label:g, col:ENT[n.ent]||"#888",
          K:KINDS.capsule, layer:"web", sub:g, area:g, __cap:true, members:[], kinds:{}, fixture:0,
          m:{behind:0,depth:0,tests:0,cols:0,fanin:0,god:false,method:null}, det:{doc:""},
          x:(EX[n.ent]||0)+Math.cos(Object.keys(caps).length*2.4)*24,
          y:(EY[n.ent]||0)+Math.sin(Object.keys(caps).length*2.4)*24, z:(EZ[n.ent]||0) }; }
        caps[cid].members.push(n.id); caps[cid].kinds[n.kind]=(caps[cid].kinds[n.kind]||0)+1;
        if(n.fixture||(n.det&&n.det.fixture)) caps[cid].fixture++;
        st.byPiece[n.id]=cid; st.nodes.push(n); delete NIDS[n.id]; nodes.splice(k,1); }
      Object.keys(caps).sort().forEach(function(cid){ var c=caps[cid];
        c.label=c.label+" · "+c.members.length; nodes.push(c); NIDS[cid]=c; });
      /* links: stash every link touching a folded piece; re-add AGGREGATED bundles */
      var agg={};
      for(var m2=links.length-1;m2>=0;m2--){ var l=links[m2], s=lid(l.source), t2=lid(l.target);
        var cs=st.byPiece[s], ct=st.byPiece[t2];
        if(!cs&&!ct) continue;
        st.links.push(l); links.splice(m2,1);
        var A=cs||s, B=ct||t2; if(A===B) continue;
        if(!NIDS[A]||!NIDS[B]) continue;                        // the other end is fleet-toggled away
        var key=A<B?A+"→"+B:B+"→"+A;
        if(!agg[key]) agg[key]={a:A,b:B,n:0}; agg[key].n++; }
      Object.keys(agg).sort().forEach(function(key){ var g2=agg[key];
        links.push({source:g2.a, target:g2.b, rel:"bundle", w:Math.min(6,1+g2.n*0.2), proven:true,
                    payload:0, __cap:true, fe:false, count:g2.n }); });
      _CAPST=st; }
  }
  links.forEach(function(l){ l.source=lid(l.source); l.target=lid(l.target); });
  try{ Graph.graphData({nodes:nodes, links:links}); Graph.d3ReheatSimulation(); }catch(e){}
  try{ rebuildNodes(); }catch(e){}                       // the ONE sanctioned decoration reset — stale FLEETTICK/PULSE closures on stashed nodes threw otherwise
  try{ recomputeSubAnchors(); buildClusters(); updateClusters(true); }catch(e){}   // subs already fresh (step 1.5); a tail assignSub clobbered capsule areas (review 53[10])
  try{ updateConnectors(); buildTransports(); }catch(e){}
  if(window.__uniFleetRegroup) try{ __uniFleetRegroup(); }catch(e){}
  if(window.__uniPView&&window.__uniPView.lvl==="all"&&window.__uniPanelAll) try{ __uniPanelAll(); }catch(e){}   // review 53[12]: an open census must not show the pre-fold field
}catch(e){} };
window.__uniCapExpand=function(ent){ if(!ent) return; UNICAP.open[ent]=true; __uniApplyCapsules();
  if(window.__uniPanelEnt) try{ __uniPanelEnt(ent); }catch(e){} };
window.__uniCapCollapse=function(ent){ if(ent) delete UNICAP.open[ent]; __uniApplyCapsules(); };
/* ── WIRE VIEW (batch 52) — the R options as LIVE config toggles: each changes only the INK
   (and R4 one spring family); every hidden wire keeps its layout spring, so structure survives
   as proximity. R1 = structure at rest (fe flow wires off) · R2 = utility demotion (fecall into
   fan-in≥15 sinks off) · R3 = bundling (fe wires collapse to one line per cluster-pair, brightness
   = count) · R4 = tree containment (sole-parent renders wires off, those children spring TIGHT). ── */
window.UNIWIRE={ r1:false, r2:false, r3:false, r4:false };
var _UTILSET=null, _SOLEP=null;
function _wireSets(){ if(_UTILSET) return; _UTILSET={}; _SOLEP={};
  var fin={}, rin={};
  links.forEach(function(l){ if(l.rel==="fecall") fin[lid(l.target)]=(fin[lid(l.target)]||0)+1;
    else if(l.rel==="renders") rin[lid(l.target)]=(rin[lid(l.target)]||0)+1; });
  Object.keys(fin).forEach(function(id){ if(fin[id]>=15) _UTILSET[id]=1; });
  Object.keys(rin).forEach(function(id){ if(rin[id]===1) _SOLEP[id]=1; });
}
var _FE_FLOW={ renders:1, fecall:1, uses:1, imports:1 };   // the fe FLOW rels (reads = stores stays inked; typed is T-held)
window.__uniRelHide=function(l){ if(!l||!l.fe) return false;
  _wireSets();
  if(UNIWIRE.r3) return true;                                        // bundles replace every per-piece fe wire
  if(UNIWIRE.r2 && l.rel==="fecall" && _UTILSET[lid(l.target)]) return true;   // R1 (blunt hide-all-fe-wires) retired 2026-08-31 — tier-overlapping (operator)
  if(UNIWIRE.r4 && l.rel==="renders" && _SOLEP[lid(l.target)]) return true;
  return false; };
window.__uniDrawBundles=function(grp){ if(!UNIWIRE.r3) return;
  var by={}, cen={}, cnt={};
  var gk=function(n){ return n.ent+"|"+(n.sub||""); };
  nodes.forEach(function(n){ var p=_npos[n.id]; if(!p) return; var k=gk(n);
    if(!cen[k]) cen[k]={x:0,y:0,z:0}; cen[k].x+=p.x; cen[k].y+=p.y; cen[k].z+=p.z; cnt[k]=(cnt[k]||0)+1; });
  Object.keys(cen).forEach(function(k){ cen[k].x/=cnt[k]; cen[k].y/=cnt[k]; cen[k].z/=cnt[k]; });
  links.forEach(function(l){ if(!l.fe) return; var s=NIDS[lid(l.source)], tt=NIDS[lid(l.target)]; if(!s||!tt) return;
    if(!(_nodeVisibleFn(s)&&_nodeVisibleFn(tt)&&visN(s).wires&&visN(tt).wires)) return;
    var ka=gk(s), kb=gk(tt); if(ka===kb) return;
    var key=ka<kb?ka+"→"+kb:kb+"→"+ka; by[key]=(by[key]||0)+1; });
  Object.keys(by).sort().forEach(function(key){ var ab=key.split("→"), a=cen[ab[0]], b=cen[ab[1]]; if(!a||!b) return;
    var geo=new T.BufferGeometry().setFromPoints([new T.Vector3(a.x,a.y,a.z), new T.Vector3(b.x,b.y,b.z)]);
    var op=Math.min(0.85, 0.18+by[key]/28);                          // brightness = bundle size (count on hover is R3 v2)
    var mat=new T.LineBasicMaterial({ color:0x8b83f5, transparent:true, opacity:op });
    var ln=new T.Line(geo, mat); ln.userData.kind="bundle"; ln.userData.__bundle=by[key]; grp.add(ln); });
};

/* ── ONE badge-glyph source (legend law — the legend cell reuses the very draw fn the 3D badge uses).
   kind:"method" → HTTP-verb chip (endpoints, colour = METHOD) · kind:"role" → function-role chip
   (accessor/caller/gate/pure, colour = __BADGE_COL.role). Draws the coloured disc + dark glyph onto a
   128² canvas context; methodBadge/roleBadge wrap it into a Sprite, the legend popup paints it onto a
   DOM <canvas>. Change a glyph HERE and both the 3D badge and its legend swatch move together. ── */
window.__BADGE_COL={ method:{GET:"#22c55e",POST:"#3b82f6",PUT:"#f97316",PATCH:"#eab308",DELETE:"#ef4444",BOOT:"#8a8f98"},
                     role:{accessor:"#ef4444",caller:"#3b82f6",gate:"#eab308",pure:"#8794ab"},
                     feclass:{connector:"#0ca678",container:"#8a8f98",leaf:"#c026d3"},   // component CLASS badge (operator) — connector=data-in · container=compose · leaf=atom
                     count:{"*":(typeof KINDS!=="undefined"&&KINDS.schema&&KINDS.schema.col)||"#0e9aa7"} };   // schema fold count — the schema colour
window.__BADGE_DESC={
  method:{ GET:"reads — returns data, no write", POST:"creates — writes a new row", PUT:"replaces — overwrites a row", PATCH:"updates — mutates fields", DELETE:"removes — deletes a row", BOOT:"boot — runs ONCE at app startup (the lifespan seeder), not a request verb" },
  role:{ accessor:"touches the store — reads/writes a DB table or a durable sink", caller:"orchestrates — calls other functions, no store of its own", gate:"guards — auth / consent / idempotency before the work runs", pure:"pure — computes from its inputs, no store, no callee that writes" },
  feclass:{ connector:"connector — wires data into a view (the FE's controller)", container:"container — composes children, the screen's structure", leaf:"leaf — a shared, reused atom (Button, Chip…)" },
  count:{ "*":"nested-only schemas folded into this one — composition helpers no endpoint or function names; double-click the parent to reveal them" } };
/* connection KINDS (REL2KIND buckets) — shown on the link card + the connectors legend */
window.__CONNDESC={ fk:"foreign-key data coupling", calls:"a function / handler call", imports:"a component / module import", bridge:"a frontend fetch reaching an API", rollup:"endpoint→model — the call-tree ROLLUP (reaches this table through its functions)", access:"function→model — the TRUE data access (this fn reads/writes this table)" };
window.__badgeGlyph=function(c, kind, key){
  var col=((window.__BADGE_COL[kind]||{})[key])||((window.__BADGE_COL[kind]||{})["*"])||"#8794ab";
  c.fillStyle=col; c.beginPath(); c.arc(64,64,58,0,6.2832); c.fill();
  if(kind==="count"){ var t=String(key==null?"":key); c.fillStyle='#0b0f18'; c.textAlign='center'; c.textBaseline='middle';
    c.font='700 '+(t.length>1?60:72)+'px ui-monospace, Menlo, Consolas, monospace'; c.fillText(t, 64, 68); return; }   // the digits ARE the glyph
  c.strokeStyle='#0b0f18'; c.lineWidth=(kind==="role"||kind==="feclass"?11:13); c.lineCap='round'; c.lineJoin='round'; c.beginPath();
  if(kind==="role"){
    if(key==='accessor'){ c.ellipse(64,42,26,10,0,0,6.2832); c.moveTo(38,42); c.lineTo(38,86); c.moveTo(90,42); c.lineTo(90,86); c.moveTo(38,64); c.bezierCurveTo(38,74,90,74,90,64); c.moveTo(38,86); c.bezierCurveTo(38,96,90,96,90,86); }
    else if(key==='caller'){ c.moveTo(40,64); c.lineTo(70,64); c.moveTo(70,44); c.lineTo(70,84); c.moveTo(70,44); c.lineTo(90,44); c.moveTo(70,84); c.lineTo(90,84); }
    else if(key==='gate'){ c.moveTo(64,32); c.lineTo(92,44); c.lineTo(92,66); c.bezierCurveTo(92,86,64,96,64,96); c.bezierCurveTo(64,96,36,86,36,66); c.lineTo(36,44); c.closePath(); }
    else { c.moveTo(64,32); c.lineTo(72,56); c.lineTo(96,64); c.lineTo(72,72); c.lineTo(64,96); c.lineTo(56,72); c.lineTo(32,64); c.lineTo(56,56); c.closePath(); }
  } else if(kind==="feclass"){
    if(key==='connector'){ c.moveTo(36,64); c.lineTo(76,64); c.moveTo(60,48); c.lineTo(80,64); c.lineTo(60,80); }   // data-in arrow (the FE's controller)
    else if(key==='container'){ c.moveTo(40,50); c.lineTo(88,50); c.moveTo(40,66); c.lineTo(88,66); c.moveTo(40,82); c.lineTo(88,82); }   // stacked layers (composes children)
    else { c.rect(48,48,32,32); }                                                                                   // leaf = an atom brick (a shared, reused piece)
  } else {
    if(key==='GET'){ c.moveTo(64,34); c.lineTo(64,94); c.moveTo(46,78); c.lineTo(64,94); c.lineTo(82,78); }
    else if(key==='PUT'){ c.moveTo(64,94); c.lineTo(64,34); c.moveTo(46,50); c.lineTo(64,34); c.lineTo(82,50); }
    else if(key==='POST'){ c.moveTo(34,64); c.lineTo(94,64); c.moveTo(64,34); c.lineTo(64,94); }
    else if(key==='DELETE'){ c.moveTo(43,43); c.lineTo(85,85); c.moveTo(85,43); c.lineTo(43,85); }
    else if(key==='PATCH'){ c.moveTo(38,72); c.quadraticCurveTo(54,44,64,64); c.quadraticCurveTo(74,84,90,56); }
    else if(key==='BOOT'){ c.moveTo(64,30); c.lineTo(64,60);                                   // power/startup symbol — a lifecycle mark, not a CRUD verb
      c.moveTo(64+28*Math.cos(-Math.PI/2+0.5), 72+28*Math.sin(-Math.PI/2+0.5));
      c.arc(64,72,28,-Math.PI/2+0.5,-Math.PI/2-0.5+Math.PI*2,false); }
    else { c.arc(64,64,15,0,6.2832); }
  }
  c.stroke();
};
window.__uniBadges=[];
(function _mbTick(){ requestAnimationFrame(_mbTick);
  var arr=window.__uniBadges; if(!arr||!arr.length||typeof Graph==="undefined"||!Graph) return;
  var cam=Graph.camera(); if(!cam) return; var e=cam.matrixWorld.elements;   // cols: [0..2]=right · [4..6]=up · [8..10]=toward-viewer
  var ox=(typeof CFG!=="undefined"&&CFG.mbX!=null)?CFG.mbX:2, oy=(typeof CFG!=="undefined"&&CFG.mbY!=null)?CFG.mbY:-2.5,
      sz=(typeof CFG!=="undefined"&&CFG.mbSize!=null)?CFG.mbSize:3.5, op=(typeof CFG!=="undefined"&&CFG.mbOp!=null)?CFG.mbOp:0.6;
  var live=0;
  // PRUNE (bounded): drop a badge whose node group force-graph detached on rebuild. scene.remove(grp)
  // nulls grp.parent but NOT the badge's .parent (still the grp), so `!b.parent` alone never fires and
  // __uniBadges grew ~+263/toggle (696→2274 over 6). A LIVE badge's grp is still in the scene tree
  // (b.parent.parent truthy); a stale one's grp.parent is null → drop it. Keeps live badges (no flicker).
  for(var i=0;i<arr.length;i++){ var b=arr[i]; if(!b||!b.parent||!b.parent.parent) continue; arr[live++]=b;   // prune detached badges in place (bounded)
    b.position.set(e[0]*ox+e[4]*oy+e[8]*3, e[1]*ox+e[5]*oy+e[9]*3, e[2]*ox+e[6]*oy+e[10]*3);   // ICON-relative: pinned to the camera's right/up so it rides the billboard icon, never the sphere (operator)
    b.scale.set(sz,sz,1); if(b.material) b.material.opacity=op; }
  arr.length=live;
})();
/* The focus/highlight system is FIXED now (operator): the Temporary-Config sliders/pills retired
   to these defaults; only four on/off toggles survive, re-homed to the entity pane (grpWith("Highlight")
   in the __uniFlPanes builder). __uniAddFocusCfg is kept as a NAME (assemble.py boot-wires it at 6 sites)
   but is now a pure SEEDER, no panel. __uniHLReapply reads CFG.focRing/focGlow/othGlow/othRing + these values. */
window.__uniHLDefaults={ focRing:true, focSize:"sphere", focPat:"dashed", focAnim:"pulse", focSpeed:0.15, pulseMode:"const", pulseAmp:0.08, focThick:2.5, focThickConst:true,
            focGlow:true, focGlowRad:2.2, focGlowInt:0.65, focGlowFall:0.4,
            othGlow:true, glowRad:2.2, glowInt:0.3, glowFall:0.15, othRing:true, othRingInt:0.3 };   // operator defaults (fixed)
window.__uniHLSeed=function(){ for(var _dk in window.__uniHLDefaults){ if(CFG[_dk]==null) CFG[_dk]=window.__uniHLDefaults[_dk]; } };
window.__uniAddFocusCfg=function(){ window.__uniHLSeed(); };   // SEEDER ONLY — the focus/highlight config panel was retired (toggles live in the entity pane)
window.__uniAddWireView=function(){ var body=document.querySelector("#cfg .cfgbody")||document.getElementById("cfg");
  if(!body||document.getElementById("wireview")) return;
  var g=document.createElement("div"); g.className="grp"; g.id="wireview";
  g.innerHTML='<div class="grplbl" title="the R lab — each toggle changes only the INK on the live graph; hidden wires keep their layout springs, so structure survives as position. Combine freely.">WIRE VIEW</div>';
  var row=document.createElement("div"); row.className="cfgrow";
  var DEF=[["cap","CAP","capsules — a big entity boots COLLAPSED into one planet per AREA with bundled wires; click a capsule / its fleet row / any search hit inside it to open. Toggle OFF to always draw every piece."],
           ["r2","R2","utility demotion — hides only fecall wires INTO fan-in≥15 sinks (cx · client · mockupAssets): the everything-calls-the-util fans that carry no map information."],
           ["r3","R3","bundling — every fe wire collapses to ONE line per cluster-pair; brightness = how many wires ride the bundle."],
           ["r4","R4","tree containment — sole-parent renders wires hidden and those children spring TIGHT beside their parent; only SHARED components keep render wires (reuse is the signal)."]];
  DEF.forEach(function(d){ var b=document.createElement("button"); b.className="itog wv"; b.id="wv-"+d[0];
    b.title=d[2]; b.textContent=d[1];
    b.classList.toggle("on", d[0]==="cap"?!!UNICAP.on:!!UNIWIRE[d[0]]);   // a config rebuild must not lose the lit state (review 52[3])
    b.onclick=function(){
      if(d[0]==="cap"){ UNICAP.on=!UNICAP.on; if(!UNICAP.on) UNICAP.open={}; b.classList.toggle("on", UNICAP.on);
        if(window.__uniApplyCapsules) __uniApplyCapsules(); return; }
      UNIWIRE[d[0]]=!UNIWIRE[d[0]]; b.classList.toggle("on", UNIWIRE[d[0]]);
      if(d[0]==="r4"){ try{ tuneLinkForce(); if(typeof Graph!=="undefined"&&Graph) Graph.d3ReheatSimulation(); }catch(e){} }
      try{ updateConnectors(); }catch(e){} try{ buildTransports(); }catch(e){} };   // shuttles re-derive — none fly hidden wires (review 52[4])
    row.appendChild(b); });
  g.appendChild(row); body.appendChild(g);
  /* ── SELECTED-LINE look SETTLED (operator config baked as the connection default; the Temporary-Config panel retired like the focus-ring one) ── */
  if(typeof CFG!=="undefined"){ if(CFG.selOpacity==null) CFG.selOpacity=0.5; if(CFG.selThick==null) CFG.selThick=0.2; if(CFG.selPattern==null) CFG.selPattern="solid";
    if(CFG.selAnim==null) CFG.selAnim="pulse"; if(CFG.selAnimSpeed==null) CFG.selAnimSpeed=0.3; if(CFG.selGlow==null) CFG.selGlow=true; if(CFG.selGlowInt==null) CFG.selGlowInt=0.05; } };
/* ── GOTO (batch 51) — ONE navigation path for card/link chips: select + frame a drawn node;
   a HELD fe-type or function wakes its toggle first (the search rows' behavior, shared). ── */
window.__uniGoto=function(id){ if(!id) return;
  var _n0=NIDS[id];   // a panel chip whose target is FLEET-hidden → reveal its cluster+entity IN PLACE first, then select (same as clicking the ghost star; operator)
  if(_n0 && window.__uniReveal && typeof _nodeVisibleFn==="function" && !_nodeVisibleFn(_n0)){ try{ __uniReveal(id); }catch(_re){} }
  var go=function(){ var nd=NIDS[id]; if(!nd) return false;
    if(window.__uniSelNode) __uniSelNode(nd); _frameSet([id]); return true; };
  if(go()) return;
  if(_CAPST&&_CAPST.byPiece[id]){ var _ce=(_CAPST.nodes.filter(function(n){ return n.id===id; })[0]||{}).ent;
    if(_ce){ __uniCapExpand(_ce); if(go()) return; } }
  if(typeof _FETYPES!=="undefined" && _FETYPES.some(function(n){ return n.id===id; })){
    CFG.showTypes="on"; try{ toggleTypes(true); }catch(e){}
    var tb=document.getElementById("typesTog"); if(tb) tb.classList.add("on"); go(); return; }
  if(!_fnsOn && window.GABE_LEVELS && GABE_LEVELS.fn_nodes){ if(!_FNNODES) try{ _buildFnData(); }catch(e){}
    if((_FNNODES||[]).some(function(n){ return n.id===id; })){
      if(window.__uniSetKindState) __uniSetKindState("function","all"); else { CFG.showFns="on"; try{ toggleFns(true); }catch(e){} }
      go(); } } };
/* ── HIDE-BY-KIND (batch 51) — the legend Types rows are CONTROLS: a click hides that kind
   GRAPH-WIDE (meshes, hulls, wires, shuttles — the same apply path the fleet uses) and dims
   the row; a second click restores. ── */
/* ── LEGEND 3-STATE (operator ruling) — each kind cycles ALL → CRITICAL → OFF. "critical" hides a
   node whose ONLY caller is one node of the SAME kind (a private helper serving a single parent);
   data kinds (model/schema/endpoint — no callers) have no critical, so it reads as "all" for them.
   The BACKEND/FRONTEND legend headers are MASTERS that cycle their whole side. Functions are
   load-based: OFF unloads, CRITICAL/ALL load. ── */
var _KOFF={show:0,planets:0,wires:0,subs:0,zDef:0,zAtk:0,zCfl:0,zSat:0,routes:0};
window.__uniKindState={};     // kind → "all" | "critical" | "off"
window.__uniKindOff={};       // compat mirror (truthy iff state==="off")
window.__uniGrpState={backend:"all", frontend:"all"};   // BINARY legend (operator): sides boot ON
window.__uniFoldHelpers=true;   // fold single-caller SAME-kind helpers (the old per-kind "critical") — now ONE global control, default on, so the boot render is unchanged
function _kindDefault(k){ return k==="type"?"off":"all"; }   // BINARY legend: every kind boots ON except `type`; the helper-fold is global, not a per-kind state
/* ── DISCLOSURE TIERS (operator: simplification is CONTROL-driven, never a click-to-expand). A tier is
   a PRESET over kind-visibility + the FE component CLASS visibility (feClass). Coarse→fine: T0 shows the
   skeleton (doors + tables + screens), each tier reveals more kinds/classes, T3 is everything. Bound to
   keys 1–4; the header selector calls __uniSetTier. Any kind/class stays overridable afterwards (a tier
   is a bundle of toggles, not a lock) → picking a tier again re-applies it. ── */
window.__uniFeClassState={};   // feClass → true/false (a component CLASS hidden by a tier/fleet toggle); empty = all shown
window.__uniTier=null;         // the active tier index (null = custom / boot state)
var _FCALL=["view","private","connector","container","leaf"];
var _KTIER=["endpoint","model","schema","external","function","web","screen","component","hook","store","route","module","type","middleware","flag","provider","prompt"];
var _TIER_PRESETS=[
  { name:"Skeleton", koff:["function","schema","hook","module","type","middleware","flag","provider","prompt","external","store"], fcoff:["private","connector","container","leaf"] },
  { name:"Surface",  koff:["function","hook","module","type","prompt"],                                                            fcoff:["private","leaf"] },
  { name:"Trace",    koff:["module","type"],                                                                                       fcoff:["leaf"] },
  { name:"Everything", koff:["type"],                                                                                             fcoff:[] } ];
window.__uniSetTier=function(t){ t=Math.max(0,Math.min(3,t|0)); window.__uniTier=t;
  // A tier press during a WALK must PRESERVE the journey + selection and keep positions STATIC (operator):
  // never clear the walk, and never toggleFns (adding/removing fn nodes reheats the sim → the graph jumps).
  // During a walk, functions hide by VISIBILITY (visN kind-off) instead — the pinned steps survive via the
  // visN pin-exemption, non-step functions recede, and nothing re-lays-out.
  var _walk=(typeof WALK!=="undefined" && WALK.mode && WALK.steps && WALK.steps.length);
  var p=_TIER_PRESETS[t], koff={}; p.koff.forEach(function(k){ koff[k]=1; });
  _KTIER.forEach(function(k){ __uniKindState[k]=koff[k]?"off":"all"; if(koff[k]) __uniKindOff[k]=1; else delete __uniKindOff[k];
    if(k==="function" && window.toggleFns && !_walk){ var want=!koff[k]; if((CFG.showFns==="on")!==want){ CFG.showFns=want?"on":"off"; try{ toggleFns(want); }catch(e){} } } });
  window.__uniFeClassState={}; _FCALL.forEach(function(fc){ window.__uniFeClassState[fc]=(p.fcoff.indexOf(fc)<0); });
  __uniGrpState.backend=__uniGrpState.frontend="all";
  try{ __uniComputeSolo(); }catch(e){} try{ _applyVisNow({all:true}); }catch(e){}
  if(window.__legRender) try{ __legRender(); }catch(e){}
  if(window.__uniTierSyncUI) try{ __uniTierSyncUI(); }catch(e){} };
window.__uniFeClassToggle=function(fc){ if(!fc) return; var s=window.__uniFeClassState||{};
  s[fc]=(s[fc]===false); window.__uniFeClassState=s; window.__uniTier=null; if(window.__uniTierSyncUI) __uniTierSyncUI();   // a manual class toggle leaves the preset
  try{ _applyVisNow({all:true}); }catch(e){} if(window.__legRender) try{ __legRender(); }catch(e){} };
window.__uniSetFoldHelpers=function(on){ window.__uniFoldHelpers=(on!==false);   // the old per-kind "critical", now ONE toggle: fold single-caller helpers
  try{ __uniComputeSolo(); }catch(e){} try{ _applyVisNow({all:true}); }catch(e){} if(window.__legRender) try{ __legRender(); }catch(e){} if(window.__uniTierSyncUI) try{ __uniTierSyncUI(); }catch(e){} };
/* TIER ICONS (operator): the header T0–T3 buttons can wear an ICON SET instead of the text labels.
   Several sets ship; the choice lives in the config panel (the connections workbench, beside the
   wire-view options). The LEVEL reads from the icon's ramp/fill; the T-number stays on hover (title=). */
function _tsvg(inner){ return '<svg viewBox="0 0 24 24" width="13" height="13">'+inner+'</svg>'; }
var _TICO={
  labels:function(t){ return "T"+t; },
  bars:function(t){ var b=''; for(var i=0;i<4;i++){ var h=4+i*3.6, y=20-h; b+='<rect x="'+(3+i*4.6)+'" y="'+y+'" width="3" height="'+h+'" rx="0.8" fill="currentColor"'+(i<=t?'':' opacity="0.25"')+'/>'; } return _tsvg(b); },
  dots:function(t){ var b=''; for(var i=0;i<4;i++){ b+='<circle cx="'+(4.5+i*5)+'" cy="12" r="1.9" fill="currentColor"'+(i<=t?'':' opacity="0.25"')+'/>'; } return _tsvg(b); },
  layers:function(t){ var n=t+1, b=''; for(var i=0;i<n;i++){ var y=18.5-i*4.4; b+='<rect x="4" y="'+y+'" width="16" height="3.1" rx="1.3" fill="currentColor" opacity="'+(0.5+i*0.16).toFixed(2)+'"/>'; } return _tsvg(b); },
  grid:function(t){ var n=t+1, b='', step=16/n, r=Math.max(0.85, 2.6-n*0.32); for(var y=0;y<n;y++) for(var x=0;x<n;x++){ b+='<circle cx="'+(4+step*(x+0.5)).toFixed(1)+'" cy="'+(4+step*(y+0.5)).toFixed(1)+'" r="'+r.toFixed(2)+'" fill="currentColor"/>'; } return _tsvg(b); } };
// SETTLED (operator): the DETAIL GRID set everywhere — the switcher UI is retired. The T-number
// stays on hover; the level reads from the grid density (T0 one cell → T3 a 4×4 grid).
window.__uniTierIcoSet="grid";
window.__uniRenderTierIcons=function(){ var fn=_TICO[window.__uniTierIcoSet]||_TICO.grid;
  var g=document.getElementById("tiersel"); if(g) [].forEach.call(g.querySelectorAll("button"), function(b){ b.innerHTML=fn(+b.getAttribute("data-tier")); });
  var fp=document.querySelector('.pill[data-grp="tier"]'); if(fp) [].forEach.call(fp.querySelectorAll("button"), function(b){ b.innerHTML=fn(+b.getAttribute("data-v")); }); };   // the fleet tier pill mirrors the header
window.__uniTierSyncUI=function(){ var g=document.getElementById("tiersel");
  if(g) [].forEach.call(g.querySelectorAll("button"), function(b){ b.classList.toggle("on", (+b.getAttribute("data-tier"))===window.__uniTier); });
  var fp=document.querySelector('.pill[data-grp="tier"]');   // the fleet-side tier pill mirrors the header
  if(fp) [].forEach.call(fp.querySelectorAll("button"), function(b){ b.classList.toggle("on", (+b.getAttribute("data-v"))===window.__uniTier); });
  var fld=document.querySelector('.pill[data-grp="fold"]');
  if(fld) [].forEach.call(fld.querySelectorAll("button"), function(b){ b.classList.toggle("on", (b.getAttribute("data-v")==="on")===(window.__uniFoldHelpers!==false)); });
  var fc=document.querySelector('.fcpill');
  if(fc) [].forEach.call(fc.querySelectorAll("button"), function(b){ b.classList.toggle("on", !(window.__uniFeClassState&&window.__uniFeClassState[b.getAttribute("data-fc")]===false)); }); };
(function(){ var _init=function(){ var g=document.getElementById("tiersel"); if(!g||g.__wired) return; g.__wired=1;
    [].forEach.call(g.querySelectorAll("button"), function(b){ b.onclick=function(){ __uniSetTier(+b.getAttribute("data-tier")); }; });
    document.addEventListener("keydown", function(e){                                   // keys 1–4 select a tier (not while typing)
      if(e.key>="1" && e.key<="4" && !e.metaKey && !e.ctrlKey && !e.altKey
         && !/^(input|textarea)$/i.test((e.target && e.target.tagName) || "")){ __uniSetTier(+e.key-1); e.preventDefault(); } });
    if(window.__uniTierSyncUI) __uniTierSyncUI();
    if(window.__uniRenderTierIcons) __uniRenderTierIcons(); };   // wear the chosen tier icon set from boot (operator)
  if(document.readyState!=="loading") _init(); else document.addEventListener("DOMContentLoaded", _init); })();
var _SOLO_REL={calls:1,renders:1,uses:1,"uses-hook":1,"uses-store":1,fecall:1,imports:1,handler:1,"reads":1};
window.__uniComputeSolo=function(){ var callers={};
  links.forEach(function(l){ if(!_SOLO_REL[l.rel]) return; var sn=NIDS[lid(l.source)], tn=NIDS[lid(l.target)]; if(!sn||!tn||sn.id===tn.id) return;   // a self-loop (recursion) is NOT an external parent (review LOW)
    (callers[tn.id]=callers[tn.id]||{})[sn.id]=sn.kind; });
  /* WRITE-FABRIC exemption: a fn on a write path (d2w set — incl. 0, the anchor) or holding its
     own access ops (red/pink wire) is never a mere helper — critical keeps the journey walkable
     end-to-end; single-caller fns that never reach a write (serializers, response builders) fold. */
  /* B2 HUB FOLD (2026-08-27): admitting methods draws a gate like AuthContext.require_household
     with a fan-in of 50 — a 50-spoke star. A gate called by many is CONTEXT, and its gate already
     rides every endpoint's middleware badge, so a high-fan-in gate folds under critical (its wires
     gone) exactly like a solo helper. Threshold well above the next-busiest node (gustify: 50 vs 5). */
  var _HUB_FANIN=15;
  nodes.forEach(function(n){ var cs=callers[n.id]||{}, ks=Object.keys(cs);
    n.__solo=(ks.length===1 && cs[ks[0]]===n.kind && n.d2w==null && !(n.access&&n.access.ops&&n.access.ops.length))
      || (n.role==="gate" && ks.length>=_HUB_FANIN); });
  /* SCHEMA fold (operator, 2026-08-27): a schema whose ONLY wires are `nests` — a composition helper
     (the six *Input fields of SetupCompleteRequest, the seven Blocks of SettingsResponse) — is a
     nested-only schema: it folds into its parent under the schema kind's CRITICAL state, and the
     parent wears a COUNT badge (__foldN = folded DIRECT children). A schema an ENDPOINT wires
     (touches · consumes · resp · bridge) is a contract and never folds; a FUNCTION wire alone
     (returns · takes · uses — the builder that constructs the Block, the upsert that takes the
     Input) is how composition is processed, not an exposure, so it does not block the fold.
     Multi-parent helpers fold too (each parent counts them); the reveal (double-click) pins them
     back, like every other fold. */
  var _sW={}, _sP={};
  links.forEach(function(l){ var sn=NIDS[lid(l.source)], tn=NIDS[lid(l.target)]; if(!sn||!tn||sn.id===tn.id) return;
    if(l.rel==="nests"){ if(tn.kind==="schema") (_sP[tn.id]=_sP[tn.id]||[]).push(sn.id); return; }
    if(l.rel==="serializes") return;   // P2 (wave-C floor 2): schema→model is a MAPPING, not an exposure — like nests it must not un-fold a nested-only schema (a *Block that serializes a model still folds)
    if(sn.kind==="function"||tn.kind==="function") return;   // fn wires never make a contract
    if(sn.kind==="schema") _sW[sn.id]=1; if(tn.kind==="schema") _sW[tn.id]=1; });
  nodes.forEach(function(n){ if(n.kind==="schema") n.__foldN=0; });
  nodes.forEach(function(n){ if(n.kind!=="schema") return; var no=!!_sP[n.id] && !_sW[n.id]; n.__solo=no;
    if(no) _sP[n.id].forEach(function(pid){ var pn=NIDS[pid]; if(pn && pn.kind==="schema") pn.__foldN=(pn.__foldN||0)+1; }); });
  if(window.__uniSyncCountBadges) try{ __uniSyncCountBadges(); }catch(e){} };
/* the COUNT badge follows __foldN: (re)built after every solo recompute — a fn toggle adds schema
   wires (levels schema_edges) and can un-fold a kid, so the number is never a boot-time constant. */
window.__uniSyncCountBadges=function(){ if(typeof nodes==="undefined"||typeof countBadge!=="function") return;
  nodes.forEach(function(n){ if(n.kind!=="schema") return; var grp=n.__threeObj; if(!grp) return;
    var want=n.__foldN||0, have=grp.__cnt||null;
    if(have && have.__n===want) return;
    if(have){ grp.remove(have); var i=(window.__uniBadges||[]).indexOf(have); if(i>=0) window.__uniBadges.splice(i,1); grp.__cnt=null; }
    if(want>0){ try{ var cb=countBadge(want); cb.__n=want; grp.add(cb); grp.__cnt=cb; }catch(e){} } }); };
window.__uniKindHasSolo=function(k){ for(var i=0;i<nodes.length;i++){ if(nodes[i].kind===k && nodes[i].__solo) return true; } return false; };
window.__uniSetKindState=function(k, st, _defer){
  __uniKindState[k]=st; if(st==="off") __uniKindOff[k]=1; else delete __uniKindOff[k];
  if(k==="function" && window.toggleFns){ var want=(st!=="off"); if((CFG.showFns==="on")!==want){ CFG.showFns=want?"on":"off"; try{ toggleFns(want); }catch(e){} } }
  if(!_defer){ try{ __uniComputeSolo(); }catch(e){} try{ _applyVisNow({all:true}); }catch(e){} if(window.__legRender) try{ __legRender(); }catch(e){} } };
window.__uniKindToggle=function(k){ if(!k) return;   // BINARY legend (operator): on ↔ off, no 3-state
  var cur=__uniKindState[k]||_kindDefault(k);
  __uniSetKindState(k, cur==="off"?"all":"off"); if(window.__uniTier!=null){ window.__uniTier=null; if(window.__uniTierSyncUI) __uniTierSyncUI(); } };
var _GRPKINDS={ backend:["endpoint","function","schema","model","external","entity"],
                frontend:["route","component","hook","type","store","module","screen","web"] };
window.__uniGroupToggle=function(group){ if(!_GRPKINDS[group]) return;
  var cur=__uniGrpState[group]||"all", next=(cur==="off")?"all":"off";   // BINARY: the whole side on ↔ off
  __uniGrpState[group]=next;
  _GRPKINDS[group].forEach(function(k){ __uniSetKindState(k, next, true); });
  try{ __uniComputeSolo(); }catch(e){} try{ _applyVisNow({all:true}); }catch(e){} if(window.__legRender) try{ __legRender(); }catch(e){}
  if(window.__uniTier!=null){ window.__uniTier=null; if(window.__uniTierSyncUI) __uniTierSyncUI(); } };
/* ── the header SEARCH (batch 49) — one box over everything the station knows: live elements,
   held types (selecting one turns Types ON first), entities, clusters (current core), journeys.
   `/` focuses · ↑↓ move · Enter opens · Esc closes. Entries rebuild per keystroke from the LIVE
   field — a toggle (ƒ · T · fleet) is reflected on the next character, nothing cached to go stale. ── */
if(!window.__uniSrchInit){ window.__uniSrchInit=1; (function(){
  var inp=document.getElementById("tsin"), dd=document.getElementById("tsdd"), box=document.getElementById("tsrch");
  if(!inp||!dd) return;
  var ACT=[], act=-1;
  var _esc=function(x){ return String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); };   // labels are code identifiers (Map<string…) and the echo is raw keyboard text
  var JGLYPH='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>';
  function _score(q, label, extra){ var l=(label||"").toLowerCase();
    if(l.indexOf(q)===0) return 0; if(l.indexOf(q)>=0) return 1;
    if(extra && extra.toLowerCase().indexOf(q)>=0) return 2; return -1; }
  function _collect(q){ var out=[];
    nodes.forEach(function(n){ var sc=_score(q, n.label, (n.det&&n.det.file)||n.id);
      if(sc>=0) out.push({g:"elements", sc:sc, label:n.label, sub:n.ent, ico:svgInline(n.kind, n.col, 12),
        go:function(){ if(window.__uniGoto) __uniGoto(n.id); else if(window.__uniSelNode){ __uniSelNode(n); _frameSet([n.id]); } } }); });
    if(typeof _CAPST!=="undefined" && _CAPST) _CAPST.nodes.forEach(function(n){ if(NIDS[n.id]) return;
      var sc=_score(q, n.label, (n.det&&n.det.file)||n.id);
      if(sc>=0) out.push({g:"collapsed", sc:sc+0.25, label:n.label, sub:n.ent, hint:"opens the capsule",
        ico:svgInline(n.kind, n.col||"#888", 12),
        go:function(){ if(window.__uniGoto) __uniGoto(n.id); } }); });
    if(typeof _FETYPES!=="undefined") _FETYPES.forEach(function(n){ if(NIDS[n.id]) return;
      var sc=_score(q, n.label, (n.det&&n.det.file)||n.id);
      if(sc>=0) out.push({g:"types (off)", sc:sc+0.5, label:n.label, sub:n.ent, hint:"turns Types ON",
        ico:svgInline("type", KINDCOL.type, 12),
        go:function(){ if(window.__uniGoto) __uniGoto(n.id); } }); });   // __uniGoto wakes Types ON + reveals + selects (one path)
    if(typeof _fnsOn!=="undefined" && !_fnsOn && window.GABE_LEVELS && GABE_LEVELS.fn_nodes && GABE_LEVELS.fn_nodes.length){
      if(!_FNNODES) try{ _buildFnData(); }catch(e){}
      (_FNNODES||[]).forEach(function(n){ if(NIDS[n.id]) return;
        var sc=_score(q, n.label, n.id);
        if(sc>=0) out.push({g:"functions (off)", sc:sc+0.5, label:n.label, sub:n.ent, hint:"turns ƒ ON",
          ico:svgInline("function", KINDCOL["function"], 12),
          go:function(){ if(window.__uniGoto) __uniGoto(n.id); } }); });   // __uniGoto wakes ƒ ON + reveals + selects (one path)
    }
    _ents.forEach(function(e){ var el=window.__uniEntLabel?__uniEntLabel(e):e;
      var _a=_score(q, el, e), _b=_score(q, e), sc=(_a<0)?_b:(_b<0)?_a:Math.min(_a,_b);   // best of display and raw slug — the fe· prefix must not demote a "design…" prefix match
      if(sc>=0) out.push({g:"entities", sc:sc, label:el, sub:(nodes.filter(function(n){return n.ent===e;}).length)+" pieces",
        ico:'<i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+(ENT[e]||"#888")+'"></i>',
        go:function(){ if(window.__uniPanelEnt) __uniPanelEnt(e);
          _frameSet(nodes.filter(function(n){ return n.ent===e; }).map(function(n){ return n.id; })); } }); });
    if(typeof SUBANCHOR!=="undefined") Object.keys(SUBANCHOR).forEach(function(e){
      Object.keys(SUBANCHOR[e]).forEach(function(sub){ if(!sub) return; var sc=_score(q, sub, e);
        if(sc>=0) out.push({g:"clusters", sc:sc+0.25, label:sub, sub:e, ico:svgInline("entity", ENT[e]||"#888", 12),
          go:function(){ if(window.__uniPanelClu) __uniPanelClu(e, sub);
            _frameSet(nodes.filter(function(n){ return n.ent===e&&n.sub===sub; }).map(function(n){ return n.id; })); } }); });
    });
    _jrnCollect().forEach(function(j){ var sc=_score(q, j.name||j.cid, j.cid+" "+j.ents.join(" "));
      if(sc>=0) out.push({g:"journeys", sc:sc+0.25, label:(j.name||j.cid), sub:(j.wf&&j.level&&_JRNLEVELS[j.level]?(_JRNLEVELS[j.level].label+" · "):"")+j.corpus+(j.feN?(" · "+j.feN+" fe"):""), ico:JGLYPH,
        go:function(){ window.__uniJrnStart(j.cid); } }); });
    out.sort(function(a,b){ return (a.sc-b.sc)||(a.label<b.label?-1:1); });
    return out; }
  function _close(){ dd.style.display="none"; ACT=[]; act=-1; }
  function _render(){ var q=inp.value.trim().toLowerCase();
    if(q.length<2){ _close(); return; }
    var all=_collect(q), CAP=14; ACT=all.slice(0,CAP); act=ACT.length?0:-1;
    var _seen=[], _by={}; ACT.forEach(function(r){ if(!_by[r.g]){ _by[r.g]=[]; _seen.push(r.g); } _by[r.g].push(r); });
    ACT=_seen.reduce(function(a,gk){ return a.concat(_by[gk]); },[]);           // headers render ONCE — the best hit still decides group order
    var h="", g=null;
    ACT.forEach(function(r,i){ if(r.g!==g){ g=r.g; h+='<div class="tsgrp">'+g+'</div>'; }
      h+='<div class="tsrow'+(i===act?" on":"")+'" data-ti="'+i+'">'+r.ico
        +'<span class="tsl">'+_esc(r.label)+'</span>'
        +(r.hint?('<span class="tshint">'+_esc(r.hint)+'</span>'):"")
        +'<span class="tss">'+_esc(r.sub)+'</span></div>'; });
    if(all.length>CAP) h+='<div class="tsmore">+'+(all.length-CAP)+' more — keep typing</div>';
    if(!ACT.length) h='<div class="tsmore">no match for “'+_esc(inp.value.trim())+'”</div>';
    var _jp=document.getElementById("jrn"); if(_jp) _jp.style.display="none";   // exclusive surfaces: #jrn (z-55, document-level) would paint OVER the dropdown and steal its clicks
    try{ _stepNote(); }catch(e){}                                                     // the note follows the picker's state
    dd.innerHTML=h; dd.style.display="";
    dd.querySelectorAll(".tsrow").forEach(function(r){
      r.onmousedown=function(ev){ ev.preventDefault(); _fire(+r.getAttribute("data-ti")); };   // mousedown beats the input blur
      r.onmouseenter=function(){ _mark(+r.getAttribute("data-ti")); }; }); }
  function _mark(i){ act=i; dd.querySelectorAll(".tsrow").forEach(function(r){ r.classList.toggle("on", +r.getAttribute("data-ti")===act); }); }
  function _fire(i){ var r=ACT[i]; if(!r) return; _close(); inp.blur(); try{ r.go(); }catch(e){} }
  inp.addEventListener("input", _render);
  inp.addEventListener("focus", _render);
  inp.addEventListener("keydown", function(e){
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); e.stopPropagation();
      if(!ACT.length) return; _mark((act+(e.key==="ArrowDown"?1:ACT.length-1))%ACT.length);
      var on=dd.querySelector(".tsrow.on"); if(on&&on.scrollIntoView) on.scrollIntoView({block:"nearest"}); }
    else if(e.key==="Enter"){ e.preventDefault(); e.stopPropagation(); _fire(act); }
    else if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); _close(); inp.blur(); } });
  inp.addEventListener("focusout", function(e){ if(!box.contains(e.relatedTarget)) _close(); });   // Tab/keyboard blur — row clicks preventDefault so focus never leaves on them
  document.addEventListener("mousedown", function(ev){ if(box&&!box.contains(ev.target)) _close(); });
  window.addEventListener("keydown", function(e){ var tag=(e.target&&e.target.tagName)||"";
    if(e.key==="/" && tag!=="INPUT" && tag!=="TEXTAREA" && !e.ctrlKey && !e.metaKey && !e.altKey){
      e.preventDefault(); inp.focus(); inp.select(); } });
})(); }
