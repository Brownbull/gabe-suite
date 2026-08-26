/* Double-click reveal proof (operator): double-clicking a node un-hides + lights its ONE-HOP
   neighbourhood — every directly-connected element (its cluster + entity) is forced visible if the
   fleet had it hidden, then the whole set is selected.
   [1] a node with a HIDDEN 1-hop neighbour → __uniRevealNeighbors makes that neighbour visible
   [2] one hop only — a 2-hops-away node that was hidden stays hidden
   [3] the onNodeClick double-click path (two clicks <350ms) routes to the reveal
   Run: node verify-dblclick.mjs   (SOLO — headless swiftshader; system chrome) */
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
await p.waitForTimeout(4500);
await p.evaluate(() => { if (window.__uniSetKindState) __uniSetKindState('function', 'all'); if (window.toggleFns) try { toggleFns(true); } catch (e) {} });
await p.waitForTimeout(3000);

const r = await p.evaluate(() => {
  const out = {};
  const id = s => (typeof lid === 'function') ? lid(s) : (s && s.id ? s.id : s);
  // find a node that HAS at least one neighbour of a DIFFERENT entity (so hiding that entity hides the neighbour)
  let pick = null, nb = null;
  for (const n of nodes) {
    const neigh = [];
    links.forEach(l => { const s = id(l.source), t = id(l.target);
      const o = (s === n.id) ? t : (t === n.id ? s : null); if (o != null) neigh.push(o); });
    const cross = neigh.map(x => NIDS[x]).filter(m => m && m.ent && m.ent !== n.ent);
    if (cross.length) { pick = n; nb = cross[0]; break; }
  }
  if (!pick) return { skip: true };
  out.node = pick.id; out.neighbour = nb.id; out.nbEnt = nb.ent;
  // hide the neighbour's whole entity
  UNIVIS.ent[nb.ent] = Object.assign({}, _VISDEF); UNIVIS.ent[nb.ent].show = 0;
  applyVis('all');
  out.hiddenBefore = !_nodeVisibleFn(nb);
  // ONE-HOP scope control: an UNRELATED entity — not pick's, not any 1-hop neighbour's — must stay
  // hidden (the reveal forces on the neighbours' entities+clusters, per "show the cluster and entity",
  // so it legitimately shows those entities' siblings; it must NOT touch an entity with no direct link).
  const neigh1 = new Set(); links.forEach(l => { const s = id(l.source), t = id(l.target);
    const o = (s === pick.id) ? t : (t === pick.id ? s : null); if (o != null && NIDS[o]) neigh1.add(NIDS[o].ent); });
  neigh1.add(pick.ent);
  let far = nodes.find(m => m && m.ent && !neigh1.has(m.ent));
  if (far) { UNIVIS.ent[far.ent] = Object.assign({}, _VISDEF); UNIVIS.ent[far.ent].show = 0; applyVis('all'); }
  out.farEnt = far ? far.ent : null;
  out.farBefore = far ? !_nodeVisibleFn(far) : null;
  // DOUBLE-CLICK the pick → reveal its one-hop neighbourhood
  const revealed = window.__uniRevealNeighbors(pick);
  out.revealed = revealed;
  out.neighbourNowVisible = _nodeVisibleFn(nb);
  out.farStillHidden = far ? !_nodeVisibleFn(far) : null;
  out.selected = (typeof SEL !== 'undefined' && SEL && SEL.data && SEL.data.id === pick.id);
  // [3] the onNodeClick double-click path routes to reveal: re-hide, then two fast clicks
  UNIVIS.ent[nb.ent] = Object.assign({}, _VISDEF); UNIVIS.ent[nb.ent].show = 0; applyVis('all');
  out.reHidden = !_nodeVisibleFn(nb);
  const oc = Graph.onNodeClick(); // getter returns the handler
  if (typeof oc === 'function') { oc(pick); oc(pick); }   // two synchronous clicks → same node, <350ms
  out.dblRevealed = _nodeVisibleFn(nb);
  return out;
});

// search-select === click+focus: __uniGoto reveals a fleet-hidden node then selects+frames it
const gotoR = await p.evaluate(() => {
  let hid = null;
  for (const n of nodes) { if (n && n.ent) { UNIVIS.ent[n.ent] = Object.assign({}, _VISDEF); UNIVIS.ent[n.ent].show = 0; applyVis('all');
    if (!_nodeVisibleFn(n)) { hid = n; break; } UNIVIS.ent[n.ent] = Object.assign({}, _VISDEF); applyVis('all'); } }
  if (!hid) return { skip: true };
  const before = !_nodeVisibleFn(hid);
  window.__uniGoto(hid.id);
  return { skip: false, before, nowVisible: _nodeVisibleFn(hid),
    selected: (typeof SEL !== 'undefined' && SEL && SEL.data && SEL.data.id === hid.id), id: hid.id };
});

const R = [];
const ok = (name, cond, extra) => R.push((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  — ' + extra : ''));
ok('search-select path (__uniGoto) reveals a hidden node then selects+frames it (= click+focus)',
   gotoR.skip || (gotoR.before && gotoR.nowVisible && gotoR.selected),
   gotoR.skip ? 'skip' : `${gotoR.id} before-hidden=${gotoR.before} now-visible=${gotoR.nowVisible} selected=${gotoR.selected}`);
if (r.skip) { console.log('SKIP  no cross-entity neighbour found (unexpected)'); await b.close(); process.exit(1); }
ok('setup: the chosen neighbour started HIDDEN', r.hiddenBefore, `${r.node} → ${r.neighbour} (${r.nbEnt})`);
ok('double-click reveals the one-hop neighbour', r.hiddenBefore && r.neighbourNowVisible,
   `revealed ${r.revealed} neighbour(s); neighbour visible=${r.neighbourNowVisible}`);
ok('one hop only: an UNRELATED entity (no direct link) stays hidden', r.farBefore === null || r.farStillHidden === true,
   `farEnt=${r.farEnt} farBefore=${r.farBefore} farStillHidden=${r.farStillHidden}`);
ok('the clicked node is selected after reveal', r.selected === true);
ok('the onNodeClick double-click path (two clicks <350ms) routes to reveal', r.reHidden && r.dblRevealed === true,
   `reHidden=${r.reHidden} dblRevealed=${r.dblRevealed}`);
ok('no page/console errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(R.join('\n'));
const failed = R.filter(x => x.startsWith('FAIL')).length;
console.log(`\n${R.length - failed}/${R.length} double-click checks passed`);
await b.close();
process.exit(failed ? 1 : 0);
