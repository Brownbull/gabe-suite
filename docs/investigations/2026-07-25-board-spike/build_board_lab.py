#!/usr/bin/env python3
"""Render the board LAB page from cards.json.

A lab, not a shipped station: the same real cards re-columned four ways, so the
operator can pick the framing before any of it is wired into the generators.
"""
import hashlib
import html
import json
import sys
from collections import Counter, OrderedDict
from pathlib import Path

D = json.loads(Path(sys.argv[1]).read_text())
OUT = Path(sys.argv[2])
CARDS = D["cards"]
OPEN = [c for c in CARDS if not c.get("done")]
DONE = [c for c in CARDS if c.get("done")]
LABELS = D["labels"]


def E(s):
    return html.escape(str(s if s is not None else ""), quote=True)


ENTITY_COLOR_POOL = [
    "#0d6e78", "#7c3aed", "#b45309", "#0a7d6b", "#b3403a", "#1f6feb",
    "#8e4585", "#3f6d4c", "#9a5a00", "#5a53a8", "#c2461e", "#0f766e",
]


def ecolor(slug):
    """Same hash the center uses, so an entity is the SAME colour here as on
    its feature page — a board that recolours entities is a board that lies."""
    return ENTITY_COLOR_POOL[
        int(hashlib.sha1(("c:" + slug).encode()).hexdigest(), 16)
        % len(ENTITY_COLOR_POOL)]


# --------------------------------------------------------------------------- #
# vocabulary
# --------------------------------------------------------------------------- #
TRACKS = OrderedDict([
    ("verify", ("Verify", "#b45309",
                "An entity's evidence is built and waiting on a human eye.")),
    ("prove", ("Prove", "#3f6d4c",
               "A named flow that no test claims — the born-red candidates.")),
    ("build", ("Build", "#1f6feb",
               "A planned phase with lifecycle cells still unticked.")),
    ("debt", ("Debt", "#b3403a",
              "An open deferred finding, priced and dated.")),
    ("arc", ("Arc", "#5a53a8",
             "A scope phase not yet pulled into a plan — the long horizon.")),
])

STATES = OrderedDict([
    ("owed_to_you", ("Owed to you", "#b45309",
                     "Nobody else can clear these. A walk, an approval, a "
                     "founder ruling — the machine has done all it can.")),
    ("ripe", ("Ripe now", "#16794c",
              "Prerequisites already met and the cost is small. Pick from "
              "here when you have a gap, not a day.")),
    ("ready", ("Ready", "#0d6e78",
               "Nothing blocks it, but it is not cheap or not yet scoped. "
               "The honest backlog.")),
    ("inflight", ("In flight", "#1f6feb",
                  "Started — at least one cell ticked, at least one owed.")),
    ("blocked", ("Blocked", "#b3403a",
                 "Gated by a decision, not by neglect. Escalate, don't "
                 "re-triage.")),
    ("parked", ("Parked", "#7a8595",
                "Deliberately later. Here so it stays visible, not so it "
                "nags.")),
])

EFFORTS = OrderedDict([
    ("XS", ("XS · minutes", "#16794c")),
    ("S", ("S · under an hour", "#0d6e78")),
    ("M", ("M · a sitting", "#b45309")),
    ("L", ("L · a phase", "#b3403a")),
])

# How long a card has been sitting. The buckets are deliberately coarse: the
# question is "is this rotting?", not "exactly how old is it?".
AGES = OrderedDict([
    ("fresh", ("This week", "#16794c", "Recorded in the last 7 days.")),
    ("recent", ("8 \u2013 30 days", "#0d6e78", "Still current.")),
    ("aging", ("1 \u2013 3 months", "#b45309",
               "Old enough to re-read before acting.")),
    ("stale", ("Over 3 months", "#b3403a",
               "Carried for a quarter. Either it matters or it should be "
               "closed as won't-do.")),
    ("undated", ("Undated", "#7a8595",
                 "No creation date is recorded anywhere in the repo \u2014 PLAN "
                 "phases and scope arcs carry none.")),
])

RECENCY = OrderedDict([
    ("d7", ("Last 7 days", "#16794c", "")),
    ("d30", ("Last 30 days", "#0d6e78", "")),
    ("d90", ("Last 90 days", "#b45309", "")),
    ("older", ("Older", "#5a53a8", "")),
    ("undated", ("Undated", "#7a8595",
                 "Closed, but no resolution date was recorded.")),
])


def age_bucket(n):
    if n is None:
        return "undated"
    return ("fresh" if n <= 7 else "recent" if n <= 30
            else "aging" if n <= 90 else "stale")


def recency_bucket(n):
    if n is None:
        return "undated"
    return "d7" if n <= 7 else "d30" if n <= 30 else "d90" if n <= 90 else "older"


