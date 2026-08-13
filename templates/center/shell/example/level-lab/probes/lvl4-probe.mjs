import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T=async fn=>pg.evaluate(fn);

// ── 1: bare icons — no rect around braces, no circle around ƒ (only transparent hit circles) ──
await T("window.__lvltest.set('pieces')");
ok(await T("[...document.querySelectorAll('.piece[data-kind=schema] rect')].filter(r=>!r.closest('.tbadge') && !r.classList.contains('tbadge') && (r.getAttribute('class')||'').indexOf('badge')<0).length")===0, 'schema icon is BARE (no box; proof-badge rects excluded)');
await T("window.__lvltest.set('functions')");
const visCircles = await T("(()=>{let n=0;document.querySelectorAll('.fnode circle').forEach(c=>{if(c.getAttribute('fill')!=='transparent'&&+ (c.getAttribute('r')||0)>4)n++;});return n;})()");
ok(visCircles===0, 'ƒ icon is BARE (no visible container circle; hit circles transparent)');

// ── 2a: the expander is RETIRED (operator ruling) — every endpoint always drawn ──
await T("window.__lvltest.set('pieces')");
ok(await T("document.querySelectorAll('.epmore').length")===0, 'no expander exists (retired — full surface)');
ok(await T('window.__lvltest.counts()').then(c=>c.epmarks)===67, 'all 67 unique endpoints drawn');

// ── 2b: inter-entity gradient edges ON the pieces level ──
const grads = await T("vp=document.getElementById('vp'), vp.querySelectorAll('defs linearGradient').length");
ok(grads>=30, 'L2: inter-entity gradient (amalgamation) edges present ('+grads+')');

// ── 2c: intra wires wear the ENTITY colour ──
const intraColored = await T(`(()=>{const ps=[...document.querySelectorAll('.e-intra,.e-touch')];
  return ps.length>0 && ps.every(p=>p.style.stroke && p.style.stroke!=='');})()`);
ok(intraColored, 'intra FK + touch wires carry an inline entity colour');
ok(await T("document.querySelectorAll('.e-intra').length")>=15, 'intra model→model FK edges drawn');

// ── 3: the TRACE level ──
await T("window.__lvltest.set('trace')");
const tc = await T('window.__lvltest.counts()');
ok(tc.epmarks>20, 'trace: endpoints lane ('+tc.epmarks+')');
ok(tc.fnodes>15, 'trace: handler ƒ lane ('+tc.fnodes+')');
ok(tc.cylinders+tc.sbadges>15, 'trace: models+schemas lane ('+(tc.cylinders+tc.sbadges)+')');
const wires = await T("document.querySelectorAll('.e-touch').length");
ok(wires>50, 'trace: ep→ƒ→class wires drawn ('+wires+')');
await T("window.__lvltest.set('entities')");

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl4 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
