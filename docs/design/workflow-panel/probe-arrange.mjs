/* probe-arrange.mjs — the ARRANGE lab's render proof (headless system Chrome via the spike's
   playwright-core). Same recipe as probe-eplab.mjs / tests/gabe-universe/run.sh §13.

     node docs/design/workflow-panel/probe-arrange.mjs [--shots DIR]

   Every assert measures the DRAWN thing: computed styles, bounding boxes, and counts compared with
   numbers computed from window.LABEP inside the page. A bare `> 0` is not an assert. Exit 1 on any
   failure; SKIP loudly (exit 0) when chrome or playwright-core is missing. */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const PAGE = path.join(HERE, 'arrange-lab.html');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core');
const CHROME = '/usr/bin/google-chrome-stable';
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots') >= 0 ? args[args.indexOf('--shots') + 1] : null;
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) {
  console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)');
  process.exit(0); }
if (shotsAt) fs.mkdirSync(shotsAt, { recursive: true });
const { chromium } = require(PW);

let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra ? ' — ' + extra : '')); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__arrangeReady===true', { timeout: 20000 }).catch(() => {});

// ── 1 · IT BOOTS ────────────────────────────────────────────────────────────────────────
ok(await p.evaluate(() => window.__arrangeReady === true), 'the page boots (window.__arrangeReady)');
ok(errs.length === 0, 'no page errors at boot', errs.slice(0, 3).join(' | '));
const N = await p.evaluate(() => {
  const F = window.LABEP, FM = F.forms, T = window.ARR.TILES;
  return { tiles: T.length, paths: FM.paths.length, exits: FM.exits.length, phases: FM.phases.length,
    controls: T.filter(t => t.nature === 'control').length,
    setters: T.filter(t => t.nature === 'control' && t.sets).length,
    standpoints: T.filter(t => t.nature === 'standpoint').length,
    records: T.filter(t => t.nature === 'record').length,
    readers: T.filter(t => t.reads).length,
    guards: F.security.guards.length, asgi: F.security.asgi.length,
    gateCrossings: FM.paths.reduce((a, x) => a + (x.n.gates || 0), 0),
    matrixLit: window.ARR.matrixLit(),
    firstCut: window.ARR.FIRSTCUT,
    consent: FM.paths.filter(x => x.status === 409 && x.names.drawn.indexOf('consent') >= 0)[0].id,
    consentRolled: FM.paths.filter(x => x.status === 409 && x.names.drawn.indexOf('consent') >= 0)[0].effects.n.rolled_back,
    firstRun: FM.paths.filter(x => x.kind === 'success').sort((a, c) => c.effects.n.committed - a.effects.n.committed)[0].id,
    laneCols: FM.paths.map(x => ({ id: x.id, col: x.kind === 'success' ? FM.phases.length : FM.phases.indexOf(x.phase) })) };
});
ok(N.tiles === 20, 'the registry holds every dimension the brief names, plus the two the model added (20)', String(N.tiles));

// ── 2 · THE SHELF: the mind map AND the fallback list show every tile ───────────────────
{ const nodes = await p.$$eval('.mnode', e => e.map(x => x.dataset.node));
  const items = await p.$$eval('.shitem', e => e.map(x => x.dataset.item));
  ok(nodes.length === N.tiles, 'the map draws one node per tile', nodes.length + ' vs ' + N.tiles);
  ok(items.length === N.tiles, 'the fallback list carries every tile too', items.length + ' vs ' + N.tiles);
  ok(nodes.slice().sort().join() === items.slice().sort().join(), 'map and list name the same dimensions');
  // the fixed layout: the centre really is the centre, controls left of it, standpoints right
  const box = await p.evaluate(() => {
    const at = k => { const e = document.querySelector(`.mnode[data-node="${k}"]`).getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; };
    const T = window.ARR.TILES;
    return { sel: at('selection'),
      control: T.filter(t => t.nature === 'control').map(t => at(t.key)),
      stand: T.filter(t => t.nature === 'standpoint').map(t => ({ k: t.key, ...at(t.key) })),
      rec: T.filter(t => t.nature === 'record').map(t => at(t.key)),
      temporal: T.filter(t => t.nature === 'temporal').map(t => at(t.key)) }; });
  ok(box.control.every(c => c.x < box.sel.x - 60), 'every CONTROL node stands left of the centre', JSON.stringify(box.control.map(c => Math.round(c.x))));
  ok(box.stand.every(c => c.x > box.sel.x + 60), 'every STANDPOINT node stands right of the centre');
  const order = box.stand.map(s => s.k);
  ok(order.join(',') === 'security,functions,data,schemas,tests,widening', 'the standpoints read top to bottom in request order', order.join(','));
  const ys = box.stand.map(s => s.y);
  ok(ys.every((v, i) => i === 0 || v > ys[i - 1]), 'and each one is drawn below the one before it', ys.map(Math.round).join(','));
  ok(box.temporal.every(c => c.y < box.sel.y), 'the TEMPORAL nodes stand above the centre');
  ok(box.rec.every(c => c.y > box.sel.y && c.x > box.sel.x - 40), 'the RECORD nodes stand bottom-right'); }

// ── 3 · THE EDGES: sets = controls + the timeline · reads = standpoints + records ───────
{ const sets = await p.$$eval('line[data-edge="sets"]', e => e.map(x => ({ x1: +x.getAttribute('x1'), y1: +x.getAttribute('y1'), x2: +x.getAttribute('x2'), y2: +x.getAttribute('y2'), col: x.getAttribute('stroke'), m: x.getAttribute('marker-end') })));
  const reads = await p.$$eval('line[data-edge="reads"]', e => e.map(x => ({ x1: +x.getAttribute('x1'), y1: +x.getAttribute('y1'), x2: +x.getAttribute('x2'), y2: +x.getAttribute('y2'), col: x.getAttribute('stroke') })));
  ok(sets.length === N.setters + 1, 'SETS edges = the control tiles that SET the selection + the timeline', sets.length + ' vs ' + (N.setters + 1));
  ok(reads.length === N.standpoints + N.records, 'READS edges = the standpoints + the records', reads.length + ' vs ' + (N.standpoints + N.records));
  const C = await p.evaluate(() => window.ARR.MAPXY.selection);
  const d = (e, x, y) => Math.hypot(e - x, 0) + 0;
  ok(sets.every(e => Math.hypot(e.x2 - C[0], e.y2 - C[1]) < Math.hypot(e.x1 - C[0], e.y1 - C[1])), 'every SETS edge points INTO the centre');
  ok(reads.every(e => Math.hypot(e.x1 - C[0], e.y1 - C[1]) < Math.hypot(e.x2 - C[0], e.y2 - C[1])), 'every READS edge points OUT of the centre');
  const tok = await p.evaluate(() => ({ gate: window.STATION.OPC.gate, read: window.STATION.OPC.read, call: window.STATION.OPC.call, ext: window.STATION.KINDCOL.external }));
  ok(sets.every(e => e.col === tok.gate), 'SETS is drawn in the station\'s gate token', sets[0] && sets[0].col);
  ok(reads.every(e => e.col === tok.read), 'READS is drawn in the station\'s read token', reads[0] && reads[0].col);
  const walks = await p.$$eval('line[data-edge="walks"]', e => e.map(x => ({ col: x.getAttribute('stroke'), dash: x.getAttribute('stroke-dasharray') })));
  ok(walks.length === 2 && walks.every(w => w.col === tok.call && !!w.dash),
    'WALKS is dashed — the clock walks the lanes, the part buttons walk the six parts', JSON.stringify(walks));
  const shows = await p.$$eval('[data-edge^="shows"]', e => e.map(x => x.tagName.toLowerCase()));
  ok(shows.indexOf('ellipse') >= 0, 'the transient reach is ONE faint dashed ring, not eighteen arrows', shows.join(','));
  const lg = await p.$$eval('.maplgd .lgi', e => e.map(x => x.textContent.trim()));
  ok(lg.join(',') === 'sets,reads,walks,shows', 'the legend draws one row per edge kind, each as drawn', lg.join(',')); }

