/* Batch-11 proof against the committed example page. Grows with the slices:
   [A] per-kind wire COLOR + SHAPE mutate CONN → real wire material + row sample + legend all follow
   Run: node verify-fleet.mjs */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4000);

// [A] wire styling: drive the DOM controls, assert CONN + material + sample + legend agree
const wire = await p.evaluate(() => {
  document.querySelector('.cfgtab[data-pane="routes"]').click();
  const out = {};
  // color via the input (fk → red)
  const inp = document.querySelector('input[data-wcol="fk"]');
  inp.value = '#ff0000'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  // shape via the pill (fk → solid)
  const btn = document.querySelector('.pill[data-wshape="fk"] button[data-v="solid"]'); btn.click();
  out.connColor = CONN.fk.color === 0xff0000; out.connStyle = CONN.fk.style === 'solid';
  updateConnectors();
  let solidRed = 0, dashedFk = 0;
  connGroup.children.forEach(w => { if (w.material.color.getHex() === 0xff0000) {
    if (w.material.isLineDashedMaterial) dashedFk++; else solidRed++; } });
  out.solidRedWires = solidRed; out.dashedLeft = dashedFk;
  // sample follows
  const samp = document.querySelector('[data-wsamp="fk"] svg path');
  out.sampColor = samp && samp.getAttribute('stroke') === '#ff0000';
  out.sampSolid = samp && !samp.getAttribute('stroke-dasharray');
  // legend derives from CONN (svg, not the border-bottom div) — open its CONNECTORS tab first
  // (the legend renders only the active tab; rows are built from CONN at render time)
  const ltab = [...document.querySelectorAll('#elegend .lgtab')]
    .find(el => /connector/i.test(el.textContent)); if (ltab) ltab.click();
  const legRows = [...document.querySelectorAll('#elegend svg.lgln path')];
  out.legendTab = !!ltab; out.legendRows = legRows.length;
  out.legendHasRed = legRows.some(pa => pa.getAttribute('stroke') === '#ff0000' && !pa.getAttribute('stroke-dasharray'));
  // sparse renders a real dasharray sample
  const sp = document.querySelector('.pill[data-wshape="calls"] button[data-v="sparse"]'); sp.click();
  out.sparseIsSparse = CONN.calls.style === 'sparse';
  const csamp = document.querySelector('[data-wsamp="calls"] svg path');
  out.sparseSample = csamp && csamp.getAttribute('stroke-dasharray') === '5 10';
  // reset restores stock
  document.querySelector('button[data-wreset="fk"]').click();
  document.querySelector('button[data-wreset="calls"]').click();
  out.resetColor = CONN.fk.color === 0x5893ad && CONN.fk.style === 'dashed' && CONN.calls.style === 'dashed';
  updateConnectors();
  return out;
});
// [B1] FLEET panel: per-entity show/subs — absence proofs match the real mechanism
//      (hidden = the node's three object REMOVED from the scene, not a visible flag)
const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const fleet = await p.evaluate(() => {
  const e = _ents[0];
  const rows = document.querySelectorAll('#fleet .flrow:not(.flmaster):not(.flpresets)').length;
  return { panel: !!document.getElementById('fleet'), rows, ent: e, entCount: _ents.length,
    entNodes: nodes.filter(n => n.ent === e).length };
});
await p.evaluate(ent => { document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="show"]`).click(); }, fleet.ent);
await raf(); await p.waitForTimeout(600);
const hidden = await p.evaluate(ent => {
  const gone = nodes.filter(n => n.ent === ent).every(n => !n.__threeObj || !n.__threeObj.parent);
  const hulls = CLUSTERS.filter(c => c.name === ent).length;
  let wires = 0; connGroup.children.forEach(() => wires++);
  const expected = links.filter(l => { const s = NIDS[lid(l.source)], t = NIDS[lid(l.target)];
    return s && t && visN(s).show && visN(t).show; }).length;
  const shuttles = MOVERS.filter(m => (NIDS[m.src] || {}).ent === ent || (NIDS[m.tgt] || {}).ent === ent).length;
  return { gone, hulls, wires, expected, shuttles };
}, fleet.ent);
// re-show ×3 round-trips — clicks in separate evaluates, waits OUTSIDE (rAF starves inside evaluate)
for (let i = 0; i < 7; i++) {   // odd count: ends SHOWN (started hidden)
  await p.evaluate(ent => { document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="show"]`).click(); }, fleet.ent);
  await raf(); await p.waitForTimeout(300);
}
const reg = await p.evaluate(ent => ({
  restored: nodes.filter(n => n.ent === ent).some(n => n.__threeObj && n.__threeObj.parent),
  wiresBack: connGroup.children.length }), fleet.ent);
