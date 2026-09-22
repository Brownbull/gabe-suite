/* probe-brainmap.mjs — the brain map's render proof (headless system Chrome via the spike's playwright-core).

     node docs/design/design-context/probe-brainmap.mjs [--shots DIR]

   Every assert MEASURES what is drawn against numbers this file computes for itself from the page's own data —
   never against a number the page prints. Node counts are recomputed here from attrs/blocks/groups/sections;
   overlap is measured on real boxes; the rotation claim is checked by turning C back and comparing to A.
   Exit 1 on any failure; SKIP loudly (exit 0) when chrome or playwright-core is missing. One browser, one page. */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..');
const args = process.argv.slice(2);
const pageArg = args.indexOf('--page') >= 0 ? args[args.indexOf('--page') + 1] : 'brainmap-endpoint.html';
const PAGE = path.isAbsolute(pageArg) ? pageArg : path.join(HERE, pageArg);
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const shotsAt = args.indexOf('--shots') >= 0 ? args[args.indexOf('--shots') + 1] : null;
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
if (shotsAt) fs.mkdirSync(shotsAt, { recursive: true });
const { chromium } = require(PW);
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra !== undefined ? ' — ' + extra : '')); } };
const shot = async (p, name, opts) => { if (shotsAt) await p.screenshot({ path: path.join(shotsAt, name + '.png'), ...(opts || {}) }); };

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const open = async (fresh) => { await p.goto('file://' + PAGE); await p.waitForFunction('!!window.__bm', { timeout: 15000 });
  /* the page REMEMBERS its rails in localStorage, so a probe that does not clear them tests whatever the last case left —
     every reading below is of the page as it ARRIVES, unless a case deliberately sets a rail first */
  if (fresh !== false) { await p.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/^gabe/.test(k) || /brainmap/i.test(k)) localStorage.removeItem(k); } catch (e) {} });
    await p.reload(); await p.waitForFunction('!!window.__bm', { timeout: 15000 }); }
  /* wait for the LAYOUT and for the page to SETTLE, never for a guessed number of milliseconds: the map ships "still" so it
     cannot animate on arrival, and releases that two frames later — reading in between catches a page mid-boot */
  await p.waitForFunction(() => { const n = document.querySelector('#plane .node'), pl = document.getElementById('plane');
    return !!n && !!n.style.left && (!window.MOTION || !window.MOTION.on || !pl.classList.contains('still')); }, { timeout: 15000 });
  await p.waitForTimeout(160); };
await open(); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await open();
const D = await p.evaluate(() => window.__bm.data);

/* ── the numbers this probe owns: what the tree MUST hold, recomputed here ── */
const A = Object.fromEntries(D.attrs.map(a => [a.id, a]));
const BL = Object.fromEntries(D.blocks.map(x => [x.key, x]));
const branchesFor = (grp) => grp === 'flat' ? D.blocks.map(x => 'block:' + x.key).concat(D.added.length ? ['added:x'] : [])
  : grp === 'standpoint' ? D.groups.map(g => 'group:' + g.key).concat(D.added.length ? ['added:x'] : [])
  : D.sections.map(s => 'sec:' + s.key);
const kidsOf = (pkey, grp, spine) => {                       /* what a branch must draw when it is open */
  const inBand = spine === 'band' ? new Set(D.spine) : new Set();
  if (pkey.startsWith('block:')) { const bk = BL[pkey.slice(6)];
    return bk.attrs.filter(i => !inBand.has(i)).length + (spine === 'band' ? 0 : bk.spine.length); }
  if (pkey.startsWith('group:')) return D.groups.find(g => 'group:' + g.key === pkey).blocks.length;
  if (pkey.startsWith('sec:')) return D.sections.find(s => 'sec:' + s.key === pkey).attrs.filter(i => !inBand.has(i)).length;
  if (pkey === 'added:x') return D.added.filter(i => !inBand.has(i)).length;
  return 0;
};
const expectNodes = (grp, spine, open) => {
  const br = branchesFor(grp);
  let n = 1 + br.length + (spine === 'band' ? D.spine.length : 0);
  for (const k of open) if (br.indexOf(k) >= 0) n += kidsOf(k, grp, spine);   /* level 3 only, the cap holds the rest */
  return n;
};
const set = async (rail, id) => { await p.locator(`#rail .opt[data-${rail}="${id}"]`).click(); await p.waitForTimeout(700); };
const drawn = () => p.locator('#plane .node, #plane .nb');
const boxes = () => p.evaluate(() => [...document.querySelectorAll('#plane .node')].map(n => { const r = n.getBoundingClientRect();
  return { k: n.getAttribute('data-pkey'), d: +n.getAttribute('data-depth'), x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }));
const overlaps = (bs) => { const out = []; for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
  const a = bs[i], c = bs[j];
  if (a.x < c.x + c.w - 0.5 && c.x < a.x + a.w - 0.5 && a.y < c.y + c.h - 0.5 && c.y < a.y + a.h - 0.5) out.push(a.k + ' / ' + c.k); } return out; };

// ── 1 · it boots on the finished picture, with the whole first level drawn ──
ok(errs.length === 0, 'no console errors', errs.slice(0, 2).join(' | '));
ok(D.attrs.length > 10 && D.blocks.length > 1 && D.spine.length > 0, 'the page carries a real inventory, so no count below is vacuously true',
  `${D.attrs.length} attributes · ${D.blocks.length} blocks · ${D.spine.length} shared`);
ok(await drawn().count() === expectNodes('flat', 'nodes', []), 'closed, the map draws the root and one node per branch',
  `${await drawn().count()} vs ${expectNodes('flat', 'nodes', [])}`);
ok(await p.evaluate(() => document.getElementById('plane').classList.contains('still')) === false
  && await p.evaluate(() => { const n = document.querySelector('#plane .node'); return n.style.left === getComputedStyle(n).left; }),
  'it opens on the finished picture: every node is already at its final place');
{ const names = await p.evaluate(() => [...document.querySelectorAll('#plane .node[data-kind="block"] .nm')].map(n => n.textContent.trim()));
  ok(D.blocks.every(x => names.indexOf(x.name) >= 0), 'every ruled block has a node of its own', `${names.length} drawn`); }
{ const rootSub = await p.textContent('#plane .node[data-kind="root"] .sub');
  ok(rootSub.indexOf(String(D.attrs.length)) >= 0 && rootSub.indexOf(String(D.blocks.length)) >= 0, 'the root says how much it holds', rootSub); }
await shot(p, 'b-01-upright');

// ── 2 · opening a node: its panel, its lit branch, the sweep ────────────────
const bk = D.blocks.slice().sort((x, y) => (y.attrs.length + y.spine.length) - (x.attrs.length + x.spine.length))[0];
const sel = k => `#plane .node[data-pkey="${k}"]`;
await p.click(sel('block:' + bk.key)); await p.waitForTimeout(700);
ok(await p.locator('#tray .pan').count() === 1 && await p.getAttribute('#tray .pan', 'data-pkey') === 'block:' + bk.key,
  'clicking a node puts exactly its panel in the tray', await p.locator('#tray .pan').count());
ok(await drawn().count() === expectNodes('flat', 'nodes', ['block:' + bk.key]), 'and its attributes appear under it, all of them',
  `${await drawn().count()} vs ${expectNodes('flat', 'nodes', ['block:' + bk.key])}`);
ok(await p.getAttribute(sel('block:' + bk.key), 'data-lit') === 'true' && await p.getAttribute(sel('root'), 'data-lit') === 'true',
  'the whole path from the root to it is lit');
