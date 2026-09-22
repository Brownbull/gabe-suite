/* probe-matrices.mjs — the matrices page's render proof (headless system Chrome via the spike's playwright-core).

     node docs/design/design-context/probe-matrices.mjs [--round 2] [--page FILE] [--shots DIR]

   Every assert measures the DRAWN thing against numbers computed here from m1-round1.endpoint.json (the frozen round-1 matrix the record draws) and the page's own data.
   --round 2 probes matrices-round2.html the same way over m1-endpoint.json, minus the ruling form it does not carry, plus D-021's
   own claims, each recomputed HERE from m1-cluster.js / m1-homes.js: the blocks drawn by default are his eleven with their
   homes over the round-2 cells · the arithmetic's cut drawn behind the switch is m1-cluster.js's · the statement's numbers
   are the ladder's. --page points the probe at a scratch copy (how its mutants are run).
   Exit 1 on any failure; SKIP loudly (exit 0) when chrome or playwright-core is missing. One browser, one page. */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..');
let PAGE = path.join(HERE, 'matrices-endpoint.html'); const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const args = process.argv.slice(2), shotsAt = args.indexOf('--shots') >= 0 ? args[args.indexOf('--shots') + 1] : null;
const R2 = args.indexOf('--round') >= 0 && args[args.indexOf('--round') + 1] === '2';
if (args.indexOf('--page') >= 0) PAGE = path.resolve(args[args.indexOf('--page') + 1]); else if (R2) PAGE = path.join(HERE, 'matrices-round2.html');
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
if (shotsAt) fs.mkdirSync(shotsAt, { recursive: true });
const { chromium } = require(PW);
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra !== undefined ? ' — ' + extra : '')); } };
const shot = async (p, name, opts) => { if (shotsAt) await p.screenshot({ path: path.join(shotsAt, name + '.png'), ...(opts || {}) }); };

const M = JSON.parse(fs.readFileSync(path.join(HERE, R2 ? 'm1-endpoint.json' : 'm1-round1.endpoint.json'), 'utf8'));
const DRAWN = M.cells.filter(c => c.value > 0 || c.judged).length;

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const open = async () => { await p.goto('file://' + PAGE); await p.waitForFunction('!!window.__mx', { timeout: 15000 }); };
await open(); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await open();
const D = await p.evaluate(() => window.__mx.data), D_SIGS = D.clusters.map(c => c.sig);
const box = sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; }, sel);
const cellSel = (q, a) => `.cell[data-q="${q}"][data-a="${a}"]`;

// ── 1 · it boots and draws the whole matrix ─────────────────────────────────
ok(errs.length === 0, 'no console errors', errs.slice(0, 2).join(' | '));
ok(await p.locator('.mx .cell').count() === DRAWN, 'one drawn cell per filled cell of the merged matrix', `${await p.locator('.mx .cell').count()} vs ${DRAWN}`);
ok(await p.locator('.mx .rl').count() === D.attrs.length && await p.locator('.mx .ch').count() === D.questions.length, 'a label per attribute and a head per question');
ok(await p.locator('.mx .cell[data-v="2"]').count() === M.cells.filter(c => c.value === 2).length, 'the needed squares are the matrix\'s 2s', await p.locator('.mx .cell[data-v="2"]').count());
ok(await p.locator('.mx .cell[data-j="true"]').count() === M.counts.judged, 'every cell a judge settled wears the dashed ring', `${await p.locator('.mx .cell[data-j="true"]').count()} vs ${M.counts.judged}`);
const sz = await p.evaluate(() => { const g = s => document.querySelector(s).firstChild.getBoundingClientRect(); return { two: g('.cell[data-v="2"]').width, one: g('.cell[data-v="1"]').width }; });
ok(sz.two >= sz.one * 1.8, 'needed is drawn larger than helps, so grayscale still separates them', JSON.stringify(sz));