NEXT_CMD = {
    # A card whose checklist is 0/7 does not need a walk, it needs adoption.
    # Naming the wrong command is worse than naming none: it sends the operator
    # to a beat whose preconditions are not met.
    "verify": lambda c: (f"/gabe-walk {c['entity']}"
                         if c.get("owes") == ["walk_recorded"]
                         else f"/gabe-adopt section {c['entity']}"),
    "prove": lambda c: f"/gabe-red  → declare cases for {', '.join(c.get('flows', [])[:2])}",
    "build": lambda c: ("/gabe-red  → the born-red flow, test-first"
                        if c.get("born_red") else
                        f"/gabe-execute {c['id'].split(':')[1]}"
                        if "Exec" in c.get("owes", []) else
                        f"/gabe-next  → {c.get('owes', ['?'])[0]}"),
    "debt": lambda c: f"fix {c['title'].split()[0]} · /gabe-review deferred",
    "arc": lambda c: f"/gabe-plan  → pull arc {c['id'].split(':')[1]} into a plan",
}

GLYPH_DONE = {"done": "✅", "in_progress": "🔄", "todo": "⬜", "paused": "⏸",
              "n/a": "—"}


def human_age(n):
    if n is None:
        return "undated"
    if n < 31:
        return f"{n}d"
    if n < 365:
        return f"{round(n / 30.4)}mo"
    return f"{n // 365}y"


def next_cmd(c):
    try:
        return NEXT_CMD[c["track"]](c)
    except Exception:
        return ""


# --------------------------------------------------------------------------- #
# card
# --------------------------------------------------------------------------- #
def card_html(c):
    tlabel, tcol, _ = TRACKS[c["track"]]
    chips = [f'<span class="bc-tk" style="--tc:{tcol}">{E(tlabel)}</span>']

    ents = c.get("entities") or ([c["entity"]] if c.get("entity") else [])
    for slug in ents[:2]:
        chips.append(
            f'<span class="bc-ent" style="--ec:{ecolor(slug)}" '
            f'title="entity: {E(LABELS.get(slug, slug))} — '
            f'{E(c.get("entity_how", "archmap path match"))}"><i></i>'
            f'{E(LABELS.get(slug, slug))}</span>')
    if len(ents) > 2:
        chips.append(f'<span class="bc-area" title="{E(", ".join(LABELS.get(x, x) for x in ents[2:]))}">'
                     f'+{len(ents) - 2}</span>')
    if not ents and c["track"] == "debt":
        chips.append('<span class="bc-cross" title="no archmap path in the File '
                     'cell — this finding does not belong to one entity, and '
                     'saying so is more useful than guessing">cross-cutting</span>')
    if c.get("area"):
        chips.append(f'<span class="bc-area">{E(c["area"])}</span>')

    eff = c.get("effort")
    if eff:
        elabel, ecol = EFFORTS[eff]
        chips.append(f'<span class="bc-eff" style="--fc:{ecol}" '
                     f'title="{E(c.get("effort_basis",""))}">{E(eff)}</span>')
    if c.get("priority"):
        chips.append(f'<span class="bc-pri p-{E(c["priority"])}">'
                     f'{E(c["priority"])}</span>')
    if c.get("gate"):
        chips.append(f'<span class="bc-gate" title="blocked by a decision, not '
                     f'by neglect">⛔ {E(c["gate"])}</span>')
    if c.get("deferred"):
        chips.append(f'<span class="bc-def" title="times deferred">'
                     f'↻{E(c["deferred"])}</span>')
    if c.get("done"):
        if c.get("closed_days") is not None:
            chips.append(
                f'<span class="bc-closed" title="closed {E(c.get("closed"))}">'
                f'\u2713 {E(human_age(c["closed_days"]))} ago</span>')
        if c.get("cycle_days") is not None:
            chips.append(f'<span class="bc-age" title="days from first '
                         f'recorded to closed">{E(c["cycle_days"])}d open</span>')
    elif c.get("age_days") is not None:
        chips.append(f'<span class="bc-age age-{E(age_bucket(c["age_days"]))}" '
                     f'title="recorded {E(c.get("created"))} \u2014 on the board '
                     f'{E(c["age_days"])} days">{E(human_age(c["age_days"]))}'
                     f'</span>')
    if c.get("last_activity") and not c.get("done"):
        chips.append(f'<span class="bc-age" title="last ledger entry naming '
                     f'this phase">touched {E(c["last_activity"])}</span>')

    ripe = ('<span class="bc-ripe" title="' + E(c["ripe_why"]) + '">◆ ripe</span>'
            if c.get("ripe") else "")

    # the phase rail, rendered inline on build cards — the cells ARE the card
    rail = ""
    if c.get("cells"):
        rail = '<div class="bc-rail">' + "".join(
            f'<span class="{"owed" if v in ("todo","in_progress") else ""}">'
            f'{GLYPH_DONE.get(v,"⬜")}<i>{E(k)}</i></span>'
            for k, v in c["cells"].items()) + "</div>"

    prog = ""
    if c.get("checklist_total"):
        pct = round(100 * c["checklist_done"] / c["checklist_total"])
        prog = (f'<div class="bc-prog"><i style="width:{pct}%"></i></div>'
                f'<div class="bc-progl">{c["checklist_done"]}/'
                f'{c["checklist_total"]} checklist</div>')

    inf = ""
    if c.get("inferred"):
        inf = (f'<span class="bc-inf" title="not a recorded fact — derived by '
               f'the board: {E(", ".join(c["inferred"]))}">~inferred</span>')

    nc = "" if c.get("done") else next_cmd(c)
    nxt = f'<div class="bc-next"><code>{E(nc)}</code></div>' if nc else ""

    return (
        f'<article class="bcard" data-track="{E(c["track"])}" '
        f'data-state="{E(c["state"])}" data-entity="{E(c.get("entity") or "")}" '
        f'data-area="{E(c.get("area") or "")}" data-effort="{E(eff or "")}" '
        f'data-ripe="{"1" if c.get("ripe") else "0"}" '
        f'data-pri="{E(c.get("priority") or "")}" '
        f'style="--tc:{tcol}">'
        f'<div class="bc-top">{"".join(chips)}{ripe}</div>'
        f'<h4>{E(c["title"])}</h4>'
        f'<p>{E(c["detail"])}</p>'
        f'{rail}{prog}{nxt}'
        f'<div class="bc-src">{E(c["source"])}{inf}</div>'
        f'</article>')


