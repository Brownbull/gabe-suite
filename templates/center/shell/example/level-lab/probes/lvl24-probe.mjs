// Round 29 — Alt+wheel steps the highlight depth: up = deeper (→5), down =
// shallower (→1), clamped; gear segment mirrors; other wheel modes untouched.
// Real WheelEvents (page.mouse.wheel never reaches passive:false handlers).
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
const wheel = (dy, mods) => pg.evaluate(([dy, mods]) => {
  document.getElementById('stage').dispatchEvent(new WheelEvent('wheel',
    Object.assign({deltaY:dy, bubbles:true, cancelable:true, clientX:400, clientY:300}, mods)));
}, [dy, mods]);
const depth = () => T('window.__lvltest.depth()');
const gearOn = () => pg.evaluate(() => {
  return +document.getElementById('depthSlider').value; });

await T("window.__lvltest.set('trace')");
ok(await depth()===5, 'starts at default depth 5');

// scroll DOWN with Alt → shallower, one step per notch, clamps at 1
for(const want of [4,3,2,1]){
  await wheel(100, {altKey:true});
  ok(await depth()===want, 'alt+scroll-down steps to '+want+', got '+await depth());
}
await wheel(100, {altKey:true}); await wheel(100, {altKey:true});
ok(await depth()===1, 'clamps at 1 (extra down-notches ignored)');
ok(await gearOn()===1, 'depth slider mirrors depth 1, got '+await gearOn());

// scroll UP with Alt → deeper, clamps at 5
for(const want of [2,3,4,5]){
  await wheel(-100, {altKey:true});
  ok(await depth()===want, 'alt+scroll-up steps to '+want+', got '+await depth());
}
await wheel(-100, {altKey:true});
ok(await depth()===5, 'clamps at 5 (extra up-notches ignored)');
ok(await gearOn()===5, 'depth slider mirrors depth 5');

// trackpad drip: small deltas accumulate to ONE step per ~40px, not one per event
await pg.evaluate(() => { for(let i=0;i<4;i++)
  document.getElementById('stage').dispatchEvent(new WheelEvent('wheel',
    {deltaY:12, altKey:true, bubbles:true, cancelable:true})); });
ok(await depth()===4, 'four 12px drips = one step (48px>40), got '+await depth());

// the OTHER wheel modes stay themselves: alt never zooms, plain never steps depth
const z0 = await T('window.__lvltest.zoomVal ? window.__lvltest.zoomVal() : null');
await wheel(100, {});                     // plain scroll = pan
ok(await depth()===4, 'plain scroll leaves depth alone');
await wheel(-100, {ctrlKey:true});        // ctrl = zoom
ok(await depth()===4, 'ctrl+scroll (zoom) leaves depth alone');

// live re-highlight: with a hub selected, alt-stepping re-runs the BFS
await T('window.__lvltest.setDepth(1)');
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.startsWith('model CookingSession')));
  hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const h1 = await T('window.__lvltest.hopCounts()');
await wheel(-100, {altKey:true});         // deeper by wheel while selected
const h2 = await T('window.__lvltest.hopCounts()');
console.log('  hops d1:', JSON.stringify(h1), '→ d2:', JSON.stringify(h2));
ok(h1[2]===0 && h2[2]>0, 'alt-step while selected re-lights hop-2 live ('+h2[2]+')');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl24 (alt-wheel depth): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
