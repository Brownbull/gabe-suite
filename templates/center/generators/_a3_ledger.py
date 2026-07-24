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
from _a3_render import E, _row_mark, entity_badge, kind_ic

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
                if ">" in name:                 # vitest: "Describe > case"
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


# TS/JS export grammar — classifies what an imported symbol IS in its
# defining file (the uses table's Kind column). Grammar-read, never guessed
# from casing.
_TS_EXPORT_RX = re.compile(
    r"export\s+(?:default\s+)?"
    r"(async\s+function|function|class|const|let|var|type|interface|enum)"
    r"\s+([A-Za-z_$][\w$]*)")
_TS_KIND = {"async function": "function", "function": "function",
            "class": "class", "const": "const", "let": "const",
            "var": "const", "type": "type", "interface": "type",
            "enum": "enum"}
_TSK_CACHE: dict[str, dict] = {}


def _ts_kinds(repo: Path, rel: str) -> dict:
    if rel not in _TSK_CACHE:
        kinds: dict[str, str] = {}
        p = repo / rel
        if p.suffix in (".ts", ".tsx", ".js", ".jsx") and p.exists():
            for kw, nm in _TS_EXPORT_RX.findall(
                    p.read_text(errors="replace")):
                kinds.setdefault(nm, _TS_KIND.get(kw.strip(), "export"))
        _TSK_CACHE[rel] = kinds
    return _TSK_CACHE[rel]


_SHOW_REACH = 6      # visible chips per fold row; the note carries the rest
_SHOW_INREACH = 8


def _tinfo(text: str) -> str:
    """The tier explainer — an ⓘ the reader opens on demand instead of a
    T1/T2/T3 code riding the label (operator, round 5)."""
    return ('<details class="tinfo"><summary aria-label="what this tier '
            f'means">ⓘ</summary><div class="tx">{E(text)}</div></details>')


def _kv(rows: list[tuple[str, str]]) -> str:
    return ('<div class="ledmeta">' + "".join(
        f'<span class="k">{E(k)}</span><span class="v">{v}</span>'
        for k, v in rows) + "</div>")


