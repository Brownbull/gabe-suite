// Round 35 — trimmed rosters · panel minimize/restore · 6-deep nav history with
// ← back (in-chain clicks keep it, alien clicks override) · link selection
// highlights BOTH endpoints.
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
const clickKey = (k) => pg.evaluate((k) => {
  document.querySelector(`#canvas [data-key="${k}"]`)
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); }, k);
const backState = () => pg.evaluate(() => {
  const b=document.getElementById('navback');
  return { hidden:b.hidden, label:b.textContent }; });

// 1 · rosters trimmed; Direct is the default line
const gear = await pg.evaluate(() => ({
  lay:[...document.querySelectorAll('#laySeg button')].map(x=>x.getAttribute('data-lay')).join(','),
  ins:[...document.querySelectorAll('#inSeg button')].map(x=>x.getAttribute('data-in')).join(','),
  line:[...document.querySelectorAll('#lineSeg button')].map(x=>x.getAttribute('data-line')).join(',') }));
ok(gear.lay==='chain,force,spread', 'Entities roster trimmed ('+gear.lay+')');
ok(gear.ins==='tiers,force,columns,rows', 'Inside roster trimmed ('+gear.ins+')');
ok(gear.line==='direct,bowed', 'Lines roster trimmed ('+gear.line+')');
ok(await T('window.__lvltest.line()')==='direct', 'default line = Direct');

// 2 · panel minimize / restore (real clicks on the bottom bar)
const w0 = await pg.evaluate(() => document.getElementById('panel').clientWidth);
await pg.click('#panelchev');
const w1 = await pg.evaluate(() => document.getElementById('panel').clientWidth);
await pg.click('#panelchev');
const w2 = await pg.evaluate(() => document.getElementById('panel').clientWidth);
ok(w0>=280 && w1<60 && w2>=280, `panel minimizes and restores (${w0}→${w1}→${w2})`);

// 3 · nav history: fresh chain → travels push → back pops → alien overrides
await T("window.__lvltest.set('trace')");
ok((await backState()).hidden, 'back button hidden before any navigation');
await clickKey('cls:allergen|UserDietaryProfile');                     // chain start
ok((await backState()).hidden, 'a plain first selection opens no history');
// travel via a connection NAME (cgo) twice — two navigations
const k1 = await pg.evaluate(() => { const g=document.querySelector('#panel .cgo');
  const k=g.getAttribute('data-k'); g.dispatchEvent(new MouseEvent('click',{bubbles:true})); return k; });
let st = await backState();
ok(!st.hidden && st.label.includes('1'), 'first travel shows ← 1 ('+st.label+')');
const k2 = await pg.evaluate(() => { const g=document.querySelector('#panel .cgo');
  const k=g.getAttribute('data-k'); g.dispatchEvent(new MouseEvent('click',{bubbles:true})); return k; });
st = await backState();
ok(!st.hidden && st.label.includes('2'), 'second travel shows ← 2 ('+st.label+')');
// back returns to k1's node — its card opens, count decrements
await pg.click('#navback');
st = await backState();
const panelHasK1 = await pg.evaluate((k1) => {
  const name=k1.split('|').pop().split(' ').pop().replace(/^\//,'');
  return document.querySelector('#panel').textContent.indexOf(name)>=0; }, k1);
ok(st.label.includes('1') && panelHasK1, 'back lands on the previous element ('+st.label+')');
// in-chain click: reselect the chain's start — history KEPT
await clickKey('cls:allergen|UserDietaryProfile');
st = await backState();
ok(!st.hidden, 'in-chain selection keeps the history ('+st.label+')');
// alien click: an unrelated element — history OVERRIDDEN
await clickKey('cls:cooking|CookingSession');
st = await backState();
ok(st.hidden, 'out-of-chain selection overrides the chain (button hides)');

// 4 · six-deep cap: 8 jumps keep only 6
await pg.evaluate(() => {
  const keys=Object.keys((window.__lvltest.connAudit(), {}));
});
const deep = await pg.evaluate(() => {
  let n=0;
  for(const g of [...Array(8)]){
    const go=document.querySelector('#panel .cgo'); if(!go) break;
    go.dispatchEvent(new MouseEvent('click',{bubbles:true})); n++;
  }
  return {n, label:document.getElementById('navback').textContent}; });
ok(deep.n>=6 && parseInt(deep.label.replace(/\D/g,''))<=6,
  `history caps at 6 (${deep.n} jumps → ${deep.label})`);

// 5 · selecting a LINK highlights the link and BOTH endpoints
await pg.evaluate(() => {
  [...document.querySelectorAll('#canvas .e-xfk')][0]
    .dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); });
const hl = await pg.evaluate(() => ({
  rings: document.querySelectorAll('#canvas .selring').length,
  hlEdge: document.querySelectorAll('#canvas .e-hl').length }));
ok(hl.rings===2, 'both linked elements wear the selection ring ('+hl.rings+')');
ok(hl.hlEdge>=1, 'the link itself is highlighted');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl30 (rosters · min panel · nav history): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
