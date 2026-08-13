// STATION PORT slice 3 — journeys · nav history · corner boxes.
// Journeys derive from the committed data (request walks from the L2 wires, the
// change walk from GABE_SIM) and resolve at PLAY time; the nav trail records
// travel (not plain clicks) and ← pops it; the Legend corner box carries the
// beat key + the level tail, the Controls box the gesture grammar. Counts are
// DERIVED from the committed fixture, never hardcoded.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const here = path.dirname(fileURLToPath(import.meta.url));

const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file://' + path.join(here, '..', 'codebase-graph.html'));
await pg.waitForFunction('window.__cbgready===true',{timeout:8000});
const t = expr => pg.evaluate(`window.__cbgtest.${expr}`);

// 1 · corner boxes: Controls starts min + toggles; the Legend box carries the
//     beat key AND the level tail; the full-width bottom bar is gone
ok(await t('keysMinNow()')===true, 'Controls box starts minimized');
await t('clickKeysMin()');
ok(await t('keysMinNow()')===false, 'Controls box expands');
ok(await pg.evaluate(()=>document.getElementById('cbg-keysBody').textContent.indexOf('zoom at the cursor')>=0),
   'the gesture grammar lives in the Controls box');
await t('clickKeysMin()');
ok(await t('stageLegendRows()')>0, 'the Legend box carries the beat key rows (SIM · L1)');
const tail = await t('legendTail()');
const nEnts = await t('l1nodes()');
ok(tail>=nEnts, `the legend TAIL (entity dots + wire kinds) lives in the same box (${tail} items)`);
ok(await pg.evaluate(()=>!document.querySelector('.cbg-root > .cbg-legend')),
   'the full-width bottom legend bar is GONE (corner-box ruling)');

// 2 · journeys: derived roster — the change walk + the request walks
const jl = await t('journeys()');
const expReq = await pg.evaluate(()=>{
  let n=0;
  for(const g of Object.values(window.GABE_C4.l2)){
    const touch={};
    g.edges.forEach(e=>{ if(e.kind==='touches') (touch[e.source]=touch[e.source]||[]).push(e.target); });
    g.nodes.forEach(x=>{ if(x.kind==='endpoint' && (touch[x.id]||[]).length) n++; });
  }
  return n;
});
ok(jl.filter(j=>j.kind==='change').length===1, 'the SIM change walk leads the roster');
ok(jl.filter(j=>j.kind==='request').length===expReq,
   `request walks derive from the wires (${expReq} endpoints with touches)`);
ok(jl.every(j=>j.n<=20), 'every walk is capped at 20 steps');

// 3 · the change walk: plays in L1, rings the participants, lights member links
await t('jrnPick(0)');
await pg.waitForTimeout(1400);   // ensure-view may re-render (fly-in settles)
ok((await t('view()'))==='l1', 'the change walk plays on the L1 explode');
let js = await t('jrnState()');
ok(js.cur!==null && js.resolved>=2, `steps resolve at play time (${js.resolved} resolved)`);
ok(await t('jrnRings()')>=js.resolved, 'every resolved participant wears the dashed ring');
ok(await t('jrnEdges()')>0, 'member links glow (cross-boundary coupling in-walk)');
ok((await t('detailText()')).length>0 && await t('lcRows()')===4,
   'landing on a piece opens its lifecycle card');
await t('jrnNext()'); await pg.waitForTimeout(250);
js = await t('jrnState()');
ok(js.i===1, 'next steps forward');
await t('jrnPrev()'); await pg.waitForTimeout(250);
ok((await t('jrnState()')).i===0, 'prev steps back');

// 4 · a request walk: auto-drills to its entity, steps land on the wires' pieces
const reqIdx = jl.findIndex(j=>j.kind==='request');
await t(`jrnPick(${reqIdx})`);
await pg.waitForTimeout(400);
ok((await t('view()'))==='l2:'+jl[reqIdx].ent, `a request walk auto-drills to l2:${jl[reqIdx].ent}`);
js = await t('jrnState()');
ok(js.resolved>=2, 'the walk resolves on the drill');
ok(await t('jrnRings()')>=js.resolved, 'participants ringed in L2');
await t('jrnNext()'); await pg.waitForTimeout(250);
ok((await t('selKeyNow()'))!==null, 'each step SELECTS the landed piece');
await t('jrnExit()'); await pg.waitForTimeout(150);
ok(await t('jrnRings()')===0 && await pg.evaluate(()=>getComputedStyle(document.getElementById('cbg-jrnBar')).display)==='none',
   'exit clears the overlay and hides the step bar');

