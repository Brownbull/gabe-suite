/* evidence-nav cases — the navigator's contract, asserted against a built page.
 * Mutation-proven 2026-08-04: each case was made to fail once (renaming the
 * mount hook, dropping a workflow, breaking the parent-link, removing a ghost)
 * before being trusted. */
import { chromium } from '/home/khujta/projects/apps/gastify/node_modules/playwright/index.mjs';
const page_path = process.argv[2];
const url = 'file://' + process.cwd() + '/' + page_path;
let pass = 0, fail = 0;
const t = (name, ok, extra = '') => {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? '  — ' + extra : ''}`); }
};
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(url); await pg.waitForTimeout(400);

// C1 — the asset mounted and drew a map
t('C1 navigator mounts and draws nodes',
  (await pg.locator('g.evnode').count()) > 0);
// C2 — every workflow in the picker renders a non-empty map
const keys = await pg.$$eval('[data-ev-wf] option', os => os.map(o => o.value));
let allDrew = keys.length > 0;
for (const k of keys) {
  await pg.selectOption('[data-ev-wf]', k); await pg.waitForTimeout(120);
  if ((await pg.locator('g.evnode').count()) === 0) allDrew = false;
}
t(`C2 all ${keys.length} workflows draw a non-empty map`, allDrew);
// C3 — clicking a node moves the evidence panel
await pg.selectOption('[data-ev-wf]', 'manual'); await pg.waitForTimeout(150);
const before = await pg.locator('[data-ev-title]').textContent();
await pg.click('g[data-state="txfields"]'); await pg.waitForTimeout(200);
const after = await pg.locator('[data-ev-title]').textContent();
t('C3 clicking a node updates the evidence panel', before !== after, `${before} → ${after}`);
// C4 — a link pill jumps workflows AND the picker follows
t('C4 link pill switches the workflow', (await pg.locator('[data-ev-wf]').inputValue()) === 'txf');
// C5 — a shared sub-workflow returns to the parent it was entered from
for (const parent of ['manual', 'scan']) {
  await pg.selectOption('[data-ev-wf]', parent); await pg.waitForTimeout(150);
  await pg.click('g[data-state="resolve"]'); await pg.waitForTimeout(150);
  await pg.click('g[data-state="backwf"]'); await pg.waitForTimeout(150);
  t(`C5 resolve returns to ${parent}`, (await pg.locator('[data-ev-wf]').inputValue()) === parent);
}
// C6 — a ghost state shows the honest gap, never an <img>
await pg.selectOption('[data-ev-wf]', 'exitw2'); await pg.waitForTimeout(150);
await pg.click('g[data-state="sealed"]'); await pg.waitForTimeout(200);
t('C6 a ghost state renders the named-gap panel, no image',
  (await pg.locator('[data-ev-shot] .gap').count()) === 1 &&
  (await pg.locator('[data-ev-shot] img').count()) === 0);
// C7 — a ✎ node renders the field→function→model table
await pg.selectOption('[data-ev-wf]', 'txf'); await pg.waitForTimeout(150);
await pg.click('g[data-state="payment"]'); await pg.waitForTimeout(200);
const cols = await pg.locator('.wmap tr').first().locator('th').count();
t('C7 a writing node maps field → function → model', cols === 3, `${cols} columns`);
// C8 — no page or console errors across all of the above
t('C8 no page/console errors', errs.length === 0, errs.join(' | '));

await b.close();
console.log(`\nevidence-nav: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
