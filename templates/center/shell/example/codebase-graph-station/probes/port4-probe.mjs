// STATION PORT slice 2 — the PANEL JOIN: enriched cards over LIVE archmap data.
// The emitter's per-node `det` block (PURPOSE · STRUCTURE · SIGNATURE ·
// TESTED-BY, capped + honest-empty) renders on the L2 drill cards AND joins
// under the sim piece's lifecycle card. Every expected count is DERIVED from
// the committed det data — never hardcoded.
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

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable' });
const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file://' + path.join(here, '..', 'codebase-graph.html'));
await pg.waitForFunction('window.__cbgready===true',{timeout:8000});
const t = expr => pg.evaluate(`window.__cbgtest.${expr}`);

// 0 · the fixture carries det (regen guard: a bare c4-graph.js fails loudly here)
const cov = await pg.evaluate(()=>{
  let det=0, all=0;
  Object.values(window.GABE_C4.l2).forEach(g=>g.nodes.forEach(n=>{ all++; if(n.det) det++; }));
  return {det, all};
});
ok(cov.det>0 && cov.det/cov.all>0.8, `the example carries det (${cov.det}/${cov.all} nodes)`);

// 1 · L2 endpoint card: PURPOSE + route rows + SIGNATURE + TESTED-BY (derived)
await t('drill("recipe")'); await pg.waitForTimeout(200);
const epx = await pg.evaluate(()=>{
  const n=window.GABE_C4.l2.recipe.nodes.find(x=>x.id==='endpoint:GET /recipes');
  if(!n || !n.det || !n.det.doc || !n.det.sig || !(n.det.cases||[]).length) return null;
  return { id:n.id, doc:n.det.doc, fn:n.fn, ret:n.det.sig.returns,
           cases:n.det.cases.length, more:n.det.cases_more||0, cid:n.det.cases[0].cid,
           nfail:n.det.cases.filter(c=>c.state!=='pass'&&c.state!=='skip').length };
});
ok(!!epx, 'fixture shape: GET /recipes carries doc+sig+cases (regen guard)');
if(!epx){ await b.close(); console.log(`port4: ${P}/${P+F} pass`); process.exit(1); }
await t(`singleClick(${JSON.stringify(epx.id)})`); await pg.waitForTimeout(200);
let txt = await t('detailText()');
ok(txt.indexOf(epx.doc.slice(0,30))>=0, 'endpoint card carries its PURPOSE (live doc)');
ok(txt.indexOf(epx.fn+'()')>=0, 'the handler row names the route fn');
ok(txt.indexOf('signature')>=0 && txt.indexOf(epx.ret)>=0, 'SIGNATURE shows the return type');
ok(txt.indexOf('tested by ('+(epx.cases+epx.more)+')')>=0,
   `TESTED-BY headlines the FULL ledger (${epx.cases}+${epx.more})`);
ok(txt.indexOf(epx.cid)>=0, 'case rows carry their C-ids');
ok(txt.indexOf('entity')>=0 && txt.indexOf('layer')>=0, 'entity + layer rows present');
let d1 = await t('dossier()');
ok(d1.ptabs>=2 && d1.cids>0, 'dossier tables rendered (signature + tested-by)');
const nFail = await pg.evaluate(()=>document.querySelectorAll('#cbg-detail td.st-fail').length);
ok(nFail===epx.nfail, `only REAL failures wear st-fail (${epx.nfail} expected — file/skip rows never do)`);
ok(txt.indexOf("'")===-1 || txt.indexOf('UniqueConstraint')<0, 'no raw constraint exprs leak into the card');

// 2 · L2 model card: STRUCTURE capped + unique chips + STORED-AS + usage + file
const mox = await pg.evaluate(()=>{
  const n=window.GABE_C4.l2.recipe.nodes.find(x=>x.id==='model:Recipe');
  if(!n || !n.det || !(n.det.cols||[]).length) return null;
  return { cols:n.det.cols.length, more:n.det.cols_more||0, uq:(n.det.uqs||[])
           .filter(u=>n.det.cols.some(c=>c[0]===u)).length,
           fks:(n.det.fks||[]).length, file:n.det.file };
});
ok(!!mox, 'fixture shape: model:Recipe carries cols (regen guard)');
await t('singleClick("model:Recipe")'); await pg.waitForTimeout(200);
txt = await t('detailText()');
ok(txt.indexOf('structure ('+(mox.cols+mox.more)+' columns)')>=0,
   `STRUCTURE headlines all ${mox.cols+mox.more} columns (${mox.cols} shown)`);
