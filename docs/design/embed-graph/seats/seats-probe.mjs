/* seats-probe.mjs — every seat page boots, every seat mounts, nothing says "seat failed".
   Heavy: WebGL panes on fourteen pages — run alone (one heavy job at a time). */
import { chromium } from '/home/khujta/.claude/skills/gabe-docsite/tools/_playwright.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const only = (process.argv[2] || '').split(',').filter(Boolean);
const pages = fs.readdirSync(here).filter(f => f.endsWith('.html') && (!only.length || only.includes(f))).sort();
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let P = 0, F = 0; const ok = (c, m) => { c ? P++ : F++; if (!c) console.log('  FAIL: ' + m); };
const SHOT = new Set(['entity-index.html', 'index.html', 'architecture.html', 'board.html']);
for (const f of pages) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.join(here, f), { waitUntil: 'load' });
  await p.waitForTimeout(f.startsWith('feature-') ? 3500 : 5000);
  const r = await p.evaluate(() => {
    const seats = [...document.querySelectorAll('[data-seat]')].map(s => ({
      kind: s.dataset.seat, panes: s.querySelectorAll('canvas').length,   /* skin-independent: every pane owns a WebGL canvas */
      head: s.querySelector('.seat-hd span')?.textContent.trim().slice(0, 90) || '',
      failed: /seat failed/.test(s.textContent), empty: /no curated walk names/.test(s.textContent), subs: [...s.querySelectorAll('.pn-sub, .pnc-sub, .pn .sub')].map(x => x.textContent.trim().slice(0, 60)).slice(0, 3)
    }));
    return { seats, feed: !!window.GABE_C4, pane: !!window.GabePane, gl: !!window.ForceGraph3D };
  });
  /* the PICKER: one pane, a select outside it; switching swaps the subject and keeps ONE canvas */
  const picks = await p.evaluate(async () => {
    const out = [];
    for (const host of document.querySelectorAll('[data-mode="pick"]')) {
      const sel = host.querySelector('select.seat-pick'), row = host.querySelector('.seat-row');
      const before = { canvases: row.querySelectorAll('canvas').length, head: host.getAttribute('data-picked') || '', opts: sel ? sel.options.length : 0,
                       inHead: !!(sel && sel.closest('.seat-hd')), wide: row.firstElementChild ? Math.round(row.firstElementChild.getBoundingClientRect().width) : 0, rowW: Math.round(row.getBoundingClientRect().width) };
      let after = null;
      if (sel && sel.options.length > 1) { sel.value = '1'; sel.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 1200));
        after = { canvases: row.querySelectorAll('canvas').length, head: host.getAttribute('data-picked') || '' }; }
      out.push({ kind: host.dataset.seat, before, after });
    }
    return out;
  });
  picks.forEach(k => {
    console.log(`   pick ${k.kind.padEnd(12)} options ${k.before.opts}  pane ${k.before.wide}/${k.before.rowW}px  "${k.before.head.slice(0, 50)}"` + (k.after ? ` → "${k.after.head.slice(0, 40)}" (${k.after.canvases} canvas)` : ''));
    ok(k.before.inHead && k.before.opts >= 1, `${f}: ${k.kind} picker sits in the seat head with options`);
    ok(k.before.canvases === 1, `${f}: ${k.kind} picked seat draws exactly one pane (${k.before.canvases})`);
    ok(k.before.wide >= k.before.rowW * 0.9, `${f}: ${k.kind} picked pane takes the width (${k.before.wide} of ${k.before.rowW})`);
    if (k.after) { ok(k.after.canvases === 1, `${f}: ${k.kind} switching keeps one canvas (${k.after.canvases})`);
                   ok(k.after.head !== k.before.head, `${f}: ${k.kind} switching changes the subject`); }
  });
  console.log(`\n== ${f}  feed=${r.feed} pane=${r.pane} gl=${r.gl}`);
  ok(errs.length === 0, `${f}: page errors — ${errs.slice(0, 2).join(' | ')}`);
  ok(r.seats.length > 0, `${f}: carries at least one seat`);
  r.seats.forEach(s => {
    console.log(`   seat ${s.kind.padEnd(12)} panes ${String(s.panes).padStart(2)}  ${s.head}`);
    ok(!s.failed, `${f}: seat ${s.kind} reports "seat failed"`);
    if (s.kind === 'spine') ok(/ledger rows with a commit/.test(s.head), `${f}: the spine strip is a control, not a graph — its head must count the ledger rows; reads "${s.head}"`);
    else ok(s.panes >= 1 || s.empty, `${f}: seat ${s.kind} mounted no pane (no canvas)`);
    if (s.empty) ok(/0 curated workflows/.test(s.head), `${f}: an empty journeys seat must say so in its head; reads "${s.head}"`);
  });
  if (f === 'board.html') {
    const bd = await p.evaluate(async () => {
      const chips = [...document.querySelectorAll('.bc-sha')], live = chips.filter(c => c.dataset.live === '1'), dead = chips.filter(c => c.dataset.live === '0');
      const host = document.querySelector('[data-seat="commits"]'), sel = host.querySelector('select.seat-pick');
      const r = { chips: chips.length, live: live.length, dead: dead.length, opts: sel ? sel.options.length : 0, onDone: chips.every(c => c.closest('.bcard')?.dataset.state === 'done') };
      if (live[0]) { live[0].click(); await new Promise(z => setTimeout(z, 1500));
        r.liveSha = (live[0].dataset.shas || live[0].dataset.sha).split(' ').find(x => [...sel.options].some(o => o.textContent.startsWith(x))); r.picked = host.getAttribute('data-picked'); r.selVal = sel.options[sel.selectedIndex]?.textContent.slice(0, 8);
        r.seatTop = Math.round(host.getBoundingClientRect().top); r.canvases = host.querySelectorAll('canvas').length; }
      if (dead[0]) { dead[0].click(); await new Promise(z => setTimeout(z, 300)); r.deadSha = dead[0].dataset.sha; r.deadHead = host.querySelector('.seat-hd > span').textContent; }
      return r;
    });
    console.log(`   chips ${bd.chips} (live ${bd.live} · dim ${bd.dead}) · picker ${bd.opts} commits · live press ${bd.liveSha} → picked ${bd.picked} (${bd.canvases} canvas, seat top ${bd.seatTop}px) · dim press → "${(bd.deadHead || '').slice(0, 60)}"`);
    ok(bd.opts === 30, `${f}: the picker offers every commit in commits.js (${bd.opts})`);
    ok(bd.chips === 64 && bd.live === 10 && bd.dead === 54, `${f}: 64 Done cards wear a sha, 10 live, 54 dim — got ${bd.chips}/${bd.live}/${bd.dead}`);
    ok(bd.onDone, `${f}: every sha chip sits on a Done card`);
    ok(bd.picked === bd.liveSha && bd.selVal === bd.liveSha, `${f}: a live chip selects its commit in the picker (${bd.picked} vs ${bd.liveSha})`);
    ok(bd.canvases === 1 && bd.seatTop >= -5 && bd.seatTop < 400, `${f}: the seat scrolled into view with one canvas (top ${bd.seatTop}px)`);
    ok(/does not carry/.test(bd.deadHead || ''), `${f}: a dim chip says the feed does not carry its commit`);
    /* the SPINE strip: five beats, the ledger's counts, the latest preselected, a pick drives the commit seat */
    const sp = await p.evaluate(async () => {
      const host = document.querySelector('[data-seat="spine"]'), cols = [...host.querySelectorAll('.sp-col')];
      const data = JSON.parse(host.getAttribute('data-spine'));
      const r = { beats: cols.map(c => c.dataset.beat), counts: cols.map(c => c.querySelector('select') ? c.querySelector('select').options.length : 0),
                  data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])), latest: cols.map(c => c.dataset.sha),
                  latestData: Object.values(data).map(v => v[0] && v[0].sha), head: host.querySelector('.seat-hd > span').textContent };
      const ex = cols.find(c => c.dataset.beat === 'EXECUTE'), sel = ex.querySelector('select');
      const liveIdx = [...sel.options].findIndex(o => o.textContent.startsWith('\u25cf'));
      if (liveIdx >= 0) { sel.value = String(liveIdx); sel.dispatchEvent(new Event('change')); await new Promise(z => setTimeout(z, 1500));
        r.pickSha = ex.dataset.sha; r.pickLive = ex.dataset.live; r.picked = document.querySelector('[data-seat="commits"]').getAttribute('data-picked'); }
      const dimIdx = [...sel.options].findIndex(o => o.textContent.startsWith('\u25cb'));
      if (dimIdx >= 0) { sel.value = String(dimIdx); sel.dispatchEvent(new Event('change')); await new Promise(z => setTimeout(z, 300));
        r.dimSha = ex.dataset.sha; r.dimHead = document.querySelector('[data-seat="commits"] .seat-hd > span').textContent; r.dimPill = ex.querySelector('.sp-live').textContent; }
      return r;
    });
    console.log(`   spine ${sp.beats.join('·')} counts ${sp.counts.join('/')} · latest ${sp.latest.join('/')} · live pick ${sp.pickSha}→${sp.picked} · dim ${sp.dimSha} "${(sp.dimHead || '').slice(0, 50)}"`);
    ok(JSON.stringify(sp.beats) === JSON.stringify(['RED', 'EXECUTE', 'REVIEW', 'COMMIT', 'PUSH']), `${f}: the spine strip holds the five beats in order`);
    ok(sp.counts.every((n, i) => n === sp.data[sp.beats[i]]), `${f}: each column lists exactly the ledger rows with a commit (${sp.counts.join('/')})`);
    ok(sp.latest.every((sha, i) => sha === sp.latestData[i]), `${f}: each column preselects the beat's latest commit`);
    ok(sp.pickLive === '1' && sp.picked === sp.pickSha, `${f}: a drawable spine pick drives the commit seat (${sp.pickSha} → ${sp.picked})`);
    ok(sp.dimSha && /does not carry/.test(sp.dimHead) && /feed stops/.test(sp.dimPill), `${f}: an undrawable pick keeps the ledger facts and says the feed stops (${sp.dimPill})`);
  }
  if (SHOT.has(f)) await p.screenshot({ path: `/tmp/claude-1000/-home-khujta-projects-gabe-lens/0b3d1f35-549a-413a-a657-5f6519a04f00/scratchpad/shot-seat-${f.replace('.html', '')}.png`, clip: { x: 0, y: 0, width: 1400, height: 1000 } });
  await p.close();
}
await b.close();
console.log(`\n${P} passed · ${F} failed`); process.exit(F ? 1 : 0);
