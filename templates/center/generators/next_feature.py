#!/usr/bin/env python3
"""next_feature.py — the center backfill queue.

What still needs COVERAGE, read from the committed center data — never a
features[] registry (retired: the center's pages are per adopted ENTITY, and
build waves live in PLAN/LEDGER/git):

  1. PLAN phases fully served (exec/review/commit/push all done) whose Center
     cell is still open — `/gabe-cc-update <phase>` covers them. A deferred (⏸)
     or obsolete (⚰️) Center cell is its own recorded disposition: parked work
     stays visible with its state, never a fake page and never silence.
  2. Adopted entities (adoption.json, any non-pending status) with no card on
     disk — `/gabe-cc-init section` (back-catalog) or `/gabe-cc-update backfill`
     authors them.

Denominator honesty: phases that predate the Center column are counted and
named as out-of-generation, not silently absent.

Usage: python3 scripts/next_feature.py
"""

from __future__ import annotations

import json

import _center_data as D


def main() -> int:
    plan = D.load_plan()
    # Read cells through D.phase_cells: `center` lives at the phase top level,
    # so the old `p["cells"]["center"]` matched nothing and every served phase
    # counted as "pre-Center-column" (gustify #148).
    cells = {id(p): D.phase_cells(p) for p in plan.get("phases", [])}
    served = [p for p in reversed(plan.get("phases", []))
              if p.get("cells")
              and all(cells[id(p)].get(k) == "done"
                      for k in ("exec", "review", "commit", "push"))]
    tracked = [p for p in served if "center" in cells[id(p)]]
    pre_column = len(served) - len(tracked)
    open_q = [p for p in tracked
              if cells[id(p)]["center"] in ("todo", "in_progress")]
    parked = [p for p in tracked
              if cells[id(p)]["center"] in ("deferred", "obsolete")]

    print(f"center queue — {len(open_q)} served phase(s) with an open Center "
          f"cell · {len(parked)} parked by their own cell state"
          + (f" · {pre_column} pre-Center-column (opt-in later)"
             if pre_column else "") + ":\n")
    for p in open_q:
        print(f"  {p['id']:<5} {cells[id(p)]['center']:<12} "
              f"{(p.get('name') or '')[:60]}")
    for p in parked:
        print(f"  {p['id']:<5} {cells[id(p)]['center']:<12} "
              f"{(p.get('name') or '')[:60]}")

    adoption: dict = {}
    apath = D.CENTER_DIR / "adoption.json"
    if apath.exists():
        adoption = json.loads(apath.read_text())
    cards = D.CENTER_DIR / "cards"
    cardless = [s for s in adoption.get("sections", [])
                if s.get("entity")
                and (s.get("status") or "pending") != "pending"
                and not (cards / f"{s['entity']}.md").exists()]
    if cardless:
        print(f"\nadopted entities with no card ({len(cardless)}):")
        for s in cardless:
            label = s.get("display_name") or s.get("label") or s["entity"]
            print(f"  {s['entity']:<24} {label}")

    if open_q:
        nxt = open_q[0]
        print(f"\nnext (newest first): /gabe-cc-update {nxt['id']} — "
              f"{(nxt.get('name') or '')[:70]}")
    elif cardless:
        print(f"\nnext: /gabe-cc-init section — start with "
              f"'{cardless[0]['entity']}'")
    else:
        print("\nqueue clear — every served phase is covered or parked, every "
              "adopted entity has its card.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
