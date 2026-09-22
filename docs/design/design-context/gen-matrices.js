#!/usr/bin/env node
/* gen-matrices.js — M1 (attribute x question) and M2 (attribute x zoom level) for one inventory, as a Gabe Artifact page.

     node docs/design/design-context/gen-matrices.js [--round 2] [--check] [--table]

   ROUND 1 (the default) is the RECORD, matrices-endpoint.html — the page he ruled on (D-015); it must stay byte-identical.
   READS   m1-round1.inventory.md (the inventory as the raters saw it, via inventory-parse.js) · m1-round1.input.json (what the
           raters saw) · m1-round1.endpoint.json (the merged matrix as m1-merge.js wrote it for round 1 — round 2 folded its own
           rows into m1-input.json / m1-endpoint.json, so the record reads its frozen pair) · m1-cluster.js (arithmetic only) ·
           prisms-endpoint.json (authored: block names, plain lines, the face budget, the takes) · the gabe-artifact kit ·
           matrices.tpl.html
   WRITES  matrices-endpoint.html
   ROUND 2 (--round 2) writes matrices-round2.html from the same template: the living inventory-endpoint.md (a row it no
           longer has is read from the round-1 inventory and drawn struck), m1-input.json + m1-endpoint.json (the round-2
           cells), matrices-r2.words.json (its prose). D-021: the blocks drawn are HIS ELEVEN (prisms-endpoint.json), their
           homes and the top band read from the round-2 cells by m1-homes.js — PROVEN against m1-cluster.js on every run —
           and the arithmetic's own cut is drawn too, behind a switch, with both numbers stated at the top.
   The template carries both: a `__R1{ … }__R1` region is kept only by round 1, a `__R2{ … }__R2` region only by round 2,
   and `{{key}}` inside a round-2 region is filled here, escaped.
   M2 is a RULE, stated here and nowhere else: the face = the fixed identity + the rating-3 attributes the most questions
   need, up to the budget (a family of attributes shares one slot); a 3 that misses the face starts at mid; a 2 starts at
   mid when two or more questions need it, else near; a 1 starts at the hover, or the portrait when no question touches it.
   After its first level an attribute stays visible at every nearer one. No wallclock: same inputs, same bytes. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const die = (m) => { console.error("gen-matrices: " + m); process.exit(2); };
const ROUND = (() => { const i = process.argv.indexOf("--round"); if (i < 0) return 1; const r = process.argv[i + 1]; if (r !== "1" && r !== "2") die("--round takes 1 or 2"); return +r; })(), R2 = ROUND === 2;
const HERE = __dirname, ROOT = path.resolve(HERE, "../../.."), OUT = path.join(HERE, R2 ? "matrices-round2.html" : "matrices-endpoint.html"), OUTN = path.basename(OUT);
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), "utf8"));

const { parseInventory, parseQuestions } = require("./inventory-parse.js"), { cluster } = require("./m1-cluster.js");
/* M1 round 1 is a RECORD: it reads the inventory as the raters saw it (m1-round1.inventory.md), never the living file, which keeps changing */
let inv; try { inv = parseInventory(path.join(HERE, R2 ? "inventory-endpoint.md" : "m1-round1.inventory.md")); } catch (e) { die(e.message); }
const inp = rd(R2 ? "m1-input.json" : "m1-round1.input.json"), M = rd(R2 ? "m1-endpoint.json" : "m1-round1.endpoint.json"), W = rd("prisms-endpoint.json"), qs = parseQuestions(path.join(HERE, "questions.md"));
if (M.unjudged.length && !process.argv.includes("--draft")) die("hard splits without a verdict (use --draft to build on the median): " + M.unjudged.join(", "));
const seen = inp.attrs.map((a) => a.id);
let gone = [];
if (R2) {       /* the living inventory's rows, in its order, then the rated rows it no longer has — read from the round-1 inventory */
  let r1; try { r1 = parseInventory(path.join(HERE, "m1-round1.inventory.md")); } catch (e) { die(e.message); }
  const cellIds = []; for (const c of M.cells) if (cellIds.indexOf(c.a) < 0) cellIds.push(c.a);
  if (cellIds.slice().sort().join("|") !== seen.slice().sort().join("|")) die("m1-endpoint.json's cells and m1-input.json's attributes differ — re-merge");
  const unrated = inv.rows.filter((r) => seen.indexOf(r.id) < 0).map((r) => r.id); if (unrated.length) die("living rows M1 round 2 never rated: " + unrated.join(", "));
  gone = cellIds.filter((id) => !inv.rows.some((r) => r.id === id));
  const lost = gone.filter((id) => !r1.rows.some((r) => r.id === id)); if (lost.length) die("rated rows found in neither inventory: " + lost.join(", "));
  inv = { rows: inv.rows.concat(gone.map((id) => r1.rows.find((r) => r.id === id))) };
}
const ids = inv.rows.map((r) => r.id);
if (!R2 && ids.join("|") !== seen.join("|")) die("the inventory's rows moved since M1 was rated — rebuild m1-input.json and re-rate");
if (qs.map((q) => q.id).join("|") !== inp.questions.map((q) => q.id).join("|")) die("questions.md moved since M1 was rated");

