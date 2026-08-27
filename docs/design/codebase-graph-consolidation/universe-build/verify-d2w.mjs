/* D2W proof against the committed example page — the calls-wire heat spectrum (Proposal A):
   [1] with Functions ON + __uniD2W ON, calls wires carry BANDPAL colours (a real spectrum: the
       write band AND the never-write band both appear on the drawn graph)
   [2] the legend d2w toggle (__uniD2W=false) reverts calls wires to the flat CONN.calls colour
   [3] the legend renders 5 band swatches + the on/off toggle; the config panel renders the
       calibrate rows (5 colour inputs) + copy
   Run: node verify-d2w.mjs   (SOLO — headless swiftshader; system chrome) */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
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

// ensure Functions are drawn (fn nodes + fn→fn calls wires), then rebuild the wires
await p.evaluate(() => {
  if (window.__uniSetKindState) __uniSetKindState('function', 'all');
  if (window.toggleFns) try { toggleFns(true); } catch (e) {}
});
await p.waitForTimeout(3500);

const sample = await p.evaluate(() => {
  window.__uniD2W = true;
  try { updateConnectors(); } catch (e) {}
  const BAND = window.BANDPAL.map(c => c >>> 0);
  const tally = {}; let calls = 0;
  connGroup.children.forEach(w => {
    if (w.userData.kind !== 'calls' || !w.material || !w.material.color) return;
    calls++; const h = w.material.color.getHex() >>> 0;
    const bi = BAND.indexOf(h); if (bi >= 0) tally[bi] = (tally[bi] || 0) + 1;
  });
  // clamp correctness (review finding 1): reaching fns (any finite hop) clamp into bands 0..3;
  // only a never-reaches target (undefined) lands in band 4 (green). A deep writer must NOT read green.
  const clampOK = window.__d2wBand({ d2w: 0 }) === BAND[0]
    && window.__d2wBand({ d2w: 3 }) === BAND[3]
    && window.__d2wBand({ d2w: 5 }) === BAND[3]
    && window.__d2wBand({ d2w: 99 }) === BAND[3]
    && window.__d2wBand({}) === BAND[4];
  return { calls, tally, band0: BAND[0], band4: BAND[4], clampOK };
});

const flat = await p.evaluate(() => {
  window.__uniD2W = false;
  try { updateConnectors(); } catch (e) {}
  const flatHex = (typeof CONN !== 'undefined' && CONN.calls) ? (CONN.calls.color >>> 0) : -1;
  let flatCount = 0, calls = 0;
  connGroup.children.forEach(w => {
    if (w.userData.kind !== 'calls' || !w.material || !w.material.color) return;
    calls++; if ((w.material.color.getHex() >>> 0) === flatHex) flatCount++;
  });
  window.__uniD2W = true; try { updateConnectors(); } catch (e) {}
  return { calls, flatCount, flatHex };
});

