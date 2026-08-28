/* Schema FOLD proof (operator, 2026-08-27): a schema whose only wires are `nests` (a composition
   helper) folds into its parent under the schema kind's CRITICAL state — the mirror of the functions'
   single-caller fold — and the parent wears a COUNT badge = the folded direct children.
   [1] boot (critical): every nested-only schema is hidden; every wired schema is visible
   [2] SetupCompleteRequest.__foldN === 5 — ExplorationPreferencesInput stays (an endpoint touches it)
   [3] the count badge sprite rides the parent's THREE group (grp.__cnt.__n === __foldN)
   [4] the legend's schema row gained a CRITICAL state (__uniKindHasSolo('schema') === true)
   [5] double-click the parent → the five reappear (pinned); clearing pins re-folds them
   [6] kind ALL shows every schema; OFF hides every schema; CRITICAL folds again
   [7] fn→schema wires draw when functions are ON; an ENDPOINT-wired schema never folds; a fn wire alone does not block the fold
   Run: node verify-schemafold.mjs   (SOLO — headless swiftshader; system chrome) */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const D = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.GABE_PW_DIR || path.resolve(D, '../../graft-adoption/spike/_build/node_modules/playwright-core');
const PAGE = path.resolve(D, '../../../../templates/center/shell/example/codebase-graph-station/gabe-universe.html');
const { chromium } = createRequire(import.meta.url)(PW);

const b = await chromium.launch({ executablePath: process.env.GABE_CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push('PE:' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text()); });
await p.goto('file://' + PAGE);
await p.waitForFunction('window.__spikeKindsReady===true', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4500);
await p.evaluate(() => { if (window.__uniSetKindState) __uniSetKindState('function', 'all'); if (window.toggleFns) try { toggleFns(true); } catch (e) {} });
await p.waitForTimeout(3000);

const r = await p.evaluate(() => {
  const out = {};
  const id = s => (typeof lid === 'function') ? lid(s) : (s && s.id ? s.id : s);
  const S = nodes.filter(n => n.kind === 'schema');
  out.schemas = S.length;
  out.state = (window.__uniKindState || {}).schema || (typeof _kindDefault === 'function' ? _kindDefault('schema') : '?');
  out.hasCrit = !!(window.__uniKindHasSolo && __uniKindHasSolo('schema'));
  // independent fold predicate (from the live links): nests-in ≥1 AND no non-nests wire
  const wired = {}, parents = {}; let fnWires = 0;
  let serWires = 0;
  links.forEach(l => { const s = id(l.source), t = id(l.target); const sn = NIDS[s], tn = NIDS[t]; if (!sn || !tn) return;
    if (l.rel === 'nests') { if (tn.kind === 'schema') (parents[t] = parents[t] || []).push(s); return; }
    if (l.rel === 'serializes') { serWires++; return; }   // P2: schema→model is a mapping, mirrors layout.js — must NOT mark the schema wired
    if (sn.kind === 'function' || tn.kind === 'function') { if (tn.kind === 'schema') fnWires++; return; }   // fn wires never make a contract
    if (sn.kind === 'schema') wired[s] = 1; if (tn.kind === 'schema') wired[t] = 1; });
  out.serWires = serWires;
  out.serFoldOK = S.filter(n => n.__solo && links.some(l => id(l.source) === n.id && l.rel === 'serializes')).length;
  const nestedOnly = S.filter(n => parents[n.id] && !wired[n.id]).map(n => n.id);
  out.nestedOnly = nestedOnly.length;
  out.soloMatches = S.every(n => !!n.__solo === (!!parents[n.id] && !wired[n.id]));
  out.hiddenNestedOnly = nestedOnly.filter(i => !_nodeVisibleFn(NIDS[i])).length;
  out.wiredVisible = S.filter(n => wired[n.id] && !_nodeVisibleFn(n)).map(n => n.id);
  const P = NIDS['schema:SetupCompleteRequest']; out.parent = !!P; out.foldN = P ? P.__foldN : null;
  out.foldNexpected = P ? (parents[P.id + ''] , S.filter(n => nestedOnly.includes(n.id) && (parents[n.id] || []).includes(P.id)).length) : null;
  out.explVisible = NIDS['schema:ExplorationPreferencesInput'] ? _nodeVisibleFn(NIDS['schema:ExplorationPreferencesInput']) : null;
  const grp = P && P.__threeObj; out.badge = !!(grp && grp.__cnt); out.badgeN = grp && grp.__cnt ? grp.__cnt.__n : null;
  out.badgesTotal = nodes.filter(n => n.kind === 'schema' && n.__threeObj && n.__threeObj.__cnt).length;
  out.parentsWithFold = S.filter(n => (n.__foldN || 0) > 0 && n.__threeObj).length;   // a HIDDEN parent (itself folded) has no THREE object yet — it gets its badge on reveal (buildNode)
  // [7] fn-wired schema (schema_edges) is wired → never a fold candidate
  out.fnWires = fnWires; out.epWiredFolded = S.filter(n => wired[n.id] && n.__solo).length;
  out.fnOnlyFolded = S.filter(n => n.__solo && links.some(l => id(l.target) === n.id && NIDS[id(l.source)] && NIDS[id(l.source)].kind === 'function')).length;
  // [5] reveal → the kids reappear pinned; clear pins → fold again
  const kids = P ? nestedOnly.filter(i => (parents[i] || []).includes(P.id)) : [];
  out.kids = kids.map(k => k.replace('schema:', ''));
  if (P) { window.__uniRevealNeighbors(P); }
  out.kidsAfterReveal = kids.filter(k => _nodeVisibleFn(NIDS[k])).length;
  out.pinned = kids.filter(k => (window.__uniPin || {})[k]).length;
  window.__uniPin = {}; try { __uniComputeSolo(); } catch (e) {} try { applyVis('all'); } catch (e) {}
  out.kidsAfterUnpin = kids.filter(k => _nodeVisibleFn(NIDS[k])).length;
  // [6] cycle the kind
  __uniSetKindState('schema', 'all'); out.allVisible = S.filter(n => !_nodeVisibleFn(n)).length;
  __uniSetKindState('schema', 'off'); out.offVisible = S.filter(n => _nodeVisibleFn(n)).length;
  __uniSetKindState('schema', 'critical'); out.critHidden = nestedOnly.filter(i => !_nodeVisibleFn(NIDS[i])).length;
  out.badgeAfterCycle = P && P.__threeObj && P.__threeObj.__cnt ? P.__threeObj.__cnt.__n : null;
  return out;
});

