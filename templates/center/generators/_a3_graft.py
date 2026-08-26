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
# P1 (graft adoption): consume ALL of graft's edge relations, not just calls/imports.
# contains = file→symbol (a file's API); extends/implements = the type hierarchy;
# references = a cross-file symbol use. contains is intra-file → intra-entity (drops out
# of the L1 cross set); the rest surface real cross-entity coupling the FK view can't see.
_RELATIONS = ("calls", "imports", "contains", "extends", "implements", "references")


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
    _defuse_ignore(root)
    if not idx.exists():
        return None, "build ran but no index" if ok else "build failed, no index"
    return idx, "rebuilt" if ok else "as-found (build failed, stale)"


# The exact entries graft's ensureSearchable APPENDS to a repo-root .ignore —
# the `!graft/` re-admit is the ripgrep hazard. Only THESE lines (plus graft's
# own comment lines) are ever removed; user-authored lines always survive.
_GRAFT_IGNORE_LINES = {"!graft/", "graft/.cache/", "graft/.graph/"}


def _defuse_ignore(root: Path) -> None:
    """Surgically strip graft's appended block from the repo-root ``.ignore``.

    The first cut of this function unlinked any ``.ignore`` whose text mentioned
    graft — which would have deleted a USER'S file (e.g. one hiding the 21MB
    ``graft/`` cache from ripgrep, plus their other lines) on every regen. Now:
    drop only graft's own entries and graft-mentioning comment lines, keep every
    other line byte-for-byte, and unlink only when nothing non-blank remains.
    Runs after every build attempt (a failed build may still have written the
    block); never raises."""
    ignore = root / ".ignore"
    try:
        if not ignore.exists():
            return
        kept, dropped = [], 0
        for line in ignore.read_text(encoding="utf-8", errors="replace").splitlines():
            s = line.strip()
            if s in _GRAFT_IGNORE_LINES or (s.startswith("#") and "graft" in s.lower()):
                dropped += 1
                continue
            kept.append(line)
        if not dropped:
            return                                  # nothing of graft's here
        if any(l.strip() for l in kept):
            ignore.write_text("\n".join(kept) + "\n", encoding="utf-8")
        else:
            ignore.unlink()
    except OSError:
        pass


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


def _file2slug(entities: dict[str, Any]) -> dict[str, str]:
    """Map every archmap-listed file to its owning entity (first claim wins)."""
    f2s: dict[str, str] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for row in code.get("files") or []:
            if len(row) >= 2 and isinstance(row[1], str):
                f2s.setdefault(row[1], slug)
    return f2s


def derive_functions(wiring: dict[str, Any],
                     entities: dict[str, Any]) -> dict[str, Any]:
    """The function-level slice the LEVELS graph draws: every graft FUNCTION node homed
    to its entity (``id`` = ``path#symbol``, homed by file → entity) + the ``calls``
    edges between two homed functions. ``_a3_levels`` selects the trace-relevant subset
    (cross-entity callers/callees + model users) and clusters on it. Honest: a call whose
    endpoints don't both map to entities is dropped (counted), never guessed."""
    f2s = _file2slug(entities)
    fn_slug: dict[str, str] = {}
    for n in wiring.get("nodes") or []:
        if n.get("kind") != "function":
            continue
        f = _file_of(n["id"])
        if _is_noise(f):
            continue
        slug = f2s.get(f)
        if slug:
            fn_slug[n["id"]] = slug
    calls: list[dict[str, Any]] = []
    for e in wiring.get("edges") or []:
        if e.get("relation") != "calls":
            continue
        s, t = e.get("source"), e.get("target")
        if s in fn_slug and t in fn_slug and s != t:
            calls.append({"s": s, "t": t, "ss": fn_slug[s], "ts": fn_slug[t],
                          "conf": e.get("confidence", "inferred")})
    calls.sort(key=lambda c: (c["ss"], c["ts"], c["s"], c["t"]))
    return {"fn_slug": fn_slug, "calls": calls}


