/* walk-fold.mjs — REAL mouse clicks only, from a cold load of the endpoint lab through the FOLDED brain map (D-024): the section
   map tab with the brain map's groupings, its field lights, Keep only and the three places the map can sit.

     flock "$BROWSER_SERIAL" node docs/design/workflow-panel/walk-fold.mjs    # VW/VH override 2560×1400 · writes shots/fold/*.png + walk.json · browser-gated, run it ALONE (~30 s)

   A click path he is asked to follow comes from a walk like this one (D-025.4): the mouse moves to the centre of the control, the
   words on the control are read off the page and written into the log, and a picture is taken per step. Nothing is picked by a
   script call. Each picture is taken AFTER the step, with the control the step used ringed in pink (the page's own outline for
   a lit field is its accent colour, so the two never read as one), and the mouse parked away from the panels unless the step
   IS a hover.
   Cold load: the map's remembered rails (browser storage, `eplab.mapnav` and every other key the page wrote) are cleared and
   the page is loaded again, so the walk starts on the picks, not on the last session.
   What the walk measures beside each picture (outlined · dimmed · where the map sits) is READ off the page's classes, to say in
   the log what the picture shows; it never drives the page. */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..'), OUT = path.join(HERE, 'shots/fold');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const { chromium } = require(PW);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.env.VW || 2560), H = Number(process.env.VH || 1400);   // his screen: the lab's wings are tuned at 2560, and at 1920 the map's right column sits past the window's edge
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
const LAB = 'file://' + path.join(REPO, 'docs/design/workflow-panel/endpoint-lab.html');
const wait = ms => p.waitForTimeout(ms), log = [], say = (k, v) => { log.push([k, v]); console.log(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
const words = el => el.evaluate(e => (e.textContent || '').trim().replace(/\s+/g, ' '));
const PARK = [W - 6, H - 6];                                       // bottom-right corner: over nothing that lights or opens a card
const park = async () => { await p.mouse.move(PARK[0], PARK[1]); await p.evaluate(() => window.hoverHide && window.hoverHide()); await wait(250); };

/* find a control BY ITS WORDS, among the visible elements a selector names — the walk reads the page the way a person does */
async function byWords(sel, rx, label, quiet) {
  for (const e of await p.$$(sel)) { if (!(await e.isVisible())) continue; const t = await words(e); if (rx.test(t)) return e; }
  if (!quiet) say('MISSING ' + (label || String(rx)), sel); return null; }
/* a finder: the control a selector names whose words match — asked before the step and again (quietly) after it */
const W_ = (sel, rx, label) => quiet => byWords(sel, rx, label, quiet);
const labLeft = () => p.$eval('#lab', e => Math.round(e.scrollLeft));
const inRow = (rowRx, label, sub) => async quiet => { const r = await byWords('#smtree .smrow', rowRx, label, quiet); return r && r.$(sub); };
const ring = el => el && el.evaluate(e => { e.dataset.wring = '1'; e.style.outline = '3px solid #ff2d9b'; e.style.outlineOffset = '2px'; });
const unring = () => p.$$eval('[data-wring]', els => els.forEach(e => { e.style.outline = ''; e.style.outlineOffset = ''; delete e.dataset.wring; }));
let n = 0;
async function shot(name, ringEl) { if (ringEl) { try { await ring(ringEl); } catch (_) {} }
  n++; const f = String(n).padStart(2, '0') + '-' + name + '.png'; await p.screenshot({ path: path.join(OUT, f) }); await unring(); return f; }
/* what the bench shows right now — read off the page's classes, for the log only */
const bench = () => p.evaluate(() => {
  const inView = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const q = s => [...document.querySelectorAll(s)];
  const P = document.getElementById('panel');
  return { part: P && P.dataset.tab, outlined: q('.fl-hit').length, outlinedInView: q('.fl-hit').filter(inView).length,
    faded: q('.fl-dim').length, quiet: q('.fl-quiet').length,
    mapAt: (['#rt-map', '#mapcol', '#mapbelow'].find(s => { const h = document.querySelector(s); return h && h.contains(document.getElementById('smwrap')); }) || '?'),
    mapTopInView: (() => { const m = document.getElementById('smtree'); if (!m) return null; const r = m.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; })(),
    line: (document.getElementById('smfl') || {}).textContent || null,
    keepBar: (() => { const k = document.getElementById('mkeep'); return k && !k.hidden ? (k.textContent || '').trim().replace(/\s+/g, ' ') : null; })() }; });
/* one step: the mouse goes to the control's centre and clicks (or only rests, for a hover); then the picture. `find` finds the
   control by its words; it is asked again after the click, because a click redraws the tree and the ring must land on the
   control as it is drawn NOW */
async function step(name, find, what, { hover = false, keepMouse = false, after = null } = {}) {
  const el = await find(); if (!el) return null;
  await el.scrollIntoViewIfNeeded(); const t = await words(el), bx = await el.boundingBox();
  const cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
  if (hover) { await p.mouse.move(cx - 30, cy); await wait(80); await p.mouse.move(cx, cy); await wait(700); }
  else { await p.mouse.click(cx, cy); await wait(650); if (!keepMouse) await park(); }
  const now = hover ? el : await (after || find)(true).catch(() => null);   // `after`: the control that answers when the one clicked is gone
  const f = await shot(name, now);
  const s = await bench();
  say('step ' + n + ' · ' + name, { did: hover ? 'rest the mouse on' : 'click', words: t.slice(0, 90), at: [Math.round(cx), Math.round(cy)], picture: f, what, bench: s });
  return s; }

// ── COLD LOAD: every remembered rail cleared, then the page loaded again ─────────────────────────────────────────
await p.goto(LAB); await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 });
say('remembered before clearing', await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = (localStorage.getItem(k) || '').slice(0, 80); } return o; }));
await p.evaluate(() => localStorage.clear());
await p.goto(LAB); await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 }); await park();
say('rail tabs', await p.$$eval('#railtabs .rtb', els => els.map(e => (e.textContent || '').trim())));
say('part buttons', await p.$$eval('#tabs .tab', els => els.map(e => (e.textContent || '').trim().replace(/\s+/g, ' '))));
say('step 1 · cold-load', { picture: await shot('cold-load'), bench: await bench() });

