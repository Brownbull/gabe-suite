// panel-verify-probe — AUTHOR-TIME playwright instrument (real browser, machine-bound).
//
// Verifies the levels page's right-side ECP card, per element KIND, against the locked
// spike (docs/design/codebase-graph-consolidation/element-components.html):
//   * FIELDS displayed match the spike's sections (endpoint/model/schema/function/entity),
//   * USAGE (in-degree) bar is shown with a value on every kind,
//   * CODE-BEHIND (hidden mass) is shown with named callees on endpoints AND functions,
//   * the frontend SCREEN card renders (Fetches/Reaches),
//   * zero page errors.
//
// DATA-BOUND: it drives a BUILT codebase-archive-lab.html (the shipped page needs its
// levels.js + c4-graph.js siblings), so it takes the built dir as arg1. Build it first,
// twin READ-ONLY (writes redirected), then run:
//   OUT=/tmp/center_out; rm -rf "$OUT"; mkdir -p "$OUT"
//   GABE_GRAFT_BUILD=0 GABE_REPO_ROOT=<a-project> GABE_SHELL_SRC="$PWD/templates/center/shell" \
//     GABE_CENTER_OUT="$OUT" python3 templates/center/generators/build_center_a3.py
//   node templates/center/shell/example/level-lab/probes/panel-verify-probe.mjs "$OUT"
// No arg → SKIPS (exit 0) so the zero-arg probes/run.sh battery stays green.
//
// ENGINE: machine-bound — system google-chrome via channel:'chrome' + a resolvable
// `playwright` (here the twin's node_modules). On a fresh machine, point both at a local
// playwright install (npx playwright install chromium) and update the import + channel.
import { chromium } from "/home/khujta/projects/apps/gustify/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";

const OUT = process.argv[2];
if (!OUT) { console.log("SKIP panel-verify — needs a built center dir (see header recipe)"); process.exit(0); }
const MOCK = fileURLToPath(new URL("../../../../../../docs/design/codebase-graph-consolidation/element-components.html", import.meta.url));

let P = 0, F = 0; const ok = (c, m) => { if (c) P++; else { F++; console.log("  FAIL:", m); } };
const errors = [];
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox"] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
pg.on("pageerror", (e) => errors.push(String(e.message)));

// mockup field inventory per kind
await pg.goto("file://" + MOCK, { waitUntil: "networkidle" }); await pg.waitForTimeout(300);
const MK = await pg.evaluate(() => { const n = (s) => (s || "").replace(/\s+/g, " ").trim(); const o = {};
  document.querySelectorAll(".col").forEach((c) => { const t = c.querySelector(".coltitle").textContent.trim(), card = c.querySelector(".panel");
    o[t] = { sections: [...card.querySelectorAll(".sechd")].map((h) => { const x = h.cloneNode(true); x.querySelectorAll(".cnt,.tip,.tipico").forEach((e) => e.remove()); return n(x.textContent); }) }; }); return o; });

// real page
await pg.goto("file://" + OUT + "/codebase-archive-lab.html", { waitUntil: "networkidle" }); await pg.waitForTimeout(700);
const setLevel = async (l) => { await pg.click(`#levels [data-lvl="${l}"]`); await pg.waitForTimeout(500); };
const dom = (k) => pg.evaluate((x) => { const el = document.querySelector(`[data-key="${x.replace(/"/g, '\\"')}"]`); if (!el) return false; el.dispatchEvent(new MouseEvent("click", { bubbles: true })); return true; }, k);
const card = () => pg.evaluate(() => { const n = (s) => (s || "").replace(/\s+/g, " ").trim(); const p = document.getElementById("panel"), c = p.querySelector(".ecp"); if (!c) return null;
  const secEls = [...c.querySelectorAll(".sechd")];
  const usageHd = secEls.find((h) => /^Usage/.test(n(h.textContent)));
  const behindHd = secEls.find((h) => /code behind/i.test(n(h.textContent)));
  return { sections: secEls.map((h) => { const x = h.cloneNode(true); x.querySelectorAll(".cnt,.tip,.tipico").forEach((e) => e.remove()); return n(x.textContent); }),
    usageBar: !!c.querySelector(".ubar .ufill"), usageBadge: usageHd ? n((usageHd.querySelector(".cnt") || {}).textContent) : null,
    behind: !!behindHd, behindBadge: behindHd ? n((behindHd.querySelector(".cnt") || {}).textContent) : null,
    behindNames: behindHd ? [...behindHd.parentElement.querySelectorAll(".chip.fn")].length : 0,
    type: n((p.querySelector(".ptype b") || {}).textContent) }; });
