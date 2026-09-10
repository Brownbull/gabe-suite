// paste-probe.mjs — THE ROUND TRIP: a payload copied from a mini pane must open the same view in
// the REAL station, with focus mode on.
//
// This is the only probe in the folder that crosses into templates/center/shell/gabe-universe.html.
// It stages a harness rather than editing anything: the PATCHED station template is copied into a
// scratch dir beside symlinks to the frozen example feeds, so the shipped station is exercised
// against real data without regenerating the example (a browser-gated, minutes-long job).
//
// WHY A ROUND TRIP AND NOT TWO UNIT TESTS
//   The two surfaces disagree about what a "step" is. A pane lists a journey's AUTHORED endpoints
//   (4 for "Store ingredients"); the station walks fe.concat(carriers) (54 for the same journey).
//   Pane step 2 is station step 23. Only an end-to-end assert catches an index sneaking into the
//   payload, which is why `sel` carries a NODE ID and the station finds its own position.
//
//   node paste-probe.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..');
const SHELL = path.join(REPO, 'templates', 'center', 'shell');
const EX = path.join(SHELL, 'example', 'codebase-graph-station');
const SP = process.env.GABE_PASTE_DIR ||
  path.join(process.env.TMPDIR || '/tmp', 'gabe-paste-harness');

/* stage: the patched station + symlinks to the real feeds and assets */
fs.mkdirSync(path.join(SP, 'assets'), { recursive: true });
fs.copyFileSync(path.join(SHELL, 'gabe-universe.html'), path.join(SP, 'gabe-universe.html'));
const link = (from, to) => {
  try { fs.unlinkSync(to); } catch (e) {}
  if (fs.existsSync(from)) fs.symlinkSync(from, to);
};
['c4-graph.js', 'levels.js', 'sim.data.js', 'workflows.js', 'commits.js', 'workflows.draft.js']
  .forEach(f => link(path.join(EX, f), path.join(SP, f)));
['3d-bundle.js', 'chip-assets.js', 'graph-grammar.js', 'gabe-icon.png']
  .forEach(f => link(path.join(SHELL, 'assets', f), path.join(SP, 'assets', f)));

const require = createRequire(process.env.GABE_PW_DIR ||
  '/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/x.js');
const { chromium } = require('playwright');
let P = 0, F = 0;
const ok = (c, m) => { if (c) { P++; } else { F++; console.log('  FAIL: ' + m); } };

const b = await chromium.launch({
  executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--enable-unsafe-swiftshader']
});
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).slice(0, 150)));
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });

await pg.goto('file://' + path.join(SP, 'gabe-universe.html'));
await pg.waitForFunction('typeof window.__uniPasteView === "function"', { timeout:60000 });
await pg.waitForFunction('typeof NIDS !== "undefined" && Object.keys(NIDS).length > 100', { timeout:90000 });
await pg.waitForTimeout(9000);
console.log('station booted ·', await pg.evaluate('Object.keys(NIDS).length'), 'nodes');

// the exact payload the pane emits for the journey view
const payload = {
  gabe:"pane-view", v:1, head:"8356f531", scope:"journey",
  id:"Store ingredients \u2014 add to the pantry", hops:2,
  sel:"endpoint:PATCH /pantry/items/{item_id}",
  step:{ i:2, label:"PATCH /pantry/items/{item_id}", authored:true }, focus:true, tier:1
};
const payloadB = Object.assign({}, payload, { id:"Cook a recipe \u2014 the cooking session", sel:"endpoint:POST /cooking/sessions" });
const PL = o => JSON.stringify(JSON.stringify(o));

// RULE 1 - paste never opens; OPEN lights when there is text; OPEN (or Enter) opens
// the box lives in the HEADER: an icon LEFT of the tier dots opens a popover (operator 2026-09-09)
const where = await pg.evaluate(`(function(){ var b=document.getElementById('pasteBtn'), t=document.getElementById('tiersel');
  return { btn: !!b, leftOfTiers: !!(b&&t) && b.getBoundingClientRect().right <= t.getBoundingClientRect().left + 1,
           inHeader: !!(b && b.closest('.topbar')), stillInJrn: !!document.querySelector('#jrn .jrnpaste'),
           ddOpen: document.getElementById('pastedd').classList.contains('open') }; })()`);
ok(where.btn && where.inHeader, 'the paste icon lives in the header bar');
ok(where.leftOfTiers, 'the paste icon sits LEFT of the tier selector');
ok(!where.stillInJrn, 'the journeys panel no longer carries a paste box');
ok(!where.ddOpen, 'the popover starts closed');
await pg.evaluate(`document.getElementById('pasteBtn').click()`);
await pg.waitForTimeout(250);
const armed0 = await pg.evaluate(`(function(){ var w=document.querySelector('#pastedd .jrnpaste'); return { present: !!w, open: document.getElementById('pastedd').classList.contains('open'),
  label: w && w.querySelector('.pl').textContent, disabled: w && w.querySelector('button').disabled }; })()`);
