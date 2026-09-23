"""_ep_fieldlayer.py — the lab's FIELD LAYER words and its AUTHORED ties, read for LABEP.fieldlayer (D-024).

The lab's renderers say what they draw themselves: each one tags the element it drew with the inventory attribute
ids (window.DRAWN in _lab-ep-map.js). This module carries only what a renderer CANNOT say — a tie from an attribute
to a selector in one region, written by hand in field-layer.words.json — and the words the section map's field marks
use. Every tie is a PROPOSAL and the page marks it so.

It REFUSES, never guesses: an id the card's inventory does not carry, a region the lab does not have, a tie with no
selector or no reason. On anything but `present` the payload carries the reason and NO ties, and the lab says so.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORDS = HERE / "field-layer.words.json"
REGIONS = ("middle", "command", "portrait", "head")


def field_layer(sectionmap: dict) -> dict:
    """LABEP.fieldlayer — {state, reason, words, authored}; the ids are checked against LABEP.sectionmap.attrs."""
    if not WORDS.is_file():
        return {"state": "absent", "reason": f"{WORDS.name} is not there, so no tie is written by hand", "words": {}, "authored": []}
    try:
        W = json.loads(WORDS.read_text(encoding="utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        return {"state": "unreadable", "reason": f"{WORDS.name} would not parse ({exc.__class__.__name__})", "words": {}, "authored": []}
    attrs = (sectionmap or {}).get("attrs") or {}
    if not attrs:
        return {"state": "absent", "reason": "the section map carries no attributes, so no tie can be checked", "words": {}, "authored": []}
    ties, bad = [], []
    for i, a in enumerate(W.get("authored") or []):
        why = []
        if a.get("id") not in attrs:
            why.append(f"no attribute {a.get('id')!r} in the inventory")
        if a.get("region") not in REGIONS:
            why.append(f"no region {a.get('region')!r} in the lab")
        if not a.get("sel") or not a.get("why"):
            why.append("a tie needs a selector and a reason")
        if a.get("how") not in (None, "face", "hover"):
            why.append(f"`how` is face or hover, not {a.get('how')!r}")
        if why:
            bad.append(f"tie {i + 1}: " + "; ".join(why))
            continue
        ties.append({"id": a["id"], "region": a["region"], "sel": a["sel"], "how": a.get("how") or "face", "why": a["why"]})
    if bad:
        return {"state": "unreadable", "reason": f"{WORDS.name} has a tie the lab cannot use — " + " · ".join(bad), "words": {}, "authored": []}
    words = {k: v for k, v in W.items() if not k.startswith("_") and k != "authored"}
    return {"state": "present", "reason": None, "words": words, "authored": ties,
            "n": {"ties": len(ties), "ids": len({t["id"] for t in ties})}}
