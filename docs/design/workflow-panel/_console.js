/* RTS console region builders — shared by D, E and F so the three differ only in
   LAYOUT, never in styling or content logic. Every builder takes the element and
   returns a fixed rectangle; none of them can add, drop or reorder a region. */

var GLYPH = {
  endpoint:'<path d="M4 12h16M14 6l6 6-6 6"/>',
  model:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  schema:'<path d="M4 5h16v5H4zM4 14h16v5H4z"/>',
  component:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/>',
  hook:'<path d="M18 6v7a5 5 0 0 1-10 0V8a3 3 0 1 1 6 0v6"/>',
  route:'<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v6a3 3 0 0 0 3 3h6"/>',
  external:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>',
  middleware:'<path d="M3 8h18M3 16h18"/><rect x="8" y="4" width="8" height="16" rx="2"/>',
  flag:'<path d="M5 21V4h13l-3 4 3 4H5"/>',
  store:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>',
  /* an ICON-ONLY control surface cannot afford a shared fallback: six kinds were
     all rendering the generic circle and were indistinguishable in the HUD. */
  "function":'<path d="M9 20s-3 0-3-3V7c0-3 3-3 3-3M15 4s3 0 3 3v10c0 3-3 3-3 3"/><path d="M9 12h6"/>',
  module:'<path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  type:'<path d="M8 5H5a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h3"/><path d="M16 5h3a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-3"/>',
  web:'<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20"/><circle cx="5.5" cy="6.5" r=".7" fill="currentColor"/>',
  provider:'<path d="M18 10a5 5 0 0 0-9.6-1.6A4 4 0 1 0 7 18h10.5a3.5 3.5 0 0 0 .5-7z"/>',
  element:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke-dasharray="3 2"/><path d="M14 3v5h5"/><path d="M12 13v.01M12 16v.01"/>',
  __generic:'<circle cx="12" cy="12" r="8"/>',
};
function svgK(kind, col, size){
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="' +
    col + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    (GLYPH[kind] || GLYPH.__generic) + '</svg>';
}

/* ── CONSOLE RIM: the selection ladder, always 32px, never scrolls ── */
function rimEl(e, mode){
  var rim = el("div", { class:"rim" });
  var rungs = [
    { t:"everything", on:true },
    { t: e ? (e.entity || "—") : "entity", on: !!e },
    { t: e ? (e.kind || "—") + " cluster" : "cluster", on: !!e },
    { t: e ? e.short : "element", on: !!e },
  ];
  rungs.forEach(function(r, i){
    if (i) rim.appendChild(el("span", { class:"sep", text:"›" }));
    rim.appendChild(el("span", { class:"crumb" }, [
      r.on ? el("b", { text:r.t }) : el("i", { text:r.t })
    ]));
  });
  rim.appendChild(el("span", { class:"spacer" }));
  (mode || []).forEach(function(m){
    rim.appendChild(el("span", { class:"mode" + (m.on ? " on" : ""), text:m.t }));
  });
  return rim;
}

/* ── PORTRAIT: exactly one, always. Never becomes a list, never subdivides ── */
function portraitEl(e, w){
  var box = el("div", { class:"reg portrait" + (e ? "" : " none"),
    style: w ? ("flex:none;width:" + w + "px") : "" });
  box.appendChild(regHead("PORTRAIT"));
  var body = el("div", { class:"regbody" });
  var col = e ? kcol(e.kind) : "var(--muted)";
  body.appendChild(el("div", { class:"pglyph", html: svgK(e ? e.kind : "__generic", col, 60) }));
  body.appendChild(el("div", { class:"pname", title: e ? e.label : "", text: e ? e.label : "no element selected" }));
  var kind = el("div", { class:"pkind" }, [ el("span", { text: e ? e.kind : "click a planet", style:"color:" + col }) ]);
  var bdg = e && (typeof BADGE !== "undefined") && BADGE[e.id];
  if (bdg) kind.appendChild(el("span", { class:"pbadge", text:bdg, style:"background:" + col }));
  body.appendChild(kind);
  body.appendChild(el("div", { class:"pent" }, [
    el("span", { class:"swatch", style:"background:" + col }),
    el("span", { text: e ? e.entity : "—" })
  ]));
  box.appendChild(body);
  return box;
}

