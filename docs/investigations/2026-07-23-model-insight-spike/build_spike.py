#!/usr/bin/env python3
"""Model-insight spike — four variants over REAL gastify archmap data.

Reads the twin's committed archmap.json READ-ONLY and renders four static
pages (option-a/b/c/d.html + index.html) so the operator can rule which
insight surface the center adopts:

  A — derived columns in the per-entity data-model tables (Usage · Similar)
  B — a "Model health" block at the architecture-station altitude
  C — A + B together (the recommended shape)
  D — the judgment pass: what a /gabe-health-style satellite would FILE
      (grounded in the same computed data, clearly framed as judgment)

Signals (all machine-derived, ast-sourced archmap only — no code re-read):
  usage       endpoint touches + FK in-degree + FK out-degree
  similarity  Jaccard over field-name sets, best match per class
  BASE class  no FK out AND no field typed with another documented class —
              the foundations everything else builds on (encoded as a tag
              color on the Class cell, per the operator: no extra column)
  god flag    field count ≥ 15

Run: python3 build_spike.py   (writes *.html + data.json beside itself)
"""

from __future__ import annotations

import html
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ARCHMAP = Path.home() / "projects/apps/gastify/docs/site/center/archmap.json"
E = html.escape
GOD_FIELDS = 15
SIM_FLOOR = 0.5


def collect() -> dict:
    import re
    amap = json.loads(ARCHMAP.read_text())
    # Internal usage: word-boundary references to the class name across the
    # mapped BACKEND files (.py), excluding the defining file — the second
    # usage kind (operator ruling: API-only bars read real service vocabulary
    # as dead). Read-only scan of the twin's mapped files.
    _root = ARCHMAP.parents[3]
    _pyfiles = sorted({f for v in (amap.get("entities") or {}).values() if v
                       for _l, f, _n in v.get("files", []) if f.endswith(".py")})
    _texts = {f: (_root / f).read_text() for f in _pyfiles
              if (_root / f).exists()}
    classes: dict[str, dict] = {}
    table_owner: dict[str, str] = {}
    for slug, v in (amap.get("entities") or {}).items():
        if not v:
            continue
        for m in v.get("models", []):
            fields = [(c[0], str(c[1]), c[2] if len(c) > 2 else "")
                      for c in m.get("cols", [])]
            classes[m["cls"]] = {
                "cls": m["cls"], "kind": "model", "entity": slug,
                "file": m["file"], "fields": fields,
                "fks_out": m.get("fks", {}), "touches": 0}
            table_owner[m.get("table", "")] = m["cls"]
        for s in v.get("schemas", []):
            fields = [(f[0], str(f[1]), f[2] if len(f) > 2 else "")
                      for f in s.get("fields", [])]
            classes[s["cls"]] = {
                "cls": s["cls"], "kind": "schema", "entity": slug,
                "file": s["file"], "fields": fields, "fks_out": {},
                "touches": 0}
        for e in v.get("endpoints", []):
            for cls in e.get("touches", []):
                if cls in classes:
                    classes[cls]["touches"] += 1
    # second pass over endpoints: touches recorded per entity above may run
    # before the touched class was registered (cross-entity) — redo cleanly.
    for c in classes.values():
        c["touches"] = 0
    for slug, v in (amap.get("entities") or {}).items():
        if not v:
            continue
        for e in v.get("endpoints", []):
            for cls in e.get("touches", []):
                if cls in classes:
                    classes[cls]["touches"] += 1

    names = set(classes)
    for c in classes.values():
        # FK in-degree: other models whose fks target this class's table.
        tgt_tables = {t for t, owner in table_owner.items() if owner == c["cls"]}
        c["fk_in"] = sum(
            1 for o in classes.values() if o is not c
            for ref in o["fks_out"].values()
            if str(ref).split(".")[0] in tgt_tables)
        # A field typed with another documented class = a structural reference.
        c["refs_out"] = sorted({n for n in names if n != c["cls"]
                                and any(n in t for _, t, _ in c["fields"])})
        c["base"] = not c["fks_out"] and not c["refs_out"]
        c["god"] = len(c["fields"]) >= GOD_FIELDS
        c["usage"] = c["touches"] + c["fk_in"]
        _rx = re.compile(rf"\b{re.escape(c['cls'])}\b")
        c["internal"] = sum(1 for f, t in _texts.items()
                            if f != c["file"] and _rx.search(t))
        c["orphan"] = c["usage"] == 0 and c["internal"] == 0
    # Similarity: Jaccard over field-name sets, best match per class.
    for c in classes.values():
        mine = {n for n, _, _ in c["fields"]}
        best, best_j, shared = "", 0.0, 0
        for o in classes.values():
            if o is c:
                continue
            theirs = {n for n, _, _ in o["fields"]}
            inter = mine & theirs
            union = mine | theirs
            j = len(inter) / len(union) if union else 0.0
            if j > best_j:
                best, best_j, shared = o["cls"], j, len(inter)
        c["sim"] = {"cls": best, "j": round(best_j, 2), "shared": shared,
                    "of": len(mine)} if best_j >= SIM_FLOOR else None
    return {"classes": classes,
            "head": amap.get("head"), "generated": amap.get("generated")}