def _fold(g: dict, ep_meta: dict, mi: dict, labels: dict, ents: list,
          reach_fns: list, reach_mdls: list, classify) -> str:
    """What opens under the row: the metadata spine as LABELED rows, the
    kind's facts tier by tier (each with its ⓘ explainer), the uses TABLE,
    and the variant table when one identity ran as many executions."""
    rows: list[tuple[str, str]] = [
        ("file", f'<code>{E(g["file"])}</code>')]
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
        rows.append(("exercises", "".join(t1) + _tinfo(
            "T1 — the case's own facts: its def drives the route, calls "
            "the function, or uses the class directly.")))
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
            rows.append(("via route", "".join(via) + _tinfo(
                "T2 — credited through the endpoint the case drives: the "
                "route's handler, response schema and touched models.")))
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
            rows.append(("via file", "".join(vf) + _tinfo(
                "file-tier — the case's FILE carries these facts; the "
                "runner cannot attribute them to one case.")))
    uses = inh.get("uses") or []
    if uses:
        urows = ""
        for u in uses[:_SHOW_INREACH]:
            kind, href = classify(u)
            urows += (f'<tr><td><a class="dlink" href="{href}">'
                      f'<code>{E(u["name"])}</code></a></td>'
                      f"<td>{E(kind)}</td>"
                      f'<td><code>{E(u["file"])}</code></td></tr>')
        more = (f'<p class="sub">… {len(uses) - _SHOW_INREACH} more '
                "import(s)</p>" if len(uses) > _SHOW_INREACH else "")
        rows.append(("uses",
                     '<table class="tbl"><thead><tr><th>Symbol</th>'
                     "<th>Kind</th><th>Imported from</th></tr></thead>"
                     f"<tbody>{urows}</tbody></table>{more}" + _tinfo(
                         "T3 (file-tier) — the symbols the test file "
                         "imports from the app; the closest a web corpus "
                         "gets to naming what is under test. Kind is read "
                         "from the defining file's export grammar and the "
                         "code registries.")))
    reaches = inh.get("reaches") or []
    if reaches:
        rc = "".join(_chip(f'{_XP["cm"]}#{_anchor("cm", "app", f2)}', f2,
                           "lc-file lc-via", "file-level import reach")
                     for f2 in reaches[:_SHOW_REACH])
        if len(reaches) > _SHOW_REACH:
            rc += (f'<span class="lchip lc-more">+'
                   f"{len(reaches) - _SHOW_REACH} more</span>")
        rows.append(("file reach", rc + _tinfo(
            "T3 — the source files the test file imports, resolved on "
            "disk.")))
    if reach_fns or reach_mdls:
        ir = [_dm_chip(nm, "lc-mdl lc-via", "defined in a reached file")
              for nm in reach_mdls[:_SHOW_INREACH]]
        ir += [_fn_chip(c["file"], c["fn"], "lc-fn lc-via",
                        "defined in a reached file")
               for c in reach_fns[:_SHOW_INREACH]]
        hidden = (max(0, len(reach_mdls) - _SHOW_INREACH)
                  + max(0, len(reach_fns) - _SHOW_INREACH))
        note = (f'<span class="lchip lc-more">+{hidden} more defined '
                "there</span>" if hidden else "")
        rows.append(("in reach", "".join(ir) + note + _tinfo(
            "T3 — what the reached files define, from the code "
            "registries; not a case-level proof.")))
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
function apply(){var ent=v('led-ent'),kind=v('led-kind'),st=v('led-state'),
tg=v('led-tag'),ep=v('led-ep'),mdl=v('led-mdl'),fn=v('led-fn'),
q=v('led-q'),n=0;
rows.forEach(function(r){var d=r.dataset,ok=true;
if(ent&&ent!=='all')ok=((' '+(d.ent||'')+' ').indexOf(' '+ent+' ')>=0);
if(ok&&kind&&kind!=='all')ok=(d.kind===kind);
if(ok&&st&&st!=='all')ok=(d.state===st);
if(ok&&tg)ok=((d.tag||'').indexOf(tg)>=0);
if(ok&&ep)ok=((d.ep||'').indexOf(ep)>=0);
if(ok&&mdl)ok=((d.mdl||'').indexOf(mdl)>=0);
if(ok&&fn)ok=((d.fn||'').indexOf(fn)>=0);
if(ok&&q)ok=((r.textContent+' '+(d.ep||'')+' '+(d.mdl||'')+' '+(d.fn||''))
.toLowerCase().indexOf(q)>=0);
r.classList.toggle('lhide',!ok);if(ok)n++;});
if(note)note.textContent=n+' of '+rows.length+' case(s)';sync();}
bar.addEventListener('input',apply);bar.addEventListener('change',apply);
bar.addEventListener('click',function(e){var b=e.target.closest('.lx');
if(!b)return;var t=el(b.dataset.for);if(!t)return;
t.value=(t.tagName==='SELECT')?'all':'';apply();});
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
        k = _ts_kinds(repo, u["file"]).get(u["name"], "export")
        return (k, f'{_XP["cm"]}#{_anchor("cm", "app", u["file"])}')

    kinds = sorted({g["kind"] for g in cases})
    tags_all: set[str] = set()
    feeds: dict[str, list] = {"ep": [], "mdl": [], "fn": []}
    ents_seen: list[str] = []
    seen_ids: set[str] = set()
    cols = ["", "Case", "Asserts", "Kind", "State"]
    widths = ["48px", "0.8fr", "3.1fr", "0.9fr", "0.7fr"]
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
        cells.append(
            (f'<span class="cid">{E(g["cid"])}</span>' if g["cid"] else
             '<span class="tag s-gap" title="junit carries no C-id — '
             '/gabe-red mints one">unminted</span>') + nvar)
        cells.append(
            f'{E(g["label"])}<span class="lfile"><code>{E(g["file"])}</code>'
            + (f' · {_hl(g["group"])}' if g["group"] else "") + "</span>")
        cells.append(f'<span class="tag {g["kcls"]}" title="{E(g["corpus"])} '
                     f'corpus">{kind_ic(g["kind"])} {E(g["kind"])}</span>')
        cells.append(_STATE_CHIP.get(g["state"], ""))
        feed = _row_feed(g)
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
        attrs = (f' data-ent="{E(" ".join(ents))}"'
                 f' data-tag="{E(" ".join(g["tags"]))}"'
                 f' data-kind="{E(g["kind"])}" data-state="{E(g["state"])}"'
                 f' data-ep="{E("|".join(feed["ep"]).lower())}"'
                 f' data-mdl="{E("|".join(feed["mdl"]).lower())}"'
                 f' data-fn="{E("|".join(feed["fn"]).lower())}"')
        summ = ("".join(f"<span>{c}</span>" for c in cells)
                + '<span class="xtgl"></span>')
        detail = _fold(g, ep_meta, mi, labels, ents,
                       reach_fns, reach_mdls, classify)
        body.append(f'<details class="xrow"{idattr}{attrs}>'
                    f"<summary>{summ}</summary>"
                    f'<div class="xbody">{detail}</div>'
                    "</details>")
    head = ('<div class="xhead">'
            + "".join(f"<span>{E(c)}</span>" for c in cols)
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
