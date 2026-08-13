// Round 42 — the center's per-element fields join the panel (fixture-enriched):
// PURPOSE/DOCSTRING · file + 800-budget · usage bars · STRUCTURE · stored-as FKs
// · SIGNATURE · TESTED-BY case ledger with C-ids — plus the RESIZABLE panel.
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html');
await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
const panelTxt = () => pg.evaluate(() => document.querySelector('#panel').textContent);

await T("window.__lvltest.set('trace')");

// 1 · ENDPOINT card: purpose, status, file+budget, tested-by ledger with C-ids
await pg.evaluate(() => {
  const eps=[...document.querySelectorAll('#canvas .epmark')];
  const hit=eps.find(g=>[...g.querySelectorAll('title')].some(x=>(x.textContent||'').startsWith('GET /recipes ')));
  hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
let txt = await panelTxt();
ok(/purpose/i.test(txt) && txt.length>200, 'endpoint card: PURPOSE section present');
ok(/status/.test(txt), 'endpoint card: status row');
ok(/\.py/.test(txt) && / ln/.test(txt), 'endpoint card: file row with line count');
const epLedger = await pg.evaluate(() => ({
  rows: document.querySelectorAll('#panel .ptab tr').length,
  cids: document.querySelectorAll('#panel .cid').length,
  pass: document.querySelectorAll('#panel .st-pass').length }));
ok(epLedger.rows>2 && epLedger.cids>0 && epLedger.pass>0, 'endpoint card: TESTED-BY ledger with C-ids + states ('+epLedger.cids+' cids)');

// 2 · MODEL card: structure with unique chip, stored-as FKs, usage bars, tested-by tiers
await pg.evaluate(() => document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
txt = await panelTxt();
ok(/structure \(\d+ columns\)/i.test(txt), 'model card: STRUCTURE section with column count');
const mdl = await pg.evaluate(() => ({
  cols: [...document.querySelectorAll('#panel .ptab')].some(t=>/column/i.test(t.textContent)),
  uq: document.querySelectorAll('#panel .uqchip').length,
  fk: /stored as/i.test(document.querySelector('#panel').textContent),
  bars: document.querySelectorAll('#panel .pbar').length,
  via: /via route|direct/.test(document.querySelector('#panel').textContent) }));
ok(mdl.cols, 'model card: column table renders');
ok(mdl.uq>0, 'model card: unique constraint chip (user_id)');
ok(mdl.fk, 'model card: stored-as foreign keys');
ok(mdl.bars>=2, 'model card: api/internal usage bars');
ok(mdl.via, 'model card: tested-by carries tiers (direct / via route)');

// 3 · FN card: docstring, signature with return type, params honesty note
await pg.evaluate(() => {
  const fs=[...document.querySelectorAll('#canvas .fnode')];
  const hit=fs.find(g=>[...g.querySelectorAll('title')].some(x=>(x.textContent||'').startsWith('search_recipes')));
  hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
txt = await panelTxt();
ok(/docstring/i.test(txt) && /allergen exclusion|Search recipes/i.test(txt), 'fn card: DOCSTRING (real content)');
ok(/signature/i.test(txt) && /RecipeListResponse/.test(txt), 'fn card: SIGNATURE with return type');
ok(/params live in the center/i.test(txt), 'fn card: params honesty note (render-time field)');
ok(/async/.test(txt), 'fn card: async marker');

// 4 · resizable panel: drag the grip → wider; clamps; chevron still collapses
const w0 = await pg.evaluate(() => document.getElementById('sidewrap').getBoundingClientRect().width);
await pg.evaluate(() => {
  const grip=document.getElementById('panelgrip');
  const r=grip.getBoundingClientRect();
  grip.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+2, clientY:r.top+100, bubbles:true}));
  window.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left-150, clientY:r.top+100}));
  window.dispatchEvent(new PointerEvent('pointerup',{})); });
const w1 = await pg.evaluate(() => document.getElementById('sidewrap').getBoundingClientRect().width);
ok(w1>w0+120, `grip drag widens the panel (${w0}→${w1})`);
await pg.evaluate(() => {
  const grip=document.getElementById('panelgrip');
  const r=grip.getBoundingClientRect();
  grip.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+2, clientY:r.top+100, bubbles:true}));
  window.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+2000, clientY:r.top+100}));
  window.dispatchEvent(new PointerEvent('pointerup',{})); });
const w2 = await pg.evaluate(() => document.getElementById('sidewrap').getBoundingClientRect().width);
ok(w2>=278 && w2<=282, `drag clamps at the 280 floor (${w2})`);
await pg.click('#panelchev');
const min = await pg.evaluate(() => ({ w: document.getElementById('sidewrap').getBoundingClientRect().width,
  grip: getComputedStyle(document.getElementById('panelgrip')).display }));
ok(Math.abs(min.w-42)<3 && min.grip==='none', 'chevron still collapses; grip hides when minimized');
await pg.click('#panelchev');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl36 (center fields in the panel · resize): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
