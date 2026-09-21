/* walk-alive.mjs — REAL mouse clicks only, from a cold load of the endpoint lab to the "alive during the request" section (leftovers piece 11).

     node docs/design/workflow-panel/walk-alive.mjs        # writes shots/alive/*.png + walk.json · browser-gated, run it ALONE (~20 s)

   WHY IT EXISTS: a click path handed to the operator was once written from the probe's SCRIPT calls (showTab · selectExit) and did not
   match the screen. A path he is asked to follow comes from a walk like this one — mouse clicks at the control's centre, the words read
   off the control, a picture per step — or it is not handed over.
   Every control is clicked by mouse at its centre; nothing is selected by a script call. Each step is photographed with the
   control about to be clicked ringed, and the words on that control are read off the page so the instructions use them. */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..'), OUT = path.join(HERE, 'shots/alive');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const { chromium } = require(PW);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.env.VW || 1920), H = Number(process.env.VH || 1000);
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + path.join(REPO, 'docs/design/workflow-panel/endpoint-lab.html')); await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 });
const wait = ms => p.waitForTimeout(ms), log = [], say = (k, v) => { log.push([k, v]); console.log(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
const txt = async sel => p.$eval(sel, e => (e.textContent || '').trim().replace(/\s+/g, ' '));
const cells = () => p.$$eval('#cmd [data-cmd]', els => els.map(e => ({ cmd: e.dataset.cmd, key: (e.querySelector('.ck, kbd, .key') || {}).textContent || null, t: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48),
  title: e.getAttribute('title') || e.getAttribute('aria-label') || null, path: e.dataset.path || null })));
let n = 0;
const ring = async sel => p.$eval(sel, e => { e.dataset.__ring = '1'; e.style.outline = '3px solid #ff2d9b'; e.style.outlineOffset = '3px'; });
const unring = async () => p.$$eval('[data-__ring]', els => els.forEach(e => { e.style.outline = ''; e.style.outlineOffset = ''; delete e.dataset.__ring; }));
const step = async (name, sel, note) => {            // photograph with the target ringed, then click it with the mouse
  const el = await p.$(sel); if (!el) { say('MISSING ' + name, sel); return false; }
  await p.mouse.move(5, H - 10); await p.evaluate(() => window.hoverHide && window.hoverHide()); await wait(220);   // the picture shows the control, not the last hover card
  await el.scrollIntoViewIfNeeded(); await ring(sel); await wait(120);
  n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-' + name + '.png') });
  const box = await el.boundingBox(), label = await txt(sel);
  await unring();
  say('step ' + n + ' · ' + name, { click: label.slice(0, 60), where: sel, at: [Math.round(box.x), Math.round(box.y)], size: [Math.round(box.width), Math.round(box.height)], note: note || null });
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await wait(520); return true; };

say('regions', await p.evaluate(() => ['#tabs', '#panel', '#cmd', '#port'].map(s => { const e = document.querySelector(s); if (!e) return [s, null]; const r = e.getBoundingClientRect(); return [s, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })));
say('part buttons', await p.$$eval('#tabs .tab', els => els.map(e => e.dataset.tab + '=' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24))));
say('command at load', await cells());

await step('command-paths-group', '#cmd [data-cmd="grp-paths"]', 'the paths group — the FIRST cell of COMMAND, key Q');
say('command in paths group', await cells());
await step('command-walk', '#cmd [data-cmd="walk"]', 'walk one path');
const walk = await cells(); say('command walk grid', walk);
{ // A FINDING, kept as a picture: the mouse still rests where "walk" was, which is now the first ending — and that ending's hover card covers the row below it
  await wait(700); const cover = await p.evaluate(() => { const h = [...document.querySelectorAll('#hover, [id*="hover"], [class*="hcard"]')].find(e => (e.offsetParent !== null || getComputedStyle(e).opacity === '1') && (e.textContent || '').trim());
    if (!h) return { card: false }; const r = h.getBoundingClientRect(); const hid = [...document.querySelectorAll('#cmd [data-path]')].filter(c => { const q = c.getBoundingClientRect(), cx = q.x + q.width / 2, cy = q.y + q.height / 2; return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom; });
    return { card: true, covers: hid.map(c => (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)) }; });
  say('after the click on walk, the resting mouse opens a hover card that covers', cover);
  n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-the-hover-card-covers-the-row.png') }); }
const id = await p.evaluate(() => { const x = window.LABEP.forms.paths.find(q => q.names.drawn === 'first run'); return x && x.id; });   // a READ of the facts, to know which cell to look for — the click below is by mouse
await step('pick-the-route', '#cmd [data-path="' + id + '"]', 'the route that gets through, "first run" (key C)');
say('portrait tabs', await p.$$eval('#portvars .ptv', els => els.map(e => ({ pvar: e.dataset.pvar, t: (e.textContent || '').trim().replace(/\s+/g, ' '), on: e.classList.contains('on') || e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-pressed') === 'true' }))));
say('portrait sections before the tab', await p.$$eval('#portbody .ptsec', els => els.map(e => e.textContent.trim())));
say('portrait sections', await p.$$eval('#portbody .ptsec', els => els.map(e => e.textContent.trim())));

// is the row on screen WITHOUT scrolling? then scroll the way a person would: the wheel, over the portrait
const vis = async () => p.evaluate(() => { const sec = [...document.querySelectorAll('#portbody .ptsec')].find(x => /^alive during the request/.test(x.textContent));
  if (!sec) return { found: false }; const q = sec.getBoundingClientRect(), port = document.querySelector('#portbody').getBoundingClientRect();
  const rows = [...document.querySelectorAll('#portbody .pttbl .ptcr')].filter(r => r.querySelector('.ptcf'));
  const last = rows.length ? rows[rows.length - 1].getBoundingClientRect() : q;
  const w = rows.length ? getComputedStyle(rows[0].querySelector('.ptcf')) : null;
  return { found: true, text: sec.textContent.trim(), rows: rows.length, top: Math.round(q.top), bottom: Math.round(last.bottom),
    portTop: Math.round(port.top), portBottom: Math.round(port.bottom), viewport: innerHeight,
    inView: q.top >= port.top - 1 && last.bottom <= Math.min(port.bottom, innerHeight) + 1,
    fontPx: w ? parseFloat(w.fontSize) : null, clipped: rows.some(r => r.querySelector('.ptcf').getBoundingClientRect().right > port.right + 1),
    words: rows.slice(0, 3).map(r => [r.querySelector('b').textContent, r.querySelector('.ptcf').textContent]) }; });
const before = await vis(); say('the row before any scroll', before);
n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-before-scroll.png') });
let scrolled = 0;
if (before.found && !before.inView) { const port = await (await p.$('#portbody')).boundingBox(); await p.mouse.move(port.x + port.width / 2, port.y + port.height / 2);
  for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 120); scrolled += 120; await wait(60); if ((await vis()).inView) break; } }
const after = await vis(); say('the row after scrolling the portrait by wheel', Object.assign({ wheel: scrolled }, after));
await p.evaluate(() => { const sec = [...document.querySelectorAll('#portbody .ptsec')].find(x => /^alive during the request/.test(x.textContent));
  sec.style.outline = '3px solid #ff2d9b'; sec.style.outlineOffset = '4px'; });
n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-alive.png') });
{ const e = await p.$('#port'), r = await e.boundingBox(); await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-alive-portrait-only.png'), clip: { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, H - r.y) } }); }
say('the rows it draws', await p.$$eval('#portbody .pttbl .ptcr', els => els.filter(e => e.querySelector('.ptcf')).map(e => [e.querySelector('b').textContent, e.querySelector('.ptcf').textContent])));
{ const rows = await p.$$('#portbody .pttbl .ptcr');            // the card that answers the four
  for (const e of rows) { const nm = await e.$eval('b', x => x.textContent).catch(() => null);
    if (nm === 'idempotency_key') { await e.scrollIntoViewIfNeeded(); const bx = await e.boundingBox(); await p.mouse.move(bx.x + 40, bx.y + bx.height / 2, { steps: 4 }); await wait(700);
      say('its card says', await p.evaluate(() => { const c = [...document.querySelectorAll('#hover, [id*="hover"], [class*="hcard"]')].find(x => (x.offsetParent !== null || getComputedStyle(x).opacity === '1') && (x.textContent || '').trim()); return c ? (c.textContent || '').replace(/\s+/g, ' ').slice(0, 260) : null; }));
      n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-its-card.png'), clip: { x: Math.max(0, bx.x - 40), y: Math.max(0, bx.y - 200), width: 900, height: 420 } }); break; } } }
// the keyboard route, from INSIDE the data group (where the operator stood): B · Q · Q · F
await p.reload(); await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 });
{ const e = await p.$('#cmd [data-cmd="grp-data"]'), bx = await e.boundingBox(); await p.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2); await wait(400); }
for (const k of ['b', 'q', 'q', 'c']) { await p.keyboard.press(k); await wait(450); }
say('keys B · Q · Q · C open', await p.evaluate(() => (document.getElementById('porthd').textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)));
say('page errors', errs);
fs.writeFileSync(path.join(OUT, 'walk.json'), JSON.stringify({ viewport: [W, H], log }, null, 1));
await b.close();