const R = [];
function ok(name, cond, detail) { R.push((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  — ' + detail : '')); }
ok('schema kind boots CRITICAL and has a fold state', r.state === 'critical' && r.hasCrit === true, `state=${r.state} hasCrit=${r.hasCrit}`);
ok('[1] every nested-only schema is hidden at boot', r.nestedOnly > 0 && r.hiddenNestedOnly === r.nestedOnly, `${r.hiddenNestedOnly}/${r.nestedOnly} of ${r.schemas} schemas`);
ok('[1] __solo agrees with the independent fold predicate on every schema', r.soloMatches === true);
ok('[1] no WIRED schema is hidden by the fold', r.wiredVisible.length === 0, r.wiredVisible.slice(0, 4).join(', '));
ok('[2] SetupCompleteRequest folds exactly 5 (ExplorationPreferencesInput stays visible)', r.parent && r.foldN === 5 && r.foldNexpected === 5 && r.explVisible === true, `foldN=${r.foldN} expected=${r.foldNexpected} expl=${r.explVisible}`);
ok('[3] the COUNT badge sprite rides the parent group with the same number', r.badge && r.badgeN === r.foldN, `badgeN=${r.badgeN} badges=${r.badgesTotal} parents=${r.parentsWithFold}`);
ok('[3] every VISIBLE folding parent wears a badge', r.badgesTotal === r.parentsWithFold && r.badgesTotal > 5, `${r.badgesTotal} vs ${r.parentsWithFold}`);
ok('[5] double-click reveal: the five kids reappear, pinned', r.kidsAfterReveal === 5 && r.pinned === 5, r.kids.join(', '));
ok('[5] clearing the pins folds them again', r.kidsAfterUnpin === 0);
ok('[6] ALL shows every schema · OFF hides every schema · CRITICAL folds again', r.allVisible === 0 && r.offVisible === 0 && r.critHidden === r.nestedOnly, `all-hidden=${r.allVisible} off-visible=${r.offVisible} crit-hidden=${r.critHidden}`);
ok('[6] the badge survives the kind cycle', r.badgeAfterCycle === 5, `badge=${r.badgeAfterCycle}`);
ok('[7] fn→schema wires are drawn (functions ON), and an ENDPOINT-wired schema never folds', r.fnWires > 0 && r.epWiredFolded === 0, `${r.fnWires} fn→schema wires · ${r.epWiredFolded} endpoint-wired folded`);
ok('[7] a function wire alone does not block the fold (the upsert that takes an Input)', r.fnOnlyFolded > 0, `${r.fnOnlyFolded} folded helpers carry a fn wire`);
ok('[P2] serializes wires drew and did NOT un-fold any schema (soloMatches above already holds them out)', r.serWires > 0, `${r.serWires} serializes wires · ${r.serFoldOK} folded schemas also serialize a model`);
ok('no page/console errors', errs.length === 0, errs.slice(0, 3).join(' | '));
R.forEach(l => console.log(l));
const failed = R.filter(x => x.startsWith('FAIL')).length;
console.log(`\n${R.length - failed}/${R.length} schema-fold checks passed`);
await b.close();
process.exit(failed ? 1 : 0);