ok(await p.evaluate(() => [...document.querySelectorAll('#wires .wire[data-lit="true"]')].length) >= 1, 'and the wire along that path is lit too');
ok(await p.locator('#sweep path').count() === 2, 'the sweep draws the bracket round the tray and one curve into it', await p.locator('#sweep path').count());
{ /* the curve JOINS the node to ITS panel — it used to swing past the tray's right edge and land on the tray's corner,
     which read as a loop around the page. What matters is not that it is long but that both of its ends are real things. */
  const sw = await p.evaluate(() => { const ps = [...document.querySelectorAll('#sweep path')].filter(x => !x.classList.contains('brk'));
    if (!ps.length) return null; const r = ps[0].getBoundingClientRect();
    const lit = document.querySelector('.node[data-lit="true"][aria-pressed="true"]') || document.querySelector('.node[aria-pressed="true"]');
    const pan = document.querySelector('#tray .pan'), stage = document.querySelector('.stage').getBoundingClientRect();
    if (!lit || !pan) return null; const nb = lit.getBoundingClientRect(), pb = pan.getBoundingClientRect();
    return { w: r.width, startsAtNode: Math.abs(r.left - nb.right) <= 3, endsAtPanel: Math.abs(r.right - pb.left) <= 3,
             withinStage: r.left >= stage.left - 2 && r.right <= stage.right + 2, tall: r.height }; });
  ok(sw && sw.startsAtNode, 'the curve starts at the node that was opened', JSON.stringify(sw));
  ok(sw && sw.endsAtPanel, 'and ends at ITS panel, not at the tray\'s corner', JSON.stringify(sw));
  ok(sw && sw.withinStage, 'and never leaves the stage on the way — no loop around the page', JSON.stringify(sw)); }
{ /* what a click DOES: his ask of 2026-09-22 — the move, what it puts in front of you, and which region answers */
  const mv = await p.evaluate(() => { const D = window.BM_DATA, rows = [...document.querySelectorAll('#tray .pan .mv')];
    const kinds = Object.keys(D.acts.kinds), wheres = Object.values(D.acts.where).map((w) => w.name);
    return { n: rows.length, want: 1 + ((D.acts.byNode.block || {}).offers || []).length,
      first: rows[0] ? rows[0].getAttribute('data-role') + '/' + rows[0].getAttribute('data-act') : null,
      filterRow: rows.some((r) => r.getAttribute('data-act') === 'filter'),
      filterLine: [...document.querySelectorAll('#tray .pan .mvn')].some((n) => n.textContent === D.acts.filterLine),
      named: rows.every((r) => r.querySelector('b') && kinds.some((k) => D.acts.kinds[k].name === r.querySelector('b').textContent)),
      where: rows.every((r) => r.querySelector('.mvr') && wheres.indexOf(r.querySelector('.mvr').textContent) >= 0),
      icons: rows.every((r) => !!r.querySelector('.mvi svg')), said: !!document.querySelector('#tray .pan .mvn') }; });
  ok(mv.n === mv.want && mv.n > 0, 'an opened block says every move it offers', `${mv.n} vs ${mv.want}`);
  ok(mv.named && mv.icons, 'each move carries its own mark and its own verb', JSON.stringify(mv));
  ok(mv.where, 'and names WHICH REGION answers it — the middle, the portrait, the map itself or here', JSON.stringify(mv));
  ok(mv.said, 'and the panel says out loud that these are proposed, not built', String(mv.said));
  /* option C (D-022): a click always SHOWS; Keep only is never a move a click makes */
  ok(mv.first === 'click/select', 'the panel leads with what the click does, and a click SHOWS', mv.first);
  ok(!mv.filterRow && mv.filterLine, 'Keep only is not among the moves, and a line says filtering is its own control', JSON.stringify(mv));
  const kinds = Object.entries(D.acts.byNode).filter(([k]) => k[0] !== '_');
  ok(kinds.length >= 5 && kinds.every(([, m]) => m.click && m.click.act === 'select' && (m.offers || []).every((o) => o.act !== 'filter')),
    'for EVERY kind of node the click is Show, and no kind offers Keep only as a move', kinds.map(([k, m]) => k + ':' + (m.click && m.click.act)).join(' ')); }
await shot(p, 'b-02-open');
{ const n2 = D.blocks.filter(x => x.key !== bk.key)[0];
  await p.click(sel('block:' + n2.key)); await p.waitForTimeout(700);
  const order = await p.evaluate(() => [...document.querySelectorAll('#tray .pan')].map(n => n.getAttribute('data-pkey')));
  ok(order.join('|') === ['block:' + bk.key, 'block:' + n2.key].join('|'), 'the tray holds what is open, in the order it was opened', order.join(' · ')); }
await p.click(sel('block:' + bk.key)); await p.waitForTimeout(700);
ok(await p.locator('#tray .pan').count() === 1 && await p.getAttribute('#tray .pan', 'data-pkey') !== 'block:' + bk.key, 'clicking the same node again closes it');
await p.click('#closeall'); await p.waitForTimeout(600);
ok(await p.locator('#tray .pan').count() === 0 && await p.locator('#sweep path').count() === 1, 'with nothing open the curve is gone and only the bracket stays');

// ── 3 · a shared attribute is shared, never one branch's property ───────────
{ const s = D.spine[0], owners = A[s].spineBlocks;
  ok(owners.length >= 2, 'the first shared attribute really is needed by more than one block', owners.join(','));
  for (const o of owners.slice(0, 2)) { await p.click(sel('block:' + o)); await p.waitForTimeout(500); }
  const shown = await p.evaluate(id => [...document.querySelectorAll('#plane .node[data-pkey="attr:' + id + '"]')].length, s);
  ok(shown === 2, 'opened from two blocks, a shared attribute is drawn in both', shown);
  ok(await p.evaluate(id => [...document.querySelectorAll('#plane .node[data-pkey="attr:' + id + '"]')].every(n => n.getAttribute('data-shared') === 'true'), s),
    'and both copies are marked shared');
  ok(await p.locator('#tray .pan').count() === 2, 'two blocks open means two panels, not three');
  await p.click('#closeall'); await p.waitForTimeout(500);
  await set('spine', 'band');
  ok(await drawn().count() === expectNodes('flat', 'band', []), 'as a band, every shared attribute is drawn once under the root',
    `${await drawn().count()} vs ${expectNodes('flat', 'band', [])}`);
  ok(await p.evaluate(() => [...document.querySelectorAll('#wires .wire[data-kind="share"]')].length) === D.spine.reduce((s2, id) => s2 + A[id].spineBlocks.length, 0),
    'and one faint wire runs from it to every block that needs it');
  await shot(p, 'b-03-band');
  await set('spine', 'nodes'); }

// ── 4 · the depth cap, stated and obeyed ────────────────────────────────────
await set('grp', 'standpoint');
{ const g = D.groups.find(x => x.blocks.length >= 1);
  await p.click(sel('group:' + g.key)); await p.waitForTimeout(700);
  ok(await drawn().count() === expectNodes('standpoint', 'nodes', ['group:' + g.key]), 'grouped, the first level is the standpoints and the blocks sit under them',
    `${await drawn().count()} vs ${expectNodes('standpoint', 'nodes', ['group:' + g.key])}`);
  const b2 = g.blocks[0];
  await p.click(sel('block:' + b2)); await p.waitForTimeout(700);
  const deeper = BL[b2].attrs.length + BL[b2].spine.length;
  ok(await p.evaluate(() => [...document.querySelectorAll('#plane .node[data-depth="3"]')].length) === 0, 'nothing is drawn on a fourth level');
  ok(await p.evaluate(id => [...document.querySelectorAll('#plane .node[data-pkey^="attr:"]')].length, b2) === 0, 'so the block\'s attributes are not drawn at all');
  const deep = await p.textContent('#deep');
  ok(await p.evaluate(() => !document.getElementById('deep').hidden) && deep.indexOf(String(deeper)) >= 0,
    'and the page says how many are waiting in the panel instead', deep);
  ok(await p.locator('#tray .pan[data-pkey="block:' + b2 + '"] li').count() === deeper, 'the panel really lists every one of them',
    `${await p.locator('#tray .pan[data-pkey="block:' + b2 + '"] li').count()} vs ${deeper}`);
  await shot(p, 'b-04-depth');
  await p.click('#closeall'); await p.waitForTimeout(500); }
await set('grp', 'section');
ok(await drawn().count() === expectNodes('section', 'nodes', []), 'by section, the first level is the inventory\'s own groups',
  `${await drawn().count()} vs ${expectNodes('section', 'nodes', [])}`);
{ const s = D.sections[0]; await p.click(sel('sec:' + s.key)); await p.waitForTimeout(700);
  ok(await drawn().count() === expectNodes('section', 'nodes', ['sec:' + s.key]), 'and a section opens onto its own attributes');
  await p.click('#closeall'); await p.waitForTimeout(500); }
{ /* what a BRANCH'S NUMBER counts, read off the drawn subs under EVERY grouping the rail offers. The take used to say
     "the attributes it holds", which a stage row never says: it counts BLOCKS, and a row holding none says so in words. */
  const readSubs = () => p.evaluate(() => [...document.querySelectorAll('#plane .node[data-depth="1"]')]
    .map(n => ({ k: n.getAttribute('data-pkey'), sub: ((n.querySelector('.sub') || {}).textContent || '').trim() })));
  const unit = { flat: 'attribute', standpoint: 'attribute', section: 'attribute', stage: 'block' };
  const GR = ['flat', 'standpoint', 'section', 'stage'], seen = {};
  for (const g of GR) { await set('grp', g); const subs = await readSubs();
    seen[g] = { n: subs.length, counted: subs.filter(s => /^\d+ /.test(s.sub)),
      wrong: subs.filter(s => /^\d+ /.test(s.sub) && s.sub.replace(/^\d+ /, '').replace(/s$/, '') !== unit[g]).map(s => s.k + ' “' + s.sub + '”'),
      wordy: subs.filter(s => !/^\d+ /.test(s.sub)).map(s => s.k + ' “' + s.sub + '”') }; }
  ok(GR.every(g => seen[g].n > 1 && seen[g].counted.length > 0 && seen[g].wrong.length === 0),
    'a branch\'s number counts attributes under Flat, By standpoint and By section, and blocks under By stage — read off every drawn sub',
    GR.map(g => g + ': ' + (seen[g].wrong.join(' ') || seen[g].counted.length + ' counted')).join(' · '));
  /* and the OTHER half of the same sentence: a row holding none of them says so in words, which no other grouping does */
  await p.click('#rail .opt[data-srule="one"]'); await p.waitForTimeout(600);
  const oneSubs = await (() => p.evaluate(() => [...document.querySelectorAll('#plane .node[data-depth="1"]')]
    .map(n => ({ k: n.getAttribute('data-pkey'), sub: ((n.querySelector('.sub') || {}).textContent || '').trim() }))))();
  const empty = oneSubs.filter(s => !/^\d+ /.test(s.sub));
  ok(empty.length > 0 && empty.every(s => s.sub && !/\d/.test(s.sub)) && ['flat', 'standpoint', 'section'].every(g => seen[g].wordy.length === 0),
    'and a By stage row that holds no block says so in words instead of a number, which no other grouping ever does',
    empty.map(s => s.k + ' “' + s.sub + '”').join(' · ') || 'no wordy row');
  await p.click('#rail .opt[data-srule="every"]'); await p.waitForTimeout(600); }
