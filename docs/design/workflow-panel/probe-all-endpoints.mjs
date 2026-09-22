/* probe-all-endpoints.mjs — the all-endpoints page's render proof (headless system Chrome via the spike's playwright-core).

     node docs/design/workflow-panel/probe-all-endpoints.mjs [--page FILE] [--forms FILE] [--archmap FILE] [--scratch DIR] [--shots DIR] [--gen FILE]

   WHERE EACH EXPECTED VALUE COMES FROM. The page's generator reads the lab's facts and, for four readings, the feed. This probe
   does NOT reuse that route where it can avoid it: every column the forms feed decides (the endings, their stages, guards,
   login, rate, the JSON body's fields, the reply's fields where the contract names them, tests, proof, forks, catches, fate,
   data functions, switches, rules, in-flight values, alarms) is recomputed for ALL rows straight from forms.json — the raw
   endpoint record, its paths' effect buckets and the feed's steps — never from the lab's record. The columns only the MAP
   decides (tables, the map's written tables, screens, reason sites, steps, deciders, functions behind, pieces) are read from
   the lab's facts for a sample (gen-endpoint-facts.py run here, into --scratch, never over _lab-ep.js).
   What is compared: a cell's sort key (data-v), and for a composite cell its drawn parts — every stage box, every fate and
   pieces segment (its share of the bar and its colour), every alarm dot (its family and whether it is lit). Group rows are
   recomputed from the rows' members; category cells are measured for being cut; the header is measured on screen while the
   page and the board both scroll. An absent arm is proven on a FIXTURE page built from a scratch copy of the feed with two
   arms switched off. Exit 1 on any failure; SKIP loudly (exit 0) when chrome or playwright-core is missing. Browser-gated: run it ALONE. */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../../..');
const args = process.argv.slice(2), opt = (k, d) => (args.indexOf(k) >= 0 ? args[args.indexOf(k) + 1] : d);
const home = (p) => p.replace(/^~/, os.homedir());
const PAGE = path.resolve(opt('--page', path.join(HERE, 'all-endpoints.html')));
const FORMS = home(opt('--forms', '~/.cache/gabe-map-baselines/lab-input/forms.json'));
const ARCHMAP = home(opt('--archmap', path.join(path.dirname(FORMS), 'archmap.json')));
const SCRATCH = path.resolve(opt('--scratch', path.join(os.tmpdir(), 'allep-probe'))), shotsAt = opt('--shots', null);
const GEN = path.resolve(opt('--gen', path.join(HERE, 'gen-all-endpoints.py')));        /* the generator the fixture is built with (a mutant passes its copy) */
const PW = path.join(REPO, 'docs/design/graft-adoption/spike/_build/node_modules/playwright-core'), CHROME = '/usr/bin/google-chrome-stable';
if (!fs.existsSync(CHROME) || !fs.existsSync(PW)) { console.log('SKIP ⚠ — no system chrome / playwright-core on this host (RENDER COVERAGE DID NOT RUN)'); process.exit(0); }
fs.mkdirSync(SCRATCH, { recursive: true }); if (shotsAt) fs.mkdirSync(shotsAt, { recursive: true });
const { chromium } = require(PW);
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m + (extra !== undefined ? ' — ' + JSON.stringify(extra).slice(0, 300) : '')); } };

/* ── what the feed holds, read here ── */
const FJ = JSON.parse(fs.readFileSync(FORMS, 'utf8'));
const FEED = Object.keys(FJ.endpoints || {}).map((k) => k.replace(/^endpoint:/, '')).sort();
const labSha = () => (fs.existsSync(path.join(HERE, '_lab-ep.js')) ? execFileSync('sha1sum', [path.join(HERE, '_lab-ep.js')]).toString().split(' ')[0] : null);
const LAB0 = labSha();

/* ── the lab's facts for a sample, and this probe's OWN reading of every column from them ── */
const facts = (ep) => { const out = path.join(SCRATCH, 'facts-' + ep.replace(/[^A-Za-z0-9]+/g, '_') + '.js');
  execFileSync('python3', [path.join(HERE, 'gen-endpoint-facts.py'), ep, '--forms', FORMS, '--archmap', ARCHMAP, '--out', out], { cwd: HERE, stdio: 'pipe' });
  const s = fs.readFileSync(out, 'utf8'), i = s.indexOf('window.LABEP = ') + 'window.LABEP = '.length; return JSON.parse(s.slice(i).replace(/;\s*$/, '')); };
