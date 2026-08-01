#!/usr/bin/env python3
"""gabe-docsite — generic static-docs-site generator (stdlib only, no deps).

Reads a per-project CONFIG module (see docsite.config.example.py for the
schema), renders every SECTIONS doc's markdown into ``<out_dir>/<slug>.html``
wrapped in the shared shell (topbar + sidebar + masthead), emits
``<out_dir>/index.html`` as a hub of cards, and copies
``skills/gabe-docsite/assets/{site.css,site.js,mermaid.min.js}`` into
``<out_dir>/assets/``.

Contract
--------
* The markdown under the config's ``src_dir`` is the SOURCE OF TRUTH.
* The HTML under ``out_dir`` is a GENERATED publish target — never hand-edit.
* Re-running regenerates every page idempotently.
* Nothing project-specific lives in this file — every string, path, and
  section comes from the config the caller points at.

Run::

    python3 build_docsite.py --config path/to/docsite.config.py

No third-party dependencies.
"""

from __future__ import annotations

import argparse
import base64
import datetime as _dt
import json
import hashlib
import re
import subprocess
import importlib.util
import os
import shutil
import sys
from html import escape, unescape
from pathlib import Path
from typing import Any

GENERATOR_DIR = Path(__file__).resolve().parent
ASSETS_SRC_DIR = GENERATOR_DIR.parent / "assets"
ASSET_FILES = ("site.css", "site.js", "mermaid.min.js")

sys.path.insert(0, str(GENERATOR_DIR))

from _markdown import (  # noqa: E402
    RenderContext,
    markdown_to_html,
    render_inline,
    split_lede,
    strip_leading_h1,
)
from _shell import (  # noqa: E402
    MERMAID_THEME_VARS, document, masthead, render_hub_sections,
)
import _center_shell as CS  # noqa: E402
import _references as REF  # noqa: E402



# --------------------------------------------------------------------------- #
# Diagrams — two paths, and the build says which one it took
#
# Operator ruling 2026-07-31: pre-render when the toolchain is there, fall back
# to the vendored runtime loader when it is not. The obligation that comes with
# it: a page must never be ambiguous about which path produced it, because a
# failed pre-render that silently degrades to a <pre> block looks exactly like a
# success. So the build reports per page, and diagram-compliance.mjs re-derives
# the same fact from the rendered DOM instead of trusting this report.
# --------------------------------------------------------------------------- #

_MERMAID_INIT = (
    '{startOnLoad: true, theme: "base", themeVariables: {%s}, '
    'flowchart: {curve: "basis", htmlLabels: true, useMaxWidth: true}}'
) % ", ".join('%s: "%s"' % (k, v) for k, v in MERMAID_THEME_VARS.items())

# The converter emits `<figure class="mermaid-fig"><pre class="mermaid">SRC</pre></figure>`.
# Match the WHOLE figure: replacing only the inner <pre> would leave a figure
# wrapping a figure, and the compliance gate would then see two diagrams where
# the author wrote one.
_MERMAID_BLOCK = re.compile(
    r'<figure class="mermaid-fig"><pre class="mermaid">(?P<code>.*?)</pre></figure>', re.S)


def find_renderer(config: dict[str, Any]) -> Path | None:
    """The build-time Mermaid renderer — found AND proven, or not used.

    Looked up by convention, never required: a generic skill must not acquire a
    Playwright dependency. "Available" has to mean it works, not that the file
    exists: the first run of this found the renderer, called it eleven times,
    got ERR_MODULE_NOT_FOUND every time and failed the build. A renderer that
    cannot render is the runtime path with extra steps, so it is probed once on
    a trivial graph before any page is committed to it.
    """
    root = config["_out_dir"]
    found = None
    for _ in range(4):                       # walk up to the repo root
        for rel in ("scripts/_render_mermaid.mjs",
                    "docs/center/generators/_render_mermaid.mjs",
                    "templates/center/generators/_render_mermaid.mjs"):
            cand = root / rel
            if cand.is_file():
                found = cand.resolve()
                break
        if found:
            break
        root = root.parent
    if found is None:
        return None

    probe = base64.b64encode(b"graph TD;A-->B;").decode("ascii")
    try:
        proc = subprocess.run(["node", str(found), probe],
                              cwd=str(config["_out_dir"].parent.parent),
                              capture_output=True, text=True, timeout=90)
    except Exception as exc:                                # noqa: BLE001
        print("  [mermaid] probe could not run (%s)" % exc)
        return None
    if proc.returncode == 0 and proc.stdout.strip().startswith("<svg"):
        return found
    first = (proc.stderr.strip().splitlines() or ["no stderr"])[0]
    print("  [mermaid] %s found but not usable — %s" % (found.name, first[:120]))
    return None


