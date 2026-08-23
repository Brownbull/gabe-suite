/* ══ GABE UNIVERSE — live adapter: window.GABE_C4 (C4 l1/l2/cross_edges) → spike {nodes,links} ══
   Replaces the spike's toy NODEDEF/METRICS. SAME field names the encoders read, now fed live.
   Node m-bag: behind/depth/tests/cols/fanin/god/method (+ large/hot/flags derived, spike-identical).
   Each node also carries det/behind/resp/ids/table/sites so the live card reads real dossiers. */
/* layer ruling (c) 2026-08-20: the old SUBOF collapse (endpoints→api, web→frontend) is retired —
   the layer core groups by the kind's OWN layer value, so new kinds bring their layer for free. */
var LZ={ endpoints:150, api:60, web:150, data:-150 };
var METHOD={ GET:"#22c55e", POST:"#3b82f6", PUT:"#f97316", PATCH:"#eab308", DELETE:"#ef4444" };
/* rel → edge colour. c4 kinds: touches · fk · bridge (+ empty→fk on model FK cross-edges). */
var RELCOL={ touches:"#7c5cfc", fk:"#12b886", bridge:"#e8f443", calls:"#f59e0b", imports:"#a855f7",
  renders:"#339af0", mounts:"#e8590c", uses:"#0ca678", reads:"#e64980", typed:"#8794ab", fetches:"#e8590c", handler:"#8b5cf6", resp:"#f59f00", pk:"#868e96" };
/* rel → coupling weight (w) · proven (structural vs inferred) · pl (default payload). fk/touches = structural join;
   bridge/calls = inferred-by-design floor (cross-file fetch/call). */
var LINKMETA={ touches:{w:4,pv:1}, fk:{w:2,pv:1,pl:1}, bridge:{w:3,pv:0,pl:6}, calls:{w:5,pv:0}, imports:{w:3,pv:0},
  renders:{w:3,pv:1}, mounts:{w:2,pv:1}, uses:{w:4,pv:0}, reads:{w:3,pv:0}, typed:{w:2,pv:1,pl:6}, fetches:{w:5,pv:0,pl:6}, handler:{w:6,pv:1}, resp:{w:3,pv:1}, pk:{w:1,pv:1} };

/* the frontend "web" kind the spike lacks (c4 emits web nodes). Mirror screen's frontend layer + a distinct glyph. */
if(!KINDS.web){ KINDS.web={ col:"#a855f7", form:"panel", label:"", type:"Frontend (web)", layer:"web",
  usage:[0,""], conns:[], tests:0, ident:[], doc:"A frontend fetching file — its fetch is matched to the endpoint it names (the web→API bridge)." }; }
KINDCOL.web="#a855f7"; KINDS.web.col="#a855f7";
if(typeof GLYPH!=="undefined" && !GLYPH.web) GLYPH.web=GLYPH.screen;   // panel header icon for web nodes (GLYPH lacked web)

/* ── FRONTEND arm (batch 48): c4.fe = compiler-proven pieces (component · hook · store · route · fe-type · module)
   + typed wires (renders · uses-hook · uses-store · typed · fecall · imports) on a SEPARATE key. The spike's KINDS already
   draw route/component/hook/store/type; `module` (a file's plain value exports — feature logic, lib, api) is new. */
KINDS.module={ col:"#f59e0b", form:"slab", label:"recipeScoring", type:"Module (FE)", layer:"web", usage:[0,"called by components / hooks"],
  conns:[["called by","component","RecipeCard · …"],["imports","fe-type","RecipeScore"]], tests:0, ident:[["home","recipe"],["kind","feature logic / lib / api client"]],
  doc:"A plain TS module — ONE piece for the file's value exports (feature logic, lib, api client). Components and hooks call into it (fecall) or import its values (imports)." };
KINDCOL.module="#f59e0b";
if(typeof GLYPH!=="undefined"){ GLYPH.module='<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'; }
LINKMETA.fecall={w:3,pv:1}; LINKMETA.imports={w:2,pv:1};
var FE_HOME_COL={ bucket:"#7c3aed", candidate:"#f97316" };   // a shared FE bucket (design-system · app-shell) · a feature the backend never modeled
var FE_KIND={ "fe-type":"type" };                              // the feed's kind name → the spike's KINDS key
var FE_REL={ "uses-hook":"uses", "uses-store":"reads" };       // the feed's rel → LINKMETA/REL2KIND vocabulary

/* animation state: fleets static by default (perf); all = master play/pause; freezeOnDrag = auto-pause
   decorations while the camera is being rotated/moved, resume on release (pulseLoop reads ANIM.all). */
var ANIM={ fleets:false, all:true, freezeOnDrag:true };
var _C4=window.GABE_C4||{l1:{nodes:[],edges:[]},l2:{},cross_edges:[],colors:{}};
function _num(x){ return (typeof x==="number"&&isFinite(x))?x:(+x||0); }
function _methOf(label){ var m=/^(GET|POST|PUT|PATCH|DELETE)\b/.exec(label||""); return m?m[1]:null; }