/* ── M1: cluster, then name the blocks ── */
const QIDS = qs.map((q) => q.id), K = cluster(ids, QIDS, M.cells, W.clusterOpts);
const V2 = new Set(M.cells.filter((c) => c.value === 2).map((c) => c.q + "|" + c.a));
/* a VIEW is one partition drawn: its named blocks, their homes, the top band and the orders. Round 1 has one, the ladder's;
   round 2 has two — his eleven (the default) and the arithmetic's cut, whose merged blocks are named by the ruled ones they hold */
const RULEDQ = Object.keys(W.blocks).map((s) => s.split("+"));
const nameOf = (sig) => {
  if (W.blocks[sig]) return W.blocks[sig];
  if (!R2) return null;
  const qq = sig.split("+"), parts = RULEDQ.filter((g) => g.every((q) => qq.includes(q)));
  if (parts.flat().length !== qq.length) die(`the arithmetic's block ${sig} is not a union of ruled blocks — it cannot be named from them`);
  const ws = VIEW0.clusters.filter((c) => parts.some((g) => g.join("+") === c.sig));
  return { name: ws.map((c) => c.name).join(" + "), plain: fillR2(R2W.mergedPlain, { names: ws.map((c) => c.name).join(", "), k: ws.length }), standpoint: [...new Set(ws.map((c) => c.standpoint))].join(" "), merges: ws.map((c) => c.sig) };
};
function viewOf(KV) {
  const clusters = KV.clusters.map((c, i) => {
    const sig = c.questions.join("+"), w = nameOf(sig);
    if (!w) die(`the blocks changed — no name for the block ${sig}. Blocks now: ${KV.clusters.map((x) => x.questions.join("+")).join(" | ")}`);
    return { key: c.key, n: i + 1, sig, name: w.name, plain: w.plain, standpoint: w.standpoint, questions: c.questions, attrs: c.attrs, purity: c.purity, nearSig: c.nearest.questions.join("+"), nearSim: c.nearest.sim };
  });
  const bySig = new Map(clusters.map((c) => [c.sig, c]));
  for (const c of clusters) { c.near = (bySig.get(c.nearSig) || {}).name || null; c.borrows = ids.filter((a) => !c.attrs.includes(a) && c.questions.some((q) => V2.has(q + "|" + a))); }
  /* a side of a join, in the blocks' names: the final blocks whose questions it holds */
  const sideName = (qsIn) => clusters.filter((c) => c.questions.every((q) => qsIn.includes(q))).map((c) => c.name).join(" + ") || qsIn.join("+");
  const homeOf = new Map(); KV.spine.forEach((a) => homeOf.set(a, "spine")); clusters.forEach((c) => c.attrs.forEach((a) => homeOf.set(a, c.key)));
  const qCluster = new Map(); clusters.forEach((c) => c.questions.forEach((q) => qCluster.set(q, c.key)));
  return { clusters, sideName, homeOf, qCluster, spine: KV.spine, spineIn: KV.spineIn, rowOrder: KV.rowOrder, colOrder: KV.colOrder };
}
let R2W = null, VIEW0 = null, KR = null;
const fillR2 = (s, t) => s.replace(/\{(\w+)\}/g, (m, k) => (k in t ? t[k] : die("no value for {" + k + "} in matrices-r2.words.json")));
if (R2) {
  R2W = rd("matrices-r2.words.json");
  { const flat = RULEDQ.flat(), set = new Set(flat);
    if (flat.length !== set.size || QIDS.some((q) => !set.has(q)) || flat.some((q) => QIDS.indexOf(q) < 0)) die("the ruled blocks (prisms-endpoint.json) are not a partition of questions.md"); }
  const H = require("./m1-homes.js");
  try { H.prove(K, ids, QIDS, M.cells, W.clusterOpts); } catch (e) { die(e.message); }       /* the rule copy reproduces m1-cluster.js, or nothing is drawn */
  KR = H.measure(ids, QIDS, M.cells, RULEDQ, W.clusterOpts);
  VIEW0 = viewOf(KR);
}
const V = R2 ? VIEW0 : viewOf(K), VA = R2 ? viewOf(K) : null;
const { clusters, sideName, homeOf, qCluster } = V;

