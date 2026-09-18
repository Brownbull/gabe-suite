/* probe-rate.mjs — the rating sheet's render proof (headless system Chrome via the spike's playwright-core;
   the recipe of ../workflow-panel/probe-arrange.mjs).

     node docs/design/design-context/probe-rate.mjs [--shots DIR]

   Every assert measures the DRAWN thing — computed styles, boxes, the text in the copy box — against numbers
   computed from the inventory file and the page's own data. Exit 1 on any failure; SKIP loudly (exit 0) when
   chrome or playwright-core is missing. One browser, one page at a time (the machine's serial rule). */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const PAGE = path.join(HERE, 'rate-endpoint.html');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core');
const CHROME = '/usr/bin/google-chrome-stable';
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots') >= 0 ? args[args.indexOf('--shots') + 1] : null;
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
if (shotsAt) fs.mkdirSync(shotsAt, { recursive: true });
const { chromium } = require(PW);

let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra !== undefined ? ' — ' + extra : '')); } };
const shot = async (p, name, opts) => { if (shotsAt) await p.screenshot({ path: path.join(shotsAt, name + '.png'), ...(opts || {}) }); };

/* the inventory, counted independently of the generator */
const md = fs.readFileSync(path.join(HERE, 'inventory-endpoint.md'), 'utf8').split('\n## The face')[0];
const MDROWS = md.split('\n').filter(l => l.startsWith('|') && !/^\|\s*-{3}/.test(l) && !/^\|\s*attribute\s*\|/.test(l)).length;
const MDSECS = (md.match(/^## /gm) || []).length;

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const open = async () => { await p.goto('file://' + PAGE); await p.waitForFunction('!!window.__rate', { timeout: 15000 }); };
await open();
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await open();

const out = () => p.evaluate(() => document.getElementById('out').value);
const head = async () => (await out()).split('\n')[0];
const row = id => p.locator('#row-' + id);
const D = await p.evaluate(() => window.__rate.data);
const ALL = D.sections.flatMap(s => s.rows);
const mineOf = id => ALL.find(r => r.id === id).mine;

// ── 1 · it boots, and it holds the whole inventory ────────────────────────────
ok(errs.length === 0, 'no console errors', errs.slice(0, 2).join(' | '));
ok(ALL.length === MDROWS, 'every inventory row is on the page', `${ALL.length} vs ${MDROWS} in the md`);
ok(D.sections.length === MDSECS, 'every inventory section is on the page', `${D.sections.length} vs ${MDSECS}`);
ok(await p.locator('.row').count() === MDROWS, 'one drawn row per attribute', await p.locator('.row').count());
ok(await p.locator('.sec').count() === MDSECS + 2, 'the rule + the sections + the copy box', await p.locator('.sec').count());
ok(await p.locator('.sec-head h2 svg').count() === MDSECS + 2, 'every section title carries an icon');
ok(await p.evaluate(() => [...document.querySelectorAll('.row .pl')].every(n => n.textContent.trim().length > 20)), 'every row carries a plain line');
ok(await p.evaluate(() => [...document.querySelectorAll('.row .ex')].every(n => n.textContent.trim().length > 8)), 'every row carries an example line');
ok((await p.textContent('#n-all')).trim() === String(MDROWS), 'the lede counts the attributes', await p.textContent('#n-all'));
ok((await p.textContent('#n-secs')).trim() === String(MDSECS), 'the lede counts the groups', await p.textContent('#n-secs'));
{ // the race example is the page's one alarm-bearing fact: it must say what the steps say, never the one handled claim alone
  globalThis.window = {}; require(path.join(HERE, '../workflow-panel/_lab-ep.js'));
  const seen = new Map(); globalThis.window.LABEP.forms.paths.forEach(q => ((q.effects || {}).steps || []).forEach(st => { if (st.race) seen.set(st.table + '|' + JSON.stringify(st.race.keys), st.race.state); }));
  const un = [...seen.values()].filter(x => x === 'uncaught').length, ex = ALL.find(r => r.id === 'race-on-a-unique-key').example;
  ok(un > 0 ? ex.startsWith(un + ' uncaught race') : ex.startsWith('no uncaught race'), 'the race example counts the uncaught races the steps carry', `${un} in the facts · "${ex}"`);
}
ok(await row('coverage-per-condition').locator('.chip').first().textContent() === '0 · 2.5 · 44', 'a spread that follows a word still gets its chip', await row('coverage-per-condition').locator('.chip').first().textContent().catch(() => 'none'));

// ── 2 · at rest: my rating is dashed, nothing is yours ────────────────────────
ok(await p.locator('.seg[data-mine="true"]').count() === MDROWS, 'one dashed proposal per row', await p.locator('.seg[data-mine="true"]').count());
ok(await p.locator('.seg[aria-pressed="true"]').count() === 0, 'no rating is pressed at rest');
ok(await p.evaluate(() => getComputedStyle(document.querySelector('.seg[data-mine="true"]')).borderTopStyle) === 'dashed', 'the proposal is drawn dashed');
ok(await p.locator('.bell[data-mine="true"]').count() === ALL.filter(r => r.mine.alarm).length, 'a dashed bell on every row I proposed an alert for', await p.locator('.bell[data-mine="true"]').count());
ok((await head()).endsWith(`0 changed · 0 confirmed · ${MDROWS} untouched`), 'the copy text opens at all-untouched', await head());
const by = v => ALL.filter(r => r.mine.base === v).length;
const widths = await p.evaluate(() => { const bar = document.getElementById('bar'), w = bar.getBoundingClientRect().width; return [...bar.children].map(i => i.getBoundingClientRect().width / w); });
ok([3, 2, 1].every((v, i) => Math.abs(widths[i] - by(v) / MDROWS) < 0.01), 'the bar\'s lengths are my ratings\' shares', widths.map(x => x.toFixed(3)).join(' · '));
await shot(p, '01-rest');

// ── 3 · a change, an undo, a confirm ──────────────────────────────────────────
const A = 'method-path', mA = mineOf(A).base, other = mA === 3 ? 2 : 3;
await row(A).locator('.seg', { hasText: String(other) }).click();
ok(await row(A).getAttribute('data-state') === 'changed', 'a different rating marks the row changed');
ok((await out()).includes(`${A}: ${mA} -> ${other}`), 'the copy text carries mine -> yours', (await out()).split('\n')[2]);
ok((await row(A).locator('.state').textContent()) === `yours · was ${mA}`, 'the row says what it was', await row(A).locator('.state').textContent());
const pressed = await row(A).locator('.seg[aria-pressed="true"]').evaluate(n => { const c = getComputedStyle(n); return { bs: c.borderTopStyle, bg: c.backgroundColor, fg: c.color }; });
ok(pressed.bs === 'solid' && pressed.bg !== pressed.fg && pressed.bg !== 'rgba(0, 0, 0, 0)', 'yours is drawn solid and filled', JSON.stringify(pressed));
ok((await head()).includes('1 changed · 0 confirmed'), 'the header counts the change', await head());
const w2 = await p.evaluate(() => { const bar = document.getElementById('bar'), w = bar.getBoundingClientRect().width; return [...bar.children].map(i => i.getBoundingClientRect().width / w); });
ok(Math.abs(w2[0] - (by(3) + (other === 3 ? 1 : -1) * (mA === 3 || other === 3 ? 1 : 0)) / MDROWS) < 0.01, 'the bar moves with the change', w2[0].toFixed(3));
ok(await p.evaluate(id => document.activeElement === document.getElementById('row-' + id), A), 'a click on a rating hands the focus to its row');
await p.keyboard.press('Enter');
ok(await row(A).locator('.seg[aria-pressed="true"]').textContent() === String(other), 'Enter after a click neither undoes nor overwrites the rating', await row(A).locator('.seg[aria-pressed="true"]').textContent().catch(() => 'none pressed'));
await p.keyboard.press(String(mA)); await p.keyboard.press(String(other));
ok(await row(A).locator('.seg[aria-pressed="true"]').textContent() === String(other), 'the digit keys still work after a mouse click');
await row(A).locator('.seg', { hasText: String(other) }).click();
ok(await row(A).getAttribute('data-state') === 'untouched', 'pressing the same rating again hands it back to me');
await row(A).locator('.seg', { hasText: String(mA) }).click();
ok(await row(A).getAttribute('data-state') === 'confirmed', 'pressing my rating confirms it');
ok(new RegExp(`CONFIRMED[^\\n]*\\n[^\\n]*\\b${A}=${mA}\\b`).test(await out()), 'a confirmed row is listed with its value');

// ── 4 · the alert bell, both directions ───────────────────────────────────────
const Q = ALL.find(r => !r.mine.alarm && r.id !== A).id, Y = ALL.find(r => r.mine.alarm).id;
await row(Q).locator('.bell').click();
ok((await out()).includes(`${Q}: ${mineOf(Q).base} -> ${mineOf(Q).base} +alert`), 'adding an alert reads +alert', Q);
ok(await row(Q).locator('.bell').getAttribute('aria-pressed') === 'true', 'the added bell is pressed');
await row(Y).locator('.bell').click();
ok((await out()).includes(`${Y}: ${mineOf(Y).base} -> ${mineOf(Y).base} -alert`), 'removing my alert reads -alert', Y);

const Z = ALL.filter(r => !r.mine.alarm && ![A, Q].includes(r.id))[3].id;
await row(Z).locator('.bell').click(); await row(Z).locator('.bell').click();
ok(await row(Z).getAttribute('data-state') === 'untouched' && !new RegExp(`CONFIRMED[^\\n]*\\n[^\\n]*\\b${Z}=`).test(await out()), 'the bell pressed twice leaves the row untouched, never confirmed');

// ── 5 · a note travels with the rating ────────────────────────────────────────
await row(Q).locator('.nt').click();
ok(await row(Q).locator('.note').isVisible(), 'the note button opens the note');
ok(await p.evaluate(id => document.activeElement === document.querySelector('#row-' + id + ' .note'), Q), 'the note takes the focus');
await row(Q).locator('.note').fill('only the URL group matters');
ok((await out()).includes(`+alert | only the URL group matters`), 'the note rides on its changed line');
await row(A).locator('.nm').focus(); await row(Q).locator('.nt').click();
ok(await row(Q).locator('.note').isVisible() && await p.evaluate(id => document.activeElement === document.querySelector('#row-' + id + ' .note'), Q), 'the pen on a written note goes to the note, it never hides it');
const U = ALL.find(r => ![A, Q, Y, Z].includes(r.id)).id;
await row(U).locator('.nt').click(); await row(U).locator('.note').fill('check this with me');
ok(/NOTES\n[\s\S]*check this with me/.test(await out()) && (await out()).includes(`${U} | check this with me`), 'a note on an untouched row lands under NOTES');

// ── 6 · the keyboard ──────────────────────────────────────────────────────────
const ids = ALL.map(r => r.id), K = ids[5], K2 = ids[6];
await row(K).focus();
await p.keyboard.press(mineOf(K).base === 1 ? '2' : '1');
ok(await row(K).getAttribute('data-state') === 'changed', 'a digit rates the focused row');
await p.keyboard.press('ArrowDown');
ok(await p.evaluate(() => document.activeElement.id) === 'row-' + K2, 'ArrowDown moves to the next row', await p.evaluate(() => document.activeElement.id));
await p.keyboard.press('Enter');
ok(await row(K2).getAttribute('data-state') === 'confirmed', 'Enter accepts my rating');
await p.keyboard.press('a');
ok(await row(K2).getAttribute('data-state') === 'changed', 'A toggles the alert');
await p.keyboard.press('a');
await p.keyboard.press('n');
ok(await p.evaluate(id => document.activeElement === document.querySelector('#row-' + id + ' .note'), K2), 'N opens the note and focuses it');
await p.keyboard.type('12a');
ok(await row(K2).getAttribute('data-state') === 'confirmed' && await row(K2).locator('.note').inputValue() === '12a', 'typing digits in a note never rates the row');

// ── 7 · accept mine for the rest of a section ─────────────────────────────────
const S = D.sections[3], sec = p.locator('#sec-' + S.slug);
await sec.locator('.accept').click();
ok(await sec.locator('.row[data-state="untouched"]').count() === 0, 'the section has no untouched row left');
ok(await sec.locator('.accept').isHidden(), 'the shortcut leaves once it has nothing to do');
ok((await sec.locator('.sec-head .n').textContent()) === `${S.rows.length} attributes · ${S.rows.length} yours`, 'the section counts what is yours', await sec.locator('.sec-head .n').textContent());

// ── 8 · it survives a reload ──────────────────────────────────────────────────
const before = await out();
await open();
ok(await out() === before, 'a reload keeps every rating, alert and note');
ok(await row(Q).locator('.note').isVisible(), 'a kept note is shown again');

// ── 9 · copy ──────────────────────────────────────────────────────────────────
await p.click('#copy');
await p.waitForFunction(() => document.getElementById('said').textContent.length > 0, { timeout: 4000 }).catch(() => {});
const said = await p.textContent('#said');
const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => null));
if (clip === null) console.log('  note: this chrome refuses clipboard reads on file:// — asserting the message instead');
ok(clip === null ? /^(Copied|Select)/.test(said) : clip === before, 'Copy puts the text on the clipboard', clip === null ? said : 'clipboard differs');
ok(/^Copied/.test(said) || (await p.evaluate(() => { const o = document.getElementById('out'); return document.activeElement === o && o.selectionEnd - o.selectionStart === o.value.length; })), 'a refused copy leaves the text selected', said);

