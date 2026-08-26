/* Backend-journeys walk proof: the write-path enrichment makes representative backend
   journeys walkable END-TO-END in the drawn graph — endpoint → handler → calls (d2w heat,
   orange near the write) → write-anchor → RED access wire → model.
   [1] TEMPLATE (POST /setup/complete): the boundary→writer hops the handler-only rule hid
       are DRAWN (complete_setup → _upsert_*), incl. the 0→1 delegating-writer hop
   [2] the WRITE-FABRIC solo exemption: at boot 'critical' the chain's single-caller
       anchors stay visible (they used to fold as solo helpers)
   [3] the previously INVISIBLE writers are drawn + red-wired (clear_pending_… → Notification;
       delete_session_photos → CookingPhoto)
   [4] band semantics on the walked chain: boundary→writer wire = band 0 (orange);
       writer→model access wire rel=fnwrites (RED)
   [5] a full journey walk: __uniGoto(endpoint) then double-click chain reveals hop by hop
   Run: node verify-backend-journeys.mjs   (SOLO — headless swiftshader; system chrome) */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.GABE_PW_DIR || path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);

let pass = 0, fail = 0;
const ck = (c, m, x) => { if (c) { pass++; console.log('PASS  ' + m + (x ? '  — ' + x : '')); }
  else { fail++; console.log('FAIL  ' + m + (x ? '  — ' + x : '')); } };

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);

/* ── [2] FIRST, at BOOT state (functions at their 3-state default = critical): the write
   fabric must be visible — this is the state the operator actually lands in. */
const boot = await p.evaluate(() => {
  const H = 'apps/api/services/setup.py#_upsert_dietary';
  const n = NIDS[H];
  const st = (window.__uniKindState && __uniKindState['function']) || '(default)';
  return { drawn: !!n, solo: n ? !!n.__solo : null, visible: n ? _nodeVisibleFn(n) : null, state: st };
});
ck(boot.drawn, 'boot: the enriched write-anchor _upsert_dietary is DRAWN at boot',
  'state=' + boot.state);
ck(boot.solo === false, 'WRITE-FABRIC solo exemption: a single-caller write-anchor is NOT solo',
  'solo=' + boot.solo);
ck(boot.visible === true, 'the write-anchor is VISIBLE at boot critical (used to fold as a helper)',
  'visible=' + boot.visible);

/* full function layer on for the chain/edge asserts */
await p.evaluate(() => { if (window.__uniSetKindState) __uniSetKindState('function', 'all'); if (window.toggleFns) try { toggleFns(true); } catch (e) {} });
await p.waitForTimeout(3000);

const r = await p.evaluate(() => {
  const out = {};
  const id = s => (typeof lid === 'function') ? lid(s) : (s && s.id ? s.id : s);
  const E = {}; links.forEach(l => { E[id(l.source) + '→' + id(l.target)] = l; });
  const has = (s, t) => !!E[s + '→' + t];
  const SC = 'apps/api/api/setup.py#setup_complete', CS = 'apps/api/services/setup.py#complete_setup';
  const UD = 'apps/api/services/setup.py#_upsert_dietary', UE = 'apps/api/services/setup.py#_upsert_exploration';
  const UEP = 'apps/api/services/exploration.py#upsert_exploration_preferences';
  /* [1] the template chain is drawn end-to-end */
  out.hop0 = has('endpoint:POST /setup/complete', SC);            // endpoint → handler
  out.hop1 = has(SC, CS);                                          // handler → boundary
  out.hop2 = has(CS, UD);                                          // boundary → writer (0→0)
  out.hop2b = has(CS, UE);                                         // boundary → DELEGATING writer (0→1)
  /* the delegate's own descent — the 1→0 hop into the exploration service */
  out.hop3 = has(UE, UEP);
  /* [4] band + red wire on the walked chain */
  /* __d2wBand returns the band COLOUR int — compare against BANDPAL[0] (orange, at-the-write) */
  out.bandFn = (typeof __d2wBand === 'function') ? (__d2wBand(NIDS[UD]) >>> 0) : null;
  out.band0 = window.BANDPAL ? (window.BANDPAL[0] >>> 0) : null;
  const red = links.find(l => id(l.source) === UD && l.rel === 'fnwrites');
  out.redWire = red ? id(red.target) : null;
  /* [3] the previously invisible writers, drawn + red-wired */
  const CP = 'apps/api/services/notifications.py#clear_pending_cooking_timer_notifications';
  const DP = 'apps/api/services/cooking_photos.py#delete_session_photos';
  out.notifDrawn = !!NIDS[CP];
  out.notifRed = links.some(l => id(l.source) === CP && l.rel === 'fnwrites' && id(l.target) === 'model:Notification');
  out.photoDrawn = !!NIDS[DP];
  out.photoRed = links.some(l => id(l.source) === DP && l.rel === 'fnwrites' && id(l.target) === 'model:CookingPhoto');
  out.notifEdge = has('apps/api/services/cooking.py#complete_session', CP);
  out.photoEdge = has('apps/api/services/cooking.py#cancel_session', DP);
  return out;
});
ck(r.hop0 && r.hop1, 'TEMPLATE hops drawn: endpoint→setup_complete→complete_setup',
  'hop0=' + r.hop0 + ' hop1=' + r.hop1);