// 5 · nav history: travel pushes, ← pops back to the previous card
await t('back()'); await pg.waitForTimeout(1400);
ok(await t('navDepth()')===0 && await t('navShown()')===false, 'the trail starts empty');
await t('openPiece("recipe","model:PlannedRecipe")'); await pg.waitForTimeout(200);
const jumped = await pg.evaluate(()=>{
  const b2=document.querySelector('#cbg-detail .cgo'); if(!b2) return null;
  const k=b2.getAttribute('data-k'); b2.click(); return k;
});
await pg.waitForTimeout(300);
ok(!!jumped, 'a transporter row exists to travel');
ok(await t('navDepth()')===1 && await t('navShown()')===true, 'travel pushes the trail (← 1)');
await t('navBack()'); await pg.waitForTimeout(300);
ok((await t('detailText()')).indexOf('PlannedRecipe')>=0 && await t('lcRows()')===4,
   '← lands back on the previous piece card');
ok(await t('navDepth()')===0 && await t('navShown()')===false, 'the trail is spent and hides');
// a plain out-of-chain click resets the chain (never grows it)
await t('openPiece("cooking","model:CookingSession")'); await pg.waitForTimeout(200);
ok(await t('navDepth()')===0, 'a plain click starts a fresh chain, never a push');

// 6 · TOOLBAR REDESIGN (operator 2026-08-13, Option B): one dense row — the
// journeys picker folds behind a ▷ popover with a count badge; Open-all is
// icon-only; the ~210px select no longer rides the toolbar.
ok((await t('jrnCount()'))===String(jl.length), 'the ▷ journeys button carries the derived count');
await t('clickJrnBtn()'); await pg.waitForTimeout(90);
ok(await t('jrnPopOpen()')===true, 'the ▷ button opens the journeys popover');
ok(await pg.evaluate(()=>document.getElementById('cbg-jrnPop').contains(document.getElementById('cbg-jrnSel'))),
   'the journeys select lives inside the popover (off the toolbar row)');
await t('clickJrnBtn()'); await pg.waitForTimeout(90);
ok(await t('jrnPopOpen()')===false, 'the button toggles the popover shut');
// the two popovers are MUTUALLY EXCLUSIVE (review 2026-08-13): opening one closes
// the other (the stopPropagation-blocks-the-other-dismiss bug is fixed).
await pg.evaluate(()=>document.getElementById('cbg-gear').click()); await pg.waitForTimeout(80);
ok(await t('gearOpen()')===true, 'the gear popover opens');
await t('clickJrnBtn()'); await pg.waitForTimeout(80);
ok(await t('jrnPopOpen()')===true && await t('gearOpen()')===false,
   'opening journeys closes the gear (popovers are mutually exclusive)');
await pg.evaluate(()=>document.getElementById('cbg-gear').click()); await pg.waitForTimeout(80);
ok(await t('gearOpen()')===true && await t('jrnPopOpen()')===false,
   'opening the gear closes journeys (the reverse holds too)');
await pg.evaluate(()=>document.getElementById('cbg-gear').click()); await pg.waitForTimeout(60);
ok(await pg.evaluate(()=>{ const b2=document.getElementById('cbg-openAll');
    return b2.textContent.trim()==='' && !!b2.querySelector('svg'); }),
   'Open-all is icon-only (round-36 grammar)');
// data-face must TRACK the real expand/collapse state (not a constant literal) — the
// openAllFace() hook + panel logic read it. Toggle Open-all and require both faces are
// reachable + distinct (a constant would fail this; the old face-text assert could not).
const df1 = await pg.evaluate(()=>document.getElementById('cbg-openAll').getAttribute('data-face'));
await pg.evaluate(()=>document.getElementById('cbg-openAll').click()); await pg.waitForTimeout(280);
const df2 = await pg.evaluate(()=>document.getElementById('cbg-openAll').getAttribute('data-face'));
ok((df1==='open'||df1==='close') && (df2==='open'||df2==='close') && df1!==df2,
   `Open-all data-face flips with the real expand/collapse state (${df1} → ${df2})`);
await pg.evaluate(()=>document.getElementById('cbg-openAll').click()); await pg.waitForTimeout(280);   // restore
// the crowding fix: at a realistic laptop width, with the change walk ACTIVE (the
// worst case — the step bar is up too), the toolbar no longer wraps to a second row
// (the old ~210px journeys select + text Open-all would have wrapped here).
await pg.setViewportSize({ width:1200, height:900 }); await pg.waitForTimeout(150);
const chgIdx = jl.findIndex(j=>j.kind==='change');
if(chgIdx>=0){ await t(`jrnPick(${chgIdx})`); await pg.waitForTimeout(400); }
const tbH = await pg.evaluate(()=>document.querySelector('.cbg-toolbar').offsetHeight);
ok(tbH < 66, `the toolbar stays ONE row at 1200px with a journey running (height ${tbH}px, wrap would ~double it)`);
await t('jrnExit()'); await pg.waitForTimeout(120);
await pg.setViewportSize({ width:1440, height:900 }); await pg.waitForTimeout(120);

ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
await b.close();
console.log(`port5: ${P}/${P+F} pass`);
process.exit(F?1:0);