/* ── M2: the disclosure plan, by rule ── */
const LV = W.levels.map((l) => l.key), seenAt = new Map(inp.attrs.map((a) => [a.id, a]));
const famOf = (id) => (W.faceFamilies.find((f) => f.includes(id)) || [id]);
const ranked = inv.rows.filter((r) => r.mine.base === 3 && !W.faceFixed.includes(r.id)).sort((x, y) => K.need[y.id] - K.need[x.id] || K.touch[y.id] - K.touch[x.id] || ids.indexOf(x.id) - ids.indexOf(y.id));
const faceSlots = W.faceFixed.map((id) => famOf(id));
for (const r of ranked) { if (faceSlots.length >= W.faceBudget) break; if (faceSlots.some((f) => f.includes(r.id))) continue; if (K.need[r.id] < 1) continue; faceSlots.push(famOf(r.id)); }
const faceIds = new Set(faceSlots.flat());
const formAt = (row, lv) => {
  const rel = /relation|list/.test(row.type), qty = /quantity/.test(row.type);
  if (lv === "far") return W.farForm[row.id] || (rel || qty ? "count" : "mark");
  const RANK = ["mark", "count", "chips", "list", "full"], richer = (x, y) => (RANK.indexOf(x) >= RANK.indexOf(y) ? x : y), floorF = W.farForm[row.id] || "mark";
  if (lv === "mid") return richer(rel ? "chips" : qty ? "count" : "mark", floorF);
  if (lv === "near") return richer(rel ? "list" : qty ? "count" : "mark", floorF);
  if (lv === "tooltip") return rel || qty ? "count" : "mark";
  return "full";
};
const recFirst = (txt) => { const m = txt.toLowerCase().match(/far|mid|near|tooltip|portrait/); return m ? m[0] : "portrait"; };
let moved = 0;
const attrs = inv.rows.map((row) => {
  const s = seenAt.get(row.id), need = K.need[row.id], touch = K.touch[row.id], r = row.mine.base, alarm = row.mine.alarm || /\b(alert|alarm|abnormal)\b/i.test(row.first);
  const qn = (n) => (n === 0 ? "no question needs" : n === 1 ? "1 question needs" : n + " questions need");
  let first, why;
  if (faceIds.has(row.id)) { first = "far"; why = W.faceFixed.includes(row.id) ? "the endpoint's name is always on the face" : famOf(row.id).length > 1 && K.need[row.id] < Math.max(...famOf(row.id).map((x) => K.need[x])) ? "the far form of " + famOf(row.id).filter((x) => x !== row.id).map((x) => inv.rows.find((y) => y.id === x).label.toLowerCase()).join(", ") + ", so the two share one slot" : `rated 3, and ${qn(need)} it, of ${QIDS.length}`; }
  else if (r === 3) {
    const last = faceSlots[faceSlots.length - 1][0], tie = need === K.need[last] && touch === K.touch[last];
    first = "mid"; why = `rated 3, and ${qn(need)} it — ` + (tie ? `tied with “${inv.rows.find((y) => y.id === last).label}” for the last face slot, and the inventory's order broke the tie` : "the face was full before its turn"); }
  else if (r === 2) { first = need >= 2 ? "mid" : "near"; why = `rated 2, and ${qn(need)} it`; }
  else { first = touch > 0 ? "tooltip" : "portrait"; why = touch > 0 ? "rated 1: mentioned, never drilled" : "rated 1, and no question touches it"; }
  /* an alert row's "far" in the record IS its alert; at rest the record and the plan agree unless the record names a nearer level too */
  const restTxt = alarm ? row.first.replace(/far(?: \(the face\))?[^;·]*?(alert|abnormal)[^;·]*/i, "").replace(/alert[^;·]*/i, "") : row.first;
  const named = /far|mid|near|tooltip|portrait/i.test(restTxt), fi = LV.indexOf(first), rf = named ? recFirst(restTxt) : null, mv = named ? Math.sign(fi - LV.indexOf(rf)) : 0; if (mv) moved++;
  const isGone = gone.includes(row.id);           /* round 2 only: rated, but no longer a row of the living inventory */
  return { id: row.id, label: row.label, sec: s.sec, plain: isGone ? R2W.goneWord + " " + s.plain : s.plain, eg: s.eg, r, alarm, fresh: row.fresh, gap: row.gap, need, touch, home: homeOf.get(row.id) || null,
    m2: { first, levels: LV.map((lv, i) => (i >= fi ? formAt(row, lv) : null)), alertFar: alarm, recordFirst: rf, moved: mv, why }, ...(isGone ? { gone: true } : {}) };
});
const A = new Map(attrs.map((a) => [a.id, a]));

