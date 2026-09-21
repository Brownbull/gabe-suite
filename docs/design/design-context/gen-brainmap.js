#!/usr/bin/env node
/* gen-brainmap.js — the navigator for the endpoint card's panels, as a Gabe Artifact page.

     node docs/design/design-context/gen-brainmap.js            # → brainmap-endpoint.html
     node docs/design/design-context/gen-brainmap.js --check     # exit 1 when the committed page is stale
     node docs/design/design-context/gen-brainmap.js --table     # the tree it computed, as text

   READS   inventory-endpoint.md     the living inventory: every attribute, ruled (via inventory-parse.js)
           m1-endpoint.json          the merged M1 matrix (question x attribute) — the CELLS, and only the cells
           m1-cluster.js             the HOME and SPINE rules, run for the self-check below
           prisms-endpoint.json      the ELEVEN RULED BLOCKS (D-015): their questions, names, plain lines, standpoints
           questions.md              the questions in their own words
           rate-sheet.words.json     the plain line of every inventory row (already authored, never re-authored here)
           brainmap.words.json       this page's authored prose — and ONLY prose: every number is a {token}
           brainmap.tpl.html         the page's CSS, markup and script
           skills/gabe-artifact/assets/artifact-chrome.html   the kit, pasted verbatim (+ one extra cog group)
   WRITES  brainmap-endpoint.html

   THE TREE IS NOT INVENTED HERE.
   · The BLOCKS are his ruling: the question groups authored in prisms-endpoint.json. They are checked to be a
     partition of questions.md, and ordered by where their own attributes sit in the inventory — measured, not
     by the order the JSON happens to be written in.
   · An attribute's HOME is the block its use weighs into most, and an attribute several blocks NEED is SHARED and
     belongs to none of them. Both rules are m1-cluster.js's, restated in `homesOver` because that module only
     exposes them through its own clustering. `homesOver` is PROVEN faithful on every run: it is re-run over the
     partition m1-cluster.js itself produces and must reproduce that module's homes and spine exactly, or this
     generator stops. A rule copy that cannot be checked is a second mapping, and a second mapping is an invention.
   · An attribute no cell uses has NO block. It is said so and drawn apart, never guessed into one.
   The only join this file makes is a RENAME across the second ruling, declared in the words file, checked both ways.
   No wallclock: same inputs, same bytes. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HERE = __dirname, ROOT = path.resolve(HERE, "../../.."), OUT = path.join(HERE, "brainmap-endpoint.html");
const KIND = "endpoint-card", ROT_DEG = 45, MAX_DEPTH = 2;          /* three drawn levels: root, branch, leaf */
const die = (m) => { console.error("gen-brainmap: " + m); process.exit(2); };
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), "utf8"));
const { parseInventory, parseQuestions, slug } = require("./inventory-parse.js");
const { cluster } = require("./m1-cluster.js");

/* ── 1 · the inventory, the matrix, the words ───────────────────────────── */
let INV; try { INV = parseInventory(path.join(HERE, "inventory-endpoint.md")); } catch (e) { die(e.message); }
const M = rd("m1-endpoint.json"), P = rd("prisms-endpoint.json"), RW = rd("rate-sheet.words.json"), W = rd("brainmap.words.json");
const QS = parseQuestions(path.join(HERE, "questions.md")), QIDS = QS.map((q) => q.id);
const live = INV.rows, liveById = new Map(live.map((r) => [r.id, r])), liveIdx = new Map(live.map((r, i) => [r.id, i]));
if (live.length < 10) die("the inventory parsed to " + live.length + " rows");
const cellIds = [];                                         /* the attributes the matrix names, first-seen order */
for (const c of M.cells) { if (QIDS.indexOf(c.q) < 0) die("the matrix names a question questions.md does not: " + c.q); if (cellIds.indexOf(c.a) < 0) cellIds.push(c.a); }

