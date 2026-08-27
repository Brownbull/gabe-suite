/* Workflows + backend journeys + step note + chip rows + middle-click solo (operator batch 2026-08-27).
   [1] the picker carries WORKFLOWS (curated, window.GABE_WORKFLOWS) + BACKEND (derived) tabs with rows
   [2] a backend journey is ORDERED BY HOPS: endpoint → handler → boundary → writer → model
   [3] starting a workflow walks its endpoints' chains; the STEP NOTE shows top-centre, changes per step
   [4] walkbar chips keep a fixed size and WRAP into rows
   [5] middle-click on an entity chip = SOLO (all others excluded); again = restore
   Run: node verify-workflows.mjs   (SOLO — headless swiftshader; system chrome) */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.GABE_PW_DIR || path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);
let pass = 0, fail = 0;
const ck = (c, m, x) => { if (c) { pass++; console.log('PASS  ' + m + (x ? '  — ' + x : '')); } else { fail++; console.log('FAIL  ' + m + (x ? '  — ' + x : '')); } };
const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable', args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);

/* [1] tabs + rows */
const t = await p.evaluate(() => {
  __uniJrnToggle(); const jp = document.getElementById('jrn');
  const tabs = [...jp.querySelectorAll('.jrnkindtabs button')].map(b => b.getAttribute('data-jk'));
  const open = window.__uniJrnKind;
  const wfRows = [...jp.querySelectorAll('.jrnrow[data-jr^="wf:"]')].length;
  jp.querySelector('.jrnkindtabs button[data-jk="bk"]').click();
  const bkRows = [...document.getElementById('jrn').querySelectorAll('.jrnrow[data-jr^="bk:"]')].length;
  /* the EXACT expectation: one backend chain per endpoint that has a handler wire AND at least one further step */
  const bkExpect = _jrnCollect().filter(j => j.bk).length;
  const epWithHandler = _FNLINKS.filter(l => l.rel === 'handler').length;
  return { tabs, open, wfRows, bkRows, bkExpect, epWithHandler, curated: (window.GABE_WORKFLOWS || []).length };
});
ck(t.tabs[0] === 'wf' && t.tabs[1] === 'bk' && t.open === 'wf', 'picker opens on WORKFLOWS, backend tab second', 'tabs=' + t.tabs.join(','));
ck(t.wfRows === t.curated && t.curated >= 8, 'every curated workflow has a row', 'rows=' + t.wfRows + ' curated=' + t.curated);
ck(t.bkRows === t.bkExpect && t.bkExpect === t.epWithHandler && t.bkExpect > 0,
  'one backend chain per handler-wired endpoint, every one a row (exact)', 'rows=' + t.bkRows + ' chains=' + t.bkExpect + ' handler wires=' + t.epWithHandler);

/* [2] chain order on the template endpoint */
const o = await p.evaluate(() => {
  const j = _jrnCollect().filter(x => x.cid === 'bk:endpoint:POST /setup/complete')[0]; if (!j) return { missing: true };
  const ix = id => j.carriers.indexOf(id);
  let mono = true, accessOk = true, lastFnHop = -1;
  j.meta.forEach(m => { if (m.why === 'fn' || m.why === 'endpoint') { if (m.hop < lastFnHop) mono = false; lastFnHop = m.hop; }
    else { const from = j.meta.filter(x => x.id === m.from)[0]; if (!from || m.hop !== from.hop + 1) accessOk = false; } });
  return { writes: j.writes, n: j.carriers.length, mono, accessOk,
    ep: ix('endpoint:POST /setup/complete'), h: ix('apps/api/api/setup.py#setup_complete'), b: ix('apps/api/services/setup.py#complete_setup'),
    w: ix('apps/api/services/setup.py#_upsert_dietary'), m: ix('model:UserDietaryProfile'),
    metaWrite: (j.meta.filter(x => x.id === 'model:UserDietaryProfile')[0] || {}).why };
});
ck(!o.missing && o.ep === 0 && o.h === 1 && o.h < o.b && o.b < o.w && o.w < o.m && o.m === o.w + 1 && o.mono && o.accessOk,
  'backend journey is ORDERED BY HOPS: fn hops never decrease, every model step = its writer\'s hop+1, right after it',
  JSON.stringify(o));
ck(o.writes >= 6 && o.metaWrite === 'write', 'the chain carries write meta (red access wires)', 'writes=' + o.writes + ' why=' + o.metaWrite);

/* [3] start a workflow → walk + step note */
const w = await p.evaluate(() => {
  __uniJrnStart('wf:0'); const sn = document.getElementById('stepnote');
  const wf = HL.jrObj, expectSteps = (wf.fe.screens.length + wf.fe.users.length) + wf.carriers.length;
  const r0 = { mode: WALK.mode, steps: WALK.steps.length, expectSteps, shown: sn.style.display !== 'none', txt0: sn.textContent.slice(0, 120), hop0: !!sn.querySelector('.snhop') };
  _walkGo(1); const r1 = sn.textContent.slice(0, 120);
  _walkGo(1); const r2 = sn.textContent.slice(0, 120);
  /* DERIVATION: jump to the commit boundary + the first written model and read the note's WHAT line */
  const at = id => { WALK.i = WALK.steps.indexOf(id); _walkGo(0); return sn.querySelector('.snwhat').textContent + ' | ' + (sn.querySelector('.snhop') || {}).textContent; };
  const bnd = at('apps/api/services/setup.py#complete_setup'), mdl = at('model:UserDietaryProfile');
  const rect = sn.getBoundingClientRect();
  return { r0, r1, r2, bnd, mdl, cx: rect.left + rect.width / 2, top: rect.top, vw: window.innerWidth };
});
ck(w.r0.mode === 'journey' && w.r0.steps === w.r0.expectSteps && w.r0.steps > 0, 'a workflow walks exactly its screens + its endpoints\' chains', 'steps=' + w.r0.steps + ' expect=' + w.r0.expectSteps);
ck(/WRITE-ANCHOR/.test(w.bnd) && /caller|function/.test(w.bnd), 'the note DERIVES the boundary step (write-anchor · role)', w.bnd.slice(0, 110));
ck(/written by/.test(w.mdl) && /_upsert_dietary/.test(w.mdl) && /WRITTEN/.test(w.mdl), 'the note DERIVES the model step (written by its writer · hop)', w.mdl.slice(0, 110));
ck(w.r0.shown && w.r0.hop0, 'the STEP NOTE shows with hop guidance', w.r0.txt0);
ck(w.r1.replace(/^\d+\/\d+/, '') !== w.r0.txt0.replace(/^\d+\/\d+/, '') && w.r2.replace(/^\d+\/\d+/, '') !== w.r1.replace(/^\d+\/\d+/, ''),
  'the note BODY changes with every step (counter stripped)', w.r2);
