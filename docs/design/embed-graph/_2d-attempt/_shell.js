/* _shell.js — the spike harness. Everything that is NOT the layout.
 *
 * A page declares one object and nothing else:
 *
 *   (window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["A"] = {
 *     letter: "A", name: "column strip", ancestor: "the station's L2 drill",
 *     lede:   "one sentence on what this shape claims",
 *     note:   { holds: [...], breaks: [...] },
 *     draw:   function (ctx) { ... }
 *   };
 *
 * and the page names its pick with `window.EMBED_PICK = "A"`, so the six-up index.html can load all
 * six layout modules and mount them against ONE subject. Each draw() therefore lives in exactly one
 * file, which is what makes the comparison honest.
 *
 * so the ONLY variable between two spike pages is draw(). Same feed, same slice, same cap, same
 * frame, same two controls, same honest line. If page B reads better than page A, that is the
 * layout, not a styling accident — which is the entire reason this file exists.
 *
 * DRAW CONTRACT
 *   ctx.g      a cleared <g> to draw into
 *   ctx.w/h    the body's pixel box
 *   ctx.size   "inline" | "card" | "panel"    (a layout MAY simplify itself at inline)
 *   ctx.slice  {subject, nodes, edges, honest, stats}
 *   ctx.G      the shared grammar
 *   ctx.hover(node|null)   drives the readout
 *   ctx.el(tag, attrs, parent)   svg element helper
 *
 * FOCUS IS THE SHELL'S JOB, not a layout's. Set data-n="<node id>" on a node group and
 * data-e="<a>||<b>" on a wire, and hover-dimming works for free. A layout that implements its
 * own dimming is measuring its own dimming.
 */
