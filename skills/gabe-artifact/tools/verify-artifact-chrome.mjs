/* gabe-artifact · chrome gate
 *
 * Proves an artifact page carries working house chrome before it is published:
 * the cog exists top-right, the panel opens, every roster option actually
 * changes the rendered type, Escape closes, the choice survives a reload, and
 * the content is left-anchored with no sideways body scroll.
 *
 * Usage:  node tools/verify-artifact-chrome.mjs [path/to/page.html]
 * Default target: ../assets/artifact-chrome.html
 *
 * Playwright resolution is borrowed from gabe-docsite (E4 — one resolver for
 * the whole suite). Override with PLAYWRIGHT_DIR=/path/to/node_modules/playwright.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const target = resolve(process.argv[2] || resolve(HERE, '../assets/artifact-chrome.html'));

const { chromium } = await import('../../gabe-docsite/tools/_playwright.mjs');

const html = await readFile(target, 'utf8');
// Serve over http so localStorage behaves as it does on the published page.
const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'load' });

check('page renders without console errors', errors.length === 0, errors.slice(0, 2).join(' | '));

/* ── cog: present, fixed, top-right ─────────────────────────────────────── */
const cog = page.locator('#af-cog');
check('cog button present', (await cog.count()) === 1);

const cogBox = await cog.boundingBox();
const vw = 1280;
check(
  'cog sits in the top-right corner',
  !!cogBox && cogBox.x > vw * 0.75 && cogBox.y < 120,
  cogBox ? `x=${Math.round(cogBox.x)} y=${Math.round(cogBox.y)}` : 'no box',
);
check(
  'cog is fixed',
  (await cog.evaluate((el) => getComputedStyle(el.parentElement).position)) === 'fixed',
);

/* ── panel opens and closes ─────────────────────────────────────────────── */
check('panel starts closed', !(await page.locator('#af-panel').isVisible()));
await cog.click();
check('panel opens on cog click', await page.locator('#af-panel').isVisible());
check('cog reports expanded', (await cog.getAttribute('aria-expanded')) === 'true');

/* ── every roster option changes the rendered type ──────────────────────── */
const roster = await page.evaluate(() =>
  [...document.querySelectorAll('#af-fonts .af-opt')].map((b) => ({
    id: b.getAttribute('data-id'),
    label: b.querySelector('.af-name')?.textContent ?? '',
    stack: b.querySelector('.af-name')?.style.fontFamily ?? '',
    spec: b.querySelector('.af-spec')?.textContent ?? '',
  })),
);
check('roster has at least two families', roster.length >= 2, `${roster.length} options`);

const seen = new Set();
for (const opt of roster) {
  await page.click(`.af-opt[data-id="${opt.id}"]`);
  const applied = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return { family: cs.fontFamily, size: cs.fontSize, track: cs.letterSpacing };
  });
  const head = opt.stack.split(',')[0].replace(/^["']|["']$/g, '').trim();
  const [wantSize, wantTrack] = opt.spec.split('/').map((s) => parseFloat(s));
  const trackPx = parseFloat(applied.track);
  const expectPx = wantSize * wantTrack;
  check(
    `option "${opt.label}" applies its family`,
    applied.family.toLowerCase().includes(head.toLowerCase()),
    `${applied.family}`,
  );
  check(
    `option "${opt.label}" applies ${wantSize}px / ${wantTrack}em`,
    parseFloat(applied.size) === wantSize && Math.abs(trackPx - expectPx) < 0.05,
    `${applied.size} · ${applied.track}`,
  );
  check(
    `option "${opt.label}" is marked checked`,
    (await page.getAttribute(`.af-opt[data-id="${opt.id}"]`, 'aria-checked')) === 'true',
  );
  seen.add(`${applied.family}|${applied.size}|${applied.track}`);
}
check('every option renders differently', seen.size === roster.length, `${seen.size} distinct of ${roster.length}`);

/* ── Escape closes ──────────────────────────────────────────────────────── */
await page.keyboard.press('Escape');
check('Escape closes the panel', !(await page.locator('#af-panel').isVisible()));

/* ── the choice survives a reload ───────────────────────────────────────── */
const last = roster[roster.length - 1];
await cog.click();
await page.click(`.af-opt[data-id="${last.id}"]`);
const before = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
await page.reload({ waitUntil: 'load' });
const after = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
check('selection persists across reload', before === after, `${after}`);

/* ── skins + section blocks (H5) ────────────────────────────────────────────
   Conditional: a page with no #af-skins group reports SKIP, loudly, rather
   than passing silently — older pages predate the skin system. */
const skinRoster = await page.$$eval('#af-skins .af-opt', ns => ns.map(n => n.getAttribute('data-id')));
if (!skinRoster.length) {
  console.log('SKIP  skin checks — page declares no #af-skins group');
} else {
  await cog.click();                       // the reload above closed the panel
  const grounds = [];
  const radii = [];
  for (const id of skinRoster) {
    await page.click(`#af-skins .af-opt[data-id="${id}"]`);
    grounds.push(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    radii.push(await page.evaluate(() => {
      const el = document.querySelector('.panel');
      return el ? parseFloat(getComputedStyle(el).borderTopLeftRadius) : NaN;
    }));
  }
  check('every skin paints a distinct ground', new Set(grounds).size === skinRoster.length,
    `${skinRoster.length} skins · ${new Set(grounds).size} grounds`);
  check('no skin has square corners', radii.every(r => Number.isNaN(r) ? true : r >= 4),
    radii.map(r => (Number.isNaN(r) ? 'n/a' : r + 'px')).join(' · '));
  const lastSkin = skinRoster[skinRoster.length - 1];
  await page.reload({ waitUntil: 'load' });
  check('skin selection persists across reload',
    (await page.evaluate(() => document.documentElement.getAttribute('data-skin'))) === lastSkin,
    lastSkin);
}

const panels = await page.$$eval('.panel', ns => ns.length);
if (!panels) {
  console.log('SKIP  rail check — page has no .panel');
} else {
  const rail = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.panel'));
    return { w: parseFloat(cs.borderLeftWidth), c: cs.borderLeftColor };
  });
  check('panels carry a left rail', rail.w >= 4 && rail.c !== 'rgba(0, 0, 0, 0)', `${rail.w}px ${rail.c}`);
}