ck(r.hop2, 'the boundary→writer hop (0→0) is DRAWN: complete_setup→_upsert_dietary');
ck(r.hop2b && r.hop3, 'the boundary→DELEGATING-writer hop (0→1) + its descent are DRAWN',
  'hop2b=' + r.hop2b + ' hop3=' + r.hop3);
ck(r.bandFn !== null && r.bandFn === r.band0, 'the walked wire lands in band 0 (orange, at-the-write)',
  'band=0x' + (r.bandFn || 0).toString(16) + ' pal0=0x' + (r.band0 || 0).toString(16));
ck(r.redWire === 'model:UserDietaryProfile', 'the write-anchor carries its RED access wire to the model',
  '→ ' + r.redWire);
ck(r.notifDrawn && r.notifRed && r.notifEdge,
  'invisible writer #1 drawn+wired: complete_session→clear_pending_…→Notification (red)',
  'drawn=' + r.notifDrawn + ' red=' + r.notifRed + ' edge=' + r.notifEdge);
ck(r.photoDrawn && r.photoRed && r.photoEdge,
  'invisible writer #2 drawn+wired: cancel_session→delete_session_photos→CookingPhoto (red)',
  'drawn=' + r.photoDrawn + ' red=' + r.photoRed + ' edge=' + r.photoEdge);

/* ── [5] the WALK itself: hide the boundary's CLUSTER first (hidden-before is asserted — a
   reveal that stops revealing must turn this section red), then walk: select the endpoint,
   double-click the handler, double-click the boundary. Reveal calls are DIRECT — a renamed
   __uniRevealNeighbors throws a page error instead of silently skipping (review MAJOR). */
const w0 = await p.evaluate(() => {
  if (window.__uniHLClear) __uniHLClear();
  const b = NIDS['apps/api/services/setup.py#complete_setup'];
  const k = b.ent + '|' + b.sub;
  UNIVIS.sub[k] = Object.assign({}, _VISDEF); UNIVIS.sub[k].show = 0;
  applyVis('all');
  return { key: k, boundaryHiddenBefore: !_nodeVisibleFn(b) };
});
ck(w0.boundaryHiddenBefore === true, 'walk setup: the commit boundary starts CLUSTER-hidden', w0.key);
await p.evaluate(() => { __uniGoto('endpoint:POST /setup/complete'); });
await p.waitForTimeout(1200);
const w1 = await p.evaluate(() => ({
  sel: (typeof SEL !== 'undefined' && SEL && SEL.data) ? SEL.data.id : null }));
ck(w1.sel === 'endpoint:POST /setup/complete', 'walk step 1: __uniGoto selects+frames the endpoint', 'sel=' + w1.sel);
/* the usecase core homes the boundary fn in the ENDPOINT's own cluster, so __uniGoto
   legitimately re-revealed it — re-hide mid-walk (an operator can), then the double-click
   must bring it back. hiddenBefore is captured INSIDE the step: a dead reveal goes red. */
const w2 = await p.evaluate(() => {
  const b = NIDS['apps/api/services/setup.py#complete_setup'];
  const k = b.ent + '|' + b.sub;
  UNIVIS.sub[k] = Object.assign({}, _VISDEF); UNIVIS.sub[k].show = 0;
  applyVis('all');
  const hiddenBefore = !_nodeVisibleFn(b);
  __uniRevealNeighbors(NIDS['apps/api/api/setup.py#setup_complete']);
  return { hiddenBefore, boundaryVisible: _nodeVisibleFn(b) };
});
ck(w2.hiddenBefore === true && w2.boundaryVisible === true,
  'walk step 2: double-click the handler REVEALS the re-hidden commit boundary',
  'hiddenBefore=' + w2.hiddenBefore + ' visibleAfterReveal=' + w2.boundaryVisible);
const w3 = await p.evaluate(() => {
  __uniRevealNeighbors(NIDS['apps/api/services/setup.py#complete_setup']);
  const wtr = NIDS['apps/api/services/setup.py#_upsert_dietary'];
  return { writerVisible: _nodeVisibleFn(wtr), modelDrawn: !!NIDS['model:UserDietaryProfile'],
    sel: (typeof SEL !== 'undefined' && SEL && SEL.data) ? SEL.data.id : null };
});
ck(w3.writerVisible === true && w3.modelDrawn && w3.sel === 'apps/api/services/setup.py#complete_setup',
  'walk step 3: double-click the boundary lights the writers + their models, selection follows',
  'writer=' + w3.writerVisible + ' model=' + w3.modelDrawn + ' sel=' + w3.sel);

ck(errs.length === 0, 'no page/console errors', errs.slice(0, 3).join(' | '));
await b.close();
console.log(`\n${pass}/${pass + fail} backend-journey checks passed`);
process.exit(fail ? 1 : 0);