// subs column: sub-hull count drops for that entity only; masters-dim mirrors CFG.subOn
const subsBefore = await p.evaluate(ent => ({
  all: CLUSTERS.filter(c => c.level === 'sub').length,
  ent: CLUSTERS.filter(c => c.level === 'sub' && c.members.some(id => (NIDS[id] || {}).ent === ent)).length }), fleet.ent);
await p.evaluate(ent => { document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="subs"]`).click(); }, fleet.ent);
await raf(); await p.waitForTimeout(400);
const subs = await p.evaluate(ent => {
  const after = { all: CLUSTERS.filter(c => c.level === 'sub').length,
    ent: CLUSTERS.filter(c => c.level === 'sub' && c.members.some(id => (NIDS[id] || {}).ent === ent)).length };
  document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="subs"]`).click();
  CFG.subOn = false; applyCfg('subOn');
  const dimmed = document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="subs"]`).classList.contains('mdim');
  CFG.subOn = true; applyCfg('subOn');
  return { after, dimmed };
}, fleet.ent);
// card honesty + preset namespace preservation
await p.evaluate(ent => { const n = nodes.find(x => x.ent === ent); showPanel(n); window.SEL = { kind: 'node', data: n };
  __uniApplyVisPreset({ ent: { [ent]: { show: 0 } }, node: { 'model:X': { role: 'touched' } }, meta: { stage: 'execute' } }); }, fleet.ent);
await raf(); await p.waitForTimeout(400);
const noted = await p.evaluate(() => !!document.querySelector('#pbody .fleethid'));
await p.evaluate(ent => { __uniApplyVisPreset({ ent: { [ent]: { show: 1 } } }); }, fleet.ent);
await raf(); await p.waitForTimeout(400);
const cardNote = await p.evaluate(() => ({
  noteCleared: !document.querySelector('#pbody .fleethid'),
  nodeKept: !!(UNIVIS.node['model:X'] && UNIVIS.node['model:X'].role === 'touched'),
  metaKept: UNIVIS.meta.stage === 'execute' }));
// [B1-fn] the NENT trap: Functions ON + hidden entity → connector count matches the visible-pair expectation
await p.evaluate(() => { CFG.showFns = 'on'; applyCfg('showFns'); });
await p.waitForTimeout(1500);
await p.evaluate(ent => { document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="show"]`).click(); }, fleet.ent);
await raf(); await p.waitForTimeout(500);
const fnCase = await p.evaluate(ent => {
  let touching = 0; links.forEach(l => { const s = NIDS[lid(l.source)], t = NIDS[lid(l.target)];
    if ((s && s.ent === ent) || (t && t.ent === ent)) touching++; });
  const wireCount = connGroup.children.length;
  const expected = links.filter(l => { const s = NIDS[lid(l.source)], t = NIDS[lid(l.target)];
    return s && t && visN(s).show && visN(t).show; }).length;
  return { nodesNow: nodes.length, touching, wireCount, expected, match: wireCount === expected };
}, fleet.ent);
await p.evaluate(ent => { document.querySelector(`#fleet .fltog[data-fent="${ent}"][data-fcol="show"]`).click();
  CFG.showFns = 'off'; applyCfg('showFns'); }, fleet.ent);
await p.waitForTimeout(600);

// [B2] zones + routes on a ?war=1 page (masters ON — otherwise every zone assert is vacuously green)
const p2 = await b.newPage({ viewport: { width: 1400, height: 860 } });
p2.on('pageerror', e => errs.push('PE2:' + e.message));
p2.on('console', m => { if (m.type() === 'error') errs.push('CE2:' + m.text()); });
await p2.goto('file://' + PAGE + '?war=1');
await p2.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p2.waitForFunction('window.__shipsReady===true', { timeout: 30000 }).catch(() => {});
await p2.waitForTimeout(4000);
const raf2 = () => p2.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const meshCount = ent => p2.evaluate(e => {
  let c = 0; nodes.filter(n => n.ent === e).forEach(n => { if (n.__threeObj) n.__threeObj.traverse(() => c++); }); return c; }, ent);
const zoneBase = await p2.evaluate(() => ({ ent: _ents[0], ctrl: _ents[1], fleettick: FLEETTICK.length,
  warOn: CFG.warOn, dimmed: document.querySelector(`#fleet .fltog[data-fcol="zDef"]`).classList.contains('mdim') }));
