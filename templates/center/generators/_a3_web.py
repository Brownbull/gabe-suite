#!/usr/bin/env python3
"""_a3_web.py — the web→API bridge extractor (Path A: the frontend arm of the C4 graph).

Reads the app's web source ONCE (read-only glob) and returns, per fetching FILE,
the raw ``(method, path)`` each API-call site names — the FLOOR the bridge matcher
in ``_a3_graph`` joins to the endpoint key-space. graft cannot recover a fetch's
``(method, path)`` (its edges carry no call-site text), so this is a source-reading
arm, SEPARATE from the graft arm with its OWN try/except at the call site: a parser
bug degrades the web arm to honest-empty, never touching graft topology or FK bytes.

PLUGGABLE by design — the API-call idiom differs per app, so one hard-coded pattern
would score ~0% on the next app scanned. Three built-in matchers, auto-selected by
hit-count:
  * ``apiFetch``  — a centralized typed wrapper ``apiFetch<T>(path, {method})`` (gustify)
  * ``axios``     — ``axios.get/post/put/patch/delete(url, …)`` (method from the call name)
  * ``fetch``     — raw ``fetch(url, {method})``
An app with NO REST idiom (tRPC / GraphQL) yields ``present=True, screens=[]`` — an
honest zero, never a crash. A backend-only repo (no ``apps/web/src``) yields
``present=False`` with a named reason.

Homing: a web file already listed in an archmap entity's file rows homes by file
(``_file2slug``); a file the archmap does not carry is left ``slug=None`` for
``_a3_graph`` to home by the endpoint its fetch matched (the bridge fallback). The
match itself lives in ``_a3_graph`` (it owns the endpoint ids + the normalization),
so this module stays a pure extractor and returns RAW paths.

Determinism: files are globbed ``sorted(rglob)``; screens + calls sorted; no wallclock.
Battery: tests/arch-graph/run.sh (the web-arm extraction self-test, temp-dir source).
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from _a3_graft import _file2slug   # reuse the archmap file→entity homing table

# the conventional web source roots (relative to the repo), tried IN ORDER — the first
# that exists AND holds ts/tsx sources wins. Covers apps/web/src (monorepo), web/src,
# frontend/src, and a bare src/, so the frontend arm is not gustify-layout-specific.
# Absent everywhere → honest-empty.
_WEB_ROOTS = (("apps", "web", "src"), ("web", "src"), ("frontend", "src"),
              ("apps", "frontend", "src"), ("client", "src"), ("src",))
_SKIP_SUFFIXES = (".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx",
                  ".stories.tsx", ".stories.ts", ".d.ts")
_NOISE_PARTS = frozenset({"node_modules", "dist", "build", "storybook-static",
                          "__mocks__", "__tests__"})


def _detect_web_root(root: Path):
    """The first candidate web root that exists AND holds ≥1 non-noise .ts/.tsx — the
    web layer's location is project-specific, so we detect it rather than assume one."""
    for parts in _WEB_ROOTS:
        cand = root.joinpath(*parts)
        if not cand.is_dir():
            continue
        for f in cand.rglob("*.ts*"):
            if f.suffix in (".ts", ".tsx") and not any(p in _NOISE_PARTS for p in f.parts):
                return cand
    return None

# ── the pluggable call-site matchers; group 'path' = the first-arg literal ────
# apiFetch / axios / fetch. axios also captures the method in group 'm'.
_CALL_RES: dict[str, re.Pattern] = {
    "apiFetch": re.compile(
        r"""apiFetch\w*\s*(?:<[^>]*>)?\s*\(\s*[`'"](?P<path>[^`'"]+)[`'"]"""),
    "axios": re.compile(
        r"""axios\s*\.\s*(?P<m>get|post|put|patch|delete)\s*\(\s*[`'"](?P<path>[^`'"]+)[`'"]""",
        re.I),
    "fetch": re.compile(
        r"""(?<![\w.])fetch\s*\(\s*[`'"](?P<path>[^`'"]+)[`'"]"""),
    # AUDIT #5: openapi-fetch — `apiClient.GET("/path")` / `client.POST(...)`. The method is
    # the (UPPERCASE, case-sensitive → distinctive, won't catch Map.get()) property; the path
    # is the first-arg literal. gastify's dominant idiom (70 sites) that the roster missed.
    "openapiFetch": re.compile(
        r"""(?<![\w.])[A-Za-z_$][\w$]*\s*\.\s*(?P<m>GET|POST|PUT|PATCH|DELETE)\s*\(\s*[`'"](?P<path>[^`'"]+)[`'"]"""),
}
# a bare-identifier first arg (apiFetch(path, …)) — a dynamic call site, NAMED not matched.
_CALL_DYN: dict[str, re.Pattern] = {
    "apiFetch": re.compile(r"""apiFetch\w*\s*(?:<[^>]*>)?\s*\(\s*[A-Za-z_$][\w$]*\s*[,)]"""),
    "axios": re.compile(r"""axios\s*\.\s*(?:get|post|put|patch|delete)\s*\(\s*[A-Za-z_$][\w$]*\s*[,)]""", re.I),
    "fetch": re.compile(r"""(?<![\w.])fetch\s*\(\s*[A-Za-z_$][\w$]*\s*[,)]"""),
    "openapiFetch": re.compile(r"""(?<![\w.])[A-Za-z_$][\w$]*\s*\.\s*(?:GET|POST|PUT|PATCH|DELETE)\s*\(\s*[A-Za-z_$][\w$]*\s*[,)]"""),
}
# the wrapper's OWN definition file (apiFetch is defined here, not called) — its
# internal `path` param calls are not real call sites; skip the file entirely.
_DEF_RE = re.compile(r"""(?:export\s+)?(?:async\s+)?function\s+apiFetch|const\s+apiFetch\s*=""")
# method rides the options object: apiFetch(path, { method: "PATCH", body }) — a
# token scan (not object parse) so a nested body:{…} never defeats it. Default GET.
_METHOD_RE = re.compile(r"""method\s*:\s*[`'"](?P<m>GET|POST|PUT|PATCH|DELETE)""", re.I)