# ---------------------------------------------------------------------------
CSS = """
:root{--bg:#f4f6f8;--paper:#fff;--ink:#1a2532;--muted:#64748b;--line:#dde3ea;
--ok:#0a7d6b;--warn:#b5771a;--bad:#b3403a;--acc:#0d6e78;--vio:#7c3aed}
@media(prefers-color-scheme:dark){:root{--bg:#0d1420;--paper:#16202e;
--ink:#e6edf4;--muted:#8ea0b4;--line:#243244;--acc:#3bb3bd}}
:root[data-theme=dark]{--bg:#0d1420;--paper:#16202e;--ink:#e6edf4;
--muted:#8ea0b4;--line:#243244;--acc:#3bb3bd}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:28px}
.wrap{max-width:1080px;margin:0 auto}h1{font-size:1.4rem;margin:.1em 0}
h2{font-size:1.05rem;margin:1.6em 0 .4em}.sub{color:var(--muted);font-size:.86rem}
table{width:100%;border-collapse:collapse;background:var(--paper);
border:1px solid var(--line);border-radius:10px;overflow:hidden;margin:10px 0;
font-size:.85rem}th{font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;
text-align:left;color:var(--muted);border-bottom:1px solid var(--line);
padding:8px 12px}td{padding:8px 12px;border-bottom:1px solid var(--line);
vertical-align:top}tr:last-child td{border-bottom:0}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.82em}
.tag{display:inline-block;font-size:.66rem;font-weight:700;padding:1px 8px;
border-radius:11px;letter-spacing:.03em}
.t-base{background:color-mix(in srgb,var(--ok) 18%,transparent);color:var(--ok)}
.t-model{background:color-mix(in srgb,var(--vio) 14%,transparent);color:var(--vio)}
.t-schema{background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--acc)}
.t-god{background:color-mix(in srgb,var(--bad) 14%,transparent);color:var(--bad)}
.t-sim{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.t-orph{background:color-mix(in srgb,var(--muted) 18%,transparent);color:var(--muted)}
.tag.ic{display:inline-flex;align-items:center;gap:4px;vertical-align:middle;
padding:2px 7px}.tag.ic svg{flex:none}
.bar{display:inline-block;height:8px;border-radius:4px;background:var(--acc);
vertical-align:middle;margin-right:6px}
a{color:var(--acc)}.card{background:var(--paper);border:1px solid var(--line);
border-radius:10px;padding:14px 18px;margin:10px 0}
.crumb{font-size:.8rem;margin-bottom:14px}
"""


def cls_cell(c: dict) -> str:
    tags = f'<span class="tag t-{c["kind"]}">{c["kind"]}</span>'
    if c["base"]:
        tags += ' <span class="tag t-base" title="derives from nothing: no FK out, no field typed with another documented class — a foundation others build on">base</span>'
    if c["god"]:
        tags += f' <span class="tag t-god">{len(c["fields"])} fields</span>'
    return f'<b><code>{E(c["cls"])}</code></b><br>{tags}'


def usage_cell(c: dict) -> str:
    w = min(90, 8 + c["usage"] * 14)
    detail = f'{c["touches"]} endpoint(s) · {c["fk_in"]} FK in'
    return (f'<span class="bar" style="width:{w}px"></span><b>{c["usage"]}</b>'
            f'<br><span class="sub">{detail}</span>')


