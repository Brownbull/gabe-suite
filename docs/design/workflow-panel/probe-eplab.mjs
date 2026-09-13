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
   'data · shown as blocks · tables all · title counts tables icon, fields icon, ops icon'
   + ' · block block (icon on model, chip on, name on, entity word, count words, model word)'
   + ' · lines icon rw name ent count model | — / — | — / — | — · sizes icon 13 rw 12 name 13 ent 12 count 12 model 12'
   + ' · squares 11px gap 2 round as colour by type, optional marked · grounds by size, width flex, tiles stack'
   + ' · drawn title counts shapes rw commit ev mdl ents legend · hidden note',
   'the data panel boots on the operator\'s default line', await p.evaluate(() => window.COPYTXT.data()));

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
const floor = async () => p.evaluate(() => { let n = 0, worst = 99; document.querySelectorAll('#bench *').forEach(el => { if (!el.offsetParent && el.tagName !== 'BODY') return; const t = el.childNodes && [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()); if (!t) return; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) { n++; worst = Math.min(worst, fs); } }); return { under: n, worst }; });
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
  ok(blks.length === 6, 'six control blocks', blks.join(','));
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
{ const subs = await p.$$eval('#framecfg .cfsub', els => els.map(e => e.firstChild.textContent.trim()));
  ok(subs.join(',') === 'the bench,head bar,part buttons,the portrait panel', 'the frame block names the four things it frames', subs.join(','));
  const labels = await p.$$eval('#framecfg .cfl', els => els.map(e => e.textContent));
  ok(labels.join(',') === 'outline,pattern,height,outline,pattern,divider,pattern,gap after,row,button,outline,pattern,divider,pattern,gap after,width,height,outline,pattern,gap',
     'twenty dials: a box height per row, the button, the portrait panel, and every line', labels.join(','));
  ok(await p.$$eval('#framecfg .sld', els => els.length === 14), 'every RANGE is a dragged bar, not a set of steps');
  ok(await p.$$eval('#framecfg .ibwrap .ib', els => els.length === 6 * 4), 'and every line pattern is a button drawing that pattern');
  ok(await p.$$eval('#framecfg .ibwrap .ib svg path', els => els.length >= 5), 'the pattern buttons draw real lines, not words');
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
// ══ THE DATA PANEL's own block (operator 2026-09-12): show or hide each section, and lay the grounds
//    out. Hiding must be REVERSIBLE and must not delete anything — the no-loss law as a measurement. ══
{ await p.click('#railtabs .rtb[data-rt="controls"]'); await p.waitForTimeout(80);
  await p.evaluate(() => window.showVariant('data', 'grounds')); await p.waitForTimeout(200);
  const lay = await p.$$eval('#datacfg .ib[data-dlayout]', els => els.map(e => e.dataset.dlayout));
  ok(lay.join(',') === 'grounds,flow,ledger,fields,blocks', 'the data block carries all five distributions', lay.join(','));
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
    await p.hover('#panel .sechd .cnt'); await p.waitForTimeout(200);
    ok(/one op = one table on one channel/i.test(await p.evaluate(() => document.getElementById('hover').innerText)),
       'and the card still says what an op is, for whoever wants it');
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
    await p.click('#datacfg .ib[data-count-col="kind"]'); await p.waitForTimeout(300);
    ok(await p.$$eval('#panel .sechd .dcnts .dcp', els => new Set(els.map(e => getComputedStyle(e).color)).size === 3),
       'BY WHAT IT COUNTS gives each pill the colour of the thing it counts');
    await p.click('#datacfg .ib[data-count-col="plain"]'); await p.click('#datacfg .ib[data-count-pills="one"]'); await p.waitForTimeout(320); }
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
      ok(await p.$$eval('#panel .plgd .lg .sq.lgm', els => els.length >= 4 && els.every(e => !!e.querySelector('svg'))),
         'the legend draws the MARK it names, in the encoding that is on');
      await p.click('#datacfg .ib[data-sq-enc="colour"]'); await p.click('#datacfg .ib[data-sq-pal="type"]'); await p.waitForTimeout(320);
      ok(await p.$$eval('#panel .plgd .lg .sq.lgm', els => els.every(e => !e.querySelector('svg'))), 'and follows it back to colour'); }
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
ok(blocks.join(',') === 'bench,head bar,part buttons,frame,data panel,part bars', 'the controls tab gives every region its own block', blocks.join(','));
const prows = await p.$$eval('#partcfg .prow', els => els.length);
ok(prows === 6, 'the BARS tab separates the controls per part — one row each', String(prows));
const varBtns = await p.$$eval('#partcfg .ib', els => els.length);
ok(varBtns === 16, 'every distribution is an icon button in its part row', String(varBtns));
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
ok(cpb.length === 6, 'every control block has a COPY button', String(cpb.length));
const lines = await p.evaluate(() => Object.keys(window.COPYTXT).map(k => window.COPYTXT[k]()));
ok(lines.length === 6 && lines.every(l => l.length > 20), 'each copy line names that section\'s selections', lines.join(' // ').slice(0, 160));
ok(/head bar · verbosity .* LEFT .* RIGHT .* off .* styles /.test(lines[1]), 'the head-bar copy line carries verbosity, both piles, what is off, and the per-element styles', lines[1]);
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
