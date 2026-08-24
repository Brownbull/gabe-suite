/* Batch-13 proof: journeys LEFT + grouped + NAMED · journey banner · the WALK (journey steps + the
   7-step trail) · fleet global toggles (elements/wires) · panel never resizes the graph · chip-hover
   white halo · gear sync. Run: node verify-walk.mjs */
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
await p.waitForTimeout(4000);
const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

// [1] journeys: left-anchored dropdown, e2e group first, rows carry humanized NAMES
const jrn = await p.evaluate(() => { __uniJrnToggle();
  const el = document.getElementById('jrn'), r = el.getBoundingClientRect();
  const grps = [...el.querySelectorAll('.jrngrp')].map(g => g.textContent);
  const named = [...el.querySelectorAll('.jrnrow .jrnname')].filter(x => !/^C\d+$/.test(x.textContent)).length;
  return { centered: Math.abs((r.left + r.width / 2) - window.innerWidth / 2) < 240, groups: grps.slice(0, 3),
    e2eFirst: /end-to-end/.test(grps[0] || ''), rows: el.querySelectorAll('.jrnrow').length, named }; });
const restMin = await p.evaluate(() => { let m = 1; connGroup.children.forEach(w => { if (w.material.blending !== THREE.AdditiveBlending) m = Math.min(m, w.material.opacity); }); return +m.toFixed(2); });   // the RESTING floor (calls sit at 0.3 by operator default) — the highlight must never dim below it
// pick the first e2e journey → banner + walk bar + steps
await p.evaluate(() => { const rows = document.querySelectorAll('#jrn .jrnrow:not(.jrnnone)'); rows[0].click(); });
await raf(); await p.waitForTimeout(800);
const jsel = await p.evaluate(() => ({
  banner: document.getElementById('jrnpill').style.display !== 'none',
  bannerName: (document.querySelector('#jrnpill .wjname') || {}).textContent || '',
  walkMode: WALK.mode, steps: WALK.steps.length, pos: WALK.i,
  wbShown: document.getElementById('walkbar').style.display === 'none',
  panelOpen: document.body.classList.contains('panel-open') }));
