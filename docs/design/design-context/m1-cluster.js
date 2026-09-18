/* m1-cluster.js — Bertin's reorderable matrix, done by arithmetic. No judgement lives here.

   IN   attrs [id…] in inventory order · questions [id…] · cells [{q, a, value 0|1|2}]
   OUT  blocks of QUESTIONS that need the same attributes (average-linkage agglomeration on idf-weighted cosine similarity),
        the LADDER of every join with its similarity, the CUT, the weak joins just past it (the merge candidates), each
        block's nearest neighbour, each attribute's HOME block, the SPINE (attributes several blocks need), the row and
        column orders that make the blocks appear, and what fits nowhere.
   THE CUT is parameter-free: the ladder is built down to one group, and the cut falls at the WIDEST DROP between two
        consecutive joins (the finer cut on a tie). A similarity threshold picked by hand can land inside a band of
        near-equal joins and merge things the data keeps apart — it did, once, and a review caught it.
   HOME = the block where the attribute's total use is highest (the per-question share only breaks ties). Dividing by
        block size instead lets a one-question block outbid every larger one on a single cell.
   Deterministic: ties break on the inventory's own order, never on a random draw. */
"use strict";

function cluster(attrs, questions, cells, opts) {
  const o = Object.assign({ minClusters: 3, maxClusters: 14, spineClusters: 3, idf: true }, opts || {});
  const ai = new Map(attrs.map((a, i) => [a, i])), V = new Map();
  for (const c of cells) if (c.value > 0) V.set(c.q + "|" + c.a, c.value);
  const val = (q, a) => V.get(q + "|" + a) || 0;
  /* an attribute nearly every question touches says nothing about which questions belong together: weigh it down (idf) */
  const df = new Map(attrs.map((a) => [a, questions.filter((q) => val(q, a) > 0).length]));
  const idf = (a) => (o.idf === false || !df.get(a) ? 1 : Math.log(1 + questions.length / df.get(a)));
  const vq = new Map(questions.map((q) => [q, attrs.map((a) => val(q, a) * idf(a))]));
  const cos = (x, y) => { let d = 0, nx = 0, ny = 0; for (let i = 0; i < x.length; i++) { d += x[i] * y[i]; nx += x[i] * x[i]; ny += y[i] * y[i]; } return nx && ny ? d / Math.sqrt(nx * ny) : 0; };
  const sim = (A, B) => { let s = 0; for (const x of A) for (const y of B) s += cos(vq.get(x), vq.get(y)); return s / (A.length * B.length); };
  const qorder = (q) => questions.indexOf(q), sortQ = (g) => g.slice().sort((x, y) => qorder(x) - qorder(y));

  /* ── the ladder: every join, down to one group ── */
  const agglomerate = (stopAt) => {
    let groups = questions.map((q) => [q]); const merges = [];
    while (groups.length > stopAt) {
      let best = -1, bi = -1, bj = -1;
      for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) { const s = sim(groups[i], groups[j]); if (s > best + 1e-12) { best = s; bi = i; bj = j; } }
      merges.push({ sim: +best.toFixed(3), a: sortQ(groups[bi]), b: sortQ(groups[bj]), left: groups.length - 1 });
      groups[bi] = groups[bi].concat(groups[bj]); groups.splice(bj, 1);
    }
    return { groups: groups.map(sortQ), merges };
  };
  const ladder = agglomerate(1).merges;
  /* ── the cut: before the join with the widest drop from the one above it ── */
  let cutI = -1, maxDrop = -1;
  for (let i = 1; i < ladder.length; i++) {
    const leaves = questions.length - i; if (leaves < o.minClusters || leaves > o.maxClusters) continue;
    const drop = +(ladder[i - 1].sim - ladder[i].sim).toFixed(3); if (drop > maxDrop + 1e-9) { maxDrop = drop; cutI = i; }
  }
  if (cutI < 0) cutI = ladder.length;
  ladder.forEach((m, i) => { m.kept = i < cutI; });
  const weak = []; for (let i = cutI; i < ladder.length; i++) { weak.push(ladder[i]); if (i + 1 < ladder.length && ladder[i].sim - ladder[i + 1].sim >= maxDrop / 2) break; }
  const groups = agglomerate(questions.length - cutI).groups;

  /* ── homes, spine, order ── */
  const raw = (a, g) => g.reduce((s, q) => s + val(q, a), 0), weight = (a, g) => raw(a, g) + raw(a, g) / (2 * g.length) / 1e3;
  const needIn = (a, g) => g.some((q) => val(q, a) === 2);
  const rowsUsed = attrs.filter((a) => questions.some((q) => val(q, a) > 0));
  const spine = rowsUsed.filter((a) => groups.filter((g) => needIn(a, g)).length >= o.spineClusters);
  const home = new Map();
  for (const a of rowsUsed) { if (spine.includes(a)) continue; let bw = -1, bg = 0; groups.forEach((g, gi) => { const w = weight(a, g); if (w > bw + 1e-12) { bw = w; bg = gi; } }); home.set(a, bg); }
  const meanPos = (gi) => { const own = rowsUsed.filter((a) => home.get(a) === gi); return own.length ? own.reduce((s, a) => s + ai.get(a), 0) / own.length : 1e9; };
  const gorder = groups.map((_, gi) => gi).sort((x, y) => meanPos(x) - meanPos(y) || x - y);
  const out = gorder.map((gi, k) => {
    const g = groups[gi], own = rowsUsed.filter((a) => home.get(a) === gi).sort((x, y) => weight(y, g) - weight(x, g) || ai.get(x) - ai.get(y));
    const inside = own.reduce((s, a) => s + raw(a, g), 0), total = own.reduce((s, a) => s + raw(a, questions), 0);
    let ns = -1, ng = null; groups.forEach((h, hi) => { if (hi === gi) return; const s = sim(g, h); if (s > ns + 1e-12) { ns = s; ng = h; } });
    return { key: "c" + (k + 1), questions: g, attrs: own, purity: total ? +(inside / total).toFixed(2) : 0, nearest: { questions: ng, sim: +ns.toFixed(3) } };
  });
  const need = (a) => questions.filter((q) => val(q, a) === 2).length, touch = (a) => questions.filter((q) => val(q, a) > 0).length;
  spine.sort((x, y) => need(y) - need(x) || touch(y) - touch(x) || ai.get(x) - ai.get(y));
  return {
    clusters: out, spine, spineIn: Object.fromEntries(spine.map((a) => [a, groups.filter((g) => needIn(a, g)).length])),
    rowOrder: spine.concat(out.flatMap((c) => c.attrs)), colOrder: out.flatMap((c) => c.questions),
    unused: attrs.filter((a) => !rowsUsed.includes(a)), unanswered: questions.filter((q) => !attrs.some((a) => val(q, a) === 2)),
    need: Object.fromEntries(attrs.map((a) => [a, need(a)])), touch: Object.fromEntries(attrs.map((a) => [a, touch(a)])),
    ladder, cut: { index: cutI, drop: maxDrop, above: ladder[cutI - 1] ? ladder[cutI - 1].sim : null, below: ladder[cutI] ? ladder[cutI].sim : null }, weak, params: o,
  };
}
module.exports = { cluster };