await set('grp', 'flat');

// ── 5 · every placement draws the same nodes, and none of them overlap ──────
const geom = {}, byDepth = {};
for (const lay of ['A', 'B', 'C', 'D']) {
  await set('lay', lay);
  const bs = await boxes(), over = overlaps(bs);
  ok(bs.length === expectNodes('flat', 'nodes', []), `${lay} draws the same nodes as every other placement`, `${bs.length} vs ${expectNodes('flat', 'nodes', [])}`);
  ok(over.length === 0, `${lay} draws no two nodes on top of each other`, over.slice(0, 3).join(' | '));
  const fit = await p.evaluate(() => { const pl = document.getElementById('plane'), r = pl.getBoundingClientRect();
    return [...document.querySelectorAll('#plane .node')].every(n => { const b2 = n.getBoundingClientRect();
      return b2.left >= r.left - 1 && b2.right <= r.right + 1 && b2.top >= r.top - 1 && b2.bottom <= r.bottom + 1; }); });
  ok(fit, `${lay} keeps every node inside the pane it scrolls, so nothing is cut off`);
  geom[lay] = Object.fromEntries(bs.map(x => [x.k, { cx: x.cx - bs.find(y => y.k === 'root').cx, cy: x.cy - bs.find(y => y.k === 'root').cy }]));
  bs.forEach(x => { byDepth[x.k] = x.d; });
  await shot(p, 'b-05-' + lay);
}
/* C is A SPREAD by one factor and then turned (tpl place()), so the claim has two halves: the turn is uniform, and the
   factor is one number for every node. `factorOf` measures that factor off two drawn layouts, whatever is open. */
const rotBack = (gA, gC) => { const th = -D.rotDeg * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const keys = Object.keys(gA).filter(k => k !== 'root' && gC[k]);
  const ks = keys.map(k => { const c = gC[k], x = c.cx * cs - c.cy * sn, y = c.cx * sn + c.cy * cs, a = gA[k];
    const na = Math.hypot(a.cx, a.cy); return na < 1 ? null : Math.hypot(x, y) / na; }).filter(x => x !== null);
  return { keys, ks, k0: ks[0], spread: Math.max(...ks) - Math.min(...ks) }; };
{ /* the rotation claim, CLOSED: turn C back by the page's own angle and it is A, at one scale — and that scale is none */
  const r = rotBack(geom.A, geom.C), k0 = r.k0, spread = r.spread;
  ok(r.keys.length > 3 && spread < 0.02 * k0, `turning ${D.rotDeg}° back off C gives Upright again, at one scale`, `scale ${k0 ? k0.toFixed(3) : '—'} · spread ${spread.toFixed(4)}`);
  ok(Math.abs(k0 - 1) < 0.004, 'and closed, that scale is no spread at all: C is Upright turned, every distance unchanged', `factor ${k0.toFixed(4)}`);
  const ang = r.keys.map(k => { const c = geom.C[k], a = geom.A[k]; if (Math.hypot(a.cx, a.cy) < 1) return null;
    let d = Math.atan2(c.cy, c.cx) - Math.atan2(a.cy, a.cx); while (d < -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI; return d * 180 / Math.PI; }).filter(x => x !== null);
  ok(ang.every(d => Math.abs(d - D.rotDeg) < 0.6), `and every node moved by the same ${D.rotDeg}°, none by a different amount`, `${Math.min(...ang).toFixed(2)}…${Math.max(...ang).toFixed(2)}`);
  const down = Object.keys(geom.A).filter(k => k !== 'root').every(k => geom.A[k].cy > 0);
  ok(down, 'Upright really hangs down from the root');
  /* the DEPTH direction is what the sketch is about: where the next level sits relative to the one above it */
  const mid = (g, d) => { const ks = Object.keys(g).filter(k => byDepth[k] === d); return { x: ks.reduce((s, k) => s + g[k].cx, 0) / ks.length, y: ks.reduce((s, k) => s + g[k].cy, 0) / ks.length, n: ks.length }; };
  const mA = mid(geom.A, 1), mC = mid(geom.C, 1);
  ok(mA.n > 2 && mA.y > 0 && Math.abs(mA.x) < mA.y, 'in Upright the level under the root sits straight below it', `${Math.round(mA.x)},${Math.round(mA.y)} over ${mA.n} nodes`);
  ok(mC.n > 2 && mC.x < 0 && mC.y > 0, 'and in As-sketched that same level sits DOWN and to the LEFT, the way the sketch runs', `${Math.round(mC.x)},${Math.round(mC.y)}`);
  ok(Math.abs(Math.atan2(mC.y, -mC.x) * 180 / Math.PI - 45) < 8, 'at about 45° off the horizontal, which is the diagonal he drew', (Math.atan2(mC.y, -mC.x) * 180 / Math.PI).toFixed(1) + '°'); }
{ /* the same claim with a BRANCH OPEN — the state the reader works in, and the one the closed reading never saw.
     place() spreads C by the smallest factor that keeps the turned boxes clear, so open the crowdedest branch and the
     factor leaves 1. What the page SAYS about it is read off the C card and More information and matched to the factor
     measured here from the two drawn layouts — never to a number typed in the words file. */
  const big = D.blocks.slice().sort((x, y) => (y.attrs.length + y.spine.length) - (x.attrs.length + x.spine.length))[0];
  const g2 = {};
  for (const lay of ['A', 'C']) { await set('lay', lay);
    if (await p.getAttribute(sel('block:' + big.key), 'data-open') !== 'true') { await p.click(sel('block:' + big.key)); await p.waitForTimeout(700); }
    const bs = await boxes(), r0 = bs.find(y => y.k === 'root');
    g2[lay] = Object.fromEntries(bs.map(x => [x.k, { cx: x.cx - r0.cx, cy: x.cy - r0.cy }])); }
  const ro = rotBack(g2.A, g2.C);
  ok(ro.keys.length > 3 && ro.spread < 0.02 * ro.k0, `with ${big.name} open, turning ${D.rotDeg}° back off C is still Upright at ONE scale for every node`,
    `factor ${ro.k0.toFixed(4)} · spread ${ro.spread.toFixed(4)} over ${ro.ks.length} nodes`);
  ok(ro.k0 > 1.004, 'and open, that factor is a real spread: C stands further off the root than Upright does', `factor ${ro.k0.toFixed(4)}`);
  const said = await p.evaluate(() => ({ card: document.querySelector('[data-line2="C"]').textContent,
    more: [...document.querySelectorAll('#more-body p')].map(n => n.textContent).join(' '), ext: window.__bm.extents().C }));
  ok(Math.abs(said.ext.scale - ro.k0) < 0.01, 'the factor the page computes for C is the factor it actually drew', `page ${said.ext.scale.toFixed(4)} · drawn ${ro.k0.toFixed(4)}`);
  const now = said.ext.scale.toFixed(2) + '×', closed = said.ext.closedScale.toFixed(2) + '×';
  ok(said.card.indexOf(now) >= 0 && said.card.indexOf(closed) >= 0 && said.more.indexOf(now) >= 0 && said.more.indexOf(closed) >= 0,
    'and the C card and More information both print THAT factor and the closed one, neither of them typed', `now ${now} · closed ${closed}`);
  ok(!/\{\w+\}/.test(said.card) && !/\{\w+\}/.test(said.more), 'with no token left unfilled in either of them', said.card.slice(0, 80));
  await p.click('#closeall'); await p.waitForTimeout(600);
  const back = await p.evaluate(() => window.__bm.extents().C);
  ok(Math.abs(back.scale - back.closedScale) < 1e-6 && Math.abs(back.closedScale - 1) < 0.004,
    'and with the branch closed again the two factors the page names are the same, and that is no spread',
    `${back.scale.toFixed(4)} vs ${back.closedScale.toFixed(4)}`);
  await set('lay', 'A'); }
{ const right = Object.keys(geom.B).filter(k => k !== 'root').every(k => geom.B[k].cx > 0);
  ok(right, 'Sideways really grows to the right of the root');
  const rad = Object.keys(geom.D).filter(k => k !== 'root');
  ok(rad.some(k => geom.D[k].cy < 0) && rad.some(k => geom.D[k].cy > 0), 'Radial really puts branches above the root as well as below it'); }
await set('lay', 'E');
{ const n = await p.locator('#plane .ind .nb').count();
  ok(n === expectNodes('flat', 'nodes', []), 'Indented lists exactly the same nodes and draws nothing', `${n} vs ${expectNodes('flat', 'nodes', [])}`);
  ok(await p.locator('#plane svg.wires path').count() === 0, 'with no wires at all');
  await p.locator('#plane .ind .nb').nth(1).click(); await p.waitForTimeout(500);
  ok(await p.locator('#tray .pan').count() === 1, 'and a line in it opens a panel just like a node does');
  await p.click('#closeall'); await p.waitForTimeout(400); await shot(p, 'b-06-indented'); }
await set('lay', 'A');
{ const m = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-meas]')].map(n => [n.getAttribute('data-meas'), n.textContent])));
  const ext = await p.evaluate(() => window.__bm.extents());
  ok(['A', 'B', 'C', 'D'].every(k => m[k].indexOf(String(ext[k].w)) >= 0 && m[k].indexOf(String(ext[k].h)) >= 0),
    'each card\'s measured line is the size that placement actually lays out', m.A);
  ok(await p.evaluate(() => [...document.querySelectorAll('#take-options li')].every(n => !/\{\w+\}/.test(n.textContent))), 'and no token is left unfilled in the takes'); }
{ /* the section's own count is a count of the PAGE, so it is measured against the placements the page draws */
  const title = await p.textContent('#t-options'), n = +((title.match(/\b(\d+)\b/) || [])[1]);
  const cards = await p.locator('#cards .card').count(), opts = await p.locator('#rail .opt[data-lay]').count();
  ok(n > 1 && n === cards && n === opts, 'the placements section counts the placements the page actually draws — the cards and the rail agree with its title',
    `title “${title}” · ${cards} cards · ${opts} on the rail`); }
{ /* What it draws: its caption used to say every count was measured from the inventory. The FIRST is the level cap the
     page carries, and the LAST counts attributes the living inventory has no row for — so the sources really do differ,
     and those are the two the caption now has to name apart. Both are measured here, off the drawn panels. */
  const bigs = await p.evaluate(() => [...document.querySelectorAll('#facts .big')].map(n => n.textContent.trim()));
  const texts = await p.evaluate(() => [...document.querySelectorAll('#facts .panel p')].map(n => n.textContent));
  const labels = new Set(D.attrs.map(a => a.label));
  const gone = (texts[texts.length - 1].match(/“[^”]+”/g) || []).map(s => s.slice(1, -1));
  ok(bigs.length > 3 && bigs[0] === String(D.maxDepth + 1), 'the first count in What it draws is the level cap the page carries, not a count of the inventory',
    `${bigs[0]} vs the page's own cap ${D.maxDepth + 1}`);
  ok(gone.length > 0 && gone.length === +bigs[bigs.length - 1] && gone.every(l => !labels.has(l)),
    'and its last count is of attributes the living inventory has no row for — every one of them named, and none of them in it',
    `${bigs[bigs.length - 1]} claimed · ${gone.length} named · in the inventory: ${gone.filter(l => labels.has(l)).join(', ') || 'none'}`); }
{ /* the standpoint question: which standpoints more than a single block really shares, recomputed here from the groups */
  const qs = await p.evaluate(() => document.getElementById('qs').innerText), UNNAMED = 'named by none';
  const shared = D.groups.filter(g => g.blocks.length > 1 && g.name !== UNNAMED)
    .map(g => '“' + g.name + '” (' + g.blocks.map(k => BL[k].name).join(' · ') + ')').join('; ');
  ok(shared.length > 0 && qs.indexOf(shared) >= 0 && qs.indexOf('“' + UNNAMED + '”') < 0,
    'the standpoint question names exactly the standpoints more than a single block shares, and never the bucket for the blocks no standpoint names', shared); }

