#!/usr/bin/env node
/* gen-matrices.js — M1 (attribute x question) and M2 (attribute x zoom level) for one inventory, as a Gabe Artifact page.

     node docs/design/design-context/gen-matrices.js [--check] [--table]

   READS   inventory-endpoint.md (via inventory-parse.js — the ratings on record) · m1-input.json (what the raters saw) ·
           m1-endpoint.json (the merged matrix, written by m1-merge.js) · m1-cluster.js (the reordering, arithmetic only) ·
           prisms-endpoint.json (authored: block names, plain lines, the face budget, the takes) · the gabe-artifact kit ·
           matrices.tpl.html
   WRITES  matrices-endpoint.html
   M2 is a RULE, stated here and nowhere else: the face = the fixed identity + the rating-3 attributes the most questions
   need, up to the budget (a family of attributes shares one slot); a 3 that misses the face starts at mid; a 2 starts at
   mid when two or more questions need it, else near; a 1 starts at the hover, or the portrait when no question touches it.
   After its first level an attribute stays visible at every nearer one. No wallclock: same inputs, same bytes. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HERE = __dirname, ROOT = path.resolve(HERE, "../../.."), OUT = path.join(HERE, "matrices-endpoint.html");
const die = (m) => { console.error("gen-matrices: " + m); process.exit(2); };
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), "utf8"));

const { parseInventory, parseQuestions } = require("./inventory-parse.js"), { cluster } = require("./m1-cluster.js");
let inv; try { inv = parseInventory(path.join(HERE, "inventory-endpoint.md")); } catch (e) { die(e.message); }
const inp = rd("m1-input.json"), M = rd("m1-endpoint.json"), W = rd("prisms-endpoint.json"), qs = parseQuestions(path.join(HERE, "questions.md"));
if (M.unjudged.length && !process.argv.includes("--draft")) die("hard splits without a verdict (use --draft to build on the median): " + M.unjudged.join(", "));
const ids = inv.rows.map((r) => r.id), seen = inp.attrs.map((a) => a.id);
if (ids.join("|") !== seen.join("|")) die("the inventory's rows moved since M1 was rated — rebuild m1-input.json and re-rate");
if (qs.map((q) => q.id).join("|") !== inp.questions.map((q) => q.id).join("|")) die("questions.md moved since M1 was rated");

/* ── M1: cluster, then name the blocks ── */
const QIDS = qs.map((q) => q.id), K = cluster(ids, QIDS, M.cells, W.clusterOpts);
const clusters = K.clusters.map((c, i) => {
  const sig = c.questions.join("+"), w = W.blocks[sig];
  if (!w) die(`the blocks changed — no name for the block ${sig}. Blocks now: ${K.clusters.map((x) => x.questions.join("+")).join(" | ")}`);
  return { key: c.key, n: i + 1, sig, name: w.name, plain: w.plain, standpoint: w.standpoint, questions: c.questions, attrs: c.attrs, purity: c.purity, nearSig: c.nearest.questions.join("+"), nearSim: c.nearest.sim };
});
const bySig = new Map(clusters.map((c) => [c.sig, c]));
const V2 = new Set(M.cells.filter((c) => c.value === 2).map((c) => c.q + "|" + c.a));
for (const c of clusters) { c.near = (bySig.get(c.nearSig) || {}).name || null; c.borrows = ids.filter((a) => !c.attrs.includes(a) && c.questions.some((q) => V2.has(q + "|" + a))); }
/* a side of a join, in the blocks' names: the final blocks whose questions it holds */
const sideName = (qsIn) => clusters.filter((c) => c.questions.every((q) => qsIn.includes(q))).map((c) => c.name).join(" + ") || qsIn.join("+");
const homeOf = new Map(); K.spine.forEach((a) => homeOf.set(a, "spine")); clusters.forEach((c) => c.attrs.forEach((a) => homeOf.set(a, c.key)));
const qCluster = new Map(); clusters.forEach((c) => c.questions.forEach((q) => qCluster.set(q, c.key)));

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
  return { id: row.id, label: row.label, sec: s.sec, plain: s.plain, eg: s.eg, r, alarm, fresh: row.fresh, gap: row.gap, need, touch, home: homeOf.get(row.id) || null,
    m2: { first, levels: LV.map((lv, i) => (i >= fi ? formAt(row, lv) : null)), alertFar: alarm, recordFirst: rf, moved: mv, why } };
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

