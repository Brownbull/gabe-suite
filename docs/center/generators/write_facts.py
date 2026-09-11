#!/usr/bin/env python3
"""write_facts.py — run every battery and RECORD the run as data/facts.json.

The suite centre's Testing station (and the Assertions tile on the overview)
reads assertion counts, pass/fail and "what it protects" from
docs/center/data/facts.json. Until 2026-09-10 that file was AUTHORED once
(2026-07-26, nine batteries, 258 assertions) and never touched again while the
battery estate grew to forty-five — the tile read a July number beside a
September inventory. This script is the writer: it runs the batteries the way
suite-doctor's G3 sweep does (every tests/*/run.sh, serially, the doctor's own
exclusions honoured) and records what each printed.

    python3 docs/center/generators/write_facts.py               # every battery (≈ 5½ min, serial)
    python3 docs/center/generators/write_facts.py --only hooks,register
    python3 docs/center/generators/write_facts.py --dry-run     # run + print, write nothing

What is DERIVED per battery (never hand-typed again):
  assertions · failures   the battery's own summary line(s) — `N passed, M failed`,
                          `N ok, M fail`, summed when a battery prints several;
                          a battery that prints only `ALL PASS` gets its PASS/ok
                          lines counted, or null when it prints no countable line
  status                  GREEN (exit 0) · RED (non-zero) · EXCLUDED (the doctor
                          skips it by name — never run here either)
  protects                the header comment's first paragraph (the battery's own
                          statement of its contract)
  proves_fire / _silent   the battery's own claim, read from its whole text — run.sh
                          plus the sibling *.py/*.mjs/*.sh a thin wrapper delegates to
                          (header + case labels): fires/detects/mutation-proven is a fire
                          claim, silent/never false-fires/honest-empty a silence claim
                          (the suite rule is that every battery states both; one
                          that does not is shown as "not recorded" — honest)
  beat                    the skill the battery names most often → the config's
                          beat; a centre-generator battery → center; else the
                          previous record's beat; else cross-cutting
  note                    the doctor's own wording when a green run SKIPPED
                          coverage (no chrome / ts on this host), or the
                          exclusion reason

What is CARRIED from the existing file (authored, not derivable):
  hooks                   the hand-probed hook records (a hook is probed against
                          stdin payloads in a hermetic repo — a different
                          instrument; unchanged since 2026-07-26)
  uncovered               the gates-with-no-battery list — minus any entry whose
                          text says `no tests/<x>/run.sh exists` when that
                          battery now does exist (the one automatic prune)

--only re-runs the named batteries and carries every other battery record
over from the existing file, so a single-battery refresh costs seconds, not
minutes. Every executed record carries its OWN `run_at` + `run_head`; the file
stamp (`generated`, `head`, `dirty`) is the latest run's, and `method` says
"partial refresh" naming what was re-run when --only was used.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _suite_data as D  # noqa: E402

REPO = D.REPO_ROOT
BATTERY_TIMEOUT_S = 900

_COUNT_RX = [
    re.compile(r"(\d+) passed, (\d+) failed"),
    re.compile(r"(\d+) ok, (\d+) fail\b"),
]
_PASS_LINE_RX = re.compile(r"^\s*(?:PASS|ok|✓)\b", re.M)
_SKIP_RX = re.compile(r"SKIP ⚠|DID NOT RUN|SKIPPED-COVERAGE", re.I)
_SKILL_RX = re.compile(r"skills/(gabe-[a-z0-9-]+)")
_CENTER_RX = re.compile(r"templates/center|docs/center|center\.config\.json|build_center_a3")
# The battery's own claims, read from its whole text (header + case labels): a case that says it FIRES /
# DETECTS a defect or was MUTATION-proven is a fire claim; one that says it stays SILENT / never false-fires
# / reads honest-empty is a silence claim. A battery that says neither is shown "not recorded" — honest.
_FIRE_RX = re.compile(r"\b(?:fire|fires|firing|fired|detect|detects|detected|mutation|mutant|can fail|proven to fail)\b", re.I)
_SILENT_RX = re.compile(r"\b(?:silent|silence|silently|never fires?|no false|false[- ]fire|honest[- ]empty|stays? quiet)\b", re.I)
_UNCOVERED_PRUNE_RX = re.compile(r"no tests/([a-z0-9_-]+)/run\.sh exists")


def header_paragraph(run: Path) -> str:
    """The first comment paragraph after the shebang — the battery's own
    statement of what it protects. Stops at the first blank `#` line or the
    first non-comment line."""
    out: list[str] = []
    for i, line in enumerate(run.read_text(errors="replace").splitlines()):
        if i == 0 and line.startswith("#!"):
            continue
        if not line.startswith("#"):
            break
        body = line.lstrip("#").strip()
        if not body:
            if out:
                break
            continue
        out.append(body)
    return re.sub(r"\s+", " ", " ".join(out)).strip()


def parse_counts(out: str) -> tuple[int | None, int]:
    """(assertions, failures) from the battery's own summary line(s)."""
    passed = failed = 0
    seen = False
    for rx in _COUNT_RX:
        for m in rx.finditer(out):
            passed += int(m.group(1))
            failed += int(m.group(2))
            seen = True
    if seen:
        return passed + failed, failed
    if "ALL PASS" in out:
        n = len(_PASS_LINE_RX.findall(out))
        return (n or None), 0
    return None, 0


