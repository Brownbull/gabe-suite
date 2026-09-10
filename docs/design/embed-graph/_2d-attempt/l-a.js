/* A · COLUMN STRIP — the station's own L2 drill, shrunk to a card.
 *
 * One column per KIND, in the emitter's own layout.l2.order. A piece's position says what it IS;
 * a wire crossing left to right says the request direction. This is the shape a reader who has
 * used the codebase-graph station already knows, which is its whole argument.
 */
(window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["A"] = {
  letter: "A",
  name: "column strip",
  ancestor: "the codebase-graph station's L2 drill",
  lede: "One column per <b>kind</b>, in the emitter's own <code>layout.l2.order</code>. Position says what a " +
        "piece <b>is</b>; a left-to-right wire says which way the request flows. The shape a reader who has " +
        "opened the station already knows — that familiarity is the entire argument for it.",
  note: {
    holds: [
      "kind census at a glance: the column heights ARE the composition, so 'this entity is mostly schemas' is legible without a legend",
      "the per-kind cap law is visible in the picture — a short column with a held-back count reads as a cap, not as an absence",
      "scales down honestly: at inline size the headers and labels go, the columns stay, and the shape survives"
    ],
    breaks: [
      "a commit slice has no dominant direction — touched pieces scatter across every column and the left-to-right reading becomes decoration",
      "wires between adjacent columns pile into a single band; at 24 nodes the crossings are already hard to follow",
      "an entity with one huge kind (recipe: 46 schemas) spends its whole width on one column",
      "past ~6 kinds the headers stop fitting and fall back to colour bars — a commit spanning 8 kinds loses its labels entirely"
    ]
  },

  draw: function (ctx) {
    var G = ctx.G, S = window.EmbedShell, s = ctx.slice;
    if (!s.nodes.length) { S.el("text", { x: ctx.w / 2, y: ctx.h / 2, "text-anchor": "middle", class: "n-lbl" }, ctx.g).textContent = "nothing to draw"; return; }

    var tiny = ctx.size === "inline";
    var padX = tiny ? 8 : 10, padTop = tiny ? 8 : 16, padBot = 8;

    var kinds = [];
    s.nodes.forEach(function (n) { if (kinds.indexOf(n.kind) < 0) kinds.push(n.kind); });
    kinds.sort(function (a, b) { return G.kindRank(a) - G.kindRank(b); });

    var colW = (ctx.w - padX * 2) / kinds.length;

    /* FIT, never overflow: the cap bounds the TOTAL, not the tallest column, so a subject whose
       pieces pile into one kind would spill past the body — and a clipped chip is a piece the
       honest line still counts as drawn. Shrink the gap first, then the chip, to the tallest
       column. (Caught by eye on pantry/A before the probe grew a bbox assert.) */
    var tallest = 1;
    kinds.forEach(function (k) {
      var c = 0;
      s.nodes.forEach(function (n) { if (n.kind === k) c++; });
      if (c > tallest) tallest = c;
    });
    var avail = ctx.h - padTop - padBot;
    var chipH = tiny ? 7 : 14, gap = tiny ? 3 : 4;
    if (tallest * (chipH + gap) - gap > avail) {
      gap = Math.max(1, Math.min(gap, (avail / tallest) * 0.25));
      chipH = Math.max(3, (avail - (tallest - 1) * gap) / tallest);
    }
    var pos = {};

    var wires = S.el("g", {}, ctx.g), chips = S.el("g", {}, ctx.g);

    kinds.forEach(function (k, ci) {
      var col = s.nodes.filter(function (n) { return n.kind === k; });
      col.sort(function (a, b) { return a.ring - b.ring || b.deg - a.deg; });
      var cx = padX + ci * colW;
      var totH = col.length * chipH + (col.length - 1) * gap;
      var y0 = padTop + Math.max(0, (ctx.h - padTop - padBot - totH) / 2);

      /* a header is drawn only when its column can hold a legible one. Past ~6 kinds the
         columns narrow until "component"+"hook" collide into COMPONEHOOK (seen on commit
         a99719f3, 8 kinds); a truncated-to-collision header is worse than a colour bar, so the
         column wears its kind colour instead and the hover still names the piece. */
      var headroom = Math.floor(colW / 5.4);
      if (!tiny && headroom >= 4) {
        S.el("text", { x: cx + 1, y: 10, class: "k-lbl" }, ctx.g).textContent =
          k.length > headroom ? k.slice(0, headroom) : k;
      } else if (!tiny) {
        S.el("rect", { x: cx, y: 5, width: Math.max(3, colW - 6), height: 2.5, rx: 1.2,
                       fill: G.kindCol(k), "fill-opacity": .75 }, ctx.g);
      }

      col.forEach(function (n, i) {
        var y = y0 + i * (chipH + gap);
        pos[n.id] = { x: cx, y: y + chipH / 2, w: colW - 6 };

        var g = S.el("g", { class: "node", "data-n": n.id }, chips);
        S.el("rect", { x: cx, y: y, width: colW - 6, height: chipH, rx: tiny ? 2 : 3,
                       fill: n.color + (n.ring ? "26" : "40"),
                       stroke: n.ring ? n.color + "55" : n.color, "stroke-width": .8 }, g);
        if (!tiny && chipH >= 9) {
          var t = S.el("text", { x: cx + 4, y: y + chipH - (chipH >= 13 ? 4 : 2.6),
                                 class: "n-lbl" + (n.ring ? "" : " strong") }, g);
          t.textContent = S.shortLabel(n, Math.max(3, Math.floor((colW - 10) / 4.7)));
        }
        g.addEventListener("mouseenter", function () { ctx.hover(n); });
        g.addEventListener("mouseleave", function () { ctx.hover(null); });
      });
    });

    s.edges.forEach(function (e) {
      var a = pos[e.a], b = pos[e.b];
      if (!a || !b) return;
      var x1 = a.x + a.w, y1 = a.y, x2 = b.x, y2 = b.y;
      if (x2 < x1) { x1 = a.x; x2 = b.x + b.w; }
      var mx = (x1 + x2) / 2;
      S.el("path", { d: "M" + x1 + "," + y1 + "C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2,
                     class: "wire" + (e.inferred ? " inferred" : ""), stroke: e.color,
                     "stroke-width": tiny ? .6 : .9, "stroke-opacity": .5,
                     "data-e": e.a + "||" + e.b }, wires);
    });
  }
};