def sim_cell(c: dict) -> str:
    s = c["sim"]
    if not s:
        return '<span class="sub">—</span>'
    pct = int(s["j"] * 100)
    return (f'<span class="tag t-sim">≈ {E(s["cls"])}</span>'
            f'<br><span class="sub">{s["shared"]}/{s["of"]} fields · {pct}%</span>')


def table_a(classes: dict, with_insight: bool) -> str:
    heads = ["Class", "Entity", "File"] + (
        ["Usage", "Similar to"] if with_insight else [])
    rows = ""
    for c in sorted(classes.values(), key=lambda x: -x["usage"]):
        cells = [cls_cell(c), E(c["entity"]),
                 f'<code>{E(c["file"].rsplit("/", 1)[-1])}</code>']
        if with_insight:
            cells += [usage_cell(c), sim_cell(c)]
        rows += "<tr>" + "".join(f"<td>{x}</td>" for x in cells) + "</tr>"
    return ("<table><thead><tr>"
            + "".join(f"<th>{E(h)}</th>" for h in heads)
            + f"</tr></thead><tbody>{rows}</tbody></table>")


def health_block(classes: dict) -> str:
    cs = list(classes.values())
    top = sorted(cs, key=lambda c: -c["usage"])[:5]
    orphans = [c for c in cs if c["usage"] == 0]
    bases = [c for c in cs if c["base"]]
    gods = [c for c in cs if c["god"]]
    pairs = sorted({tuple(sorted((c["cls"], c["sim"]["cls"]))) + (c["sim"]["j"],)
                    for c in cs if c["sim"]}, key=lambda p: -p[2])
    li = lambda items: "".join(f"<li>{x}</li>" for x in items) or "<li class='sub'>none</li>"
    return f"""
<h2>Model health — whole-app, machine-derived</h2>
<p class="sub">Named candidates, never verdicts: the numbers point, judgment rules.</p>
<div class="card"><b>Most-used</b> (endpoint touches + FK in)
<ol>{li(f'<code>{E(c["cls"])}</code> — {c["usage"]} ({c["touches"]} ep · {c["fk_in"]} FK in)' for c in top)}</ol></div>
<div class="card"><b>Base classes</b> — derive from nothing; the foundations
<ul>{li(f'<code>{E(c["cls"])}</code> <span class="tag t-base">base</span> <span class="sub">{len(c["fields"])} primitive-typed fields · usage {c["usage"]}</span>' for c in bases)}</ul></div>
<div class="card"><b>Similarity pairs ≥ 50%</b> — redundancy candidates (structural, not semantic)
<ul>{li(f'<code>{E(a)}</code> ≈ <code>{E(b)}</code> — {int(j * 100)}%' for a, b, j in pairs)}</ul></div>
<div class="card"><b>Orphans</b> — no endpoint touches, no FK in (edge cases, or dead weight)
<ul>{li(f'<code>{E(c["cls"])}</code> <span class="sub">{c["file"].rsplit("/", 1)[-1]}</span>' for c in orphans)}</ul></div>
<div class="card"><b>God classes</b> — ≥ {GOD_FIELDS} fields (split candidates)
<ul>{li(f'<code>{E(c["cls"])}</code> — {len(c["fields"])} fields' for c in gods)}</ul></div>"""


def page(title: str, body: str, crumb: str = "") -> str:
    return (f"<!DOCTYPE html><html><head><meta charset='utf-8'>"
            f"<meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>{E(title)}</title><style>{CSS}</style></head><body>"
            f"<div class='wrap'><div class='crumb'><a href='index.html'>spike index</a>"
            f" › {E(crumb or title)}</div><h1>{E(title)}</h1>{body}</div></body></html>")


# Icon chips (operator experiment round 3): the tag COLOR pair stays, the
# word becomes a stroke icon — tooltips carry the words, the ⊕ legend is the
# dictionary. Data (field count, twin class + %) stays beside its icon.
_ICONS = {
    "model": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    "schema": '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    "base": '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
    "fields": '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>',
    "sim": '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "orphan": '<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/>',
    "merge": '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    "split": '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    "archive": '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><line x1="10" y1="12" x2="14" y2="12"/>',
}


def _ic(name: str) -> str:
    return ('<svg viewBox="0 0 24 24" width="13" height="13" fill="none" '
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            f'stroke-linejoin="round">{_ICONS[name]}</svg>')


