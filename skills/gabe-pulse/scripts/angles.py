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

    PULSE: 6 phases done, no adversarial pass on this plan → /gabe-roast Sweeper "<subject>"

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
    # S8 — owed captures worth interrupting for. Below this the census is
    # merely young; above it, evidence debt is accumulating unattended.
    "evidence_owed": 3,
    "phases_before_roast": 3,
    "commits_before_health": 25,
    "entity_files_touched": 3,
    "prism_layers": 2,
    "prism_actors": 3,
    "scope_outside": 1,
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
    # Reset only on a roast RECORD, never on incidental prose: "adversarial" in
    # the old pattern matched a review commit's "4-lens adversarial pass" line
    # (measured on a copy of the real repo, 2026-08-07) and silenced the signal
    # for a whole cycle. A review is not a roast.
    since = commits_since_grep(root, r"gabe-roast|\broast(ed|s)?\b")
    if since is None:
        return Unavailable("no commit history to measure against")
    if since < len(done):
        return None
    # The command must be pasteable VERBATIM: the old form clipped the goal
    # mid-word inside the quotes AND omitted the perspective /gabe-roast
    # requires — pasted as-is it BLOCKED (observed, 7-minute round trip).
    # Sweeper is the archetype for accumulated-estate gaps — the perspective
    # the operator picked unprompted for exactly this roast shape.
    goal = (plan.get("goal") or "this plan").strip()
    if len(goal) > 60:
        goal = (goal[:60].rsplit(" ", 1)[0] or goal[:60]) + "…"
    return (f"{len(done)} phases done, no adversarial pass on this plan",
            f'/gabe-roast Sweeper "{goal}"')


def s2_health(root: Path, plan: dict | None, cfg: dict | None):
    # Reset only on a scan RECORD. The old pattern's loose words ("churn",
    # "god file") collided with ordinary commit prose — measured on a copy of
    # the real repo (2026-08-07): "archmap.json stops churning on every regen"
    # re-zeroed the counter and kept S2 silent for an entire 100+-commit cycle
    # while no scan had run.
    since = commits_since_grep(root, r"gabe-health|structural scan|health scan")
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


# The diff source and the entity resolver are SHARED with write-inflight.py so the
# board and the pulse line can never name different entities for the same tree
# (ruling 2026-08-07). work_scope.changed_files also excludes the beat tail's own
# inflight.{json,js} — without that, part-2 of the tail rewrites them one line
# before part-3 runs this file, and S6/S7 go permanently silent (the very bug the
# walk-back was added to fix, reintroduced by the tail's own ordering).
import os as _os  # noqa: E402
import sys as _sys  # noqa: E402
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))  # so `import work_scope` works even when angles.py is loaded via importlib (the batteries do this), not just run as a script
import work_scope  # noqa: E402  (same dir; installed alongside under ~/.claude/skills/gabe-pulse/scripts)
import entity_shape  # noqa: E402  (same dir; the URL-domain ↔ entity-model cross-tab, computed fresh)


def _current_phase(plan: dict) -> dict | None:
    cur = str(plan.get("current_phase", ""))
    return next((p for p in plan.get("phases", []) or [] if str(p.get("id")) == cur), None)


def s5_scope(root: Path, plan: dict | None, cfg: dict | None):
    """Scope drift — files changed outside the current phase's declared scope.

    Computable since 2026-08-07: `/gabe-plan` mirrors the phase's Scope bullet to
    PLAN.json `phases[].scope`. A phase with no scope key still reports unavailable
    (honestly — nothing to drift from), never a `types` proxy guess.
    """
    if plan is None:
        return Unavailable("no .kdbp/PLAN.json — the phase record is the scope source")
    ph = _current_phase(plan)
    if ph is None:
        return Unavailable("current phase not found in PLAN.json phases")
    scope = ph.get("scope")
    if not scope:
        return Unavailable("current phase declares no `scope:` field — add one at plan time to unlock scope-drift")
    changed, _src = work_scope.changed_files(root)
    if not changed:
        return None
    outside = [f for f in changed if not any(work_scope.matches(f, p) for p in scope)]
    if len(outside) < THRESHOLDS["scope_outside"]:
        return None
    return (f"{len(outside)} changed file(s) outside phase {ph.get('id')}'s declared scope",
            "/gabe-scope-change")