# --------------------------------------------------------------------------- #
# columns
# --------------------------------------------------------------------------- #
def columns_for(mode):
    pop = OPEN
    if mode == "state":
        keys = list(STATES)
        meta = {k: STATES[k] for k in keys}
        keyf = lambda c: ("ripe" if c.get("ripe") and c["state"] == "ready"
                          else c["state"])
    elif mode == "age":
        keys = list(AGES)
        meta = {k: AGES[k] for k in keys}
        keyf = lambda c: age_bucket(c.get("age_days"))
    elif mode == "done":
        pop = DONE
        keys = list(RECENCY)
        meta = {k: RECENCY[k] for k in keys}
        keyf = lambda c: recency_bucket(c.get("closed_days"))
    elif mode == "track":
        keys = list(TRACKS)
        meta = {k: TRACKS[k] for k in keys}
        keyf = lambda c: c["track"]
    elif mode == "effort":
        keys = list(EFFORTS)
        meta = {k: (EFFORTS[k][0], EFFORTS[k][1], "") for k in keys}
        keyf = lambda c: c.get("effort") or "L"
    else:  # entity
        ents = [e for e in LABELS
                if any(e in (c.get("entities") or []) for c in OPEN)]
        keys = ents + ["_cross"]
        meta = {e: (LABELS[e], ecolor(e), "") for e in ents}
        meta["_cross"] = ("Cross-cutting", "#7a8595",
                          "No single entity owns it — tooling, process, "
                          "whole-app phases.")
        keyf = lambda c: ((c.get("entities") or [None])[0]) or "_cross"
    return keys, meta, keyf, pop


ORDER = {"owed_to_you": 0, "ready": 1, "inflight": 2, "blocked": 3, "parked": 4}
CAP = 8  # cards shown before a column folds the rest behind an expander
EORDER = {"XS": 0, "S": 1, "M": 2, "L": 3}


def sortkey(c):
    # ripe first, then cheapest, then least-blocked — a pick-list, not an inbox
    return (0 if c.get("ripe") else 1,
            EORDER.get(c.get("effort"), 9),
            ORDER.get(c["state"], 9),
            c["title"])


def board_html(mode):
    keys, meta, keyf, pop = columns_for(mode)
    buckets = {k: [] for k in keys}
    for c in pop:
        buckets.setdefault(keyf(c), []).append(c)
    cols = []
    for k in keys:
        label, col, blurb = meta[k]
        items = sorted(buckets.get(k, []),
                       key=(lambda c: (c.get("closed") or "", c["title"]))
                       if mode == "done" else sortkey,
                       reverse=(mode == "done"))
        nripe = sum(1 for c in items if c.get("ripe"))
        head, tail = items[:CAP], items[CAP:]
        mix = Counter(c["track"] for c in items)
        mixline = " · ".join(f"{n} {TRACKS[t][0].lower()}"
                             for t, n in mix.most_common()) if len(mix) > 1 else ""
        cols.append(
            f'<section class="bcol" data-col="{E(k)}" style="--cc:{col}">'
            f'<header><h3>{E(label)}<span class="n">{len(items)}</span></h3>'
            + (f'<span class="rp">◆ {nripe} ripe</span>'
               if nripe and k != "ripe" else "")
            + (f'<p>{E(blurb)}</p>' if blurb else "")
            + (f'<p class="mix">{E(mixline)}</p>' if mixline else "")
            + "</header>"
            f'<div class="bstack">{"".join(card_html(c) for c in head)}'
            + (f'<div class="bfold">{"".join(card_html(c) for c in tail)}</div>'
               f'<button class="bmore" data-n="{len(tail)}">'
               f'+ {len(tail)} more</button>' if tail else "")
            + ('<div class="bempty">'
               + ("nothing closed in this window" if mode == "done"
                  else "nothing here \u2014 and that is the good outcome")
               + '</div>' if not items else "")
            + '</div></section>')
    return (f'<div class="bboard" data-mode="{E(mode)}" '
            f'style="display:none">{"".join(cols)}</div>')


