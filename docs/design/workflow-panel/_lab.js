/* ═══ KIND LAB runtime — one kind at a time ═══════════════════════════════════
   Reads window.LABFN (generated from the feed) and, when present, window.LABDIMS
   (the ranked "what matters and why" analysis) + window.LABLAYOUTS (the layout
   proposals). Builds the lab element in the console's own record shape so the
   shared builders (slotEl · spineEl · cargoEl · evidenceEl · planetEl ·
   commandEl) render it unchanged, then draws the document above the dock. */

var LAB = { kind:"function", layout:"g", pct:33 };

/* ── 1 · the lab element, in the console's record shape ─────────────────────
   Every row is built from LABFN; a fact the feed lacks is an honest-empty row
   in the feed's own words, never dropped. */
function labElement(){
  var F = window.LABFN, sig = F.sig || {}, acc = F.access || {}, beh = F.behind || {};
  var reads = (acc.ops || []).filter(function(o){ return o.rw === "r"; });
  var writes = (acc.ops || []).filter(function(o){ return o.rw === "w"; });
  var ser = acc.serializes || [];
  var eps = F.callers.map(function(c){ return c.endpoint || c.fn; });
  var callerConf = F.callers.every(function(c){ return c.conf === "extracted"; }) ? "all extracted" : "mixed confidence";
  var slots = {
    ident:[ r("name", F.name),
            r("kind", "function · role " + F.role + " · layer " + F.layer + (F.handler ? " · handler" : "")),
            r("entity", F.slug + " — the fn_node's own slug"),
            r("file", F.file + (F.flines ? ":" + F.flines + " lines" : "")) ],
    op:[ r("sig", (sig.async ? "async · " : "") + (F.flines ? F.flines + " lines · " : "") + "→ " + (sig.returns || "—")
                  + " — detail['fn:" + F.slug + "|" + F.name + "'], which the station's mint drops", sig.returns ? "ok" : "none"),
         r("fn", F.name + (F.god ? " — god-flagged (hub.god true)" : ""), F.god ? "warn" : ""),
         r("delivery", F.schemas.returns.length ? "returns " + F.schemas.returns.map(function(s){ return s.replace(/^schema:/, ""); }).join(" · ") + " (schema_edges)" : "— returns no schema", F.schemas.returns.length ? "" : "none"),
         r("doc", F.doc || "— no docstring in detail (200 of 292 functions carry one)", F.doc ? "" : "none") ],
    in:[ r("caller", F.callers.length + " callers, " + callerConf + " — " + eps.join(" · "), F.callers.length ? "ok" : "none"),
         r("gate", (function(){ var g = {}; F.gates_via_callers.forEach(function(x){ x.gates.forEach(function(n){ g[n] = (g[n] || 0) + 1; }); }); var k = Object.keys(g); return k.length ? k.map(function(n){ return n + " on " + g[n] + "/" + F.callers.length + " doors"; }).join(" · ") + " — the gate stands on the doors" : "— no gate on any door"; })(), F.gates_via_callers.some(function(x){ return x.gates.length; }) ? "ok" : "dim"),
         r("payload", "— arguments are not captured for functions", "dim"),
         r("dep", F.callees.length + " callee out — " + F.callees.map(function(c){ return c.fn + " (" + c.conf + (c.crosses ? ", crosses into " + c.entity : "") + ")"; }).join(" · "), F.callees.length ? "" : "none") ],
    store:[ r("read", reads.length ? reads.slice(0, 3).map(function(o){ return o.table; }).join(" · ") : "— reads no table", reads.length ? "ok" : "none"),
            r("read", reads.length > 3 ? reads.slice(3).map(function(o){ return o.table; }).join(" · ") : "— (no more)", reads.length > 3 ? "ok" : "dim"),
            r("commits", acc.commits ? "yes — a durable write boundary" : "no — access.commits is false: this one only reads", acc.commits ? "warn" : "dim"),
            r("col", "— a function has no columns of its own", "dim") ],
    out:[ r("resp", F.schemas.returns.length ? F.schemas.returns[0] + " — 1 returns wire · " + F.schemas.uses.length + " uses wires" : "— returns nothing", F.schemas.returns.length ? "" : "none"),
          r("write", writes.length ? writes.map(function(o){ return o.table; }).join(" · ") : "— no write ops: " + reads.length + " reads, commits " + String(!!acc.commits), writes.length ? "warn" : "dim"),
          r("touch", ser.length ? "serialises " + ser.length + " blocks — " + ser.slice(0, 3).map(function(b){ return b.cls + ":" + b.line; }).join(" · ") + (ser.length > 3 ? " · +" + (ser.length - 3) : "") : "— serialises nothing", ser.length ? "" : "none"),
          r("dispatch", "— nothing enqueued", "none") ],
    ev:[ r("test", "— not measured directly · " + F.via_callers.cases + " cases reach it through its " + F.callers.length + " callers", "unmeas"),
         r("journey", "— none direct · " + F.via_callers.journeys + " via callers · curated: " + (F.via_callers.curated_initial_setup ? "Initial setup names GET /settings" : "none"), "dim"),
         r("flag", F.god ? "god — hub.god (" + F.feed.gods + " of " + F.feed.fn_nodes + ")" : "— no flags", F.god ? "warn" : "none") ],
    place:[ r("conn", (F.in_degree + F.out_degree + F.schemas.returns.length + F.schemas.uses.length + reads.length + writes.length) + " wires when Functions is ON — "
                      + F.in_degree + " calls in · " + F.out_degree + " call out · " + reads.length + " fnreads · " + (F.schemas.returns.length + F.schemas.uses.length) + " schema"),
            r("reach", beh.fns ? beh.fns + " fns behind · depth " + beh.depth : "— no call tree behind it", beh.fns ? "" : "none"),
            r("home", F.slug + " (claim) · derived → " + (F.model_homes.derived || "—") + " · " + (F.homing ? "homing " + F.homing.verdict : "not weighed (" + F.feedwide.homing + " were)"), F.model_homes.derived ? "warn" : "dim"),
            r("above", "cluster · " + F.slug + " → everything") ]
  };
  return { id:"lab-fn", kind:"function", entity:F.slug, label:F.name, short:F.name, slots:slots,
           note:"the lab's own record, built from LABFN — the feed's truth, not the console's demo row" };
}

