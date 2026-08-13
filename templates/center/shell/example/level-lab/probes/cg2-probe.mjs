// Round 46 — icon PARITY: the preview's Classic set is byte-identical to the
// level-lab's geometry; the switcher swaps sets live without losing the stage.
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const lab = await b.newPage();
await lab.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html');
await lab.waitForFunction('window.__lvlready===true',{timeout:8000});
await lab.evaluate("window.__lvltest.set('trace')");
const sig = (page) => page.evaluate(() => {
  const first = sel => document.querySelector(sel);
  const d = el => el ? (el.getAttribute('d')||el.tagName) : null;
  const model = first('#canvas .piece[data-kind="model"] path, #canvas g path[fill-opacity="0.9"]');
  const schemaP = [...document.querySelectorAll('#canvas path')].find(p=>(p.getAttribute('d')||'').startsWith('M8 3H7'));
  const fnP = [...document.querySelectorAll('#canvas path')].find(p=>(p.getAttribute('d')||'').startsWith('M9 17c2'));
  return { model:d(model), schema:d(schemaP), fn:d(fnP) }; });
const labSig = await sig(lab);

const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/change-graph-lab.html');
await pg.waitForFunction('window.__cgready===true',{timeout:8000});
const cgSig = await sig(pg);
console.log('  lab model d:', (labSig.model||'').slice(0,40));
console.log('  cg  model d:', (cgSig.model||'').slice(0,40));

// 1 · Classic = the lab's exact geometry
ok(!!labSig.model && labSig.model===cgSig.model, 'MODEL geometry byte-identical to the lab');
ok(!!labSig.schema && labSig.schema===cgSig.schema, 'SCHEMA braces byte-identical to the lab');
ok(!!labSig.fn && labSig.fn===cgSig.fn, 'ƒ-curve byte-identical to the lab');
ok(await pg.evaluate(() => window.__cgtest.iconset())==='classic', 'Classic is the default set');

// 2 · the switcher: Lucide changes geometry, stage survives
await pg.click('#stages button[data-st="review"]');
await pg.click('#icoSeg button[data-ico="lucide"]');
const luc = await pg.evaluate(() => ({
  set: window.__cgtest.iconset(),
  stage: window.__cgtest.stage(),
  zap: [...document.querySelectorAll('#canvas path')].some(p=>(p.getAttribute('d')||'').startsWith('M13 2 3 14')),
  drift: document.querySelectorAll('#canvas .drift-ring').length }));
ok(luc.set==='lucide' && luc.zap, 'Lucide set draws its own geometry (zap endpoints)');
ok(luc.stage==='review' && luc.drift===1, 'the stage + overlays survive the icon switch');

// 3 · Solid set distinct; Classic returns to parity
await pg.click('#icoSeg button[data-ico="solid"]');
const solid = await pg.evaluate(() => [...document.querySelectorAll('#canvas rect')].filter(r=>+r.getAttribute('rx')>=5).length);
ok(solid>0, 'Solid set draws filled shapes ('+solid+')');
await pg.click('#icoSeg button[data-ico="classic"]');
const back = await sig(pg);
ok(back.model===labSig.model && back.fn===labSig.fn, 'Classic restores exact lab parity');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`cg2 (icon parity + sets): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
