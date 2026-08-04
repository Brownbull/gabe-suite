#!/usr/bin/env python3
"""gabe-imagine · the DISK target builder — authored floors become center pages.

Why this is not part of build_docsite.py: that builder owns markdown→HTML, and a
floor is not markdown. Trying to express a machine with a named payload, a state,
a number and an inspector in markdown produces either a table (which is what the
prism exists to beat) or a wall of inline HTML inside a .md file, which is the
worst of both. So a prism's body is AUTHORED HTML, and this builder places it.

Why it is not part of build_suite_center.py either: that builder derives every
page from machine facts. A prism is the opposite — an authored argument about a
system, whose only machine-checked property is that its claims are well-formed
(verify-prism.mjs). Two different provenances, two different builders.

INPUTS
  docs/prisms/<slug>/prism.json   the page's frontmatter (title, mode, lede, …)
  docs/prisms/<slug>/body.html    the authored floor + prose
  docs/prisms/_fragments/<x>.html an embeddable component, optional JSON header
  docs/site/center/nav.json       the sidebar model the center build emits

OUTPUTS
  docs/site/center/prism-<slug>.html    one page per prism
  docs/site/center/explanations.html    the index
  docs/site/center/prism-fragments.json the seam: build_docsite.py resolves
                                        {{PRISM:<slug>}} from this manifest

STRUCTURE THIS BUILDER ADDS (and the author therefore never types):
  every  <div class="pf" data-prism>  is wrapped in  .pfwrap > .pfsize > .pffit
  so that a drawing too wide for the viewport scrolls INSIDE ITS OWN BOX. With
  JS off the wrapper's overflow-x still holds; with JS on, prism-fx.js scales to
  fit first and only scrolls once scaling would breach the 12px legibility floor.
"""

from __future__ import annotations

import argparse
import html as _html
import json
import re
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[2]

sys.path.insert(0, str(REPO_ROOT / "skills" / "gabe-docsite" / "generator"))
sys.path.insert(0, str(REPO_ROOT / "docs" / "center" / "generators"))
import _center_shell as CS      # noqa: E402  — the ONE sidebar renderer
import _suite_data as D        # noqa: E402  — the ONE stamp source

E = _html.escape
GENERATOR_NAME = "build_prisms.py"
MODES = ("console", "article", "index")

# --------------------------------------------------------------------------- #
# Reading what was authored
# --------------------------------------------------------------------------- #


def load_pages(prisms_dir: Path) -> list[dict[str, Any]]:
    """Every <slug>/prism.json + body.html pair, in declared order.

    A directory missing either file is reported and skipped rather than
    half-rendered: a page with no body is a nav entry that leads nowhere, which
    is worse than an absent page.
    """
    pages: list[dict[str, Any]] = []
    if not prisms_dir.is_dir():
        return pages
    for d in sorted(prisms_dir.iterdir()):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        meta_path, body_path = d / "prism.json", d / "body.html"
        if not meta_path.is_file() or not body_path.is_file():
            print(f"  [prism] {d.name}: missing prism.json or body.html — skipped")
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        mode = meta.get("mode", "console")
        if mode not in MODES:
            print(f"  [prism] {d.name}: mode {mode!r} is not one of {MODES} — skipped")
            continue
        body = body_path.read_text(encoding="utf-8")
        meta.update({
            "slug": d.name,
            "mode": mode,
            "body": body,
            "embeds": "{{PRISM:" in body,
            "src": f"docs/prisms/{d.name}/body.html",
        })
        pages.append(meta)
    pages.sort(key=lambda p: (p.get("order", 999), p["slug"]))
    return pages


_FRAG_HEAD = re.compile(r"^\s*<!--\s*prism\s*(\{.*?\})\s*-->", re.S)


def load_fragments(frag_dir: Path) -> dict[str, dict[str, str]]:
    """The embeddable components, keyed by slug.

    A fragment NEVER gets a nav entry — a fragment with its own nav item is a
    page, and should be one. It exists only to be included by slug.
    """
    out: dict[str, dict[str, str]] = {}
    if not frag_dir.is_dir():
        return out
    for f in sorted(frag_dir.glob("*.html")):
        raw = f.read_text(encoding="utf-8")
        meta: dict[str, Any] = {}
        m = _FRAG_HEAD.match(raw)
        if m:
            meta = json.loads(m.group(1))
            raw = raw[m.end():]
        out[f.stem] = {
            "title": meta.get("title", f.stem),
            "note": meta.get("note", ""),
            "body": raw.strip(),
        }
    return out


