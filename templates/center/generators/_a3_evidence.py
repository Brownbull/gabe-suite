#!/usr/bin/env python3
"""A3 Evidence tab — the proof a person can look at and judge.

Split out of _a3_feature.py (size budget). Every fact here is read off disk:
the shots, videos and traces by walking the proof set RECURSIVELY (an earlier
top-level-only glob reported two full sets as empty gaps — a false gap is as
dishonest as a false pass), and the narration from each set's committed
`manifest.json` (feature · spec · proof_form · source_run · legs · narration).
Nothing on this tab is authored in the entity card.
"""

from __future__ import annotations

import datetime as _dt
import json
import os
import re
from pathlib import Path

import _center_data as _cd
from _a3_render import E, legend, md, pmore, sechead, subnav, table, trunc

_CENTER_REL = _cd._PATHS.get("center", "docs/site/center")
_PROOF_REL = _cd._PATHS.get("proof", "tests/web-e2e/proof")

_IC_CAM = ('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 '
           '2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>')
_IC_INBOX = ('<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>'
             '<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 '
             '2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>')

_SHOT_EXT = (".png", ".jpg", ".jpeg", ".webp")
_VIDEO_EXT = (".webm", ".mp4", ".mov")
_TRACE_EXT = (".zip",)
# Web pages resolve proof files relative to the center dir — the link gate
# exempts this prefix from its dead-link crawl (files are probed at view time).
# Derived from the configured center/proof paths so a different layout stays
# correct (gastify's docs/site/center + tests/web-e2e/proof -> ../../../…).
_PREFIX = os.path.relpath(_PROOF_REL, _CENTER_REL).replace(os.sep, "/")


# A Storybook / design-lab REFERENCE is not evidence. It is what the screen was
# rebuilt to match — captured at development time, from the design source, not
# from a run of our own software. Fidelity sets keep both halves side by side
# (`ref/browse` beside `live/browse`), so the split is per FILE, not per set,
# and the held-out count is always stated — never silently dropped.
_REF_RX = re.compile(r"(^|[-/_])(ref|reference|storybook|mockup|design)([-/_.]|$)",
                     re.I)


def _is_reference(rel: Path, set_name: str = "") -> bool:
    """The SET NAME counts. `df2-trends-ref/` is six design captures whose
    marker is on the box, not the contents — matching only the path inside the
    set held out zero of them. The separator class is widened for the same
    reason: `05-reportviewer-reference.png` and `v2-ref-shot.png` carry the
    marker mid-token."""
    return bool(_REF_RX.search(f"{set_name}/{rel}".replace("\\", "/").lstrip("/")))


def _resolve_single(pdir: Path) -> Path | None:
    """A declared proof that is one FILE, not a directory of them. The tracker
    cites three of these (`01-scan-complete.png`, `04-statement-reconciled.png`,
    `03-insights-by-item.png`) — each sitting loose at the proof root."""
    if pdir.is_dir():
        return None
    for ext in _SHOT_EXT + _VIDEO_EXT:
        cand = pdir.with_suffix(ext)
        if cand.is_file():
            return cand
    return pdir if pdir.is_file() else None


# Public alias: the same rule decides whether a SPEC is a reference capture
# (`df2-trends-ref-capture.spec.ts` runs the design lab, not the product), so
# the rule lives in one place rather than being re-guessed per caller.
is_reference = _is_reference


def _rel_days(ts: float) -> str:
    days = (_dt.datetime.now().timestamp() - ts) / 86400
    if days < 1:
        return "today"
    if days < 2:
        return "yesterday"
    return f"{int(days)}d ago"


