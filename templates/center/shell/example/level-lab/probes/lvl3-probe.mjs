import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T=async fn=>pg.evaluate(fn);

// ── L2: no container overlap after declutter ──
await T("window.__lvltest.set('pieces')");
ok(await T('window.__lvltest.containerOverlap()')===0, 'L2: zero container overlap after declutter');

// touch wires: endpoint → the pieces it reads/writes
const wires = await T('window.__lvltest.touchWires()');
ok(wires>=25, 'L2: endpoint→piece touch wires drawn ('+wires+')');

// real icons: schema braces + fn ƒ-curve
ok(await T('window.__lvltest.schemaIcons()')>0, 'L2: schemas wear the curly-brace icon');

// the FULL surface always shows (expander retired round 27; 67 unique endpoints)
const cAll = await T('window.__lvltest.counts()');
console.log('  epmarks (always-full surface):', cAll.epmarks);
ok(cAll.epmarks===67, 'L2: the full endpoint surface always shows (67 unique, deduped)');
ok(await T('window.__lvltest.containerOverlap()')===0, 'L2: no container overlap at full surface');

// drag: moving an entity relocates its container, no overlap introduced check skipped (user-driven)
const p0 = await T("window.__lvltest.entPos()");
await T("window.__lvltest.dragEntity('pantry', 120, 60)");
const p1 = await T("window.__lvltest.entPos()");
ok(p1.pantry[0]-p0.pantry[0]===120 && p1.pantry[1]-p0.pantry[1]===60, 'L2: dragging pantry moves its anchor');

// inside layout: grid arranges pieces differently than ring
const ring = await T("(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
await T("window.__lvltest.setInside('grid')");
const grid = await T("(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
ok(ring!==grid, 'gear: Inside=Grid rearranges the pieces');
await T("window.__lvltest.setInside('force')");
ok(await T('window.__lvltest.inside()')==='force', 'gear: Inside=Force applies');
await T("window.__lvltest.setInside('ring')");

// ── L3: ƒ icons + inside layout applies to clusters too ──
await T("window.__lvltest.set('functions')");
ok(await T('window.__lvltest.fnIcons()')>=35, 'L3: functions wear the ƒ-curve icon ('+await T('window.__lvltest.fnIcons()')+')');
ok(await T('window.__lvltest.containerOverlap()')===0, 'L3: clusters decluttered, zero overlap');
const f1 = await T("(()=>{const o=[];document.querySelectorAll('.fnode').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
await T("window.__lvltest.setInside('grid')");
const f2 = await T("(()=>{const o=[];document.querySelectorAll('.fnode').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
ok(f1!==f2, 'gear: Inside layout rearranges L3 clusters too');
await T("window.__lvltest.setInside('ring')");

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl3 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