const WR = new Set(['add', 'update', 'delete', 'insert', 'upsert', 'merge', 'bulk_insert', 'execute', 'write']);
const LEAVE = { middleware: 'EDGE', security: 'GATE', dependency: 'GATE', 'body-parse': 'INPUT', validation: 'INPUT', handler: 'HANDLER', uncaught: 'UNCAUGHT' };
const FATES = ['saved', 'maybe', 'rolled', 'unsaved', 'after', 'none'];
const STEPS = FJ.steps || {}, SCHEMAS = FJ.schemas || {}, PROC = (FJ.inflight || {}).process || {};
const sureConf = (t) => !String(t.conf || '').startsWith('ambiguous');
/* the feed's own endings of one endpoint: its produced rows, its framework rows, its returns that carry a status */
function feedExits(ep) {
  const d = new Map();
  (ep.produced || []).forEach((x) => d.set(x.id, ['produced', x])); (ep.framework_exits || []).forEach((x) => d.set(x.id, ['framework', x]));
  (ep.returns || []).forEach((x) => { if (x.status != null) d.set(x.id, ['return', x]); });
  return [...d.values()].map(([row, x]) => ({ x, kind: row === 'return' ? 'success' : row === 'framework' ? 'framework' : x.phase === 'uncaught' ? 'uncaught' : x.phase === 'validation' ? 'validation' : 'refusal' }));
}
/* the JSON body: read at all (body-parse endings), and the top schema the validation ending names (the one no other names) */
function feedBody(ep) {
  if (!(ep.framework_exits || []).some((x) => x.phase === 'body-parse')) return 0;
  const listed = [...new Set((ep.produced || []).filter((x) => x.phase === 'validation').flatMap((x) => x.schemas || []))].filter((s) => SCHEMAS[s]);
  const cls = (s) => SCHEMAS[s].cls || s.split(':').pop();
  const top = listed.filter((t) => !listed.some((s) => s !== t && (SCHEMAS[s].fields || []).some((f) => new RegExp('\\b' + cls(t) + '\\b').test(String(f.annotation || '')))));
  return top.length === 1 && !SCHEMAS[top[0]].variants ? (SCHEMAS[top[0]].fields || []).length : 'unknown';
}
/* one path's fate, from the feed's buckets: the endpoint's own writes before the answer, then its writes after it */
function feedFate(p) {
  const e = p.effects || {}, bk = (sid) => ['committed', 'maybe_committed', 'rolled_back', 'uncommitted'].find((b) => (e[b] || []).includes(sid));
  const own = (e.steps || []).filter((s) => !s.dependency && WR.has((STEPS[s.step] || {}).op)).map((s) => bk(s.step));
  const after = (e.after_response || []).filter((s) => !s.dependency && WR.has((STEPS[s.step] || {}).op));
  return own.includes('committed') ? 'saved' : own.includes('maybe_committed') ? 'maybe' : own.includes('rolled_back') ? 'rolled' : own.includes('uncommitted') ? 'unsaved' : after.length ? 'after' : 'none';
}
function fromFeed(key, W) {                        /* column id → the drawn key, for every column the forms feed decides */
  const ep = FJ.endpoints[key], X = feedExits(ep), e = {}, kinds = {}, st = {};
  X.forEach(({ kind }) => { kinds[kind] = (kinds[kind] || 0) + 1; });
  ['success', 'refusal', 'framework', 'validation', 'uncaught'].forEach((k) => { e['e_' + k] = kinds[k] || 0; });
  e.all = X.length;
  X.forEach(({ x, kind }) => { const s = kind === 'success' ? 'ANSWER' : LEAVE[x.phase]; st[s] = (st[s] || 0) + 1; });
  e.stage = Object.keys(st).length;
  e.guards = (ep.preconditions || []).length;
  const au = ep.auth || {}; e.auth = [...new Set((au.schemes || []).map((s) => String(s.scheme)))].sort().join('+') || ((au.gates || []).length ? W.authNoScheme : 'none');
  e.rate = [...new Set(((ep.rate || {}).limits || []).map((l) => String(l.limiter || l.class || '?').replace(/^_+/, '')))].sort().join('+') || 'none';
  e.request = feedBody(ep);
  const named = Object.entries(ep.responses || {}).filter(([k, r]) => k.startsWith('r:') && r.fields != null);
  if (named.length) e.response = new Set(named.flatMap(([, r]) => r.fields)).size;
  e.acts = (ep.tests || {}).act || 0;
  e.asserted = X.reduce((n, { x }) => n + (x.tests || []).filter((t) => String(t.conf || '').includes('+')).length, 0);
  const sure = X.filter(({ x }) => (x.tests || []).some(sureConf)).length;
  e.proof = X.length ? Math.round(10000 * sure / X.length) / 10000 : 0; e.proofText = sure + '/' + X.length;
  e.branches = (ep.branches || []).length; e.catches = ((ep.failure || {}).catches || []).length; e.switches = (ep.switches || []).length;
  const fate = Object.fromEntries(FATES.map((f) => [f, 0])), fns = new Set(), own = new Set(), dep = new Set();
  (ep.paths || []).forEach((p) => { fate[feedFate(p)]++;
    ((p.effects || {}).steps || []).forEach((s) => { const r = STEPS[s.step] || {}; if (!s.dependency && r.fn) fns.add(r.fn);
      if (WR.has(r.op) && r.table) (s.dependency ? dep : own).add(r.table); });
    ((p.effects || {}).after_response || []).forEach((s) => { const r = STEPS[s.step] || {}; if (!s.dependency && WR.has(r.op) && r.table) own.add(r.table); }); });
  e.fate = fate.saved; e.fateParts = fate; e.datafns = fns.size;
  e.ownWrites = own; e.gateOnly = new Set([...dep].filter((t) => !own.has(t)));
  e.cases422 = X.reduce((n, { x }) => n + (x.cases || []).filter((c) => c && typeof c === 'object').length, 0);
  const dies = {}; (ep.inflight || []).forEach((ir) => { const r = ir.ref && PROC[ir.ref] ? { ...PROC[ir.ref], ...ir } : ir; dies[r.dies] = (dies[r.dies] || 0) + 1; });
  e.inf_answer = dies['with the answer'] || 0; e.inf_server = dies['with the server process'] || 0;
  e.alarmIds = [...new Set([...(ep.findings || []).map((f) => f.id), ...Object.values(ep.arm_findings || {}).flat().map((f) => f.id),
    ...(((FJ.arm_findings || {}).frontend || []).filter((f) => f.endpoint === key).map((f) => f.id))])].sort();
  e.alarms = e.alarmIds.length;
  return { e, st };
}
function fromLab(L) {                              /* column id → the drawn key, for the columns only the map decides */
  const F = L.forms, e = {};
  e.tables = L.data.tables.length; e.tableNames = L.data.tables.map((t) => t.table).sort();
  e.mapWritten = L.data.tables.filter((t) => t.rw !== 'r').map((t) => t.table);
  e.deciders = ((F.inside || {}).functions || []).filter((f) => (f.refusals || []).length || (f.raises || []).some((r) => (r.here || []).length)).length;
  e.fetched = L.widening.fetched_by.length; e.reasons = (F.frontend.reason_sites || []).length;
  e.chain = Math.max(0, ...F.paths.map((p) => p.chain.length));
  e.behind = L.functions.behind.fns || 0;
  const pw = L.feedwide.pieces.rows; e.pieces = pw.filter((r) => r.word === 'rare' || r.word === 'only here').length; e.lacks = L.feedwide.pieces.missing_norms.length;
  e.pieceParts = {}; pw.forEach((r) => { e.pieceParts[r.word] = (e.pieceParts[r.word] || 0) + 1; });
  const resp = L.data.schemas.response; e.labResponse = resp.present ? (resp.cols || []).length + (resp.cols_more || 0) : resp.name ? 'unknown' : 0;
  return e;
}

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage(), errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const open = async (file) => { await p.goto('file://' + file); await p.waitForFunction('window.__allep && window.__allep.ready', { timeout: 20000 });
  await p.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/^gabe:allep/.test(k)) localStorage.removeItem(k); } catch (e) {} });
  await p.reload(); await p.waitForFunction('window.__allep && window.__allep.ready', { timeout: 20000 }); };
