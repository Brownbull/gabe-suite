#!/usr/bin/env python3
"""Link + integrity gate for the Gabe Suite's own command center.

    python3 docs/center/generators/check_suite_center.py [<center-dir>]

The forked `check_center_links.py` resolves its target through the standard
center's `center.config.json` schema, which this center does not use. So the
suite center carries its own gate rather than a contorted call into one built
for a different config.

    exit 0 — every internal link, anchor and asset resolves
    exit 1 — at least one is dead
    exit 2 — the run was vacuous (no pages found), which proves nothing

That last one is the point: a checker that passes because it looked at nothing
is worse than no checker, because it reports green.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

GEN_DIR = Path(__file__).resolve().parent
CENTER_DIR = GEN_DIR.parent
REPO_ROOT = CENTER_DIR.parent.parent

HREF_RX = re.compile(r'href="([^"]+)"')
SRC_RX = re.compile(r'(?:src|href)="([^"]+\.(?:css|js|png|svg|jpg|webp))"')
ID_RX = re.compile(r'\sid="([^"]+)"')
EXTERNAL = ("http://", "https://", "mailto:", "data:", "//")


def check_roster(cfg: dict, skills_dir: Path) -> list[str]:
    """Every skill on disk must sit in exactly one beat group, and every
    declared skill must exist.

    Why this is a gate and not a nicety: `_suite_data.py` resolves a skill's
    group with `beats.get(name, "cross-cutting")`. A skill missing from the
    config is therefore not an error — it is silently relabelled as a
    cross-cutting contract skill and rendered in the wrong place. Adding
    gabe-pulse hit exactly that, and nothing reported it (2026-07-26).

    The reverse direction matters too: a declared skill that no longer exists
    leaves a roster entry pointing at nothing, which is how an archived skill
    keeps appearing in the estate after it was removed.
    """
    problems: list[str] = []
    seen: dict[str, list[str]] = {}
    for group in cfg.get("beats", []):
        for name in group.get("skills", []):
            seen.setdefault(name, []).append(group.get("slug", "?"))

    ondisk = {d.name for d in skills_dir.glob("gabe-*") if d.is_dir()}

    for name in sorted(ondisk - set(seen)):
        problems.append(f"roster: {name} is in no beat group — "
                        f"_suite_data would file it as 'cross-cutting' silently")
    for name in sorted(set(seen) - ondisk):
        problems.append(f"roster: {name} is declared in "
                        f"[{', '.join(seen[name])}] but not on disk")
    for name, groups in sorted(seen.items()):
        if len(groups) > 1:
            problems.append(f"roster: {name} is declared in {len(groups)} groups "
                            f"[{', '.join(groups)}] — a skill has one home")
    return problems


def main(argv: list[str]) -> int:
    import json
    args = list(argv[1:])
    cfg_path = CENTER_DIR / "suite-center.config.json"
    skills_dir = REPO_ROOT / "skills"
    positional: list[str] = []
    while args:
        a = args.pop(0)
        if a == "--config":
            cfg_path = Path(args.pop(0)).expanduser().resolve()
        elif a == "--skills-dir":
            skills_dir = Path(args.pop(0)).expanduser().resolve()
        elif a == "--roster-only":
            positional.append("--roster-only")
        else:
            positional.append(a)

    cfg = json.loads(cfg_path.read_text())

    roster = check_roster(cfg, skills_dir)
    for r in roster:
        print(f"  DRIFT {r}")
    if "--roster-only" in positional:
        if roster:
            print(f"  gate: {len(roster)} roster problem(s)")
            return 1
        print("  gate: skill roster complete")
        return 0

    target_args = [p for p in positional if p != "--roster-only"]
    if target_args:
        target = Path(target_args[0]).expanduser().resolve()
    else:
        target = (REPO_ROOT / cfg["paths"]["center"]).resolve()

    if not target.is_dir():
        print(f"  gate: {target} is not a directory — nothing to check")
        return 2

    pages = {p.name: p.read_text(errors="replace")
             for p in sorted(target.glob("*.html"))}
    if not pages:
        print(f"  crawl gate: 0 pages under {target} — an empty crawl proves "
              f"nothing; refusing the vacuous pass")
        return 2

    ids: dict[str, set[str]] = {n: set(ID_RX.findall(t)) for n, t in pages.items()}
    dead: list[str] = []
    checked = 0

    for name, text in pages.items():
        for href in HREF_RX.findall(text):
            if href.startswith(EXTERNAL) or not href.strip():
                continue
            checked += 1
            page_part, _, frag = href.partition("#")
            # A deep link carries a filter: `enforcement.html?bucket=X#sec-x`.
            # The query selects rows on arrival; it is not part of the filename,
            # so it is stripped before the file is resolved. Without this the
            # gate reported every filtered link as dead.
            page_part, _, query = page_part.partition("?")
            page_part = page_part or name

            if page_part != name and not (target / page_part).exists():
                dead.append(f"{name}: dead link -> {href}")
                continue
            if frag:
                pool = ids.get(page_part, set())
                if frag not in pool:
                    dead.append(f"{name}: dead anchor -> {href}")

        for asset in SRC_RX.findall(text):
            if asset.startswith(EXTERNAL):
                continue
            checked += 1
            if not (target / asset).exists():
                dead.append(f"{name}: missing asset -> {asset}")

    # An unfilled shell token means the generator did not own a slot it claimed.
    #
    # Only tokens the SHELL actually declares count. A naive `\{\{[A-Z_]+\}\}`
    # sweep flags page CONTENT too — the functions lens renders a docstring that
    # literally says "slot NAMES (they contain {{TOKEN}})", which is correctly
    # escaped and displays as text, not an unfilled slot.
    shell_dir = CENTER_DIR / "shell"
    declared: set[str] = set()
    if shell_dir.is_dir():
        for tpl in shell_dir.glob("*.html"):
            declared |= set(re.findall(r"\{\{[A-Z_]+\}\}",
                                       tpl.read_text(errors="replace")))
    for name, text in pages.items():
        for tok in sorted(declared):
            if tok in text:
                dead.append(f"{name}: unfilled shell token {tok}")

    # PRISM FRAGMENT TOKENS are a second family and needed their own sweep: they
    # carry a slug and are lowercase, so the [A-Z_] pattern above never saw them
    # and an unresolved {{PRISM:typo}} shipped silently inside a doc page.
    # A page that MEANS to show the token writes its braces as entities, which is
    # why this can be unconditional rather than "unless it looks like a code span".
    for name, text in pages.items():
        for tok in sorted(set(re.findall(r"\{\{PRISM:[a-z0-9-]+\}\}", text))):
            dead.append(f"{name}: unresolved prism fragment {tok} "
                        f"— no such slug in prism-fragments.json")

    print(f"  pages {len(pages)} · references checked {checked}")
    if dead:
        for d in dead:
            print(f"  DEAD  {d}")
        print(f"  gate: {len(dead)} broken reference(s)"
              + (f" · {len(roster)} roster problem(s)" if roster else ""))
        return 1
    if roster:
        print(f"  gate: {len(roster)} roster problem(s) — links resolve, the estate does not")
        return 1
    print("  gate: all internal references resolve · skill roster complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
