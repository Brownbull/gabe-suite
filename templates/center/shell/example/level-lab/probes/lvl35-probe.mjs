// Round 40 — colored ENTITY row on every card · journeys native to LAYERS ·
// one-fact-per-row legend with group headers.
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
const entRow = () => pg.evaluate(() => {
  const rows=[...document.querySelectorAll('#panel .row')];
  const r=rows.find(x=>x.querySelector('span')?.textContent==='entity');
  if(!r) return null;
  const dot=r.querySelector('.entdot');
  return { name:r.querySelector('b').textContent.trim(),
           color: dot ? getComputedStyle(dot).backgroundColor : null }; });

// 1 · the entity row wears its colour on all three card kinds
await T("window.__lvltest.set('trace')");
await pg.evaluate(() => document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
const pieceRow = await entRow();
ok(pieceRow && pieceRow.name==='allergen' && /rgb/.test(pieceRow.color||''), 'piece card: entity row + colour dot ('+(pieceRow&&pieceRow.color)+')');
await pg.evaluate(() => { const ep=[...document.querySelectorAll('#canvas .epmark')][0];
  ep.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const epRow = await entRow();
ok(epRow && /rgb/.test(epRow.color||''), 'endpoint card: entity row + colour dot');
await pg.evaluate(() => { const fn=[...document.querySelectorAll('#canvas .fnode')][0];
  fn.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const fnRow = await entRow();
ok(fnRow && /rgb/.test(fnRow.color||''), 'fn card: entity row + colour dot');
// the dot matches the entity's canvas colour
const match = await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true}));
  const dot=getComputedStyle(document.querySelector('#panel .entdot')).backgroundColor;
  const cont=[...document.querySelectorAll('#canvas circle.container')]
    .map(c=>({f:c.getAttribute('fill'), s:getComputedStyle(c).fill}));
  return { dot, any: cont.some(c=>c.s===dot) }; });
ok(match.any, 'the dot matches a canvas entity colour ('+match.dot+')');
// round 41: every card carries a LAYER row (piece=data · endpoint=api · fn=its layer)
const layerOf = () => pg.evaluate(() => {
  const rows=[...document.querySelectorAll('#panel .row')];
  const r=rows.find(x=>x.querySelector('span')?.textContent==='layer');
  return r ? r.querySelector('b').textContent.trim() : null; });
ok(await layerOf()==='data', 'piece card: layer row = data');
await pg.evaluate(() => [...document.querySelectorAll('#canvas .epmark')][0]
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
ok(await layerOf()==='api', 'endpoint card: layer row = api');
await pg.evaluate(() => [...document.querySelectorAll('#canvas .fnode')][0]
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
ok(['api','services','web'].includes(await layerOf()), 'fn card: layer row = its layer');

// 2 · journeys play ON LAYERS when picked there
await T("window.__lvltest.set('layers')");
await pg.evaluate(() => {
  const j=window.__lvltest.journeys(); let best=-1, bn=0;
  j.forEach((x,i)=>{ if(x.kind==='request' && x.n>bn){ bn=x.n; best=i; } });
  const sel=document.getElementById('jrnSel'); sel.value=String(best);
  sel.dispatchEvent(new Event('change',{bubbles:true})); });
const onLayers = await pg.evaluate(() => ({
  lvl: document.querySelector('#levels button.on').getAttribute('data-lvl'),
  st: window.__lvltest.jrnState(),
  jrn: document.querySelectorAll('#canvas .e-jrn').length,
  rings: document.querySelectorAll('#canvas .jrn-ring').length }));
console.log('  layers journey:', JSON.stringify(onLayers));
ok(onLayers.lvl==='layers', 'journey picked on LAYERS stays on layers');
ok(onLayers.st.resolved>=2 && onLayers.rings===onLayers.st.resolved, 'steps resolve on layers ('+onLayers.st.resolved+', all ringed)');
ok(onLayers.jrn>=3, 'journey overlay glows on layers ('+onLayers.jrn+' links)');
await pg.click('#jrnNext');
const stepped = await T('window.__lvltest.jrnState()');
ok(stepped.i===1, 'stepping works on layers');
await pg.click('#jrnX');
// from ENTITIES the default remains the trace
await T("window.__lvltest.set('entities')");
await pg.evaluate(() => { const sel=document.getElementById('jrnSel');
  sel.value='0'; sel.dispatchEvent(new Event('change',{bubbles:true})); });
ok(await pg.evaluate(() => document.querySelector('#levels button.on').getAttribute('data-lvl'))==='trace',
  'from entities a journey still defaults to the trace');
await pg.click('#jrnX');

// 3 · legend: one fact per row, group headers, journey symbol named
const leg = await pg.evaluate(() => {
  const box=document.getElementById('legend');
  const its=[...box.querySelectorAll('.it')];
  const tops=its.map(x=>x.getBoundingClientRect().top);
  const distinct=new Set(tops.map(t=>Math.round(t))).size;
  return { n:its.length, distinct,
    heads:[...box.querySelectorAll('.lg-h')].map(h=>h.textContent),
    hasJourney:/active journey/.test(box.textContent) }; });
console.log('  legend rows:', leg.n, '· distinct tops:', leg.distinct, '· heads:', leg.heads.join('/'));
ok(leg.n>=12 && leg.distinct===leg.n, 'every legend fact sits on its OWN row ('+leg.n+')');
ok(leg.heads.length===2 && /this level/i.test(leg.heads[0]) && /everywhere/i.test(leg.heads[1]), 'legend grouped: this level · everywhere');
ok(leg.hasJourney, 'the journey overlay symbol is in the legend');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl35 (entity row · layers journeys · tall legend): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
