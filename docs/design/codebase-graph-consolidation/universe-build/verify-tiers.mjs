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
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
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

// the active button lights, and Alt+1 selects T0 (tiers moved to Alt+Digit1–4; plain 1–8 own the fleet columns)
await p.evaluate(() => window.__uniSetTier(2));
const litT2 = await p.evaluate(() => document.querySelector('#tiersel button[data-tier="2"]').classList.contains('on'));
ck(litT2, 'the active tier button lights (T2)');
await p.evaluate(() => { document.body.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', altKey: true, bubbles: true })); });
await p.waitForTimeout(300);
const afterKey = await p.evaluate(() => window.__uniTier);
ck(afterKey === 0, 'Alt+1 selects T0 (keyboard shortcut)', 'tier=' + afterKey);
// plain "1" must NOT move the tier (it toggles a fleet column) — the collision fix
await p.evaluate(() => window.__uniSetTier(3));
await p.evaluate(() => { document.body.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', altKey: false, bubbles: true })); });
await p.waitForTimeout(300);
const afterPlain = await p.evaluate(() => window.__uniTier);
ck(afterPlain === 3, 'plain "1" does NOT change the tier (fleet-column key, no collision)', 'tier=' + afterPlain);

// the legend is BINARY; Types tab has View as its OWN type row + the classes behind the component ⓘ (operator merge)
const leg = await p.evaluate(() => {
  const el = document.getElementById('elegend'); if (!el) return { ok: false };
  // open the Types tab so its rows render
  const tab = el.querySelector('.lgtab[data-t="Types"]'); if (tab) tab.click();
  return { ok: true, fc: el.querySelectorAll('[data-lgfc]').length,          // only the View type row remains a feclass legend row
    viewRow: !!el.querySelector('[data-lgfc="view"]'),
    compInfo: !!el.querySelector('[data-badgeinfo="feclass"]'),               // the component ⓘ — connector/container/leaf/private moved here
    screenRow: !!el.querySelector('[data-lgk="screen"]'),                     // the phantom screen-kind row must be GONE (0 nodes)
    fold: el.querySelectorAll('[data-lgfold]').length,
    crit: el.querySelectorAll('.lgcrit').length };
});
ck(leg.ok && leg.fc === 1 && leg.viewRow && leg.compInfo && !leg.screenRow && leg.fold === 1,
   'legend Types: View is its own row · classes behind the component ⓘ · no phantom screen row',
   'fc=' + leg.fc + ' view=' + leg.viewRow + ' compInfo=' + leg.compInfo + ' screenRow=' + leg.screenRow + ' fold=' + leg.fold);
ck(leg.crit === 0, 'the legend has NO 3-state (lgcrit) rows left — it is binary', 'lgcrit=' + leg.crit);
// the View row toggles the view class; the component ⓘ popup lists the 3 badged classes + the view/private note; fold flips
const clk = await p.evaluate(() => {
  window.__uniFeClassState = {};
  const vrow = document.querySelector('[data-lgfc="view"]'); if (vrow) vrow.click();
  const hid = window.__uniFeClassState.view === false;
  let popRows = 0, hasNote = false;
  const dot = document.querySelector('[data-badgeinfo="feclass"]');
  if (dot && window.__badgePop) { window.__badgePop(dot, 'feclass');
    const pop = document.getElementById('badgepop');
    if (pop) { popRows = pop.querySelectorAll('.bprow').length; hasNote = !!pop.querySelector('.bpnote'); }
    if (window.__badgePopHide) window.__badgePopHide(); }
  const fh0 = window.__uniFoldHelpers; const fb = document.querySelector('[data-lgfold]'); if (fb) fb.click();
  return { hid, popRows, hasNote, foldFlipped: window.__uniFoldHelpers !== fh0 };
});
ck(clk.hid, 'clicking the View row toggles the view class (__uniFeClassState.view)');
ck(clk.popRows === 4 && clk.hasNote, 'the component ⓘ popup lists connector/container/leaf/private (all badged) + the view note', 'rows=' + clk.popRows + ' note=' + clk.hasNote);
ck(clk.foldFlipped, 'clicking the fold-helpers row flips __uniFoldHelpers');

// the FLEET Entity pane carries the tier + fold + class pills (phase 3)
const fleet = await p.evaluate(() => {
  window.__uniSetTier(3);
  if (window.__uniFlOpen) window.__uniFlOpen('show');
  const tp = document.querySelector('.pill[data-grp="tier"]'), fp = document.querySelector('.pill[data-grp="fold"]'), fc = document.querySelector('.fcpill');
  const out = { tier: tp ? tp.querySelectorAll('button').length : 0, fold: fp ? fp.querySelectorAll('button').length : 0, fc: fc ? fc.querySelectorAll('button').length : 0 };
  if (tp) { const b1 = tp.querySelector('button[data-v="1"]'); if (b1) b1.click(); }
  out.afterClick = window.__uniTier;
  out.tpLit = tp ? tp.querySelector('button[data-v="1"]').classList.contains('on') : false;
  return out;
});
ck(fleet.tier === 4 && fleet.fold === 2 && fleet.fc === 6,
  'the fleet Entity pane carries the tier (4) + fold (2) + class (6) pills', JSON.stringify(fleet));
ck(fleet.afterClick === 1 && fleet.tpLit,
  'clicking the fleet tier pill sets the tier + lights (fleet ↔ header sync)', 'tier=' + fleet.afterClick);

// a tier change PRESERVES an in-flight walk (operator): it must NOT clear the journey/selection, and it
// must skip toggleFns (which reheats the sim → positions jump). WALK.mode + the pins survive; the walk's
// pinned fn-kind is NOT purged (functions stay loaded so the pinned steps can still draw via the pin-exempt).
const walk = await p.evaluate(() => {
  window.__uniSetTier(3);   // load functions first (NO walk) so the purge-vs-keep test below is meaningful
  window.__uniPin = { __ghost: 1 };
  const fnBefore = (typeof NIDS !== 'undefined') ? Object.keys(NIDS).filter(id => (NIDS[id] || {}).kind === 'function').length : 0;
  if (typeof WALK !== 'undefined') { WALK.mode = 'journey'; WALK.steps = ['__ghost']; WALK.i = 0; }
  window.__uniSetTier(0);   // T0 hides functions — but with a walk active it must NOT purge them
  const fnAfter = (typeof NIDS !== 'undefined') ? Object.keys(NIDS).filter(id => (NIDS[id] || {}).kind === 'function').length : 0;
  const out = { mode: (typeof WALK !== 'undefined') ? WALK.mode : 'n/a', pins: Object.keys(window.__uniPin || {}).length, fnBefore, fnAfter };
  if (typeof WALK !== 'undefined') { WALK.mode = null; WALK.steps = []; }   // reset the synthetic walk
  window.__uniPin = {};
  return out;
});
ck(walk.mode === 'journey' && walk.pins >= 1 && walk.fnAfter === walk.fnBefore,
  'a tier press during a walk PRESERVES it (mode + pins kept, functions NOT purged → positions static)', JSON.stringify(walk));

ck(errs.length === 0, 'no page/console errors', errs.slice(0, 3).join(' | '));
console.log(`\n${pass}/${pass + fail} tier checks passed`);
await b.close();
process.exit(fail ? 1 : 0);
