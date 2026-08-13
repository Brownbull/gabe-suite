// Round 45 — defaults: Bowed lines · Tests OFF (Connections alone on) ·
// HALO circles: wires depart at the element circle's EDGE, never the icon.
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

// 1 · defaults
ok(await T('window.__lvltest.line()')==='bowed', 'default line curvature = Bowed');
const btns = await pg.evaluate(() => ({
  bowedOn: document.querySelector('#lineSeg button[data-line="bowed"]').classList.contains('on'),
  testsOn: document.getElementById('testsbtn').classList.contains('on'),
  connsOn: document.getElementById('conns').classList.contains('on') }));
ok(btns.bowedOn, 'gear marks Bowed as active');
ok(!btns.testsOn && btns.connsOn, 'Tests OFF · Connections ON at boot');
await T("window.__lvltest.set('trace')");
ok(await pg.evaluate(() => document.querySelectorAll('#canvas .tbadge, #canvas [class*=proof]').length)===0
   || await pg.evaluate(() => [...document.querySelectorAll('#canvas .tbadge')].every(x=>!x.checkVisibility?.() )) ,
   'no proof badges drawn at boot');
await pg.click('#testsbtn');
const withTests = await pg.evaluate(() => document.querySelectorAll('#canvas .tbadge, #canvas rect[rx="5.5"]').length);
ok(withTests>50, 'the Tests toggle brings the badges back ('+withTests+')');
await pg.click('#testsbtn');

// 2 · halo rings on inner elements
const halos = await pg.evaluate(() => ({
  n: document.querySelectorAll('#canvas .halo').length,
  items: document.querySelectorAll('#canvas .piece, #canvas .fnode, #canvas .epmark').length }));
ok(halos.n===halos.items && halos.n>200, 'every element wears its halo ('+halos.n+'/'+halos.items+')');

// 3 · wires DEPART AT THE EDGE: sampled wire endpoints sit ~HALO_R from node centres
const dep = await pg.evaluate(() => {
  const centers=[...document.querySelectorAll('#canvas .piece, #canvas .fnode, #canvas .epmark')].map(g=>{
    const m=/translate\(([-0-9.]+)[ ,]+([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');
    return m?[+m[1],+m[2]]:null; }).filter(Boolean);
  const near=(x,y)=>{ let best=1e9;
    centers.forEach(c=>{ const d=Math.hypot(c[0]-x,c[1]-y); if(d<best) best=d; });
    return best; };
  const gaps=[];
  [...document.querySelectorAll('#canvas .e-touch, #canvas .e-use')].slice(0,60).forEach(p=>{
    const m=/^M([-0-9.]+) ([-0-9.]+).*?([-0-9.]+) ([-0-9.]+)$/.exec(p.getAttribute('d')||'');
    if(m){ gaps.push(near(+m[1],+m[2])); gaps.push(near(+m[3],+m[4])); } });
  gaps.sort((a,b)=>a-b);
  return { min:gaps[0], med:gaps[Math.floor(gaps.length/2)], n:gaps.length }; });
console.log('  wire departure distance: min', dep.min?.toFixed(1), '· median', dep.med?.toFixed(1), '· n', dep.n);
ok(dep.n>80 && dep.min>=11, 'wires start >=11px from every node centre (edge of the halo), min '+dep.min?.toFixed(1));
ok(dep.med>=13 && dep.med<=16, 'median departure ~ the 14px halo radius ('+dep.med?.toFixed(1)+')');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl39 (bowed · tests-off · halo edges): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
