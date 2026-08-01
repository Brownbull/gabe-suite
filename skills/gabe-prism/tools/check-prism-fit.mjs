/* gabe-prism · the FIT gate — the price of giving up a fixed column.
 *
 * A 74rem artifact could only spill in one direction. A full-bleed canvas can
 * spill four ways, and three of them look fine on the machine that authored it:
 *
 *   1. the PAGE scrolls sideways        — the drawing pushed the body wider
 *   2. the drawing scales below legible — scale-to-fit ran past the 12px floor
 *   3. PROSE takes the canvas's freedom — a 190-character line, unreadable
 *   4. a floor overflows its own box    — .pfwrap never got a scrollbar
 *
 * Checked at three widths because the failures do not appear at the same one:
 * (3) shows up widest, (1) and (2) narrowest.
 *
 * Usage:  node tools/check-prism-fit.mjs <page.html> [more.html …]
 *
 * THE ARITHMETIC this gate holds to (prism.css states the same numbers):
 *   authored smallest text 15px × minimum scale 0.80 = 12px effective floor.
 * A page that needs to go below 0.80 must scroll its canvas instead, and this
 * gate fails it if the page body scrolls rather than the box.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, join, basename } from 'node:path';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('usage: node check-prism-fit.mjs <page.html> [more.html …]');
  process.exit(2);
}
const WIDTHS = [1440, 1280, 1024];
const TEXT_FLOOR = 12;     // px, gabe-artifact's legibility floor
const PROSE_CH = 76;       // the measure prose never exceeds, canvas or not

const { chromium } = await import(`${process.env.HOME}/.claude/skills/gabe-docsite/tools/_playwright.mjs`);

let pass = 0, fail = 0;
const ok = (n, d = '') => { console.log(`PASS  ${n}${d ? '  — ' + d : ''}`); pass++; };
const bad = (n, d = '') => { console.log(`FAIL  ${n}${d ? '  — ' + d : ''}`); fail++; };

/* Served from the page's own directory so assets/a3.css, prism.css and
   prism-fx.js resolve — a fit gate run against an unstyled page measures
   nothing, and would report a comfortable PASS while doing it. */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
               '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const b = await chromium.launch();

for (const f of files) {
  const target = resolve(f);
  const root = dirname(target);
  const srv = createServer(async (q, r) => {
    const rel = decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || basename(target);
    try {
      const buf = await readFile(join(root, rel));
      const ext = rel.slice(rel.lastIndexOf('.'));
      r.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      r.end(buf);
    } catch { r.writeHead(404); r.end('nope'); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/${basename(target)}`;
  console.log(`\n── ${basename(target)}`);

  for (const w of WIDTHS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto(url, { waitUntil: 'load' });
    await p.waitForTimeout(500);

    const r = await p.evaluate(({ CH }) => {
      const out = { floors: [], prose: [], overflow: [] };
      out.bodyScroll = document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth;

      document.querySelectorAll('.pf[data-prism]').forEach((pf) => {
        const fit = pf.closest('.pffit');
        const wrap = pf.closest('.pfwrap');
        const m = fit ? new DOMMatrixReadOnly(getComputedStyle(fit).transform) : null;
        const scale = m ? (m.a || 1) : 1;
        let min = Infinity;
        pf.querySelectorAll('*').forEach((el) => {
          if (!el.textContent.trim()) return;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs && fs < min) min = fs;
        });
        out.floors.push({
          fx: pf.getAttribute('data-fx') || '(unnamed)',
          scale: Math.round(scale * 1000) / 1000,
          minText: min === Infinity ? null : Math.round(min * scale * 10) / 10,
          spills: wrap ? Math.max(0, wrap.scrollWidth - wrap.clientWidth) : -1,
          scrollable: wrap ? getComputedStyle(wrap).overflowX : 'none',
        });
      });

      // Prose: paragraphs and list items that are NOT part of a drawing. A
      // node's recipe line is furniture and is short by construction; a
      // sentence is not, and is what the 76ch rule exists for.
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;width:' + CH + 'ch';
      document.body.appendChild(probe);
      document.querySelectorAll('.prismstage p, .prismstage li, .prismhead p, .pxfrag p')
        .forEach((el) => {
          if (el.closest('.pf[data-prism]')) return;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || !el.textContent.trim()) return;
          probe.style.font = cs.font || (cs.fontSize + ' ' + cs.fontFamily);
          const cap = probe.getBoundingClientRect().width;
          const got = el.getBoundingClientRect().width;
          if (got > cap + 1) {
            out.prose.push({ text: el.textContent.trim().slice(0, 42), got: Math.round(got), cap: Math.round(cap) });
          }
        });
      probe.remove();
      return out;
    }, { CH: PROSE_CH });

    const tag = `${w}px`;
    r.bodyScroll <= 1
      ? ok(`${tag} · page body does not scroll sideways`)
      : bad(`${tag} · the PAGE scrolls sideways`, `${r.bodyScroll}px of overflow — the box should scroll, not the body`);

    const tooSmall = r.floors.filter((f) => f.minText !== null && f.minText < TEXT_FLOOR);
    tooSmall.length === 0
      ? ok(`${tag} · every floor stays above the ${TEXT_FLOOR}px legibility floor`,
           r.floors.map((f) => `${f.fx} ×${f.scale} → ${f.minText}px`).join(' · ') || 'no floors')
      : bad(`${tag} · floor(s) scaled below ${TEXT_FLOOR}px`,
            tooSmall.map((f) => `${f.fx} ×${f.scale} → ${f.minText}px`).join(', '));

    const trapped = r.floors.filter((f) => f.spills > 1 && f.scrollable !== 'auto' && f.scrollable !== 'scroll');
    trapped.length === 0
      ? ok(`${tag} · every overflowing floor can be scrolled inside its own box`)
      : bad(`${tag} · floor(s) overflow with no scrollbar`, trapped.map((f) => f.fx).join(', '));

    r.prose.length === 0
      ? ok(`${tag} · prose stays inside ${PROSE_CH}ch`)
      : bad(`${tag} · prose took the canvas's freedom`,
            r.prose.slice(0, 3).map((x) => `"${x.text}…" ${x.got}px > ${x.cap}px`).join(' · '));

    errs.length === 0 ? ok(`${tag} · no page errors`) : bad(`${tag} · page errors`, errs.slice(0, 2).join(' | '));
    await p.close();
  }
  srv.close();
}

await b.close();
console.log(`\n${pass}/${pass + fail} fit checks passed across ${WIDTHS.join('/')}px`);
process.exit(fail ? 1 : 0);
