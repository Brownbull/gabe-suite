/* probe-gaps.mjs — the leftovers evaluation page's render proof (headless system Chrome via the spike's playwright-core).
     node docs/design/design-context/probe-gaps.mjs [--shots DIR]
   Every assert measures the DRAWN thing against gaps-endpoint.raw.json and the page's own data. Exit 1 on any failure;
   SKIP loudly (exit 0) when chrome or playwright-core is missing. One browser, one page. */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..');
const PAGE = path.join(HERE, 'gaps-endpoint.html'), PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const args = process.argv.slice(2), shotsAt = args.indexOf('--shots') >= 0 ? args[args.indexOf('--shots') + 1] : null;
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
if (shotsAt) fs.mkdirSync(shotsAt, { recursive: true });
const { chromium } = require(PW);
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra !== undefined ? ' — ' + extra : '')); } };
const shot = async (p, name, opts) => { if (shotsAt) await p.screenshot({ path: path.join(shotsAt, name + '.png'), ...(opts || {}) }); };
const RAW = JSON.parse(fs.readFileSync(path.join(HERE, 'gaps-endpoint.raw.json'), 'utf8')).judge;

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } }); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const open = async () => { await p.goto('file://' + PAGE); await p.waitForFunction('!!window.__gaps', { timeout: 15000 }); };
await open(); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await open();
const D = await p.evaluate(() => window.__gaps.data), out = () => p.evaluate(() => document.getElementById('out').value);

// ── 1 · everything the judge ranked is on the page ──────────────────────────
ok(errs.length === 0, 'no console errors', errs.slice(0, 2).join(' | '));
ok(await p.locator('.work').count() === RAW.bundles.length, 'one card per piece of work', await p.locator('.work').count());
const closed = new Set(D.bundles.flatMap(x => x.closes.map(c => c.id))), judged = RAW.items.map(x => x.id);
ok(judged.every(id => closed.has(id)), 'every judged item is closed by some piece of work, none lost', judged.filter(id => !closed.has(id)).join(', '));
for (const bd of D.bundles) {
  const card = p.locator(`.work[data-b="${bd.key}"]`);
  ok(await card.locator('.how .chip').count() === bd.closes.length, `card ${bd.n} keeps the gaps it closes, inside the fold`);
  const fx = bd.fx;
  ok(fx.idea.startsWith(await card.locator('.idea').textContent()) && (await card.locator('.idea').textContent()).length > 8, `card ${bd.n} opens its gain with the idea`);
  ok(await card.locator('.chip.pv').count() === fx.prisms.length && fx.prisms.length > 0, `card ${bd.n} names the points of view it feeds`, await card.locator('.chip.pv').count());
  ok(await card.locator('.flds li').count() === fx.fields.length && await card.locator('.eg li').count() === fx.rows.length && fx.rows.length >= 3, `card ${bd.n} lists the new fields and shows rows of the example endpoint`);
  const marks = await card.locator('.chip.q .cv').evaluateAll(ns => ns.map(n => n.getAttribute('data-c')));
  ok(JSON.stringify(marks) === JSON.stringify(fx.questions.map(q => q.coverage)), `card ${bd.n} marks each question full, half or elsewhere`, marks.join(','));
  if (fx.fields.every(f => f.status === 'new')) ok(fx.rows.every(r => /^would say:/.test(r)), `card ${bd.n} adds facts nothing produces yet, so every example row says "would say"`);
}
const EFFN = { inventory: 1, lab: 2, arm: 3 };
ok(await p.evaluate(E => [...document.querySelectorAll('.work')].every(c => c.querySelectorAll('.meta .eff .st i.on').length === E[window.__gaps.data.bundles.find(x => x.key === c.getAttribute('data-b')).effort]), EFFN), 'the lit steps on each card are its effort');
ok(D.bundles.every((x, i) => i === 0 || EFFN[x.effort] >= EFFN[D.bundles[i - 1].effort]), 'the cards run cheapest first');

