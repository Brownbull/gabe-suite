#!/usr/bin/env python3
"""Board-lab card extractor — READ-ONLY over a project's committed center data
+ .kdbp state. Emits cards.json for the board-lab renderer.

This is a SPIKE: it proves which board cards are derivable from facts the
project already commits, and marks every inference as an inference.

Sources (all read-only):
  docs/site/center/adoption.json   — entity registry, per-entity checklist, walks
  docs/site/center/archmap.json    — coverage (proven/unproven flows), entity files
  .kdbp/PLAN.md                    — phase rail (6 lifecycle cells per phase)
  .kdbp/PENDING.md                 — open deferred findings (the debt lane)
  .kdbp/SCOPE.md  §Phases          — the long-horizon arc
  .kdbp/walks.jsonl                — human verification record
"""
import json
import re
import sys
from collections import Counter
from datetime import date, datetime
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
CENTER = ROOT / "docs/site/center"
KDBP = ROOT / ".kdbp"
TODAY = date(2026, 7, 25)

# --------------------------------------------------------------------------- #
# loaders
# --------------------------------------------------------------------------- #
adoption = json.loads((CENTER / "adoption.json").read_text())
archmap = json.loads((CENTER / "archmap.json").read_text())
config = json.loads((CENTER / "center.config.json").read_text())

LABELS = {s["entity"]: s.get("display_name") or s["entity"].title()
          for s in adoption["sections"]}

# entity file index — used to attribute a debt row to a domain.
# archmap files entries are [corpus, path, lines]; the line count is a REAL
# effort signal (not a guess) for any debt row that cites one of these files.
FILE_OWNER = {}
FILE_LINES = {}
for slug, ent in archmap.get("entities", {}).items():
    for f in ent.get("files", []):
        if isinstance(f, (list, tuple)) and len(f) >= 2:
            path, lines = f[1], (f[2] if len(f) > 2 else None)
        else:
            path, lines = f, None
        FILE_OWNER.setdefault(path, slug)
        if lines is not None:
            FILE_LINES.setdefault(path, lines)


def _expand_braces(tok: str):
    """`features/{cooking,shopping}/**` → both branches.

    Brace lists are how a PENDING row says "this finding spans these domains".
    Collapsing them to one guess is what produced the wrong chips."""
    m = re.search(r"\{([^{}]*)\}", tok)
    if not m:
        return [tok]
    out = []
    for part in m.group(1).split(","):
        out += _expand_braces(tok[:m.start()] + part.strip() + tok[m.end():])
    return out


def cite_tokens(cell: str):
    """The File cell, normalised into candidate path tokens.

    A cell is prose as often as it is a path: `apps/api (DB) + tests`,
    `apps/web/src/features/{cooking,shopping}/**`, `config.py:176-178`. Strip
    the prose, expand the braces, drop the globs and line refs."""
    if not cell or cell in ("—", "-"):
        return []
    clean = re.sub(r"[`*]", " ", cell)
    clean = re.sub(r"\([^)]*\)", " ", clean)        # parenthetical asides
    toks = []
    for raw in re.split(r"[\s,+]+", clean):
        for tok in _expand_braces(raw.strip()):
            tok = tok.split(":")[0]                  # line refs
            tok = re.sub(r"/\*+$", "", tok).strip("/ ")
            if tok and "/" in tok or tok.endswith((".py", ".ts", ".tsx",
                                                   ".json", ".mjs")):
                toks.append(tok)
    return toks