// ── 4 · THE NODE CARD: four sections, and a number the page can compute ─────────────────
{ await p.hover('.mnode[data-node="security"]');
  await p.waitForTimeout(150);
  const card = await p.$eval('#hover', e => ({ hidden: e.hidden, t: e.innerText }));
  // ── THE CARD NEVER COVERS ITS ANCHOR (operator 2026-09-17) — measured on three anchors at the edges of the page ──
  { const probe = async (sel) => { const el = await p.$(sel); if (!el) return { sel, missing: true };
      await el.hover(); await p.waitForTimeout(140);
      return await p.evaluate(sel => { const a = document.querySelector(sel).getBoundingClientRect(), c = document.getElementById('hover').getBoundingClientRect();
        const apart = c.left >= a.right + 1 || c.right <= a.left - 1 || c.top >= a.bottom + 1 || c.bottom <= a.top - 1;
        const inside = c.left >= 0 && c.top >= 0 && c.right <= innerWidth && c.bottom <= innerHeight;
        return { sel, apart, inside, side: document.getElementById('hover').dataset.side }; }, sel); };
    for (const sel of ['#btnproposed', '#dial .ib:last-child', '.mnode[data-node="widening"]']) {
      const r = await probe(sel); if (r.missing) continue;
      ok(r.apart && r.inside, 'the hover card sits clear of ' + sel + ' and inside the window', JSON.stringify(r)); }
    await p.mouse.move(2, 2); await p.waitForTimeout(120); }
  // ── THE TOP BAR IN THREE ZONES: sizes + clock left · presets middle · copy/paste/load/reset right ──
  { const z = await p.evaluate(() => { const x = s => document.querySelector(s).getBoundingClientRect();
      return { dial: x('#dial').right, presetsL: x('#tbpresets').left, presetsR: x('#tbpresets').right, actionsL: x('#tbactions').left,
               presets: [...document.querySelectorAll('#tbpresets .ib')].map(b => b.id), actions: [...document.querySelectorAll('#tbactions .ib, #tbactions input')].map(b => b.id),
               bar: x('.topbar') }; });
    ok(z.dial < z.presetsL && z.presetsR < z.actionsL, 'sizes and clock on the left, presets in the middle, the layout actions on the right', JSON.stringify([z.dial, z.presetsL, z.presetsR, z.actionsL].map(Math.round)));
    const mid = (z.presetsL + z.presetsR) / 2, barMid = (z.bar.left + z.bar.right) / 2;
    ok(Math.abs(mid - barMid) < z.bar.width * 0.2, 'the presets sit near the middle of the bar', Math.round(mid) + ' vs ' + Math.round(barMid));
    ok(z.presets.join(',') === 'btnfirst,btntoday,btnproposed' && z.actions.join(',') === 'btncopy,paste,btnload,btnreset', 'the groups hold exactly the presets and the actions', z.presets.join(',') + ' | ' + z.actions.join(',')); }
  ok(!card.hidden, 'hovering a node opens the lab hover card');
  const low = card.t.toLowerCase();
  for (const s of ['what happens here', 'kind', 'on this door', 'use it when'])
    ok(low.includes(s), 'the card carries the section "' + s + '"');
  ok(low.includes('standpoint'), 'the card names the nature');
  ok(card.t.includes(N.guards + ' deps · ' + N.asgi + ' app lanes'), 'the "on this door" line is computed from LABEP.security', card.t.slice(0, 200));
  ok(card.t.includes(N.gateCrossings + ' gate crossings over ' + N.paths + ' paths'), 'and it carries the gate-crossing number the page computes', String(N.gateCrossings));
  const secs = await p.$$eval('#hover .cpgrl', e => e.length);
  ok(secs === 4, 'exactly four sections, in the operator\'s order', String(secs));
  const floor = await p.$$eval('#hover *', els => els.filter(e => e.childNodes.length && [].some.call(e.childNodes, n => n.nodeType === 3 && n.textContent.trim()))
    .map(e => parseFloat(getComputedStyle(e).fontSize)).filter(v => v < 12).length);
  ok(floor === 0, 'the hover card holds the 12px floor', String(floor)); }

// ── 5 · THE NODE LABELS hold the floor ─────────────────────────────────────────────────
{ const under = await p.$$eval('.mnode .mlbl, .shitem', els => els.map(e => parseFloat(getComputedStyle(e).fontSize)).filter(v => v < 12));
  ok(under.length === 0, 'every map node label and shelf item is at 12px or more', under.join(',')); }

// ── 6 · ARR.place dims the node and tags it ────────────────────────────────────────────
{ ok(await p.evaluate(() => window.ARR.place('security', 'middle', 'S')), 'ARR.place puts a tile in a panel');
  const st = await p.$eval('.mnode[data-node="security"]', e => ({ op: parseFloat(getComputedStyle(e).opacity), tag: (e.querySelector('.mtag') || {}).textContent || '', dashed: getComputedStyle(e.querySelector('.mring')).borderStyle }));
  ok(st.op < 1, 'the placed node is dimmed on the map', String(st.op));
  ok(st.tag === 'in middle', 'and it is tagged with the panel it went to', st.tag);
  ok(st.dashed === 'dashed', 'its ring goes dashed — it is not on the shelf any more', st.dashed);
  const li = await p.$eval('.shitem[data-item="security"]', e => ({ op: parseFloat(getComputedStyle(e).opacity), t: e.textContent }));
  ok(li.op < 1 && li.t.includes('in middle'), 'the fallback list says the same', JSON.stringify(li));
  ok(await p.evaluate(() => window.ARR.remove('security')), 'ARR.remove takes it back to the shelf');
  ok(await p.$eval('.mnode[data-node="security"]', e => parseFloat(getComputedStyle(e).opacity)) === 1, 'and the node is bright again'); }

// ── 7 · THE TIMELINE: one lane per path, 7 stages + the return ─────────────────────────
await p.evaluate(() => { window.ARR.reset(); window.ARR.place('paths-timeline', 'middle', 'L'); });
await p.waitForTimeout(120);
{ const cols = await p.$$eval('.tlhead .tlc', e => e.map(x => x.textContent));
  ok(cols.length === N.phases + 1, 'the timeline draws the seven stage columns plus the return', cols.length + ': ' + cols.join(','));
  ok(cols[cols.length - 1] === 'return', 'the last column IS the return', cols[cols.length - 1]);
  const lanes = await p.$$eval('.tlane', e => e.map(x => ({ id: x.dataset.path, col: +x.dataset.col })));
  ok(lanes.length === N.paths, 'one lane per path', lanes.length + ' vs ' + N.paths);
  const wrong = lanes.filter(l => { const w = N.laneCols.filter(c => c.id === l.id)[0]; return !w || w.col !== l.col; });
  ok(wrong.length === 0, 'every lane ends at the column its phase names', JSON.stringify(wrong));
  // the DRAWN geometry: every marker's centre falls inside the band of the column its phase names
  const geo = await p.evaluate(() => {
    const bands = [].map.call(document.querySelectorAll('.tlhead .tlc'), e => { const r = e.getBoundingClientRect(); return [r.left, r.right]; });
    return [].map.call(document.querySelectorAll('.tlane'), x => { const m = x.querySelector('.tlmk').getBoundingClientRect(), bar = x.querySelector('.tlbar').getBoundingClientRect();
      return { col: +x.dataset.col, mid: m.left + m.width / 2, mx: Math.round(m.left), barR: Math.round(bar.right), band: bands[+x.dataset.col] }; }); });
  const out = geo.filter(g => !(g.mid >= g.band[0] - 2 && g.mid <= g.band[1] + 2));
  ok(out.length === 0, 'every marker is DRAWN inside the band of the column its phase names', JSON.stringify(out.slice(0, 2)));
  const byCol = {}; geo.forEach(g => { (byCol[g.col] = byCol[g.col] || []).push(g.mx); });
  const spread = Object.keys(byCol).map(k => Math.max(...byCol[k]) - Math.min(...byCol[k]));
  ok(spread.every(v => v <= 2), 'lanes ending at the same column draw their marker at the same x', spread.join(','));
  const xs = Object.keys(byCol).map(Number).sort((a, c) => a - c).map(k => byCol[k][0]);
  ok(xs.every((v, i) => i === 0 || v > xs[i - 1]), 'a later column draws its marker further right', xs.join(','));
  ok(geo.every(g => g.mx <= g.barR + 1 && g.mx > g.band[0] - 2), 'the marker sits at the end of the lane, over the bar\'s tail');
  const cols2 = await p.$$eval('.tlane .tlmk', els => els.map(e => getComputedStyle(e).color));
  const want = await p.evaluate(() => window.LABEP.forms.paths.map(x => ({ success: window.STATION.OPC.read, refusal: window.STATION.OPC.gate,
    framework: window.STATION.KINDCOL.external, validation: window.STATION.OPC.schema, uncaught: window.STATION.BADGE_COL.role.accessor })[x.kind]));
  const hex2rgb = h => { const m = h.replace('#', ''); return 'rgb(' + parseInt(m.slice(0, 2), 16) + ', ' + parseInt(m.slice(2, 4), 16) + ', ' + parseInt(m.slice(4, 6), 16) + ')'; };
  const bad = cols2.map((c, i) => c === hex2rgb(want[i]) ? null : i + ':' + c + '≠' + want[i]).filter(Boolean);
  ok(bad.length === 0, 'every status marker is painted in its kind\'s station colour', bad.join(' ')); }