def _iter_sources(web_root: Path) -> list[Path]:
    """Every non-noise .ts/.tsx under the web root, deterministically ordered."""
    out: list[Path] = []
    for f in sorted(web_root.rglob("*.ts")) + sorted(web_root.rglob("*.tsx")):
        name = f.name
        if any(name.endswith(sfx) for sfx in _SKIP_SUFFIXES):
            continue
        if any(part in _NOISE_PARTS for part in f.parts):
            continue
        out.append(f)
    return sorted(out)


def _method_after(text: str, call_start: int) -> str:
    """Two-stage method read: scan the call's balanced-paren window for a
    `method:` token (survives a nested body:{…}); default GET."""
    depth = 0
    i = call_start
    n = len(text)
    # advance to the opening '(' of this call
    while i < n and text[i] != "(":
        i += 1
    start = i
    while i < n:
        c = text[i]
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                break
        i += 1
    window = text[start:i + 1]
    m = _METHOD_RE.search(window)
    return m.group("m").upper() if m else "GET"


def _detect_idiom(texts: list[str]) -> tuple[str | None, dict[str, int]]:
    """Pick the dominant API-call idiom by literal-call hit-count across the tree."""
    counts = {name: sum(len(rx.findall(t)) for t in texts)
              for name, rx in _CALL_RES.items()}
    best = max(sorted(counts), key=lambda k: counts[k])   # sorted → deterministic tie-break
    return (best if counts[best] > 0 else None), counts


def _extract_file(text: str, idiom: str) -> tuple[list[dict[str, str]], int]:
    """Return this file's (method, path) call sites + the dynamic-path site count."""
    calls: list[dict[str, str]] = []
    rx = _CALL_RES[idiom]
    for m in rx.finditer(text):
        path = m.group("path")
        if idiom in ("axios", "openapiFetch"):   # method rides the call itself (group m)
            method = m.group("m").upper()
        else:
            method = _method_after(text, m.start())
        calls.append({"method": method, "path": path})
    dyn = len(_CALL_DYN[idiom].findall(text))
    # de-dup + sort for determinism
    seen: set[tuple[str, str]] = set()
    uniq: list[dict[str, str]] = []
    for c in sorted(calls, key=lambda c: (c["method"], c["path"])):
        key = (c["method"], c["path"])
        if key not in seen:
            seen.add(key)
            uniq.append(c)
    return uniq, dyn


def _rel(f: Path, root: Path) -> str:
    """Repo-relative posix path — the key _file2slug and the archmap file rows use."""
    try:
        return f.relative_to(root).as_posix()
    except ValueError:
        return f.as_posix()


def web_arm(root: Path, entities: dict[str, Any]) -> dict[str, Any]:
    """The whole web arm, one call: glob → detect idiom → extract call sites →
    home by file. NEVER raises inside (the caller still wraps it — defence in
    depth); any failure returns ``{present: False, reason}``.

    Returns ``{present, reason, extractor, screens, stats}`` where each screen is
    one fetching FILE collapsed to a single node (id ``web:<relpath-no-suffix>``),
    carrying its raw ``calls`` for _a3_graph to match. ``present=False`` carries only
    the reason and the caller's FK+graft graph stays byte-identical.
    """
    try:
        root = Path(root)
        web_root = _detect_web_root(root)
        if web_root is None:
            return {"present": False,
                    "reason": "no web source (tried " + ", ".join("/".join(p) for p in _WEB_ROOTS) + ")"}
        files = _iter_sources(web_root)
        # read every candidate once; drop the wrapper's own definition file
        texts: list[tuple[Path, str]] = []
        for f in files:
            try:
                src = f.read_text(errors="ignore")
            except OSError:
                continue
            if _DEF_RE.search(src):
                continue                       # the apiFetch definition, not a caller
            texts.append((f, src))
        idiom, counts = _detect_idiom([t for _, t in texts])
        if idiom is None:
            return {"present": True, "reason": "no REST api-call idiom detected",
                    "extractor": None, "screens": [],
                    "stats": {"screens": 0, "fetch_sites": 0, "dynamic": 0,
                              "extractor": None, "idiom_hits": counts}}
        f2s = _file2slug(entities)
        screens: list[dict[str, Any]] = []
        total_sites = total_dyn = 0
        for f, src in texts:
            calls, dyn = _extract_file(src, idiom)
            if not calls and not dyn:
                continue
            rel = _rel(f, root)
            screens.append({
                "id": "web:" + re.sub(r"\.(ts|tsx)$", "", rel),
                "file": rel,
                "slug": f2s.get(rel),          # file-homed; None → _a3_graph endpoint-homes
                "label": re.sub(r"\.(ts|tsx)$", "", f.name),
                "calls": calls,
                "dynamic": dyn,
            })
            total_sites += len(calls)
            total_dyn += dyn
        screens.sort(key=lambda s: s["id"])
        return {
            "present": True, "reason": f"{idiom} · {len(screens)} fetching files",
            "extractor": idiom, "screens": screens,
            "stats": {"screens": len(screens), "fetch_sites": total_sites,
                      "dynamic": total_dyn, "extractor": idiom},
        }
    except Exception as exc:   # noqa: BLE001 — the arm enhances, never breaks, the build
        return {"present": False, "reason": f"web arm error: {exc}"}