def s6_entity(root: Path, plan: dict | None, cfg: dict | None):
    if cfg is None:
        return Unavailable("no center config — entity code maps are the trigger's source")
    globs = work_scope.entity_code_globs(cfg)
    if not globs:
        return Unavailable("center config declares no entity code maps yet")
    changed, _src = work_scope.changed_files(root)
    if not changed:
        return None
    touched = work_scope.touched_entities(cfg, changed)
    if not touched:
        return None
    best = max(touched, key=lambda t: t["files"])
    if best["files"] < THRESHOLDS["entity_files_touched"]:
        return None
    return (f"{best['files']} changed file(s) belong to the {best['slug']} code map",
            f"/gabe-cc-entity {best['slug']}")


def s7_prism(root: Path, plan: dict | None, cfg: dict | None):
    if cfg is None:
        return Unavailable("no center config — the layer map is the trigger's source")
    if not work_scope.layer_globs(cfg):
        return Unavailable("center config declares no layered code map yet")
    changed, _src = work_scope.changed_files(root)
    if not changed:
        return None
    touched = work_scope.touched_layers(cfg, changed)
    if len(touched) < THRESHOLDS["prism_layers"] or len(changed) < THRESHOLDS["prism_actors"]:
        return None
    return (f"the diff spans {len(touched)} layers ({', '.join(touched[:4])}) "
            f"across {len(changed)} files",
            "/gabe-imagine")


def s8_evidence(root: Path, plan: dict | None, cfg: dict | None):
    """Workflow-census capture debt — the standing reminder.

    /gabe-review DETECTS drift on the diff that caused it; this angle exists for
    what review can only DEFER: an owed capture needs a green e2e run plus
    curation, so it survives the reviewing session and then needs something to
    keep surfacing it. Reads the committed census only — no run, no parse."""
    wf_dir = root / "docs" / "site" / "center" / "workflows"
    if not wf_dir.is_dir():
        return Unavailable("no workflow census yet — /gabe-cc-update authors it")
    owed, drift, ents = 0, 0, 0
    for f in sorted(wf_dir.glob("*.json")):
        try:
            census = json.loads(f.read_text())
        except Exception:
            continue
        ents += 1
        for st in (census.get("states") or {}).values():
            if st.get("grp"):
                continue
            if not st.get("shot"):
                owed += 1
            cap = str(st.get("cap") or "")
            if "owed" in cap:
                drift += 1
    if not ents:
        return Unavailable("workflow census directory is empty")
    if owed < THRESHOLDS["evidence_owed"]:
        return None
    named = f"{drift} named capture-owed" if drift else "none named"
    return (f"{owed} workflow step(s) across {ents} entity census(es) have no "
            f"capture ({named})",
            "/gabe-cc-update curate")


def s9_entity_shape(root: Path, plan: dict | None, cfg: dict | None):
    """Entity-shape drift — a URL surface no DOMAIN entity owns (orphan), or a
    cross-cutting concern modeled as a peer domain (aspect).

    The STANDING reminder: /gabe-review catches a NEW route on the diff that
    caused the drift; this angle keeps an already-standing orphan/aspect visible
    every beat. Recomputed fresh from the committed archmap here — NOTHING is
    stored, so nothing goes stale and nothing needs remembering."""
    if cfg is None:
        return Unavailable("no center config — the entity model is the trigger's source")
    try:
        endpoints, umap = entity_shape.load_project(root)
    except FileNotFoundError:
        return Unavailable("no archmap yet — the center regen builds it")
    shape = entity_shape.entity_shape(endpoints, umap)
    orphans, aspects = shape["orphans"], shape["aspects"]
    if not orphans and not aspects:
        return None
    parts = []
    if orphans:
        names = ", ".join("/" + o["domain"] for o in orphans[:3])
        more = f" +{len(orphans) - 3}" if len(orphans) > 3 else ""
        parts.append(f"{len(orphans)} orphan domain(s) ({names}{more})")
    if aspects:
        names = ", ".join(a["entity"] for a in aspects[:3])
        parts.append(f"{len(aspects)} aspect entity(ies) ({names})")
    return (f"entity-shape drift — {' · '.join(parts)}", "/gabe-cc-init")


SIGNALS = [
    ("S1", "adversarial", s1_roast),
    ("S8", "evidence debt", s8_evidence),
    ("S3", "journey proof", s3_myopic),
    ("S4", "published docs", s4_docsite),
    ("S6", "entity context", s6_entity),
    ("S7", "explanation", s7_prism),
    ("S2", "structural", s2_health),
    ("S5", "scope", s5_scope),
    ("S9", "entity shape", s9_entity_shape),
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
    cfg, _cfgdir = work_scope.load_center_config(root)   # the shared, both-layout probe
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
