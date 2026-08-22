/* Batch-18/20 proof: FOCUS rest behaviors (dim/fade/wires/hide) · the CONTROLS panel · Q/E yaw ·
   invert mouse · middle-button orbit-the-selection · the CAMERA-MODE dropdown
   (tumble / joystick / arcball / look). Run: node verify-ctrl.mjs */
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

// [3] Q/E orbit INWARD around the view centre: quaternion turns AND the camera sweeps; freeze while held
await p.evaluate(() => { window.__q0 = Graph.camera().quaternion.clone(); window.__p0 = Graph.camera().position.clone();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' })); });
await p.waitForTimeout(120);
const frozeMid = await p.evaluate(() => ANIM.all === false);
await p.waitForTimeout(240);
const yaw = await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q' }));
  return { turned: Graph.camera().quaternion.angleTo(window.__q0) > 0.05,
    sweeps: Graph.camera().position.distanceTo(window.__p0) > 15 }; });
await p.waitForTimeout(200);
const thawed = await p.evaluate(() => ANIM.all === true);

// [4] RIGHT button = TUMBLE now: a right-drag turns the rig; invert (flight-style) flips the
//     vertical axis of that tumble — same downward drag, opposite tilt
const inv = await p.evaluate(() => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, out = {};
  SEL = null; if (typeof refreshEncSel === 'function') refreshEncSel();   // no selection → zoom-depth pivot
  const dragDown = () => { g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));
    const y0 = Graph.camera().position.y, drags = window.__uniDragging === true;
    for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 2, clientX: cx, clientY: cy + i * 10, bubbles: true }));
    const dy = Graph.camera().position.y - y0;
    window.dispatchEvent(new PointerEvent('pointerup', { button: 2, bubbles: true })); return { dy, drags }; };
  const stock = dragDown();
  out.rightDrags = stock.drags;                                       // RIGHT owns the tumble drag now
  document.getElementById('ctlInv').click();
  const inverted = dragDown();
  document.getElementById('ctlInv').click();
  out.stockDy = Math.round(stock.dy); out.invDy = Math.round(inverted.dy);
  out.axisFlips = Math.sign(stock.dy) !== 0 && Math.sign(stock.dy) === -Math.sign(inverted.dy);
  return out; });
// [4b] ZOOM-DEPTH pivot (right-button tumble): the same drag sweeps a SMALLER arc when close
const zoomArc = await p.evaluate(() => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const sweep = () => { g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));
    const p0 = Graph.camera().position.clone();
    for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 2, clientX: cx + i * 12, clientY: cy, bubbles: true }));
    const d = Graph.camera().position.distanceTo(p0);
    window.dispatchEvent(new PointerEvent('pointerup', { button: 2, bubbles: true })); return d; };
  const far = sweep();
  const n = nodes.find(x => x.kind === 'endpoint' && x.x != null);
  const dir = new THREE.Vector3(Graph.camera().position.x - n.x, Graph.camera().position.y - n.y, Graph.camera().position.z - n.z).normalize();
  Graph.cameraPosition({ x: n.x + dir.x * 120, y: n.y + dir.y * 120, z: n.z + dir.z * 120 }, { x: n.x, y: n.y, z: n.z }, 0);
  return new Promise(res => setTimeout(() => { const near = sweep();
    res({ far: Math.round(far), near: Math.round(near), scales: near < far * 0.6 }); }, 300)); });

