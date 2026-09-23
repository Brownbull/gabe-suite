"""_ep_mapnav.py — the brain map's NAVIGATION, read for the endpoint lab's section map (D-024: the brain map folds
into the lab; its page, brainmap-endpoint.html, retired to design-context/records/brainmap/ once its rulings and open
picks were carried).

WHAT IS CARRIED, and from where. Everything the brain map's page decides with — the four groupings, the standpoint
groups, his record's eight rows with each block's list under both of D-021's rules, each block's stage list with its
reason and the line it cites, the Keep-only words (D-022), the moves a node offers, the open picks, the questions'
own text — is read from design-context/brainmap-endpoint.json, the data file gen-brainmap.js writes.
Nothing is recomputed here: gen-brainmap.js already proves the stage lists against endpoint-stages.md and
questions.md, and _ep_sectionmap.py re-hashes the inputs the tree was stamped with (the same check runs here).

WHAT IS AUTHORED here is only what the lab does differently, in map-nav.words.json: the placement, the moves as the
lab performs them, the Keep-only line for the bench, and a rewording of the brain map's own lines that say one of the
two words D-018 swept. The generator REFUSES a digit in that file outside a {token} (an HTTP status code or a ruling's
name such as D-021 excepted, as the brain map's own number sweep excepts a status code), and refuses either swept word in any line the lab carries — his
questions (qtext), his stage record (each row's `plain`) and the lines a block cites stay verbatim, as they are his.

STATE WORDS. present · stale · absent · unreadable — as the section map. Never a guess: on anything but `present` or
`stale` the payload carries the reason and nothing to draw, and the lab's map says so.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from _ep_sectionmap import DC, Gap, _bm_data, _fresh

HERE = Path(__file__).resolve().parent
WORDS = HERE / "map-nav.words.json"
_SWEPT = re.compile(r"\b(doors?|locks?)\b", re.I)
_TOKEN = re.compile(r"\{\w+\}")
_STATUS = re.compile(r"\b[1-5]\d\d\b|\bD-\d{3}\b")   # a status code, or a ruling's name (D-021) — neither is a count


def _strings(x, path=""):
    """every string under x, with where it sits"""
    if isinstance(x, str):
        yield path, x
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from _strings(v, f"{path}[{i}]")
    elif isinstance(x, dict):
        for k, v in x.items():
            if not str(k).startswith("_"):
                yield from _strings(v, f"{path}.{k}")


def map_nav(sectionmap: dict) -> dict:
    """LABEP.mapnav — {state, reason, groupings, groups, stages, stageRule, byBlock, keep, acts, open, qtext, facts, words}."""
    try:
        return _build(sectionmap or {})
    except Gap as g:
        return {"state": g.state, "reason": g.reason}
    except Exception as exc:  # noqa: BLE001
        return {"state": "unreadable", "reason": f"the map's navigation would not read ({exc.__class__.__name__}: {exc})"}


def _build(sm: dict) -> dict:
    if not sm.get("blocks"):
        raise Gap("absent", "the section map carries no blocks, so there is nothing to group")
    tree_file = DC / "brainmap-endpoint.json"
    if not tree_file.is_file():
        raise Gap("absent", f"{tree_file.name} is not there, so the brain map's navigation cannot be read")
    if not WORDS.is_file():
        raise Gap("absent", f"{WORDS.name} is not there, so the lab has no words for its navigation")
    tree = _bm_data(tree_file)
    fresh, why = _fresh(tree)
    try:
        W = json.loads(WORDS.read_text(encoding="utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise Gap("unreadable", f"{WORDS.name} would not parse ({exc.__class__.__name__})") from exc

    for key in ("groupings", "groups", "stages", "stageWords", "stagesByBlock", "keep", "acts", "open", "qtext", "blocks"):
        if not tree.get(key):
            raise Gap("unreadable", f"the brain map's tree carries no `{key}` — re-run gen-brainmap.js")

    # the lab's own words: no digit outside a token (a status code excepted), never a swept word
    for where, s in _strings(W):
        bare = _STATUS.sub("", _TOKEN.sub("", s))
        if re.search(r"\d", bare):
            raise Gap("unreadable", f"{WORDS.name}{where} types a number instead of a {{token}}: {s[:70]}")

    # the rewordings apply only while the brain map still says exactly what they replace
    rw = W.get("reword") or {}
    stage_why = {}
    for sig, e in ((rw.get("stageWhy") or {}).items()):
        if sig.startswith("_"):
            continue
        have = (tree["stagesByBlock"].get(sig) or {}).get("why")
        if have != e.get("was"):
            raise Gap("stale", f"{WORDS.name} rewords the reason for {sig}, but the brain map no longer says that line — re-read it and reword again")
        stage_why[sig] = e["now"]
    empty_plain = tree["stageWords"].get("emptyPlain")
    ep = rw.get("emptyPlain")
    if ep:
        if empty_plain != ep.get("was"):
            raise Gap("stale", f"{WORDS.name} rewords the empty-row line, but the brain map no longer says that line")
        empty_plain = ep["now"]

    known = {b["key"] for b in sm["blocks"]}
    by_block = {}
    for sig, e in tree["stagesByBlock"].items():
        if sig.startswith("_"):
            continue
        bk = e.get("block")
        if bk not in known:
            raise Gap("unreadable", f"the brain map's stage list {sig} names a block the section map does not draw: {bk}")
        by_block[bk] = {"sig": sig, "stages": list(e.get("keys") or []), "names": list(e.get("stages") or []),
                        "why": stage_why.get(sig, e.get("why")), "cites": e.get("cites"), "from": e.get("from"),
                        "fromEndingsColumn": bool(e.get("fromEndingsColumn"))}
    missing = sorted(known - set(by_block))
    if missing:
        raise Gap("unreadable", "the brain map gives no stage list for " + ", ".join(missing))

    stages = []
    for st in tree["stages"]:
        u = st.get("under") or {}
        for rule in (tree["stageWords"].get("rules") or []):
            bad = [bk for bk in (u.get(rule) or []) if bk not in known]
            if bad:
                raise Gap("unreadable", f"the row {st.get('key')} holds blocks the section map does not draw under {rule}: {', '.join(bad)}")
        stages.append({k: st.get(k) for k in ("key", "stage", "name", "kind", "mark", "plain", "across", "under", "n")})
    rules = list(tree["stageWords"].get("rules") or [])
    rule = dict(tree["stageWords"].get("rule") or {})
    if rule.get("default") not in rules:
        raise Gap("unreadable", "the brain map's stage rule has no default among its rules")

    groups = [{k: g.get(k) for k in ("key", "name", "blocks", "n", "plain")} for g in tree["groups"]]
    for g in groups:
        bad = [bk for bk in g["blocks"] if bk not in known]
        if bad:
            raise Gap("unreadable", f"the standpoint {g['key']} holds blocks the section map does not draw: {', '.join(bad)}")

    open_items = list((tree.get("open") or {}).get("items") or [])
    lab_notes = list(W.get("openLab") or [])
    if len(lab_notes) != len(open_items):
        raise Gap("stale", f"the brain map lists {len(open_items)} open picks and {WORDS.name} says what the lab does with {len(lab_notes)} — one note per pick")

    out = {
        "state": "present" if fresh else "stale",
        "reason": why,
        "source": {"tree": "docs/design/design-context/brainmap-endpoint.json", "inv_hash": (tree.get("inv") or {}).get("hash"),
                   "cells_hash": tree.get("cellsHash")},
        "maxDepth": tree.get("maxDepth"),
        "groupings": tree["groupings"],
        "groups": groups,
        "stages": stages,
        "stageRule": rule, "stageRules": rules,
        "stageNote": tree["stageWords"].get("note"),
        "acrossPlain": tree["stageWords"].get("acrossPlain"),
        "emptyPlain": empty_plain,
        "byBlock": by_block,
        "keep": tree["keep"],
        "acts": tree["acts"],
        "open": {"why": (tree.get("open") or {}).get("why"), "items": [dict(it, lab=lab_notes[i]) for i, it in enumerate(open_items)]},
        "qtext": tree["qtext"],
        "needs": {a["id"]: list(a.get("needs") or []) for a in (tree.get("attrs") or [])},
        "facts": tree.get("facts") or [],
        "added": {"name": tree.get("addedName"), "plain": tree.get("addedPlain")},
        "words": {k: v for k, v in W.items() if not k.startswith("_") and k != "reword"},
    }
    # the lines the lab CARRIES from the brain map, swept (his questions, his stage record and the lines a block cites excepted)
    for where, s in _strings({k: v for k, v in out.items() if k not in ("qtext",)}):
        if where.startswith(".stages") and where.endswith(".plain"):
            continue
        if re.fullmatch(r"\.byBlock\.[^.]+\.cites", where):
            continue
        if _SWEPT.search(s):
            raise Gap("unreadable", f"a line the lab carries says a word D-018 swept ({where}): {s[:80]}")
    return out
