/* F · FOCUS + CONTEXT — the cap IS the design.
 *
 * Every other page treats the node budget as damage to be minimised. This one treats it as the
 * instrument. A handful of pieces are drawn PROPERLY — full labels, real wires, room to breathe —
 * and everything else becomes a countable chip: "+12 schema", "+7 model". Click a chip and the
 * focus swaps to that kind, in place.
 *
 * The claim: a reader is better served by five pieces they can actually read plus an exact count of
 * what is hidden, than by twenty-four pieces they cannot. The chips are not a legend and not an
 * overflow — they are the honest line, drawn as geometry.
 */
(window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["F"] = {
  letter: "F",
  name: "focus + context",
  ancestor: "focus+context / fisheye, with the cap promoted to the interface",
  lede: "A handful of pieces drawn <b>properly</b> — full labels, real wires, room to breathe — and " +
        "everything else as a countable chip: <code>+12 schema</code>. Click a chip and the focus swaps " +
        "to that kind, in place. The claim: five pieces you can read plus an exact count of what is " +
        "hidden beats twenty-four you cannot.",
  note: {
    holds: [
      "the only layout where labels are always legible, at every size, whatever the subject's node count",
      "the hidden set is quantified and per-kind, so what is missing is as concrete as what is drawn",
      "the chips double as navigation, which is the second control the operator's chrome floor did NOT have to spend"
    ],
    breaks: [
      "shows the least of any of the six — an 81-piece entity arrives as 5 shapes and 6 numbers, and the overall shape is gone",
      "the focus set is chosen by degree, and degree is a proxy: the most-wired piece is not always the most important one",
      "swapping focus by kind is a second interaction to learn, and an embed that teaches an interaction is no longer minimal"
    ]
  },

  draw: function (ctx) {
    var G = ctx.G, S = window.EmbedShell, s = ctx.slice;
    if (!s.nodes.length) { S.el("text", { x: ctx.w / 2, y: ctx.h / 2, "text-anchor": "middle", class: "n-lbl" }, ctx.g).textContent = "nothing to draw"; return; }

    var tiny = ctx.size === "inline";
    var nFocus = tiny ? 3 : ctx.size === "panel" ? 9 : 5;
    var pinned = ctx.pinKind || null;

    var pool = s.nodes.slice().sort(function (a, b) {
      return a.ring - b.ring || b.deg - a.deg || (a.id < b.id ? -1 : 1);
    });
    var picked = pinned ? pool.filter(function (n) { return n.kind === pinned; }) : pool;
    var focus = picked.slice(0, nFocus);
    var fset = {};
    focus.forEach(function (n) { fset[n.id] = 1; });

    /* the context: everything not drawn, counted per kind */
    var rest = {};
    s.nodes.forEach(function (n) { if (!fset[n.id]) rest[n.kind] = (rest[n.kind] || 0) + 1; });
    var chips = Object.keys(rest).sort(function (a, b) { return G.kindRank(a) - G.kindRank(b); });

    var chipH = tiny ? 0 : 15;
    var areaH = ctx.h - chipH - (tiny ? 4 : 10);
    var wires = S.el("g", {}, ctx.g), blocks = S.el("g", {}, ctx.g);

    /* focus blocks stack down the middle, widest first — a reading order, not a force layout */
    var bw = Math.min(ctx.w - 24, tiny ? 90 : 200);
    var bh = tiny ? 9 : 20, gap = tiny ? 3 : Math.min(12, (areaH - focus.length * bh) / (focus.length + 1));
    var totH = focus.length * bh + (focus.length - 1) * gap;
    var y0 = Math.max(6, (areaH - totH) / 2);
    var pos = {};

    focus.forEach(function (n, i) {
      /* alternate the indent so wires between neighbours have somewhere to bow */
      var x = (ctx.w - bw) / 2 + (i % 2 ? 14 : -14);
      var y = y0 + i * (bh + gap);
      pos[n.id] = { x: x, y: y + bh / 2, w: bw, cx: x + bw / 2 };

      var g = S.el("g", { class: "node", "data-n": n.id }, blocks);
      S.el("rect", { x: x, y: y, width: bw, height: bh, rx: tiny ? 2 : 4,
                     fill: n.color + "26", stroke: n.color, "stroke-width": 1 }, g);
      if (n.method) {
        S.el("rect", { x: x, y: y, width: 3, height: bh, rx: 1.5, fill: G.METHOD[n.method] }, g);
      }
      if (!tiny) {
        var t = S.el("text", { x: x + 8, y: y + bh / 2 + 3.4, class: "n-lbl strong" }, g);
        t.textContent = S.trunc(String(n.label), Math.floor((bw - 46) / 5.1));
        var d = S.el("text", { x: x + bw - 6, y: y + bh / 2 + 3.4, "text-anchor": "end", class: "k-lbl" }, g);
        d.textContent = n.deg ? n.deg + "→" : "—";
      }
      g.addEventListener("mouseenter", function () { ctx.hover(n); });
      g.addEventListener("mouseleave", function () { ctx.hover(null); });
    });

    s.edges.forEach(function (e) {
      var a = pos[e.a], b = pos[e.b];
      if (!a || !b) return;
      var side = a.x <= b.x ? -1 : 1;
      var x1 = side < 0 ? a.x : a.x + a.w, x2 = side < 0 ? b.x : b.x + b.w;
      var bow = side * (18 + Math.abs(a.y - b.y) * 0.16);
      S.el("path", { d: "M" + x1 + "," + a.y + "C" + (x1 + bow) + "," + a.y + " " +
                        (x2 + bow) + "," + b.y + " " + x2 + "," + b.y,
                     class: "wire" + (e.inferred ? " inferred" : ""), stroke: e.color,
                     "stroke-width": 1.1, "stroke-opacity": .6,
                     "data-e": e.a + "||" + e.b }, wires);
    });

    /* the context chips — the honest line as geometry */
    if (!tiny && chips.length) {
      var cy = ctx.h - chipH + 2;
      var right = ctx.w - 6 - (pinned ? 58 : 0);          /* the back link owns the right end */
      var wOf = function (txt) { return 12 + txt.length * 4.9; };
      var sumFrom = function (i) {
        var t = 0;
        for (var j = i; j < chips.length; j++) t += rest[chips[j]];
        return t;
      };

      /* CONSERVATION: a chip is only drawn if what follows it still has room for an overflow
         chip. A piece that is neither drawn nor counted is the silent drop this folder exists to
         prevent — the probe asserts drawn + chip counts == every resolved piece. */
      var cx = 8, i = 0;
      for (; i < chips.length; i++) {
        var after = sumFrom(i + 1);
        var need = wOf("+" + rest[chips[i]] + " " + chips[i]) +
                   (after ? 5 + wOf("+" + after + " more") : 0);
        if (cx + need > right) break;
        cx += drawChip(chips[i], "+" + rest[chips[i]] + " " + chips[i], G.kindCol(chips[i]), cx) + 5;
      }
      if (i < chips.length) {
        drawChip(null, "+" + sumFrom(i) + " more", "#8b93a3", cx);
      }

      function drawChip(kind, txt, col, x) {
        var w = wOf(txt);
        var g = S.el("g", { class: "node", style: kind ? "cursor:pointer" : "" }, ctx.g);
        S.el("rect", { x: x, y: cy, width: w, height: 12.5, rx: 6.2,
                       fill: col + "1c", stroke: col + "66", "stroke-width": .8 }, g);
        var t = S.el("text", { x: x + 6, y: cy + 9, class: "n-lbl" }, g);
        t.textContent = txt;
        if (kind) {
          g.addEventListener("click", function () {
            ctx.pinKind = (ctx.pinKind === kind) ? null : kind;
            while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);
            window.EMBED_LAYOUTS["F"].draw(ctx);
          });
        }
        return w;
      }
      if (pinned) {
        var back = S.el("text", { x: ctx.w - 6, y: cy + 9, "text-anchor": "end", class: "k-lbl",
                                  style: "cursor:pointer" }, ctx.g);
        back.textContent = "← all kinds";
        back.addEventListener("click", function () {
          ctx.pinKind = null;
          while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);
          window.EMBED_LAYOUTS["F"].draw(ctx);
        });
      }
    }
  }
};
