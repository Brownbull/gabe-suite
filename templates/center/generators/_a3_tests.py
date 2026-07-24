"""Testing Command Center — the test_insight engine (the test↔code thread).

Joins the junit corpus to the code map, both ways, at build time — derived
every run, stored nowhere but archmap (anti-bloat). Three confidence tiers,
never blurred (spike: docs/investigations/2026-07-23-test-thread-spike/):

  T1 "exercises"  — an HTTP path literal in the test matches an endpoint
                    (method+path, longest-suffix template match), or the test
                    calls / instantiates the element by imported name.
  T2 "via route"  — composed through the endpoint join: the endpoint's
                    handler function, response schema and touched models are
                    credited by the cases that drive the route.
  T3 "in reach"   — file-level import reach (all a web corpus gives below
                    file level; also the python fallback when a case cannot
                    be located as a def).

Python corpora get PER-CASE facts (junit case name == the test def; strip
[parametrize] brackets). Web corpora (vitest/playwright) get per-FILE facts:
import reach + quoted route literals (mock tables and assertions encode the
route without driving it — matched method-agnostically and credited at file
granularity, never dressed as a case-level proof).

Per-corpus disk roots are probed (junit file keys are runner-cwd-relative);
center.config.json corpora[].root overrides. Endpoint matching is
longest-suffix on path segments, so mount prefixes (/api/v1) need no config;
corpora[].route_prefix is honored first when present.
"""

from __future__ import annotations

import ast
import datetime as _dt
import json
import re
from pathlib import Path

import _center_data as D

_CID_RX = re.compile(r"(?<![A-Za-z0-9])C([0-9]{1,5})(?![0-9])")
_VERBS = {"get", "post", "put", "patch", "delete"}
_IMPORT_RX = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")
_ROUTE_RX = re.compile(r"""['"](/[A-Za-z0-9_\-./{}$]{2,})['"]""")
_TS_EXTS = (".ts", ".tsx", ".js", ".jsx")


def _probe_root(repo: Path, keys: list[str], override: str) -> str:
    """Which directory the junit file keys are relative to. The runner's cwd
    is a twin-side fact the XML does not carry — probe it, config overrides."""
    if override:
        return override
    tops = [d for d in repo.iterdir() if d.is_dir()
            and not d.name.startswith(".") and d.name != "node_modules"]
    cands = ([""] + sorted(d.name for d in tops)
             + sorted(f"{d.name}/{s.name}" for d in tops for s in d.iterdir()
                      if s.is_dir() and not s.name.startswith(".")
                      and s.name != "node_modules"))
    best, best_n = "", -1
    sample = keys[:12]
    for c in cands:
        n = sum(1 for k in sample if (repo / c / k).exists())
        if n > best_n:
            best, best_n = c, n
    return best if best_n > 0 else ""


def _segs(path: str) -> list[str]:
    return [s for s in path.strip("/").split("/") if s]


def _ep_index(amap: dict) -> list[dict]:
    fent = amap.get("_file_entity") or {}
    return [{**ep, "entity": fent.get(ep["file"], ""),
             "tsegs": _segs(ep["path"])}
            for ep in amap.get("endpoints", [])]


def _ep_match(method: str, literal_segs: list[str], eps: list[dict],
              prefix_segs: list[str]) -> dict | None:
    """Longest-suffix template match. '*' on the literal side is an f-string
    slot; '{param}' on the endpoint side matches any literal segment."""
    if prefix_segs and literal_segs[:len(prefix_segs)] == prefix_segs:
        literal_segs = literal_segs[len(prefix_segs):]
    best = None
    for e in eps:
        if method != "*" and e["method"] != method:
            continue
        t = e["tsegs"]
        if not t or len(t) > len(literal_segs):
            continue
        tail = literal_segs[-len(t):]
        if all(ts.startswith("{") or ls == "*" or ts == ls
               for ts, ls in zip(t, tail)):
            if best is None or len(t) > len(best["tsegs"]):
                best = e
    return best