def prerender_diagrams(html_text: str, renderer: Path, cache: Path,
                       repo_root: Path) -> tuple[str, int, int]:
    """Replace every mermaid block with a rendered SVG figure.

    Returns (html, rendered, failed). A block that fails to render is left as a
    labelled fallback and COUNTED — the caller fails the build on a non-zero
    count rather than shipping a page whose diagram is source text.
    """
    rendered = failed = 0

    def one(m: re.Match) -> str:
        nonlocal rendered, failed
        code = unescape(m.group("code"))
        digest = hashlib.sha1(code.encode("utf-8")).hexdigest()[:16]
        cache_file = cache / ("%s.svg" % digest)
        svg = cache_file.read_text(encoding="utf-8") if cache_file.exists() else ""
        if not svg:
            try:
                payload = base64.b64encode(code.encode("utf-8")).decode("ascii")
                proc = subprocess.run(
                    ["node", str(renderer), payload], cwd=str(repo_root),
                    capture_output=True, text=True, timeout=120)
                out = proc.stdout.strip()
                if proc.returncode == 0 and out.startswith("<svg"):
                    svg = out
                    cache.mkdir(parents=True, exist_ok=True)
                    cache_file.write_text(svg, encoding="utf-8")
                else:
                    print("  [mermaid] render failed (%s): %s"
                          % (digest, proc.stderr.strip()[:160]))
            except Exception as exc:                       # noqa: BLE001
                print("  [mermaid] renderer unavailable (%s): %s" % (digest, exc))
        if not svg:
            failed += 1
            return ('<pre class="mermaid-fallback"><code>%s</code></pre>'
                    % escape(code, quote=False))
        rendered += 1
        return '<figure class="mermaid-fig">%s</figure>' % svg

    return _MERMAID_BLOCK.sub(one, html_text), rendered, failed


# --------------------------------------------------------------------------- #
# Config loading
# --------------------------------------------------------------------------- #


