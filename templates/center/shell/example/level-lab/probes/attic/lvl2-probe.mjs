import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T=async fn=>pg.evaluate(fn);

// gradients: one per pair-direction, entity-colour amalgamation
const grads = await T('window.__lvltest.gradients()');
ok(grads>=30, 'entity edges carry source→target colour gradients ('+grads+')');
// gradient stops actually use the two entity colours
const stopsOk = await T(`(()=>{
  const g=document.querySelector('defs linearGradient'); if(!g) return false;
  const s=[...g.querySelectorAll('stop')].map(x=>x.getAttribute('stop-color'));
  return s.length===2 && s[0]!==s[1];
})()`);
ok(stopsOk, 'a gradient blends two DIFFERENT entity colours');

// clickable edges → relationship detail
ok(await T('window.__lvltest.hitPaths()')>=30, 'every edge has a fat invisible hit path');
await T('window.__lvltest.clickFirstEdge()');
const ptxt = await T('window.__lvltest.panelText()');
ok(ptxt.includes('relationship kinds'), 'clicking an edge opens the relationship detail');

// opposite bows exist for two-direction pairs
const bows = await T('window.__lvltest.bowSides()');
ok(bows.pairsBothDirs>0, 'two-direction pairs exist and are bowed apart ('+bows.pairsBothDirs+')');

// gear: Ring → Force moves anchors · Flow arranges FK columns
const ring = await T('window.__lvltest.entPos()');
await T("window.__lvltest.setLayout('force')");
const force = await T('window.__lvltest.entPos()');
let moved=0; for(const k in ring){ if(Math.hypot(ring[k][0]-force[k][0], ring[k][1]-force[k][1])>15) moved++; }
ok(moved>=5, 'gear: Force layout moves entity anchors ('+moved+'/7)');
await T("window.__lvltest.setLayout('flow')");
const flow = await T('window.__lvltest.entPos()');
// flow: auth (the FK sink) must sit LEFT of recipe (a dependent)
ok(flow['auth'][0] < flow['recipe'][0], 'gear: Flow puts the FK sink (auth) left of its dependents');
// fn clusters follow the anchors: switch to functions level, containers near new anchors
await T("window.__lvltest.set('functions')");
ok(await T('window.__lvltest.counts()').then(c=>c.fnodes)>=35, 'L3 still renders after layout change (clusters follow anchors)');
await T("window.__lvltest.setLayout('ring')");
await T("window.__lvltest.set('entities')");
ok(await T("window.__lvltest.layout()")==='ring', 'gear returns to Ring');

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl2 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
