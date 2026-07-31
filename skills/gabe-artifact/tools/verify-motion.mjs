import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(`${process.env.HOME}/.claude/skills/gabe-docsite/tools/_playwright.mjs`);
const html = await readFile('motion-catalog.html', 'utf8');
const srv = createServer((_q, r) => { r.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}/`;

const FP = (sel) => {
  const stage = document.querySelector(sel);
  if (!stage) return 'MISSING:' + sel;
  return [...stage.querySelectorAll('*')].map(n => {
    const r = n.getBoundingClientRect(), c = getComputedStyle(n);
    return [Math.round(r.x*10), Math.round(r.y*10), Math.round(r.width*10), Math.round(r.height*10),
            c.transform, c.strokeDashoffset, c.opacity, c.r, c.backgroundColor, c.borderColor,
            n.getAttribute('fill'), n.getAttribute('stroke'), (n.textContent||'').length].join(',');
  }).join('|');
};

const b = await chromium.launch();
let pass = 0, fail = 0;
const ok = (n, d='') => { console.log(`PASS  ${n}${d?'  — '+d:''}`); pass++; };
const bad = (n, d='') => { console.log(`FAIL  ${n}${d?'  — '+d:''}`); fail++; };

// ── moving under normal motion ──────────────────────────────────────────
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(300);

const cards = await p.$$eval('.ex[data-anim]', ns => ns.map(n => n.getAttribute('data-anim')));
const USER_DRIVEN = new Set(['scrub', 'scrolly']);

for (const anim of cards) {
  const sel = `.ex[data-anim="${anim}"] .ex-stage`;
  if (USER_DRIVEN.has(anim)) continue;
  await p.click(`.ex[data-anim="${anim}"] .ex-replay`);
  const a = await p.evaluate(FP, sel);
  await p.waitForTimeout(1800);
  const c = await p.evaluate(FP, sel);
  a !== c ? ok(`${anim} animates`) : bad(`${anim} still frozen 1.8s after replay`);
}

// user-driven: scrubber
await p.$eval('#m-scrub', e => { e.value = '5'; e.dispatchEvent(new Event('input', {bubbles:true})); });
const scrubWhat = await p.$eval('#m-scrub-what', e => e.textContent);
scrubWhat.includes('8') ? ok('scrub responds to input', scrubWhat) : bad('scrub did not update', scrubWhat);

// user-driven: scrollytelling
const before = await p.$eval('#m-scrolly-viz', e => e.innerHTML.length && e.querySelectorAll('[stroke="var(--accent)"]').length);
await p.$eval('#m-scrolly', e => { e.scrollTop = e.scrollHeight; });
await p.waitForTimeout(700);
const after = await p.$eval('#m-scrolly-viz', e => e.querySelectorAll('[stroke="var(--accent)"]').length);
after > before ? ok('scrolly advances on scroll', `${before} → ${after} lit`) : bad('scrolly did not advance', `${before} → ${after}`);

// replay restarts a finished animation
await p.click('.ex[data-anim="swap"] .ex-replay');
await p.waitForTimeout(120);
const skel = await p.$$eval('.ex[data-anim="swap"] .skel', n => n.length);
skel > 0 ? ok('replay restarts the skeleton') : bad('replay did not restart skeleton');

// global pause freezes motion
await p.evaluate(() => window.__setMotion(false));
const f1 = await p.evaluate(FP, '.ex[data-anim="arch"] .ex-stage');
await p.waitForTimeout(1200);
const f2 = await p.evaluate(FP, '.ex[data-anim="arch"] .ex-stage');
f1 === f2 ? ok('cog Motion=Paused freezes packets') : bad('paused packets still moved');

console.log('page errors:', errs.length ? errs.slice(0,3) : 'none');
if (errs.length) fail++;
await p.close();

// ── reduced motion: end states, no movement ─────────────────────────────
const rp = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await rp.goto(url, { waitUntil: 'load' });
await rp.waitForTimeout(400);
const spans = await rp.$$eval('.span-bar', ns => ns.every(n => getComputedStyle(n).transform.includes('matrix(1,')));
spans ? ok('reduced: spans render at full width') : bad('reduced: spans not at end state');
const termLines = await rp.$$eval('#m-term .ln', n => n.length);
termLines === 8 ? ok('reduced: command trace shows all 8 lines') : bad('reduced: trace incomplete', String(termLines));
const r1 = await rp.evaluate(FP, '.ex[data-anim="arch"] .ex-stage');
await rp.waitForTimeout(1200);
const r2 = await rp.evaluate(FP, '.ex[data-anim="arch"] .ex-stage');
r1 === r2 ? ok('reduced: nothing moves') : bad('reduced: something still moved');
await rp.close();

await b.close(); srv.close();
console.log(`\n${pass}/${pass+fail} motion checks passed`);
process.exit(fail ? 1 : 0);
