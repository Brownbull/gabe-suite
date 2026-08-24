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
await p.evaluate(() => { CFG.coreByBE = 'community'; applyCfg('coreByBE'); if (CFG.showFns!=='on'){ CFG.showFns='on'; toggleFns(true); } });
await p.waitForTimeout(3500);
const fnClust = await p.evaluate(() => {
  // pick the entity with the MOST functions (call structure) — not the alphabetical first
  const ent = _ents.slice().sort((a,b) => nodes.filter(n=>n.ent===b&&n.kind==='function').length
    - nodes.filter(n=>n.ent===a&&n.kind==='function').length)[0];
  assignSub('community');
  const fns = nodes.filter(n => n.ent===ent && n.kind==='function');
  const clustered = fns.filter(n => n.sub && n.sub!=='other');
  const feCommunities = [...new Set(clustered.map(n=>n.sub))];
  const fnNamed = feCommunities.every(s => /^ƒ·/.test(s));   // function + module communities both wear ƒ·
  return { ent, total: fns.length, clustered: clustered.length, communities: feCommunities.length, fnNamed,
           otherFrac: +((fns.length-clustered.length)/Math.max(1,fns.length)).toFixed(2) };
});
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
console.log(`fn-clustering(${fnClust.ent}): ${fnClust.total} fns → ${fnClust.communities} ƒ· communities · ${fnClust.clustered} clustered · other ${(fnClust.otherFrac*100).toFixed(0)}%`);
console.log(`split cores: ${splitCore.beE}=community ${splitCore.beC} + ${splitCore.feE}=screen ${splitCore.feC} · flip BE→kind ${splitCore.beKind}, FE still ${splitCore.feStill}`);
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (base.minAnchorPair < 180) fails.push('anchors too close (<180)');   // floor, not a fit to one dataset — the entity graph changes with the model
if (base.bleedPct > 8) fails.push('entity bleed >8%');
if (!(base.ringRatio > 1.35 && base.ringEnts >= 3)) fails.push('endpoints not ringing the edge (per-entity ratio ≤ 1.35)');
if (!(after.meanDisp > 5 && after.movedPct > 40)) fails.push('coreBy did not re-arrange nodes');
if (after.nonFinite) fails.push('non-finite node positions');
if (base.ringedEnts < 1) fails.push('no entity got a sub-anchor ring');
if (!(fnClust.communities >= 3 && fnClust.fnNamed && fnClust.otherFrac < 0.35)) fails.push('backend functions did not cluster into ƒ· communities (still dumping into other)');
if (!(splitCore.beC > 3 && splitCore.feC > 3 && splitCore.independent)) fails.push('per-side cores are not independent (backend + frontend do not carry different cores at once)');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('CLUSTERING PROOF: ALL PASS');
