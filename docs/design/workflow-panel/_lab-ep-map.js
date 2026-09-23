/* ═══ Endpoint lab — THE FIELD LAYER (D-024: "I need to see what is happening in the panels when we go through the
   brain map and highlight the different fields that we navigate through that brain map") ═══════════════════════

   TWO HALVES, one registry.

   window.DRAWN — what the panels drew, tied to a field BY THE RENDERER'S OWN CODE. A renderer that draws an attribute
   of the card's inventory (LABEP.sectionmap.attrs — the 61 ids) tags the element it drew: DRAWN.tag(el, ids) sets
   `data-fa` and registers the element, or a string builder writes DRAWN.fa(ids) into its markup and then
   DRAWN.claim(box) registers what it wrote. Each region's render runs inside DRAWN.run(region, fn): the region's
   entries are CLEARED when its render starts and refilled by what the render draws — exactly as COV is — so the
   registry never outlives the DOM. A post-render pass that ADDS to a region (the path projection, the head chip) runs
   inside DRAWN.more(region, fn), which keeps the region and drops only what the pass took off the page.
   Regions: middle (#panel) · command (#cmd · #pathstrip · #portlad) · portrait (#portbody) · head (#headstrip).
   Where a renderer draws a thing through generic machinery that cannot say which attribute it is (a verb cell of the
   command card), the tie is written in field-layer.words.json as a SELECTOR, applied after that region's render.
   Every tie is the agent's proposal — the ids are typed by hand in both places; what differs is where the tie sits:
   in the code that draws the element, or in a selector applied afterwards. The page keeps the two apart per field.

   Each tie carries HOW the fact rides the element, PER FIELD: on its face, or only in its hover card. One element
   can carry a field on its face and another only on hover; a face tag never erases another field's hover flag.

   window.FIELDMAP — the map ↔ panels wiring. It reads DRAWN (never the DOM) to light the tree at ATTRIBUTE level:
   drawn here · drawn on another part · behind a switch no control reaches · not drawn by the lab. "Another part"
   comes from a CATALOG filled off-screen at boot: every distribution of every part (with and without a path in
   force), every command layout, and every portrait record with each thing picked in turn, rendered into a ghost box
   whose tags are counted by place and then thrown away.
   Pointing at a field or a block OUTLINES every element DRAWN holds for it and fades the rest (a preview); a CLICK keeps
   the outline and fades nothing (D-022: a click always shows — dimming what it did not light is Keep only's, a filter). A kept outline says so at the top of the rail, on every rail tab, with a way to walk
   to the outlined elements that are out of view and a way to clear it (and Esc). The lines count what is in view.

   Lab chrome — none of it ships. Facts are the renderers' and the feed's; every word is field-layer.words.json's. */
