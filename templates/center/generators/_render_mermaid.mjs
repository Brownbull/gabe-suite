// Build-time Mermaid -> static SVG renderer (gastify binding of the gustify
// reference). Loads the project's VENDORED Mermaid UMD bundle (no network, no
// CDN) in a headless page, calls mermaid.render, writes the SVG to stdout.
// Used by _center_mermaid.py to pre-render card diagrams so the center pages
// need zero runtime JS (works under file://).
// Usage: node scripts/_render_mermaid.mjs <base64-code>
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mermaidPath = path.join(here, '..', 'docs', 'site', 'assets', 'mermaid.min.js');

const code = Buffer.from(process.argv[2], 'base64').toString('utf8');
const b = await chromium.launch();
try {
  const pg = await (await b.newContext()).newPage();
  await pg.setContent('<!doctype html><html><body></body></html>');
  await pg.addScriptTag({ path: mermaidPath });
  const svg = await pg.evaluate(async (code) => {
    window.mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base', flowchart: { htmlLabels: true, curve: 'basis' },
      themeVariables: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        background: '#faf6ef', primaryColor: '#f3ede1', primaryBorderColor: '#b65a2b',
        primaryTextColor: '#1b1a17', lineColor: '#8a7f6a', secondaryColor: '#eadfce',
        tertiaryColor: '#f7f2ea', fontSize: '15px',
      },
    });
    const { svg } = await window.mermaid.render('m0', code);
    return svg;
  }, code);
  process.stdout.write(svg);
} finally { await b.close(); }
