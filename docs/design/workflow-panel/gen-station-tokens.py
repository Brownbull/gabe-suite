#!/usr/bin/env python3
"""gen-station-tokens.py — lift the Gabe Universe station's visual system into `_station.js`, by REGEX.

The endpoint lab draws in the station's own language (icons · kind colours · method/role/badge
colours · read/write chips · CSS variables · fonts). None of that may be retyped ("never hand-write a
station constant"): this script reads templates/center/shell/gabe-universe.html and copies the
literals out verbatim as `window.STATION`, so a station recolour reaches the lab on the next run.

    python3 docs/design/workflow-panel/gen-station-tokens.py        # writes _station.js beside this file

What it lifts (each a JS object literal copied byte-for-byte, or a CSS text block):
  GLYPH        the 17 kind glyphs (24×24 stroke paths)                 `var GLYPH={…}`
  P            the card's section icons (link · key · table · …)        `var P={…}` + `P.drill` `P.up`
  ICO          the pill icons (claim · table · shield · …)              `var ICO={…}`
  KINDS        the kind literal (col · form · type label · layer)       `var KINDS={…}`
  KINDCOL      ONE colour per kind                                      `var KINDCOL={…}`
  METHOD       HTTP method colours (+ BOOT · TASK)                      `var METHOD={…}`
  BADGE_COL    method · role · feclass · mclass … badge colours          `window.__BADGE_COL={…}`
  OPC          the journey matrix's OPERATION colours (read · write …)  `var _OPC={…}`
  RW           the matrix STORE chip colours r · w · rw (`.jdrw-*`)
  CONN         the wire colours per relation kind (hex ints → #hex)
  CSSVARS      the three `:root{…}` blocks (palette · surfaces · fonts)
  CARDCSS      the card chrome rules the lab reuses (.sec .sechd .kv .pchip .sublbl .tipico .ttag …)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
STATION = REPO / "templates" / "center" / "shell" / "gabe-universe.html"
OUT = HERE / "_station.js"


def literal_after(src: str, marker: str) -> str:
    """The balanced `{…}` object literal that follows `marker` (string-aware brace matching)."""
    i = src.index(marker)
    j = src.index("{", i)
    depth, q, k = 0, None, j
    while k < len(src):
        c = src[k]
        if q:
            if c == "\\":
                k += 2
                continue
            if c == q:
                q = None
        elif src.startswith("//", k):            # a line comment — an apostrophe in prose is not a string
            k = src.index("\n", k)
            continue
        elif src.startswith("/*", k):            # a block comment, same law
            k = src.index("*/", k) + 2
            continue
        elif c in "'\"`":
            q = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return src[j:k + 1]
        k += 1
    raise SystemExit(f"unbalanced literal after {marker!r}")


def main() -> int:
    src = STATION.read_text(encoding="utf-8")
    lifted: dict[str, str] = {}
    for name, marker in [("GLYPH", "var GLYPH="), ("P", "var P={ link:"), ("ICO", "var ICO={"),
                         ("KINDS", "var KINDS={"), ("KINDCOL", "var KINDCOL={"), ("METHOD", "var METHOD={"),
                         ("BADGE_COL", "window.__BADGE_COL={"), ("BADGE_DESC", "window.__BADGE_DESC={"),
                         ("OPC", "var _OPC={"), ("CONN", "var CONN={")]:
        lifted[name] = literal_after(src, marker)
    # the method/role badge PAINTER (canvas) — the function body, lifted as text; it reads window.__BADGE_COL,
    # which _station.js aliases to STATION.BADGE_COL so the painter runs unchanged
    badge_body = literal_after(src, "window.__badgeGlyph=function(c, kind, key)")
    p_extra = re.findall(r"^\s*P\.(\w+)=('(?:[^'\\]|\\.)*');", src, re.M)
    rw = dict(re.findall(r"\.jdrw-(r|w|rw)\{ background:(#[0-9a-f]{6}); \}", src))
    roots = re.findall(r"^\s*:root\{.*?\}\s*$", src, re.M | re.S)
    roots = [r for r in roots if "--bg" in r or "--surf" in r or "--font-ui" in r][:3]
    # the card chrome rules, selected by the classes the lab reuses (copied as written)
    want = (".pbody{", ".sec{", ".sechd{", ".sechd svg", ".ubar{", ".ufill{", ".sublbl{", ".kv{", ".pchip{", ".doc{",
            ".pchip.model", ".pchip.component", ".connbox .pchip", ".more{", ".tabbar{", ".tab{", ".tab .tabn",
            ".keycol{", ".pchip.st-pass", ".pchip.st-unknown", ".pchip.filecov", ".ttag{", ".ttag.structural",
            ".ttag.inferred", ".connbox .cinf", ".jmeta{", ".jmeta:hover", ".jfaces{", ".face{", ".face svg",
            ".face.fhome", ".tipico{", ".tipico .tip{", ".flagssec{", ".flagrow{", ".flagrow .flbl", ".flagrow.god",
            ".flagrow.warn", ".flagrow.ok", ".pnav{", ".pnav .pdot", ".pnav .pnl", ".pnav .pnm", ".pnav .pki",
            ".pnav .pdir", ".badgepop{", ".badgepop .bph", ".badgepop .bprow", ".badgepop .bpnote",
            ".jdcolpop{", ".jdcolpop .", "@keyframes lrfade",
            # the station's THEMED SCROLLBAR (narrow + dark, follows the theme) — the lab inherits it
            "*{ scrollbar-width", "::-webkit-scrollbar")
    card_css = []
    for line in src.splitlines():
        s = line.strip()
        if any(s.startswith(w) for w in want) and "{" in s:
            card_css.append(s)
    if not card_css:
        raise SystemExit("no card css lifted — the station's class names moved")
    sha = None
    try:
        import subprocess
        sha = subprocess.run(["git", "-C", str(REPO), "log", "-1", "--format=%h", "--", str(STATION)],
                             capture_output=True, text=True).stdout.strip()
    except Exception:
        pass
    out = ["/* GENERATED by gen-station-tokens.py from templates/center/shell/gabe-universe.html"
           + (f" (last touched {sha})" if sha else "") + " — never edit; re-run the generator. */",
           "var STATION = window.STATION = {};"]
    for name, lit in lifted.items():
        out.append(f"STATION.{name} = {lit};")
        if name == "GLYPH":
            out.append("var GLYPH = STATION.GLYPH;   // the ICO literal references GLYPH.* by its station-global name")
    for k, v in p_extra:
        out.append(f"STATION.P.{k} = {v};")
    out.append("window.__BADGE_COL = STATION.BADGE_COL; window.__BADGE_DESC = STATION.BADGE_DESC;")
    out.append("STATION.badgeGlyph = function(c, kind, key)" + badge_body + ";")
    out.append("STATION.RW = " + json.dumps({"r": rw.get("r"), "w": rw.get("w"), "rw": rw.get("rw")}) + ";")
    out.append("STATION.CSSVARS = " + json.dumps("\n".join(r.strip() for r in roots)) + ";")
    out.append("STATION.CARDCSS = " + json.dumps("\n".join(card_css)) + ";")
    out.append("STATION.hexOf = function(n){ return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); };")
    out.append("STATION.icon = function(name, size, col, cls){ var d = STATION.P[name] || STATION.GLYPH[name] || STATION.ICO[name] || ''; "
               "return '<svg class=\"ico ' + (cls || '') + '\" viewBox=\"0 0 24 24\" width=\"' + (size || 13) + '\" height=\"' + (size || 13) + "
               "'\" fill=\"none\" stroke=\"' + (col || 'currentColor') + '\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">' + d + '</svg>'; };")
    OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)}: " + " · ".join(f"{k} {len(v)}b" for k, v in lifted.items())
          + f" · P+{len(p_extra)} · rw {rw} · roots {len(roots)} · card css {len(card_css)} rules")
    return 0


if __name__ == "__main__":
    sys.exit(main())
