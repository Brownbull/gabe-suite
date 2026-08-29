"""The FRONTEND arm — the frontend modeled the way the backend is: typed PIECES + resolved
EDGES, honest-empty.

Provider = the TypeScript COMPILER (``_a3_fe_extract.mjs`` run against the twin's own
``typescript``): exported symbols with their kind + JSX/hook proof, the body REFS of each
(jsx tags · calls · type refs · identifiers), and import BINDINGS the checker resolved
(barrels followed). This module classifies every exported symbol into ONE kind and wires
pieces by resolving each ref through its binding:

    kind        proof                                   edge (from the referrer)
    component   Pascal export whose body holds JSX      renders        (jsx tag)
    hook        `useX` function export                  uses-hook      (call)
    store       create()/createContext()/atom() const   uses-store     (call · useContext(X))
                or a `useXStore` hook
    route       router config / *Route component        renders
    fe-type     type · interface · enum                 typed          (type ref)
    module      ONE piece per file of plain value        fecall         (call)  · imports (ident)
                exports (feature logic, lib, api)

Measured on gustify 2026-08-23 (P0, docs/design/frontend-model/README.md §9): the
compiler proves 458 JSX components where graft's name convention claimed 637, and resolves
2,290 import pairs where graft carries 891 (38.9%) — hence the compiler is the provider and
graft stays the cross-file CALL contributor elsewhere. Stories/tests are EXCLUDED and
counted; barrels yield no piece (bindings see through them); a Pascal `.tsx` export without
JSX is counted (``pascal_no_jsx``), never silently dropped.

Honest-empty: no web root · ``GABE_FE_EXTRACT=0`` · no ``node`` · no ``typescript`` · an
extractor/parse failure → ``{present: False, reason}`` and the caller's GABE_C4 stays
byte-identical (the arm rides a SEPARATE top-level ``fe`` key; see _a3_graph.fold_fe).
READ-ONLY: the extractor never writes into the twin; its JSON goes to a temp file.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from _a3_web import _detect_web_root          # the same web-root roster as the fetch arm
from _a3_graft import _fe_home, _fe_pair      # feature-dir → fe·entity (paired) / bucket / candidate

EXTRACTOR = Path(__file__).with_name("_a3_fe_extract.mjs")

_STORE_CALLEES = frozenset({
    "create", "createStore", "createContext", "createSlice", "configureStore", "atom",
    "atomWithStorage", "atomFamily", "signal", "observable", "makeAutoObservable", "proxy",
    "createSignal", "writable", "readable",
})
_ROUTER_CALLEES = frozenset({
    "createBrowserRouter", "createHashRouter", "createMemoryRouter", "createRouter",
    "createFileRoute", "createRootRoute", "createRoutesFromElements",
})
# server-CACHE / query-library hooks (react-query · swr · apollo): a piece that CALLS one READS or
# WRITES the server cache = state (F1). A LIBRARY idiom, not a project name-list (same class as
# _STORE_CALLEES) — and it counts ONLY when the callee has no project binding, since a project's own
# useQuery would resolve to a piece; so honest-empty holds (no query lib → no cache piece → byte-
# identical). RTK-Query's generated useGetXQuery/useXMutation hooks are pattern-named, not in this
# fixed roster — a known follow-on gap, reported never guessed.
_CACHE_CALLEES = frozenset({
    "useQuery", "useQueries", "useInfiniteQuery", "useSuspenseQuery", "useSuspenseQueries",
    "useSuspenseInfiniteQuery", "useMutation", "useMutationState", "useLazyQuery",
    "useSWR", "useSWRInfinite", "useSWRMutation", "useSWRSubscription",
})
_TYPE_KINDS = frozenset({"type", "interface", "enum"})
# design SCAFFOLD, not the app (batch 50, measured on gustify): /spikes/ (122 pieces) and
# /showcase/ (4) had ZERO app in-edges — excluded and counted. Fixture modules
# (recipeFixtures, activeShowcaseFixtures) and lib/mockupAssets are APP-WIRED (real screens
# import them — 8 + 90 edges measured) and STAY. Stories/tests were already excluded.
_SCAFFOLD_PATH = ("/spikes/", "/showcase/")
_HOOK_RX = re.compile(r"^use[A-Z0-9]")
_FIXTURE_RX = re.compile(r"(?:^|/)(?:[A-Za-z]*[Ff]ixtures?|mockupAssets)\.tsx?$")


def _area_of(path: str, home: str = "") -> str:
    """The piece's AREA — the sub-directory group inside its home (S2, batch 53): up to two
    path segments between the segments the HOME consumed and the file. `cooking/components/
    recipes/X` → ``components/recipes``; a root-level file → ``root``. The synthetic app-shell
    home consumed NOTHING, so rest[0] is the discriminator there — dropping it merged
    lib/utils with routes/utils (review 53[6]). The capsule level renders these."""
    parts = path.split("/")
    rest = parts[parts.index("src") + 1:] if "src" in parts else parts
    if rest and rest[0] == "features" and len(rest) > 2:
        mid = rest[2:-1]
    elif home == "app-shell":
        mid = rest[:-1]
    elif rest:
        mid = rest[1:-1]
    else:
        mid = []
    return "/".join(mid[:2]) if mid else "root"
_PASCAL_RX = re.compile(r"^[A-Z]")
# precedence when two refs hit the same (from, to): the MOST specific relation wins
_REL_RANK = {"renders": 0, "uses-store": 1, "uses-hook": 2, "fecall": 3, "typed": 4, "imports": 5}
# the file's PRINCIPAL piece — where a screen flag / a module-scope ref / a ref to a
# non-piece export lands. Lower = more principal.
_PRINCIPAL = {"route": 0, "store": 1, "hook": 2, "component": 3, "module": 4, "fe-type": 5}


# ── classification ──────────────────────────────────────────────────────────────────────
def classify_export(ex: dict[str, Any], path: str) -> str | None:
    """ONE kind per exported symbol, or None = folds into the file's `module` piece.
    Order matters: a `useXStore` const from create() is a store, not a hook; a `*Route`
    component is a route, not a component."""
    kind = ex.get("kind") or "other"
    name = ex.get("name") or ""
    callee = kind[5:] if kind.startswith("call:") else None
    if kind in _TYPE_KINDS:
        return "fe-type"
    if callee in _ROUTER_CALLEES:
        return "route"
    if callee in _STORE_CALLEES or (_HOOK_RX.match(name) and name.endswith("Store")):
        return "store"
    if kind == "function" and _HOOK_RX.match(name):
        return "hook"
    jsx = bool(ex.get("hasJsx"))
    if _PASCAL_RX.match(name) and jsx and kind in ("function", "class") or (
            _PASCAL_RX.match(name) and jsx and callee in ("memo", "forwardRef", "styled", "observer", "lazy")):
        if name.endswith(("Route", "Router", "Page")) or "/routes/" in path or "/pages/" in path:
            return "route"
        return "component"
    return None


def _piece_id(path: str, name: str | None) -> str:
    return f"fe:{path}#{name}" if name else f"fe:{path}"


# ── the arm ─────────────────────────────────────────────────────────────────────────────
def build_fe(extract: dict[str, Any], entities: dict[str, Any] | frozenset[str] | None,
             screens: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Pure: extractor JSON → {pieces, edges, homes, stats}. Deterministic (sorted inputs,
    sorted outputs). ``screens`` = _a3_web's screen list (id ``web:<rel-no-suffix>``) so a
    fetching file's principal piece carries ``screen`` + ``sites`` (the universe absorbs the
    file-level web node into it)."""
    slugs = frozenset(entities) if entities else frozenset()
    by_file: dict[str, Any] = extract.get("byFile") or {}
    pieces: dict[str, dict[str, Any]] = {}
    file_pieces: dict[str, list[str]] = {}          # file → piece ids (in principal order)
    export_piece: dict[tuple[str, str], str] = {}   # (file, export name) → piece id
    stats_x = {"stories": 0, "barrels": 0, "pascal_no_jsx": 0, "module_exports": 0}
    alias_cut: set[tuple[str, str]] = set()
    scaffold_files: set[str] = set()
    scaffold_cut: set[tuple[str, str]] = set()          # (file, export) name-level cuts — a ref to one must COUNT, never rewire
    for path in sorted(by_file):
        rec = by_file[path]
        if rec.get("story"):
            stats_x["stories"] += 1
            continue
        if any(seg in path for seg in _SCAFFOLD_PATH):
            scaffold_files.add(path)
            stats_x["scaffold_files"] = stats_x.get("scaffold_files", 0) + 1
            stats_x["scaffold_exports"] = stats_x.get("scaffold_exports", 0) + len(rec.get("exports") or [])
            continue
        local = [e for e in rec.get("exports") or [] if not e.get("reexport")]
        if not local:
            if rec.get("exports"):
                stats_x["barrels"] += 1
            continue
        home, cand = _fe_home(path, slugs)
        ids: list[str] = []
        leftovers: list[str] = []
        for ex in sorted(local, key=lambda e: e.get("name") or ""):
            if (ex.get("name") or "").endswith("Spike"):       # a stray spike export in an app path
                stats_x["scaffold_exports"] = stats_x.get("scaffold_exports", 0) + 1
                scaffold_cut.add((path, ex.get("name") or ""))
                continue
            if ex.get("apiAlias"):                              # a one-line REFERENCE to the generated API
                stats_x["api_aliases"] = stats_x.get("api_aliases", 0) + 1   # contract — counted, never a piece
                alias_cut.add((path, ex.get("name") or ""))     # (the map-side de-noiser, source review 2026-08-23)
                continue
            k = classify_export(ex, path)
            if k is None:
                if _PASCAL_RX.match(ex.get("name") or "") and path.endswith(".tsx") and ex.get("kind") in ("function", "class"):
                    stats_x["pascal_no_jsx"] += 1
                leftovers.append(ex.get("name") or "")
                continue
            pid = _piece_id(path, ex["name"])
            pieces[pid] = {"id": pid, "name": ex["name"], "kind": k, "file": path, "home": home,
                           "candidate": bool(cand), "span": ex.get("span"), "area": _area_of(path, home)}
            if _FIXTURE_RX.search(path):
                pieces[pid]["fixture"] = True                   # showcase data, not domain mass — tagged, kept
            ids.append(pid)
            export_piece[(path, ex["name"])] = pid
        if leftovers:
            stats_x["module_exports"] += len(leftovers)
            value_ids = [i for i in ids if pieces[i]["kind"] != "fe-type"]
            if not value_ids:                          # types + helpers, or a plain module: ONE
                pid = _piece_id(path, None)            # `module` piece for the file's value exports
                stem = path.rsplit("/", 1)[-1].rsplit(".", 1)[0]
                pieces[pid] = {"id": pid, "name": stem, "kind": "module", "file": path, "home": home,
                               "candidate": bool(cand), "exports": sorted(leftovers), "area": _area_of(path, home)}
                if _FIXTURE_RX.search(path):
                    pieces[pid]["fixture"] = True
                ids.append(pid)
        ids.sort(key=lambda i: (_PRINCIPAL.get(pieces[i]["kind"], 9), i))
        file_pieces[path] = ids
        for nm in leftovers:                           # a helper's refs/targets ride the principal
            export_piece[(path, nm)] = ids[0]          # VALUE piece (never a type — ids are ranked)
    principal = {f: ids[0] for f, ids in file_pieces.items() if ids}

    # screens: the fetch arm's file-level nodes → the principal piece absorbs them
    absorbed = 0
    for sc in screens or []:
        sid = sc.get("id") or ""
        rel = sid[4:] if sid.startswith("web:") else sid
        for ext in (".tsx", ".ts"):
            pid = principal.get(rel + ext)
            if pid:
                pieces[pid]["screen"] = sid
                pieces[pid]["sites"] = len(sc.get("calls") or [])
                absorbed += 1
                break

    # edges: each piece's refs → binding → target piece, typed by the channel
    edges: dict[tuple[str, str], str] = {}
    unresolved = {"ext": 0, "no_piece": 0, "scaffold": 0, "alias": 0}   # ext = a library symbol · no_piece = a bound
    local = {"refs": 0}                               #   file with nothing drawn · local = same-file

    def target_of(bind: dict[str, Any] | None) -> str | None:
        if not bind:
            local["refs"] += 1                        # a same-file symbol — not a gap
            return None
        if bind.get("ext"):
            unresolved["ext"] += 1
            return None
        f, nm = bind.get("file"), bind.get("name")
        if f in scaffold_files or (f, nm) in scaffold_cut:
            unresolved["scaffold"] += 1                # an app ref INTO cut scaffold (file- OR export-level) — named, never silent, never rewired to the principal
            return None
        if (f, nm) in alias_cut:
            unresolved["alias"] += 1                   # a typed ref to a generated-contract REFERENCE — the contract is the backend schema, already mapped there
            return None
        if nm == "*":
            t = principal.get(f)
        else:
            t = export_piece.get((f, nm)) or principal.get(f)
        if not t:
            unresolved["no_piece"] += 1
        return t

    def add(src: str, tgt: str | None, rel: str) -> None:
        if not tgt or tgt == src:
            return
        if pieces[src]["kind"] == "fe-type":          # a type's `typeof useFoo` IS a type relation
            rel = "typed"
        cur = edges.get((src, tgt))
        if cur is None or _REL_RANK[rel] < _REL_RANK[cur]:
            edges[(src, tgt)] = rel

    for path, ids in file_pieces.items():
        rec = by_file[path]
        binds = rec.get("bindings") or {}

        def _render_target(tag: str, _p: str = path, _b: dict = binds) -> str | None:
            """A JSX tag → the piece it renders. A tag with NO binding is a SAME-FILE symbol —
            resolve it to a same-file EXPORT (blocker 2: `target_of` dropped every same-file
            render edge, so 36/67 root-views were mis-classified — they were sub-components
            rendered in their own file; per commit 62c2e8a: private 183→194, shared 99→124).
            HTML tags / non-exported locals still resolve to None (a real ref, not a gap)."""
            b = _b.get(tag)
            if b is not None:
                return target_of(b)
            t = export_piece.get((_p, tag))
            if t is None:
                local["refs"] += 1
            else:
                local["samefile"] = local.get("samefile", 0) + 1
            return t

        for ex in rec.get("exports") or []:
            if ex.get("reexport"):
                continue
            if (path, ex.get("name") or "") in alias_cut or (path, ex.get("name") or "") in scaffold_cut:
                continue          # a CUT export's body refs are cut noise — never rewired to the principal (review 53[5])
            src = export_piece.get((path, ex.get("name") or "")) or principal.get(path)
            if not src:
                continue
            seen: set[str] = set()
            for tag in ex.get("jsx") or []:
                seen.add(tag); add(src, _render_target(tag), "renders")
            for c in ex.get("ctxArgs") or []:
                seen.add(c); add(src, target_of(binds.get(c)), "uses-store")
            for c in ex.get("calls") or []:
                seen.add(c)
                t = target_of(binds.get(c))
                if not t:
                    if c in _CACHE_CALLEES:              # a library query/cache hook (react-query/swr):
                        pieces[src]["cache"] = True      # this piece TOUCHES the server cache = state (F1)
                    continue
                tk = pieces[t]["kind"]
                add(src, t, "uses-store" if tk == "store" else "uses-hook" if tk == "hook" else "fecall")
            for ty in ex.get("types") or []:
                seen.add(ty); add(src, target_of(binds.get(ty)), "typed")
            for idn in ex.get("idents") or []:
                if idn in seen or idn not in binds:
                    continue
                add(src, target_of(binds.get(idn)), "imports")
        # module-scope refs ride the principal piece. The extractor's file_refs walks the WHOLE
        # file (a superset), so anything an export already claimed is skipped here — else the same
        # ref double-counts (unresolved.scaffold read 2 for one fixture ref) and double-processes.
        fr = rec.get("file_refs") or {}
        src = principal.get(path)
        if src:
            claimed: set[str] = set()
            for ex in rec.get("exports") or []:
                for ch in ("jsx", "calls"):
                    claimed.update(ex.get(ch) or [])
            for tag in fr.get("jsx") or []:
                if tag in claimed:
                    continue
                add(src, _render_target(tag), "renders")
            for c in fr.get("calls") or []:
                if c in claimed:
                    continue
                t = target_of(binds.get(c))
                if t:
                    tk = pieces[t]["kind"]
                    add(src, t, "uses-store" if tk == "store" else "uses-hook" if tk == "hook" else "fecall")
                elif c in _CACHE_CALLEES:                 # a module-scope query/cache call → cache sink (F1)
                    pieces[src]["cache"] = True

    edge_list = [{"from": s, "to": t, "rel": r, "cross": pieces[s]["home"] != pieces[t]["home"]}
                 for (s, t), r in sorted(edges.items())]
    # ── STORE DETECTOR (F2) + feClass. A call wire is STATE if it (transitively) reaches a STORE, a
    #    FETCH, or a query/CACHE hook, else CHROME (cx/useT/layout plumbing). PRINCIPLED reachability
    #    over the call edges — the sinks are the store kind + fetching pieces (`screen`) + cache-hook
    #    pieces (`cache`, F1: react-query/swr library idioms), never a gustify name-list.
    #    feClass per COMPONENT then reads it: view = 0 render-parents · private = exactly 1 · connector =
    #    shared AND reaches state · container = shared, renders children only · leaf = shared, neither. ──
    _STATE_CALL = ("fecall", "uses-hook", "uses-store")
    _rin: dict[str, set] = {}          # component id → its render-parents
    _rchild: dict[str, bool] = {}      # component id → renders at least one child component
    _callers: dict[str, list] = {}     # target → callers, over CALL edges only (state propagates backward)
    for e in edge_list:
        s, t, r = e["from"], e["to"], e["rel"]
        if r == "renders" and pieces[t]["kind"] == "component":
            _rin.setdefault(t, set()).add(s)
            if pieces[s]["kind"] == "component":
                _rchild[s] = True
        if r in _STATE_CALL:
            _callers.setdefault(t, []).append(s)
    _sink = set(pid for pid, p in pieces.items() if p["kind"] == "store" or p.get("screen") or p.get("cache"))
    touches_state = set(_sink); _stk = list(_sink)
    while _stk:                        # a caller of anything that touches state itself touches state
        _t = _stk.pop()
        for _s in _callers.get(_t, ()):
            if _s not in touches_state:
                touches_state.add(_s); _stk.append(_s)
    by_channel = {"state": 0, "chrome": 0}
    for e in edge_list:                # tag each call wire's data channel (uses-store is always state)
        if e["rel"] in _STATE_CALL:
            _st = (e["rel"] == "uses-store") or (e["to"] in touches_state)
            e["channel"] = "state" if _st else "chrome"
            by_channel["state" if _st else "chrome"] += 1
    by_class: dict[str, int] = {}
    for pid, p in pieces.items():
        if p["kind"] != "component":
            continue
        fi = len(_rin.get(pid, ()))
        fc = ("view" if fi == 0 else "private" if fi == 1
              else "connector" if pid in touches_state else "container" if _rchild.get(pid) else "leaf")
        p["feClass"] = fc
        if pid in touches_state:
            p["state"] = True
        by_class[fc] = by_class.get(fc, 0) + 1
    by_kind: dict[str, int] = {}
    by_home: dict[str, int] = {}
    for p in pieces.values():
        by_kind[p["kind"]] = by_kind.get(p["kind"], 0) + 1
        by_home[p["home"]] = by_home.get(p["home"], 0) + 1
    by_rel: dict[str, int] = {}
    for e in edge_list:
        by_rel[e["rel"]] = by_rel.get(e["rel"], 0) + 1
    homes = []
    for h, n in sorted(by_home.items()):
        pair = _fe_pair(h)
        kind = ("fe" if pair else
                "candidate" if any(p["candidate"] for p in pieces.values() if p["home"] == h) else
                "entity" if h in slugs else "bucket")
        rec = {"id": h, "kind": kind, "pieces": n,
               "areas": len({p["area"] for p in pieces.values() if p["home"] == h and p.get("area")})}
        if pair:
            rec["pair"] = pair            # the backend twin — seats fe·X beside X, joins the two reads
        homes.append(rec)
    for p in pieces.values():                          # emit-lean: a false flag is no flag
        if not p.get("candidate"):
            p.pop("candidate", None)
    order = {k: i for i, k in enumerate(sorted(pieces))}
    return {
        "pieces": [pieces[k] for k in sorted(pieces)],
        # COMPACT wires: [from_idx, to_idx, rel] over `pieces` order (the two ~70-char ids
        # repeated per wire tripled the feed); `cross` = homes differ, derived by the reader
        "edges": [([order[e["from"]], order[e["to"]], e["rel"], e["channel"]] if e.get("channel")
                   else [order[e["from"]], order[e["to"]], e["rel"]]) for e in edge_list],
        "homes": homes,
        "stats": {"files": len(by_file), "pieces": len(pieces), "by_kind": dict(sorted(by_kind.items())),
                  "by_home": dict(sorted(by_home.items())), "edges": len(edge_list),
                  "by_rel": dict(sorted(by_rel.items())), "cross": sum(1 for e in edge_list if e["cross"]),
                  "screens_absorbed": absorbed, "unresolved": unresolved, "local_refs": local["refs"],
                  "samefile_renders": local.get("samefile", 0), "by_feclass": dict(sorted(by_class.items())),
                  "by_channel": by_channel, "state_pieces": len(touches_state),
                  "cache_pieces": sum(1 for p in pieces.values() if p.get("cache")),
                  "fe_types_referenced": len({e["to"] for e in edge_list if pieces[e["to"]]["kind"] == "fe-type"
                                              and pieces[e["from"]]["kind"] != "fe-type"}),
                  "excluded": stats_x,
                  "ts": extract.get("ts")},
    }