/* every builder asks the registry for its variant; a page without _variants.js
   loaded simply gets the default branch, so the shared builders stay standalone */
/* a region header: a glyph plus its count. The region NAME lives in the tooltip —
   seven headers were seven of the panel's most repeated words. */
/* a region header wears ICON + TITLE — the control panel's nomenclature, which
   the operator ruled on: section NAMES are readable at a glance, and only the
   row-level keys stay wordless with their meaning on hover. */
function regHead(label, count){
  var hd = el("div", { class:"reghd" });
  if (window.__ICONMODE && typeof rowSvg === "function"){
    var g = el("span", { class:"rl ico", html:rowSvg((typeof REGI !== "undefined" && REGI[label]) || "__row", 12) });
    hd.appendChild(g);
    var t = el("span", { class:"rt", text:label });
    if (typeof tipOn === "function") tipOn(t, label, "");
    hd.appendChild(t);
  } else hd.appendChild(el("span", { class:"rl", text:label }));
  if (count != null) hd.appendChild(el("span", { class:"rn", text:String(count) }));
  return hd;
}

function VV(region, fallback){
  return (typeof vOf === "function" && VARIANTS[region]) ? vOf(region) : fallback;
}

/* ── VITALS: four meters, four permanent y-slots, kind-aware in SOURCE only ── */
function vitalsEl(id, w){
  var v = VITALS[id] || {};
  var box = el("div", { class:"reg", style: w ? ("flex:none;width:" + w + "px") : "" });
  box.appendChild(regHead("VITALS", "4/4"));
  var body = el("div", { class:"regbody" });
  VROWS.forEach(function(row){
    var m = v[row.key] || vit(0, 1, "unmeas", "not measured");
    var pct = (m.state === "ok" && m.max) ? Math.max(3, Math.round(100 * m.v / m.max)) : 0;
    var cell = el("div", { class:"vit " + m.state, title:row.label + " — " + row.hint }, [
      el("div", { class:"vithd" }, [
        (window.__ICONMODE && typeof rowSvg === "function")
          ? (function(){ var w = el("span", { class:"vl ico" });
              w.innerHTML = rowSvg(METERI[row.key] || "__row", 12);
              w.appendChild(el("span", { class:"vt", text:row.label }));
              if (typeof tipOn === "function") tipOn(w, row.label, row.hint); return w; })()
          : el("span", { class:"vl", text:row.label }),
        el("span", { class:"vv", text:m.label })
      ]),
      el("div", { class:"vtrack" }, [ el("i", { style:"width:" + pct + "%" }) ])
    ]);
    if (m.note) cell.appendChild(el("div", { class:"vnote", text:m.note }));
    body.appendChild(cell);
  });
  box.appendChild(body);
  return box;
}

