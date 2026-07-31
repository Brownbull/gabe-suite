#!/usr/bin/env python3
"""Center-shell adapter — renders a doc page INTO a command center's shell.

The replacement for `_shell.py`, which owned a second set of chrome (its own
sidebar, breadcrumb, masthead and stylesheet) and produced a site that looked
nothing like the center it sat next to. Here the chrome belongs to the center:
this module only fills the skeleton's named slots.

Two inputs, both produced by the center's own build:

  shell_dir/docpage.html   the skeleton — owns the tab set, the nav container
                           and the topbar; this module never authors chrome
  nav.json                 the rendered sidebar model, emitted by the center
                           build so both builders wear ONE sidebar without
                           either importing the other

Absent either input, the caller falls back to the standalone shell — a project
with no command center keeps the site it already had.
"""

from __future__ import annotations

import html as _html
import json
from pathlib import Path
from typing import Any

E = _html.escape

# Inner SVG only, matching the center's own nav icons.
_ICONS = {
    "home":     '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "book":     '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    "filetext": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "board":    '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="9"/><rect x="14" y="7" width="3" height="5"/>',
    "shield":   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    "zap":      '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    "check":    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    "users":    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    "type":     '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    "code":     '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    "database": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
}


def load_nav(nav_path: Path) -> dict[str, Any] | None:
    """The seam file, or None when the center has not been built yet."""
    if not nav_path.is_file():
        return None
    try:
        data = json.loads(nav_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return data if data.get("groups") else None


def _icon(name: str, size: int = 0) -> str:
    path = _ICONS.get(name, _ICONS["filetext"])
    dim = f' width="{size}" height="{size}"' if size else ""
    return (f'<svg viewBox="0 0 24 24"{dim} fill="none" stroke="currentColor" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{path}</svg>')


def render_sidebar(nav: dict[str, Any], current: str, project: str,
                   stamp: str, head: str, generator: str) -> str:
    """Render the seam model with THIS page marked current.

    Deliberately a re-render rather than a stored HTML blob: the only thing that
    differs per page is which item is `on`, and a stored blob would either lose
    that or force the center to emit one blob per page.
    """
    parts = [
        '  <div class="brand">',
        '    <span class="logo"><img src="assets/gabe-icon.png" width="26" height="26" '
        'alt="" style="image-rendering:pixelated"></span>',
        f'    <span><b>{E(project)}</b><small>Gabe Center · suite</small></span>',
        "  </div>",
    ]
    for group in nav["groups"]:
        parts.append(f'  <div class="navlabel {group.get("cls", "g-code")}">'
                     f'{E(group.get("label", ""))}</div>')
        for item in group.get("items", []):
            if item.get("disabled"):
                parts.append(
                    f'  <span class="navitem" style="opacity:.42;cursor:default" '
                    f'title="{E(item["disabled"])}">{_icon(item.get("icon", ""))} '
                    f'{E(item["label"])} <span class="count">—</span></span>')
                continue
            on = " on" if item.get("href") == current else ""
            sub = " navsubitem" if item.get("sub") else ""
            cnt = item.get("count")
            badge = f' <span class="count">{cnt}</span>' if cnt is not None else ""
            size = 14 if item.get("sub") else 0
            parts.append(
                f'  <a class="navitem{sub}{on}" href="{item["href"]}">'
                f'{_icon(item.get("icon", ""), size)} {E(item["label"])}{badge}</a>')
    parts.append(f'  <div class="foot">regen {E(stamp)}<br>HEAD {E(head)} · {E(generator)}</div>')
    return "\n".join(parts)


def document(skeleton: str, *, nav_html: str, title: str, kicker: str, lede_html: str,
             body_html: str, source_note: str, project: str, lang: str,
             stamp: str, pills: str = "", scripts: str = "") -> str:
    """Fill every slot in docpage.html. A slot left unfilled would render as a
    labelled chip (the shell's slots.js does that deliberately), so an unfilled
    page is visibly unfinished rather than quietly wrong."""
    fills = {
        "{{LANG}}": E(lang),
        "{{PROJECT_NAME}}": E(project),
        "{{SIDEBAR}}": nav_html,
        "{{DOC_TITLE}}": title,
        "{{DOC_KICKER}}": E(kicker),
        "{{DOC_LEDE}}": lede_html,
        "{{DOC_BODY}}": body_html,
        "{{DOC_SOURCE}}": source_note,
        "{{DOC_SCRIPTS}}": scripts,
        "{{STATUS_PILLS}}": pills,
        "{{SYNC_AGE}}": E(stamp),
        "{{REGEN_STAMP}}": E(stamp),
    }
    out = skeleton
    for token, value in fills.items():
        out = out.replace(token, value)
    return out