// ── 8 · CLICKING A LANE SETS THE SELECTION, and the standpoints follow ─────────────────
await p.evaluate(() => { ['security', 'functions', 'data', 'schemas', 'tests', 'widening'].forEach(k => { window.ARR.place(k, 'middle', 'S'); window.ARR.view(k, 'path'); }); });
await p.waitForTimeout(120);
{ await p.click(`.tlane[data-path="${N.consent}"]`);
  await p.waitForTimeout(150);
  const sel = await p.evaluate(() => ({ kind: window.SEL.kind, id: window.SEL.id }));
  ok(sel.kind === 'path' && sel.id === N.consent, 'clicking a lane puts that path in force', JSON.stringify(sel));
  const want = await p.evaluate(id => { const c = window.LABEP.forms.paths.filter(x => x.id === id)[0].chain.filter(s => s.kind === 'gate');
    return { passed: c.filter(s => s.hit === false).length, fired: c.filter(s => s.hit === true).length, all: c.length }; }, N.consent);
  const secTxt = await p.$eval('.ptbody[data-body="security"]', e => e.innerText);
  ok(secTxt.includes(want.passed + ' passed · ' + want.fired + ' fired'), 'the security tile counts the gates this path crossed', want.passed + '/' + want.fired + ' — ' + secTxt.slice(0, 160).replace(/\n/g, ' '));
  const drawn = await p.$$eval('.ptbody[data-body="security"] .achip', e => e.length);
  ok(drawn >= want.all, 'and it draws a chip for every gate crossed', drawn + ' >= ' + want.all);
  // the DATA tile shows the consent 409's rolled-back chip, with the feed's own number
  const dataTxt = await p.$eval('.ptbody[data-body="data"]', e => e.innerText);
  ok(/rolled back/.test(dataTxt), 'the data tile names the rolled-back bucket', dataTxt.slice(0, 120).replace(/\n/g, ' '));
  const rolled = await p.$$eval('.ptbody[data-body="data"] .achip', els => els.map(e => e.textContent).filter(t => /^rolled back/.test(t)));
  ok(rolled.some(t => t === 'rolled back ' + N.consentRolled), 'the rolled-back chip carries the feed\'s own count', rolled.join(' | ') + ' want ' + N.consentRolled);
  const rc = await p.$$eval('.ptbody[data-body="data"] .achip', els => els.filter(e => /^rolled back/.test(e.textContent)).map(e => getComputedStyle(e).color));
  const redv = await p.evaluate(() => getComputedStyle(document.body).getPropertyValue('--red').trim());
  ok(rc.length > 0, 'and it is drawn');
  // the TESTS tile marks the four cases the feed joins to this ending
  const tTxt = await p.$eval('.ptbody[data-body="tests"]', e => e.innerText);
  const wantCases = await p.evaluate(id => { const pth = window.LABEP.forms.paths.filter(x => x.id === id)[0];
    const ex = window.LABEP.forms.exits.filter(x => x.id === pth.exit.id)[0]; return (ex.tests || []).map(t => t.case); }, N.consent);
  ok(wantCases.every(c => tTxt.includes(c)), 'the tests tile names every case the feed joins to this exit', wantCases.join(' ') + ' — ' + tTxt.replace(/\n/g, ' ').slice(0, 160));
  // the WIDENING tile marks the reason site for this status
  const wTxt = (await p.$eval('.ptbody[data-body="widening"]', e => e.innerText)).toLowerCase();
  const wantFind = await p.evaluate(() => (window.LABEP.forms.frontend.findings || []).map(f => f.id));
  ok(wTxt.includes('reason site for 409') && wantFind.some(f => wTxt.includes(f.toLowerCase())), 'the widening tile marks the 409 reason site and its finding', wTxt.replace(/\n/g, ' ').slice(0, 220));
  const wantChain = await p.evaluate(() => window.LABEP.widening.chain.map(lv => lv[0].name).concat([window.LABEP.forms.frontend.hook.piece.split('#')[1]]));
  ok(wantChain.every(nm => wTxt.includes(nm.toLowerCase())), 'and draws the whole hook → screen → route → app chain', wantChain.join(' → '));
  // the FOLLOWERS flash on the one clock
  const flashed = await p.evaluate(id => { window.ARR.select('path', id);
    return [].map.call(document.querySelectorAll('.ptile.flash'), e => e.dataset.tile); }, N.firstRun);
  const readers = await p.evaluate(() => [].map.call(document.querySelectorAll('.ptile'), e => e.dataset.tile).filter(k => window.ARR.TILES.filter(t => t.key === k)[0].reads));
  ok(flashed.slice().sort().join() === readers.slice().sort().join(), 'a selection change flashes exactly the tiles that follow it', flashed.join(',') + ' vs ' + readers.join(','));
  const anim = await p.$eval('.ptile[data-tile="security"]', e => getComputedStyle(e).animationName);
  ok(anim === 'arrflash', 'and the flash is a real animation on the one clock', anim); }

// ── 9 · THE SIZES: a third · a half · the full width, measured ─────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); window.ARR.place('security', 'middle', 'S'); window.ARR.place('functions', 'middle', 'M'); window.ARR.place('paths-timeline', 'middle', 'L'); });
  await p.waitForTimeout(120);
  const m = await p.evaluate(() => { const host = document.querySelector('.panel[data-panel="middle"] .ptiles');
    const w = host.clientWidth, g = k => document.querySelector(`.ptile[data-tile="${k}"]`).getBoundingClientRect().width;
    return { w, S: g('security'), M: g('functions'), L: g('paths-timeline') }; });
  ok(near(m.S, m.w / 3, 2), 'S measures a third of the panel', m.S.toFixed(1) + ' vs ' + (m.w / 3).toFixed(1));
  ok(near(m.M, m.w / 2, 2), 'M measures a half of the panel', m.M.toFixed(1) + ' vs ' + (m.w / 2).toFixed(1));
  ok(near(m.L, m.w, 2), 'L measures the full panel width', m.L.toFixed(1) + ' vs ' + m.w.toFixed(1)); }

// ── 10 · THE PANELS are at the brief's own numbers, and never scroll sideways ──────────
{ const dims = await p.$$eval('.panel', els => els.map(e => ({ k: e.dataset.panel, w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })));
  ok(JSON.stringify(dims) === JSON.stringify([{ k: 'middle', w: 1100, h: 420 }, { k: 'portrait', w: 440, h: 560 }, { k: 'command', w: 360, h: 560 }]),
    'the three drop zones are drawn at the brief\'s proportions (work box)', JSON.stringify(dims));
  const side = await p.$$eval('.ptiles', els => els.map(e => e.scrollWidth - e.clientWidth).filter(v => v > 1));
  ok(side.length === 0, 'no panel scrolls sideways', side.join(','));
  const hb = await p.$eval('#headbar', e => ({ drop: e.dataset.drop, t: e.innerText }));
  const id = await p.evaluate(() => window.LABEP.identity);
  ok(hb.drop === 'no', 'the head bar strip is not a drop zone', hb.drop);
  for (const s of [id.method, id.path, String(id.status), id.file + ':' + id.flines])
    ok(hb.t.includes(s), 'the head bar carries ' + s); }

