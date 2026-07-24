"""Testing Command Center — the case LEDGER (operator rulings R1–R3 + Q1–Q6,
2026-07-24; the tests-section artifact, iteration 2, is the design record).

The C-id is the row: one entry per case IDENTITY, the test file demoted to a
metadata line under the assertion, parametrize variants grouped under their id
(one identity, N executions — any failing variant fails the row). Exercises
chips ride the row: a case's OWN facts (T1, from its located def) render
solid; a case with none inherits its FILE's facts rendered dashed and titled
`via file` — ~23% of cases carry own facts while files join at 86–100%, and
the tier stays visible instead of the cell lying empty (Q1). A junit case
without a C-id renders with its name as identity and an `unminted` tag —
the honesty check that should read zero once /gabe-red mints them (Q2).

Filters are DROPDOWNS (R2): entity / kind / state as selects; endpoint /
model / function each a datalist type-ahead listing only elements at least
one chip names; plus free text over names, C-ids and chip labels (Q5).
Filtering reads each row's data-* attributes — inherited chips match too,
so "which tests touch X" returns every case in files that touch X, not the
6-row T1 sliver. Default order: failing rows first, then C-id descending —
sequential minting makes the top of the ledger the newest verification work
(Q4); unminted rows close their state band.

Every chip links the APP estate (arch-*.html anchors) — those pages render
every element, so a chip can never point at an anchor an entity page chose
not to render. The ledger row is the canonical anchor of its C-id: every
C-id pill elsewhere in the center lands on `test-matrix.html#C<n>`.
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


def _row_chips(g: dict, cap: int = 4) -> tuple[str, dict]:
    """The Exercises cell + this row's filterable element labels. Own facts
    (T1) render solid; a row without any inherits its file's facts dashed —
    the tier distinction survives at row level (Q1)."""
    feed: dict[str, list] = {"ep": [], "mdl": [], "fn": []}
    chips: list[str] = []
    own = g["own"] or {}
    if any(own.values()):
        for c in own.get("endpoints", []):
            feed["ep"].append(c["label"])
            chips.append(_chip(
                f'{_XP["ep"]}#{_anchor("ep", "app", c["file"] + "-" + c["fn"])}',
                c["label"], "lc-ep", "T1 — this case drives the route"))
        for c in own.get("functions", []):
            feed["fn"].append(c["name"] + "()")
            chips.append(_chip(
                f'{_XP["fn"]}#{_anchor("fn", "app", c["file"] + "-" + c["name"])}',
                c["name"] + "()", "lc-fn", "T1 — this case calls it by name"))
        for nm in own.get("models", []):
            feed["mdl"].append(nm)
            chips.append(_chip(
                f'{_XP["dm"]}#{_anchor("dm", "app", nm)}',
                nm, "lc-mdl", "T1 — this case uses the class by name"))
    elif g["inh"]:
        inh = g["inh"]
        for c in inh.get("endpoints", []):
            feed["ep"].append(c["label"])
            chips.append(_chip(
                f'{_XP["ep"]}#{_anchor("ep", "app", c["file"] + "-" + c["fn"])}',
                c["label"], "lc-ep lc-via",
                "via file — the case's FILE touches this route (file-tier)"))
        for c in inh.get("functions", []):
            feed["fn"].append(c["name"] + "()")
            chips.append(_chip(
                f'{_XP["fn"]}#{_anchor("fn", "app", c["file"] + "-" + c["name"])}',
                c["name"] + "()", "lc-fn lc-via",
                "via file — imported and called somewhere in the file"))
        for nm in inh.get("models", []):
            feed["mdl"].append(nm)
            chips.append(_chip(
                f'{_XP["dm"]}#{_anchor("dm", "app", nm)}',
                nm, "lc-mdl lc-via",
                "via file — the class is used somewhere in the file"))
        if not chips:
            for f2 in inh.get("reaches", []):
                chips.append(_chip(
                    f'{_XP["cm"]}#{_anchor("cm", "app", f2)}',
                    "reach: " + f2.rsplit("/", 1)[-1], "lc-file lc-via",
                    f"via file — imports reach {f2} (T3)"))
    shown = chips[:cap]
    more = (f'<span class="lchip lc-more">+{len(chips) - cap}</span>'
            if len(chips) > cap else "")
    cell = ("".join(shown) + more) if chips else '<span class="sub">—</span>'
    return cell, feed


def _fold(g: dict, ep_meta: dict, mi: dict) -> str:
    """What opens under the row — the metadata spine every kind shares, the
    kind's own facts (R3), and the variant table when one identity ran as
    many executions."""
    out = []
    if len(g["variants"]) > 1:
        vr = "".join(
            f"<tr><td><code>{E(n)}</code></td><td>{_STATE_CHIP.get(s, '')}"
            f'</td><td class="num">{t:.2f}s</td></tr>'
            for n, s, t in g["variants"])
        out.append(
            f'<p class="sub" style="margin:2px 0"><b>{len(g["variants"])} '
            "execution(s)</b> of this identity (parametrize)</p>"
            '<table class="tbl"><thead><tr><th>Execution</th><th>State</th>'
            f'<th class="num">Time</th></tr></thead><tbody>{vr}</tbody></table>')
    own = g["own"] or {}
    if any(own.values()):
        # T2: what the driven routes credit — handler, schema, models.
        via = []
        for c in own.get("endpoints", []):
            e = ep_meta.get((c["file"], c["fn"]))
            if not e:
                continue
            via.append(_chip(
                f'{_XP["fn"]}#{_anchor("fn", "app", e["file"] + "-" + e["fn"])}',
                e["fn"] + "()", "lc-fn", "T2 — the route's handler"))
            toks = set(re.findall(r"[A-Za-z_]\w+", e.get("resp") or ""))
            toks.update(e.get("touches", []))
            for tok in sorted(toks):
                if tok in mi:
                    via.append(_chip(
                        f'{_XP["dm"]}#{_anchor("dm", "app", tok)}', tok,
                        "lc-mdl", "T2 — credited through the route"))
        if via:
            out.append('<p class="sub" style="margin:6px 0 2px"><b>via route'
                       "</b> (T2 — credited through the endpoints this case "
                       f'drives): {"".join(via)}</p>')
    elif g["inh"] and g["inh"].get("reaches"):
        reaches = "".join(
            _chip(f'{_XP["cm"]}#{_anchor("cm", "app", f2)}', f2,
                  "lc-file lc-via", "T3 — file-level import reach")
            for f2 in g["inh"]["reaches"][:8])
        out.append('<p class="sub" style="margin:6px 0 2px"><b>file reach</b> '
                   f"(T3 — what the case's file imports): {reaches}"
                   + ("…" if len(g["inh"]["reaches"]) > 8 else "") + "</p>")
    out.append(
        f'<p class="sub" style="margin:6px 0 2px"><b>file</b> '
        f'<code>{E(g["file"])}</code>'
        + (f' · <b>group</b> {E(g["group"])}' if g["group"] else "")
        + f' · <b>corpus</b> {E(g["corpus"])} · {g["time"]:.2f}s</p>')
    return "".join(out)


def _bar(app: bool, ents: list, labels: dict, kinds: list,
         feeds: dict, total: int) -> str:
    """The dropdown filter bar (R2): selects for the small vocabularies,
    datalist type-aheads for the element filters, free text last (Q5)."""
    def sel(id_: str, lab: str, opts: list[tuple[str, str]]) -> str:
        o = "".join(f'<option value="{E(v)}">{E(t)}</option>' for v, t in opts)
        return (f'<label>{E(lab)}<select id="{id_}">'
                f'<option value="all">all</option>{o}</select></label>')

    def dl(id_: str, lab: str, opts: list) -> str:
        o = "".join(f'<option value="{E(v)}"></option>' for v in opts)
        return (f'<label>{E(lab)}<input id="{id_}" list="{id_}-dl" '
                f'placeholder="any" size="14"><datalist id="{id_}-dl">{o}'
                "</datalist></label>")

    parts = []
    if app:
        parts.append(sel("led-ent", "entity",
                         [(s, labels.get(s, s)) for s in ents]))
    parts.append(sel("led-kind", "kind", [(k, k) for k in kinds]))
    parts.append(sel("led-state", "state",
                     [("pass", "pass"), ("fail", "fail"), ("skip", "skip")]))
    parts.append(dl("led-ep", "endpoint", sorted(set(feeds["ep"]))))
    parts.append(dl("led-mdl", "model", sorted(set(feeds["mdl"]))))
    parts.append(dl("led-fn", "function", sorted(set(feeds["fn"]))))
    parts.append('<label>search<input id="led-q" size="16" '
                 'placeholder="name · C-id · chip"></label>')
    return (f'<div class="ledbar" id="ledbar">{"".join(parts)}'
            f'<span class="sub" id="ledcount">{total} case(s)</span></div>')


_JS = """<script>(function(){var bar=document.getElementById('ledbar');
var led=document.getElementById('ledger');if(!bar||!led)return;
var rows=[].slice.call(led.querySelectorAll('.xrow'));
var note=document.getElementById('ledcount');
function v(id){var el=document.getElementById(id);
return el?el.value.trim().toLowerCase():'';}
function apply(){var ent=v('led-ent'),kind=v('led-kind'),st=v('led-state'),
ep=v('led-ep'),mdl=v('led-mdl'),fn=v('led-fn'),q=v('led-q'),n=0;
rows.forEach(function(r){var d=r.dataset,ok=true;
if(ent&&ent!=='all')ok=((' '+(d.ent||'')+' ').indexOf(' '+ent+' ')>=0);
if(ok&&kind&&kind!=='all')ok=(d.kind===kind);
if(ok&&st&&st!=='all')ok=(d.state===st);
if(ok&&ep)ok=((d.ep||'').indexOf(ep)>=0);
if(ok&&mdl)ok=((d.mdl||'').indexOf(mdl)>=0);
if(ok&&fn)ok=((d.fn||'').indexOf(fn)>=0);
if(ok&&q)ok=((r.textContent+' '+(d.ep||'')+' '+(d.mdl||'')+' '+(d.fn||''))
.toLowerCase().indexOf(q)>=0);
r.classList.toggle('lhide',!ok);if(ok)n++;});
if(note)note.textContent=n+' of '+rows.length+' case(s)';}
bar.addEventListener('input',apply);bar.addEventListener('change',apply);
})();</script>"""


def ledger_html(repo: Path, inv_files: dict, corpora: list,
                owners_of=None, labels: dict | None = None,
                app: bool = False) -> str:
    """The whole component: bar + xtbl + script. Entity pages pass their
    rx-scoped junit files (no entity column); the estate passes the full
    corpus with `owners_of` (registry regexes) for the badge column."""
    labels = labels or {}
    cases = build_cases(repo, inv_files, corpora)
    if not cases:
        return ('<p class="sub">No junit capture loaded — the ledger renders '
                "from the corpus record, and there is none to read.</p>")
    amap = _a3_code.merge_amaps(repo)
    ep_meta = {(e["file"], e["fn"]): e for e in amap.get("endpoints", [])}
    mi = _a3_code.model_insight(repo)
    kinds = sorted({g["kind"] for g in cases})
    feeds: dict[str, list] = {"ep": [], "mdl": [], "fn": []}
    ents_seen: list[str] = []
    seen_ids: set[str] = set()
    cols = (["", "Case", "Asserts", "Kind", "Exercises", "State"] if app
            else ["Case", "Asserts", "Kind", "Exercises", "State"])
    widths = (["44px", "0.8fr", "2.4fr", "0.8fr", "2fr", "0.6fr"] if app
              else ["0.8fr", "2.4fr", "0.8fr", "2fr", "0.6fr"])
    ctxkey = "xtbl|" + "|".join(cols)
    body = []
    for g in cases:
        ents: list[str] = []
        cells: list[str] = []
        if app:
            ents = (owners_of(g["jfile"]) if owners_of else []) or []
            for o in ents:
                if o not in ents_seen:
                    ents_seen.append(o)
            cells.append(" ".join(
                entity_badge(o, labels.get(o, o), 13) for o in ents))
        nvar = (f' <small>×{len(g["variants"])}</small>'
                if len(g["variants"]) > 1 else "")
        cells.append(
            (f'<span class="cid">{E(g["cid"])}</span>' if g["cid"] else
             '<span class="tag s-gap" title="junit carries no C-id — '
             '/gabe-red mints one">unminted</span>') + nvar)
        cells.append(
            f'{E(g["label"])}<span class="lfile"><code>{E(g["file"])}</code>'
            + (f' · {E(g["group"])}' if g["group"] else "") + "</span>")
        cells.append(f'<span class="tag {g["kcls"]}" title="{E(g["corpus"])} '
                     f'corpus">{kind_ic(g["kind"])} {E(g["kind"])}</span>')
        chip_cell, feed = _row_chips(g)
        for k2 in feeds:
            feeds[k2].extend(feed[k2])
        cells.append(chip_cell)
        cells.append(_STATE_CHIP.get(g["state"], ""))
        mark = _row_mark(ctxkey, cells)
        if mark:
            cells = [f"{cells[0]}{mark}", *cells[1:]]
        idattr = ""
        if g["cid"] and g["cid"] not in seen_ids:
            seen_ids.add(g["cid"])
            idattr = f' id="{E(g["cid"])}"'
        attrs = (f' data-ent="{E(" ".join(ents))}"'
                 f' data-kind="{E(g["kind"])}" data-state="{E(g["state"])}"'
                 f' data-ep="{E("|".join(feed["ep"]).lower())}"'
                 f' data-mdl="{E("|".join(feed["mdl"]).lower())}"'
                 f' data-fn="{E("|".join(feed["fn"]).lower())}"')
        summ = ("".join(f"<span>{c}</span>" for c in cells)
                + '<span class="xtgl"></span>')
        body.append(f'<details class="xrow"{idattr}{attrs}>'
                    f"<summary>{summ}</summary>"
                    f'<div class="xbody">{_fold(g, ep_meta, mi)}</div>'
                    "</details>")
    head = ('<div class="xhead">'
            + "".join(f"<span>{E(c)}</span>" for c in cols)
            + "<span></span></div>")
    tmpl = " ".join(widths) + " 20px"
    n_unminted = sum(1 for g in cases if not g["cid"])
    n_fail = sum(1 for g in cases if g["state"] == "fail")
    note = (f"{len(cases)} case identity(ies) · {n_fail} failing · "
            f"{n_unminted} unminted — failing first, then newest C-id; "
            "solid chips are the case's own facts (T1), dashed chips ride "
            "in from its file (`via file`); filters match both.")
    return (_bar(app, sorted(ents_seen, key=lambda s: labels.get(s, s)),
                 labels, kinds, feeds, len(cases))
            + f'<div class="xtbl" id="ledger" style="--xcols:{tmpl}">{head}'
            + "".join(body) + "</div>"
            + f'<p class="sub">{E(note)}</p>' + _JS)
