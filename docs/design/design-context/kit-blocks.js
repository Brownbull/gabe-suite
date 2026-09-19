/* kit-blocks.js — the gabe-artifact kit's three blocks, cut verbatim from the repo's copy of the kit.
   A block starts at its `<!-- ══ BLOCK n` marker, never at a mention of a tag in the kit's header comment. */
"use strict";
const fs = require("fs"), path = require("path");
function kitBlocks(root) {
  const kit = fs.readFileSync(path.join(root, "skills/gabe-artifact/assets/artifact-chrome.html"), "utf8");
  const cut = (block, from, to) => {
    const m = kit.indexOf("<!-- ══ BLOCK " + block), a = kit.indexOf(from, m), b = kit.indexOf(to, a);
    if (m < 0 || a < 0 || b < 0) throw new Error("kit block " + block + " not found"); return kit.slice(a, b + to.length); };
  return { k1: cut(1, "<style>", "</style>"), k2: cut(2, "<div class=\"af-chrome\">", "</div>\n</div>"), k3: cut(3, "<script>", "</script>") };
}
/* A page with no animation drops the kit's Motion group (the kit says so) — and block 3 must then not touch it, or the
   whole roster script throws before the fonts apply. `groupHtml` takes the group's place; pass "" to drop its divider too. */
function withoutMotion(KIT, groupHtml) {
  const swap = (s, a, b) => { if (!s.includes(a)) throw new Error("kit text to adapt not found: " + a.slice(0, 50)); return s.replace(a, b); };
  let k2 = KIT.k2.replace(/\s*<!-- Drop this Motion group[^>]*-->/, ""), k3 = KIT.k3;
  const MOTION = '<div class="af-group" role="radiogroup" aria-label="Motion" id="af-motion"><p class="af-legend">Motion</p></div>';
  if (groupHtml) k2 = swap(k2, MOTION, groupHtml);
  else { const i = k2.indexOf(MOTION), j = k2.lastIndexOf('<div class="af-divider"></div>', i); if (i < 0 || j < 0) throw new Error("kit Motion group not found"); k2 = k2.slice(0, j).replace(/\s+$/, "") + k2.slice(i + MOTION.length); }
  k3 = swap(k3, '[{ id: "on", label: "Playing" }, { id: "off", label: "Paused" }].forEach(', 'if (mhost) [{ id: "on", label: "Playing" }, { id: "off", label: "Paused" }].forEach(');
  k3 = swap(k3, 'mark(mhost, on ? "on" : "off");', 'if (mhost) mark(mhost, on ? "on" : "off");');
  return { k1: KIT.k1, k2, k3 };
}
module.exports = { kitBlocks, withoutMotion };