// ── 1b · the effect, one by one: recomputed here, then measured on the page ──
{
  const O = D.oneByOne, QS = O.questions.map(q => q.id), touch = new Map(QS.map(q => [q, []]));
  for (const bd of D.bundles) for (const q of bd.fx.questions) touch.get(q.id).push({ n: bd.n, c: q.coverage, needs: q.needs });
  const fullAt = q => { const t = touch.get(q), fulls = t.filter(x => x.c === 'full').map(x => x.n), halves = t.filter(x => x.c === 'half');
    const a = fulls.length ? Math.min(...fulls) : Infinity, h = (halves.length >= 2 || halves.some(x => x.needs)) ? Math.max(...halves.flatMap(x => [x.n, x.needs || 0])) : Infinity; const at = t.length ? Math.min(a, h) : 0; return Number.isFinite(at) ? at : null; };
  const mine = [0, ...D.bundles.map(x => x.n)].map(k => QS.filter(q => fullAt(q) !== null && fullAt(q) <= k).length);
  ok(JSON.stringify(mine) === JSON.stringify(O.running.map(r => r.full.length)), 'the running count of answerable questions matches an independent recomputation', mine.join(' '));
  ok(mine.every((v, i) => i === 0 || v >= mine[i - 1]) && mine[mine.length - 1] > mine[0], 'the count never falls, and it rises over the eleven pieces', mine.join(' → '));
  const drawn = await p.evaluate(() => [...document.querySelectorAll('#obo .cnt')].slice(1).map(n => Number(n.textContent)));
  ok(JSON.stringify(drawn) === JSON.stringify(mine), 'the numbers under the bars are those counts', drawn.join(' '));
  const hs = await p.evaluate(() => [...document.querySelectorAll('#obo .run i')].map(n => n.getBoundingClientRect().height));
  ok(hs.every((hgt, i) => Math.abs(hgt - Math.max(2, Math.round(64 * mine[i] / O.total))) <= 1.5), 'each bar\'s height is its count', hs.map(Math.round).join(' '));
  ok(await p.locator('#obo .pn').count() === O.prisms.length + 1 && O.prisms.length === 11, 'eleven points of view down the side');
  let okCells = true; for (const pr of O.prisms) for (let i = 0; i < pr.cells.length; i++) { const c = pr.cells[i], got = await p.evaluate(({ n, name }) => { const d = [...document.querySelectorAll('#obo .c')].find(x => x.getAttribute('data-p') === name && x.getAttribute('data-n') === String(n)); const m = d && d.querySelector('.cv'); return m ? m.getAttribute('data-c') : null; }, { n: i + 1, name: pr.name }); if ((c ? c.mark : null) !== got) okCells = false; }
  ok(okCells, 'every cell of the matrix wears the mark the data gives it');
  const halfBg = await p.evaluate(() => { const g = s => getComputedStyle(document.querySelector(s)).backgroundImage + '|' + getComputedStyle(document.querySelector(s)).backgroundColor; return [g('.lg .cv[data-c="full"]'), g('.lg .cv[data-c="half"]'), g('.lg .cv[data-c="fact"]')]; });
  ok(new Set(halfBg).size === 3, 'full, half and fact are three different drawings', halfBg.join(' || ').slice(0, 160));
}

