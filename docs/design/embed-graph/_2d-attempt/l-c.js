/* C · LANE FLOW — five FIXED lanes, left to right, in request order.
 *
 *   frontend → screens → api → shapes → data
 *
 * The lanes are permanent. A subject with no frontend still shows an empty "frontend" lane, because
 * the workflow-panel law applies to a graph too: an RTS blanks a cell it cannot use, it never slides
 * the next one up. An empty lane is a first-class rendering — it is how the reader learns that the
 * commit touched no screen, rather than never learning the question was asked.
 */
(window.EMBED_LAYOUTS = window.EMBED_LAYOUTS || {})["C"] = {
  letter: "C",
  name: "lane flow",
  ancestor: "the levels lab walk + workflow-panel's blanked cell",
  lede: "Five <b>permanent</b> lanes in request order — frontend, screens, api, shapes, data. A lane with " +
        "nothing in it still draws, because the reader learns as much from an empty <i>screens</i> lane " +
        "as from a full one. Borrowed straight from <code>workflow-panel</code>: a cell a unit cannot use " +
        "keeps its position.",
  note: {
    holds: [
      "the reading is the trace: left is what a user touches, right is what the system keeps — no legend needed",
      "empty lanes are evidence — 'this commit touched no screen' is drawn, not inferred from an absence",
      "lane positions are invariant across subjects, so a reader's eye learns one map and reuses it on every page"
    ],
    breaks: [
      "five lanes across 324px is 60px each — labels truncate hard at card size and the lane only really works at panel width",
      "a subject that lives in one lane (a schema-only commit) wastes 80% of the box on empty lanes",
      "fe pieces flood lane 0: 246 of 425 touched ids across the example's commits are fe:, so the cap does most of the composing"
    ]
  },

  draw: function (ctx) {
    var G = ctx.G, S = window.EmbedShell, s = ctx.slice;
    var tiny = ctx.size === "inline";
    var padX = 6, padTop = tiny ? 4 : 15, padBot = 6;
    var lanes = G.LANE_LABEL, nL = lanes.length;
    var laneW = (ctx.w - padX * 2) / nL;

    var back = S.el("g", {}, ctx.g), wires = S.el("g", {}, ctx.g), chips = S.el("g", {}, ctx.g);
    var buckets = lanes.map(function () { return []; });
    s.nodes.forEach(function (n) {
      var li = G.LANE[n.kind];
      buckets[li === undefined ? nL - 1 : li].push(n);
    });

    /* FIT, never overflow — see the same note in l-a.js. A lane layout is MORE exposed to this
       than a kind layout, because five lanes concentrate ten kinds: on pantry the shapes lane
       alone holds every schema. */
    var tallest = Math.max.apply(null, buckets.map(function (b) { return b.length; })) || 1;
    var avail = ctx.h - padTop - padBot;
    var chipH = tiny ? 6 : 13, gap = tiny ? 2.5 : 4;
    if (tallest * (chipH + gap) - gap > avail) {
      gap = Math.max(1, Math.min(gap, (avail / tallest) * 0.25));
      chipH = Math.max(3, (avail - (tallest - 1) * gap) / tallest);
    }

    var pos = {};
    lanes.forEach(function (name, li) {
      var x = padX + li * laneW;

      /* the lane always draws — occupied or not */
      S.el("rect", { x: x, y: padTop - (tiny ? 2 : 9), width: laneW - 3,
                     height: ctx.h - padTop - padBot + (tiny ? 4 : 9), rx: 4,
                     fill: buckets[li].length ? "#ffffff06" : "#ffffff03",
                     stroke: buckets[li].length ? "#2a3140" : "#1e2430",
                     "stroke-width": .8, "stroke-dasharray": buckets[li].length ? null : "3 3" }, back);
      if (!tiny) {
        var lb = S.el("text", { x: x + 3, y: 9, class: "k-lbl" }, back);
        lb.textContent = name.slice(0, Math.max(3, Math.floor(laneW / 5)));
      }

      var col = buckets[li];
      col.sort(function (a, b) { return a.ring - b.ring || b.deg - a.deg; });
      var totH = col.length * chipH + Math.max(0, col.length - 1) * gap;
      var y0 = padTop + Math.max(0, (ctx.h - padTop - padBot - totH) / 2);

      if (!col.length && !tiny) {
        var e = S.el("text", { x: x + laneW / 2 - 1.5, y: ctx.h / 2 + 2, "text-anchor": "middle",
                               class: "k-lbl" }, back);
        e.textContent = "—";
        return;
      }

      col.forEach(function (n, i) {
        var y = y0 + i * (chipH + gap);
        pos[n.id] = { x: x + 2, y: y + chipH / 2, w: laneW - 7 };
        var g = S.el("g", { class: "node", "data-n": n.id }, chips);
        S.el("rect", { x: x + 2, y: y, width: laneW - 7, height: chipH, rx: 2.5,
                       fill: n.color + (n.ring ? "22" : "3d"),
                       stroke: n.ring ? n.color + "55" : n.color, "stroke-width": .8 }, g);
        if (n.method && !tiny && chipH >= 6) {
          S.el("rect", { x: x + 2, y: y, width: 2.5, height: chipH, rx: 1.2,
                         fill: G.METHOD[n.method] }, g);
        }
        if (!tiny && chipH >= 9) {
          var t = S.el("text", { x: x + (n.method ? 7 : 5), y: y + chipH - (chipH >= 12 ? 3.6 : 2.4),
                                 class: "n-lbl" + (n.ring ? "" : " strong") }, g);
          t.textContent = S.shortLabel(n, Math.max(3, Math.floor((laneW - 12) / 4.7)));
        }
        g.addEventListener("mouseenter", function () { ctx.hover(n); });
        g.addEventListener("mouseleave", function () { ctx.hover(null); });
      });
    });

    s.edges.forEach(function (e) {
      var a = pos[e.a], b = pos[e.b];
      if (!a || !b) return;
      var x1 = a.x + a.w, y1 = a.y, x2 = b.x, y2 = b.y;
      if (x2 < x1 - 2) { x1 = a.x; x2 = b.x + b.w; }
      var mx = (x1 + x2) / 2;
      S.el("path", { d: "M" + x1 + "," + y1 + "C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2,
                     class: "wire" + (e.inferred ? " inferred" : ""), stroke: e.color,
                     "stroke-width": tiny ? .55 : .9, "stroke-opacity": .5,
                     "data-e": e.a + "||" + e.b }, wires);
    });
  }
};
