/* B · RADIAL RING — the subject at the centre, its pieces on one ring, its neighbours on the next.
 *
 * The footprint is FIXED whatever the node count: 7 pieces and 60 pieces occupy the same box, and
 * only the density changes. That is the property an embed dropped into an unknown page needs most.
 */
(window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["B"] = {
  letter: "B",
  name: "radial ring",
  ancestor: "the universe's cluster hull, flattened",
  lede: "The subject sits in the middle; its own pieces ride the inner ring, one-hop neighbours the " +
        "outer one, and each kind owns a contiguous <b>arc</b>. The footprint never changes — 7 pieces " +
        "and 60 pieces fill the same box and only the density moves, which is the property an embed " +
        "dropped into an unknown page needs most.",
  note: {
    holds: [
      "constant footprint: a page can reserve the box before it knows how big the subject is",
      "the two rings make 'mine' vs 'one hop out' a spatial fact, so the hop control has a visible effect",
      "kind arcs give a census read without a legend — a fat violet arc IS 'mostly endpoints'"
    ],
    breaks: [
      "labels: past ~14 nodes the ring has no room for text, and it degrades to a picture that needs hover to mean anything",
      "direction is gone — a chord cannot say which way a request flows, so read/write is a colour, never a shape",
      "a commit's touched set has no natural centre; the middle has to be occupied by the commit itself, which is not a code piece"
    ]
  },

  draw: function (ctx) {
    var G = ctx.G, S = window.EmbedShell, s = ctx.slice;
    if (!s.nodes.length) { S.el("text", { x: ctx.w / 2, y: ctx.h / 2, "text-anchor": "middle", class: "n-lbl" }, ctx.g).textContent = "nothing to draw"; return; }

    var tiny = ctx.size === "inline";
    var cx = ctx.w / 2, cy = ctx.h / 2;
    var rOuter = Math.min(ctx.w, ctx.h) / 2 - (tiny ? 10 : 26);
    var rInner = s.nodes.some(function (n) { return n.ring; }) ? rOuter * 0.62 : rOuter;
    var rNode = tiny ? 2.6 : 4.2;

    var wires = S.el("g", {}, ctx.g), dots = S.el("g", {}, ctx.g);

    /* order the whole ring by kind so each kind owns one arc, then by degree inside it */
    var ring0 = s.nodes.filter(function (n) { return !n.ring; });
    var ring1 = s.nodes.filter(function (n) { return n.ring; });
    [ring0, ring1].forEach(function (a) {
      a.sort(function (x, y) { return G.kindRank(x.kind) - G.kindRank(y.kind) || y.deg - x.deg; });
    });

    var pos = {};
    function place(list, r) {
      list.forEach(function (n, i) {
        var a = -Math.PI / 2 + (i / Math.max(1, list.length)) * Math.PI * 2;
        pos[n.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a: a, r: r };
      });
    }
    place(ring0, rInner);
    place(ring1, rOuter);

    /* chords, bowed toward the centre so the middle stays a readable well */
    s.edges.forEach(function (e) {
      var a = pos[e.a], b = pos[e.b];
      if (!a || !b) return;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var qx = mx + (cx - mx) * 0.55, qy = my + (cy - my) * 0.55;
      S.el("path", { d: "M" + a.x + "," + a.y + "Q" + qx + "," + qy + " " + b.x + "," + b.y,
                     class: "wire" + (e.inferred ? " inferred" : ""), stroke: e.color,
                     "stroke-width": tiny ? .5 : .8, "stroke-opacity": .45,
                     "data-e": e.a + "||" + e.b }, wires);
    });

    /* the centre: the subject itself, never a code piece */
    var hub = S.el("g", {}, ctx.g);
    S.el("circle", { cx: cx, cy: cy, r: tiny ? 7 : 15, fill: s.subject.color + "22",
                     stroke: s.subject.color, "stroke-width": 1 }, hub);
    if (!tiny) {
      var t = S.el("text", { x: cx, y: cy + 3, "text-anchor": "middle", class: "n-lbl strong" }, hub);
      t.textContent = S.trunc(s.subject.label, 9);
    }

    s.nodes.forEach(function (n) {
      var p = pos[n.id];
      var g = S.el("g", { class: "node", "data-n": n.id }, dots);
      S.el("circle", { cx: p.x, cy: p.y, r: rNode, fill: n.ring ? n.color + "55" : n.color,
                       stroke: n.ring ? n.color : "#0e1118", "stroke-width": n.ring ? .8 : 1 }, g);
      S.el("circle", { cx: p.x, cy: p.y, r: rNode + 6, class: "hit" }, g);
      if (!tiny && s.nodes.length <= 14) {
        var out = 10, lx = cx + Math.cos(p.a) * (p.r + out), ly = cy + Math.sin(p.a) * (p.r + out);
        var anch = Math.cos(p.a) > .25 ? "start" : Math.cos(p.a) < -.25 ? "end" : "middle";
        var lb = S.el("text", { x: lx, y: ly + 3, "text-anchor": anch,
                                class: "n-lbl" + (n.ring ? "" : " strong") }, g);
        lb.textContent = S.shortLabel(n, 11);
      }
      g.addEventListener("mouseenter", function () { ctx.hover(n); });
      g.addEventListener("mouseleave", function () { ctx.hover(null); });
    });

    if (!tiny && s.nodes.length > 14) {
      var hint = S.el("text", { x: 8, y: ctx.h - 6, class: "k-lbl" }, ctx.g);
      hint.textContent = "hover to name a piece";
    }
  }
};