// ── 6 · keyboard: reachable and operable without the mouse ──────────────────
await p.evaluate(() => document.querySelector('#plane .node[data-kind="root"]').focus());
await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
ok(await p.evaluate(() => document.activeElement.getAttribute('data-depth')) === '1', 'Down moves from the root to the level under it',
  await p.evaluate(() => document.activeElement.getAttribute('data-pkey')));
const k1 = await p.evaluate(() => document.activeElement.getAttribute('data-pkey'));
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
ok(await p.evaluate(() => document.activeElement.getAttribute('data-pkey')) !== k1, 'Right moves along that level');
await p.keyboard.press('Enter'); await p.waitForTimeout(700);
ok(await p.locator('#tray .pan').count() === 1, 'Enter opens the focused node');
await p.keyboard.press('Escape'); await p.waitForTimeout(600);
ok(await p.locator('#tray .pan').count() === 0, 'Escape closes the last one opened');
ok((await p.textContent('#keys')).length > 40 && await p.locator('#keys kbd').count() >= 4, 'and the page says how, in keys you can see');

// ── 7 · hovers: short on a control, richer on an element, plain line last ───
const tipState = () => p.evaluate(() => { const t = document.querySelector('.tip[data-show="true"]'); if (!t) return null;
  const r = t.getBoundingClientRect(); return { text: t.textContent, lines: t.querySelectorAll('.ln').length, plain: (t.querySelector('.pl') || {}).textContent, last: t.lastElementChild.className, top: r.top, bottom: r.bottom, fs: parseFloat(getComputedStyle(t).fontSize) }; });
{ const at = await p.evaluate(() => { const n = document.querySelector('#plane .node[data-kind="block"]'); n.scrollIntoView({ block: 'center' });
    const r = n.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, name: n.querySelector('.nm').textContent.trim() }; });
  await p.mouse.move(at.x, at.y); await p.waitForTimeout(200);
  const t = await tipState();
  const blk = D.blocks.find(x => at.name.indexOf(x.name) >= 0);
  ok(t && t.lines >= 2 && t.last === 'pl' && t.plain === blk.plain, 'an element\'s hover is richer than one line, and its plain line comes last', t && t.lines + ' lines');
  ok(t && (t.bottom <= at.y || t.top >= at.y + 1) && t.fs >= 12, 'the hover stays off the pointer and on the 12px floor', t && t.fs);
  await shot(p, 'b-07-hover'); }
{ await p.locator('.rail .opt').first().hover(); await p.waitForTimeout(200);
  const t = await tipState();
  ok(t && t.lines === 1 && t.last === 'pl' && t.plain === D.layouts.A.plain, 'a control\'s hover is one line and the plain line', t && t.lines + ' lines'); }
await p.mouse.move(4, 4);

// ── 8 · the motion contract ─────────────────────────────────────────────────
{ const at = () => p.evaluate(() => { const n = document.querySelector('#plane .node[data-kind="block"]');
    return { x: n.offsetLeft + parseFloat(getComputedStyle(n).left) * 0, y: n.offsetTop, lx: parseFloat(getComputedStyle(n).left), ly: parseFloat(getComputedStyle(n).top) }; });
  const before = await (async () => { const v = await at(); return { x: v.lx, y: v.ly }; })();
  await p.click('#replay'); await p.waitForTimeout(150);
  const midv = await at(), mid = { x: midv.lx, y: midv.ly };
  await p.waitForTimeout(900);
  const endv = await at(), end = { x: endv.lx, y: endv.ly };
  ok(Math.abs(mid.x - end.x) > 2 || Math.abs(mid.y - end.y) > 2, 'Replay moves the nodes (sampled mid-flight)', `${Math.round(mid.x)},${Math.round(mid.y)} → ${Math.round(end.x)},${Math.round(end.y)}`);
  ok(Math.abs(end.x - before.x) < 1.5 && Math.abs(end.y - before.y) < 1.5, 'and lands back on the finished picture');
  await p.click('#af-cog'); await p.locator('#af-motion .af-opt', { hasText: 'Paused' }).click(); await p.keyboard.press('Escape');
  await p.click('#replay'); await p.waitForTimeout(200);
  const pv = await at(), paused = { x: pv.lx, y: pv.ly };
  ok(Math.abs(paused.x - before.x) < 1.5 && Math.abs(paused.y - before.y) < 1.5, 'Paused shows the finished picture at once, never a frame in between');
  await p.click('#af-cog'); await p.locator('#af-motion .af-opt', { hasText: 'Playing' }).click(); await p.keyboard.press('Escape');
  ok(await p.locator('#af-anim .af-opt').count() === 2 && await p.getAttribute('#af-anim .af-opt[data-id="finished"]', 'aria-checked') === 'true',
    'the cog offers to start finished or to play on open, and starts finished'); }