# --------------------------------------------------------------------------- #
# filters + kpis
# --------------------------------------------------------------------------- #
def chipbar():
    """One dropdown per axis. The chip grid showed every label at once, which
    put four rows of vocabulary above the board before a single card. A select
    costs one click and gives the columns the vertical space back."""
    ents = sorted({e for c in CARDS for e in (c.get("entities") or [])})
    areas = sorted({c["area"] for c in CARDS if c.get("area")})
    n_by = lambda f, v: sum(
        1 for c in CARDS
        if (v in (c.get("entities") or []) if f == "entity"
            else c.get(f) == v))

    def sel(name, key, opts, alllabel):
        return (f'<label class="bfsel"><span>{E(name)}</span>'
                f'<select data-f="{key}"><option value="">{E(alllabel)}</option>'
                + "".join(f'<option value="{E(o)}">{E(LABELS.get(o, o))}'
                          f'  ({n_by(key, o)})</option>' for o in opts)
                + "</select></label>")

    return ('<div class="bfilters">'
            + sel("Track", "track", list(TRACKS), "all tracks")
            + sel("Entity", "entity", ents, "all entities")
            + sel("Area", "area", areas, "all areas")
            + sel("Effort", "effort", list(EFFORTS), "any effort")
            + '<button class="bchip" data-f="ripe" data-v="1">\u25c6 ripe only</button>'
              '<button class="bchip" data-f="unblocked" data-v="1">unblocked</button>'
            + '<div class="bfgrp bfx"><span class="bcount"></span>'
              '<button class="bchip bclear">reset</button></div>'
            + "</div>")


nripe = sum(1 for c in OPEN if c["ripe"])
byst = Counter(c["state"] for c in OPEN)
bytr = Counter(c["track"] for c in OPEN)


def kpi(lab, val, sub="", alert=False):
    return (f'<div class="kpi{" alert" if alert else ""}"><div class="lab">'
            f'{E(lab)}</div><div class="val">{E(val)}</div>'
            + (f'<div class="sub">{E(sub)}</div>' if sub else "") + "</div>")


_d7 = sum(1 for c in DONE
          if c.get("closed_days") is not None and c["closed_days"] <= 7)
_d30 = sum(1 for c in DONE
           if c.get("closed_days") is not None and c["closed_days"] <= 30)
_cyc = sorted(c["cycle_days"] for c in DONE if c.get("cycle_days") is not None)
_stale = sum(1 for c in OPEN
             if c.get("age_days") is not None and c["age_days"] > 90)

kpis = "".join([
    kpi("open cards", str(len(OPEN)), "across 5 tracks"),
    kpi("owed to you", str(byst["owed_to_you"]),
        "only a human can clear these", alert=bool(byst["owed_to_you"])),
    kpi("ripe now", str(nripe), "prerequisites already met"),
    kpi("blocked", str(byst["blocked"]), "gated by a decision"),
    kpi("XS + S", str(sum(1 for c in OPEN if c.get("effort") in ("XS", "S"))),
        "fit in one sitting"),
    kpi("closed 30d", str(_d30), f"{_d7} in the last 7"),
    kpi("over 3 months", str(_stale), "open and aging", alert=bool(_stale)),
] + ([kpi("median cycle", f"{_cyc[len(_cyc)//2]}d",
          f"{len(_cyc)} dated, longest {_cyc[-1]}d")] if _cyc else []))

MODES = [("state", "State", "what can I actually pick up"),
         ("track", "Track", "what kind of work is it"),
         ("entity", "Entity", "where does each domain stand"),
         ("effort", "Effort", "how much time do I have"),
         ("age", "Age", "what is going stale"),
         ("done", "Done", "what I have finished, newest first")]

