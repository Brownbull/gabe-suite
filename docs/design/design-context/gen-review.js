#!/usr/bin/env node
/* gen-review.js — the review of the leftovers program, as a Gabe Artifact page the operator rules on.

     node docs/design/design-context/gen-review.js [--check]

   READS   review.words.json (authored lines, plain-audited) · ../workflow-panel/_lab-ep.js (the lab's facts) · ../workflow-panel/_lab-ep-panels.js
           (the 36 stage norms and the four test-role words, lifted from the code that draws them — never retyped) · ../workflow-panel/pieces-digest.json ·
           ../element-forms/plans/*.plan.json (the two designs) · gaps-endpoint.effects.raw.json · inventory-endpoint.md ·
           review-shots/*.png + clicks.json (lab pictures taken with real clicks by shoot-review.mjs) · the kit · review.tpl.html
   WRITES  review-leftovers.html
   No wallclock: same inputs, same bytes. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HERE = __dirname, ROOT = path.resolve(HERE, "../../.."), WP = path.join(HERE, "../workflow-panel"), OUT = path.join(HERE, "review-leftovers.html");
const die = (m) => { console.error("gen-review: " + m); process.exit(2); };
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const W = rd(path.join(HERE, "review.words.json"));
global.window = {}; require(path.join(WP, "_lab-ep.js")); const L = global.window.LABEP, f = L.forms;
/* a literal lifted out of the lab's code, by its declaration — the page shows the words the lab really draws */
const panels = fs.readFileSync(path.join(WP, "_lab-ep-panels.js"), "utf8");
function lift(decl) { const i = panels.indexOf(decl); if (i < 0) die("the lab no longer declares `" + decl + "`"); let j = panels.indexOf("{", i), d = 0, k = j;
  for (; k < panels.length; k++) { if (panels[k] === "{") d++; else if (panels[k] === "}") { d--; if (!d) break; } } return (0, eval)("(" + panels.slice(j, k + 1) + ")"); }
const NORMS = lift("var STAGE_EXPECT = window.STAGE_EXPECT = "), ROLEWORD = lift("var ROLEWORD = ");
const drawnTopic = (t) => new RegExp("STAGE_EXPECT\\." + t + "\\b").test(panels);   /* a topic is drawn only when some code reads its lines */
const norms = []; for (const t of Object.keys(NORMS)) { if (!W.topics[t]) die("no word for the topic " + t); for (const st of Object.keys(NORMS[t])) { const id = t + "." + st;
  norms.push({ id, topic: t, drawn: drawnTopic(t), topicWord: W.topics[t], partWord: (W.parts || {})[t] || die("no part name for the topic " + t), stage: st, line: NORMS[t][st], doubt: W.norm_doubts[id] || null, mine: W.norm_doubts[id] ? "reword" : "ok", old: /\b(door|lock)\b/.test(NORMS[t][st]) }); } }
for (const k of Object.keys(W.norm_doubts)) if (!norms.some((n) => n.id === k)) die("a doubt names a line that no longer exists: " + k);

/* how many DRAWN strings outside the 36 lines still say door or lock — quoted strings only, comments stripped */
function oldWordStrings(src) { const s = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1"); let n = 0;
  for (const m of s.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)) if (/\b(doors?|lock)\b/.test(m[0])) n++; return n; }
const normStart = panels.indexOf("var STAGE_EXPECT = window.STAGE_EXPECT = "), normEnd = (() => { let jx = panels.indexOf("{", normStart), dd = 0, k = jx; for (; k < panels.length; k++) { if (panels[k] === "{") dd++; else if (panels[k] === "}") { dd--; if (!dd) break; } } return k + 1; })();
const doorElsewhere = oldWordStrings(panels.slice(0, normStart) + panels.slice(normEnd)) + oldWordStrings(fs.readFileSync(path.join(WP, "endpoint-lab.html"), "utf8"));
const slotFn = (() => { const a = panels.indexOf("function slotWhy("), b = panels.indexOf("window.slotState = slotState", a); if (a < 0 || b < 0) die("the lab no longer declares slotWhy"); return panels.slice(a, b); })();
const slotWords = [...slotFn.matchAll(/"((?:[^"\\]|\\.){18,})"/g)].map((m) => (/^\s/.test(m[1]) ? "the …" + m[1] : m[1]));   /* a sentence built around the reading's name keeps its gap */ if (slotWords.length < 3) die("could not lift the slot sentences out of slotWhy");

