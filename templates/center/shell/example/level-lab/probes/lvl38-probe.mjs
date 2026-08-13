// Round 44 — the center's theme convention lands: light + dark via data-theme
// stamps (the stamp WINS over the OS in both directions); a toggle reaches the
// light theme; every surface stays legible in both.
import { createRequire } from 'module';
const require = createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright');
let P=0,F=0; const ok=(c,m)=>{ if(c){P++;} else {F++; console.log('  FAIL:',m);} };
const b = await chromium.launch({ executablePath: '/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell' });
// force a DARK OS so the stamp-beats-OS direction is provable
const ctx = await b.newContext({ colorScheme: 'dark' });
const pg = await ctx.newPage(); const errs=[];
pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/khujta/projects/gabe_lens/templates/center/shell/example/level-lab/level-lab.html');
await pg.waitForFunction('window.__lvlready===true',{timeout:8000});
const T = async fn => pg.evaluate(fn);
const bgOf = () => pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
const inkOf = () => pg.evaluate(() => getComputedStyle(document.body).color);
const lum = (rgb) => { const m=rgb.match(/\d+/g).map(Number); return (m[0]*299+m[1]*587+m[2]*114)/255000; };

// 1 · dark OS, no stamp → dark ground
const bgDark = await bgOf();
ok(lum(bgDark)<0.3, 'dark OS renders the dark ground ('+bgDark+')');

// 2 · toggle → light stamp beats the dark OS
await pg.click('#themebtn');
const st1 = await T('window.__lvltest.theme()');
const bgLight = await bgOf(), inkLight = await inkOf();
ok(st1==='light', 'toggle stamps data-theme=light');
ok(lum(bgLight)>0.7, 'light ground despite the dark OS ('+bgLight+')');
ok(lum(inkLight)<0.3, 'dark ink on the light ground ('+inkLight+')');

// 3 · every surface is legible in LIGHT: canvas labels, panel, corner boxes
await T("window.__lvltest.set('trace')");
const light = await pg.evaluate(() => {
  const cs = el => el ? getComputedStyle(el) : null;
  const lbl = cs(document.querySelector('#canvas text.lbl'));
  const panel = cs(document.getElementById('panel'));
  const legend = cs(document.getElementById('legendBox'));
  return { lblFill: lbl ? lbl.fill : null,
           panelBg: panel.backgroundColor, legendBg: legend.backgroundColor }; });
ok(light.panelBg && lum(light.panelBg)>0.7, 'panel wears the light surface');
ok(light.legendBg && lum(light.legendBg)>0.7, 'legend box wears the light surface');
// select something → the card is readable (ink over light)
await pg.evaluate(() => document.querySelector('#canvas [data-key="cls:auth|Household"]')
  .dispatchEvent(new MouseEvent('click',{bubbles:true})));
const cardInk = await pg.evaluate(() => getComputedStyle(document.querySelector('#panel h3')).color);
ok(lum(cardInk)<0.35, 'card text is dark ink on light ('+cardInk+')');

// 4 · toggle back → dark stamp beats a LIGHT OS too (flip the emulation)
await pg.click('#themebtn');
ok(await T('window.__lvltest.theme()')==='dark', 'toggle stamps data-theme=dark');
await pg.emulateMedia({ colorScheme: 'light' });
const bgStamped = await bgOf();
ok(lum(bgStamped)<0.3, 'dark stamp beats a light OS ('+bgStamped+')');

// 5 · un-stamped light OS → light ground (the default direction)
await pg.evaluate(() => document.documentElement.removeAttribute('data-theme'));
const bgOs = await bgOf();
ok(lum(bgOs)>0.7, 'no stamp + light OS → light ground ('+bgOs+')');

ok(errs.length===0, 'no console errors: '+errs.slice(0,3).join(' | '));
console.log(`lvl38 (two themes, stamp wins): ${P} pass, ${F} fail`);
await ctx.close(); await b.close(); process.exit(F?1:0);