# --------------------------------------------------------------------------- #
# The structural transform
# --------------------------------------------------------------------------- #

_DIV = re.compile(r"<(/?)div\b([^>]*?)(/?)>", re.I)
_CLASS = re.compile(r'class\s*=\s*"([^"]*)"', re.I)


def _floor_spans(html: str) -> list[tuple[int, int]]:
    """Character spans of every `<div class="pf" data-prism>…</div>`.

    Depth-counted rather than regex-matched to the close tag, because a floor
    contains dozens of nested divs and a lazy `.*?</div>` would close on the
    first machine card.
    """
    spans: list[tuple[int, int]] = []
    for m in _DIV.finditer(html):
        if m.group(1):
            continue
        attrs = m.group(2)
        if "data-prism" not in attrs:
            continue
        cls = _CLASS.search(attrs)
        if not cls or "pf" not in cls.group(1).split():
            continue
        depth = 0
        for t in _DIV.finditer(html, m.start()):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                spans.append((m.start(), t.end()))
                break
    # Drop any span nested inside an earlier one — one fit box per floor.
    kept: list[tuple[int, int]] = []
    for s in spans:
        if not any(o[0] < s[0] and s[1] <= o[1] for o in spans):
            kept.append(s)
    return kept


def wrap_floors(body: str, slug: str) -> tuple[str, int]:
    """Wrap each floor in its fit box and give it an addressable `data-fx`.

    The `data-fx` slug is what window.FXREPLAY registers under and what
    verify-motion.mjs fingerprints. Auto-assigned when absent so that no floor
    is unreachable by the motion gate simply because the author forgot.
    """
    spans = _floor_spans(body)
    for i, (a, b) in enumerate(reversed(spans)):
        n = len(spans) - 1 - i
        chunk = body[a:b]
        if "data-fx=" not in chunk.split(">", 1)[0]:
            fx = slug if len(spans) == 1 else f"{slug}-{n + 1}"
            chunk = chunk.replace("<div", f'<div data-fx="{fx}"', 1)
        body = (body[:a]
                + '<div class="pfwrap"><div class="pfsize"><div class="pffit">'
                + chunk
                + "</div></div></div>"
                + body[b:])
    return body, len(spans)


_TOKEN = re.compile(r"\{\{PRISM:([a-z0-9][a-z0-9-]*)\}\}")


def render_fragment(slug: str, frag: dict[str, str]) -> str:
    note = (f'<span class="pxnote">{E(frag["note"])}</span>' if frag["note"] else "")
    body, _ = wrap_floors(frag["body"], f"frag-{slug}")
    return (f'<div class="pxfrag px-{E(slug)}" data-prism-fragment="{E(slug)}">'
            f'<div class="pxhead"><span class="pxtitle">{E(frag["title"])}</span>{note}</div>'
            f'<div class="pxbody">{body}</div></div>')


def expand_tokens(html: str, fragments: dict[str, dict[str, str]]) -> str:
    """Replace {{PRISM:<slug>}} with the rendered fragment.

    An unknown slug is left as the raw token ON PURPOSE: check_suite_center.py
    fails the build on any unfilled {{TOKEN}}, so a typo stops the chain instead
    of shipping a page with a silently missing component.
    """
    def sub(m: re.Match[str]) -> str:
        frag = fragments.get(m.group(1))
        return render_fragment(m.group(1), frag) if frag else m.group(0)
    # A token alone in a markdown paragraph arrives wrapped; unwrap so the
    # component is not nested inside a <p>, which no browser allows for a div.
    html = re.sub(r"<p>\s*(\{\{PRISM:[a-z0-9-]+\}\})\s*</p>", r"\1", html)
    return _TOKEN.sub(sub, html)


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #


def fill(skeleton: str, **slots: str) -> str:
    out = skeleton
    for token, value in slots.items():
        out = out.replace("{{%s}}" % token, value)
    return out


