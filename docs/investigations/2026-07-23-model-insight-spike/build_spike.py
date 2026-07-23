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
    amap = json.loads(ARCHMAP.read_text())
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

    n_base = sum(1 for c in classes.values() if c["base"])
    n_sim = sum(1 for c in classes.values() if c["sim"])
    (HERE / "index.html").write_text(page(
        "Model-insight spike — four options over real data",
        intro + f"""
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
