/* walk-all-endpoints.mjs — REAL mouse clicks only, from a cold load of all-endpoints.html through every thing a person does on it.

     node docs/design/workflow-panel/walk-all-endpoints.mjs        # writes shots/all-endpoints/*.png + walk.json · browser-gated, run it ALONE

   A click path handed to the operator comes from a walk like this one (memory: click paths from real clicks): the mouse moves to
   the control's centre and clicks, the words are read off the control, and each step is photographed with the control about to be
   clicked ringed. Nothing is selected by a script call; the page's data is READ only to know which control to look for. */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..'), OUT = path.join(HERE, 'shots/all-endpoints');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const { chromium } = require(PW);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.env.VW || 1920), H = Number(process.env.VH || 1080);
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('file://' + path.join(HERE, 'all-endpoints.html')); await p.waitForFunction('window.__allep && window.__allep.ready', { timeout: 20000 });
await p.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/^gabe:allep/.test(k)) localStorage.removeItem(k); } catch (e) {} });
await p.reload(); await p.waitForFunction('window.__allep && window.__allep.ready', { timeout: 20000 });
const wait = (ms) => p.waitForTimeout(ms), log = [], say = (k, v) => { log.push([k, v]); console.log(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
// an option is an icon square (D-034): its words are its aria-label, so a control's words are read from there first
const txt = async (sel) => p.$eval(sel, (e) => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' '));
let n = 0;
const pic = async (name, clip) => { n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-' + name + '.png'), ...(clip ? { clip } : {}) }); };
const ring = async (sel) => p.$eval(sel, (e) => { e.dataset.__ring = '1'; e.style.outline = '3px solid #ff2d9b'; e.style.outlineOffset = '2px'; });
const unring = async () => p.$$eval('[data-__ring]', (els) => els.forEach((e) => { e.style.outline = ''; e.style.outlineOffset = ''; delete e.dataset.__ring; }));
const step = async (name, sel, note) => {            // photograph with the target ringed, then click it with the mouse at its centre
  const el = await p.$(sel); if (!el) { say('MISSING ' + name, sel); return false; }
  await p.mouse.move(5, H - 10); await p.evaluate(() => window.hoverHide && window.hoverHide()); await wait(160);
  await el.scrollIntoViewIfNeeded(); await ring(sel); await wait(100);
  await pic(name);
  const box = await el.boundingBox(), label = await txt(sel);
  await unring();
  say('step ' + (n) + ' · ' + name, { click: label.slice(0, 70), at: [Math.round(box.x), Math.round(box.y)], size: [Math.round(box.width), Math.round(box.height)], note: note || null });
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await wait(400); return true; };
const rows = () => p.$$eval('#board tr.row[data-ep], #board .card[data-ep]', (els) => els.length);

// [pressed] · {dashed = my pick on a rail he has not ruled} — read off the squares' aria-labels and their drawn borders
say('rails at load', await p.$$eval('.rgrp', (gs) => gs.map((g) => (g.querySelector('.rl') || {}).textContent + ': ' + [...g.querySelectorAll('.opt')].map((o) => {
  const on = o.getAttribute('aria-checked') === 'true', dash = getComputedStyle(o).borderTopStyle === 'dashed', w = o.getAttribute('aria-label');
  return (on ? '[' : '') + (dash ? '{' + w + '}' : w) + (on ? ']' : ''); }).join(' | '))));
await pic('cold-load');
const railClip = async () => { const r = await (await p.$('#rail')).boundingBox(); return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(W - 1, r.width + 16), height: r.height + 16 }; };
await pic('the-rail', await railClip());
{ // hover one square with the real mouse: its words appear, short
  const sq = await p.$('.opt[data-rail="grp"][data-v="labels"]'), bx = await sq.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await wait(250);
  say('hover on a square', await txt('#tip')); const rc = await railClip(); await pic('hover-a-square', { ...rc, height: rc.height + 90 });
  await p.mouse.move(5, H - 10); await wait(100); }
const headClip = async () => { const bd = await (await p.$('#board')).boundingBox(); return { x: bd.x, y: Math.max(0, bd.y), width: Math.min(1100, bd.width), height: 340 }; };
await pic('shared-header-default', await headClip());
await step('shared-marked-by-a-rule', '.opt[data-rail="slook"][data-v="rule"]', 'shared marked by: a strong rule');
await pic('shared-header-rule', await headClip());
await step('shared-marked-by-a-frame', '.opt[data-rail="slook"][data-v="box"]', 'shared marked by: a frame');
await pic('shared-header-frame', await headClip());
await step('shared-back-to-the-band', '.opt[data-rail="slook"][data-v="band"]', 'shared marked by: a tinted band');
// the same three treatments with the viewer's system in DARK mode — a setting of the viewer's machine, not a control on the page
// (the page has no light/dark switch of its own); every choice on the page is still made by a real click
const LOOKS = [['band', 'a tinted band'], ['rule', 'a strong rule'], ['box', 'a frame']];
const threeLooks = async (where, clip) => { for (const [v, w] of LOOKS) {
  if (!(await p.$eval('.opt[data-rail="slook"][data-v="' + v + '"]', (e) => e.getAttribute('aria-checked') === 'true'))) await step(where + '-pick-' + v, '.opt[data-rail="slook"][data-v="' + v + '"]', 'shared marked by: ' + w);
  await p.mouse.move(5, H - 10); await p.evaluate(() => window.hoverHide && window.hoverHide()); await wait(120);
  await pic(where + '-shared-' + v, await clip()); }
  await step(where + '-back-to-the-band', '.opt[data-rail="slook"][data-v="band"]', 'shared marked by: a tinted band'); };
await p.emulateMedia({ colorScheme: 'dark' }); await wait(200); say('viewer system theme', 'dark');
await threeLooks('dark-table', headClip);
await p.emulateMedia({ colorScheme: 'light' }); await wait(200); say('viewer system theme', 'light');
say('rows at load', await rows());
{ const bd = await p.$('#board'), bx = await bd.boundingBox(); await p.mouse.move(W / 2, 400); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 120); await wait(40); } await wait(200);
  await pic('the-table-by-wheel'); say('board top after wheel', Math.round((await bd.boundingBox()).y)); }