// ── 11 · THE OVERFLOW BADGE, with the measured excess ──────────────────────────────────
{ await p.evaluate(id => { window.ARR.reset(); window.ARR.select('path', id);
    ['path-record', 'exit-record', 'case-record'].forEach(k => window.ARR.place(k, 'command', 'L')); }, N.consent);
  await p.waitForTimeout(200);
  const ov = await p.$eval('.panel[data-panel="command"] .povf', e => e.textContent).catch(() => null);
  ok(ov && /^overflow \+\d+px$/.test(ov), 'an overfull panel wears the overflow badge with a px number', String(ov));
  const px = ov ? +ov.replace(/\D/g, '') : 0;
  const real = await p.$eval('.panel[data-panel="command"] .ptiles', e => e.scrollHeight - e.clientHeight);
  ok(px === real && px > 0, 'and the number is the measured excess', px + ' vs ' + real);
  await p.evaluate(() => { window.ARR.remove('exit-record'); window.ARR.remove('case-record'); });
  await p.waitForTimeout(150);
  const gone = await p.$('.panel[data-panel="command"] .povf');
  ok(gone === null, 'removing the tiles that did not fit takes the badge away');
  const still = await p.$$eval('.panel[data-panel="command"] .ptile', e => e.length);
  ok(still === 1, 'with a tile still in the panel', String(still)); }

// ── 12 · THE COPY LINE round trips, exactly ────────────────────────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); window.ARR.place('paths-timeline', 'middle', 'L'); window.ARR.place('security', 'middle', 'S');
    window.ARR.place('path-record', 'portrait', 'L'); window.ARR.place('command-card', 'command', 'L'); window.ARR.place('clock', 'command', 'S'); });
  await p.waitForTimeout(100);
  const line = await p.evaluate(() => window.ARR.line());
  ok(line === 'arrange · middle: paths-timeline L · security S | portrait: path-record L | command: command-card L · clock S',
    'the copy line reads the way the brief writes it', line);
  const before = await p.evaluate(() => JSON.stringify(window.ARR.state().zones));
  await p.evaluate(() => window.ARR.reset());
  ok(await p.evaluate(() => window.ARR.line()) === 'arrange · empty', 'reset empties every panel');
  await p.evaluate(l => window.ARR.load(l), line);
  await p.waitForTimeout(100);
  const after = await p.evaluate(() => JSON.stringify(window.ARR.state().zones));
  ok(before === after, 'pasting the line back restores the identical placement', after);
  ok(await p.evaluate(() => window.ARR.line()) === line, 'and the line it writes is byte-identical');
  // the COPY button writes it on the page too
  await p.click('#btncopy'); await p.waitForTimeout(120);
  const shown = await p.$eval('#copyout', e => ({ hidden: e.hidden, t: e.innerText }));
  ok(!shown.hidden && shown.t.includes(line), 'the COPY button shows the line it wrote', shown.t.replace(/\n/g, ' ').slice(0, 120));
  const box = await p.$eval('#paste', e => e.value);
  ok(box === line, 'and drops it in the paste box, ready to go back'); }

// ── 13 · THE OPERATOR'S FIRST CUT ──────────────────────────────────────────────────────
{ await p.evaluate(() => window.ARR.reset());
  await p.click('#btnfirst'); await p.waitForTimeout(160);
  const line = await p.evaluate(() => window.ARR.line());
  ok(line === N.firstCut, 'the first-cut button places exactly the arrangement the operator described', line);
  ok(line === 'arrange · middle: paths-timeline L · security S · functions S · data S | portrait: path-record L | command: command-card L',
    'and that line is the one the brief writes in words', line);
  const placed = await p.$$eval('.ptile', e => e.map(x => x.dataset.tile + ' ' + x.dataset.size));
  ok(placed.join(' · ') === 'paths-timeline L · security S · functions S · data S · path-record L · command-card L',
    'the tiles really are drawn in that order and at those widths', placed.join(' · '));
  if (shotsAt) { await p.mouse.move(5, 1070); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(shotsAt, 'arrange-firstcut.png'), fullPage: false });
    await (await p.$('.shbox')).screenshot({ path: path.join(shotsAt, 'arrange-map-firstcut.png') }); } }

// ── 14 · THE 12px FLOOR inside every panel, at the work box AND the dock box ───────────
const floorNow = async () => p.evaluate(() => {
  const bad = [];
  document.querySelectorAll('.panel *').forEach(e => {
    if (e.namespaceURI && e.namespaceURI.indexOf('svg') >= 0) return;
    const hasText = [].some.call(e.childNodes, n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 12) bad.push(e.className + '=' + fs); });
  return bad; });
{ const w = await floorNow();
  ok(w.length === 0, 'the 12px floor holds inside every panel at the WORK box', w.slice(0, 4).join(' | '));
  await p.evaluate(() => window.ARR.dial('dock')); await p.waitForTimeout(200);
  const dimsD = await p.$eval('.panel[data-panel="middle"]', e => Math.round(e.getBoundingClientRect().width) + '×' + Math.round(e.getBoundingClientRect().height));
  ok(dimsD === '826×264', 'the dock dial really draws the console\'s own 826 × 264', dimsD);
  const d = await floorNow();
  ok(d.length === 0, 'and the floor still holds at the DOCK box', d.slice(0, 4).join(' | '));
  const ovD = await p.$eval('.panel[data-panel="middle"] .povf', e => e.textContent).catch(() => null);
  ok(ovD !== null, 'the first cut does not fit the dock box, and the panel says so out loud', String(ovD));
  if (shotsAt) { await (await p.$('.panel[data-panel="middle"]')).screenshot({ path: path.join(shotsAt, 'arrange-middle-dock.png') }); }
  await p.evaluate(() => window.ARR.dial('wide')); await p.waitForTimeout(200);
  const dimsW = await p.$eval('.panel[data-panel="middle"]', e => Math.round(e.getBoundingClientRect().width) + '×' + Math.round(e.getBoundingClientRect().height));
  ok(dimsW === '1500×460', 'the wide dial draws 1500 × 460', dimsW);
  if (shotsAt) await (await p.$('.panel[data-panel="middle"]')).screenshot({ path: path.join(shotsAt, 'arrange-middle-wide.png') });
  await p.evaluate(() => window.ARR.dial('work')); await p.waitForTimeout(200);
  // ── THE WHOLE SCREEN (operator 2026-09-17: "we still have more width to use") — no column cap, and a FIT dial
  //    that takes the width the screen leaves after the portrait and the command panel ──
  { const cap = await p.$eval('.wrap', e => getComputedStyle(e).maxWidth);
    ok(cap === 'none', 'the page column has no width cap — the screen is the column', cap);
    const p3 = await b.newPage({ viewport: { width: 2560, height: 1200 } });
    await p3.goto('file://' + PAGE); await p3.waitForFunction('window.__arrangeReady===true', { timeout: 20000 }).catch(() => {});
    await p3.evaluate(() => { window.ARR.reset(); window.ARR.dial('work'); }); await p3.waitForTimeout(200);
    const fitW = await p3.evaluate(() => { const r = document.getElementById('prow'); return r.scrollWidth <= r.clientWidth + 1; });
    ok(fitW, 'at 2560 wide the three panels sit inside the row at the work size — nothing hides behind a scrollbar');
    await p3.evaluate(() => window.ARR.dial('fit')); await p3.waitForTimeout(200);
    const m = await p3.evaluate(() => { const r = document.getElementById('prow'), mid = document.querySelector('.panel[data-panel="middle"]');
      return { w: mid.getBoundingClientRect().width, want: r.clientWidth - 440 - 360 - 28, label: document.querySelector('#dial .ib[data-dial="fit"] span').textContent,
               right: Math.max(...[...document.querySelectorAll('.panel')].map(e => e.getBoundingClientRect().right)), edge: r.getBoundingClientRect().right }; });
    ok(Math.abs(m.w - m.want) <= 2, 'FIT gives the middle the width the screen leaves after the portrait and the command panel', JSON.stringify(m));
    ok(m.label === 'fit ' + Math.floor(m.want) + '×460', 'the fit dial shows the measured width, not a typed one', m.label);
    ok(m.right <= m.edge + 1, 'under FIT every panel\'s right edge stays inside the row', m.right + ' vs ' + m.edge);
    await p3.evaluate(() => window.ARR.dial('work'));
    await p3.close(); }
  if (shotsAt) await (await p.$('.panel[data-panel="middle"]')).screenshot({ path: path.join(shotsAt, 'arrange-middle-work.png') }); }

