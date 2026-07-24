"""Testing Command Center — the case LEDGER (operator rulings R1–R3 + Q1–Q6,
2026-07-24; the tests-section artifact, iteration 2, is the design record;
rounds 2–5 are operator verdicts applied on the shipped surface).

The C-id is the row: one entry per case IDENTITY, the test file demoted to a
metadata line under the assertion, parametrize variants grouped under their id
(one identity, N executions — any failing variant fails the row). The row
leads with the ENTITY icon (claiming entity first, thread-related entities
after); the full names live in the fold's ENTITIES row. What a case exercises
lives entirely in the FOLD — a labeled metadata grid (`.ledmeta`) with one
row per evidence tier. Tier codes (T1/T2/T3) never ride the labels: each tier
row ends in an ⓘ toggle that explains the tier on demand.

The fold's `uses` row is a TABLE (Symbol · Kind · Imported from): the symbols
a web test file imports from the app, classified by the export grammar of the
defining file (function / class / const / type / enum), by the model registry
(model), or by the function registry (function). A junit case without a C-id
renders with its name as identity and an `unminted` tag — the honesty check
that should read zero once /gabe-red mints them (Q2).

Filters are DROPDOWNS (R2): entity / kind / state as selects; tag (provenance
tokens like DF3 / W1 extracted from group names — the composite index over
groups) / endpoint / model / function as datalist type-aheads; free text last
(Q5). Filtering reads each row's data-* attributes — inherited and in-reach
facts match too. Every control's clear × sits in its TITLE line (no extra
bar width) and lights up only while that column holds a value. Default order:
failing first, then C-id descending (Q4); unminted rows close their band.
Every chip links the APP estate (arch-*.html anchors). The ledger row is the
canonical anchor of its C-id: every C-id pill elsewhere in the center lands
on `test-matrix.html#C<n>`.
"""

from __future__ import annotations

import re
from pathlib import Path

import _a3_code
import _a3_tests
from _a3_code import _anchor
from _a3_render import E, ENT_COL, _row_mark, entity_badge, kind_ic, th_label

_CID_RX = _a3_tests._CID_RX
_STATE_CHIP = {"pass": '<span class="tag s-ok">pass</span>',
               "fail": '<span class="tag s-high">fail</span>',
               "skip": '<span class="tag s-gap">skip</span>'}

# Provenance TOKENS in group names — decision/review/issue ids like DF3, W1,
# CA10, TX2b, #8. They are the composite index over groups: a handful of
# tokens span many describe blocks, so the filter stays small while full
# group names remain reachable through free-text search. C-ids are excluded
# (they are the row identity, not a tag).
_TAG_RX = re.compile(r"(?<![A-Za-z0-9])(#\d+|[A-Z]{1,4}\d+[a-z]?)(?![A-Za-z0-9])")


def _tags_of(group: str) -> list[str]:
    return sorted({t.lower() for t in _TAG_RX.findall(group)
                   if not re.fullmatch(r"C\d+", t)})


def _hl(group: str) -> str:
    """Escaped group text with its provenance tokens wrapped as .ltag pills."""
    return _TAG_RX.sub(
        lambda m: (m.group(0) if re.fullmatch(r"C\d+", m.group(0))
                   else f'<span class="ltag">{m.group(0)}</span>'),
        E(group))


def _tfile_of(jf: str, exercises: dict) -> str:
    """Suffix-join a runner-cwd-relative junit key to the engine's disk-keyed
    receipts (the same join exercises_html used)."""
    for k in exercises:
        if k.endswith(jf):
            return k
    return ""


def build_cases(repo: Path, inv_files: dict, corpora: list) -> list[dict]:
    """{corpus: {junit_file: rec}} -> case-identity records, ledger-ordered.

    Grouping key is the C-id when present (the identity), else the bracket-
    stripped case name scoped to its file (an unminted case is still one
    identity per def)."""
    ti = _a3_tests.test_insight(repo)
    ckind = {c["key"]: (c.get("kind", c["key"]), c.get("tag_class", ""))
             for c in corpora}
    out: list[dict] = []
    for corpus, files in inv_files.items():
        kind, kcls = ckind.get(corpus, (corpus, ""))
        for jf, rec in files.items():
            tfile = _tfile_of(jf, ti["exercises"])
            inh = ti["exercises"].get(tfile) if tfile else None
            groups: dict[str, dict] = {}
            order: list[str] = []
            for c in rec["cases"]:
                name = c["name"]
                group = ""
                # ">" means "Describe > case" ONLY in a js corpus — a pytest
                # parametrize id can carry one too (`C494[<lambda> at …]`,
                # gustify), and splitting there mangled the name, dropped the
                # C-id, and left the case unminted with no ledger anchor.
                # The junit FILE's suffix is the honest discriminator.
                if ">" in name and not jf.endswith(".py"):
                    group, _, name = (p.strip() for p in name.rpartition(">"))
                else:
                    tail = c.get("cls", "").rsplit(".", 1)[-1]
                    group = tail if tail[:1].isupper() else ""
                base = re.sub(r"\[.*\]$", "", name)
                m = _CID_RX.search(base)
                cid = f"C{m.group(1)}" if m else ""
                key = cid or f"{jf}::{base}"
                g = groups.get(key)
                if g is None:
                    label = _CID_RX.sub("", base).strip(" ·-_[]")
                    label = label.replace("_", " ")
                    g = groups[key] = {
                        "cid": cid, "label": label or base, "group": group,
                        "rkey": cid or f"{tfile or jf}::{base}",
                        "file": tfile or jf, "jfile": jf,
                        "corpus": corpus, "kind": kind,
                        "kcls": kcls, "inh": inh, "variants": [], "time": 0.0,
                        "own": (ti["case_own"].get(f"{tfile}::{base}")
                                if tfile else None),
                        "tags": _tags_of(group),
                    }
                    order.append(key)
                g["variants"].append((c["name"], c["state"], c["time"]))
                g["time"] += c["time"]
            for key in order:
                g = groups[key]
                sts = [s for _n, s, _t in g["variants"]]
                g["state"] = ("fail" if "fail" in sts
                              else "pass" if "pass" in sts else "skip")
                out.append(g)

    # Failing first (the record leads with what's broken), then C-id
    # descending — newest identities on top; unminted rows close their band.
    def _k(g: dict) -> tuple:
        n = int(g["cid"][1:]) if g["cid"] else -1
        return (0 if g["state"] == "fail" else 1, 0 if g["cid"] else 1, -n)

    out.sort(key=_k)
    return out


