// ARCHIVE PORT — the codebase archive inherits the LAB GRAMMAR via the shared
// assets/graph-grammar.js: Lucide icons (Classic reachable), halo-trimmed BOWED
// wires (the archive's signature — the change graph reads direct), entity-
// gradient cross wires + flow dots, the selection engine (depth · peek ·
// travel · ← trail), BEAT rings on a replayed phase, the corner boxes, and the
// det dossier on piece cards. Counts DERIVED from the committed fixtures.
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
await pg.goto('file://' + path.join(here, '..', 'codebase-archive.html'));
await pg.waitForFunction('window.__ecoready===true',{timeout:8000});
const t = expr => pg.evaluate(`window.__ecotest.${expr}`);

// 1 · boot: the ecosystem in the lab grammar — icons, halos, dots, gradients
ok(await t('line()')==='bowed', 'BOWED is the archive default (operator 2026-08-13)');
ok(await t('icons()')==='lucide', 'Lucide is the default set');
// the FULL SURFACE (kind coverage 2026-08-13): models + schemas in the core, API
// endpoints on the border — counts DERIVED from GABE_C4.l2, never hardcoded.
const kc = await pg.evaluate(()=>{ const o={model:0,schema:0,endpoint:0};
  Object.values(window.GABE_C4.l2).forEach(g=>g.nodes.forEach(n=>{ if(o[n.kind]!=null) o[n.kind]++; })); return o; });
const nPieces = kc.model + kc.schema + kc.endpoint;
ok(await t('pieceKind("model")')===kc.model, `every model drawn in the core (${kc.model})`);
ok(await t('pieceKind("schema")')===kc.schema, `every schema drawn in the core (${kc.schema})`);
ok(await t('pieceKind("endpoint")')===kc.endpoint, `every API endpoint on the border (${kc.endpoint})`);
ok(await t('touchEdges()')>0, 'touch wires link endpoints to the pieces they read/write');
ok(await pg.evaluate(()=>[...document.querySelectorAll('#eco-viewport path')]
    .some(p=>(p.getAttribute('d')||'').startsWith('M3 5v14a9 3 0 0 0 18 0V5'))),
   'pieces draw the lucide db cylinder');
ok(await t('halos()')>=nPieces, 'every surface piece wears the 14px halo');
ok(await t('flowdots()')>0 && await t('gradients()')>0,
   'gradient wires + flow dots (the amber marching dash died)');
ok(await pg.evaluate(()=>document.querySelectorAll('#eco-viewport marker').length)===0,
   'no arrowheads — dots carry direction');
const xc = await t('xcrossEdges()');
ok(xc>0, `ecosystem cross wires drawn (${xc})`);
ok(await t('intraEdges()')>0, 'intra coupling drawn (entity colour)');
ok(await pg.evaluate(()=>{
    const p=document.querySelector('#eco-expansion .xedge.intra:not(.hot)');
    return p && (p.getAttribute('d')||'').indexOf('Q')>=0;
  }), 'intra wires are curve()d (bowed default)');

// 2 · corner boxes: Legend box + Controls box; the bottom bar is gone
ok(await t('keysMinNow()')===true, 'Controls box starts minimized');
await t('clickKeysMin()');
ok(await pg.evaluate(()=>document.getElementById('eco-keysBody').textContent.indexOf('zoom at the cursor')>=0),
   'the gesture grammar lives in the Controls box');
await t('clickKeysMin()');
ok(await pg.evaluate(()=>{
    const box=document.getElementById('eco-legendbox');
    return !!box.querySelector('#eco-legend') && box.querySelectorAll('.eco-legend .item, .eco-legend .grp .item').length>0;
  }), 'the Legend corner box carries the entity tail');
ok(await pg.evaluate(()=>!document.querySelector('.eco-root > .eco-legend')),
   'the full-width bottom legend bar is GONE');

// 3 · selection engine: click a piece → ring + hops + card + connections + dossier
// the pick must sit on a DRAWN wire (an intra model↔model FK) — an unwired
// model would honestly render zero connections and starve the travel asserts
const pick = await pg.evaluate(()=>{
  for(const [slug,g] of Object.entries(window.GABE_C4.l2)){
    const models={}; g.nodes.forEach(x=>{ if(x.kind==='model') models[x.id]=x; });
    const e=(g.edges||[]).find(x=>x.kind==='fk' && models[x.source] && models[x.target]
      && models[x.source].det && (models[x.source].det.cols||[]).length);
    if(e) return {slug, id:e.source};
  } return null;
});
ok(!!pick, 'a det-carrying, FK-wired model exists to select');
await t(`openPieceFor(${JSON.stringify(pick.slug)},${JSON.stringify(pick.id)})`);
await pg.waitForTimeout(200);
let txt = await t('panelText()');
ok(txt.indexOf('structure (')>=0, 'the piece card joins the det DOSSIER (live archmap)');
let d1 = await t('dossier()');
ok(d1.ptabs>0, 'dossier tables render in the archive panel');
// a real selection via the piece's registered key
await pg.evaluate((k)=>{ const g=[...document.querySelectorAll('#eco-expansion .xpiece')]
    .find(x=>x.getAttribute('data-piece')===k); if(g) g.dispatchEvent(new MouseEvent('click',{bubbles:false,cancelable:true})); },
  pick.slug+'|'+pick.id);
