#!/usr/bin/env python3
"""scaffold_census.py — seed a VALID skeleton workflow census from a card's FLOWS.

The workflow census (docs/site/center/workflows/<entity>.json) was hand-authored
JSON with no starting point, so a back-catalog entity's Evidence tab stayed a named
absence — nobody wrote the census because there was nothing to start from. This
emits a skeleton the operator REFINES: one state per `# FLOWS` line, one principal
workflow, a linear layout, every step `ghost` with an honest "capture owed" note.

It does NOT invent coverage. States are flow-derived approximations, not real UI
states; captures/specs/cids are placeholders. The scaffold's job is to turn a blank
into an editable, drift-checker-valid draft — the human reshapes states and the
`/gabe-cc-update curate` beat fills captures after a green e2e run.

Refuses to overwrite an existing census (accumulator law — a census never loses
steps). Reuses parse_flows so the FLOWS grammar has one definition.

Usage: scaffold_census.py <root> <slug> [--out <path>] [--force]
  default out: <root>/docs/site/center/workflows/<slug>.json
Exit: 0 wrote (or would-write to stdout with --stdout) · 1 refused (exists) or no card.
Battery: tests/census-scaffold/run.sh.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _a3_evidence import parse_flows  # noqa: E402


def flows_of(card: Path) -> list[tuple[str, str, bool]]:
    """The card's # FLOWS lines, parsed (key, desc, golden)."""
    lines, in_flows = [], False
    for ln in card.read_text(encoding="utf-8").splitlines():
        if ln.startswith("# "):
            in_flows = ln[2:].strip().upper() == "FLOWS"
            continue
        if in_flows and ln.strip():
            lines.append(ln)
    flows, _bad = parse_flows(lines)
    return flows


def scaffold(slug: str, flows: list[tuple[str, str, bool]]) -> dict:
    """A valid, editable skeleton census — states from flows, one linear workflow.

    Emits exactly what BOTH consumers accept: check_workflow_drift.py (the census
    reader) and evidence-nav.js `mount()`, whose `start` is a WORKFLOW key — it does
    `WFK = data.start; CUR = WF[WFK].nodes[0]`, so `start` must name a workflow, never
    a state (both real censuses use start = a workflow key). The single workflow is
    keyed "main"; the golden ★ flow becomes its first node so `CUR` lands on the entry.
    """
    # Dedup flow keys, preserving order — a duplicate key must not silently drop a
    # state or spawn a self-edge / duplicate node (states is a dict; nodes/tree/edges
    # were built from the raw list, so the two diverged before this).
    seen: dict[str, tuple[str, bool]] = {}
    for k, desc, golden in flows:
        if k not in seen:
            seen[k] = (desc, golden)
    keys = list(seen.keys())
    # order the golden ★ flow first, so mount()'s CUR = nodes[0] is the principal entry
    golden_key = next((k for k, (_d, g) in seen.items() if g), None)
    if golden_key and keys and keys[0] != golden_key:
        keys = [golden_key] + [k for k in keys if k != golden_key]

    states: dict[str, dict] = {}
    for k in keys:
        desc, golden = seen[k]
        states[k] = {
            "l": k,
            "st": "ghost",  # nothing captured yet — honest, not a staged shot
            "role": "principal" if golden else "edge",
            "uc": desc,
            "cap": "capture owed — scaffolded from # FLOWS; reshape into real UI states",
            "spec": "—",
        }
    # linear vertical layout (the gadget-fixture convention: x=210, 56px rows)
    tree = [[k, 210, 42 + 56 * i] for i, k in enumerate(keys)]
    edges = [[keys[i], keys[i + 1]] for i in range(len(keys) - 1)]
    workflow = {
        "label": f"{slug} — scaffolded from FLOWS (refine)",
        "gates": [],
        "nodes": keys,
        "tree": tree,
        "edges": edges,
        "taps": [],
        "bands": [],
        "h": 42 + 56 * max(len(keys), 1) + 40,
    }
    # `start` is the WORKFLOW key (evidence-nav mount contract) — NOT a state id.
    return {"entity": slug, "start": "main", "states": states,
            "workflows": {"main": workflow}}


def main() -> int:
    args = sys.argv[1:]
    force = "--force" in args
    to_stdout = "--stdout" in args
    pos = [a for a in args if not a.startswith("-")]
    if len(pos) < 2:
        print("usage: scaffold_census.py <root> <slug> [--out <path>] [--force] [--stdout]",
              file=sys.stderr)
        return 2
    root, slug = Path(pos[0]).resolve(), pos[1]

    out = None
    if "--out" in args:
        out = Path(args[args.index("--out") + 1]).resolve()
    elif not to_stdout:
        out = root / "docs" / "site" / "center" / "workflows" / f"{slug}.json"

    card = root / "docs" / "site" / "center" / "cards" / f"{slug}.md"
    if not card.is_file():
        print(f"scaffold: no card at {card} — author the card first (/gabe-cc-update)",
              file=sys.stderr)
        return 1

    flows = flows_of(card)
    if not flows:
        print(f"scaffold: card {card.name} has no parseable # FLOWS — nothing to seed",
              file=sys.stderr)
        return 1

    census = scaffold(slug, flows)
    body = json.dumps(census, indent=2, ensure_ascii=False) + "\n"

    if to_stdout or out is None:
        sys.stdout.write(body)
        return 0
    if out.exists() and not force:
        print(f"scaffold: {out.relative_to(root)} already exists — refusing to overwrite "
              f"(census is an accumulator; extend it, don't reset it). --force to override.",
              file=sys.stderr)
        return 1
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body, encoding="utf-8")
    print(f"scaffold: wrote {out.relative_to(root)} — {len(census['states'])} states, "
          f"1 workflow (all ghost). Reshape the states, then /gabe-cc-update curate "
          f"after a green e2e run.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