def _chip(href: str, label: str, cls: str, title: str) -> str:
    return (f'<a class="lchip {cls}" href="{href}" '
            f'title="{E(title)}">{E(label)}</a>')


_XP = {"ep": "arch-endpoints.html", "dm": "arch-data-model.html",
       "fn": "arch-functions.html", "cm": "arch-code-map.html"}


def _ep_chip(c: dict, cls: str, title: str) -> str:
    return _chip(
        f'{_XP["ep"]}#{_anchor("ep", "app", c["file"] + "-" + c["fn"])}',
        c["label"], cls, title)


def _fn_chip(file: str, name: str, cls: str, title: str) -> str:
    return _chip(
        f'{_XP["fn"]}#{_anchor("fn", "app", file + "-" + name)}',
        name + "()", cls, title)


def _dm_chip(nm: str, cls: str, title: str) -> str:
    return _chip(f'{_XP["dm"]}#{_anchor("dm", "app", nm)}', nm, cls, title)


def _row_feed(g: dict) -> dict:
    """This row's filterable element labels — own facts when the case has
    them, else the file's (Q1: filters match all tiers)."""
    feed: dict[str, list] = {"ep": [], "mdl": [], "fn": []}
    own = g["own"] or {}
    inh = g["inh"] or {}
    src = own if any(own.values()) else inh
    feed["ep"] = [c["label"] for c in src.get("endpoints", [])]
    feed["fn"] = [c["name"] + "()" for c in src.get("functions", [])]
    feed["mdl"] = list(src.get("models", []))
    feed["fn"] += [u["name"] for u in inh.get("uses", [])]
    return feed


def _in_reach(g: dict, fn_by_file: dict, mdl_by_file: dict) -> tuple:
    """What the case's reached source files DEFINE, from the registries —
    the deepest honest join a file-tier corpus gives (`in reach`).
    Returns ([{file, fn}], [model class]) deduped, registry order."""
    fns: list[dict] = []
    mdls: list[str] = []
    for f2 in (g["inh"] or {}).get("reaches") or []:
        for c in fn_by_file.get(f2, []):
            if c not in fns:
                fns.append(c)
        for cls in mdl_by_file.get(f2, []):
            if cls not in mdls:
                mdls.append(cls)
    return fns, mdls


def _related(g: dict, fent: dict, mdl_file: dict) -> list[str]:
    """The entities this case relates to through the thread — the files of
    its exercised / used / reached elements, mapped by the archmap."""
    ents: list[str] = []

    def _tag(f2: str) -> None:
        o = fent.get(f2, "")
        if o and o not in ents:
            ents.append(o)

    own = g["own"] or {}
    inh = g["inh"] or {}
    src = own if any(own.values()) else inh
    for c in src.get("endpoints", []):
        _tag(c["file"])
    for c in src.get("functions", []):
        _tag(c["file"])
    for nm in src.get("models", []):
        _tag(mdl_file.get(nm, ""))
    for u in inh.get("uses", []):
        _tag(u["file"])
    for f2 in inh.get("reaches", []):
        _tag(f2)
    return ents


# TS/JS export grammar — what an imported symbol IS in its defining file,
# plus what the grammar can read about it: a function's parameter list and
# return type, a const's initializer head. Grammar-read, never guessed.
_TS_EXPORT_RX = re.compile(
    r"export\s+(?:default\s+)?"
    r"(async\s+function|function|class|const|let|var|type|interface|enum)"
    r"\s+([A-Za-z_$][\w$]*)")
_TS_KIND = {"async function": "function", "function": "function",
            "class": "class", "const": "const", "let": "const",
            "var": "const", "type": "type", "interface": "type",
            "enum": "enum"}
_TSX_CACHE: dict[str, dict] = {}


def _match_paren(src: str, i: int) -> int:
    depth = 0
    for j in range(i, min(len(src), i + 4000)):
        if src[j] == "(":
            depth += 1
        elif src[j] == ")":
            depth -= 1
            if depth == 0:
                return j
    return -1


