// Round 36 — header rework: gear far-right · depth SLIDER (alt-wheel syncs it
// live, tooltip names the hotkey) · icon-only toggles with tooltips · chevron
// panel collapse · legend + controls corner boxes (min/max) · journeys slot.
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

// 1 · row-2 geometry: journeys slot LEFT, control cluster RIGHT, gear right-most
const row2 = await pg.evaluate(() => {
  const r = id => document.getElementById(id).getBoundingClientRect();
  const j=r('journeys'), g=r('gear'), c=r('ctrl2'), s=r('depthSlider');
  const others=['depthCtl','guardsbtn','hubsbtn','pressbtn','testsbtn','conns'].map(i=>r(i).right);
  return { jLeft:j.left, gRight:g.right, cRight:c.right,
           gearRightmost: others.every(x=>x<=g.left+1),
           stage: document.getElementById('stage').getBoundingClientRect().right }; });
ok(row2.jLeft<100, 'journeys slot anchors the LEFT of row 2');
ok(row2.gearRightmost && Math.abs(row2.gRight-row2.cRight)<2, 'gear sits ALL THE WAY right of the control cluster');

// 2 · depth slider: tooltip, live alt-wheel sync, drag re-highlights
ok(await pg.evaluate(() => document.getElementById('depthCtl').getAttribute('title'))==='Press Alt and scroll to modify it',
  'slider tooltip names the hotkey');
ok(await pg.evaluate(() => document.getElementById('depthSlider').value)==='5', 'slider starts at default 5');
await pg.evaluate(() => { document.getElementById('stage').dispatchEvent(
  new WheelEvent('wheel',{deltaY:100, altKey:true, bubbles:true, cancelable:true})); });
const afterWheel = await pg.evaluate(() => ({ v:document.getElementById('depthSlider').value,
  n:document.getElementById('depthVal').textContent }));
ok(afterWheel.v==='4' && afterWheel.n==='4', 'alt+scroll moves the slider LIVE (5→4)');
await T("window.__lvltest.set('trace')");
await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); });
await pg.evaluate(() => { const s=document.getElementById('depthSlider');
  s.value='1'; s.dispatchEvent(new Event('input',{bubbles:true})); });
const hops1 = await T('window.__lvltest.hopCounts()');
await pg.evaluate(() => { const s=document.getElementById('depthSlider');
  s.value='3'; s.dispatchEvent(new Event('input',{bubbles:true})); });
const hops3 = await T('window.__lvltest.hopCounts()');
ok(hops1[2]===0 && hops3[2]>0, 'dragging the slider re-runs the highlight in real time');
ok(await T('window.__lvltest.depth()')===3, 'hook agrees with the slider (3)');
await pg.evaluate(() => { const s=document.getElementById('depthSlider');
  s.value='5'; s.dispatchEvent(new Event('input',{bubbles:true})); });

// 3 · icon-only toggles with tooltips; still toggling
const tgl = await pg.evaluate(() => {
  const ids=['guardsbtn','hubsbtn','pressbtn','testsbtn','conns'];
  return ids.map(id => { const b=document.getElementById(id);
    return { id, svg:!!b.querySelector('svg'), text:b.textContent.trim(), tip:(b.getAttribute('title')||'').length>10 }; }); });
ok(tgl.every(x=>x.svg && x.text==='' && x.tip), 'all five toggles are icon-only with real tooltips');
await pg.click('#guardsbtn');
const guardsOn = await pg.evaluate(() => ({ on:document.getElementById('guardsbtn').classList.contains('on'),
  marks:document.querySelectorAll('#canvas .guardmark, #canvas [class*=guard]').length }));
ok(guardsOn.on, 'icon toggle still toggles (Guards on)');
await pg.click('#guardsbtn');

// 4 · chevron collapse/restore at the corner (no bottom bar)
ok(await pg.evaluate(() => !document.getElementById('panelmin')), 'the bottom minimize bar is gone');
const w0 = await pg.evaluate(() => document.getElementById('panel').clientWidth);
await pg.click('#panelchev');
const collapsed = await pg.evaluate(() => ({
  aside:!!document.querySelector('#sidewrap.min'),
  chev:document.getElementById('panelchev').textContent }));
await pg.click('#panelchev');
const w2 = await pg.evaluate(() => document.getElementById('panel').clientWidth);
ok(w0>=270 && collapsed.aside && w2>=270, `chevron collapses and restores the panel (${w0}→min→${w2})`);
ok(collapsed.chev==='«', 'chevron flips direction when collapsed');

// 5 · legend corner box: bottom-LEFT, collapsible, carries the full symbol tail
const leg = await pg.evaluate(() => {
  const box=document.getElementById('legendBox'), r=box.getBoundingClientRect();
  const stage=document.getElementById('stage').getBoundingClientRect();
  const txt=box.textContent;
  return { left:r.left-stage.left, bottomGap:stage.bottom-r.bottom,
    hasDots:/moving dot/.test(txt), hasPill:/count pill/.test(txt),
    hasShield:/shield/.test(txt), hasSel:/spinning ring/.test(txt) }; });
ok(leg.left<30 && leg.bottomGap<30, 'legend box sits in the bottom-left corner');
ok(leg.hasDots && leg.hasPill && leg.hasShield && leg.hasSel, 'legend carries the full symbol vocabulary');
await pg.click('#legendMin');
const legMin = await pg.evaluate(() => document.getElementById('legendBox').classList.contains('min'));
await pg.click('#legendMin');
ok(legMin, 'legend box minimizes and restores');

// 6 · controls box: bottom-right, starts minimized, lists the hotkeys
const keys = await pg.evaluate(() => {
  const box=document.getElementById('keysBox'), r=box.getBoundingClientRect();
  const stage=document.getElementById('stage').getBoundingClientRect();
  return { min:box.classList.contains('min'), rightGap:stage.right-r.right, txt:box.textContent }; });
ok(keys.min && keys.rightGap<30, 'controls box sits bottom-right, minimized by default');
await pg.click('#keysMin');
const keysTxt = await pg.evaluate(() => document.getElementById('keysBox').textContent);
ok(/alt \+ scroll/.test(keysTxt) && /shift \+ scroll/.test(keysTxt) && /ctrl \/ pinch/.test(keysTxt),
  'controls box names every hotkey (pan · sideways · zoom · depth)');
await pg.click('#keysMin');

// 7 · the gear panel opens INSIDE the viewport (right-anchored now)
await pg.click('#gear');
const gp = await pg.evaluate(() => { const r=document.getElementById('gearpanel').getBoundingClientRect();
  return { right:r.right, vw:window.innerWidth, hasDepth:!!document.getElementById('depthSeg') }; });
ok(gp.right<=gp.vw+1, 'gear panel opens within the viewport');
ok(!gp.hasDepth, 'depth control extracted from the gear (slider owns it)');
await pg.click('#gear');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl31 (header rework): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
