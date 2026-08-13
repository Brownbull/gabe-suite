// Round 47 — the icon-set switcher joins the LAB's gear: Classic default,
// Lucide/Solid swap live with camera + selection intact, hook parity.
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

await T("window.__lvltest.set('trace')");
ok(await T('window.__lvltest.icons()')==='classic', 'Classic is the default set');
const gearRow = await pg.evaluate(() => [...document.querySelectorAll('#icoSeg button')].map(x=>x.getAttribute('data-ico')).join(','));
ok(gearRow==='classic,lucide,solid', 'gear carries the Icons row ('+gearRow+')');

// classic signature present
const hasClassic = await pg.evaluate(() => [...document.querySelectorAll('#canvas path')]
  .some(p=>(p.getAttribute('d')||'').startsWith('M-6.8 -3 v6')));
ok(hasClassic, 'Classic model geometry drawn (the settled cylinder)');

// switch to Lucide THROUGH THE GEAR with a selection live — camera + selection survive
await pg.evaluate(() => document.querySelector('#canvas [data-key="cls:auth|Household"]')
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
const camBefore = await T('window.__lvltest.cam()');
await pg.click('#gear'); await pg.click('#icoSeg button[data-ico="lucide"]');
const luc = await pg.evaluate(() => ({
  set: window.__lvltest.icons(),
  zap: [...document.querySelectorAll('#canvas path')].some(p=>(p.getAttribute('d')||'').startsWith('M13 2 3 14')),
  db: [...document.querySelectorAll('#canvas path')].some(p=>(p.getAttribute('d')||'').startsWith('M3 5v14')),
  sel: document.querySelectorAll('#canvas .selring').length }));
const camAfter = await T('window.__lvltest.cam()');
ok(luc.set==='lucide' && luc.zap && luc.db, 'Lucide set draws its zap endpoints + database barrels');
ok(luc.sel===0, 'the selection clears on re-render (the settled semantics — same as cluster/line switches)');
ok(camBefore.zoom===camAfter.zoom && camBefore.panX===camAfter.panX, 'the camera stays put (renderKeepView)');

// Solid distinct, then Classic restores the settled geometry
await pg.click('#icoSeg button[data-ico="solid"]');
ok(await pg.evaluate(() => [...document.querySelectorAll('#canvas rect')].filter(r=>+(r.getAttribute('rx')||0)>=5 && r.getAttribute('fill')!=='none').length)>10,
  'Solid set draws filled shapes');
await pg.click('#icoSeg button[data-ico="classic"]');
ok(await pg.evaluate(() => [...document.querySelectorAll('#canvas path')]
  .some(p=>(p.getAttribute('d')||'').startsWith('M-6.8 -3 v6'))), 'Classic restores the settled geometry');
ok(await T('window.__lvltest.icons()')==='classic', 'hook agrees');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl40 (icon sets in the lab): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