ck(Math.abs(w.cx - w.vw / 2) < 40 && w.top < 140, 'the note sits top-centre over the graph', 'cx=' + Math.round(w.cx) + ' top=' + Math.round(w.top));

/* [4] walkbar chips wrap */
const c = await p.evaluate(() => {
  document.body.classList.add('panel-open'); _walkRender();
  const wb = document.getElementById('walkbar'), nav = wb.querySelector('.wnav');
  const chips = [...wb.querySelectorAll('.wchip')];
  const cs = getComputedStyle(nav); const w0 = chips[0].getBoundingClientRect().width;
  const rows = new Set(chips.map(ch => Math.round(ch.getBoundingClientRect().top))).size;
  const drawn = WALK.steps.filter(id => !!NIDS[id]).length;   // the chip rule (pre-existing): a step with no drawn node draws no chip
  return { chips: chips.length, wrap: cs.flexWrap, w0, rows, steps: WALK.steps.length, drawn };
});
ck(c.chips === c.drawn && c.wrap === 'wrap' && Math.abs(c.w0 - 20) < 1 && c.rows >= 2,
  'walkbar chips: one per DRAWN step, fixed 20px, wrapped into rows', JSON.stringify(c));

/* [4b] the WALK PIN — a step the critical fold would hide is visible during the walk; Esc clears the pins */
const pin = await p.evaluate(() => {
  __uniSetKindState('function', 'critical'); __uniComputeSolo();
  const bk = _jrnCollect().filter(j => j.bk); let hit = null;
  for (const j of bk) { for (const id of j.carriers) { const n = NIDS[id]; if (n && n.kind === 'function' && n.__solo) { hit = { cid: j.cid, id }; break; } } if (hit) break; }
  if (!hit) return { none: true };
  __uniHLClear(); const before = _nodeVisibleFn(NIDS[hit.id]);
  __uniJrnStart(hit.cid); const during = _nodeVisibleFn(NIDS[hit.id]), pinned = !!window.__uniPin[hit.id];
  __uniHLClear(); const after = Object.keys(window.__uniPin).length, afterVis = _nodeVisibleFn(NIDS[hit.id]);
  return { id: hit.id, before, during, pinned, after, afterVis };
});
ck(pin.none || (pin.before === false && pin.during === true && pin.pinned),
  'walk PIN: a solo-folded fn on the chain becomes visible while its journey walks', JSON.stringify(pin));
ck(pin.none || (pin.after === 0 && pin.afterVis === false), 'Esc clears every pin and the fold returns', 'pins=' + pin.after);
/* [4c] HONEST-EMPTY: no curated workflows → no wf rows, the picker opens on backend */
const he = await p.evaluate(() => {
  const saved = window.GABE_WORKFLOWS; window.GABE_WORKFLOWS = []; JRN = null; window.__uniJrnKind = null;
  __uniJrnToggle(); if (document.getElementById('jrn').style.display === 'none') __uniJrnToggle();
  const jp = document.getElementById('jrn');
  const r = { wfRows: jp.querySelectorAll('.jrnrow[data-jr^="wf:"]').length, open: window.__uniJrnKind, wfBadge: +jp.querySelector('[data-jk="wf"] b').textContent };
  window.GABE_WORKFLOWS = saved; JRN = null; window.__uniJrnKind = null; __uniJrnToggle(); return r;
});
ck(he.wfRows === 0 && he.wfBadge === 0 && he.open === 'bk', 'honest-empty: no workflows.js → no workflow rows, picker opens on backend', JSON.stringify(he));

/* [5] middle-click solo */
const s = await p.evaluate(() => {
  __uniHLClear(); __uniJrnToggle(); if (document.getElementById('jrn').style.display === 'none') __uniJrnToggle();
  const chip = document.querySelector('#jrn .jrnent'); const e = chip.getAttribute('data-e');
  chip.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true }));
  const ex = Object.keys(window.__uniJrnExcl); const all = Object.keys(_jrnTouch());
  const solo = !window.__uniJrnExcl[e] && ex.length === all.length - 1;
  const chip2 = document.querySelector('#jrn .jrnent[data-e="' + e + '"]');
  chip2.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true }));
  return { e, solo, restored: Object.keys(window.__uniJrnExcl).length === 0, all: all.length };
});
ck(s.solo, 'middle-click an entity chip = SOLO that entity', s.e + ' of ' + s.all);
ck(s.restored, 'middle-click the solo chip again = restore all');

ck(errs.length === 0, 'no page/console errors', errs.slice(0, 3).join(' | '));
await b.close();
console.log(`\n${pass}/${pass + fail} workflow checks passed`);
process.exit(fail ? 1 : 0);
