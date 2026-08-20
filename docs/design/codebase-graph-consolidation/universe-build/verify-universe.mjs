import { chromium } from 'playwright-core';
const FILE = process.argv[2] || 'file:///tmp/claude-1000/-home-khujta-projects-gabe-lens/3fea55cf-d1c4-4534-8231-329cad9cf2a1/scratchpad/dev/gabe-universe.filled.html';
const SHOT = process.argv[3] || '/tmp/claude-1000/-home-khujta-projects-gabe-lens/3fea55cf-d1c4-4534-8231-329cad9cf2a1/scratchpad/dev/universe.png';
const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome-stable', args:['--use-angle=swiftshader','--no-sandbox','--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport:{width:1280,height:820}, deviceScaleFactor:1.5 });
const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR: '+e.message));
p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
await p.goto(FILE);
// engine sets window.__spikeKindsReady=true after build(); ships optional
await p.waitForFunction('window.__spikeKindsReady===true',{timeout:30000}).catch(()=>{});
await p.waitForFunction('window.__shipsReady===true',{timeout:20000}).catch(()=>{});
await p.waitForTimeout(2500);

// structural probes from the engine's globals
const g = await p.evaluate(()=>({
  nodes: (typeof nodes!=='undefined'&&nodes)?nodes.length:-1,
  links: (typeof links!=='undefined'&&links)?links.length:-1,
  ents: (typeof ENT!=='undefined')?Object.keys(ENT).length:-1,
  hasGraph: (typeof Graph!=='undefined'&&!!Graph),
  errBanner: !!document.getElementById('err'),
  navOn: !!document.querySelector('nav.side .navitem.on'),
  topbar: !!document.querySelector('.topbar .crumb b'),
  // a kind breakdown
  kinds: (typeof nodes!=='undefined'&&nodes)?nodes.reduce((a,n)=>{a[n.kind]=(a[n.kind]||0)+1;return a;},{}):{}
}));
console.log('STRUCT', JSON.stringify(g));

// click-equivalent: open the card on an endpoint WITH cases+journeys, read the rendered sections
const card = await p.evaluate(()=>{
  if(typeof nodes==='undefined'||!nodes) return {err:'no nodes'};
  const pick = nodes.find(n=>n.kind==='endpoint'&&n.det&&n.det.cases&&n.det.cases.length&&n.det.test_journeys) ||
               nodes.find(n=>n.kind==='endpoint') || nodes[0];
  showPanel(pick);
  const pb=document.getElementById('pbody');
  const txt=pb?pb.innerText:'';
  return {
    id: pick.id, kind: pick.kind, ent: pick.ent,
    open: document.body.classList.contains('panel-open'),
    secs: [...pb.querySelectorAll('.sechd')].map(s=>s.textContent.trim().replace(/\s+/g,' ')),
    hasTests: /Tests/.test(txt), hasJourneys: /Journeys/.test(txt),
    hasConns: /Connections/.test(txt), hasStPass: !!pb.querySelector('.pchip.st-pass'),
    hasFace: !!pb.querySelector('.jfaces .face'), hasTtag: !!pb.querySelector('.ttag'),
    realCid: (pick.det&&pick.det.cases&&pick.det.cases[0]&&pick.det.cases[0].cid)||null,
    cidInCard: (pick.det&&pick.det.cases&&pick.det.cases[0])? new RegExp(pick.det.cases[0].cid).test(txt):null
  };
});
console.log('CARD', JSON.stringify(card,null,1));
await p.screenshot({path:SHOT});
console.log('ERRORS', errs.length);
errs.slice(0,12).forEach(e=>console.log('  '+e));
await b.close();
process.exit(errs.length?1:0);
