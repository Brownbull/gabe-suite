/* Batch-12 proof: layer ruling (c) · depth highlight (glow/focus, Alt+scroll, Esc) · journeys picker ·
   topbar rework (icons, pills far right) · chord pan (left+right). Run: node verify-explore.mjs */
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
const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

// [1] layer ruling (c): un-collapsed groups — endpoints + web appear, "frontend" is gone
const layer = await p.evaluate(() => {
  const subs = {}; nodes.forEach(n => { subs[n.sub] = 1; });
  const epSep = nodes.filter(n => n.kind === 'endpoint').every(n => n.sub === 'endpoints');
  const webOwn = nodes.filter(n => n.kind === 'web').every(n => n.sub === 'web');
  return { groups: Object.keys(subs).sort(), epSep, webOwn, noFrontend: !subs.frontend };
});

// [2] topbar: icons only, repo pills FAR right, controls present
const topbar = await p.evaluate(() => {
  const tb = document.querySelector('.topbar'), kids = [...tb.children];
  return { pillsLast: kids[kids.length - 1].className === 'statuspills',
    depth: !!document.getElementById('depthBtn'), mode: !!document.getElementById('hlModeBtn'),
    jrn: !!document.getElementById('jrnBtn'),
    freezeIconOnly: !/Freeze/.test(document.getElementById('freezeDragBtn').textContent),
    resetIconOnly: !/Reset/.test(document.getElementById('reset').textContent) };
});

// [3] depth highlight — GLOW: select, sprites on the reached set, lit wires additive, others dimmed
await p.evaluate(() => { const n = nodes.find(x => x.kind === 'endpoint'); window.__testN = n; __uniHLSelect(n); });
await raf(); await p.waitForTimeout(700);
const glow = await p.evaluate(() => {
  const inSet = Object.keys(HL.set).length;
  let lit = 0, dim = 0; connGroup.children.forEach(w => { if (w.material.blending === THREE.AdditiveBlending) lit++;
    else if (w.material.opacity < 0.3) dim++; });
  return { on: HL.on, depth: HL.depth, inSet, sprites: HL.sprites.length, lit, dim, total: connGroup.children.length };
});
// Alt+scroll changes depth (recompute follows); click cycles
await p.evaluate(() => { window.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, altKey: true })); });
await raf(); await p.waitForTimeout(400);
const wheel = await p.evaluate(() => ({ d: HL.depth, badge: document.getElementById('depthNum').textContent,
  grew: Object.keys(HL.set).length }));
// [4] FOCUS: everything outside the set hidden; wires collapse to the set's links
await p.evaluate(() => { __uniHLMode(); });
await raf(); await p.waitForTimeout(700);
const focus = await p.evaluate(() => {
  const inSet = Object.keys(HL.set).length;
  const shown = nodes.filter(n => n.__threeObj && n.__threeObj.parent).length;
  return { mode: HL.mode, inSet, shown, wires: connGroup.children.length, setLinks: HL.links.size };
});
// Esc clears everything
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
await raf(); await p.waitForTimeout(700);
const cleared = await p.evaluate(() => ({ on: HL.on, shown: nodes.filter(n => n.__threeObj && n.__threeObj.parent).length,
  sprites: HL.sprites.length, mode: HL.mode }));
await p.evaluate(() => { __uniHLMode(); });   // back to glow default for journeys

// [5] journeys: picker lists them all; picking one highlights its carriers
const jrnList = await p.evaluate(() => { __uniJrnToggle();
  return { rows: document.querySelectorAll('#jrn .jrnrow').length, open: document.getElementById('jrn').style.display !== 'none' }; });
await p.evaluate(() => { document.querySelectorAll('#jrn .jrnrow')[1].click(); });
await raf(); await p.waitForTimeout(700);
const jrnSel = await p.evaluate(() => ({ on: HL.on, jr: HL.jr, carriers: HL.origin.length,
  inSet: Object.keys(HL.set).length, btnOn: document.getElementById('jrnBtn').classList.contains('on') }));
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
await p.waitForTimeout(500);

// [6] chord pan: left-drag rotates (quaternion turns); left+right pans (quaternion frozen, rig translates)
const chord = await p.evaluate(() => new Promise(res => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const cam = Graph.camera(), q0 = cam.quaternion.clone(), p0 = cam.position.clone(), t0 = Graph.controls().target.clone();
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 0, buttons: 1, clientX: cx, clientY: cy, bubbles: true }));
  for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 3, clientX: cx + i * 12, clientY: cy + i * 5, bubbles: true }));
  const qPan = cam.quaternion.clone(), pPan = cam.position.clone(), tPan = Graph.controls().target.clone();
  for (let i = 1; i <= 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 1, clientX: cx + 72 + i * 12, clientY: cy + 30 + i * 5, bubbles: true }));
  const qRot = cam.quaternion.clone();
  window.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true }));
  res({ panKeptAngle: q0.angleTo(qPan) < 1e-6, panMoved: p0.distanceTo(pPan) > 5,
    panTargetMoved: t0.distanceTo(tPan) > 5, rotTurned: qPan.angleTo(qRot) > 0.01 });
}));
await b.close();

console.log('layer(c):', JSON.stringify(layer));
console.log('topbar:', JSON.stringify(topbar));
console.log('glow:', JSON.stringify(glow), '· wheel →', JSON.stringify(wheel));
console.log('focus:', JSON.stringify(focus), '· esc →', JSON.stringify(cleared));
console.log('journeys:', JSON.stringify(jrnList), '→', JSON.stringify(jrnSel));
console.log('chord:', JSON.stringify(chord));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(layer.epSep && layer.webOwn && layer.noFrontend)) fails.push('layer ruling (c) not applied');
if (!(topbar.pillsLast && topbar.depth && topbar.mode && topbar.jrn && topbar.freezeIconOnly && topbar.resetIconOnly)) fails.push('topbar rework wrong');
if (!(glow.on && glow.inSet > 1 && glow.sprites > 0 && glow.lit > 0 && glow.dim > 0)) fails.push('glow highlight broken');
if (!(wheel.d === 4 && wheel.badge === '4' && wheel.grew >= glow.inSet)) fails.push('Alt+scroll depth broken');
if (!(focus.mode === 'focus' && focus.shown === focus.inSet && focus.wires === focus.setLinks)) fails.push('focus mode broken');
if (!(cleared.on === false && cleared.shown > 200 && cleared.sprites === 0)) fails.push('Esc does not clear');
if (!(jrnList.rows === 136 && jrnSel.on && jrnSel.jr && jrnSel.carriers > 0 && jrnSel.inSet >= jrnSel.carriers && jrnSel.btnOn)) fails.push('journeys picker broken');
if (!(chord.panKeptAngle && chord.panMoved && chord.panTargetMoved && chord.rotTurned)) fails.push('chord pan broken');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('EXPLORE PROOF: ALL PASS');
