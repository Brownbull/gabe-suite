// Round 37 — JOURNEYS: derived REQUEST walks (endpoint → ƒ → models → resp →
// cross users) + census USE-CASE walks, played step-by-step from the picker;
// steps resolve against SELREG live; auto-switches to trace.
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
const centreErr = async () => pg.evaluate(() => {
  const st=window.__lvltest.jrnState(); if(!st.cur) return 9e9;
  const key=(()=>{ const sel=document.querySelector('#canvas .selring'); if(!sel) return null;
    return sel.closest('[data-key]')?.getAttribute('data-key'); })();
  if(!key) return 9e9;
  const w=window.__lvltest.nodeXY(key); const c=window.__lvltest.cam();
  const r=document.getElementById('stage').getBoundingClientRect(); const s=c.base*c.zoom;
  return Math.hypot(c.fit[0]+c.panX+w.x*s-r.width/2, c.fit[1]+c.panY+w.y*s-r.height/2); });

// 1 · the catalog: both kinds, honest sizes
const cat = await T('window.__lvltest.journeys()');
const req = cat.filter(j=>j.kind==='request'), uc = cat.filter(j=>j.kind==='usecase');
console.log('  catalog:', req.length, 'request ·', uc.length, 'use-case');
ok(req.length>=45 && req.length<=67, 'request journeys derived for the wired endpoints ('+req.length+')');
ok(uc.length>=2, 'use-case journeys from the census example ('+uc.length+')');
ok(cat.every(j=>j.n>=2 && j.n<=20), 'every journey has 2–20 steps');
const opts = await pg.evaluate(() => ({
  n: document.querySelectorAll('#jrnSel option').length,
  groups: [...document.querySelectorAll('#jrnSel optgroup')].map(g=>g.getAttribute('label')) }));
ok(opts.n===cat.length+1, 'picker lists every journey ('+(opts.n-1)+')');
ok(opts.groups.length===2 && /Request/.test(opts.groups[0]) && /census/.test(opts.groups[1]), 'picker groups Request · Use case (census)');

// 2 · play a request journey FROM THE ENTITIES level — auto-switch to trace
await T("window.__lvltest.set('entities')");
const pickIdx = await pg.evaluate(() => {
  const j=window.__lvltest.journeys(); let best=-1, bn=0;
  j.forEach((x,i)=>{ if(x.kind==='request' && x.n>bn){ bn=x.n; best=i; } });
  const sel=document.getElementById('jrnSel'); sel.value=String(best);
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  return best; });
const st1 = await T('window.__lvltest.jrnState()');
const lvlNow = await pg.evaluate(() => document.querySelector('#levels button.on').getAttribute('data-lvl'));
console.log('  playing:', JSON.stringify(st1), 'on level', lvlNow);
ok(lvlNow==='trace', 'picking a journey switches to the trace');
ok(st1.cur!==null && st1.i===0 && st1.resolved>=2, 'journey starts at step 1 with resolved steps ('+st1.resolved+')');
ok((await centreErr())<2, 'step 1 node sits at stage centre with its card open');
const bar = await pg.evaluate(() => ({ hidden:document.getElementById('jrnBar').hidden,
  pos:document.getElementById('jrnPos').textContent, step:document.getElementById('jrnStep').textContent }));
ok(!bar.hidden && bar.pos.startsWith('1/') && bar.step.length>0, 'step bar shows position + step name ('+bar.pos+' '+bar.step+')');

// 3 · step through: next advances + centres; prev returns; clamps at the ends
await pg.click('#jrnNext');
const st2 = await T('window.__lvltest.jrnState()');
ok(st2.i===1 && (await centreErr())<2, 'next → step 2 centred');
await pg.click('#jrnPrev');
ok((await T('window.__lvltest.jrnState()')).i===0, 'prev → back to step 1');
await pg.click('#jrnPrev');
ok((await T('window.__lvltest.jrnState()')).i===0, 'prev clamps at the first step');
for(let k=0;k<25;k++) await pg.click('#jrnNext');
const stEnd = await T('window.__lvltest.jrnState()');
ok(stEnd.i===stEnd.resolved-1, 'next clamps at the last step ('+(stEnd.i+1)+'/'+stEnd.resolved+')');

// 4 · a USE-CASE journey plays (census example)
const ucIdx = await pg.evaluate(() => {
  const j=window.__lvltest.journeys();
  const i=j.findIndex(x=>x.kind==='usecase');
  const sel=document.getElementById('jrnSel'); sel.value=String(i);
  sel.dispatchEvent(new Event('change',{bubbles:true})); return i; });
const stUc = await T('window.__lvltest.jrnState()');
ok(stUc.cur!==null && stUc.resolved>=2 && (await centreErr())<2, 'census journey plays ('+stUc.cur+', '+stUc.resolved+' steps)');

// 5 · exit: ✕ hides the bar, resets the picker
await pg.click('#jrnX');
const after = await pg.evaluate(() => ({ hidden:document.getElementById('jrnBar').hidden,
  sel:document.getElementById('jrnSel').value }));
ok(after.hidden && after.sel==='', '✕ leaves the journey (bar hidden, picker reset)');
ok((await T('window.__lvltest.jrnState()')).cur===null, 'journey state cleared');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl32 (journeys): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
