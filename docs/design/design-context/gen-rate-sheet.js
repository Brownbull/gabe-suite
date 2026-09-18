#!/usr/bin/env node
/* gen-rate-sheet.js — the rating sheet for one inventory, as a Gabe Artifact page.

     node docs/design/design-context/gen-rate-sheet.js            # inventory-endpoint.md → rate-endpoint.html
     node docs/design/design-context/gen-rate-sheet.js --check    # exit 1 when the committed page is stale

   READS   inventory-endpoint.md      the record: sections, attributes, my proposed rating + why (never edited here)
           rate-sheet.words.json      authored plain lines, keyed by row slug (checked by ../workflow-panel/plain-audit.py)
           ../workflow-panel/_lab-ep.js   the lab's GENERATED facts — every example under a row is computed from it, never typed
           skills/gabe-artifact/assets/artifact-chrome.html   the kit: its three blocks are pasted verbatim
           rate-sheet.tpl.html        the page's own CSS, markup and script
   WRITES  rate-endpoint.html
   No wallclock: the same inputs give the same bytes. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HERE = __dirname, ROOT = path.resolve(HERE, "../../..");
const INV = path.join(HERE, "inventory-endpoint.md"), OUT = path.join(HERE, "rate-endpoint.html");
const KIND = "endpoint-card";
const die = (m) => { console.error("gen-rate-sheet: " + m); process.exit(2); };

/* ── 1 · the inventory ─────────────────────────────────────────────────── */
const md = fs.readFileSync(INV, "utf8");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const unbold = (s) => s.replace(/\*\*/g, "").trim();
const sections = [];
let cur = null;
for (const line of md.split("\n")) {
  const h = line.match(/^## (.+)$/);
  if (h) { cur = /^The face/.test(h[1]) ? null : { title: h[1].trim(), rows: [] }; if (cur) sections.push(cur); continue; }
  if (!cur || !line.startsWith("|") || /^\|\s*-{3}/.test(line) || /^\|\s*attribute\s*\|/.test(line)) continue;
  const cells = line.split("|").slice(1).map((c) => c.trim());
  while (cells.length && cells[cells.length - 1] === "") cells.pop();
  if (cells.length !== 8) die(`row with ${cells.length} cells, expected 8: ${line.slice(0, 80)}`);
  const [name, type, card, imp, why, vol, rel, first] = cells;
  const label0 = name.split(" (")[0].trim(), sub = (name.match(/\((.+)\)\s*$/) || [])[1] || null;
  const gapM = first.match(/\*\*(.+?)\*\*/) || type.match(/\*\*(.+?)\*\*/);
  cur.rows.push({
    id: slug(label0), label: label0.charAt(0).toUpperCase() + label0.slice(1), sub,
    type: unbold(type), cardFull: unbold(card), why: unbold(why), volatile: unbold(vol), rel: unbold(rel),
    first: unbold(first.replace(/\s*[—,]\s*\*\*.+?\*\*\s*$/, "")).replace(/\bfar\b/, "far (the face)"), gap: gapM ? unbold(gapM[1]).replace(/^feed gap:\s*/, "") : null,
    mine: proposal(imp),
  });
}
function proposal(cell) {                       /* "**3** if uncaught, else 1" → base 1 + alert · "alarm channel only" → base 1 + alert */
  const raw = unbold(cell).replace(/\s+/g, " "), nums = (raw.match(/[123]/g) || []).map(Number), els = raw.match(/else ([123])/);
  let base, alarm;
  if (els) { base = Number(els[1]); alarm = true; }
  else if (nums.length >= 2) { base = nums[0]; alarm = true; }
  else if (nums.length === 1) { base = nums[0]; alarm = /alarm|alert/i.test(raw); }
  else { base = 1; alarm = true; }
  return { base, alarm, raw };
}
const rows = sections.flatMap((s) => s.rows);
if (rows.length < 10) die("the inventory parsed to " + rows.length + " rows");
const dup = rows.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dup.length) die("duplicate slugs: " + dup.join(", "));