const pick = async (rail, v) => { await p.click(`.opt[data-rail="${rail}"][data-v="${v}"]`); await p.waitForTimeout(40); };
const drawn = () => p.evaluate(() => [...document.querySelectorAll('#board tr.row[data-ep], #board .card[data-ep]')].map((e) => e.getAttribute('data-ep')));
const heads = () => p.evaluate(() => [...document.querySelectorAll('#board [data-group]')].map((e) => ({ g: e.getAttribute('data-group'), t: e.textContent })));

await open(PAGE);
const D = await p.evaluate(() => window.__allep.data);
const shot = async (n) => { if (shotsAt) await p.screenshot({ path: path.join(shotsAt, n + '.png') }); };

/* 1 · the rows are the feed's endpoints, each once */
{ const ids = await drawn();
  ok(ids.length === FEED.length, 'the table draws one row per endpoint the feed holds', { drawn: ids.length, feed: FEED.length });
  ok(JSON.stringify([...ids].sort()) === JSON.stringify(FEED), 'the rows drawn are exactly the feed\'s endpoints');
  ok(D.tok.nFeed === FEED.length && D.rows.length === FEED.length, 'the page data carries the feed\'s endpoint count'); }

/* 2 · every layout × grouping draws every endpoint exactly once, in the groups the row records call for */
const keyOf = (r, grp) => grp === 'entity' ? (r.ent || '—') : grp === 'seg' ? r.seg : grp === 'method' ? r.m
  : grp === 'labels' ? [...r.labels].sort().join('|') : grp === 'counts' ? ['success', 'refusal', 'framework', 'validation', 'uncaught'].map((k) => r.v['e_' + k]).join('|') : '';
