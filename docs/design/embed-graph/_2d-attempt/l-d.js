/* D · ADJACENCY TILE — the heresy: draw no wires at all.
 *
 * At 300px a wire is mostly noise; twenty of them are a hairball that says "complicated" and
 * nothing else. So this layout spends the whole box on the PIECES — dense, kind-grouped, sized by
 * pull — and moves the relations into the one interaction an embed already has: the hover. Point at
 * a tile and its neighbours stay lit while everything else drops out. Coupling as a gesture, not ink.
 *
 * The relations are still in the DOM (invisible data-e markers), so the shell's generic focus does
 * the work — this page implements no dimming of its own, which keeps the bake-off fair.
 */
(window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["D"] = {
  letter: "D",
  name: "adjacency tile",
  ancestor: "a treemap census, with coupling moved into the hover",
  lede: "No wires. The box is spent entirely on <b>pieces</b> — packed, grouped by kind, sized by how much " +
        "they pull — and coupling moves into the hover: point at a tile and only its neighbours stay lit. " +
        "The bet is that at 300px a hairball says <i>complicated</i> and nothing more, while a dense honest " +
        "census says <i>what is here</i>.",
  note: {
    holds: [
      "the highest node count of the six at any size — no wire budget to spend, so the cap bites last",
      "kind composition is unmissable: the tile blocks ARE the census, and a tiny block is a real signal",
      "reads at inline size better than anything with wires, because nothing is drawn that needs 2px of separation"
    ],
    breaks: [
      "coupling is invisible until you hover — a printed or screenshotted embed carries no relations at all",
      "no direction and no wire kind, so read-vs-write and structural-vs-inferred are simply not in the picture",
      "a reader who never hovers concludes the pieces are unrelated, which is worse than a hairball"
    ]
  },

  draw: function (ctx) {
    var G = ctx.G, S = window.EmbedShell, s = ctx.slice;
    if (!s.nodes.length) { S.el("text", { x: ctx.w / 2, y: ctx.h / 2, "text-anchor": "middle", class: "n-lbl" }, ctx.g).textContent = "nothing to draw"; return; }

    var tiny = ctx.size === "inline";
    var padX = 8, padTop = tiny ? 6 : 8, padBot = 6;

    var kinds = [];
    s.nodes.forEach(function (n) { if (kinds.indexOf(n.kind) < 0) kinds.push(n.kind); });
    kinds.sort(function (a, b) { return G.kindRank(a) - G.kindRank(b); });

    var maxDeg = Math.max(1, Math.max.apply(null, s.nodes.map(function (n) { return n.deg; })));
    var base = tiny ? 7 : ctx.size === "panel" ? 17 : 14;
    var gap = tiny ? 2 : 3, headH = tiny ? 0 : 9;

    var adj = S.el("g", {}, ctx.g), tiles = S.el("g", {}, ctx.g);
    var x = padX, y = padTop, rowH = 0;
    var maxX = ctx.w - padX;

    kinds.forEach(function (k, ki) {
      var grp = s.nodes.filter(function (n) { return n.kind === k; });
      grp.sort(function (a, b) { return a.ring - b.ring || b.deg - a.deg; });

      /* a kind block starts on a fresh row when the current one cannot hold three tiles */
      if (x + base * 3 > maxX && ki) { x = padX; y += rowH + gap + headH; rowH = 0; }
      if (!tiny) {
        var hd = S.el("text", { x: x, y: y + 6, class: "k-lbl" }, tiles);
        hd.textContent = k;
        y += headH;
      }

      grp.forEach(function (n) {
        var sz = base * (0.62 + 0.38 * (n.deg / maxDeg));
        if (x + sz > maxX) { x = padX; y += rowH + gap; rowH = 0; }
        var g = S.el("g", { class: "node", "data-n": n.id }, tiles);
        S.el("rect", { x: x, y: y, width: sz, height: sz, rx: tiny ? 1.5 : 2.5,
                       fill: n.color + (n.ring ? "2e" : "cc"),
                       stroke: n.ring ? n.color + "66" : "#0e1118", "stroke-width": .9,
                       "stroke-dasharray": n.ring ? "2 2" : null }, g);
        if (n.fe) {
          S.el("circle", { cx: x + sz - 2.6, cy: y + 2.6, r: 1.4, fill: "#0e1118",
                           "fill-opacity": .8 }, g);
        }
        g.addEventListener("mouseenter", function () { ctx.hover(n); });
        g.addEventListener("mouseleave", function () { ctx.hover(null); });
        rowH = Math.max(rowH, sz);
        x += sz + gap;
      });

      x += tiny ? 4 : 7;
      if (x > maxX - base * 2) { x = padX; y += rowH + gap + (tiny ? 0 : 3); rowH = 0; }
    });

    /* the relations, present but unpainted — the shell's focus reads these */
    s.edges.forEach(function (e) {
      S.el("path", { d: "M0,0", stroke: "none", fill: "none", "data-e": e.a + "||" + e.b }, adj);
    });

    /* centre the packed block: packing runs top-down, so a short census would otherwise sit in the
       upper third with the rest of the box reading as empty space that means nothing */
    var usedH = y + rowH - padTop;
    var slack = (ctx.h - padBot - (tiny ? 4 : 12) - padTop) - usedH;
    if (slack > 6) tiles.setAttribute("transform", "translate(0," + Math.round(slack / 2) + ")");

    if (!tiny) {
      var hint = S.el("text", { x: padX, y: ctx.h - 5, class: "k-lbl" }, ctx.g);
      hint.textContent = s.edges.length + " relations — hover a tile";
    }
  }
};