// ── 9 · the tray moves, the more-information toggle, the floor, the column ──
await set('tray', 'beside');
{ await p.click(sel('block:' + bk.key)); await p.waitForTimeout(700);
  const g = await p.evaluate(() => { const t = document.getElementById('tray').getBoundingClientRect(), c = document.getElementById('canvas').getBoundingClientRect();
    return { trayLeft: t.left, canvasRight: c.right, trayTop: t.top, canvasTop: c.top }; });
  ok(g.trayLeft >= g.canvasRight - 2, 'beside really puts the tray to the right of the map', JSON.stringify(g));
  await shot(p, 'b-08-beside');
  await set('tray', 'below');
  const g2 = await p.evaluate(() => { const t = document.getElementById('tray').getBoundingClientRect(), c = document.getElementById('canvas').getBoundingClientRect();
    return { trayTop: t.top, canvasBottom: c.bottom }; });
  ok(g2.trayTop >= g2.canvasBottom - 2, 'and below really puts it under the map', JSON.stringify(g2));
  await p.click('#closeall'); await p.waitForTimeout(500); }
{ ok(await p.evaluate(() => document.getElementById('more-body').hidden) === true, 'how the map knows things starts hidden, off the face (D-017)');
  const faceText = await p.evaluate(() => { const b2 = document.getElementById('more-body'); const prev = b2.hidden; b2.hidden = true;
    const t = document.querySelector('.artifact-page').innerText; b2.hidden = prev; return t; });
  ok(D.more.lines.every(l => faceText.indexOf(l.slice(0, 40)) < 0), 'and none of its lines is on the face while it is closed');
  await p.click('#more-btn'); await p.waitForTimeout(200);
  { /* the assert this replaces counted the paragraphs and read the aria flag — and the paragraphs are in the DOM while
       the section is hidden, so only the flag could ever fail it. What the message claims is that the press SHOWS the
       body, so that is what is measured: the section is no longer hidden, every paragraph has a box and lands on the
       page's own visible text, and the flag agrees. */
    const shown = await p.evaluate(() => { const b2 = document.getElementById('more-body'), ps = [...b2.querySelectorAll('p')];
      const face = document.querySelector('.artifact-page').innerText;
      return { hidden: b2.hidden, n: ps.length,
        drawn: ps.filter(n => n.offsetParent !== null && n.getBoundingClientRect().height > 0).length,
        onFace: ps.filter(n => n.textContent.trim() && face.indexOf(n.textContent.trim().slice(0, 40)) >= 0).length,
        exp: document.getElementById('more-btn').getAttribute('aria-expanded') }; });
    ok(!shown.hidden && shown.n === D.more.lines.length && shown.drawn === shown.n && shown.onFace === shown.n && shown.exp === 'true',
      'one press SHOWS every line of it: each one is drawn, on the page\'s own text, and the button says it is open', JSON.stringify(shown)); }
  await p.click('#more-btn'); await p.waitForTimeout(200); }
{ const floor = await p.evaluate(() => { let min = 99, who = '';
    document.querySelectorAll('.artifact-page *, .tip, .tip *').forEach(n => { if (!n.offsetParent && n.tagName !== 'BODY') return;
      const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!own && !/INPUT|TEXTAREA/.test(n.tagName)) return;
      const f = parseFloat(getComputedStyle(n).fontSize); if (f < min) { min = f; who = n.className || n.tagName; } });
    return { min, who }; });
  ok(floor.min >= 12, 'no text under 12px', `${floor.min}px on .${floor.who}`); }
for (const w of [1920, 1280, 390]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(400);
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(o <= 1, `no horizontal page scroll at ${w}px`, o); }
await shot(p, 'b-09-phone'); await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(400);
{ const col = await p.evaluate(() => { const r = document.querySelector('.artifact-page').getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right, w: r.width }; });
  ok(Math.abs(col.left - col.right) < 20, 'the column is centred on a wide screen', JSON.stringify(col));
  // his ruling 2026-09-22: the working surface uses the SCREEN — a map read in a 74rem column on a 2,500px display is the squeeze
  ok(col.w / 1920 > 0.9, 'and it is wide: the page uses the screen it is given, not a reading column', `${Math.round(col.w)} of 1920`);
  const rd = await p.evaluate(() => [...document.querySelectorAll('.lede, .keys, .cap')].map((e) => Math.round(e.getBoundingClientRect().width)));
  ok(rd.length > 0 && rd.every((w) => w <= 900), 'while every block of prose keeps its own reading width', JSON.stringify(rd)); }
await open();   // as it arrives, with nothing a previous case chose
{ const g = await p.evaluate(() => { const s = document.querySelector('.stage'), c = document.querySelector('.canvas'), t = document.querySelector('.tray');
    return { tray: s.getAttribute('data-tray'), canvas: c.getBoundingClientRect(), t: t.getBoundingClientRect(), lede: document.querySelector('.lede').getBoundingClientRect().left }; });
  ok(g.tray === 'beside', 'the tray starts beside the map, not under it (his ruling 2026-09-22)', g.tray);
  ok(g.t.left > g.canvas.right - 2, 'and it sits on the RIGHT of the map', `tray ${Math.round(g.t.left)} vs map right ${Math.round(g.canvas.right)}`);
  ok(Math.abs(g.canvas.left - g.lede) < 2, 'the map shares the prose\'s own left edge — column and surface line up', `${Math.round(g.canvas.left)} vs ${Math.round(g.lede)}`);
  ok(g.canvas.height > 700, 'and the map is as tall as the screen allows', `${Math.round(g.canvas.height)}px`); }
{ const lightBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); await p.emulateMedia({ colorScheme: 'dark' });
  ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) !== lightBg, 'dark paints a different ground');
  await shot(p, 'b-10-dark'); await p.emulateMedia({ colorScheme: 'light' }); }

// ── 10 · the pick survives a reload, and the text says what is set ──────────
await p.locator('[data-pick="B"]').click(); await p.waitForTimeout(200);
await p.click(sel('block:' + bk.key)); await p.waitForTimeout(600);
const txt = await p.evaluate(() => window.__bm.text());
ok(txt.indexOf('pick: B') >= 0 && txt.indexOf(bk.name) >= 0 && txt.indexOf(D.inv.hash) >= 0, 'the text carries the pick, what is open and the inventory it was read from', txt.split('\n')[1]);
{ /* the pick line's count is a count of the PAGE: the switches that sit beside the placement pick. Both the count and
     the claim that the text records them are measured against the rails the page paints — the Actions rail was painted
     and recorded nowhere, and the sentence typed "three". */
  const rails = await p.evaluate(() => [...document.querySelectorAll('#rail .rgrp')].map(g => ((g.querySelector('.rl') || {}).textContent || '').trim()));
  const lines = txt.split('\n');
  const missed = rails.slice(1).filter(r => !lines.some(l => l.indexOf(r + ': ') === 0 && l.slice(r.length + 2).trim() && l.slice(r.length + 2).trim() !== '—'));
  const intro = await p.textContent('#pick-intro'), n = +((intro.match(/\b(\d+)\b/) || [])[1]);
  ok(rails.length > 1 && rails[0] === D.rails.layout.label && n === rails.length - 1 && missed.length === 0,
    'the pick line counts the switches beside Placement, and the copied text records every one of them by name, with the value it is set to',
    `intro says ${n} · rail paints ${rails.length - 1} · not in the text: ${missed.join(', ') || 'none'}`); }
await open(false);   // THIS case is about memory, so it must NOT clear what the page remembers
ok(await p.evaluate(() => window.__bm.text()) === txt, 'a reload keeps the pick, the switches and the open panels');
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('gabe:brainmap:endpoint-card')); s.open.push('block:cZZ'); localStorage.setItem('gabe:brainmap:endpoint-card', JSON.stringify(s)); });
await open(false);   // the case seeds what the page remembers, so the reload must keep it
ok(await p.evaluate(() => window.__bm.text()) === txt, 'a saved panel for a block that no longer exists is dropped, never drawn');
await p.click('#reset'); ok(await p.getAttribute('#reset', 'data-armed') === 'true' && (await p.evaluate(() => window.__bm.text())).indexOf('pick: B') >= 0, 'the first press on Clear only arms it');
await p.click('#reset'); await p.waitForTimeout(500);
ok((await p.evaluate(() => window.__bm.text())).indexOf('pick: none yet') >= 0 && await p.locator('#tray .pan').count() === 0, 'the second press clears the pick and every panel');
// ── 11 · Keep only is its OWN control (D-022, option C), and it says it is on ──
await open();
const W = JSON.parse(fs.readFileSync(path.join(HERE, 'brainmap.words.json'), 'utf8'));
const st = () => p.evaluate(() => window.__bm.state().keep);
const quietKeys = () => p.evaluate(() => [...document.querySelectorAll('#plane .node[data-quiet="true"], #plane .nb[data-quiet="true"]')].map(n => n.getAttribute('data-pkey')).sort());
const drawnKeys = () => p.evaluate(() => [...document.querySelectorAll('#plane .node, #plane .nb')].map(n => n.getAttribute('data-pkey')));
/* where a block is drawn under By stage, recomputed HERE from the words file's lists — never read from the page's own placement.
   rule "one" is D-021 as recorded (exactly one stage → under it, else Across); "every" draws it under each stage it names */
const listOf = (bk) => W.stages.byBlock[BL[bk].sig].stages.map(s => s.toLowerCase());
const placeUnder = (bk, rule) => { const l = listOf(bk); return rule === 'one' ? (l.length === 1 ? l : ['across']) : (l.length ? l : ['across']); };
/* what carries a kept BLOCK, recomputed here from the page's own data, not read from the page's filter */
const carriesBlock = (keptBk, pk) => { const kb = BL[keptBk], held = new Set(kb.attrs.concat(kb.spine));
  if (pk === 'root') return true;
  if (pk.startsWith('block:')) return pk.slice(6) === keptBk;
  if (pk.startsWith('attr:')) return held.has(pk.slice(5));
  if (pk.startsWith('group:')) return D.groups.find(g => 'group:' + g.key === pk).blocks.indexOf(keptBk) >= 0;
  if (pk.startsWith('sec:')) return D.sections.find(s => 'sec:' + s.key === pk).attrs.some(i => held.has(i));
  if (pk.startsWith('stage:')) return placeUnder(keptBk, W.stages.rule.default).indexOf(pk.slice(6)) >= 0;
  if (pk === 'added:x') return D.added.some(i => held.has(i));
  return true; };
