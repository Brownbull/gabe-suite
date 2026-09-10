// embed-graph PANE PROBE — the render proof for the mini universes.
//
// Every assert measures the thing it claims, per the universe render-bug lesson (headless-green is
// not proof; a bare `>0` accepts a broken picture). Two of these exist because a screenshot caught
// what a DOM count could not:
//
//   1  each pane mounts ONE live WebGL context, none lost                       (12-pane measurement)
//   2  the scene holds exactly slice.stats.drawn node objects
//   3  THE FIT IS REAL — every node projects INSIDE its viewport. The DOM was identical while the
//      graphs sat at ~25% of the frame and while one overflowed its box; only geometry catches it
//   4  a click on a node fills the detail line with THAT node's name; background click clears it
//   5  a drag ORBITS (the camera actually moves) and the subject never changes with it
//   6  the hop control changes the drawn count, and the honest line follows
//   7  the chrome floor: 2 hop buttons + 3 transport + 1 link inside a frame, at every size.
//      AMENDED 2026-09-09: the ruled floor was 2 buttons; the operator added a step rail with
//      home/prev/next, so the floor is now 5 and the probe pins the new number exactly.
//  14  THE VIEW PAYLOAD — copy emits a portable object carrying subject, selection and the focus
//      flag, and NEVER a step index (see paste-probe.mjs for why). The round trip into the real
//      station is proven separately by that probe.
//  13  THE HIGHLIGHT — the station's law (_hlCompute depth 1, _hlLinkF 2.6): a selection lights
//      itself and its IMMEDIATE neighbours, dims the rest, and a background click restores every
//      material to its own base opacity. Measured on real materials, not on a class name.
//  12  the CONTROL GRAMMAR (operator 2026-09-09): the transport reads prev - HOME - next with
//      home in the MIDDLE and every button drawn as an icon, never a text character; the reach
//      control lives ON the picture, wears words, and its two states are distinguishable.
//  11  THE WALK — a journey carries the AUTHORED order out of workflows.js; every other scope
//      says so and derives one. next advances, home returns, and a step whose endpoint the map
//      never drew is LISTED (struck), never skipped: 3 of 16 curated journeys have one.
//   8  the resolver against hand-read BASELINES, so a resolver that stops reporting cannot move
//      both sides of an assert together (the hole mutant 2 exposed in the 2D battery)
//   9  a pane never loads chip-assets.js — 2.7 MB of station-only fleet models
//  10  no console error on any page
//
// Engine: the machine-bound playwright cache the station probes already use.
//   node probe.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const _PWBASE = process.env.GABE_PW_DIR || '/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/';
const require = createRequire(_PWBASE.replace(/\/?$/, '/') + 'x.js');
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
let P = 0, F = 0;
const ok = (c, m) => { if (c) { P++; } else { F++; console.log('  FAIL: ' + m); } };

// measured on gustify c4_head 8356f531, 2026-09-08 — {seed, drawn@card, resolved edges, honest?}
const BASELINE = {
  'journey:Store ingredients — add to the pantry':
                     { seed: 8,  drawn: 24, edges: 39, honest: 'T1 hides', steps: 4, authored: true },   /* 4 steps + 4 screens PINNED as the station's fe leg (2026-09-10); T1 hides the leg's own neighbours */
  'entity:pantry':   { seed: 72, drawn: 24, edges: 40, honest: 'held back', steps: 24, authored: false },   /* 81 − 9 web files folded into their hooks (2026-09-10); the 24 drawn are a different set now, and carry 40 relations among themselves (was 35) */
  'commit:a99719f3': { seed: 65, drawn: 24, edges: 13, honest: 'held back', steps: 24, authored: false },
  'test:C250':       { seed: 20, drawn: 20, edges: 15, honest: 'frontend pieces carry no cases',
                       steps: 20, authored: false }
};
const BTN_FLOOR = 6;      /* 2 reach + 3 transport + 1 copy. AMENDED again 2026-09-09: the copy
                             action joins the station link at the head — both are "take this view
                             elsewhere", a third class beside reach and transport. */

const b = await chromium.launch({
  executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--enable-unsafe-swiftshader']
});
const pg = await b.newPage({ viewport: { width: 1400, height: 1000 } });
const errs = [];
const requested = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
pg.on('request', r => requested.push(r.url()));