/* ── the facts beside each rule, from the lab and the committed digest ── */
const DG = rd(path.join(WP, "pieces-digest.json")).apps, P = L.feedwide.pieces, app = DG[P.app] || die("the digest holds no app " + P.app);
const wordAt = (n, of, hi, lo) => (n <= 1 ? "only here" : n / of >= hi ? "the norm" : n / of <= lo ? "rare" : "common");
const tally = (hi, lo) => { const here = {}, all = {}; for (const r of P.rows) { const w = wordAt(r.n, r.of, hi, lo); here[w] = (here[w] || 0) + 1; }
  for (const k of Object.keys(app.pieces)) { const w = wordAt(app.pieces[k], app.endpoints, hi, lo); all[w] = (all[w] || 0) + 1; } return { here, all }; };
const moved = P.rows.filter((r) => wordAt(r.n, r.of, 0.9, 0.1) !== wordAt(r.n, r.of, 0.8, 0.2)).map((r) => ({ words: r.words, n: r.n, of: r.of, from: wordAt(r.n, r.of, 0.9, 0.1), to: wordAt(r.n, r.of, 0.8, 0.2) }));
const gsigHas = (name) => String(L.identity.gsig || "").includes(name + ")");
const D = L.functions.does, inside = new Map(((f.inside || {}).functions || []).map((x) => [x.fn, x]));
const onlyRaise = D.rows.filter((r) => (r.why["decides an ending"] || []).join("|") === "raises or refuses");
const answered = (r) => { const x = inside.get(r.fn); return !!x && (x.refusals.length > 0 || x.raises.some((q) => q.here_word === "translated")); };
const two = (rows) => rows.filter((r) => r.does.length >= 2).map((r) => r.name);
const without = (drop) => D.rows.map((r) => (drop(r) ? Object.assign({}, r, { does: r.does.filter((w) => w !== "decides an ending") }) : r));
const FACTS = {
  thresholds: { of: P.of, app: P.app, keys: Object.keys(app.pieces).length, a: tally(0.9, 0.1), b: tally(0.8, 0.2), moved },
  roles: { of: D.of, helperOnly: D.rows.filter((r) => (r.why["decides an ending"] || []).join("|") === "can end the request").map((r) => r.name), now: two(D.rows), onlyRaise: onlyRaise.map((r) => r.name), ifAnswered: two(without((r) => onlyRaise.includes(r) && !answered(r))), ifNever: two(without((r) => onlyRaise.includes(r))), rule: D.rule },
  through: { name: f.through.name, passed: f.through.passed, checks: f.through.checks, others: f.through.others, rule: f.through.rule, tie: f.through.others.filter((o) => o.passed === f.through.passed).map((o) => o.name) },
  caseroles: (() => { for (const k of Object.keys(L.tests.roles)) if (!ROLEWORD[k]) die("the lab has no words for the test role " + k); return Object.keys(ROLEWORD).map((k) => ({ role: k, words: ROLEWORD[k], n: L.tests.roles[k] || 0 })); })(),
  deporder: { rows: (L.security.resolution.rows || []).map((r) => ({ order: r.order, name: r.name, asked_by: r.asked_by, guessed: r.asked_by.includes("the handler") && !gsigHas(r.name) })),   /* only the handler's OWN helpers are placed by its signature; a helper's helpers come in the feed's own order */ clipped: /…$/.test(String(L.identity.gsig || "")), rule: L.security.resolution.rule },
  slotwords: slotWords,
  afterhandler: (L.security.resolution.rows || []).filter((r) => r.runs_after_the_handler).map((r) => ({ name: r.name, n: r.applies_to, of: r.endpoints })),
};
const PLAN10 = rd(path.join(HERE, "../element-forms/plans/slice-11e-does.plan.json")).plan, PLAN11 = rd(path.join(HERE, "../element-forms/plans/kinds-inflight.plan.json")).plan;
const listIn = (txt, rx, what) => { const m = rx.exec(txt); if (!m) die("the plan no longer carries " + what); return m[1].split(/[,·]/).map((s) => s.replace(/["'`\s]/g, "")).filter(Boolean); };
const classes = listIn(PLAN10.rosters, /DOES_CLASSES = \(([^)]*)\)/, "DOES_CLASSES"), states = listIn(PLAN10.rosters, /DOES_STATES = \(([^)]*)\)/, "DOES_STATES"), kinds = listIn(PLAN11.schema, /`kind` \(([^)]*)\)/, "the row kinds");
const worded = (list, dict, what) => list.map((k) => ({ k, plain: (dict[k] || die(`no plain line for the ${what} "${k}" — add it to review.words.json`)).plain }));
const ex = /```json\n([\s\S]*?)```/.exec(PLAN10.schema) || die("the plan's worked example is gone");
const FX = rd(path.join(HERE, "gaps-endpoint.effects.raw.json")).verified.pieces.find((x) => x.key === "alive-during-the-request") || die("no effects entry for piece 11");
const runs10 = PLAN10.landing_order.map((s, i) => { const m = /COST:\s*([^]*?)(?:\s+PASS\b|$)/.exec(s); return m && /\bmin/.test(m[1]) ? { step: i, cost: m[1].trim().replace(/\s+/g, " ").slice(0, 150) } : null; }).filter(Boolean);
FACTS.p10 = { runs: runs10, example: ex[1].trim(), predicted: /predicted from source/i.test(PLAN10.schema), classes: worded(classes, W.classes, "class"), states: worded(states, W.states, "state word"), steps: PLAN10.landing_order.length, risks: PLAN10.risks.length };
const steps11 = PLAN11.landing_order.map((s, i) => { const m = /\((~[^)]*?\b(?:days?|h)\b[^)]*)\)/.exec(s), name = /^\s*\d+\s*·\s*([^,(:—]+)/.exec(s); return m ? { step: i, name: name ? name[1].trim().slice(0, 40) : "step " + i, cost: m[1].replace(/^~/, "about ") } : null; }).filter(Boolean);
FACTS.p11 = { stepsCost: steps11, today: FX.after_rows.filter((r) => !/^would say:/i.test(r)), after: FX.after_rows.filter((r) => /^would say:/i.test(r)).map((r) => r.replace(/^would say:\s*/i, "")), kinds: worded(kinds, W.kinds11, "row kind"), steps: PLAN11.landing_order.length, risks: PLAN11.risks.length };

