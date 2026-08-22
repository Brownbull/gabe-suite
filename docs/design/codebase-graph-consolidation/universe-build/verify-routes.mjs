/* Batch-10 proof against the committed example page:
   [1] layout/core changes FREEZE animations, settle RESUMES (user pause respected)
   [2] LINES pill renders icons; curve-amount slider bends the real connector geometry
   [3] per-kind BEAM: 0 hides that kind's wires, >1 switches them to additive glow
   [4] ROUTES tab exists and homes the lines + beam + transports/speed controls
   Run: node verify-routes.mjs */
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
await p.waitForTimeout(4500);

// [4] the CONNECTIONS + TRANSPORTS panes in the fleet drawer (batch 31: the Routes tab dissolved)
const tab = await p.evaluate(() => {
  if (!window.__uniFlOpen) return { routesTab: false };
  __uniFlOpen('wires');
  const pane = document.getElementById('flsbody');
  const q = s => !!pane.querySelector(s);
  const out = { routesTab: true, paneShown: document.getElementById('flside').classList.contains('out'),
    lines: q('.pill[data-grp="lineStyle"]'), lineIcons: q('.pill[data-grp="lineStyle"] button svg'),
    curveAmt: q('#curveAmtRng'), beams: pane.querySelectorAll('input[data-beam]').length,
    noTransportsHere: !q('#trSpeedRng') };
  __uniFlOpen('routes');
  out.transports = q('[data-itog="transports"]'); out.speed = q('#trSpeedRng');
  __uniFlOpen(null);
  return out; });

// [1] freeze on core change → resume on settle; a USER pause stays paused
const freeze = await p.evaluate(() => { CFG.coreBy = 'tests'; applyCfg('coreBy');
  return { frozeNow: ANIM.all === false, btn: (document.getElementById('motionBtn') || {}).textContent }; });
await p.waitForFunction('ANIM.all===true', { timeout: 15000 }).catch(() => {});
const resumed = await p.evaluate(() => ANIM.all === true);
const userPause = await p.evaluate(() => { ANIM.all = false;             // user pauses by hand
  CFG.entLayout = 'spread'; applyCfg('entLayout'); return ANIM.all; });   // change must NOT arm a resume
await p.waitForTimeout(6000);
const stillPaused = await p.evaluate(() => ANIM.all === false);
await p.evaluate(() => { ANIM.all = true; CFG.entLayout = 'force'; applyCfg('entLayout'); });
await p.waitForFunction('ANIM.all===true', { timeout: 15000 }).catch(() => {});

// [2] curve amount bends the real geometry: max chord deviation grows with the slider
const curve = await p.evaluate(() => {
  function maxDev() { const ch = connGroup.children[0]; if (!ch) return -1;
    const pos = ch.geometry.attributes.position, n = pos.count;
    const A = new THREE.Vector3(pos.getX(0), pos.getY(0), pos.getZ(0));
    const B = new THREE.Vector3(pos.getX(n - 1), pos.getY(n - 1), pos.getZ(n - 1));
    const AB = B.clone().sub(A), L = AB.length() || 1; let d = 0;
    for (let i = 1; i < n - 1; i++) { const P = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      d = Math.max(d, P.clone().sub(A).cross(AB).length() / L); } return d; }
  const straightPts = connGroup.children[0] ? connGroup.children[0].geometry.attributes.position.count : -1;
  CFG.lineStyle = 'curved'; __uniSetCurve(true);
  const curvedPts = connGroup.children[0] ? connGroup.children[0].geometry.attributes.position.count : -1;
  window.__uniCurveAmt = 0.2; updateConnectors(); const devLo = maxDev();
  window.__uniCurveAmt = 2.5; updateConnectors(); const devHi = maxDev();
  window.__uniCurveAmt = 1; CFG.lineStyle = 'straight'; __uniSetCurve(false);
  return { straightPts, curvedPts, devLo: +devLo.toFixed(1), devHi: +devHi.toFixed(1) };
});

// [5] review-r2 interleaves: motionBtn pause DURING the settle window must survive the engine stop;
//     a drag held across the settle keeps decorations frozen until pointerup
const interleave = await p.evaluate(() => { CFG.coreBy = 'kind'; applyCfg('coreBy');   // freeze + reheat
  const mb = document.getElementById('motionBtn'); mb.click(); mb.click();             // resume, then EXPLICIT pause
  return { pausedDuring: ANIM.all === false }; });