// [5] MIDDLE = PAN (translate, no rotation) · RIGHT + selection = orbit the SELECTED planet
const mid = await p.evaluate(() => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, out = {};
  SEL = null; if (typeof refreshEncSel === 'function') refreshEncSel();
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 1, buttons: 4, clientX: cx, clientY: cy, bubbles: true }));
  out.drags = window.__uniDragging === true;
  const q0 = Graph.camera().quaternion.clone(), p0 = Graph.camera().position.clone(), t0 = Graph.controls().target.clone();
  for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 4, clientX: cx + i * 14, clientY: cy + i * 4, bubbles: true }));
  const pd = Graph.camera().position.distanceTo(p0), td = Graph.controls().target.distanceTo(t0);
  out.pans = pd > 5 && Math.abs(pd - td) < 0.5 && Graph.camera().quaternion.angleTo(q0) < 0.001;   // rig slides as one, no turn
  window.dispatchEvent(new PointerEvent('pointerup', { button: 1, bubbles: true }));
  out.ends = window.__uniDragging === false;
  const n = nodes.find(x => x.kind === 'model'); SEL = { kind: 'node', data: n }; showPanel(n);
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));
  const q1 = Graph.camera().quaternion.clone();
  const d0 = Graph.camera().position.distanceTo(new THREE.Vector3(n.x, n.y, n.z));
  for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 2, clientX: cx + i * 14, clientY: cy + i * 4, bubbles: true }));
  const d1 = Graph.camera().position.distanceTo(new THREE.Vector3(n.x, n.y, n.z));
  out.rightOrbitsSelection = Math.abs(d1 - d0) < 1 && Graph.camera().quaternion.angleTo(q1) > 0.02;
  window.dispatchEvent(new PointerEvent('pointerup', { button: 2, bubbles: true }));
  SEL = null; refreshEncSel && refreshEncSel();
  return out; });
// [6] CAMERA-MODE dropdown: 4 schemes; joystick = hold-offset KEEPS turning (anchor velocity),
//     stops on release; arcball turns; look turns IN PLACE (position fixed); default = tumble
const cmDrop = await p.evaluate(() => {
  const s = document.getElementById('ctlCam');
  return { present: !!s, def: s && s.value,
    opts: s ? [...s.options].map(o => o.value).join(',') : '' }; });
await p.evaluate(() => { const s = document.getElementById('ctlCam');   // [6] runs the LEFT-drag schemes explicitly
  s.value = 'tumble'; s.dispatchEvent(new Event('change')); });
const setMode = v => p.evaluate(vv => { const s = document.getElementById('ctlCam');
  s.value = vv; s.dispatchEvent(new Event('change')); }, v);
const geom = await p.evaluate(() => { const r = document.getElementById('g').getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
// joystick: press at center, ONE move to a held offset, then the mouse goes STILL
await setMode('joystick');
await p.evaluate(c => { const g = document.getElementById('g');
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 0, buttons: 1, clientX: c.cx, clientY: c.cy, bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointermove', { buttons: 1, clientX: c.cx + 90, clientY: c.cy, bubbles: true }));
  window.__jq0 = Graph.camera().quaternion.clone(); }, geom);
await p.waitForTimeout(280);
const jA = await p.evaluate(() => Graph.camera().quaternion.angleTo(window.__jq0));
await p.waitForTimeout(320);
const jB = await p.evaluate(() => Graph.camera().quaternion.angleTo(window.__jq0));
await p.evaluate(() => { window.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true }));
  window.__jq1 = Graph.camera().quaternion.clone(); });
await p.waitForTimeout(280);
const jStop = await p.evaluate(() => Graph.camera().quaternion.angleTo(window.__jq1));
// deadzone: a held offset UNDER 8px must not rotate
await p.evaluate(c => { const g = document.getElementById('g');
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 0, buttons: 1, clientX: c.cx, clientY: c.cy, bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointermove', { buttons: 1, clientX: c.cx + 5, clientY: c.cy + 5, bubbles: true }));
  window.__jq2 = Graph.camera().quaternion.clone(); }, geom);
await p.waitForTimeout(280);
const jDead = await p.evaluate(() => { const a = Graph.camera().quaternion.angleTo(window.__jq2);
  window.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true })); return a; });
