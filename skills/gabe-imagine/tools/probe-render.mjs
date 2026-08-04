/* gabe-imagine · render probe (I5)
 *
 * The three shipped gates read a page's CLAIMS (contract), its GEOMETRY (fit)
 * and the SHELL's motion — none of them runs the page's own authored script.
 * The compound-interest one-shot proved the hole: a simulator can ship with
 * every gate green and nobody ever having seen it compute. This probe loads
 * the built page in headless chromium and proves the authored layer RAN.
 *
 * Two layers of checks:
 *
 *   ALWAYS (no declaration needed)
 *     · zero pageerror / console.error at load AND after interactions
 *     · every [data-fx] slug on the page is registered in window.FXREPLAY
 *     · a page carrying an authored inline <script> must declare probe hooks —
 *       an interactive page with nothing declared is Session A's gap verbatim,
 *       and it FAILS rather than passing vacuously
 *
 *   DECLARED (authored in body.html, attributes on the elements themselves)
 *     · data-probe                     the element renders NON-EMPTY after load
 *                                      (child elements, text, or an SVG d)
 *     · data-probe-expect="<regex>"    the element's textContent matches
 *     · data-probe-react               container: perturbing EACH input/select
 *                                      inside must CHANGE every
 *                                      [data-probe-out] inside it (restored
 *                                      after; dead listeners cannot hide)
 *     · data-probe-hover="<selector>"  hovering the element's center changes
 *                                      the target (text or visibility)
 *
 * Usage:  node probe-render.mjs <page.html …>
 * Exit 0 = green · 1 = a check failed · 2 = usage / unreadable input
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, join, basename } from 'node:path';

const targets = process.argv.slice(2).map((p) => resolve(p));
if (!targets.length) {
  console.error('usage: node probe-render.mjs <page.html …>');
  process.exit(2);
}

const { chromium } = await import(`${process.env.HOME}/.claude/skills/gabe-docsite/tools/_playwright.mjs`);
const SETTLE = Number(process.env.PROBE_SETTLE_MS || 600);
const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

let pass = 0; const fails = [];
function check(page, cond, msg, extra = '') {
  const line = `${basename(page)} · ${msg}` + (extra ? `  — ${extra}` : '');
  if (cond) { pass += 1; console.log('PASS  ' + line); }
  else { fails.push(line); console.log('FAIL  ' + line); }
}
const note = (page, msg) => console.log('NOTE  ' + basename(page) + ' · ' + msg);

/* An authored script is any inline <script> with a body — the shell arrives
   via src=, data arrives as application/json, and the docsite generator emits
   a bare mermaid.initialize({...}) config call on diagram pages; none of those
   is authored behavior with output of its own to declare. */
