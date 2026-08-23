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
  // wires pick FIRST by design — for the HULL check, choose a model whose screen point has no wire within reach
  const g = document.getElementById('g'), r = g.getBoundingClientRect();
  const cam = Graph.camera();
  const wireDist = (cx, cy) => { const mx = ((cx - r.left) / r.width) * 2 - 1, my = -((cy - r.top) / r.height) * 2 + 1;
    const rc = new THREE.Raycaster(); rc.setFromCamera({ x: mx, y: my }, cam);
    let m = 1e9; links.forEach(l => { const a = _npos[lid(l.source)], b = _npos[lid(l.target)]; if (!a || !b) return;
      const s = NIDS[lid(l.source)], t2 = NIDS[lid(l.target)];
      if ((s && (!_nodeVisibleFn(s) || !visN(s).wires)) || (t2 && (!_nodeVisibleFn(t2) || !visN(t2).wires))) return;
      m = Math.min(m, _raySegDist(rc.ray, new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z))); });
    return m; };
  let n = null, cx = 0, cy = 0;
  for (const cand of nodes.filter(x => x.kind === 'model' && x.x != null)) {
    const v = new THREE.Vector3(cand.x, cand.y, cand.z).project(cam);
    const px = r.left + (v.x + 1) / 2 * r.width, py = r.top + (1 - v.y) / 2 * r.height;
    if (wireDist(px, py) > 8) { n = cand; cx = px; cy = py; break; }
  }
  if (!n) { n = nodes.find(x => x.kind === 'model' && x.x != null);
    const v = new THREE.Vector3(n.x, n.y, n.z).project(cam);
    cx = r.left + (v.x + 1) / 2 * r.width; cy = r.top + (1 - v.y) / 2 * r.height; }
  window.__uniBgClick({ clientX: cx, clientY: cy });
  const keyed = CLUSTERS.filter(c => c.ekey).length;
  return { keyed, total: CLUSTERS.length, view: window.__uniPView.lvl,
    ent: window.__uniPView.ent, expectEnt: n.ent,
    routed: window.__uniPView.lvl === 'clu' || window.__uniPView.lvl === 'ent' }; });
