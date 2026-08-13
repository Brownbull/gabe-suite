// Round 30 — flow dots replace arrowheads (constant speed, bidirectional lanes)
// + panel section headers carry the canvas glyph (state-aware, icon-led).
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const URL='file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html';
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto(URL); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// 1 · NO arrowheads anywhere, on any level
for(const lvl of ['entities','pieces','functions','trace']){
  await T(`window.__lvltest.set('${lvl}')`);
  const n = await pg.evaluate(() => document.querySelectorAll('#canvas [marker-end]').length);
  ok(n===0, lvl+': zero marker-end paths, got '+n);
}

// 2 · dots ride the directed edges (trace, conns on): each dot animates along an mpath
const dots = await pg.evaluate(() => {
  const ds=[...document.querySelectorAll('#canvas .flowdot')];
  const withAM=ds.filter(d=>d.querySelector('animateMotion mpath'));
  const hrefsOk=withAM.every(d=>{ const href=d.querySelector('mpath').getAttribute('href');
    return href && document.querySelector(href); });
  return {n:ds.length, am:withAM.length, hrefsOk}; });
console.log('  trace dots:', JSON.stringify(dots));
ok(dots.n>=150, 'trace carries flow dots (>=150), got '+dots.n);
ok(dots.am===dots.n && dots.hrefsOk, 'every dot animates along an existing path');

// 3 · constant SPEED: dur ∝ path length (ratio spread < 15%)
const speeds = await pg.evaluate(() => {
  const out=[];
  document.querySelectorAll('#canvas .flowdot animateMotion').forEach(am=>{
    const href=am.querySelector('mpath').getAttribute('href');
    const p=document.querySelector(href); if(!p) return;
    const len=p.getTotalLength(), dur=parseFloat(am.getAttribute('dur'));
    if(dur>1.61) out.push(len/dur); });     // above the floor → the ∝ regime
  return out.slice(0,40); });
const spread = Math.max(...speeds)-Math.min(...speeds);
ok(speeds.length>5 && spread<8, 'constant speed ~55px/s (spread '+spread.toFixed(1)+')');

// 4 · LANES: a reverse pair bows to the OPPOSITE side (pure fn, exposed top-level)
const lanes = await pg.evaluate(() => {
  const L=window.__lvltest.laneBowProbe;
  const a=L('probe:A','probe:B',30), r=L('probe:B','probe:A',30), s=L('probe:A','probe:B',26);
  return {a, r, s}; });
ok(lanes.a===30 && lanes.r===-30, 'reverse direction takes the opposite lane ('+lanes.a+'/'+lanes.r+')');
ok(lanes.s===26, 'same direction keeps its lane sign (26, not flipped)');

// 5 · L1: bidirectional entity pairs ride opposite sides AND both carry dots
await T("window.__lvltest.set('entities')");
const l1 = await pg.evaluate(() => ({
  dots: document.querySelectorAll('#canvas .flowdot').length,
  edges: document.querySelectorAll('#canvas .e-fk, #canvas .e-calls, #canvas .e-imports').length }));
console.log('  L1:', JSON.stringify(l1));
ok(l1.dots>=l1.edges && l1.edges>0, 'every L1 edge carries at least one dot ('+l1.dots+'/'+l1.edges+')');

// 6 · panel: EVERY section header is icon-led (svg inside .k)
await T("window.__lvltest.set('trace')");
await pg.evaluate(() => {
  const ps=[...document.querySelectorAll('.piece')];
  const hit=ps.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.startsWith('model CookingSession')));
  hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const panelModel = await pg.evaluate(() => {
  const ks=[...document.querySelectorAll('#panel .k')];
  return { n:ks.length, iconed:ks.filter(k=>k.querySelector('svg')).length,
           labels:ks.map(k=>{const s=k.querySelector('span');return (s?s.textContent:k.textContent).trim().split(' ')[0];}),
           pill:!!document.querySelector('#panel .k svg rect'),
           pillNum:(()=>{const t=document.querySelector('#panel .k svg text');return t?t.textContent:null;})() }; });
console.log('  model panel:', JSON.stringify(panelModel));
ok(panelModel.n>0 && panelModel.iconed===panelModel.n, 'every section header carries its glyph ('+panelModel.iconed+'/'+panelModel.n+')');
ok(panelModel.labels.includes('tests') && panelModel.pill && /^\d+$/.test(panelModel.pillNum||''), 'tests header = the count pill + label');

// 7 · usefn panel: role section names the using function with its count
await pg.evaluate(() => {
  const u=document.querySelector('#canvas .fnode.usefn');
  u.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const roleTxt = await pg.evaluate(() => document.querySelector('#panel').textContent);
ok(/using function — references \d+ model\/schema class/.test(roleTxt), 'usefn role section shows its uses count');

// 8 · reduced motion: static dots (finished-state law), no SMIL
const ctx2 = await b.newContext({reducedMotion:'reduce'});
const pg2 = await ctx2.newPage();
await pg2.goto(URL); await pg2.waitForFunction('window.__lvlready===true',{timeout:8000});
await pg2.evaluate("window.__lvltest.set('trace')");
const red = await pg2.evaluate(() => {
  const ds=[...document.querySelectorAll('#canvas .flowdot')];
  return { n:ds.length, anim:ds.filter(d=>d.querySelector('animateMotion')).length,
           placed:ds.filter(d=>d.getAttribute('cx')!==null).length }; });
console.log('  reduced:', JSON.stringify(red));
ok(red.n>0 && red.anim===0 && red.placed===red.n, 'reduced motion: static dots at 62%, zero SMIL');
await ctx2.close();

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl25 (flow dots + iconed panel): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
