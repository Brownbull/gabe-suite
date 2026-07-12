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
import datetime as _dt
import importlib.util
import os
import shutil
import sys
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
from _shell import document, masthead, render_hub_sections  # noqa: E402


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
    head = masthead(
        doc.get("kicker", ""),
        render_inline(doc["title"]),
        render_inline(doc.get("summary", "")),
    )
    site_title = config["SITE"]["title"]
    return document(
        config,
        active_slug=doc["slug"],
        title="%s — %s" % (site_title, doc["title"]),
        body_html=head + "\n" + body_html,
        has_diagram="```mermaid" in md,
    )


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


def copy_assets(out_dir: Path) -> list[str]:
    assets_out = out_dir / "assets"
    assets_out.mkdir(parents=True, exist_ok=True)
    copied = []
    missing = []
    for name in ASSET_FILES:
        src = ASSETS_SRC_DIR / name
        if not src.exists():
            missing.append(name)
            continue
        shutil.copyfile(src, assets_out / name)
        copied.append(name)
    # Optional project assets (e.g. generated icons): a sibling `assets/` dir next to
    # the output dir is merged into <out_dir>/assets/ on every build. Skips the manifest/ledger.
    proj_assets = out_dir.parent / "assets"
    if proj_assets.is_dir() and proj_assets.resolve() != assets_out.resolve():
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

    link_map = build_link_map(config)
    page_assets: dict[Path, str] = {}

    built: list[str] = []
    for section in config["SECTIONS"]:
        for doc in section.get("docs", []):
            html_out = render_doc(config, doc, link_map, page_assets)
            (out_dir / ("%s.html" % doc["slug"])).write_text(html_out, encoding="utf-8")
            built.append("%s.html  <-  %s" % (doc["slug"], doc["source_md"]))

    (out_dir / "index.html").write_text(render_hub(config, link_map, page_assets), encoding="utf-8")
    built.insert(0, "index.html  (hub)")

    assets_copied = copy_assets(out_dir)
    for abs_src, dest_rel in sorted(page_assets.items(), key=lambda kv: kv[1]):
        dst = out_dir / dest_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(abs_src, dst)
        assets_copied.append(dest_rel)

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
    args = parser.parse_args(argv)

    config_path = args.config.resolve()
    if not config_path.exists():
        print("ERROR: config not found at %s" % config_path)
        return 1

    config = load_config(config_path)
    return build(config)


if __name__ == "__main__":
    raise SystemExit(main())