def entities_for(file_cell: str):
    """EVERY entity whose archmap files this cell touches — a SET, not a guess.

    Option C (operator ruling 2026-07-25). The previous matcher fell back to a
    filename, then to a bare path keyword, and returned ONE slug. About half of
    those keyword guesses were wrong: a layout fix-list spanning auth+profile
    screens was chipped `pantry` because the word appeared somewhere in the
    cell. A confidently wrong entity chip is worse than an honest "cross-
    cutting", so every match here is path-derived or it does not happen.

    Returns (slugs_by_weight, matched_paths). Empty list = cross-cutting, which
    is a real answer and not a failure."""
    weight, matched = Counter(), []
    for tok in cite_tokens(file_cell):
        for path, slug in FILE_OWNER.items():
            # exact file, or a directory prefix that really is a directory
            if path == tok or path.startswith(tok.rstrip("/") + "/"):
                weight[slug] += 1
                matched.append(path)
    # basename fallback, still a PATH fact: the cell named a real file, just
    # without its directory. Only counted when the basename is unambiguous.
    if not weight:
        by_stem = {}
        for path, slug in FILE_OWNER.items():
            by_stem.setdefault(path.rsplit("/", 1)[-1], set()).add(slug)
        for tok in cite_tokens(file_cell):
            stem = tok.rsplit("/", 1)[-1]
            owners = by_stem.get(stem)
            if owners and len(owners) == 1:
                slug = next(iter(owners))
                weight[slug] += 1
                matched.append(stem)
    slugs = [s for s, _ in weight.most_common()]
    # A citation that sweeps in most of the registry is not an attribution.
    # `apps/web/src` really does contain every entity's files, so prefix-matching
    # it returns all 7 — technically true and completely uninformative. Past
    # half the registry the honest label is cross-cutting. (matched_paths is
    # kept: the line counts behind it still price the effort correctly.)
    if len(slugs) > max(2, len(LABELS) // 2):
        return [], matched
    return slugs, matched


# AREA — the second, orthogonal label axis: WHERE the work lives, as opposed to
# WHICH entity it serves. A tooling debt has no entity and that is not a gap in
# the data; it is the honest answer. Derived from the cited path, never authored.
# Matched on path SEGMENTS, not on prefixes. The twins do not share a layout —
# gustify puts its services under `apps/api` and `apps/web`, gastify under
# `backend/` and `web/`. Prefix rules written against one twin silently label
# the other's entire codebase "tooling", which is how gastify first came out
# 69-of-96 cross-cutting with zero app-code rows.
AREA_BY_SEGMENT = {
    "api": "api", "backend": "api", "server": "api",
    "web": "web", "frontend": "web", "client": "web",
    "mobile": "mobile", "app": "mobile",
    "scripts": "tooling", "tools": "tooling", "bin": "tooling",
    ".kdbp": "process", "docs": "docs", ".github": "ci",
    "data": "data", "shared": "shared", "packages": "shared",
    "infra": "infra", "deploy": "infra",
}


def area_of(cell: str):
    """WHERE the work lives, from the first segment that names a known area."""
    if not cell or cell in ("—", "-"):
        return None
    for tok in cite_tokens(cell) or [re.sub(r"[`*]", "", cell)]:
        segs = [s for s in tok.split("/") if s]
        # e2e is a tests/ subdivision and must win over the generic tests label
        if any(s.startswith("web-e2e") or s == "e2e" for s in segs):
            return "e2e"
        if segs and segs[0] == "tests":
            return "tests"
        for s in segs:
            if s in AREA_BY_SEGMENT:
                return AREA_BY_SEGMENT[s]
    return None


def as_date(stamp):
    """The first ISO date in `stamp`, whatever surrounds it."""
    if not stamp:
        return None
    m = re.search(r"(20\d\d)-(\d\d)-(\d\d)", str(stamp))
    if not m:
        return None
    try:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None


def days_since(stamp):
    d = as_date(stamp)
    return (TODAY - d).days if d else None


# --------------------------------------------------------------------------- #
# THE LEDGER — the only per-phase clock the projects keep.
#
# PLAN.md records what a phase IS and which cells are ticked; it records no
# dates at all. LEDGER.md records one dated row per command checkpoint, and a
# fair number of those rows name their phase. That is enough to answer "when
# was this last touched" for a build card, and "when did it finish" for a done
# one — without inventing a timestamp or shelling out to git.
# --------------------------------------------------------------------------- #
def ledger_events():
    texts = []
    for p in [KDBP / "LEDGER.md"] + sorted((KDBP / "archive").glob("LEDGER*.md")
                                           if (KDBP / "archive").is_dir() else []):
        if p.exists():
            texts.append(p.read_text())
    out = []
    for txt in texts:
        for ln in txt.split("\n"):
            if not re.match(r"^\|\s*20\d\d-\d\d-\d\d\s*\|", ln):
                continue
            c = [x.strip() for x in ln.strip().strip("|").split("|")]
            d = as_date(c[0])
            if d:
                out.append({"date": d, "kind": c[1] if len(c) > 1 else "",
                            "text": " ".join(c[2:4]) if len(c) > 2 else ""})
    return out


LEDGER = ledger_events()

# phase id -> {first, last} activity dates
PHASE_CLOCK = {}
for _ev in LEDGER:
    for _m in re.finditer(r"\bP?(?:hase\s+)?(P\d+(?:\.\d+)?|\b\d{1,2}(?:\.\d+)?\b)",
                          _ev["text"]):
        _pid = _m.group(1)
        slot = PHASE_CLOCK.setdefault(_pid, {"first": _ev["date"],
                                             "last": _ev["date"]})
        slot["first"] = min(slot["first"], _ev["date"])
        slot["last"] = max(slot["last"], _ev["date"])


def phase_clock(pid: str):
    """Activity window for a phase, tolerating `P4` vs bare `4` id styles."""
    return PHASE_CLOCK.get(pid) or PHASE_CLOCK.get("P" + pid.lstrip("P")) \
        or PHASE_CLOCK.get(pid.lstrip("P"))


cards = []


def add(**kw):
    kw.setdefault("entity", None)
    kw.setdefault("entities", [kw["entity"]] if kw.get("entity") else [])
    kw.setdefault("area", None)
    kw.setdefault("confidence", "exact")
    kw.setdefault("priority", None)
    kw.setdefault("gate", None)
    kw.setdefault("ripe", False)
    kw.setdefault("ripe_why", "")
    # --- the time dimension ------------------------------------------------
    # `created` is when the item entered the board, `closed` when it left it.
    # Both are ISO strings or None; None is common and honest (a PLAN phase
    # carries no creation date anywhere in the repo) and renders as "undated"
    # rather than as a fabricated zero.
    kw.setdefault("done", False)
    kw.setdefault("created", None)
    kw.setdefault("closed", None)
    kw.setdefault("last_activity", None)
    _c, _x = as_date(kw.get("created")), as_date(kw.get("closed"))
    kw["age_days"] = (TODAY - _c).days if _c else None
    kw["closed_days"] = (TODAY - _x).days if _x else None
    kw["cycle_days"] = (_x - _c).days if (_c and _x) else None
    kw.setdefault("age", None)
    kw.setdefault("inferred", [])
    cards.append(kw)


# --------------------------------------------------------------------------- #
# TRACK 1 — verify: an entity's evidence awaits a human eye
# --------------------------------------------------------------------------- #
walks = []
wpath = KDBP / "walks.jsonl"
if wpath.exists():
    walks = [json.loads(ln) for ln in wpath.read_text().splitlines() if ln.strip()]
walked = {w["subject"] for w in walks if w.get("result") == "pass"}

for s in adoption["sections"]:
    slug = s["entity"]
    checklist = s.get("checklist", {})
    unchecked = [k for k, v in checklist.items() if not v]
    if s.get("status") == "approved" and not unchecked:
        continue
    only_walk = unchecked == ["walk_recorded"]
    add(
        id=f"verify:{slug}",
        track="verify",
        entity=slug,
        title=f"Walk & approve {LABELS[slug]}",
        detail=(
            "Checklist is complete — the page is built, the gate is green, the "
            "proofs are curated. What's left is one human walk."
            if only_walk else
            "Adoption owes: " + ", ".join(k.replace("_", " ") for k in unchecked)),
        # only the operator can clear a walk — nobody else, ever
        state="owed_to_you",
        owes=unchecked,
        checklist_done=sum(1 for v in checklist.values() if v),
        checklist_total=len(checklist),
        rank=s.get("rank"),
        ripe=only_walk,
        ripe_why=("6/7 checklist items are already true; the remaining act is a "
                  "single /gabe-walk" if only_walk else ""),
        effort="XS" if only_walk else "M",
        effort_basis=("checklist arithmetic — 1 unchecked item, and it is a walk"
                      if only_walk else
                      f"{len(unchecked)} unchecked checklist items"),
        area="product",
        created=(_adopted.group(1) if (_adopted := re.search(
            r"[Aa]dopted (20\d\d-\d\d-\d\d)", str(s.get("notes") or "")))
            else adoption.get("started")),
        href=f"feature-{slug}.html",
        source=".kdbp-adjacent · adoption.json §sections",
    )

# Every recorded walk is finished verification. adoption.json says an entity is
# approved; walks.jsonl says WHO looked, WHEN, and what they concluded — which
# is the part worth showing back under "what did I get done".
for _w in walks:
    _subj = str(_w.get("subject", ""))
    _slug = _subj.split(":", 1)[-1]
    add(
        id=f"walk:{_subj}:{_w.get('when','')}",
        track="verify",
        entity=(_slug if _slug in LABELS else None),
        title=f"Walked {LABELS.get(_slug, _subj)}"
              + (" — section approved" if _subj.startswith("adopt:") else ""),
        detail=(str(_w.get("note") or "")[:200]
                or f"result: {_w.get('result')}"),
        state="done",
        done=True,
        closed=str(_w.get("when") or ""),
        created=str(_w.get("when") or ""),
        walker=_w.get("who"),
        result=_w.get("result"),
        area="product",
        effort=None,
        effort_basis="",
        href=f"feature-{_slug}.html",
        source=".kdbp/walks.jsonl",
    )

# --------------------------------------------------------------------------- #
# TRACK 2 — prove: a named flow no test claims (born-red candidates)
# --------------------------------------------------------------------------- #
for slug, cov in archmap.get("coverage", {}).items():
    unproven = cov.get("unproven", [])
    if not unproven:
        continue
    proven = cov.get("covered", 0)
    add(
        id=f"prove:{slug}",
        track="prove",
        entity=slug,
        title=f"{len(unproven)} unproven flow(s) on {LABELS.get(slug, slug)}",
        detail="No test claims: " + ", ".join(unproven),
        state="ready",
        flows=unproven,
        covered=proven,
        total=cov.get("total", 0),
        golden=f"{cov.get('golden_covered', 0)}/{cov.get('golden_total', 0)}",
        # scaffolding already exists when siblings are proven — the cheapest red
        ripe=proven > 0,
        ripe_why=(f"{proven} sibling flow(s) already have claiming tests — the "
                  "corpus + fixtures exist, only the case is missing"
                  if proven else ""),
        effort="S" if proven else "M",
        effort_basis=(f"{proven}/{cov.get('total', 0)} flows already claimed on "
                      "this entity"),
        area="tests",
        href=f"feature-{slug}.html",
        source="archmap.json §coverage",
    )

# --------------------------------------------------------------------------- #
# TRACK 3 — build: PLAN phases with owed lifecycle cells
# --------------------------------------------------------------------------- #
CELLS = ["Red", "Exec", "Review", "Commit", "Push", "Center"]
GLYPH = {"✅": "done", "🔄": "in_progress", "⬜": "todo", "⏸": "paused",
         "—": "n/a", "-": "n/a"}


def md_tables(text):
    """Every markdown table in `text`, as (headers, [row-dicts]).

    Header-driven on purpose. The two twins do NOT share a column set —
    gustify's PLAN carries a `Types` column and its PENDING carries `Verified`;
    gastify's carry neither, and its phase ids are bare integers. A parser
    keyed on column POSITION reads one twin and silently returns nothing for
    the other, which is the worst failure mode available: a clean exit and an
    empty board.
    """
    lines = text.split("\n")

    def is_row(i):
        s = lines[i].strip()
        return s.startswith("|") and s.endswith("|") and len(s) > 1

    def is_sep(i):
        if not (0 <= i < len(lines)) or not is_row(i):
            return False
        return all(set(c) <= set("-: ") and c
                   for c in lines[i].strip().strip("|").split("|"))

    tables, hdr, rows = [], None, []
    for i in range(len(lines)):
        if not is_row(i):
            continue                      # comments/blank lines do NOT end a
            # table: gustify interleaves HTML comments between PENDING rows,
            # and treating that as a break made the row after it look like a
            # new header — silently truncating the table at 45 of 85 rows.
        if is_sep(i):
            continue
        cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
        # A header is a row FOLLOWED BY a |---| separator. That is the only
        # reliable signal; column count and content are not.
        if is_sep(i + 1):
            if hdr:
                tables.append((hdr, rows))
            hdr, rows = cells, []
            continue
        if hdr is None:
            continue
        rows.append(dict(zip(hdr, cells + [""] * (len(hdr) - len(cells)))))
    if hdr:
        tables.append((hdr, rows))
    return tables


def pick_table(text, *required):
    """The first table whose header carries every required column."""
    for hdr, rows in md_tables(text):
        if all(any(r.lower() == h.strip().lower() for h in hdr)
               for r in required):
            return rows
    return []


plan_txt = (KDBP / "PLAN.md").read_text()
plan_rows = pick_table(plan_txt, "#", "Exec", "Review", "Commit")

# The rail the old board.html drew is the one thing the card board does NOT
# subsume: a card exists only while a phase still owes a cell, so finished
# phases vanish and the sequence disappears with them. Keep every phase here,
# state included, and render it as one compact strip (operator ruling, Q3).
phase_seq = []
for row in plan_rows:
    _pid = row.get("#", "").strip()
    if not _pid or not re.match(r"^P?[\d.]+$", _pid):
        continue
    _cells = {k: GLYPH.get(row.get(k, "").strip(), "todo") for k in CELLS
              if k in row}
    _owed = [k for k, v in _cells.items() if v in ("todo", "in_progress")]
    phase_seq.append({
        "id": _pid,
        "name": row.get("Phase", "").strip(),
        "state": ("done" if not _owed
                  else "inflight" if any(v == "done" for v in _cells.values())
                  else "todo"),
        "owes": _owed,
        "cells": _cells,
        # the strip is one glyph per phase, so everything a reader would want
        # on clicking it has to be carried here — the row's own columns
        "desc": re.sub(r"[`*]", "", row.get("Description", "").strip()),
        "tier": row.get("Tier", "").strip(),
        "complexity": row.get("Complexity", "").strip(),
        "types": [t.strip() for t in row.get("Types", "").split(",") if t.strip()],
    })

for row in plan_rows:
    pid = row.get("#", "").strip()
    if not pid or not re.match(r"^P?[\d.]+$", pid):
        continue
    name = row.get("Phase", "").strip()
    desc = row.get("Description", "").strip()
    types = row.get("Types", "").strip()
    tier = row.get("Tier", "").strip()
    complexity = row.get("Complexity", "").strip()
    cellmap = {k: GLYPH.get(row.get(k, "").strip(), "todo") for k in CELLS
               if k in row}
    owed = [k for k, v in cellmap.items() if v in ("todo", "in_progress")]
    _clk0 = phase_clock(pid)
    if not owed:
        add(
            id=f"build:{pid}", track="build", entity=None,
            title=f"{pid} — {name}", detail=desc,
            state="done", done=True, cells=cellmap, owes=[],
            tier=tier, complexity=complexity,
            types=[t.strip() for t in types.split(",") if t.strip()],
            effort=None, effort_basis="",
            area=("web" if "user-facing" in types else
                  "api" if "persistence" in types else "process"),
            created=(_clk0["first"].isoformat() if _clk0 else None),
            closed=(_clk0["last"].isoformat() if _clk0 else None),
            href="board.html", source=".kdbp/PLAN.md §Phases",
        )
        continue
    started = any(v == "done" for v in cellmap.values())
    inflight = any(v == "in_progress" for v in cellmap.values())
    _clk = phase_clock(pid)
    add(
        id=f"build:{pid}",
        track="build",
        entity=None,
        title=f"{pid} — {name}",
        detail=desc,
        state="inflight" if (started or inflight) else "ready",
        cells=cellmap,
        owes=owed,
        tier=tier,
        complexity=complexity,
        types=[t.strip() for t in types.split(",")],
        ripe=len(owed) == 1,
        ripe_why=(f"only the {owed[0]} cell is unticked — one beat closes the "
                  "phase" if len(owed) == 1 else ""),
        effort={1: "S", 2: "M"}.get(len(owed), "L"),
        effort_basis=f"{len(owed)} of {len(cellmap)} lifecycle cells unticked",
        area=("web" if "user-facing" in types else
              "api" if "persistence" in types else "process"),
        created=(_clk["first"].isoformat() if _clk else None),
        last_activity=(_clk["last"].isoformat() if _clk else None),
        href="board.html",
        source=".kdbp/PLAN.md §Phases",
    )

# --------------------------------------------------------------------------- #
# TRACK 4 — debt: open PENDING rows
# --------------------------------------------------------------------------- #
pend_txt = (KDBP / "PENDING.md").read_text()
# The optional INDEX table carries the Gate column; gastify has no index table
# at all, so a missing gate is "ungated", never "skip the row".
gate_by_id = {}
for row in pick_table(pend_txt, "#", "Gate", "Finding"):
    g = row.get("Gate", "").strip()
    gate_by_id[row["#"].lstrip("#").strip()] = (
        g if g not in ("—", "-", "") else None)

# The twins do not agree on how a row is marked DONE. gustify writes a verdict
# token into the Status cell (STILL-REAL / CLOSED / RESOLVED); gastify leaves
# Status empty and writes an HTML comment on the line AFTER the row
# (`<!-- P1 resolved 2026-06-11: obsolete … -->`). Read both — a board that
# only knows one convention shows a twin its finished work as open moves.
# Keep the DATE the comment carries, not just the fact of it: gastify has no
# Verified column, so the comment is the only record of when a row closed —
# and an undated done card cannot be sorted by recency, which is the whole
# point of showing it.
resolved_by_comment = {}
for _m in re.finditer(
        r"<!--\s*([A-Za-z]?\d+)\s+(?:resolved|closed|done)\b([^>]*)-->",
        pend_txt, re.I):
    resolved_by_comment[_m.group(1)] = as_date(_m.group(2))

seen_full = set()


def emit_debt(row, resolved_ids, src, archived=False):
    """One PENDING row → one card, open or done.

    Closed rows are not dropped any more: "what did I finish" is a question the
    board should answer, and the resolution date is already recorded (in the
    Verified column, in the Status prose, or by the archive file itself)."""
    rid = row.get("#", "").lstrip("#").strip()
    if not re.match(r"^[A-Za-z]?\d+$", rid) or rid in seen_full:
        return
    seen_full.add(rid)
    rdate = row.get("Date", "").strip()
    rsource = row.get("Source", "").strip()
    finding = row.get("Finding", "").strip()
    rfile = row.get("File", "").strip()
    tier = row.get("Scale", "").strip()
    pri = row.get("Priority", "").strip()
    impact = row.get("Impact", "").strip()
    deferred = row.get("Times Deferred", "").strip()
    status = row.get("Status", "").strip()
    su = status.upper()
    # STILL-REAL is gustify's post-reconcile verdict token. An EMPTY Status is
    # not "unknown, skip it" — in gastify's convention it means the row was
    # never closed, and the comment sweep above already removed the ones that
    # were. Only an explicit closing token excludes a row.
    is_done = archived or (rid in resolved_ids) or bool(
        su.strip()
        and any(t in su for t in ("CLOSED", "RESOLVED", "WONT-DO",
                                  "WON'T-DO", "SUPERSEDED"))
        and "STILL-REAL" not in su)
    # When it closed: the Verified column carries `<sha> <date>`, and failing
    # that the Status prose usually names the date it was resolved on.
    closed_on = (row.get("Verified", "") if is_done else "") or ""
    closed_on = (as_date(closed_on) or as_date(status)
                 or (resolved_ids.get(rid)
                     if isinstance(resolved_ids, dict) else None)
                 or (as_date(src) if is_done else None))
    gate = gate_by_id.get(rid)
    pri_norm = pri.split("(")[0].strip().lower()
    slugs, matched_paths = entities_for(rfile)
    clean = re.sub(r"[*`]", "", finding)
    clean = re.sub(r"^\[[a-z\-]+\]\s*", "", clean)
    tag = re.match(r"^\[([a-z\-]+)\]", finding)
    single_file = bool(rfile) and not re.search(r"[,+]|\*\*", rfile) \
        and rfile not in ("—", "-")
    ndefer = int(deferred) if deferred.isdigit() else 0

    # REAL effort signal: the line count of every archmap-known file this row
    # cites. A row landing in a 1,400-line god file is not a quick fix, and the
    # center already knows the number — no estimation required.
    known = [(p, FILE_LINES[p]) for p in matched_paths if p in FILE_LINES]
    biggest = max((n for _, n in known), default=None)
    if biggest is None:
        eff, basis = ("S" if single_file else "M"), (
            "single file cited" if single_file else "multiple files / glob cited")
    elif biggest <= 300:
        eff, basis = "S", f"largest cited file is {biggest} lines"
    elif biggest <= 800:
        eff, basis = "M", f"largest cited file is {biggest} lines"
    else:
        eff, basis = "L", (f"largest cited file is {biggest} lines — past the "
                           "800-line budget")

    ripe = (single_file and ndefer == 0 and not gate
            and pri_norm == "low" and eff == "S")
    _ = tier
    add(
        id=f"debt:{rid}",
        track="debt",
        entity=(slugs[0] if slugs else None),   # primary = most files matched
        entities=slugs,                          # the full set; may be 2+
        entity_how=(f"{len(set(matched_paths))} archmap path(s) matched"
                    if slugs else "no archmap path in the File cell"),
        area=area_of(rfile),
        # Every attribution is now path-derived or absent. There is no third
        # state, so there is nothing left to hedge about.
        confidence=("exact" if slugs else "none"),
        title=f"#{rid} {clean[:88]}",
        detail=impact[:200],
        state=("done" if is_done else "blocked" if gate else "ready"),
        done=is_done,
        closed=(closed_on.isoformat() if closed_on else None),
        priority=pri_norm,
        gate=gate,
        kind=tag.group(1) if tag else None,
        file=rfile,
        deferred=ndefer,
        tier=tier,
        created=rdate,
        origin=rsource,
        ripe=ripe and not is_done,
        ripe_why=(f"one cited file ({biggest} lines), never deferred, no gate "
                  "— a contained low-priority fix" if ripe else ""),
        effort=eff,
        effort_basis=basis,
        cited_lines=biggest,
        inferred=([] if biggest is not None else ["effort"]),
        href="board.html",
        source=src,
    )


# live file first — its open rows are the board's debt lane
for _row in pick_table(pend_txt, "#", "Finding", "Priority"):
    emit_debt(_row, resolved_by_comment, ".kdbp/PENDING.md §Rows")

# then the archive: rows lifted out of the live file once resolved. Skipping
# these would make the Done view claim the project finished far less than it did.
for _arch in sorted((KDBP / "archive").glob("PENDING-resolved*.md")
                    if (KDBP / "archive").is_dir() else []):
    _txt = _arch.read_text()
    for _row in pick_table(_txt, "#", "Finding", "Priority"):
        emit_debt(_row, {}, f".kdbp/archive/{_arch.name}", archived=True)

# --------------------------------------------------------------------------- #
# TRACK 5 — arc: SCOPE phases not yet pulled into a plan (the long horizon)
# --------------------------------------------------------------------------- #
# The arc lives in SCOPE.md §Phases once a project has folded its roadmap in
# (gustify, 2026-07-09). Projects that have not yet folded still keep it in
# ROADMAP.md (gastify) — read whichever exists rather than assuming the newer
# shape and reporting "no long horizon" for the older one.
arc_txt, arc_src = "", ""
scope_txt = (KDBP / "SCOPE.md").read_text() if (KDBP / "SCOPE.md").exists() else ""
if "## Phases" in scope_txt:
    arc_txt, arc_src = scope_txt.split("## Phases", 1)[1], ".kdbp/SCOPE.md §Phases"
elif (KDBP / "ROADMAP.md").exists():
    arc_txt, arc_src = (KDBP / "ROADMAP.md").read_text(), ".kdbp/ROADMAP.md"

def col(row, *names):
    """First present column among `names` — the arc table is spelled
    `ID | Name | Covers REQs | Depends-on` in a folded SCOPE (gustify) and
    `# | Phase | REQs | Depends on` in a standalone ROADMAP (gastify)."""
    for n in names:
        for k, v in row.items():
            if k.strip().lower() == n.lower():
                return v.strip()
    return ""


for row in pick_table(arc_txt, "Status"):
    aid = col(row, "ID", "#").lstrip("P").strip()
    if not re.match(r"^[\d.]+$", aid):
        continue
    aname = re.sub(r"[*`]", "", col(row, "Name", "Phase"))
    astatus = col(row, "Status").lower()
    _arc_done = astatus in ("complete", "completed", "done")
    depends = col(row, "Depends-on", "Depends on") or "—"
    parallel = col(row, "Parallel-with", "Parallel with") or "—"
    reqs = col(row, "Covers REQs", "REQs")
    reqcount = len(re.findall(r"REQ-\d+", reqs))
    add(
        id=f"arc:{aid}",
        track="arc",
        entity=None,
        title=f"Arc {aid} — {aname}",
        detail=(f"{reqcount} REQ(s) · depends on {depends}"
                + (f" · parallel with {parallel}" if parallel != "—" else "")),
        state=("done" if _arc_done else
               "parked" if astatus == "pending" else "inflight"),
        done=_arc_done,
        arc_status=astatus,
        depends=depends,
        parallel=parallel,
        reqs=reqcount,
        effort="L",
        effort_basis="a whole scope phase — plan it before you price it",
        area="product",
        href="board.html",
        source=".kdbp/SCOPE.md §Phases",
    )

# --------------------------------------------------------------------------- #
# TRACK 6 — flows: adoption-declared flows and their build state
# --------------------------------------------------------------------------- #
for key, f in adoption.get("flows", {}).items():
    if key.startswith("_"):
        continue
    blob = json.dumps(f) if isinstance(f, (dict, list)) else str(f)
    # A flow that EXISTS is not a move. Only an unbuilt flow earns a card —
    # a board that lists finished work is a report, not a board.
    if "NOT BUILT" not in blob.upper():
        continue
    label = key.split("_", 1)[1].replace("_", " → ") if "_" in key else key
    # the flow note names its own missing pieces — count them, don't paraphrase
    pieces = re.search(r"(\d+) named missing pieces?:([^.]+)", blob)
    npieces = int(pieces.group(1)) if pieces else 0
    add(
        id=f"flow:{key}",
        track="build",
        entity=None,
        title=f"Flow not built — {label}",
        detail=(f"{npieces} named missing pieces:{pieces.group(2).strip()}"
                if pieces else blob[:180]),
        state="ready",
        ripe=False,
        born_red=True,
        pieces=npieces,
        effort="L",
        effort_basis=(f"{npieces} named missing pieces, none built"
                      if npieces else "unbuilt flow"),
        area="product",
        href="index.html",
        source="adoption.json §flows",
        flow_built=False,
    )

# --------------------------------------------------------------------------- #
out = {
    "project": config["project"]["display_name"],
    "head": archmap.get("head"),
    "generated": archmap.get("generated"),
    "today": TODAY.isoformat(),
    "labels": LABELS,
    "phase_seq": phase_seq,
    "cards": cards,
}
print(json.dumps(out, indent=1))
_open = [c for c in cards if not c["done"]]
_done = [c for c in cards if c["done"]]
print(f"\n// {len(cards)} cards — {len(_open)} open, {len(_done)} done",
      file=sys.stderr)
print("// done by track: " + str(Counter(c["track"] for c in _done)),
      file=sys.stderr)
print("// dated done: "
      + str(sum(1 for c in _done if c["closed"])) + f"/{len(_done)}",
      file=sys.stderr)
print("// by track: " + str(Counter(c["track"] for c in cards)), file=sys.stderr)
print("// by state: " + str(Counter(c["state"] for c in cards)), file=sys.stderr)
print("// ripe: " + str(sum(1 for c in cards if c["ripe"])), file=sys.stderr)
print("// unattributed debt: "
      + str(sum(1 for c in cards if c["track"] == "debt" and not c["entity"])),
      file=sys.stderr)