def _fstr_segs(node: ast.JoinedStr) -> list[str] | None:
    """f-string path -> segments, formatted slots as '*' wildcards."""
    raw = ""
    for part in node.values:
        if isinstance(part, ast.Constant):
            raw += str(part.value)
        else:
            raw += "\x00"
    if not raw.startswith("/"):
        return None
    return ["*" if "\x00" in s else s for s in _segs(raw)]


class _PyFile:
    """One python test file's AST facts: module imports, and per-def calls /
    names / HTTP literals (module-level literals credit the file, not a def)."""

    def __init__(self, src: str):
        tree = ast.parse(src)
        self.imports: set[str] = set()          # dotted module paths
        self.imported_names: set[str] = set()
        self.defs: dict[str, dict] = {}          # def name -> facts
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                self.imports.update(a.name for a in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                self.imports.add(node.module)
                self.imported_names.update(a.name for a in node.names)
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                self.defs[node.name] = self._facts(node)
        self.file_facts = self._facts(tree)

    @staticmethod
    def _facts(node) -> dict:
        calls, names, hits = set(), set(), []
        for n in ast.walk(node):
            if isinstance(n, ast.Call):
                f = n.func
                if isinstance(f, ast.Name):
                    calls.add(f.id)
                elif isinstance(f, ast.Attribute):
                    calls.add(f.attr)
                    if f.attr in _VERBS and n.args:
                        a0 = n.args[0]
                        segs = None
                        if isinstance(a0, ast.Constant) and \
                                isinstance(a0.value, str) and \
                                a0.value.startswith("/"):
                            segs = _segs(a0.value)
                        elif isinstance(a0, ast.JoinedStr):
                            segs = _fstr_segs(a0)
                        if segs:
                            hits.append((f.attr.upper(), segs))
            elif isinstance(n, ast.Name):
                names.add(n.id)
        return {"calls": calls, "names": names, "http": hits}


def _case_ref(corpus: str, case: dict, tfile: str) -> dict:
    m = _CID_RX.search(case["name"])
    return {"cid": f"C{m.group(1)}" if m else "", "name": case["name"],
            "state": case["state"], "corpus": corpus, "tfile": tfile}


def _cov_files(repo: Path) -> dict[str, dict]:
    """Per-file line coverage from the wired reporters, WHEN captured —
    {repo-relative path: {'pct': float, 'age': iso}}. Roots probed the same
    way as junit keys. Absent report -> absent keys (named gap upstream)."""
    out: dict[str, dict] = {}
    cfg = D.CFG.get("coverage", {})
    api = cfg.get("api", {})
    if api.get("json") and (repo / api["json"]).exists():
        p = repo / api["json"]
        age = _dt.datetime.fromtimestamp(
            p.stat().st_mtime, _dt.timezone.utc).isoformat()
        files = (json.loads(p.read_text()).get("files") or {})
        root = _probe_root(repo, list(files)[:12], api.get("root", ""))
        for f, rec in files.items():
            pct = (rec.get("summary") or {}).get("percent_covered")
            if pct is not None:
                out[str(Path(root) / f) if root else f] = \
                    {"pct": round(pct, 1), "age": age}
    web = cfg.get("web", {})
    if web.get("summary") and (repo / web["summary"]).exists():
        p = repo / web["summary"]
        age = _dt.datetime.fromtimestamp(
            p.stat().st_mtime, _dt.timezone.utc).isoformat()
        data = json.loads(p.read_text())
        for f, rec in data.items():
            if f == "total":
                continue
            pct = (rec.get("lines") or {}).get("pct")
            rel = f
            try:
                rel = str(Path(f).resolve().relative_to(repo.resolve()))
            except ValueError:
                pass
            if pct is not None:
                out[rel] = {"pct": round(float(pct), 1), "age": age}
    return out


_CACHE: dict[str, dict] = {}


def test_insight(repo: Path) -> dict:
    """The whole thread, computed once per build (cached per repo)."""
    key = str(repo)
    if key in _CACHE:
        return _CACHE[key]
    import _a3_code
    amap = _a3_code.merge_amaps(repo)
    eps = _ep_index(amap)
    mi = _a3_code.model_insight(repo)
    fi = _a3_code.function_insight(repo)
    fent = amap.get("_file_entity") or {}
    fn_by_name: dict[str, list[str]] = {}
    for k, v in fi.items():
        fn_by_name.setdefault(v["name"], []).append(k)
    handler_key = {(e["file"], e["fn"]): f'{e["file"]}::{e["fn"]}' for e in eps}

    by_ep: dict[str, dict] = {}      # "file::fn" -> {corpus: [refs]}
    by_fn: dict[str, dict] = {}      # "file::fn" -> {direct: [], via_route: []}
    by_model: dict[str, dict] = {}   # class -> {direct: [], via_route: []}
    by_file: dict[str, dict] = {f: {"reach": [], "coverage": None}
                                for f in fent}
    exercises: dict[str, dict] = {}  # test file -> chips both ways
    case_home: dict[str, str] = {}   # cid -> test file

    def _ex(tfile: str) -> dict:
        return exercises.setdefault(
            tfile, {"corpus": "", "endpoints": [], "functions": [],
                    "models": [], "reaches": []})

    seen: set = set()

    def _once(bucket: list, tag: str, ref: dict) -> bool:
        sk = (tag, ref["corpus"], ref["cid"] or ref["name"], ref["tfile"])
        if sk in seen:
            return False
        seen.add(sk)
        bucket.append(ref)
        return True

    def _credit_ep(e: dict, ref: dict, corpus: str, tfile: str):
        k = f'{e["file"]}::{e["fn"]}'
        _once(by_ep.setdefault(k, {}).setdefault(corpus, []), "ep:" + k, ref)
        ex = _ex(tfile)
        chip = {"label": f'{e["method"]} {e["path"]}',
                "file": e["file"], "fn": e["fn"]}
        if chip not in ex["endpoints"]:
            ex["endpoints"].append(chip)
        # T2: the route's handler, response schema and touched models
        hk = handler_key.get((e["file"], e["fn"]))
        if hk:
            _once(by_fn.setdefault(hk, {}).setdefault("via_route", []),
                  "fnv:" + hk, ref)
        toks = set(re.findall(r"[A-Za-z_]\w+", e.get("resp") or ""))
        toks.update(e.get("touches", []))
        for tok in toks:
            if tok in mi:
                _once(by_model.setdefault(tok, {}).setdefault(
                    "via_route", []), "mdv:" + tok, ref)

    for c in D.CFG.get("corpora", []):
        corpus = c["key"]
        j = D.load_junit(corpus)
        if not j:
            continue
        root = _probe_root(repo, list(j["files"]), c.get("root", ""))
        prefix_segs = _segs(c.get("route_prefix", ""))
        for jf, rec in j["files"].items():
            disk = Path(root) / jf if root else Path(jf)
            tfile = str(disk)
            if not (repo / disk).exists():
                continue
            ex = _ex(tfile)
            ex["corpus"] = corpus
            for case in rec["cases"]:
                m = _CID_RX.search(case["name"])
                if m:
                    case_home.setdefault(f"C{m.group(1)}", tfile)
            if disk.suffix == ".py":
                try:
                    pf = _PyFile((repo / disk).read_text())
                except (SyntaxError, UnicodeDecodeError):
                    continue
                # T3 reach: imported modules -> mapped source files
                for mod in pf.imports:
                    cand = str(Path(root) / (mod.replace(".", "/") + ".py")) \
                        if root else mod.replace(".", "/") + ".py"
                    if cand in by_file:
                        by_file[cand]["reach"].append(tfile)
                        if cand not in ex["reaches"]:
                            ex["reaches"].append(cand)
                for case in rec["cases"]:
                    dn = re.sub(r"\[.*\]$", "", case["name"])
                    facts = pf.defs.get(dn) or pf.file_facts
                    ref = _case_ref(corpus, case, tfile)
                    for method, segs in facts["http"]:
                        e = _ep_match(method, segs, eps, prefix_segs)
                        if e:
                            _credit_ep(e, ref, corpus, tfile)
                    used = facts["calls"] | facts["names"]
                    for nm in used & pf.imported_names:
                        for k2 in fn_by_name.get(nm, []):
                            _once(by_fn.setdefault(k2, {}).setdefault(
                                "direct", []), "fnd:" + k2, ref)
                            _fc = {"name": nm, "file": k2.split("::")[0]}
                            if _fc not in ex["functions"]:
                                ex["functions"].append(_fc)
                        if nm in mi:
                            _once(by_model.setdefault(nm, {}).setdefault(
                                "direct", []), "mdd:" + nm, ref)
                            if nm not in ex["models"]:
                                ex["models"].append(nm)
            else:
                # Web corpus: file-level import reach + route literals
                src = (repo / disk).read_text(errors="replace")
                aliases = c.get("aliases", {})
                for spec in _IMPORT_RX.findall(src):
                    tgt = None
                    if spec.startswith("."):
                        tgt = (disk.parent / spec)
                    else:
                        for al, base in aliases.items():
                            if spec.startswith(al):
                                tgt = Path(base) / spec[len(al):].lstrip("/")
                                break
                    if tgt is None:
                        continue
                    for suf in ("",) + _TS_EXTS + tuple(
                            f"/index{e2}" for e2 in _TS_EXTS):
                        cand = str(Path(str(tgt) + suf)).replace("\\", "/")
                        cand = str(Path(cand).resolve()).replace(
                            str(repo.resolve()) + "/", "") \
                            if cand.startswith("/") else cand
                        cand = re.sub(r"(^|/)\./", r"\1", cand)
                        if cand in by_file:
                            by_file[cand]["reach"].append(tfile)
                            if cand not in ex["reaches"]:
                                ex["reaches"].append(cand)
                            break
                fref = {"cid": "", "name": f"{len(rec['cases'])} case(s)",
                        "state": "file", "corpus": corpus, "tfile": tfile}
                for lit in set(_ROUTE_RX.findall(src)):
                    segs = ["*" if ("{" in s or "$" in s) else s
                            for s in _segs(lit)]
                    e = _ep_match("*", segs, eps, prefix_segs)
                    if e:
                        _credit_ep(e, fref, corpus, tfile)

    out = {
        "by_endpoint": by_ep,
        "by_function": by_fn,
        "by_model": by_model,
        "by_file": {f: {"reach": sorted(set(v["reach"])),
                        "coverage": v["coverage"]}
                    for f, v in by_file.items()},
        "exercises": exercises,
        "case_home": case_home,
    }
    for f, cov in _cov_files(repo).items():
        if f in out["by_file"]:
            out["by_file"][f]["coverage"] = cov
    _CACHE[key] = out
    return out


def exercises_html(repo: Path, junit_key: str) -> str:
    """What a test file provably touches, as LINKS into the code estate —
    the connection the spike promised (T1 literals/imports, T3 reach).
    Suffix-joins the junit file key to the engine's disk-keyed receipts."""
    from _a3_code import _anchor
    from _a3_render import E
    ti = test_insight(repo)
    ex = next((v for k, v in ti["exercises"].items()
               if k.endswith(junit_key)), None)
    if not ex:
        return ""

    def _lnk(page: str, aid: str, label: str) -> str:
        return (f'<a class="dlink" href="{page}#{aid}">'
                f"<code>{E(label)}</code></a>")

    bits = []
    if ex.get("endpoints"):
        bits.append(("endpoints", " · ".join(
            _lnk("arch-endpoints.html",
                 _anchor("ep", "app", c["file"] + "-" + c["fn"]), c["label"])
            for c in ex["endpoints"][:8])
            + ("…" if len(ex["endpoints"]) > 8 else "")))
    if ex.get("functions"):
        bits.append(("functions", " · ".join(
            _lnk("arch-functions.html",
                 _anchor("fn", "app", c["file"] + "-" + c["name"]), c["name"])
            for c in ex["functions"][:8])
            + ("…" if len(ex["functions"]) > 8 else "")))
    if ex.get("models"):
        bits.append(("models", " · ".join(
            _lnk("arch-data-model.html", _anchor("dm", "app", m), m)
            for m in ex["models"][:8])
            + ("…" if len(ex["models"]) > 8 else "")))
    if ex.get("reaches"):
        bits.append(("reaches", " · ".join(
            _lnk("arch-code-map.html", _anchor("cm", "app", f), f)
            for f in ex["reaches"][:8])
            + ("…" if len(ex["reaches"]) > 8 else "")))
    if not bits:
        return ""
    return ('<p class="sub" style="margin-top:8px"><b>Exercises</b> (what '
            "this file provably touches — T1 literals/imports, T3 reach):"
            "</p>" + "".join(
                f'<p class="sub" style="margin:6px 0 2px"><b>{lbl}</b> — '
                f"{body}</p>" for lbl, body in bits))


def coverage_by_element(repo: Path, slug: str, app: bool = False) -> str:
    """Shape A (ruling 2026-07-23): the entity's code elements as ROWS —
    the strong side of the thread. Every row links its Code-page home; kind
    chips carry the receipts; an untested element is a VISIBLE gap row
    (all of them on entity pages, a count line at the app altitude)."""
    import _a3_code
    from _a3_code import _anchor
    from _a3_render import E, entity_badge, kind_ic, xtable
    ti = test_insight(repo)
    if app:
        amap = _a3_code.merge_amaps(repo)
        fent = amap.get("_file_entity") or {}
        xp = {"ep": "arch-endpoints.html", "dm": "arch-data-model.html",
              "fn": "arch-functions.html"}
    else:
        amap = _a3_code.collect_entity_map(slug, repo) or {}
        fent = {}
        xp = {"ep": "", "dm": "", "fn": ""}
    ckind = {c["key"]: c.get("kind", c["key"])
             for c in D.CFG.get("corpora", [])}
    kcls = {c.get("kind", c["key"]): c.get("tag_class", "")
            for c in D.CFG.get("corpora", [])}
    _st = {"pass": "s-ok", "fail": "s-high", "skip": "s-gap"}

    def chip(kind, n, title):
        return (f'<span class="tag tk {kcls.get(kind, "")}" '
                f'title="{E(kind)}: {E(title)}">{kind_ic(kind)} · {n}</span>')

    def gapchip(msg):
        return f'<span class="tag tk t-tgap" title="{E(msg)}">untested</span>'

    def receipts(groups):  # [(label, refs)] -> detail html
        out = ""
        for lbl, refs in groups:
            if not refs:
                continue
            rows = "".join(
                "<tr><td>"
                + (f'<a class="cid" href="test-matrix.html#{E(r["cid"])}">'
                   f'{E(r["cid"])}</a>' if r["cid"] else "—")
                + f"</td><td>{E(_CID_RX.sub('', r['name']).strip(' ·-_[]')[:70])}"
                f'</td><td><span class="tag {_st.get(r["state"], "")}">'
                f'{E(r["state"])}</span></td></tr>' for r in refs[:10])
            out += (f'<p class="sub" style="margin:6px 0 2px"><b>{E(lbl)}</b>'
                    f" ({len(refs)})</p>"
                    '<table class="tbl"><thead><tr><th>Case</th>'
                    "<th>What it asserts</th><th>State</th></tr></thead>"
                    f"<tbody>{rows}</tbody></table>"
                    + (f'<p class="sub">… {len(refs) - 10} more</p>'
                       if len(refs) > 10 else ""))
        return out

    def _state(all_refs):
        if not all_refs:
            return "—"
        fails = sum(1 for r in all_refs if r["state"] == "fail")
        filelevel = all(r["state"] == "file" for r in all_refs)
        if filelevel:
            return "file-level"
        return (f'<span style="color:#b3403a">{fails} failing</span>'
                if fails else "all pass")

    rows, untested = [], {"endpoint": 0, "model": 0, "function": 0}

    def _ent(f):
        o = fent.get(f, "")
        return ([entity_badge(o, o, 13)] if app else [])

    for e in amap.get("endpoints", []):
        key = f'{e["file"]}::{e["fn"]}'
        refs_by = ti["by_endpoint"].get(key) or {}
        allr = [r for rs in refs_by.values() for r in rs]
        if not allr and app:
            untested["endpoint"] += 1
            continue
        cell = (f'<a class="dlink" href="{xp["ep"]}#'
                f'{_anchor("ep", "app" if app else slug, e["file"] + "-" + e["fn"])}">'
                f'<b>{E(e["method"])}</b> <code>{E(e["path"])}</code></a>')
        chips = " ".join(chip(ckind.get(c2, c2), len(rs),
                              "receipts matching this route (T1)")
                         for c2, rs in sorted(refs_by.items()))             or gapchip("no case or spec matches this route")
        rows.append(([*_ent(e["file"]), cell, chips,
                      str(len(allr)) if allr else "—", _state(allr)],
                     receipts([(ckind.get(c2, c2), rs)
                               for c2, rs in sorted(refs_by.items())])))
    for m in (amap.get("models", []) + amap.get("schemas", [])):
        cls = m["cls"]
        rec = ti["by_model"].get(cls) or {}
        d, v = rec.get("direct") or [], rec.get("via_route") or []
        if not (d or v) and app:
            untested["model"] += 1
            continue
        cell = (f'<a class="dlink" href="{xp["dm"]}#'
                f'{_anchor("dm", "app" if app else slug, cls)}">'
                f"<code>{E(cls)}</code></a> <small>{'schema' if m in amap.get('schemas', []) else 'model'}</small>")
        chips = " ".join(filter(None, [
            chip(ckind.get(d[0]["corpus"], "unit"), len(d),
                 "cases using this class by name (T1)") if d else "",
            (f'<span class="tag tk t-via" title="via route (T2)">'
             f"via route · {len(v)}</span>") if v else ""]))             or gapchip("never touched by name nor via any route")
        rows.append(([*_ent(m.get("file", "")), cell, chips,
                      str(len(d) + len(v)) if (d or v) else "—",
                      _state(d + v)],
                     receipts([("direct", d), ("via route", v)])))
    fi = _a3_code.function_insight(repo)
    for key, c in fi.items():
        if not app and c.get("entity") != slug:
            continue
        rec = ti["by_function"].get(key) or {}
        d, v = rec.get("direct") or [], rec.get("via_route") or []
        if not (d or v):
            untested["function"] += 1
            if app:
                continue
        cell = (f'<a class="dlink" href="{xp["fn"]}#'
                f'{_anchor("fn", "app" if app else slug, c["file"] + "-" + c["name"])}">'
                f'<code>{E(c["name"])}()</code></a>')
        chips = " ".join(filter(None, [
            chip(ckind.get(d[0]["corpus"], "unit"), len(d),
                 "cases calling this function (T1)") if d else "",
            (f'<span class="tag tk t-via" title="via route (T2)">'
             f"via route · {len(v)}</span>") if v else ""]))             or gapchip("no case calls it, no route serves it")
        rows.append(([*_ent(c["file"]), cell, chips,
                      str(len(d) + len(v)) if (d or v) else "—",
                      _state(d + v)],
                     receipts([("direct", d), ("via route", v)])))

    cols = (["", "Element", "Kinds", "Cases", "State"] if app
            else ["Element", "Kinds", "Cases", "State"])
    w = (["40px", "2.4fr", "1.4fr", "0.6fr", "0.9fr"] if app
         else ["2.4fr", "1.4fr", "0.6fr", "0.9fr"])
    note = ""
    if app and any(untested.values()):
        note = ("Untested at this altitude (counted, not listed): "
                + " · ".join(f"{n} {k}(s)" for k, n in untested.items() if n)
                + " — each entity page lists ITS untested elements in full.")
    return xtable(cols, rows, widths=w, note=note)
