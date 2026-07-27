"""Board cards for the Gabe Suite's own command center.

The twins' board reads PLAN / PENDING / LEDGER / SCOPE / walks / adoption /
archmap. This repo carries no `.kdbp` (ruling R8), so none of those exist here.
The suite's open moves live in five other places, all committed:

    docs/design/suite-backlog.md   considered, deliberately not built
    docs/design/trim-ledger.md     settled calls with follow-through still owed
    docs/handoff/*.md              twin-proven fixes awaiting absorption upstream
    the tree                       files past the 800-line CODE budget
    git                            committed and not pushed

Everything here is a PROJECTION of those files (ruling 1). No card state is
stored; re-run the build and the board is whatever the sources now say.

`_a3_board.py` is upstream-owned and actively changing in a parallel session, so
this module never edits it — it registers suite tracks into `B.TRACKS` at
runtime and calls the public surface (`_card`, `board_html`, `kpis`, `modebar`,
`filter_bar`).

THE ENTITY AXIS. The suite has no entity registry, so the `entity` framing would
otherwise render one "Cross-cutting" column. Instead each card carries its
LIFECYCLE BEAT in the `entities` field, with `labels` mapping beat → label. The
entity framing then columns the board by beat, which is this repo's actual
spine — the same choice suite-center.config.json already makes.

INFERENCE DISCIPLINE. Any field not stated literally in the source is listed in
the card's `inferred` list, which renders a `~inferred` chip explaining what the
board derived rather than read. Effort estimates and ripeness are always
inferred; state, title and evidence never are.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

import _a3_board as B

# --------------------------------------------------------------- tracks

SUITE_TRACKS = {
    "ship": ("Ship", "#16794c",
             "Committed and not pushed. Only the operator pushes, so these sit "
             "here until they do."),
    "absorb": ("Absorb", "#b45309",
               "A fix proven in a twin that lives only in a handoff note. Until "
               "it lands upstream, the next re-sync reverts it."),
    "backlog": ("Backlog", "#5a53a8",
                "Considered and deliberately not built. An entry earns its place "
                "by carrying the evidence that made it interesting."),
    "ruling": ("Ruling", "#0d6e78",
               "A call already settled whose follow-through is still owed — or "
               "which is waiting on evidence that does not exist yet."),
    "budget": ("Budget", "#b3403a",
               "A file past the 800-line CODE budget. Report-never-gate: the "
               "number is stated, nothing is blocked."),
}
SUITE_TRACK_ORDER = ["ship", "absorb", "backlog", "ruling", "budget"]

# The backlog's own State cell drives the card state — it is not re-derived
# (operator ruling). This is the declared mapping, rendered on the page so a
# reader can audit it rather than trust it.
STATE_MAP = {
    "NEXT SESSION": ("owed_to_you",
                     "the row is a placeholder for the operator's cases; nobody "
                     "else can supply them"),
    "DEFERRED": ("parked", "deliberately later, by operator instruction"),
    "NOT STARTED": ("ready", "nothing blocks it"),
    "EVALUATE": ("owed_to_you", "an operator call, marked as such in the row"),
}

BEATS = {
    "red": "Red", "review": "Review", "center": "Center", "push": "Push",
    "plan": "Plan", "commit": "Commit", "suite-maintenance": "Suite upkeep",
    "cross-cutting": "Cross-cutting",
}


def register_tracks() -> None:
    """Add the suite's vocabulary to the upstream module at runtime.

    Upstream tracks are LEFT IN PLACE rather than replaced: `card_html` looks up
    `TRACKS[c["track"]]` and a missing key is a KeyError, so removing them would
    make this module fragile against any future card that reuses one.
    `TRACK_ORDER` is replaced, because it drives the `track` framing's columns
    and an upstream track with zero suite cards would render as a dead column.
    """
    B.TRACKS.update(SUITE_TRACKS)
    B.TRACK_ORDER[:] = SUITE_TRACK_ORDER


# --------------------------------------------------------------- helpers


def _git(repo: Path, *args: str) -> str:
    try:
        return subprocess.run(["git", "-C", str(repo), *args],
                              capture_output=True, text=True, timeout=15
                              ).stdout.rstrip("\n")
    except Exception:
        return ""


_CELL_SPLIT = re.compile(r"(?<!\\)\|")


def _rows(text: str) -> list[list[str]]:
    """Markdown table rows, minus the header and the `---` separator.

    Splits on UNESCAPED pipes only. A naive `split("|")` shifts every cell after
    an inline `\\|` — backlog row B3 carries `` `test\\|visual\\|journey` `` in its
    Why cell, which pushed its State cell out of position and made the card fall
    through to the default state. That silently re-derives a state the operator
    ruling says must be read from the row, which is the one thing this parser
    must never do.
    """
    out = []
    for line in text.splitlines():
        s = line.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip().replace("\\|", "|")
                 for c in _CELL_SPLIT.split(s.strip("|"))]
        if not cells or set("".join(cells)) <= set("-: "):
            continue
        out.append(cells)
    return out


def _plain(cell: str) -> str:
    """Markdown cell → readable text. Links keep their label, not their href."""
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", cell)
    s = s.replace("**", "").replace("`", "").replace("\\|", "|")
    return re.sub(r"\s+", " ", s).strip()


# --------------------------------------------------------------- sources


def _backlog(repo: Path) -> list[dict]:
    path = repo / "docs" / "design" / "suite-backlog.md"
    if not path.is_file():
        return []
    text = path.read_text(errors="replace")
    m = re.search(r"Opened (\d{4}-\d{2}-\d{2})", text)
    opened = m.group(1) if m else None

    cards = []
    for cells in _rows(text):
        if len(cells) < 5 or not re.fullmatch(r"B\d+", cells[0]):
            continue
        bid, item, why, evidence, state_cell = cells[:5]
        raw_state = _plain(state_cell)
        key = next((k for k in STATE_MAP if raw_state.upper().startswith(k)), None)
        state, why_state = STATE_MAP.get(key, ("ready", "state cell NOT RECOGNISED"))

        # An unmatched State cell used to fall through to `ready` in silence,
        # which re-derives the very thing the ruling says to read. It now says so
        # on the card's own source line, where a reader cannot miss it.
        src_note = ("" if key else "  ⚠ STATE CELL UNRECOGNISED — defaulted")
        inferred = [f"state from the row's State cell ({key or 'unmatched'}) — {why_state}"]
        effort, basis = None, ""
        low = (why + " " + state_cell).lower()
        if "small" in low or "cheap" in low:
            effort, basis = "S", "the row says small/cheap"
            inferred.append("effort read from the row's own wording")

        cards.append(B._card(
            track="backlog", state=state,
            title=f"{bid} · {_plain(item)}",
            detail=_plain(why),
            source=f"docs/design/suite-backlog.md — {raw_state}{src_note}",
            entities=[_beat_for(item, why)],
            effort=effort, effort_basis=basis,
            created=opened, inferred=inferred,
            ripe=(state == "ready" and effort == "S"),
            ripe_why="not started, and the row itself calls it small",
            evidence=_plain(evidence),
        ))
    return cards


def _beat_for(*text: str) -> str:
    blob = " ".join(text).lower()
    for needle, beat in (("gabe-red", "red"), ("proof_type", "red"),
                         ("review", "review"), ("center", "center"),
                         ("registry", "center"), ("plan", "plan")):
        if needle in blob:
            return beat
    return "cross-cutting"


def _trim_ledger(repo: Path) -> list[dict]:
    path = repo / "docs" / "design" / "trim-ledger.md"
    if not path.is_file():
        return []
    text = path.read_text(errors="replace")
    m = re.search(r"the (\d{4}-\d{2}-\d{2}) skills/files audit", text)
    audited = m.group(1) if m else None

    cards = []
    for cells in _rows(text):
        if len(cells) < 4 or not cells[0].isdigit():
            continue
        num, call, ruling, status = cells[:4]
        st = _plain(status)
        up = st.upper()
        if up.startswith("DONE"):
            continue                        # closed and acted on — not a move

        if "MARKER SET" in up:
            # Operator ruling: it waits on evidence that does not exist yet.
            # Rendering it ready invites acting early, which the ruling forbids.
            state, done, gate = "blocked", False, "evidence not yet measured"
            ripe_why = ""
        elif up.startswith("PARKED"):
            state, done, gate = "parked", False, None
            ripe_why = ""
        elif "RESOLVED" in up:
            state, done, gate = "ready", True, None
            ripe_why = ""
        else:
            state, done, gate = "ready", False, None
            ripe_why = ""

        cards.append(B._card(
            track="ruling", state=state, done=done, gate=gate,
            title=f"Trim #{num} · {_plain(call)}",
            detail=_plain(ruling),
            source=f"docs/design/trim-ledger.md — {st[:60]}",
            entities=["suite-maintenance"],
            created=audited, closed=(audited if done else None),
            ripe=False, ripe_why=ripe_why,
            inferred=["state derived from the Status cell's leading keyword"],
            evidence=st,
        ))
    return cards


# Any numbered `## N. …` heading is a SECTION BOUNDARY; the date is extracted
# separately and is optional.
#
# An earlier version required the trailing parenthetical to contain nothing but
# a date, which silently stopped recognising `## 12. … (gastify retro,
# 2026-07-26)` as a boundary — so §12's body merged into §11's, and any absorb
# instruction inside it would have been attributed to the wrong section. A
# heading parser must not depend on how the author punctuated the aside.
_ABSORB_H = re.compile(r"^## (\d+)\.\s+(.+?)\s*$", re.M)
_HEAD_DATE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def _absorb(repo: Path) -> list[dict]:
    """Handoff sections that flag a twin-proven fix for upstream absorption.

    A section qualifies when its body says so — `absorb` used as an instruction,
    not the word merely appearing. The handoff's prose uses `absorb` narratively
    throughout, so matching the word alone would sweep the whole document.
    """
    cards = []
    for path in sorted((repo / "docs" / "handoff").glob("*.md")):
        text = path.read_text(errors="replace")
        heads = list(_ABSORB_H.finditer(text))
        for i, h in enumerate(heads):
            body = text[h.end():heads[i + 1].start() if i + 1 < len(heads)
                        else len(text)]
            if not re.search(r"\*\*Absorb into the suite\*\*|absorb as the "
                             r"wiring recipe|absorb the fix", body):
                continue
            num, raw_title = h.group(1), h.group(2)
            dm = _HEAD_DATE.search(raw_title)
            dated = dm.group(1) if dm else None
            # Strip the trailing aside so the card title is the heading, not
            # the heading plus its parenthetical provenance.
            title = re.sub(r"\s*\([^)]*\)\s*$", "", raw_title).strip()
            first = next((ln.strip("- ").strip() for ln in body.splitlines()
                          if ln.strip().startswith("-")), "")
            cards.append(B._card(
                track="absorb", state="ready",
                title=f"§{num} · {title}",
                detail=_plain(first)[:260],
                source=f"{path.relative_to(repo)}:{text[:h.start()].count(chr(10)) + 1}",
                entities=["center"], area="handoff",
                effort="M", effort_basis="estimated from the described change surface",
                created=dated,
                inferred=["effort is an estimate, not a recorded figure"],
                ripe=False, ripe_why="",
                evidence="proven in a twin; reverts on the next re-sync until "
                         "it lands upstream",
            ))
    return cards


# Excluded from the CODE budget by ruling R9 and by kind: deep specs sit outside
# the cap; handoff and investigation trees are DATA snapshots; a minified vendor
# bundle is not suite code.
_BUDGET_SKIP = ("/references/", "/_archive/", "/__pycache__/", "/shell/example/",
                "/.ruff_cache/", "docs/handoff/", "docs/investigations/",
                "docs/site/")

# docs/center/generators/ holds BOTH a vendored fork of templates/center/ and
# this center's own modules. Only the vendored copies are skipped — skipping the
# whole directory would hide the suite center's own over-budget files, and a
# budget lens that cannot see its own author is not a budget lens.
_VENDORED = {
    "_a3_board.py", "_a3_code.py", "_a3_evidence.py", "_a3_feature.py",
    "_a3_guard.py", "_a3_ledger.py", "_a3_render.py", "_a3_tests.py",
    "_center_data.py", "_center_mermaid.py", "_render_mermaid.mjs",
    "_results_ingest.py", "build_center_a3.py", "check_center_links.py",
    "curate_proof.py", "next_feature.py", "refresh_center.sh",
    "verify_center_chrome.mjs",
}


def _budget(repo: Path, cap: int = 800) -> list[dict]:
    cards = []
    for path in sorted(repo.rglob("*")):
        if not path.is_file() or path.suffix not in (".py", ".sh", ".mjs", ".js"):
            continue
        rel = str(path.relative_to(repo))
        if ".git/" in rel or any(s.strip("/") in rel for s in _BUDGET_SKIP):
            continue
        if rel.startswith("docs/center/generators/") and path.name in _VENDORED:
            continue
        if path.name.endswith(".min.js"):
            continue
        n = len(path.read_text(errors="replace").splitlines())
        if n <= cap:
            continue
        over = n - cap
        effort = "L" if n > 1500 else "M"
        # `run.sh` and `build_*.py` repeat across trees — a bare filename would
        # make two different files look like the same card.
        where = "/".join(Path(rel).parts[-2:])
        cards.append(B._card(
            track="budget", state="ready",
            title=f"{where} — {n:,} lines",
            detail=f"{over:,} over the {cap}-line CODE budget. "
                   f"Report-never-gate (ruling R9): the number is stated, "
                   f"nothing is blocked.",
            source=rel,
            entities=["center" if "center" in rel else "cross-cutting"],
            area="size",
            effort=effort,
            effort_basis=f"derived from line count ({n:,})",
            created=None,
            inferred=["effort derived from line count",
                      "no date — the tree records no creation date for a file's "
                      "size crossing the cap"],
            ripe=False, ripe_why="",
            evidence=f"{n:,} lines vs an {cap}-line budget",
        ))
    return cards


def _unpushed(repo: Path) -> list[dict]:
    """Commits on HEAD that the upstream branch does not have.

    One card per commit rather than one for the batch: the age framing is only
    meaningful per commit, and a single "10 commits" card would sit in one age
    bucket while the commits it stands for span several.
    """
    upstream = _git(repo, "rev-parse", "--abbrev-ref", "@{u}")
    if not upstream:
        return []
    log = _git(repo, "log", "--format=%h\x1f%s\x1f%cd", "--date=short",
               f"{upstream}..HEAD")
    cards = []
    for line in [x for x in log.splitlines() if x.strip()]:
        parts = line.split("\x1f")
        if len(parts) != 3:
            continue
        sha, subject, dated = parts
        cards.append(B._card(
            track="ship", state="owed_to_you",
            title=subject[:96],
            detail=f"Committed {dated} and not on {upstream}. Only the operator "
                   f"pushes, so this cannot clear itself.",
            source=f"git {sha} · not on {upstream}",
            entities=[_beat_for(subject)], area="unpushed",
            effort="XS", effort_basis="one push clears every card in this track",
            created=dated,
            cmd="/gabe-push",
            ripe=True,
            ripe_why="nothing blocks it — the work is committed and the push is "
                     "one command",
            inferred=["effort and ripeness are the board's judgement, not a "
                      "recorded field"],
            evidence=f"git log {upstream}..HEAD",
        ))
    return cards


# --------------------------------------------------------------- assembly


def build(repo: Path) -> tuple[list[dict], dict]:
    register_tracks()
    cards = (_unpushed(repo) + _absorb(repo) + _backlog(repo)
             + _trim_ledger(repo) + _budget(repo))
    used = {e for c in cards for e in (c.get("entities") or [])}
    labels = {k: v for k, v in BEATS.items() if k in used}
    return cards, labels


def source_table(repo: Path) -> list[dict]:
    """Provenance, one row per source — including sources that yielded nothing,
    which is the difference between "no open moves" and "the reader never
    looked"."""
    checks = [
        ("docs/design/suite-backlog.md", "backlog", _backlog),
        ("docs/design/trim-ledger.md", "ruling", _trim_ledger),
        ("docs/handoff/*.md", "absorb", _absorb),
        ("the tree (>800-line code files)", "budget", _budget),
        ("git (unpushed commits)", "ship", _unpushed),
    ]
    out = []
    for label, track, fn in checks:
        got = fn(repo)
        out.append({"source": label, "track": track, "cards": len(got),
                    "present": bool(got)})
    return out
