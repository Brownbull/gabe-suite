// embed-graph SPIKE PROBE — the render proof for the six-layout bake-off.
//
// A spike folder whose pages merely LOAD teaches nothing: the lesson of the universe render bug
// (memory: universe-render-bug-forcegraph) is that headless-green is not proof, and a bare `>0`
// assert accepts a broken picture. So every assert below measures the thing it claims:
//
//   1  every layout draws exactly slice.stats.drawn node groups          (per scope, per size)
//      — except F, whose focus subset must CONSERVE: drawn + its chip counts = every resolved piece
//   2  every relation with both ends drawn is painted                    (D paints none, by design,
//      and must still carry the invisible markers the shell's focus reads)
//   3  the honest line is the resolver's honest[], verbatim, never a summary of it
//   4  hover dims the non-neighbours and leaves the neighbours lit       (the shell's generic focus)
//   5  the two controls are the ONLY buttons inside the frame            (the chrome floor, enforced)
//   6  a re-render of the same subject is byte-identical                 (no settle, no jitter)
//   7  the commit scope resolves every touched id the feed can place     (0 unplaceable in gustify)
//   8  no console error on any page
//  10  NOTHING IS CLIPPED. Every drawn node sits inside the picture box. The element-count asserts
//      all passed while A and C were spilling chips past the bottom of the body (caught by eye on
//      a screenshot, 2026-09-08) — a clipped piece is still in the DOM, so counting the DOM is
//      exactly the proxy the universe-render-bug lesson warns about.
//   9  the RESOLVER is pinned to measured baselines, not to itself. Asserts 1-3 compare the frame
//      against the live resolver, so a resolver that stops reporting what it held back moves both
//      sides together and stays green (proven: mutant 1, 2026-09-08). The table below is read off
//      the frozen feed by hand, so a change in the cap law, the hop walk or the feed FAILS here.
//
// RETIRED 2026-09-08: this battery guards the 2D attempt, kept because its findings (F1 wire
// density, F5 conservation, F7 clipping) hold for the 3D pane too. Run from THIS directory.
// Engine: the machine-bound playwright cache the station probes already use.
//   node probe.mjs            all six layouts + the index
//   node probe.mjs C          one layout
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const _PWBASE = process.env.GABE_PW_DIR || '/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/';
const require = createRequire(_PWBASE.replace(/\/?$/, '/') + 'x.js');
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
let P = 0, F = 0;
const ok = (c, m) => { if (c) { P++; } else { F++; console.log('  FAIL: ' + m); } };

const PAGES = {
  A: 'a-column-strip', B: 'b-radial-ring', C: 'c-lane-flow',
  D: 'd-adjacency-tile', E: 'e-sparkgraph', F: 'f-focus-context'
};
const NO_VISIBLE_WIRES = { D: true };          // D moves coupling into the hover, on purpose
// F draws a FOCUS SUBSET on purpose and turns the remainder into countable chips, so it gets its
// own law: drawn + the chip counts must account for every resolved node, exactly. That is a
// stricter assert than "drew them all", because it catches a piece that is neither shown nor
// counted — the silent-drop failure this whole folder exists to prevent.
const FOCUS_SUBSET = { F: { inline: 3, card: 5, panel: 9 } };

const pick = (process.argv[2] || '').toUpperCase();
const letters = pick ? [pick] : Object.keys(PAGES);

const SUBJECTS = [
  { scope: 'entity', id: 'pantry' },
  { scope: 'entity', id: 'recipe' },           // the worst case: 98 pieces, 46 of one kind
  { scope: 'commit', id: 'fed71a2b' },
  { scope: 'test',   id: 'C250' }
];
const SIZES = ['inline', 'card', 'panel'];