// ── 15 · THE FOUR STATES, drawn honestly ───────────────────────────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); window.ARR.select(null, null);
    ['security', 'data', 'schemas'].forEach(k => { window.ARR.place(k, 'middle', 'S'); window.ARR.view(k, 'path'); }); });
  await p.waitForTimeout(140);
  const hollow = await p.$$eval('.ptbody.st-hollow', e => e.length);
  ok(hollow === 3, 'with nothing in force every standpoint is HOLLOW', String(hollow));
  const words = await p.$eval('.ptbody[data-body="security"]', e => e.innerText);
  ok(words.includes('nothing in force'), 'and says "nothing in force" in words', words.replace(/\n/g, ' ').slice(0, 80));
  // HATCHED: the case record's call rows, which this feed does not carry
  await p.evaluate(() => { window.ARR.reset(); window.ARR.place('case-record', 'portrait', 'L');
    const ex = window.LABEP.forms.exits.filter(x => (x.tests || []).length)[0]; window.ARR.select('case', ex.tests[0].case); });
  await p.waitForTimeout(140);
  const hat = await p.$eval('.ptbody[data-body="case-record"] .st-hatched', e => e.innerText).catch(() => null);
  ok(hat && hat.includes('unmeasured'), 'what the feed does not carry is HATCHED and says unmeasured', String(hat).replace(/\n/g, ' ').slice(0, 120));
  // DASHED: a test join that is not status+detail is inferred
  await p.evaluate(() => { window.ARR.reset(); window.ARR.place('tests', 'middle', 'M'); window.ARR.view('tests', 'path');
    const pth = window.LABEP.forms.paths.filter(x => (x.tests || []).some(t => t.conf !== 'status+detail')
      && (x.tests || []).some(t => t.conf === 'status+detail'))[0]; window.ARR.select('path', pth.id); });
  await p.waitForTimeout(140);
  const dash = await p.$$eval('.ptbody[data-body="tests"] .aline', els => els.map(e => ({ d: e.classList.contains('st-dashed'), t: e.innerText.replace(/\n/g, ' ') })));
  ok(dash.some(d => d.d && !/status\+detail/.test(d.t)), 'an inferred test join is DASHED', JSON.stringify(dash).slice(0, 200));
  ok(dash.some(d => !d.d && /status\+detail/.test(d.t)), 'and an exact one is not');
  // BLANK: clearing when there is nothing to clear
  await p.evaluate(() => { window.ARR.reset(); window.ARR.select(null, null); window.ARR.place('selection', 'portrait', 'L'); });
  await p.waitForTimeout(120);
  const blank = await p.$eval('.ptbody[data-body="selection"] .ib', e => e.className);
  ok(/st-blank/.test(blank), 'a control with no question to answer is BLANK, keeping its place', blank); }

// ── 16 · THE CONTROL TILES all set the same selection ──────────────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); ['command-card', 'path-strip', 'exit-ladder', 'matrix'].forEach(k => window.ARR.place(k, 'middle', 'M'));
    window.ARR.view('command-card', 'verbs'); window.ARR.select(null, null); });
  await p.waitForTimeout(160);
  const cells = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell', e => e.map(x => x.dataset.cmd));
  ok(cells.length === 15, 'the command card draws the fifteen verbs', cells.length + ': ' + cells.join(','));
  ok(cells[14] === 'clear', 'and the corner is the fifteenth slot, always', cells[14]);
  const badges = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell .cbadge', e => e.map(x => x.textContent));
  const wantWalk = String(N.paths);
  ok(badges[0] === wantWalk, 'the Walk badge is the path count the feed carries', badges[0] + ' vs ' + wantWalk);
  await p.click('.ptbody[data-body="command-card"] .cmdcell[data-cmd="walk"]');
  await p.waitForTimeout(140);
  const pcells = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell', e => e.map(x => x.dataset.cmd));
  ok(pcells.length === N.paths + 1, 'Walk swaps the grid to one cell per path, plus the corner', pcells.length + ' vs ' + (N.paths + 1));
  ok(pcells[pcells.length - 1] === 'back', 'and the corner becomes Back', pcells[pcells.length - 1]);
  await p.click('.ptbody[data-body="command-card"] .cmdcell[data-cmd="p:' + N.firstRun + '"]');
  await p.waitForTimeout(140);
  ok(await p.evaluate(() => window.SEL.id) === N.firstRun, 'a path cell puts that path in force');
  await p.evaluate(() => window.ARR.select(null, null));
  const strip = await p.$$eval('.ptbody[data-body="path-strip"] .pscell', e => e.map(x => x.dataset.path));
  ok(strip.length === N.paths, 'the path strip draws one cell per path', String(strip.length));
  await p.click(`.ptbody[data-body="path-strip"] .pscell[data-path="${N.consent}"]`);
  await p.waitForTimeout(120);
  ok(await p.evaluate(() => window.SEL.kind + ':' + window.SEL.id) === 'path:' + N.consent, 'and a cell sets the same selection');
  const rungs = await p.$$eval('.ptbody[data-body="exit-ladder"] .exrung', e => e.map(x => x.dataset.rung));
  ok(rungs.length === N.phases + 1, 'the ladder draws the seven stages plus the foot', rungs.length + ': ' + rungs.join(','));
  const hung = await p.$$eval('.ptbody[data-body="exit-ladder"] .exchip', e => e.length);
  ok(hung === N.exits, 'and every exit hangs on a rung', hung + ' vs ' + N.exits);
  const consentExit = await p.evaluate(id => window.LABEP.forms.paths.filter(x => x.id === id)[0].exit.id, N.consent);
  await p.click(`.ptbody[data-body="exit-ladder"] .exchip[data-exit="${consentExit}"]`);
  await p.waitForTimeout(140);
  const lad = await p.$$eval('.ptbody[data-body="exit-ladder"] .exrung', els => els.map(e => ({ r: e.dataset.rung, o: parseFloat(getComputedStyle(e).opacity), cls: e.className })));
  const above = lad.filter(l => /above/.test(l.cls)), below = lad.filter(l => /below/.test(l.cls));
  ok(above.length > 0 && below.length > 0, 'picking an exit splits the ladder above and below it', above.length + '/' + below.length);
  ok(above.every(l => l.o === 1) && below.every(l => l.o < 1), 'the rungs above stay lit and the ones below dim', JSON.stringify(lad.map(l => l.o)));
  const mx = await p.$$eval('.ptbody[data-body="matrix"] .cmxc', e => e.map(x => x.dataset.cell));
  ok(mx.length === N.paths * 6, 'the matrix draws path × part', mx.length + ' vs ' + (N.paths * 6));
  const lit = await p.$$eval('.ptbody[data-body="matrix"] .cmxc.lit', e => e.length);
  ok(lit === N.matrixLit, 'and its lit count is the one the page computes from the forms', lit + ' vs ' + N.matrixLit); }

