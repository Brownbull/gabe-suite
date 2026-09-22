/* walk-section-map.mjs — REAL mouse clicks only, from a cold load of the endpoint lab through the SECTION MAP tab, BOTH WAYS.

     node docs/design/workflow-panel/walk-section-map.mjs      # writes shots/section-map/*.png · browser-gated, run it ALONE (~25 s)

   A click path he is asked to follow comes from a walk like this one — mouse clicks at the control's centre, the words read off
   the controls, a picture per step — or it is not handed over (the standing rule since leftovers piece 10). It drives the tab
   in both directions: a block moves the bench, the bench lights a block, a block with no surface says so and moves nothing. */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const REPO = '/home/khujta/projects/gabe_lens', OUT = REPO + '/docs/design/workflow-panel/shots/section-map';
const { chromium } = require(path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable', args: ['--use-angle=swiftshader','--no-sandbox','--disable-gpu-sandbox','--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 2560, height: 1400 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + REPO + '/docs/design/workflow-panel/endpoint-lab.html'); await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 });
const wait = ms => p.waitForTimeout(ms); let n = 0;
const step = async (name, sel, note) => { const el = await p.$(sel); if (!el) { console.log('MISSING', name, sel); return false; }
  await p.mouse.move(5, 1390); await wait(180); await el.scrollIntoViewIfNeeded();
  await p.$eval(sel, e => { e.style.outline = '3px solid #ff2d9b'; e.style.outlineOffset = '3px'; });
  n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2,'0') + '-' + name + '.png') });
  const t = (await el.evaluate(x => (x.textContent||'').trim().replace(/\s+/g,' '))).slice(0, 52);
  await p.$$eval('[style*="ff2d9b"]', els => els.forEach(e => { e.style.outline=''; e.style.outlineOffset=''; }));
  const bx = await el.boundingBox(); await p.mouse.click(bx.x + bx.width/2, bx.y + bx.height/2); await wait(520);
  console.log('step ' + n + ' · ' + name + ' → clicked "' + t + '"' + (note ? '  (' + note + ')' : '')); return true; };
console.log('rail tabs:', await p.$$eval('#railtabs .rtb', e => e.map(x => x.dataset.rt + '=' + (x.textContent||'').trim())));
await step('rail-section-map', '#railtabs .rtb[data-rt="map"]', 'the third tab, beside controls and no-loss');
console.log('lead line:', await p.$eval('#rt-map .smlead', e => (e.textContent||'').trim().replace(/\s+/g,' ').slice(0,110)).catch(()=>null));
console.log('blocks drawn:', await p.$$eval('#rt-map .smb', e => e.length));
console.log('rows:', await p.$$eval('#rt-map .smb', e => e.slice(0,4).map(x => (x.textContent||'').trim().replace(/\s+/g,' ').slice(0,64))));
n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2,'0') + '-the-tab.png') });
// MAP → BENCH
const before = await p.evaluate(() => ({ part: window.__labPart ? window.__labPart() : document.querySelector('#tabs .tab.on') && document.querySelector('#tabs .tab.on').dataset.tab }));
const blocks = await p.$$('#rt-map .smb');
for (const e of blocks) { const t = await e.evaluate(x => (x.textContent||'').trim()); if (/^Functions/.test(t)) { await e.scrollIntoViewIfNeeded(); const bx = await e.boundingBox(); await p.mouse.click(bx.x+20, bx.y+bx.height/2); await wait(700); break; } }
const after = await p.evaluate(() => (document.querySelector('#tabs .tab.on')||{}).dataset && document.querySelector('#tabs .tab.on').dataset.tab);
console.log('MAP → BENCH: part', JSON.stringify(before.part), '→', JSON.stringify(after));
console.log('lead now:', await p.$eval('#rt-map .smlead', e => (e.textContent||'').trim().replace(/\s+/g,' ').slice(0,110)).catch(()=>null));
n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2,'0') + '-map-moved-the-bench.png') });
// BENCH → MAP
await p.click('#tabs .tab[data-tab="security"]'); await wait(700);
console.log('BENCH → MAP: lit now:', await p.$$eval('#rt-map .smb', e => e.filter(x => x.dataset.lit === 'true' || x.classList.contains('lit')).map(x => (x.textContent||'').trim().split(/\s{2,}/)[0].slice(0,36))));
console.log('lead now:', await p.$eval('#rt-map .smlead', e => (e.textContent||'').trim().replace(/\s+/g,' ').slice(0,110)).catch(()=>null));
n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2,'0') + '-bench-lit-the-map.png') });
// the block with NO surface
for (const e of await p.$$('#rt-map .smb')) { const t = await e.evaluate(x => (x.textContent||'').trim()); if (/^Overview/.test(t)) { await e.scrollIntoViewIfNeeded(); const bx = await e.boundingBox(); await p.mouse.click(bx.x+20, bx.y+bx.height/2); await wait(700); break; } }
console.log('NO SURFACE · part stayed:', await p.evaluate(() => document.querySelector('#tabs .tab.on').dataset.tab));
console.log('  it says:', await p.$eval('#rt-map .smsay', e => (e.textContent||'').trim().replace(/\s+/g,' ').slice(0,170)).catch(()=>'(no #smsay)'));
n++; await p.screenshot({ path: path.join(OUT, String(n).padStart(2,'0') + '-no-surface-says-so.png') });
// the feedback copy
console.log('feedback note:\n' + (await p.evaluate(() => window.COPYTXT.sectionmap())).split('\n').map(l => '   ' + l).join('\n'));
console.log('page errors:', errs.slice(0,3));
await b.close();
