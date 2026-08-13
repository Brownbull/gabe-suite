import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage({ viewport:{ width:1280, height:800 } }); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
await T("window.__lvltest.set('trace')");

// 1 · a cluster switch KEEPS the camera
await pg.evaluate(() => { const st=document.getElementById('stage'); const r=st.getBoundingClientRect();
  st.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:r.left+400,clientY:r.top+300,deltaY:-240,ctrlKey:true}));
  st.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:r.left+400,clientY:r.top+300,deltaY:180})); });
const v0 = await T('window.__lvltest.view()');
await pg.click('#gear'); await pg.click('#clSeg button[data-cl="usecase"]');
const v1 = await T('window.__lvltest.view()');
ok(v0.zoom===v1.zoom && v0.panX===v1.panX && v0.panY===v1.panY,
   'cluster switch preserves pan+zoom exactly ('+JSON.stringify(v0)+')');
// via the hook too
await T("window.__lvltest.setCluster('kind')");
const v2 = await T('window.__lvltest.view()');
ok(v2.zoom===v0.zoom && v2.panX===v0.panX, 'setCluster also preserves the view');

// 2 · Inside layouts reshape the bubble INTERIORS
ok(parseFloat(await T("getComputedStyle(document.getElementById('inRow')).opacity"))===1,
   'Inside row is LIVE on trace (bubbles honor it)');
const posOf = "(()=>{const o=[];document.querySelectorAll('[data-grp]').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()";
await pg.click('#inSeg button[data-in="tiers"]');
const ringP = await T(posOf);
await pg.click('#inSeg button[data-in="force"]');
const forceP = await T(posOf);
ok(ringP!==forceP, 'Ring → Force rearranges the bubble interiors');
// quantify in Node
const rA = await pg.evaluate(() => [...document.querySelectorAll('[data-grp]')].map(g=>{const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');return m?[+m[1],+m[2]]:[0,0];}));
await pg.click('#inSeg button[data-in="tiers"]');
const rB = await pg.evaluate(() => [...document.querySelectorAll('[data-grp]')].map(g=>{const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');return m?[+m[1],+m[2]]:[0,0];}));
let moved=0; for(let i=0;i<Math.min(rA.length,rB.length);i++) if(Math.hypot(rA[i][0]-rB[i][0],rA[i][1]-rB[i][1])>10) moved++;
ok(moved>rA.length/4, 'a real share of pieces relocate between inside layouts ('+moved+'/'+rA.length+')');
// containment still holds under force
await pg.click('#inSeg button[data-in="force"]');
const contain = await pg.evaluate(() => {
  const vp=document.getElementById('vp');
  const xy=g=>{const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');return m?[+m[1],+m[2]]:null;};
  const bubbles=[...vp.querySelectorAll('circle.bubble')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  let out=0;
  [...vp.querySelectorAll('[data-grp]')].forEach(g=>{ const p=xy(g); if(!p) return;
    if(!bubbles.some(bu=>Math.hypot(p[0]-bu.x,p[1]-bu.y)<=bu.r+2)) out++; });
  return out;
});
ok(contain===0, 'containment holds under Force (enclosing bubbles)');
await pg.click('#inSeg button[data-in="tiers"]');

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl19 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