// ── 17 · THE ONE CLOCK ─────────────────────────────────────────────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); window.ARR.place('paths-timeline', 'middle', 'L'); window.ARR.place('clock', 'command', 'S'); });
  await p.waitForTimeout(140);
  const beads = await p.$$eval('.tlbead', e => e.length);
  ok(beads === N.paths, 'a bead walks every lane', beads + ' vs ' + N.paths);
  const run = await p.$eval('.tlbead', e => getComputedStyle(e).animationPlayState);
  ok(run === 'running', 'and it runs on the one clock', run);
  await p.evaluate(() => window.CLOCK.pause()); await p.waitForTimeout(120);
  const frozen = await p.$eval('.tlbead', e => getComputedStyle(e).animationPlayState);
  ok(frozen === 'paused', 'pause freezes every animation on the page', frozen);
  await p.evaluate(() => window.CLOCK.replay()); await p.waitForTimeout(120);
  ok(await p.evaluate(() => window.CLOCK.state) === 'play', 'replay starts it again');
  const s1 = await p.$eval('.tlbead', e => e.getBoundingClientRect().left);
  await p.waitForTimeout(700);
  const s2 = await p.$eval('.tlbead', e => e.getBoundingClientRect().left);
  ok(Math.abs(s2 - s1) > 1, 'two samples at uneven gaps differ — the bead really moves', s1.toFixed(1) + ' → ' + s2.toFixed(1)); }

// ── 18 · REDUCED MOTION shows the finished frame, and never flashes ────────────────────
{ await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.evaluate(() => { window.ARR.reset(); window.ARR.place('security', 'middle', 'S'); window.ARR.place('paths-timeline', 'middle', 'L'); });
  await p.waitForTimeout(160);
  const fa = await p.evaluate(() => { const pth = window.LABEP.forms.paths[0]; window.ARR.select('path', pth.id);
    return getComputedStyle(document.querySelector('.ptile[data-tile="security"]')).animationName; });
  ok(fa === 'none', 'under reduced motion a selection change does not flash', fa);
  const bd = await p.$eval('.tlbead', e => getComputedStyle(e).animationIterationCount);
  ok(bd === '1', 'and the bead shows the finished frame instead of walking', bd);
  await p.emulateMedia({ reducedMotion: 'no-preference' }); }

// ── 19 · THE BROWSER STORE is a convenience, never a dependency ────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); window.ARR.place('matrix', 'portrait', 'M'); });
  await p.waitForTimeout(120);
  const before = await p.evaluate(() => window.ARR.line());
  await p.reload();
  await p.waitForFunction('window.__arrangeReady===true', { timeout: 20000 }).catch(() => {});
  const after = await p.evaluate(() => window.ARR.line());
  ok(after === before, 'the arrangement survives a reload', after + ' vs ' + before);
  const p2 = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs2 = []; p2.on('pageerror', e => errs2.push(e.message));
  await p2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get(){ throw new Error('storage blocked'); } }); });
  await p2.goto('file://' + PAGE);
  await p2.waitForFunction('window.__arrangeReady===true', { timeout: 20000 }).catch(() => {});
  ok(await p2.evaluate(() => window.__arrangeReady === true), 'the page still boots with storage blocked', errs2.slice(0, 2).join(' | '));
  ok(await p2.evaluate(() => window.ARR.place('data', 'middle', 'S') && window.ARR.line()) === 'arrange · middle: data S',
    'and still arranges tiles without it');
  ok(errs2.length === 0, 'with no page error', errs2.slice(0, 2).join(' | '));
  await p2.close();
  await p.evaluate(() => window.ARR.reset()); }

