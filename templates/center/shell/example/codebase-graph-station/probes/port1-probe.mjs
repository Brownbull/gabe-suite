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
// engine: GABE_PW_DIR must be a node_modules that has `playwright` (full — the probes use
// its chromium). Default = this machine's npx cache; a fresh clone sets GABE_PW_DIR +
// GABE_CHROME_BIN (see probes/README.md).
const _PWBASE = process.env.GABE_PW_DIR || '/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/';
const require = createRequire(_PWBASE.replace(/\/?$/, '/') + 'x.js');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = 'file://' + path.join(here, '..', 'codebase-graph.html');

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable' });
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
ok(await t('line()')==='direct', 'Direct is the default line style (operator 2026-08-13; Bowed = the archive)');
await t('setLine("bowed")'); ok(await t('line()')==='bowed', 'Bowed reachable'); await t('setLine("direct")');

// 11 · rerenderKeepPanel (fresh-review): re-rendering controls keep the selection
await t('openPiece("recipe","model:PlannedRecipe")');
await pg.waitForTimeout(150);
await t('toggleConns()'); await pg.waitForTimeout(150);
ok(await t('selrings()')===1 && (await t('detailText()')).indexOf('PlannedRecipe')>=0,
   'Connections toggle keeps the open piece + its ring');
await t('toggleConns()');
await pg.evaluate(()=>{ document.getElementById('cbg-gear').click();
  document.querySelector('#cbg-iconsSeg [data-ico="classic"]').click(); });
await pg.waitForTimeout(200);
ok(await t('selrings()')===1 && await t('icons()')==='classic',
   'a REAL gear pill click keeps the selection (the fixed handler path)');
await pg.evaluate(()=>{ document.querySelector('#cbg-iconsSeg [data-ico="lucide"]').click();
  document.getElementById('cbg-gear').click(); });
await pg.waitForTimeout(150);
// Reset clears to the stage summary, no stray ring
await pg.evaluate(()=>{ document.getElementById('cbg-gear').click();
  document.getElementById('cbg-resetBtn').click(); document.getElementById('cbg-gear').click(); });
await pg.waitForTimeout(150);
ok(await t('selrings()')===0 && (await t('detailText()')).indexOf('Change summary')>=0,
   'Reset clears the panel target back to the stage summary');

// 12 · exploded-entity selection ring is VISIBLE (mounts on the container, not
//     the opacity-0 node) + Close-all demotes an open piece to its entity
await t('singleClick("recipe")'); await pg.waitForTimeout(150);
ok(await t('selringHost()')==='other', 'entity ring mounts outside the exploded node');
await t('openPiece("recipe","model:PlannedRecipe")'); await pg.waitForTimeout(100);
await pg.evaluate(()=>document.getElementById('cbg-openAll').click());   // Close all
await pg.waitForTimeout(250);
ok((await t('expandedNow()')).length===0, 'Close-all collapses everything');
ok((await t('detailText()')).indexOf('Recipe')>=0 && (await t('detailText()')).indexOf('lifecycle')<0,
   'the open PIECE demotes to its ENTITY card when its entity collapses');
let face = await t('openAllFace()');
ok(face.text==='Open all' && !face.on, 'the toggle face resynced (derived in render)');
await pg.evaluate(()=>document.getElementById('cbg-openAll').click());   // reopen
await pg.waitForTimeout(250);

// 13 · beat-ring contract: drift(22) never collides with ok(19) — review stage
await t('setStage("review")'); await pg.waitForTimeout(300);
ok(await pg.evaluate(()=>{
    const d=document.querySelector('.drift-ring'), o=document.querySelector('.ok-ring');
    return !!d && !!o && d.getAttribute('r')!==o.getAttribute('r');
  }), 'drift ring r differs from the ok ring (22 vs 19)');
await t('setStage("execute")'); await settle();

