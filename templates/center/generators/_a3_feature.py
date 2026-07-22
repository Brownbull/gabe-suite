#!/usr/bin/env python3
"""A3 per-entity feature pages — built FROM the shipped feature.html skeleton.

Split out of build_center_a3.py (size budget). The card supplies the authored
translation; every count rendered beside it is machine-read at build time.

Diagrams render as a PICKER (radio + CSS sibling selectors, no script) rather
than three stacked figures: one diagram at a time, chosen by name. The
change-highlight classDef inside each mermaid source is preserved untouched.
"""

from __future__ import annotations

import glob
import re
from pathlib import Path

import _center_data as _cd
import _center_mermaid as M
from _a3_code import build_code_tab
from _a3_evidence import build_evidence_tab, collect_set, is_reference
from _a3_render import (
    E,
    card_html,
    gap,
    kpi,
    legend,
    md,
    meter,
    pmore,
    sechead,
    strip_slot_doc_comments,
    subnav,
    table,
)

_IC_CHECK = ('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>'
             '<polyline points="22 4 12 14.01 9 11.01"/>')
_IC_ALERT = ('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 '
             '1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'
             '<line x1="12" y1="9" x2="12" y2="13"/>'
             '<line x1="12" y1="17" x2="12.01" y2="17"/>')
_IC_COMMIT = ('<circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/>'
              '<line x1="17.01" y1="12" x2="22.96" y2="12"/>')
_IC_GRID = ('<rect x="3" y="3" width="18" height="18" rx="2"/>'
            '<line x1="3" y1="9" x2="21" y2="9"/>'
            '<line x1="3" y1="15" x2="21" y2="15"/>'
            '<line x1="12" y1="3" x2="12" y2="21"/>')
_IC_INBOX = ('<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>'
             '<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 '
             '2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>')
_IC_DOC = ('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>'
           '<polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>'
           '<line x1="16" y1="17" x2="8" y2="17"/>')
_IC_FLOW = ('<rect x="3" y="3" width="7" height="7" rx="1"/>'
            '<rect x="14" y="14" width="7" height="7" rx="1"/>'
            '<path d="M6.5 10v4a2 2 0 0 0 2 2h5"/>')
_IC_SEED = ('<path d="M12 22V12"/><path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 8z"/>'
            '<path d="M12 16c0-3-2.5-5.5-6-5.5 0 3.5 2.5 6 6 6z"/>')
_SEV_CLS = {"high": "s-high", "medium": "s-med", "low": "s-low",
            "gap": "s-gap", "mitigated": "s-ok", "malformed": "s-high"}
# A malformed line sorts FIRST: an unreadable risk row is the most urgent thing
# on a register, because nobody can tell what it was meant to say.
_SEV_ORDER = {"malformed": -1, "high": 0, "medium": 1, "low": 2, "gap": 3,
              "mitigated": 4}

# Which test files belong to an entity (broad on purpose: an over-match shows up
# as a visible row, an under-match silently hides coverage) and which proof sets
# a feature page shows — both read from center.config.json `entities.<slug>`, so
# the mapping lives with the project, not in this generator source.
_ENTITIES = _cd.CFG.get("entities", {})
ENTITY_RX = {slug: e["test_rx"] for slug, e in _ENTITIES.items() if e.get("test_rx")}
ENTITY_PROOFS = {slug: e["proofs"] for slug, e in _ENTITIES.items() if e.get("proofs")}
DIAGRAMS = (("DIAGRAM USERFLOW", "Userflow"),
            ("DIAGRAM DATAFLOW", "Dataflow"),
            ("DIAGRAM WORKFLOW", "Workflow"))


def entity_corpus(rx: str, junit_by: dict, corpora: list) -> dict:
    """Per-corpus test files matching the entity — counts are machine-read.
    Keyed by each declared corpus key, so nothing here names a specific suite."""
    pat = re.compile(rx, re.I)
    out: dict[str, dict] = {}
    for c in corpora:
        j = junit_by.get(c["key"])
        hits = {f: r for f, r in (j or {}).get("files", {}).items() if pat.search(f)}
        out[c["key"]] = {
            "files": hits,
            "cases": sum(r["tests"] for r in hits.values()),
            "failed": sum(r["failed"] for r in hits.values()),
            "skipped": sum(r["skipped"] for r in hits.values()),
        }
    return out


# A case id is the join between a CLAIMED case (card / red-spec) and a RUNNING
# one (junit). Anchored so `C1349` matches but `ABC12` and `C13490` do not.
_CID_RX = re.compile(r"(?<![A-Za-z0-9])C([0-9]{1,5})(?![0-9])")
_STATE_CHIP = {"pass": ('<span class="tag s-ok">pass</span>'),
               "fail": ('<span class="tag s-high">fail</span>'),
               "skip": ('<span class="tag s-gap">skip</span>')}


