/* Batch-9 clustering proof against the committed example page:
   [1] 0 page/console errors · [2] entity separation (anchor spacing + bleed fraction)
   [3] kind ring — endpoints sit FARTHER from their entity anchor than models/schemas
   [4] Cluster Core By physically re-arranges nodes (reheat + displacement)
   Run: node verify-clustering.mjs   (needs google-chrome-stable + the spike's playwright-core) */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
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
await p.waitForTimeout(9000);   // let the settle finish — measured at 797 planets headless: the kind rings form by ~7-9 s (4.5 s reads mid-settle, ratio 1.23 vs settled 1.51)

const base = await p.evaluate(() => {
  const anchors = Object.keys(EX).map(e => ({ e, x: EX[e], y: EY[e], z: EZ[e] }));
  let minPair = 1e9;
  for (let i = 0; i < anchors.length; i++) for (let j = i + 1; j < anchors.length; j++) {
    const a = anchors[i], c = anchors[j];
    minPair = Math.min(minPair, Math.hypot(a.x - c.x, a.y - c.y, a.z - c.z)); }
  const rOf = n => Math.hypot((n.x||0)-(EX[n.ent]||0), (n.y||0)-(EY[n.ent]||0), (n.z||0)-(EZ[n.ent]||0));
  let bleed = 0; const perEnt = {};
  nodes.forEach(n => {
    let own = 1e9, foreign = 1e9;
    anchors.forEach(a => { const d = Math.hypot((n.x||0)-a.x, (n.y||0)-a.y, (n.z||0)-a.z);
      if (a.e === n.ent) own = d; else foreign = Math.min(foreign, d); });
    if (foreign < own) bleed++;
    const pe = perEnt[n.ent] = perEnt[n.ent] || { ep: [], inn: [] };
    if (n.kind === 'endpoint') pe.ep.push(rOf(n));
    if (n.kind === 'model' || n.kind === 'schema') pe.inn.push(rOf(n)); });
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  // ring metric is PER ENTITY (entities with both kinds), then averaged — an all-internals
  // entity (allergen post-reduction) must not drag a global pooled mean
  const ratios = Object.values(perEnt).filter(pe => pe.ep.length && pe.inn.length)
    .map(pe => mean(pe.ep) / Math.max(1, mean(pe.inn)));
  const epR = [].concat(...Object.values(perEnt).map(pe => pe.ep));
  const inR = [].concat(...Object.values(perEnt).map(pe => pe.inn));
  const subEnts = Object.keys(SUBANCHOR).filter(e => Object.keys(SUBANCHOR[e]).length >= 2).length;
  return { nodes: nodes.length, ents: anchors.length, minAnchorPair: Math.round(minPair),
    bleedPct: +(100 * bleed / nodes.length).toFixed(1),
    ringRatio: +(ratios.reduce((s, v) => s + v, 0) / Math.max(1, ratios.length)).toFixed(2), ringEnts: ratios.length,
    epMeanR: Math.round(mean(epR)), inMeanR: Math.round(mean(inR)),
    ringedEnts: subEnts, pos: nodes.map(n => [n.id, Math.round(n.x||0), Math.round(n.y||0), Math.round(n.z||0)]) };
});

// flip the core → nodes must MOVE (reheat), not just the hulls recolor
await p.evaluate(() => { CFG.coreByBE = 'kind'; applyCfg('coreByBE'); });
await p.waitForTimeout(3500);
const after = await p.evaluate(prev => {
  const M = Object.fromEntries(prev.map(r => [r[0], r]));
  let moved = 0, disp = [];
  nodes.forEach(n => { const o = M[n.id]; if (!o) return;
    const d = Math.hypot((n.x||0)-o[1], (n.y||0)-o[2], (n.z||0)-o[3]);
    disp.push(d); if (d > 4) moved++; });
  const mean = disp.length ? disp.reduce((s, v) => s + v, 0) / disp.length : 0;
  const bad = nodes.filter(n => !isFinite(n.x) || !isFinite(n.y) || !isFinite(n.z)).length;
  return { meanDisp: Math.round(mean), movedPct: +(100 * moved / nodes.length).toFixed(1), nonFinite: bad };
}, base.pos);

