#!/usr/bin/env python3
"""Build the Gabe Suite's OWN command center.

    python3 docs/center/generators/build_suite_center.py [--out <dir>]

A FORK of the standard center (templates/center/, copied at ebfa82b) re-pointed
at the suite itself. It shares the visual system — a3.css, the render helpers,
the shell skeleton — and shares NOTHING else: the standard center's spine is an
application entity, and the suite has no application. Here the spine is the
lifecycle BEAT and the lenses are the suite's own material.

Spike 1 ships the enforcement estate: the ledger, hooks, and testing. The four
remaining lenses (agents, formats, functions, structures) are declared in the
config with `spike: 2` and render as NAMED GAPS in the nav until they land —
an unshipped lens must look unshipped, not empty.

Honesty rules inherited from the standard center and enforced here:
  - An absent source renders as a named gap, never a zero and never staged.
  - Authored judgment (data/enforcement.json) is labelled as authored, with its
    provenance line on the page. Derived facts are labelled derived.
  - A recorded run carries its stamp; a stale count reports its age.
"""
from __future__ import annotations

import argparse
import html
import importlib.util
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import _a3_render as R          # noqa: E402
import _suite_data as D         # noqa: E402
import _a3_board as BOARD       # noqa: E402
import _suite_board as BRD      # noqa: E402
import _suite_formats as FMT    # noqa: E402
import _suite_surfaces as SUR   # noqa: E402

E = html.escape

GEN_DIR = Path(__file__).resolve().parent
CENTER_DIR = GEN_DIR.parent
REPO_ROOT = CENTER_DIR.parent.parent
SHELL_SRC = CENTER_DIR / "shell"
GENERATOR_NAME = "build_suite_center.py"


# ------------------------------------------------------------------ icons
# Inner SVG only — sechead()/the nav wrap them.
IC = {
    "home":    '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "shield":  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    "zap":     '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    "check":   '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    "users":   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    "type":    '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    "code":    '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    "database": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    "alert":   '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    "lock":    '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "wrench":  '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    "board": '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="9"/><rect x="14" y="7" width="3" height="5"/>',
    "message": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "book":     '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    "filetext": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "gauge": '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    "scrollcast": '<path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/>',
    "component": '<path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z"/><path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z"/>',
}

# Bucket -> (color, icon, urgency). Urgency drives the ledger's section order:
# what actively misleads first, then what we owe, then what works, then what can
# only ever be prompted.
BUCKET_STYLE = {
    "BROKEN_CLAIM":  ("#b63a3a", "alert",  0),
    "HARDENABLE":    ("#d97a3d", "wrench", 1),
    "HARD_ENFORCED": ("#1f7a5a", "lock",   2),
    "PROMPT_ONLY":   ("#7a5a8a", "message", 3),
}
BUCKET_CHIP = {
    "BROKEN_CLAIM": "bad", "HARDENABLE": "warn",
    "HARD_ENFORCED": "ok", "PROMPT_ONLY": "grow",
}


# ------------------------------------------------------------------ shell


