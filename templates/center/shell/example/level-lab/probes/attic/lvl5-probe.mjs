import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T=async fn=>pg.evaluate(fn);
const piecePos = "(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()";

// ── FIX 1: inside Force now DIFFERS from Ring (edges feed it) ──
await T("window.__lvltest.set('pieces')");
const ring = await T(piecePos);
await T("window.__lvltest.setInside('force')");
const force = await T(piecePos);
ok(ring!==force, 'L2 inside: Force ≠ Ring (fed by intra FK edges)');
// quantify: at least a third of recipe's pieces moved >12px
const moved = await T(`(()=>{
  const a='${ring}'.split(';'), b='${force}'.split(';');
  let m=0, n=Math.min(a.length,b.length);
  const xy=s=>{const r=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(s); return r?[+r[1],+r[2]]:[0,0];};
  for(let i=0;i<n;i++){ const p=xy(a[i]), q=xy(b[i]); if(Math.hypot(p[0]-q[0],p[1]-q[1])>12) m++; }
  return {m, n};})()`);
ok(moved.m > moved.n/3, 'Force moved a real share of pieces ('+moved.m+'/'+moved.n+')');

// ── the 4th option: Columns groups models|schemas ──
await T("window.__lvltest.setInside('columns')");
ok(await T('window.__lvltest.inside()')==='columns', 'Columns option exists and applies');
const colsDiffer = (await T(piecePos)) !== force;
ok(colsDiffer, 'Columns arranges differently again');
await T("window.__lvltest.setInside('ring')");

// ── FIX 2: L2 coupling is PIECE-to-PIECE, no entity-to-entity lines ──
ok(await T("document.querySelectorAll('#vp .e-xfk').length")>=25, 'piece→piece cross FK edges drawn ('+await T("document.querySelectorAll('#vp .e-xfk').length")+')');
ok(await T("document.querySelectorAll('#vp .e-calls, #vp .e-fk, #vp .e-imports').length")===0,
   'NO entity-to-entity kind lines on L2 (they belong to L1)');
// cross edges carry the amalgamation gradient + click detail
ok(await T("document.querySelectorAll('#vp defs linearGradient').length")>=25, 'cross piece edges wear gradients');
await T(`(()=>{const h=[...document.querySelectorAll('#vp path[stroke=transparent]')].find(x=>x.previousSibling&&x.previousSibling.classList&&x.previousSibling.classList.contains('e-xfk'));
  if(h) h.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()`);
ok((await T('window.__lvltest.panelText()')).includes('via column'), 'clicking a cross piece edge shows the fk detail');

// L1 unchanged: entity-to-entity kinds still live there
await T("window.__lvltest.set('entities')");
ok(await T("document.querySelectorAll('#vp .e-calls').length")>0, 'L1 keeps its entity-level kinds edges');

// L3: force also fed by call edges (differs from ring)
await T("window.__lvltest.set('functions')");
const f_ring = await T("(()=>{const o=[];document.querySelectorAll('.fnode').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
await T("window.__lvltest.setInside('force')");
const f_force = await T("(()=>{const o=[];document.querySelectorAll('.fnode').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
ok(f_ring!==f_force, 'L3 inside: Force ≠ Ring (fed by call edges)');
await T("window.__lvltest.setInside('ring')");

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl5 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