// arcball + look: a plain 6-step drag must turn; look must NOT move the camera position
const arcLook = await p.evaluate(async c => {
  const g = document.getElementById('g');
  const drag6 = () => { g.dispatchEvent(new PointerEvent('pointerdown', { button: 0, buttons: 1, clientX: c.cx, clientY: c.cy, bubbles: true }));
    const q0 = Graph.camera().quaternion.clone(), p0 = Graph.camera().position.clone();
    for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 1, clientX: c.cx + i * 14, clientY: c.cy + i * 6, bubbles: true }));
    const out = { turn: Graph.camera().quaternion.angleTo(q0), moved: Graph.camera().position.distanceTo(p0) };
    window.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true })); return out; };
  const set = v => { const s = document.getElementById('ctlCam'); s.value = v; s.dispatchEvent(new Event('change')); };
  set('arcball'); const arc = drag6();
  set('look'); const look = drag6();
  document.getElementById('ctlInv').click(); const lookInv = drag6();   // invert flips look's vertical too
  document.getElementById('ctlInv').click(); set('look');
  return { arcTurn: +arc.turn.toFixed(3), lookTurn: +look.turn.toFixed(3),
    lookStays: look.moved < 1 && lookInv.moved < 1, backTo: UNICTL.camMode }; }, geom);
await b.close();

console.log('focus rest: dim', JSON.stringify(dim), '· fade', JSON.stringify(fade));
console.log('            wires', JSON.stringify(wo), '· hide', JSON.stringify(hide));
console.log('panel:', JSON.stringify(panel), '· yaw:', JSON.stringify(yaw), 'froze', frozeMid, 'thawed', thawed);
console.log('zoomArc:', JSON.stringify(zoomArc));
console.log('invert:', JSON.stringify(inv));
console.log('middle:', JSON.stringify(mid));
console.log('camModes:', JSON.stringify(cmDrop));
console.log('joystick: heldA', +jA.toFixed(3), 'heldB', +jB.toFixed(3), 'afterRelease', +jStop.toFixed(4), 'deadzone', +jDead.toFixed(4));
console.log('arc/look:', JSON.stringify(arcLook));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(dim.maxRest > 0.15 && dim.maxRest < 0.35 && dim.outsideShown)) fails.push('dim behavior wrong');
if (!(fade.maxRest > 0.02 && fade.maxRest < 0.12 && fade.outsideShown)) fails.push('fade behavior wrong');
if (!(wo.outsideShown && wo.wires < hide.wires + 200 && wo.maxRest <= 1)) fails.push('wires behavior wrong');
if (!(hide.outsideShown === false)) fails.push('hide behavior wrong');
if (!(panel.br && panel.kbd >= 10 && panel.min && panel.inv && panel.pvt)) fails.push('controls panel wrong');
if (!(yaw.turned && yaw.sweeps && frozeMid && thawed)) fails.push('Q/E inward orbit / control freeze wrong');
if (!zoomArc.scales) fails.push('drag arc does not follow the zoom depth');
if (!(inv.rightDrags && inv.axisFlips)) fails.push('right-tumble / vertical-axis invert wrong');
if (!(mid.drags && mid.pans && mid.ends && mid.rightOrbitsSelection)) fails.push('middle-pan / right-orbit-selection wrong');
if (!(cmDrop.present && cmDrop.def === 'look' && cmDrop.opts === 'look,tumble,joystick,arcball')) fails.push('camera dropdown wrong (LEFT default must be LOOK)');
if (!(jA > 0.02 && jB > jA * 1.5)) fails.push('joystick does not KEEP turning while held still');
if (!(jStop < 0.01)) fails.push('joystick does not stop on release');
if (!(jDead < 0.005)) fails.push('joystick deadzone leaks rotation');
if (!(arcLook.arcTurn > 0.02)) fails.push('arcball drag does not turn');
if (!(arcLook.lookTurn > 0.02 && arcLook.lookStays)) fails.push('look mode must turn IN PLACE');
if (!(arcLook.backTo === 'look')) fails.push('mode did not reset to the look default');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('CTRL PROOF: ALL PASS');
