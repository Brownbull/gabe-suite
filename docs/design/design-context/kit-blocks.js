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
module.exports = { kitBlocks };