// ── 2 · it opens FINISHED: the blocks ───────────────────────────────────────
ok(await p.getAttribute('#mx', 'data-order') === 'clu' && await p.evaluate(() => document.getElementById('mx').classList.contains('still')), 'the page opens on the finished picture, with no transition running');
for (const c of D.clusters.filter(x => x.attrs.length)) {
  const xs = []; for (const q of c.questions) xs.push((await p.evaluate(id => [...document.querySelectorAll('.mx .ch')].find(n => n.textContent === id).getBoundingClientRect().x, q)));
  const sorted = xs.slice().sort((a, z) => a - z);
  ok(sorted.every((x, i) => i === 0 || Math.abs(x - sorted[i - 1] - 34) < 1.5), `block ${c.n}'s questions sit side by side`, sorted.map(Math.round).join(','));
}
{ // a block's band really covers a cell that belongs to it
  const c = D.clusters.find(x => x.attrs.length && x.questions.some(q => x.attrs.some(a => D.cells[q + '|' + a] && D.cells[q + '|' + a].v === 2)));
  const q = c.questions.find(qq => c.attrs.some(a => (D.cells[qq + '|' + a] || {}).v === 2)), a = c.attrs.find(aa => (D.cells[q + '|' + aa] || {}).v === 2);
  const cb = await box(cellSel(q, a));
  const inside = await p.evaluate(({ x, y }) => [...document.querySelectorAll('.mx .band:not(.spine)')].some(n => { const r = n.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; }), { x: cb.x + cb.w / 2, y: cb.y + cb.h / 2 });
  ok(inside, `a needed cell of block ${c.n} is drawn inside a block band`, `${q} x ${a}`);
}
const firstRows = await p.evaluate(n => [...document.querySelectorAll('.mx .rl')].map(r => ({ t: r.querySelector('.t').textContent, y: r.getBoundingClientRect().y })).sort((a, z) => a.y - z.y).slice(0, n).map(r => r.t), D.spine.length);
ok(JSON.stringify(firstRows) === JSON.stringify(D.spine.map(id => D.attrs.find(a => a.id === id).label)), 'the attributes every view needs are the top rows', firstRows.join(' · '));
await shot(p, 'm-01-blocks');

// ── 3 · the order toggle and the replay ─────────────────────────────────────
await p.locator('[data-ord="inv"]').click(); await p.waitForTimeout(1300);
const invFirst = await p.evaluate(() => [...document.querySelectorAll('.mx .rl')].map(r => ({ t: r.querySelector('.t').textContent, y: r.getBoundingClientRect().y })).sort((a, z) => a.y - z.y)[0].t);
ok(invFirst === D.attrs[0].label, 'inventory order puts the inventory\'s first attribute on top', invFirst);
ok(await p.evaluate(() => getComputedStyle(document.querySelector('.mx .band')).opacity) === '0', 'the block bands leave when the blocks are not there');
await shot(p, 'm-02-inventory');
const probeCell = cellSel(M.cells.find(c => c.value === 2).q, M.cells.find(c => c.value === 2).a);
await p.locator('[data-ord="clu"]').click(); await p.waitForTimeout(1300);
const fin = await box(probeCell);
await p.click('#replay'); await p.waitForTimeout(260);
const mid = await box(probeCell); await p.waitForTimeout(1300);
const end = await box(probeCell);
ok(Math.abs(mid.y - end.y) > 2 || Math.abs(mid.x - end.x) > 2, 'Replay moves the cells (sampled mid-flight)', `${Math.round(mid.x)},${Math.round(mid.y)} → ${Math.round(end.x)},${Math.round(end.y)}`);
ok(Math.abs(end.x - fin.x) < 1 && Math.abs(end.y - fin.y) < 1, 'and lands on the finished picture');
await p.click('#af-cog'); await p.locator('#af-motion .af-opt', { hasText: 'Paused' }).click(); await p.keyboard.press('Escape');
await p.click('#replay'); await p.waitForTimeout(200);
const paused = await box(probeCell);
ok(Math.abs(paused.x - fin.x) < 1 && Math.abs(paused.y - fin.y) < 1, 'Paused shows the finished picture at once, never a frame in between');
await p.click('#af-cog'); await p.locator('#af-motion .af-opt', { hasText: 'Playing' }).click(); await p.keyboard.press('Escape');