/* ENTITIES → cluster colour + X band (spread evenly; the spike drives layout from EX[ent]). */
var _ents=((_C4.l1&&_C4.l1.nodes)||[]).map(function(e){ return e.slug||e.id; });
if(!_ents.length) _ents=Object.keys(_C4.l2||{});
var ENT={}, EX={}, EY={}, EZ={};   // EY/EZ used by the force/spread entity-layout modes (batch 2)
var SUBANCHOR={}, RENT={};         // batch 9: per-(ent,sub) local ring offsets + per-entity nominal radius — both filled by recomputeSubAnchors()
_ents.forEach(function(e,i){ ENT[e]=(_C4.colors&&_C4.colors[e])||"#0d9488";
  EX[e]=_ents.length<=1?0:(-300+i*(600/(_ents.length-1))); EY[e]=0; EZ[e]=0; });

/* PIECES → nodes. Shared pieces (an external FK target, an endpoint homed under >1 entity)
   recur across l2 subgraphs — DEDUP by id (first home wins) so a shared node is drawn ONCE and
   every edge resolves to it deterministically (no phantom ghosts, no last-wins boundary drift). */
function _testFloor(det){ var n=(det.cases||[]).length + _num(det.cases_more);
  (det.case_files||[]).forEach(function(f){ var mm=/(\d+)\s*case/.exec(f.name||""); if(mm) n+=+mm[1]; });
  return n; }   // true test floor: visible cases + capped overflow + file-coverage case counts
var nodes=[], NIDS={}, _dropped=0;
Object.keys(_C4.l2||{}).forEach(function(ent){
  ((_C4.l2[ent]||{}).nodes||[]).forEach(function(p){
    var kind=p.kind; if(!KINDS[kind]){ _dropped++; return; }   // kind the spike can't draw
    if(NIDS[p.id]) return;                                     // dedup: a shared piece is drawn once
    var det=p.det||{}, beh=p.behind||{};
    var m={ behind:_num(beh.fns), depth:_num(beh.depth),
      tests:_testFloor(det), cols:(det.cols||[]).length,
      fanin:0,                                          // filled from in-degree below
      god:false, method:(kind==="endpoint")?_methOf(p.label):null };
    var n={ id:p.id, kind:kind, ent:ent, label:p.label||p.slug||p.id,
      col:KINDS[kind].col, K:KINDS[kind], layer:KINDS[kind].layer, sub:KINDS[kind].layer||"data",
      m:m, det:det, behind:beh, resp:p.resp, ids:p.ids, table:p.table, sites:p.sites, fn:p.fn };
    nodes.push(n); NIDS[n.id]=n; });
});
if(_dropped) try{ console.warn("[universe] dropped "+_dropped+" piece(s) of unknown kind (add to KINDS)"); }catch(e){}

/* FRONTEND pieces → nodes. Homes that are not L1 entities (buckets · candidate features) become synthetic
   clusters (their own colour band); every piece carries a det the card can read (file + lines) — honest-empty
   for the rest. A piece whose file fetches carries `screen` = the web node it ABSORBS (below, once links exist). */
var _FE=(_C4.fe&&_C4.fe.pieces&&_C4.fe.pieces.length)?_C4.fe:null, FE_HOME={};
/* the DISPLAY name of an entity/home — frontend-only homes wear the `fe ·` identifier (batch 50);
   the raw slug stays the KEY everywhere (CLUSTERS.name, ENT, EX, fleet data-attrs, panels). */
window.__uniEntLabel=function(e){ return (FE_HOME[e]?"fe · ":"")+e; };
if(_FE){
  (_FE.homes||[]).forEach(function(h){ if(h.kind!=="entity"){ FE_HOME[h.id]=h.kind; if(_ents.indexOf(h.id)<0){ _ents.push(h.id); ENT[h.id]=FE_HOME_COL[h.kind]||"#8b5cf6"; } } });
  _ents.forEach(function(e,i){ EX[e]=_ents.length<=1?0:(-300+i*(600/(_ents.length-1))); if(EY[e]==null) EY[e]=0; if(EZ[e]==null) EZ[e]=0; });   // re-band with the new clusters
  _FE.pieces.forEach(function(p){ var kind=FE_KIND[p.kind]||p.kind; if(!KINDS[kind]){ _dropped++; return; }
    if(NIDS[p.id]) return;
    var det={ file:p.file, flines:p.span?(p.span[0]+"-"+p.span[1]):null, exported:true, fe_kind:p.kind, exports:p.exports||null, doc:"" };
    var m={ behind:0, depth:0, tests:0, cols:0, fanin:0, god:false, method:null };
    var n={ id:p.id, kind:kind, ent:p.home, label:p.name, col:KINDS[kind].col, K:KINDS[kind], layer:KINDS[kind].layer, sub:KINDS[kind].layer||"web",
      m:m, det:det, behind:{}, fe:true, screen:p.screen||null, sites:p.sites||0, candidate:!!p.candidate };
    nodes.push(n); NIDS[n.id]=n; });
}