def render_page(skeleton: str, nav: dict, page: dict, project: str, lang: str,
                stamp: str, pills: str, fragments: dict) -> str:
    body, floors = wrap_floors(page["body"], page["slug"])
    body = expand_tokens(body, fragments)
    handle = (f'<p class="prismhandle"><span class="phlab">'
              f'<svg viewBox="0 0 24 24" aria-hidden="true">'
              f'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
              f'the handle</span>{page["handle"]}</p>'
              if page.get("handle") else "")
    # An empty kicker renders NOTHING — a page whose body opens with a seat
    # row carries its addressing there, and an empty .kicker div is one more
    # unexplained format in an already-crowded head.
    kicker = page.get("kicker", "")
    kicker_html = f'<div class="kicker">{E(kicker)}</div>' if kicker else ""
    nav_html = CS.render_sidebar(
        nav, f"prism-{page['slug']}.html", project, stamp,
        nav.get("head", ""), nav.get("generator", GENERATOR_NAME))
    crumb = ('<a href="index.html">Overview</a> › '
             '<a href="explanations.html">Explanations</a> › '
             f'<b>{E(page["title"])}</b>')
    source = (f'source: {page["src"]} — authored HTML is the source of truth; '
              f'this page is generated by {GENERATOR_NAME} and is never hand-edited. '
              f'{floors} floor(s). ' + E(page.get("source", "")))
    return fill(
        skeleton,
        LANG=E(lang), PROJECT_NAME=E(project), SIDEBAR=nav_html,
        PRISM_CRUMB=crumb, STATUS_PILLS=pills, SYNC_AGE=E(stamp),
        PRISM_TITLE=E(page["title"]), PRISM_KICKER=kicker_html,
        PRISM_LEDE=page.get("lede", ""), PRISM_HANDLE=handle,
        PRISM_MODE=E(page["mode"]), PRISM_BODY=body,
        PRISM_SOURCE=source, PRISM_SCRIPTS="",
    )


def render_index(skeleton: str, nav: dict, pages: list[dict], fragments: dict,
                 project: str, lang: str, stamp: str, pills: str) -> str:
    cards = []
    for p in pages:
        # A fragment-composed page's defining fact is the composition, not the
        # motion base its fragments happen to share — the chip says so, matching
        # the component icon the nav already gives it.
        shape = "components" if p.get("embeds") else p["mode"]
        tags = [shape, p.get("pattern", ""), p.get("kind", "")]
        chips = "".join(f'<span class="pxtag">{E(t)}</span>' for t in tags if t)
        cards.append(
            f'<a class="pxcard" href="prism-{E(p["slug"])}.html">'
            f'<div class="pxk">{E(p.get("kicker", ""))}</div>'
            f'<h3>{E(p["title"])}</h3><p>{E(p.get("card", p.get("lede", "")))}</p>'
            f'<div class="pxmeta">{chips}</div></a>')
    # Braces as entities: the page SHOWS the token, so it must not BE one —
    # check_suite_center.py sweeps for unresolved {{PRISM:…}} unconditionally.
    frag_rows = "".join(
        f"<li><code>&#123;&#123;PRISM:{E(s)}&#125;&#125;</code> — {E(f['title'])}"
        + (f" · {E(f['note'])}" if f["note"] else "") + "</li>"
        for s, f in sorted(fragments.items()))
    body = (
        '<div class="prismprose">'
        "<p>Each page below explains one system as a working floor: the payload "
        "moves, every machine states what it consumes and what it produces, and "
        "any cell opens to the detail that did not fit in it. Two page kinds — a "
        "<strong>console</strong> runs on one screen and hands you the scrub bar; "
        "an <strong>article</strong> assembles itself as you scroll and may end on "
        "a console of the thing it was building toward.</p></div>"
        f'<div class="pxindex">{"".join(cards)}</div>'
    )
    if frag_rows:
        body += ('<div class="prismprose"><h2>Embeddable components</h2>'
                 "<p>These are fragments, not pages: they carry no nav entry and "
                 "are included by slug into any doc page in this center. Each one "
                 "autoplays and carries its own controls.</p>"
                 f"<ul>{frag_rows}</ul></div>")
    nav_html = CS.render_sidebar(
        nav, "explanations.html", project, stamp,
        nav.get("head", ""), nav.get("generator", GENERATOR_NAME))
    return fill(
        skeleton,
        LANG=E(lang), PROJECT_NAME=E(project), SIDEBAR=nav_html,
        PRISM_CRUMB='<a href="index.html">Overview</a> › <b>Explanations</b>',
        STATUS_PILLS=pills, SYNC_AGE=E(stamp),
        PRISM_TITLE="Explanations", PRISM_KICKER="prism · rendered systems",
        PRISM_LEDE=("Systems drawn as production floors — one page per subject, "
                    "plus the components those pages lend to the rest of the center."),
        PRISM_HANDLE="", PRISM_MODE="index", PRISM_BODY=body,
        PRISM_SOURCE=f"generated by {GENERATOR_NAME} from docs/prisms/.",
        PRISM_SCRIPTS="",
    )