// backend-function community pass (operator fix): with Functions ON + community core, functions
// cluster over their call graph (ƒ·<hub>), not into one giant "other".
await p.evaluate(() => { UNICAP.on = false; __uniApplyCapsules(); });   // unfold to inspect raw pieces
await p.waitForTimeout(1200);
await p.evaluate(() => { CFG.coreByBE = 'community'; applyCfg('coreByBE'); __uniSetKindState('function','all'); });   // load via the 3-state API (keeps __uniKindState in sync)
await p.waitForTimeout(3500);
const fnClust = await p.evaluate(() => {
  const ent = _ents.slice().sort((a,b) => nodes.filter(n=>n.ent===b&&n.kind==='function').length
    - nodes.filter(n=>n.ent===a&&n.kind==='function').length)[0];
  // A (operator ruling): on USE-CASE functions JOIN the data cluster they serve — NO separate ƒ· geography.
  assignSub('usecase');
  const fns = nodes.filter(n => n.ent===ent && n.kind==='function');
  const joined = fns.filter(n => n.sub && n.sub!=='other');
  const noFnSep = !fns.some(n => /^ƒ·/.test(n.sub||''));            // the ƒ· explosion is gone
  const dataSubs = new Set(nodes.filter(n=>n.ent===ent && n.kind!=='function' && !n.__cap).map(n=>n.sub));
  const inDataCluster = joined.filter(n => dataSubs.has(n.sub)).length;   // shares a cluster with endpoints/schemas
  return { ent, total: fns.length, joined: joined.length, inDataCluster, noFnSep,
           joinFrac: +(joined.length/Math.max(1,fns.length)).toFixed(2) };
});
// B (operator ruling): the legend Function row LOADS/UNLOADS functions — the config boolean is gone
const fnLegend = await p.evaluate(() => {
  const boolGone = !document.getElementById('fnsTog');
  const row = document.querySelector('#elegend [data-lgk="function"]');
  if (!row) return { boolGone, hasRow:false };
  __uniSetKindState('function','off');                             // OFF = unloaded baseline
  const n0 = nodes.filter(n=>n.kind==='function').length;
  __uniSetKindState('function','all');                             // ALL = loaded
  const n1 = nodes.filter(n=>n.kind==='function').length, on1 = CFG.showFns==='on';
  __uniSetKindState('function','off');                             // back to OFF = unloaded
  const n2 = nodes.filter(n=>n.kind==='function').length;
  return { boolGone, hasRow:true, loads: n0===0 && n1>0 && on1, unloads: n2===0 };
});
// #2 operator: the legend 3-state — critical hides single-caller-SAME-kind helpers; group master cycles a side
const critical = await p.evaluate(() => new Promise(res => {
  __uniSetKindState('function','all');
  setTimeout(() => { __uniComputeSolo();
    const solo = nodes.filter(n=>n.kind==='function' && n.__solo).length;
    const allVis = nodes.filter(n=>n.kind==='function' && !n.__cap && visN(n).show).length;
    __uniSetKindState('function','critical');
    const critVis = nodes.filter(n=>n.kind==='function' && !n.__cap && visN(n).show).length;
    var _gn=0; while(__uniGrpState.backend!=='all' && _gn++<5) __uniGroupToggle('backend');   // the group defaults CRITICAL now — normalize to 'all' first
    __uniGroupToggle('backend'); const gs1 = __uniGrpState.backend;        // all→critical
    __uniGroupToggle('backend');                                           // critical→off
    const modelHidden = nodes.filter(n=>n.kind==='model' && visN(n).show).length === 0;
    __uniGroupToggle('backend');                                           // off→all
    __uniSetKindState('function','off');
    res({ solo, allVis, critVis, critHides: solo>0 && critVis===allVis-solo, gsCrit: gs1==='critical', modelHidden });
  }, 1600);
}));
// review fix: loading functions must NOT fold a backend entity that was under the threshold
const noSurpriseFold = await p.evaluate(() => new Promise(res => {
  const be = _ents.filter(e=>!__uniIsFeEnt(e) && nodes.filter(n=>n.ent===e&&!n.__cap).length>40 && nodes.filter(n=>n.ent===e&&!n.__cap).length<80)
    .sort((a,b)=>nodes.filter(n=>n.ent===b).length-nodes.filter(n=>n.ent===a).length)[0] || 'recipe';
  const caps0 = nodes.filter(n=>n.__cap && n.ent===be).length;
  if (CFG.showFns!=='on') __uniKindToggle('function');
  setTimeout(() => { const caps1 = nodes.filter(n=>n.__cap && n.ent===be).length;
    const fnsVis = nodes.filter(n=>n.ent===be && n.kind==='function' && !n.__cap).length;
    if (CFG.showFns==='on') __uniKindToggle('function');
    res({ be, caps0, caps1, fnsVis }); }, 1600);
}));
// PER-SIDE cores (operator: two cores at once) — backend + frontend carry DIFFERENT cores simultaneously
const splitCore = await p.evaluate(() => {
  UNICAP.on = false; __uniApplyCapsules();
  const cl = e => [...new Set(nodes.filter(n=>n.ent===e && !n.__cap).map(n=>n.sub))].filter(s=>s!=='other').length;
  const cnt = e => nodes.filter(n=>n.ent===e && !n.__cap).length;
  const beE = _ents.filter(e => !__uniIsFeEnt(e)).sort((a,b)=>cnt(b)-cnt(a))[0];   // most-pieces backend entity
  const feE = _ents.filter(e =>  __uniIsFeEnt(e)).sort((a,b)=>cnt(b)-cnt(a))[0];   // most-pieces frontend entity
  CFG.coreByBE='community'; CFG.coreByFE='screen'; __uniAssignSplit();
  const beC = cl(beE), feC = cl(feE);
  CFG.coreByBE='kind'; __uniAssignSplit();               // flip ONLY backend
  const beKind = cl(beE), feStill = cl(feE);
  return { beE, feE, beC, feC, beKind, feStill,
           independent: beKind !== beC && feStill === feC };  // backend core CHANGED it, frontend untouched (direction-agnostic)
});
await b.close();