ok(txt.indexOf('+'+mox.more+' more column')>=0 || mox.more===0, 'the cap is named, never silent');
d1 = await t('dossier()');
ok(d1.uq===mox.uq, `unique chips match the visible uqs (${mox.uq})`);
ok(mox.fks===0 || txt.indexOf('stored as')>=0, 'STORED-AS renders when the model has fks');
ok(txt.indexOf(mox.file)>=0, 'the file row names the source file');
ok(txt.indexOf('usage')>=0, 'the usage row renders (fan-in bars)');

// 2b · the unique chip actually FIRES somewhere real (normalized uqs ∩ shown cols)
const uqNode = await pg.evaluate(()=>{
  for(const [slug,g] of Object.entries(window.GABE_C4.l2)){
    for(const n of g.nodes){
      if(!n.det || !(n.det.uqs||[]).length) continue;
      const hits=(n.det.uqs||[]).filter(u=>(n.det.cols||[]).some(c=>c[0]===u)).length;
      if(hits>0) return { slug, id:n.id, hits };
    }
  }
  return null;
});
ok(!!uqNode, 'the fixture carries a model whose unique columns are visible');
if(uqNode){
  await t('back()'); await pg.waitForTimeout(100);
  await t(`drill(${JSON.stringify(uqNode.slug)})`); await pg.waitForTimeout(200);
  await t(`singleClick(${JSON.stringify(uqNode.id)})`); await pg.waitForTimeout(200);
  const dq = await t('dossier()');
  ok(dq.uq===uqNode.hits && dq.uq>0,
     `unique chips FIRE on real data (${uqNode.hits} on ${uqNode.id}) — the dead-join regression guard`);
}

// 3 · honest-empty: DELETE a node's det in-page — the bare card must not crash
// (the fixture has no det-less non-external node, so the old hunt self-skipped)
await t('back()'); await pg.waitForTimeout(100);
await pg.evaluate(()=>{ const n=window.GABE_C4.l2.recipe.nodes.find(x=>x.id==='model:Recipe');
  delete n.det; });
await t('drill("recipe")'); await pg.waitForTimeout(200);
await t('singleClick("model:Recipe")'); await pg.waitForTimeout(200);
const d2 = await t('dossier()');
ok(d2.ptabs===0, 'a det-less piece renders NO dossier tables (honest-empty, forced)');
ok((await t('detailText()')).length>0, 'the bare card still renders');

// 4 · the SIM PANEL JOIN: lifecycle card → layer row + dossier → connections
await t('back()'); await pg.waitForTimeout(300);
ok(await t('hasDet("recipe","model:PlannedRecipe")')===true, 'the piece has an L2 det twin');
await t('openPiece("recipe","model:PlannedRecipe")'); await pg.waitForTimeout(250);
txt = await t('detailText()');
ok(await t('lcRows()')===4, 'the lifecycle card leads (sim-panel intact)');
const pcx = await pg.evaluate(()=>{
  const n=window.GABE_C4.l2.recipe.nodes.find(x=>x.id==='model:PlannedRecipe');
  return { cols:n.det.cols.length+(n.det.cols_more||0) };
});
ok(txt.indexOf('structure ('+pcx.cols+' columns)')>=0,
   'the piece card JOINS the structural dossier (live archmap)');
ok(txt.indexOf('layer')>=0, 'the joined dossier leads with the layer row');
ok(await t('conRows()')>0, 'the connections tail still closes the panel');
ok(await pg.evaluate(()=>{
    const d=document.getElementById('cbg-detail');
    const lc=d.querySelector('.lifecycle'), pt=d.querySelector('table.ptab'), cr=d.querySelector('.conrow');
    return !!lc && !!pt && !!cr
      && (lc.compareDocumentPosition(pt) & Node.DOCUMENT_POSITION_FOLLOWING)
      && (pt.compareDocumentPosition(cr) & Node.DOCUMENT_POSITION_FOLLOWING);
  }), 'panel order: lifecycle → dossier → connections');
// the join survives a stage flip (reopenPanel path re-appends it)
await t('setStage("red")'); await pg.waitForTimeout(300);
txt = await t('detailText()');
ok(txt.indexOf('PlannedRecipe')>=0 && txt.indexOf('structure (')>=0,
   'the dossier survives a stage switch with the piece');
await t('setStage("execute")');

ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
await b.close();
console.log(`port4: ${P}/${P+F} pass`);
process.exit(F?1:0);
