// STATION PORT slice 1 — the honest-empty DEGRADE (no change in flight) rides
// the lab grammar too: map card + selection on L1, the L2 drill with lab icons,
// stage controls hidden (COMPUTED display, the [hidden]-defeat lesson).
// Builds a temp twin of the example page with window.GABE_SIM = null, probes it,
// deletes it.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
// engine: GABE_PW_DIR must be a node_modules that has `playwright` (full — the probes use
// its chromium). Default = this machine's npx cache; a fresh clone sets GABE_PW_DIR +
// GABE_CHROME_BIN (see probes/README.md).
const _PWBASE = process.env.GABE_PW_DIR || '/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/';
const require = createRequire(_PWBASE.replace(/\/?$/, '/') + 'x.js');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const here = path.dirname(fileURLToPath(import.meta.url));
const station = path.join(here, '..', 'codebase-graph.html');
const tmp = path.join(here, '..', '.tmp-degrade.html');
const src = fs.readFileSync(station, 'utf8')
  .replace('<script src="./sim.data.js"></script>', '<script>window.GABE_SIM = null;</script>');
fs.writeFileSync(tmp, src);

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable' });
try {
  const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
  const errs=[];
  pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  pg.on('pageerror',e=>errs.push(String(e)));
  await pg.goto('file://' + tmp);
  await pg.waitForFunction('window.__cbgready===true',{timeout:8000});
  const t = expr => pg.evaluate(`window.__cbgtest.${expr}`);

  ok(await t('hasSim()')===false, 'degrade mode: no SIM');
  ok((await t('detailText()')).indexOf('No change in flight')>=0, 'honest-empty panel note');
  // the [hidden]-defeat class: COMPUTED display, not the attribute (the modal lesson)
  for(const id of ['cbg-stageSeg','cbg-openAll','cbg-conns','cbg-commitModal']){
    ok(await pg.evaluate(i=>getComputedStyle(document.getElementById(i)).display, id)==='none',
       `#${id} computed display:none on the degrade page`);
  }
  ok(await pg.evaluate(()=>getComputedStyle(document.getElementById('cbg-depthCtl')).display)!=='none',
     'the depth slider stays (selection works on the map)');

  // L1 map: gradient wires + dots + registered entities; single-click = card + selection
  ok(await t('gradients()')>0 && await t('flowdots()')>0, 'map wires: gradients + flow dots');
  await t('singleClick("recipe")');
  await pg.waitForTimeout(150);
  ok((await t('detailText()')).indexOf('codebase map')>=0, 'entity card opens on the map');
  ok(await t('selrings()')===1, 'entity selection ring');
  ok(await t('conRows()')>0, 'entity connections listed');

  // map-mode restore (fresh-review): a gear pill re-render keeps card + ring
  await pg.evaluate(()=>{ document.getElementById('cbg-gear').click();
    document.querySelector('#cbg-linesSeg [data-line="direct"]').click(); });
  await pg.waitForTimeout(200);
  ok(await t('selrings()')===1 && (await t('detailText()')).indexOf('codebase map')>=0,
     'map mode: a Lines pill re-render keeps the entity card + its ring');
  await pg.evaluate(()=>{ document.querySelector('#cbg-linesSeg [data-line="bowed"]').click();
    document.getElementById('cbg-gear').click(); });
  await pg.waitForTimeout(150);

  // L2 drill: lab icons, halos, registered pieces, selection
  await t('dblClick("recipe")');
  await pg.waitForTimeout(200);
  ok((await t('view()'))==='l2:recipe', 'double-click drills to L2');
  const l2n = await t('l2nodes()');
  ok(l2n>0, `L2 renders ${l2n} pieces`);
  ok(await t('halos()')>0, 'L2 pieces wear halos');
  ok(await pg.evaluate(()=>[...document.querySelectorAll('#cbg-viewport path')]
      .some(p=>(p.getAttribute('d')||'').startsWith('M3 5v14a9 3 0 0 0 18 0V5'))),
     'L2 models draw the lucide cylinder');
  ok(await pg.evaluate(()=>document.querySelectorAll('#cbg-viewport .colhdr').length)>0,
     'columns layout shows the kind headers');
  const reg = await t('reg()');
  ok(reg.nodes===l2n && reg.edges>0, 'every L2 piece + wire registered in the selection engine');
  ok(await pg.evaluate(()=>!document.getElementById('cbg-backBtn').hidden),
     'the Back button shows in L2');
  await t('back()');
  ok((await t('view()'))==='l1', 'Back returns to the map');

  ok(errs.length===0, 'zero console errors: '+errs.slice(0,3).join(' | '));
  console.log(`port2: ${P}/${P+F} pass`);
} finally {
  await b.close();
  fs.unlinkSync(tmp);
}
process.exit(F?1:0);