ok(armed0.present && armed0.open && armed0.label === 'paste a view', 'the icon opens the popover with the paste box');
ok(armed0.disabled === true, 'OPEN is unlit while the box is empty');
const afterPaste = await pg.evaluate(`(function(){ var w=document.querySelector('#pastedd .jrnpaste'), i=w.querySelector('input');
  i.value=${PL(payload)}; i.dispatchEvent(new Event('paste',{bubbles:true})); i.dispatchEvent(new Event('input',{bubbles:true}));
  return { mode: WALK.mode, steps: WALK.steps.length, lit: !w.querySelector('button').disabled }; })()`);
await pg.waitForTimeout(400);
const stillIdle = await pg.evaluate(`({mode: WALK.mode, steps: WALK.steps.length})`);
ok(afterPaste.lit, 'OPEN lights once there is text to open');
ok(stillIdle.mode === null && stillIdle.steps === 0,
  `paste alone must NOT open anything; after paste mode=${stillIdle.mode} steps=${stillIdle.steps}`);

await pg.evaluate(`document.querySelector('#pastedd .jrnpaste button').click()`);
await pg.waitForTimeout(700);
const opened = await pg.evaluate(`(function(){ return { mode: WALK.mode, steps: WALK.steps.length, i: WALK.i,
  at: WALK.steps[WALK.i]||null, first: WALK.steps[0]||null, hlOn: HL.on, hlMode: HL.mode,
  jrn: (HL.jrObj&&HL.jrObj.name)||null, say: document.querySelector('#pastedd .jrnpaste .say').textContent,
  boxEmpty: !document.querySelector('#pastedd .jrnpaste input').value,
  ddClosed: !document.getElementById('pastedd').classList.contains('open'),
  jrnHidden: (document.getElementById('jrn').style.display==='none') }; })()`);
console.log('OPEN \u2192', JSON.stringify(opened));
ok(opened.mode === 'journey', `OPEN must start the journey; mode is ${opened.mode}`);
ok(opened.jrn === payload.id, `OPEN must start THAT journey; it started "${opened.jrn}"`);
// RULE 3 - the first element, not the pane's selection
ok(opened.i === 0 && opened.at === opened.first, `OPEN lands on step 1; it is at ${opened.i+1}`);
ok(/at step 1/.test(opened.say), `the say-line reports the position; got "${opened.say}"`);
ok(/selection is step \d+/.test(opened.say), `the pane's selection is carried as a NOTE; got "${opened.say}"`);
// RULE 4 - focused
ok(opened.hlOn && opened.hlMode === 'focus', `a pasted view arrives focused; HL.mode is "${opened.hlMode}"`);
ok(opened.boxEmpty, 'a successful open clears the box');
ok(opened.ddClosed, 'a successful open CLOSES the popover');
ok(opened.jrnHidden, 'a successful open hides the journeys picker too (operator)');
const lenA = opened.steps;

// RULE 2 - a second open REPLACES; it never adds (the 84-step trail the operator saw)
const second = await pg.evaluate(`(function(){ var r=window.__uniPasteView(${PL(payloadB)});
  return { ok:r.ok, say:r.say, mode: WALK.mode, steps: WALK.steps.length, i: WALK.i, jrn:(HL.jrObj&&HL.jrObj.name)||null,
           pins: Object.keys(window.__uniPin||{}).length, hlMode: HL.mode }; })()`);
const lenB = await pg.evaluate(`(function(){ __uniHLClear(); var j=_jrnCollect().filter(function(x){return x.name===${JSON.stringify(payloadB.id)};})[0];
  __uniJrnStart(j.cid); var n=WALK.steps.length; __uniHLClear(); return n; })()`);
ok(second.ok && second.jrn === payloadB.id, `the second open starts journey B; got "${second.jrn}" (${second.say})`);
ok(second.steps === lenB, `the second open REPLACES the walk: ${second.steps} steps, journey B alone is ${lenB} (A was ${lenA})`);
ok(second.steps < lenA + lenB, 'the walks were not concatenated');
// pins are keyed by node id and a walk REPEATS carriers ("a repeated model keeps its own writer"), so
// the honest comparison is against the walk's DISTINCT ids, never its length
const distinctB = await pg.evaluate(`(function(){ __uniHLClear(); var j=_jrnCollect().filter(function(x){return x.name===${JSON.stringify(payloadB.id)};})[0];
  __uniJrnStart(j.cid); var u={}; WALK.steps.forEach(function(id){u[id]=1;}); var n=Object.keys(u).length; __uniHLClear(); return n; })()`);