/* ── 2 · the rename contract, checked from both sides ───────────────────── */
const DECL = Object.fromEntries(Object.entries(W.m1Renames).filter(([k]) => k[0] !== "_"));
const REN = {}, SPENT = [], DROPPED = W.m1Dropped.ids.slice();
for (const [from, to] of Object.entries(DECL)) {
  if (liveById.has(from)) die(`rename ${from} → ${to}: ${from} still has a row of its own, so it was not renamed`);
  if (!liveById.has(to)) die(`rename ${from} → ${to}: ${to} is not a row of the living inventory`);
  if (cellIds.indexOf(from) < 0) { SPENT.push([from, to, "the matrix no longer names it"]); continue; }
  /* a re-rating that keys on the living inventory says the new name itself: the rename is spent, and the old id
     is then an attribute with no row — dropped, not silently folded onto a name that is already taken */
  if (cellIds.indexOf(to) >= 0) { SPENT.push([from, to, "the matrix already uses the inventory's own name"]); if (DROPPED.indexOf(from) < 0) DROPPED.push(from); continue; }
  REN[from] = to;
}
for (const id of DROPPED) { if (cellIds.indexOf(id) < 0) die("dropped id is not in the matrix: " + id); if (liveById.has(id)) die("dropped id still has a living row: " + id); }
const liveOf = (mid) => (liveById.has(mid) ? mid : REN[mid] || null);
const orphans = cellIds.filter((id) => !liveOf(id) && DROPPED.indexOf(id) < 0);
if (orphans.length) die("the matrix names attributes with no living row, no rename and no dropped entry: " + orphans.join(", "));
/* the id order fed to every rule below: the inventory's own order, then whatever the matrix has that the inventory dropped */
const IDS = cellIds.filter((id) => liveOf(id)).sort((a, b) => liveIdx.get(liveOf(a)) - liveIdx.get(liveOf(b))).concat(cellIds.filter((id) => !liveOf(id)));

/* ── 3 · the HOME and SPINE rules, restated from m1-cluster.js and proven ─ */
const SPINE_LOW = (P.clusterOpts && P.clusterOpts.spineClusters) || 3;
const V = new Map(); for (const c of M.cells) if (c.value > 0) V.set(c.q + "|" + c.a, c.value);
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
/* the proof: run the copy over the partition m1-cluster.js itself produced, and demand the same answer */
const K = cluster(IDS, QIDS, M.cells, P.clusterOpts);
{
  const mine = homesOver(K.clusters.map((c) => c.questions));
  if (mine.spine.slice().sort().join("|") !== K.spine.slice().sort().join("|"))
    die("the home/spine rule copy disagrees with m1-cluster.js on the shared attributes — fix homesOver before trusting the map");
  K.clusters.forEach((c, gi) => {
    if (mine.own[gi].join("|") !== c.attrs.join("|"))
      die(`the home/spine rule copy disagrees with m1-cluster.js on block ${c.questions.join("+")}: ${mine.own[gi].join(",")} vs ${c.attrs.join(",")}`);
  });
}

/* ── 4 · the ELEVEN RULED BLOCKS, ordered by where their attributes sit ──── */
const sigs = Object.keys(P.blocks), ruledQ = sigs.map((s) => s.split("+"));
{ const flat = ruledQ.flat(), set = new Set(flat);
  if (flat.length !== set.size) die("two ruled blocks claim the same question");
  const miss = QIDS.filter((q) => !set.has(q)), extra = flat.filter((q) => QIDS.indexOf(q) < 0);
  if (miss.length || extra.length) die(`the ruled blocks are not a partition of questions.md — missing ${miss.join(",") || "none"}, unknown ${extra.join(",") || "none"}`); }
