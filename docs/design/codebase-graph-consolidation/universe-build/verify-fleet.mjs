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
await b.close();

console.log('wire styling:', JSON.stringify(wire));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));
const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(wire.connColor && wire.connStyle)) fails.push('controls do not mutate CONN');
if (!(wire.solidRedWires > 0 && wire.dashedLeft === 0)) fails.push('wire material does not follow CONN');
if (!(wire.sampColor && wire.sampSolid)) fails.push('row sample lies');
if (!wire.legendHasRed) fails.push('legend not derived from CONN');
if (!(wire.sparseIsSparse && wire.sparseSample)) fails.push('sparse sample broken');
if (!wire.resetColor) fails.push('stock reset broken');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('FLEET PROOF (slice A): ALL PASS');
