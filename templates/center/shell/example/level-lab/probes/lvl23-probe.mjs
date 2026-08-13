// Round 28 — USE edges: functions that reference models/schemas (archmap
// internal_refs) drawn as service-teal ƒ nodes with fine-dotted "uses" wires;
// cross-entity gated by Connections; no duplicated elements (operator ruling).
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

await T("window.__lvltest.set('trace')");

// 1 · using-fn nodes exist, service-styled, none duplicated
const counts = await pg.evaluate(() => ({
  usefn: document.querySelectorAll('#canvas .fnode.usefn').length,
  fnodes: document.querySelectorAll('#canvas .fnode').length,
  euse: document.querySelectorAll('#canvas .e-use').length }));
console.log('  counts:', JSON.stringify(counts));
ok(counts.usefn===56, 'usefn nodes = 56 (fixture: 70 using-fns − 14 riding endpoints), got '+counts.usefn);
ok(counts.euse>=150, 'use edges drawn (conns default), got '+counts.euse);

// 2 · GLOBAL no-duplicates: every data-key registered exactly once
const dupKeys = await pg.evaluate(() => {
  const seen={}, dup=[];
  document.querySelectorAll('#canvas [data-key]').forEach(g=>{ const k=g.getAttribute('data-key');
    if(seen[k]) dup.push(k); seen[k]=1; });
  return dup; });
ok(dupKeys.length===0, 'no element drawn twice — dupes: '+dupKeys.join(', '));

// 3 · no usefn minted for a handler: patch_preferences may exist as the traced
//     handler ƒ (route wire ep→ƒ by design) but NEVER as a second usefn node
const ride = await pg.evaluate(() => {
  const el=document.querySelector('#canvas [data-key="fn:auth|patch_preferences"]');
  return { minted: el ? el.classList.contains('usefn') : false,
           epNode: !!document.querySelector('#canvas [data-key="ep:auth|PATCH /settings/preferences"]') }; });
ok(!ride.minted && ride.epNode, 'patch_preferences never minted as usefn (rides handler/endpoint)');

// 4 · the allergen story: build_account_export (legal-consent) → UserDietaryProfile (allergen)
const story = await pg.evaluate(() => {
  const fn=document.querySelector('#canvas [data-key="fn:legal-consent|build_account_export"]');
  const cls=document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]');
  const wire=[...document.querySelectorAll('#canvas .e-use title')]
    .some(t=>t.textContent==='build_account_export() uses allergen.UserDietaryProfile');
  return {fn:!!fn, cls:!!cls, wire}; });
console.log('  story:', JSON.stringify(story));
ok(story.fn && story.cls && story.wire, 'legal-consent.build_account_export → allergen.UserDietaryProfile drawn');

// 5 · selection: clicking UserDietaryProfile lights its users (hop-1 includes use edges)
await T('window.__lvltest.setDepth(1)');
await pg.evaluate(() => {
  document.querySelector('#canvas [data-key="cls:allergen|UserDietaryProfile"]')
    .dispatchEvent(new MouseEvent('click',{bubbles:true})); });
const hops = await T('window.__lvltest.hopCounts()');
const panelHasUses = await pg.evaluate(() => { const s=document.querySelector('#panel').textContent;
  return /uses/.test(s) && /build_account_export/.test(s); });
console.log('  hops:', JSON.stringify(hops));
ok(hops[1]>=9, 'UserDietaryProfile hop-1 covers its users (>=9), got '+hops[1]);
ok(panelHasUses, 'panel lists "uses" connectors incl. build_account_export');

// 6 · Connections toggle gates CROSS use wires; own-entity survive
await pg.click('#conns');
const offCounts = await pg.evaluate(() => document.querySelectorAll('#canvas .e-use').length);
console.log('  e-use with conns OFF:', offCounts);
ok(offCounts>0 && offCounts<counts.euse, 'conns OFF hides cross use wires, keeps own-entity ('+offCounts+'<'+counts.euse+')');
await pg.click('#conns');

// 7 · zero-connection remainder shrinks vs round 27 (was 21)
const audit = await T('window.__lvltest.connAudit()');
console.log('  zero-connection nodes:', audit.zero.length, 'of', audit.total);
ok(audit.zero.length<21, 'use edges wire previously-dead endpoints (<21), got '+audit.zero.length);

// 8 · kind mode groups usefns into the functions bubble (no schemas leak)
await T("window.__lvltest.setCluster('kind')");
const grpLeak = await pg.evaluate(() => {
  const bad=[...document.querySelectorAll('#canvas .fnode.usefn')]
    .filter(g=>{ const grp=g.getAttribute('data-grp')||''; return grp.indexOf('functions')<0 && grp.indexOf('other')<0; });
  return bad.map(g=>g.getAttribute('data-key')+':'+g.getAttribute('data-grp')); });
ok(grpLeak.length===0, 'kind mode: usefns cluster as functions — leaks: '+grpLeak.join(', '));
await T("window.__lvltest.setCluster('usecase')");

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl23 (use edges): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