def itag(color_cls: str, icon: str, title: str, text: str = "") -> str:
    body = _ic(icon) + (f" {text}" if text else "")
    return (f'<span class="tag ic {color_cls}" title="{E(title)}">{body}</span>')


def ruled_page(classes: dict, intro: str) -> str:
    """The ruled composite (operator, 2026-07-23): ONE principal table — tags
    for every classification on the Class cell, filter chips, a two-color
    usage bar (API + internal) — then the machine-NAMED candidates table in
    the Option-D shape. No separate health lists: most-used reads off the
    sorted Usage column; base/similar/orphan live as filterable tags."""
    chips = "".join(
        f'<button class="chip" data-f="{k}">{lbl}</button>'
        for k, lbl in (("all", "All"), ("base", "base"), ("similar", "≈ similar"),
                       ("orphan", "orphan"), ("god", "god")))
    rows = ""
    for c in sorted(classes.values(),
                    key=lambda x: -(x["usage"] + x["internal"])):
        flags = ["all"] + [k for k, v in (("base", c["base"]),
                                          ("similar", bool(c["sim"])),
                                          ("orphan", c["orphan"]),
                                          ("god", c["god"])) if v]
        tags = f'<b><code>{E(c["cls"])}</code></b><br>'
        tags += itag(f't-{c["kind"]}', c["kind"],
                     "model — a persisted DB entity" if c["kind"] == "model"
                     else "schema — an API / pipeline shape")
        if c["base"]:
            tags += " " + itag("t-base", "base",
                               "base class — derives from nothing: no FK out, "
                               "no field typed by another documented class")
        if c["god"]:
            tags += " " + itag("t-god", "fields",
                               f"god-class flag — {len(c['fields'])} fields",
                               str(len(c["fields"])))
        if c["sim"]:
            s = c["sim"]
            tags += " " + itag("t-sim", "sim",
                               f"closest structural twin — {s['shared']}/"
                               f"{s['of']} fields shared",
                               f'{E(s["cls"])} {int(s["j"] * 100)}%')
        if c["orphan"]:
            tags += " " + itag("t-orph", "orphan",
                               "orphan — zero API usage AND zero internal "
                               "references in the mapped backend files")
        w_api = min(70, c["usage"] * 12)
        w_int = min(70, c["internal"] * 12)
        usage = (f'<span class="bar" style="width:{max(2, w_api)}px"></span>'
                 f'<b>{c["usage"]}</b> <span class="sub">api</span><br>'
                 f'<span class="bar" style="width:{max(2, w_int)}px;'
                 f'background:var(--vio)"></span><b>{c["internal"]}</b> '
                 f'<span class="sub">internal</span>')
        rows += (f'<tr data-flags="{" ".join(flags)}"><td>{tags}</td>'
                 f'<td>{E(c["entity"])}</td>'
                 f'<td><code>{E(c["file"].rsplit("/", 1)[-1])}</code></td>'
                 f'<td>{usage}</td></tr>')
    legend = (f"""<details class="card"><summary style="cursor:pointer">
<b>⊕ What the icons mean</b></summary><ul class="sub" style="line-height:2.2">
<li>{itag("t-model", "model", "model")} <b>model</b> — a persisted DB entity
(SQLAlchemy): lives in a table, owns FKs.</li>
<li>{itag("t-schema", "schema", "schema")} <b>schema</b> — an API / pipeline
shape (pydantic): crosses a boundary, owns no storage.</li>
<li>{itag("t-base", "base", "base")} <b>base</b> — derives from NOTHING: no FK
out, no field typed with another documented class; a foundation others build
on.</li>
<li>{itag("t-god", "fields", "god-class flag", "N")} <b>god-class flag</b> —
field count ≥ {GOD_FIELDS}; the number that makes it a
{itag("t-god", "split", "split candidate")} split candidate below.</li>
<li>{itag("t-sim", "sim", "structural twin", "Class N%")} <b>closest structural
twin</b> — % = shared fields over the union (Jaccard); a ≥80% pair becomes a
{itag("t-sim", "merge", "merge candidate")} merge candidate below.</li>
<li>{itag("t-orph", "orphan", "orphan")} <b>orphan</b> — zero API usage AND
zero internal references across the mapped backend files; becomes a
{itag("t-orph", "archive", "deprecation candidate")} deprecation candidate
below.</li>
<li>Usage bars: <span style="color:var(--acc)">api</span> = endpoint touches +
FK in-degree · <span style="color:var(--vio)">internal</span> = mapped backend
files referencing the class. A class can be api-silent and still load-bearing —
the second bar is why only true orphans read as dead.</li></ul></details>""")
    tbl = (legend + '<div class="chips">' + chips + "</div>"
           "<table><thead><tr><th>Class</th><th>Entity</th><th>File</th>"
           '<th>Usage — <span style="color:var(--acc)">api</span> · '
           '<span style="color:var(--vio)">internal</span></th></tr></thead>'
           f"<tbody id='ptbl'>{rows}</tbody></table>"
           "<script>document.querySelectorAll('.chip').forEach(b=>"
           "b.addEventListener('click',()=>{document.querySelectorAll('.chip')"
           ".forEach(x=>x.classList.remove('on'));b.classList.add('on');"
           "const f=b.dataset.f;document.querySelectorAll('#ptbl tr').forEach("
           "r=>r.style.display=r.dataset.flags.split(' ').includes(f)?'':'none');"
           "}));document.querySelector('.chip').classList.add('on');</script>"
           "<style>.chips{margin:8px 0}.chip{font:inherit;font-size:.74rem;"
           "font-weight:600;padding:3px 12px;border-radius:14px;margin-right:6px;"
           "border:1px solid var(--line);background:var(--paper);color:var(--muted);"
           "cursor:pointer}.chip.on{background:var(--acc);color:#fff;"
           "border-color:var(--acc)}</style>")
    cands = ""
    seen = set()
    for c in sorted(classes.values(), key=lambda x: -(x["sim"]["j"] if x["sim"] else 0)):
        s = c["sim"]
        if not s or s["j"] < 0.8:
            continue
        key = tuple(sorted((c["cls"], s["cls"])))
        if key in seen:
            continue
        seen.add(key)
        cands += (f'<tr><td>{itag("t-sim", "merge", "merge candidate")}</td>'
                  f'<td><code>{E(key[0])}</code> ≈ <code>{E(key[1])}</code></td>'
                  f'<td>{int(s["j"] * 100)}% structural twin '
                  f'({s["shared"]}/{s["of"]} fields) — justified echo, or '
                  f'duplication waiting to drift? Rule it.</td></tr>')
    for c in sorted(classes.values(), key=lambda x: x["cls"]):
        if c["orphan"]:
            cands += (f'<tr><td>{itag("t-orph", "archive", "deprecation candidate")}'
                      f'</td><td><code>{E(c["cls"])}</code></td>'
                      f"<td>zero API usage · zero internal references across "
                      f"the mapped backend files — if nothing outside the map "
                      f"uses it either, file for removal.</td></tr>")
    for c in sorted(classes.values(), key=lambda x: -len(x["fields"])):
        if c["god"]:
            cands += (f'<tr><td>{itag("t-god", "split", "split candidate")}</td>'
                      f'<td><code>{E(c["cls"])}</code></td>'
                      f'<td>{len(c["fields"])} fields — past the {GOD_FIELDS}-field '
                      f'line; the number names it, judgment rules it.</td></tr>')
    cand_tbl = ("<h2>Candidates — named by the machine, ruled by judgment</h2>"
                '<p class="sub">Each candidate wears the COLOR of the flag '
                "that triggered it in the table above: merge ↔ the ≈similarity "
                "tag · deprecation ↔ the orphan tag · split ↔ the fields tag. "
                "Merge = structural twins ≥ 80% · deprecation = true orphans "
                "(both usage bars at zero) · split = god classes. The "
                "generator NAMES; the verdict lands in DECISIONS/PENDING via "
                "review or a health pass — never authored here.</p>"
                "<table><thead><tr><th>Candidate</th><th>Classes</th>"
                f"<th>Why the machine flags it</th></tr></thead><tbody>{cands}"
                "</tbody></table>")
    return page("RULED — the composite the templates would ship",
                intro + '<p>One principal table: every classification is a '
                'filterable tag on the Class cell; usage carries TWO bars '
                '(<span style="color:var(--acc)">api</span> = endpoint touches '
                '+ FK in · <span style="color:var(--vio)">internal</span> = '
                'mapped backend files referencing the class). Below it, the '
                'candidates table in the Option-D shape.</p>' + tbl + cand_tbl,
                crumb="ruled composite")


