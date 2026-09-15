#!/usr/bin/env python3
"""Element forms — the §A2 goldens as DATA, checked against a built feed (amendment 1 §A4 step 1).

usage: python3 check-goldens.py <forms.json> [--target gustify] [--slice 3b] [--only <id>] [--quiet] [--chains]

Read-only: it writes nothing, generates nothing and is no surface. For every golden in ``expected.json`` it walks the feed
by the golden's ``get`` path and prints one line — MATCH · MISMATCH (what the feed says) · MISSING (where the path stopped).
``--chains`` prints each generated path of ``POST /setup/complete`` and each chain row of ``RequireSetup`` as an ordered
chain beside the drawn rows of ``docs/design/logic-map/shallow-logic-maps.html`` (PATHS_API · PATHS_WEB), which are read
from that page, never restated here.

A golden's ``mark`` is the amendment's: V verified in source · R read · P projected · U unknown until measured.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DRAWN = HERE.parent.parent / "logic-map" / "shallow-logic-maps.html"
ROW_RX = re.compile(r'\{\s*k:\s*"(\w+)",\s*n:\s*"([^"]*)",\s*when:\s*"([^"]*)",\s*exit:\s*\[\s*"([^"]*)"')


def walk(node, steps: list):
    """(found, value, stopped_at) — a step is a key, an index, {"where": {...}} / {"where_not": {...}}, {"values": true}, {"pluck": k}, {"first": true} or {"sorted": true}."""
    cur = node
    for i, step in enumerate(steps):
        where = f"step {i} ({step!r})"
        if isinstance(step, str):
            if not isinstance(cur, dict) or step not in cur:
                return False, None, where
            cur = cur[step]
        elif isinstance(step, int):
            if not isinstance(cur, list) or len(cur) <= step:
                return False, None, where
            cur = cur[step]
        elif isinstance(step, dict) and "where" in step:
            if not isinstance(cur, list):
                return False, None, where
            cur = [x for x in cur if isinstance(x, dict) and all(_match(x.get(k), v) for k, v in step["where"].items())]
        elif isinstance(step, dict) and "where_not" in step:
            if not isinstance(cur, list):
                return False, None, where
            cur = [x for x in cur if not (isinstance(x, dict) and all(_match(x.get(k), v) for k, v in step["where_not"].items()))]
        elif isinstance(step, dict) and step.get("values"):
            if not isinstance(cur, dict):
                return False, None, where
            cur = [cur[k] for k in sorted(cur)]
        elif isinstance(step, dict) and "pluck" in step:
            if not isinstance(cur, list):
                return False, None, where
            cur = [x.get(step["pluck"]) if isinstance(x, dict) else None for x in cur]
        elif isinstance(step, dict) and step.get("first"):
            if not isinstance(cur, list) or not cur:
                return False, None, where
            cur = cur[0]
        elif isinstance(step, dict) and step.get("sorted"):
            cur = sorted(cur, key=lambda v: json.dumps(v, sort_keys=True, default=str))
        elif isinstance(step, dict) and step.get("keys"):
            cur = sorted(cur) if isinstance(cur, dict) else cur
        else:
            return False, None, f"step {i}: unknown selector {step!r}"
    return True, cur, None


def _match(got, want) -> bool:
    if isinstance(want, str) and want.startswith("~"):
        return isinstance(got, str) and want[1:] in got
    return got == want


def verdict(g: dict, value) -> tuple[bool, str]:
    if "eq" in g:
        return value == g["eq"], json.dumps(value, sort_keys=True, default=str)
    if "len" in g:
        return (hasattr(value, "__len__") and len(value) == g["len"]), f"len {len(value) if hasattr(value, '__len__') else '?'}"
    if "gte" in g:
        return (isinstance(value, (int, float)) and value >= g["gte"]), json.dumps(value, default=str)
    if "has" in g:
        want = g["has"]
        if isinstance(value, str):
            return all(w in value for w in ([want] if isinstance(want, str) else want)), value[:160]
        if isinstance(value, list):
            blob = json.dumps(value, sort_keys=True, default=str)
            return all((w in blob) if isinstance(w, str) else (w in value) for w in ([want] if not isinstance(want, list) else want)), blob[:200]
        if isinstance(value, dict):
            return all(w in value for w in ([want] if isinstance(want, str) else want)), json.dumps(value, sort_keys=True, default=str)[:200]
        return False, json.dumps(value, default=str)[:160]
    if "exists" in g:
        return (value is not None) == bool(g["exists"]), json.dumps(value, default=str)[:120]
    return False, "no comparison in the golden"


def _drawn(name: str) -> list:
    """The drawn rows of one path list in shallow-logic-maps.html (PATHS_API · PATHS_WEB), read from that page."""
    if not DRAWN.is_file():
        return []
    text = DRAWN.read_text(encoding="utf-8")
    i = text.find(f"var {name} = [")
    if i < 0:
        return []
    return ROW_RX.findall(text[i: text.find("];", i)])


def chains(forms: dict, out) -> None:
    e = (forms.get("endpoints") or {}).get("endpoint:POST /setup/complete") or {}
    print("\n── POST /setup/complete · generated paths", file=out)
    for p in e.get("paths") or []:
        steps = [s.get("t") or s.get("kind") or s.get("k") or "?" for s in (p.get("chain") or []) if isinstance(s, dict)]
        print(f"   {str(p.get('status')):>4} {p.get('state', ''):<8} {' · '.join(str(x) for x in steps)[:150]}", file=out)
    print("   drawn (shallow-logic-maps.html PATHS_API):", file=out)
    for _k, n, when, exit_ in _drawn("PATHS_API"):
        print(f"      {exit_:>4}  {n} — {when[:80]}", file=out)
    fr = forms.get("frontend") or {}
    guard = next((v for k, v in (fr.get("pieces") or {}).items() if k.endswith("#RequireSetup")), None)
    if guard:
        by_id = {x["id"]: x for piece in (fr.get("pieces") or {}).values() for x in piece.get("exits") or []}
        print("\n── RequireSetup · generated chain rows", file=out)
        for row in guard.get("chain") or []:
            x = by_id.get(row.get("exit")) or {}
            print(f"   through {len(row.get('through') or [])} · {row.get('guard', '').rsplit('#', 1)[-1]:<22} {x.get('kind', '?'):<7} "
                  f"{x.get('to') or x.get('tag') or ''}{' · effect ' + row['effect'] if row.get('effect') else ''}", file=out)
        print("   drawn (shallow-logic-maps.html PATHS_WEB):", file=out)
        for _k, n, when, exit_ in _drawn("PATHS_WEB"):
            print(f"      {exit_:>12}  {n} — {when[:80]}", file=out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("forms")
    ap.add_argument("--target", default=None)
    ap.add_argument("--slice", default=None)
    ap.add_argument("--only", default=None)
    ap.add_argument("--quiet", action="store_true", help="print only mismatches and missing")
    ap.add_argument("--chains", action="store_true")
    a = ap.parse_args()
    forms = json.load(open(a.forms, encoding="utf-8"))
    spec = json.load(open(HERE / "expected.json", encoding="utf-8"))
    target = a.target or spec.get("target", "gustify")
    tally = {"MATCH": 0, "MISMATCH": 0, "MISSING": 0, "SKIP": 0}
    for g in spec["goldens"]:
        if (a.slice and g.get("slice") != a.slice) or (a.only and g["id"] != a.only):
            continue
        if g.get("target", target) != target:
            tally["SKIP"] += 1
            continue
        found, value, stopped = walk(forms, g["get"])
        if not found:
            tally["MISSING"] += 1
            print(f"MISSING  [{g['slice']:>3} {g['mark']}] {g['id']}: {g['says']}  ← {stopped}")
            continue
        ok, got = verdict(g, value)
        tally["MATCH" if ok else "MISMATCH"] += 1
        if ok and not a.quiet:
            print(f"MATCH    [{g['slice']:>3} {g['mark']}] {g['id']}: {g['says']}")
        elif not ok:
            print(f"MISMATCH [{g['slice']:>3} {g['mark']}] {g['id']}: {g['says']}\n            feed says {got}")
    if a.chains:
        chains(forms, sys.stdout)
    print(f"\ngoldens on {target}: {tally['MATCH']} match · {tally['MISMATCH']} mismatch · {tally['MISSING']} missing · {tally['SKIP']} other targets")
    return 1 if tally["MISMATCH"] or tally["MISSING"] else 0


if __name__ == "__main__":
    sys.exit(main())