def _nav_svg(icon: str, size: int = 0) -> str:
    dim = f' width="{size}" height="{size}"' if size else ""
    return (f'<svg viewBox="0 0 24 24"{dim} fill="none" stroke="currentColor" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            f"{IC[icon]}</svg>")


def docs_sections(cfg: dict) -> list[dict]:
    """The docsite's own SECTIONS, read from its config.

    The seam that lets the markdown site and this center share one sidebar
    without either one importing the other: the docsite config already declares
    every page it publishes, so the nav is derived from it rather than
    duplicated here. Absent config (a project with no docs site) yields an empty
    list and the Docs group simply does not render — never a dead group.
    """
    rel = cfg.get("paths", {}).get("docsite_config")
    if not rel:
        return []
    path = REPO_ROOT / rel
    if not path.is_file():
        return []
    spec = importlib.util.spec_from_file_location("_docsite_cfg", path)
    if spec is None or spec.loader is None:
        return []
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except Exception as exc:                      # noqa: BLE001 — a broken docs
        print(f"  [nav] docsite config unreadable ({exc}) — Docs group omitted")
        return []
    # src_dir is declared relative to the CONFIG FILE (the docsite build
    # resolves it the same way) — resolving from the repo root reads nothing
    # and every embeds flag silently stays False.
    src_dir = path.parent / getattr(mod, "SITE", {}).get("src_dir", "src")
    out = []
    for section in getattr(mod, "SECTIONS", []):
        docs = []
        for d in section.get("docs", []):
            src = src_dir / d.get("source_md", "")
            embeds = src.is_file() and "{{PRISM:" in src.read_text(encoding="utf-8")
            docs.append({"slug": d["slug"], "label": d.get("nav_label") or d["title"],
                         "embeds": embeds})
        if docs:
            out.append({"key": section.get("key", ""), "label": section.get("label", ""),
                        "docs": docs})
    return out


def prism_pages(cfg: dict) -> list[dict]:
    """The authored prism pages, as nav items — title and order only.

    Deliberately reads prism.json directly instead of importing build_prisms.py:
    the nav needs four fields, and importing a whole builder to get them would
    make this build fail whenever that one has a syntax error, on a page that
    does not exist yet. FRAGMENTS ARE NOT SCANNED — a fragment with a nav item
    is a page, and the absence of that code is the enforcement.
    """
    rel = cfg.get("paths", {}).get("prisms")
    if not rel:
        return []
    root = REPO_ROOT / rel
    if not root.is_dir():
        return []
    out = []
    for d in sorted(root.iterdir()):
        meta_path = d / "prism.json"
        if not d.is_dir() or d.name.startswith("_") or not meta_path.is_file():
            continue
        if not (d / "body.html").is_file():
            continue
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            print(f"  [nav] prism {d.name}: unreadable prism.json ({exc}) — omitted")
            continue
        body = (d / "body.html").read_text(encoding="utf-8")
        out.append({"slug": d.name,
                    "label": meta.get("nav_label") or meta.get("title", d.name),
                    "order": meta.get("order", 999),
                    "mode": meta.get("mode", "console"),
                    "section": meta.get("section"),
                    "embeds": "{{PRISM:" in body})
    out.sort(key=lambda p: (p["order"], p["slug"]))
    return out


def nav_model(cfg: dict, counts: dict) -> list[dict]:
    """The sidebar as DATA — groups of items, before any HTML exists.

    Two builders render this same model (this one, and the docsite build via
    nav.json), so it is built once and rendered twice rather than written twice
    and drifting.
    """
    groups: list[dict] = [{
        "label": "Now", "cls": "g-now",
        "items": [{"label": "Overview", "href": "index.html", "icon": "home"}],
    }]
    nav_cls = {"Board": "g-board", "Enforcement": "g-code", "Surfaces": "g-ent"}
    current_group = None
    for lens in cfg["lenses"]:
        if lens["spike"] != 1:
            continue
        g = lens.get("group", "Estate")
        if g != current_group:
            current_group = g
            groups.append({"label": g, "cls": nav_cls.get(g, "g-code"), "items": []})
        groups[-1]["items"].append({
            "label": lens["label"], "href": lens["page"], "icon": lens["icon"],
            "count": counts.get(lens["slug"]),
        })

    # The DOCS group — the markdown pages, rendered into this same shell.
    sections = docs_sections(cfg)
    if sections:
        items = [{"label": "Docs", "href": "docs.html", "icon": "book"}]
        for section in sections:
            for d in section["docs"]:
                icon = "component" if d.get("embeds") else "filetext"
                item = {"label": d["label"], "href": f"{d['slug']}.html",
                        "icon": icon, "sub": True}
                if d.get("embeds"):
                    item["tip"] = "embeds prism components"
                items.append(item)
        groups.append({"label": "Docs", "cls": "g-docs", "items": items})

    # The EXPLANATIONS group — authored prism pages, rendered by build_prisms.py
    # into this same shell. Scanned from disk rather than declared in config for
    # the same reason the Docs group is derived from the docsite config: a nav
    # list maintained by hand drifts from the pages that exist, and the drift is
    # invisible until a link 404s.
    prisms = prism_pages(cfg)
    if prisms:
        mode_icon = {"console": "gauge", "article": "scrollcast", "index": "zap"}
        mode_tip = {"gauge": "console — one screen, ambient loop + scrub bar",
                    "scrollcast": "article — assembles as you scroll",
                    "zap": "index — a subject's own landing page",
                    "component": "built from embedded components"}
        items = [{"label": "Explanations", "href": "explanations.html", "icon": "zap"}]
        # A page declaring `section: <slug>` nests one level deeper, listed
        # right after the page with that slug. A child whose parent is absent
        # (or names itself) renders flat rather than vanishing — a typo must
        # cost an indent, never a page.
        slugs = {p["slug"] for p in prisms}
        kids: dict[str, list[dict]] = {}
        top: list[dict] = []
        for p in prisms:
            sec = p.get("section")
            if sec and sec != p["slug"] and sec in slugs:
                kids.setdefault(sec, []).append(p)
            else:
                top.append(p)

        def prism_item(p: dict, deep: bool) -> dict:
            icon = "component" if p.get("embeds") else mode_icon.get(p.get("mode"), "gauge")
            item = {"label": p["label"], "href": f"prism-{p['slug']}.html",
                    "icon": icon, "sub": True, "tip": mode_tip[icon]}
            if deep:
                item["sub2"] = True
            return item

        for p in top:
            items.append(prism_item(p, deep=False))
            for c in kids.get(p["slug"], []):
                items.append(prism_item(c, deep=True))
        groups.append({"label": "Explanations", "cls": "g-ent", "items": items})

    later = [l for l in cfg["lenses"] if l["spike"] != 1]
    if later:
        groups.append({
            "label": "Next cut", "cls": "g-ent",
            "items": [{"label": l["label"], "icon": l["icon"], "href": None,
                       "disabled": f"not built yet — spike {l['spike']}"} for l in later],
        })
    return groups


def render_nav(cfg: dict, groups: list[dict], current: str, counts: dict) -> str:
    """The one renderer for the nav model — used for the estate pages here and,
    through nav.json, for the doc pages the docsite builder emits.

    The standard shell's sidebar is application-shaped (Entities · Docs · Code ·
    Testing · Ledger · Releases) and every one of those hrefs would be a dead
    link here, so the whole <aside> is replaced rather than patched.
    """
    parts = [
        '<aside class="side">',
        '  <div class="brand">',
        '    <span class="logo"><img src="assets/gabe-icon.png" width="26" height="26" '
        'alt="" style="image-rendering:pixelated"></span>',
        f'    <span><b>{E(cfg["project"]["display_name"])}</b>'
        "<small>Gabe Center · suite</small></span>",
        "  </div>",
    ]
    for group in groups:
        parts.append(f'  <div class="navlabel {group["cls"]}">{E(group["label"])}</div>')
        for item in group["items"]:
            # Unshipped lenses are LISTED and visibly disabled. A lens that is
            # simply absent reads as "does not exist"; one that 404s reads as broken.
            if item.get("disabled"):
                parts.append(
                    f'  <span class="navitem" style="opacity:.42;cursor:default" '
                    f'title="{E(item["disabled"])}">'
                    f'{_nav_svg(item["icon"])} {E(item["label"])} '
                    f'<span class="count">—</span></span>')
                continue
            on = " on" if current == item["href"] else ""
            sub = (" navsubitem navsub2item" if item.get("sub2")
                   else " navsubitem" if item.get("sub") else "")
            cnt = item.get("count")
            badge = f' <span class="count">{cnt}</span>' if cnt is not None else ""
            size = 14 if item.get("sub") else 0
            tip = f' title="{E(item["tip"])}"' if item.get("tip") else ""
            parts.append(
                f'  <a class="navitem{sub}{on}" href="{item["href"]}"{tip}>'
                f'{_nav_svg(item["icon"], size)} {E(item["label"])}{badge}</a>')

    parts.append(
        f'  <div class="foot">built {E(counts.get("stamp", "?"))}<br>'
        f'HEAD {E(counts.get("head", "?"))} · {GENERATOR_NAME}</div>')
    parts.append("</aside>")
    return "\n".join(parts)


def sidebar(cfg: dict, current: str, counts: dict) -> str:
    """Back-compat entry point: model → render, in one call."""
    return render_nav(cfg, nav_model(cfg, counts), current, counts)


def page(cfg: dict, fname: str, title: str, lede: str, kpis: str, body: str,
         counts: dict, crumb: str | None = None, skel_name: str = "architecture.html",
         extra: dict | None = None) -> str:
    """Fill a vendored shell skeleton for one estate page.

    Estate lenses use architecture.html (a generic `{{ARCH_KPIS}}` +
    `{{ARCH_BODY}}` frame). The board uses board.html instead — it carries the
    board's own slots AND the `<script src="assets/board.js">` tag that all the
    mode-switching, filtering and fold behaviour lives in.
    """
    skel = R.strip_slot_doc_comments((SHELL_SRC / skel_name).read_text())

    start = skel.index("<aside class=\"side\">")
    end = skel.index("</aside>") + len("</aside>")
    groups = counts.get("_nav") or nav_model(cfg, counts)
    skel = skel[:start] + render_nav(cfg, groups, fname, counts) + skel[end:]

    fills = {
        "{{LANG}}": cfg["project"]["lang"],
        "{{PROJECT_NAME}}": E(cfg["project"]["display_name"]),
        "{{REGEN_STAMP}}": E(counts.get("stamp", "?")),
        "{{HEAD_SHA}}": E(counts.get("head", "?")),
        "{{GENERATOR_NAME}}": GENERATOR_NAME,
        "{{SYNC_AGE}}": E(counts.get("stamp", "?")),
        "{{STATUS_PILLS}}": counts.get("pills", ""),
        "{{ARCH_KPIS}}": kpis,
        "{{ARCH_BODY}}": body,
    }
    fills.update(extra or {})
    for tok, val in fills.items():
        skel = skel.replace(tok, val)

    skel = skel.replace("<title>Architecture ·", f"<title>{E(title)} ·")
    skel = skel.replace("<title>Board ·", f"<title>{E(title)} ·")
    # The overview IS the crumb root, so it drops the "Overview ›" prefix rather
    # than linking to itself.
    crumb_html = (crumb if crumb is not None
                  else f'<a href="index.html">Overview</a> › <b>{E(title)}</b>')
    skel = skel.replace(
        '<div class="crumb"><a href="index.html">Overview</a> › <b>Architecture</b></div>',
        f'<div class="crumb">{crumb_html}</div>')
    skel = skel.replace(
        '<div class="crumb"><a href="index.html">Overview</a> › <b>Board</b></div>',
        f'<div class="crumb">{crumb_html}</div>')
    skel = skel.replace("<h1>Architecture</h1>", f"<h1>{E(title)}</h1>")
    skel = skel.replace(
        "<p>The whole application read once per build (ast, no LLM) into "
        "<code>archmap.json</code> — every feature Code tab and this station read "
        "that map, never the codebase. A PR diff of the map IS the architecture "
        "change.</p>", f"<p>{lede}</p>")
    return skel


# ------------------------------------------------------------------ filters


def filter_bar(specs: list[tuple[str, str, list[tuple[str, str, int]]]]) -> str:
    """Labelled dropdowns with per-option counts — the board's settled filter
    shape (ruling 3), reused here rather than a second vocabulary.

    A chip grid put four rows of vocabulary above the table before a single row
    appeared; a dropdown collapses that to one line and can carry the count per
    option, which a chip cannot without becoming unreadable.

    `specs` is [(key, label, [(value, label, count)])]. Each key matches a
    `data-<key>` attribute stamped on the rows. Options with a zero count are
    dropped — offering a filter that yields nothing teaches the reader the page
    is broken.
    """
    out = ['<div class="bfilters" data-filters>']
    for key, label, opts in specs:
        live = [(v, l, n) for v, l, n in opts if n]
        if len(live) < 2:
            continue                       # a filter with one choice is furniture
        total = sum(n for _v, _l, n in live)
        out.append(
            f'<label class="bfgrp"><span>{E(label)}</span>'
            f'<select data-f="{E(key)}">'
            f'<option value="all">All ({total})</option>'
            + "".join(f'<option value="{E(v)}">{E(l)} ({n})</option>'
                      for v, l, n in live)
            + "</select></label>")
    out.append('<button type="button" class="bfx" data-clear>Clear</button></div>')
    return "".join(out)


# Applies every active dropdown to every stamped row, hides a section whose rows
# are all filtered out, and — the part that makes deep links work — reads the
# query string on load so `enforcement.html?bucket=BROKEN_CLAIM` arrives with the
# dropdown already set and the page already narrowed.
FILTER_SCRIPT = (
    "<script>(function(){"
    "var bar=document.querySelector('[data-filters]');if(!bar)return;"
    "var sels=[].slice.call(bar.querySelectorAll('select[data-f]'));"
    "function apply(){"
    "var f={};sels.forEach(function(s){if(s.value!=='all')f[s.dataset.f]=s.value});"
    "document.querySelectorAll('[data-row]').forEach(function(r){"
    "var hide=false;for(var k in f){if((r.dataset[k]||'')!==f[k]){hide=true;break}}"
    "r.classList.toggle('ehide',hide)});"
    "document.querySelectorAll('[data-secwrap]').forEach(function(sec){"
    "var rows=sec.querySelectorAll('[data-row]'),vis=0;"
    "rows.forEach(function(r){if(!r.classList.contains('ehide'))vis++});"
    "sec.classList.toggle('ehide',rows.length>0&&vis===0)});}"
    "sels.forEach(function(s){s.addEventListener('change',apply)});"
    "var clr=bar.querySelector('[data-clear]');"
    "if(clr)clr.addEventListener('click',function(){"
    "sels.forEach(function(s){s.value='all'});apply()});"
    # Deep-link entry: ?key=value preselects the matching dropdown.
    "var q=new URLSearchParams(location.search);"
    "sels.forEach(function(s){var v=q.get(s.dataset.f);"
    "if(v&&[].some.call(s.options,function(o){return o.value===v}))s.value=v});"
    "apply();"
    # The anchor is re-applied AFTER filtering: hiding rows changes the document
    # height, so the browser's own jump lands in the wrong place.
    "if(location.hash){var t=document.getElementById(location.hash.slice(1));"
    "if(t)setTimeout(function(){t.scrollIntoView()},0)}"
    "})();</script>")


def named_gap(what: str, source: str) -> str:
    return R.gap(what, source)


def render_docs_station(cfg: dict, out: Path) -> tuple[str, str]:
    """The Docs station: one row per published page, grouped by the docsite's own
    tiers. Derived from the docsite config and the markdown on disk — a doc that
    is declared but whose source is missing renders as a named gap, never a row
    that pretends to exist."""
    sections = docs_sections(cfg)
    if not sections:
        return "", named_gap("the docs station — no docsite config is wired",
                             "paths.docsite_config in suite-center.config.json")

    src_dir = REPO_ROOT / cfg["paths"].get("docsite_src", "docs/src")
    total = sum(len(s["docs"]) for s in sections)
    lines = 0
    missing = 0
    rows_by_section = []
    for section in sections:
        rows = []
        for d in section["docs"]:
            md = None
            for cand in src_dir.glob("*.md"):
                if cand.stem == d["slug"] or (d["slug"] == "index" and cand.stem == "hub"):
                    md = cand
                    break
            if md is None:
                missing += 1
                rows.append([f'<b>{E(d["label"])}</b>',
                             '<span class="tag s-bad">source missing</span>', "—", "—"])
                continue
            n = len(md.read_text(errors="replace").splitlines())
            diagrams = md.read_text(errors="replace").count("```mermaid")
            lines += n
            rows.append([
                f'<a href="{d["slug"]}.html"><b>{E(d["label"])}</b></a>',
                f'<code>{E(md.name)}</code>',
                R.lines_grade(n),
                str(diagrams) if diagrams else '<span class="sub">—</span>',
            ])
        rows_by_section.append((section["label"], rows))

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Pages", str(total), "rendered into this shell"),
        R.kpi("Lines of markdown", f"{lines:,}", "the source of truth"),
        R.kpi("Sections", str(len(sections)), "reading tiers"),
        R.kpi("Missing sources", str(missing), "declared but absent",
              alert=missing > 0),
    ]) + "</div>"

    body = []
    for label, rows in rows_by_section:
        body.append(R.sechead("Docs", label, "#8e4585", IC["book"],
                              sub="Declared in docs/docsite.config.py; rendered from docs/src/.",
                              sec_id=f"docs.{label.lower().replace(' ', '-')}"))
        body.append(R.table(["Page", "Source", "Lines", "Diagrams"], rows, num={2, 3}))
    return kpis, "\n".join(body)


