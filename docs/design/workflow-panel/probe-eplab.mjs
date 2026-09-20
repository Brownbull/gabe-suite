/* probe-eplab.mjs — the endpoint lab's render proof (headless system Chrome via the spike's playwright-core).
   Same recipe as tests/gabe-universe/run.sh §13: /usr/bin/google-chrome-stable + swiftshader, file:// load.

     node docs/design/workflow-panel/probe-eplab.mjs [checks.json] [--shots DIR]

   Without a checks file it proves the shell: the page boots, the five tabs exist and switch, every tab renders
   without a render error, the head strip carries the door's name · method · entity · status · file:line · the risk
   flag · the three ABOVE rows, the hover card opens with content, nothing inside #bench computes under 12px, and
   the no-loss checklist state is printed. A checks file adds assertions: [{name, tab?, kind:"text"|"selector"|
   "eval"|"hover", arg, expect?}] — text = the panel's innerText contains arg · selector = at least one match ·
   eval = a JS expression on the page returning truthy · hover = hover the first match of arg and expect the card
   to contain `expect`. Exit 1 on any failure. --shots writes one PNG per tab (work + dock boxes). */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import zlib from 'node:zlib';
// a screenshot's pixels, for asserts that must read what was DRAWN (8-bit RGB/RGBA, non-interlaced — what Chrome writes)
function decodePng(buf) {
  let o = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (o < buf.length) { const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
    o += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, st = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(w * h * bpp);
  for (let y = 0; y < h; y++) { const f = raw[y * (st + 1)], ln = y * (st + 1) + 1;
    for (let x = 0; x < st; x++) { const a = x >= bpp ? px[y * st + x - bpp] : 0, b = y ? px[(y - 1) * st + x] : 0, c = x >= bpp && y ? px[(y - 1) * st + x - bpp] : 0;
      let v = raw[ln + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * st + x] = v & 255; } }
  return { w, h, at: (x, y) => { const i = (y * w + x) * bpp; return [px[i], px[i + 1], px[i + 2]]; } }; }
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const PAGE = path.join(HERE, 'endpoint-lab.html');
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core');
const CHROME = '/usr/bin/google-chrome-stable';
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots') >= 0 ? args[args.indexOf('--shots') + 1] : null;
const checksFile = args.find(a => a.endsWith('.json'));
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
const { chromium } = require(PW);
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra ? ' — ' + extra : '')); } };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1040 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 }).catch(() => {});
ok(await p.evaluate(() => window.__eplabReady === true), 'the page boots (window.__eplabReady)');
ok(errs.length === 0, 'no page errors', errs.slice(0, 3).join(' | '));
const F = await p.evaluate(() => window.LABEP);
const tabs = await p.$$eval('#tabs .tab', els => els.map(e => e.dataset.tab));
ok(tabs.join(',') === 'data,schemas,functions,tests,widening,security', 'SIX tabs — data and schemas split again (operator 2026-09-12)', tabs.join(','));
// ── THE RAIL OPENS ON ONE REGION (operator 2026-09-12) — every block but the one in play is folded at
//    BOOT. Pinned here, before anything clicks, because the rest of the probe needs them open. ──
{ const folded = await p.$$eval('.barblk.min', els => els.map(e => e.id));
  const all = await p.$$eval('.barblk', els => els.map(e => e.id));
  const open = all.filter(id => folded.indexOf(id) < 0);
  ok(open.length === 1, 'exactly ONE control block is open at boot', open.join(',') || 'none');
  ok(open[0] === await p.evaluate(() => window.OPENBLK), 'and it is the region being worked on', open[0]);
  ok(await p.$eval('#blk-bench .blkbody', e => getComputedStyle(e).display === 'none'), 'a folded block really is away');
  // open them all so the rest of the probe can reach every control
  await p.evaluate(() => document.querySelectorAll('.barblk.min').forEach(b => b.classList.remove('min')));
  await p.waitForTimeout(120); }

// the DATA panel boots on the operator's own default line (2026-09-12)
ok(await p.evaluate(() => window.COPYTXT.data()) ===
   'data · shown as stageblocks · tables all · title counts tables icon, fields icon, ops icon · sort channel, icon, accent on panel 45% · pills each, shape pill, text ink, ground kind 15%'
   + ' · block block (icon on model, chip on, name on, entity both, count badge, model both) · edge left solid 2px · chips count pill 100%, channel pill 90%'
   + ' · lines icon name | — / ent | count rw / model | — · sizes icon 13 rw 11 name 13 ent 12 count 11 model 12'
   + ' · squares 14px gap 4 round as symbol by type, optional marked, unique corners both, arms 40% 1.5px tip 10%, standard 100% optional 50% · footer hint | id text num flag time list other opt, icon count · grounds by size, width flex, tiles stack'
   + ' · stages axis rows, placement every, empty shown, union counts, fate station, rail shown'
   + ' · drawn counts shapes rw commit ev mdl ents legend · hidden title note',
   'the data panel boots on the operator\'s default line', await p.evaluate(() => window.COPYTXT.data()));

// the COMMAND panel boots on ITS default line (2026-09-17: the by-part card is the default grouping)
// ── THE THREE REGION LINES (operator 2026-09-17): the rail is grouped by region, so the picks that
//    reach the MIDDLE and the PORTRAIT left the command line and took their own.
const CMDBOOT = 'command · layout card · verbs g2 · grouping request · names drawn · success shown'
  + ' · sub-paths split · wrong-question blank · hotkeys QWERT grid'
  + ' · cells 64px valley · tooltip lab hover card'
  + ' · card side right of portrait · ladder in the region · walking one-clock replay · rate-limit chip shown'
  + ' · colour by kind · matrix per-path · region 360px, gap 12px · drawn chip strip region title caption · nothing hidden';
ok(await p.evaluate(() => window.COPYTXT.command()) === CMDBOOT,
   'the command panel boots on its default line, word for word — only what reaches the command region',
   await p.evaluate(() => window.COPYTXT.command()));
const MIDBOOT = 'middle · part bars data=stageblocks · schemas=shapes · functions=levels · tests=status · widening=ladder · security=band'
  + ' · label dim .28 · rows command · on part switch kept · test join exact';
ok(await p.evaluate(() => window.COPYTXT.middle()) === MIDBOOT,
   'the middle boots on its own line — the part bars and the four dials a chosen ending drives',
   await p.evaluate(() => window.COPYTXT.middle()));
const PORTBOOT = 'portrait · on select path record · width 440px, height 560px, outline 1px solid, gap 12px';
ok(await p.evaluate(() => window.COPYTXT.portrait()) === PORTBOOT,
   'and the portrait on its own — what it leads with, and how big it stands',
   await p.evaluate(() => window.COPYTXT.portrait()));
{ const b2 = await p.evaluate(() => window.COPYTXT.bench()), h2 = await p.evaluate(() => window.COPYTXT.head()),
        t2 = await p.evaluate(() => window.COPYTXT.tabs());
  ok(/ · outline 1px solid$/.test(b2), 'the bench line carries the bench outline the FRAME block used to hold', b2);
  ok(/ · height 45px, outline none, divider none, gap 0px$/.test(h2), 'the head-bar line carries its own height, outline, divider and gap', h2.slice(-70));
  ok(/ · row height 52px, button 43px, outline none, divider none, gap 0px$/.test(t2), 'and the part-buttons line its row, its button and its lines', t2.slice(-80)); }

// the head strip carries the station card's head
const head = await p.$eval('#headstrip', e => e.innerText);
for (const s of [F.identity.path, String(F.identity.status), F.identity.file + ':' + F.identity.flines]) ok(head.includes(s), 'head strip shows ' + s);
// the ENTITY is no longer its own chip (the UP trio carries it, operator 2026-09-11) — it must still be
// reachable: a chip drawn in the entity's own colour whose hover card names it. No-loss, not no-text.
{ const entChip = await p.$(`#headstrip .hpile.right .hel:nth-child(2)`);
  let named = false; if (entChip) { await entChip.hover(); await p.waitForTimeout(120);
    named = await p.evaluate(e => document.getElementById('hover').innerText.includes(e), F.identity.entity); }
  ok(named, 'the entity is still reachable on the bar — the UP trio\'s entity chip names it on hover');
  const cl = await p.$(`#headstrip .hpile.right .hel:nth-child(1)`);
  let clNamed = false; if (cl) { await cl.hover(); await p.waitForTimeout(120);
    clNamed = await p.evaluate(c => document.getElementById('hover').innerText.includes(c), F.identity.cluster); }
  ok(clNamed, 'the cluster is still reachable on the bar — the UP trio\'s cluster chip names it on hover'); }
ok(await p.$('#headstrip #mbadge canvas') !== null, 'the METHOD badge is painted by the station painter (canvas)');
{ const rc = await p.$('#headstrip .hel[data-el="risk"]');
  ok(rc !== null, 'the risk flag is on the head bar');
  if (rc) { await rc.hover(); await p.waitForTimeout(120);
    ok(await p.evaluate(() => document.getElementById('hover').innerText.toLowerCase().includes('large surface')), 'the risk flag names its reason on hover (its words are off by the operator\'s default)'); } }
ok((await p.$$('#headstrip .habove .hel')).length === 3, 'ABOVE ladder: cluster · entity · everything');
ok(await p.evaluate(() => window.headOrder('right').includes('above')), 'the CLUSTER reaches the bar through the UP trio');
ok(!/API ENDPOINT/i.test(head), 'the kind is NOT spelled out beside its own glyph by default');
// every chip in the bar is vertically centred: its icon and its text share a centre line
const align = await p.$$eval('#headstrip .hel', els => els.map(e => { const svg = e.querySelector('svg,canvas,.pdot'), t = [...e.querySelectorAll('.hval,.pname,.hlbl')][0];
  if (!svg || !t) return 0; const a = svg.getBoundingClientRect(), b = t.getBoundingClientRect(); return Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)); }));
ok(align.every(d => d <= 1.5), 'every bar chip centres its icon against its text (the misalignment the operator caught)', 'worst ' + Math.max(...align).toFixed(2) + 'px');
// every element in the bar answers a hover with a card
const hels = await p.$$('#headstrip .hel');
let hov = 0; for (const h of hels) { await h.hover(); await p.waitForTimeout(60); if (await p.evaluate(() => { const x = document.getElementById('hover'); return !x.hidden && x.innerText.length > 12; })) hov++; }
ok(hov === hels.length, 'every bar chip opens a hover card', hov + ' of ' + hels.length);
// the card must land ON SCREEN and keep the station's width cap (a truncated CSS lift once made it full-bleed)
const hb = await p.evaluate(() => { const x = document.getElementById('hover'); const r = x.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, vw: innerWidth }; });
ok(hb.l >= 0 && hb.l + hb.w <= hb.vw + 1 && hb.w <= 364 && hb.w >= 180, 'the hover card sits on screen at the station width', JSON.stringify(hb));
// the rail's head-bar section switches an element off and the verbosity mode
const before = (await p.$$('#headstrip .hel')).length;
await p.evaluate(() => { window.HEADCFG.off.status = 1; window.drawHead(); }); await p.waitForTimeout(80);
ok((await p.$$('#headstrip .hel')).length === before - 1, 'switching an element off removes it from the bar');
await p.evaluate(() => { delete window.HEADCFG.off.status; window.HEADCFG.mode = 'icon'; window.drawHead(); }); await p.waitForTimeout(80);
const iconOnly = await p.$eval('#headstrip', e => e.innerText);
ok(!iconOnly.includes(F.identity.file), 'in ICON mode the bar spends no words — the values live on the hover cards');
await p.evaluate(() => { window.HEADCFG.mode = 'label'; window.drawHead(); }); await p.waitForTimeout(80);
ok((await p.$eval('#headstrip', e => e.innerText)).toLowerCase().includes('cluster'), 'in LABEL mode the bar names each field for learning');
await p.evaluate(() => { window.HEADCFG.mode = 'value'; window.drawHead(); }); await p.waitForTimeout(80);
// hover card opens with content (the badge)
await p.hover('#headstrip #mbadge'); await p.waitForTimeout(120);
ok(await p.evaluate(() => { const h = document.getElementById('hover'); return !h.hidden && h.innerText.length > 10; }), 'the hover card opens on the method badge');
// every tab renders, in both boxes; nothing under 12px inside #bench; shots
const floor = async () => p.evaluate(() => { let n = 0, worst = 99, chosen = 0; const B = (window.DATACFG || {}).bk || { size: {} };
  document.querySelectorAll('#bench *').forEach(el => { if (!el.offsetParent && el.tagName !== 'BODY') return;
    const t = el.childNodes && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) {
      // the OPERATOR sized the two title chips under the floor on purpose (2026-09-13) — counted apart, never hidden
      const part = el.closest('.bkhd .bkrw') ? 'rw' : el.closest('.bkhd .bkn') ? 'count' : null;
      if (part && (B.size[part] || 12) < 12 && Math.round(fs) === B.size[part]) { chosen++; return; }
      n++; worst = Math.min(worst, fs); } });
  return { under: n, worst, chosen }; });
{ // the two chips live on the BLOCKS distribution's title row, so the floor is read there and the
  // panel goes straight back to the distribution it booted on (STAGES, 2026-09-17)
  await p.evaluate(() => { window.showVariant('data', 'blocks'); window.showTab('data'); }); await p.waitForTimeout(200);
  const fl = await floor();
  ok(fl.under === 0 && fl.chosen > 0 && await p.evaluate(() => window.DATACFG.bk.size.rw < 12 && window.DATACFG.bk.size.count < 12),
     'the only text under 12px is the two title chips the operator sized there on purpose — named, not hidden', JSON.stringify(fl));
  await p.evaluate(() => { window.showVariant('data', window.PANELS.data.defaultVariant); window.showTab('data'); }); await p.waitForTimeout(200); }
for (const box of ['work', 'dock']) {
  await p.evaluate(() => window.railTab('controls')); await p.click(`#boxes .ib[data-box="${box}"]`);
  for (const t of tabs) {
    await p.click(`#tabs .tab[data-tab="${t}"]`); await p.waitForTimeout(150);
    const err = await p.$('#panel .perr');
    ok(err === null, `tab ${t} renders in the ${box} box`, err ? await err.innerText() : '');
    const dims = await p.$eval('#panel', e => ({ w: e.clientWidth, h: e.clientHeight, sw: e.scrollWidth, sh: e.scrollHeight }));
    ok(dims.sw <= dims.w + 1 && dims.sh <= dims.h + 1, `tab ${t} fits the ${box} box (no overflow)`, JSON.stringify(dims));
    const fl = await floor(); ok(fl.under === 0, `tab ${t} (${box}): no text under 12px`, fl.under + ' nodes, worst ' + fl.worst + 'px');
    if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true }); await p.$eval('#bench', e => e.scrollIntoView()); await (await p.$('#bench')).screenshot({ path: path.join(shotsAt, `eplab-${box}-${t}.png`) }); }
  }
}
await p.evaluate(() => window.railTab('controls')); await p.click('#boxes .ib[data-box="work"]');
// every DISTRIBUTION of every part renders, fits and holds the floor (work box); then the density dial
const variants = await p.evaluate(() => { const o = {}; for (const k in window.PANELS) o[k] = window.PANELS[k].variants.map(v => v.key); return o; });
for (const t of tabs) {
  for (const v of variants[t]) {
    await p.evaluate(([t, v]) => window.showVariant(t, v), [t, v]); await p.waitForTimeout(140);
    const err = await p.$('#panel .perr');
    ok(err === null, `${t} · ${v} renders`, err ? await err.innerText() : '');
    const dims = await p.$eval('#panel', e => ({ w: e.clientWidth, h: e.clientHeight, sw: e.scrollWidth, sh: e.scrollHeight }));
    ok(dims.sw <= dims.w + 1 && dims.sh <= dims.h + 1, `${t} · ${v} fits the box`, JSON.stringify(dims));
    const fl = await floor(); ok(fl.under === 0, `${t} · ${v}: no text under 12px`, fl.under + ' nodes, worst ' + fl.worst + 'px');
    if (shotsAt && variants[t].indexOf(v) > 0) { fs.mkdirSync(shotsAt, { recursive: true }); await (await p.$('#bench')).screenshot({ path: path.join(shotsAt, `eplab-var-${t}-${v}.png`) }); }
  }
  await p.evaluate(t => window.showVariant(t, window.PANELS[t].variants[0].key), t);
}
for (const d of ['air', 'dense']) {
  await p.evaluate(() => window.railTab('controls')); await p.click(`#dens .ib[data-dens="${d}"]`); await p.waitForTimeout(120);
  for (const t of tabs) {
    await p.click(`#tabs .tab[data-tab="${t}"]`); await p.waitForTimeout(120);
    const dims = await p.$eval('#panel', e => ({ w: e.clientWidth, h: e.clientHeight, sw: e.scrollWidth, sh: e.scrollHeight }));
    ok(dims.sw <= dims.w + 1 && dims.sh <= dims.h + 1, `${t} fits at density ${d}`, JSON.stringify(dims));
    const fl = await floor(); ok(fl.under === 0, `${t} at density ${d}: no text under 12px`, fl.under + ' nodes, worst ' + fl.worst + 'px');
  }
}
await p.click('#dens .ib[data-dens="normal"]');
// the part buttons carry icon + NAME + count (operator 2026-09-11)
const btn = await p.$eval('#tabs .tab[data-tab="data"]', e => ({ w: e.clientWidth, h: e.clientHeight, txt: e.innerText, svg: !!e.querySelector('.tabi svg'), badge: !!e.querySelector('.tabn') }));
ok(btn.svg && btn.badge && /Data/i.test(btn.txt), 'a part button carries its icon, its NAME and its count badge', JSON.stringify(btn));
ok(btn.w > btn.h * 1.9 && btn.h <= 52, 'the part button is a WIDE command tile — horizontal, short (operator 2026-09-11)', btn.w + '×' + btn.h);
const scroll = await p.evaluate(() => { const el = document.querySelector('.ldg') || document.querySelector('#panel [style*="overflow"], #panel'); const cs = getComputedStyle(document.documentElement); return { w: cs.scrollbarWidth, c: cs.scrollbarColor }; });
ok(scroll.w === 'thin', 'scrollbars are the station\'s narrow themed ones', JSON.stringify(scroll));
// ── the two cards the operator asked to be legible: status marks the SUCCESS case and explains every
//    code; risk shows all THREE rules with the firing one marked; long values stack onto their own line
{ const sc = await p.$('#headstrip .hel[data-el="status"]'); await sc.hover(); await p.waitForTimeout(160);
  const c = await p.$eval('#hover', e => ({ txt: e.innerText,
    title: (e.querySelector('.cphd b') || {}).textContent, value: (e.querySelector('.cphv') || {}).textContent,
    states: [...e.querySelectorAll('.fct')].map(x => x.className.replace('fct ', '')),
    names: [...e.querySelectorAll('.fct .fctn')].map(x => x.textContent.trim()),
    rules: [...e.querySelectorAll('.fct .fctrule')].map(x => x.textContent.trim()),
    dots: e.querySelectorAll('.fct .fdot').length,
    w: Math.round(e.getBoundingClientRect().width) }));
  ok(/declares/.test(c.title) && c.value.trim() === String(F.identity.status), 'the status card leads with the condition and the code it declares', c.title + ' · ' + c.value);
  ok(c.states.filter(s => s === 'ok').length === 1, 'exactly one code is marked as the declared SUCCESS', c.states.join(' | '));
  ok(c.names[0].trim() === String(F.identity.status), 'and it is the declared one', c.names.join(','));
  ok(c.states.length >= 5, 'every code the cases assert gets its own block', String(c.states.length));
  ok(c.dots === c.states.length, 'each block carries a dot — filled for the declared one, hollow for the rest', c.dots + '/' + c.states.length);
  for (const m of ['the state forbids it', 'a field is invalid', 'no such row', 'malformed']) ok(c.txt.includes(m), 'the card explains "' + m + '"');
  ok(/SUCCESS/.test(c.txt), 'the declared code says SUCCESS');
  ok(c.w <= 364, 'the card keeps a readable width', String(c.w)); }
{ const rc = await p.$('#headstrip .hel[data-el="risk"]'); await rc.hover(); await p.waitForTimeout(160);
  const c = await p.$eval('#hover', e => ({ txt: e.innerText,
    title: (e.querySelector('.cphd b') || {}).textContent, value: (e.querySelector('.cphv') || {}).textContent,
    cond: !!e.querySelector('.cpcond'),
    factors: [...e.querySelectorAll('.fct')].map(x => x.className.replace('fct ', '')),
    names: [...e.querySelectorAll('.fct .fctn')].map(x => x.textContent.trim()),
    rules: [...e.querySelectorAll('.fct .fctrule')].map(x => x.textContent.trim()),
    notes: e.querySelectorAll('.fct .fctnote').length,
    quietInk: [...e.querySelectorAll('.fct.quiet .fctn')].map(x => getComputedStyle(x).color),
    plainLast: (() => { const end = e.querySelector('.cpend'); if (!end) return false;
      const kids = [...e.children]; return kids.indexOf(end) >= kids.length - 2 && !!end.querySelector('.cpplain'); })() }));
  // 1 · the condition is the title, its diagnosis the value
  ok(/conflict/.test(c.title) && /large surface/i.test(c.value || ''), 'the card leads with the CONDITION and its diagnosis', c.title + ' · ' + c.value);
  ok(!c.cond, 'no definition under the title — it is said ONCE, at the end (operator 2026-09-11)');
  // 2 · the factors are a LIST, all three, the firing one lit and the quiet ones still legible
  ok(c.factors.length === 3, 'all THREE rules are listed, not just the one that fired', c.factors.join(' | '));
  ok(await p.$eval('#hover .fct.fire .fdot', e => { const c = getComputedStyle(e); return c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.borderRadius.startsWith('50'); }), 'the firing factor is a FILLED round dot, not a triangle');
  ok(await p.$eval('#hover .fct.quiet .fdot', e => getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)'), 'a quiet factor is a HOLLOW dot');
  ok(c.factors.filter(f => f === 'fire').length === 1 && c.factors.filter(f => f === 'quiet').length === 2, 'one fires, two stay quiet', c.factors.join(' | '));
  ok(c.rules.length === 3 && /≥ 15/.test(c.rules[0]) && /≥ 50/.test(c.rules[1]) && /no test/.test(c.rules[2]), 'each factor states its own threshold', c.rules.join(' | '));
  ok(c.notes === 3, 'each factor carries a quiet NOTE on how it is calculated', String(c.notes));
  ok(!e0(c.quietInk), 'a rule that did not fire is still legible — not faded into the border colour', c.quietInk.join(' '));
  // 3 · the feed-wide comparison is GONE from this card (it is not about this door)
  ok(!/rank \d+ of \d+/.test(c.txt) && !/BOOT lifespan/.test(c.txt) && !/median \d/.test(c.txt) && !/the other \d+ doors/.test(c.txt),
     'no feed-wide comparison on this card — it is not about this door', c.txt.slice(0, 90));
  ok(/impact/i.test(c.txt) && new RegExp('touches ' + F.functions.behind.fns + ' functions').test(c.txt), 'the card states the IMPACT in this door\'s own terms', c.txt.slice(0, 120));
  ok(!/BFS/.test(c.txt), 'the call-mass note dropped the BFS aside');
  // 4 · the plain line is LAST, after a separator
  ok(c.plainLast, 'the plain line comes LAST, after a separator'); }
function e0(cols){ return cols.some(c => { const m = c.match(/\d+/g); return m && +m[0] < 90 && +m[1] < 100 && +m[2] < 120; }); }
// ── THE PLAIN LINE: every bar card opens with one sentence in the legend reference's own voice ──
{ const hels = await p.$$('#headstrip .hel'); let withPlain = 0, texts = [];
  for (const h of hels) { await h.hover(); await p.waitForTimeout(70);
    const t = await p.$eval('#hover', e => { const el = e.querySelector('.cpplain'); return el ? el.textContent : ''; });
    if (t && t.length > 15) { withPlain++; texts.push(t); } }
  ok(withPlain === hels.length, 'every chip on the bar opens with a PLAIN line', withPlain + ' of ' + hels.length);
  ok(texts.some(t => /the API door the frontend knocks on/.test(t)), 'the kind reuses the legend reference\'s own words, verbatim');
  ok(texts.every(t => t.length <= 180), 'each plain line stays one sentence', String(Math.max(...texts.map(t => t.length)))); }
{ const n = await p.evaluate(() => Object.keys(window.STATION.LRDEF || {}).length);
  ok(n >= 80, 'the legend\'s definitions are LIFTED, not retyped', String(n)); }
// a card states CERTAINTIES — no open design question anywhere on the bar (operator 2026-09-11)
{ let q = []; for (const h of await p.$$('#headstrip .hel')) { await h.hover(); await p.waitForTimeout(60);
    const t = await p.$eval('#hover', e => e.innerText); if (/\?/.test(t)) q.push(t.split('\n').find(l => /\?/.test(l))); }
  ok(q.length === 0, 'no card asks the reader a question', q.join(' | ').slice(0, 140)); }
// the definition is said ONCE per card — the plain line must not repeat a line already on the card
{ const dup = []; for (const h of await p.$$('#headstrip .hel')) { await h.hover(); await p.waitForTimeout(60);
    const d = await p.$eval('#hover', e => { const pl = e.querySelector('.cpplain'); if (!pl) return null;
      const rest = [...e.children].filter(x => !x.classList.contains('cpend')).map(x => x.innerText).join(' ');
      const words = pl.textContent.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 5);
      const hit = words.filter(w => rest.toLowerCase().includes(w));
      return hit.length > words.length * 0.6 ? pl.textContent : null; });
    if (d) dup.push(d); }
  ok(dup.length === 0, 'the definition appears once, at the end — never repeated above it', dup.join(' | ').slice(0, 140)); }
// ── every control block FOLDS AWAY without losing its settings (operator 2026-09-11) ──
{ const blks = await p.$$eval('.barblk', els => els.map(e => e.id));
  ok(blks.join(',') === 'blk-bench,blk-head,blk-tabs,blk-middle,blk-data,blk-schemas,blk-functions,blk-portrait,blk-command',
     'nine control blocks, top to bottom = the console left to right, then its parts (operator 2026-09-17)', blks.join(','));
  const before = await p.evaluate(() => window.COPYTXT.tabs());
  await p.click('#blk-tabs .mnb'); await p.waitForTimeout(120);
  ok(await p.$eval('#blk-tabs', e => e.classList.contains('min')), 'a block folds when its chevron is clicked');
  ok(await p.$eval('#blk-tabs .blkbody', e => getComputedStyle(e).display === 'none'), 'and its body is gone from the rail');
  ok(await p.evaluate(() => window.COPYTXT.tabs()) === before, 'folding changes nothing about what it controls');
  await p.click('#blk-tabs .mnb'); await p.waitForTimeout(120);
  ok(await p.$eval('#blk-tabs .blkbody', e => getComputedStyle(e).display !== 'none'), 'and it opens again'); }
// ── the PART BUTTONS block: ten dials, each one reaching the row ──
// the DEFAULT the operator picked: the watermark glyph CLIPPED to the button, never spilling out
{ const g = await p.evaluate(() => { const t = document.querySelector('#tabs .tab'), i = t.querySelector('.tabi');
    const tb = t.getBoundingClientRect(), ib = i.getBoundingClientRect();
    return { mode: window.TABCFG.iconMode, size: window.TABCFG.iconSize, overflow: getComputedStyle(t).overflow,
             glyph: Math.round(ib.height), button: Math.round(tb.height), pos: getComputedStyle(i).position,
             op: +getComputedStyle(i).opacity }; });
  ok(g.mode === 'ghost' && g.size === 22, 'the button row opens with the clipped watermark', JSON.stringify({ m: g.mode, s: g.size }));
  ok(g.overflow === 'hidden', 'the button CLIPS it — the glyph never goes beyond the border (operator 2026-09-11)', g.overflow);
  ok(g.glyph > g.button, 'and the glyph is genuinely bigger than the button, so it reads as a watermark', g.glyph + ' in ' + g.button);
  ok(g.pos === 'absolute' && g.op < .5, 'placed to the right, translucent', JSON.stringify({ p: g.pos, o: g.op })); }
{ const rows = await p.$$eval('#tabcfg .cfl', els => els.map(e => e.textContent));
  ok(rows.join(',') === 'colour,intensity,pattern,glyph size,glyph shown,glyph side,titles,count size,count shape,button shape,row,width',
     'twelve dials for the part-button row', rows.join(','));
  const t0 = await p.$eval('#tabs', e => e.className);
  await p.click('#tabcfg .ib[data-palette="mono"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs', e => e.className.includes('pal-mono')), 'the colour dial reaches the row');
  await p.click('#tabcfg .ib[data-intensity="bold"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs', e => e.className.includes('int-bold')), 'so does intensity');
  await p.click('#tabcfg .ib[data-pattern="hatch"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs', e => e.className.includes('pat-hatch')), 'so does the pattern');
  await p.click('#tabcfg .ib[data-iconmode="bleed"]'); await p.waitForTimeout(120);
  const bleed = await p.$eval('#tabs .tab .tabi', e => { const b = e.getBoundingClientRect(), t = e.closest('.tab').getBoundingClientRect();
    return { pos: getComputedStyle(e).position, over: Math.round(b.height - t.height), op: +getComputedStyle(e).opacity }; });
  ok(bleed.pos === 'absolute' && bleed.over > 0 && bleed.op < .5,
     'the BLEED glyph is a big translucent watermark that overflows the button top and bottom', JSON.stringify(bleed));
  // the glyph's size and side are DRAGGED BARS now (operator 2026-09-12)
  { const sl = await p.$$('#tabcfg .sld'); ok(sl.length === 2, 'glyph size and glyph side are sliders', String(sl.length));
    const drag = async (i, frac) => { const t = (await p.$$('#tabcfg .sldt'))[i]; const r = await t.boundingBox();
      await p.mouse.move(r.x + r.width * frac, r.y + r.height / 2); await p.mouse.down();
      await p.mouse.move(r.x + r.width * frac, r.y + r.height / 2, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(110); };
    await drag(0, 0.98);   // glyph size to its maximum
    const big = await p.evaluate(() => ({ cfg: window.TABCFG.iconSize, svg: +document.querySelector('#tabs .tab .tabi svg').getAttribute('width') }));
    ok(big.cfg >= 44 && big.svg > 100, 'dragging the size bar to the end enlarges the watermark', JSON.stringify(big));
    await drag(0, 0.02);
    const small = await p.evaluate(() => window.TABCFG.iconSize);
    ok(small <= 13, 'and dragging it back shrinks it', String(small));
    await p.evaluate(() => { window.TABCFG.iconSize = 24; window.drawTabs(); window.drawTabCfg(); }); await p.waitForTimeout(100); }
  await p.click('#tabcfg .ib[data-iconmode="inline"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabi svg', e => +e.getAttribute('width') === 24), 'the inline glyph takes the size literally');
  await p.click('#tabcfg .ib[data-numshape="circle"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabn', e => getComputedStyle(e).borderRadius.startsWith('50')), 'the count wears its own shape');
  await p.click('#tabcfg .ib[data-numsize="17"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabn', e => parseFloat(getComputedStyle(e).fontSize) === 17), 'and its own size');
  await p.click('#tabcfg .ib[data-shape="pill"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab', e => getComputedStyle(e).borderRadius.startsWith('999')), 'the button wears its own shape');
  await p.click('#tabcfg .ib[data-layout="center"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs', e => getComputedStyle(e).justifyContent === 'center'), 'the row can centre its buttons');
  await p.click('#tabcfg .ib[data-width="wide"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab', e => parseFloat(getComputedStyle(e).minWidth) >= 170), 'and run them wide');
  // the three dials the operator added last
  await p.click('#tabcfg .ib[data-casemode="caps"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabw', e => getComputedStyle(e).textTransform === 'uppercase'), 'the titles can go ALL CAPS');
  await p.click('#tabcfg .ib[data-casemode="word"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabw', e => getComputedStyle(e).textTransform === 'none'), 'and back to as-written');
  await p.click('#tabcfg .ib[data-iconmode="ghost"]'); await p.waitForTimeout(100);   // the side bar only means anything on a watermark
  { const pos = {}; for (const v of [0, 50, 100]) { await p.evaluate(x => { window.TABCFG.iconX = x; window.drawTabs(); }, v); await p.waitForTimeout(90);
      pos[v] = await p.$eval('#tabs .tab .tabi', e => Math.round(e.getBoundingClientRect().left - e.closest('.tab').getBoundingClientRect().left)); }
    ok(pos[0] < pos[50] && pos[50] < pos[100], 'the side bar slides the glyph continuously across the button', JSON.stringify(pos)); }
  await p.evaluate(() => { window.TABCFG.iconX = 73; window.drawTabs(); window.drawTabCfg(); }); await p.waitForTimeout(100);
  // FOCUS: the open part keeps its colour, every other button goes mono
  await p.click('#tabcfg .ib[data-palette="focus"]'); await p.waitForTimeout(120);
  { const cols = await p.$$eval('#tabs .tab', els => els.map(e => ({ on: e.classList.contains('on'), c: e.style.getPropertyValue('--tc') })));
    const on = cols.filter(c => c.on), off = cols.filter(c => !c.on);
    ok(on.length === 1 && !/var\(--muted\)/.test(on[0].c), 'in FOCUS the open part keeps its own colour', JSON.stringify(on));
    ok(off.every(c => /var\(--muted\)/.test(c.c)), 'and every other button goes mono', JSON.stringify(off.map(c => c.c))); }
  { await p.click('#tabs .tab[data-tab="tests"]'); await p.waitForTimeout(140);
    const cols = await p.$$eval('#tabs .tab', els => els.map(e => ({ k: e.dataset.tab, on: e.classList.contains('on'), c: e.style.getPropertyValue('--tc') })));
    const on = cols.find(c => c.on);
    ok(on && on.k === 'tests' && !/var\(--muted\)/.test(on.c), 'the colour FOLLOWS the part you open', JSON.stringify(on));
    await p.click('#tabs .tab[data-tab="data"]'); await p.waitForTimeout(120); }
  // back to the defaults so the rest of the probe sees a known row
  await p.evaluate(() => { Object.assign(window.TABCFG, { intensity: 'dim', palette: 'focus', pattern: 'valley',
    iconSize: 22, iconMode: 'ghost', iconX: 73, caseMode: 'caps', numSize: 12, numShape: 'pill', shape: 'rect', layout: 'fill', width: 'wide' });
    window.drawTabs(); window.drawTabCfg(); }); await p.waitForTimeout(120); }

// ══ THE FRAME (operator 2026-09-12): each row's height, its own outline, the divider under it and
//    the gap after it. Measured on the rendered box, never read back off the config. ══
{ // the FRAME block dissolved (operator 2026-09-17): every dial now sits in the REGION it sizes, and
  // each one is wrapped in .frdials[data-frame] so the sizing dials can still be read as one set.
  const where = await p.$$eval('.frdials', els => els.map(e => e.dataset.frame + '@' + (e.closest('.barblk') || {}).id));
  ok(where.join(' ') === 'bench@blk-bench head@blk-head tabs@blk-tabs portrait@blk-portrait command@blk-command',
     'every frame dial sits in the block of the region it sizes — no FRAME block left to guess at', where.join(' '));
  const subs = await p.$$eval('.frdials .cfsub', els => els.map(e => e.firstChild.textContent.trim()));
  ok(subs.join(',') === 'the bench,head bar,part buttons,the portrait panel,the command region',
     'the five things the frame sizes, each named inside its own region block', subs.join(','));
  const labels = await p.$$eval('.frdials .cfl', els => els.map(e => e.textContent));
  ok(labels.join(',') === 'outline,pattern,height,outline,pattern,divider,pattern,gap after,row,button,outline,pattern,divider,pattern,gap after,width,height,outline,pattern,gap,width,gap',
     'twenty-two dials: a box height per row, the button, the portrait panel, the command region, and every line', labels.join(','));
  ok(await p.$$eval('.frdials .sld', els => els.length === 16), 'every RANGE is a dragged bar, not a set of steps',
     String(await p.$$eval('.frdials .sld', els => els.length)));
  ok(await p.$$eval('.frdials .ibwrap .ib', els => els.length === 6 * 4), 'and every line pattern is a button drawing that pattern');
  ok(await p.$$eval('.frdials .ibwrap .ib svg path', els => els.length >= 5), 'the pattern buttons draw real lines, not words');
  const boot = await p.evaluate(() => window.COPYTXT.frame());
  // ROW HEIGHT — the box, both ways. Dragging it LEFT must genuinely shrink the row: the defect the
  // operator caught was a fixed padding that already exceeded the minimum the bar was setting.
  await p.evaluate(() => { window.FRAME.headH = 84; window.FRAME.tabsRow = 92; window.FRAME.tabsH = 72; window.applyFrame(); }); await p.waitForTimeout(140);
  const tall = await p.evaluate(() => ({ h: Math.round(document.getElementById('headstrip').getBoundingClientRect().height),
    r: Math.round(document.getElementById('tabs').getBoundingClientRect().height),
    b: Math.round(document.querySelector('#tabs .tab').getBoundingClientRect().height) }));
  ok(tall.h === 84, 'the head bar takes the height the bar sets', JSON.stringify(tall));
  ok(tall.r === 92 && tall.b === 72, 'the button ROW and the BUTTON are two heights, each its own', JSON.stringify(tall));
  await p.evaluate(() => { window.FRAME.headH = 28; window.FRAME.tabsRow = 46; window.FRAME.tabsH = 46; window.applyFrame(); }); await p.waitForTimeout(140);
  const short = await p.evaluate(() => ({ h: Math.round(document.getElementById('headstrip').getBoundingClientRect().height),
    r: Math.round(document.getElementById('tabs').getBoundingClientRect().height) }));
  ok(short.h < tall.h && short.r < tall.r, 'dragging a height LEFT genuinely shrinks the row — no padding floor under it',
     JSON.stringify({ tall, short }));
  // the INSET is what sits between a button and the row's edge — at row = button it is zero, and the
  // divider then sits directly on the buttons (the row box carries the line's 1px under border-box)
  { const inset = await p.evaluate(() => { const r = document.getElementById('tabs').getBoundingClientRect(),
        b = document.querySelector('#tabs .tab').getBoundingClientRect(); return Math.round(b.top - r.top); });
    ok(inset === 0, 'at row = button the inset is gone: no space left before the divider', String(inset)); }
  // the space BEFORE a divider is the row box, and nothing else: with the rows at their content height
  // and every line and gap off, the two rows meet with zero between them
  await p.evaluate(() => { Object.assign(window.FRAME, { headDivS: 'none', headGap: 0, headH: 28, tabsRow: 46 }); window.applyFrame(); }); await p.waitForTimeout(140);
  ok(await p.evaluate(() => Math.round(document.getElementById('tabs').getBoundingClientRect().top
      - document.getElementById('headstrip').getBoundingClientRect().bottom)) === 0,
     'with the divider hidden the rows touch — no distance survives it',
     String(await p.evaluate(() => Math.round(document.getElementById('tabs').getBoundingClientRect().top - document.getElementById('headstrip').getBoundingClientRect().bottom))));
  await p.evaluate(() => { Object.assign(window.FRAME, { headDivS: 'solid', headH: 84, tabsRow: 92, tabsH: 72 }); window.applyFrame(); }); await p.waitForTimeout(120);
  // THE DIVIDERS — pattern and absence
  await p.evaluate(() => { window.FRAME.headDivS = 'dashed'; window.applyFrame(); }); await p.waitForTimeout(90);
  ok(await p.$eval('#headstrip', e => getComputedStyle(e).borderBottomStyle === 'dashed'), 'the divider under the head bar takes its own pattern');
  await p.evaluate(() => { window.FRAME.headDivS = 'none'; window.applyFrame(); }); await p.waitForTimeout(90);
  { const d = await p.$eval('#headstrip', e => ({ s: getComputedStyle(e).borderBottomStyle, w: getComputedStyle(e).borderBottomWidth }));
    ok(d.s === 'none' && parseFloat(d.w) === 0, 'set to NONE it is genuinely absent — no line, no width', JSON.stringify(d)); }
  await p.evaluate(() => { window.FRAME.headDivS = 'solid'; window.FRAME.headDivW = 0; window.applyFrame(); }); await p.waitForTimeout(90);
  ok(await p.$eval('#headstrip', e => parseFloat(getComputedStyle(e).borderBottomWidth) === 0), 'and a thickness of zero removes it the other way');
  // A ROW'S OWN OUTLINE, distinct from the divider under it
  await p.evaluate(() => { window.FRAME.headDivW = 1; window.FRAME.headBw = 2; window.FRAME.headBs = 'dotted'; window.applyFrame(); }); await p.waitForTimeout(90);
  { const b = await p.$eval('#headstrip', e => { const c = getComputedStyle(e);
      return { t: c.borderTopWidth, ts: c.borderTopStyle, bb: c.borderBottomWidth, bs: c.borderBottomStyle }; });
    ok(parseFloat(b.t) === 2 && b.ts === 'dotted', 'a row can carry its own outline', JSON.stringify(b));
    ok(parseFloat(b.bb) === 1 && b.bs === 'solid', 'and the divider under it keeps its own pattern at the same time', JSON.stringify(b)); }
  // THE BENCH'S OUTER LINE — the one the operator wants transparent
  await p.evaluate(() => { window.FRAME.benchS = 'none'; window.applyFrame(); }); await p.waitForTimeout(90);
  ok(await p.$eval('#bench', e => getComputedStyle(e).borderTopStyle === 'none' && parseFloat(getComputedStyle(e).borderTopWidth) === 0),
     'the outer container line goes transparent on the same rule');
  await p.evaluate(() => { window.FRAME.benchS = 'solid'; window.applyFrame(); }); await p.waitForTimeout(90);
  // THE GAP between the rows
  await p.evaluate(() => { window.FRAME.headGap = 24; window.FRAME.tabsGap = 12; window.applyFrame(); }); await p.waitForTimeout(120);
  { const g = await p.evaluate(() => { const h = document.getElementById('headstrip').getBoundingClientRect(),
        t = document.getElementById('tabs').getBoundingClientRect(), pn = document.getElementById('panel').getBoundingClientRect();
      return { a: Math.round(t.top - h.bottom), b: Math.round(pn.top - t.bottom) }; });
    ok(g.a === 24, 'the space after the head bar is the space the bar sets', JSON.stringify(g));
    ok(g.b === 12, 'and the space after the buttons is its own', JSON.stringify(g)); }
  // the copy line says NONE where a line is off
  await p.evaluate(() => { window.FRAME.tabsDivS = 'none'; window.applyFrame(); }); await p.waitForTimeout(60);
  ok(/part buttons .*divider none/.test(await p.evaluate(() => window.COPYTXT.frame())), 'the copy line says NONE where a line was switched off',
     await p.evaluate(() => window.COPYTXT.frame()));
  // back to the boot frame, and prove the page opened there
  await p.evaluate(() => { Object.assign(window.FRAME, { benchW: 1, benchS: 'solid',
    headH: 45, headBw: 0, headBs: 'solid', headDivW: 1, headDivS: 'none', headGap: 0,
    tabsRow: 52, tabsH: 43, tabsBw: 0, tabsBs: 'solid', tabsDivW: 1, tabsDivS: 'none', tabsGap: 0 });
    window.applyFrame(); window.drawFrameCfg(); }); await p.waitForTimeout(120);
  ok(await p.evaluate(() => window.COPYTXT.frame()) === boot, 'the bench returns to exactly the frame it booted with', boot); }
// ══ THE THREE PILLS (operator 2026-09-13): centred on the cap height, a shape dial, the settled colour dials
//    folded away, and a card per pill on the head bar's hover law ══
{ await p.evaluate(() => { window.showTab('data'); window.showVariant('data', 'blocks'); }); await p.waitForTimeout(320);
  // THE RAIL IS A STACK OF FOLDS (operator 2026-09-13) — every group closed at boot except the one being tuned
  { const g = await p.$$eval('#datacfg > .cffold', els => els.map(e => ({ k: e.dataset.group, open: e.classList.contains('open'),
      body: getComputedStyle(e.querySelector('.cffoldbody')).display, sum: (e.querySelector('.cffoldhd .sum') || {}).textContent })));
    ok(g.map(x => x.k).join(',') === 'layout,stages,sections,channels,sort,counts,pills,block,edge,lines,marks,foot,grounds',
       'the data rail is thirteen named groups — STAGES right after layout, the new distribution\'s own four dials', g.map(x => x.k).join(','));
    ok(g.every(x => x.open === (x.k === 'foot') && x.body === (x.k === 'foot' ? 'grid' : 'none')),
       'every group boots folded except FOOTER ROW, the one being tuned', JSON.stringify(g.map(x => x.k + (x.open ? '+' : '-'))));
    ok(g.every(x => x.sum && x.sum.trim().length > 2), 'and every folded header names what its dials are set to', JSON.stringify(g.map(x => x.sum))); }
  ok(await p.$$eval('#datacfg > :not(.cffold):not(.cfread)', els => els.length === 0), 'no dial is left loose outside a group');
  ok(await p.$eval('#datacfg .cffold[data-group="pills"]', e => !e.classList.contains('open') && getComputedStyle(e.querySelector('.cffoldbody')).display === 'none'),
     'the settled pill-colour dials boot FOLDED away');
  await p.click('#datacfg .cffoldhd[data-fold="counts"]'); await p.waitForTimeout(160);
  ok(await p.$$eval('#datacfg .ib[data-pill-shape]', els => els.length === 4 && els.every(e => e.getClientRects().length > 0)),
     'opening COUNT PILLS brings the shape dial into view');
  ok(await p.$$eval('#datacfg .cffold .ib[data-pill-ink]', els => els.length === 5), 'the folded dials are all still in the page');
  // CENTRED: the number and its glyph on the pill's centre, measured on the cap-height box
  const centring = () => p.evaluate(() => [...document.querySelectorAll('#panel .sechd .dcp')].map(d => {
      const mid = r => r.top + r.height / 2, pr = d.getBoundingClientRect();
      const t = d.querySelector('.dcn > b, .dcn > .dct'), g = d.querySelector('.dcn > svg');
      return { pill: d.dataset.pill, text: t ? +(mid(t.getBoundingClientRect()) - mid(pr)).toFixed(2) : null,
               glyph: g ? +(mid(g.getBoundingClientRect()) - mid(pr)).toFixed(2) : null }; }));
  { const cz = await centring();
    ok(cz.length === 3 && cz.every(x => Math.abs(x.text) <= 0.6 && (x.glyph == null || Math.abs(x.glyph) <= 0.6)),
       'every number and glyph sits within 0.6px of its pill\'s centre (it sat 1.6px high)', JSON.stringify(cz));
    ok(await p.$eval('#panel .sechd .dcp .dcn > b', e => /cap/.test(getComputedStyle(e).textBoxEdge || '')),
       'the number is trimmed to its cap height, so the box being centred IS the ink',
       await p.$eval('#panel .sechd .dcp .dcn > b', e => String(getComputedStyle(e).textBoxEdge))); }
  await p.evaluate(() => { window.DATACFG.counts.tables = 'word'; window.showTab('data'); }); await p.waitForTimeout(260);
  { const cz = await centring(); const w = cz.find(x => x.pill === 'tables');
    ok(w && Math.abs(w.text) <= 0.6, 'a count in WORDS is centred the same way', JSON.stringify(w)); }
  await p.evaluate(() => { window.DATACFG.counts.tables = 'icon'; window.showTab('data'); }); await p.waitForTimeout(260);
  // SHAPE
  for (const [k, want] of [['square', '0px'], ['rect', '3px'], ['round', '7px'], ['pill', null]]) {
    await p.click(`#datacfg .ib[data-pill-shape="${k}"]`); await p.waitForTimeout(240);
    const r = await p.$eval('#panel .sechd .dcp', e => getComputedStyle(e).borderTopLeftRadius);
    ok(want ? r === want : parseFloat(r) >= 11, `the ${k} shape gives the pill ${want || 'fully rounded ends'}`, r); }
  // THE FOLD opens and closes without losing anything
  await p.click('#datacfg .cffoldhd[data-fold="pills"]'); await p.waitForTimeout(160);
  ok(await p.$eval('#datacfg .cffold[data-group="pills"]', e => e.classList.contains('open') && getComputedStyle(e.querySelector('.cffoldbody')).display === 'grid'),
     'one click opens the folded dials');
  // a dial click REBUILDS the rail — an opened group must stay open through it
  await p.click('#datacfg .ib[data-pill-shape="pill"]'); await p.waitForTimeout(240);
  ok(await p.$eval('#datacfg .cffold[data-group="pills"]', e => e.classList.contains('open')), 'and stays open when a dial rebuilds the rail');
  await p.click('#datacfg .cffoldhd[data-fold="pills"]'); await p.waitForTimeout(160);
  ok(await p.$eval('#datacfg .cffold[data-group="pills"]', e => !e.classList.contains('open')), 'and one click folds them again');
  // THE CARDS — each pill states its own facts on the head bar's law: title + value · factors · facts · the plain line LAST
  const cardOf = async sel => { await p.mouse.move(5, 1030); await p.waitForTimeout(140); await p.hover(sel); await p.waitForTimeout(240);
    return p.evaluate(() => { const h = document.getElementById('hover');
      return { hidden: h.hidden, title: (h.querySelector('.cphd b') || {}).textContent, value: (h.querySelector('.cphv') || {}).textContent,
        factors: [...h.querySelectorAll('.fct')].map(f => ({ state: f.className.replace(/\bfct\b/, '').trim(), name: f.querySelector('.fctn').textContent.trim(),
          value: (f.querySelector('.fctv') || {}).textContent })),
        last: h.lastElementChild ? h.lastElementChild.className : null, plain: (h.querySelector('.cpend .cpplain') || {}).textContent || '' }; }); };
  const TB0 = F.data.tables, cols0 = TB0.reduce((n, t) => n + t.cols.length, 0);
  { const c = await cardOf('#panel .sechd .dcp[data-pill="tables"]');
    ok(!c.hidden && c.title === 'tables' && c.value === TB0.length + ' of ' + TB0.length, 'the TABLES pill opens its own card', JSON.stringify({ t: c.title, v: c.value }));
    ok(c.factors.map(f => f.name).join(',') === 'written only,read only,both', 'its factors are the three channels', c.factors.map(f => f.name).join(','));
    ok(c.factors.every(f => (f.name === 'written only' ? TB0.filter(t => t.rw === 'w') : f.name === 'read only' ? TB0.filter(t => t.rw === 'r') : TB0.filter(t => t.rw === 'rw')).length + ' table' === f.value.replace(/s$/, '').replace(/s ·.*$/, '')),
       'each channel factor states its own measured count', JSON.stringify(c.factors));
    ok(c.factors.filter(f => /written only/.test(f.name)).every(f => f.state === 'quiet'), 'a measured-zero channel is a hollow dot, not a filled one');
    ok(/cpend/.test(c.last) && /tables this door reads or writes/.test(c.plain), 'and the plain line comes LAST, said once', c.last); }
  { const c = await cardOf('#panel .sechd .dcp[data-pill="fields"]');
    ok(c.title === 'fields' && c.value === String(cols0), 'the FIELDS pill opens its own card', JSON.stringify({ t: c.title, v: c.value }));
    ok(c.factors.length >= 4 && c.factors.every(f => /field/.test(f.value)), 'its factors are what the fields are made of — the kinds', JSON.stringify(c.factors.map(f => f.name)));
    ok(c.factors.reduce((n, f) => n + parseInt(f.value, 10), 0) === cols0, 'and the kinds add back up to the pill\'s number');
    ok(/cpend/.test(c.last) && /columns inside those tables/.test(c.plain), 'with the plain line last'); }
  { const c = await cardOf('#panel .sechd .dcp[data-pill="ops"]');
    const rd = TB0.filter(t => t.rw !== 'w').length, wr = TB0.filter(t => t.rw !== 'r').length;
    ok(c.title === 'ops' && c.value === String(rd + wr), 'the OPS pill opens its own card', JSON.stringify({ t: c.title, v: c.value }));
    ok(c.factors.map(f => f.name + '=' + f.value).join(',') === 'read ops=' + rd + ',write ops=' + wr, 'its factors are the reads and the writes that add up to it',
       c.factors.map(f => f.name + '=' + f.value).join(','));
    ok(/cpend/.test(c.last) && /one op is one table on one channel/.test(c.plain), 'with the plain line last'); }
  // the cards count what is SHOWN — switch a channel off and the card follows
  await p.click('#panel .chbar .chb[data-chan="rw"]'); await p.waitForTimeout(300);
  { const c = await cardOf('#panel .sechd .dcp[data-pill="tables"]');
    const keep = TB0.filter(t => t.rw !== 'rw').length;
    ok(c.value === keep + ' of ' + TB0.length && c.factors.some(f => f.name === 'both' && /switched off/.test(f.value)),
       'switching a channel off moves the card\'s number and marks that factor off', JSON.stringify({ v: c.value, f: c.factors })); }
  await p.click('#panel .chbar .chb[data-chan="rw"]'); await p.waitForTimeout(300);
  await p.mouse.move(5, 1030); }

// the tests below were written against the station chip's look — give them that baseline explicitly
// ══ THE SORT (operator 2026-09-13): a divider after the channels, four orders and a turn-around, and how the
//    buttons look — measured on the order the tables are actually drawn in ══
{ await p.evaluate(() => { Object.assign(window.DATACFG, { sortInk: 'muted', sortBg: 'chip', sortAlpha: 100 }); window.foldSet && 0;
    window.FOLDS.sort = 1; window.applyData(); window.showTab('data'); window.showVariant('data', 'blocks'); window.drawDataCfg(); }); await p.waitForTimeout(320);
  const row = await p.evaluate(() => { const sh = document.querySelector('#panel .sechd');
    const kids = [...sh.children].map(e => e.classList.contains('chbar') ? 'chbar' : e.classList.contains('chdiv') ? 'div' : e.classList.contains('sortbar') ? 'sort' : null).filter(Boolean);
    const d = sh.querySelector('.chdiv'), r = d && d.getBoundingClientRect();
    return { kids, div: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null }; });
  ok(row.kids.join(',') === 'chbar,div,sort', 'the title row runs channels · a divider · the sort', JSON.stringify(row));
  ok(row.div && row.div.w === 1 && row.div.h >= 12, 'and the divider is a real drawn line', JSON.stringify(row.div));
  ok(await p.$$eval('#panel .sechd .sortbar .srb[data-sort]', els => els.map(e => e.dataset.sort).join(',')) === 'channel,size,name,entity',
     'four orders to choose from');
  ok(await p.$eval('#panel .sechd .sortbar .srb.on', e => e.dataset.sort) === 'channel', 'by CHANNEL is the default — the order the blocks always had');
  const order = () => p.$$eval('#panel .blk', els => els.map(e => e.dataset.table));
  const cols = Object.fromEntries(F.data.tables.map(t => [t.table, t.cols.length]));
  const ent = Object.fromEntries(F.data.tables.map(t => [t.table, t.entity || '']));
  const rw = Object.fromEntries(F.data.tables.map(t => [t.table, t.rw]));
  { const o = await order();
    ok(o.every((t, i) => !i || ((rw[o[i - 1]] === 'r') - (rw[t] === 'r') <= 0)) && o.length === F.data.tables.length,
       'by channel: every written table comes before every read-only one', o.map(t => rw[t]).join(',')); }
  await p.click('#panel .sechd .sortbar .srb[data-sort="name"]'); await p.waitForTimeout(300);
  { const o = await order(); const want = await p.evaluate(x => [...x].sort((a, b) => a.localeCompare(b)), o);
    ok(o.join(',') === want.join(','), 'by NAME: the tables read A to Z', o.slice(0, 4).join(',')); }
  await p.click('#panel .sechd .sortbar .srb[data-sort="size"]'); await p.waitForTimeout(300);
  { const o = await order(); ok(o.every((t, i) => !i || cols[o[i - 1]] >= cols[t]), 'by SIZE: never a smaller table before a larger one', o.map(t => cols[t]).join(',')); }
  const bySize = await order();
  await p.click('#panel .sechd .sortbar .srb[data-sort-rev]'); await p.waitForTimeout(300);
  ok((await order()).join(',') === [...bySize].reverse().join(','), 'the turn-around gives exactly the same list backwards');
  await p.click('#panel .sechd .sortbar .srb[data-sort-rev]'); await p.waitForTimeout(300);
  await p.click('#panel .sechd .sortbar .srb[data-sort="entity"]'); await p.waitForTimeout(300);
  { const o = await order(); const ents = o.map(t => ent[t]);
    const sorted = await p.evaluate(x => x.every((e, i) => !i || x[i - 1].localeCompare(e) <= 0), ents);
    ok(sorted, 'by ENTITY: the tables group by the entity that claims them', ents.join(',')); }
  // FIELDS reads the same sort; GROUNDS keeps its own order and draws no sort bar
  await p.click('#panel .sechd .sortbar .srb[data-sort="name"]'); await p.waitForTimeout(300);
  await p.evaluate(() => window.showVariant('data', 'fields')); await p.waitForTimeout(300);
  { const o = await p.$$eval('#panel .fcard .fhd b', els => els.map(e => e.textContent)); const want = await p.evaluate(x => [...x].sort((a, b) => a.localeCompare(b)), o);
    ok(o.length === F.data.tables.length && o.join(',') === want.join(','), 'FIELDS follows the same sort', o.slice(0, 3).join(',')); }
  await p.evaluate(() => window.showVariant('data', 'grounds')); await p.waitForTimeout(300);
  ok(await p.$$eval('#panel .sechd .sortbar, #panel .sechd .chdiv', els => els.length === 0), 'GROUNDS keeps its own order and draws no sort bar');
  await p.evaluate(() => window.showVariant('data', 'blocks')); await p.waitForTimeout(300);
  // how the buttons LOOK: text · icon · both, their text colour and their ground
  const face = () => p.$eval('#panel .sechd .sortbar .srb[data-sort="size"]', e => ({ icon: getComputedStyle(e.querySelector('.sri')).display !== 'none',
    word: getComputedStyle(e.querySelector('.srw')).display !== 'none', fg: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor }));
  { const f = await face(); ok(f.icon && !f.word, 'the sort buttons open as ICONS — the word on the card', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-sort-show="text"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(!f.icon && f.word, 'TEXT shows the word alone', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-sort-show="both"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(f.icon && f.word, 'BOTH shows the glyph and the word', JSON.stringify(f)); }
  const f0 = await face();
  await p.click('#datacfg .ib[data-sort-ink="accent"]'); await p.waitForTimeout(260);
  const f1 = await face(); ok(f1.fg !== f0.fg && f1.bg === f0.bg, 'the SORT TEXT dial moves the text and leaves the ground', JSON.stringify({ f0, f1 }));
  await p.click('#datacfg .ib[data-sort-bg="accent"]'); await p.waitForTimeout(260);
  const f2 = await face(); ok(f2.bg !== f1.bg && f2.fg === f1.fg, 'the SORT GROUND dial moves the ground and leaves the text', JSON.stringify({ f1, f2 }));
  ok(await p.$eval('#panel .sechd .sortbar .srb.on', e => /inset/.test(getComputedStyle(e).boxShadow)), 'the active order keeps its ring whatever the colours');
  await p.focus('#datacfg .sldt[aria-label="sort ground opacity"]');
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(240);
  ok(await p.evaluate(() => { const c = window.CONTRAST.parse(getComputedStyle(document.querySelector('#panel .sechd .srb[data-sort="size"]')).backgroundColor); return c && Math.round(c.a * 100) === 50; }),
     'the opacity bar leaves the sort ground at half');
  // the copy line names the sort, and the rail's sort group summarises it
  ok(/sort name, both, accent on accent 50%/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line carries the sort and its look',
     await p.evaluate(() => window.COPYTXT.data()).then(t => t.slice(90, 190)));
  await p.evaluate(() => { Object.assign(window.DATACFG, { sort: 'channel', sortRev: 0, sortShow: 'icon', sortInk: 'accent', sortBg: 'panel', sortAlpha: 45 });
    window.applyData(); window.showTab('data'); window.drawDataCfg(); }); await p.waitForTimeout(300); }

// ══ THE BLOCK EDGE (operator 2026-09-13): the entity's colour on any side or none, its pattern, its thickness —
//    measured on the block's computed borders ══
{ await p.evaluate(() => { window.FOLDS.edge = 1; window.showTab('data'); window.showVariant('data', 'blocks'); window.drawDataCfg(); }); await p.waitForTimeout(300);
  const edge = () => p.$eval('#panel .blk', e => { const c = getComputedStyle(e);
    const side = k => ({ w: parseFloat(c['border' + k + 'Width']), st: c['border' + k + 'Style'], col: c['border' + k + 'Color'] });
    return { Left: side('Left'), Right: side('Right'), Top: side('Top'), Bottom: side('Bottom') }; });
  { const e = await edge(); const o = ['Right', 'Top', 'Bottom'];
    ok(e.Left.w === 2 && e.Left.st === 'solid' && o.every(k => e[k].w === 1 && e[k].col !== e.Left.col),
       'the entity colour boots down the LEFT edge, 2px solid, and nowhere else', JSON.stringify(e)); }
  for (const side of ['right', 'top', 'bottom']) {
    await p.click(`#datacfg .ib[data-rail-side="${side}"]`); await p.waitForTimeout(260);
    const e = await edge(), K = side[0].toUpperCase() + side.slice(1), rest = ['Left', 'Right', 'Top', 'Bottom'].filter(k => k !== K);
    ok(e[K].w === 2 && rest.every(k => e[k].w === 1 && e[k].col !== e[K].col), `it moves to the ${side.toUpperCase()}`, JSON.stringify(e)); }
  await p.click('#datacfg .ib[data-rail-side="none"]'); await p.waitForTimeout(260);
  { const e = await edge(); ok(Object.values(e).every(x => x.w === 1) && new Set(Object.values(e).map(x => x.col)).size === 1,
      'NONE takes the entity colour off every edge', JSON.stringify(e)); }
  await p.click('#datacfg .ib[data-rail-side="left"]'); await p.waitForTimeout(260);
  for (const st of ['dashed', 'dotted', 'double']) {
    await p.click(`#datacfg .ib[data-rail-style="${st}"]`); await p.waitForTimeout(240);
    ok((await edge()).Left.st === st, `the edge takes the ${st.toUpperCase()} pattern`, (await edge()).Left.st); }
  await p.focus('#datacfg .sldt[aria-label="block edge thickness"]');
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(240);
  ok((await edge()).Left.w === 5, 'three steps up the thickness bar take the edge from 2px to 5px', String((await edge()).Left.w));
  ok(/edge left double 5px/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names the edge');
  // the blocks still never overlap with a thick edge on top
  await p.click('#datacfg .ib[data-rail-side="top"]'); await p.waitForTimeout(280);
  { const hits = await p.evaluate(() => { const bs = [...document.querySelectorAll('#panel .blk')].map(e => e.getBoundingClientRect()); let n = 0;
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], c = bs[j];
        if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) n++; } return n; });
    ok(hits === 0, 'a thick edge on top never makes the blocks overlap', String(hits)); }
  await p.evaluate(() => { Object.assign(window.DATACFG.bk, { railSide: 'left', railStyle: 'solid', railW: 2 }); window.FOLDS.edge = 0; window.applyData(); window.showTab('data'); window.drawDataCfg(); });
  await p.waitForTimeout(300); }

// ══ THE TWO CHIPS (operator 2026-09-13): the field-count badge and the channel chip — container, see-through
//    fill, character size — measured on the drawn chips ══
{ await p.evaluate(() => { window.FOLDS.block = 1; window.showTab('data'); window.showVariant('data', 'blocks'); window.drawDataCfg(); }); await p.waitForTimeout(300);
  // EMBEDDED (operator 2026-09-13): each chip's dials sit inside BLOCK TITLE, directly under that chip's own show/hide row
  { const order = await p.$$eval('#datacfg .cffold[data-group="block"] .cffoldbody > .cfl', els => els.map(e => e.textContent));
    const at = k => order.indexOf(k);
    ok(at('channel') >= 0 && at('chip box') === at('channel') + 1 && at('chip fill') === at('channel') + 2 && at('chip size') === at('channel') + 3,
       'the channel chip\'s box, fill and size sit right under its own row', order.join(','));
    ok(at('count') >= 0 && at('count box') === at('count') + 1 && at('count fill') === at('count') + 2 && at('count size') === at('count') + 3,
       'and the count badge\'s under the count row', order.join(','));
    ok(await p.$$eval('#datacfg > .cffold[data-group="chips"]', els => els.length === 0), 'no separate chips group is left behind'); }
  // today's 12px sits a THIRD of the way along the size bar, not at its end
  { const k = await p.$$eval('#datacfg .sldt[aria-label="channel character size"], #datacfg .sldt[aria-label="count character size"]',
      els => els.map(e => ({ min: +e.getAttribute('aria-valuemin'), max: +e.getAttribute('aria-valuemax'), now: +e.getAttribute('aria-valuenow'),
        knob: parseFloat(e.querySelector('.sldk').style.left) })));
    ok(k.length === 2 && k.every(x => x.now === 11 && Math.abs(x.knob - 25) < 0.5 && x.min === 8 && x.max === 20),
       'both size bars open at the operator\'s 11px — a quarter of the way along 8 — 20px, never at an end', JSON.stringify(k)); }
  const chips = () => p.$eval('#panel .blk', b => { const n = b.querySelector('.bkn.badge'), r = b.querySelector('.bkrw .jdrw');
    const st = e => { const c = getComputedStyle(e), bg = window.CONTRAST.parse(c.backgroundColor);
      return { radius: c.borderTopLeftRadius, fs: parseFloat(c.fontSize), a: bg ? Math.round(bg.a * 100) : null,
               fg: c.color, border: c.borderTopColor, rwc: e.style.getPropertyValue('--rwc').trim(), pad: c.paddingLeft }; };
    return { count: st(n), chip: st(r) }; });
  { const c = await chips();
    ok(parseFloat(c.count.radius) >= 9 && c.count.a === 100 && c.count.fs === 11, 'the count badge boots as a solid 11px pill', JSON.stringify(c.count));
    ok(parseFloat(c.chip.radius) >= 9 && c.chip.a === 90 && c.chip.fs === 11, 'the channel chip boots as an 11px pill at 90%', JSON.stringify(c.chip)); }
  // CONTAINERS, both chips
  for (const [k, want] of [['square', '0px'], ['tag', '3px'], ['pill', null]]) {
    await p.click(`#datacfg .ib[data-rw-box="${k}"]`); await p.click(`#datacfg .ib[data-cnt-box="${k}"]`); await p.waitForTimeout(260);
    const c = await chips();
    ok(want ? (c.chip.radius === want && c.count.radius === want) : (parseFloat(c.chip.radius) >= 9 && parseFloat(c.count.radius) >= 9),
       `the ${k.toUpperCase()} container shapes both chips`, JSON.stringify({ chip: c.chip.radius, count: c.count.radius })); }
  await p.click('#datacfg .ib[data-rw-box="outline"]'); await p.waitForTimeout(240);
  { const c = await chips(); ok(c.chip.a === 0 && c.chip.border !== 'rgba(0, 0, 0, 0)', 'OUTLINE clears the fill and keeps an edge', JSON.stringify(c.chip)); }
  await p.click('#datacfg .ib[data-rw-box="bare"]'); await p.waitForTimeout(240);
  { const c = await chips(); ok(c.chip.a === 0 && c.chip.border === 'rgba(0, 0, 0, 0)' && c.chip.pad === '0px', 'BARE leaves the characters alone — no fill, no edge', JSON.stringify(c.chip)); }
  await p.click('#datacfg .ib[data-rw-box="tag"]'); await p.click('#datacfg .ib[data-cnt-box="pill"]'); await p.waitForTimeout(260);
  // SEE-THROUGH: a dragged bar, and the rail must not rebuild under the hand
  await p.evaluate(() => { const t = [...document.querySelectorAll('#datacfg .sldt')].find(x => x.getAttribute('aria-label') === 'channel chip fill'); t.__mark = 1; });
  await p.focus('#datacfg .sldt[aria-label="channel chip fill"]');
  for (let i = 0; i < 12; i++) await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(260);
  { const c = await chips();
    ok(c.chip.a === 30, 'twelve steps down take the channel chip from 90% to 30% opaque', JSON.stringify(c.chip));
    ok(await p.evaluate(() => !!([...document.querySelectorAll('#datacfg .sldt')].find(x => x.getAttribute('aria-label') === 'channel chip fill') || {}).__mark),
       'and the bar being dragged is the same element — no rebuild');
    const want = await p.evaluate(c => { const d = document.createElement('i'); d.style.color = c; document.body.append(d); const v = getComputedStyle(d).color; d.remove(); return v; }, c.chip.rwc);
    ok(c.chip.fg === want, 'below half, the letters take the chip\'s own colour so they stay readable on a see-through fill', JSON.stringify({ fg: c.chip.fg, want })); }
  for (let i = 0; i < 12; i++) await p.keyboard.press('ArrowRight');
  await p.focus('#datacfg .sldt[aria-label="count badge fill"]');
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(240);
  ok((await chips()).count.a === 50, 'the count badge has its own fill bar', JSON.stringify((await chips()).count));
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
  // CHARACTER SIZE, with the 12px floor held
  await p.focus('#datacfg .sldt[aria-label="channel character size"]');
  for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight');
  await p.focus('#datacfg .sldt[aria-label="count character size"]');
  for (let i = 0; i < 6; i++) await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(260);
  { const c = await chips(); ok(c.chip.fs === 15 && c.count.fs === 17, 'each chip has its own character size', JSON.stringify({ chip: c.chip.fs, count: c.count.fs })); }
  for (let i = 0; i < 20; i++) await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(240);
  ok((await chips()).count.fs === 8, 'the size bar now reaches below the old floor — down to 8px', String((await chips()).count.fs));
  ok(/<12/.test(await p.$eval('#datacfg .sldt[aria-label="count character size"]', e => e.parentElement.querySelector('.sldv').textContent)),
     'and says so on the bar the moment it drops under the 12px reading floor');
  ok(await p.evaluate(() => window.DATACFG.bk.size.count === 8 && window.DATACFG.bk.size.rw === 15), 'the size is the same value TITLE LINES drives — one number, two places to set it');
  await p.evaluate(() => { Object.assign(window.DATACFG.bk, { cntBox: 'pill', cntA: 100, rwBox: 'pill', rwA: 90 }); window.DATACFG.bk.size.rw = 11; window.DATACFG.bk.size.count = 11;
    window.applyData(); window.showTab('data'); window.drawDataCfg(); }); await p.waitForTimeout(280);
  ok(/chips count pill 100%, channel pill 90%/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names both chips'); }

// ══ THE BLOCK CARD (operator 2026-09-13): the hover mirrors the block — the table in ink behind its glyph, then the
//    entity, the class and the file in that order, the channel as the block's own chip, the fields pill with what the
//    fields are made of in the chosen marks, and a quiet footer ══
{ await p.evaluate(() => { window.showTab('data'); window.showVariant('data', 'blocks'); }); await p.waitForTimeout(300);
  await p.mouse.move(5, 1030); await p.waitForTimeout(150);
  const first = await p.$eval('#panel .blk', e => e.dataset.table), T = F.data.tables.find(x => x.table === first);
  await p.hover('#panel .blk .bkhd'); await p.waitForTimeout(280);
  const c = await p.evaluate(() => { const h = document.getElementById('hover'), blk = document.querySelector('#panel .blk'), q = sel => h.querySelector(sel);
    const col = v => { const d = document.createElement('i'); d.style.color = v; document.body.append(d); const r = getComputedStyle(d).color; d.remove(); return r; };
    const chip = q('.bcchip'), bg = chip ? window.CONTRAST.parse(getComputedStyle(chip).backgroundColor) : null;
    return { hidden: h.hidden, name: q('.bchd b') && q('.bchd b').textContent, nameCol: q('.bchd b') && getComputedStyle(q('.bchd b')).color, ink: col('var(--ink)'),
      glyph: q('.bchd svg') && q('.bchd svg').getAttribute('stroke'), blockGlyph: blk.querySelector('.bki svg').getAttribute('stroke'),
      lines: [...h.querySelectorAll('.bcln')].map(e => e.dataset.ln),
      entSvg: !!q('[data-ln="entity"] svg'), entCol: q('.bcent') && getComputedStyle(q('.bcent')).color, blockEntCol: getComputedStyle(blk.querySelector('.bke')).color,
      modelSvg: !!q('[data-ln="model"] svg'), model: (q('[data-ln="model"]') || {}).textContent, fileSvg: !!q('[data-ln="file"] svg'), file: (q('[data-ln="file"]') || {}).textContent,
      text: h.innerText, opsSvg: !!q('[data-row="channel"] .bci svg'),
      chip: chip && { t: chip.textContent, r: getComputedStyle(chip).borderTopLeftRadius, a: bg ? Math.round(bg.a * 100) : null },
      fieldsSvg: !!q('[data-row="fields"] .bci svg'), fp: (q('.bcfp') || {}).textContent,
      mix: [...h.querySelectorAll('.bcmix .mx')].map(e => ({ k: e.dataset.kind, n: +e.querySelector('b').textContent, sym: !!e.querySelector('.sq.e-symbol svg') })),
      foot: q('.bcfoot') && { svg: !!q('.bcfoot svg'), t: q('.bcfoot').textContent, col: getComputedStyle(q('.bcfoot')).color } }; });
  ok(!c.hidden && c.name === first, 'hovering a block opens ITS card, named for the table', JSON.stringify({ n: c.name }));
  ok(c.nameCol === c.ink, 'the table name is drawn in ink, as in the cards', JSON.stringify({ name: c.nameCol, ink: c.ink }));
  ok(c.glyph && c.glyph === c.blockGlyph, 'its glyph wears the colour it has in the block title', JSON.stringify({ card: c.glyph, block: c.blockGlyph }));
  ok(c.lines.join(',') === 'entity,model,file', 'then the entity, the class and the file — in that order, one line each', c.lines.join(','));
  ok(c.entSvg && c.entCol === c.blockEntCol, 'the entity carries its glyph and its own colour, as in the block', JSON.stringify({ card: c.entCol, block: c.blockEntCol }));
  ok(c.modelSvg && c.model.indexOf(T.model) >= 0 && c.fileSvg && c.file.indexOf(T.file) >= 0, 'the class and the file each lead with their glyph');
  ok(!/what is inside|python class|in the station/i.test(c.text), 'the rows that said it twice are gone — no "what is inside", no class explanation, no station id');
  const words = T.rw === 'rw' ? 'reads + writes' : T.rw === 'w' ? 'writes' : 'reads';
  ok(c.opsSvg && c.chip && c.chip.t === words && parseFloat(c.chip.r) >= 9 && c.chip.a === 90,
     'the channel is the block\'s own chip — pill at 90%, with the words inside, led by the ops glyph', JSON.stringify(c.chip));
  ok(c.fieldsSvg && c.fp === String(T.cols.length), 'the field count sits in the fields pill, led by the fields glyph', JSON.stringify({ fp: c.fp }));
  ok(c.mix.length > 0 && c.mix.reduce((n, x) => n + x.n, 0) === T.cols.length && c.mix.every(x => x.sym),
     'then what the fields are made of, in the chosen marks alone — and they add back up', JSON.stringify(c.mix));
  ok(c.foot && c.foot.svg && /click to/.test(c.foot.t) && c.foot.col !== c.ink, 'the footer leads with an info glyph, in a quieter grey', JSON.stringify(c.foot));
  await p.mouse.move(5, 1030); }

// ══ ONE HOVER, ONE CLICK FOR THE WHOLE BLOCK, and FOREIGN KEYS ON EVERY FIELD LIST (operator 2026-09-13) ══
{ await p.evaluate(() => { window.showTab('data'); window.showVariant('data', 'blocks'); window.selectIn('data', null); }); await p.waitForTimeout(300);
  const at = async (sel, fx, fy) => { await p.mouse.move(5, 1030); await p.waitForTimeout(130);
    const r = await p.$eval(sel, e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    await p.mouse.move(r.x + r.w * fx, r.y + r.h * fy); await p.waitForTimeout(250);
    return p.evaluate(() => { const h = document.getElementById('hover');
      return h.hidden ? null : (h.querySelector('.bchd b') ? h.querySelector('.bchd b').textContent : 'OTHER: ' + h.innerText.slice(0, 40)); }); };
  const name = await p.$eval('#panel .blk', e => e.dataset.table);
  const seen = [];
  for (const [sel, fx, fy] of [['#panel .blk', 0.02, 0.5], ['#panel .blk', 0.97, 0.94], ['#panel .blk .bkhd .sqs .sq', 0.5, 0.5],
                               ['#panel .blk .bkm', 0.5, 0.5], ['#panel .blk .bkn', 0.5, 0.5]]) seen.push(await at(sel, fx, fy));
  ok(seen.every(x => x === name), 'hovering ANYWHERE in a block — its edge, a far corner, a field mark, the class, the count — opens that table\'s card', JSON.stringify(seen));
  ok(await p.$$eval('#panel .blk .sq', els => els.length > 0), 'the field marks are still drawn, only without cards of their own');
  { const r = await p.$eval('#panel .blk:nth-child(2) .sqs', e => { const b = e.getBoundingClientRect(); return { x: b.left + 4, y: b.top + b.height / 2 }; });
    const second = await p.$eval('#panel .blk:nth-child(2)', e => e.dataset.table);
    await p.mouse.click(r.x, r.y); await p.waitForTimeout(280);
    ok(await p.evaluate(() => (window.SEL || {}).data) === second, 'a click on a field mark selects its table, like a click on its title', second); }
  // FOREIGN KEYS, both ways — expected numbers computed here from the feed, not from the page
  const TB = F.data.tables, inIdx = {};
  TB.forEach(o => (o.fks || []).forEach(f => { if (Array.isArray(f) && f[1]) (inIdx[f[1]] = inIdx[f[1]] || []).push(o.table + '.' + f[0]); }));
  const outN = TB.reduce((n, t) => n + (t.fks || []).length, 0), inCols = TB.reduce((n, t) => n + t.cols.filter(c => inIdx[t.table + '.' + c[0]]).length, 0);
  await p.evaluate(() => window.showVariant('data', 'fields')); await p.waitForTimeout(300);
  { const m = await p.evaluate(() => ({ out: document.querySelectorAll('#panel .fcard .fkx.out').length, inn: document.querySelectorAll('#panel .fcard .fkx.in').length,
      sample: [...document.querySelectorAll('#panel .fcard .fld')].filter(r => r.querySelector('.fkx')).slice(0, 3).map(r => r.innerText.replace(/\s+/g, ' ')) }));
    ok(m.out === outN, 'the FIELDS list marks every foreign key with what it points at', JSON.stringify(m));
    ok(inCols > 0 && m.inn === inCols, 'and every column another table points at, with how many do', JSON.stringify({ inn: m.inn, want: inCols }));
    // in a narrow card the TARGET gives way first — the field's own name is never cut to make room for it
    // measured against the name's NATURAL width, with no tolerance — a 1px slack hid an 86.3px name in an 86px box
    const cut = await p.$$eval('#panel .fcard .fld', rows => rows.filter(r => r.querySelector('.fkx.out')).map(r => { const n = r.querySelector('.fn');
      const m = document.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      m.style.font = getComputedStyle(n).font; m.style.letterSpacing = getComputedStyle(n).letterSpacing; m.textContent = n.textContent;
      document.body.append(m); const natural = m.getBoundingClientRect().width; m.remove();
      return { name: n.textContent, natural: +natural.toFixed(2), box: +n.getBoundingClientRect().width.toFixed(2), cut: natural > n.getBoundingClientRect().width + 0.05 }; }));
    ok(cut.length > 0 && cut.every(x => !x.cut), 'a foreign-key row keeps its field name whole — the target is what shortens', JSON.stringify(cut.filter(x => x.cut).slice(0, 3)));
    // the check can FAIL: force the old shrink back and it must see the cut
    await p.addStyleTag({ content: '.fld:has(.fkx) .fn{ flex:0 1 auto !important; max-width:none !important; } .fld .fkx.out{ flex:0 0 auto !important; }' });
    await p.waitForTimeout(150);
    const cut2 = await p.$$eval('#panel .fcard .fld', rows => rows.filter(r => r.querySelector('.fkx.out')).map(r => { const n = r.querySelector('.fn');
      const m = document.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      m.style.font = getComputedStyle(n).font; m.textContent = n.textContent; document.body.append(m); const natural = m.getBoundingClientRect().width; m.remove();
      return natural > n.getBoundingClientRect().width + 0.05; }));
    ok(cut2.some(Boolean), 'and the same measure DOES catch a cut name when the old shrink is forced back — it is not vacuous', JSON.stringify(cut2));
    await p.evaluate(() => { const t = [...document.querySelectorAll('style')].pop(); if (t && /!important/.test(t.textContent)) t.remove(); }); await p.waitForTimeout(150); }
  await p.evaluate(() => { window.showVariant('data', 'blocks'); window.selectIn('data', 'households'); }); await p.waitForTimeout(320);
  { const id = await p.evaluate(() => { const r = [...document.querySelectorAll('#portbody .flds .fld')].find(x => x.querySelector('.fn').textContent === 'id');
      return r ? (r.querySelector('.fkx.in span') || {}).textContent || null : null; });
    ok(id !== null && +id === (inIdx['households.id'] || []).length, 'the portrait record says how many tables point at households.id', JSON.stringify({ id, want: (inIdx['households.id'] || []).length })); }
  { const c = await p.evaluate(() => { const r = [...document.querySelectorAll('#portbody .flds .fld')].find(x => x.querySelector('.fn').textContent === 'id');
      const b = r.getBoundingClientRect(); return { x: b.left + b.width / 3, y: b.top + b.height / 2 }; });
    await p.mouse.move(5, 1030); await p.waitForTimeout(120); await p.mouse.move(c.x, c.y); await p.waitForTimeout(260);
    const txt = await p.evaluate(() => document.getElementById('hover').innerText);
    ok(/pointed at by/i.test(txt) && /locations\.household_id/.test(txt), 'and that field\'s own card names who points at it', txt.slice(0, 120)); }
  await p.evaluate(() => window.selectIn('data', 'locations')); await p.waitForTimeout(300);
  { const out = await p.evaluate(() => { const r = [...document.querySelectorAll('#portbody .flds .fld')].find(x => x.querySelector('.fn').textContent === 'household_id');
      return r ? (r.querySelector('.fkx.out') || {}).textContent || null : null; });
    ok(out && /households\.id/.test(out), 'and locations.household_id says it points at households.id', String(out)); }
  await p.evaluate(() => window.selectIn('data', 'households')); await p.waitForTimeout(280);
  await p.click('#portvars .ptv[data-pvar="shape"]'); await p.waitForTimeout(260);
  ok(await p.$$eval('#portbody .shcell .fkx.in', els => els.length) === 1, 'the SHAPE representation marks the referenced column too');
  await p.click('#portvars .ptv[data-pvar="record"]'); await p.waitForTimeout(200);
  await p.evaluate(() => window.selectIn('data', null)); await p.mouse.move(5, 1030); await p.waitForTimeout(220); }

// ══ THE RECORD (operator 2026-09-13): the portrait's record mirrors the block card — the table glyph and its name, then
//    icon · label · value rows (the class explains itself on an info icon), then the fields as a table with named
//    columns — fields · foreign keys · data type — drawn in the blocks' own field marks ══
{ await p.evaluate(() => { window.showTab('data'); window.showVariant('data', 'blocks'); }); await p.waitForTimeout(260);
  const TBL = F.data.tables, pk = TBL.find(t => (t.uqs || []).length && (t.fks || []).length) || TBL[0];
  await p.evaluate(n => window.selectIn('data', n), pk.table); await p.waitForTimeout(320);
  await p.click('#portvars .ptv[data-pvar="record"]'); await p.waitForTimeout(240);
  const rec = await p.evaluate(name => { const b = document.querySelector('#portbody .ptrec'); if (!b) return null;
    const tmp = document.createElement('div'); tmp.innerHTML = window.BLOCKCARD(window.LABEP.data.tables.find(t => t.table === name), window.STATION);
    const g = b.querySelector('.rchd svg'), cg = tmp.querySelector('.bchd svg');
    return { name: (b.querySelector('.rchd b') || {}).textContent, glyph: g ? g.getAttribute('stroke') : null, cardGlyph: cg ? cg.getAttribute('stroke') : null, text: b.innerText,
      rows: [...b.querySelectorAll('.rcrow')].map(r => ({ k: r.dataset.row, label: (r.querySelector('.k') || {}).textContent, icon: !!r.querySelector('.rci svg'), v: (r.querySelector('.v') || {}).textContent, info: !!r.querySelector('.rcinfo svg') })),
      heads: [...b.querySelectorAll('.rctab .rcth > span')].map(s => s.firstChild ? s.firstChild.textContent.trim() : ''), fp: (b.querySelector('.rctab .rcth .rcfp') || {}).textContent }; }, pk.table);
  ok(rec && rec.name === pk.table && rec.glyph && rec.glyph === rec.cardGlyph, 'the record opens like the block card — the table glyph in the same colour, then its name', JSON.stringify(rec && { n: rec.name, g: rec.glyph, c: rec.cardGlyph }));
  ok(rec && rec.rows.map(r => r.k).join(',') === 'entity,model,file,channel,found by' && rec.rows.every(r => r.icon && r.label === r.k), 'then one row per fact, each led by its icon and its label — entity · model · file · channel · found by (leftovers piece 4 added the fifth fact, on the record\'s own law)', JSON.stringify(rec && rec.rows));
  { const m = rec && rec.rows.find(r => r.k === 'model');
    ok(m && m.v === pk.model && m.info && !/python class/i.test(rec.text), 'the model row is just the class — the explanation waits on an info icon at its end', JSON.stringify(m)); }
  ok(rec && !/\binside\b/i.test(rec.text) && !/foreign keys\s*\n?\s*\w+\s*→/i.test(rec.text.split('FIELDS')[0] || ''), 'no INSIDE row and no FOREIGN KEYS row above the fields — the table carries both', JSON.stringify(rec && rec.rows.map(r => r.k)));
  await p.mouse.move(5, 1030); await p.waitForTimeout(120); await p.hover('#portbody .rcrow[data-row="model"] .rcinfo'); await p.waitForTimeout(260);
  ok(/python class/i.test(await p.evaluate(() => document.getElementById('hover').innerText)), 'hovering that info icon says what the class is');
  await p.mouse.move(5, 1030); await p.waitForTimeout(120);
  ok(rec && rec.heads.join(',') === 'fields,foreign keys,data type' && +rec.fp === pk.cols.length, 'the fields sit in a table with named columns — fields (with the count) · foreign keys · data type', JSON.stringify(rec && { h: rec.heads, fp: rec.fp }));
  { const al = await p.evaluate(() => { const hd = document.querySelector('#portbody .rctab .rcth'), hk = hd.querySelector('.c-k').getBoundingClientRect().left, ht = hd.querySelector('.c-t').getBoundingClientRect().right;
      return [...document.querySelectorAll('#portbody .rctab .fld')].map(r => ({ k: Math.round(r.querySelector('.c-k').getBoundingClientRect().left - hk), t: Math.round(r.querySelector('.c-t').getBoundingClientRect().right - ht), key: !!r.querySelector('.c-k .fkx'), stray: !!r.querySelector('.c-f .fkx') })); });
    ok(al.length === pk.cols.length && al.every(x => Math.abs(x.k) <= 1 && Math.abs(x.t) <= 1), 'every row keeps to those columns — keys under their head, data types under theirs', JSON.stringify(al.slice(0, 4)));
    ok(al.some(x => x.key) && al.every(x => !x.stray), 'and a key sits in the FOREIGN KEYS column, never beside the name', JSON.stringify(al.filter(x => x.key).length)); }
  // the marks: the blocks' size, the optional stop, the unique corners — and they follow the dials
  const marks = () => p.evaluate(() => { const a = [...document.querySelectorAll('#portbody .rctab .sq')], op = e => +(+getComputedStyle(e).opacity).toFixed(2);
    return { size: [...new Set(a.map(e => Math.round(e.getBoundingClientRect().height)))], std: [...new Set(a.filter(e => !e.classList.contains('opt')).map(op))],
      opt: [...new Set(a.filter(e => e.classList.contains('opt')).map(op))], uq: a.filter(e => e.classList.contains('uq')).map(e => [getComputedStyle(e, '::before').content, getComputedStyle(e, '::after').content]) }; });
  { const m = await marks(), sz = await p.evaluate(() => window.DATACFG.sqSize);
    ok(m.size.length === 1 && m.size[0] === sz, 'the field marks are drawn at the blocks\' size', JSON.stringify({ size: m.size, sz }));
    ok(m.std.join() === '1' && m.uq.length > 0 && m.uq.every(c => c[0] === '""' && c[1] === '""'), 'standard marks solid, and every unique field wears the corners', JSON.stringify(m)); }
  const optT = await p.evaluate(() => { for (const t of window.LABEP.data.tables) { window.selectIn('data', t.table); if (document.querySelector('#portbody .rctab .sq.opt')) return t.table; } return null; });
  { const m = await marks(); ok(optT && m.opt.join() === '0.5', 'an optional field sits at the optional stop — 50%', JSON.stringify({ optT, opt: m.opt })); }
  await p.evaluate(() => { Object.assign(window.DATACFG, { sqOptA: 30, sqSize: 18 }); window.applyData(); }); await p.waitForTimeout(200);
  { const m = await marks(); ok(m.opt.join() === '0.3' && m.size.join() === '18', 'and the record follows the dials live — optional to 30%, size to 18px', JSON.stringify(m)); }
  await p.evaluate(n => { window.selectIn('data', n); Object.assign(window.DATACFG, { sqUqMark: 'none' }); window.applyData(); }, pk.table); await p.waitForTimeout(220);
  { const m = await marks(); ok(m.uq.length > 0 && m.uq.every(c => c[0] === 'none' && c[1] === 'none'), 'UNIQUE MARK none clears the corners here too', JSON.stringify(m.uq)); }
  await p.evaluate(() => { Object.assign(window.DATACFG, { sqOptA: 50, sqSize: 14, sqUqMark: 'corners' }); window.applyData(); }); await p.waitForTimeout(200);
  // nothing cut, nothing past the edge — on every table
  const cuts = await p.evaluate(() => { const out = [];
    for (const t of window.LABEP.data.tables) { window.selectIn('data', t.table); const b = document.querySelector('#portbody .ptrec');
      if (!b) { out.push(t.table + ' no record'); continue; }
      if (b.scrollWidth > b.clientWidth + 1) out.push(t.table + ' overflows ' + b.scrollWidth + '>' + b.clientWidth);
      b.querySelectorAll('.rctab .rcth > span').forEach(s => { const r = document.createRange(); r.selectNodeContents(s.firstChild || s);
        const tops = new Set([...r.getClientRects()].map(x => Math.round(x.top))); if (tops.size > 1) out.push(t.table + ' head "' + s.firstChild.textContent.trim() + '" wraps'); });
      b.querySelectorAll('.rctab .fld .fn, .rctab .fld .ft').forEach(n => { const m = document.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
        m.style.font = getComputedStyle(n).font; m.textContent = n.textContent; document.body.append(m); const w = m.getBoundingClientRect().width; m.remove();
        if (w > n.getBoundingClientRect().width + 0.05) out.push(t.table + '.' + n.textContent); }); }
    return out; });
  ok(cuts.length === 0, 'across every table, no field name or type is cut, no column head wraps, and nothing runs past the portrait', JSON.stringify(cuts.slice(0, 6)));
  await p.evaluate(() => window.selectIn('data', null)); await p.mouse.move(5, 1030); await p.waitForTimeout(220); }

// ══ THE FOOTER ROW (operator 2026-09-13): ordered like the title lines — one row, a left and a right column — each part
//    shown as icon · text · both, and each kind's card leading with the mark ACTUALLY drawn, in its colour ══
{ await p.evaluate(() => { window.FOLDS.foot = 1; window.showTab('data'); window.showVariant('data', 'blocks'); window.drawDataCfg(); }); await p.waitForTimeout(320);
  const TB = F.data.tables, kindsPresent = ['id', 'text', 'num', 'flag', 'time', 'list', 'other'];
  const order = () => p.evaluate(() => ({ l: [...document.querySelectorAll('#panel .bkfoot .ftcol.l .ftp')].map(e => e.dataset.part),
                                          r: [...document.querySelectorAll('#panel .bkfoot .ftcol.r .ftp')].map(e => e.dataset.part) }));
  { const o = await order();
    ok(o.l.join(',') === 'hint' && o.r[o.r.length - 1] === 'opt' && o.r.slice(0, -1).every((k, i, a) => !i || kindsPresent.indexOf(a[i - 1]) < kindsPresent.indexOf(k)),
       'the footer boots as the hint on the left and the kinds then optional on the right', JSON.stringify(o)); }
  ok(await p.$$eval('#datacfg .cffold[data-group="foot"] .dzone', els => els.map(e => e.dataset.fside).join(',')) === 'l,r', 'one row in the rail, with a left and a right column');
  ok(await p.$$eval('#datacfg .cffold[data-group="foot"] .dzone .ib[data-fpart]', els => els.length === 9 && els.every(e => e.getAttribute('draggable') === 'true' && !!e.querySelector('svg'))),
     'every footer part is a draggable icon');
  // ORDER — move parts across and along the columns
  await p.evaluate(() => { window.moveFootPart('opt', 'l', 0); window.moveFootPart('id', 'r', 99); }); await p.waitForTimeout(300);
  { const o = await order();
    ok(o.l.join(',') === 'opt,hint' && o.r[o.r.length - 1] === 'id', 'a part moves across columns and along one — optional to the far left, id to the far right', JSON.stringify(o)); }
  ok(await p.$$eval('#datacfg .cffold[data-group="foot"] .dzone[data-fside="l"] .ib', els => els.map(e => e.dataset.fpart).join(',')) === 'opt,hint', 'the rail shows the new order too');
  await p.evaluate(() => { window.DATACFG.foot = { l: ['hint'], r: ['id', 'text', 'num', 'flag', 'time', 'list', 'other', 'opt'] }; window.showTab('data'); window.drawDataCfg(); }); await p.waitForTimeout(300);
  // THE HINT (operator 2026-09-13): the info glyph, and ONE grey phrase — no bold lead-in, no white half
  { const h = await p.$eval('#panel .bkfoot .ftp[data-part="hint"]', e => { const t = document.createElement('div'); t.innerHTML = window.STATION.icon('info');
      const svg = x => x ? x.innerHTML.replace(/\s+/g, '') : '', w = e.querySelector('.ftw');
      return { glyph: svg(e.querySelector('.fti svg')) === svg(t.querySelector('svg')), words: w.textContent, kids: w.children.length,
        cols: [...new Set([w, ...w.querySelectorAll('*')].map(n => getComputedStyle(n).color))], muted: getComputedStyle(e).color,
        ink: getComputedStyle(document.getElementById('panel')).color, h: Math.round(w.getBoundingClientRect().height) }; });
    ok(h.glyph, 'the hint leads with the INFO glyph, not the stack', JSON.stringify(h));
    ok(h.kids === 0 && h.cols.length === 1 && h.cols[0] === h.muted && h.muted !== h.ink, 'its words are ONE grey phrase — no bold lead-in, no white half', JSON.stringify(h));
    ok(/^click a table/.test(h.words) && h.words.length <= 60 && h.h <= 20, 'short enough for one line', JSON.stringify({ w: h.words, h: h.h })); }
  // SHOWN AS — three switches that COMBINE: icon · label · count, and the last one on stays on
  const ids = TB.reduce((n, t) => n + t.cols.filter(col => /^uuid|UUID/.test(String(col[1]).replace(/\s*\|\s*None\s*$/, ''))).length, 0);
  const face = () => p.$eval('#panel .bkfoot .ftp[data-part="id"]', e => { const v = s => { const n = e.querySelector(s); return !!n && getComputedStyle(n).display !== 'none'; };
    return { icon: v('.fti'), word: v('.ftw'), count: v('.ftn'), w: (e.querySelector('.ftw') || {}).textContent, n: (e.querySelector('.ftn') || {}).textContent }; });
  const showCfg = () => p.evaluate(() => window.DATACFG.footShow.join(','));
  { const f = await face(); ok(f.icon && !f.word && f.count, 'the parts boot as icon + count — the operator\'s default', JSON.stringify(f));
    ok(f.w === 'id' && +f.n === ids, 'the label and the count are separate pieces — "id" and how many ids', JSON.stringify({ f, ids })); }
  ok(await p.$$eval('#datacfg .ib[data-foot-show]', els => els.map(e => e.dataset.footShow + (e.classList.contains('on') ? '+' : '-')).join(',') === 'icon+,text-,count+' && els.every(e => !!e.querySelector('svg'))),
     'the rail offers three icon switches — icon · label · count — with icon and count on');
  await p.click('#datacfg .ib[data-foot-show="text"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(f.icon && f.word && f.count, 'LABEL on brings the words back between icon and count', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-foot-show="text"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(f.icon && !f.word && f.count, 'LABEL off leaves each icon with its count', JSON.stringify(f)); }
  { const o = await p.$eval('#panel .bkfoot .ftp[data-part="opt"]', e => ({ n: (e.querySelector('.ftn') || {}).textContent, shown: !!e.querySelector('.ftn') && getComputedStyle(e.querySelector('.ftn')).display !== 'none' }));
    await p.hover('#panel .bkfoot .ftp[data-part="opt"]'); await p.waitForTimeout(240);
    const v = await p.$eval('#hover .cphv', e => e.textContent); await p.mouse.move(5, 1030); await p.waitForTimeout(120);
    ok(o.shown && +o.n > 0 && v.startsWith(o.n + ' of '), 'optional carries its count too — the same number its card states', JSON.stringify({ o, v })); }
  await p.click('#datacfg .ib[data-foot-show="count"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(f.icon && !f.word && !f.count, 'COUNT off leaves the icon alone', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-foot-show="icon"]'); await p.waitForTimeout(260);
  { const f = await face(), c = await showCfg(); ok(f.icon && c === 'icon', 'the last switch on cannot go off — the row never draws blank parts', JSON.stringify({ f, c })); }
  await p.click('#datacfg .ib[data-foot-show="count"]'); await p.click('#datacfg .ib[data-foot-show="text"]'); await p.waitForTimeout(260);
  { const f = await face(), c = await showCfg(); ok(f.icon && f.word && f.count && c === 'icon,text,count', 'switched back on in any order, the pieces keep their places — icon · label · count', JSON.stringify({ f, c })); }
  await p.click('#datacfg .ib[data-foot-show="icon"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(!f.icon && f.word && f.count, 'and the icon can go too — label and count alone', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-foot-show="icon"]'); await p.waitForTimeout(260);
  await p.click('#datacfg .ib[data-foot-show="text"]'); await p.waitForTimeout(260);   // back to the default: icon + count
  // THE CARD shows the mark actually drawn, in its kind's colour
  const cardFor = async kind => { await p.mouse.move(5, 1030); await p.waitForTimeout(130); await p.hover(`#panel .bkfoot .ftp[data-part="${kind}"]`); await p.waitForTimeout(260);
    return p.evaluate(k => { const h = document.getElementById('hover'), mk = h.querySelector('.cphd .cpmark .sq'), foot = document.querySelector(`#panel .bkfoot .ftp[data-part="${k}"] .fti .sq`);
      const svg = e => e && e.querySelector('svg') ? e.querySelector('svg').innerHTML.replace(/\s+/g, '') : null;
      return { title: (h.querySelector('.cphd b') || {}).textContent, titleCol: h.querySelector('.cphd b') ? getComputedStyle(h.querySelector('.cphd b')).color : null,
        value: (h.querySelector('.cphv') || {}).textContent, markCls: mk ? mk.className : null, footCls: foot ? foot.className : null,
        markSvg: svg(mk), footSvg: svg(foot), markText: mk ? mk.textContent : null, footText: foot ? foot.textContent : null,
        fc: foot ? getComputedStyle(foot).color : null }; }, kind); };
  { const c = await cardFor('id');
    const ids = TB.reduce((n, t) => n + t.cols.filter(col => /^uuid|UUID/.test(String(col[1]).replace(/\s*\|\s*None\s*$/, ''))).length, 0), all = TB.reduce((n, t) => n + t.cols.length, 0);
    ok(c.title === 'id' && c.value === ids + ' of ' + all + ' fields', 'hovering a kind opens ITS card with its count', JSON.stringify({ t: c.title, v: c.value }));
    ok(c.markCls && /e-symbol/.test(c.markCls) && c.markSvg && c.markSvg === c.footSvg, 'the card leads with the SAME mark the footer draws — the id symbol', JSON.stringify({ card: c.markCls, foot: c.footCls }));
    ok(c.titleCol === c.fc, 'and its title wears that kind\'s colour', JSON.stringify({ title: c.titleCol, mark: c.fc })); }
  await p.evaluate(() => { window.DATACFG.sqEnc = 'char'; window.applyData(); window.showTab('data'); }); await p.waitForTimeout(300);
  { const c = await cardFor('time');
    ok(/e-char/.test(c.markCls || '') && c.markText === c.footText && c.markText === 'T', 'with the encoding switched to characters, the card follows — the time card leads with "T"', JSON.stringify(c)); }
  await p.evaluate(() => { window.DATACFG.sqEnc = 'symbol'; window.applyData(); window.showTab('data'); }); await p.waitForTimeout(300);
  ok(/footer hint \| id text num flag time list other opt, icon count/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names the footer row');
  await p.evaluate(() => { window.FOLDS.foot = 0; window.drawDataCfg(); }); await p.mouse.move(5, 1030); await p.waitForTimeout(200); }

// ══ FIELD-MARK OPACITY + THE UNIQUE CORNERS (operator 2026-09-13): two opacity stops — optional, and standard, which a
//    unique field shares; a unique field is marked by its CORNERS or not at all. Opacity is read off the marks, the
//    corners off the PIXELS: each shot with corners is diffed against the same spot drawn with none ══
{ await p.evaluate(() => { window.FOLDS.marks = 1; window.showTab('data'); window.showVariant('data', 'blocks'); window.drawDataCfg(); }); await p.waitForTimeout(320);
  const ops = () => p.evaluate(() => { const a = sel => [...document.querySelectorAll('#panel .blk .bkhd .sq' + sel)].map(e => +(+getComputedStyle(e).opacity).toFixed(2));
    return { std: a(':not(.opt):not(.uq)'), opt: a('.opt:not(.uq)'), uq: a('.uq:not(.opt)') }; });
  { const o = await ops();
    ok(o.std.length > 0 && o.std.every(v => v === 1), 'a standard field mark boots solid, at 100%', JSON.stringify(o.std.slice(0, 4)));
    ok(o.opt.length > 0 && o.opt.every(v => v === 0.5), 'an optional one sits at 50%', JSON.stringify(o.opt.slice(0, 4)));
    ok(o.uq.length > 0 && o.uq.every(v => v === 1), 'a unique one sits WITH the standard ones — opacity no longer marks it', JSON.stringify(o.uq.slice(0, 4))); }
  await p.focus('#datacfg .sldt[aria-label="standard field mark opacity"]'); for (let i = 0; i < 8; i++) await p.keyboard.press('ArrowLeft');
  await p.focus('#datacfg .sldt[aria-label="optional field mark opacity"]'); for (let i = 0; i < 2; i++) await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(260);
  { const o = await ops();
    ok(o.std.every(v => v === 0.6) && o.opt.every(v => v === 0.4) && o.uq.every(v => v === 0.6), 'each bar moves its own stop, and unique follows the standard one — 40% · 60% · 60%', JSON.stringify({ s: o.std[0], o: o.opt[0], u: o.uq[0] })); }
  { const sc = await p.$$eval('#datacfg .sqscale i[data-stop]', els => els.map(e => ({ k: e.dataset.stop, left: parseFloat(e.style.left) })));
    ok(sc.map(x => x.k).join(',') === 'opt,std' && sc[0].left === 40 && sc[1].left === 60, 'the rail\'s bar draws TWO stops — unique has none of its own', JSON.stringify(sc)); }
  await p.evaluate(() => { Object.assign(window.DATACFG, { sqBase: 100, sqOptA: 50 }); window.applyData(); window.drawDataCfg(); }); await p.waitForTimeout(220);
  // ── the rail: corners or none, and the corner dials only while corners is picked ──
  const rail = () => p.evaluate(() => ({ marks: [...document.querySelectorAll('#datacfg .ib[data-sq-uq-mark]')].map(b => b.dataset.sqUqMark),
    at: document.querySelectorAll('#datacfg .ib[data-sq-uq-at]').length, flip: document.querySelectorAll('#datacfg .ib[data-sq-uq-flip]').length,
    arms: ['length', 'width', 'tip'].filter(k => document.querySelector('#datacfg .sldt[aria-label="corner arm ' + k + '"]')).length }));
  { const r = await rail(); ok(r.marks.join(',') === 'corners,none', 'the unique mark offers two choices: corners or none', JSON.stringify(r.marks));
    ok(r.at === 3 && r.flip === 2 && r.arms === 3, 'with corners picked: which corners (3) · mirror (2) · arm length, width and tip', JSON.stringify(r)); }
  { const ic = await p.$$eval('#datacfg .ib.on .uqL', els => els.map(e => ({ s: getComputedStyle(e).stroke, bg: getComputedStyle(e.closest('.ib')).backgroundColor })));
    ok(ic.length >= 3 && ic.every(x => x.s !== x.bg), 'a SELECTED corner button still shows its L\'s — never accent on the accent ground', JSON.stringify(ic)); }
  await p.click('#datacfg .ib[data-sq-uq-mark="none"]'); await p.waitForTimeout(260);
  { const r = await rail(); ok(r.at === 0 && r.flip === 0 && r.arms === 0, 'NONE folds the corner dials away — they would set nothing', JSON.stringify(r));
    const pe = await p.$eval('#panel .blk .bkhd .sq.uq', e => [getComputedStyle(e, '::before').content, getComputedStyle(e, '::after').content]);
    ok(pe.every(c => c === 'none'), 'and draws nothing around a unique field', JSON.stringify(pe));
    const o = await ops(); ok(o.uq.every(v => v === 1), 'which still sits at the standard stop', JSON.stringify(o.uq.slice(0, 3))); }
  await p.click('#datacfg .ib[data-sq-uq-mark="corners"]'); await p.waitForTimeout(260);
  // ── pixels: a unique mark with no unique neighbour (a neighbour's arm would reach into the gap) ──
  const target = await p.evaluate(() => [...document.querySelectorAll('#panel .blk .bkhd .sq.uq')].findIndex(e =>
    !(e.previousElementSibling && e.previousElementSibling.classList.contains('uq')) && !(e.nextElementSibling && e.nextElementSibling.classList.contains('uq'))));
  ok(target >= 0, 'a unique mark with no unique neighbour exists to measure', String(target));
  const accent = await p.evaluate(i => { const c = getComputedStyle(document.querySelectorAll('#panel .blk .bkhd .sq.uq')[i], '::before').backgroundColor, n = c.match(/[\d.]+/g).map(Number);
    return /^color\(/.test(c) ? n.slice(0, 3).map(v => v * 255) : n.slice(0, 3); }, Math.max(0, target));
  const setUq = cfg => p.evaluate(c => { Object.assign(window.DATACFG, c); window.applyData(); }, cfg);
  const shot = async () => { await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide && window.hoverHide()); await p.waitForTimeout(120);
    const r = await p.evaluate(i => { const e = document.querySelectorAll('#panel .blk .bkhd .sq.uq')[i]; e.scrollIntoView({ block: 'center', inline: 'nearest' });
      const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width }; }, Math.max(0, target));
    const clip = { x: Math.floor(r.l) - 10, y: Math.floor(r.t) - 10, width: Math.ceil(r.w) + 20, height: Math.ceil(r.b - r.t) + 20 };
    return { r, clip, img: decodePng(await p.screenshot({ clip })) }; };
  const pair = async () => { const cur = await shot(); await setUq({ sqUqMark: 'none' }); const base = await shot(); await setUq({ sqUqMark: 'corners' });
    return { cur, base, same: JSON.stringify(cur.clip) === JSON.stringify(base.clip) }; };
  // how much of the accent a page pixel took on, 0..1, against the same pixel drawn with no corners
  const cov = (pr, X, Y) => { const x = Math.floor(X) - pr.cur.clip.x, y = Math.floor(Y) - pr.cur.clip.y;
    if (x < 0 || y < 0 || x >= pr.cur.img.w || y >= pr.cur.img.h) return 0;
    const b0 = pr.base.img.at(x, y), c0 = pr.cur.img.at(x, y); let k = 0;
    for (let c = 1; c < 3; c++) if (Math.abs(accent[c] - b0[c]) > Math.abs(accent[k] - b0[k])) k = c;
    const d = accent[k] - b0[k]; return Math.abs(d) < 24 ? 0 : Math.max(0, Math.min(1, (c0[k] - b0[k]) / d)); };
  const patch = (pr, x0, y0) => { let s = 0; for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) s += cov(pr, x0 + dx, y0 + dy); return +s.toFixed(2); };
  const corners = pr => { const r = pr.cur.r, fL = r.l - 3, fT = r.t - 3, fR = r.r + 3, fB = r.b + 3;
    return { same: pr.same, tr: patch(pr, fR - 3, fT), tl: patch(pr, fL, fT), bl: patch(pr, fL, fB - 3), br: patch(pr, fR - 3, fB - 3) }; };
  // an arm's drawn width at a fraction of the frame from the top-right corner: the top arm over the rows above the mark,
  // the right arm over the columns beside it
  const thick = (pr, f) => { const r = pr.cur.r, x = r.r + 3 - f * (r.w + 6); let s = 0;
    for (let y = Math.floor(r.t - 3) - 1; y < Math.floor(r.t); y++) s += cov(pr, x, y); return +s.toFixed(2); };
  const thickV = (pr, f) => { const r = pr.cur.r, y = r.t - 3 + f * (r.w + 6); let s = 0;
    for (let x = Math.ceil(r.r); x <= Math.floor(r.r + 3) + 1; x++) s += cov(pr, x, y); return +s.toFixed(2); };
  const off = c => c < 0.5, on = c => c > 1.5;
  { const c = corners(await pair()); ok(c.same && on(c.tr) && on(c.bl) && off(c.tl) && off(c.br), 'corners boot as an L at the TOP-RIGHT and one at the BOTTOM-LEFT — read off the pixels', JSON.stringify(c)); }
  await p.click('#datacfg .ib[data-sq-uq-at="top-right"]'); await p.waitForTimeout(260);
  { const c = corners(await pair()); ok(c.same && on(c.tr) && off(c.bl) && off(c.tl) && off(c.br), 'TOP-RIGHT keeps that corner alone', JSON.stringify(c)); }
  await p.click('#datacfg .ib[data-sq-uq-at="bottom-left"]'); await p.waitForTimeout(260);
  { const c = corners(await pair()); ok(c.same && on(c.bl) && off(c.tr) && off(c.tl) && off(c.br), 'BOTTOM-LEFT keeps that corner alone', JSON.stringify(c)); }
  await p.click('#datacfg .ib[data-sq-uq-at="both"]'); await p.waitForTimeout(260);
  await p.click('#datacfg .ib[data-sq-uq-flip="1"]'); await p.waitForTimeout(260);
  { const c = corners(await pair()); ok(c.same && on(c.tl) && on(c.br) && off(c.tr) && off(c.bl), 'MIRROR inverts the pair — top-left and bottom-right', JSON.stringify(c)); }
  await p.click('#datacfg .ib[data-sq-uq-at="top-right"]'); await p.waitForTimeout(260);
  { const c = corners(await pair()); ok(c.same && on(c.tl) && off(c.tr) && off(c.bl) && off(c.br), 'and a single mirrored corner moves too — top-right becomes top-left', JSON.stringify(c)); }
  await p.click('#datacfg .ib[data-sq-uq-at="both"]'); await p.waitForTimeout(260);
  await p.click('#datacfg .ib[data-sq-uq-flip="0"]'); await p.waitForTimeout(260);
  // ── the arms: length, width at the corner, width at the tip — measured from a straight arm (tip 100%) ──
  await setUq({ sqUqTip: 100 }); await p.evaluate(() => window.drawDataCfg()); await p.waitForTimeout(200);
  { const pr = await pair(), t = thick(pr, 0.7); ok(pr.same && t < 0.3, 'at 40% an arm stops short — nothing drawn 70% along the side', String(t)); }
  await p.focus('#datacfg .sldt[aria-label="corner arm length"]'); for (let i = 0; i < 12; i++) await p.keyboard.press('ArrowRight');
  { const pr = await pair(), t = thick(pr, 0.7), len = await p.evaluate(() => window.DATACFG.sqUqLen);
    ok(len === 100 && t > 0.8, 'ARM LENGTH runs it out to 100% — now drawn 70% along the side', JSON.stringify({ len, t })); }
  await p.focus('#datacfg .sldt[aria-label="corner arm width"]'); for (let i = 0; i < 8; i++) await p.keyboard.press('ArrowRight');
  { const pr = await pair(), n = thick(pr, 0.15), f = thick(pr, 0.85), w = await p.evaluate(() => window.DATACFG.sqUqW);
    ok(w === 3.5 && n > 2.4 && Math.abs(n - f) < 0.6, 'ARM WIDTH thickens it to 3.5px — as wide at its tip as at its corner', JSON.stringify({ w, n, f })); }
  await p.focus('#datacfg .sldt[aria-label="corner arm tip"]'); for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowLeft');
  { const pr = await pair(), n = thick(pr, 0.15), f = thick(pr, 0.85), nv = thickV(pr, 0.15), fv = thickV(pr, 0.85), tip = await p.evaluate(() => window.DATACFG.sqUqTip);
    ok(tip === 0 && n - f > 1.6 && f < 1.1, 'ARM TIP at 0% tapers the arm — thick at the corner, thinning to nothing at its end', JSON.stringify({ tip, n, f }));
    ok(nv - fv > 1.6 && fv < 1.1, 'and the other arm of the L tapers the same way', JSON.stringify({ nv, fv })); }
  await setUq({ sqUqLen: 40, sqUqW: 1.5, sqUqTip: 10 }); await p.evaluate(() => window.drawDataCfg()); await p.waitForTimeout(200);
  // ── THE BAR ITSELF IS A CONTROL (operator 2026-09-13: "I cannot move the sliders there") — drag its stops with the mouse ──
  const dragStop = async (stop, pct) => {
    const r = await p.$eval('#datacfg .sqscale', e => { const b = e.getBoundingClientRect(); return { x: b.left, w: b.width }; });
    const m = await p.$eval(`#datacfg .sqscale i[data-stop="${stop}"]`, e => { e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    const r2 = await p.$eval('#datacfg .sqscale', e => { const b = e.getBoundingClientRect(); return { x: b.left, w: b.width }; });
    await p.mouse.move(m.x, m.y); await p.mouse.down(); await p.mouse.move(r2.x + r2.w * pct / 100, m.y, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(240); };
  await dragStop('std', 50);
  { const c = await p.evaluate(() => ({ base: window.DATACFG.sqBase, slider: +document.querySelector('#datacfg .sldt[aria-label="standard field mark opacity"]').getAttribute('aria-valuenow') }));
    ok(c.base === 50 && c.slider === 50, 'dragging the STANDARD stop moves it — and the standard slider follows', JSON.stringify(c)); }
  await dragStop('opt', 30);
  { const c = await p.evaluate(() => ({ opt: window.DATACFG.sqOptA, base: window.DATACFG.sqBase, slider: +document.querySelector('#datacfg .sldt[aria-label="optional field mark opacity"]').getAttribute('aria-valuenow') }));
    ok(c.opt === 30 && c.base === 50 && c.slider === 30, 'the OPTIONAL stop drags out from under the standard one sitting on it (the first move left decides) — and its slider follows', JSON.stringify(c)); }
  { const o = await ops(); ok(o.std.every(v => v === 0.5) && o.opt.every(v => v === 0.3) && o.uq.every(v => v === 0.5), 'and the marks follow the dragged stops — 30% · 50%, unique with standard', JSON.stringify({ s: o.std[0], o: o.opt[0], u: o.uq[0] })); }
  const DEF = { sqBase: 100, sqOptA: 50, sqUqMark: 'corners', sqUqAt: 'both', sqUqFlip: 0, sqUqLen: 40, sqUqW: 1.5, sqUqTip: 10 };
  await p.evaluate(d => { Object.assign(window.DATACFG, d); window.applyData(); }, DEF);
  ok(/unique corners both, arms 40% 1\.5px tip 10%, standard 100% optional 50%/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names the corners, their arms and both stops');
  await setUq({ sqUqFlip: 1 }); ok(/unique corners both mirrored, arms/.test(await p.evaluate(() => window.COPYTXT.data())), 'and says when they are mirrored');
  await setUq({ sqUqMark: 'none' }); ok(/unique none, standard 100%/.test(await p.evaluate(() => window.COPYTXT.data())), 'and says when there are none');
  await p.evaluate(d => { Object.assign(window.DATACFG, d); window.FOLDS.marks = 0; window.applyData(); window.showTab('data'); window.drawDataCfg(); }, DEF);
  await p.waitForTimeout(260); }

// ══ SCHEMAS · BLOCKS (operator 2026-09-13: "redo the schemas section" with the pattern book) — the thing is a shape, its
//    pieces are fields; the looks it shares with Data are read from DATACFG. Counts are computed here from the feed. ══
{ // earlier sections walk every distribution and leave Schemas on its last one, so the boot default is read off the registry
  ok(await p.evaluate(() => window.PANELS.schemas.defaultVariant) === 'blocks', 'Schemas boots on BLOCKS — the pattern book carried to a second part');
  await p.evaluate(() => { window.showVariant('schemas', 'blocks'); }); await p.waitForTimeout(320);
  const SC = F.data.schemas, shapesF = [SC.request, ...(SC.request.nested || []), SC.response, ...(SC.response.nested || [])];
  const fieldsF = shapesF.reduce((n, s) => n + s.cols.length, 0);
  const base = t => { let b = String(t).replace(/\s*\|\s*None\s*$/, '').trim(), m; while ((m = /^(list|List|Optional|Sequence|set|Set|tuple|Tuple)\[(.*)\]$/.exec(b))) b = m[2].trim(); return b; };
  const isShape = t => /^[A-Z][A-Za-z0-9_]*$/.test(base(t)) && !/^(Any|Literal|Enum|Dict|List|Optional|Union|Annotated|Sequence|Mapping|Set|Tuple|UUID|EmailStr|Text|Decimal|Json|JSON)$/.test(base(t));
  const names = new Set(shapesF.map(s => s.name));
  const nestF = shapesF.reduce((n, s) => n + s.cols.filter(c => isShape(c[1])).length, 0);
  const nfF = shapesF.reduce((n, s) => n + s.cols.filter(c => isShape(c[1]) && !names.has(base(c[1]))).length, 0);
  const tree = []; for (const sc of [SC.request, SC.response]) { tree.push(sc.name); const fi = n => sc.cols.findIndex(c => base(c[1]) === n);
    [...(sc.nested || [])].sort((a, b) => fi(a.name) - fi(b.name)).forEach(n => tree.push(n.name)); }
  const st = await p.evaluate(() => ({ variant: document.getElementById('panel').dataset.variant,
    blocks: [...document.querySelectorAll('#panel .blk')].map(e => ({ n: e.dataset.table, marks: e.querySelectorAll('.bkhd .sq').length, shape: e.querySelectorAll('.bkhd .sq.t-shape').length })),
    pills: Object.fromEntries([...document.querySelectorAll('#panel .sechd .dcn')].map(e => [e.dataset.count, +e.textContent])),
    dirs: Object.fromEntries([...document.querySelectorAll('#panel .chb[data-sch-dir]')].map(e => [e.dataset.schDir, +e.textContent])) }));
  ok(st.variant === 'blocks', 'and the Blocks distribution draws', st.variant);
  ok(st.blocks.map(b => b.n).join(',') === tree.join(','), 'one block per shape — each body, then the shapes it carries in the order its fields name them', st.blocks.map(b => b.n).join(','));
  ok(st.blocks.every(b => b.marks === shapesF.find(s => s.name === b.n).cols.length), 'one mark per field', JSON.stringify(st.blocks.map(b => b.marks)));
  ok(nestF > 0 && st.blocks.reduce((n, b) => n + b.shape, 0) === nestF, 'a field whose type names another shape wears the SHAPE mark', String(nestF));
  ok(st.pills.shapes === shapesF.length && st.pills.fields === fieldsF && st.pills.nested === nestF, 'the title counts shapes · fields · nested, and each equals the feed', JSON.stringify(st.pills));
  ok(st.dirs.in + st.dirs.out === shapesF.length && st.dirs.in === 1 + (SC.request.nested || []).length, 'IN and OUT partition the shapes — the request tree and the response tree', JSON.stringify(st.dirs));
  await p.click('#panel .chb[data-sch-dir="out"]'); await p.waitForTimeout(260);
  { const b = await p.$$eval('#panel .blk', els => els.map(e => e.classList.contains('dir-in'))), s = await p.$eval('#panel .sechd .dcn[data-count="shapes"]', e => +e.textContent);
    ok(b.length === st.dirs.in && b.every(Boolean) && s === st.dirs.in, 'switching OUT off leaves the request tree, and the count follows', JSON.stringify({ n: b.length, s })); }
  await p.click('#panel .chb[data-sch-dir="out"]'); await p.waitForTimeout(260);
  await p.click('#panel .srb[data-sch-sort="name"]'); await p.waitForTimeout(260);
  { const n = await p.$$eval('#panel .blk', els => els.map(e => e.dataset.table)); ok(n.join() === [...n].sort((a, b) => a.localeCompare(b)).join(), 'sort by NAME reads A to Z', n.slice(0, 4).join(',')); }
  await p.click('#panel .srb[data-sch-sort="tree"]'); await p.waitForTimeout(260);
  { const lk = await p.evaluate(() => { const chip = document.querySelector('#panel .blk .bkhd .bkrw .jdrw'), cs = getComputedStyle(chip), sq = document.querySelector('#panel .blk .bkhd .sq'), blk = document.querySelector('#panel .blk');
      return { words: chip.textContent, radius: parseFloat(cs.borderTopLeftRadius), fs: parseFloat(cs.fontSize), sq: Math.round(sq.getBoundingClientRect().height), sqCfg: window.DATACFG.sqSize, edge: parseFloat(getComputedStyle(blk).borderLeftWidth) }; });
    ok(lk.words === 'IN' && lk.radius >= 9 && lk.fs === 11, 'the IN · OUT chip wears Data\'s chip look — a pill at 11px', JSON.stringify(lk));
    ok(lk.sq === lk.sqCfg && lk.edge === 2, 'the field marks and the edge are Data\'s too — one look, set once', JSON.stringify(lk)); }
  { const v = await p.$$eval('#panel .blk', els => els.slice(0, 2).map(e => (e.querySelector('.bkv') || {}).textContent));
    ok(/body/.test(v[0]) && v[1].startsWith(SC.request.cols.find(c => base(c[1]) === tree[1])[0]), 'a body says so; a nested block leads with the FIELD that carries it', JSON.stringify(v)); }
  // the card mirrors the block
  { await p.mouse.move(5, 1030); await p.waitForTimeout(120); await p.hover('#panel .blk:nth-child(2) .bkhd'); await p.waitForTimeout(280);
    const c = await p.evaluate(() => { const h = document.getElementById('hover'), blk = document.querySelector('#panel .blk:nth-child(2)'), at = (e, a) => e ? e.getAttribute(a) : null;
      return { name: (h.querySelector('.bchd b') || {}).textContent, g: at(h.querySelector('.bchd svg'), 'stroke'), bg: at(blk.querySelector('.bkhd .bki svg'), 'stroke'), blk: blk.dataset.table,
        via: (h.querySelector('[data-ln="via"]') || {}).textContent || '', chip: (h.querySelector('[data-row="direction"] .bcchip') || {}).textContent, fp: +(h.querySelector('.bcfp') || {}).textContent,
        mix: [...h.querySelectorAll('.bcmix .mx b')].reduce((n, b) => n + +b.textContent, 0), foot: (h.querySelector('.bcfoot') || {}).textContent || '' }; });
    const sh = shapesF.find(s => s.name === c.blk);
    ok(c.name === c.blk && c.g && c.g === c.bg, 'a shape\'s card mirrors its block — the same glyph colour, then its name', JSON.stringify(c));
    ok(sh && c.via.includes(SC.request.name) && c.chip === 'in — the request' && c.fp === sh.cols.length && c.mix === sh.cols.length && /record/.test(c.foot),
       'then where it sits, the direction as the block\'s chip with words, the fields pill, and marks that add back up', JSON.stringify(c)); }
  { const pillCard = async k => { await p.mouse.move(5, 1030); await p.waitForTimeout(120); await p.hover(`#panel .sechd .dcp[data-pill="${k}"]`); await p.waitForTimeout(260);
      return p.evaluate(() => { const h = document.getElementById('hover'); return { title: (h.querySelector('.cphd b') || {}).textContent, value: (h.querySelector('.cphv') || {}).textContent,
        factors: [...h.querySelectorAll('.fct')].map(f => f.textContent) }; }); };
    const f = await pillCard('fields');
    ok(f.title === 'fields' && +f.value === fieldsF && f.factors.reduce((n, t) => n + +((t.match(/(\d+) fields?/) || [0, 0])[1]), 0) === fieldsF, 'the FIELDS pill\'s card lists the kinds, and they add back up', JSON.stringify(f).slice(0, 220));
    const n = await pillCard('nested'), num = s => +((n.factors.find(t => t.includes(s)) || '').match(/(\d+)/) || [0, -1])[1];
    ok(+n.value === nestF && num('drawn here') === nestF - nfF && num('not in the feed') === nfF, 'the NESTED pill splits into shapes drawn here and shapes the feed does not carry', JSON.stringify({ n, nestF, nfF })); }
  await p.mouse.move(5, 1030); await p.waitForTimeout(120);
  { const ft = await p.$$eval('#panel .bkfoot .ftp', els => els.map(e => ({ k: e.dataset.part, n: (e.querySelector('.ftn') || {}).textContent })));
    const kinds = ft.filter(x => x.k !== 'hint' && x.k !== 'opt');
    ok(kinds.reduce((s, x) => s + +x.n, 0) === fieldsF && +(kinds.find(x => x.k === 'shape') || {}).n === nestF, 'the footer\'s kinds add back up to the fields, SHAPE among them', JSON.stringify(ft)); }
  // the record
  await p.evaluate(() => window.selectIn('schemas', window.LABEP.data.schemas.response.name)); await p.waitForTimeout(300);
  { const r = await p.evaluate(() => { const b = document.querySelector('#portbody .ptrec'); if (!b) return null;
      return { name: (b.querySelector('.rchd b') || {}).textContent, head: document.getElementById('portt').textContent, rows: [...b.querySelectorAll('.rcrow')].map(x => x.dataset.row),
        heads: [...b.querySelectorAll('.rctab .rcth > span')].map(s => s.firstChild ? s.firstChild.textContent.trim() : ''), fp: +(b.querySelector('.rctab .rcfp') || {}).textContent,
        rowsN: b.querySelectorAll('.rctab .fld').length, nest: [...b.querySelectorAll('.rctab .fld .c-k [data-nest]')].map(x => x.dataset.nest + ':' + x.textContent),
        sel: [...document.querySelectorAll('#panel .blk.sel')].map(x => x.dataset.table), shared: (b.querySelector('.rcrow[data-row="shared"] .v') || {}).textContent || '' }; });
    ok(r && r.name === SC.response.name && r.head === SC.response.name && r.sel.join() === SC.response.name, 'clicking a shape opens ITS record in the portrait, and its block wears the mark', JSON.stringify(r));
    ok(r && r.rows.join(',') === 'channel,entity,body,file,shared' && r.shared.includes(F.widening.response_consumers[0]), 'rows: channel · entity · body · file · and who else returns it', JSON.stringify(r && r.rows));
    ok(r && r.heads.join(',') === 'fields,nested shape,data type' && r.fp === SC.response.cols.length && r.rowsN === SC.response.cols.length, 'the fields as a table — fields · nested shape · data type', JSON.stringify(r && r.heads));
    ok(r && r.nest.length === SC.response.cols.filter(c => isShape(c[1])).length && r.nest.every(x => /^in-feed:→ \d+ fields?$/.test(x)),
       'each nested field says how many fields its shape holds — the type column already names it', JSON.stringify(r && r.nest)); }
  { const r = await p.evaluate(() => { const nf = window.SCHSHAPES().find(s => s.cols.some(c => window.SCHKIND(c[1]) === 'shape' && !window.SCHSHAPES().some(x => x.name === String(c[1]).replace(/\s*\|\s*None\s*$/, ''))));
      if (!nf) return null; window.selectIn('schemas', nf.name);
      return { name: nf.name, rows: [...document.querySelectorAll('#portbody .rcrow')].map(x => x.dataset.row), nf: document.querySelectorAll('#portbody .rctab [data-nest="not-in-feed"]').length }; });
    ok(r && r.rows[2] === 'parent' && r.nf > 0, 'a nested shape names its parent, and a field whose shape the feed lacks is marked, not drawn as empty', JSON.stringify(r)); }
  { const cuts = await p.evaluate(() => { const out = [];
      for (const s of window.SCHSHAPES()) { window.selectIn('schemas', s.name); const b = document.querySelector('#portbody .ptrec'); if (!b) { out.push(s.name + ' no record'); continue; }
        if (b.scrollWidth > b.clientWidth + 1) out.push(s.name + ' overflows ' + b.scrollWidth + '>' + b.clientWidth);
        b.querySelectorAll('.rctab .fld .fn, .rctab .fld .ft').forEach(n => {
          // a wrapping cell may take two lines, but no piece of it may spill; a one-line cell must show its whole text
          if (getComputedStyle(n).whiteSpace !== 'nowrap') { if (n.scrollWidth > n.clientWidth + 1) out.push(s.name + '.' + n.textContent + ' spills'); return; }
          const m = document.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
          m.style.font = getComputedStyle(n).font; m.textContent = n.textContent; document.body.append(m); const w = m.getBoundingClientRect().width; m.remove();
          if (w > n.getBoundingClientRect().width + 0.05) out.push(s.name + '.' + n.textContent); }); }
      return out; });
    ok(cuts.length === 0, 'across every shape, no field name or type is cut and nothing runs past the portrait', JSON.stringify(cuts.slice(0, 5))); }
  await p.evaluate(() => window.selectIn('schemas', null)); await p.waitForTimeout(200);
  // the rail and the copy line
  ok(await p.evaluate(() => window.COPYTXT.schemas()) === 'schemas · shown as blocks · directions in+out · title counts shapes icon, fields icon, nested icon · sort tree'
     + ' · block block (glyph on, chip on, name on, entity both, count badge, where both) · lines icon name | — / ent | count dir / via | — · sizes icon 13 name 13 ent 12 via 12'
     + ' · footer icon count · drawn legend · hidden title note · map blocks all, nested shape, colour rw, looks shared', 'the schemas copy line names every setting, the schema map among them', await p.evaluate(() => window.COPYTXT.schemas()));
  { const g = await p.$$eval('#schcfg .cffold', els => els.map(e => ({ k: e.dataset.group, open: e.classList.contains('open'), body: getComputedStyle(e.querySelector('.cffoldbody')).display })));
    ok(g.length === 9 && g.filter(x => x.open).map(x => x.k).join() === 'map' && g.filter(x => !x.open).every(x => x.body === 'none'),
       'the schemas rail is nine folds, only THE SCHEMA MAP open — and a closed fold really hides its body', JSON.stringify(g)); }
  await p.evaluate(() => window.moveSchPart('via', 0, 'r', 0)); await p.waitForTimeout(260);
  { const l = await p.$$eval('#panel .blk:first-child .bkln', els => els.map(e => [...e.querySelector('.bkcol.r').children].map(c => c.className)));
    ok(l.length === 2 && l[0].some(c => /bkv/.test(c)), 'a title part drags to another line — WHERE moves up beside the name and the empty third line goes', JSON.stringify(l)); }
  await p.evaluate(() => { window.SCHCFG.bk.rows = [{ l: ['icon', 'name'], r: [] }, { l: ['ent'], r: ['count', 'dir'] }, { l: ['via'], r: [] }]; window.SCHCFG.bk.sel = 'icon'; window.showTab('schemas'); window.drawSchCfg(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { window.DATACFG.bk.rwBox = 'square'; window.applyData(); }); await p.waitForTimeout(150);
  ok(await p.$eval('#panel .blk .bkhd .bkrw .jdrw', e => parseFloat(getComputedStyle(e).borderTopLeftRadius) === 0), 'a chip box set in Data\'s rail reaches the IN · OUT chip — shared, not copied');
  await p.evaluate(() => { window.DATACFG.bk.rwBox = 'pill'; window.applyData(); window.showTab('data'); }); await p.waitForTimeout(250); }

// ══ THE SCHEMA MAP AS OPTIONS (operator 2026-09-13: "build them all and have them as options to choose in the left panel") —
//    blocks all|bodies · nested kind shape|other · direction colour rw|schema|neutral · looks shared|own ══
{ const SC = F.data.schemas, bodies = [SC.request.name, SC.response.name];
  await p.evaluate(() => { window.showVariant('schemas', 'blocks'); window.drawSchCfg(); }); await p.waitForTimeout(280);
  ok(await p.$$eval('#schcfg .cffold[data-group="map"] .ib', els => ['sch-map-blocks', 'sch-map-kind', 'sch-map-col', 'sch-map-looks'].every(a => els.some(e => e.hasAttribute('data-' + a)))),
     'the schema map offers four choices as buttons: blocks · nested kind · direction colour · looks');
  await p.click('#schcfg .ib[data-sch-map-blocks="bodies"]'); await p.waitForTimeout(280);
  { const b = await p.$$eval('#panel .blk', els => els.map(e => ({ n: e.dataset.table, chips: [...e.querySelectorAll('.snc')].map(c => c.dataset.table) })));
    const want = [SC.request, SC.response].map(s => (s.nested || []).length);
    ok(b.map(x => x.n).join() === bodies.join() && b.every((x, i) => x.chips.length === want[i]), 'BODIES ONLY draws the two bodies, each nested shape a chip inside its body', JSON.stringify(b)); }
  { const s = await p.evaluate(() => { const c = document.querySelector('#panel .snc'); c.click(); return c.dataset.table; }); await p.waitForTimeout(260);
    ok(await p.$eval('#portt', e => e.textContent) === s, 'and a nested chip still opens its own record', s); }
  await p.evaluate(() => window.selectIn('schemas', null));
  await p.click('#schcfg .ib[data-sch-map-blocks="all"]'); await p.waitForTimeout(260);
  await p.click('#schcfg .ib[data-sch-map-kind="other"]'); await p.waitForTimeout(260);
  { const k = await p.evaluate(() => ({ shape: document.querySelectorAll('#panel .blk .bkhd .sq.t-shape').length,
      other: +((document.querySelector('#panel .bkfoot .ftp[data-part="other"] .ftn') || {}).textContent || 0), nested: +document.querySelector('#panel .sechd .dcn[data-count="nested"]').textContent }));
    ok(k.shape === 0 && k.nested > 0 && k.other >= k.nested, 'NESTED KIND other files those fields under OTHER — no shape marks, and the nested count stands', JSON.stringify(k)); }
  await p.click('#schcfg .ib[data-sch-map-kind="shape"]'); await p.waitForTimeout(220);
  const chipCol = () => p.$eval('#panel .blk .bkhd .bkrw .jdrw', e => e.style.getPropertyValue('--rwc').trim().toLowerCase());
  await p.click('#schcfg .ib[data-sch-map-col="schema"]'); await p.waitForTimeout(260);
  ok(await chipCol() === (await p.evaluate(() => window.STATION.KINDCOL.schema)).toLowerCase(), 'DIRECTION COLOUR schema paints the IN chip in the schema colour', await chipCol());
  await p.click('#schcfg .ib[data-sch-map-col="rw"]'); await p.waitForTimeout(220);
  ok(await chipCol() === (await p.evaluate(() => window.STATION.OPC.read)).toLowerCase(), 'and read/write gives IN its read green back', await chipCol());
  await p.click('#schcfg .ib[data-sch-map-looks="own"]'); await p.waitForTimeout(260);
  ok(await p.evaluate(() => !!window.SCHCFG.look && window.SCHCFG.look.sqEnc === window.DATACFG.sqEnc && window.SCHCFG.look.pillBg === window.DATACFG.pillBg), 'LOOKS own starts as a copy of Data\'s look');
  await p.click('#schcfg .ib[data-sch-lk-enc="char"]'); await p.waitForTimeout(260);
  { const sch = await p.$$eval('#panel .blk .bkhd .sq', els => els.length > 0 && els.every(e => e.classList.contains('e-char')));
    await p.evaluate(() => window.showVariant('data', 'blocks')); await p.waitForTimeout(260);
    const dat = await p.$$eval('#panel .blk .bkhd .sq', els => els.length > 0 && els.every(e => e.classList.contains('e-' + window.DATACFG.sqEnc)));
    ok(sch && dat && await p.evaluate(() => window.DATACFG.sqEnc !== 'char'), 'a mark set in Schemas\' own look draws characters in Schemas while Data keeps its own', JSON.stringify({ sch, dat })); }
  await p.evaluate(() => { window.showTab('schemas'); }); await p.waitForTimeout(220);
  ok(/looks own \(char /.test(await p.evaluate(() => window.COPYTXT.schemas())), 'the copy line carries Schemas\' own look while it has one');
  await p.evaluate(() => { Object.assign(window.SCHCFG.map, { blocks: 'all', nestKind: 'shape', dirCol: 'rw', looks: 'shared' }); window.SCHCFG.look = null; window.applyData(); window.drawSchCfg(); window.showTab('data'); });
  await p.waitForTimeout(260); }

// ══ FUNCTIONS · BLOCKS (operator 2026-09-13: "another section following the conventions — next one is functions") — the
//    thing is a function (the handler at L0 and the walk), its pieces the tables it touches or the functions it calls ══
{ ok(await p.evaluate(() => window.PANELS.functions.defaultVariant) === 'blocks', 'Functions boots on BLOCKS — the pattern book\'s second carry-over');
  await p.evaluate(() => window.showVariant('functions', 'blocks')); await p.waitForTimeout(320);
  const FN = F.functions, all = [FN.handler, ...FN.walk.flat()], ops = all.reduce((n, f) => n + (f.ops || []).length, 0);
  const reads = all.reduce((n, f) => n + (f.ops || []).filter(o => o.rw !== 'w').length, 0), writes = ops - reads;
  const commits = all.filter(f => f.commits).length, infN = FN.walk.flat().filter(f => f.conf === 'inferred').length, roles = r => all.filter(f => (f.role || 'pure') === r).length;
  const st = await p.evaluate(() => ({ blocks: [...document.querySelectorAll('#panel .blk')].map(e => ({ n: e.dataset.table, marks: e.querySelectorAll('.bkhd .sq').length, dashed: getComputedStyle(e).borderTopStyle === 'dashed', dot: !!e.querySelector('.bkhd .cdot') })),
    pills: Object.fromEntries([...document.querySelectorAll('#panel .sechd .dcn')].map(e => [e.dataset.count, +e.textContent])),
    roles: Object.fromEntries([...document.querySelectorAll('#panel .chb[data-fn-role]')].map(e => [e.dataset.fnRole, +e.textContent])) }));
  ok(st.blocks.map(b => b.n).join(',') === all.map(f => f.name).join(','), 'one block per function — the handler, then the walk hop by hop', st.blocks.map(b => b.n).slice(0, 5).join(','));
  ok(st.blocks.every((b, i) => b.marks === (all[i].ops || []).length), 'each mark is a table the function reads or writes', JSON.stringify(st.blocks.map(b => b.marks)));
  // 26 blocks in the work box: a row may never be squeezed shorter than its block — the body scrolls instead
  { const clip = await p.$$eval('#panel .blk', els => els.map(e => ({ n: e.dataset.table, over: e.scrollHeight - e.clientHeight, lastLine: (() => { const ln = [...e.querySelectorAll('.bkhd .bkln')].pop(), r = ln && ln.getBoundingClientRect(), b = e.getBoundingClientRect(); return r ? Math.round(b.bottom - r.bottom) : 99; })() })).filter(x => x.over > 1 || x.lastLine < 0));
    ok(clip.length === 0, 'no function block clips its own title or marks — the body scrolls instead of squeezing the rows', JSON.stringify(clip.slice(0, 4))); }
  ok(st.pills.functions === all.length && st.pills.levels === FN.walk.length && st.pills.commits === commits, 'the title counts functions · levels · commits, each equal to the feed', JSON.stringify(st.pills));
  ok(['accessor', 'caller', 'gate', 'pure'].every(r => st.roles[r] === roles(r)) && Object.values(st.roles).reduce((a, b) => a + b, 0) === all.length, 'the four role switches partition the functions', JSON.stringify(st.roles));
  ok(st.blocks.filter(b => b.dashed).length === infN && st.blocks.filter(b => b.dot).length === commits, 'an inferred hop is drawn dashed (law G), and a function that commits carries the pulse (law I)', JSON.stringify({ dashed: st.blocks.filter(b => b.dashed).length, infN, dots: st.blocks.filter(b => b.dot).length, commits }));
  await p.click('#panel .chb[data-fn-role="accessor"]'); await p.waitForTimeout(260);
  { const n = await p.$$eval('#panel .blk', els => els.length), s = await p.$eval('#panel .sechd .dcn[data-count="functions"]', e => +e.textContent);
    ok(n === all.length - roles('accessor') && s === n, 'switching ACCESSOR off leaves the other roles, and the count follows', JSON.stringify({ n, s })); }
  await p.click('#panel .chb[data-fn-role="accessor"]'); await p.waitForTimeout(260);
  await p.click('#panel .srb[data-fn-sort="size"]'); await p.waitForTimeout(260);
  { const ls = await p.$$eval('#panel .blk', els => els.map(e => e.dataset.table)), lines = ls.map(n => all.find(f => f.name === n).lines || 0);
    ok(lines.every((v, i) => !i || lines[i - 1] >= v), 'sort by SIZE puts the longest body first', lines.slice(0, 5).join(',')); }
  await p.click('#panel .srb[data-fn-sort="walk"]'); await p.waitForTimeout(260);
  { const big = all.reduce((a, f) => ((f.ops || []).length > (a.ops || []).length ? f : a), all[0]);
    await p.mouse.move(5, 1030); await p.waitForTimeout(120); await p.hover(`#panel .blk[data-table="${big.name}"] .bkhd`); await p.waitForTimeout(280);
    const c = await p.evaluate(n => { const h = document.getElementById('hover'), blk = document.querySelector(`#panel .blk[data-table="${n}"]`), at = (e, a) => e ? e.getAttribute(a) : null;
      return { name: (h.querySelector('.bchd b') || {}).textContent, g: at(h.querySelector('.bchd svg'), 'stroke'), bg: at(blk.querySelector('.bkhd .bki svg'), 'stroke'),
        chip: (h.querySelector('[data-row="role"] .bcchip') || {}).textContent, fp: +(h.querySelector('[data-row="tables"] .bcfp') || {}).textContent,
        mix: [...h.querySelectorAll('[data-row="tables"] .bcmix .mx b')].reduce((s, b) => s + +b.textContent, 0), foot: (h.querySelector('.bcfoot') || {}).textContent || '' }; }, big.name);
    ok(c.name === big.name && c.g && c.g === c.bg, 'a function\'s card mirrors its block — the same glyph colour, then its name', JSON.stringify(c));
    ok(c.chip === big.role && c.fp === big.ops.length && c.mix === big.ops.length && /record/.test(c.foot), 'then its role as the block\'s chip, the tables pill, and read/write marks that add back up', JSON.stringify(c)); }
  { await p.mouse.move(5, 1030); await p.waitForTimeout(120); await p.hover('#panel .sechd .dcp[data-pill="functions"]'); await p.waitForTimeout(260);
    const fc = await p.evaluate(() => { const h = document.getElementById('hover'); return { factors: [...h.querySelectorAll('.fct')].map(f => f.textContent), text: h.innerText }; });
    ok(fc.factors.reduce((n, t) => n + +((t.match(/(\d+) functions?/) || [0, 0])[1]), 0) === all.length && fc.text.includes(FN.behind.fns + ' functions'), 'the FUNCTIONS pill lists the roles that add up to it, and names the code behind', JSON.stringify(fc).slice(0, 220)); }
  await p.mouse.move(5, 1030); await p.waitForTimeout(120);
  { const ft = Object.fromEntries(await p.$$eval('#panel .bkfoot .ftp', els => els.map(e => [e.dataset.part, +((e.querySelector('.ftn') || {}).textContent || 0)])));
    ok(ft.read === reads && ft.write === writes && ft.commit === commits && ft.inferred === infN, 'the footer counts reads, writes, commits and inferred hops — each equal to the feed', JSON.stringify(ft)); }
  // the function map, every choice an option
  const setMap = m => p.evaluate(m => { Object.assign(window.FNCFG.map, m); window.applyData(); window.showVariant('functions', 'blocks'); window.drawFnCfg(); }, m);
  await setMap({ pieces: 'calls' }); await p.waitForTimeout(260);
  { const m = await p.$$eval('#panel .blk', els => els.map(e => ({ n: e.dataset.table, k: e.querySelectorAll('.bkhd .sq').length })));
    const callees = n => FN.walk.flat().filter(f => f.via === n).length;
    ok(m.every(x => x.k === callees(x.n)) && m.some(x => x.k > 0), 'PIECES calls: each mark is a function it calls', JSON.stringify(m.filter(x => x.k).slice(0, 4))); }
  await setMap({ pieces: 'both' }); await p.waitForTimeout(260);
  ok(await p.$$eval('#panel .blk .bkhd .sq', els => els.length) === ops + FN.walk.flat().length, 'PIECES both: every table touch and every call', String(ops + FN.walk.flat().length));
  await setMap({ pieces: 'tables', handler: 'off' }); await p.waitForTimeout(260);
  ok(await p.$$eval('#panel .blk', els => els.length) === all.length - 1, 'HANDLER walk only drops the handler\'s block');
  await setMap({ handler: 'block', roleCol: 'mono' }); await p.waitForTimeout(260);
  ok(await p.$$eval('#panel .blk .bkhd .bkrw .jdrw', els => els.length > 0 && els.every(e => e.style.getPropertyValue('--rwc').trim() === '#8794ab')), 'ROLE COLOUR mono paints every role chip grey');
  await setMap({ roleCol: 'station', inferred: 'tag' }); await p.waitForTimeout(260);
  { const t = await p.evaluate(() => ({ tags: document.querySelectorAll('#panel .blk .ftag').length, dashed: [...document.querySelectorAll('#panel .blk')].filter(e => getComputedStyle(e).borderTopStyle === 'dashed').length }));
    ok(t.tags === infN && t.dashed === 0, 'INFERRED tag trades the dashed edge for a tag on the title', JSON.stringify(t)); }
  await setMap({ inferred: 'dashed' }); await p.waitForTimeout(220);
  // the record
  const cs = FN.walk.flat().find(f => FN.walk.flat().filter(g => g.via === f.name).length > 2 && (f.ops || []).length) || FN.walk[0][0];
  await p.evaluate(n => window.selectIn('functions', n), cs.name); await p.waitForTimeout(300);
  { const r = await p.evaluate(() => { const b = document.querySelector('#portbody .ptrec'); if (!b) return null;
      return { name: (b.querySelector('.rchd b') || {}).textContent, head: document.getElementById('portt').textContent, rows: [...b.querySelectorAll('.rcrow')].map(x => x.dataset.row),
        tabs: [...b.querySelectorAll('.rctab')].map(t => ({ heads: [...t.querySelectorAll('.rcth > span')].map(s => s.firstChild ? s.firstChild.textContent.trim() : ''), rows: t.querySelectorAll('.fld').length })) }; });
    ok(r && r.name === cs.name && r.head === cs.name, 'clicking a function opens ITS record', JSON.stringify(r && r.name));
    ok(r && ['role', 'entity', 'level', 'file', 'size'].every(k => r.rows.includes(k)), 'rows: role · entity · level · file · size', JSON.stringify(r && r.rows));
    ok(r && r.tabs.length === 2 && r.tabs[0].heads.join() === 'tables,channel,model' && r.tabs[0].rows === cs.ops.length && r.tabs[1].heads.join() === 'calls,role,lines'
       && r.tabs[1].rows === FN.walk.flat().filter(g => g.via === cs.name).length, 'two tables with named columns — the tables it touches, the functions it calls', JSON.stringify(r && r.tabs)); }
  { const first = FN.walk.flat().find(g => g.via === cs.name).name;
    await p.evaluate(() => document.querySelector('#portbody .rctab .fld.fcall').click()); await p.waitForTimeout(280);
    ok(await p.$eval('#portt', e => e.textContent) === first, 'clicking a call walks the record on to that function', first); }
  await p.evaluate(n => window.selectIn('functions', n), FN.handler.name); await p.waitForTimeout(280);
  { const r = await p.evaluate(() => ({ rows: [...document.querySelectorAll('#portbody .rcrow')].map(x => x.dataset.row), behind: (document.querySelector('#portbody .rcrow[data-row="behind"] .v') || {}).textContent || '',
      doc: (document.querySelector('#portbody .rcrow[data-row="doc"] .v') || {}).textContent || '' }));
    ok(r.rows.includes('signature') && r.behind.includes(String(FN.behind.fns)) && (F.identity.doc ? r.doc.length > 0 : /none in the feed/.test(r.doc)),
       'the handler\'s record carries its signature, the code behind it, and — honestly — its docstring', JSON.stringify(r)); }
  { const cuts = await p.evaluate(() => { const out = [];
      for (const f of window.FNALL()) { window.selectIn('functions', f.name); const b = document.querySelector('#portbody .ptrec'); if (!b) { out.push(f.name + ' no record'); continue; }
        if (b.scrollWidth > b.clientWidth + 1) out.push(f.name + ' overflows ' + b.scrollWidth + '>' + b.clientWidth);
        b.querySelectorAll('.rctab .fld .fn, .rctab .fld .ft').forEach(n => {
          if (getComputedStyle(n).whiteSpace !== 'nowrap') { if (n.scrollWidth > n.clientWidth + 1) out.push(f.name + '.' + n.textContent + ' spills'); return; }
          const m = document.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; m.style.font = getComputedStyle(n).font; m.textContent = n.textContent;
          document.body.append(m); const w = m.getBoundingClientRect().width; m.remove(); if (w > n.getBoundingClientRect().width + 0.05) out.push(f.name + '.' + n.textContent); }); }
      return out; });
    ok(cuts.length === 0, 'across every function, no name is cut and nothing runs past the portrait', JSON.stringify(cuts.slice(0, 5))); }
  await p.evaluate(() => window.selectIn('functions', null)); await p.waitForTimeout(200);
  // the rail
  ok(await p.evaluate(() => window.COPYTXT.functions()) === 'functions · shown as blocks · roles accessor+caller+gate+pure · title counts functions icon, levels icon, commits icon · sort walk'
     + ' · block block (glyph on, chip on, name on, file both, count badge, where both) · lines icon name | commit / file | count role / via | — · sizes icon 13 name 13 file 12 via 12'
     + ' · footer icon count · drawn legend · hidden title note · map pieces tables, handler block, roles station, inferred dashed, looks shared',
     'the functions copy line names every setting, the function map among them', await p.evaluate(() => window.COPYTXT.functions()));
  { const g = await p.$$eval('#fncfg .cffold', els => els.map(e => ({ k: e.dataset.group, open: e.classList.contains('open'), body: getComputedStyle(e.querySelector('.cffoldbody')).display })));
    ok(g.length === 9 && g.filter(x => x.open).map(x => x.k).join() === 'map' && g.filter(x => !x.open).every(x => x.body === 'none'), 'the functions rail is nine folds, only THE FUNCTION MAP open', JSON.stringify(g)); }
  ok(await p.$$eval('#fncfg .cffold[data-group="map"] .ib', els => ['fn-map-pieces', 'fn-map-handler', 'fn-map-rolecol', 'fn-map-inferred', 'fn-map-looks'].every(a => els.some(e => e.hasAttribute('data-' + a)))),
     'the function map offers five choices: pieces · handler · role colour · inferred hop · looks');
  await p.click('#fncfg .ib[data-fn-map-looks="own"]'); await p.waitForTimeout(260);
  ok(await p.evaluate(() => !!window.FNCFG.look && !!document.querySelector('#fncfg .ib[data-fn-lk-enc]')), 'LOOKS own gives Functions its own copy of the look, and its own dials');
  await p.evaluate(() => { window.FNCFG.map.looks = 'shared'; window.FNCFG.look = null; window.applyData(); window.showVariant('functions', 'blocks'); window.drawFnCfg(); }); await p.waitForTimeout(220);
  await p.evaluate(() => window.moveFnPart('via', 0, 'r', 0)); await p.waitForTimeout(260);
  ok(await p.$$eval('#panel .blk:first-child .bkln', els => els.length) === 2, 'a title part drags to another line — WHERE moves up and the empty third line goes');
  await p.evaluate(() => { window.FNCFG.bk.rows = [{ l: ['icon', 'name'], r: ['commit'] }, { l: ['file'], r: ['count', 'role'] }, { l: ['via'], r: [] }]; window.FNCFG.bk.sel = 'icon'; window.drawFnCfg(); window.showTab('data'); });
  await p.waitForTimeout(260); }

// the tests below were written against the station chip's look with every dial in reach — give them that baseline
await p.evaluate(() => { Object.assign(window.DATACFG, { countPills: 'one', pillInk: 'white', pillBg: 'accent', pillAlpha: 100, sqEnc: 'colour', sqSize: 11, sqGap: 2, sqBase: 100, sqOptA: 45, sqUqMark: 'none' });
  Object.assign(window.DATACFG.bk, { count: 'words', model: 'word',
    rows: [{ l: ['icon', 'rw', 'name', 'ent', 'count', 'model'], r: [] }, { l: [], r: [] }, { l: [], r: [] }] });
  window.DATACFG.show.title = 1; window.applyData(); window.showTab('data'); window.foldAll(true); window.drawDataCfg(); });
await p.waitForTimeout(320);

// ══ THE DATA PANEL's own block (operator 2026-09-12): show or hide each section, and lay the grounds
//    out. Hiding must be REVERSIBLE and must not delete anything — the no-loss law as a measurement. ══
{ await p.click('#railtabs .rtb[data-rt="controls"]'); await p.waitForTimeout(80);
  await p.evaluate(() => window.showVariant('data', 'grounds')); await p.waitForTimeout(200);
  const lay = await p.$$eval('#datacfg .ib[data-dlayout]', els => els.map(e => e.dataset.dlayout));
  ok(lay.join(',') === 'grounds,flow,ledger,fields,blocks,stages,stageblocks', 'the data block carries all seven distributions', lay.join(','));
  const secs = await p.$$eval('#datacfg .ib[data-sec]', els => els.map(e => e.dataset.sec));
  ok(secs.join(',') === 'title,note,counts,shapes,rw,commit,ev,mdl,ents,legend', 'ten sections, each its own toggle', secs.join(','));
  ok(await p.$$eval('#datacfg .ib', els => els.every(e => !e.innerText.trim() && (!!e.querySelector('svg') || !!e.querySelector('.chsw')))),
     'every data control is DRAWN — an icon or the colour it filters by, never a word');
  // a section the OPEN distribution does not draw is marked, not silently inert
  ok(await p.$eval('#datacfg .ib[data-sec="ents"]', e => e.classList.contains('na')),
     'the entities row is marked NOT DRAWN while Grounds is open — it belongs to Flow');
  ok(await p.$eval('#datacfg .ib[data-sec="ev"]', e => !e.classList.contains('na')),
     'and the evidence row is not marked, because Grounds does draw it');
  // HIDE → the element is invisible but still in the page; SHOW → it comes back
  for (const [sec, sel] of [['note', '#panel .phdnote'], ['commit', '#panel .commit'], ['ev', '#panel .kv.ev'],
                            ['mdl', '#panel .kv.mdl'], ['legend', '#panel .plgd'], ['shapes', '#panel .shape']]) {
    // start from SHOWN — the operator's default hides the note, and this proves the round trip either way
    if (!await p.evaluate(k => !!window.DATACFG.show[k], sec)) { await p.click(`#datacfg .ib[data-sec="${sec}"]`); await p.waitForTimeout(140); }
    const before = await p.$$eval(sel, els => els.length);
    await p.click(`#datacfg .ib[data-sec="${sec}"]`); await p.waitForTimeout(110);
    const hid = await p.evaluate(s => { const e = document.querySelector(s); return e ? { n: document.querySelectorAll(s).length, d: getComputedStyle(e).display } : null; }, sel);
    ok(before > 0 && hid && hid.d === 'none' && hid.n === before,
       `hiding ${sec} makes it invisible and keeps it in the page — nothing is lost`, JSON.stringify({ before, hid }));
    await p.click(`#datacfg .ib[data-sec="${sec}"]`); await p.waitForTimeout(110);
    ok(await p.evaluate(s => getComputedStyle(document.querySelector(s)).display !== 'none', sel), `and one click brings ${sec} back`); }
  // the copy line names what is drawn and what is away
  await p.click('#datacfg .ib[data-sec="legend"]'); await p.waitForTimeout(90);
  ok(/hidden [a-z ]*legend/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line says which section was put away',
     await p.evaluate(() => window.COPYTXT.data()));
  await p.click('#datacfg .ib[data-sec="legend"]'); await p.waitForTimeout(90);
  // THE GROUNDS' LAYOUT — order · width · tiles, each read off the drawn picture
  const groundNames = () => p.$$eval('#panel .ground .ghd', els => els.map(e => e.textContent.replace(/\d+$/, '').trim()));
  const bySize = await groundNames();
  await p.click('#datacfg .ib[data-order="name"]'); await p.waitForTimeout(220);
  const byName = await groundNames();
  ok(byName.join(',') === byName.slice().sort((a, b) => a.localeCompare(b)).join(','), 'BY NAME orders the grounds alphabetically', byName.join(','));
  await p.click('#datacfg .ib[data-order="home"]'); await p.waitForTimeout(220);
  const byHome = await groundNames();
  ok(byHome[0] === F.identity.entity, "HOME FIRST puts the door's own entity in front", byHome.join(','));
  await p.click('#datacfg .ib[data-order="size"]'); await p.waitForTimeout(220);
  ok((await groundNames()).join(',') === bySize.join(','), 'and BY SIZE comes back to what it was');
  await p.click('#datacfg .ib[data-width="equal"]'); await p.waitForTimeout(160);
  { const ws = await p.$$eval('#panel .ground', els => els.map(e => Math.round(e.getBoundingClientRect().width)));
    ok(new Set(ws).size === 1, 'EQUAL gives every ground the same width, whatever it holds', ws.join(',')); }
  await p.click('#datacfg .ib[data-width="flex"]'); await p.waitForTimeout(160);
  { const ws = await p.$$eval('#panel .ground', els => els.map(e => Math.round(e.getBoundingClientRect().width)));
    ok(new Set(ws).size > 1, 'PROPORTIONAL gives the heaviest ground the most room', ws.join(',')); }
  await p.click('#datacfg .ib[data-tiles="grid"]'); await p.waitForTimeout(160);
  ok(await p.$eval('#panel .tiles', e => getComputedStyle(e).display === 'grid'), 'GRID wraps the tables side by side');
  await p.click('#datacfg .ib[data-tiles="stack"]'); await p.waitForTimeout(160);
  ok(await p.$eval('#panel .tiles', e => getComputedStyle(e).display !== 'grid'), 'and STACKED puts them back one under the next');
  // ── FIELDS: the columns themselves, named — and the channel filter counted on the drawn picture ──
  await p.click('#datacfg .ib[data-dlayout="fields"]'); await p.waitForTimeout(260);
  const allF = await p.$$eval('#panel .fld:not(.more) .fn', els => els.map(e => e.textContent));
  const feedCols = F.data.tables.reduce((n, t) => n + t.cols.length, 0);
  ok(allF.length === feedCols, 'FIELDS draws every column the feed knows, by name', allF.length + ' vs ' + feedCols);
  ok(allF.indexOf('policy_version') >= 0 && allF.indexOf('accepted_at') >= 0,
     'and they are the real column names, not a stack of lines', allF.slice(0, 4).join(','));
  ok(await p.$$eval('#panel .fld .ft', els => els.length > 0 && els.every(e => e.textContent.trim().length > 0)),
     'every field carries its type beside it');
  { const fk = await p.evaluate(() => { const f = document.querySelector('.fld.fk'), pl = document.querySelector('.fld:not(.fk):not(.uq)');
      return { n: document.querySelectorAll('.fld.fk').length, mark: getComputedStyle(f).boxShadow,
               fkCol: getComputedStyle(f.querySelector('.fn')).color, plainCol: getComputedStyle(pl.querySelector('.fn')).color }; });
    ok(fk.n > 0 && fk.mark !== 'none', 'a foreign key carries a SHAPE mark, not only a tint', JSON.stringify(fk));
    ok(fk.fkCol === fk.plainCol, 'and its name reads at full ink — a marked field is never dimmer than a plain one', JSON.stringify(fk)); }
  ok(await p.$$eval('#panel .fld.uq .fn', els => els.length > 0 && els.every(e => /dashed/.test(getComputedStyle(e).borderBottom))),
     'a unique column is latched with a dashed underline');
  ok(await p.$eval('#panel .shape', e => !!e).catch(() => false) === false, 'the line stacks are gone here — the names replaced them');
  ok(await p.$$eval('#datacfg .ib[data-chan]', els => els.length === 3), 'the rail mirrors the three switches in the panel head');
  ok(/tables all/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names the channel', await p.evaluate(() => window.COPYTXT.data()));
  // the shapes dial has nothing to hide here, and says so instead of pretending
  ok(await p.$eval('#datacfg .ib[data-sec="shapes"]', e => e.classList.contains('na')),
     'the shapes toggle is marked NOT DRAWN in Fields — the names took their place');
  await p.click('#datacfg .ib[data-dlayout="grounds"]'); await p.waitForTimeout(220);

  // ══ THE GLYPH'S COLOUR IS A SETTING (operator 2026-09-12): one kind of thing must not look like six ══
  { await p.evaluate(() => window.showVariant('data', 'blocks')); await p.waitForTimeout(280);
    const one = await p.$$eval('#panel .blk .bki svg', els => new Set(els.map(e => e.getAttribute('stroke') || getComputedStyle(e).stroke)).size);
    ok(one === 1, 'every table glyph is ONE colour by default — the table is one kind of thing', String(one));
    await p.click('#datacfg .ib[data-bkicon-col="entity"]'); await p.waitForTimeout(280);
    const many = await p.$$eval('#panel .blk .bki svg', els => new Set(els.map(e => e.getAttribute('stroke') || getComputedStyle(e).stroke)).size);
    ok(many > 1, 'and it CAN take the entity instead, when that is what you want to read', String(many));
    await p.click('#datacfg .ib[data-bkicon-col="model"]'); await p.waitForTimeout(280); }
  // ══ THE TITLE'S PARTS: order, line and size — the head bar's registry applied to a table ══
  { const zones = await p.$$eval('#datacfg .zones.lines .dzone', els => els.map(e => e.dataset.line + e.dataset.side));
    ok(zones.join(',') === '0l,0r,1l,1r,2l,2r', 'three lines, each with a LEFT and a RIGHT column', zones.join(','));
    const chips = await p.$$eval('#datacfg .dzone[data-line="0"][data-side="l"] .ib', els => els.map(e => e.dataset.bkpart));
    ok(chips.join(',') === 'icon,rw,name,ent,count,model', 'every part of the title is a draggable chip', chips.join(','));
    ok(await p.$$eval('#datacfg .dzone .ib', els => els.every(e => e.getAttribute('draggable') === 'true')), 'and every one of them drags');
    ok(await p.$$eval('#panel .blk:first-child .bkln', els => els.length) === 1, 'the title starts on ONE line');
    // move two parts onto line 2 — the block stacks
    await p.evaluate(() => { window.moveBkPart('count', 1, 'l', 0); window.moveBkPart('model', 1, 'l', 1); }); await p.waitForTimeout(300);
    const lines = await p.$$eval('#panel .blk:first-child .bkln', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    ok(lines.length === 2, 'moving parts to line 2 stacks the title', JSON.stringify(lines));
    ok(/fields/.test(lines[1]), 'and the moved parts are the ones on the new line', lines[1]);
    ok(await p.$$eval('#datacfg .dzone[data-line="1"][data-side="l"] .ib', els => els.map(e => e.dataset.bkpart).join(',')) === 'count,model',
       'the rail shows them on that line too');
    // reorder within a column
    await p.evaluate(() => window.moveBkPart('model', 1, 'l', 0)); await p.waitForTimeout(280);
    ok(await p.evaluate(() => window.bkRows()[1].l.join(',')) === 'model,count', 'a part can be reordered inside its column',
       await p.evaluate(() => window.bkRows()[1].l.join(',')));
    // the RIGHT column pushes its parts right (operator 2026-09-12)
    await p.evaluate(() => window.moveBkPart('count', 1, 'r', 0)); await p.waitForTimeout(300);
    ok(await p.evaluate(() => window.bkRows()[1].r.join(',')) === 'count', 'a part can be moved into the RIGHT column');
    ok(await p.evaluate(() => { const b = document.querySelector('#panel .blk'), ln = b.querySelectorAll('.bkln')[1];
        const L = ln.querySelector('.bkcol.l').getBoundingClientRect(), R = ln.querySelector('.bkcol.r').getBoundingClientRect();
        return R.right <= Math.round(ln.getBoundingClientRect().right) + 1 && R.left > L.left; }),
      'and it is pushed to the right edge of its line');
    await p.evaluate(() => window.moveBkPart('count', 1, 'l', 1)); await p.waitForTimeout(260);
    // SIZE per part, with the 12px floor held on text
    await p.click('#datacfg .dzone[data-line="0"] .ib[data-bkpart="name"]'); await p.waitForTimeout(200);
    await p.evaluate(() => { window.DATACFG.bk.size.name = 22; window.showTab('data'); }); await p.waitForTimeout(280);
    ok(await p.$eval('#panel .blk b', e => Math.round(parseFloat(getComputedStyle(e).fontSize)) === 22), 'a part takes the size its bar sets',
       await p.$eval('#panel .blk b', e => getComputedStyle(e).fontSize));
    await p.evaluate(() => { window.DATACFG.bk.size.name = 13; window.moveBkPart('count', 0, 'l', 4); window.moveBkPart('model', 0, 'l', 5); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => window.bkRows()[0].l.join(',')) === 'icon,rw,name,ent,count,model', 'and everything goes back to one line');
    // ── BLOCKS MUST NEVER OVERLAP (operator 2026-09-12) — a wrapping title line made the grid row
    //    shorter than the block it held, and the blocks below rode up into it. Measured at three widths. ──
    for (const w of [820, 1100, 1500]) {
      await p.evaluate(x => { document.getElementById('bench').style.setProperty('--bw', x + 'px'); }, w);
      await p.waitForTimeout(220);
      const over = await p.evaluate(() => { const bs = [...document.querySelectorAll('#panel .blk')].map(e => { const r = e.getBoundingClientRect();
          return { t: e.dataset.table, x: r.left, y: r.top, w: r.width, h: r.height }; });
        const hits = [];
        for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], c = bs[j];
          if (a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1) hits.push(a.t + ' × ' + c.t); }
        return { hits, n: bs.length, first: bs.slice(0, 4).map(x => x.t.slice(0, 10) + '@' + Math.round(x.x) + ',' + Math.round(x.y) + '+' + Math.round(x.h)),
                 form: document.querySelector('#panel .bkbody').className, disp: getComputedStyle(document.querySelector('#panel .bkbody')).display }; });
      ok(over.hits.length === 0, `no two blocks overlap at ${w}px`, over.hits.slice(0, 2).join(' | ') + ' :: ' + over.form + '/' + over.disp + ' :: ' + over.first.join(' ')); }
    await p.evaluate(() => { document.getElementById('bench').style.setProperty('--bw', '1100px'); }); await p.waitForTimeout(200);
    // nothing in a title may run past its block — a nowrap name needs somewhere to stop
    ok(await p.$$eval('#panel .blk', els => els.every(b => {
      const r = b.getBoundingClientRect();
      return [...b.querySelectorAll('.bkln b, .bkln .bkm, .bkln .bke, .bkln .bkn')].every(e => e.getBoundingClientRect().right <= r.right + 1); })),
      'no part of a title runs past the block that holds it'); }

  // ══ THE CHANNELS ARE APPENDABLE (operator 2026-09-12): three independent switches in the panel's own
  //    title row. All three on IS every table, so the old fourth button is gone. ══
  const TB = F.data.tables, part = { w: TB.filter(t => t.rw === 'w').length, r: TB.filter(t => t.rw === 'r').length, rw: TB.filter(t => t.rw === 'rw').length };
  ok(part.w + part.r + part.rw === TB.length, 'the three channels partition the tables exactly once', JSON.stringify(part));
  { const bar = await p.$$eval('#panel .sechd .chbar .chb', els => els.map(e => ({ k: e.dataset.chan, n: +e.querySelector('.chn').textContent, on: e.dataset.on === '1', zero: e.classList.contains('zero') })));
    ok(bar.length === 3 && bar.map(b => b.k).join(',') === 'w,r,rw', 'THREE switches in the panel title row — no "every table" button', JSON.stringify(bar.map(b => b.k)));
    ok(bar.every(b => b.on), 'all three start on, which IS every table');
    ok(await p.$eval('#panel .sechd .chbar', e => { const r = e.getBoundingClientRect(), s = e.closest('.sechd').getBoundingClientRect();
        return r.right <= s.right + 1 && r.left > s.left + s.width / 2; }), 'on the RIGHT of that row');
    ok(bar[0].n === part.w && bar[1].n === part.r && bar[2].n === part.rw,
       'every switch carries its count', JSON.stringify(bar.map(b => b.k + '=' + b.n)));
    ok(bar[0].zero === (part.w === 0), 'a channel that holds nothing is drawn HOLLOW — a measured zero is a result', JSON.stringify(bar[0])); }
  // ══ THE TITLE COUNTS WHAT IS SHOWN (operator 2026-09-12): tables AND fields, both moving with the
  //    channel switches, each a word or a glyph. ══
  { const allCols = TB.reduce((n, t) => n + t.cols.length, 0);
    const readCnt = () => p.$eval('#panel .sechd .dcnts', e => e.innerText.replace(/\s+/g, ' ').replace(/\s*·\s*/g, ' · ').trim().toLowerCase());
    // the operator's default draws them as GLYPHS — the numbers alone
    const opsN = TB.filter(t => t.rw !== 'w').length + TB.filter(t => t.rw !== 'r').length;
    ok(await readCnt() === TB.length + ' · ' + allCols + ' · ' + opsN, 'the counts open as glyphs and numbers', await readCnt());
    await p.click('#datacfg .ib[data-cnttables="word"]'); await p.click('#datacfg .ib[data-cntfields="word"]');
    await p.click('#datacfg .ib[data-cntops="off"]'); await p.waitForTimeout(320);
    const cnt = await readCnt();
    ok(cnt === TB.length + ' tables · ' + allCols + ' fields', 'the title counts tables AND fields', cnt);
    await p.hover('#panel .sechd .dcn[data-count="tables"]'); await p.waitForTimeout(200);
    ok(/tables this door reads or writes/i.test(await p.evaluate(() => document.getElementById('hover').innerText)),
       'and a count in the shared pill carries its OWN card');
    // the counts MOVE with the channel — they count what is shown, not what exists
    await p.click('#panel .chbar .chb[data-chan="rw"]'); await p.waitForTimeout(300);
    const keep = TB.filter(t => t.rw !== 'rw');
    ok(await readCnt() === keep.length + ' tables · ' + keep.reduce((n, t) => n + t.cols.length, 0) + ' fields',
       'and both move when a channel is switched off', await readCnt());
    await p.click('#panel .chbar .chb[data-chan="rw"]'); await p.waitForTimeout(300);
    // a count can be a GLYPH instead of a word
    await p.click('#datacfg .ib[data-cnttables="icon"]'); await p.waitForTimeout(280);
    ok(await p.$eval('#panel .sechd .cnt [data-count="tables"]', (e, n) => !!e.querySelector('svg') && e.innerText.trim() === String(n), TB.length),
       'a count can be a GLYPH and a number instead of a word');
    await p.click('#datacfg .ib[data-cntfields="off"]'); await p.waitForTimeout(280);
    ok(await p.$$eval('#panel .sechd .cnt [data-count]', els => els.length === 1), 'and a count can go entirely');
    await p.click('#datacfg .ib[data-cntops="word"]'); await p.waitForTimeout(280);
    const rd = TB.filter(t => t.rw !== 'w').length, wr = TB.filter(t => t.rw !== 'r').length;
    ok(await p.$eval('#panel .sechd .cnt [data-count="ops"]', e => e.innerText.trim().toLowerCase()) === (rd + wr) + ' ops',
       'ops can come back as its own count', await p.$eval('#panel .sechd .cnt [data-count="ops"]', e => e.innerText));
    // ── one pill or a pill EACH, and a colour of its own (operator 2026-09-12) ──
    await p.click('#datacfg .ib[data-cnttables="icon"]'); await p.click('#datacfg .ib[data-cntfields="icon"]');
    await p.click('#datacfg .ib[data-cntops="icon"]'); await p.waitForTimeout(320);
    ok(await p.$$eval('#panel .sechd .dcnts .dcp', els => els.length === 1), 'the counts share ONE pill by default');
    await p.click('#datacfg .ib[data-count-pills="each"]'); await p.waitForTimeout(300);
    ok(await p.$$eval('#panel .sechd .dcnts .dcp', els => els.length === 3), 'and can split into a pill EACH');
    await p.click('#datacfg .ib[data-pill-ink="kind"]'); await p.waitForTimeout(260);
    ok(await p.$$eval('#panel .sechd .dcnts .dcn', els => new Set(els.map(e => getComputedStyle(e).color)).size === 3),
       'BY WHAT IT COUNTS gives each count the colour of the thing it counts');
    await p.click('#datacfg .ib[data-pill-bg="kind"]'); await p.waitForTimeout(260);
    ok(await p.$$eval('#panel .sechd .dcnts .dcp', els => new Set(els.map(e => getComputedStyle(e).backgroundColor)).size === 3),
       'and each pill its ground');
    await p.click('#datacfg .ib[data-pill-ink="white"]'); await p.click('#datacfg .ib[data-pill-bg="accent"]');
    await p.click('#datacfg .ib[data-count-pills="one"]'); await p.waitForTimeout(320);

    // ══ THE PILL'S COLOUR IS THREE DIALS (operator 2026-09-13): text · ground · ground opacity — and the
    //    contrast is MEASURED, because the complaint was "barely visible or too contrasting" ══
    const pillStyle = () => p.$eval('#panel .sechd .dcp', e => { const c = getComputedStyle(e); return { fg: c.color, bg: c.backgroundColor }; });
    const base = await pillStyle();
    await p.click('#datacfg .ib[data-pill-ink="ink"]'); await p.waitForTimeout(220);
    const inked = await pillStyle();
    ok(inked.fg !== base.fg && inked.bg === base.bg, 'the TEXT dial moves the text and leaves the ground', JSON.stringify({ base, inked }));
    await p.click('#datacfg .ib[data-pill-bg="chip"]'); await p.waitForTimeout(220);
    const grounded = await pillStyle();
    ok(grounded.bg !== inked.bg && grounded.fg === inked.fg, 'the GROUND dial moves the ground and leaves the text', JSON.stringify({ inked, grounded }));
    // opacity is a dragged bar that re-paints WITHOUT rebuilding the rail — the drag must survive
    await p.click('#datacfg .ib[data-pill-bg="accent"]'); await p.click('#datacfg .ib[data-pill-ink="white"]'); await p.waitForTimeout(260);
    const alphaOf = () => p.evaluate(() => { const c = window.CONTRAST.parse(getComputedStyle(document.querySelector('#panel .sechd .dcp')).backgroundColor); return c ? Math.round(c.a * 100) : null; });
    ok(await alphaOf() === 100, 'the ground starts solid', String(await alphaOf()));
    await p.evaluate(() => { const t = [...document.querySelectorAll('#datacfg .sldt')].find(x => x.getAttribute('aria-label') === 'pill ground opacity'); t.__mark = 1; });
    await p.focus('#datacfg .sldt[aria-label="pill ground opacity"]');
    for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowLeft');
    await p.waitForTimeout(260);
    ok(await alphaOf() === 50, 'ten steps down the bar leave the ground at half opacity', String(await alphaOf()));
    ok(await p.evaluate(() => { const t = [...document.querySelectorAll('#datacfg .sldt')].find(x => x.getAttribute('aria-label') === 'pill ground opacity'); return !!(t && t.__mark); }),
       'and the bar being dragged is the SAME element — the rail did not rebuild under the hand');
    // the METER: independently recomputed, and it catches exactly the combination the operator saw
    const meter = async () => { await p.waitForTimeout(120);
      await p.waitForFunction(() => +document.getElementById('pillread').dataset.ratio === window.pillContrast().min, { timeout: 4000 }).catch(() => {});
      return p.evaluate(() => ({ read: +document.getElementById('pillread').dataset.ratio, pc: window.pillContrast() })); };
    { const m = await meter();
      // INDEPENDENT: back to a solid ground, read the two raw computed colours, and do WCAG here in node — none of the
      // page's own contrast functions are used (review F10: the old check called the very code it claimed to check)
      await p.focus('#datacfg .sldt[aria-label="pill ground opacity"]');
      for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
      const m2 = await meter();
      const raw = await p.evaluate(() => ({ fg: getComputedStyle(document.querySelector('#panel .sechd .dcn')).color,
                                            bg: getComputedStyle(document.querySelector('#panel .sechd .dcp')).backgroundColor }));
      // both formats Chrome returns: rgb(0-255) and color(srgb 0-1) — the latter is what color-mix computes to
      const rgb = str => { const n = (str.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
        return /^color\(srgb/.test(str) ? n.map(v => v * 255) : n; };
      const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
      const a = L(rgb(raw.fg)), bb = L(rgb(raw.bg)), wcag = (Math.max(a, bb) + 0.05) / (Math.min(a, bb) + 0.05);
      ok(/^(rgb|color)\(/.test(raw.bg) && Math.abs(wcag - m2.pc.min) < 0.02 && m2.read === m2.pc.min,
         'the readout equals WCAG computed in node from the raw colours — no page code involved', JSON.stringify({ raw, wcag: +wcag.toFixed(3), read: m2.read }));
      for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowLeft');
      await p.waitForTimeout(200); }
    await p.focus('#datacfg .sldt[aria-label="pill ground opacity"]');
    for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(160);
    // F2 — printed at the precision it was judged at, so a failing ratio never prints as the threshold
    ok(/contrast \d+\.\d\d:1/.test(await p.$eval('#pillread', e => e.textContent)), 'the readout prints two decimals — the precision it judges at',
       await p.$eval('#pillread', e => e.textContent));
    await p.click('#datacfg .ib[data-pill-ink="accent"]'); await p.waitForTimeout(300);
    { const m = await meter();
      ok(m.read < 1.5 && await p.$eval('#pillread', e => e.classList.contains('bad')),
         'accent text on the accent ground reads as BARELY VISIBLE — the meter flags what the operator saw', JSON.stringify(m.pc)); }
    await p.click('#datacfg .ib[data-pill-ink="white"]'); await p.waitForTimeout(300);
    { const m = await meter(); ok(m.read > 1.5, 'and clears when the text changes', String(m.read)); }
    await p.click('#datacfg .ib[data-pill-bg="none"]'); await p.waitForTimeout(260);
    ok(await alphaOf() === 0, 'a ground of NONE is clear', String(await alphaOf()));
    // F1 — the colour and the words come from ONE decision: a loud readout never says plainly "reads"
    await p.click('#datacfg .ib[data-pill-bg="kind"]'); await p.waitForTimeout(260);
    await p.focus('#datacfg .sldt[aria-label="pill ground opacity"]');
    for (let i = 0; i < 15; i++) await p.keyboard.press('ArrowLeft');
    await p.waitForTimeout(260);
    { const r = await p.evaluate(() => { const e = document.getElementById('pillread'), c = window.pillContrast();
        return { cls: e.className, band: e.dataset.band, text: e.textContent, min: c.min, max: c.max }; });
      ok(r.max > 12 && r.cls.indexOf('loud') >= 0 && /glare/.test(r.text),
         'white on a 25% kind ground is LOUD, and its words say so — the colour and the words agree', JSON.stringify(r)); }
    for (let i = 0; i < 15; i++) await p.keyboard.press('ArrowRight');
    await p.click('#datacfg .ib[data-pill-bg="accent"]'); await p.waitForTimeout(300);
    // F4 — "outline" (the chip ground) matches the row, so the pill must keep a visible EDGE
    await p.click('#datacfg .ib[data-pill-bg="chip"]'); await p.waitForTimeout(260);
    { const e = await p.evaluate(() => { const d = document.querySelector('#panel .sechd .dcp'), c = getComputedStyle(d);
        return { border: c.borderTopColor, row: getComputedStyle(document.getElementById('panel')).backgroundColor, fill: c.backgroundColor }; });
      ok(e.border !== e.row && e.border !== e.fill, 'the OUTLINE ground keeps an edge the row does not share', JSON.stringify(e)); }
    await p.click('#datacfg .ib[data-pill-bg="accent"]'); await p.waitForTimeout(260);
    // F3 + F7 — nothing on screen, nothing measured, and the readout says WHY
    await p.click('#datacfg .ib[data-sec="counts"]'); await p.waitForTimeout(300);
    ok(await p.$eval('#pillread', e => /hidden/.test(e.textContent) && !e.dataset.ratio), 'with the counts hidden the meter measures nothing and says they are hidden',
       await p.$eval('#pillread', e => e.textContent));
    await p.click('#datacfg .ib[data-sec="counts"]'); await p.waitForTimeout(300);
    ok(await p.$eval('#pillread', e => !!e.dataset.ratio), 'and measures again once they are back'); }
  // ── the TITLE itself can go (operator 2026-09-12) ──
  { ok(await p.$eval('#panel .phd .sechd', e => /data/i.test(e.innerText)), 'the part names itself in the title');
    await p.click('#datacfg .ib[data-sec="title"]'); await p.waitForTimeout(280);
    ok(await p.$eval('#panel .phd .sechd > span:not(.cnt):not(.dcnts)', e => getComputedStyle(e).display === 'none'),
       'switching the title off takes the name away');
    ok(await p.$eval('#panel .sechd .dcnts', e => getComputedStyle(e).display !== 'none'), 'and leaves the counts and the switches standing');
    await p.click('#datacfg .ib[data-sec="title"]'); await p.waitForTimeout(280); }
  // ANY COMBINATION is legal — switching one off leaves the others alone
  { await p.click('#panel .chbar .chb[data-chan="rw"]'); await p.waitForTimeout(280);
    const n1 = await p.$$eval('#panel .blk, #panel .fcard, #panel .ground .tile', els => els.length);
    ok(n1 === part.w + part.r, 'switching BOTH off leaves written-only + read-only', n1 + ' vs ' + (part.w + part.r));
    await p.click('#panel .chbar .chb[data-chan="r"]'); await p.waitForTimeout(280);
    ok(await p.$eval('#panel .pempty', e => /no table is/.test(e.innerText)), 'switching the rest off draws the measurement, not a blank');
    await p.click('#panel .chbar .chb[data-chan="rw"]'); await p.waitForTimeout(280);
    const n2 = await p.$$eval('#panel .blk, #panel .fcard, #panel .ground .tile', els => els.length);
    ok(n2 === part.rw, 'and switching one back on shows exactly that channel', n2 + ' vs ' + part.rw);
    await p.click('#panel .chbar .chb[data-chan="r"]'); await p.waitForTimeout(280);
    const n3 = await p.$$eval('#panel .blk, #panel .fcard, #panel .ground .tile', els => els.length);
    ok(n3 === part.rw + part.r, 'two switches on show BOTH channels, appended', n3 + ' vs ' + (part.rw + part.r));
    await p.click('#panel .chbar .chb[data-chan="w"]'); await p.waitForTimeout(280);
    await p.click('#panel .chbar .chb[data-chan="w"]'); await p.waitForTimeout(280); }

  // ══ BLOCKS: one row per table, each field a square coloured by the KIND of value it holds ══
  await p.evaluate(() => window.showVariant('data', 'blocks')); await p.waitForTimeout(300);
  { const rows = await p.$$eval('#panel .blk', els => els.length);
    ok(rows === TB.length, 'BLOCKS draws one row per table', String(rows));
    const sq = await p.$$eval('#panel .bkhd .sqs .sq', els => els.length);
    ok(sq === TB.reduce((n, t) => n + t.cols.length, 0), 'and one square per field', String(sq));
    const hd = await p.$eval('#panel .blk .bkhd', e => e.innerText.replace(/\s+/g, ' '));
    ok(/fields/.test(hd) && TB.some(t => hd.indexOf(t.entity) >= 0), 'the row names the table, its entity and how many fields', hd.slice(0, 70));
    const cols = await p.$$eval('#panel .bkhd .sq', els => els.map(e => ({ c: getComputedStyle(e).backgroundColor, k: (e.className.match(/t-(\w+)/) || [])[1] })));
    const byKind = {}; cols.forEach(c => { (byKind[c.k] = byKind[c.k] || new Set()).add(c.c); });
    ok(Object.keys(byKind).length >= 4, 'at least four kinds of field are distinguished', Object.keys(byKind).join(','));
    ok(Object.values(byKind).every(s => s.size === 1), 'a kind is ONE colour everywhere');
    ok(new Set(Object.values(byKind).map(s => [...s][0])).size === Object.keys(byKind).length, 'and no two kinds share one');
    ok(await p.$$eval('#panel .sq.opt', els => els.length > 0 && els.every(e => +getComputedStyle(e).opacity < 1)), 'an optional column is drawn paler');
    // ══ A KIND CAN BE DRAWN FOUR WAYS (operator 2026-09-13) ══
    { const kinds = await p.evaluate(() => [...new Set([...document.querySelectorAll('#panel .bkhd .sq')].map(e => (e.className.match(/t-(\w+)/) || [])[1]))]);
      ok(kinds.length >= 4, 'the panel draws at least four kinds of field', kinds.join(','));
      // CHARACTER — one letter per kind, and no two kinds share a letter
      await p.click('#datacfg .ib[data-sq-enc="char"]'); await p.waitForTimeout(300);
      const chars = await p.evaluate(() => { const m = {};
        document.querySelectorAll('#panel .bkhd .sq').forEach(e => { const k = (e.className.match(/t-(\w+)/) || [])[1]; (m[k] = m[k] || new Set()).add(e.textContent.trim()); });
        return Object.keys(m).map(k => k + '=' + [...m[k]].join('')); });
      ok(chars.every(x => x.split('=')[1].length === 1), 'CHARACTER gives every kind exactly one letter', chars.join(' '));
      ok(new Set(chars.map(x => x.split('=')[1])).size === chars.length, 'and no two kinds share it', chars.join(' '));
      // SHAPE — the form carries the kind, so the marks differ with colour taken away
      await p.click('#datacfg .ib[data-sq-enc="shape"]'); await p.click('#datacfg .ib[data-sq-pal="mono"]'); await p.waitForTimeout(320);
      const forms = await p.evaluate(() => { const m = {};
        document.querySelectorAll('#panel .bkhd .sq').forEach(e => { const k = (e.className.match(/t-(\w+)/) || [])[1], c = getComputedStyle(e);
          m[k] = [c.borderRadius, c.transform, c.clipPath, c.borderWidth, c.backgroundImage].join('|'); });
        return m; });
      ok(new Set(Object.values(forms)).size === Object.keys(forms).length,
         'SHAPE draws every kind differently even with no colour at all', JSON.stringify(Object.keys(forms)));
      ok(await p.$$eval('#panel .bkhd .sq', els => new Set(els.map(e => getComputedStyle(e).color)).size === 1),
         'with one colour for all of them — the kind survives without hue');
      // SYMBOL — the station's own glyph per kind
      await p.click('#datacfg .ib[data-sq-enc="symbol"]'); await p.waitForTimeout(300);
      ok(await p.$$eval('#panel .bkhd .sq', els => els.length > 0 && els.every(e => !!e.querySelector('svg'))), 'SYMBOL draws a glyph per field');
      ok(await p.evaluate(() => { const m = {};
        document.querySelectorAll('#panel .bkhd .sq svg').forEach(e => { const k = (e.parentElement.className.match(/t-(\w+)/) || [])[1];
          m[k] = e.innerHTML.replace(/\s+/g, ''); });
        return new Set(Object.values(m)).size === Object.keys(m).length; }), 'and no two kinds share one');
      // the LEGEND draws the mark as the panel draws it, whatever the encoding
      ok(await p.$$eval('#panel .bkfoot .ftp:not([data-part="opt"]) .fti .sq', els => els.length >= 4 && els.every(e => !!e.querySelector('svg'))),
         'the legend draws the MARK it names, in the encoding that is on');
      await p.click('#datacfg .ib[data-sq-enc="colour"]'); await p.click('#datacfg .ib[data-sq-pal="type"]'); await p.waitForTimeout(320);
      ok(await p.$$eval('#panel .bkfoot .ftp:not([data-part="opt"]) .fti .sq', els => els.every(e => !e.querySelector('svg'))), 'and follows it back to colour'); }
    await p.click('#datacfg .ib[data-sq-opt="0"]'); await p.waitForTimeout(160);
    ok(await p.$$eval('#panel .sq.opt', els => els.every(e => +getComputedStyle(e).opacity === 1)), 'and that mark can be switched off');
    await p.click('#datacfg .ib[data-sq-opt="1"]'); await p.waitForTimeout(160); }
  // ── the block TITLE, part by part (operator 2026-09-12) ──
  { await p.click('#datacfg .ib[data-bkform="block"]'); await p.waitForTimeout(240);
    ok(await p.$eval('#panel .bkbody', e => getComputedStyle(e).display === 'grid'), 'the form dial turns the rows into BLOCKS');
    await p.click('#datacfg .ib[data-bkform="row"]'); await p.waitForTimeout(240);
    ok(await p.$eval('#panel .bkbody', e => getComputedStyle(e).display !== 'grid'), 'and back to rows');
    await p.click('#datacfg .ib[data-bkent="icon"]'); await p.waitForTimeout(240);
    ok(await p.$eval('#panel .blk .bke', e => !!e.querySelector('svg') && !e.innerText.trim()), 'the entity can be its GLYPH instead of its word');
    await p.click('#datacfg .ib[data-bkcount="badge"]'); await p.waitForTimeout(240);
    ok(await p.$eval('#panel .blk .bkn', e => e.classList.contains('badge') && /^\d+$/.test(e.textContent.trim())), 'the field count can shrink to a BADGE',
       await p.$eval('#panel .blk .bkn', e => e.textContent));
    await p.click('#datacfg .ib[data-bkmodel="icon"]'); await p.waitForTimeout(240);
    ok(await p.$eval('#panel .blk .bkm', e => !!e.querySelector('svg') && !e.innerText.trim()), 'so can the class that maps to the table');
    await p.click('#datacfg .ib[data-bkname="0"]'); await p.waitForTimeout(240);
    ok(await p.$$eval('#panel .blk .bkhd b', els => els.length === 0), 'and the name itself can go');
    await p.click('#datacfg .ib[data-bkname="1"]'); await p.click('#datacfg .ib[data-bkent="word"]');
    await p.click('#datacfg .ib[data-bkcount="words"]'); await p.click('#datacfg .ib[data-bkmodel="word"]'); await p.waitForTimeout(280); }

  // ══ THE PORTRAIT PANEL — a SEPARATE region beside the bench, TALLER than it, holding what the middle
  //    panel selected, in four representations (operator 2026-09-12). ══
  { const geo = await p.evaluate(() => { const b = document.getElementById('bench').getBoundingClientRect(),
        t = document.getElementById('port').getBoundingClientRect(), pn = document.getElementById('panel').getBoundingClientRect();
      return { bx: Math.round(b.right), px: Math.round(t.left), pw: Math.round(t.width), ph: Math.round(t.height),
               bh: Math.round(b.height), panelH: Math.round(pn.height) }; });
    ok(geo.px >= geo.bx, 'the portrait panel is a SEPARATE box, to the RIGHT of the bench', JSON.stringify(geo));
    ok(geo.pw === await p.evaluate(() => window.FRAME.portW) && geo.ph === await p.evaluate(() => window.FRAME.portH),
       'at the width and height the frame sets', JSON.stringify(geo));
    ok(geo.ph > geo.panelH, 'and TALLER than the middle section it sits beside', geo.ph + ' vs ' + geo.panelH);
    ok(Math.abs(geo.pw - geo.ph) / geo.ph < 0.45, 'roughly square, so a thing can be DRAWN in it', JSON.stringify({ w: geo.pw, h: geo.ph })); }
  { const vs = await p.$$eval('#portvars .ptv', els => els.map(e => e.dataset.pvar));
    ok(vs.join(',') === 'record,shape,wheel,keys', 'four representations of the selected table', vs.join(','));
    ok(await p.$eval('#portbody .ptidle', e => /nothing selected/i.test(e.innerText)), 'and it says what a selection would put there'); }
  // click a table → it is drawn in the portrait panel, and the middle panel marks which one
  const first = await p.$eval('#panel .blk', e => e.dataset.table);
  await p.click('#panel .blk .bkhd'); await p.waitForTimeout(280);
  ok(await p.$eval('#portbody', (e, f) => e.innerText.toLowerCase().indexOf(f.toLowerCase()) >= 0, first),
     'clicking a table draws THAT table in the portrait panel', first);
  ok(await p.$eval('#panel .blk', e => e.classList.contains('sel')), 'and the middle panel marks which one is selected');
  { const t = F.data.tables.filter(x => x.table === first)[0];
    const low = (await p.$eval('#portbody', e => e.innerText)).toLowerCase();
    ok(low.indexOf(t.model.toLowerCase()) >= 0 && low.indexOf(t.entity.toLowerCase()) >= 0 && low.indexOf(t.file.toLowerCase()) >= 0,
       'RECORD carries the entity, the class and the file', [t.model, t.entity, t.file].join(' · '));
    ok(await p.$$eval('#portbody .flds .fld', els => els.length) === t.cols.length, 'and every field of that table');
    // SHAPE — the drum plus one cell per field
    await p.click('#portvars .ptv[data-pvar="shape"]'); await p.waitForTimeout(240);
    ok(await p.$$eval('#portbody .shgrid .shcell', els => els.length) === t.cols.length, 'SHAPE draws one cell per field');
    ok(await p.$eval('#portbody .shdrum svg', e => !!e), 'under the drum the graph itself uses');
    // WHEEL — one segment per field, and the mix legible
    await p.click('#portvars .ptv[data-pvar="wheel"]'); await p.waitForTimeout(240);
    ok(await p.$$eval('#portbody .wsvg .wseg', els => els.length) === t.cols.length, 'WHEEL lays one segment per field in a ring');
    ok(await p.$eval('#portbody .wwrap', e => { const r = e.getBoundingClientRect(); return Math.abs(r.width - r.height) < 2 && r.width > 100; }),
       'in a square that uses the room');
    ok(await p.$$eval('#portbody .wlgd .lg', els => els.length >= 3), 'with the mix named beside it');
    // KEYS — outbound from the feed, inbound derived, both stated
    await p.click('#portvars .ptv[data-pvar="keys"]'); await p.waitForTimeout(240);
    const secs = await p.$$eval('#portbody .ptsec', els => els.map(e => e.textContent));
    ok(secs.join(',') === 'points at,pointed at by,unique', 'KEYS shows out, in and unique', secs.join(','));
    ok(await p.$$eval('#portbody .krow.out', els => els.length) === (t.fks || []).length, 'the outbound keys are the feed\'s own');
    ok(await p.$eval('#portbody', e => /not in the feed|points at nothing|nothing is latched/i.test(e.innerText)),
       'and a floor is named out loud where the feed stops');
    await p.click('#portvars .ptv[data-pvar="record"]'); await p.waitForTimeout(200); }
  // the selection survives a distribution change; a part with no portrait says so
  await p.evaluate(() => window.showVariant('data', 'grounds')); await p.waitForTimeout(240);
  ok(await p.$eval('#portbody', (e, f) => e.innerText.toLowerCase().indexOf(f.toLowerCase()) >= 0, first),
     'the selection survives a change of distribution');
  await p.evaluate(() => window.showVariant('data', 'blocks')); await p.waitForTimeout(240);
  await p.evaluate(() => window.showTab('tests')); await p.waitForTimeout(260);
  ok(await p.$eval('#portbody .ptidle', e => /draws no portrait/i.test(e.innerText)), 'a part with no portrait of its own says so');
  ok(await p.$$eval('#portvars .ptv', els => els.length === 0), 'and offers no representations it cannot draw');
  await p.evaluate(() => window.showTab('data')); await p.waitForTimeout(260);
  // width 0 takes the whole panel away
  await p.evaluate(() => { window.FRAME.portW = 0; window.applyFrame(); }); await p.waitForTimeout(200);
  ok(await p.$eval('#port', e => e.hidden), 'a width of 0 takes the portrait panel away');
  await p.evaluate(() => { window.FRAME.portW = 440; window.applyFrame(); window.showTab('data'); }); await p.waitForTimeout(280);
  // THE TABLE GLYPH IS THE GRAPH'S OWN MODEL GLYPH — the DB drum, not the grid on the DATA button
  { const g = await p.evaluate(() => { const a = document.querySelector('#panel .blk .bki svg'),
        b = document.querySelector('#tabs .tab[data-tab="data"] .tabi svg');
      return { title: a ? a.innerHTML.replace(/\s+/g, '') : null, button: b ? b.innerHTML.replace(/\s+/g, '') : null }; });
    ok(g.title && /ellipse/.test(g.title), "a table wears the graph's own model glyph — the DB drum", (g.title || '').slice(0, 60));
    ok(g.title !== g.button, 'and NOT the grid that belongs to the Data part button'); }
}

// ── THE RAIL SCROLLS ON ITS OWN (operator 2026-09-12): the page scrolled and the controls left the
//    screen. The page no longer scrolls vertically at all — each region carries its own scrollbar. ──
{ const geo = await p.evaluate(() => ({ doc: document.documentElement.scrollHeight, win: window.innerHeight,
    railH: Math.round(document.getElementById('notes').getBoundingClientRect().height),
    railScroll: document.getElementById('notes').scrollHeight,
    railClient: document.getElementById('notes').clientHeight,
    ovy: getComputedStyle(document.getElementById('notes')).overflowY }));
  ok(geo.doc <= geo.win + 2, 'the page itself does not scroll vertically', JSON.stringify(geo));
  ok(geo.railH <= geo.win, 'the rail never grows taller than the window', JSON.stringify(geo));
  ok(geo.railScroll > geo.railClient + 4 && /auto|scroll/.test(geo.ovy), 'and carries its own scrollbar', JSON.stringify(geo));
  // scrolling the rail moves the rail, and nothing else
  const benchTop = await p.$eval('#bench', e => Math.round(e.getBoundingClientRect().top));
  await p.evaluate(() => { document.getElementById('notes').scrollTop = 400; }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.getElementById('notes').scrollTop) > 100, 'the rail scrolls');
  ok(await p.$eval('#bench', e => Math.round(e.getBoundingClientRect().top)) === benchTop,
     'and the bench does not move with it — the two scroll independently');
  await p.evaluate(() => { document.getElementById('notes').scrollTop = 0; }); await p.waitForTimeout(160); }

// the rail: three tabs, one section at a time, and every control an icon with a hover card
// AT BOOT — before any click — exactly one rail section is visible, and it is the controls
// THE OPERATOR'S OWN BAR (pasted back from the copy button 2026-09-11) is the default — pinned here
{ const cfg = await p.evaluate(() => ({ mode: window.HEADCFG.mode, left: window.headOrder('left'), right: window.headOrder('right'),
    off: Object.keys(window.HEADCFG.off).sort(), style: window.HEADCFG.style }));
  ok(cfg.mode === 'value', 'default verbosity is value', cfg.mode);
  ok(cfg.left.join(' ') === 'kind method name status risk', 'default LEFT pile', cfg.left.join(' '));
  ok(cfg.right.join(' ') === 'source above', 'default RIGHT pile', cfg.right.join(' '));
  ok(cfg.off.join(' ') === 'cluster entity kindword', 'default off', cfg.off.join(' '));
  const want = { kind: 'none', method: 'none', name: 'none', status: 'pill', risk: 'round', source: 'none', above: 'round', kindword: 'rect' };
  const bad = Object.keys(want).filter(k => (cfg.style[k] || {}).shape !== want[k]);
  ok(bad.length === 0, 'default containers are the operator\'s', bad.join(','));
  ok(cfg.style.name.text === 'on' && cfg.style.risk.text === 'off', 'default text overrides are the operator\'s', JSON.stringify({ name: cfg.style.name.text, risk: cfg.style.risk.text }));
  ok(cfg.style.kind.size === 24, 'the KIND glyph is drawn larger than the rest', String(cfg.style.kind.size));
  ok(cfg.style.kind.fit === 'bleed', 'the kind DISC bleeds over the bar rather than growing it', String(cfg.style.kind.fit)); }
{ const kz = await p.$eval('#headstrip .hel[data-el="kind"] svg', e => +e.getAttribute('width'));
  ok(kz === 24, 'the bare kind glyph draws at 24px', String(kz)); }
const bootShown = await p.$$eval('.rtab', els => els.filter(e => !e.hidden && e.offsetParent !== null).map(e => e.id));
ok(bootShown.length === 1 && bootShown[0] === 'rt-controls', 'at BOOT only the controls show — the toggle runs on load', bootShown.join(','));
const rtabs = await p.$$eval('#railtabs .rtb', els => els.map(e => e.dataset.rt));
ok(rtabs.join(',') === 'controls,cov', 'the rail toggles between CONTROLS and the no-loss checklist', rtabs.join(','));
ok(await p.$eval('#railtabs .rtb', e => e.classList.contains('on') && e.dataset.rt === 'controls'), 'controls are the DEFAULT view');
for (const t of rtabs) { await p.click(`#railtabs .rtb[data-rt="${t}"]`); await p.waitForTimeout(90);
  const shown = await p.$$eval('.rtab', els => els.filter(e => !e.hidden).map(e => e.id));
  ok(shown.length === 1 && shown[0] === 'rt-' + t, `rail toggle ${t} shows one section, never both`, shown.join(',')); }
await p.click('#railtabs .rtb[data-rt="controls"]'); await p.waitForTimeout(90);
const blocks = await p.$$eval('#rt-controls .barblk .bhl b', els => els.map(e => e.textContent));
ok(blocks.join(',') === 'bench,head bar,part buttons,middle,data panel,schemas panel,functions panel,portrait,command panel',
   'the controls tab gives every region its own block, in the console\'s own order', blocks.join(','));
const prows = await p.$$eval('#partcfg .prow', els => els.length);
ok(prows === 6, 'the BARS tab separates the controls per part — one row each', String(prows));
const varBtns = await p.$$eval('#partcfg .ib', els => els.length);
ok(varBtns === 20, 'every distribution is an icon button in its part row', String(varBtns));
const iconOnlyCtl = await p.$$eval('#partcfg .ib, #barcfg .ib, #boxes .ib, #dens .ib, #motionwrap .ib', els => els.every(e => !e.innerText.trim() && !!e.querySelector('svg')));
ok(iconOnlyCtl, 'every control in the rail is an ICON — its word lives on the hover card');
const ctl = (await p.$$('#partcfg .ib'))[0]; await ctl.hover(); await p.waitForTimeout(120);
ok(await p.evaluate(() => { const h = document.getElementById('hover'); return !h.hidden && h.innerText.length > 20; }), 'a rail control answers a hover with a card');
await p.evaluate(() => { const r = document.getElementById('notes').getBoundingClientRect(); window.__railw = r.width; });
ok(await p.evaluate(() => window.__railw >= 460 && window.__railw <= 500), 'the rail is ~50% wider than it was (474px)', String(await p.evaluate(() => window.__railw)));
await p.click('#railtabs .rtb[data-rt="controls"]'); await p.waitForTimeout(80);
// ── the bar's two PILES, the operator's defaults, drag-reorder, and the copy buttons ──
const piles = await p.$$eval('#headstrip .hpile', els => els.map(e => e.className));
ok(piles.length === 2 && /left/.test(piles[0]) && /right/.test(piles[1]), 'the bar is TWO piles — left and right', piles.join('|'));
const rightKeys = await p.evaluate(() => window.headOrder('right'));
ok(rightKeys.join(',') === 'source,above', 'the right pile carries the file then the UP trio (the operator\'s order)', rightKeys.join(','));
const leftKeys = await p.evaluate(() => window.headOrder('left'));
ok(!leftKeys.includes('entity') && !leftKeys.includes('cluster'), 'entity and cluster are no longer their own chips on the left — the UP trio carries them', leftKeys.join(','));
ok((await p.$$('#headstrip .hupmark')).length === 0, 'the UP trio has no trailing arrow — the three icons ARE the ladder');
ok((await p.$$('#headstrip .hpile.right .hel')).length === 4, 'the right pile draws three up-chips and the file', String((await p.$$('#headstrip .hpile.right .hel')).length));
// drag is driven through the same mutation the drop handler calls
const moved = await p.evaluate(() => window.moveHeadEl('status', 'left', 0));
ok(moved[0] === 'status', 'an element can be reordered inside its pile', moved.join(','));
const crossed = await p.evaluate(() => { const r = window.moveHeadEl('status', 'right', 0); return { right: r, left: window.headOrder('left') }; });
ok(crossed.right[0] === 'status' && !crossed.left.includes('status'), 'an element can cross to the other pile', JSON.stringify(crossed));
await p.evaluate(() => window.moveHeadEl('status', 'left', 3));
const drags = await p.$$eval('#barcfg .dzone .ib', els => els.every(e => e.getAttribute('draggable') === 'true'));
ok(drags, 'every element chip in the rail is draggable');
const zones = await p.$$eval('#barcfg .dzone', els => els.map(e => e.dataset.side));
ok(zones.join(',') === 'left,right', 'the rail shows one drop zone per pile, divided', zones.join(','));
// a copy button per control block, each producing a readable line
const cpb = await p.$$('.barblk .cpb');
ok(cpb.length === 9, 'every control block has a COPY button', String(cpb.length));
const lines = await p.evaluate(() => Object.keys(window.COPYTXT).map(k => window.COPYTXT[k]()));
ok(lines.length === 11 && lines.every(l => l.length > 20),
   'eleven copy lines for nine blocks — `parts` and `frame` survive with no button, as the part-bar clause and the whole-frame round trip',
   lines.join(' // ').slice(0, 160));
{ const headLine = await p.evaluate(() => window.COPYTXT.head());
  ok(/head bar · verbosity .* LEFT .* RIGHT .* off .* styles /.test(headLine), 'the head-bar copy line carries verbosity, both piles, what is off, and the per-element styles', headLine); }
// ── per-element options: shown · text · container (operator 2026-09-11) ──
await p.click('#railtabs .rtb[data-rt="controls"]'); await p.waitForTimeout(80);
await p.click('#barcfg .dzone .ib[data-el="status"]'); await p.waitForTimeout(100);
ok(await p.$eval('.elned .ednhd b', e => e.textContent === 'status'), 'clicking an element chip opens ITS editor');
const rows = await p.$$eval('.elned .cfl', els => els.map(e => e.textContent));
ok(rows.join(',') === 'shown,text,container,icon,fit', 'the editor offers shown · text · container · icon size · fit', rows.join(','));
const sizes = await p.$$eval('.elned .ib[data-size]', els => els.map(e => e.dataset.size));
ok(sizes.join(',') === '11,13,16,20,24', 'five glyph sizes, each drawn with the element\'s own icon', sizes.join(','));
const shapes = await p.$$eval('.elned .ib[data-shape]', els => els.map(e => e.dataset.shape));
ok(shapes.join(',') === 'none,square,rect,round,pill,circle,cut', 'seven containers, each drawn as the shape it names', shapes.join(','));
// text off → the chip keeps its glyph and drops its words; the value stays on the hover card
await p.click('.elned .ib[data-text="off"]'); await p.waitForTimeout(100);
ok(!(await p.$eval('#headstrip', e => e.innerText)).includes('200'), 'text OFF removes an element\'s words from the bar');
{ const c = await p.$('#headstrip .hel[data-el="status"]'); await c.hover(); await p.waitForTimeout(120);
  ok(await p.evaluate(() => document.getElementById('hover').innerText.includes('200')), 'its value is still on the hover card — no loss, fewer words'); }
await p.click('.elned .ib[data-text="on"]'); await p.waitForTimeout(100);
ok((await p.$eval('#headstrip', e => e.innerText)).includes('200'), 'text ON puts the words back');
// each container reaches the chip
for (const sh of ['none', 'square', 'pill', 'circle', 'cut', 'rect']) {
  await p.click(`.elned .ib[data-shape="${sh}"]`); await p.waitForTimeout(80);
  const cls = await p.$eval('#headstrip .hel[data-el="status"]', e => e.className);
  ok(cls.includes('sh-' + sh), `container ${sh} reaches the chip`, cls); }
{ const st = await p.$eval('#headstrip .hel[data-el="status"]', e => { const c = getComputedStyle(e); return { r: c.borderRadius, b: c.borderTopStyle }; });
  ok(st.r === '7px', 'rect is the station\'s own 7px corner', JSON.stringify(st)); }
await p.click('.elned .ib[data-shape="none"]'); await p.waitForTimeout(80);
{ const st = await p.$eval('#headstrip .hel[data-el="status"]', e => getComputedStyle(e).borderTopColor);
  ok(/rgba\(0, 0, 0, 0\)|transparent/.test(st), 'NO CONTAINER leaves the border transparent', st); }
await p.click('.elned .ib[data-shape="rect"]'); await p.waitForTimeout(80);
// the glyph size reaches the drawn icon
for (const z of ['11', '24', '13']) { await p.click(`.elned .ib[data-size="${z}"]`); await p.waitForTimeout(80);
  const w = await p.$eval('#headstrip .hel[data-el="status"] svg', e => e.getAttribute('width'));
  ok(w === z, `icon size ${z} reaches the drawn glyph`, String(w)); }

// a big CIRCLE must not move the bar's margins: it bleeds over the row instead of growing it.
// The row's height FLOOR goes to its minimum first — a floor taller than the disc would hide both outcomes.
{ await p.evaluate(() => { window.FRAME.headH = 24; window.applyFrame(); }); await p.waitForTimeout(120);
  const before = await p.$eval('#headstrip', e => e.getBoundingClientRect().height);
  await p.evaluate(() => { const st = window.elStyle('kind'); st.shape = 'circle'; st.size = 24; st.fit = 'bleed'; window.drawHead(); });
  await p.waitForTimeout(160);
  const after = await p.$eval('#headstrip', e => e.getBoundingClientRect().height);
  const disc = await p.$eval('#headstrip .hel[data-el="kind"]', e => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { h: Math.round(r.height), w: Math.round(r.width), m: c.marginTop, br: c.borderRadius }; });
  ok(Math.abs(after - before) < 1.5, 'turning a 38px disc ON does not move the bar by a pixel — it bleeds (operator 2026-09-11)', before + ' → ' + after);
  ok(disc.h === disc.w && disc.h >= 36, 'the disc is round and sized by its own glyph', JSON.stringify(disc));
  ok(parseFloat(disc.m) < 0, 'the bleed is negative block margin, so the row keeps its natural height', disc.m);
  await p.evaluate(() => { const st = window.elStyle('kind'); st.fit = 'grow'; window.drawHead(); }); await p.waitForTimeout(120);
  const grown = await p.$eval('#headstrip', e => e.getBoundingClientRect().height);
  ok(grown > after + 4, 'fit GROW opts back into pushing the bar taller', after + ' → ' + grown);
  await p.evaluate(() => { window.FRAME.headH = 42; window.applyFrame(); }); await p.waitForTimeout(100);
  await p.evaluate(() => { const st = window.elStyle('kind'); st.shape = 'none'; st.size = 20; st.fit = 'bleed'; window.drawHead(); }); await p.waitForTimeout(120); }
// the editor can hide the element too
await p.click('.elned .ib[data-shown="off"]'); await p.waitForTimeout(100);
ok((await p.$$('#headstrip .hel[data-el="status"]')).length === 0, 'the editor hides the element');
await p.click('.elned .ib[data-shown="on"]'); await p.waitForTimeout(100);
ok((await p.$$('#headstrip .hel[data-el="status"]')).length === 1, 'and brings it back');
// ── THE COMMAND PANEL (Phase 6 slice 1, 2026-09-17) ──
// Every assert below reads the DRAWN thing: a computed style, a count that equals a number the page
// itself computes from window.LABEP.forms, a fingerprint that must differ after a pick, or two clock
// samples at uneven gaps. A bare `> 0` is not an assert here.
{
  const resetCmd = () => p.evaluate(() => {
    Object.assign(window.CMD, { layout: "card", verbs: "rows", mode: "cmd", grp: null, only: null, rows: "command",
      group: "request", names: "drawn", success: "shown", sub: "split", middle: "dim", portrait: "path",
      wrong: "blank", keys: "grid", size: 64, face: "valley", tip: "hover", join: "exact", keep: "kept",
      side: "right", ladder: "cmd", walk: "replay", flag: "shown", colour: "kind", matrix: "path" });
    window.CMD.show = { chip: 1, strip: 1, region: 1, title: 1, caption: 1 };
    window.clearPath(); window.drawCmdCfg(); window.drawMidCfg(); window.drawPortCfg(); window.drawCmd(); window.drawHead(); });
  await p.evaluate(() => { window.railTab('controls'); window.selectIn('data', null); window.selectIn('schemas', null); window.selectIn('functions', null); });
  await p.click('#boxes .ib[data-box="work"]'); await p.click('#dens .ib[data-dens="normal"]');
  await resetCmd(); await p.waitForTimeout(160);
  const errsBefore = errs.length;

  // the numbers the page computes from the feed — nothing below is typed by hand
  const N = await p.evaluate(() => { const f = window.LABEP.forms, u = a => [...new Set(a)];
    const cases = a => u(a.map(t => t.case));
    return {
      paths: f.paths.length, exits: f.exits.length, stages: f.stages.length,
      refusal: f.paths.filter(x => x.kind === 'refusal').length,
      success: f.paths.filter(x => x.kind === 'success').length,
      findings: f.findings.length, pre: f.preconditions.length,
      untested: f.exits.filter(e => !e.tests.length).length,
      merged: u(f.paths.map(x => x.kind + '|' + x.status)).length,
      noSuccess: f.paths.filter(x => x.kind !== 'success').length,
      firstRun: f.paths.find(x => x.names.drawn === 'first run').id,
      consent: f.paths.find(x => x.names.drawn === 'consent required').id,
      consentExit: f.paths.find(x => x.names.drawn === 'consent required').exit.id,
      frTables: f.paths.find(x => x.names.drawn === 'first run').effects.tables,
      frSteps: f.paths.find(x => x.names.drawn === 'first run').n.steps,
      frCases: cases(f.paths.find(x => x.names.drawn === 'first run').tests),
      consentCases: cases(f.paths.find(x => x.names.drawn === 'consent required').tests),
      consentN: f.paths.find(x => x.names.drawn === 'consent required').effects.n,
      labTables: window.LABEP.data.tables.map(t => t.table) }; });

  const DEFLINE = CMDBOOT.replace('verbs g2', 'verbs rows');
  ok(await p.evaluate(() => window.COPYTXT.command()) === DEFLINE && DEFLINE === CMDBOOT.replace('verbs g2', 'verbs rows'),
    'this section reads the card on its ROWS grouping — the boot line with one word changed, nothing else', await p.evaluate(() => window.COPYTXT.command()));
  ok(await p.evaluate(() => window.OPENBLK) === 'blk-command', 'the rail opens on the region being worked on');
  { const ords = await p.evaluate(() => ['#notes', '#cmd', '#bench', '#port'].map(s => getComputedStyle(document.querySelector(s)).order).join(','));
    ok(ords === '1,5,3,4', 'the row is renumbered rail 1 · bench 3 · port 4 · cmd-right 5', ords); }
  { const g = await p.$$eval('#blk-command .cffold', els => els.map(e => e.dataset.group + (e.classList.contains('open') ? ':open' : ':folded')).join(' '));
    ok(g === 'layout:folded map:open cells:folded colour:folded sections:folded size:folded',
      'the MAP fold boots open — every §6 choice in front of the operator, with the region\'s own size last', g); }
  { const r = await p.$eval('#cmd', e => { const c = getComputedStyle(e); return { w: e.clientWidth, h: e.clientHeight, ml: c.marginLeft }; });
    ok(r.w === 358 && r.ml === '12px', 'the region wears FRAME.cmdW and cmdGap (360 box, 12px gap)', JSON.stringify(r)); }

  // ── the CARD: 15 cells, a hover card per cell, the letters and the badges ──
  ok((await p.$$('#cmd .cmdcell')).length === 15, 'the card draws the 3×5 grid — fifteen command squares');
  { const hot = await p.$$eval('#cmd .cmdcell .chot', els => els.map(e => e.textContent).join(''));
    ok(hot === 'QWERTASDFGZXCVB', 'the QWERT grid letters are drawn in the cells, in place', hot); }
  { const cells = await p.$$('#cmd .cmdcell');
    for (let i = 0; i < cells.length; i++) { await p.mouse.move(5, 1030); await cells[i].hover(); await p.waitForTimeout(90);
      const c = await p.evaluate(() => { const h = document.getElementById('hover');
        return { open: !h.hidden, title: (h.querySelector('.cphd b') || {}).textContent || '', plain: (h.querySelector('.cpplain') || {}).textContent || '' }; });
      ok(c.open && c.title.length > 2 && c.plain.length > 15, `cell ${i + 1} answers a hover with a card that names its verb and ends on the plain line`, JSON.stringify(c)); }
    await p.mouse.move(5, 1030); }
  { const badges = await p.$$eval('#cmd .cmdcell', els => els.map(e => ((e.querySelector('.chot') || {}).textContent || '') + '=' + ((e.querySelector('.cbadge') || {}).textContent || '')).join(' '));
    ok(badges.includes('Q=' + N.paths), 'Walk a path ▸ badges the number of paths the feed carries', badges);
    ok(badges.includes('R=' + N.refusal), 'the refusals badge is the feed\'s refusal count — the 500 is counted apart', badges);
    ok(badges.includes('T=' + N.success), 'the success badge is the feed\'s success count', badges);
    ok(badges.includes('S=' + N.pre), 'the preconditions badge is the feed\'s row count', badges);
    ok(badges.includes('F=' + N.findings), 'the findings badge is the feed\'s finding count', badges);
    ok(badges.includes('X=' + N.untested), 'the untested-exits badge counts the exits with no case', badges); }
  { const h = await p.$$eval('#cmd .cmdcell.st-hatched', els => els.map(e => (e.querySelector('.chot') || {}).textContent).join(','));
    ok(h === 'V', 'exactly one cell is HATCHED — Up to entity, which the lab cannot walk to', h);
    await p.hover('#cmd .cmdcell[data-cmd="up"]'); await p.waitForTimeout(110);
    ok((await p.$eval('#hover', e => e.innerText)).includes('no graph'), 'and its card says WHY it is hatched');
    await p.mouse.move(5, 1030); }
  { const st = await p.$eval('#cmd .cmdcell.st-hatched', e => getComputedStyle(e).backgroundImage);
    ok(/repeating-linear-gradient/.test(st), 'hatched is drawn as ruling, not as a word', st.slice(0, 60)); }

  // ── Walk a path ▸ swaps the grid, and the wrong-question cell keeps its place ──
  await p.click('#cmd .cmdcell[data-cmd="walk"]'); await p.waitForTimeout(160);
  ok((await p.$$('#cmd .cmdcell[data-path]')).length === N.paths, 'Walk a path ▸ draws exactly one cell per path the feed carries');
  ok((await p.$$('#cmd .cmdcell')).length === 15, 'the grid keeps its fifteen places — fourteen paths and the corner');
  ok((await p.$$('#cmd .cmdcell.st-blank')).length === 15 - N.paths - 1, 'the blank cells are the slots neither a path nor the corner fills');
  // ── THE CORNER (operator 2026-09-17, first look): the bottom-right cell is cancel/back in EVERY mode of the card ──
  { const last = await p.$eval('#cmd .cmdgrid .cmdcell:last-child', e => ({ cmd: e.dataset.cmd, hot: (e.querySelector('.chot') || {}).textContent, idx: [...e.parentNode.children].indexOf(e), n: e.parentNode.children.length }));
    ok(last.cmd === 'back' && last.hot === 'B' && last.idx === last.n - 1, 'in the path grid the bottom-right cell is BACK, lettered B', JSON.stringify(last)); }
  await p.evaluate(id => window.selectPath(id), N.firstRun); await p.waitForTimeout(200);
  await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(160);
  ok(await p.evaluate(() => window.CMD.mode) === 'cmd' && await p.evaluate(() => window.SEL.path) === N.firstRun, 'Back returns to the verbs and KEEPS the path in force — cancel is not clear');
  { const last = await p.$eval('#cmd .cmdgrid .cmdcell:last-child', e => ({ cmd: e.dataset.cmd, hot: (e.querySelector('.chot') || {}).textContent }));
    ok(last.cmd === 'clear' && last.hot === 'B', 'on the verb card the bottom-right cell is CLEAR, lettered B', JSON.stringify(last)); }
  await p.evaluate(() => { window.clearPath(); window.CMD.mode = 'path'; window.CMD.sub = 'merged'; window.drawCmd(); }); await p.waitForTimeout(160);
  { const blank = await p.$eval('#cmd .cmdcell.st-blank', e => ({ svg: e.querySelectorAll('svg').length, dis: e.disabled, bg: getComputedStyle(e).backgroundImage }));
    ok(blank.svg === 0 && blank.dis === true && blank.bg === 'none', 'a blank cell draws nothing and cannot be clicked — it only holds the place', JSON.stringify(blank)); }
  await p.evaluate(() => { window.CMD.wrong = 'collapsed'; window.drawCmd(); }); await p.waitForTimeout(140);
  { const n = (await p.$$('#cmd .cmdcell')).length, merged = (await p.$$('#cmd .cmdcell[data-path]')).length, last = await p.$eval('#cmd .cmdgrid .cmdcell:last-child', e => e.dataset.cmd);
    ok(n === Math.ceil((merged + 1) / 5) * 5 && n < 15 && last === 'back', 'collapsed drops the empty ROWS, never the corner — the last cell is still Back', n + ' cells · ' + merged + ' paths · last ' + last); }
  await p.evaluate(() => { window.CMD.wrong = 'blank'; window.CMD.sub = 'split'; window.drawCmd(); }); await p.waitForTimeout(140);
  { const nm = await p.$$eval('#cmd .cmdcell[data-path] .clbl', els => els.map(e => e.textContent));
    const want = await p.evaluate(() => window.CMDKIT.paths(window.LABEP).map(c => window.CMDKIT.pathName(c.lead)));
    ok(nm.join('|') === want.join('|'), 'each path cell is labelled by the name the `names` pick chose', nm.join('|').slice(0, 120)); }

  // ── one selection, six projections ──
  await p.evaluate(id => window.selectPath(id), N.firstRun); await p.waitForTimeout(220);
  ok(await p.evaluate(() => window.SEL.path) === N.firstRun, 'clicking a path cell puts it in force on window.SEL.path');
  { const chip = await p.$('#headstrip .hel.pathchip');
    ok(chip !== null, 'the head bar grows a chip on the RIGHT pile while a path is in force');
    ok(await p.$eval('#headstrip .hel.pathchip', e => e.innerText.trim()) === 'first run', 'the chip carries the path\'s name, the way the `names` pick draws it');
    const col = await p.evaluate(() => { const s = document.querySelector('#headstrip .hel.pathchip svg');
      return { drawn: s.getAttribute('stroke'), want: window.CMDKIT.kindCol('success', window.STATION) }; });
    ok(col.drawn === col.want, 'and the glyph is stroked in the path KIND\'s own station colour', JSON.stringify(col));
    ok((await p.$$('#headstrip .hpile.right .hel')).length === 5, 'the chip rides the right pile beside the file and the UP trio'); }
  { const pv = await p.$$eval('#portvars .ptv', els => els.map(e => e.dataset.pvar));
    ok(pv[0] === 'cmd-path' && pv[1] === 'cmd-exit', 'the portrait is LENT the Path and Exit records, and the path record leads', pv.join(','));
    ok(await p.$eval('#portt', e => e.textContent) === 'first run', 'the portrait names the path as its subject');
    ok((await p.$$('#portbody .ptchain .ptcr')).length === N.frSteps, `the path record draws all ${N.frSteps} chain steps, in order`); }

  // ── LEFTOVERS piece 1 · THE ROUTE, IN ORDER: checks passed and fired per route · the through-route · the condition on a PASSED check ·
  //    the app band in the order it RUNS (it was drawn in registration order, the reverse) ──
  { const rowsOf = () => p.$$eval('#portbody .ptrow', els => els.map(e => [e.querySelector('.k').textContent, e.querySelector('.v').textContent]));
    const F1 = await p.evaluate(() => { const f = window.LABEP.forms, by = n => f.paths.find(x => x.names.drawn === n);
      const gates = x => x.chain.filter(c => c.kind === 'gate');
      return { through: f.through, fr: by('first run').n, cr: by('consent required').n, crId: by('consent required').id, frId: by('first run').id,
        crPassedWithPred: gates(by('consent required')).filter(c => c.hit === false && c.pred).map(c => ({ i: c.i, pred: c.pred })),
        recount: f.paths.map(x => [x.n.passed, gates(x).filter(c => c.hit === false).length, x.n.fired, gates(x).filter(c => c.hit === true).length]),
        succ: f.paths.filter(x => x.kind === 'success').map(x => [x.names.drawn, x.n.passed]),
        refusalsFireOne: f.paths.filter(x => x.kind !== 'success' && x.kind !== 'uncaught').every(x => x.n.fired === 1) }; });
    ok(F1.recount.every(r => r[0] === r[1] && r[2] === r[3]), 'every route\'s passed and fired counts are the chain\'s own gate rows, recounted here');
    ok(F1.through && F1.through.name === 'first run' && F1.succ.every(s => s[1] <= F1.through.passed) && F1.through.passed === F1.through.checks, 'the through-route is the success ending that passes the most checks — all of them', JSON.stringify(F1.succ));
    ok(F1.refusalsFireOne, 'every refusal is exactly one check firing');
    let rows = await rowsOf(); const get = k => (rows.find(r => r[0] === k) || [])[1];
    ok(get('checks') === `${F1.fr.passed} passed · ${F1.fr.fired} fired`, 'the path record counts the checks this route passed and fired', get('checks'));
    ok(/passes every check/.test(get('route') || ''), 'the through-route says so on its own record', get('route'));
    await p.evaluate(id => window.selectPath(id), F1.crId); await p.waitForTimeout(260);
    rows = await rowsOf();
    ok(get('checks') === `${F1.cr.passed} passed · ${F1.cr.fired} fired` && F1.cr.fired === 1 && !rows.some(r => r[0] === 'route'), 'a refusal\'s record counts its one fired check and makes no through-route claim', JSON.stringify(rows.filter(r => r[0] === 'checks' || r[0] === 'route')));
    ok(F1.crPassedWithPred.length >= 2, 'a PASSED check carries its condition too (the feed fills it only on the one that fired)', F1.crPassedWithPred.length);
    { const g = F1.crPassedWithPred[F1.crPassedWithPred.length - 1];
      await p.$eval(`#portbody .ptchain .ptcr[data-step="${g.i}"]`, e => e.scrollIntoView({ block: 'center' })); await p.hover(`#portbody .ptchain .ptcr[data-step="${g.i}"]`); await p.waitForTimeout(260);
      const card = await p.evaluate(() => { const c = document.getElementById('hover'); return c && !c.hidden ? c.innerText : ''; });
      ok(card.includes(g.pred.slice(0, 30)) && /passed it/.test(card), 'hovering a passed check shows the condition it checked', card.replace(/\s+/g, ' ').slice(0, 160)); }
    await p.mouse.move(5, 5); await p.evaluate(id => window.selectPath(id), F1.frId); await p.waitForTimeout(260); }
  { await p.evaluate(() => { window.showTab('security'); }); await p.waitForTimeout(320);
    const B = await p.evaluate(() => { const asgi = window.LABEP.security.asgi, fr = window.LABEP.forms.paths.find(x => x.names.drawn === 'first run');
      const seen = []; fr.chain.forEach(c => { const hit = asgi.find(m => new RegExp(m.name.replace(/Middleware$/, ''), 'i').test((c.label || '') + ' ' + (c.at || '')) || (/rate_limit/.test(c.at || '') && /Rate/i.test(m.name))); if (hit && !seen.includes(hit.name)) seen.push(hit.name); });
      return { lanes: [...document.querySelectorAll('#panel .lane[data-lane]')].map(e => [e.dataset.lane, e.querySelector('.lo').textContent]), chainOrder: seen,
        runs: asgi.map(m => [m.name, m.runs, m.registered]), word: window.LABEP.security.asgi_order }; });
    ok(B.word === 'runs' && B.runs.every(r => r[1] !== null), 'the feed gives the app-wide steps a RUN order', JSON.stringify(B.runs));
    ok(JSON.stringify(B.lanes.map(l => l[0])) === JSON.stringify(B.chainOrder) && B.chainOrder.length === B.lanes.length, 'the app band is drawn in the order the ROUTE runs it — read off the chain, never the registration index', B.lanes.map(l => l[0]).join(' → ') + ' vs chain ' + B.chainOrder.join(' → '));
    ok(B.lanes.map(l => l[1]).join(',') === B.lanes.map((_, i) => String(i + 1)).join(','), 'and numbered 1 · 2 · 3 in that order', B.lanes.map(l => l[1]).join(','));
    ok(B.runs.some(r => r[1] !== r[2]), 'the run order differs from the registration order in this app, so the old picture was wrong, not merely relabelled', JSON.stringify(B.runs));
    await p.evaluate(() => { window.showTab('data'); }); await p.waitForTimeout(200); }

  const fpOf = () => p.evaluate(() => { const parts = [];
    ['#cmd', '#pathstrip', '#panel', '#headstrip', '#portbody', '#portvars', '#cmd .cmdtip'].forEach(sel => { const e = document.querySelector(sel);
      if (!e) { parts.push(sel + ':none'); return; } const cs = getComputedStyle(e);
      parts.push(sel + ':' + cs.order + ':' + cs.display + ':' + (e.getAttribute('class') || '') + ':' + e.querySelectorAll('*').length + ':' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 1200)); });
    parts.push([...document.querySelectorAll('#portvars .ptv')].map(e => e.dataset.pvar).join('>'));
    parts.push([...document.querySelectorAll('#cmd .cmdcell, #cmd .excell, #cmd .cmxc')].slice(0, 24)
      .map(e => { const c = getComputedStyle(e), g = e.querySelector('.cg');
        return c.borderTopColor + c.borderTopStyle + c.width + c.opacity + c.backgroundImage.slice(0, 70) + c.boxShadow.slice(0, 40)
          + (g ? getComputedStyle(g).color : ''); }).join(','));
    return parts.join('§'); });

  // DATA — the tables the path touches are marked, the rest are dimmed to .28, and a written table
  // wears its bucket chip
  await p.click('#tabs .tab[data-tab="data"]'); await p.waitForTimeout(220);
  { const seen = await p.$$eval('#panel [data-table]', els => els.map(e => ({ t: e.dataset.table, on: e.classList.contains('onpath'), off: e.classList.contains('offpath') })));
    const wantOn = N.labTables.filter(t => N.frTables.indexOf(t) >= 0).length;
    const wantOff = N.labTables.length - wantOn;
    ok(seen.filter(x => x.on).length === wantOn, `Data marks the ${wantOn} drawn tables the first-run path touches`, String(seen.filter(x => x.on).length));
    ok(seen.filter(x => x.off).length === wantOff, `and leaves ${wantOff} off the path`, String(seen.filter(x => x.off).length));
    ok((await p.$$('#panel .bchip')).length > 0 && await p.$$eval('#panel .bchip', els => els.every(e => /committed|maybe|rolled back|uncommitted/.test(e.textContent))),
      'every bucket chip says which of the four buckets its write landed in'); }
  await p.evaluate(id => window.selectPath(id), N.consent); await p.waitForTimeout(240);
  { const chips = await p.$$eval('#panel [data-table] .bchip', els => els.map(e => (e.closest('[data-table]').dataset.table) + '=' + e.textContent));
    const rolled = chips.filter(c => /rolled back/.test(c));
    ok(rolled.length === 1 && rolled[0] === 'idempotency_keys=rolled back ×' + N.consentN.rolled_back,
      `the consent 409 shows its ${N.consentN.rolled_back} rolled-back writes, on idempotency_keys and nowhere else`, chips.join(' '));
    ok(chips.indexOf('idempotency_keys=maybe ×' + N.consentN.maybe_committed) >= 0,
      'the same table also wears its maybe-committed write — one chip per bucket, never one per table', chips.join(' '));
    const drawnT = await p.$$eval('#panel [data-table]', els => els.map(e => e.dataset.table));
    const committed = chips.filter(c => /committed ×/.test(c) && !/maybe/.test(c));
    ok(committed.length === 1 && /^users=committed ×/.test(committed[0]) && drawnT.indexOf('users') >= 0,
      'the one committed write is the login check\'s, on `users` — leftovers piece 4 draws that table, so its own block claims the chip', chips.join(' '));
    await p.evaluate(() => { window.showPortraitVar('cmd-path'); });await p.waitForTimeout(160);
    ok((await p.$$eval('#portbody .pttbl i', els => els.map(e => e.textContent))).indexOf('users') >= 0,
      'and the path record names it too');
    const col = await p.$eval('#panel .bchip.bk-rolled_back', e => getComputedStyle(e).color);
    const want = await p.evaluate(() => { const S = window.STATION; const d = document.createElement('i'); d.style.color = S.BADGE_COL.role.accessor; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ok(col === want, 'and it is drawn in the station\'s own red — read, never pasted', col + ' vs ' + want);
    const off = await p.$eval('#panel [data-table].offpath', e => getComputedStyle(e).opacity);
    ok(off === '0.28', 'what is off the path drops to .28 — dimmed, still readable', off); }

  // TESTS — the exact join marks the C-ids the forms arm proved
  await p.click('#tabs .tab[data-tab="tests"]'); await p.waitForTimeout(220);
  { const marked = await p.$$eval('#panel [data-case].onpath', els => [...new Set(els.map(e => e.dataset.case))].sort());
    const drawn = await p.$$eval('#panel [data-case]', els => [...new Set(els.map(e => e.dataset.case))]);
    const want = N.consentCases.filter(c => drawn.indexOf(c) >= 0).sort();
    ok(marked.join(',') === want.join(','), 'Tests marks exactly the consent 409\'s cases that this panel draws', marked.join(',') + ' vs ' + want.join(','));
    ok(N.consentCases.length === 4 && want.length === 2, 'the other two are service-raises cases the panel does not draw — the record names all four', N.consentCases.join(',')); }
  await p.evaluate(id => window.selectPath(id), N.firstRun); await p.waitForTimeout(220);
  { const marked = await p.$$eval('#panel [data-case].onpath', els => [...new Set(els.map(e => e.dataset.case))].sort());
    ok(marked.join(',') === N.frCases.slice().sort().join(','), `the first run marks its ${N.frCases.length} C-ids`, marked.join(',')); }
  { const before = await fpOf();
    await p.evaluate(() => { window.CMD.join = 'parsed'; window.drawCmd(); window.CMDKIT.applyPath(document.getElementById('panel'), 'tests', window.CMDKIT.pathById(window.LABEP, window.SEL.path)); }); await p.waitForTimeout(160);
    ok(await fpOf() !== before, 'the name-parsed join draws a different set of marks');
    ok(await p.$eval('#panel [data-case].onpath', e => getComputedStyle(e).outlineStyle) === 'dashed', 'and it is drawn DASHED — the name is the only evidence');
    await p.evaluate(() => { window.CMD.join = 'off'; window.CMDKIT.applyPath(document.getElementById('panel'), 'tests', window.CMDKIT.pathById(window.LABEP, window.SEL.path)); }); await p.waitForTimeout(140);
    ok((await p.$$('#panel [data-case].onpath')).length === 0, 'join off marks nothing at all');
    await p.evaluate(() => { window.CMD.join = 'exact'; window.CMDKIT.applyPath(document.getElementById('panel'), 'tests', window.CMDKIT.pathById(window.LABEP, window.SEL.path)); }); await p.waitForTimeout(140); }

  // FUNCTIONS · SCHEMAS · WIDENING · SECURITY
  await p.click('#tabs .tab[data-tab="functions"]'); await p.waitForTimeout(220);
  { const r = await p.evaluate(() => { const p2 = window.CMDKIT.pathById(window.LABEP, window.SEL.path);
      const want = Object.keys(window.CMDKIT.onPath(window.LABEP, p2).fn);
      const drawn = [...document.querySelectorAll('#panel [data-fn]')].map(e => e.dataset.fn);
      return { want: want.filter(f => drawn.indexOf(f) >= 0).sort(), on: [...document.querySelectorAll('#panel [data-fn].onpath')].map(e => e.dataset.fn).sort() }; });
    ok(r.on.join(',') === r.want.join(',') && r.on.length >= 3, 'Functions marks the handler and every function the chain calls or collapses', JSON.stringify(r)); }
  await p.click('#tabs .tab[data-tab="schemas"]'); await p.waitForTimeout(220);
  { const on = await p.$$eval('#panel [data-schema].onpath', els => els.map(e => e.dataset.schema));
    const want = await p.evaluate(() => { const p2 = window.CMDKIT.pathById(window.LABEP, window.SEL.path);
      return Object.keys(window.CMDKIT.onPath(window.LABEP, p2).schema); });
    ok(want.indexOf('MeResponse') >= 0 && on.indexOf('MeResponse') >= 0, 'Schemas marks the exit\'s response model', on.join(','));
    ok(want.indexOf('SetupCompleteRequest') >= 0 && on.indexOf('SetupCompleteRequest') >= 0, 'and the request shape, because this path passed the validation gate', on.join(','));
    const marked = await p.$$eval('#panel [data-field].onpath', els => els.map(e => (e.closest('[data-schema]') || { dataset: {} }).dataset.schema + '/' + e.dataset.field));
    ok(marked.length === 6 && marked.every(m => m.indexOf('MeResponse/') === 0),
      'the response\'s six fields are marked INSIDE their own shape — `preferences` in another shape stays off', marked.join(' ')); }
  await p.click('#tabs .tab[data-tab="security"]'); await p.waitForTimeout(220);
  { const marks = await p.$$eval('#panel .gatemark', els => els.map(e => (e.parentElement.dataset.dep || e.parentElement.dataset.lane) + '=' + e.textContent));
    ok(marks.length === 6 && marks.every(m => /=passed$/.test(m)), 'on a success path every gate the request crossed reads PASSED, none lit', marks.join(' ')); }
  await p.evaluate(() => { const f = window.LABEP.forms; window.selectPath(f.paths.find(x => x.names.drawn === 'rate limit (sensitive)').id); }); await p.waitForTimeout(220);
  { const marks = await p.$$eval('#panel .gatemark', els => els.map(e => (e.parentElement.dataset.dep || e.parentElement.dataset.lane) + '=' + e.textContent));
    const fired = marks.filter(m => /=fired$/.test(m));
    ok(fired.length === 1 && /RateLimit/.test(fired[0]), 'on the 429 the rate-limit lane is the one that FIRED', marks.join(' '));
    const col = await p.$eval('#panel .gatemark.gm-fired', e => getComputedStyle(e).color);
    const want = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = window.CMDKIT.kindCol('refusal', window.STATION); document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ok(col === want, 'and it is lit in the refusal colour', col + ' vs ' + want); }
  await p.click('#tabs .tab[data-tab="widening"]'); await p.evaluate(id => window.selectPath(id), N.consent); await p.waitForTimeout(240);
  { const on = await p.$$eval('#panel [data-rung].onpath', els => els.map(e => e.dataset.rung));
    ok(on.indexOf('useCompleteSetup') >= 0, 'Widening marks the hook that fetches this door on every path', on.join(','));
    ok(on.indexOf('SetupScreen') >= 0, 'and on the 409 it marks the screen whose site reads the status — the reason-collapsed finding', on.join(',')); }

  // Esc clears everything
  await p.evaluate(() => document.body.focus());
  await p.keyboard.press('Escape'); await p.waitForTimeout(220);
  { const st = await p.evaluate(() => ({ sel: window.SEL, chip: !!document.querySelector('#headstrip .hel.pathchip'),
      on: document.querySelectorAll('#panel .onpath, #panel .offpath').length, mode: window.CMD.mode }));
    ok(!st.sel.path && !st.sel.exit && !st.sel.case && !st.chip && st.on === 0 && st.mode === 'cmd',
      'Esc clears the path, the exit, the case, the head chip, every mark and the card\'s path mode', JSON.stringify(st)); }

  // ── the STRIP ──
  await p.evaluate(() => { window.CMD.layout = 'strip'; window.drawCmd(); window.drawCmdCfg(); }); await p.waitForTimeout(200);
  ok((await p.$$('#pathstrip .pscell')).length === N.paths, 'the strip draws one cell per path');
  { const r = await p.evaluate(() => { const s = document.getElementById('pathstrip'), t = document.getElementById('tabs'), b = document.getElementById('bench');
      return { below: s.getBoundingClientRect().top >= t.getBoundingClientRect().bottom - 1, inside: b.contains(s), h: Math.round(s.getBoundingClientRect().height), sw: s.scrollWidth <= s.clientWidth + 1 }; });
    ok(r.below && r.inside && r.h >= 70, 'it sits under the part buttons, inside the bench', JSON.stringify(r));
    ok(r.sw, 'and it never scrolls the bench sideways — the cells share the width instead of claiming a minimum each');
    const wid = await p.$$eval('#pathstrip .pscell', els => [...new Set(els.map(e => Math.round(e.getBoundingClientRect().width)))]);
    ok(wid.length === 1, 'every cell is the same width, whatever its name', wid.join(','));
    await p.evaluate(() => window.railTab('controls')); await p.click('#boxes .ib[data-box="dock"]'); await p.waitForTimeout(220);
    ok(await p.$eval('#pathstrip', e => e.scrollWidth <= e.clientWidth + 1), 'it still fits at the dock box (826 wide)',
      await p.$eval('#pathstrip', e => e.scrollWidth + ' > ' + e.clientWidth));
    { const fl = await p.evaluate(() => { let n2 = 0, worst = 99;
        document.querySelectorAll('#pathstrip *').forEach(el => { if (!el.offsetParent) return;
          const t = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return;
          const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) { n2++; worst = Math.min(worst, fs); } });
        return { under: n2, worst }; });
      ok(fl.under === 0, 'and holds the 12px floor at the dock width too', JSON.stringify(fl)); }
    await p.click('#boxes .ib[data-box="work"]'); await p.waitForTimeout(200); }
  { const before = await p.$$eval('#pathstrip .pscell', els => els.map(e => e.dataset.path).join(','));
    await p.evaluate(() => { window.CMD.group = 'status'; window.drawCmd(); }); await p.waitForTimeout(160);
    const after = await p.$$eval('#pathstrip .pscell', els => els.map(e => e.dataset.path).join(','));
    ok(after !== before && after.split(',').length === before.split(',').length, 'grouping by status reorders the same cells', after.slice(0, 60));
    await p.evaluate(() => { window.CMD.group = 'kind'; window.drawCmd(); }); await p.waitForTimeout(160);
    ok(await p.$$eval('#pathstrip .pscell', els => els.map(e => e.dataset.path).join(',')) !== after, 'and grouping by kind reorders them again');
    await p.evaluate(() => { window.CMD.group = 'request'; window.drawCmd(); }); await p.waitForTimeout(140); }
  { await p.evaluate(() => { window.CMD.sub = 'merged'; window.drawCmd(); }); await p.waitForTimeout(160);
    ok((await p.$$('#pathstrip .pscell')).length === N.merged, `merged folds the sub-paths into ${N.merged} cells, one per kind and status`);
    await p.evaluate(() => { window.CMD.sub = 'split'; window.CMD.success = 'hidden'; window.drawCmd(); }); await p.waitForTimeout(160);
    ok((await p.$$('#pathstrip .pscell')).length === N.noSuccess, 'hiding the success paths leaves the refusals');
    await p.evaluate(() => { window.CMD.success = 'shown'; window.drawCmd(); }); await p.waitForTimeout(140); }
  { const flags = await p.$$eval('#pathstrip .pscell .cflag', els => els.length);
    ok(flags === 2, 'the rate-limit flag chip rides only the two cells its own switch names', String(flags));
    await p.evaluate(() => { window.CMD.flag = 'hidden'; window.drawCmd(); }); await p.waitForTimeout(140);
    ok((await p.$$('#pathstrip .cflag')).length === 0, 'and hiding it takes it off the picture');
    await p.evaluate(() => { window.CMD.flag = 'shown'; window.drawCmd(); }); await p.waitForTimeout(140); }

  // a control the OPEN layout does not use is drawn DASHED, and its card says why (law 10)
  { const na = await p.$$eval('#blk-command .ib.na', els => els.map(e => e.getAttribute('data-cmdladder') || e.getAttribute('data-cmdwalk') || e.getAttribute('data-cmdwrong') || e.getAttribute('data-cmdmatrix') || e.getAttribute('data-cmdside') || e.getAttribute('data-cmdverbs') || '?'));
    ok(na.length > 0, 'in the strip layout the card-only and ladder-only dials are marked unusable', na.join(','));
    ok(await p.$eval('#blk-command .ib.na', e => getComputedStyle(e).borderTopStyle) === 'dashed', 'and they are drawn DASHED, not hidden');
    await p.evaluate(() => window.railFoldAll('cmd', true)); await p.waitForTimeout(160);
    await p.hover('#blk-command .ib.na'); await p.waitForTimeout(150);
    ok((await p.$eval('#hover', e => e.innerText)).includes('does nothing right now'), 'and the card says so out loud');
    await p.mouse.move(5, 1030); await p.evaluate(() => window.railFoldBoot()); await p.waitForTimeout(140); }
  // the SC2 card is a FIXED area under the grid, not a floating one (choice 13)
  { await p.evaluate(() => { window.CMD.layout = 'card'; window.CMD.tip = 'sc2'; window.drawCmd(); }); await p.waitForTimeout(200);
    ok(await p.$eval('#cmd .cmdtip', e => getComputedStyle(e).display) !== 'none', 'the SC2 card opens a fixed area under the grid');
    await p.hover('#cmd .cmdcell[data-cmd="refusals"]'); await p.waitForTimeout(180);
    ok((await p.$eval('#cmd .cmdtip', e => e.innerText)).length > 20, 'and hovering a cell fills it instead of a floating card');
    ok(await p.$eval('#hover', e => e.hidden) === true, 'the floating card stays shut while the fixed one is in use');
    await p.evaluate(() => { window.CMD.tip = 'caption'; window.drawCmd(); }); await p.waitForTimeout(160);
    await p.hover('#cmd .cmdcell[data-cmd="refusals"]'); await p.waitForTimeout(180);
    { const cap = await p.$eval('#cmd .cmdtip .capl', e => e.innerText);
      ok(cap.length > 8 && cap.split('\n').length === 1, 'the caption block is ONE line, nothing more', cap); }
    await p.evaluate(() => { window.CMD.tip = 'hover'; window.CMD.layout = 'strip'; window.drawCmd(); }); await p.waitForTimeout(160);
    ok(await p.$eval('#cmd .cmdtip', e => getComputedStyle(e).display) === 'none', 'and the lab hover card leaves the area away'); }

  // ── the LADDER ──
  await p.evaluate(() => { window.CMD.layout = 'ladder'; window.drawCmd(); window.drawCmdCfg(); }); await p.waitForTimeout(220);
  ok((await p.$$('#cmd .exrung')).length === N.stages + 1, `the ladder draws the ${N.stages} stages plus the success return at the foot`);
  ok((await p.$$('#cmd .excell')).length === N.exits, `every one of the ${N.exits} exits hangs on the rung it leaves from`);
  ok((await p.$$('#cmd .exrung.foot .excell')).length === 1, 'the return is the only thing on the foot rung');
  { await p.click(`#cmd .excell[data-exit="${N.consentExit}"]`); await p.waitForTimeout(220);
    const r = await p.$$eval('#cmd .exrung', els => els.map(e => ({ c: e.className, o: getComputedStyle(e).opacity })));
    const here = r.findIndex(x => /here/.test(x.c));
    ok(here > 0, 'clicking the consent 409 marks the rung it leaves from', String(here));
    ok(r.slice(0, here).every(x => x.o === '1'), 'the rungs above it stay lit — the request got that far');
    ok(r.slice(here + 1).every(x => x.o === '0.32'), 'and the rungs below it dim — the request never reached them', r.map(x => x.o).join(','));
    ok(await p.evaluate(() => window.SEL.exit) === N.consentExit, 'and the exit is in force on window.SEL.exit'); }
  { const a = await p.$eval('#cmd .cmdbead', e => e.getBoundingClientRect().top);
    await p.waitForTimeout(350); const b2 = await p.$eval('#cmd .cmdbead', e => e.getBoundingClientRect().top);
    await p.waitForTimeout(900); const c2 = await p.$eval('#cmd .cmdbead', e => e.getBoundingClientRect().top);
    ok(a !== b2 && b2 !== c2, 'the replay bead walks the ladder on the shared clock — two samples at uneven gaps differ', [a, b2, c2].join(' / '));
    await p.evaluate(() => window.CLOCK.play(false)); await p.waitForTimeout(160);
    const d1 = await p.$eval('#cmd .cmdbead', e => e.getBoundingClientRect().top); await p.waitForTimeout(420);
    ok(await p.$eval('#cmd .cmdbead', e => e.getBoundingClientRect().top) === d1, 'pausing the ONE clock freezes it');
    await p.evaluate(() => window.CLOCK.play(true)); await p.waitForTimeout(140);
    await p.evaluate(() => { window.CMD.walk = 'static'; window.drawCmd(); }); await p.waitForTimeout(200);
    ok(await p.$eval('#cmd .cmdbead', e => getComputedStyle(e).animationName) === 'none', 'static takes the animation off and rests the bead on the rung');
    await p.evaluate(() => { window.CMD.walk = 'replay'; window.drawCmd(); }); await p.waitForTimeout(140); }
  { await p.evaluate(() => { window.CMD.ladder = 'portrait'; window.drawCmd(); }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const l = document.getElementById('portlad'), pt = document.getElementById('port');
      return { hidden: document.getElementById('cmd').hidden, w: Math.round(l.getBoundingClientRect().width), left: Math.round(l.getBoundingClientRect().left - pt.getBoundingClientRect().left), rungs: l.querySelectorAll('.exrung').length }; });
    ok(r.hidden && r.w === 28 && r.left <= 1 && r.rungs === N.stages + 1, 'the ladder can move into the portrait\'s left edge as a 28px tick rail', JSON.stringify(r));
    await p.evaluate(() => { window.CMD.ladder = 'left'; window.drawCmd(); }); await p.waitForTimeout(180);
    ok(await p.$eval('#cmd', e => getComputedStyle(e).order) === '2', 'or to the other side of the bench — one order value');
    await p.evaluate(() => { window.CMD.ladder = 'cmd'; window.drawCmd(); }); await p.waitForTimeout(160); }

  // ── the MATRIX ──
  await p.evaluate(() => { window.CMD.layout = 'matrix'; window.clearPath(); window.drawCmd(); window.drawCmdCfg(); }); await p.waitForTimeout(220);
  { const r = await p.evaluate(() => ({ rows: document.querySelectorAll('#cmd .cmxrow:not(.cmxhd)').length,
      cols: document.querySelectorAll('#cmd .cmxhd .cmxh').length, cells: document.querySelectorAll('#cmd .cmxc').length,
      lit: document.querySelectorAll('#cmd .cmxc.st-lit').length, hollow: document.querySelectorAll('#cmd .cmxc.st-hollow').length,
      want: (function(){ const F2 = window.LABEP, parts = ['data', 'schemas', 'functions', 'tests', 'widening', 'security'];
        let n = 0; window.CMDKIT.paths(F2).forEach(c => parts.forEach(k => { if (window.CMDKIT.partFacts(F2, c.lead, k).n) n++; })); return n; })(),
      size: Math.round(document.querySelector('#cmd .cmxc').getBoundingClientRect().width) }));
    ok(r.rows === N.paths && r.cols === 6, `the matrix is ${N.paths} paths × 6 parts`, JSON.stringify(r));
    ok(r.cells === N.paths * 6, 'one cell per pair', String(r.cells));
    ok(r.size === 28, 'each cell is 28px, as the plan asked', String(r.size));
    ok(r.lit === r.want && r.lit + r.hollow === r.cells, 'the lit count equals the number the page computes from the feed', r.lit + ' vs ' + r.want); }
  { const before = await p.$$eval('#cmd .cmxc', els => els.map(e => e.className).join(','));
    await p.evaluate(() => { window.CMD.matrix = 'hook'; window.drawCmd(); }); await p.waitForTimeout(180);
    const after = await p.$$eval('#cmd .cmxc.st-lit[data-part="widening"]', els => els.length);
    ok(after === N.paths, 'counting the hook lights the Widening column for every path — which is why per-path is the default', String(after));
    await p.evaluate(() => { window.CMD.matrix = 'path'; window.drawCmd(); }); await p.waitForTimeout(160);
    ok(await p.$$eval('#cmd .cmxc', els => els.map(e => e.className).join(',')) === before, 'and switching back restores the picture exactly'); }

  // ── COLOUR (backlog B13), measured on the drawn cells ──
  await p.evaluate(() => { window.CMD.layout = 'card'; window.CMD.mode = 'path'; window.drawCmd(); }); await p.waitForTimeout(200);
  { const pick = async () => p.evaluate(() => { const F2 = window.LABEP;
      const s = F2.forms.paths.find(x => x.kind === 'success').id, r = F2.forms.paths.find(x => x.kind === 'refusal').id;
      const c = id => { const e = document.querySelector('#cmd .cmdcell[data-path="' + id + '"] .cg'); return e ? getComputedStyle(e).color : null; };
      return { s: c(s), r: c(r) }; });
    const byKind = await pick();
    ok(byKind.s && byKind.r && byKind.s !== byKind.r, 'colour by kind draws a success cell and a refusal cell in different colours', JSON.stringify(byKind));
    await p.evaluate(() => { window.CMD.colour = 'mono'; window.drawCmd(); }); await p.waitForTimeout(160);
    const mono = await pick();
    ok(mono.s === mono.r, 'mono makes them equal — the glyph carries the kind on its own', JSON.stringify(mono));
    const other = async () => p.evaluate(() => { const F2 = window.LABEP;
      const c = k => { const id = F2.forms.paths.find(x => x.kind === k).id;
        const e = document.querySelector('#cmd .cmdcell[data-path="' + id + '"] .cg'); return e ? getComputedStyle(e).color : null; };
      return { framework: c('framework'), validation: c('validation'), uncaught: c('uncaught'), refusal: c('refusal') }; });
    await p.evaluate(() => { window.CMD.colour = 'kind'; window.drawCmd(); }); await p.waitForTimeout(160);
    const kindOther = await other();
    await p.evaluate(() => { window.CMD.colour = 'status'; window.drawCmd(); }); await p.waitForTimeout(160);
    const byStatus = await pick(), statusOther = await other();
    ok(byStatus.s !== byStatus.r, 'by status still parts 2xx from 4xx', JSON.stringify(byStatus));
    ok(kindOther.framework !== kindOther.refusal && statusOther.framework === statusOther.refusal,
      'by status a framework 4xx reads the SAME as a written 4xx — which is the whole difference between the two rules', JSON.stringify({ kindOther, statusOther }));
    ok(kindOther.uncaught !== statusOther.uncaught, 'and the 500 changes hands: the uncaught red becomes the 5xx colour', kindOther.uncaught + ' → ' + statusOther.uncaught);
    await p.evaluate(() => { window.CMD.colour = 'phase'; window.drawCmd(); }); await p.waitForTimeout(160);
    const ramp = await p.$$eval('#cmd .cmdcell[data-path] .cg', els => [...new Set(els.map(e => getComputedStyle(e).color))]);
    ok(ramp.length === await p.evaluate(() => [...new Set(window.CMDKIT.paths(window.LABEP).map(c => c.lead.phase))].length),
      'the phase ramp draws one colour per stage the paths end in', ramp.join(' '));
    await p.evaluate(() => { window.CMD.colour = 'kind'; window.drawCmd(); }); await p.waitForTimeout(140); }

  // ── EVERY PICK CHANGES THE PICTURE (law 8) ──
  await p.evaluate(id => { window.CMD.layout = 'card'; window.CMD.mode = 'path'; window.showTab('data'); window.selectPath(id); }, N.consent);
  await p.waitForTimeout(240);
  for (const [key, val, why] of [['rows', 'parts', 'the parts draw their own strip'], ['names', 'detail', 'the cells wear the detail text'],
      ['names', 'exception', 'the cells wear the exception class'], ['names', 'phase', 'the cells wear stage · status'],
      ['middle', 'filter', 'what is off the path leaves'], ['middle', 'outline', 'only what is on the path is ringed'],
      ['portrait', 'split', 'the part\'s own record comes first'], ['size', 76, 'the squares grow'], ['size', 52, 'the squares shrink'],
      ['face', 'flat', 'the valley goes flat'], ['keys', 'mnemonic', 'the letters become mnemonics'], ['keys', 'off', 'the letters go'],
      ['tip', 'sc2', 'a fixed card opens under the grid'], ['tip', 'caption', 'one caption line replaces it'],
      ['side', 'left', 'the region crosses the row']]) {
    const before = await fpOf();
    await p.evaluate(([k, v]) => { window.CMD[k] = v; window.drawCmd(); window.CMDKIT.applyPath(document.getElementById('panel'), 'data', window.CMDKIT.pathById(window.LABEP, window.SEL.path)); window.drawPortrait(); }, [key, val]);
    await p.waitForTimeout(170);
    ok(await fpOf() !== before, `pick ${key}=${val} changes the picture — ${why}`); }
  await resetCmd(); await p.evaluate(id => { window.CMD.mode = 'path'; window.selectPath(id); }, N.firstRun); await p.waitForTimeout(200);
  // THE ENTITY CARD LEFT THIS LAB (operator 2026-09-17: "we are working just on the setup for this API
  // endpoint — the entity one we will work on separately, a completely different setup"). Deleted, not
  // hidden: no pick, no renderer branch, no roster.
  { ok((await p.$$('[data-cmdscope]')).length === 0, 'the scope pick is gone from the rail');
    ok((await p.$$('#cmd .cmdcell[data-cmd^="ent-"]')).length === 0, 'and no entity cell can be drawn on the card');
    ok(await p.evaluate(() => window.CMD.scope === undefined), 'CMD carries no scope at all');
    ok(/this lab is the API endpoint kind/.test(await p.$eval('#cmdcfg', e => e.innerText)),
      'the block says so in one plain line', (await p.$eval('#cmdcfg', e => e.innerText)).slice(-90)); }
  // `on part switch` is a behaviour, not a redraw — it is proved by switching parts
  { await p.evaluate(id => { window.CMD.keep = 'cleared'; window.selectPath(id); window.showTab('data'); }, N.firstRun); await p.waitForTimeout(200);
    await p.click('#tabs .tab[data-tab="security"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.SEL.path) === null, 'on part switch `cleared` drops the path when another part opens');
    await p.evaluate(id => { window.CMD.keep = 'kept'; window.selectPath(id); window.showTab('data'); }, N.firstRun); await p.waitForTimeout(200);
    await p.click('#tabs .tab[data-tab="security"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.SEL.path) === N.firstRun, 'and `kept` holds it across every part'); }
  // sections: hiding is display:none, and one click brings it back
  { await p.evaluate(() => { window.CMD.show.chip = 0; window.CMD.show.region = 0; window.drawCmd(); window.drawHead(); }); await p.waitForTimeout(180);
    ok(await p.$eval('#cmd', e => getComputedStyle(e).display) === 'none' && (await p.$$('#headstrip .pathchip')).length === 0,
      'a hidden section is display:none — it never leaves the page');
    await p.evaluate(() => { window.CMD.show.chip = 1; window.CMD.show.region = 1; window.drawCmd(); window.drawHead(); }); await p.waitForTimeout(180);
    ok(await p.$eval('#cmd', e => getComputedStyle(e).display) !== 'none' && (await p.$$('#headstrip .pathchip')).length === 1, 'and one click brings it back'); }

  // ── the HOTKEYS read the letter the cell drew ──
  await resetCmd(); await p.waitForTimeout(180);
  await p.evaluate(() => document.body.focus());
  await p.keyboard.press('q'); await p.waitForTimeout(200);
  ok((await p.$$('#cmd .cmdcell[data-path]')).length === N.paths, 'Q walks the paths from the keyboard');
  await p.evaluate(id => window.selectPath(id), N.firstRun); await p.waitForTimeout(200);
  await p.keyboard.press('b'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.CMD.mode) === 'cmd' && await p.evaluate(() => window.SEL.path) === N.firstRun, 'B in the path grid is the Back corner — up to the verbs, the path still in force');
  await p.keyboard.press('b'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.SEL.path) === null, 'B on the verb card is the Clear corner — the same as Esc');
  { await p.evaluate(() => { const i = document.createElement('input'); i.id = '__t'; document.body.append(i); i.focus(); });
    await p.keyboard.press('q'); await p.waitForTimeout(160);
    ok((await p.$$('#cmd .cmdcell[data-path]')).length === 0, 'a hotkey never fires while an input has focus');
    await p.evaluate(() => { document.getElementById('__t').remove(); document.body.focus(); }); }

  // ── THE TWO VERB GROUPINGS (operator 2026-09-17: "build both, selectable on command panel on the
  //    left"). rows must not move by a pixel; g1 names the three rows without moving a cell; g2 goes
  //    five groups → that group's verbs → the paths, and never deeper. ──
  await resetCmd(); await p.waitForTimeout(180);
  // the WHOLE card, measured: every cell's data-cmd, its x inside the region, its size, its state,
  // the grid's own width, and the text the region draws.
  const cardFp = () => p.evaluate(() => { const c = document.getElementById('cmd'), g = c.querySelector('.cmdgrid'), o = c.getBoundingClientRect();
    const cells = [...c.querySelectorAll('.cmdcell')].map(e => { const r = e.getBoundingClientRect();
      return (e.dataset.cmd || e.dataset.path || '·') + '@' + Math.round(r.left - o.left) + ',' + Math.round(r.top - o.top)
        + ':' + Math.round(r.width) + 'x' + Math.round(r.height) + ':' + e.className + ':' + (e.style.getPropertyValue('--tc') || '')
        + ':' + ((e.querySelector('.chot') || {}).textContent || '') + '/' + ((e.querySelector('.cbadge') || {}).textContent || ''); });
    return { w: g.getBoundingClientRect().width, cells, text: c.innerText.replace(/\s+/g, ' ').trim() }; });
  const cmdFloorAt = () => p.evaluate(() => { let n = 0, worst = 99;
    document.querySelectorAll('#cmd *').forEach(el => { if (!el.offsetParent) return;
      const t = el.childNodes && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) { n++; worst = Math.min(worst, fs); } });
    return { under: n, worst }; });
  { const opts = await p.$$eval('#blk-command [data-cmdverbs]', els => els.map(e => e.getAttribute('data-cmdverbs')));
    ok(opts.join(',') === 'rows,g1,g2', 'the rail carries a verbs pick with three options, rows first', opts.join(','));
    const where = await p.evaluate(() => { const f = document.querySelector('#blk-command .cffold[data-group="layout"]');
      const labs = [...f.querySelectorAll('.cfl')].map(e => e.textContent);
      return { fold: !!f.querySelector('[data-cmdverbs]'), labs }; });
    ok(where.fold && where.labs[0] === 'layout' && where.labs[1] === 'verbs',
      'it sits in the layout fold, directly after the layout pick', where.labs.join(' · ')); }

  const ROWS = await cardFp();
  ok(ROWS.cells.length === 15 && ROWS.cells.filter(c => /st-blank/.test(c)).length === 0,
    'rows: the card is the fifteen verbs, no blank slot', String(ROWS.cells.length));

  // ── G1 · the same fifteen cells, three rows NAMED ──
  await p.evaluate(() => { window.CMD.verbs = 'g1'; window.drawCmd(); window.drawCmdCfg(); }); await p.waitForTimeout(200);
  const G1 = await cardFp();
  { const names = await p.$$eval('#cmd .cmdgrid .cmdrow .cmdrowl', els => els.map(e => e.textContent));
    ok(names.join(' · ') === 'CHOOSE · SHOW · GO', 'g1 draws exactly three row names, CHOOSE · SHOW · GO', names.join(' · '));
    const cmds = g => g.cells.map(c => c.split('@')[0]).join(',');
    ok(cmds(G1) === cmds(ROWS), 'every one of the fifteen cells is still at its slot — the same verbs in the same order', cmds(G1));
    const x = g => g.cells.map(c => c.split('@')[1].split(',')[0]).join(',');
    ok(x(G1) === x(ROWS), 'and at the same x — the names ride ACROSS the row, so no square moved sideways', x(G1));
    ok(Math.round(G1.w) === Math.round(ROWS.w), 'the grid is exactly as wide as it was without the names', G1.w + ' vs ' + ROWS.w);
    const fs = await p.$$eval('#cmd .cmdgrid .cmdrowl', els => els.map(e => parseFloat(getComputedStyle(e).fontSize)));
    ok(fs.every(v => v >= 12), 'the row names are drawn at the 12px floor, never under it', fs.join(','));
    const fl = await cmdFloorAt(); ok(fl.under === 0, 'and nothing else in the region drops under it either', JSON.stringify(fl));
    await p.hover('#cmd .cmdgrid .cmdrow[data-row="show"]'); await p.waitForTimeout(160);
    const h = await p.evaluate(() => document.getElementById('hover').hidden ? '' : document.getElementById('hover').innerText);
    ok(/SHOW/.test(h) && /middle panel/.test(h), 'a row name answers a hover with a card saying what the row does', h.replace(/\s+/g, ' ').slice(0, 90));
    await p.mouse.move(5, 1030); }

  // ── G2 · level 1: the TOPIC roster — PATHS (the label axis) and the six part buttons in their order ──
  await p.evaluate(() => { window.CMD.verbs = 'g2'; window.CMD.grp = null; window.drawCmd(); window.drawCmdCfg(); }); await p.waitForTimeout(220);
  const TOP = await p.evaluate(() => ({ order: window.PARTORDER.slice(),
    count: window.PARTORDER.reduce((o, k) => (o[k] = String(window.PANELS[k].count(window.LABEP)), o), {}),
    col: window.PARTORDER.reduce((o, k) => (o[k] = window.PANELS[k].col, o), {}),
    word: window.PARTORDER.reduce((o, k) => (o[k] = window.PANELS[k].word.toUpperCase(), o), {}),
    dists: window.PARTORDER.reduce((o, k) => (o[k] = window.PANELS[k].variants.map(v => v.key), o), {}),
    paths: window.CMDKIT.paths(window.LABEP).length }));
  { const g = await p.$$eval('#cmd .cmdgrid .cmdcell', els => els.map((e, i) => ({ i, cmd: e.dataset.cmd || null,
      hot: (e.querySelector('.chot') || {}).textContent || null, badge: (e.querySelector('.cbadge') || {}).textContent || null,
      lbl: (e.querySelector('.clbl') || {}).textContent || null,
      tc: e.style.getPropertyValue('--tc'), blank: e.classList.contains('st-blank') })));
    ok(g.length === 15, 'g2 level 1 keeps the fifteen places', String(g.length));
    const groups = g.filter(c => /^grp-/.test(c.cmd || ''));
    ok(groups.map(c => c.cmd.slice(4)).join(',') === ['paths'].concat(TOP.order).join(','),
      'seven TOPIC cells in slots 0–6: PATHS, then the six part buttons in their own order', groups.map(c => c.cmd + '@' + c.i).join(' '));
    ok(groups.map(c => c.hot).join('') === 'QWERTAS', 'lettered Q W E R T A S by their place on the grid', groups.map(c => c.hot).join(''));
    ok(g[14].cmd === 'clear' && g[14].hot === 'B', 'and the corner is Clear at slot 14, lettered B', JSON.stringify(g[14]));
    ok(g.filter(c => c.blank).length === 7, 'the seven slots between them keep their place, empty', String(g.filter(c => c.blank).length));
    const by = {}, badges = {}, words = {};
    groups.forEach(c => { const k = c.cmd.slice(4); by[k] = c.tc; badges[k] = c.badge; words[k] = c.lbl; });
    ok(TOP.order.every(k => by[k] === TOP.col[k]),
      'each topic wears its PART\'s own colour, read from window.PANELS — never a pasted hex', JSON.stringify(by));
    ok(by.paths === 'var(--accent)', 'and PATHS, which is no part, wears the accent', by.paths);
    ok(TOP.order.every(k => badges[k] === TOP.count[k]),
      'every topic badge is that part\'s OWN count — the same number its button carries', JSON.stringify({ badges, want: TOP.count }));
    ok(badges.paths === String(TOP.paths), `and PATHS counts the ${TOP.paths} cells it would draw`, badges.paths);
    ok(TOP.order.every(k => words[k] === TOP.word[k]) && words.paths === 'PATHS',
      'each topic is named by its part\'s own word from the registry — PATHS is the one word the card names itself', JSON.stringify(words));
    const head = await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent);
    ok(head === '7 TOPICS', 'the head pill says 7 TOPICS', head);
    await p.hover('#cmd .cmdcell[data-cmd="grp-security"]'); await p.waitForTimeout(170);
    const hc = await p.evaluate(() => document.getElementById('hover').innerText.replace(/\s+/g, ' '));
    ok(/one level down/i.test(hc) && /show gates/i.test(hc) && /middle panel/i.test(hc),
      'a topic card says it opens the middle AND lists what sits one level down', hc.slice(0, 130));
    await p.mouse.move(5, 1030); }

  // ── PRESSING A TOPIC does two things: the MIDDLE opens it, and the card drops to its level 2 ──
  await p.evaluate(() => window.showVariant('data', window.PANELS.data.defaultVariant)); await p.waitForTimeout(320);
  await p.click('#cmd .cmdcell[data-cmd="grp-data"]'); await p.waitForTimeout(360);
  { ok(await p.$eval('#panel', e => e.dataset.tab) === 'data', 'DATA ▸ opens the Data topic in the middle panel');
    const live = await p.evaluate(() => window.PANELVAR('data'));
    ok(live === await p.evaluate(() => window.PANELS.data.defaultVariant),
      'reading the Data topic on the distribution it defaults to', live);
    const g = await p.$$eval('#cmd .cmdgrid .cmdcell', els => els.filter(e => e.dataset.cmd)
      .map(e => e.dataset.cmd + '/' + ((e.querySelector('.chot') || {}).textContent || '') + (e.classList.contains('on') ? '*' : '')));
    const want = TOP.dists.data.map((k, i) => 'var-data-' + k + '/' + 'QWERTASDFGZXCVB'[i] + (k === live ? '*' : ''))
      .concat(['writes/' + 'QWERTASDFGZXCVB'[TOP.dists.data.length], 'back/B']);
    ok(g.join(' ') === want.join(' '),
      `and the card draws its ${TOP.dists.data.length} distributions, then its one verb, then Back — the live one lit`, g.join(' '));
    ok(await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent) === 'DATA · ' + TOP.dists.data.length + ' DISTRIBUTIONS · 1 VERB',
      'the head pill counts both, computed', await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent));
    ok(TOP.dists.data.indexOf('stageblocks') >= 0 && g.some(x => /^var-data-stageblocks\//.test(x)),
      'a distribution added to the registry appears on the card by itself — the card reads PANELS.data.variants', g.join(' '));
    const fl = await cmdFloorAt(); ok(fl.under === 0, 'level 2 holds the 12px floor', JSON.stringify(fl)); }
  // a distribution cell re-renders the MIDDLE and leaves the card where it is
  await p.click('#cmd .cmdcell[data-cmd="var-data-blocks"]'); await p.waitForTimeout(360);
  { ok(await p.$eval('#panel', e => e.dataset.variant) === 'blocks', 'pressing a distribution re-renders the middle in it');
    ok(await p.evaluate(() => window.CMD.grp) === 'data', 'and the card stays at that topic\'s level 2');
    ok(await p.$eval('#cmd .cmdcell[data-cmd="var-data-blocks"]', e => e.classList.contains('on')), 'with the cell it drew now lit');
    ok(await p.$$eval('#cmd .cmdcell[data-cmd^="var-data-"].on', els => els.length) === 1, 'and only that one');
    await p.evaluate(() => window.showVariant('data', 'stages')); await p.waitForTimeout(320); }
  // a topic with no verbs of its own keeps the slots blank, in place
  await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(200);
  await p.click('#cmd .cmdcell[data-cmd="grp-schemas"]'); await p.waitForTimeout(360);
  { ok(await p.$eval('#panel', e => e.dataset.tab) === 'schemas', 'SCHEMAS ▸ opens the Schemas topic in the middle');
    const g = await p.$$eval('#cmd .cmdgrid .cmdcell', els => els.filter(e => e.dataset.cmd).map(e => e.dataset.cmd));
    ok(g.join(' ') === TOP.dists.schemas.map(k => 'var-schemas-' + k).join(' ') + ' back',
      `its ${TOP.dists.schemas.length} distributions and Back — it carries no verb of its own`, g.join(' '));
    ok(await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent) === 'SCHEMAS · 3 DISTRIBUTIONS · 0 VERBS',
      'and the head pill says so out loud', await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent));
    ok((await p.$$('#cmd .cmdcell.st-blank')).length === 15 - TOP.dists.schemas.length - 1,
      'the empty slots keep their place — the corner never moves'); }

  // ── G2 · level 2 of a topic that DOES carry verbs ──
  await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(200);
  await p.click('#cmd .cmdcell[data-cmd="grp-security"]'); await p.waitForTimeout(360);
  { const g = await p.$$eval('#cmd .cmdgrid .cmdcell', els => els.filter(e => e.dataset.cmd).map(e => e.dataset.cmd + '/' + ((e.querySelector('.chot') || {}).textContent || '')));
    ok(g.join(' ') === TOP.dists.security.map((k, i) => 'var-security-' + k + '/' + 'QWERTASDFGZXCVB'[i]).join(' ')
      + ' pre/E gates/R findings/T back/B',
      'SECURITY ▸ draws its distributions, then its three verbs, then the Back corner', g.join(' '));
    ok(await p.evaluate(() => window.CMD.grp) === 'security', 'and the level is CMD state, not a redraw trick');
    ok(await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent) === 'SECURITY · 2 DISTRIBUTIONS · 3 VERBS', 'the head pill names the topic and counts both',
      await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent));
    const fl = await cmdFloorAt(); ok(fl.under === 0, 'it holds the 12px floor', JSON.stringify(fl)); }
  await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(200);
  ok(await p.$$eval('#cmd .cmdcell[data-cmd^="grp-"]', els => els.length) === 7 && await p.evaluate(() => window.CMD.grp) === null,
    'Back returns to the seven topics');

  // ── G2 · level 3: the paths, and back up one level at a time ──
  await p.click('#cmd .cmdcell[data-cmd="grp-paths"]'); await p.waitForTimeout(180);
  { const g = await p.$$eval('#cmd .cmdgrid .cmdcell', els => els.filter(e => e.dataset.cmd).map(e => e.dataset.cmd));
    ok(g.join(',') === 'walk,refusals,success,prev,next,back', 'PATHS ▸ draws the five path verbs and Back', g.join(',')); }
  await p.click('#cmd .cmdcell[data-cmd="walk"]'); await p.waitForTimeout(200);
  ok((await p.$$('#cmd .cmdcell[data-path]')).length === N.paths, `Walk ▸ draws the ${N.paths} path cells, one level further down`);
  ok(await p.$eval('#cmd .cmdgrid .cmdcell:last-child', e => e.dataset.cmd) === 'back', 'with Back in the corner');
  ok(await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent) === N.paths + ' PATHS', 'and the head pill counts them',
    await p.$eval('#cmd .cmdhd .sechd .cnt', e => e.textContent));
  { const fl = await cmdFloorAt(); ok(fl.under === 0, 'level 3 holds the 12px floor', JSON.stringify(fl)); }
  await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(180);
  { const g = await p.$$eval('#cmd .cmdgrid .cmdcell', els => els.filter(e => e.dataset.cmd).map(e => e.dataset.cmd));
    ok(g.join(',') === 'walk,refusals,success,prev,next,back' && await p.evaluate(() => window.CMD.grp) === 'paths',
      'Back from the paths goes UP ONE level, to the PATHS group — not all the way out', g.join(',')); }
  await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(180);
  ok(await p.$$eval('#cmd .cmdcell[data-cmd^="grp-"]', els => els.length) === 7, 'and Back again is level 1 — three levels, never a fourth');
  // Esc from the deepest level lands on level 1 with nothing in force
  await p.click('#cmd .cmdcell[data-cmd="grp-paths"]'); await p.waitForTimeout(160);
  await p.click('#cmd .cmdcell[data-cmd="walk"]'); await p.waitForTimeout(180);
  await p.evaluate(id => window.selectPath(id), N.firstRun); await p.waitForTimeout(200);
  await p.evaluate(() => document.body.focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(220);
  { const st = await p.evaluate(() => ({ grp: window.CMD.grp, mode: window.CMD.mode, path: window.SEL.path,
      groups: document.querySelectorAll('#cmd .cmdcell[data-cmd^="grp-"]').length }));
    ok(st.grp === null && st.mode === 'cmd' && st.path === null && st.groups === 7,
      'Esc from level 3 clears the selection AND returns the card to the seven topics', JSON.stringify(st)); }
  if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true });
    const shot = async (name) => { await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); await p.waitForTimeout(200);
      await (await p.$('#cmd')).screenshot({ path: path.join(shotsAt, name) }); };
    await shot('eplab-cmd-verbs-g2-groups.png');
    await p.click('#cmd .cmdcell[data-cmd="grp-data"]'); await p.waitForTimeout(320);
    await shot('eplab-cmd-verbs-g2-data.png');
    await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.click('#cmd .cmdcell[data-cmd="grp-schemas"]'); await p.waitForTimeout(320);
    await shot('eplab-cmd-verbs-g2-schemas.png');
    await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.waitForTimeout(160);
    await p.click('#cmd .cmdcell[data-cmd="grp-security"]'); await p.waitForTimeout(180);
    await shot('eplab-cmd-verbs-g2-security.png');
    await p.click('#cmd .cmdcell[data-cmd="back"]'); await p.click('#cmd .cmdcell[data-cmd="grp-paths"]'); await p.waitForTimeout(160);
    await p.click('#cmd .cmdcell[data-cmd="walk"]'); await p.waitForTimeout(200);
    await shot('eplab-cmd-verbs-g2-paths.png');
    await p.evaluate(() => { window.clearPath(); window.CMD.verbs = 'g1'; window.drawCmd(); }); await p.waitForTimeout(200);
    await shot('eplab-cmd-verbs-g1.png'); }

  // ── and back to rows: not one pixel of the card may have moved ──
  await resetCmd(); await p.waitForTimeout(220);
  { const back = await cardFp();
    ok(JSON.stringify(back) === JSON.stringify(ROWS),
      'verbs rows draws the card it drew before either grouping existed — the same fifteen squares, the same places, the same words',
      JSON.stringify(back.cells.filter((c, i) => c !== ROWS.cells[i])).slice(0, 160));
    ok((await p.$$('#cmd .cmdgrid .cmdrow')).length === 0, 'and no row name is drawn under rows'); }

  // ── THE FLOOR, inside the command region, at the smallest cell ──
  const cmdFloor = async () => p.evaluate(() => { let n = 0, worst = 99;
    document.querySelectorAll('#cmd *, #pathstrip *').forEach(el => { if (!el.offsetParent) return;
      const t = el.childNodes && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) { n++; worst = Math.min(worst, fs); } });
    return { under: n, worst }; });
  for (const z of [64, 76, 52]) { await p.evaluate(s => { window.CMD.size = s; window.CMD.mode = 'path'; window.drawCmd(); }, z); await p.waitForTimeout(180);
    const fl = await cmdFloor();
    ok(fl.under === 0, `no text in the command region goes under 12px at cell size ${z}`, JSON.stringify(fl));
    const w = await p.$eval('#cmd .cmdcell', e => Math.round(e.getBoundingClientRect().width));
    ok(w === z, `and the square really is ${z}px`, String(w)); }
  await p.evaluate(() => { window.CMD.size = 64; window.CMD.mode = 'cmd'; window.drawCmd(); }); await p.waitForTimeout(140);
  for (const L of ['card', 'strip', 'ladder', 'matrix']) {
    await p.evaluate(l => { window.CMD.layout = l; window.drawCmd(); }, L); await p.mouse.move(5, 1030); await p.waitForTimeout(220);
    const d = await p.$eval('#cmd', e => ({ w: e.clientWidth, sw: e.scrollWidth, h: e.clientHeight, sh: e.scrollHeight }));
    ok(d.sw <= d.w + 1, `the ${L} layout never scrolls the region sideways`, JSON.stringify(d));
    const fl = await cmdFloor(); ok(fl.under === 0, `and it holds the 12px floor`, JSON.stringify(fl));
    if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true }); await p.mouse.move(5, 1030); await p.waitForTimeout(140);
      await (await p.$(L === 'strip' ? '#bench' : '#cmd')).screenshot({ path: path.join(shotsAt, `eplab-cmd-${L}.png`) }); } }
  await resetCmd(); await p.waitForTimeout(160);
  if (shotsAt) { await p.evaluate(() => { window.CMD.mode = 'path'; window.drawCmd(); }); await p.mouse.move(5, 1030); await p.waitForTimeout(200);
    await (await p.$('#cmd')).screenshot({ path: path.join(shotsAt, 'eplab-cmd-card-paths.png') });
    await p.evaluate(id => window.selectPath(id), N.firstRun); await p.waitForTimeout(200);
    for (const t of tabs) { await p.evaluate(k => window.showTab(k), t); await p.mouse.move(5, 1030); await p.waitForTimeout(240);
      await (await p.$('#bench')).screenshot({ path: path.join(shotsAt, `eplab-cmd-path-${t}.png`) }); }
    await p.evaluate(() => { window.showTab('data'); window.showPortraitVar('cmd-path'); }); await p.mouse.move(5, 1030); await p.waitForTimeout(220);
    await (await p.$('#port')).screenshot({ path: path.join(shotsAt, 'eplab-cmd-portrait-path.png') });
    await p.evaluate(id => window.selectPath(id), N.consent); await p.mouse.move(5, 1030); await p.waitForTimeout(240);
    await (await p.$('#port')).screenshot({ path: path.join(shotsAt, 'eplab-cmd-portrait-consent.png') });
    await p.evaluate(() => window.showPortraitVar('cmd-exit')); await p.mouse.move(5, 1030); await p.waitForTimeout(220);
    await (await p.$('#port')).screenshot({ path: path.join(shotsAt, 'eplab-cmd-portrait-exit.png') });
    await p.evaluate(() => { const e = window.CMDKIT.exitById(window.LABEP, window.SEL.exit); window.selectCase(e.tests[0].case); window.showPortraitVar('cmd-case'); });
    await p.mouse.move(5, 1030); await p.waitForTimeout(220);
    await (await p.$('#port')).screenshot({ path: path.join(shotsAt, 'eplab-cmd-portrait-case.png') }); }
  await resetCmd(); await p.waitForTimeout(160);
  ok(errs.length === errsBefore, 'the command panel raises no page error anywhere in this section', errs.slice(errsBefore, errsBefore + 3).join(' | '));
}

// ── DATA ACROSS THE STAGES (endpoint-stages.md, the first topic on the standard spine, 2026-09-17) ──
// The picture IS the label: with an ending in force the panel is re-rendered, not marked, so every
// assert below reads what the grid DREW and checks it against a number the page computes from the feed.
{
  const errsBefore = errs.length;
  await p.evaluate(() => { window.railTab('controls'); }); await p.click('#boxes .ib[data-box="work"]');
  await p.evaluate(() => { window.clearPath(); Object.assign(window.DATACFG.stages, { axis: 'cols', union: 'counts', fate: 'station', rail: 'shown' });
    window.showVariant('data', 'stages'); window.showTab('data'); window.drawDataCfg(); });
  await p.waitForTimeout(320);

  const G = await p.evaluate(() => { const f = window.LABEP.forms, stg = s => s.dependency ? 'GATE' : 'HANDLER';
    const groups = new Set(), tx = new Set(), tbl = new Set();
    f.paths.forEach(x => (x.effects.steps || []).forEach(s => {
      if (!s.table) { tx.add(x.id + '|' + stg(s)); return; }
      tbl.add(s.table); groups.add(x.id + '|' + s.table + '|' + stg(s)); }));
    const panel = window.LABEP.data.tables.map(t => t.table);
    const cons = f.paths.find(x => x.names.drawn === 'consent required'), fr = f.paths.find(x => x.names.drawn === 'first run');
    const per = q => { const o = {}; (q.effects.steps || []).forEach(s => { if (!s.table) return;
        ((o[s.table] = o[s.table] || {})[stg(s)] = (o[s.table] || {})[stg(s)] || []).push(s); }); return o; };
    return { groups: groups.size, tx: tx.size, rows: new Set(panel.concat([...tbl])).size,
      extra: [...tbl].filter(t => panel.indexOf(t) < 0), panel: panel.length, paths: f.paths.length,
      consent: cons.id, consentStatus: String(cons.status), consentRb: (cons.effects.n.rolled_back || 0),
      firstRun: fr.id, frStatus: String(fr.status), frTables: Object.keys(per(fr)) }; });

  ok(await p.evaluate(() => document.getElementById('panel').dataset.variant) === 'stages',
    'the Stages grid draws the topic across the door\'s own spine');
  ok(await p.evaluate(() => window.PANELS.data.defaultVariant) === 'stageblocks',
    'the registry DEFAULT is the STAGE BLOCKS — the grid is read here by a click');
  { const heads = await p.$$eval('#panel .dsh.dsst', els => els.map(e => e.dataset.stage));
    ok(heads.join(' → ') === 'EDGE → GATE → INPUT → HANDLER → EFFECTS → ANSWER',
      'the six drawn stages are the standard spine, in request order', heads.join(' → ')); }
  { const rows = await p.$$eval('#panel .dsl[data-table]', els => els.map(e => e.dataset.table));
    const FOUND = await p.evaluate(() => { const T = window.LABEP.data.tables, c = {}; T.forEach(t => { c[t.found] = (c[t.found] || 0) + 1; });
      return { counts: c, fact: window.LABEP.forms.counts.tables_found, routeOnly: T.filter(t => t.found === 'route effects').map(t => t.table).sort(), allHave: T.every(t => !!t.found) }; });
    ok(G.extra.length === 0 && rows.length === G.rows && rows.length === G.panel,
      `ONE table set for every layout (leftovers piece 4): all ${G.panel} tables are the panel's own, none known to the routes alone`, rows.length + ' vs ' + G.rows + ' · extra ' + G.extra.join(','));
    const hollow = await p.$$eval('#panel .dsl.hollow', els => els.map(e => e.dataset.table).sort());
    ok(hollow.length === 0, 'so no row is drawn hollow for being missing from the panel', hollow.join(','));
    ok(FOUND.allHave && JSON.stringify(FOUND.counts) === JSON.stringify(FOUND.fact) && FOUND.routeOnly.length > 0, 'every table says how it was found, and the counts are their own recount', JSON.stringify(FOUND.counts));
    ok(FOUND.routeOnly.every(t => rows.indexOf(t) >= 0), 'the tables only a route\'s steps know are drawn like any other', FOUND.routeOnly.join(',')); }
  { const cells = await p.$$eval('#panel .dsc[data-stage]', els => els.length);
    ok(cells === (G.rows + 1) * 6, `the grid is ${G.rows} tables + the transaction rail × 6 stages`, String(cells));
    const none = await p.$$eval('#panel .dsc.none', els => [...new Set(els.map(e => e.dataset.stage))].sort());
    ok(none.join(',') === 'EDGE,INPUT', 'EDGE and INPUT hold no table at all — drawn empty, not dropped', none.join(',')); }
  // the axis card says out loud what this picture does NOT draw
  { await p.hover('#panel .dscorner'); await p.waitForTimeout(160);
    const h = await p.$eval('#hover', e => e.innerText);
    ok(/UNCAUGHT/.test(h) && /CLIENT/.test(h) && /touches no table/.test(h),
      'the axis names the bay and the screen and says in one line why neither is drawn', h.replace(/\s+/g, ' ').slice(0, 120));
    await p.mouse.move(5, 1030); }

  // ── THE UNION: no label chosen, every cell counts the endings that meet the table there ──
  { const sum = await p.$$eval('#panel .dsc[data-n]', els => els.reduce((a, e) => a + Number(e.dataset.n), 0));
    ok(sum === G.groups, `with no ending in force the counts add up to the ${G.groups} (path · table · stage) touches the feed carries`, sum + ' vs ' + G.groups);
    const txn = await p.$$eval('#panel .dsc[data-rail][data-txn]', els => els.reduce((a, e) => a + Number(e.dataset.txn), 0));
    ok(txn === G.tx, `and the transaction rail counts its own ${G.tx}, apart from the tables`, txn + ' vs ' + G.tx);
    const ans = await p.$$eval('#panel .dsc[data-stage="ANSWER"] .dsa.u', els => els.length);
    ok(ans > 0 && await p.$$eval('#panel .dsc[data-stage="ANSWER"] .dsa.u', els => els.every(e => /^\d{3}$/.test(e.textContent))),
      'ANSWER carries the set of statuses each table can end under, as chips', String(ans)); }

  // ── THE LABEL: the consent 409 ──
  await p.evaluate(id => window.selectPath(id), G.consent); await p.waitForTimeout(340);
  { const eff = await p.$$eval('#panel .dsc[data-tbl="idempotency_keys"][data-stage="EFFECTS"] .dsf', els => els.map(e => e.className.replace(/.*bk-(\w+).*/, '$1') + e.textContent));
    ok(eff.some(x => /^rolled_back×/.test(x)), 'the consent 409 leaves idempotency_keys with rolled-back writes at EFFECTS', eff.join(' '));
    const n = Number((eff.find(x => /^rolled_back×/.test(x)) || '×0').split('×')[1]);
    ok(n === G.consentRb, `and the marker carries the feed's own count of them (${G.consentRb}) — one per statement, the rule the bucket chips already use`, String(n));
    const col = await p.$eval('#panel .dsc[data-tbl="idempotency_keys"][data-stage="EFFECTS"] .bk-rolled_back', e => getComputedStyle(e).color);
    const want = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = window.STATION.BADGE_COL.role.accessor;
      document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ok(col === want, 'drawn in the station\'s own red, read and never pasted', col + ' vs ' + want);
    ok(await p.$eval('#panel .dsc[data-tbl="idempotency_keys"][data-stage="ANSWER"]', e => e.innerText.trim()) === G.consentStatus,
      'and the row ends on the label\'s status — 409, not the union of every status');
    ok(Number(await p.$eval('#panel .dsc[data-tbl="users"][data-stage="GATE"]', e => e.dataset.n || 0)) > 0,
      'users is touched at the GATE — the dependency ran before the body was ever read');
    ok((await p.$$('#panel .dsc[data-tbl="users"][data-stage="HANDLER"] .dsd')).length === 0,
      'and the handler never touches it itself');
    const off = await p.$eval('#panel .dsl[data-table="user_dietary_profile"]', e => getComputedStyle(e).opacity);
    ok(off === '0.28', 'a table this ending never reaches dims to .28 — the projection still rules the middle', off);
    ok((await p.$$('#panel .bchip')).length === 0,
      'and no bucket chip is appended over the picture — the EFFECTS column already says the fate, once'); }

  // ── THE LABEL: the first run ──
  await p.evaluate(id => window.selectPath(id), G.firstRun); await p.waitForTimeout(340);
  { const touched = await p.evaluate(() => [...document.querySelectorAll('#panel .dsc[data-n]')]
      .reduce((o, e) => { (o[e.dataset.tbl] = o[e.dataset.tbl] || []).push(e.dataset.stage); return o; }, {}));
    const names = Object.keys(touched).sort();
    ok(names.join(',') === G.frTables.slice().sort().join(','),
      `the first run touches ${G.frTables.length} tables and every one of them has a GATE or HANDLER cell`, names.length + ' vs ' + G.frTables.length);
    ok(names.every(t => touched[t].every(s => s === 'GATE' || s === 'HANDLER')), 'and nowhere else — EDGE and INPUT stay empty on every path');
    const ans = await p.$$eval('#panel .dsc[data-stage="ANSWER"] .dsa', els => [...new Set(els.map(e => e.textContent))]);
    ok(ans.join(',') === G.frStatus, `ANSWER reads ${G.frStatus} on every touched row, and nothing else`, ans.join(',')); }
  // Esc gives the union back
  await p.evaluate(() => document.body.focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(340);
  { const sum = await p.$$eval('#panel .dsc[data-n]', els => els.reduce((a, e) => a + Number(e.dataset.n), 0));
    ok(sum === G.groups, 'Esc drops the label and the union comes back whole', sum + ' vs ' + G.groups);
    ok((await p.$$('#panel .dsc[data-stage="ANSWER"] .dsa.u')).length > 0, 'the status chips are the set again, not one label'); }

  // ── THE RAIL PICKS — each one changes the drawn picture ──
  const stgFp = () => p.evaluate(() => { const g = document.querySelector('#panel .dsg');
    return [...g.children].map(e => { const r = e.getBoundingClientRect();
      const ink = [...e.querySelectorAll('.dsd, .dsf, .dsn, .dsu, .dsa')].map(m => getComputedStyle(m).color + getComputedStyle(m).backgroundColor + getComputedStyle(m).borderTopStyle).join('~');
      return e.className + '|' + (e.dataset.stage || e.dataset.table || '') + '|' + e.innerText.replace(/\s+/g, ' ')
        + '|' + Math.round(r.left) + ',' + Math.round(r.top) + '|' + ink; }).join('§'); });
  { const before = await stgFp(), cellsBefore = (await p.$$('#panel .dsc[data-stage]')).length;
    await p.click('#datacfg [data-dstgaxis="rows"]'); await p.waitForTimeout(340);
    ok(await p.evaluate(() => document.querySelector('#panel .dstg').dataset.axis) === 'rows', 'axis rows turns the grid around');
    ok(await stgFp() !== before, 'and it is a different picture');
    ok((await p.$$('#panel .dsc[data-stage]')).length === cellsBefore, 'with exactly the same cells — the same nodes, laid the other way',
      (await p.$$('#panel .dsc[data-stage]')).length + ' vs ' + cellsBefore);
    const rot = await p.$eval('#panel .dsh.dstb i', e => getComputedStyle(e).writingMode);
    ok(/vertical/.test(rot), 'the table names are rotated so they still fit — the artifact\'s own answer', rot);
    const hs = await p.$$eval('#panel .dsh.dsst', els => els.map(e => e.dataset.stage));
    ok(hs.join(',') === 'EDGE,GATE,INPUT,HANDLER,EFFECTS,ANSWER', 'and the stages are the rows now, still in request order', hs.join(','));
    await p.click('#datacfg [data-dstgaxis="cols"]'); await p.waitForTimeout(320);
    ok(await stgFp() === before, 'and turning it back restores the picture exactly'); }
  { const before = await stgFp();
    await p.click('#datacfg [data-dstgunion="dots"]'); await p.waitForTimeout(320);
    ok(await stgFp() !== before, 'union dots changes the picture');
    const dots = await p.$$eval('#panel .dsc[data-n] .dsu', els => els.length);
    const want = await p.$$eval('#panel .dsc[data-n]', els => els.reduce((a, e) => a + Number(e.dataset.n), 0));
    ok(dots === want, 'one dot per ending, and the dots add up to the counts they replaced', dots + ' vs ' + want);
    await p.click('#datacfg [data-dstgunion="counts"]'); await p.waitForTimeout(300); }
  { await p.evaluate(id => window.selectPath(id), G.consent); await p.waitForTimeout(340);
    const before = await stgFp();
    const colOf = () => p.$eval('#panel .bk-rolled_back', e => getComputedStyle(e).color);
    const station = await colOf();
    await p.click('#datacfg [data-dstgfate="mono"]'); await p.waitForTimeout(320);
    ok(await stgFp() !== before, 'fate mono changes the picture');
    const mono = await colOf();
    ok(mono !== station, 'the rolled-back marker loses the station red', station + ' → ' + mono);
    const forms = await p.$$eval('#panel .dsf', els => [...new Set(els.map(e => (e.className.match(/fm-\w+/) || [''])[0]))]);
    ok(forms.length > 1, 'and the FORM still parts the buckets — mono is not one marker repeated', forms.join(','));
    await p.click('#datacfg [data-dstgfate="station"]'); await p.waitForTimeout(320);
    ok(await stgFp() === before, 'and the station colours come back exactly'); }
  { const before = await stgFp(), rails = (await p.$$('#panel .dsc[data-rail]')).length;
    ok(rails === 6, 'the transaction rail is one lane of six cells', String(rails));
    await p.click('#datacfg [data-dstgrail="hidden"]'); await p.waitForTimeout(320);
    ok((await p.$$('#panel .dsc[data-rail]')).length === 0 && await stgFp() !== before, 'rail hidden takes the lane off the picture');
    await p.click('#datacfg [data-dstgrail="shown"]'); await p.waitForTimeout(320);
    ok(await stgFp() === before, 'and one click brings it back, unchanged'); }
  // clicking a table opens its record in the portrait, the way every other Data distribution does
  await p.evaluate(() => window.clearPath()); await p.waitForTimeout(320);
  { await p.click('#panel .dsl[data-table="households"]'); await p.waitForTimeout(280);
    ok(await p.evaluate(() => window.SEL.data) === 'households', 'clicking a table row selects it');
    ok(await p.$eval('#portt', e => e.textContent) === 'households', 'and the portrait opens on that table\'s record');
    ok(await p.$eval('#panel .dsl[data-table="households"]', e => e.classList.contains('sel')), 'the row it came from is marked');
    await p.evaluate(() => window.selectIn('data', null)); await p.waitForTimeout(200); }
  // the floor, in both orientations, with and without a label
  for (const [axis, label] of [['cols', null], ['cols', 'consent'], ['rows', null], ['rows', 'consent']]) {
    await p.evaluate(([a, l, id]) => { window.DATACFG.stages.axis = a; if (l) window.selectPath(id); else window.clearPath();
      window.applyData(); window.showTab('data'); }, [axis, label, G.consent]);
    await p.mouse.move(5, 1030); await p.waitForTimeout(300);
    const fl = await p.evaluate(() => { let n = 0, worst = 99;
      document.querySelectorAll('#panel *').forEach(el => { if (!el.offsetParent) return;
        const t = el.childNodes && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return;
        const fs2 = parseFloat(getComputedStyle(el).fontSize); if (fs2 < 12) { n++; worst = Math.min(worst, fs2); } });
      return { under: n, worst }; });
    ok(fl.under === 0, `nothing in the stages picture goes under 12px — axis ${axis}${label ? ' with a label' : ' on the union'}`, JSON.stringify(fl));
    const sw = await p.$eval('#panel', e => e.scrollWidth <= e.clientWidth + 1);
    ok(sw, `and it never scrolls the panel sideways — axis ${axis}`); }
  if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true });
    const shot = async (n2) => { await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); await p.waitForTimeout(220);
      await (await p.$('#bench')).screenshot({ path: path.join(shotsAt, n2) }); };
    await p.evaluate(() => { window.DATACFG.stages.axis = 'cols'; window.clearPath(); window.applyData(); window.showTab('data'); }); await p.waitForTimeout(280);
    await shot('eplab-stages-union.png');
    await p.evaluate(id => window.selectPath(id), G.consent); await p.waitForTimeout(320);
    await shot('eplab-stages-consent409.png');
    await p.evaluate(() => { window.DATACFG.stages.axis = 'rows'; window.clearPath(); window.applyData(); window.showTab('data'); }); await p.waitForTimeout(320);
    await shot('eplab-stages-transposed.png');
    await p.evaluate(() => { window.DATACFG.stages.axis = 'cols'; window.CMD.verbs = 'g2'; window.CMD.grp = null; window.CMD.mode = 'cmd';
      window.applyData(); window.showTab('data'); window.drawCmd(); }); await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); await p.waitForTimeout(280);
    await (await p.$('#cmd')).screenshot({ path: path.join(shotsAt, 'eplab-stages-card-g2.png') }); }
  await p.evaluate(() => { window.clearPath(); Object.assign(window.DATACFG.stages, { axis: 'cols', union: 'counts', fate: 'station', rail: 'shown' });
    window.CMD.verbs = 'rows'; window.CMD.grp = null; window.showVariant('data', 'blocks'); window.showTab('data'); window.drawCmdCfg(); window.drawDataCfg(); });
  await p.waitForTimeout(260);
  ok(errs.length === errsBefore, 'the stages picture raises no page error anywhere in this section', errs.slice(errsBefore, errsBefore + 3).join(' | '));
}

// ══ LEFTOVERS piece 4 · WHOSE WRITE IT IS — the endpoint's own writes apart from the gate's · one table set · the provision said once ══
{ const errs0 = errs.length;
  const R = await p.evaluate(() => { const f = window.LABEP.forms, seen = new Map();
    f.paths.forEach(x => ((x.effects || {}).steps || []).forEach(s => { if (s.race) seen.set(s.table + '|' + JSON.stringify(s.race.keys), [s.dependency ? 'gate' : 'own', s.race.state]); }));
    const c = { own: {}, gate: {} }; [...seen.values()].forEach(([w, st]) => { c[w][st] = (c[w][st] || 0) + 1; });
    const flat = o => ['own', 'gate'].map(w => Object.keys(o[w] || {}).sort().map(k => w + '.' + k + '=' + o[w][k]).join(',')).join('|');
    return { mine: flat(c), fact: flat(f.counts.races), total: seen.size, gate: Object.values(c.gate).reduce((a, b) => a + b, 0), prov: (f.auth.provisions || []).map(v => v.table),
      routeOnly: window.LABEP.data.tables.filter(t => t.found === 'route effects').map(t => t.table) }; });
  ok(R.mine === R.fact && R.total > 0, 'the races are counted by WHO owns the insert — this endpoint\'s own steps apart from the gate\'s — and the counts are their own recount', R.fact);
  ok(R.gate >= 1, 'the gate\'s insert is counted apart, never as this endpoint\'s own', String(R.gate));
  await p.evaluate(() => { window.clearPath(); window.showTab('data'); window.showVariant('data', 'stageblocks'); }); await p.waitForTimeout(320);
  const hov = async sel => { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await p.hover(sel); await p.waitForTimeout(200); const t = (await p.$eval('#hover', e => e.innerText)).replace(/\s+/g, ' '); await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); return t; };
  { const g = await hov('#panel .sbgrp[data-stage="GATE"] .sbhd'), e = await hov('#panel .sbgrp[data-stage="EDGE"] .sbhd');
    ok(R.prov.length > 0 && /PROVISIONED HERE/i.test(g) && R.prov.every(t => g.includes(t)) && /whatever the ending/.test(g), 'the GATE stage says its provision once — the row the check creates before the handler runs', g.slice(0, 200));
    ok(!/PROVISIONED HERE/i.test(e), 'and no other stage repeats it', e.slice(0, 100)); }
  await p.evaluate(() => { window.showVariant('data', 'blocks'); }); await p.waitForTimeout(320);
  ok(R.routeOnly.length > 0 && (await p.$$eval('#panel .blk', els => els.map(e => e.dataset.table))).filter(t => R.routeOnly.indexOf(t) >= 0).length === R.routeOnly.length, 'the Blocks layout draws the route-only tables too — one table set for every layout', R.routeOnly.join(','));
  const foundRow = async tbl => { await p.evaluate(t => window.selectIn('data', t), tbl); await p.waitForTimeout(300);
    return p.$eval('#portbody .rcrow[data-row="found by"] .v', e => e.textContent).catch(() => null); };
  ok((await foundRow(R.routeOnly[0])) === "a route's steps only", 'a table\'s portrait record says how it was found — here by a route\'s steps only', String(await foundRow(R.routeOnly[0])));
  { let t = '';
    if ((await p.$$('#portbody .rcrow[data-row="found by"] .rcinfo')).length) { await p.hover('#portbody .rcrow[data-row="found by"] .rcinfo'); await p.waitForTimeout(220);
      t = (await p.$eval('#hover', e => e.innerText)).replace(/\s+/g, ' '); await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); }
    ok(/does not carry this table/.test(t) && /WHY/i.test(t), 'and its info card says which source lacks it, and why', t.slice(0, 220)); }
  ok((await foundRow('households')) === "the map's edge and a route's steps", 'a table both sources know says so', String(await foundRow('households')));
  await p.evaluate(() => { window.showVariant('data', window.PANELS.data.defaultVariant); }); await p.waitForTimeout(240);
  ok(errs.length === errs0, 'the owner facts raise no page error', errs.slice(errs0, errs0 + 3).join(' | ')); }

// ══ LEFTOVERS piece 3 · WHAT EACH ENDING CARRIES — the rules behind the validation ending · the headers an ending sends back ══
{ const errs0 = errs.length;
  const G = await p.evaluate(() => { const f = window.LABEP.forms, v = f.exits.find(e => e.kind === 'validation'), byT = {};
    f.exits.forEach(e => (e.cases || []).forEach(c => { byT[c.type] = (byT[c.type] || 0) + 1; }));
    return { vId: v && v.id, n: v && v.cases ? v.cases.length : 0, first: v && v.cases ? v.cases[0] : null, counts: f.counts, byT,
      total: f.exits.reduce((a, e) => a + (e.cases || []).length, 0), withCases: f.exits.filter(e => (e.cases || []).length).map(e => e.kind),
      hdr: f.exits.filter(e => e.response && e.response.headers && Object.keys(e.response.headers).length).map(e => ({ id: e.id, status: e.status, keys: Object.keys(e.response.headers) })),
      plain: f.exits.find(e => e.kind === 'refusal' && !(e.response && e.response.headers && Object.keys(e.response.headers).length)).id }; });
  ok(G.n > 0 && G.total === G.counts.cases && JSON.stringify(G.byT) === JSON.stringify(G.counts.cases_by_type), 'the rules that refuse the body reach the lab, and the counts are their own recount', JSON.stringify({ n: G.n, counts: G.counts.cases }));
  ok(G.withCases.every(k => k === 'validation'), 'only a validation ending carries rules', G.withCases.join(','));
  ok(G.first && G.first.loc && G.first.type && G.first.at && G.first.schema, 'a rule names its field, its kind of refusal, its line and its shape', JSON.stringify(G.first));
  const rowsOf = () => p.$$eval('#portbody .ptrow', els => els.map(e => [e.querySelector('.k').textContent, e.querySelector('.v').textContent]));
  await p.evaluate(id => window.selectExit(id), G.vId); await p.waitForTimeout(300);
  ok((await p.$$('#portbody .ptcases .ptcr')).length === G.n, `the validation ending's record lists all ${G.n} rules`, (await p.$$('#portbody .ptcases .ptcr')).length);
  ok((await p.$eval('#portbody .ptcases .ptcr b', e => e.textContent).catch(() => null)) === (G.first || {}).loc, 'each row leads with the field, the way the answer names it');
  { const kinds = ((await rowsOf()).find(r => r[0] === 'kinds') || [])[1] || '';
    ok(Object.keys(G.byT).every(k => kinds.includes(G.byT[k] + ' ' + k)), 'and one row counts them by kind of refusal', kinds); }
  { let h = '';
    if ((await p.$$('#portbody .ptcases .ptcr')).length) { await p.$eval('#portbody .ptcases .ptcr', e => e.scrollIntoView({ block: 'center' })); await p.hover('#portbody .ptcases .ptcr'); await p.waitForTimeout(220);
      h = (await p.$eval('#hover', e => e.innerText)).replace(/\s+/g, ' '); }
    ok(!!G.first && h.includes(G.first.at) && /ends here with a 422/.test(h), 'a rule\'s hover gives its line and says what breaking it does', h.slice(0, 150)); }
  await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide());
  ok(G.hdr.length === G.counts.exits_with_headers && G.hdr.length > 0, 'the endings that send a header beside the body are counted');
  if (G.hdr.length) { await p.evaluate(id => window.selectExit(id), G.hdr[0].id); await p.waitForTimeout(260); }
  { const hv = ((await rowsOf()).find(r => r[0] === 'headers') || [])[1] || '', h0 = G.hdr[0] || { keys: ['(no ending sends a header)'], status: '?' };
    ok(h0.keys.every(k => hv.includes(k)), `the ${h0.status} ending's record names the header it sends`, hv);
    ok((await p.$$('#portbody .ptcases')).length === 0, 'and an ending that is not a validation ending draws no rules section'); }
  await p.evaluate(id => window.selectExit(id), G.plain); await p.waitForTimeout(260);
  ok(/none beside the body/.test(((await rowsOf()).find(r => r[0] === 'headers') || [])[1] || ''), 'an ending that sends only its body says so');
  await p.evaluate(() => { window.clearPath(); }); await p.waitForTimeout(200);
  ok(errs.length === errs0, 'the ending records raise no page error', errs.slice(errs0, errs0 + 3).join(' | ')); }

// ══ LEFTOVERS piece 2 · WHAT AN EMPTY SLOT MEANS — lit · hollow (read, zero) · hatched (not read here) · blank (no such slot) ══
{ const errs0 = errs.length;
  const T = await p.evaluate(() => { const F = window.LABEP, off = JSON.parse(JSON.stringify(F)), none = JSON.parse(JSON.stringify(F));
    off.forms.source.arms_on = off.forms.source.arms_on.filter(a => a !== 'effects'); none.forms = { state: 'absent', reason: 'no form' };
    return { lit: window.slotState(F, 3, 'effects'), hollow: window.slotState(F, 0, 'effects'), base: window.slotState(F, 0, null), hatched: window.slotState(off, 0, 'effects'),
      stillLit: window.slotState(off, 2, 'effects'), baseOff: window.slotState(off, 0, null), noForm: window.slotState(none, 0, 'effects'), blank: window.slotState(F, 0, 'effects', true) }; });
  ok(T.lit === 'lit' && T.hollow === 'hollow' && T.base === 'hollow' && T.hatched === 'hatched' && T.stillLit === 'lit' && T.baseOff === 'hollow' && T.noForm === 'hatched' && T.blank === 'blank',
    'a slot is lit with facts · hollow when its reading ran and found none · hatched when that reading did not run · blank when the kind has no such slot', JSON.stringify(T));
  const id429 = await p.evaluate(() => window.LABEP.forms.paths.find(x => x.status === 429).id);
  await p.evaluate(id => { window.CMD.verbs = 'rows'; window.CMD.grp = null; window.selectPath(id); window.CMD.mode = 'cmd'; window.drawCmd(); }, id429); await p.waitForTimeout(260);
  const W = '#cmd .cmdcell[data-cmd="writes"]';
  const read = () => p.$eval(W, e => ({ slot: e.dataset.slot, cls: e.className, bg: getComputedStyle(e).backgroundImage }));
  let c = await read();
  ok(c.slot === 'hollow' && /st-hollow/.test(c.cls), 'on a route that writes nothing the writes cell is HOLLOW — the effects reading ran here', JSON.stringify(c).slice(0, 120));
  await p.hover(W); await p.waitForTimeout(200);
  ok(/a measured zero/.test(await p.$eval('#hover', e => e.innerText)), 'and its card says the zero was measured');
  await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide());
  const slotsOf = () => p.$$eval('#cmd .cmdcell[data-cmd]', els => els.map(e => e.dataset.cmd + '=' + e.dataset.slot));
  const beforeOff = await slotsOf();
  await p.evaluate(() => { const a = window.LABEP.forms.source.arms_on; window.__armsKeep = a.slice(); a.splice(a.indexOf('effects'), 1); window.drawCmd(); }); await p.waitForTimeout(220);
  c = await read();
  ok(c.slot === 'hatched' && /st-hatched/.test(c.cls) && /repeating-linear-gradient/.test(c.bg), 'with the effects reading OFF the same zero is drawn HATCHED — a zero would be a guess', JSON.stringify(c).slice(0, 160));
  await p.hover(W); await p.waitForTimeout(200);
  { const h = await p.$eval('#hover', e => e.innerText);
    ok(/effects reading did not run on this feed/.test(h), 'and its card says which reading did not run', h.replace(/\s+/g, ' ').slice(0, 140));
    ok(await p.$eval('#hover', e => { const w = e.querySelector('.slotwhy'), end = e.querySelector('.cpend'); return !!w && (!end || (w.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING) > 0); }), 'the reason sits BEFORE the plain line, which stays last'); }
  await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide());
  { const afterOff = await slotsOf(), moved = afterOff.filter((x, i) => x !== beforeOff[i]);
    ok(moved.length === 1 && moved[0] === 'writes=hatched', 'only the slot the missing reading fills changes — every other cell keeps the state it had', moved.join(',') || 'none moved'); }
  await p.evaluate(() => { const a = window.LABEP.forms.source.arms_on; a.length = 0; window.__armsKeep.forEach(x => a.push(x)); window.clearPath(); window.drawCmd(); }); await p.waitForTimeout(200);
  ok((await read()).slot === 'lit', 'with every reading back and no route in force the writes cell is lit again');
  const E6 = await p.evaluate(() => { const X = window.STAGE_EXPECT, out = { topics: Object.keys(X), bad: [] };
    Object.keys(X).forEach(t => { const ks = Object.keys(X[t]).join(','); if (ks !== 'EDGE,GATE,INPUT,HANDLER,EFFECTS,ANSWER') out.bad.push(t + ' keys ' + ks);
      Object.keys(X[t]).forEach(k => { const v = X[t][k]; if (/[.!?]\s+[A-Z]/.test(v) || (v.match(/—/g) || []).length > 1 || v.length > 150 || /\b(bad|unsafe|risky|wrong|should fix|missing here)\b/i.test(v)) out.bad.push(t + '.' + k); }); });
    out.parts = (window.PARTORDER || []).join(','); return out; });
  ok(E6.topics.length === 6 && E6.topics.slice().sort().join(',') === E6.parts.split(',').sort().join(','), 'every one of the six topics has its norm per stage, keyed like the part buttons', E6.topics.join(',') + ' vs ' + E6.parts);
  ok(E6.bad.length === 0, 'every norm is one sentence, at most one dash, under 150 characters, and grades nothing', E6.bad.join(' · '));
  ok(errs.length === errs0, 'the slot states raise no page error', errs.slice(errs0, errs0 + 3).join(' | ')); }

// ── THE RAIL, GROUPED BY REGION (operator 2026-09-17: "I don't know which ones are affecting the mid
//    panel, the portrait, or the commands"). The blocks are the console's own order, every header says
//    which region its dials reach, and NOTHING was dropped on the way: the control roster below was
//    recorded off the rail of the committed page at 9b163fc (every block open, every fold open) and the
//    live rail must still carry every one of them. ──
{
  const RAILCTL_9b163fc = [
  'data-band', 'data-bkcount', 'data-bkent', 'data-bkform', 'data-bkicon',
  'data-bkicon-col', 'data-bkmodel', 'data-bkname', 'data-bkpart', 'data-bkrw',
  'data-box', 'data-casemode', 'data-chan', 'data-cmdcolour', 'data-cmdface',
  'data-cmdflag', 'data-cmdgroup', 'data-cmdjoin', 'data-cmdkeep', 'data-cmdkeys',
  'data-cmdladder', 'data-cmdlayout', 'data-cmdmatrix', 'data-cmdmiddle', 'data-cmdnames',
  'data-cmdport', 'data-cmdrows', 'data-cmdscope', 'data-cmdshow', 'data-cmdside',
  'data-cmdsize', 'data-cmdsub', 'data-cmdsuccess', 'data-cmdtip', 'data-cmdverbs',
  'data-cmdwalk', 'data-cmdwrong', 'data-cnt-box', 'data-cntfields', 'data-cntops',
  'data-cnttables', 'data-count-pills', 'data-dens', 'data-dlayout', 'data-dstgaxis',
  'data-dstgfate', 'data-dstgrail', 'data-dstgunion', 'data-el', 'data-fit',
  'data-flayout', 'data-fn-bk-count', 'data-fn-bk-file', 'data-fn-bk-icon', 'data-fn-bk-name',
  'data-fn-bk-role', 'data-fn-bk-via', 'data-fn-count-commits', 'data-fn-count-functions', 'data-fn-count-levels',
  'data-fn-foot-show', 'data-fn-form', 'data-fn-map-handler', 'data-fn-map-inferred', 'data-fn-map-looks',
  'data-fn-map-pieces', 'data-fn-map-rolecol', 'data-fn-role-sw', 'data-fn-sec', 'data-fn-sort-k',
  'data-fn-sort-rev', 'data-fnpart', 'data-fold', 'data-foot-show', 'data-fpart',
  'data-fside', 'data-group', 'data-iconmode', 'data-intensity', 'data-layout',
  'data-line', 'data-mode', 'data-numshape', 'data-numsize', 'data-order',
  'data-palette', 'data-part', 'data-pattern', 'data-pill-bg', 'data-pill-ink',
  'data-pill-shape', 'data-rail-side', 'data-rail-style', 'data-ratio', 'data-rw-box',
  'data-sch-bk-count', 'data-sch-bk-dir', 'data-sch-bk-ent', 'data-sch-bk-icon', 'data-sch-bk-name',
  'data-sch-bk-via', 'data-sch-count-fields', 'data-sch-count-nested', 'data-sch-count-shapes', 'data-sch-dir-sw',
  'data-sch-foot-show', 'data-sch-form', 'data-sch-map-blocks', 'data-sch-map-col', 'data-sch-map-kind',
  'data-sch-map-looks', 'data-sch-sec', 'data-sch-sort-k', 'data-sch-sort-rev', 'data-schpart',
  'data-sec', 'data-shape', 'data-shown', 'data-side', 'data-size',
  'data-slayout', 'data-sline', 'data-sort', 'data-sort-bg', 'data-sort-ink',
  'data-sort-rev', 'data-sort-show', 'data-sq-enc', 'data-sq-opt', 'data-sq-pal',
  'data-sq-shape', 'data-sq-uq-at', 'data-sq-uq-flip', 'data-sq-uq-mark', 'data-stop',
  'data-text', 'data-tiles', 'data-variant', 'data-width'
 ];
  // the roster is only complete when every conditional control is drawable: the unique-corner dials
  // exist while the marks are drawn as corners, which an earlier section turns off
  await p.evaluate(() => { window.railTab('controls'); window.DATACFG.sqUqMark = 'corners';
    window.applyData(); window.showTab('data'); window.drawDataCfg(); window.drawMidCfg(); window.drawPortCfg(); window.drawCmdCfg();
    document.querySelectorAll('.barblk.min').forEach(x => x.classList.remove('min'));
    document.querySelectorAll('.cffold').forEach(x => x.classList.add('open')); });
  await p.waitForTimeout(300);
  { const live = await p.evaluate(() => { const n = new Set();
      document.querySelectorAll('#rt-controls *').forEach(e => { for (const a of e.attributes) if (a.name.startsWith('data-')) n.add(a.name); });
      return [...n].sort(); });
    // one control was DELETED on purpose since that recording: the entity-card scope pick (2026-09-17)
    const RAILCTL_REMOVED = ['data-cmdscope'];
    const lost = RAILCTL_9b163fc.filter(a => live.indexOf(a) < 0);
    const added = live.filter(a => RAILCTL_9b163fc.indexOf(a) < 0);
    ok(lost.join(',') === RAILCTL_REMOVED.join(','),
      `of the ${RAILCTL_9b163fc.length} controls the rail carried before the regroup, the only one gone is the entity card's scope pick — deleted by ruling, not mislaid`, lost.join(','));
    // and the controls ADDED on purpose since that recording, each named with what it belongs to
    const RAILCTL_ADDED = ['data-dstgempty', 'data-dstgplace'];   /* the stage blocks' placement and empty-stage dials (2026-09-17) */
    const STRUCTURE = ['data-frame', 'data-region', 'data-rg'];   /* not controls: the block's region, the frame-dial wrapper, each label's region tag */
    ok(added.join(',') === RAILCTL_ADDED.concat(STRUCTURE).sort().join(','),
      'and everything added is either a named new control or a structure tag — nothing arrived unaccounted for', added.join(',')); }

  // every block says which region it reaches, in a glyph and in words
  { const hd = await p.$$eval('#rt-controls .barblk', els => els.map(e => ({ id: e.id, region: e.dataset.region,
      glyph: (e.querySelector('.bhl .bhi svg') || {}).childElementCount || 0,
      name: (e.querySelector('.bhl b') || {}).textContent,
      note: (e.querySelector('.bhl .bhn') || {}).textContent,
      ink: getComputedStyle(e.querySelector('.bhl .bhn')).color,
      topic: !!e.querySelector('.bhl .bht svg') })));
    ok(hd.map(x => x.region).join(',') === 'bench,head,tabs,middle,middle,middle,middle,portrait,command',
      'every block declares its region — the three topic blocks are the MIDDLE, read when that topic is open', hd.map(x => x.region).join(','));
    ok(hd.every(x => x.glyph > 0), 'and draws that region\'s glyph before its name', JSON.stringify(hd.filter(x => !x.glyph)));
    ok(hd.every(x => /^affects: /.test(x.note)), 'every header note begins "affects:" — never silent about what it reaches',
      hd.map(x => x.note).join(' | ').slice(0, 130));
    const muted = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--muted)';
      document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ok(hd.every(x => x.ink === muted), 'drawn in the muted ink, under the block name', hd[0].ink + ' vs ' + muted);
    ok(hd.filter(x => x.topic).map(x => x.id).join(',') === 'blk-data,blk-schemas,blk-functions',
      'a topic block keeps its own glyph beside the name, so the three middles stay apart', hd.filter(x => x.topic).map(x => x.id).join(','));
    const g = await p.$$eval('#rt-controls .barblk .bhl .bhi svg', els => els.map(e => e.innerHTML.length));
    ok(new Set(g.slice(0, 4).concat(g.slice(7))).size >= 5, 'the six region glyphs are six different drawings', g.join(',')); }

  // the picks that moved really are in their new block, and nowhere else
  { const at = await p.evaluate(() => { const o = {};
      ['cmdmiddle', 'cmdrows', 'cmdkeep', 'cmdjoin', 'cmdport', 'cmdlayout', 'cmdverbs', 'cmdcolour'].forEach(k => {
        o[k] = [...new Set([...document.querySelectorAll('[data-' + k + ']')].map(e => (e.closest('.barblk') || {}).id))].join('+'); });
      return o; });
    ok(at.cmdmiddle === 'blk-middle' && at.cmdrows === 'blk-middle' && at.cmdkeep === 'blk-middle' && at.cmdjoin === 'blk-middle',
      'the four dials a chosen ending drives on the middle sit in the MIDDLE block, once', JSON.stringify(at));
    ok(at.cmdport === 'blk-portrait', 'what the portrait leads with sits in the PORTRAIT block', at.cmdport);
    ok(at.cmdlayout === 'blk-command' && at.cmdverbs === 'blk-command' && at.cmdcolour === 'blk-command',
      'and what shapes the command region stayed where it was', JSON.stringify(at)); }

  // the part bars became the middle block's first group. The roster sweep above forced every fold open
  // in the DOM, so the rails are rebuilt from their own state before the boot fold state is read.
  await p.evaluate(() => { window.drawMidCfg(); window.drawPortCfg(); }); await p.waitForTimeout(200);
  { const f = await p.$$eval('#midcfg .cffold', els => els.map(e => e.dataset.group + (e.classList.contains('open') ? ':open' : ':folded')));
    ok(f.join(' ') === 'bars:open label:folded', 'the middle block is two folds — the part bars first, open at boot', f.join(' '));
    ok(await p.evaluate(() => !!document.querySelector('#blk-middle #partcfg')), 'and #partcfg lives inside it now, not in a block of its own');
    ok((await p.$$('#partcfg .prow')).length === 6, 'with all six part rows still drawn'); }
  { const f = await p.$$eval('#portcfg .cffold', els => els.map(e => e.dataset.group + (e.classList.contains('open') ? ':open' : ':folded')));
    ok(f.join(' ') === 'select:open size:folded', 'the portrait block is two folds — what it shows, then how big it stands', f.join(' ')); }

  // a moved pick changes EXACTLY ONE clause of exactly one line (the folds open first — every region
  // rail folds the way the data rail does now, so a folded pick is genuinely display:none)
  await p.evaluate(() => { window.railFoldAll('mid', true); window.railFoldAll('port', true); }); await p.waitForTimeout(200);
  { const read = () => p.evaluate(() => ({ c: window.COPYTXT.command(), m: window.COPYTXT.middle(), p: window.COPYTXT.portrait() }));
    const BASE = await read();
    const clauses = t => t.split(' · ');
    for (const [sel, line, was, now] of [['#midcfg [data-cmdmiddle="filter"]', 'm', 'label dim .28', 'label filter'],
                                         ['#midcfg [data-cmdkeep="cleared"]', 'm', 'on part switch kept', 'on part switch cleared'],
                                         ['#portcfg [data-cmdport="split"]', 'p', 'on select path record', 'on select split']]) {
      const before = await read();
      await p.click(sel); await p.waitForTimeout(220);
      const after = await read();
      const db = clauses(before[line]), da = clauses(after[line]);
      const diff = db.map((x, i) => x === da[i] ? null : x + ' → ' + da[i]).filter(Boolean);
      ok(diff.length === 1 && diff[0] === was + ' → ' + now, `${sel} changes exactly one clause of the ${line} line`, diff.join(' | '));
      const others = Object.keys(before).filter(k => k !== line);
      ok(others.every(k => before[k] === after[k]), 'and leaves the other two region lines untouched',
        others.map(k => k + (before[k] === after[k] ? '=' : '≠')).join(' ')); }
    await p.evaluate(() => { Object.assign(window.CMD, { middle: 'dim', keep: 'kept', portrait: 'path' });
      window.drawMidCfg(); window.drawPortCfg(); window.drawCmd(); window.showTab('data'); window.drawPortrait(); });
    await p.waitForTimeout(240);
    const back = await read();
    ok(back.c === BASE.c && back.m === BASE.m && back.p === BASE.p,
      'and all three come back to the lines this section started on — a pick moved, nothing else did',
      ['c' + (back.c === BASE.c), 'm' + (back.m === BASE.m), 'p' + (back.p === BASE.p)].join(' ')); }

  // the frame dials still reach what they size, from their new homes
  { await p.evaluate(() => { window.FRAME.portW = 300; window.applyFrame(); }); await p.waitForTimeout(200);
    ok(Math.round(await p.$eval('#port', e => e.getBoundingClientRect().width)) === 300, 'the portrait width still sizes the portrait, from the PORTRAIT block');
    ok(/width 300px/.test(await p.evaluate(() => window.COPYTXT.portrait())), 'and its own line says so');
    await p.evaluate(() => { window.FRAME.portW = 440; window.FRAME.cmdW = 280; window.applyFrame(); window.drawCmdCfg(); }); await p.waitForTimeout(200);
    ok(Math.round(await p.$eval('#cmd', e => e.getBoundingClientRect().width)) === 280, 'the command width sizes the command region, from the COMMAND block');
    ok(/region 280px/.test(await p.evaluate(() => window.COPYTXT.command())), 'and the command line carries it');
    await p.evaluate(() => { window.FRAME.cmdW = 360; window.applyFrame(); window.drawCmdCfg(); }); await p.waitForTimeout(160); }


  // ── A REGION TAG AFTER EVERY CONTROL'S NAME (operator 2026-09-17: "labels at the end that say whether
  //    the setup changes the middle panel, the portrait panel, or the command panel — clarity about each
  //    one of the controls"). Every row, no exceptions; the override map where a control draws elsewhere. ──
  { const t = await p.evaluate(() => { const ls = [...document.querySelectorAll('#rt-controls .cfl')];
      return { labels: ls.length, tagged: ls.filter(e => e.querySelector('.rgts .rgt')).length,
        untagged: ls.filter(e => !e.querySelector('.rgts .rgt')).map(e => e.textContent.trim()).slice(0, 6),
        glyphs: ls.every(e => [...e.querySelectorAll('.rgt')].every(g => g.querySelector('svg') && g.querySelector('svg').childElementCount > 0)),
        regions: [...new Set(ls.map(e => e.dataset.rg).join(' ').split(' '))].filter(Boolean).sort().join(',') }; });
    ok(t.labels > 100 && t.tagged === t.labels,
      `every one of the ${t.labels} control rows on the rail carries a region tag — no exceptions`, t.untagged.join(' | '));
    ok(t.glyphs, 'each tag is a drawn glyph, not a word');
    ok(t.regions === 'bench,command,head,middle,portrait,tabs', 'and the tags name only the six regions', t.regions); }
  { const sz = await p.$$eval('#rt-controls .cfl .rgt svg', els => [...new Set(els.map(e => e.getAttribute('width')))]);
    ok(sz.join(',') === '14', 'every tag is drawn at 14px', sz.join(','));
    const muted = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--muted)';
      document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ok(await p.$eval('#rt-controls .cfl .rgt', e => getComputedStyle(e).color) === muted, 'in the muted ink');
    const tag = await p.$('#midcfg .cfl[data-rg] .rgt'); await tag.hover(); await p.waitForTimeout(170);
    const h = await p.$eval('#hover', e => e.innerText);
    ok(/is what this control changes/.test(h) && /the (middle panel|command panel|portrait|bench|head bar|part buttons)/.test(h),
      'and answers a hover with one plain line naming the region it changes', h.replace(/\s+/g, ' ').slice(0, 70));
    await p.mouse.move(5, 1030); }

  // the override map, spot-checked where it says a control reaches past its own block
  { const rg = await p.evaluate(() => { const o = {};
      const labOf = n => { let e = n; while (e && e !== document.body) { const pv = e.previousElementSibling;
        if (pv && pv.classList && pv.classList.contains('cfl')) return pv; e = e.parentElement; } return null; };
      ['cmdlayout', 'cmdside', 'cmdladder', 'cmdshow', 'cmdrows', 'cmdjoin', 'cmdport', 'cmdmiddle', 'dstgaxis', 'casemode', 'variant'].forEach(k => {
        const b2 = document.querySelector('[data-' + k + ']'), l = b2 && labOf(b2);
        o[k] = l ? l.dataset.rg : null; });
      return o; });
    ok(rg.cmdlayout === 'command bench', 'cmdlayout is tagged command AND bench — `strip` draws the path cells inside the bench', rg.cmdlayout);
    ok(rg.cmdjoin === 'middle command', 'test join is tagged middle AND command — the marks in the middle and the card\'s tests badge', rg.cmdjoin);
    ok(rg.cmdladder === 'command portrait', 'ladder place is tagged command AND portrait', rg.cmdladder);
    ok(rg.cmdside === 'command bench portrait', 'card side is tagged with the whole row it moves through', rg.cmdside);
    ok(rg.cmdshow === 'command head bench', 'sections is tagged with the head bar and the bench — the chip and the strip live there', rg.cmdshow);
    ok(rg.cmdrows === 'middle command', 'rows is tagged with both places the per-path facts can go', rg.cmdrows);
    ok(rg.cmdport === 'portrait', 'on select is the portrait and nothing else', rg.cmdport);
    ok(rg.cmdmiddle === 'middle', 'a control that agrees with its block still carries the one tag', rg.cmdmiddle);
    ok(rg.dstgaxis === 'middle', 'a topic block\'s dial is the middle', rg.dstgaxis);
    ok(rg.casemode === 'tabs', 'and a part-button dial stays its own region', rg.casemode);
    ok(rg.variant === 'middle', 'the part-bar distributions are the middle', rg.variant); }

  // NO LABEL WRAPS at the rail's own width — the letter-spacing gives first, the tag never does
  { const w = await p.evaluate(() => Math.round(document.getElementById('notes').getBoundingClientRect().width));
    ok(w === 474, 'the rail is 474px wide', String(w));
    const bad = await p.evaluate(() => [...document.querySelectorAll('#rt-controls .cfl')]
      .filter(e => e.getBoundingClientRect().height > 26)
      .map(e => e.textContent.trim() + '=' + Math.round(e.getBoundingClientRect().height)));
    ok(bad.length === 0, 'not one label on the rail wraps onto a second line, tags and all', bad.slice(0, 5).join(' | '));
    const tight = await p.$$eval('#rt-controls .cfl.tight', els => els.map(e => e.textContent.trim()));
    ok(tight.length > 0 && await p.$$eval('#rt-controls .cfl.tight', els => els.every(e => getComputedStyle(e).letterSpacing === 'normal')),
      'the long labels drop their letter-spacing to fit — and only those', tight.slice(0, 4).join(' | '));
    const tagW = await p.$$eval('#rt-controls .cfl .rgt svg', els => [...new Set(els.filter(e => e.getClientRects().length)
      .map(e => Math.round(e.getBoundingClientRect().width)))]);
    ok(tagW.join(',') === '14', 'and every drawn tag is still its full 14px, in a tight label as in any other', tagW.join(',')); }

  if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true });
    await p.evaluate(() => { window.railTab('controls'); window.railFoldBoot();
      document.querySelectorAll('.barblk').forEach(x => x.classList.remove('min'));
      window.railFoldAll('mid', true); });
    await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); await p.waitForTimeout(260);
    await p.evaluate(() => { document.querySelectorAll('#rt-controls .barblk').forEach(x => { x.hidden = x.id !== 'blk-middle'; }); });
    await p.waitForTimeout(220);
    await (await p.$('#notes')).screenshot({ path: path.join(shotsAt, 'eplab-rail-tags-middle.png') });
    await p.evaluate(() => { document.querySelectorAll('#rt-controls .barblk').forEach(x => { x.hidden = x.id !== 'blk-command'; });
      window.railFoldBoot(); });
    await p.waitForTimeout(240);
    await (await p.$('#notes')).screenshot({ path: path.join(shotsAt, 'eplab-rail-tags-command.png') });
    await p.evaluate(() => document.querySelectorAll('#rt-controls .barblk').forEach(x => { x.hidden = false; })); }

  if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true });
    // the rail as it BOOTS: every block open so the grouping reads, every fold back to its boot state
    await p.evaluate(() => { window.railTab('controls'); window.railFoldBoot();
      Object.assign(window.CMD, { verbs: 'g2', grp: null, mode: 'cmd', middle: 'dim', rows: 'command', keep: 'kept', join: 'exact', portrait: 'path' });
      Object.keys(window.PANELS).forEach(k => window.showVariant(k, window.PANELS[k].defaultVariant || window.PANELS[k].variants[0].key));
      window.showTab('data');
      window.drawCmdCfg(); window.drawMidCfg(); window.drawPortCfg(); window.drawCmd();
      document.querySelectorAll('.barblk').forEach(x => x.classList.remove('min')); });
    await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); await p.waitForTimeout(240);
    for (const [name, ids] of [['top', ['blk-bench', 'blk-head', 'blk-tabs', 'blk-middle']],
                               ['middle', ['blk-data', 'blk-schemas', 'blk-functions', 'blk-portrait']],
                               ['bottom', ['blk-command']]]) {
      await p.evaluate(keep => { document.querySelectorAll('#rt-controls .barblk').forEach(x => { x.hidden = keep.indexOf(x.id) < 0; }); }, ids);
      await p.waitForTimeout(220);
      await (await p.$('#notes')).screenshot({ path: path.join(shotsAt, `eplab-rail-${name}.png`) }); }
    await p.evaluate(() => document.querySelectorAll('#rt-controls .barblk').forEach(x => { x.hidden = false; })); }
  await p.evaluate(() => { document.querySelectorAll('.barblk').forEach(x => { if (x.id !== window.OPENBLK) x.classList.add('min'); }); });
  await p.waitForTimeout(140);
  await p.evaluate(() => document.querySelectorAll('.barblk.min').forEach(x => x.classList.remove('min')));
  await p.waitForTimeout(140);
}

// ── DATA · STAGE BLOCKS (operator 2026-09-17: "the blocks are the perfect representation of each table;
//    we keep that. The endpoint has stages: show the tables throughout those stages"). The SAME block, in
//    bands on the standard spine; a stage's card states what BELONGS there, never what it found. ──
{
  const errsBefore = errs.length;
  await p.evaluate(() => { window.railTab('controls'); });
  await p.click('#boxes .ib[data-box="work"]');
  await p.evaluate(() => { window.clearPath(); Object.assign(window.DATACFG.stages, { axis: 'rows', placement: 'every', empty: 'shown' });
    window.showVariant('data', 'stageblocks'); window.showTab('data'); window.drawDataCfg(); });
  await p.waitForTimeout(380);

  ok(await p.evaluate(() => window.PANELS.data.defaultVariant) === 'stageblocks',
    'the STAGE BLOCKS are the Data default — the blocks, by stage');
  { const g = await p.$$eval('#panel .sbgrp', els => els.map(e => e.dataset.stage));
    ok(g.join(' → ') === 'EDGE → GATE → INPUT → HANDLER → EFFECTS → ANSWER',
      'six stage groups, the standard spine in request order', g.join(' → '));
    const open = await p.$$eval('#panel .sbgrp.open', els => els.map(e => e.dataset.stage).sort());
    ok(open.join(',') === 'ANSWER,EDGE,INPUT', 'EDGE, INPUT and ANSWER are OPEN bands — no table belongs there',
      open.join(','));
    const held = await p.$$eval('#panel .sbgrp:not(.open)', els => els.map(e => e.dataset.stage + ':' + e.querySelectorAll('.blk').length));
    ok(/^GATE:\d+,HANDLER:\d+,EFFECTS:\d+$/.test(held.join(',')) && held.every(x => +x.split(':')[1] > 0),
      'and GATE, HANDLER and EFFECTS hold the blocks', held.join(',')); }

  // ── THE BLOCK IS THE BLOCKS DISTRIBUTION'S OWN — built by one builder, so it cannot drift ──
  { const mine = await p.$$eval('#panel .sbgrp .blk:not(.hollow)', els => { const o = {};
      els.forEach(e => { if (!o[e.dataset.table]) o[e.dataset.table] = { cls: e.className.replace(/ ?sel/, ''),
        lines: [...e.querySelectorAll('.bkti .bkln')].map(l => [...l.querySelectorAll('.bkcol')].map(c =>
          [...c.childNodes].filter(n => !(n.classList && (n.classList.contains('bkxp') || n.classList.contains('bchip') || n.classList.contains('fchip') || n.classList.contains('sbtick'))))
            .map(n => (n.textContent || '').replace(/\s+/g, ' ').trim()).join(' ')).join(' ~ ')).join(' | '),
        sqs: e.querySelectorAll('.sqs .sq').length, flds: e.querySelectorAll('.bkfl .fld').length }; }); return o; });
    await p.evaluate(() => { window.showVariant('data', 'blocks'); }); await p.waitForTimeout(320);
    const theirs = await p.$$eval('#panel .bkbody .blk', els => { const o = {};
      els.forEach(e => { o[e.dataset.table] = { cls: e.className.replace(/ ?sel/, ''),
        lines: [...e.querySelectorAll('.bkti .bkln')].map(l => [...l.querySelectorAll('.bkcol')].map(c =>
          [...c.childNodes].filter(n => !(n.classList && (n.classList.contains('bkxp') || n.classList.contains('bchip') || n.classList.contains('fchip') || n.classList.contains('sbtick'))))
            .map(n => (n.textContent || '').replace(/\s+/g, ' ').trim()).join(' ')).join(' ~ ')).join(' | '),
        sqs: e.querySelectorAll('.sqs .sq').length, flds: e.querySelectorAll('.bkfl .fld').length }; }); return o; });
    const names = Object.keys(mine);
    ok(names.length > 5 && names.every(t => theirs[t] && theirs[t].cls === mine[t].cls),
      `all ${names.length} stage blocks carry the Blocks distribution's own class list, table for table`,
      names.filter(t => !theirs[t] || theirs[t].cls !== mine[t].cls).join(','));
    ok(names.every(t => theirs[t].lines === mine[t].lines),
      'and its title lines, word for word, once the stage extra is set aside — the rail arranged them once',
      names.filter(t => theirs[t].lines !== mine[t].lines).slice(0, 2).map(t => mine[t].lines + ' VS ' + theirs[t].lines).join(' / '));
    ok(names.every(t => theirs[t].sqs === mine[t].sqs && theirs[t].flds === mine[t].flds),
      'and the same field marks and the same field list', JSON.stringify(names.filter(t => theirs[t].sqs !== mine[t].sqs)));
    await p.evaluate(() => { window.showVariant('data', 'stageblocks'); }); await p.waitForTimeout(320); }

  // ── THE STAGE HEADER states the EXPECTATION, and one measured row beside it ──
  const EXPECT = await p.evaluate(() => window.STAGE_EXPECT.data);
  for (const st of ['EDGE', 'GATE', 'HANDLER', 'EFFECTS']) {
    await p.hover(`#panel .sbgrp[data-stage="${st}"] .sbhd`); await p.waitForTimeout(170);
    const h = (await p.$eval('#hover', e => e.innerText)).replace(/\s+/g, ' ');
    ok(h.indexOf(EXPECT[st]) >= 0, `the ${st} card carries its expectation line, verbatim`, h.slice(0, 110));
    ok(/ON THIS DOOR/i.test(h), 'and ONE measured row beside it — what is here, never a grade', h.slice(0, 90));
    await p.mouse.move(5, 1030); }
  { const words = await p.evaluate(() => Object.keys(window.STAGE_EXPECT.data).join(','));
    ok(words === 'EDGE,GATE,INPUT,HANDLER,EFFECTS,ANSWER', 'the six lines live in one registry the next topics add beside', words); }

  // ── THE PICKS ──
  // measured INSIDE the wrap, with its scroll parked, so a remembered scroll position can never read as
  // a different picture
  const sbFp = () => p.evaluate(() => { const w = document.querySelector('#panel .sbwrap');
    w.scrollTop = 0; w.scrollLeft = 0; const o = w.getBoundingClientRect();
    return [...document.querySelectorAll('#panel .sbgrp')].map(e => { const r = e.getBoundingClientRect();
      return e.dataset.stage + '@' + Math.round(r.left - o.left) + ',' + Math.round(r.top - o.top)
        + ':' + Math.round(r.width) + 'x' + Math.round(r.height)
        + ':' + [...e.querySelectorAll('.blk')].map(b2 => b2.dataset.table).join('+'); }).join('§'); });
  const nBlocks = () => p.$$eval('#panel .sbgrp .blk', els => els.length);
  { const before = await sbFp(), n = await nBlocks();
    await p.click('#datacfg [data-dstgaxis="cols"]'); await p.waitForTimeout(380);
    ok(await p.evaluate(() => document.querySelector('#panel .sbwrap').dataset.axis) === 'cols', 'axis columns turns the bands into six columns');
    const cols = await p.evaluate(() => { const g = [...document.querySelectorAll('#panel .sbgrp')];
      return { n: g.length, tops: new Set(g.map(e => Math.round(e.getBoundingClientRect().top))).size }; });
    ok(cols.n === 6 && cols.tops === 1, 'six of them, side by side on one line', JSON.stringify(cols));
    ok(await sbFp() !== before, 'it is a different picture');
    ok(await nBlocks() === n, 'with exactly the same blocks in it', (await nBlocks()) + ' vs ' + n);
    ok(await p.$eval('#panel', e => e.scrollWidth <= e.clientWidth + 1), 'and the PANEL never scrolls sideways — the columns do, inside themselves');
    await p.click('#datacfg [data-dstgaxis="rows"]'); await p.waitForTimeout(380);
    { const now = await sbFp();
      ok(now === before, 'and the bands come back exactly',
        now.split('§').filter((x, i) => x !== before.split('§')[i]).join(' | ').slice(0, 160)); } }
  { const n = await nBlocks();
    const tables = await p.evaluate(() => new Set([...document.querySelectorAll('#panel .sbgrp .blk')].map(e => e.dataset.table)).size);
    await p.click('#datacfg [data-dstgplace="first"]'); await p.waitForTimeout(380);
    ok(await nBlocks() === tables, `first touch draws one block per table — ${tables}, not ${n}`, String(await nBlocks()));
    ok((await p.$$('#panel .sbtick')).length > 0, 'and ticks the stages it is ALSO touched at');
    await p.hover('#panel .sbtick'); await p.waitForTimeout(170);
    ok(/also at/i.test(await p.$eval('#hover', e => e.innerText)), 'whose card names them');
    await p.mouse.move(5, 1030);
    await p.click('#datacfg [data-dstgplace="every"]'); await p.waitForTimeout(380);
    ok(await nBlocks() === n, 'every touch puts them back', String(await nBlocks())); }
  { await p.click('#datacfg [data-dstgempty="hidden"]'); await p.waitForTimeout(340);
    const g = await p.$$eval('#panel .sbgrp', els => els.map(e => e.dataset.stage));
    ok(g.join(',') === 'GATE,HANDLER,EFFECTS', 'empty hidden drops the three stages no table belongs to', g.join(','));
    await p.click('#datacfg [data-dstgempty="shown"]'); await p.waitForTimeout(340);
    ok((await p.$$('#panel .sbgrp')).length === 6, 'and shown brings them back as open bands'); }

  // ── A LABEL: the consent 409 ──
  { const cons = await p.evaluate(() => window.LABEP.forms.paths.find(x => x.names.drawn === 'consent required').id);
    await p.evaluate(id => window.selectPath(id), cons); await p.waitForTimeout(420);
    const gate = await p.$$eval('#panel .sbgrp[data-stage="GATE"] .blk', els => els.map(e => e.dataset.table));
    ok(gate.indexOf('users') >= 0, 'the consent 409 holds users at the GATE — provisioned before the body was read', gate.join(','));
    const hand = await p.$$eval('#panel .sbgrp[data-stage="HANDLER"] .blk', els => els.map(e => e.dataset.table));
    const want = await p.evaluate(id => { const p2 = window.LABEP.forms.paths.find(x => x.id === id), o = new Set();
      (p2.effects.steps || []).forEach(s => { if (s.table && !s.dependency) o.add(s.table); }); return [...o]; }, cons);
    ok(hand.slice().sort().join(',') === want.slice().sort().join(','),
      'and the HANDLER holds exactly the tables its own code touched', hand.join(',') + ' vs ' + want.join(','));
    const eff = await p.$$eval('#panel .sbgrp[data-stage="EFFECTS"] .blk', els => els.map(e => e.dataset.table + '[' +
      [...e.querySelectorAll('.fchip')].map(c => c.textContent).join(';') + ']'));
    ok(eff.some(x => /^idempotency_keys\[/.test(x) && /rolled back ×/.test(x)),
      'EFFECTS holds idempotency_keys wearing its rolled-back chip — the same chip the Blocks projection draws', eff.join(' '));
    ok((await p.$$('#panel .blk .bkxp')).length === 0, 'and with a label in force the union counts are gone — one ending, not a tally');
    await p.evaluate(() => document.body.focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    ok((await p.$$('#panel .blk .bkxp')).length > 0, 'Esc gives the union back, counts and all'); }

  // ── the floor and the fit, both axes, at the dock box ──
  await p.evaluate(() => window.railTab('controls')); await p.click('#boxes .ib[data-box="dock"]'); await p.waitForTimeout(340);
  for (const ax of ['rows', 'cols']) {
    await p.evaluate(a => { window.DATACFG.stages.axis = a; window.applyData(); window.showTab('data'); }, ax);
    await p.mouse.move(5, 1030); await p.waitForTimeout(320);
    // the two title chips the operator sized under the floor ON PURPOSE are counted apart, exactly as the
    // page-wide floor check counts them — a block is a block, wherever it is drawn
    const fl = await p.evaluate(() => { let n = 0, worst = 99, chosen = 0; const B = window.DATACFG.bk;
      document.querySelectorAll('#panel *').forEach(el => { if (!el.offsetParent) return;
        const t = el.childNodes && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return;
        const fs2 = parseFloat(getComputedStyle(el).fontSize); if (fs2 >= 12) return;
        const part = el.closest('.bkhd .bkrw') ? 'rw' : el.closest('.bkhd .bkn') ? 'count' : null;
        if (part && (B.size[part] || 12) < 12 && Math.round(fs2) === B.size[part]) { chosen++; return; }
        n++; worst = Math.min(worst, fs2); });
      return { under: n, worst, chosen }; });
    ok(fl.under === 0, `nothing in the stage blocks goes under 12px at the dock box, bar the two chips the operator sized there — axis ${ax}`, JSON.stringify(fl));
    const d = await p.$eval('#panel', e => ({ w: e.clientWidth, sw: e.scrollWidth, h: e.clientHeight, sh: e.scrollHeight }));
    ok(d.sw <= d.w + 1 && d.sh <= d.h + 1, `and it fits the dock box — axis ${ax}`, JSON.stringify(d)); }
  await p.click('#boxes .ib[data-box="work"]'); await p.evaluate(() => { window.DATACFG.stages.axis = 'rows'; window.applyData(); window.showTab('data'); });
  await p.waitForTimeout(320);

  if (shotsAt) { fs.mkdirSync(shotsAt, { recursive: true });
    const shot = async (n2) => { await p.mouse.move(5, 1030); await p.evaluate(() => window.hoverHide()); await p.waitForTimeout(240);
      await (await p.$('#bench')).screenshot({ path: path.join(shotsAt, n2) }); };
    await shot('eplab-stageblocks-rows.png');
    await p.evaluate(() => { window.DATACFG.stages.axis = 'cols'; window.applyData(); window.showTab('data'); }); await p.waitForTimeout(340);
    await shot('eplab-stageblocks-cols.png');
    await p.evaluate(() => { window.DATACFG.stages.axis = 'rows'; const f = window.LABEP.forms;
      window.selectPath(f.paths.find(x => x.names.drawn === 'consent required').id); }); await p.waitForTimeout(420);
    await shot('eplab-stageblocks-consent409.png');
    await p.evaluate(() => window.clearPath()); await p.waitForTimeout(340);
    await p.hover('#panel .sbgrp[data-stage="GATE"] .sbhd'); await p.waitForTimeout(260);
    await (await p.$('#bench')).screenshot({ path: path.join(shotsAt, 'eplab-stageblocks-stagecard.png') });
    await p.mouse.move(5, 1030); }
  await p.evaluate(() => { window.clearPath(); Object.assign(window.DATACFG.stages, { axis: 'rows', placement: 'every', empty: 'shown' });
    window.showVariant('data', 'blocks'); window.showTab('data'); window.drawDataCfg(); });
  await p.waitForTimeout(280);
  ok(errs.length === errsBefore, 'the stage blocks raise no page error anywhere in this section', errs.slice(errsBefore, errsBefore + 3).join(' | '));
}

// the checks file
if (checksFile) {
  const checks = JSON.parse(fs.readFileSync(checksFile, 'utf8'));
  for (const c of checks) {
    if (c.tab) { await p.click(`#tabs .tab[data-tab="${c.tab}"]`); await p.waitForTimeout(120); }
    if (c.kind === 'text') { const t = await p.$eval('#panel', e => e.innerText); ok(t.includes(c.arg), c.name, 'missing text ' + JSON.stringify(c.arg)); }
    else if (c.kind === 'selector') { const n = (await p.$$(c.arg)).length; ok(n >= (c.min || 1), c.name, c.arg + ' → ' + n); }
    else if (c.kind === 'eval') { const v = await p.evaluate(c.arg); ok(!!v, c.name, String(v)); }
    else if (c.kind === 'hover') { const el = await p.$(c.arg); ok(el !== null, c.name + ' (anchor exists)', c.arg); if (el) { await el.hover(); await p.waitForTimeout(120); const h = await p.$eval('#hover', e => e.hidden ? '' : e.innerText); ok(h.includes(c.expect), c.name, 'hover card lacks ' + JSON.stringify(c.expect)); } }
  }
}
const cov = await p.evaluate(() => window.COV.state());
const covered = Object.keys(cov).filter(k => cov[k].length), missing = Object.keys(cov).filter(k => !cov[k].length);
console.log(`coverage: ${covered.length}/${Object.keys(cov).length} station rows rendered · missing: ${missing.join(', ') || 'none'}`);
await b.close();
console.log(`eplab probe: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
