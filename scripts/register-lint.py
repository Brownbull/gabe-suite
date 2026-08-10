#!/usr/bin/env python3
"""register-lint.py — an OFFLINE scorer for a Gabe-register message.

This is NOT live enforcement — the model's chat output is not a file the harness
lints. It is a scorer you run on a PASTED message (file or stdin) to catch the
register's deterministically-checkable rules, and the fixture the battery fires
against. Live adherence stays on the re-injected register-core + the operator
calling drift out; the JUDGED dimensions (movement, one-term, honesty) live in
register-rubric.md, scored by a model, not here.

Checks (report-only — prints a per-rule verdict + the offending text):
  now_next     — a substantial message closes with NOW: and NEXT: lines
  next_one     — NEXT: names ONE move, not several joined by "and"/";"/"·"
  sentence_cap — no sentence runs past 30 words (the ASD-STE100 cap)
  no_recap     — no recap/pleasantry phrase ("hope this helps", "let me know", …)
  estimate     — a proposed build carries a cost estimate (soft)
Code fences are stripped before prose checks — code is not prose.

Usage: register-lint.py [message.md]   (stdin if no file)
Exit: 0 clean · 1 one or more flags (advisory — the register is report-never).
Battery: tests/register/run.sh.
"""
from __future__ import annotations

import re
import sys

RECAP = [
    "hope this helps", "hope that helps", "let me know", "feel free",
    "great question", "happy to help", "happy to clarify", "as an ai",
    "i hope this", "to answer your question",
]
OPENERS = re.compile(r"^\s*(let me\b|i'll\b|sure!|great,|certainly,|of course,)", re.I)
BUILD = re.compile(r"\b(land it|i'?ll (write|build|commit|wire)|commit \+ push|"
                   r"build (the|it)|then commit)\b", re.I)
ESTIMATE = re.compile(r"~\s*\d|\bmin\b|\bminutes\b|afternoon|\bhours?\b|"
                      r"\b\d+\s*files?\b|\bdoctor ~|\bCI ~", re.I)


def strip_code(text: str) -> str:
    text = re.sub(r"```.*?```", " ", text, flags=re.S)      # fenced blocks
    text = re.sub(r"`[^`]*`", " ", text)                    # inline code
    return text


def sentences(prose: str) -> list[str]:
    """Split into sentence-like UNITS. A line break, a bullet, and a NOW:/NEXT:
    label each START a fresh unit — the register's own terse, bulleted, often
    period-less voice must not collapse into one giant 'sentence' and false-trip
    the word cap (the check would then flag exactly the style it rewards)."""
    units: list[str] = []
    for line in prose.splitlines():
        line = re.sub(r"^\s*(?:[-*•]|\d+\.)\s+", "", line)     # bullet / numbered item
        line = re.sub(r"^\s*(NOW|NEXT):\s*", "", line, flags=re.I)
        line = line.strip()
        if not line:
            continue
        p = re.sub(r"(\d)\.(\d)", r"\1<dot>\2", line)          # protect decimals
        for ab in ("e.g.", "i.e.", "etc.", "vs.", "Dr.", "Mr."):
            p = p.replace(ab, ab.replace(".", "<dot>"))
        for part in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9(])", p):
            part = part.replace("<dot>", ".").strip()
            if part:
                units.append(part)
    return units


def wordcount(s: str) -> int:
    # count real words, not markdown bullets / list glyphs / link syntax
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)          # [text](url) → text
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'/–-]*", s))


def lint(text: str) -> tuple[list[tuple[str, bool, str]], bool]:
    prose = strip_code(text)
    results: list[tuple[str, bool, str]] = []
    substantial = len(text) > 400 or text.count("\n") > 6

    # now_next
    has_now = re.search(r"(?m)^\s*NOW:", text) is not None
    has_next = re.search(r"(?m)^\s*NEXT:", text) is not None
    if substantial:
        ok = has_now and has_next
        results.append(("now_next", ok,
                        "" if ok else "substantial message missing a NOW:/NEXT: close"))

    # next_one — the NEXT: line should name ONE move
    m = re.search(r"(?m)^\s*NEXT:\s*(.+)$", text)
    if m:
        nxt = m.group(1)
        joins = len(re.findall(r"\band\b|;|·|,\s+then\b", nxt, re.I))
        cmds = len(re.findall(r"/[a-z][\w-]+", nxt))
        ok = joins <= 1 and cmds <= 2
        results.append(("next_one", ok,
                        "" if ok else f"NEXT: names several moves ({joins} joins, {cmds} commands)"))

    # sentence_cap
    long_s = [(s, wordcount(s)) for s in sentences(prose) if wordcount(s) > 30]
    results.append(("sentence_cap", not long_s,
                    "" if not long_s else "; ".join(f'{n}w: "{s[:60]}…"' for s, n in long_s[:3])))

    # no_recap — closing pleasantries. Exclude NOW:/NEXT: lines: a handoff can
    # legitimately say "let me know when CI passes" there without it being a recap.
    scan = "\n".join(ln for ln in prose.splitlines()
                     if not re.match(r"\s*(NOW|NEXT):", ln, re.I)).lower()
    hits = [r for r in RECAP if r in scan]
    if OPENERS.search(text):
        hits.append("pleasantry opener")
    results.append(("no_recap", not hits, "" if not hits else ", ".join(hits)))

    # estimate — ADVISORY (soft): a proposed build should carry a cost, but a miss
    # is a nudge, not a fail (kept out of `clean` below).
    if BUILD.search(text):
        ok = ESTIMATE.search(text) is not None
        results.append(("estimate", ok,
                        "" if ok else "a proposed build with no operator-felt cost estimate (advisory)"))

    # `clean` gates on the hard rules only — estimate is advisory.
    clean = all(ok for name, ok, _d in results if name != "estimate")
    return results, clean


def main() -> int:
    text = (open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1
            else sys.stdin.read())
    results, clean = lint(text)
    print("REGISTER LINT")
    n_ok = 0
    for name, ok, detail in results:
        n_ok += ok
        print(f"  {'✓' if ok else '⚠'} {name}" + (f" — {detail}" if detail else ""))
    print(f"score: {n_ok}/{len(results)} clean")
    return 0 if clean else 1


if __name__ == "__main__":
    sys.exit(main())
