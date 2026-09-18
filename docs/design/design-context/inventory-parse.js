/* inventory-parse.js — ONE reader of an inventory markdown file, shared by gen-rate-sheet.js and gen-matrices.js.
   An inventory is `## section` headings, each followed by an 8-column table
   (attribute | data type | cardinality | imp. | why | volatile | own / relation | first visible at); it ENDS at the
   `## The face…` heading — the face proposal and the operator's notes after it are prose, never read as rows. */
"use strict";
const fs = require("fs");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const unbold = (s) => s.replace(/\*\*/g, "").trim();

function proposal(cell) {                       /* "**3** if uncaught, else 1" → base 1 + alert · "alarm channel only" → base 1 + alert */
  const raw = unbold(cell).replace(/\s+/g, " "), nums = (raw.match(/[123]/g) || []).map(Number), els = raw.match(/else ([123])/);
  let base, alarm;
  if (els) { base = Number(els[1]); alarm = true; }
  else if (nums.length >= 2) { base = nums[0]; alarm = true; }
  else if (nums.length === 1) { base = nums[0]; alarm = /alarm|alert/i.test(raw); }
  else { base = 1; alarm = true; }
  return { base, alarm, raw };
}

function parseInventory(file) {
  const md = fs.readFileSync(file, "utf8"), sections = [];
  let cur = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^## (.+)$/);
    if (h && /^The face/.test(h[1])) break;
    if (h) { cur = { title: h[1].trim(), rows: [] }; sections.push(cur); continue; }
    if (!cur || !line.startsWith("|") || /^\|\s*-{3}/.test(line) || /^\|\s*attribute\s*\|/.test(line)) continue;
    const cells = line.split("|").slice(1).map((c) => c.trim());
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length !== 8) throw new Error(`row with ${cells.length} cells, expected 8: ${line.slice(0, 80)}`);
    const [name, type, card, imp, why, vol, rel, first] = cells;
    const label0 = name.split(" (")[0].trim(), sub = (name.match(/\((.+)\)\s*$/) || [])[1] || null;
    const gapM = first.match(/\*\*(.+?)\*\*/) || type.match(/\*\*(.+?)\*\*/);
    cur.rows.push({
      id: slug(label0), label: label0.charAt(0).toUpperCase() + label0.slice(1), sub,
      type: unbold(type), cardFull: unbold(card), why: unbold(why), volatile: unbold(vol), rel: unbold(rel),
      first: unbold(first.replace(/\s*[—,]\s*\*\*.+?\*\*\s*$/, "")).replace(/\bfar\b/, "far (the face)"), gap: gapM ? unbold(gapM[1]).replace(/^feed gap:\s*/, "") : null,
      mine: proposal(imp.replace(/\s*\(proposed\)/, "")), fresh: /\(proposed\)/.test(imp),
    });
  }
  const rows = sections.flatMap((s) => s.rows);
  const dup = rows.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (dup.length) throw new Error("duplicate slugs: " + dup.join(", "));
  return { md, sections, rows, ruled: (md.match(/^Ruled:\s*(\d{4}-\d{2}-\d{2})\s*$/m) || [])[1] || null };
}

/* questions.md: the `| Q1 | question | task | where it came from |` table */
function parseQuestions(file) {
  const out = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\|\s*(Q\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (m) out.push({ id: m[1], text: m[2], task: m[3].split("·").map((t) => t.trim()), from: m[4] });
  }
  return out;
}
module.exports = { parseInventory, parseQuestions, slug, unbold };
