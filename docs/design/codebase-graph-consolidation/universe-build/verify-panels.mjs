/* Batch-22 proof: the PANEL HIERARCHY — Everything → Entity → Cluster → Element with two-way nav,
   Esc lands on Everything, background click picks the hull under the cursor. Run: node verify-panels.mjs */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);

// [1] BOOT: no selection → the Everything panel is already up; ENTITIES lead (navigable first);
//     Elements rows carry kind glyphs + meaning tooltips; Stars page behind a clickable wall;
//     Sources never leak raw objects (the [object Object] regression)
const boot = await p.evaluate(() => {
  const ents = new Set(nodes.map(n => n.ent).filter(Boolean));
  const secs = [...document.querySelectorAll('#pbody .sec')].map(s => s.querySelector('.sechd').textContent);
  const elSec = [...document.querySelectorAll('#pbody .sec')].find(s => /Elements/.test(s.querySelector('.sechd').textContent));
  const kindRows = elSec ? [...elSec.querySelectorAll('.pnav.pstat')] : [];
  const withGlyph = kindRows.filter(r => r.querySelector('.pki svg')).length;
  const withTip = kindRows.filter(r => r.querySelector('.tipico .tip')).length;   // styled tip ONLY — native titles removed (double-tooltip fix)
  const nativeDoubles = [...document.querySelectorAll('#pbody .tipico[title]')].length;
  return { open: document.body.classList.contains('panel-open'),
    title: document.querySelector('#phead .pname').textContent,
    view: (window.__uniPView || {}).lvl,
    entRows: [...document.querySelectorAll('#pbody .pnav')].filter(r => r.querySelector('.pdot')).length,
    distinct: ents.size,
    firstSec: secs[0], kindRows: kindRows.length, withGlyph, withTip,
    noObjLeak: !document.getElementById('pbody').textContent.includes('[object Object]'),
    nativeDoubles,
    srcSec: secs.some(s => /Sources/.test(s)) }; });
