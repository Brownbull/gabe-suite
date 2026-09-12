#!/usr/bin/env python3
"""Print the local files a station page loads, one per line — export-universe.sh's shipping list.

DERIVED, never a roster. The export shipped a hardcoded five scripts + two bundles while the
station also referenced `sim.data.js` and `assets/gabe-icon.png`, so the first bundle 404'd twice
on open — invisibly, because a feed loader's onerror is swallowed and a missing icon merely looks
wrong. Reading the page's own `src=`/`href=` attributes means a reference added upstream ships
without anyone remembering this script exists.

`.html` siblings are EXCLUDED: those are the center's other 20 pages, deliberately not shipped —
the exporter makes their links inert instead.
"""
import re
import sys
import pathlib

_REF = re.compile(r'(?:src|href)="(?!https?:|//|#|data:|mailto:)([^"]+)"')


def refs(html: str) -> list[str]:
    out: list[str] = []
    for m in _REF.finditer(html):
        ref = m.group(1).split("?")[0].split("#")[0].lstrip("./")
        if not ref or ref.endswith(".html") or ref.startswith("/") or ".." in ref:
            continue
        if ref not in out:
            out.append(ref)
    return out


if __name__ == "__main__":
    print("\n".join(refs(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))))