CSS = """
.bwrap{padding:0 30px 60px}
.bfilters{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;
  padding:10px 0 12px;border-bottom:1px solid var(--line);margin-bottom:14px;
  position:sticky;top:0;background:var(--bg);z-index:30}
.bfgrp{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.bfgrp>b{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;
  color:var(--muted);font-weight:700;margin-right:2px}
.bfsel{display:flex;align-items:center;gap:6px}
.bfsel>span{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;
  color:var(--muted);font-weight:700}
.bfilters select{font:inherit;font-size:.72rem;font-weight:600;padding:4px 8px;
  border-radius:8px;border:1px solid var(--line);background:var(--surface);
  color:var(--ink-2);cursor:pointer;max-width:190px}
.bfilters select.set{border-color:var(--accent);color:var(--accent-ink);
  background:var(--accent-soft)}
.bc-closed{background:var(--good-soft);color:var(--good)}
.bc-age.age-stale{background:var(--bad-soft);color:var(--bad);border-color:transparent}
.bc-age.age-aging{background:var(--warn-soft);color:var(--warn);border-color:transparent}
.donemode .bcard{border-left-color:var(--good);opacity:.92}
.bfx{margin-left:auto}
.bcount{font:var(--mono);font-size:.68rem;color:var(--muted);margin-right:8px}
.bchip{font:inherit;font-size:.7rem;font-weight:600;padding:3px 10px;
  border-radius:14px;border:1px solid var(--line);background:var(--surface);
  color:var(--muted);cursor:pointer;line-height:1.5}
.bchip:hover{border-color:var(--ec,var(--accent));color:var(--ink)}
.bchip.on{background:var(--ec,var(--accent));border-color:var(--ec,var(--accent));
  color:#fff}
.bmodes{display:flex;gap:4px;background:var(--panel);border:1px solid var(--line);
  border-radius:12px;padding:4px;width:fit-content;margin:0 0 16px}
.bmodes button{font:inherit;font-size:.8rem;font-weight:600;color:var(--ink-2);
  padding:6px 14px;border-radius:9px;border:0;background:none;cursor:pointer;
  display:flex;flex-direction:column;align-items:flex-start;gap:1px}
.bmodes button.on{background:var(--surface);color:var(--ink);
  box-shadow:var(--shadow)}
.bmodes button i{font-style:normal;font-size:.62rem;color:var(--muted);
  font-weight:500}
.bmodes button.on i{color:var(--accent)}

.bboard{display:grid;gap:14px;align-items:start;
  grid-template-columns:repeat(auto-fit,minmax(268px,1fr))}
.bcol{background:var(--panel);border:1px solid var(--line);border-radius:12px;
  padding:0 0 10px;min-width:0;border-top:3px solid var(--cc)}
.bcol>header{padding:11px 14px 9px;border-bottom:1px solid var(--line-2)}
.bcol h3{margin:0;font-size:.82rem;font-weight:700;letter-spacing:-.01em;
  display:flex;align-items:center;gap:8px;color:var(--cc)}
.bcol h3 .n{font:var(--mono);font-size:.66rem;background:var(--surface);
  border:1px solid var(--line);border-radius:20px;padding:0 7px;color:var(--muted)}
.bcol .rp{font-size:.62rem;font-weight:700;color:var(--good);letter-spacing:.02em}
.bcol header p{margin:4px 0 0;font-size:.68rem;color:var(--muted);line-height:1.45}
.bstack{display:flex;flex-direction:column;gap:8px;padding:10px 10px 0;
  max-height:none}
.bcol.empty{opacity:.45}
.bcol.empty header p.mix{display:none}

.bcard{background:var(--surface);border:1px solid var(--line);border-radius:9px;
  padding:9px 11px 8px;box-shadow:var(--shadow);border-left:3px solid var(--tc);
  cursor:default}
.bcard:hover{box-shadow:var(--shadow-lift)}
.bcard.hide{display:none}
.bc-top{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:5px}
.bcard h4{margin:0 0 3px;font-size:.79rem;font-weight:650;line-height:1.35;
  letter-spacing:-.01em}
.bcard p{margin:0;font-size:.7rem;color:var(--muted);line-height:1.45}
.bc-tk,.bc-ent,.bc-area,.bc-eff,.bc-pri,.bc-gate,.bc-def,.bc-age,.bc-ripe{
  font-size:.6rem;font-weight:700;letter-spacing:.02em;padding:1px 7px;
  border-radius:20px;white-space:nowrap;display:inline-flex;align-items:center;
  gap:4px}
.bc-tk{background:color-mix(in srgb,var(--tc) 14%,transparent);color:var(--tc)}
.bc-ent{border:1px solid var(--ec);color:var(--ec);background:var(--surface)}
.bc-ent i{width:6px;height:6px;border-radius:50%;background:var(--ec);
  display:inline-block}
.bc-ent.guess{border-style:dashed;opacity:.85}
.bc-area{background:var(--line-2);color:var(--ink-2)}
.bc-eff{border:1px solid var(--fc);color:var(--fc)}
.bc-pri.p-high{background:var(--bad-soft);color:var(--bad)}
.bc-pri.p-medium{background:var(--warn-soft);color:var(--warn)}
.bc-pri.p-low{background:var(--line-2);color:var(--muted)}
.bc-gate{background:var(--bad-soft);color:var(--bad)}
.bc-def,.bc-age{background:var(--panel);color:var(--faint);border:1px solid var(--line-2)}
.bc-ripe{background:var(--good-soft);color:var(--good);margin-left:auto}
.bc-rail{display:flex;gap:3px;margin-top:7px;flex-wrap:wrap}
.bc-rail span{font-size:.58rem;color:var(--faint);display:flex;
  flex-direction:column;align-items:center;line-height:1.3;min-width:30px}
.bc-rail span i{font-style:normal;letter-spacing:.02em}
.bc-rail span.owed{color:var(--warn);font-weight:700}
.bc-prog{height:3px;background:var(--line-2);border-radius:3px;margin-top:8px;
  overflow:hidden}
.bc-prog i{display:block;height:100%;background:var(--good)}
.bc-progl{font-size:.58rem;color:var(--muted);margin-top:2px}
.bc-next{margin-top:7px;padding:4px 7px;background:var(--accent-soft);
  border-radius:5px}
.bc-next code{font:var(--mono);font-size:.63rem;color:var(--accent-ink)}
.bc-src{margin-top:6px;font:var(--mono);font-size:.55rem;color:var(--faint);
  display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.bc-inf{color:var(--warn);font-style:italic;cursor:help}
.bc-cross{background:var(--line-2);color:var(--muted);font-style:italic}
.bseq{margin:0 0 16px;padding:10px 14px;background:var(--surface);
  border:1px solid var(--line);border-radius:10px}
.bseqhead{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;
  margin-bottom:7px}
.bseqhead b{font-size:.78rem}
.bseqhead span{font-size:.68rem;color:var(--muted)}
.bseqrail{display:flex;gap:3px;flex-wrap:wrap}
.ph{font:var(--mono);font-size:.58rem;font-weight:700;padding:2px 6px;
  border-radius:4px;cursor:pointer;border:1px solid transparent}
.ph:hover{filter:brightness(.94)}
.ph.on{outline:2px solid var(--accent);outline-offset:1px}
.bseqdet{margin-top:10px;padding:11px 13px;background:var(--panel);
  border:1px solid var(--line);border-radius:9px}
.bsdhead{display:flex;align-items:flex-start;gap:10px}
.bsdhead b{font-size:.82rem;letter-spacing:-.01em;flex:1}
.bsdx{border:0;background:none;font-size:1rem;line-height:1;color:var(--muted);
  cursor:pointer;padding:0 2px}
.bsdx:hover{color:var(--ink)}
.bsdtags{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 0}
.bseqdet p{margin:8px 0 0;font-size:.73rem;color:var(--muted);line-height:1.5}
.bseqdet .bc-rail{margin-top:10px;gap:10px}
.bseqdet .bc-rail span{min-width:44px;font-size:.62rem}
.ph-done{background:var(--good-soft);color:var(--good)}
.ph-inflight{background:var(--accent);color:#fff}
.ph-todo{background:var(--panel);color:var(--faint);border-color:var(--line)}
.bempty{padding:14px;font-size:.72rem;color:var(--faint);text-align:center}
.bfold{display:none;flex-direction:column;gap:8px}
.bfold.open{display:flex}
.bmore{font:inherit;font-size:.68rem;font-weight:600;color:var(--accent-ink);
  background:var(--accent-soft);border:0;border-radius:7px;padding:6px;
  cursor:pointer;width:100%;margin-top:2px}
.bmore:hover{background:var(--accent);color:#fff}
.bcol header p.mix{font:var(--mono);font-size:.58rem;color:var(--faint);
  margin-top:3px}
.bmodes{background:var(--surface)}
.bmodes button{border:1px solid transparent;min-width:132px}
.bmodes button.on{border-color:var(--line);background:var(--accent-soft)}
.bmodes button.on span{color:var(--accent-ink)}
"""

