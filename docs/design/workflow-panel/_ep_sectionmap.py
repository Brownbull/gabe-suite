"""_ep_sectionmap.py — the endpoint CARD's ruled section map, read for the lab's third rail tab.

The lab draws what IS BUILT. The card's section map (docs/design/design-context/) draws what the card is
SUPPOSED to hold: the eleven blocks ruled in prisms-endpoint.json (D-015) and the attributes m1 sorted into
them. This module puts the second beside the first so the GAP is visible instead of described.

WHERE THE TREE COMES FROM, and why it is not recomputed here.
  The home rule ("an attribute's home is the block its use weighs into most; one that three or more blocks
  need is shared and homed nowhere") lives in design-context/m1-cluster.js. gen-brainmap.js restates it and
  PROVES the restatement against that module on every run, then writes the answer as DATA into
  brainmap-endpoint.json (the object its retired page embedded as `window.BM_DATA`, key for key, plus each block's
  stage list with its cite). A third Python restatement would be a second mapping, and a
  second mapping is an invention — so this module READS the committed JSON and verifies it is not stale by
  re-hashing the two inputs the brain map stamped into it (the inventory's bytes, the matrix's cells). The page
  was a VIEW and has retired to design-context/records/brainmap/; nothing here reads it. (`gen-brainmap.js --check` fails when the JSON is not
  what the generator would write now; the re-hash below is this reader's own proof, independent of that run.)

STATE WORDS. present · stale (the tree was built from an older inventory or matrix) · absent (a file the map
needs is not there) · unreadable (it is there and would not parse). Never a zero, never a guess: on anything
but `present` the payload carries the reason and NO tree, and the lab says so in the tab.

The JOIN — which lab surface answers which block — is AUTHORED in section-map.words.json and is a PROPOSAL.
Nothing here measures it; the words say so on the page's face. Each pairing is one of three KINDS (D-022): a page ·
no page yet · a running header across every part; the three counts are recounted here, never typed.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DC = HERE.parents[0] / "design-context"
WORDS = HERE / "section-map.words.json"
PARTS = ("data", "schemas", "functions", "tests", "widening", "security")
_TOK = re.compile(r"\{(\w+)\}")


class Gap(Exception):
    """A source the map needs is missing or will not parse — the tab says so and draws nothing."""

    def __init__(self, state: str, reason: str):
        super().__init__(reason)
        self.state, self.reason = state, reason


def _bm_data(tree_file: Path) -> dict:
    """The brain map's own tree, read from the data file gen-brainmap.js writes beside its page."""
    try:
        tree = json.loads(tree_file.read_text(encoding="utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise Gap("unreadable", f"{tree_file.name} would not parse as JSON ({exc.__class__.__name__}) — re-run gen-brainmap.js") from exc
    if not isinstance(tree, dict) or tree.get("kind") != "endpoint-card":
        raise Gap("unreadable", f"{tree_file.name} is not the endpoint card's tree — the file was not written by gen-brainmap.js")
    return tree


def _fresh(tree: dict) -> tuple[bool, str | None]:
    """The brain map stamped the sha1 of its two inputs into the page. Re-hash them the same way it did."""
    inv = DC / (tree.get("inv") or {}).get("file", "inventory-endpoint.md")
    m1 = DC / "m1-endpoint.json"
    if not inv.is_file():
        raise Gap("absent", f"the inventory the map names is not there ({inv.name})")
    if not m1.is_file():
        raise Gap("absent", "m1-endpoint.json is not there, so the map's tree cannot be checked against the matrix it was built from")
    ih = hashlib.sha1(inv.read_bytes()).hexdigest()[:8]
    cells = json.loads(m1.read_text(encoding="utf-8")).get("cells") or []
    ch = hashlib.sha1(json.dumps(cells, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()[:8]
    want_i, want_c = (tree.get("inv") or {}).get("hash"), tree.get("cellsHash")
    if ih != want_i:
        return False, f"the inventory has moved since the map was drawn ({want_i} → {ih}) — re-run gen-brainmap.js"
    if ch != want_c:
        return False, f"the matrix has moved since the map was drawn ({want_c} → {ch}) — re-run gen-brainmap.js"
    return True, None


def _act(spec: str, sig: str, readings: dict | None = None) -> dict:
    """`part:data` · `part:data/stageblocks` · `exit` · `path` · `none` · `header` → the move the lab makes.

    `header` is the RUNNING HEADER (D-022): the block belongs to every part, so its move never leaves the part
    you are on. `readings` names, per part, the variant that is that part's stage reading; a part it does not
    name has none yet, and the lab says so on that part."""
    if spec == "none":
        return {"kind": "none"}
    if spec == "header":
        rd = {}
        for k, v in (readings or {}).items():
            if k not in PARTS:
                raise Gap("unreadable", f"the running header {sig} names a stage reading on a part the lab does not have: {k}")
            if not isinstance(v, str) or not re.fullmatch(r"[a-z]+", v):
                raise Gap("unreadable", f"the running header {sig} names no variant for {k}: {v!r}")
            rd[k] = v
        return {"kind": "header", "readings": rd}
    if spec in ("exit", "path"):
        return {"kind": spec}
    m = re.fullmatch(r"part:([a-z]+)(?:/([a-z]+))?", spec or "")
    if not m:
        raise Gap("unreadable", f"the join for {sig} names an act the generator does not know: {spec!r}")
    if m.group(1) not in PARTS:
        raise Gap("unreadable", f"the join for {sig} names a part the lab does not have: {m.group(1)}")
    out = {"kind": "part", "part": m.group(1)}
    if m.group(2):
        out["variant"] = m.group(2)
    return out


def section_map() -> dict:
    """LABEP.sectionmap — the eleven ruled blocks, their attributes, and the authored join to the bench."""
    try:
        return _build()
    except Gap as g:
        return {"state": g.state, "reason": g.reason, "blocks": None, "attrs": None}
    except Exception as exc:  # noqa: BLE001
        return {"state": "unreadable", "reason": f"the card's section map would not read ({exc.__class__.__name__}: {exc})", "blocks": None, "attrs": None}


def _build() -> dict:
    tree_file, prisms = DC / "brainmap-endpoint.json", DC / "prisms-endpoint.json"
    for f in (tree_file, prisms, WORDS):
        if not f.is_file():
            raise Gap("absent", f"{f.name} is not there, so the card's ruled shape cannot be read")
    tree = _bm_data(tree_file)
    fresh, why = _fresh(tree)
    W = json.loads(WORDS.read_text(encoding="utf-8"))
    P = json.loads(prisms.read_text(encoding="utf-8"))

    blocks_in, attrs_in = tree.get("blocks") or [], tree.get("attrs") or []
    if not blocks_in or not attrs_in:
        raise Gap("unreadable", "the brain map's tree holds no blocks or no attributes")

    # the ruling is prisms-endpoint.json's keys; the map must be drawing exactly those blocks
    ruled_sigs, map_sigs = sorted((P.get("blocks") or {}).keys()), sorted(b["sig"] for b in blocks_in)
    if ruled_sigs != map_sigs:
        raise Gap("stale", "the map's blocks are not the blocks prisms-endpoint.json rules — re-run gen-brainmap.js")
    join_w = {k: v for k, v in (W.get("join") or {}).items() if not k.startswith("_")}
    missing = [s for s in map_sigs if s not in join_w]
    extra = [s for s in join_w if s not in map_sigs]
    if missing or extra:
        raise Gap("unreadable", "section-map.words.json does not name one surface per ruled block"
                  + (f" — missing {', '.join(missing)}" if missing else "")
                  + (f" — unknown {', '.join(extra)}" if extra else ""))

    by_id = {a["id"]: a for a in attrs_in}
    surf_w = W.get("surfaces") or {}
    blocks, kinds = [], {"page": 0, "none": 0, "header": 0}
    for b in blocks_in:
        j = join_w[b["sig"]]
        act = _act(j.get("act") or "", b["sig"], j.get("readings"))
        key = {"none": "none", "header": "header", "path": "portrait", "exit": "command"}.get(act["kind"]) or act["part"]
        if key not in surf_w:
            raise Gap("unreadable", f"no words for the lab surface {key!r}")
        # THREE KINDS of pairing (D-022): a page · no page yet · a running header across every part
        kind = act["kind"] if act["kind"] in ("none", "header") else "page"
        kinds[kind] += 1
        built = kind == "page"
        blocks.append({
            "key": b["key"], "n": b["n"], "sig": b["sig"], "name": b["name"], "plain": b["plain"],
            "standpoint": b["standpoint"], "questions": b["questions"], "gkey": b.get("gkey"),
            "own": list(b.get("attrs") or []), "shared": list(b.get("spine") or []),
            "join": {"surface": surf_w[key], "surface_key": key, "act": act, "kind": kind, "built": built,
                     "says": j.get("says"), "gap": j.get("gap"), "plain": j.get("plain")},
        })

    attrs = {}
    for a in attrs_in:
        attrs[a["id"]] = {"id": a["id"], "label": a["label"], "plain": a["plain"], "r": a["r"], "alarm": a["alarm"],
                          "type": a["type"], "card": a["card"], "first": a["first"], "sec": a["sec"],
                          "home": a["home"], "shared": a["spine"], "shared_in": a["spineIn"],
                          "shared_blocks": list(a.get("spineBlocks") or [])}
    shared = [i for i in (tree.get("spine") or []) if i in by_id]
    unplaced = [i for i in (tree.get("added") or []) if i in by_id]

    n = {"attrs": len(attrs), "blocks": len(blocks), "shared": len(shared), "unplaced": len(unplaced),
         "own": sum(len(b["own"]) for b in blocks), "groups": len(tree.get("groups") or []),
         "sections": len(tree.get("sections") or []),
         "with_surface": kinds["page"], "without_surface": kinds["none"], "header": kinds["header"]}
    if n["with_surface"] + n["without_surface"] + n["header"] != n["blocks"]:
        raise Gap("unreadable", "the three kinds of pairing do not add up to the blocks the map draws")
    tok = {"nAttrs": n["attrs"], "nBlocks": n["blocks"], "nShared": n["shared"], "nUnplaced": n["unplaced"],
           "nOwn": n["own"], "nWithSurface": n["with_surface"], "nWithoutSurface": n["without_surface"], "nHeader": n["header"],
           "nSections": n["sections"], "ruled": tree.get("ruled") or "not said",
           "treeFile": tree_file.relative_to(HERE.parents[2]).as_posix(),
           "nQuestions": len({q for b in blocks for q in (b.get("questions") or [])}) or len(str(tree.get("questions") or "")) }

    def fill(x):
        if isinstance(x, str):
            def one(m):
                if m.group(1) not in tok:
                    raise Gap("unreadable", f"no value for {{{m.group(1)}}} in an authored line: {x[:70]}")
                return str(tok[m.group(1)])
            return _TOK.sub(one, x)
        if isinstance(x, list):
            return [fill(v) for v in x]
        if isinstance(x, dict):
            return {k: fill(v) for k, v in x.items() if not k.startswith("_")}
        return x

    return {
        "state": "present" if fresh else "stale",
        "reason": why,
        # `tree` names the FILE the tree is read from; `map` names the PAGE a reader opens to see it. The brain map's own
        # page retired (D-024) to design-context/records/brainmap/, so the page that draws the tree is the lab itself.
        "source": {"tree": tree_file.relative_to(HERE.parents[2]).as_posix(), "map": "docs/design/workflow-panel/endpoint-lab.html",
                   "inventory": (tree.get("inv") or {}).get("file"), "inv_hash": (tree.get("inv") or {}).get("hash"),
                   "cells_hash": tree.get("cellsHash"), "prisms": "docs/design/design-context/prisms-endpoint.json",
                   "ruled": tree.get("ruled")},
        "root": tree.get("root"), "words": fill({k: v for k, v in W.items() if k not in ("_about", "join", "surfaces", "acts")}),
        "blocks": blocks, "attrs": attrs, "sections": tree.get("sections") or [],
        "shared": shared, "unplaced": unplaced, "n": n,
    }
