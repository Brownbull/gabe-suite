/* Proof: walking a journey's steps REVEALS each step's cluster+entity when the fleet has it hidden.
   Hide the entities a journey spans, start it, step through — every step's entity must flip visible.
   Run: node verify-jrnstep.mjs */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
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

const rev = await p.evaluate(() => {
  // a journey whose carriers resolve to nodes in >=2 distinct entities
  let pick = null;
  for (const j of _jrnCollect()) {
    const ents = [...new Set((j.carriers || []).map(id => (NIDS[id] || {}).ent).filter(Boolean))];
    if (ents.length >= 2) { pick = { j, ents }; break; }
  }
  if (!pick) return { found: false };
  // HIDE all those entities via the fleet
  pick.ents.forEach(e => { if (!UNIVIS.ent[e]) UNIVIS.ent[e] = Object.assign({}, _VISDEF); UNIVIS.ent[e].show = 0; });
  applyVis('all');
  const hiddenBefore = pick.ents.map(e => UNIVIS.ent[e].show);          // all 0
  const carrierVisBefore = pick.j.carriers.map(id => { const n = NIDS[id]; return n ? _nodeVisibleFn(n) : null; });
  // start the journey + walk every step
  __uniJrnStart(pick.j.cid);
  const stepped = [];
  for (let s = 0; s < WALK.steps.length; s++) { WALK.i = s; _walkGo(0);
    const n = NIDS[WALK.steps[s]];
    if (n && n.ent) stepped.push({ ent: n.ent, sub: n.sub, entShown: UNIVIS.ent[n.ent].show, vis: _nodeVisibleFn(n) }); }
  return { found: true, cid: pick.j.cid, ents: pick.ents, hiddenBefore, carrierVisBefore, stepped };
});

await b.close();

const someHiddenBefore = rev.found && rev.carrierVisBefore.some(v => v === false);
const allRevealed = rev.found && rev.stepped.length > 0 && rev.stepped.every(s => s.entShown === 1 && s.vis === true);
const pass = rev.found && rev.hiddenBefore.every(v => v === 0) && someHiddenBefore && allRevealed && errs.length === 0;
if (!rev.found) console.log('no journey spans >=2 entities — cannot test');
else {
  console.log('journey ' + rev.cid + ' spans ' + JSON.stringify(rev.ents) + ' — hidden before: ' + JSON.stringify(rev.hiddenBefore));
  console.log('carrier vis BEFORE (some false = they were hidden): ' + JSON.stringify(rev.carrierVisBefore));
  console.log('stepped ' + rev.stepped.length + ' → all entShown=1 & vis=true? ' + allRevealed);
  console.log('  ' + JSON.stringify(rev.stepped.slice(0, 8)));
}
console.log('errors=' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 3).join(' | ') : ''));
console.log(pass ? 'JRNSTEP: PASS' : 'JRNSTEP: FAIL');
process.exit(pass ? 0 : 1);