ok(second.pins === distinctB, `pins belong to the new walk only: ${second.pins} pinned, walk B has ${distinctB} distinct ids`);
ok(second.i === 0 && second.hlMode === 'focus', 'the second open also lands on step 1, focused');

// a selection OUTSIDE the walk must not turn the journey into a trail (the old reader's bug)
// pick a REAL node that is provably not on the pantry walk, in-page, rather than guessing one
const off = await pg.evaluate(`(function(){ var pl=${PL(payload)}; var d=JSON.parse(pl);
  __uniHLClear(); var j=_jrnCollect().filter(function(x){return x.name===d.id;})[0]; __uniJrnStart(j.cid);
  var on={}; WALK.steps.forEach(function(id){on[id]=1;}); var offId=Object.keys(NIDS).filter(function(k){return !on[k];})[0]; __uniHLClear();
  d.sel=offId; var r=window.__uniPasteView(JSON.stringify(d));
  return { ok:r.ok, mode: WALK.mode, steps: WALK.steps.length, say:r.say, offId:offId }; })()`);
ok(off.ok && off.mode === 'journey' && off.steps === lenA,
  `a sel off the walk keeps the JOURNEY (mode=${off.mode}, steps=${off.steps}); "${off.say}"`);
ok(/not on this walk/.test(off.say), `and says so; got "${off.say}"`);

// a payload from another map still opens, and SAYS so
const other = await pg.evaluate(`window.__uniPasteView(${PL(Object.assign({}, payload, {head:'deadbeef'}))})`);
ok(other.ok && /deadbeef/.test(other.say), `a view from another map must open AND report it; got "${other.say}"`);

// junk is refused, not swallowed - and refusing does not disturb the running walk
for (const [txt, why] of [['', 'empty'], ['not json', 'garbage'], ['{"a":1}', 'wrong shape']]) {
  const bad = await pg.evaluate(`window.__uniPasteView(${JSON.stringify(txt)})`);
  ok(!bad.ok && bad.say.length > 4, `${why} input must be refused with a reason; got "${bad.say}"`);
}

// an entity payload opens its panel, FRAMES the cluster and FOCUSES it (operator 2026-09-09:
// "it's selecting the pantry entity, but the camera doesn't go where the pantry entity is")
await pg.evaluate(`__uniSetTier(3)`);   /* the operator's station may sit at any tier — the paste must bring the pane's */
const ent = await pg.evaluate(`(function(){
  var before = Graph.cameraPosition(); before = [before.x, before.y, before.z];
  var r=window.__uniPasteView(${PL({gabe:"pane-view",v:1,head:"8356f531",scope:"entity",id:"pantry",hops:1,sel:null,step:null,focus:true,tier:1})});
  var eids = nodes.filter(function(x){ return x.ent==='pantry'; }).map(function(x){ return x.id; });
  var litAll = eids.every(function(id){ return HL.set && HL.set[id] !== undefined; });
  var litOnly = Object.keys(HL.set||{}).every(function(id){ return eids.indexOf(id) >= 0; });
  return { ok:r.ok, say:r.say, mode: WALK.mode, n: eids.length, before: before, hlOn: HL.on, hlMode: HL.mode, exact: HL.exact, litAll: litAll, litOnly: litOnly,
           tier: window.__uniTier, hookOff: (window.__uniKindState||{}).hook, fnOff: (window.__uniKindState||{}).function }; })()`);
await pg.waitForTimeout(1100);   /* _frameSet animates 900 ms */
const camAfter = await pg.evaluate(`(function(){ var c=Graph.cameraPosition(); return [c.x,c.y,c.z]; })()`);
const moved = Math.abs(camAfter[0]-ent.before[0]) + Math.abs(camAfter[1]-ent.before[1]) + Math.abs(camAfter[2]-ent.before[2]);
ok(ent.ok && /pantry/.test(ent.say) && /framed/.test(ent.say), `an entity payload must open AND frame; got "${ent.say}"`);
ok(ent.mode === null, `opening an entity clears the journey first; mode is ${ent.mode}`);
ok(moved > 20, `the camera must travel to the entity's cluster; it moved ${Math.round(moved)} units`);
ok(ent.hlOn && ent.hlMode === 'focus' && ent.exact, `the entity opens FOCUSED as an exact set; on=${ent.hlOn} mode=${ent.hlMode} exact=${ent.exact}`);
ok(ent.litAll && ent.litOnly, `the focus set is the entity's ${ent.n} pieces, all of them and only them (all=${ent.litAll} only=${ent.litOnly})`);
ok(ent.tier === 1 && ent.hookOff === 'off' && ent.fnOff === 'off' && /T1/.test(ent.say),
   `the pane's TIER lands on the station (T3 -> T1: hooks + functions off, said in the line); tier=${ent.tier} hook=${ent.hookOff} fn=${ent.fnOff} say="${ent.say}"`);
