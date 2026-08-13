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
const dump = await pg.evaluate(() => {
  const vp = document.getElementById('vp');
  const xy = g => { const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||''); return m?[+m[1],+m[2]]:null; };
  return {
    containers: [...vp.querySelectorAll('circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')})),
    eps: [...vp.querySelectorAll('.epmark')].map(xy).filter(Boolean),
    fns: [...vp.querySelectorAll('.fnode')].map(xy).filter(Boolean),
    pieces: [...vp.querySelectorAll('.piece')].map(xy).filter(Boolean),
    wires: vp.querySelectorAll('.e-touch').length,
    wiresColored: [...vp.querySelectorAll('.e-touch')].every(p=>p.style.stroke && p.style.stroke!==''),
    guides: vp.querySelectorAll('circle[stroke-dasharray]').length,
    expanders: document.querySelectorAll('.epmore').length
  };
});
ok(dump.containers.length===7, 'trace: 7 entity containers (L2 layout carried over)');
// overlap check in Node
let overlap=0;
for(let i=0;i<dump.containers.length;i++) for(let j=i+1;j<dump.containers.length;j++){
  const a=dump.containers[i], c=dump.containers[j];
  if(Math.hypot(a.x-c.x,a.y-c.y) < a.r+c.r) overlap++;
}
ok(overlap===0, 'trace: containers decluttered (0 overlaps)');
// THE ONION per container: min(ep dist) > max(fn dist) > ... fn ring between core and border
const dist=(p,c)=>Math.hypot(p[0]-c.x,p[1]-c.y);
let checked=0, bad=0;
dump.containers.forEach(c=>{
  const inC = arr => arr.filter(p=>dist(p,c)<c.r+8).map(p=>dist(p,c));
  const eps=inC(dump.eps), fns=inC(dump.fns), cls=inC(dump.pieces);
  if(!fns.length || !cls.length) return;
  checked++;
  const minEp=Math.min(...eps), maxFn=Math.max(...fns), minFn=Math.min(...fns), maxCls=Math.max(...cls);
  if(!(minEp > maxFn-1 && minFn > maxCls-1)) bad++;
});
console.log('  onion: checked', checked, 'entities · violations', bad);
ok(checked>=4, 'several entities carry the full onion ('+checked+')');
ok(bad===0, 'ONION ORDER holds: endpoints(border) > functions(ring) > data(core)');
const border = await T('window.__lvltest.epOnBorder()');
ok(border.bad===0 && border.ok>40, 'endpoints sit ON the border ('+border.ok+')');
ok(dump.wires>100, 'outside-in wires drawn ('+dump.wires+')');
ok(dump.wiresColored, 'wires wear the entity colour');
ok(dump.guides>=8, 'concentric guide rings drawn ('+dump.guides+')');
ok(dump.expanders>0, '+N more expander present');
console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl6 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
