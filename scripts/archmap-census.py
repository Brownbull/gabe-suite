#!/usr/bin/env python3
"""ARCHMAP CENSUS — how much of a repo does its command center actually map?

    python3 scripts/archmap-census.py <repo> [--list <bucket>] [--json]

READ-ONLY. Opens center.config.json and archmap.json, walks the tree, writes
nothing. Safe to run against a repo another session is working in.

WHY THIS EXISTS. Asked "what fraction of gustify is unmapped?", two honest
passes ten minutes apart answered 88% and 49% — same repo, same archmap. The
only thing that changed was which directories the measurer decided did not
count. A coverage number with an undeclared denominator is an opinion. So this
script never silently drops anything: every file lands in a labelled BUCKET and
every bucket is printed, including the ones you will decide are irrelevant.
You rule on the buckets; the script does not rule for you.

THREE SETS, THREE DEFECT CLASSES. Coverage is not one number:

    census   source files on disk, per bucket
    claimed  files matching some entity's `code` globs in center.config.json
    mapped   files actually present in archmap.json

    census - claimed   UNCLAIMED     no entity declares it; code_map() cannot
                                     see it and reports nothing (addition is
                                     silent, deletion is visible)
    mapped  - claimed  DRAGGED IN    present without being declared — it rode in
                                     on a test's imports via test_rx. Reads like
                                     coverage; is not
    claimed - mapped   DECLARED-DEAD a glob names a file that is not in the map:
                                     stale path, moved file, or a parse failure

A single "coverage %" hides all three. They have different fixes.
"""
from __future__ import annotations

import fnmatch
import json
import sys
from pathlib import Path

SRC_EXT = {".py", ".ts", ".tsx", ".js", ".jsx"}

# Vendored or machine-produced. These are the ONLY paths dropped before
# bucketing, and the count of what was dropped is always printed.
GENERATED = ("node_modules/", ".venv/", "venv/", "/dist/", "/build/",
             "__pycache__/", ".git/", "storybook-static/", "docs/site/",
             ".next/", "coverage/", "htmlcov/", ".pytest_cache/", ".ruff_cache/")

# Judgement calls are LABELS, not exclusions — the operator rules on each.
def bucket_of(rel: str) -> str:
    low = "/" + rel.lower()
    name = Path(rel).name.lower()
    if "/alembic/versions/" in low or "/migrations/" in low:
        return "migration"
    if (".test." in name or ".spec." in name or name.startswith("test_")
            or "/tests/" in low or "/__tests__/" in low or ".stories." in name
            or "e2e" in low):
        return "test"
    if low.startswith("/scripts/") or "/scripts/" in low or "/tools/" in low:
        return "script"
    if "/spikes/" in low or "/fixtures/" in low or "/mocks/" in low:
        return "scratch"
    return "app"


def load_json(p: Path):
    try:
        return json.loads(p.read_text())
    except Exception as exc:                      # noqa: BLE001 — reported, not raised
        print(f"  cannot read {p}: {exc}", file=sys.stderr)
        return None


def collect_mapped(archmap) -> set[str]:
    """Every file path the archmap references, wherever it nests."""
    out: set[str] = set()

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ("files", "test_files") and isinstance(v, list):
                    for row in v:
                        if isinstance(row, list) and len(row) >= 2 and isinstance(row[1], str):
                            out.add(row[1])
                        elif isinstance(row, str):
                            out.add(row)
                else:
                    walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(archmap)
    return {p for p in out if Path(p).suffix in SRC_EXT}


def collect_claimed(cfg, repo: Path) -> tuple[set[str], list[str]]:
    """Files matching any entity's `code` globs, and the globs that match nothing."""
    claimed: set[str] = set()
    dead_globs: list[str] = []
    for slug, ent in (cfg.get("entities") or {}).items():
        for layer, pats in (ent.get("code") or {}).items():
            for pat in pats if isinstance(pats, list) else [pats]:
                hits = [str(p.relative_to(repo)) for p in repo.glob(pat) if p.is_file()]
                if not hits:
                    dead_globs.append(f"{slug}.{layer}: {pat}")
                claimed.update(hits)
    return claimed, dead_globs