def collect_set(name: str, pdir: Path) -> dict:
    """One proof set, read off disk. Files are walked recursively and split by
    kind; the manifest supplies the narration, never the counts."""
    man: dict = {}
    mpath = pdir / "manifest.json"
    if mpath.exists():
        try:
            man = json.loads(mpath.read_text())
        except json.JSONDecodeError:
            man = {}
    shots: list[Path] = []
    videos: list[Path] = []
    traces: list[Path] = []
    refs: list[Path] = []
    # A declared proof resolves to a DIRECTORY or a single FILE. Gating on
    # is_dir() made three entities' only cited artifact read "absent — no
    # directory" while it sat on disk: a false gap, in the section written to
    # outlaw false gaps.
    single = _resolve_single(pdir)
    if single is not None:
        pdir, walk = single.parent, [single]
    elif pdir.is_dir():
        walk = sorted(pdir.rglob("*"))
    else:
        walk = []
    if True:
        for f in walk:
            if not f.is_file():
                continue
            ext = f.suffix.lower()
            if ext in _TRACE_EXT:
                traces.append(f)
                continue
            if ext not in _SHOT_EXT and ext not in _VIDEO_EXT:
                continue
            if _is_reference(f.relative_to(pdir), name):
                refs.append(f)
            elif ext in _SHOT_EXT:
                shots.append(f)
            else:
                videos.append(f)

    # The manifest's artifact list is an authored READING ORDER; files it does
    # not name still appear (never hide evidence), just after the named ones.
    order = {n: i for i, n in enumerate(man.get("artifacts", []) or [])}
    # Reading order: what the manifest named, then the stills, then the
    # recordings — a walk is read as frames before it is watched.
    media = shots + videos
    _still = set(shots)
    kind = {p: (0 if p in _still else 1) for p in media}
    media.sort(key=lambda p: (order.get(p.name, 10_000), kind[p],
                              str(p.relative_to(pdir)).lower()))

    # Legs map a leg name to relative-path PREFIXES — they match both a file
    # stem convention ("ref-default.png") and a directory ("prod/cl/01.png").
    legs_def = man.get("legs", {}) or {}
    notes = (man.get("narration", {}) or {}).get("legs", {}) or {}
    buckets: dict[str, list[Path]] = {k: [] for k in legs_def}
    unassigned: list[Path] = []
    for p in media:
        rel = str(p.relative_to(pdir)).replace("\\", "/")
        hit = next((leg for leg, pres in legs_def.items()
                    if any(rel.startswith(pre) for pre in (pres or []))), None)
        # Fallback: a recording is usually named for the leg it records
        # (`local/videos/cl-supermarket.webm`), which no path prefix catches.
        # Exact stem match only — a looser rule would misfile shots.
        if hit is None:
            hit = next((leg for leg in legs_def if p.stem == leg), None)
        (buckets[hit] if hit else unassigned).append(p)
    legs = [{"name": leg, "note": notes.get(leg, ""), "files": files}
            for leg, files in buckets.items() if files]
    if unassigned:
        legs.append({"name": "unfiled", "files": unassigned,
                     "note": "on disk in this set but not claimed by any leg "
                             "in the manifest — shown, not hidden"})
    newest = max((f.stat().st_mtime for f in media), default=0.0)
    return {"name": name, "dir": pdir,
            "exists": pdir.is_dir() or single is not None,
            "single": single is not None, "man": man,
            "shots": shots, "videos": videos, "traces": traces, "refs": refs,
            "legs": legs, "newest": newest}


def _labels(files: list[Path], pdir: Path) -> list[str]:
    """Tile captions inside one leg. A stem alone collides when the same walk
    was recorded twice (`local/videos/x.webm` and `prod/videos/x.webm`) — only
    the colliding ones get their folder back, so the common case stays short.

    The prefix is the file's directory RELATIVE TO THE SET, which is the only
    part that actually differs between the twins. An earlier version used
    `parent.parent.name`, which handed both twins the same prefix (the set's
    own name) — leaving the collision it exists to resolve — and, for a file
    sitting at the set root, named a directory outside the set entirely."""
    stems = [f.stem.replace("-", " ").replace("_", " ") for f in files]
    dupes = {s for s in stems if stems.count(s) > 1}
    out = []
    for f, s in zip(files, stems):
        if s not in dupes:
            out.append(s)
            continue
        try:
            where = str(f.relative_to(pdir).parent).replace("\\", "/")
        except ValueError:                       # not under the set — show the path
            where = str(f.parent)
        out.append(f"{s}" if where in (".", "") else f"{where} · {s}")
    return out