/* ── CARGO: WC3's 2x3 inventory. Six cells + overflow — it CANNOT clip ── */
function cargoEl(e, w){
  var box = el("div", { class:"reg", style: w ? ("flex:none;width:" + w + "px") : "" });
  var rows = (e && e.slots.store || []).filter(function(x){
    return ["col", "shape", "state"].indexOf(x.k) >= 0 && x.tone !== "none";
  });
  var fields = [];
  rows.forEach(function(x){
    String(x.v).split("·").forEach(function(t){
      t = t.trim();
      if (!t || /^—/.test(t) || /^\+\d/.test(t)) return;
      var m = t.match(/^(\S+)\s+(.*)$/);
      fields.push(m ? { n:m[1], t:m[2] } : { n:t, t:"" });
    });
  });
  var facts = (VITALS[e && e.id] && VITALS[e.id].surface) || null;
  var total = facts && facts.state === "ok" ? facts.v : fields.length;
  /* the header numerator is what the grid ACTUALLY draws: 6 cells, or 5 when the
     6th is spent on the overflow marker. */
  var drawn = (fields.length > 6 || (fields.length > 0 && total > 6))
    ? 5 : Math.min(6, fields.length);
  box.appendChild(regHead("CARGO", drawn + "/" + total));
  var grid = el("div", { class:"cargo" });
  /* "+N more" only when fields were actually DRAWN. An endpoint whose surface meter
     says 7 payload fields but whose rows enumerate none was rendering five empty
     wells and a "+2 more" — advertising overflow on top of nothing. */
  var showMore = fields.length > 0 && total > 6;
  for (var i = 0; i < 6; i++){
    if (i === 5 && showMore){
      grid.appendChild(el("div", { class:"cell more" }, [
        el("span", { class:"cn", text:"+" + (total - 5) + " more" })
      ]));
    } else if (fields[i]){
      grid.appendChild(el("div", { class:"cell", title:fields[i].n + " " + fields[i].t }, [
        el("span", { class:"cn", text:fields[i].n }),
        el("span", { class:"ct", text:fields[i].t })
      ]));
    } else {
      grid.appendChild(el("div", { class:"cell well" }));
    }
  }
  box.appendChild(grid);
  if (!fields.length){
    var why = (e && e.slots.store || []).filter(function(x){ return x.tone === "none" || x.tone === "dim"; })[0];
    /* say the COUNT the surface meter knows, then why none are named — otherwise the
       region reads as "no structure" while VITALS reads "7 payload fields". */
    var lead = (total > 0)
      ? (total + " field" + (total > 1 ? "s" : "") + " counted, none enumerated for this kind \u2014 the shape is named in STATUS")
      : (why ? why.v : "\u2014 no structure captured for this kind");
    box.appendChild(el("div", { class:"cargonote", text: lead }));
  }
  return box;
}

/* ── EVIDENCE: three fixed verdict rows, dashed never absent ── */
function evidenceEl(e, w){
  var box = el("div", { class:"reg", style: w ? ("flex:none;width:" + w + "px") : "" });
  box.appendChild(regHead("EVIDENCE"));
  var emode = VV("evidence", "rows");
  var body = el("div", { class:"regbody scroll ev-" + emode });
  var src = (e && e.slots.ev) || [];
  var pick = function(k){ return src.filter(function(x){ return x.k === k; })[0]; };
  [["TESTS", pick("test")], ["JOURNEYS", pick("journey")], ["VERDICTS", pick("flag")]].forEach(function(p){
    var row = p[1] || { v:"—", tone:"none" };
    /* the third row finally gives the homing / entity-model verdicts a header —
       today they render as bare unlabelled .kv rows (gabe-universe.html:5696-5713) */
    var extra = (p[0] === "VERDICTS" && e) ? (e.slots.place || []).filter(function(x){ return x.k === "home"; })[0] : null;
    var txt = row.v;
    /* CHIPS truncates to the first clause — the point is the VERDICT, not its prose */
    if (emode === "chips") txt = String(txt).split(/\s+[\u00b7\u2014-]\s+/)[0].slice(0, 34);
    var lab;
    if (window.__ICONMODE && typeof rowSvg === "function"){
      lab = el("div", { class:"el ico" });
      lab.innerHTML = rowSvg(EVI[p[0]] || "__row", 12);
      lab.appendChild(el("span", { class:"vt", text:p[0] }));
      if (typeof tipOn === "function") tipOn(lab, p[0], row.v);
    } else lab = el("div", { class:"el", text:p[0] });
    var cell = el("div", { class:"ev " + (row.tone || "") }, [ lab,
      el("div", { class:"evv", text:txt })
    ]);
    if (extra) cell.appendChild(el("div", { class:"evv", style:"color:var(--muted);font-size:10px", text:extra.v }));
    body.appendChild(cell);
  });
  box.appendChild(body);
  return box;
}