const settle = async (ms) => {
  await pg.waitForFunction(
    'document.querySelectorAll(".pn-body canvas").length >= 4', { timeout: 40000 }).catch(() => {});
  /* wait for every pane's ONE settle fit rather than a fixed delay — the engine settles in 2-3 s on a
     GPU and ~13 s on swiftshader, and a fixed wait measured an unfitted frame here (2026-09-09) */
  await pg.waitForFunction(
    'window.__probePanes && window.__probePanes.length >= 4 && window.__probePanes.every(function(p){ return p.__fitted; })',
    { timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(ms || 600);
};

console.log('\n== four panes, card size');
await pg.goto('file://' + path.join(here, 'index.html') + '?skin=classic');
await settle();

// 1 · live contexts
const ctx = await pg.evaluate(`(function(){
  var cvs = document.querySelectorAll('.pn-body canvas'), lost = 0;
  cvs.forEach(function(c){ var g = c.getContext('webgl2') || c.getContext('webgl');
    if (!g || g.isContextLost()) lost++; });
  return { n: cvs.length, lost: lost };
})()`);
ok(ctx.n === 4, `four panes must mount four canvases, mounted ${ctx.n}`);
ok(ctx.lost === 0, `${ctx.lost} WebGL contexts were lost`);

// 2 + 3 + 8 · per-pane geometry, scene contents and the resolver baseline
const panes = await pg.evaluate(`(function(){
  var out = [];
  document.querySelectorAll('.pn').forEach(function (wrap, i) {
    var body = wrap.querySelector('.pn-body'), cv = body.querySelector('canvas');
    var r = cv.getBoundingClientRect();
    var G = window.__probePanes[i].Graph, s = window.__probePanes[i].slice;
    // every node the layout placed, projected to screen — the ONLY honest test of the camera fit
    var inside = 0, outside = 0, pts = [];
    (window.__probePanes[i].__nodes || []).forEach(function (n) {
      if (typeof n.x !== 'number') return;
      var p = G.graph2ScreenCoords(n.x, n.y, n.z || 0);
      pts.push(p);
      var ok = p.x >= -2 && p.x <= r.width + 2 && p.y >= -2 && p.y <= r.height + 2;
      ok ? inside++ : outside++;
    });
    // how much of the viewport the drawn field actually uses — a fit that frames nothing fails
    var xs = pts.map(function(p){return p.x;}), ys = pts.map(function(p){return p.y;});
    var span = pts.length ? Math.max((Math.max.apply(null,xs)-Math.min.apply(null,xs))/r.width,
                                     (Math.max.apply(null,ys)-Math.min.apply(null,ys))/r.height) : 0;
    out.push({
      subject: s.subject.scope + ':' + s.subject.id,
      drawn: s.stats.drawn, seed: s.stats.seed, edges: s.edges.length,
      honest: s.honest.join(' | '),
      footHonest: wrap.querySelector('.pn-honest').textContent.trim(),
      nodesPlaced: (window.__probePanes[i].__nodes||[]).length,
      inside: inside, outside: outside, span: Math.round(span * 100) / 100,
      btns: wrap.querySelectorAll('button').length,
      links: wrap.querySelectorAll('a').length,
      steps: (s.steps || []).length,
      authored: !!((s.steps || [])[0] || {}).authored,
      railRows: wrap.querySelectorAll('.pn-step').length,
      railHead: (wrap.querySelector('.pn-railhead') || {}).textContent || '',
      transport: wrap.querySelectorAll('.pn-transport button').length,
      w: Math.round(r.width), h: Math.round(r.height)
    });
  });
  return out;
})()`);

panes.forEach(p => {
  const bl = BASELINE[p.subject];
  ok(!!bl, `unexpected subject ${p.subject}`);
  if (bl) {
    ok(p.seed === bl.seed, `${p.subject} — seed ${p.seed}, measured ${bl.seed}`);
    ok(p.drawn === bl.drawn, `${p.subject} — drawn ${p.drawn}, measured ${bl.drawn}`);
    ok(p.edges === bl.edges, `${p.subject} — ${p.edges} resolved relations, measured ${bl.edges}`);
    if (bl.honest) {
      ok(p.honest.includes(bl.honest), `${p.subject} — honest line lost "${bl.honest}": "${p.honest}"`);
    } else {
      ok(p.honest === '', `${p.subject} — unexpected honest line "${p.honest}"`);
    }
    // 11 · the walk: the right number of steps, from the right SOURCE
    ok(p.steps === bl.steps, `${p.subject} — ${p.steps} steps, measured ${bl.steps}`);
    ok(p.authored === bl.authored,
      `${p.subject} — authored=${p.authored}, measured ${bl.authored}`);
    ok(p.railRows === p.steps,
      `${p.subject} — the rail shows ${p.railRows} rows for ${p.steps} steps; a step must never be skipped`);
    ok(p.railHead.trim() === (bl.authored ? 'authored' : 'derived order'),
      `${p.subject} — the rail must name whose order it is; head reads "${p.railHead}"`);
    ok(p.transport === 3, `${p.subject} — the transport is home/prev/next, found ${p.transport}`);
  }
  // 2 · every resolved piece is a placed node
  ok(p.nodesPlaced === p.drawn,
    `${p.subject} — the layout placed ${p.nodesPlaced} nodes, the resolver said ${p.drawn}`);
  // 3 · THE FIT. Nothing outside the box, and the field fills a real share of it.
  ok(p.outside === 0, `${p.subject} — ${p.outside} pieces project OUTSIDE the viewport (fit too close)`);
  ok(p.span >= 0.45,
    `${p.subject} — the drawn field spans only ${p.span} of the viewport (fit too far; must be >= 0.45)`);
  ok(p.span <= 1.0, `${p.subject} — the field spans ${p.span} of the viewport, so it is clipped`);
  // 7 · the chrome floor
  ok(p.btns === BTN_FLOOR,
    `${p.subject} — the frame carries ${p.btns} buttons; the amended floor is ${BTN_FLOOR}`);
  ok(p.links === 1, `${p.subject} — the frame carries ${p.links} links; the ruled floor is 1`);
  // the honest line is the resolver's, verbatim
  const want = p.honest ? p.honest.split(' | ').join('  ·  ') : 'complete — nothing held back';
  ok(p.footHonest === want, `${p.subject} — foot honest drifted:\n     got  ${p.footHonest}\n     want ${want}`);
});

// 4 · a click on a REAL node names THAT node; the background clears it
const hit = await pg.evaluate(`(function(){
  var pane = window.__probePanes[1], G = pane.Graph;   /* index 1 = the entity pane */
  var cv = pane.host.querySelector('canvas'), r = cv.getBoundingClientRect();
  // the most-wired node, so the pick is not a coin flip against a neighbour
  var best = null, bd = -1;
  pane.__nodes.forEach(function(n){ if ((n.m.mass||0) > bd) { bd = n.m.mass||0; best = n; } });
  var p = G.graph2ScreenCoords(best.x, best.y, best.z||0);
  return { x: Math.round(r.left + p.x), y: Math.round(r.top + p.y), label: best.__full, kind: best.__kind };
})()`);
await pg.mouse.click(hit.x, hit.y);
await pg.waitForTimeout(500);
const readAfter = await pg.evaluate(`document.querySelectorAll('.pn-read')[1].textContent.trim()`);
ok(readAfter.includes(hit.label),
  `a click on "${hit.label}" must name it in the detail line; got "${readAfter}"`);
ok(readAfter.includes(hit.kind), `the detail line must carry the kind "${hit.kind}"; got "${readAfter}"`);

const selRing = await pg.evaluate(`!!window.__probePanes[1].selObj`);
ok(selRing, 'a selected piece must wear the selection ring');

await pg.evaluate(`(function(){
  var pane = window.__probePanes[1], cv = pane.host.querySelector('canvas');
  var r = cv.getBoundingClientRect();
  return { x: r.left + 6, y: r.top + 6 };
})()`).then(async c => { await pg.mouse.click(c.x, c.y); });
await pg.waitForTimeout(400);
const readCleared = await pg.evaluate(`document.querySelectorAll('.pn-read')[1].textContent.trim()`);
ok(/click a piece/.test(readCleared), `a background click must clear the detail line; got "${readCleared}"`);

// 5 · a drag ORBITS, and the subject is untouched by it
const before = await pg.evaluate(`(function(){ var c = window.__probePanes[1].Graph.cameraPosition();
  return {x: Math.round(c.x), y: Math.round(c.y), z: Math.round(c.z),
          subj: window.__probePanes[1].slice.subject.id}; })()`);
const box = await pg.evaluate(`(function(){ var r = window.__probePanes[1].host.getBoundingClientRect();
  return {cx: Math.round(r.left + r.width/2), cy: Math.round(r.top + r.height/2)}; })()`);
await pg.mouse.move(box.cx, box.cy);
await pg.mouse.down();
await pg.mouse.move(box.cx + 90, box.cy + 40, { steps: 12 });
await pg.mouse.up();
await pg.waitForTimeout(500);
const after = await pg.evaluate(`(function(){ var c = window.__probePanes[1].Graph.cameraPosition();
  return {x: Math.round(c.x), y: Math.round(c.y), z: Math.round(c.z),
          subj: window.__probePanes[1].slice.subject.id}; })()`);
const moved = Math.abs(after.x - before.x) + Math.abs(after.y - before.y) + Math.abs(after.z - before.z);
ok(moved > 5, `a drag must orbit the camera; it moved ${moved} units`);
ok(after.subj === before.subj,
  `a drag must never change the pane's subject (${before.subj} -> ${after.subj})`);

// 6 · the hop control widens the neighbourhood, and the honest line follows
const hop = await pg.evaluate(`(function(){
  var wrap = document.querySelectorAll('.pn')[1];
  var b2 = wrap.querySelectorAll('.pn-hops button')[1];
  var was = window.__probePanes[1].slice.stats.drawn;
  b2.click();
  return { was: was };
})()`);
await pg.waitForTimeout(2500);
const hopAfter = await pg.evaluate(`(function(){
  var p = window.__probePanes[1];
  return { hops: p.hops, cand: p.slice.stats.candidates,
           honest: document.querySelectorAll('.pn-honest')[1].textContent.trim() };
})()`);
ok(hopAfter.hops === 2, `the hop control must reach depth 2; it is at ${hopAfter.hops}`);
ok(hopAfter.cand > BASELINE['entity:pantry'].seed,
  `hop 2 must widen the candidate set past ${BASELINE['entity:pantry'].seed}; got ${hopAfter.cand}`);
ok(/held back/.test(hopAfter.honest), `hop 2 on pantry is always capped, so the honest line must say so`);

// 11 · THE WALK on the journey pane (index 0)
await pg.goto('file://' + path.join(here, 'index.html') + '?skin=classic');
await settle();

const walk = await pg.evaluate(`(function(){
  var p = window.__probePanes[0];
  return { steps: p.slice.steps.map(function(s){ return s.label; }), cursor: p.step };
})()`);
ok(walk.cursor === -1, `a fresh pane must start with no step selected; cursor is ${walk.cursor}`);

await pg.evaluate(`document.querySelectorAll('.pn-transport .t-next')[0].click()`);
await pg.waitForTimeout(900);
const w1 = await pg.evaluate(`(function(){
  var p = window.__probePanes[0];
  return { cursor: p.step, read: document.querySelectorAll('.pn-read')[0].textContent.trim(),
           on: (document.querySelectorAll('.pn')[0].querySelector('.pn-step.on')||{}).textContent||'' };
})()`);
ok(w1.cursor === 0, `the first next must land on step 1; cursor is ${w1.cursor}`);
ok(w1.read.includes(walk.steps[0]),
  `step 1 must name "${walk.steps[0]}" in the detail line; got "${w1.read}"`);
ok(w1.on.includes(walk.steps[0]), `the rail must highlight the current step; highlighted "${w1.on}"`);

await pg.evaluate(`document.querySelectorAll('.pn-transport .t-next')[0].click()`);
await pg.waitForTimeout(900);
const w2 = await pg.evaluate(`(function(){
  var p = window.__probePanes[0];
  return { cursor: p.step, read: document.querySelectorAll('.pn-read')[0].textContent.trim(),
           cam: p.Graph.cameraPosition() };
})()`);
ok(w2.cursor === 1, `next must advance to step 2; cursor is ${w2.cursor}`);
ok(w2.read.includes(walk.steps[1]),
  `step 2 must name "${walk.steps[1]}"; got "${w2.read}"`);

await pg.evaluate(`document.querySelectorAll('.pn-transport .t-home')[0].click()`);
await pg.waitForTimeout(900);
const w3 = await pg.evaluate(`(function(){
  var p = window.__probePanes[0];
  return { cursor: p.step, read: document.querySelectorAll('.pn-read')[0].textContent.trim(),
           homeDisabled: document.querySelectorAll('.pn-transport .t-home')[0].disabled,
           prevDisabled: document.querySelectorAll('.pn-transport .t-prev')[0].disabled };
})()`);
ok(w3.cursor === 0, `home must return to step 1; cursor is ${w3.cursor}`);
ok(w3.read.includes(walk.steps[0]), `home must re-name step 1; got "${w3.read}"`);
ok(w3.homeDisabled && w3.prevDisabled,
  'at step 1 home and prev must be disabled, so the transport cannot lie about where you are');

// THE SEED HAS FIRST CLAIM — every authored step of every curated journey survives the budget.
// Before the two-tier cap, the per-kind quota starved a journey's own endpoints and the rail
// struck them through as if the map had never drawn them (probe catch, 2026-09-09).
const allJourneys = await pg.evaluate(`(function(){
  var ix = window.GabeSlice.index(window.GABE_C4, window.GABE_COMMITS, window.GABE_WORKFLOWS);
  var worst = null, n = 0;
  window.GABE_WORKFLOWS.forEach(function (w) {
    var s = window.GabeSlice.resolve(ix, {scope:'journey', id:w.name, hops:2, budget:24});
    var bad = s.steps.filter(function(x){ return x.held || x.missing; }).length;
    n++;
    if (bad && !worst) worst = { name: w.name, bad: bad };
  });
  return { n: n, worst: worst };
})()`);
ok(allJourneys.n === 16, `the example carries 16 curated journeys; found ${allJourneys.n}`);
ok(!allJourneys.worst,
  `every authored step must survive the budget; "${(allJourneys.worst||{}).name}" lost ` +
  `${(allJourneys.worst||{}).bad}`);

// HELD and MISSING are different failures and must not wear one mark. Squeeze the budget below
// the step count: the steps that do not fit are `held` (the budget), never `missing` (the map).
const squeezed = await pg.evaluate(`(function(){
  var ix = window.GabeSlice.index(window.GABE_C4, window.GABE_COMMITS, window.GABE_WORKFLOWS);
  var s = window.GabeSlice.resolve(ix, {scope:'journey', id:'Filter recipes', hops:2, budget:4});
  return { drawn: s.stats.drawn,
           held: s.steps.filter(function(x){return x.held;}).length,
           missing: s.steps.filter(function(x){return x.missing;}).length,
           honest: s.honest.join(' | ') };
})()`);
ok(squeezed.held === 1, `a 5-step journey at budget 4 must hold 1 step back; held ${squeezed.held}`);
ok(squeezed.missing === 0,
  `a held step is NOT a missing one — the map drew all 5; missing reads ${squeezed.missing}`);
ok(/no room beside the subject/.test(squeezed.honest),
  `the neighbourhood must be dropped out loud when the subject fills the budget; got "${squeezed.honest}"`);
ok(/of the subject/.test(squeezed.honest),
  `the honest line must say the cut fell on the SUBJECT's own pieces; got "${squeezed.honest}"`);

// 12 · the control grammar
const controls = await pg.evaluate(`(function(){
  var w = document.querySelectorAll('.pn')[0];
  var tb = w.querySelectorAll('.pn-transport button');
  var hb = w.querySelectorAll('.pn-hops button');
  return {
    order: Array.prototype.map.call(tb, function(b){ return b.dataset.t; }),
    icons: Array.prototype.filter.call(tb, function(b){ return b.querySelector('svg'); }).length,
    text:  Array.prototype.filter.call(tb, function(b){ return b.textContent.trim().length; }).length,
    hopsOnPicture: !!w.querySelector('.pn-view > .pn-hops'),
    hopsInFoot: !!w.querySelector('.pn-foot .pn-hops'),
    hopLabels: Array.prototype.map.call(hb, function(b){ return b.textContent.trim(); }),
    hopTips: Array.prototype.map.call(hb, function(b){ return b.title; }),
    footKids: w.querySelector('.pn-foot').children.length
  };
})()`);
ok(controls.order.join(',') === 'prev,home,next',
  `the transport must read prev - HOME - next; got ${controls.order.join(',')}`);
ok(controls.icons === 3, `all three transport buttons must be drawn icons; ${controls.icons} carry an svg`);
ok(controls.text === 0,
  `a transport button must not be a text character; ${controls.text} still carry text`);
ok(controls.hopsOnPicture && !controls.hopsInFoot,
  'the reach control belongs on the picture it changes, not in the foot');
ok(controls.footKids === 1, `the foot carries the honest line alone; it has ${controls.footKids} children`);
ok(controls.hopLabels.join('|') === 'subject|+1 hop',
  `the two reach states must be readable as words; got "${controls.hopLabels.join('|')}"`);
ok(controls.hopTips[0] !== controls.hopTips[1] &&
   /SUBJECT ONLY/.test(controls.hopTips[0]) && /ONE RELATION OUT/.test(controls.hopTips[1]),
  'each reach state must explain itself, and differently from the other');

// 13 · the highlight, measured on the live materials
const hl = await pg.evaluate(`(function(){
  var pane = window.__probePanes[1];
  function opacityRatio(n){
    var o = n.__threeObj, min = 1;
    if (!o) return 1;
    o.traverse(function(c){
      if (c.material && c.material.__baseOp) {
        min = Math.min(min, c.material.opacity / c.material.__baseOp);
      }
    });
    return min;
  }
  var best = null, bd = -1;
  pane.__nodes.forEach(function(n){ if ((n.m.mass||0) > bd) { bd = n.m.mass||0; best = n; } });

  pane.Graph.onNodeClick()(best);
  var set = pane.hl.set || {};
  var wrongLit = 0, wrongDim = 0;
  pane.__nodes.forEach(function(n){
    var inSet = set[n.id] !== undefined, r = opacityRatio(n);
    if (inSet && r < 0.9) wrongLit++;
    if (!inSet && r > 0.5) wrongDim++;
  });
  var depths = Object.keys(set).map(function(k){ return set[k]; });
  var after = { setSize: Object.keys(set).length, maxDepth: Math.max.apply(null, depths),
                litLinks: Object.keys(pane.hl.links||{}).length,
                wrongLit: wrongLit, wrongDim: wrongDim,
                dimmed: pane.__nodes.filter(function(n){ return opacityRatio(n) < 0.5; }).length,
                ring: !!pane.selObj };

  // every lit wire must have BOTH ends in the set — the station's law, not "touches the origin"
  var badWire = 0;
  Object.keys(pane.hl.links).forEach(function(k){
    var p = k.split('||');
    if (set[p[0]] === undefined || set[p[1]] === undefined) badWire++;
  });
  after.badWire = badWire;

  // and the neighbours must be REAL neighbours of the origin
  var adjOK = true;
  Object.keys(set).forEach(function(id){
    if (id === best.id) return;
    var joined = pane.__links.some(function(l){
      var a=(l.source&&l.source.id)||l.source, b=(l.target&&l.target.id)||l.target;
      return (a===best.id&&b===id)||(b===best.id&&a===id);
    });
    if (!joined) adjOK = false;
  });
  after.adjOK = adjOK;
  after.origin = best.id;

  // clearing must restore EVERY material to its own base
  pane.Graph.onBackgroundClick()();
  after.afterClear = pane.__nodes.filter(function(n){ return opacityRatio(n) < 0.999; }).length;
  after.hlOff = !pane.hl.on;
  return after;
})()`);
ok(hl.setSize > 1, `a click must light more than the piece itself; the set holds ${hl.setSize}`);
ok(hl.maxDepth === 1,
  `the lit set is the IMMEDIATE neighbourhood — the station's depth 1; this one reached ${hl.maxDepth}`);
ok(hl.adjOK, 'every lit piece must be a real neighbour of the clicked one');
ok(hl.badWire === 0,
  `${hl.badWire} lit wires have an end outside the set; the law is BOTH ends in (_hlCompute)`);
ok(hl.wrongLit === 0, `${hl.wrongLit} pieces in the lit set are dimmed`);
ok(hl.wrongDim === 0, `${hl.wrongDim} pieces outside the set are still at full opacity`);
ok(hl.dimmed > 0, 'a highlight that dims nothing is not a highlight');
ok(hl.ring, 'the clicked piece wears the selection ring');
ok(hl.afterClear === 0,
  `a background click must restore every material; ${hl.afterClear} pieces stayed dimmed`);
ok(hl.hlOff, 'a background click must clear the highlight state');

// 14 · the view payload
const pay = await pg.evaluate(`(function(){
  var p = window.__probePanes[0];
  p.stepTo(2);
  var d = GabePane.viewPayload(p);
  var head = document.querySelectorAll('.pn')[0].querySelector('.pn-head');
  return { d: d, headBtns: head.querySelectorAll('button').length,
           headLinks: head.querySelectorAll('a').length,
           json: JSON.stringify(d) };
})()`);
ok(pay.d.gabe === 'pane-view' && pay.d.v === 1, 'the payload must identify itself and its version');
ok(pay.d.scope === 'journey' && pay.d.id === 'Store ingredients — add to the pantry',
  `the payload must carry the subject; got ${pay.d.scope}:${pay.d.id}`);
ok(pay.d.sel === 'endpoint:PATCH /pantry/items/{item_id}',
  `the payload must carry the SELECTED NODE ID; got "${pay.d.sel}"`);
ok(pay.d.focus === true, 'the focus flag must ride along — the station opens focused');
ok(pay.d.head === '8356f531', `the payload must name the map it came from; got "${pay.d.head}"`);
ok(pay.d.step && pay.d.step.label === 'PATCH /pantry/items/{item_id}',
  'the step label rides as a human echo');
ok(pay.json.length < 400, `the payload must stay pasteable; it is ${pay.json.length} chars`);
ok(pay.d.tier === 1, `the payload carries the pane's TIER (the station boots at T1); got ${pay.d.tier}`);

// 14b · the tier: the station's OWN preset table, applied by the resolver — pantry at T0 loses its 43
//       schemas + 1 external (Skeleton = doors, tables, screens); at T1 it is whole. Hidden-by-tier is
//       counted apart from held-by-budget.
const tr = await pg.evaluate(`(function(){
  var ix = window.__probePanes[0].opt.ix, TP = (window.GabeUniTiers||{}).PRESETS || [];
  var t0 = GabeSlice.resolve(ix, {scope:'entity', id:'pantry', tier:0, budget:200});
  var t1 = GabeSlice.resolve(ix, {scope:'entity', id:'pantry', tier:1, budget:200});
  var j0 = GabeSlice.resolve(ix, {scope:'journey', id:'Store ingredients \u2014 add to the pantry', tier:0, budget:200});
  return { presets: TP.length, names: TP.map(function(p){ return p.name; }).join(','),
           d0: t0.nodes.length, hid0: t0.stats.tierHid, held0: t0.stats.held, honest0: t0.honest.join(' | '),
           d1: t1.nodes.length, hid1: Object.keys(t1.stats.tierHid).length,
           jSteps: j0.steps.filter(function(s){ return s.authored && s.node; }).length, jTotal: j0.steps.length };
})()`);
ok(tr.presets === 4 && tr.names === 'Skeleton,Surface,Trace,Everything', `the tier table is the station's four presets; got ${tr.names}`);
ok(tr.d0 === 28 && tr.hid0.schema === 43 && tr.hid0.external === 1, `pantry at T0 draws 28 (schemas + external hidden; 9 web files folded); drew ${tr.d0}, hid ${JSON.stringify(tr.hid0)}`);
ok(Object.keys(tr.held0 || {}).length === 0, `hidden-by-tier is never counted as held-by-budget; held ${JSON.stringify(tr.held0)}`);
ok(/T0 hides 43 schema/.test(tr.honest0), `the honest line names what the tier hid; reads "${tr.honest0}"`);
ok(tr.d1 === 72 && tr.hid1 === 0, `pantry at T1 is whole (72 — the 9 web files fold into fe·pantry/shopping hooks); drew ${tr.d1}`);
/* THE FOLD (2026-09-10): the station absorbs every fetching FILE into the hook that fetches (:1356-1359);
   the pane must show the same picture — no globe where a hook exists, bridges landing on the export */
const fold = await pg.evaluate(`(function(){
  var ix = window.__ix || GabeSlice.index(window.GABE_C4, window.GABE_COMMITS || [], window.GABE_WORKFLOWS || []);
  var pan = GabeSlice.resolve(ix, {scope:'entity', id:'pantry', tier:3, budget:400});
  var webs = pan.nodes.filter(function(n){ return n.kind === 'web'; }).length;
  var abs = (ix.ents.pantry.absorbed || []);
  var allWeb = 0, left = 0; Object.keys(ix.c4.l2).forEach(function(s){ (ix.c4.l2[s].nodes||[]).forEach(function(n){ if(n.kind==='web'){ allWeb++; if(ix.node[n.id]) left++; } }); });
  var hop = GabeSlice.resolve(ix, {scope:'entity', id:'pantry', hops:2, tier:3, budget:600});
  var bridges = hop.edges.filter(function(e){ return e.kind === 'bridge'; });
  var fromHook = bridges.filter(function(e){ var n = ix.node[e.a]; return n && (n.kind === 'hook' || n.kind === 'component'); }).length;
  return { webs: webs, absorbed: abs.length, into: abs.map(function(a){ return a.into.split('#').pop(); }).slice(0,4).join(','), allWeb: allWeb, left: left,
           bridges: bridges.length, fromHook: fromHook, honest: pan.honest.join(' | ') };
})()`);
ok(fold.webs === 0 && fold.absorbed === 9, `pantry draws no globe: ${fold.absorbed} web files folded (${fold.into}…), ${fold.webs} left`);
ok(fold.allWeb === 33 && fold.left === 0, `feed-wide every web file has an absorbing piece (${fold.allWeb} files, ${fold.left} unclaimed) — the station's stats.fe.screens_absorbed`);
ok(fold.bridges > 0 && fold.fromHook === fold.bridges, `every bridge in pantry's +1 hop lands on a HOOK, not a file (${fold.fromHook}/${fold.bridges})`);
ok(/9 fetching files fold into the hooks that fetch/.test(fold.honest), `the honest line names the fold; reads "${fold.honest}"`);
ok(tr.jSteps === tr.jTotal, `a journey's authored steps are PINNED through the tier like the station's walk (${tr.jSteps}/${tr.jTotal})`);
ok(pay.headBtns === 1 && pay.headLinks === 1,
  `the head carries the two "take this elsewhere" actions; got ${pay.headBtns} + ${pay.headLinks}`);

// 9 · the fleet assets are never fetched
ok(!requested.some(u => /chip-assets\.js/.test(u)),
  'a pane must never load chip-assets.js (2.7 MB of station-only fleet models)');
ok(requested.some(u => /3d-bundle\.js/.test(u)), 'the 3d bundle must load');

// 7b · the chrome floor holds at every size
for (const size of ['panel', 'wide']) {
  await pg.goto('file://' + path.join(here, 'index.html') + '?skin=classic&size=' + size);
  await settle(12000);
  const c = await pg.evaluate(`(function(){
    var out = { btns: [], links: [], outside: 0, spans: [] };
    document.querySelectorAll('.pn').forEach(function (w, i) {
      out.btns.push(w.querySelectorAll('button').length);
      out.links.push(w.querySelectorAll('a').length);
      var pane = window.__probePanes[i], G = pane.Graph;
      var r = pane.host.querySelector('canvas').getBoundingClientRect();
      var xs = [], ys = [];
      (pane.__nodes || []).forEach(function (n) {
        if (typeof n.x !== 'number') return;
        var p = G.graph2ScreenCoords(n.x, n.y, n.z || 0);
        xs.push(p.x); ys.push(p.y);
        if (p.x < -2 || p.x > r.width + 2 || p.y < -2 || p.y > r.height + 2) out.outside++;
      });
      out.spans.push(xs.length ? Math.round(Math.max(
        (Math.max.apply(null,xs)-Math.min.apply(null,xs))/r.width,
        (Math.max.apply(null,ys)-Math.min.apply(null,ys))/r.height) * 100) / 100 : 0);
    });
    return out;
  })()`);
  ok(c.btns.every(n => n === BTN_FLOOR),
    `@${size} — buttons per frame ${c.btns.join(',')}; the floor is ${BTN_FLOOR}`);
  ok(c.links.every(n => n === 1), `@${size} — links per frame ${c.links.join(',')}; the floor is 1`);
  ok(c.outside === 0, `@${size} — ${c.outside} pieces project outside their viewport`);
  ok(c.spans.every(s => s >= 0.45 && s <= 1.0),
    `@${size} — field spans ${c.spans.join(', ')}; each must sit in [0.45, 1.0]`);
}

// 10 · no console error anywhere
ok(errs.length === 0, 'console errors: ' + errs.slice(0, 3).join(' | '));

await b.close();
console.log(`\n${P} passed · ${F} failed`);
process.exit(F ? 1 : 0);