// ── 4 · hovers ──────────────────────────────────────────────────────────────
const tipState = () => p.evaluate(() => { const t = [...document.querySelectorAll('.tip')].find(x => x.getAttribute('data-show') === 'true'); if (!t) return null; const r = t.getBoundingClientRect(); return { text: t.textContent, top: r.top, bottom: r.bottom, fs: parseFloat(getComputedStyle(t).fontSize) }; });
await p.locator(probeCell).scrollIntoViewIfNeeded(); const cb = await box(probeCell);
await p.mouse.move(cb.x + cb.w / 2, cb.y + cb.h / 2); await p.waitForTimeout(200);
let t = await tipState();
ok(t && /needed to answer it/.test(t.text) && D.raters.every(r => t.text.includes(r)), 'a cell\'s hover says needed or helps, and shows the three votes', t && t.text.slice(0, 110));
ok(t && (t.bottom <= cb.y + cb.h / 2 || t.top >= cb.y + cb.h / 2 + 1) && t.fs >= 12, 'the hover stays off the pointer and on the 12px floor');
const q0 = D.questions[0], hb = await p.evaluate(id => { const n = [...document.querySelectorAll('.mx .ch')].find(x => x.textContent === id); n.scrollIntoView({ block: 'center' }); const r = n.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, q0.id);
await p.mouse.move(hb.x, hb.y); await p.waitForTimeout(200); t = await tipState();
ok(t && t.text.startsWith(q0.text), 'a question\'s head opens with the question in your words', t && t.text.slice(0, 80));
await shot(p, 'm-03-hover', { clip: { x: 300, y: Math.max(0, hb.y - 80), width: 1320, height: 360 } });
await p.mouse.move(5, 5);

// ── 5 · the points of view ──────────────────────────────────────────────────
ok(await p.locator('.prism').count() === D.clusters.length, 'one card per block', await p.locator('.prism').count());
for (const c of D.clusters) {
  const card = p.locator('.prism').nth(c.n - 1);
  ok(await card.locator('.qs li').count() === c.questions.length && await card.locator('.chip').count() === c.attrs.length + c.borrows.length, `card ${c.n} lists its questions, the attributes it owns and the ones it borrows`, `${await card.locator('.qs li').count()} q · ${await card.locator('.chip').count()} a`);
}
{ const widths = await p.evaluate(() => [...document.querySelectorAll('.prism .own i')].map(i => i.firstChild.getBoundingClientRect().width / i.getBoundingClientRect().width));
  ok(D.clusters.every((c, i) => Math.abs(widths[i] - c.purity) < 0.02), 'each card\'s "its own" bar is the block\'s measured share', widths.map(x => x.toFixed(2)).join(' ')); }
{ // a claim on the page must be checkable on the page: the card that says Security lands in it shows the gate
  const sec = D.clusters.find(c => /Security/.test(c.standpoint)), chips = await p.locator('.prism').nth(sec.n - 1).locator('.chip').allTextContents();
  ok(chips.some(t => /Auth scheme \+ gate/.test(t)), `the card that claims Security ("${sec.name}") shows the auth gate among what it needs`, chips.join(' · ').slice(0, 120));
  const secCard = p.locator('.prism').nth(sec.n - 1); ok(await secCard.locator('.chip', { hasText: 'Auth scheme + gate' }).isHidden(), 'the shared attributes start folded — measured as drawn, never by the attribute alone');
  await secCard.locator('.more-btn').click(); ok(await secCard.locator('.chip', { hasText: 'Auth scheme + gate' }).isVisible(), 'and one press unfolds them');
}
{ // the ladder: every join drawn, its length the similarity, the cut after the right join
  const shownN = D.ladder.filter(m => m.kept || m.weak).length;
  const restOk = shownN === D.ladder.length ? await p.locator('#ladder .rest').count() === 0 : (await p.locator('#ladder .rest').textContent()).startsWith(String(D.ladder.length - shownN) + ' more joins');
  ok(await p.locator('#ladder .who').count() === shownN && restOk, 'the ladder draws the joins that matter and counts the rest', `${await p.locator('#ladder .who').count()} + rest`);
  const before = await p.evaluate(() => { const kids = [...document.getElementById('ladder').children], i = kids.findIndex(n => n.classList.contains('cutline')); return kids.slice(0, i).filter(n => n.classList.contains('who')).length; });
  if (!R2) ok(await p.locator('#ladder .cutline').count() === 1 && before === D.cut.index, 'the cut is drawn once, after the last join it kept', `${before} vs ${D.cut.index}`);
  const r0 = await p.evaluate(() => { const t = document.querySelector('#ladder .trk'); return t.firstChild.getBoundingClientRect().width / t.getBoundingClientRect().width; });
  ok(Math.abs(r0 - D.ladder[0].sim) < 0.01, 'a join\'s bar length is its similarity', `${r0.toFixed(3)} vs ${D.ladder[0].sim}`);
  const gaps = D.ladder.slice(1).map((m, i) => +(D.ladder[i].sim - m.sim).toFixed(3)); const legal = gaps.map((g, i) => ({ g, i: i + 1 })).filter(x => D.questions.length - x.i >= 3 && D.questions.length - x.i <= 14);
  if (!R2) ok(legal.every(x => x.g <= D.cut.drop + 1e-9) && Math.abs(gaps[D.cut.index - 1] - D.cut.drop) < 1e-9, 'the cut really is the widest drop in the ladder', `${D.cut.drop} at ${D.cut.index}`);
  ok(await p.locator('#ladder .trk[data-k="weak"]').count() === D.ladder.filter(m => m.weak).length && D.ladder.filter(m => m.weak).length > 0, 'the merge candidates just past the cut are drawn lighter');
}
const out = () => p.evaluate(() => document.getElementById('out').value);
if (R2) {   /* round 2 asks for no verdict: D-021 ruled the blocks */
  ok(await p.locator('.prism .verdict').first().isHidden() && await p.locator('#sec-copy').isHidden(), 'round 2 carries no verdict buttons and no ruling to copy — the blocks are ruled');
} else {
const c1 = D.clusters[0]; await p.locator('.prism').nth(0).locator('.verdict .btn', { hasText: 'Keep' }).click();
await p.locator('.prism').nth(1).locator('.verdict .btn', { hasText: 'Merge' }).click(); await p.locator('.prism').nth(1).locator('.note').fill('into ' + c1.name);
ok((await out()).includes(`${c1.n} ${c1.name}: keep`) && (await out()).includes(`${D.clusters[1].n} ${D.clusters[1].name}: merge | into ${c1.name}`), 'a verdict and its note land in the ruling text', (await out()).split('\n').slice(1, 3).join(' / '));
ok((await out()).includes(`${D.clusters.length - 2} without a verdict`), 'the text counts what is still open');
const before = await out(); await open();
ok(await out() === before, 'a reload keeps the verdicts and notes');
const saved = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('gabe:matrices:endpoint-card')).p));
ok(saved.length === 2 && saved.every(k => D_SIGS.includes(k)), 'a verdict is saved under its block\'s questions, never its card number', saved.join(' · '));
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('gabe:matrices:endpoint-card')); s.p['Q1+Q99'] = { v: 'drop', n: 'a block that no longer exists' }; localStorage.setItem('gabe:matrices:endpoint-card', JSON.stringify(s)); });
await open();
ok(!(await out()).includes('a block that no longer exists') && (await out()) === before, 'a verdict on a block that no longer exists is dropped, never re-attached');
}
await p.locator('.prism').first().scrollIntoViewIfNeeded(); await shot(p, 'm-04-prisms');

