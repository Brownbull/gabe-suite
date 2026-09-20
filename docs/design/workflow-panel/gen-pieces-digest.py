#!/usr/bin/env python3
"""gen-pieces-digest.py — how many endpoints of each STUDY APP carry each piece → `pieces-digest.json` (committed).

The four study feeds live under ~/.cache/gabe-map-baselines/.check/<app>/forms.json — outside the repo — so the lab cannot
read them at page time. This writes the small digest the facts generator joins: per app its head, its endpoint count and
the tally of `_ep_pieces.pieces_of` keys. An app with no endpoint forms says so in the feed's own state word.

    python3 docs/design/workflow-panel/gen-pieces-digest.py            # write
    python3 docs/design/workflow-panel/gen-pieces-digest.py --check    # exit 1 when the committed digest is stale
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _ep_pieces import tally  # noqa: E402

BASE = Path.home() / ".cache" / "gabe-map-baselines" / ".check"
APPS = ("gustify", "gastify", "tier3", "keypro")
OUT = HERE / "pieces-digest.json"


def build() -> dict:
    apps = {}
    for app in APPS:
        f = BASE / app / "forms.json"
        if not f.is_file():
            apps[app] = {"state": "not_emitted", "why": "no forms.json for this app under the study cache"}
            continue
        fj = json.loads(f.read_text(encoding="utf-8"))
        eps = fj.get("endpoints") or {}
        if not fj.get("present") or not eps:
            apps[app] = {"state": "absent", "head": fj.get("head"), "why": fj.get("reason") or "the feed holds no endpoint forms — this app has no backend the reading covers"}
            continue
        apps[app] = {"state": "present", "head": fj.get("head"), "endpoints": len(eps), "pieces": tally(eps)}
    return {"about": "how many endpoint forms of each study app carry each piece (keys from _ep_pieces.pieces_of); generated, never typed",
            "source": "~/.cache/gabe-map-baselines/.check/<app>/forms.json", "apps": apps}


def main() -> int:
    text = json.dumps(build(), ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    if "--check" in sys.argv:
        ok = OUT.is_file() and OUT.read_text(encoding="utf-8") == text
        print(f"{OUT.name} is {'current' if ok else 'STALE'}")
        return 0 if ok else 1
    OUT.write_text(text, encoding="utf-8")
    d = json.loads(text)["apps"]
    print(f"wrote {OUT.name}: " + " · ".join(f"{a} {v.get('endpoints', v['state'])}" + (f" ({len(v['pieces'])} keys)" if v.get("pieces") else "") for a, v in d.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