for (const lay of ['rows', 'two', 'three']) {
  await pick('lay', lay);
  for (const grp of ['entity', 'seg', 'method', 'labels', 'counts', 'flat']) {
    await pick('grp', grp);
    for (const alone of grp === 'flat' ? ['gather'] : ['gather', 'own']) {
      if (grp !== 'flat') await pick('alone', alone);
      const ids = await drawn(), tag = lay + ' · ' + grp + ' · ' + alone;
      const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      ok(ids.length === FEED.length && !dup.length && new Set(ids).size === FEED.length, 'every endpoint drawn exactly once · ' + tag, { n: ids.length, dup: dup.slice(0, 3) });
      if (grp === 'flat') continue;
      const want = {}; D.rows.forEach((r) => { const k = keyOf(r, grp); want[k] = (want[k] || 0) + 1; });
      const nGroups = Object.keys(want).length, nAlone = Object.values(want).filter((n) => n === 1).length;
      const hs = await heads(), expectHeads = alone === 'own' ? nGroups : nGroups - nAlone + (nAlone ? 1 : 0);
      ok(hs.length === expectHeads, 'the group headers drawn are the groups the row records call for · ' + tag, { drawn: hs.length, expect: expectHeads });
      /* the members under each header share one key (a gathered header holds only groups of a single endpoint) */
      const members = await p.evaluate(() => { const out = []; let cur = null;
        document.querySelectorAll('#board [data-group], #board tr.row[data-ep], #board .card[data-ep]').forEach((e) => {
          if (e.hasAttribute('data-group')) { cur = { g: e.getAttribute('data-group'), ids: [] }; out.push(cur); } else if (cur) cur.ids.push(e.getAttribute('data-ep')); }); return out; });
      const R = Object.fromEntries(D.rows.map((r) => [r.id, r]));
      const bad = members.filter((m) => m.g === '_alone' ? m.ids.some((id) => want[keyOf(R[id], grp)] !== 1) : new Set(m.ids.map((id) => keyOf(R[id], grp))).size !== 1);
      ok(!bad.length, 'every group holds endpoints of one key · ' + tag, bad.slice(0, 2));
    }
  }
}
await pick('lay', 'rows'); await pick('grp', 'entity'); await pick('alone', 'gather');

/* 3 · every header strip sums to the row count, and each piece counts the drawn cells in its bin */
{ const strips = await p.evaluate(() => [...document.querySelectorAll('#board thead th[data-col]')].map((h) => ({ col: h.getAttribute('data-col'),
    segs: [...h.querySelectorAll('.sg')].map((s) => ({ bin: s.getAttribute('data-bin'), n: +s.getAttribute('data-n') })),
    cells: [...document.querySelectorAll('#board tr.row [data-col="' + h.getAttribute('data-col') + '"]')].map((c) => c.getAttribute('data-v')) })));
  ok(strips.length === D.cols.length, 'every column wears a header strip', { strips: strips.length, cols: D.cols.length });
  const inBin = (v, bin) => bin === 'absent' || bin === 'unknown' ? v === bin : bin.startsWith('c:') ? v === bin.slice(2) : (() => { const [, lo, hi] = bin.split(':'); return v !== 'absent' && v !== 'unknown' && +v >= +lo && +v <= +hi; })();
  for (const s of strips) {
    const sum = s.segs.reduce((a, x) => a + x.n, 0);
    ok(sum === FEED.length, 'the strip of ' + s.col + ' sums to the row count', { sum });
    const miss = s.segs.filter((g) => s.cells.filter((v) => inBin(v, g.bin)).length !== g.n);
    ok(!miss.length, 'each piece of the ' + s.col + ' strip counts the drawn cells in its bin', miss.slice(0, 2));
    ok(s.cells.every((v) => s.segs.some((g) => inBin(v, g.bin))), 'every drawn ' + s.col + ' cell falls in a piece of its strip'); } }

/* 4 · EVERY row, every column the forms feed decides, recomputed from forms.json; the drawn parts of the composite cells */
const readRow = (id) => p.evaluate((id) => { const tr = document.querySelector('#board tr.row[data-ep="' + CSS.escape(id) + '"]'); const o = {};
  const bgOf = (css) => { const q = document.createElement('i'); q.style.background = css; document.body.appendChild(q); const c = getComputedStyle(q).backgroundColor; q.remove(); return c; };
  tr.querySelectorAll('[data-col]').forEach((c) => { o[c.getAttribute('data-col')] = { v: c.getAttribute('data-v'), t: c.textContent,
    spine: [...c.querySelectorAll('[data-stage]')].map((i) => [i.getAttribute('data-stage'), +i.getAttribute('data-n')]),
    segs: [...c.querySelectorAll('.sb i')].map((i) => ({ s: i.getAttribute('data-s'), w: parseFloat(i.style.width), bg: getComputedStyle(i).backgroundColor,
      want: bgOf(c.getAttribute('data-col') === 'fate' ? 'var(--f-' + i.getAttribute('data-s') + ')' : 'var(--p-' + ({ 'the norm': 'norm', common: 'common', rare: 'rare', 'only here': 'only' })[i.getAttribute('data-s')] + ')') })),
    dots: [...c.querySelectorAll('.dots i')].map((i) => [i.getAttribute('data-f'), i.classList.contains('on')]) }; }); return o; }, id);
