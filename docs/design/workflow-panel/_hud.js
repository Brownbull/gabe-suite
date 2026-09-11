/* ═══════════════════════════════════════════════════════════════════════════
   THE CONTROL HUD — one box, bottom-right of the graph, icons only.

   Operator rule: "we don't want to use wording. We want to use as many icons as
   possible and embed the wording in the hover effect." So every control here is a
   glyph; the words live in one shared tooltip that follows the pointer.

   This replaces three stacked strips (kind row · element chips · tier + tools)
   that had grown across the bottom of the stage. Those strips still exist in
   proposals A-F, which is why the HUD is additive and never edits _shell.js.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── one instant tooltip, shared. No native title= anywhere — the delay is the
      reason the station built __badgePop, and the same reasoning applies here. ── */
var TIP = null;
function tipInit(){
  if (TIP) return;
  TIP = el("div", { class:"hudtip" });
  document.body.appendChild(TIP);
}
function tipOn(node, title, sub){
  node.addEventListener("mouseenter", function(){
    tipInit();
    TIP.innerHTML = "";
    TIP.appendChild(el("b", { text:title }));
    if (sub) TIP.appendChild(el("i", { text:sub }));
    TIP.classList.add("on");
    var r = node.getBoundingClientRect(), t = TIP.getBoundingClientRect();
    /* BELOW the node, left-aligned to it. The old rule parked it LEFT of the node,
       written when the HUD sat in the bottom-right corner; once the panel moved to
       the top-LEFT that clamped to x=8 and the tip landed on top of the control it
       was describing. Below is the only side that is always free here.
       It flips ABOVE only when there is no room beneath. */
    var gap = 8;
    var x = Math.min(Math.max(8, r.left), window.innerWidth - t.width - 8);
    var below = r.bottom + gap;
    var y = (below + t.height + 8 <= window.innerHeight) ? below
          : Math.max(8, r.top - t.height - gap);
    TIP.style.left = Math.round(x) + "px";
    TIP.style.top  = Math.round(y) + "px";
  });
  node.addEventListener("mouseleave", function(){ if (TIP) TIP.classList.remove("on"); });
}

/* ── the icon set. Kind glyphs reuse svgK from _console.js; the rest are drawn
      here so the HUD never falls back to a letter. ── */
