import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
await T("window.__lvltest.set('trace')");

// SECTOR CONTIGUITY: within each container's core, sort pieces by angle — the kind
// sequence must switch at most twice around the circle (two arcs = two boundaries)
const sectors = await pg.evaluate(() => {
  const vp = document.getElementById('vp');
  const xy = g => { const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||''); return m?[+m[1],+m[2]]:null; };
  const conts = [...vp.querySelectorAll('circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  let checked=0, bad=0, labels=0;
  [...vp.querySelectorAll('text.sub2')].forEach(t=>{ if(t.textContent==='models'||t.textContent==='schemas') labels++; });
  conts.forEach(c=>{
    const inCore=[...vp.querySelectorAll('.piece')].map(g=>({p:xy(g), k:g.getAttribute('data-kind')}))
      .filter(o=>o.p && Math.hypot(o.p[0]-c.x,o.p[1]-c.y)<c.r*0.75);
    const kinds=new Set(inCore.map(o=>o.k));
    if(kinds.size<2 || inCore.length<4) return;
    checked++;
    const byAngle=inCore.map(o=>({a:Math.atan2(o.p[1]-c.y,o.p[0]-c.x), k:o.k})).sort((a,b)=>a.a-b.a);
    let switches=0;
    for(let i=0;i<byAngle.length;i++) if(byAngle[i].k!==byAngle[(i+1)%byAngle.length].k) switches++;
    if(switches>2) bad++;
  });
  return {checked, bad, labels};
});
console.log('  sector check:', JSON.stringify(sectors));
ok(sectors.checked>=3, 'several entities carry BOTH kinds in the core ('+sectors.checked+')');
ok(sectors.bad===0, 'KIND SECTORS hold: models and schemas are contiguous arcs (≤2 boundaries per core)');
ok(sectors.labels>=6, 'sector arc labels drawn (models/schemas ×'+sectors.labels+')');
// wires + onion still intact
ok(await T("document.querySelectorAll('#vp .e-touch').length")>100, 'trace wires intact');
console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl14 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