def _tile(s: dict, leg: dict, f: Path, label: str, i: int, n: int) -> str:
    """One gallery tile. The anchor still points at the real file (it works
    with JS off and the link gate can probe it); the viewer intercepts the
    click and opens it in place instead of navigating away."""
    rel = str(f.relative_to(s["dir"])).replace("\\", "/")
    href = f'{_PREFIX}/{E(s["name"])}/{E(rel)}'
    is_video = f.suffix.lower() in _VIDEO_EXT
    title = s["man"].get("feature", s["name"])
    body = (f'<span class="ph vid">▶ {E(f.suffix.lstrip("."))}</span>' if is_video
            else f'<img src="{href}" loading="lazy" style="width:100%;'
                 f'aspect-ratio:4/3;object-fit:cover;display:block">')
    noun = "recording" if is_video else "screenshot"
    return (f'<a class="shot" href="{href}" data-lb="1" data-kind='
            f'"{"video" if is_video else "image"}" data-set="{E(title)}" '
            f'data-leg="{E(leg["name"])}" data-note="{E(leg["note"])}" '
            f'data-shot="{E(rel)}" data-setname="{E(s["name"])}" '
            f'data-i="{i}" data-n="{n}" '
            f'data-noun="{noun}{"" if n == 1 else "s"}">{body}'
            f'<div class="cap"><b>{E(leg["name"])}</b>'
            f'<span class="ix">{i} of {n}</span>'
            # Stated exception to "every truncation carries its expander": a
            # thumbnail caption is an identifier, not a sentence, and the full
            # path is one click away in the viewer's own caption.
            f"<span>{E(trunc(label, 44))}</span></div></a>")


def _set_detail(s: dict) -> str:
    """What opens under a proof-set row: the run it came from, then one
    collapsible leg per journey. The whole block is ONE viewer group, so
    arrowing runs across the entire set and not just the leg on screen."""
    man = s["man"]
    out = ""
    if man.get("proof_form"):
        out += f'<p class="sub">{md(man["proof_form"])}</p>'
    if s["refs"]:
        out += (f'<p class="sub"><b>{len(s["refs"])} reference artifact(s) held '
                f"out.</b> Storybook / design-lab captures live in this "
                f"directory for fidelity comparison; they are what the screen "
                f"was built to match, not a run of our software, so they are "
                f"not counted or shown as proof.</p>")
    for leg in s["legs"]:
        labels = _labels(leg["files"], s["dir"])
        n = len(leg["files"])
        note = f' — {md(leg["note"])}' if leg["note"] else ""
        out += (f'<details class="legset" data-sub="1" open><summary><b>{E(leg["name"])}</b>'
                f'<span class="count">{n}</span>{note}</summary>'
                '<div class="gal">'
                + "".join(_tile(s, leg, f, lab, i, n)
                          for i, (f, lab) in enumerate(zip(leg["files"], labels), 1))
                + "</div></details>")
    if s["traces"]:
        names = ", ".join(sorted(t.name for t in s["traces"])[:6])
        out += (f'<p class="sub">{len(s["traces"])} playwright trace(s) kept for '
                f"forensics — not viewable here, opened with "
                f"<code>npx playwright show-trace</code>: {E(names)}"
                f'{"…" if len(s["traces"]) > 6 else ""}</p>')
    return out


