import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// defaults per the screenshot
ok(await T('window.__lvltest.layout()')==='force', 'default Entities = Force (operator round 26)');
ok(await T('window.__lvltest.cluster()')==='usecase', 'default Cluster = Use case');
ok(await T('window.__lvltest.inside()')==='force', 'default Inside = Force');
ok(await T('window.__lvltest.depth()')===5, 'default highlight depth = 5 (operator round 26)');
await T('window.__lvltest.setDepth(1)');   // hop-isolation checks start from 1

// select a handler on trace at depth 1 → only hop1
await T("window.__lvltest.set('trace')");
await pg.evaluate(() => { const fs=[...document.querySelectorAll('.fnode')];
  const hit=fs.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.includes('handler')));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
let h = await T('window.__lvltest.hopCounts()');
console.log('  depth1 hops:', JSON.stringify(h));
ok(h[1]>0 && h[2]===0, 'depth 1: only hop-1 edges highlighted ('+h[1]+')');

// crank to 3 via the GEAR — deeper hops light with decaying boldness
await pg.click('#gear'); await pg.click('#depthSeg button[data-d="3"]');
h = await T('window.__lvltest.hopCounts()');
console.log('  depth3 hops:', JSON.stringify(h));
ok(h[1]>0 && h[2]>0, 'depth 3: hop-2 edges light up ('+h[2]+')');
const widths = await pg.evaluate(() => {
  const w = c => { const e=document.querySelector('.'+c); return e?parseFloat(getComputedStyle(e).strokeWidth):0; };
  return [w('e-hop1'), w('e-hop2'), w('e-hop3')].filter(x=>x>0);
});
console.log('  widths:', widths.join(' > '));
ok(widths.length>=2 && widths.every((w,i)=>i===0||w<widths[i-1]), 'boldness DECAYS per hop ('+widths.join(' > ')+')');

// depth 5 reaches further or saturates without error
await pg.click('#depthSeg button[data-d="5"]');
h = await T('window.__lvltest.hopCounts()');
const total5 = Object.values(h).reduce((a,b)=>a+b,0);
ok(total5>0, 'depth 5 highlights the reachable web ('+JSON.stringify(h)+')');
// back to 1 → thin again
await pg.click('#depthSeg button[data-d="1"]');
h = await T('window.__lvltest.hopCounts()');
ok(h[2]===0 && h[1]>0, 'back to depth 1: deeper hops cleared');

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl22 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
