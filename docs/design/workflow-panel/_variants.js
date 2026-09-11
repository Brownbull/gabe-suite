/* ═══════════════════════════════════════════════════════════════════════════
   THE VARIANT SYSTEM — layouts and skins, driven from a SEPARATE menu.

   The operator's rule: "dropdown buttons for each one of the sections too, but
   not in the sections themselves: in a separate menu to go and iterate on each
   one of them." So no region carries its own control. Every region reads its
   variant from VSTATE and re-renders; nothing about the region's RECTANGLE
   changes — only what is drawn inside it.

   That separation is the same one Blizzard enforces across the three race
   consoles: the art is a skin over ONE geometry. A skin here may set colour
   tokens and nothing else — if a skin moves a region by a pixel it has broken
   the law the whole page argues for, and the geometry probe will catch it.
   ═══════════════════════════════════════════════════════════════════════════ */

/* the three density tiers — a region declares which one it is currently in */
var DENSITY = [
  { key:"glance", name:"GLANCE", hint:"the fewest rows that still answer the question" },
  { key:"read",   name:"READ",   hint:"the working default" },
  { key:"audit",  name:"AUDIT",  hint:"everything the feed carries, scrolling where it must" },
];

/* the registry: VARIANTS[region] = [{key, name, density, note}]
   Filled by _variants-defs.js so this file stays the mechanism, not the content. */
var VARIANTS = {};
/* ── THE DEFAULT, set by the operator 2026-09-09 from a live config copy ──
   measured at 2560x1305: height 33% -> 431px · left 448 · right 644 · middle 1468
   Anything not listed keeps its registry default (the first variant). */
var VSTATE = {
  skin:"protoss", frame:"line", density:"read",
  pct:33, wl:448, wr:644, ts:1.15,
  status:"spine", portrait:"planet", command:"g53", minimap:"cam",
};

function vRegister(region, list){
  VARIANTS[region] = list;
  if (!VSTATE[region]) VSTATE[region] = list[0].key;
}
function vOf(region){ return VSTATE[region] || ((VARIANTS[region] || [{key:"default"}])[0].key); }
/* the frame is the one variant that dresses the CONTAINER rather than its
   contents, so it rides on a body attribute the stylesheet keys off. */
function applyFrame(){ document.body.setAttribute("data-frame", vOf("frame")); }
function vDef(region){
  var l = VARIANTS[region] || [];
  for (var i = 0; i < l.length; i++) if (l[i].key === vOf(region)) return l[i];
  return l[0] || null;
}

/* ── SKINS — colour tokens ONLY. Geometry is not theirs to touch. ────────── */
var SKINS = {};
function vSkin(key, def){ SKINS[key] = def; }

function applySkin(key){
  var s = SKINS[key]; if (!s) return;
  var root = document.documentElement;
  /* clear the previous skin's tokens before applying, so a skin that omits a
     token falls back to the stylesheet rather than inheriting its predecessor's */
  Object.keys(SKINS).forEach(function(k){
    Object.keys(SKINS[k].tokens || {}).forEach(function(t){ root.style.removeProperty(t); });
  });
  Object.keys(s.tokens || {}).forEach(function(t){ root.style.setProperty(t, s.tokens[t]); });
  document.body.setAttribute("data-skin", key);
  VSTATE.skin = key;
}

/* ── THE MENU — an overlay, opened from the chrome, never from a region ──── */
function buildVariantMenu(onChange){
  var host = document.getElementById("vmenu");
  if (!host) return;
  host.innerHTML = "";

  host.appendChild(el("div", { class:"vmhd" }, [
    el("span", { text:"LAYOUT" }),
    el("button", { class:"vmx", text:"×",
      onclick:function(){ document.body.classList.remove("vmenu-on"); } })
  ]));

  /* GLOBAL — skin + density. These move every region at once. */
  var g = el("div", { class:"vmsec" }, [ el("div", { class:"vmlbl", text:"GLOBAL" }) ]);
  g.appendChild(vRow("skin", "skin", Object.keys(SKINS).map(function(k){
    return { key:k, name:SKINS[k].name, note:SKINS[k].note || "" };
  }), function(k){ applySkin(k); onChange(); }));
  g.appendChild(vRow("density", "density", DENSITY.map(function(d){
    return { key:d.key, name:d.name, note:d.hint };
  }), function(k){
    VSTATE.density = k;
    /* a density change snaps every region to its variant AT that tier, when it
       has one — the point of a global tier is that one click moves the whole
       console, not that it silently overrides a per-region choice that fits. */
    Object.keys(VARIANTS).forEach(function(r){
      var at = VARIANTS[r].filter(function(v){ return v.density === k; })[0];
      if (at) VSTATE[r] = at.key;
    });
    buildVariantMenu(onChange); onChange();
  }));
  host.appendChild(g);

  /* PER REGION */
  var s = el("div", { class:"vmsec" }, [ el("div", { class:"vmlbl", text:"REGIONS" }) ]);
  Object.keys(VARIANTS).forEach(function(r){
    s.appendChild(vRow(r, r, VARIANTS[r], function(k){ VSTATE[r] = k; onChange(); }));
  });
  host.appendChild(s);

  host.appendChild(el("div", { class:"vmfoot", text:
    "A skin sets colour tokens and nothing else. If one moves a region by a pixel it "
    + "has broken the law this page argues for — the geometry probe checks that." }));
}

/* one menu row: a label plus a real <select>, which is the dropdown the operator asked for */
function vRow(id, label, opts, onPick){
  var row = el("div", { class:"vmrow" });
  row.appendChild(el("span", { class:"vmk", text:label }));
  var sel = el("select", { class:"vmsel", "data-r":id });
  opts.forEach(function(o){
    var op = el("option", { value:o.key, text:o.name + (o.density ? "  · " + o.density : "") });
    if ((id === "skin" ? VSTATE.skin : id === "density" ? VSTATE.density : vOf(id)) === o.key)
      op.setAttribute("selected", "selected");
    sel.appendChild(op);
  });
  sel.onchange = function(){ onPick(sel.value); };
  row.appendChild(sel);
  var cur = opts.filter(function(o){
    return o.key === (id === "skin" ? VSTATE.skin : id === "density" ? VSTATE.density : vOf(id)); })[0];
  row.appendChild(el("span", { class:"vmnote", text: (cur && (cur.note || cur.dropsWhat)) || "" }));
  return row;
}
