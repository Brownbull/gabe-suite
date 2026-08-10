#!/usr/bin/env python3
"""risk_sweep.py — the post-generation risk sweep (risk-sweep slice 3).

After /gabe-cc-update generates the vanilla center for an entity, this surfaces a
HIGH-RISK, CAPPED set of flags across four lenses, ranked by the P0–P3 ladder
(ruling 2026-08-10), each ready to route through `disposition.py` (slice 2):

  P0 security — the card's `# RISKS` Security line at HIGH → tackle-now bias
  P1 evidence — check_workflow_drift.py capture/claim debt on the entity's census
  P2 e2e      — a `# RISKS` GAP of money/correctness/coverage/security with NO proof set
  P3 code     — size-budget breaches on the entity's code, COLLAPSED to one flag

Anti-flood (the operator's rule): P0/P1/P2 surface individually up to `--cap`
(default 6); P3 ALWAYS collapses to a single summary flag; a detector that cannot
run says so in `unavailable` (never a false all-clear). The sweep DETECTS and
ranks — it never disposes; the cc-update sweep step presents these and routes each
through disposition.py per the operator's tackle/defer choice.

Reads the card's authored `# RISKS` (SEV · status · Kind · …) rather than
re-judging risk — the ladder's P0/P2 gates are the operator's priced values.

Output: `--json` (a ranked flag list) or a human summary.
Usage: risk_sweep.py <root> <slug> [--json] [--cap N]
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

TIER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
_MONEY_KINDS = re.compile(r"money|correct|coverage|security|integrity", re.I)


def run(args: list[str], cwd: Path) -> tuple[int, str]:
    try:
        p = subprocess.run(args, cwd=str(cwd), capture_output=True, text=True, timeout=90)
        return p.returncode, (p.stdout or "")
    except Exception:  # noqa: BLE001
        return -1, ""


def gen_dir() -> Path:
    """Where the sibling generators live — this file's own dir (scripts/ in a
    project, templates/center/generators/ in the suite)."""
    return Path(__file__).resolve().parent


def read_risks(card: Path) -> list[dict]:
    """The card's `# RISKS` lines parsed to {sev, kind, stake} — `SEV · status ·
    Kind · stake · detail`. SEV ∈ LOW/MED/HIGH/GAP."""
    if not card.is_file():
        return []
    out, in_risks = [], False
    for ln in card.read_text(encoding="utf-8").splitlines():
        if ln.startswith("# "):
            in_risks = ln[2:].strip().upper() == "RISKS"
            continue
        if in_risks and ln.strip().startswith("- "):
            parts = [p.strip() for p in ln.strip()[2:].split("·")]
            if len(parts) >= 3:
                out.append({"sev": parts[0].upper(), "kind": parts[2],
                            "stake": parts[3] if len(parts) > 3 else parts[2]})
    return out


def entity_paths(root: Path, slug: str) -> list[str]:
    amp = root / "docs" / "site" / "center" / "archmap.json"
    if not amp.is_file():
        return []
    try:
        am = json.loads(amp.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return []
    ent = (am.get("entities") or {}).get(slug) or {}
    paths = []
    for f in ent.get("files", []) or []:
        p = f[1] if isinstance(f, (list, tuple)) and len(f) >= 2 else f
        if isinstance(p, str):
            paths.append(p)
    return paths


def proofs_empty(root: Path, slug: str) -> bool:
    cfg = root / "docs" / "site" / "center" / "center.config.json"
    if not cfg.is_file():
        return True
    try:
        c = json.loads(cfg.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return True
    return not ((c.get("entities") or {}).get(slug, {}).get("proofs"))


def sweep(root: Path, slug: str, cap: int) -> dict:
    flags: list[dict] = []
    unavailable: list[str] = []
    card = root / "docs" / "site" / "center" / "cards" / f"{slug}.md"
    paths = entity_paths(root, slug)
    primary = paths[0] if paths else "-"
    risks = read_risks(card)

    # P0 — security priced HIGH on the card (HIGH only, as documented — a security
    # GAP is an unbuilt/unproven gap, so it belongs to P2, not P0; this also stops a
    # single Security-GAP line double-firing P0 + P2).
    for r in risks:
        if re.search(r"security", r["kind"], re.I) and r["sev"] == "HIGH":
            flags.append({"tier": "P0", "dimension": "security", "severity": "high",
                          "entity": slug, "file": primary, "source": "card-risks",
                          "description": f"{r['kind']}: {r['stake']}",
                          "fix": "review + close the security gap before shipping"})

    # P1 — evidence: census capture/claim debt (deterministic)
    census = root / "docs" / "site" / "center" / "workflows" / f"{slug}.json"
    if census.is_file():
        cmd = ["python3", str(gen_dir() / "check_workflow_drift.py"), str(census), "--json"]
        am = root / "docs" / "site" / "center" / "archmap.json"
        if am.is_file():
            cmd += ["--archmap", str(am)]            # enables census-lag (a field no step covers)
        rc, outp = run(cmd, root)
        items: list | None = None
        if rc != 0 or not outp.strip():
            # a drift crash (unreadable census → SystemExit 2, empty stdout) or a
            # run() failure must be NAMED, never a silent false all-clear.
            unavailable.append("evidence (drift check failed to run)")
        else:
            try:
                loaded = json.loads(outp)            # a FLAT list of {kind,label,detail,fix}
                items = loaded if isinstance(loaded, list) else []
            except Exception:  # noqa: BLE001
                unavailable.append("evidence (drift --json unparseable)")
        if items is not None:
            # claim-drift (a claimed C-id no junit ran — a lie) and census-lag (a
            # field no step covers) are the SERIOUS drift, surfaced each; capture-debt
            # is the normal "curate later" state, COLLAPSED to one low flag not a flood.
            # (claim-drift additionally requires a --junit-fed run; census-lag needs the
            # --archmap forwarded above.) No pre-truncation — the global cap below does it.
            serious = [f for f in items if f.get("kind") in ("claim-drift", "census-lag")]
            debt = [f for f in items if f.get("kind") == "capture-debt"]
            for f in serious:
                kind = f.get("kind", "")
                flags.append({"tier": "P1", "dimension": "evidence",
                              "severity": "high" if "claim" in kind else "medium",
                              "entity": slug, "file": primary, "source": "workflow-drift",
                              "description": f"{kind}: {f.get('label','')} — {f.get('detail','')}"[:200],
                              "fix": f.get("fix", "reconcile the census with code/tests")})
            if debt:
                flags.append({"tier": "P1", "dimension": "evidence", "severity": "low",
                              "entity": slug, "file": primary, "source": "workflow-drift",
                              "description": f"{len(debt)} census step(s) owe a capture",
                              "fix": "/gabe-cc-update curate after a green e2e run"})
    else:
        unavailable.append("evidence (no census — run the census ASK first)")

    # P2 — e2e: a GAP of money/correctness/coverage/security with NO proof set
    if proofs_empty(root, slug):
        for r in risks:
            if r["sev"] == "GAP" and _MONEY_KINDS.search(r["kind"]):
                flags.append({"tier": "P2", "dimension": "testing", "severity": "high",
                              "entity": slug, "file": primary, "source": "card-risks",
                              "description": f"e2e gap — {r['kind']}: {r['stake']}",
                              "fix": "add a journey test proving this flow, then /gabe-cc-update curate"})

    # P3 — code: size-budget breaches on the entity's code, COLLAPSED to one flag
    if paths:
        cand = [
            Path.home() / ".claude" / "skills" / "gabe-commit" / "scripts" / "size-budget.sh",
            gen_dir().parents[2] / "skills" / "gabe-commit" / "scripts" / "size-budget.sh",
            gen_dir() / "size-budget.sh",
        ]
        sb = next((c for c in cand if c.is_file()), None)
        if sb:
            rc, outp = run(["bash", str(sb)] + paths, root)
            # match ONLY size-budget's stable WARN prefix — the loose digit+"line"
            # heuristic also caught the recorded-seam recommendation lines it prints.
            breaches = [ln for ln in outp.splitlines() if ln.startswith("SIZE-BUDGET WARN:")]
            if breaches:
                flags.append({"tier": "P3", "dimension": "code", "severity": "low",
                              "entity": slug, "file": primary, "source": "size-budget",
                              "description": f"{len(breaches)} file(s) over budget: "
                                             + "; ".join(b.strip()[:80] for b in breaches[:4]),
                              "fix": "split / merge / deprecate — promote to a phase if it warrants"})
        else:
            unavailable.append("code (size-budget.sh not found)")
    else:
        unavailable.append("code (entity has no archmap code paths)")

    # rank by ladder, then cap the individual P0/P1/P2 (P3 is already one collapsed flag)
    flags.sort(key=lambda f: (TIER.get(f["tier"], 9),
                              {"high": 0, "medium": 1, "low": 2}.get(f["severity"], 3)))
    non_p3 = [f for f in flags if f["tier"] != "P3"]
    p3 = [f for f in flags if f["tier"] == "P3"]
    capped = non_p3[:cap]
    dropped = len(non_p3) - len(capped)
    ranked = capped + p3
    return {"entity": slug, "flags": ranked, "dropped": max(dropped, 0),
            "unavailable": unavailable}


def main() -> int:
    args = sys.argv[1:]
    pos = [a for a in args if not a.startswith("--")]
    if len(pos) < 2:
        print("usage: risk_sweep.py <root> <slug> [--json] [--cap N]", file=sys.stderr)
        return 2
    root, slug = Path(pos[0]).resolve(), pos[1]
    cap = 6
    if "--cap" in args:
        try:
            cap = int(args[args.index("--cap") + 1])
        except Exception:  # noqa: BLE001
            pass
    res = sweep(root, slug, cap)

    if "--json" in args:
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0
    fl = res["flags"]
    print(f"RISK SWEEP · {slug} — {len(fl)} flag(s)"
          + (f" · {res['dropped']} more capped" if res["dropped"] else ""))
    for f in fl:
        print(f"  [{f['tier']} {f['severity']}] {f['dimension']} · {f['description'][:100]}")
        print(f"       → {f['fix']}   (disposition.py --defer|--tackle)")
    if res["unavailable"]:
        print("  unavailable: " + " · ".join(res["unavailable"]))
    if not fl and not res["unavailable"]:
        print("  clean — no high-risk flags")
    return 0


if __name__ == "__main__":
    sys.exit(main())
