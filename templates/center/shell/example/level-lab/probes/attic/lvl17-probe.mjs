import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage({ viewport:{ width:1280, height:800 } }); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// two rows: every LEVEL button above every LENS button
const rows = await pg.evaluate(() => {
  const top = sel => Math.min(...[...document.querySelectorAll(sel)].map(b=>b.getBoundingClientRect().top));
  const bot = sel => Math.max(...[...document.querySelectorAll(sel)].map(b=>b.getBoundingClientRect().bottom));
  return { levelsBottom: bot('#levels button'), lensTop: top('#guardsbtn,#hubsbtn,#pressbtn,#testsbtn,#conns,#gear') };
});
ok(rows.lensTop >= rows.levelsBottom-2, 'two-row header: levels on row 1, lenses+gear on row 2');

// gear panel opens FULLY inside the viewport
await pg.click('#gear');
const gp = await pg.evaluate(() => { const r=document.getElementById('gearpanel').getBoundingClientRect();
  return { inX: r.right<=window.innerWidth-2 && r.left>=0, inY: r.bottom<=window.innerHeight,
           segs: [...document.querySelectorAll('#gearpanel .seg button')].every(b=>{const q=b.getBoundingClientRect(); const p=document.getElementById('gearpanel').getBoundingClientRect(); return q.right<=p.right+1;}) }; });
ok(gp.inX && gp.inY, 'gear panel fully inside the viewport (no right-edge clipping)');
ok(gp.segs, 'every pill sits inside the panel (no overflow past its border)');

// applicability: on Entities, Inside + Cluster rows are greyed; on Pieces Inside is live
const inRowOp = () => T("getComputedStyle(document.getElementById('inRow')).opacity");
const clRowOp = () => T("getComputedStyle(document.getElementById('clRow')).opacity");
ok(parseFloat(await inRowOp())<1 && parseFloat(await clRowOp())<1, 'L1: Inside + Cluster rows greyed (not applicable)');
await T("window.__lvltest.set('pieces')");
ok(parseFloat(await inRowOp())===1, 'L2: Inside row live');
ok(parseFloat(await clRowOp())<1, 'L2: Cluster row greyed');
// Inside via REAL click still rearranges on L2
const before = await T("(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
await pg.click('#inSeg button[data-in="grid"]');
const after = await T("(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
ok(before!==after, 'L2: Inside=Grid via the panel rearranges');
await pg.click('#inSeg button[data-in="tiers"]');
// trace: Cluster live, Inside greyed
await T("window.__lvltest.set('trace')");
ok(parseFloat(await clRowOp())===1 && parseFloat(await inRowOp())<1, 'L5: Cluster live · Inside greyed (the "not working" mystery, made honest)');
await pg.click('#clSeg button[data-cl="tests"]');
ok(await T('window.__lvltest.cluster()')==='tests', 'L5: cluster switch works from the reorganized panel');
await T("window.__lvltest.setCluster('kind')");

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl17 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