# ------------------------------------------------------------------ enforcement


def render_enforcement(cfg: dict, rules: list[dict], prov: str) -> tuple[str, str]:
    counts = D.bucket_counts(rules, cfg)
    total = len(rules)

    if not rules:
        return "", named_gap(
            "the enforcement ledger — no rule registry has been authored yet",
            f"{prov}; author it, then rebuild")

    payable = sum(counts.get(b["key"], 0) for b in cfg["buckets"] if b["payable"])
    kpis = '<div class="kpis">' + "".join([
        R.kpi("Rules catalogued", str(total), "across the whole suite"),
        R.kpi("Hard-enforced", str(counts.get("HARD_ENFORCED", 0)),
              "a check exists and runs"),
        R.kpi("Payable", str(payable),
              "hardenable + broken claims", alert=payable > 0),
        R.kpi("Prompt-only", str(counts.get("PROMPT_ONLY", 0)),
              "needs a disclosure carrier"),
    ]) + "</div>"

    from collections import Counter
    bc_all = Counter(r.get("bucket", "") for r in rules)
    beat_n = Counter(r.get("beat", "cross-cutting") for r in rules)
    sev_n = Counter(r.get("severity", "") for r in rules)
    body = [filter_bar([
        ("bucket", "Bucket", [(b["key"], b["label"], bc_all.get(b["key"], 0))
                              for b in sorted(cfg["buckets"],
                                              key=lambda x: BUCKET_STYLE[x["key"]][2])]),
        ("beat", "Beat", [(b["slug"], b["label"], beat_n.get(b["slug"], 0))
                          for b in cfg["beats"]]),
        ("sev", "Severity", [(k, k.title(), sev_n.get(k, 0))
                             for k in ("critical", "high", "medium", "low")]),
    ])]

    bucket_by_key = {b["key"]: b for b in cfg["buckets"]}
    order = sorted(bucket_by_key, key=lambda k: BUCKET_STYLE.get(k, ("", "", 9))[2])

    for key in order:
        meta = bucket_by_key[key]
        group = [r for r in rules if r.get("bucket") == key]
        if not group:
            continue
        color, icon, _ = BUCKET_STYLE[key]

        cols = ["Rule", "Beat", "Stated at", "Mechanism"]
        rows, stamps = [], []
        for r in sorted(group, key=lambda x: (_sev_rank(x.get("severity", "")),
                                              x.get("title", ""))):
            beat = r.get("beat", "cross-cutting")
            sev = r.get("severity", "")
            sev_html = (f' <span class="chip {BUCKET_CHIP[key]}">{E(sev)}</span>'
                        if sev else "")
            mech = r.get("mechanism", "none") or "none"
            mech_html = ("<em>none</em>" if mech.strip().lower() == "none"
                         else f"<code>{E(R.trunc(mech, 52))}</code>")
            cells = [
                f'<b>{E(r.get("title", "?"))}</b>{sev_html}',
                f'<span class="chip mut">{E(beat)}</span>',
                f'<code>{E(R.trunc(r.get("where", "—"), 46))}</code>',
                mech_html,
            ]
            rows.append((cells, _rule_detail(r, key), None))
            stamps.append({"bucket": key, "beat": beat,
                           "sev": r.get("severity", "")})

        wrap_open = f'<div data-secwrap="{key}">'
        body.append(wrap_open + R.sechead(
            f"{len(group)}", meta["label"], color, IC[icon],
            sub=meta["blurb"], id_=f"sec-{key.lower()}",
            sec_id=f"enforcement-{key.lower()}"))
        body.append(_tagged_xtable(cols, rows, stamps))
        body.append("</div>")

    body.append(
        f'<p class="sub" style="margin-top:18px">Rule classification is '
        f"<b>authored judgment</b>, not derived — a parser cannot decide whether a "
        f"rule is hardenable or inherently a judgment call. Source: "
        f"<code>{E(prov)}</code>. Every row's evidence field records how the "
        f"bucket was established.</p>")
    body.append(FILTER_SCRIPT)
    return kpis, "".join(body)


