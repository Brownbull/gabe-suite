// Round 34 — layout exploration measured by EDGE CROSSINGS (playwright drives,
// Node counts): new entity modes (Chain, Spread), new inside modes (Rows,
// Spiral), and the Lines row (Direct/Curved/Bowed). Honest table, loose pins.
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const pg = await b.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html');
await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);

// dump every wire's endpoints (parse the d attr in-page, ship JSON — compute in Node)
const segs = (sels) => pg.evaluate((sels) => {
  const out=[];
  document.querySelectorAll(sels).forEach(p=>{
    const d=p.getAttribute('d')||'';
    const m=/^M([-\d.]+)[ ,]([-\d.]+)\s*(?:Q\s*([-\d.]+)[ ,]([-\d.]+)\s*)?([-\d.]+)[ ,]([-\d.]+)$/.exec(d.trim());
    if(m) out.push([+m[1],+m[2],+m[5],+m[6]]);
  });
  return out; }, sels);
function crossings(S){
  const side=(ax,ay,bx,by,px,py)=>Math.sign((bx-ax)*(py-ay)-(by-ay)*(px-ax));
  let n=0;
  for(let i=0;i<S.length;i++) for(let j=i+1;j<S.length;j++){
    const [a,b,c,d]=S[i], [e,f,g,h]=S[j];
    const shared=(x1,y1,x2,y2)=>Math.hypot(x1-x2,y1-y2)<1.5;
    if(shared(a,b,e,f)||shared(a,b,g,h)||shared(c,d,e,f)||shared(c,d,g,h)) continue;
    const s1=side(a,b,c,d,e,f), s2=side(a,b,c,d,g,h), s3=side(e,f,g,h,a,b), s4=side(e,f,g,h,c,d);
    if(s1!==s2 && s3!==s4 && s1!==0 && s2!==0 && s3!==0 && s4!==0) n++;
  }
  return n;
}

// ── ENTITY modes on L1 (all kind wires) ──
await T("window.__lvltest.set('entities')");
const entModes=['ring','chain','flow','force','spread'], entX={};
for(const m of entModes){
  await T(`window.__lvltest.setLayout('${m}')`);
  const S=await segs('#canvas .e-fk, #canvas .e-calls, #canvas .e-imports');
  entX[m]=crossings(S);
  const nodes=await T("document.querySelectorAll('#canvas .entnode').length");
  ok(nodes>0 && S.length>0, `entity mode ${m} renders (${nodes} nodes, ${S.length} wires)`);
}
console.log('  ENTITY crossings:', JSON.stringify(entX));

// ── INSIDE modes on trace (every wire incl. in-bubble) ──
await T("window.__lvltest.set('trace')"); await T("window.__lvltest.setLayout('force')");
const inModes=['ring','tiers','columns','force','rows','spiral'], inX={};
for(const m of inModes){
  await T(`window.__lvltest.setInside('${m}')`);
  // INTRA wires only — cross-entity wires answer to the ENTITY layout, not this knob
  const S=await segs('#canvas .e-touch, #canvas .e-resp');
  inX[m]=crossings(S);
  const pieces=await T("document.querySelectorAll('#canvas .piece,#canvas .fnode').length");
  ok(pieces>200 && S.length>150, `inside mode ${m} renders (${pieces} pieces, ${S.length} intra wires)`);
}
console.log('  INSIDE (trace) crossings:', JSON.stringify(inX));

// crossing-aware newcomers must actually EARN their seat (loose, direction-only pins)
ok(entX.chain<=entX.ring, `Chain (ordered ring) never crosses more than Ring (${entX.chain} vs ${entX.ring})`);
ok(entX.spread<=entX.force, `Spread ties/beats Force (${entX.spread} vs ${entX.force})`);
ok(inX.rows<=inX.ring, `Rows (barycenter) beats/ties Ring on intra wires (${inX.rows} vs ${inX.ring})`);

// ── LINES: the knob bends every connector ──
const bowOf = async () => pg.evaluate(() => {
  const p=document.querySelector('#canvas .e-xfk'); const d=p.getAttribute('d');
  const m=/^M([-\d.]+)[ ,]([-\d.]+)\s*Q\s*([-\d.]+)[ ,]([-\d.]+)\s*([-\d.]+)[ ,]([-\d.]+)$/.exec(d.trim());
  if(!m) return null;
  const [x1,y1,qx,qy,x2,y2]=[+m[1],+m[2],+m[3],+m[4],+m[5],+m[6]];
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  return Math.hypot(qx-mx, qy-my); });
await T("window.__lvltest.setInside('force')");
const bows={};
for(const s of ['direct','curved','bowed']){
  await T(`window.__lvltest.setLine('${s}')`);
  ok(await T('window.__lvltest.line()')===s, `line style ${s} set`);
  bows[s]=await bowOf();
}
console.log('  bows (ctrl-point offset px):', JSON.stringify(bows));
ok(bows.direct<bows.curved && bows.curved<bows.bowed,
  `bow grows Direct<Curved<Bowed (${bows.direct?.toFixed(1)} < ${bows.curved?.toFixed(1)} < ${bows.bowed?.toFixed(1)})`);
ok(bows.direct>0.5, 'Direct keeps a whisper of bow — lane pairs stay separable');
// gear buttons present
const gear = await pg.evaluate(() => ({
  lay:[...document.querySelectorAll('#laySeg button')].map(b=>b.getAttribute('data-lay')).join(','),
  ins:[...document.querySelectorAll('#inSeg button')].map(b=>b.getAttribute('data-in')).join(','),
  line:[...document.querySelectorAll('#lineSeg button')].map(b=>b.getAttribute('data-line')).join(',') }));
ok(gear.lay==='chain,force,spread', 'Entities roster (trimmed round 35) ('+gear.lay+')');
ok(gear.ins==='tiers,force,columns,rows', 'Inside roster (trimmed round 35) ('+gear.ins+')');
ok(gear.line==='direct,bowed', 'Lines roster (trimmed round 35) ('+gear.line+')');
await T("window.__lvltest.setLine('direct')");

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl29 (layout exploration): ${P} pass, ${F} fail`);
await b.close(); process.exit(F?1:0);
