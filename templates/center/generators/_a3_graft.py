"""The graft-wiring arm — the center's TOPOLOGY provider (slice 5, landed).

The suite runs two graph programs over the same source: the spine's graft index
(``graft/.graph/wiring.json`` — calls/imports/contains edges over python+ts+tsx,
rebuilt by every /gabe-red beat) and this center's archmap (domain semantics —
entities, FK columns, HTTP surfaces, guards, tests). The 2026-08-12 gap analysis
settled the split: **graft owns topology, the archmap owns domain**, joined on
repo-relative file paths. This module is the join.

What it does, in order:
  * ``ensure_index`` — SELF-PROVISION: refresh the index with the red beat's exact
    recipe (``graft build`` then drop the hazardous repo-root ``.ignore``) whenever
    the binary exists, so "when is it updated" has one answer: every red beat AND
    every center regen. A dry-run sets ``allow_build=False`` and reads as-found —
    the build WRITES to the repo, and a twin's dirty tree must never be touched.
  * ``load_wiring`` — read + fingerprint the index (sha256 of the bytes — the file
    itself carries no git sha and no wallclock; byte-identical rebuilds are graft's
    own contract, so the hash IS the version).
  * ``derive_cross`` — resolve edge endpoints (node id = ``path#symbol``) to files,
    files to entities (``entities.<slug>.files``), and keep the CROSS-entity
    ``calls``/``imports`` pairs the FK derivation cannot see.

Honesty laws (same as ``_a3_graph``):
  * No index / no binary → ``None`` + a REASON string; the FK-only graph must build
    byte-identical to the pre-graft output (the battery pins this).
  * Cross-file call edges are confidence:"inferred" BY GRAFT'S DESIGN (its resolver
    matches unique bare names; every cross-file call is a heuristic hit) — so the
    counts carried here are labeled a FLOOR, never a census, and the extracted/
    inferred split rides the stats for any renderer that wants to show trust.
  * ``.js``/``.mjs``/``.jsx`` node paths are build-output noise in measured indexes
    (over half of gustify's) — excluded; ``node_modules``/``dist``/``build`` too.
  * An edge target that is not a node id (graft keeps raw import specifiers like
    "react" when unresolved) is skipped, never guessed.

Deterministic: sorted aggregation over an index graft itself writes sorted; the
fingerprint is content-derived; nothing here reads a clock.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

_INDEX_REL = Path("graft") / ".graph" / "wiring.json"
_NOISE_SUFFIXES = (".js", ".mjs", ".jsx")
_NOISE_PARTS = ("node_modules", "dist", "build", "storybook-static", "__pycache__")
_RELATIONS = ("calls", "imports")   # the cross-entity coupling kinds we consume


def ensure_index(root: Path, allow_build: bool = True,
                 timeout_s: int = 180) -> tuple[Path | None, str]:
    """Refresh-then-locate the wiring index. Returns (path-or-None, reason).

    The recipe is /gabe-red's, verbatim in spirit: build first — a warm rebuild is
    cheaper than asking whether the index is stale — then defuse the ``.ignore``
    graft writes at the repo root (it re-admits graft's own cards to ripgrep). The
    removal is scoped: only an ``.ignore`` that mentions graft is dropped — never
    a project's own file. Build failure degrades to the existing index (labeled
    stale) or to absence; it NEVER raises into the center build."""
    root = Path(root)
    idx = root / _INDEX_REL
    if not allow_build:
        return (idx, "as-found (build disabled)") if idx.exists() else (None, "no index (build disabled)")
    binary = shutil.which("graft")
    if not binary:
        return (idx, "as-found (no graft binary)") if idx.exists() else (None, "no graft binary")
    try:
        proc = subprocess.run([binary, "build"], cwd=root, capture_output=True,
                              text=True, timeout=timeout_s)
        ok = proc.returncode == 0
    except (subprocess.TimeoutExpired, OSError):
        ok = False
    ignore = root / ".ignore"
    try:  # the .ignore hazard — remove only when graft wrote it
        if ignore.exists() and "graft" in ignore.read_text(encoding="utf-8", errors="replace"):
            ignore.unlink()
    except OSError:
        pass
    if not idx.exists():
        return None, "build ran but no index" if ok else "build failed, no index"
    return idx, "rebuilt" if ok else "as-found (build failed, stale)"


def load_wiring(idx: Path) -> tuple[dict[str, Any], str]:
    """Read the index and fingerprint its bytes (sha256 → 12 hex chars)."""
    raw = Path(idx).read_bytes()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()[:12]


def _is_noise(path: str) -> bool:
    if path.endswith(_NOISE_SUFFIXES):
        return True
    parts = path.split("/")
    return any(p in _NOISE_PARTS for p in parts)


def _file_of(node_id: str) -> str:
    """Node ids are '<relpath>' (files) or '<relpath>#<symbol>'."""
    return node_id.split("#", 1)[0]


def derive_cross(wiring: dict[str, Any],
                 entities: dict[str, Any]) -> dict[str, Any]:
    """The cross-entity coupling slice: {(src_slug, dst_slug): {relation: count}}.

    Returns ``{"pairs": {...}, "stats": {...}}`` where pairs is keyed by the
    (src, dst) tuple and stats carries the honesty numbers (per-relation totals,
    the extracted/inferred trust split, and what was dropped as noise/unresolved
    — a silent cap reads as coverage, so nothing is dropped silently)."""
    file2slug: dict[str, str] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for row in code.get("files") or []:
            # archmap file rows are [layer, repo-relative-path, lines]
            if len(row) >= 2 and isinstance(row[1], str):
                file2slug.setdefault(row[1], slug)

    node_ids = {n["id"] for n in wiring.get("nodes") or []}
    pairs: dict[tuple[str, str], dict[str, int]] = {}
    conf = {r: {"extracted": 0, "inferred": 0} for r in _RELATIONS}
    dropped = {"noise": 0, "unresolved_target": 0, "unmapped_file": 0, "intra_entity": 0}

    for e in wiring.get("edges") or []:
        rel = e.get("relation")
        if rel not in _RELATIONS:
            continue
        src_id, dst_id = e.get("source"), e.get("target")
        if dst_id not in node_ids:              # raw external specifier ("react")
            dropped["unresolved_target"] += 1
            continue
        src_f, dst_f = _file_of(src_id), _file_of(dst_id)
        if _is_noise(src_f) or _is_noise(dst_f):
            dropped["noise"] += 1
            continue
        src_slug, dst_slug = file2slug.get(src_f), file2slug.get(dst_f)
        if src_slug is None or dst_slug is None:
            dropped["unmapped_file"] += 1       # outside the entity-mapped corpus
            continue
        if src_slug == dst_slug:
            dropped["intra_entity"] += 1        # L2 detail, not an L1 edge
            continue
        d = pairs.setdefault((src_slug, dst_slug), {})
        d[rel] = d.get(rel, 0) + 1
        c = e.get("confidence")
        if c in ("extracted", "inferred"):
            conf[rel][c] += 1

    return {
        "pairs": {k: dict(sorted(v.items())) for k, v in sorted(pairs.items())},
        "stats": {
            "cross_calls": sum(v.get("calls", 0) for v in pairs.values()),
            "cross_imports": sum(v.get("imports", 0) for v in pairs.values()),
            "confidence": conf,     # every cross-FILE call is inferred by design → a floor
            "dropped": dropped,
        },
    }


def graft_arm(root: Path, entities: dict[str, Any],
              allow_build: bool = True) -> dict[str, Any]:
    """The whole arm, one call: ensure → load → derive. NEVER raises.

    Returns ``{present, reason, index_hash?, index_nodes?, index_edges?,
    pairs?, stats?}`` — ``present=False`` carries only the reason, and the
    caller's FK-only output must be byte-identical to a graft-less build."""
    try:
        idx, reason = ensure_index(Path(root), allow_build=allow_build)
        if idx is None:
            return {"present": False, "reason": reason}
        wiring, fp = load_wiring(idx)
        meta = wiring.get("meta") or {}
        out = derive_cross(wiring, entities)
        return {
            "present": True, "reason": reason, "index_hash": fp,
            "index_nodes": meta.get("nodeCount"), "index_edges": meta.get("edgeCount"),
            "pairs": out["pairs"], "stats": out["stats"],
        }
    except Exception as exc:  # noqa: BLE001 — the arm enhances, never breaks, the build
        return {"present": False, "reason": f"graft arm error: {exc}"}