def main(argv: list[str]) -> int:
    args = [a for a in argv[1:]]
    if not args or args[0].startswith("-"):
        print(__doc__)
        return 1
    repo = Path(args[0]).expanduser().resolve()
    as_json = "--json" in args
    list_bucket = None
    if "--list" in args:
        i = args.index("--list")
        list_bucket = args[i + 1] if i + 1 < len(args) else "app"

    center = repo / "docs/site/center"
    cfg = load_json(center / "center.config.json")
    archmap = load_json(center / "archmap.json")
    if cfg is None or archmap is None:
        print(f"census: {repo.name} has no readable center at {center}")
        return 2

    census: dict[str, set[str]] = {}
    dropped = 0
    for p in repo.rglob("*"):
        if not p.is_file() or p.suffix not in SRC_EXT:
            continue
        rel = str(p.relative_to(repo))
        if any(g in "/" + rel for g in GENERATED):
            dropped += 1
            continue
        census.setdefault(bucket_of(rel), set()).add(rel)

    mapped = collect_mapped(archmap)
    claimed, dead_globs = collect_claimed(cfg, repo)
    all_census = set().union(*census.values()) if census else set()

    rows = []
    for b in ("app", "test", "script", "migration", "scratch"):
        files = census.get(b, set())
        if not files:
            continue
        rows.append({
            "bucket": b,
            "census": len(files),
            "claimed": len(files & claimed),
            "mapped": len(files & mapped),
            "unclaimed": len(files - claimed),
            "dragged_in": len((files & mapped) - claimed),
        })

    result = {
        "repo": repo.name,
        "dropped_generated": dropped,
        "buckets": rows,
        "declared_dead": sorted(claimed - mapped),
        "dead_globs": dead_globs,
        "mapped_outside_census": sorted(mapped - all_census),
    }

    if as_json:
        print(json.dumps(result, indent=2))
        return 0

    print(f"ARCHMAP CENSUS — {repo.name}")
    print(f"  denominator: {sum(len(v) for v in census.values())} source files "
          f"({'/'.join(sorted(SRC_EXT))}), {dropped} generated/vendored dropped")
    print(f"  buckets are LABELS — rule on them yourself; nothing here is excluded for you\n")
    print(f"  {'bucket':<10}{'census':>8}{'claimed':>9}{'mapped':>8}{'UNCLAIMED':>11}{'dragged-in':>12}")
    for r in rows:
        pct = 100 * r["unclaimed"] // max(r["census"], 1)
        print(f"  {r['bucket']:<10}{r['census']:>8}{r['claimed']:>9}{r['mapped']:>8}"
              f"{r['unclaimed']:>8} ({pct:>2}%){r['dragged_in']:>12}")

    print(f"\n  DECLARED-DEAD (a glob claims it, archmap lacks it): {len(result['declared_dead'])}")
    for f in result["declared_dead"][:8]:
        print(f"    {f}")
    if len(result["declared_dead"]) > 8:
        print(f"    … {len(result['declared_dead']) - 8} more")

    print(f"  GLOBS MATCHING NOTHING: {len(dead_globs)}")
    for g in dead_globs[:8]:
        print(f"    {g}")
    if len(dead_globs) > 8:
        print(f"    … {len(dead_globs) - 8} more")

    print(f"  MAPPED BUT OUTSIDE THE CENSUS: {len(result['mapped_outside_census'])}"
          f"  (generated, deleted, or a path shape the census does not model)")
    for f in result["mapped_outside_census"][:6]:
        print(f"    {f}")
    if len(result["mapped_outside_census"]) > 6:
        print(f"    … {len(result['mapped_outside_census']) - 6} more")

    if list_bucket:
        files = sorted(census.get(list_bucket, set()) - claimed)
        print(f"\n  UNCLAIMED in bucket '{list_bucket}' ({len(files)}):")
        for f in files:
            print(f"    {f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
