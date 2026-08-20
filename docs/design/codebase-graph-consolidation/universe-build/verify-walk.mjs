/* Batch-13 proof: journeys LEFT + grouped + NAMED · journey banner · the WALK (journey steps + the
   7-step trail) · fleet global toggles (elements/wires) · panel never resizes the graph · chip-hover
   white halo · gear sync. Run: node verify-walk.mjs */
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

// [1] journeys: left-anchored dropdown, e2e group first, rows carry humanized NAMES
const jrn = await p.evaluate(() => { __uniJrnToggle();
  const el = document.getElementById('jrn'), r = el.getBoundingClientRect();
  const grps = [...el.querySelectorAll('.jrngrp')].map(g => g.textContent);
  const named = [...el.querySelectorAll('.jrnrow .jrnname')].filter(x => !/^C\d+$/.test(x.textContent)).length;
  return { leftAnchored: r.left < window.innerWidth / 3, groups: grps.slice(0, 3),
    e2eFirst: /end-to-end/.test(grps[0] || ''), rows: el.querySelectorAll('.jrnrow').length, named }; });
// pick the first e2e journey → banner + walk bar + steps
await p.evaluate(() => { const rows = document.querySelectorAll('#jrn .jrnrow:not(.jrnnone)'); rows[0].click(); });
await raf(); await p.waitForTimeout(800);
const jsel = await p.evaluate(() => ({
  banner: document.getElementById('hlban').style.display !== 'none',
  bannerName: (document.querySelector('#hlban b') || {}).textContent || '',
  walkMode: WALK.mode, steps: WALK.steps.length, pos: WALK.i,
  wbShown: document.getElementById('walkbar').style.display !== 'none' && document.body.classList.contains('panel-open'),
  panelOpen: document.body.classList.contains('panel-open') }));
// step forward twice: camera aims, the card opens each carrier, the lit path SURVIVES stepping
const camBefore = await p.evaluate(() => Graph.camera().position.toArray());
await p.evaluate(() => { document.querySelector('#walkbar [data-wgo="1"]').click(); });
await p.waitForTimeout(900);
const step1 = await p.evaluate(() => ({ i: WALK.i, pos: document.querySelector('#walkbar .wpos').textContent,
  cardName: document.querySelector('#phead .pname').textContent,
  stillLit: HL.on && !!HL.jr, camMoved: true }));
const camAfter = await p.evaluate(() => Graph.camera().position.toArray());
const camMoved = Math.hypot(camAfter[0] - camBefore[0], camAfter[1] - camBefore[1], camAfter[2] - camBefore[2]) > 10;
// [2] the collapse chevron is in the FOOTER (not phead); collapsing does NOT move the graph canvas
const panel = await p.evaluate(() => {
  const footBtn = !!document.querySelector('.panel .pfoot .pmin');
  const headBtn = !!document.querySelector('#phead .pmin');
  const g = document.getElementById('g'), w0 = g.clientWidth;
  closePanel(); const wClosed = g.clientWidth;
  openPanel(); const wOpen = g.clientWidth;
  return { footBtn, headBtn, stable: w0 === wClosed && wClosed === wOpen };
});
// Esc → banner + walk clear
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
await raf(); await p.waitForTimeout(400);
const escd = await p.evaluate(() => ({ banner: document.getElementById('hlban').style.display === 'none',
  walk: WALK.mode === null, hl: !HL.on }));

// [3] the TRAIL: three different node clicks → 3 chips; clicking chip 1 refocuses
const trail = await p.evaluate(() => {
  const picks = nodes.filter(n => n.kind === 'model').slice(0, 3);
  picks.forEach(n => { SEL = { kind: 'node', data: n }; showPanel(n); __uniHLSelect(n); });
  const chips = document.querySelectorAll('#walkbar .wchip').length;
  document.querySelector('#walkbar .wchip[data-wi="0"]').click();
  return { chips, iAfter: WALK.i, mode: WALK.mode,
    cardIsFirst: document.querySelector('#phead .pname').textContent === picks[0].label };
});
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
await p.waitForTimeout(400);