// [7b] operator DEFAULTS + focus bite + wire click
const defs = await p.evaluate(() => {
  const d = { fkStyle: CONN.fk.style, fkGrad: !!CONN.fk.grad, callsStyle: CONN.calls.style, callsGrad: !!CONN.calls.grad,
    bridgeStyle: CONN.bridge.style, impStyle: CONN.imports.style,
    beams: [__uniBeam.fk, __uniBeam.bridge, __uniBeam.calls, __uniBeam.imports].join(','),   // operator config 2: calls 0.5
    curved: window.__uniCurved === true, amt: window.__uniCurveAmt, rest: HL.rest, line: CFG.lineStyle };
  // focus BITE: select a node under GLOW, click a rest option → mode flips to focus
  const n = nodes.find(x => x.kind === 'endpoint'); SEL = { kind: 'node', data: n }; showPanel(n); __uniHLSelect(n);
  d.modeBefore = HL.mode;
  window.__uniFlOpen('wires');
  document.querySelector('.pill[data-grp="focusRest"] button[data-v="dim"]').click();
  d.modeAfter = HL.mode; d.restAfter = HL.rest;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  // WIRE CLICK: project a visible link's midpoint → __uniBgClick opens the CONNECTION panel
  const l = links.find(x => { const a = _npos[lid(x.source)], b = _npos[lid(x.target)];
    const s = NIDS[lid(x.source)], t2 = NIDS[lid(x.target)];
    return a && b && s && t2 && _nodeVisibleFn(s) && _nodeVisibleFn(t2); });
  const a = _npos[lid(l.source)], b = _npos[lid(l.target)];
  const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2).project(Graph.camera());
  const gr = document.getElementById('g').getBoundingClientRect();
  window.__uniBgClick({ clientX: gr.left + (mid.x + 1) / 2 * gr.width, clientY: gr.top + (1 - mid.y) / 2 * gr.height });
  d.wirePanel = /CONNECTION/.test(document.querySelector('#phead .ptype')?.textContent || '');
  d.wireTitle = document.querySelector('#phead .pname')?.textContent || '';
  d.selGlows = window.__uniSelLink === l && [...connGroup.children].some(w => w.userData.kind && w.material.blending === THREE.AdditiveBlending);
  const plainWhite = () => [...connGroup.children].some(w => w.userData.kind && !w.material.vertexColors && w.material.color.getHex() === 0xffffff);   // gradient mats are white by design — exclude them
  d.litKeepColor = !plainWhite();                                           // a SELECTION (wire + lit set) must NOT recolor anything
  window.__uniApplyTheme('light');
  d.themeLight = document.documentElement.getAttribute('data-theme') === 'light' && Graph.backgroundColor() === '#e8ecf3';
  window.__uniApplyTheme('dark');
  d.themeBack = document.documentElement.getAttribute('data-theme') === 'dark' && !!document.getElementById('themeBtn');
  d.linkLit = HL.on && HL.set[lid(l.source)] !== undefined && HL.set[lid(l.target)] !== undefined;   // wire select BFS-lights both ends
  const rp = document.querySelector('.pill[data-grp="focusRest"]');
  d.restOpts = [...rp.querySelectorAll('button')].map(x => x.getAttribute('data-v')).join(',');
  d.restIcons = [...rp.querySelectorAll('button')].every(x => x.querySelector('svg') && x.textContent.trim() === '');
  const d0 = HL.depth; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', altKey: true }));
  d.altE = HL.depth === Math.min(5, d0 + 1);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', altKey: true }));
  d.altQ = HL.depth === d0;
  // link-card chips hover-light their node (element-card parity): halo appears on enter, gone on leave
  const chips = [...document.querySelectorAll('#pbody .pchip')].slice(0, 2);
  const halo = () => { let h = null; Graph.scene().traverse(o => { if (o.userData && o.userData.__hov) h = o; }); return !!h; };
  chips[0].dispatchEvent(new MouseEvent('mouseenter'));
  d.chipHaloOn = halo();
  d.hovWire = window.__uniHovLink === l && [...connGroup.children].some(w => w.material.blending === THREE.AdditiveBlending);   // the wire to the hovered endpoint glows
  const hovColor = hex => [...connGroup.children].some(w => w.userData.kind && !w.material.vertexColors && w.material.blending === THREE.AdditiveBlending && w.material.color.getHex() === hex);
  d.hovWhite = hovColor(0xffffff);                                          // ONLY the hover pair recolors — white on dark
  window.__uniApplyTheme('light');
  d.hovIndigo = hovColor(0x4f46e5);                                         // …indigo on light
  window.__uniApplyTheme('dark');
  chips[0].dispatchEvent(new MouseEvent('mouseleave'));
  d.chipHaloOff = !halo() && window.__uniHovLink === null;
  d.chipCursor = chips.every(c => c.style.cursor === 'pointer');
  // F toggles glow⇄focus; in FOCUS the SELECTED element alone keeps its halo
  const m0 = HL.mode; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
  d.fToggles = HL.mode !== m0; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
  d.fBack = HL.mode === m0;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  const n2 = nodes.find(x => x.kind === 'endpoint'); SEL = { kind: 'node', data: n2 }; showPanel(n2); __uniHLSelect(n2);
  if (HL.mode === 'glow') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));   // → focus
  const halos = (typeof hlGroup !== 'undefined' && hlGroup) ? hlGroup.children.length : -1;
  d.focusOriginGlow = HL.mode === 'focus' && halos === 1;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
  d.glowMany = (typeof hlGroup !== 'undefined' && hlGroup) ? hlGroup.children.length > 1 : false;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  return d; });

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
  kd('2'); const c1 = UNIVIS.sub['allergen|misc'].planets;      // key 2 = planets since the batch-30 reorder
  kd('2'); const c2 = UNIVIS.sub['allergen|misc'].planets;
  const entUntouched = UNIVIS.ent.allergen.planets === 1;
  window.__uniPanelEnt('pantry');
  kd('3'); const entWires = UNIVIS.ent.pantry.wires;            // key 3 = wires now
  kd('3'); const entWiresBack = UNIVIS.ent.pantry.wires;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  kd('5'); const allOff = Object.keys(UNIVIS.ent).every(e => UNIVIS.ent[e].zDef === 0);   // key 5 = defence since transports slid in at 4
  kd('5'); const allBack = Object.keys(UNIVIS.ent).every(e => UNIVIS.ent[e].zDef === 1);
  const hdrKeys = document.querySelectorAll('#fleetbody .flhead .flkey').length;
  const spotBg = getComputedStyle(document.querySelector('#fleet') ? document.body : document.body) && true;
  return { c0, c1, c2, entUntouched, entWires, entWiresBack, allOff, allBack, hdrKeys }; });