const cells = {}; for (const c of M.cells) cells[c.q + "|" + c.a] = { v: c.value, vals: c.vals, j: !!c.judged || undefined, reason: c.reason };
const data = {
  kind: "endpoint-card", hash: crypto.createHash("sha1").update(JSON.stringify(M.cells)).digest("hex").slice(0, 8), raters: M.raters, counts: M.counts,
  attrs, questions: qs.map((q) => ({ id: q.id, text: q.text, task: q.task, cluster: qCluster.get(q.id) })), cells, clusters,
  filled: M.cells.filter((c) => c.value > 0).length, spineIn: K.spineIn, spineMin: W.clusterOpts.spineClusters, faceNames: faceSlots.map((f) => f.map((id) => inv.rows.find((r) => r.id === id).label).join(" + ")),
  ladder: K.ladder.map((m) => ({ sim: m.sim, a: m.a.join("+"), b: m.b.join("+"), an: sideName(m.a), bn: sideName(m.b), kept: m.kept, weak: K.weak.includes(m) })), cut: K.cut, ladderWord: W.ladderWord.plain, cutWord: W.cutWord.plain,
  spine: K.spine, unused: K.unused, rowOrder: K.rowOrder, colOrder: K.colOrder, face: attrs.filter((a) => a.m2.first === "far").map((a) => a.id), faceSlots: faceSlots.length, faceBudget: W.faceBudget,
  m2moved: moved, ownWord: W.ownWord.plain, verdictWord: Object.fromEntries(Object.entries(W.verdictWord).map(([k, v]) => [k, v.plain])), levels: W.levels, forms: W.forms, formWord: W.formWord, barFloor: W.barFloor, leftovers, takes,
};
/* the meter counts SLOTS: a family of attributes that shares one far form is one slot */
data.face = faceSlots.map((f) => f[0]);

let KIT; try { KIT = require("./kit-blocks.js").kitBlocks(ROOT); } catch (e) { die(e.message); }
let html = fs.readFileSync(path.join(HERE, "matrices.tpl.html"), "utf8");
for (const [mark, val] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", KIT.k2.trim()], ["<!--__KIT3__-->", KIT.k3], ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) {
  if (!html.includes(mark)) die("template marker missing: " + mark); html = html.split(mark).join(val);
}
if (process.argv.includes("--check")) { const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html; console.log(ok ? "matrices-endpoint.html is current" : "matrices-endpoint.html is STALE — run gen-matrices.js"); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, html);
console.log(`matrices-endpoint.html · ${attrs.length} attributes x ${QIDS.length} questions · ${clusters.length} blocks · spine ${K.spine.length} · face ${faceSlots.length}/${W.faceBudget} slots · ${moved} moved from the record · ${html.length} bytes`);
if (process.argv.includes("--table")) {
  for (const c of clusters) console.log(`${String(c.n).padStart(2)} ${c.name.padEnd(24)} ${c.sig.padEnd(13)} own ${String(c.purity).padEnd(5)} near ${String(c.near).padEnd(22)} ${c.nearSim} | owns ${c.attrs.join(", ")} | borrows ${c.borrows.join(", ")}`);
  console.log("cut:", JSON.stringify(K.cut), "· weak:", tok.weak);
  console.log("spine:", K.spine.join(", ")); console.log("face slots:", faceSlots.map((f) => f.join("/")).join(" · "));
  for (const a of attrs) if (a.m2.moved) console.log(`  moved ${a.m2.moved < 0 ? "earlier" : "later  "} ${a.id.padEnd(38)} record ${a.m2.recordFirst.padEnd(8)} plan ${a.m2.first.padEnd(8)} ${a.m2.why}`);
}
