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
    return { n: rows.length, want: (D.acts.byNode.block || []).length,
      named: rows.every((r) => r.querySelector('b') && kinds.some((k) => D.acts.kinds[k].name === r.querySelector('b').textContent)),
      where: rows.every((r) => r.querySelector('.mvr') && wheres.indexOf(r.querySelector('.mvr').textContent) >= 0),
      icons: rows.every((r) => !!r.querySelector('.mvi svg')), said: !!document.querySelector('#tray .pan .mvn') }; });
  ok(mv.n === mv.want && mv.n > 0, 'an opened block says every move it offers', `${mv.n} vs ${mv.want}`);
  ok(mv.named && mv.icons, 'each move carries its own mark and its own verb', JSON.stringify(mv));
  ok(mv.where, 'and names WHICH REGION answers it — the middle, the portrait, the map itself or here', JSON.stringify(mv));
  ok(mv.said, 'and the panel says out loud that these are proposed, not built', String(mv.said)); }
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
{ /* the rotation claim: turn C back by the page's own angle and it is A, to one scale */
  const th = -D.rotDeg * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const keys = Object.keys(geom.A).filter(k => k !== 'root' && geom.C[k]);
  const ks = keys.map(k => { const c = geom.C[k], x = c.cx * cs - c.cy * sn, y = c.cx * sn + c.cy * cs, a = geom.A[k];
    const na = Math.hypot(a.cx, a.cy); return na < 1 ? null : Math.hypot(x, y) / na; }).filter(x => x !== null);
  const k0 = ks[0], spread = Math.max(...ks) - Math.min(...ks);
  ok(keys.length > 3 && spread < 0.02 * k0, `turning ${D.rotDeg}° back off C gives Upright again, at one scale`, `scale ${k0 ? k0.toFixed(3) : '—'} · spread ${spread.toFixed(4)}`);
  const ang = keys.map(k => { const c = geom.C[k], a = geom.A[k]; if (Math.hypot(a.cx, a.cy) < 1) return null;
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
  ok(await p.locator('#more-body p').count() === D.more.lines.length && await p.getAttribute('#more-btn', 'aria-expanded') === 'true', 'one press opens every line of it');
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
await open(false);   // THIS case is about memory, so it must NOT clear what the page remembers
ok(await p.evaluate(() => window.__bm.text()) === txt, 'a reload keeps the pick, the switches and the open panels');
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('gabe:brainmap:endpoint-card')); s.open.push('block:cZZ'); localStorage.setItem('gabe:brainmap:endpoint-card', JSON.stringify(s)); });
await open(false);   // the case seeds what the page remembers, so the reload must keep it
ok(await p.evaluate(() => window.__bm.text()) === txt, 'a saved panel for a block that no longer exists is dropped, never drawn');
await p.click('#reset'); ok(await p.getAttribute('#reset', 'data-armed') === 'true' && (await p.evaluate(() => window.__bm.text())).indexOf('pick: B') >= 0, 'the first press on Clear only arms it');
await p.click('#reset'); await p.waitForTimeout(500);
ok((await p.evaluate(() => window.__bm.text())).indexOf('pick: none yet') >= 0 && await p.locator('#tray .pan').count() === 0, 'the second press clears the pick and every panel');
ok(errs.length === 0, 'no console errors by the end', errs.slice(0, 2).join(' | '));

await b.close();
console.log(`probe-brainmap: ${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
