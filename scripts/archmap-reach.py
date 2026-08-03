#!/usr/bin/env python3
"""ARCHMAP REACHABILITY — which unmapped files does mapped code actually import?

    python3 scripts/archmap-reach.py <repo> [--list] [--json]

READ-ONLY. Writes nothing.

WHY. `archmap-census.py` answers "how many files are unclaimed?" but the number
moves with whoever decides which directories count. Reachability replaces that
judgement with a fact: if a file the archmap DOES map imports a file it does
NOT, that file is used by mapped code and its absence is a hole — no bucket
argument required.

    REACHABLE-UNCLAIMED   imported (transitively) from claimed code, not claimed
                          → indisputably app code, indisputably missing
    ORPHAN-UNCLAIMED      not reachable from any claimed file
                          → an entry point, a different app surface, or dead

HONESTY. Import resolution is approximate across two languages. The script
prints its RESOLUTION RATE; an unresolved import is counted and reported, never
dropped. A reachability number quoted without that rate is not evidence.
"""
from __future__ import annotations

import ast
import json
import sysconfig
import re
import sys
from collections import deque
from pathlib import Path

SRC_EXT = (".py", ".ts", ".tsx", ".js", ".jsx")
GENERATED = ("node_modules/", ".venv/", "venv/", "/dist/", "/build/",
             "__pycache__/", ".git/", "storybook-static/", "docs/site/",
             ".next/", "coverage/", "htmlcov/", ".pytest_cache/", ".ruff_cache/")
TS_IMPORT = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")


def is_generated(rel: str) -> bool:
    return any(g in "/" + rel for g in GENERATED)


def ts_candidates(base: Path) -> list[Path]:
    out = [base.with_suffix(s) for s in (".ts", ".tsx", ".js", ".jsx")]
    out += [base / f"index{s}" for s in (".ts", ".tsx", ".js", ".jsx")]
    out.append(base)
    return out


def resolve_ts(spec: str, src: Path, repo: Path, srcroots: list[Path]) -> Path | None:
    if spec.startswith("."):
        cands = ts_candidates((src.parent / spec).resolve())
    elif spec.startswith("@/") or spec.startswith("~/"):
        cands = []
        for root in srcroots:
            cands += ts_candidates((root / spec[2:]).resolve())
    else:
        return None                       # bare package — not first-party
    for c in cands:
        if c.is_file():
            try:
                c.relative_to(repo)
                return c
            except ValueError:
                return None
    return None


def py_roots(repo: Path) -> list[Path]:
    """Import roots, not just the repo root.

    `from services.consent import X` inside apps/api resolves against apps/api,
    which is on sys.path at runtime. Searching only the repo root missed every
    such import — and because the miss-counter only flagged specs whose first
    segment was a top-level repo directory, those misses were dropped silently
    and the tool reported 100% resolution off 97 edges. Both halves fixed here.
    """
    roots = {repo}
    for marker in ("pyproject.toml", "setup.py", "setup.cfg", "alembic.ini", "manage.py"):
        for m in repo.rglob(marker):
            if not is_generated(str(m.relative_to(repo))):
                roots.add(m.parent)
    for p in repo.glob("apps/*"):
        if p.is_dir():
            roots.add(p)
    return sorted(roots)


def resolve_py(mod: str, roots: list[Path]) -> Path | None:
    parts = mod.split(".")
    for root in roots:
        for n in range(len(parts), 0, -1):
            base = root.joinpath(*parts[:n])
            for c in (base.with_suffix(".py"), base / "__init__.py"):
                if c.is_file():
                    return c
    return None


def classify_miss(prefix: str, repo_names: set[str]) -> str:
    """first-party vs stdlib/third-party.

    Counting `sqlalchemy` and `typing` as unresolved made the rate meaningless
    in the pessimistic direction, exactly as searching one root made it
    meaningless in the optimistic one. Only a spec that plausibly names
    something IN THIS REPO can be a first-party miss.
    """
    if prefix in sys.stdlib_module_names:
        return "stdlib"
    if prefix.startswith((".", "@/", "~/")):
        return "firstparty"
    return "firstparty" if prefix.split("/")[0] in repo_names else "thirdparty"


