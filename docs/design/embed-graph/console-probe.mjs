// console-probe.mjs — the CONSOLE skin's laws, measured on the rendered panes.
//
// The skin ports the SC2 console's regions to pane scale (see _pane-console.js). Each region has a
// law that a DOM count alone would let slide, so every assert here measures the law itself:
//
//   PORTRAIT    the head carries the subject's KIND glyph (an <svg>, never a dot) + a scope badge
//   QUEUE       one row per step, each with a kind glyph; the progress bar has one segment per step;
//               the current step is the ONLY lit row and the ONLY lit segment
//   VITALS      exactly FOUR slots, always, each wearing one of the five state classes; a TEST scope
//               with only frontend pieces shows TESTED as HATCHED (unmeasured), never as 0
//   COMMAND     three transport cells exist even when disabled — a verb keeps its cell; reach = 2
//   BEHAVIOR    the chip counts SUM to the resolver's held-back total; a complete pane shows one
//               green chip, not nothing
//   TOOLTIP     hovering a vital shows the shared instant tooltip with a title
//
//   node console-probe.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(process.env.GABE_PW_DIR || '/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/x.js');
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
let P = 0, F = 0;
const ok = (c, m) => { if (c) { P++; } else { F++; console.log('  FAIL: ' + m); } };

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable', args: ['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 1100 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));

await pg.goto('file://' + path.join(here, 'index.html') + '?skin=console&size=panel');
await pg.waitForFunction('document.querySelectorAll(".pnc .pn-canvas canvas").length >= 4', { timeout: 40000 }).catch(() => {});
await pg.waitForTimeout(16000);

const n = await pg.evaluate(`document.querySelectorAll('.pnc').length`);
ok(n === 4, `four console panes must mount; mounted ${n}`);

// walk the journey pane to step 3 so the queue + minimap selection are testable
await pg.evaluate(`window.__probePanes[0].stepTo(2)`);
await pg.waitForTimeout(1200);

const R = await pg.evaluate(`(function(){
  var out = [];
  document.querySelectorAll('.pnc').forEach(function (w, i) {
    var p = window.__probePanes[i], s = p.slice;
    var st = s.steps || [];
    var vit = Array.prototype.map.call(w.querySelectorAll('.pnc-vital'), function (v) {
      return { cls: (v.className.match(/st-\\w+/) || [''])[0], val: v.querySelector('.vv').textContent }; });
    var rows = w.querySelectorAll('.pnc-step'), segs = w.querySelectorAll('.pnc-qbar i');
    var litRows = w.querySelectorAll('.pnc-step.on').length, litSegs = w.querySelectorAll('.pnc-qbar i.on').length;
    var glyphRows = Array.prototype.filter.call(rows, function (r) { return r.querySelector('.k svg'); }).length;
    var held = s.stats.held || {}, heldN = 0; Object.keys(held).forEach(function (k) { heldN += held[k]; });
    var chips = Array.prototype.map.call(w.querySelectorAll('.pnc-chip'), function (c) {
      return { cls: c.className, n: +(c.querySelector('b') || {}).textContent || 0 }; });
    var kindChips = chips.filter(function (c) { return !/hatched|missing|clean/.test(c.cls); });
    out.push({
      scope: s.subject.scope, id: s.subject.id,
      portraitSvg: !!w.querySelector('.pnc-pg svg'), badge: (w.querySelector('.pnc-badge') || {}).textContent,
      tierBadge: (w.querySelector('.pnc-tier') || {}).textContent,
      steps: st.length, rows: rows.length, segs: segs.length, litRows: litRows, litSegs: litSegs, glyphRows: glyphRows, cursor: p.step,
      noMap: !w.querySelector('.pnc-map'),
      vitals: vit, transport: w.querySelectorAll('.pnc-transport .pnc-cell').length,
      transportDisabled: w.querySelectorAll('.pnc-transport .pnc-cell:disabled').length,
      reach: w.querySelectorAll('.pnc-reach .pnc-cell').length,
      heldN: heldN, chipSum: kindChips.reduce(function (a, c) { return a + c.n; }, 0),
      cleanChip: !!w.querySelector('.pnc-chip.clean'), hatchedChip: !!w.querySelector('.pnc-chip.hatched'),
      feOnly: s.nodes.length > 0 && s.nodes.every(function (x) { return x.fe; })
    });
  });
  return out;
})()`);