JS = """
(function(){
  var F={track:'',entity:'',area:'',effort:'',ripe:'',unblocked:''};
  var boards=[].slice.call(document.querySelectorAll('.bboard'));
  function mode(m){
    boards.forEach(function(b){b.style.display = b.dataset.mode===m?'grid':'none';});
    [].forEach.call(document.querySelectorAll('.bmodes button'),function(b){
      b.classList.toggle('on', b.dataset.m===m);});
    try{localStorage.setItem('gabe.board.mode',m);}catch(e){}
    // "ripe" and "unblocked" describe open moves only
    var isDone = (m==='done');
    [].forEach.call(document.querySelectorAll('.bchip[data-f="ripe"],'+
      '.bchip[data-f="unblocked"]'),function(b){
        b.style.display = isDone ? 'none' : '';
        if(isDone && F[b.dataset.f]){F[b.dataset.f]=''; b.classList.remove('on');}
      });
    document.querySelector('.bwrap').classList.toggle('donemode', isDone);
    apply();
  }
  function apply(){
    var shown=0,total=0;
    boards.forEach(function(b){
      if(b.style.display==='none') return;
      [].forEach.call(b.querySelectorAll('.bcard'),function(c){
        total++;
        var ok = (!F.track   || c.dataset.track===F.track)
              && (!F.entity  || (' '+c.dataset.entities+' ').indexOf(' '+F.entity+' ')>=0)
              && (!F.area    || c.dataset.area===F.area)
              && (!F.effort  || c.dataset.effort===F.effort)
              && (!F.ripe    || c.dataset.ripe==='1')
              && (!F.unblocked || (c.dataset.state!=='blocked'
                                && c.dataset.state!=='parked'));
        c.classList.toggle('hide', !ok);
        if(ok) shown++;
      });
      [].forEach.call(b.querySelectorAll('.bcol'),function(col){
        var vis=col.querySelectorAll('.bcard:not(.hide)').length;
        col.classList.toggle('empty', vis===0);
        var n=col.querySelector('h3 .n'); if(n) n.textContent=vis;
        var fold=col.querySelector('.bfold'), more=col.querySelector('.bmore');
        if(fold&&more){
          var hidden=fold.querySelectorAll('.bcard:not(.hide)').length;
          more.style.display = hidden ? '' : 'none';
          more.dataset.n = hidden;
          if(!fold.classList.contains('open')) more.textContent='+ '+hidden+' more';
        }
      });
    });
    var any=Object.keys(F).some(function(k){return F[k];});
    [].forEach.call(document.querySelectorAll('.bcount'),function(e){
      e.textContent = any ? (shown+' of '+total+' cards') : (total+' cards');});
  }
  document.addEventListener('change',function(ev){
    var sel=ev.target.closest('.bfilters select'); if(!sel) return;
    F[sel.dataset.f]=sel.value;
    sel.classList.toggle('set', !!sel.value);
    apply();
  });
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('.bchip'); if(!b) return;
    if(b.classList.contains('bclear')){
      Object.keys(F).forEach(function(k){F[k]='';});
      [].forEach.call(document.querySelectorAll('.bfilters select'),
        function(x){x.value=''; x.classList.remove('set');});
      [].forEach.call(document.querySelectorAll('.bchip[data-f]'),
        function(c){c.classList.remove('on');});
      return apply();
    }
    var f=b.dataset.f; if(f!=='ripe'&&f!=='unblocked') return;
    F[f]=F[f]?'':'1'; b.classList.toggle('on',!!F[f]);
    apply();
  });
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('.bmodes button'); if(b) mode(b.dataset.m);
  });
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('.bmore'); if(!b) return;
    var f=b.previousElementSibling, open=f.classList.toggle('open');
    b.textContent = open ? '– show less' : ('+ '+b.dataset.n+' more');
  });
  // --- phase-sequence detail -------------------------------------------
  var PH=window.__PHASES__||[], GL={done:'\u2705',in_progress:'\U0001F504',
    todo:'\u2b1c',paused:'\u23f8','n/a':'\u2014'};
  function esc(t){var d=document.createElement('div');d.textContent=t==null?'':t;
    return d.innerHTML;}
  function showPhase(i){
    var det=document.querySelector('.bseqdet'), p=PH[i]; if(!det||!p) return;
    var rail=Object.keys(p.cells||{}).map(function(k){
      var v=p.cells[k], owed=(v==='todo'||v==='in_progress');
      return '<span class="'+(owed?'owed':'')+'">'+(GL[v]||'\u2b1c')+
             '<i>'+esc(k)+'</i></span>';}).join('');
    var tags=[];
    if(p.tier) tags.push('<span class="bc-area">tier '+esc(p.tier)+'</span>');
    if(p.complexity) tags.push('<span class="bc-area">'+esc(p.complexity)+'</span>');
    (p.types||[]).forEach(function(t){
      tags.push('<span class="bc-area">'+esc(t)+'</span>');});
    tags.push('<span class="bc-'+(p.owes&&p.owes.length?'gate':'ripe')+'">'+
      (p.owes&&p.owes.length ? 'owes '+p.owes.join(', ') : 'complete')+'</span>');
    det.innerHTML='<div class="bsdhead"><b>'+esc(p.id)+' — '+esc(p.name)+'</b>'+
      '<button class="bsdx" aria-label="close">\u00d7</button></div>'+
      '<div class="bsdtags">'+tags.join('')+'</div>'+
      (p.desc?'<p>'+esc(p.desc)+'</p>':'')+
      '<div class="bc-rail">'+rail+'</div>';
    det.hidden=false;
    [].forEach.call(document.querySelectorAll('.ph'),function(b){
      b.classList.toggle('on', +b.dataset.i===i);});
  }
  function hidePhase(){
    var det=document.querySelector('.bseqdet'); if(det) det.hidden=true;
    [].forEach.call(document.querySelectorAll('.ph'),function(b){
      b.classList.remove('on');});
  }
  document.addEventListener('click',function(ev){
    if(ev.target.closest('.bsdx')) return hidePhase();
    var b=ev.target.closest('.ph'); if(!b) return;
    if(b.classList.contains('on')) return hidePhase();
    showPhase(+b.dataset.i);
  });
  document.addEventListener('keydown',function(ev){
    if(ev.key==='Escape') hidePhase();
  });

  var saved=null; try{saved=localStorage.getItem('gabe.board.mode');}catch(e){}
  mode(saved||'state');
})();
"""