const H = homesOver(ruledQ);
const meanPos = (gi) => (H.own[gi].length ? H.own[gi].reduce((s, a) => s + liveIdx.get(liveOf(a)), 0) / H.own[gi].length : 1e9);
const order = sigs.map((_, gi) => gi).sort((x, y) => meanPos(x) - meanPos(y) || x - y);
const blocks = order.map((gi, k) => {
  const sig = sigs[gi], w = P.blocks[sig];
  return { key: "c" + (k + 1), gi, n: k + 1, sig, name: w.name, plain: w.plain, standpoint: w.standpoint,
           questions: ruledQ[gi], attrs: H.own[gi].map(liveOf).filter(Boolean), spine: [] };
});
const byGi = new Map(blocks.map((b) => [b.gi, b]));
const spineLive = H.spine.map(liveOf).filter(Boolean).sort((x, y) => liveIdx.get(x) - liveIdx.get(y));
const spineBlocks = {};
for (const mid of H.spine) {
  const l = liveOf(mid); if (!l) continue;
  spineBlocks[l] = H.spineAt[mid].map((gi) => byGi.get(gi).key);
  spineBlocks[l].forEach((bk) => blocks.find((b) => b.key === bk).spine.push(l));
}
blocks.forEach((b) => b.spine.sort((x, y) => liveIdx.get(x) - liveIdx.get(y)));
const blockOf = new Map(); blocks.forEach((b) => b.attrs.forEach((id) => blockOf.set(id, b.key)));

/* ── 5 · the standpoint groups, read off each block's own sentence ──────── */
const stKey = (s) => {
  let m = s.match(/^Your first standpoint: (.+?)\./); if (m) return m[1];
  m = s.match(/standpoint on (.+?)\./); if (m) return m[1];
  m = s.match(/^Your (.+?) standpoint/); if (m) return m[1];
  if (/^None of your standpoints names it/.test(s)) return "named by none";
  m = s.match(/^Your (.+?)[,.]/); if (m) return m[1];
  return null;
};
const groups = [];
for (const b of blocks) {
  const k = stKey(b.standpoint);
  if (!k) die(`the block "${b.name}" names no standpoint its sentence can be read from`);
  let g = groups.find((x) => x.name === k);
  if (!g) { g = { key: slug(k), name: k, blocks: [], ids: new Set() }; groups.push(g); }
  g.blocks.push(b.key); b.attrs.concat(b.spine).forEach((id) => g.ids.add(id)); b.gkey = g.key;
}
groups.forEach((g) => { g.n = g.ids.size; delete g.ids; g.plain = `The blocks that answer from one standpoint: ${g.name}.`; });
const nUnnamed = blocks.filter((b) => stKey(b.standpoint) === "named by none").length;

/* ── 6 · the attributes ─────────────────────────────────────────────────── */
const firstOf = (row) => { const m = row.first.toLowerCase().match(/far|mid|near|tooltip|portrait/); return m ? m[0] : "not said"; };
const secKey = new Map();
const sections = INV.sections.map((s) => {
  const w = RW.sections[s.title]; if (!w) die("no words for the inventory section: " + s.title);
  const k = slug(w.short || s.title);
  s.rows.forEach((r) => secKey.set(r.id, k));
  return { key: k, short: w.short || s.title, title: s.title, plain: w.plain, attrs: s.rows.map((r) => r.id) };
});
const midOf = new Map(); IDS.forEach((mid) => { const l = liveOf(mid); if (l) midOf.set(l, mid); });
const V2 = new Set(M.cells.filter((c) => c.value === 2).map((c) => c.q + "|" + c.a));
const attrs = live.map((r) => {
  const w = RW.rows[r.id]; if (!w) die("no plain line for the inventory row: " + r.id);
  const mid = midOf.get(r.id) || null, three = r.cardFull.match(/(?:^|\s)(\d+(?:\.\d+)?) · (\d+(?:\.\d+)?) · (\d+(?:\.\d+)?)(?=\s|$)/);
  const isSpine = spineLive.indexOf(r.id) >= 0, home = isSpine ? null : blockOf.get(r.id) || null;
  return { id: r.id, label: r.label, plain: w.plain, r: r.mine.base, alarm: !!r.mine.alarm, type: r.type,
    card: three ? three.slice(1).join(" · ") : null, first: firstOf(r), sec: secKey.get(r.id),
    home, spine: isSpine, spineIn: isSpine ? H.spineIn[mid] : 0, spineBlocks: isSpine ? spineBlocks[r.id] : [],
    needs: mid ? QIDS.filter((q) => V2.has(q + "|" + mid)) : [],
    needNote: mid ? W.strings.noNeedRated : W.strings.noNeedUnrated, m1: !!mid };
});
const added = attrs.filter((a) => !a.home && !a.spine).map((a) => a.id);
const placedOwn = attrs.filter((a) => a.home).length;
if (placedOwn + spineLive.length + added.length !== attrs.length) die("every row must be in a block, shared, or not placed — the three do not add up");
const topSpine = spineLive.slice().sort((x, y) => attrs.find((a) => a.id === y).spineIn - attrs.find((a) => a.id === x).spineIn || liveIdx.get(x) - liveIdx.get(y))[0];
if (!topSpine) die("no attribute is shared — the map has nothing to draw as shared, so the rule or the matrix moved");

