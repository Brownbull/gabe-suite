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
  function relLabel(rel, dir){ var O={touches:"touches", fk:"FK →", bridge:"fetches", calls:"calls", imports:"imports", resp:"returns", handler:"handler"},
      I={touches:"touched by", fk:"FK'd by", bridge:"fetched by", calls:"called by", imports:"imported by", resp:"returned to", handler:"handled from"};
    return (dir==="out"?O:I)[rel]||(rel+(dir==="out"?"":" (in)")); }
  var CONNICO={touches:"model", fk:"key", bridge:"down", calls:"merge", imports:"link", resp:"schema"};
  function liveConns(n){ var outs=[], ins=[];
    links.forEach(function(l){ var s=lid(l.source), t=lid(l.target); if(s===n.id) outs.push(l); if(t===n.id) ins.push(l); });
    function build(arr, dir){ var by={};
      arr.forEach(function(l){ var other=NIDS[dir==="out"?lid(l.target):lid(l.source)];
        var key=l.rel+"|"+dir+"|"+(other?other.kind:"ext"); if(!by[key]) by[key]={rel:l.rel, dir:dir, kind:other?other.kind:"external", items:[]};
        by[key].items.push(other?other.label:(dir==="out"?lid(l.target):lid(l.source))); });
      return Object.keys(by).map(function(k){ var g=by[k];
        return G(relLabel(g.rel,g.dir), CONNICO[g.rel]||"link", g.items.length, function(){ return chipList(g.items, chipCls(g.kind), g.kind); }, g.rel==="fk"||g.rel==="touches"?"structural":"inferred"); }); }
    var groups=build(outs,"out").concat(build(ins,"in"));
    return conns("link","Connections", groups, {showCount:true, empty:"— no edges captured"}); }
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
      (n.behind&&n.behind.fns)?behind(n.behind, n.behind.names||[]):null,
      identSec(n),
      sigSec(det),
      docSec(det),
      fileRowSec(n) ]; },
    "function":function(n){ var det=n.det||{}; return [
      usage(usageN(n), usageBreak(n)),
      liveConns(n),
      (n.behind&&n.behind.fns)?behind(n.behind, n.behind.names||[]):null,
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