_BEHIND_DEPTH_CAP = 40   # observed max call-tree depth ~19 on gustify; guards a pathological graph
_BEHIND_NAMES_CAP = 12   # the panel shows up to this many fn names behind a handler, then "+N"


# the graft node kinds that carry a call-tree (callable code). P1: METHODS were dropped from
# the hidden-mass metric — a class method calls things too, so include them. Correct-by-design;
# the measured impact is INDEX-DEPENDENT and can be small (gustify carries 211 method nodes, 194
# in-set → max endpoint behind unchanged, per-endpoint deltas <=2). classes/types/interfaces
# are not callable, so they never enter the call-tree set.
_CALLABLE_KINDS = ("function", "method")


def _behind_context(wiring: dict[str, Any]) -> tuple[set[str], dict[str, list[str]]]:
    """The shared substrate for the call-tree floor: (callable-node id set, ``calls``
    adjacency between them). NOISE-FILTERED like ``derive_functions`` — build-output nodes
    (``.js``/``dist``/… — over half a measured index) never count, so a call INTO bundle.js
    never inflates the floor. Callable = function OR method (P1 correctness fix)."""
    fn_ids = {n["id"] for n in (wiring.get("nodes") or [])
              if n.get("kind") in _CALLABLE_KINDS and not _is_noise(_file_of(n["id"]))}
    adj: dict[str, list[str]] = {}
    for e in wiring.get("edges") or []:
        if e.get("relation") == "calls":
            s, t = e.get("source"), e.get("target")
            if s in fn_ids and t in fn_ids:   # both ends real source functions
                adj.setdefault(s, []).append(t)
    return fn_ids, adj


def _behind_of(start: str, adj: dict[str, list[str]]) -> dict[str, Any]:
    """BFS the call-tree behind ``start`` → ``{fns, depth, names?, names_more?, truncated?}``.

    ``fns`` = distinct transitive callees (excl. self); ``depth`` = BFS layers = the
    shortest-path eccentricity of the reachable set (a cheap honest depth, not the NP-hard
    longest path); ``truncated: True`` rides ONLY when the depth cap clipped the walk (no
    silent caps). ``names`` = the NAMED callees (short symbol, sorted, capped) — free, the
    BFS already visited them. Deterministic: depends only on reachability, never edge order."""
    seen = {start}
    frontier = [start]
    depth = 0
    while frontier and depth < _BEHIND_DEPTH_CAP:
        nxt: list[str] = []
        for u in frontier:
            for v in adj.get(u) or ():
                if v not in seen:
                    seen.add(v)
                    nxt.append(v)
        if not nxt:
            break
        frontier = nxt
        depth += 1
    res: dict[str, Any] = {"fns": len(seen) - 1, "depth": depth}
    names = sorted({s.split("#", 1)[1] for s in seen if s != start and "#" in s})
    if names:
        res["names"] = names[:_BEHIND_NAMES_CAP]
        if len(names) > _BEHIND_NAMES_CAP:
            res["names_more"] = len(names) - _BEHIND_NAMES_CAP
    if frontier and depth >= _BEHIND_DEPTH_CAP:   # the cap clipped a deeper walk
        res["truncated"] = True
    return res