def build_evidence_tab(names: list[str], proof_root: Path,
                       label: str = "this entity") -> str:
    """The Evidence tab for one entity: a header table of its proof sets, each
    row opening onto its own galleries. A declared set with nothing on disk
    keeps its row and reads as a named gap."""
    if not names:
        return ""
    sets = [collect_set(n, proof_root / n) for n in names]
    rows, exp = [], []
    for s in sets:
        n_media = len(s["shots"]) + len(s["videos"])
        man = s["man"]
        # The verdict, not a repeat of the count beside it: whether this set
        # can be looked at, or is a declared-but-unbacked claim.
        if not s["exists"]:
            state = '<span class="tag s-gap">absent — no directory</span>'
        elif not n_media and s["refs"]:
            state = ('<span class="tag s-gap">reference only — not proof</span>')
        elif not n_media:
            state = '<span class="tag s-gap">empty — named gap</span>'
        elif not man:
            state = '<span class="tag s-med">no manifest</span>'
        else:
            state = f'<span class="tag s-ok">on disk · {len(s["legs"])} leg(s)</span>'
        story_cell = pmore((man.get("narration", {}) or {}).get("story", ""), 150)
        counts = " ".join(filter(None, [
            f'{len(s["shots"])} shot(s)' if s["shots"] else "",
            f'{len(s["videos"])} video(s)' if s["videos"] else "",
            f'{len(s["traces"])} trace(s)' if s["traces"] else ""])) or "—"
        captured = (f'{_rel_days(s["newest"])}<br>'
                    + pmore(man.get("source_run", "run not recorded"), 42,
                            small=True)
                    if s["newest"] else '<span class="sub">—</span>')
        rows.append([
            f'<b>{E(s["name"])}</b><br>'
            + pmore(man.get("feature", "no manifest"), 60, small=True),
            story_cell, counts, captured, state])
        exp.append((f'Open the {n_media} artifact(s) of '
                    f'<code>{E(s["name"])}</code>', _set_detail(s))
                   if n_media else ("", ""))

    n_sets = sum(1 for s in sets if s["shots"] or s["videos"])
    n_shots = sum(len(s["shots"]) for s in sets)
    n_vids = sum(len(s["videos"]) for s in sets)
    specs = sorted({s["man"].get("spec", "") for s in sets if s["man"].get("spec")})

    html = subnav([("sec-ev-sets", "Proof sets", _IC_CAM),
                   ("sec-ev-gaps", "Not proven here", _IC_INBOX)])
    html += sechead(
        "Evidence", "Proof sets", "#0f766e", _IC_CAM,
        sub="what a person can look at and judge — captured by the e2e runs, "
            "never staged for the page",
        id_="sec-ev-sets", open_=True,   # carries the viewer's keyboard contract
        info='<div class="leg">A set is one directory under '
             f'<code>{_PROOF_REL}/</code>; its <code>manifest.json</code> '
             "supplies the story and the leg names, the file counts are walked "
             "off disk. Open a row to see its legs, then click any artifact "
             "to open the viewer — <b>←</b> / <b>→</b> or the side arrows "
             "run through the WHOLE set, leg by leg; <b>↑</b> / <b>↓</b> move to "
             "the previous or next set (folding this one shut and "
             "unfolding that one); <b>Esc</b> closes. Opening or closing "
             "a set cascades to its legs.</div>"
             + legend("Row states:", [
                 ("s-ok", "artifacts", "on disk this build ·"),
                 ("s-gap", "empty / absent",
                  "declared for this entity but nothing to show — a named gap")]))
    html += table(
        ["Proof set", "What it shows", "Artifacts", "Captured", "State"],
        rows, expand=exp,
        note=f"{n_sets} set(s) with evidence · {n_shots} shot(s) · {n_vids} "
             f"video(s) · walked recursively from "
             f"`{_PROOF_REL}/` at build time.")
    html += sechead("Evidence", "Not proven here", "#8a6d1a", _IC_INBOX,
                    sub="the evidence kinds this entity does not have",
                    id_="sec-ev-gaps")
    html += table(
        ["Kind", "Why"],
        [["deployed probes", f"no machine-readable probe watches the deployed "
                              f"{label} surfaces — every artifact above is a "
                              f"capture from a run, not a live check"],
         ["mobile (Maestro)", "no Maestro flow is attached to this entity; the "
                              "mobile app consumes the same API but leaves no "
                              "artifact here"],
         ["a junit record of these runs",
          "D121 keeps web e2e local-only, so the shots above exist without a "
          "pass/fail record beside them — the pre-push local gate is where "
          "they are enforced"]],
        note="Absent evidence is named, never zeroed. Specs behind the sets "
             "above: " + (", ".join(f"`{s}`" for s in specs)
                          or "none recorded in the manifests."))
    return html