def _split_params(raw: str) -> list[tuple[str, str]]:
    """Top-level comma split of a TS parameter list -> (name, type) pairs.
    Defaults are stripped; a destructured param keeps its braces as the
    name. Best-effort grammar, never a guess beyond it."""
    parts, depth, cur = [], 0, ""
    for ch in raw:
        if ch in "([{<":
            depth += 1
        elif ch in ")]}>":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    out = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # strip a top-level default value
        d, cut = 0, len(part)
        for i2, ch in enumerate(part):
            if ch in "([{<":
                d += 1
            elif ch in ")]}>":
                d -= 1
            elif ch == "=" and d == 0 and part[i2:i2 + 2] != "=>":
                cut = i2
                break
        part = part[:cut].strip()
        d = 0
        for i2, ch in enumerate(part):
            if ch in "([{<":
                d += 1
            elif ch in ")]}>":
                d -= 1
            elif ch == ":" and d == 0:
                out.append((part[:i2].strip().rstrip("?"),
                            part[i2 + 1:].strip()))
                break
        else:
            out.append((part.rstrip("?"), ""))
    return out


def _ts_exports(repo: Path, rel: str) -> dict:
    """{exported name: {kind, params, ret, init}} for a ts/js file."""
    if rel not in _TSX_CACHE:
        recs: dict[str, dict] = {}
        p = repo / rel
        if p.suffix in (".ts", ".tsx", ".js", ".jsx") and p.exists():
            src = p.read_text(errors="replace")
            for m in _TS_EXPORT_RX.finditer(src):
                kw, nm = m.group(1).strip(), m.group(2)
                rec = {"kind": _TS_KIND.get(kw, "export"),
                       "params": [], "ret": "", "init": ""}
                if rec["kind"] == "function":
                    i = src.find("(", m.end())
                    j = _match_paren(src, i) if i != -1 else -1
                    if j != -1:
                        rec["params"] = _split_params(src[i + 1:j])
                        mt = re.match(r"\s*:\s*([^{]+?)\s*\{",
                                      src[j + 1:j + 200])
                        if mt:
                            rec["ret"] = mt.group(1).strip()
                elif rec["kind"] == "const":
                    mt = re.search(r"=\s*(.+)", src[m.end():m.end() + 160])
                    if mt:
                        rec["init"] = mt.group(1).split("\n")[0].strip()[:56]
                recs.setdefault(nm, rec)
        _TSX_CACHE[rel] = recs
    return _TSX_CACHE[rel]


_SHOW_REACH = 6      # visible chips per fold row; the note carries the rest
_SHOW_INREACH = 8


def _tinfo(text: str) -> str:
    """The tier explainer — an ⓘ opening a small POPOVER (round 7): normal
    prose anchored to the icon, an × to close, auto-dismissed by the ledger
    script after a few seconds. Never a line riding the label."""
    return ('<details class="tinfo"><summary aria-label="what this tier '
            'means">ⓘ</summary><div class="tx">'
            '<button type="button" class="tclose" aria-label="close">×'
            f"</button>{E(text)}</div></details>")


def _kv(rows: list) -> str:
    """(label, value[, info[, wide]]) rows. The ⓘ rides the LABEL — next to
    the name, never below the content; a wide row's value spans the full
    fold width under its label line."""
    out = ['<div class="ledmeta">']
    for r in rows:
        k, v = r[0], r[1]
        info = r[2] if len(r) > 2 else ""
        wide = r[3] if len(r) > 3 else False
        lab = E(k) + (_tinfo(info) if info else "")
        if wide:
            out.append(f'<span class="k kwide">{lab}</span>'
                       f'<div class="v vwide">{v}</div>')
        else:
            out.append(f'<span class="k">{lab}</span>'
                       f'<span class="v">{v}</span>')
    out.append("</div>")
    return "".join(out)