var HUDI = {
  tier:  '<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  skin:  '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  skel:  '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/>',
  cycle: '<polygon points="6 4 20 12 6 20 6 4"/>',
  demote:'<path d="M3 6h18M3 12h12M3 18h6"/><path d="m17 14 3 3 3-3"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  cog:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  /* one glyph per container FORM, so a variant reads as a shape not a word */
  spine: '<path d="M4 4v16M12 4v16M20 4v16"/>',
  ledger:'<path d="M3 5h18M3 10h18M3 15h18M3 20h18"/><path d="M8 3v18"/>',
  planet:'<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.6"/>',
  glyph: '<circle cx="12" cy="12" r="7"/>',
  grid53:'<rect x="3" y="5" width="4" height="4"/><rect x="10" y="5" width="4" height="4"/><rect x="17" y="5" width="4" height="4"/><rect x="3" y="12" width="4" height="4"/><rect x="10" y="12" width="4" height="4"/><rect x="17" y="12" width="4" height="4"/>',
  vlist: '<circle cx="5" cy="7" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="5" cy="17" r="1.4"/><path d="M10 7h11M10 12h11M10 17h11"/>',
  camup: '<path d="M12 2v20M2 12h20"/><path d="m12 2 4 5h-8z" fill="currentColor" stroke="none"/>',
  /* the fifteen command verbs */
  cmdFrame:'<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="2"/>',
  cmdFocus:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
  cmdDown:'<path d="M12 4v14"/><path d="m6 13 6 6 6-6"/>',
  cmdUp:'<path d="M12 20V6"/><path d="m6 11 6-6 6 6"/>',
  cmdNeigh:'<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m6.6 7.4 3.6 3.2M17.4 7.4l-3.6 3.2M6.6 16.6l3.6-3.2M17.4 16.6l-3.6-3.2"/>',
  cmdCallers:'<path d="M21 12H8"/><path d="m13 6-6 6 6 6"/><circle cx="21" cy="12" r="1.6"/>',
  cmdBehind:'<path d="M12 3v4"/><circle cx="12" cy="9" r="2"/><path d="M12 11v3M6 20v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3"/><circle cx="6" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/>',
  cmdTables:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  cmdScreens:'<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  cmdExpand:'<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
  cmdCluster:'<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="3"/>',
  cmdEntity:'<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M10.4 13 6.8 16M13.6 13l3.6 3"/>',
  cmdBack:'<path d="m14 6-6 6 6 6"/>',
  cmdFwd:'<path d="m10 6 6 6-6 6"/>',
  cmdClear:'<path d="M18 6 6 18M6 6l12 12"/>',
  /* text-size steps */
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  wleft:'<rect x="2" y="5" width="7" height="14" rx="1"/><path d="M12 5v14M16 5v14M20 5v14" opacity=".45"/>',
  wright:'<path d="M4 5v14M8 5v14M12 5v14" opacity=".45"/><rect x="15" y="5" width="7" height="14" rx="1"/>',
  frame:'<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10"/>',
  fr_line:'<rect x="3" y="5" width="18" height="14" rx="1"/>',
  fr_soft:'<rect x="3" y="5" width="18" height="14" rx="6"/>',
  fr_bevel:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7h18" opacity=".5"/><path d="M3 17h18" opacity=".5"/>',
  fr_notch:'<path d="M8 5h13v9l-5 5H3V10z"/>',
  fr_frame:'<rect x="3" y="5" width="18" height="14" rx="1"/><rect x="6" y="8" width="12" height="8"/>',
  fr_ornate:'<path d="M3 9V5h4M17 5h4v4M21 15v4h-4M7 19H3v-4"/>',
  dock:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 14h20"/><path d="M6 17h4M14 17h4"/>',
  tsize:'<path d="M4 7V5h9v2M8.5 5v14M6.5 19h4"/><path d="M14 12v-1h6v1M16.5 11v8M15 19h3"/>',
  north: '<circle cx="12" cy="12" r="9"/><path d="m12 5 2.5 7L12 19l-2.5-7z" fill="currentColor" stroke="none"/>',
};
function hudSvg(k, size){
  /* pointer-events is set INLINE, not in the stylesheet: the glyph must never be
     the hover target, and an inline style cannot be defeated by cascade order or
     by a stale file:// stylesheet. */
  return '<svg viewBox="0 0 24 24" width="' + (size||14) + '" height="' + (size||14) + '" fill="none" '
    + 'style="pointer-events:none" '
    + 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
    + (HUDI[k] || HUDI.cog) + '</svg>';
}
/* the kind glyphs come from _console.js's svgK, which knows nothing about the HUD */
function hudInert(html){ return String(html).replace("<svg ", '<svg style="pointer-events:none" '); }
/* the form glyph a variant should wear; falls back to its region's shape */
var VICON = { spine:"spine", table:"ledger", planet:"planet", glyph:"glyph",
              g53:"grid53", list:"vlist", cam:"camup", north:"north" };

function hudBtn(opts){
  var b = el("button", { class:"hb" + (opts.on ? " on" : ""), html:opts.html || hudSvg(opts.icon, opts.size) });
  if (opts.style) b.setAttribute("style", opts.style);
  tipOn(b, opts.tip, opts.sub);
  b.onclick = opts.onclick;
  return b;
}
function hudRow(icon, tip, kids){
  var r = el("div", { class:"hrow" });
  var lab = el("span", { class:"hlab", html:hudSvg(icon, 13) });
  tipOn(lab, tip);
  r.appendChild(lab);
  var box = el("div", { class:"hbtns" });
  kids.forEach(function(k){ box.appendChild(k); });
  r.appendChild(box);
  return r;
}

/* ── THE CONTROL PANEL ────────────────────────────────────────────────────
   Top-LEFT of the page, where the proposal blurb used to be. The console keeps
   no control strip of its own — operator: "our panel will not have this weird
   top row".

   Each group wears its TITLE beside its icon, because these are section names
   the operator wants to read at a glance; only the BUTTONS stay wordless, with
   their meaning in the shared hover tooltip.

   Layout: KIND takes a full-width block (16 glyphs wrap to two rows); the six
   small groups pair off two-up. Four block rows, ~440px wide. ── */
