import { chromium } from 'playwright-core';
const FILE='file:///tmp/claude-1000/-home-khujta-projects-gabe-lens/3fea55cf-d1c4-4534-8231-329cad9cf2a1/scratchpad/dev/gabe-universe.filled.html';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome-stable',args:['--use-angle=swiftshader','--no-sandbox','--disable-gpu-sandbox']});
const p=await b.newPage({viewport:{width:1400,height:860}});
const errs=[]; p.on('pageerror',e=>errs.push('PE:'+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('CE:'+m.text());});
await p.goto(FILE);
await p.waitForFunction('window.__spikeKindsReady===true',{timeout:30000}).catch(()=>{});
await p.waitForTimeout(2600);
// simulate a rotate drag; measure camera-to-P distance before/after (should be ~constant = no zoom) + P screen pos (~fixed)
const r=await p.evaluate(()=>{
  const g=document.getElementById('g'), rect=g.getBoundingClientRect();
  const cx=rect.left+rect.width*0.45, cy=rect.top+rect.height*0.5;
  // capture P (world point under cursor) the same way the handler does
  const cam=Graph.camera(), ctrls=Graph.controls();
  function toScreen(v){ const q=v.clone().project(cam); return {x:(q.x*0.5+0.5)*rect.width, y:(-q.y*0.5+0.5)*rect.height}; }
  g.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:cx,clientY:cy,bubbles:true}));
  // P is stored in the closure; recompute it for the metric
  const T=window.THREE, rc=new T.Raycaster(); rc.setFromCamera({x:(cx-rect.left)/rect.width*2-1, y:-((cy-rect.top)/rect.height)*2+1}, cam);
  const vdir=new T.Vector3(); cam.getWorldDirection(vdir);
  const plane=new T.Plane().setFromNormalAndCoplanarPoint(vdir, ctrls.target), P=new T.Vector3(); rc.ray.intersectPlane(plane,P);
  const dist0=cam.position.distanceTo(P), pscr0=toScreen(P);
  // drag
  for(let i=1;i<=8;i++){ window.dispatchEvent(new PointerEvent('pointermove',{clientX:cx+i*10,clientY:cy+i*4,bubbles:true})); }
  const dist1=cam.position.distanceTo(P), pscr1=toScreen(P);
  window.dispatchEvent(new PointerEvent('pointerup',{button:0,bubbles:true}));
  return { dist0:Math.round(dist0), dist1:Math.round(dist1), distDelta:Math.round(Math.abs(dist1-dist0)),
    pScreenShift:Math.round(Math.hypot(pscr1.x-pscr0.x, pscr1.y-pscr0.y)), ctrlsReEnabled:Graph.controls().enabled };
});
// transport speed slider
const ts=await p.evaluate(()=>{ __uniAddLayoutTab(); const s=document.getElementById('trSpeedRng'); if(!s) return {slider:false};
  s.value="0.8"; s.dispatchEvent(new Event('input',{bubbles:true})); return { slider:true, INTCspeed:(typeof INTC!=='undefined')?INTC.speed:null }; });
await b.close();
console.log('ORBIT dist before/after', r.dist0, r.dist1, '| Δdist', r.distDelta, '(≈0 = no zoom) | P screen shift', r.pScreenShift, 'px (≈0 = P fixed) | ctrls re-enabled', r.ctrlsReEnabled);
console.log('TRANSPORT slider', JSON.stringify(ts));
console.log('ERRORS', errs.length); errs.slice(0,6).forEach(e=>console.log(' ',e));
process.exit(errs.length?1:0);