const expectQuiet = async (keptBk) => [...new Set((await drawnKeys()).filter(k => !carriesBlock(keptBk, k)))].sort();
{ ok(await st() === null && await p.locator('#keep-chip').isHidden(), 'the page arrives with Keep only off and no chip');
  ok(await p.locator('#keep-btn').isDisabled(), 'with nothing open, the control has no node to keep and says so', await p.textContent('#keep-btn'));
  await p.click(sel('block:' + bk.key)); await p.waitForTimeout(600);
  await p.click(sel('root')); await p.waitForTimeout(600); await p.click(sel('root')); await p.waitForTimeout(600);
  ok(await st() === null && (await quietKeys()).length === 0 && await p.locator('#keep-chip').isHidden(),
    'clicks on nodes NEVER turn the filter on: no node goes quiet and no chip appears', `keep=${await st()} quiet=${(await quietKeys()).length}`);
  ok((await p.textContent('#keep-btn')).indexOf(bk.name) >= 0, 'the control names the node it would keep — the one opened last', await p.textContent('#keep-btn'));
  await p.click('#keep-btn'); await p.waitForTimeout(600);
  ok(await st() === 'block:' + bk.key, 'the CONTROL turns it on, keeping the node opened last', await st());
  const chipTxt = await p.textContent('#keep-chip');
  ok(await p.locator('#keep-chip').isVisible() && chipTxt.indexOf(bk.name) >= 0 && chipTxt.indexOf(W.keep.chipHow) >= 0
    && (await p.textContent('#keep-btn')).trim() === W.keep.off, 'and a chip says in words what it keeps and how to remove it', chipTxt);
  let q = await quietKeys(), eq = await expectQuiet(bk.key);
  ok(q.length > 0 && q.join('|') === eq.join('|'), 'the nodes that do not carry the kept block go quiet, and only those', `${q.length} vs ${eq.length}`);
  ok((await drawnKeys()).length === expectNodes('flat', 'nodes', ['block:' + bk.key]), 'quiet is dimmed, never removed: every node is still drawn');
  const n2 = D.blocks.filter(x => x.key !== bk.key)[0];
  await p.click(sel('block:' + n2.key)); await p.waitForTimeout(600);
  ok(await st() === 'block:' + bk.key && await p.locator('#keep-chip').isVisible(), 'a click on another node leaves the filter as it was', await st());
  await p.click(sel('block:' + n2.key)); await p.waitForTimeout(500);
  await set('lay', 'B');
  q = await quietKeys(); eq = await expectQuiet(bk.key);
  ok(await st() === 'block:' + bk.key && await p.locator('#keep-chip').isVisible() && q.length > 0 && q.join('|') === eq.join('|'),
    'it survives a placement change, still quieting the same nodes', `${q.length} vs ${eq.length}`);
  await set('grp', 'stage');
  q = await quietKeys(); eq = await expectQuiet(bk.key);
  ok(await st() === 'block:' + bk.key && await p.locator('#keep-chip').isVisible() && q.length > 0 && q.join('|') === eq.join('|'),
    'and a grouping change: under By stage, only the stages the kept block is drawn under stay lit', q.join(' '));
  await shot(p, 'b-11-keep-stage');
  await set('lay', 'E');
  q = await quietKeys(); eq = await expectQuiet(bk.key);
  ok(q.length > 0 && q.join('|') === eq.join('|'), 'Indented quiets the same lines the pictures do', `${q.length} vs ${eq.length}`);
  await set('lay', 'A'); await set('grp', 'flat');
  await p.click('#keep-btn'); await p.waitForTimeout(600);
  ok(await st() === null && (await quietKeys()).length === 0 && await p.locator('#keep-chip').isHidden(), 'removing it brings every node back and the chip goes', `quiet ${(await quietKeys()).length}`);
  ok((await drawnKeys()).length === expectNodes('flat', 'nodes', ['block:' + bk.key]), 'and nothing was lost on the way', `${(await drawnKeys()).length}`);
  await p.click('#closeall'); await p.waitForTimeout(400); }

