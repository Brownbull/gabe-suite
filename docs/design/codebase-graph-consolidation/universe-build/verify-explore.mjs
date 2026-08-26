/* Batch-12/21b proof: layer ruling (c) · depth highlight (glow/focus, Alt+scroll, Esc) · journeys picker ·
   topbar rework (icons, pills far right) · drag ownership under chords (owner released mid-chord
   ends CLEANLY — no stranded drag, controls re-enabled). Run: node verify-explore.mjs */
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
// all kinds VISIBLE for this structural test — CRITICAL (the boot default now) hides solo helpers and would skew the highlight-set / wire counts below
await p.evaluate(() => { ['backend','frontend'].forEach(g => { var i=0; while(__uniGrpState[g]!=='all' && i++<5) __uniGroupToggle(g); }); });
await p.waitForTimeout(1500);
const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

// [1] layer ruling (c): un-collapsed groups — endpoints + web appear, "frontend" is gone
const layer = await p.evaluate(() => {
  const defaultCore = CFG.coreBy;                       // USE-CASE when the levels feed is present (operator default)
  CFG.coreBy = 'layer'; assignSub('layer');
  const subs = {}; nodes.forEach(n => { subs[n.sub] = 1; });
  const epSep = nodes.filter(n => n.kind === 'endpoint').every(n => n.sub === 'endpoints');
  const webOwn = nodes.filter(n => n.kind === 'web').every(n => n.sub === 'web');
  CFG.coreBy = defaultCore; assignSub(defaultCore);
  return { groups: Object.keys(subs).sort(), epSep, webOwn, noFrontend: !subs.frontend, defaultCore };
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

const restMin = await p.evaluate(() => { let m = 1; connGroup.children.forEach(w => { if (w.material.blending !== THREE.AdditiveBlending) m = Math.min(m, w.material.opacity); }); return +m.toFixed(2); });   // the RESTING floor (calls sit at 0.3 by operator default) — the highlight must never dim below it
// [3] depth highlight — GLOW: select, sprites on the reached set, lit wires additive, others dimmed
await p.evaluate(rm => { window.__restMin = rm; const n = nodes.find(x => x.kind === 'endpoint'); window.__testN = n; __uniHLSelect(n); }, restMin);
await raf(); await p.waitForTimeout(700);
const glow = await p.evaluate(() => {
  const inSet = Object.keys(HL.set).length;
  let lit = 0, dimmed = 0, minRest = 1; connGroup.children.forEach(w => { if (w.material.blending === THREE.AdditiveBlending) lit++;
    else { if (w.material.opacity < window.__restMin - 0.01) dimmed++; minRest = Math.min(minRest, w.material.opacity); } });
  return { on: HL.on, depth: HL.depth, inSet, sprites: HL.sprites.length, lit, dimmed, minRest: +minRest.toFixed(2),
    haloGrouped: HL.sprites.every(s => s.parent && s.parent.parent === Graph.scene()), total: connGroup.children.length };
});
// Alt+scroll changes depth (recompute follows); click cycles
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', altKey: true })); });   // Alt+E = depth up (replaced Alt+scroll)
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
  const el = document.getElementById('jrn');   // one kind tab at a time now (default by-entity)
  return { rows: el.querySelectorAll('.jrnrow:not(.jrnnone)').length, kindTabs: el.querySelectorAll('.jrnkindtabs button').length,
    open: el.style.display !== 'none' }; });
await p.evaluate(() => { document.querySelectorAll('#jrn .jrnrow')[1].click(); });
await raf(); await p.waitForTimeout(700);
const jrnSel = await p.evaluate(() => ({ on: HL.on, jr: HL.jr, carriers: HL.origin.length,
  inSet: Object.keys(HL.set).length, btnOn: document.getElementById('jrnBtn').classList.contains('on') }));
await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
await p.waitForTimeout(500);

