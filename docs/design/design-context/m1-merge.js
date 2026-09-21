#!/usr/bin/env node
/* m1-merge.js — the raters' raw returns → ONE matrix.   node docs/design/design-context/m1-merge.js [--check]

   READS   m1-endpoint.raw.json (three raters + the judge passes, never hand-edited) · m1-input.json (the ids)
   WRITES  m1-endpoint.json — per filled cell: the three votes, the value, and the judge's reason where one ruled
   RULES   a question label is its leading Qn, whatever text follows (the first merge dropped a whole rater on this);
           needed = 2 · helps = 1 · absent = 0; value = the MEDIAN of the three votes; a HARD SPLIT is a 0 against a 2,
           and only there a judge's verdict replaces the median. An id the input does not carry is dropped and NAMED.
           EVERY `judge_pass_<n>` is read, in numeric order, a later pass winning — round 2 added a third and a hardcoded
           two-pass list had silently left its 26 verdicts out. */
"use strict";
const fs = require("fs"), path = require("path"), HERE = __dirname;
const raw = JSON.parse(fs.readFileSync(path.join(HERE, "m1-endpoint.raw.json"), "utf8")), inp = JSON.parse(fs.readFileSync(path.join(HERE, "m1-input.json"), "utf8"));
const ATTR = inp.attrs.map((a) => a.id), QS = inp.questions.map((q) => q.id), aset = new Set(ATTR), qset = new Set(QS), KEYS = Object.keys(raw.raters);
const vote = new Map(), notes = {}, missing = {}, dropped = [];
for (const k of KEYS) for (const row of raw.raters[k]) {
  const q = (String(row.q).match(/^\s*(Q\d+)\b/) || [])[1];
  if (!qset.has(q)) { dropped.push(`${k}:${String(row.q).slice(0, 24)}`); continue; }
  (notes[q] = notes[q] || {})[k] = row.note;
  if (row.missing && row.missing.trim() && !/^\s*(none|nothing|n\/?a|-|—)\.?\s*$/i.test(row.missing)) (missing[q] = missing[q] || {})[k] = row.missing.trim();
  for (const [list, v] of [[row.helps, 1], [row.needed, 2]]) for (const a of list || []) {
    if (!aset.has(a)) { dropped.push(`${k}:${q}:${a}`); continue; }
    const key = q + "|" + a, m = vote.get(key) || {}; m[k] = Math.max(m[k] || 0, v); vote.set(key, m);
  }
}
const verdict = new Map();
const PASSES = Object.keys(raw).filter((k) => /^judge_pass_\d+$/.test(k)).sort((a, b) => Number(a.slice(11)) - Number(b.slice(11)));   /* every pass, in order — a round that adds one must not be ignored because the list was hardcoded */
for (const pass of PASSES) for (const c of (raw[pass] || {}).cells || []) if (qset.has(c.q) && aset.has(c.a)) verdict.set(c.q + "|" + c.a, c);   /* a later pass wins */
const cells = [], unjudged = [];
for (const q of QS) for (const a of ATTR) {
  const m = vote.get(q + "|" + a); if (!m) continue;
  const vals = KEYS.map((k) => m[k] || 0), value = vals.slice().sort((x, y) => x - y)[Math.floor(vals.length / 2)], split = Math.max(...vals) - Math.min(...vals) === 2;
  const c = { q, a, vals, value, split };
  if (split) { const j = verdict.get(q + "|" + a); if (j) { c.value = j.value; c.reason = j.reason; c.judged = true; } else unjudged.push(q + " x " + a); }
  cells.push(c);
}
const same = (c) => new Set(c.vals).size === 1;
const out = {
  _about: "M1 for the endpoint card: written by m1-merge.js from m1-endpoint.raw.json. Do not edit.", input_sha1: raw.input_sha1, raters: KEYS, cells, notes, missing, dropped, unjudged,
  counts: { cells: cells.length, unanimous: cells.filter(same).length, adjacent: cells.filter((c) => !same(c) && !c.split).length, split: cells.filter((c) => c.split).length, judged: cells.filter((c) => c.judged).length },
};
const text = JSON.stringify(out, null, 1) + "\n", OUT = path.join(HERE, "m1-endpoint.json");
if (process.argv.includes("--check")) { const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === text; console.log(ok ? "m1-endpoint.json is current" : "m1-endpoint.json is STALE — run m1-merge.js"); process.exit(ok ? 0 : 1); }
fs.writeFileSync(OUT, text);
console.log(`m1-endpoint.json · ${JSON.stringify(out.counts)} · dropped ${dropped.length} · hard splits without a verdict ${unjudged.length}`);
