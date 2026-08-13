import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
await T("window.__lvltest.set('pieces')");

// default OFF — the base view is unchanged
let m = await T('window.__lvltest.marks()');
ok(m.shields===0 && m.hubs===0 && m.gods===0 && m.heat===0, 'lenses default OFF — base view untouched');

// GUARDS lens: shields on guarded pieces + endpoints
await T("window.__lvltest.toggleLens('guards')");
m = await T('window.__lvltest.marks()');
console.log('  guards on:', JSON.stringify(m));
ok(m.shields>=30, 'Guards ON: validator shields drawn ('+m.shields+' — 14 pieces + 21 endpoints)');
await T("window.__lvltest.toggleLens('guards')");
ok(await T('window.__lvltest.marks()').then(x=>x.shields)===0, 'Guards OFF removes shields');

// HUBS lens: usage rings + god halos
await T("window.__lvltest.toggleLens('hubs')");
m = await T('window.__lvltest.marks()');
console.log('  hubs on:', JSON.stringify(m));
ok(m.hubs>=5, 'Hubs ON: fan-in rings on hub pieces ('+m.hubs+')');
ok(m.gods>=6, 'Hubs ON: god halos drawn ('+m.gods+')');
await T("window.__lvltest.toggleLens('hubs')");

// PRESSURE lens: heat halos from the phase archive
await T("window.__lvltest.toggleLens('press')");
m = await T('window.__lvltest.marks()');
console.log('  pressure on:', JSON.stringify(m));
ok(m.heat>=4, 'Pressure ON: change-heat halos ('+m.heat+' — the archive-touched pieces)');
await T("window.__lvltest.toggleLens('press')");

// all three stack + panel rows
await T("window.__lvltest.toggleLens('guards')"); await T("window.__lvltest.toggleLens('hubs')"); await T("window.__lvltest.toggleLens('press')");
m = await T('window.__lvltest.marks()');
ok(m.shields>0 && m.hubs>0 && m.heat>0, 'lenses STACK (all three at once)');
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.startsWith('model Recipe ')||x.textContent==='model Recipe · table recipes'));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
const ptxt = await T('window.__lvltest.panelText()');
ok(ptxt.includes('fan-in'), 'panel: fan-in row (Recipe usage 9 · GOD)');
ok(ptxt.includes('guards'), 'panel: guards row');
// trace + L3 carry marks too
await T("window.__lvltest.set('trace')");
ok(await T('window.__lvltest.marks()').then(x=>x.shields+x.hubs+x.heat)>0, 'trace cores carry lens marks');
await T("window.__lvltest.set('functions')");
ok(await T('window.__lvltest.marks()').then(x=>x.hubs)>=1, 'L3: fn fan-in rings ('+await T('window.__lvltest.marks()').then(x=>x.hubs)+')');

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl11 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
