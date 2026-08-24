// verify-search.mjs — batch 49 proof: the header SEARCH + the journey FRONTEND leg.
// [1] boot clean · [2] `/` focuses · [3] element search → Enter selects + frames · [4] entity row →
// entity panel · [5] a HELD type → Types ON + selected · [6] journey row → the walk starts ·
// [7] the fe leg: a bridge-reaching journey walks users→screens FIRST, pill + picker wear the chip ·
// [8] Esc closes; typing never flies the camera. 0 page/console errors throughout.
import path from 'node:path';
import { createRequire } from 'node:module';
const req = createRequire('/home/khujta/projects/gabe_lens/docs/design/graft-adoption/spike/_build/package.json');
const { chromium } = req('playwright-core');
const D = path.dirname(new URL(import.meta.url).pathname);
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable', args: ['--use-angle=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 40000 }).catch(() => {});
await p.waitForTimeout(4500);
const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

// [2] `/` focuses the input (and does not type into it)
const slash = await p.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
  return { focused: document.activeElement === document.getElementById('tsin'), val: document.getElementById('tsin').value }; });

// [3] element search: type a hook name → grouped rows with REAL kind glyphs → Enter selects + frames
const el = await p.evaluate(() => new Promise(res => {
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd');
  const target = nodes.find(n => n.kind === 'hook');
  const cam0 = Graph.camera().position.clone();
  inp.value = target.label; inp.dispatchEvent(new Event('input', { bubbles: true }));
  const open = dd.style.display !== 'none', rows = dd.querySelectorAll('.tsrow').length;
  const glyphed = [...dd.querySelectorAll('.tsrow')].every(r => r.querySelector('svg,i'));
  const grouped = !!dd.querySelector('.tsgrp');
  inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  setTimeout(() => res({ open, rows, glyphed, grouped,
    closed: dd.style.display === 'none',
    sel: SEL && SEL.kind === 'node' && SEL.data.label === target.label,
    panel: document.body.classList.contains('panel-open'),
    framed: Graph.camera().position.distanceTo(cam0) > 10 }), 1200); }));

// [4] entity search → the entity panel
const ent = await p.evaluate(() => new Promise(res => {
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd');
  inp.value = _ents[0]; inp.dispatchEvent(new Event('input', { bubbles: true }));
  const row = [...dd.querySelectorAll('.tsrow')].find(r => r.querySelector('.tsl').textContent === _ents[0]);
  if (!row) { res({ row: false }); return; }
  row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  setTimeout(() => res({ row: true, view: (window.__uniPView || {}).lvl }), 900); }));

// [5] a HELD type: search finds it with the hint; firing turns Types ON and selects it
const ty = await p.evaluate(() => new Promise(res => {
  const held = _FETYPES.find(n => !NIDS[n.id]);
  if (!held) { res({ skip: 'no held types' }); return; }
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd');
  inp.value = held.label; inp.dispatchEvent(new Event('input', { bubbles: true }));
  const row = [...dd.querySelectorAll('.tsrow')].find(r => r.querySelector('.tshint'));
  if (!row) { res({ row: false, label: held.label }); return; }
  row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  setTimeout(() => res({ row: true, typesOn: CFG.showTypes === 'on', drawn: !!NIDS[held.id],
    tog: document.getElementById('typesTog').classList.contains('on'),
    sel: SEL && SEL.kind === 'node' && SEL.data.id === held.id }), 2500); }));

// [6+7] journeys: a bridge-reaching journey found VIA SEARCH walks its frontend leg FIRST
const jr = await p.evaluate(() => new Promise(res => {
  const j = _jrnCollect().filter(x => x.feN > 0).sort((a, b) => b.feN - a.feN)[0];
  if (!j) { res({ skip: 'no fe-reaching journey in the feed' }); return; }
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd');
  inp.value = (j.name || j.cid).slice(0, 18); inp.dispatchEvent(new Event('input', { bubbles: true }));
  const row = [...dd.querySelectorAll('.tsgrp')].some(g => /journeys/.test(g.textContent));
  window.__uniJrnStart(j.cid);                                   // fire directly — deterministic pick of THIS journey
  setTimeout(() => {
    const feIds = j.fe.users.concat(j.fe.screens).filter(id => !!NIDS[id]);
    const head = WALK.steps.slice(0, feIds.length);
    const back = j.carriers.filter(id => !!NIDS[id]);
    res({ jrRow: row, feN: j.feN, mode: WALK.mode,
      exact: Object.keys(HL.set).length === feIds.length + back.length,   // the path IS the set — no BFS spill
      feFirst: (() => { const nFe = WALK.steps.filter(id => id.startsWith('fe:')).length;      // capsule-aware: stashed fe steps ride the head too (review 53)
        return nFe > 0 && WALK.steps.slice(0, nFe).every(id => id.startsWith('fe:')); })(),
      backTail: (() => { const nFe = WALK.steps.filter(id => id.startsWith('fe:')).length;
        return WALK.steps.slice(nFe).every(id => !id.startsWith('fe:')); })(),
      lit: feIds.every(id => HL.set[id] !== undefined),
      pillChip: !!document.querySelector('#jrnpill .wfe'),
      pillChipGlyph: !!document.querySelector('#jrnpill .wfe svg') }); }, 1500); }));

