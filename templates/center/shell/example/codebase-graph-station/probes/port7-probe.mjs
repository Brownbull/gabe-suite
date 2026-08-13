// STATION PORT — KIND-COVERAGE comparison (operator 2026-08-13): the diagrams we
// ITERATED (the level lab) draw an entity's FULL surface — API endpoints on the
// container border, schemas + models in the core — but BOTH stations draw MODELS
// ONLY. This probe compares the lab against the two stations and pins the gap.
//
//   RED today: the change-graph explode + the archive ecosystem render ZERO
//   endpoint/schema glyphs (only .xpiece model cylinders); the lab renders both.
//   GREEN after the fix: each exploded entity draws its full endpoint + schema
//   set from DATA.l2, matching the lab.
//
// Counts are DERIVED from the committed fixture (window.GABE_C4.l2), never
// hardcoded (the port4 discipline). The lab block is the REFERENCE control — it
// must stay GREEN so a station failure reads as a station gap, not a probe bug
// (the RED-WRONG-REASON guard).
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const here = path.dirname(fileURLToPath(import.meta.url));
const stationDir = path.join(here, '..');
const labFile = path.join(here, '..', '..', 'level-lab', 'level-lab.html');

const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
const errs=[];
const newPage = async () => { const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
  pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  pg.on('pageerror',e=>errs.push(String(e))); return pg; };
const settle = pg => pg.waitForTimeout(1300);

// ── 1 · REFERENCE — the level lab draws all three kinds on its Trace level ──
{
  const pg = await newPage();
  await pg.goto('file://' + labFile);
  await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
  await pg.evaluate(()=>{ const btn=document.querySelector('#levels button[data-lvl="trace"]');
    if(btn) btn.click(); });
  await settle(pg);
  const labEp = await pg.evaluate(()=>document.querySelectorAll('#canvas .epmark').length);
  const labSc = await pg.evaluate(()=>document.querySelectorAll('#canvas .piece[data-kind="schema"]').length);
  const labMo = await pg.evaluate(()=>document.querySelectorAll('#canvas .piece[data-kind="model"]').length);
  ok(labEp>0, `reference (lab): endpoints drawn on the border (got ${labEp})`);
  ok(labSc>0, `reference (lab): schemas drawn in the core (got ${labSc})`);
  ok(labMo>0, `reference (lab): models drawn in the core (got ${labMo})`);
  await pg.close();
}