/* ── what does not fit ── */
const twoSay = Object.keys(M.missing).filter((q) => Object.keys(M.missing[q]).length >= 2);
const short = (o) => Object.values(o).sort((x, y) => x.length - y.length)[0].split(/ — |: /)[0].replace(/[.;,]\s*$/, "");
const leftovers = [
  { ...W.leftovers.unanswered, items: [...new Set(K.unanswered.concat(twoSay))].sort((x, y) => QIDS.indexOf(x) - QIDS.indexOf(y)).map((q) => `${q} · ${qs.find((x) => x.id === q).text}` + (M.missing[q] ? ` — missing: ${short(M.missing[q])}` : "")) },
  { ...W.leftovers.unneeded, items: attrs.filter((a) => a.need === 0).map((a) => `${a.label} · rated ${a.r}${a.alarm ? " + alert" : ""} · helps ${a.touch} ${a.touch === 1 ? "question" : "questions"}`) },
  { ...W.leftovers.blocked, items: attrs.filter((a) => a.gap && a.need > 0).map((a) => `${a.label} · needed by ${QIDS.filter((q) => (M.cells.find((c) => c.q === q && c.a === a.id) || {}).value === 2).join(", ")} · ${a.gap}`) },
];

/* ── the takes, with their numbers filled from the data ── */
const top = attrs.slice().sort((x, y) => y.need - x.need || y.touch - x.touch)[0];
const f2 = (x) => x.toFixed(2);
const tok = { filled: M.cells.filter((c) => c.value > 0).length, nSingle: clusters.filter((c) => c.questions.length === 1).length, simAbove: f2(K.cut.above), simBelow: f2(K.cut.below),
  weak: K.weak.map((m) => `${sideName(m.a)} with ${sideName(m.b)} at ${f2(m.sim)}`).join(" · "), unanimous: M.counts.unanimous, cells: M.counts.cells, adjacent: M.counts.adjacent, split: M.counts.split, top: top.label, topNeed: top.need, nq: QIDS.length, n3: attrs.filter((a) => a.r === 3).length, budget: W.faceBudget };
/* the measured flag for the operator: needed as often as the face, but rated under 3 */
const faceFloor = Math.min(...attrs.filter((a) => a.m2.first === "far" && !W.faceFixed.includes(a.id) && a.need === K.need[famOf(a.id)[0]]).map((a) => a.need));
const outr = attrs.filter((a) => a.r < 3 && a.need >= faceFloor);
tok.outranked = outr.length ? `${outr.map((a) => "“" + a.label + "”").join(" and ")} ${outr.length === 1 ? "is" : "are"} needed as often as the face, but you rated ${outr.length === 1 ? "it" : "them"} under 3. If that feels wrong, the rating is the thing to change.` : "No attribute rated under 3 is needed as often as the face.";
const fill = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (k in tok ? tok[k] : die("no value for {" + k + "} in a take")));
const takes = Object.fromEntries(Object.entries(W.takes).map(([k, v]) => [k, v.map(fill)]));