def _fold(g: dict, ep_meta: dict, mi: dict, labels: dict, ents: list,
          reach_fns: list, reach_mdls: list, classify, exports_of,
          ts_global: dict) -> str:
    """What opens under the row: the metadata spine as LABELED rows, the
    kind's facts tier by tier (each label carrying its ⓘ explainer), the
    uses block split by symbol kind — functions with their typed signatures
    (param/return types linked into the estate), constants with their
    declared value, types & models — and the variant table when one
    identity ran as many executions."""
    rows: list = [("file", f'<code>{E(g["file"])}</code>')]
    if g["group"]:
        rows.append(("group", _hl(g["group"])))
    rows.append(("corpus", E(g["corpus"])))
    rows.append(("time",
                 f'{g["time"]:.2f}s · {len(g["variants"])} execution(s)'))
    if ents:
        rows.append(("entities", " ".join(
            entity_badge(s, labels.get(s, s), 13, show_name=True)
            for s in ents)))

    own = g["own"] or {}
    inh = g["inh"] or {}
    if any(own.values()):
        t1 = []
        for c in own.get("endpoints", []):
            t1.append(_ep_chip(c, "lc-ep", "this case drives the route"))
        for c in own.get("functions", []):
            t1.append(_fn_chip(c["file"], c["name"], "lc-fn",
                               "this case calls it by name"))
        for nm in own.get("models", []):
            t1.append(_dm_chip(nm, "lc-mdl",
                               "this case uses the class by name"))
        rows.append(("exercises", "".join(t1),
                     "T1 — the case's own facts: its def drives the route, "
                     "calls the function, or uses the class directly."))
        via = []
        for c in own.get("endpoints", []):
            e = ep_meta.get((c["file"], c["fn"]))
            if not e:
                continue
            via.append(_fn_chip(e["file"], e["fn"], "lc-fn",
                                "the route's handler"))
            toks = set(re.findall(r"[A-Za-z_]\w+", e.get("resp") or ""))
            toks.update(e.get("touches", []))
            for tok in sorted(toks):
                if tok in mi:
                    via.append(_dm_chip(tok, "lc-mdl",
                                        "credited through the route"))
        if via:
            rows.append(("via route", "".join(via),
                         "T2 — credited through the endpoint the case "
                         "drives: the route's handler, response schema and "
                         "touched models."))
    else:
        vf = []
        for c in inh.get("endpoints", []):
            vf.append(_ep_chip(c, "lc-ep lc-via",
                               "the case's FILE touches this route"))
        for c in inh.get("functions", []):
            vf.append(_fn_chip(c["file"], c["name"], "lc-fn lc-via",
                               "imported and called somewhere in the file"))
        for nm in inh.get("models", []):
            vf.append(_dm_chip(nm, "lc-mdl lc-via",
                               "the class is used somewhere in the file"))
        if vf:
            rows.append(("via file", "".join(vf),
                         "file-tier — the case's FILE carries these facts; "
                         "the runner cannot attribute them to one case."))

    uses = inh.get("uses") or []
    if uses:
        # Type-link index: every export of the files this test imports or
        # reaches — a signature's param/return types link their home.
        tsindex: dict[str, str] = {}
        for f2 in sorted({u["file"] for u in uses}
                         | set(inh.get("reaches") or [])):
            for nm2 in exports_of(f2):
                tsindex.setdefault(nm2, f2)

        def _ty(t: str) -> str:
            def one(mm: re.Match) -> str:
                tok = mm.group(0)
                if tok in mi:
                    return (f'<a class="dlink" href="{_XP["dm"]}#'
                            f'{_anchor("dm", "app", tok)}">{tok}</a>')
                f3 = tsindex.get(tok) or ts_global.get(tok)
                if f3:
                    return (f'<a class="dlink" href="{_XP["cm"]}#'
                            f'{_anchor("cm", "app", f3)}">{tok}</a>')
                return tok
            return re.sub(r"[A-Za-z_$][\w$]*", one, E(t))

        buckets: dict[str, list] = {"function": [], "const": [], "other": []}
        for u in uses:
            kind, href = classify(u)
            rec = exports_of(u["file"]).get(u["name"]) or {}
            key2 = kind if kind in ("function", "const") else "other"
            buckets[key2].append((u, kind, href, rec))

        def _tbl(title: str, head: str, rows2: list, total: int) -> str:
            return (f'<p class="sub" style="margin:8px 0 2px"><b>{title}</b>'
                    f" ({total})</p>"
                    f'<table class="tbl"><thead><tr>{head}</tr></thead>'
                    f'<tbody>{"".join(rows2)}</tbody></table>')

        parts = []
        if buckets["function"]:
            rows2 = []
            for u, _k2, href, rec in buckets["function"]:
                sig = "(" + ", ".join(
                    (f"{E(n2)}: {_ty(t2)}" if t2 else E(n2))
                    for n2, t2 in rec.get("params", [])) + ")"
                if rec.get("ret"):
                    sig += " → " + _ty(rec["ret"])
                rows2.append(
                    f'<tr><td><a class="dlink" href="{href}">'
                    f'<code>{E(u["name"])}</code></a></td>'
                    f'<td><code class="lsig">{sig}</code></td>'
                    f'<td><code>{E(u["file"])}</code></td></tr>')
            parts.append(_tbl("functions",
                              "<th>Symbol</th><th>Signature</th>"
                              "<th>Imported from</th>", rows2,
                              len(buckets["function"])))
        if buckets["const"]:
            rows2 = [
                f'<tr><td><a class="dlink" href="{href}">'
                f'<code>{E(u["name"])}</code></a></td>'
                f'<td><code>{E(rec.get("init") or "—")}</code></td>'
                f'<td><code>{E(u["file"])}</code></td></tr>'
                for u, _k2, href, rec in buckets["const"]]
            parts.append(_tbl("constants",
                              "<th>Symbol</th><th>Declared as</th>"
                              "<th>Imported from</th>", rows2,
                              len(buckets["const"])))
        if buckets["other"]:
            rows2 = [
                f'<tr><td><a class="dlink" href="{href}">'
                f'<code>{E(u["name"])}</code></a></td>'
                f"<td>{E(k2)}</td>"
                f'<td><code>{E(u["file"])}</code></td></tr>'
                for u, k2, href, rec in buckets["other"]]
            parts.append(_tbl("types & models",
                              "<th>Symbol</th><th>Kind</th>"
                              "<th>Imported from</th>", rows2,
                              len(buckets["other"])))
        rows.append(("uses", "".join(parts),
                     "T3 (file-tier) — the symbols the test file imports "
                     "from the app, split by what each IS: signatures and "
                     "kinds are read from the defining file's export "
                     "grammar and the code registries; param and return "
                     "types link their data-model or code-map home.", True))

    reaches = inh.get("reaches") or []
    if reaches:
        rc = "".join(_chip(f'{_XP["cm"]}#{_anchor("cm", "app", f2)}', f2,
                           "lc-file lc-via", "file-level import reach")
                     for f2 in reaches)
        rows.append(("file reach", rc,
                     "T3 — the source files the test file imports, "
                     "resolved on disk."))
    if reach_fns or reach_mdls:
        ir = [_dm_chip(nm, "lc-mdl lc-via", "defined in a reached file")
              for nm in reach_mdls]
        ir += [_fn_chip(c["file"], c["fn"], "lc-fn lc-via",
                        "defined in a reached file")
               for c in reach_fns]
        rows.append(("in reach", "".join(ir),
                     "T3 — what the reached files define, from the code "
                     "registries; not a case-level proof."))
    html = _kv(rows)
    if len(g["variants"]) > 1:
        vr = "".join(
            f"<tr><td><code>{E(n)}</code></td><td>{_STATE_CHIP.get(s, '')}"
            f'</td><td class="num">{t:.2f}s</td></tr>'
            for n, s, t in g["variants"])
        html += (
            '<table class="tbl" style="margin-top:6px"><thead><tr>'
            "<th>Execution</th><th>State</th>"
            f'<th class="num">Time</th></tr></thead><tbody>{vr}</tbody>'
            "</table>")
    return html


