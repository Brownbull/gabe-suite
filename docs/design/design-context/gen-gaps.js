#!/usr/bin/env node
/* gen-gaps.js — the evaluation of what M1 left over, as a Gabe Artifact page the operator rules on.

     node docs/design/design-context/gen-gaps.js [--check]

   READS   gaps-endpoint.raw.json (six agent investigators + one agent judge; never hand-edited) · gaps-endpoint.words.json
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
const notHere = J.items.filter((x) => x.recommendation === "not-here").map((x) => ({ id: x.id, plain: x.plain }));

/* the wrong picture, from the lab's own facts */
global.window = {}; require(path.join(HERE, "../workflow-panel/_lab-ep.js")); const L = global.window.LABEP;
const drawn = (L.security.asgi || []).slice().sort((a, b) => a.order - b.order).map((m) => m.name.replace(/Middleware$/, ""));
const longest = L.forms.paths.slice().sort((a, b) => b.chain.length - a.chain.length)[0], runs = [];
for (const c of longest.chain) { const m = drawn.find((d) => new RegExp(d, "i").test((c.label || "") + " " + (c.at || "") + " " + (c.sub || ""))) || (c.at && /rate_limit/.test(c.at) ? drawn.find((d) => /rate/i.test(d)) : null); if (m && !runs.includes(m)) runs.push(m); }
if (runs.length !== drawn.length) die(`could not read the run order of the app-wide checks from the chain: ${runs.join(", ")} of ${drawn.join(", ")}`);
const wrong = Object.assign({}, W.wrong, { drawn, runs, isWrong: drawn.join("|") !== runs.join("|") });

const tok = { nBundles: bundles.length, nHours: bundles.filter((b) => b.effort === "inventory").length, nKeep: attrs.filter((a) => a.mine === "keep").length, nDemote: attrs.filter((a) => a.mine === "demote").length, nDrop: attrs.filter((a) => a.mine === "drop").length };
const fill = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (k in tok ? tok[k] : die("no value for {" + k + "}")));
const data = { kind: "endpoint-card", hash: crypto.createHash("sha1").update(JSON.stringify(J)).digest("hex").slice(0, 8), first: J.first, bundles, attrs, notHere, wrong,
  effort: W.effort, ui: Object.fromEntries(Object.entries(W.ui).map(([k, v]) => [k, v.plain])), takes: Object.fromEntries(Object.entries(W.takes).map(([k, v]) => [k, v.map(fill)])),
  counts: { items: J.items.length, verified: J.items.filter((x) => x.verified).length, diagnostic: J.items.filter((x) => x.kind !== "analysis").length } };

const { kitBlocks, withoutMotion } = require("./kit-blocks.js"); let KIT; try { KIT = withoutMotion(kitBlocks(ROOT), ""); } catch (e) { die(e.message); }
let html = fs.readFileSync(path.join(HERE, "gaps.tpl.html"), "utf8");
for (const [mark, val] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", KIT.k2.trim()], ["<!--__KIT3__-->", KIT.k3], ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) { if (!html.includes(mark)) die("template marker missing: " + mark); html = html.split(mark).join(val); }
if (process.argv.includes("--check")) { const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html; console.log(ok ? "gaps-endpoint.html is current" : "gaps-endpoint.html is STALE — run gen-gaps.js"); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, html);
console.log(`gaps-endpoint.html · ${bundles.length} pieces of work (${tok.nHours} in hours) closing ${J.items.length} items · ${attrs.length} attributes to rule · the lab draws ${drawn.join(" → ")}, the route runs ${runs.join(" → ")} · ${html.length} bytes`);
