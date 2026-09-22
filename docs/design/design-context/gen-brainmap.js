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
     belongs to none of them. Both rules are m1-cluster.js's, restated in `homesOver` (m1-homes.js) because that module only
     exposes them through its own clustering. `homesOver` is PROVEN faithful on every run: it is re-run over the
     partition m1-cluster.js itself produces and must reproduce that module's homes and spine exactly, or this
     generator stops. A rule copy that cannot be checked is a second mapping, and a second mapping is an invention.
   · An attribute no cell uses has NO block. It is said so and drawn apart, never guessed into one.
   · The STAGE grouping (D-021) is the one mapping that IS authored: nothing in the data says which of his stages a block
     touches, so brainmap.words.json#stages.byBlock proposes a LIST per block (keyed by its question signature, with a
     reason and a line it cites from his stage record or the block's own question), and the page says it is a proposal.
     It is checked to name every ruled block exactly once, with only known stages and a reason each; the page switches
     between D-021's rule (a block that spans stages, or has none, sits under "across") and drawing a block under every
     stage it touches.
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
/* the rules live in m1-homes.js, shared with gen-matrices.js --round 2 (which draws the same eleven over the same cells) */
const { homesOver } = require("./m1-homes.js").homes(IDS, QIDS, M.cells, SPINE_LOW);
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
const UNNAMED = "named by none";        /* the BUCKET for a block no standpoint of his names — never a standpoint itself */
const stKey = (s) => {
  let m = s.match(/^Your first standpoint: (.+?)\./); if (m) return m[1];
  m = s.match(/standpoint on (.+?)\./); if (m) return m[1];
  m = s.match(/^Your (.+?) standpoint/); if (m) return m[1];
  if (/^None of your standpoints names it/.test(s)) return UNNAMED;
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
const nUnnamed = blocks.filter((b) => stKey(b.standpoint) === UNNAMED).length;
/* a standpoint SHARED by more than a single block — the bucket for the blocks none of his standpoints names is not one
   of them, and the same sentence counts those blocks separately */
const sharedSt = groups.filter((g) => g.name !== UNNAMED && g.blocks.length > 1);

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

/* ── 6b · the STAGE grouping (D-021) — HIS SPINE as the rail, with an AUTHORED list per block ──────────────
   The RAIL is not authored: it is the spine table of endpoint-stages.md, parsed here — the six stages, the UNCAUGHT
   bay and the CLIENT screen, in the record's own order, each with the KIND that record's first column gives it. The
   check runs BOTH WAYS (the one-way check missed a record row that never reached `order`): every record row must be in
   `order` and every row of `order` must be in the record, with the same kind; the bay and the screen must each carry a
   `mark` found verbatim in the record, because what they ARE is what the record says about them.
   What IS authored is each block's LIST of rows (possibly empty), a reason, and a line it CITES — found verbatim in
   endpoint-stages.md or questions.md, or this generator stops. Two rules place a block that spans rows, and the page
   switches between them: "one" is D-021 as recorded (a block naming a single row sits under it, any other under Across)
   and "every" draws a block under every row in its list (only an empty list goes to Across). */
const SW = W.stages || die("the words file has no `stages` block (D-021)");
const ACROSS = "across", RULES = ["one", "every"], KINDS = { stage: "stage", bay: "bay", screen: "screen" };
const STAGE_MD = fs.readFileSync(path.join(HERE, "../workflow-panel/endpoint-stages.md"), "utf8");
const QUEST_MD = fs.readFileSync(path.join(HERE, "questions.md"), "utf8");
/* his record's spine table, parsed: | <marker> | **NAME** | what happens | slots | endings that leave here | */
const SPINE = [];
for (const line of STAGE_MD.split("\n")) {
  const m = line.match(/^\|\s*(\d+|bay|screen)\s*\|\s*\*\*([A-Z]+)\*\*\s*\|/);
  if (!m) continue;
  const cells = line.split("|").map((x) => x.trim());
  SPINE.push({ name: m[2], kind: /^\d+$/.test(m[1]) ? KINDS.stage : m[1] === "bay" ? KINDS.bay : KINDS.screen,
               what: cells[3] || "", endings: cells[5] || "" });
}
if (SPINE.length < 3) die("the spine table of endpoint-stages.md parsed to " + SPINE.length + " rows — the record moved, or its table did");
if (new Set(SPINE.map((r) => r.name)).size !== SPINE.length) die("the record's spine names a row twice");
if (!Array.isArray(SW.order) || !SW.order.length) die("stages.order is empty");
if (new Set(SW.order).size !== SW.order.length) die("stages.order names a row twice");
/* both ways, in order: the rail IS his spine */
if (SW.order.join("|") !== SPINE.map((r) => r.name).join("|"))
  die(`stages.order must be his spine, in its order — the record says ${SPINE.map((r) => r.name).join(" · ")}, stages.order says ${SW.order.join(" · ")}`);
for (const r of SPINE) {
  const n = (SW.names || {})[r.name] || die("stages.names has no entry for the spine row " + r.name);
  if (n.kind !== r.kind) die(`stages.names[${r.name}].kind says "${n.kind}", the record's spine says "${r.kind}"`);
  if (r.kind === KINDS.stage) { if (n.mark) die(`stages.names[${r.name}] carries a \`mark\`, but the record makes it an ordinary stage`); }
  else if (!n.mark || !STAGE_MD.includes(n.mark)) die(`stages.names[${r.name}] must carry a \`mark\` in the record's own words — "${n.mark || ""}" is not in endpoint-stages.md`);
}
if (SW.order.some((st) => slug(st) === ACROSS)) die(`"${ACROSS}" is this map's own branch, not a row of the record — it cannot be in stages.order`);
if (!SW.rule || !SW.rule.opts || RULES.some((r) => !SW.rule.opts[r]) || RULES.indexOf(SW.rule.default) < 0) die("stages.rule must offer the rules " + RULES.join(" and ") + " and name one as the default");
/* every row's PLAIN LINE is his too: it must OPEN with the record's own "what happens there" cell, verbatim but for the
   first letter and the sentence stop — the way the bay's and the screen's marks already are. What is proven that way is
   then EXEMPT from the number sweep below: the ANSWER line had the record's "one body per ending" weakened to "a body
   per ending" to get past the sweep, and the record's words win over the sweep, never the other way round. */
const PROVEN = [];
const capped = (s) => s.charAt(0).toUpperCase() + s.slice(1);
for (const r of SPINE) {
  if (!r.what) die(`the record's spine row ${r.name} has no "what happens there" cell to check a plain line against`);
  const want = capped(r.what), got = String(SW.names[r.name].plain);
  if (got.indexOf(want) !== 0)
    die(`stages.names[${r.name}].plain must open with the record's own words — the record says “${want}”, the words file opens “${got.slice(0, want.length)}”`);
  const rest = got.slice(want.length);
  if (rest !== "." && rest.indexOf(". ") !== 0)
    die(`stages.names[${r.name}].plain must stop after the record's words or go on in a new sentence — it goes on “${rest.slice(0, 40)}”`);
  PROVEN.push(want);
}

const endingRows = SPINE.filter((r) => !/^—/.test(r.endings)).map((r) => r.name);
{ const keys = Object.keys(SW.byBlock || {}).filter((k) => k[0] !== "_");
  const miss = sigs.filter((sg) => keys.indexOf(sg) < 0), extra = keys.filter((k) => sigs.indexOf(k) < 0);
  if (miss.length || extra.length) die(`stages.byBlock must name every ruled block once — missing ${miss.join(",") || "none"}, unknown ${extra.join(",") || "none"}`);
  for (const k of keys) { const e = SW.byBlock[k];
    if (!Array.isArray(e.stages)) die(`stages.byBlock[${k}] has no \`stages\` LIST (an empty list is allowed)`);
    if ("stage" in e) die(`stages.byBlock[${k}] still carries a single \`stage\`: a block names a LIST of stages now`);
    for (const st of e.stages) if (SW.order.indexOf(st) < 0) die(`stages.byBlock[${k}] names a row that is not in the order: ${st}`);
    if (new Set(e.stages).size !== e.stages.length) die(`stages.byBlock[${k}] names a row twice`);
    if (!e.why || !String(e.why).trim()) die(`stages.byBlock[${k}] gives no reason`);
    /* a block whose subject IS the endings declares it, and the record's endings column then owns its list */
    if (e.fromEndingsColumn && e.stages.slice().sort().join("|") !== endingRows.slice().sort().join("|"))
      die(`stages.byBlock[${k}] declares its list is the rows an ending leaves from: the record says ${endingRows.join(" · ")}, it lists ${e.stages.join(" · ") || "none"}`);
    const src = e.from === "stages" ? STAGE_MD : e.from === "questions" ? QUEST_MD : die(`stages.byBlock[${k}].from must be "stages" or "questions"`);
    if (!e.cites || !src.includes(e.cites)) die(`stages.byBlock[${k}] cites a line that is not in ${e.from === "stages" ? "endpoint-stages.md" : "questions.md"}: ${String(e.cites).slice(0, 60)}`); } }
/* ── 6c · the number sweep, over the WHOLE words file ──────────────────────
   House rule: a fact is generated, never typed — a number inside an authored sentence is a {token} the generator fills,
   including a number spelled as a word. The sweep used to run over the `stages` block alone, so typed counts survived
   everywhere else ("The five placements", "Two pairs of blocks share a standpoint", "Two attributes are joined to M1"
   when none is). It now runs over every authored line, with the exemptions DECLARED here and nowhere else:
     E1  a {token} — the generator fills it.
     E2  an id or a name that carries a number — D-021 · Q3 · M1 · "loop 1" — and an HTTP status, which is a LABEL: the
         record's own "endings that leave here" column is written in them.
     E3  a line PROVEN verbatim against a source — `cites` (quoted from his record or his question list, and proven
         below) and the stage lines' opening words (proven just above). The record's words win over the sweep.
     E4  a number inside “curly quotes”: his word quoted back to him, never a count of the page's own. It is exempt only
         when the same line also carries a {token}, so a quoted number is always answered by a measured one.
     E5  "one". Every use of it in this file is English's article or pronoun — "one line per node", "the only one",
         "One band" — and each line the widening flagged was re-read on 2026-09-22; none of them counts with it. Two
         and up are swept. Rewriting such a line to dodge the sweep is the defect this whole pass came from.
   `m1Renames` and `m1Dropped` hold IDS, not prose, and are skipped like `cites`. */
const NUMWORD = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;
const QUOTED = /“[^”]*”/g, TOKEN = /\{[a-z]\w*\}/i;
const SWEEP_SKIP = new Set(["cites", "m1Renames", "m1Dropped"]);
const scrub = (s) => { let t = String(s);
  for (const pv of PROVEN) t = t.split(pv).join(" ");
  return t.replace(QUOTED, " ").replace(/\{[a-z]\w*\}/gi, " ").replace(/\bD-\d{3}\b/g, " ")
    .replace(/\bQ\d{1,2}\b/g, " ").replace(/\bM\d\b/g, " ").replace(/\bloop \d+\b/gi, " ").replace(/\b[1-5]\d\d\b/g, " "); };
(function sweepNums(o, at) {
  if (typeof o === "string") {
    const quoted = String(o).match(QUOTED) || [];
    if (quoted.some((q) => /\d/.test(q) || NUMWORD.test(q)) && !TOKEN.test(String(o)))
      die(`a number inside a quote is his word, and must be answered by a measured {token} in the same line · ${at}: “${String(o).slice(0, 90)}”`);
    const s = scrub(o), m = s.match(/\d/) || s.match(NUMWORD);
    if (m) die(`a typed number in an authored line — make it a {token} the generator fills · ${at}: “${String(o).slice(0, 90)}” (found “${m[0]}”)`);
    return; }
  if (Array.isArray(o)) return o.forEach((v, i) => sweepNums(v, at + "[" + i + "]"));
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (k[0] !== "_" && !SWEEP_SKIP.has(k)) sweepNums(v, at + "." + k);
})(W, "");

const stageKey = (st) => slug(st);
blocks.forEach((b) => { const e = SW.byBlock[b.sig]; b.stages = e.stages.map(stageKey); b.stageWhy = e.why; b.stageCites = e.cites; });
/* under a rule, which drawn branches hold a block: its own stage(s), or Across */
const placeUnder = (b, rule) => (rule === "one" ? (b.stages.length === 1 ? b.stages.slice() : [ACROSS]) : (b.stages.length ? b.stages.slice() : [ACROSS]));
const nOf = (bs) => { const ids = new Set(); bs.forEach((bk) => { const b = blocks.find((x) => x.key === bk); b.attrs.concat(b.spine).forEach((id) => ids.add(id)); }); return ids.size; };
const stageRows = SW.order.map((st) => ({ key: stageKey(st), stage: st, name: SW.names[st].name, kind: SW.names[st].kind,
    mark: SW.names[st].mark || null, plain: SW.names[st].plain, across: false }))
  .concat([{ key: ACROSS, stage: ACROSS, name: SW.across.name, kind: ACROSS, mark: null, plain: null, across: true }]);
stageRows.forEach((r) => { r.under = {}; r.n = {};
  for (const rule of RULES) { r.under[rule] = blocks.filter((b) => placeUnder(b, rule).indexOf(r.key) >= 0).map((b) => b.key); r.n[rule] = nOf(r.under[rule]); } });
/* the self-check: under "one" every block is drawn exactly once; under "every" a block is drawn once per listed stage */
{ const cnt = (rule) => stageRows.reduce((s2, r) => s2 + r.under[rule].length, 0);
  if (cnt("one") !== blocks.length) die("under the rule as recorded, the stage grouping does not hold every block exactly once");
  if (cnt("every") !== blocks.reduce((s2, b) => s2 + Math.max(1, b.stages.length), 0)) die("under every-stage, a block is not drawn once per stage it names"); }
const emptyUnder = (rule) => stageRows.filter((r) => !r.across && !r.under[rule].length).map((r) => r.name);
const nOneStage = blocks.filter((b) => b.stages.length === 1).length, nNone = blocks.filter((b) => !b.stages.length).length;
const bayRow = stageRows.find((r) => r.kind === KINDS.bay) || die("the record's spine has no bay row to draw");
const bayBlocks = blocks.filter((b) => b.stages.indexOf(bayRow.key) >= 0);

/* ── 6d · what the page itself paints, read off the template ──────────────
   Two counts on the page are counts of the PAGE: how many placements it draws, and how many switches sit beside the
   placement pick. Both are read off brainmap.tpl.html here, so neither is a second list kept in the words file: the
   template's own `LAYS` must be the placements the words file describes, and every rail the template paints must be
   described, and every rail described must be painted. The copy text must carry a value for each switch, or the line
   it writes would name a switch and say nothing about it. */
const TPL = fs.readFileSync(path.join(HERE, "brainmap.tpl.html"), "utf8");
const mLays = TPL.match(/var LAYS = \[([^\]]*)\]/) || die("the template no longer declares its placements as `var LAYS = [...]`");
const LAYKEYS = mLays[1].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
if (LAYKEYS.join("|") !== Object.keys(W.layouts).join("|"))
  die(`the template draws the placements ${LAYKEYS.join(",")}, the words file describes ${Object.keys(W.layouts).join(",")}`);