def proof_verification(repo: Path, spec_val, corpora: list) -> dict | None:
    """The EVIDENCE SEAM (stage 3, operator go 2026-07-25): a proof-set
    manifest's `spec` joined to the corpus record. Tolerant of prose around
    the pointer — the first path-looking token is the join key; a FILE
    matches junit keys by suffix, a DIRECTORY matches every junit file under
    it. None when nothing joins (the caller renders the named gap)."""
    if not isinstance(spec_val, str) or not spec_val.strip():
        return None
    m = re.search(r"[A-Za-z0-9_][A-Za-z0-9_./-]*", spec_val)
    if not m:
        return None
    tok = m.group(0).rstrip("/.")
    import _center_data as D
    ti = _a3_tests.test_insight(repo)
    cids: list[str] = []
    eps: list[dict] = []
    mdls: list[str] = []
    nfiles = ncases = 0
    for c in corpora:
        j = D.load_junit(c["key"])
        if not j:
            continue
        for jf, rec in j["files"].items():
            if not (jf == tok or jf.endswith("/" + tok)
                    or jf.startswith(tok + "/") or f"/{tok}/" in jf):
                continue
            nfiles += 1
            ncases += rec["tests"]
            for case in rec["cases"]:
                mm = _CID_RX.search(case["name"])
                if mm and f"C{mm.group(1)}" not in cids:
                    cids.append(f"C{mm.group(1)}")
            tfile = _tfile_of(jf, ti["exercises"])
            ex = ti["exercises"].get(tfile) if tfile else None
            if ex:
                for ch in ex.get("endpoints", []):
                    if ch not in eps:
                        eps.append(ch)
                for nm in ex.get("models", []):
                    if nm not in mdls:
                        mdls.append(nm)
    if not nfiles:
        return None
    cids.sort(key=lambda x: int(x[1:]))
    return {"tok": tok, "files": nfiles, "cases": ncases,
            "cids": cids, "endpoints": eps, "models": mdls}


def proof_verification_html(repo: Path, spec_val, corpora: list) -> str:
    """The `Verified by` line for a proof-set row: the spec's C-id pills
    landing on the ledger rows of the SAME page, plus the endpoints/models
    the spec's files touch (file-tier chips into the code estate). A set
    whose manifest names no joinable spec reads its named gap — evidence
    without a corpus record is narrative, and says so."""
    pv = proof_verification(repo, spec_val, corpora)
    if pv is None:
        return ('<p class="sub" style="margin:2px 0 8px"><b>Verified by</b> '
                "— no spec pointer joins the corpus record (the manifest "
                "names no captured test file).</p>")
    from urllib.parse import quote as _uq2
    _all = ("test-matrix.html?led-q=" + _uq2(pv["tok"], safe="")
            + "#sec-tests-cases")
    pills = " ".join(f'<a class="cid" href="#C{x[1:]}">{E(x)}</a>'
                     for x in pv["cids"][:12])
    pills += (f' <a class="dlink" href="{_all}">all {pv["cases"]} in the '
              "case ledger →</a>")
    chips = "".join(_ep_chip(c, "lc-ep lc-via",
                             "the spec's file touches this route (file-tier)")
                    for c in pv["endpoints"])
    chips += "".join(_dm_chip(nm, "lc-mdl lc-via",
                              "used somewhere in the spec's file")
                     for nm in pv["models"])
    return (f'<p class="sub" style="margin:2px 0 8px"><b>Verified by</b> '
            f'<code>{E(pv["tok"])}</code> — {pv["cases"]} case(s) in '
            f'{pv["files"]} file(s): ' + pills
            + (f"<br><b>touches</b> {chips}" if chips else "") + "</p>")