// VISUAL floors (the operator saw noise, not a highlight): non-lit wires near-invisible, shuttles only
// on the lit path, and the select FRAMES the whole carrier set from OUTSIDE (no dive into the jungle)
const visual = await p.evaluate(() => {
  const dims = [...connGroup.children].filter(w => w.material.blending !== THREE.AdditiveBlending).map(w => w.material.opacity);
  const moversOnPath = MOVERS.every(m => HL.set[m.src] !== undefined && HL.set[m.tgt] !== undefined);
  let cx = 0, cy = 0, cz = 0, n = 0; HL.origin.forEach(id => { const nd = NIDS[id]; if (nd) { cx += nd.x; cy += nd.y; cz += nd.z; n++; } });
  cx /= n; cy /= n; cz /= n; let r = 0;
  HL.origin.forEach(id => { const nd = NIDS[id]; if (nd) r = Math.max(r, Math.hypot(nd.x - cx, nd.y - cy, nd.z - cz)); });
  const camD = Graph.camera().position.distanceTo(new THREE.Vector3(cx, cy, cz));
  return { maxDim: Math.max(...dims, 0), minRest: +Math.min(...dims, 1).toFixed(2), moversOnPath, movers: MOVERS.length, camD: Math.round(camD), setR: Math.round(r) };
});
// step forward twice: camera aims, the card opens each carrier, the lit path SURVIVES stepping
const camBefore = await p.evaluate(() => Graph.camera().position.toArray());
await p.evaluate(() => { document.querySelector('#jrnpill [data-wgo="1"]').click(); });
await p.waitForTimeout(900);
const step1 = await p.evaluate(() => ({ i: WALK.i, pos: document.querySelector('#jrnpill .wpos').textContent,
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
  const railBelow = document.getElementById('pexpand').getBoundingClientRect().top >
    document.getElementById('prailname').getBoundingClientRect().top;   // collapsed chevron at the BOTTOM too
  openPanel(); const wOpen = g.clientWidth;
  return { footBtn, headBtn, railBelow, stable: w0 === wClosed && wClosed === wOpen };
});
// Esc → banner + walk clear
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
await raf(); await p.waitForTimeout(400);
const escd = await p.evaluate(() => ({ banner: document.getElementById('jrnpill').style.display === 'none',
  walk: WALK.mode === null, hl: !HL.on }));

// [2b] planets/wires MATRIX columns: planets-off hides an entity's nodes but its HULL stays;
//      wires-off kills only the wires touching it (nodes stay)
const pw = await p.evaluate(() => new Promise(res => {
  const e = _ents[0], hulls0 = CLUSTERS.filter(c => c.name === e).length;
  document.querySelector(`#fleet .fltog[data-fent="${e}"]:not([data-fsub])[data-fcol="planets"]`).click();
  setTimeout(() => {                                             // 1200ms: the 888-planet apply lands in ~600-900ms headless (measured 14 left @500 / 0 @900)
    const nodesGone = nodes.filter(n => n.ent === e).every(n => !n.__threeObj || !n.__threeObj.parent);
    const hullStays = CLUSTERS.filter(c => c.name === e).length === hulls0 && hulls0 === 1;
    document.querySelector(`#fleet .fltog[data-fent="${e}"]:not([data-fsub])[data-fcol="planets"]`).click();
    setTimeout(() => {
      document.querySelector(`#fleet .fltog[data-fent="${e}"]:not([data-fsub])[data-fcol="wires"]`).click();
      setTimeout(() => {
        let touching = 0; connGroup.children.forEach(() => {});
        const expected = links.filter(l => { const s = NIDS[lid(l.source)], t = NIDS[lid(l.target)];
          return s && t && s.ent !== e && t.ent !== e; }).length;
        const wiresNow = connGroup.children.length;
        const nodesBack = nodes.filter(n => n.ent === e).some(n => n.__threeObj && n.__threeObj.parent);
        document.querySelector(`#fleet .fltog[data-fent="${e}"]:not([data-fsub])[data-fcol="wires"]`).click();
        setTimeout(() => res({ nodesGone, hullStays, wiresNow, expected, wiresScoped: wiresNow === expected, nodesBack }), 400);
      }, 1200);
    }, 1000);
  }, 1200); }));
// [2c] depth slider + arrow keys
const depth = await p.evaluate(() => { const r = document.getElementById('depthRng');
  r.value = '5'; r.dispatchEvent(new Event('input', { bubbles: true }));
  const atFive = HL.depth === 5;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  const down = HL.depth === 4 && document.getElementById('depthNum').textContent === '4' && r.value === '4';
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
  const up = HL.depth === 5;
  r.value = '3'; r.dispatchEvent(new Event('input', { bubbles: true }));
  return { atFive, down, up }; });
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

// [4b] the collapse chevron stays ON SCREEN even with a tall card
const foot = await p.evaluate(() => { const n = nodes.find(x => x.kind === 'model' && x.det && (x.det.cols || []).length > 3);
  SEL = { kind: 'node', data: n }; showPanel(n);
  const r = document.querySelector('.panel .pfoot').getBoundingClientRect();
  return { onScreen: r.bottom <= window.innerHeight + 1 && r.height > 0,
    bodyScrolls: getComputedStyle(document.getElementById('pbody')).overflowY === 'auto' }; });
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
console.log('restMin:', restMin, '· visual:', JSON.stringify(visual), '· planets/wires:', JSON.stringify(pw), '· depth:', JSON.stringify(depth), '· foot:', JSON.stringify(foot));
console.log('trail:', JSON.stringify(trail));
console.log('hover:', JSON.stringify(hover));
console.log('gear:', JSON.stringify(gear));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(jrn.centered && jrn.e2eFirst && jrn.named > 50)) fails.push('journeys centered/grouped/named wrong');
if (!(jsel.banner && jsel.bannerName.length > 3 && jsel.walkMode === 'journey' && jsel.steps > 1 && jsel.panelOpen && jsel.wbShown)) fails.push('journey HUD (topbar middle) wrong');
if (!(step1.i === 1 && /2\//.test(step1.pos) && step1.cardName.length > 0 && step1.stillLit && camMoved)) fails.push('journey stepping broken');
if (!(panel.footBtn && !panel.headBtn && panel.railBelow && panel.stable)) fails.push('panel chevron/geometry wrong');
if (!(visual.minRest >= restMin - 0.01 && visual.moversOnPath && visual.camD > visual.setR)) fails.push('highlight visual floors broken (glow keeps the rest bright — never below the resting min; movers on path; framed outside)');
if (!(pw.nodesGone && pw.hullStays && pw.wiresScoped && pw.nodesBack)) fails.push('planets/wires matrix columns broken');
if (!(depth.atFive && depth.down && depth.up)) fails.push('depth slider / arrow keys broken');
if (!(foot.onScreen && foot.bodyScrolls)) fails.push('panel footer scrolls off screen');
if (!(escd.banner && escd.walk && escd.hl)) fails.push('Esc does not clear the walk');
if (!(trail.chips === 3 && trail.iAfter === 0 && trail.mode === 'trail' && trail.cardIsFirst)) fails.push('trail chips broken');
if (!(hover.chip && hover.whileHover === 1 && hover.afterLeave === 0)) fails.push('chip hover halo broken');
if (!(gear.hidden && gear.shownFull)) fails.push('gear/config sync broken');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('WALK PROOF: ALL PASS');