def case_rows(rec: dict, corpus: str) -> str:
    """One file's cases, with the characteristics junit actually carries:
    the C-id that joins it to a claim, the group it belongs to (pytest class /
    vitest describe), its own name, runtime and state."""
    rows = ""
    # Junit order IS the order the suite ran them; sorting by name replaced a
    # real fact with an alphabetical one that reads exactly like it.
    for i, c in enumerate(rec["cases"], 1):
        name = c["name"]
        group = ""
        if corpus == "api":
            tail = c.get("cls", "").rsplit(".", 1)[-1]
            group = tail if tail[:1].isupper() else ""
        elif ">" in name:                       # vitest: "Describe > case name"
            group, _, name = (p.strip() for p in name.rpartition(">"))
        cid = _CID_RX.search(name)
        cid_cell = (f'<span class="cid">C{cid.group(1)}</span>' if cid
                    else '<span class="cid none">—</span>')
        # The id is shown as an id, then stripped from the prose it prefixes.
        label = _CID_RX.sub("", name).strip(" ·-_[]").replace("_", " ")
        rows += (
            f'<tr><td class="num">{i}</td>'
            f"<td>{cid_cell}</td>"
            f"<td>{E(label) or E(name)}</td>"
            f'<td><small>{E(group) or "—"}</small></td>'
            f'<td class="num">{c["time"]:.2f}s</td>'
            f'<td>{_STATE_CHIP.get(c["state"], "")}</td></tr>')
    return (f'<table class="tbl"><thead><tr><th class="num">#</th><th>Case id</th>'
            f"<th>What it asserts</th><th>Group</th><th class=\"num\">Time</th>"
            f"<th>State</th></tr></thead><tbody>{rows}</tbody></table>")


def kind_state(c: dict) -> str:
    """What the machine can say about a kind right now — never a bare 'ok'."""
    if not c["cases"]:
        return '<span class="tag s-gap">no cases matched</span>'
    if c["failed"]:
        return f'<span class="tag s-high">{c["failed"]} failing</span>'
    if c["skipped"]:
        return f'<span class="tag s-med">{c["skipped"]} skipped</span>'
    return '<span class="tag s-ok">captured at HEAD</span>'


# The Kinds table says HOW MUCH; the card says WHAT FOR. Same vocabulary, same
# colors — so the description behind ⊕ reads as the table's own footnote.
_KIND_CLS = {"integration": "l-api", "unit": "l-web", "journey": "l-mobile",
             "coverage": "l-models", "manual": "l-services",
             "deployed": "l-schemas", "evidence": "l-evidence"}


def angles_html(lines: list[str]) -> str:
    """The card's per-kind INTENT, rendered inside the section's ⊕ toggle with
    the kind chips the table above already uses. Counts never live here — they
    are machine-read; a bullet that restates one would drift on the next run."""
    lead = [ln.strip() for ln in lines
            if ln.strip() and not ln.strip().startswith("- ")]
    out = "".join(f'<p>{md(t)}</p>' for t in lead)
    rows = ""
    for ln in lines:
        s = ln.strip()
        if not s.startswith("- "):
            continue
        kind, _, text = s[2:].partition("—")
        key = kind.strip().lower()
        cls = _KIND_CLS.get(key)
        if not cls or not text.strip():
            rows += f'<tr><td colspan="2">{md(s[2:])}</td></tr>'
            continue
        rows += (f'<tr><td><span class="tag {cls}">{E(key)}</span></td>'
                 f"<td>{md(text.strip())}</td></tr>")
    if rows:
        out += (f'<table class="tbl" style="margin-top:8px"><thead><tr>'
                f"<th>Kind</th><th>What it is for on this entity</th></tr>"
                f"</thead><tbody>{rows}</tbody></table>")
    return out


# Pricing per growth KIND: what closing it costs to build, at which maturity it
# is worth building, what it buys, and what it costs FOREVER after (every angle
# added is time spent on every future run — a growth list that hides the
# recurring cost sells work nobody budgeted for). Effort is the class, not a
# promise; the stage is read against BEHAVIOR.md's maturity.
_GROWTH_PRICE = {
    "coverage": ("M", "~half a day", "enterprise",
                 "turns “is this tested?” into a number per path — the "
                 "untested lines get named instead of guessed at",
                 "+10–20s on every backend run, and one more artifact that "
                 "goes stale if a run is skipped"),
    "journey": ("S", "~2h", "mvp",
                "the browser walks stop being invisible — a verdict lands "
                "beside the specs instead of “on disk, state unknown”",
                "+2–4 min per full run, and a junit that must be refreshed or "
                "it silently describes an older HEAD"),
    "manual": ("XS", "~15 min", "mvp",
               "the one angle with no machine source gets a dated verdict and "
               "a name against it",
               "one walk per material rewrite — a walk approves a SCOPE, so "
               "reshaping the feature re-opens it"),
    "deployed": ("L", "~2 days", "scale",
                 "catches the gap between what we tested and what is actually "
                 "running — the only angle that can",
                 "a probe suite to keep green, prod data hygiene per run, and "
                 "a new class of flake to triage"),
    "integration": ("M", "~half a day", "mvp",
                    "the entity gets a failing-first record of what it must do "
                    "through its own HTTP surface",
                    "+~0.1s per case on every backend run, forever"),
    "unit": ("S", "~2h", "mvp",
             "the renderer family gets pinned against regressions that no "
             "API test can see",
             "+~0.05s per case on every web run, forever"),
    "evidence": ("S", "~1h", "mvp",
                 "the claim becomes something a person can look at and judge, "
                 "not a sentence to be believed",
                 "re-capture whenever the screen changes — shots rot faster "
                 "than assertions"),
}
_EFFORT_CLS = {"XS": "e-xs", "S": "e-s", "M": "e-m", "L": "e-l"}
_STAGE_CLS = {"mvp": "st-mvp", "enterprise": "st-ent", "scale": "st-scale"}