/* ── round 2: both cuts, the statement's numbers, what changed since round 1 — every number from the arithmetic ── */
let R2D = null, PH = null;
if (R2) {
  const H = require("./m1-homes.js"), f3 = (x) => x.toFixed(3), L = K.ladder, nq = QIDS.length;
  const ruledJ = H.ladderCutOf(L, QIDS, RULEDQ), arithJ = K.cut.index, on = ruledJ >= 0;
  const dropAt = (i) => +(L[i - 1].sim - L[i].sim).toFixed(3);
  /* the drops the rule weighs (m1-cluster.js's own window of block counts), widest first, the finer cut on a tie */
  const legal = []; for (let i = 1; i < L.length; i++) { const left = nq - i; if (left >= K.params.minClusters && left <= K.params.maxClusters) legal.push({ i, d: dropAt(i) }); }
  legal.sort((x, y) => y.d - x.d || x.i - y.i);
  if (!legal.length || legal[0].i !== arithJ) die("the widest drop re-measured here is not m1-cluster.js's cut — the two readings of the rule disagree");
  const runner = legal[1] || null, rank = legal.findIndex((x) => x.i === ruledJ);
  const ORD = ["widest", "second-widest", "third-widest", "fourth-widest", "fifth-widest", "sixth-widest", "seventh-widest", "eighth-widest", "ninth-widest", "tenth-widest", "eleventh-widest", "twelfth-widest"];
  const lo = Math.min(ruledJ, arithJ), hi = Math.max(ruledJ, arithJ), between = (i) => on && i >= lo && i < hi;
  const lad = (view, kept, weak) => L.map((m, i) => ({ sim: m.sim, a: m.a.join("+"), b: m.b.join("+"), an: view.sideName(m.a), bn: view.sideName(m.b), kept: kept(i), weak: weak(i, m), arith: between(i) }));
  const cutOf = (j) => ({ index: j, drop: dropAt(j), above: L[j - 1].sim, below: L[j] ? L[j].sim : null });
  const ladE = on ? lad(VIEW0, (i) => i < ruledJ, (i, m) => i >= ruledJ && (i < arithJ || K.weak.includes(m))) : lad(VIEW0, (i) => i < arithJ, (i, m) => K.weak.includes(m));
  const ladA = lad(VA, (i) => i < arithJ, (i, m) => K.weak.includes(m));
  /* what the arithmetic merged: its blocks that hold more than one ruled block, and the joins that made them */
  const inOneRuled = (qq) => RULEDQ.some((g) => qq.every((q) => g.includes(q)));
  const merged = VA.clusters.filter((c) => !W.blocks[c.sig]).map((c) => {
    const joins = L.slice(0, arithJ).filter((m) => m.a.concat(m.b).every((q) => c.questions.includes(q)) && !inOneRuled(m.a.concat(m.b)));
    return { sig: c.sig, name: c.name, k: nameOf(c.sig).merges.length, joins: joins.map((m) => ({ an: VIEW0.sideName(m.a), bn: VIEW0.sideName(m.b), sim: m.sim })) };
  });
  const r1in = rd("m1-round1.input.json"), r1M = rd("m1-round1.endpoint.json"), r1ids = r1in.attrs.map((a) => a.id);
  const added = inp._round2 && inp._round2.added; if (!Array.isArray(added)) die("m1-input.json has no _round2.added block");
  const newIds = seen.filter((id) => r1ids.indexOf(id) < 0);
  if (newIds.slice().sort().join("|") !== added.slice().sort().join("|")) die("m1-input.json's _round2.added is not the set of rows added since round 1");
  const r1Blocks = cluster(r1ids, QIDS, r1M.cells, W.clusterOpts).clusters.length;
  const T = { arithN: VA.clusters.length, ruledN: RULEDQ.length, arithDrop: f3(K.cut.drop), arithJoins: arithJ, runnerDrop: runner ? f3(runner.d) : "none", runnerN: runner ? nq - runner.i : "no",
    ruledJoins: ruledJ, ruledDrop: on ? f3(dropAt(ruledJ)) : "none", ruledRank: rank >= 0 ? "the " + ORD[rank] : "outside", nq, na: attrs.length,
    nMerged: merged.length, simAbove: f3(K.cut.above), simBelow: f3(K.cut.below), nAdded: added.length, r1Attrs: r1ids.length, r1Cells: r1M.cells.length, nCells: M.cells.length, nGone: gone.length, r1Blocks };
  const ft = (s, extra) => fillR2(s, Object.assign({}, T, extra || {}));
  const takesFor = (key, view) => R2W.takes[key].map((x) => ft(x, { nSingle: view.clusters.filter((c) => c.questions.length === 1).length }));
  const statusE = Object.fromEntries(VIEW0.clusters.map((c) => [c.sig, R2W.status.eleven])), ruledE = Object.fromEntries(VIEW0.clusters.map((c) => [c.sig, true]));
  const statusA = Object.fromEntries(VA.clusters.map((c) => [c.sig, W.blocks[c.sig] ? R2W.status.arithSame : ft(R2W.status.arithMerged, { k: nameOf(c.sig).merges.length })]));
  const ruledA = Object.fromEntries(VA.clusters.map((c) => [c.sig, !!W.blocks[c.sig]]));
  const pack = (view, ladder, cut, cutWord, takesArr, status, ruled) => ({ clusters: view.clusters, spine: view.spine, spineIn: view.spineIn, rowOrder: view.rowOrder, colOrder: view.colOrder, ladder, cut, cutWord, takes: takesArr,
    homes: Object.fromEntries(view.homeOf), qc: Object.fromEntries(view.qCluster), status, ruled });
  const cutE = on ? cutOf(ruledJ) : K.cut;
  R2D = { cuts: { eleven: pack(VIEW0, ladE, cutE, R2W.ladder.ruledTip, takesFor("eleven", VIEW0), statusE, ruledE), arith: pack(VA, ladA, K.cut, W.cutWord.plain, takesFor("arith", VA), statusA, ruledA) },
    lines: { ruled: fillR2(R2W.ladder.ruled, { d: on ? f3(dropAt(ruledJ)) : "none" }), arith: fillR2(R2W.ladder.arith, { d: f3(K.cut.drop) }), at: { ruled: ruledJ, arith: arithJ } },
    tips: { eleven: R2W.cuts.eleven.tip, arith: R2W.cuts.arith.tip }, stat: T, merged, added, gone };
  /* the template's {{placeholders}}: text is escaped; a fragment is built here from escaped parts */
  const E = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const sw = (id) => `<div role="radiogroup" aria-label="${E(R2W.statement.switchLabel)}" class="bar-ctl cutsw" id="${id}">` + ["eleven", "arith"].map((k) => `<button class="btn" type="button" role="radio" data-cut="${k}" aria-checked="${k === "eleven"}">${E(ft(R2W.cuts[k].name))}<span class="tag">${E(R2W.cuts[k].tag)}</span></button>`).join("") + "</div>";
  const St = R2W.statement;
  PH = { pageTitle: E(R2W.pageTitle), eyebrow: E(R2W.head.eyebrow), title: E(R2W.head.title),
    lede: fillR2(E(R2W.head.lede), Object.assign({}, T, { nq: `<span id="n-q">${nq}</span>`, na: `<span id="n-a">${attrs.length}</span>` })),
    stTitle: E(St.title), stOpen: E(ft(St.open)), arithN: T.arithN, ruledN: T.ruledN, bigArith: E(St.bigArith), bigRuled: E(St.bigRuled),
    stHow: E(ft(St.how) + " " + ft(on ? St.ruledOn : St.ruledOff)), stWhy: E(ft(St.why)), mergesHead: E(St.mergesHead),
    merges: merged.length ? '<ul class="merges" id="merges">' + merged.map((g) => `<li data-sig="${g.sig}"><b>${E(g.name)}</b> — ` + g.joins.map((j, i) => E((i ? St.mergeThen + " " : "") + `${j.an} with ${j.bn}, ${St.mergeJoin} ${f3(j.sim)}`)).join("; ") + "</li>").join("") + "</ul>" : `<p class="cap">${E(St.mergesNone)}</p>`,
    switchLabel: E(St.switchLabel), switch1: sw("cutsw1"), switch2: sw("cutsw2") + "\n", pickMark: E(St.pickMark), pick: E(ft(St.pick)), changedHead: E(St.changedHead), changed: E(ft(St.changed)),
    added: added.map((id) => `<span class="chip" data-id="${id}">${E(seenAt.get(id).label)}</span>`).join(""), addedHead: E(St.addedHead), recordLink: E(St.recordLink), recordNote: E(ft(St.recordNote)),
    goneLegend: E(R2W.goneItem), prismsCap: E(R2W.prismsCap) };
}