// 14 · REAL drag: release restores dot motion + the selection (the freeze bug).
// Drag a NON-exploded entity — an exploded node is pointer-inert (its container
// only takes clicks), so dragging it would be a container tap, not a drag.
await t('openPiece("recipe","model:PlannedRecipe")'); await pg.waitForTimeout(150);
const cxy = await screenXY('ent:auth');
await pg.mouse.move(cxy.x, cxy.y);
await pg.mouse.down(); await pg.mouse.move(cxy.x+35, cxy.y+20, {steps:5}); await pg.mouse.up();
await pg.waitForTimeout(600);
ok(await t('dotsAnimated()')>0, 'flow dots re-animate after a drag (release render)');
ok(await t('selrings()')>=1 && (await t('detailText()')).indexOf('PlannedRecipe')>=0,
   'the selection + card survive the drag');

// 15 · collapsed-entity cross wires: rim-anchored, selectable, stage-survivable
await t('dblClick("cooking")'); await settle();
ok((await t('expandedNow()')).join()==='recipe', 'cooking collapsed, recipe open');
const xw = await t('crossEdges()');
ok(xw>0, 'cross wires still drawn to the collapsed entity');
const rim = await pg.evaluate(()=>{
  const w=window.__cbgtest.nodeXY('ent:cooking'), r=window.__cbgtest.entR('cooking');
  const p=document.querySelector('#cbg-expansion .e-xfk'); if(!p||!w||!r) return null;
  const a=p.getPointAtLength(0), b=p.getPointAtLength(p.getTotalLength());
  const da=Math.hypot(a.x-w.x,a.y-w.y), db=Math.hypot(b.x-w.x,b.y-w.y);
  return { d:Math.min(da,db), r };
});
ok(!!rim && Math.abs(rim.d-(rim.r+6))<8, `wire end sits at the collapsed rim (~r+6; got ${rim&&rim.d&&rim.d.toFixed(1)} vs r=${rim&&rim.r})`);
const wxy2 = await pg.evaluate(()=>{
  const p=document.querySelector('#cbg-expansion .e-xfk');
  const q=p.getPointAtLength(p.getTotalLength()/2);
  const c=window.__cbgtest.cam(), r=document.getElementById('cbg-stage').getBoundingClientRect(), s=c.base*c.zoom;
  return { x:r.left + c.fit[0]+c.panX + q.x*s, y:r.top + c.fit[1]+c.panY + q.y*s };
});
await pg.mouse.click(wxy2.x, wxy2.y); await pg.waitForTimeout(250);
ok((await t('detailText()')).indexOf('connector')>=0, 'the rim-anchored wire opens its connector card');
await t('setStage("red")'); await pg.waitForTimeout(300);
ok((await t('detailText()')).indexOf('connector')>=0,
   'the connector card SURVIVES a stage switch (edge panelTarget re-found by keys)');
await pg.evaluate(()=>{ const r=[...document.querySelectorAll('#cbg-detail .jgo')]
    .find(x=>(x.getAttribute('data-k')||'').indexOf('ent:cooking')===0); if(r) r.click(); });
await pg.waitForTimeout(250);
ok((await t('detailText()')).toLowerCase().indexOf('cooking')>=0 && (await t('detailText()')).indexOf('entity')>=0,
   'the connector row travels to the collapsed ENTITY card (jumpToNode ent: branch)');
await t('setStage("execute")');
await t('dblClick("cooking")'); await settle();

// 16 · container timer never steals a piece click made just after it
await pg.evaluate(()=>{ const c=document.querySelector('#cbg-expansion .xcontainer');
  c.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); });
await pg.waitForTimeout(90);
await t('openPiece("recipe","model:PlannedRecipe")');   // stands in for the fast real click
await pg.evaluate(()=>{ /* piece handler path is the real canceller */ });
const stolen = await pg.evaluate(()=>new Promise(res=>setTimeout(()=>res(window.__cbgtest.detailText()),400)));
ok(stolen.indexOf('lifecycle')>=0 || stolen.indexOf('PlannedRecipe')>=0,
   'the piece card is NOT replaced by the container single-click 230ms later');

ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
await b.close();
console.log(`port1: ${P}/${P+F} pass`);
process.exit(F?1:0);
