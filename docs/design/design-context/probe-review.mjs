/* probe-review.mjs — the review page: every decision rules, the text follows, every reference it prints exists.

     node docs/design/design-context/probe-review.mjs [--html <file>]      # browser-gated; run it ALONE */
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
const args = process.argv.slice(2), SRC = args.indexOf('--html') >= 0 ? path.resolve(args[args.indexOf('--html') + 1]) : path.join(HERE, 'review-leftovers.html');
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
const { chromium } = require(PW);
let pass = 0, fail = 0; const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra ? ' — ' + extra : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'review-probe-')), page = path.join(tmp, 'page.html');
fs.writeFileSync(page, '<!doctype html><html><head><meta charset="utf8"></head><body>' + fs.readFileSync(SRC, 'utf8') + '</body></html>');
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + page); await p.waitForTimeout(500);
const D = await p.evaluate(() => window.REVIEW_DATA);
ok(!!D && errs.length === 0, 'the page boots with no error', errs.slice(0, 2).join(' | '));
ok(D.norms.length === 36 && (await p.$$('.nrow')).length === D.norms.length, 'all 36 norm lines are drawn, one row each', String((await p.$$('.nrow')).length));
ok((await p.$$('.dec')).length === D.decisions.length && D.decisions.length >= 15, 'every decision is a card', String(D.decisions.length));
{ const bad = await p.$$eval('.dec, .nrow', els => els.filter(e => e.querySelectorAll('.btn[data-mine="true"]').length !== 1 || e.querySelectorAll('.btn[aria-pressed="true"]').length !== 0).map(e => e.dataset.dec || e.dataset.norm));
  ok(bad.length === 0, 'untouched, every card and line shows exactly ONE dashed pick and nothing filled', bad.join(',')); }
{ const mism = await p.evaluate(() => window.REVIEW_DATA.decisions.filter(d => { const c = document.querySelector('.dec[data-dec="' + d.id + '"]'); const vs = c ? [...c.querySelectorAll('.verdict .btn[data-v]')].map(x => x.dataset.v) : [];
    const dashed = c && c.querySelector('.btn[data-mine="true"]');   /* a missing card or a missing dashed button is a FAILED check, never a crash */
    return !c || vs.join('|') !== d.options.map(o => o[0]).join('|') || !dashed || dashed.dataset.v !== d.mine; }).map(d => d.id));
  ok(mism.length === 0, 'a card offers exactly its options, and the dashed one is my pick', mism.join(',')); }
{ const imgs = await p.$$eval('img', els => els.map(i => ({ ok: i.complete && i.naturalWidth > 40, alt: i.alt })));   /* lazy images: scroll through once */
  await p.evaluate(async () => { for (const i of document.querySelectorAll('img')) { i.scrollIntoView(); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); }); await p.waitForTimeout(300);
  const after = await p.$$eval('img', els => els.map(i => ({ ok: i.complete && i.naturalWidth > 40, alt: i.alt })));
  const want = 1 + D.decisions.filter(d => d.shot).length + D.decisions.filter(d => d.shot2).length;
  ok(after.length === want && after.every(i => i.ok), 'every picture decodes — the lab map and one per layout card', after.filter(i => !i.ok).map(i => i.alt).join(',') + ' · ' + after.length + ' of ' + want + ' · first pass ' + imgs.filter(i => i.ok).length); }
ok((await p.$$('.labmap .rg b')).length === 5, 'the lab map names its five regions', String((await p.$$('.labmap .rg b')).length));
{ const left = await p.$$eval('.dec, .cap, .lede', els => els.map(e => e.textContent).filter(t => /\{\w+\}/.test(t)));
  ok(left.length === 0, 'no sentence is left holding an unfilled number', left.slice(0, 2).join(' | ').slice(0, 160)); }
/* every reference the page prints must exist: a repo path, and a line inside the file's length */
{ const bad = []; for (const d of D.decisions) for (const w of d.where) { for (const m of w.matchAll(/((?:docs|templates|skills|scripts)\/[\w./-]+\.\w+|CLAUDE\.md)/g)) { const f = path.join(REPO, m[1]);
      if (!fs.existsSync(f)) { bad.push(d.id + ': no file ' + m[1]); continue; } const ln = /\bline (\d+)/.exec(w); if (ln && Number(ln[1]) > fs.readFileSync(f, 'utf8').split('\n').length) bad.push(d.id + ': ' + m[1] + ' has no line ' + ln[1]); } }
  ok(bad.length === 0, 'every file a card sends you to exists, and every line it names is inside that file', bad.join(' · ')); }