await setLevel("trace");
const K = await pg.$$eval("[data-key]", (els) => { const m = {}; els.forEach((e) => { const k = e.getAttribute("data-key"); (m[k.split(":")[0]] = m[k.split(":")[0]] || []).push(k); }); return m; });
const rich = async (arr, pred) => { for (const k of arr) { await dom(k); await pg.waitForTimeout(70); const c = await card(); if (pred(c)) return c; } if (arr[0]) { await dom(arr[0]); await pg.waitForTimeout(70); } return card(); };
const REAL = {};
REAL["API endpoint"] = await rich(K.ep || [], (c) => c && c.behind);
REAL["Model"] = await rich(await pg.$$eval('.piece[data-kind="model"][data-key]', (e) => e.map((x) => x.getAttribute("data-key"))), () => true);
REAL["Schema"] = await rich(await pg.$$eval('.piece[data-kind="schema"][data-key]', (e) => e.map((x) => x.getAttribute("data-key"))), () => true);
REAL["Function"] = await rich(K.fn || [], (c) => c && c.behind);
await setLevel("entities"); await pg.click(".entnode", { force: true }); await pg.waitForTimeout(150); REAL["Entity (container)"] = await card();
await setLevel("trace"); const sk = await pg.$$eval(".screen[data-key]", (e) => e.map((x) => x.getAttribute("data-key")));
if (sk.length) { await dom(sk[0]); await pg.waitForTimeout(120); REAL["Frontend screen"] = await card(); }

// assert: fields vs spike + usage + behind
const miss = (mk, rl) => (mk || []).map((s) => s.toLowerCase()).filter((s) => !(rl || []).map((x) => x.toLowerCase()).some((h) => h.startsWith(s)));
for (const kind of ["API endpoint", "Model", "Schema", "Function", "Entity (container)"]) {
  const c = REAL[kind]; ok(c && c.sections.length, `${kind}: card renders`); if (!c) continue;
  // "docstring"→"Purpose" (endpoint) + "code behind" (data-conditional) are asserted separately
  const sm = miss(MK[kind].sections, c.sections).filter((s) => !["docstring", "code behind"].includes(s));
  ok(sm.length === 0, `${kind}: sections match the spike (missing: ${sm})`);
  ok(c.usageBar, `${kind}: USAGE in-degree bar displayed`);
  ok(c.usageBadge !== null && c.usageBadge !== "", `${kind}: USAGE badge shows a value (${c.usageBadge})`);
}
ok(REAL["API endpoint"] && REAL["API endpoint"].behind && REAL["API endpoint"].behindNames > 0,
   `endpoint CODE-BEHIND with named callees (${REAL["API endpoint"] && REAL["API endpoint"].behindBadge} / ${REAL["API endpoint"] && REAL["API endpoint"].behindNames} names)`);
ok(REAL["Function"] && REAL["Function"].behind && REAL["Function"].behindNames > 0,
   `function CODE-BEHIND with named callees (${REAL["Function"] && REAL["Function"].behindBadge} / ${REAL["Function"] && REAL["Function"].behindNames} names)`);
ok(REAL["Frontend screen"] && REAL["Frontend screen"].type === "frontend" && REAL["Frontend screen"].usageBar,
   `frontend screen card renders (type frontend, usage bar)`);
ok(errors.length === 0, `no JS errors (${errors.slice(0, 2).join(" | ")})`);

console.log("── PANEL VERIFICATION (real vs spike · usage · behind) ──");
for (const kind of Object.keys(REAL)) { const c = REAL[kind]; if (!c) { console.log(`  ${kind}: (not captured)`); continue; }
  console.log(`  ${kind.padEnd(20)} usage[bar:${c.usageBar} badge:${String(c.usageBadge).padStart(3)}]  behind[${c.behind ? c.behindBadge + " · " + c.behindNames + " names" : "—"}]  sections:${c.sections.length}`); }
console.log(`panel-verify: ${P} passed, ${F} failed`);
await b.close();
process.exit(F ? 1 : 0);