// ── 6 · the spine bars and the face meter ───────────────────────────────────
const top = D.attrs.slice().sort((a, z) => z.need - a.need || z.touch - a.touch)[0];
const ratio = await p.evaluate(() => { const tr = document.querySelector('.bars .track'), w = tr.getBoundingClientRect().width; return tr.querySelector('.n2').getBoundingClientRect().width / w; });
ok(Math.abs(ratio - top.need / D.questions.length) < 0.01, 'the first bar\'s length is the share of questions that need it', `${ratio.toFixed(3)} vs ${top.need}/${D.questions.length}`);
ok(await p.locator('.bars .nm').count() === D.attrs.filter(a => a.need >= D.barFloor).length, 'the bars list exactly the attributes at or above the floor');
ok(await p.locator('.meter .slots i.on').count() === Math.min(D.face.length, D.faceBudget) && await p.locator('.meter .slots i.over').count() === Math.max(0, D.face.length - D.faceBudget), 'the meter lights one slot per face slot, and none over budget unless the plan is');
await p.locator('#sec-spine').scrollIntoViewIfNeeded(); await shot(p, 'm-05-spine');

// ── 7 · the disclosure plan ─────────────────────────────────────────────────
const marks = await p.evaluate(() => [...document.querySelectorAll('#m2g .fm:not([data-f="alert"])')].length), want = D.attrs.reduce((s, a) => s + a.m2.levels.filter(Boolean).length, 0);
ok(marks === want, 'one mark per level an attribute is shown at', `${marks} vs ${want}`);
const farMarks = await p.evaluate(() => [...document.querySelectorAll('#m2g .c[data-lv="far"] .fm:not([data-f="alert"])')].length);
ok(farMarks === D.attrs.filter(a => a.m2.first === 'far').length, 'the far column holds exactly the face', farMarks);
ok(await p.evaluate(() => [...document.querySelectorAll('#m2g .c[data-lv="far"] .fm[data-f="alert"]')].length) === D.attrs.filter(a => a.alarm).length, 'every alert attribute wears a bell at the far view');
ok(await p.evaluate(() => [...document.querySelectorAll('#m2g .mv')].filter(n => n.getAttribute('data-mv') !== '0').length) === D.m2moved, 'the rows the questions moved are the ones marked earlier or later');
ok(await p.evaluate(() => [...document.querySelectorAll('#m2g .mv')].filter(n => n.textContent === 'alert only').length) === D.attrs.filter(a => a.m2.recordFirst == null).length && D.attrs.some(a => a.m2.recordFirst == null), 'a row the inventory gave only an alert says so, and never claims "same"');
ok(await p.evaluate(() => [...document.querySelectorAll('#m2g .grp')][0].textContent) === 'needed by three or more points of view', 'the top group is named by its measured rule, never "every view"', await p.evaluate(() => [...document.querySelectorAll('#m2g .grp')][0].textContent));
ok(D.spine.every(id => D.spineIn[id] >= D.spineMin && D.spineIn[id] < D.clusters.length), 'and no attribute in it is needed by every point of view, so the name has to be the rule');
await p.locator('#sec-m2').scrollIntoViewIfNeeded(); await shot(p, 'm-06-plan');