const WDS = D.words, D_UNKNOWN_WORD = D.words.unknown, ROW = Object.fromEntries(D.rows.map((r) => [r.id, r]));
/* the alarm families' fixed places, recomputed: most frequent across the feed first, ties by name */
{ const fam = {}; FEED.forEach((ep) => fromFeed('endpoint:' + ep, WDS).e.alarmIds.forEach((f) => { fam[f] = (fam[f] || 0) + 1; }));
  const want = Object.keys(fam).sort((a, b) => fam[b] - fam[a] || (a < b ? -1 : 1));
  ok(JSON.stringify(D.families) === JSON.stringify(want), 'the alarm dots stand in the order of how often the feed raises each family', { page: D.families, feed: want }); }
const FEEDCOLS = ['all', 'e_success', 'e_refusal', 'e_framework', 'e_validation', 'e_uncaught', 'stage', 'guards', 'auth', 'rate', 'request', 'response', 'acts', 'asserted',
  'proof', 'branches', 'catches', 'switches', 'fate', 'datafns', 'cases422', 'inf_answer', 'inf_server', 'alarms'];
const miss4 = {};
for (const ep of FEED) {
  const { e, st } = fromFeed('endpoint:' + ep, WDS), got = await readRow(ep), bad = (c, x) => { (miss4[c] = miss4[c] || []).push([ep, x]); };
  for (const c of FEEDCOLS) {
    if (!(c in e)) continue;                                                        /* a reply the contract names no fields for: the sample reads it */
    const g = got[c]; if (!g) { bad(c, 'no cell'); continue; }
    const want = e[c], same = typeof want === 'number' ? g.v !== 'absent' && g.v !== 'unknown' && Math.abs(+g.v - want) < 1e-9 : g.v === String(want);
    if (!same) bad(c, { drawn: g.v, feed: want });
  }
  if (got.proof.t !== e.proofText) bad('proof-text', { drawn: got.proof.t, feed: e.proofText });
  const spine = Object.fromEntries(got.stage.spine);
  if (!(Object.keys(st).every((s) => spine[s] === st[s]) && Object.entries(spine).every(([s, n]) => (st[s] || 0) === n))) bad('stage-boxes', { drawn: spine, feed: st });
  const tot = Object.values(e.fateParts).reduce((a, b) => a + b, 0), fsegs = got.fate.segs;
  const wantF = FATES.filter((f) => e.fateParts[f]);
  if (JSON.stringify(fsegs.map((x) => x.s)) !== JSON.stringify(wantF) || fsegs.some((x) => Math.abs(x.w - 100 * e.fateParts[x.s] / tot) > 0.01)) bad('fate-segments', { drawn: fsegs.map((x) => [x.s, x.w]), feed: e.fateParts });
  if (fsegs.some((x) => x.bg !== x.want)) bad('fate-colour', fsegs.map((x) => [x.s, x.bg, x.want]));
  const lit = got.alarms.dots.filter((d) => d[1]).map((d) => d[0]).sort();
  if (JSON.stringify(got.alarms.dots.map((d) => d[0])) !== JSON.stringify(D.families) || JSON.stringify(lit) !== JSON.stringify(e.alarmIds)) bad('alarm-dots', { lit, feed: e.alarmIds });
  const wr = new Set(ROW[ep].u.written || []);
  if ([...e.gateOnly].some((t) => wr.has(t)) || [...e.ownWrites].some((t) => !wr.has(t)) || +got.written.v !== wr.size) bad('written', { drawn: [...wr], gateOnly: [...e.gateOnly], own: [...e.ownWrites] });
}
for (const c of [...FEEDCOLS, 'proof-text', 'stage-boxes', 'fate-segments', 'fate-colour', 'alarm-dots', 'written'])
  ok(!miss4[c], 'every row · ' + c + ' drawn as the forms feed says', (miss4[c] || []).slice(0, 3));

