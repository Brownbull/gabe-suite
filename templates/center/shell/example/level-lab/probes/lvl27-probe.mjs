// Round 32 — the "nothing happens" fix + panel travel:
// EVERY registered wire is clickable (route/touch/resp included); the connector
// card's from/to rows and a node's connection names TRANSPORT the camera.
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
const centreErr = async (key) => pg.evaluate((key) => {
  const w=window.__lvltest.nodeXY(key); if(!w) return 9e9;
  const c=window.__lvltest.cam(), r=document.getElementById('stage').getBoundingClientRect();
  const s=c.base*c.zoom;
  return Math.hypot(c.fit[0]+c.panX+w.x*s-r.width/2, c.fit[1]+c.panY+w.y*s-r.height/2); }, key);

await T("window.__lvltest.set('trace')");

// 1 · the operator's exact complaint: a ROUTE wire (endpoint → handler) answers a click
const routeClick = await pg.evaluate(() => {
  const wire=[...document.querySelectorAll('#canvas .e-touch')][0]; if(!wire) return null;
  const pe=getComputedStyle(wire).pointerEvents;
  wire.dispatchEvent(new MouseEvent('click',{bubbles:true, cancelable:true}));
  return { pe, panel:document.querySelector('#panel').textContent }; });
ok(routeClick && routeClick.pe==='stroke', 'route/touch wires are hit-testable (pointer-events: stroke)');
ok(routeClick && /connector/.test(routeClick.panel), 'clicking a route wire opens the connector card');

// 2 · the card's from/to rows TRAVEL: click "to" → camera centres it + its own card opens
const toKey = await pg.evaluate(() => {
  const rows=[...document.querySelectorAll('#panel .jgo')];
  const to=rows[1]; const k=to.getAttribute('data-k');
  to.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  return k; });
const err1 = await centreErr(toKey);
const panelAfter = await pg.evaluate(() => document.querySelector('#panel').textContent);
console.log('  travel target:', toKey, 'centre err:', err1.toFixed(1));
ok(err1<2, 'the travelled-to component sits at stage centre');
ok(!/^connector/.test(panelAfter.trim()), 'landing opens the COMPONENT card, not the connector');
ok((await T('window.__lvltest.cam()')).zoom===1, 'zoom untouched by panel travel');

// 3 · connections list: the other element's NAME transports
await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const goKey = await pg.evaluate(() => {
  const g=document.querySelector('#panel .cgo'); const k=g.getAttribute('data-k');
  g.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  return k; });
const err2 = await centreErr(goKey);
const landed = await pg.evaluate(() => document.querySelector('#panel').textContent);
console.log('  cgo target:', goKey, 'centre err:', err2.toFixed(1));
ok(err2<2, 'connection-name click centres the other element');
ok(landed.indexOf(goKey.split('|').pop().split(' ').pop())>=0 || !/connector/.test(landed),
  'landing shows that element\'s card');

// 4 · L1 relationship card carries entity travel rows
await T("window.__lvltest.set('entities')");
const l1rows = await pg.evaluate(() => {
  const hit=[...document.querySelectorAll('#canvas path[stroke="transparent"]')][0];
  hit.dispatchEvent(new MouseEvent('click',{bubbles:true, cancelable:true}));
  const rows=[...document.querySelectorAll('#panel .jgo')];
  if(rows.length!==2) return {n:rows.length};
  const slug=rows[0].getAttribute('data-slug');
  rows[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));
  const c=window.__lvltest.cam(), r=document.getElementById('stage').getBoundingClientRect();
  const w=(function(){ const o=window.__lvltest.entPos(); return {x:o[slug][0], y:o[slug][1]}; })();
  const s=c.base*c.zoom;
  const lbl=(window.GABE_LEVELS.entities.find(e=>e.slug===slug)||{}).label||slug;
  return { n:2, slug, lbl,
    err:Math.hypot(c.fit[0]+c.panX+w.x*s-r.width/2, c.fit[1]+c.panY+w.y*s-r.height/2),
    panel:document.querySelector('#panel').textContent, z:c.zoom }; });
console.log('  L1 travel:', JSON.stringify({n:l1rows.n, slug:l1rows.slug, err:l1rows.err&&l1rows.err.toFixed(1)}));
ok(l1rows.n===2, 'L1 relationship card has two travel rows');
ok(l1rows.err<2 && l1rows.z===1, 'L1 travel centres the entity, zoom parked');
ok(l1rows.panel && l1rows.panel.indexOf(l1rows.lbl)>=0, 'landing shows the entity card ('+l1rows.lbl+')');

// 5 · dedup check: no double-fire — one click selects the edge exactly once
await T("window.__lvltest.set('trace')");
const single = await pg.evaluate(() => {
  const wire=[...document.querySelectorAll('#canvas .e-xfk')][0];
  wire.dispatchEvent(new MouseEvent('click',{bubbles:true, cancelable:true}));
  return document.querySelectorAll('#panel h3').length; });
ok(single===1, 'edge click renders exactly one card (no duplicate listeners)');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl27 (wire click + panel travel): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