const entMesh0 = await meshCount(zoneBase.ent), ctrlMesh0 = await meshCount(zoneBase.ctrl);
await p2.evaluate(e => { document.querySelector(`#fleet .fltog[data-fent="${e}"][data-fcol="zDef"]`).click();
  document.querySelector(`#fleet .fltog[data-fent="${e}"][data-fcol="zSat"]`).click(); }, zoneBase.ent);
await raf2(); await p2.waitForTimeout(600);
const entMesh1 = await meshCount(zoneBase.ent), ctrlMesh1 = await meshCount(zoneBase.ctrl);
// registry stability with REAL fleets across hide/show round-trips (B1 tested it at 0)
const ft0 = await p2.evaluate(() => FLEETTICK.length);
for (let i = 0; i < 4; i++) {   // even: ends shown
  await p2.evaluate(e => { document.querySelector(`#fleet .fltog[data-fent="${e}"][data-fcol="show"]`).click(); }, zoneBase.ent);
  await raf2(); await p2.waitForTimeout(350);
}
const ft1 = await p2.evaluate(() => FLEETTICK.length);
// routes column: only that entity's shuttles die
const routesBefore = await p2.evaluate(e => ({
  ent: MOVERS.filter(m => (NIDS[m.src] || {}).ent === e || (NIDS[m.tgt] || {}).ent === e).length,
  all: MOVERS.length }), zoneBase.ent);
await p2.evaluate(e => { document.querySelector(`#fleet .fltog[data-fent="${e}"][data-fcol="routes"]`).click(); }, zoneBase.ent);
await raf2(); await p2.waitForTimeout(400);
const routesAfter = await p2.evaluate(e => ({
  ent: MOVERS.filter(m => (NIDS[m.src] || {}).ent === e || (NIDS[m.tgt] || {}).ent === e).length,
  all: MOVERS.length }), zoneBase.ent);
// masters-dim live sync: flip the zDef global off → the column dims
const dimSync = await p2.evaluate(() => { CFG.zDef = false; applyCfg('zDef');
  const d = document.querySelector('#fleet .fltog[data-fcol="zDef"]').classList.contains('mdim');
  CFG.zDef = true; applyCfg('zDef'); return d; });
// [B3] CLUSTER rows: expand via the entity name, counter, per-cluster hide + zone scoping, regroup
const clus = await p2.evaluate(() => {
  const e = _ents[1];
  const distinct = {}; nodes.forEach(n => { if (n.ent === e) distinct[n.sub] = (distinct[n.sub] || 0) + 1; });
  document.querySelector(`#fleet .flx[data-flx="${e}"]`).click();     // expand (re-renders)
  const rows = new Set([...document.querySelectorAll(`#fleet .fltog[data-fent="${e}"][data-fsub]`)]
    .map(b => b.getAttribute('data-fsub'))).size;                     // DISTINCT sub keys — stale-proof against column growth
  const cnt = +document.querySelector(`#fleet .flx[data-flx="${e}"] .flcnt`).textContent;
  const styled = !!document.querySelector('#fleet .fltog.flstog');
  const biggest = Object.keys(distinct).sort((a, b) => distinct[b] - distinct[a])[0];
  return { e, expected: Object.keys(distinct).length, rows, cnt, styled, sub: biggest, subSize: distinct[biggest] };
});
await p2.evaluate(c => { document.querySelector(`#fleet .fltog[data-fent="${c.e}"][data-fsub="${c.sub}"][data-fcol="show"]`).click(); }, clus);
await raf2(); await p2.waitForTimeout(500);
const clusHide = await p2.evaluate(c => {
  const inSub = n => n.ent === c.e && n.sub === c.sub;
  const subGone = nodes.filter(inSub).every(n => !n.__threeObj || !n.__threeObj.parent);
  const restShown = nodes.filter(n => n.ent === c.e && n.sub !== c.sub).some(n => n.__threeObj && n.__threeObj.parent);
  const subHull = CLUSTERS.filter(cl => cl.level === 'sub' && cl.members.some(id => { const n = NIDS[id]; return n && inSub(n); })).length;
  const entHull = CLUSTERS.filter(cl => cl.level === 'ent' && cl.name === c.e).length;
  return { subGone, restShown, subHull, entHull };
}, clus);
await p2.evaluate(c => { document.querySelector(`#fleet .fltog[data-fent="${c.e}"][data-fsub="${c.sub}"][data-fcol="show"]`).click(); }, clus);
await raf2(); await p2.waitForTimeout(400);
// per-cluster zone off scopes to the cluster's nodes only
const subMesh = c => p2.evaluate(cc => { let m = 0;
  nodes.filter(n => n.ent === cc.e && n.sub === cc.sub).forEach(n => { if (n.__threeObj) n.__threeObj.traverse(() => m++); }); return m; }, c);
