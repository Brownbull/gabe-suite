/* m1-homes.js — m1-cluster.js's HOME and SPINE rules (and the measures that ride them) over a partition someone else chose.

   m1-cluster.js only applies these rules to the partition its own ladder cuts. A ruling can hold a different partition (D-021:
   his eleven blocks, where the arithmetic's own cut is eight), and every generator that draws the ruled blocks still needs each
   attribute's home and the shared spine read from the cells. The rules are RESTATED here, because m1-cluster.js exposes them
   only through its own clustering — so a caller must PROVE the copy on every run: `prove(K, …)` re-runs it over the partition
   m1-cluster.js produced and throws unless it reproduces that module's answer exactly. A rule copy that cannot be checked is a
   second mapping, and a second mapping is an invention.

   homes(ids, qids, cells, spineLow)      → { homesOver(groupsQ), val }        (lifted from gen-brainmap.js, unchanged)
   measure(ids, qids, cells, groupsQ, o)  → the blocks in m1-cluster.js's shape: ordered, with homes, purity and the nearest
                                            other block · the spine in its order · spineIn · rowOrder · colOrder
   ladderGroups(ladder, qids, n)          → the partition after the first n joins, in the agglomeration's own order
   prove(K, ids, qids, cells, o)          → throws when measure() over K's own partition is not K
   ladderCutOf(ladder, qids, groupsQ)     → the number of joins after which the ladder's partition IS groupsQ, or -1
   No wallclock, no random draw: ties break on the inventory's order, as m1-cluster.js's do. */
"use strict";

function homes(IDS, QIDS, cells, SPINE_LOW) {
  const V = new Map(); for (const c of cells) if (c.value > 0) V.set(c.q + "|" + c.a, c.value);
  const val = (q, a) => V.get(q + "|" + a) || 0;
  const ai = new Map(IDS.map((a, i) => [a, i]));
  function homesOver(groupsQ) {
    const raw = (a, g) => g.reduce((s, q) => s + val(q, a), 0);
    const weight = (a, g) => raw(a, g) + raw(a, g) / (2 * g.length) / 1e3;      /* per-question share breaks ties only */
    const needIn = (a, g) => g.some((q) => val(q, a) === 2);
    const used = IDS.filter((a) => QIDS.some((q) => val(q, a) > 0));
    const spine = used.filter((a) => groupsQ.filter((g) => needIn(a, g)).length >= SPINE_LOW);
    const home = new Map();
    for (const a of used) {
      if (spine.indexOf(a) >= 0) continue;
      let bw = -1, bg = 0;
      groupsQ.forEach((g, gi) => { const w = weight(a, g); if (w > bw + 1e-12) { bw = w; bg = gi; } });
      home.set(a, bg);
    }
    const own = groupsQ.map((g, gi) => used.filter((a) => home.get(a) === gi).sort((x, y) => weight(y, g) - weight(x, g) || ai.get(x) - ai.get(y)));
    return { home, spine, own, used,
      spineIn: Object.fromEntries(spine.map((a) => [a, groupsQ.filter((g) => needIn(a, g)).length])),
      spineAt: Object.fromEntries(spine.map((a) => [a, groupsQ.map((g, gi) => (needIn(a, g) ? gi : -1)).filter((i) => i >= 0)])) };
  }
  return { homesOver, val };
}