def imports_of(path: Path, repo: Path, srcroots: list[Path],
               pyroots: list[Path], unresolved: list[str]) -> tuple[list[Path], int]:
    """(resolved first-party targets, unresolved first-party-looking count)."""
    try:
        text = path.read_text(errors="replace")
    except Exception:                             # noqa: BLE001
        return [], 0
    hits: list[Path] = []
    misses = 0
    if path.suffix == ".py":
        try:
            tree = ast.parse(text)
        except SyntaxError:
            return [], 0
        mods: list[str] = []
        for n in ast.walk(tree):
            if isinstance(n, ast.Import):
                mods += [a.name for a in n.names]
            elif isinstance(n, ast.ImportFrom):
                if n.level:                        # relative
                    here = path.parent
                    for _ in range(n.level - 1):
                        here = here.parent
                    tgt = here / (n.module.replace(".", "/") if n.module else "")
                    for c in (tgt.with_suffix(".py"), tgt / "__init__.py"):
                        if c.is_file():
                            hits.append(c)
                            break
                    continue
                if n.module:
                    mods.append(n.module)
        for m in mods:
            r = resolve_py(m, pyroots)
            if r:
                hits.append(r)
            else:
                misses += 1
                unresolved.append(m.split(".")[0])
    else:
        for spec in TS_IMPORT.findall(text):
            if not (spec.startswith(".") or spec.startswith("@/") or spec.startswith("~/")):
                continue
            r = resolve_ts(spec, path, repo, srcroots)
            if r:
                hits.append(r)
            else:
                misses += 1
                unresolved.append(spec)
    return hits, misses


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[1].startswith("-"):
        print(__doc__)
        return 1
    repo = Path(argv[1]).expanduser().resolve()
    as_json = "--json" in argv
    center = repo / "docs/site/center"
    try:
        cfg = json.loads((center / "center.config.json").read_text())
    except Exception as exc:                      # noqa: BLE001
        print(f"reach: no readable center.config.json ({exc})")
        return 2

    pyroots = py_roots(repo)
    unresolved: list[str] = []
    repo_names = {p.name for p in repo.rglob("*")
                  if not is_generated(str(p.relative_to(repo)))} | \
                 {p.stem for p in repo.rglob("*.py")
                  if not is_generated(str(p.relative_to(repo)))}
    srcroots = [p for p in repo.glob("*/*/src") if p.is_dir()]
    srcroots += [p for p in repo.glob("*/src") if p.is_dir()]

    claimed: set[Path] = set()
    for ent in (cfg.get("entities") or {}).values():
        for pats in (ent.get("code") or {}).values():
            for pat in pats if isinstance(pats, list) else [pats]:
                claimed.update(p.resolve() for p in repo.glob(pat) if p.is_file())

    universe: set[Path] = set()
    for p in repo.rglob("*"):
        if p.is_file() and p.suffix in SRC_EXT:
            rel = str(p.relative_to(repo))
            if not is_generated(rel):
                universe.add(p.resolve())

    # BFS out of claimed code
    seen: set[Path] = set(claimed)
    q = deque(claimed)
    edges = 0
    misses = 0
    while q:
        cur = q.popleft()
        tgts, m = imports_of(cur, repo, srcroots, pyroots, unresolved)
        misses += m
        for t in tgts:
            t = t.resolve()
            edges += 1
            if t in universe and t not in seen:
                seen.add(t)
                q.append(t)

    unclaimed = universe - claimed
    reachable = (seen - claimed) & unclaimed
    orphan = unclaimed - reachable
    import collections
    kinds = collections.Counter(classify_miss(u, repo_names) for u in unresolved)
    fp_miss = kinds["firstparty"]
    rate = 100 * edges // max(edges + fp_miss, 1)

    def rel(p: Path) -> str:
        return str(p.relative_to(repo))

    result = {
        "repo": repo.name,
        "claimed": len(claimed), "universe": len(universe),
        "unclaimed": len(unclaimed),
        "reachable_unclaimed": len(reachable),
        "orphan_unclaimed": len(orphan),
        "resolution_rate_pct": rate,
        "unresolved_imports": misses,
        "reachable_sample": sorted(rel(p) for p in reachable)[:40],
    }
    if as_json:
        print(json.dumps(result, indent=2))
        return 0

    print(f"ARCHMAP REACHABILITY — {repo.name}")
    print(f"  claimed by entity globs      {len(claimed):5d}")
    print(f"  source universe (non-generated){len(universe):4d}")
    print(f"  unclaimed                    {len(unclaimed):5d}")
    print()
    print(f"  REACHABLE-UNCLAIMED          {len(reachable):5d}   imported from claimed code — "
          f"used by the app, absent from the map")
    print(f"  ORPHAN-UNCLAIMED             {len(orphan):5d}   entry points, other surfaces, or dead")
    print()
    print(f"  FIRST-PARTY resolution rate  {rate:4d}%   ({edges} resolved, {fp_miss} first-party misses)")
    print(f"    excluded from the rate: {kinds['stdlib']} stdlib · {kinds['thirdparty']} third-party")
    fp = [u for u in unresolved if classify_miss(u, repo_names) == "firstparty"]
    if fp:
        top = collections.Counter(fp).most_common(6)
        print("    first-party misses: " + ", ".join(f"{k}×{v}" for k, v in top))
    if rate < 80:
        print("  ⚠ resolution below 80% — treat reachability as a floor, not a count")

    if "--list" in argv:
        print("\n  reachable-unclaimed:")
        for p in sorted(rel(x) for x in reachable):
            print(f"    {p}")
    else:
        print("\n  reachable-unclaimed, first 15:")
        for p in sorted(rel(x) for x in reachable)[:15]:
            print(f"    {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
