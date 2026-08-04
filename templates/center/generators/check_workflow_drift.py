#!/usr/bin/env python3
"""check_workflow_drift.py — is the workflow census still true?

The census (docs/site/center/workflows/<entity>.json) is an ACCUMULATOR: it
persists, its steps change status but never vanish. Its evidence half is
EPHEMERAL — captures on disk, cases in junit, fields in the schema. Drift is
the gap between the two, and it is mechanically computable, so nobody has to
remember it.

THREE CHECKS, all report-never-gate (D1). Exit 0 unless --strict.

  capture-debt   a step with no capture, or whose capture file is gone.
                 Closed by a green e2e run + /gabe-cc-update curate.
  claim-drift    a step naming a C-id that no longer runs, or a spec file that
                 no longer exists. THIS IS THE CLAIM SIDE the testing
                 accumulator has been missing: a claim nobody runs is a lie the
                 page tells confidently.
  census-lag     a writable model field that NO step writes. The census is
                 behind the code — usually a feature landed without covering
                 its own workflow.

Usage:
  check_workflow_drift.py <census.json> [--center DIR] [--archmap FILE]
                          [--junit GLOB] [--json] [--strict]

Every finding names the ONE command that closes it; a checker that reports a
problem without its next move just moves the thinking to the reader.
"""
from __future__ import annotations

import argparse
import glob
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

CID_RX = re.compile(r"(?<![A-Za-z0-9])C([0-9]{1,5})(?![0-9])")


def load(p: Path):
    try:
        return json.loads(p.read_text())
    except Exception as e:                       # a broken census is itself a finding
        print(f"census unreadable: {p} — {e}", file=sys.stderr)
        raise SystemExit(2)


def junit_cids(patterns: list[str]) -> set[str]:
    """Every C-id that actually RAN, from junit reports on disk."""
    found: set[str] = set()
    for pat in patterns:
        for f in glob.glob(pat, recursive=True):
            try:
                root = ET.parse(f).getroot()
            except Exception:
                continue                          # an unparsable report is not a claim
            for tc in root.iter("testcase"):
                name = f'{tc.get("classname", "")} {tc.get("name", "")}'
                found.update("C" + m.group(1) for m in CID_RX.finditer(name))
    return found


def model_fields(archmap: dict) -> set[str]:
    """Writable fields the code declares — `Model.field` and bare `field`.

    Reads `models` (name → {columns}) or `model_insight` (the A3 map). Returns
    EMPTY when neither carries a column inventory; the caller must then say the
    check was SKIPPED rather than report zero findings — a check that cannot
    fire must never look like a clean bill (E3)."""
    out: set[str] = set()
    src = archmap.get("models") or archmap.get("model_insight") or {}
    for name, m in src.items():
        cols = None
        if isinstance(m, dict):
            for key in ("columns", "fields", "props", "attrs"):
                if isinstance(m.get(key), list):
                    cols = m[key]
                    break
        for c in cols or []:
            col = c.get("name") if isinstance(c, dict) else str(c)
            if not col or col.startswith("_"):
                continue
            out.add(f"{name}.{col}")
            out.add(col)
    return out


def written_fields(states: dict) -> set[str]:
    out: set[str] = set()
    for s in states.values():
        for w in s.get("writes") or []:
            field = w[0] if isinstance(w, list) else str(w)
            lands = w[2] if isinstance(w, list) and len(w) > 2 else ""
            for tok in (field, lands):
                tok = re.sub(r"\s*\(.*?\)", "", str(tok)).strip()
                for part in re.split(r"[·,/]| → ", tok):
                    part = part.strip().rstrip("…").strip()
                    if part:
                        out.add(part)
                        out.add(part.split(".")[-1])
    return out