// [1b] the Stars clickable wall: preview → +30 page → show less resets
const stars = await p.evaluate(() => {
  const sec = [...document.querySelectorAll('#pbody .sec')].find(s => /Stars/.test(s.querySelector('.sechd').textContent));
  const chips = () => sec.querySelectorAll('.pchip').length;
  const c0 = chips();
  const more = [...sec.querySelectorAll('button.more')].find(b => /more/.test(b.textContent));
  if (more) more.click(); const c1 = chips();
  const less = [...sec.querySelectorAll('button.more')].find(b => /less/.test(b.textContent));
  if (less) less.click(); const c2 = chips();
  const fileTips = [...sec.querySelectorAll('.pchip')].filter(ch => /\.py|\.ts|\//.test(ch.title || '')).length;
  return { c0, c1, c2, paged: c1 === c0 + 30, resets: c2 === c0, fileTips }; });

// [1c] edge-aware tips: click the Elements-section tip icon (the panel hugs the RIGHT viewport
//      edge — exactly the operator's clipped case) → the shown tip must sit fully inside the viewport
const tipEdge = await p.evaluate(() => {
  const sec = [...document.querySelectorAll('#pbody .sec')].find(s => /Elements/.test(s.querySelector('.sechd').textContent));
  const ico = sec.querySelector('.sechd .tipico'); ico.click();       // .on shows the tip and runs the placer
  const r = ico.querySelector('.tip').getBoundingClientRect();
  const inX = r.right <= window.innerWidth && r.left >= 0, inY = r.bottom <= window.innerHeight && r.top >= 0;
  ico.click();                                                        // toggle back off
  return { right: Math.round(r.right), iw: window.innerWidth, inX, inY }; });

// [1d] direction markers + core icons: entity rows carry a trailing DOWN marker; the config's
//      core-by pills carry per-strategy icons; cluster rows inherit the ACTIVE core's icon
const dirIcons = await p.evaluate(() => {
  const entRows = [...document.querySelectorAll('#pbody .pnav')].filter(r => r.querySelector('.pdot'));
  const downs = entRows.filter(r => r.querySelector('.pdir.down svg')).length;
  document.querySelector('.cfgtab[data-pane="universe"]')?.click();
  const pill = document.querySelector('.pill[data-grp="coreBy"]');
  const pillBtns = pill ? pill.querySelectorAll('button').length : 0;
  const pillIcons = pill ? pill.querySelectorAll('button svg').length : 0;
  return { entRows: entRows.length, downs, pillBtns, pillIcons }; });

// [2] Everything → entity (click the first entity row)
const ent = await p.evaluate(() => {
  const row = [...document.querySelectorAll('#pbody .pnav')].find(r => r.querySelector('.pdot'));
  const name = row.querySelector('.pnl').textContent; row.click();
  const heads = [...document.querySelectorAll('#pbody .sechd')].map(h => h.textContent);
  return { name, title: document.querySelector('#phead .pname').textContent,
    view: window.__uniPView.lvl,
    stars: heads.some(h => /Stars/.test(h)), inside: heads.some(h => /Inside — clusters/.test(h)),
    above: heads.some(h => /Above/.test(h)),
    coreRows: [...document.querySelectorAll('#pbody .pnav')].filter(r => r.querySelector('.pcore svg')).length,
    upRows: [...document.querySelectorAll('#pbody .pnav')].filter(r => r.querySelector('.pdir.up svg')).length,
    cluRows: [...document.querySelectorAll('#pbody .pnav')].length }; });

// [3] entity → cluster (first cluster row under Inside)
const clu = await p.evaluate(() => {
  const secs = [...document.querySelectorAll('#pbody .sec')];
  const ins = secs.find(s => /Inside — clusters/.test(s.querySelector('.sechd').textContent));
  const row = ins.querySelector('.pnav'); const sub = row.querySelector('.pnl').textContent; row.click();
  return { sub, title: document.querySelector('#phead .pname').textContent,
    view: window.__uniPView.lvl,
    elemRows: [...document.querySelectorAll('#pbody .pnav:not(.pstat)')].filter(r => r.querySelector('.pki')).length,
    aboveRows: [...document.querySelectorAll('#pbody .sec')].filter(s => /Above/.test(s.querySelector('.sechd').textContent))
      .flatMap(s => [...s.querySelectorAll('.pnav')]).length }; });

// [4] cluster → element (click a member) → the element card carries the Above section back up
const elem = await p.evaluate(() => {
  const row = [...document.querySelectorAll('#pbody .pnav:not(.pstat)')].find(r => r.querySelector('.pki'));
  const label = row.querySelector('.pnl').textContent; row.click();
  const heads = [...document.querySelectorAll('#pbody .sechd')].map(h => h.textContent);
  const above = [...document.querySelectorAll('#pbody .sec')].find(s => /Above/.test(s.querySelector('.sechd').textContent));
  return { label, title: document.querySelector('#phead .pname').textContent,
    selected: !!(SEL && SEL.kind === 'node'),
    hasAbove: !!above, upRows: above ? above.querySelectorAll('.pnav').length : 0 }; });

// [5] element → cluster (the first Above row) → back where we were
const back = await p.evaluate(() => {
  const above = [...document.querySelectorAll('#pbody .sec')].find(s => /Above/.test(s.querySelector('.sechd').textContent));
  above.querySelector('.pnav').click();
  return { view: window.__uniPView.lvl, title: document.querySelector('#phead .pname').textContent }; });

// [6] Esc: selection + highlight cleared, the Everything panel returns
const esc = await p.evaluate(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  return { view: window.__uniPView.lvl, sel: SEL === null,
    title: document.querySelector('#phead .pname').textContent }; });

// [7] background click routes to the hull under the cursor: aim the picker at a known node's
//     projected screen point → its (sub-preferred) cluster panel opens; CLUSTERS carry their keys
const bg = await p.evaluate(() => {
  const n = nodes.find(x => x.kind === 'model' && x.x != null);
  const cam = Graph.camera(); const v = new THREE.Vector3(n.x, n.y, n.z).project(cam);
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cx = r.left + (v.x + 1) / 2 * r.width, cy = r.top + (1 - v.y) / 2 * r.height;
  window.__uniBgClick({ clientX: cx, clientY: cy });
  const keyed = CLUSTERS.filter(c => c.ekey).length;
  return { keyed, total: CLUSTERS.length, view: window.__uniPView.lvl,
    ent: window.__uniPView.ent, expectEnt: n.ent,
    routed: window.__uniPView.lvl === 'clu' || window.__uniPView.lvl === 'ent' }; });
