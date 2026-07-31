/* gabe-docsite — diagram compliance gate.
 *
 * WHY: docs are opened straight off disk (file://). A CDN/ES-module mermaid does
 * NOT run over file://, so diagrams silently degrade to raw `flowchart TD …`
 * source text. This gate loads every generated page over file:// (the way a
 * reader opens it) and asserts each diagram is a rendered, sized <svg> showing
 * no raw mermaid source. An http-server test does not catch this — it must be
 * file://.
 *
 * It also names WHICH PATH produced each diagram. Since 2026-07-31 a page can
 * be pre-rendered at build time (a committed <figure class="mermaid-fig"> SVG)
 * or rendered at read time by the vendored classic loader — and a FAILED
 * pre-render degrades to a <pre class="mermaid-fallback"> source block, which
 * would otherwise look identical to a page that simply has no diagrams. A
 * fallback is a FAILURE here, not a footnote.
 *
 * Usage:  node diagram-compliance.mjs <site-dir>       (default: ../../docs/site)
 * Exit 0 = every diagram on every page renders as SVG · Exit 1 = non-compliant.
 */
import { chromium } from './_playwright.mjs';
import { pathToFileURL } from 'node:url';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// default = the project's docs/site under the CWD — matches the SKILL's documented
// no-arg invocation from a project root (the old `<cwd>/site` default matched nothing)
const siteDir = resolve(process.argv[2] || join(process.cwd(), 'docs/site'));
const pages = readdirSync(siteDir).filter(f => f.endsWith('.html'));
if (!pages.length) { console.error(`No .html pages in ${siteDir}`); process.exit(1); }

const browser = await chromium.launch();
const results = [];
for (const file of pages) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(siteDir, file)).href, { waitUntil: 'load' });
  await page.waitForTimeout(2500); // let the vendored classic mermaid render
  const fallbacks = await page.evaluate(
    () => document.querySelectorAll('pre.mermaid-fallback').length);
  /* Which path produced these diagrams, read STRUCTURALLY from the DOM rather
     than taken from the build's word. The converter nests
     <figure class="mermaid-fig"><pre class="mermaid">SRC</pre></figure>, so a
     figure that still holds its <pre> was rendered at read time by the vendored
     loader; a figure holding a bare <svg> was rendered at build time. */
  const path = await page.evaluate(() => {
    const figs = [...document.querySelectorAll('figure.mermaid-fig')];
    const pre = figs.filter(f => !f.querySelector('pre')).length;
    const run = figs.filter(f => f.querySelector('pre')).length
      + document.querySelectorAll('.mermaid:not(figure.mermaid-fig .mermaid)').length;
    if (pre && run) return 'mixed';
    if (pre) return 'pre-rendered';
    if (run) return 'runtime';
    return 'none';
  });
  const diagrams = await page.evaluate(() => {
    const rawRe = /flowchart\s+(TD|LR|TB|RL)|(^|\s)subgraph\s|-->|==>/;
    /* One entry per DIAGRAM. The old selector matched the figure AND the <pre>
       inside it, so every count on this gate was exactly double — 22 reported
       for the 11 diagrams actually authored. */
    const containers = [
      ...document.querySelectorAll('figure.mermaid-fig, figure[data-mermaid-src]'),
      // any other mermaid block NOT nested inside one of those — a bare
      // <div class="mermaid"> is what a hand-authored page and the classic
      // loader both produce, and dropping it from the count would quietly
      // stop gating every page that predates the figure wrapper.
      ...document.querySelectorAll('.mermaid:not(figure.mermaid-fig .mermaid):not(figure[data-mermaid-src] .mermaid)'),
    ];
    return containers.map((c, i) => {
      const svg = c.querySelector('svg');
      const box = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      const clone = c.cloneNode(true);
      clone.querySelectorAll('svg').forEach(s => s.remove());
      return { i, hasSvg: !!svg, w: Math.round(box.width), h: Math.round(box.height),
               rawShown: rawRe.test((clone.textContent || '').replace(/\s+/g, ' ').trim()) };
    });
  });
  await page.close();
  const bad = diagrams.filter(d => !d.hasSvg || d.w < 60 || d.h < 40 || d.rawShown);
  results.push({ file, count: diagrams.length, bad, path, fallbacks });
}
await browser.close();

let failed = 0;
console.log(`\nDIAGRAM COMPLIANCE (file://) — ${siteDir}\n${'='.repeat(52)}`);
for (const r of results) {
  if (!r.count && !r.fallbacks) { console.log(`  [ -- ] ${r.file.padEnd(20)} no diagrams`); continue; }
  const ok = r.bad.length === 0 && r.fallbacks === 0;
  if (!ok) failed++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${r.file.padEnd(20)} ${r.count} diagram(s) · ${r.path}`);
  if (r.fallbacks) {
    console.log(`         ✗ ${r.fallbacks} diagram(s) fell back to SOURCE TEXT — the pre-render`);
    console.log(`           failed and the page shipped the mermaid code instead of a picture.`);
  }
  for (const d of r.bad) {
    const why = !d.hasSvg ? 'no <svg> — did not render'
      : d.rawShown ? 'raw mermaid source shown as text'
      : `svg too small (${d.w}×${d.h})`;
    console.log(`         ✗ diagram #${d.i}: ${why}`);
  }
}
console.log('='.repeat(52));
const totalDiagrams = results.reduce((n, r) => n + r.count, 0);
const paths = [...new Set(results.filter(r => r.count).map(r => r.path))];
console.log(failed === 0
  ? `ALL COMPLIANT — ${totalDiagrams} diagram(s) across ${pages.length} pages render as SVG `
    + `over file:// · path: ${paths.join(' + ') || 'none'}`
  : `${failed} PAGE(S) NON-COMPLIANT`);
process.exit(failed === 0 ? 0 : 1);