// ── 1 · open the map ─────────────────────────────────────────────────────────────────────────────────────────────
await step('open-the-map', W_('#railtabs .rtb', /map/i, 'the map tab'), 'the rail shows the section map: its groupings, the line and Keep only, then the tree of eleven blocks');

// ── 2 · pick By stage ────────────────────────────────────────────────────────────────────────────────────────────
await step('pick-by-stage', W_('#smnav .smno[data-opt="grp"] .smnb', /^By stage/, 'By stage'), 'the tree regroups under his rows EDGE … ANSWER, the UNCAUGHT bay, the CLIENT screen, then Across the stages');
say('rows under By stage', await p.$$eval('#smtree .smn[data-kind="stage"]', els => els.map(e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70))));

// ── 3 · open a row (its fold, the small triangle left of it: the row's own click is a Show) ─────────────────────────
await step('open-the-handler-row', inRow(/^\S*\s*[▸▾]\s*HANDLER/, 'the HANDLER row', '.smfold'), 'the HANDLER row opens: the five blocks proposed for it, each with where its page is and how many of its fields the bench draws');
say('blocks under HANDLER', await p.$$eval('#smtree .smb', els => els.filter(e => e.offsetParent).map(e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80))));

// ── 4 · hover a field. Under By stage the tree stops at the block (three levels); the note under the tree says where the
//        fields are listed. A person follows it: Flat, the block's fold, then rests the mouse on a field drawn here. ──────────
const deep = await p.$eval('#smdeep', e => e.hidden ? null : (e.textContent || '').trim()).catch(() => null);
say('under By stage, the note under the tree says', deep);
say('fields in the tree under By stage', await p.$$eval('#smtree .sma', els => els.filter(e => e.offsetParent).length));
await step('the-note-sends-you-to-flat', W_('#smnav .smno[data-opt="grp"] .smnb', /^Flat/, 'Flat'), 'Flat lists every block with its fields folded under it');
await step('open-data-effects', inRow(/Data effects/, 'the Data effects row', '.smfold'), 'the block Data effects opens: its fields, each saying whether the bench draws it here');
await step('hover-a-field', W_('#smtree .sma[data-fd="here"]', /drawn here · places \d+ · in view [1-9]/, 'a field drawn here and in view'), 'the mouse rests on the field: every element the panels draw for it is outlined, the rest of the bench fades, and the field\'s card opens', { hover: true });
say('hover card while resting on the field', await p.evaluate(() => { const h = document.getElementById('hover');   /* the page's one hover card: position fixed, so it has no offsetParent — shown = not hidden */
  if (!h || h.hidden || !(h.textContent || '').trim()) return null;
  const r = h.getBoundingClientRect();
  const lit = [...document.querySelectorAll('.fl-hit')].filter(x => { const q = x.getBoundingClientRect(); return q.width && q.height; });
  const covered = lit.filter(x => { const q = x.getBoundingClientRect(); return q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; }).length;
  return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], outlined: lit.length, outlinedUnderTheCard: covered }; }));
await park();

// ── 5 · Show a block: back to By stage, the HANDLER row is still open; a click on Functions moves the bench ─────────────
await step('back-to-by-stage', W_('#smnav .smno[data-opt="grp"] .smnb', /^By stage/, 'By stage'), 'By stage again; the HANDLER row is still open');
await step('show-functions', W_('#smtree .smb', /^Functions/, 'the Functions block'), 'the bench moves to the Functions part and every element carrying the block\'s fields is outlined; a click fades nothing');