const cells = {}; for (const c of M.cells) cells[c.q + "|" + c.a] = { v: c.value, vals: c.vals, j: !!c.judged || undefined, reason: c.reason };
const data = {
  kind: R2 ? "endpoint-card-round2" : "endpoint-card", hash: crypto.createHash("sha1").update(JSON.stringify(M.cells)).digest("hex").slice(0, 8), raters: M.raters, counts: M.counts,
  attrs, questions: qs.map((q) => ({ id: q.id, text: q.text, task: q.task, cluster: qCluster.get(q.id) })), cells, clusters,
  filled: M.cells.filter((c) => c.value > 0).length, spineIn: V.spineIn, spineMin: W.clusterOpts.spineClusters, faceNames: faceSlots.map((f) => f.map((id) => inv.rows.find((r) => r.id === id).label).join(" + ")),
  ladder: R2 ? R2D.cuts.eleven.ladder : K.ladder.map((m) => ({ sim: m.sim, a: m.a.join("+"), b: m.b.join("+"), an: sideName(m.a), bn: sideName(m.b), kept: m.kept, weak: K.weak.includes(m) })), cut: R2 ? R2D.cuts.eleven.cut : K.cut, ladderWord: W.ladderWord.plain, cutWord: R2 ? R2D.cuts.eleven.cutWord : W.cutWord.plain,
  spine: V.spine, unused: K.unused, rowOrder: V.rowOrder, colOrder: V.colOrder, face: attrs.filter((a) => a.m2.first === "far").map((a) => a.id), faceSlots: faceSlots.length, faceBudget: W.faceBudget,
  m2moved: moved, ownWord: W.ownWord.plain, verdictWord: Object.fromEntries(Object.entries(W.verdictWord).map(([k, v]) => [k, v.plain])), levels: W.levels, forms: W.forms, formWord: W.formWord, barFloor: W.barFloor, leftovers, takes,
};
/* the meter counts SLOTS: a family of attributes that shares one far form is one slot */
data.face = faceSlots.map((f) => f[0]);
if (R2) { data.takes.prisms = R2D.cuts.eleven.takes; data.r2 = R2D; }

