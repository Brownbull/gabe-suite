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