console.log(`nodes ${base.nodes} · entities ${base.ents} · ringed entities ${base.ringedEnts}`);
console.log(`separation: min anchor pair ${base.minAnchorPair} · bleed ${base.bleedPct}%`);
console.log(`kind ring: per-entity ratio ${base.ringRatio} over ${base.ringEnts} entities · pooled ${base.epMeanR}/${base.inMeanR}`);
console.log(`coreBy flip: mean displacement ${after.meanDisp} · moved>4u ${after.movedPct}% · nonFinite ${after.nonFinite}`);
console.log(`fn-join(${fnClust.ent}, use-case): ${fnClust.total} fns → ${fnClust.joined} joined (${fnClust.inDataCluster} into a DATA cluster) · no ƒ· ${fnClust.noFnSep}`);
console.log('fn-legend:', JSON.stringify(fnLegend));
console.log('critical:', JSON.stringify(critical));
console.log('no-surprise-fold:', JSON.stringify(noSurpriseFold));
console.log(`split cores: ${splitCore.beE}=community ${splitCore.beC} + ${splitCore.feE}=screen ${splitCore.feC} · flip BE→kind ${splitCore.beKind}, FE still ${splitCore.feStill}`);
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (!(critical.critHides && critical.gsCrit && critical.modelHidden)) fails.push('the 3-state critical filter / group master is broken (single-caller-same-kind not hidden)');
if (!(noSurpriseFold.caps0===0 && noSurpriseFold.caps1===0 && noSurpriseFold.fnsVis>0)) fails.push('loading functions folded the entity that holds them (surprise fold)');
if (!(fnLegend.boolGone && fnLegend.hasRow && fnLegend.loads && fnLegend.unloads)) fails.push('the legend Function row does not load/unload functions (option B — boolean removal)');
if (errs.length) fails.push('page/console errors');
if (base.minAnchorPair < 180) fails.push('anchors too close (<180)');   // floor, not a fit to one dataset — the entity graph changes with the model
if (base.bleedPct > 8) fails.push('entity bleed >8%');
if (!(base.ringRatio > 1.35 && base.ringEnts >= 3)) fails.push('endpoints not ringing the edge (per-entity ratio ≤ 1.35)');
if (!(after.meanDisp > 5 && after.movedPct > 40)) fails.push('coreBy did not re-arrange nodes');
if (after.nonFinite) fails.push('non-finite node positions');
if (base.ringedEnts < 1) fails.push('no entity got a sub-anchor ring');
if (!(fnClust.noFnSep && fnClust.inDataCluster > 0 && fnClust.joinFrac > 0.5)) fails.push('functions do not JOIN their use-case data cluster (option A — still ƒ· or all-other)');
if (!(splitCore.beC > 3 && splitCore.feC > 3 && splitCore.independent)) fails.push('per-side cores are not independent (backend + frontend do not carry different cores at once)');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('CLUSTERING PROOF: ALL PASS');
