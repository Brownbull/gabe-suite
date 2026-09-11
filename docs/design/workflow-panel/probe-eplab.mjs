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
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__eplabReady===true', { timeout: 20000 }).catch(() => {});
ok(await p.evaluate(() => window.__eplabReady === true), 'the page boots (window.__eplabReady)');
ok(errs.length === 0, 'no page errors', errs.slice(0, 3).join(' | '));
const F = await p.evaluate(() => window.LABEP);
const tabs = await p.$$eval('#tabs .tab', els => els.map(e => e.dataset.tab));
ok(tabs.join(',') === 'data,functions,tests,widening,security', 'five tabs in part order', tabs.join(','));
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
  ok(blks.length === 4, 'four control blocks', blks.join(','));
  const before = await p.evaluate(() => window.COPYTXT.tabs());
  await p.click('#blk-tabs .mnb'); await p.waitForTimeout(120);
  ok(await p.$eval('#blk-tabs', e => e.classList.contains('min')), 'a block folds when its chevron is clicked');
  ok(await p.$eval('#blk-tabs .blkbody', e => getComputedStyle(e).display === 'none'), 'and its body is gone from the rail');
  ok(await p.evaluate(() => window.COPYTXT.tabs()) === before, 'folding changes nothing about what it controls');
  await p.click('#blk-tabs .mnb'); await p.waitForTimeout(120);
  ok(await p.$eval('#blk-tabs .blkbody', e => getComputedStyle(e).display !== 'none'), 'and it opens again'); }
// ── the PART BUTTONS block: ten dials, each one reaching the row ──
{ const rows = await p.$$eval('#tabcfg .cfl', els => els.map(e => e.textContent));
  ok(rows.join(',') === 'colour,intensity,pattern,glyph,glyph shown,count size,count shape,button shape,row,width',
     'ten dials for the part-button row', rows.join(','));
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
  await p.click('#tabcfg .ib[data-iconsize="30"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabi svg', e => +e.getAttribute('width') > 60), 'the glyph size dial scales the watermark');
  await p.click('#tabcfg .ib[data-iconmode="inline"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#tabs .tab .tabi svg', e => +e.getAttribute('width') === 30), 'and the inline glyph takes the size literally');
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
  // back to the defaults so the rest of the probe sees a known row
  await p.evaluate(() => { Object.assign(window.TABCFG, { intensity: 'mid', palette: 'station', pattern: 'valley',
    iconSize: 19, iconMode: 'inline', numSize: 12, numShape: 'pill', shape: 'rect', layout: 'fill', width: 'auto' });
    window.drawTabs(); window.drawTabCfg(); }); await p.waitForTimeout(120); }
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
ok(blocks.join(',') === 'bench,head bar,part buttons,part bars', 'the controls tab separates bench · head bar · part buttons · part bars into blocks', blocks.join(','));
const prows = await p.$$eval('#partcfg .prow', els => els.length);
ok(prows === 5, 'the BARS tab separates the controls per part — one row each', String(prows));
const varBtns = await p.$$eval('#partcfg .ib', els => els.length);
ok(varBtns === 12, 'every distribution is an icon button in its part row', String(varBtns));
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
ok(cpb.length === 4, 'every control block has a COPY button', String(cpb.length));
const lines = await p.evaluate(() => Object.keys(window.COPYTXT).map(k => window.COPYTXT[k]()));
ok(lines.length === 4 && lines.every(l => l.length > 20), 'each copy line names that section\'s selections', lines.join(' // ').slice(0, 160));
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

// a big CIRCLE must not move the bar's margins: it bleeds over the row instead of growing it
{ const before = await p.$eval('#headstrip', e => e.getBoundingClientRect().height);
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