// ── 21 · THE THREE VIEWS ON EVERY STANDPOINT (the operator's model, 2026-09-17) ────────
{ await p.evaluate(id => { window.ARR.reset(); window.ARR.select('path', id);
    ['data', 'schemas', 'functions', 'tests', 'widening', 'security'].forEach(k => window.ARR.place(k, 'middle', 'S')); }, N.consent);
  await p.waitForTimeout(200);
  const sw = await p.evaluate(() => [].map.call(document.querySelectorAll('.ptile'), t =>
    ({ k: t.dataset.tile, v: [].map.call(t.querySelectorAll('.ptih .vb'), b => b.dataset.view) })));
  ok(sw.length === 6 && sw.every(x => x.v.join(',') === 'all,path,time'),
    'every standpoint tile carries the three-way switch in its header', JSON.stringify(sw.slice(0, 2)));
  const onNow = await p.$$eval('.ptile[data-tile="data"] .ptih .vb.on', e => e.map(x => x.dataset.view));
  ok(onNow.join() === 'all', 'and it boots on `all` — the rich view, the door\'s whole set', onNow.join());
  const sizeBefore = await p.$eval('.ptile[data-tile="data"]', e => Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  // the three views draw three different pictures of the SAME what
  const fp = {};
  for (const v of ['all', 'path', 'time']) {
    await p.evaluate(v => window.ARR.view('data', v), v);
    await p.waitForTimeout(140);
    fp[v] = await p.$eval('.ptbody[data-body="data"]', e => e.innerText.replace(/\s+/g, ' ').trim()); }
  ok(fp.all !== fp.path && fp.path !== fp.time && fp.all !== fp.time,
    'the three views draw three different pictures of the same WHAT', Object.keys(fp).map(k => k + ':' + fp[k].length).join(' '));
  const sizeAfter = await p.$eval('.ptile[data-tile="data"]', e => Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  ok(sizeBefore === sizeAfter, 'and switching the view never changes the tile\'s size', sizeBefore + ' vs ' + sizeAfter);
  // ALL = every table the door reads or writes
  await p.evaluate(() => window.ARR.view('data', 'all')); await p.waitForTimeout(140);
  const allRows = await p.$$eval('.ptbody[data-body="data"] .aline', e => e.length);
  ok(allRows === await p.evaluate(() => window.LABEP.data.tables.length),
    'ALL draws one row per table on the door (LABEP.data.tables)', allRows + ' vs ' + await p.evaluate(() => window.LABEP.data.tables.length));
  // PATH = only the tables the path in force touches
  await p.evaluate(() => window.ARR.view('data', 'path')); await p.waitForTimeout(140);
  const pathRows = await p.$$eval('.ptbody[data-body="data"] .aline', e => e.length);
  const wantPath = await p.evaluate(id => window.LABEP.forms.paths.filter(x => x.id === id)[0].effects.tables.length, N.consent);
  ok(pathRows === wantPath, 'PATH draws only the tables this ending touches', pathRows + ' vs ' + wantPath);
  ok(pathRows < allRows, 'which is fewer than the whole door', pathRows + ' < ' + allRows);
  // TIME = one row per touch, in chain order
  await p.evaluate(() => window.ARR.view('data', 'time')); await p.waitForTimeout(140);
  const timeRows = await p.$$eval('.ptbody[data-body="data"] .aline[data-step]', e => e.length);
  const wantSteps = await p.evaluate(id => window.LABEP.forms.paths.filter(x => x.id === id)[0].effects.steps.length, N.consent);
  ok(timeRows === wantSteps, 'TIME draws one row per effect step, in the order the request makes them', timeRows + ' vs ' + wantSteps);
  const ids = await p.$$eval('.ptbody[data-body="data"] .aline[data-step]', e => e.map(x => x.dataset.step));
  const wantIds = await p.evaluate(id => window.LABEP.forms.paths.filter(x => x.id === id)[0].effects.steps.map(s => s.step), N.consent);
  ok(ids.join() === wantIds.join(), 'and in the feed\'s own order, step for step');
  // the other five parts answer all three views without a page error
  const errsB = errs.length;
  for (const k of ['schemas', 'functions', 'tests', 'widening', 'security'])
    for (const v of ['all', 'path', 'time']) {
      await p.evaluate(a => window.ARR.view(a[0], a[1]), [k, v]);
      await p.waitForTimeout(60);
      const txt = await p.$eval(`.ptbody[data-body="${k}"]`, e => e.innerText.trim());
      ok(txt.length > 0, `${k} draws something in the ${v} view`); }
  ok(errs.length === errsB, 'no page error in any of the eighteen view renders', errs.slice(errsB, errsB + 3).join(' | '));
  // TESTS along time is HATCHED, honestly — a case has no inside
  await p.evaluate(() => window.ARR.view('tests', 'time')); await p.waitForTimeout(140);
  const hat = await p.$eval('.ptbody[data-body="tests"] .st-hatched', e => e.innerText).catch(() => null);
  ok(hat && hat.includes('a case proves an ending, it has no time inside'),
    'TESTS along time is HATCHED and says why in words', String(hat).replace(/\n/g, ' ').slice(0, 90));
  const hatBg = await p.$eval('.ptbody[data-body="tests"] .st-hatched', e => getComputedStyle(e).backgroundImage);
  ok(/repeating-linear-gradient/.test(hatBg), 'and it is DRAWN hatched, not just labelled', hatBg.slice(0, 40));
  // the views ride in the copy line, defaults omitted
  await p.evaluate(() => { window.ARR.reset(); window.ARR.place('data', 'middle', 'S'); });
  await p.waitForTimeout(100);
  ok(await p.evaluate(() => window.ARR.line()) === 'arrange · middle: data S', 'a default view is not written in the line');
  await p.evaluate(() => window.ARR.view('data', 'time')); await p.waitForTimeout(100);
  ok(await p.evaluate(() => window.ARR.line()) === 'arrange · middle: data:time S', 'a chosen view rides in the line as tile:view');
  await p.evaluate(() => window.ARR.load('arrange · middle: data:path S')); await p.waitForTimeout(120);
  ok(await p.evaluate(() => window.ARR.viewOf('data')) === 'path', 'and the line puts it back');
  if (shotsAt) { await p.evaluate(id => { window.ARR.reset(); window.ARR.select('path', id);
      ['all', 'path', 'time'].forEach((v, i) => { window.ARR.place('data', 'middle', 'S'); }); }, N.consent);
    for (const v of ['all', 'path', 'time']) { await p.evaluate(x => window.ARR.view('data', x), v);
      await p.mouse.move(5, 1070); await p.waitForTimeout(200);
      await (await p.$('.ptile[data-tile="data"]')).screenshot({ path: path.join(shotsAt, `arrange-data-${v}.png`) }); } } }

// ── 22 · THE COMMAND TILE IS THE WHAT × PATH MENU ─────────────────────────────────────
{ await p.evaluate(() => { window.ARR.reset(); window.ARR.place('command-card', 'command', 'L'); window.ARR.select(null, null); });
  await p.waitForTimeout(180);
  ok(await p.evaluate(() => window.ARR.viewOf('command-card')) === 'menu', 'the command tile boots on the MENU view');
  const l1 = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell', e => e.map(x => x.dataset.cmd));
  ok(l1.length === 15, 'level 1 keeps the fifteen slots of the square', String(l1.length));
  const groups = l1.filter(c => c.indexOf('g:') === 0);
  ok(groups.join(',') === 'g:paths,g:data,g:schemas,g:functions,g:tests,g:security,g:widening',
    'seven groups: PATHS and the six parts, in the operator\'s order', groups.join(','));
  ok(l1[14] === 'clear', 'and the corner is the fifteenth slot', l1[14]);
  const blanks = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell.st-blank', e => e.length);
  ok(blanks === 15 - groups.length - 1, 'the slots between them keep their place, blank', String(blanks));
  const badges = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell[data-cmd^="g:"]', els => els.map(e => (e.querySelector('.cbadge') || {}).textContent || ''));
  const wantBadges = await p.evaluate(() => [String(window.LABEP.forms.paths.length)].concat(
    ['data', 'schemas', 'functions', 'tests', 'security', 'widening'].map(k => String(window.PANELS[k].count(window.LABEP)))));
  ok(badges.join(',') === wantBadges.join(','), 'every badge is a number the page computes (forms + PANELS[k].count)', badges.join(',') + ' vs ' + wantBadges.join(','));
  const cols = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell[data-cmd^="g:"]', els => els.map(e => e.style.getPropertyValue('--tc')));
  const wantCols = await p.evaluate(() => ['var(--accent)'].concat(['data', 'schemas', 'functions', 'tests', 'security', 'widening'].map(k => window.PANELS[k].col)));
  ok(cols.join(',') === wantCols.join(','), 'and every group wears its part\'s own colour', cols.join(','));
  const words = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell[data-cmd^="g:"] .clbl', e => e.map(x => x.textContent));
  ok(words.join(',') === 'PATHS,DATA,SCHEMAS,FUNCTIONS,TESTS,SECURITY,WIDENING', 'the words are the registry\'s own, upper-cased', words.join(','));
  const hd1 = await p.$eval('.ptbody[data-body="command-card"] .asech', e => e.innerText);
  ok(hd1.indexOf('7 GROUPS') >= 0, 'the head says how deep you are', hd1);
  // DATA ▸ drills down — three views + its own verbs + Back; the data tile is NOT placed
  await p.click('.ptbody[data-body="command-card"] .cmdcell[data-cmd="g:data"]');
  await p.waitForTimeout(160);
  const l2 = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell', e => e.map(x => x.dataset.cmd));
  ok(l2.slice(0, 4).join(',') === 'v:all,v:path,v:time,writes', 'DATA opens its three views and its own verb', l2.slice(0, 5).join(','));
  ok(l2[14] === 'back', 'and the corner becomes Back', l2[14]);
  ok(l2.length === 15, 'the square keeps its fifteen slots one level down', String(l2.length));
  const dashed = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell[data-cmd^="v:"]', els => els.map(e => e.className));
  ok(dashed.every(c => /st-dashed/.test(c)), 'with the data tile unplaced the view cells are DASHED', dashed[0]);
  await p.hover('.ptbody[data-body="command-card"] .cmdcell[data-cmd="v:time"]');
  await p.waitForTimeout(150);
  const card = await p.$eval('#hover', e => e.innerText);
  ok(card.includes('place the data tile first'), 'and the card says what to do about it', card.replace(/\n/g, ' ').slice(0, 120));
  // place the tile and press ALONG TIME
  await p.evaluate(id => { window.ARR.place('data', 'middle', 'S'); window.ARR.select('path', id); }, N.consent);
  await p.waitForTimeout(160);
  await p.evaluate(() => window.ARR.menu('data'));
  await p.waitForTimeout(160);
  const lit = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell[data-cmd^="v:"]', els => els.map(e => e.className));
  ok(lit.every(c => !/st-dashed/.test(c)), 'placed, the view cells go live', lit[0]);
  await p.click('.ptbody[data-body="command-card"] .cmdcell[data-cmd="v:time"]');
  await p.waitForTimeout(180);
  ok(await p.evaluate(() => window.ARR.viewOf('data')) === 'time', 'pressing ALONG TIME switches the placed data tile to the time view');
  const onCell = await p.$eval('.ptbody[data-body="command-card"] .cmdcell[data-cmd="v:time"]', e => e.className);
  ok(/\bon\b/.test(onCell), 'and the cell reads as the one in force', onCell);
  const tRows = await p.$$eval('.ptbody[data-body="data"] .aline[data-step]', e => e.length);
  ok(tRows === await p.evaluate(id => window.LABEP.forms.paths.filter(x => x.id === id)[0].effects.steps.length, N.consent),
    'the middle really shows the result — one row per step', String(tRows));
  if (shotsAt) { await p.mouse.move(5, 1070); await p.waitForTimeout(200);
    await (await p.$('.ptile[data-tile="command-card"]')).screenshot({ path: path.join(shotsAt, 'arrange-menu-data.png') }); }
  // Back, then PATHS ▸ — depth never exceeds two below the groups
  await p.click('.ptbody[data-body="command-card"] .cmdcell[data-cmd="back"]');
  await p.waitForTimeout(160);
  ok(await p.evaluate(() => window.CARD.grp) === null, 'Back returns to the seven groups');
  if (shotsAt) { await p.mouse.move(5, 1070); await p.waitForTimeout(200);
    await (await p.$('.ptile[data-tile="command-card"]')).screenshot({ path: path.join(shotsAt, 'arrange-menu-groups.png') }); }
  await p.click('.ptbody[data-body="command-card"] .cmdcell[data-cmd="g:paths"]');
  await p.waitForTimeout(160);
  const lp = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell', e => e.map(x => x.dataset.cmd));
  ok(lp.filter(c => c.indexOf('p:') === 0).length === N.paths, 'PATHS opens one cell per path', String(lp.filter(c => c.indexOf('p:') === 0).length));
  ok(lp[lp.length - 1] === 'back', 'with Back in the corner', lp[lp.length - 1]);
  await p.click(`.ptbody[data-body="command-card"] .cmdcell[data-cmd="p:${N.firstRun}"]`);
  await p.waitForTimeout(160);
  ok(await p.evaluate(() => window.SEL.id) === N.firstRun, 'and a path cell sets the global selection'); }

// ── 23 · THE THREE PRESETS ────────────────────────────────────────────────────────────
{ // today — the console as it is built
  await p.evaluate(() => window.ARR.preset('today'));
  await p.waitForTimeout(260);
  const line = await p.evaluate(() => window.ARR.line());
  ok(line === 'arrange · today · middle: part-buttons L | portrait: thing-record L | command: command-card:verbs L',
    'TODAY loads the endpoint lab as built, and writes its own line back', line);
  const btns = await p.$$eval('.ptbody[data-body="part-buttons"] .pbtn', els => els.map(e => e.dataset.part + '=' + e.querySelector('.pbn').textContent));
  const wantCounts = await p.evaluate(() => ['data', 'schemas', 'functions', 'tests', 'security', 'widening'].map(k => k + '=' + window.PANELS[k].count(window.LABEP)));
  ok(btns.join(',') === wantCounts.join(','), 'the six part buttons carry the registry\'s own counts', btns.join(','));
  const host = await p.$$eval('.ptbody[data-body="part-buttons"] .pbhost', e => e.map(x => x.dataset.partBody));
  ok(host.length === 1, 'exactly one part is visible at a time', host.join(','));
  const hostRows = await p.$$eval('.ptbody[data-body="part-buttons"] .pbhost .aline', e => e.length);
  ok(hostRows === await p.evaluate(() => window.LABEP.data.tables.length), 'and it draws that part\'s ALL view', String(hostRows));
  await p.click('.ptbody[data-body="part-buttons"] .pbtn[data-part="functions"]');
  await p.waitForTimeout(180);
  ok((await p.$$eval('.ptbody[data-body="part-buttons"] .pbhost', e => e.map(x => x.dataset.partBody)))[0] === 'functions',
    'pressing a button swaps the part shown');
  const verbs = await p.$$eval('.ptbody[data-body="command-card"] .cmdcell', e => e.length);
  ok(verbs === 15, 'and the command panel holds the fifteen verbs, as today', String(verbs));
  // the magnifier: click a table in the middle, read it in the portrait
  await p.click('.ptbody[data-body="part-buttons"] .pbtn[data-part="data"]');
  await p.waitForTimeout(160);
  await p.click('.ptbody[data-body="part-buttons"] .pbhost .aline');
  await p.waitForTimeout(180);
  const th = await p.evaluate(() => window.__ARRTHING || null);
  const mag = await p.$eval('.ptbody[data-body="thing-record"]', e => e.innerText.replace(/\n/g, ' '));
  const t0 = await p.evaluate(() => window.LABEP.data.tables[0]);
  ok(mag.indexOf(t0.table) === 0 || mag.includes(t0.table), 'the portrait magnifies the table just clicked in the middle', mag.slice(0, 80));
  ok(mag.includes(t0.model) && mag.includes(String(t0.cols[0][0])), 'with its model and its columns, from LABEP.data.tables', mag.slice(0, 120));
  if (shotsAt) { await p.mouse.move(5, 1070); await p.waitForTimeout(240);
    await p.screenshot({ path: path.join(shotsAt, 'arrange-preset-today.png') }); }
  // proposed — the operator's model
  await p.evaluate(() => window.ARR.preset('proposed'));
  await p.waitForTimeout(280);
  const line2 = await p.evaluate(() => window.ARR.line());
  ok(line2 === 'arrange · proposed · middle: paths-timeline M · data:path S · functions:path S · security:path S'
    + ' | portrait: thing-record L | command: command-card L · dial fit',
    'PROPOSED loads the operator\'s model and writes its own line back', line2);
  ok(await p.evaluate(() => window.ARR.state().dial) === 'fit', 'and it brings the FIT dial with it');
  const placed = await p.$$eval('.ptile', e => e.map(x => x.dataset.tile + ' ' + x.dataset.size));
  ok(placed.join(' · ') === 'paths-timeline M · data:path S · functions:path S · security:path S · thing-record L · command-card L'
    .replace(/:path/g, ''), 'the tiles are drawn in that order and at those widths', placed.join(' · '));
  const views = await p.evaluate(() => ['data', 'functions', 'security'].map(k => window.ARR.viewOf(k)).join(','));
  ok(views === 'path,path,path', 'the three result tiles are on the PATH view', views);
  ok(await p.evaluate(() => window.ARR.viewOf('command-card')) === 'menu', 'and the command panel is the menu');
  // the round trip, both grammars
  for (const nm of ['today', 'proposed']) {
    await p.evaluate(x => window.ARR.preset(x), nm); await p.waitForTimeout(160);
    const a = await p.evaluate(() => JSON.stringify(window.ARR.state()));
    const l = await p.evaluate(() => window.ARR.line());
    await p.evaluate(() => window.ARR.reset()); await p.waitForTimeout(80);
    await p.evaluate(x => window.ARR.load(x), l); await p.waitForTimeout(160);
    ok(await p.evaluate(() => JSON.stringify(window.ARR.state())) === a, `the ${nm} line round trips exactly`);
    ok(await p.evaluate(() => window.ARR.line()) === l, `and writes itself back byte-identical`); }
  // the OLD grammar still loads
  await p.evaluate(l => window.ARR.load(l), 'arrange · middle: paths-timeline L · security S | portrait: path-record L');
  await p.waitForTimeout(140);
  ok(await p.evaluate(() => window.ARR.line()) === 'arrange · middle: paths-timeline L · security S | portrait: path-record L · dial fit',
    'a line written before views and presets existed still loads', await p.evaluate(() => window.ARR.line()));
  await p.evaluate(() => window.ARR.dial('work'));
  if (shotsAt) { await p.evaluate(() => window.ARR.preset('proposed'));
    await p.evaluate(id => window.ARR.select('path', id), N.consent);
    await p.mouse.move(5, 1070); await p.waitForTimeout(280);
    await p.screenshot({ path: path.join(shotsAt, 'arrange-preset-proposed.png') }); }
  await p.evaluate(() => { window.ARR.reset(); window.ARR.dial('work'); }); }

// ── 20 · THE SHOTS ─────────────────────────────────────────────────────────────────────
if (shotsAt) {
  await p.evaluate(() => { window.ARR.reset(); window.ARR.select(null, null); });
  await p.mouse.move(5, 1070); await p.waitForTimeout(240);
  await p.screenshot({ path: path.join(shotsAt, 'arrange-empty.png') });
  await (await p.$('.shbox')).screenshot({ path: path.join(shotsAt, 'arrange-map-empty.png') });
  await p.evaluate(() => { window.ARR.firstCut(); window.ARR.select('path', window.LABEP.forms.paths.filter(x => x.status === 409 && x.names.drawn.indexOf('consent') >= 0)[0].id); });
  await p.mouse.move(5, 1070); await p.waitForTimeout(280);
  await p.screenshot({ path: path.join(shotsAt, 'arrange-firstcut-selected.png') });
  await (await p.$('.panel[data-panel="middle"]')).screenshot({ path: path.join(shotsAt, 'arrange-middle-selected.png') });
  const wrote = fs.readdirSync(shotsAt).filter(f => f.endsWith('.png'));
  console.log('shots: ' + wrote.length + ' → ' + shotsAt);
}

ok(errs.length === 0, 'no page error anywhere in the run', errs.slice(0, 3).join(' | '));
await b.close();
console.log(`arrange probe: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
