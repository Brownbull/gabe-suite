#!/usr/bin/env python3
"""plain-audit.py — every hover description in a lab page against the plain-mode rules (gabe-lens references/lens-spec.md §Plain;
operator ruling 2026-09-17: hover descriptions are plain lines): ONE sentence · a concrete noun first · at most one em dash ·
no colon/semicolon chaining · never the label restated. Reads `plain:` · `lg:` · `happens:` string fields.

    python3 docs/design/workflow-panel/plain-audit.py docs/design/workflow-panel/{arrange-lab.html,_lab-ep-panels.js,endpoint-lab.html}

Prints each failing line with the rule it breaks and a count per file; exit 1 when anything fails."""

import re, sys
from pathlib import Path
files = sys.argv[1:]
KEYS = r'(?:plain|lg|happens)'
for f in files:
    src = Path(f).read_text(encoding="utf-8")
    n = 0
    for m in re.finditer(KEYS + r'"?\s*:\s*"((?:[^"\\]|\\.)*)"', src):   # `plain: "…"` in JS and `"plain": "…"` in JSON
        s = m.group(1); line = src.count("\n", 0, m.start()) + 1
        bad = []
        body = re.sub(r'\.\.\.|…', '', s)
        if len(re.findall(r'[.!?]\s+[A-Z(]', body)) >= 1: bad.append("two sentences")
        if s.count("—") > 1: bad.append("two dashes")
        if ";" in s or re.search(r':\s', s): bad.append("colon/semicolon chain")
        if re.match(r'^(the )?(tile|panel|option|dial|button|card)\b', s.strip().lower()) and "—" not in s: bad.append("opens with the type name")
        if len(s) > 150: bad.append(f"long ({len(s)})")
        if re.match(r'^(you|it|this|that|when|if|reads|lives|what|press|shows|draws)\b', s.strip().lower()): bad.append("no concrete noun first")
        if bad: n += 1; print(f"{f}:{line}: [{' · '.join(bad)}] {s[:130]}")
    print(f"-- {f}: {n} lines to rewrite"); TOTAL = globals().get("TOTAL", 0) + n; globals()["TOTAL"] = TOTAL
sys.exit(1 if globals().get("TOTAL") else 0)