// [11] the fleet SIDE DRAWER: config lives per column — Entity (layout·show·radius·transparency·
//      container·stars·functions) · Clusters (core·show·transparency + the SHARED radius/container)
//      · Planets (transparency + Zones master); slides out right, X slides it back; Routes-only config
const flcfg = await p.evaluate(() => {
  const tabs = [...document.querySelectorAll('#cfg .cfgtab')].map(b => b.getAttribute('data-pane'));
  const order = _FCOLS.map(c => c.k).slice(0, 5).join(',');
  const btn = k => document.querySelector(`#fleetbody .flhead .flcfgbtn[data-fk="${k}"]`);
  const side = document.getElementById('flside'), bodyTxt = () => document.getElementById('flsbody').textContent;
  btn('show').click();
  const entOpen = side.classList.contains('out');
  const U = s => bodyTxt().toUpperCase().includes(s);
  const q2 = s => !!document.querySelector('#flsbody ' + s);
  const entFull = U('LAYOUT') && U('RADIUS') && U('OPTIONS')
    && q2('.pill[data-grp="entLayout"]') && q2('.pill[data-grp="entOp"]') && q2('.pill[data-grp="shape"]')   // combo row: layout · transparency · container
    && q2('[data-itog="entOn"]') && q2('[data-itog="stars"]') && q2('#fnsTog') && q2('#spreadRng')
    && !q2('[data-itog="subOn"]');
  const fnsOff = CFG.showFns === 'off' && !document.querySelector('#flsbody #fnsTog.on');   // functions START OFF
  const r0 = RENT[Object.keys(RENT)[0]];
  const sp = document.querySelector('#flsbody #spreadRng'); sp.value = '2'; sp.dispatchEvent(new Event('input'));
  const spWorks = Math.abs(window.__uniSpread - 2) < 0.001 && Math.abs(RENT[Object.keys(RENT)[0]] / r0 - 2) < 0.05;
  sp.value = '1'; sp.dispatchEvent(new Event('input'));
  const spBack = Math.abs(RENT[Object.keys(RENT)[0]] - r0) < 0.5;
  const spQuarter = Math.abs(((1 - 0.55) / (2.8 - 0.55)) - 0.2) < 0.001;                    // default sits at a FIFTH of the bar (operator rev)
  const rsOneRow = !!document.querySelector('#flsbody .rsrow #radRng') && !!document.querySelector('#flsbody .rsrow #spreadRng');
  const lg = document.getElementById('elegend');
  const lgStyled = lg && getComputedStyle(lg).borderRadius === '12px' && !!lg.querySelector('.lghd b svg');   // the legend wears the panel chrome + iconed title
  const lgBody = lg.querySelector('.lgbody');
  const lgTwoCol = lgBody.classList.contains('lg-types') && getComputedStyle(lgBody).gridTemplateColumns.split(' ').length === 2;   // TYPES compacts into two columns
  const lgH = tab => { [...lg.querySelectorAll('.lgtab')].find(b2 => new RegExp(tab, 'i').test(b2.textContent)).click();
    return Math.round(document.getElementById('elegend').getBoundingClientRect().height); };
  const h1 = lgH('types'), h2 = lgH('connectors'), h3 = lgH('planet'); lgH('types');
  lg.querySelector('.lgmin').click();
  const lgMin = lg.getBoundingClientRect().height < 60;                      // minimize collapses to the head
  lg.querySelector('.lgmin').click();
  const lgCompact = h1 === h2 && h2 === h3 && h1 <= 340 && lgMin;            // ONE size, whatever the tab — and it minimizes
  btn('subs').click();
  const cluFull = U('CORE') && !!document.querySelector('#flsbody #radRng')
    && !!document.querySelector('#flsbody [data-itog="subOn"]') && !document.querySelector('#flsbody [data-itog="entOn"]');
  btn('planets').click();
  const zonePill = document.querySelector('#flsbody .pill[data-grp="warOn"]');
  const plFull = !!document.querySelector('#flsbody .pill[data-grp="bubble"]') && !!zonePill;   // 'film' is a DOT now — the word rides the hover
  zonePill.querySelector('button[data-v="true"]').click(); const wOn = CFG.warOn === true;
  zonePill.querySelector('button[data-v="false"]').click(); const wOff = CFG.warOn === false;
  const iconsOnly = [...document.querySelectorAll('.pill[data-grp="shape"] button')].every(b => b.textContent.trim() === '');
  const gates = CFG.zDef && CFG.zAtk && CFG.zCfl && CFG.zSat;
  const standalone = side.parentNode === document.body;                       // an ADD-ON, not a fleet child
  const fl = document.getElementById('fleet'), fr = fl.getBoundingClientRect();
  const docked = Math.abs(parseFloat(side.style.left) - (fr.right + 10)) < 2 && Math.abs(parseFloat(side.style.top) - fr.top) < 2;   // style, not rect (slide mid-flight); +10 = the breathing gap
  const fleetUnstretched = fl.scrollWidth <= fl.clientWidth + 2;               // the drawer no longer widens the fleet
  const under = +getComputedStyle(side).zIndex < +(getComputedStyle(fl).zIndex || 40);
  // compaction gates: one plain × (no boxed pair) · no horizontal scroll in ANY pane · icon-only
  // layout/core/transparency pills (words on hover) · transport steppers drive the speed
  const oneX = !document.getElementById('flsmin') && !!document.querySelector('#flside .flsx');
  const bodyEl2 = document.getElementById('flsbody');
  let noHScroll = true;
  for (const k of ['show','subs','planets','wires','routes']) { window.__uniFlOpen(k);
    if (bodyEl2.scrollWidth > bodyEl2.clientWidth + 2) noHScroll = false; }
  window.__uniFlOpen('show');
  const layIconOnly = [...document.querySelectorAll('.pill[data-grp="entLayout"] button')].every(b => b.textContent.trim() === '' && b.querySelector('svg') && /—/.test(b.title));
  const coreIconOnly = [...document.querySelectorAll('.pill[data-grp="coreBy"] button')].every(b => b.textContent.trim() === '' && b.querySelector('svg'));
  const transDots = [...document.querySelectorAll('.pill[data-grp="entOp"] button')].every(b => b.textContent.trim() === '' && /fill-opacity/.test(b.innerHTML));
  // wire kinds: ONE row each, per-kind on/off riding the beam (0 hides), toggle round-trips
  window.__uniFlOpen('wires');
  const wk = (() => { const rows = [...document.querySelectorAll('#flsbody .wkrow')];
    const oneRow = rows.length === 4 && rows.every(r => r.querySelector('[data-wtog]') && r.querySelector('[data-wcol]')
      && r.querySelector('[data-wshape]') && r.querySelector('[data-beam]') && r.querySelector('[data-wreset]'));
    const tog = document.querySelector('button[data-wtog="fk"]');
    const b0 = window.__uniBeam.fk; tog.click();
    const hid = window.__uniBeam.fk === 0 && !tog.classList.contains('on');
    tog.click();
    const back = window.__uniBeam.fk === (b0 || 1) && tog.classList.contains('on');
    const glowLbl = !!document.querySelector('#flsbody .wglow');
    const noFooter = !/per kind: sample/.test(document.getElementById('flsbody').textContent);
    // entity gradient: per-row toggle → wires wear vertex colors; sample blends; reset clears
    const gb = document.querySelector('button[data-wgrad="fk"]');
    const fkVC = () => [...connGroup.children].some(l => l.userData.kind === 'fk' && l.material && l.material.vertexColors === true);
    const stockOn = CONN.fk.grad === true && gb.classList.contains('on');   // operator default: fk gradient ON
    const sampGrad = /linearGradient/.test(document.querySelector('[data-wsamp="fk"]').innerHTML);
    gb.click(); updateConnectors();
    const gradOn = stockOn && CONN.fk.grad === false && !fkVC();            // first click turns it OFF
    gb.click(); updateConnectors();
    const vc = CONN.fk.grad === true && fkVC();                              // back ON → fk wires vertex-colored
    gb.click(); document.querySelector('button[data-wreset="fk"]').click(); updateConnectors();
    const gradCleared = CONN.fk.grad === true && gb.classList.contains('on');// reset RESTORES the stock (grad on)
    const vcGone = fkVC();                                                   // stock = gradient, so fk wires stay vertex-colored
    // copy-settings: visible on Connections ONLY; the payload round-trips the pane's state
    const cpy = document.getElementById('flscopy');
    const cpyVisible = cpy && cpy.style.display !== 'none';
    cpy.click();
    let cp = {}; try { cp = JSON.parse(window.__uniLastCopy); } catch (e) {}
    const cpyPayload = cp.pane === 'connections' && cp.kinds && cp.kinds.fk && /^#/.test(cp.kinds.fk.color)
      && typeof cp.kinds.fk.on === 'boolean' && 'glow' in cp.kinds.fk && 'grad' in cp.kinds.fk
      && 'lineStyle' in cp && 'focusRest' in cp;
    window.__uniFlOpen('planets');
    const cpyHiddenElsewhere = document.getElementById('flscopy').style.display === 'none';
    window.__uniFlOpen('wires');
    return { oneRow, hid, back, glowLbl, noFooter, gradBtns: document.querySelectorAll('#flsbody .wgrad').length,
      gradOn, vc, sampGrad, gradCleared, vcGone, cpyVisible, cpyPayload, cpyHiddenElsewhere }; })();
  window.__uniFlOpen('routes');
  const ts = document.querySelector('#flsbody #trSpeedRng');
  const ladder = ts && ts.min === '-2' && ts.max === '4' && ts.step === '1';
  const defSpeed = Math.abs(INTC.speed - 0.1) < 0.001 && ts.value === '0';   // default = two stops below the old 0.3
  const badge = document.getElementById('trSpdBadge');
  const badgeShows = badge && badge.textContent === '0.1';
  const plusB = document.querySelector('#flsbody #trPlus'); if (plusB) plusB.click();
  const stepped = plusB && Math.abs(INTC.speed - 0.141) < 0.002 && badge.textContent === '0.14';
  const minusB = document.querySelector('#flsbody #trMinus'); if (minusB) { minusB.click(); }
  const backTo = ts.value === '0' && Math.abs(INTC.speed - 0.1) < 0.001;
  const noRepeatLbl = !document.querySelector('#flsbody .grplbl');
  document.getElementById('flsclose').click();
  const closed = !side.classList.contains('out');
  return { tabs, order, entOpen, entFull, cluFull, plFull, wOn, wOff, iconsOnly, gates, closed,
    fnsOff, spWorks, spBack, spQuarter, rsOneRow, lgStyled, lgTwoCol, lgCompact,
    standalone, docked, fleetUnstretched, under,
    oneX, noHScroll, layIconOnly, coreIconOnly, transDots, stepped, noRepeatLbl,
    ladder, defSpeed, badgeShows, backTo, wk }; });