def run_battery(run: Path) -> tuple[int, str, float]:
    t0 = time.monotonic()
    try:
        p = subprocess.run(["bash", str(run)], cwd=REPO, capture_output=True,
                           text=True, errors="replace", timeout=BATTERY_TIMEOUT_S)
        rc, out = p.returncode, p.stdout + p.stderr
    except subprocess.TimeoutExpired as e:
        rc = 124
        out = ((e.stdout or b"").decode(errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")) \
            + f"\nTIMEOUT after {BATTERY_TIMEOUT_S}s"
    return rc, out, time.monotonic() - t0


def beat_for(src: str, prev: dict | None, beats: dict[str, str]) -> str:
    """The beat of the skill the battery names most often; a centre-generator
    battery is the centre beat; else the previous record's; else cross-cutting."""
    from collections import Counter
    mentions = Counter(m for m in _SKILL_RX.findall(src) if m in beats)
    if mentions:
        return beats[mentions.most_common(1)[0][0]]
    if _CENTER_RX.search(src):
        return "center"
    if prev and prev.get("beat"):
        return prev["beat"]
    return "cross-cutting"


def battery_text(run: Path) -> str:
    """run.sh plus the sibling *.py / *.mjs / *.sh it delegates to (tests/gabe-map/run.sh runs
    checks.py; tests/evidence-nav/run.sh runs cases.mjs) — the case labels live there. Fixture
    subdirectories are not scanned."""
    parts = [run.read_text(errors="replace")]
    for sib in sorted(run.parent.iterdir()):
        if sib != run and sib.is_file() and sib.suffix in (".py", ".mjs", ".sh"):
            parts.append(sib.read_text(errors="replace"))
    return "\n".join(parts)


def record_for(b: dict, prev: dict | None, beats: dict[str, str],
               run_it: bool) -> dict:
    run = REPO / b["path"]
    header = header_paragraph(run)
    src = battery_text(run)
    rec = {
        "name": b["name"],
        "beat": beat_for(src, prev, beats),
        "assertions": 0,
        "failures": 0,
        "status": "EXCLUDED",
        "protects": header,
        "proves_fire": bool(_FIRE_RX.search(src)),
        "proves_silent": bool(_SILENT_RX.search(src)),
    }
    if not b["in_g3"]:
        rec["note"] = f"Excluded from the doctor's G3 sweep: {b['excluded_reason'] or 'by name'}. Not run."
        return rec
    if not run_it:
        # --only: carry the previous record's run fields, refresh the derived ones.
        if prev:
            for k in ("assertions", "failures", "status", "note", "rc", "seconds", "run_at", "run_head"):
                if k in prev:
                    rec[k] = prev[k]
            return rec
        rec["status"] = "NOT RUN"
        rec["note"] = "no recorded run yet — run write_facts.py without --only"
        return rec
    print(f"  {b['name']:<24}", end="", flush=True)
    rc, out, secs = run_battery(run)
    n, failures = parse_counts(out)
    rec["assertions"] = n if n is not None else 0
    rec["failures"] = failures
    rec["status"] = "GREEN" if (rc == 0 and not failures) else "RED"   # failures reported at exit 0 are RED too (review 2026-09-11)
    rec["rc"] = rc
    rec["seconds"] = round(secs, 1)
    rec["run_at"] = _dt.date.today().isoformat()
    rec["run_head"] = D.head_sha()[:7]
    skip = _SKIP_RX.search(out)
    if rc == 0 and skip:
        line = next((ln.strip() for ln in out.splitlines() if _SKIP_RX.search(ln)), "")
        rec["note"] = f"passed but SKIPPED coverage: {line}"
    elif rc != 0:
        tail = [ln for ln in out.splitlines() if ln.strip()][-6:]
        rec["note"] = "FAILING — last lines: " + " | ".join(ln.strip() for ln in tail)
    elif failures:
        rec["note"] = f"exit 0 but {failures} failure(s) reported — the battery is swallowing its own exit code"
    if n is None:
        rec["note"] = (rec.get("note", "") + " · no countable summary line (assertions unknown)").strip(" ·")
    flag = "" if rc == 0 else f"  rc={rc}"
    cnt = f"{n} asserts" if n is not None else "no count"
    print(f"{rec['status']:<6} {cnt:>12}  {secs:6.1f}s{flag}", flush=True)
    return rec


def prune_uncovered(uncovered: list[str], present: set[str]) -> list[str]:
    kept: list[str] = []
    for u in uncovered:
        m = _UNCOVERED_PRUNE_RX.search(u)
        if m and m.group(1) in present:
            print(f"  uncovered: dropped the entry that said no tests/{m.group(1)}/run.sh exists — it does now")
            continue
        kept.append(u)
    return kept


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--only", default="", help="comma-separated battery names to re-run; others carry over")
    ap.add_argument("--dry-run", action="store_true", help="run and print, write nothing")
    a = ap.parse_args()

    cfg = D.load_config()
    beats = D.beat_of_skill(cfg)
    batteries = D.scan_batteries(cfg)
    if not batteries:
        print("no tests/*/run.sh found", file=sys.stderr)
        return 2
    out_path = D.rel(cfg, "data") / "facts.json"
    existing: dict = {}
    if out_path.is_file():
        try:
            existing = json.loads(out_path.read_text())
        except json.JSONDecodeError as e:
            print(f"existing {out_path.relative_to(REPO)} is unparseable ({e}); starting from empty", file=sys.stderr)
    prev = {r.get("name"): r for r in existing.get("batteries", [])}
    only = {s.strip() for s in a.only.split(",") if s.strip()}
    unknown = only - {b["name"] for b in batteries}
    if unknown:
        print(f"--only names no battery: {', '.join(sorted(unknown))}", file=sys.stderr)
        return 2

    print(f"write_facts: {len(batteries)} batteries under {cfg['paths']['tests']}/ "
          f"({'only ' + ', '.join(sorted(only)) if only else 'all'}; serial)")
    records = [record_for(b, prev.get(b["name"]), beats, run_it=(not only or b["name"] in only))
               for b in sorted(batteries, key=lambda x: x["name"])]

    ran = [r for r in records if "rc" in r and (not only or r["name"] in only)]   # invoked THIS run
    carried = [r["name"] for r in records if "rc" in r and r["name"] not in {x["name"] for x in ran}]
    scope = ("every tests/*/run.sh executed serially" if not only else
             f"PARTIAL refresh — {len(ran)} of {len(records)} re-run ({', '.join(sorted(r['name'] for r in ran))}); "
             f"the other {len(carried)} carried from their own run_at/run_head stamps")
    total = sum(r["assertions"] for r in records)
    red = [r["name"] for r in records if r["status"] == "RED"]
    unknown_count = [r["name"] for r in records if "rc" in r and "assertions unknown" in r.get("note", "")]
    dirty = D.working_tree_dirty()
    facts = {
        "generated": _dt.date.today().isoformat(),
        "head": D.head_sha()[:7],
        "dirty": bool(dirty),
        "method": (
            f"batteries: {scope} by docs/center/generators/write_facts.py "
            "with the doctor's G3 exclusions honoured; assertions + failures parsed from each battery's own "
            "summary line (failures > 0 is RED even at exit 0), `protects` from its header comment, FIRE/SILENT "
            "from the battery's own text (run.sh + the siblings it delegates to). "
            "hooks: probed by hand 2026-07-26 (each hook executed in a hermetic temp repo against realistic "
            "stdin payloads) — a different instrument, carried as recorded."
        ),
        "hooks": existing.get("hooks", []),
        "batteries": records,
        "uncovered": prune_uncovered(existing.get("uncovered", []), {b["name"] for b in batteries}),
    }
    print(f"\n{len(ran)} run · {total} assertions across {len(records)} batteries · "
          f"{len(red)} red{(' (' + ', '.join(red) + ')') if red else ''}"
          + (f" · no count for {', '.join(unknown_count)}" if unknown_count else "")
          + f" · head {facts['head']}{' DIRTY' if dirty else ''}")
    if a.dry_run:
        print("dry-run: nothing written")
        return 1 if red else 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(facts, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out_path.relative_to(REPO)}")
    return 1 if red else 0


if __name__ == "__main__":
    sys.exit(main())
