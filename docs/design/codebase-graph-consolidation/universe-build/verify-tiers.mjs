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

// the legend is BINARY + carries component-class rows + a fold-helpers toggle (phase 2)
const leg = await p.evaluate(() => {
  const el = document.getElementById('elegend'); if (!el) return { ok: false };
  // open the Types tab so its rows render
  const tab = el.querySelector('.lgtab[data-t="Types"]'); if (tab) tab.click();
  return { ok: true, fc: el.querySelectorAll('[data-lgfc]').length, fold: el.querySelectorAll('[data-lgfold]').length,
    crit: el.querySelectorAll('.lgcrit').length };
});
ck(leg.ok && leg.fc === 5 && leg.fold === 1, 'the legend Types tab carries 5 component-class rows + a fold-helpers toggle', 'fc=' + leg.fc + ' fold=' + leg.fold);
ck(leg.crit === 0, 'the legend has NO 3-state (lgcrit) rows left — it is binary', 'lgcrit=' + leg.crit);
// clicking a class row hides that class; clicking the fold toggle flips __uniFoldHelpers
const clk = await p.evaluate(() => {
  window.__uniFeClassState = {};
  const row = document.querySelector('[data-lgfc="leaf"]'); if (row) row.click();
  const hid = window.__uniFeClassState.leaf === false;
  const fh0 = window.__uniFoldHelpers; const fb = document.querySelector('[data-lgfold]'); if (fb) fb.click();
  return { hid, foldFlipped: window.__uniFoldHelpers !== fh0 };
});
ck(clk.hid, 'clicking the "leaf" class legend row hides the leaf class (__uniFeClassState)');
ck(clk.foldFlipped, 'clicking the fold-helpers row flips __uniFoldHelpers');

ck(errs.length === 0, 'no page/console errors', errs.slice(0, 3).join(' | '));
console.log(`\n${pass}/${pass + fail} tier checks passed`);
await b.close();
process.exit(fail ? 1 : 0);