const sm0 = await subMesh(clus);
await p2.evaluate(c => { document.querySelector(`#fleet .fltog[data-fent="${c.e}"][data-fsub="${c.sub}"][data-fcol="zDef"]`).click();
  document.querySelector(`#fleet .fltog[data-fent="${c.e}"][data-fsub="${c.sub}"][data-fcol="zSat"]`).click(); }, clus);
await raf2(); await p2.waitForTimeout(600);
const sm1 = await subMesh(clus);
// regroup: a core change re-derives the groups and drops stale overrides
const regroup = await p2.evaluate(c => { const staleKeys = Object.keys(UNIVIS.sub).length;
  CFG.coreBy = 'tests'; applyCfg('coreBy');
  const cnt2 = +document.querySelector(`#fleet .flx[data-flx="${c.e}"] .flcnt`).textContent;
  const kept = Object.keys(UNIVIS.sub).length;
  return { staleKeys, cnt2, kept }; }, clus);
// [C] presets: sim feed loaded (GABE_SIM null at rest on the example) · In-flight honestly stubbed ·
//     None hides everything, All restores — through the same preset entry point
const presetC = await p2.evaluate(() => ({
  simDefined: typeof window.GABE_SIM !== 'undefined', simAtRest: window.GABE_SIM === null,
  stub: (document.querySelector('#fleet .flpre[data-fpre="inflight"]') || {}).disabled === true,
  stubTitle: (document.querySelector('#fleet .flpre[data-fpre="inflight"]') || {}).title || '' }));
await p2.evaluate(() => { document.querySelector('#fleet .flpre[data-fpre="none"]').click(); });
await raf2(); await p2.waitForTimeout(600);
const noneState = await p2.evaluate(() => ({
  anyShown: nodes.some(n => n.__threeObj && n.__threeObj.parent), hulls: CLUSTERS.length, movers: MOVERS.length }));
await p2.evaluate(() => { document.querySelector('#fleet .flpre[data-fpre="all"]').click(); });
await raf2(); await p2.waitForTimeout(600);
const allState = await p2.evaluate(() => ({
  shown: nodes.filter(n => n.__threeObj && n.__threeObj.parent).length, hulls: CLUSTERS.length }));
// [B4-fix] ALL master row propagates into cluster overrides; a cluster switch dims when its entity is off
const masterFix = await p2.evaluate(() => {
  const e = _ents[1];
  if (!_flOpen[e]) document.querySelector(`#fleet .flx[data-flx="${e}"]`).click();
  const sBtn = document.querySelector(`#fleet .fltog[data-fent="${e}"][data-fsub][data-fcol="show"]`);
  const sub = sBtn.getAttribute('data-fsub'); sBtn.click();           // cluster override OFF
  const offBefore = (UNIVIS.sub[e + '|' + sub] || {}).show === 0;
  const m = document.querySelector('#fleet .flmaster .fltog[data-fcol="show"]');
  m.click(); m.click();                                               // all OFF, then all ON — the bulk gesture must reach the override
  const propagated = (UNIVIS.sub[e + '|' + sub] || {}).show === 1;
  document.querySelector(`#fleet .fltog[data-fent="${e}"]:not([data-fsub])[data-fcol="show"]`).click();
  const dim = document.querySelector(`#fleet .fltog[data-fent="${e}"][data-fsub="${sub}"][data-fcol="show"]`).classList.contains('mdim');
  document.querySelector(`#fleet .fltog[data-fent="${e}"]:not([data-fsub])[data-fcol="show"]`).click();
  return { offBefore, propagated, dim };
});
// hover explainers replaced the three note lines
const hover = await p2.evaluate(() => ({
  core: !!document.querySelector('.pill[data-grp="coreBy"] button[data-v="layer"][title]'),
  lay: !!document.querySelector('.pill[data-grp="entLayout"] button[data-v="force"][title]'),
  fn: !!document.querySelector('.pill[data-grp="showFns"] button[data-v="on"][title]'),
  hd: !!document.querySelector('#cfg .grplbl[title]'),
  notesGone: !document.body.innerHTML.includes('chain = layered plane') && !document.body.innerHTML.includes('joined from the levels feed by name') }));
await b.close();

