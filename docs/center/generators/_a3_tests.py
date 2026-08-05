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
import posixpath as _pp
import re
from pathlib import Path

import _center_data as D

_CID_RX = re.compile(r"(?<![A-Za-z0-9])C([0-9]{1,5})(?![0-9])")
_VERBS = {"get", "post", "put", "patch", "delete"}
_IMPORT_RX = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")
_IMPORT_CLAUSE_RX = re.compile(
    r"""import\s+([^;'"]+?)\s+from\s*['"]([^'"]+)['"]""")
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
    case_own: dict[str, dict] = {}   # "tfile::def" -> the case's OWN T1 chips

    def _ex(tfile: str) -> dict:
        # `unmapped`: imports that resolve to a REAL repo file no entity's
        # code map registers — the actionable half of a joinless verdict
        # (the join is waiting on adoption, not absent from the app).
        return exercises.setdefault(
            tfile, {"corpus": "", "endpoints": [], "functions": [],
                    "models": [], "reaches": [], "uses": [], "unmapped": []})

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
        for tok in sorted(toks):
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
                for mod in sorted(pf.imports):
                    cand = str(Path(root) / (mod.replace(".", "/") + ".py")) \
                        if root else mod.replace(".", "/") + ".py"
                    if cand in by_file:
                        by_file[cand]["reach"].append(tfile)
                        if cand not in ex["reaches"]:
                            ex["reaches"].append(cand)
                    elif (repo / cand).is_file() \
                            and cand not in ex["unmapped"]:
                        # A real repo module outside every entity's map —
                        # third-party imports never exist on this path.
                        ex["unmapped"].append(cand)
                for case in rec["cases"]:
                    dn = re.sub(r"\[.*\]$", "", case["name"])
                    located = pf.defs.get(dn)
                    facts = located or pf.file_facts
                    ref = _case_ref(corpus, case, tfile)
                    # A case's OWN chips (T1) exist only when its def was
                    # located — module-level facts stay file-tier, never
                    # dressed as the case's own (the ledger renders the
                    # difference as solid vs dashed `via file`).
                    own = (case_own.setdefault(
                        f"{tfile}::{dn}",
                        {"endpoints": [], "functions": [], "models": []})
                        if located is not None else None)
                    for method, segs in facts["http"]:
                        e = _ep_match(method, segs, eps, prefix_segs)
                        if e:
                            _credit_ep(e, ref, corpus, tfile)
                            if own is not None:
                                chip = {"label": f'{e["method"]} {e["path"]}',
                                        "file": e["file"], "fn": e["fn"]}
                                if chip not in own["endpoints"]:
                                    own["endpoints"].append(chip)
                    used = facts["calls"] | facts["names"]
                    for nm in sorted(used & pf.imported_names):
                        for k2 in fn_by_name.get(nm, []):
                            _once(by_fn.setdefault(k2, {}).setdefault(
                                "direct", []), "fnd:" + k2, ref)
                            _fc = {"name": nm, "file": k2.split("::")[0]}
                            if _fc not in ex["functions"]:
                                ex["functions"].append(_fc)
                            if own is not None and _fc not in own["functions"]:
                                own["functions"].append(_fc)
                        if nm in mi:
                            _once(by_model.setdefault(nm, {}).setdefault(
                                "direct", []), "mdd:" + nm, ref)
                            if nm not in ex["models"]:
                                ex["models"].append(nm)
                            if own is not None and nm not in own["models"]:
                                own["models"].append(nm)
            else:
                # Web corpus: file-level import reach + route literals
                src = (repo / disk).read_text(errors="replace")
                aliases = c.get("aliases", {})

                def _resolve(spec: str) -> str:
                    tgt = None
                    if spec.startswith("."):
                        tgt = disk.parent / spec
                    else:
                        for al, base in aliases.items():
                            if spec.startswith(al):
                                tgt = Path(base) / spec[len(al):].lstrip("/")
                                break
                    if tgt is None:
                        return ""
                    fallback = ""
                    for suf in ("",) + _TS_EXTS + tuple(
                            f"/index{e2}" for e2 in _TS_EXTS):
                        cand = str(Path(str(tgt) + suf)).replace("\\", "/")
                        cand = str(Path(cand).resolve()).replace(
                            str(repo.resolve()) + "/", "") \
                            if cand.startswith("/") else cand
                        # normpath collapses ./ AND ../ segments — a parent-
                        # relative import used to silently miss its target.
                        cand = _pp.normpath(cand)
                        if cand in by_file:
                            return cand
                        if not fallback and (repo / cand).is_file():
                            fallback = cand
                    # Resolved on disk, registered nowhere: the actionable
                    # gap — record it, return no mapped target.
                    if fallback and fallback not in ex["unmapped"]:
                        ex["unmapped"].append(fallback)
                    return ""

                for spec in _IMPORT_RX.findall(src):
                    cand = _resolve(spec)
                    if cand:
                        by_file[cand]["reach"].append(tfile)
                        if cand not in ex["reaches"]:
                            ex["reaches"].append(cand)
                # The SYMBOLS the file imports from the app — the closest a
                # file-tier corpus gets to naming the function/class under
                # test. Rendered `uses · T3`, never dressed as case facts.
                for clause, spec in _IMPORT_CLAUSE_RX.findall(src):
                    cand = _resolve(spec)
                    if not cand:
                        continue
                    for nm in re.split(r"[,{}]", clause):
                        nm = nm.strip()
                        if nm.startswith("type "):
                            nm = nm[5:].strip()
                        nm = nm.split(" as ")[0].strip()
                        if not nm or not re.match(r"^[A-Za-z_$][\w$]*$", nm):
                            continue
                        u = {"name": nm, "file": cand}
                        if u not in ex["uses"]:
                            ex["uses"].append(u)
                fref = {"cid": "", "name": f"{len(rec['cases'])} case(s)",
                        "state": "file", "corpus": corpus, "tfile": tfile,
                        "n": len(rec["cases"])}
                for lit in sorted(set(_ROUTE_RX.findall(src))):
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
        "case_own": {k: v for k, v in case_own.items() if any(v.values())},
    }
    for f, cov in _cov_files(repo).items():
        if f in out["by_file"]:
            out["by_file"][f]["coverage"] = cov
    _CACHE[key] = out
    return out