/* ── 2 · the words ─────────────────────────────────────────────────────── */
const W = JSON.parse(fs.readFileSync(path.join(HERE, "rate-sheet.words.json"), "utf8"));
for (const s of sections) {
  const w = W.sections[s.title]; if (!w) die("no words for section: " + s.title);
  s.short = w.short || s.title; s.icon = w.icon; s.plain = w.plain; s.slug = slug(s.short);
}
for (const r of rows) { const w = W.rows[r.id]; if (!w) die("no plain line for row: " + r.id); r.plain = w.plain; }
const orphan = Object.keys(W.rows).filter((id) => !rows.some((r) => r.id === id));
if (orphan.length) die("words with no inventory row: " + orphan.join(", "));

/* ── 3 · the examples, computed from the lab's generated facts ─────────── */
global.window = {}; require(path.join(HERE, "../workflow-panel/_lab-ep.js"));
const L = global.window.LABEP, f = L.forms, I = L.identity;
if (!f || f.state !== "present") die("the lab facts carry no forms slice");
const q = (s) => "“" + s + "”", list = (a, n) => a.slice(0, n).join(", ") + (a.length > n ? ` and ${a.length - n} more` : "");
const STAGE = { middleware: "EDGE", security: "GATE", dependency: "GATE", "body-parse": "INPUT", validation: "INPUT", handler: "HANDLER", uncaught: "UNCAUGHT" };
const stageOf = (p) => (p.kind === "success" ? "ANSWER" : STAGE[p.phase] || p.phase);
const steps = (p) => (p.effects && p.effects.steps) || [];
const tables = {}; f.paths.forEach((p) => steps(p).forEach((s) => { if (s.table) { (tables[s.table] = tables[s.table] || new Set()).add(s.op); } }));
const dbFns = [...new Set(f.paths.flatMap((p) => steps(p).map((s) => s.fn).filter(Boolean)).map((x) => x.split("::")[1]))];
const tested = f.paths.filter((p) => (p.tests || []).length > 0);
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
const EX = {
  "method-path": () => `${I.method} ${I.path}`,
  "entity-cluster": () => `entity ${I.entity} · URL group ${I.cluster}`,
  "declared-status": () => `${f.declared.success.status}${f.declared.success.state === "default" ? ", the framework default" : ""} · ${f.declared.refusals.length ? plural(f.declared.refusals.length, "refusal") + " declared" : "no refusal is declared"}`,
  "file-line": () => `${I.file}:${f.endpoint.line}`,
  "risk-flag": () => (I.risk.large || I.risk.god ? `flagged ${I.risk.conflict} · ${I.risk.behind} functions sit behind the handler` : "no flag on this endpoint"),
  "signature": () => `${I.sig.async ? "async" : "sync"} · ${I.sig.lines} lines · returns ${I.sig.returns}`,
  "usage-fan-in": () => `fan-in ${I.fanin} · ${plural(I.usage.api, "caller")} from the API side, ${I.usage.internal} internal`,

  "kinds-of-ending": () => ["success", "refusal", "framework", "validation", "uncaught"].filter((k) => f.counts.by_kind[k]).map((k) => `${k} ${f.counts.by_kind[k]}`).join(" · "),
  "the-endings": () => { const names = f.paths.filter((p) => p.phase === "handler").map((p) => q(p.names.drawn)).slice(0, 4); return `${f.paths.length} endings · among them ${names.join(", ")} and ${f.paths.length - names.length} more`; },
  "the-stage-an-ending-leaves-from": () => { const c = {}; f.paths.forEach((p) => { const s = stageOf(p); c[s] = (c[s] || 0) + 1; }); return ["EDGE", "GATE", "INPUT", "HANDLER", "ANSWER", "UNCAUGHT"].filter((s) => c[s]).map((s) => `${s} ${c[s]}`).join(" · "); },
  "status-code-per-ending": () => Object.keys(f.counts.by_status).sort().map((s) => `${s} ×${f.counts.by_status[s]}`).join(" · "),
  "own-guards": () => `${plural(f.preconditions.length, "guard")} · ${q(f.preconditions[0].pred)} ends ${f.preconditions[0].status}`,
  "deciding-branches": () => `${plural(f.branches.length, "branch").replace("branchs", "branches")} inside ${f.branches[0].call} · ${f.branches.map((b) => b.token).join(" · ")}`,
  "catches": () => { const c = f.failure.catches[0]; return `${plural(f.failure.catches.length, "catch").replace("catchs", "catches")} · ${c.types.join(", ")} ${c.outcome === "translate" ? "becomes a " + c.answers.join("/") : "is " + c.outcome}`; },
  "switches": () => `${plural(f.switches.length, "switch").replace("switchs", "switches")} · ` + f.switches.map((s) => `${s.kind} ${s.port || (s.branches && s.branches[0] && s.branches[0].setting) || (s.settings && Object.keys(s.settings).join(" + ")) || "?"}`).join(" · "),
  "steps-in-the-longest-chain": () => { const p = f.paths.slice().sort((a, b) => b.chain.length - a.chain.length)[0]; if (p.chain.length !== f.counts.steps_max) die("steps_max disagrees with the longest chain"); return `${p.chain.length} steps on ${q(p.names.drawn)} (${p.status})`; },

  "tables-touched": () => `${Object.keys(tables).length} tables across all endings` + (L.data.tables.length !== Object.keys(tables).length ? ` · the Data panel draws ${L.data.tables.length} of them` : ""),
  "operation-per-table": () => { const ro = Object.keys(tables).filter((t) => [...tables[t]].every((o) => o === "read")); return `read only: ${ro.join(", ") || "none"} · written: ${Object.keys(tables).length - ro.length} tables`; },
  "fate-of-the-writes-per-ending": () => { const p = f.paths.find((x) => steps(x).some((s) => s.bucket === "rolled_back")); if (!p) return null; const b = {}; steps(p).forEach((s) => { if (s.bucket) b[s.bucket] = (b[s.bucket] || 0) + 1; }); return `on ${q(p.names.drawn)} (${p.status}) · ` + Object.keys(b).map((k) => `${b[k]} ${k.replace("_", " ")}`).join(" · "); },
  "the-moment-a-table-is-touched": () => { const p = f.paths.slice().sort((a, b) => steps(b).length - steps(a).length)[0], s = steps(p)[0]; const verb = { read: "is read", add: "gets a new row", update: "is updated", delete: "loses a row" }[s.op] || s.op; return `${s.table} ${verb} first, in ${s.fn.split("::")[1]}` + (s.dependency ? ", at the GATE before the handler runs" : ""); },
  "provisions": () => { const p = f.auth.provisions[0]; return p ? `a ${p.table} row is ${p.op === "add" ? "added" : p.op} at the gate and ${p.state}` : null; },
  "race-on-a-unique-key": () => {                     /* every race the steps carry — the idempotency claim alone is the one HANDLED race */
    const seen = new Map(); f.paths.forEach((p) => steps(p).forEach((s) => { if (s.race) seen.set(s.table + "|" + JSON.stringify(s.race.keys), { table: s.table, state: s.race.state }); }));
    if (!seen.size) return null;
    const all = [...seen.values()], un = all.filter((x) => x.state === "uncaught"), ok = all.filter((x) => x.state !== "uncaught");
    return (un.length ? `${plural(un.length, "uncaught race")} · on ${list(un.map((x) => x.table), 2)}` : "no uncaught race") + (ok.length ? ` · ${ok.map((x) => x.table).join(", ")} is ${ok[0].state}` : ""); },
  "idempotency-claim": () => (f.repeat.key ? `${f.repeat.key.name} ${f.repeat.key.carrier}` + (f.repeat.required ? ` · required, a missing key ends ${f.repeat.required.status}` : "") : null),

  "request-scoped-state": () => (f.repeat.key && f.repeat.key.through ? `${f.repeat.key.through} is set by middleware and read by the handler` : null),
  "client-cache-effects": () => { const c = f.frontend.hook && f.frontend.hook.calls[0]; if (!c) return null; const k = (a) => a.map((x) => q(x.key.join("/"))).join(", "); return `on success · seeds ${k(c.seeds)} · invalidates ${k(c.invalidates)}`; },

  "request-shape": () => { const r = L.data.schemas.request; return r && r.present ? `${r.name} · ${r.cols.length + (r.cols_more || 0)} fields` : null; },
  "response-shape-per-ending": () => { const v = Object.values(f.responses), m = v.find((r) => r.model); return `${m.model} with ${m.fields.length} fields on the ${m.status} · ${v.filter((r) => !r.model && r.body && r.body.detail).length} other endings answer with a detail`; },
  "validation-cases": () => { const e = f.exits.find((x) => x.kind === "validation"); return e ? `${plural(e.tests.length, "test")} prove a ${e.status} · ${e.tests.map((t) => t.case).join(", ")} · the rules themselves are not in the lab's facts yet` : null; },

  "the-handler": () => `${L.functions.handler.name} · ${L.functions.handler.async ? "async" : "sync"}, ${L.functions.handler.lines} lines, returns ${L.functions.handler.returns}`,
  "decision-point-functions": () => `${f.branches[0].call} · ${f.branches.length} of its branches change the ending (${f.branches.map((b) => b.token).join(" · ")})`,
  "data-touching-functions": () => `${dbFns.length} functions touch the database · among them ${list(dbFns, 3)}`,
  "context-giving-functions": () => `${f.auth.gates.map((g) => g.name).join(", ")} · runs at the gate, before the handler`,
  "little-helpers-with-a-type": () => null,
  "functions-behind-walk-levels": () => `${L.functions.handler.behind.fns} functions behind the handler · the call walk reaches ${L.functions.walk_total}, ${L.functions.walk_levels.length} levels deep (${L.functions.walk_levels.join(" · ")})`,

  "coverage-per-condition": () => `${tested.length} of ${f.paths.length} endings have a test · none on ${list(f.paths.filter((p) => !(p.tests || []).length).map((p) => q(p.names.drawn)), 3)}`,
  "cases": () => `${L.tests.cases.length + (L.tests.cases_more || 0)} cases · ` + Object.keys(L.tests.by_state).map((k) => `${L.tests.by_state[k]} ${k}`).join(" · "),
  "journeys-workflow-step": () => { const w = L.tests.workflows[0]; return w ? `step ${w.step_index[0] + 1} of ${w.steps.length} in ${q(w.name)}` : null; },
  "auth-scheme-gate": () => { const s = f.auth.schemes[0]; return s ? `${s.scheme} on the ${s.header} ${s.carrier} · checked by ${f.auth.gates.map((g) => g.name).join(", ")}` : null; },
  "rate-limit": () => f.rate.limits.map((l) => { const a = Object.fromEntries(l.args.map((x) => [x.param, x.value])); return `${a.limit} per ${a.window_seconds} s (${l.limiter.replace(/^_/, "")})`; }).join(" · "),
  "app-band": () => `${L.security.app_middleware.count} middleware · the same on all ${L.security.app_middleware.gates_endpoints} endpoints`,
  "who-fetches-it": () => `${f.frontend.hook.piece.split("#")[1]} → ${list(Object.keys(f.frontend.screens).map((k) => k.split("#")[1]), 3)}`,
  "can-the-client-tell-the-endings-apart": () => { const x = (f.frontend.findings || []).find((y) => y.id === "reason-collapsed"); return x ? `two ${x.status}s, ${x.details.map(q).join(" and ")}, reach one branch in ${x.at.split("/").pop().split(":")[0]}` : "no collapsed reason on this endpoint"; },
  "findings": () => {
    const FIND = { "text-only": (x) => `${plural(x.n, "refusal")} told apart only by the message`, "shared-status": (x) => `two refusals share the ${x.status}`, "undeclared": (x) => `undeclared statuses ${x.statuses.join(", ")}`, "refusal-writes": () => "a refusal that still writes" };
    const rawF = (x) => x.id + (x.n ? " ×" + x.n : x.status ? " " + x.status : x.statuses ? " " + x.statuses.join(", ") : "");
    const allF = f.findings.concat(Object.values(f.arm_findings).flat());
    return `${plural(allF.length, "finding")} · ` + allF.map((x) => (FIND[x.id] || rawF)(x)).join(" · "); },
};
const NONE = { "little-helpers-with-a-type": "none to show · helper functions carry no type in the feed yet" };
for (const r of rows) {
  if (!(r.id in EX)) die("no example rule for row: " + r.id);
  let v = null; try { v = EX[r.id](); } catch (e) { die(`example for ${r.id} failed: ${e.message}`); }
  r.example = v || NONE[r.id] || "nothing to show on this endpoint"; r.exampleNone = !v;
  const three = r.cardFull.match(/(?:^|\s)(\d+(?:\.\d+)?) · (\d+(?:\.\d+)?) · (\d+(?:\.\d+)?)(?=\s|$)/);
  r.card3 = !!three; r.card = three ? three.slice(1).join(" · ") : null;
}

