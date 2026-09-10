/* theme-probe.mjs — the LIGHT THEME proof for the Gabe Universe (operator 2026-09-10: "when I change to the light theme, a lot of
   things do not change color"). Loads the committed example station, snapshots every visible element's computed colours in
   DARK, flips to LIGHT through the station's own switch (__uniApplyTheme), and asserts in three states (entity panel · journey ·
   next step) that (a) no GREY surface stays dark — an opaque background with luminance < .28 and chroma < 60, outside the rail
   (nav.side stays dark by design, like every other center page); saturated fills (accent, entity tints) are the design, and
   (b) no text outside the rail falls under 3:1 against its effective background. DARK is a floor guard at 2:1 against invisible text (its pastel
   counts at 2.5–2.9 are the design). Env: GABE_CHROME_BIN · GABE_PW_DIR (playwright-core dir) · GABE_SHOT_DIR (optional PNGs).
   Usage: node theme-probe.mjs <path-to-gabe-universe.html> */
import path from 'node:path';
const PAGE = process.argv[2]; if (!PAGE) { console.error('usage: theme-probe.mjs <gabe-universe.html>'); process.exit(2); }
const pw = await import(path.join(process.env.GABE_PW_DIR || '', 'index.js')); const chromium = (pw.default || pw).chromium;
const CHROME = process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable'; const SHOT = process.env.GABE_SHOT_DIR || '';
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + path.resolve(PAGE)); await p.waitForTimeout(8000);
await p.evaluate(() => { const n = (window.nodes || []).find(x => x.ent && x.kind !== 'function'); if (n && window.__uniPanelEnt) __uniPanelEnt(n.ent); });
await p.waitForTimeout(600);
const SNAP = `(() => {
  const P = c => { const m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/); if (!m) return null;
    const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return { L: .2126 * f(+m[1]) + .7152 * f(+m[2]) + .0722 * f(+m[3]), a: m[4] == null ? 1 : +m[4], chroma: Math.max(+m[1], +m[2], +m[3]) - Math.min(+m[1], +m[2], +m[3]), raw: c }; };
  const sig = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const effBg = e => { let n = e; while (n && n !== document.documentElement) { const l = P(getComputedStyle(n).backgroundColor); if (l && l.a >= .5) return l; n = n.parentElement; } return P(getComputedStyle(document.body).backgroundColor) || { L: 0, a: 1 }; };
  const out = [];
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('nav.side')) continue; if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) continue;
    const bg = P(cs.backgroundColor), fg = P(cs.color), hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    out.push({ s: sig(e), bg: bg && bg.a >= .5 ? bg : null, fg: hasText ? fg : null, eff: hasText ? effBg(e) : null, text: hasText ? e.textContent.trim().slice(0, 28) : '' });
  } return out; })()`;
const contrast = (a, b) => { const [h, l] = a.L > b.L ? [a.L, b.L] : [b.L, a.L]; return (h + .05) / (l + .05); };
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  PASS ' + m); } else { fails++; console.log('  FAIL ' + m); } };
async function sweep(label, theme) {
  const rows = await p.evaluate(SNAP), islands = {}, unread = {}; const floor = theme === 'light' ? 3 : 2;   /* dark: a floor against INVISIBLE text (the 1:1 class), not a contrast audit — its pastel counts at 2.5–2.9 are the design */
  for (const r of rows) {
    if (theme === 'light' && r.bg && r.bg.L < .28 && r.bg.chroma < 60) { islands[r.s] = islands[r.s] || { n: 0, ex: r.bg.raw, text: r.text }; islands[r.s].n++; }
    if (r.fg && r.eff && contrast(r.fg, r.eff) < floor) { unread[r.s] = unread[r.s] || { n: 0, fg: r.fg.raw, bg: r.eff.raw, c: contrast(r.fg, r.eff).toFixed(1), text: r.text }; unread[r.s].n++; }
  }
  for (const [k, v] of Object.entries(islands)) console.log(`    grey island ${v.n}× ${k} ${v.ex} "${v.text}"`);
  for (const [k, v] of Object.entries(unread)) console.log(`    unreadable ${v.n}× ${k} ${v.fg} on ${v.bg} (${v.c}:1) "${v.text}"`);
  if (theme === 'light') ok(!Object.keys(islands).length, `${label}: every grey surface flips to light (${rows.length} elements measured)`);
  ok(!Object.keys(unread).length, `${label}: no text under ${floor}:1 outside the rail`);
  if (SHOT) await p.screenshot({ path: path.join(SHOT, `theme-${theme}-${label.replace(/\W+/g, '-')}.png`) });
}
await sweep('dark · entity panel', 'dark');
await p.evaluate(() => window.__uniApplyTheme('light')); await p.waitForTimeout(1200);
ok(await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'light' && window.__uniTheme === 'light'), 'the switch stamps data-theme=light and __uniTheme');
await sweep('light · entity panel', 'light');
await p.evaluate(() => { try { const all = window._jrnCollect ? _jrnCollect() : []; const j = all.find(x => !x.commit) || all[0]; if (j) __uniJrnStart(j.cid); } catch (e) {} }); await p.waitForTimeout(1500);
ok(await p.evaluate(() => !!(window.WALK && WALK.mode === 'journey' && WALK.steps.length)), 'a journey opened for the walk-state sweep');
await sweep('light · journey', 'light');
await p.evaluate(() => { try { _walkGo(1); } catch (e) {} }); await p.waitForTimeout(700);
await sweep('light · next step', 'light');
/* the re-ink contract: a label rendered in light darkens; switching back restores the raw colour byte-for-byte */
const rt = await p.evaluate(() => { const els = [...document.querySelectorAll('[data-c]')].filter(e => /^#[0-9a-f]{6}$/i.test(e.getAttribute('data-c'))); const before = els.map(e => e.style.color);
  window.__uniApplyTheme('dark'); const after = els.map(e => e.style.color); const raw = els.map(e => { const h = e.getAttribute('data-c'); return `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`; });
  return { n: els.length, darkened: before.filter((c, i) => c !== raw[i]).length, restored: after.filter((c, i) => c === raw[i]).length }; });
ok(rt.n > 10 && rt.restored === rt.n, `re-ink: ${rt.n} coloured labels carry their raw colour and restore it on the switch back (${rt.darkened} were darkened in light)`);
ok(errs.length === 0, `no page errors (${errs.length})`);
console.log(`  theme-probe: ${passes} passed, ${fails} failed`);
await b.close(); process.exit(fails ? 1 : 0);
