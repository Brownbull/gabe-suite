#!/usr/bin/env node
/* gen-gaps.js — the evaluation of what M1 left over, as a Gabe Artifact page the operator rules on.

     node docs/design/design-context/gen-gaps.js [--check]

   READS   gaps-endpoint.raw.json (six agent investigators + one agent judge; never hand-edited) · gaps-endpoint.effects.raw.json
           (five agent drafters + one agent verifier: what each piece ADDS — fields, a real before/after on the example
           endpoint, the prisms fed, the questions moved; never hand-edited) · gaps-endpoint.words.json
           (authored plain names, gains, my recommendation per piece) · questions.md · ../workflow-panel/_lab-ep.js (the one
           wrong picture is SHOWN from the lab's own facts: the order the Security panel lists the app-wide checks in,
           against the order the route runs them) · the kit · gaps.tpl.html
   WRITES  gaps-endpoint.html
   No wallclock: same inputs, same bytes. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HERE = __dirname, ROOT = path.resolve(HERE, "../../.."), OUT = path.join(HERE, "gaps-endpoint.html");
const die = (m) => { console.error("gen-gaps: " + m); process.exit(2); };
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), "utf8"));
const RAW = rd("gaps-endpoint.raw.json"), W = rd("gaps-endpoint.words.json"), J = RAW.judge;
const qs = require("./inventory-parse.js").parseQuestions(path.join(HERE, "questions.md")), QT = new Map(qs.map((q) => [q.id, q.text]));

const items = new Map(J.items.map((x) => [x.id, x])), inv = new Map(RAW.investigators.map((x) => [x.id, x]));
const names = J.bundles.map((b) => b.name), authored = Object.keys(W.bundles);
if (names.join("|") !== authored.join("|")) die(`the pieces of work changed — judge: ${names.join(", ")} · words: ${authored.join(", ")}`);
const ORDER = { inventory: 0, lab: 1, arm: 2, outside: 3 };
const bundles = J.bundles.map((b, i) => {
  const w = W.bundles[b.name], its = b.items.map((id) => items.get(id) || die("bundle names an unknown item: " + id));
  const q = [...new Set(b.items.flatMap((id) => (id.match(/Q\d+/g) || [])).concat(w.extraQ))].sort((x, y) => Number(x.slice(1)) - Number(y.slice(1)));
  return { key: b.name, n: i + 1, name: w.name, gain: w.gain, mine: w.mine, effort: b.effort, imp: Math.max(...its.map((x) => x.importance)), questions: q.map((id) => ({ id, text: QT.get(id) || die("unknown question " + id) })),
    closes: its.map((x) => ({ id: x.id, label: x.new_attribute || (W.attrs[x.id] || {}).label || W.labels[x.id] || die("no readable label for " + x.id + " — add it to labels in the words file"), plain: x.plain, why: x.why, effort: x.effort, imp: x.importance, rec: x.recommendation, kind: x.kind })), work: b.work, gainLong: b.gain };
});
if (bundles.some((b, i) => i && ORDER[b.effort] < ORDER[bundles[i - 1].effort])) die("the judge's bundle order is not cheapest first");
const attrs = Object.keys(W.attrs).map((id) => { const x = items.get(id) || die("no judged item for " + id), w = W.attrs[id]; return { id, label: w.label, mine: w.mine, question: w.question, plain: w.plain, detail: x.plain, why: x.why, imp: x.importance, inBundle: (bundles.find((b) => b.closes.some((c) => c.id === id)) || {}).n || null }; });
/* ── what each piece ADDS, and the effect of doing them one by one ── */
const FX = rd("gaps-endpoint.effects.raw.json").verified.pieces, PRISMS = rd("prisms-endpoint.json").blocks;
const prismNames = Object.values(PRISMS).map((b) => b.name), prismOfQ = new Map(); for (const [sig, b] of Object.entries(PRISMS)) for (const q of sig.split("+")) prismOfQ.set(q, b.name);
const fxBy = new Map(FX.map((x) => [x.key, x]));
for (const b of bundles) {
  const fx = fxBy.get(b.key) || die("no effects entry for the piece " + b.key);
  for (const p of fx.prisms) if (!prismNames.includes(p.name)) die(`${b.key}: unknown prism "${p.name}"`);
  for (const q of fx.questions) { if (!QT.has(q.id)) die(`${b.key}: unknown question ${q.id}`); if (q.needs && !bundles.some((x) => x.key === q.needs)) die(`${b.key}: ${q.id} needs an unknown piece "${q.needs}"`); }
  b.fx = { idea: fx.abstraction, prisms: fx.prisms, fields: fx.fields.map((f) => ({ name: f.name, parts: f.parts, status: f.status })), today: fx.today, rows: fx.after_rows,
    questions: fx.questions.map((q) => ({ id: q.id, text: QT.get(q.id), coverage: q.coverage, needs: q.needs ? bundles.find((x) => x.key === q.needs).n : null, why: q.why, prism: prismOfQ.get(q.id) })) };
}
if (fxBy.size !== bundles.length) die("effects entries for pieces that do not exist: " + [...fxBy.keys()].filter((k) => !bundles.some((b) => b.key === k)).join(", "));
/* a question is fully answerable after piece k when a piece ≤ k covers it in full, or when every piece that covers it by
   half — and every piece those halves say they need — is ≤ k. "elsewhere" never counts on this card. */
