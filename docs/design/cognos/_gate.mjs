// _gate.mjs — route the gabe-artifact gates to SYSTEM Chrome (the bundled chromium crashes on this WSL
// machine — memory: artifact-gate-chromium-wsl). run: node _gate.mjs <abs-gate-path> <abs-html-path>
import { chromium } from '/home/khujta/.claude/skills/gabe-docsite/tools/_playwright.mjs';
const orig = chromium.launch.bind(chromium);
chromium.launch = (o = {}) => orig({ ...o,
  executablePath: '/usr/bin/google-chrome-stable',
  args: [ ...(o.args || []), '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--use-gl=swiftshader' ] });
const gate = process.argv[2], html = process.argv[3];
process.argv = [process.argv[0], gate, html];
await import(gate);
