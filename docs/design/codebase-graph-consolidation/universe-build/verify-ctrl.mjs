/* Batch-18 proof: FOCUS rest behaviors (dim/fade/wires/hide) · the CONTROLS panel · Q/E yaw ·
   invert mouse · middle-button orbit-the-selection. Run: node verify-ctrl.mjs */
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
const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

// [1] FOCUS rest behaviors through the config pill
await p.evaluate(() => { const n = nodes.find(x => x.kind === 'endpoint'); SEL = { kind: 'node', data: n };
  showPanel(n); __uniHLSelect(n); __uniHLMode();   // select → switch to FOCUS
  document.querySelector('.cfgtab[data-pane="routes"]').click(); });
await raf(); await p.waitForTimeout(600);
async function restState(v) {
  await p.evaluate(vv => { document.querySelector(`.pill[data-grp="focusRest"] button[data-v="${vv}"]`).click(); }, v);
  await raf(); await p.waitForTimeout(600);
  return p.evaluate(() => {
    const rest = [...connGroup.children].filter(w => w.material.blending !== THREE.AdditiveBlending).map(w => w.material.opacity);
    const outsideShown = nodes.some(n => HL.set[n.id] === undefined && n.__threeObj && n.__threeObj.parent);
    return { rest: HL.rest, wires: connGroup.children.length, maxRest: +Math.max(...rest, 0).toFixed(2), outsideShown };
  });
}
const dim = await restState('dim'), fade = await restState('fade'), wo = await restState('wires'), hide = await restState('hide');
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); __uniHLMode(); });
await p.waitForTimeout(500);

// [2] controls panel — bottom-right, kbd chips, minimize
const panel = await p.evaluate(() => { const el = document.getElementById('ctrlp'), r = el.getBoundingClientRect();
  const br = r.right <= window.innerWidth && r.bottom >= window.innerHeight - 80;
  const kbd = el.querySelectorAll('.kbd').length;
  document.getElementById('ctrlpmin').click(); const min = el.classList.contains('min');
  document.getElementById('ctrlpmin').click();
  return { br, kbd, min, inv: !!document.getElementById('ctlInv'), pvt: !!document.getElementById('ctlPvt') }; });

// [3] Q/E yaw in place: quaternion turns, camera POSITION fixed
await p.evaluate(() => { window.__q0 = Graph.camera().quaternion.clone(); window.__p0 = Graph.camera().position.clone();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' })); });
await p.waitForTimeout(300);
const yaw = await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q' }));
  return { turned: Graph.camera().quaternion.angleTo(window.__q0) > 0.05,
    inPlace: Graph.camera().position.distanceTo(window.__p0) < 1 }; });

// [4] invert mouse: right button starts OUR drag when inverted; left when not
const inv = await p.evaluate(() => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, out = {};
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));
  out.rightNoDragStock = window.__uniDragging !== true;
  window.dispatchEvent(new PointerEvent('pointerup', { button: 2, bubbles: true }));
  document.getElementById('ctlInv').click();                        // invert ON
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));
  out.rightDragsInverted = window.__uniDragging === true;
  window.dispatchEvent(new PointerEvent('pointerup', { button: 2, bubbles: true }));
  out.mapSwapped = Graph.controls().mouseButtons.LEFT === THREE.MOUSE.PAN;
  document.getElementById('ctlInv').click();                        // back
  out.mapBack = Graph.controls().mouseButtons.LEFT === THREE.MOUSE.ROTATE;
  return out; });

// [5] middle button orbits the SELECTION (P = the selected node), only with a selection
const mid = await p.evaluate(() => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, out = {};
  const n = nodes.find(x => x.kind === 'model'); SEL = { kind: 'node', data: n }; showPanel(n);
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 1, buttons: 4, clientX: cx, clientY: cy, bubbles: true }));
  out.drags = window.__uniDragging === true;
  const q0 = Graph.camera().quaternion.clone();
  const d0 = Graph.camera().position.distanceTo(new THREE.Vector3(n.x, n.y, n.z));
  for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 4, clientX: cx + i * 14, clientY: cy + i * 4, bubbles: true }));
  const d1 = Graph.camera().position.distanceTo(new THREE.Vector3(n.x, n.y, n.z));
  out.orbitsSelection = Math.abs(d1 - d0) < 1 && Graph.camera().quaternion.angleTo(q0) > 0.02;   // distance to the node CONSTANT while turning
  window.dispatchEvent(new PointerEvent('pointerup', { button: 1, bubbles: true }));
  out.ends = window.__uniDragging === false;
  SEL = null; refreshEncSel && refreshEncSel();
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 1, buttons: 4, clientX: cx, clientY: cy, bubbles: true }));
  out.noSelNoDrag = window.__uniDragging !== true;
  window.dispatchEvent(new PointerEvent('pointerup', { button: 1, bubbles: true }));
  return out; });
await b.close();

console.log('focus rest: dim', JSON.stringify(dim), '· fade', JSON.stringify(fade));
console.log('            wires', JSON.stringify(wo), '· hide', JSON.stringify(hide));
console.log('panel:', JSON.stringify(panel), '· yaw:', JSON.stringify(yaw));
console.log('invert:', JSON.stringify(inv));
console.log('middle:', JSON.stringify(mid));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(dim.maxRest > 0.15 && dim.maxRest < 0.35 && dim.outsideShown)) fails.push('dim behavior wrong');
if (!(fade.maxRest > 0.02 && fade.maxRest < 0.12 && fade.outsideShown)) fails.push('fade behavior wrong');
if (!(wo.outsideShown && wo.wires < hide.wires + 200 && wo.maxRest <= 1)) fails.push('wires behavior wrong');
if (!(hide.outsideShown === false)) fails.push('hide behavior wrong');
if (!(panel.br && panel.kbd >= 10 && panel.min && panel.inv && panel.pvt)) fails.push('controls panel wrong');
if (!(yaw.turned && yaw.inPlace)) fails.push('Q/E yaw wrong');
if (!(inv.rightNoDragStock && inv.rightDragsInverted && inv.mapSwapped && inv.mapBack)) fails.push('invert mouse wrong');
if (!(mid.drags && mid.orbitsSelection && mid.ends && mid.noSelNoDrag)) fails.push('middle-orbit-selection wrong');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('CTRL PROOF: ALL PASS');