// ── 8 · leftovers, floor, widths, theme, copy, clear ────────────────────────
ok(await p.locator('#left .panel').count() === 3, 'three leftover boxes');
ok(await p.locator('.take').count() === 5 && await p.evaluate(() => [...document.querySelectorAll('.take li')].every(n => n.textContent.length > 20 && !/\{\w+\}/.test(n.textContent))), 'every picture ends with its take, with its numbers filled in');
const floor = await p.evaluate(() => { let min = 99, who = ''; document.querySelectorAll('.artifact-page *').forEach(n => { if (!n.offsetParent) return; const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!own && !/INPUT|TEXTAREA/.test(n.tagName)) return; const f = parseFloat(getComputedStyle(n).fontSize); if (f < min) { min = f; who = n.className || n.tagName; } }); return { min, who }; });
ok(floor.min >= 12, 'no text under 12px', `${floor.min}px on .${floor.who}`);
for (const w of [1920, 1280, 390]) { await p.setViewportSize({ width: w, height: 900 }); const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 1, `no horizontal page scroll at ${w}px`, o); }
await shot(p, 'm-07-phone'); await p.setViewportSize({ width: 1920, height: 1080 });
const col = await p.evaluate(() => { const r = document.querySelector('.artifact-page').getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right }; });
ok(Math.abs(col.left - col.right) < 20 && col.left > 100, 'the column is centred on a wide screen', JSON.stringify(col));
const lightBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); await p.emulateMedia({ colorScheme: 'dark' });
ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) !== lightBg, 'dark paints a different ground'); await shot(p, 'm-08-dark'); await p.emulateMedia({ colorScheme: 'light' });
if (!R2) {
await p.click('#copy'); await p.waitForFunction(() => document.getElementById('said').textContent.length > 0, { timeout: 4000 }).catch(() => {});
const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => null)), said = await p.textContent('#said');
ok(clip === null ? /^(Copied|Select)/.test(said) : clip === await out(), 'Copy puts the ruling on the clipboard', clip === null ? said : 'differs');
await p.click('#reset'); ok(await p.getAttribute('#reset', 'data-armed') === 'true' && (await out()).includes(': keep'), 'the first press on Clear only arms it');
await p.click('#reset'); ok(!(await out()).includes(': keep') && (await out()).includes(`${D.clusters.length} without a verdict`), 'the second press clears every verdict');
}
if (R2) await round2();
ok(errs.length === 0, 'no console errors by the end', errs.slice(0, 2).join(' | '));
await b.close();
console.log(`probe-matrices${R2 ? ' --round 2' : ''}: ${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);

/* ── round 2 · D-021: his eleven drawn, the arithmetic's cut behind a switch, both numbers stated — all recomputed here ── */
async function round2() {
  const { cluster } = require(path.join(HERE, 'm1-cluster.js')), HM = require(path.join(HERE, 'm1-homes.js'));
  const P = JSON.parse(fs.readFileSync(path.join(HERE, 'prisms-endpoint.json'), 'utf8')), INP = JSON.parse(fs.readFileSync(path.join(HERE, 'm1-input.json'), 'utf8'));
  const R1IN = JSON.parse(fs.readFileSync(path.join(HERE, 'm1-round1.input.json'), 'utf8'));
  const { parseInventory } = require(path.join(HERE, 'inventory-parse.js')), LIVE = new Set(parseInventory(path.join(HERE, 'inventory-endpoint.md')).rows.map(r => r.id));
  const B = await p.evaluate(() => window.__mxr2.base), IDS = B.attrs.map(a => a.id), QIDS = B.questions.map(q => q.id);
  const K = cluster(IDS, QIDS, M.cells, P.clusterOpts), RULED = Object.keys(P.blocks), RQ = RULED.map(s => s.split('+'));
  const KR = HM.measure(IDS, QIDS, M.cells, RQ, P.clusterOpts), ruledJ = HM.ladderCutOf(K.ladder, QIDS, RQ);
  const key = a => a.slice().sort().join(' | ');
  const drawn = () => p.evaluate(() => ({ sigs: [...document.querySelectorAll('#prisms .prism')].map(n => n.getAttribute('data-sig')), clusters: window.__mx.data.clusters.map(c => ({ sig: c.sig, attrs: c.attrs })), bands: document.querySelectorAll('.mx .band:not(.spine)').length, cut: window.__mxr2.cut() }));
  const cutsBefore = () => p.evaluate(() => { const kids = [...document.getElementById('ladder').children], o = {}; kids.forEach((n, i) => { if (n.classList.contains('cutline')) o[n.getAttribute('data-cut')] = kids.slice(0, i).filter(x => x.classList.contains('who')).length; }); return o; });
  await p.evaluate(() => window.scrollTo(0, 0)); await shot(p, 'r2-01-top');

  // the default: his eleven, their homes over the round-2 cells
  let d = await drawn();
  ok(d.cut === 'eleven' && key(d.sigs) === key(RULED) && d.sigs.length === RULED.length, 'by default the drawn blocks are the ruled signatures of prisms-endpoint.json', d.sigs.join(' · '));
  ok(KR.clusters.every(c => { const x = d.clusters.find(y => y.sig === c.questions.join('+')); return x && x.attrs.join('|') === c.attrs.join('|'); }), 'each ruled block owns what m1-homes.js reads from the round-2 cells over the ruled partition');
  ok(JSON.stringify(D.spine) === JSON.stringify(KR.spine), 'the top band is the one the ruled partition gives, not the arithmetic\'s', D.spine.join(','));
  let cb = await cutsBefore();
  ok(cb.ruled === ruledJ && cb.arith === K.cut.index, 'the ladder draws both cuts: his after the joins his blocks hold, the arithmetic\'s after its widest drop', JSON.stringify(cb) + ` vs ruled ${ruledJ} · arith ${K.cut.index}`);

  // the statement: its numbers are the arithmetic's, filled not typed
  const L = K.ladder, nq = QIDS.length, drops = []; for (let i = 1; i < L.length; i++) if (nq - i >= 3 && nq - i <= 14) drops.push({ i, d: +(L[i - 1].sim - L[i].sim).toFixed(3) });
  drops.sort((x, y) => y.d - x.d || x.i - y.i);
  const st = await p.evaluate(() => ({ open: document.getElementById('cut-open').textContent, how: document.getElementById('cut-how').textContent, a: document.querySelector('[data-n="arith"]').textContent, r: document.querySelector('[data-n="ruled"]').textContent, top: document.getElementById('cut-open').getBoundingClientRect().top, m1: document.getElementById('sec-m1').getBoundingClientRect().top }));
  ok(+st.a === K.clusters.length && +st.r === RULED.length && st.open.includes(K.clusters.length + ' blocks') && st.open.includes('holds ' + RULED.length), 'the statement\'s two numbers are the ladder\'s cut and the ruled count', `${st.a} / ${st.r} · ${st.open}`);
  ok(st.how.includes(K.cut.drop.toFixed(3)) && st.how.includes(drops[1].d.toFixed(3)) && st.how.includes('leave ' + (nq - drops[1].i) + ' blocks') && st.how.includes('after ' + ruledJ + ' joins'), 'it names the widest drop, the runner-up\'s and what each leaves, and where his cut stops', st.how.slice(0, 160));
  ok(st.top < st.m1, 'the statement stands above the matrix');
  const mergedSigs = K.clusters.map(c => c.questions).filter(g => !P.blocks[g.join('+')]);
  const lis = await p.locator('#merges li').allTextContents();
  ok(lis.length === mergedSigs.length && mergedSigs.every((g, i) => RQ.filter(r => r.every(q => g.includes(q))).every(r => lis.some(t => t.includes(P.blocks[r.join('+')].name)))), 'the merges the arithmetic made are named from the ruled blocks they hold', lis.join(' / '));
  ok(await p.locator('#cut-pick .pickmark').isVisible(), 'the switch-over-side-by-side choice is marked as my pick');

  // what changed since round 1, counted
  const addedN = INP.attrs.filter(a => !R1IN.attrs.some(x => x.id === a.id)).length, goneIds = IDS.filter(id => !LIVE.has(id));
  const ch = await p.textContent('#cut-changed');
  ok(ch.startsWith(addedN + ' attributes were added') && ch.includes('from ' + R1IN.attrs.length + ' to ' + IDS.length) && await p.locator('#cut-added .chip').count() === addedN, 'what changed is counted from the two inputs, and every added attribute is listed', ch.slice(0, 90));
  ok(await p.getAttribute('#cut-record a', 'href') === 'matrices-endpoint.html', 'the round-1 page is linked as the record');
  ok(await p.locator('.mx .rl[data-gone="true"]').count() === goneIds.length && goneIds.length > 0, 'the rated rows the living inventory dropped are drawn struck', `${await p.locator('.mx .rl[data-gone="true"]').count()} vs ${goneIds.length}`);

  // the switch: the arithmetic's cut, as m1-cluster.js computes it
  const bt = await box('#cutsw1 [data-cut="arith"]'); await p.mouse.move(bt.x + bt.w / 2, bt.y + bt.h / 2); await p.waitForTimeout(150);
  const tt = await p.evaluate(() => { const t = [...document.querySelectorAll('#sec-cut .tip')].find(x => x.getAttribute('data-show') === 'true'); return t ? t.textContent : null; });
  ok(tt && tt.length <= 80, 'a hover on the switch is short, a control\'s', tt);
  await p.click('#cutsw1 [data-cut="arith"]'); await p.waitForTimeout(100);
  d = await drawn();
  ok(d.cut === 'arith' && d.sigs.length === K.clusters.length && K.clusters.every((c, i) => d.sigs[i] === c.questions.join('+') && d.clusters[i].attrs.join('|') === c.attrs.join('|')), 'switched, the drawn blocks and their homes are what m1-cluster.js computes', d.sigs.join(' · '));
  ok(d.bands === K.clusters.filter(c => c.attrs.length).length && await p.locator('.prism .status[data-ruled="false"]').count() === mergedSigs.length, 'the matrix redraws its bands, and each merged card says it is not ruled', `${d.bands} bands`);
  ok(await p.locator('#cutsw2 [data-cut="arith"]').getAttribute('aria-checked') === 'true', 'the second switch follows the first');
  cb = await cutsBefore();
  ok(cb.ruled === ruledJ && cb.arith === K.cut.index, 'and the ladder still draws both cuts in the same places', JSON.stringify(cb));
  await p.locator('#sec-prisms').scrollIntoViewIfNeeded(); await shot(p, 'r2-02-arith-prisms');
  await p.locator('#sec-m1').scrollIntoViewIfNeeded(); await shot(p, 'r2-03-arith-matrix');
  await p.click('#cutsw2 [data-cut="eleven"]'); await p.waitForTimeout(100);
  d = await drawn();
  ok(d.cut === 'eleven' && key(d.sigs) === key(RULED), 'switching back draws his eleven again');
  await p.locator('[data-ord="inv"]').click(); await p.waitForTimeout(100);
  ok(await p.getAttribute('#mx', 'data-order') === 'inv' && await p.locator('.prism').count() === RULED.length && await p.locator('.mx .rl').count() === IDS.length, 'after two redraws the order toggle still works, with nothing drawn twice');
  await p.locator('[data-ord="clu"]').click();
  ok(errs.length === 0, 'no console errors across the switch', errs.slice(0, 2).join(' | '));
}
