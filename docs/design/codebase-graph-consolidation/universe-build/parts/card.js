  /* ══ live card helpers — read the real per-node c4 dossier (det) ══ */
  var STATE_ICO={pass:"test",fail:"alert",skip:"skip",unknown:"info"}, STATE_LBL={pass:"passing",fail:"failing",skip:"skipped",unknown:"state unclaimed"};
  function testCredit(c){ var st=c.state||"unknown", label=/^C\d/.test(c.cid||"")?c.cid:(c.name||c.cid||"?");
    return E("span",{class:"pchip st-"+st, title:(STATE_LBL[st]||st)+(c.name?" · "+c.name:"")}, icoEl(STATE_ICO[st]||"test"), label); }
  function fileCredit(f){ return E("span",{class:"pchip filecov", title:"file-coverage — a test file reaches this element but names no case (the honest weaker signal)"}, icoEl("file"), f.name); }
  /* Tests, grouped by corpus, tri-state from det.cases[].state + det.case_files file-coverage. Reuses tabbed(). */
  function testsSec(det){ var cases=det.cases||[], files=det.case_files||[], moreN=det.cases_more||0;
    if(!cases.length && !files.length) return E("div",{class:"sec"}, sechd("test","Tests"), E("div",{style:"font-size:12px;color:var(--muted)"}, "— no cases claimed yet"));
    var byc={}, filc={};
    cases.forEach(function(c){ var k=c.corpus||"api"; (byc[k]=byc[k]||[]).push(c); });
    files.forEach(function(f){ var k=f.corpus||"api"; (filc[k]=filc[k]||[]).push(f); });
    var corp={}; Object.keys(byc).forEach(function(k){corp[k]=1;}); Object.keys(filc).forEach(function(k){corp[k]=1;});
    var okAll=cases.length>0 && cases.every(function(c){return c.state==="pass";});   // green badge only when EVERY case affirmatively passes
    var groups=Object.keys(corp).map(function(k){ var cs=byc[k]||[], fs=filc[k]||[];
      return G(k,"test", cs.length||fs.length, function(){ var w=E("div");
        cs.forEach(function(c){ w.append(testCredit(c)); });
        if(moreN && k===Object.keys(corp)[0]) w.append(E("span",{class:"more",style:"cursor:default"},"+"+moreN+" more"));
        if(fs.length){ w.append(E("div",{class:"sublbl",style:"margin-top:7px"}, icoEl("file"), "file-coverage · "+fs.length+" (reaches it, names no case)"));
          fs.forEach(function(f){ w.append(fileCredit(f)); }); }
        return w; }); });
    return tabbed("test","Tests", groups, {showCount:true, ok:okAll}); }
  /* Journeys — cross-entity test membership, live from det.test_journeys (field is j.entities). */
  function entHue(s){ var h=0; s=String(s||""); for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h%360; }
  /* faces = one per REAL entity the test spans (deduped, home marked). NOT synthetic component identities —
     the archmap carries the entity SET + a component COUNT (j.comp, shown on the row above), not per-component ids. */
  function journeyFaces(home, ents){ var seen={}, list=[];
    (ents||[]).forEach(function(e){ if(e&&!seen[e]){ seen[e]=1; list.push(e); } });
    var strip=E("div",{class:"jfaces",title:"the entities this test spans (real, from det.test_journeys.entities); the component COUNT is on the row above"});
    list.forEach(function(ent){ var hue=entHue(ent);
      strip.append(E("span",{class:"face"+(ent===home?" fhome":""),title:ent,style:"color:hsl("+hue+" 55% 62%)"}, icoEl("entity"))); });
    return strip; }
  function journeysSection(home, kind, det){ var journeys=det.test_journeys||[]; if(!journeys.length) return null;
    var entry=(kind==="endpoint"), moreN=det.test_journeys_more||0;
    var tip={icon:"info",cls:"info",text:"Cross-entity tests this element takes part in (criterion A — the test exercises more than one entity). Row 1 = the test, its corpus + component COUNT; row 2 = the ENTITIES it spans (a real SET, colored per entity). Live from det.test_journeys."};
    var body=E("div",{class:"jsec"}, E("div",{class:"jsub"}, icoEl("nav"), entry?"entry · a test starts here and travels out":"a stop · reached by a test that spans other entities"));
    journeys.forEach(function(j){ body.append(E("div",{class:"jmeta",title:"select this journey (navigation coming)"},
      E("span",{class:"jcid"+(/^C\d/.test(j.cid)?"":" noc")}, j.cid), E("span",{class:"corp"}, j.corpus), E("span",{class:"ncomp"}, (j.comp||0)+" comp")));
      body.append(journeyFaces(home, j.entities)); });
    return E("div",{class:"sec"}, sechd("journey","Journeys", journeys.length+(moreN?"+"+moreN:""), false, tip), body); }
  /* Payload — endpoint response contract field-count, live from det.payload {n,schema}. */
  function payloadSec(det){ var p=det.payload; if(!p) return null;
    return E("div",{class:"sec"}, sechd("down","Payload", p.n, false, {icon:"info",cls:"info",text:"The RESPONSE contract's field-count (det.payload — the resp schema). The cargo shuttle's size scales with it in the graph."}),
      E("div",{class:"sublbl"}, icoEl("table"), p.n+" field"+(p.n===1?"":"s")+" ferried · → "+p.schema+" (response)")); }
  /* live connections — grouped from the REAL edges this node touches (honest per-node, not toy). */
  function relLabel(rel, dir){ var O={touches:"touches", fk:"FK →", bridge:"fetches", calls:"calls", imports:"imports", resp:"returns", handler:"handler", consumes:"consumes", nests:"nests"},
      I={touches:"touched by", fk:"FK'd by", bridge:"fetched by", calls:"called by", imports:"imported by", resp:"returned to", handler:"handled from", consumes:"consumed by", nests:"nested in"};
    return (dir==="out"?O:I)[rel]||(rel+(dir==="out"?"":" (in)")); }
  var CONNICO={touches:"model", fk:"key", bridge:"down", calls:"merge", imports:"link", resp:"schema", consumes:"down", nests:"schema"};
  /* ── #1 · the Explorer expander — ONE reusable primitive. A list where a row can reveal its
     children indented one level (lazy, depth-capped) with a "+N more" count cap. Rows:
     {label, glyph, cls, meta, title, node, childrenFn}. node → click navigates; childrenFn → a twisty. ── */
  function _xRow(r, depth, maxD, cap){
    var row=E("div",{class:"xrow"});
    var kidSpecs=(r.childrenFn && depth<maxD) ? (r.childrenFn()||[]) : null;   // PEEK one level: only offer a twisty when there is genuinely something deeper (no empty "nothing deeper" arrows)
    var canX=!!(kidSpecs && kidSpecs.length);
    var tw=E("span",{class:canX?"xtw":"xtwsp"});
    var id=r.id||(r.node&&r.node.id)||null;
    var chip=E("span",{class:"pchip "+(r.cls||"fn")+(id?" xnav":""), title:r.title||r.label||""},
      r.glyph?icoEl(r.glyph):null, r.label, r.meta!=null?E("span",{class:"xmeta"},String(r.meta)):null);
    if(id && window.__uniHoverHL){                                        // SAME wiring as chipList: white-halo hover · trail title · __uniGoto click
      chip.style.cursor="pointer"; chip.title=(chip.title?chip.title+" · ":"")+"click to open (builds the 7-step trail)";
      chip.addEventListener("mouseenter",function(){ __uniHoverHL(id); });
      chip.addEventListener("mouseleave",function(){ __uniHoverHL(null); });
      chip.addEventListener("click",function(ev){ ev.stopPropagation(); if(window.__uniGoto) __uniGoto(id); }); }
    else if(r.node){ chip.onclick=function(e){ e.stopPropagation(); try{ _selNode(r.node); }catch(x){} }; }
    if(!canX && r.childrenFn && depth>=maxD){ var deeper=r.childrenFn()||[];   // at the depth cap: a "·" ONLY when the tree really continues (honest cap marker, never a dead arrow)
      if(deeper.length) chip.append(E("span",{class:"xdeep",title:deeper.length+" deeper — capped at this level"},"·")); }
    var head=E("div",{class:"xhead"}, tw, chip), kids=E("div",{class:"xkids",style:"display:none"}), built=false, open=false;
    if(canX){ tw.style.cursor="pointer"; head.classList.add("xhx"); tw.onclick=function(e){ e.stopPropagation(); open=!open;
        if(open && !built){ built=true; kids.append(_xList(kidSpecs, depth+1, maxD, cap)); }   // kidSpecs already computed by the peek
        kids.style.display=open?"":"none"; row.classList.toggle("xopen",open); }; }
    row.append(head, kids); return row; }
  function _xList(rows, depth, maxD, cap){ var box=E("div",{class:"xpl"+(depth?" xin":"")}), shown=Math.min(cap, rows.length);
    function paint(){ box.innerHTML="";
      rows.slice(0,shown).forEach(function(r){ box.append(_xRow(r, depth, maxD, cap)); });
      if(shown<rows.length){ var b=E("button",{class:"more xmore"},"+"+(rows.length-shown)+" more"); b.onclick=function(){ shown=rows.length; paint(); }; box.append(b); } }
    paint(); return box; }
  function expander(rows, opt){ opt=opt||{}; return _xList(rows||[], 0, opt.maxDepth!=null?opt.maxDepth:1, opt.cap||8); }
  /* connection rows — an item {t,id}; a resolved node expands to preview ITS OWN neighbours (one level) */
  function _neighborRows(node){ var rows=[], seen={};
    links.forEach(function(l){ var sc=lid(l.source), tg=lid(l.target), oid, dir;
      if(sc===node.id){ oid=tg; dir="out"; } else if(tg===node.id){ oid=sc; dir="in"; } else return;
      if(oid===node.id) return; var o=NIDS[oid], key=dir+"|"+l.rel+"|"+oid; if(seen[key]) return; seen[key]=1;
      rows.push({ label:o?o.label:oid, cls:chipCls(o?o.kind:"external"), glyph:o?o.kind:"external",
        meta:relLabel(l.rel,dir), title:relLabel(l.rel,dir)+(o?(" · "+o.kind):""), node:o||null }); });
    return rows; }
  function _connRows(items, kind){ return (items||[]).map(function(it){ var node=it.id?NIDS[it.id]:null;
    return { label:it.t, cls:chipCls(kind), glyph:kind, node:node,
      childrenFn: node ? function(){ return _neighborRows(node); } : null }; }); }
  /* Code-behind rows — flat callee NAMES (a derive_behind floor); a name that resolves to a LOADED
     function node expands into its own `calls` (the real tree, only where the data carries it) */
  function _fnByLabel(){ var m={}; nodes.forEach(function(n){ if(n.kind==="function" && !(n.label in m)) m[n.label]=n; }); return m; }
  function _callsRows(node, path){ path=path||{}; var rows=[], seen={};
    links.forEach(function(l){ if(l.rel!=="calls" || lid(l.source)!==node.id) return;
      var o=NIDS[lid(l.target)]; if(!o || o.id===node.id || seen[o.id] || path[o.id]) return; seen[o.id]=1;   // path[] prunes a calls cycle (A→B→A) from re-listing down one branch
      var np={}; for(var _k in path) np[_k]=1; np[node.id]=1;
      rows.push({ label:o.label, cls:"function", glyph:"function", node:o, childrenFn:function(){ return _callsRows(o, np); } }); });
    return rows; }
  function behindTree(n){ var b=n&&n.behind; if(!b||!b.fns) return null; var byLabel=_fnByLabel(), names=b.names||[];
    var rows=names.map(function(nm){ var node=byLabel[nm]||null;
      return { label:nm, cls:"function", glyph:"function", node:node, childrenFn: node?function(){ var np={}; np[node.id]=1; return _callsRows(node, np); }:null }; });
    var loaded=rows.some(function(r){ return r.node; });
    var body=E("div",null,
      E("div",{class:"sublbl"}, icoEl("function"), "reach "+b.depth+" · "+b.fns+" behind"+(loaded?" · expand a callee to walk its calls":" — turn Functions ON to walk the tree")),
      expander(rows, {cap:10, maxDepth:3}));
    return E("div",{class:"sec"}, sechd("layers","Code behind", b.fns, false,
      {icon:"info",cls:"info",text:"Callee names + count from derive_behind (a BFS floor; cross-file callees inferred by design). Where a callee is a LOADED function node, expand it to walk its own calls."}), body); }
  function liveConns(n){ var outs=[], ins=[];
    links.forEach(function(l){ var s=lid(l.source), t=lid(l.target); if(s===n.id) outs.push(l); if(t===n.id) ins.push(l); });
    function build(arr, dir){ var by={};
      arr.forEach(function(l){ var other=NIDS[dir==="out"?lid(l.target):lid(l.source)];
        var key=l.rel+"|"+dir+"|"+(other?other.kind:"ext"); if(!by[key]) by[key]={rel:l.rel, dir:dir, kind:other?other.kind:"external", items:[]};
        by[key].items.push(other?{t:other.label,id:other.id}:{t:(dir==="out"?lid(l.target):lid(l.source))}); });   // {t,id} → chip hover lights that node (white halo)
      return Object.keys(by).map(function(k){ var g=by[k];
        return G(relLabel(g.rel,g.dir), CONNICO[g.rel]||"link", g.items.length, (function(items,kind){ return function(){ return expander(_connRows(items, kind), {cap:6, maxDepth:1}); }; })(g.items, g.kind), g.rel==="fk"||g.rel==="touches"?"structural":"inferred"); }); }
    var groups=build(outs,"out").concat(build(ins,"in"));
    var _empty="— no edges captured";
    if(n.behind&&n.behind.fns) _empty="— no data edges captured · its behavior lives in the call tree ("+n.behind.fns+" fns, Code behind) — turn Functions ON to draw those wires";
    else if(n.kind==="web") _empty="— no edges captured · its fetches may be DYNAMIC (unmatchable templates — see Sources)";
    return conns("link","Connections", groups, {showCount:true, empty:_empty}); }
  function sigSec(det){ if(!det.gsig && !det.sig) return null; var s=det.sig||{};
    return E("div",{class:"sec"}, sechd("endpoint","Signature"),
      det.gsig?E("div",{class:"doc",style:"font-family:ui-monospace,Menlo,monospace;font-size:11px;word-break:break-word"}, det.gsig):null,
      (s.lines!=null)?kv("info","body",(s.async?"async · ":"")+s.lines+" lines · → "+(s.returns||"—")):null); }
  function normCols(n){ var det=n.det||{}, cols=det.cols||[];
    if(!cols.length && n.ids && n.ids.datatype) cols=n.ids.datatype.map(function(d){ return [d.n,d.t,""]; });
    return cols; }
  function normFks(det){ return (det.fks||[]).map(function(f){ return Array.isArray(f)?f:[f]; }); }
  function structureSec(n){ var det=n.det||{}, cols=normCols(n); if(!cols.length) return null;
    var moreN=det.cols_more||0, fks=normFks(det);
    return E("div",{class:"sec"}, sechd("table","Structure", cols.length+(moreN?"+"+moreN:"")), colsTable(cols, fks)); }
  function keysSec(det){ var uqs=det.uqs||[], fks=normFks(det); if(!uqs.length && !fks.length) return null;
    return E("div",{class:"sec"}, sechd("key","Keys"),
      kv("key","unique", uqs.length?uqs.join(", "):"—"),
      kv("key","foreign", fks.length?fks.map(function(f){return f[0]+(f[1]?(" → <code>"+f[1]+"</code>"):"");}).join(" · "):"—")); }
  function docSec(det, label){ if(!det.doc) return null; return E("div",{class:"sec"}, sechd("doc",label||"Docstring"), E("div",{class:"doc"}, det.doc)); }
  function fileRowSec(n){ var det=n.det||{}; if(!det.file) return null;
    return E("div",{class:"sec"}, sechd("file","Source"),
      kv("file","file", det.file+(det.flines?(":"+det.flines):"")),
      det.status?kv("info","status", det.status):null,
      (det.exported!=null)?kv("role","exported", det.exported?"yes":"no"):null,
      (n.table)?kv("table","table", n.table):null); }
  function usageN(n){ var u=(n.det&&n.det.usage); if(u) return (u.api||0)+(u.internal||0); return (n.m&&n.m.fanin)||0; }   // badge matches its own breakdown (det.usage when present, else graph in-degree)
  function usageBreak(n){ var u=(n.det&&n.det.usage)||null;
    if(u) return (u.api||0)+" api · "+(u.internal||0)+" internal caller(s)";
    if(n.kind==="web") return (n.sites||0)+" fetch site(s)";
    return ((n.m&&n.m.fanin)||0)+" element(s) depend on this"; }
  function identSec(n){ var fi=(n.m&&n.m.fanin)||0; return E("div",{class:"sec"}, sechd("info","Identity"),
    kv("entity","entity", n.ent), kv("layers","layer", n.K.layer),
    kv("merge","fan-in", fi+" caller"+(fi===1?"":"s")+" (graph in-degree)")); }

  var C={
    endpoint:function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      testsSec(det),
      journeysSection(n.ent,"endpoint",det),
      payloadSec(det),
      behindTree(n),
      identSec(n),
      sigSec(det),
      docSec(det),
      fileRowSec(n) ]; },
    "function":function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      behindTree(n),
      testsSec(det),
      identSec(n), sigSec(det), docSec(det), fileRowSec(n) ]; },
    model:function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      structureSec(n),
      keysSec(det),
      testsSec(det),
      journeysSection(n.ent,"model",det),
      docSec(det), fileRowSec(n) ]; },
    schema:function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      structureSec(n) || E("div",{class:"sec"}, sechd("table","Fields"), E("div",{style:"font-size:12px;color:var(--muted)"},"— shape not captured")),
      testsSec(det),
      journeysSection(n.ent,"schema",det),
      docSec(det), fileRowSec(n) ]; },
    web:function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      testsSec(det),
      docSec(det, "Note"),
      fileRowSec(n) || E("div",{class:"sec"}, sechd("file","Source"), kv("file","file", n.label)) ]; },
    external:function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      docSec(det, "Note") || E("div",{class:"sec"}, sechd("doc","Note"), E("div",{class:"doc"}, "An fk target referenced from another entity — double-click a wire to hop to its owner.")),
      fileRowSec(n) ]; },
    entity:function(n){ return [
      E("div",{class:"sec"}, sechd("entity","Entity"), E("div",{class:"doc"}, "The container the pieces live in — a translucent boundary, not an icon-node.")) ]; }
  };
  /* FRONTEND pieces (batch 48): ONE builder for component · hook · store · route · type · module — compiler-proven
     pieces (c4.fe). Frontend section = home (entity / shared bucket / candidate feature) · absorbed screen + fetch
     sites · a module's exports; then the shared identity + file:lines rows. Honest-empty: no tests/doc captured yet. */
  function feSec(n){ var d=n.det||{}, hk=(typeof FE_HOME!=="undefined"&&FE_HOME[n.ent])||null, rows=[];
    var _hl=(window.__uniEntLabel?__uniEntLabel(n.ent):n.ent);
    rows.push(kv("entity","home", _hl+(hk==="fe"?(" (frontend of "+((typeof FE_PAIR!=="undefined"&&FE_PAIR[n.ent])||"?")+")"):hk==="bucket"?" (shared frontend bucket)":hk==="candidate"?" (candidate entity — a feature the backend never modeled)":"")));
    if(n.screen) rows.push(kv("web","screen", (n.sites||0)+" fetch site(s) — absorbed "+n.screen.replace(/^web:/,"")));
    if(d.exports&&d.exports.length) rows.push(kv("function","exports", d.exports.slice(0,12).join(" · ")+(d.exports.length>12?" · +"+(d.exports.length-12):"")));
    rows.push(E("div",{class:"doc"}, KINDTIP[n.kind]||""));   // ONE meaning per kind — the Elements rows + the card share it
    return E.apply(null,[ "div",{class:"sec"}, sechd(n.kind==="type"?"schema":n.kind,"Frontend") ].concat(rows)); }
  function feBuilder(n){ var det=n.det||{}; return [
    usage(usageN(n), usageBreak(n)),
    liveConns(n),
    feSec(n),
    identSec(n), docSec(det), fileRowSec(n) ]; }
  ["component","hook","store","route","type","module"].forEach(function(k){ if(!C[k]) C[k]=feBuilder; });
  C.capsule=function(n){ var rows=[E("div",{class:"sec"}, sechd("layers","Capsule",(n.members||[]).length),
      E("div",{class:"doc"},"a folded AREA of "+(window.__uniEntLabel?__uniEntLabel(n.ent):n.ent)+" — "+(n.members||[]).length+" piece(s)"+((n.fixture||0)?(" · "+n.fixture+" showcase-data"):"")),
      kv("entity","area", n.area||n.sub||n.label))];
    var ks=n.kinds||{}; Object.keys(ks).sort().forEach(function(k){ rows.push(kv(k==="type"?"schema":k, k, String(ks[k]))); });
    var btn=E("button",{class:"more",style:"align-self:flex-start"},"Expand "+(window.__uniEntLabel?__uniEntLabel(n.ent):n.ent));
    btn.onclick=function(){ if(window.__uniCapExpand) __uniCapExpand(n.ent); };
    rows.push(E("div",{class:"sec"}, btn));
    return rows; };

  /* ══ PANEL HIERARCHY (batch 22): Everything → Entity → Cluster → Element, two-way nav.
     Every level shows its content + an Inside (below) and an Above section; Esc lands on Everything. ══ */
  function _phead(title, sub, glyph, col){ var c=col||"var(--accent)";
    document.getElementById("phead").innerHTML="<div class='ptitle'><div class='pname'>"+title+"</div>"
      +"<div class='ptype' style='color:"+c+"'>"+pico(glyph||"entity",null, col?col:undefined)+"<span>"+sub+"</span></div></div>"
      +"<button class='pmin' title='minimize' onclick=\"closePanel()\">›</button>";
    document.getElementById("prailname").textContent=title; }
  P.drill='<polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>';       // trailing DOWN-a-level marker
  P.up='<polyline points="14 9 9 4 4 9"/><path d="M20 20h-7a4 4 0 0 1-4-4V4"/>';             // trailing UP-a-level marker
  function coreLead(ent){ var c=(typeof CFG!=="undefined") ? ((ent&&window.__uniIsFeEnt&&__uniIsFeEnt(ent))?CFG.coreByFE:CFG.coreByBE) : null;   // the entity's OWN side core (frontend→coreByFE)
    return E("span",{class:"pki pcore",html:(window.__uniCoreIco?__uniCoreIco(c||"layer",13):"")}); }
  function dirIco(dir){ return dir?E("span",{class:"pdir "+dir},icoEl(dir==="down"?"drill":"up")):null; }
  function navRow(icon, label, meta, col, go, dir, coreEnt){
    var lead = col ? E("span",{class:"pdot",style:"background:"+col}) : (icon==="__core"?coreLead(coreEnt):icoEl(icon||"nav"));
    var r=E("div",{class:"pnav"}, lead, E("span",{class:"pnl"},label),
      meta!=null?E("span",{class:"pnm"},String(meta)):null, dirIco(dir));
    r.onclick=go; return r; }
  function elemRow(n, go){ var r=E("div",{class:"pnav"},
      E("span",{class:"pki",html:svgInline(n.kind,(n.K&&n.K.col)||"#9aa",13)}),
      E("span",{class:"pnl"},n.label||n.id), E("span",{class:"pnm"},n.kind), dirIco("down"));
    r.onclick=go; return r; }
  function kindCounts(list){ var by={}; list.forEach(function(n){ by[n.kind]=(by[n.kind]||0)+1; }); return by; }
  var KINDTIP={ endpoint:"an API route handler — one node per METHOD + path; the entity's outward door",
    capsule:"a FOLDED area of a big entity — its pieces are hidden inside, not gone; click to open",
    model:"a persisted data model — a database table the entity owns",
    schema:"a request/response shape — the API contract a payload travels in",
    web:"a frontend screen/hook — it fetches endpoints over the web bridge",
    external:"an FK target owned by ANOTHER entity — drawn here because a local model points at it",
    "function":"a code function from the levels feed — drawn only when Functions is ON",
    /* FRONTEND kinds (batch 48) — compiler-proven pieces from c4.fe */
    component:"a React component — its body holds JSX (compiler-proven); renders other components, calls hooks, reads stores",
    hook:"a `useX` function — the frontend's unit of reuse; a fetching hook is a SCREEN (its fetches bridge to endpoints)",
    store:"a state cylinder — create()/createContext()/atom() const, or a useXStore hook; read by components via useContext/useXStore",
    route:"a URL surface — the router config or a *Route component; renders the component tree it mounts",
    type:"a TS type/interface/enum — the frontend's schema-equivalent; held back at boot (Types toggle), wired by `typed`",
    module:"a plain TS module — ONE piece for the file's value exports (feature logic · lib · api client); called via fecall, imported as values" };
  function kindRow(k, count){ var K=(typeof KINDS!=="undefined"&&KINDS[k])||{};
    var r=E("div",{class:"pnav pstat"},
      E("span",{class:"pki",html:svgInline(k, K.col||"#9aa", 13)}),
      E("span",{class:"pnl"}, k), KINDTIP[k]?tipIcon({icon:"info",cls:"info",text:KINDTIP[k]}):null,
      E("span",{class:"pnm"},String(count)));
    return r; }
  function makeupSec(list, title, tip){ var by=kindCounts(list);
    var w=E("div",{class:"sec"}, sechd("info", title||"Elements", list.length, false,
      tip||{icon:"info",cls:"info",text:"What lives here, counted by KIND — the same glyphs the field draws. Hover a row for what the kind means."}));
    Object.keys(by).sort().forEach(function(k){ w.append(kindRow(k, by[k])); }); return w; }
  function srcRow(icon, label, val, tip){ return E("div",{class:"kv"},
    icon?icoEl(icon,"kico"):E("span",{style:"width:14px"}),
    E("span",{class:"k"}, label, tip?tipIcon({icon:"info",cls:"info",text:tip}):null),
    E("span",{class:"v",html:val})); }
  /* paged fn chips — a small preview, then a clickable wall: +30 at a time, show less resets */
  function fnChips(pool){ var wrap=E("div"), grid=E("div"), ctl=E("div",{class:"starctl"});
    var PREV=8, PAGE=30, shown=Math.min(PREV,pool.length);
    function chip(f){ return E("span",{class:"pchip fn", title:(f.det&&f.det.file)?f.det.file:f.id}, icoEl("function"), f.label); }
    function render(){ grid.innerHTML=""; pool.slice(0,shown).forEach(function(f){ grid.append(chip(f)); });
      ctl.innerHTML="";
      if(shown<pool.length){ var b=E("button",{class:"more"},"show "+Math.min(PAGE,pool.length-shown)+" more · "+(pool.length-shown)+" hidden");
        b.onclick=function(){ shown=Math.min(pool.length, shown+PAGE); render(); }; ctl.append(b); }
      if(shown>PREV){ var l=E("button",{class:"more"},"show less");
        l.onclick=function(){ shown=PREV; render(); }; ctl.append(l); } }
    render(); wrap.append(grid, ctl); return wrap; }
  function _fnPool(ent){ try{ if(typeof _buildFnData==="function" && (typeof _FNNODES==="undefined"||!_FNNODES||!_FNNODES.length)) _buildFnData(); }catch(e){}
    var p=(typeof _FNNODES!=="undefined"&&_FNNODES)?_FNNODES:[];
    return ent?p.filter(function(f){ return f.ent===ent; }):p; }
  /* the STARS section — what the graph is NOT drawing right now (hidden functions), honest-empty */
  function starsSec(ent){ var pool=_fnPool(ent), shown=(typeof _fnsOn!=="undefined")&&_fnsOn;
    var tip={icon:"info",cls:"info",text:"What the tables and the field do not show: code functions live in the levels feed but are drawn only when Functions is ON (config › Universe). Hover a chip for its source file."};
    var w=E("div",{class:"sec"}, sechd("sub","Stars — not drawn", pool.length||null, false, tip));
    if(!pool.length){ w.append(E("div",{class:"sublbl"}, icoEl("info"), "— no hidden functions here")); return w; }
    w.append(E("div",{class:"sublbl"}, icoEl("function"),
      pool.length+" function"+(pool.length===1?"":"s")+(shown?" — currently SHOWN in the graph":" held off the field — enable Functions to draw them")));
    w.append(fnChips(pool));
    return w; }
  function crossSec(ent){ var by={}, partners={};
    links.forEach(function(l){ var s=NIDS[lid(l.source)], t=NIDS[lid(l.target)]; if(!s||!t) return;
      if(s.ent===t.ent) return; if(s.ent!==ent && t.ent!==ent) return;
      by[l.rel]=(by[l.rel]||0)+1; partners[s.ent===ent?t.ent:s.ent]=1; });
    var rels=Object.keys(by).sort(); if(!rels.length) return null;
    var w=E("div",{class:"sec"}, sechd("link","Cross-entity", rels.reduce(function(s,k){return s+by[k];},0)));
    rels.forEach(function(k){ w.append(kv(null, k, String(by[k]))); });
    w.append(E("div",{class:"sublbl"}, icoEl("entity"), "with: "+Object.keys(partners).sort().join(" · ")));
    return w; }
  function _entsMap(){ var m={}; nodes.forEach(function(n){ if(n.ent) (m[n.ent]=m[n.ent]||[]).push(n); }); return m; }
  function _selNode(n){ SEL={kind:"node",data:n}; try{ showPanel(n); refreshEncSel(); if(window.__uniHLSelect) __uniHLSelect(n); }catch(e){} }
  function _hulls(ent, sub){ try{ window.__uniHullSel={ent:ent||null, sub:sub!=null?sub:null}; window.__uniApplyHullSel(); }catch(e){} }
  function panelAll(){ window.__uniPView={lvl:"all"}; _hulls(null,null);
    _phead("Everything","UNIVERSE","entity");
    var pb=document.getElementById("pbody"); pb.innerHTML="";
    var ents=_entsMap(), names=Object.keys(ents).sort();
    var ins=E("div",{class:"sec"}, sechd("entity","Entities", names.length, false,      // NAVIGABLE first — the ladder's next rungs lead the panel
      {icon:"info",cls:"info",text:"The universe's containers — click a row to open that entity's panel (the next level down)."}));
    names.forEach(function(e){ var capN=ents[e].reduce(function(a,n){ return a+(n.__cap?(n.members||[]).length:0); },0);
      ins.append(navRow(null, (window.__uniEntLabel?__uniEntLabel(e):e)+(capN?(" · "+capN+" folded"):""), ents[e].length, (typeof ENT!=="undefined"&&ENT[e])||"#888", function(){ panelEnt(e); }, "down")); });
    pb.append(ins);
    pb.append(makeupSec(nodes,"Elements"));
    pb.append(starsSec(null));
    var st=(window.GABE_C4&&window.GABE_C4.stats)||null;
    if(st){ var w=E("div",{class:"sec"}, sechd("down","Sources", null, false,
        {icon:"info",cls:"info",text:"The committed feeds this graph is drawn from — each row is one input and what it contributed."}));
      if(st.cross_touches!=null) w.append(srcRow("model","cross-entity touches", String(st.cross_touches),
        "models one entity references while ANOTHER documents them — resolved into the dotted touches wires between entities"));
      if(st.web){ var unm=Array.isArray(st.web.unmatched)?st.web.unmatched:[], unmN=Array.isArray(st.web.unmatched)?unm.length:(st.web.unmatched||0);
        w.append(srcRow("web","web bridge", (st.web.matched||0)+" fetches matched to endpoints · "+unmN+" unmatched"+(st.web.dynamic?(" · "+st.web.dynamic+" dynamic"):""),
          "every apiFetch call site in the frontend, matched to the endpoint it names — the dashed bridge wires. Unmatched = a fetch naming no declared endpoint (a coverage gap, listed below)."));
        if(unm.length) w.append(chipList(unm.map(function(u){ return u.m+" "+u.p; }), "web", "web", 3)); }
      if(st.graft) w.append(srcRow("link","graft wiring",
        st.graft.present===false?("absent — "+(st.graft.reason||"no index")):((st.graft.cross_calls||0)+" calls · "+(st.graft.cross_imports||0)+" imports"),
        "cross-entity call/import wires from the graft code index — inferred-by-design, a FLOOR never a census"));
      if(st.fe) w.append(srcRow("component","frontend arm",
        st.fe.present===false?("absent — "+(st.fe.reason||"no extractor")):((st.fe.pieces||0)+" pieces · "+(st.fe.edges||0)+" wires · "+(st.fe.screens_absorbed||0)+" screens absorbed · "+((st.fe.excluded||{}).stories||0)+" stories excluded"),
        "the frontend STRUCTURE — components · hooks · stores · routes · types · modules proven by the TypeScript compiler (the twin's own typescript), wired by renders / uses / typed / fecall / imports. Types start OFF (entity pane toggle)."));
      w.append(srcRow("layers","levels feed", window.GABE_LEVELS?"present — functions · communities · journeys":"absent",
        "the 2D levels-lab export: function nodes (the Stars), community clusters, journey walks"));
      pb.append(w); }
    pb.append(E("div",{class:"sec"}, sechd("nav","Above"), E("div",{class:"sublbl"}, icoEl("info"), "— the top level (Esc returns here)")));
    openPanel(); }
  function panelEnt(ent){ window.__uniPView={lvl:"ent",ent:ent}; _hulls(ent,null);
    var mem=nodes.filter(function(n){ return n.ent===ent; });
    _phead((window.__uniEntLabel?__uniEntLabel(ent):ent),"ENTITY","entity",(typeof ENT!=="undefined"&&ENT[ent])||null);
    var pb=document.getElementById("pbody"); pb.innerHTML="";
    pb.append(makeupSec(mem));
    pb.append(starsSec(ent));
    var cx=crossSec(ent); if(cx) pb.append(cx);
    var subs={}; mem.forEach(function(n){ var k=n.sub||"—"; (subs[k]=subs[k]||[]).push(n); });
    var sk=Object.keys(subs).sort();
    var ins=E("div",{class:"sec"}, sechd("sub","Inside — clusters", sk.length, false,
      {icon:"info",cls:"info",text:"The entity's sub-clusters under the CURRENT core (config › Universe › Cluster core by). Click one to open its panel."}));
    sk.forEach(function(s){ ins.append(navRow("__core", s, subs[s].length, null, function(){ panelClu(ent, s); }, "down", ent)); });
    pb.append(ins);
    var ab=E("div",{class:"sec"}, sechd("nav","Above"));
    ab.append(navRow("entity","everything", null, null, function(){ panelAll(); }, "up"));
    pb.append(ab);
    openPanel(); }
  function panelClu(ent, sub){ window.__uniPView={lvl:"clu",ent:ent,sub:sub}; _hulls(ent,sub);
    var mem=nodes.filter(function(n){ return n.ent===ent && (n.sub||"—")===sub; });
    _phead(sub,"CLUSTER · "+(window.__uniEntLabel?__uniEntLabel(ent):ent),"sub",(typeof ENT!=="undefined"&&ENT[ent])||null);
    var pb=document.getElementById("pbody"); pb.innerHTML="";
    pb.append(makeupSec(mem));
    var ins=E("div",{class:"sec"}, sechd("bubble","Inside — elements", mem.length, false,
      {icon:"info",cls:"info",text:"Everything in this cluster. Click an element to open its card (the graph selects it too)."}));
    mem.slice().sort(function(a,b){ return (a.kind+a.label).localeCompare(b.kind+b.label); })
      .forEach(function(n){ ins.append(elemRow(n, function(){ _selNode(n); })); });
    pb.append(ins);
    var ab=E("div",{class:"sec"}, sechd("nav","Above"));
    ab.append(navRow(null,"entity · "+ent, null, (typeof ENT!=="undefined"&&ENT[ent])||"#888", function(){ panelEnt(ent); }, "up"));
    ab.append(navRow("entity","everything", null, null, function(){ panelAll(); }, "up"));
    pb.append(ab);
    openPanel(); }
  /* the element card's way BACK UP — appended to every kind card below */
  function aboveSec(n){ if(!n||!n.ent) return null;
    var w=E("div",{class:"sec"}, sechd("nav","Above"));
    if(n.sub) w.append(navRow("__core","cluster · "+n.sub, null, null, function(){ panelClu(n.ent, n.sub||"—"); }, "up", n.ent));
    w.append(navRow(null,"entity · "+(window.__uniEntLabel?__uniEntLabel(n.ent):n.ent), null, (typeof ENT!=="undefined"&&ENT[n.ent])||"#888", function(){ panelEnt(n.ent); }, "up"));
    w.append(navRow("entity","everything", null, null, function(){ panelAll(); }, "up"));
    return w; }
  /* FLEET ASSETS (operator): the ships & zones drawn around this planet, as a panel readout — read from
     the SAME per-node metrics nodeFleet() renders (tests→defence · god/untested→attack · large/behind→conflict
     · fan-in→satellites). Honest-empty: a node with no assets gets no section. */
  function assetsSec(n){ if(!n) return null; var m=n.m||{},
      tests=Math.round(+(m.tests)||0), behind=Math.round(+(m.behind)||0), fanin=Math.round(+(m.fanin)||0),
      untested=(tests===0 && n.kind!=="entity"), god=!!m.god, shock=!!(m.large||behind>=15);
    var rows=[];
    if(tests>0) rows.push(kv("shield","defence", tests+" test"+(tests>1?"s":"")+" · a green ship each"));
    if(god||untested){ var atk=[]; if(god) atk.push("god-object"); if(untested) atk.push("untested (raiders)"); rows.push(kv("swords","attack", atk.join(" · "))); }
    if(shock) rows.push(kv("burst","conflict", "shock · "+(m.large?"large surface":(behind+" behind"))));
    if(fanin>0) rows.push(kv("target","satellites", fanin+" caller"+(fanin>1?"s":"")+" (fan-in)"));
    if(!rows.length) return null;
    return E("div",{class:"sec"}, sechd("layers","Fleet assets"), rows, E("div",{class:"sublbl",style:"margin-top:4px"}, "the ships & zones drawn around this planet")); }
  Object.keys(C).forEach(function(k){ var base=C[k];
    C[k]=function(n){ var out=base(n)||[]; var _as=assetsSec(n); if(_as) out.push(_as); out.push(aboveSec(n)); return out; }; });
  window.__uniPanelAll=panelAll; window.__uniPanelEnt=panelEnt; window.__uniPanelClu=panelClu; window.__uniSelNode=_selNode;   // batch 49: the search selects nodes through the ONE select path