/* 4b · a sample: the columns only the map decides, from the lab's own facts */
const SAMPLE = ['POST /setup/complete', 'GET /recipes', 'DELETE /', 'GET /recipe-creation/gustify/stream', 'POST /pantry/items/batch', 'GET /', 'GET /pantry/overview'].filter((x) => FEED.includes(x));
ok(SAMPLE.length >= 6, 'the sample names endpoints the feed holds', SAMPLE);
const blocksRead = new Set(FEEDCOLS.filter((c) => !miss4[c]).map((c) => { const col = D.cols.find((x) => x.id === c); return col.shared ? '_shared' : col.home; }));
for (const ep of SAMPLE) {
  const L = facts(ep), m = fromLab(L), { e } = fromFeed('endpoint:' + ep, WDS), got = await readRow(ep);
  for (const c of ['tables', 'deciders', 'fetched', 'reasons', 'chain', 'behind', 'pieces', 'lacks']) {
    const same = got[c] && Math.abs(+got[c].v - m[c]) < 1e-9; ok(same, ep + ' · ' + c + ' drawn as the lab\'s facts say', { drawn: got[c] && got[c].v, facts: m[c] });
    if (same) { const col = D.cols.find((x) => x.id === c); blocksRead.add(col.shared ? '_shared' : col.home); } }
  ok(JSON.stringify(ROW[ep].u.tables) === JSON.stringify(m.tableNames), ep + ' · the tables a group row counts are the lab\'s tables', { page: ROW[ep].u.tables, facts: m.tableNames });
  const wantW = [...new Set([...m.mapWritten.filter((t) => !e.gateOnly.has(t)), ...e.ownWrites])].sort();
  ok(JSON.stringify(ROW[ep].u.written) === JSON.stringify(wantW), ep + ' · writes are the map\'s written tables less the login check\'s, plus its own', { page: ROW[ep].u.written, want: wantW });
  if (!('response' in e)) { const gv = got.response.v;
    ok(gv === String(m.labResponse), ep + ' · a reply the contract names no fields for: the lab\'s count of its model, unknown when the model is named but unread, zero when none is named', { drawn: gv, lab: m.labResponse }); }
  const pt = Object.values(m.pieceParts).reduce((a, b) => a + b, 0), ps = got.pieces.segs;
  ok(ps.every((x) => Math.abs(x.w - 100 * m.pieceParts[x.s] / pt) < 0.01 && x.bg === x.want) && ps.length === Object.keys(m.pieceParts).length,
    ep + ' · each pieces segment is its word\'s share of the bar, in its word\'s colour', { drawn: ps.map((x) => [x.s, x.w]), facts: m.pieceParts });
}
ok(D.blocks.every((bk) => blocksRead.has(bk.key)) && blocksRead.has('_shared'), 'the sample read at least one column of every block', [...blocksRead]);
ok(labSha() === LAB0, 'the lab\'s own facts file is untouched by the sample');

/* 5 · a zero says why in the words file's own line (D-017: never a reader's reason); unknown is never drawn as a number; the head is said once */
{ const zs = await p.evaluate(() => { const A = window.__allep, W = A.data.words, out = [];
    A.data.rows.forEach((r) => A.data.cols.forEach((c) => { if (c.kind === 'cat' || r.v[c.id] === 'absent') return; const k = r.k[c.id], s = A.cellWords(c, r);
      if (r.v[c.id] === 'unknown') { if (!s.startsWith(W.unknown + ' — ')) out.push([r.id, c.id, s]); return; }
      if (!k && r.why[c.id] !== W.cols[c.id].zero) out.push([r.id, c.id, r.why[c.id]]); })); return out; });
  ok(!zs.length, 'every zero cell\'s hover gives its column\'s reason from the words file, and every unknown cell says unknown', zs.slice(0, 3));
  const unk = await p.evaluate(() => [...document.querySelectorAll('#board tr.row [data-v="unknown"]')].map((c) => c.textContent));
  ok(unk.every((t) => t === D_UNKNOWN_WORD), 'an unknown cell draws the word, never a number', unk.slice(0, 3));
  const z = await p.evaluate(() => { const c = document.querySelector('#board tr.row [data-col="request"][data-v="0"]'); if (!c) return null;
    c.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); return document.getElementById('tip').textContent; });
  ok(z && z.includes(D.words.cols.request.zero), 'a zero cell\'s hover carries its reason on screen', z);
  const txt = await p.evaluate(() => document.body.innerText);
  const heads = (txt.match(new RegExp(D.tok.head, 'g')) || []).length;
  ok(heads === 1, 'the page says its head once', heads);
  ok(txt.includes(D.tok.app), 'the page names the app'); }

/* 5b · a group row: endings add up, a shared thing is counted once — recomputed from its members for every group */
{ const G = await p.evaluate(() => [...document.querySelectorAll('#board tr.grow')].map((g) => { const ids = []; let n = g.nextElementSibling;
    while (n && n.classList.contains('row')) { ids.push(n.getAttribute('data-ep')); n = n.nextElementSibling; }
    return { g: g.getAttribute('data-group'), ids, agg: Object.fromEntries([...g.querySelectorAll('td[data-col]')].map((td) => [td.getAttribute('data-col'), td.textContent])) }; }));
  const badG = [];
  for (const g of G) for (const c of D.cols) { if (!c.agg) continue;
    const rs = g.ids.map((id) => ROW[id]).filter((r) => r.v[c.id] !== 'absent' && r.v[c.id] !== 'unknown'); if (!rs.length) continue;
    const want = c.agg === 'union' ? new Set(rs.flatMap((r) => r.u[c.id] || [])).size : c.agg === 'ratio' ? rs.reduce((a, r) => a + r.v[c.id][0], 0) + '/' + rs.reduce((a, r) => a + r.v[c.id][1], 0)
      : c.agg === 'count' ? rs.filter((r) => r.v[c.id] && r.v[c.id] !== 'none').length : rs.reduce((a, r) => a + (r.k[c.id] || 0), 0);
    if (String(want) !== g.agg[c.id]) badG.push([g.g, c.id, g.agg[c.id], want]); }
  ok(G.length > 1 && !badG.length, 'every group row counts a thing its endpoints share once, and adds up what each owns', badG.slice(0, 4));
  const unionCols = D.cols.filter((c) => c.agg === 'union').map((c) => c.id);
  ok(['tables', 'written', 'datafns', 'inf_server', 'inf_answer', 'deciders', 'switches', 'guards', 'cases422'].every((c) => unionCols.includes(c)), 'the columns of shared things count by identity', unionCols); }

