#!/usr/bin/env python3
"""_a3_graph.py — derive the C4-style codebase graph from the in-memory archmap.

Pure derivation, ZERO new source read: it consumes the ``amap`` dict that
``build_center_a3`` already assembled (``entities.<slug>`` → files, models,
endpoints, schemas, defines) and emits a LIBRARY-NEUTRAL graph:

    {version, head, l1:{nodes,edges}, l2:{<slug>:{nodes,edges}}, layout, stats}

Why library-neutral: the render step is a lab of alternatives (zero-lib SVG,
force-directed, a vendored graph lib). The canonical form is therefore raw
``nodes`` + ``edges`` (``id`` / ``source`` / ``target`` / ``kind`` / ``weight``)
that ANY renderer can adapt with a thin shim. A deterministic build-time layout
pass ALSO stamps ``x``/``y`` (a ring for L1, columns-by-kind for L2) AND ``fx``/``fy``
(the Flare flow layout — a foundations-left→dependents-right dependency gradient over
the FK DAG), so the no-runtime-layout path needs no graph library under strict-CSP /
file:// and can offer 'Ring | Flow' by reading a field; renderers that lay themselves
out simply ignore the stamped coordinates.

What the edges MEAN (slice 1 — the archmap-only arm):
  * L1 CROSS-entity edges come from foreign keys: a model FK ``"table.col"`` →
    the entity whose model owns ``table``. FK is the ONLY cross-entity signal the
    archmap carries today. (Richer calls/imports coupling is the graft-wiring arm,
    a later slice; the per-pair ``kinds`` dict is already multi-kind-ready for it.)
  * ``touches`` is an INTRA-entity signal only: upstream (``_a3_code`` where the
    map is built) intersects each endpoint's references with that entity's OWN
    documented classes, so a touch can only ever name a class the same entity
    owns. It therefore contributes NO L1 edge and only endpoint→own-model/schema
    edges at L2. It is NOT dropped-cross-entity data — the cross-entity case
    cannot occur under the current archmap.

Honesty laws (the map must not lie):
  * The join it makes is an EXACT string join (FK ``table.col`` → owning entity),
    not a heuristic.
  * A FK to a table NO entity models is LOSSY on coverage; it is collected into an
    explicit ``unclaimed`` bucket node (id ``__unclaimed__``, namespaced so it can
    never collide with a real entity slug), never silently dropped.
  * Intra-entity edges (a FK inside one entity) are L2 detail; L1 carries only
    CROSS-entity edges.

Determinism: the output is a pure function of (amap.entities, labels, status, and —
when the graft arm passes one — the graft INDEX, a machine-local gitignored cache)
with every list sorted and every coordinate rounded, keyed on ``amap.head`` (the git
sha, stable on an unchanged tree) — NOT ``amap.generated`` (a wallclock that would
churn the committed file every build). Same inputs ⇒ byte-identical output; but note
the graft input makes the committed file MACHINE-SHAPED: a regen on a host without
the binary/index strips the calls/imports kinds (the build prints the flip loudly). (The
ring coordinates round math.cos/sin to 2 dp; that rounding absorbs any libm
last-bit variance, but strict cross-platform byte-identity is a property of the
build host's float repr, not a guarantee this module can make alone.)

Battery: tests/arch-graph/run.sh (fire + silent + determinism, mutation-proven).
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

_UNCLAIMED = "__unclaimed__"   # the coverage-loss bucket; namespaced vs real slugs

# --- layout constants (a deterministic build-time pass; renderers may ignore) ---
_L1_R = 300.0        # ring radius for the entity ring
_L1_UNCLAIMED = (0.0, 0.0)   # the unclaimed bucket sits at the ring's centre
_L1_FLOW_COL_W = 210.0   # column stride for the flow (dependency-gradient) layout
_L1_FLOW_ROW_H = 118.0   # row stride within a flow column
_L2_COL_W = 240.0    # column stride for the columns-by-kind L2 layout
_L2_ROW_H = 64.0     # row stride within a column
_L2_KINDS = ("endpoint", "model", "schema", "external", "web")  # column order, left→right
#            web is APPENDED (not prepended) so adding the frontend arm leaves every
#            existing piece's stamped x/y byte-identical — only web nodes get a new column.


def _index_tables(entities: dict[str, Any]) -> dict[str, str]:
    """{table_name: owning_slug} — for resolving a FK ``table.col`` to an entity.

    Iterates ``sorted(entities)`` so a table name declared by two entities (a
    shared/legacy table, plausible mid-migration) resolves to the alphabetically
    FIRST slug — a stable, order-independent tie-break, not config-insertion order."""
    idx: dict[str, str] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for model in code.get("models") or []:
            tbl = model.get("table")
            if tbl and tbl not in idx:
                idx[tbl] = slug
    return idx


def _counts(code: dict[str, Any]) -> dict[str, int]:
    files = code.get("files") or []
    return {
        "endpoints": len(code.get("endpoints") or []),
        "models": len(code.get("models") or []),
        "schemas": len(code.get("schemas") or []),
        "files": len(files),
        "lines": sum(f[2] for f in files if len(f) > 2),
    }


def _l1(entities: dict[str, Any], labels: dict[str, str],
        status: dict[str, str] | None) -> tuple[list[dict], list[dict], list[str]]:
    """L1 = one node per domain entity + (when needed) an unclaimed bucket; edges
    are the CROSS-entity FK relations, aggregated per directed pair with a
    per-kind multiplicity (multi-kind-ready for the later graft arm)."""
    tbl2slug = _index_tables(entities)
    status = status or {}

    pairs: dict[tuple[str, str], dict[str, int]] = {}   # (src,dst) -> {kind: n}
    unresolved: set[str] = set()

    def bump(src: str, dst: str, kind: str) -> None:
        d = pairs.setdefault((src, dst), {})
        d[kind] = d.get(kind, 0) + 1

    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for model in code.get("models") or []:
            for _col, ref in (model.get("fks") or {}).items():
                target_table = ref.split(".", 1)[0]
                target = tbl2slug.get(target_table)
                if target is None:
                    unresolved.add(target_table)
                    target = _UNCLAIMED
                if target != slug:            # intra-entity FK is L2 detail
                    bump(slug, target, "fk")

    used_unclaimed = any(dst == _UNCLAIMED for _s, dst in pairs)

    nodes: list[dict] = []
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        nodes.append({
            "id": slug,
            "label": labels.get(slug, slug),
            "kind": "entity",
            "slug": slug,
            "status": status.get(slug),
            "counts": _counts(code),
        })
    if used_unclaimed:
        nodes.append({
            "id": _UNCLAIMED,
            "label": "unclaimed",
            "kind": "unclaimed",
            "slug": _UNCLAIMED,
            "status": None,
            "counts": None,
        })

    edges: list[dict] = []
    for (src, dst) in sorted(pairs):
        kinds = pairs[(src, dst)]
        edges.append({
            "source": src,
            "target": dst,
            "weight": sum(kinds.values()),
            "kinds": {k: kinds[k] for k in sorted(kinds)},
        })
    return nodes, edges, sorted(unresolved)


def _index_tbl_models(entities: dict[str, Any]) -> dict[str, str]:
    """{table_name: model node id ('model:<cls>')} — GLOBAL, for resolving a
    cross-entity FK target ``table.col`` to the specific model PIECE it references.

    Deterministic first-writer over ``sorted(entities)`` then declared model order,
    mirroring ``_index_tables`` — a table declared by two entities resolves to the
    same (alphabetically-first slug's) model both indexes agree on."""
    idx: dict[str, str] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for model in code.get("models") or []:
            tbl, cls = model.get("table"), model.get("cls")
            if tbl and cls:
                idx.setdefault(tbl, f"model:{cls}")
    return idx


# ── the web→API bridge join (Path A frontend arm) ───────────────────────────
_API_PREFIX_RE = re.compile(r"^/api/v\d+")
_PATH_PARAM_RE = re.compile(r"\$?\{[^}]*\}")


def _norm_path(path: str) -> str:
    """Normalize a URL path to the bridge match key. Two mismatches must collapse
    or the join hits ~0%: web literals carry the ``/api/vN`` mount prefix the
    archmap endpoints do NOT, and web params are camel ``${itemId}`` while archmap
    params are snake ``{item_id}``. So drop the version prefix, collapse every
    ``{x}``/``${x}`` to one placeholder (match STRUCTURE, not the param name), and
    strip a trailing slash. Applied to BOTH sides — never mutates a stored id."""
    # AUDIT #12/#19: collapse params FIRST so a leading base-URL var (${API_BASE}) becomes
    # a placeholder, then drop that placeholder, then strip the /api/vN mount now that it
    # leads. Old order stripped ^/api/vN before the base was collapsed, so
    # ${API_BASE}/api/v1/statements kept its /api/v1 and never matched POST /statements.
    p = (path or "").strip()
    p = _PATH_PARAM_RE.sub("{}", p)
    p = re.sub(r"^\{\}(?=/)", "", p)     # ${base}/… → /…  (a fully-dynamic {}{} stays unmatched — honest)
    p = _API_PREFIX_RE.sub("", p)        # /api/vN now leads → strip the mount
    p = p.rstrip("/")
    if not p.startswith("/"):
        p = "/" + p
    return p


def _index_endpoints(entities: dict[str, Any]) -> dict[tuple[str, str], tuple[str, str]]:
    """``{(METHOD, norm_path): (slug, 'endpoint:<method> <rawpath>')}`` — GLOBAL, so
    a web fetch resolves to the endpoint PIECE it names. Endpoint node ids are
    per-L2 (minted in ``_l2``) with no global address, so the bridge targets the
    (to_slug, to=node-id) pair exactly as ``_cross_edges`` does for models.
    First-writer over ``sorted(entities)`` — a stable, order-independent tie-break."""
    idx: dict[tuple[str, str], tuple[str, str]] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for ep in code.get("endpoints") or []:
            key = (str(ep.get("method", "")).upper(), _norm_path(str(ep.get("path", ""))))
            nid = f"endpoint:{ep.get('method')} {ep.get('path')}"
            idx.setdefault(key, (slug, nid))
    return idx


def _cross_edges(entities: dict[str, Any],
                 tbl2slug: dict[str, str]) -> list[dict]:
    """Piece-level CROSS-entity FK edges: ``model:<cls>`` --via ``col``--> ``model:<cls>``
    where the two models live in DIFFERENT entities.

    The L1 edges aggregate these per entity-pair and DROP which model/column carried
    the FK; this keeps the piece resolution so a renderer (the codebase-archive
    ecosystem view) can draw connections between the COMPONENTS of different entities,
    not just between entity centres. Intra-entity FKs are L2 detail; a FK to an
    unclaimed/library table (no owning entity) has no target piece and is excluded.
    Deterministic: sorted iteration + a sorted, de-duped return."""
    tbl2model = _index_tbl_models(entities)
    seen: set[tuple] = set()
    out: list[dict] = []
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        for model in code.get("models") or []:
            src = f"model:{model.get('cls')}"
            for col, ref in (model.get("fks") or {}).items():
                target_table = ref.split(".", 1)[0]
                target_slug = tbl2slug.get(target_table)
                if target_slug is None or target_slug == slug:
                    continue                       # unclaimed or intra-entity
                dst = tbl2model.get(target_table)
                if not dst:
                    continue
                key = (slug, src, target_slug, dst, col)
                if key in seen:
                    continue
                seen.add(key)
                out.append({"from_slug": slug, "from": src,
                            "to_slug": target_slug, "to": dst, "via": col})
    out.sort(key=lambda e: (e["from_slug"], e["from"],
                            e["to_slug"], e["to"], e["via"]))
    return out


def model_ids(model: dict[str, Any],
              endpoints: list[dict] | None) -> dict[str, Any]:
    """The STRUCTURAL id-card for a model piece — what a detail panel shows about it,
    independent of any change:

    * ``datatype`` — the model's columns ``[{n, t}]`` (name + declared type).
    * ``endpoint`` — the API endpoints that TOUCH this model ``[{m, p, fn}]`` (an
      endpoint touches the model when the model's ``cls`` is in its ``touches``).
    * ``fn``       — the distinct functions behind those endpoints, PRINCIPAL FIRST
      (the fn wired to the most touching endpoints; ties broken by name).
    * ``principal``— that lead function, surfaced so a panel can headline "the one
      to keep tabs on".

    Pure over one model dict + the entity's endpoints. Deterministic: cols keep source
    order, endpoints iterate in source order, fns sort by (-hits, name). Reused by the
    L2 emit AND (later) the change derivation, so one rule feeds every panel."""
    cls = model.get("cls")
    dts = [{"n": c[0], "t": c[1]} for c in (model.get("cols") or [])
           if c and len(c) >= 2 and c[0]]
    eps: list[dict] = []
    fn_hits: dict[str, int] = {}
    for ep in (endpoints or []):
        if cls and cls in (ep.get("touches") or []):
            eps.append({"m": ep.get("method"), "p": ep.get("path"), "fn": ep.get("fn")})
            fn = ep.get("fn")
            if fn:
                fn_hits[fn] = fn_hits.get(fn, 0) + 1
    fns = sorted(fn_hits, key=lambda f: (-fn_hits[f], f))
    ids: dict[str, Any] = {}
    if dts:
        ids["datatype"] = dts
    if eps:
        ids["endpoint"] = eps
    if fns:
        ids["fn"] = fns
        ids["principal"] = fns[0]
    return ids


_DET_COLS_CAP = 10    # STRUCTURE rows shown; the rest becomes "+N more"
_DET_CASES_CAP = 6    # TESTED-BY rows shown; the matrix carries the full ledger


def _normalize_sig(sig: str, cap: int = 220) -> str:
    """Collapse graft's RAW signature to a readable line: whitespace squeezed, each param's
    DEFAULT value dropped (`x: T = Query(None, description=("…"))` → `x: T`), then capped. graft
    inlines FastAPI Query/Depends/Field bodies + description prose, blowing a handler signature to
    KBs (gustify GET /recipes = 11,844 chars) — the useful part is name · params · return.
    Balanced-bracket aware (a comma/`=` inside [] or () is not a separator)."""
    s = " ".join(str(sig).split())
    o = s.find("(")
    if o < 0:
        return s if len(s) <= cap else s[:cap - 1] + "…"
    depth = 0
    close = -1
    for i in range(o, len(s)):
        c = s[i]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
            if depth == 0:
                close = i
                break
    if close < 0:
        return s if len(s) <= cap else s[:cap - 1] + "…"
    head, body, tail = s[:o + 1], s[o + 1:close], s[close:]
    params, depth, cur = [], 0, ""
    for c in body:
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        if c == "," and depth == 0:
            params.append(cur)
            cur = ""
        else:
            cur += c
    if cur.strip():
        params.append(cur)
    cleaned = []
    for p in params:
        p = p.strip()
        d = eq = 0
        eq = -1
        for i, c in enumerate(p):
            if c in "([{":
                d += 1
            elif c in ")]}":
                d -= 1
            elif c == "=" and d == 0 and p[i - 1:i] not in ("=", "!", "<", ">") and p[i + 1:i + 2] != "=":
                eq = i
                break
        cleaned.append((p[:eq] if eq >= 0 else p).strip())
    out = " ".join((head + ", ".join(c for c in cleaned if c) + tail).split())
    return out if len(out) <= cap else out[:cap - 1] + "…"


def element_detail(kind: str, obj: dict[str, Any],
                   file_lines: dict[str, int],
                   fi: dict[str, Any], ti_ep: dict[str, Any],
                   ti_model: dict[str, Any], mi: dict[str, Any],
                   node_facts: dict[str, Any] | None = None) -> dict[str, Any]:
    """The panel DOSSIER for one L2 piece — the center's per-element fields
    (PURPOSE · STRUCTURE · SIGNATURE · TESTED-BY) derived at build time so the
    station's detail panel reads LIVE archmap data, never a lab fixture:

    * ``doc``    — the element's docstring/purpose (skipped when absent/"—").
    * ``file``/``flines`` — where it lives + the file's line count (the 800
      budget is a render-time judgment, the emitter only carries the number).
    * ``cols``   — model columns / schema fields ``[[name, type, default]]``,
      capped at ``_DET_COLS_CAP`` with ``cols_more``; ``uqs`` = unique COLUMN
      NAMES, extracted from the parser's ``UniqueConstraint(...)`` expression
      strings (quoted identifiers ∩ this element's columns — the raw repr can
      never match a column, and its 90-char cut truncates mid-expression).
    * ``fks``    — ``[[column, table.col]]`` sorted (models only, STORED-AS).
    * ``sig``    — endpoint handler signature from function_insight
      (``returns`` · ``async`` · ``lines``).
    * ``usage``  — fan-in numbers: endpoints from function_insight (api/internal
      call counts), models/schemas from model_insight (fk_in/internal refs).
    * ``cases``  — the test ledger rows ``{cid, name, state, corpus}`` capped at
      ``_DET_CASES_CAP`` with ``cases_more`` (by_endpoint keyed ``file::fn``,
      by_model keyed on the class name), DEDUPED across groups (direct +
      via_route credit the same case) and with the route-literal FILE aggregates
      (``state:'file'`` pseudo-rows) split out into ``case_files`` — they are
      coverage-by-file facts, not cases, and painting them as cases both
      inflated the count and rendered as failures.

    Pure + deterministic (source order for cols, explicit sorts for fks/cases);
    HONEST-EMPTY — an element with nothing to show returns {} and gets NO det
    key, so a twin without the insight blocks degrades to the bare card."""
    det: dict[str, Any] = {}
    doc = obj.get("doc")
    if doc and doc != "—":
        det["doc"] = doc
    file = obj.get("file")
    if file:
        det["file"] = file
        if file in file_lines:
            det["flines"] = file_lines[file]

    # P1b (graft adoption): graft's RAW signature + exported flag, keyed by file#symbol (the
    # endpoint handler fn, or the model/schema class). Displayed instead of re-deriving the def
    # line from source — the string graft already stores. node_facts = _a3_graft.derive_node_facts.
    _sym = obj.get("fn") or obj.get("cls")
    _nf = (node_facts or {}).get(f"{file}#{_sym}") if (file and _sym) else None
    if _nf:
        if _nf.get("signature"):
            det["gsig"] = _normalize_sig(_nf["signature"])   # P1b review: strip default bodies + cap
        if _nf.get("exported"):
            det["exported"] = True

    if kind == "endpoint":
        if obj.get("status"):
            det["status"] = str(obj["status"])
        fn = obj.get("fn")
        rec = fi.get(f"{file}::{fn}") if (file and fn) else None
        if rec:
            sig = {}
            if rec.get("returns"):
                sig["returns"] = rec["returns"]
            if rec.get("async"):
                sig["async"] = True
            if rec.get("lines"):
                sig["lines"] = rec["lines"]
            if sig:
                det["sig"] = sig
            usage = {"api": rec.get("api", 0), "internal": rec.get("internal", 0)}
            if any(usage.values()):
                det["usage"] = usage
        groups = ti_ep.get(f"{file}::{fn}") if (file and fn) else None
    else:
        cols = obj.get("cols") if kind == "model" else obj.get("fields")
        cols = [c for c in (cols or []) if c and len(c) >= 2 and c[0]]
        if cols:
            det["cols"] = [list(c[:3]) for c in cols[:_DET_COLS_CAP]]
            if len(cols) > _DET_COLS_CAP:
                det["cols_more"] = len(cols) - _DET_COLS_CAP
        uq_names: set[str] = set()
        col_names = {c[0] for c in cols}
        for expr in obj.get("uqs") or []:
            uq_names.update(n for n in re.findall(r"'([A-Za-z_][A-Za-z0-9_]*)'", str(expr))
                            if n in col_names)
        if uq_names:
            det["uqs"] = sorted(uq_names)
        if kind == "model" and obj.get("fks"):
            det["fks"] = sorted([[c, ref] for c, ref in obj["fks"].items()])
        rec = mi.get(obj.get("cls") or "")
        if rec and rec.get("file") and file and rec["file"] != file:
            rec = None                      # a same-named class in ANOTHER file — not this element
        if rec:
            usage = {"fk_in": rec.get("fk_in", 0), "internal": rec.get("internal", 0)}
            if any(usage.values()):
                det["usage"] = usage
        groups = ti_model.get(obj.get("cls") or "") if rec is not None or not mi.get(obj.get("cls") or "") else None

    rows, files, seen = [], [], set()
    for grp in (groups or {}).values():
        for c in grp or []:
            if c.get("state") == "file":     # a route-literal FILE credit, not a case
                key = (c.get("corpus"), c.get("name"))
                if key not in seen:
                    seen.add(key)
                    files.append({"corpus": c.get("corpus"), "name": c.get("name")})
                continue
            key = (c.get("corpus"), c.get("cid"), c.get("name"))
            if key in seen:
                continue                     # direct + via_route credit the same case once
            seen.add(key)
            rows.append({"cid": c.get("cid"), "name": c.get("name"),
                         "state": c.get("state"), "corpus": c.get("corpus")})
    if rows:
        rows.sort(key=lambda r: (str(r["corpus"]), str(r["cid"]), str(r["name"])))
        det["cases"] = rows[:_DET_CASES_CAP]
        if len(rows) > _DET_CASES_CAP:
            det["cases_more"] = len(rows) - _DET_CASES_CAP
    if files:
        files.sort(key=lambda f: (str(f["corpus"]), str(f["name"])))
        det["case_files"] = files
    return det


def _l2(slug: str, code: dict[str, Any], tbl2slug: dict[str, str],
        labels: dict[str, str],
        insight: dict[str, Any] | None = None,
        web_pieces: list[dict] | None = None,
        behind: dict[str, dict] | None = None,
        journeys: dict[str, dict] | None = None) -> dict[str, list[dict]]:
    """L2 = one entity's internal pieces (endpoints · models · schemas) and their
    wiring, plus honest ``external`` stub nodes for outbound FKs into other
    entities / unclaimed tables — so a drill never hides where the entity reaches.

    Touches are intra-entity by construction (upstream own-class filter), so an
    endpoint touch always resolves to one of THIS entity's own model/schema nodes;
    a touch that names no own class is dropped (it cannot name another entity's
    class under the current archmap)."""
    nodes: list[dict] = []
    node_ids: set[str] = set()
    edges: list[dict] = []
    own_classes: dict[str, str] = {}   # cls -> node id (this entity only)
    externals: dict[str, dict] = {}    # ext node id -> node
    ins = insight or {}
    file_lines = {f[1]: f[2] for f in (code.get("files") or [])
                  if isinstance(f, (list, tuple)) and len(f) >= 3}

    def add_node(node: dict) -> None:
        if node["id"] not in node_ids:   # deterministic first-writer dedup
            node_ids.add(node["id"])
            nodes.append(node)

    def det_of(kind: str, obj: dict) -> dict:
        return element_detail(kind, obj, file_lines,
                              ins.get("fi") or {}, ins.get("ti_ep") or {},
                              ins.get("ti_model") or {}, ins.get("mi") or {},
                              node_facts=ins.get("node_facts") or {})

    def with_journeys(det: dict, key: str) -> dict:
        # fold the element's cross-entity test journeys into its dossier; honest-empty → det unchanged.
        jr = (journeys or {}).get(key)
        if jr:
            det["test_journeys"] = jr["list"]
            if jr.get("more"):
                det["test_journeys_more"] = jr["more"]
        return det

    def ext(owner: str) -> str:
        nid = f"external:{owner}"
        if nid not in externals:
            externals[nid] = {
                "id": nid, "kind": "external", "slug": owner,
                "label": "unclaimed" if owner == _UNCLAIMED
                else labels.get(owner, owner),
            }
        return nid

    for model in code.get("models") or []:
        nid = f"model:{model.get('cls')}"
        node = {"id": nid, "kind": "model", "slug": slug,
                "label": model.get("cls"), "table": model.get("table")}
        ids = model_ids(model, code.get("endpoints"))
        if ids:                                   # honest-empty: no card if nothing to show
            node["ids"] = ids
        det = with_journeys(det_of("model", model), model.get("cls") or "")
        if det:                                   # honest-empty: no dossier, no key
            node["det"] = det
        add_node(node)
        if model.get("cls"):
            own_classes.setdefault(model["cls"], nid)   # a model wins a name tie
    for schema in code.get("schemas") or []:
        nid = f"schema:{schema.get('cls')}"
        snode = {"id": nid, "kind": "schema", "slug": slug,
                 "label": schema.get("cls")}
        sdet = with_journeys(det_of("schema", schema), schema.get("cls") or "")
        if sdet:
            snode["det"] = sdet
        add_node(snode)
        if schema.get("cls"):
            own_classes.setdefault(schema["cls"], nid)
    for ep in code.get("endpoints") or []:
        nid = f"endpoint:{ep.get('method')} {ep.get('path')}"
        enode = {"id": nid, "kind": "endpoint", "slug": slug,
                 "label": f"{ep.get('method')} {ep.get('path')}"}
        if ep.get("fn"):
            enode["fn"] = ep["fn"]                # the handler, for the card's route row
        if ep.get("resp") and ep["resp"] != "—":   # the parser's em-dash default is "none declared"
            enode["resp"] = ep["resp"]
        edet = with_journeys(det_of("endpoint", ep),
                             f"{ep.get('file')}::{ep.get('fn')}")
        if edet:
            enode["det"] = edet
        bkey = f"{ep.get('file')}#{ep.get('fn')}"   # the graft call-tree floor behind this handler
        if behind and bkey in behind:               # honest-empty: no key → no badge, never a guess
            enode["behind"] = behind[bkey]
        add_node(enode)
        for cls in ep.get("touches") or []:
            tgt = own_classes.get(cls)
            if tgt and tgt != nid:
                edges.append({"source": nid, "target": tgt, "kind": "touches"})
            # a touch to no own class: not another entity's (upstream own-filter),
            # an external/library schema with no node → nothing to point at, drop.

    # web pieces (Path A frontend arm): one node per fetching FILE, homed to this
    # entity by the web arm (by file, or by the endpoint its fetch matched). The
    # bridge EDGE (web→endpoint) lives at the top level (cross_edges) so it can
    # cross entities; here we only add the node. web absent → nothing added.
    for wp in (web_pieces or []):
        add_node({"id": wp["id"], "kind": "web", "slug": slug,
                  "label": wp.get("label", wp["id"]),
                  "sites": int(wp.get("sites", 0))})

    # model → model FK edges: intra-entity → the target model node; cross-entity
    # or unclaimed → the owner's external stub.
    tbl2own = {}
    for m in code.get("models") or []:
        if m.get("table"):
            tbl2own.setdefault(m["table"], f"model:{m.get('cls')}")
    for model in code.get("models") or []:
        src = f"model:{model.get('cls')}"
        for _col, ref in (model.get("fks") or {}).items():
            target_table = ref.split(".", 1)[0]
            if target_table in tbl2own:
                tgt = tbl2own[target_table]
                if tgt != src:                           # self-FK is not an edge
                    edges.append({"source": src, "target": tgt, "kind": "fk"})
            else:
                owner = tbl2slug.get(target_table, _UNCLAIMED)
                edges.append({"source": src, "target": ext(owner), "kind": "fk"})

    for k in sorted(externals):
        add_node(externals[k])
    # de-dup edges (an entity can reach another via several endpoints/FKs) + sort
    seen: set[tuple] = set()
    uniq: list[dict] = []
    for e in edges:
        key = (e["source"], e["target"], e["kind"])
        if key not in seen:
            seen.add(key)
            uniq.append(e)
    uniq.sort(key=lambda e: (e["source"], e["target"], e["kind"]))
    nodes.sort(key=lambda n: (_L2_KINDS.index(n["kind"]), n["id"]))
    return {"nodes": nodes, "edges": uniq}


def _stamp_l1(nodes: list[dict]) -> None:
    """Ring layout: entities evenly on a circle (top-first, clockwise); the
    unclaimed bucket at centre. Deterministic + rounded to 2 dp (absorbs libm
    last-bit variance) ⇒ stable within a build host."""
    ents = [n for n in nodes if n["kind"] == "entity"]
    n = len(ents)
    for i, node in enumerate(ents):
        ang = -math.pi / 2 + (2 * math.pi * i / n if n else 0)
        node["x"] = round(_L1_R * math.cos(ang), 2)
        node["y"] = round(_L1_R * math.sin(ang), 2)
    for node in nodes:
        if node["kind"] == "unclaimed":
            node["x"], node["y"] = _L1_UNCLAIMED


def _stamp_l1_flow(nodes: list[dict], edges: list[dict]) -> int:
    """Flow (dependency-gradient) layout — the Flare ``flowLayout`` port.

    Longest-path depth over the FK DAG puts FOUNDATIONS (depended-upon by many,
    depending on nothing) at the LEFT and ENTRY POINTS (long dependency chains) at
    the RIGHT. Our FK edges are already source→target = dependent→depended-upon, so
    ``depth(u) = max over out-neighbours v of (1 + depth(v))`` needs NO inversion:
    a sink (no outbound FK) is depth 0 (left), a model that FKs into two layers is
    depth 2 (right). Cycle-safe via an on-stack guard (a back-edge contributes 0,
    never recurses) — no Tarjan pass needed for the acyclic-in-practice FK graph.

    ADDITIVE: bakes ``fx``/``fy`` on every entity node ALONGSIDE the ring ``x``/``y``
    (never replaces them), so a renderer offers 'Ring | Flow' by reading a field, not
    by recomputing under strict-CSP. Deterministic: columns sorted by (depth, id),
    y centred per column, rounded to 2 dp. Returns the column count for stats.

    The unclaimed bucket is excluded from the DAG (it has no outbound FK and is a
    coverage artefact, not a domain layer) and pinned at the flow origin like the
    ring centre — an FK INTO it is skipped, exactly as the ring ignores it."""
    ents = [n for n in nodes if n["kind"] == "entity"]
    ids = [n["id"] for n in ents]
    has = set(ids)
    out: dict[str, list[str]] = {i: [] for i in ids}
    for e in edges:
        s, t = e["source"], e["target"]
        if s in has and t in has and s != t:
            out[s].append(t)

    depth: dict[str, int] = {}
    onstack: set[str] = set()

    def dep(u: str) -> int:
        if u in depth:
            return depth[u]
        if u in onstack:               # back-edge: contributes 0, never recurses
            return 0
        onstack.add(u)
        d = 0
        for v in out[u]:
            d = max(d, 1 + dep(v))
        onstack.discard(u)
        depth[u] = d
        return d

    for i in ids:
        dep(i)

    cols: dict[int, list[str]] = {}
    for i in ids:
        cols.setdefault(depth[i], []).append(i)
    pos: dict[str, tuple[float, float]] = {}
    for dk in sorted(cols):
        col = sorted(cols[dk])
        for j, nid in enumerate(col):
            x = dk * _L1_FLOW_COL_W
            y = (j - (len(col) - 1) / 2.0) * _L1_FLOW_ROW_H
            pos[nid] = (round(x, 2), round(y, 2))

    for n in ents:
        n["fx"], n["fy"] = pos[n["id"]]
    for n in nodes:
        if n["kind"] == "unclaimed":
            n["fx"], n["fy"] = _L1_UNCLAIMED
    return (max(cols) + 1) if cols else 0


def _stamp_l2(l2: dict[str, list[dict]]) -> None:
    """Columns-by-kind: endpoints | models | schemas | external, each column
    sorted, row y by index. Deterministic + rounded ⇒ stable."""
    cols: dict[str, int] = {k: 0 for k in _L2_KINDS}
    for node in l2["nodes"]:
        kind = node["kind"]
        col = _L2_KINDS.index(kind)
        node["x"] = round(col * _L2_COL_W, 2)
        node["y"] = round(cols[kind] * _L2_ROW_H, 2)
        cols[kind] += 1


# graft relations that fold into the RENDERED L1 edge kinds. The FULL 6-relation coupling is
# consumed in stats.cross_by_relation; only these two are drawn (styled + legended + non-
# redundant). `references` overlaps `calls`, and `contains`/`extends`/`implements` have no edge
# CSS yet — kept stat-only until they earn a rendered kind (P1a review D1/D2).
_L1_RENDER_RELATIONS = ("calls", "imports")


def build_c4_graph(amap: dict[str, Any], labels: dict[str, str] | None = None,
                   status: dict[str, str] | None = None,
                   colors: dict[str, str] | None = None,
                   graft: dict[str, Any] | None = None,
                   web: dict[str, Any] | None = None) -> dict[str, Any]:
    """The whole derivation: L1 entity graph + one L2 graph per entity, laid out.

    Pure over ``amap["entities"]`` (+ labels/status/colors), keyed on ``amap["head"]``.
    ``labels``/``status``/``colors`` default to empty — the graph still builds from
    archmap alone, entities just render under their slug, without a registry status,
    and (colors absent) a renderer falls back to a neutral fill. ``colors`` is the
    center's per-entity palette (``_a3_render.entity_color``) carried WITH the graph
    so any renderer paints entities the SAME hue the rest of the center uses."""
    labels = labels or {}
    entities = amap.get("entities") or {}

    l1_nodes, l1_edges, unresolved = _l1(entities, labels, status)
    # ── the graft-wiring arm (topology provider): cross-entity calls/imports the
    #    FK derivation cannot see, folded into the multi-kind edge dict this schema
    #    reserved for exactly this. graft absent → nodes/edges/layout byte-identical
    #    to an FK-only build; only stats.graft names the absence (honesty law).
    graft_present = bool(graft and graft.get("present"))
    if graft_present:
        by_pair = {(e["source"], e["target"]): e for e in l1_edges}
        slugs = {n["slug"] for n in l1_nodes}
        for (src, dst), kinds in (graft.get("pairs") or {}).items():
            if src not in slugs or dst not in slugs:
                continue                       # an entity the L1 set doesn't carry
            # P1a review (D1/D2): only calls/imports fold into the RENDERED L1 weight. graft
            # co-emits a `references` edge for the same node-pair as its `calls` edge (100%
            # overlap on gustify's one references pair) → folding it double-counts; and the
            # renderer/legend only know calls/imports/fk (an `e-references` path draws as an
            # unstyled black blob). The full 6-relation coupling stays honest in
            # stats.cross_by_relation — it is CONSUMED, just not (yet) a drawn L1 kind.
            render_kinds = {rel: int(n) for rel, n in kinds.items()
                            if rel in _L1_RENDER_RELATIONS}
            if not render_kinds:
                continue                       # coupled only by stat-only relations → no L1 edge
            e = by_pair.get((src, dst))
            if e is None:
                e = {"source": src, "target": dst, "weight": 0, "kinds": {}}
                by_pair[(src, dst)] = e
                l1_edges.append(e)
            for rel, n in render_kinds.items():
                e["kinds"][rel] = e["kinds"].get(rel, 0) + n
            e["kinds"] = {k: e["kinds"][k] for k in sorted(e["kinds"])}
            e["weight"] = sum(e["kinds"].values())
        l1_edges.sort(key=lambda e: (e["source"], e["target"]))
    _stamp_l1(l1_nodes)
    # the FLOW layout stays FK-ONLY deliberately: the deps gradient reads schema
    # dependency, call graphs can be cyclic, and the baked fx/fy must not churn
    # with every call-count change — so graft edges never reach the DAG.
    _fk_edges = [e for e in l1_edges if (e.get("kinds") or {}).get("fk")]
    flow_cols = _stamp_l1_flow(l1_nodes, _fk_edges)   # additive fx/fy (deps gradient)

    tbl2slug = _index_tables(entities)
    cross_edges = _cross_edges(entities, tbl2slug)   # piece-level cross-entity FKs

    # ── the web→API bridge (Path A frontend arm): match each fetching file's
    #    (method, path) calls to the endpoint PIECE they name, emit a web piece +
    #    a bridge cross-edge, and NAME every unmatched fetch (never drop it). web
    #    absent → every field empty and l1/l2/cross_edges/layout byte-identical to
    #    the FK+graft build; only stats.web names the absence (honesty law).
    web_present = bool(web and web.get("present"))
    web_by_slug: dict[str, list[dict]] = {}
    _bridges: list[dict] = []
    _unmatched: list[dict] = []
    _web_screens = _web_unhomed = 0
    if web_present:
        ep_index = _index_endpoints(entities)
        _slugs = set(entities)
        for screen in web.get("screens") or []:
            _hits: list[tuple[str, str]] = []
            for call in screen.get("calls") or []:
                key = (str(call.get("method", "")).upper(),
                       _norm_path(str(call.get("path", ""))))
                hit = ep_index.get(key)
                if hit:
                    _hits.append(hit)                       # (ep_slug, ep_id)
                else:
                    _unmatched.append({"from": screen["id"], "m": key[0],
                                       "p": call.get("path")})
            # home the screen: its file-home if the archmap carries the file, else
            # the (sorted-first) matched endpoint's entity — the bridge fallback.
            home = screen.get("slug")
            if home not in _slugs:
                home = sorted({s for s, _ in _hits})[0] if _hits else None
            if home is None:
                _web_unhomed += 1                           # unhomed + unmatched → not drawn
                continue
            web_by_slug.setdefault(home, []).append(
                {"id": screen["id"], "label": screen.get("label"),
                 "sites": len(screen.get("calls") or [])})
            _web_screens += 1
            for ep_slug, ep_id in _hits:
                _bridges.append({"from_slug": home, "from": screen["id"],
                                 "to_slug": ep_slug, "to": ep_id,
                                 "via": "fetch", "kind": "bridge"})
        # dedup a screen's repeat calls to one endpoint; sort both lists
        _seen: set[tuple[str, str]] = set()
        _bd: list[dict] = []
        for e in sorted(_bridges, key=lambda e: (e["from_slug"], e["from"],
                                                 e["to_slug"], e["to"])):
            k = (e["from"], e["to"])
            if k not in _seen:
                _seen.add(k)
                _bd.append(e)
        _bridges = _bd
        _unmatched.sort(key=lambda u: (u["m"], str(u["p"]), u["from"]))
        if _bridges:   # keep FK-only cross_edges byte-identical when no bridge exists
            cross_edges = sorted(cross_edges + _bridges,
                                 key=lambda e: (e["from_slug"], e["from"],
                                                e["to_slug"], e["to"], e.get("via", "")))

    # the per-element dossier's insight bundle — every block optional (a twin
    # without an insight section still builds; its cards go honest-empty)
    ti = amap.get("test_insight") or {}
    insight = {"fi": amap.get("function_insight") or {},
               "ti_ep": ti.get("by_endpoint") or {},
               "ti_model": ti.get("by_model") or {},
               "mi": amap.get("model_insight") or {},
               # P1b: graft's raw node facts (signature/exported), honest-empty when graft absent
               "node_facts": (graft.get("node_facts") or {}) if (graft and graft.get("present")) else {}}
    # the endpoint call-tree floor (graft): {<file>#<fn> → {fns, depth}} per handler.
    # graft absent → {} → no endpoint carries a behind field → byte-identical build.
    behind = (graft or {}).get("behind") or {}
    # per-element CROSS-ENTITY test journeys (criterion A) — junit + archmap only. Honest-empty when
    # test_insight is absent (→ {} → no det.test_journeys anywhere → byte-identical). NOT the station's
    # wire-journeys (buildJourneys): this is the traveling-test-chip, a per-node test-detail field.
    import os as _os, sys as _sys
    _gendir = _os.path.dirname(_os.path.abspath(__file__))   # this module's dir (loadable via importlib too)
    if _gendir not in _sys.path:
        _sys.path.insert(0, _gendir)
    import _a3_tests
    journeys = _a3_tests.derive_journeys(ti, amap.get("_file_entity") or {},
                                         amap.get("model_insight") or {})
    l2: dict[str, dict] = {}
    for slug in sorted(entities):
        code = entities[slug]
        if not code:
            continue
        graph = _l2(slug, code, tbl2slug, labels, insight, web_by_slug.get(slug), behind, journeys)
        _stamp_l2(graph)
        l2[slug] = graph

    return {
        "version": 1,
        "head": amap.get("head"),
        "colors": dict(colors or {}),   # per-entity palette, carried with the graph
        "l1": {"nodes": l1_nodes, "edges": l1_edges},
        "cross_edges": cross_edges,     # model→model FK edges that cross entities
        "l2": l2,
        "layout": {"l1": {"kind": "ring", "cx": 0.0, "cy": 0.0, "r": _L1_R,
                          "flow": {"col_w": _L1_FLOW_COL_W, "row_h": _L1_FLOW_ROW_H,
                                   "cols": flow_cols}},
                   "l2": {"kind": "columns", "col_w": _L2_COL_W, "row_h": _L2_ROW_H,
                          "order": list(_L2_KINDS)}},
        "stats": {
            "entities": sum(1 for n in l1_nodes if n["kind"] == "entity"),
            "l1_edges": len(l1_edges),
            "cross_edges": len(cross_edges),
            "l1_flow_cols": flow_cols,
            "unclaimed": any(n["kind"] == "unclaimed" for n in l1_nodes),
            "unresolved_tables": unresolved,
            # the graft arm's honesty record: absent → named absent, never silent;
            # present → the index fingerprint + the floor-not-census trust split.
            "graft": ({"present": True,
                       "reason": graft.get("reason"),
                       "index_hash": graft.get("index_hash"),
                       "cross_calls": (graft.get("stats") or {}).get("cross_calls", 0),
                       "cross_imports": (graft.get("stats") or {}).get("cross_imports", 0),
                       "confidence": (graft.get("stats") or {}).get("confidence"),
                       "dropped": (graft.get("stats") or {}).get("dropped")}
                      if graft_present else
                      {"present": False,
                       "reason": (graft or {}).get("reason", "not attempted")}),
            # the web arm's honesty record: the bridge is a HEURISTIC (graft traces
            # zero ts→py), so unmatched fetches are NAMED here, never dropped — a
            # coverage-gap finding, not a silent zero. Absent → named absent.
            "web": ({"present": True,
                     "reason": web.get("reason"),
                     "extractor": (web.get("stats") or {}).get("extractor"),
                     "screens": _web_screens,
                     "unhomed": _web_unhomed,
                     "fetch_sites": (web.get("stats") or {}).get("fetch_sites", 0),
                     "matched": len(_bridges),
                     "unmatched": _unmatched,
                     "dynamic": (web.get("stats") or {}).get("dynamic", 0)}
                    if web_present else
                    {"present": False,
                     "reason": (web or {}).get("reason", "not attempted")}),
            # the endpoint call-tree floor: a view-only complexity signal, honest by
            # construction (a handler graft cannot resolve gets no entry, not a zero).
            "behind": ({"present": True, "scored": len(behind),
                        "max_fns": max((b["fns"] for b in behind.values()), default=0)}
                       if graft_present else {"present": False}),
        },
    }


def emit(graph: dict[str, Any], center_out: Path) -> None:
    """Write the committed, human-diffable JSON + a ``window.GABE_C4`` sibling
    (the inflight.js file:// recipe — a strict-CSP page loads data via a script
    global, never fetch). A PR diff of c4-graph.json IS the graph change.

    Encoding is pinned to utf-8 (matching every sibling generator) so a non-ASCII
    label serializes to the same bytes on any build host, never the locale default."""
    center_out = Path(center_out)
    (center_out / "c4-graph.json").write_text(
        json.dumps(graph, indent=1, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8")
    # window globals — the strict-CSP / file:// no-fetch recipe. Colors ride a
    # sibling global so a renderer reads GABE_C4 (topology) + GABE_C4_COLORS (palette).
    (center_out / "c4-graph.js").write_text(
        "window.GABE_C4 = " + json.dumps(graph, ensure_ascii=False, sort_keys=True) + ";\n"
        + "window.GABE_C4_COLORS = "
        + json.dumps(graph.get("colors") or {}, ensure_ascii=False, sort_keys=True) + ";\n",
        encoding="utf-8")