const heads = await page.$$eval('.sec-head h2', ns => ns.map(h => {
  const c = getComputedStyle(h);
  const r = h.getBoundingClientRect();
  return {
    bg: c.backgroundColor, size: parseFloat(c.fontSize), tt: c.textTransform,
    family: c.fontFamily, radius: parseFloat(c.borderTopLeftRadius), height: r.height,
    track: parseFloat(c.letterSpacing) || 0,
    icons: h.querySelectorAll('svg').length,
  };
}));
if (!heads.length) {
  console.log('SKIP  section-block checks — page has no .sec-head h2');
} else {
  const bodySize = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  const bodyFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  check('section titles sit on a contrasting block',
    heads.every(h => h.bg !== 'rgba(0, 0, 0, 0)'), `${heads.length} titles`);
  check('section blocks are distinct colours',
    new Set(heads.map(h => h.bg)).size === heads.length,
    `${new Set(heads.map(h => h.bg)).size} of ${heads.length}`);
  /* Size and tracking stay guarded; CAPS are now the treatment, not the
     defect (founder ruling 2026-07-31, reversing the earlier uppercase ban —
     what made the old version read "massive" was the size bump beside it). */
  check('section titles stay at normal text size',
    heads.every(h => Math.abs(h.size - bodySize) <= 1.5),
    `${heads[0].size}px vs body ${bodySize}px`);
  check('section titles are set in caps',
    heads.every(h => h.tt === 'uppercase'),
    `${heads.filter(h => h.tt === 'uppercase').length} of ${heads.length}`);
  check('section title tracking stays modest',
    heads.every(h => h.track <= bodySize * 0.08),
    `${heads[0].track.toFixed(2)}px of ${(bodySize * 0.08).toFixed(2)}px allowed`);
  /* H6 — the title system: every title led by an icon, in a pill that hugs
     it, set in the title face. A missing icon or a slab corner is drift. */
  check('every section title carries an icon',
    heads.every(h => h.icons >= 1),
    `${heads.filter(h => h.icons >= 1).length} of ${heads.length} iconed`);
  check('section title blocks are pills, not slabs',
    heads.every(h => h.radius >= h.height / 2 - 0.6),
    `radius ${Math.round(heads[0].radius)}px on ${Math.round(heads[0].height)}px tall`);
  check('section titles use the title face, not the body face',
    heads.every(h => h.family !== bodyFamily),
    `${heads[0].family.split(',')[0]} vs body ${bodyFamily.split(',')[0]}`);
  /* One distinctive treatment on the page, or the distinction is worthless:
     h1 and panel headings read in the CONTENT face. */
  const otherTitles = await page.$$eval('.artifact-page :is(h1, h3, h4)',
    ns => ns.map(n => ({ tag: n.tagName.toLowerCase(), family: getComputedStyle(n).fontFamily })));
  check('other titles stay in the content face',
    otherTitles.every(o => o.family === bodyFamily),
    otherTitles.length
      ? `${otherTitles.filter(o => o.family === bodyFamily).length} of ${otherTitles.length}`
      : 'no h1/h3/h4 on the page');
}

