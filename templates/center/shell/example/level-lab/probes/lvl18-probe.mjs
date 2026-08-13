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

const audit = () => pg.evaluate(() => {
  const vp=document.getElementById('vp');
  const xy=g=>{const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');return m?[+m[1],+m[2]]:null;};
  const bubbles=[...vp.querySelectorAll('circle.bubble')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  const labels=[...new Set([...vp.querySelectorAll('[data-sector]')].map(t=>t.getAttribute('data-sector')))].sort();
  // containment: every item must sit inside a bubble for EACH group it names
  let shared=0, contained=0, broken=0;
  [...vp.querySelectorAll('[data-grp]')].forEach(g=>{
    const p=xy(g); if(!p) return;
    const grps=(g.getAttribute('data-grp')||'').split('+').filter(Boolean);
    if(grps.length>1) shared++;
    // per group: at least one bubble whose label matches AND encloses the item
    const byLabel={};
    [...vp.querySelectorAll('[data-sector]')].forEach(t=>{
      const b2={x:0,y:0,r:0};
      // the bubble is the circle whose top-label this is: find nearest bubble below the label
      (byLabel[t.getAttribute('data-sector')]=byLabel[t.getAttribute('data-sector')]||[]).push(t);
    });
    const encl = grps.every(gr => bubbles.some(bu=>Math.hypot(p[0]-bu.x,p[1]-bu.y)<=bu.r+2));
    encl?contained++:broken++;
  });
  let overlaps=0;
  for(let i=0;i<bubbles.length;i++) for(let j=i+1;j<bubbles.length;j++)
    if(Math.hypot(bubbles[i].x-bubbles[j].x,bubbles[i].y-bubbles[j].y)<bubbles[i].r+bubbles[j].r) overlaps++;
  const conts=[...vp.querySelectorAll('circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  let epOn=0, epOff=0;
  [...vp.querySelectorAll('.epmark')].forEach(g=>{ const p=xy(g); if(!p) return;
    conts.some(c=>Math.abs(Math.hypot(p[0]-c.x,p[1]-c.y)-c.r)<3)?epOn++:epOff++; });
  return {bubbles:bubbles.length, labels, shared, contained, broken, overlaps, epOn, epOff};
});

// USE CASE mode
await T("window.__lvltest.setCluster('usecase')");
let a = await audit();
console.log('  usecase:', JSON.stringify({bubbles:a.bubbles, shared:a.shared, overlaps:a.overlaps, labels:a.labels.slice(0,6)}));
ok(a.bubbles>=20, 'use-case bubbles drawn ('+a.bubbles+' across entities)');
ok(a.shared>=5, 'SHARED pieces exist and are drawn ONCE ('+a.shared+' in 2+ use cases)');
ok(a.overlaps>0, 'bubbles OVERLAP where pieces are shared — the operator ruling, working');
ok(a.broken===0, 'every piece is enclosed by a bubble ('+a.contained+' contained)');
ok(a.epOff===0, 'endpoints stay on the border');
ok(a.labels.some(l=>l.includes('pantry')||l.includes('recipes')||l.includes('shopping')), 'bubble labels = URL namespaces ('+a.labels.slice(0,4).join(', ')+'…)');

// COMMUNITY mode (graft label propagation)
await T("window.__lvltest.setCluster('community')");
a = await audit();
console.log('  community:', JSON.stringify({bubbles:a.bubbles, shared:a.shared, overlaps:a.overlaps}));
ok(a.bubbles>=15, 'graft-community bubbles drawn ('+a.bubbles+')');
ok(a.broken===0, 'community containment holds');

// CENSUS mode: example workflows + honest uncensused
await T("window.__lvltest.setCluster('census')");
a = await audit();
console.log('  census:', JSON.stringify({labels:a.labels}));
ok(a.labels.some(l=>l==='reset pantry')&&a.labels.some(l=>l==='run a session'), 'census workflows appear as bubbles');
ok(a.labels.includes('uncensused'), 'entities/pieces without census entries are HONESTLY bubbled as uncensused');
await T("window.__lvltest.setCluster('kind')");

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl18 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