/* ── 4 · the kit, verbatim ─────────────────────────────────────────────── */
const kit = fs.readFileSync(path.join(ROOT, "skills/gabe-artifact/assets/artifact-chrome.html"), "utf8");
const cut = (block, from, to) => {                      /* a block starts at its `<!-- ══ BLOCK n` marker, never at a mention in the header comment */
  const m = kit.indexOf("<!-- ══ BLOCK " + block), a = kit.indexOf(from, m), b = kit.indexOf(to, a);
  if (m < 0 || a < 0 || b < 0) die("kit block " + block + " not found"); return kit.slice(a, b + to.length); };
const k1 = cut(1, "<style>", "</style>");
let k2 = cut(2, "<div class=\"af-chrome\">", "</div>\n</div>");
let k3 = cut(3, "<script>", "</script>");
const swap = (s, a, b) => { if (!s.includes(a)) die("kit text to adapt not found: " + a.slice(0, 50)); return s.replace(a, b); };
/* a page with no animation drops the Motion group (the kit says so); its place takes the page's own Detail group */
k2 = k2.replace(/\s*<!-- Drop this Motion group[^>]*-->/, "");
k2 = swap(k2, '<div class="af-group" role="radiogroup" aria-label="Motion" id="af-motion"><p class="af-legend">Motion</p></div>', '<div class="af-group" role="radiogroup" aria-label="Detail under each name" id="af-detail"><p class="af-legend">Detail under each name</p></div>');
k3 = swap(k3, '[{ id: "on", label: "Playing" }, { id: "off", label: "Paused" }].forEach(', 'if (mhost) [{ id: "on", label: "Playing" }, { id: "off", label: "Paused" }].forEach(');
k3 = swap(k3, 'mark(mhost, on ? "on" : "off");', 'if (mhost) mark(mhost, on ? "on" : "off");');