def _bar(app: bool, ents: list, labels: dict, kinds: list, tags: list,
         feeds: dict, total: int) -> str:
    """The dropdown filter bar (R2): selects for the small vocabularies,
    datalist type-aheads for the element filters, free text last (Q5).
    One line always — controls shrink and the bar scrolls before wrapping.
    Each control's clear × rides its TITLE line (zero extra bar width),
    lights up while the column holds a value, and resets only that column."""
    def ctl(id_: str, lab: str, control: str) -> str:
        return (f'<label><span class="ltit">{E(lab)}'
                f'<button type="button" class="lx" data-for="{id_}" '
                f'aria-label="clear {E(lab)} filter">×</button></span>'
                f"{control}</label>")

    def sel(id_: str, lab: str, opts: list[tuple[str, str]]) -> str:
        o = "".join(f'<option value="{E(v)}">{E(t)}</option>' for v, t in opts)
        return ctl(id_, lab, f'<select id="{id_}">'
                             f'<option value="all">all</option>{o}</select>')

    def dl(id_: str, lab: str, opts: list) -> str:
        o = "".join(f'<option value="{E(v)}"></option>' for v in opts)
        return ctl(id_, lab,
                   f'<input id="{id_}" list="{id_}-dl" placeholder="any" '
                   f'size="10"><datalist id="{id_}-dl">{o}</datalist>')

    parts = []
    if app:
        parts.append(sel("led-ent", "entity",
                         [(s, labels.get(s, s)) for s in ents]))
    parts.append(sel("led-kind", "kind", [(k, k) for k in kinds]))
    parts.append(sel("led-state", "state",
                     [("pass", "pass"), ("fail", "fail"), ("skip", "skip")]))
    if tags:
        parts.append(dl("led-tag", "tag", tags))
    parts.append(dl("led-ep", "endpoint", sorted(set(feeds["ep"]))))
    parts.append(dl("led-mdl", "model", sorted(set(feeds["mdl"]))))
    parts.append(dl("led-fn", "function", sorted(set(feeds["fn"]))))
    parts.append(ctl("led-q", "search",
                     '<input id="led-q" size="12" '
                     'placeholder="name · C-id · chip">'))
    return (f'<div class="ledbar" id="ledbar">{"".join(parts)}'
            f'<span class="sub" id="ledcount">{total} case(s)</span></div>')


_JS = """<script>(function(){var bar=document.getElementById('ledbar');
var led=document.getElementById('ledger');if(!bar||!led)return;
var rows=[].slice.call(led.querySelectorAll('.xrow'));
var note=document.getElementById('ledcount');
function el(id){return document.getElementById(id);}
function v(id){var e=el(id);return e?e.value.trim().toLowerCase():'';}
function sync(){[].slice.call(bar.querySelectorAll('.lx')).forEach(
function(b){var e=el(b.dataset.for),val=e?e.value.trim():'';
b.classList.toggle('on',!!val&&val!=='all');});}
function opts(id){var d=el(id+'-dl');if(!d)return[];
return [].slice.call(d.querySelectorAll('option')).map(
function(o){return o.value.toLowerCase();});}
var exactOpts={'led-tag':opts('led-tag'),'led-ep':opts('led-ep'),
'led-mdl':opts('led-mdl'),'led-fn':opts('led-fn')};
var strictOn=false,strictVals={};
var attrOf={'led-tag':'tag','led-ep':'ep','led-mdl':'mdl','led-fn':'fn'};
var rAttr={'led-ep':'epr','led-mdl':'mdlr','led-fn':'fnr'};
function tokenMatch(id,d,q){if(!q)return true;
var val=(d[attrOf[id]]||'');
if(strictOn&&rAttr[id]&&strictVals[id]===q){val=(d[rAttr[id]]||'');}
if(exactOpts[id]&&exactOpts[id].indexOf(q)>=0){
return ('|'+val+'|').indexOf('|'+q+'|')>=0;}
return val.indexOf(q)>=0;}
function apply(){var ent=v('led-ent'),kind=v('led-kind'),st=v('led-state'),
tg=v('led-tag'),ep=v('led-ep'),mdl=v('led-mdl'),fn=v('led-fn'),
q=v('led-q'),n=0;
rows.forEach(function(r){var d=r.dataset,ok=true;
if(ent&&ent!=='all')ok=((' '+(d.ent||'')+' ').indexOf(' '+ent+' ')>=0);
if(ok&&kind&&kind!=='all')ok=(d.kind===kind);
if(ok&&st&&st!=='all')ok=(d.state===st);
if(ok&&tg)ok=tokenMatch('led-tag',d,tg);
if(ok&&ep)ok=tokenMatch('led-ep',d,ep);
if(ok&&mdl)ok=tokenMatch('led-mdl',d,mdl);
if(ok&&fn)ok=tokenMatch('led-fn',d,fn);
if(ok&&q)ok=((r.textContent+' '+(d.ep||'')+' '+(d.mdl||'')+' '+(d.fn||''))
.toLowerCase().indexOf(q)>=0);
r.classList.toggle('lhide',!ok);if(ok)n++;});
if(note)note.textContent=n+' of '+rows.length+' case(s)';sync();}
var qs=new URLSearchParams(location.search),pre=false;
strictOn=qs.get('led-strict')==='1';
['led-ent','led-kind','led-state','led-tag','led-ep','led-mdl','led-fn',
'led-q'].forEach(function(id){var val=qs.get(id);
if(val){var e=el(id);if(e){e.value=val;pre=true;
strictVals[id]=val.trim().toLowerCase();}}});
if(pre)apply();
bar.addEventListener('input',apply);bar.addEventListener('change',apply);
bar.addEventListener('click',function(e){var b=e.target.closest('.lx');
if(!b)return;var t=el(b.dataset.for);if(!t)return;
t.value=(t.tagName==='SELECT')?'all':'';apply();});
document.addEventListener('click',function(e){
var x=e.target.closest('.tclose');
if(x){e.preventDefault();x.closest('details').removeAttribute('open');return;}
var s2=e.target.closest('.tinfo>summary');
if(s2){var d2=s2.parentNode;clearTimeout(d2._t);
d2._t=setTimeout(function(){d2.removeAttribute('open');},6000);}});
})();</script>"""