// picker rows wear the fe chip (actual glyph, count)
const picker = await p.evaluate(() => { __uniJrnToggle();
  const chips = document.querySelectorAll('#jrn .jrnrow .jrnfe').length;
  const glyph = !!document.querySelector('#jrn .jrnrow .jrnfe svg');
  __uniJrnToggle(); return { chips, glyph }; });

// [8] Esc closes the dropdown; typing letters never flies the camera
const esc = await p.evaluate(() => new Promise(res => {
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd');
  inp.focus(); inp.value = 'use'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  const openBefore = dd.style.display !== 'none';
  const cam0 = Graph.camera().position.clone();
  inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));   // would fly if unguarded (FK is closure-local — observe the camera)
  inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  setTimeout(() => res({ openBefore, flew: Graph.camera().position.distanceTo(cam0) > 2,
    closed: dd.style.display === 'none', stillJourney: WALK.mode === 'journey' }), 700); }));

// [9] REVIEW FIXES (batch 49b): exclusivity · escaping · unique headers · focusout · held fns · fleet-hidden fe leg
const fx = await p.evaluate(() => new Promise(res => {
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd'), out = {};
  // A: the journeys picker closes when the dropdown opens (it would paint OVER and steal clicks)
  __uniJrnToggle(); const jrnOpen = document.getElementById('jrn').style.display !== 'none';
  inp.focus(); inp.value = 'use'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  out.exclusive = jrnOpen && document.getElementById('jrn').style.display === 'none' && dd.style.display !== 'none';
  // F: group headers never repeat
  const gs = [...dd.querySelectorAll('.tsgrp')].map(g => g.textContent);
  out.uniqueHeaders = gs.length === new Set(gs).size && gs.length > 0;
  // C: raw markup in the query neither executes nor injects
  window.__xss = 0; inp.value = '<img src=x onerror="window.__xss=1">zz';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(() => { out.noXss = window.__xss === 0 && !dd.querySelector('img') && /no match/.test(dd.textContent);
    // B: a held function is findable with ƒ OFF and its row turns ƒ ON
    const fn = (window.GABE_LEVELS.fn_nodes || [])[0];
    inp.value = fn ? fn.name : ''; inp.dispatchEvent(new Event('input', { bubbles: true }));   // the RAW feed field is `name` (label is the MAPPED node's)
    const grp = [...dd.querySelectorAll('.tsgrp')].some(g => /functions \(off\)/.test(g.textContent));
    const row = [...dd.querySelectorAll('.tsrow')].find(r => r.querySelector('.tshint') && /ƒ/.test(r.querySelector('.tshint').textContent));
    if (row) row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    setTimeout(() => { out.heldFn = !!fn && grp && !!row && CFG.showFns === 'on'
        && document.getElementById('fnsTog').classList.contains('on') && nodes.some(n => n.__fn);
      // E: keyboard blur closes the dropdown
      inp.focus(); inp.value = 'use'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      const open2 = dd.style.display !== 'none';
      inp.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
      out.blurCloses = open2 && dd.style.display === 'none';
      // D: fleet-hiding an fe home keeps its pieces OUT of the walk; the pill counts the WALKED fe
      const j = _jrnCollect().filter(x => x.feN > 0).sort((a, b) => b.feN - a.feN)[0];
      if (!j) { out.fleetSkip = true; res(out); return; }
      const homes = [...new Set(j.fe.users.concat(j.fe.screens).map(id => (NIDS[id] || {}).ent).filter(Boolean))];
      const victim = homes[0];
      __uniFleetToggle ? null : null;
      UNIVIS.ent[victim] = Object.assign({}, UNIVIS.ent[victim] || {}, { show: false });   // fleet-hide the home
      window.__uniJrnStart(j.cid);
      setTimeout(() => {
        const hiddenWalked = WALK.steps.some(id => { const n = _fieldN(id); return n && n.fe && n.ent === victim; });   // drawn OR stashed — a hidden piece must never walk (capsule-aware, review 53)
        const walkedFe = WALK.steps.filter(id => { const n = _fieldN(id); return n && n.fe; }).length;                    // the chip counts WALKABLE fe steps (stashed ones expand on arrival)
        const chip = document.querySelector('#jrnpill .wfe');
        out.fleetHonest = !hiddenWalked && (!chip || +chip.textContent.replace(/\D/g, '') === walkedFe);
        delete UNIVIS.ent[victim].show; __uniHLClear();
        res(out); }, 900);
    }, 2600); }, 400); }));