// [5b] RING layout: circle radii equal, flat, generously spaced
await p.evaluate(() => { CFG.entLayout = 'ring'; applyCfg('entLayout'); });
await raf(); await p.waitForTimeout(1200);
const ring = await p.evaluate(() => {
  const rs = Object.keys(EX).map(e => Math.hypot(EX[e], EZ[e]));
  const ys = Object.keys(EX).map(e => Math.abs(EY[e]));
  let minPair = 1e9; const ks = Object.keys(EX);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
    minPair = Math.min(minPair, Math.hypot(EX[ks[i]] - EX[ks[j]], EY[ks[i]] - EY[ks[j]], EZ[ks[i]] - EZ[ks[j]]));
  return { rSpread: +(Math.max(...rs) - Math.min(...rs)).toFixed(1), rMin: Math.round(Math.min(...rs)),
    flat: Math.max(...ys) < 1, minPair: Math.round(minPair) };
});
await p.evaluate(() => { CFG.entLayout = 'force'; applyCfg('entLayout'); });
await p.waitForTimeout(1000);
// [6] drag ownership under chords: the spec fires NO pointerdown/pointerup for chorded transitions —
//     when the OWNING button is released mid-chord (visible only as its bit vanishing from ev.buttons),
//     the drag must end CLEANLY (controls re-enabled), and the gesture's final mismatched pointerup must not strand anything
const chord = await p.evaluate(() => new Promise(res => {
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));
  const owns = window.__uniDragging === true;                                        // right-drag (tumble) starts
  for (let i = 1; i <= 4; i++) window.dispatchEvent(new PointerEvent('pointermove', { buttons: 3, clientX: cx + i * 12, clientY: cy, bubbles: true }));
  const aliveChorded = window.__uniDragging === true;                                // left joined (no pointerdown fires) — the right owner keeps it
  window.dispatchEvent(new PointerEvent('pointermove', { buttons: 1, clientX: cx + 60, clientY: cy, bubbles: true }));   // RIGHT released mid-chord: bit 2 gone, only left remains
  const endedOnOwnerLoss = window.__uniDragging === false;                           // the move recheck released it — no stale-scheme drag
  const ctrlsBack = Graph.controls().enabled === true;                               // and the controls came back (no dead zoom)
  window.dispatchEvent(new PointerEvent('pointerup', { button: 0, buttons: 0, bubbles: true }));   // final release (mismatched button) must be harmless
  const stillClean = window.__uniDragging === false && Graph.controls().enabled === true;
  g.dispatchEvent(new PointerEvent('pointerdown', { button: 2, buttons: 2, clientX: cx, clientY: cy, bubbles: true }));   // and a fresh drag starts fine after
  const restarts = window.__uniDragging === true;
  window.dispatchEvent(new PointerEvent('pointerup', { button: 2, buttons: 0, bubbles: true }));
  res({ owns, aliveChorded, endedOnOwnerLoss, ctrlsBack, stillClean, restarts, ended: window.__uniDragging === false });
}));
await b.close();

console.log('layer(c):', JSON.stringify(layer));
console.log('topbar:', JSON.stringify(topbar));
console.log('glow:', JSON.stringify(glow), '· wheel →', JSON.stringify(wheel));
console.log('focus:', JSON.stringify(focus), '· esc →', JSON.stringify(cleared));
console.log('journeys:', JSON.stringify(jrnList), '→', JSON.stringify(jrnSel));
console.log('ring:', JSON.stringify(ring));
console.log('chord:', JSON.stringify(chord));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(layer.epSep && layer.webOwn && layer.noFrontend && layer.defaultCore === 'usecase')) fails.push('layer ruling (c) / use-case default wrong');
if (!(topbar.pillsLast && topbar.depth && topbar.mode && topbar.jrn && topbar.freezeIconOnly && topbar.resetIconOnly)) fails.push('topbar rework wrong');
if (!(glow.on && glow.inSet > 1 && glow.sprites > 0 && glow.lit > 0 && glow.dimmed === 0 && glow.minRest >= restMin - 0.01 && glow.haloGrouped)) fails.push('glow highlight broken (rest must stay BRIGHT — never below the resting min; halos in the scene group)');
if (!(wheel.d === 4 && wheel.badge === '4' && wheel.grew >= glow.inSet)) fails.push('Alt+E depth broken');
if (!(focus.mode === 'focus' && focus.shown === focus.inSet && focus.wires === focus.setLinks)) fails.push('focus mode broken');
if (!(cleared.on === false && cleared.shown > 200 && cleared.sprites === 0)) fails.push('Esc does not clear');
if (!(jrnList.rows > 40 && jrnList.kindTabs === 3 && jrnSel.on && jrnSel.jr && jrnSel.carriers > 0 && jrnSel.inSet >= jrnSel.carriers && jrnSel.btnOn)) fails.push('journeys picker broken');   // by-entity tab lists its rows; picking one lights its carriers
if (!(chord.owns && chord.aliveChorded && chord.endedOnOwnerLoss && chord.ctrlsBack && chord.stillClean && chord.restarts && chord.ended)) fails.push('chord owner-release not clean (stranded drag)');
if (!(ring.rSpread < 2 && ring.flat && ring.rMin >= 420 && ring.minPair > 250)) fails.push('ring layout broken (circle, flat, spaced)');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('EXPLORE PROOF: ALL PASS');