def _sev_rank(sev: str) -> int:
    return {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(sev, 4)


def _tagged_xtable(cols, rows, attrs) -> str:
    """R.xtable() with each emitted row stamped with filter attributes.

    `attrs` is parallel to `rows`: one dict per row of {key: value}, rendered as
    `data-<key>` plus a `data-row` marker the filter script keys on. The renderer
    has no hook for row attributes, so the stamp is applied to the generated
    markup positionally — and asserted against the row count, so a renderer
    change fails the build instead of silently unfiltering every page.

    A row is `<details class="xrow">` when it has detail and `<div class="xrow
    xflat">` when it does not, so the split targets the class attribute rather
    than the tag name.
    """
    tbl = R.xtable(cols, rows)
    marker = 'class="xrow'
    pieces = tbl.split(marker)
    if len(pieces) - 1 != len(attrs):
        raise SystemExit(
            f"BREAK: xtable emitted {len(pieces) - 1} .xrow blocks for "
            f"{len(attrs)} rows — the row markup changed and every filter on "
            f"this page would silently stop working. Nothing was written.")
    out = [pieces[0]]
    for a, piece in zip(attrs, pieces[1:]):
        stamp = " ".join(f'data-{k}="{E(str(v))}"' for k, v in a.items() if v)
        out.append(f'data-row {stamp} {marker}{piece}')
    return "".join(out)


def _tagged_table(headers, rows, attrs, **kw) -> str:
    """R.table() with the same per-row stamping, for the pages that use a flat
    table rather than an expander."""
    tbl = R.table(headers, rows, **kw)
    marker = "<tr>"
    pieces = tbl.split(marker)
    body = len(pieces) - 1
    if body != len(attrs) + 1:            # +1 for the header row
        raise SystemExit(
            f"BREAK: table emitted {body} <tr> for {len(attrs)} data rows plus a "
            f"header — row stamping would misalign and filter the wrong rows. "
            f"Nothing was written.")
    out = [pieces[0], marker, pieces[1]]  # header row untouched
    for a, piece in zip(attrs, pieces[2:]):
        stamp = " ".join(f'data-{k}="{E(str(v))}"' for k, v in a.items() if v)
        out.append(f"<tr data-row {stamp}>{piece}")
    return "".join(out)


def _rule_detail(r: dict, bucket: str) -> str:
    """The row's opened detail. Which fields matter depends on the bucket — a
    hardenable rule owes you the check that would close it, a prompt-only rule
    owes you its disclosure carrier, a broken claim owes you the false sentence.
    """
    out = [f'<p>{R.md(r.get("statement", ""))}</p>']
    facts: list[tuple[str, str]] = []

    if r.get("mechanism_where"):
        facts.append(("Mechanism at", f'<code>{E(r["mechanism_where"])}</code>'))
    if r.get("exit_semantics"):
        facts.append(("Exit semantics", E(r["exit_semantics"])))

    if bucket == "HARDENABLE" and r.get("hardening"):
        facts.append(("The check that would close it", R.md(r["hardening"])))
    if bucket == "PROMPT_ONLY":
        if r.get("carrier"):
            facts.append(("Disclosure carrier", f'<code>{E(r["carrier"])}</code>'))
        depth = r.get("carrier_depth", "")
        if depth:
            warn = depth in ("reference-spec", "none")
            facts.append((
                "Carrier depth",
                f'<span class="chip {"warn" if warn else "mut"}">{E(depth)}</span>'
                + ("  — a rule that lives only in a deep spec may never be loaded "
                   "at the moment it must fire" if depth == "reference-spec" else "")))
    if bucket == "BROKEN_CLAIM" and r.get("defect"):
        facts.append(("What is false", R.md(r["defect"])))

    if r.get("evidence"):
        facts.append(("Evidence", R.md(r["evidence"])))

    if facts:
        out.append('<table class="tbl"><tbody>' + "".join(
            f'<tr><td style="width:210px;vertical-align:top"><b>{E(k)}</b></td>'
            f"<td>{v}</td></tr>" for k, v in facts) + "</tbody></table>")
    return "".join(out)


# ------------------------------------------------------------------ hooks


def render_hooks(cfg: dict, hooks: list[dict], facts: dict, prov: str) -> tuple[str, str]:
    if not hooks:
        return "", named_gap("the hook inventory",
                             f"{cfg['paths']['hooks']} (absent or empty)")

    probed = {h["name"]: h for h in facts.get("hooks", [])}
    blocks = [h for h in hooks if probed.get(h["name"], {}).get("verdict") == "BLOCKS"]
    unprobed = [h["name"] for h in hooks if h["name"] not in probed]

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Shipped hooks", str(len(hooks)), "wired via templates/hooks.json"),
        R.kpi("That can block", str(len(blocks)) if probed else "—",
              "a non-zero exit the harness acts on",
              alert=bool(probed) and len(blocks) <= 1),
        R.kpi("Pre-emptive slot", str(sum(1 for h in hooks
                                          if h["event"] == "PreToolUse")),
              "PreToolUse — where exit 2 aborts the call"),
        R.kpi("Unprobed", str(len(unprobed)) if unprobed else "0",
              "exit behaviour not observed", alert=bool(unprobed)),
    ]) + "</div>"

    cols = ["Hook", "Slot", "Matcher", "Verdict", "Exits"]
    rows, group = [], []
    for h in sorted(hooks, key=lambda x: (x["event"], x["name"])):
        p = probed.get(h["name"], {})
        verdict = p.get("verdict", "")
        vchip = {"BLOCKS": "bad", "WARNS": "warn",
                 "ANNOUNCES": "mut", "INERT": "mut"}.get(verdict, "mut")
        verdict_html = (f'<span class="chip {vchip}">{E(verdict)}</span>'
                        if verdict else '<span class="chip mut">unprobed</span>')
        exits = p.get("exit_codes") or (
            ", ".join(str(c) for c in h["exit_codes_found"]) or "0 only (literal)")
        cells = [
            f'<b>{E(h["name"])}</b>',
            f'<span class="chip mut">{E(h["event"] or "—")}</span>',
            f'<code>{E(h["matcher"] or "—")}</code>',
            verdict_html,
            f'<code>{E(R.trunc(str(exits), 40))}</code>',
        ]
        rows.append((cells, _hook_detail(h, p), None))
        group.append({"event": h["event"] or "unwired",
                      "verdict": p.get("verdict", "unprobed"),
                      "beat": p.get("beat", "cross-cutting")})

    from collections import Counter
    ev_n = Counter(h["event"] or "unwired" for h in hooks)
    vd_n = Counter(probed.get(h["name"], {}).get("verdict", "unprobed") for h in hooks)
    body = [filter_bar([
        ("event", "Slot", [(k, k, v) for k, v in sorted(ev_n.items())]),
        ("verdict", "Verdict", [(k, k.title(), v) for k, v in sorted(vd_n.items())]),
    ]),
            '<div data-secwrap="hooks">',
            R.sechead(str(len(hooks)), "Shipped hooks",
                      "#b65a2b", IC["zap"],
                      sub="Every hook the suite installs, its slot, and what its exit "
                          "code actually does there. A hook in the PreToolUse slot can "
                          "abort a call with exit 2; a PostToolUse hook fires after the "
                          "write has landed, so its exit 2 is blocking FEEDBACK, not "
                          "prevention.",
                      id_="sec-hooks", sec_id="hooks-inventory"),
            _tagged_xtable(cols, rows, group),
            "</div>"]

    if unprobed:
        body.append(named_gap(
            f"observed exit behaviour for {len(unprobed)} hook(s): "
            + ", ".join(sorted(unprobed)),
            "data/facts.json — run the probe, then rebuild"))
    body.append(f'<p class="sub" style="margin-top:16px">Slot and matcher are '
                f"<b>derived</b> from <code>templates/hooks.json</code> on every build. "
                f"Verdicts and exit codes are <b>observed</b> — recorded in "
                f"<code>{E(prov)}</code> by probing each hook, not by reading it.</p>")
    body.append(FILTER_SCRIPT)
    return kpis, "".join(body)


def _hook_detail(h: dict, p: dict) -> str:
    out = []
    if h.get("header"):
        out.append(f'<p><b>The script says:</b> <em>{E(h["header"])}</em></p>')
    facts = [("Script", f'<code>{E(h["script"])}</code> · {h["lines"]} lines'),
             ("Settings marker", f'<code>{E(h["marker"] or "—")}</code>'),
             ("Timeout", E(h["timeout"] or "—"))]
    if p.get("reads"):
        facts.append(("Actually reads", R.md(p["reads"])))
    if p.get("fail_open"):
        facts.append(("Fails open when", R.md(p["fail_open"])))
    if p.get("fixture_coverage"):
        facts.append(("Fixture coverage", R.md(p["fixture_coverage"])))
    if p.get("discrepancy"):
        facts.append(("⚠ Says vs does", R.md(p["discrepancy"])))
    out.append('<table class="tbl"><tbody>' + "".join(
        f'<tr><td style="width:210px;vertical-align:top"><b>{E(k)}</b></td>'
        f"<td>{v}</td></tr>" for k, v in facts) + "</tbody></table>")
    return "".join(out)


# ------------------------------------------------------------------ testing


def render_testing(cfg: dict, batteries: list[dict], facts: dict,
                   prov: str) -> tuple[str, str]:
    if not batteries:
        return "", named_gap("the battery inventory",
                             f"{cfg['paths']['tests']} (no run.sh found)")

    recorded = {b["name"]: b for b in facts.get("batteries", [])}
    uncovered = facts.get("uncovered", [])
    total_asserts = sum(r.get("assertions", 0) for r in recorded.values())
    red = [n for n, r in recorded.items() if r.get("status") == "RED"]
    in_g3 = [b for b in batteries if b["in_g3"]]

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Batteries", str(len(batteries)),
              f"{len(in_g3)} in the doctor's G3 sweep"),
        R.kpi("Assertions", str(total_asserts) if total_asserts else "—",
              "last recorded run"),
        R.kpi("Red", str(len(red)) if recorded else "—",
              ", ".join(red) if red else "all green", alert=bool(red)),
        R.kpi("Gates with no battery", str(len(uncovered)) if uncovered else "—",
              "unproven checkers", alert=bool(uncovered)),
    ]) + "</div>"

    cols = ["Battery", "Assertions", "Status", "G3", "Protects"]
    rows, group = [], []
    for b in sorted(batteries, key=lambda x: x["name"]):
        r = recorded.get(b["name"], {})
        status = r.get("status", "")
        schip = {"GREEN": "ok", "RED": "bad",
                 "EXCLUDED": "mut", "UNRUNNABLE": "warn"}.get(status, "mut")
        fire, silent = r.get("proves_fire"), r.get("proves_silent")
        both = (f'<span class="chip {"ok" if fire and silent else "warn"}">'
                f'{"fire+silent" if fire and silent else "partial"}</span>'
                if r else "")
        cells = [
            f'<b>{E(b["name"])}</b> {both}',
            str(r.get("assertions", "—")),
            (f'<span class="chip {schip}">{E(status)}</span>' if status
             else '<span class="chip mut">not run</span>'),
            ('<span class="chip ok">yes</span>' if b["in_g3"]
             else '<span class="chip warn">excluded</span>'),
            E(R.trunc(r.get("protects", "—"), 58)),
        ]
        rows.append((cells, _battery_detail(b, r), None))
        group.append({"g3": "in-g3" if b["in_g3"] else "excluded",
                      "status": r.get("status", "not-run"),
                      "beat": r.get("beat", "cross-cutting")})

    from collections import Counter
    g3_n = Counter("in-g3" if b["in_g3"] else "excluded" for b in batteries)
    st_n = Counter(recorded.get(b["name"], {}).get("status", "not-run") for b in batteries)
    body = [filter_bar([
        ("g3", "Doctor sweep", [(k, "In G3" if k == "in-g3" else "Excluded", v)
                                for k, v in sorted(g3_n.items())]),
        ("status", "Status", [(k, k.title(), v) for k, v in sorted(st_n.items())]),
    ]),
            '<div data-secwrap="batteries">',
            R.sechead(str(len(batteries)), "Fixture batteries",
                      "#1f7a5a", IC["check"],
                      sub="The batteries are what give every other gate its teeth: the "
                          "suite's own rule is that a checker ships fixtures proving it "
                          "can both FIRE and stay SILENT. A checker that cannot be shown "
                          "to fail is not evidence.",
                      id_="sec-batteries", sec_id="testing-batteries"),
            _tagged_xtable(cols, rows, group),
            "</div>"]

    if uncovered:
        body.append(R.sechead(
            str(len(uncovered)), "Gates with no battery", "#b63a3a", IC["alert"],
            sub="Checkers and gates that exist in the repo with no fixture battery "
                "behind them — including, notably, the doctor that enforces the "
                "fixture rule on everything else.",
            id_="sec-uncovered", sec_id="testing-uncovered"))
        body.append(R.table(["Gate", "Why it matters"],
                            [[f'<code>{E(u.split(" — ")[0])}</code>',
                              E(u.split(" — ", 1)[1] if " — " in u else "")]
                             for u in uncovered]))
    else:
        body.append(named_gap("the uncovered-gate sweep",
                              "data/facts.json (`uncovered` not recorded)"))

    body.append(f'<p class="sub" style="margin-top:16px">Battery paths and G3 '
                f"inclusion are <b>derived</b> on every build (the exclusion list is "
                f"read out of <code>scripts/suite-doctor.sh</code>, never restated). "
                f"Assertion counts and pass/fail are a <b>recorded run</b> from "
                f"<code>{E(prov)}</code> — running eight batteries per page build "
                f"would make the center slow and non-deterministic.</p>")
    body.append(FILTER_SCRIPT)
    return kpis, "".join(body)


