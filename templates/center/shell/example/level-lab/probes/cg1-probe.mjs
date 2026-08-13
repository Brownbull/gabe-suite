// Change-graph preview — the lab grammar walked through the four beats:
// red rings + red pills → heat + blast → green flips + drift → checkpoint.
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/change-graph-lab.html');
await pg.waitForFunction('window.__cgready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
const C = () => T('window.__cgtest.counts()');
const panelTxt = () => pg.evaluate(() => document.querySelector('#panel').textContent);

// grammar basics carried over
let c = await C();
ok(c.halos===9, 'all 9 scene elements wear the halo ('+c.halos+')');
ok(c.dots>=8, 'flow dots ride the wires ('+c.dots+')');

// 1 · RED: declared targets ring red, pills are red
ok(await T('window.__cgtest.stage()')==='red', 'opens on the Red beat');
ok(c.red===4 && c.pills>=3, 'red rings on the 4 declared targets + red pills');
let txt = await panelTxt();
ok(/C901/.test(txt) && /proves? each one FAILS|prove.*RED/i.test(txt), 'panel: red ledger with C-ids');

// 2 · EXECUTE: heat on touched, blast dashes beyond
await pg.click('#stages button[data-st="execute"]');
c = await C();
ok(c.heat===5 && c.blast===4 && c.red===0, 'execute: 5 touched heat + 4 blast hops, red cleared');
ok(/blast radius/i.test(await panelTxt()), 'panel narrates the blast radius');

// 3 · REVIEW: green flips + the drift ring
await pg.click('#stages button[data-st="review"]');
c = await C();
ok(c.okr>=3 && c.drift===1 && c.heat===0, 'review: green flips + exactly one ENTITY-DRIFT ring');
txt = await panelTxt();
ok(/drift/i.test(txt) && /post_start_session/.test(txt), 'panel prices the drift finding');
ok((await pg.evaluate(() => document.querySelectorAll('#panel .st-pass').length))>=4, 'ledger shows the cases passing');

// 4 · COMMIT: all green, trailer named
await pg.click('#stages button[data-st="commit"]');
c = await C();
ok(c.cring===5 && c.okr===0 && c.drift===0 && c.pills===0, 'commit: the touched set wears the COMMIT ring, overlays cleared');
// the center's canonical beat palette (codebase-graph.html STAGE_COLOR)
const beatCols = await pg.evaluate(() => {
  const cs = sel => { const el=document.querySelector(sel); return el?getComputedStyle(el).stroke:null; };
  window.__cgtest.set('red');   const r=cs('#canvas .red-ring');
  window.__cgtest.set('execute'); const e=cs('#canvas .heat-ring');
  window.__cgtest.set('review');  const v=cs('#canvas .ok-ring');
  window.__cgtest.set('commit');  const c2=cs('#canvas .commit-ring');
  return {r,e,v,c2}; });
ok(beatCols.r==='rgb(229, 72, 77)', 'red beat wears the center red #e5484d ('+beatCols.r+')');
ok(beatCols.e==='rgb(76, 154, 255)', 'execute wears the center blue #4c9aff');
ok(beatCols.v==='rgb(48, 164, 108)', 'review wears the center green #30a46c');
ok(beatCols.c2==='rgb(142, 78, 198)', 'commit wears the center purple #8e4ec6');
ok(/Cases: C901/.test(await panelTxt()), 'panel carries the checkpoint trailer');

// theme: stamp wins here too
await pg.click('#themebtn');
const themed = await pg.evaluate(() => ({
  st: document.documentElement.getAttribute('data-theme'),
  bg: getComputedStyle(document.body).backgroundColor }));
ok(!!themed.st, 'theme toggle stamps the page ('+themed.st+')');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`cg1 (change-graph preview): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
