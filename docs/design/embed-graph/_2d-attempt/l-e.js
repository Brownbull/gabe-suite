/* E · SPARKGRAPH — a graph the size of a number.
 *
 * The other five compete to be a small PICTURE. This one competes with a COUNT. It is sized to sit
 * inside a table row — a ledger line, an entity-index row, a test result — where today the center
 * prints "7 touched" and the reader has to open a station to learn whether those seven are one
 * cluster or seven strangers.
 *
 * It draws at a FIXED 148x44 whatever box it is given, and the leftover space is left visibly empty,
 * because the honest lesson of this spike is that it is not a small version of the others — it is a
 * different instrument that happens to share their feed.
 */
(window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["E"] = {
  letter: "E",
  name: "sparkgraph",
  ancestor: "a sparkline — it competes with a number, not with a diagram",
  lede: "A graph the size of a <b>number</b>. Sized for a table row, where the center today prints " +
        "<code>7 touched</code> and the reader must open a station to learn whether those seven are one " +
        "cluster or seven strangers. It draws at a fixed 148×44 in every box, and the leftover space is " +
        "left visibly empty — this is not a shrunken diagram, it is a different instrument.",
  note: {
    holds: [
      "the only one of the six that fits where the center already has rows: ledger lines, entity-index rows, test results",
      "answers exactly one question — is this change concentrated or scattered — and the arc span answers it pre-attentively",
      "cheap enough to render dozens per page, which is the only way a list gets graph-literate"
    ],
    breaks: [
      "no labels, ever — a piece is a coloured dot and identifying it requires a hover the print/screenshot path does not have",
      "past ~14 pieces the dots merge and the arcs stack into a solid band; it does not degrade, it saturates",
      "it cannot carry the honest line inside itself, so a capped spark and a complete spark look identical"
    ]
  },

  draw: function (ctx) {
    var G = ctx.G, S = window.EmbedShell, s = ctx.slice;
    var SW = 148, SH = 44;
    var ox = (ctx.w - SW) / 2, oy = (ctx.h - SH) / 2;

    /* the actual-size boundary — the point of the page */
    if (ctx.size !== "inline") {
      S.el("rect", { x: ox - 4, y: oy - 4, width: SW + 8, height: SH + 8, rx: 5,
                     fill: "none", stroke: "#2a3140", "stroke-width": .8,
                     "stroke-dasharray": "4 4" }, ctx.g);
      var t = S.el("text", { x: ox - 4, y: oy - 9, class: "k-lbl" }, ctx.g);
      t.textContent = "actual size — 148 × 44";
    }

    if (!s.nodes.length) {
      S.el("text", { x: ctx.w / 2, y: ctx.h / 2, "text-anchor": "middle", class: "n-lbl" }, ctx.g)
        .textContent = "nothing to draw";
      return;
    }

    var wires = S.el("g", {}, ctx.g), dots = S.el("g", {}, ctx.g);
    var baseY = oy + SH - 12;

    /* order along the baseline by request lane, so left-to-right is still the trace direction */
    var ns = s.nodes.slice().sort(function (a, b) {
      var la = G.LANE[a.kind], lb = G.LANE[b.kind];
      la = la === undefined ? 9 : la; lb = lb === undefined ? 9 : lb;
      return la - lb || G.kindRank(a.kind) - G.kindRank(b.kind) || b.deg - a.deg;
    });

    var span = SW - 14, step = ns.length > 1 ? span / (ns.length - 1) : 0;
    var r = ns.length > 26 ? 1.6 : ns.length > 14 ? 2.1 : 2.8;
    var pos = {};
    ns.forEach(function (n, i) {
      pos[n.id] = { x: ox + 7 + (ns.length > 1 ? i * step : span / 2), y: baseY };
    });

    /* arcs above the baseline — the wider the arc, the further apart the two pieces sit */
    var maxArc = SH - 22;
    s.edges.forEach(function (e) {
      var a = pos[e.a], b = pos[e.b];
      if (!a || !b) return;
      var d = Math.abs(b.x - a.x);
      var lift = Math.min(maxArc, 5 + d * 0.5);
      S.el("path", { d: "M" + a.x + "," + a.y + "Q" + ((a.x + b.x) / 2) + "," + (a.y - lift * 2) +
                        " " + b.x + "," + b.y,
                     class: "wire" + (e.inferred ? " inferred" : ""), stroke: e.color,
                     "stroke-width": .7, "stroke-opacity": .55,
                     "data-e": e.a + "||" + e.b }, wires);
    });

    S.el("line", { x1: ox + 5, y1: baseY, x2: ox + SW - 5, y2: baseY,
                   stroke: "#1e2430", "stroke-width": 1 }, dots);

    ns.forEach(function (n) {
      var p = pos[n.id];
      var g = S.el("g", { class: "node", "data-n": n.id }, dots);
      S.el("circle", { cx: p.x, cy: p.y, r: r, fill: n.ring ? "#0e1118" : n.color,
                       stroke: n.color, "stroke-width": n.ring ? .9 : 0 }, g);
      S.el("rect", { x: p.x - 4, y: oy, width: 8, height: SH, class: "hit" }, g);
      g.addEventListener("mouseenter", function () { ctx.hover(n); });
      g.addEventListener("mouseleave", function () { ctx.hover(null); });
    });

    /* the count it is competing with, printed beside it */
    var c = S.el("text", { x: ox + SW - 4, y: oy + 10, "text-anchor": "end", class: "k-lbl" }, ctx.g);
    c.textContent = s.stats.drawn + (s.stats.drawn < s.stats.candidates ? "/" + s.stats.candidates : "");
  }
};