def untested_surface(repo: Path, slug: str, app: bool = False) -> str:
    """The one element-shaped section a Tests surface keeps (rulings Q3A/Q6A,
    2026-07-24): GAPS ONLY — an untested element has no case row to carry it,
    so it gets a row here; a tested element's receipts already live on its
    Code row, and restating the roster was exactly Shape A's failure. Entity
    mode lists the entity's own gaps in full (links land on its Code tab);
    app mode is the Gaps page — every entity's gaps, entity-filterable."""
    import _a3_code
    from _a3_code import _anchor
    from _a3_render import E, ENT_COL, entity_badge, table
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
    scope = "app" if app else slug

    def _ent(f):
        o = fent.get(f, "")
        return ([entity_badge(o, o, 13)] if app else [])

    rows = []
    for e in amap.get("endpoints", []):
        if ti["by_endpoint"].get(f'{e["file"]}::{e["fn"]}'):
            continue
        rows.append([*_ent(e["file"]),
                     f'<a class="dlink" href="{xp["ep"]}#'
                     f'{_anchor("ep", scope, e["file"] + "-" + e["fn"])}">'
                     f'<b>{E(e["method"])}</b> <code>{E(e["path"])}</code></a>',
                     "<small>endpoint</small>",
                     "no case or spec matches this route"])
    for m in (amap.get("models", []) + amap.get("schemas", [])):
        rec = ti["by_model"].get(m["cls"]) or {}
        if rec.get("direct") or rec.get("via_route"):
            continue
        kind = "schema" if m in amap.get("schemas", []) else "model"
        rows.append([*_ent(m.get("file", "")),
                     f'<a class="dlink" href="{xp["dm"]}#'
                     f'{_anchor("dm", scope, m["cls"])}">'
                     f'<code>{E(m["cls"])}</code></a>',
                     f"<small>{kind}</small>",
                     "never touched by name nor via any route"])
    fi = _a3_code.function_insight(repo)
    for key, c in fi.items():
        if not app and c.get("entity") != slug:
            continue
        rec = ti["by_function"].get(key) or {}
        if rec.get("direct") or rec.get("via_route"):
            continue
        rows.append([*_ent(c["file"]),
                     f'<a class="dlink" href="{xp["fn"]}#'
                     f'{_anchor("fn", scope, c["file"] + "-" + c["fn"])}">'
                     f'<code>{E(c["fn"])}()</code></a>',
                     "<small>function</small>",
                     "no case calls it, no route serves it"])
    if not rows:
        return ('<p class="sub">No untested elements at this altitude — every '
                "endpoint, model and function has at least one receipt.</p>")
    cols = ([ENT_COL, "Element", "Type", "Why it shows here"] if app
            else ["Element", "Type", "Why it shows here"])
    return table(cols, rows,
                 note=f"{len(rows)} element(s) untouched by any case or spec "
                      "— a row disappears by itself the moment a receipt "
                      "lands on its element.")


def untested_counts(repo: Path) -> dict[str, int]:
    """App-wide untested tallies per element type — the Gaps card's numbers,
    computed from the same joins the rows above render."""
    import _a3_code
    ti = test_insight(repo)
    amap = _a3_code.merge_amaps(repo)
    out = {"endpoint": 0, "model": 0, "function": 0}
    for e in amap.get("endpoints", []):
        if not ti["by_endpoint"].get(f'{e["file"]}::{e["fn"]}'):
            out["endpoint"] += 1
    for m in (amap.get("models", []) + amap.get("schemas", [])):
        rec = ti["by_model"].get(m["cls"]) or {}
        if not (rec.get("direct") or rec.get("via_route")):
            out["model"] += 1
    for key, c in _a3_code.function_insight(repo).items():
        rec = ti["by_function"].get(key) or {}
        if not (rec.get("direct") or rec.get("via_route")):
            out["function"] += 1
    return out