window.EmbedShell = (function () {

  var SIZE = { inline: { w: 244, h: 92 }, card: { w: 324, h: 218 }, panel: { w: 644, h: 396 } };
  var FEED_PATH = "../../../templates/center/shell/example/codebase-graph-station/";

  var IX = null, L = null, SUBJ = null;
  var state = { scope: "entity", id: "pantry", hops: 1, size: "card" };

  function el(tag, attrs, parent) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  /* -- boot -------------------------------------------------------------------------------- */

  function boot() {
    L = (window.EMBED_LAYOUTS || {})[window.EMBED_PICK];
    if (!L) { fail("no layout registered for EMBED_PICK=" + window.EMBED_PICK); return; }
    if (!window.GABE_C4) { fail("window.GABE_C4 is absent — the frozen example feed did not load from " + FEED_PATH); return; }
    IX = window.GabeSlice.index(window.GABE_C4, window.GABE_COMMITS || []);
    SUBJ = window.GabeSlice.subjects(IX);

    var q = new URLSearchParams(location.search);
    ["scope", "id", "size"].forEach(function (k) { if (q.get(k)) state[k] = q.get(k); });
    if (q.get("hops")) state.hops = parseInt(q.get("hops"), 10) || 1;
    if (!SUBJ[state.scope]) state.scope = "entity";
    if (!SUBJ[state.scope].some(function (s) { return s.id === state.id; })) {
      state.id = SUBJ[state.scope][0].id;
    }

    header();
    labbar();
    var grid = h("div", "labgrid");
    grid.id = "grid";
    document.body.appendChild(grid);
    note();
    render();
  }

  function fail(msg) {
    var b = h("div", "labnote");
    b.appendChild(h("h3", null, "honest empty"));
    b.appendChild(h("div", null, msg));
    document.body.appendChild(b);
  }

  function header() {
    var hd = h("div", "labhead");
    hd.appendChild(h("span", "letter", L.letter));
    hd.appendChild(h("h1", null, L.name));
    hd.appendChild(h("span", "anc", L.ancestor ? "after " + L.ancestor : ""));
    document.body.appendChild(hd);
    var ld = h("p", "lablede");
    ld.innerHTML = L.lede;
    document.body.appendChild(ld);
  }

  /* -- lab bar: the harness controls, deliberately OUTSIDE the frame --------------------- */

  function labbar() {
    var bar = h("div", "labbar");

    bar.appendChild(h("label", null, "subject"));
    ["entity", "commit", "test"].forEach(function (s) {
      var b = h("button", state.scope === s ? "on" : "", s);
      b.onclick = function () {
        state.scope = s; state.id = SUBJ[s][0].id; sync(); render();
      };
      b.dataset.scope = s;
      bar.appendChild(b);
    });

    var sel = h("select");
    sel.id = "pick";
    sel.onchange = function () { state.id = sel.value; render(); };
    bar.appendChild(sel);

    bar.appendChild(h("div", "sep"));
    bar.appendChild(h("label", null, "size"));
    ["inline", "card", "panel"].forEach(function (s) {
      var b = h("button", state.size === s ? "on" : "", s);
      b.onclick = function () { state.size = s; sync(); render(); };
      b.dataset.size = s;
      bar.appendChild(b);
    });

    bar.appendChild(h("div", "sep"));
    var cy = h("button", "", "cycle");
    var timer = null;
    cy.onclick = function () {
      if (timer) { clearInterval(timer); timer = null; cy.className = ""; return; }
      cy.className = "on";
      timer = setInterval(function () {
        var list = SUBJ[state.scope];
        var i = list.findIndex(function (s) { return s.id === state.id; });
        state.id = list[(i + 1) % list.length].id;
        render();
      }, 1600);
    };
    bar.appendChild(cy);

    var all = h("button", "", "all six");
    all.onclick = function () { location.href = "index.html?scope=" + state.scope + "&id=" + encodeURIComponent(state.id); };
    bar.appendChild(all);

    document.body.appendChild(bar);
  }

  function sync() {
    document.querySelectorAll(".labbar button[data-scope]").forEach(function (b) {
      b.className = b.dataset.scope === state.scope ? "on" : "";
    });
    document.querySelectorAll(".labbar button[data-size]").forEach(function (b) {
      b.className = b.dataset.size === state.size ? "on" : "";
    });
  }

  function note() {
    if (!L.note) return;
    var n = h("div", "labnote");
    n.appendChild(h("h3", null, "what this shape holds, and where it breaks"));
    var ul = h("ul");
    (L.note.holds || []).forEach(function (t) {
      var li = h("li"); li.innerHTML = "<b>holds</b> — " + t; ul.appendChild(li);
    });
    (L.note.breaks || []).forEach(function (t) {
      var li = h("li"); li.innerHTML = "<b>breaks</b> — " + t; ul.appendChild(li);
    });
    n.appendChild(ul);
    document.body.appendChild(n);
  }

  /* -- render ------------------------------------------------------------------------------ */

  function render() {
    var sel = document.getElementById("pick");
    sel.innerHTML = "";
    SUBJ[state.scope].forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.label + "  —  " + s.sub;
      if (s.id === state.id) o.selected = true;
      sel.appendChild(o);
    });

    var box = SIZE[state.size];
    var slice = window.GabeSlice.resolve(IX, {
      scope: state.scope, id: state.id, hops: state.hops,
      budget: state.size === "inline" ? 10 : state.size === "card" ? 24 : 60
    });

    var grid = document.getElementById("grid");
    grid.innerHTML = "";
    grid.appendChild(mount(slice, box, L));

    var cap = h("p", "labcap",
      "slice " + slice.stats.kb + " kb  ·  " + slice.stats.drawn + "/" + slice.stats.candidates +
      " nodes  ·  " + slice.stats.edges + " wires  ·  seed " + slice.stats.seed +
      "  ·  budget " + slice.stats.budget + "  ·  full feed 1,188 kb");
    grid.appendChild(cap);
  }

  /* THE EMBED — this frame and its two controls are the shippable part */
  function mount(slice, box, layout, opt) {
    opt = opt || {};
    var size = opt.size || state.size;
    var hopNow = opt.hops || state.hops;
    var onHops = opt.onHops || function (n) { state.hops = n; render(); };
    var wrap = h("div", "emb size-" + size);

    var head = h("div", "emb-head");
    var dot = h("span", "dot");
    dot.style.background = slice.subject.color;
    head.appendChild(dot);
    head.appendChild(h("span", "ttl", slice.subject.label));
    head.appendChild(h("span", "sub", slice.subject.sub || ""));
    var go = document.createElement("a");
    go.className = "go";
    go.href = "#";
    go.title = "open in the station — " + (slice.subject.station || "");
    go.textContent = "↗";
    go.onclick = function (e) { e.preventDefault(); };
    head.appendChild(go);
    wrap.appendChild(head);

    var body = h("div", "emb-body");
    body.style.height = box.h + "px";
    var svg = el("svg", { viewBox: "0 0 " + box.w + " " + box.h, preserveAspectRatio: "xMidYMid meet" });
    body.appendChild(svg);
    var read = h("div", "emb-read");
    body.appendChild(read);
    wrap.appendChild(body);

    var foot = h("div", "emb-foot");
    var hops = h("div", "emb-hops");
    [1, 2].forEach(function (n) {
      var b = h("button", hopNow === n ? "on" : "");
      b.title = n === 1 ? "this subject only" : "one hop out";
      b.innerHTML = hopGlyph(n);
      b.onclick = function () { onHops(n); };
      hops.appendChild(b);
    });
    foot.appendChild(hops);
    var hon = h("div", "emb-honest" + (slice.honest.length ? "" : " clean"),
      slice.honest.length ? slice.honest.join("  ·  ") : "complete — nothing held back");
    hon.title = slice.honest.join("\n") || "every candidate piece is drawn";
    foot.appendChild(hon);
    wrap.appendChild(foot);

    var g = el("g", {}, svg);
    var ctx = {
      svg: svg, g: g, w: box.w, h: box.h, size: size, slice: slice,
      G: window.GabeGrammar, el: el,
      hover: function (n) {
        if (!n) { read.className = "emb-read"; focus(svg, null); return; }
        read.className = "emb-read on";
        read.innerHTML = "<b>" + esc(String(n.label).slice(0, 42)) + "</b> <i>" + esc(n.kind) +
          (n.deg ? " · " + n.deg + " wires" : "") + (n.ring ? " · 1 hop out" : "") + "</i>";
        focus(svg, n.id);
      }
    };
    setTimeout(function () { layout.draw(ctx); }, 0);
    return wrap;
  }

  /* generic hover focus — layouts only have to label their elements */
  function focus(svg, id) {
    var nodes = svg.querySelectorAll("[data-n]"), wires = svg.querySelectorAll("[data-e]");
    if (!id) {
      nodes.forEach(function (e) { e.classList.remove("dimmed"); });
      wires.forEach(function (e) { e.classList.remove("dimmed"); });
      return;
    }
    var near = {};
    near[id] = 1;
    wires.forEach(function (e) {
      var p = e.getAttribute("data-e").split("||");
      if (p[0] === id || p[1] === id) { near[p[0]] = 1; near[p[1]] = 1; }
    });
    nodes.forEach(function (e) { e.classList.toggle("dimmed", !near[e.getAttribute("data-n")]); });
    wires.forEach(function (e) {
      var p = e.getAttribute("data-e").split("||");
      e.classList.toggle("dimmed", p[0] !== id && p[1] !== id);
    });
  }

  function hopGlyph(n) {
    if (n === 1) {
      return '<svg viewBox="0 0 22 9"><line x1="4" y1="4.5" x2="18" y2="4.5" stroke="#5a6272" stroke-width="1.2"/>' +
             '<circle cx="4" cy="4.5" r="3" fill="#e6e9ef"/><circle cx="18" cy="4.5" r="3" fill="#8b93a3"/></svg>';
    }
    return '<svg viewBox="0 0 34 9"><line x1="4" y1="4.5" x2="30" y2="4.5" stroke="#5a6272" stroke-width="1.2"/>' +
           '<circle cx="4" cy="4.5" r="3" fill="#e6e9ef"/><circle cx="17" cy="4.5" r="3" fill="#8b93a3"/>' +
           '<circle cx="30" cy="4.5" r="3" fill="#5a6272"/></svg>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* -- helpers every layout wants ----------------------------------------------------------- */

  function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  function shortLabel(n, max) {
    var s = String(n.label || "");
    if (n.kind === "endpoint") { var p = s.split(" "); s = p.length > 1 ? p[1] : s; }
    s = s.replace(/^.*\//, "").replace(/\{|\}/g, "");
    return trunc(s || n.label, max || 14);
  }

  return { boot: boot, mount: mount, el: el, esc: esc, trunc: trunc, shortLabel: shortLabel, SIZE: SIZE };
})();

/* single-layout pages name their pick; index.html mounts all six itself and must not auto-boot */
document.addEventListener("DOMContentLoaded", function () {
  if (window.EMBED_PICK) window.EmbedShell.boot();
});