// ── 2 · the grid places each piece by its cost and its importance ───────────
for (const bd of D.bundles) {
  const cell = await p.evaluate(k => { const n = document.querySelector(`#grid .num[data-b="${k}"]`), c = n && n.closest('.cellg'); return c ? [c.getAttribute('data-e'), Number(c.getAttribute('data-i'))] : null; }, bd.key);
  ok(cell && cell[0] === bd.effort && cell[1] === bd.imp, `piece ${bd.n} sits in the cell of its effort and importance`, JSON.stringify(cell));
}
ok(await p.locator('#grid .num[data-mine="later"]').count() === D.bundles.filter(x => x.mine !== 'do').length, 'a piece that can wait is drawn hollow');
const fills = await p.evaluate(() => { const g = s => getComputedStyle(document.querySelector(s)).backgroundColor; return [g('#grid .num[data-mine="do"]'), g('#grid .num[data-mine="later"]')]; });
ok(fills[0] !== fills[1] && fills[1] === 'rgba(0, 0, 0, 0)', 'filled against hollow is measured, not assumed', fills.join(' vs '));
await shot(p, 'g-01-top');

// ── 3 · the wrong picture is shown from the lab's own facts ─────────────────
const seqs = await p.evaluate(() => [...document.querySelectorAll('#orders .seq')].map(s => [...s.querySelectorAll('.box')].map(x => x.textContent)));
ok(JSON.stringify(seqs[0]) === JSON.stringify(D.wrong.drawn) && JSON.stringify(seqs[1]) === JSON.stringify(D.wrong.runs) && JSON.stringify(seqs[0]) === JSON.stringify(seqs[1].slice().reverse()), 'the lab\'s order and the run order are both drawn, and one is the other reversed', JSON.stringify(seqs));

// ── 4 · dashed is mine, solid is yours; the text says which ─────────────────
ok(await p.locator('.btn[data-mine="true"]').count() === D.bundles.length + D.attrs.length && await p.locator('.verdict .btn[aria-pressed="true"]').count() === 0, 'at rest every line wears my recommendation dashed, and nothing is pressed');
ok(await p.evaluate(() => getComputedStyle(document.querySelector('.btn[data-mine="true"]')).borderTopStyle) === 'dashed', 'my recommendation is drawn dashed');
ok((await out()).includes(`${D.bundles.length + D.attrs.length} untouched (my recommendation stands)`), 'the text opens with every line untouched', (await out()).split('\n').pop());
const b1 = D.bundles[0], a1 = D.attrs.find(a => a.mine === 'drop'), card1 = p.locator(`.work[data-b="${b1.key}"]`), rowA = p.locator(`.row[data-a="${a1.id}"]`);
await card1.locator('.verdict .btn', { hasText: 'Later' }).click();
ok((await out()).includes(`${b1.n} ${b1.name}: later (yours, I said ${b1.mine})`), 'a verdict that differs says what I had said', (await out()).split('\n')[2]);
ok(await card1.locator('.state').textContent() === 'yours · I said do it', 'and the card says it too', await card1.locator('.state').textContent());
await rowA.locator('.verdict .btn', { hasText: 'Keep' }).click();
ok(await rowA.locator('.note').isHidden(), 'a note stays folded until asked for — measured as drawn');
await rowA.locator('.nb').click(); await rowA.locator('.note').fill('useful in my head');
ok((await out()).includes(`${a1.label}: keep (yours, I said drop) | useful in my head`), 'an attribute verdict carries its note');
await card1.locator('.verdict .btn', { hasText: 'Later' }).click();
ok(await card1.getAttribute('data-state') === 'mine' && (await out()).includes(`${b1.n} ${b1.name}: ${b1.mine} (mine, untouched)`), 'pressing a verdict again hands the line back to me');
const before = await out(); await open(); ok(await out() === before, 'a reload keeps verdicts and notes');
ok(await rowA.locator('.note').isVisible() && await rowA.locator('.note').inputValue() === 'useful in my head', 'a written note is shown again after a reload');
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('gabe:gaps:endpoint-card')); s.v['a-piece-that-is-gone'] = { v: 'drop', n: 'x' }; localStorage.setItem('gabe:gaps:endpoint-card', JSON.stringify(s)); });
await open(); ok(await out() === before, 'a verdict on something that no longer exists is dropped');