function measure(ids, qids, cells, groupsQ, opts) {
  const o = Object.assign({ spineClusters: 3, idf: true }, opts || {});
  const { homesOver, val } = homes(ids, qids, cells, o.spineClusters), H = homesOver(groupsQ);
  const ai = new Map(ids.map((a, i) => [a, i]));
  /* the similarity m1-cluster.js joins on: idf-weighted cosine, averaged over every pair of questions */
  const df = new Map(ids.map((a) => [a, qids.filter((q) => val(q, a) > 0).length]));
  const idf = (a) => (o.idf === false || !df.get(a) ? 1 : Math.log(1 + qids.length / df.get(a)));
  const vq = new Map(qids.map((q) => [q, ids.map((a) => val(q, a) * idf(a))]));
  const cos = (x, y) => { let d = 0, nx = 0, ny = 0; for (let i = 0; i < x.length; i++) { d += x[i] * y[i]; nx += x[i] * x[i]; ny += y[i] * y[i]; } return nx && ny ? d / Math.sqrt(nx * ny) : 0; };
  const sim = (A, B) => { let s = 0; for (const x of A) for (const y of B) s += cos(vq.get(x), vq.get(y)); return s / (A.length * B.length); };
  const raw = (a, g) => g.reduce((s, q) => s + val(q, a), 0);
  const meanPos = (gi) => (H.own[gi].length ? H.own[gi].reduce((s, a) => s + ai.get(a), 0) / H.own[gi].length : 1e9);
  const gorder = groupsQ.map((_, gi) => gi).sort((x, y) => meanPos(x) - meanPos(y) || x - y);
  const clusters = gorder.map((gi, k) => {
    const g = groupsQ[gi], own = H.own[gi];
    const inside = own.reduce((s, a) => s + raw(a, g), 0), total = own.reduce((s, a) => s + raw(a, qids), 0);
    let ns = -1, ng = null; groupsQ.forEach((h, hi) => { if (hi === gi) return; const s = sim(g, h); if (s > ns + 1e-12) { ns = s; ng = h; } });
    return { key: "c" + (k + 1), questions: g, attrs: own, purity: total ? +(inside / total).toFixed(2) : 0, nearest: { questions: ng, sim: +ns.toFixed(3) } };
  });
  const need = (a) => qids.filter((q) => val(q, a) === 2).length, touch = (a) => qids.filter((q) => val(q, a) > 0).length;
  const spine = H.spine.slice().sort((x, y) => need(y) - need(x) || touch(y) - touch(x) || ai.get(x) - ai.get(y));
  return { clusters, spine, spineIn: Object.fromEntries(spine.map((a) => [a, H.spineIn[a]])), rowOrder: spine.concat(clusters.flatMap((c) => c.attrs)), colOrder: clusters.flatMap((c) => c.questions), sim };
}

/* the partition after the first n joins of a ladder, in the order m1-cluster.js's agglomeration keeps its groups: a join puts
   the merged group where its first side stood and removes the second. The order matters — an exact tie on an attribute's
   weight goes to the group met first — so a proof has to replay it rather than take the blocks in their drawn order. */
function ladderGroups(ladder, qids, n) {
  const k = (g) => g.slice().sort().join("+");
  const parts = qids.map((q) => [q]);
  for (let i = 0; i < n; i++) {
    const m = ladder[i], ia = parts.findIndex((g) => k(g) === k(m.a)), ib = parts.findIndex((g) => k(g) === k(m.b));
    if (ia < 0 || ib < 0 || ia >= ib) return null;
    parts[ia] = parts[ia].concat(parts[ib]); parts.splice(ib, 1);
  }
  return parts.map((g) => g.slice().sort((x, y) => qids.indexOf(x) - qids.indexOf(y)));
}

function prove(K, ids, qids, cells, opts) {
  const groups = ladderGroups(K.ladder, qids, K.cut.index);
  if (!groups) throw new Error("the ladder does not replay — m1-cluster.js's join order changed; fix m1-homes.js before trusting it");
  const m = measure(ids, qids, cells, groups, opts), bad = [];
  const eq = (what, x, y) => { if (JSON.stringify(x) !== JSON.stringify(y)) bad.push(what); };
  eq("the spine", m.spine, K.spine); eq("spineIn", m.spineIn, K.spineIn); eq("the row order", m.rowOrder, K.rowOrder); eq("the column order", m.colOrder, K.colOrder);
  if (m.clusters.length !== K.clusters.length) bad.push("the number of blocks");
  else m.clusters.forEach((c, i) => eq("block " + K.clusters[i].questions.join("+"), c, K.clusters[i]));
  if (bad.length) throw new Error("the home/spine rule copy (m1-homes.js) disagrees with m1-cluster.js on " + bad.join(", ") + " — fix the copy before trusting it");
  return m;
}

/* the number of joins after which the ladder's partition IS groupsQ (as sets), or -1 when no prefix of the ladder draws it */
function ladderCutOf(ladder, qids, groupsQ) {
  const key = (gs) => gs.map((g) => g.slice().sort().join("+")).sort().join("|"), want = key(groupsQ);
  for (let n = 0; n <= ladder.length; n++) { const g = ladderGroups(ladder, qids, n); if (!g) return -1; if (key(g) === want) return n; }
  return -1;
}

module.exports = { homes, measure, prove, ladderGroups, ladderCutOf };