def _battery_detail(b: dict, r: dict) -> str:
    facts = [("Path", f'<code>{E(b["path"])}</code> · {b["lines"]} lines')]
    if b["excluded_reason"]:
        facts.append(("Excluded from G3 because", E(b["excluded_reason"])))
    if r.get("protects"):
        facts.append(("Protects", R.md(r["protects"])))
    if r.get("failures"):
        facts.append(("Failures", str(r["failures"])))
    facts.append((
        "Proves it can FIRE",
        '<span class="chip ok">yes</span>' if r.get("proves_fire")
        else '<span class="chip warn">not recorded</span>'))
    facts.append((
        "Proves it stays SILENT",
        '<span class="chip ok">yes</span>' if r.get("proves_silent")
        else '<span class="chip warn">not recorded</span>'))
    if b["fixture_files"]:
        facts.append(("On-disk fixtures", f'{b["fixture_files"]} files'))
    else:
        facts.append(("On-disk fixtures",
                      "none — builds its fixtures inline (hermetic)"))
    if r.get("note"):
        facts.append(("Note", R.md(r["note"])))
    return ('<table class="tbl"><tbody>' + "".join(
        f'<tr><td style="width:210px;vertical-align:top"><b>{E(k)}</b></td>'
        f"<td>{v}</td></tr>" for k, v in facts) + "</tbody></table>")


# ------------------------------------------------------------------ board


def render_board(cfg: dict, cards: list[dict], labels: dict,
                 sources: list[dict]) -> dict:
    """The board's slot fills, using `_a3_board`'s public surface only.

    Ruling 1 — PROJECTION ONLY. Nothing here stores card state: every card is
    recomputed from its source file on each build, so a card the viewer could
    move would immediately be a second source of truth competing with the file
    it came from. `board.js` gives modes, filters and folds; it never persists.
    """
    if not cards:
        return {"{{BOARD_BOARDS}}": named_gap(
            "the board", "no open moves found in any of the five sources"),
            "{{BOARD_KPIS}}": "", "{{BOARD_MODES}}": "",
            "{{BOARD_FILTERS}}": "", "{{PHASE_STRIP}}": "",
            "{{PHASE_JSON}}": "[]"}

    ntracks = len(BRD.SUITE_TRACK_ORDER)
    kpi_html = BOARD.kpis(cards)
    # `kpis()` hardcodes "across 6 tracks" for the twins' vocabulary. The suite
    # registers five, so the sub-label would ship a wrong number. Upstream owns
    # that file and is being edited in parallel, so the string is corrected here
    # — and the substitution is ASSERTED, because a silent no-op after an
    # upstream reword would put the wrong count back on the page.
    stale = "across 6 tracks"
    if stale not in kpi_html:
        raise SystemExit(
            "BREAK: _a3_board.kpis() no longer contains 'across 6 tracks' — the "
            "suite board's track-count correction has silently stopped applying. "
            "Re-check the sub-label before building. Nothing was written.")
    kpi_html = kpi_html.replace(stale, f"across {ntracks} tracks")

    # Every source is listed, including any that yielded nothing: "no open
    # moves" and "the board never looked" must not render identically.
    prov = R.table(
        ["Source", "Track", "Cards"],
        [[f'<code>{E(s["source"])}</code>',
          f'<span class="chip mut">{E(s["track"])}</span>',
          (str(s["cards"]) if s["present"]
           else '<span class="chip bad">0 — source absent or unreadable</span>')]
         for s in sources])

    legend = R.table(
        ["State cell", "Card state", "Why"],
        [[f'<code>{E(k)}</code>',
          f'<span class="chip mut">{E(v[0])}</span>', E(v[1])]
         for k, v in BRD.STATE_MAP.items()])

    body = (BOARD.board_html("state", cards, labels)
            + "".join(BOARD.board_html(m, cards, labels)
                      for m, _l, _s in BOARD.MODES if m != "state"))

    tail = (R.sechead(str(len(sources)), "Where these cards come from",
                      "#6e6757", IC["database"],
                      sub="This repo carries no .kdbp (ruling R8), so none of the "
                          "twins' board sources exist here. These five files are the "
                          "suite's equivalents. Every card is a projection of one of "
                          "them — nothing on this page is stored.",
                      id_="sec-sources", sec_id="board-sources")
            + prov
            + R.sechead(str(len(BRD.STATE_MAP)), "How the backlog's State cell maps",
                        "#7a5a8a", IC["message"],
                        sub="The backlog's own State cell drives the card state and is "
                            "never re-derived. This is the declared mapping, shown so a "
                            "reader can audit it instead of trusting it.",
                        id_="sec-statemap", sec_id="board-statemap")
            + legend)

    return {
        "{{BOARD_TITLE}}": "Board",
        "{{BOARD_LEDE}}": (
            "Every open move the suite is carrying, projected from five committed "
            "sources. Six framings over the same cards; State is the landing one. "
            "Nothing here is stored — re-run the build and the board is whatever "
            "the files now say."),
        "{{BOARD_KPIS}}": kpi_html,
        "{{BOARD_MODES}}": BOARD.modebar(),
        "{{BOARD_FILTERS}}": BOARD.filter_bar(cards, labels),
        "{{BOARD_BOARDS}}": body + tail,
        # The suite has no PLAN, so the phase strip is a named gap rather than an
        # empty rail that would read as "no phases are owed".
        "{{PHASE_STRIP}}": named_gap(
            "the phase strip",
            "this repo carries no .kdbp/PLAN.md by ruling R8 — there are no "
            "lifecycle phases to sequence"),
        "{{PHASE_JSON}}": "[]",
    }


# ------------------------------------------------------------------ agents


def load_backlinks(out: Path) -> dict:
    """docs-backlinks.json — the inbound half, written by the docsite build.

    Read, never computed here: both directions come from ONE extraction pass so
    they cannot disagree. Absent file (docs not built yet) ⇒ no backlinks, which
    is honest on the first build of a fresh clone.
    """
    path = out / "docs-backlinks.json"
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8")).get("targets", {})
    except json.JSONDecodeError:
        return {}


def backlink_line(backlinks: dict, cls: str, token: str) -> str:
    """`Documented in: …` for one target, or nothing.

    Nothing is the right output for an undocumented thing: an empty line reading
    "Documented in: —" invites the reader to treat absence as a defect, when a
    great deal of the estate has no reason to be written about.
    """
    docs = backlinks.get("%s:%s" % (cls, token)) or []
    if not docs:
        return ""
    links = " · ".join('<a href="%s">%s</a>' % (d["href"], E(d["title"])) for d in docs)
    return '<p class="docref">Documented in: %s</p>' % links


def render_agents(cfg: dict, skills: list[dict], surf: dict) -> tuple[str, str]:
    forks, explore = surf["forks"], surf["explore"]
    human, bg, reg = surf["human_only"], surf["background"], surf["registry"]

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Fork skills", str(len(forks)), "run in their own context"),
        R.kpi("Read-only", str(len(explore)), "agent: Explore — cannot write"),
        R.kpi("Human-initiated", str(len(human)), "the model may not self-invoke"),
        R.kpi("Harness agents", str(len(reg)) if reg else "—",
              "not shipped by the suite"),
    ]) + "</div>"

    from collections import Counter
    beat_n = Counter(s["beat"] for s in skills)
    ctx_n = Counter("fork" if s["fork"] else "main" for s in skills)
    inv_n = Counter("human" if s["human_only"] else
                    "background" if s["background"] else "either" for s in skills)
    body = [filter_bar([
        ("beat", "Beat", [(b["slug"], b["label"], beat_n.get(b["slug"], 0))
                          for b in cfg["beats"]]),
        ("ctx", "Context", [(k, k.title(), v) for k, v in sorted(ctx_n.items())]),
        ("inv", "Invocation", [(k, k.title(), v) for k, v in sorted(inv_n.items())]),
    ])]

    cols = ["Skill", "Beat", "Context", "Invocation", "Dispatch"]
    rows, group = [], []
    for s in sorted(skills, key=lambda x: (x["beat"], x["name"])):
        flags = []
        if s["fork"]:
            flags.append('<span class="chip grow">fork</span>')
        if s["explore"]:
            flags.append('<span class="chip ok">read-only</span>')
        if not flags:
            flags.append('<span class="chip mut">main context</span>')
        inv = ('<span class="chip warn">human only</span>' if s["human_only"]
               else '<span class="chip mut">background</span>' if s["background"]
               else '<span class="chip ok">model or human</span>')
        rows.append(([
            f'<b>{E(s["name"])}</b> <span class="chip mut">{E(s["version"])}</span>',
            f'<span class="chip mut">{E(s["beat"])}</span>',
            " ".join(flags),
            inv,
            f'{s["dispatch_chars"]:,}',
        ], _agent_detail(s, cfg.get("_backlinks")), None))
        group.append({"beat": s["beat"],
                      "ctx": "fork" if s["fork"] else "main",
                      "inv": ("human" if s["human_only"] else
                              "background" if s["background"] else "either")})

    body += ['<div data-secwrap="agents">',
             R.sechead(str(len(skills)), "The skill surface", "#7a5a8a", IC["users"],
                       sub="Every shipped skill and how it runs. A FORK skill gets its own "
                           "context and returns findings; an Explore skill additionally "
                           "cannot write. `disable-model-invocation` means only a human "
                           "may start it — the suite's answer to irreversible beats.",
                       id_="sec-skills", sec_id="agents-skills"),
             _tagged_xtable(cols, rows, group),
             "</div>"]

    if reg:
        body.append(R.sechead(
            str(len(reg)), "Harness subagent registry", "#6e6757", IC["users"],
            sub=f"Read from {E(surf['registry_path'])}. These are the operator's "
                f"machine-local agent types, NOT suite artifacts — the suite ships "
                f"none of them and depends on none of them. Listed so the two "
                f"populations are not confused.",
            id_="sec-registry", sec_id="agents-registry"))
        body.append(R.table(
            ["Agent", "Description"],
            [[f'<code>{E(a["name"])}</code>', E(R.trunc(a["description"], 120))]
             for a in reg]))
    else:
        body.append(named_gap("the harness subagent registry",
                              f"{surf['registry_path']} (absent)"))
    body.append(FILTER_SCRIPT)
    return kpis, "".join(body)


