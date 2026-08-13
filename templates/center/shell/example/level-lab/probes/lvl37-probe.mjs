// Round 43 — PEEK: hovering a connection row lights the wire + its FAR element
// on the canvas; leaving clears; moving between rows moves the peek; the
// connector card's travel rows peek their node too.
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
// select a hub with many connections (the operator's Household example)
await pg.evaluate(() => document.querySelector('#canvas [data-key="cls:auth|Household"]')
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
const nRows = await pg.evaluate(() => document.querySelectorAll('#panel .conrow').length);
ok(nRows>10, 'Household lists many connections ('+nRows+')');

// 1 · hover row 0 → its wire glows + the FAR element rings; the selection stays
const peek1 = await pg.evaluate(() => {
  const row=document.querySelectorAll('#panel .conrow')[0];
  row.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
  const i=+row.getAttribute('data-conn');
  return { epeek: document.querySelectorAll('#canvas .e-peek').length,
           rings: document.querySelectorAll('#canvas .peek-ring').length,
           selStill: document.querySelectorAll('#canvas .selring').length,
           i }; });
ok(peek1.epeek===1, 'hover lights exactly the hovered wire ('+peek1.epeek+')');
ok(peek1.rings===1, 'hover rings exactly the FAR element ('+peek1.rings+')');
ok(peek1.selStill>=1, 'the selection stays while peeking');

// the ringed node is NOT the selected one
const farOk = await pg.evaluate(() => {
  const ring=document.querySelector('#canvas .peek-ring');
  const host=ring.closest('[data-key]');
  return host && host.getAttribute('data-key')!=='cls:auth|Household'; });
ok(farOk, 'the peek ring sits on the OTHER end, not the selected node');

// 2 · moving to another row MOVES the peek (skim)
const peek2 = await pg.evaluate(() => {
  const rows=document.querySelectorAll('#panel .conrow');
  rows[0].dispatchEvent(new MouseEvent('mouseleave',{bubbles:false}));
  rows[5].dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
  const ring=document.querySelector('#canvas .peek-ring');
  return { epeek: document.querySelectorAll('#canvas .e-peek').length,
           key: ring ? ring.closest('[data-key]')?.getAttribute('data-key') : null }; });
ok(peek2.epeek===1, 'skimming to another row keeps ONE wire lit');
ok(!!peek2.key, 'the peek follows to the new row\'s far element ('+peek2.key+')');

// 3 · leaving clears everything
const cleared = await pg.evaluate(() => {
  document.querySelectorAll('#panel .conrow')[5]
    .dispatchEvent(new MouseEvent('mouseleave',{bubbles:false}));
  return { epeek: document.querySelectorAll('#canvas .e-peek').length,
           rings: document.querySelectorAll('#canvas .peek-ring').length }; });
ok(cleared.epeek===0 && cleared.rings===0, 'mouse-leave clears the peek completely');

// 4 · the connector card's travel rows peek their node on hover
await pg.evaluate(() => {
  const wire=[...document.querySelectorAll('#canvas .e-xfk')][0];
  wire.dispatchEvent(new MouseEvent('click',{bubbles:true, cancelable:true})); });
const jgoPeek = await pg.evaluate(() => {
  const row=document.querySelectorAll('#panel .jgo')[1];
  row.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
  const rings=document.querySelectorAll('#canvas .peek-ring').length;
  row.dispatchEvent(new MouseEvent('mouseleave',{bubbles:false}));
  const after=document.querySelectorAll('#canvas .peek-ring').length;
  return { rings, after }; });
ok(jgoPeek.rings===1 && jgoPeek.after===0, 'connector-card travel row peeks its node and clears');

// 5 · a new selection clears any live peek
await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:auth|Household"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true}));
  document.querySelectorAll('#panel .conrow')[0]
    .dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
  document.querySelector('#canvas [data-key="cls:auth|User"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const afterSel = await pg.evaluate(() => document.querySelectorAll('#canvas .e-peek, #canvas .peek-ring').length);
ok(afterSel===0, 'a new selection clears the live peek');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl37 (hover peek): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