def growth_rows(slug: str, inv: dict, specs: list[str], walks: list[dict],
                section: dict, proof_root, corpora: list, e2e: dict) -> list[list[str]]:
    """What would RAISE this entity's verification, priced.

    Every row is derived from a gap the page already shows — the growth list is
    the gap list stated as work, never a wish list. Alongside the gap it prints
    the cost to close, the maturity stage it belongs to, what it buys, and what
    it then costs on every run afterwards: an opportunity without its recurring
    cost is a sales pitch."""
    rows: list[list[str]] = []

    def row(kind: str, what: str) -> None:
        eff, hours, stage, gain, cost = _GROWTH_PRICE[kind]
        rows.append([
            f'<span class="tag {_KIND_CLS.get(kind, "s-gap")}">{E(kind)}</span>',
            pmore(what, 130),
            f'<span class="tag {_EFFORT_CLS[eff]}">{eff}</span>'
            f"<br><small>{E(hours)}</small>",
            f'<span class="tag {_STAGE_CLS[stage]}">{E(stage)}</span>',
            pmore(gain, 110),
            pmore(cost, 110)])

    for c in corpora:
        corpus, kind = c["key"], c["kind"]
        if not inv[corpus]["cases"]:
            row(kind, f"no {kind} case matches this entity — the corpus has "
                      f"nothing filed under its name")
        if inv[corpus]["skipped"]:
            row(kind, f'{inv[corpus]["skipped"]} skipped case(s) — claimed '
                      f"coverage that does not execute; a skip is a gap wearing "
                      f"a green row")

    _gate = e2e.get("coverage_gate", "the coverage gate")
    row("coverage", f"no per-entity coverage number exists — the repo gate "
                    f"({_gate}) passes but is not sliced by path, so this entity's "
                    f"own executed-line share is unknown")
    _local = e2e.get("local_only_note", "web e2e is local-only")
    if specs:
        row("journey", f"{len(specs)} spec(s) walk this entity in a real "
                       f"browser but leave no machine record — {_local}, so the "
                       f"page cannot show their verdict")
    else:
        row("journey", "no browser spec walks this entity end to end")

    mine = [w for w in walks if w.get("subject") == f"adopt:{slug}"]
    if not mine:
        row("manual", "no human has walked this entity and recorded the verdict "
                      "— the one input on this page with no machine source")
    elif section.get("status") == "awaiting-approval":
        row("manual", f"the recorded walk approved an earlier scope; the "
                      f'tracker reads {section.get("status")} — a walk approves '
                      f"a SCOPE, not a slug")

    row("deployed", "nothing machine-readable probes the deployed surfaces of "
                    "this entity — every artifact on the Evidence tab is a "
                    "capture from a run, not a live check")

    declared = ENTITY_PROOFS.get(slug, [])
    if not declared:
        # No registration at all: the Evidence tab renders a named gap while
        # BOTH price columns stayed silent — the emptiest shelf had no tag.
        row("evidence", "no proof set is registered for this entity — nothing "
                        "on the Evidence tab, and nothing anywhere a reader "
                        "outside the team could look at")
    for name in declared:
        s = collect_set(name, proof_root / name)
        if s["shots"] or s["videos"]:
            continue
        row("evidence", f"proof set `{name}` is declared for this entity but "
                        f'has {"no artifacts on disk" if s["exists"] else "no directory"}')
    return rows


def parse_risks(lines: list[str]) -> list[tuple[str, str, str, str, str]]:
    """Card grammar: `SEV · status · Kind · what is at stake · detail`.

    The stake is what makes a row a RISK rather than a note: severity without
    a consequence is a number nobody can argue with.

    Fields are separated by `·` with a bounded split, so prose may contain any
    punctuation it likes — an earlier version split the stake off at the first
    em-dash and silently truncated every stake that contained one, which the
    grammar practically invites. Older forms still parse: 4 fields fall back to
    splitting the last on its first em-dash, 3 fields yield no stake. A line
    that parses as NONE of these is returned as `malformed` rather than
    dropped — a risk that vanishes because of its punctuation is the worst
    possible failure for a register."""
    out = []
    for ln in lines:
        s = ln.strip().removeprefix("- ")
        if not s:
            continue
        parts = [p.strip() for p in s.split("·", 4)]
        if len(parts) == 5:
            out.append((parts[0], parts[1], parts[2], parts[3], parts[4]))
            continue
        if len(parts) == 4 and "—" in parts[3]:
            stake, _, detail = parts[3].partition("—")
            out.append((parts[0], parts[1], parts[2], stake.strip(), detail.strip()))
            continue
        if len(parts) == 3 and "—" in parts[2]:
            kind, _, detail = parts[2].partition("—")
            out.append((parts[0], parts[1], kind.strip(), "", detail.strip()))
            continue
        out.append(("malformed", "unparsed", "—", "", s))
    return out