def _agent_detail(s: dict, backlinks: dict | None = None) -> str:
    facts = [
        ("Description", R.md(s["description"])),
        ("Trigger", R.md(s["when_to_use"])),
        ("Lean core", f'{s["core_lines"]} lines'),
        ("Deep spec", (f'{s["reference_count"]} file(s), {s["reference_lines"]} lines'
                       if s["reference_count"] else "none — the core is the whole spec")),
        ("Ships code", f'{s["script_count"]} file(s)' if s["script_count"]
                       else "no — prose only"),
    ]
    # The INBOUND edge: which written docs describe this skill. Derived from the
    # docsite's extraction pass, never authored here — and stated as what it is,
    # since a doc describing a skill is not evidence the skill works.
    docref = backlink_line(backlinks or {}, "skill", "/" + s["name"])
    if docref:
        facts.append(("Written up in", docref))
    return ('<table class="tbl"><tbody>' + "".join(
        f'<tr><td style="width:150px;vertical-align:top"><b>{E(k)}</b></td>'
        f"<td>{v}</td></tr>" for k, v in facts) + "</tbody></table>")


# ------------------------------------------------------------------ formats


def render_formats(cfg: dict, contracts: list[dict], enums: list[dict]) -> tuple[str, str]:
    if not contracts:
        return "", named_gap("the format-contract probe", "_suite_formats.probe")

    clean = [c for c in contracts if c["status"] == "CLEAN"]
    drift = [c for c in contracts if c["status"] == "DRIFTED"]
    unpro = [c for c in contracts if c["status"] in ("UNPROBEABLE", "UNPROBED")]

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Contracts declared", str(len(contracts)),
              "mechanisms.md byte-identical table"),
        R.kpi("Verify clean", str(len(clean)), "one skeleton across all carriers"),
        R.kpi("Drifted", str(len(drift)), "more than one wording",
              alert=bool(drift)),
        R.kpi("Not comparable", str(len(unpro)),
              "a line diff cannot judge these", alert=bool(unpro)),
    ]) + "</div>"

    body = [
        '<p class="sub"><code>docs/src/mechanisms.md:38</code> argues byte-identical '
        "reuse exists precisely so <b>“a plain-text diff can verify”</b> the "
        "cross-file agreement — and no such diff ships. This page is that diff. Each "
        "contract's format is captured (not the prose that mentions it), reduced to a "
        "<b>skeleton</b> with placeholders blanked, and grouped. More than one "
        "skeleton means the carriers disagree.</p>"]

    STY = {"CLEAN": ("ok", "#1f7a5a", "lock"),
           "DRIFTED": ("bad", "#b63a3a", "alert"),
           "UNPROBEABLE": ("warn", "#d97a3d", "wrench"),
           "UNPROBED": ("warn", "#d97a3d", "wrench")}

    cols = ["Contract", "Status", "Hits", "Renderings", "Skeletons"]
    rows = []
    for c in contracts:
        chip, _, _ = STY[c["status"]]
        rows.append(([
            f'<b>{E(R.trunc(c["label"], 60))}</b>',
            f'<span class="chip {chip}">{E(c["status"])}</span>',
            str(c["hits"]), str(c["renderings"]), str(c["skeletons"]),
        ], _format_detail(c), None))

    body += [R.sechead(
        str(len(contracts)), "Byte-identical string contracts", "#b65a2b", IC["type"],
        sub="Eight strings the suite declares must be copied verbatim between the "
            "skills that produce and consume them. A drifted one means a literal-minded "
            "model reading only one carrier would treat it as an unrelated format.",
        id_="sec-contracts", sec_id="formats-contracts"),
        R.xtable(cols, rows)]

    if enums:
        union = sorted({m for e in enums for m in e["members"]})
        body.append(R.sechead(
            str(len(enums)), "Skip-code enum, compared as sets", "#b63a3a", IC["alert"],
            sub="The one contract whose members can be compared as a SET rather than a "
                "string, which makes the drift exactly quantifiable. Union across all "
                f"carriers: {len(union)} members.",
            id_="sec-enum", sec_id="formats-enum"))
        body.append(R.table(
            ["Carrier", "Members", "Missing vs union"],
            [[f'<code>{E(e["where"])}</code>', str(e["count"]),
              (f'<span class="chip bad">{E(", ".join(e["missing"]))}</span>'
               if e.get("missing") else '<span class="chip ok">complete</span>')]
             for e in sorted(enums, key=lambda x: -x["count"])]))
    return kpis, "".join(body)


def _format_detail(c: dict) -> str:
    out = [f'<p><b>Carriers the table names:</b> {E(c["carriers"])}</p>']
    if c.get("unprobeable"):
        out.append(f'<p><b>Not comparable:</b> {E(c["unprobeable"])}</p>')
    out.append(f'<p class="sub">Probe: <code>{E(c["signature"])}</code></p>')
    for v in c["skeleton_variants"]:
        cls = "bad" if c["status"] == "DRIFTED" else "ok"
        out.append(
            f'<p><span class="chip {cls}">{len(v["where"])}×</span> '
            f'<code>{E(R.trunc(v["text"], 150))}</code><br>'
            f'<span class="sub">{E(", ".join(v["where"][:6]))}'
            + (f' (+{len(v["where"]) - 6} more)' if len(v["where"]) > 6 else "")
            + "</span></p>")
    return "".join(out)


# ------------------------------------------------------------------ functions


def render_functions(cfg: dict, fns: list[dict]) -> tuple[str, str]:
    if not fns:
        return "", named_gap("the function map", "no parseable source found")

    from collections import Counter
    by_area = Counter(f["area"] for f in fns)
    by_lang = Counter(f["lang"] for f in fns)
    big = [f for f in fns if f["lines"] > 100]
    undoc = [f for f in fns if f["lang"] == "python" and not f["private"]
             and not f["doc"]]

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Functions", str(len(fns)),
              " · ".join(f"{k} {v}" for k, v in by_lang.most_common())),
        R.kpi("Over 100 lines", str(len(big)), "candidates for the size budget",
              alert=bool(big)),
        R.kpi("Public, undocumented", str(len(undoc)), "python, no docstring",
              alert=len(undoc) > 20),
        R.kpi("Areas", str(len(by_area)), " · ".join(by_area)),
    ]) + "</div>"

    body = [R.sechead(
        str(len(big)), "Largest functions", "#d97a3d", IC["code"],
        sub="The suite's 800-line budget is a FILE budget and report-never-gate. "
            "Nothing measures function size at all — these are the ones a function-level "
            "budget would surface first.",
        id_="sec-big", sec_id="functions-big")]
    body.append(R.table(
        ["Function", "Lines", "Where", "Area"],
        [[f'<code>{E(f["name"])}</code>', str(f["lines"]),
          f'<code>{E(f["file"])}:{f["line"]}</code>',
          f'<span class="chip mut">{E(f["area"])}</span>']
         for f in sorted(big, key=lambda x: -x["lines"])[:25]],
        num={1}))

    body.append(R.sechead(
        str(len(fns)), "Every function, by area", "#1f3a6b", IC["code"],
        sub="Derived by `ast` for python and by line pattern for shell and mjs. "
            "The vendored fork under docs/center/generators/ is skipped where it "
            "duplicates templates/center/generators/ — counting both would double "
            "the standard center and read as new surface.",
        id_="sec-all", sec_id="functions-all"))
    for area, n in by_area.most_common():
        rows = [[f'<code>{E(f["name"])}</code>',
                 f'<span class="chip mut">{E(f["lang"])}</span>',
                 f'<code>{E(f["file"])}:{f["line"]}</code>',
                 E(R.trunc(f["doc"], 90)) if f["doc"] else "—"]
                for f in sorted(fns, key=lambda x: (x["file"], x["line"]))
                if f["area"] == area]
        body.append(f'<details class="secinfo"><summary><b>{E(area)}</b> '
                    f'<span class="chip mut">{n}</span></summary><div>')
        body.append(R.table(["Function", "Lang", "Where", "Docstring"], rows))
        body.append("</div></details>")
    return kpis, "".join(body)


# ------------------------------------------------------------------ structures


