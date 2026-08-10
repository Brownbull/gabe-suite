#!/usr/bin/env python3
"""center_status.py — the deterministic actionables emitter for
`/gabe-cc-update status` (operator ruling 2026-08-10).

The status report used to be model-narrated: it named issues but linked none,
and often skipped the remediation step — so the operator had to hunt for the
section and guess the fix. This script OWNS the actionable list. Every finding
it prints carries a workspace-relative markdown link (clickable in the IDE and
terminal) AND a concrete `→ next` step. The skill relays it verbatim and adds
only ordering prose; it never composes a link by hand.

Findings read from the SAME sources the gate reads — adoption.json (registry),
cards/<slug>.md via _center_data.parse_card, center.config.json, proof
manifests — so the two never name different problems. Reviewed/diagram
detection goes through parse_card, which strips HTML comments: a
`<!-- # REVIEWED withheld -->` placeholder reads as NOT reviewed (the gate's raw
substring check is fooled by that comment; this is not).

Usage: center_status.py [root]
  root defaults to _center_data's resolution; GABE_REPO_ROOT points it at another
  project's tree read-only, same lab-driver seam as the build. Links are emitted
  relative to that root (the IDE's workspace cwd).
Prints the report to stdout, exit 0 always (a report, not a gate).
Battery: tests/center-status/run.sh (FIRE and SILENT both proven).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _center_data as D  # noqa: E402
from _a3_evidence import parse_flows  # noqa: E402

CANON_DIAGRAMS = ("USERFLOW", "DATAFLOW", "WORKFLOW")


def _rel(p: Path) -> str:
    """path as workspace-relative (the href) — the project root is the IDE cwd."""
    try:
        return str(p.resolve().relative_to(D.REPO_ROOT))
    except ValueError:
        return str(p)


def _short(p: Path) -> str:
    """path as center-relative (the visible label) — shorter, still unambiguous."""
    try:
        return str(p.resolve().relative_to(D.CENTER_DIR))
    except ValueError:
        return p.name


def _link(p: Path, line: int | None = None, label: str | None = None) -> str:
    lab = label or _short(p)
    if line:
        return f"[{lab}:{line}]({_rel(p)}#L{line})"
    return f"[{lab}]({_rel(p)})"


def _line_of(text: str, *needles: str) -> int | None:
    """1-based line of the first line containing any needle (case-insensitive).
    Needles are tried in order — the specific stamp before the loose word."""
    lines = text.splitlines()
    for needle in needles:
        low = needle.lower()
        for i, ln in enumerate(lines, 1):
            if low in ln.lower():
                return i
    return None


def _diagram_sections(parsed: dict) -> set[str]:
    """which canonical diagrams the card carries — parse_card keys are upper-cased
    and comment-stripped, so a commented-out diagram does not count."""
    return {d for d in CANON_DIAGRAMS if parsed.get(f"DIAGRAM {d}")}


def main() -> int:
    cfg = D.CFG
    if not cfg:
        print("center-status: no center.config.json — not a center project")
        return 0

    center = D.CENTER_DIR
    cards_dir = center / "cards"
    adoption_path = center / "adoption.json"
    config_path = center / "center.config.json"
    proof_root = D.PROOF_DIR
    entities_cfg = cfg.get("entities", {})

    adoption: dict = {}
    if adoption_path.exists():
        adoption = json.loads(adoption_path.read_text())
    registry = adoption.get("sections", [])

    actions: list[tuple[int, str]] = []   # (priority, block) — lower blocks sooner
    queued: list[str] = []
    warns: list[str] = []
    reviewed_ok = 0

    for s in registry:
        slug = s.get("entity")
        if not slug:
            continue
        status = (s.get("status") or "pending")
        card = cards_dir / f"{slug}.md"
        if not card.exists():
            # No card: an APPROVED entity is documentation owed (backfill); a
            # PENDING one is shortlisted-not-started. Either way, link + step.
            if status == "pending":
                queued.append(
                    f"- {slug} — pending, no card (shortlisted) → {_link(adoption_path)} · "
                    f"`/gabe-cc-update backfill` or `/gabe-cc-init section`")
            else:
                queued.append(
                    f"- {slug} — adopted, no card → {_link(adoption_path)} · "
                    f"`/gabe-cc-update backfill`")
            continue

        # A card ON DISK is finalized regardless of registry status — a PENDING
        # entity with a card is mid-ritual (authored, awaiting THE review), which
        # is exactly the live thread the status report must surface, not skip.
        text = card.read_text()
        try:
            parsed = D.parse_card(card)
        except SystemExit as exc:
            actions.append((0,
                f"malformed · {slug}\n   {_link(card)} — {exc}\n"
                f"   → repair the card: every canonical section required, non-empty"))
            continue

        reviewed = bool(parsed.get("REVIEWED"))
        if not reviewed:
            ln = _line_of(text, "# REVIEWED", "reviewed:")   # placeholder, if any
            page = center / f"feature-{slug}.html"
            page_ref = _link(page) if page.exists() else f"`feature-{slug}.html` (regen to build)"
            actions.append((1,
                f"review · {slug}\n   {_link(card, ln)} — # REVIEWED not stamped\n"
                f"   → review {page_ref}, then add a `# REVIEWED <date> · <who>` line to the card"))
        else:
            reviewed_ok += 1

        if "TODO(author)" in text:
            ln = _line_of(text, "TODO(author)")
            actions.append((2,
                f"todo · {slug}\n   {_link(card, ln)} — card carries TODO(author)\n"
                f"   → write the drafted section(s), then delete the TODO(author) marker"))

        flow_lines, in_flows = [], False
        for ln_txt in text.splitlines():
            if ln_txt.startswith("# "):
                in_flows = ln_txt[2:].strip().upper() == "FLOWS"
                continue
            if in_flows and ln_txt.strip():
                flow_lines.append(ln_txt)
        _flows, bad = parse_flows(flow_lines)
        if bad:
            ln = _line_of(text, bad[0])
            actions.append((3,
                f"flows · {slug}\n   {_link(card, ln)} — {len(bad)} FLOWS line(s) do not parse\n"
                f"   → fix to the grammar `- key [★] → desc`"))

        for pname in entities_cfg.get(slug, {}).get("proofs", []):
            manifest = proof_root / pname / "manifest.json"
            if not manifest.exists():
                continue
            mtext = manifest.read_text()
            if '"narration"' not in mtext:
                actions.append((4,
                    f"proof · {slug}\n   {_link(manifest)} — proof set `{pname}` has no narration\n"
                    f"   → `/gabe-cc-update curate {pname} <shot-nums>`"))
            elif "TODO(narration)" in mtext:
                ln = _line_of(mtext, "TODO(narration)")
                actions.append((4,
                    f"proof · {slug}\n   {_link(manifest, ln)} — narration carries TODO(narration)\n"
                    f"   → finish the narration legs, then delete the marker"))

        # diagrams — advisory, and only PRE-review: a reviewed card's diagram
        # count is the operator's accepted call; nagging it forever is noise.
        if not reviewed:
            have = _diagram_sections(parsed)
            if len(have) < 3:
                missing = [d for d in CANON_DIAGRAMS if d not in have]
                actions.append((5,
                    f"diagrams · {slug}\n   {_link(card)} — {len(have)} of 3 canonical "
                    f"(missing {', '.join(missing)})\n"
                    f"   → add `# DIAGRAM {missing[0]}` to the card, or one line why fewer suffice"))

    if config_path.exists():
        ctext = config_path.read_text()
        if "TODO(verify-glob)" in ctext:
            ln = _line_of(ctext, "TODO(verify-glob)")
            warns.append(
                f"- registry carries TODO(verify-glob) → {_link(config_path, ln)} · "
                f"confirm the scaffolded glob(s), then delete the marker")

    # ---- render -----------------------------------------------------------
    actions.sort(key=lambda t: t[0])
    n_a, n_q, n_w = len(actions), len(queued), len(warns)
    idx, board = center / "index.html", center / "board.html"
    print(f"CENTER STATUS · {n_a} action(s) · {n_q} queued · {n_w} warn(s)")
    print(f"regenerated → {_link(idx, label='overview')} · {_link(board, label='board')}")
    if actions:
        print("\nACTIONS — pending, blocking soonest")
        for i, (_p, block) in enumerate(actions, 1):
            print(f"{i}. {block}")
    if queued:
        print("\nQUEUED — backfill, one per run")
        for q in queued:
            print(q)
    if warns:
        print("\nWARN — non-gating")
        for w in warns:
            print(w)
    if not (actions or queued or warns):
        print("\nclean — every adopted entity has a reviewed card; nothing owed")
    elif reviewed_ok:
        print(f"\nclean: {reviewed_ok} card(s) reviewed ✓")
    return 0


if __name__ == "__main__":
    sys.exit(main())
