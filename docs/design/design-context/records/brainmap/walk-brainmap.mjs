/* walk-brainmap.mjs — REAL mouse clicks only, from a cold load of the brain map through the two things D-021 and D-022 added:
   the By stage grouping (his eight-row spine, two rules) and the Keep-only CONTROL that a click can never turn on.

     node docs/design/design-context/records/brainmap/walk-brainmap.mjs      # writes brainmap-shots/walk/*.png · browser-gated, run it ALONE (~30 s)

   A click path he is asked to follow comes from a walk like this one — mouse clicks at the control's centre, the words read off
   the controls, a picture per step — or it is not handed over (the standing rule since leftovers piece 10). */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const REPO = '/home/khujta/projects/gabe_lens', HERE = REPO + '/docs/design/design-context/records/brainmap';   // a RECORD since 2026-09-23 (the page retired, D-024)
const OUT = HERE + '/brainmap-shots/walk';
const { chromium } = require(path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable', args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 2200, height: 1400 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + HERE + '/brainmap-endpoint.html');
/* a cold load: the rails this page remembers are cleared, so the walk starts where a first reader starts */
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await p.reload(); await p.waitForFunction('document.querySelectorAll("#plane .node").length > 0', { timeout: 20000 });
const wait = ms => p.waitForTimeout(ms); let n = 0;
const settle = async () => { await p.waitForFunction('!document.getElementById("plane").classList.contains("still")', { timeout: 8000 }).catch(() => {}); await wait(420); };
const shot = async (name) => { n++; await p.mouse.move(5, 1390); await wait(220); await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-' + name + '.png') }); };
const step = async (name, sel, note) => {
  const el = await p.$(sel); if (!el) { console.log('MISSING', name, sel); return false; }
  await p.mouse.move(5, 1390); await wait(180); await el.scrollIntoViewIfNeeded();
  await p.$eval(sel, e => { e.style.outline = '3px solid #ff2d9b'; e.style.outlineOffset = '3px'; });
  n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2, '0') + '-' + name + '.png') });
  const t = (await el.evaluate(x => (x.textContent || '').trim().replace(/\s+/g, ' '))).slice(0, 60);
  await p.$$eval('[style*="ff2d9b"]', els => els.forEach(e => { e.style.outline = ''; e.style.outlineOffset = ''; }));
  const bx = await el.boundingBox(); await p.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2);
  await settle(); console.log('step ' + n + ' · ' + name + ' → clicked "' + t + '"' + (note ? '  (' + note + ')' : ''));
  return true; };
const nodeSel = async (rx) => {
  const keys = await p.$$eval('#plane .node', els => els.map(e => [e.dataset.pkey, (e.textContent || '').trim().replace(/\s+/g, ' ')]));
  const hit = keys.find(k => rx.test(k[1])); return hit ? '#plane .node[data-pkey="' + hit[0] + '"]' : null; };
const quiet = () => p.$$eval('#plane .node', els => [els.length, els.filter(e => e.dataset.quiet === 'true' || e.classList.contains('quiet')).length]);

console.log('rails:', await p.$$eval('#rail .rgrp .rl', e => e.map(x => (x.textContent || '').trim())));
console.log('groupings:', await p.$$eval('#rail [data-grp]', e => e.map(x => x.dataset.grp + '=' + (x.querySelector('.k') || {}).textContent)));
await shot('cold-load');
// 1 · the By stage grouping — his own spine as the first level
await step('grouping-by-stage', '#rail [data-grp="stage"]', 'the grouping rail, third option');
console.log('rule options:', await p.$$eval('#rail [data-srule]', e => e.map(x => x.dataset.srule + '=' + (x.querySelector('.k') || {}).textContent + ' · ' + ((x.querySelector('.sp') || {}).textContent || ''))));
console.log('first level drawn:', await p.$$eval('#plane .node[data-depth="1"]', e => e.map(x => (x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 42))));
console.log('note under the rail:', (await p.textContent('#grp-note').catch(() => '')).trim().slice(0, 200));
await shot('by-stage-every');
// 2 · the rule as recorded in D-021 — a block that spans rows goes under Across the stages
await step('rule-as-recorded', '#rail [data-srule="one"]', 'the sub-option D-021 describes');
console.log('first level under the recorded rule:', await p.$$eval('#plane .node[data-depth="1"]', e => e.map(x => (x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 42))));
await shot('by-stage-one');
await step('rule-every-stage', '#rail [data-srule="every"]', 'back to the pick');
// 3 · a click SHOWS (option C) — it never turns the filter on. Under By stage the first level is his spine, so a row
//     is opened first and the blocks it holds appear under it.
const gate = await nodeSel(/^GATE/);
if (gate) await step('open-a-row', gate, 'one row of the spine');
const blk = await nodeSel(/^Gates and decisions/);
if (blk) { await step('click-a-block', blk, 'one block the row holds');
  console.log('after a click on a node · keep-only pressed?', await p.getAttribute('#keep-btn', 'aria-pressed'), '· nodes/quiet', await quiet()); }
await shot('a-click-only-shows');
// 4 · Keep only — its own control, and what it says while it is on
console.log('the button reads:', (await p.textContent('#keep-btn').catch(() => '')).trim(),
  '· disabled?', await p.$eval('#keep-btn', e => e.disabled));
await step('keep-only-on', '#keep-btn', 'the Filter group at the end of the rail');
console.log('KEEP ON · nodes/quiet', await quiet(), '· chip:', (await p.textContent('.keepchip').catch(() => '(no chip)')).trim().replace(/\s+/g, ' ').slice(0, 190));
await shot('keep-only-on');
// 5 · it survives a placement change
await step('placement-sideways', '#rail [data-lay="B"]', 'the placement rail');
console.log('after the placement change · pressed?', await p.getAttribute('#keep-btn', 'aria-pressed'), '· nodes/quiet', await quiet());
await shot('keep-survives-placement');
// 6 · removing it brings every node back
await step('keep-only-off', '#keep-btn', 'the same button, now Remove');
console.log('KEEP OFF · nodes/quiet', await quiet());
await shot('keep-removed');
console.log('page errors:', errs.slice(0, 3));
await b.close();