// wheel INSIDE the board: its header must stay on top OF THE SCREEN while the rows move under it, even when the wheel has also
// carried the page past the board's top (the log says whether the column names were on screen when the photo was taken)
{ const bd = await p.$('#board'), bx = await bd.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, Math.min(H - 60, Math.max(60, bx.y + 300))); for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 120); await wait(40); } await wait(200);
  const hdr = await p.evaluate(() => { const h = document.querySelector('#board thead tr.ch th[data-col]'), bd = document.getElementById('board'); return { head: Math.round(h.getBoundingClientRect().top), board: Math.round(bd.getBoundingClientRect().top), scrolled: bd.scrollTop }; });
  hdr.onScreen = hdr.head >= 0 && hdr.head < 120;
  say('header while the board scrolls', hdr); await pic('header-stays-on-top'); }
await step('sort-by-tables', '#board thead th[data-col="tables"] .hd', 'the column header "tables"');
say('sorted says', await txt('#sortsays'));
await pic('sorted-by-tables');
await step('sort-again-reverses', '#board thead th[data-col="tables"] .hd', 'the same header, again');
say('sorted says', await txt('#sortsays'));
await step('back-to-path-order', '#board thead tr.ch th.idh .hd', 'the corner of the header row');
{ // the largest piece of the "refused" strip — read which one it is from the page, then click it by mouse
  const bin = await p.$$eval('#board thead th[data-col="e_refusal"] .sg', (ss) => ss.map((s) => [s.getAttribute('data-bin'), +s.getAttribute('data-n')]).sort((a, b) => b[1] - a[1])[0][0]);
  await step('light-a-strip-piece', '#board thead th[data-col="e_refusal"] .sg[data-bin="' + bin + '"]', 'the biggest piece of the "refused" strip');
  say('lit says', await txt('#litsays')); say('rows dimmed', await p.$$eval('#board tr.row[data-dim="true"]', (e) => e.length));
  await pic('rows-lit'); }
await step('clear-the-light', '#litclear', 'the clear link on the lit chip');
await step('group-by-ending-labels', '.opt[data-rail="grp"][data-v="labels"]', 'group by: ending labels');
say('groups', await p.$$eval('#board tr.grow', (gs) => gs.map((g) => (g.querySelector('.gn').textContent + ' · ' + g.querySelector('.gc').textContent).slice(0, 140))));
await pic('grouped-by-ending-labels');
await step('three-per-row', '.opt[data-rail="lay"][data-v="three"]', 'layout: 3 per row');
say('cards drawn', await rows());
await pic('three-per-row');
// the Shared block on a card, under each treatment, light then dark (the first cards, where the Shared block is the first run of cells)
const cardClip = async () => { const c = await (await p.$('#board .cards')).boundingBox(); return { x: c.x, y: Math.max(0, c.y), width: Math.min(W - c.x, c.width), height: 300 }; };
await threeLooks('cards', cardClip);
await p.emulateMedia({ colorScheme: 'dark' }); await wait(200); say('viewer system theme', 'dark');
await threeLooks('dark-cards', cardClip);
await p.emulateMedia({ colorScheme: 'light' }); await wait(200); say('viewer system theme', 'light');
{ const first = await p.$eval('#board .card[data-ep]', (c) => c.getAttribute('data-ep'));
  await step('open-a-card', '#board .card[data-ep="' + first + '"] .pth', 'the first card\'s path');
  say('side panel', { title: await txt('#side h3'), cmd: await p.$eval('#labcmd', (e) => e.textContent) });
  await pic('side-panel'); }
await step('close-the-panel', '#side-close', 'the close button at the top of the panel');
await step('one-per-row', '.opt[data-rail="lay"][data-v="rows"]', 'layout: one per row');
await step('group-by-entity', '.opt[data-rail="grp"][data-v="entity"]', 'group by: entity');
await step('more-information', '#more-btn', 'the more information button');
await pic('more-information-open');
say('rows at the end', await rows());
say('page errors', errs);
fs.writeFileSync(path.join(OUT, 'walk.json'), JSON.stringify({ viewport: [W, H], log }, null, 1));
await b.close();