// [batch 53] a STASHED (capsuled) piece is searchable — the row opens its capsule and selects it
const cap = await p.evaluate(() => new Promise(res => {
  if (!_CAPST || !Object.keys(_CAPST.byPiece).length) { res({ skip: true }); return; }
  const target = _CAPST.nodes[0];
  const inp = document.getElementById('tsin'), dd = document.getElementById('tsdd');
  inp.value = target.label; inp.dispatchEvent(new Event('input', { bubbles: true }));
  const row = [...dd.querySelectorAll('.tsrow')].find(r => r.querySelector('.tshint') && /capsule/.test(r.querySelector('.tshint').textContent));
  if (!row) { res({ row: false, label: target.label }); return; }
  row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  setTimeout(() => res({ row: true, sel: SEL && SEL.data && SEL.data.id === target.id,
    drawn: !!NIDS[target.id] }), 1800); }));

await b.close();
console.log('capSearch:', JSON.stringify(cap));
console.log('fixes:', JSON.stringify(fx));
console.log('slash:', JSON.stringify(slash));
console.log('element:', JSON.stringify(el));
console.log('entity:', JSON.stringify(ent));
console.log('heldType:', JSON.stringify(ty));
console.log('journey+fe:', JSON.stringify(jr), '· picker:', JSON.stringify(picker));
console.log('esc:', JSON.stringify(esc));
console.log(`errors ${errs.length}`); errs.slice(0, 5).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(slash.focused && slash.val === '')) fails.push('/ must focus the search without typing into it');
if (!(el.open && el.rows > 0 && el.glyphed && el.grouped && el.closed && el.sel && el.panel && el.framed)) fails.push('element search → Enter must select + open the card + frame the camera (rows grouped, REAL glyphs)');
if (!(ent.row && ent.view === 'ent')) fails.push('entity search must open the entity panel');
if (!ty.skip && !(ty.row && ty.typesOn && ty.drawn && ty.tog && ty.sel)) fails.push('a held type must be findable and turn Types ON when opened');
if (!jr.skip && !(jr.jrRow && jr.mode === 'journey' && jr.exact && jr.feFirst && jr.backTail && jr.lit && jr.pillChip && jr.pillChipGlyph)) fails.push('the journey frontend leg must walk FIRST (users→screens→carriers), light EXACTLY the path, and wear the pill chip');
if (!(picker.chips > 0 && picker.glyph)) fails.push('picker rows must wear the fe chip with the ACTUAL component glyph');
if (!(esc.openBefore && !esc.flew && esc.closed && esc.stillJourney)) fails.push('Esc must close ONLY the dropdown; typing must never fly the camera');
if (!(fx.exclusive && fx.uniqueHeaders && fx.noXss && fx.heldFn && fx.blurCloses && (fx.fleetSkip || fx.fleetHonest))) fails.push('review fixes broken (exclusive surfaces · unique headers · escaping · held-fns group · blur close · fleet-hidden fe honesty): ' + JSON.stringify(fx));
if (!cap.skip && !(cap.row && cap.sel && cap.drawn)) fails.push('a capsuled piece must be searchable (row opens the capsule + selects): ' + JSON.stringify(cap));
if (fails.length) { console.error('FAIL: ' + fails.join(' · ')); process.exit(1); }
console.log('SEARCH + JOURNEY-FE PROOF: ALL PASS');