/* 5c · a name cell is never cut: its whole value is on screen */
{ const cut = await p.evaluate(() => [...document.querySelectorAll('#board tr.row .cat')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  ok(!cut.length, 'no name cell is cut short', cut.slice(0, 3));
  const rt = await p.evaluate(() => [...document.querySelectorAll('#board tr.row [data-col="rate"]')].map((e) => [e.getAttribute('data-v'), e.textContent]));
  const norm = D.rows.reduce((m, r) => { m[r.v.rate] = (m[r.v.rate] || 0) + 1; return m; }, {}), top = Object.keys(norm).sort((a, b) => norm[b] - norm[a])[0];
  ok(rt.every(([v, t]) => v === top ? t === '·' : t === v.replace(/\+/g, ' · ')), 'a rate that is not the common one is written out in full', rt.filter(([v, t]) => v !== top).slice(0, 2)); }

/* 6 · sorting, lighting, the side panel, the rails */
{ await p.click('#board thead th[data-col="tables"]'); await p.waitForTimeout(60);
  const vals = async () => p.evaluate(() => { const out = []; let cur = []; document.querySelectorAll('#board tbody tr').forEach((tr) => {
    if (tr.classList.contains('grow')) { cur = []; out.push(cur); } else cur.push(+tr.querySelector('[data-col="tables"]').getAttribute('data-v')); }); return out; });
  const up = await vals(); ok(up.every((g) => g.every((v, i) => !i || g[i - 1] <= v)), 'a header click sorts every group up');
  await p.click('#board thead th[data-col="tables"]'); await p.waitForTimeout(60);
  const dn = await vals(); ok(dn.every((g) => g.every((v, i) => !i || g[i - 1] >= v)), 'a second click sorts every group down');
  await p.click('#board thead th.idh >> nth=1'); await p.waitForTimeout(60);
  const seg = await p.$('#board thead th[data-col="written"] .sg'); const segN = +(await seg.getAttribute('data-n'));
  await seg.click(); await p.waitForTimeout(60);
  const dim = await p.evaluate(() => document.querySelectorAll('#board tr.row[data-dim="true"]').length);
  ok(dim === FEED.length - segN, 'lighting a strip piece dims every row outside it', { dim, segN });
  ok(await p.isVisible('#litchip'), 'while rows are lit, a chip says so');
  await p.click('#litclear'); await p.waitForTimeout(40);
  const ep = 'POST /setup/complete'; await p.click('#board tr.row[data-ep="' + ep + '"] td.id'); await p.waitForTimeout(80);
  ok(await p.isVisible('#side'), 'a row click opens the side panel');
  const side = await p.evaluate(() => ({ h: document.querySelector('#side h3').textContent, cmd: (document.getElementById('labcmd') || {}).textContent || '' }));
  ok(side.h.replace(/\s+/g, '') === ep.replace(/\s+/g, ''), 'the side panel is about the row clicked', side.h);
  ok(side.cmd.includes('"' + ep + '"') && side.cmd.includes('--forms') && side.cmd.includes('gen-endpoint-facts.py'), 'the side panel gives the command that bakes the lab to this endpoint', side.cmd);
  await shot('side');
  const full = await p.evaluate(() => { document.getElementById('more-btn').click(); return document.body.innerText; });
  ok(!/\b(door|doors|lock|locks)\b/i.test(full), 'no string on the page says a word D-018 took out', (full.match(/.{30}\b(door|lock)s?\b.{30}/i) || [''])[0]);
  const small = await p.evaluate(() => { const bad = []; document.querySelectorAll('body *').forEach((e) => { if (!e.offsetParent && e.tagName !== 'BODY') return;
    const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 12) bad.push(e.tagName + '.' + e.className + ' ' + fs); }); return bad; });
  ok(!small.length, 'no visible text under the 12px floor', small.slice(0, 4));
  await p.keyboard.press('Escape'); await p.waitForTimeout(40); ok(!(await p.isVisible('#side')), 'Escape closes the side panel');
  const picks = await p.evaluate(() => [...document.querySelectorAll('.rgrp')].map((g) => g.querySelectorAll('.opt[data-pick]').length));
  ok(picks.length && picks.every((n) => n === 1), 'every rail marks exactly one option as my pick', picks);
  await pick('cols', 'top');
  const rs = await p.evaluate(() => [...document.querySelectorAll('#board thead th[data-col]')].map((h) => window.__allep.data.cols.find((c) => c.id === h.getAttribute('data-col')).r));
  ok(rs.length && rs.every((r) => r === D.tok.rTop), 'rated-top-only draws only the columns the inventory rates at the top', rs);
  await pick('cols', 'all'); await pick('lay', 'two'); await p.reload(); await p.waitForFunction('window.__allep && window.__allep.ready');
  ok(await p.evaluate(() => window.__allep.state.lay === 'two'), 'the rail is remembered across a reload');
  await pick('lay', 'rows'); }

/* 6b · the column names stay on screen while a person reads down a column: the page scrolled past the board's top, the board scrolled too */
{ await p.evaluate(() => { const bd = document.getElementById('board'); window.scrollTo(0, 0); window.scrollTo(0, bd.getBoundingClientRect().top + 400); bd.scrollTop = 600; });
  const settle = (cond) => p.waitForFunction(cond, null, { timeout: 3000 }).catch(() => {});   /* a scroll event lands on the next frame, which a heavy table can delay */
  await settle(() => { const b0 = document.querySelector('#board thead tr.bh th.bstart'); return Math.abs(b0.getBoundingClientRect().top) <= 4; });
  const at = await p.evaluate(() => { const bd = document.getElementById('board'), h = document.querySelector('#board thead tr.ch th[data-col]'), b0 = document.querySelector('#board thead tr.bh th.bstart');
    return { board: Math.round(bd.getBoundingClientRect().top), head: Math.round(h.getBoundingClientRect().top), band: Math.round(b0.getBoundingClientRect().top), scrolled: bd.scrollTop }; });
  ok(at.board < -300 && at.scrolled > 0, 'the page is scrolled past the board\'s top and the board is scrolled', at);
  ok(at.band >= -1 && at.band <= 4 && at.head > at.band && at.head < 120, 'the block names and the column names sit at the top of the screen', at);
  await p.evaluate(() => { window.scrollTo(0, 0); document.getElementById('board').scrollTop = 0; });
  await settle(() => { const bd = document.getElementById('board'), b0 = document.querySelector('#board thead tr.bh th.bstart'); return Math.abs(b0.getBoundingClientRect().top - bd.getBoundingClientRect().top) <= 2; });
  const back = await p.evaluate(() => { const bd = document.getElementById('board'), b0 = document.querySelector('#board thead tr.bh th.bstart'); return [Math.round(bd.getBoundingClientRect().top), Math.round(b0.getBoundingClientRect().top)]; });
  ok(Math.abs(back[1] - back[0]) <= 2, 'with the page at its top, the header sits at the board\'s top', back); }
ok(!errs.length, 'no page error', errs);

/* 7 · an arm the feed lacks reads "absent", never 0 — on a fixture built from a scratch copy of the feed */
{ const copy = JSON.parse(JSON.stringify(FJ));
  copy.arms.frontend.present = false; copy.arms.frontend.reason = 'switched off for the probe';
  copy.arms.kinds.parts.inflight.present = false; copy.arms.kinds.parts.inflight.reason = 'switched off for the probe';
  const fx = path.join(SCRATCH, 'forms-arms-off.json'), page = path.join(SCRATCH, 'fixture-arms-off.html');
  fs.writeFileSync(fx, JSON.stringify(copy));
  execFileSync('python3', [GEN, '--forms', fx, '--archmap', ARCHMAP, '--only', 'POST /setup/complete', '--only', 'GET /recipes', '--out', page], { cwd: HERE, stdio: 'pipe' });
  await open(page);
  const a = await p.evaluate(() => ['reasons', 'inf_answer', 'inf_server'].map((c) => [...document.querySelectorAll('#board tr.row [data-col="' + c + '"]')].map((e) => [e.getAttribute('data-v'), e.textContent])));
  ok(a.every((col) => col.length === 2 && col.every(([v, t]) => v === 'absent' && t === 'absent')), 'a cell whose arm is off reads absent, never 0', a);
  const segs = await p.evaluate(() => [...document.querySelectorAll('#board thead th[data-col="reasons"] .sg')].map((s) => [s.getAttribute('data-bin'), s.getAttribute('data-n')]));
  ok(segs.length === 1 && segs[0][0] === 'absent' && segs[0][1] === '2', 'the strip of an absent column counts it as absent', segs);
  const other = await p.evaluate(() => document.querySelector('#board tr.row [data-col="tables"]').getAttribute('data-v'));
  ok(other !== 'absent', 'a column whose arm is on still carries its value on the fixture', other);
  ok(await p.isVisible('#partial'), 'a fixture page says it draws part of the feed');
  ok(labSha() === LAB0, 'the lab\'s own facts file is untouched by the fixture build'); }
ok(!errs.length, 'no page error on the fixture', errs);

await b.close();
console.log((fail ? 'FAIL ✗' : 'PASS ✓') + ` probe-all-endpoints · ${pass} passed · ${fail} failed · ${FEED.length} endpoints · sample ${SAMPLE.length} · page ${path.basename(PAGE)}`);
process.exit(fail ? 1 : 0);