// [8] HULL SELECTION LIGHT: entity level lights the entity hull; cluster level lights cluster+entity;
//     an element display lights ITS cluster+entity; Esc returns every hull to stock
const hull = await p.evaluate(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));   // [7] left allergen lit — clean baseline first
  const op = (lvl, ekey, skey) => { const c = CLUSTERS.find(c => c.level === lvl && c.ekey === ekey && (lvl === 'ent' || c.skey === skey));
    if (!c) return null; const m = (c.hull || c.sph || (c.sprites && c.sprites[0] && c.sprites[0].s)); return m ? +m.material.opacity.toFixed(4) : null; };
  const stockA = op('ent', 'allergen'), stockOther = op('ent', 'pantry'), stockSub = op('sub', 'allergen', 'misc');
  window.__uniPanelEnt('allergen');
  const entLit = op('ent', 'allergen'), otherStill = op('ent', 'pantry');
  window.__uniPanelClu('allergen', 'misc');
  const cluLit = op('sub', 'allergen', 'misc'), entStillLit = op('ent', 'allergen');
  const n = nodes.find(x => x.ent === 'pantry' && x.sub); showPanel(n);
  const elemEnt = op('ent', 'pantry'), elemSub = op('sub', n.ent, n.sub), allerBack = op('ent', 'allergen');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  const cleared = op('ent', 'pantry'), clearedSub = op('sub', n.ent, n.sub);
  return { stockA, entLit, otherStill: otherStill === stockOther,
    cluLit, subWasStock: stockSub, entStillLit,
    elemEnt, elemSub, allerBack: allerBack === stockA,
    clearedOk: cleared === stockOther && (clearedSub === null || clearedSub === op('sub', n.ent, n.sub)) ,
    entGain: entLit > stockA * 1.5, cluGain: stockSub === null || cluLit > stockSub * 1.5,
    elemGain: elemEnt > stockOther * 1.5, escBack: cleared === stockOther }; });
// [9] FLEET SPOT: entity selection marks its fleet row; cluster selection OPENS the entity's
//     cluster rows and marks the cluster; Esc clears every spot
const fleet = await p.evaluate(() => {
  window.__uniPanelEnt('pantry');
  const entSpot = !!document.querySelector('#fleetbody .flrow.spot[data-fle="pantry"]');
  window.__uniPanelClu('allergen', 'misc');
  const opened = !!document.querySelector('#fleetbody .flrow.flsub[data-fle="allergen"][data-fls="misc"]');
  const cluSpot = !!document.querySelector('#fleetbody .flrow.flsub.spot[data-fle="allergen"][data-fls="misc"]');
  const entAlso = !!document.querySelector('#fleetbody .flrow.spot[data-fle="allergen"]:not(.flsub)');
  const pantryDropped = !document.querySelector('#fleetbody .flrow.spot[data-fle="pantry"]');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  const cleared = document.querySelectorAll('#fleetbody .flrow.spot').length === 0;
  return { entSpot, opened, cluSpot, entAlso, pantryDropped, cleared }; });
// [10] NUMBER-KEY fleet toggles: 1–8 hit columns 2–9 scoped to the selection —
//      cluster selected → that cluster only · entity → that entity · nothing → the ALL row
const numkeys = await p.evaluate(() => {
  const kd = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
  window.__uniPanelClu('allergen', 'misc');
  const c0 = (UNIVIS.sub['allergen|misc'] || { planets: 1 }).planets;
  kd('1'); const c1 = UNIVIS.sub['allergen|misc'].planets;
  kd('1'); const c2 = UNIVIS.sub['allergen|misc'].planets;
  const entUntouched = UNIVIS.ent.allergen.planets === 1;
  window.__uniPanelEnt('pantry');
  kd('2'); const entWires = UNIVIS.ent.pantry.wires;
  kd('2'); const entWiresBack = UNIVIS.ent.pantry.wires;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  kd('4'); const allOff = Object.keys(UNIVIS.ent).every(e => UNIVIS.ent[e].zDef === 0);
  kd('4'); const allBack = Object.keys(UNIVIS.ent).every(e => UNIVIS.ent[e].zDef === 1);
  const hdrKeys = document.querySelectorAll('#fleetbody .flhead .flkey').length;
  const spotBg = getComputedStyle(document.querySelector('#fleet') ? document.body : document.body) && true;
  return { c0, c1, c2, entUntouched, entWires, entWiresBack, allOff, allBack, hdrKeys }; });