function ctlGroup(icon, title, kids, wide){
  var g = el("div", { class:"cg" + (wide ? " wide" : "") });
  g.appendChild(el("div", { class:"cgh" }, [
    el("span", { class:"cgi", html:hudSvg(icon, 12) }),
    el("span", { class:"cgt", text:title })
  ]));
  var box = el("div", { class:"cgb" });
  kids.forEach(function(k){ box.appendChild(k); });
  g.appendChild(box);
  return g;
}

/* which REGION a container button targets, as a colour. The operator was pressing
   buttons and watching something unexpected change, because twelve buttons for four
   different regions sat in one undifferentiated pile. Two fixes, both applied:
   the group is SUBSECTIONED by region with the icon+title nomenclature, and every
   button carries its region's tint so the association survives a glance. */
var REGTINT = { status:"#4c9dfb", portrait:"#d946ef", command:"#e8a33d",
                minimap:"#4cbe83", cargo:"#c084fc", vitals:"#10b981",
                evidence:"#38bdf8", frame:"#8b83f5" };

/* a labelled sub-row inside a group — the same nomenclature as a group header,
   one level down */
function ctlSub(region, kids){
  var tint = REGTINT[region] || "var(--muted)";
  var row = el("div", { class:"cs" });
  var lab = el("div", { class:"csh" }, [
    el("span", { class:"csi", style:"color:" + tint,
      html:(typeof rowSvg === "function")
        ? rowSvg((typeof REGI !== "undefined" && REGI[region.toUpperCase()]) || region, 11)
        : hudSvg("layout", 11) }),
    el("span", { class:"cst", style:"color:" + tint, text:region.toUpperCase() })
  ]);
  row.appendChild(lab);
  var box = el("div", { class:"csb" });
  kids.forEach(function(k){ box.appendChild(k); });
  row.appendChild(box);
  return row;
}

