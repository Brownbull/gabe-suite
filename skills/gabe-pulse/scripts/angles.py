#!/usr/bin/env python3
"""ANGLE signals — which satellite would find something, right now.

    python3 angles.py [<repo-root>] [--one-line] [--json] [--why]

The problem this exists for, in the operator's words: *"they will get buried by
my lack of awareness while I use only the router-dispatched commands."* Fifteen
of the suite's twenty-eight skills have nothing that fires them. Adding
"consider /gabe-roast" to every beat would fix nothing — a line that prints
every time carries no information about THIS run and the eye learns to skip it.

So a signal only earns its line when the repo state says the satellite would
find something. Not "consider a roast" but "6 phases done, no adversarial pass
since this plan started". Every signal below is computed from committed state,
never inferred, and a signal whose source is missing reports **unavailable with
the reason** rather than staying quiet — a silent signal is indistinguishable
from a clean one.

`--one-line` prints AT MOST ONE row, formatted for a beat's terminal report:

    PULSE: 6 phases done, no adversarial pass on this plan → /gabe-roast "<subject>"

and prints NOTHING when there is nothing. There is no "all clear" line: a beat
that ends with a reassurance every run has re-invented the noise this avoids.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

# How much has to accumulate before a signal is worth a line. Deliberately
# coarse: a threshold tuned to fire often is a threshold that will be ignored.
THRESHOLDS = {
    "phases_before_roast": 3,
    "commits_before_health": 25,
    "entity_files_touched": 3,
    "prism_layers": 2,
    "prism_actors": 3,
}

# Offered twice for the same evidence and not taken ⇒ silent until the evidence
# changes. Without this a true signal becomes wallpaper, which is the same
# failure as a false one.
DECAY_AFTER = 2


def sh(args: list[str], cwd: Path) -> str:
    try:
        p = subprocess.run(args, cwd=str(cwd), capture_output=True, text=True, timeout=30)
        return p.stdout if p.returncode == 0 else ""
    except Exception:                                        # noqa: BLE001
        return ""


def load_plan(root: Path) -> dict | None:
    p = root / ".kdbp" / "PLAN.json"
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def load_center_config(root: Path) -> dict | None:
    for rel in ("docs/site/center/center.config.json",
                "docs/center/suite-center.config.json"):
        p = root / rel
        if p.is_file():
            try:
                return json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return None
    return None


def done_phases(plan: dict) -> list[dict]:
    return [ph for ph in plan.get("phases", [])
            if (ph.get("cells") or {}).get("exec") == "done"]


def commits_since_grep(root: Path, pattern: str, limit: int = 400) -> int | None:
    """How many commits since the last one mentioning `pattern`.

    None when the repo has no commits at all — different from "none mentioned",
    which is a real answer and returns the full count.
    """
    log = sh(["git", "log", f"-{limit}", "--pretty=%H%x1f%s%x1f%b%x1e"], root)
    if not log.strip():
        return None
    entries = [e for e in log.split("\x1e") if e.strip()]
    for i, e in enumerate(entries):
        if re.search(pattern, e, re.I):
            return i
    return len(entries)


# --------------------------------------------------------------------------- #
# The signals. Each returns (fires: bool, evidence: str, command: str) or an
# Unavailable with the reason and what would make it computable.
# --------------------------------------------------------------------------- #

class Unavailable(str):
    """A signal that could not be computed, carrying WHY."""


def s1_roast(root: Path, plan: dict | None, cfg: dict | None):
    if plan is None:
        return Unavailable("no .kdbp/PLAN.json — the phase record is the trigger's source")
    done = done_phases(plan)
    if len(done) < THRESHOLDS["phases_before_roast"]:
        return None
    since = commits_since_grep(root, r"roast|adversarial")
    if since is None:
        return Unavailable("no commit history to measure against")
    if since < len(done):
        return None
    goal = (plan.get("goal") or "this plan").strip()
    return (f"{len(done)} phases done, no adversarial pass on this plan",
            f'/gabe-roast "{goal[:60]}"')


def s2_health(root: Path, plan: dict | None, cfg: dict | None):
    since = commits_since_grep(root, r"gabe-health|health scan|god file|churn")
    if since is None:
        return Unavailable("no commit history to measure against")
    if since < THRESHOLDS["commits_before_health"]:
        return None
    return (f"{since} commits since the last structural scan",
            "/gabe-health")


def s3_myopic(root: Path, plan: dict | None, cfg: dict | None):
    if plan is None:
        return Unavailable("no .kdbp/PLAN.json — proof_type lives in the phase record")
    owed = [ph for ph in plan.get("phases", [])
            if (ph.get("proof_type") in ("journey", "visual"))
            and (ph.get("cells") or {}).get("review") == "done"
            and not ph.get("proof")]
    if not owed:
        return None
    names = ", ".join(str(ph.get("id", "?")) for ph in owed[:3])
    return (f"{len(owed)} reviewed phase(s) owe journey/visual proof and carry none ({names})",
            "/gabe-myopic")


def s4_docsite(root: Path, plan: dict | None, cfg: dict | None):
    checker = root / "scripts" / "checkers" / "docsite-staleness.sh"
    if not checker.is_file():
        return Unavailable("no scripts/checkers/docsite-staleness.sh in this repo")
    try:
        p = subprocess.run(["bash", str(checker), str(root)],
                           capture_output=True, text=True, timeout=60)
    except Exception as exc:                                  # noqa: BLE001
        return Unavailable(f"staleness checker could not run ({exc})")
    if p.returncode == 0:
        return None
    n = len([l for l in p.stdout.splitlines() if l.startswith("docsite: ")])
    return (f"{n} doc page(s) older than the markdown they were rendered from",
            "/gabe-docsite")


def _entity_code_files(cfg: dict) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for slug, row in (cfg.get("entities") or {}).items():
        files = []
        for _layer, paths in (row.get("code") or {}).items():
            files += [p for p in paths if "*" not in p]
        if files:
            out[slug] = files
    return out


def _changed_files(root: Path) -> list[str]:
    out = sh(["git", "diff", "--name-only", "HEAD"], root).splitlines()
    if not out:
        out = sh(["git", "diff", "--name-only", "HEAD~1", "HEAD"], root).splitlines()
    return [f for f in out if f.strip()]


def s5_scope(root: Path, plan: dict | None, cfg: dict | None):
    """Scope drift — NOT COMPUTABLE, and says so.

    The intent: files changed outside every phase's declared scope. PLAN.json
    carries id/name/tier/complexity/types/cells/proof/cases — and no per-phase
    file or path declaration. A proxy built on `types` would compare a category
    against a path and be wrong in both directions, so this reports unavailable
    rather than guessing. Unlocking it needs a `scope:` or `files:` field in the
    phase record, written at plan time.
    """
    return Unavailable(
        "PLAN.json has no per-phase scope/files field — a proxy on `types` would "
        "compare a category against a path. Needs a `scope:` field written at plan time")


def s6_entity(root: Path, plan: dict | None, cfg: dict | None):
    if cfg is None:
        return Unavailable("no center config — entity code maps are the trigger's source")
    maps = _entity_code_files(cfg)
    if not maps:
        return Unavailable("center config declares no entity code maps yet")
    changed = set(_changed_files(root))
    if not changed:
        return None
    best, hits = None, 0
    for slug, files in maps.items():
        n = len(changed & set(files))
        if n > hits:
            best, hits = slug, n
    if not best or hits < THRESHOLDS["entity_files_touched"]:
        return None
    return (f"{hits} changed file(s) belong to the {best} code map",
            f"/gabe-cc-entity {best}")


def s7_prism(root: Path, plan: dict | None, cfg: dict | None):
    if cfg is None:
        return Unavailable("no center config — the layer map is the trigger's source")
    layers: dict[str, set[str]] = {}
    for _slug, row in (cfg.get("entities") or {}).items():
        for layer, paths in (row.get("code") or {}).items():
            layers.setdefault(layer, set()).update(p for p in paths if "*" not in p)
    if not layers:
        return Unavailable("center config declares no layered code map yet")
    changed = set(_changed_files(root))
    if not changed:
        return None
    touched = [l for l, files in layers.items() if changed & files]
    if len(touched) < THRESHOLDS["prism_layers"] or len(changed) < THRESHOLDS["prism_actors"]:
        return None
    return (f"the diff spans {len(touched)} layers ({', '.join(sorted(touched)[:4])}) "
            f"across {len(changed)} files",
            "/gabe-prism")


SIGNALS = [
    ("S1", "adversarial", s1_roast),
    ("S3", "journey proof", s3_myopic),
    ("S4", "published docs", s4_docsite),
    ("S6", "entity context", s6_entity),
    ("S7", "explanation", s7_prism),
    ("S2", "structural", s2_health),
    ("S5", "scope", s5_scope),
]


# --------------------------------------------------------------------------- #
# Decay — the record that stops a true signal from becoming wallpaper
# --------------------------------------------------------------------------- #

def decay_path(root: Path) -> Path | None:
    kdbp = root / ".kdbp"
    return (kdbp / "PULSE.jsonl") if kdbp.is_dir() else None


def read_offers(path: Path | None) -> list[dict]:
    if not path or not path.is_file():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def suppressed(offers: list[dict], sid: str, digest: str) -> bool:
    """Offered DECAY_AFTER times with this exact evidence and never cleared."""
    return sum(1 for o in offers if o.get("id") == sid and o.get("hash") == digest) >= DECAY_AFTER


def record(path: Path | None, sid: str, digest: str, text: str) -> None:
    if not path:
        return
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps({"ts": int(time.time()), "id": sid,
                             "hash": digest, "text": text}) + "\n")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root", nargs="?", default=".")
    ap.add_argument("--one-line", action="store_true",
                    help="print at most one row (a beat's terminal report), or nothing")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--why", action="store_true",
                    help="also list signals that did NOT fire and why")
    ap.add_argument("--no-record", action="store_true",
                    help="do not write the decay record (used by the battery)")
    args = ap.parse_args(argv)

    root = Path(args.root).resolve()
    plan = load_plan(root)
    cfg = load_center_config(root)
    dpath = decay_path(root)
    offers = read_offers(dpath)

    fired, quiet, unavailable = [], [], []
    for sid, label, fn in SIGNALS:
        try:
            res = fn(root, plan, cfg)
        except Exception as exc:                              # noqa: BLE001
            unavailable.append({"id": sid, "label": label, "reason": f"signal errored: {exc}"})
            continue
        if isinstance(res, Unavailable):
            unavailable.append({"id": sid, "label": label, "reason": str(res)})
        elif res is None:
            quiet.append({"id": sid, "label": label})
        else:
            evidence, command = res
            digest = hashlib.sha1(f"{sid}|{evidence}".encode("utf-8")).hexdigest()[:12]
            fired.append({"id": sid, "label": label, "evidence": evidence,
                          "command": command, "hash": digest,
                          "suppressed": suppressed(offers, sid, digest)})

    live = [f for f in fired if not f["suppressed"]]

    if args.json:
        print(json.dumps({"fired": fired, "quiet": quiet, "unavailable": unavailable,
                          "decay_record": str(dpath) if dpath else None}, indent=1))
        return 0

    if args.one_line:
        if not live:
            return 0                      # silence is the correct output
        top = live[0]
        if not args.no_record:
            record(dpath, top["id"], top["hash"], top["evidence"])
        print(f'PULSE: {top["evidence"]} → {top["command"]}')
        return 0

    if not live and not unavailable:
        print("angles: nothing to surface — every satellite trigger is quiet")
    for f in live:
        print(f'  {f["id"]}  {f["evidence"]}  → {f["command"]}')
    for f in fired:
        if f["suppressed"]:
            print(f'  {f["id"]}  (silenced — offered {DECAY_AFTER}× on the same evidence, '
                  f'not taken; returns when the evidence changes)')
    if args.why:
        for q in quiet:
            print(f'  {q["id"]}  quiet — its condition is not met')
        for u in unavailable:
            print(f'  {u["id"]}  UNAVAILABLE — {u["reason"]}')
    elif unavailable:
        print(f'  ({len(unavailable)} signal(s) unavailable — run with --why to see why)')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
