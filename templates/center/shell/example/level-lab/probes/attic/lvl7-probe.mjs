import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// ── D2: dotted + curved cross edges, all endpoints, tiers default ──
await T("window.__lvltest.set('pieces')");
ok(await T('window.__lvltest.inside()')==='tiers', 'Tiers is the default inside layout');
ok(await T('window.__lvltest.counts()').then(c=>c.epmarks)===99, 'D2: all 99 endpoints always shown');
ok(await T("document.querySelectorAll('.epmore').length")===0, 'D2: expander gone');
const dotted = await T("(()=>{const e=document.querySelector('#vp .e-xfk');return e?e.getAttribute('stroke-dasharray'):null;})()");
ok(dotted==='2 5', 'D2: inter-entity piece edges are DOTTED ('+dotted+')');
const cs = await T('window.__lvltest.curvedShare()');
ok(cs.q/cs.n>0.9, 'wires are CURVED (Q paths): '+cs.q+'/'+cs.n);
// tiers = schemas ring OUTSIDE models ring (per entity): mean radius compare in Node
const tier = await pg.evaluate(() => {
  const vp=document.getElementById('vp');
  const xy=g=>{const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||'');return m?[+m[1],+m[2]]:null;};
  const conts=[...vp.querySelectorAll('circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  let okc=0, bad=0;
  conts.forEach(c=>{
    const of=(sel)=>[...vp.querySelectorAll(sel)].map(xy).filter(Boolean)
      .filter(p=>Math.hypot(p[0]-c.x,p[1]-c.y)<c.r-4).map(p=>Math.hypot(p[0]-c.x,p[1]-c.y));
    const mods=of(".piece[data-kind='model']"), schs=of(".piece[data-kind='schema']");
    if(!mods.length||!schs.length) return;
    okc++;
    const mMean=mods.reduce((a,b)=>a+b,0)/mods.length, sMean=schs.reduce((a,b)=>a+b,0)/schs.length;
    if(!(sMean>mMean)) bad++;
  });
  return {okc,bad};
});
ok(tier.okc>=4 && tier.bad===0, 'TIERS: schemas ring sits OUTSIDE the models core ('+tier.okc+' entities, '+tier.bad+' violations)');

// ── the inside-layout UI path (REAL clicks: open gear, click Grid) ──
const before = await T("(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
await pg.click('#gear');
ok(await T("!document.getElementById('gearpanel').hidden"), 'gear panel opens');
await pg.click('#inSeg button[data-in="grid"]');
const after = await T("(()=>{const o=[];document.querySelectorAll('.piece').forEach(g=>o.push(g.getAttribute('transform')));return o.join(';');})()");
ok(before!==after, 'INSIDE LAYOUT VIA THE UI actually rearranges (Grid clicked in the panel)');
ok(await T('window.__lvltest.inside()')==='grid', 'the UI click set insideLayout=grid');
await T("window.__lvltest.setInside('tiers')");

// ── D5: inter-entity connections + the toggle ──
await T("window.__lvltest.set('trace')");
const x1 = await T('window.__lvltest.xfkCount()');
ok(x1>0, 'D5: inter-entity cross edges drawn ('+x1+')');
ok(await T("(()=>{const e=document.querySelector('#vp .e-xfk');return e?e.getAttribute('stroke-dasharray'):null;})()")==='2 5', 'D5: they are dotted');
ok(await T("(()=>{const e=document.querySelector('#vp .e-xfk');return e?e.style.stroke.indexOf('url(')===0:false;})()"), 'D5: they wear the gradient amalgamation');
await T('window.__lvltest.toggleConns()');
ok(await T('window.__lvltest.xfkCount()')===0, 'Connections OFF hides them (D5)');
await T("window.__lvltest.set('pieces')");
ok(await T('window.__lvltest.xfkCount()')===0, 'Connections OFF hides them on D2 too');
await T('window.__lvltest.toggleConns()');
ok(await T('window.__lvltest.xfkCount()')>0, 'Connections back ON');

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl7 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