PH_GLYPH = {"done": "\u2705", "inflight": "\U0001f504", "todo": "\u2b1c"}


def phase_strip():
    """Q3: the ONE thing the card board does not subsume. A card exists only
    while a phase still owes a cell, so finished phases leave no trace and the
    sequence vanishes. This strip keeps it — every phase, in order, done ones
    included."""
    seq = D.get("phase_seq") or []
    if not seq:
        return ""
    done = sum(1 for p in seq if p["state"] == "done")
    cur = next((p for p in seq if p["state"] == "inflight"), None) \
        or next((p for p in seq if p["state"] == "todo"), None)
    cells = "".join(
        f'<button class="ph ph-{p["state"]}" data-i="{i}" '
        f'title="{E(p["id"])} — {E(p["name"])}'
        + (f" · owes {E(', '.join(p['owes']))}" if p["owes"] else " · complete")
        + f'">{E(p["id"])}</button>' for i, p in enumerate(seq))
    return ('<div class="bseq"><div class="bseqhead">'
            f'<b>Phase sequence</b> <span>{done}/{len(seq)} complete'
            + (f' · now <b>{E(cur["id"])} {E(cur["name"][:44])}</b>' if cur else "")
            + ' · <i>click a phase for its detail</i></span></div>'
            f'<div class="bseqrail">{cells}</div>'
            '<div class="bseqdet" hidden></div></div>')


