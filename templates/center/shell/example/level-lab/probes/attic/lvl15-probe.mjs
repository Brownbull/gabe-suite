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

const contiguity = () => pg.evaluate(() => {
  const vp=document.getElementById('vp');
  const xy=g=>{const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');return m?[+m[1],+m[2]]:null;};
  const conts=[...vp.querySelectorAll('circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  let checked=0, bad=0;
  conts.forEach(c=>{
    const inCore=[...vp.querySelectorAll('.piece[data-grp]')].map(g=>({p:xy(g),k:g.getAttribute('data-grp')}))
      .filter(o=>o.p&&o.k&&Math.hypot(o.p[0]-c.x,o.p[1]-c.y)<c.r*0.75);
    if(new Set(inCore.map(o=>o.k)).size<2 || inCore.length<4) return;
    checked++;
    const s=inCore.map(o=>({a:Math.atan2(o.p[1]-c.y,o.p[0]-c.x),k:o.k})).sort((a,b)=>a.a-b.a);
    let sw=0; for(let i=0;i<s.length;i++) if(s[i].k!==s[(i+1)%s.length].k) sw++;
    if(sw>2) bad++;
  });
  return {checked,bad};
});

// default = Kind
ok(await T('window.__lvltest.cluster()')==='usecase', 'default cluster = Use case (operator screenshot)');
await T("window.__lvltest.setCluster('kind')");
let g = await T('window.__lvltest.coreGroups()');
ok(g.models>0 && g.schemas>0, 'Kind groups populated ('+JSON.stringify(g)+')');
let c = await contiguity();
ok(c.checked>=3 && c.bad===0, 'Kind: contiguous arcs ('+c.checked+' entities)');

// Tests clustering: proven | unproven arcs — the coverage "dark side"
await pg.click('#gear'); await pg.click('#clSeg button[data-cl="tests"]');
ok(await T('window.__lvltest.cluster()')==='tests', 'gear click sets cluster=Tests');
g = await T('window.__lvltest.coreGroups()');
ok(g.proven>0 && g.unproven>0, 'Tests groups populated ('+JSON.stringify(g)+')');
c = await contiguity();
ok(c.bad===0 && c.checked>=2, 'Tests: proven/unproven form contiguous arcs ('+c.checked+')');
const sect = await T("[...document.querySelectorAll('[data-sector]')].map(t=>t.textContent).filter((v,i,a)=>a.indexOf(v)===i).sort().join(',')");
ok(sect.includes('proven') && sect.includes('unproven'), 'sector labels renamed to the property ('+sect+')');

// Guards clustering
await pg.click('#clSeg button[data-cl="guards"]');
g = await T('window.__lvltest.coreGroups()');
ok((g.guarded||0)+(g.unguarded||0)>0 && g.unguarded>0, 'Guards groups populated ('+JSON.stringify(g)+')');

// Flow = the wire-shortest placement, no sectors
await T("window.__lvltest.setCluster('flow')");
ok(await T("document.querySelectorAll('[data-sector]').length")===0, 'Flow: no sector furniture (placement by mean angle)');
await T("window.__lvltest.setCluster('kind')");

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl15 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