await p.waitForTimeout(6500);                                                          // settle lands
const pauseSurvived = await p.evaluate(() => ANIM.all === false);
await p.evaluate(() => { document.getElementById('motionBtn').click(); });             // back to playing
const dragCase = await p.evaluate(() => new Promise(res => {
  CFG.coreBy = 'layer'; applyCfg('coreBy');                                            // freeze + reheat
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.5;
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: cx, clientY: cy, bubbles: true }));
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (ANIM.all === true && window.__uniDragging) { clearInterval(iv); res({ resumedMidDrag: true }); return; }
    if (Date.now() - t0 > 8000) { clearInterval(iv);                                   // settle landed, drag still held, still frozen
      const frozenHeld = ANIM.all === false && window.__uniDragging === true;
      window.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true }));
      res({ resumedMidDrag: false, frozenHeld, resumedOnRelease: ANIM.all === true }); }
  }, 200); }));

// [3] beam: fk→0 removes fk wires; fk→2 glows them (AdditiveBlending)
const beam = await p.evaluate(() => {
  const count = kind => { let c = 0; connGroup.children.forEach(w => { if (w.material.color.getHex() === CONN[kind].color) c++; }); return c; };
  const base = count('fk');
  window.__uniBeam.fk = 0; updateConnectors(); const hidden = count('fk');
  window.__uniBeam.fk = 2; updateConnectors();
  let glow = 0; connGroup.children.forEach(w => { if (w.material.color.getHex() === CONN.fk.color && w.material.blending === THREE.AdditiveBlending) glow++; });
  window.__uniBeam.fk = 1; updateConnectors();
  return { base, hidden, glow };
});

// [6] URL-preset boot (any ?param) must still carry the tabbed config incl. Routes (review r2)
const p2 = await b.newPage({ viewport: { width: 1400, height: 860 } });
p2.on('pageerror', e => errs.push('PE2:' + e.message));
p2.on('console', m => { if (m.type() === 'error') errs.push('CE2:' + m.text()); });
await p2.goto('file://' + PAGE + '?war=1&radius=1.2');
await p2.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p2.waitForTimeout(2500);
const preset = await p2.evaluate(() => ({
  tabs: !document.querySelector('.cfgtab'), routes: !!(window.__uniFlPanes && __uniFlPanes.wires),
  beams: document.querySelectorAll('input[data-beam]').length, motionBtn: !!document.getElementById('motionBtn') }));
await b.close();

console.log('routes tab:', JSON.stringify(tab));
console.log(`freeze: froze=${freeze.frozeNow} btn=${freeze.btn} resumed=${resumed} · user-pause stays=${stillPaused}`);
console.log(`interleave: paused-during=${interleave.pausedDuring} survived-settle=${pauseSurvived} · drag: ${JSON.stringify(dragCase)}`);
console.log(`curve: straight ${curve.straightPts}pts → curved ${curve.curvedPts}pts · dev @0.2=${curve.devLo} @2.5=${curve.devHi}`);
console.log(`beam(fk): base ${beam.base} → @0 ${beam.hidden} wires · @2 glowing ${beam.glow}`);
console.log('url-preset:', JSON.stringify(preset));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(tab.routesTab && tab.paneShown && tab.lines && tab.lineIcons && tab.curveAmt && tab.beams === 4 && tab.transports && tab.speed && tab.noTransportsHere)) fails.push('connections/transports panes incomplete');
if (!(freeze.frozeNow && resumed)) fails.push('freeze/resume broken');
if (!stillPaused) fails.push('user pause overridden by settle');
if (!(interleave.pausedDuring && pauseSurvived)) fails.push('motionBtn pause during settle got stomped');
if (!(dragCase.frozenHeld && dragCase.resumedOnRelease) || dragCase.resumedMidDrag) fails.push('settle resumed mid-drag');
if (!(curve.straightPts === 2 && curve.curvedPts > 2 && curve.devHi > curve.devLo * 3)) fails.push('curve amount does not bend geometry');
if (!(beam.base > 0 && beam.hidden === 0 && beam.glow > 0)) fails.push('beam hide/glow broken');
if (!(preset.tabs && preset.routes && preset.beams === 4 && preset.motionBtn)) fails.push('URL-preset boot drops the tabbed config');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('ROUTES/FREEZE/BEAM PROOF: ALL PASS');