function hasAuthoredScript(html) {
  const rx = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(rx)) {
    if (/\bsrc\s*=/i.test(m[1])) continue;
    if (/type\s*=\s*["']application\/(ld\+)?json["']/i.test(m[1])) continue;
    const body = m[2].trim();
    if (!body) continue;
    if (/^mermaid\.initialize\(/.test(body)) continue;
    return true;
  }
  return false;
}

const browser = await chromium.launch();

for (const target of targets) {
  let html;
  try { html = await readFile(target, 'utf8'); } catch {
    console.error('⛔ unreadable: ' + target);
    process.exit(2);
  }
  const srv = createServer(async (q, r) => {
    const rel = decodeURIComponent((q.url || '/').split('?')[0]).replace(/^\/+/, '');
    if (!rel) { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); return; }
    try {
      const buf = await readFile(join(dirname(target), rel));
      r.writeHead(200, { 'Content-Type': MIME[rel.slice(rel.lastIndexOf('.'))] || 'application/octet-stream' });
      r.end(buf);
    } catch { r.writeHead(404); r.end('not found'); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));

  const errors = [];
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await pg.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(SETTLE);

  check(target, errors.length === 0, 'no page or console errors on load',
    errors.slice(0, 3).join(' | '));

  /* ── FXREPLAY: every declared animation actually registered ── */
  const fx = await pg.evaluate(() => ({
    declared: [...document.querySelectorAll('[data-fx]')].map((e) => e.getAttribute('data-fx')).filter(Boolean),
    registered: Object.keys(window.FXREPLAY || {}),
  }));
  if (fx.declared.length) {
    const missing = fx.declared.filter((s) => !fx.registered.includes(s));
    check(target, missing.length === 0,
      `every data-fx slug registered in FXREPLAY (${fx.declared.length})`,
      missing.length ? 'missing: ' + missing.join(', ') : fx.declared.join(', '));
  } else {
    note(target, 'no [data-fx] on this page — registry check skipped');
  }

  /* ── declared hooks ── */
  const hooks = await pg.evaluate(() => ({
    nonempty: [...document.querySelectorAll('[data-probe]')].length,
    expect: [...document.querySelectorAll('[data-probe-expect]')].length,
    react: [...document.querySelectorAll('[data-probe-react]')].length,
    hover: [...document.querySelectorAll('[data-probe-hover]')].length,
  }));
  const declared = hooks.nonempty + hooks.expect + hooks.react + hooks.hover;

  if (hasAuthoredScript(html)) {
    check(target, declared > 0,
      'an authored <script> declares probe hooks',
      declared ? `${declared} hook(s)` : 'interactive page with NOTHING declared — the gap this probe exists to close');
  } else if (!declared) {
    note(target, 'no authored script, no declared hooks — load + registry checks only');
  }

  if (hooks.nonempty) {
    const empty = await pg.evaluate(() =>
      [...document.querySelectorAll('[data-probe]')]
        .filter((el) => !(el.children.length || el.textContent.trim() || (el.getAttribute('d') || '').trim()))
        .map((el) => el.id || el.tagName.toLowerCase()));
    check(target, empty.length === 0, `every [data-probe] root rendered non-empty (${hooks.nonempty})`,
      empty.length ? 'EMPTY: ' + empty.join(', ') : '');
  }

  if (hooks.expect) {
    const bad = await pg.evaluate(() =>
      [...document.querySelectorAll('[data-probe-expect]')]
        .filter((el) => { try { return !new RegExp(el.getAttribute('data-probe-expect')).test(el.textContent); }
                         catch { return true; } })
        .map((el) => (el.id || el.tagName.toLowerCase()) + ' ⇒ "' + el.textContent.trim().slice(0, 40) + '"'));
    check(target, bad.length === 0, `every [data-probe-expect] readout holds its value (${hooks.expect})`,
      bad.join(' · '));
  }

  if (hooks.react) {
    /* The contract, learned on the lever bank: each input must move AT LEAST
       ONE readout (a rate lever legitimately never moves "you put in"), and
       every readout must move under SOME input (a readout no lever reaches is
       dead weight). Perturbation uses stepUp/stepDown — a range input snaps
       assigned values to its step, so raw value writes can silently no-op. */
    const report = await pg.evaluate(async (settle) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const out = [];
      for (const box of document.querySelectorAll('[data-probe-react]')) {
        const outs = [...box.querySelectorAll('[data-probe-out]')];
        const inputs = [...box.querySelectorAll('input, select')];
        if (!outs.length || !inputs.length) {
          out.push({ id: box.id || 'react-box', fail: 'declares data-probe-react but lacks ' + (outs.length ? 'inputs' : '[data-probe-out]') });
          continue;
        }
        const moved = new Set();
        for (const inp of inputs) {
          const before = outs.map((o) => o.textContent);
          const orig = inp.value;
          if (inp.tagName === 'SELECT') {
            inp.selectedIndex = (inp.selectedIndex + 1) % inp.options.length;
          } else if (inp.type === 'checkbox' || inp.type === 'radio') {
            inp.checked = !inp.checked;
          } else {
            const cur = parseFloat(inp.value) || 0;
            const mx = parseFloat(inp.max);
            try { if (!Number.isNaN(mx) && cur >= mx) inp.stepDown(); else inp.stepUp(); }
            catch { inp.value = String(cur + 1); }
          }
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          await sleep(settle / 3);
          const hits = outs.map((o, i) => o.textContent !== before[i]);
          hits.forEach((h, i) => { if (h) moved.add(i); });
          if (!hits.some(Boolean)) out.push({ id: box.id || 'react-box',
            fail: `input "${inp.id || inp.name || inp.type}" moves no readout` });
          if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
          else if (inp.type === 'checkbox' || inp.type === 'radio') inp.checked = !inp.checked;
          else inp.value = orig;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          await sleep(settle / 3);
        }
        const never = outs.filter((o, i) => !moved.has(i)).map((o) => o.id || 'out');
        if (never.length) out.push({ id: box.id || 'react-box',
          fail: `no input moves: ${never.join(', ')}` });
        out.push({ id: box.id || 'react-box', ok: `${inputs.length} input(s) ⇄ ${outs.length} readout(s)` });
      }
      return out;
    }, SETTLE);
    const broken = report.filter((r) => r.fail);
    check(target, broken.length === 0,
      `every [data-probe-react] input moves its readouts (${hooks.react} container(s))`,
      broken.length ? broken.map((r) => `${r.id}: ${r.fail}`).join(' · ')
                    : report.map((r) => `${r.id}: ${r.ok}`).join(' · '));
  }

  if (hooks.hover) {
    const results = [];
    const hoverEls = await pg.locator('[data-probe-hover]').all();
    for (const h of hoverEls) {
      const sel = await h.getAttribute('data-probe-hover');
      const id = (await h.getAttribute('id')) || sel;
      const tgt = pg.locator(sel).first();
      if (!(await tgt.count())) { results.push({ id, fail: 'target not found: ' + sel }); continue; }
      const snap = () => tgt.evaluate((el) => ({
        text: el.textContent, vis: getComputedStyle(el).display + '/' + getComputedStyle(el).visibility,
      }));
      const before = await snap();
      await h.scrollIntoViewIfNeeded();
      await h.hover({ position: undefined });
      /* hover() aims at the center; the listener is on the element itself */
      await pg.waitForTimeout(SETTLE / 3);
      const after = await snap();
      if (after.text === before.text && after.vis === before.vis)
        results.push({ id, fail: 'nothing changed on hover' });
      else results.push({ id, ok: true });
      await pg.mouse.move(2, 2);
      await pg.waitForTimeout(SETTLE / 4);
    }
    const broken = results.filter((r) => r.fail);
    check(target, broken.length === 0,
      `every [data-probe-hover] gesture changes its target (${hooks.hover})`,
      broken.map((r) => `${r.id}: ${r.fail}`).join(' · '));
  }

  check(target, errors.length === 0, 'no errors after interaction',
    errors.slice(0, 3).join(' | '));

  await pg.close();
  srv.close();
  console.log('');
}

await browser.close();
console.log(`render probe: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