function buildHud(ctx){
  var host = document.getElementById("ctlpanel");
  if (!host) return;
  host.innerHTML = "";
  var e = ctx.cur;

  /* KIND — the widest group, its own block */
  var byKind = {};
  ELEMENTS.forEach(function(x){ (byKind[x.kind] = byKind[x.kind] || []).push(x); });
  var order = ["endpoint","model","schema","store","function","hook","component","route",
               "module","type","web","provider","element","middleware","flag","external"];
  host.appendChild(ctlGroup("layout", "KIND", order.filter(function(k){ return byKind[k]; })
    .map(function(k){
      var col = (typeof rawKcol === "function") ? rawKcol(k) : "#8794ab";
      return hudBtn({ html:hudInert(svgK(k, col, 14)), tip:k, sub:byKind[k][0].note,
        on: e && e.kind === k, style:"color:" + col,
        onclick:function(){
          var l = byKind[k], i = l.map(function(x){ return x.id; }).indexOf(CUR);
          ctx.pick(l[(i + 1) % l.length].id);
        } });
    }), true));

  /* the six small groups, two-up */
  host.appendChild(ctlGroup("tier", "TIER", [0,1,2,3].map(function(t){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none">T' + t + '</span>',
      tip:"Tier " + t,
      sub:(typeof MM_TIERS !== "undefined" && MM_TIERS[t]) ? (MM_TIERS[t].name + " · " + MM_TIERS[t].vis + " drawn") : "",
      on:(typeof MM !== "undefined" && MM.tier === t),
      onclick:function(){ if (typeof MM !== "undefined"){ MM.tier = t; ctx.rerender(); } } });
  })));

  host.appendChild(ctlGroup("dock", "HEIGHT", [25, 30, 33, 37, 41, 45].map(function(pc){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none">' + pc + '</span>',
      tip:pc + "% of the page",
      sub: pc === 25 ? "SC2's command-card line (21.7%) is just below this"
         : pc === 27 || pc === 30 ? "SC2's own console band is 27.25% — this is the faithful range"
         : "above anything SC2 draws; the graph pays for it",
      on:(VSTATE.pct || 30) === pc,
      onclick:function(){ VSTATE.pct = pc;
        document.documentElement.style.setProperty("--dockpct", String(pc)); ctx.rerender(); } });
  })));


  /* WIDTH — the two wings. The middle is minmax(0,1fr), so it absorbs whatever
     the wings do not take; the tooltip states the middle it leaves at 1920. */
  host.appendChild(ctlGroup("wleft", "LEFT", [264, 300, 336, 392, 448].map(function(px){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none">' + px + '</span>',
      tip:"Minimap wing " + px + "px",
      sub:"leaves " + (1920 - px - (VSTATE.wr || 512)) + "px for the middle at 1920 wide",
      on:(VSTATE.wl || 336) === px,
      onclick:function(){ VSTATE.wl = px;
        document.documentElement.style.setProperty("--wingw", px + "px"); ctx.rerender(); } });
  })));

  host.appendChild(ctlGroup("wright", "RIGHT", [420, 466, 512, 578, 644].map(function(px){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none">' + px + '</span>',
      tip:"Portrait + command wing " + px + "px",
      sub:"leaves " + (1920 - (VSTATE.wl || 336) - px) + "px for the middle at 1920 wide",
      on:(VSTATE.wr || 512) === px,
      onclick:function(){ VSTATE.wr = px;
        document.documentElement.style.setProperty("--wingr", px + "px"); ctx.rerender(); } });
  })));

  host.appendChild(ctlGroup("tsize", "TEXT", [0.9, 1, 1.15, 1.3].map(function(t){
    return hudBtn({ html:'<span class="hnum" style="pointer-events:none;font-size:'
        + (7 + (t - 0.9) * 8).toFixed(1) + 'px">A</span>',
      tip:"Text " + Math.round(t * 100) + "%",
      sub: t === 1 ? "the baseline" : (t > 1 ? "rows wrap sooner; the regions do not grow"
                                             : "denser; the 12px floor is at 90%"),
      on:(VSTATE.ts || 1) === t,
      onclick:function(){ VSTATE.ts = t;
        document.documentElement.style.setProperty("--ts", String(t)); ctx.rerender(); } });
  })));

  host.appendChild(ctlGroup("skin", "SKIN", Object.keys(SKINS).map(function(k){
    var tk = SKINS[k].tokens || {};
    return hudBtn({ html:'<span class="hsw" style="pointer-events:none;background:' + (tk["--accent"] || "#888") + '"></span>',
      tip:SKINS[k].name, sub:SKINS[k].note, on:VSTATE.skin === k,
      onclick:function(){ applySkin(k); ctx.rerender(); } });
  })));

  /* CONTAINER — one block, but SUBSECTIONED by the region each button targets,
     and tinted to it. A flat pile of twelve was the problem. */
  var cg = el("div", { class:"cg wide sub" });
  cg.appendChild(el("div", { class:"cgh" }, [
    el("span", { class:"cgi", html:hudSvg("layout", 12) }),
    el("span", { class:"cgt", text:"CONTAINER" })
  ]));
  var cbody = el("div", { class:"cgsubs" });
  Object.keys(VARIANTS).forEach(function(reg){
    if (reg === "frame") return;                 /* frame dresses the box, own group */
    var tint = REGTINT[reg] || "var(--muted)";
    cbody.appendChild(ctlSub(reg, VARIANTS[reg].map(function(v){
      var on = vOf(reg) === v.key;
      return hudBtn({ icon:VICON[v.key] || "layout", tip:reg + " · " + v.name, sub:v.note,
        on:on, style:"color:" + tint + (on ? ";border-color:" + tint
                     + ";background:color-mix(in srgb," + tint + " 22%, transparent)" : ""),
        onclick:function(){ VSTATE[reg] = v.key; ctx.rerender(); } });
    })));
  });
  cg.appendChild(cbody);
  host.appendChild(cg);

  /* FRAME — the container treatment, its own group because it dresses the box
     rather than the contents. Each glyph is the silhouette it produces. */
  host.appendChild(ctlGroup("frame", "FRAME", (VARIANTS.frame || []).map(function(v){
    var on = vOf("frame") === v.key, t = REGTINT.frame;
    return hudBtn({ icon:"fr_" + v.key, tip:v.name, sub:v.note, on:on,
      style:"color:" + t + (on ? ";border-color:" + t
             + ";background:color-mix(in srgb," + t + " 22%, transparent)" : ""),
      onclick:function(){ VSTATE.frame = v.key; applyFrame(); ctx.rerender(); } });
  })));

  host.appendChild(ctlGroup("cog", "TOOLS", [
    hudBtn({ icon:"skel", tip:"Skeleton", sub:"draw the region frames",
      on:document.body.classList.contains("skel"),
      onclick:function(){ document.body.classList.toggle("skel"); ctx.rerender(); } }),
    hudBtn({ icon:"cycle", tip:"Cycle", sub:"advance the element every 1.4s",
      on:!!window.__hudCycle,
      onclick:function(){
        if (window.__hudCycle){ clearInterval(window.__hudCycle); window.__hudCycle = null; }
        else window.__hudCycle = setInterval(function(){
          var i = ELEMENTS.map(function(x){ return x.id; }).indexOf(CUR);
          ctx.pick(ELEMENTS[(i + 1) % ELEMENTS.length].id);
        }, 1400);
        ctx.rerender();
      } }),
    hudBtn({ icon:"demote", tip:"Demoted", sub:"the facts that do not fit, named not dropped",
      on:document.body.classList.contains("showdemo"),
      onclick:function(){ document.body.classList.toggle("showdemo"); ctx.rerender(); } }),
    hudBtn({ icon:"copy", tip:"Copy configuration",
      sub:"every dial as a pasteable block — hand it back and it becomes the default",
      onclick:copyConfig }),
  ]));
}