// a payload WITHOUT a tier (an older copy) leaves the station's tier alone
const noTier = await pg.evaluate(`(function(){ __uniSetTier(2); var r=window.__uniPasteView(${PL({gabe:"pane-view",v:1,head:"8356f531",scope:"entity",id:"pantry",hops:1,sel:null,step:null,focus:true})}); return { ok:r.ok, tier: window.__uniTier, say:r.say }; })()`);
ok(noTier.ok && noTier.tier === 2 && !/T\d/.test(noTier.say), `a tier-less payload leaves the tier where it was (T2); tier=${noTier.tier} say="${noTier.say}"`);

ok(errs.length === 0, 'console errors: ' + errs.slice(0,3).join(' | '));
// ── COMMIT and TEST views round-trip too (operator 2026-09-10: a board commit arrived as one piece) ──
const commitPayload = { gabe:"pane-view", v:1, head:"8356f531", scope:"commit", id:"a99719f3", hops:1, tier:1,
  sel:"fe:apps/web/src/features/pantry/screens/PantryStateContent.tsx#PantryStateContent", step:null, focus:true };
const expect = await pg.evaluate(`(function(){ var c=(window.GABE_COMMITS||[]).filter(function(x){ return x.short==='a99719f3'; })[0];
  return { have: !!c, touched: c ? c.touched.length : 0, drawn: c ? c.touched.filter(function(id){ return !!NIDS[id]; }).length : 0 }; })()`);
const cOpen = await pg.evaluate(`(function(){ var r=window.__uniPasteView(${PL(commitPayload)}); return { ok:r.ok, say:r.say, mode:WALK.mode, steps:WALK.steps.length, i:WALK.i,
  commit: !!(HL.jrObj&&HL.jrObj.commit), short:(HL.jrObj&&HL.jrObj.short)||null, hlOn:HL.on, hlMode:HL.mode, pins:Object.keys(window.__uniPin||{}).length }; })()`);
console.log('COMMIT OPEN →', JSON.stringify(cOpen), '· feed', JSON.stringify(expect));
ok(expect.have && expect.drawn > 10, `commits.js carries a99719f3 with drawn touched pieces (${expect.drawn} of ${expect.touched})`);
ok(cOpen.ok && cOpen.mode === 'journey' && cOpen.commit && cOpen.short === 'a99719f3', `a pasted COMMIT starts the station's own commit walk; got ${JSON.stringify({ok:cOpen.ok, mode:cOpen.mode, short:cOpen.short})}`);
ok(cOpen.steps === expect.drawn, `the walk holds every touched piece still on the map: ${cOpen.steps} steps vs ${expect.drawn} drawn`);
ok(cOpen.steps > 1 && cOpen.i === 0 && cOpen.hlOn && cOpen.hlMode === 'focus', `it lands on step 1, focused, and is NOT a one-piece trail (${cOpen.steps} steps)`);
ok(/commit a99719f3 · \d+ touched pieces · at step 1/.test(cOpen.say), `the say-line names the commit and its size; got "${cOpen.say}"`);
ok(/selection is step \d+|not on this walk/.test(cOpen.say), `the pane's selection is carried as a note; got "${cOpen.say}"`);
const tPayload = { gabe:"pane-view", v:1, head:"8356f531", scope:"test", id:"C250", hops:1, tier:1, sel:null, step:null, focus:true };
const tOpen = await pg.evaluate(`(function(){ var r=window.__uniPasteView(${PL(tPayload)}); return { ok:r.ok, say:r.say, mode:WALK.mode, steps:WALK.steps.length, cid:HL.jr }; })()`);
console.log('TEST OPEN →', JSON.stringify(tOpen));
ok(tOpen.ok && tOpen.mode === 'journey' && tOpen.cid === 'C250' && tOpen.steps > 1, `a pasted TEST case starts its journey; got ${JSON.stringify({ok:tOpen.ok, cid:tOpen.cid, steps:tOpen.steps})}`);
const none = await pg.evaluate(`(function(){ var r=window.__uniPasteView(${PL(Object.assign({}, commitPayload, { id:"deadbeef" }))}); return { ok:r.ok, say:r.say, mode:WALK.mode }; })()`);
ok(!none.ok && /no commit .deadbeef./.test(none.say) , `an unknown commit is refused by name; got "${none.say}"`);

await b.close();


console.log(`\n${P} passed · ${F} failed`);
process.exit(F?1:0);
