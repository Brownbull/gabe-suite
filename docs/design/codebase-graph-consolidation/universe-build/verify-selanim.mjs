/* Proof: the SELECTED LINE motion + glow options actually animate.
   [1] selGlow=on adds a wider GLOW tube (mesh count grows; a mesh carries selGlowInt as its base opacity)
   [2] selAnim=pulse breathes the tube opacity over time (uneven samples differ)
   [3] selAnim=flow spawns __uniSelFlow (3 marching dots) whose position moves over time
   [4] the copy button emits JSON carrying selAnim / selGlow / selGlowInt
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

// select a real DRAWN link — the module-scope `links` array is what updateConnectors iterates;
// try each until one produces a tube (its endpoints pass the fleet visibility gate)
const sel = await p.evaluate(() => {
  CFG.selAnim = 'none'; CFG.selGlow = false;
  for (let i = 0; i < links.length; i++) { window.__uniSelLink = links[i]; updateConnectors();
    const n = (window.__uniSelMeshes || []).length; if (n > 0) return { picked: true, base: n, idx: i }; }
  window.__uniSelLink = null; return { picked: false, base: 0 };
});

// [1] glow adds a wider tube + a mesh whose base opacity is selGlowInt
const glow = await p.evaluate(() => {
  CFG.selGlow = true; CFG.selGlowInt = 0.4; updateConnectors();
  const ms = window.__uniSelMeshes || [];
  return { count: ms.length, hasGlowMesh: ms.some(m => m.userData && Math.abs((m.userData.__selBaseOp || 0) - 0.4) < 1e-6) };
});

// [2] pulse breathes opacity — sample at UNEVEN gaps to defeat aliasing
await p.evaluate(() => { CFG.selGlow = false; CFG.selAnim = 'pulse'; CFG.selAnimSpeed = 3; updateConnectors(); });
const op = [];
for (const w of [200, 900, 400, 700]) { await p.waitForTimeout(w);
  op.push(await p.evaluate(() => { const m = (window.__uniSelMeshes || [])[0]; return m ? +m.material.opacity.toFixed(3) : -1; })); }
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

// [4] copy JSON carries the new keys
const copy = await p.evaluate(() => {
  const btn = document.querySelector('#selline .slcopy'); if (!btn) return { has: false };
  btn.click(); const t = window.__uniLastCopy || '';
  return { has: /"selAnim"/.test(t) && /"selGlow"/.test(t) && /"selGlowInt"/.test(t), txt: t.replace(/\s+/g, ' ').slice(0, 120) };
});

await b.close();

const pass = sel.picked && glow.count > sel.base && glow.hasGlowMesh && opSpread > 0.05
  && f1 && f1.visible && f1.kids === 3 && flowMoved > 0.5 && copy.has && errs.length === 0;
console.log('picked=' + sel.picked + ' base=' + sel.base);
console.log('[1] glow: count=' + glow.count + ' (>base) hasGlowMesh=' + glow.hasGlowMesh);
console.log('[2] pulse opacity samples=' + JSON.stringify(op) + ' spread=' + opSpread + ' (>0.05)');
console.log('[3] flow: visible=' + (f1 && f1.visible) + ' kids=' + (f1 && f1.kids) + ' moved=' + flowMoved + ' (>0.5)');
console.log('[4] copy has selAnim/selGlow/selGlowInt=' + copy.has + '  ' + (copy.txt || ''));
console.log('errors=' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 3).join(' | ') : ''));
console.log(pass ? 'SELANIM: PASS' : 'SELANIM: FAIL');
process.exit(pass ? 0 : 1);