const b = await chromium.launch({
  executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable'
});
const pg = await b.newPage({ viewport: { width: 1440, height: 950 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push(String(e)));

const drawn = async () => pg.evaluate(`(function(){
  var svg = document.querySelector('.emb-body svg');
  if (!svg) return null;
  return {
    nodes: svg.querySelectorAll('[data-n]').length,
    wires: svg.querySelectorAll('path[data-e][stroke]:not([stroke="none"])').length,
    markers: svg.querySelectorAll('[data-e]').length,
    honest: document.querySelector('.emb-honest').textContent.trim(),
    buttons: document.querySelectorAll('.emb button').length,
    links: document.querySelectorAll('.emb a').length,
    ink: svg.innerHTML.length,
    chipSum: Array.prototype.reduce.call(svg.querySelectorAll('text'), function (a, t) {
      var s = (t.textContent || '').trim();
      if (s.charAt(0) !== '+') return a;
      var n = parseInt(s.slice(1), 10);
      return a + (isNaN(n) ? 0 : n);
    }, 0),
    html: svg.innerHTML
  };
})()`);

const sliceOf = async (scope, id, hops, budget) => pg.evaluate(
  `(function(){ var ix = window.__probeIX || (window.__probeIX =
      window.GabeSlice.index(window.GABE_C4, window.GABE_COMMITS));
     var s = window.GabeSlice.resolve(ix, {scope:${JSON.stringify(scope)}, id:${JSON.stringify(id)},
       hops:${hops}, budget:${budget}});
     return {drawn:s.stats.drawn, edges:s.edges.length, honest:s.honest, seed:s.stats.seed,
             candidates:s.stats.candidates}; })()`);

const BUDGET = { inline: 10, card: 24, panel: 60 };

// 9 · measured on gustify c4_head 8356f531, 2026-09-08 — the resolver's own anchor.
//     {scope:id: {size: [candidates, drawn, resolved-edges], honest?: substring}}
//     Column 3 is the RESOLVER's edge count, not the painted count: a layout that draws a subset
//     (F) legitimately paints fewer, and assert 2 already checks the painted number against what
//     that layout drew. Pinning the painted number here would make the baseline layout-dependent.
const BASELINE = {
  'entity:pantry':    { inline: [81, 10, 8],  card: [81, 24, 35], panel: [81, 60, 110],
                        honest: 'held back' },
  'entity:recipe':    { inline: [98, 10, 7],  card: [98, 24, 47], panel: [98, 60, 134],
                        honest: 'held back' },
  'commit:fed71a2b':  { inline: [7, 7, 1],    card: [7, 7, 1],    panel: [7, 7, 1],
                        honest: null },
  'test:C250':        { inline: [20, 10, 8],  card: [20, 20, 15], panel: [20, 20, 15],
                        honest: 'frontend pieces carry no cases' }
};

for (const L of letters) {
  console.log('\n== ' + L + ' · ' + PAGES[L]);
  for (const s of SUBJECTS) {
    for (const size of SIZES) {
      const url = 'file://' + path.join(here, PAGES[L] + '.html') +
        `?scope=${s.scope}&id=${s.id}&size=${size}&hops=1`;
      await pg.goto(url);
      await pg.waitForSelector('.emb-body svg [data-n], .emb-body svg text', { timeout: 6000 }).catch(() => {});
      await pg.waitForTimeout(60);

      const d = await drawn();
      const want = await sliceOf(s.scope, s.id, 1, BUDGET[size]);
      const tag = `${L} ${s.scope}:${s.id} @${size}`;

      // 1 · nodes: every layout draws every resolved node, except F which draws its focus subset
      //     and must ACCOUNT for the remainder in its context chips
      if (FOCUS_SUBSET[L]) {
        const want1 = Math.min(FOCUS_SUBSET[L][size], want.drawn);
        ok(d && d.nodes === want1,
          `${tag} — F must draw ${want1} focus blocks, drew ${d ? d.nodes : 'null'}`);
        if (size !== 'inline') {                 // inline drops the chip row: nothing to conserve
          ok(d.chipSum + d.nodes === want.drawn,
            `${tag} — F loses pieces: ${d.nodes} drawn + ${d.chipSum} counted = ` +
            `${d.chipSum + d.nodes}, resolver said ${want.drawn}`);
        }
      } else {
        ok(d && d.nodes === want.drawn,
          `${tag} — drew ${d ? d.nodes : 'null'} node groups, resolver said ${want.drawn}`);
      }

      // 2 · wires: the law is "every relation whose BOTH ends are drawn is painted" — which holds
      //     for a full layout and for F's subset alike. D paints none and keeps invisible markers.
      const wantWires = await pg.evaluate(`(function(){
        var svg = document.querySelector('.emb-body svg'), on = {};
        svg.querySelectorAll('[data-n]').forEach(function(n){ on[n.getAttribute('data-n')] = 1; });
        var ix = window.__probeIX || (window.__probeIX =
          window.GabeSlice.index(window.GABE_C4, window.GABE_COMMITS));
        var s = window.GabeSlice.resolve(ix, {scope:${JSON.stringify(s.scope)},
          id:${JSON.stringify(s.id)}, hops:1, budget:${BUDGET[size]}});
        return s.edges.filter(function(e){ return on[e.a] && on[e.b]; }).length;
      })()`);
      if (NO_VISIBLE_WIRES[L]) {
        ok(d.wires === 0, `${tag} — D must paint no wires, painted ${d.wires}`);
        ok(d.markers === want.edges,
          `${tag} — D must still carry ${want.edges} invisible relation markers, carries ${d.markers}`);
      } else {
        ok(d.wires === wantWires,
          `${tag} — painted ${d.wires} wires, ${wantWires} relations have both ends drawn`);
      }

      // 9 · the resolver against its measured baseline — the assert a resolver mutation cannot dodge
      const bl = BASELINE[s.scope + ':' + s.id];
      if (bl && bl[size]) {
        ok(want.candidates === bl[size][0],
          `${tag} — resolver drift: ${want.candidates} candidates, measured ${bl[size][0]}`);
        ok(want.drawn === bl[size][1],
          `${tag} — resolver drift: drew ${want.drawn}, measured ${bl[size][1]}`);
        ok(want.edges === bl[size][2],
          `${tag} — resolver drift: ${want.edges} resolved relations, measured ${bl[size][2]}`);
        const joined = want.honest.join(' | ');
        if (bl.honest) {
          ok(joined.indexOf(bl.honest) >= 0,
            `${tag} — the honest line lost "${bl.honest}"; got "${joined || '(none)'}"`);
        } else {
          ok(want.honest.length === 0, `${tag} — unexpected honest line: "${joined}"`);
        }
      }

      // 10 · nothing drawn falls outside the picture box
      const spill = await pg.evaluate(`(function(){
        var svg = document.querySelector('.emb-body svg');
        var box = svg.getBoundingClientRect(), out = [];
        svg.querySelectorAll('[data-n]').forEach(function (n) {
          var r = n.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.top < box.top - 1 || r.bottom > box.bottom + 1 ||
              r.left < box.left - 1 || r.right > box.right + 1) {
            out.push(n.getAttribute('data-n'));
          }
        });
        return out;
      })()`);
      ok(spill.length === 0,
        `${tag} — ${spill.length} pieces drawn outside the box: ${spill.slice(0, 2).join(', ')}`);

      // 3 · the honest line is the resolver's, verbatim
      const expect = want.honest.length ? want.honest.join('  ·  ') : 'complete — nothing held back';
      ok(d.honest === expect, `${tag} — honest line drifted:\n     got  ${d.honest}\n     want ${expect}`);

      // 5 · the chrome floor: two hop buttons and one station link inside the frame, nothing else
      ok(d.buttons === 2, `${tag} — the frame carries ${d.buttons} buttons; the ruled floor is 2`);
      ok(d.links === 1, `${tag} — the frame carries ${d.links} links; the ruled floor is 1`);

      // 6 · determinism: the same subject re-rendered is byte-identical
      if (size === 'card') {
        await pg.goto(url);
        await pg.waitForTimeout(80);
        const again = await drawn();
        ok(again.html === d.html, `${tag} — re-render differs; the layout is not deterministic`);
      }
    }
  }

  // 4 · hover focus — the shell's generic dimming, proven on a real pointer move
  const hurl = 'file://' + path.join(here, PAGES[L] + '.html') + '?scope=entity&id=pantry&size=panel&hops=1';
  await pg.goto(hurl);
  await pg.waitForTimeout(120);
  const focus = await pg.evaluate(`(function(){
    var svg = document.querySelector('.emb-body svg');
    var ns = svg.querySelectorAll('[data-n]');
    if (!ns.length) return null;
    // pick the node with the most relations, so 'some dim, some lit' is actually achievable
    var best = null, bestN = -1;
    ns.forEach(function(n){
      var id = n.getAttribute('data-n'), c = 0;
      svg.querySelectorAll('[data-e]').forEach(function(e){
        var p = e.getAttribute('data-e').split('||');
        if (p[0] === id || p[1] === id) c++;
      });
      if (c > bestN) { bestN = c; best = n; }
    });
    best.dispatchEvent(new MouseEvent('mouseenter', {bubbles:true}));
    var dim = 0, lit = 0;
    svg.querySelectorAll('[data-n]').forEach(function(n){
      n.classList.contains('dimmed') ? dim++ : lit++;
    });
    var read = document.querySelector('.emb-read');
    var on = read.className.indexOf('on') >= 0 && read.textContent.length > 2;
    best.dispatchEvent(new MouseEvent('mouseleave', {bubbles:true}));
    var after = svg.querySelectorAll('[data-n].dimmed').length;
    return {deg: bestN, dim: dim, lit: lit, read: on, cleared: after};
  })()`);
  ok(focus && focus.read, `${L} — hover must fill the readout`);
  ok(focus && focus.dim > 0, `${L} — hover must dim the non-neighbours (dimmed ${focus && focus.dim})`);
  ok(focus && focus.lit >= 1, `${L} — the hovered node and its neighbours must stay lit`);
  ok(focus && focus.cleared === 0, `${L} — mouseleave must clear every dim (left ${focus && focus.cleared})`);
}

// 7 · the commit scope places every touched id the feed knows — measured, not assumed
await pg.goto('file://' + path.join(here, 'index.html'));
await pg.waitForTimeout(200);
const commitAudit = await pg.evaluate(`(function(){
  var ix = window.GabeSlice.index(window.GABE_C4, window.GABE_COMMITS);
  var miss = 0, tot = 0, biggest = 0;
  window.GABE_COMMITS.forEach(function(c){
    c.touched.forEach(function(t){ tot++; if(!ix.node[t]) miss++; });
    biggest = Math.max(biggest, c.touched.length);
  });
  return {tot: tot, miss: miss, biggest: biggest, commits: window.GABE_COMMITS.length};
})()`);
ok(commitAudit.miss === 0,
  `commit scope — ${commitAudit.miss} of ${commitAudit.tot} touched ids unplaceable`);
ok(commitAudit.commits === 30 && commitAudit.biggest === 65,
  `commit feed drifted from the measured baseline (30 commits, max 65 touched); got ` +
  `${commitAudit.commits} / ${commitAudit.biggest}`);

// the index mounts all six against one subject
const six = await pg.evaluate(`document.querySelectorAll('.six .emb').length`);
ok(six === 6, `index.html must mount six embeds, mounted ${six}`);

// 8 · no console error anywhere
ok(errs.length === 0, 'console errors: ' + errs.slice(0, 4).join(' | '));

await b.close();
console.log(`\n${P} passed · ${F} failed`);
process.exit(F ? 1 : 0);
