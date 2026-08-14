import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage({ viewport:{ width:1280, height:800 } }); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
// roster: exactly the six (FK join added 2026-08-13 — the operator's union-find filter)
const roster = await T("[...document.querySelectorAll('#clSeg button')].map(b=>b.getAttribute('data-cl')).join(',')");
ok(roster==='kind,tests,guards,usecase,community,fk', 'cluster roster = kind·tests·guards·usecase·community·fk ('+roster+')');
// zoom depth: on the big trace, ctrl-zoom until labels are readable — effective scale ≥3
await T("window.__lvltest.set('trace')");
for(let i=0;i<40;i++) await pg.evaluate(() => { const st=document.getElementById('stage'); const r=st.getBoundingClientRect();
  st.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,deltaY:-240,ctrlKey:true})); });
const eff = await pg.evaluate(() => {
  const m=/scale\(([-0-9.e]+)\)/.exec(document.getElementById('vp').getAttribute('transform')||''); return m?+m[1]:0; });
console.log('  max effective scale reached:', eff.toFixed(2));
ok(eff>=3.0, 'zoom reaches ≥3× real pixels on the giant trace scene ('+eff.toFixed(2)+'×) — labels readable');
// a label's rendered font size at max zoom
const px = await pg.evaluate(() => { const t=document.querySelector('#vp .plabel'); if(!t) return 0;
  return t.getBoundingClientRect().height; });
ok(px>=20, 'a piece label renders ≥20px tall at max zoom ('+Math.round(px)+'px)');
console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl20 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