/* LINKS: intra-entity l2 edges + cross_edges. Keep only edges whose BOTH ends are drawn nodes. */
var links=[];
Object.keys(_C4.l2||{}).forEach(function(ent){
  ((_C4.l2[ent]||{}).edges||[]).forEach(function(e){ links.push({source:e.source,target:e.target,rel:e.kind||"calls"}); }); });
(_C4.cross_edges||[]).forEach(function(e){ links.push({source:e.from,target:e.to,rel:e.kind||"fk"}); });
if(_FE){
  /* fe wires are COMPACT index triples [from, to, rel] over fe.pieces order */
  var _P=_FE.pieces; (_FE.edges||[]).forEach(function(e){ var a=_P[e[0]], b=_P[e[1]]; if(!a||!b) return; links.push({source:a.id, target:b.id, rel:FE_REL[e[2]]||e[2], fe:true}); });
  /* SCREEN ABSORPTION: the piece that fetches replaces its file-level `web` node — the bridge links
     re-target to the piece, the web node leaves the field (one node per fetching file, not two). */
  var ABS={}; nodes.forEach(function(n){ if(n.screen && NIDS[n.screen] && NIDS[n.screen].kind==="web") ABS[n.screen]=n.id; });
  links.forEach(function(l){ if(ABS[l.source]) l.source=ABS[l.source]; if(ABS[l.target]) l.target=ABS[l.target]; });
  Object.keys(ABS).forEach(function(w){ delete NIDS[w]; }); nodes=nodes.filter(function(n){ return !ABS[n.id]; });
  window.__uniFeAbsorbed=Object.keys(ABS).length;
}
links=links.filter(function(l){ return NIDS[l.source]&&NIDS[l.target]&&l.source!==l.target; });
/* TYPES start OFF (the Functions precedent): fe-type pieces + every wire touching one are held back in
   _FETYPES/_FETYPELINKS; toggleTypes(on) seeds them in (layout.js). The field boots at pieces-that-run. */
var _FETYPES=[], _FETYPELINKS=[];
if(_FE){
  nodes.forEach(function(n){ if(n.fe && n.kind==="type"){ n.__ty=true; _FETYPES.push(n); } });
  if(_FETYPES.length){ var _TY={}; _FETYPES.forEach(function(n){ _TY[n.id]=1; delete NIDS[n.id]; });
    nodes=nodes.filter(function(n){ return !n.__ty; });
    _FETYPELINKS=links.filter(function(l){ return _TY[l.source]||_TY[l.target]; }); _FETYPELINKS.forEach(function(l){ l.__ty=true; });
    links=links.filter(function(l){ return !l.__ty; }); }
}

/* in-degree → fanin; payload from the target's real resp field-count; enrich w/proven/payload. */
links.forEach(function(l){ var t=NIDS[l.target]; if(t) t.m.fanin++; });
links.forEach(function(l){ var m=LINKMETA[l.rel]||{w:2,pv:1};
  l.w=m.w; l.proven=!!m.pv;
  var tgt=NIDS[l.target], tp=(tgt&&tgt.det&&tgt.det.payload&&tgt.det.payload.n)||0;
  l.payload=tp; });   // REAL response-schema field-count only (0 → no shuttle, no payload row); no invented per-kind constant

/* derived m flags — spike-identical (large = oversized proxy · flags → red satellite ring). */
nodes.forEach(function(n){ var m=n.m;
  m.large=(m.behind||0)>=15||(m.fanin||0)>=15; m.hot=false;
  m.flags=(m.god?1:0)+(m.large?1:0)+(m.hot?1:0); });

var ORIG_M={}; nodes.forEach(function(n){ ORIG_M[n.id]=Object.assign({},n.m); });
var ORIG_L=links.map(function(l){ return {w:l.w,payload:l.payload,proven:l.proven}; });

var MAXB=Math.max.apply(null,nodes.map(function(n){return n.m.behind||0;}))||1,
    MAXD=Math.max.apply(null,nodes.map(function(n){return n.m.depth||0;}))||1,
    MAXF=Math.max.apply(null,nodes.map(function(n){return n.m.fanin||0;}))||1,
    MAXT=Math.max.apply(null,nodes.map(function(n){return n.m.tests||0;}))||1,
    MAXW=Math.max.apply(null,links.map(function(l){return l.w||0;}))||1,
    MAXPL=Math.max.apply(null,links.map(function(l){return l.payload||0;}))||1,
    MAXCOLS=Math.max.apply(null,nodes.map(function(n){return n.m.cols||0;}))||1;