def risk_cells(sev: str, status: str, kind: str, stake: str, detail: str,
               link: str = "") -> list[str]:
    stake_cell = (md(stake) if stake
                  else '<span class="tag s-gap">stake not stated</span>')
    return [f'<span class="tag {_SEV_CLS.get(sev.lower(), "")}">{E(sev)}</span>',
            f"<b>{E(kind)}</b>{link}", stake_cell, E(status), md(detail)]


# What each unverified angle actually puts at risk. The gap itself is machine-
# derived; this names the consequence of leaving it open, which is the only
# thing that makes it belong on a risk register.
_GAP_STAKE = {
    "journey": "a browser-only regression — a broken guard, a lost draft — "
               "ships without anything noticing",
    "coverage": "untested code reads exactly like tested code, so the gap is "
                "invisible when deciding what to touch",
    "deployed": "what we tested and what is actually running drift apart "
                "silently between deploys",
    "manual": "nobody has confirmed the built thing matches what this page "
              "says it does",
    "evidence": "nobody outside the team can check the claim — there is "
                "nothing to look at, only prose to be believed",
}
_GROWTH_LINK = ('<br><small><a class="dlink" href="#sec-ov-growth">'
                "priced on the Overview tab → Growth ↗</a></small>")


def unverified_risks(slug: str, inv: dict, specs: list[str], walks: list[dict],
                     section: dict, e2e: dict) -> list[tuple[int, list[str]]]:
    """The angles nothing verifies, as GAP rows on the register.

    They used to sit in their own list beside the table, which said the same
    thing twice without ever saying what was risked. Here each one carries its
    consequence and a link to what closing it would cost."""
    order = _SEV_ORDER["gap"]
    rows: list[tuple[int, list[str]]] = []

    def add(kind: str, status: str, detail: str) -> None:
        rows.append((order, risk_cells("GAP", status, kind, _GAP_STAKE[kind],
                                       detail, _GROWTH_LINK)))

    _local = e2e.get("local_only_note", "web e2e is local-only")
    _gate = e2e.get("coverage_gate", "the coverage gate")
    if specs:
        add("journey", "not captured",
            f"{len(specs)} spec(s) walk this entity in a real browser, but "
            f"{_local} — no junit lands, so the page can show "
            f"the specs and never their verdict.")
    else:
        # Blaming the capture policy for a walk nobody wrote reads as an
        # infrastructure problem and hides an absence. Growth already branched
        # here; the register has to agree with it or one of them is lying.
        add("journey", "never written",
            "no browser spec walks this entity end to end — this is an absent "
            "test, not an absent capture.")
    add("coverage", "not sliced",
        f"the repo `pytest --cov` gate ({_gate}) passes, but it is not sliced by "
        f"path — this entity's own executed-line share is unknown.")
    mine = [w for w in walks if w.get("subject") == f"adopt:{slug}"]
    if not mine:
        add("manual", "never walked",
            "no walk is on record for this entity — the one input on this page "
            "with no machine source is missing entirely.")
    elif section.get("status") == "awaiting-approval":
        add("manual", "walk superseded",
            f"the recorded walk approved an earlier scope; the tracker reads "
            f'`{section.get("status")}`. A walk approves a SCOPE, not a slug.')
    add("deployed", "absent",
        "nothing machine-readable probes the deployed surfaces — every "
        "artifact on the Evidence tab is a capture from a run, not a live "
        "check of what users are on.")
    return rows


def shared_owners(fname: str, slug: str) -> list[str]:
    """Other entities whose file regex also claims this test file.

    ENTITY_RX is broad on purpose, so per-entity counts OVERLAP — they are
    views over the corpus, never a partition of it, and summing them is wrong.
    Measured today: 50 cases across 6 files are claimed by two entities each.
    A shared file says so on its own row rather than letting two pages raise
    the same alarm as if they were two events."""
    return sorted(other for other, rx in ENTITY_RX.items()
                  if other != slug and re.search(rx, fname, re.I))


def file_flags(rec: dict, shared: list[str] | None = None) -> str:
    """Issues on a file render as flags — a green row says so by having none."""
    out = []
    if shared:
        out.append(f'<span class="tag l-services">shared with '
                   f'{E(", ".join(shared))}</span>')
    if rec["failed"]:
        out.append(f'<span class="tag s-high">{rec["failed"]} failing</span>')
    if rec["skipped"]:
        out.append(f'<span class="tag s-med">{rec["skipped"]} skipped</span>')
    return " ".join(out) or '<span class="tag s-ok">clean</span>'


