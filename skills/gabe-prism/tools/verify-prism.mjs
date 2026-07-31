/* gabe-prism · contract gate
 *
 * A factory view is only worth more than a concept map if its claims hold: the
 * payload is named at every hop, every node carries a number, failures are
 * distinguishable, gates are not stages, and a clickable cell opens something.
 * This checks the ones a machine can check, and says plainly which it cannot.
 *
 * Usage:  node tools/verify-prism.mjs <page.html> [--fx <slug>]
 *
 * The page marks its floor with `data-prism` on the container, and each node
 * with `data-node`, carrying:
 *     data-in="<payload in>"  data-out="<payload out>"
 *     data-num="<one measured number>"  data-state="running|ghost|unpowered|broken"
 *     data-gate (optional, marks the element as a GATE, not a stage)
 *     data-detail="<selector of the panel it opens>" (optional)
 * A page with no [data-prism] container reports SKIP loudly and exits 0 —
 * nothing to verify is not the same as verified.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const target = resolve(args.find((a) => !a.startsWith('--')) || 'page.html');
const STATES = ['running', 'ghost', 'unpowered', 'broken'];

const { chromium } = await import(`${process.env.HOME}/.claude/skills/gabe-docsite/tools/_playwright.mjs`);
const html = await readFile(target, 'utf8');
const srv = createServer((_q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));

let pass = 0, fail = 0;
const ok = (n, d = '') => { console.log(`PASS  ${n}${d ? '  — ' + d : ''}`); pass++; };
const bad = (n, d = '') => { console.log(`FAIL  ${n}${d ? '  — ' + d : ''}`); fail++; };

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'load' });
await p.waitForTimeout(400);

const floors = await p.$$eval('[data-prism]', (ns) => ns.length);
if (!floors) {
  console.log('SKIP  no [data-prism] container — nothing to verify.');
  console.log('      That is NOT a pass. If this page claims to be a prism view, it is unmarked.');
  await b.close(); srv.close();
  process.exit(0);
}

const nodes = await p.$$eval('[data-prism] [data-node]', (ns) => ns.map((n) => ({
  name: n.getAttribute('data-node') || '',
  in: n.getAttribute('data-in') || '',
  out: n.getAttribute('data-out') || '',
  num: n.getAttribute('data-num') || '',
  state: n.getAttribute('data-state') || '',
  gate: n.hasAttribute('data-gate'),
  detail: n.getAttribute('data-detail') || '',
  clickable: n.tagName === 'BUTTON' || n.hasAttribute('tabindex') || n.hasAttribute('data-detail'),
})));

const stages = nodes.filter((n) => !n.gate);
const gates = nodes.filter((n) => n.gate);

/* 1 · the chain is a chain: every stage names what it eats and what it makes */
const unnamed = stages.filter((n) => !n.in || !n.out);
unnamed.length === 0
  ? ok('every stage names its payload in and out', `${stages.length} stages`)
  : bad('stage(s) with an unnamed payload', unnamed.map((n) => n.name || '(unnamed)').slice(0, 4).join(', '));

const inert = stages.filter((n) => n.in && n.out && n.in.trim() === n.out.trim());
inert.length === 0
  ? ok('no stage produces what it consumed')
  : bad('stage(s) whose input equals their output — they do nothing', inert.map((n) => n.name).join(', '));

/* 2 · the payload actually changes identity across the chain */
const identities = new Set(stages.flatMap((n) => [n.in.trim(), n.out.trim()]).filter(Boolean));
identities.size >= 3
  ? ok('the payload changes identity across the chain', `${identities.size} distinct payloads`)
  : bad('the payload never really changes', `${identities.size} distinct payload name(s) — this is an arrow, not a line`);

/* 3 · every stage carries a measured number */
const numberless = stages.filter((n) => !n.num.trim());
numberless.length === 0
  ? ok('every stage carries a measured number')
  : bad('stage(s) with no number — no bottleneck can appear', numberless.map((n) => n.name).slice(0, 4).join(', '));

/* 4 · states are legal, and every state used is legended on the page */
const illegal = nodes.filter((n) => n.state && !STATES.includes(n.state));
const stateless = stages.filter((n) => !n.state);
illegal.length === 0 && stateless.length === 0
  ? ok('every node declares one of the four states')
  : bad('state problems',
      [...illegal.map((n) => `${n.name}="${n.state}"`), ...stateless.map((n) => `${n.name}=(none)`)].slice(0, 4).join(', '));

const used = [...new Set(nodes.map((n) => n.state).filter(Boolean))];
const pageText = (await p.evaluate(() => document.body.innerText)).toLowerCase();
const unlegended = used.filter((s) => !pageText.includes(s));
unlegended.length === 0
  ? ok('every state used is legended on the page', used.join(' · '))
  : bad('state(s) coloured but never explained', unlegended.join(', '));

/* 5 · gates are their own register, never a stage */
const bothRoles = nodes.filter((n) => n.gate && (n.in || n.out));
bothRoles.length === 0
  ? ok('gates are not stages', `${gates.length} gate(s), ${stages.length} stage(s)`)
  : bad('element(s) acting as both a gate and a stage', bothRoles.map((n) => n.name).join(', '));

/* 6 · a clickable cell opens something that exists and has content */
const openers = nodes.filter((n) => n.detail);
const emptyDetails = [];
for (const n of openers) {
  const len = await p.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.innerText.trim().length : -1;
  }, n.detail);
  if (len <= 0) emptyDetails.push(`${n.name}→${n.detail}${len === -1 ? ' (missing)' : ' (empty)'}`);
}
emptyDetails.length === 0
  ? ok('every inspectable cell opens a panel with content', `${openers.length} checked`)
  : bad('cell(s) whose detail panel is missing or empty', emptyDetails.slice(0, 3).join(', '));

console.log('\nNOT CHECKED HERE (no script adjudicates these — a reviewer does):');
console.log('  · whether the actors are the RIGHT actors for the question being asked');
console.log('  · whether the analogy earns the attention it costs');

await b.close(); srv.close();
console.log(`\n${pass}/${pass + fail} prism checks passed — ${target}`);
process.exit(fail ? 1 : 0);