/* ── COMMAND CARD: 15 cells, always. A verb this element cannot use KEEPS ITS CELL ── */
function commandEl(id, w, opts){
  opts = opts || {};
  var st = CMDSTATE[id] || {};
  var box = el("div", { class:"reg cmdwrap", style: w ? ("flex:none;width:" + w + "px") : "" });
  box.appendChild(regHead("COMMAND", "15"));
  var cap = el("div", { class:"cap idle" }, [
    el("div", { class:"cph", text:"hover a cell" }),
    el("div", { class:"cpd", text:"Fifteen cells, always. A verb this element cannot use keeps its cell — that is the whole mechanism." })
  ]);
  box.appendChild(cap);
  var kmode = VV("command", "g53");
  if (kmode === "list"){
    /* AUDIT: every verb spelled out with its state and reason. Trades muscle
       memory for legibility — the one variant that is NOT a command card. */
    var lst = el("div", { class:"cmdlist" });
    CMD.forEach(function(c){
      var q = st[c.key] || ["lit", null, ""];
      var r0 = el("div", { class:"cl " + q[0] }, [
        el("span", { class:"clk", text:c.hot }),
        el("span", { class:"cln", text:c.label }),
        el("span", { class:"clc", text: q[1] != null ? String(q[1]) : "" }),
      ]);
      if (q[2]) r0.appendChild(el("span", { class:"clr", text:q[2] }));
      lst.appendChild(r0);
    });
    box.appendChild(lst);
    return box;
  }
  var grid = el("div", { class:"grid5" + (kmode === "g35" ? " grid35" : "") });
  CMD.forEach(function(c){
    var s = st[c.key] || ["lit", null, ""];
    var state = s[0], count = s[1], why = s[2];
    var cell = el("button", { class:"cc " + state, "data-k":c.key });
    /* the verb's WORD lives in the caption block on hover; the cell wears a glyph.
       Fifteen two-word legends was ~30 words in one 212px box. */
    if (window.__ICONMODE && typeof hudSvg === "function" && CMDI[c.key])
      cell.appendChild(el("span", { class:"ci ico", html:hudSvg(CMDI[c.key], 15) }));
    else cell.appendChild(el("span", { class:"ci", text:c.label }));
    if (state !== "blank" && state !== "unmeas") cell.appendChild(el("span", { class:"ck", text:c.hot }));
    if (count != null) cell.appendChild(el("span", { class:"cb", text:count }));
    cell.onmouseenter = function(){
      cap.className = "cap";
      cap.innerHTML = "";
      var hd = el("div", { class:"cph" }, [ el("span", { text:c.label }) ]);
      if (state !== "blank" && state !== "unmeas") hd.appendChild(el("span", { class:"cpk", text:c.hot }));
      if (count != null) hd.appendChild(el("span", { class:"cpn", text:count }));
      cap.appendChild(hd);
      var word = { lit:"", blank:"wrong question — inapplicable to this kind.",
        grey:"no answer — applies to this kind, this element has none.",
        unmeas:"UNMEASURED — the station never looked." }[state];
      cap.appendChild(el("div", { class:"cpd",
        style: state === "unmeas" ? "color:var(--warn)" : "",
        text:(word ? word + " " : "") + (why || "") }));
      cap.appendChild(el("div", { class:"cpf", text:c.fn }));
    };
    cell.onmouseleave = function(){
      cap.className = "cap idle";
      cap.innerHTML = "";
      cap.appendChild(el("div", { class:"cph", text:"hover a cell" }));
      cap.appendChild(el("div", { class:"cpd", text:opts.idle ||
        "Fifteen cells, always. A verb this element cannot use keeps its cell — that is the whole mechanism." }));
    };
    grid.appendChild(cell);
  });
  box.appendChild(grid);
  return box;
}

