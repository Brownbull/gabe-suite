#!/usr/bin/env python3
"""Link + integrity gate for the Gabe Suite's own command center.

    python3 docs/center/generators/check_suite_center.py [<center-dir>]

The forked `check_center_links.py` resolves its target through the standard
center's `center.config.json` schema, which this center does not use. So the
suite center carries its own gate rather than a contorted call into one built
for a different config.

    exit 0 — every internal link, anchor and asset resolves
    exit 1 — at least one is dead
    exit 2 — the run was vacuous (no pages found), which proves nothing

That last one is the point: a checker that passes because it looked at nothing
is worse than no checker, because it reports green.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

GEN_DIR = Path(__file__).resolve().parent
CENTER_DIR = GEN_DIR.parent
REPO_ROOT = CENTER_DIR.parent.parent

HREF_RX = re.compile(r'href="([^"]+)"')
SRC_RX = re.compile(r'(?:src|href)="([^"]+\.(?:css|js|png|svg|jpg|webp))"')
ID_RX = re.compile(r'\sid="([^"]+)"')
EXTERNAL = ("http://", "https://", "mailto:", "data:", "//")


def main(argv: list[str]) -> int:
    if len(argv) > 1:
        target = Path(argv[1]).expanduser().resolve()
    else:
        import json
        cfg = json.loads((CENTER_DIR / "suite-center.config.json").read_text())
        target = (REPO_ROOT / cfg["paths"]["center"]).resolve()

    if not target.is_dir():
        print(f"  gate: {target} is not a directory — nothing to check")
        return 2

    pages = {p.name: p.read_text(errors="replace")
             for p in sorted(target.glob("*.html"))}
    if not pages:
        print(f"  crawl gate: 0 pages under {target} — an empty crawl proves "
              f"nothing; refusing the vacuous pass")
        return 2

    ids: dict[str, set[str]] = {n: set(ID_RX.findall(t)) for n, t in pages.items()}
    dead: list[str] = []
    checked = 0

    for name, text in pages.items():
        for href in HREF_RX.findall(text):
            if href.startswith(EXTERNAL) or not href.strip():
                continue
            checked += 1
            page_part, _, frag = href.partition("#")
            # A deep link carries a filter: `enforcement.html?bucket=X#sec-x`.
            # The query selects rows on arrival; it is not part of the filename,
            # so it is stripped before the file is resolved. Without this the
            # gate reported every filtered link as dead.
            page_part, _, query = page_part.partition("?")
            page_part = page_part or name

            if page_part != name and not (target / page_part).exists():
                dead.append(f"{name}: dead link -> {href}")
                continue
            if frag:
                pool = ids.get(page_part, set())
                if frag not in pool:
                    dead.append(f"{name}: dead anchor -> {href}")

        for asset in SRC_RX.findall(text):
            if asset.startswith(EXTERNAL):
                continue
            checked += 1
            if not (target / asset).exists():
                dead.append(f"{name}: missing asset -> {asset}")

    # An unfilled shell token means the generator did not own a slot it claimed.
    #
    # Only tokens the SHELL actually declares count. A naive `\{\{[A-Z_]+\}\}`
    # sweep flags page CONTENT too — the functions lens renders a docstring that
    # literally says "slot NAMES (they contain {{TOKEN}})", which is correctly
    # escaped and displays as text, not an unfilled slot.
    shell_dir = CENTER_DIR / "shell"
    declared: set[str] = set()
    if shell_dir.is_dir():
        for tpl in shell_dir.glob("*.html"):
            declared |= set(re.findall(r"\{\{[A-Z_]+\}\}",
                                       tpl.read_text(errors="replace")))
    for name, text in pages.items():
        for tok in sorted(declared):
            if tok in text:
                dead.append(f"{name}: unfilled shell token {tok}")

    print(f"  pages {len(pages)} · references checked {checked}")
    if dead:
        for d in dead:
            print(f"  DEAD  {d}")
        print(f"  gate: {len(dead)} broken reference(s)")
        return 1
    print("  gate: all internal references resolve")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
