/* Proof: the journeys picker is ONE view — persistent entity chips + kind tabs + collapsible by-entity groups.
   [1] opening shows persistent chips + 3 kind tabs (e2e/by-entity/agg, default by-entity) + grouped rows; NO List/Entities buttons
   [2] switching kind tab changes the visible groups; each tab's count badge reflects included entities
   [3] clicking an entity chip hides that start-entity's group and drops the kind counts; re-click restores
   [4] clicking a group header collapses its rows (and rotates the caret); re-click expands
   Run: node verify-jrntabs.mjs */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.GABE_PW_DIR || path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);

// [1] open — persistent chips + kind tabs + groups, no old List/Entities tabs
const open = await p.evaluate(() => {
  window.__uniJrnExcl = {}; window.__uniJrnCollapse = {}; window.__uniJrnKind = 'ent';
  __uniJrnToggle();
  const j = document.getElementById('jrn');
  return {
    chips: j.querySelectorAll('.jrnentgrid .jrnent').length,
    kindTabs: j.querySelectorAll('.jrnkindtabs button').length,
    groups: j.querySelectorAll('.jgcl').length,
    rows: j.querySelectorAll('.jrnrow:not(.jrnnone)').length,
    defaultOn: (j.querySelector('.jrnkindtabs button.on') || {}).getAttribute && j.querySelector('.jrnkindtabs button.on').getAttribute('data-jk'),
    noOldTabs: !j.querySelector('[data-jt]') && !j.querySelector('.jrntabs'),
    width: Math.round(j.getBoundingClientRect().width),
    tabCounts: [...j.querySelectorAll('.jrnkindtabs button')].map(bn => ({ k: bn.getAttribute('data-jk'), n: +bn.querySelector('b').textContent })),
  };
});

// [2] switch to e2e tab → groups change, count matches
const e2e = await p.evaluate(() => {
  document.querySelector('#jrn [data-jk="e2e"]').click();
  const j = document.getElementById('jrn');
  const rows = j.querySelectorAll('.jrnrow:not(.jrnnone)').length;
  const on = j.querySelector('.jrnkindtabs button.on').getAttribute('data-jk');
  const badge = +j.querySelector('[data-jk="e2e"] b').textContent;
  document.querySelector('#jrn [data-jk="ent"]').click();  // back to by-entity
  return { on, rows, badge };
});

// [3] SPAN filter: excluding ALL entities empties the view; keeping one shows exactly the journeys that touch it
const excl = await p.evaluate(() => {
  const all = _jrnCollect();
  const ents = [...new Set(all.flatMap(j => j.ents))];
  const sumCounts = () => ['e2e', 'ent', 'agg'].reduce((s, k) => s + (+document.querySelector('#jrn [data-jk="' + k + '"] b').textContent), 0);
  // exclude everything → OR-of-included leaves nothing
  window.__uniJrnExcl = {}; ents.forEach(e => window.__uniJrnExcl[e] = 1); __uniJrnToggle(); __uniJrnToggle();
  const emptied = document.querySelectorAll('#jrn .jrnrow:not(.jrnnone)').length;
  const emptiedCounts = sumCounts();
  // keep the most-touched entity
  const cnt = {}; ents.forEach(e => cnt[e] = all.filter(j => j.ents.includes(e)).length);
  const keep = ents.sort((a, b) => cnt[b] - cnt[a])[0];
  delete window.__uniJrnExcl[keep]; __uniJrnToggle(); __uniJrnToggle();
  const keptSum = sumCounts();
  const expect = all.filter(j => j.ents.includes(keep)).length;   // shown iff span touches keep
  const chipOff = ents.filter(e => e !== keep).every(e => [...document.querySelectorAll('#jrn .jrnent')].find(c => c.getAttribute('data-e') === e).classList.contains('off'));
  // clear
  window.__uniJrnExcl = {}; __uniJrnToggle(); __uniJrnToggle();
  return { entsAll: ents.length, keep, emptied, emptiedCounts, keptSum, expect, chipOff, back: sumCounts(), total: all.length };
});

// [4] collapse a group → its rows fold; re-expand
const coll = await p.evaluate(() => {
  const j = document.getElementById('jrn');
  const g = j.querySelector('.jgcl'); const slug = g.getAttribute('data-ge');
  const totalBefore = j.querySelectorAll('.jrnrow:not(.jrnnone)').length;
  g.click();  // collapse
  const g2 = [...document.querySelectorAll('#jrn .jgcl')].find(x => x.getAttribute('data-ge') === slug);
  const collapsedClass = g2.classList.contains('cl');
  const totalAfter = document.querySelectorAll('#jrn .jrnrow:not(.jrnnone)').length;
  g2.click();  // expand
  const totalBack = document.querySelectorAll('#jrn .jrnrow:not(.jrnnone)').length;
  return { slug, totalBefore, totalAfter, totalBack, collapsedClass };
});

await b.close();

const pass = open.chips === excl.entsAll && open.chips >= 6 && open.kindTabs === 3 && open.groups > 0 && open.rows > 0 && open.defaultOn === 'ent'
  && open.noOldTabs && open.width > 480 && open.tabCounts.length === 3
  && e2e.on === 'e2e' && e2e.rows === e2e.badge
  && excl.emptied === 0 && excl.emptiedCounts === 0 && excl.keptSum === excl.expect && excl.keptSum > 0 && excl.keptSum < excl.total && excl.chipOff && excl.back === excl.total
  && coll.collapsedClass && coll.totalAfter < coll.totalBefore && coll.totalBack === coll.totalBefore
  && errs.length === 0;
console.log('[1] open chips=' + open.chips + '/' + excl.entsAll + ' kindTabs=' + open.kindTabs + ' groups=' + open.groups + ' rows=' + open.rows + ' default=' + open.defaultOn + ' noOldTabs=' + open.noOldTabs + ' width=' + open.width + ' counts=' + JSON.stringify(open.tabCounts));
console.log('[2] e2e tab: on=' + e2e.on + ' rows=' + e2e.rows + ' badge=' + e2e.badge);
console.log('[3] span filter: excludeAll rows=' + excl.emptied + ' counts=' + excl.emptiedCounts + ' | keep "' + excl.keep + '" visible=' + excl.keptSum + ' expect=' + excl.expect + ' (of ' + excl.total + ') chipsOff=' + excl.chipOff + ' back=' + excl.back);
console.log('[4] collapse "' + coll.slug + '": rows ' + coll.totalBefore + '->' + coll.totalAfter + '->' + coll.totalBack + ' clClass=' + coll.collapsedClass);
console.log('errors=' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 3).join(' | ') : ''));
console.log(pass ? 'JRNTABS: PASS' : 'JRNTABS: FAIL');
process.exit(pass ? 0 : 1);