def derive_behind(wiring: dict[str, Any],
                  entities: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Per API endpoint, the graft call-tree FLOOR behind its handler: ``{fns, depth, names}``.

    A view-only complexity signal — NOT a rail. Keyed by the handler's wiring id
    ``<file>#<fn>`` so ``_a3_graph`` attaches it to the endpoint node by the same key. Honest
    by construction: an endpoint whose handler is not an indexed source function gets NO entry
    (never a guess). Cheap — one BFS per endpoint over the ``calls`` adjacency; keys sorted."""
    fn_ids, adj = _behind_context(wiring)
    out: dict[str, dict[str, Any]] = {}
    for ent in entities.values():
        if not ent:                       # a slug with no code map (dict|None) — the sibling guard
            continue
        for ep in ent.get("endpoints") or []:
            f, fn = ep.get("file"), ep.get("fn")
            if not f or not fn:
                continue
            key = f"{f}#{fn}"
            if key in fn_ids and key not in out:
                out[key] = _behind_of(key, adj)
    return {k: out[k] for k in sorted(out)}


def derive_fn_behind(wiring: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """The call-tree floor behind EVERY call-source FUNCTION (not just endpoint handlers) —
    the operator's "every drawn node carries its hidden mass" intent (2026-08-14): what
    functions THIS function pulls in transitively, the ones put "under the rug" by it. Keyed
    by the function's wiring id ``<file>#<fn>``; computed only for functions that call
    something (a leaf fn has fns:0 and gets NO entry — honest, the panel omits the section).
    Same BFS / noise-filter / caps as ``derive_behind``. Deterministic: keys sorted."""
    _fn_ids, adj = _behind_context(wiring)
    out = {s: _behind_of(s, adj) for s in adj if adj.get(s)}
    return {k: out[k] for k in sorted(out)}


def derive_endpoint_access(wiring: dict[str, Any], entities: dict[str, Any],
                           faccess: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    """Per API endpoint, the ORM data-access reachable THROUGH its handler's call-tree:
    ``{<file>#<fn> → {'ops':[{model,table,rw}], 'commits'}}``. ``faccess`` is
    ``{'<file>::<qual>': {ops,commits}}`` from _a3_code.function_insight (the C2 AST pass).

    graft cannot see session.add/select itself, but it DOES resolve the fn→fn calls; so the
    write the handler delegates to a service surfaces by UNIONING each reached function's
    access. TRUST: the in-file idiom→model binding inside ``faccess`` is census; the call-tree
    REACH here is graft's ``calls`` (an inferred FLOOR — cross-file calls are inferred by
    design). Honest-empty: a handler graft can't resolve, or whose tree touches no data, gets
    NO entry (never a guess). Keyed like ``derive_behind`` so _a3_graph joins on the same key."""
    if not faccess:
        return {}
    fn_ids, adj = _behind_context(wiring)
    out: dict[str, dict[str, Any]] = {}
    for ent in entities.values():
        if not ent:                       # a slug with no code map — the sibling guard
            continue
        for ep in ent.get("endpoints") or []:
            f, fn = ep.get("file"), ep.get("fn")
            if not f or not fn:
                continue
            key = f"{f}#{fn}"
            if key not in fn_ids or key in out:
                continue
            seen = {key}
            frontier = [key]
            depth = 0
            while frontier and depth < _BEHIND_DEPTH_CAP:      # the handler + its transitive callees
                nxt: list[str] = []
                for u in frontier:
                    for v in adj.get(u) or ():
                        if v not in seen:
                            seen.add(v)
                            nxt.append(v)
                if not nxt:
                    break
                frontier = nxt
                depth += 1
            ops: dict[tuple, dict] = {}
            commits = False
            for fid in seen:                                   # graft id <file>#<fn> → function_insight <file>::<fn>
                a = faccess.get(fid.replace("#", "::", 1))
                if not a:
                    continue
                if a.get("commits"):
                    commits = True
                for o in a.get("ops") or []:
                    ops[(o["model"], o["rw"])] = {"model": o["model"], "table": o["table"], "rw": o["rw"]}
            if ops or commits:
                out[key] = {"ops": sorted(ops.values(), key=lambda x: (x["rw"], x["model"])),
                            "commits": commits}
    return {k: out[k] for k in sorted(out)}


def derive_cross(wiring: dict[str, Any],
                 entities: dict[str, Any]) -> dict[str, Any]:
    """The cross-entity coupling slice: {(src_slug, dst_slug): {relation: count}}.

    Returns ``{"pairs": {...}, "stats": {...}}`` where pairs is keyed by the
    (src, dst) tuple and stats carries the honesty numbers (per-relation totals,
    the extracted/inferred trust split, and what was dropped as noise/unresolved
    — a silent cap reads as coverage, so nothing is dropped silently)."""
    file2slug: dict[str, str] = {}
    collisions = 0
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for row in code.get("files") or []:
            # archmap file rows are [layer, repo-relative-path, lines]
            if len(row) >= 2 and isinstance(row[1], str):
                if row[1] in file2slug and file2slug[row[1]] != slug:
                    collisions += 1              # a file two entities claim — visible, not silent
                file2slug.setdefault(row[1], slug)

    node_ids = {n["id"] for n in wiring.get("nodes") or []}
    pairs: dict[tuple[str, str], dict[str, int]] = {}
    conf = {r: {"extracted": 0, "inferred": 0} for r in _RELATIONS}
    dropped = {"noise": 0, "unresolved_target": 0, "unmapped_file": 0, "intra_entity": 0}
    # EVIDENCE for the drop counters: top dropped path prefixes per reason — a bare
    # integer cannot distinguish "storybook output correctly excluded" from "my whole
    # backend was classified as noise"; three prefixes can.
    _prefix_hits: dict[str, dict[str, int]] = {"noise": {}, "unmapped_file": {}}

    def _hit(reason: str, path: str) -> None:
        d = _prefix_hits.get(reason)
        if d is not None:
            pre = "/".join(path.split("/")[:2]) or path
            d[pre] = d.get(pre, 0) + 1

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
            _hit("noise", dst_f if _is_noise(dst_f) else src_f)
            continue
        src_slug, dst_slug = file2slug.get(src_f), file2slug.get(dst_f)
        if src_slug is None or dst_slug is None:
            dropped["unmapped_file"] += 1       # outside the entity-mapped corpus
            _hit("unmapped_file", src_f if src_slug is None else dst_f)
            continue
        if src_slug == dst_slug:
            dropped["intra_entity"] += 1        # L2 detail, not an L1 edge
            continue
        d = pairs.setdefault((src_slug, dst_slug), {})
        d[rel] = d.get(rel, 0) + 1
        c = e.get("confidence")
        if c in ("extracted", "inferred"):
            conf[rel][c] += 1

    top_prefixes = {r: dict(sorted(h.items(), key=lambda kv: (-kv[1], kv[0]))[:3])
                    for r, h in _prefix_hits.items() if h}
    return {
        "pairs": {k: dict(sorted(v.items())) for k, v in sorted(pairs.items())},
        "stats": {
            "cross_calls": sum(v.get("calls", 0) for v in pairs.values()),
            "cross_imports": sum(v.get("imports", 0) for v in pairs.values()),
            # P1: the full cross-entity total per relation (all 6 now consumed), so the honesty
            # numbers show extends/implements/references coupling, not just calls/imports.
            "cross_by_relation": {r: sum(v.get(r, 0) for v in pairs.values()) for r in _RELATIONS},
            "confidence": conf,     # every cross-FILE call is inferred by design → a floor
            "dropped": dropped,
            "dropped_top_prefixes": top_prefixes,
            "file_entity_collisions": collisions,
        },
    }


def derive_node_facts(wiring: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Per non-noise node, the RAW graft facts the center can consume instead of re-deriving
    from source: ``kind`` · ``signature`` (the def/class line, populated on 87-90% of nodes) ·
    ``exported``. Keyed by the wiring id (``path#symbol`` or a bare file path). P1 (graft
    adoption): this is what lets a downstream generator DROP its function_insight signature
    re-parse — the string graft already stores is right here. In-process data (not emitted raw
    to the committed graph — it would bloat it); the consumer reads it during the build."""
    out: dict[str, dict[str, Any]] = {}
    for n in wiring.get("nodes") or []:
        nid = n.get("id")
        if not nid or _is_noise(_file_of(nid)):
            continue
        fact: dict[str, Any] = {"kind": n.get("kind")}
        sig = n.get("signature")
        if sig and sig != "None":
            fact["signature"] = sig
        if str(n.get("exported")) == "True":
            fact["exported"] = True
        out[nid] = fact
    return {k: out[k] for k in sorted(out)}


_FE_TYPE_KINDS = ("interface", "type")

# the TS→TS relations the frontend topology DRAWS (composition): a piece imports / calls / references
# another. graft also emits `contains` (file→symbol nesting) + `extends`/`implements` (type hierarchy);
# those are structure, not composition, so they stay OUT of the edge set derive_frontend promises. NOT
# the P1a render whitelist (that dropped `references` as a calls-duplicate at the L1 aggregate) — at
# piece level `references` IS the component-uses-component edge, kept lossless for P2b to dedup at render.
_FE_EDGE_RELATIONS = ("imports", "calls", "references")


def _is_scaffold(path: str) -> bool:
    """Dev-time TS that is NOT shipped app structure: Storybook stories, /spikes/ prototypes, and
    test/mock/fixture files. graft indexes the SOURCE (so it escapes _is_noise, which drops only
    build output like .js/dist/storybook-static), but a frontend STRUCTURE map that counted it would
    misreport the app — P2a review measured 486/2040 (23.8%) of gustify's classified pieces as
    scaffold. Frontend-LOCAL by design: _is_noise is shared by the whole graft arm; this is not."""
    stem = path.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    return (
        "/spikes/" in path or stem.endswith("Spike")
        or ".stories." in path or ".test." in path or ".spec." in path
        or "__tests__/" in path or "__mocks__/" in path
        or "/fixtures/" in path or "/e2e/" in path or ".e2e." in path
    )


def _fe_classify(node: dict[str, Any]) -> str | None:
    """The frontend KIND of a graft TS node — convention-based (P2a). None = not a frontend piece.
    Precedence: fe-type → hook → store → route → component. graft's generic AST can't see JSX or a
    call-initialized const, so the classification is by NAME/PATH convention (honest, refinable later).

    Two deliberate asymmetries (P2a review): (1) component/hook/route/fe-type gate on symbol KIND so a
    graft `file` container never double-counts the symbol it holds — 7 route FILE nodes were doubling
    their route functions. (2) `store` does NOT gate on kind: graft emits no symbol for a `create()`/
    `createContext()` const, so the *file* it lives in (named *Store/*Context) is the only signal there
    is. That makes store a FLOOR, not a census — a Zustand `useUiStore` in `store/ui.ts` (a file NOT
    named *Store) is invisible until a suite framework parse adds it."""
    kind = node.get("kind")
    name = node.get("name") or ""
    path = node.get("path") or ""
    low = name.lower()
    if kind in _FE_TYPE_KINDS:
        return "fe-type"
    if kind == "function" and len(name) > 3 and name.startswith("use") and name[3:4].isupper():
        return "hook"
    # store: a name ENDING in Store/Context (not a substring — `restoreNormalMode`/`updateStoredPortions`
    # are not stores), a *store.ts file, or a createContext(). base strips a trailing .ts/.tsx. NO kind
    # guard — a store/context const has no graft symbol, so its FILE node is the piece (the floor above).
    base = name.rsplit(".", 1)[0] if name.endswith((".ts", ".tsx")) else name
    if base.endswith(("Store", "store", "Context")) or "createcontext" in low:
        return "store"
    # route + component: SYMBOL-level only (kind function/class) — a graft `file` node is a container,
    # not a piece, and would double-count the symbol it holds. route: a *Route/*Router symbol, or a
    # Cap-named .tsx UNDER routes/ (not every helper in routes/).
    if kind in ("function", "class"):
        if name.endswith(("Route", "Router")) or ("/routes/" in path and path.endswith(".tsx") and name[:1].isupper()):
            return "route"
        if path.endswith(".tsx") and name[:1].isupper():
            return "component"
    return None


# feature-dir → entity slug where the folder name differs from the slug. Everything
# else is identity (features/cooking → cooking) or resolves to a bucket below.
_FEAT2ENT = {"legal": "legal-consent", "recipes": "recipe"}


def _fe_home(path: str, entity_slugs: frozenset[str]) -> tuple[str, bool]:
    """Where a frontend piece belongs (P2b, re-keyed by the C SPLIT — operator ruling
    2026-08-23): the frontend is a SEPARATE estate. A feature matching a backend entity
    homes to ``fe·<entity>`` — a sibling entity PAIRED to its backend twin (the pairing
    rides ``_fe_pair``), never folded into it (pantry measured 73% frontend / cooking
    91% — one hull was unreadable). A feature the backend never modeled stays a
    candidate under its own name; shared code keeps its buckets. Returns
    (home, is_candidate)."""
    parts = path.split("/")
    rest = parts[parts.index("src") + 1:] if "src" in parts else []
    head = rest[0] if rest else ""
    if head == "features" and len(rest) > 1:
        feat = rest[1]
        ent = _FEAT2ENT.get(feat, feat)
        if ent in entity_slugs:
            return ("fe·" + ent, False)  # the backend twin exists → the PAIRED fe entity
        return (feat, True)              # a feature the backend never modeled → candidate entity
    if head in entity_slugs:
        return ("fe·" + head, False)     # a top-level dir that IS an entity (e.g. auth/)
    if head == "design-system":
        return ("design-system", False)  # the shared component kit — its own bucket
    return ("app-shell", False)          # routes · lib · i18n · layout · loose types — structural


def _fe_pair(home: str) -> str | None:
    """The backend twin of a paired fe home (``fe·pantry`` → ``pantry``); None for
    buckets and candidates. The pairing key every reader joins on."""
    return home[3:] if home.startswith("fe·") else None


def derive_frontend(wiring: dict[str, Any],
                    entity_slugs: frozenset[str] = frozenset()) -> dict[str, Any]:
    """P2a: classify graft's TS/tsx nodes into frontend KINDS (hook · component · store · route ·
    fe-type) + carry the TS→TS composition edges (imports/calls/references between two classified
    pieces). P2b: HOME each piece to a backend entity or an FE-native bucket (see _fe_home), and carry
    the SCAFFOLD set SEPARATELY so a render toggle can re-admit it. Convention-based, NOISE-filtered,
    honest-empty when a repo has no TS. `store` is a name-convention FLOOR (call-initialized create()/
    createContext() consts are invisible to graft — see _fe_classify). DATA only — the render draws it;
    ``nodes``/``stats.total`` are the SHIPPED app (scaffold excluded); ``scaffold`` is the dimmable layer."""
    shipped: dict[str, dict[str, Any]] = {}
    scaffold: dict[str, dict[str, Any]] = {}
    candidates: dict[str, int] = {}      # feature namespaces with no backend entity → piece count
    for n in wiring.get("nodes") or []:
        p = n.get("path") or ""
        nid = n.get("id")
        if not nid or not p.endswith((".ts", ".tsx")) or _is_noise(_file_of(nid)):
            continue
        k = _fe_classify(n)
        if not k:
            continue
        home, cand = _fe_home(p, entity_slugs)
        rec = {"id": nid, "name": n.get("name"), "kind": k, "path": p, "home": home}
        if _is_scaffold(p):
            scaffold[nid] = rec
        else:
            shipped[nid] = rec
            if cand:
                candidates[home] = candidates.get(home, 0) + 1
    ids = set(shipped)
    edges = sorted(
        ({"s": e["source"], "t": e["target"], "rel": e.get("relation")}
         for e in (wiring.get("edges") or [])
         if e.get("source") in ids and e.get("target") in ids and e["source"] != e["target"]
         and e.get("relation") in _FE_EDGE_RELATIONS),
        key=lambda x: (x["s"], x["t"], str(x["rel"])))
    by_kind: dict[str, int] = {}
    by_home: dict[str, int] = {}
    for v in shipped.values():
        by_kind[v["kind"]] = by_kind.get(v["kind"], 0) + 1
        by_home[v["home"]] = by_home.get(v["home"], 0) + 1
    by_rel: dict[str, int] = {}
    for x in edges:
        by_rel[x["rel"]] = by_rel.get(x["rel"], 0) + 1
    sc_by_kind: dict[str, int] = {}
    for v in scaffold.values():
        sc_by_kind[v["kind"]] = sc_by_kind.get(v["kind"], 0) + 1
    return {
        "nodes": [shipped[k] for k in sorted(shipped)],
        "edges": edges,
        "scaffold": [scaffold[k] for k in sorted(scaffold)],
        "stats": {"total": len(shipped), "by_kind": dict(sorted(by_kind.items())),
                  "by_home": dict(sorted(by_home.items())),
                  "edges": len(edges), "by_relation": dict(sorted(by_rel.items())),
                  "scaffold_total": len(scaffold), "scaffold_by_kind": dict(sorted(sc_by_kind.items())),
                  "candidate_entities": [{"name": k, "pieces": candidates[k]} for k in sorted(candidates)]},
    }


def graft_arm(root: Path, entities: dict[str, Any],
              allow_build: bool = True,
              faccess: dict[str, Any] | None = None) -> dict[str, Any]:
    """The whole arm, one call: ensure → load → derive. NEVER raises.

    Returns ``{present, reason, index_hash?, index_nodes?, index_edges?,
    pairs?, stats?}`` — ``present=False`` carries only the reason, and the
    caller's FK-only output must be byte-identical to a graft-less build."""
    try:
        idx, reason = ensure_index(Path(root), allow_build=allow_build)
        if idx is None:
            return {"present": False, "reason": reason}
        try:
            wiring, fp = load_wiring(idx)
        except (json.JSONDecodeError, UnicodeDecodeError):
            # a truncated/corrupt index (graft writes non-atomically; a timeout can
            # kill it mid-write) — name the STATE, never leak a parser traceback
            # into the committed stats. The next successful build self-heals it.
            return {"present": False, "reason": "index unreadable (corrupt or truncated)"}
        meta = wiring.get("meta") or {}
        out = derive_cross(wiring, entities)
        fout = derive_functions(wiring, entities)
        behind = derive_behind(wiring, entities)   # {<file>#<fn> → {fns, depth}} per endpoint handler
        endpoint_access = derive_endpoint_access(wiring, entities, faccess)  # A2: ORM access via the call-tree
        fn_behind = derive_fn_behind(wiring)       # {<file>#<fn> → {fns, depth}} per CALL-SOURCE function
        node_facts = derive_node_facts(wiring)     # P1: {id → {kind, signature?, exported?}} — raw facts to consume
        frontend = derive_frontend(wiring, frozenset(entities))  # P2a classify + P2b home/scaffold, data-only
        return {
            "present": True, "reason": reason, "index_hash": fp,
            "index_nodes": meta.get("nodeCount"), "index_edges": meta.get("edgeCount"),
            "pairs": out["pairs"], "stats": out["stats"],
            "functions": fout,   # {fn_slug, calls} — the fn-level slice the LEVELS graph draws
            "behind": behind,    # the endpoint call-tree floor (a view-only complexity signal)
            "endpoint_access": endpoint_access,  # A2: per-endpoint ORM read/write ops via the call-tree
            "fn_behind": fn_behind,  # the per-function call-tree floor (the hidden mass a fn pulls in)
            "node_facts": node_facts,  # P1: raw graft facts (kind/signature/exported) — in-process, not emitted raw
            "frontend": frontend,      # P2a: classified TS frontend structure {nodes,edges,stats} — data-only
        }
    except Exception as exc:  # noqa: BLE001 — the arm enhances, never breaks, the build
        return {"present": False, "reason": f"graft arm error: {exc}"}
