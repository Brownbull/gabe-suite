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
const tb = await T('window.__lvltest.tBadges()');
console.log('  D2 badges:', JSON.stringify(tb));
ok(tb.has>=150, 'proven pieces wear count badges ('+tb.has+') — models+schemas+endpoints');
ok(tb.none>=20, 'unproven pieces wear the hollow marker ('+tb.none+') — the coverage signal');
ok(tb.web>=5, 'web-corpus coverage dots present ('+tb.web+')');
// no red in gustify (junit all green)
ok(await T("(()=>[...document.querySelectorAll('.tbadge.has')].every(r=>r.getAttribute('fill')!=='var(--m-delete)'))()"),
   'no red badges — matches gustify junit (0 failed)');
// toggle hides everything test-related
await T('window.__lvltest.toggleTests()');
const off = await T('window.__lvltest.tBadges()');
ok(off.has===0 && off.none===0, 'Tests OFF removes all badges');
await T('window.__lvltest.toggleTests()');
// panel: proven piece shows counts; unproven says none
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>g.querySelector('.tbadge.has'));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
ok((await T('window.__lvltest.panelText()')).includes('case(s)'), 'panel shows case count + corpus split');
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>g.querySelector('.tbadge.none'));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
ok((await T('window.__lvltest.panelText()')).includes('none — unproven'), 'panel names the unproven state');
// L3 fns carry badges too (the 11 py-mapped ones)
await T("window.__lvltest.set('functions')");
const fb = await T('window.__lvltest.tBadges()');
ok(fb.has>=8, 'L3: function badges present ('+fb.has+')');
ok(fb.none>=25, 'L3: unmapped fns wear the hollow marker ('+fb.none+' — the TS side has no fn-level mapping, honestly)');
// trace cores carry them
await T("window.__lvltest.set('trace')");
ok(await T('window.__lvltest.tBadges()').then(x=>x.has)>=30, 'trace cores carry proof badges');
console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl10 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