/* ── COPY THE CONFIGURATION ────────────────────────────────────────────────
   The operator experiments here and hands the result back as the default, so
   the block has to be complete and unambiguous: every dial, its value, and the
   measured consequence. Clipboard access is unreliable on file://, so the text
   is ALWAYS shown in a selectable panel and the copy is attempted on top. */
function configText(){
  var W = window.innerWidth, H = window.innerHeight;
  var wl = VSTATE.wl || 336, wr = VSTATE.wr || 512, pc = VSTATE.pct || 30;
  var dock = document.getElementById("dock");
  var dh = dock ? Math.round(dock.getBoundingClientRect().height) : null;
  var L = [];
  L.push("GABE CONSOLE — configuration");
  L.push("measured at " + W + "x" + H);
  L.push("");
  L.push("  height    " + pc + "%" + (dh ? ("   -> " + dh + "px  (" + (dh/H*100).toFixed(1) + "% actual)") : ""));
  L.push("  left      " + wl + "px    the minimap wing");
  L.push("  right     " + wr + "px    portrait + command");
  L.push("  middle    " + (W - wl - wr) + "px    (1fr, whatever the wings leave)");
  L.push("  text      " + Math.round((VSTATE.ts || 1) * 100) + "%");
  L.push("  skin      " + VSTATE.skin + (SKINS[VSTATE.skin] ? ("   " + SKINS[VSTATE.skin].name) : ""));
  L.push("  frame     " + vOf("frame"));
  L.push("  tier      T" + (typeof MM !== "undefined" ? MM.tier : "?"));
  L.push("");
  L.push("  containers");
  Object.keys(VARIANTS).forEach(function(r){
    if (r === "frame") return;
    var v = (VARIANTS[r] || []).filter(function(x){ return x.key === vOf(r); })[0];
    L.push("    " + (r + "          ").slice(0, 10) + vOf(r) + (v ? ("   " + v.name) : ""));
  });
  L.push("");
  L.push("  element   " + CUR);
  return L.join("\n");
}

function copyConfig(){
  var txt = configText();
  var box = document.getElementById("cfgout");
  if (!box){
    box = el("div", { id:"cfgout" });
    document.body.appendChild(box);
  }
  box.innerHTML = "";
  var hd = el("div", { class:"cfgh" }, [ el("span", { text:"CONFIGURATION" }) ]);
  var cp = el("button", { class:"cfgb", text:"copy" });
  var cl = el("button", { class:"cfgb", text:"close",
    onclick:function(){ box.classList.remove("on"); } });
  hd.appendChild(cp); hd.appendChild(cl);
  box.appendChild(hd);
  var ta = el("textarea", { class:"cfgt", spellcheck:"false" });
  ta.value = txt;
  box.appendChild(ta);
  box.classList.add("on");
  var doCopy = function(){
    ta.select(); ta.setSelectionRange(0, txt.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){ cp.textContent = "copied"; },
        function(){ cp.textContent = ok ? "copied" : "select + ⌘C"; });
    } else cp.textContent = ok ? "copied" : "select + ⌘C";
  };
  cp.onclick = doCopy;
  doCopy();
}
