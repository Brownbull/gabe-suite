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
  const rows = document.querySelectorAll('#fleet .flrow:not(.flmaster)').length;
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
await b.close();

console.log('wire styling:', JSON.stringify(wire));
console.log('fleet panel:', JSON.stringify(fleet));
console.log('hide entity:', JSON.stringify(hidden));
console.log('round-trips:', JSON.stringify(reg));
console.log('subs:', JSON.stringify(subsBefore), '→', JSON.stringify(subs));
console.log('card noted:', noted, '+', JSON.stringify(cardNote));
console.log('functions-on case:', JSON.stringify(fnCase));
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
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('FLEET PROOF (A + B1): ALL PASS');