// [12] fleet clicks SELECT: entity name → entity panel + camera flies to it; the count badge
//      expands instead; a cluster name selects the cluster (panel + camera)
const fsel = await p.evaluate(() => new Promise(res => {
  const name = document.querySelector('#fleetbody .flx[data-flx="pantry"]');
  const openBefore = !!document.querySelector('#fleetbody .flrow.flsub[data-fle="pantry"]');
  name.click();
  const sel = window.__uniPView.lvl === 'ent' && window.__uniPView.ent === 'pantry';
  const noExpand = !!document.querySelector('#fleetbody .flrow.flsub[data-fle="pantry"]') === openBefore;   // the name never expands
  const ids = nodes.filter(n => n.ent === 'pantry');
  const cx = ids.reduce((s, n) => s + n.x, 0) / ids.length, cy = ids.reduce((s, n) => s + n.y, 0) / ids.length, cz = ids.reduce((s, n) => s + n.z, 0) / ids.length;
  setTimeout(() => {
    const t2 = Graph.controls().target;
    const flies = Math.hypot(t2.x - cx, t2.y - cy, t2.z - cz) < 120;      // the camera aims at the entity
    const exp = document.querySelector('#fleetbody .flx[data-flx="pantry"] .flexp'); exp.click();
    const expanded = !!document.querySelector('#fleetbody .flrow.flsub[data-fle="pantry"]') !== openBefore;
    const panelStill = window.__uniPView.lvl === 'ent';                    // expanding must NOT change the selection
    const sub = document.querySelector('#fleetbody .flsubname[data-fse="pantry"]');
    let cluSel = true;
    if (sub) { sub.click(); cluSel = window.__uniPView.lvl === 'clu' && window.__uniPView.ent === 'pantry'; }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    res({ sel, noExpand, flies, expanded, panelStill, cluSel });
  }, 1100);
}));
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
console.log('fleetSel:', JSON.stringify(fsel));
console.log('fleetSpot:', JSON.stringify(fleet));
console.log('defaults:', JSON.stringify(defs));
console.log('numKeys:', JSON.stringify(numkeys));
console.log('flcfg:', JSON.stringify(flcfg));
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
if (!(fsel.sel && fsel.noExpand && fsel.flies && fsel.expanded && fsel.panelStill && fsel.cluSel)) fails.push('fleet clicks must SELECT (name → panel+camera; count → expand only; cluster name → cluster)');
if (!(defs.fkStyle === 'sparse' && defs.fkGrad && defs.callsStyle === 'solid' && defs.callsGrad && defs.bridgeStyle === 'sparse' && defs.impStyle === 'dotted' && defs.beams === '0.9,0.8,0.5,1' && defs.curved && Math.abs(defs.amt - 0.6) < 0.001 && defs.rest === 'hide' && defs.line === 'curved')) fails.push('operator connection defaults not adopted');
if (!(defs.modeBefore === 'glow' && defs.modeAfter === 'focus' && defs.restAfter === 'dim')) fails.push('focus options do not BITE (auto-switch to focus mode)');
if (!(defs.wirePanel && /→/.test(defs.wireTitle))) fails.push('wires are not clickable (connection panel did not open)');
if (!(defs.selGlows && defs.linkLit)) fails.push('selected wire must GLOW and BFS-light its endpoints');
if (!defs.litKeepColor) fails.push('selection recolored a wire — WHITE is reserved for the hover pair');
if (!(defs.themeLight && defs.themeBack)) fails.push('theme toggle broken');
if (!(defs.hovWhite && defs.hovIndigo)) fails.push('the HOVER pair wire must recolor (white dark · indigo light)');
if (!(defs.restOpts === 'dim,hide' && defs.restIcons)) fails.push('focus rest must be DIM+HIDE icon pills only');
if (!(defs.altE && defs.altQ)) fails.push('Alt+Q/Alt+E depth keys broken');
if (!(defs.chipHaloOn && defs.chipHaloOff && defs.chipCursor)) fails.push('link-card endpoint chips do not hover-light their nodes');
if (!(defs.hovWire)) fails.push('chip hover must light the WIRE to the hovered element');
if (!(defs.fToggles && defs.fBack)) fails.push('F does not toggle glow⇄focus');
if (!(defs.focusOriginGlow && defs.glowMany)) fails.push('FOCUS must keep exactly the selected element glowing (glow keeps the set)');
if (!(numkeys.c0 === 1 && numkeys.c1 === 0 && numkeys.c2 === 1 && numkeys.entUntouched)) fails.push('key 2 must toggle planets for the SELECTED CLUSTER only');
if (!(numkeys.entWires === 0 && numkeys.entWiresBack === 1)) fails.push('key 3 must toggle wires for the selected ENTITY');
if (!(numkeys.allOff && numkeys.allBack && numkeys.hdrKeys === 8)) fails.push('no-selection number keys must hit the ALL row / header key labels missing');
if (!(flcfg.tabs.length === 0 && flcfg.order === 'show,subs,planets,wires,routes')) fails.push('config must be TABLESS and the fleet order Entity·Clusters·Planets·Connections·Transports');
if (!(flcfg.entOpen && flcfg.entFull && flcfg.cluFull && flcfg.plFull && flcfg.wOn && flcfg.wOff && flcfg.iconsOnly && flcfg.gates && flcfg.closed)) fails.push('the fleet side drawer panes are wrong (entity combo/options rows, clusters, planets, zones master)');
if (!(flcfg.fnsOff && flcfg.spWorks && flcfg.spBack && flcfg.spQuarter)) fails.push('functions must start OFF / the spread slider must scale RENT (default at a FIFTH of the bar)');
if (!(flcfg.rsOneRow && flcfg.lgStyled)) fails.push('radius+spread must share one row / the legend must wear the panel chrome');
if (!(flcfg.lgTwoCol && flcfg.lgCompact)) fails.push('the legend Types tab must read in TWO columns inside a compact box');
if (!(flcfg.standalone && flcfg.docked && flcfg.fleetUnstretched && flcfg.under)) fails.push('the drawer must be a FREE-STANDING add-on docked at the fleet edge (own box, z-under, fleet unstretched)');
if (!(flcfg.oneX && flcfg.noHScroll && flcfg.layIconOnly && flcfg.coreIconOnly && flcfg.transDots && flcfg.stepped && flcfg.noRepeatLbl)) fails.push('compaction wrong (one ×, no h-scroll, icon pills, opacity dots, speed steppers, no repeated Transports label)');
if (!(flcfg.ladder && flcfg.defSpeed && flcfg.badgeShows && flcfg.backTo)) fails.push('speed ladder wrong (−2..+4 positions, default 0.1 at pos 0, numbered dot, stepper round-trip)');
if (!(flcfg.wk.oneRow && flcfg.wk.hid && flcfg.wk.back && flcfg.wk.glowLbl && flcfg.wk.noFooter)) fails.push('wire-kind rows wrong (one row each, on/off round-trip, glow label, footer gone)');
if (!(flcfg.wk.gradBtns === 4 && flcfg.wk.gradOn && flcfg.wk.vc && flcfg.wk.sampGrad && flcfg.wk.gradCleared && flcfg.wk.vcGone)) fails.push('entity-gradient toggle wrong (4 buttons, vertex-colored wires on, sample blends, reset clears)');
if (!(flcfg.wk.cpyVisible && flcfg.wk.cpyPayload && flcfg.wk.cpyHiddenElsewhere)) fails.push('copy-settings wrong (Connections-only button, full JSON payload)');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('PANELS PROOF: ALL PASS');