const RAILKEYS = Object.keys(W.rails);
for (const k of RAILKEYS) if (!TPL.includes("D.rails." + k + ".")) die("the words file describes a rail the template never paints: " + k);
{ const used = [...TPL.matchAll(/D\.rails\.(\w+)\./g)].map((m) => m[1]);
  const extra = [...new Set(used)].filter((k) => RAILKEYS.indexOf(k) < 0);
  if (extra.length) die("the template paints a rail the words file does not describe: " + extra.join(", ")); }
const SWITCH_RAILS = RAILKEYS.filter((k) => k !== "layout");     /* Placement is the PICK; every other rail is a switch */
for (const k of SWITCH_RAILS) if (!new RegExp("\\b" + k + ": function").test(TPL))
  die(`the template's copy text has no value for the switch "${k}" — add it to SWITCHVAL, or the text names a switch and says nothing about it`);
/* the CONTROL plain lines, checked both ways like the rails: six of the ten were carried here and painted nowhere
   (2026-09-22), so an authored line nobody could read survived — including `ui.node`, whose claim about a branch's
   number is false under By stage. A line here must be painted; a `D.ui.x` the template paints must be described. */
const UIKEYS = Object.keys(W.ui).filter((k) => k[0] !== "_");
for (const k of UIKEYS) if (!TPL.includes("D.ui." + k)) die(`the words file carries a plain line the template never paints: ui.${k} — paint it, or drop the line`);
{ const used = [...new Set([...TPL.matchAll(/D\.ui\.(\w+)/g)].map((m) => m[1]))].filter((k) => UIKEYS.indexOf(k) < 0);
  if (used.length) die("the template paints a plain line the words file does not carry: ui." + used.join(", ui.")); }

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
  nSpineRows: SW.order.length, nStageRows: SPINE.filter((r) => r.kind === KINDS.stage).length, nEndingRows: endingRows.length,
  nBayBlocks: bayBlocks.length, bayBlocks: bayBlocks.map((b) => "“" + b.name + "”").join(" · "),
  nOneStage, nNone, nMulti: blocks.length - nOneStage - nNone,
  nLayouts: LAYKEYS.length, nSwitches: SWITCH_RAILS.length, nSpineModes: Object.keys(W.spineModes).length,
  nRenamesDecl: Object.keys(DECL).length, nRenamesLive: Object.keys(REN).length,
  sharedStandpoints: sharedSt.map((g) => `“${g.name}” (${g.blocks.map((bk) => blocks.find((b) => b.key === bk).name).join(" · ")})`).join("; ")
    || "none — every standpoint of yours names a single block",
  nAcrossOne: stageRows.find((r) => r.across).under.one.length, nAcrossEvery: stageRows.find((r) => r.across).under.every.length,
  emptyStagesOne: emptyUnder("one").join(" · ") || "none", emptyStagesEvery: emptyUnder("every").join(" · ") || "none",
};
/* filled by the PAGE from what it measured — the layout factors among them: what C spreads by is a number only a
   laid-out tree has, and it changes with what is open, so the generator cannot know it and must not type it */