function labRegister(e){
  var F = window.LABFN;
  ELEMENTS.push(e);
  BADGE[e.id] = (F.role || "").toUpperCase();
  VITALS[e.id] = {
    reach:   vit(F.behind ? F.behind.fns : 0, VMAX.reach, F.behind && F.behind.fns ? "ok" : "zero", F.behind ? F.behind.fns + " fns · depth " + F.behind.depth : "—"),
    surface: vit(0, VMAX.surface, "na", "—", "no columns · " + ((F.access||{}).serializes||[]).length + " blocks in OUT"),
    tested:  vit(0, VMAX.tested, "unmeas", "not measured"),
    fanin:   vit(F.in_degree, VMAX.fanin, "ok", F.in_degree + " (fn_edges in-degree)", "hub.usage says " + F.hub.usage),
  };
  CMDSTATE[e.id] = {
    callers:["lit", F.in_degree, F.in_degree + " drawn call wires in — " + F.callers.map(function(c){ return c.endpoint || c.fn; }).join(" · ")],
    behind: ["lit", F.behind ? F.behind.fns : 0, F.behind ? F.behind.fns + " fns · depth " + F.behind.depth : "none"],
    tables: ["lit", ((F.access||{}).ops||[]).length, ((F.access||{}).ops||[]).length + " reads — access.ops, which the function mint copies"],
    screens:["lit", F.screens_via_callers.bridges, F.screens_via_callers.bridges + " bridges from " + F.screens_via_callers.screens.length + " hooks reach it through its doors — transitive, not its own"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
}

/* ── 2 · the measured half of every dimension — value · state · feed-wide ───
   Judgement (why · tier · slot) comes from LABDIMS when the analysis has run;
   the numbers never do. */
function labMeasured(){
  var F = window.LABFN, sig = F.sig || {}, acc = F.access || {}, beh = F.behind || {};
  var reads = (acc.ops || []).filter(function(o){ return o.rw === "r"; }), writes = (acc.ops || []).filter(function(o){ return o.rw === "w"; });
  /* STATIC = readable from the element's own record with no other element in
     existence. DERIVED = computed from its relations — it moves when THEY move.
     A derived value stored on the record (behind · hub.usage · d2w are products
     of the walk) is still derived. INFLUENCE = how many other elements the value
     is coupled to for THIS example; a static field couples to none. */
  function d(key, label, value, state, src, infl, inote){
    var derived = /edges|c4|pieces|homing|models|sim\.|commits|entities\[|behind|hub|d2w|callers|doors|walk|census|use_edges/.test(src) || key === "conn";
    return { key:key, label:label, value:value, state:state, src:src, feedwide:F.feedwide[key] || "—",
             cls: derived ? "derived" : "static", influence: infl || 0, inote: inote || (derived ? "" : "its own record — couples to nothing") };
  }
  return [
    d("name", "name", F.name, "live", "fn_nodes[].name"),
    d("file", "file", F.file, "live", "detail.file"),
    d("lines", "lines", F.flines ? F.flines + " lines" : "—", F.flines ? "live" : "empty", "detail.flines"),
    d("sig", "signature", (sig.async ? "async" : "sync") + " → " + (sig.returns || "—"), sig.returns ? "live" : "empty", "detail.sig"),
    d("doc", "docstring", F.doc || "— none", F.doc ? "live" : "empty", "detail.doc"),
    d("role", "role", F.role, "live", "fn_nodes[].role"),
    d("layer", "layer", F.layer, "live", "fn_nodes[].layer"),
    d("handler", "handler", F.handler ? "yes" : "no — an internal function", "live", "fn_nodes[].handler"),
    d("god", "god flag", F.god ? "yes — " + F.feed.gods + " of " + F.feed.fn_nodes : "no", "live", "fn_nodes[].god"),
    d("entity", "entity", F.slug, "live", "fn_nodes[].slug"),
    d("callers", "callers", F.in_degree + " — " + F.callers.map(function(c){ return c.endpoint || c.fn; }).join(" · "), F.in_degree ? "live" : "empty", "fn_edges t=id", F.in_degree, F.in_degree + " callers, each a door"),
    d("callees", "callees", F.out_degree + " — " + F.callees.map(function(c){ return c.fn + " (" + c.conf + ")"; }).join(" · "), F.out_degree ? "live" : "empty", "fn_edges s=id", F.out_degree, F.out_degree + " callee, crossing into " + F.callees.map(function(c){ return c.entity; }).join("/")),
    d("behind", "behind", beh.fns ? beh.fns + " fns · depth " + beh.depth : "—", beh.fns ? "live" : "empty", "fn_nodes[].behind", beh.fns || 0, beh.fns + " functions under the call"),
    d("tables", "tables", reads.length + " read · " + writes.length + " written", (acc.ops||[]).length ? "live" : "empty", "fn_nodes[].access.ops"),
    d("commits", "commits", acc.commits ? "yes" : "no", "live", "fn_nodes[].access.commits"),
    d("serializes", "serialises", ((acc.serializes||[]).length || "—") + (acc.serializes && acc.serializes.length ? " blocks" : ""), (acc.serializes||[]).length ? "live" : "empty", "fn_nodes[].access.serializes"),
    d("schemas", "schemas", "returns " + F.schemas.returns.length + " · uses " + F.schemas.uses.length, (F.schemas.returns.length + F.schemas.uses.length) ? "live" : "empty", "schema_edges", F.schemas.returns.length + F.schemas.uses.length, "schema pieces on the wire"),
    d("uses", "cross-entity", F.cross_entities.join(" · ") || "—", F.cross_entities.length ? "live" : "empty", "use_edges.ts + fn_edges.ds", F.use_edges.length, F.use_edges.length + " use_edges into " + F.cross_entities.length + " entities"),
    d("d2w", "hops to a write", F.d2w != null ? String(F.d2w) : "— not computed for this function (absent on 74 accessors)", F.d2w != null ? "live" : "empty", "fn_nodes[].d2w (graft walk)", 0, "a walk product; absent here"),
    d("sinks", "sinks", F.sinks ? JSON.stringify(F.sinks) : "— none", F.sinks ? "live" : "empty", "fn_nodes[].sinks"),
    d("flags", "flags", F.flags ? JSON.stringify(F.flags) : "— none", F.flags ? "live" : "empty", "fn_nodes[].flags"),
    d("tests", "tests", "— not measured directly · " + F.via_callers.cases + " distinct cases via " + F.callers.length + " callers", "unmeasured", "detail.cases (absent) · callers' det.cases", F.via_callers.cases, F.via_callers.cases + " cases through " + F.callers.length + " callers"),
    d("journeys", "journeys", "— none direct · " + F.via_callers.journeys + " via callers · curated: " + (F.via_callers.curated_initial_setup ? "Initial setup" : "none"), "unmeasured", "callers' det.test_journeys · workflows.js", F.via_callers.journeys, F.via_callers.journeys + " journeys through the callers"),
    d("hub_usage", "hub.usage", F.hub.usage + " (files referencing, self once) vs " + F.in_degree + " callers", "live", "fn_nodes[].hub.usage (walk)", F.hub.usage, "counts files, not callers"),
    d("lang", "lang", F.lang, "live", "fn_nodes[].lang"),
    d("conn", "wires", (F.in_degree + F.out_degree + F.schemas.returns.length + F.schemas.uses.length + ((F.access.ops||[]).length)) + " when Functions is ON", "live", "fn_edges · schema_edges · access.ops", F.in_degree + F.out_degree + F.schemas.returns.length + F.schemas.uses.length + ((F.access.ops||[]).length), "every drawn wire"),
    d("xreach", "cross-entity uses", F.use_edges.length + " use_edges → " + F.cross_entities.join(" · "), F.use_edges.length ? "live" : "empty", "use_edges", F.use_edges.length, F.cross_entities.length + " entities touched"),
    d("externals", "externals", "— none read for functions", "absent", "—"),
    d("depends", "depends · dispatches", (F.callers.filter(function(c){ return c.rel !== "calls"; }).length + F.callees.filter(function(c){ return c.rel !== "calls"; }).length) ? "some" : "— all " + (F.in_degree + F.out_degree) + " edges are calls", "live", "fn_edges[].rel", 0, "no depends/dispatches edge here"),
    d("screens", "screens via callers", F.screens_via_callers.bridges + " bridges · " + F.screens_via_callers.screens.length + " hooks: " + F.screens_via_callers.screens.map(function(x){ return x.split("/").pop(); }).join(" · "), F.screens_via_callers.bridges ? "live" : "empty", "c4 cross_edges kind=bridge → callers", F.screens_via_callers.bridges, F.screens_via_callers.screens.length + " hooks over " + F.screens_via_callers.bridges + " bridges"),
    d("gates", "gates via callers", (function(){ var g = {}; F.gates_via_callers.forEach(function(x){ x.gates.forEach(function(n){ g[n] = (g[n] || 0) + 1; }); }); return Object.keys(g).map(function(n){ return n + " on " + g[n] + " of " + F.callers.length + " doors"; }).join(" · ") || "— none"; })(), F.gates_via_callers.some(function(x){ return x.gates.length; }) ? "live" : "empty", "c4 endpoints[].middleware gate:true", F.gates_via_callers.filter(function(x){ return x.gates.length; }).length, "gated doors"),
    d("hidden", "hidden in the walk", F.hidden.behind_hidden.length ? F.hidden.behind_hidden.join(" · ") + " — not drawn (" + F.hidden.entity + " hidden in " + F.slug + ", " + F.hidden.feed + " feed-wide)" : "— every behind name is drawn", F.hidden.behind_hidden.length ? "live" : "empty", "entities[].counts.hidden_fns · behind.names", F.hidden.behind_hidden.length, "names the walk did not draw"),
    d("community", "community · use-case", (F.communities.length || F.usecases.length) ? F.communities.concat(F.usecases).join(" · ") : "— clustered nowhere (both list handlers only)", (F.communities.length || F.usecases.length) ? "live" : "empty", "pieces.<slug>.communities · usecases", F.communities.length + F.usecases.length, "clusters it belongs to"),
    d("inflight", "in flight", F.inflight ? (F.inflight.touches_fn || F.inflight.touches_file ? "YES — commit " + F.inflight.commit : "no — a change is in flight (" + F.inflight.commit + ", " + F.inflight.touched_n + " touched) and this is not in it") : "— sim.data.js is null", F.inflight ? "live" : "empty", "sim.data.js touched[]", 0, "not in the touched set"),
    d("time", "last change", "— no per-element date in the feed; commits.js carries touched ids", "unmeasured", "commits.js", 0, "no per-element date"),
    d("model", "entity model", F.model_homes.derived ? "derived → " + F.model_homes.derived + " · seeded/proposed keep the claim" : "— keeps the claim in every view", F.model_homes.derived ? "live" : "empty", "levels.models.homes[view][id]", F.model_homes.derived ? 1 : 0, "re-homed by one table's write majority"),
    d("homing", "homing", F.homing ? JSON.stringify(F.homing) : "— not weighed (" + F.feedwide.homing + " were)", F.homing ? "live" : "empty", "homing.pieces[id]", 0, "not weighed"),
    d("pressure", "pressure", "— empty in this example", "unmeasured", "levels.pressure (walk)", 0, "a placeholder"),
  ];
}

/* ── 3 · the document ───────────────────────────────────────────────────────── */
function esc(x){ return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function ico(k, size){ return (typeof rowSvg === "function") ? rowSvg(k, size || 11) : ""; }
function secEl(icon, title, count){
  var s = el("div", { class:"sec" });
  s.appendChild(el("div", { class:"sh" }, [
    el("span", { class:"si", html:(typeof hudSvg === "function") ? hudSvg(icon, 13) : "" }),
    el("span", { class:"st", text:title }),
    el("span", { class:"sn", text:count != null ? String(count) : "" })
  ]));
  var b = el("div", { class:"sb" }); s.appendChild(b); s.__body = b; return s;
}
function factRow(key, label, valueNode, state, src){
  var row = el("div", { class:"fr state-" + state });
  row.appendChild(el("span", { class:"fk", html:ico(key) + "<span>" + label + "</span>" }));
  var fv = el("span", { class:"fv" });
  if (typeof valueNode === "string") fv.textContent = valueNode; else fv.appendChild(valueNode);
  row.appendChild(fv);
  row.appendChild(el("span", { class:"src", html:src + "<b class=\"" + state + "\">" + state + "</b>" }));
  return row;
}
function chips(items, cls){
  var w = el("span", { class:"chips" });
  items.forEach(function(t){ w.appendChild(el("span", { class:"chip " + (cls || ""), text:t })); });
  return w;
}
function factGroup(icon, title, rows){
  var g = el("div", { class:"fg" });
  g.appendChild(el("div", { class:"fh", html:(typeof hudSvg === "function" ? hudSvg(icon, 12) : "") + "<span>" + title + "</span><span class=\"fc\">" + rows.length + "</span>" }));
  rows.forEach(function(x){ g.appendChild(x); });
  return g;
}

/* a section folds; the header keeps its count so a folded section still says what it holds */
function foldable(sec, open){
  sec.classList.toggle("folded", !open);
  var h = sec.querySelector(".sh"); h.style.cursor = "pointer";
  h.appendChild(el("span", { class:"sf", html:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' }));
  h.onclick = function(){ sec.classList.toggle("folded"); };
  return sec;
}
var SLOTORD = ["IDENTITY","OPERATION","IN","STORE","OUT","EVIDENCE","PLACE"];
var KEYICO = { lines:"file", serializes:"touch", uses:"home", tables:"read", callees:"dep", callers:"caller", behind:"reach", journeys:"journey", tests:"test", god:"flag", homing:"home", schemas:"resp", commits:"commits", d2w:"state", hub_usage:"caller", lang:"kind", externals:"api", depends:"dep", screens:"fetch", gates:"gate", hidden:"reach", community:"home", inflight:"state", time:"commits", xreach:"home", model:"entity", pressure:"via" };

function buildDoc(){
  var F = window.LABFN, host = document.getElementById("doc");
  host.innerHTML = "";
  var meas = labMeasured(), byKey = {}; meas.forEach(function(m){ byKey[m.key] = m; });
  var D = window.LABDIMS || null;
  var dims = D ? D.dims : meas.map(function(m){ return { key:m.key, label:m.label, tier:"context", slot:"PLACE", why:"", question:"", station_today:"" }; });

  /* ── THE FIELD MAP — every dim as a tile, in its slot, coloured by importance ── */
  var M = secEl("layers", "FIELD MAP", dims.length + " fields"); host.appendChild(M);
  M.__body.appendChild(el("div", { class:"maplegend", html:
    '<span><i class="t anchor"></i>anchor</span><span><i class="t core"></i>core</span><span><i class="t context"></i>context</span><span><i class="t press"></i>press</span><span><i class="t cut"></i>cut</span>'
    + '<span class="sep"></span><span><i class="s"></i>static — its own record</span><span><i class="d"></i>derived — moves when other elements move</span>'
    + '<span class="sep"></span><span><b class="n">n</b> influence — other elements the value is coupled to</span>' }));
  var map = el("div", { class:"fmap" });
  SLOTORD.forEach(function(sl){
    var colEl = el("div", { class:"fcol" });
    colEl.appendChild(el("div", { class:"fch", text:sl }));
    dims.filter(function(x){ return x.slot === sl; }).forEach(function(dm){
      var m = byKey[dm.key] || { cls:"static", influence:0, state:"absent", value:"—" };
      var t = el("div", { class:"ftile " + dm.tier + " " + m.cls + " st-" + m.state, "data-key":dm.key,
        title:(dm.label || dm.key) + " — " + dm.tier + " · " + m.cls + (m.influence ? " · influence " + m.influence : "") + "\n" + (dm.why || "") });
      t.appendChild(el("span", { class:"fi", html:ico(KEYICO[dm.key] || dm.key, 12) }));
      t.appendChild(el("span", { class:"fn", text:dm.key }));
      if (m.influence) t.appendChild(el("b", { class:"n", text:String(m.influence) }));
      t.onclick = function(){ var r = document.querySelector('table.dims tr[data-key="' + dm.key + '"]'); if (r){ r.scrollIntoView({ block:"center" }); r.classList.add("hit"); setTimeout(function(){ r.classList.remove("hit"); }, 1400); } };
      colEl.appendChild(t);
    });
    map.appendChild(colEl);
  });
  M.__body.appendChild(map);

  /* ── THE TABLE — full width; the why lives on hover ── */
  var B = secEl("layout", "THE FIELDS", dims.length); host.appendChild(B);
  var t = el("table", { class:"dims" });
  /* THE RE-CUT of the table (operator 2026-09-09): eleven columns became eight — rank+importance,
     kind+influence, tier+slot and state+value each share a cell; a PLAIN line per field (the legend
     reference's "in your words" column) sits beside the title; the prose columns read at the
     document size and NOTHING is truncated — the value and the station line wrap in full. The why
     stays on hover (the earlier "too many words" ruling). */
  t.appendChild(el("thead", { html:"<tr><th>#</th><th>field</th><th>in your words</th><th>kind · influence</th><th>tier · slot</th><th>this example</th><th>feed-wide</th><th>station today</th></tr>" }));
  var tb = el("tbody"), N = dims.length;
  dims.forEach(function(dm, i){
    var m = byKey[dm.key] || { value:"—", state:"absent", feedwide:"—", cls:"static", influence:0, inote:"" };
    var st = m.state, imp = Math.round(100 * (N - i) / N);
    var tr = el("tr", { "data-key":dm.key, title:(dm.why || "") + (dm.question ? "\nQ: " + dm.question : "") });
    tr.appendChild(el("td", { class:"r", html:"<b>" + (i + 1) + '</b><span class="bar" title="rank ' + (i + 1) + ' of ' + N + '"><i style="width:' + imp + '%"></i></span>' }));
    tr.appendChild(el("td", { class:"k", html:'<span class=fk>' + ico(KEYICO[dm.key] || dm.key, 12) + "<span>" + dm.key + "</span></span>"
      + '<span class="lbl">' + esc(dm.label || dm.key) + "</span>" + (dm.question && dm.question !== "\u2014" ? '<span class="q">' + esc(dm.question) + "</span>" : "") }));
    tr.appendChild(el("td", { class:"plain", text:dm.plain || "" }));
    tr.appendChild(el("td", { class:"cls inf", title:esc(m.inote || ""), html:'<span class="kd ' + m.cls + '" title="' + esc(m.cls === "static" ? "read from the element's own record" : "computed from its relations — moves when they move") + '">' + m.cls + "</span>"
      + '<b>' + (m.influence || "\u2014") + "</b>" + (m.influence ? '<i>coupled to ' + m.influence + " other element" + (m.influence === 1 ? "" : "s") + "</i>" : '<i>couples to nothing</i>') }));
    tr.appendChild(el("td", { class:"ts", html:"<span class=\"tier " + dm.tier + "\">" + dm.tier + "</span><span class=slotb>" + dm.slot + "</span>" }));
    tr.appendChild(el("td", { class:"v", html:"<span class=\"b " + st + "\">" + st + "</span><span class=val>" + esc(String(m.value)) + "</span>" }));
    tr.appendChild(el("td", { class:"n", text:m.feedwide }));
    tr.appendChild(el("td", { class:"today", html:esc(String(dm.station_today || "")).replace(/^(dropped|shown|wrong|partial|not read|file shown)/i, function(w){ return "<span class=" + w.toLowerCase().split(" ")[0] + ">" + w + "</span>"; }) }));
    tb.appendChild(tr);
  });
  t.appendChild(tb); B.__body.appendChild(t);

  /* ── THE EXAMPLE — every fact, folded by default ── */
  var A = foldable(secEl("info", "THE EXAMPLE — every fact the feed holds", F.id), false); host.appendChild(A);
  var sig = F.sig || {}, acc = F.access || {}, beh = F.behind || {};
  var reads = (acc.ops || []).filter(function(o){ return o.rw === "r"; }), writes = (acc.ops || []).filter(function(o){ return o.rw === "w"; });
  var grid = el("div", { class:"facts" });
  grid.appendChild(factGroup("info", "identity", [
    factRow("name", "name", el("span", { class:"m", text:F.name }), "live", "fn_nodes[].name"),
    factRow("file", "file", el("span", { class:"m", text:F.file + (F.flines ? ":" + F.flines + " lines" : "") }), F.flines ? "live" : "empty", "detail.file · flines"),
    factRow("sig", "signature", el("span", { class:"m", html:(sig.async ? "async" : "sync") + " · → <b>" + (sig.returns || "—") + "</b>" }), sig.returns ? "live" : "empty", "detail.sig"),
    factRow("doc", "docstring", el("span", { class:"none", text:F.doc || "— none captured (200 of 292 functions carry one)" }), F.doc ? "live" : "empty", "detail.doc"),
    factRow("fn", "role · layer", el("span", { html:"<b>" + F.role + "</b> · " + F.layer + " · " + (F.handler ? "handler" : "<span class=dim>not a handler</span>") + " · " + F.lang }), "live", "fn_nodes[].role · layer · handler"),
    factRow("flag", "god", el("span", { class:F.god ? "warn" : "dim", text:F.god ? "yes — the rule is length ≥ " + F.god_rule_lines + " lines (_a3_code.py), and this one is " + F.flines + "; one of " + F.feed.gods + " god functions" : "no" }), "live", "fn_nodes[].god · _FN_GOD_LINES"),
    factRow("entity", "entity", el("span", { text:F.slug }), "live", "fn_nodes[].slug"),
  ]));
  grid.appendChild(factGroup("merge", "wiring", [
    factRow("caller", "callers", (function(){ var w = el("span"); w.appendChild(el("span", { text:F.in_degree + " in, " + (F.callers.every(function(c){ return c.conf === "extracted"; }) ? "all extracted" : "mixed") + ", rel " + Array.from(new Set(F.callers.map(function(c){ return c.rel; }))).join("/") + " — the handlers of:" }));
      w.appendChild(chips(F.callers.map(function(c){ return (c.endpoint || c.fn) + " · " + c.guards + " guards · " + (c.tests_piece ? c.tests_piece.n + " tests" + (c.tests_piece.red ? " · " + c.tests_piece.red + " RED" : "") : "—"); }), "ok")); return w; })(), F.in_degree ? "live" : "empty", "fn_edges t=id (rel · conf) · c4 l2 · pieces.endpoints[].guards/tests"),
    factRow("gate", "gates on the doors", (function(){ var g = {}; F.gates_via_callers.forEach(function(x){ x.gates.forEach(function(n){ g[n] = (g[n] || 0) + 1; }); }); var w = el("span");
      w.appendChild(el("span", { text:Object.keys(g).map(function(n){ return n + " gates " + g[n] + " of " + F.callers.length + " doors"; }).join(" · ") || "— no gate on any door" })); return w; })(), F.gates_via_callers.some(function(x){ return x.gates.length; }) ? "live" : "empty", "c4 endpoints[].middleware gate:true"),
    factRow("fetch", "screens via doors", (function(){ var w = el("span"); w.appendChild(el("span", { text:F.screens_via_callers.bridges + " bridges from " + F.screens_via_callers.screens.length + " hooks:" }));
      w.appendChild(chips(F.screens_via_callers.per.map(function(x){ return x.from.split("/").pop() + " → " + x.to.replace(/^endpoint:/, ""); }), "")); return w; })(), F.screens_via_callers.bridges ? "live" : "empty", "c4 cross_edges kind=bridge"),
    factRow("dep", "callees", (function(){ var w = el("span"); w.appendChild(el("span", { text:F.out_degree + " out" }));
      w.appendChild(chips(F.callees.map(function(c){ return c.fn + " · " + c.conf + (c.crosses ? " · → " + c.entity : ""); }), "warn")); return w; })(), F.out_degree ? "live" : "empty", "fn_edges s=id"),
    factRow("reach", "behind", (function(){ var w = el("span"); w.appendChild(el("span", { text:beh.fns + " fns · depth " + beh.depth + " (BFS over calls; a floor; names capped at 12, " + (F.names_more ? "+" + F.names_more + " more" : "no overflow") + ")" }));
      var c = el("span", { class:"chips" }); (F.behind_names || []).forEach(function(b){ c.appendChild(el("span", { class:"chip " + (b.hidden ? "warn" : "dim"), text:b.name + (b.hidden ? " · hidden" : b.role ? " · " + b.role : ""), title:b.hidden ? "named in behind, not drawn by the walk (" + F.hidden.entity + " hidden fns in " + F.slug + ")" : (b.resolved[0] || "") })); }); w.appendChild(c); return w; })(), beh.fns ? "live" : "empty", "fn_nodes[].behind · entities[].counts.hidden_fns"),
    factRow("above", "above", (function(){ var w = el("span"); w.appendChild(el("span", { text:F.above_endpoints.length + " endpoints carry it in their own behind:" }));
      w.appendChild(chips(F.above_endpoints.map(function(a){ return a.label + " · " + a.behind.fns + "/" + a.behind.depth; }), "")); return w; })(), F.above_endpoints.length ? "live" : "empty", "c4 l2 endpoints[].behind.names"),
    factRow("conn", "fan-in", el("span", { html:"<b>" + F.in_degree + "</b> by fn_edges · <span class=warn>" + F.hub.usage + " by hub.usage</span> — the station's VITALS reads the second" }), "live", "fn_edges · fn_nodes[].hub.usage"),
    factRow("home", "cross-entity", chips(F.cross_entities, ""), F.cross_entities.length ? "live" : "empty", "use_edges.ts · fn_edges.ds"),
  ]));
  grid.appendChild(factGroup("table", "data", [
    factRow("read", "reads", chips(reads.map(function(o){ return o.table; }), "ok"), reads.length ? "live" : "empty", "access.ops rw=r"),
    factRow("write", "writes", writes.length ? chips(writes.map(function(o){ return o.table; }), "warn") : el("span", { class:"none", text:"— none; commits " + String(!!acc.commits) }), writes.length ? "live" : "empty", "access.ops rw=w · commits"),
    factRow("touch", "serialises", chips((acc.serializes || []).map(function(b){ return b.cls + ":" + b.line; }), ""), (acc.serializes || []).length ? "live" : "empty", "access.serializes"),
    factRow("resp", "returns", chips(F.schemas.returns.map(function(s){ return s.replace(/^schema:/, ""); }), "ok"), F.schemas.returns.length ? "live" : "empty", "schema_edges rel=returns"),
    factRow("shape", "uses schemas", chips(F.schemas.uses.map(function(s){ return s.replace(/^schema:/, ""); }), ""), F.schemas.uses.length ? "live" : "empty", "schema_edges rel=uses"),
    factRow("col", "columns", el("span", { class:"none", text:"— a function has no columns of its own" }), "absent", "—"),
    factRow("state", "hops to a write", el("span", { class:F.d2w != null ? "" : "none", text:F.d2w != null ? String(F.d2w) : "— none: no write lies ahead of a read-only accessor" }), F.d2w != null ? "live" : "empty", "fn_nodes[].d2w"),
  ]));
  grid.appendChild(factGroup("test", "evidence", [
    factRow("test", "tests", (function(){ var w = el("span"); w.appendChild(el("span", { class:"unmeas", text:"— never measured directly (0 of " + F.feed.fn_nodes + " functions carry cases; the mint hardcodes tests:0). " }));
      w.appendChild(el("span", { text:"Through its callers: " + F.via_callers.cases + " distinct cases (" + Object.keys(F.via_callers.case_states).map(function(k){ return F.via_callers.case_states[k] + " " + k; }).join(" · ") + ")" }));
      w.appendChild(chips(F.via_callers.per.map(function(x){ return x.endpoint + " · " + x.cases; }), "ok")); return w; })(), "unmeasured", "detail.cases (absent) · c4 endpoints[].det.cases"),
    factRow("journey", "journeys", (function(){ var w = el("span"); w.appendChild(el("span", { class:"none", text:"— none name the function directly (census not curated). " }));
      w.appendChild(el("span", { text:F.via_callers.journeys + " distinct test journeys pass through its callers" + (F.via_callers.curated_initial_setup ? "; the curated walk \u2018Initial setup — first run\u2019 names GET /settings" : "") })); return w; })(), "unmeasured", "c4 endpoints[].det.test_journeys · workflows.js"),
    factRow("home", "homing", el("span", { class:F.homing ? "" : "dim", text:F.homing ? JSON.stringify(F.homing) : "— not weighed; " + F.feedwide.homing + " functions were (" + Object.keys(F.homing_fn_verdicts).map(function(k){ return F.homing_fn_verdicts[k] + " " + k; }).join(" · ") + ")" }), F.homing ? "live" : "empty", "homing.pieces[id]"),
    factRow("entity", "entity model", (function(){ var w = el("span"); var hv = F.model_homes;
      w.appendChild(el("span", { html:"claim <b>" + F.slug + "</b>" + (hv.derived ? " · derived <span class=warn>" + esc(hv.derived) + "</span>" : "") + (hv.seeded ? " · seeded " + esc(hv.seeded) : " · seeded keeps the claim") + (hv.proposed ? " · proposed " + esc(hv.proposed) : " · proposed keeps the claim") })); return w; })(), F.model_homes.derived ? "live" : "empty", "c4.models.homes[view][id]"),
    factRow("flag", "flags · sinks", el("span", { class:"none", text:(F.flags || F.sinks) ? JSON.stringify({ flags:F.flags, sinks:F.sinks }) : "— none (flags on 4, sinks on 1 of 292)" }), (F.flags || F.sinks) ? "live" : "empty", "fn_nodes[].flags · sinks"),
    factRow("via", "pressure", el("span", { class:"none", text:"— pressure {} in this example" }), "unmeasured", "levels.pressure"),
    factRow("home", "community", el("span", { class:"none", text:(F.communities.length || F.usecases.length) ? F.communities.concat(F.usecases).join(" · ") : "— clustered nowhere: communities and use-cases list handlers only" }), (F.communities.length || F.usecases.length) ? "live" : "empty", "pieces." + F.slug + ".communities · usecases"),
    factRow("state", "in flight", el("span", { class:F.inflight && (F.inflight.touches_fn || F.inflight.touches_file) ? "warn" : "dim", text:F.inflight ? (F.inflight.touches_fn || F.inflight.touches_file ? "YES — commit " + F.inflight.commit : "no — commit " + F.inflight.commit + " is in flight with " + F.inflight.touched_n + " touched; this function is not among them") : "— sim.data.js is null" }), F.inflight ? "live" : "empty", "sim.data.js touched[]"),
    factRow("file", "scale", el("span", { text:F.flines + " of the entity's " + F.entity_counts.lines + " lines (" + Math.round(100 * F.flines / F.entity_counts.lines) + "%) across " + F.entity_counts.files + " files · " + F.entity_counts.hidden_fns + " fns hidden in " + F.slug }), "live", "entities[].counts"),
    factRow("dep", "the join", el("span", { html:"<code>detail['" + esc(F.join.detail_key) + "']</code> · file matches id: <b>" + F.join.file_matches_id + "</b> · " + F.feed.details + " keys for " + F.feed.fn_nodes + " functions (one pair shares a key)" }), "live", "levels.detail keyed slug|name"),
  ]));
  A.__body.appendChild(grid);

  /* C · THE STATION TODAY */
  var S = F.station;
  var C = foldable(secEl("cog", "THE STATION TODAY — the card in render order", S.card_order.length + " sections"), false); host.appendChild(C);
  var today = el("div", { class:"today" });
  today.appendChild(el("span", { class:"cs alive", html:"<b>KINDCARD.function</b><span class=cl>gabe-universe.html:" + S.card_line + "</span>" }));
  today.appendChild(el("span", { class:"cs alive", html:"<b>_buildFnData</b><span class=cl>the mint :" + S.mint_line + "</span>" }));
  var DEAD = { sigSec:"det.sig never set by the mint", docSec:"det.doc is the empty string by construction", testsSec:"det.cases never exists for a function", modelRow:"needs a modelMark; functions carry none" };
  var WRONG = { identSec:"fan-in reads m.fanin = hub.usage (" + F.hub.usage + "), not the " + F.in_degree + " drawn wires", usage:"same number: hub.usage, not in-degree" };
  S.card_order.forEach(function(h){
    var dead = DEAD[h], wrong = WRONG[h];
    today.appendChild(el("span", { class:"cs " + (dead ? "dead" : "alive"), html:"<b>" + h + "</b><span class=cl>:" + (S.helpers[h] || "?") + "</span>"
      + (dead ? "<span class=why>dead — " + dead + "</span>" : wrong ? "<span class=why style=\"color:var(--warn)\">" + wrong + "</span>" : "<span class=why>draws</span>") }));
  });
  C.__body.appendChild(today);
  C.__body.appendChild(el("p", { class:"lede", style:"margin-top:10px", html:"<b>The mint copies:</b> " + S.mint_copies.join(" · ") + "<br><b>The mint drops:</b> <span style=\"color:var(--bad)\">" + S.mint_drops.join(" · ") + "</span> — at line " + S.det_line + " one join to <code>detail['fn:' + slug + '|' + name]</code> would light sigSec and docSec for " + F.feedwide.sig + " and " + F.feedwide.doc + " functions." }));

  /* D · FINDINGS */
  var finds = [
    ["defect", "<b>The signature exists and is dropped.</b> <code>detail['fn:settings|_build_settings'].sig</code> = async → SettingsResponse, flines 61; the mint at :" + S.det_line + " writes <code>det:{file, doc:\"\"}</code>, so <code>sigSec</code> (:" + S.helpers.sigSec + ") returns null for every function. Feed-wide: " + F.feedwide.sig + " carry a signature."],
    ["defect", "<b>Fan-in disagrees with itself on one card.</b> <code>identSec</code> says " + F.hub.usage + " caller (m.fanin = hub.usage); <code>liveConns</code> draws " + F.in_degree + " inbound call wires. The station's own ANALYSIS-C consoles copied the 1."],
    ["defect", "<b>Docstrings are dropped too.</b> " + F.feedwide.doc + " functions carry <code>detail.doc</code>; the mint hardcodes the empty string, so <code>docSec</code> never renders for a function. (This one has none — the card would still be honest-empty, but for the right reason.)"],
    ["gap", "<b>Tests are unmeasured for all " + F.feed.fn_nodes + " functions</b> — no fn_node and no fn: detail carries cases; <code>m.tests</code> is hardcoded 0. The card renders '— no cases claimed yet', which reads as a fact and is a measurement gap."],
    ["defect", "<b>Every function reads layer 'api'.</b> The mint sets <code>layer:KINDS[\"function\"].layer</code> and discards <code>fn_nodes[].layer</code> — services 195 · api 96 in the feed; <code>identSec</code> prints n.K.layer. Correct for this one by accident."],
    ["defect", "<b>'Unguarded' is false twice over.</b> Directly, no function is measured (the mint's tests:0); indirectly, <b>" + F.via_callers.cases + " distinct cases</b> reach this one through its four callers and " + F.via_callers.journeys + " test journeys pass through them. The card sends the reader to write tests that exist."],
    ["gap", "<b>Handler and lang never reach the node</b> — the mint copies role but not handler/lang, so 'not a handler · py' cannot be drawn today."],
    ["fact", "<b>The derived entity model re-homes it</b> under <code>" + (F.model_homes.derived || "—") + "</code> — the write-majority table it reads — while seeded and proposed keep the <code>settings</code> claim. A function panel should say which view it is speaking."],
    ["gap", "<b>Two of its six behind names are hidden, not missing.</b> allowance_for and month_start resolve to no fn_node because the walk did not DRAW them — " + F.hidden.entity + " hidden in settings, " + F.hidden.feed + " feed-wide (entities[].counts.hidden_fns). behindTree draws a bare chip and says nothing."],
    ["fact", "<b>Its UI blast radius is three hooks.</b> " + F.screens_via_callers.bridges + " c4 bridges (useSettings → GET /settings · useRedoSetup → PATCH household/preferences · useExplorationPrefs → PATCH exploration) reach it through its doors; the SCREENS verb read BLANK on a function card."],
    ["fact", "<b>Every door is gated by get_auth_context</b> (5 guards each, c4 middleware gate:true) — the function is only ever reached authenticated, and no card says so for a function."],
    ["fact", "<b>'God' on a function is a size flag</b> — length ≥ " + F.god_rule_lines + " lines (_FN_GOD_LINES); this one is " + F.flines + ". The station's 'god-object · oversized fn / class' never states the rule or the number."],
    ["fact", "<b>This function is one of " + F.feedwide.serializes.split('/')[0] + " that serialise blocks</b> (" + ((acc.serializes||[]).length) + " here) and one of " + F.feed.gods + " god functions. Both are distinctive and both already reach the node (access · god)."],
    ["fact", "<b>Its callee is inferred and crosses entities</b> — get_exploration_preferences in <code>recipe</code>, conf inferred; the four callers are extracted. Confidence is a dimension a function panel must carry per wire, not per node."],
    ["fact", "<b>No homing verdict</b> — " + F.feedwide.homing + " functions were weighed; this one was not (agree/stay/move/shared all absent). 'settings' is its file claim, nothing more."],
  ];
  var Dd = foldable(secEl("alert", "FINDINGS — what the example exposed", finds.length), false); host.appendChild(Dd);
  var fl = el("div", { class:"find" });
  finds.forEach(function(f){ fl.appendChild(el("div", { class:"f" }, [ el("span", { class:"tag " + f[0], text:f[0] }), el("span", { html:f[1] }) ])); });
  Dd.__body.appendChild(fl);
  if (window.LABDIMS && window.LABDIMS.open){
    var O = foldable(secEl("layout", "OPEN — rulings the analysis could not make", window.LABDIMS.open.length), false); host.appendChild(O);
    var ol = el("div", { class:"find" });
    window.LABDIMS.open.forEach(function(t){ ol.appendChild(el("div", { class:"f" }, [ el("span", { class:"tag gap", text:"open" }), el("span", { text:t }) ])); });
    O.__body.appendChild(ol);
    var vd = window.LABDIMS.verdict;
    O.__body.appendChild(el("p", { class:"lede", style:"margin-top:10px", html:"Adversarial verification of the analysis: <b>" + vd.checked + " claims</b> checked against levels.json, c4-graph.js and the station · " + vd.confirmed + " confirmed · " + vd.refuted.length + " refuted (all four are line-number or off-by-one cites, applied above) · " + vd.unverifiable.length + " unverifiable." }));
  }
}

/* ── 4 · the dock — G's U, one layout at a time ────────────────────────────── */
var LAYOUTS = [];   /* { key, name, note, render(e, mbox, rin) } — G is the baseline */
function labLayout(def){ LAYOUTS.push(def); }

labLayout({ key:"g", name:"G · the console as built", note:"VITALS · IN | STORE | OUT · CARGO in the middle; portrait · evidence · command on the right. The baseline every proposal must beat.",
  middle:function(e, mbox){
    var cols = el("div", { class:"midcols" });
    cols.appendChild(vitalsEl(e.id));
    [["in","IN"],["store","STORE"],["out","OUT"]].forEach(function(pp){ cols.appendChild(slotEl({ key:pp[0], label:pp[1], hint:"" }, e.slots[pp[0]])); });
    cols.appendChild(cargoEl(e));
    mbox.appendChild(cols);
  },
  right:function(e, rin){ rin.appendChild(planetEl(e)); rin.appendChild(evidenceEl(e)); rin.appendChild(commandEl(e.id, null, {})); }
});

function midTitle(e){
  var col = kcol(e.kind), bdg = BADGE[e.id];
  var title = el("div", { class:"midtitle" }, [
    el("span", { class:"mtg", html:svgK(e.kind, col, 16) }),
    el("span", { class:"mtn", title:e.label, text:e.label }),
  ]);
  if (bdg) title.appendChild(el("span", { class:"mtb", text:bdg, style:"background:" + col }));
  title.appendChild(el("span", { class:"mte" }, [ el("i", { style:"background:" + col }), el("span", { text:e.entity }) ]));
  return title;
}
function midCrumb(e){
  var crumb = el("div", { class:"midcrumb" });
  [["everything", true], [e.entity, true], [e.kind + " cluster", true], [e.short, true]].forEach(function(r0, i){
    if (i) crumb.appendChild(el("span", { class:"sep", text:"›" }));
    crumb.appendChild(el("span", { class:"cr" + (i === 3 ? " cur" : "") }, [ el("b", { text:r0[0] }) ]));
  });
  crumb.appendChild(el("span", { class:"mode", text:"kind lab · " + LAB.kind }));
  return crumb;
}

function renderDock(e){
  var row = document.getElementById("row"); row.innerHTML = "";
  var L = LAYOUTS.filter(function(l){ return l.key === LAB.layout; })[0] || LAYOUTS[0];
  /* LEFT · the world — the lab keeps a still stand-in: the minimap never reads the selection */
  var lw = el("div", { class:"zone wing left" }), lbox = el("div", { class:"wingbox" });
  var world = el("div", { class:"reg world" }); world.appendChild(regHead("WORLD", "—"));
  world.appendChild(el("div", { class:"regbody", html:"<div style=\"margin:auto;text-align:center;color:var(--muted);font:600 10px/1.5 var(--mono)\">MINIMAP<br><span style=\"font-size:9px\">selection-independent · see G</span></div>" }));
  lbox.appendChild(world); lw.appendChild(lbox); row.appendChild(lw);
  /* MIDDLE */
  var mz = el("div", { class:"zone mid" }), mbox = el("div", { class:"midbox" });
  mbox.appendChild(midCrumb(e)); mbox.appendChild(midTitle(e));
  L.middle(e, mbox);
  mz.appendChild(mbox); row.appendChild(mz);
  /* RIGHT */
  var rw = el("div", { class:"zone wing right" }), rbox = el("div", { class:"wingbox" }), rin = el("div", { class:"rwing" });
  L.right(e, rin);
  rbox.appendChild(rin); rw.appendChild(rbox); row.appendChild(rw);
  buildRibbon(); buildPanel();
  requestAnimationFrame(labGeo);
}

function buildRibbon(){
  var h = document.getElementById("layoutrib"); if (!h) return; h.innerHTML = "";
  LAYOUTS.forEach(function(l){
    var b = el("button", { class:"lb" + (l.key === LAB.layout ? " on" : ""), text:l.name.split(" · ")[0], title:l.name + " — " + l.note,
      onclick:function(){ LAB.layout = l.key; renderDock(window.LABE); } });
    h.appendChild(b);
  });
}

/* the control panel: the console's nomenclature, the lab's groups */
function setDock(pct){
  LAB.pct = pct; VSTATE.pct = pct;
  var v = "max(282px, " + pct + "vh)";
  document.documentElement.style.setProperty("--dockpct", String(pct));
  document.documentElement.style.setProperty("--dock", v);
  document.body.style.setProperty("--dock", v);
}
function buildPanel(){
  var host = document.getElementById("ctlpanel"); if (!host) return; host.innerHTML = "";
  var F = window.LABFN, minned = document.body.classList.contains("panel-min");
  var head = el("div", { class:"phead" }, [
    el("span", { class:"pk", html:svgK(LAB.kind, rawKcol(LAB.kind), 14) }),
    el("span", { class:"pt", html:"KIND LAB · <b>" + LAB.kind + "</b> — " + esc(F.name) }),
  ]);
  var min = el("button", { class:"pmin", title: minned ? "open the settings" : "fold the settings — full width, larger type",
    html: minned ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12h16M12 4v16"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12h16"/></svg>' });
  min.onclick = function(){ document.body.classList.toggle("panel-min"); buildPanel(); requestAnimationFrame(labGeo); };
  head.appendChild(min); host.appendChild(head);
  var groups = el("div", { class:"pgroups" }); host.appendChild(groups); host = groups;
  var order = ["function","endpoint","model","component","hook","schema","route","external","middleware","flag","store","module","type","web","provider","element"];
  host.appendChild(ctlGroup("layout", "KIND", order.map(function(k){
    var col = rawKcol(k), on = k === LAB.kind;
    return hudBtn({ html:hudInert(svgK(k, col, 14)), tip:k, sub:on ? "the kind on the bench now" : "next — not yet on the bench", on:on,
      style:"color:" + col + (on ? "" : ";opacity:.45"), onclick:function(){} });
  }), true));
  host.appendChild(ctlGroup("layout", "LAYOUT", LAYOUTS.map(function(l, i){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none">' + (i + 1) + '</span>', tip:l.name, sub:l.note, on:l.key === LAB.layout,
      onclick:function(){ LAB.layout = l.key; renderDock(window.LABE); } });
  })));
  host.appendChild(ctlGroup("dock", "HEIGHT", [25, 30, 33, 37, 41, 45].map(function(pc){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none">' + pc + '</span>', tip:pc + "% of the page", sub:"the same dial as G", on:LAB.pct === pc,
      onclick:function(){ setDock(pc); renderDock(window.LABE); } });
  })));
  host.appendChild(ctlGroup("tsize", "TEXT", [0.9, 1, 1.15, 1.3].map(function(t){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none;font-size:' + (7 + (t - 0.9) * 8).toFixed(1) + 'px">A</span>', tip:"Text " + Math.round(t * 100) + "%", sub:"", on:(VSTATE.ts || 1) === t,
      onclick:function(){ VSTATE.ts = t; document.documentElement.style.setProperty("--ts", String(t)); renderDock(window.LABE); } });
  })));
  host.appendChild(ctlGroup("skin", "SKIN", Object.keys(SKINS).map(function(k){
    var tk = SKINS[k].tokens || {};
    return hudBtn({ html:'<span class="hsw" style="pointer-events:none;background:' + (tk["--accent"] || "#888") + '"></span>', tip:SKINS[k].name, sub:SKINS[k].note, on:VSTATE.skin === k,
      onclick:function(){ applySkin(k); renderDock(window.LABE); } });
  })));
  host.appendChild(ctlGroup("frame", "FRAME", (VARIANTS.frame || []).map(function(v){
    var on = vOf("frame") === v.key, t = REGTINT.frame;
    return hudBtn({ icon:"fr_" + v.key, tip:v.name, sub:v.note, on:on, style:"color:" + t + (on ? ";border-color:" + t : ""),
      onclick:function(){ VSTATE.frame = v.key; applyFrame(); renderDock(window.LABE); } });
  })));
}

/* measured, never guessed: the dock's real height and whether any region overflows */
function labGeo(){
  var d = document.getElementById("dock").getBoundingClientRect().height;
  var over = [];
  Array.prototype.forEach.call(document.querySelectorAll("#row .regbody, #row .slotbody, #row .cargo, #row .grid5"), function(b){
    if (b.scrollHeight > b.clientHeight + 1){
      var host = b.closest(".slot") || b.closest(".reg");
      var nm = host && (host.querySelector(".rt") || host.querySelector(".vt") || host.querySelector(".rl") || host.querySelector(".sl"));
      over.push(((nm && nm.textContent.trim()) || "?") + " +" + (b.scrollHeight - b.clientHeight)); }
  });
  window.__labGeo = { dock:Math.round(d), pct:+(100 * d / window.innerHeight).toFixed(1), overflow:over };
  var g = document.getElementById("labgeo");
  if (g) g.textContent = Math.round(d) + "px · " + (100 * d / window.innerHeight).toFixed(1) + "% · overflow " + (over.length ? over.join(", ") : "none");
}

/* ── boot ───────────────────────────────────────────────────────────────────── */
(function(){
  if (!window.LABFN){ document.getElementById("doc").textContent = "LABFN missing — run scratchpad/gen_fn_facts.py"; return; }
  if (typeof KCOL !== "undefined" && !KCOL["function"]) KCOL["function"] = "--k-function";   /* _shell.js never listed function */
  document.body.classList.add("hud-only"); document.body.classList.add("ushape");
  window.__ICONMODE = true;
  if (typeof tipInit === "function") tipInit();
  applySkin(VSTATE.skin); applyFrame();
  /* the operator's wings are fixed pixels tuned at 2560 wide (448 · 644). Below
     that the middle collapses — at 1440 the three spine columns measured 0px and
     every word wrapped per character. The lab honours the numbers where they fit
     and scales them where they do not; G keeps its own ruling open. */
  var rl = (VSTATE.wl / 2560 * 100).toFixed(2), rr = (VSTATE.wr / 2560 * 100).toFixed(2);
  document.documentElement.style.setProperty("--wingw", "min(" + VSTATE.wl + "px, " + rl + "vw)");
  document.documentElement.style.setProperty("--wingr", "min(" + VSTATE.wr + "px, " + rr + "vw)");
  document.documentElement.style.setProperty("--ts", String(VSTATE.ts));
  setDock(LAB.pct);
  if (window.LABLAYOUTS) window.LABLAYOUTS.forEach(labLayout);
  var e = labElement(); labRegister(e); window.LABE = e;
  buildDoc();
  renderDock(e);
  window.addEventListener("resize", function(){ requestAnimationFrame(labGeo); });
  window.renderDock = renderDock; window.LAB = LAB;
})();