await pg.waitForTimeout(200);
ok(await t('selrings()')===1, 'the spinning selection ring mounts');
const hops = await t('hopCounts()');
ok(hops[1]>0, 'hop-1 connectors lit (BFS)');
ok(await t('conRows()')>0, 'the connections tail closes the panel');
await t('setDepth(1)');
ok((await t('hopCounts()'))[2]===0, 'depth 1 → only hop-1');
await t('setDepth(5)');
await t('hoverConn(0)');
ok(await t('peeked()')>0, 'hover peek pulses the far element');

// 4 · travel + the ← trail
const jumped = await pg.evaluate(()=>{
  const b2=document.querySelector('#eco-panel .cgo'); if(!b2) return null;
  const k=b2.getAttribute('data-k'); b2.click(); return k;
});
await pg.waitForTimeout(250);
ok(!!jumped, 'a transporter row travels');
ok(await t('navDepth()')===1 && await t('navShown()')===true, 'travel pushes the ← trail');
await t('navBack()'); await pg.waitForTimeout(250);
ok((await t('panelText()')).indexOf(pick.id.replace('model:',''))>=0, '← lands back on the previous card');
ok(await t('navDepth()')===0, 'the trail is spent');

// 5 · phase replay: BEAT rings from the committed archive (derived counts)
const ph = await pg.evaluate(()=>{
  const ps=window.GABE_SIM_ARCHIVE.phases;
  const p=ps.find(x=>x.stages && x.stages.execute)||ps[ps.length-1];
  const xst=(p.stages.execute||{}).pieces||{};
  let heat=0; Object.values(xst).forEach(d=>{ if(d.changed) heat++; });
  let commit=0; Object.values(p.pieces||{}).forEach(arr=>arr.forEach(pc=>{ if(pc.role==='changed') commit++; }));
  return { phase:p.phase, heat, commit, touched:p.touched, blast:p.blast };
});
await t(`pick(${JSON.stringify(ph.phase)})`);
await pg.waitForTimeout(600);
ok(await t('selectedPhase()')===ph.phase, `replaying ${ph.phase}`);
let r = await t('rings()');
ok(r.heat===ph.heat, `execute: ${ph.heat} heat rings on the replay (got ${r.heat})`);
ok((await t('touchedNow()')).join()===ph.touched.join(), 'touched entities tinted');
await t('setStage("commit")'); await pg.waitForTimeout(400);
r = await t('rings()');
ok(r.commit===ph.commit, `commit: ${ph.commit} purple rings (got ${r.commit})`);
ok((await t('panelText()')).indexOf(ph.phase)>=0, 'the phase panel survives the lens flip');
// the panel target survives a stage flip when a piece is open
const phPiece = await pg.evaluate(()=>{
  const ps=window.GABE_SIM_ARCHIVE.phases, p=ps.find(x=>x.stages && x.stages.execute)||ps[ps.length-1];
  for(const [slug,arr] of Object.entries(p.pieces||{}))
    for(const pc of arr) if(pc.role==='changed') return {slug, id:pc.id};
  return null;
});
if(phPiece){
  await t(`openPieceFor(${JSON.stringify(phPiece.slug)},${JSON.stringify(phPiece.id)})`);
  await pg.waitForTimeout(200);
  await t('setStage("red")'); await pg.waitForTimeout(400);
  ok((await t('panelText()')).indexOf(phPiece.id.replace('model:',''))>=0,
     'the open piece card survives a stage flip (ecoTarget replay)');
} else { ok(true, 'no changed piece in the fixture (skip)'); }
await t('pick("")'); await pg.waitForTimeout(400);
ok(await t('selectedPhase()')===null, 'Everything returns to the ecosystem');

// 6 · Classic still reachable; Direct reachable; conns toggle
await t('setIcons("classic")');
ok(await pg.evaluate(()=>[...document.querySelectorAll('#eco-viewport path')]
    .some(p=>(p.getAttribute('d')||'').startsWith('M-6.8 -3 v6'))),
   'Classic (the settled cylinder) reachable');
await t('setIcons("lucide")');
await t('setLine("direct")'); ok(await t('line()')==='direct', 'Direct reachable'); await t('setLine("bowed")');
const x0 = await t('xcrossEdges()');
await t('toggleConns()');
ok(await t('xcrossEdges()')===0 && await t('intraEdges()')===0, 'Connections OFF → piece wires gone');
await t('toggleConns()');
ok(await t('xcrossEdges()')===x0, 'Connections ON restores them');

ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
await b.close();
console.log(`port6: ${P}/${P+F} pass`);
process.exit(F?1:0);