def check(census: dict, center: Path, archmap: dict | None, junit: list[str]) -> list[dict]:
    states = census.get("states") or {}
    findings: list[dict] = []

    ran = junit_cids(junit) if junit else set()
    try:                                          # tracked basenames, once
        tracked = {Path(f).name for f in subprocess.run(
            ["git", "ls-files"], capture_output=True, text=True, timeout=30
        ).stdout.split("\n") if f}
    except Exception:
        tracked = set()                           # no git ⇒ skip the spec check
    for sid, s in sorted(states.items()):
        if s.get("grp"):                          # section/link pills carry no evidence
            continue
        label = s.get("l", sid)

        shots = s.get("shot") or []
        if not shots:
            findings.append(dict(kind="capture-debt", step=sid, label=label,
                                 detail=f'no capture — {s.get("cap", "never")}',
                                 fix="run the e2e leg, then /gabe-cc-update curate"))
        else:
            for u in shots:
                if not (center / u).exists():
                    findings.append(dict(kind="capture-debt", step=sid, label=label,
                                         detail=f"capture file missing on disk: {u}",
                                         fix="re-curate the set (/gabe-cc-update curate)"))

        for cid in s.get("cids") or []:
            m = CID_RX.search(cid)
            if not m:
                continue
            norm = "C" + m.group(1)
            if ran and norm not in ran:
                findings.append(dict(kind="claim-drift", step=sid, label=label,
                                     detail=f"claims {norm}, which no junit report ran",
                                     fix="re-declare via /gabe-red, or correct the census"))

        # Spec resolution matches the tracked file list by BASENAME. Prefix
        # guessing (tests/… backend/…) produced false "missing" findings for
        # specs that exist — and a false gap is as dishonest as a false pass.
        spec = str(s.get("spec") or "")
        cand = spec.split()[0] if spec else ""
        if cand and "—" not in cand and re.search(r"\.(py|ts|tsx|mjs|js)$", cand):
            base = cand.split("/")[-1].split(":")[0]
            if tracked and base not in tracked:
                findings.append(dict(kind="claim-drift", step=sid, label=label,
                                     detail=f"spec file not in the repo: {base}",
                                     fix="point the step at its real spec"))

    if archmap:
        covered = written_fields(states)
        declared = model_fields(archmap)
        if not declared:
            findings.append(dict(kind="census-lag-skipped", step="—",
                                 label="census-lag NOT RUN",
                                 detail="the archmap carries no per-model column "
                                        "inventory, so 'which writable field does "
                                        "no step cover' is unanswerable here",
                                 fix="emit model columns into archmap.json "
                                     "(generator), then this check runs"))
        for f in sorted(declared):
            if "." not in f:
                continue
            if f in covered or f.split(".")[-1] in covered:
                continue
            findings.append(dict(kind="census-lag", step="—", label=f,
                                 detail="writable field no workflow step covers",
                                 fix="cover it in the entity's workflow (/gabe-cc-update)"))
    seen, unique = set(), []
    for f in findings:
        k = (f["kind"], f["label"], f["detail"])
        if k not in seen:
            seen.add(k); unique.append(f)
    return unique


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("census")
    ap.add_argument("--center", default="docs/site/center")
    ap.add_argument("--archmap")
    ap.add_argument("--junit", action="append", default=[])
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 when findings exist (default: report only, D1)")
    a = ap.parse_args()

    census = load(Path(a.census))
    archmap = load(Path(a.archmap)) if a.archmap and Path(a.archmap).exists() else None
    findings = check(census, Path(a.center), archmap, a.junit)

    if a.json:
        print(json.dumps(findings, indent=1))
    else:
        ent = census.get("entity", Path(a.census).stem)
        by: dict[str, list[dict]] = {}
        for f in findings:
            by.setdefault(f["kind"], []).append(f)
        n_steps = sum(1 for s in (census.get("states") or {}).values() if not s.get("grp"))
        print(f"workflow drift · {ent} · {n_steps} steps · "
              f"{len(census.get('workflows') or {})} workflows")
        if not findings:
            print("  clean — every step carries a capture, every claim runs, "
                  "every writable field is covered.")
        for kind in ("claim-drift", "capture-debt", "census-lag",
                     "census-lag-skipped"):
            rows = by.get(kind) or []
            if not rows:
                continue
            print(f"\n  {kind} ({len(rows)})")
            for f in rows[:12]:
                print(f"    · {f['label']}: {f['detail']}")
                print(f"      → {f['fix']}")
            if len(rows) > 12:
                print(f"    … and {len(rows) - 12} more")
    real = [f for f in findings if not f["kind"].endswith("-skipped")]
    return 1 if (real and a.strict) else 0


if __name__ == "__main__":
    raise SystemExit(main())