/* ── pictures: committed inputs, taken with real clicks ── */
const SH = path.join(HERE, "review-shots"), clicks = rd(path.join(SH, "clicks.json"));
if (!clicks.pathByClick || clicks.pathByCall) die("the pictures were not taken with real clicks on the command panel's path cells — re-run shoot-review.mjs");
const png = (n) => { const p = path.join(SH, n + ".png"); if (!fs.existsSync(p)) die("missing picture " + n + ".png — run shoot-review.mjs"); return "data:image/png;base64," + fs.readFileSync(p).toString("base64"); };
/* numbers inside an authored sentence are tokens the facts fill — a sentence never carries a typed count */
const thr = f.paths.find((x) => x.id === f.through.id), opener = thr.chain.find((c) => (c.kind === "call" || c.kind === "collapsed") && ((f.inside.calls[c.fn] || {}).opens || []).length) || die("no call on the through-route opens");
const nIn = f.inside.calls[opener.fn].n, ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const invRow = /(\d+) of (\d+) endpoints have client code that reads their failures/.exec(fs.readFileSync(path.join(HERE, "inventory-endpoint.md"), "utf8")) || die("the inventory no longer carries the measured client row");
const routeOnlyT = L.data.tables.filter((t) => t.found === "route effects").map((t) => t.table), top = String(L.context.risk.behind_max_of || ""), topIsEndpoint = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /.test(top);
const kindsIn = (n) => { const parts = [[n.raises, "failure"], [n.refusals, "refusal"], [n.commits, "save"], [n.savepoints, "savepoint"], [n.swallows, "swallowed failure"]].filter((x) => x[0]).map((x) => x[0] + " " + x[1] + (x[0] === 1 ? "" : "s")); return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts.join(""); };
const TOK = { doorElsewhere, loginCheck: (JSON.stringify(L).match(/login check/g) || []).length, feReaders: invRow[1], appEndpoints: L.feedwide.forms_endpoints, routeOnlyNames: routeOnlyT.join(" and "),
  placeTop: top, placeEp: ord(L.context.risk.rank - (topIsEndpoint ? 0 : 1)), roleWords: Object.keys(ROLEWORD).length, rolesHere: Object.keys(ROLEWORD).filter((k) => L.tests.roles[k]).length, insideKinds: "PLACEHOLDER", norms: norms.length, oldWords: norms.filter((n) => n.old).length, routeOnly: (f.counts.tables_found || {})["route effects"] || 0, tables: L.data.tables.length, callName: opener.label, callStep: opener.i,
  insideRows: nIn.raises + nIn.refusals + nIn.commits + nIn.savepoints + nIn.swallows, place: ord(L.context.risk.rank), placeOf: L.context.risk.of };
