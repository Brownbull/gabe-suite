/* Tier system proof: __uniSetTier(0..3) monotonically reveals nodes; the header selector + keys
   1–4 drive it; feClass gates components.  Run: node verify-tiers.mjs  (SOLO — system chrome) */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.GABE_PW_DIR || path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);
let pass = 0, fail = 0;
const ck = (c, m, x) => { if (c) { pass++; console.log('PASS  ' + m + (x ? '  — ' + x : '')); } else { fail++; console.log('FAIL  ' + m + (x ? '  — ' + x : '')); } };

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);

// the selector exists in the header
const ui = await p.evaluate(() => ({
  sel: !!document.getElementById('tiersel'),
  btns: document.querySelectorAll('#tiersel button').length,
  hasSet: typeof window.__uniSetTier === 'function',
  hasFc: typeof window.__uniFeClassState === 'object',
}));
ck(ui.sel && ui.btns === 4 && ui.hasSet, 'the T0–T3 selector is in the header with 4 buttons + __uniSetTier', 'btns=' + ui.btns);

// visible-node count per tier (must be monotonic non-decreasing T0→T3)
async function tierCount(t) {
  return await p.evaluate((tt) => {
    window.__uniSetTier(tt);
    let vis = 0; try { nodes.forEach(n => { if (visN(n).show) vis++; }); } catch (e) { return -1; }
    // component visibility by class at this tier
    const cls = {}; try { nodes.forEach(n => { if (n.feClass && visN(n).show) cls[n.feClass] = (cls[n.feClass] || 0) + 1; }); } catch (e) {}
    return { vis, cls, tier: window.__uniTier };
  }, t);
}
const c0 = await tierCount(0), c1 = await tierCount(1), c2 = await tierCount(2), c3 = await tierCount(3);
ck(c0.tier === 0 && c3.tier === 3, 'setting a tier records __uniTier', `T0→${c0.tier} T3→${c3.tier}`);
ck(c0.vis > 0 && c0.vis < c1.vis && c1.vis <= c2.vis && c2.vis < c3.vis,
  'nodes reveal monotonically T0 ≤ T1 ≤ T2 ≤ T3', `${c0.vis} < ${c1.vis} ≤ ${c2.vis} < ${c3.vis}`);
ck(!(c0.cls.private > 0) && !(c0.cls.leaf > 0), 'T0 hides private + leaf components', JSON.stringify(c0.cls));
ck((c3.cls.leaf || 0) > 0 && (c3.cls.private || 0) > 0, 'T3 shows every component class', JSON.stringify(c3.cls));

// the active button lights, and key "1" selects T0
await p.evaluate(() => window.__uniSetTier(2));
const litT2 = await p.evaluate(() => document.querySelector('#tiersel button[data-tier="2"]').classList.contains('on'));
ck(litT2, 'the active tier button lights (T2)');
await p.evaluate(() => { document.body.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })); });
await p.waitForTimeout(300);
const afterKey = await p.evaluate(() => window.__uniTier);
ck(afterKey === 0, 'key "1" selects T0 (keyboard shortcut)', 'tier=' + afterKey);

ck(errs.length === 0, 'no page/console errors', errs.slice(0, 3).join(' | '));
console.log(`\n${pass}/${pass + fail} tier checks passed`);
await b.close();
process.exit(fail ? 1 : 0);