def diagram_picker(slug: str, card: dict) -> str:
    """One diagram at a time, picked by name. Pure CSS via :target, so the
    choice rides in the URL — a radio group kept it in DOM state only, and a
    reader who pasted the link to make a point about the dataflow sent their
    colleague to the userflow. Safe inside the :target tabs because
    `.tabpane:has(:target)` keeps the enclosing pane open."""
    have = [(key, title) for key, title in DIAGRAMS if card.get(key)]
    if not have:
        return ""
    bar = "".join(
        f'<a href="#dgm-{E(slug)}-{i}">{E(title)}</a>'
        for i, (_, title) in enumerate(have))
    panes = "".join(
        f'<div class="pane p{i}" id="dgm-{E(slug)}-{i}">'
        f"{M._mermaid_svg(chr(10).join(card[key]))}</div>"
        for i, (key, _) in enumerate(have))
    return (f'<div class="dgm"><div class="dgmbar">{bar}</div>'
            f'<div class="panes">{panes}</div></div>')


def lens_block(card: dict) -> str:
    """The gabe-lens translation, rendered as the page's OPENING — handle first,
    then the constraint box, then the analogy and its mapping.

    This is why the detail below can collapse: a reader who only reads the lens
    still leaves with the entity's shape. Nothing is deleted, only deferred."""
    lines = card.get("LENS", [])
    if not lines:
        return ""
    fields: dict[str, list[str]] = {}
    for ln in lines:
        key, _, val = ln.strip().partition(":")
        if val.strip():
            fields.setdefault(key.strip().lower(), []).append(val.strip())

    def one(k: str) -> str:
        return md(fields.get(k, [""])[0])

    out = ""
    if fields.get("handle"):
        out += f'<p class="lenshandle">“{one("handle")}”</p>'
    box = "".join(
        f'<div class="lenscell"><b>{lab}</b><span>{one(k)}</span></div>'
        for lab, k in (("IS", "is"), ("IS NOT", "is not"), ("DECIDES", "decides"))
        if fields.get(k))
    if box:
        out += f'<div class="lensbox">{box}</div>'
    if fields.get("analogy"):
        out += f'<p class="lensanalogy">{one("analogy")}</p>'
    if fields.get("map"):
        out += table(["Analogy", "In this codebase"],
                     [[md(p.split("→")[0].strip()), md(p.split("→")[-1].strip())]
                      for p in fields["map"] if "→" in p])
    if fields.get("confuse"):
        out += ('<p class="sub">Easy to confuse:</p><ul>'
                + "".join(f"<li>{md(c)}</li>" for c in fields["confuse"]) + "</ul>")
    if fields.get("limits"):
        out += (f'<p class="sub">Where the analogy stops working: '
                f'{one("limits")}</p>')
    return f'<div class="lens">{out}</div>'