def load_config(config_path: Path) -> dict[str, Any]:
    """Import the config module at ``config_path`` and return a dict with
    SITE, SECTIONS, and the resolved absolute src_dir/out_dir/hub_intro_md."""
    spec = importlib.util.spec_from_file_location("docsite_config", config_path)
    if spec is None or spec.loader is None:
        raise SystemExit("ERROR: could not load config at %s" % config_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    site = getattr(module, "SITE", None)
    sections = getattr(module, "SECTIONS", None)
    if site is None or sections is None:
        raise SystemExit("ERROR: config must define SITE and SECTIONS")
    if "src_dir" not in site or "out_dir" not in site:
        raise SystemExit("ERROR: SITE must define 'src_dir' and 'out_dir'")

    config_dir = config_path.resolve().parent
    src_dir = (config_dir / site["src_dir"]).resolve()
    out_dir = (config_dir / site["out_dir"]).resolve()
    hub_intro_md = site.get("hub_intro_md")
    hub_intro_path = (config_dir / hub_intro_md).resolve() if hub_intro_md else None

    return {
        "SITE": site,
        "SECTIONS": sections,
        "_src_dir": src_dir,
        "_out_dir": out_dir,
        "_hub_intro_path": hub_intro_path,
    }


def validate_config(config: dict[str, Any]) -> list[str]:
    """Fail-fast validation. Returns a list of error strings (empty = valid)."""
    errors: list[str] = []
    site = config["SITE"]
    for key in ("title", "brand", "src_dir", "out_dir"):
        if not site.get(key):
            errors.append("SITE.%s is required" % key)

    seen_slugs: set[str] = set()
    for si, section in enumerate(config["SECTIONS"]):
        if "key" not in section or "label" not in section:
            errors.append("SECTIONS[%d] missing 'key' or 'label'" % si)
        for di, doc in enumerate(section.get("docs", [])):
            for field in ("slug", "source_md", "title"):
                if not doc.get(field):
                    errors.append(
                        "SECTIONS[%d].docs[%d] missing required field '%s'" % (si, di, field)
                    )
            slug = doc.get("slug")
            if slug:
                if slug in seen_slugs:
                    errors.append("duplicate slug %r across SECTIONS" % slug)
                seen_slugs.add(slug)
            src = doc.get("source_md")
            if src and not (config["_src_dir"] / src).exists():
                errors.append(
                    "SECTIONS[%d].docs[%d]: source_md %r not found under %s"
                    % (si, di, src, config["_src_dir"])
                )
    return errors


# --------------------------------------------------------------------------- #
# Link + asset resolution — rewrites relative `.md` links between site docs to
# their generated `.html` slug, and copies images a doc references (resolved
# against the doc's own directory) into `<out_dir>/_assets/`. Pages authored
# for the site (already `.html` links, `assets/` icons that live next to the
# output) resolve to no-ops, so this is safe for every existing site.
# --------------------------------------------------------------------------- #


_PRISM_TOKEN = re.compile(r"\{\{PRISM:([a-z0-9][a-z0-9-]*)\}\}")


def load_prisms(path: Path | None) -> dict[str, str]:
    """slug -> rendered fragment HTML, from build_prisms.py's manifest."""
    if not path or not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return {s: f.get("html", "") for s, f in (data.get("fragments") or {}).items()}


def expand_prisms(body_html: str, prisms: dict[str, str]) -> str:
    """Replace {{PRISM:<slug>}} with its component; leave unknown slugs raw.

    The unwrap step matters: markdown turns a token alone on its own line into
    `<p>{{PRISM:<x>}}</p>`, and a <div> inside a <p> is closed by the parser
    before it is opened, which detaches the component from its own scrub bar.
    """
    if not prisms:
        return body_html
    body_html = re.sub(r"<p>\s*(\{\{PRISM:[a-z0-9-]+\}\})\s*</p>", r"\1", body_html)
    return _PRISM_TOKEN.sub(lambda m: prisms.get(m.group(1), m.group(0)), body_html)


def build_link_map(config: dict[str, Any]) -> dict[Path, str]:
    """Absolute source-md path -> output slug, for every doc in every section."""
    src_dir: Path = config["_src_dir"]
    link_map: dict[Path, str] = {}
    for section in config["SECTIONS"]:
        for doc in section.get("docs", []):
            link_map[(src_dir / doc["source_md"]).resolve()] = doc["slug"]
    return link_map


def make_render_context(
    config: dict[str, Any],
    base_dir: Path,
    link_map: dict[Path, str],
    assets: dict[Path, str],
) -> RenderContext:
    """A RenderContext bound to one source file's directory (``base_dir``).

    * link resolver: a relative ``*.md`` (optionally ``#anchor``) href that
      points at another published doc becomes ``<slug>.html[#anchor]``. A
      relative link to any OTHER real on-disk file (an unpublished ``.md``, or
      a sibling artifact like a ``.html`` mockup) is rebased to a path that
      reaches it from ``out_dir``, so it still opens in place. External URLs,
      in-page anchors, absolute ``/`` paths, and dangling links are untouched.
    * asset resolver: a relative image src that resolves to a real file is
      recorded for copying and rewritten to ``_assets/<path-under-src_dir>``;
      unresolvable srcs (e.g. ``assets/icons/*`` that live beside the output,
      absolute ``/`` paths, data/URLs) are left untouched.
    """
    src_dir: Path = config["_src_dir"]
    out_dir: Path = config["_out_dir"]

    def resolve_link(href: str) -> str:
        if not href or href[0] in "#/" or "://" in href or href.startswith("mailto:"):
            return href
        path, sep, frag = href.partition("#")
        if not path:
            return href
        anchor = (sep + frag) if sep else ""
        target = Path(os.path.normpath(base_dir / path))
        if path.endswith(".md"):
            slug = link_map.get(target)
            if slug is not None:
                return "%s.html%s" % (slug, anchor)
        if target.is_file():
            rel = os.path.relpath(target, out_dir).replace(os.sep, "/")
            return "%s%s" % (rel, anchor)
        return href

    def resolve_asset(src: str) -> str:
        if not src or src[0] == "/" or "://" in src or src.startswith("data:"):
            return src
        path = src.partition("#")[0]
        abs_src = Path(os.path.normpath(base_dir / path))
        if not abs_src.is_file():
            return src
        try:
            rel = abs_src.relative_to(src_dir)
            dest_rel = "_assets/%s" % rel.as_posix()
        except ValueError:
            dest_rel = "_assets/_ext/%s" % abs_src.name
        assets[abs_src] = dest_rel
        return dest_rel

    return RenderContext(resolve_link, resolve_asset)


# --------------------------------------------------------------------------- #
# Per-page render
# --------------------------------------------------------------------------- #


def render_doc(
    config: dict[str, Any],
    doc: dict[str, Any],
    link_map: dict[Path, str],
    assets: dict[Path, str],
) -> str:
    src = config["_src_dir"] / doc["source_md"]
    ctx = make_render_context(config, src.resolve().parent, link_map, assets)
    md = src.read_text(encoding="utf-8")
    body_md = strip_leading_h1(md)
    body_html = markdown_to_html(body_md, ctx=ctx)
    site_title = config["SITE"]["title"]

    refs = REF.extract(body_html, config.get("_registries", {}),
                       config.get("_doc_labels", {}))
    config.setdefault("_refpages", []).append(
        (center_slug(doc["slug"]), doc["title"], refs))
    body_html += REF.chips_html(refs)
    # Expanded AFTER extraction on purpose: a component's own links are its
    # chrome, not this document's claims, and letting them into the reference
    # graph would make the same fragment add edges to every page it appears on.
    body_html = expand_prisms(body_html, config.get("_prisms", {}))

    skeleton = config.get("_skeleton")
    if skeleton:
        # CENTER MODE — the chrome belongs to the center; this build owns only
        # what is inside the pane. The page's own slug marks the nav item.
        nav = config["_nav"]
        slug = center_slug(doc["slug"])
        nav_html = CS.render_sidebar(
            nav, f"{slug}.html", nav.get("project", site_title),
            config.get("_stamp", ""), nav.get("head", ""),
            nav.get("generator", "build_suite_center.py"))
        rel = (config["_src_dir"] / doc["source_md"]).relative_to(config["_src_dir"].parent.parent) \
            if config["_src_dir"].is_absolute() else Path(doc["source_md"])
        source_note = ("source: %s — markdown is the source of truth; "
                       "this page is generated and is never hand-edited." % rel.as_posix())
        return CS.document(
            skeleton,
            nav_html=nav_html,
            title=render_inline(doc["title"]),
            kicker=doc.get("kicker", ""),
            lede_html=render_inline(doc.get("summary", "")),
            body_html=body_html,
            source_note=source_note,
            project=nav.get("project", site_title),
            lang=config["SITE"].get("lang", "en"),
            stamp=config.get("_stamp", ""),
            scripts=diagram_scripts(config, md),
        )

    head = masthead(
        doc.get("kicker", ""),
        render_inline(doc["title"]),
        render_inline(doc.get("summary", "")),
    )
    return document(
        config,
        active_slug=doc["slug"],
        title="%s — %s" % (site_title, doc["title"]),
        body_html=head + "\n" + body_html,
        has_diagram="```mermaid" in md,
    )


def center_slug(slug: str) -> str:
    """In center mode the hub takes the Docs station's own filename.

    `index.html` is the center's Overview — the ONE filename the two page sets
    collide on. Routing the hub to docs.html clears it and lands the docs index
    on the nav slot the shell has always carried."""
    return "docs" if slug == "index" else slug


def diagram_scripts(config: dict[str, Any], md: str) -> str:
    """Whatever the diagram path needs at the bottom of the page.

    Pre-rendered pages need nothing; runtime pages need the vendored classic
    mermaid loader. Which path ran is recorded per page in the build report, and
    the compliance gate re-derives it from the DOM rather than trusting either."""
    if "```mermaid" not in md:
        return ""
    if config.get("_prerendered"):
        return ""
    return ('<script src="assets/mermaid.min.js"></script>\n'
            "<script>mermaid.initialize(%s);</script>" % _MERMAID_INIT)


def docs_inventory(config: dict[str, Any]) -> str:
    """Every published page with its source, size and diagram count.

    Derived, never authored: the row exists because the config declares the page
    and the markdown is on disk. A declared page whose source is missing renders
    as a named gap rather than a row that pretends to exist.
    """
    src_dir: Path = config["_src_dir"]
    rows = []
    for section in config["SECTIONS"]:
        rows.append('<tr><th colspan="4" style="padding-top:16px">%s</th></tr>'
                    % escape(section.get("label", ""), quote=False))
        for doc in section.get("docs", []):
            md = src_dir / doc["source_md"]
            label = escape(doc.get("nav_label") or doc["title"], quote=False)
            if not md.is_file():
                rows.append('<tr><td>%s</td><td colspan="3">source missing — '
                            '<code>%s</code> is declared but absent</td></tr>'
                            % (label, escape(doc["source_md"], quote=False)))
                continue
            text = md.read_text(encoding="utf-8", errors="replace")
            rows.append(
                "<tr><td><a href=\"%s.html\">%s</a></td><td><code>%s</code></td>"
                "<td>%d</td><td>%s</td></tr>"
                % (center_slug(doc["slug"]), label, escape(md.name, quote=False),
                   len(text.splitlines()),
                   text.count("```mermaid") or "—"))
    return (
        '<h2>Every page on this site</h2>'
        '<table><thead><tr><th>Page</th><th>Source</th><th>Lines</th>'
        '<th>Diagrams</th></tr></thead><tbody>%s</tbody></table>' % "".join(rows))


def render_hub(
    config: dict[str, Any],
    link_map: dict[Path, str],
    assets: dict[Path, str],
) -> str:
    site = config["SITE"]
    lede_text = ""
    rest_html = ""
    has_diagram = False
    if config["_hub_intro_path"] and config["_hub_intro_path"].exists():
        intro_md = config["_hub_intro_path"].read_text(encoding="utf-8")
        intro_md = strip_leading_h1(intro_md)
        lede_text, rest_md = split_lede(intro_md)
        ctx = make_render_context(config, config["_hub_intro_path"].parent, link_map, assets)
        rest_html = markdown_to_html(rest_md, ctx=ctx)
        has_diagram = "```mermaid" in intro_md

    if config.get("_skeleton"):
        # CENTER MODE — the hub IS the Docs station: hub.md's prose, then the
        # generated inventory of every page it publishes. One page, one owner.
        nav = config["_nav"]
        nav_html = CS.render_sidebar(
            nav, "docs.html", nav.get("project", site["title"]),
            config.get("_stamp", ""), nav.get("head", ""),
            nav.get("generator", "build_suite_center.py"))
        return CS.document(
            config["_skeleton"],
            nav_html=nav_html,
            title=render_inline(site["title"]),
            kicker=site.get("kicker", ""),
            lede_html=render_inline(lede_text),
            body_html=rest_html + docs_inventory(config),
            source_note=("source: docs/src/*.md + docs/docsite.config.py — markdown is the "
                         "source of truth; these pages are generated and never hand-edited."),
            project=nav.get("project", site["title"]),
            lang=site.get("lang", "en"),
            stamp=config.get("_stamp", ""),
            scripts=diagram_scripts(config, intro_md if config["_hub_intro_path"] else ""),
        )

    head = masthead(site.get("kicker", ""), render_inline(site["title"]), render_inline(lede_text))
    # The hub's lede is the FIRST paragraph of hub_intro_md, if present; the
    # rest of hub_intro_md (system diagram, notes) follows, then section cards.
    body_parts = [head]
    if rest_html:
        body_parts.append(rest_html)
    body_parts.append(render_hub_sections(config))

    return document(
        config,
        active_slug="index",
        title="%s — Hub" % site["title"],
        body_html="\n".join(body_parts),
        has_diagram=has_diagram,
    )


# --------------------------------------------------------------------------- #
# Assets
# --------------------------------------------------------------------------- #


def copy_assets(out_dir: Path, center_mode: bool = False) -> list[str]:
    """Ship the standalone site's assets — EXCEPT in center mode.

    The audit's first cut: in center mode the pages wear a3.css and the center's
    own scripts, so shipping site.css/site.js alongside them would put a second
    stylesheet in the same assets/ dir that nothing loads. Only the vendored
    mermaid build still earns its place there, because the runtime diagram path
    needs it.
    """
    assets_out = out_dir / "assets"
    assets_out.mkdir(parents=True, exist_ok=True)
    copied = []
    missing = []
    names = ("mermaid.min.js",) if center_mode else ASSET_FILES
    for name in names:
        src = ASSETS_SRC_DIR / name
        if not src.exists():
            missing.append(name)
            continue
        shutil.copyfile(src, assets_out / name)
        copied.append(name)
    # Optional project assets (e.g. generated icons): a sibling `assets/` dir next to
    # the output dir is merged into <out_dir>/assets/ on every build. Skips the manifest/ledger.
    proj_assets = (out_dir.parent / "assets") if not center_mode else None
    if proj_assets and proj_assets.is_dir() and proj_assets.resolve() != assets_out.resolve():
        for src in proj_assets.rglob("*"):
            if src.is_dir() or src.name in ("manifest.json", "ledger.json"):
                continue
            rel = src.relative_to(proj_assets)
            dst = assets_out / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst)
            copied.append(str(rel))
    if missing:
        raise SystemExit(
            "ERROR: missing vendored asset(s) under %s: %s"
            % (ASSETS_SRC_DIR, ", ".join(missing))
        )
    return copied


