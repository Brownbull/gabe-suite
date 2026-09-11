#!/usr/bin/env python3
"""_a3_commits.py — recent git commits, each mapped to the graph ELEMENTS it touched.

A commit becomes a JOURNEY in the Gabe Universe picker (the "commits" kind): its
carriers are the current-graph nodes whose file the commit changed — a COVERAGE view
over the map ("what did this commit touch"), the historical mirror of the live sim
projection. Read-only, static-safe: the station never runs anything, it just walks the
touched set with the existing journey machinery.

Derivation (a function of (tree, head) — no wallclock, deterministic per commit):
  * ``git log -n N --no-merges`` → recent commits (sha · short · subject · date · author).
  * ``git log --numstat`` → the files that commit changed AND each file's (added, deleted).
  * one bounded ``git show --unified=0 <sha> -- <small files>`` per commit → the actual ± lines
    for files whose change is SMALL (``_SMALL`` lines), so the step panel can show a real
    side-by-side instead of a count. A big file carries its counts only — never truncated
    content pretending to be the whole change.
  * each file → the graph node ids homed to it (backend ``det.file`` · fe piece ``file``);
    a file with no represented node contributes nothing (honest — tests/config/docs drop).

A commit that touched a now-DELETED element shows fewer carriers — it is a coverage view
over the CURRENT map, not a time machine. The date BUCKET (today/this week/…) is computed
CLIENT-SIDE at view time, so this module emits only the raw ISO date.

Reuses ``_a3_sim`` git helpers (``_sh`` / ``_ok`` / ``_unrename``). No git → honest-empty
(``window.GABE_COMMITS = []``). commits.js is a beat-tail artifact, gitignored like
sim.data.js / inflight.{json,js} (gabe-init seeds it); it churns per commit.
Battery: tests/commits/run.sh (synthetic git repo + a stub graph).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import _a3_sim  # sibling — reuse the git subprocess + rename helpers (no duplication)

_SEP = "\x1f"  # unit separator — safe inside a subject, splits the log format


def _file_to_nodes(graph: dict[str, Any]) -> dict[str, list[str]]:
    """``{repo-relative file → [node id]}`` from the built c4 graph: backend nodes carry
    ``det.file``; every fe piece carries ``file``. One file can home many nodes."""
    idx: dict[str, list[str]] = {}
    for ent in (graph.get("l2") or {}).values():
        for node in ent.get("nodes") or []:
            f = (node.get("det") or {}).get("file")
            if f:
                idx.setdefault(f, []).append(node["id"])
    for piece in ((graph.get("fe") or {}).get("pieces") or []):
        f = piece.get("file")
        if f and piece.get("id"):
            idx.setdefault(f, []).append(piece["id"])
    return idx


_REC = "\x1e"  # record separator — marks each commit header in the --numstat stream
# The step panel shows a real side-by-side only when a file's change is small enough to READ;
# past that it shows the counts. Both are honest — the cap is a legibility budget, not a floor
# on the data (the counts are exact for every file, whatever its size).
_SMALL = 12        # max (added + deleted) for a file to carry its literal lines
_MAX_FILES = 6     # max small files per commit to fetch content for (one `git show`, bounded)
_MAX_LINES = 24    # hard cap on stored lines per file — a guard, never reached under _SMALL


def _hunk_lines(root: Path, sha: str, files: list[str]) -> dict[str, list[list[str]]]:
    """``{file → [["+"|"-", text], …]}`` for the given files of one commit, from a single
    ``git show --unified=0``. Content only — no hunk headers, no context. ``{}`` on any
    failure (the panel then shows counts alone)."""
    if not files:
        return {}
    out: dict[str, list[list[str]]] = {}
    try:
        txt = _a3_sim._sh(["git", "show", "--format=", "--unified=0", "--no-color",
                           "--no-renames", sha, "--", *files], root)
    except Exception:  # noqa: BLE001
        return {}
    cur = None
    for ln in txt.split("\n"):
        if ln.startswith("+++ b/"):
            cur = ln[6:].strip()
            out.setdefault(cur, [])
        elif ln.startswith("--- ") or ln.startswith("diff --git") or ln.startswith("@@"):
            continue
        elif cur and ln[:1] in ("+", "-") and len(out[cur]) < _MAX_LINES:
            out[cur].append([ln[0], ln[1:]])
    return {f: v for f, v in out.items() if v}


def build_commits(root: Path, graph: dict[str, Any], n: int = 30,
                  scan: int | None = None) -> list[dict] | None:
    """The most recent ``n`` commits that TOUCHED THE MAP, each with the node ids it
    touched. A commit that changed only tests/docs/config/spikes (nothing represented in
    the graph) has no coverage journey and is SKIPPED — so ``n`` counts map-touching
    commits, not raw commits. Scans up to ``scan`` (default max(n*20, 400)) raw commits in
    ONE ``git log --name-only`` pass (no per-commit subprocess). ``None`` on failure/no git.
    NEVER raises out."""
    try:
        root = Path(root)
        if not _a3_sim._ok(["git", "rev-parse", "--git-dir"], root):
            return None
        f2n = _file_to_nodes(graph)
        scan = scan or max(n * 20, 400)
        fmt = _REC + _SEP.join(["%H", "%h", "%s", "%aI", "%an"])
        stream = _a3_sim._sh(
            ["git", "log", "-n", str(scan), "--no-merges", "--numstat", "--no-renames",
             f"--format={fmt}"], root)
        kept: list[dict] = []
        for chunk in stream.split(_REC):
            chunk = chunk.strip("\n")
            if not chunk:
                continue
            lines = chunk.split("\n")
            head = lines[0].split(_SEP)
            if len(head) < 5:
                continue
            sha, short, subject, date, author = head[:5]
            # --numstat rows are `added \t deleted \t path`; a binary file reports `-  -`
            stat: dict[str, list[int]] = {}
            for row in lines[1:]:
                if not row.strip():
                    continue
                parts = row.split("\t")
                if len(parts) < 3:
                    continue
                f = _a3_sim._unrename(parts[2])
                a, d = parts[0], parts[1]
                stat[f] = [-1, -1] if (a == "-" or d == "-") else [int(a or 0), int(d or 0)]
            files = sorted(stat)
            touched = sorted({nid for f in files for nid in f2n.get(f, [])})
            if not touched:
                continue                       # changed nothing on the map → no coverage journey
            # only files the MAP represents can ever be a journey step — never fetch content
            # for a file no step can show (keeps the `git show` bounded and the feed honest)
            mapped = [f for f in files if f2n.get(f)]
            small = [f for f in mapped
                     if stat[f] != [-1, -1] and sum(stat[f]) <= _SMALL][:_MAX_FILES]
            content = _hunk_lines(root, sha, small)
            diffs = {f: ({"a": stat[f][0], "d": stat[f][1]}
                         | ({"lines": content[f]} if f in content else {}))
                     for f in mapped}
            kept.append({"sha": sha, "short": short, "subject": subject, "date": date,
                         "author": author, "touched": touched, "diffs": diffs,
                         "nFiles": len(files), "nTouched": len(touched),
                         "add": sum(v[0] for v in stat.values() if v[0] > 0),
                         "del": sum(v[1] for v in stat.values() if v[1] > 0)})
            if len(kept) >= n:
                break
        return kept
    except Exception:  # noqa: BLE001 — the arm enhances, never breaks, the build
        return None


def emit(commits: list[dict] | None, out_dir: Path) -> None:
    p = Path(out_dir) / "commits.js"
    if not commits:
        p.write_text("// no git history / no touched elements — honest-empty\n"
                     "window.GABE_COMMITS = [];\n", encoding="utf-8")
        return
    p.write_text("window.GABE_COMMITS = " + json.dumps(commits, ensure_ascii=False,
                 separators=(",", ":")) + ";\n", encoding="utf-8")
