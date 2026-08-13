// STATION PORT slice 1 — the change graph inherits the LAB GRAMMAR.
// Verifies over the committed gustify fixture: Lucide icons default (Classic
// reachable), halos + flow dots + gradient wires, the BEAT overlays (red rings+
// pills → heat+blast → green flips+drift → commit purple) with counts DERIVED
// from GABE_SIM (never hardcoded), the regNode/regEdge selection engine with the
// depth slider + alt-wheel + hover peek, the Connections toggle, and REAL-mouse
// piece/wire clicks (z-order truth — round 33: dispatchEvent hides layering bugs).
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = 'file://' + path.join(here, '..', 'codebase-graph.html');

const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto(page_url);
await pg.waitForFunction('window.__cbgready===true',{timeout:8000});
const t = expr => pg.evaluate(`window.__cbgtest.${expr}`);

// 1 · boot: SIM instrument up, both involved entities exploded, grammar drawn
ok(await t('hasSim()')===true, 'SIM present (committed fixture)');
ok((await t('expandedNow()')).length===2, 'both involved entities open on boot');
ok(await t('containers()')===2, 'two dashed containers');
const nPieces = await pg.evaluate(()=>Object.values(window.GABE_SIM.pieces).reduce((s,a)=>s+a.length,0));
ok(await t('pieceCircles()')===nPieces, `every SIM piece drawn (${nPieces})`);
ok(await t('halos()')>=nPieces, 'every piece wears the 14px halo');
ok(await t('flowdots()')>0, 'flow dots travel the wires (direction = motion)');
ok(await t('gradients()')>0, 'entity-gradient wires present');
ok(await pg.evaluate(()=>document.querySelectorAll('#cbg-viewport marker').length)===0,
   'no arrowheads — dots carry direction (round 30)');

// 2 · icons: Lucide default; Classic reachable; overlays survive the switch
ok(await t('icons()')==='lucide', 'Lucide is the default set (round 48)');
ok(await pg.evaluate(()=>[...document.querySelectorAll('#cbg-viewport path')]
    .some(p=>(p.getAttribute('d')||'').startsWith('M3 5v14a9 3 0 0 0 18 0V5'))),
   'the lucide db cylinder geometry is drawn');
await t('setIcons("classic")');
ok(await pg.evaluate(()=>[...document.querySelectorAll('#cbg-viewport path')]
    .some(p=>(p.getAttribute('d')||'').startsWith('M-6.8 -3 v6'))),
   'Classic (the settled lab cylinder) still reachable');
await t('setIcons("lucide")');

// 3 · BEAT overlays — expected counts DERIVED from the fixture per stage
const exp = await pg.evaluate(()=>{
  const S=window.GABE_SIM, st=S.stages, out={};
  const pieces=[]; Object.keys(S.pieces).forEach(sl=>S.pieces[sl].forEach(p=>pieces.push(p)));
  const d=(s,p)=>((st[s]||{}).pieces||{})[p.id]||{};
  out.red    = pieces.filter(p=>d('red',p).tested).length;
  out.heat   = pieces.filter(p=>d('execute',p).changed).length;
  out.blast  = pieces.filter(p=>!d('execute',p).changed && p.role==='link').length;
  out.okr    = pieces.filter(p=>d('red',p).tested).length;
  out.drift  = pieces.filter(p=>d('review',p).touched_again).length;
  out.commit = pieces.filter(p=>p.role==='changed').length;
  return out;
});
let r = await t('rings()');
ok(r.heat===exp.heat && r.blast===exp.blast, `execute: ${exp.heat} heat + ${exp.blast} blast rings (got ${r.heat}+${r.blast})`);
await t('setStage("red")');
r = await t('rings()');
ok(r.red===exp.red, `red: ${exp.red} red rings (got ${r.red})`);
ok(await t('pills()')===exp.red, 'red pills carry the case counts');
ok(await pg.evaluate(()=>getComputedStyle(document.querySelector('.red-ring')).stroke)==='rgb(229, 72, 77)',
   'red ring wears the canonical STAGE_COLOR #e5484d');
await t('setStage("review")');
r = await t('rings()');
ok(r.ok===exp.okr && r.drift===exp.drift, `review: ${exp.okr} green + ${exp.drift} drift rings (got ${r.ok}+${r.drift})`);
ok(await pg.evaluate(()=>getComputedStyle(document.querySelector('.drift-ring')).stroke)==='rgb(232, 89, 12)',
   'drift ring is AMBER (finding-state, not a beat)');
await t('setStage("commit")');
r = await t('rings()');
ok(r.commit===exp.commit, `commit: ${exp.commit} purple rings (got ${r.commit})`);
ok(await t('hotEdges()')>0, 'commit: touched flows wear the stage colour');
await t('setStage("execute")');