console.log('wire styling:', JSON.stringify(wire));
console.log('fleet panel:', JSON.stringify(fleet));
console.log('hide entity:', JSON.stringify(hidden));
console.log('round-trips:', JSON.stringify(reg));
console.log('subs:', JSON.stringify(subsBefore), '→', JSON.stringify(subs));
console.log('card noted:', noted, '+', JSON.stringify(cardNote));
console.log('functions-on case:', JSON.stringify(fnCase));
console.log(`zones(?war=1): base ft=${zoneBase.fleettick} dim@on=${zoneBase.dimmed} · ent mesh ${entMesh0}→${entMesh1} · ctrl ${ctrlMesh0}→${ctrlMesh1}`);
console.log(`round-trips w/ fleets: FLEETTICK ${ft0}→${ft1} · routes ${JSON.stringify(routesBefore)}→${JSON.stringify(routesAfter)} · dimSync=${dimSync}`);
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));
const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(wire.connColor && wire.connStyle)) fails.push('controls do not mutate CONN');
if (!(wire.solidRedWires > 0 && wire.dashedLeft === 0)) fails.push('wire material does not follow CONN');
if (!(wire.sampColor && wire.sampSolid)) fails.push('row sample lies');
if (!wire.legendHasRed) fails.push('legend not derived from CONN');
if (!(wire.sparseIsSparse && wire.sparseSample)) fails.push('sparse sample broken');
if (!wire.resetColor) fails.push('stock reset broken');
if (!(fleet.panel && fleet.rows === fleet.entCount)) fails.push('fleet panel rows != entities');
if (!hidden.gone) fails.push('hidden entity still has scene objects');
if (hidden.hulls !== 0) fails.push('hidden entity keeps its hull');
if (hidden.wires !== hidden.expected) fails.push('connector count != visible-pair expectation');
if (hidden.shuttles !== 0) fails.push('ghost shuttles to a hidden entity');
if (!reg.restored) fails.push('re-show does not restore node objects');
if (!(subs.after.ent === 0 && subs.after.all < subsBefore.all && subs.dimmed)) fails.push('subs toggle / master-dim broken');
if (!(noted && cardNote.noteCleared)) fails.push('card hidden-entity note broken');
if (!(cardNote.nodeKept && cardNote.metaKept)) fails.push('preset drops reserved namespaces');
if (!fnCase.match) fails.push('functions-on: connector count != expectation (the NENT trap)');
if (!(zoneBase.warOn && !zoneBase.dimmed)) fails.push('?war=1 did not arm the zone masters');
if (!(entMesh1 < entMesh0)) fails.push('per-entity zone off did not shrink that entity\'s fleet meshes');
if (ctrlMesh1 !== ctrlMesh0) fails.push('zone toggle bled into the control entity');
if (!(ft0 > 0 && ft1 === ft0)) fails.push('FLEETTICK drifts across round-trips with fleets on');
if (!(routesBefore.ent > 0 && routesAfter.ent === 0 && routesAfter.all === routesBefore.all - routesBefore.ent))
  fails.push('routes column does not scope to the entity');
if (!dimSync) fails.push('masters-dim does not track a live global flip');
console.log('clusters(B3):', JSON.stringify(clus), '· hide →', JSON.stringify(clusHide), `· zone mesh ${sm0}→${sm1} · regroup ${JSON.stringify(regroup)}`);
if (!(clus.rows === clus.expected && clus.cnt === clus.expected && clus.styled))
  fails.push('cluster rows/counter/styling wrong');
if (!(clusHide.subGone && clusHide.restShown && clusHide.subHull === 0 && clusHide.entHull === 1))
  fails.push('cluster hide does not scope (nodes/hull/siblings/entity)');
if (!(sm1 < sm0)) fails.push('per-cluster zone off did not shrink its fleet meshes');
if (!(regroup.cnt2 >= 1 && regroup.kept < regroup.staleKeys))
  fails.push('core change does not regroup / drop stale cluster overrides');
console.log('presets(C):', JSON.stringify(presetC), '· none →', JSON.stringify(noneState), '· all →', JSON.stringify(allState));
if (!(presetC.simDefined && presetC.simAtRest && presetC.stub && /no change in flight/.test(presetC.stubTitle)))
  fails.push('sim feed / in-flight stub wrong');
if (!(noneState.anyShown === false && noneState.movers === 0)) fails.push('None preset leaves scene objects');
if (!(allState.shown > 200 && allState.hulls > 0)) fails.push('All preset does not restore');
console.log('master+dim(B4):', JSON.stringify(masterFix), '· hover:', JSON.stringify(hover));
if (!(masterFix.offBefore && masterFix.propagated)) fails.push('ALL master row does not reach cluster overrides');
if (!masterFix.dim) fails.push('cluster switch does not dim when its entity is off');
if (!(hover.core && hover.lay && hover.fn && hover.hd && hover.notesGone)) fails.push('hover explainers / note removal wrong');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('FLEET PROOF (A + B1 + B2 + C): ALL PASS');