/* ── 5 · the page ──────────────────────────────────────────────────────── */
const data = {
  kind: KIND, endpoint: `${I.method} ${I.path}`, head: f.head,
  inv: { file: "inventory-endpoint.md", hash: crypto.createHash("sha1").update(md).digest("hex").slice(0, 8) },
  ui: Object.fromEntries(Object.entries(W.ui).map(([k, v]) => [k, v.plain])),
  sections: sections.map((s) => ({ title: s.title, short: s.short, slug: s.slug, icon: s.icon, plain: s.plain, rows: s.rows })),
};
let html = fs.readFileSync(path.join(HERE, "rate-sheet.tpl.html"), "utf8");
for (const s of sections) if (!html.includes(`"${s.icon}": '`)) die(`section "${s.short}" names an icon the page does not carry: ${s.icon}`);
for (const [mark, val] of [["<!--__KIT1__-->", k1], ["<!--__KIT2__-->", k2.trim()], ["<!--__KIT3__-->", k3], ["/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")]]) {
  if (!html.includes(mark)) die("template marker missing: " + mark); html = html.split(mark).join(val);
}
if (process.argv.includes("--check")) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === html;
  console.log(same ? "rate-endpoint.html is current" : "rate-endpoint.html is STALE — run gen-rate-sheet.js"); process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, html);
console.log(`rate-endpoint.html · ${rows.length} attributes in ${sections.length} sections · inventory ${data.inv.hash} · facts ${f.head} · ${html.length} bytes`);
if (process.argv.includes("--table")) for (const r of rows) console.log(`${r.id.padEnd(40)} ${r.mine.base}${r.mine.alarm ? "!" : " "}  ${r.mine.raw.padEnd(40).slice(0, 40)} | ${r.example}`);