# --------------------------------------------------------------------------- #


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog=GENERATOR_NAME, description=__doc__)
    ap.add_argument("--config", type=Path,
                    default=REPO_ROOT / "docs/center/suite-center.config.json")
    ap.add_argument("--shell", type=Path, default=None,
                    help="the center's shell dir (must contain prismpage.html)")
    ap.add_argument("--nav", type=Path, default=None,
                    help="nav.json emitted by the center build")
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args(argv)

    cfg = json.loads(args.config.read_text(encoding="utf-8"))
    paths = cfg.get("paths", {})
    shell = args.shell or (REPO_ROOT / paths.get("shell", "docs/center/shell"))
    out = args.out or (REPO_ROOT / paths.get("center", "docs/site/center"))
    prisms_dir = REPO_ROOT / paths.get("prisms", "docs/prisms")
    nav_path = args.nav or (out / "nav.json")

    skeleton_path = shell / "prismpage.html"
    if not skeleton_path.is_file():
        print(f"ERROR: no prismpage.html in {shell}")
        return 1
    nav = CS.load_nav(nav_path)
    if not nav:
        # E6: a missing anchor STOPS. Rendering with no sidebar would produce a
        # page that looks finished and navigates nowhere.
        print(f"ERROR: nav.json missing or empty at {nav_path} — "
              "run build_suite_center.py first.")
        return 1

    skeleton = re.sub(r"<!--(?!\[if).*?-->", "", skeleton_path.read_text(encoding="utf-8"),
                      flags=re.S)
    pages = load_pages(prisms_dir)
    fragments = load_fragments(prisms_dir / "_fragments")

    project = cfg["project"]["display_name"]
    lang = cfg["project"].get("lang", "en")
    stamp = D.regen_stamp()
    dirty = D.working_tree_dirty()
    pills = f'<span class="chip warn">{len(dirty)} uncommitted</span>' if dirty else ""

    out.mkdir(parents=True, exist_ok=True)
    for p in pages:
        html = render_page(skeleton, nav, p, project, lang, stamp, pills, fragments)
        (out / f"prism-{p['slug']}.html").write_text(html, encoding="utf-8")
    (out / "explanations.html").write_text(
        render_index(skeleton, nav, pages, fragments, project, lang, stamp, pills),
        encoding="utf-8")

    # The seam. Written for build_docsite.py, which resolves {{PRISM:<slug>}} in
    # markdown the same way it reads nav.json for the sidebar: one producer, one
    # consumer, one file, no import.
    manifest = {
        "generator": GENERATOR_NAME,
        "head": nav.get("head", ""),
        "fragments": {s: {"title": f["title"], "note": f["note"],
                          "html": render_fragment(s, f)}
                      for s, f in fragments.items()},
    }
    (out / "prism-fragments.json").write_text(
        json.dumps(manifest, indent=1) + "\n", encoding="utf-8")

    print(f"prisms: {len(pages)} page(s) + index + {len(fragments)} fragment(s) -> "
          f"{out.relative_to(REPO_ROOT)}")
    for p in pages:
        print(f"  · prism-{p['slug']}.html  [{p['mode']}]  {p.get('pattern', '')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