// ── 12 · the STAGE grouping (D-021) — HIS SPINE as the rail, each block's LIST, and the switch for a block that spans rows ──
{ await set('grp', 'stage');
  /* the record's spine table, parsed HERE from his markdown — the rail is checked against the record, never against the
     words file that feeds the page (a one-way check is how a whole row went missing) */
  const STMD = fs.readFileSync(path.join(REPO, 'docs/design/workflow-panel/endpoint-stages.md'), 'utf8');
  const REC = STMD.split('\n').map(l => ({ m: l.match(/^\|\s*(\d+|bay|screen)\s*\|\s*\*\*([A-Z]+)\*\*\s*\|/), c: l.split('|').map(x => x.trim()) }))
    .filter(x => x.m).map(x => ({ name: x.m[2], kind: /^\d+$/.test(x.m[1]) ? 'stage' : x.m[1] === 'bay' ? 'bay' : 'screen', what: x.c[3] || '' }));
  const capd = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const order = W.stages.order, stKeys = REC.map(r => 'stage:' + r.name.toLowerCase()).concat(['stage:across']);
  const RULE = () => p.evaluate(() => window.__bm.state().srule);
  const top = await p.evaluate(() => [...document.querySelectorAll('#plane .node[data-depth="1"]')].map(n => n.getAttribute('data-pkey')));
  const strk = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#plane .node[data-kind="stage"]')].map(n => [n.getAttribute('data-pkey').slice(6), n.getAttribute('data-strk')])));
  ok(REC.length > 6 && REC.filter(r => r.kind === 'bay').length === 1 && REC.filter(r => r.kind === 'screen').length === 1
    && order.join('|') === REC.map(r => r.name).join('|') && top.join('|') === stKeys.concat(D.added.length ? ['added:x'] : []).join('|'),
    'by stage, the first level is HIS RECORD\'S SPINE — every row of endpoint-stages.md, in its order, then Across the stages',
    `record ${REC.map(r => r.name + ':' + r.kind).join(' ')} · drawn ${top.join(' ')}`);
  ok(REC.every(r => strk[r.name.toLowerCase()] === r.kind), 'and each row is drawn as the KIND the record gives it, not all as stages',
    REC.map(r => r.name + ' drawn ' + strk[r.name.toLowerCase()] + ' vs record ' + r.kind).join(' · '));
  /* the case bug this replaces tested /UNCAUGHT/ against lower-cased slugs, so it could never fire. This counts. */
  const nDrawnStages = Object.values(strk).filter(k => k === 'stage').length;
  ok(nDrawnStages === REC.filter(r => r.kind === 'stage').length && strk.uncaught === 'bay' && strk.client === 'screen',
    'the UNCAUGHT bay and the CLIENT screen are DRAWN, and neither is counted among the stages',
    `${nDrawnStages} stages drawn · uncaught=${strk.uncaught} · client=${strk.client}`);
  const marks = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#plane .node[data-kind="stage"]')].map(n => {
    const mk = n.querySelector('.mk'); if (!mk) return [n.getAttribute('data-pkey').slice(6), null];
    const a = mk.getBoundingClientRect(), b = n.getBoundingClientRect();
    return [n.getAttribute('data-pkey').slice(6), { t: mk.textContent, fs: parseFloat(getComputedStyle(mk).fontSize),
      inside: a.bottom <= b.bottom + 0.5 && a.top >= b.top - 0.5, clipped: n.scrollHeight > n.clientHeight + 0.5 }]; })));
  ok(REC.every(r => { const m = marks[r.name.toLowerCase()];
      return r.kind === 'stage' ? m === null : !!m && m.t === W.stages.names[r.name].mark && STMD.includes(m.t) && m.fs >= 12 && m.inside && !m.clipped; }),
    'the bay and the screen are MARKED on the node in the record\'s own words — drawn whole, above the floor — and an ordinary stage carries no mark',
    `bay ${JSON.stringify(marks.uncaught)} · screen ${JSON.stringify(marks.client)}`);
  /* the note says what the rail draws, and every count in it is the drawn count */
  const note = await p.textContent('#grp-note');
  const nRows = +((note.match(/(\d+) rows/) || [])[1]), nSt = +((note.match(/(\d+) stages/) || [])[1]);
  ok(note === D.stageWords.note && /\{nSpineRows\}/.test(W.stages.note) && /\{nStageRows\}/.test(W.stages.note)
    && !/\d/.test(W.stages.note.replace(/\b[1-5]\d\d\b/g, '')) && nRows === top.filter(k => k !== 'stage:across' && k !== 'added:x').length && nSt === nDrawnStages
    && /UNCAUGHT/.test(note) && /CLIENT/.test(note),
    'the note under the rail says what the rail draws, and its counts are the rows and stages actually drawn', `note says ${nRows} rows · ${nSt} stages; drawn ${top.length - 1} · ${nDrawnStages}`);
  { /* what the page SAYS, read off the rendered words and never compared to the words file that produced them: the pair
       of asserts this replaces read the rail option and the note's visibility, so deleting the proposal wording from
       both the rail's note and the note under it left them green */
    const says = await p.evaluate(() => ({ vis: !document.getElementById('grp-note').hidden,
      note: /proposal/i.test(document.getElementById('grp-note').textContent),
      rail: /proposal/i.test(document.querySelector('#rail .opt[data-grp="stage"]').textContent) }));
    ok(says.vis && says.note && says.rail, 'the RENDERED words say this grouping is a PROPOSAL — on the rail option and in the note under it', JSON.stringify(says)); }
  const rOpts = await p.evaluate(() => [...document.querySelectorAll('#rail .opt[data-srule]')].map(o => ({ id: o.getAttribute('data-srule'), on: o.getAttribute('aria-checked'), t: o.textContent })));
  ok(rOpts.length === 2 && await RULE() === 'every' && rOpts.find(o => o.id === 'every').on === 'true'
    && /the agent's pick/.test(rOpts.find(o => o.id === 'every').t) && /the rule as recorded in D-021/.test(rOpts.find(o => o.id === 'one').t),
    'By stage carries ONE switch with two options: every stage it touches (the default, marked as the agent\'s pick) and Across (marked as D-021\'s rule)', JSON.stringify(rOpts));
  { const nRails = await p.evaluate(() => document.querySelectorAll('#rail .rgrp').length);
    ok(nRails === Object.keys(D.rails).length + 1, 'and it is the ONE extra switch the pick line says By stage adds — every other rail is painted whatever the grouping',
      `${nRails} rails painted · ${Object.keys(D.rails).length} described`); }
  /* what the page DRAWS under each stage, read from the drawn nodes' parents, with every stage open */
  const drawnUnder = async () => { for (const k of stKeys) { if (await p.getAttribute(sel(k), 'data-open') !== 'true') { await p.click(sel(k)); await p.waitForTimeout(300); } }
    return p.evaluate(() => [...document.querySelectorAll('#plane .node[data-kind="block"], #plane .nb[data-pkey^="block:"]')].map(n => [n.getAttribute('data-pkey').slice(6), (n.getAttribute('data-parent') || '').replace(/^stage:/, '')])); };
  const byBlock = (pairs) => { const m = {}; D.blocks.forEach(x => { m[x.key] = []; }); pairs.forEach(([bk, st]) => m[bk].push(st)); return m; };
  const heldBy = (pairs, st) => pairs.filter(x => x[1] === st).map(x => x[0]).sort();
  const stageShape = async () => p.evaluate(() => [...document.querySelectorAll('#plane .node[data-kind="stage"]')].map(n => ({ k: n.getAttribute('data-pkey').slice(6), rk: n.getAttribute('data-strk'), empty: n.getAttribute('data-empty'), dash: getComputedStyle(n).borderTopStyle })));
  /* an EMPTY row is dashed; the bay and the screen wear their own edge whatever they hold, so the dash rule is read
     against the ordinary stages and Across only, and the two marked rows are checked for their own edge instead */
  const edgeOk = (sh, wantEmpty, wantAcrossEmpty) => sh.every(s =>
    s.rk === 'bay' ? s.dash === 'dashed' : s.rk === 'screen' ? s.dash === 'dotted'
    : (s.empty === 'true') === (wantEmpty.indexOf(s.k) >= 0 || (s.k === 'across' && wantAcrossEmpty)) && (s.empty === 'true') === (s.dash === 'dashed'));
  await set('lay', 'B');
  // rule (ii), the default: a block under EVERY stage it names
  { const pairs = await drawnUnder(), m = byBlock(pairs);
    const bad = D.blocks.filter(x => { const want = placeUnder(x.key, 'every').slice().sort(), got = m[x.key].slice().sort(); return want.join('|') !== got.join('|'); });
    ok(bad.length === 0 && pairs.length === D.blocks.reduce((s, x) => s + Math.max(1, listOf(x.key).length), 0),
      'under every-stage, each block is drawn under exactly the stages its list names — counted per block against the words file',
      bad.map(x => `${x.name}: drawn ${m[x.key].join(',') || 'nowhere'} vs listed ${listOf(x.key).join(',') || 'none'}`).join(' | ') || `${pairs.length} appearances`);
    const wantAcross = D.blocks.filter(x => listOf(x.key).length === 0).map(x => x.key).sort();
    ok(wantAcross.length > 0 && heldBy(pairs, 'across').join('|') === wantAcross.join('|'), 'and Across the stages holds exactly the blocks whose list is empty', heldBy(pairs, 'across').map(k => BL[k].name).join(', '));
    ok(D.blocks.some(x => listOf(x.key).length > 1 && m[x.key].length > 1), 'a block that spans stages really is drawn more than once, not folded to one');
    { /* every row's plain line is HIS: it must open with the record's own "what happens there" words, verbatim, the way
         the bay's and the screen's marks already are — read from the open panels, against the markdown parsed above */
      const plains = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#tray .pan[data-pkey^="stage:"]')]
        .map(n => [n.getAttribute('data-pkey').slice(6), ((n.querySelector('.pl') || {}).textContent || '')])));
      const bad = REC.filter(r => (plains[r.name.toLowerCase()] || '').indexOf(capd(r.what)) !== 0);
      ok(REC.every(r => r.what) && bad.length === 0, 'every row\'s plain line opens with the record\'s own words for that row, verbatim',
        bad.map(r => `${r.name}: “${(plains[r.name.toLowerCase()] || '').slice(0, 50)}…” vs record “${capd(r.what).slice(0, 50)}…”`).join(' | ') || `${REC.length} rows read`); }
    /* the bay is a ROW, so a block that can end there says so — and the block whose subject IS the endings must */
    const bayKey = REC.find(r => r.kind === 'bay').name.toLowerCase();
    const endSig = Object.keys(W.stages.byBlock).filter(k => k[0] !== '_').find(k => W.stages.byBlock[k].fromEndingsColumn);
    const endBk = D.blocks.find(x => x.sig === endSig), wantBay = D.blocks.filter(x => listOf(x.key).indexOf(bayKey) >= 0).map(x => x.key).sort();
    ok(!!endBk && wantBay.indexOf(endBk.key) >= 0 && wantBay.length > 0 && heldBy(pairs, bayKey).join('|') === wantBay.join('|'),
      'under every-stage, the block whose subject is the endings is drawn under the UNCAUGHT bay, beside every other block whose list names it',
      `bay holds ${heldBy(pairs, bayKey).map(k => BL[k].name).join(', ') || 'nothing'} · endings block ${endBk ? endBk.name : 'not declared'}`);
    const sh = await stageShape(), wantEmpty = order.map(s => s.toLowerCase()).filter(s => !D.blocks.some(x => placeUnder(x.key, 'every').indexOf(s) >= 0));
    ok(sh.length === stKeys.length && edgeOk(sh, wantEmpty, !wantAcross.length),
      'every row of the spine, the bay and the screen included, is drawn under every-stage — an empty stage dashed, never dropped', JSON.stringify(sh));
    await p.click('#closeall'); await p.waitForTimeout(300);
    }
  // rule (i), D-021 as recorded
  await p.click('#rail .opt[data-srule="one"]'); await p.waitForTimeout(600);
  ok(await RULE() === 'one' && await p.getAttribute('#rail .opt[data-srule="one"]', 'aria-checked') === 'true', 'the switch moves to the rule as recorded');
  { const pairs = await drawnUnder(), m = byBlock(pairs);
    ok(D.blocks.every(x => m[x.key].length === 1), 'under the rule as recorded, every block is drawn exactly once',
      D.blocks.filter(x => m[x.key].length !== 1).map(x => `${x.name} ×${m[x.key].length}`).join(' ') || `${pairs.length} drawn`);
    const wantAcross = D.blocks.filter(x => listOf(x.key).length !== 1).map(x => x.key).sort();
    ok(heldBy(pairs, 'across').join('|') === wantAcross.join('|'), 'and Across holds exactly the blocks whose list is not one stage long', heldBy(pairs, 'across').map(k => BL[k].name).join(', '));
    const ones = D.blocks.filter(x => listOf(x.key).length === 1);
    ok(ones.length > 0 && ones.every(x => m[x.key][0] === listOf(x.key)[0]), 'while a block with exactly one stage sits under that stage', ones.map(x => x.name + '→' + m[x.key][0]).join(' '));
    const sh = await stageShape(), wantEmpty = order.map(s => s.toLowerCase()).filter(s => !D.blocks.some(x => placeUnder(x.key, 'one').indexOf(s) >= 0));
    ok(wantEmpty.length > 0 && sh.length === stKeys.length && edgeOk(sh, wantEmpty, false),
      'every row is still drawn under the rule as recorded — the empty ones dashed, never dropped', sh.filter(s => s.empty === 'true').map(s => s.k).join(' '));
    const ink = await p.evaluate(() => { const e = [...document.querySelectorAll('#plane .node[data-kind="stage"][data-empty="true"][data-open="true"] .nm')], blk = document.querySelector('#plane .node[data-kind="block"]:not([data-open="true"]) .nm');
      return { n: e.length, same: e.every(x => getComputedStyle(x).color === getComputedStyle(blk).color) }; });
    ok(ink.n > 0 && ink.same, 'an OPEN empty stage keeps its name in ink — readable on its clear background, not light-on-clear', JSON.stringify(ink));
    // Indented cross-check: the same placement read from the list's own nesting, not from an attribute
    await set('lay', 'E');
    const nest = await p.evaluate(() => [...document.querySelectorAll('#plane .nb[data-pkey^="block:"]')].map(n => [n.getAttribute('data-pkey').slice(6),
      n.closest('ul').closest('li').querySelector(':scope > .row > .nb').getAttribute('data-pkey').slice(6)]));
    ok(nest.length === D.blocks.length && nest.every(([bk, st]) => placeUnder(bk, 'one')[0] === st), 'Indented nests every block under the same branch the pictures draw', nest.map(x => x.join('<')).join(' '));
    await p.click('#closeall'); await p.waitForTimeout(300); }
  // the switch persists across a placement change, and it is saved
  await set('lay', 'B'); await set('lay', 'D'); await set('lay', 'B');
  ok(await RULE() === 'one' && await p.getAttribute('#rail .opt[data-srule="one"]', 'aria-checked') === 'true'
    && (await p.evaluate(() => window.__bm.text())).indexOf(W.stages.rule.opts.one.name) >= 0, 'the switch persists across a placement change, and the text says which rule is on');
  { const t = await p.evaluate(() => window.__bm.text());
    ok(t.indexOf(W.stages.rule.label + ': ' + W.stages.rule.opts.one.name) >= 0,
      'and it names By stage\'s extra switch by the same label the rail gives it — the pick line claims every switch is recorded by name',
      t.split('\n').find(l => l.indexOf(D.rails.group.label + ':') === 0)); }
  { /* the two pictures, b-12 and b-13: the SAME map under each rule, every row of the spine open. What each picture is
       MEANT to show is measured under the rule it is taken under — the assert this replaces read a plane height, which
       is always positive, and read it before the rows were re-opened under the other rule, so it could not go red. */
    /* `inside` is measured against the CANVAS, because the canvas is what the picture is clipped to: a node below its
       edge, or a canvas still scrolling, is a picture that does not show the map it claims to */
    const shotState = () => p.evaluate(() => { const rows = [...document.querySelectorAll('#plane .node[data-kind="stage"]')],
        app = [...document.querySelectorAll('#plane .node[data-kind="block"]')], c = document.getElementById('canvas'), cb = c.getBoundingClientRect();
      return { rows: rows.length, open: rows.filter(n => n.getAttribute('data-open') === 'true').length, apps: app.length,
        under: app.map(n => (n.getAttribute('data-parent') || '').replace(/^stage:/, '')).sort(),
        inside: c.scrollHeight <= c.clientHeight + 1 && app.every(n => { const b2 = n.getBoundingClientRect(); return b2.top >= cb.top - 1 && b2.bottom <= cb.bottom + 1; }) }; });
    const wantUnder = (rule) => D.blocks.reduce((a, x) => a.concat(placeUnder(x.key, rule)), []).sort();
    const openAll = async () => { for (const k of stKeys) if (await p.getAttribute(sel(k), 'data-open') !== 'true') { await p.click(sel(k)); await p.waitForTimeout(250); } };
    const wide = (on) => p.evaluate((o) => { const c = document.getElementById('canvas'); c.style.height = o ? 'auto' : ''; c.style.maxHeight = o ? 'none' : ''; }, on);
    const calm = async () => { await p.mouse.move(2, 2); await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); await p.waitForTimeout(400); };
    await openAll(); await wide(true); await calm();
    if (shotsAt) await p.locator('#stage').screenshot({ path: path.join(shotsAt, 'b-12-stage-rule-i.png') });
    const one = await shotState(); await wide(false);
    ok(one.rows === stKeys.length && one.open === one.rows && one.apps === D.blocks.length && one.inside
      && one.under.join('|') === wantUnder('one').join('|'),
      'b-12 shows the rule as recorded: every row of the spine open, each block drawn once, under the row its list gives it, and the whole map inside the picture',
      `${one.open}/${one.rows} rows open · ${one.apps} appearances (want ${D.blocks.length}) · inside ${one.inside}`);
    await p.click('#rail .opt[data-srule="every"]'); await p.waitForTimeout(600);
    await openAll(); await wide(true); await calm();
    if (shotsAt) await p.locator('#stage').screenshot({ path: path.join(shotsAt, 'b-13-stage-rule-ii.png') });
    const every = await shotState(); await wide(false);
    ok(every.rows === stKeys.length && every.open === every.rows && every.inside
      && every.under.join('|') === wantUnder('every').join('|'),
      'b-13 shows every-stage on the same rows: each block drawn under every row its list names, and the whole map inside the picture',
      `${every.open}/${every.rows} rows open · ${every.apps} appearances (want ${wantUnder('every').length}) · inside ${every.inside}`);
    ok(every.apps > one.apps, 'and the two pictures really differ: every-stage draws more block appearances than the rule as recorded',
      `${every.apps} vs ${one.apps}`); }
  await open(false);
  ok(await RULE() === 'every' && await p.getAttribute('#rail .opt[data-srule="every"]', 'aria-checked') === 'true', 'and a reload keeps the switch where it was left');
  await p.click('#closeall'); await p.waitForTimeout(300);
  // Keep only under (ii): a kept block lights EVERY appearance of itself, and the chip's count is recounted
  { const multi = D.blocks.filter(x => listOf(x.key).length > 1).sort((x, y) => listOf(y.key).length - listOf(x.key).length)[0];
    await p.click(sel('stage:' + listOf(multi.key)[0])); await p.waitForTimeout(400);
    await p.locator(sel('block:' + multi.key)).first().click(); await p.waitForTimeout(500);
    await p.click('#keep-btn'); await p.waitForTimeout(600);
    ok(await st() === 'block:' + multi.key, 'Keep only takes a block that spans stages', await st());
    for (const k of stKeys) { if (await p.getAttribute(sel(k), 'data-open') !== 'true') { await p.click(sel(k)); await p.waitForTimeout(250); } }
    const apps = await p.evaluate((k) => [...document.querySelectorAll('#plane .node[data-pkey="block:' + k + '"]')].map(n => ({ st: n.getAttribute('data-parent'), q: n.getAttribute('data-quiet') })), multi.key);
    ok(apps.length === listOf(multi.key).length && apps.every(a => a.q !== 'true'),
      `under every-stage, the kept block lights EVERY appearance of itself (${listOf(multi.key).length} stages)`, JSON.stringify(apps));
    const stq = await p.evaluate(() => [...document.querySelectorAll('#plane .node[data-kind="stage"]')].filter(n => n.getAttribute('data-quiet') !== 'true').map(n => n.getAttribute('data-pkey').slice(6)).sort());
    ok(stq.join('|') === listOf(multi.key).slice().sort().join('|'), 'and exactly the stages it is drawn under stay lit', stq.join(' '));
    const q = await quietKeys(), eq = await expectQuiet(multi.key);
    const nQuietDrawn = await p.evaluate(() => document.querySelectorAll('#plane .node[data-quiet="true"]').length);
    const chipN = +((await p.textContent('#keep-chip')).match(/(\d+) other nodes are quiet/) || [])[1];
    ok([...new Set(q)].join('|') === eq.join('|') && chipN === nQuietDrawn && nQuietDrawn > 0, 'the quiet nodes are exactly the ones that do not carry it, and the chip\'s count is the drawn count', `chip ${chipN} · drawn ${nQuietDrawn}`);
    await p.click('#keep-btn'); await p.waitForTimeout(400); await p.click('#closeall'); await p.waitForTimeout(300); }
  // a block's panel carries its list and its reason
  { const onlyOne = D.blocks.find(x => listOf(x.key).length > 1);
    await p.click(sel('stage:' + listOf(onlyOne.key)[0])); await p.waitForTimeout(400);
    await p.locator(sel('block:' + onlyOne.key)).first().click(); await p.waitForTimeout(500);
    const why = await p.textContent('#tray .pan[data-pkey="block:' + onlyOne.key + '"] [data-stagewhy]');
    ok(why.indexOf(W.stages.byBlock[onlyOne.sig].why) >= 0 && W.stages.byBlock[onlyOne.sig].stages.every(s => why.indexOf(s) >= 0), 'a block\'s panel carries the stages it touches and the reason for them', why); }
  await p.click('#closeall'); await set('lay', 'A'); await set('grp', 'flat');
  ok(await p.locator('#grp-note').isHidden() && await p.locator('#rail .opt[data-srule]').count() === 0, 'and the proposal line and the switch go away with the grouping'); }
ok(errs.length === 0, 'no console errors by the end', errs.slice(0, 2).join(' | '));

await b.close();
console.log(`probe-brainmap: ${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
