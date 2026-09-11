/* shared shell: the fake graph field, the element picker, the demoted ledger.
   Each proposal supplies renderDock(el) and (optionally) renderJourney().      */

var KCOL = { endpoint:"--k-endpoint", model:"--k-model", schema:"--k-schema", web:"--k-web",
  component:"--k-component", hook:"--k-hook", route:"--k-route", external:"--k-external",
  middleware:"--k-middleware", flag:"--k-flag" };
function kcol(k){ return "var("+(KCOL[k]||"--muted")+")"; }

function el(tag, attrs, kids){
  var n = document.createElement(tag);
  for (var a in (attrs||{})) {
    if (a === "class") n.className = attrs[a];
    else if (a === "html") n.innerHTML = attrs[a];
    else if (a === "text") n.textContent = attrs[a];
    else if (a === "style") n.setAttribute("style", attrs[a]);
    else if (a.slice(0,2) === "on") n[a] = attrs[a];
    else n.setAttribute(a, attrs[a]);
  }
  (kids||[]).forEach(function(k){ if (k) n.appendChild(k); });
  return n;
}

/* one row inside a slot.
   ICON MODE (G): the key becomes a glyph and its word moves to the hover tooltip.
   Proposals A-F leave __ICONMODE unset and keep the word gutter. */
function rowEl(row){
  var key;
  if (window.__ICONMODE && typeof rowSvg === "function"){
    key = el("span", { class:"rk ico", html:rowSvg(row.k, 12) });
    if (typeof tipOn === "function" && row.k) tipOn(key, row.k, row.v);
  } else {
    key = el("span", { class:"rk", text:row.k });
  }
  return el("div", { class:"rw " + (row.tone||"") }, [
    key,
    el("span", { class:"rv", text:row.v })
  ]);
}

/* A SLOT is built the same way in all three proposals: header + every row.
   A slot whose rows are ALL honest-empty gets .empty — dimmed, never removed. */
function slotEl(spec, rows, opts){
  opts = opts || {};
  rows = rows || [];
  var live = rows.filter(function(x){ return x.tone !== "none" && x.tone !== "unmeas"; }).length;
  var box = el("div", { class:"slot" + (live ? "" : " empty"), "data-slot":spec.key,
                        title:spec.label + " — " + spec.hint });
  var hd = el("div", { class:"slothd" });
  if (window.__ICONMODE && typeof rowSvg === "function"){
    /* icon + TITLE, matching the control panel's nomenclature */
    var sg = el("span", { class:"sl ico" });
    sg.innerHTML = rowSvg((typeof REGI !== "undefined" && REGI[spec.label]) || "__row", 12);
    sg.appendChild(el("span", { class:"vt", text:spec.label }));
    if (typeof tipOn === "function") tipOn(sg, spec.label, spec.hint || "");
    hd.appendChild(sg);
  } else hd.appendChild(el("span", { class:"sl", text:spec.label }));
  /* the denominator is the FACT count, not the authored-row count. Recipe's STORE
     read 6/6 while 38 columns exist — census F3's capped m.cols reappearing in the
     proposals' own chrome. opts.facts carries the true total when it differs. */
  if (!opts.nocount) {
    var tot = (opts.facts != null) ? opts.facts : rows.length;
    hd.appendChild(el("span", { class:"sn", text: live + "/" + tot }));
  }
  box.appendChild(hd);
  var body = el("div", { class:"slotbody" });
  rows.forEach(function(r){ body.appendChild(rowEl(r)); });
  box.appendChild(body);
  /* measured after layout, not guessed: the class only lands if the body really
     overflows its box at the dock's current height */
  /* recomputed on every resize, not once — the dock height is the dimension most
     likely to be dragged, and a stale clip tag turns "clipping is marked, not
     silent" back into a silent cut. */
  var mark = function(){ box.classList.toggle("clipped", body.scrollHeight > body.clientHeight + 1); };
  requestAnimationFrame(mark);
  if (window.ResizeObserver) { try { new ResizeObserver(mark).observe(body); } catch (e) {} }
  window.addEventListener("resize", function(){ requestAnimationFrame(mark); });
  return box;
}

