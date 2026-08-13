import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// Grid gone from the roster
const inRoster = await T("[...document.querySelectorAll('#inSeg button')].map(b=>b.getAttribute('data-in')).join(',')");
ok(inRoster==='tiers,force,columns,rows', 'Inside roster (trimmed round 35) ('+inRoster+')');

// tiers row in the panel (D2, tiers active)
await T("window.__lvltest.set('pieces')");
await T("window.__lvltest.setInside('tiers')");   // the tier row shows under Tiers (default is Force)
await pg.evaluate(() => { const hit=[...document.querySelectorAll('.piece')].find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.startsWith('model ')));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
ok((await T('window.__lvltest.panelText()')).includes('inner ring'), 'panel explains the TIER (models — inner ring)');
await T("window.__lvltest.setInside('force')");

// SELECTION on trace: click a handler ƒ → ring + highlighted connectors + panel list
await T("window.__lvltest.set('trace')");
await pg.evaluate(() => { const fs=[...document.querySelectorAll('.fnode')];
  const hit=fs.find(g=>[...g.querySelectorAll('title')].some(x=>x.textContent.includes('handler')));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
ok(await T("document.querySelectorAll('#vp .selring').length")===1, 'the selected node wears the selection ring');
const hl = await T("document.querySelectorAll('#vp .e-hop1').length");
const faded = await T("document.querySelectorAll('#vp .e-faded').length");
ok(hl>0, '1-hop connectors highlighted ('+hl+')');
ok(faded>10, 'unrelated wires faded ('+faded+')');
ok(await T("document.querySelectorAll('#vp .nbrring').length")>0, 'neighbour nodes ringed');
const ptxt = await T('window.__lvltest.panelText()');
ok(ptxt.includes('connections ('), 'panel lists the connections with a count');
ok(await T("document.querySelectorAll('aside .conrow').length")>0, 'connection rows are present');

// click a connection ROW (its kind chip — the NAME is the round-32 transporter)
await pg.click('aside .conrow .ck');
const etxt = await T('window.__lvltest.panelText()');
ok(etxt.includes('connector') && etxt.includes('from') && etxt.includes('to'), 'a connector row opens the edge card (kind · from · to)');
ok(etxt.includes('handler') || etxt.includes('returns') || etxt.includes('dispatches') || etxt.includes('reads or writes'), 'the card says HOW they connect');

// canvas cross-edge click → edge card too
await pg.evaluate(() => { const e=[...document.querySelectorAll('#vp .e-xfk')][0];
  if(e) e.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
ok((await T('window.__lvltest.panelText()')).includes('cross-fk') || (await T('window.__lvltest.panelText()')).includes('foreign key'), 'clicking a canvas connector inspects it');

// background click clears
await pg.evaluate(() => { const st=document.getElementById('stage');
  st.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:30,clientY:700}));
  window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:30,clientY:700})); });
ok(await T("document.querySelectorAll('#vp .selring,#vp .e-hl').length")===0, 'background click clears the selection');

console.log('errors:', errs.length?errs.slice(0,3):'none'); ok(errs.length===0,'no console errors');
console.log('lvl21 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
