#!/usr/bin/env python3
"""Reference extraction — the tokens a doc already writes, resolved against the
registries the command center already reads.

The premise (design record, 2026-07-31): a doc does not declare its
relationships. It writes `/gabe-red`, or `transaction`, or `C1421`, the way it
always has. The build finds those names and joins them to the registry that owns
each one, producing BOTH directions in a single pass:

    outbound   a chip on the doc page      → the target's page + anchor
    inbound    a "documented in" line on   → the docs that cite it
               the target's own surface

Both are DERIVED. Delete a doc and its backlink disappears on the next build; no
authored link table exists to go stale, and no estate page is ever hand-edited to
mention a doc.

Four token classes ship (operator ruling): entity slug · case id · skill/beat ·
sibling doc. Each is extracted only when its REGISTRY is configured — a class
with no registry is not "unresolved", it is not applicable here, and rendering
dashed chips for it would teach the reader that the page is broken.
"""

from __future__ import annotations

import html as _html
import json
import re
from pathlib import Path
from typing import Any

E = _html.escape

# --------------------------------------------------------------------------- #
# The classes. `rx` runs over RENDERED TEXT, never markdown source, so a token
# inside a code fence is found the same way a reader finds it.
# --------------------------------------------------------------------------- #

CLASSES: dict[str, dict[str, Any]] = {
    "skill": {
        "label": "skill",
        "rx": re.compile(r"/gabe-[a-z][a-z-]*\b"),
        "registry": "skills",
    },
    "case": {
        "label": "case id",
        "rx": re.compile(r"\bC\d{2,5}\b"),
        "registry": "cases",
    },
    "entity": {
        "label": "entity",
        "rx": None,                    # matched against the registry's own slugs
        "registry": "entities",
    },
    "doc": {
        "label": "doc",
        "rx": None,                    # supplied by the caller's link map
        "registry": "docs",
    },
}


def load_registries(config: dict[str, Any], center_dir: Path | None) -> dict[str, dict]:
    """Build {class: {token: (href, label)}} from whatever this project actually has.

    Every lookup is a plain dict, so resolution is a hash hit and the whole join
    is O(tokens). A registry that does not exist is simply absent from the result.
    """
    reg: dict[str, dict] = {}

    # skills — the beat roster the center already renders
    roster = config.get("_skill_roster") or {}
    if roster:
        reg["skills"] = roster

    if center_dir:
        # entities — adoption.json is THE registry (D123)
        adoption = center_dir / "adoption.json"
        if adoption.is_file():
            try:
                data = json.loads(adoption.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                data = {}
            ents = data.get("entities", data if isinstance(data, dict) else {})
            reg["entities"] = {
                slug: (f"feature-{slug}.html", (row or {}).get("display_name", slug))
                for slug, row in ents.items() if isinstance(ents, dict)
            }
        # cases — the ledger anchor is contract: test-matrix.html#C<n>
        matrix = center_dir / "test-matrix.html"
        if matrix.is_file():
            ids = set(re.findall(r'\sid="(C\d{2,5})"', matrix.read_text(encoding="utf-8", errors="replace")))
            reg["cases"] = {cid: (f"test-matrix.html#{cid}", cid) for cid in ids}

    return reg


def find_repo_root(start: Path) -> Path:
    """Walk up until a dir holding `skills/` appears.

    A fixed number of `.parent` hops broke the moment the output moved one level
    deeper (docs/site → docs/site/center): the roster silently resolved nothing
    and the build reported "no registries configured" while cheerfully emitting
    edges from the one class that did not need a registry."""
    cur = start.resolve()
    for _ in range(6):
        if (cur / "skills").is_dir():
            return cur
        if cur.parent == cur:
            break
        cur = cur.parent
    return start


def skill_roster(start: Path) -> dict[str, tuple[str, str]]:
    """`/gabe-x` → where the center documents it. Derived from the skills on disk,
    so an archived skill stops resolving the moment it is archived."""
    out: dict[str, tuple[str, str]] = {}
    skills_dir = find_repo_root(start) / "skills"
    if not skills_dir.is_dir():
        return out
    for d in sorted(skills_dir.glob("gabe-*/")):
        if "_archive" in d.parts:
            continue
        out["/" + d.name] = ("agents.html", d.name)
    return out


def extract(text: str, registries: dict[str, dict], link_map: dict[str, str]
            ) -> list[dict[str, Any]]:
    """Every reference this text makes, resolved. Order preserved, duplicates
    collapsed — a doc that names `/gabe-red` nine times has ONE relationship
    with it, and nine chips would say something false about the strength of it.
    """
    found: dict[tuple[str, str], dict[str, Any]] = {}

    def add(cls: str, token: str, href: str, label: str) -> None:
        found.setdefault((cls, token), {
            "class": cls, "token": token, "href": href,
            "label": label, "kind": CLASSES[cls]["label"],
        })

    for cls, spec in CLASSES.items():
        table = registries.get(spec["registry"])
        if not table:
            continue                       # no registry ⇒ class not applicable here
        rx = spec["rx"]
        if rx is not None:
            for m in rx.finditer(text):
                tok = m.group(0)
                hit = table.get(tok)
                if hit:
                    add(cls, tok, hit[0], hit[1])
        else:
            # slug-shaped registries: match on the registered names themselves,
            # word-bounded, so `card` never matches inside `card-alias`
            for tok, hit in table.items():
                if re.search(r"(?<![\w-])%s(?![\w-])" % re.escape(tok), text):
                    add(cls, tok, hit[0], hit[1])

    for target_slug, label in link_map.items():
        if re.search(r'href="%s\.html' % re.escape(target_slug), text):
            add("doc", target_slug, f"{target_slug}.html", label)

    return list(found.values())


def chips_html(refs: list[dict[str, Any]]) -> str:
    """The outbound row on a doc page. Renders nothing when there is nothing to
    render — an empty 'References' heading is a claim that the doc cites nothing,
    which is different from a doc whose citations we did not look for."""
    if not refs:
        return ""
    order = {"entity": 0, "case": 1, "skill": 2, "doc": 3}
    refs = sorted(refs, key=lambda r: (order.get(r["class"], 9), r["token"]))
    chips = "".join(
        '<a class="refchip r-%s" href="%s" title="%s: %s">%s</a>'
        % (r["class"], r["href"], E(r["kind"]), E(r["label"]), E(r["token"]))
        for r in refs)
    return (
        '<section class="refs"><h2>This page references</h2>'
        '<p class="refs-note">Derived from the page\'s own text on every build — '
        'no link table is maintained, and a reference that stops resolving stops '
        'appearing.</p>'
        '<div class="refchips">%s</div></section>' % chips)


def backlink_index(pages: list[tuple[str, str, list[dict[str, Any]]]]) -> dict[str, list[dict]]:
    """Invert the outbound edges: target token → the docs that cite it.

    This is the inbound half, and the reason both directions are computed in one
    pass from one source. The estate side never authors anything; it reads this.
    """
    index: dict[str, list[dict]] = {}
    for slug, title, refs in pages:
        for r in refs:
            key = "%s:%s" % (r["class"], r["token"])
            index.setdefault(key, []).append(
                {"slug": slug, "title": title, "href": "%s.html" % slug})
    return index