# --------------------------------------------------------------------------- #
# Build
# --------------------------------------------------------------------------- #


def build(config: dict[str, Any]) -> int:
    errors = validate_config(config)
    if errors:
        print("ERROR: invalid config:")
        for e in errors:
            print("  - %s" % e)
        return 1

    out_dir: Path = config["_out_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)

    # MODE. Center mode needs BOTH the skeleton and the seam file; missing
    # either one falls back to the standalone shell and SAYS SO — a silent
    # fallback would ship a site in the wrong chrome and look intentional.
    shell_dir = config.get("_shell_dir")
    nav_path = config.get("_nav_path")
    nav = CS.load_nav(nav_path) if nav_path else None
    skeleton = None
    if shell_dir and (shell_dir / "docpage.html").is_file() and nav:
        skeleton = (shell_dir / "docpage.html").read_text(encoding="utf-8")
        print(f"mode: CENTER shell ({shell_dir.name}/docpage.html + {nav_path.name}, "
              f"{sum(len(g.get('items', [])) for g in nav['groups'])} nav items)")
    elif shell_dir or nav_path:
        why = []
        if shell_dir and not (shell_dir / "docpage.html").is_file():
            why.append(f"no docpage.html under {shell_dir}")
        if nav_path and not nav:
            why.append(f"no usable nav model at {nav_path}")
        print("mode: STANDALONE shell — center mode asked for but " + "; ".join(why))
    config["_skeleton"] = skeleton
    config["_nav"] = nav
    if skeleton:
        # In center mode the pages ARE center pages: they emit into the center's
        # own dir, share its one assets/ folder, and link to its stations as
        # siblings. nav.json lives there, so it names the destination.
        out_dir = nav_path.parent
        config["_out_dir"] = out_dir
        out_dir.mkdir(parents=True, exist_ok=True)
    config["_stamp"] = _dt.datetime.now().strftime("%Y-%m-%d %H:%MZ")

    # PRISM FRAGMENTS — the second seam file, read exactly like nav.json: one
    # producer (build_prisms.py), one consumer (here), no import in either
    # direction. Absent manifest leaves every {{PRISM:<slug>}} token unexpanded,
    # which check_suite_center.py then fails on — a missing component stops the
    # chain instead of shipping a page with a hole in it.
    config["_prisms"] = load_prisms(config.get("_prisms_path"))
    if config["_prisms"]:
        print("prisms: %d embeddable fragment(s) available — %s"
              % (len(config["_prisms"]), ", ".join(sorted(config["_prisms"]))))

    # REFERENCES — the registries this project actually has. Absent registry ⇒
    # that token class is not applicable here and is not extracted at all, which
    # is different from "extracted and unresolved".
    repo_root = config["_out_dir"].parent.parent
    config["_skill_roster"] = REF.skill_roster(repo_root)
    center_dir = config["_out_dir"] if config.get("_skeleton") else None
    config["_registries"] = REF.load_registries(config, center_dir)
    config["_refpages"] = []
    live = [k for k, v in config["_registries"].items() if v]
    print("references: %s" % (", ".join("%s (%d)" % (k, len(config["_registries"][k]))
                                        for k in live) or "no registries configured"))

    renderer = find_renderer(config)
    config["_renderer"] = renderer
    config["_prerendered"] = renderer is not None
    print("diagrams: %s" % ("PRE-RENDERED via %s" % renderer.name if renderer
                            else "RUNTIME (vendored mermaid.min.js — no usable renderer)"))

    link_map = build_link_map(config)
    config["_doc_labels"] = {
        center_slug(d["slug"]): (d.get("nav_label") or d["title"])
        for s in config["SECTIONS"] for d in s.get("docs", [])
    }
    page_assets: dict[Path, str] = {}

    built: list[str] = []
    diagrams_ok = diagrams_failed = 0
    cache = out_dir / "assets" / "mermaid"
    repo_root = out_dir.parent.parent

    def emit(slug: str, html_out: str, source: str) -> None:
        nonlocal diagrams_ok, diagrams_failed
        path_slug = center_slug(slug) if config.get("_skeleton") else slug
        if config.get("_renderer") and 'class="mermaid-fig"' in html_out:
            html_out, ok_n, bad_n = prerender_diagrams(
                html_out, config["_renderer"], cache, repo_root)
            diagrams_ok += ok_n
            diagrams_failed += bad_n
        (out_dir / ("%s.html" % path_slug)).write_text(html_out, encoding="utf-8")
        built.append("%s.html  <-  %s" % (path_slug, source))

    for section in config["SECTIONS"]:
        for doc in section.get("docs", []):
            emit(doc["slug"], render_doc(config, doc, link_map, page_assets), doc["source_md"])

    emit("index", render_hub(config, link_map, page_assets), "the hub")

    assets_copied = copy_assets(out_dir, center_mode=bool(config.get("_skeleton")))
    for abs_src, dest_rel in sorted(page_assets.items(), key=lambda kv: kv[1]):
        dst = out_dir / dest_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(abs_src, dst)
        assets_copied.append(dest_rel)

    backlinks = REF.backlink_index(config.get("_refpages", []))
    if config.get("_skeleton"):
        (out_dir / "docs-backlinks.json").write_text(
            json.dumps({"generator": "build_docsite.py", "targets": backlinks}, indent=1) + "\n",
            encoding="utf-8")
        print("references: %d outbound edge(s) → %d target(s) with a backlink"
              % (sum(len(r) for _s, _t, r in config["_refpages"]), len(backlinks)))

    if diagrams_failed:
        print("ERROR: %d diagram(s) fell back to source text — a page whose diagram "
              "is a <pre> block reads as a rendered one to nobody, and as a pass to "
              "the build. Fix the renderer or run without it." % diagrams_failed)
        return 1
    if config.get("_renderer"):
        print("diagrams: %d pre-rendered, 0 fallbacks" % diagrams_ok)

    print("Built %d page(s) into %s:" % (len(built), out_dir))
    for line in built:
        print("  " + line)
    print("Copied %d asset(s), incl. %d referenced by docs" % (len(assets_copied), len(page_assets)))
    return 0


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="build_docsite.py",
        description=(
            "Generic static-docs-site generator (gabe-docsite). Renders a "
            "project's markdown docs (per a --config module) into a themed, "
            "self-contained HTML site under the config's out_dir."
        ),
    )
    parser.add_argument(
        "--config",
        required=True,
        type=Path,
        help="Path to the project's docsite.config.py (see docsite.config.example.py)",
    )
    parser.add_argument(
        "--shell", type=Path, default=None,
        help="A command center's shell dir (must contain docpage.html). With --nav, "
             "doc pages render INTO the center instead of the standalone site.")
    parser.add_argument(
        "--nav", type=Path, default=None,
        help="nav.json emitted by the center build — the sidebar model both builders share.")
    parser.add_argument(
        "--prisms", type=Path, default=None,
        help="prism-fragments.json emitted by build_prisms.py — lets a doc page "
             "embed a {{PRISM:<slug>}} component. Absent, tokens stay unexpanded.")
    args = parser.parse_args(argv)

    config_path = args.config.resolve()
    if not config_path.exists():
        print("ERROR: config not found at %s" % config_path)
        return 1

    config = load_config(config_path)
    config["_shell_dir"] = args.shell.resolve() if args.shell else None
    config["_nav_path"] = args.nav.resolve() if args.nav else None
    config["_prisms_path"] = args.prisms.resolve() if args.prisms else None
    return build(config)


if __name__ == "__main__":
    raise SystemExit(main())