/* The floor is measured at the roster's SMALLEST base — the page must be
   legible in every family it offers, and the loop above left the last option
   applied. Measuring at a 16px base hid an 11.8px table head at 15px. */
const smallest = roster.slice().sort((a, b) => parseFloat(a.spec) - parseFloat(b.spec))[0];
await page.evaluate((id) => {
  const b = document.querySelector(`#af-fonts .af-opt[data-id="${id}"]`);
  if (b) b.click();
}, smallest.id);

/* ── H6 · the legibility floor ─────────────────────────────────────────────
   Scoped to .artifact-page: the cog panel is chrome and sets its own labels.
   Anything inside the content column that renders its own text must compute
   at 12px or more — below that a table's status column stops being readable
   before anyone notices it stopped being read. */
const tiny = await page.evaluate(() => {
  const col = document.querySelector('.artifact-page');
  if (!col) return null;
  const out = [];
  // SVG text is authored in viewBox units and RENDERS at units × the svg's
  // display scale — a 10px label in a 360-wide viewBox shown 540px wide reads
  // at 15px. Measuring computed px alone would condemn legible diagram labels
  // and, worse, wave through tiny ones in a shrunk viewBox. So scale it.
  const scaleOf = (n) => {
    const svg = n.ownerSVGElement;
    if (!svg) return 1;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const w = svg.getBoundingClientRect().width;
    return vb && vb.width && w ? w / vb.width : 1;
  };
  col.querySelectorAll('*').forEach((n) => {
    const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim().length > 1);
    if (!own) return;
    const px = parseFloat(getComputedStyle(n).fontSize) * scaleOf(n);
    if (px < 12) {
      const cls = typeof n.className === 'string' && n.className ? '.' + n.className.split(' ')[0] : '';
      out.push(`${n.tagName.toLowerCase()}${cls}@${px.toFixed(1)}px`);
    }
  });
  return out;
});
if (tiny === null) {
  console.log('SKIP  legibility floor — page has no .artifact-page column');
} else {
  check('no content text below the 12px legibility floor',
    tiny.length === 0,
    tiny.length ? `${tiny.length} below floor: ${tiny.slice(0, 3).join(', ')}` : 'smallest ≥ 12px');
}

/* ── scrollbars belong to the skin ─────────────────────────────────────────
   Checked by COMPUTED value, and — the part that matters — re-checked after a
   skin switch. A hardcoded grey bar passes a "is it styled" test and still
   clashes with two of the three skins; only a thumb that MOVES with the theme
   is actually in sync with it. */
const sb = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return { width: cs.scrollbarWidth, color: cs.scrollbarColor };
});
check('scrollbars are styled, not the OS default', sb.width === 'thin' && sb.color !== 'auto',
  `${sb.width} · ${sb.color}`);

if (skinRoster.length > 1) {
  const thumbs = [];
  for (const id of skinRoster) {
    await page.evaluate((s) => window.__setSkin(s), id);
    // computed form is "<thumb> <track>"; the THUMB is the bar you actually see,
    // and comparing the whole pair lets a hardcoded thumb hide behind a track
    // that happens to vary with the skin.
    thumbs.push(await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement).scrollbarColor;
      const parts = v.split(/(?<=\))\s+/);
      return parts[0] || v;
    }));
  }
  check('the scrollbar thumb tracks the skin', new Set(thumbs).size === skinRoster.length,
    `${new Set(thumbs).size} distinct thumb(s) of ${skinRoster.length} skins`);
}

/* ── house layout rules ─────────────────────────────────────────────────── */
const layout = await page.evaluate(() => {
  const col = document.querySelector('.artifact-page');
  const box = col ? col.getBoundingClientRect() : null;
  return {
    align: getComputedStyle(document.body).textAlign,
    left: box ? box.left : -1,
    centred: box ? Math.abs(box.left - (window.innerWidth - box.right)) < 8 : false,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});
check('body text is left-aligned', ['left', 'start'].includes(layout.align), layout.align);
check('content column is left-anchored, not centred', !layout.centred && layout.left < 120, `left=${Math.round(layout.left)}px`);
check('no horizontal page scroll', layout.overflow <= 1, `overflow=${layout.overflow}px`);

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed — ${target}`);
process.exit(failed.length ? 1 : 0);
