/* Proof: the SELECTED LINE look is SETTLED as the connection default, and the render machinery still animates.
   [0] boot defaults baked (opacity .5 · thick .2 · pulse · speed .3 · glow-on @.05); the config PANEL is gone (#selline null)
   [1] a boot-selected wire ALREADY carries a glow tube (selGlow default true); toggling selGlow off drops it
   [2] pulse breathes the MAIN tube opacity over time (uneven samples differ)
   [3] selAnim=flow spawns __uniSelFlow (3 marching dots) whose position moves over time
   Run: node verify-selanim.mjs */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.GABE_PW_DIR || path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);

// [0] baked defaults + panel gone. select the first DRAWN link WITHOUT touching CFG (defaults must stand).
const sel = await p.evaluate(() => {
  const d = { selOpacity: CFG.selOpacity, selThick: CFG.selThick, selPattern: CFG.selPattern,
    selAnim: CFG.selAnim, selAnimSpeed: CFG.selAnimSpeed, selGlow: CFG.selGlow, selGlowInt: CFG.selGlowInt };
  const panelGone = !document.getElementById('selline') && !document.querySelector('#cfg .slcopy') && !document.querySelector('#cfg .selpill');
  for (let i = 0; i < links.length; i++) { window.__uniSelLink = links[i]; updateConnectors();
    const n = (window.__uniSelMeshes || []).length; if (n > 0) return { picked: true, base: n, idx: i, d, panelGone }; }
  window.__uniSelLink = null; return { picked: false, base: 0, d, panelGone };
});
const defOk = sel.d.selOpacity === 0.5 && sel.d.selThick === 0.2 && sel.d.selPattern === 'solid'
  && sel.d.selAnim === 'pulse' && sel.d.selAnimSpeed === 0.3 && sel.d.selGlow === true && sel.d.selGlowInt === 0.05;

// [1] glow default ON → base already carries a glow mesh; toggling it off drops the count
const glow = await p.evaluate(() => {
  const on = (window.__uniSelMeshes || []).length;
  CFG.selGlow = false; updateConnectors(); const off = (window.__uniSelMeshes || []).length;
  CFG.selGlow = true; updateConnectors(); const back = (window.__uniSelMeshes || []).length;
  return { on, off, back };
});

// [2] pulse breathes the MAIN tube (largest __selBaseOp) — speed up to sample clearly, uneven gaps defeat aliasing
await p.evaluate(() => { CFG.selAnim = 'pulse'; CFG.selAnimSpeed = 3; updateConnectors(); });
const op = [];
for (const w of [200, 900, 400, 700]) { await p.waitForTimeout(w);
  op.push(await p.evaluate(() => { const ms = window.__uniSelMeshes || []; if (!ms.length) return -1;
    let m = ms[0]; for (const x of ms) if ((x.userData.__selBaseOp || 0) > (m.userData.__selBaseOp || 0)) m = x;
    return +m.material.opacity.toFixed(3); })); }
const opSpread = +(Math.max(...op) - Math.min(...op)).toFixed(3);

// [3] flow spawns the marching dots + moves them
await p.evaluate(() => { CFG.selAnim = 'flow'; updateConnectors(); });
await p.waitForTimeout(300);
const f1 = await p.evaluate(() => { const g = window.__uniSelFlow; if (!g || !g.children[0]) return null;
  const q = g.children[0].position; return { visible: g.visible, kids: g.children.length, x: q.x, y: q.y, z: q.z }; });
await p.waitForTimeout(800);
const f2 = await p.evaluate(() => { const q = (window.__uniSelFlow && window.__uniSelFlow.children[0]) ? window.__uniSelFlow.children[0].position : null;
  return q ? { x: q.x, y: q.y, z: q.z } : null; });
const flowMoved = (f1 && f2) ? +Math.hypot(f2.x - f1.x, f2.y - f1.y, f2.z - f1.z).toFixed(3) : -1;

await b.close();

const pass = sel.picked && defOk && sel.panelGone && glow.on >= 2 && glow.off < glow.on && glow.back >= 2
  && opSpread > 0.05 && f1 && f1.visible && f1.kids === 3 && flowMoved > 0.5 && errs.length === 0;
console.log('[0] defaults ' + JSON.stringify(sel.d) + ' ok=' + defOk + '  panelGone=' + sel.panelGone + '  base=' + sel.base);
console.log('[1] glow default-on: base=' + glow.on + ' off=' + glow.off + ' back=' + glow.back);
console.log('[2] pulse main-tube opacity samples=' + JSON.stringify(op) + ' spread=' + opSpread + ' (>0.05)');
console.log('[3] flow: visible=' + (f1 && f1.visible) + ' kids=' + (f1 && f1.kids) + ' moved=' + flowMoved + ' (>0.5)');
console.log('errors=' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 3).join(' | ') : ''));
console.log(pass ? 'SELANIM: PASS' : 'SELANIM: FAIL');
process.exit(pass ? 0 : 1);