/* ── the IN | STORE | OUT spine — three sub-columns, order never changes ── */
function spineEl(e, cap){
  var smode = VV("status", "spine");
  if (smode === "tight" && !cap) cap = 2;
  if (smode === "table"){
    /* AUDIT: one dense side-labelled ledger of all three columns. Nothing is
       dropped and nothing is capped — the region scrolls and says so. */
    var t = el("div", { class:"stab" });
    [["in","IN"],["store","STORE"],["out","OUT"]].forEach(function(pp){
      ((e && e.slots[pp[0]]) || []).forEach(function(rw, i){
        t.appendChild(el("div", { class:"str " + (rw.tone || "") }, [
          el("span", { class:"stc", text: i === 0 ? pp[1] : "" }),
          el("span", { class:"stk", text:rw.k }),
          el("span", { class:"stv", text:rw.v })
        ]));
      });
    });
    return t;
  }
  var wrap = el("div", { class:"spine" });
  [["in", "IN"], ["store", "STORE"], ["out", "OUT"]].forEach(function(p){
    var rows = (e && e.slots[p[0]]) || [];
    /* a narrow spine (E's 131px) cannot hold prose — it holds a COUNT and two
       named rows, and the rest goes behind the command card's submenu. Live rows
       first, so the cap never spends a visible line on a dash. */
    if (cap && rows.length > cap){
      var live = rows.filter(function(x){ return x.tone !== "none"; });
      var kept = (live.length ? live : rows).slice(0, cap);
      var n = rows.length - kept.length;
      rows = kept.concat([ r("", "+" + n + " more \u2014 press the card", "dim") ]);
    }
    wrap.appendChild(slotEl({ key:p[0], label:p[1], hint:"" }, rows));
  });
  return wrap;
}