const RUNTIME = new Set(["n", "widest", "tallest", "name", "kind", "quiet", "spread", "spreadClosed"]);
const fill = (s) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in tok ? String(tok[k]) : RUNTIME.has(k) ? m : die(`no value for {${k}} in an authored line: ${String(s).slice(0, 70)}`)));
const deep = (o) => (typeof o === "string" ? fill(o) : Array.isArray(o) ? o.map(deep) : o && typeof o === "object"
  ? Object.fromEntries(Object.entries(o).filter(([k]) => k[0] !== "_").map(([k, v]) => [k, deep(v)])) : o);
const Wf = deep(W);
/* a block's stage reason is authored prose like any other line, so it takes its {token}s from the same fill */
blocks.forEach((b) => { b.stageWhy = Wf.stages.byBlock[b.sig].why; });
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
  spineModes: Wf.spineModes, trayModes: Wf.trayModes, actModes: Wf.actModes, acts: Wf.acts,
  ui: Object.fromEntries(Object.entries(Wf.ui).map(([k, v]) => [k, v.plain])),
  takes: Wf.takes, open: { why: Wf.strings.openWhy, items: Wf.open.items }, more: { lines: Wf.more.lines },
  pickIntro: Wf.pickIntro, facts,
  root: { name: Wf.strings.rootName, sub: Wf.strings.rootSub, plain: Wf.strings.rootPlain },
  addedName: Wf.strings.addedName, addedPlain: Wf.strings.addedPlain, trayEmpty: Wf.strings.trayEmpty,
  moreShow: Wf.strings.moreShow, moreHide: Wf.strings.moreHide, resetIdle: Wf.strings.resetIdle, resetArm: Wf.strings.resetArm,
  deepNote: Wf.strings.deepNote, foot: Wf.strings.foot,
  attrs, blocks: blocks.map((b) => ({ key: b.key, n: b.n, sig: b.sig, name: b.name, plain: b.plain, standpoint: b.standpoint, questions: b.questions, attrs: b.attrs, spine: b.spine, gkey: b.gkey, stages: b.stages, stageWhy: b.stageWhy })),
  groups, sections, spine: spineLive, added,
  stages: stageRows, stageWords: { note: Wf.stages.note, emptyPlain: Wf.stages.emptyPlain, across: ACROSS,
    acrossPlain: { one: Wf.stages.across.plainOne, every: Wf.stages.across.plainEvery }, rule: Wf.stages.rule, rules: RULES }, keep: Wf.keep,
  qtext: Object.fromEntries(QS.map((q) => [q.id, q.text])),
};