await b.close();

console.log('boot:', JSON.stringify(boot));
console.log('stars:', JSON.stringify(stars));
console.log('tipEdge:', JSON.stringify(tipEdge));
console.log('dirIcons:', JSON.stringify(dirIcons));
console.log('entity:', JSON.stringify(ent));
console.log('cluster:', JSON.stringify(clu));
console.log('element:', JSON.stringify(elem));
console.log('back:', JSON.stringify(back), '· esc:', JSON.stringify(esc));
console.log('bgClick:', JSON.stringify(bg));
console.log('hullLight:', JSON.stringify(hull));
console.log('fleetSpot:', JSON.stringify(fleet));
console.log('numKeys:', JSON.stringify(numkeys));
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (!(boot.open && boot.title === 'Everything' && boot.view === 'all' && boot.entRows === boot.distinct && boot.distinct > 3)) fails.push('boot Everything panel wrong');
if (!(/Entities/.test(boot.firstSec))) fails.push('Entities (navigable) must LEAD the Everything panel');
if (!(boot.kindRows >= 4 && boot.withGlyph === boot.kindRows && boot.withTip === boot.kindRows)) fails.push('Elements rows lost their kind glyphs / meaning tooltips');
if (!(boot.noObjLeak && boot.srcSec)) fails.push('Sources section leaks raw objects or is missing');
if (boot.nativeDoubles !== 0) fails.push('an info icon still carries a native title (the double-tooltip regression)');
if (!(tipEdge.inX && tipEdge.inY)) fails.push('an edge-adjacent tip still clips the viewport');
if (!(stars.c0 === 8 && stars.paged && stars.resets && stars.fileTips >= 8)) fails.push('Stars paging wall broken (8 preview → +30 → reset, file tooltips)');
if (!(ent.title === ent.name && ent.view === 'ent' && ent.stars && ent.inside && ent.above && ent.cluRows > 0)) fails.push('entity panel wrong');
if (!(dirIcons.downs === dirIcons.entRows && dirIcons.pillBtns >= 7 && dirIcons.pillIcons === dirIcons.pillBtns)) fails.push('direction markers / core-pill icons missing');
if (!(ent.coreRows > 0 && ent.upRows > 0)) fails.push('cluster rows do not inherit the core icon / Above rows lack UP markers');
if (!(clu.title === clu.sub && clu.view === 'clu' && clu.elemRows > 0 && clu.aboveRows >= 2)) fails.push('cluster panel wrong');
if (!(elem.title === elem.label && elem.selected && elem.hasAbove && elem.upRows >= 2)) fails.push('element card lost its Above nav');
if (!(back.view === 'clu')) fails.push('element → cluster back-nav broken');
if (!(esc.view === 'all' && esc.sel && esc.title === 'Everything')) fails.push('Esc does not land on Everything');
if (!(bg.keyed === bg.total && bg.total > 0 && bg.routed && bg.ent === bg.expectEnt)) fails.push('background hull click wrong');
if (!(hull.entGain && hull.otherStill && hull.cluGain && hull.entStillLit > hull.stockA * 1.5)) fails.push('hull light wrong at entity/cluster level');
if (!(hull.elemGain && hull.allerBack && hull.escBack)) fails.push('element-select hull light / Esc clear wrong');
if (!(fleet.entSpot && fleet.opened && fleet.cluSpot && fleet.entAlso && fleet.pantryDropped && fleet.cleared)) fails.push('fleet spot wrong (mark/open/clear)');
if (!(numkeys.c0 === 1 && numkeys.c1 === 0 && numkeys.c2 === 1 && numkeys.entUntouched)) fails.push('key 1 must toggle planets for the SELECTED CLUSTER only');
if (!(numkeys.entWires === 0 && numkeys.entWiresBack === 1)) fails.push('key 2 must toggle wires for the selected ENTITY');
if (!(numkeys.allOff && numkeys.allBack && numkeys.hdrKeys === 8)) fails.push('no-selection number keys must hit the ALL row / header key labels missing');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('PANELS PROOF: ALL PASS');