// ── 10 · hovers: short on controls, a detail card on the name, never on the pointer ──
const tipState = () => p.evaluate(() => { const t = [...document.querySelectorAll('.tip')].find(x => x.getAttribute('data-show') === 'true'); if (!t) return null; const r = t.getBoundingClientRect(); return { text: t.textContent, top: r.top, bottom: r.bottom, left: r.left, right: r.right, fs: parseFloat(getComputedStyle(t).fontSize) }; });
const R = ids[9], seg3 = row(R).locator('.seg').nth(2);
await row(R).evaluate(n => n.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150);
const sb = await seg3.boundingBox();
await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await p.waitForTimeout(200);
let t = await tipState();
ok(t && t.text === D.ui.rule3, 'a rating button\'s hover is its one rule line', t && t.text);
ok(t && (t.bottom <= sb.y + sb.height / 2 || t.top >= sb.y + sb.height / 2 + 1), 'the hover does not sit on the pointer', t && `${t.top}–${t.bottom} vs y ${sb.y + sb.height / 2}`);
ok(t && !/[.!?]\s+[A-Z]/.test(t.text) && t.text.length <= 150, 'a control\'s hover is one short sentence', t && t.text.length);
const nb = await row(R).locator('.nm').boundingBox();
await p.mouse.move(nb.x + 10, nb.y + nb.height / 2); await p.waitForTimeout(200);
t = await tipState();
const rowR = ALL.find(r => r.id === R);
ok(t && t.text.startsWith(rowR.plain) && t.text.includes(rowR.type) && t.text.includes(rowR.first), 'the name\'s hover opens with the plain line and carries the detail', t && t.text.slice(0, 90));
ok(t && t.fs >= 12, 'the hover text stands on the 12px floor', t && t.fs);
await shot(p, '02-hover', { clip: { x: 300, y: Math.max(0, nb.y - 260), width: 1320, height: 420 } });
await p.mouse.move(5, 5);
await row(R).locator('.nm').click();
ok(await row(R).locator('.more').isVisible() && await row(R).locator('.more dt').count() >= 5, 'a click on the name pins the detail under the row');
ok(await row(R).locator('.nm').getAttribute('aria-expanded') === 'true', 'the pinned name reports expanded');