(function(){
  var REGIONS = ["middle", "command", "portrait", "head"];
  var ROOTS = { middle: ["#panel"], command: ["#cmd", "#pathstrip", "#portlad"], portrait: ["#portbody"], head: ["#headstrip"] };
  var BY = { middle: [], command: [], portrait: [], head: [] };   // entries {el, ids:{id:{g,a,how}}, reg}
  var LOOSE = [];                                                    // tags made outside any run — the probe demands none
  var IDX = new WeakMap();                                           // el → entry, this generation only
  var STACK = [];                                                    // the run in force: {region, where, ghost, off}
  var CAT = {}, CATOFF = {};                                         // id → {where → {n, src:{generated,authored}}}
  var AUTH = [];                                                     // the selector ties, [{id, region, sel, how, why}]
  var listeners = [];
  function idsOf(x){ return (Array.isArray(x) ? x : String(x == null ? "" : x).split(/\s+/)).filter(Boolean); }
  function top(){ return STACK.length ? STACK[STACK.length - 1] : null; }
  function regionOf(el){ if (!el || !el.closest) return null;
    return el.closest("#cmd,#pathstrip,#portlad") ? "command" : el.closest("#portbody") ? "portrait"
      : el.closest("#panel") ? "middle" : el.closest("#headstrip") ? "head" : null; }
  function note(t, id, src){ var C = t.off ? CATOFF : CAT, c = C[id] = C[id] || {}, w = c[t.where] = c[t.where] || { n: 0, src: {} };
    w.n++; w.src[src] = 1; if (t.tgt && !w.tgt) w.tgt = t.tgt; }
  /* the element's attributes mirror its entry: data-fa every field · data-fa-hov the fields only its hover card
     carries · data-fa-aut the fields a selector tied · data-fa-how="hover" when every field on it is hover-only */
  function mirror(e){ var el = e.el, ks = Object.keys(e.ids);
    var hov = ks.filter(function(k){ return e.ids[k].how === "hover"; }), aut = ks.filter(function(k){ return e.ids[k].a; });
    el.dataset.fa = ks.join(" ");
    if (hov.length) el.dataset.faHov = hov.join(" "); else delete el.dataset.faHov;
    if (hov.length && hov.length === ks.length) el.dataset.faHow = "hover"; else delete el.dataset.faHow;
    if (aut.length) el.dataset.faAut = aut.join(" "); else delete el.dataset.faAut; }
  function record(el, ids, how, src){
    if (!el || el.nodeType !== 1) return el;
    var t = top(), e = IDX.get(el);
    if (!e) { e = { el: el, ids: {}, reg: t ? (t.ghost ? "ghost" : t.region) : "loose" };
      IDX.set(el, e);
      if (e.reg === "loose") LOOSE.push(e); else if (e.reg !== "ghost") BY[e.reg].push(e); }
    ids.forEach(function(id){ var r = e.ids[id];
      if (!r) { r = e.ids[id] = { g: 0, a: 0, how: how }; if (t && t.ghost) note(t, id, src); }
      else if (how === "face") r.how = "face";                       // per FIELD: a face tie of THIS field outranks its hover tie
      if (src === "authored") r.a = 1; else r.g = 1; });
    mirror(e);
    return el; }
  function reset(region){ BY[region].forEach(function(e){ IDX.delete(e.el); }); BY[region] = []; }
  function prune(region){ BY[region] = BY[region].filter(function(e){ if (e.el.isConnected) return true; IDX.delete(e.el); return false; }); }
  function rootsOf(region, host){ return host ? [host] : (ROOTS[region] || []).map(function(s){ return document.querySelector(s); }).filter(Boolean); }
  /* the SELECTOR ties — applied to what the region drew, never to anything else */
  function applyAuthored(region, host){
    AUTH.forEach(function(a){ if (a.region !== region) return;
      rootsOf(region, host).forEach(function(r){
        [].forEach.call(r.querySelectorAll(a.sel), function(el){ record(el, [a.id], a.how || "face", "authored"); }); }); }); }

  var DRAWN = window.DRAWN = {
    REGIONS: REGIONS,
    regionOf: regionOf,
    /* one region's render: its entries are cleared first, refilled by what it draws, then the selector ties apply */
    run: function(region, fn){ DRAWN.begin(region);
      try { return fn(); } finally { DRAWN.end(); } },
    /* a pass that ADDS to a region already drawn (the path projection, the head chip): the region keeps its entries and
       loses only the elements the pass took off the page. Inside a ghost run it simply joins that run. */
    more: function(region, fn){ var t = top(); if (t && t.ghost) return fn();
      prune(region); STACK.push({ region: region, append: true });
      try { return fn(); } finally { prune(region); DRAWN.end(); } },
    begin: function(region, meta){ meta = meta || {};
      if (meta.ghost) STACK.push({ ghost: true, where: meta.where, region: region, host: meta.host, off: !!meta.off, tgt: meta.tgt || null });
      else { reset(region); STACK.push({ region: region }); } },
    end: function(){ var t = top(); if (!t) return;
      applyAuthored(t.region, t.ghost ? t.host : null);   /* while the run is still in force, so the ties land in its region */
      STACK.pop();
      if (!STACK.length && !t.ghost) listeners.forEach(function(f){ try { f(t.region); } catch (e) { console.error(e); } }); },
    /* a renderer says what it drew: the element and the attribute id(s). opt.hover = the fact rides only its hover card */
    tag: function(el, ids, opt){ return record(el, idsOf(ids), opt && opt.hover ? "hover" : "face", "generated"); },
    /* the same, for markup built as a string: write DRAWN.fa(ids) into the element, then DRAWN.claim(box) */
    fa: function(ids, hover){ var v = idsOf(ids).join(" "); return v ? ' data-fa="' + v + '"' + (hover ? ' data-fa-how="hover"' : "") : ""; },
    claim: function(box){ if (!box || !box.querySelectorAll) return box;
      var all = [].slice.call(box.querySelectorAll("[data-fa]")); if (box.dataset && box.dataset.fa) all.unshift(box);
      all.forEach(function(el){ if (IDX.get(el)) return; record(el, idsOf(el.dataset.fa), el.dataset.faHow === "hover" ? "hover" : "face", "generated"); });
      return box; },
    /* READS — the map reads these, never the DOM */
    els: function(id, region){ var out = [];
      (region ? [region] : REGIONS).forEach(function(r){ BY[r].forEach(function(e){ if (e.ids[id]) out.push(e.el); }); }); return out; },
    has: function(id){ return REGIONS.some(function(r){ return BY[r].some(function(e){ return !!e.ids[id]; }); }); },
    count: function(id){ var o = {}; REGIONS.forEach(function(r){ o[r] = BY[r].filter(function(e){ return !!e.ids[id]; }).length; }); return o; },
    ids: function(){ var o = {}; REGIONS.forEach(function(r){ BY[r].forEach(function(e){ Object.keys(e.ids).forEach(function(k){ o[k] = 1; }); }); }); return Object.keys(o); },
    entries: function(){ var out = []; REGIONS.forEach(function(r){ BY[r].forEach(function(e){ var how = {}, src = {};
      Object.keys(e.ids).forEach(function(k){ how[k] = e.ids[k].how; src[k] = e.ids[k].a && e.ids[k].g ? "both" : e.ids[k].a ? "authored" : "generated"; });
      out.push({ region: r, el: e.el, ids: Object.keys(e.ids), how: how, src: src }); }); }); return out; },
    /* how one element carries one field: "face" · "hover" · null */
    howOf: function(el, id){ var e = IDX.get(el); return e && e.ids[id] ? e.ids[id].how : null; },
    loose: function(){ return LOOSE.filter(function(e){ return e.el.isConnected; }).length; },
    catalog: function(){ return CAT; },
    catalogOff: function(){ return CATOFF; },
    onChange: function(f){ listeners.push(f); },
    setAuthored: function(list){ AUTH = list || []; } };

  /* ═══ FIELDMAP — the map side ═══════════════════════════════════════════════════════════════════════════════ */
  var F = window.LABEP || {}, SM = F.sectionmap || {}, FL = F.fieldlayer || { state: "absent", authored: [], words: {} };
  var W = FL.words || {}, WS = W.strings || {}, WP = W.places || {};
  DRAWN.setAuthored(FL.state === "present" ? FL.authored : []);
  var OPTS = [ { key: "hold", pick: "point", vals: ["point", "click"] },
               { key: "rest", pick: "dim", vals: ["dim", "asis"] },
               { key: "prop", pick: "hidden", vals: ["hidden", "marked"] } ];   // the agent's picks — every one a rail option
  var OPT = { hold: "point", rest: "dim", prop: "hidden" };
  var CUR = null;                                                    // the ids lit now (a preview or the kept light)
  var KEEP = null;                                                   // what a click kept, until it is cleared
  var LAST = null;                                                   // what the last light did — the feedback note reads it
  var NEXT = 0;                                                      // the walk through the outlined elements out of view
  function attrs(){ return SM.attrs || {}; }
  function label(id){ var a = attrs()[id]; return a ? a.label : id; }
  function W1(k, d){ var v = WS[k]; return typeof v === "string" && v ? v : d; }
  function fill(s, tok){ return String(s).replace(/\{(\w+)\}/g, function(m, k){ return tok[k] != null ? String(tok[k]) : m; }); }
  /* the places the catalog saw a field — a place is dropped when it is only another place with a path picked */
  function where(id){ var ks = Object.keys(CAT[id] || {});
    return ks.filter(function(p){ return !ks.some(function(q){ return q !== p && p.indexOf(q + ",") === 0; }); }); }
  function places(id, n){ var ws = where(id), sep = W1("placeSep", " ; ");
    return ws.slice(0, n || 2).join(sep) + (ws.length > (n || 2) ? sep + fill(W1("more", "and {n} more"), { n: ws.length - (n || 2) }) : ""); }
  /* how a field is tied, from BOTH the bench and the catalog: in the renderer's code (g) · by a selector (a) */
  function tieOf(id){ var g = false, a = false, c = CAT[id] || {};
    Object.keys(c).forEach(function(w){ if (c[w].src.generated) g = true; if (c[w].src.authored) a = true; });
    REGIONS.forEach(function(r){ BY[r].forEach(function(e){ var x = e.ids[id]; if (x) { if (x.g) g = true; if (x.a) a = true; } }); });
    return { g: g, a: a }; }
  function srcOf(id){ var t = tieOf(id); return t.g && t.a ? "both" : t.a ? "authored" : t.g ? "generated" : null; }
  /* drawn HERE (the bench right now) · on ANOTHER part (the catalog knows a place) · OFF (only behind a switch no control
     on the page reaches) · NOT drawn by the lab */
  function state(id){ return DRAWN.has(id) ? "here" : where(id).length ? "elsewhere" : Object.keys(CATOFF[id] || {}).length ? "off" : "none"; }
  function blockIds(b){ return (b.own || []).concat(b.shared || []); }
  function blockCount(b){ var ids = blockIds(b);
    return { drawn: ids.filter(function(id){ return DRAWN.has(id); }).length, elsewhere: ids.filter(function(id){ return state(id) === "elsewhere"; }).length, of: ids.length }; }
  function totals(){ var o = { generated: 0, authored: 0, both: 0, none: 0, of: 0, notDrawn: [] };
    Object.keys(attrs()).forEach(function(id){ o.of++; var t = tieOf(id);
      if (t.g) o.generated++; if (t.a) o.authored++; if (t.g && t.a) o.both++;
      if (!t.g && !t.a) { o.none++; o.notDrawn.push(id); } });
    return o; }

  /* ── IN VIEW: an element counts as in view when its centre is inside the window and inside every box around it that
        clips or scrolls — so an element below the fold of a scrolling panel is counted out of view ── */
  function viewer(){ var clip = new Map();
    function boxOf(p){ if (clip.has(p)) return clip.get(p); var cs = getComputedStyle(p), b = null;
      if (cs.display === "none") b = "none";
      else if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + " " + cs.overflowY)) b = p.getBoundingClientRect();
      clip.set(p, b); return b; }
    return function(el){ if (!el || !el.isConnected) return false;
      var r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
      if (getComputedStyle(el).visibility === "hidden") return false;
      var x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
      if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
      for (var p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { var b = boxOf(p);
        if (b === "none") return false;
        if (b && (x < b.left || x >= b.right || y < b.top || y >= b.bottom)) return false; }
      return true; }; }

  /* ── the light: outline every element DRAWN holds for the ids, dim the rest of the bench, never remove anything ── */
  var BENCH = ["#bench", "#port", "#cmd"];
  /* the map's OWN record in the portrait (Open) is the answer to a move, not something a light is about: it never fades */
  function OWN(){ return [].slice.call(document.querySelectorAll("#portbody .mrec")); }
  function clearMarks(){ [].forEach.call(document.querySelectorAll(".fl-hit,.fl-dim,.fl-anc,.fl-hov,.fl-prop"), function(e){ e.classList.remove("fl-hit", "fl-dim", "fl-anc", "fl-hov", "fl-prop"); });
    document.body.removeAttribute("data-fl"); }
  function hitsOf(ids){ var seen = new Set(), out = [];
    ids.forEach(function(id){ DRAWN.els(id).forEach(function(el){ if (!seen.has(el)) { seen.add(el); out.push(el); } }); }); return out; }
  /* the outline's STYLE, per lit element: dotted when every lit field rides only its hover card, dashed when a lit field
     is tied by a selector and the rail marks proposals */
  function styleOf(el, ids){ var on = ids.filter(function(id){ return DRAWN.howOf(el, id); });
    var hov = on.length && on.every(function(id){ return DRAWN.howOf(el, id) === "hover"; });
    var prop = OPT.prop === "marked" && on.some(function(id){ return (el.dataset.faAut || "").split(" ").indexOf(id) >= 0; });
    return { hov: hov, prop: prop }; }
  function measure(){ if (!CUR || !LAST) return; var see = viewer();
    LAST.inview = LAST.all.filter(see); LAST.v = LAST.inview.length; LAST.out = LAST.all.filter(function(h){ return LAST.inview.indexOf(h) < 0; }); }
  function paint(){ clearMarks(); if (!CUR) return;
    var hits = hitsOf(CUR.ids), anc = new Set();
    OWN().forEach(function(k){ for (var p = k.parentElement; p && p !== document.body; p = p.parentElement) anc.add(p); });   /* the map's own record is never faded */
    hits.forEach(function(h){ h.classList.add("fl-hit"); var s = styleOf(h, CUR.ids);
      if (s.hov) h.classList.add("fl-hov"); if (s.prop) h.classList.add("fl-prop");
      var p = h.parentElement; while (p && p !== document.body) { anc.add(p); p = p.parentElement; } });
    document.body.dataset.fl = hits.length ? "on" : "none";
    /* the rest fades only while a light is a PREVIEW (the pointer on a node). A kept light — what a click leaves — outlines
       and fades nothing: a click always SHOWS, and dimming the rest of the bench until it is cleared is a filter, which
       D-022 gives to Keep only alone */
    if (OPT.rest === "dim" && CUR !== KEEP) BENCH.forEach(function(s){ var r = document.querySelector(s); if (!r) return;
      (function walk(n){ [].forEach.call(n.children, function(c){ if (c.classList.contains("fl-hit") || c.classList.contains("mrec")) return;
          if (anc.has(c)) { c.classList.add("fl-anc"); walk(c); } else c.classList.add("fl-dim"); }); })(r); });
    var by = {}; REGIONS.forEach(function(r){ by[r] = hits.filter(function(h){ return regionOf(h) === r; }).length; });
    LAST = { ids: CUR.ids.slice(), what: CUR.what, kept: CUR === KEEP, n: hits.length, by: by, all: hits, els: hits.slice(0, 40) };
    measure(); say(); drawKeep(); drawSweep(); }
  function light(ids, what){ CUR = { ids: idsOf(ids), what: what || null }; paint(); }
  function unlight(){ CUR = KEEP; if (CUR) paint(); else { clearMarks(); say(); drawSweep(); } }
  function keep(ids, what){ KEEP = { ids: idsOf(ids), what: what || null }; CUR = KEEP; NEXT = 0; paint(); }
  function clear(){ KEEP = null; CUR = null; clearMarks(); say(); drawKeep(); drawSweep(); }
  function regionWords(){ return REGIONS.filter(function(r){ return LAST.by[r]; }).map(function(r){ return (WP[r] || r) + " " + LAST.by[r]; }).join(" · "); }
  /* one line under the lead: what the light does, in words — including a light that found nothing to draw */
  function say(){ var s = document.getElementById("smfl"); if (!s) return;
    if (!CUR) { s.dataset.fl = "idle"; s.textContent = W1("idle", "point at a field or a block to outline what the panels draw for it — click one to keep the outline"); return; }
    var one = CUR.ids.length === 1 ? CUR.ids[0] : null, st = one ? state(one) : null, n = (LAST || {}).n || 0;
    var head = CUR.what || (one ? label(one) : CUR.ids.length + " fields");
    if (n) { s.dataset.fl = "lit";
      s.textContent = fill(W1("lit", "{what} · {n} outlined, {v} in view — {regions}"), { what: head, n: n, v: LAST.v, regions: regionWords() })
        + (LAST.out.length && !KEEP ? " " + W1("litOut", "· click it to keep the outline and walk to the rest") : ""); }
    else if (st === "elsewhere") { s.dataset.fl = "elsewhere";
      s.textContent = fill(W1("elsewhere", "{what} · nothing outlined here — drawn on {where}"), { what: head, where: places(one, 2) }); }
    else if (st === "off") { s.dataset.fl = "none";
      s.textContent = fill(W1("off", "{what} · nothing outlined — {why}"), { what: head, why: W1("markOff", "behind a switch no control reaches yet") }); }
    else if (st === "none") { s.dataset.fl = "none";
      s.textContent = fill(W1("none", "{what} · not drawn by the lab — nothing outlined"), { what: head }); }
    else { s.dataset.fl = "none"; s.textContent = fill(W1("noneBlock", "{what} · none of its fields is drawn here — nothing outlined"), { what: head }); } }
  /* THE KEPT LIGHT says so at the top of the rail, on every rail tab, until it is cleared (D-022) */
  function drawKeep(){ var host = document.getElementById("flkeep"), notes = document.getElementById("notes");
    if (!host && notes) { host = document.createElement("div"); host.id = "flkeep"; host.hidden = true; notes.insertBefore(host, notes.firstChild); }
    if (!host) return;
    if (!KEEP) { host.hidden = true; host.innerHTML = ""; return; }
    host.hidden = false; host.innerHTML = "";
    var n = (LAST || {}).n || 0, t = document.createElement("span"); t.className = "flkt";
    t.textContent = fill(W1("kept", "kept: {what} · {n} outlined, {v} in view"), { what: KEEP.what || (KEEP.ids.length === 1 ? label(KEEP.ids[0]) : KEEP.ids.length + " fields"),
      n: n, v: (LAST || {}).v || 0 });
    host.append(t);
    function btn(cls, word, tip, fn, off){ var b = document.createElement("button"); b.type = "button"; b.className = "flkb " + cls; b.textContent = word; b.disabled = !!off;
      if (window.hoverBind && window.hcard) window.hoverBind(b, window.hcard({ title: word, icon: "info", plain: tip }));
      b.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); fn(); }; host.append(b); }
    var out = (LAST || {}).out || [];
    btn("flnext", fill(W1("next", "next out of view ({n})"), { n: out.length }), W1("tipNext", "scrolls to the next outlined element that is out of view"), next, !out.length);
    btn("flclear", W1("clear", "clear"), W1("tipClear", "takes the kept outline off — Esc does the same"), clear); }
  /* walk to the next outlined element that is out of view, in page order */
  function next(){ if (!LAST || !LAST.out.length) return;
    var el = LAST.out[NEXT % LAST.out.length]; NEXT++;
    el.scrollIntoView({ block: "center", inline: "nearest" });
    measure(); say(); drawKeep(); }
  /* after every render: the same ids are re-lit on the NEW elements, and the tree is repainted in place */
  DRAWN.onChange(function(){ if (CUR) paint(); paintTree(); paintQuiet(); });
  /* a scroll moves elements in and out of view: the counts follow, one frame later */
  var rafView = 0;
  function onView(){ if (rafView) return; rafView = requestAnimationFrame(function(){ rafView = 0; if (CUR) { measure(); say(); drawKeep(); } paintTree(); drawSweep(); }); }
  document.addEventListener("scroll", onView, true); window.addEventListener("resize", onView);
  document.addEventListener("keydown", function(ev){ if (ev.key === "Escape" && KEEP) clear(); });

  /* ── the tree, repainted in place from DRAWN (smDraw builds the rows; this only fills the field marks) ── */
  function paintTree(){ var host = document.getElementById("smtree"); if (!host) return;
    host.dataset.prop = OPT.prop === "marked" ? "on" : "off";
    var see = viewer();
    [].forEach.call(host.querySelectorAll(".sma[data-sm]"), function(n){ var id = n.dataset.sm, st = state(id), els = DRAWN.els(id);
      n.dataset.fd = st; n.dataset.fsrc = srcOf(id) || "none"; n.dataset.fprop = String(tieOf(id).a);
      var m = n.querySelector(".smfd"); if (!m) { m = document.createElement("span"); m.className = "smfd"; n.append(m); }
      m.dataset.n = String(els.length); m.dataset.v = String(els.filter(see).length);
      m.textContent = st === "here" ? fill(W1("markHere", "drawn here · places {n} · in view {v}"), { n: els.length, v: m.dataset.v })
        : st === "elsewhere" ? W1("markElse", "on another part") : st === "off" ? W1("markOff", "behind a switch no control reaches yet") : W1("markNone", "not drawn by the lab"); });
    [].forEach.call(host.querySelectorAll(".smb[data-sm]"), function(btn){ var b = (SM.blocks || []).filter(function(x){ return x.key === btn.dataset.sm; })[0]; if (!b) return;
      var k = blockCount(b); btn.dataset.fdn = String(k.drawn); btn.dataset.fdof = String(k.of); btn.dataset.fdelse = String(k.elsewhere);
      var m = btn.querySelector(".smfn"); if (!m) { m = document.createElement("span"); m.className = "smfn"; btn.append(m); }
      m.textContent = fill(W1("blockCount", "{n} of {m} fields drawn here"), { n: k.drawn, m: k.of })
        + (k.elsewhere ? fill(W1("blockElse", " · {e} on another part"), { e: k.elsewhere }) : ""); });
    [].forEach.call(host.querySelectorAll(".smn[data-ids]"), function(btn){ var ids = idsOf(btn.dataset.ids);
      var m = btn.querySelector(".smfn"); if (!ids.length) { if (m) m.remove(); return; }
      var n = ids.filter(function(id){ return DRAWN.has(id); }).length, e = ids.filter(function(id){ return state(id) === "elsewhere"; }).length;
      btn.dataset.fdn = String(n); btn.dataset.fdof = String(ids.length);
      if (!m) { m = document.createElement("span"); m.className = "smfn"; btn.append(m); }
      m.textContent = fill(W1("blockCount", "{n} of {m} fields drawn here"), { n: n, m: ids.length }) + (e ? fill(W1("blockElse", " · {e} on another part"), { e: e }) : ""); });
    var o = totals(), t = document.getElementById("smfln");
    if (t) t.textContent = fill(W1("totals", "the lab draws {drawn} of {of} fields · {none} not drawn"), { drawn: o.of - o.none, of: o.of, none: o.none });
    /* D-017: HOW the lab ties each field to what it draws is about the map — behind "more information" */
    var mo = document.getElementById("smflmore");
    if (mo) mo.textContent = fill(W1("moreCounts", "{generated} · {authored} · {none}"), { generated: o.generated, authored: o.authored, both: o.both, none: o.none,
      notDrawn: o.notDrawn.map(function(id){ var a = attrs()[id]; return a ? a.r + " " + a.label : id; }).join(" · ") || "—" }); }

  /* ── the hover card rows for an attribute: where it is drawn, in the words file's words (D-009: an element, richer).
        Whether the tie is a selector the agent wrote is about the map, so it rides HERE, on the hover card (D-017, D-018) ── */
  function rows(id){ var c = DRAWN.count(id), st = state(id), out = [], see = viewer(), v = DRAWN.els(id).filter(see).length;
    out.push([W1("rowHere", "drawn now"), st === "here" ? REGIONS.filter(function(r){ return c[r]; }).map(function(r){ return (WP[r] || r) + " " + c[r]; }).join(" · ")
      + " · " + fill(W1("rowInView", "{v} in view"), { v: v }) : W1("rowNot", "nothing on the bench now")]);
    out.push([W1("rowWhere", "drawn by the lab on"), where(id).length ? places(id, 4) : st === "off" ? W1("markOff", "behind a switch no control reaches yet") : W1("markNone", "not drawn by the lab")]);
    if (tieOf(id).a) out.push([W1("rowProposal", "a proposal"), W1("proposal", "a selector I wrote ties this field to what the panels draw — the renderer does not say it")]);
    return out; }

  /* ── the rail options (the agent's picks marked with a dashed ring) and the key to the outline's styles ── */
  function drawOpts(){ var host = document.getElementById("smflopt"); if (!host) return; host.innerHTML = "";
    OPTS.forEach(function(o){ var row = document.createElement("div"); row.className = "smflo"; row.dataset.opt = o.key;
      var l = document.createElement("span"); l.className = "smflk"; l.textContent = W1("opt_" + o.key, o.key); row.append(l);
      o.vals.forEach(function(v){ var b = document.createElement("button"); b.type = "button"; b.className = "smflb" + (OPT[o.key] === v ? " on" : "") + (o.pick === v ? " pick" : "");
        b.dataset.v = v; b.textContent = W1("val_" + v, v);
        if (window.hoverBind && window.hcard) window.hoverBind(b, window.hcard({ title: W1("val_" + v, v), icon: "info",
          plain: W1("tip_" + v, v) + (o.pick === v ? " " + W1("tipPick", "(my pick — dashed)") : "") }));
        b.onclick = function(ev){ ev.stopPropagation(); setOpt(o.key, v); };
        row.append(b); });
      host.append(row); });
    var k = document.createElement("div"); k.className = "smflkey"; k.id = "smflkey";
    [["solid", W1("keySolid", "solid — on its face")], ["dotted", W1("keyDotted", "dotted — only in its hover card")]]
      .concat(OPT.prop === "marked" ? [["dashed", W1("keyDashed", "dashed — a tie I wrote as a selector")]] : [])
      .forEach(function(x){ var s = document.createElement("span"); s.className = "smflks"; s.dataset.style = x[0];
        var sw = document.createElement("i"); sw.style.outlineStyle = x[0]; s.append(sw, document.createTextNode(x[1])); k.append(s); });
    host.append(k);
    say(); }
  function setOpt(k, v){ OPT[k] = v; drawOpts(); paintTree(); if (CUR) paint(); }

  /* ── the CATALOG: every place the lab can draw a field, rendered off-screen once at boot ── */
  function walk(env){ var PN = window.PANELS, S = window.STATION, CMD = window.CMD, CK = window.CMDKIT; if (!PN || !CK) return;
    var ghost = document.createElement("div");
    ghost.style.cssText = "position:absolute;left:-99999px;top:0;width:1100px;height:420px;overflow:hidden";
    document.body.appendChild(ghost);
    var SEL = window.SEL = window.SEL || {}, keep0 = {}; Object.keys(SEL).forEach(function(k){ keep0[k] = SEL[k]; });
    var ck = {}; ["layout", "verbs", "mode", "grp", "only"].forEach(function(k){ ck[k] = CMD[k]; });
    var mi = window.MOREINFO, fm = (F.forms && F.forms.state === "present") ? F.forms : null;
    /* tgt — how Follow reaches the place: its region, and the selection that draws it (a part and a distribution · a
       path · an ending · a case · a part's record with one thing picked · a level of the command card). A place behind
       the switch that is off carries none: no move reaches it */
    function one(where, region, fn, off, tgt){ ghost.innerHTML = ""; if (tgt) tgt.region = region;
      DRAWN.begin(region, { ghost: true, where: where, host: ghost, off: off, tgt: off ? null : tgt });
      try { fn(ghost); } catch (e) { console.warn("field walk " + where, e); } finally { DRAWN.end(); } }
    function pw(k){ return (PN[k] || {}).word || k; }
    try {
      /* the middle: every distribution of every part is walked by the lab's own preWalk (env.middle); a distribution
         that draws the path itself is walked again with each path in force, and every other one is walked once more
         with its part's fullest path projected onto it (the projection adds the chips that path's facts draw) */
      (window.PARTORDER || Object.keys(PN)).forEach(function(k){
        var full = fm ? (fm.paths || []).slice().sort(function(a, b){ return CK.partFacts(F, b, k).n - CK.partFacts(F, a, k).n; })[0] : null;
        PN[k].variants.forEach(function(v){ if (!fm) return;
          var pv = fill(WP.middlePath || "{part} · {variant}, a path picked", { part: pw(k), variant: v.label });
          if (v.pathAware) (fm.paths || []).forEach(function(p){ SEL.path = p.id; SEL.exit = p.exit ? p.exit.id : null;
            one(pv, "middle", function(g){ v.render(g, F, S); }, false, { part: k, variant: v.key, path: p.id }); });
          else if (full) { SEL.path = full.id; SEL.exit = full.exit ? full.exit.id : null;
            var PV = window.PANELVAR;   /* the projection asks which distribution is live — here, the one being walked */
            window.PANELVAR = function(x){ return x === k ? v.key : PV(x); };
            try { one(pv, "middle", function(g){ v.render(g, F, S); CK.applyPath(g, k, full); }, false, { part: k, variant: v.key, path: full.id }); } finally { window.PANELVAR = PV; } }
          SEL.path = null; SEL.exit = null; }); });
      /* the command panel: each layout, and the card's verbs and its path grid */
      [["card", "rows", "cmd"], ["card", "g2", "cmd"], ["card", "g2", "path"], ["ladder"], ["matrix"]].forEach(function(L){
        CMD.layout = L[0]; if (L[1]) CMD.verbs = L[1]; if (L[2]) CMD.mode = L[2]; CMD.grp = null; CMD.only = null;
        one(fill(WP["cmd_" + L.join("_")] || "the command panel · {l}", { l: L.join(" ") }), "command", function(g){ CK.render(g, F, S); }, false,
          { cmd: { layout: L[0], verbs: L[1] || null, mode: L[2] || null } }); });
      if (CK.strip) one(WP.cmd_strip || "the command panel · strip", "command", function(g){ CK.strip(g, F, S); }, false, { cmd: { layout: "strip" } });
      /* the portrait: each part's own records with each thing picked in turn, and the three records the command lends */
      var picks = { data: (F.data.tables || []).map(function(t){ return t.table; }),
                    schemas: window.SCHSHAPES ? window.SCHSHAPES().map(function(s){ return s.name; }) : [],
                    functions: (window.FNNAMES ? window.FNNAMES() : []) };
      Object.keys(picks).forEach(function(k){ (PN[k].portraits || []).forEach(function(pv){
        picks[k].forEach(function(id){ SEL[k] = id; one(fill(WP.portOwn || "the portrait · {part} {variant}", { part: pw(k), variant: pv.label }), "portrait", function(g){ pv.render(g, F, S); }, false,
          { part: k, port: pv.key, pick: id }); });
        /* D-017's switch (window.MOREINFO) has no control on the page yet: what it draws is catalogued APART, as a place
           no control reaches, never as "another part" */
        if (k === "data" && pv.key === "record") { window.MOREINFO = true;
          picks[k].forEach(function(id){ SEL[k] = id; one(fill(WP.portMore || "the portrait · {part} {variant}, with the switch that is off", { part: pw(k), variant: pv.label }), "portrait", function(g){ pv.render(g, F, S); }, true); });
          window.MOREINFO = mi; }
        SEL[k] = null; }); });
      if (fm) { (fm.paths || []).forEach(function(p){ SEL.path = p.id; SEL.exit = p.exit ? p.exit.id : null; SEL["case"] = null;
          CK.portraits(F).forEach(function(pv){ if (pv.key === "cmd-path") one(WP.portPath || "the portrait · a path's record", "portrait", function(g){ pv.render(g, F, S); }, false, { lent: "cmd-path", path: p.id }); }); });
        SEL.path = null;
        (fm.exits || []).forEach(function(e){ SEL.exit = e.id;
          CK.portraits(F).forEach(function(pv){ if (pv.key === "cmd-exit") one(WP.portExit || "the portrait · an ending's record", "portrait", function(g){ pv.render(g, F, S); }, false, { lent: "cmd-exit", exit: e.id }); }); });
        SEL.exit = null;
        var cids = {}; (fm.exits || []).forEach(function(e){ (e.tests || []).forEach(function(t){ cids[t["case"]] = 1; }); });
        Object.keys(cids).forEach(function(cid){ SEL["case"] = cid;
          CK.portraits(F).forEach(function(pv){ if (pv.key === "cmd-case") one(WP.portCase || "the portrait · a case's record", "portrait", function(g){ pv.render(g, F, S); }, false, { lent: "cmd-case", "case": cid }); }); }); }
    } finally {
      Object.keys(SEL).forEach(function(k){ if (!(k in keep0)) delete SEL[k]; });
      Object.keys(keep0).forEach(function(k){ SEL[k] = keep0[k]; });
      Object.keys(ck).forEach(function(k){ CMD[k] = ck[k]; }); window.MOREINFO = mi;
      ghost.remove(); } }

  /* a short phrase per lit element, for the feedback note: the region and the words the element itself shows */
  function describe(el){ var r = regionOf(el) || "?", d = el.dataset || {};
    var t = String(el.innerText || el.textContent || "").split("\n").map(function(x){ return x.replace(/\s+/g, " ").trim(); }).filter(Boolean)[0] || "";   /* its first line of words */
    if (t.length > 36) t = t.slice(0, 35) + "…";
    var k = t ? "“" + t + "”" : d.table ? "table " + d.table : d.path ? "path " + d.path : d.exit ? "exit " + d.exit : d.step ? "step " + d.step
      : d.fn ? "function " + d.fn : d["case"] ? "case " + d["case"] : d.stage ? "stage " + d.stage : W1("noText", "an element with no words of its own");
    return (WP[r] || r) + " " + k; }
  /* the look the rail is set to, in the options' own words — the copy line carries it */
  function look(){ return fill(W1("noteLook", "look — outline {hold} · the rest {rest} · proposals {prop}"),
    { hold: W1("val_" + OPT.hold, OPT.hold), rest: W1("val_" + OPT.rest, OPT.rest), prop: W1("val_" + OPT.prop, OPT.prop) }); }

  window.FIELDMAP = {
    state: state, where: where, places: places, src: srcOf, tie: tieOf, blockCount: blockCount, totals: totals, rows: rows,
    light: light, unlight: unlight, keep: keep, clear: clear, next: next, paintTree: paintTree, drawOpts: drawOpts, walk: walk,
    lit: function(){ return [].slice.call(document.querySelectorAll(".fl-hit")); },
    current: function(){ return CUR ? { ids: CUR.ids.slice(), what: CUR.what } : null; },
    kept: function(){ return KEEP ? { ids: KEEP.ids.slice(), what: KEEP.what } : null; },
    last: function(){ return LAST; },
    inView: function(el){ return viewer()(el); },
    opt: function(){ return { hold: OPT.hold, rest: OPT.rest, prop: OPT.prop }; },
    setOpt: setOpt,
    look: look,
    /* a tree node: pointing previews it (unless the rail says only a click lights), leaving goes back to what is kept,
       a click keeps it (D-022: a click always shows) */
    hover: function(node, ids, what){ node.addEventListener("mouseenter", function(){ if (OPT.hold === "point") light(ids, what); });
      node.addEventListener("mouseleave", function(){ if (CUR !== KEEP) unlight(); }); },
    bind: function(node, ids, what){ window.FIELDMAP.hover(node, ids, what);
      node.addEventListener("click", function(ev){ ev.stopPropagation(); keep(ids, what); }); },
    /* Show — the block's own click */
    show: function(ids, what){ keep(ids, what); },
    describe: describe,
    words: function(k, d){ return W1(k, d); },
    place: function(k, tok){ return fill(WP[k] || k, tok || {}); } };

  /* ═══ LABMAP — THE BRAIN MAP'S NAVIGATION, FOLDED INTO THE LAB (D-024; rulings D-021 · D-022 · D-032) ═════════════
     What only brainmap-endpoint.html had, rebuilt on the lab's section map so that page could retire (it is a record now,
     design-context/records/brainmap/):
       · the GROUPINGS — Flat · By standpoint · By section · By stage. By stage draws his record's eight rows (six
         stages, the UNCAUGHT bay, the CLIENT screen) then Across the stages, under the rule the switch names: under
         every stage a block touches (the agent's pick) or under Across the stages (D-021 as recorded). The lists are
         the brain map's own (LABEP.mapnav.stages[].under), never recomputed here.
       · KEEP ONLY (D-022, option C) — its own control, never a click. It keeps the node shown last, says in words
         what it keeps and how many nodes are quiet, and dims (never removes) the map's nodes that do not carry it AND,
         through the field layer, the bench elements that do not carry its fields. It survives part, grouping and
         placement changes until it is removed, and while it is on a bar at the top of the rail says so on EVERY rail
         tab, whichever tab or placement hides the map's own chip. A click never dims the bench (the field layer fades
         the rest only while the pointer previews), so the filter is the one thing that quiets it.
       · THE MOVES — a click SHOWS (the bench moves to the part, the fields light); Open (the portrait) and Follow
         (wherever the field is drawn: a part, a record in the portrait, a level of the command card — never a rail
         setting) are moves the node offers. Every move names the region that answers.
       · THE RECORDS — Open keeps every record it drew, newest first, each closing on its own (the brain map's tray,
         its pick) or one at a time: a rail option.
       · THE KEYBOARD — Tab reaches every node, fields included; Enter or Space shows it; the arrow keys move between
         nodes and levels and fold them; Escape, from the tree, closes the newest record.
       · WHAT A RELOAD KEEPS — the grouping, the rule, the placement, the line, the records option, Keep only, the open
         folds and the open records (browser storage, this viewer only; the page works without it).
       · THE PLACEMENT — the rail tab · a column right of the panels · full width below them. The agent's pick marked.
       · THE SWEEP — a line from the node shown last to the nearest element it lit (the lab's hop, the agent's pick) or
         to the panel that answers the last move (the brain map's hop), or none — a rail option; drawn whole (D-004),
         one short hop between two real things (D-032: "the arrow is weird").
     NOT CARRIED YET, and listed so under "more information" (notCarried in map-nav.words.json): the brain map's DRAWN
     layouts A–D (As sketched at about 45°, his ask in D-032) with the layout pick and Replay, and shared fields as one
     band with wires to every block. The retired page still draws them, as a record (records/brainmap/).
     The tree's rows for the root, a block and a field stay the page's (SMKIT); this section arranges them. Every word
     is map-nav.words.json's or the brain map's own (LABEP.mapnav); every number is counted here. Lab chrome. */
  var NV = F.mapnav || { state: "absent", reason: "this feed carries no navigation for the map" };
  var NW = NV.words || {}, NS = NW.strings || {};
  var NAVOK = NV.state === "present" || NV.state === "stale";
  function N1(k, d){ var v = NS[k]; return typeof v === "string" && v ? v : d; }
  function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function mk(t, c, x){ var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function hv(el, html){ if (window.hoverBind) window.hoverBind(el, html); }
  function hc(o){ return window.hcard ? window.hcard(o) : ""; }
  var GRPS = ["flat", "standpoint", "section", "stage"], PLACES = ["rail", "right", "below"], SWEEPS = ["on", "panel", "off"], RECS = ["stack", "one"];
  var PICK = { grp: (NW.grouping || {}).pick || "flat", srule: (NV.stageRule || {})["default"] || "every",
               place: (NW.placement || {}).pick || "rail", sweep: (NW.sweep || {}).pick || "on", recs: (NW.records || {}).pick || "stack" };
  /* recs — the records Open drew, newest first · ans — the region that answered the last move (the sweep's panel end) ·
     fol — where Follow went last, per field, so the next Follow goes on to the next place */
  var MS = { grp: PICK.grp, srule: PICK.srule, place: PICK.place, sweep: PICK.sweep, recmode: PICK.recs, keep: null, last: null, open: {}, recs: [],
             ans: null, fol: {}, K: null };
  var QUIET = { kept: 0, quiet: 0 }, DEEP = 0, DEEPS = {}, SWEEP = null;
  /* WHAT A RELOAD KEEPS (the brain map kept its picks, switches and open panels): this viewer's browser storage only, read
     and written inside try/catch — a private window or blocked storage boots on the picks, nothing breaks */
  var STORE = "eplab.mapnav", RESTORED = false;                     /* nothing is written before what was kept is read back */
  function save(){ if (!RESTORED) return; try { window.localStorage.setItem(STORE, JSON.stringify({ grp: MS.grp, srule: MS.srule, place: MS.place, sweep: MS.sweep,
      recmode: MS.recmode, keep: MS.keep, open: Object.keys(MS.open).filter(function(k){ return MS.open[k]; }), recs: MS.recs })); } catch (e) { /* storage off */ } }
  function restore(){ RESTORED = true; var o = null; try { o = JSON.parse(window.localStorage.getItem(STORE) || "null"); } catch (e) { o = null; }
    if (!o || typeof o !== "object") return;
    if (GRPS.indexOf(o.grp) >= 0) MS.grp = o.grp;
    if ((NV.stageRules || []).indexOf(o.srule) >= 0) MS.srule = o.srule;
    if (PLACES.indexOf(o.place) >= 0) MS.place = o.place;
    if (SWEEPS.indexOf(o.sweep) >= 0) MS.sweep = o.sweep;
    if (RECS.indexOf(o.recmode) >= 0) MS.recmode = o.recmode;
    if (o.keep && o.keep !== "root" && subj(o.keep)) MS.keep = o.keep;
    (Array.isArray(o.open) ? o.open : []).forEach(function(k){ if (subj(k)) MS.open[k] = true; });
    MS.recs = (Array.isArray(o.recs) ? o.recs : []).filter(function(k){ return !!subj(k); }); }

  /* ── the subjects a node can be: root · block:<key> · attr:<id> · group:<key> · stage:<key> · sec:<key> · added:x ── */
  function blockOf(k){ return (SM.blocks || []).filter(function(b){ return b.key === k; })[0] || null; }
  function groupOf(k){ return (NV.groups || []).filter(function(g){ return g.key === k; })[0] || null; }
  function stageOf(k){ return (NV.stages || []).filter(function(s){ return s.key === k; })[0] || null; }
  function secOf(k){ return (SM.sections || []).filter(function(s){ return s.key === k; })[0] || null; }
  function bIds(b){ return b ? (b.own || []).concat(b.shared || []) : []; }
  function stBlocks(st){ return ((st && st.under) || {})[MS.srule] || []; }
  function uniq(a){ var o = {}; return a.filter(function(x){ if (o[x]) return false; o[x] = 1; return true; }); }
  function subj(pk){ if (!pk) return null; if (pk === "root") return { kind: "root" };
    var i = pk.indexOf(":"), t = pk.slice(0, i), v = pk.slice(i + 1), x;
    if (t === "block") return (x = blockOf(v)) ? { kind: "block", b: x } : null;
    if (t === "attr") return (x = attrs()[v]) ? { kind: "attr", a: x, id: v } : null;
    if (t === "group") return (x = groupOf(v)) ? { kind: "group", g: x } : null;
    if (t === "stage") return (x = stageOf(v)) ? { kind: "stage", st: x } : null;
    if (t === "sec") return (x = secOf(v)) ? { kind: "sec", s: x } : null;
    if (t === "added") return { kind: "added" };
    return null; }
  function idsOfPk(pk){ var s = subj(pk); if (!s) return [];
    if (s.kind === "root") return Object.keys(attrs());
    if (s.kind === "block") return bIds(s.b);
    if (s.kind === "attr") return [s.id];
    if (s.kind === "group") return uniq([].concat.apply([], s.g.blocks.map(function(k){ return bIds(blockOf(k)); })));
    if (s.kind === "stage") return uniq([].concat.apply([], stBlocks(s.st).map(function(k){ return bIds(blockOf(k)); })));
    if (s.kind === "sec") return s.s.attrs.slice();
    return (SM.unplaced || []).slice(); }
  function nameOf(pk){ var s = subj(pk); if (!s) return pk;
    return s.kind === "root" ? ((SM.root || {}).name || pk) : s.kind === "block" ? s.b.name : s.kind === "attr" ? s.a.label
      : s.kind === "group" ? s.g.name : s.kind === "stage" ? s.st.name : s.kind === "sec" ? s.s.short : ((NV.added || {}).name || pk); }
  function kindOf(pk){ var s = subj(pk); return s ? s.kind : null; }
  function kindWord(k){ return (NW.kinds || {})[k] || k; }
  function ruleName(r){ return ((((NV.stageRule || {}).opts || {})[r || MS.srule]) || {}).name || (r || MS.srule); }

  /* ── KEEP ONLY: what the kept node carries (the brain map's own rule) ── */
  function holders(id){ return (SM.blocks || []).filter(function(b){ return bIds(b).indexOf(id) >= 0; }).map(function(b){ return b.key; }); }
  function keepSets(){ if (!MS.keep) return null; var s = subj(MS.keep); if (!s || s.kind === "root") return null;
    var ka = {}, kb = {};
    function addB(k){ kb[k] = 1; bIds(blockOf(k)).forEach(function(id){ ka[id] = 1; }); }
    if (s.kind === "block") addB(s.b.key);
    else if (s.kind === "attr") { ka[s.id] = 1; holders(s.id).forEach(function(k){ kb[k] = 1; }); }
    else if (s.kind === "group") s.g.blocks.forEach(addB);
    else if (s.kind === "stage") stBlocks(s.st).forEach(addB);
    else if (s.kind === "sec") s.s.attrs.forEach(function(id){ ka[id] = 1; holders(id).forEach(function(k){ kb[k] = 1; }); });
    else (SM.unplaced || []).forEach(function(id){ ka[id] = 1; });
    return { a: ka, b: kb }; }
  function carries(pk, Q){ if (!Q || pk === "root") return true; var s = subj(pk); if (!s) return true;
    if (s.kind === "attr") return !!Q.a[s.id];
    if (s.kind === "block") return !!Q.b[s.b.key];
    if (s.kind === "group") return s.g.blocks.some(function(k){ return Q.b[k]; });
    if (s.kind === "stage") return stBlocks(s.st).some(function(k){ return Q.b[k]; });
    if (s.kind === "sec") return s.s.attrs.some(function(id){ return Q.a[id]; });
    return (SM.unplaced || []).some(function(id){ return Q.a[id]; }); }
  /* the BENCH half, through the field layer: every element that neither carries a kept field, nor holds one, nor sits
     inside one goes quiet — dimmed, never removed. Re-run after every render, so it survives a part change. */
  function paintQuiet(){ [].forEach.call(document.querySelectorAll(".fl-quiet"), function(e){ e.classList.remove("fl-quiet"); });
    var Q = keepSets(); document.body.dataset.keep = Q ? "on" : "off"; QUIET = { kept: 0, quiet: 0 };
    if (!Q) return;
    var hits = new Set(); Object.keys(Q.a).forEach(function(id){ DRAWN.els(id).forEach(function(e){ hits.add(e); }); });
    var anc = new Set(); hits.forEach(function(h){ for (var p = h.parentElement; p && p !== document.body; p = p.parentElement) anc.add(p); });
    OWN().forEach(function(k){ for (var p = k.parentElement; p && p !== document.body; p = p.parentElement) anc.add(p); });   /* nor quieted */
    BENCH.forEach(function(sel){ var r = document.querySelector(sel); if (!r) return;
      (function walk(n){ [].forEach.call(n.children, function(c){ if (hits.has(c) || c.classList.contains("mrec")) return; if (anc.has(c)) walk(c); else c.classList.add("fl-quiet"); }); })(r); });
    QUIET = { kept: hits.size, quiet: document.querySelectorAll(".fl-quiet").length };
    var line = document.querySelector("#smkeepc .smkbench"); if (line) line.textContent = benchLine();   /* a re-render recounts the chip */
    var bl = document.querySelector("#mkeep .mkb"); if (bl) bl.textContent = " " + benchLine(); }       /* and the rail's bar */
  function benchLine(){ var K = NW.keep || {}; return QUIET.kept ? fill((QUIET.kept === 1 && K.benchOne) || K.bench || "{n}", { n: QUIET.kept }) : K.benchNone; }

  /* ── THE TREE, arranged for the grouping. The page lends its rows (K = SMKIT); this decides where they hang. ── */
  function level1(g){
    if (g === "standpoint") return (NV.groups || []).map(function(x){ return { pk: "group:" + x.key, kind: "group", name: x.name,
      sub: fill(N1("nFields", "{n} fields"), { n: x.n }), blocks: x.blocks }; });
    if (g === "section") return (SM.sections || []).map(function(x){ return { pk: "sec:" + x.key, kind: "sec", name: x.short,
      sub: fill(N1("nFields", "{n} fields"), { n: x.attrs.length }), attrs: x.attrs }; });
    if (g === "stage") return (NV.stages || []).map(function(x){ var bs = stBlocks(x);
      return { pk: "stage:" + x.key, kind: "stage", name: x.name, mark: x.mark || null, strk: x.kind, across: !!x.across, empty: !bs.length, blocks: bs,
        sub: bs.length ? fill(N1(bs.length === 1 ? "oneBlock" : "nBlocks", "{n} blocks"), { n: bs.length }) : N1("noBlock", "no block here") }; });
    return []; }
  function mark(el, pk, parent, depth, Q){ el.dataset.pk = pk; el.dataset.parent = parent; el.dataset.depth = String(depth);
    if (Q && !carries(pk, Q)) el.dataset.quiet = "true"; else delete el.dataset.quiet; }
  function decoAttrs(scope, parent, depth, Q){
    [].forEach.call(scope.querySelectorAll(".sma[data-sm]"), function(n){ if (n.dataset.pk) return;
      var pk = "attr:" + n.dataset.sm; mark(n, pk, parent, depth, Q);
      n.tabIndex = 0; n.setAttribute("role", "button");            /* a field is a node like any other: Tab reaches it, Enter shows it */
      n.addEventListener("click", function(){ MS.last = pk; MS.ans = "middle"; if (MS.K) MS.K.mark(pk); }); }); }
  function decoBlock(li, bk, parent, depth, Q){ var b = li.querySelector(".smb"); if (b) mark(b, "block:" + bk, parent, depth, Q);
    decoAttrs(li, "block:" + bk, depth + 1, Q); return li; }
  function levelNode(n, last, Q, K){
    var li = mk("li"), row = mk("div", "smrow"), open = !!MS.open[n.pk], ids = idsOfPk(n.pk);
    row.append(mk("span", "smtw", last ? "└─ " : "├─ "));
    var fold = mk("button", "smfold smnf", open ? "▾" : "▸"); fold.type = "button"; fold.dataset.fold = n.pk; fold.dataset.open = String(open);
    fold.setAttribute("aria-label", K.words("foldWord", "fold"));
    hv(fold, hc({ title: esc(K.words("foldWord", "fold")), icon: "info", plain: esc(K.words("foldTip", "")) }));
    fold.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); MS.open[n.pk] = !MS.open[n.pk]; K.draw(); };
    row.append(fold);
    var b = mk("button", "smn"); b.type = "button"; b.dataset.kind = n.kind; b.dataset.open = String(open); b.dataset.ids = ids.join(" ");
    b.setAttribute("aria-pressed", String(open));
    if (n.kind === "stage") { b.dataset.strk = n.strk || "stage"; b.dataset.empty = String(!!n.empty); b.dataset.across = String(!!n.across); }
    mark(b, n.pk, "root", 1, Q);
    b.append(mk("span", "smnn", n.name), mk("span", "smct", n.sub));
    if (n.mark) b.append(mk("span", "smmk", n.mark));             // the record's own words for what this row IS
    hv(b, function(){ return nodeCard(n.pk); });
    window.FIELDMAP.hover(b, ids, n.name);
    b.onclick = function(ev){ ev.stopPropagation(); show(n.pk); };
    row.append(b); li.append(row);
    if (open) { var kids = mk("ul"), gut = last ? "    " : "│   ";
      if (n.attrs) n.attrs.forEach(function(id, j){ var a = attrs()[id];
        var c = K.attrRow(id, !!(a && a.shared), gut + (j === n.attrs.length - 1 ? "└─ " : "├─ ")); decoAttrs(c, n.pk, 2, Q); kids.append(c); });
      else n.blocks.forEach(function(bk, j){ var bl = blockOf(bk); if (!bl) return;
        kids.append(decoBlock(K.blockRow(bl, { gut: gut + (j === n.blocks.length - 1 ? "└─ " : "├─ "), fold: false }), bk, n.pk, 2, Q));
        /* a block's fields would be a FOURTH level: they are not drawn (the command card's ruling). Counted as FIELDS, each
           once — a shared field sits in several blocks and a block can hang under several rows */
        bIds(bl).forEach(function(id){ DEEPS[id] = 1; }); });
      li.append(kids); }
    return li; }
  function drawTree(host, K){ MS.K = K; host.innerHTML = ""; DEEPS = {}; keysOn(host);
    var Q = keepSets(), g = NAVOK ? MS.grp : "flat";
    host.dataset.grp = g; host.dataset.srule = MS.srule;
    var root = K.rootRow(); mark(root, "root", "", 0, Q); root.tabIndex = 0;
    root.addEventListener("click", function(ev){ ev.stopPropagation(); show("root"); });
    window.FIELDMAP.hover(root, Object.keys(attrs()), nameOf("root"));
    host.append(root);
    var ul = mk("ul"); host.append(ul);
    var add = (SM.unplaced || []).length ? { pk: "added:x", kind: "added", name: (NV.added || {}).name, attrs: SM.unplaced,
      sub: fill(N1("nFields", "{n} fields"), { n: SM.unplaced.length }) } : null;
    if (g === "flat") (SM.blocks || []).forEach(function(b, i){
      ul.append(decoBlock(K.blockRow(b, { last: i === SM.blocks.length - 1 && !add, fold: true }), b.key, "root", 1, Q)); });
    else { var L = level1(g); L.forEach(function(n, i){ ul.append(levelNode(n, i === L.length - 1 && !(add && g !== "section"), Q, K)); }); }
    if (add && g !== "section") ul.append(levelNode(add, true, Q, K));
    DEEP = Object.keys(DEEPS).length;
    var dp = document.getElementById("smdeep");
    if (dp) { dp.hidden = !DEEP; dp.textContent = DEEP ? fill(N1("deep", "{n}"), { n: DEEP, levels: (NV.maxDepth || 2) + 1 }) : ""; }
    placeMoves(); paintQuiet(); drawNav(); drawSweep(); refocus(host); save(); }

  /* ── THE KEYBOARD (the brain map's: every node a button, Enter or Space to show it, the arrows between siblings and
        levels, Escape to close the last panel). Every node is reachable by Tab; a redraw puts the focus back on the node
        it was on, so the arrows keep working after Enter. ── */
  var FOC = null;
  function focusKey(t){ if (!t || !t.dataset) return null;
    if (t.dataset.pk) return "pk|" + t.dataset.pk + "|" + (t.dataset.parent || "");
    if (t.classList.contains("smfold")) return "fold|" + (t.dataset.fold || t.dataset.sm || "");
    if (t.classList.contains("smmvb")) return "mv|" + t.dataset.move;
    return null; }
  function byKey(host, k){ var p = k.split("|");
    if (p[0] === "pk") return [].slice.call(host.querySelectorAll("[data-pk]")).filter(function(n){ return n.dataset.pk === p[1] && (n.dataset.parent || "") === p[2]; })[0]
      || [].slice.call(host.querySelectorAll("[data-pk]")).filter(function(n){ return n.dataset.pk === p[1]; })[0] || null;
    if (p[0] === "fold") return [].slice.call(host.querySelectorAll(".smfold")).filter(function(n){ return (n.dataset.fold || n.dataset.sm) === p[1]; })[0] || null;
    if (p[0] === "mv") return host.querySelector('.smmvb[data-move="' + p[1] + '"]');
    return null; }
  function refocus(host){ var a = document.activeElement;
    if (!FOC || (a && a !== document.body && a.isConnected)) return;
    var n = byKey(host, FOC); if (n) n.focus({ preventScroll: true }); }
  document.addEventListener("focusin", function(ev){ var h = document.getElementById("smtree"); FOC = h && h.contains(ev.target) ? focusKey(ev.target) : null; }, true);
  /* focus that LEAVES the tree (a click on the bench, a Tab out) forgets the node; focus lost to a redraw is put back */
  document.addEventListener("focusout", function(ev){ var t = ev.target, h = document.getElementById("smtree"); if (!h || !h.contains(t)) return;
    setTimeout(function(){ if (t.isConnected && (!document.activeElement || document.activeElement === document.body)) FOC = null; }, 0); }, true);
  function visNodes(host){ return [].slice.call(host.querySelectorAll("[data-pk]")).filter(function(n){ return n.offsetParent !== null; }); }
  function foldOf(n){ var row = n.closest(".smrow"); return row ? row.querySelector(".smfold") : null; }
  function keysOn(host){ if (host.__mapKeys) return; host.__mapKeys = true;
    host.addEventListener("keydown", function(ev){ var t = ev.target; if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.key === "Escape") { if (MS.recs.length) { ev.preventDefault(); ev.stopPropagation(); closeOne(MS.recs[0]); } return; }
      if (!t || !t.dataset || !t.dataset.pk) return;
      if (ev.key === "Enter" || ev.key === " ") { if (t.tagName !== "BUTTON") { ev.preventDefault(); t.click(); } return; }
      var ns = visNodes(host), i = ns.indexOf(t), f = foldOf(t), open = f && f.dataset.open === "true";
      var go = function(n){ if (n) { ev.preventDefault(); n.focus(); } };
      if (ev.key === "ArrowDown") go(ns[i + 1]);
      else if (ev.key === "ArrowUp") go(ns[i - 1]);
      else if (ev.key === "Home") go(ns[0]);
      else if (ev.key === "End") go(ns[ns.length - 1]);
      else if (ev.key === "ArrowRight") { ev.preventDefault(); if (f && !open) f.click(); else go(ns[i + 1] && ns[i + 1].dataset.parent === t.dataset.pk ? ns[i + 1] : null); }
      else if (ev.key === "ArrowLeft") { ev.preventDefault(); if (f && open) f.click();
        else if (t.dataset.parent) go(ns.slice(0, i).reverse().filter(function(n){ return n.dataset.pk === t.dataset.parent; })[0]); } }); }

  /* ── the node's hover card — an ELEMENT, so richer (D-009): what it holds, what a click does, what else it offers ── */
  /* every move names the region that answers it (D-032) — Show's is the words file's byNode.<kind>.where */
  function moveRows(kind){ var M = NW.moves || {}, bn = (M.byNode || {})[kind]; if (!bn) return [];
    var offers = (bn.offers || []).map(function(o){ var m = M[o] || {}; return fill(M.offerRow || "{name} — {where}", { name: m.name, where: m.where }); });
    return [[esc(M.rowClick || "a click"), esc(fill(M.showRow || "{name} — {where} · {what}", { name: (M.show || {}).name || "Show", where: bn.where, what: bn.show }))],
            [esc(M.rowOffers || "it also offers"), esc(offers.join(" · ") || M.offersNone || "")]]; }
  function blockRows(b){ if (MS.grp !== "stage" || !NV.byBlock) return moveRows("block");
    var e = NV.byBlock[b.key] || {}, under = (NV.stages || []).filter(function(st){ return stBlocks(st).indexOf(b.key) >= 0; }).map(function(st){ return st.name; });
    return [[esc(N1("rowStages", "rows")), esc((e.names || []).join(" · ") || N1("recNoStage", "none"))], [esc(N1("rowWhy", "why")), esc(e.why)],
            [esc(N1("rowCites", "cites")), esc(e.cites)], [esc(N1("rowUnder", "drawn under")), esc(under.join(" · ") + " (" + ruleName() + ")")]].concat(moveRows("block")); }
  function nodeCard(pk){ var s = subj(pk); if (!s) return ""; var rows = [], plain = "", value = kindWord(s.kind);
    if (s.kind === "group") { value += " · " + fill(N1("nFields", "{n}"), { n: s.g.n });
      rows.push([esc(N1("rowsBlocks", "blocks")), esc(s.g.blocks.map(function(k){ return nameOf("block:" + k); }).join(" · "))]); plain = s.g.plain; }
    else if (s.kind === "stage") { var bs = stBlocks(s.st); value = ((NW.stageKinds || {})[s.st.kind] || s.st.kind) + (s.st.mark ? " · " + s.st.mark : "");
      rows.push([esc(N1("rowsBlocks", "blocks")), esc(bs.map(function(k){ return nameOf("block:" + k); }).join(" · ") || N1("noBlock", "—"))], [esc(N1("rowRule", "rule")), esc(ruleName())]);
      plain = s.st.across ? (NV.acrossPlain || {})[MS.srule] : s.st.plain + (bs.length ? "" : " " + NV.emptyPlain); }
    else if (s.kind === "sec") { rows.push([esc(N1("rowsHold", "holds")), esc(fill(N1("nFields", "{n}"), { n: s.s.attrs.length }))]); plain = s.s.plain; }
    else if (s.kind === "added") { rows.push([esc(N1("rowsHold", "holds")), esc(fill(N1("nFields", "{n}"), { n: (SM.unplaced || []).length }))]); plain = (NV.added || {}).plain; }
    return hc({ title: esc(nameOf(pk)), value: esc(value), icon: s.kind === "stage" ? "journey" : "layers", rows: rows.concat(moveRows(s.kind)), plain: esc(plain) }); }

  /* ── SHOW — what every click on a node does (D-022). It never turns Keep only on. ── */
  function show(pk){ var s = subj(pk), K = MS.K; if (!s || !K) return;
    MS.last = pk; MS.ans = "middle";
    if (s.kind === "block") { K.go(s.b); return; }                  // the page's move: the bench goes to the block's page, and its fields light
    if (s.kind !== "root" && s.kind !== "attr") MS.open[pk] = true;
    keep(idsOfPk(pk), nameOf(pk)); K.mark(pk); }
  /* the moves the node shown last offers, drawn under it */
  function nodeEls(pk){ var h = document.getElementById("smtree"); return h ? [].slice.call(h.querySelectorAll('[data-pk="' + pk.replace(/"/g, '\\"') + '"]')) : []; }
  function placeMoves(){ var h = document.getElementById("smtree"); if (!h) return;
    [].forEach.call(h.querySelectorAll(".smmv"), function(e){ e.remove(); });
    if (!MS.last) return; var n = nodeEls(MS.last)[0]; if (!n) return;
    var M = NW.moves || {}, offers = ((M.byNode || {})[kindOf(MS.last)] || {}).offers || []; if (!offers.length) return;
    var box = mk("div", "smmv"); box.dataset.for = MS.last;
    offers.forEach(function(o){ var m = M[o] || {}, b = mk("button", "smmvb"); b.type = "button"; b.dataset.move = o;
      b.innerHTML = (window.STATION ? window.STATION.icon(m.icon, 13) : "") + "<span>" + esc(m.name) + "</span>";
      hv(b, hc({ title: esc(m.name), value: esc(m.where), icon: m.icon, plain: esc(m.tip) }));   // a control: one short line
      b.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide();
        if (o === "open") openRec(box.dataset.for); else if (o === "follow") follow(box.dataset.for); };
      box.append(b); });
    var row = n.closest(".smrow"); if (row) row.after(box); else n.after(box); }

  /* ── OPEN — the node's record, drawn in the portrait (the brain map's panel for it) ── */
  function openRec(pk){ if (!subj(pk)) return;
    MS.recs = MS.recmode === "one" ? [pk] : [pk].concat(MS.recs.filter(function(k){ return k !== pk; }));   /* newest first; opened again, it comes to the top */
    MS.ans = "portrait"; save();
    if (window.showPortraitVar) window.showPortraitVar("map-node"); drawSweep(); }
  function closeOne(pk){ MS.recs = MS.recs.filter(function(k){ return k !== pk; }); save();
    if (window.drawPortrait) window.drawPortrait(); drawSweep(); }
  function recRow(box, k, v){ var r = mk("div", "mrecr"); r.append(mk("span", "k", k), mk("span", "v", v)); box.append(r); }
  function recList(box, head, items){ if (!items.length) return; box.append(mk("div", "mrecl", head)); var ol = mk("ol");
    items.forEach(function(t){ ol.append(mk("li", null, t)); }); box.append(ol); }
  function qline(q){ return q + " · " + ((NV.qtext || {})[q] || ""); }
  /* the records, newest first — each its own box with its own close (the brain map's tray grew; here it is a rail option) */
  function drawRecords(host){ host.innerHTML = ""; var wrap = mk("div", "mrecw"); host.append(wrap);
    MS.recs.forEach(function(pk){ drawRecord(wrap, pk); }); }
  function drawRecord(host, pk){ var s = subj(pk); if (!s) return;
    var box = mk("div", "mrec"); box.dataset.pk = pk; host.append(box);
    var hd = mk("div", "mrech"), R = NW.records || {}; hd.append(mk("span", null, nameOf(pk)));
    var x = mk("button", "mrecx", R.close || "close"); x.type = "button"; x.dataset.pk = pk;
    hv(x, hc({ title: esc(R.close || "close"), icon: "info", plain: esc(R.closeTip || "") }));
    x.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); closeOne(pk); };
    hd.append(x); box.append(hd, mk("div", "mrecs", kindWord(s.kind)));
    var A = attrs(), n = SM.n || {};
    if (s.kind === "root") { box.append(mk("p", "mrecp", (SM.root || {}).plain));
      recRow(box, N1("attrs", "attributes"), String(n.attrs)); recRow(box, N1("blocks", "blocks"), String(n.blocks));
      recRow(box, N1("shared", "shared"), String(n.shared)); recRow(box, N1("unplaced", "not placed"), String(n.unplaced));
      recList(box, N1("recBlocks", "blocks"), (SM.blocks || []).slice().sort(function(a, b){ return bIds(b).length - bIds(a).length || a.n - b.n; })
        .map(function(b){ return b.name + " · " + fill(N1("nFields", "{n}"), { n: bIds(b).length }); })); }
    else if (s.kind === "block") { var b = s.b, e = (NV.byBlock || {})[b.key] || {};
      box.append(mk("p", "mrecp", b.plain)); recRow(box, N1("recStandpoint", "standpoint"), b.standpoint);
      recRow(box, N1("recStages", "rows"), (e.names || []).join(" · ") || N1("recNoStage", "none"));
      if (e.why) recRow(box, N1("rowWhy", "why"), e.why);
      if (e.cites) recRow(box, N1("rowCites", "cites"), e.cites);
      recList(box, N1("recQuestions", "questions"), (b.questions || []).map(qline));
      recList(box, N1("recOwn", "own"), (b.own || []).map(function(id){ return (A[id] || {}).label + " · " + N1("recRated", "rated") + " " + (A[id] || {}).r; }));
      recList(box, N1("recShared", "shared"), (b.shared || []).map(function(id){ return (A[id] || {}).label + " · " + N1("recRated", "rated") + " " + (A[id] || {}).r; })); }
    else if (s.kind === "attr") { var a = s.a;
      box.append(mk("p", "mrecp", a.plain)); recRow(box, N1("recRated", "importance"), String(a.r)); recRow(box, N1("recType", "type"), a.type);
      recRow(box, N1("recHowMany", "how many"), a.card || "one"); recRow(box, N1("recFirst", "first"), a.first);
      recRow(box, N1("recHome", "home"), a.shared ? fill(N1("recSharedBy", "{n}"), { n: a.shared_in }) : nameOf("block:" + a.home));
      var pl = state(s.id) === "none" ? W1("markNone", "") : state(s.id) === "off" ? W1("markOff", "") : places(s.id, 4);
      recRow(box, N1("recDrawn", "drawn"), pl);
      recList(box, N1("recQuestions", "questions"), ((NV.needs || {})[s.id] || []).map(qline)); }
    else if (s.kind === "group") { box.append(mk("p", "mrecp", s.g.plain));
      recList(box, N1("recBlocks", "blocks"), s.g.blocks.map(function(k){ return nameOf("block:" + k) + " · " + fill(N1("nFields", "{n}"), { n: bIds(blockOf(k)).length }); })); }
    else if (s.kind === "stage") { var bs = stBlocks(s.st);
      box.append(mk("p", "mrecp", s.st.across ? (NV.acrossPlain || {})[MS.srule] : s.st.plain + (bs.length ? "" : " " + NV.emptyPlain)));
      recRow(box, N1("rowRule", "rule"), ruleName());
      recList(box, N1("recBlocks", "blocks"), bs.map(function(k){ var e = (NV.byBlock || {})[k] || {}; return nameOf("block:" + k) + " (" + ((e.names || []).join(" · ") || N1("recNoStage", "none")) + ") — " + (e.why || ""); })); }
    else if (s.kind === "sec") { box.append(mk("p", "mrecp", s.s.plain));
      recList(box, N1("recFields", "fields"), s.s.attrs.map(function(id){ var a = A[id] || {}; return a.label + " · " + (a.shared ? N1("shared", "shared") : nameOf("block:" + a.home)); })); }
    else { box.append(mk("p", "mrecp", (NV.added || {}).plain)); recList(box, N1("recFields", "fields"), (SM.unplaced || []).map(function(id){ return (A[id] || {}).label; })); } }

  /* ── FOLLOW — a field's next place, wherever the lab draws it: a part and its distribution, a record in the portrait,
        a level of the command card. A place that needs a RAIL SETTING changed (the command card laid out as rows, a
        ladder, a matrix, a strip; the portrait told to lend no record) is never reached: Follow moves the bench, never
        the rail — and when every place needs one, it says so instead of saying there is none. ── */
  function reachable(t){ if (!t) return false; var C = window.CMD || {};
    if (t.cmd) return C.layout === t.cmd.layout && (!t.cmd.verbs || C.verbs === t.cmd.verbs);
    if (t.lent) return C.portrait !== "keep";
    return !!t.part; }
  function standsOn(t){ var P = document.getElementById("panel"); return !!t && t.region === "middle" && !!P && t.part === P.dataset.tab && t.variant === P.dataset.variant; }
  function goTo(t){ var SEL = window.SEL || {}, C = window.CMD;
    if (t.cmd) { if (C) { if (t.cmd.mode) C.mode = t.cmd.mode; C.grp = null; C.only = null; if (window.drawCmd) window.drawCmd(); } return; }
    if (t.lent) { if (t.lent === "cmd-path" && window.selectPath) window.selectPath(t.path);
      else if (t.lent === "cmd-exit" && window.selectExit) window.selectExit(t.exit);
      else if (t.lent === "cmd-case" && window.selectCase) window.selectCase(t["case"]);
      if (window.showPortraitVar) window.showPortraitVar(t.lent); return; }
    if (t.region === "portrait") { if (window.showTab) window.showTab(t.part); if (window.selectIn) window.selectIn(t.part, t.pick);
      if (window.showPortraitVar) window.showPortraitVar(t.port); return; }
    if (t.path && !SEL.path && window.selectPath) window.selectPath(t.path);
    if (window.showTab) window.showTab(t.part);
    if (window.showVariant) window.showVariant(t.part, t.variant);
    if (C && C.layout === "card" && C.verbs === "g2") { C.grp = t.part; if (window.drawCmd) window.drawCmd(); } }
  function follow(pk){ var s = subj(pk); if (!s || s.kind !== "attr") return;
    var c = CAT[s.id] || {}, all = where(s.id), ws = all.filter(function(w){ return c[w] && reachable(c[w].tgt); });
    var M = NW.moves || {}, say = document.getElementById("smsay");
    function tell(t){ if (say) { say.hidden = false; say.dataset.kind = "follow"; say.textContent = t; } }
    if (!ws.length) { tell(all.length ? fill(M.followRail || "{places}", { places: places(s.id, 3) }) : (M.followNone || "")); return; }
    var i = MS.fol[s.id], k = i == null ? 0 : (i + 1) % ws.length;
    if (i == null && ws.length > 1 && standsOn(c[ws[0]].tgt)) k = 1;     // the first time, never "follow" to where the bench already stands
    MS.fol[s.id] = k;
    var w = ws[k], t = c[w].tgt, p0 = (window.SEL || {}).path;
    goTo(t);
    /* a place catalogued with a path picked draws the field under THAT path: when the path in force does not draw it, the
       place's own path is picked — and the line below says so */
    if (!DRAWN.has(s.id) && t.path && (window.SEL || {}).path !== t.path && window.selectPath) window.selectPath(t.path);
    MS.last = pk; MS.ans = t.region; keep([s.id], s.a.label); if (MS.K) MS.K.mark(pk);
    var p1 = (window.SEL || {}).path, K0 = window.CMDKIT, pth = p1 && p1 !== p0 && K0 ? K0.pathById(F, p1) : null;
    tell(fill(M.followDone || "{place}", { place: w, region: (M.regions || {})[t.region] || t.region })
      + (pth ? " " + fill(M.followPath || "{path}", { path: K0.pathWord ? K0.pathWord(pth) : p1 }) : ""));
    window.__smFollow = { id: s.id, place: w, tgt: t };
    drawSweep(); }

  /* ── the map's own header: grouping · the stage rule · the line · Keep only ── */
  function optRow(key, label, tip, opts, cur, pick, set){ var row = mk("div", "smno"); row.dataset.opt = key;
    var l = mk("span", "smnk", label); hv(l, hc({ title: esc(label), icon: "info", plain: esc(tip) })); row.append(l);
    opts.forEach(function(o){ var b = mk("button", "smnb" + (o.v === cur ? " on" : "") + (o.v === pick ? " pick" : "")); b.type = "button";
      b.dataset.v = o.v; b.setAttribute("aria-pressed", String(o.v === cur));
      b.append(mk("span", "smnbn", o.name)); if (o.note) b.append(mk("span", "smnbt", o.note));
      hv(b, hc({ title: esc(o.name), icon: "info", plain: esc(o.tip) + (o.v === pick ? " " + esc(W1("tipPick", "(my pick — dashed)")) : "") }));
      b.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); set(o.v); };
      row.append(b); });
    return row; }
  function chipLine(){ var KW = NV.keep || {}, s = subj(MS.keep), quiet = document.querySelectorAll('#smtree [data-pk][data-quiet="true"]').length;
    return fill(KW.chipOn || "{name}", { name: nameOf(MS.keep), kind: kindWord(s ? s.kind : ""), quiet: quiet }); }
  function drawNav(){ var host = document.getElementById("smnav"); if (!host) return; host.innerHTML = "";
    if (!NAVOK) { host.append(mk("div", "smnavabs", N1("absent", "") + " " + (NV.reason || ""))); return; }
    var G = NV.groupings || {}, R = NV.stageRule || {}, Wg = NW.grouping || {}, Ws = NW.sweep || {};
    /* a CONTROL's hover is one short line (D-009): the lab's own tip, not the brain map's paragraph for the grouping */
    host.append(optRow("grp", Wg.label, Wg.tip, GRPS.map(function(k){ return { v: k, name: (G[k] || {}).name, note: (G[k] || {}).note, tip: (Wg.tips || {})[k] || (G[k] || {}).plain }; }), MS.grp, PICK.grp, setGroup));
    if (MS.grp === "stage") {
      host.append(optRow("srule", R.label, (NW.stageRule || {}).tip, (NV.stageRules || []).map(function(k){ var o = (R.opts || {})[k] || {}; return { v: k, name: o.name, note: o.note, tip: o.plain }; }), MS.srule, PICK.srule, setRule));
      var nt = mk("div", "smnote smclamp", NV.stageNote); hv(nt, hc({ title: esc((G.stage || {}).name), icon: "journey", plain: esc(NV.stageNote) })); host.append(nt); }
    host.append(optRow("sweep", Ws.label, Ws.tip, SWEEPS.map(function(k){ return { v: k, name: (Ws.opts || {})[k], tip: (Ws.tips || {})[k] }; }), MS.sweep, PICK.sweep, setSweep));
    var Wr = NW.records || {};
    host.append(optRow("recs", Wr.label, Wr.tip, RECS.map(function(k){ var o = (Wr.opts || {})[k] || {}; return { v: k, name: o.name, tip: o.tip }; }), MS.recmode, PICK.recs, setRecs));
    /* KEEP ONLY — its own control (D-022, option C): never a click on a node */
    /* the brain map's Keep-only words, with the lab's where the lab differs: here the node kept is the one SHOWN last
       (a click), not one "opened" — Open is a different move in the lab, and a fold counts as neither */
    var KL = NW.keep || {}, KW = Object.assign({}, NV.keep || {}, KL.btnNone ? { btnNone: KL.btnNone } : {}, KL.btnTip ? { plain: KL.btnTip } : {});
    var box = mk("div", "smkeep"); box.dataset.opt = "keep";
    var kl = mk("span", "smnk", KW.label); hv(kl, hc({ title: esc(KW.label), icon: "target", plain: esc((NW.keep || {}).tip) })); box.append(kl);
    var b = mk("button", "smkb"); b.type = "button"; b.id = "smkeepb";
    if (MS.keep) { b.setAttribute("aria-pressed", "true"); b.textContent = KW.off; hv(b, hc({ title: esc(KW.off), icon: "target", plain: esc(KW.offPlain) }));
      b.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); keepOff(); }; }
    else { var last = MS.last; b.setAttribute("aria-pressed", "false");
      b.textContent = !last ? KW.btnNone : last === "root" ? KW.btnRoot : String(KW.btnIdle).replace("{name}", nameOf(last));
      b.disabled = !last || last === "root";
      hv(b, hc({ title: esc(KW.label), icon: "target", plain: esc(KW.plain) }));
      b.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); keepOn(); }; }
    box.append(b);
    var chip = mk("div", "smkc"); chip.id = "smkeepc"; chip.setAttribute("role", "status");
    if (MS.keep) { chip.append(mk("b", null, chipLine()),
        mk("span", "smkh smkbench", benchLine()),
        mk("span", "smkh", (NW.keep || {}).how)); }
    else chip.hidden = true;
    box.append(chip); host.append(box); drawKeepBar(); }
  /* KEEP ONLY SAYS SO ON EVERY RAIL TAB (D-022: "it says visibly that it is on until it is removed"): the map's chip lives
     with the map, which a rail tab or a placement can hide, so while the filter is on a bar sits at the top of the rail,
     outside every tab, with the same words and its own remove button */
  function drawKeepBar(){ var notes = document.getElementById("notes"), bar = document.getElementById("mkeep");
    if (!bar && notes) { bar = mk("div"); bar.id = "mkeep"; bar.setAttribute("role", "status"); bar.hidden = true;
      var fk = document.getElementById("flkeep"); if (fk && fk.parentNode === notes) fk.after(bar); else notes.insertBefore(bar, notes.firstChild); }
    if (!bar) return; bar.innerHTML = "";
    if (!MS.keep || !NAVOK) { bar.hidden = true; return; }
    var KW = NV.keep || {}, KL = NW.keep || {}; bar.hidden = false;
    var t = mk("span", "mkt"); t.append(mk("b", null, chipLine()), mk("span", "mkb", " " + benchLine())); bar.append(t);
    hv(t, hc({ title: esc(KW.label), icon: "target", plain: esc(KL.barTip || "") }));
    var b = mk("button", "mkoff", KW.off); b.type = "button";
    hv(b, hc({ title: esc(KW.off), icon: "target", plain: esc(KW.offPlain) }));
    b.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide(); keepOff(); };
    bar.append(b); }
  function redraw(){ if (MS.K) MS.K.draw(); else drawNav(); }
  function setGroup(v){ if (GRPS.indexOf(v) < 0) return; MS.grp = v; redraw(); }
  function setRule(v){ if ((NV.stageRules || []).indexOf(v) < 0) return; MS.srule = v; redraw(); }
  function setSweep(v){ if (SWEEPS.indexOf(v) < 0) return; MS.sweep = v; drawNav(); drawSweep(); save(); }
  function setRecs(v){ if (RECS.indexOf(v) < 0) return; MS.recmode = v; if (v === "one") MS.recs = MS.recs.slice(0, 1);
    drawNav(); save(); if (window.drawPortrait) window.drawPortrait(); }
  function keepOn(){ if (!MS.last || MS.last === "root" || !subj(MS.last)) return; MS.keep = MS.last; redraw(); }
  function keepOff(){ MS.keep = null; redraw(); }

  /* ── PLACEMENT (D-025.2): the rail tab · a column right of the panels · full width below them ── */
  function rowHeight(){ var h = 0; ["bench", "port", "cmd"].forEach(function(id){ var e = document.getElementById(id); if (e && !e.hidden) h = Math.max(h, e.offsetHeight); });
    document.documentElement.style.setProperty("--rowh", (h + 4) + "px"); }
  function setPlace(v){ if (PLACES.indexOf(v) < 0) return; MS.place = v;
    var wrap = document.getElementById("smwrap"), col = document.getElementById("mapcol"), bel = document.getElementById("mapbelow");
    var host = v === "right" ? col : v === "below" ? bel : document.getElementById("rt-map");
    if (wrap && host && wrap.parentNode !== host) host.append(wrap);
    if (col) col.hidden = v !== "right"; if (bel) bel.hidden = v !== "below";
    document.body.dataset.mapplace = v; if (v === "below") rowHeight();
    var lab = document.getElementById("lab");
    if (v === "right" && col) col.scrollIntoView({ block: "nearest", inline: "end" }); else if (lab) lab.scrollLeft = 0;
    /* the node shown last comes back into view in its new place, so the line to what it lit can be drawn there too */
    var n0 = MS.last ? nodeEls(MS.last)[0] : null; if (n0) n0.scrollIntoView({ block: "nearest", inline: "nearest" });
    drawPlace(); paintTree(); drawSweep(); save(); }
  function drawPlace(){ var host = document.getElementById("smplace"); if (!host) return; host.innerHTML = ""; if (!NAVOK) return;
    var P = NW.placement || {};
    host.append(optRow("place", P.label, P.tip, PLACES.map(function(k){ var o = (P.opts || {})[k] || {}; return { v: k, name: o.name, tip: o.tip }; }), MS.place, PICK.place, setPlace));
    if (MS.place !== "rail") host.append(mk("div", "smplnote", MS.place === "right" ? P.movedRight : P.movedBelow)); }
  window.addEventListener("resize", function(){ if (MS.place === "below") rowHeight(); });

  /* ── THE SWEEP: one short hop from the node shown last — both ends real things, the bend between them, drawn whole
        (D-004 · D-032). Where it ends is a rail option: the nearest element it lit (it goes when the light goes), or the
        panel that answered the last move (the brain map's hop: the middle for Show, the portrait for Open, the region
        Follow landed in). ── */
  var ANSWERS = { middle: "#panel", portrait: "#port", command: "#cmd" };
  /* the line is drawn at once AND again on the next frame: a render that changes the tree's text after this call (the
     field counts paintTree writes, a part switch rewording every row) moves the node, and a line drawn only once kept the
     node's OLD place — the walk-fold picture after a part switch showed it starting two rows above its node */
  var sweepRaf = 0;
  function drawSweep(){ drawSweepNow(); if (sweepRaf) cancelAnimationFrame(sweepRaf);
    sweepRaf = requestAnimationFrame(function(){ sweepRaf = 0; drawSweepNow(); }); }
  function drawSweepNow(){ var svg = document.getElementById("smsweep");
    if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "smsweep"; svg.setAttribute("aria-hidden", "true"); document.body.append(svg); }
    svg.innerHTML = ""; SWEEP = null;
    var W0 = window.innerWidth, H0 = window.innerHeight; svg.setAttribute("viewBox", "0 0 " + W0 + " " + H0);
    if (!NAVOK || MS.sweep === "off" || !MS.last) return;
    var see = viewer(), from = nodeEls(MS.last).filter(see)[0]; if (!from) return;
    var hits;
    if (MS.sweep === "panel") { var box = MS.ans && document.querySelector(ANSWERS[MS.ans] || ""); hits = box && box.offsetParent !== null ? [box] : []; }
    else { if (!KEEP) return; hits = hitsOf(KEEP.ids).filter(see); }
    if (!hits.length) return;
    var fr = from.getBoundingClientRect(), fx = (fr.left + fr.right) / 2, fy = (fr.top + fr.bottom) / 2, best = null, bd = Infinity;
    hits.forEach(function(h){ var r = h.getBoundingClientRect(), dx = Math.max(r.left - fx, 0, fx - r.right), dy = Math.max(r.top - fy, 0, fy - r.bottom), d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = h; } });
    var tr = best.getBoundingClientRect(), sx, sy, ex, ey, d, horiz = tr.left >= fr.right || tr.right <= fr.left;
    if (horiz) { var rt = tr.left >= fr.right; sx = rt ? fr.right : fr.left; sy = fy; ex = rt ? tr.left : tr.right;
      ey = Math.max(tr.top + 2, Math.min(tr.bottom - 2, fy)); var mx = (sx + ex) / 2;
      d = "M" + sx + " " + sy + " C" + mx + " " + sy + "," + mx + " " + ey + "," + ex + " " + ey; }
    else if (tr.top >= fr.bottom || tr.bottom <= fr.top) { var dn = tr.top >= fr.bottom; sx = fx; sy = dn ? fr.bottom : fr.top;
      ex = Math.max(tr.left + 2, Math.min(tr.right - 2, fx)); ey = dn ? tr.top : tr.bottom; var my = (sy + ey) / 2;
      d = "M" + sx + " " + sy + " C" + sx + " " + my + "," + ex + " " + my + "," + ex + " " + ey; }
    else return;                                                     // the two overlap: no hop to draw
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); p.setAttribute("class", "swp");
    var c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("cx", ex); c.setAttribute("cy", ey); c.setAttribute("r", "3.5"); c.setAttribute("class", "swe");
    svg.append(p, c);
    SWEEP = { pk: MS.last, from: [sx, sy], to: [ex, ey], d: d, horiz: horiz, node: from, target: best, to_: MS.sweep, ans: MS.sweep === "panel" ? MS.ans : null }; }

  /* ── the copy line and "more information" (D-017: the open picks and what the tree measures are behind it) ── */
  function navLook(){ var G = NV.groupings || {};
    return fill(N1("lookLine", "{grp} · {keep} · {place} · {sweep}"), {
      grp: ((G[MS.grp] || {}).name || MS.grp) + (MS.grp === "stage" ? " (" + ruleName() + ")" : ""),
      keep: MS.keep ? "“" + nameOf(MS.keep) + "”" : N1("lookOff", "off"),
      place: (((NW.placement || {}).opts || {})[MS.place] || {}).name || MS.place,
      sweep: ((NW.sweep || {}).opts || {})[MS.sweep] || MS.sweep }); }
  function moreHtml(){ if (!NAVOK) return "";
    var h = '<div class="smopen" id="smopen"><b>' + esc(N1("openHead", "")) + '</b><p>' + esc(N1("openWhy", "")) + '</p>';
    ((NV.open || {}).items || []).forEach(function(it){ h += '<div class="smoq"><div class="q">' + esc(it.q) + '</div><div class="d">' + esc(it.did) + '</div>'
      + '<div class="a">' + esc(it.ask) + '</div><div class="l"><i>' + esc(N1("openLab", "")) + '</i> ' + esc(it.lab) + '</div></div>'; });
    h += '<div class="smoq"><div class="q">' + esc(N1("placeHead", "")) + '</div><div class="d">' + esc((NW.placement || {}).why) + '</div></div>';
    /* what the brain map had that the lab does not carry yet — said, so its page is not retired on a silent loss (D-024) */
    var NC = NW.notCarried || {};
    if ((NC.items || []).length) { h += '<b>' + esc(NC.head) + '</b><p class="smncw">' + esc(NC.why) + '</p>';
      NC.items.forEach(function(t){ h += '<div class="smoq smnc"><div class="d">' + esc(t) + '</div></div>'; }); }
    h += '<b>' + esc(N1("factsHead", "")) + '</b>';
    (NV.facts || []).forEach(function(f){ h += '<p class="smfact"><span>' + esc(f.big) + '</span> ' + esc(f.text) + '</p>'; });
    return h + '</div>'; }

  window.LABMAP = {
    state: function(){ return { nav: NV.state, grp: MS.grp, srule: MS.srule, place: MS.place, sweep: MS.sweep, recmode: MS.recmode, keep: MS.keep, last: MS.last,
      rec: MS.recs[0] || null, recs: MS.recs.slice(), ans: MS.ans,
      open: Object.keys(MS.open).filter(function(k){ return MS.open[k]; }), deep: DEEP, quiet: QUIET }; },
    picks: function(){ return { grp: PICK.grp, srule: PICK.srule, place: PICK.place, sweep: PICK.sweep, recs: PICK.recs }; },
    drawTree: drawTree, drawNav: drawNav, drawPlace: drawPlace, show: show, openRec: openRec, follow: follow,
    note: function(pk){ if (subj(pk)) { MS.last = pk; MS.ans = "middle"; } },
    setRecs: setRecs, closeOne: closeOne, store: STORE,
    open: function(pks, v){ (pks || []).forEach(function(k){ MS.open[k] = v !== false; }); redraw(); },
    setGroup: setGroup, setRule: setRule, setPlace: setPlace, setSweep: setSweep, keepOn: keepOn, keepOff: keepOff,
    keepSets: keepSets, carries: function(pk){ return carries(pk, keepSets()); }, ids: idsOfPk, name: nameOf, kind: kindOf,
    lastName: function(){ return MS.last ? nameOf(MS.last) : null; },
    blockRows: blockRows, moveRows: moveRows, sweep: function(){ return SWEEP; }, drawSweep: drawSweep, paintQuiet: paintQuiet,
    look: navLook, moreHtml: moreHtml,
    /* the portrait's record of the node opened last — a variant the portrait offers beside its own, once a node is opened */
    portrait: function(){ MS.recs = MS.recs.filter(function(k){ return !!subj(k); }); if (!MS.recs.length) return null;
      return { key: "map-node", icon: "doc", label: N1("recLabel", "record"), hint: N1("recHint", ""), subject: nameOf(MS.recs[0]),
        render: function(box){ drawRecords(box); } }; },
    /* closes every record the map opened */
    closeRec: function(){ MS.recs = []; save(); if (window.drawPortrait) window.drawPortrait(); drawSweep(); },
    /* boot: what a reload keeps comes back first, then the placement and the header draw from it */
    init: function(){ if (NAVOK) { restore(); drawPlace(); setPlace(MS.place); if (MS.K) MS.K.draw(); } else drawNav();
      if (MS.recs.length && window.showPortraitVar) window.showPortraitVar("map-node"); } };
})();