const legend = await p.evaluate(() => {
  const el = document.getElementById('elegend'); if (!el) return { swatches: 0, toggle: false, cfg: false };
  // activate the Connectors tab (the band rows + toggle live there)
  const tab = el.querySelector('.lgtab[data-t="Connectors"]'); if (tab) tab.click();
  const html = el.innerHTML;
  const toggle = html.indexOf('data-d2wtog') >= 0;
  const swatches = (html.match(/lgln/g) || []).length;
  // declutter: connector rows carry the description in a .tipico .tip (hover popup), not inline text
  const tipRows = el.querySelectorAll('.lgrow .tipico .tip');
  let tipHasText = false; el.querySelectorAll('.lgconn .tipico .tip, .lgrow .tipico .tip').forEach(t => { if ((t.textContent || '').length > 8) tipHasText = true; });
  const declutter = tipRows.length >= 5 && tipHasText;
  // the distance-heat spectrum now lives INSIDE the calls row's info popup (≥5 colour swatches)
  const callsTip = el.querySelector('.lgconn[data-lgconn="calls"] .tipico .tip');
  const callsSpectrum = !!callsTip && callsTip.querySelectorAll('span[style*="background"]').length >= 5;
  const noBandRows = el.innerHTML.indexOf('into a write') < 0 || callsSpectrum; // bands are in the popup, not standalone rows
  /* operator (2026-08-27): the legend tip is a THEMED body-level popup, never clipped by the legend box */
  let pop = null; const lgtip = el.querySelector('.lgconn[data-lgconn="calls"] .lgtip');
  if (lgtip) { lgtip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); const p = document.getElementById('badgepop');
    if (p) { const pr = p.getBoundingClientRect(), cs = getComputedStyle(p);
      pop = { cls: p.className, top: pr.top, bg: cs.backgroundColor, inView: pr.top >= 0 && pr.bottom <= window.innerHeight && pr.left >= 0,
        hasHead: !!p.querySelector('.bph'), hasSpectrum: p.querySelectorAll('.bpbody span[style*="background"]').length >= 5 };
      lgtip.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })); pop.gone = !document.getElementById('badgepop'); } }
  // config panel (open the wires drawer)
  let cfg = false, inputs = 0, resetRefreshed = false;
  try {
    if (window.__uniFlOpen) { __uniFlOpen('wires'); const pane = document.getElementById('flsbody');
      cfg = pane.innerHTML.indexOf('CALLS · DISTANCE HEAT') >= 0;
      const bandInputs = pane.querySelectorAll('input[data-band]'); inputs = bandInputs.length;
      // reset fix (review finding 2): mutate a band, click reset, the on-screen input must refresh
      if (bandInputs.length) { const inp0 = bandInputs[0]; const stock = inp0.value;
        inp0.value = '#123456'; inp0.dispatchEvent(new Event('input', { bubbles: true }));
        const rbtn = pane.querySelector('[data-bandreset]'); if (rbtn) rbtn.click();
        resetRefreshed = (inp0.value.toLowerCase() === stock.toLowerCase()); }
      __uniFlOpen(null); }
  } catch (e) {}
  return { pop,  toggle, cfg, inputs, swatches, resetRefreshed, declutter, tipRows: tipRows.length, callsSpectrum };
});

const bandsSeen = Object.keys(sample.tally).length;
const R = [];
const ok = (name, cond, extra) => R.push((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  — ' + extra : ''));
ok('calls wires carry band colours', sample.calls > 0 && bandsSeen >= 2,
   `${sample.calls} calls wires · bands seen ${JSON.stringify(sample.tally)}`);
ok('band clamp: reaching fns map to 0..3, only never-reaches → band 4 (green)', sample.clampOK === true);
ok('the closest band (0, warm) paints calls that reach a write', (sample.tally[0] || 0) > 0,
   `band0=${sample.tally[0] || 0} (#${(sample.band0).toString(16)})`);
ok('the NO-WRITE band (4/green) paints some calls wires', (sample.tally[4] || 0) > 0,
   `band4=${sample.tally[4] || 0} (#${(sample.band4).toString(16)})`);
ok('toggle __uniD2W=false reverts calls wires to the flat colour', flat.flatCount > 0,
   `${flat.flatCount}/${flat.calls} flat (#${(flat.flatHex >>> 0).toString(16)})`);
ok('legend carries the d2w on/off toggle + connector swatches', legend.toggle && legend.swatches >= 5,
   `toggle=${legend.toggle} swatches=${legend.swatches}`);
ok('the distance-heat spectrum folds into the calls info-popup (≥5 swatches)', legend.callsSpectrum === true);
ok('config panel carries the band calibrate rows (5 colour inputs)', legend.cfg && legend.inputs === 5,
   `cfg=${legend.cfg} inputs=${legend.inputs}`);
ok('band reset refreshes the live colour pickers (not the detached rt)', legend.resetRefreshed === true);
ok('legend tip = THEMED body-level popup, in view, spectrum inside, gone on mouseout',
   !!(legend.pop && legend.pop.cls.indexOf('lgpop') >= 0 && legend.pop.inView && legend.pop.hasHead && legend.pop.hasSpectrum && legend.pop.gone && legend.pop.bg !== 'rgba(0, 0, 0, 0)'),
   legend.pop ? ('top=' + Math.round(legend.pop.top) + ' bg=' + legend.pop.bg) : 'no popup');
ok('connector legend descriptions moved into info-ⓘ hover popups (declutter)', legend.declutter === true,
   `tipRows=${legend.tipRows}`);
ok('no page/console errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(R.join('\n'));
const failed = R.filter(x => x.startsWith('FAIL')).length;
console.log(`\n${R.length - failed}/${R.length} d2w checks passed`);
await b.close();
process.exit(failed ? 1 : 0);
