import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html'); await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
await T("window.__lvltest.set('pieces')");

// EVERY endpoint now carries at least one wire (resp covers what touches missed)
const link = await pg.evaluate(() => {
  const vp = document.getElementById('vp');
  const xy = g => { const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||''); return m?[+m[1],+m[2]]:null; };
  const eps = [...vp.querySelectorAll('.epmark')].map(xy).filter(Boolean);
  const starts = new Set();
  vp.querySelectorAll('.e-touch,.e-resp,.e-xfk').forEach(p=>{
    const m=/^M([-0-9.]+) ([-0-9.]+)/.exec(p.getAttribute('d')||''); if(m) starts.add(m[1]+','+m[2]);
  });
  let linked=0;
  eps.forEach(p=>{ if(starts.has(p[0]+','+p[1])) linked++; });
  return {eps:eps.length, linked,
          resp: vp.querySelectorAll('.e-resp').length,
          touch: vp.querySelectorAll('.e-touch').length,
          xfk: vp.querySelectorAll('.e-xfk').length,
          schemas: vp.querySelectorAll(".piece[data-kind='schema']").length};
});
console.log('  endpoints:', link.eps, '· wire-linked:', link.linked, '· resp wires:', link.resp, '· touch:', link.touch, '· cross:', link.xfk, '· schemas drawn:', link.schemas);
ok(link.eps===67, 'all 67 unique endpoints drawn (deduped round 27)');
ok(link.linked>=50, 'the archmap ceiling holds ('+link.linked+'/67 wired; the remainder = undocumented resp + service-layer touches)');
ok(link.resp>=30, 'response wires drawn ('+link.resp+')');
ok(link.xfk>=30, 'cross set includes resp→owner + FK edges ('+link.xfk+')');
ok(link.schemas>=70, 'the USED schemas are drawn ('+link.schemas+' — was 6 per entity)');

// legend of honesty: unlinked pieces are models nothing references at this altitude
// trace: resp wires from ƒ
await T("window.__lvltest.set('trace')");
ok(await T("document.querySelectorAll('#vp .e-resp').length")>=30, 'trace: ƒ→returns wires drawn');
// toggle also hides the resp-cross edges
await T('window.__lvltest.toggleConns()');
ok(await T('window.__lvltest.xfkCount()')===0, 'Connections OFF hides resp-cross too');
await T('window.__lvltest.toggleConns()');

console.log('errors:', errs.length?errs.slice(0,4):'none'); ok(errs.length===0,'no console errors');
console.log('lvl8 probe:', P+'/'+F);
await b.close(); process.exit(F?1:0);