def ledger_html(repo: Path, inv_files: dict, corpora: list,
                owners_of=None, labels: dict | None = None,
                app: bool = False, slug: str = "") -> str:
    """The whole component: bar + xtbl + script. Entity pages pass their
    rx-scoped junit files + their slug (the claiming icon); the estate
    passes the full corpus with `owners_of` (registry regexes)."""
    labels = labels or {}
    cases = build_cases(repo, inv_files, corpora)
    if not cases:
        return ('<p class="sub">No junit capture loaded — the ledger renders '
                "from the corpus record, and there is none to read.</p>")
    amap = _a3_code.merge_amaps(repo)
    ep_meta = {(e["file"], e["fn"]): e for e in amap.get("endpoints", [])}
    mi = _a3_code.model_insight(repo)
    fent = amap.get("_file_entity") or {}
    fn_by_file: dict[str, list] = {}
    for c in _a3_code.function_insight(repo).values():
        fn_by_file.setdefault(c["file"], []).append(c)
    mdl_by_file: dict[str, list] = {}
    mdl_file: dict[str, str] = {}
    for m in (amap.get("models", []) + amap.get("schemas", [])):
        mdl_by_file.setdefault(m.get("file", ""), []).append(m["cls"])
        mdl_file.setdefault(m["cls"], m.get("file", ""))

    def classify(u: dict) -> tuple[str, str]:
        """A uses symbol -> (what it is, where its page row lives)."""
        if u["name"] in mi:
            return ("model",
                    f'{_XP["dm"]}#{_anchor("dm", "app", u["name"])}')
        if any(c["fn"] == u["name"] for c in fn_by_file.get(u["file"], [])):
            return ("function",
                    f'{_XP["fn"]}#'
                    f'{_anchor("fn", "app", u["file"] + "-" + u["name"])}')
        rec = _ts_exports(repo, u["file"]).get(u["name"]) or {}
        return (rec.get("kind", "export"),
                f'{_XP["cm"]}#{_anchor("cm", "app", u["file"])}')

    def exports_of(f2: str) -> dict:
        return _ts_exports(repo, f2)

    # RECEIPT maps (strict mode, ruling 2026-07-25): which rows the engine
    # recorded as an element's receipts — case refs by identity, file-level
    # refs by test file (every case of that file is part of the receipt).
    # The see-all links land HERE, so their number is the fold's number.
    ti = _a3_tests.test_insight(repo)
    ep_lbl = {f'{e["file"]}::{e["fn"]}': f'{e["method"]} {e["path"]}'
              for e in amap.get("endpoints", [])}
    fn_tok = {k: c["name"] + "()"
              for k, c in _a3_code.function_insight(repo).items()}
    rec_case: dict[str, dict] = {}
    rec_file: dict[str, dict] = {}

    def _radd(r: dict, kind2: str, tok: str) -> None:
        if r["state"] == "file":
            b = rec_file.setdefault(r["tfile"],
                                    {"ep": set(), "fn": set(), "mdl": set()})
        else:
            rk = r["cid"] or (r["tfile"] + "::"
                              + re.sub(r"\[.*\]$", "", r["name"]))
            b = rec_case.setdefault(rk,
                                    {"ep": set(), "fn": set(), "mdl": set()})
        b[kind2].add(tok)

    for key2, by_corpus in ti["by_endpoint"].items():
        lbl2 = ep_lbl.get(key2)
        if lbl2:
            for refs2 in by_corpus.values():
                for r2 in refs2:
                    _radd(r2, "ep", lbl2)
    for key2, rec2 in ti["by_function"].items():
        tok2 = fn_tok.get(key2)
        if tok2:
            for refs2 in (rec2.get("direct") or [],
                          rec2.get("via_route") or []):
                for r2 in refs2:
                    _radd(r2, "fn", tok2)
    for cls2, rec2 in ti["by_model"].items():
        for refs2 in (rec2.get("direct") or [], rec2.get("via_route") or []):
            for r2 in refs2:
                _radd(r2, "mdl", cls2)

    # The GLOBAL ts-export index: every mapped web file's exports, name ->
    # defining file (first owner wins) — so a signature's type links home
    # even when the test file never imports the type's module directly.
    ts_global: dict[str, str] = {}
    for f2 in sorted(fent):
        if f2.endswith(_a3_tests._TS_EXTS):
            for nm2 in _ts_exports(repo, f2):
                ts_global.setdefault(nm2, f2)

    kinds = sorted({g["kind"] for g in cases})
    tags_all: set[str] = set()
    feeds: dict[str, list] = {"ep": [], "mdl": [], "fn": []}
    ents_seen: list[str] = []
    seen_ids: set[str] = set()
    cols = [ENT_COL, "Kind", "Case", "Asserts", "State"]
    widths = ["48px", "40px", "0.8fr", "3.4fr", "0.7fr"]
    ctxkey = "xtbl|" + "|".join(cols)
    body = []
    for g in cases:
        claim = ((owners_of(g["jfile"]) if owners_of else []) or []) if app \
            else ([slug] if slug else [])
        related = _related(g, fent, mdl_file)
        ents = claim + [e for e in related if e not in claim]
        if app:
            for o in claim:
                if o not in ents_seen:
                    ents_seen.append(o)
        cells = [" ".join(entity_badge(o, labels.get(o, o), 13)
                          for o in ents) or ""]
        nvar = (f' <small>×{len(g["variants"])}</small>'
                if len(g["variants"]) > 1 else "")
        # Kind is ICON-ONLY, second column — name + corpus ride the hover
        # title, the same dialect as the endpoints table.
        cells.append(f'<span class="tag {g["kcls"]} ic" '
                     f'title="{E(g["kind"])} · {E(g["corpus"])} corpus">'
                     f'{kind_ic(g["kind"], 14)}</span>')
        cells.append(
            (f'<span class="cid">{E(g["cid"])}</span>' if g["cid"] else
             '<span class="tag s-gap" title="junit carries no C-id — '
             '/gabe-red mints one">unminted</span>') + nvar)
        cells.append(
            f'{E(g["label"])}<span class="lfile"><code>{E(g["file"])}</code>'
            + (f' · {_hl(g["group"])}' if g["group"] else "") + "</span>")
        cells.append(_STATE_CHIP.get(g["state"], ""))
        feed = _row_feed(g)
        for c in (g["own"] or {}).get("endpoints", []):
            e = ep_meta.get((c["file"], c["fn"]))
            if not e:
                continue
            feed["fn"].append(e["fn"] + "()")
            toks = set(re.findall(r"[A-Za-z_]\w+", e.get("resp") or ""))
            toks.update(e.get("touches", []))
            feed["mdl"].extend(sorted(t for t in toks if t in mi))
        reach_fns, reach_mdls = _in_reach(g, fn_by_file, mdl_by_file)
        feed["fn"].extend(c["fn"] + "()" for c in reach_fns)
        feed["mdl"].extend(reach_mdls)
        tags_all.update(g["tags"])
        for k2 in feeds:
            feeds[k2].extend(feed[k2])
        mark = _row_mark(ctxkey, cells)
        if mark:
            cells = [f"{cells[0]}{mark}", *cells[1:]]
        idattr = ""
        if g["cid"] and g["cid"] not in seen_ids:
            seen_ids.add(g["cid"])
            idattr = f' id="{E(g["cid"])}"'
        rc2 = rec_case.get(g["rkey"]) or {}
        rf2 = rec_file.get(g["file"]) or {}
        r_ep = sorted(set(rc2.get("ep") or []) | set(rf2.get("ep") or []))
        r_fn = sorted(set(rc2.get("fn") or []) | set(rf2.get("fn") or []))
        r_mdl = sorted(set(rc2.get("mdl") or []) | set(rf2.get("mdl") or []))
        attrs = (f' data-ent="{E(" ".join(ents))}"'
                 f' data-tag="{E("|".join(g["tags"]))}"'
                 f' data-kind="{E(g["kind"])}" data-state="{E(g["state"])}"'
                 f' data-ep="{E("|".join(feed["ep"]).lower())}"'
                 f' data-mdl="{E("|".join(feed["mdl"]).lower())}"'
                 f' data-fn="{E("|".join(feed["fn"]).lower())}"'
                 f' data-epr="{E("|".join(r_ep).lower())}"'
                 f' data-mdlr="{E("|".join(r_mdl).lower())}"'
                 f' data-fnr="{E("|".join(r_fn).lower())}"')
        summ = ("".join(f"<span>{c}</span>" for c in cells)
                + '<span class="xtgl"></span>')
        detail = _fold(g, ep_meta, mi, labels, ents,
                       reach_fns, reach_mdls, classify, exports_of,
                       ts_global)
        body.append(f'<details class="xrow"{idattr}{attrs}>'
                    f"<summary>{summ}</summary>"
                    f'<div class="xbody">{detail}</div>'
                    "</details>")
    head = ('<div class="xhead">'
            + "".join(f"<span>{th_label(c)}</span>" for c in cols)
            + "<span></span></div>")
    tmpl = " ".join(widths) + " 20px"
    n_unminted = sum(1 for g in cases if not g["cid"])
    n_fail = sum(1 for g in cases if g["state"] == "fail")
    note = (f"{len(cases)} case identity(ies) · {n_fail} failing · "
            f"{n_unminted} unminted — failing first, then newest C-id. "
            "Open a row for what it exercises, tier by tier (ⓘ explains "
            "each tier); the entity icons lead the row, full names ride "
            "the fold.")
    return (_bar(app, sorted(ents_seen, key=lambda s: labels.get(s, s)),
                 labels, kinds, sorted(tags_all), feeds, len(cases))
            + f'<div class="xtbl" id="ledger" style="--xcols:{tmpl}">{head}'
            + "".join(body) + "</div>"
            + f'<p class="sub">{E(note)}</p>' + _JS)
