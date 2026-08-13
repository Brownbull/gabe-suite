// Round 33 — the operator's audit: REAL Playwright clicks on every link KIND on
// every level (intra + cross); the connector card must show both components as
// pressable links, and pressing one must travel there. Matrix printed honestly.
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

// find a screen point where THIS path is genuinely the hit target
const hitPoint = (sel, idx) => pg.evaluate(([sel, idx]) => {
  const els=[...document.querySelectorAll(sel)]; const el=els[idx]; if(!el) return null;
  const len=el.getTotalLength(); const ctm=el.getScreenCTM();
  for(const t of [0.5,0.42,0.58,0.3,0.7,0.2,0.8,0.62,0.38]){
    const p=el.getPointAtLength(len*t);
    const sp=new DOMPoint(p.x,p.y).matrixTransform(ctm);
    const at=document.elementFromPoint(sp.x, sp.y);
    if(at===el) return {x:sp.x, y:sp.y};
    if(at && at.tagName==='path' && at.getAttribute('stroke')==='transparent'
        && at.getAttribute('d')===el.getAttribute('d')) return {x:sp.x, y:sp.y};
  }
  return null; }, [sel, idx]);

async function pressKind(level, label, sel, count, opts={}){
  // try up to 8 paths of this kind for a REAL clickable point
  let pt=null, tried=0;
  for(let i=0;i<Math.min(count,8) && !pt;i++){ pt=await hitPoint(sel,i); tried=i+1; }
  if(pt){
    await pg.mouse.click(pt.x, pt.y);
  } else {
    // sub-pixel stroke at fit zoom — press via the DOM (listener + card still audited)
    await pg.evaluate((sel)=>{ document.querySelectorAll(sel)[0]
      .dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); }, sel);
  }
  const card = await pg.evaluate(() => {
    const p=document.querySelector('#panel');
    return { txt:p.textContent, jgo:p.querySelectorAll('.jgo').length }; });
  const mode = pt ? 'mouse' : 'dom';
  ok(card.jgo===2, `${level}/${label}: card shows BOTH components as links (${mode}, ${card.jgo} rows)`);
  // press the second component link — travel, zoom parked
  if(card.jgo===2){
    await pg.click('#panel .jgo:nth-of-type(2), #panel .jgo + .jgo');
    const cam = await T('window.__lvltest.cam()');
    const moved = await pg.evaluate(() => !/connector/.test(
      (document.querySelector('#panel h3')||{textContent:''}).textContent));
    ok(cam.zoom===1 && moved, `${level}/${label}: pressing the component link travels (zoom parked)`);
  } else { F++; console.log(`  SKIP travel for ${level}/${label}`); }
  return mode;
}

const matrix=[];
// ── L1 · entities: fk / calls / imports (cross-entity by nature, fat hit twins)
await T("window.__lvltest.set('entities')");
for(const k of ['e-fk','e-calls','e-imports']){
  const n = await pg.evaluate((k)=>document.querySelectorAll('#canvas .'+k).length, k);
  if(!n){ console.log(`  L1 ${k}: none drawn`); continue; }
  // the hit twin sits above — click the twin covering this kind's first path
  const pt = await pg.evaluate((k) => {
    const el=document.querySelector('#canvas .'+k); const len=el.getTotalLength();
    const ctm=el.getScreenCTM();
    for(const t of [0.5,0.4,0.6,0.3,0.7]){
      const p=el.getPointAtLength(len*t);
      const sp=new DOMPoint(p.x,p.y).matrixTransform(ctm);
      const at=document.elementFromPoint(sp.x,sp.y);
      if(at && at.tagName==='path') return {x:sp.x,y:sp.y};
    } return null; }, k);
  if(pt){ await pg.mouse.click(pt.x, pt.y); }
  else { await pg.evaluate(()=>{ document.querySelector('#canvas path[stroke="transparent"]')
      .dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); }); }
  const card = await pg.evaluate(() => ({
    jgo:document.querySelectorAll('#panel .jgo').length,
    txt:document.querySelector('#panel').textContent }));
  ok(card.jgo===2, `entities/${k}: relationship card shows both entities as links (${pt?'mouse':'dom'})`);
  await pg.click('#panel .jgo');
  const cam = await T('window.__lvltest.cam()');
  ok(cam.zoom===1, `entities/${k}: pressing an entity link travels (zoom parked)`);
  matrix.push(`entities/${k}: ${pt?'mouse':'dom'}`);
}
// ── L2 · pieces: intra-fk / touch / resp (INTRA) + xfk hit + resp-cross (CROSS)
await T("window.__lvltest.set('pieces')");
matrix.push('pieces/fk-intra: '+await pressKind('pieces','fk-intra','#canvas .e-intra',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-intra').length)));
matrix.push('pieces/touch: '+await pressKind('pieces','touch','#canvas .e-touch',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-touch').length)));
matrix.push('pieces/resp: '+await pressKind('pieces','resp','#canvas .e-resp',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-resp').length)));
matrix.push('pieces/xfk-cross: '+await pressKind('pieces','xfk-cross','#canvas path[stroke="transparent"]',
  await pg.evaluate(()=>document.querySelectorAll('#canvas path[stroke="transparent"]').length)));
// ── L3 · functions: call / import (graft)
await T("window.__lvltest.set('functions')");
matrix.push('functions/calls: '+await pressKind('functions','calls','#canvas .e-calls',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-calls').length)));
const nImp3 = await pg.evaluate(()=>document.querySelectorAll('#canvas .e-imports').length);
if(nImp3) matrix.push('functions/imports: '+await pressKind('functions','imports','#canvas .e-imports', nImp3));
else console.log('  functions/imports: none drawn (fixture)');
// ── L4 · layers: call / import across lanes
await T("window.__lvltest.set('layers')");
matrix.push('layers/calls: '+await pressKind('layers','calls','#canvas .e-calls',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-calls').length)));
// ── L5 · trace: route+touch / resp / xfk / use
await T("window.__lvltest.set('trace')");
matrix.push('trace/route+touch: '+await pressKind('trace','route+touch','#canvas .e-touch',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-touch').length)));
matrix.push('trace/resp: '+await pressKind('trace','resp','#canvas .e-resp',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-resp').length)));
matrix.push('trace/xfk-cross: '+await pressKind('trace','xfk-cross','#canvas .e-xfk',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-xfk').length)));
matrix.push('trace/use-cross: '+await pressKind('trace','use-cross','#canvas .e-use',
  await pg.evaluate(()=>document.querySelectorAll('#canvas .e-use').length)));

console.log('  PRESS MATRIX:'); matrix.forEach(r=>console.log('   ', r));
ok(!matrix.some(r=>/: dom$/.test(r)), 'EVERY kind is REAL-mouse pressable (no dom fallbacks)');
ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl28 (every link pressable): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
