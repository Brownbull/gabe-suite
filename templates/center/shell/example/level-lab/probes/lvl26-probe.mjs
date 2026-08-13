// Round 31 — EDGE HOP: dbl-click a connector → camera centers its FAR endpoint,
// dbl-click again → the other endpoint; zoom NEVER moves; pan only.
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
// screen position of a world point under the current camera, plus stage centre
const screenOf = (w) => pg.evaluate((w) => {
  const c=window.__lvltest.cam(), r=document.getElementById('stage').getBoundingClientRect();
  const s=c.base*c.zoom;
  return { x:c.fit[0]+c.panX+w.x*s, y:c.fit[1]+c.panY+w.y*s, cx:r.width/2, cy:r.height/2 }; }, w);

await T("window.__lvltest.set('trace')");

// pick a cross-entity use edge — its two ends live in different entities (far apart)
const target = await pg.evaluate(() => {
  const paths=[...document.querySelectorAll('#canvas .e-use')];
  const hit=paths.find(p=>{ const t=p.querySelector('title');
    return t && t.textContent==='build_account_export() uses allergen.UserDietaryProfile'; });
  hit.dispatchEvent(new MouseEvent('dblclick',{bubbles:true, cancelable:true}));
  return { from:'fn:legal-consent|build_account_export', to:'cls:allergen|UserDietaryProfile' }; });

const camBefore = await T('window.__lvltest.cam()');
const hop1 = await T('window.__lvltest.hopState()');
const w1 = await pg.evaluate((k)=>window.__lvltest.nodeXY(k), hop1.at==='from'?target.from:target.to);
const s1 = await screenOf(w1);
console.log('  hop1:', JSON.stringify(hop1), 'screen err:', Math.hypot(s1.x-s1.cx, s1.y-s1.cy).toFixed(1));
ok(hop1.at==='from'||hop1.at==='to', 'first dbl-click hops to an endpoint ('+hop1.at+')');
ok(Math.hypot(s1.x-s1.cx, s1.y-s1.cy)<2, 'that endpoint sits at the stage centre');
ok(camBefore.zoom===1, 'zoom untouched by the hop');

// second dbl-click → the OTHER end, still centred, zoom still parked
await pg.evaluate(() => {
  const hit=[...document.querySelectorAll('#canvas .e-use')].find(p=>{ const t=p.querySelector('title');
    return t && t.textContent==='build_account_export() uses allergen.UserDietaryProfile'; });
  hit.dispatchEvent(new MouseEvent('dblclick',{bubbles:true, cancelable:true})); });
const hop2 = await T('window.__lvltest.hopState()');
const w2 = await pg.evaluate((k)=>window.__lvltest.nodeXY(k), hop2.at==='from'?target.from:target.to);
const s2 = await screenOf(w2);
ok(hop2.at!==hop1.at, 'second dbl-click hops to the OTHER end ('+hop1.at+'→'+hop2.at+')');
ok(Math.hypot(s2.x-s2.cx, s2.y-s2.cy)<2, 'other endpoint now at the stage centre');

// third → back to the first end (alternation, not a dead end)
await pg.evaluate(() => {
  const hit=[...document.querySelectorAll('#canvas .e-use')].find(p=>{ const t=p.querySelector('title');
    return t && t.textContent==='build_account_export() uses allergen.UserDietaryProfile'; });
  hit.dispatchEvent(new MouseEvent('dblclick',{bubbles:true, cancelable:true})); });
const hop3 = await T('window.__lvltest.hopState()');
ok(hop3.at===hop1.at, 'third dbl-click alternates back ('+hop3.at+')');

// FAR-end-first: after centring on one end, a FRESH edge dbl-click starts at its far end
const zoomAfter = await pg.evaluate(() => window.__lvltest.cam().zoom);
ok(zoomAfter===1, 'zoom still 1 after three hops');

// works from the panel too: select a node, dbl-click a connector ROW
await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const rowHop = await pg.evaluate(() => {
  const row=document.querySelector('#panel .conrow'); if(!row) return null;
  row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
  return window.__lvltest.hopState(); });
ok(rowHop && rowHop.at, 'panel connector row dbl-click hops too ('+(rowHop&&rowHop.at)+')');

// L1: dbl-click an entity edge's hit path → centres one entity, again → the other
await T("window.__lvltest.set('entities')");
const l1 = await pg.evaluate(() => {
  const hits=[...document.querySelectorAll('#canvas path[stroke="transparent"]')];
  const h=hits[0]; if(!h) return null;
  h.dispatchEvent(new MouseEvent('dblclick',{bubbles:true, cancelable:true}));
  const first=window.__lvltest.hopState();
  const cam1=window.__lvltest.cam();
  h.dispatchEvent(new MouseEvent('dblclick',{bubbles:true, cancelable:true}));
  const second=window.__lvltest.hopState();
  const cam2=window.__lvltest.cam();
  return {first, second, moved: cam1.panX!==cam2.panX||cam1.panY!==cam2.panY, z:cam2.zoom}; });
ok(l1 && String(l1.first.i).startsWith('l1:') && l1.first.at!==l1.second.at,
  'L1 entity edge alternates ends ('+(l1&&l1.first.at)+'→'+(l1&&l1.second.at)+')');
ok(l1 && l1.moved && l1.z===1, 'L1 hop pans, zoom parked');

// hop state survives nothing it shouldn't: a re-render clears it
await T("window.__lvltest.set('trace')");
const cleared = await T('window.__lvltest.hopState()');
ok(cleared.i===-1, 'level switch resets the hop registry');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl26 (edge hop): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