// ── 11 · the legibility floor, with a note and a pinned detail open, at the smallest base ──
const floor = await p.evaluate(() => { let min = 99, who = ''; document.querySelectorAll('.artifact-page *').forEach(n => { if (!n.offsetParent && n.tagName !== 'BODY') return; const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!own && !/INPUT|TEXTAREA/.test(n.tagName)) return; const f = parseFloat(getComputedStyle(n).fontSize); if (f < min) { min = f; who = n.className || n.tagName; } }); return { min, who }; });
ok(floor.min >= 12, 'no text under 12px', `${floor.min}px on .${floor.who}`);

// ── 12 · the cog's Detail group changes the picture and persists ─────────────
await p.click('#af-cog');
ok(await p.locator('#af-detail .af-opt').count() === 3 && await p.locator('#af-motion').count() === 0, 'the cog offers Detail, and no Motion on a page that does not move');
await p.locator('#af-detail .af-opt', { hasText: 'Names only' }).click();
const disp = sel => p.evaluate(s => getComputedStyle(document.querySelector(s)).display, sel);
ok(await disp('.row .pl') === 'none' && await disp('.row .ex') === 'none', 'Names only hides the plain line and the example');
await p.locator('#af-detail .af-opt', { hasText: /^Plain line\s*less/ }).click();
ok(await disp('.row .pl') !== 'none' && await disp('.row .ex') === 'none', 'Plain line keeps the line and drops the example');
await open();
ok(await disp('.row .ex') === 'none', 'the Detail choice survives a reload');
await p.click('#af-cog'); await p.locator('#af-detail .af-opt', { hasText: 'Plain line + example' }).click(); await p.keyboard.press('Escape');