let KIT; try { KIT = require("./kit-blocks.js").kitBlocks(ROOT); } catch (e) { die(e.message); }
let html = fs.readFileSync(path.join(HERE, "matrices.tpl.html"), "utf8");
/* the round regions: a __R<n>{ … }__R<n> region stays only in round n */
html = html.replace(/(?:<!--|\/\*)__R([12])\{(?:-->|\*\/)([\s\S]*?)(?:<!--|\/\*)\}__R\1(?:-->|\*\/)/g, (m, r, body) => (+r === ROUND ? body : ""));
if (/__R[12]\{|\}__R[12]/.test(html)) die("an unbalanced round region in the template");
if (R2) html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in PH ? String(PH[k]) : die("no value for {{" + k + "}} in the template")));
for (const [mark, val] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", KIT.k2.trim()], ["<!--__KIT3__-->", KIT.k3], ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) {
  if (!html.includes(mark)) die("template marker missing: " + mark); html = html.split(mark).join(val);
}
if (process.argv.includes("--check")) { const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html; console.log(ok ? OUTN + " is current" : OUTN + " is STALE — run gen-matrices.js" + (R2 ? " --round 2" : "")); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, html);
console.log(`${OUTN} · ${attrs.length} attributes x ${QIDS.length} questions · ${clusters.length} blocks · spine ${K.spine.length} · face ${faceSlots.length}/${W.faceBudget} slots · ${moved} moved from the record · ${html.length} bytes`);
if (process.argv.includes("--table")) {
  for (const c of clusters) console.log(`${String(c.n).padStart(2)} ${c.name.padEnd(24)} ${c.sig.padEnd(13)} own ${String(c.purity).padEnd(5)} near ${String(c.near).padEnd(22)} ${c.nearSim} | owns ${c.attrs.join(", ")} | borrows ${c.borrows.join(", ")}`);
  console.log("cut:", JSON.stringify(K.cut), "· weak:", tok.weak);
  if (R2) { console.log("round 2 · the arithmetic's blocks: " + VA.clusters.map((c) => c.name).join(" | ")); console.log("round 2 · statement: " + JSON.stringify(R2D.stat)); }
  console.log("spine:", V.spine.join(", ")); console.log("face slots:", faceSlots.map((f) => f.join("/")).join(" · "));
  for (const a of attrs) if (a.m2.moved) console.log(`  moved ${a.m2.moved < 0 ? "earlier" : "later  "} ${a.id.padEnd(38)} record ${a.m2.recordFirst.padEnd(8)} plan ${a.m2.first.padEnd(8)} ${a.m2.why}`);
}
