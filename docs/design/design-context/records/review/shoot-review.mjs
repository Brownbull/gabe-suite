/* shoot-review.mjs — the lab pictures the review page embeds, taken with REAL clicks (so the click paths the page prints are proven).

     node docs/design/design-context/records/review/shoot-review.mjs          # writes review-shots/*.png + review-shots/clicks.json

   Browser-gated (system Chrome + the spike's playwright-core) — run it ALONE. The PNGs are committed inputs of gen-review.js. */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../../../..'), OUT = path.join(HERE, 'review-shots');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP — no system chrome / playwright-core on this host'); process.exit(0); }
const { chromium } = require(PW);
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 2560, height: 1100 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + path.join(REPO, 'docs/design/workflow-panel/endpoint-lab.html')); await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 });
const clicks = {}, wait = ms => p.waitForTimeout(ms);
const calm = async () => { await p.mouse.move(5, 1090); await p.evaluate(() => window.hoverHide && window.hoverHide()); await wait(200); };
const shot = async (name, sel, pad) => { const e = await p.$(sel); if (!e) throw new Error(name + ': no element ' + sel); const r = await e.boundingBox(); const q = pad || [0, 0, 0, 0];
  await p.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: Math.max(0, r.x - q[3]), y: Math.max(0, r.y - q[0]), width: r.width + q[1] + q[3], height: r.height + q[0] + q[2] } }); };
const label = sel => p.$eval(sel, e => (e.textContent || '').trim().replace(/\s+/g, ' '));
const part = async word => { await p.click(`#tabs .tab[data-tab="${word}"]`); await wait(380); };
const cmdGroup = async g => { const back = await p.$('#cmd [data-cmd="back"]'); if (back) { await back.click(); await wait(250); } await p.click(`#cmd [data-cmd="grp-${g}"]`); await wait(380); };

/* 1 · the table record — four rows again: how a table was found is a fact about the map, hidden until "more information" is on (D-017) */
await part('data'); await p.click('#panel [data-table="locations"]'); await wait(420); await calm();
clicks.record = { part: await label('#tabs .tab[data-tab="data"]'), block: 'locations', rows: await p.$$eval('#portbody .rcrow', els => els.map(e => e.dataset.row)) };
/* 1b · a column's rule rides its hover card (piece 8) — the attribute the map draws, the name the database uses */
await p.$eval('#portbody .rctab .fld[data-col="order"]', e => e.scrollIntoView({ block: 'center' })); await p.hover('#portbody .rctab .fld[data-col="order"]'); await wait(320);
{ const h = await (await p.$('#hover')).boundingBox(), r = await (await p.$('#port')).boundingBox(), x = Math.min(h.x, r.x), y = Math.min(h.y, r.y);
  await p.screenshot({ path: path.join(OUT, 'column-rule.png'), clip: { x, y, width: Math.max(h.x + h.width, r.x + r.width) - x, height: Math.max(h.y + h.height, r.y + r.height) - y } }); }
await calm();

/* 2 · the function record — three new rows */
await part('functions'); await p.click('#panel [data-fn="complete_setup"]'); await wait(420); await calm();
clicks.fnRows = { part: await label('#tabs .tab[data-tab="functions"]'), block: 'complete_setup', rows: await p.$$eval('#portbody .rcrow', els => els.map(e => e.dataset.row)) };
await shot('fn-rows', '#port');