await p.evaluate(() => window.__setSkin('mission'));
const sw3 = await p.evaluate(() => [getComputedStyle(document.querySelector('.legend .sw.b3')).backgroundColor, getComputedStyle(document.querySelector('.bar .b3')).backgroundColor]);
ok(sw3[0] === sw3[1] && sw3[0] !== 'rgba(0, 0, 0, 0)', 'the legend swatch is the bar\'s colour after a skin switch', sw3.join(' vs '));
await p.evaluate(() => window.__setSkin('catalog'));

// ── 13 · widths: no sideways scroll, one column on a phone ───────────────────
for (const w of [1920, 1280, 390]) {
  await p.setViewportSize({ width: w, height: 900 });
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(o <= 1, `no horizontal scroll at ${w}px`, o);
}
const stack = await p.evaluate(() => { const r = document.querySelector('.row'), a = r.querySelector('.what').getBoundingClientRect(), c = r.querySelector('.ctl').getBoundingClientRect(); return { sameLeft: Math.abs(a.left - c.left) < 2, below: c.top > a.bottom - 1 }; });
ok(stack.sameLeft && stack.below, 'on a phone the rating sits under the name', JSON.stringify(stack));
await shot(p, '03-phone');
await p.setViewportSize({ width: 1920, height: 1080 });
const col = await p.evaluate(() => { const r = document.querySelector('.artifact-page').getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right }; });
ok(Math.abs(col.left - col.right) < 20 && col.left > 100, 'the column is centred on a wide screen', JSON.stringify(col));