/* the stage: a still constellation so the dock has something to sit under */
function buildStage(){
  var svg = document.getElementById("field");
  var W = 1600, H = 700, seedN = 0;
  function rnd(){ seedN = (seedN * 1103515245 + 12345) & 0x7fffffff; return seedN / 0x7fffffff; }
  var kinds = Object.keys(KCOL), parts = [];
  for (var i = 0; i < 240; i++){
    var x = 60 + rnd() * (W - 120), y = 40 + rnd() * (H - 80);
    var k = kinds[Math.floor(rnd() * kinds.length)], rr = 1.6 + rnd() * 3.2;
    parts.push('<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rr.toFixed(1)+
               '" fill="'+kcol(k)+'" opacity="'+(0.18 + rnd()*0.5).toFixed(2)+'"/>');
  }
  for (var j = 0; j < 90; j++){
    var x1 = 60+rnd()*(W-120), y1 = 40+rnd()*(H-80), x2 = x1+(rnd()-.5)*260, y2 = y1+(rnd()-.5)*180;
    parts.push('<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+
               '" y2="'+y2.toFixed(1)+'" stroke="#2b3650" stroke-width="1" opacity="0.5"/>');
  }
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.innerHTML = parts.join("");
}

/* the picker — click through the elements and watch the slots hold position */
var CUR = null, CYCLE = null;
function buildPicker(onPick){
  var bar = document.getElementById("pick");
  bar.appendChild(el("span", { class:"plbl", text:"element" }));
  ELEMENTS.forEach(function(e, i){
    var c = el("button", { class:"ec" + (e.gap ? " gap" : ""), "data-id":e.id,
      title:e.note, onclick:function(){ pick(e.id, onPick); } }, [
      el("span", { class:"dot", style:"background:" + (e.gap ? "var(--bad)" : kcol(e.kind)) }),
      el("span", { text:e.short })
    ]);
    bar.appendChild(c);
  });
  bar.appendChild(el("span", { class:"spacer" }));
  bar.appendChild(el("button", { class:"tbtn", text:"skeleton",
    onclick:function(ev){ document.body.classList.toggle("skel");
      ev.target.classList.toggle("on", document.body.classList.contains("skel")); } }));
  bar.appendChild(el("button", { class:"tbtn", text:"cycle",
    onclick:function(ev){
      if (CYCLE){ clearInterval(CYCLE); CYCLE = null; ev.target.classList.remove("on"); return; }
      ev.target.classList.add("on");
      CYCLE = setInterval(function(){
        var i = ELEMENTS.map(function(x){ return x.id; }).indexOf(CUR);
        pick(ELEMENTS[(i + 1) % ELEMENTS.length].id, onPick);
      }, 1400);
    } }));
  bar.appendChild(el("button", { class:"tbtn", text:"what got demoted",
    onclick:function(ev){ document.body.classList.toggle("showdemo");
      ev.target.classList.toggle("on", document.body.classList.contains("showdemo")); } }));
}
function pick(id, onPick){
  CUR = id;
  Array.prototype.forEach.call(document.querySelectorAll("#pick .ec"), function(c){
    c.classList.toggle("on", c.getAttribute("data-id") === id);
  });
  var e = ELEMENTS.filter(function(x){ return x.id === id; })[0];
  onPick(e);
}

function buildDemoted(extra){
  var d = document.getElementById("demo");
  d.appendChild(el("h3", { text:"demoted on purpose — named, not dropped" }));
  DEMOTED.forEach(function(row){
    d.appendChild(el("div", { class:"dr" }, [
      el("b", { text:row[0] }), el("span", { text:row[1] })
    ]));
  });
  d.appendChild(el("div", { class:"foot", text: extra }));
}
