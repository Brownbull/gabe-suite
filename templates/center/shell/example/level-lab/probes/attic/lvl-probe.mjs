import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T=async fn=>pg.evaluate(fn);

// L1 Entities — kinds-aware edges
let c = await T('window.__lvltest.counts()');
ok(c.entities===7, 'L1: 7 entities ('+c.entities+')');
ok(c.efk>0 && c.ecalls>0, 'L1: fk (solid) AND calls (dashed) edges both drawn ('+c.efk+' fk, '+c.ecalls+' calls)');
const entPos1 = await T('window.__lvltest.entPos()');

// L2 Pieces — cylinders, S badges, endpoints ON the border
await T("window.__lvltest.set('pieces')");
c = await T('window.__lvltest.counts()');
ok(c.cylinders>20, 'L2: model cylinders drawn ('+c.cylinders+')');
ok(c.sbadges>10, 'L2: schema S badges drawn ('+c.sbadges+')');
ok(c.epmarks>30, 'L2: endpoint markers drawn ('+c.epmarks+')');
const border = await T('window.__lvltest.epOnBorder()');
ok(border.bad===0 && border.ok>30, 'L2: EVERY endpoint marker sits ON its container border ('+border.ok+'/'+(border.ok+border.bad)+')');

// L3 Functions — F glyphs + dashed trust edges
await T("window.__lvltest.set('functions')");
c = await T('window.__lvltest.counts()');
ok(c.fnodes>=35, 'L3: F glyph functions drawn ('+c.fnodes+')');
ok(c.ecalls>=25, 'L3: cross-entity call edges drawn dashed ('+c.ecalls+')');
const layers = await T("(()=>{const s=new Set(); document.querySelectorAll('.fnode').forEach(g=>s.add(g.getAttribute('data-layer'))); return [...s].sort();})()");
ok(layers.includes('web') && layers.includes('api'), 'L3: layers include api AND web/TS ('+layers.join(',')+')');

// L4 Layers — lanes
await T("window.__lvltest.set('layers')");
c = await T('window.__lvltest.counts()');
ok(c.fnodes>=35, 'L4: functions arranged in lanes ('+c.fnodes+')');

// position persistence: entity anchors identical after cycling back
await T("window.__lvltest.set('entities')");
const entPos2 = await T('window.__lvltest.entPos()');
ok(JSON.stringify(entPos1)===JSON.stringify(entPos2), 'position persistence: entity anchors survive level cycling');

// click detail
await T("window.__lvltest.set('functions')");
await pg.click('.fnode');
ok((await T('window.__lvltest.panelText()')).includes('layer'), 'clicking an F opens its detail');

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
