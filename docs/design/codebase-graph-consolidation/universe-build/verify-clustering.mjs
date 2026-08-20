/* Batch-9 clustering proof against the committed example page:
   [1] 0 page/console errors · [2] entity separation (anchor spacing + bleed fraction)
   [3] kind ring — endpoints sit FARTHER from their entity anchor than models/schemas
   [4] Cluster Core By physically re-arranges nodes (reheat + displacement)
   Run: node verify-clustering.mjs   (needs google-chrome-stable + the spike's playwright-core) */
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
await p.waitForTimeout(4500);   // let the 240-tick settle finish

const base = await p.evaluate(() => {
  const anchors = Object.keys(EX).map(e => ({ e, x: EX[e], y: EY[e], z: EZ[e] }));
  let minPair = 1e9;
  for (let i = 0; i < anchors.length; i++) for (let j = i + 1; j < anchors.length; j++) {
    const a = anchors[i], c = anchors[j];
    minPair = Math.min(minPair, Math.hypot(a.x - c.x, a.y - c.y, a.z - c.z)); }
  const rOf = n => Math.hypot((n.x||0)-(EX[n.ent]||0), (n.y||0)-(EY[n.ent]||0), (n.z||0)-(EZ[n.ent]||0));
  let bleed = 0, epR = [], inR = [];
  nodes.forEach(n => {
    let own = 1e9, foreign = 1e9;
    anchors.forEach(a => { const d = Math.hypot((n.x||0)-a.x, (n.y||0)-a.y, (n.z||0)-a.z);
      if (a.e === n.ent) own = d; else foreign = Math.min(foreign, d); });
    if (foreign < own) bleed++;
    if (n.kind === 'endpoint') epR.push(rOf(n));
    if (n.kind === 'model' || n.kind === 'schema') inR.push(rOf(n)); });
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  const subEnts = Object.keys(SUBANCHOR).filter(e => Object.keys(SUBANCHOR[e]).length >= 2).length;
  return { nodes: nodes.length, ents: anchors.length, minAnchorPair: Math.round(minPair),
    bleedPct: +(100 * bleed / nodes.length).toFixed(1),
    epMeanR: Math.round(mean(epR)), inMeanR: Math.round(mean(inR)),
    ringedEnts: subEnts, pos: nodes.map(n => [n.id, Math.round(n.x||0), Math.round(n.y||0), Math.round(n.z||0)]) };
});

// flip the core → nodes must MOVE (reheat), not just the hulls recolor
await p.evaluate(() => { CFG.coreBy = 'kind'; applyCfg('coreBy'); });
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
await b.close();

console.log(`nodes ${base.nodes} · entities ${base.ents} · ringed entities ${base.ringedEnts}`);
console.log(`separation: min anchor pair ${base.minAnchorPair} · bleed ${base.bleedPct}%`);
console.log(`kind ring: endpoints meanR ${base.epMeanR} vs models/schemas meanR ${base.inMeanR}`);
console.log(`coreBy flip: mean displacement ${after.meanDisp} · moved>4u ${after.movedPct}% · nonFinite ${after.nonFinite}`);
console.log(`errors ${errs.length}`); errs.slice(0, 6).forEach(e => console.log(' ', e));

const fails = [];
if (errs.length) fails.push('page/console errors');
if (base.minAnchorPair < 220) fails.push('anchors too close (<220)');
if (base.bleedPct > 8) fails.push('entity bleed >8%');
if (!(base.epMeanR > base.inMeanR * 1.5)) fails.push('endpoints not ringing the edge (epR ≤ 1.5×inR)');
if (!(after.meanDisp > 5 && after.movedPct > 40)) fails.push('coreBy did not re-arrange nodes');
if (after.nonFinite) fails.push('non-finite node positions');
if (base.ringedEnts < 1) fails.push('no entity got a sub-anchor ring');
if (fails.length) { console.error('FAIL:', fails.join(' · ')); process.exit(1); }
console.log('CLUSTERING PROOF: ALL PASS');