def build_feature_pages(ctx) -> list[str]:
    """One page per baseline entity that has a card. Entities without a card are
    skipped — a feature page is never invented ahead of its section."""
    src = ctx.shell_src / "feature.html"
    written: list[str] = []
    if not src.exists():
        return written
    tpl = strip_slot_doc_comments(src.read_text())
    for s in ctx.sections:
        slug = s["entity"]
        card_path = ctx.center / "cards" / f"{slug}.md"
        if not card_path.exists():
            continue
        card = ctx.parse_card(card_path)
        rx = ENTITY_RX.get(slug, re.escape(slug))
        inv = entity_corpus(rx, ctx.junit_by, ctx.corpora)
        # The entity's own totals, computed ONCE: the title-bar pill and the
        # Tests tab quote the same variable, so they cannot drift apart.
        own = sum(inv[c["key"]]["cases"] for c in ctx.corpora)
        own_failed = sum(inv[c["key"]]["failed"] for c in ctx.corpora)
        _spec_glob = ctx.cfg.get("paths", {}).get(
            "e2e_spec_glob", "tests/web-e2e/**/*.spec.ts")
        matched = [p for p in sorted(glob.glob(_spec_glob, recursive=True))
                   if re.search(rx, p, re.I)]
        # A `*-ref-capture.spec.ts` runs the DESIGN LAB, not the product.
        # Counting it as journey verification is the same mistake as counting a
        # Storybook png as proof, one layer up.
        ref_specs = [p for p in matched if is_reference(Path(p).name)]
        specs = [p for p in matched if p not in ref_specs]

        _corpus_kpis = [
            kpi(f'{c["key"]} cases', str(inv[c["key"]]["cases"]),
                f'{len(inv[c["key"]]["files"])} files') for c in ctx.corpora]
        stats = '<div class="kpis">' + "".join([
            *_corpus_kpis,
            kpi("e2e specs", str(len(specs)), "no junit capture", alert=True),
            kpi("priority", s["rank"], f'adoption: {s["status"]}'),
        ]) + "</div>"

        # Overview — what it is · diagrams · what is still open · why it is the
        # way it is. Lens first, prose folded away; the two sections a reader
        # comes back for (growth + changelog) close the tab.
        proof_root = ctx.proof_root
        grows = growth_rows(slug, inv, specs, ctx.walks, s, proof_root,
                            ctx.corpora, ctx.e2e)
        picker = diagram_picker(slug, card)
        nav = [("sec-ov-card", "What it is", _IC_DOC)]
        if picker:
            nav.append(("sec-ov-diagrams", "Diagrams", _IC_FLOW))
        nav += [("sec-ov-growth", "Growth", _IC_SEED),
                ("sec-ov-changelog", "Changelog", _IC_COMMIT)]
        overview = subnav(nav) + sechead(
            "Docs", "The feature card", "#8e4585", _IC_DOC,
            sub="the entity in one handle, one analogy and one constraint box",
            id_="sec-ov-card",
            info='<div class="leg">Authored in '
                 f"<code>cards/{E(slug)}.md</code> — the only hand-written "
                 "source on this page. Everything counted elsewhere is read "
                 "from the codebase at build time.</div>")
        overview += lens_block(card)
        # ENTITIES is covered by the Code tab's data model — it does not repeat.
        detail = "".join(
            f"<h3>{E(sec.title())}</h3>{card_html(card.get(sec, []))}"
            for sec in ("WHAT & WHY", "FOR WHOM", "FLOWS", "IS", "IS NOT")
            if card.get(sec))
        if detail:
            overview += (f'<details class="more"><summary>Full card — what &amp; why, '
                         f'for whom, flows, is / is not</summary>{detail}</details>')
        if picker:
            overview += sechead("Docs", "Diagrams", "#4f46e5", _IC_FLOW,
                                sub="one at a time — the flow, the data and the "
                                    "state machine", id_="sec-ov-diagrams")
            overview += picker
        overview += sechead(
            "Growth", "Growth opportunities", "#b45309", _IC_SEED,
            sub="what is still open on this entity — priced by effort, "
                "stage, what it buys and what it then costs every run",
            id_="sec-ov-growth",
            info='<div class="leg">Every row is a gap this page already shows, '
                 "restated as work — never a wish list. Effort is the class of "
                 "the job, not a promise; the stage says at which maturity it "
                 "is worth doing (this project is at mvp); the cost column is "
                 "what the angle charges on EVERY run afterwards — an "
                 "opportunity without its recurring cost is a sales pitch."
                 "</div>"
                 + legend("Kind colors:", [
                     ("l-api", "integration", "·"), ("l-web", "unit", "·"),
                     ("l-mobile", "journey", "·"), ("l-models", "coverage", "·"),
                     ("l-services", "manual", "·"), ("l-schemas", "deployed", "·"),
                     ("l-evidence", "evidence", "proof artifacts")])
                 + legend("Effort:", [
                     ("e-xs", "XS", "minutes ·"), ("e-s", "S", "hours ·"),
                     ("e-m", "M", "a day ·"), ("e-l", "L", "days, new machinery")])
                 + legend("Stage — when it is worth doing:", [
                     ("st-mvp", "mvp", "now ·"),
                     ("st-ent", "enterprise", "when the team grows ·"),
                     ("st-scale", "scale", "when uptime is the product")]))
        overview += table(
            ["Kind", "What is missing", "Effort", "Stage", "What it buys",
             "Cost per run after"], grows,
            note=f"{len(grows)} open gap(s) — the count the title bar shows, and "
                 f"the same set the Risk register prices as its GAP rows. "
                 f"Derived from this build; a closed one disappears from this "
                 f"table by itself. ⊕ expands a cut cell.")
        overview += sechead(
            "Docs", "Changelog — decisions that shaped it", "#8a6d1a", _IC_COMMIT,
            sub="why the entity behaves the way it does", id_="sec-ov-changelog")
        # Repeated records get a header row: the decision's handle in one
        # column, what it settles in the other — scannable as a changelog
        # rather than read as a paragraph list.
        dec_rows = []
        for ln in card.get("DECIDED", []):
            t = ln.strip().removeprefix("- ")
            head, sep, rest = t.partition("—")
            if sep and len(head.strip()) <= 40:
                dec_rows.append([f'<b>{md(head.strip())}</b>', md(rest.strip())])
            elif t:
                dec_rows.append(['<span class="sub">—</span>', md(t)])
        overview += table(
            ["Decision", "What it settles"], dec_rows,
            note="Source: the entity card's DECIDED section. A decision here is "
                 "a rule the code obeys, not a plan — the ones with ids are in "
                 "`.kdbp/DECISIONS.md`.")

        # Code tab — the technical decode. Card intro (authored) + AST-parsed
        # endpoints / code map / data model. No mapping yet -> a named gap.
        code_tab = build_code_tab(slug, ctx.repo_root,
                                  card_html(card.get("CODE", [])))
        if not code_tab:
            code_tab = gap("Code decode", f"_a3_code.ENTITY_CODE['{slug}'] mapping")

        # Tests tab — kinds FIRST (what verifies this entity, with its pass
        # proportion), then the per-file matrix whose rows open onto their own
        # cases. Every count here is read from junit at build time; the card
        # contributes only the INTENT of each kind, which rides in the ⊕ toggle.
        walks_here = [w for w in ctx.walks if w.get("subject") == f"adopt:{slug}"]
        _e2e_runner = ctx.e2e.get("runner", "playwright")
        _gap_tag = ctx.e2e.get("junit_gap_tag", "local-only")
        _cov_gate = ctx.e2e.get("coverage_gate", "the coverage gate")
        _corpus_kind_rows = [
            [f'<span class="tag {c["tag_class"]}">{c["kind"]}</span>',
             f'{c["runner"]} ({c["kind_detail"]})',
             str(inv[c["key"]]["cases"]), f'{len(inv[c["key"]]["files"])} file(s)',
             meter(inv[c["key"]]["cases"] - inv[c["key"]]["failed"], inv[c["key"]]["cases"]),
             kind_state(inv[c["key"]])] for c in ctx.corpora]
        _kind_rows = _corpus_kind_rows + [
            ['<span class="tag l-mobile">journey</span>', f"{_e2e_runner} (e2e)",
             "—",
             f"{len(specs)} spec(s) on disk"
             + (f'<br><small>+{len(ref_specs)} reference-capture spec(s) held '
                f"out — they run the design lab, not the product</small>"
                if ref_specs else ""),
             meter(0, 0),
             f'<span class="tag s-gap">no junit capture ({_gap_tag})</span>'],
            ['<span class="tag l-models">coverage</span>',
             f"pytest --cov (repo gate {_cov_gate})", "—", "not sliced per entity",
             meter(0, 0), '<span class="tag s-gap">named gap</span>'],
            ['<span class="tag l-services">manual</span>', "operator walks",
             str(len(walks_here)), "walks.jsonl", meter(0, 0),
             ('<span class="tag s-ok">recorded</span>' if walks_here
              else '<span class="tag s-gap">none on record</span>')],
            ['<span class="tag l-schemas">deployed</span>', "probes", "—",
             "nothing probes the deployed surface", meter(0, 0),
             '<span class="tag s-gap">absent</span>'],
        ]
        matrix_rows, matrix_exp = [], []
        for c in ctx.corpora:
            corpus, kind, kcls = c["key"], c["kind"], c["tag_class"]
            for fname, rec in sorted(inv[corpus]["files"].items(),
                                     key=lambda x: -x[1]["tests"]):
                ran = rec["tests"] - rec["skipped"]
                matrix_rows.append([
                    f'<span class="tag {kcls}">{kind}</span>',
                    f"<code>{E(fname)}</code>", str(rec["tests"]),
                    meter(rec["tests"] - rec["failed"], rec["tests"]),
                    # Ran stays a bare count: a second full-width bar beside
                    # Passing would repeat one shape twice and read as noise.
                    f'<span class="pct">{ran}/{rec["tests"]}</span>',
                    file_flags(rec, shared_owners(fname, slug))])
                matrix_exp.append((f"The {rec['tests']} case(s) in "
                                   f"<code>{E(fname.rsplit('/', 1)[-1])}</code>",
                                   case_rows(rec, corpus)))
        tests_tab = (
            subnav([("sec-tests-kinds", "Kinds & coverage", _IC_CHECK),
                    ("sec-tests-matrix", "Matrix", _IC_GRID)])
            + sechead("Testing", "Kinds & coverage", "#15803d", _IC_CHECK,
                      sub=f"{own:,} automated case(s) · {own_failed} failed — "
                          f"what verifies this entity, "
                          f"how much of it runs, and what each kind is for",
                      id_="sec-tests-kinds",
                      info=legend("Kind colors:", [
                          ("l-api", "integration", "API through HTTP ·"),
                          ("l-web", "unit", "components in isolation ·"),
                          ("l-mobile", "journey", "real browser flows ·"),
                          ("l-models", "coverage", "lines executed ·"),
                          ("l-services", "manual", "a human walked it ·"),
                          ("l-schemas", "deployed", "probes against the live app")])
                      + angles_html(card.get("ANGLES", [])))
            + table(["Kind", "Runner", "Cases", "Where", "Passing", "State"],
                    _kind_rows, num={2},
                    note="Cases, files and the passing proportion are read from "
                         "the junit capture at build time. A kind with no "
                         "machine record shows its gap instead of a zero — "
                         "open ⊕ above for what each kind is for here.")
            + sechead("Testing", "Matrix — per file", "#4f46e5", _IC_GRID,
                      sub="every test file touching this entity — open a row "
                          "to read its cases",
                      id_="sec-tests-matrix",
                      info='<div class="leg">Passing = cases that did not fail. '
                           "Ran = cases that were not skipped (a skipped case "
                           "is claimed coverage that did not execute). Flags "
                           "name a file's issues; a file with none reads "
                           '<span class="tag s-ok">clean</span>. Opening a row '
                           "lists its cases with the C-id that joins each one "
                           "to a claim.</div>"
                      + legend("Line coverage is NOT on this table:", [
                          ("s-gap", "named gap",
                           "the repo --cov gate is not sliced per entity")]))
            + table(
                ["Kind", "File", "Cases", "Passing", "Ran", "Flags"],
                matrix_rows, num={2}, expand=matrix_exp,
                note=f'{own} automated '
                     f"case(s) across {len(matrix_rows)} file(s), all read from "
                     f"the junit capture — never hand-listed."))

        # Evidence — a header table of the entity's proof sets, each row opening
        # onto its own galleries; artifacts open in the in-page viewer. Built
        # from disk + each set's manifest.json (see _a3_evidence).
        evidence = build_evidence_tab(
            ENTITY_PROOFS.get(slug, []),
            ctx.proof_root,
            ctx.labels.get(slug, slug).lower())
        if not evidence:
            evidence = gap("Proof sets", f"_a3_feature.ENTITY_PROOFS['{slug}']")

        # Risk — one register. Authored lines carry the judgments a machine
        # cannot make; the unverified angles JOIN THEM as GAP rows rather than
        # sitting in a separate list, because an unverified surface is a risk
        # and a bare list of gaps beside a risk table is redundant twice over.
        risk_rows = [(_SEV_ORDER.get(r[0].lower(), 9), risk_cells(*r))
                     for r in parse_risks(card.get("RISKS", []))]
        risk_rows += unverified_risks(slug, inv, specs, ctx.walks, s, ctx.e2e)
        risk = (
            subnav([("sec-risk-register", "Register", _IC_ALERT),
                    ("sec-risk-dropped", "Not carried forward", _IC_INBOX)])
            + sechead("Risk", "Risk register", "#d1443c", _IC_ALERT,
                      sub="what could go wrong, what it would cost, and whether "
                          "anything is watching — priced at project maturity (mvp)",
                      id_="sec-risk-register",
                      info='<div class="leg">“At stake” is the consequence if '
                           "the row lands — the reason it is on this page at "
                           "all. GAP rows are the angles nothing verifies: they "
                           "are risks by omission, and what it would take to "
                           'close each one is priced under <a href="#sec-ov-growth">'
                           "Overview → Growth</a>.</div>"
                           + legend("Severity colors:", [
                               ("s-high", "HIGH", "act soon ·"),
                               ("s-med", "MEDIUM", "watch / tracked ·"),
                               ("s-low", "LOW", "mitigated, tripwired ·"),
                               ("s-gap", "GAP", "nothing verifies this")]))
            + table(["Severity", "Risk", "What is at stake", "Status", "Detail"],
                    [r for _, r in sorted(risk_rows, key=lambda x: x[0])],
                    note="Judgments come from the entity card's RISKS section — "
                         "re-verified prose, never generated. GAP rows are "
                         "derived from this build: an angle with no machine "
                         "record cannot be argued with.")
            + sechead("Risk", "Not carried forward", "#8a6d1a", _IC_INBOX,
                      sub="claims the legacy pages made that this page refuses "
                          "to repeat, and why", id_="sec-risk-dropped")
            + (card_html(card.get("NOT CARRIED FORWARD", []))
               or '<p class="sub">Nothing was dropped when this section was '
                  "adopted.</p>"))
        # The Decisions changelog used to close this tab; the operator moved it
        # to Overview, beside the growth list — what is open and why it is the
        # way it is belong together, ahead of the risk pricing.

        html_out = tpl
        # The sticky bar carries THIS entity's numbers, not the repo's. The
        # shared pill (repo totals) read as an entity verdict on an entity page
        # — a reader who saw "1,448 tests · 0 failed" beside KPIs of 87/141/7
        # formed the verdict there and never opened the tabs that qualify it.
        n_gap = len(grows)
        # Each pill LINKS to the section that owns its number, and the number
        # is a landmark there — not a footnote. A reader who could see "228
        # cases" in the bar and not find 228 anywhere on the Tests tab had no
        # way to check the claim, which is the whole point of the page.
        # The two counts go to the two PRICES of the same fact set: the gap
        # count to Growth (cost to close), the adoption status to the Risk
        # register (cost to leave open).
        entity_pills = (
            f'<a class="statuspill {"warn" if own_failed else "ok"}" '
            f'href="#sec-tests-kinds" title="Tests → Kinds &amp; coverage">'
            f'{own:,} cases · {own_failed} failed</a> '
            f'<a class="statuspill {"warn" if n_gap else "ok"}" '
            f'href="#sec-ov-growth" title="Overview → Growth opportunities">'
            f'{n_gap} open gap(s)</a> '
            f'<a class="statuspill {"warn" if s["status"] != "approved" else "ok"}" '
            f'href="#sec-risk-register" title="Risk → register">'
            f'{E(s["status"])}</a>')
        for tok, val in {**ctx.shared, **{
            "{{STATUS_PILLS}}": entity_pills,
            "{{SUBJECT_TITLE}}": E(ctx.labels.get(slug, slug)),
            "{{SUBJECT_LEDE}}": md(" ".join(card.get("HANDLE", []))),
            "{{SUBJECT_HEADLINE_STATS}}": stats,
            "{{TAB_OVERVIEW}}": overview,
            "{{TAB_CODE}}": code_tab,
            "{{TAB_TESTS}}": tests_tab,
            "{{TAB_EVIDENCE}}": evidence,
            "{{TAB_RISK}}": risk,
        }}.items():
            html_out = html_out.replace(tok, val)
        out_path = ctx.center / f"feature-{slug}.html"
        out_path.write_text(html_out)
        written.append(out_path.name)
    return written