def render_structures(cfg: dict, structs: list[dict]) -> tuple[str, str]:
    if not structs:
        return "", named_gap("the data-structure inventory", "no artifacts found")

    schemas = [s for s in structs if s["kind"] == "JSON Schema"]
    md = [s for s in structs if s["kind"] != "JSON Schema"]
    unref = [s for s in schemas if not s["referenced"]]

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Artifact shapes", str(len(structs)), "schemas + markdown artifacts"),
        R.kpi("JSON Schemas", str(len(schemas)), "the only formal shapes"),
        R.kpi("Schema, no loader", str(len(unref)),
              "a schema in name only", alert=bool(unref)),
        R.kpi("Markdown artifacts", str(len(md)), "shape is prose or a table header"),
    ]) + "</div>"

    body = [R.sechead(
        str(len(schemas)), "Formal schemas", "#1f7a5a", IC["database"],
        sub="Every *.schema.json in the repo. `Referenced by` is deliberately weaker "
            "than 'validated by': a filename appearing in an executable is not proof "
            "that anything loads it — schemas/validate.py builds its path dynamically "
            "and matches here only because its docstring spells both names out.",
        id_="sec-schemas", sec_id="structures-schemas"),
        R.table(
        ["Schema", "Shape", "Referenced by", "Ledger rules"],
        [[f'<code>{E(s["name"])}</code>', E(s["shape"]),
          (f'<code>{E(R.trunc(s["referenced_by"], 44))}</code>' if s["referenced"]
           else '<span class="chip bad">nothing</span>'),
          str(s["rules"])] for s in schemas])]

    body.append(R.sechead(
        str(len(md)), "Markdown artifacts", "#7a6a2b", IC["database"],
        sub="The .kdbp surface as the templates define it. None has a validator; where "
            "a shape exists at all it is a table header row that four writers are "
            "trusted to match by hand.",
        id_="sec-md", sec_id="structures-markdown"))
    body.append(R.table(
        ["Artifact", "Shape", "Ledger rules"],
        [[f'<code>{E(s["name"])}</code>', E(R.trunc(s["shape"], 110)),
          str(s["rules"])]
         for s in sorted(md, key=lambda x: -x["rules"])]))
    return kpis, "".join(body)


# ------------------------------------------------------------------ overview


def render_index(cfg: dict, rules: list[dict], hooks: list[dict],
                 batteries: list[dict], skills: list[dict], facts: dict,
                 counts: dict, contracts: list[dict], structs: list[dict],
                 fns: list[dict], cards: list[dict]) -> tuple[str, str]:
    """The overview leads with what can be ACTED ON.

    Two changes over the first cut, both from operator feedback: the
    accountability split moved above everything else, and every count on this
    page is now a link. A row that states a number and goes nowhere makes the
    reader hunt for the thing it just named.

    Deep links carry `?key=value` so the destination arrives already filtered,
    plus the section anchor so it arrives already scrolled.
    """
    from collections import Counter
    bc = D.bucket_counts(rules, cfg)
    payable = sum(bc.get(b["key"], 0) for b in cfg["buckets"] if b["payable"])
    recorded = {b["name"]: b for b in facts.get("batteries", [])}
    total_asserts = sum(r.get("assertions", 0) for r in recorded.values())
    probed = {h["name"]: h for h in facts.get("hooks", [])}

    kpis = '<div class="kpis">' + "".join([
        R.kpi("Skills", str(len(skills)),
              f"{sum(s['dispatch_chars'] for s in skills):,} dispatch chars"),
        R.kpi("Rules catalogued", str(len(rules)) if rules else "—",
              "in the enforcement ledger"),
        R.kpi("Payable", str(payable) if rules else "—",
              "hardenable + broken claims", alert=bool(rules) and payable > 0),
        R.kpi("Assertions", str(total_asserts) if total_asserts else "—",
              f"across {len(batteries)} batteries"),
    ]) + "</div>"

    body = []

    # ── 1. NEEDS ATTENTION ────────────────────────────────────────────────
    # The answer to "is there another table that tells us this?" — there was
    # not. Every station computed its own improvable number and none of them
    # met on one surface, so the overview showed one quarter of the picture.
    sev = Counter(r.get("severity", "") for r in rules
                  if r.get("bucket") == "BROKEN_CLAIM")
    deep = sum(1 for r in rules if r.get("bucket") == "PROMPT_ONLY"
               and r.get("carrier_depth") == "reference-spec")
    uncovered = facts.get("uncovered", [])
    drifted = [c for c in contracts if c["status"] == "DRIFTED"]
    unprobeable = [c for c in contracts if c["status"] in ("UNPROBEABLE", "UNPROBED")]
    no_loader = [s for s in structs if s["kind"] == "JSON Schema" and not s["referenced"]]
    big_fns = [f for f in fns if f["lines"] > 100]
    undoc = [f for f in fns if f["lang"] == "python" and not f["private"] and not f["doc"]]
    owed = [c for c in cards if not c["done"] and c["state"] == "owed_to_you"]
    budget = [c for c in cards if c["track"] == "budget"]
    cant_block = [h for h in hooks
                  if probed.get(h["name"], {}).get("verdict") != "BLOCKS"]
    red = [n for n, r in recorded.items() if r.get("status") == "RED"]

    # (count, what it is, why it matters, href, severity-class)
    attention = [
        (bc.get("BROKEN_CLAIM", 0), "Broken claims",
         f"Enforcement asserted that does not exist — {sev.get('critical', 0)} critical, "
         f"{sev.get('high', 0)} high. These actively mislead.",
         "enforcement.html?bucket=BROKEN_CLAIM#sec-broken_claim", "bad"),
        (bc.get("HARDENABLE", 0), "Hardenable rules",
         "Could be checked mechanically and are not. Each names the concrete "
         "check that would close it.",
         "enforcement.html?bucket=HARDENABLE#sec-hardenable", "warn"),
        (len(uncovered), "Gates with no battery",
         "Checkers with nothing proving they can fail — led by suite-doctor, "
         "the gate that enforces the fixture rule on everything else.",
         "testing.html#sec-uncovered", "bad"),
        (len(owed), "Moves owed to you",
         "Only a human can clear these — a push, an approval, a ruling.",
         "board.html", "warn"),
        (deep, "Prompt-only rules buried in a deep spec",
         "The carrier is a references/ file the model may never load at the "
         "moment the rule must fire.",
         "enforcement.html?bucket=PROMPT_ONLY#sec-prompt_only", "warn"),
        (len(big_fns), "Functions over 100 lines",
         "The 800-line budget is a FILE budget; nothing measures function size.",
         "functions.html#sec-big", "warn"),
        (len(budget), "Files past the 800-line budget",
         "Report-never-gate — the number is stated, nothing is blocked.",
         "board.html", "warn"),
        (len(cant_block), "Hooks that cannot block",
         "Of six shipped hooks, only one returns a non-zero exit the harness "
         "acts on — and it fires after the write has landed.",
         "hooks.html", "warn"),
        (len(drifted), "Drifted string contracts",
         "Declared byte-identical and measured otherwise. The skip code has "
         "five renderings, two of them not enum members at all.",
         "formats.html#sec-contracts", "bad"),
        (len(no_loader), "Schemas with no loader",
         "A *.schema.json nothing in the repo loads — a schema in name only.",
         "structures.html#sec-schemas", "warn"),
        (len(unprobeable), "Contracts a diff cannot judge",
         "Reported UNPROBEABLE rather than scored, because an unverifiable "
         "claim gets labelled, not counted.",
         "formats.html#sec-contracts", "mut"),
        (len(undoc), "Public functions with no docstring",
         "Python, non-underscore, no docstring.",
         "functions.html#sec-all", "mut"),
        (len(red), "Batteries red",
         "A failing battery drives suite-doctor to a non-zero exit.",
         "testing.html#sec-batteries", "bad"),
    ]
    live = [a for a in attention if a[0]]

    body.append(R.sechead(
        str(sum(a[0] for a in live)), "Needs attention", "#b63a3a", IC["alert"],
        sub="Every improvable number this center knows about, on one surface, each "
            "linking to the rows behind it. Before this table the counts lived one "
            "per station and never met — the overview showed a quarter of the "
            "picture. Ordered by how much it misleads if left alone.",
        id_="sec-attention", sec_id="overview-attention", open_=True))
    body.append(R.table(
        ["", "What", "Why it matters", ""],
        [[f'<a href="{h}" class="chip {cls}" '
          f'style="font-size:.95rem;padding:4px 12px;text-decoration:none">{n}</a>',
          f'<a href="{h}" style="font-weight:650">{E(what)}</a>',
          E(why),
          f'<a href="{h}" class="chip mut" style="text-decoration:none">open →</a>']
         for n, what, why, h, cls in live],
        widths=["68px", "1fr", "2.1fr", "84px"]))

    # ── 2. THE ACCOUNTABILITY SPLIT (promoted above everything else) ──────
    if rules:
        body.append(R.sechead(
            str(len(cfg["buckets"])), "The accountability split", "#7a5a8a",
            IC["message"],
            sub="Every rule the suite asserts lands in exactly one bucket. The two "
                "payable buckets are work someone can do; prompt-only rules are not "
                "failures, but they owe a disclosure carrier that puts them in front "
                "of the model at the moment they must fire. Every row opens the "
                "ledger filtered to that bucket.",
            id_="sec-split", sec_id="overview-split", open_=True))
        body.append(R.table(
            ["Bucket", "Count", "Share", "Meaning", ""],
            [[f'<a href="enforcement.html?bucket={b["key"]}#sec-{b["key"].lower()}" '
              f'class="chip {BUCKET_CHIP[b["key"]]}" style="text-decoration:none">'
              f'{E(b["label"])}</a>',
              f'<a href="enforcement.html?bucket={b["key"]}#sec-{b["key"].lower()}" '
              f'style="font-weight:650">{bc.get(b["key"], 0)}</a>',
              R.meter(bc.get(b["key"], 0), len(rules), "of all rules"),
              E(b["blurb"]),
              f'<a href="enforcement.html?bucket={b["key"]}#sec-{b["key"].lower()}" '
              f'class="chip mut" style="text-decoration:none">open →</a>']
             for b in sorted(cfg["buckets"],
                             key=lambda x: BUCKET_STYLE[x["key"]][2])],
            widths=["150px", "62px", "180px", "1fr", "84px"]))

    # ── 3. state of the build ─────────────────────────────────────────────
    dirty = counts.get("dirty", [])
    if dirty:
        body.append(R.sechead(
            str(len(dirty)), "Built over a dirty tree", "#d97a3d", IC["alert"],
            sub="This center reports on the working tree, and these files are not "
                "committed. Anything derived from them is provisional.",
            id_="sec-dirty", sec_id="overview-dirty"))
        body.append(R.table(["Uncommitted path"], [[f"<code>{E(p)}</code>"]
                                                   for p in sorted(dirty)]))

    body.append(R.sechead(
        str(len([l for l in cfg["lenses"] if l["spike"] == 1])),
        "The estate", "#1f3a6b", IC["shield"],
        sub="What this center can answer today. The suite is not an application — "
            "there are no endpoints, models or coverage here. The spine is the "
            "lifecycle beat, and every lens filters by it.",
        id_="sec-estate", sec_id="overview-estate"))
    body.append(R.table(
        ["Lens", "Status", "What it answers"],
        [[(f'<a href="{l["page"]}"><b>{E(l["label"])}</b></a>' if l["spike"] == 1
           else f'<b>{E(l["label"])}</b>'),
          ('<span class="chip ok">built</span>' if l["spike"] == 1
           else f'<span class="chip mut">spike {l["spike"]}</span>'),
          E(l["blurb"])] for l in cfg["lenses"]]))

    body.append(R.sechead(
        str(len(cfg["beats"])), "The spine", "#3a6b3a", IC["code"],
        sub="Nine lifecycle beats, the satellite group, and two non-beat homes so "
            "cross-cutting contracts and the suite's own upkeep rules are not forced "
            "into a beat they do not belong to. Each rule count opens the ledger "
            "filtered to that beat.",
        id_="sec-spine", sec_id="overview-spine"))
    by_beat = D.by_beat(rules, cfg) if rules else {}
    body.append(R.table(
        ["Beat", "Kind", "Skills", "Rules"],
        [[f'<b>{E(b["label"])}</b>',
          f'<span class="chip mut">{E(b["kind"])}</span>',
          E(", ".join(b.get("skills", [])) or "—"),
          (f'<a href="enforcement.html?beat={b["slug"]}">'
           f'{len(by_beat.get(b["slug"], []))}</a>'
           if rules and by_beat.get(b["slug"]) else
           (str(len(by_beat.get(b["slug"], []))) if rules else "—"))]
         for b in cfg["beats"]]))

    return kpis, "".join(body)