/* ── 7 · the tokens, and the words they fill ────────────────────────────── */
const mlabel = (mid) => { const l = liveOf(mid); return l ? liveById.get(l).label : mid.replace(/-/g, " "); };
const unjudged = (M.unjudged || []).length;
const tok = {
  nAttrs: attrs.length, nBlocks: blocks.length, nSpine: spineLive.length, nAdded: added.length,
  nPlaced: placedOwn + spineLive.length, nPlacedOwn: placedOwn, nGroups: groups.length, nSections: sections.length,
  nBranches: blocks.length + (added.length ? 1 : 0), nQuestions: QIDS.length, nLevels: MAX_DEPTH + 1, rotDeg: ROT_DEG,
  spineLow: SPINE_LOW, nUnnamed, nNodesFlat: 1 + blocks.length + (added.length ? 1 : 0),
  topSpine: attrs.find((a) => a.id === topSpine).label, topSpineIn: attrs.find((a) => a.id === topSpine).spineIn,
  nDropped: DROPPED.length, droppedNames: DROPPED.map((id) => "“" + mlabel(id) + "”").join(" and "),
  renames: (Object.entries(REN).map(([f, t]) => `“${f.replace(/-/g, " ")}” is read as “${liveById.get(t).label}”`)
    .concat(SPENT.map(([f, t, why]) => `the rename “${f.replace(/-/g, " ")}” → “${liveById.get(t).label}” is spent, because ${why}`))).join("; ") || "none is in force",
  nCells: M.cells.length, nUnjudged: unjudged,
  invHash: crypto.createHash("sha1").update(INV.md).digest("hex").slice(0, 8),
  cellsHash: crypto.createHash("sha1").update(JSON.stringify(M.cells)).digest("hex").slice(0, 8),
};
const RUNTIME = new Set(["n", "widest", "tallest"]);                    /* filled by the page from what it measured */
const fill = (s) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in tok ? String(tok[k]) : RUNTIME.has(k) ? m : die(`no value for {${k}} in an authored line: ${String(s).slice(0, 70)}`)));
const deep = (o) => (typeof o === "string" ? fill(o) : Array.isArray(o) ? o.map(deep) : o && typeof o === "object"
  ? Object.fromEntries(Object.entries(o).filter(([k]) => k[0] !== "_").map(([k, v]) => [k, deep(v)])) : o);