def main() -> int:
    data = collect()
    classes = data["classes"]
    (HERE / "data.json").write_text(json.dumps(
        {k: {kk: vv for kk, vv in v.items() if kk != "fields"}
         for k, v in classes.items()}, indent=1, default=list) + "\n")

    intro = (f'<p class="sub">Real data: gastify archmap @ <code>{E(str(data["head"]))}</code> '
             f'· {len(classes)} documented classes (models + schemas, all entities) '
             f'· read-only spike, nothing ships until ruled.</p>')

    (HERE / "option-a.html").write_text(page(
        "Option A — derived columns in the data-model table",
        intro + '<p>Two columns join the existing per-entity class tables: '
        '<b>Usage</b> (endpoint touches + FK in-degree) and <b>Similar to</b> '
        '(best Jaccard match over field names, floor 50%). The <span class="tag t-base">base</span> '
        'tag rides the Class cell — no extra column: a class with no FK out and '
        'no field typed by another documented class derives from nothing.</p>'
        + table_a(classes, True)))

    (HERE / "option-b.html").write_text(page(
        "Option B — a Model-health block on the architecture station",
        intro + '<p>The class tables stay as they are (below, for contrast); '
        'the insight lives at the whole-app altitude as ranked lists.</p>'
        + table_a(classes, False) + health_block(classes)))

    (HERE / "option-c.html").write_text(page(
        "Option C — A + B together (recommended)",
        intro + '<p>The columns answer "how does THIS class sit?" in place; '
        'the health block answers "where should I look first?" app-wide. Same '
        'computation feeds both — one pass, zero authored state.</p>'
        + table_a(classes, True) + health_block(classes)))

    # Option D content is authored SEPARATELY (judgment-d.html fragment) by the
    # session running the spike — grounded in data.json, clearly framed as what
    # a satellite would FILE. The builder only wraps it.
    frag = HERE / "judgment-d.fragment.html"
    d_body = (frag.read_text() if frag.exists()
              else "<p class='sub'>judgment fragment not authored yet</p>")
    (HERE / "option-d.html").write_text(page(
        "Option D — the judgment pass (what a satellite would file)",
        intro + d_body))

    (HERE / "ruled.html").write_text(ruled_page(classes, intro))

    n_base = sum(1 for c in classes.values() if c["base"])
    n_sim = sum(1 for c in classes.values() if c["sim"])
    n_orph = sum(1 for c in classes.values() if c.get("orphan"))
    (HERE / "index.html").write_text(page(
        "Model-insight spike — four options over real data",
        intro + f"""
<div class="card" style="border-color:var(--acc)"><b><a href="ruled.html">RULED composite — walk this one</a></b>
<p class="sub">The operator's 2026-07-23 direction: one principal table with filterable classification tags (base · ≈similar · orphan · god), a TWO-bar usage cell (api + internal — the second bar kills the false zeros: only {n_orph} true orphan(s) remain), and the machine-named candidates table in the Option-D shape below it.</p></div>
<div class="card"><b><a href="option-a.html">A — derived columns</a></b>
<p class="sub">Usage + Similar-to in the per-entity tables; base classes tagged in place. Cheapest; insight stays local to each entity page.</p></div>
<div class="card"><b><a href="option-b.html">B — model-health block</a></b>
<p class="sub">Ranked lists at the architecture altitude; tables untouched. Best for cross-entity questions; nothing changes where you read classes.</p></div>
<div class="card"><b><a href="option-c.html">C — both (recommended)</a></b>
<p class="sub">Columns in place + the app-wide block, one computation. The center names candidates; judgment stays with review/roast.</p></div>
<div class="card"><b><a href="option-d.html">D — the judgment pass</a></b>
<p class="sub">What an on-demand satellite (/gabe-health lens) would actually FILE over the same data — merge/split/keep verdicts with reasoning. Not a generator feature; shown for contrast.</p></div>
<p class="sub">Signals on this data: {n_base} base class(es) · {n_sim} class(es) with a ≥50% structural twin.</p>"""))
    print(f"spike: {len(classes)} classes · {n_base} base · {n_sim} with twins "
          f"→ index + 4 option pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