const QIDS = qs.map((q) => q.id), touch = new Map(QIDS.map((q) => [q, []]));
for (const b of bundles) for (const q of b.fx.questions) touch.get(q.id).push({ n: b.n, coverage: q.coverage, needs: q.needs });
const fullAt = (q) => { const t = touch.get(q); if (!t.length) return 0; const fulls = t.filter((x) => x.coverage === "full").map((x) => x.n), halves = t.filter((x) => x.coverage === "half");
  const viaHalves = halves.length ? Math.max(...halves.flatMap((x) => [x.n, x.needs || 0])) : Infinity; const at = Math.min(fulls.length ? Math.min(...fulls) : Infinity, halves.length >= 2 || halves.some((x) => x.needs) ? viaHalves : Infinity); return Number.isFinite(at) ? at : null; };
const questionsFx = QIDS.map((q) => ({ id: q, text: QT.get(q), prism: prismOfQ.get(q), fullAt: fullAt(q), elsewhere: touch.get(q).length > 0 && touch.get(q).every((x) => x.coverage === "elsewhere") }));
const running = [0].concat(bundles.map((b) => b.n)).map((k) => ({ after: k, full: questionsFx.filter((q) => q.fullAt !== null && q.fullAt <= k).map((q) => q.id) }));
const RANKC = { full: 3, half: 2, elsewhere: 1 };
const byPrism = prismNames.map((name) => ({ name, questions: QIDS.filter((q) => prismOfQ.get(q) === name), cells: bundles.map((b) => { const qs2 = b.fx.questions.filter((q) => q.prism === name), listed = b.fx.prisms.find((p) => p.name === name);
  const best = qs2.slice().sort((x, y) => RANKC[y.coverage] - RANKC[x.coverage])[0]; return best ? { n: b.n, mark: best.coverage, qs: qs2.map((q) => q.id), gains: listed ? listed.gains : "" } : listed ? { n: b.n, mark: "fact", qs: [], gains: listed.gains } : null; }) }));
const notHere = J.items.filter((x) => x.recommendation === "not-here").map((x) => ({ id: x.id, plain: x.plain }));

/* the wrong picture, from the lab's own facts */
global.window = {}; require(path.join(HERE, "../workflow-panel/_lab-ep.js")); const L = global.window.LABEP;
const drawn = (L.security.asgi || []).slice().sort((a, b) => a.order - b.order).map((m) => m.name.replace(/Middleware$/, ""));
const longest = L.forms.paths.slice().sort((a, b) => b.chain.length - a.chain.length)[0], runs = [];
for (const c of longest.chain) { const m = drawn.find((d) => new RegExp(d, "i").test((c.label || "") + " " + (c.at || "") + " " + (c.sub || ""))) || (c.at && /rate_limit/.test(c.at) ? drawn.find((d) => /rate/i.test(d)) : null); if (m && !runs.includes(m)) runs.push(m); }
if (runs.length !== drawn.length) die(`could not read the run order of the app-wide checks from the chain: ${runs.join(", ")} of ${drawn.join(", ")}`);
const wrong = Object.assign({}, W.wrong, { drawn, runs, isWrong: drawn.join("|") !== runs.join("|") });

const lastHours = bundles.filter((b) => b.effort === "inventory").length, at = (k) => running.find((r) => r.after === k).full.length;
const tok = { gainHours: at(lastHours) - at(0), gainRest: at(bundles.length) - at(lastHours), nRest: bundles.length - lastHours, nBundles: bundles.length, nHours: bundles.filter((b) => b.effort === "inventory").length, nKeep: attrs.filter((a) => a.mine === "keep").length, nDemote: attrs.filter((a) => a.mine === "demote").length, nDrop: attrs.filter((a) => a.mine === "drop").length };
const fill = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (k in tok ? tok[k] : die("no value for {" + k + "}")));
const data = { endpoint: `${L.identity.method} ${L.identity.path}`, oneByOne: { prisms: byPrism, running, questions: questionsFx, total: QIDS.length }, kind: "endpoint-card", hash: crypto.createHash("sha1").update(JSON.stringify(J)).digest("hex").slice(0, 8), first: J.first, bundles, attrs, notHere, wrong,
  effort: W.effort, ui: Object.fromEntries(Object.entries(W.ui).map(([k, v]) => [k, v.plain])), takes: Object.fromEntries(Object.entries(W.takes).map(([k, v]) => [k, v.map(fill)])),
  counts: { items: J.items.length, verified: J.items.filter((x) => x.verified).length, diagnostic: J.items.filter((x) => x.kind !== "analysis").length } };

const { kitBlocks, withoutMotion } = require("./kit-blocks.js"); let KIT; try { KIT = withoutMotion(kitBlocks(ROOT), ""); } catch (e) { die(e.message); }
let html = fs.readFileSync(path.join(HERE, "gaps.tpl.html"), "utf8");
for (const [mark, val] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", KIT.k2.trim()], ["<!--__KIT3__-->", KIT.k3], ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) { if (!html.includes(mark)) die("template marker missing: " + mark); html = html.split(mark).join(val); }
if (process.argv.includes("--check")) { const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html; console.log(ok ? "gaps-endpoint.html is current" : "gaps-endpoint.html is STALE — run gen-gaps.js"); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, html);
console.log(`gaps-endpoint.html · ${bundles.length} pieces of work (${tok.nHours} in hours) closing ${J.items.length} items · ${attrs.length} attributes to rule · the lab draws ${drawn.join(" → ")}, the route runs ${runs.join(" → ")} · ${html.length} bytes`);