/* ── STANDING regions: selection-INDEPENDENT by construction ── */
function standingRes(){
  var box = el("div", { class:"stand", id:"res" });
  box.appendChild(el("div", { class:"rhd", text:"GLOBAL — never blanks" }));
  Object.keys(STANDING).forEach(function(k){
    var s = STANDING[k];
    box.appendChild(el("div", { class:"rrow" + (s.warn ? " warn" : ""), title:s.note }, [
      el("span", { class:"rk2", text:s.label }),
      el("span", { class:"rv2", text:s.v })
    ]));
  });
  return box;
}
function standingPins(pins){
  var box = el("div", { class:"stand", id:"pinrail" });
  box.appendChild(el("div", { class:"phd", text:"PINS" }));
  for (var i = 0; i < 3; i++){
    var p = pins && pins[i];
    if (p){
      box.appendChild(el("div", { class:"pinslot", title:p.label }, [
        el("span", { html: svgK(p.kind, kcol(p.kind), 20) }),
        el("span", { class:"pn", text:p.short }),
        el("span", { class:"pk2", text:"⇧" + (i + 1) })
      ]));
    } else {
      box.appendChild(el("div", { class:"pinslot empty" }, [ el("span", { class:"pl", text:"+" }) ]));
    }
  }
  return box;
}
function standingMini(){
  var box = el("div", { class:"stand", id:"mini" });
  box.appendChild(el("div", { class:"mhd" }, [
    el("span", { text:"MINIMAP" }), el("i", { text:"absent today" })
  ]));
  var map = el("div", { class:"mmap" });
  var seed = 7;
  function rnd(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  ENTS.forEach(function(en){
    var d = Math.max(6, Math.round(en.n / 4));
    map.appendChild(el("div", { class:"mdot", title:en.slug + " · " + en.n + " pieces",
      style:"left:" + (12 + rnd() * 76) + "%;top:" + (14 + rnd() * 72) + "%;width:" + d +
        "px;height:" + d + "px;background:" + en.col + ";opacity:.8" }));
  });
  map.appendChild(el("div", { class:"mfr", style:"left:34%;top:30%;width:34%;height:36%" }));
  box.appendChild(map);
  return box;
}

/* ═══ PORTRAIT · the PLANETARY VIEW ════════════════════════════════════════
   Draws the selected element the way the 3D field already draws it, from the
   SAME metric bundle. Every channel below is the station's own DEFMAP wiring
   (gabe-universe.html :1383) over n.m (:1245):

     mass   <- behind   the planet's radius      (call-tree size)
     glow   <- depth    the halo                 (call-tree depth)
     ring1  <- tests    the defence belt         (cases claimed)
     ring3  <- fanin    the satellites           (in-degree)
     sat    <- god      a red raider             (god-object)
     +      <- untested a red raider             (no case covers it)

   Nothing here is invented: an element with no measurement gets no ship, and an
   UNMEASURED one gets the amber hatch ring rather than an empty orbit — the same
   distinction the vitals block makes. */
var PLANETS = [];
function planetEl(e, w){
  var box = el("div", { class:"reg planet", style: w ? ("flex:none;width:" + w + "px") : "" });
  box.appendChild(regHead("PORTRAIT", e ? e.kind : "—"));
  var pmode = VV("portrait", "planet");
  var body = el("div", { class:"planetbody pm-" + pmode });
  var cv = el("canvas");
  if (pmode === "glyph"){
    /* GLANCE: the static kind glyph, no encoding, no animation — what the
       station draws today in #phead, just larger. */
    body.appendChild(el("div", { class:"pglyphbig",
      html: svgK(e ? e.kind : "__generic", e ? kcol(e.kind) : "var(--muted)", 64) }));
  } else {
    body.appendChild(cv);
  }
  box.appendChild(body);

  var col = e ? kcol(e.kind) : "var(--muted)";
  var cap = el("div", { class:"planetcap" }, [
    el("div", { class:"pcname", title: e ? e.label : "", text: e ? e.label : "no element selected" }),
  ]);
  var badge = e && (typeof BADGE !== "undefined") && BADGE[e.id];
  var rowc = el("div", { class:"pcrow" });
  if (badge) rowc.appendChild(el("span", { class:"pcb", text:badge, style:"background:" + col }));
  rowc.appendChild(el("span", { class:"pce" }, [
    el("i", { style:"background:" + col }), el("span", { text: e ? e.entity : "—" })
  ]));
  cap.appendChild(rowc);
  box.appendChild(cap);

  var v = (e && VITALS[e.id]) || {};
  var mass  = (v.reach   && v.reach.state   === "ok") ? v.reach.v   : 0;
  var tests = (v.tested  && v.tested.state  === "ok") ? v.tested.v  : 0;
  var fanin = (v.fanin   && v.fanin.state   === "ok") ? v.fanin.v   : 0;
  var unmeasTests = (v.tested && v.tested.state === "unmeas");
  var untested = (v.tested && v.tested.state === "zero") ||
                 (v.tested && v.tested.state === "ok" && v.tested.v === 0);
  box.appendChild(el("div", { class:"planetlegend", html:
    "<b>mass</b> " + (mass || "—") + " reach · <b>belt</b> " + (unmeasTests ? "unmeasured" : tests + " tests")
    + " · <b>moons</b> " + (fanin || 0) + " fan-in" }));

  var depth = 0, rr0 = (e && e.slots.place || []).filter(function(x){ return x.k === "reach"; })[0];
  if (rr0) { var dm = String(rr0.v).match(/depth\s+(\d+)/); if (dm) depth = +dm[1]; }
  var fl = (e && e.slots.ev || []).filter(function(x){ return x.k === "flag"; })[0];
  var god = !!(fl && /god-object/i.test(String(fl.v)));
  var shock = (mass >= 15) || (fanin >= 15);
  var bdg = e && (typeof BADGE !== "undefined") && BADGE[e.id];
  /* the field's own colour rule (:1768-1770): a method beats the kind, and a VIEW
     wears VIEWCOL. The portrait must not invent a third scheme. */
  var pcol = (e && e.kind === "endpoint" && METHOD[bdg]) ? METHOD[bdg]
           : (e && e.kind === "component" && /view/i.test(String(bdg || ""))) ? VIEWCOL
           : (e ? rawKcol(e.kind) : "#8794ab");
  if (pmode !== "glyph") PLANETS.push({ cv:cv, col:pcol, mass:mass, depth:depth, tests:tests, fanin:fanin,
    unmeas:unmeasTests, untested:untested, god:god, shock:shock, kind: e ? e.kind : "" });
  return box;
}

/* the kind colours as real hex — canvas cannot read a CSS var */
var KHEX = { endpoint:"#4c9dfb", model:"#4cbe83", schema:"#c084fc", web:"#e8590c",
  component:"#d946ef", hook:"#10b981", route:"#38bdf8", external:"#8794ab",
  middleware:"#e8a33d", flag:"#e2565f", store:"#ec4899", type:"#64748b",
  module:"#a855f7", provider:"#22d3ee", element:"#8794ab", "function":"#7c5cfc" };   /* function = the station's KINDS.function.col (:1116), not a guess */
function rawKcol(k){ return KHEX[k] || "#8794ab"; }

var _plT = 0;

/* the station's own literals, so the portrait cannot drift from the field:
   MAXES (:1367) · METHOD (:1114) · VIEWCOL (:1154) · the fleet caps (:1645-1650). */
var FMAX   = { behind:30, depth:5 };                 /* FIXED p95, not per-graph max */
var FCAP   = { def:9, sat:8, ung:3 };                /* a ship per test to 9 · sats to 8 · 3 raiders */
var METHOD = { GET:"#22c55e", POST:"#3b82f6", PUT:"#f97316", PATCH:"#eab308",
               DELETE:"#ef4444", BOOT:"#8a8f98", TASK:"#f0abfc" };
var VIEWCOL = "#d946ef";
var TEAM = { def:"#22c55e", atk:"#ef4444", shock:"#f59e0b", sat:"#9ad8ff" };

function planetTick(){
  _plT += 0.006;
  if (PLANETS.length > 4) PLANETS = PLANETS.filter(function(p){ return p.cv.isConnected; });
  PLANETS.forEach(function(p){
    var cv = p.cv, r = cv.getBoundingClientRect();
    if (!cv.isConnected || !r.width || !r.height) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width*dpr)) { cv.width = Math.round(r.width*dpr); cv.height = Math.round(r.height*dpr); }
    var g = cv.getContext("2d");
    g.setTransform(dpr,0,0,dpr,0,0);
    g.clearRect(0,0,r.width,r.height);
    var cx = r.width/2, cy = r.height/2, S = Math.min(r.width, r.height);

    /* MASS — massR = bubR()*(0.85 + cap3(behind/30)*1.15) at :1774. Normalised to the
       station's FIXED 30, not the per-graph max, so portrait and field agree. */
    var mr = Math.min(3, p.mass / FMAX.behind);
    var pr = S * 0.115 * (0.85 + mr * 1.15);

    /* GLOW — the additive halo, sized from depth (:1796) */
    if (p.depth > 0){
      var gr = pr * (1.25 + Math.min(3, p.depth/FMAX.depth) * 0.9);
      var hg = g.createRadialGradient(cx, cy, pr*0.6, cx, cy, gr);
      hg.addColorStop(0, p.col + "44"); hg.addColorStop(1, p.col + "00");
      g.beginPath(); g.arc(cx, cy, gr, 0, 6.2832); g.fillStyle = hg; g.fill();
    }

    /* BLAST SHOCK — two expanding amber tori when large || behind>=15 (:1649, :1615) */
    if (p.shock){
      for (var w = 0; w < 2; w++){
        var ph = ((_plT*0.35 + w/2) % 1);
        g.beginPath(); g.arc(cx, cy, pr*(1 + ph*3.4), 0, 6.2832);
        g.strokeStyle = TEAM.shock; g.globalAlpha = 0.85*(1-ph); g.lineWidth = 1.6; g.stroke();
      }
      g.globalAlpha = 1;
    }

    /* THE BODY */
    g.beginPath(); g.arc(cx, cy, pr, 0, 6.2832);
    var bg = g.createRadialGradient(cx - pr*0.35, cy - pr*0.4, pr*0.1, cx, cy, pr);
    bg.addColorStop(0, p.col); bg.addColorStop(1, "#0b1120");
    g.fillStyle = bg; g.fill();
    g.strokeStyle = p.col; g.globalAlpha = .55; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;

    /* SATELLITES — one per caller, capped at 8 (:1650), each with its pale-blue
       signal wave (:1635-1638). */
    var sr = pr * 2.15, sats = Math.min(FCAP.sat, p.fanin);
    if (sats){
      g.globalAlpha = .3; g.strokeStyle = "#2b3650"; g.lineWidth = 1;
      g.beginPath(); g.ellipse(cx, cy, sr, sr*0.4, 0, 0, 6.2832); g.stroke(); g.globalAlpha = 1;
    }
    for (var j = 0; j < sats; j++){
      var t = -_plT*1.3 + j * (6.2832/Math.max(1,sats));
      var sx = cx + Math.cos(t)*sr, sy = cy + Math.sin(t)*sr*0.4;
      var front = Math.sin(t) > 0;
      g.beginPath(); g.arc(sx, sy, front ? 2.6 : 1.8, 0, 6.2832);
      g.fillStyle = front ? "#e7ebf3" : "#5d6a86"; g.fill();
      if (front){
        var wp = ((_plT*1.6 + j*0.5) % 1);
        g.beginPath(); g.arc(sx, sy, 3 + wp*7, 0, 6.2832);
        g.strokeStyle = TEAM.sat; g.globalAlpha = 0.45*(1-wp); g.lineWidth = 1; g.stroke();
        g.globalAlpha = 1;
      }
    }

    /* DEFENCE BELT — one ship per test, capped at 9 (:1645-1646), team green.
       UNMEASURED is an amber dashed orbit — never a green belt, never an empty one. */
    var br = pr * 1.5;
    if (p.unmeas){
      g.strokeStyle = TEAM.shock; g.globalAlpha = .8; g.lineWidth = 1.4; g.setLineDash([3,4]);
      g.beginPath(); g.arc(cx, cy, br, 0, 6.2832); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
    } else if (p.tests > 0){
      var seg = Math.min(FCAP.def, p.tests);
      for (var i = 0; i < seg; i++){
        var a = _plT*0.9 + i * (6.2832/seg);
        g.save(); g.translate(cx + Math.cos(a)*br, cy + Math.sin(a)*br*0.86); g.rotate(a + 1.57);
        g.beginPath(); g.moveTo(0,-3.4); g.lineTo(2.3,3); g.lineTo(0,1.6); g.lineTo(-2.3,3);
        g.closePath(); g.fillStyle = TEAM.def; g.fill(); g.restore();
      }
    }

    /* RAIDERS — THREE when nothing covers this element (:1648 ung=3), plus one when
       it is a god-object (:1647). Amber, not red, when the station never measured it:
       a raider that says "unknown" rather than "unguarded". */
    var raiders = p.untested ? FCAP.ung : 0;
    if (p.unmeas) raiders = 1;
    if (p.god) raiders += 1;
    for (var q = 0; q < raiders; q++){
      var t2 = _plT*1.7 + q * (6.2832/Math.max(1,raiders)), rr = pr*2.75;
      var rx = cx + Math.cos(t2)*rr, ry = cy + Math.sin(t2)*rr*0.55;
      g.save(); g.translate(rx, ry); g.rotate(t2 + 1.57);
      g.beginPath(); g.moveTo(0,-5); g.lineTo(3.4,4); g.lineTo(0,2); g.lineTo(-3.4,4); g.closePath();
      g.fillStyle = p.unmeas ? TEAM.shock : TEAM.atk; g.fill(); g.restore();
    }

    /* GOD DOT — the red marker the field pins at (br*0.82, br*0.82) (:1798-1799) */
    if (p.god){
      var pu = 1 + 0.25*Math.sin(_plT*8);
      g.beginPath(); g.arc(cx + pr*0.82, cy - pr*0.82, 2.6*pu, 0, 6.2832);
      g.fillStyle = "#e5484d"; g.fill();
    }
  });
  requestAnimationFrame(planetTick);
}
requestAnimationFrame(planetTick);