// 4 · REAL-mouse piece click (z-order truth): the piece card + selection engine
// ⚠ every re-render REPLAYS the 0.9s piece fly-in — wait for it to settle, or
// the click lands where the pieces still ARE (the entity centre = the container).
const settle = () => pg.waitForTimeout(1200);
const screenXY = k => pg.evaluate((key)=>{
  const w=window.__cbgtest.nodeXY(key), c=window.__cbgtest.cam();
  const r=document.getElementById('cbg-stage').getBoundingClientRect(), s=c.base*c.zoom;
  return { x:r.left + c.fit[0]+c.panX + w.x*s, y:r.top + c.fit[1]+c.panY + w.y*s };
}, k);
await settle();
const changedKey = await pg.evaluate(()=>{
  const S=window.GABE_SIM, st=S.stages.execute.pieces;
  for(const sl of Object.keys(S.pieces)) for(const p of S.pieces[sl])
    if((st[p.id]||{}).changed) return 'pc:'+sl+'|'+p.id;
});
const xy = await screenXY(changedKey);
await pg.mouse.click(xy.x, xy.y);
await pg.waitForTimeout(300);
ok(await t('selrings()')===1, 'real click on a piece → the spinning selection ring');
ok(await t('lcRows()')===4, 'piece card shows the 4-stage lifecycle timeline');
ok(await t('idChips()')>0, 'typed identifier chips render (sim-panel intact)');
ok(await t('conRows()')>0, 'the connections tail is appended under the sim card');
const hops = await t('hopCounts()');
ok(hops[1]>0, 'hop-1 connectors lit');
ok(await t('faded()')>0, 'the rest of the wires faded');

// 5 · depth: slider + alt-wheel (real WheelEvent — page.mouse.wheel never
//     reaches a passive:false handler in headless)
await t('setDepth(1)');
const h1 = await t('hopCounts()');
ok(h1[2]===0 && h1[1]>0, 'depth 1 → only hop-1 lit');
await pg.evaluate(()=>{
  document.getElementById('cbg-stage').dispatchEvent(
    new WheelEvent('wheel',{deltaY:-120, altKey:true, bubbles:true, cancelable:true}));
});
ok(await t('depth()')===2, 'alt+scroll steps the depth (slider follows)');
await t('setDepth(5)');

// 6 · peek: hovering a connection row pulses the far element + glows the wire
await t('hoverConn(0)');
ok(await t('peeked()')>0, 'hover peek: the far element wears the pulsing ring');

// 7 · sticky selection across the stage lens (panelTarget survives)
await t('openPiece("recipe","model:PlannedRecipe")');
await t('setStage("red")');
ok((await t('detailText()')).indexOf('PlannedRecipe')>=0, 'the open piece survives a stage switch');
ok(await t('lcActive()')==='red', 'the lifecycle strip follows the active stage');
await t('setStage("execute")');

// 8 · Connections toggle gates the cross-entity piece wires
const xe0 = await t('crossEdges()');
ok(xe0>0, 'cross-entity piece wires drawn (Connections ON default)');
await t('toggleConns()');
ok(await t('crossEdges()')===0, 'Connections OFF → cross wires gone');
await t('toggleConns()');

// 9 · REAL-mouse wire click → the connector card (hit twins carry thin wires)
await settle();
const bg = await pg.evaluate(()=>{ const r=document.getElementById('cbg-stage').getBoundingClientRect();
  return { x:r.left+12, y:r.top+12 }; });          // empty stage corner — NEVER the nav sidebar
await pg.mouse.click(bg.x, bg.y); await pg.waitForTimeout(300);   // clear on background
const wxy = await pg.evaluate(()=>{
  const p=document.querySelector('#cbg-expansion .e-xfk'); if(!p) return null;
  const q=p.getPointAtLength(p.getTotalLength()/2);
  const c=window.__cbgtest.cam(), r=document.getElementById('cbg-stage').getBoundingClientRect(), s=c.base*c.zoom;
  return { x:r.left + c.fit[0]+c.panX + q.x*s, y:r.top + c.fit[1]+c.panY + q.y*s };
});
ok(!!wxy, 'a cross wire exists to click');
if(wxy){
  await pg.mouse.click(wxy.x, wxy.y);
  await pg.waitForTimeout(250);
  ok((await t('detailText()')).indexOf('connector')>=0, 'real click on a wire opens the connector card');
}

// 10 · lines default Bowed; Direct reachable
ok(await t('line()')==='bowed', 'Bowed is the default line style (round 45)');
await t('setLine("direct")'); ok(await t('line()')==='direct', 'Direct reachable'); await t('setLine("bowed")');

ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
await b.close();
console.log(`port1: ${P}/${P+F} pass`);
process.exit(F?1:0);