def run_extractor(web_root: Path, repo_root: Path, timeout: int = 180) -> tuple[dict[str, Any] | None, str]:
    """Run the compiler pass into a temp file (never into the twin). (json, reason). Paths are
    emitted relative to ``repo_root`` so piece ids join the fetch arm's screens + graft's nodes."""
    node = shutil.which("node")
    if not node:
        return None, "node not on PATH"
    with tempfile.TemporaryDirectory(prefix="gabe-fe-") as td:
        out = Path(td) / "fe.json"
        try:
            r = subprocess.run([node, str(EXTRACTOR), str(web_root), str(out), str(repo_root)],
                               capture_output=True, text=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            return None, f"extractor timed out after {timeout}s"
        if r.returncode != 0:
            msg = (r.stderr or r.stdout or "").strip().splitlines()
            return None, (msg[-1] if msg else f"extractor exit {r.returncode}")
        try:
            return json.loads(out.read_text()), "ok"
        except (OSError, json.JSONDecodeError) as exc:
            return None, f"extractor output unreadable: {exc}"


def fe_arm(root: Path, entities: dict[str, Any] | frozenset[str] | None,
           screens: list[dict[str, Any]] | None = None, allow_run: bool = True) -> dict[str, Any]:
    """The whole arm, one call. NEVER raises; ``present=False`` carries only the reason."""
    try:
        root = Path(root)
        web_root = _detect_web_root(root)
        if web_root is None:
            return {"present": False, "reason": "no web source"}
        if not allow_run or os.environ.get("GABE_FE_EXTRACT", "1") == "0":
            return {"present": False, "reason": "extract disabled (GABE_FE_EXTRACT=0)"}
        # the extractor wants the PACKAGE root (tsconfig + node_modules), not src/
        pkg = web_root.parent if web_root.name == "src" else web_root
        data, reason = run_extractor(pkg, root)
        if data is None:
            return {"present": False, "reason": reason}
        if not data.get("files"):   # a tsconfig resolved but matched 0 source files → HONEST-EMPTY, never a false present=True/0-pieces (the Vite references-stub trap)
            return {"present": False,
                    "reason": f"typescript {data.get('ts')} · 0 source files (tsconfig matched none — references not followed or empty include)"}
        out = build_fe(data, entities, screens)
        out["present"] = True
        out["reason"] = f"typescript {data.get('ts')} · {data.get('files')} files"
        return out
    except Exception as exc:  # noqa: BLE001 — the arm enhances, never breaks, the build
        return {"present": False, "reason": f"fe arm error: {exc}"}