const STATES = ['st-lit', 'st-full', 'st-grey', 'st-hatched', 'st-blank'];
R.forEach(r => {
  const t = r.scope + ':' + r.id;
  // PORTRAIT
  ok(r.portraitSvg, `${t} — the portrait must carry a kind glyph, not a dot`);
  ok(r.badge === r.scope, `${t} — the badge names the scope; reads "${r.badge}"`);
  ok(r.tierBadge === 'T1', `${t} — the tier badge names the station's boot tier; reads "${r.tierBadge}"`);
  // QUEUE
  if (r.steps >= 2) {
    ok(r.rows === r.steps, `${t} — ${r.rows} queue rows for ${r.steps} steps`);
    ok(r.segs === r.steps, `${t} — ${r.segs} progress segments for ${r.steps} steps`);
    ok(r.glyphRows === r.steps, `${t} — every queue row carries a glyph (${r.glyphRows}/${r.steps})`);
    if (r.cursor >= 0) {
      ok(r.litRows === 1 && r.litSegs === 1, `${t} — exactly one lit row and one lit segment while walking (${r.litRows}/${r.litSegs})`);
    } else {
      ok(r.litRows === 0, `${t} — nothing lit before the walk starts`);
    }
    ok(r.transport === 3, `${t} — three transport cells exist (${r.transport}); a verb keeps its cell`);
    if (r.cursor <= 0) ok(r.transportDisabled >= 2, `${t} — at the start, prev and home are blanked (${r.transportDisabled} disabled), never removed`);
  }
  // MINIMAP — discarded (operator 2026-09-09); it must not come back
  ok(r.noMap, `${t} — the minimap was discarded and must not render`);
  // VITALS
  ok(r.vitals.length === 4, `${t} — four vital slots, always; found ${r.vitals.length}`);
  ok(r.vitals.every(v => STATES.includes(v.cls)), `${t} — every vital wears a state class; got ${r.vitals.map(v => v.cls).join(',')}`);
  if (r.feOnly && r.scope === 'test') ok(r.vitals[3].cls === 'st-hatched', `${t} — a frontend-only test pane shows TESTED as HATCHED, never 0`);
  // COMMAND
  ok(r.reach === 2, `${t} — two reach cells (${r.reach})`);
  // BEHAVIOR
  ok(r.chipSum === r.heldN, `${t} — chips sum to the held-back total: ${r.chipSum} vs ${r.heldN}`);
  if (!r.heldN) ok(r.cleanChip, `${t} — a complete pane shows the green chip, not nothing`);
});

// TOOLTIP: hover a vital, the shared tip appears with its title
const tipBox = await pg.evaluate(`(function(){ var v=document.querySelector('.pnc-vital'); var r=v.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}; })()`);
await pg.mouse.move(tipBox.x, tipBox.y);
await pg.waitForTimeout(200);
const tip = await pg.evaluate(`(function(){ var t=document.querySelector('.pnc-tip'); return t ? { on: t.classList.contains('on'), title: (t.querySelector('b')||{}).textContent } : null; })()`);
ok(tip && tip.on && tip.title === 'drawn', `hovering the first vital shows the instant tip titled "drawn"; got ${JSON.stringify(tip)}`);

// the classic skin is untouched by the console file
await pg.goto('file://' + path.join(here, 'index.html') + '?skin=classic&size=card');
await pg.waitForTimeout(12000);
const classic = await pg.evaluate(`({pn: document.querySelectorAll('.pn').length, pnc: document.querySelectorAll('.pnc').length})`);
ok(classic.pn === 4 && classic.pnc === 0, `the classic skin still renders alone (${classic.pn} classic, ${classic.pnc} console)`);

ok(errs.length === 0, 'console errors: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log(`\n${P} passed · ${F} failed`);
process.exit(F ? 1 : 0);