const Wf = deep(W);
const facts = [
  { big: String(tok.nLevels), text: Wf.reads.depthRule },
  { big: String(tok.nSpine), text: Wf.reads.spine },
  { big: String(tok.nAdded), text: added.length ? Wf.reads.added : Wf.reads.addedNone },
  { big: String(tok.nDropped), text: Wf.reads.dropped },
];
const data = {
  kind: KIND, rotDeg: ROT_DEG, maxDepth: MAX_DEPTH,
  inv: { file: "inventory-endpoint.md", hash: tok.invHash }, cellsHash: tok.cellsHash, ruled: INV.ruled,
  head: Wf.head, secWords: Wf.sections, rails: Wf.rails, layouts: Wf.layouts, groupings: Wf.groupings,
  spineModes: Wf.spineModes, trayModes: Wf.trayModes,
  ui: Object.fromEntries(Object.entries(Wf.ui).map(([k, v]) => [k, v.plain])),
  takes: Wf.takes, open: { why: Wf.strings.openWhy, items: Wf.open.items }, more: { lines: Wf.more.lines },
  pickIntro: Wf.pickIntro, facts,
  root: { name: Wf.strings.rootName, sub: Wf.strings.rootSub, plain: Wf.strings.rootPlain },
  addedName: Wf.strings.addedName, addedPlain: Wf.strings.addedPlain, trayEmpty: Wf.strings.trayEmpty,
  moreShow: Wf.strings.moreShow, moreHide: Wf.strings.moreHide, resetIdle: Wf.strings.resetIdle, resetArm: Wf.strings.resetArm,
  deepNote: Wf.strings.deepNote, foot: Wf.strings.foot,
  attrs, blocks: blocks.map((b) => ({ key: b.key, n: b.n, sig: b.sig, name: b.name, plain: b.plain, standpoint: b.standpoint, questions: b.questions, attrs: b.attrs, spine: b.spine, gkey: b.gkey })),
  groups, sections, spine: spineLive, added,
  qtext: Object.fromEntries(QS.map((q) => [q.id, q.text])),
};

/* ── 8 · the kit, verbatim, plus one cog group for the motion rule ──────── */
let KIT; try { KIT = require("./kit-blocks.js").kitBlocks(ROOT); } catch (e) { die(e.message); }
const swap = (s, a, b) => { if (!s.includes(a)) die("kit text to adapt not found: " + a.slice(0, 50)); return s.replace(a, b); };
/* the page animates, so the kit's Motion group STAYS; an Animations group is added beside it (his standing rule:
   a page opens on the finished picture, and the cog offers to play it instead) */
const k2 = swap(KIT.k2.replace(/\s*<!-- Drop this Motion group[^>]*-->/, ""), '<p class="af-foot" id="af-foot">',
  '<div class="af-divider"></div>\n    <div class="af-group" role="radiogroup" aria-label="Animations" id="af-anim"><p class="af-legend">Animations</p></div>\n    <p class="af-foot" id="af-foot">');

let html = fs.readFileSync(path.join(HERE, "brainmap.tpl.html"), "utf8");
for (const [mark, val2] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", k2.trim()], ["<!--__KIT3__-->", KIT.k3],
                            ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) {
  if (!html.includes(mark)) die("template marker missing: " + mark);
  html = html.split(mark).join(val2);
}
{ const left = JSON.stringify(data).replace(/\{(n|widest|tallest)\}/g, "").match(/\{[a-z]\w*\}/i);
  if (left) die("an unfilled token survived into the page data: " + left[0]); }

if (process.argv.includes("--check")) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html;
  console.log(same ? "brainmap-endpoint.html is current" : "brainmap-endpoint.html is STALE — run gen-brainmap.js");
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, html);
console.log(`brainmap-endpoint.html · ${attrs.length} attributes · ${blocks.length} blocks · ${spineLive.length} shared · ${added.length} not placed · ${groups.length} standpoints · ${sections.length} sections · ${tok.nCells} cells (${unjudged} unsettled) · inventory ${tok.invHash} · cells ${tok.cellsHash} · ${html.length} bytes`);
if (process.argv.includes("--table")) {
  console.log(`root  ${data.root.name}`);
  for (const b of blocks) console.log(`  ${String(b.n).padStart(2)} ${b.name.padEnd(24)} ${b.sig.padEnd(15)} own ${String(b.attrs.length).padStart(2)} shared ${String(b.spine.length).padStart(2)}  standpoint: ${b.gkey}`);
  if (added.length) console.log(`  -- ${data.addedName.padEnd(24)} ${"".padEnd(15)} own ${String(added.length).padStart(2)}`);
  console.log("shared: " + spineLive.map((id) => `${attrs.find((a) => a.id === id).label} (${attrs.find((a) => a.id === id).spineIn})`).join(" · "));
  console.log("standpoints: " + groups.map((g) => `${g.name} [${g.blocks.length}]`).join(" · "));
  console.log("not placed: " + (added.map((id) => attrs.find((a) => a.id === id).label).join(" · ") || "none"));
}