// ── 2 · CHANGE GRAPH — each exploded entity must draw its endpoints + schemas ──
{
  const pg = await newPage();
  await pg.goto('file://' + path.join(stationDir, 'codebase-graph.html'));
  await pg.waitForFunction('window.__cbgready===true',{timeout:8000});
  await settle(pg);
  const exp = await pg.evaluate(()=>{
    const D=window.GABE_C4, S=window.GABE_SIM;
    const involved=[...new Set([...(S.touched||[]), ...(S.blast||[])])];
    const out={};
    involved.forEach(sl=>{ const ns=(D.l2[sl]&&D.l2[sl].nodes)||[];
      out[sl]={ ep:ns.filter(n=>n.kind==='endpoint').length,
                sc:ns.filter(n=>n.kind==='schema').length,
                mo:ns.filter(n=>n.kind==='model').length }; });
    return out;
  });
  ok(Object.keys(exp).length>=1, 'change graph: fixture has involved entities to compare');
  let epSum=0, scSum=0, epExp=0, scExp=0;
  for(const sl of Object.keys(exp)){
    const ep = await pg.evaluate((s)=>document.querySelectorAll('#cbg-expansion [data-piece^="'+s+'|endpoint:"]').length, sl);
    const sc = await pg.evaluate((s)=>document.querySelectorAll('#cbg-expansion [data-piece^="'+s+'|schema:"]').length, sl);
    const mo = await pg.evaluate((s)=>document.querySelectorAll('#cbg-expansion [data-piece^="'+s+'|model:"]').length, sl);
    // per-entity EXACT equality — honest-zero: an entity may legitimately carry 0 of a
    // kind, so the >0 floor is asserted in AGGREGATE below, never per entity.
    ok(ep===exp[sl].ep, `change graph: ${sl} draws exactly its ${exp[sl].ep} endpoints on the border (got ${ep})`);
    ok(sc===exp[sl].sc, `change graph: ${sl} draws exactly its ${exp[sl].sc} schemas in the core (got ${sc})`);
    ok(mo>0, `change graph: ${sl} still draws its models (got ${mo})`);
    epSum+=ep; scSum+=sc; epExp+=exp[sl].ep; scExp+=exp[sl].sc;
  }
  ok(epExp>0 && epSum===epExp, `change graph: the full endpoint surface renders across involved entities (${epSum}/${epExp})`);
  ok(scExp>0 && scSum===scExp, `change graph: the full schema surface renders (${scSum}/${scExp})`);
  // the data-kind discriminator the lab uses is present after the port
  const dk = await pg.evaluate(()=>document.querySelectorAll('#cbg-expansion [data-kind="endpoint"]').length);
  ok(dk>0, `change graph: endpoint glyphs carry data-kind (got ${dk})`);
  // BEHAVIORAL coverage (review 2026-08-13): the border→core touch wires actually
  // DRAW, and a border endpoint is really clickable → selects + opens its dossier
  // (a source-string pin alone survives a 0-wire loop or an inert surf click handler).
  const te = await pg.evaluate(()=>document.querySelectorAll('#cbg-expansion .e-touch').length);
  ok(te>0, `change graph: border→core touch wires drawn (${te})`);
  const epXY = await pg.evaluate(()=>{
    const g=document.querySelector('#cbg-expansion .xsurf[data-kind="endpoint"]'); if(!g) return null;
    const m=/translate\(([-0-9.]+),([-0-9.]+)\)/.exec(g.getAttribute('transform')||''); if(!m) return null;
    const c=window.__cbgtest.cam(), r=document.getElementById('cbg-stage').getBoundingClientRect(), s=c.base*c.zoom;
    return { x:r.left + c.fit[0]+c.panX + (+m[1])*s, y:r.top + c.fit[1]+c.panY + (+m[2])*s };
  });
  ok(!!epXY, 'a border endpoint glyph exists to click');
  if(epXY){
    await pg.mouse.click(epXY.x, epXY.y); await pg.waitForTimeout(350);
    ok(await pg.evaluate(()=>window.__cbgtest.selrings())>=1,
       'real-mouse click on a border endpoint SELECTS it (the spinning ring mounts)');
    ok((await pg.evaluate(()=>window.__cbgtest.detailText())).indexOf('endpoint')>=0,
       'the endpoint dossier opens (kind row = endpoint)');
  }
  await pg.close();
}

// ── 3 · ARCHIVE — the whole-ecosystem view must draw every entity's surface ──
{
  const pg = await newPage();
  await pg.goto('file://' + path.join(stationDir, 'codebase-archive.html'));
  await pg.waitForFunction('window.__ecoready===true',{timeout:8000});
  await settle(pg);
  const exp = await pg.evaluate(()=>{
    const D=window.GABE_C4, out={};
    Object.keys(D.l2||{}).forEach(sl=>{ const ns=(D.l2[sl]&&D.l2[sl].nodes)||[];
      out[sl]={ ep:ns.filter(n=>n.kind==='endpoint').length,
                sc:ns.filter(n=>n.kind==='schema').length }; });
    return out;
  });
  let epTotalExp=0, scTotalExp=0;
  Object.keys(exp).forEach(sl=>{ epTotalExp+=exp[sl].ep; scTotalExp+=exp[sl].sc; });
  const epTotal = await pg.evaluate(()=>document.querySelectorAll('#eco-expansion [data-piece*="|endpoint:"]').length);
  const scTotal = await pg.evaluate(()=>document.querySelectorAll('#eco-expansion [data-piece*="|schema:"]').length);
  ok(epTotalExp>0 && epTotal===epTotalExp, `archive: ecosystem draws all ${epTotalExp} endpoints (got ${epTotal})`);
  ok(scTotalExp>0 && scTotal===scTotalExp, `archive: ecosystem draws all ${scTotalExp} schemas (got ${scTotal})`);
  const dk = await pg.evaluate(()=>document.querySelectorAll('#eco-expansion [data-kind="endpoint"]').length);
  ok(dk>0, `archive: endpoint glyphs carry data-kind (got ${dk})`);
  await pg.close();
}

ok(errs.length===0, 'zero console errors across the three pages: '+errs.slice(0,3).join(' | '));
await b.close();
console.log(`port7: ${P}/${P+F} pass`);
process.exit(F?1:0);