/* ── 8 · the kit, verbatim, plus one cog group for the motion rule ──────── */
let KIT; try { KIT = require("./kit-blocks.js").kitBlocks(ROOT); } catch (e) { die(e.message); }
const swap = (s, a, b) => { if (!s.includes(a)) die("kit text to adapt not found: " + a.slice(0, 50)); return s.replace(a, b); };
/* the page animates, so the kit's Motion group STAYS; an Animations group is added beside it (his standing rule:
   a page opens on the finished picture, and the cog offers to play it instead) */
const k2 = swap(KIT.k2.replace(/\s*<!-- Drop this Motion group[^>]*-->/, ""), '<p class="af-foot" id="af-foot">',
  '<div class="af-divider"></div>\n    <div class="af-group" role="radiogroup" aria-label="Animations" id="af-anim"><p class="af-legend">Animations</p></div>\n    <p class="af-foot" id="af-foot">');

let html = TPL;
for (const [mark, val2] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", k2.trim()], ["<!--__KIT3__-->", KIT.k3],
                            ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) {
  if (!html.includes(mark)) die("template marker missing: " + mark);
  html = html.split(mark).join(val2);
}
{ const left = JSON.stringify(data).replace(new RegExp("\\{(" + [...RUNTIME].join("|") + ")\\}", "g"), "").match(/\{[a-z]\w*\}/i);
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
  for (const rule of RULES) console.log(`stages (proposed, rule ${rule}): ` + stageRows.map((r) => `${r.name} [${r.under[rule].map((k) => blocks.find((b) => b.key === k).name).join(", ") || "empty"}]`).join(" · "));
  console.log("not placed: " + (added.map((id) => attrs.find((a) => a.id === id).label).join(" · ") || "none"));
}