// [4] fleet global toggles: elements off → clusters-only view (0 node objects, hulls remain);
//     wires off → 0 connector lines
await p.evaluate(() => { document.querySelector('#fleet .flglob[data-fg="showElems"]').click(); });
await raf(); await p.waitForTimeout(700);
const elemsOff = await p.evaluate(() => ({
  shown: nodes.filter(n => n.__threeObj && n.__threeObj.parent).length, hulls: CLUSTERS.length }));
await p.evaluate(() => { document.querySelector('#fleet .flglob[data-fg="showElems"]').click(); });
await raf(); await p.waitForTimeout(700);
await p.evaluate(() => { document.querySelector('#fleet .flglob[data-fg="showWires"]').click(); });
await raf(); await p.waitForTimeout(400);
const wiresOff = await p.evaluate(() => ({ wires: connGroup.children.length, backOn: (document.querySelector('#fleet .flglob[data-fg="showWires"]').click(), true) }));
await p.waitForTimeout(400);
const restored = await p.evaluate(() => ({ shown: nodes.filter(n => n.__threeObj && n.__threeObj.parent).length,
  wires: connGroup.children.length }));

// [5] chip hover → white halo on THAT node; leave clears
const hover = await p.evaluate(() => new Promise(res => {
  const n = nodes.find(x => x.kind === 'endpoint' && links.some(l => lid(l.source) === x.id || lid(l.target) === x.id));
  SEL = { kind: 'node', data: n }; showPanel(n);
  setTimeout(() => {
    const chip = [...document.querySelectorAll('#pbody .pchip')].find(c => c.style.cursor === 'pointer');
    if (!chip) { res({ chip: false }); return; }
    const halos = () => { let c0 = 0; nodes.forEach(x => { if (x.__threeObj) x.__threeObj.children.forEach(c => {
      if (c.userData && c.userData.__hov) c0++; }); }); return c0; };
    chip.dispatchEvent(new Event('mouseenter'));
    const white = halos();
    chip.dispatchEvent(new Event('mouseleave'));
    const after = halos();
    res({ chip: true, whileHover: white, afterLeave: after });
  }, 300); }));

// [6] gear sync: hide → show restores a FULL (un-minimized) panel
const gear = await p.evaluate(() => { const c = document.getElementById('cfg');
  c.classList.add('min'); __uniCfgToggle(); const hidden = c.style.display === 'none';
  __uniCfgToggle(); return { hidden, shownFull: c.style.display !== 'none' && !c.classList.contains('min') }; });
await b.close();

console.log('journeys:', JSON.stringify(jrn));
console.log('selected:', JSON.stringify(jsel), '· step →', JSON.stringify(step1), 'camMoved', camMoved);
console.log('panel:', JSON.stringify(panel), '· esc →', JSON.stringify(escd));
console.log('trail:', JSON.stringify(trail));
console.log('elemsOff:', JSON.stringify(elemsOff), '· wiresOff:', wiresOff.wires, '· restored:', JSON.stringify(restored));
console.log('hover:', JSON.stringify(hover));
console.log('gear:', JSON.stringify(gear));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(jrn.leftAnchored && jrn.e2eFirst && jrn.named > 50)) fails.push('journeys left/grouped/named wrong');
if (!(jsel.banner && jsel.bannerName.length > 3 && jsel.walkMode === 'journey' && jsel.steps > 1 && jsel.panelOpen)) fails.push('journey select banner/walk wrong');
if (!(step1.i === 1 && /2\//.test(step1.pos) && step1.cardName.length > 0 && step1.stillLit && camMoved)) fails.push('journey stepping broken');
if (!(panel.footBtn && !panel.headBtn && panel.stable)) fails.push('panel chevron/geometry wrong');
if (!(escd.banner && escd.walk && escd.hl)) fails.push('Esc does not clear the walk');
if (!(trail.chips === 3 && trail.iAfter === 0 && trail.mode === 'trail' && trail.cardIsFirst)) fails.push('trail chips broken');
if (!(elemsOff.shown === 0 && elemsOff.hulls > 0)) fails.push('elements-off is not the clusters-only view');
if (!(wiresOff.wires === 0 && restored.shown > 200 && restored.wires > 100)) fails.push('wires toggle broken');
if (!(hover.chip && hover.whileHover === 1 && hover.afterLeave === 0)) fails.push('chip hover halo broken');
if (!(gear.hidden && gear.shownFull)) fails.push('gear/config sync broken');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('WALK PROOF: ALL PASS');