/* a line number a card prints must land on the thing the card talks about — every card that names a line, not a sample */
{ const EXPECT = { vocab: 'STAGE_EXPECT', 'slot-words': 'function slotWhy', thresholds: 'word_for', 'roles-raise': 'a role is lit only', through: 'the success ending that passes', 'dep-order': 'gsig.find',
    'place-card': 'no feed-wide comparison', 'p10-word': 'State words', 'p10-nav': 'nav-hook guard' }, bad = [], seen = new Set();
  for (const d of D.decisions) for (const w of d.where) { const ln = /\bline (\d+)/.exec(w), f = /((?:docs|templates|skills|scripts)\/[\w./-]+\.\w+)/.exec(w); if (!ln || !f) continue; seen.add(d.id);
    if (!EXPECT[d.id]) { bad.push(d.id + ' names a line and the probe holds no expectation for it'); continue; }
    const lines = fs.readFileSync(path.join(REPO, f[1]), 'utf8').split('\n'), n = Number(ln[1]); if (!lines.slice(Math.max(0, n - 4), n + 3).join('\n').includes(EXPECT[d.id])) bad.push(d.id + ' → ' + f[1] + ':' + n + ' does not show "' + EXPECT[d.id] + '"'); }
  ok(bad.length === 0 && seen.size >= 6, 'every line number a card prints lands on the thing it talks about', bad.join(' · ') + ' · ' + seen.size + ' cards name a line'); }
{ const bad = await p.evaluate(() => window.REVIEW_DATA.decisions.filter(d => { const c = document.querySelector('.dec[data-dec="' + d.id + '"]'); if (!c) return true;
    const rows = [...c.querySelectorAll('.impacts .imp')], on = rows.filter(r => r.dataset.on === 'true');
    return rows.map(r => r.dataset.v).join('|') !== d.options.map(o => o[0]).join('|') || rows.some(r => (r.lastElementChild.textContent || '').length < 20 || !r.querySelector('.sz')) || on.length !== 1 || on[0].dataset.v !== d.mine; }).map(d => d.id));
  ok(bad.length === 0, 'every option of every decision says what it sets in motion and how big it is, and untouched the lit one is my pick', bad.join(','));
  const d = D.decisions.find(x => x.options.length >= 2), other = d.options.find(o => o[0] !== d.mine)[0], sel = `.dec[data-dec="${d.id}"]`;
  await p.click(`${sel} .verdict .btn[data-v="${other}"]`); await p.waitForTimeout(80);
  ok(await p.$eval(`${sel} .imp[data-v="${other}"]`, e => e.dataset.on) === 'true' && await p.$eval(`${sel} .imp[data-v="${d.mine}"]`, e => e.dataset.on) === 'false', 'ruling a card lights the impact of the option you chose');
  await p.click(`${sel} .verdict .btn[data-v="${other}"]`); await p.waitForTimeout(80);
  ok((await p.$$('#norm-impacts .imp')).length === 3, 'the three verdicts on a norm line say what each sets in motion, once'); }
const text = () => p.$eval('#out', e => e.value);
{ const t = await text(); ok(t.startsWith('REVIEW · leftovers · ' + D.hash) && /\n0 yours · /.test(t) && D.decisions.every(d => t.includes('\n' + d.id + ': ' + d.mine + ' (my pick, not ruled)')), 'untouched, the text lists every decision as my pick', t.split('\n')[1]); }
{ const d = D.decisions.find(x => x.options.length >= 2), other = d.options.find(o => o[0] !== d.mine)[0], sel = `.dec[data-dec="${d.id}"]`;
  await p.click(`${sel} .btn[data-v="${other}"]`); await p.waitForTimeout(80);
  ok(await p.$eval(sel, e => e.dataset.state) === 'yours' && (await text()).includes(`\n${d.id}: ${other} (yours, I picked ${d.mine})`) && /^1 of /.test(await p.$eval('#count', e => e.textContent)), 'ruling a card fills the button, marks the card yours, and the text says what I had picked', d.id);
  await p.fill(`${sel} textarea.note`, 'a note\nin two lines').catch(async () => { await p.click(`${sel} .btn.nb`); await p.fill(`${sel} textarea.note`, 'a note\nin two lines'); }); await p.waitForTimeout(80);
  ok((await text()).includes(' | a note / in two lines'), 'a note rides the same line of the text');
  await p.reload(); await p.waitForTimeout(500);
  ok(await p.$eval(sel, e => e.dataset.state) === 'yours' && (await p.$eval(`${sel} textarea.note`, e => e.value)).startsWith('a note'), 'a ruling and its note survive a reload');
  await p.click(`${sel} .btn[data-v="${other}"]`); await p.waitForTimeout(80);
  ok(await p.$eval(`${sel} .btn[data-v="${d.mine}"]`, e => e.dataset.mine) === 'true', 'pressing the same button again hands the card back to my pick'); }
{ const n = D.norms.find(x => x.mine === 'ok'), sel = `.nrow[data-norm="${n.id}"]`; await p.click(`${sel} .btn[data-v="strike"]`); await p.waitForTimeout(80);
  ok((await p.$eval(`${sel} .ln`, e => getComputedStyle(e).textDecorationLine)) === 'line-through' && (await text()).includes(`${n.topicWord} · ${n.stage}: strike (yours, I picked ok)`), 'striking a norm line draws it struck and lists it in the text'); }
{ const dn = D.norms.filter(x => x.mine !== 'ok'); ok(dn.length >= 1 && dn.every(x => D.norms.find(y => y.id === x.id).doubt) && (await text()).includes('reword (my pick, not ruled)'), 'a line I doubt says why, and the text carries my doubt even when you did not touch it'); }
await p.evaluate(() => { document.getElementById('reset').click(); document.getElementById('reset').click(); }); await p.waitForTimeout(120);
ok(/\n0 yours · /.test(await text()), 'Clear everything, pressed twice, hands every line back');
ok(errs.length === 0, 'no page error anywhere', errs.slice(0, 3).join(' | '));
await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
console.log(`probe-review: ${pass} passed · ${fail} failed`); process.exit(fail ? 1 : 0);
