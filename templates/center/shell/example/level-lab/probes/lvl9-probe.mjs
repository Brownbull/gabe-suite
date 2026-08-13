import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// ── LEGIBILITY GATE: min pairwise spacing per container, all three dense levels ──
const measure = () => pg.evaluate(() => {
  const vp = document.getElementById('vp');
  const xy = g => { const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||''); return m?[+m[1],+m[2]]:null; };
  const conts = [...vp.querySelectorAll('circle.container')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}));
  let worstPiece=1e9, worstMark=1e9;
  conts.forEach(c=>{
    ['piece','fnode'].forEach(kind=>{
      const inC=[...vp.querySelectorAll('.'+kind)].map(xy).filter(Boolean).filter(p=>Math.hypot(p[0]-c.x,p[1]-c.y)<c.r+4);
      for(let i=0;i<inC.length;i++) for(let j=i+1;j<inC.length;j++)
        worstPiece=Math.min(worstPiece, Math.hypot(inC[i][0]-inC[j][0], inC[i][1]-inC[j][1]));
    });
    const eps=[...vp.querySelectorAll('.epmark')].map(xy).filter(Boolean).filter(p=>Math.abs(Math.hypot(p[0]-c.x,p[1]-c.y)-c.r)<3);
    for(let i=0;i<eps.length;i++) for(let j=i+1;j<eps.length;j++)
      worstMark=Math.min(worstMark, Math.hypot(eps[i][0]-eps[j][0], eps[i][1]-eps[j][1]));
  });
  return {worstPiece:Math.round(worstPiece), worstMark:Math.round(worstMark)};
});
for (const lvl of ['pieces','functions','trace']){
  await T(`window.__lvltest.set('${lvl}')`);
  const m = await measure();
  ok(m.worstPiece>=17, lvl+': min inner spacing ≥17px ('+m.worstPiece+')');
  if(m.worstMark<1e9) ok(m.worstMark>=11, lvl+': min border-marker spacing ≥11px ('+m.worstMark+')');
}

// ── WHY-UNLINKED notes in the panel ──
await T("window.__lvltest.set('pieces')");
// an unlinked endpoint: touch empty AND resp unowned — find one from data, click via hook path
const unl = await T(`(()=>{
  for(const slug of Object.keys(window.GABE_LEVELS.pieces)){
    for(const ep of window.GABE_LEVELS.pieces[slug].endpoints){
      const owned = ep.resp && window.GABE_LEVELS.schema_owner[ep.resp];
      if(!(ep.touch||[]).length && !owned) return {slug, m:ep.m, p:ep.p};
    }
  } return null;})()`);
ok(!!unl, 'an unlinked endpoint exists in the data ('+(unl&&unl.p)+')');
await pg.evaluate(u => {
  const pc = window.GABE_LEVELS.pieces[u.slug];
  const ep = pc.endpoints.find(e=>e.m===u.m && e.p===u.p);
  // call the panel path exactly as a click would
  document.querySelectorAll('.epmark').forEach(()=>{});
  window.__lvltest.set('pieces');
  // simulate: find the marker by title text
  const marks=[...document.querySelectorAll('.epmark')];
  const hit = marks.find(g => [...g.querySelectorAll('title')].some(x=>(x.textContent||'').startsWith(u.m+' '+u.p)));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
}, unl);
const ptxt = await T('window.__lvltest.panelText()');
ok(ptxt.includes('why is it unlinked?'), 'clicking an unlinked endpoint explains WHY in the panel');
ok(ptxt.includes('service layer') || ptxt.includes('documented nowhere'), 'the why names the actual reason');
// a LINKED endpoint shows NO why-note
await pg.evaluate(() => {
  const marks=[...document.querySelectorAll('.epmark')];
  const hit = marks.find(g => [...g.querySelectorAll('title')].some(x=>(x.textContent||'').includes('touches')));
  if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
ok(!(await T('window.__lvltest.panelText()')).includes('why is it unlinked?'), 'a linked endpoint shows no why-note');
// an unlinked MODEL (no fk/touch/cross/resp referencing it) — find + click
const unlCls = await T(`(()=>{
  const L=window.GABE_LEVELS; const linked=new Set();
  for(const slug of Object.keys(L.pieces)){ const pc=L.pieces[slug];
    (pc.intra||[]).forEach(e=>{linked.add(slug+'|'+e.s);linked.add(slug+'|'+e.t);});
    pc.endpoints.forEach(ep=>{ (ep.touch||[]).forEach(c=>linked.add(slug+'|'+c));
      if(ep.resp&&L.schema_owner[ep.resp]) linked.add(L.schema_owner[ep.resp]+'|'+ep.resp); }); }
  (L.cross_edges||[]).forEach(e=>{linked.add(e.fs+'|'+e.f);linked.add(e.ts+'|'+e.t);});
  (L.use_edges||[]).forEach(e=>linked.add(e.ts+'|'+e.cls));
  for(const slug of Object.keys(L.pieces))
    for(const mo of L.pieces[slug].models)
      if(!linked.has(slug+'|'+mo.cls)) return {slug, cls:mo.cls};
  return null;})()`);
if(unlCls){
  await pg.evaluate(u => {
    const ps=[...document.querySelectorAll('.piece')];
    const hit=ps.find(g=>[...g.querySelectorAll('title')].some(x=>(x.textContent||'').startsWith('model '+u.cls)));
    if(hit) hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  }, unlCls);
  ok((await T('window.__lvltest.panelText()')).includes('why is it unlinked?'), 'an unlinked model explains itself ('+unlCls.cls+')');
} else ok(true, '(no unlinked model in this fixture)');

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl9 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