/* 3 · the call that is always open — pick the path through the COMMAND panel */
await part('data'); await cmdGroup('paths'); await p.click('#cmd [data-cmd="walk"]'); await wait(450);
const cellsOf = () => p.$$eval('#cmd [data-cmd]', els => els.map(e => ({ cmd: e.dataset.cmd, path: e.dataset.path || null, t: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) })));
clicks.pathCells = await cellsOf();
const pick = async want => { const id = await p.evaluate(w => { const f = window.LABEP.forms, x = f.paths.find(q => q.names.drawn === w); return x && x.id; }, want);
  let sel = `#cmd [data-path="${id}"]`;
  if (!(await p.$$(sel)).length) { /* the walk grid may have been left — open it again */ await cmdGroup('paths'); await p.click('#cmd [data-cmd="walk"]'); await wait(450); }
  if ((await p.$$(sel)).length) { await p.click(sel); clicks.pathByClick = (clicks.pathByClick || 0) + 1; } else { await p.evaluate(x => window.selectPath(x), id); clicks.pathByCall = (clicks.pathByCall || 0) + 1; } await wait(450); };
await pick('first run'); await calm();
await p.$eval('#portbody .ptcr[data-opens]:not([data-opens="0"])', e => e.scrollIntoView({ block: 'start' })); await wait(200);
clicks.openCall = { inside: (await p.$$('#portbody .ptcr.k-inside')).length, call: await label('#portbody .ptcr[data-opens]:not([data-opens="0"]) b') };
await shot('open-call', '#port');

/* 4 · an ending's record — "in this app" and "on the client" */
await pick('setup in progress'); await calm();
const exitTab = await p.$('#portvars .ptv[data-pvar="cmd-exit"]'); if (exitTab) { await exitTab.click(); await wait(380); } await calm();
clicks.ending = { tabs: await p.$$eval('#portvars .ptv', els => els.map(e => e.dataset.pvar)), client: await p.$$eval('#portbody .ptclient .ptrow .k', els => els.map(e => e.textContent)) };
await p.$eval('#portbody .ptclient', e => e.scrollIntoView({ block: 'center' })); await wait(200); await calm();
await shot('ending-sections', '#port');

/* 5 · where "11th of 81" lives — the app-level card, and the risk card beside it */
await p.evaluate(() => window.clearPath && window.clearPath()); await wait(300);
const hoverShot = async (name, sel) => { await p.hover(sel); await wait(340); const h = await (await p.$('#hover')).boundingBox(), c = await (await p.$(sel)).boundingBox(), r = { x: c.x - 240, y: c.y - 8, width: c.width + 250, height: c.height + 16 }, x = Math.min(h.x, r.x), y = Math.min(h.y, r.y);
  await p.screenshot({ path: path.join(OUT, name + '.png'), clip: { x, y, width: Math.max(h.x + h.width, r.x + r.width) - x, height: Math.max(h.y + h.height, r.y + r.height) - y } }); await calm(); };
await hoverShot('place-everything', '.habove .upchip:last-child'); await hoverShot('place-risk', '.flagchip');

/* the whole lab once, at half scale, with the box of every region the page points at */
clicks.regions = await p.evaluate(() => { const B = document.body.getBoundingClientRect(), box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x / B.width, r.y / 700, r.width / B.width, r.height / 700].map(v => Math.round(v * 10000) / 10000); };
  return { head: box('#headstrip'), parts: box('#tabs'), middle: box('#panel'), portrait: box('#port'), command: box('#cmd') }; });
{ const c2 = await b.newContext({ viewport: { width: 2560, height: 1100 }, deviceScaleFactor: 0.5 }), p2 = await c2.newPage();
  await p2.goto('file://' + path.join(REPO, 'docs/design/workflow-panel/endpoint-lab.html')); await p2.waitForFunction('window.__eplabReady===true', { timeout: 20000 });
  await p2.screenshot({ path: path.join(OUT, 'lab-map.png'), clip: { x: 0, y: 0, width: 2560, height: 700 } }); await c2.close(); }
fs.writeFileSync(path.join(OUT, 'clicks.json'), JSON.stringify(clicks, null, 1) + '\n');
console.log('shots:', fs.readdirSync(OUT).filter(f => f.endsWith('.png')).map(f => f + ' ' + Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + 'K').join(' · ')); console.log('page errors:', errs.slice(0, 3));
await b.close();
