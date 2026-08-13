// Bubble containment gate (rewritten round 35 — the replayed original was
// heredoc-corrupted): every inner item sits inside at least one cluster bubble,
// bubbles stay inside their entity container, endpoints stay ON the border.
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

await T("window.__lvltest.set('trace')");
for(const mode of ['usecase','kind']){
  await T(`window.__lvltest.setCluster('${mode}')`);
  // dump geometry as JSON, compute in Node (in-page regexes mangle escapes)
  const geo = await pg.evaluate(() => {
    const tf = el => { const m=/translate\(([-0-9.]+)[ ,]+([-0-9.]+)\)/.exec(el.getAttribute('transform')||''); return m?{x:+m[1],y:+m[2]}:null; };
    const items=[...document.querySelectorAll('#canvas .piece,#canvas .fnode')].map(tf).filter(Boolean);
    const bubbles=[...document.querySelectorAll('#canvas .bubble')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
    const conts=[...document.querySelectorAll('#canvas circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
    return {items, bubbles, conts}; });
  let inside=0;
  geo.items.forEach(it=>{ if(geo.bubbles.some(bu=>Math.hypot(it.x-bu.x,it.y-bu.y)<=bu.r+1)) inside++; });
  let bIn=0;
  geo.bubbles.forEach(bu=>{ if(geo.conts.some(c=>Math.hypot(bu.x-c.x,bu.y-c.y)+bu.r<=c.r+2)) bIn++; });
  console.log(`  ${mode}: items in a bubble ${inside}/${geo.items.length} · bubbles in container ${bIn}/${geo.bubbles.length}`);
  ok(geo.items.length>200 && inside===geo.items.length, `${mode}: every inner item enclosed by a bubble (${inside}/${geo.items.length})`);
  ok(bIn===geo.bubbles.length && geo.bubbles.length>10, `${mode}: every bubble inside its entity container (${bIn}/${geo.bubbles.length})`);
}
const border = await T('window.__lvltest.epOnBorder()');
ok(border.ok===67 && border.bad===0, `all 67 endpoints ON the container border (${border.ok}/${border.ok+border.bad})`);
await T("window.__lvltest.setCluster('usecase')");

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl16 probe: ${P}/${F}`);
await b.close(); process.exit(F?1:0);
