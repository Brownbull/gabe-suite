"""Build-time Mermaid pre-render for the command center (stdlib + node).

A small standalone module so the center does not depend on a docsite builder.
Renders via the renderer named in center.config.json `paths.mermaid_renderer`
(Playwright + the project's vendored Mermaid UMD — no network), caches by
content hash under <center>/assets/mermaid/ (committed), and falls back to a
<pre> block so a diagram never crashes the build.
"""

from __future__ import annotations

import base64 as _b64
import hashlib as _hashlib
import html as _html
import subprocess as _subprocess

import _center_data as _cd

REPO_ROOT = _cd.REPO_ROOT
MERMAID_CACHE_DIR = _cd.CENTER_DIR / "assets" / "mermaid"
_MERMAID_RENDERER = REPO_ROOT / _cd._PATHS.get("mermaid_renderer",
                                               "scripts/_render_mermaid.mjs")


def _mermaid_svg(code: str) -> str:
    digest = _hashlib.sha1(code.encode("utf-8")).hexdigest()[:16]
    cache_file = MERMAID_CACHE_DIR / f"{digest}.svg"
    svg = ""
    if cache_file.exists():
        svg = cache_file.read_text(encoding="utf-8")
    else:
        try:
            payload = _b64.b64encode(code.encode("utf-8")).decode("ascii")
            result = _subprocess.run(
                ["node", str(_MERMAID_RENDERER), payload],
                cwd=str(REPO_ROOT), capture_output=True, text=True, timeout=120,
            )
            out = result.stdout.strip()
            if result.returncode == 0 and out.startswith("<svg"):
                svg = out
                MERMAID_CACHE_DIR.mkdir(parents=True, exist_ok=True)
                cache_file.write_text(svg, encoding="utf-8")
            else:
                print(f"  [mermaid] render failed ({digest}) -> <pre> fallback. "
                      f"stderr: {result.stderr.strip()[:200]}")
        except Exception as exc:  # noqa: BLE001 — a diagram must never crash the build
            print(f"  [mermaid] renderer unavailable ({digest}): {exc} -> <pre> fallback.")
    if not svg:
        return f'<pre class="mermaid-fallback"><code>{_html.escape(code, quote=False)}</code></pre>'
    return f'<figure class="mermaid-fig">{svg}</figure>'