# ------------------------------------------------------------------ main


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=None,
                    help="output dir (default: paths.center from the config)")
    args = ap.parse_args()

    cfg = D.load_config()
    out = Path(args.out) if args.out else (REPO_ROOT / cfg["paths"]["center"])
    out.mkdir(parents=True, exist_ok=True)

    if not (SHELL_SRC / "architecture.html").is_file():
        raise SystemExit(
            f"BREAK: vendored shell missing at "
            f"{SHELL_SRC.relative_to(REPO_ROOT)} — refusing to build a center "
            f"with no chrome. Nothing was written.")

    skills = D.load_skills(cfg)
    hooks = D.scan_hooks(cfg)
    batteries = D.scan_batteries(cfg)
    rules, rule_prov = D.load_enforcement(cfg)
    facts, fact_prov = D.load_facts(cfg)

    # Spike-2 lenses — all derived, nothing authored.
    surf = SUR.agent_surface(skills, REPO_ROOT)
    fns = SUR.functions(REPO_ROOT)
    structs = SUR.structures(REPO_ROOT, rules)
    contracts = FMT.probe(REPO_ROOT)
    enums = FMT.enum_variants(REPO_ROOT)
    cards, card_labels = BRD.build(REPO_ROOT)
    card_sources = BRD.source_table(REPO_ROOT)

    dirty = D.working_tree_dirty()
    pills = ""
    if dirty:
        pills = (f'<span class="chip warn">{len(dirty)} uncommitted</span>')
    counts = {
        "head": D.head_sha(),
        "stamp": D.regen_stamp(),
        "dirty": dirty,
        "pills": pills,
        "enforcement": len(rules) or None,
        "hooks": len(hooks) or None,
        "testing": len(batteries) or None,
        "agents": len(skills) or None,
        "formats": len(contracts) or None,
        "functions": len(fns) or None,
        "structures": len(structs) or None,
        "board": sum(1 for c in cards if not c["done"]) or None,
    }

    # ONE nav model for every page, and the same model handed to the docsite
    # builder through nav.json — the seam that keeps two builders on one sidebar
    # without either importing the other.
    counts["_nav"] = nav_model(cfg, counts)
    # The inbound edges the docsite extracted on its last run. First build of a
    # fresh clone has none, and renders none.
    cfg["_backlinks"] = load_backlinks(out)

    pages: dict[str, str] = {}

    board_fills = render_board(cfg, cards, card_labels, card_sources)
    pages["board.html"] = page(
        cfg, "board.html", "Board", "", "", "", counts,
        skel_name="board.html", extra=board_fills)

    k, b = render_index(cfg, rules, hooks, batteries, skills, facts, counts,
                        contracts, structs, fns, cards)
    pages["index.html"] = page(
        cfg, "index.html", "Suite command center",
        "The Gabe Suite read as its own subject: what it enforces, what it only "
        "claims to enforce, and what it can only ever ask a model to honour. "
        "Derived from the repo on every build; the rule classification is authored "
        "judgment and says so.",
        k, b, counts, crumb="<b>Overview</b>")

    k, b = render_enforcement(cfg, rules, rule_prov)
    pages["enforcement.html"] = page(
        cfg, "enforcement.html", "Enforcement ledger",
        "Every rule the suite asserts, in one of four buckets: enforced, hardenable, "
        "prompt-only, or falsely claimed. The two payable buckets are the backlog.",
        k, b, counts)

    k, b = render_hooks(cfg, hooks, facts, fact_prov)
    pages["hooks.html"] = page(
        cfg, "hooks.html", "Hooks",
        "The six shipped hooks with their real slot, matcher and observed exit "
        "behaviour — set against what each script claims about itself.",
        k, b, counts)

    k, b = render_testing(cfg, batteries, facts, fact_prov)
    pages["testing.html"] = page(
        cfg, "testing.html", "Testing",
        "The fixture batteries that give every other gate its teeth — and the gates "
        "that have no battery at all.",
        k, b, counts)

    k, b = render_agents(cfg, skills, surf)
    pages["agents.html"] = page(
        cfg, "agents.html", "Agents",
        "Every shipped skill and how it runs: which fork into their own context, "
        "which are read-only, and which only a human may start.",
        k, b, counts)

    k, b = render_formats(cfg, contracts, enums)
    pages["formats.html"] = page(
        cfg, "formats.html", "Format methods",
        "The literal output-string contracts the suite declares must stay "
        "byte-identical across skills — measured, not assumed.",
        k, b, counts)

    k, b = render_functions(cfg, fns)
    pages["functions.html"] = page(
        cfg, "functions.html", "Functions",
        "Every function the suite's own scripts define, across python, shell and mjs.",
        k, b, counts)

    k, b = render_structures(cfg, structs)
    pages["structures.html"] = page(
        cfg, "structures.html", "Data structures",
        "Every artifact shape the lifecycle reads or writes, and what — if anything — "
        "stands behind it.",
        k, b, counts)

    # docs.html is NOT written here. Both builders once emitted it — this one a
    # machine table, the docsite a rendered hub.md — and the second run silently
    # overwrote the first. The page belongs to the builder that owns its sources,
    # so the docsite renders it (prose + the same table, from its own config) and
    # this build contributes only the nav entry.

    for name, html_text in pages.items():
        (out / name).write_text(html_text)

    # The seam file. Written LAST so it describes the nav the pages actually
    # wear, and read by build_docsite.py to render doc pages into this shell.
    nav_path = out / "nav.json"
    nav_path.write_text(json.dumps({
        "generator": GENERATOR_NAME,
        "head": counts.get("head", ""),
        "project": cfg["project"]["display_name"],
        "groups": counts["_nav"],
    }, indent=1) + "\n", encoding="utf-8")

    assets_src = SHELL_SRC / "assets"
    assets_dst = out / "assets"
    assets_dst.mkdir(parents=True, exist_ok=True)
    copied = 0
    for a in sorted(assets_src.iterdir()):
        if a.is_file():
            shutil.copy2(a, assets_dst / a.name)
            copied += 1

    print(f"suite center: {len(pages)} pages + {copied} assets -> "
          f"{out.relative_to(REPO_ROOT)}")
    print(f"  skills {len(skills)} · hooks {len(hooks)} · batteries {len(batteries)} "
          f"· rules {len(rules)}")
    drifted = [c["key"] for c in contracts if c["status"] == "DRIFTED"]
    _open = sum(1 for c in cards if not c["done"])
    print(f"  board {_open} open + {len(cards) - _open} done across "
          f"{len(BRD.SUITE_TRACK_ORDER)} tracks")
    print(f"  functions {len(fns)} · structures {len(structs)} · "
          f"format contracts {len(contracts)} "
          f"({len(drifted)} DRIFTED{': ' + ', '.join(drifted) if drifted else ''})")
    if not rules:
        print(f"  GAP: no rule registry — {rule_prov}")
    if not facts:
        print(f"  GAP: no recorded facts — {fact_prov}")
    if dirty:
        print(f"  NOTE: built over {len(dirty)} uncommitted path(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