// ── 5 · the fold, hovers, floor, widths, theme, copy, clear ─────────────────
const c3 = p.locator('.work').nth(2); ok(await c3.locator('.how').isHidden(), 'the technical detail starts folded — measured as drawn');
await c3.locator('.fold').click(); ok(await c3.locator('.how').isVisible() && (await c3.locator('.how').textContent()).length > 80, 'and "How" opens it');
const tipState = () => p.evaluate(() => { const t = [...document.querySelectorAll('.tip')].find(x => x.getAttribute('data-show') === 'true'); if (!t) return null; const r = t.getBoundingClientRect(); return { text: t.textContent, top: r.top, bottom: r.bottom, fs: parseFloat(getComputedStyle(t).fontSize) }; });
const vb = card1.locator('.verdict .btn').first(); await vb.scrollIntoViewIfNeeded(); const bb = await vb.boundingBox();
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(200); let t = await tipState();
ok(t && t.text === D.ui.do && !/[.!?]\s+[A-Z]/.test(t.text) && t.fs >= 12 && (t.bottom <= bb.y + bb.height / 2 || t.top >= bb.y + bb.height / 2 + 1), 'a button\'s hover is one short sentence, off the pointer, on the 12px floor', t && t.text);
await p.mouse.move(5, 5);
const floor = await p.evaluate(() => { let min = 99, who = ''; document.querySelectorAll('.artifact-page *').forEach(n => { if (!n.offsetParent) return; const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!own && !/INPUT|TEXTAREA/.test(n.tagName)) return; const f = parseFloat(getComputedStyle(n).fontSize); if (f < min) { min = f; who = n.className || n.tagName; } }); return { min, who }; });
ok(floor.min >= 12, 'no text under 12px', `${floor.min}px on .${floor.who}`);
for (const w of [1920, 1280, 390]) { await p.setViewportSize({ width: w, height: 900 }); const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 1, `no horizontal page scroll at ${w}px`, o); }
await shot(p, 'g-03-phone'); await p.setViewportSize({ width: 1920, height: 1080 });
const col = await p.evaluate(() => { const r = document.querySelector('.artifact-page').getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right }; });
ok(Math.abs(col.left - col.right) < 20 && col.left > 100, 'the column is centred on a wide screen');
ok(await p.locator('#af-motion').count() === 0 && await p.locator('#af-fonts .af-opt').count() >= 2, 'a page that does not move offers no Motion option, and the font roster still works');
const lightBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); await p.emulateMedia({ colorScheme: 'dark' });
ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) !== lightBg, 'dark paints a different ground'); await shot(p, 'g-04-dark'); await p.emulateMedia({ colorScheme: 'light' });
await p.locator('#sec-works').scrollIntoViewIfNeeded(); await shot(p, 'g-02-works');
await p.locator('#sec-obo').scrollIntoViewIfNeeded(); await shot(p, 'g-06-one-by-one');
await p.locator('#sec-attrs').scrollIntoViewIfNeeded(); await shot(p, 'g-05-attrs');
await p.click('#copy'); await p.waitForFunction(() => document.getElementById('said').textContent.length > 0, { timeout: 4000 }).catch(() => {});
const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => null)), said = await p.textContent('#said');
ok(clip === null ? /^(Copied|Select)/.test(said) : clip === await out(), 'Copy puts the ruling on the clipboard', clip === null ? said : 'differs');
await p.click('#reset'); ok(await p.getAttribute('#reset', 'data-armed') === 'true' && (await out()).includes('useful in my head'), 'the first press on Clear only arms it');
await p.click('#reset'); ok(!(await out()).includes('useful in my head') && (await out()).includes(`${D.bundles.length + D.attrs.length} untouched`), 'the second press clears every verdict');
ok(errs.length === 0, 'no console errors by the end', errs.slice(0, 2).join(' | '));
await b.close(); console.log(`probe-gaps: ${pass} passed · ${fail} failed`); process.exit(fail ? 1 : 0);