modebar = '<div class="bmodes">' + "".join(
    f'<button data-m="{m}"><span>{E(lab)}</span><i>{E(sub)}</i></button>'
    for m, lab, sub in MODES) + "</div>"

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Board lab · {E(D['project'])} Command Center</title>
<link rel="stylesheet" href="../assets/a3.css">
<script src="../assets/a3-settings.js" defer></script>
<style>{CSS}</style>
</head>
<body>
<div class="slotnotice"><b>BOARD LAB — DESIGN SPIKE, NOT A SHIPPED STATION</b> — every
card below is derived from {E(D['project'])}'s real committed data at HEAD
<code>{E(D['head'])}</code> ({E(D['generated'])}); nothing in the {E(D['project'])} repo
was modified to produce it. <b>{len(OPEN)} open</b> cards re-columned five ways, plus
<b>{len(DONE)} closed</b> ones under Done, newest first. The dropdowns filter across every
framing at once.</div>
<div class="app">
<aside class="side">
  <div class="brand">
    <span class="logo"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="9"/><rect x="14" y="7" width="3" height="5"/></svg></span>
    <span><b>{E(D['project'])}</b><small>Gabe Center</small></span>
  </div>
  <div class="navlabel">Now</div>
  <a class="navitem" href="../index.html">Overview</a>
  <div class="navlabel">Board</div>
  <a class="navitem on" href="#">Board lab <span class="count">{len(OPEN)}</span></a>
  <div class="navlabel">Tracks</div>
  {''.join(f'<a class="navitem" href="#" data-jump="{k}">{E(v[0])}'
           f'<span class="count">{bytr[k]}</span></a>' for k, v in TRACKS.items())}
  <div class="foot">lab build · HEAD {E(D['head'])}<br>cards from real {E(D['project'])} data</div>
</aside>
<main class="main">
  <div class="topbar">
    <div class="crumb"><a href="../index.html">Overview</a> › <b>Board lab</b></div>
    <div class="spacer"></div>
    <span class="stamp">{E(D['today'])}</span>
  </div>
  <div class="subject">
    <div class="subjecthead">
      <div class="pagehead">
        <h1>Board</h1>
        <p>Every open move in the project, on one surface — so "what's next?" is a
        <b>choice</b> instead of a question. {len(OPEN)} open cards from five tracks, each
        carrying what it costs, how long it has sat, and the command that starts it \u2014
        plus {len(DONE)} already closed, newest first, under <b>Done</b>.</p>
      </div>
      <div class="kpis">{kpis}</div>
    </div>
    <div class="bwrap">
      {phase_strip()}
      {modebar}
      {chipbar()}
      {''.join(board_html(m) for m, _, _ in MODES)}
    </div>
  </div>
</main>
</div>
<script>window.__PHASES__ = {json.dumps(D.get("phase_seq") or [])};</script>
<script>{JS}</script>
</body>
</html>
"""

OUT.write_text(page)
print(f"wrote {OUT} ({len(page):,} bytes, {len(CARDS)} cards)")