// ── 14 · dark theme paints its own tokens ─────────────────────────────────────
const lightBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
await p.emulateMedia({ colorScheme: 'dark' });
const dark = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.bell[aria-pressed="true"], .bell[data-mine="true"]')); return { bg: getComputedStyle(document.body).backgroundColor, alert: c.color }; });
ok(dark.bg !== lightBg, 'dark paints a different ground', dark.bg);
await shot(p, '04-dark');
await p.emulateMedia({ colorScheme: 'light' });
const lightAlert = await p.evaluate(() => getComputedStyle(document.querySelector('.bell[aria-pressed="true"], .bell[data-mine="true"]')).color);
ok(dark.alert !== lightAlert, 'the alert hue has a dark value of its own', `${lightAlert} vs ${dark.alert}`);

// ── 15 · clear everything is two presses ─────────────────────────────────────
await p.click('#reset');
ok(await p.getAttribute('#reset', 'data-armed') === 'true' && (await head()).includes('changed') && !(await head()).includes(' 0 changed · 0 confirmed'), 'the first press only arms it');
await p.click('#reset');
ok((await head()).endsWith(`0 changed · 0 confirmed · ${MDROWS} untouched`), 'the second press clears every rating', await head());
ok(!(await out()).includes('NOTES') && await p.locator('.note:visible').count() === 0, 'the notes are gone with it');
ok(await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('gabe:rate:endpoint-card')).rows).length) === 0, 'and the saved state is empty');

// ── 16 · a changed inventory keeps what it can and says so ────────────────────
await p.evaluate(id => localStorage.setItem('gabe:rate:endpoint-card', JSON.stringify({ inv: 'old00000', rows: { [id]: { r: 1, a: null, n: '' }, 'gone-row': { r: 3, a: null, n: '' } } })), ids[2]);
await open();
ok(await p.locator('#stale').isVisible(), 'a rating made on an older inventory is announced');
ok((await head()).includes('(some ratings were given against old00000)') && (await head()).endsWith('untouched'), 'the copy text names the inventory the ratings were given against', await head());
await open();
ok(await p.locator('#stale').isVisible(), 'the notice is still there after a reload with nothing changed');
ok(await row(ids[2]).locator('.seg[aria-pressed="true"]').textContent() === '1' && !(await out()).includes('gone-row'), 'the kept rating is drawn, the vanished row is dropped');
await row(ids[4]).locator('.seg').first().click();
await open();
ok(await p.locator('#stale').isHidden(), 'the notice leaves once a change has been saved against the new inventory');
await p.evaluate(() => localStorage.setItem('gabe:rate:endpoint-card', JSON.stringify({ inv: 'old00000', rows: {} })));
await open();
ok(await p.locator('#stale').isHidden(), 'a visitor who never rated sees no notice');
await p.evaluate(() => localStorage.clear());
await open();
ok(await p.evaluate(() => localStorage.getItem('gabe:rate:endpoint-card')) === null, 'opening the page saves nothing');
await shot(p, '05-top');
await p.locator('#sec-' + D.sections[1].slug).scrollIntoViewIfNeeded();
await shot(p, '06-section');

ok(errs.length === 0, 'no console errors by the end', errs.slice(0, 2).join(' | '));
await b.close();
console.log(`probe-rate: ${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
