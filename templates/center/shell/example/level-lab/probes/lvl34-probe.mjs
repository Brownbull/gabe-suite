// Round 39 — the consolidation: levels 2+3 leave the UI; L1 circles carry their
// content weight and dbl-click DRILLS into the trace; Layers carries diagram 5's
// FULL inventory (endpoints · fns · models · schemas) in lane structure.
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

// 1 · roster: exactly 1 · 4 · 5 (machinery for 2/3 stays hook-reachable)
const roster = await pg.evaluate(() => [...document.querySelectorAll('#levels button')].map(x=>x.getAttribute('data-lvl')).join(','));
ok(roster==='entities,layers,trace', 'level roster = Entities · Layers · Trace ('+roster+')');
await T("window.__lvltest.set('pieces')");
ok(await T("document.querySelectorAll('#canvas .piece').length")>100, 'pieces machinery still hook-reachable (gates)');

// 2 · L1: circle radius carries the entity's content weight
await T("window.__lvltest.set('entities')");
const radii = await pg.evaluate(() => {
  const out={};
  document.querySelectorAll('#canvas .entnode').forEach(g=>{
    const id=(g.getAttribute('data-id')||'').replace('ent:','');
    const c=g.querySelector('circle.body'); if(c) out[id]=+c.getAttribute('r'); });
  return out; });
const big = radii['recipe']||0, small = radii['legal-consent']||radii['allergen']||0;
console.log('  radii:', JSON.stringify(radii));
ok(big>small && big>=50, 'content-heavy entities draw BIGGER circles (recipe '+big+' vs '+small+')');

// 3 · dbl-click an entity = OPEN → the trace, centred on that entity
await pg.evaluate(() => {
  const g=[...document.querySelectorAll('#canvas .entnode')].find(x=>x.getAttribute('data-id')==='ent:cooking');
  g.dispatchEvent(new MouseEvent('dblclick',{bubbles:true, cancelable:true})); });
const drill = await pg.evaluate(() => {
  const lvl=document.querySelector('#levels button.on').getAttribute('data-lvl');
  const o=window.__lvltest.entPos(); const w={x:o['cooking'][0], y:o['cooking'][1]};
  const c=window.__lvltest.cam(); const r=document.getElementById('stage').getBoundingClientRect();
  const s=c.base*c.zoom;
  return { lvl, err:Math.hypot(c.fit[0]+c.panX+w.x*s-r.width/2, c.fit[1]+c.panY+w.y*s-r.height/2) }; });
console.log('  drill:', JSON.stringify(drill));
ok(drill.lvl==='trace', 'dbl-click drills into the trace');
ok(drill.err<2, 'the drilled entity sits at stage centre ('+drill.err.toFixed(1)+'px)');

// 4 · LAYERS: the full inventory in lanes
await T("window.__lvltest.set('layers')");
const inv = await pg.evaluate(() => ({
  eps: document.querySelectorAll('#canvas .epmark').length,
  models: document.querySelectorAll("#canvas .piece[data-kind='model']").length,
  schemas: document.querySelectorAll("#canvas .piece[data-kind='schema']").length,
  fns: document.querySelectorAll('#canvas .fnode').length,
  lanes: [...document.querySelectorAll('#canvas text.lbl')].map(t=>t.textContent).join(','),
  wires: document.querySelectorAll('#canvas .e-touch, #canvas .e-resp, #canvas .e-intra, #canvas .e-xfk, #canvas .e-use').length }));
console.log('  inventory:', JSON.stringify(inv));
ok(inv.eps===67, 'ALL 67 endpoints drawn in the endpoints lane');
ok(inv.models>=30 && inv.schemas>=70, 'ALL models + schemas drawn ('+inv.models+' + '+inv.schemas+')');
ok(inv.fns>=60, 'functions drawn (handlers + using fns + web) ('+inv.fns+')');
ok(/ENDPOINTS/.test(inv.lanes) && /API/.test(inv.lanes) && /SERVICES/.test(inv.lanes) && /DATA/.test(inv.lanes), 'lane structure kept ('+inv.lanes+')');
ok(inv.wires>=300, 'diagram-5 wires drawn across the lanes ('+inv.wires+')');

// 5 · the grammar works here: click a model → its card + connections
await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const card = await pg.evaluate(() => document.querySelector('#panel').textContent);
ok(/UserDietaryProfile/.test(card) && /connections \(/.test(card), 'L4 node click opens the card with connections');
// a journey still auto-switches to trace
await pg.evaluate(() => { const sel=document.getElementById('jrnSel');
  sel.value='0'; sel.dispatchEvent(new Event('change',{bubbles:true})); });
ok(await pg.evaluate(() => document.querySelector('#levels button.on').getAttribute('data-lvl'))==='trace',
  'journeys still walk on the trace');
await pg.click('#jrnX');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl34 (consolidation): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
