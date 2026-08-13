import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
const panel = () => T('window.__lvltest.panelText()');
const panelIcons = () => T("document.querySelectorAll('aside .irow svg').length");

// TRACE: click Recipe (god + hub + tests + guards) in the recipe core
await T("window.__lvltest.set('trace')");
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.startsWith('model Recipe ')||x.textContent==='model Recipe · table recipes'));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
let txt = await panel(); let icons = await panelIcons();
console.log('  Recipe card icons:', icons);
ok(txt.includes('what the symbols on this element mean'), 'trace: the indicator card renders');
ok(icons>=5, 'the card shows the DIAGRAM ICONS ('+icons+' svgs: cylinder, badge, shield, ring, halo…)');
ok(txt.includes('database cylinder') && txt.includes('table-backed'), 'kind icon decoded (cylinder = model)');
ok(txt.includes('test case') && txt.includes('count pill'), 'the badge NUMBER is decoded (test cases, states, corpora)');
ok(txt.includes('fan-in ring') && txt.includes('usage 9'), 'hub ring decoded with its real number');
ok(txt.includes('GOD piece'), 'god halo decoded');
ok(txt.includes('validator') || txt.includes('no shield'), 'guard state decoded either way');

// an UNPROVEN piece: hollow icon decoded
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>g.querySelector('.tbadge.none'));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
txt = await panel();
ok(txt.includes('hollow dashed circle') && txt.includes('UNPROVEN'), 'unproven: the hollow marker is decoded');

// ENDPOINT: bolt + method + badge decoded
await T("window.__lvltest.set('pieces')");
await pg.evaluate(() => {
  const ms=[...document.querySelectorAll('.epmark')];
  const hit=ms.find(g=>g.querySelector('.tbadge.has'));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
txt = await panel();
ok(txt.includes('bolt') && txt.includes('HTTP method'), 'endpoint: the bolt + method colour decoded');
ok(txt.includes('test case'), 'endpoint: its badge number decoded');

// FUNCTION (L3): ƒ + layer + handler decoded
await T("window.__lvltest.set('functions')");
await pg.evaluate(() => {
  const fs=[...document.querySelectorAll('.fnode')];
  const hit=fs.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.includes('handler')));
  (hit||fs[0]).dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
txt = await panel();
ok(txt.includes('ƒ curve') && txt.includes('layer'), 'function: the ƒ icon + layer colour decoded');

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl13 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