TOK.insideKinds = kindsIn(nIn);
{ const T = FACTS.thresholds, R = FACTS.roles, files = [...new Set([...PLAN10.code_plan.matchAll(/^\*\*\d+[a-z]?\. `(_a3_\w+\.py)/gm)].map((m) => m[1]))];
  if (!files.length) die("the plan's code plan no longer names its generator files");
  Object.assign(TOK, { doorTotal: doorElsewhere + norms.filter((n) => n.old).length, movedHere: T.moved.length, normMore: (T.b.all["the norm"] || 0) - (T.a.all["the norm"] || 0), rareMore: (T.b.all.rare || 0) - (T.a.all.rare || 0),
    movedWords: T.moved.length === 0 ? "No piece of this endpoint changes word" : T.moved.length === 1 ? "1 piece of this endpoint changes word" : T.moved.length + " pieces of this endpoint change word",
    appWordsShift: (() => { const n = (T.b.all["the norm"] || 0) - (T.a.all["the norm"] || 0), r = (T.b.all.rare || 0) - (T.a.all.rare || 0), say = (x) => (x > 0 ? x + " more" : "no more"); return "Across the app " + say(n) + " kinds of piece read the norm and " + say(r) + " read rare"; })(),
    neverHere: R.ifNever.join("|") === R.ifAnswered.join("|") ? "Here the list is the same as the option above." : "Here " + R.ifNever.length + " functions then hold two roles.",
    twoNow: R.now.length, twoAnswered: R.ifAnswered.length, onlyRaise: R.onlyRaise.join(" and ") || "no function", guessed: FACTS.deporder.rows.filter((r) => r.guessed).map((r) => r.name).join(" and ") || "no helper", p10files: files.length }); } if (String(invRow[2]) !== String(L.feedwide.forms_endpoints)) die("the inventory and the lab disagree on how many endpoints the app has");
const fill = (s) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in TOK ? TOK[k] : die("no value for the token {" + k + "}")));
const decisions = W.decisions.map((d0) => { const d = Object.assign({}, d0, { what: fill(d0.what), why: fill(d0.why), where: d0.where.map(fill) });
  for (const o of d0.options) { const im = (d0.impacts || {})[o[0]]; if (!im || !W.sizes[im.size]) die(`${d0.id}: the option "${o[0]}" says nothing about what it sets in motion`); }
  d.impacts = Object.fromEntries(Object.entries(d0.impacts).map(([k, v]) => [k, { size: v.size, does: fill(v.does) }])); if (d.facts && !FACTS[d.facts]) die(`${d.id}: no facts named ${d.facts}`); if (!d.options.some((o) => o[0] === d.mine)) die(`${d.id}: my pick "${d.mine}" is not one of its options`);
  return Object.assign({}, d, { facts: d.facts ? { key: d.facts, v: FACTS[d.facts] } : null, shot: d.shot ? png(d.shot) : null, shot2: d.shot2 ? png(d.shot2) : null }); });
if (new Set(decisions.map((d) => d.id)).size !== decisions.length) die("two decisions share an id");
const inv = fs.readFileSync(path.join(HERE, "inventory-endpoint.md"), "utf8"), proposed = inv.split("\n").filter((l) => /^\|/.test(l) && /\(proposed\)/.test(l)).length;
const text = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.text]));
const liveN = (k) => W.decisions.filter((x) => x.live === k).length; for (const x of W.decisions) if (!W.live_words[x.live]) die(x.id + ": no word for live = " + x.live);
Object.assign(TOK, { liveWorth: liveN("worth"), liveOptional: liveN("optional"), liveNone: liveN("none"), topicsN: Object.keys(NORMS).length, drawnTopics: Object.keys(NORMS).filter(drawnTopic).length });
const uiText = Object.fromEntries(Object.entries(text(W.ui)).map(([k, v]) => [k, fill(v)]));
const data = { kind: "leftovers-review", drawnWords: W.drawn_words, liveWords: W.live_words, sizes: W.sizes, normImpacts: W.norm_impacts, endpoint: `${L.identity.method} ${L.identity.path}`, head: L.head, ui: uiText, checked: W.facts_checked, norms, decisions,
  map: { img: png("lab-map"), regions: clicks.regions }, ratings: { proposed, url: "https://claude.ai/artifact/B9RnoRC3JV993XZYtAb9fJ" },
  hash: crypto.createHash("sha1").update(JSON.stringify([norms.map((n) => [n.id, n.line]), W.decisions.map((d) => [d.id, d.options, d.mine])])).digest("hex").slice(0, 8) };

const { kitBlocks, withoutMotion } = require("./kit-blocks.js"); let KIT; try { KIT = withoutMotion(kitBlocks(ROOT), ""); } catch (e) { die(e.message); }
let html = fs.readFileSync(path.join(HERE, "review.tpl.html"), "utf8");
for (const [mark, val] of [["<!--__KIT1__-->", KIT.k1], ["<!--__KIT2__-->", KIT.k2.trim()], ["<!--__KIT3__-->", KIT.k3], ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) { if (!html.includes(mark)) die("template marker missing: " + mark); html = html.replace(mark, () => val); }
if (process.argv.includes("--check")) { const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html; console.log(ok ? "review-leftovers.html is current" : "review-leftovers.html is STALE — run gen-review.js"); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, html);
console.log(`review-leftovers.html · ${norms.length} norm lines (${norms.filter((n) => n.mine !== "ok").length} I doubt · ${norms.filter((n) => n.old).length} say door or lock) · ${decisions.length} decisions in ${new Set(decisions.map((d) => d.step)).size} steps · ${proposed} rows to rate · review ${data.hash} · ${html.length} bytes`);