// ── 6 · switch the part: the tree re-lights for the part the bench is on now ─────────────────────────────────────────
const litBefore = await p.$$eval('#smtree .smb[data-lit="true"]', els => els.map(e => (e.querySelector('.smbn') || e).textContent.trim()));
await step('switch-to-tests', W_('#tabs .tab', /Tests/, 'the Tests part'), 'the bench draws Tests; the tree lights the Proof block and every row recounts how many of its fields are drawn here');
/* the block the bench lit may sit below the rail's fold: a person rolls the wheel over the map until it shows. "Shows" = the
   element at its centre IS the block (not clipped by the rail, not under anything) */
const litShows = () => p.evaluate(() => { const e = document.querySelector('#smtree .smb[data-lit="true"]'); if (!e) return null;
  const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 10);
  if (y < 0 || y >= innerHeight) return false; const hit = document.elementFromPoint(x, y); return !!hit && e.contains(hit); });
if ((await litShows()) === false) { const t = await p.$eval('#smtree', e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, Math.min(r.bottom, innerHeight) - 60]; });
  await p.mouse.move(t[0], t[1]); for (let i = 0; i < 12 && !(await litShows()); i++) { await p.mouse.wheel(0, 160); await wait(160); } await park();
  const lit = await p.$('#smtree .smb[data-lit="true"]');
  say('step ' + (n + 1) + ' · roll-the-map-to-the-lit-block', { did: 'wheel down over the map', picture: await shot('roll-the-map-to-the-lit-block', lit), shows: await litShows(), bench: await bench() }); }
say('lit block before → after the part switch', { before: litBefore, after: await p.$$eval('#smtree .smb[data-lit="true"]', els => els.map(e => (e.querySelector('.smbn') || e).textContent.trim())) });

// ── 7 · Keep only ────────────────────────────────────────────────────────────────────────────────────────────────
{ const k = await byWords('#smkeepb', /^Keep only/, 'the Keep only button'); say('Keep only button before', k && { words: await words(k), disabled: await k.isDisabled() }); }
await step('keep-only-on', W_('#smkeepb', /\S/, 'the Keep only button'), 'Keep only is on: the bench quiets every element that does not carry the block\'s fields, the tree quiets every node that does not, and a bar at the top of the rail says so');

// ── 8 · where the map sits: the right column, then full width below ───────────────────────────────────────────────
await step('map-in-the-right-column', W_('#smplace .smnb', /^right column/, 'right column'), 'the map moves to a column right of the panels; the bench and its lights do not change');
{ // at 2560 the right column makes the lab wider than the window: the lab slides left to show the column and the rail, with
  // the placement control, leaves the window. A person slides it back with the wheel (Shift + wheel) over the panels.
  const sl = await labLeft(); say('the lab slid left to show the right column, by (px)', sl);
  if (sl > 0) { await p.mouse.move(W / 2, 700); for (let i = 0; i < 10 && (await labLeft()) > 0; i++) { await p.mouse.wheel(-200, 0); await wait(150); } await park();
    say('step ' + (n + 1) + ' · slide-the-lab-back-left', { did: 'Shift + wheel over the panels, toward the left', picture: await shot('slide-the-lab-back-left'), slidNow: await labLeft(), bench: await bench() }); } }
await step('map-full-width-below', W_('#smplace .smnb', /^below/, 'below'), 'the map moves under the rail, the middle and the command panel, full width');
{ // the map below the panels is under the fold of the window: a person scrolls down with the wheel to see it
  const t = await bench();
  if (!t.mapTopInView) { await p.mouse.move(W / 2, H / 2); for (let i = 0; i < 12 && !(await bench()).mapTopInView; i++) { await p.mouse.wheel(0, 300); await wait(200); } await park();
    say('step ' + (n + 1) + ' · scroll-down-to-the-map', { did: 'wheel down over the page', picture: await shot('scroll-down-to-the-map'), bench: await bench() }); } }

// ── 9 · remove Keep only (the button on the bar at the top of the rail) ─────────────────────────────────────────────
await p.mouse.move(W / 2, H / 2); for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, -400); await wait(120); } await park();
await step('remove-keep-only', W_('#mkeep .mkoff', /\S/, 'the remove button on the Keep only bar'), 'Keep only is off: nothing is quiet on the bench or in the tree, the bar at the top of the rail is gone and the button in the map offers Keep only again (ringed); the kept outline stays', { after: W_('#smkeepb', /^Keep only/, 'the Keep only button') });

say('page errors', errs.slice(0, 5));
fs.writeFileSync(path.join(OUT, 'walk.json'), JSON.stringify({ viewport: [W, H], steps: log }, null, 1));
await b.close();
