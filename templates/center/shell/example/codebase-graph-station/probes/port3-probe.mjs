// STATION PORT slice 1 — the review's confirmed failure modes, pinned:
// (1) the emitter's __unclaimed__ L1 bucket (counts:null) must NOT kill the boot
//     (it once did — TypeError in radius() before first paint; the committed
//     fixture has zero unresolved FKs so port1/port2 never walk this branch);
// (2) the L2 external-piece hop lands on the target entity's SLUG (label 'Auth'
//     vs l2 key 'auth' — the display-label drill dead-ended on 'no L2 data');
// (3) panel travel (.cgo transporter rows) actually LANDS in L2 — a synthetic
//     click is inert on wire()-tapped nodes, so jumpToNode routes via onSingle.
// Builds a temp twin with the unclaimed node injected AFTER c4-graph.js, probes
// it, deletes it.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const here = path.dirname(fileURLToPath(import.meta.url));
const station = path.join(here, '..', 'codebase-graph.html');
const tmp = path.join(here, '..', '.tmp-unclaimed.html');
// the emitter's exact unclaimed shape (_a3_graph.py: counts null, dashed bucket)
const INJECT = '<script>window.GABE_C4.l1.nodes.push({id:"__unclaimed__",slug:"__unclaimed__",'
  + 'label:"unclaimed",kind:"unclaimed",status:null,counts:null,x:0,y:-460});'
  + 'window.GABE_C4.l1.edges.push({source:"recipe",target:"__unclaimed__",weight:1,kinds:{fk:1}});'
  + 'window.GABE_C4.stats.unclaimed=true;</scr'+'ipt>';
const src = fs.readFileSync(station, 'utf8')
  .replace('<script src="./c4-graph.js"></script>', '<script src="./c4-graph.js"></script>\n' + INJECT);
fs.writeFileSync(tmp, src);

const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
try {
  const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
  const errs=[];
  pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  pg.on('pageerror',e=>errs.push(String(e)));
  await pg.goto('file://' + tmp);
  // 1 · the unclaimed bucket must not kill the boot
  await pg.waitForFunction('window.__cbgready===true',{timeout:8000});
  const t = expr => pg.evaluate(`window.__cbgtest.${expr}`);
  ok(await t('l1nodes()')===8, 'boots with the unclaimed bucket present (8 L1 nodes)');
  ok(await pg.evaluate(()=>{
      const g=[...document.querySelectorAll('#cbg-viewport .node')].find(n=>n.getAttribute('data-id')==='__unclaimed__');
      return !!g && g.querySelector('.body').getAttribute('stroke-dasharray')==='5 4';
    }), 'the unclaimed bucket draws as the dashed circle');
  ok(await pg.evaluate(()=>{
      const g=[...document.querySelectorAll('#cbg-viewport .node')].find(n=>n.getAttribute('data-id')==='__unclaimed__');
      return g.textContent.indexOf('unresolved fk targets')>=0;
    }), 'counts:null renders the honest sub-label, never a crash');
  await t('singleClick("__unclaimed__")');
  await pg.waitForTimeout(150);
  ok((await t('detailText()')).toLowerCase().indexOf('unclaimed')>=0, 'clicking the bucket opens a card, no throw');

  // 2 · external hop: drill an entity, double-click its external piece → target L2
  await t('drill("recipe")');
  await pg.waitForTimeout(150);
  const ext = await pg.evaluate(()=>{
    const n=(window.GABE_C4.l2.recipe.nodes||[]).find(x=>x.kind==='external');
    return n ? {id:n.id, slug:n.slug, label:n.label} : null;
  });
  ok(!!ext, 'recipe L2 carries an external piece');
  if(ext){
    await t(`dblClick(${JSON.stringify(ext.id)})`);
    await pg.waitForTimeout(150);
    ok((await t('view()'))==='l2:'+ext.slug, `external hop lands on l2:${ext.slug} (slug, not label '${ext.label}')`);
    ok(await t('l2nodes()')>0, 'the target L2 actually renders');
    await t('back()');
  }

  // 3 · panel travel in L2: select a node, click a .cgo transporter → selection moves
  await t('drill("recipe")');
  await pg.waitForTimeout(150);
  const first = await pg.evaluate(()=>{
    const es=window.GABE_C4.l2.recipe.edges; if(!es.length) return null;
    return { from:es[0].source, to:es[0].target };
  });
  ok(!!first, 'recipe L2 has a wire to travel');
  if(first){
    await t(`singleClick(${JSON.stringify(first.from)})`);
    await pg.waitForTimeout(150);
    const before = await t('selKeyNow()');
    const target = await pg.evaluate(()=>{
      const b=document.querySelector('#cbg-detail .cgo'); if(!b) return null;
      const k=b.getAttribute('data-k'); b.click(); return k;
    });
    await pg.waitForTimeout(300);
    ok(!!target, 'the connections tail has a transporter row');
    const after = await t('selKeyNow()');
    ok(after===target && after!==before, 'clicking → travels: selection lands on the far element');
    ok((await t('detailText()')).length>0 && await t('selrings()')===1, 'the far element card + ring render');
  }

  ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
  console.log(`port3: ${P}/${P+F} pass`);
} finally {
  await b.close();
  fs.unlinkSync(tmp);
}
process.exit(F?1:0);
