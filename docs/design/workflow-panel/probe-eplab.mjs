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
   'data · shown as blocks · tables all · title counts tables icon, fields icon, ops icon · sort channel, icon, accent on panel 45% · pills each, shape pill, text ink, ground kind 15%'
   + ' · block block (icon on model, chip on, name on, entity both, count badge, model both) · edge left solid 2px · chips count pill 100%, channel pill 90%'
   + ' · lines icon name | — / ent | count rw / model | — · sizes icon 13 rw 11 name 13 ent 12 count 11 model 12'
   + ' · squares 14px gap 4 round as symbol by type, optional marked, unique marked, emphasis 75% ±30 · footer hint | id text num flag time list other opt, both · grounds by size, width flex, tiles stack'
   + ' · drawn counts shapes rw commit ev mdl ents legend · hidden title note',
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
{ const fl = await floor();
  ok(fl.under === 0 && fl.chosen > 0 && await p.evaluate(() => window.DATACFG.bk.size.rw < 12 && window.DATACFG.bk.size.count < 12),
     'the only text under 12px is the two title chips the operator sized there on purpose — named, not hidden', JSON.stringify(fl)); }
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
// ══ THE THREE PILLS (operator 2026-09-13): centred on the cap height, a shape dial, the settled colour dials
//    folded away, and a card per pill on the head bar's hover law ══
{ await p.evaluate(() => { window.showTab('data'); window.showVariant('data', 'blocks'); }); await p.waitForTimeout(320);
  // THE RAIL IS A STACK OF FOLDS (operator 2026-09-13) — every group closed at boot except the one being tuned
  { const g = await p.$$eval('#datacfg > .cffold', els => els.map(e => ({ k: e.dataset.group, open: e.classList.contains('open'),
      body: getComputedStyle(e.querySelector('.cffoldbody')).display, sum: (e.querySelector('.cffoldhd .sum') || {}).textContent })));
    ok(g.map(x => x.k).join(',') === 'layout,sections,channels,sort,counts,pills,block,edge,lines,marks,foot,grounds',
       'the data rail is twelve named groups — the chips inside BLOCK TITLE, the new FOOTER ROW before grounds', g.map(x => x.k).join(','));
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
  // SHOWN AS
  const face = () => p.$eval('#panel .bkfoot .ftp[data-part="id"]', e => ({ icon: getComputedStyle(e.querySelector('.fti')).display !== 'none', word: getComputedStyle(e.querySelector('.ftw')).display !== 'none' }));
  { const f = await face(); ok(f.icon && f.word, 'the parts boot as icon AND words', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-foot-show="icon"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(f.icon && !f.word, 'ICON shows the mark alone', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-foot-show="text"]'); await p.waitForTimeout(260);
  { const f = await face(); ok(!f.icon && f.word, 'TEXT shows the words alone', JSON.stringify(f)); }
  await p.click('#datacfg .ib[data-foot-show="both"]'); await p.waitForTimeout(260);
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
  ok(/footer hint \| id text num flag time list other opt, both/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names the footer row');
  await p.evaluate(() => { window.FOLDS.foot = 0; window.drawDataCfg(); }); await p.mouse.move(5, 1030); await p.waitForTimeout(200); }

// ══ FIELD-MARK EMPHASIS (operator 2026-09-13): ONE opacity bar — optional below the standard stop, unique above it
//    with an accent ring — measured on the drawn marks ══
{ await p.evaluate(() => { window.FOLDS.marks = 1; window.showTab('data'); window.showVariant('data', 'blocks'); window.drawDataCfg(); }); await p.waitForTimeout(320);
  const ops = () => p.evaluate(() => { const a = sel => [...document.querySelectorAll('#panel .blk .bkhd .sq' + sel)].map(e => +(+getComputedStyle(e).opacity).toFixed(2));
    return { std: a(':not(.opt):not(.uq)'), opt: a('.opt:not(.uq)'), uq: a('.uq'), ring: [...document.querySelectorAll('#panel .blk .bkhd .sq.uq')].map(e => getComputedStyle(e).boxShadow) }; });
  { const o = await ops();
    ok(o.std.length > 0 && o.std.every(v => v === 0.75), 'a standard field mark sits at 75% on the bar', JSON.stringify(o.std.slice(0, 4)));
    ok(o.opt.length > 0 && o.opt.every(v => v === 0.45), 'an optional one sits further DOWN, at 45% — today\'s value', JSON.stringify(o.opt.slice(0, 4)));
    ok(o.uq.length > 0 && o.uq.every(v => v === 1) && o.ring.every(r => r && r !== 'none'), 'a unique one sits further UP, at 100%, with an accent ring', JSON.stringify({ uq: o.uq.slice(0, 4), ring: o.ring[0] })); }
  await p.focus('#datacfg .sldt[aria-label="standard field mark opacity"]'); for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowLeft');
  await p.focus('#datacfg .sldt[aria-label="emphasis spread"]'); for (let i = 0; i < 2; i++) await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(260);
  { const o = await ops();
    ok(o.std.every(v => v === 0.6) && o.opt.every(v => v === 0.4) && o.uq.every(v => v === 0.8), 'the two bars move all three stops together — 40% · 60% · 80%', JSON.stringify({ s: o.std[0], o: o.opt[0], u: o.uq[0] })); }
  { const sc = await p.$$eval('#datacfg .sqscale i[data-stop]', els => els.map(e => ({ k: e.dataset.stop, left: parseFloat(e.style.left) })));
    ok(sc.map(x => x.k).join(',') === 'opt,std,uq' && sc[0].left === 40 && sc[1].left === 60 && sc[2].left === 80, 'the rail draws the three stops where they sit on one bar', JSON.stringify(sc)); }
  await p.click('#datacfg .ib[data-sq-uq="0"]'); await p.waitForTimeout(260);
  { const o = await ops(); ok(o.uq.every(v => v === 0.6) && o.ring.every(r => r === 'none'), 'switching unique off returns those marks to the standard stop', JSON.stringify({ u: o.uq[0], r: o.ring[0] })); }
  await p.evaluate(() => { Object.assign(window.DATACFG, { sqBase: 75, sqStep: 30, sqUq: 1 }); window.FOLDS.marks = 0; window.applyData(); window.showTab('data'); window.drawDataCfg(); });
  await p.waitForTimeout(260);
  ok(/unique marked, emphasis 75% ±30/.test(await p.evaluate(() => window.COPYTXT.data())), 'the copy line names the emphasis'); }

// the tests below were written against the station chip's look with every dial in reach — give them that baseline
await p.evaluate(() => { Object.assign(window.DATACFG, { countPills: 'one', pillInk: 'white', pillBg: 'accent', pillAlpha: 100, sqEnc: 'colour', sqSize: 11, sqGap: 2, sqBase: 100, sqStep: 55, sqUq: 0 });
  Object.assign(window.DATACFG.bk, { count: 'words', model: 'word',
    rows: [{ l: ['icon', 'rw', 'name', 'ent', 'count', 'model'], r: [] }, { l: [], r: [] }, { l: [], r: [] }] });
  window.DATACFG.show.title = 1; window.applyData(); window.showTab('data'); window.foldAll(true); window.drawDataCfg(); });
await p.waitForTimeout(320);

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
    const meter = async () => { await p.waitForTimeout(120); return p.evaluate(() => ({ read: +document.getElementById('pillread').dataset.ratio, pc: window.pillContrast() })); };
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
